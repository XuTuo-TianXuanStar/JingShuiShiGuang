(function runGuard() {
  "use strict";

  const GUARD_VERSION = "1.3.0";
  if (globalThis.__biliFocusGuardLoaded === GUARD_VERSION) return;
  globalThis.__biliFocusGuardLoaded = GUARD_VERSION;

  const ROOT_PENDING = "bf-guard-pending";
  const ROOT_BLOCKED = "bf-guard-blocked";
  const ROOT_COMMENT_ACTIVE = "bf-comment-mask-active";
  const COMMENT_HIDDEN_ATTR = "data-bf-comment-hidden";
  const COMMENT_SELECTORS = ["#commentapp", "#comment", "#comment-module", ".video-comments", "bili-comments"];
  let observer = null;
  let commentObserver = null;
  let commentMaskEnabled = false;
  let commentScanQueued = false;
  let ticker = null;
  let deadlineTimer = null;
  let lifecycleTimer = null;
  let runToken = 0;
  let lastUrl = location.href;
  let appearance = BiliFocus.cleanAppearance();
  let appearanceSeq = 0;
  let appearanceHintPromise = null;
  let lastBlock = null;
  const mediaStates = new Map();
  const maskedCommentRoots = new Set();

  clearStalePresentation();
  if (BiliFocus.isBilibiliUrl(location.href)) {
    document.documentElement.classList.add(ROOT_PENDING);
  }
  evaluatePage();

  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      evaluatePage();
    }
  }, 750);

  window.addEventListener("pageshow", queueLifecycleRecheck);
  window.addEventListener("focus", queueLifecycleRecheck);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) queueLifecycleRecheck();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.appearance) {
      appearanceSeq += 1;
      applyAppearanceValue(changes.appearance.newValue);
      if (lastBlock) {
        mountOverlay("blocked", lastBlock.state, lastBlock.allowlist, lastBlock.kind);
      } else if (document.documentElement.classList.contains(ROOT_PENDING)) {
        mountOverlay("checking");
      }
      return;
    }
    if (changes.focusState || changes.allowlist) evaluatePage();
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const action = message?.type || message?.msg;
    if (action === "recheckPage") {
      evaluatePage().then(() => sendResponse({ ok: true }));
      return true;
    }
    if (action === "EXTRACT_UPPER" || action === "EXTRACT_COLLECTION") {
      try {
        sendResponse(
          action === "EXTRACT_UPPER"
            ? extractUpperForAllowlist()
            : extractCollectionForAllowlist()
        );
      } catch (_error) {
        sendResponse({
          ok: false,
          error:
            action === "EXTRACT_UPPER"
              ? "当前页面未识别到 UP 主信息"
              : "当前页面未识别到合集或课程信息"
        });
      }
      return true;
    }
    return false;
  });

  async function evaluatePage() {
    const token = ++runToken;
    const appearanceSeqAtStart = appearanceSeq;
    const onBilibili = BiliFocus.isBilibiliUrl(location.href);
    if (onBilibili) {
      document.documentElement.classList.add(ROOT_PENDING);
    }

    // Read appearance straight from chrome.storage before mounting the first
    // overlay, so a slow service worker cannot paint noir and then jump themes.
    await ensureAppearanceHint();
    if (token !== runToken) return;
    if (onBilibili && !document.getElementById("bf-guard-host")) {
      mountOverlay("checking");
    }

    const result = await sendMessage({ type: "getData" });
    if (token !== runToken) return;
    if (!result?.ok) {
      syncCommentMask(BiliFocus.DEFAULT_STATE);
      allowPage();
      return;
    }

    // Do not let a slow getData reply roll a newer theme back.
    if (appearanceSeqAtStart === appearanceSeq) applyAppearanceValue(result.appearance);
    if (onBilibili) {
      if (document.documentElement.classList.contains(ROOT_PENDING)) mountOverlay("checking");
    }

    syncCommentMask(result.state);
    scheduleDeadlineRecheck(result.state);
    // Rest and the "break finished" pause release the guard; only an active
    // focus phase keeps unapproved pages blocked.
    if (!result.state?.active || result.state.phase !== "focus") {
      allowPage();
      return;
    }

    const allowlist = BiliFocus.cleanAllowlist(result.allowlist);
    if (!onBilibili) {
      if (BiliFocus.isSiteAllowed(location.href, allowlist.sites)) {
        allowPage();
        return;
      }
      blockPage(result.state, allowlist, "site");
      return;
    }

    if (BiliFocus.isBilibiliEntryAllowed(location.href)) {
      allowPage();
      return;
    }

    if (BiliFocus.isCourseAllowed(location.href, allowlist.courses)) {
      allowPage();
      return;
    }

    if (BiliFocus.isContentGroupAllowed(location.href, allowlist.groups)) {
      allowPage();
      return;
    }

    const spaceMid = BiliFocus.extractMid(location.href);
    if (spaceMid && allowlist.creators.some((creator) => creator.mid === spaceMid)) {
      allowPage();
      return;
    }

    const videoId = BiliFocus.extractVideoId(location.href);
    const groupRef = BiliFocus.extractContentGroupRef(location.href);
    if (videoId || (groupRef?.type === "cheese_ep" && allowlist.groups.length)) {
      const pageInfo = await sendMessage({ type: "resolvePageInfo", url: location.href, title: document.title });
      if (token !== runToken) return;
      if (pageInfo?.ok && pageInfo.creator && allowlist.creators.some((creator) => creator.mid === pageInfo.creator.mid)) {
        allowPage();
        return;
      }
      if (pageInfo?.ok && (pageInfo.groups || []).some((group) => BiliFocus.isGroupAllowed(group, allowlist.groups))) {
        allowPage();
        return;
      }
    }

    blockPage(result.state, allowlist, "bilibili");
  }

  function applyAppearanceValue(value) {
    appearance = BiliFocus.cleanAppearance(value);
    const requested =
      value && typeof value === "object" && typeof value.theme === "string" ? value.theme : appearance.theme;
    if (BiliFocus.isBilibiliUrl(location.href)) {
      BiliFocus.applyTheme(document.documentElement, requested, { colorScheme: false });
    }
  }

  function ensureAppearanceHint() {
    if (!appearanceHintPromise) {
      appearanceHintPromise = new Promise((resolve) => {
        let settled = false;
        const seqAtStart = appearanceSeq;
        const finish = (value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          // A storage change that landed while this read was in flight wins.
          if (seqAtStart === appearanceSeq) applyAppearanceValue(value);
          resolve();
        };
        const timer = setTimeout(() => finish(null), 600);
        try {
          chrome.storage.local.get("appearance", (stored) => {
            void chrome.runtime.lastError;
            finish(stored ? stored.appearance : null);
          });
        } catch (_error) {
          finish(null);
        }
      });
    }
    return appearanceHintPromise;
  }

  function allowPage() {
    lastBlock = null;
    document.documentElement.classList.remove(ROOT_PENDING, ROOT_BLOCKED);
    const host = document.getElementById("bf-guard-host");
    if (host) host.remove();
    if (observer) observer.disconnect();
    observer = null;
    if (ticker) clearInterval(ticker);
    ticker = null;
    restoreMedia();
  }

  function clearStalePresentation() {
    document.documentElement.classList.remove(ROOT_PENDING, ROOT_BLOCKED, ROOT_COMMENT_ACTIVE);
    document.getElementById("bf-guard-host")?.remove();
    document.getElementById("bf-comment-mask")?.remove();
    document.querySelectorAll(`[${COMMENT_HIDDEN_ATTR}]`).forEach((root) => {
      root.removeAttribute(COMMENT_HIDDEN_ATTR);
    });
  }

  function scheduleDeadlineRecheck(state) {
    if (deadlineTimer) clearTimeout(deadlineTimer);
    deadlineTimer = null;
    if (!state?.active || !Number(state.endAt)) return;
    const delay = Math.max(0, Number(state.endAt) - Date.now()) + 200;
    deadlineTimer = setTimeout(() => {
      deadlineTimer = null;
      evaluatePage();
    }, delay);
  }

  function queueLifecycleRecheck() {
    clearTimeout(lifecycleTimer);
    lifecycleTimer = setTimeout(evaluatePage, 120);
  }

  function blockPage(state, allowlist, kind) {
    document.documentElement.classList.remove(ROOT_PENDING);
    document.documentElement.classList.add(ROOT_BLOCKED);
    lastBlock = { state, allowlist, kind };
    pauseMedia();
    observer?.disconnect();
    observer = new MutationObserver(pauseMedia);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    mountOverlay("blocked", state, allowlist, kind);
  }

  function pauseMedia() {
    document.querySelectorAll("video, audio").forEach((media) => {
      if (!mediaStates.has(media)) mediaStates.set(media, { muted: media.muted });
      media.pause();
      media.muted = true;
    });
  }

  function restoreMedia() {
    mediaStates.forEach((previous, media) => {
      if (media.isConnected) media.muted = previous.muted;
    });
    mediaStates.clear();
  }

  function syncCommentMask(state) {
    const shouldHide = BiliFocus.shouldHideComments(location.href, state);
    if (!shouldHide) {
      clearCommentMask();
      return;
    }

    commentMaskEnabled = true;
    document.documentElement.classList.add(ROOT_COMMENT_ACTIVE);
    scheduleCommentScan();
    if (!commentObserver) {
      commentObserver = new MutationObserver(scheduleCommentScan);
      commentObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  function scheduleCommentScan() {
    if (!commentMaskEnabled || commentScanQueued) return;
    commentScanQueued = true;
    requestAnimationFrame(() => {
      commentScanQueued = false;
      maskCommentRoots();
    });
  }

  function maskCommentRoots() {
    if (!commentMaskEnabled) return;
    const candidates = [...new Set(
      COMMENT_SELECTORS.flatMap((selector) => [...document.querySelectorAll(selector)])
    )];
    const roots = candidates.filter(
      (candidate) => !candidates.some((other) => other !== candidate && other.contains(candidate))
    );
    if (!roots.length) return;

    roots.forEach((root) => {
      maskedCommentRoots.add(root);
      if (root.getAttribute(COMMENT_HIDDEN_ATTR) !== "true") {
        root.setAttribute(COMMENT_HIDDEN_ATTR, "true");
      }
    });

    let mask = document.getElementById("bf-comment-mask");
    if (!mask) {
      mask = document.createElement("section");
      mask.id = "bf-comment-mask";
      mask.setAttribute("role", "status");
      const title = document.createElement("strong");
      title.textContent = "评论区已遮蔽";
      const note = document.createElement("span");
      note.textContent = "可在静水拾光面板中切换显示方式";
      mask.append(title, note);
    }

    const primary = roots[0];
    if (primary.parentNode && (mask.parentNode !== primary.parentNode || mask.nextSibling !== primary)) {
      primary.before(mask);
    }
  }

  function clearCommentMask() {
    commentMaskEnabled = false;
    commentScanQueued = false;
    document.documentElement.classList.remove(ROOT_COMMENT_ACTIVE);
    commentObserver?.disconnect();
    commentObserver = null;
    maskedCommentRoots.forEach((root) => root.removeAttribute?.(COMMENT_HIDDEN_ATTR));
    maskedCommentRoots.clear();
    document.querySelectorAll(`[${COMMENT_HIDDEN_ATTR}]`).forEach((root) => {
      root.removeAttribute(COMMENT_HIDDEN_ATTR);
    });
    document.getElementById("bf-comment-mask")?.remove();
  }

  function mountOverlay(mode, state, allowlist, kind) {
    let host = document.getElementById("bf-guard-host");
    if (host && !host.shadowRoot) {
      host.remove();
      host = null;
    }
    if (!host) {
      host = document.createElement("div");
      host.id = "bf-guard-host";
      (document.body || document.documentElement).appendChild(host);
      host.attachShadow({ mode: "open" });
    }

    const shadow = host.shadowRoot;
    const theme = BiliFocus.themeById(appearance.theme);
    const logo = `<svg class="tomato" viewBox="0 0 512 512" fill="none" aria-hidden="true">
      <path d="M372.3 337.4A142 142 0 1 1 372.3 174.6" stroke="currentColor" stroke-width="38" stroke-linecap="round"></path>
      <circle cx="256" cy="256" r="30" fill="currentColor" fill-opacity=".55"></circle>
    </svg>`;
    if (mode === "checking") {
      if (ticker) clearInterval(ticker);
      ticker = null;
      shadow.innerHTML = `${styles(theme)}<main><section class="card checking"><div class="spinner"></div><p>正在检查专注白名单…</p></section></main>`;
      return;
    }

    const creatorNames = (allowlist.creators || []).map((item) => escapeHtml(item.name));
    const courseNames = (allowlist.courses || []).map((item) => escapeHtml(item.label));
    const groupNames = (allowlist.groups || []).map((item) => escapeHtml(item.label));
    const siteNames = (allowlist.sites || []).map((item) => escapeHtml(item.label));
    const chipNames = kind === "site" ? siteNames : [...creatorNames, ...groupNames, ...courseNames];
    const chips = chipNames
      .slice(0, 6)
      .map((name) => `<span>${name}</span>`)
      .join("");
    const eyebrow = kind === "site" ? "站外网站未放行" : "B 站内容未放行";
    const title = kind === "site" ? "这个网站不在允许列表里" : "这页不在本次允许列表里";
    const subtitle = kind === "site"
      ? "专注期间只能访问你允许的站外网站。倒计时结束后，这个页面会自动恢复。"
      : "先把注意力留给你选好的合集、课程和 UP 主。倒计时结束后，这个页面会自动恢复。";

    const countup = state.mode === "countup";
    shadow.innerHTML = `${styles(theme)}
      <main>
        <section class="card">
          ${logo}
          <p class="eyebrow">${eyebrow}</p>
          <h1>${title}</h1>
          <p class="sub">${subtitle}</p>
          <div class="clock" id="bf-clock">${BiliFocus.formatClock(BiliFocus.displayMs(state))}</div>
          ${chips ? `<div class="chips">${chips}</div>` : ""}
          <div class="actions">
            <button id="bf-back">返回上一页</button>
            <button class="secondary" id="bf-close">关闭此页</button>
          </div>
        </section>
      </main>`;

    shadow.getElementById("bf-back")?.addEventListener("click", () => history.back());
    shadow.getElementById("bf-close")?.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "closeCurrentTab" });
      window.close();
    });

    if (ticker) clearInterval(ticker);
    ticker = setInterval(() => {
      const shown = BiliFocus.displayMs(state);
      const clock = shadow.getElementById("bf-clock");
      if (clock) clock.textContent = BiliFocus.formatClock(shown);
      if (!countup && BiliFocus.remainingMs(state) <= 0) {
        clearInterval(ticker);
        ticker = null;
        evaluatePage();
      }
    }, 1000);
  }

  function styles(theme) {
    const vars = BiliFocus.themeCssVars(theme.id);
    const scheme = theme.dark ? "dark" : "light";
    return `<style>
      :host{all:initial;display:block;color-scheme:${scheme};${vars}font-family:Inter,"PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:var(--bf-text)}
      *{box-sizing:border-box}
      main{position:fixed;inset:0;display:grid;place-items:center;padding:28px;background:radial-gradient(circle at 50% 18%,var(--bf-overlay-glow) 0,transparent 52%),linear-gradient(160deg,var(--bf-bg) 0,var(--bf-bg-alt) 100%)}
      main:before{content:"";position:absolute;inset:0;opacity:.5;background-image:radial-gradient(var(--bf-dot) 1px,transparent 1px);background-size:22px 22px}
      .card{position:relative;width:min(520px,100%);padding:42px 44px 38px;text-align:center;background:var(--bf-surface);border:1px solid var(--bf-card-border);border-radius:28px;box-shadow:0 24px 70px var(--bf-shadow);backdrop-filter:blur(18px)}
      .checking{display:flex;align-items:center;justify-content:center;gap:14px;padding:28px}.checking p{margin:0;color:var(--bf-muted);font-size:15px}
      .spinner{width:20px;height:20px;border:2px solid var(--bf-track);border-top-color:var(--bf-accent);border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
      .tomato{display:block;width:82px;height:82px;margin:0 auto 18px;color:var(--bf-logo-accent,var(--bf-accent));filter:drop-shadow(0 12px 18px var(--bf-glow))}
      .eyebrow{margin:0 0 9px;color:var(--bf-accent-strong);font-size:13px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
      h1{margin:0;color:var(--bf-text);font-size:28px;line-height:1.25;letter-spacing:-.03em}
      .sub{max-width:420px;margin:15px auto 20px;color:var(--bf-muted);font-size:15px;line-height:1.75}
      .clock{font-variant-numeric:tabular-nums;font-size:48px;font-weight:760;line-height:1;color:var(--bf-text);letter-spacing:-.04em}
      .chips{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin:22px auto 0}.chips span{max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:7px 11px;border:1px solid var(--bf-border);border-radius:999px;background:var(--bf-surface-alt);color:var(--bf-muted);font-size:12px}
      .actions{display:flex;justify-content:center;gap:10px;margin-top:26px}
      button{appearance:none;border:0;border-radius:12px;padding:11px 18px;background:linear-gradient(135deg,var(--bf-primary),var(--bf-primary-strong));color:var(--bf-on-primary);font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 10px 22px var(--bf-primary-shadow);transition:.16s transform,.16s filter}
      button:hover{transform:translateY(-1px);filter:brightness(1.04)}
      button:focus-visible{outline:2px solid var(--bf-accent);outline-offset:2px}
      button.secondary{background:var(--bf-surface-alt);color:var(--bf-text-soft);box-shadow:none}
    </style>`;
  }

  function sendMessage(message) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (response, failed = false) => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        if (failed) {
          clearCommentMask();
          allowPage();
        }
        resolve(response);
      };
      const timeout = message?.type === "resolvePageInfo" ? 12000 : 3500;
      const watchdog = setTimeout(() => finish(null, true), timeout);
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            finish(null, true);
          } else {
            finish(response);
          }
        });
      } catch (_error) {
        finish(null, true);
      }
    });
  }

  /* ---------- Context-menu allowlist extraction (Bilibili only) ---------- */

  function extractUpperForAllowlist() {
    const state = readInitialState();
    const stateOwner = findStateOwner(state);
    const domOwner = findUpperInDom();
    const mid = isNumericId(stateOwner?.mid) ? String(stateOwner.mid) : domOwner.mid;
    if (!mid) {
      return { ok: false, error: "当前页面未识别到 UP 主信息" };
    }
    const name = cleanCreatorName(stateOwner?.name || domOwner.name) || `UID ${mid}`;
    return { ok: true, data: { mid, name } };
  }

  function extractCollectionForAllowlist() {
    const url = new URL(location.href);
    if (/\/cheese\/play\//i.test(url.pathname)) {
      return extractCourseForAllowlist(url);
    }

    const state = readInitialState();
    const stateGroup = findStateGroup(state);
    if (stateGroup) return { ok: true, data: stateGroup };

    const ref = BiliFocus.extractContentGroupRef(location.href);
    if (ref && ref.type !== "cheese_ep" && ref.type !== "cheese") {
      return {
        ok: true,
        data: {
          type: ref.type,
          id: String(ref.id),
          mid: ref.mid,
          label: pageGroupLabel() || `合集 ${ref.id}`
        }
      };
    }

    const domGroup = findGroupInDom();
    if (domGroup) return { ok: true, data: domGroup };

    return { ok: false, error: "当前页面未识别到合集或课程信息" };
  }

  function extractCourseForAllowlist(url) {
    const match = url.pathname.match(/\/cheese\/play\/(ss|ep)(\d{1,20})/i);
    if (!match) {
      return { ok: false, error: "当前页面未识别到合集或课程信息" };
    }
    const kind = match[1].toLowerCase();
    const numericId = match[2];
    const courseInfo = findCourseInfo(readInitialState());
    const title =
      cleanGroupLabel(courseInfo?.title) ||
      cleanPageTitle(document.title) ||
      `课程 ${numericId}`;
    const data = {
      kind: "course",
      courseId: `${kind}${numericId}`,
      id: `${kind}${numericId}`,
      title: title.slice(0, 60),
      pattern: `https://www.bilibili.com${url.pathname.replace(/\/+$/, "")}`,
      mode: kind === "ss" ? "prefix" : "exact"
    };
    if (courseInfo?.seasonId) data.seasonId = courseInfo.seasonId;
    return { ok: true, data };
  }

  function findCourseInfo(state) {
    if (!state || typeof state !== "object") return null;
    const candidates = [
      state.season,
      state.courseData,
      state.course,
      state.pugv,
      state.videoData,
      state.mediaInfo
    ];
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== "object") continue;
      const seasonId = pickId(candidate, ["season_id", "seasonId", "seasonID"]);
      const title = pickString(candidate, ["title", "season_title", "name"]);
      if (seasonId || title) return { seasonId, title };
    }
    return null;
  }

  function findStateOwner(state) {
    if (!state || typeof state !== "object") return null;
    const candidates = [
      state.videoData?.owner,
      state.videoInfo?.owner,
      state.video?.owner,
      state.owner,
      state.upData,
      state.upInfo,
      state.mediaInfo?.upper,
      state.mediaInfo?.owner,
      state.epInfo?.up_info,
      state.ugc_season?.owner
    ];
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== "object") continue;
      const mid = pickId(candidate, ["mid", "uid", "id", "up_mid"]);
      const name = pickString(candidate, ["name", "uname", "nickname", "author"]);
      if (mid) return { mid, name };
    }
    return null;
  }

  function findUpperInDom() {
    const selectors = [
      ".up-name",
      ".up-info--name",
      ".up-info__name",
      ".up-info .name",
      "#v_upinfo .up-name",
      ".video-info-meta .up-name",
      ".bili-video-card__info--author",
      ".username"
    ];
    let nameFallback = "";
    for (const selector of selectors) {
      for (const element of document.querySelectorAll(selector)) {
        const name = cleanCreatorName(element.textContent);
        const mid = findSpaceMid(element);
        if (mid) return { mid, name };
        if (!nameFallback && name) nameFallback = name;
      }
    }

    const spaceMid = BiliFocus.extractMid(location.href);
    if (spaceMid) {
      const name =
        cleanCreatorName(
          document.querySelector(".username, .nickname, .up-name, .h1")?.textContent
        ) || cleanPageTitle(document.title);
      return { mid: spaceMid, name };
    }

    if (nameFallback) {
      for (const anchor of document.querySelectorAll('a[href*="space.bilibili.com/"]')) {
        if (cleanCreatorName(anchor.textContent) === nameFallback) {
          const mid = findSpaceMid(anchor);
          if (mid) return { mid, name: nameFallback };
        }
      }
      const authorMeta = document.querySelector(
        'meta[itemprop="author"], meta[name="author"], meta[property="og:article:author"]'
      );
      const metaName = cleanCreatorName(authorMeta?.getAttribute("content"));
      if (metaName === nameFallback) {
        for (const anchor of document.querySelectorAll('a[href*="space.bilibili.com/"]')) {
          const mid = findSpaceMid(anchor);
          if (mid) return { mid, name: nameFallback };
        }
      }
    }
    return { mid: "", name: nameFallback };
  }

  function findSpaceMid(element) {
    let node = element;
    for (let depth = 0; node && depth < 5; depth += 1, node = node.parentElement) {
      for (const attribute of ["data-mid", "data-uid", "data-user-id"]) {
        const value = node.getAttribute?.(attribute);
        if (isNumericId(value)) return String(value);
      }
      const href = node.getAttribute?.("href") || node.href || "";
      const match = String(href).match(/space\.bilibili\.com\/(\d{1,20})/i);
      if (match) return match[1];
    }
    const anchor = element.querySelector?.('a[href*="space.bilibili.com/"]');
    if (anchor) {
      const match = String(anchor.getAttribute("href") || "").match(
        /space\.bilibili\.com\/(\d{1,20})/i
      );
      if (match) return match[1];
    }
    return "";
  }

  function findStateGroup(state) {
    if (!state || typeof state !== "object") return null;
    const candidates = [
      state.ugc_season,
      state.videoData?.ugc_season,
      state.videoInfo?.ugc_season,
      state.video?.ugc_season,
      state.season,
      state.videoData?.season,
      state.mediaInfo?.ugc_season
    ];
    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== "object") continue;
      const id = pickId(candidate, ["id", "season_id", "seasonId", "seasonID"]);
      if (!id) continue;
      const type = candidate.type === "series" ? "series" : "ugc_season";
      const mid =
        pickId(candidate, ["mid", "up_mid", "uid"]) ||
        pickId(state.videoData?.owner || state.owner, ["mid", "uid", "id"]);
      const label = cleanGroupLabel(pickString(candidate, ["title", "name", "season_title"]));
      const data = { type, id, label: label || `合集 ${id}` };
      if (mid) data.mid = mid;
      return data;
    }
    return null;
  }

  function findGroupInDom() {
    const selectors = [
      ".video-season-list a[href*='/lists/']",
      ".ugc-season-list a[href*='/lists/']",
      ".collection-list a[href]",
      "a[href*='/lists/']",
      "a[href*='collectiondetail']",
      "a[href*='seriesdetail']"
    ];
    for (const selector of selectors) {
      for (const anchor of document.querySelectorAll(selector)) {
        let ref;
        try {
          ref = BiliFocus.extractContentGroupRef(
            new URL(anchor.getAttribute("href") || "", location.href).href
          );
        } catch (_error) {
          continue;
        }
        if (!ref || ref.type === "cheese_ep" || ref.type === "cheese") continue;
        const label =
          cleanGroupLabel(anchor.textContent) ||
          cleanPageTitle(document.title) ||
          `合集 ${ref.id}`;
        const data = { type: ref.type, id: String(ref.id), label: label.slice(0, 60) };
        if (ref.mid) data.mid = String(ref.mid);
        return data;
      }
    }
    return null;
  }

  function readInitialState() {
    try {
      if (globalThis.__INITIAL_STATE__ && typeof globalThis.__INITIAL_STATE__ === "object") {
        return globalThis.__INITIAL_STATE__;
      }
    } catch (_error) {
      // Isolated worlds usually cannot see page globals; parse the inline script.
    }

    for (const script of document.querySelectorAll("script:not([src])")) {
      const text = script.textContent || "";
      const marker = text.indexOf("__INITIAL_STATE__");
      if (marker < 0) continue;
      const equals = text.indexOf("=", marker);
      if (equals < 0) continue;
      let start = -1;
      for (let index = equals + 1; index < text.length; index += 1) {
        if (text[index] === "{") {
          start = index;
          break;
        }
        if (!/\s/.test(text[index])) break;
      }
      if (start < 0) continue;
      const jsonText = sliceJsonObject(text, start);
      if (!jsonText) continue;
      try {
        return JSON.parse(jsonText);
      } catch (_error) {
        try {
          return JSON.parse(
            jsonText.replace(/:\s*undefined\b/g, ":null").replace(/,\s*undefined\b/g, ",null")
          );
        } catch (_ignored) {
          // Try the next inline state script.
        }
      }
    }
    return null;
  }

  function sliceJsonObject(text, start) {
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < text.length; index += 1) {
      const char = text[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) return text.slice(start, index + 1);
      }
    }
    return "";
  }

  function pageGroupLabel() {
    const element = document.querySelector(
      ".video-season-title, .collection-title, .season-title, .ugc-season-title, h1"
    );
    return cleanGroupLabel(element?.textContent) || cleanPageTitle(document.title);
  }

  function cleanCreatorName(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/^UP\s*主\s*[:：]?/i, "")
      .trim()
      .slice(0, 40);
  }

  function cleanGroupLabel(value) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 60);
  }

  function cleanPageTitle(value) {
    return String(value || "")
      .replace(/\s*[-_|]\s*哔哩哔哩.*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function pickId(source, keys) {
    for (const key of keys) {
      const value = source?.[key];
      if (isNumericId(value)) return String(value);
    }
    return "";
  }

  function pickString(source, keys) {
    for (const key of keys) {
      const value = source?.[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  }

  function isNumericId(value) {
    return /^\d{1,20}$/.test(String(value || ""));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
