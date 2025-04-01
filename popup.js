import { calculateTimeRemaining, formatTime } from "./utils.js";

const targetTimeInput = document.getElementById("target-time");
const customTimeInput = document.getElementById("custom-time");
const setTimerButton = document.getElementById("set-timer");
const resetTimerButton = document.getElementById("reset-timer");

function updateCountdown() {
  const targetTime = targetTimeInput.value;
  const customTime = customTimeInput.value;

  if (targetTime) {
    const targetDate = new Date();
    const [hours, minutes] = targetTime.split(":").map(Number);
    targetDate.setHours(hours);
    targetDate.setMinutes(minutes);
    targetDate.setSeconds(0);

    const now = new Date();
    const diff = targetDate - now;
  } else if (customTime) {
    const now = new Date();
    const targetDate = new Date(now.getTime() + customTime * 60 * 1000);
    const diff = targetDate - now;
  }
}

chrome.storage.local.get("targetTime", (result) => {
  if (result.targetTime) {
    targetTimeInput.value = result.targetTime;
    updateCountdown();
  }
});

setInterval(updateCountdown, 1000);

function createFloatingWindow(targetTime) {
  chrome.windows.create({
    url: "timer.html",
    type: "popup",
    width: 200,
    height: 100,
    left: 20,
    top: 20,
    focused: false,
  });
}

resetTimerButton.addEventListener("click", () => {
  targetTimeInput.value = "";
  customTimeInput.value = "";
  chrome.storage.local.remove("targetTime", () => {
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "resetCountdown",
        });
      });
    });
  });
});

setTimerButton.addEventListener("click", () => {
  const targetTime = targetTimeInput.value;
  const customTime = customTimeInput.value;

  if (targetTime) {
    chrome.storage.local.set({ targetTime }, () => {
      createFloatingWindow(targetTime);
    });
  } else if (customTime) {
    chrome.storage.local.set({ customTime: parseInt(customTime) * 60 }, () => {
      createFloatingWindow();
    });
  }
});

// Update the stopwatch button event listener

document.getElementById("start-stopwatch").addEventListener("click", () => {
  // Create the stopwatch window
  chrome.windows.create(
    {
      url: "stopwatch.html",
      type: "popup",
      width: 300,
      height: 200,
      left: 20,
      top: 20,
    },
    () => {
      // Close the popup after creating the window
      window.close();
    }
  );
});
