import { calculateTimeRemaining, formatTime } from "./utils.js";

const notificationSound = new Audio("idiot.mp3");

let notificationPlayed = false;
let timerInterval;

// Focus the window when the timer is loaded
window.onload = () => {
  window.focus();
  setFromInputToCurrentTime();

  // Clear any stored "fromTime" value
  chrome.storage.local.remove("fromTime", () => {
    console.log("Cleared stored fromTime value");
  });
};

function updateTimer() {
  // Always set the from input to current time before checking storage

  chrome.storage.local.get(["targetTime", "customTime"], (result) => {
    if (!result.targetTime && !result.customTime) {
      notificationPlayed = false;
      return;
    }

    // Focus the window again when timer values are detected
    window.focus();

    let diff;
    if (result.targetTime) {
      const targetDate = new Date();
      const [hours, minutes] = result.targetTime.split(":").map(Number);
      targetDate.setHours(hours);
      targetDate.setMinutes(minutes);
      targetDate.setSeconds(0);

      const now = new Date();
      diff = targetDate - now;
    } else if (result.customTime) {
      diff = result.customTime * 1000;
    }

    if (diff <= 1000) {
      document.getElementById("timer").textContent = "Time is up!";
      document.body.style.background = "rgba(220, 53, 69, 0.9)";

      // Play notification sound only once when timer ends
      if (!notificationPlayed) {
        notificationSound.play().catch((error) => {
          console.error("Error playing notification sound:", error);
        });
        notificationPlayed = true;
      }

      if (result.targetTime) {
        chrome.storage.local.remove("targetTime");
        // Clear the interval to stop checking time
        clearInterval(timerInterval);
      } else if (result.customTime) {
        chrome.storage.local.remove("customTime");
        // Clear the interval to stop checking time
        clearInterval(timerInterval);
      }
    } else {
      const time = calculateTimeRemaining(diff);
      const timeString = formatTime(time.hours, time.minutes, time.seconds);
      document.getElementById("timer").textContent = timeString;

      if (result.customTime) {
        chrome.storage.local.set({
          customTime: result.customTime - 1,
        });
      }
    }
  });
}

// Update every second and store the interval ID
timerInterval = setInterval(updateTimer, 1000);
updateTimer();
