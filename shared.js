(function initBiliFocus(global) {
  "use strict";

  const DEFAULT_STATE = Object.freeze({
    active: false,
    mode: "countdown",
    phase: "focus",
    endAt: 0,
    strict: false,
    startedAt: 0,
    phaseStartedAt: 0,
    durationMinutes: 20,
    focusMinutes: 20,
    totalFocusMinutes: 45,
    breakMinutes: 5,
    sessionFocusMs: 0,
    cycles: 0,
    sessionId: "",
    taskId: "",
    // Batch 31: plan that owns this session ("" for a manual start). Kept on
    // the state so the final focusSessions row can carry the same id.
    scheduleId: "",
    // Batch 32: exact window remainder (ms) captured when a pending plan is
    // confirmed, so the record does not depend on whole-minute rounding.
    windowRemainingMs: 0,
    breakEndPopup: true,
    breakSkippable: true,
    commentMode: "off",
    auto: false,
    // Batch 30: a scheduled plan first parks as "pending". The guard is armed
    // (active) but nothing is counting or recorded until the user confirms.
    pendingPlan: false,
    pendingPlanId: "",
    scheduleWindowEndAt: 0
  });

  const DEFAULT_ALLOWLIST = Object.freeze({
    creators: [],
    courses: [],
    groups: [],
    sites: []
  });

  // Batch 24: every purification switch owns its own trigger. `active` is the
  // switch itself, `trigger` is when it applies ("focus" = focus phase only,
  // "always" = every B站 page). The batch 21 global `pureModeTrigger` is retired.
  const DEFAULT_PURE_FEATURE = Object.freeze({ active: false, trigger: "focus" });

  const DEFAULT_APPEARANCE = Object.freeze({
    theme: "noir",
    timerStyle: "console",
    reducedMotion: false,
    hideComments: DEFAULT_PURE_FEATURE,
    hideRecommend: DEFAULT_PURE_FEATURE,
    hideAds: DEFAULT_PURE_FEATURE,
    hideNavbar: DEFAULT_PURE_FEATURE
  });

  const DEFAULT_SCHEDULES = Object.freeze([]);
  const DEFAULT_SCHEDULE_STATE = Object.freeze({ lastKeys: {} });

  const TIMER_STYLES = Object.freeze(["console", "minimal", "ring", "digital"]);
  const warnedThemes = new Set();

  const DEFAULT_TIMER_CONFIG = Object.freeze({
    mode: "countdown",
    totalFocusMinutes: 45,
    focusMinutes: 20,
    breakMinutes: 5,
    breakEndPopup: true,
    breakSkippable: true
  });

  const DEFAULT_TODOS = Object.freeze([]);
  const DEFAULT_SESSIONS = Object.freeze([]);
  const DEFAULT_TODO_REMINDER_STATE = Object.freeze({ lastKeys: {} });

  // Batch 10: goal targets for the four date scopes. "total" is derived from
  // every session and is intentionally not stored here.
  const GOAL_PERIODS = Object.freeze(["year", "month", "week", "day"]);
  const DEFAULT_GOALS = Object.freeze({
    year: Object.freeze({ minutes: 0, count: 0 }),
    month: Object.freeze({ minutes: 0, count: 0 }),
    week: Object.freeze({ minutes: 0, count: 0 }),
    day: Object.freeze({ minutes: 0, count: 0 })
  });
  const DEFAULT_WISHES = Object.freeze([]);

  const THEMES = Object.freeze(
    [
      {
        id: "celadon",
        name: "青瓷",
        en: "Celadon",
        desc: "玉色与暖纸",
        dark: false,
        bg: "#f3f6f2",
        bgAlt: "#e6ece5",
        surface: "#fbfdfa",
        text: "#1e2a25",
        accent: "#3f8f78",
        accentStrong: "#2c6b58",
        onAccent: "#ffffff",
        danger: "#b04a4a",
        dangerSoft: "#f6e4e0",
        shadow: "#2e463d"
      },
      {
        id: "sakura",
        name: "樱雾",
        en: "Sakura",
        desc: "柔粉与奶油",
        dark: false,
        bg: "#fbf6f3",
        bgAlt: "#f3e8e4",
        surface: "#fffdfb",
        text: "#292127",
        accent: "#ef6f95",
        accentStrong: "#c9406c",
        onAccent: "#ffffff",
        danger: "#b7485e",
        dangerSoft: "#fbe3e9",
        shadow: "#5e3b45"
      },
      {
        id: "sand",
        name: "沙丘",
        en: "Dune",
        desc: "燕麦与陶土",
        dark: false,
        bg: "#f7f2e9",
        bgAlt: "#ece2d3",
        surface: "#fdfaf4",
        text: "#2b251e",
        accent: "#b9784a",
        accentStrong: "#8f5730",
        onAccent: "#fffaf4",
        danger: "#a84e3f",
        dangerSoft: "#f6e3db",
        shadow: "#5a4632"
      },
      {
        id: "salt",
        name: "海盐",
        en: "Sea Salt",
        desc: "雾蓝与冷白",
        dark: false,
        bg: "#f2f5f8",
        bgAlt: "#e3eaf1",
        surface: "#fbfcfe",
        text: "#1d2732",
        accent: "#4a7fa8",
        accentStrong: "#326185",
        onAccent: "#ffffff",
        danger: "#b04f5c",
        dangerSoft: "#f6e3e7",
        shadow: "#304556"
      },
      {
        id: "dusk",
        name: "暮紫",
        en: "Dusk",
        desc: "灰紫与雾粉",
        dark: false,
        bg: "#f5f2f7",
        bgAlt: "#e9e3ee",
        surface: "#fcfbfe",
        text: "#272331",
        accent: "#7b66a8",
        accentStrong: "#5d4a88",
        onAccent: "#ffffff",
        danger: "#a64d68",
        dangerSoft: "#f5e3e9",
        shadow: "#463a58"
      },
      {
        id: "graphite",
        name: "石墨",
        en: "Graphite",
        desc: "黑灰与银",
        dark: true,
        bg: "#15171a",
        bgAlt: "#0d0f11",
        surface: "#1e2227",
        text: "#e8ebef",
        accent: "#aab7c7",
        accentStrong: "#d7e1ed",
        onAccent: "#101418",
        danger: "#e07a72",
        dangerSoft: "#3a2322",
        shadow: "#000000"
      },
      {
        id: "ink",
        name: "墨夜",
        en: "Ink",
        desc: "深蓝与月光",
        dark: true,
        bg: "#0f1620",
        bgAlt: "#090d14",
        surface: "#18222f",
        text: "#e6edf7",
        accent: "#6ea8fe",
        accentStrong: "#a6c8ff",
        onAccent: "#07111f",
        danger: "#e0807a",
        dangerSoft: "#3a2426",
        shadow: "#000000"
      },
      {
        id: "noir",
        name: "砚金",
        en: "Noir",
        desc: "炭黑与香槟",
        dark: true,
        bg: "#0f1115",
        bgAlt: "#08090c",
        surface: "#191c23",
        text: "#f3eee4",
        accent: "#c9a86a",
        accentStrong: "#e8d09f",
        onAccent: "#171208",
        danger: "#dc8073",
        dangerSoft: "#372322",
        shadow: "#000000"
      },
      {
        id: "wine",
        name: "酒红",
        en: "Bordeaux",
        desc: "勃艮第与香槟",
        dark: true,
        bg: "#17100f",
        bgAlt: "#0d0908",
        surface: "#241917",
        text: "#f1e7e3",
        accent: "#d98c74",
        accentStrong: "#eeb7a5",
        onAccent: "#1a0f0c",
        danger: "#e2837a",
        dangerSoft: "#3b2220",
        shadow: "#000000"
      }
    ].map((theme) => Object.freeze(theme))
  );

  function cleanState(value) {
    const source = value && typeof value === "object" ? value : {};
    const mode = source.mode === "countup" ? "countup" : "countdown";
    const rawPhase =
      source.phase === "break" || source.phase === "breakEnded" ? source.phase : "focus";
    const phase = mode === "countup" ? "focus" : rawPhase;
    // Batch 30: a plan that reached its start time is parked as "pending": the
    // guard is armed, but no session is running yet. Such a state must never
    // look like a started session — startedAt / phaseStartedAt / endAt /
    // sessionId / sessionFocusMs all stay empty so no record can be produced.
    const pendingPlan = Boolean(source.active) && source.pendingPlan === true;
    const endAt = pendingPlan
      ? 0
      : mode === "countup" || phase === "breakEnded"
        ? 0
        : Number(source.endAt) || 0;
    const startedAt = pendingPlan ? 0 : Number(source.startedAt) || 0;
    const phaseStartedAt = pendingPlan ? 0 : Number(source.phaseStartedAt) || startedAt;
    const durationMinutes = Number(source.durationMinutes);
    const hasDuration =
      Number.isFinite(durationMinutes) && durationMinutes >= 1 && durationMinutes <= 240;
    const duration = hasDuration ? durationMinutes : 20;
    const focusNumber = Number(source.focusMinutes);
    const focusCandidate =
      Number.isFinite(focusNumber) && focusNumber >= 1 && focusNumber <= 240 ? focusNumber : duration;
    const totalNumber = Number(source.totalFocusMinutes);
    const totalFocusMinutes =
      Number.isFinite(totalNumber) && totalNumber >= 1 && totalNumber <= 480
        ? totalNumber
        : source.focusMinutes != null || hasDuration
          ? focusCandidate
          : 45;
    const focusMinutes = Math.min(focusCandidate, totalFocusMinutes);
    const breakNumber = Number(source.breakMinutes);
    const breakMinutes =
      Number.isFinite(breakNumber) && breakNumber >= 0 && breakNumber <= 60 ? breakNumber : 0;
    const sessionFocusMs = pendingPlan ? 0 : Math.max(0, Number(source.sessionFocusMs) || 0);
    const cycles = Math.max(0, Math.floor(Number(source.cycles) || 0));
    const sessionId = pendingPlan
      ? ""
      : String(source.sessionId || "").slice(0, 64) || (startedAt ? `legacy-${startedAt}` : "");
    const breakEndedAt = Math.max(0, Number(source.breakEndedAt) || 0);
    const breakNotifiedAt = Math.max(0, Number(source.breakNotifiedAt) || 0);
    const endedAt = Math.max(0, Number(source.endedAt) || 0);
    const endReasons = ["completed", "stopped", "breakEnded", "replaced", "error"];
    const endReason = endReasons.includes(source.endReason) ? source.endReason : undefined;

    return {
      active:
        Boolean(source.active) &&
        (pendingPlan || mode === "countup" || phase === "breakEnded" || endAt > 0),
      mode,
      phase,
      endAt,
      strict: source.strict === true && mode !== "countup",
      startedAt,
      phaseStartedAt,
      durationMinutes: duration,
      focusMinutes,
      totalFocusMinutes,
      breakMinutes,
      sessionFocusMs,
      cycles,
      sessionId,
      taskId: String(source.taskId || "").slice(0, 64),
      // Batch 31: the record builder reads this back after restarts, so the
      // cleaner must not drop it.
      scheduleId: String(source.scheduleId || "").slice(0, 64),
      // Batch 32 (D1): exact planned-window remainder, kept through finish so
      // buildSessionRecord can write it instead of a rounded minute count.
      windowRemainingMs: Math.min(
        480 * 60000,
        Math.max(0, Math.round(Number(source.windowRemainingMs) || 0))
      ),
      breakEndPopup: source.breakEndPopup !== false,
      breakSkippable: source.breakSkippable !== false,
      breakEndedAt: phase === "breakEnded" ? breakEndedAt : 0,
      breakNotifiedAt,
      endedAt,
      endReason,
      commentMode: cleanCommentMode(source.commentMode),
      auto: Boolean(source.auto),
      pendingPlan,
      pendingPlanId: pendingPlan ? String(source.pendingPlanId || "").slice(0, 64) : "",
      scheduleWindowEndAt: pendingPlan
        ? Math.max(0, Number(source.scheduleWindowEndAt) || 0)
        : 0
    };
  }

  function cleanCommentMode(value) {
    return value === "focus" || value === "always" ? value : "off";
  }

  // Batch 24: the old global `pureModeTrigger` is gone; each switch carries a
  // trigger. Invalid values fall back to the conservative "focus".
  function cleanPureTrigger(value) {
    return value === "always" ? "always" : "focus";
  }

  // Batch 24: switches are objects now. Old data stored a bare boolean, so
  // `true` becomes { active: true, trigger: "focus" } exactly once at read time.
  function cleanPureFeature(value) {
    if (value === true) return { active: true, trigger: "focus" };
    const source = value && typeof value === "object" ? value : {};
    return { active: source.active === true, trigger: cleanPureTrigger(source.trigger) };
  }

  function cleanAppearance(value) {
    const source = value && typeof value === "object" ? value : {};
    // Batch 19: the single `commentMode` switch is retired in favour of three
    // independent switches. Legacy `commentMode: "always"` meant "clean
    // everything", so migrate it to all three switches at read time.
    const legacyPure = source.commentMode === "always";
    const hideComments = cleanPureFeature(source.hideComments);
    const hideRecommend = cleanPureFeature(source.hideRecommend);
    const hideAds = cleanPureFeature(source.hideAds);
    return {
      theme: cleanThemeId(source.theme),
      timerStyle: TIMER_STYLES.includes(source.timerStyle) ? source.timerStyle : "console",
      reducedMotion: source.reducedMotion === true,
      hideComments: legacyPure ? { active: true, trigger: "focus" } : hideComments,
      hideRecommend: legacyPure ? { active: true, trigger: "focus" } : hideRecommend,
      hideAds: legacyPure ? { active: true, trigger: "focus" } : hideAds,
      hideNavbar: cleanPureFeature(source.hideNavbar)
    };
  }

  function cleanTimerConfig(value) {
    const source = value && typeof value === "object" ? value : {};
    const mode = source.mode === "countup" ? "countup" : "countdown";
    const totalNumber = Number(
      source.totalFocusMinutes != null ? source.totalFocusMinutes : source.totalMinutes
    );
    const totalFocusMinutes =
      Number.isFinite(totalNumber) && totalNumber >= 1 && totalNumber <= 480
        ? Math.round(totalNumber)
        : 45;
    const focusNumber = Number(source.focusMinutes);
    let focusMinutes =
      Number.isFinite(focusNumber) && focusNumber >= 1 && focusNumber <= 240
        ? Math.round(focusNumber)
        : 20;
    focusMinutes = Math.min(focusMinutes, totalFocusMinutes);
    const breakNumber = Number(source.breakMinutes);
    const breakMinutes =
      Number.isFinite(breakNumber) && breakNumber >= 0 && breakNumber <= 60
        ? Math.round(breakNumber)
        : 5;
    return {
      mode,
      totalFocusMinutes,
      focusMinutes,
      breakMinutes,
      breakEndPopup: source.breakEndPopup !== false,
      breakSkippable: source.breakSkippable !== false
    };
  }

  function dateKey(date = new Date()) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function isoWeekKey(date = new Date()) {
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = target.getDay() || 7;
    target.setDate(target.getDate() + 4 - day);
    const yearStart = new Date(target.getFullYear(), 0, 1);
    const week = Math.ceil(((target - yearStart) / 86400000 + 1) / 7);
    return `${target.getFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  function cleanSession(value) {
    if (!value || typeof value !== "object") return null;
    const id = String(value.id || "").slice(0, 64);
    if (!id) return null;
    const startedAt = Number(value.startedAt) || 0;
    const focusMs = Math.max(0, Math.round(Number(value.focusMs) || 0));
    if (!startedAt || focusMs < 1000) return null;

    const mode = value.mode === "countup" ? "countup" : "countdown";
    const source = value.source === "schedule" || value.auto === true ? "schedule" : "manual";
    const endReasons = ["completed", "stopped", "breakEnded", "replaced", "error"];
    const endReason = endReasons.includes(value.endReason)
      ? value.endReason
      : value.completed === true
        ? "completed"
        : "stopped";
    // A record is complete only when the session finished its total focus goal.
    // Early stops (including stopping during a break) stay completed=false.
    const completed = endReason === "completed";

    const rawEndedAt = Number(value.endedAt) || 0;
    const endedAt = rawEndedAt >= startedAt ? rawEndedAt : startedAt + focusMs;
    const plannedNumber = Number(value.plannedMinutes);
    const plannedMinutes =
      mode === "countup"
        ? 0
        : Number.isFinite(plannedNumber)
          ? Math.min(480, Math.max(0, Math.round(plannedNumber)))
          : 0;
    const cycles = Math.min(9999, Math.max(0, Math.floor(Number(value.cycles) || 0)));
    // Batch 32 (D1): optional exact planned-window remainder. Old records do not
    // have it and stay valid; new scheduled records carry it for accurate stats.
    const windowRemainingMs =
      mode === "countdown"
        ? Math.min(480 * 60000, Math.max(0, Math.round(Number(value.windowRemainingMs) || 0)))
        : 0;
    const taskId = String(value.taskId || "").slice(0, 64);
    const taskTitle = String(value.taskTitle || "").trim().slice(0, 80);
    const scheduleId = source === "schedule" ? String(value.scheduleId || "").slice(0, 64) : "";
    const rawDateKey = String(value.dateKey || "");
    const session = {
      id,
      dateKey: /^\d{4}-\d{2}-\d{2}$/.test(rawDateKey)
        ? rawDateKey
        : dateKey(new Date(startedAt)),
      startedAt,
      endedAt,
      focusMs,
      mode,
      source,
      taskId,
      taskTitle,
      plannedMinutes,
      completed,
      endReason,
      cycles
    };
    if (windowRemainingMs > 0) session.windowRemainingMs = windowRemainingMs;
    if (scheduleId) session.scheduleId = scheduleId;
    return session;
  }

  function cleanSessions(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    return value
      .map(cleanSession)
      .filter((item) => {
        if (!item || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, 800);
  }

  function cleanGoalNumber(value) {
    const number = Math.round(Number(value));
    if (!Number.isFinite(number) || number <= 0) return 0;
    return Math.min(1_000_000, number);
  }

  function cleanGoals(value) {
    const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const goals = {};
    GOAL_PERIODS.forEach((period) => {
      const target = source[period];
      const item =
        target && typeof target === "object" && !Array.isArray(target) ? target : {};
      goals[period] = {
        minutes: cleanGoalNumber(item.minutes),
        count: cleanGoalNumber(item.count)
      };
    });
    return goals;
  }

  function cleanWish(value) {
    if (!value || typeof value !== "object") return null;
    const id = String(value.id || "").slice(0, 64);
    const text = String(value.text || "").trim().slice(0, 120);
    if (!id || !text) return null;
    return {
      id,
      text,
      completedAt: Math.max(0, Number(value.completedAt) || 0),
      createdAt: Math.max(0, Number(value.createdAt) || 0)
    };
  }

  function cleanWishes(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    const wishes = [];
    value.forEach((item) => {
      const wish = cleanWish(item);
      if (!wish || seen.has(wish.id)) return;
      seen.add(wish.id);
      wishes.push(wish);
    });
    return wishes.slice(-300);
  }

  function sessionTypeLabel(value) {
    if (value?.source === "schedule" || value?.auto === true) return "计划";
    return value?.mode === "countup" ? "正计时" : "专注";
  }

  function cleanPeriodList(value) {
    const map = new Map();
    (Array.isArray(value) ? value : []).forEach((item) => {
      if (!item || typeof item.key !== "string" || item.key.length > 24) return;
      map.set(item.key, {
        key: item.key,
        at: Math.max(0, Number(item.at) || 0)
      });
    });
    return [...map.values()].slice(-120);
  }

  function cleanTodo(value) {
    if (!value || typeof value !== "object") return null;
    const id = String(value.id || "").slice(0, 64);
    if (!id) return null;
    const title = String(value.title || "").trim().slice(0, 80);
    if (!title) return null;
    const type = ["daily", "weekly", "once", "unlimited"].includes(value.type) ? value.type : "unlimited";
    const dueDate =
      type === "once" && /^\d{4}-\d{2}-\d{2}$/.test(String(value.dueDate || "")) ? value.dueDate : "";
    if (type === "once" && !dueDate) return null;
    let deadline = /^\d{4}-\d{2}-\d{2}$/.test(String(value.deadline || "")) ? value.deadline : "";
    if (type === "once" && deadline && deadline < dueDate) deadline = dueDate;

    const remindEnabled = value.remindEnabled === true;
    const remindTime = cleanTime(value.remindTime);
    const remindDayNumber = Math.round(Number(value.remindDay));
    const remindDay =
      type === "weekly" && Number.isFinite(remindDayNumber) && remindDayNumber >= 1 && remindDayNumber <= 7
        ? remindDayNumber
        : 1;

    const createdAt = Number(value.createdAt) || Date.now();
    const abandonedAt = Math.max(0, Number(value.abandonedAt) || 0);
    let completedAt =
      type === "once" || type === "unlimited" ? Math.max(0, Number(value.completedAt) || 0) : 0;
    if (abandonedAt) completedAt = 0;
    const completedPeriods =
      type === "daily" || type === "weekly" ? cleanPeriodList(value.completedPeriods) : [];
    const completedKeys = new Set(completedPeriods.map((item) => item.key));
    const skippedPeriods =
      type === "daily" || type === "weekly"
        ? cleanPeriodList(value.skippedPeriods).filter((item) => !completedKeys.has(item.key))
        : [];

    return {
      id,
      title,
      type,
      dueDate,
      deadline,
      remindEnabled,
      remindTime,
      remindDay,
      createdAt,
      completedAt,
      abandonedAt,
      completedPeriods,
      skippedPeriods,
      lastReminderKey: String(value.lastReminderKey || "").slice(0, 64)
    };
  }

  function cleanTodos(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    const list = [];
    value.forEach((item) => {
      const todo = cleanTodo(item);
      if (!todo || seen.has(todo.id)) return;
      seen.add(todo.id);
      list.push(todo);
    });
    if (list.length <= 300) return list;

    // Over the cap, drop the oldest completed / abandoned records first and
    // keep active tasks whenever possible.
    const remove = new Set();
    const removable = list
      .map((todo, index) => {
        const latestPeriod = todo.completedPeriods[todo.completedPeriods.length - 1];
        return {
          index,
          at: Math.max(todo.completedAt, todo.abandonedAt, latestPeriod ? latestPeriod.at : 0),
          archived: Boolean(todo.abandonedAt || todo.completedAt || todo.completedPeriods.length)
        };
      })
      .filter((item) => item.archived)
      .sort((a, b) => a.at - b.at);
    for (const item of removable) {
      if (list.length - remove.size <= 300) break;
      remove.add(item.index);
    }
    if (list.length - remove.size > 300) {
      list
        .map((todo, index) => ({ todo, index }))
        .filter((item) => !remove.has(item.index))
        .sort((a, b) => a.todo.createdAt - b.todo.createdAt)
        .forEach((item) => {
          if (list.length - remove.size <= 300) return;
          remove.add(item.index);
        });
    }
    return list.filter((_todo, index) => !remove.has(index));
  }

  function todoPeriodKey(todo, date = new Date()) {
    if (todo.type === "daily") return dateKey(date);
    if (todo.type === "weekly") return isoWeekKey(date);
    return "once";
  }

  function isTodoDone(todo, date = new Date()) {
    if (todo.type === "daily" || todo.type === "weekly") {
      const key = todoPeriodKey(todo, date);
      return todo.completedPeriods.some((item) => item.key === key);
    }
    return Boolean(todo.completedAt);
  }

  function isTodoSkipped(todo, date = new Date()) {
    if (todo.type !== "daily" && todo.type !== "weekly") return false;
    const key = todoPeriodKey(todo, date);
    return todo.skippedPeriods.some((item) => item.key === key);
  }

  function endOfDateText(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return 0;
    const parts = value.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999).getTime();
  }

  function isTodoExpired(todo, date = new Date()) {
    if (!todo) return true;
    const today = dateKey(date);
    if (todo.type === "daily" || todo.type === "weekly") {
      return Boolean(todo.deadline && today > todo.deadline);
    }
    if (todo.type === "once") {
      const cutoff = todo.deadline || todo.dueDate;
      return Boolean(cutoff && today > cutoff);
    }
    return Boolean(todo.deadline && today > todo.deadline);
  }

  function isTodoAvailableForFocus(todo, date = new Date()) {
    if (!todo || todo.abandonedAt || isTodoExpired(todo, date)) return false;
    if (todo.type === "once" || todo.type === "unlimited") return !todo.completedAt;
    return !isTodoDone(todo, date) && !isTodoSkipped(todo, date);
  }

  function todoPeriodEnd(todo, date = new Date()) {
    const todayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
    if (todo.type === "daily") {
      const end = todayEnd;
      const deadlineEnd = todo.deadline ? endOfDateText(todo.deadline) : 0;
      return deadlineEnd ? Math.min(end, deadlineEnd) : end;
    }
    if (todo.type === "weekly") {
      const end = new Date(todayEnd);
      const day = end.getDay() || 7;
      end.setDate(end.getDate() + (7 - day));
      const weekEnd = end.getTime();
      const deadlineEnd = todo.deadline ? endOfDateText(todo.deadline) : 0;
      return deadlineEnd ? Math.min(weekEnd, deadlineEnd) : weekEnd;
    }
    if (todo.type === "once") {
      return endOfDateText(todo.deadline || todo.dueDate);
    }
    if (todo.type === "unlimited") {
      return todo.deadline ? endOfDateText(todo.deadline) : 0;
    }
    return 0;
  }

  function todoReminderMoment(todo, now = new Date()) {
    if (!todo || !todo.remindEnabled || !todo.remindTime) return null;
    if (todo.abandonedAt || isTodoExpired(todo, now)) return null;
    if (todo.type === "once") {
      if (todo.completedAt || todo.dueDate !== dateKey(now)) return null;
    } else if (todo.type === "unlimited") {
      if (todo.completedAt) return null;
    } else if (isTodoDone(todo, now) || isTodoSkipped(todo, now)) {
      return null;
    }

    const parts = todo.remindTime.split(":").map(Number);
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parts[0], parts[1], 0, 0);
    if (todo.type === "weekly") {
      const currentDay = target.getDay() || 7;
      target.setDate(target.getDate() + ((todo.remindDay || 1) - currentDay));
    }
    if (target.getTime() > now.getTime()) return null;
    return target;
  }

  function todoReminderKey(todo, now = new Date()) {
    if (!todoReminderMoment(todo, now)) return "";
    const period = todo.type === "weekly" ? isoWeekKey(now) : dateKey(now);
    return `${period}@${todo.remindTime}`;
  }

  function collectDueTodoReminders(todos, now = new Date()) {
    if (!Array.isArray(todos)) return [];
    return todos
      .map((todo) => ({ todo, key: todoReminderKey(todo, now) }))
      .filter((item) => Boolean(item.key));
  }

  function cleanTodoReminderState(value) {
    const source = value && typeof value === "object" ? value : {};
    const lastKeys = {};
    if (source.lastKeys && typeof source.lastKeys === "object") {
      Object.keys(source.lastKeys)
        .slice(0, 300)
        .forEach((id) => {
          const key = source.lastKeys[id];
          if (id && id.length <= 64 && typeof key === "string" && key.length <= 80) {
            lastKeys[id] = key;
          }
        });
    }
    return { lastKeys };
  }

  function scheduleOccursOn(schedule, date) {
    return Boolean(schedule && Array.isArray(schedule.days) && schedule.days.includes(isoDay(date)));
  }

  function cleanTime(value) {
    const match = String(value || "").trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    return match ? `${match[1]}:${match[2]}` : "";
  }

  function scheduleDurationMinutes(start, end) {
    const startText = cleanTime(start);
    const endText = cleanTime(end);
    if (!startText || !endText) return 0;
    const startParts = startText.split(":").map(Number);
    const endParts = endText.split(":").map(Number);
    const startMinutes = startParts[0] * 60 + startParts[1];
    const endMinutes = endParts[0] * 60 + endParts[1];
    if (startMinutes === endMinutes) return 0;
    return endMinutes > startMinutes ? endMinutes - startMinutes : 1440 - startMinutes + endMinutes;
  }

  // 批次 33：计划时段重叠判定（纯函数，供 popup 在保存前拦截）。
  // 把一条计划按 days 逐天展开成「星期 + 分钟区间」的片段，跨午夜
  // （end < start）拆成两段：当日 [start, 1440) 与次日 [0, end)。
  // 区间统一按半开 [from, to) 处理，所以 09:00–10:00 与 10:00–11:00
  // 首尾相接不算重叠。
  function scheduleDaySegments(schedule) {
    if (!schedule || !Array.isArray(schedule.days)) return [];
    const startText = cleanTime(schedule.start);
    const endText = cleanTime(schedule.end);
    if (!startText || !endText) return [];
    const startMinutes = scheduleTimeToMinutes(startText);
    const endMinutes = scheduleTimeToMinutes(endText);
    if (!scheduleDurationMinutes(startText, endText)) return [];
    const segments = [];
    schedule.days.forEach((day) => {
      if (!Number.isInteger(day) || day < 1 || day > 7) return;
      if (endMinutes > startMinutes) {
        segments.push({ day, from: startMinutes, to: endMinutes });
        return;
      }
      segments.push({ day, from: startMinutes, to: 1440 });
      // 周日（7）的第二段落到周一（1）。
      segments.push({ day: (day % 7) + 1, from: 0, to: endMinutes });
    });
    return segments.filter((segment) => segment.to > segment.from);
  }

  function scheduleSegmentsOverlap(a, b) {
    return a.some((left) =>
      b.some((right) => left.day === right.day && Math.max(left.from, right.from) < Math.min(left.to, right.to))
    );
  }

  // 返回全部重叠的计划（popup 会把这些 label 拼进弹窗文案）。
  // `excludeId` 用于编辑场景：排除正在编辑的计划自己。
  // 不区分 enabled —— 已暂停的计划同样参与判定。
  function findScheduleConflicts(candidate, schedules, excludeId) {
    if (!candidate || !Array.isArray(schedules)) return [];
    const own = scheduleDaySegments(candidate);
    if (!own.length) return [];
    return schedules.filter(
      (item) => item && item.id !== excludeId && scheduleSegmentsOverlap(own, scheduleDaySegments(item))
    );
  }

  function cleanSchedule(value) {
    if (!value || typeof value !== "object") return null;
    const id = String(value.id || "").trim();
    if (!/^[A-Za-z0-9_-]{1,48}$/.test(id)) return null;

    const days = Array.isArray(value.days)
      ? [...new Set(value.days.map(Number).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7))].sort(
          (a, b) => a - b
        )
      : [];
    if (!days.length) return null;

    const start = cleanTime(value.start);
    const end = cleanTime(value.end);
    const duration = scheduleDurationMinutes(start, end);
    if (!duration || duration > 240) return null;

    const label = String(value.label || "").trim().slice(0, 24) || "专注计划";
    return {
      id,
      label,
      days,
      start,
      end,
      enabled: value.enabled !== false,
      strict: value.strict === true
    };
  }

  function cleanSchedules(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    return value
      .map(cleanSchedule)
      .filter((item) => {
        if (!item || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .slice(0, 20);
  }

  function cleanScheduleState(value) {
    const source = value && typeof value === "object" ? value : {};
    const lastKeys = {};
    if (source.lastKeys && typeof source.lastKeys === "object") {
      Object.keys(source.lastKeys)
        .slice(0, 24)
        .forEach((id) => {
          const key = source.lastKeys[id];
          if (/^[A-Za-z0-9_-]{1,48}$/.test(id) && typeof key === "string" && key.length <= 80) {
            lastKeys[id] = key;
          }
        });
    }
    return { lastKeys };
  }

  function scheduleDaysLabel(days) {
    const list = Array.isArray(days) ? [...new Set(days)].filter((day) => day >= 1 && day <= 7).sort((a, b) => a - b) : [];
    if (list.length === 7) return "每天";
    if (list.length === 5 && [1, 2, 3, 4, 5].every((day) => list.includes(day))) return "工作日";
    if (list.length === 2 && list.includes(6) && list.includes(7)) return "周末";
    const names = ["一", "二", "三", "四", "五", "六", "日"];
    return list.map((day) => `周${names[day - 1]}`).join("、");
  }

  function formatDurationLabel(minutes) {
    const total = Math.max(0, Math.round(Number(minutes) || 0));
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    if (hours && rest) return `${hours} 小时 ${rest} 分钟`;
    if (hours) return `${hours} 小时`;
    return `${rest} 分钟`;
  }

  function isoDay(date) {
    return date.getDay() || 7;
  }

  function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function localDayAt(date, minutes) {
    const result = startOfLocalDay(date);
    result.setMinutes(minutes);
    return result;
  }

  function scheduleTimeToMinutes(value) {
    const text = cleanTime(value);
    const parts = text.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  function occurrenceKey(schedule, start) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${schedule.id}:${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}:${schedule.start}`;
  }

  function activeScheduleWindow(schedule, now = new Date()) {
    if (!schedule || !Array.isArray(schedule.days)) return null;
    const duration = scheduleDurationMinutes(schedule.start, schedule.end);
    if (!duration || duration > 240) return null;

    const nowMs = now.getTime();
    const durationMs = duration * 60000;
    const startMinutes = scheduleTimeToMinutes(schedule.start);
    const today = startOfLocalDay(now);
    const candidates = [];

    if (schedule.days.includes(isoDay(today))) {
      candidates.push(localDayAt(today, startMinutes));
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (schedule.days.includes(isoDay(yesterday))) {
      const yesterdayStart = localDayAt(yesterday, startMinutes);
      if (yesterdayStart.getTime() + durationMs > nowMs) candidates.push(yesterdayStart);
    }

    for (const start of candidates) {
      const startMs = start.getTime();
      const endMs = startMs + durationMs;
      if (nowMs >= startMs && nowMs < endMs) {
        return { startAt: startMs, endAt: endMs, key: occurrenceKey(schedule, start) };
      }
    }
    return null;
  }

  function nextScheduleWindow(schedule, now = new Date()) {
    if (!schedule || !Array.isArray(schedule.days)) return null;
    const duration = scheduleDurationMinutes(schedule.start, schedule.end);
    if (!duration || duration > 240) return null;

    const nowMs = now.getTime();
    const startMinutes = scheduleTimeToMinutes(schedule.start);
    const today = startOfLocalDay(now);

    for (let offset = 0; offset <= 8; offset += 1) {
      const day = new Date(today);
      day.setDate(today.getDate() + offset);
      if (!schedule.days.includes(isoDay(day))) continue;
      const start = localDayAt(day, startMinutes);
      if (start.getTime() > nowMs) {
        return {
          startAt: start.getTime(),
          endAt: start.getTime() + duration * 60000,
          key: occurrenceKey(schedule, start)
        };
      }
    }
    return null;
  }

  function cleanAllowlist(value) {
    const source = value && typeof value === "object" ? value : {};
    const creators = Array.isArray(source.creators)
      ? source.creators
          .filter((item) => item && /^\d+$/.test(String(item.mid || "")))
          .map((item) => ({
            mid: String(item.mid),
            name: String(item.name || `UID ${item.mid}`).slice(0, 40)
          }))
      : [];
    const courses = Array.isArray(source.courses)
      ? source.courses
          .filter((item) => item && typeof item.pattern === "string")
          .map((item) => ({
            pattern: item.pattern,
            mode: item.mode === "prefix" ? "prefix" : "exact",
            label: String(item.label || "课程").slice(0, 60)
          }))
      : [];
    const sourceGroups = Array.isArray(source.groups)
      ? source.groups
      : Array.isArray(source.collections)
        ? source.collections
        : [];
    const seenGroups = new Set();
    const groups = sourceGroups
      .map(cleanGroupRule)
      .filter((item) => {
        if (!item) return false;
        const key = groupKey(item);
        if (seenGroups.has(key)) return false;
        seenGroups.add(key);
        return true;
      });
    const sourceSites = Array.isArray(source.sites)
      ? source.sites
      : Array.isArray(source.websites)
        ? source.websites
        : [];
    const seenSites = new Set();
    const sites = sourceSites
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        try {
          const normalized = normalizeSiteRule(item.host || item.pattern || "", item.label);
          if (seenSites.has(normalized.host)) return null;
          seenSites.add(normalized.host);
          return normalized;
        } catch (_error) {
          return null;
        }
      })
      .filter(Boolean);

    return { creators, courses, groups, sites };
  }

  function cleanGroupRule(value) {
    if (!value || typeof value !== "object") return null;
    const aliases = {
      season: "ugc_season",
      collection: "ugc_season",
      cheese_season: "cheese"
    };
    const rawType = String(value.type || value.kind || "");
    const type = aliases[rawType] || rawType;
    if (!["ugc_season", "series", "cheese"].includes(type)) return null;

    const id = String(value.id || value.seasonId || value.seriesId || "");
    if (!/^\d+$/.test(id)) return null;
    const mid = /^\d+$/.test(String(value.mid || "")) ? String(value.mid) : "";
    const defaultLabel = type === "cheese" ? `课程 ss${id}` : type === "series" ? `系列 ${id}` : `合集 ${id}`;
    const rule = {
      type,
      id,
      label: String(value.label || defaultLabel).trim().slice(0, 60) || defaultLabel
    };
    if (mid) rule.mid = mid;
    return rule;
  }

  function groupKey(value) {
    const rule = cleanGroupRule(value);
    return rule ? `${rule.type}:${rule.id}` : "";
  }

  function isGroupAllowed(value, groups) {
    const key = groupKey(value);
    return Boolean(key) && (groups || []).some((item) => groupKey(item) === key);
  }

  function isBilibiliHost(hostname) {
    return /(^|\.)bilibili\.com$/i.test(String(hostname || ""));
  }

  function isBilibiliUrl(input) {
    try {
      return isBilibiliHost(new URL(input).hostname);
    } catch (_error) {
      return false;
    }
  }

  function extractMid(input) {
    const text = String(input || "").trim();
    if (/^\d{1,20}$/.test(text)) return text;

    try {
      const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
      if (url.hostname === "space.bilibili.com") {
        const match = url.pathname.match(/^\/(\d{1,20})(?:\/|$)/);
        return match ? match[1] : null;
      }
    } catch (_error) {
      return null;
    }
    return null;
  }

  function extractVideoId(input) {
    try {
      const url = new URL(input);
      const bvid = `${url.pathname}${url.search}`.match(/(?:^|\/|=)(BV[0-9A-Za-z]{10})(?=[/?&#]|$)/i);
      if (bvid) return { bvid: bvid[1] };

      const av = url.pathname.match(/\/video\/av(\d+)(?:\/|$)/i);
      if (av) return { aid: av[1] };

      const aid = url.searchParams.get("aid");
      if (aid && /^\d+$/.test(aid)) return { aid };
    } catch (_error) {
      return null;
    }
    return null;
  }

  function extractContentGroupRef(input) {
    try {
      const url = new URL(input);
      if (!isBilibiliHost(url.hostname)) return null;
      const pathname = url.pathname.replace(/\/+$/, "") || "/";

      const cheeseSeason = pathname.match(/^\/cheese\/play\/ss(\d+)(?:\/|$)/i);
      if (cheeseSeason) return { type: "cheese", id: cheeseSeason[1] };

      const cheeseEpisode = pathname.match(/^\/cheese\/play\/ep(\d+)(?:\/|$)/i);
      if (cheeseEpisode) return { type: "cheese_ep", id: cheeseEpisode[1] };

      if (url.hostname.toLowerCase() !== "space.bilibili.com") return null;
      const modernList = pathname.match(/^\/(\d{1,20})\/lists\/(\d+)(?:\/|$)/i);
      if (modernList) {
        const type = url.searchParams.get("type") === "series" ? "series" : "ugc_season";
        return { type, id: modernList[2], mid: modernList[1] };
      }

      const legacyList = pathname.match(/^\/(\d{1,20})\/channel\/(collectiondetail|seriesdetail)(?:\/|$)/i);
      const sid = url.searchParams.get("sid");
      if (legacyList && sid && /^\d+$/.test(sid)) {
        return {
          type: legacyList[2].toLowerCase() === "seriesdetail" ? "series" : "ugc_season",
          id: sid,
          mid: legacyList[1]
        };
      }
    } catch (_error) {
      return null;
    }
    return null;
  }

  function isContentGroupAllowed(input, groups) {
    const ref = extractContentGroupRef(input);
    return Boolean(ref && ref.type !== "cheese_ep" && isGroupAllowed(ref, groups));
  }

  function canonicalPageUrl(input) {
    const url = new URL(input);
    if (!/(^|\.)bilibili\.com$/i.test(url.hostname)) {
      throw new Error("请填写哔哩哔哩链接");
    }
    url.protocol = "https:";
    url.hostname = url.hostname.toLowerCase();
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return `${url.origin}${url.pathname}`;
  }

  function normalizeCourseRule(input, label) {
    let raw = String(input || "").trim();
    const isPrefix = raw.endsWith("*");
    if (isPrefix) raw = raw.slice(0, -1).trim();
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

    const pattern = canonicalPageUrl(raw);
    const parsed = new URL(pattern);
    if (parsed.pathname === "/") {
      throw new Error("不能允许整个哔哩哔哩网站");
    }

    return {
      pattern,
      mode: isPrefix ? "prefix" : "exact",
      label: String(label || "指定课程").trim().slice(0, 60) || "指定课程"
    };
  }

  function isCourseAllowed(input, courses) {
    let current;
    try {
      current = canonicalPageUrl(input);
    } catch (_error) {
      return false;
    }

    return (courses || []).some((rule) => {
      if (!rule || typeof rule.pattern !== "string") return false;
      if (rule.mode === "prefix") {
        return current === rule.pattern || current.startsWith(`${rule.pattern}/`);
      }
      return current === rule.pattern;
    });
  }

  function isBilibiliEntryAllowed(input) {
    try {
      const url = new URL(input);
      const hostname = url.hostname.toLowerCase();
      const pathname = url.pathname.replace(/\/+$/, "") || "/";
      return (
        ((hostname === "bilibili.com" || hostname === "www.bilibili.com") && pathname === "/") ||
        hostname === "search.bilibili.com"
      );
    } catch (_error) {
      return false;
    }
  }

  function isBilibiliCommentPage(input) {
    try {
      const url = new URL(input);
      if (!isBilibiliHost(url.hostname)) return false;
      return /^\/(?:video\/|bangumi\/play\/|cheese\/play\/|medialist\/play\/|list\/watchlater(?:\/|$))/i.test(
        url.pathname
      );
    } catch (_error) {
      return false;
    }
  }

  function shouldHideComments(input, state) {
    if (!isBilibiliCommentPage(input)) return false;
    const mode = cleanCommentMode(state?.commentMode);
    return (
      mode === "always" ||
      (mode === "focus" && Boolean(state?.active) && (!state.phase || state.phase === "focus"))
    );
  }

  function normalizeSiteRule(input, label) {
    let raw = String(input || "").trim();
    if (!raw) throw new Error("请填写网站域名或网址");
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

    let url;
    try {
      url = new URL(raw);
    } catch (_error) {
      throw new Error("网站域名或网址不正确");
    }
    if (!/^https?:$/.test(url.protocol) || !url.hostname) {
      throw new Error("只支持 http 或 https 网站");
    }

    let host = url.hostname.toLowerCase().replace(/\.$/, "");
    if (host.startsWith("www.")) host = host.slice(4);
    if (isBilibiliHost(host)) {
      throw new Error("B 站内容请使用 UP 主或课程白名单");
    }

    return {
      host,
      label: String(label || host).trim().slice(0, 60) || host
    };
  }

  function isSiteAllowed(input, sites) {
    let hostname;
    try {
      const url = new URL(input);
      if (!/^https?:$/.test(url.protocol)) return false;
      hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    } catch (_error) {
      return false;
    }

    return (sites || []).some((site) => {
      const host = String(site?.host || "").toLowerCase().replace(/\.$/, "");
      if (!host) return false;
      const isLocalOrAddress =
        host === "localhost" || host.startsWith("[") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
      return hostname === host || (!isLocalOrAddress && hostname.endsWith(`.${host}`));
    });
  }

  function remainingMs(state, now = Date.now()) {
    if (!state || !state.active) return 0;
    return Math.max(0, Number(state.endAt) - now);
  }

  function elapsedMs(state, now = Date.now()) {
    if (!state || !state.active) return 0;
    const anchor = Number(state.phaseStartedAt) || Number(state.startedAt) || 0;
    if (!anchor) return 0;
    return Math.max(0, now - anchor);
  }

  function displayMs(state, now = Date.now()) {
    if (state && state.mode === "countup") return elapsedMs(state, now);
    return remainingMs(state, now);
  }

  function formatClock(milliseconds) {
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }

  function parseHex(value) {
    const text = String(value || "").replace("#", "").trim();
    const full = text.length === 3 ? text.split("").map((part) => part + part).join("") : text;
    if (!/^[0-9a-f]{6}$/i.test(full)) return { r: 0, g: 0, b: 0 };
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16)
    };
  }

  function withAlpha(hex, alpha) {
    const { r, g, b } = parseHex(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function mixHex(from, to, weight) {
    const a = parseHex(from);
    const b = parseHex(to);
    const ratio = Math.min(1, Math.max(0, Number(weight) || 0));
    const channel = (x, y) => Math.round(x + (y - x) * ratio).toString(16).padStart(2, "0");
    return `#${channel(a.r, b.r)}${channel(a.g, b.g)}${channel(a.b, b.b)}`;
  }

  function themeById(value) {
    const id = String(value || "");
    return (
      THEMES.find((theme) => theme.id === id) ||
      THEMES.find((theme) => theme.id === DEFAULT_APPEARANCE.theme) ||
      THEMES[0]
    );
  }

  function cleanThemeId(value) {
    return themeById(value).id;
  }

  function buildThemeTokens(theme) {
    const dark = Boolean(theme.dark);
    const text = theme.text;
    return {
      "--bf-bg": theme.bg,
      "--bf-bg-alt": theme.bgAlt,
      "--bf-surface": withAlpha(theme.surface, dark ? 0.84 : 0.8),
      "--bf-surface-solid": theme.surface,
      "--bf-surface-alt": withAlpha(text, dark ? 0.06 : 0.045),
      "--bf-card-border": dark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.85)",
      "--bf-text": text,
      "--bf-text-soft": withAlpha(text, 0.82),
      "--bf-muted": withAlpha(text, 0.62),
      "--bf-faint": withAlpha(text, 0.46),
      "--bf-border": withAlpha(text, dark ? 0.16 : 0.13),
      "--bf-input": dark ? "rgba(255, 255, 255, 0.06)" : "rgba(255, 255, 255, 0.92)",
      "--bf-track": withAlpha(text, dark ? 0.14 : 0.11),
      "--bf-ring-inner": theme.surface,
      "--bf-switch": withAlpha(text, dark ? 0.2 : 0.17),
      "--bf-knob": dark ? "#e9edf2" : "#ffffff",
      "--bf-accent": theme.accent,
      "--bf-accent-strong": theme.accentStrong,
      "--bf-accent-soft": withAlpha(theme.accent, dark ? 0.2 : 0.12),
      "--bf-on-accent": theme.onAccent,
      "--bf-primary": theme.accent,
      "--bf-primary-strong": theme.accentStrong,
      "--bf-on-primary": theme.onAccent,
      "--bf-primary-shadow": withAlpha(theme.accent, dark ? 0.35 : 0.24),
      "--bf-danger": theme.danger,
      "--bf-danger-soft": theme.dangerSoft,
      "--bf-on-danger": dark ? theme.bg : "#ffffff",
      "--bf-shadow": withAlpha(theme.shadow, dark ? 0.6 : 0.1),
      "--bf-glow": withAlpha(theme.accent, dark ? 0.35 : 0.22),
      "--bf-focus-border": withAlpha(theme.accent, 0.55),
      "--bf-focus-ring": withAlpha(theme.accent, 0.14),
      "--bf-status": withAlpha(text, 0.06),
      "--bf-tab-bg": withAlpha(text, 0.05),
      "--bf-tab-active": dark ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.95)",
      "--bf-item": withAlpha(text, 0.04),
      "--bf-avatar-bg": withAlpha(theme.accent, 0.16),
      "--bf-add-bg": withAlpha(theme.accent, 0.16),
      "--bf-add-text": theme.accentStrong,
      "--bf-toast-bg": dark ? mixHex(theme.surface, "#ffffff", 0.14) : theme.text,
      "--bf-toast-text": dark ? theme.text : theme.bg,
      "--bf-overlay-glow": withAlpha(theme.accent, dark ? 0.2 : 0.13),
      "--bf-dot": withAlpha(text, dark ? 0.1 : 0.08),
      "--bf-scroll": withAlpha(text, 0.2),
      "--bf-comment-border": withAlpha(text, 0.13),
      "--bf-comment-bg-a": theme.surface,
      "--bf-comment-bg-b": theme.bgAlt,
      "--bf-comment-title": text,
      "--bf-comment-note": withAlpha(text, 0.55)
    };
  }

  function themeCssVars(value) {
    const tokens = buildThemeTokens(themeById(value));
    return Object.keys(tokens)
      .map((key) => `${key}:${tokens[key]};`)
      .join("");
  }

  function applyTheme(root, value, options) {
    const theme = themeById(value);
    if (!root) return theme;
    const requested = value == null ? "" : String(value);
    root.dataset.theme = theme.id;
    root.dataset.themeRequested = requested;
    if (
      requested &&
      requested !== theme.id &&
      (!options || options.warn !== false) &&
      !warnedThemes.has(requested)
    ) {
      warnedThemes.add(requested);
      console.warn(`[BiliFocus] 未识别的主题「${requested}」，已回退到「${theme.id}」`);
    }
    if (!options || options.colorScheme !== false) {
      root.style.colorScheme = theme.dark ? "dark" : "light";
    }
    const tokens = buildThemeTokens(theme);
    Object.keys(tokens).forEach((key) => root.style.setProperty(key, tokens[key]));
    return theme;
  }

  global.BiliFocus = {
    DEFAULT_STATE,
    DEFAULT_ALLOWLIST,
    DEFAULT_APPEARANCE,
    DEFAULT_SCHEDULES,
    DEFAULT_SCHEDULE_STATE,
    DEFAULT_TIMER_CONFIG,
    DEFAULT_TODOS,
    DEFAULT_SESSIONS,
    DEFAULT_TODO_REMINDER_STATE,
    DEFAULT_GOALS,
    DEFAULT_WISHES,
    GOAL_PERIODS,
    TIMER_STYLES,
    THEMES,
    cleanState,
    cleanCommentMode,
    cleanAppearance,
    cleanTimerConfig,
    cleanTime,
    cleanSchedule,
    cleanSchedules,
    cleanScheduleState,
    cleanSession,
    cleanSessions,
    sessionTypeLabel,
    cleanGoalNumber,
    cleanGoals,
    cleanWish,
    cleanWishes,
    cleanTodo,
    cleanTodos,
    dateKey,
    isoWeekKey,
    todoPeriodKey,
    isTodoDone,
    isTodoSkipped,
    isTodoExpired,
    isTodoAvailableForFocus,
    todoPeriodEnd,
    todoReminderMoment,
    todoReminderKey,
    collectDueTodoReminders,
    cleanTodoReminderState,
    scheduleOccursOn,
    scheduleDurationMinutes,
    scheduleDaySegments,
    scheduleSegmentsOverlap,
    findScheduleConflicts,
    scheduleDaysLabel,
    formatDurationLabel,
    activeScheduleWindow,
    nextScheduleWindow,
    cleanAllowlist,
    cleanGroupRule,
    groupKey,
    isGroupAllowed,
    isBilibiliHost,
    isBilibiliUrl,
    extractMid,
    extractVideoId,
    extractContentGroupRef,
    isContentGroupAllowed,
    normalizeCourseRule,
    isCourseAllowed,
    isBilibiliEntryAllowed,
    isBilibiliCommentPage,
    shouldHideComments,
    normalizeSiteRule,
    isSiteAllowed,
    remainingMs,
    elapsedMs,
    displayMs,
    formatClock,
    themeById,
    cleanThemeId,
    themeCssVars,
    applyTheme
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
