(function initPopup() {
  "use strict";

  const elements = {
    status: document.getElementById("status-pill"),
    clock: document.getElementById("clock"),
    clockLabel: document.getElementById("clock-label"),
    timerRemainingHint: document.getElementById("timer-remaining-hint"),
    progressFill: document.getElementById("progress-fill"),
    progressDot: document.getElementById("progress-dot"),
    focusConfig: document.getElementById("focus-config"),
    focusRestSettings: document.getElementById("focus-rest-settings"),
    breakEnabled: document.getElementById("break-enabled"),
    strict: document.getElementById("strict-mode"),
    commentMode: document.getElementById("comment-mode"),
    start: document.getElementById("start-button"),
    startLabel: document.getElementById("start-label"),
    stop: document.getElementById("stop-button"),
    skipBreak: document.getElementById("skip-break"),
    modeRow: document.getElementById("mode-row"),
    modeNote: document.getElementById("mode-note"),
    breakLayer: document.getElementById("break-layer"),
    breakContinue: document.getElementById("break-continue"),
    breakStop: document.getElementById("break-stop"),
    nextPlan: document.getElementById("next-plan"),
    nextPlanTitle: document.getElementById("next-plan-title"),
    nextPlanSub: document.getElementById("next-plan-sub"),
    allowCard: document.querySelector(".allow-card"),
    allowLockNote: document.getElementById("allow-lock-note"),
    allowCount: document.getElementById("allow-count"),
    creatorInput: document.getElementById("creator-input"),
    creatorName: document.getElementById("creator-name"),
    addCreator: document.getElementById("add-creator"),
    addCurrent: document.getElementById("add-current"),
    creatorList: document.getElementById("creator-list"),
    creatorEmpty: document.getElementById("creator-empty"),
    courseInput: document.getElementById("course-input"),
    courseLabel: document.getElementById("course-label"),
    addCourse: document.getElementById("add-course"),
    addCurrentGroup: document.getElementById("add-current-group"),
    courseList: document.getElementById("course-list"),
    courseEmpty: document.getElementById("course-empty"),
    siteInput: document.getElementById("site-input"),
    siteLabel: document.getElementById("site-label"),
    addSite: document.getElementById("add-site"),
    addCurrentSite: document.getElementById("add-current-site"),
    siteList: document.getElementById("site-list"),
    siteEmpty: document.getElementById("site-empty"),
    toast: document.getElementById("toast"),
    viewNav: document.getElementById("view-nav"),
    navGlider: document.getElementById("nav-glider"),
    viewTabFocus: document.getElementById("view-tab-focus"),
    viewTabTodo: document.getElementById("view-tab-todo"),
    viewTabSchedule: document.getElementById("view-tab-schedule"),
    viewTabAllow: document.getElementById("view-tab-allow"),
    viewTabHistory: document.getElementById("view-tab-history"),
    viewFocus: document.getElementById("view-focus"),
    viewTodo: document.getElementById("view-todo"),
    viewSchedule: document.getElementById("view-schedule"),
    viewAllow: document.getElementById("view-allow"),
    viewHistory: document.getElementById("view-history"),
    navScheduleCount: document.getElementById("nav-schedule-count"),
    navAllowCount: document.getElementById("nav-allow-count"),
    calendarPrev: document.getElementById("calendar-prev"),
    calendarNext: document.getElementById("calendar-next"),
    calendarTitle: document.getElementById("calendar-title"),
    calendarGrid: document.getElementById("calendar-grid"),
    historyMonthTotal: document.getElementById("history-month-total"),
    historyDayTitle: document.getElementById("history-day-title"),
    historyDayTotal: document.getElementById("history-day-total"),
    historyList: document.getElementById("history-list"),
    historyEmpty: document.getElementById("history-empty"),
    openDashboard: document.getElementById("open-dashboard"),
    taskSelect: document.getElementById("task-select"),
    taskPickRow: document.getElementById("task-pick-row"),
    todoTitle: document.getElementById("todo-title"),
    todoTypeRow: document.getElementById("todo-type-row"),
    todoDueField: document.getElementById("todo-due-field"),
    todoDueDate: document.getElementById("todo-due-date"),
    todoDeadline: document.getElementById("todo-deadline"),
    todoRemind: document.getElementById("todo-remind"),
    todoRemindTime: document.getElementById("todo-remind-time"),
    todoRemindDay: document.getElementById("todo-remind-day"),
    todoAdd: document.getElementById("todo-add"),
    todoAddHint: document.getElementById("todo-add-hint"),
    todoAddCard: document.getElementById("todo-add-card"),
    todoList: document.getElementById("todo-list"),
    todoEmpty: document.getElementById("todo-empty"),
    todoCount: document.getElementById("todo-count"),
    todoCompletedToggle: document.getElementById("todo-completed-toggle"),
    todoCompletedCount: document.getElementById("todo-completed-count"),
    todoCompleted: document.getElementById("todo-completed"),
    todoCompletedList: document.getElementById("todo-completed-list"),
    todoCompletedEmpty: document.getElementById("todo-completed-empty"),
    todoBack: document.getElementById("todo-back"),
    heroMode: document.getElementById("hero-mode"),
    scheduleCount: document.getElementById("schedule-count"),
    scheduleList: document.getElementById("schedule-list"),
    scheduleEmpty: document.getElementById("schedule-empty"),
    scheduleLabel: document.getElementById("schedule-label"),
    scheduleStart: document.getElementById("schedule-start"),
    scheduleEnd: document.getElementById("schedule-end"),
    scheduleStrict: document.getElementById("schedule-strict"),
    scheduleDuration: document.getElementById("schedule-duration"),
    dayRow: document.getElementById("day-row"),
    addSchedule: document.getElementById("add-schedule"),
    settingsOpen: document.getElementById("open-settings"),
    settingsLayer: document.getElementById("settings-layer"),
    settingsBackdrop: document.getElementById("settings-backdrop"),
    settingsClose: document.getElementById("close-settings"),
    resetTheme: document.getElementById("reset-theme"),
    themeGrid: document.getElementById("theme-grid"),
    timerStyleGrid: document.getElementById("timer-style-grid"),
    motionToggle: document.getElementById("motion-toggle"),
    totalFocusMinutes: document.getElementById("total-focus-minutes"),
    focusMinutes: document.getElementById("focus-minutes"),
    breakMinutes: document.getElementById("break-minutes"),
    breakEndPopup: document.getElementById("break-end-popup"),
    breakSkippable: document.getElementById("break-skippable"),
    appVersion: document.getElementById("app-version"),
    brandVersion: document.getElementById("brand-version"),
    exportData: document.getElementById("export-data"),
    importData: document.getElementById("import-data"),
    focusTotalText: document.getElementById("focus-total-text"),
    goalOpen: document.getElementById("goal-open"),
    goalLayer: document.getElementById("goal-layer"),
    goalClose: document.getElementById("goal-close"),
    goalBody: document.getElementById("goal-body"),
    goalStats: document.getElementById("goal-stats"),
    wishInput: document.getElementById("wish-input"),
    wishAdd: document.getElementById("wish-add"),
    wishActive: document.getElementById("wish-active"),
    wishActiveEmpty: document.getElementById("wish-active-empty"),
    wishActiveCount: document.getElementById("wish-active-count"),
    wishHonored: document.getElementById("wish-honored"),
    wishHonoredEmpty: document.getElementById("wish-honored-empty"),
    wishHonoredCount: document.getElementById("wish-honored-count"),
    posterOpen: document.getElementById("poster-open"),
    posterLayer: document.getElementById("poster-layer"),
    posterBackdrop: document.getElementById("poster-backdrop"),
    posterClose: document.getElementById("poster-close"),
    posterActions: document.getElementById("poster-actions")
  };

  let state = { ...BiliFocus.DEFAULT_STATE };
  let allowlist = { creators: [], courses: [], groups: [], sites: [] };
  let schedules = [];
  const selectedDays = new Set([1, 2, 3, 4, 5]);
  let appearance = { ...BiliFocus.DEFAULT_APPEARANCE };
  let appearanceSeq = 0;
  let appearancePending = 0;
  let appearanceWrite = Promise.resolve();
  let timerConfig = { ...BiliFocus.DEFAULT_TIMER_CONFIG };
  let timerConfigSeq = 0;
  let timerConfigPending = 0;
  let timerConfigWrite = Promise.resolve();
  let lastBreakMinutes = BiliFocus.DEFAULT_TIMER_CONFIG.breakMinutes || 5;
  let settingsReturnFocus = null;
  let selectedMinutes = BiliFocus.DEFAULT_TIMER_CONFIG.focusMinutes;
  let ticker = null;
  let toastTimer = null;
  let preferenceTimer = null;
  let settingsWrite = Promise.resolve();
  let lastPlanMinute = -1;
  let lastBreakModalAt = -1;
  let lastExpiryEndAt = 0;
  let recentSessions = [];
  let calendarMonth = startOfMonth(new Date());
  let calendarSessions = [];
  let calendarTotals = new Map();
  let selectedDateKey = BiliFocus.dateKey();
  let calendarRequestSeq = 0;
  let currentView = "focus";
  let todos = [];
  let todoDraftType = "daily";
  let todoCompletedMode = false;
  let selectedTaskId = "";
  let reminderToastKey = "";
  let todoSeq = 0;
  let todoPending = 0;
  let todoWrite = Promise.resolve();
  let goals = BiliFocus.cleanGoals();
  let wishes = [];
  let allSessions = [];
  let focusStatsSeq = 0;
  let goalReturnFocus = null;
  let goalEdit = null;
  let posterReturnFocus = null;

  const GOAL_LABELS = { total: "总计", year: "今年", month: "本月", week: "本周", day: "今日" };

  initAppearance();
  applyTimerConfig();
  bindEvents();
  loadData();
  loadGoalData();
  requestAnimationFrame(syncNavGlider);

  function initAppearance() {
    appearance = BiliFocus.cleanAppearance({
      theme: document.documentElement.dataset.theme,
      reducedMotion: false
    });
    buildThemeGrid();
    applyAppearance();
    try {
      const version = chrome.runtime.getManifest().version;
      elements.appVersion.textContent = version;
      elements.brandVersion.textContent = `v${version}`;
    } catch (_error) {
      // Keep the version already present in the markup.
    }
  }

  function bindEvents() {
    elements.viewTabFocus.addEventListener("click", () => switchView("focus"));
    elements.viewTabTodo.addEventListener("click", () => switchView("todo"));
    elements.viewTabSchedule.addEventListener("click", () => switchView("schedule"));
    elements.viewTabAllow.addEventListener("click", () => switchView("allow"));
    elements.viewTabHistory.addEventListener("click", () => switchView("history"));
    elements.openDashboard.addEventListener("click", openDashboard);
    elements.nextPlan.addEventListener("click", () => switchView("schedule"));
    elements.taskSelect.addEventListener("change", () => {
      selectedTaskId = elements.taskSelect.value;
    });
    elements.todoTypeRow.addEventListener("click", (event) => {
      const chip = event.target.closest(".todo-type");
      if (!chip) return;
      todoDraftType = ["daily", "weekly", "once", "unlimited"].includes(chip.dataset.todoType)
        ? chip.dataset.todoType
        : "daily";
      updateTodoForm();
    });
    elements.todoRemind.addEventListener("change", updateTodoForm);
    elements.todoAdd.addEventListener("click", addTodo);
    elements.todoCompletedToggle.addEventListener("click", () =>
      setTodoCompletedMode(!todoCompletedMode)
    );
    elements.todoBack.addEventListener("click", () => setTodoCompletedMode(false));
    elements.todoList.addEventListener("click", handleTodoListClick);
    bindEnter([elements.todoTitle], addTodo);
    elements.todoDueDate.value = BiliFocus.dateKey();
    updateTodoForm();
    elements.calendarPrev.addEventListener("click", () => shiftCalendarMonth(-1));
    elements.calendarNext.addEventListener("click", () => shiftCalendarMonth(1));
    elements.calendarGrid.addEventListener("click", (event) => {
      const cell = event.target.closest(".calendar-day[data-date]");
      if (cell) selectCalendarDay(cell.dataset.date);
    });
    elements.resetTheme.addEventListener("click", resetTheme);
    elements.exportData.addEventListener("click", exportData);
    elements.importData.addEventListener("click", importData);
    elements.goalOpen.addEventListener("click", openGoals);
    elements.goalClose.addEventListener("click", closeGoals);
    elements.posterOpen.addEventListener("click", openPoster);
    elements.posterClose.addEventListener("click", closePoster);
    elements.posterBackdrop.addEventListener("click", closePoster);
    elements.posterActions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-poster-period]");
      if (!button) return;
      const period = button.dataset.posterPeriod;
      closePoster();
      void downloadPoster(period);
    });
    elements.wishAdd.addEventListener("click", addWish);
    bindEnter([elements.wishInput], addWish);
    elements.wishActive.addEventListener("click", (event) => {
      const button = event.target.closest("[data-wish-complete]");
      if (button) completeWish(button.dataset.wishComplete);
    });
    elements.goalStats.addEventListener("click", (event) => {
      const button = event.target.closest("[data-goal-edit]");
      if (button) beginGoalEdit(button);
    });
    elements.settingsOpen.addEventListener("click", openSettings);
    elements.settingsClose.addEventListener("click", closeSettings);
    elements.settingsBackdrop.addEventListener("click", closeSettings);
    elements.timerStyleGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".timer-style-card");
      if (card) selectTimerStyle(card.dataset.timerStyle);
    });
    elements.motionToggle.addEventListener("change", () => {
      setReducedMotion(elements.motionToggle.checked);
    });
    elements.modeRow.addEventListener("click", (event) => {
      const chip = event.target.closest(".mode-chip");
      if (chip && !chip.disabled) selectTimerMode(chip.dataset.mode);
    });
    elements.skipBreak.addEventListener("click", skipBreak);
    elements.breakContinue.addEventListener("click", continueFocus);
    elements.breakStop.addEventListener("click", stopFocus);
    bindTimerConfigNumber(elements.totalFocusMinutes, "totalFocusMinutes", 1, 480);
    bindTimerConfigNumber(elements.focusMinutes, "focusMinutes", 1, 240);
    bindTimerConfigNumber(elements.breakMinutes, "breakMinutes", 0, 60);
    elements.breakEndPopup.addEventListener("change", () => {
      persistTimerConfig({ breakEndPopup: elements.breakEndPopup.checked });
    });
    elements.breakSkippable.addEventListener("change", () => {
      persistTimerConfig({ breakSkippable: elements.breakSkippable.checked });
    });
    elements.breakEnabled.addEventListener("change", () => {
      toggleBreak(elements.breakEnabled.checked);
    });
    window.addEventListener("resize", syncNavGlider);
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (isPosterPanelOpen()) {
        closePoster();
        return;
      }
      if (isGoalPanelOpen()) {
        closeGoals();
        return;
      }
      if (!elements.settingsLayer.classList.contains("hidden")) {
        closeSettings();
      }
    });

    elements.dayRow.querySelectorAll(".day-btn").forEach((button) => {
      button.setAttribute("aria-pressed", selectedDays.has(Number(button.dataset.day)) ? "true" : "false");
    });
    elements.dayRow.addEventListener("click", (event) => {
      const button = event.target.closest(".day-btn");
      if (!button) return;
      const day = Number(button.dataset.day);
      if (selectedDays.has(day)) {
        selectedDays.delete(day);
        button.classList.remove("active");
        button.setAttribute("aria-pressed", "false");
      } else {
        selectedDays.add(day);
        button.classList.add("active");
        button.setAttribute("aria-pressed", "true");
      }
    });
    elements.scheduleStart.addEventListener("input", renderSchedulePreview);
    elements.scheduleEnd.addEventListener("input", renderSchedulePreview);
    elements.scheduleStart.addEventListener("change", renderSchedulePreview);
    elements.scheduleEnd.addEventListener("change", renderSchedulePreview);
    elements.addSchedule.addEventListener("click", addSchedule);
    renderSchedulePreview();

    elements.strict.addEventListener("change", persistPreferences);
    elements.commentMode.addEventListener("change", saveCommentMode);

    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
        document.querySelectorAll(".tab-panel").forEach((panel) => {
          panel.classList.toggle("hidden", panel.id !== `panel-${tab.dataset.tab}`);
        });
      });
    });

    elements.addCreator.addEventListener("click", addCreator);
    elements.addCurrent.addEventListener("click", addCurrentCreator);
    elements.addCourse.addEventListener("click", addCourse);
    elements.addCurrentGroup.addEventListener("click", addCurrentGroup);
    elements.addSite.addEventListener("click", addSite);
    elements.addCurrentSite.addEventListener("click", addCurrentSite);
    elements.start.addEventListener("click", startFocus);
    elements.stop.addEventListener("click", stopFocus);

    bindEnter([elements.creatorInput, elements.creatorName], addCreator);
    bindEnter([elements.courseInput, elements.courseLabel], addCourse);
    bindEnter([elements.siteInput, elements.siteLabel], addSite);

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.focusState || changes.schedules) loadData();
      if (changes.focusSessions) refreshFocusTotals();
      if (changes.focusSessions && currentView === "history") loadCalendarMonth();
      if (changes.goals) {
        goals = BiliFocus.cleanGoals(changes.goals.newValue);
        if (isGoalPanelOpen() && !goalEdit) renderGoalStats();
      }
      if (changes.wishes) {
        wishes = BiliFocus.cleanWishes(changes.wishes.newValue);
        if (isGoalPanelOpen()) renderWishes();
      }
    });
  }

  function buildThemeGrid() {
    const fragment = document.createDocumentFragment();
    BiliFocus.THEMES.forEach((theme) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "theme-card";
      card.dataset.theme = theme.id;
      card.title = `${theme.name} · ${theme.en} · ${theme.desc}`;
      card.setAttribute("aria-pressed", "false");
      card.style.setProperty("--swatch-bg", theme.bg);
      card.style.setProperty("--swatch-accent", theme.accent);
      card.style.setProperty("--swatch-text", theme.text);

      const preview = document.createElement("span");
      preview.className = "theme-preview";
      preview.setAttribute("aria-hidden", "true");
      const name = document.createElement("b");
      name.textContent = theme.name;
      const check = document.createElement("span");
      check.className = "theme-check";
      check.textContent = "✓";
      check.setAttribute("aria-hidden", "true");

      card.append(preview, name, check);
      card.addEventListener("click", () => selectTheme(theme.id));
      fragment.append(card);
    });
    elements.themeGrid.replaceChildren(fragment);
  }

  function renderThemeSelection() {
    elements.themeGrid.querySelectorAll(".theme-card").forEach((card) => {
      const active = card.dataset.theme === appearance.theme;
      card.classList.toggle("active", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function renderTimerStyleSelection() {
    elements.timerStyleGrid.querySelectorAll(".timer-style-card").forEach((card) => {
      const active = card.dataset.timerStyle === appearance.timerStyle;
      card.classList.toggle("active", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function effectiveCountdownMinutes() {
    return timerConfig.breakMinutes > 0
      ? timerConfig.focusMinutes
      : timerConfig.totalFocusMinutes;
  }

  function applyTimerConfig() {
    elements.totalFocusMinutes.value = String(timerConfig.totalFocusMinutes);
    elements.focusMinutes.value = String(timerConfig.focusMinutes);
    elements.breakMinutes.value = String(timerConfig.breakMinutes);
    elements.breakEndPopup.checked = timerConfig.breakEndPopup;
    elements.breakSkippable.checked = timerConfig.breakSkippable;
    elements.breakEnabled.checked = timerConfig.breakMinutes > 0;
    if (timerConfig.breakMinutes > 0) lastBreakMinutes = timerConfig.breakMinutes;
    selectedMinutes = effectiveCountdownMinutes();
    syncTimerConfigVisibility();
    renderMode();
  }

  function syncTimerConfigVisibility() {
    const mode = state.active ? state.mode : timerConfig.mode;
    const countup = mode === "countup";
    const restEnabled = timerConfig.breakMinutes > 0;
    elements.focusConfig.classList.toggle("hidden", countup);
    elements.focusConfig.classList.toggle("locked", state.active);
    elements.focusRestSettings.classList.toggle("hidden", !restEnabled);
  }

  function renderMode() {
    const mode = state.active ? state.mode : timerConfig.mode;
    elements.modeRow.querySelectorAll(".mode-chip").forEach((chip) => {
      const active = chip.dataset.mode === mode;
      chip.classList.toggle("active", active);
      chip.setAttribute("aria-pressed", active ? "true" : "false");
      chip.disabled = state.active;
    });

    if (state.active) {
      if (state.phase === "break") {
        elements.modeNote.textContent = "休息中";
      } else if (state.phase === "breakEnded") {
        elements.modeNote.textContent = "休息结束 · 等待继续";
      } else if (state.mode === "countup") {
        elements.modeNote.textContent = "正计时中 · 手动结束";
      } else {
        elements.modeNote.textContent = `第 ${state.cycles + 1} 次专注`;
      }
      return;
    }

    if (timerConfig.mode === "countup") {
      elements.modeNote.textContent = "不限时 · 手动结束";
    } else if (timerConfig.breakMinutes > 0) {
      elements.modeNote.textContent =
        `${timerConfig.focusMinutes} 专注 + ${timerConfig.breakMinutes} 休息`;
    } else {
      elements.modeNote.textContent = `${timerConfig.totalFocusMinutes} 分钟一次`;
    }
  }

  function selectTimerMode(mode) {
    const next = mode === "countup" ? "countup" : "countdown";
    if (next === timerConfig.mode) return;
    timerConfig = BiliFocus.cleanTimerConfig({ ...timerConfig, mode: next });
    applyTimerConfig();
    render();
    persistTimerConfig({ mode: next });
  }

  function toggleBreak(enabled) {
    if (enabled) {
      const value = lastBreakMinutes > 0 ? lastBreakMinutes : 5;
      persistTimerConfig({ breakMinutes: value });
      return;
    }
    if (timerConfig.breakMinutes > 0) lastBreakMinutes = timerConfig.breakMinutes;
    persistTimerConfig({ breakMinutes: 0 });
  }

  function bindTimerConfigNumber(input, key, min, max) {
    input.addEventListener("change", () => {
      const raw = Number(input.value);
      if (!Number.isFinite(raw)) {
        applyTimerConfig();
        return;
      }
      const value = Math.min(max, Math.max(min, Math.round(raw)));
      if (key === "breakMinutes" && value > 0) lastBreakMinutes = value;
      persistTimerConfig({ [key]: value });
      render();
    });
  }

  function readTimerConfigInputs() {
    const patch = {};
    const total = Number(elements.totalFocusMinutes.value);
    if (Number.isFinite(total)) patch.totalFocusMinutes = total;
    const focus = Number(elements.focusMinutes.value);
    if (Number.isFinite(focus)) patch.focusMinutes = focus;
    const rest = Number(elements.breakMinutes.value);
    if (Number.isFinite(rest)) patch.breakMinutes = rest;
    return patch;
  }

  // Timer config is a preference for the next session; the running snapshot
  // lives in focusState and is never rewritten from here.
  function persistTimerConfig(patch) {
    const previous = timerConfig;
    const next = BiliFocus.cleanTimerConfig({ ...timerConfig, ...patch });
    timerConfig = next;
    applyTimerConfig();
    const seq = ++timerConfigSeq;
    timerConfigPending += 1;
    timerConfigWrite = timerConfigWrite.catch(() => {}).then(async () => {
      try {
        const result = await sendMessage({ type: "saveTimerConfig", timerConfig: { ...patch } });
        if (seq !== timerConfigSeq) return false;
        if (!result?.ok) {
          timerConfig = previous;
          applyTimerConfig();
          render();
          showToast(result?.error || "计时设置保存失败", true);
          return false;
        }
        timerConfig = BiliFocus.cleanTimerConfig(result.timerConfig);
        applyTimerConfig();
        render();
        return true;
      } finally {
        timerConfigPending = Math.max(0, timerConfigPending - 1);
      }
    });
    return timerConfigWrite;
  }

  function applyAppearance(requestedTheme) {
    BiliFocus.applyTheme(document.documentElement, requestedTheme || appearance.theme, { colorScheme: true });
    document.documentElement.dataset.motion = appearance.reducedMotion ? "reduced" : "full";
    document.documentElement.dataset.timerStyle = appearance.timerStyle;
    renderThemeSelection();
    renderTimerStyleSelection();
    elements.motionToggle.checked = appearance.reducedMotion;
  }

  // localStorage is a first-paint hint only; write it after storage succeeds.
  function syncThemeCache() {
    try {
      localStorage.setItem("bf-theme", appearance.theme);
    } catch (_error) {
      // Private windows and storage pressure simply skip the boot cache.
    }
  }

  function selectTheme(id) {
    const next = BiliFocus.cleanThemeId(id);
    if (next === appearance.theme) return;
    const previous = appearance;
    appearance = { ...appearance, theme: next };
    applyAppearance();
    return persistAppearance(previous, { theme: next });
  }

  function setReducedMotion(enabled) {
    const next = Boolean(enabled);
    if (next === appearance.reducedMotion) return;
    const previous = appearance;
    appearance = { ...appearance, reducedMotion: next };
    applyAppearance();
    return persistAppearance(previous, { reducedMotion: next });
  }

  function selectTimerStyle(id) {
    const next = BiliFocus.TIMER_STYLES.includes(id) ? id : "console";
    if (next === appearance.timerStyle) return;
    const previous = appearance;
    appearance = { ...appearance, timerStyle: next };
    applyAppearance();
    return persistAppearance(previous, { timerStyle: next });
  }

  // Only send the field that changed: the worker merges it over the stored
  // appearance, so a stale snapshot can never roll back the other fields.
  // Writes are serialised so the newest click always lands last.
  function persistAppearance(previous, patch) {
    const seq = ++appearanceSeq;
    appearancePending += 1;
    appearanceWrite = appearanceWrite.catch(() => {}).then(async () => {
      try {
        const result = await sendMessage({ type: "saveAppearance", appearance: { ...patch } });
        if (seq !== appearanceSeq) return false;
        if (!result?.ok) {
          appearance = BiliFocus.cleanAppearance(previous);
          applyAppearance();
          showToast(result?.error || "设置保存失败", true);
          return false;
        }
        appearance = BiliFocus.cleanAppearance(result.appearance);
        applyAppearance();
        syncThemeCache();
        return true;
      } finally {
        appearancePending = Math.max(0, appearancePending - 1);
      }
    });
    return appearanceWrite;
  }

  function openDashboard() {
    let url = "dashboard.html";
    try {
      url = chrome.runtime.getURL("dashboard.html");
      const pending = chrome.tabs.create({ url });
      if (pending && typeof pending.catch === "function") {
        pending.catch(() => {
          try {
            window.open(url, "_blank", "noopener");
          } catch (_openError) {
            showToast("无法打开数据看板", true);
          }
        });
      }
    } catch (_error) {
      try {
        window.open(url, "_blank", "noopener");
      } catch (_openError) {
        showToast("无法打开数据看板", true);
      }
    }
  }

  function openSettings() {
    settingsReturnFocus = document.activeElement;
    elements.settingsLayer.classList.remove("hidden");
    elements.settingsLayer.setAttribute("aria-hidden", "false");
    elements.settingsOpen.setAttribute("aria-expanded", "true");
    document.body.classList.add("sheet-open");
    void elements.settingsLayer.offsetWidth;
    elements.settingsLayer.classList.add("open");
    elements.settingsClose.focus();
  }

  function closeSettings() {
    if (elements.settingsLayer.classList.contains("hidden")) return;
    elements.settingsLayer.classList.remove("open");
    elements.settingsLayer.setAttribute("aria-hidden", "true");
    elements.settingsOpen.setAttribute("aria-expanded", "false");
    document.body.classList.remove("sheet-open");
    setTimeout(() => {
      if (!elements.settingsLayer.classList.contains("open")) {
        elements.settingsLayer.classList.add("hidden");
      }
    }, appearance.reducedMotion ? 0 : 220);
    const target = settingsReturnFocus instanceof HTMLElement ? settingsReturnFocus : elements.settingsOpen;
    target.focus();
  }

  function switchView(name) {
    const target =
      name === "todo" || name === "schedule" || name === "allow" || name === "history"
        ? name
        : "focus";
    [
      elements.viewTabFocus,
      elements.viewTabTodo,
      elements.viewTabSchedule,
      elements.viewTabAllow,
      elements.viewTabHistory
    ].forEach((tab) => {
      const active = tab.dataset.view === target;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    elements.viewFocus.classList.toggle("hidden", target !== "focus");
    elements.viewTodo.classList.toggle("hidden", target !== "todo");
    elements.viewSchedule.classList.toggle("hidden", target !== "schedule");
    elements.viewAllow.classList.toggle("hidden", target !== "allow");
    elements.viewHistory.classList.toggle("hidden", target !== "history");
    const view =
      target === "todo"
        ? elements.viewTodo
        : target === "schedule"
          ? elements.viewSchedule
          : target === "allow"
            ? elements.viewAllow
            : target === "history"
              ? elements.viewHistory
              : elements.viewFocus;
    currentView = target;
    view.scrollTop = 0;
    syncNavGlider();
    if (target === "history") loadCalendarMonth();
    if (target === "todo") renderTodos();
  }

  function syncNavGlider() {
    const active = elements.viewNav.querySelector(".view-tab.active");
    if (!active) return;
    const navRect = elements.viewNav.getBoundingClientRect();
    const tabRect = active.getBoundingClientRect();
    if (!tabRect.width) return;
    const styles = getComputedStyle(elements.viewNav);
    const inset = (parseFloat(styles.borderLeftWidth) || 0) + (parseFloat(styles.paddingLeft) || 0);
    elements.navGlider.style.width = `${tabRect.width}px`;
    elements.navGlider.style.transform = `translateX(${tabRect.left - navRect.left - inset}px)`;
  }

  async function resetTheme() {
    if (appearance.theme === BiliFocus.DEFAULT_APPEARANCE.theme) {
      showToast("已经是默认配色");
      return;
    }
    const saved = await selectTheme(BiliFocus.DEFAULT_APPEARANCE.theme);
    if (saved) showToast("已恢复默认配色");
  }

  async function exportData() {
    try {
      const data = await chrome.storage.local.get(null);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `jingxin-backup-${backupDateStamp(new Date())}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("已导出当前数据");
    } catch (_error) {
      showToast("导出失败，请重试", true);
    }
  }

  function importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.style.display = "none";
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      if (!file) {
        input.remove();
        return;
      }
      readBackupFile(file).then((data) => {
        input.remove();
        applyBackup(data);
      });
    });
    document.body.append(input);
    input.click();
  }

  async function readBackupFile(file) {
    try {
      return JSON.parse(await file.text());
    } catch (_error) {
      return null;
    }
  }

  async function applyBackup(data) {
    if (!isBackupObject(data)) {
      showToast("备份文件无效", true);
      return;
    }
    try {
      await chrome.storage.local.set(data);
    } catch (_error) {
      showToast("导入失败，请重试", true);
      return;
    }
    window.location.reload();
  }

  // Only require a plain object with at least one long-lived dataset. Never
  // pin the full key list, so backups from newer versions still import.
  function isBackupObject(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return false;
    return (
      Object.prototype.hasOwnProperty.call(data, "allowlist") ||
      Object.prototype.hasOwnProperty.call(data, "focusSessions")
    );
  }

  function backupDateStamp(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  }

  async function loadData() {
    const appearanceSeqAtStart = appearanceSeq;
    const timerConfigSeqAtStart = timerConfigSeq;
    const todoSeqAtStart = todoSeq;
    const result = await sendMessage({ type: "getData" });
    if (!result?.ok) {
      showToast(result?.error || "读取设置失败", true);
      return;
    }
    const rawAppearance = result.appearance;
    const requestedTheme =
      rawAppearance && typeof rawAppearance.theme === "string" ? rawAppearance.theme : "";
    state = BiliFocus.cleanState(result.state);
    allowlist = BiliFocus.cleanAllowlist(result.allowlist);
    schedules = BiliFocus.cleanSchedules(result.schedules);
    recentSessions = BiliFocus.cleanSessions(result.sessions);
    const todosAreStale = todoSeqAtStart !== todoSeq || todoPending > 0;
    if (!todosAreStale) todos = BiliFocus.cleanTodos(result.todos);
    // A slow service worker must not overwrite a theme / timer style the user
    // already picked while this snapshot was in flight, and a queued write must
    // finish before storage is treated as the truth again.
    const appearanceIsStale = appearanceSeqAtStart !== appearanceSeq || appearancePending > 0;
    if (!appearanceIsStale) {
      appearance = BiliFocus.cleanAppearance(rawAppearance);
      applyAppearance(requestedTheme || appearance.theme);
      syncThemeCache();
    }
    const timerConfigIsStale =
      timerConfigSeqAtStart !== timerConfigSeq || timerConfigPending > 0;
    if (!timerConfigIsStale) {
      timerConfig = BiliFocus.cleanTimerConfig(result.timerConfig);
      applyTimerConfig();
    }
    elements.strict.checked = state.strict;
    elements.commentMode.value = state.commentMode;
    if (!todosAreStale) pruneSelectedTask();
    render();
    startTicker();
    if (currentView === "todo") renderTodos();
    renderTaskSelect();
    showTodoReminders(result.todoReminders);

    if (!appearanceIsStale && requestedTheme && requestedTheme !== appearance.theme) {
      const repairSeq = appearanceSeq;
      const repaired = await sendMessage({
        type: "saveAppearance",
        appearance: { theme: appearance.theme }
      });
      if (repairSeq !== appearanceSeq) return;
      if (repaired?.ok) appearance = BiliFocus.cleanAppearance(repaired.appearance);
      applyAppearance();
      syncThemeCache();
      showToast(
        `未知配色「${requestedTheme.slice(0, 24)}」，已恢复${BiliFocus.themeById(appearance.theme).name}`,
        true
      );
    }
  }

  async function loadGoalData() {
    try {
      const stored = await chrome.storage.local.get(["focusSessions", "goals", "wishes"]);
      allSessions = BiliFocus.cleanSessions(stored.focusSessions);
      goals = BiliFocus.cleanGoals(stored.goals);
      wishes = BiliFocus.cleanWishes(stored.wishes);
    } catch (_error) {
      return;
    }
    renderFocusTotals();
    renderGoalStats();
    renderWishes();
  }

  async function refreshFocusTotals() {
    const seq = (focusStatsSeq += 1);
    try {
      const stored = await chrome.storage.local.get(["focusSessions"]);
      if (seq !== focusStatsSeq) return;
      allSessions = BiliFocus.cleanSessions(stored.focusSessions);
    } catch (_error) {
      return;
    }
    renderFocusTotals();
    if (isGoalPanelOpen() && !goalEdit) renderGoalStats();
  }

  function goalRanges(now = new Date()) {
    const weekday = now.getDay() || 7;
    return {
      year: new Date(now.getFullYear(), 0, 1).getTime(),
      month: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
      week: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (weekday - 1)
      ).getTime(),
      day: new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    };
  }

  function computeFocusStats(sessions, now = new Date()) {
    const ranges = goalRanges(now);
    const stats = {
      total: { ms: 0, count: 0 },
      year: { ms: 0, count: 0 },
      month: { ms: 0, count: 0 },
      week: { ms: 0, count: 0 },
      day: { ms: 0, count: 0 }
    };
    const add = (key, session) => {
      stats[key].ms += session.focusMs;
      stats[key].count += 1;
    };
    sessions.forEach((session) => {
      add("total", session);
      if (session.startedAt >= ranges.year) add("year", session);
      if (session.startedAt >= ranges.month) add("month", session);
      if (session.startedAt >= ranges.week) add("week", session);
      if (session.startedAt >= ranges.day) add("day", session);
    });
    return stats;
  }

  function formatHours(ms) {
    const hours = Math.max(0, Number(ms) || 0) / 3600000;
    const rounded = Math.round(hours * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function renderFocusTotals() {
    if (!elements.focusTotalText) return;
    const stats = computeFocusStats(allSessions);
    elements.focusTotalText.textContent =
      `累计专注 ${formatHours(stats.total.ms)} 小时 | ` +
      `本月专注 ${formatHours(stats.month.ms)} 小时`;
  }

  function isGoalPanelOpen() {
    return !elements.goalLayer.classList.contains("hidden");
  }

  function goalPeriodNote(period, now = new Date()) {
    if (period === "year") return `${now.getFullYear()} 年`;
    if (period === "month") return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;
    if (period === "week") return BiliFocus.isoWeekKey(now);
    if (period === "day") return BiliFocus.dateKey(now);
    return "全部记录";
  }

  function renderGoalStats() {
    if (!elements.goalStats) return;
    const now = new Date();
    const stats = computeFocusStats(allSessions, now);
    const periods = ["total", ...BiliFocus.GOAL_PERIODS];
    const cards = periods.map((period) => {
      const label = GOAL_LABELS[period] || period;
      const doneMinutes = Math.round(stats[period].ms / 60000);
      const doneCount = stats[period].count;
      const target = goals[period] || { minutes: 0, count: 0 };
      const note = goalPeriodNote(period, now);
      const minutesGoal =
        period === "total"
          ? ""
          : `<button class="goal-target" type="button" data-goal-edit data-period="${period}" data-field="minutes" title="点击修改${label}专注时长目标" aria-label="修改${label}专注时长目标">${target.minutes} 分钟</button>`;
      const countGoal =
        period === "total"
          ? ""
          : `<button class="goal-target" type="button" data-goal-edit data-period="${period}" data-field="count" title="点击修改${label}专注次数目标" aria-label="修改${label}专注次数目标">${target.count} 次</button>`;
      return `
        <article class="goal-card${period === "total" ? " goal-card-total" : ""}" data-period="${period}">
          <div class="goal-card-head">
            <b>${label}</b>
            <span>${note}</span>
          </div>
          <div class="goal-row">
            <span class="goal-row-label">专注时长</span>
            <span class="goal-row-value">已完成 <em>${doneMinutes}</em> 分钟${
              period === "total" ? "" : ` / 目标 ${minutesGoal}`
            }</span>
          </div>
          <div class="goal-row">
            <span class="goal-row-label">专注次数</span>
            <span class="goal-row-value">已完成 <em>${doneCount}</em> 次${
              period === "total" ? "" : ` / 目标 ${countGoal}`
            }</span>
          </div>
        </article>`;
    });
    elements.goalStats.innerHTML = cards.join("");
  }

  function beginGoalEdit(button) {
    if (goalEdit || button.classList.contains("editing")) return;
    const period = button.dataset.period;
    const field = button.dataset.field;
    if (!BiliFocus.GOAL_PERIODS.includes(period)) return;
    if (field !== "minutes" && field !== "count") return;
    const label = GOAL_LABELS[period] || period;
    const current = goals[period] ? goals[period][field] : 0;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "1000000";
    input.step = "1";
    input.inputMode = "numeric";
    input.className = "goal-target-input";
    input.value = String(current);
    input.setAttribute("aria-label", `${label}${field === "minutes" ? "专注时长" : "专注次数"}目标`);
    button.classList.add("editing");
    button.replaceChildren(input);
    const edit = { button, period, field, current, done: false };
    goalEdit = edit;
    input.focus();
    input.select();

    const finish = async (save) => {
      if (edit.done) return;
      edit.done = true;
      if (goalEdit === edit) goalEdit = null;
      const value = save ? BiliFocus.cleanGoalNumber(input.value) : current;
      const changed = value !== current;
      goals = BiliFocus.cleanGoals({
        ...goals,
        [period]: { ...goals[period], [field]: value }
      });
      renderGoalStats();
      if (!save || !changed) return;
      try {
        await chrome.storage.local.set({ goals });
      } catch (_error) {
        showToast("目标保存失败，请重试", true);
      }
    };

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        finish(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        finish(false);
      }
    });
    input.addEventListener("blur", () => finish(true));
  }

  function openGoals() {
    goalReturnFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : elements.goalOpen;
    elements.goalLayer.classList.remove("hidden");
    elements.goalLayer.setAttribute("aria-hidden", "false");
    elements.goalOpen.setAttribute("aria-expanded", "true");
    document.body.classList.add("sheet-open");
    elements.goalBody.scrollTop = 0;
    renderGoalStats();
    renderWishes();
    refreshFocusTotals();
    elements.goalClose.focus();
  }

  function closeGoals() {
    if (!isGoalPanelOpen()) return;
    elements.goalLayer.classList.add("hidden");
    elements.goalLayer.setAttribute("aria-hidden", "true");
    elements.goalOpen.setAttribute("aria-expanded", "false");
    document.body.classList.remove("sheet-open");
    const target =
      goalReturnFocus instanceof HTMLElement ? goalReturnFocus : elements.goalOpen;
    target.focus();
  }

  const POSTER_WIDTH = 1080;
  const POSTER_HEIGHT = 1440;
  const POSTER_FONT = '"PingFang SC", "Microsoft YaHei", sans-serif';
  const POSTER_PERIODS = {
    day: { label: "今日专注", fileName: "静水拾光-今日专注.png" },
    month: { label: "本月专注", fileName: "静水拾光-本月专注.png" },
    year: { label: "今年专注", fileName: "静水拾光-今年专注.png" },
    total: { label: "总专注", fileName: "静水拾光-总专注.png" }
  };

  function isPosterPanelOpen() {
    return !elements.posterLayer.classList.contains("hidden");
  }

  function openPoster() {
    posterReturnFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : elements.posterOpen;
    elements.posterLayer.classList.remove("hidden");
    elements.posterLayer.setAttribute("aria-hidden", "false");
    elements.posterOpen.setAttribute("aria-expanded", "true");
    document.body.classList.add("sheet-open");
    elements.posterClose.focus();
  }

  function closePoster() {
    if (!isPosterPanelOpen()) return;
    elements.posterLayer.classList.add("hidden");
    elements.posterLayer.setAttribute("aria-hidden", "true");
    elements.posterOpen.setAttribute("aria-expanded", "false");
    document.body.classList.remove("sheet-open");
    const target =
      posterReturnFocus instanceof HTMLElement ? posterReturnFocus : elements.posterOpen;
    target.focus();
  }

  // 今日按 dateKey 归属，本月 / 今年按 startedAt 是否落在本地本月 / 今年区间。
  function computePosterStats(period, now, sessions) {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1).getTime();
    const todayKey = BiliFocus.dateKey(now);
    const stats = { ms: 0, count: 0 };
    sessions.forEach((session) => {
      let inPeriod = true;
      if (period === "day") {
        inPeriod = session.dateKey === todayKey;
      } else if (period === "month") {
        inPeriod = session.startedAt >= monthStart && session.startedAt < monthEnd;
      } else if (period === "year") {
        inPeriod = session.startedAt >= yearStart && session.startedAt < yearEnd;
      }
      if (!inPeriod) return;
      stats.ms += session.focusMs;
      stats.count += 1;
    });
    return stats;
  }

  async function downloadPoster(period) {
    const meta = POSTER_PERIODS[period];
    if (!meta) return;
    let sessions = allSessions;
    try {
      const stored = await chrome.storage.local.get(["focusSessions"]);
      sessions = BiliFocus.cleanSessions(stored.focusSessions);
      allSessions = sessions;
      renderFocusTotals();
    } catch (_error) {
      sessions = allSessions;
    }
    const stats = computePosterStats(period, new Date(), sessions);
    try {
      const canvas = drawPosterCanvas(meta.label, stats);
      triggerPosterDownload(canvas, meta.fileName);
      showToast(`已生成${meta.label}海报`);
    } catch (_error) {
      showToast("海报生成失败，请重试", true);
    }
  }

  function triggerPosterDownload(canvas, fileName) {
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // --bf-* 都是 theme 里定义的 hex / rgba 字符串，这里只解析这两类。
  function posterColor(value, fallback) {
    const text = String(value || "").trim();
    if (text) {
      let match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
      if (match) {
        let hex = match[1];
        if (hex.length === 3) {
          hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
        }
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16)
        };
      }
      match = /^rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)/i.exec(
        text
      );
      if (match) {
        return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
      }
    }
    return fallback;
  }

  function posterToken(styles, token, fallbackHex) {
    return posterColor(
      styles.getPropertyValue(token),
      posterColor(fallbackHex, { r: 15, g: 17, b: 21 })
    );
  }

  function mixPosterColor(from, to, ratio) {
    const t = Math.min(1, Math.max(0, ratio));
    return {
      r: from.r + (to.r - from.r) * t,
      g: from.g + (to.g - from.g) * t,
      b: from.b + (to.b - from.b) * t
    };
  }

  function posterRgba(color, alpha = 1) {
    return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`;
  }

  function posterFramePath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function drawPosterCanvas(label, stats) {
    const canvas = document.createElement("canvas");
    canvas.width = POSTER_WIDTH;
    canvas.height = POSTER_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas-2d-unavailable");

    const theme = BiliFocus.themeById(appearance.theme) || {};
    const styles = getComputedStyle(document.documentElement);
    const bg = posterToken(styles, "--bf-bg", theme.bg || "#0f1115");
    const accent = posterToken(styles, "--bf-accent", theme.accent || "#c9a86a");
    const text = posterToken(styles, "--bf-text", theme.text || "#f3eee4");
    const deep = mixPosterColor(bg, { r: 5, g: 7, b: 10 }, 0.32);
    const cx = POSTER_WIDTH / 2;

    const background = ctx.createLinearGradient(0, 0, POSTER_WIDTH * 0.32, POSTER_HEIGHT);
    background.addColorStop(0, posterRgba(bg));
    background.addColorStop(0.55, posterRgba(mixPosterColor(bg, deep, 0.45)));
    background.addColorStop(1, posterRgba(deep));
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

    const glow = ctx.createRadialGradient(
      POSTER_WIDTH * 0.2,
      POSTER_HEIGHT * 0.08,
      0,
      POSTER_WIDTH * 0.2,
      POSTER_HEIGHT * 0.08,
      POSTER_WIDTH * 0.85
    );
    glow.addColorStop(0, posterRgba(accent, 0.1));
    glow.addColorStop(1, posterRgba(accent, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

    ctx.strokeStyle = posterRgba(accent, 0.24);
    ctx.lineWidth = 2;
    ctx.beginPath();
    posterFramePath(ctx, 56, 56, POSTER_WIDTH - 112, POSTER_HEIGHT - 112, 30);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = posterRgba(accent);
    ctx.font = `700 80px ${POSTER_FONT}`;
    ctx.fillText("静水拾光", cx, 236);

    ctx.fillStyle = posterRgba(accent, 0.66);
    ctx.font = `400 36px ${POSTER_FONT}`;
    ctx.fillText("静水流深，只为值得驻留", cx, 308);

    ctx.strokeStyle = posterRgba(accent, 0.42);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 44, 362);
    ctx.lineTo(cx + 44, 362);
    ctx.stroke();

    ctx.font = `500 48px ${POSTER_FONT}`;
    ctx.lineWidth = 2;
    ctx.strokeStyle = posterRgba(accent, 0.5);
    ctx.fillStyle = posterRgba(text, 0.92);
    ctx.strokeText(label, cx, 500);
    ctx.fillText(label, cx, 500);

    const totalMinutes = Math.max(0, Math.round((Number(stats.ms) || 0) / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const duration = `${hours} 小时 ${minutes} 分钟`;
    let durationSize = 120;
    ctx.font = `600 ${durationSize}px ${POSTER_FONT}`;
    while (durationSize > 64 && ctx.measureText(duration).width > 900) {
      durationSize -= 4;
      ctx.font = `600 ${durationSize}px ${POSTER_FONT}`;
    }
    ctx.fillStyle = posterRgba(text);
    ctx.fillText(duration, cx, 720);

    ctx.font = `400 48px ${POSTER_FONT}`;
    ctx.fillStyle = posterRgba(text, 0.72);
    ctx.fillText(`专注次数 ${stats.count} 次`, cx, 836);

    ctx.strokeStyle = posterRgba(text, 0.14);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 100, 1150);
    ctx.lineTo(cx + 100, 1150);
    ctx.stroke();

    ctx.fillStyle = posterRgba(text, 0.68);
    ctx.font = `400 36px ${POSTER_FONT}`;
    ctx.fillText("拾光成卷，且待岁月生花。", cx, 1210);

    ctx.fillStyle = posterRgba(text, 0.52);
    ctx.font = `400 28px ${POSTER_FONT}`;
    ctx.fillText(BiliFocus.dateKey(), cx, 1264);

    return canvas;
  }

  function wishDateLabel(timestamp) {
    if (!timestamp) return "";
    return `${BiliFocus.dateKey(new Date(timestamp))} 达成`;
  }

  function createWishItem(wish) {
    const item = document.createElement("article");
    item.className = "wish-item";
    item.dataset.wishId = wish.id;
    const text = document.createElement("p");
    text.className = "wish-text";
    text.textContent = wish.text;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wish-complete";
    button.dataset.wishComplete = wish.id;
    button.textContent = "完成还愿";
    item.append(text, button);
    return item;
  }

  function createHonoredWish(wish) {
    const item = document.createElement("article");
    item.className = "wish-honor-item";
    item.dataset.wishId = wish.id;
    const badge = document.createElement("span");
    badge.className = "wish-honor-badge";
    badge.setAttribute("aria-hidden", "true");
    badge.textContent = "🎉";
    const copy = document.createElement("div");
    copy.className = "wish-honor-copy";
    const text = document.createElement("p");
    text.className = "wish-text";
    text.textContent = wish.text;
    const date = document.createElement("time");
    date.className = "wish-honor-date";
    date.dateTime = BiliFocus.dateKey(new Date(wish.completedAt));
    date.textContent = wishDateLabel(wish.completedAt);
    copy.append(text, date);
    item.append(badge, copy);
    return item;
  }

  function renderWishes() {
    if (!elements.wishActive || !elements.wishHonored) return;
    const active = wishes
      .filter((wish) => !wish.completedAt)
      .sort((a, b) => a.createdAt - b.createdAt);
    const honored = wishes
      .filter((wish) => wish.completedAt)
      .sort((a, b) => b.completedAt - a.completedAt);
    elements.wishActive.replaceChildren(...active.map(createWishItem));
    elements.wishHonored.replaceChildren(...honored.map(createHonoredWish));
    elements.wishActiveCount.textContent = `${active.length} 个`;
    elements.wishHonoredCount.textContent = `${honored.length} 个`;
    elements.wishActiveEmpty.classList.toggle("hidden", active.length > 0);
    elements.wishHonoredEmpty.classList.toggle("hidden", honored.length > 0);
  }

  async function persistWishes(next) {
    wishes = BiliFocus.cleanWishes(next);
    renderWishes();
    try {
      await chrome.storage.local.set({ wishes });
    } catch (_error) {
      showToast("愿望保存失败，请重试", true);
    }
  }

  function addWish() {
    const text = elements.wishInput.value.trim().slice(0, 120);
    if (!text) {
      elements.wishInput.focus();
      return;
    }
    const now = Date.now();
    const wish = {
      id: `wish-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      completedAt: 0,
      createdAt: now
    };
    elements.wishInput.value = "";
    persistWishes([...wishes, wish]);
  }

  function completeWish(id) {
    const target = wishes.find((wish) => wish.id === id && !wish.completedAt);
    if (!target) return;
    const completedAt = Date.now();
    persistWishes(
      wishes.map((wish) => (wish.id === id ? { ...wish, completedAt } : wish))
    );
  }

  function render() {
    renderTimer();
    renderAllowlist();
    renderSchedules();
    renderMode();
    syncTimerConfigVisibility();

    const phase = state.active ? state.phase : "focus";
    const mode = state.active ? state.mode : timerConfig.mode;
    const countup = mode === "countup";
    const locked = state.active && state.strict;
    const showSkip = state.active && phase === "break" && state.breakSkippable !== false;
    const showStop = state.active && !showSkip;

    elements.allowLockNote.classList.toggle("hidden", !locked);
    elements.allowCard.classList.toggle("locked", locked);
    elements.allowCard.title = locked ? "严格模式下不能修改白名单" : "";
    elements.strict.disabled = state.active || countup;
    elements.strict.checked = countup ? false : state.strict;
    elements.start.classList.toggle("hidden", state.active);
    elements.stop.classList.toggle("hidden", !showStop);
    elements.skipBreak.classList.toggle("hidden", !showSkip);
    elements.stop.disabled = state.active && state.strict && phase === "focus";
    elements.stop.title = elements.stop.disabled ? "严格模式下不能提前结束" : "";
    elements.startLabel.textContent = countup ? "开始正计时" : "开始";
    document.documentElement.dataset.phase = state.active
      ? countup
        ? "countup"
        : phase
      : countup
        ? "countup"
        : "idle";

    let statusText = "未开始";
    if (state.active) {
      if (phase === "break") statusText = "休息中";
      else if (phase === "breakEnded") statusText = "休息结束";
      else if (state.mode === "countup") statusText = "正计时中";
      else statusText = "专注中";
    }
    elements.status.textContent = statusText;
    elements.status.classList.toggle("active", state.active);

    renderTaskSelect();
    maybeShowBreakModal();
  }

  function totalFocusRemainingMs() {
    return Math.max(
      0,
      Number(state.totalFocusMinutes) * 60000 -
        Number(state.sessionFocusMs || 0) -
        (Date.now() - Number(state.phaseStartedAt))
    );
  }

  function renderTimerHint(countup, phase) {
    const hint = elements.timerRemainingHint;
    if (!hint) return;
    const breakEnabled =
      Number(state.active ? state.breakMinutes : timerConfig.breakMinutes) > 0;
    const visible =
      !countup && state.active && breakEnabled && (phase === "focus" || phase === "break");
    if (!visible) {
      hint.classList.add("hidden");
      hint.textContent = "";
      return;
    }

    hint.classList.remove("hidden");
    if (phase === "break") {
      const remainingMinutes = Math.max(0, Math.ceil(BiliFocus.remainingMs(state) / 60000));
      hint.textContent = `休息剩余 ${remainingMinutes} 分钟`;
      return;
    }

    const focusRemainingMinutes = Math.max(
      0,
      Math.ceil(BiliFocus.remainingMs(state) / 60000)
    );
    hint.textContent =
      `本次专注剩余 ${focusRemainingMinutes} 分钟 / ` +
      `距离下次休息还有 ${focusRemainingMinutes} 分钟`;
  }

  function renderTimer() {
    const activeMode = state.active ? state.mode : timerConfig.mode;
    const phase = state.active ? state.phase : "focus";
    const countup = activeMode === "countup";

    if (countup) {
      if (state.active) {
        elements.clock.textContent = BiliFocus.formatClock(BiliFocus.elapsedMs(state));
        elements.clockLabel.textContent = "正计时中 · 手动结束";
        elements.heroMode.textContent = "正计时";
      } else {
        elements.clock.textContent = "00:00";
        elements.clockLabel.textContent = "准备正计时";
        elements.heroMode.textContent = "正计时";
      }
      setProgress(0);
    } else if (state.active && phase === "break") {
      const remaining = BiliFocus.remainingMs(state);
      const total = Math.max(1, Number(state.endAt) - Number(state.phaseStartedAt));
      elements.clock.textContent = BiliFocus.formatClock(remaining);
      elements.clockLabel.textContent = "休息中";
      elements.heroMode.textContent = state.breakSkippable === false ? "休息中" : "休息 · 可跳过";
      setProgress(1 - remaining / total);
      if (remaining <= 0 && state.endAt !== lastExpiryEndAt) {
        lastExpiryEndAt = state.endAt;
        loadData();
      }
    } else if (state.active && phase === "breakEnded") {
      elements.clock.textContent = "00:00";
      elements.clockLabel.textContent = "休息结束 · 等待继续";
      elements.heroMode.textContent = "休息结束";
      setProgress(1);
    } else if (state.active) {
      const remaining = BiliFocus.remainingMs(state);
      const totalRemaining = totalFocusRemainingMs();
      const total = Math.max(1, Number(state.totalFocusMinutes) * 60000);
      const elapsedRatio = Math.min(1, Math.max(0, 1 - totalRemaining / total));
      elements.clock.textContent = BiliFocus.formatClock(totalRemaining);
      elements.clockLabel.textContent = state.auto
        ? "计划专注中"
        : state.strict
          ? "严格专注中"
          : "专注进行中";
      elements.heroMode.textContent = state.auto
        ? state.strict
          ? "计划 · 严格"
          : "计划专注"
        : state.strict
          ? "严格专注"
          : "自由专注";
      setProgress(elapsedRatio);
      if (remaining <= 0 && state.endAt !== lastExpiryEndAt) {
        lastExpiryEndAt = state.endAt;
        loadData();
      }
    } else {
      elements.clock.textContent = BiliFocus.formatClock(
        Number(timerConfig.totalFocusMinutes) * 60000
      );
      elements.clockLabel.textContent = "准备专注";
      elements.heroMode.textContent = `${timerConfig.totalFocusMinutes} 分钟`;
      setProgress(0);
      lastExpiryEndAt = 0;
    }

    renderTimerHint(countup, phase);

    const minute = Math.floor(Date.now() / 60000);
    if (minute !== lastPlanMinute) {
      lastPlanMinute = minute;
      renderNextPlan();
    }
  }

  function setProgress(ratio) {
    const percent = Math.min(100, Math.max(0, ratio * 100));
    document.documentElement.style.setProperty("--bf-progress", String(percent));
    elements.progressFill.style.width = `${percent}%`;
    elements.progressDot.style.left = `${percent}%`;
  }

  function maybeShowBreakModal() {
    const shouldShow =
      state.active && state.phase === "breakEnded" && state.breakEndPopup !== false;
    if (!shouldShow) {
      if (!elements.breakLayer.classList.contains("hidden")) hideBreakModal();
      lastBreakModalAt = -1;
      return;
    }
    const key = Number(state.breakEndedAt) || 0;
    if (key === lastBreakModalAt && elements.breakLayer.classList.contains("open")) return;
    lastBreakModalAt = key;
    elements.breakLayer.classList.remove("hidden");
    elements.breakLayer.setAttribute("aria-hidden", "false");
    void elements.breakLayer.offsetWidth;
    elements.breakLayer.classList.add("open");
    elements.breakContinue.focus();
  }

  function hideBreakModal() {
    elements.breakLayer.classList.remove("open");
    elements.breakLayer.setAttribute("aria-hidden", "true");
    elements.breakLayer.classList.add("hidden");
  }

  function renderAllowlist() {
    const total = allowlist.creators.length + allowlist.courses.length + allowlist.groups.length + allowlist.sites.length;
    elements.allowCount.textContent = `${total} 项`;
    elements.navAllowCount.textContent = String(total);
    elements.creatorEmpty.classList.toggle("hidden", allowlist.creators.length > 0);
    elements.courseEmpty.classList.toggle("hidden", allowlist.courses.length + allowlist.groups.length > 0);
    elements.siteEmpty.classList.toggle("hidden", allowlist.sites.length > 0);

    elements.creatorList.replaceChildren(
      ...allowlist.creators.map((creator) => makeItem(
        creator.name,
        `UID ${creator.mid}`,
        creator.name.slice(0, 1).toUpperCase(),
        () => removeCreator(creator.mid)
      ))
    );
    elements.courseList.replaceChildren(
      ...allowlist.groups.map((group) => makeItem(
        group.label,
        describeGroup(group),
        group.type === "cheese" ? "课" : group.type === "series" ? "系" : "合",
        () => removeGroup(group)
      )),
      ...allowlist.courses.map((course) => makeItem(
        course.label,
        `${course.mode === "prefix" ? "路径" : "页面"} · ${course.pattern}`,
        "课",
        () => removeCourse(course.pattern, course.mode)
      ))
    );
    elements.siteList.replaceChildren(
      ...allowlist.sites.map((site) => makeItem(
        site.label,
        `整个域名 · ${site.host}`,
        "网",
        () => removeSite(site.host)
      ))
    );
  }

  function renderSchedules() {
    const enabledCount = schedules.filter((schedule) => schedule.enabled).length;
    elements.scheduleCount.textContent = `${schedules.length} 个`;
    elements.navScheduleCount.textContent = String(enabledCount);
    elements.scheduleEmpty.classList.toggle("hidden", schedules.length > 0);
    elements.scheduleList.replaceChildren(...schedules.map(makeScheduleItem));
    renderNextPlan();
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function monthKeyOf(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
  }

  function shiftCalendarMonth(delta) {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + delta, 1);
    selectedDateKey = "";
    loadCalendarMonth();
  }

  async function loadCalendarMonth() {
    if (!elements.calendarGrid) return;
    const key = monthKeyOf(calendarMonth);
    elements.calendarTitle.textContent = `${calendarMonth.getFullYear()} 年 ${calendarMonth.getMonth() + 1} 月`;
    const seq = ++calendarRequestSeq;
    const result = await sendMessage({ type: "getSessions", month: key });
    if (seq !== calendarRequestSeq) return;

    if (result?.ok) {
      calendarSessions = BiliFocus.cleanSessions(result.sessions);
    } else {
      // Fallback for an older worker: the latest 50 records still make a useful
      // partial month instead of an empty calendar.
      calendarSessions = recentSessions.filter((session) => session.dateKey.startsWith(`${key}-`));
      if (!calendarSessions.length && result?.error) showToast(result.error, true);
    }

    calendarTotals = aggregateCalendar(calendarSessions);
    if (!selectedDateKey || !selectedDateKey.startsWith(`${key}-`)) {
      const today = BiliFocus.dateKey();
      if (today.startsWith(`${key}-`)) {
        selectedDateKey = today;
      } else {
        const firstWithFocus = [...calendarTotals.keys()].sort()[0];
        selectedDateKey = firstWithFocus || `${key}-01`;
      }
    }
    renderCalendar();
    renderHistoryDay();
  }

  function aggregateCalendar(sessions) {
    const totals = new Map();
    sessions.forEach((session) => {
      totals.set(session.dateKey, (totals.get(session.dateKey) || 0) + session.focusMs);
    });
    return totals;
  }

  function calendarHeatLevel(totalMs) {
    if (!(totalMs > 0)) return 0;
    // Round to minutes so a short but valid session still gets a visible level.
    const minutes = Math.max(1, Math.round(totalMs / 60000));
    if (minutes <= 30) return 1;
    if (minutes <= 60) return 2;
    if (minutes <= 120) return 3;
    return 4;
  }

  function selectCalendarDay(key) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(key || ""))) return;
    selectedDateKey = key;
    renderCalendar();
    renderHistoryDay();
  }

  function renderCalendar() {
    if (!elements.calendarGrid) return;
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const todayKey = BiliFocus.dateKey();
    const fragment = document.createDocumentFragment();

    elements.calendarTitle.textContent = `${year} 年 ${month + 1} 月`;
    for (let index = 0; index < offset; index += 1) {
      const blank = document.createElement("span");
      blank.className = "calendar-day is-blank";
      blank.setAttribute("aria-hidden", "true");
      fragment.append(blank);
    }

    for (let day = 1; day <= days; day += 1) {
      const key = `${year}-${pad2(month + 1)}-${pad2(day)}`;
      const totalMs = calendarTotals.get(key) || 0;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "calendar-day";
      button.dataset.date = key;
      button.dataset.level = String(calendarHeatLevel(totalMs));
      button.setAttribute("aria-pressed", key === selectedDateKey ? "true" : "false");
      button.setAttribute(
        "aria-label",
        `${month + 1} 月 ${day} 日${totalMs ? `，专注 ${formatFocusMs(totalMs)}` : "，无记录"}`
      );
      if (totalMs > 0) button.classList.add("has-focus");
      if (key === selectedDateKey) button.classList.add("is-selected");
      if (key === todayKey) button.classList.add("is-today");

      const number = document.createElement("span");
      number.className = "calendar-day-num";
      number.textContent = String(day);
      const focus = document.createElement("span");
      focus.className = "calendar-day-focus";
      focus.textContent = totalMs > 0 ? `${Math.max(1, Math.round(totalMs / 60000))}分` : "";
      button.append(number, focus);
      fragment.append(button);
    }

    const trailing = (7 - ((offset + days) % 7)) % 7;
    for (let index = 0; index < trailing; index += 1) {
      const blank = document.createElement("span");
      blank.className = "calendar-day is-blank";
      blank.setAttribute("aria-hidden", "true");
      fragment.append(blank);
    }

    elements.calendarGrid.replaceChildren(fragment);
    const monthTotalMs = calendarSessions.reduce((sum, session) => sum + session.focusMs, 0);
    elements.historyMonthTotal.textContent = formatFocusMs(monthTotalMs);
  }

  function renderHistoryDay() {
    if (!elements.historyList) return;
    const daySessions = calendarSessions.filter((session) => session.dateKey === selectedDateKey);
    const totalMs = daySessions.reduce((sum, session) => sum + session.focusMs, 0);
    elements.historyDayTitle.textContent = formatDayTitle(selectedDateKey);
    elements.historyDayTotal.textContent = formatFocusMs(totalMs);
    elements.historyEmpty.classList.toggle("hidden", daySessions.length > 0);
    elements.historyList.replaceChildren(...daySessions.map(makeHistoryItem));
  }

  function makeHistoryItem(session) {
    const item = document.createElement("article");
    item.className = "history-item";

    const type = document.createElement("span");
    type.className = `history-type ${
      session.source === "schedule"
        ? "is-schedule"
        : session.mode === "countup"
          ? "is-countup"
          : "is-pomodoro"
    }`;
    type.textContent = BiliFocus.sessionTypeLabel(session);

    const copy = document.createElement("div");
    copy.className = "history-copy";
    const time = document.createElement("b");
    const endsNextDay = BiliFocus.dateKey(new Date(session.endedAt)) !== session.dateKey;
    time.textContent = `${formatTimeOfDay(session.startedAt)} – ${
      endsNextDay ? "次日 " : ""
    }${formatTimeOfDay(session.endedAt)}`;
    const meta = document.createElement("small");
    meta.textContent = `${formatFocusMs(session.focusMs)} · ${sessionStatusLabel(session)}`;
    copy.append(time, meta);

    if (session.taskTitle || session.taskId) {
      const task = document.createElement("small");
      task.className = "history-task";
      task.textContent = `任务 · ${session.taskTitle || session.taskId}`;
      copy.append(task);
    }

    item.append(type, copy);
    return item;
  }

  function sessionStatusLabel(session) {
    if (session.endReason === "completed") return "已完成";
    if (session.endReason === "stopped") return "提前结束";
    if (session.endReason === "breakEnded") return "休息结束";
    if (session.endReason === "replaced") return "被替换";
    if (session.endReason === "error") return "异常结束";
    return "已结束";
  }

  function formatFocusMs(milliseconds) {
    const totalSeconds = Math.max(0, Math.round(Number(milliseconds) / 1000));
    if (!totalSeconds) return "0 分钟";
    if (totalSeconds < 60) return `${totalSeconds} 秒`;
    const minutes = Math.round(totalSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours) return rest ? `${hours} 小时 ${rest} 分钟` : `${hours} 小时`;
    return `${minutes} 分钟`;
  }

  function formatTimeOfDay(milliseconds) {
    const date = new Date(milliseconds);
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }

  function formatDayTitle(key) {
    const parts = String(key || "").split("-").map(Number);
    if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return "选择日期";
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
    const yearPrefix = year !== new Date().getFullYear() ? `${year} 年 ` : "";
    const todayPrefix = key === BiliFocus.dateKey() ? "今天 · " : "";
    return `${todayPrefix}${yearPrefix}${month} 月 ${day} 日 · ${weekday}`;
  }

  function todoTypeLabel(type) {
    if (type === "daily") return "每日";
    if (type === "weekly") return "每周";
    if (type === "once") return "单次";
    return "不限时";
  }

  function weekdayLabel(day) {
    const index = Math.max(1, Math.min(7, Number(day) || 1)) - 1;
    return ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][index];
  }

  function formatDateShort(value) {
    const parts = String(value || "").split("-");
    if (parts.length !== 3) return String(value || "");
    return Number(parts[0]) === new Date().getFullYear() ? `${parts[1]}-${parts[2]}` : value;
  }

  function formatDateTime(timestamp) {
    const date = new Date(Number(timestamp) || 0);
    return `${date.getMonth() + 1} 月 ${date.getDate()} 日 ${pad2(date.getHours())}:${pad2(
      date.getMinutes()
    )}`;
  }

  function latestCompletedPeriod(todo) {
    return todo.completedPeriods.reduce(
      (latest, item) => (!latest || item.at > latest.at ? item : latest),
      null
    );
  }

  function selectableTodos() {
    const now = new Date();
    return todos.filter((todo) => BiliFocus.isTodoAvailableForFocus(todo, now));
  }

  function pruneSelectedTask() {
    if (state.active) {
      selectedTaskId = state.taskId;
      return;
    }
    if (selectedTaskId && !selectableTodos().some((todo) => todo.id === selectedTaskId)) {
      selectedTaskId = "";
    }
  }

  function renderTaskSelect() {
    if (!elements.taskSelect) return;
    const available = selectableTodos();
    if (!state.active && selectedTaskId && !available.some((todo) => todo.id === selectedTaskId)) {
      selectedTaskId = "";
    }
    const previous = state.active ? state.taskId : selectedTaskId;
    const fragment = document.createDocumentFragment();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = available.length ? "不关联待办" : "不关联待办（暂无可用待办）";
    fragment.append(placeholder);
    available.forEach((todo) => {
      const option = document.createElement("option");
      option.value = todo.id;
      option.textContent = `${todoTypeLabel(todo.type)} · ${todo.title}`;
      fragment.append(option);
    });
    if (previous && !available.some((todo) => todo.id === previous)) {
      const todo = todos.find((item) => item.id === previous);
      const option = document.createElement("option");
      option.value = previous;
      option.textContent = todo
        ? `${todoTypeLabel(todo.type)} · ${todo.title}${state.active ? "（进行中）" : ""}`
        : "已删除的待办";
      fragment.append(option);
    }
    elements.taskSelect.replaceChildren(fragment);
    elements.taskSelect.value =
      previous && [...elements.taskSelect.options].some((option) => option.value === previous)
        ? previous
        : "";
    elements.taskSelect.disabled = state.active;
    elements.taskPickRow.classList.toggle("locked", state.active);
  }

  function updateTodoForm() {
    elements.todoTypeRow.querySelectorAll(".todo-type").forEach((button) => {
      const active = button.dataset.todoType === todoDraftType;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const once = todoDraftType === "once";
    elements.todoDueField.classList.toggle("hidden", !once);
    if (once && !elements.todoDueDate.value) elements.todoDueDate.value = BiliFocus.dateKey();
    const remindOn = elements.todoRemind.checked;
    elements.todoRemindTime.disabled = !remindOn;
    elements.todoRemindDay.classList.toggle("hidden", todoDraftType !== "weekly");
    elements.todoRemindDay.disabled = !remindOn || todoDraftType !== "weekly";
    if (remindOn && !elements.todoRemindTime.value) elements.todoRemindTime.value = "09:00";
    elements.todoAddHint.textContent =
      todoDraftType === "once"
        ? "单次必须选日期；到期后不再显示。"
        : todoDraftType === "weekly"
          ? "每周按 ISO 周判定完成，跨周自动重置。"
          : todoDraftType === "unlimited"
            ? "没有截止日期，完成或舍弃后结束。"
            : "每日按本地日期判定完成，跨天自动重置。";
  }

  function makeTodoId() {
    return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.slice(0, 64);
  }

  function addTodo() {
    const title = elements.todoTitle.value.trim();
    if (!title) {
      showToast("先写待办标题", true);
      elements.todoTitle.focus();
      return;
    }
    const type = todoDraftType;
    const dueDate = type === "once" ? elements.todoDueDate.value : "";
    if (type === "once" && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      showToast("单次待办需要选择日期", true);
      return;
    }
    const deadline = elements.todoDeadline.value || "";
    if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
      showToast("截止日期格式不正确", true);
      return;
    }
    if (type === "once" && deadline && deadline < dueDate) {
      showToast("截止日期不能早于单次日期", true);
      return;
    }
    const remindEnabled = elements.todoRemind.checked;
    const remindTime = elements.todoRemindTime.value || "09:00";
    if (remindEnabled && !/^\d{2}:\d{2}$/.test(remindTime)) {
      showToast("提醒时间格式不正确", true);
      return;
    }
    const todo = {
      id: makeTodoId(),
      title,
      type,
      dueDate,
      deadline,
      remindEnabled,
      remindTime,
      remindDay: Number(elements.todoRemindDay.value) || 1,
      createdAt: Date.now(),
      completedAt: 0,
      abandonedAt: 0,
      completedPeriods: [],
      skippedPeriods: [],
      lastReminderKey: ""
    };
    persistTodos([todo, ...todos]);
    elements.todoTitle.value = "";
    elements.todoDeadline.value = "";
    elements.todoRemind.checked = false;
    updateTodoForm();
    showToast("待办已添加");
  }

  function persistTodos(next) {
    const snapshot = BiliFocus.cleanTodos(next);
    const seq = ++todoSeq;
    todoPending += 1;
    todos = snapshot;
    pruneSelectedTask();
    renderTodos();
    renderTaskSelect();
    let failed = false;
    todoWrite = todoWrite
      .catch(() => {})
      .then(async () => {
        const result = await sendMessage({ type: "saveTodos", todos: snapshot });
        if (seq !== todoSeq) return false;
        if (!result?.ok) {
          failed = true;
          showToast(result?.error || "待办保存失败", true);
          return false;
        }
        todos = BiliFocus.cleanTodos(result.todos);
        pruneSelectedTask();
        renderTodos();
        renderTaskSelect();
        render();
        return true;
      })
      .finally(() => {
        todoPending = Math.max(0, todoPending - 1);
        if (failed) loadData();
      });
    return todoWrite;
  }

  function handleTodoListClick(event) {
    const button = event.target.closest("button[data-todo-action]");
    if (!button) return;
    const todo = todos.find((item) => item.id === button.dataset.todoId);
    if (!todo) return;
    if (button.dataset.todoAction === "complete") toggleTodoComplete(todo);
    if (button.dataset.todoAction === "skip") toggleTodoSkip(todo);
    if (button.dataset.todoAction === "abandon") abandonTodo(todo);
  }

  function toggleTodoComplete(todo) {
    const now = Date.now();
    if (todo.type === "daily" || todo.type === "weekly") {
      const key = BiliFocus.todoPeriodKey(todo, new Date(now));
      const done = todo.completedPeriods.some((item) => item.key === key);
      const completedPeriods = done
        ? todo.completedPeriods.filter((item) => item.key !== key)
        : [...todo.completedPeriods.filter((item) => item.key !== key), { key, at: now }];
      const skippedPeriods = done
        ? todo.skippedPeriods
        : todo.skippedPeriods.filter((item) => item.key !== key);
      persistTodos(
        todos.map((item) =>
          item.id === todo.id ? { ...item, completedPeriods, skippedPeriods } : item
        )
      );
      showToast(done ? "已取消本期完成" : "本期已完成");
      return;
    }
    const completed = todo.completedAt > 0;
    persistTodos(
      todos.map((item) =>
        item.id === todo.id
          ? { ...item, completedAt: completed ? 0 : now, abandonedAt: 0 }
          : item
      )
    );
    showToast(completed ? "已取消完成" : "已完成");
  }

  function toggleTodoSkip(todo) {
    if (todo.type !== "daily" && todo.type !== "weekly") return;
    const now = Date.now();
    const key = BiliFocus.todoPeriodKey(todo, new Date(now));
    const skipped = todo.skippedPeriods.some((item) => item.key === key);
    const skippedPeriods = skipped
      ? todo.skippedPeriods.filter((item) => item.key !== key)
      : [...todo.skippedPeriods.filter((item) => item.key !== key), { key, at: now }];
    const completedPeriods = skipped
      ? todo.completedPeriods
      : todo.completedPeriods.filter((item) => item.key !== key);
    persistTodos(
      todos.map((item) =>
        item.id === todo.id ? { ...item, completedPeriods, skippedPeriods } : item
      )
    );
    showToast(skipped ? "已恢复本期" : "本期已跳过");
  }

  function abandonTodo(todo) {
    persistTodos(
      todos.map((item) =>
        item.id === todo.id
          ? { ...item, abandonedAt: Date.now(), completedAt: 0 }
          : item
      )
    );
    showToast("已舍弃");
  }

  function setTodoCompletedMode(value) {
    todoCompletedMode = Boolean(value);
    elements.todoCompletedToggle.classList.toggle("active", todoCompletedMode);
    elements.todoCompletedToggle.setAttribute("aria-pressed", String(todoCompletedMode));
    renderTodos();
    elements.viewTodo.scrollTop = 0;
  }

  function renderTodos() {
    if (!elements.todoList) return;
    const now = new Date();
    const active = todos.filter(
      (todo) =>
        !todo.abandonedAt &&
        !(todo.type === "once" || todo.type === "unlimited" ? todo.completedAt : false) &&
        !BiliFocus.isTodoExpired(todo, now)
    );
    const completed = todos.filter(
      (todo) => todo.abandonedAt || todo.completedAt || todo.completedPeriods.length
    );
    elements.todoCount.textContent = `${active.length} 条`;
    elements.todoCompletedCount.textContent = String(completed.length);
    elements.todoCompletedToggle.classList.toggle("has-items", completed.length > 0);
    elements.todoCompletedToggle.classList.toggle("active", todoCompletedMode);
    elements.todoCompletedToggle.setAttribute(
      "aria-pressed",
      todoCompletedMode ? "true" : "false"
    );

    if (todoCompletedMode) {
      elements.todoAddCard.classList.add("hidden");
      elements.todoList.classList.add("hidden");
      elements.todoEmpty.classList.add("hidden");
      elements.todoCompleted.classList.remove("hidden");
      elements.todoCompletedEmpty.classList.toggle("hidden", completed.length > 0);
      elements.todoCompletedList.replaceChildren(...completed.map(makeCompletedTodoItem));
      return;
    }

    elements.todoAddCard.classList.remove("hidden");
    elements.todoList.classList.remove("hidden");
    elements.todoCompleted.classList.add("hidden");
    elements.todoEmpty.classList.toggle("hidden", active.length > 0);
    elements.todoList.replaceChildren(...active.map(makeTodoItem));
  }

  function makeTodoItem(todo) {
    const item = document.createElement("article");
    item.className = "todo-item";

    const top = document.createElement("div");
    top.className = "todo-item-top";
    const type = document.createElement("span");
    type.className = `todo-type is-${todo.type}`;
    type.textContent = todoTypeLabel(todo.type);
    const title = document.createElement("b");
    title.className = "todo-title";
    title.textContent = todo.title;
    top.append(type, title);
    if (todo.remindEnabled && todo.remindTime) {
      const reminder = document.createElement("span");
      reminder.className = "todo-remind-tag";
      reminder.textContent = `${
        todo.type === "weekly" ? `${weekdayLabel(todo.remindDay)} ` : ""
      }${todo.remindTime}`;
      top.append(reminder);
    }

    const meta = document.createElement("div");
    meta.className = "todo-item-meta";
    const metaParts = [todoTypeLabel(todo.type)];
    if (todo.type === "once") metaParts.push(formatDateShort(todo.dueDate));
    if (todo.deadline) metaParts.push(`截止 ${formatDateShort(todo.deadline)}`);
    if (todo.type === "daily" || todo.type === "weekly") {
      if (BiliFocus.isTodoDone(todo)) metaParts.push("本期已完成");
      else if (BiliFocus.isTodoSkipped(todo)) metaParts.push("本期跳过");
    }
    meta.textContent = metaParts.join(" · ");

    const actions = document.createElement("div");
    actions.className = "todo-item-actions";
    const done =
      todo.type === "daily" || todo.type === "weekly"
        ? BiliFocus.isTodoDone(todo)
        : todo.completedAt > 0;
    const complete = document.createElement("button");
    complete.type = "button";
    complete.className = "todo-action primary";
    complete.dataset.todoAction = "complete";
    complete.dataset.todoId = todo.id;
    complete.textContent = done ? "撤销完成" : "完成";
    actions.append(complete);

    if (todo.type === "daily" || todo.type === "weekly") {
      const skipped = BiliFocus.isTodoSkipped(todo);
      const skip = document.createElement("button");
      skip.type = "button";
      skip.className = "todo-action";
      skip.dataset.todoAction = "skip";
      skip.dataset.todoId = todo.id;
      skip.textContent = skipped ? "恢复本期" : "跳过本期";
      actions.append(skip);
    }

    const abandon = document.createElement("button");
    abandon.type = "button";
    abandon.className = "todo-action danger";
    abandon.dataset.todoAction = "abandon";
    abandon.dataset.todoId = todo.id;
    abandon.textContent = "舍弃";
    actions.append(abandon);

    item.append(top, meta, actions);
    return item;
  }

  function makeCompletedTodoItem(todo) {
    const item = document.createElement("article");
    item.className = "todo-completed-item";

    const top = document.createElement("div");
    top.className = "todo-item-top";
    const type = document.createElement("span");
    type.className = `todo-type is-${todo.type}`;
    type.textContent = todoTypeLabel(todo.type);
    const title = document.createElement("b");
    title.className = "todo-title";
    title.textContent = todo.title;
    top.append(type, title);
    item.append(top);

    if (todo.abandonedAt) {
      const line = document.createElement("small");
      line.textContent = `已舍弃 · ${formatDateTime(todo.abandonedAt)}`;
      item.append(line);
    }
    if (todo.completedAt) {
      const line = document.createElement("small");
      line.textContent = `完成于 ${formatDateTime(todo.completedAt)}`;
      item.append(line);
    }
    if (todo.completedPeriods.length) {
      const latest = latestCompletedPeriod(todo);
      const line = document.createElement("small");
      line.textContent = `已完成 ${todo.completedPeriods.length} 次${
        latest ? ` · 最近 ${latest.key}` : ""
      }`;
      item.append(line);
    }
    return item;
  }

  async function showTodoReminders(list) {
    let badge = "";
    try {
      badge = await chrome.action.getBadgeText({});
    } catch (_error) {
      return;
    }
    if (badge !== "!") return;
    const reminders = Array.isArray(list)
      ? [...new Set(list.filter((item) => typeof item === "string" && item.trim()))]
      : [];
    const summary = reminders.length
      ? `${reminders
          .slice(0, 2)
          .map((item) => (item.length > 14 ? `${item.slice(0, 14)}…` : item))
          .join("、")}${reminders.length > 2 ? ` 等 ${reminders.length} 条` : ""}`
      : "有待办提醒";
    if (summary === reminderToastKey) return;
    reminderToastKey = summary;
    showToast(`待办提醒：${summary}`);
    sendMessage({ type: "ackTodoReminders" });
  }


  function makeScheduleItem(schedule) {
    const item = document.createElement("div");
    item.className = schedule.enabled ? "schedule-item" : "schedule-item disabled";

    const time = document.createElement("div");
    time.className = "schedule-time";
    const start = document.createElement("b");
    start.textContent = schedule.start;
    const end = document.createElement("span");
    end.textContent = schedule.end;
    time.append(start, end);

    const copy = document.createElement("div");
    copy.className = "schedule-copy";
    const title = document.createElement("b");
    title.textContent = schedule.label || "专注计划";
    const meta = document.createElement("small");
    meta.textContent =
      `${BiliFocus.scheduleDaysLabel(schedule.days)} · ` +
      `${BiliFocus.formatDurationLabel(BiliFocus.scheduleDurationMinutes(schedule.start, schedule.end))}` +
      (schedule.strict ? " · 严格" : "");
    copy.append(title, meta);

    const toggle = document.createElement("label");
    toggle.className = "schedule-toggle";
    toggle.title = schedule.enabled ? "暂停计划" : "启用计划";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = schedule.enabled;
    input.setAttribute("aria-label", schedule.enabled ? "暂停计划" : "启用计划");
    input.addEventListener("change", () => toggleSchedule(schedule.id, input.checked));
    const track = document.createElement("i");
    toggle.append(input, track);

    const remove = document.createElement("button");
    remove.className = "schedule-remove";
    remove.type = "button";
    remove.title = "删除计划";
    remove.textContent = "×";
    remove.addEventListener("click", () => removeSchedule(schedule.id));

    item.append(time, copy, toggle, remove);
    return item;
  }

  function renderNextPlan() {
    const enabled = schedules.filter((schedule) => schedule.enabled);
    if (!schedules.length) {
      elements.nextPlanTitle.textContent = "还没有专注计划";
      elements.nextPlanSub.textContent = "去计划页添加一个时间段";
      return;
    }
    if (!enabled.length) {
      elements.nextPlanTitle.textContent = "计划已全部暂停";
      elements.nextPlanSub.textContent = "在计划页启用一个时段";
      return;
    }

    const now = new Date();
    let active = null;
    for (const schedule of enabled) {
      const window = BiliFocus.activeScheduleWindow(schedule, now);
      if (window) {
        active = { schedule, window };
        break;
      }
    }
    if (active) {
      const end = new Date(active.window.endAt);
      elements.nextPlanTitle.textContent = `${active.schedule.label} · ${active.schedule.start}–${active.schedule.end}`;
      elements.nextPlanSub.textContent =
        state.active && state.auto
          ? `计划专注中 · ${formatTimeLabel(end)} 结束`
          : `计划时段内 · ${formatTimeLabel(end)} 结束`;
      return;
    }

    let next = null;
    for (const schedule of enabled) {
      const window = BiliFocus.nextScheduleWindow(schedule, now);
      if (window && (!next || window.startAt < next.window.startAt)) next = { schedule, window };
    }
    if (!next) {
      elements.nextPlanTitle.textContent = "暂无下一个计划";
      elements.nextPlanSub.textContent = "在计划页调整时间段";
      return;
    }

    const start = new Date(next.window.startAt);
    elements.nextPlanTitle.textContent = `${next.schedule.label} · ${next.schedule.start}–${next.schedule.end}`;
    elements.nextPlanSub.textContent =
      `${dayLabel(start, now)} ${next.schedule.start} · ${relativeLabel(next.window.startAt - now.getTime())}`;
  }

  async function addSchedule() {
    const days = [...selectedDays].sort((a, b) => a - b);
    if (!days.length) {
      showToast("至少选择一天", true);
      return;
    }
    const start = elements.scheduleStart.value;
    const end = elements.scheduleEnd.value;
    const duration = BiliFocus.scheduleDurationMinutes(start, end);
    if (!duration) {
      showToast("开始和结束时间不能相同", true);
      return;
    }
    if (duration > 240) {
      showToast("单个计划最长 4 小时", true);
      return;
    }

    const id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const schedule = BiliFocus.cleanSchedule({
      id,
      label: elements.scheduleLabel.value,
      days,
      start,
      end,
      enabled: true,
      strict: elements.scheduleStrict.checked
    });
    if (!schedule) {
      showToast("计划信息不完整", true);
      return;
    }
    const saved = await persistSchedules([...schedules, schedule], "计划已添加");
    if (saved) elements.scheduleLabel.value = "";
  }

  function toggleSchedule(id, enabled) {
    const next = schedules.map((schedule) => (schedule.id === id ? { ...schedule, enabled } : schedule));
    persistSchedules(next, enabled ? "计划已启用" : "计划已暂停");
  }

  function removeSchedule(id) {
    const target = schedules.find((schedule) => schedule.id === id);
    persistSchedules(
      schedules.filter((schedule) => schedule.id !== id),
      target ? `已删除「${target.label}」` : "已删除计划"
    );
  }

  async function persistSchedules(next, message) {
    const result = await sendMessage({ type: "saveSchedules", schedules: next });
    if (!result?.ok) {
      showToast(result?.error || "计划保存失败", true);
      return false;
    }
    schedules = BiliFocus.cleanSchedules(result.schedules);
    renderSchedules();
    if (message) showToast(message);
    return true;
  }

  function renderSchedulePreview() {
    const duration = BiliFocus.scheduleDurationMinutes(elements.scheduleStart.value, elements.scheduleEnd.value);
    elements.scheduleDuration.classList.remove("invalid");
    if (!duration) {
      elements.scheduleDuration.textContent = "时段无效";
      elements.scheduleDuration.classList.add("invalid");
      return;
    }
    if (duration > 240) {
      elements.scheduleDuration.textContent = "超过 4 小时";
      elements.scheduleDuration.classList.add("invalid");
      return;
    }
    elements.scheduleDuration.textContent = BiliFocus.formatDurationLabel(duration);
  }

  function formatTimeLabel(date) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function dayLabel(date, now) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "今天";
    if (diff === 1) return "明天";
    if (diff === 2) return "后天";
    const names = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return names[date.getDay()];
  }

  function relativeLabel(milliseconds) {
    if (milliseconds <= 60000) return "即将开始";
    const minutes = Math.ceil(milliseconds / 60000);
    if (minutes < 60) return `还有 ${minutes} 分钟`;
    const hours = Math.ceil(minutes / 60);
    if (hours < 48) return `还有 ${hours} 小时`;
    return `还有 ${Math.round(hours / 24)} 天`;
  }

  function makeItem(title, subtitle, avatar, onRemove) {
    const row = document.createElement("div");
    row.className = "item";
    const mark = document.createElement("span");
    mark.className = "avatar";
    mark.textContent = avatar;
    const copy = document.createElement("div");
    copy.className = "copy";
    const bold = document.createElement("b");
    bold.textContent = title;
    const small = document.createElement("small");
    small.textContent = subtitle;
    copy.append(bold, small);
    const remove = document.createElement("button");
    remove.className = "remove";
    remove.type = "button";
    remove.title = "移除";
    remove.textContent = "×";
    remove.addEventListener("click", onRemove);
    row.append(mark, copy, remove);
    return row;
  }

  async function addCreator() {
    const mid = BiliFocus.extractMid(elements.creatorInput.value);
    if (!mid) {
      showToast("请填写正确的 UID 或空间链接", true);
      return;
    }
    if (allowlist.creators.some((item) => item.mid === mid)) {
      showToast("这个 UP 主已经在列表里", true);
      return;
    }

    const name = elements.creatorName.value.trim() || `UID ${mid}`;
    const next = {
      ...allowlist,
      creators: [...allowlist.creators, { mid, name }]
    };
    if (await persistAllowlist(next)) {
      elements.creatorInput.value = "";
      elements.creatorName.value = "";
      showToast("已添加 UP 主");
    }
  }

  async function addCurrentCreator() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || !BiliFocus.isBilibiliUrl(tab.url)) {
      showToast("请先打开 UP 主空间或普通视频页", true);
      return;
    }
    elements.addCurrent.disabled = true;
    elements.addCurrent.textContent = "正在识别…";
    const result = await sendMessage({ type: "resolveCreator", url: tab.url });
    elements.addCurrent.disabled = false;
    elements.addCurrent.textContent = "＋ 添加当前 B 站页面的 UP 主";
    if (!result?.ok) {
      showToast(result?.error || "没有识别到 UP 主", true);
      return;
    }
    if (allowlist.creators.some((item) => item.mid === result.mid)) {
      showToast("这个 UP 主已经在列表里", true);
      return;
    }
    const next = {
      ...allowlist,
      creators: [...allowlist.creators, { mid: result.mid, name: result.name }]
    };
    if (await persistAllowlist(next)) showToast(`已添加 ${result.name}`);
  }

  async function addCourse() {
    let rule;
    try {
      rule = BiliFocus.normalizeCourseRule(elements.courseInput.value, elements.courseLabel.value);
    } catch (error) {
      showToast(error.message || "课程链接不正确", true);
      return;
    }
    if (allowlist.courses.some((item) => item.pattern === rule.pattern && item.mode === rule.mode)) {
      showToast("这个链接已经在列表里", true);
      return;
    }
    const next = { ...allowlist, courses: [...allowlist.courses, rule] };
    if (await persistAllowlist(next)) {
      elements.courseInput.value = "";
      elements.courseLabel.value = "";
      showToast("已添加课程 / 视频");
    }
  }

  async function addCurrentGroup() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || !BiliFocus.isBilibiliUrl(tab.url)) {
      showToast("请先打开 B 站合集、系列或课程页面", true);
      return;
    }

    const idleText = "＋ 添加当前合集 / 整门课程";
    elements.addCurrentGroup.disabled = true;
    elements.addCurrentGroup.textContent = "正在识别整组内容…";
    const result = await sendMessage({ type: "resolveContentGroup", url: tab.url, title: tab.title || "" });
    elements.addCurrentGroup.disabled = false;
    elements.addCurrentGroup.textContent = idleText;
    if (!result?.ok) {
      showToast(result?.error || "当前页面没有识别到整组内容", true);
      return;
    }

    const group = BiliFocus.cleanGroupRule(result.group);
    if (!group) {
      showToast("识别到的合集信息不完整", true);
      return;
    }
    if (allowlist.groups.some((item) => BiliFocus.groupKey(item) === BiliFocus.groupKey(group))) {
      showToast("这个合集或课程已经在列表里", true);
      return;
    }

    const next = { ...allowlist, groups: [...allowlist.groups, group] };
    if (await persistAllowlist(next)) showToast(`已整组放行：${group.label}`);
  }

  async function addSite() {
    let rule;
    try {
      rule = BiliFocus.normalizeSiteRule(elements.siteInput.value, elements.siteLabel.value);
    } catch (error) {
      showToast(error.message || "网站域名不正确", true);
      return;
    }
    if (allowlist.sites.some((item) => item.host === rule.host)) {
      showToast("这个网站已经在列表里", true);
      return;
    }

    const next = { ...allowlist, sites: [...allowlist.sites, rule] };
    if (await persistAllowlist(next)) {
      elements.siteInput.value = "";
      elements.siteLabel.value = "";
      showToast(`已放行 ${rule.host}`);
    }
  }

  async function addCurrentSite() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url || !/^https?:\/\//i.test(tab.url)) {
      showToast("当前页面不是普通网站", true);
      return;
    }

    let rule;
    try {
      rule = BiliFocus.normalizeSiteRule(tab.url, tab.title || "");
    } catch (error) {
      showToast(error.message || "当前网站不能添加", true);
      return;
    }
    if (allowlist.sites.some((item) => item.host === rule.host)) {
      showToast("这个网站已经在列表里", true);
      return;
    }

    const next = { ...allowlist, sites: [...allowlist.sites, rule] };
    if (await persistAllowlist(next)) showToast(`已放行 ${rule.host}`);
  }

  function removeCreator(mid) {
    persistAllowlist({ ...allowlist, creators: allowlist.creators.filter((item) => item.mid !== mid) });
  }

  function removeCourse(pattern, mode) {
    persistAllowlist({
      ...allowlist,
      courses: allowlist.courses.filter((item) => item.pattern !== pattern || item.mode !== mode)
    });
  }

  function removeGroup(group) {
    const key = BiliFocus.groupKey(group);
    persistAllowlist({
      ...allowlist,
      groups: allowlist.groups.filter((item) => BiliFocus.groupKey(item) !== key)
    });
  }

  function describeGroup(group) {
    if (group.type === "cheese") return `整门系列课程 · ss${group.id}`;
    if (group.type === "series") return `整个视频系列 · ID ${group.id}`;
    return `整个视频合集 · ID ${group.id}`;
  }

  function removeSite(host) {
    persistAllowlist({ ...allowlist, sites: allowlist.sites.filter((item) => item.host !== host) });
  }

  async function persistAllowlist(next) {
    const result = await sendMessage({ type: "saveAllowlist", allowlist: next });
    if (!result?.ok) {
      showToast(result?.error || "保存失败", true);
      return false;
    }
    allowlist = BiliFocus.cleanAllowlist(result.allowlist);
    renderAllowlist();
    return true;
  }

  function queuePreferenceSave() {
    clearTimeout(preferenceTimer);
    preferenceTimer = setTimeout(persistPreferences, 250);
  }

  function persistPreferences() {
    clearTimeout(preferenceTimer);
    if (
      timerConfig.mode === "countup" ||
      state.active ||
      !Number.isFinite(selectedMinutes) ||
      selectedMinutes < 1 ||
      selectedMinutes > 240
    ) {
      return settingsWrite;
    }
    const minutes = selectedMinutes;
    const strict = elements.strict.checked;
    return queueSettingsWrite(async () => {
      const result = await sendMessage({ type: "savePreferences", minutes, strict });
      if (result?.ok) state = BiliFocus.cleanState(result.state);
    });
  }

  function saveCommentMode() {
    const mode = elements.commentMode.value;
    return queueSettingsWrite(async () => {
      const result = await sendMessage({ type: "saveCommentMode", mode });
      if (!result?.ok) {
        elements.commentMode.value = state.commentMode;
        showToast(result?.error || "评论区设置保存失败", true);
        return;
      }
      state = BiliFocus.cleanState(result.state);
      elements.commentMode.value = state.commentMode;
      const label = state.commentMode === "always" ? "始终遮蔽" : state.commentMode === "focus" ? "仅专注时遮蔽" : "不遮蔽";
      showToast(`评论区：${label}`);
    });
  }

  function queueSettingsWrite(operation) {
    settingsWrite = settingsWrite.catch(() => {}).then(operation);
    return settingsWrite;
  }

  function bindEnter(inputs, handler) {
    inputs.forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" || event.isComposing) return;
        event.preventDefault();
        handler();
      });
    });
  }

  async function startFocus() {
    const mode = timerConfig.mode;
    clearTimeout(preferenceTimer);
    elements.start.disabled = true;
    try {
      const patch = readTimerConfigInputs();
      if (Object.keys(patch).length) await persistTimerConfig(patch);
      const minutes =
        mode === "countup" ? timerConfig.focusMinutes : effectiveCountdownMinutes();
      if (
        mode === "countdown" &&
        (!Number.isFinite(minutes) || minutes < 1 || minutes > 240)
      ) {
        showToast("单次倒计时最长 240 分钟，请开启休息或调小总时长", true);
        return;
      }
      if (mode !== "countup") await persistPreferences();
      const result = await sendMessage({
        type: "startFocus",
        mode,
        minutes,
        taskId: selectedTaskId,
        strict: mode === "countup" ? false : elements.strict.checked
      });
      if (!result?.ok) {
        showToast(result?.error || "启动失败", true);
        return;
      }
      state = BiliFocus.cleanState(result.state);
      selectedTaskId = state.taskId;
      render();
      showToast(
        mode === "countup"
          ? "正计时开始，未允许的网站已拦截"
          : "专注开始，未允许的网站已拦截"
      );
    } finally {
      elements.start.disabled = false;
    }
  }

  async function stopFocus() {
    const result = await sendMessage({ type: "stopFocus" });
    if (!result?.ok) {
      showToast(result?.error || "无法结束", true);
      return;
    }
    state = BiliFocus.cleanState(result.state);
    hideBreakModal();
    lastBreakModalAt = -1;
    render();
    showToast("本次专注已结束");
  }

  async function skipBreak() {
    const result = await sendMessage({ type: "skipBreak" });
    if (!result?.ok) {
      showToast(result?.error || "无法跳过休息", true);
      return;
    }
    state = BiliFocus.cleanState(result.state);
    hideBreakModal();
    lastBreakModalAt = -1;
    render();
    showToast("已跳过休息，继续专注");
  }

  async function continueFocus() {
    const result = await sendMessage({ type: "continueFocus" });
    if (!result?.ok) {
      showToast(result?.error || "无法继续", true);
      return;
    }
    state = BiliFocus.cleanState(result.state);
    hideBreakModal();
    lastBreakModalAt = -1;
    render();
    showToast("开始下一次专注");
  }

  function startTicker() {
    if (ticker) clearInterval(ticker);
    ticker = setInterval(renderTimer, 1000);
  }

  function showToast(message, isError = false) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.toggle("error", isError);
    elements.toast.classList.add("show");
    toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2600);
  }

  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) resolve({ ok: false, error: "扩展后台暂时不可用" });
        else resolve(response);
      });
    });
  }

  
  // 一键复制 QQ 群号
  const copyQqBtn = document.getElementById("copy-qq-btn");
  if (copyQqBtn) {
    copyQqBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText("1128599418");
        const originalText = copyQqBtn.textContent;
        copyQqBtn.textContent = "✅ 群号已复制！";
        copyQqBtn.style.color = "var(--bf-accent)";
        setTimeout(() => {
          copyQqBtn.textContent = originalText;
          copyQqBtn.style.color = "";
        }, 2000);
      } catch (err) {
        showToast("复制失败，请手动输入群号：1128599418", true);
      }
    });
  }
  // 赞助弹窗逻辑
  const openSponsorBtn = document.getElementById("open-sponsor-btn");
  const closeSponsorBtn = document.getElementById("close-sponsor-btn");
  const sponsorModal = document.getElementById("sponsor-modal");

  if (openSponsorBtn && closeSponsorBtn && sponsorModal) {
    const setSponsorOpen = (open) => {
      sponsorModal.classList.toggle("hidden", !open);
      sponsorModal.setAttribute("aria-hidden", open ? "false" : "true");
    };
    openSponsorBtn.addEventListener("click", () => setSponsorOpen(true));
    closeSponsorBtn.addEventListener("click", () => setSponsorOpen(false));
    sponsorModal.addEventListener("click", (event) => {
      if (event.target === sponsorModal) setSponsorOpen(false);
    });
  }
 
})(); 
