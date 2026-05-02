const WORK_SECONDS = 50 * 60;   // 50 minutes
const BREAK_SECONDS = 10 * 60;  // 10 minutes
const CIRCUMFERENCE = 2 * Math.PI * 46; // ≈ 289

const timerEl = document.getElementById("pomodoro-timer");
const ring    = document.getElementById("progress-ring");
const cycleEl = document.getElementById("cycle-count");
const stopBtn = document.getElementById("stop-pomodoro");

const sound = new Audio("idiot.mp3");

let secondsLeft = WORK_SECONDS;
let isBreak    = false;
let cycleCount = 1;
let interval   = null;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateDisplay() {
  timerEl.textContent = formatTime(secondsLeft);
  cycleEl.textContent = `Cycle ${cycleCount}`;

  // Ring drains from full → empty as time runs out
  const totalSeconds = isBreak ? BREAK_SECONDS : WORK_SECONDS;
  const progress = secondsLeft / totalSeconds; // 1.0 = full, 0.0 = empty
  ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Yellow during work, coral-red during break
  ring.style.stroke = isBreak ? "#ff6b6b" : "#ffeb3b";

  if (isBreak) {
    document.body.classList.add("break-mode");
  } else {
    document.body.classList.remove("break-mode");
  }
}

function tick() {
  if (secondsLeft <= 0) {
    // Ring the bell
    sound.currentTime = 0;
    sound.play().catch(() => {});

    if (isBreak) {
      // Break ended — start next work session
      isBreak = false;
      cycleCount++;
      secondsLeft = WORK_SECONDS;
    } else {
      // Work ended — start break
      isBreak = true;
      secondsLeft = BREAK_SECONDS;
    }
  } else {
    secondsLeft--;
  }

  updateDisplay();
}

function start() {
  updateDisplay();
  interval = setInterval(tick, 1000);
}

function stop() {
  clearInterval(interval);
  window.close();
}

stopBtn.addEventListener("click", stop);

start();
