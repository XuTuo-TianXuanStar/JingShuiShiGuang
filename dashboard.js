(function initDashboard() {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const RANGE_LABELS = { 7: "近7天", 30: "近30天", year: "今年", all: "全部" };
  const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const POMO_BUCKETS = [25, 45, 60];
  const RING_CIRCUMFERENCE = 2 * Math.PI * 41;

  const dom = {
    spotlight: document.getElementById("spotlight"),
    rangeSwitch: document.getElementById("range-switch"),
    rangeGlider: document.getElementById("range-glider"),
    updatedAt: document.getElementById("updated-at"),
    statTotalValue: document.getElementById("stat-total-value"),
    statTotalFoot: document.getElementById("stat-total-foot"),
    statTotalSpark: document.getElementById("stat-total-spark"),
    statCountValue: document.getElementById("stat-count-value"),
    statCountFoot: document.getElementById("stat-count-foot"),
    statCountSpark: document.getElementById("stat-count-spark"),
    statAverageValue: document.getElementById("stat-average-value"),
    statAverageFoot: document.getElementById("stat-average-foot"),
    statAverageSpark: document.getElementById("stat-average-spark"),
    statStreakValue: document.getElementById("stat-streak-value"),
    statStreakFoot: document.getElementById("stat-streak-foot"),
    statStreakSpark: document.getElementById("stat-streak-spark"),
    qualityRing: document.getElementById("quality-ring"),
    qualityPercent: document.getElementById("quality-percent"),
    statQualityFoot: document.getElementById("stat-quality-foot"),
    trendAxis: document.getElementById("trend-axis"),
    trendScroll: document.getElementById("trend-scroll"),
    trendSvg: document.getElementById("trend-svg"),
    trendEmpty: document.getElementById("trend-empty"),
    trendChip: document.getElementById("trend-chip"),
    trendSub: document.getElementById("trend-sub"),
    chartTooltip: document.getElementById("chart-tooltip"),
    ttDate: document.getElementById("tt-date"),
    ttValue: document.getElementById("tt-value"),
    ttMeta: document.getElementById("tt-meta"),
    insightHour: document.getElementById("insight-hour"),
    insightHourNote: document.getElementById("insight-hour-note"),
    insightLongest: document.getElementById("insight-longest"),
    insightLongestNote: document.getElementById("insight-longest-note"),
    insightTask: document.getElementById("insight-task"),
    insightTaskNote: document.getElementById("insight-task-note"),
    habitChip: document.getElementById("habit-chip"),
    hourChart: document.getElementById("hour-chart"),
    radarSvg: document.getElementById("radar-svg"),
    pomodoroList: document.getElementById("pomodoro-list"),
    goalList: document.getElementById("goal-list"),
    heatmapMonths: document.getElementById("heatmap-months"),
    heatmapGrid: document.getElementById("heatmap-grid"),
    rankingList: document.getElementById("ranking-list"),
    rankingEmpty: document.getElementById("ranking-empty"),
    rankingChip: document.getElementById("ranking-chip"),
    printDate: document.getElementById("print-date"),
    printRange: document.getElementById("print-range"),
    printUpdated: document.getElementById("print-updated"),
    exportFab: document.getElementById("export-fab"),
    exportHtmlBtn: document.getElementById("export-html"),
    exportPdfBtn: document.getElementById("export-pdf")
  };

  const PRINT_CHART_WIDTH = 580; // A4 180mm 正文宽 - 面板内边距 - 纵轴
  const EXPORT_FILE_PREFIX = "静水拾光-数据大屏-";

  const state = {
    range: "30",
    now: new Date(),
    sessions: [],
    goals: BiliFocus.cleanGoals(),
    appearance: BiliFocus.cleanAppearance(),
    highlightDate: "",
    trendRender: null,
    chartRaf: 0,
    scrollRaf: 0
  };

  const numberAnimations = new WeakMap();
  const barAnimations = new WeakMap();
  let printMode = false;
  const reducedMotionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  init();

  function init() {
    // #chart-tooltip 原本位于 .tilt 卡片内，父级的 3D transform 会把
    // position: fixed 的包含块变成该卡片；先挂到 body 末尾，彻底脱离变换。
    liftTooltipToBody();
    // 单文件导出（导出 HTML）：数据直接来自 <script id="embedded-data">。
    const embedded = readEmbeddedPayload();
    if (embedded) {
      state.sessions = embedded.sessions;
      state.goals = embedded.goals;
      state.appearance = embedded.appearance;
      state.range = embedded.range;
    }
    applyAppearance();
    initSpotlight();
    attachTilt();
    bindEvents();
    if (!embedded) bindStorage();
    state.now = new Date();
    renderAll();
    requestAnimationFrame(syncRangeGlider);
    if (!embedded) loadStoredData();
  }

  /* ------------------------------------------------------------------ */
  /* 基础工具                                                            */
  /* ------------------------------------------------------------------ */

  function isReducedMotion() {
    if (state.appearance.reducedMotion) return true;
    return Boolean(reducedMotionQuery && reducedMotionQuery.matches);
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  function dayKeyOf(date) {
    return BiliFocus.dateKey(date);
  }

  function parseDayKey(key) {
    const parts = String(key || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function daysBetween(from, to) {
    const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((b - a) / 86400000);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function easeOutCubic(progress) {
    return 1 - Math.pow(1 - progress, 3);
  }

  function formatMinutes(minutes) {
    const value = Math.max(0, Math.round(Number(minutes) || 0));
    if (value < 60) return `${value} 分钟`;
    const hours = Math.floor(value / 60);
    const rest = value % 60;
    return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
  }

  function formatMsShort(milliseconds) {
    const minutes = Math.max(0, Math.round((Number(milliseconds) || 0) / 60000));
    if (minutes < 1) return "< 1 分钟";
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} 小时 ${rest} 分` : `${hours} 小时`;
  }

  function formatDayLabel(key, withWeekday) {
    const date = parseDayKey(key);
    if (!date) return String(key || "");
    const base = `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
    return withWeekday ? `${base} · ${WEEKDAYS[(date.getDay() + 6) % 7]}` : base;
  }

  function formatDateTime(milliseconds) {
    const date = new Date(Number(milliseconds) || 0);
    return `${date.getMonth() + 1} 月 ${date.getDate()} 日 ${pad2(date.getHours())}:${pad2(
      date.getMinutes()
    )}`;
  }

  function makeSvg(tag, attributes) {
    const element = document.createElementNS(NS, tag);
    if (attributes) {
      Object.keys(attributes).forEach((key) => {
        if (attributes[key] === null || attributes[key] === undefined) return;
        element.setAttribute(key, String(attributes[key]));
      });
    }
    return element;
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function animateNumber(element, target, formatter, duration = 720) {
    if (!element) return;
    const previousId = numberAnimations.get(element);
    if (previousId) cancelAnimationFrame(previousId);
    const from = Number(element.dataset.numValue || 0);
    element.dataset.numValue = String(target);
    if (isReducedMotion() || Math.abs(target - from) < 0.01) {
      element.textContent = formatter(target);
      numberAnimations.delete(element);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const value = from + (target - from) * easeOutCubic(progress);
      element.textContent = formatter(value);
      if (progress < 1) {
        numberAnimations.set(element, requestAnimationFrame(tick));
      } else {
        element.textContent = formatter(target);
        numberAnimations.delete(element);
      }
    };
    numberAnimations.set(element, requestAnimationFrame(tick));
  }

  function animateWidth(element, targetPercent, duration = 760) {
    if (!element) return;
    const previousId = barAnimations.get(element);
    if (previousId) cancelAnimationFrame(previousId);
    const target = clamp(targetPercent, 0, 100);
    element.dataset.progress = String(target);
    if (isReducedMotion()) {
      element.style.width = `${target}%`;
      barAnimations.delete(element);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const progress = clamp((now - start) / duration, 0, 1);
      element.style.width = `${target * easeOutCubic(progress)}%`;
      if (progress < 1) {
        barAnimations.set(element, requestAnimationFrame(tick));
      } else {
        element.style.width = `${target}%`;
        barAnimations.delete(element);
      }
    };
    barAnimations.set(element, requestAnimationFrame(tick));
  }

  /* ------------------------------------------------------------------ */
  /* 主题 / 光晕 / 3D 倾斜                                               */
  /* ------------------------------------------------------------------ */

  function applyAppearance() {
    state.appearance = BiliFocus.cleanAppearance(state.appearance);
    BiliFocus.applyTheme(document.documentElement, state.appearance.theme, {
      colorScheme: true
    });
    document.documentElement.dataset.motion = state.appearance.reducedMotion ? "reduced" : "full";
    if (state.appearance.reducedMotion) {
      document.querySelectorAll(".tilt").forEach((card) => {
        card.style.transform = "";
      });
    }
  }

  function initSpotlight() {
    const root = document.documentElement;
    let mouseX = window.innerWidth * 0.72;
    let mouseY = window.innerHeight * 0.12;
    let frame = 0;

    const apply = () => {
      frame = 0;
      root.style.setProperty("--spot-x", `${mouseX}px`);
      root.style.setProperty("--spot-y", `${mouseY}px`);
    };

    root.style.setProperty("--spot-x", `${mouseX}px`);
    root.style.setProperty("--spot-y", `${mouseY}px`);

    window.addEventListener(
      "mousemove",
      (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        if (!frame) frame = requestAnimationFrame(apply);
      },
      { passive: true }
    );

    window.addEventListener(
      "mouseleave",
      () => {
        mouseX = window.innerWidth * 0.72;
        mouseY = window.innerHeight * 0.12;
        if (!frame) frame = requestAnimationFrame(apply);
      },
      { passive: true }
    );
  }

  function attachTilt() {
    document.querySelectorAll(".tilt").forEach((card) => {
      let frame = 0;
      let rect = null;
      let pointerX = 0;
      let pointerY = 0;

      const reset = () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        card.style.transform = "";
      };

      const apply = () => {
        frame = 0;
        if (isReducedMotion() || !rect) return;
        const relativeX = clamp((pointerX - rect.left) / Math.max(1, rect.width), 0, 1);
        const relativeY = clamp((pointerY - rect.top) / Math.max(1, rect.height), 0, 1);
        const rotateX = (0.5 - relativeY) * 7;
        const rotateY = (relativeX - 0.5) * 9;
        card.style.transform =
          `perspective(1100px) rotateX(${rotateX.toFixed(2)}deg) ` +
          `rotateY(${rotateY.toFixed(2)}deg) translateZ(0)`;
      };

      card.addEventListener(
        "mousemove",
        (event) => {
          if (isReducedMotion()) return;
          rect = card.getBoundingClientRect();
          pointerX = event.clientX;
          pointerY = event.clientY;
          if (!frame) frame = requestAnimationFrame(apply);
        },
        { passive: true }
      );

      card.addEventListener("mouseleave", reset);
      card.addEventListener("blur", reset, true);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 数据读取                                                            */
  /* ------------------------------------------------------------------ */

  function storageLocal() {
    try {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        return chrome.storage.local;
      }
    } catch (_error) {
      return null;
    }
    return null;
  }

  // 导出的单文件 HTML 把 sessions / goals / appearance 内嵌在 JSON 里，
  // 这里直接读取，优先级高于 chrome.storage（单文件里根本没扩展 API）。
  function readEmbeddedPayload() {
    const node = document.getElementById("embedded-data");
    if (!node) return null;
    let parsed = null;
    try {
      parsed = JSON.parse(node.textContent || "null");
    } catch (_error) {
      return null;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return {
      sessions: BiliFocus.cleanSessions(parsed.sessions),
      goals: BiliFocus.cleanGoals(parsed.goals),
      appearance: BiliFocus.cleanAppearance(parsed.appearance),
      range: RANGE_LABELS[parsed.range] ? String(parsed.range) : "30",
      exportedAt: Number(parsed.exportedAt) || 0
    };
  }

  async function loadStoredData() {
    const area = storageLocal();
    if (!area) return;
    try {
      const data = await area.get(["focusSessions", "goals", "appearance"]);
      state.sessions = BiliFocus.cleanSessions(data.focusSessions);
      state.goals = BiliFocus.cleanGoals(data.goals);
      state.appearance = BiliFocus.cleanAppearance(data.appearance);
      applyAppearance();
      state.now = new Date();
      renderAll();
    } catch (_error) {
      // file:// preview without the chrome API stub: keep the empty state.
    }
  }

  function bindStorage() {
    try {
      if (document.getElementById("embedded-data")) return;
      if (
        typeof chrome === "undefined" ||
        !chrome.storage ||
        !chrome.storage.onChanged ||
        typeof chrome.storage.onChanged.addListener !== "function"
      ) {
        return;
      }
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local") return;
        if (changes.focusSessions) {
          state.sessions = BiliFocus.cleanSessions(changes.focusSessions.newValue);
          state.now = new Date();
          renderAll();
        }
        if (changes.goals) {
          state.goals = BiliFocus.cleanGoals(changes.goals.newValue);
          renderGoals();
        }
        if (changes.appearance) {
          state.appearance = BiliFocus.cleanAppearance(changes.appearance.newValue);
          applyAppearance();
        }
      });
    } catch (_error) {
      // Storage events are optional in a static preview.
    }
  }

  /* ------------------------------------------------------------------ */
  /* 范围与聚合                                                          */
  /* ------------------------------------------------------------------ */

  function rangeBounds() {
    const now = state.now || new Date();
    const endDay = startOfDay(now);
    let startDay;
    if (state.range === "7") {
      startDay = addDays(endDay, -6);
    } else if (state.range === "30") {
      startDay = addDays(endDay, -29);
    } else if (state.range === "year") {
      startDay = new Date(now.getFullYear(), 0, 1);
    } else {
      let earliest = Infinity;
      state.sessions.forEach((session) => {
        if (session.startedAt < earliest) earliest = session.startedAt;
      });
      startDay = Number.isFinite(earliest)
        ? startOfDay(new Date(earliest))
        : addDays(endDay, -29);
    }
    const days = Math.max(1, daysBetween(startDay, endDay) + 1);
    return {
      startDay,
      endDay,
      start: startDay.getTime(),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime(),
      days
    };
  }

  function filteredSessions() {
    const bounds = rangeBounds();
    return state.sessions.filter(
      (session) => session.startedAt >= bounds.start && session.startedAt <= bounds.end
    );
  }

  function sumFocus(sessions) {
    return sessions.reduce((total, session) => total + session.focusMs, 0);
  }

  function dailyTotals(sessions) {
    const map = new Map();
    sessions.forEach((session) => {
      const bucket = map.get(session.dateKey) || { ms: 0, count: 0 };
      bucket.ms += session.focusMs;
      bucket.count += 1;
      map.set(session.dateKey, bucket);
    });
    return map;
  }

  function computeStreak() {
    const days = new Set(state.sessions.map((session) => session.dateKey));
    let cursor = startOfDay(new Date());
    if (!days.has(dayKeyOf(cursor))) {
      cursor = addDays(cursor, -1);
      if (!days.has(dayKeyOf(cursor))) return 0;
    }
    let streak = 0;
    while (days.has(dayKeyOf(cursor)) && streak < 3650) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  /* ------------------------------------------------------------------ */
  /* 渲染总入口                                                          */
  /* ------------------------------------------------------------------ */

  function renderAll(options = {}) {
    renderStats();
    renderTrend(options);
    renderInsights();
    renderHours();
    renderRadar();
    renderPomodoro();
    renderGoals();
    renderHeatmap();
    renderRanking();
    updateRangeUI();
    const now = new Date();
    dom.updatedAt.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    updatePrintMeta();
    document.body.dataset.ready = "1";
  }

  function renderStats() {
    const bounds = rangeBounds();
    const list = filteredSessions();
    const totalMs = sumFocus(list);
    const quality = list.length ? list.filter((session) => session.completed).length / list.length : 0;
    const averageMinutes = totalMs / 60000 / bounds.days;
    const streak = computeStreak();
    const daily = dailyTotals(list);
    const sparkValues = [];
    for (let offset = bounds.days - 1; offset >= 0; offset -= 1) {
      const key = dayKeyOf(addDays(bounds.endDay, -offset));
      const bucket = daily.get(key);
      sparkValues.push({
        minutes: bucket ? bucket.ms / 60000 : 0,
        count: bucket ? bucket.count : 0
      });
    }

    animateNumber(dom.statTotalValue, totalMs / 3600000, (value) => {
      if (value >= 100) return String(Math.round(value));
      const rounded = Math.round(value * 10) / 10;
      return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    });
    dom.statTotalFoot.textContent = `所选范围 · ${list.length} 次记录`;

    animateNumber(dom.statCountValue, list.length, (value) => String(Math.round(value)));
    dom.statCountFoot.textContent = formatMinutes(totalMs / 60000);

    animateNumber(dom.statAverageValue, averageMinutes, (value) =>
      String(Math.round(value))
    );
    dom.statAverageFoot.textContent = `${bounds.days} 个自然日折算`;

    animateNumber(dom.statStreakValue, streak, (value) => String(Math.round(value)));
    const todayHasFocus = state.sessions.some(
      (session) => session.dateKey === dayKeyOf(startOfDay(new Date()))
    );
    dom.statStreakFoot.textContent = todayHasFocus
      ? "今天已打卡，继续保持"
      : "今天还没有记录，别断在这里";

    renderSparkline(dom.statTotalSpark, sparkValues.map((item) => item.minutes));
    renderSparkline(dom.statCountSpark, sparkValues.map((item) => item.count));
    renderSparkline(
      dom.statAverageSpark,
      sparkValues.map((item) => item.minutes)
    );
    renderSparkline(
      dom.statStreakSpark,
      sparkValues.slice(-14).map((item) => item.count)
    );

    const completed = list.filter((session) => session.completed).length;
    dom.statQualityFoot.textContent = `已完成 ${completed} / ${list.length} 次`;
    animateNumber(dom.qualityPercent, quality * 100, (value) => `${Math.round(value)}%`);
    if (dom.qualityRing) {
      const target = RING_CIRCUMFERENCE * (1 - quality);
      const previousId = numberAnimations.get(dom.qualityRing);
      if (previousId) cancelAnimationFrame(previousId);
      dom.qualityRing.style.strokeDasharray = String(RING_CIRCUMFERENCE);
      if (isReducedMotion()) {
        dom.qualityRing.style.strokeDashoffset = String(target);
      } else {
        const start = performance.now();
        const from = Number(dom.qualityRing.dataset.offset || RING_CIRCUMFERENCE);
        const tick = (now) => {
          const progress = clamp((now - start) / 900, 0, 1);
          const value = from + (target - from) * easeOutCubic(progress);
          dom.qualityRing.style.strokeDashoffset = String(value);
          if (progress < 1) {
            numberAnimations.set(dom.qualityRing, requestAnimationFrame(tick));
          } else {
            dom.qualityRing.dataset.offset = String(target);
            numberAnimations.delete(dom.qualityRing);
          }
        };
        numberAnimations.set(dom.qualityRing, requestAnimationFrame(tick));
      }
    }
  }

  function renderSparkline(container, values) {
    if (!container) return;
    container.replaceChildren();
    const width = 180;
    const height = 38;
    const safeValues = values.length ? values : [0];
    const max = Math.max(1, ...safeValues);
    const step = safeValues.length > 1 ? width / (safeValues.length - 1) : width;

    const svg = makeSvg("svg", {
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: "none",
      "aria-hidden": "true"
    });

    const points = safeValues.map((value, index) => {
      const x = safeValues.length > 1 ? index * step : width / 2;
      const y = height - 3 - (Math.max(0, value) / max) * (height - 8);
      return { x, y };
    });

    const linePath = points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
      .join(" ");
    const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

    const area = makeSvg("path", { d: areaPath, class: "spark-area" });
    const line = makeSvg("path", { d: linePath, class: "spark-line" });
    svg.append(area, line);
    container.append(svg);

    if (!isReducedMotion() && typeof line.getTotalLength === "function") {
      const length = line.getTotalLength();
      if (length > 0) {
        line.style.strokeDasharray = String(length);
        line.style.strokeDashoffset = String(length);
        area.style.opacity = "0";
        const start = performance.now();
        const tick = (now) => {
          const progress = clamp((now - start) / 700, 0, 1);
          const eased = easeOutCubic(progress);
          line.style.strokeDashoffset = String(length * (1 - eased));
          area.style.opacity = String(eased);
          if (progress < 1) requestAnimationFrame(tick);
          else {
            line.style.strokeDasharray = "none";
            line.style.strokeDashoffset = "0";
          }
        };
        requestAnimationFrame(tick);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* 趋势折线面积图                                                      */
  /* ------------------------------------------------------------------ */

  function buildTrendSeries() {
    const bounds = rangeBounds();
    let start = bounds.startDay;
    const end = bounds.endDay;
    if (state.range === "all") {
      let earliest = Infinity;
      state.sessions.forEach((session) => {
        if (session.startedAt < earliest) earliest = session.startedAt;
      });
      if (Number.isFinite(earliest)) start = startOfDay(new Date(earliest));
      if (daysBetween(start, end) > 730) start = addDays(end, -730);
    }
    const daily = dailyTotals(filteredSessions());
    const series = [];
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
      const key = dayKeyOf(cursor);
      const bucket = daily.get(key);
      series.push({
        key,
        date: cursor,
        minutes: bucket ? Math.round(bucket.ms / 60000) : 0,
        ms: bucket ? bucket.ms : 0,
        count: bucket ? bucket.count : 0
      });
    }
    return series;
  }

  function niceStep(span) {
    const raw = Math.max(1, span / 4);
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const normalized = raw / power;
    const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return step * power;
  }

  function renderTrend(options = {}) {
    const animate = options.animate !== false;
    if (state.chartRaf) {
      cancelAnimationFrame(state.chartRaf);
      state.chartRaf = 0;
    }
    if (state.scrollRaf) {
      cancelAnimationFrame(state.scrollRaf);
      state.scrollRaf = 0;
    }

    const series = buildTrendSeries();
    const list = filteredSessions();
    const n = series.length;
    const maxMinutes = series.reduce((max, point) => Math.max(max, point.minutes), 0);
    const stepValue = niceStep(maxMinutes || 60);
    const yMax = Math.max(stepValue, Math.ceil(maxMinutes / stepValue) * stepValue);

    const printChart = options.print === true;
    const containerWidth = printChart
      ? PRINT_CHART_WIDTH
      : Math.max(560, dom.trendScroll.clientWidth || 760);
    const height = 286;
    const pad = { top: 24, right: 26, bottom: 36, left: 16 };
    const plotSpan = containerWidth - pad.left - pad.right;
    // 打印时把整段时间压进一页宽度，避免长范围被横向滚动裁掉。
    const pointStep = printChart
      ? plotSpan / Math.max(1, n - 1)
      : n <= 31
        ? plotSpan / Math.max(1, n - 1)
        : 11;
    const width = printChart
      ? containerWidth
      : Math.max(containerWidth, pad.left + pad.right + pointStep * Math.max(1, n - 1));
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = height - pad.top - pad.bottom;
    const baseY = pad.top + plotHeight;

    dom.trendSvg.replaceChildren();
    dom.trendSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    dom.trendSvg.setAttribute("width", String(width));
    dom.trendSvg.setAttribute("height", String(height));
    dom.trendSvg.dataset.points = String(n);
    dom.trendSvg.dataset.drawn = "false";
    dom.trendSvg.dataset.range = state.range;

    const points = series.map((point, index) => {
      const x = pad.left + pointStep * index;
      const y = baseY - (point.minutes / yMax) * plotHeight;
      return { x, y, ...point };
    });

    const defs = makeSvg("defs");
    const gradient = makeSvg("linearGradient", {
      id: "trend-area-gradient",
      x1: "0",
      y1: "0",
      x2: "0",
      y2: "1"
    });
    gradient.append(
      makeSvg("stop", {
        offset: "0%",
        "stop-color": "var(--bf-accent)",
        "stop-opacity": "0.34"
      }),
      makeSvg("stop", {
        offset: "62%",
        "stop-color": "var(--bf-accent)",
        "stop-opacity": "0.1"
      }),
      makeSvg("stop", {
        offset: "100%",
        "stop-color": "var(--bf-accent)",
        "stop-opacity": "0"
      })
    );
    defs.append(gradient);
    dom.trendSvg.append(defs);

    // 横向网格与固定纵轴刻度（纵轴不随图表横向滚动）
    const axisFragment = document.createDocumentFragment();
    const unitLabel = makeElement("span", "axis-unit", "分钟");
    unitLabel.style.top = `${pad.top - 10}px`;
    axisFragment.append(unitLabel);
    for (let line = 0; line <= 4; line += 1) {
      const ratio = line / 4;
      const y = pad.top + plotHeight * ratio;
      dom.trendSvg.append(
        makeSvg("line", {
          x1: pad.left,
          y1: y.toFixed(1),
          x2: width - pad.right,
          y2: y.toFixed(1),
          stroke: "var(--bf-border)",
          "stroke-width": "1",
          "stroke-dasharray": line === 4 ? "0" : "3 6",
          opacity: line === 4 ? "0.9" : "0.55"
        })
      );
      const value = Math.round(yMax * (1 - ratio));
      const yLabel = makeElement("span", null, String(value));
      yLabel.style.top = `${y.toFixed(1)}px`;
      axisFragment.append(yLabel);
    }
    dom.trendAxis.replaceChildren(axisFragment);

    const linePathData = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`
      )
      .join(" ");
    const areaPathData =
      points.length === 1
        ? `M${points[0].x - 12},${baseY} L${points[0].x},${points[0].y} L${
            points[0].x + 12
          },${baseY} Z`
        : `M${points[0].x.toFixed(2)},${baseY} ${points
            .map((point) => `L${point.x.toFixed(2)},${point.y.toFixed(2)}`)
            .join(" ")} L${points[points.length - 1].x.toFixed(2)},${baseY} Z`;

    const area = makeSvg("path", {
      d: areaPathData,
      class: "trend-area",
      fill: "url(#trend-area-gradient)",
      stroke: "none"
    });
    const line = makeSvg("path", {
      d: linePathData,
      class: "trend-line",
      fill: "none",
      stroke: "var(--bf-accent)",
      "stroke-width": "2.4",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    });
    dom.trendSvg.append(area, line);

    if (n <= 60) {
      points.forEach((point) => {
        dom.trendSvg.append(
          makeSvg("circle", {
            cx: point.x.toFixed(2),
            cy: point.y.toFixed(2),
            r: n <= 12 ? "3.4" : "2.4",
            fill: "var(--bf-surface-solid)",
            stroke: "var(--bf-accent)",
            "stroke-width": "1.6"
          })
        );
      });
    }

    // 横轴标签
    const labelIndices = buildXLabelIndices(series);
    labelIndices.forEach((index, position) => {
      const anchor =
        position === 0 ? "start" : position === labelIndices.length - 1 ? "end" : "middle";
      const xLabel = makeSvg("text", {
        x: points[index].x.toFixed(1),
        y: height - 12,
        "text-anchor": anchor,
        fill: "var(--bf-faint)",
        "font-size": "9.5"
      });
      xLabel.textContent = formatXLabel(series[index], n > 31);
      dom.trendSvg.append(xLabel);
    });

    const hover = makeSvg("g", { opacity: "0" });
    const hoverLine = makeSvg("line", {
      y1: pad.top,
      y2: baseY,
      stroke: "var(--bf-accent)",
      "stroke-width": "1",
      "stroke-dasharray": "3 5",
      opacity: "0.8"
    });
    const hoverDot = makeSvg("circle", {
      r: "5.5",
      fill: "var(--bf-accent)",
      stroke: "var(--bf-surface-solid)",
      "stroke-width": "2"
    });
    hover.append(hoverLine, hoverDot);
    dom.trendSvg.append(hover);

    let highlightIndex = -1;
    if (state.highlightDate) {
      highlightIndex = series.findIndex((point) => point.key === state.highlightDate);
    }
    if (highlightIndex >= 0) {
      const point = points[highlightIndex];
      const highlight = makeSvg("g", {
        class: "trend-highlight",
        "data-date": point.key
      });
      highlight.append(
        makeSvg("line", {
          x1: point.x.toFixed(2),
          y1: pad.top,
          x2: point.x.toFixed(2),
          y2: baseY,
          stroke: "var(--bf-accent)",
          "stroke-width": "1.2",
          "stroke-dasharray": "2 4",
          opacity: "0.55"
        }),
        makeSvg("circle", {
          cx: point.x.toFixed(2),
          cy: point.y.toFixed(2),
          r: "10",
          fill: "var(--bf-accent)",
          opacity: "0.14"
        }),
        makeSvg("circle", {
          cx: point.x.toFixed(2),
          cy: point.y.toFixed(2),
          r: "5",
          fill: "var(--bf-accent)",
          stroke: "var(--bf-surface-solid)",
          "stroke-width": "2"
        })
      );
      dom.trendSvg.append(highlight);
    }

    state.trendRender = {
      series,
      points,
      width,
      height,
      pad,
      pointStep,
      baseY,
      hover,
      hoverLine,
      hoverDot,
      highlightIndex
    };

    dom.trendChip.textContent = RANGE_LABELS[state.range] || "近30天";
    dom.trendSub.textContent =
      state.range === "all"
        ? "全部记录按天汇总，最多展示最近 730 天"
        : `${RANGE_LABELS[state.range]}按天汇总所选范围的专注时长`;
    dom.habitChip.textContent = RANGE_LABELS[state.range] || "24h";
    dom.rankingChip.textContent = `Top 5 · ${RANGE_LABELS[state.range] || ""}`;
    dom.trendEmpty.classList.toggle("hidden", list.length > 0);

    // 路径生长动画
    const finish = () => {
      line.style.strokeDasharray = "none";
      line.style.strokeDashoffset = "0";
      area.style.opacity = "1";
      dom.trendSvg.dataset.drawn = "true";
      if (highlightIndex >= 0) showPinnedTooltip(highlightIndex);
    };

    if (!animate || isReducedMotion() || typeof line.getTotalLength !== "function") {
      finish();
    } else {
      const length = line.getTotalLength();
      if (!length) {
        finish();
      } else {
        line.style.strokeDasharray = String(length);
        line.style.strokeDashoffset = String(length);
        area.style.opacity = "0";
        const start = performance.now();
        const tick = (now) => {
          const progress = clamp((now - start) / 950, 0, 1);
          const eased = easeOutCubic(progress);
          line.style.strokeDashoffset = String(length * (1 - eased));
          area.style.opacity = String(eased);
          if (progress < 1) {
            state.chartRaf = requestAnimationFrame(tick);
          } else {
            state.chartRaf = 0;
            finish();
          }
        };
        state.chartRaf = requestAnimationFrame(tick);
      }
    }

    if (options.scrollHighlight && highlightIndex >= 0) {
      centerChartOn(highlightIndex, points, width);
    }
  }

  function buildXLabelIndices(series) {
    const n = series.length;
    if (n <= 1) return [0];
    if (n <= 31) {
      const count = Math.min(6, n);
      const indices = [];
      for (let i = 0; i < count; i += 1) {
        indices.push(Math.round((i * (n - 1)) / Math.max(1, count - 1)));
      }
      return [...new Set(indices)];
    }
    const indices = [0];
    for (let index = 1; index < n; index += 1) {
      if (series[index].date.getDate() === 1) indices.push(index);
    }
    if (indices[indices.length - 1] !== n - 1) indices.push(n - 1);
    return indices;
  }

  function formatXLabel(point, monthOnly) {
    if (monthOnly) return `${point.date.getMonth() + 1}月`;
    return `${point.date.getMonth() + 1}/${point.date.getDate()}`;
  }

  function centerChartOn(index, points, width) {
    const point = points[index];
    if (!point) return;
    const svgRect = dom.trendSvg.getBoundingClientRect();
    const scale = svgRect.width / width || 1;
    const targetX = point.x * scale;
    const target = Math.max(
      0,
      dom.trendScroll.scrollLeft + targetX - dom.trendScroll.clientWidth / 2
    );
    if (isReducedMotion()) {
      dom.trendScroll.scrollLeft = target;
      return;
    }
    const from = dom.trendScroll.scrollLeft;
    const start = performance.now();
    const tick = (now) => {
      const progress = clamp((now - start) / 420, 0, 1);
      dom.trendScroll.scrollLeft = from + (target - from) * easeOutCubic(progress);
      if (progress < 1) {
        state.scrollRaf = requestAnimationFrame(tick);
      } else {
        state.scrollRaf = 0;
      }
    };
    state.scrollRaf = requestAnimationFrame(tick);
  }

  function bindTrendHover() {
    dom.trendSvg.addEventListener("pointermove", onTrendPointerMove);
    dom.trendSvg.addEventListener("pointerleave", () => {
      hideHoverLayer();
      if (state.trendRender && state.trendRender.highlightIndex >= 0) {
        showPinnedTooltip(state.trendRender.highlightIndex);
      } else if (dom.chartTooltip) {
        dom.chartTooltip.hidden = true;
      }
    });
    // 页面滚动或图表横向滚动后，钉住的 tooltip 按最新屏幕坐标重新落位。
    window.addEventListener("scroll", syncPinnedTooltip, { passive: true });
    dom.trendScroll.addEventListener("scroll", syncPinnedTooltip, { passive: true });
  }

  function onTrendPointerMove(event) {
    const render = state.trendRender;
    if (!render || !render.points.length) return;
    const rect = dom.trendSvg.getBoundingClientRect();
    if (!rect.width) return;
    const scale = render.width / rect.width;
    const localX = (event.clientX - rect.left) * scale;
    const index = clamp(
      Math.round((localX - render.pad.left) / Math.max(1, render.pointStep)),
      0,
      render.points.length - 1
    );
    const point = render.points[index];
    render.hover.setAttribute("opacity", "1");
    render.hoverLine.setAttribute("x1", String(point.x));
    render.hoverLine.setAttribute("x2", String(point.x));
    render.hoverDot.setAttribute("cx", String(point.x));
    render.hoverDot.setAttribute("cy", String(point.y));
    updateTooltip(index, false);
    // 悬停提示跟随鼠标，而不是固定贴在数据点上。
    placeTooltip(event.clientX, event.clientY);
  }

  function hideHoverLayer() {
    if (state.trendRender) state.trendRender.hover.setAttribute("opacity", "0");
  }

  function updateTooltip(index, pinned) {
    const render = state.trendRender;
    if (!render || !render.points[index]) return;
    const point = render.points[index];
    dom.ttDate.textContent = formatDayLabel(point.key, true);
    dom.ttValue.textContent = point.minutes
      ? `${point.minutes} 分钟`
      : point.count
        ? "不足 1 分钟"
        : "无专注记录";
    dom.ttMeta.textContent = point.count ? `${point.count} 次专注` : "这天还没有记录";
    dom.chartTooltip.classList.toggle("is-pinned", Boolean(pinned));
    dom.chartTooltip.hidden = false;
  }

  function liftTooltipToBody() {
    if (!dom.chartTooltip) return;
    if (dom.chartTooltip.parentNode !== document.body) {
      document.body.append(dom.chartTooltip);
    }
  }

  function positionTooltipAtPoint(point) {
    const render = state.trendRender;
    if (!render || !point) return;
    // 每次都用图表当前的屏幕矩形重算，页面/图表滚动后依然贴住数据点。
    const svgRect = dom.trendSvg.getBoundingClientRect();
    const scale = svgRect.width / render.width || 1;
    const x = svgRect.left + point.x * scale;
    const y = svgRect.top + point.y * scale;
    placeTooltip(x, y);
  }

  function placeTooltip(x, y) {
    const left = Math.max(10, Math.min(x, window.innerWidth - 150));
    const top = Math.max(10, y);
    dom.chartTooltip.style.left = `${left}px`;
    dom.chartTooltip.style.top = `${top}px`;
  }

  function showPinnedTooltip(index) {
    const render = state.trendRender;
    if (!render || !render.points[index]) return;
    updateTooltip(index, true);
    requestAnimationFrame(() => {
      if (state.trendRender !== render) return;
      // 按当前屏幕坐标重新定位；scroll 事件会继续调用 syncPinnedTooltip 修正。
      positionTooltipAtPoint(render.points[index]);
    });
  }

  function syncPinnedTooltip() {
    const render = state.trendRender;
    if (!render || !dom.chartTooltip || dom.chartTooltip.hidden) return;
    if (!dom.chartTooltip.classList.contains("is-pinned")) return;
    if (render.highlightIndex < 0) return;
    const point = render.points[render.highlightIndex];
    if (point) positionTooltipAtPoint(point);
  }

  /* ------------------------------------------------------------------ */
  /* 洞察                                                                */
  /* ------------------------------------------------------------------ */

  function renderInsights() {
    const list = filteredSessions();

    if (!list.length) {
      dom.insightHour.textContent = "暂无";
      dom.insightHourNote.textContent = "还没有足够数据";
      dom.insightLongest.textContent = "暂无";
      dom.insightLongestNote.textContent = "还没有记录";
      dom.insightTask.textContent = "暂未关联";
      dom.insightTaskNote.textContent = "专注时选一条待办试试";
      return;
    }

    const hourBuckets = new Array(24).fill(0);
    list.forEach((session) => {
      const hour = new Date(session.startedAt).getHours();
      hourBuckets[hour] += session.focusMs;
    });
    let topHour = 0;
    hourBuckets.forEach((ms, hour) => {
      if (ms > hourBuckets[topHour]) topHour = hour;
    });
    const topHourMs = hourBuckets[topHour];
    dom.insightHour.textContent = `${pad2(topHour)}:00–${pad2((topHour + 1) % 24)}:00`;
    dom.insightHourNote.textContent = `${formatMsShort(topHourMs)} · ${list.filter(
      (session) => new Date(session.startedAt).getHours() === topHour
    ).length} 次`;

    const longest = list.reduce(
      (best, session) => (session.focusMs > best.focusMs ? session : best),
      list[0]
    );
    dom.insightLongest.textContent = formatMsShort(longest.focusMs);
    dom.insightLongestNote.textContent = `${formatDayLabel(longest.dateKey, false)} · ${
      longest.taskTitle || "未关联任务"
    }`;

    const taskMap = new Map();
    list.forEach((session) => {
      const title = session.taskTitle || session.taskId;
      if (!title) return;
      const bucket = taskMap.get(title) || { ms: 0, count: 0 };
      bucket.ms += session.focusMs;
      bucket.count += 1;
      taskMap.set(title, bucket);
    });
    let topTask = null;
    taskMap.forEach((bucket, title) => {
      if (
        !topTask ||
        bucket.count > topTask.count ||
        (bucket.count === topTask.count && bucket.ms > topTask.ms)
      ) {
        topTask = { title, ...bucket };
      }
    });
    if (topTask) {
      dom.insightTask.textContent = topTask.title;
      dom.insightTaskNote.textContent = `${formatMsShort(topTask.ms)} · ${topTask.count} 次`;
    } else {
      dom.insightTask.textContent = "暂未关联";
      dom.insightTaskNote.textContent = "专注时选一条待办试试";
    }
  }

  /* ------------------------------------------------------------------ */
  /* 24 小时分布                                                         */
  /* ------------------------------------------------------------------ */

  function renderHours() {
    if (!dom.hourChart) return;
    const list = filteredSessions();
    const minutes = new Array(24).fill(0);
    list.forEach((session) => {
      const hour = new Date(session.startedAt).getHours();
      minutes[hour] += session.focusMs / 60000;
    });
    const max = Math.max(1, ...minutes);
    const fragment = document.createDocumentFragment();
    const bars = [];

    for (let hour = 0; hour < 24; hour += 1) {
      const column = makeElement("div", "hour-col");
      const button = makeElement("button", "hour-bar");
      button.type = "button";
      if (minutes[hour] <= 0) button.classList.add("is-empty");
      button.setAttribute(
        "aria-label",
        `${hour} 点到 ${hour + 1} 点，专注 ${Math.round(minutes[hour])} 分钟`
      );

      const fill = makeElement("span", "hour-fill");
      fill.dataset.target = String((minutes[hour] / max) * 100);
      const tip = makeElement(
        "span",
        "bar-tip",
        minutes[hour] > 0 ? `${Math.round(minutes[hour])} 分钟` : "没有记录"
      );
      button.append(fill, tip);

      const label = makeElement(
        "span",
        "hour-label",
        hour % 3 === 0 ? String(hour) : ""
      );
      column.append(button, label);
      fragment.append(column);
      bars.push({ fill, target: (minutes[hour] / max) * 100 });
    }
    dom.hourChart.replaceChildren(fragment);
    dom.hourChart.dataset.max = String(Math.max(...minutes));

    if (isReducedMotion()) {
      bars.forEach((bar) => {
        bar.fill.style.height = `${bar.target}%`;
      });
    } else {
      const start = performance.now();
      const tick = (now) => {
        const overall = clamp((now - start) / 820, 0, 1);
        bars.forEach((bar, index) => {
          const local = clamp((overall - index * 0.011) / 0.86, 0, 1);
          bar.fill.style.height = `${bar.target * easeOutCubic(local)}%`;
        });
        if (overall < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    dom.hourChart.dataset.drawn = "true";
  }

  /* ------------------------------------------------------------------ */
  /* 星期雷达图                                                          */
  /* ------------------------------------------------------------------ */

  function renderRadar() {
    if (!dom.radarSvg) return;
    const bounds = rangeBounds();
    const weekdayCounts = new Array(7).fill(0);
    for (let cursor = bounds.startDay; cursor <= bounds.endDay; cursor = addDays(cursor, 1)) {
      weekdayCounts[(cursor.getDay() + 6) % 7] += 1;
    }
    const totals = new Array(7).fill(0);
    filteredSessions().forEach((session) => {
      const weekday = (new Date(session.startedAt).getDay() + 6) % 7;
      totals[weekday] += session.focusMs / 60000;
    });
    const averages = totals.map((minutes, index) =>
      weekdayCounts[index] ? minutes / weekdayCounts[index] : 0
    );
    const max = Math.max(1, ...averages);

    const size = 320;
    const height = 284;
    const centerX = 160;
    const centerY = 144;
    const radius = 102;
    const svg = dom.radarSvg;
    svg.setAttribute("viewBox", `0 0 ${size} ${height}`);
    svg.replaceChildren();
    svg.dataset.max = max.toFixed(2);

    const angleFor = (index) => -Math.PI / 2 + (index * Math.PI * 2) / 7;
    const pointAt = (index, ratio) => ({
      x: centerX + Math.cos(angleFor(index)) * radius * ratio,
      y: centerY + Math.sin(angleFor(index)) * radius * ratio
    });
    const polygonPoints = (ratio) =>
      Array.from({ length: 7 }, (_unused, index) => {
        const point = pointAt(index, ratio);
        return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
      }).join(" ");

    for (let ring = 1; ring <= 4; ring += 1) {
      svg.append(
        makeSvg("polygon", {
          points: polygonPoints(ring / 4),
          class: "radar-grid",
          opacity: ring === 4 ? "0.9" : "0.55"
        })
      );
    }

    for (let index = 0; index < 7; index += 1) {
      const outer = pointAt(index, 1);
      svg.append(
        makeSvg("line", {
          x1: centerX,
          y1: centerY,
          x2: outer.x.toFixed(1),
          y2: outer.y.toFixed(1),
          class: "radar-axis"
        })
      );
      const labelPoint = pointAt(index, 1.22);
      const label = makeSvg("text", {
        x: labelPoint.x.toFixed(1),
        y: labelPoint.y.toFixed(1),
        class: "radar-label"
      });
      label.textContent = WEEKDAYS[index];
      svg.append(label);
    }

    const targetPoints = averages.map((value, index) => pointAt(index, value / max));
    const polygon = makeSvg("polygon", {
      points: targetPoints.map((point) => `${centerX},${centerY}`).join(" "),
      class: "radar-value"
    });
    const dots = targetPoints.map(() =>
      makeSvg("circle", { r: "3.4", class: "radar-dot", opacity: "0" })
    );
    svg.append(polygon, ...dots);

    const applyFrame = (progress) => {
      const eased = easeOutCubic(progress);
      polygon.setAttribute(
        "points",
        targetPoints
          .map(
            (point) =>
              `${(centerX + (point.x - centerX) * eased).toFixed(1)},${(
                centerY +
                (point.y - centerY) * eased
              ).toFixed(1)}`
          )
          .join(" ")
      );
      dots.forEach((dot, index) => {
        dot.setAttribute("cx", String(centerX + (targetPoints[index].x - centerX) * eased));
        dot.setAttribute("cy", String(centerY + (targetPoints[index].y - centerY) * eased));
        dot.setAttribute("opacity", String(eased));
      });
    };

    if (isReducedMotion()) {
      applyFrame(1);
    } else {
      const start = performance.now();
      const tick = (now) => {
        const progress = clamp((now - start) / 780, 0, 1);
        applyFrame(progress);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    svg.dataset.drawn = "true";
  }

  /* ------------------------------------------------------------------ */
  /* 番茄钟偏好                                                          */
  /* ------------------------------------------------------------------ */

  function renderPomodoro() {
    if (!dom.pomodoroList) return;
    const counts = new Map(POMO_BUCKETS.map((minutes) => [minutes, 0]));
    filteredSessions().forEach((session) => {
      if (session.mode !== "countdown") return;
      const planned = Number(session.plannedMinutes);
      const actual = Math.round(session.focusMs / 60000);
      const bucket = counts.has(planned) ? planned : counts.has(actual) ? actual : null;
      if (bucket !== null) counts.set(bucket, counts.get(bucket) + 1);
    });
    const rows = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    const max = Math.max(1, ...rows.map((row) => row[1]));
    const medals = ["🥇", "🥈", "🥉"];
    const fragment = document.createDocumentFragment();

    rows.slice(0, 3).forEach(([minutes, count], index) => {
      const row = makeElement("div", `pomo-row${count ? "" : " is-empty"}`);
      row.dataset.minutes = String(minutes);
      row.dataset.count = String(count);
      row.append(makeElement("span", "pomo-rank", medals[index] || "•"));

      const main = makeElement("div", "pomo-main");
      const label = makeElement("span", "pomo-label");
      const name = makeElement("span", null, `${minutes} 分钟`);
      const note = makeElement("em", null, index === 0 ? "最常用" : "偏好");
      label.append(name, note);
      const track = makeElement("span", "pomo-track");
      const fill = makeElement("span", "pomo-fill");
      track.append(fill);
      main.append(label, track);
      row.append(main, makeElement("span", "pomo-count", `${count} 次`));
      fragment.append(row);
      requestAnimationFrame(() => animateWidth(fill, (count / max) * 100, 700));
    });

    dom.pomodoroList.replaceChildren(fragment);
  }

  /* ------------------------------------------------------------------ */
  /* 目标进度                                                            */
  /* ------------------------------------------------------------------ */

  function goalRanges(now = new Date()) {
    const weekday = now.getDay() || 7;
    return {
      day: new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(),
      week: new Date(now.getFullYear(), now.getMonth(), now.getDate() - (weekday - 1)).getTime(),
      month: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
      year: new Date(now.getFullYear(), 0, 1).getTime()
    };
  }

  function renderGoals() {
    if (!dom.goalList) return;
    const now = new Date();
    const ranges = goalRanges(now);
    const entries = [
      { key: "day", label: "今日" },
      { key: "week", label: "本周" },
      { key: "month", label: "本月" },
      { key: "year", label: "今年" }
    ];
    const fragment = document.createDocumentFragment();

    entries.forEach((entry) => {
      const since = ranges[entry.key];
      const list = state.sessions.filter((session) => session.startedAt >= since);
      const doneMinutes = Math.round(sumFocus(list) / 60000);
      const doneCount = list.length;
      const goal = state.goals[entry.key] || { minutes: 0, count: 0 };
      const hasTarget = goal.minutes > 0 || goal.count > 0;
      const percent = goal.minutes > 0
        ? (doneMinutes / goal.minutes) * 100
        : goal.count > 0
          ? (doneCount / goal.count) * 100
          : 0;

      const item = makeElement("article", "goal-item");
      item.dataset.goal = entry.key;
      item.dataset.percent = String(Math.round(percent));

      const head = makeElement("div", "goal-item-head");
      head.append(makeElement("b", null, entry.label));
      const pct = makeElement(
        "span",
        hasTarget ? null : "is-empty",
        hasTarget ? `${Math.round(percent)}%` : "未设目标"
      );
      head.append(pct);

      const track = makeElement("div", "goal-track");
      const fill = makeElement("span", "goal-fill");
      track.append(fill);

      const meta = makeElement("div", "goal-meta");
      meta.append(
        makeElement(
          "span",
          null,
          goal.minutes > 0
            ? `已完成 ${doneMinutes} / ${goal.minutes} 分钟`
            : `已完成 ${doneMinutes} 分钟 · 未设时长目标`
        ),
        makeElement(
          "span",
          null,
          goal.count > 0 ? `次数 ${doneCount} / ${goal.count}` : `次数 ${doneCount}`
        )
      );

      item.append(head, track, meta);
      fragment.append(item);
      requestAnimationFrame(() => animateWidth(fill, percent, 900));
    });

    dom.goalList.replaceChildren(fragment);
  }

  /* ------------------------------------------------------------------ */
  /* 年度热力图                                                          */
  /* ------------------------------------------------------------------ */

  function heatLevel(minutes) {
    if (!(minutes > 0)) return 0;
    if (minutes <= 30) return 1;
    if (minutes <= 60) return 2;
    if (minutes <= 120) return 3;
    return 4;
  }

  function renderHeatmap() {
    if (!dom.heatmapGrid) return;
    const today = startOfDay(new Date());
    const firstDay = addDays(today, -364);
    const gridStart = addDays(firstDay, -firstDay.getDay());

    const totals = new Map();
    state.sessions.forEach((session) => {
      totals.set(session.dateKey, (totals.get(session.dateKey) || 0) + session.focusMs);
    });

    const weekCount = Math.floor(daysBetween(gridStart, today) / 7) + 1;
    const monthFragment = document.createDocumentFragment();
    let lastMonth = -1;
    for (let week = 0; week < weekCount; week += 1) {
      const weekStart = addDays(gridStart, week * 7);
      const month = weekStart.getMonth();
      if (month !== lastMonth) {
        const label = makeElement("span", null, `${month + 1} 月`);
        label.style.gridColumn = `${week + 1} / span 2`;
        label.style.gridRow = "1"; // 强制留在第一行
        monthFragment.append(label);
        lastMonth = month;
      }
    }
    dom.heatmapMonths.replaceChildren(monthFragment);

    const fragment = document.createDocumentFragment();
    let cells = 0;
    for (let cursor = gridStart; cursor <= today; cursor = addDays(cursor, 1)) {
      if (cursor < firstDay) {
        const blank = makeElement("span", "heat-cell is-empty");
        blank.setAttribute("aria-hidden", "true");
        fragment.append(blank);
        continue;
      }
      cells += 1;
      const key = dayKeyOf(cursor);
      const minutes = Math.round((totals.get(key) || 0) / 60000);
      const level = heatLevel(minutes);
      const button = makeElement("button", "heat-cell");
      button.type = "button";
      button.dataset.date = key;
      button.dataset.level = String(level);
      button.dataset.tip = `${formatDayLabel(key, true)} · ${
        minutes > 0 ? `${minutes} 分钟` : "无记录"
      }`;
      button.setAttribute("aria-label", `${formatDayLabel(key, true)}，专注 ${minutes} 分钟`);
      button.setAttribute("aria-pressed", state.highlightDate === key ? "true" : "false");
      if (key === dayKeyOf(today)) button.classList.add("is-today");
      if (state.highlightDate === key) button.classList.add("is-selected");
      fragment.append(button);
    }
    dom.heatmapGrid.replaceChildren(fragment);
    dom.heatmapGrid.dataset.cells = String(cells);
    dom.heatmapGrid.dataset.weeks = String(weekCount);
  }

  function selectHeatmapDate(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
    const target = parseDayKey(key);
    if (!target) return;
    const today = startOfDay(new Date());
    const daysAgo = daysBetween(target, today);
    const bounds = rangeBounds();
    const inRange =
      target.getTime() >= bounds.startDay.getTime() && target.getTime() <= bounds.endDay.getTime();

    if (!inRange) {
      if (daysAgo >= 0 && daysAgo <= 6) state.range = "7";
      else if (daysAgo >= 0 && daysAgo <= 29) state.range = "30";
      else if (target.getFullYear() === today.getFullYear()) state.range = "year";
      else state.range = "all";
      state.now = new Date();
    }

    state.highlightDate = key;
    renderAll({ scrollHighlight: true });
    requestAnimationFrame(syncRangeGlider);
  }

  /* ------------------------------------------------------------------ */
  /* 排行榜                                                              */
  /* ------------------------------------------------------------------ */

  function renderRanking() {
    if (!dom.rankingList) return;
    const top = [...filteredSessions()].sort((a, b) => b.focusMs - a.focusMs).slice(0, 5);
    const fragment = document.createDocumentFragment();
    top.forEach((session, index) => {
      const card = makeElement("article", `rank-card${index === 0 ? " is-first" : ""}`);
      card.dataset.rank = String(index + 1);
      const badge = makeElement("span", "rank-badge", `#${index + 1}`);
      const duration = makeElement("div", "rank-duration", formatMsShort(session.focusMs));
      const date = makeElement("div", "rank-date", `${formatDateTime(session.startedAt)} · ${
        session.mode === "countup" ? "正计时" : session.source === "schedule" ? "计划" : "专注"
      }`);
      const task = makeElement(
        "div",
        `rank-task${session.taskTitle || session.taskId ? "" : " is-empty"}`,
        session.taskTitle || session.taskId || "未关联任务"
      );
      card.append(badge, duration, date, task);
      fragment.append(card);
    });
    dom.rankingList.replaceChildren(fragment);
    dom.rankingList.dataset.count = String(top.length);
    dom.rankingEmpty.classList.toggle("hidden", top.length > 0);
  }

  /* ------------------------------------------------------------------ */
  /* 打印报告头 / 导出                                                    */
  /* ------------------------------------------------------------------ */

  function updatePrintMeta() {
    const now = new Date();
    if (dom.printDate) {
      dom.printDate.textContent =
        `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日`;
    }
    if (dom.printRange) {
      dom.printRange.textContent = `数据范围 ${RANGE_LABELS[state.range] || "近30天"}`;
    }
    if (dom.printUpdated) {
      dom.printUpdated.textContent = `导出时间 ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    }
  }

  // 打印前把长范围折线压进 A4 正文宽度；打印结束后恢复屏幕上的横向滚动版本。
  function beforePrint() {
    if (printMode) return;
    printMode = true;
    updatePrintMeta();
    document.body.dataset.print = "1";
    renderTrend({ animate: false, print: true });
  }

  function afterPrint() {
    if (!printMode) return;
    printMode = false;
    delete document.body.dataset.print;
    renderTrend();
  }

  function exportPdf() {
    beforePrint();
    window.print();
  }

  function todayStamp(date = new Date()) {
    return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
  }

  async function readAssetText(name) {
    try {
      const response = await fetch(name, { cache: "no-store" });
      if (response.ok) return await response.text();
    } catch (_error) {
      // 读取失败统一走下面的显式错误，避免导出半成品。
    }
    throw new Error(`无法读取 ${name}`);
  }

  function escapeForJsonScript(value) {
    return JSON.stringify(value)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");
  }

  function escapeForInlineScript(text) {
    return String(text).replace(/<\/(script)/gi, "<\\/$1");
  }

  function buildSnapshotHtml(assets) {
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll("script").forEach((node) => node.remove());
    clone.querySelectorAll('link[rel="stylesheet"]').forEach((node) => node.remove());
    clone.querySelectorAll(".export-fab, .chart-tooltip").forEach((node) => node.remove());
    clone.querySelectorAll(".tilt").forEach((node) => {
      node.style.transform = "";
    });

    const head = clone.querySelector("head");
    const body = clone.querySelector("body");
    if (!head || !body) throw new Error("页面结构不完整");
    delete body.dataset.print;
    body.removeAttribute("data-ready");
    const title = clone.querySelector("title");
    if (title) title.textContent = "静水拾光 · 专注数据报告";

    const style = document.createElement("style");
    style.textContent = assets.css;
    head.append(style);

    const dataNode = document.createElement("script");
    dataNode.id = "embedded-data";
    dataNode.type = "application/json";
    dataNode.textContent = escapeForJsonScript({
      version: 1,
      source: "jingxin-dashboard",
      exportedAt: Date.now(),
      range: state.range,
      appearance: state.appearance,
      sessions: state.sessions,
      goals: state.goals
    });
    head.append(dataNode);

    [assets.shared, assets.dashboard].forEach((text) => {
      const script = document.createElement("script");
      script.textContent = escapeForInlineScript(text);
      body.append(script);
    });

    const doctype = document.doctype ? "<!doctype html>\n" : "";
    return `${doctype}${clone.outerHTML}`;
  }

  function downloadHtml(filename, html) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function exportHtmlSnapshot() {
    if (!dom.exportHtmlBtn) return;
    const label = dom.exportHtmlBtn.textContent;
    dom.exportHtmlBtn.disabled = true;
    dom.exportHtmlBtn.textContent = "正在打包…";
    try {
      const [css, shared, dashboard] = await Promise.all([
        readAssetText("dashboard.css"),
        readAssetText("shared.js"),
        readAssetText("dashboard.js")
      ]);
      const html = buildSnapshotHtml({ css, shared, dashboard });
      downloadHtml(`${EXPORT_FILE_PREFIX}${todayStamp()}.html`, html);
    } catch (error) {
      console.error("[dashboard] 导出 HTML 失败", error);
      window.alert(`导出失败：${error && error.message ? error.message : "未知错误"}`);
    } finally {
      dom.exportHtmlBtn.disabled = false;
      dom.exportHtmlBtn.textContent = label;
    }
  }

  /* ------------------------------------------------------------------ */
  /* 范围切换 / 事件                                                     */
  /* ------------------------------------------------------------------ */

  function updateRangeUI() {
    if (!dom.rangeSwitch) return;
    dom.rangeSwitch.querySelectorAll(".range-btn").forEach((button) => {
      const active = button.dataset.range === state.range;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    requestAnimationFrame(syncRangeGlider);
  }

  function syncRangeGlider() {
    if (!dom.rangeGlider) return;
    const active = dom.rangeSwitch.querySelector(".range-btn.active");
    if (!active) return;
    dom.rangeGlider.style.left = `${active.offsetLeft}px`;
    dom.rangeGlider.style.width = `${active.offsetWidth}px`;
  }

  function setRange(range) {
    if (!RANGE_LABELS[range] || range === state.range) {
      if (range === state.range) {
        state.now = new Date();
        renderAll();
      }
      return;
    }
    state.range = range;
    state.now = new Date();
    if (state.highlightDate) {
      const bounds = rangeBounds();
      const target = parseDayKey(state.highlightDate);
      if (
        !target ||
        target.getTime() < bounds.startDay.getTime() ||
        target.getTime() > bounds.endDay.getTime()
      ) {
        state.highlightDate = "";
      }
    }
    renderAll();
    requestAnimationFrame(syncRangeGlider);
  }

  function bindEvents() {
    bindTrendHover();

    if (dom.exportHtmlBtn) dom.exportHtmlBtn.addEventListener("click", exportHtmlSnapshot);
    if (dom.exportPdfBtn) dom.exportPdfBtn.addEventListener("click", exportPdf);
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);

    dom.rangeSwitch.addEventListener("click", (event) => {
      const button = event.target.closest(".range-btn");
      if (button) setRange(button.dataset.range);
    });

    dom.heatmapGrid.addEventListener("click", (event) => {
      const cell = event.target.closest(".heat-cell[data-date]");
      if (cell) selectHeatmapDate(cell.dataset.date);
    });

    let resizeFrame = 0;
    window.addEventListener("resize", () => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        syncRangeGlider();
        renderTrend({ animate: false });
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        dom.chartTooltip.hidden = true;
        hideHoverLayer();
      }
    });
  }
})();
