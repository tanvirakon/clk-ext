import { decodeGif } from "./gif-decoder.js";

const ICON_SIZE = 128;
const ANIMATION_INTERVAL = 1 / 120; // minutes

let frameImageData = [];
let currentFrame = 0;

/* ── Load & composite every GIF frame ─────────────────────────── */
async function loadGifFrames() {
  try {
    const response = await fetch(chrome.runtime.getURL("jinx.gif"));
    const buffer = await response.arrayBuffer();
    const gif = decodeGif(buffer);

    // Composite canvas at native GIF size
    const comp = new OffscreenCanvas(gif.width, gif.height);
    const compCtx = comp.getContext("2d");

    for (const frame of gif.frames) {
      const prevState =
        frame.disposal === 3
          ? compCtx.getImageData(0, 0, gif.width, gif.height)
          : null;

      // Build row map for interlaced frames
      const rowMap = frame.interlaced ? interlaceMap(frame.h) : null;

      // Draw pixels onto composite
      const img = compCtx.getImageData(0, 0, gif.width, gif.height);
      const px = img.data;

      for (let sy = 0; sy < frame.h; sy++) {
        const dy = frame.interlaced ? rowMap[sy] : sy;
        for (let sx = 0; sx < frame.w; sx++) {
          const idx = frame.indices[sy * frame.w + sx];
          if (idx === frame.transIdx) continue;
          const ci = idx * 3;
          const off = ((frame.y + dy) * gif.width + (frame.x + sx)) * 4;
          px[off] = frame.ct[ci];
          px[off + 1] = frame.ct[ci + 1];
          px[off + 2] = frame.ct[ci + 2];
          px[off + 3] = 255;
        }
      }

      compCtx.putImageData(img, 0, 0);

      // Scale to icon size
      const icon = new OffscreenCanvas(ICON_SIZE, ICON_SIZE);
      const ictx = icon.getContext("2d");
      ictx.imageSmoothingEnabled = true;
      ictx.imageSmoothingQuality = "high";
      ictx.drawImage(comp, 0, 0, ICON_SIZE, ICON_SIZE);
      frameImageData.push(ictx.getImageData(0, 0, ICON_SIZE, ICON_SIZE));

      // Disposal
      if (frame.disposal === 2) {
        compCtx.clearRect(frame.x, frame.y, frame.w, frame.h);
      } else if (frame.disposal === 3 && prevState) {
        compCtx.putImageData(prevState, 0, 0);
      }
    }

    console.log(`Loaded ${frameImageData.length} frames from jinx.gif`);
  } catch (error) {
    console.error("Error loading GIF frames:", error);
  }
}

function interlaceMap(h) {
  const m = new Array(h);
  let r = 0;
  for (let y = 0; y < h; y += 8) m[r++] = y;
  for (let y = 4; y < h; y += 8) m[r++] = y;
  for (let y = 2; y < h; y += 4) m[r++] = y;
  for (let y = 1; y < h; y += 2) m[r++] = y;
  return m;
}

/* ── Cycle frames ─────────────────────────────────────────────── */
async function animateIcon() {
  if (frameImageData.length === 0) return;
  try {
    await chrome.action.setIcon({
      imageData: frameImageData[currentFrame],
    });
    currentFrame = (currentFrame + 1) % frameImageData.length;
  } catch (error) {
    console.error("Error setting icon:", error);
  }
}

/* ── Bootstrap ────────────────────────────────────────────────── */
loadGifFrames().then(() => {
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
