import { calculateTimeRemaining, formatTime } from "./utils.js";

const targetTimeInput = document.getElementById("target-time");
const customTimeInput = document.getElementById("custom-time");
const setTimerButton = document.getElementById("set-timer");
const resetTimerButton = document.getElementById("reset-timer");
const countdownElement = document.getElementById("countdown");

// Time difference calculator elements
const fromTimeInput = document.getElementById("from-time");
const toTimeInput = document.getElementById("to-time");
const calculateDiffButton = document.getElementById("calculate-diff");
const timeDifferenceElement = document.getElementById("time-difference");

// Set default value for fromTimeInput to current time
function setCurrentTimeAsDefault() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  fromTimeInput.value = `${hours}:${minutes}`;
}

// Call this function when the page loads
setCurrentTimeAsDefault();

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

    if (diff <= 0) {
      countdownElement.textContent = "Time is up!";
    } else {
      const time = calculateTimeRemaining(diff);
      countdownElement.textContent = formatTime(
        time.hours,
        time.minutes,
        time.seconds
      );
    }
  } else if (customTime) {
    const now = new Date();
    const targetDate = new Date(now.getTime() + customTime * 60 * 1000);
    const diff = targetDate - now;
    if (diff <= 0) {
      countdownElement.textContent = "Time is up!";
    } else {
      const time = calculateTimeRemaining(diff);
      countdownElement.textContent = formatTime(
        time.hours,
        time.minutes,
        time.seconds
      );
    }
  }
}

chrome.storage.local.get("targetTime", (result) => {
  if (result.targetTime) {
    targetTimeInput.value = result.targetTime;
    updateCountdown();
  }
});

setInterval(updateCountdown, 1000);

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

// Function to calculate time difference between two time inputs
function calculateTimeDifference() {
  const fromTime = fromTimeInput.value;
  const toTime = toTimeInput.value;

  const [fromHours, fromMinutes] = fromTime.split(":").map(Number);
  const [toHours, toMinutes] = toTime.split(":").map(Number);

  // Create Date objects for comparison
  const fromDate = new Date();
  fromDate.setHours(fromHours, fromMinutes, 0, 0);

  const toDate = new Date();
  toDate.setHours(toHours, toMinutes, 0, 0);

  // If toTime is earlier than fromTime, assume it's for the next day
  if (toDate < fromDate) {
    toDate.setDate(toDate.getDate() + 1);
  }

  // Calculate the difference in milliseconds
  const diffMs = toDate - fromDate;

  // Convert to hours and minutes
  const time = calculateTimeRemaining(diffMs);

  // Display the difference
  timeDifferenceElement.textContent = `${time.hours} hour${
    time.hours !== 1 ? "s" : ""
  } ${time.minutes} minute${time.minutes !== 1 ? "s" : ""}`;
}

// Also calculate difference when input values change
fromTimeInput.addEventListener("change", calculateTimeDifference);
toTimeInput.addEventListener("change", calculateTimeDifference);

// Replace the setTimerButton event listener to call startTimer
setTimerButton.addEventListener("click", () => {
  const targetTime = targetTimeInput.value;
  const customTime = customTimeInput.value;

  if (targetTime || customTime) {
    if (targetTime) {
      chrome.storage.local.set({ targetTime });
    } else if (customTime) {
      chrome.storage.local.set({ customTime: parseInt(customTime) * 60 });
    }

    // Create the timer window
    chrome.windows.create({
      url: "timer.html",
      type: "popup",
      width: 200,
      height: 100,
      focused: true,
    });

    // Close the popup
    closePopup();
  }
});

// Replace the stopwatch button event listener to directly call closePopup
document.getElementById("start-stopwatch").addEventListener("click", () => {
  // Create the stopwatch window
  chrome.windows.create({
    url: "stopwatch.html",
    type: "popup",
    width: 300,
    height: 150,
    left: 20,
    top: 20,
  });

  // Close the popup immediately after creating the window
  closePopup();
});

// Function to close the popup window
function closePopup() {
  window.close();
}
