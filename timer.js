import { calculateTimeRemaining, formatTime } from "./utils.js";

function updateTimer() {
  chrome.storage.local.get(["targetTime", "customTime"], (result) => {
    if (!result.targetTime && !result.customTime) {
      return;
    }

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
      if (result.targetTime) {
        chrome.storage.local.remove("targetTime");
      } else if (result.customTime) {
        chrome.storage.local.remove("customTime");
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

// Update every second
setInterval(updateTimer, 1000);
updateTimer();
