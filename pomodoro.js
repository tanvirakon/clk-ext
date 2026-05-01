const WORK_SECONDS = 50 * 60; // 50 minutes
const BREAK_SECONDS = 10 * 60; // 10 minutes

const timerEl = document.getElementById("pomodoro-timer");
const cycleEl = document.getElementById("cycle-count");
const stopBtn = document.getElementById("stop-pomodoro");

const sound = new Audio("idiot.mp3");

let secondsLeft = WORK_SECONDS;
let isBreak = false;
let cycleCount = 1;
let interval = null;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateDisplay() {
  timerEl.textContent = formatTime(secondsLeft);
  cycleEl.textContent = `Cycle ${cycleCount}`;

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
      // Break just ended — start next work session
      isBreak = false;
      cycleCount++;
      secondsLeft = WORK_SECONDS;
    } else {
      // Work just ended — start break
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

// Kick off immediately
start();
