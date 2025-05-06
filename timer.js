import { calculateTimeRemaining, formatTime } from "./utils.js";

const notificationSound = new Audio("idiot.mp3");

let notificationPlayed = false;
let timerInterval;
let isPaused = false; // Track if timer is paused

// Focus the window when the timer is loaded
window.onload = () => {
  window.focus();
  setFromInputToCurrentTime();

  // Clear any stored "fromTime" value
  chrome.storage.local.remove("fromTime", () => {
    console.log("Cleared stored fromTime value");
  });
  
  // Create pause button for custom timer
  createPauseButton();
};

function setFromInputToCurrentTime() {
  // This function would set the from time if needed
  // Implementation would be here if needed
}

function createPauseButton() {
  // Create the pause button element
  const pauseButton = document.createElement("button");
  pauseButton.id = "pauseButton";
  pauseButton.textContent = "Pause";
  pauseButton.style.marginTop = "10px";
  pauseButton.style.padding = "8px 15px";
  pauseButton.style.cursor = "pointer";
  pauseButton.style.backgroundColor = "#007bff";
  pauseButton.style.color = "white";
  pauseButton.style.border = "none";
  pauseButton.style.borderRadius = "4px";
  pauseButton.style.display = "none"; // Initially hidden
  pauseButton.style.margin = "10px auto";
  pauseButton.style.display = "block";
  
  // Add click handler
  pauseButton.addEventListener("click", function() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? "Resume" : "Pause";
    pauseButton.style.backgroundColor = isPaused ? "#28a745" : "#007bff";
  });
  
  // Add to DOM after the timer
  const timerElement = document.getElementById("timer");
  if (timerElement) {
    timerElement.parentNode.insertBefore(pauseButton, timerElement.nextSibling);
  }
  
  // Check if this is a custom timer and show the button accordingly
  chrome.storage.local.get(["customTime", "targetTime"], (result) => {
    pauseButton.style.display = (result.customTime && !result.targetTime) ? "block" : "none";
  });
}

function updateTimer() {
  // Always set the from input to current time before checking storage

  chrome.storage.local.get(["targetTime", "customTime"], (result) => {
    if (!result.targetTime && !result.customTime) {
      notificationPlayed = false;
      return;
    }

    // Focus the window again when timer values are detected
    window.focus();
    
    // Show/hide pause button based on timer type
    const pauseButton = document.getElementById("pauseButton");
    if (pauseButton) {
      pauseButton.style.display = (result.customTime && !result.targetTime) ? "block" : "none";
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
        
        // Hide pause button when timer ends
        if (pauseButton) {
          pauseButton.style.display = "none";
        }
      }
    } else {
      const time = calculateTimeRemaining(diff);
      const timeString = formatTime(time.hours, time.minutes, time.seconds);
      document.getElementById("timer").textContent = timeString;

      if (result.customTime) {
        // Only decrement if not paused
        if (!isPaused) {
          chrome.storage.local.set({
            customTime: result.customTime - 1,
          });
        }
      }
    }
  });
}

// Update every second and store the interval ID
timerInterval = setInterval(updateTimer, 1000);
updateTimer();
