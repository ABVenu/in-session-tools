/* ── Slide navigation ── */
const slides = document.querySelectorAll(".slide");
let currentSlide = 0;

function showSlide(index) {
  currentSlide = Math.max(0, Math.min(index, slides.length - 1));
  slides.forEach((s, i) => s.classList.toggle("active", i === currentSlide));
}

document.addEventListener("keydown", (e) => {
  if (e.target.matches("input")) return;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    showSlide(currentSlide + 1);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    showSlide(currentSlide - 1);
  }
});

/* ── Independent timers ── */
const RING_CIRCUMFERENCE = 314.16;

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (_) { /* optional */ }
}

function createTimer(config) {
  const {
    defaultMinutes,
    minutesInput,
    display,
    ringWrap,
    ringProgress,
    status,
    btnStart,
    btnPause,
    btnReset,
    readyMessage,
    runningMessage,
    getRunningMessage,
  } = config;

  function resolveRunningMessage() {
    if (typeof getRunningMessage === "function") return getRunningMessage();
    return runningMessage;
  }

  let totalSeconds = defaultMinutes * 60;
  let remainingSeconds = totalSeconds;
  let timerInterval = null;
  let isRunning = false;
  let isPaused = false;

  function setDuration() {
    if (minutesInput) {
      const mins = Math.max(1, Math.min(120, parseInt(minutesInput.value, 10) || defaultMinutes));
      minutesInput.value = mins;
      totalSeconds = mins * 60;
    } else {
      totalSeconds = defaultMinutes * 60;
    }
    if (!isRunning) {
      remainingSeconds = totalSeconds;
      updateDisplay();
    }
  }

  function updateDisplay() {
    const timeStr = formatTime(remainingSeconds);
    const progress = remainingSeconds / totalSeconds;
    const offset = RING_CIRCUMFERENCE * (1 - progress);

    display.textContent = timeStr;
    display.classList.remove("warning", "danger");
    ringWrap.classList.remove("danger");
    ringProgress.style.strokeDashoffset = offset;

    if (remainingSeconds <= 60 && remainingSeconds > 0) {
      display.classList.add("danger");
      ringWrap.classList.add("danger");
      status.textContent = remainingSeconds <= 10
        ? `⚠️ ${remainingSeconds} seconds left!`
        : "⚠️ Last 1 minute — hurry up!";
    } else if (remainingSeconds <= 120 && remainingSeconds > 60) {
      display.classList.add("warning");
      status.textContent = "Less than 2 minutes remaining";
    } else if (isRunning && !isPaused) {
      status.textContent = resolveRunningMessage();
    }
  }

  function tick() {
    if (remainingSeconds <= 0) {
      stop();
      showTimesUp();
      return;
    }
    remainingSeconds--;
    updateDisplay();
  }

  function start() {
    if (isRunning && !isPaused) return;
    setDuration();
    if (!isRunning) remainingSeconds = totalSeconds;

    isRunning = true;
    isPaused = false;
    if (minutesInput) minutesInput.disabled = true;

    btnStart.disabled = true;
    btnPause.disabled = false;
    btnPause.textContent = "⏸ Pause";
    status.textContent = resolveRunningMessage();

    timerInterval = setInterval(tick, 1000);
    updateDisplay();
  }

  function pause() {
    if (!isRunning) return;
    if (isPaused) {
      isPaused = false;
      btnPause.textContent = "⏸ Pause";
      timerInterval = setInterval(tick, 1000);
      status.textContent = resolveRunningMessage();
    } else {
      isPaused = true;
      clearInterval(timerInterval);
      btnPause.textContent = "▶ Resume";
      status.textContent = "Timer paused";
    }
  }

  function stop() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    isPaused = false;
    btnStart.disabled = false;
    btnPause.disabled = true;
    btnPause.textContent = "⏸ Pause";
    if (minutesInput) minutesInput.disabled = false;
  }

  function reset() {
    stop();
    setDuration();
    remainingSeconds = totalSeconds;
    status.textContent = readyMessage;
    updateDisplay();
  }

  function showTimesUp() {
    display.textContent = "00:00";
    display.classList.add("danger");
    ringWrap.classList.add("danger");
    status.textContent = "";
    playBeep();
  }

  if (minutesInput) {
    minutesInput.addEventListener("change", setDuration);
    minutesInput.addEventListener("input", () => {
      if (!isRunning) setDuration();
    });
  }
  btnStart.addEventListener("click", start);
  btnPause.addEventListener("click", pause);
  btnReset.addEventListener("click", reset);

  setDuration();
}

createTimer({
  defaultMinutes: 5,
  minutesInput: document.getElementById("quizMinutesInput"),
  display: document.getElementById("quizDisplay"),
  ringWrap: document.getElementById("quizRingWrap"),
  ringProgress: document.getElementById("quizRingProgress"),
  status: document.getElementById("quizStatus"),
  btnStart: document.getElementById("quizStart"),
  btnPause: document.getElementById("quizPause"),
  btnReset: document.getElementById("quizReset"),
  readyMessage: "",
  runningMessage: "Quiz in progress…",
});

/* createTimer({
  defaultMinutes: 5,
  minutesInput: document.getElementById("doubtMinutesInput"),
  display: document.getElementById("doubtDisplay"),
  ringWrap: document.getElementById("doubtRingWrap"),
  ringProgress: document.getElementById("doubtRingProgress"),
  status: document.getElementById("doubtStatus"),
  btnStart: document.getElementById("doubtStart"),
  btnPause: document.getElementById("doubtPause"),
  btnReset: document.getElementById("doubtReset"),
  readyMessage: "",
  runningMessage: "Doubt resolution in progress…",
}); */

const BREAK_MODE = { value: "default" };

const breakTimerConfig = {
  defaultMinutes: 5,
  minutesInput: document.getElementById("breakMinutesInput"),
  display: document.getElementById("breakDisplay"),
  ringWrap: document.getElementById("breakRingWrap"),
  ringProgress: document.getElementById("breakRingProgress"),
  status: document.getElementById("breakStatus"),
  btnStart: document.getElementById("breakStart"),
  btnPause: document.getElementById("breakPause"),
  btnReset: document.getElementById("breakReset"),
  readyMessage: "",
  runningMessage: "Break / practice in progress…",
  getRunningMessage() {
    const MESSAGES = {
      default: "Break / practice in progress…",
      break: "Break in progress…",
      practice: "Practice time in progress…",
    };
    return MESSAGES[BREAK_MODE.value] ?? MESSAGES.default;
  },
};

createTimer(breakTimerConfig);

/* ── Break vs Practice presenter focus (slide 2, UI only) ── */
(function initBreakPracticeTitle() {
  const titleEl = document.getElementById("breakPracticeTitle");
  const badgeEl = document.getElementById("breakSlideBadge");
  const breakPick = document.getElementById("breakTitlePick");
  const practicePick = document.getElementById("practiceTitlePick");
  const breakSlot = document.getElementById("breakTitleSlot");
  const practiceSlot = document.getElementById("practiceTitleSlot");
  const sepSlot = document.getElementById("breakTitleSepSlot");
  const sepEl = document.getElementById("breakTitleSep");
  const statusEl = breakTimerConfig.status;

  const ICONS = { default: "☕", break: "☕", practice: "📚" };

  let mode = "default";

  function syncRunningStatus() {
    const running = breakTimerConfig.btnStart.disabled;
    const paused = breakTimerConfig.btnPause.textContent.includes("Resume");
    if (!running) return;
    if (paused) return;
    const text = statusEl.textContent;
    if (text.includes("seconds left") || text.includes("minute")) return;
    statusEl.textContent = breakTimerConfig.getRunningMessage();
  }

  function setSegmentCollapsed(slot, collapsed) {
    if (!slot) return;
    slot.classList.toggle("is-collapsed", collapsed);
    slot.setAttribute("aria-hidden", collapsed ? "true" : "false");
    const btn = slot.querySelector("button");
    if (btn) btn.tabIndex = collapsed ? -1 : 0;
  }

  function applyMode(next) {
    mode = next;
    BREAK_MODE.value = next;
    titleEl.classList.remove("mode-break", "mode-practice", "is-focused");
    badgeEl.classList.remove("mode-break-only", "mode-practice-only");

    const hideBreak = mode === "practice";
    const hidePractice = mode === "break";
    const hideSep = mode === "break" || mode === "practice";

    setSegmentCollapsed(breakSlot, hideBreak);
    setSegmentCollapsed(practiceSlot, hidePractice);
    setSegmentCollapsed(sepSlot, hideSep);
    if (sepEl) sepEl.setAttribute("aria-hidden", hideSep ? "true" : "false");

    breakPick.setAttribute("aria-pressed", mode === "break" ? "true" : "false");
    practicePick.setAttribute("aria-pressed", mode === "practice" ? "true" : "false");

    if (mode === "break") {
      titleEl.classList.add("mode-break", "is-focused");
      badgeEl.classList.add("mode-break-only");
      badgeEl.textContent = ICONS.break;
      badgeEl.setAttribute("aria-label", "Break — click to show both options");
      badgeEl.tabIndex = 0;
    } else if (mode === "practice") {
      titleEl.classList.add("mode-practice", "is-focused");
      badgeEl.classList.add("mode-practice-only");
      badgeEl.textContent = ICONS.practice;
      badgeEl.setAttribute("aria-label", "Practice time");
      badgeEl.tabIndex = 0;
    } else {
      badgeEl.textContent = ICONS.default;
      badgeEl.removeAttribute("aria-label");
      badgeEl.tabIndex = -1;
    }

    syncRunningStatus();
  }

  breakPick.addEventListener("click", (e) => {
    e.stopPropagation();
    applyMode(mode === "break" ? "default" : "break");
  });

  practicePick.addEventListener("click", (e) => {
    e.stopPropagation();
    applyMode(mode === "practice" ? "default" : "practice");
  });

  badgeEl.addEventListener("click", () => {
    if (mode === "break" || mode === "practice") {
      applyMode("default");
    }
  });

  breakPick.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") e.stopPropagation();
  });
  practicePick.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") e.stopPropagation();
  });

  applyMode("default");
})();
