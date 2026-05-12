const WORK_MS   = 50 * 60 * 1000;  // 50 minutes in ms
const BREAK_MS  = 10 * 60 * 1000;  // 10 minutes in ms
const CIRCUMFERENCE = 2 * Math.PI * 46; // ≈ 289

const timerEl = document.getElementById("pomodoro-timer");
const ring    = document.getElementById("progress-ring");
const cycleEl = document.getElementById("cycle-count");
const stopBtn = document.getElementById("stop-pomodoro");

const sound = new Audio("idiot.mp3");

let phaseStart = Date.now(); // wall-clock timestamp of when current phase began
let isBreak    = false;
let cycleCount = 1;
let interval   = null;

function phaseDuration() {
  return isBreak ? BREAK_MS : WORK_MS;
}

// Always derived from real clock — immune to throttled setInterval
function secondsLeft() {
  const remaining = phaseDuration() - (Date.now() - phaseStart);
  return Math.max(0, Math.ceil(remaining / 1000));
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateDisplay() {
  const secs = secondsLeft();
  timerEl.textContent = formatTime(secs);
  cycleEl.textContent = `Cycle ${cycleCount}`;

  // Ring progress
  const totalSecs = phaseDuration() / 1000;
  const progress  = secs / totalSecs; // 1.0 = full, 0.0 = empty
  ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  ring.style.stroke = isBreak ? "#ff6b6b" : "#ffeb3b";

  if (isBreak) {
    document.body.classList.add("break-mode");
  } else {
    document.body.classList.remove("break-mode");
  }
}

function tick() {
  if (secondsLeft() <= 0) {
    // Ring the bell
    sound.currentTime = 0;
    sound.play().catch(() => {});

    // Flip phase and reset wall-clock anchor
    if (isBreak) {
      isBreak = false;
      cycleCount++;
    } else {
      isBreak = true;
    }
    phaseStart = Date.now();
  }

  updateDisplay();
}

function start() {
  phaseStart = Date.now();
  updateDisplay();
  interval = setInterval(tick, 1000);
}

function stop() {
  clearInterval(interval);
  window.close();
}

stopBtn.addEventListener("click", stop);

start();
