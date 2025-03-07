const ICON_FRAMES = ["icon1.png", "icon2.png"];
const ICON_SIZE = 128; // single size
const ANIMATION_INTERVAL = 1 / 120; // minutes

let currentFrame = 0;
const preloadedImages = {};

async function preloadImages() {
  try {
    for (const frame of ICON_FRAMES) {
      const response = await fetch(chrome.runtime.getURL(frame));
      const blob = await response.blob();
      preloadedImages[frame] = await createImageBitmap(blob);
    }
  } catch (error) {
    console.error("Error preloading images:", error);
  }
}

async function animateIcon() {
  try {
    const imageBitmap = preloadedImages[ICON_FRAMES[currentFrame]];
    const canvas = new OffscreenCanvas(ICON_SIZE, ICON_SIZE);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0, ICON_SIZE, ICON_SIZE);

    await chrome.action.setIcon({
      imageData: ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE),
    });

    currentFrame = (currentFrame + 1) % ICON_FRAMES.length;
  } catch (error) {
    console.error("Error setting icon:", error);
  }
}

preloadImages().then(() => {
  chrome.alarms.create("iconAnimation", {
    periodInMinutes: ANIMATION_INTERVAL,
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "iconAnimation") {
      animateIcon();
    }
  });

  animateIcon();
});
