import { padZero } from "./utils.js";

let startTime;
let elapsedTime = 0;
let stopwatchInterval;
let running = false;
const stopwatchDisplay = document.getElementById("stopwatch");
const pauseButton = document.getElementById("pause-stopwatch");
const endButton = document.getElementById("end-stopwatch");
const finalTimeDisplay = document.getElementById("final-time");

// Load saved state if it exists
chrome.storage.local.get(
  ["stopwatchRunning", "stopwatchStartTime", "stopwatchElapsed"],
  (result) => {
    if (result.stopwatchRunning) {
      startTime = result.stopwatchStartTime;
      elapsedTime = result.stopwatchElapsed || 0;
      running = true;
      startStopwatch();
      pauseButton.textContent = "Pause";
    } else if (result.stopwatchElapsed) {
      elapsedTime = result.stopwatchElapsed;
      updateDisplay();
    }
  }
);

function startStopwatch() {
  if (!running) {
    startTime = Date.now() - elapsedTime;
    running = true;
    chrome.storage.local.set({
      stopwatchRunning: true,
      stopwatchStartTime: startTime,
      stopwatchElapsed: elapsedTime,
    });
  }

  stopwatchInterval = setInterval(updateDisplay, 1000);
}

function pauseStopwatch() {
  clearInterval(stopwatchInterval);
  running = false;
  elapsedTime = Date.now() - startTime;
  chrome.storage.local.set({
    stopwatchRunning: false,
    stopwatchElapsed: elapsedTime,
  });
}

function endStopwatch() {
  clearInterval(stopwatchInterval);
  running = false;
  const finalTime = formatStopwatchTime(elapsedTime);
  finalTimeDisplay.textContent = `Final time: ${finalTime}`;
  chrome.storage.local.remove([
    "stopwatchRunning",
    "stopwatchStartTime",
    "stopwatchElapsed",
  ]);
}

function stopStopwatch() {
  clearInterval(stopwatchInterval);
  running = false;
  // Remove all stopwatch data from storage
  chrome.storage.local.remove([
    "stopwatchRunning",
    "stopwatchStartTime",
    "stopwatchElapsed",
  ]);
}

function updateDisplay() {
  if (running) {
    elapsedTime = Date.now() - startTime;
    chrome.storage.local.set({ stopwatchElapsed: elapsedTime });
  }

  stopwatchDisplay.textContent = formatStopwatchTime(elapsedTime);
}

function formatStopwatchTime(timeInMs) {
  const hours = Math.floor(timeInMs / (1000 * 60 * 60));
  const minutes = Math.floor((timeInMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeInMs % (1000 * 60)) / 1000);

  return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
}

// Event listeners
pauseButton.addEventListener("click", () => {
  if (running) {
    pauseStopwatch();
    pauseButton.textContent = "Start";
  } else {
    startStopwatch();
    pauseButton.textContent = "Pause";
  }
});

// endButton.addEventListener("click", endStopwatch);

// Add event listener for window close
window.addEventListener("beforeunload", () => {
  // Stop the stopwatch completely when window is closed
  endStopwatch();
}); 

// Start the stopwatch automatically when the page loads
startStopwatch();
