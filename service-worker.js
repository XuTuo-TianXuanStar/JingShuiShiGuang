importScripts("shared.js");

const STATE_KEY = "focusState";
const ALLOWLIST_KEY = "allowlist";
const APPEARANCE_KEY = "appearance";
const SCHEDULES_KEY = "schedules";
const SCHEDULE_STATE_KEY = "scheduleState";
const TIMER_CONFIG_KEY = "timerConfig";
const SESSIONS_KEY = "focusSessions";
const TODOS_KEY = "todos";
const TODO_REMINDER_KEY = "todoReminderState";
const SCHEMA_VERSION_KEY = "schemaVersion";
const SCHEMA_VERSION = 2;
const ALARM_NAME = "focus-end";
const BADGE_ALARM = "focus-badge-tick";
const SCHEDULE_ALARM = "schedule-tick";
const TODO_ALARM = "todo-reminder-tick";
const SERIES_CACHE_TTL = 15 * 60 * 1000;
const seriesMemberCache = new Map();
const CONTEXT_MENU_UPPER = "bf-add-current-upper";
const CONTEXT_MENU_COLLECTION = "bf-add-current-collection";
const BILIBILI_DOCUMENT_PATTERNS = ["*://*.bilibili.com/*"];
let stateLock = Promise.resolve();

chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    await createBilibiliContextMenus();
  } catch (error) {
    console.error("[BiliFocus] 右键菜单创建失败", error);
  }
  try {
    await migrateStorage(details);
  } catch (error) {
    console.error("[BiliFocus] 数据迁移失败，将在下次启动重试", error);
  }
  await refreshFocusLifecycle();
  await ensureScheduleTicker();
  await runSchedules();
  await ensureTodoReminderTicker();
  await runTodoReminders();
  await ensureGuardsOnOpenTabs();
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    await migrateStorage();
  } catch (error) {
    console.error("[BiliFocus] 数据迁移失败，将在下次启动重试", error);
  }
  await refreshFocusLifecycle();
  await ensureScheduleTicker();
  await runSchedules();
  await ensureTodoReminderTicker();
  await runTodoReminders();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await finishIfExpired();
    return;
  }
  if (alarm.name === BADGE_ALARM) {
    await refreshBadge();
    return;
  }
  if (alarm.name === SCHEDULE_ALARM) {
    await runSchedules();
    return;
  }
  if (alarm.name === TODO_ALARM) {
    await runTodoReminders();
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  handleContextMenuClick(info, tab).catch((error) => {
    console.error("[BiliFocus] 右键加入白名单失败", error);
  });
});

async function createBilibiliContextMenus() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: CONTEXT_MENU_UPPER,
    title: "将当前UP主加入白名单",
    contexts: ["all"],
    documentUrlPatterns: BILIBILI_DOCUMENT_PATTERNS
  });
  chrome.contextMenus.create({
    id: CONTEXT_MENU_COLLECTION,
    title: "将当前合集/课程加入白名单",
    contexts: ["all"],
    documentUrlPatterns: BILIBILI_DOCUMENT_PATTERNS
  });
}

async function handleContextMenuClick(info, tab) {
  const isUpper = info.menuItemId === CONTEXT_MENU_UPPER;
  const isCollection = info.menuItemId === CONTEXT_MENU_COLLECTION;
  if ((!isUpper && !isCollection) || !tab?.id) return;

  const message = { type: isUpper ? "EXTRACT_UPPER" : "EXTRACT_COLLECTION" };
  let result = null;
  try {
    result = await sendExtractionMessage(tab.id, message);
  } catch (error) {
    console.error("[BiliFocus] 页面数据提取失败", error);
  }

  if (!result?.ok || !result.data) {
    await showAllowlistToast(tab.id, "添加失败：当前页面未识别到 UP 主/合集信息", true);
    return;
  }

  let saved = null;
  try {
    saved = isUpper
      ? await appendCreatorToAllowlist(result.data)
      : await appendCollectionToAllowlist(result.data);
  } catch (error) {
    console.error("[BiliFocus] 保存白名单失败", error);
  }
  if (!saved?.ok) {
    await showAllowlistToast(tab.id, "添加失败：当前页面未识别到 UP 主/合集信息", true);
    return;
  }
  await showAllowlistToast(tab.id, "已加入白名单", false);
}

async function sendExtractionMessage(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (_error) {
    // A tab opened before the extension was reloaded has no content script yet.
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["content.css"] });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["shared.js", "content.js"]
    });
    return chrome.tabs.sendMessage(tabId, message);
  }
}

async function appendCreatorToAllowlist(data) {
  const mid = String(data?.mid || "");
  if (!/^\d{1,20}$/.test(mid)) return { ok: false, error: "UP 主信息不完整" };
  const name = String(data?.name || `UID ${mid}`).trim().slice(0, 40) || `UID ${mid}`;
  const stored = await chrome.storage.local.get(ALLOWLIST_KEY);
  const allowlist = BiliFocus.cleanAllowlist(stored[ALLOWLIST_KEY]);
  if (!allowlist.creators.some((creator) => creator.mid === mid)) {
    allowlist.creators.push({ mid, name });
  }
  await chrome.storage.local.set({ [ALLOWLIST_KEY]: allowlist });
  return { ok: true, allowlist };
}

async function appendCollectionToAllowlist(data) {
  const stored = await chrome.storage.local.get(ALLOWLIST_KEY);
  const allowlist = BiliFocus.cleanAllowlist(stored[ALLOWLIST_KEY]);

  if (data?.kind === "course" || data?.courseId) {
    let course;
    try {
      course = BiliFocus.normalizeCourseRule(
        data.pattern,
        String(data.title || data.label || "课程")
      );
    } catch (_error) {
      return { ok: false, error: "课程链接不正确" };
    }
    course.mode = data.mode === "prefix" ? "prefix" : "exact";
    if (!allowlist.courses.some((item) => item.pattern === course.pattern)) {
      allowlist.courses.push(course);
    }
  } else {
    const rule = BiliFocus.cleanGroupRule(data);
    if (!rule) return { ok: false, error: "合集信息不完整" };
    const key = BiliFocus.groupKey(rule);
    if (!allowlist.groups.some((item) => BiliFocus.groupKey(item) === key)) {
      allowlist.groups.push(rule);
    }
  }

  await chrome.storage.local.set({ [ALLOWLIST_KEY]: allowlist });
  return { ok: true, allowlist };
}

async function showAllowlistToast(tabId, message, isError) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (text, errorTone) => {
        const existing = document.getElementById("bf-allowlist-toast");
        if (existing) existing.remove();
        const toast = document.createElement("div");
        toast.id = "bf-allowlist-toast";
        toast.setAttribute("role", "status");
        toast.textContent = text;
        toast.dataset.tone = errorTone ? "error" : "success";
        toast.dataset.show = "false";
        document.documentElement.appendChild(toast);
        requestAnimationFrame(() => {
          toast.dataset.show = "true";
        });
        setTimeout(() => {
          toast.dataset.show = "false";
          setTimeout(() => toast.remove(), 220);
        }, 2600);
      },
      args: [message, Boolean(isError)]
    });
  } catch (_error) {
    // The tab may have navigated to a restricted page; nothing to show there.
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.focusState || changes.allowlist) {
    refreshFocusLifecycle();
    return;
  }
  if (changes.appearance) refreshBadge();
  if (changes.schedules) ensureScheduleTicker();
  if (changes.todos) ensureTodoReminderTicker();
});

async function migrateStorage(details) {
  const stored = await chrome.storage.local.get([
    SCHEMA_VERSION_KEY,
    STATE_KEY,
    ALLOWLIST_KEY,
    APPEARANCE_KEY,
    SCHEDULES_KEY,
    SCHEDULE_STATE_KEY,
    TIMER_CONFIG_KEY,
    SESSIONS_KEY,
    TODOS_KEY,
    TODO_REMINDER_KEY
  ]);
  const version = Number(stored[SCHEMA_VERSION_KEY]) || 0;
  if (version >= SCHEMA_VERSION) return false;

  const updates = {};
  const state = stored[STATE_KEY] ? BiliFocus.cleanState(stored[STATE_KEY]) : BiliFocus.cleanState(null);
  if (!stored[STATE_KEY]) updates[STATE_KEY] = { ...BiliFocus.DEFAULT_STATE };
  if (!stored[ALLOWLIST_KEY]) {
    updates[ALLOWLIST_KEY] = { creators: [], courses: [], groups: [], sites: [] };
  }
  if (!stored[SCHEDULES_KEY]) updates[SCHEDULES_KEY] = [];
  if (!stored[SCHEDULE_STATE_KEY]) updates[SCHEDULE_STATE_KEY] = { lastKeys: {} };

  const rawAppearance =
    stored[APPEARANCE_KEY] && typeof stored[APPEARANCE_KEY] === "object" ? stored[APPEARANCE_KEY] : {};
  const appearance = { ...BiliFocus.DEFAULT_APPEARANCE, ...rawAppearance };
  appearance.theme =
    typeof appearance.theme === "string" && appearance.theme
      ? appearance.theme
      : BiliFocus.DEFAULT_APPEARANCE.theme;
  appearance.timerStyle = BiliFocus.TIMER_STYLES.includes(appearance.timerStyle)
    ? appearance.timerStyle
    : BiliFocus.DEFAULT_APPEARANCE.timerStyle;
  appearance.reducedMotion = appearance.reducedMotion === true;
  updates[APPEARANCE_KEY] = appearance;

  updates[TIMER_CONFIG_KEY] = stored[TIMER_CONFIG_KEY]
    ? BiliFocus.cleanTimerConfig(stored[TIMER_CONFIG_KEY])
    : details?.reason === "install"
      ? { ...BiliFocus.DEFAULT_TIMER_CONFIG }
      : timerConfigFromState(state);

  const todos = BiliFocus.cleanTodos(stored[TODOS_KEY]);
  const reminderState = BiliFocus.cleanTodoReminderState(stored[TODO_REMINDER_KEY]);
  todos.forEach((todo) => {
    if (todo.lastReminderKey && !reminderState.lastKeys[todo.id]) {
      reminderState.lastKeys[todo.id] = todo.lastReminderKey;
    }
  });
  updates[TODOS_KEY] = todos;
  updates[TODO_REMINDER_KEY] = reminderState;
  updates[SESSIONS_KEY] = stored[SESSIONS_KEY]
    ? BiliFocus.cleanSessions(stored[SESSIONS_KEY])
    : [];

  // Version is written in the same atomic set as the migrated data: if the
  // write fails, the old version stays behind and the next startup retries.
  updates[SCHEMA_VERSION_KEY] = SCHEMA_VERSION;
  await chrome.storage.local.set(updates);
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => sendResponse({ ok: false, error: error.message || "操作失败" }));
  return true;
});

async function handleMessage(message, sender) {
  switch (message?.type) {
    case "getData":
      return getData();
    case "getSessions":
      return getSessions(message);
    case "startFocus":
      return startFocus(message);
    case "stopFocus":
      return stopFocus();
    case "savePreferences":
      return savePreferences(message);
    case "saveCommentMode":
      return saveCommentMode(message.mode);
    case "saveAllowlist":
      return saveAllowlist(message.allowlist);
    case "saveAppearance":
      return saveAppearance(message.appearance);
    case "saveTimerConfig":
      return saveTimerConfig(message.timerConfig);
    case "saveSchedules":
      return saveSchedules(message.schedules);
    case "saveTodos":
      return saveTodos(message.todos);
    case "ackTodoReminders":
      return ackTodoReminders();
    case "skipBreak":
      return skipBreak();
    case "continueFocus":
      return continueFocus();
    case "resolveCreator":
      return resolveCreator(message.url);
    case "resolvePageInfo":
      return resolvePageInfo(message.url, message.title);
    case "resolveContentGroup":
      return resolveContentGroup(message.url, message.title);
    case "finishIfExpired":
      return finishIfExpired();
    case "closeCurrentTab":
      if (sender?.tab?.id) await chrome.tabs.remove(sender.tab.id);
      return { ok: true };
    default:
      return { ok: false, error: "未知操作" };
  }
}

async function getData() {
  await finishIfExpired();
  const stored = await chrome.storage.local.get([
    STATE_KEY,
    ALLOWLIST_KEY,
    APPEARANCE_KEY,
    SCHEDULES_KEY,
    TIMER_CONFIG_KEY,
    SESSIONS_KEY,
    TODOS_KEY
  ]);
  const state = BiliFocus.cleanState(stored[STATE_KEY]);
  const timerConfig = await ensureTimerConfig(state, stored[TIMER_CONFIG_KEY]);
  const sessions = BiliFocus.cleanSessions(stored[SESSIONS_KEY]);
  const todos = BiliFocus.cleanTodos(stored[TODOS_KEY]);
  const todoReminders = BiliFocus.collectDueTodoReminders(todos, new Date()).map(
    (item) => item.todo.title
  );
  return {
    ok: true,
    state,
    timerConfig,
    allowlist: BiliFocus.cleanAllowlist(stored[ALLOWLIST_KEY]),
    // Hand back the raw object so the popup can spot an unknown theme id and
    // repair it; every caller runs its own cleaner before using the values.
    appearance:
      stored[APPEARANCE_KEY] && typeof stored[APPEARANCE_KEY] === "object"
        ? stored[APPEARANCE_KEY]
        : null,
    schedules: BiliFocus.cleanSchedules(stored[SCHEDULES_KEY]),
    // The popup only needs the latest handful for its first paint; the calendar
    // asks for a specific month through getSessions.
    sessions: sessions.slice(0, 50),
    todos,
    todoReminders: [...new Set(todoReminders)]
  };
}

async function getSessions(message) {
  const stored = await chrome.storage.local.get(SESSIONS_KEY);
  const sessions = BiliFocus.cleanSessions(stored[SESSIONS_KEY]);
  const month = String(message?.month || "");
  if (/^\d{4}-\d{2}$/.test(month)) {
    const filtered = sessions.filter((session) => session.dateKey.startsWith(`${month}-`));
    return { ok: true, sessions: filtered, total: filtered.length };
  }
  return { ok: true, sessions: sessions.slice(0, 50), total: sessions.length };
}

function timerConfigFromState(state) {
  const focus = Math.min(
    240,
    Math.max(1, Math.round(Number(state?.durationMinutes) || 25))
  );
  // Upgrade path: keep the old one-shot countdown behaviour until the user
  // deliberately enables breaks or a larger total.
  return {
    mode: "countdown",
    totalFocusMinutes: focus,
    focusMinutes: focus,
    breakMinutes: 0,
    breakEndPopup: false,
    breakSkippable: true
  };
}

async function ensureTimerConfig(state, storedValue) {
  if (storedValue && typeof storedValue === "object") {
    return BiliFocus.cleanTimerConfig(storedValue);
  }
  const timerConfig = timerConfigFromState(state);
  await chrome.storage.local.set({ [TIMER_CONFIG_KEY]: timerConfig });
  return timerConfig;
}

function withStateLock(operation) {
  const run = stateLock.catch(() => {}).then(operation);
  stateLock = run.catch(() => {});
  return run;
}

function makeSessionId() {
  try {
    if (crypto && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID().slice(0, 64);
    }
  } catch (_error) {
    // Fall through to the timestamp id.
  }
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.slice(0, 64);
}

async function startFocus(message) {
  await finishIfExpired();
  return withStateLock(() => startFocusInner(message));
}

async function startFocusInner(message) {
  const stored = await chrome.storage.local.get([
    STATE_KEY,
    ALLOWLIST_KEY,
    TIMER_CONFIG_KEY,
    TODOS_KEY
  ]);
  const current = BiliFocus.cleanState(stored[STATE_KEY]);
  if (current.active) return { ok: false, error: "专注倒计时已经开始" };

  const allowlist = BiliFocus.cleanAllowlist(stored[ALLOWLIST_KEY]);
  if (!allowlist.creators.length && !allowlist.courses.length && !allowlist.groups.length && !allowlist.sites.length) {
    return { ok: false, error: "请先添加至少一个 UP 主、合集、课程或站外网站" };
  }

  const config = await ensureTimerConfig(current, stored[TIMER_CONFIG_KEY]);
  const mode =
    message?.mode === "countup" || message?.mode === "countdown"
      ? message.mode
      : config.mode;
  const requestedMinutes = Number(message?.minutes);
  const focusMinutes = Math.min(
    240,
    Math.max(
      1,
      Number.isFinite(requestedMinutes) ? Math.round(requestedMinutes) : config.focusMinutes
    )
  );
  const totalFocusMinutes = Math.max(config.totalFocusMinutes, focusMinutes);
  const countup = mode === "countup";
  const strict = countup ? false : message?.strict !== false;
  const startedAt = Date.now();
  const requestedTaskId = String(message?.taskId || "").slice(0, 64);
  const task = requestedTaskId
    ? BiliFocus.cleanTodos(stored[TODOS_KEY]).find(
        (todo) =>
          todo.id === requestedTaskId && BiliFocus.isTodoAvailableForFocus(todo, new Date(startedAt))
      )
    : null;
  const state = {
    active: true,
    mode: countup ? "countup" : "countdown",
    phase: "focus",
    startedAt,
    phaseStartedAt: startedAt,
    endAt: countup ? 0 : startedAt + focusMinutes * 60000,
    durationMinutes: focusMinutes,
    focusMinutes,
    totalFocusMinutes,
    breakMinutes: countup ? 0 : config.breakMinutes,
    sessionFocusMs: 0,
    cycles: 0,
    sessionId: makeSessionId(),
    taskId: task ? task.id : "",
    breakEndPopup: config.breakEndPopup,
    breakSkippable: config.breakSkippable,
    strict,
    commentMode: current.commentMode,
    auto: false
  };
  await commitState(state);
  return { ok: true, state };
}

async function stopFocus() {
  await finishIfExpired();
  return withStateLock(() => stopFocusInner());
}

async function stopFocusInner() {
  const stored = await chrome.storage.local.get(STATE_KEY);
  const state = BiliFocus.cleanState(stored[STATE_KEY]);
  if (!state.active) return { ok: true, state };
  if (state.strict && state.phase === "focus") {
    return { ok: false, error: "严格模式下需等待倒计时结束" };
  }

  const now = Date.now();
  const focusMs = state.phase === "focus" ? currentFocusBlockMs(state, now) : 0;
  const next = finishState(state, now, "stopped", focusMs);
  await commitState(next);
  return { ok: true, state: next };
}

function currentFocusBlockMs(state, now) {
  const anchor = Number(state.phaseStartedAt) || Number(state.startedAt) || now;
  const plannedEnd = state.mode === "countup" ? now : Number(state.endAt) || now;
  return Math.max(0, Math.min(now, plannedEnd) - anchor);
}

function startNextFocusState(state, now) {
  const totalMs = state.totalFocusMinutes * 60000;
  const remaining = totalMs - state.sessionFocusMs;
  if (remaining < 1000) return null;
  const blockMs = Math.min(state.focusMinutes * 60000, remaining);
  return {
    ...state,
    active: true,
    phase: "focus",
    phaseStartedAt: now,
    endAt: now + blockMs,
    breakEndedAt: 0,
    breakNotifiedAt: 0
  };
}

function finishState(state, now, reason, focusMsToAdd) {
  return {
    ...state,
    active: false,
    phase: "focus",
    endAt: 0,
    sessionFocusMs: Math.max(0, state.sessionFocusMs + Math.max(0, focusMsToAdd)),
    endedAt: now,
    endReason: reason,
    breakEndedAt: 0
  };
}

function buildSessionRecord(state, taskTitle = "") {
  const endReasons = ["completed", "stopped", "breakEnded", "replaced", "error"];
  if (!state || state.active || !state.endedAt || !endReasons.includes(state.endReason)) return null;
  const focusMs = Math.max(0, Math.round(Number(state.sessionFocusMs) || 0));
  if (focusMs < 1000) return null;
  const startedAt = Number(state.startedAt) || Number(state.phaseStartedAt) || 0;
  if (!startedAt) return null;
  const mode = state.mode === "countup" ? "countup" : "countdown";
  const id = String(state.sessionId || `legacy-${startedAt}`).slice(0, 64);
  const record = {
    id,
    dateKey: BiliFocus.dateKey(new Date(startedAt)),
    startedAt,
    endedAt: Math.max(startedAt, Number(state.endedAt) || 0),
    focusMs,
    mode,
    source: state.auto ? "schedule" : "manual",
    taskId: String(state.taskId || "").slice(0, 64),
    taskTitle: String(taskTitle || state.taskTitle || "").trim().slice(0, 80),
    plannedMinutes:
      mode === "countup"
        ? 0
        : Math.min(480, Math.max(0, Math.round(Number(state.totalFocusMinutes) || 0))),
    completed: state.endReason === "completed",
    endReason: state.endReason,
    cycles: Math.min(9999, Math.max(0, Math.floor(Number(state.cycles) || 0)))
  };
  if (state.scheduleId) record.scheduleId = String(state.scheduleId).slice(0, 64);
  return record;
}

async function commitState(next) {
  const update = { [STATE_KEY]: next };
  const draft = buildSessionRecord(next);
  if (draft) {
    // Re-read before writing: stopFocus and finishIfExpired can race, and the
    // same session must never produce two records.
    const stored = await chrome.storage.local.get([SESSIONS_KEY, TODOS_KEY]);
    const sessions = BiliFocus.cleanSessions(stored[SESSIONS_KEY]);
    const task = next.taskId
      ? BiliFocus.cleanTodos(stored[TODOS_KEY]).find((todo) => todo.id === next.taskId)
      : null;
    const session = buildSessionRecord(next, task ? task.title : "");
    if (session && !sessions.some((item) => item.id === session.id)) {
      update[SESSIONS_KEY] = BiliFocus.cleanSessions([session, ...sessions]);
    }
  }
  await chrome.storage.local.set(update);
  await syncRuntime(next);
  kickGuards();
  return next;
}

function kickGuards() {
  ensureGuardsOnOpenTabs().catch(() => {});
}

async function savePreferences(message) {
  return withStateLock(async () => {
    const minutes = Number(message?.minutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 240) {
      return { ok: false, error: "专注时长需为 1–240 分钟" };
    }

    const stored = await chrome.storage.local.get(STATE_KEY);
    const state = BiliFocus.cleanState(stored[STATE_KEY]);
    if (state.active) {
      return { ok: false, error: "专注进行中不能修改计时设置" };
    }

    const next = {
      ...state,
      active: false,
      phase: "focus",
      startedAt: 0,
      phaseStartedAt: 0,
      endAt: 0,
      durationMinutes: minutes,
      strict: message?.strict !== false
    };
    await chrome.storage.local.set({ [STATE_KEY]: next });
    return { ok: true, state: next };
  });
}

async function saveTimerConfig(value) {
  return withStateLock(async () => {
    const stored = await chrome.storage.local.get([STATE_KEY, TIMER_CONFIG_KEY]);
    const state = BiliFocus.cleanState(stored[STATE_KEY]);
    const current = stored[TIMER_CONFIG_KEY]
      ? BiliFocus.cleanTimerConfig(stored[TIMER_CONFIG_KEY])
      : timerConfigFromState(state);
    const patch = value && typeof value === "object" ? value : {};
    const timerConfig = BiliFocus.cleanTimerConfig({ ...current, ...patch });
    await chrome.storage.local.set({ [TIMER_CONFIG_KEY]: timerConfig });
    return { ok: true, timerConfig };
  });
}

async function skipBreak() {
  return withStateLock(async () => {
    const stored = await chrome.storage.local.get(STATE_KEY);
    const state = BiliFocus.cleanState(stored[STATE_KEY]);
    if (!state.active || (state.phase !== "break" && state.phase !== "breakEnded")) {
      return { ok: true, state };
    }
    if (state.phase === "break" && state.breakSkippable === false) {
      return { ok: false, error: "本次休息不可跳过" };
    }
    return advanceFromBreak(state);
  });
}

async function continueFocus() {
  return withStateLock(async () => {
    const stored = await chrome.storage.local.get(STATE_KEY);
    const state = BiliFocus.cleanState(stored[STATE_KEY]);
    if (!state.active || state.phase !== "breakEnded") {
      return { ok: true, state };
    }
    return advanceFromBreak(state);
  });
}

async function advanceFromBreak(state) {
  const now = Date.now();
  const next = startNextFocusState(state, now);
  if (!next) {
    const done = finishState(state, now, "completed", 0);
    await commitState(done);
    return { ok: true, state: done };
  }
  await commitState(next);
  return { ok: true, state: next };
}

async function saveCommentMode(value) {
  const stored = await chrome.storage.local.get(STATE_KEY);
  const state = BiliFocus.cleanState(stored[STATE_KEY]);
  const next = { ...state, commentMode: BiliFocus.cleanCommentMode(value) };
  await chrome.storage.local.set({ [STATE_KEY]: next });
  await ensureGuardsOnOpenTabs();
  return { ok: true, state: next };
}

async function saveAllowlist(value) {
  const stored = await chrome.storage.local.get(STATE_KEY);
  const state = BiliFocus.cleanState(stored[STATE_KEY]);
  if (state.active && state.strict) {
    return { ok: false, error: "严格模式倒计时期间不能修改允许列表" };
  }

  const allowlist = BiliFocus.cleanAllowlist(value);
  await chrome.storage.local.set({ [ALLOWLIST_KEY]: allowlist });
  if (state.active) await ensureGuardsOnOpenTabs();
  return { ok: true, allowlist };
}

async function saveAppearance(value) {
  const stored = await chrome.storage.local.get(APPEARANCE_KEY);
  const current = BiliFocus.cleanAppearance(stored[APPEARANCE_KEY]);
  const patch = value && typeof value === "object" ? value : {};
  const appearance = BiliFocus.cleanAppearance({ ...current, ...patch });
  await chrome.storage.local.set({ [APPEARANCE_KEY]: appearance });
  return { ok: true, appearance };
}

async function saveSchedules(value) {
  const schedules = BiliFocus.cleanSchedules(value);
  const stored = await chrome.storage.local.get(SCHEDULE_STATE_KEY);
  const scheduleState = BiliFocus.cleanScheduleState(stored[SCHEDULE_STATE_KEY]);
  const ids = new Set(schedules.map((schedule) => schedule.id));
  Object.keys(scheduleState.lastKeys).forEach((id) => {
    if (!ids.has(id)) delete scheduleState.lastKeys[id];
  });
  await chrome.storage.local.set({
    [SCHEDULES_KEY]: schedules,
    [SCHEDULE_STATE_KEY]: scheduleState
  });
  await ensureScheduleTicker();
  return { ok: true, schedules };
}

async function saveTodos(value) {
  const todos = BiliFocus.cleanTodos(value);
  const stored = await chrome.storage.local.get(TODO_REMINDER_KEY);
  const reminderState = BiliFocus.cleanTodoReminderState(stored[TODO_REMINDER_KEY]);
  const ids = new Set(todos.map((todo) => todo.id));
  Object.keys(reminderState.lastKeys).forEach((id) => {
    if (!ids.has(id)) delete reminderState.lastKeys[id];
  });
  await chrome.storage.local.set({
    [TODOS_KEY]: todos,
    [TODO_REMINDER_KEY]: reminderState
  });
  await ensureTodoReminderTicker();
  return { ok: true, todos };
}

async function ensureTodoReminderTicker() {
  const stored = await chrome.storage.local.get(TODOS_KEY);
  const todos = BiliFocus.cleanTodos(stored[TODOS_KEY]);
  const hasReminder = todos.some(
    (todo) =>
      todo.remindEnabled &&
      !todo.abandonedAt &&
      !todo.completedAt &&
      !BiliFocus.isTodoExpired(todo)
  );
  if (!hasReminder) {
    await chrome.alarms.clear(TODO_ALARM);
    return;
  }
  const existing = await chrome.alarms.get(TODO_ALARM);
  if (!existing || existing.periodInMinutes !== 1) {
    chrome.alarms.create(TODO_ALARM, { periodInMinutes: 1 });
  }
}

async function runTodoReminders() {
  const stored = await chrome.storage.local.get([
    TODOS_KEY,
    TODO_REMINDER_KEY,
    STATE_KEY,
    APPEARANCE_KEY
  ]);
  const todos = BiliFocus.cleanTodos(stored[TODOS_KEY]);
  const reminderState = BiliFocus.cleanTodoReminderState(stored[TODO_REMINDER_KEY]);
  const ids = new Set(todos.map((todo) => todo.id));
  let changed = false;
  Object.keys(reminderState.lastKeys).forEach((id) => {
    if (!ids.has(id)) {
      delete reminderState.lastKeys[id];
      changed = true;
    }
  });

  const now = new Date();
  const due = BiliFocus.collectDueTodoReminders(todos, now).filter(
    (item) => reminderState.lastKeys[item.todo.id] !== item.key
  );
  if (!due.length) {
    if (changed) await chrome.storage.local.set({ [TODO_REMINDER_KEY]: reminderState });
    return { ok: true, reminded: 0 };
  }

  due.forEach((item) => {
    reminderState.lastKeys[item.todo.id] = item.key;
  });
  await chrome.storage.local.set({ [TODO_REMINDER_KEY]: reminderState });

  const state = BiliFocus.cleanState(stored[STATE_KEY]);
  if (!state.active) {
    const appearance = BiliFocus.cleanAppearance(stored[APPEARANCE_KEY]);
    const theme = BiliFocus.themeById(appearance.theme);
    await chrome.action.setBadgeBackgroundColor({ color: theme.danger });
    try {
      await chrome.action.setBadgeTextColor({ color: "#ffffff" });
    } catch (_error) {
      // Older Chromium builds pick the badge text colour automatically.
    }
    await chrome.action.setBadgeText({ text: "!" });
  }
  await chrome.action.setTitle({
    title: `静水拾光 · ${due.length} 个待办提醒`
  });
  return { ok: true, reminded: due.length };
}

async function ackTodoReminders() {
  await chrome.action.setTitle({ title: "静水拾光" });
  await refreshBadge();
  return { ok: true };
}

async function ensureScheduleTicker() {
  const stored = await chrome.storage.local.get(SCHEDULES_KEY);
  const schedules = BiliFocus.cleanSchedules(stored[SCHEDULES_KEY]);
  if (!schedules.some((schedule) => schedule.enabled)) {
    await chrome.alarms.clear(SCHEDULE_ALARM);
    return;
  }
  const existing = await chrome.alarms.get(SCHEDULE_ALARM);
  if (!existing || existing.periodInMinutes !== 1) {
    chrome.alarms.create(SCHEDULE_ALARM, { periodInMinutes: 1 });
  }
}

async function runSchedules() {
  await finishIfExpired();
  return withStateLock(runSchedulesInner);
}

async function runSchedulesInner() {
  const stored = await chrome.storage.local.get([
    SCHEDULES_KEY,
    SCHEDULE_STATE_KEY,
    STATE_KEY,
    ALLOWLIST_KEY
  ]);
  const schedules = BiliFocus.cleanSchedules(stored[SCHEDULES_KEY]);
  if (!schedules.length) return { ok: true, started: false };

  const now = new Date();
  const active = schedules
    .filter((schedule) => schedule.enabled)
    .map((schedule) => ({ schedule, window: BiliFocus.activeScheduleWindow(schedule, now) }))
    .filter((entry) => entry.window);
  if (!active.length) return { ok: true, started: false };

  const state = BiliFocus.cleanState(stored[STATE_KEY]);
  const scheduleState = BiliFocus.cleanScheduleState(stored[SCHEDULE_STATE_KEY]);

  if (state.active) {
    if (!state.auto) return { ok: true, started: false, reason: "manual-active" };
    let changed = false;
    active.forEach((entry) => {
      if (scheduleState.lastKeys[entry.schedule.id] !== entry.window.key) {
        scheduleState.lastKeys[entry.schedule.id] = entry.window.key;
        changed = true;
      }
    });
    if (changed) await chrome.storage.local.set({ [SCHEDULE_STATE_KEY]: scheduleState });
    return { ok: true, started: false };
  }

  const allowlist = BiliFocus.cleanAllowlist(stored[ALLOWLIST_KEY]);
  const hasAllowedContent =
    allowlist.creators.length || allowlist.courses.length || allowlist.groups.length || allowlist.sites.length;
  if (!hasAllowedContent) return { ok: true, started: false, reason: "empty-allowlist" };

  const fresh = active.filter(
    (entry) => scheduleState.lastKeys[entry.schedule.id] !== entry.window.key
  );
  if (!fresh.length) return { ok: true, started: false, reason: "already-ran" };

  const latestStored = await chrome.storage.local.get(STATE_KEY);
  if (BiliFocus.cleanState(latestStored[STATE_KEY]).active) {
    return { ok: true, started: false, reason: "focus-started-concurrently" };
  }

  const chosen = fresh[0];
  const nowMs = Date.now();
  const endAt = Math.min(chosen.window.endAt, nowMs + 240 * 60000);
  const minutes = Math.max(1, Math.min(240, Math.round((endAt - nowMs) / 60000)));
  const next = {
    active: true,
    mode: "countdown",
    phase: "focus",
    startedAt: nowMs,
    phaseStartedAt: nowMs,
    endAt,
    durationMinutes: minutes,
    focusMinutes: minutes,
    totalFocusMinutes: minutes,
    breakMinutes: 0,
    sessionFocusMs: 0,
    cycles: 0,
    sessionId: makeSessionId(),
    taskId: "",
    breakEndPopup: false,
    breakSkippable: true,
    strict: chosen.schedule.strict !== false,
    commentMode: state.commentMode,
    auto: true
  };

  active.forEach((entry) => {
    scheduleState.lastKeys[entry.schedule.id] = entry.window.key;
  });
  await chrome.storage.local.set({
    [STATE_KEY]: next,
    [SCHEDULE_STATE_KEY]: scheduleState
  });
  await syncRuntime(next);
  kickGuards();
  return { ok: true, started: true, state: next };
}

function finishIfExpired() {
  return withStateLock(finishIfExpiredInner);
}

async function finishIfExpiredInner() {
  const stored = await chrome.storage.local.get(STATE_KEY);
  const state = BiliFocus.cleanState(stored[STATE_KEY]);
  if (!state.active) return { ok: true, expired: false, state };
  if (state.mode === "countup" || state.phase === "breakEnded") {
    return { ok: true, expired: false, state };
  }

  const now = Date.now();
  if (!state.endAt || state.endAt > now) {
    return { ok: true, expired: false, state };
  }

  if (state.phase === "focus") {
    const focusMs = Math.max(0, state.endAt - state.phaseStartedAt);
    const sessionFocusMs = state.sessionFocusMs + focusMs;
    const cycles = state.cycles + 1;
    const totalMs = state.totalFocusMinutes * 60000;
    if (state.auto || sessionFocusMs >= totalMs - 750) {
      const next = completedState(state, now, sessionFocusMs, cycles);
      await commitState(next);
      return { ok: true, expired: true, state: next, phase: "completed" };
    }
    if (state.breakMinutes > 0) {
      const next = {
        ...state,
        active: true,
        phase: "break",
        phaseStartedAt: now,
        endAt: now + state.breakMinutes * 60000,
        sessionFocusMs,
        cycles,
        breakEndedAt: 0,
        breakNotifiedAt: 0
      };
      await commitState(next);
      return { ok: true, expired: true, state: next, phase: "break" };
    }
    const next = startNextFocusState({ ...state, sessionFocusMs, cycles }, now);
    if (!next) {
      const done = completedState(state, now, sessionFocusMs, cycles);
      await commitState(done);
      return { ok: true, expired: true, state: done, phase: "completed" };
    }
    await commitState(next);
    return { ok: true, expired: true, state: next, phase: "focus" };
  }

  if (state.phase === "break") {
    if (state.breakEndPopup !== false) {
      const next = {
        ...state,
        active: true,
        phase: "breakEnded",
        endAt: 0,
        breakEndedAt: now,
        breakNotifiedAt: 0
      };
      await commitState(next);
      return { ok: true, expired: true, state: next, phase: "breakEnded" };
    }
    const next = startNextFocusState(state, now);
    if (!next) {
      const done = completedState(state, now, state.sessionFocusMs, state.cycles);
      await commitState(done);
      return { ok: true, expired: true, state: done, phase: "completed" };
    }
    await commitState(next);
    return { ok: true, expired: true, state: next, phase: "focus" };
  }

  return { ok: true, expired: false, state };
}

function completedState(state, now, sessionFocusMs, cycles) {
  return {
    ...state,
    active: false,
    phase: "focus",
    endAt: 0,
    sessionFocusMs,
    cycles,
    endedAt: now,
    endReason: "completed",
    breakEndedAt: 0
  };
}

async function refreshFocusLifecycle() {
  const result = await finishIfExpired();
  await syncRuntime(result.state);
}

async function syncRuntime(state) {
  await setPhaseAlarm(state);
  await ensureBadgeTicker(state);
  await updateBadge(state);
}

async function setPhaseAlarm(state) {
  await chrome.alarms.clear(ALARM_NAME);
  if (state.active && Number(state.endAt) > Date.now()) {
    chrome.alarms.create(ALARM_NAME, { when: Number(state.endAt) });
  }
}

async function ensureBadgeTicker(state) {
  // Countdown and break need a per-minute refresh too, not just countup:
  // otherwise the badge keeps showing the minutes it had when the phase began.
  if (state.active && state.phase !== "breakEnded") {
    const existing = await chrome.alarms.get(BADGE_ALARM);
    if (!existing || existing.periodInMinutes !== 1) {
      chrome.alarms.create(BADGE_ALARM, { periodInMinutes: 1 });
    }
    return;
  }
  await chrome.alarms.clear(BADGE_ALARM);
}

async function updateBadge(state, appearance) {
  if (!state.active) {
    await chrome.action.setBadgeText({ text: "" });
    return;
  }
  const current =
    appearance ||
    BiliFocus.cleanAppearance((await chrome.storage.local.get(APPEARANCE_KEY))[APPEARANCE_KEY]);
  const theme = BiliFocus.themeById(current.theme);
  let text;
  if (state.mode === "countup") {
    const elapsedMinutes = Math.floor(BiliFocus.elapsedMs(state) / 60000);
    text = elapsedMinutes > 99 ? "99+" : `${elapsedMinutes}m`;
  } else if (state.phase === "breakEnded") {
    text = "继续";
  } else {
    const minutes = Math.max(1, Math.ceil((state.endAt - Date.now()) / 60000));
    text = minutes > 99 ? "99+" : `${minutes}m`;
  }
  await chrome.action.setBadgeBackgroundColor({ color: theme.accent });
  try {
    await chrome.action.setBadgeTextColor({ color: theme.onAccent });
  } catch (_error) {
    // Older Chromium builds pick the badge text colour automatically.
  }
  await chrome.action.setBadgeText({ text });
}

async function refreshBadge() {
  const stored = await chrome.storage.local.get([STATE_KEY, APPEARANCE_KEY]);
  await updateBadge(
    BiliFocus.cleanState(stored[STATE_KEY]),
    BiliFocus.cleanAppearance(stored[APPEARANCE_KEY])
  );
}

async function ensureGuardsOnOpenTabs() {
  const tabs = await chrome.tabs.query({
    url: ["http://*/*", "https://*/*"]
  });

  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "recheckPage" });
    } catch (_error) {
      try {
        await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["content.css"] });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["shared.js", "content.js"]
        });
      } catch (_injectionError) {
        // Chrome internal pages and tabs that close mid-operation can reject injection.
      }
    }
  }
}

async function resolveCreator(pageUrl) {
  const result = await resolvePageInfo(pageUrl);
  const owner = result?.creator;
  if (!result?.ok || !owner?.mid) {
    return { ok: false, error: "当前页面不是 UP 主空间或普通视频页" };
  }
  return {
    ok: true,
    mid: owner.mid,
    name: owner.name,
    title: result.title || "",
    group: result.group || null
  };
}

async function resolveContentGroup(pageUrl, fallbackTitle = "") {
  const result = await resolvePageInfo(pageUrl, fallbackTitle);
  const group = result?.group || result?.groups?.[0];
  if (!result?.ok || !group) {
    return {
      ok: false,
      error: "当前页面没有识别到合集、系列或整门课程"
    };
  }
  return { ok: true, group };
}

async function resolvePageInfo(pageUrl, fallbackTitle = "") {
  if (!BiliFocus.isBilibiliUrl(pageUrl)) {
    return { ok: false, error: "当前页面不是 B 站页面" };
  }

  const groupRef = BiliFocus.extractContentGroupRef(pageUrl);
  if (groupRef) {
    const group = await resolveDirectGroup(groupRef, fallbackTitle);
    if (!group) return { ok: false, error: "没有识别到合集或课程" };
    return { ok: true, group, groups: [group] };
  }

  const parsedMid = BiliFocus.extractMid(pageUrl);
  if (parsedMid) {
    const name = await fetchCreatorName(parsedMid);
    return {
      ok: true,
      creator: { mid: parsedMid, name: name || `UID ${parsedMid}` }
    };
  }

  const videoId = BiliFocus.extractVideoId(pageUrl);
  if (!videoId) return { ok: false, error: "当前页面不是可识别的内容页" };

  const data = await fetchVideoData(videoId);
  const owner = data?.owner;
  if (!owner?.mid) throw new Error("没有识别到视频作者");
  const creator = {
    mid: String(owner.mid),
    name: String(owner.name || `UID ${owner.mid}`)
  };
  const groups = [];
  if (data.ugc_season?.id) {
    groups.push(BiliFocus.cleanGroupRule({
      type: "ugc_season",
      id: data.ugc_season.id,
      mid: owner.mid,
      label: data.ugc_season.title || `合集 ${data.ugc_season.id}`
    }));
  }

  const stored = await chrome.storage.local.get(ALLOWLIST_KEY);
  const allowlist = BiliFocus.cleanAllowlist(stored[ALLOWLIST_KEY]);
  const seriesRules = allowlist.groups.filter(
    (rule) => rule.type === "series" && (!rule.mid || rule.mid === creator.mid)
  );
  const aid = String(data.aid || videoId.aid || "");
  if (aid) {
    for (const rule of seriesRules) {
      if (await seriesContainsAid(rule, aid)) groups.push(rule);
    }
  }

  return {
    ok: true,
    creator,
    title: String(data.title || ""),
    group: groups[0] || null,
    groups: groups.filter(Boolean)
  };
}

async function resolveDirectGroup(ref, fallbackTitle) {
  if (ref.type === "cheese_ep") {
    const data = await fetchCheeseSeason("ep_id", ref.id);
    return BiliFocus.cleanGroupRule({
      type: "cheese",
      id: data.season_id || data.id,
      label: data.title || cleanPageTitle(fallbackTitle) || `课程 ep${ref.id}`
    });
  }

  let label = cleanPageTitle(fallbackTitle);
  if (ref.type === "cheese") {
    try {
      const data = await fetchCheeseSeason("season_id", ref.id);
      label = data.title || label;
    } catch (_error) {
      // The ss id itself is sufficient even when a paid course hides metadata.
    }
  } else if (ref.type === "series") {
    try {
      const payload = await fetchJson(
        `https://api.bilibili.com/x/series/series?series_id=${encodeURIComponent(ref.id)}`,
        "暂时无法读取系列信息"
      );
      label = payload?.data?.meta?.name || label;
    } catch (_error) {
      // Keep the page title as a fallback.
    }
  }

  return BiliFocus.cleanGroupRule({ ...ref, label });
}

async function fetchVideoData(videoId) {
  const query = videoId.bvid
    ? `bvid=${encodeURIComponent(videoId.bvid)}`
    : `aid=${encodeURIComponent(videoId.aid)}`;
  const payload = await fetchJson(
    `https://api.bilibili.com/x/web-interface/view?${query}`,
    "暂时无法读取视频信息"
  );
  if (payload?.code !== 0 || !payload?.data) throw new Error("暂时无法读取视频信息");
  return payload.data;
}

async function fetchCheeseSeason(key, id) {
  const payload = await fetchJson(
    `https://api.bilibili.com/pugv/view/web/season?${key}=${encodeURIComponent(id)}`,
    "暂时无法读取课程信息",
    "include"
  );
  if (payload?.code !== 0 || !payload?.data) throw new Error("暂时无法读取课程信息");
  return payload.data;
}

async function seriesContainsAid(rule, aid) {
  const key = BiliFocus.groupKey(rule);
  const cached = seriesMemberCache.get(key);
  if (cached && Date.now() - cached.savedAt < SERIES_CACHE_TTL) {
    return cached.aids.has(String(aid));
  }

  try {
    const aids = new Set();
    let page = 1;
    let total = 1;
    do {
      const payload = await fetchJson(
        `https://api.bilibili.com/x/series/archives?mid=${encodeURIComponent(rule.mid || "")}` +
          `&series_id=${encodeURIComponent(rule.id)}&only_normal=true&sort=desc&pn=${page}&ps=100`,
        "暂时无法读取系列视频"
      );
      const data = payload?.data;
      if (payload?.code !== 0 || !data) throw new Error("暂时无法读取系列视频");
      (data.aids || data.archives?.map((item) => item.aid) || []).forEach((item) => aids.add(String(item)));
      total = Number(data.page?.total) || aids.size;
      page += 1;
    } while (aids.size < total && page <= 20);
    seriesMemberCache.set(key, { savedAt: Date.now(), aids });
    return aids.has(String(aid));
  } catch (_error) {
    return false;
  }
}

async function fetchJson(url, errorMessage, credentials = "omit") {
  const response = await fetch(url, { credentials, cache: "no-store" });
  if (!response.ok) throw new Error(errorMessage);
  return response.json();
}

function cleanPageTitle(value) {
  return String(value || "")
    .replace(/\s*[-_|]\s*哔哩哔哩.*$/i, "")
    .trim()
    .slice(0, 60);
}

async function fetchCreatorName(mid) {
  try {
    const response = await fetch(
      `https://api.bilibili.com/x/web-interface/card?mid=${encodeURIComponent(mid)}`,
      { credentials: "omit", cache: "no-store" }
    );
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.data?.card?.name ? String(payload.data.card.name) : null;
  } catch (_error) {
    return null;
  }
}

ensureScheduleTicker().catch(() => {});
