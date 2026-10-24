/**
 * Cozy Hand-Drawn Scroll Wheel Time Picker
 * Circular / infinite drum rollers (Hour 1-12, Minute 00-59, AM/PM)
 * Seamless wrap-around without reverse scrolling.
 */

const ITEM_HEIGHT = 40;
const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
const PERIODS = ["AM", "PM"];

const HOUR_REPEATS = 9;   // 9 * 12 = 108 items (middle repeat is 4)
const MINUTE_REPEATS = 5; // 5 * 60 = 300 items (middle repeat is 2)
const PERIOD_REPEATS = 1; // AM / PM doesn't loop

let modalInstance = null;
let currentTargetInput = null;

// Native value descriptor for overriding input.value
const nativeValueDescriptor = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  "value"
);

/**
 * Format 24h ("14:05") -> 12h display ("02:05 PM")
 */
export function formatTo12Hour(time24) {
  if (!time24 || typeof time24 !== "string" || !time24.includes(":")) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return "";

  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;

  const hDisplay = h.toString().padStart(2, "0");
  const mDisplay = m.toString().padStart(2, "0");
  return `${hDisplay}:${mDisplay} ${period}`;
}

/**
 * Parse any time string into { hour (1-12), minute (0-59), period ("AM"|"PM") }
 */
export function parseTimeString(str) {
  const now = new Date();
  let defaultH = now.getHours();
  let defaultM = now.getMinutes();

  if (!str) {
    const period = defaultH >= 12 ? "PM" : "AM";
    let h12 = defaultH % 12;
    if (h12 === 0) h12 = 12;
    return { hour: h12, minute: defaultM, period };
  }

  // Check 12-hour with AM/PM (e.g. "02:30 PM")
  if (/am|pm/i.test(str)) {
    const match = str.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const p = match[3].toUpperCase();
      return {
        hour: Math.max(1, Math.min(12, h || 12)),
        minute: Math.max(0, Math.min(59, m || 0)),
        period: p === "PM" ? "PM" : "AM",
      };
    }
  }

  // 24-hour (e.g. "14:30")
  const parts = str.split(":");
  if (parts.length >= 2) {
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      const period = h >= 12 ? "PM" : "AM";
      h = h % 12;
      if (h === 0) h = 12;
      return {
        hour: h,
        minute: Math.max(0, Math.min(59, m)),
        period,
      };
    }
  }

  const period = defaultH >= 12 ? "PM" : "AM";
  let h12 = defaultH % 12;
  if (h12 === 0) h12 = 12;
  return { hour: h12, minute: defaultM, period };
}

/**
 * Convert 12h + AM/PM -> 24h ("HH:MM")
 */
export function to24HourString(hour12, minute, period) {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  const h24 = h.toString().padStart(2, "0");
  const m24 = minute.toString().padStart(2, "0");
  return `${h24}:${m24}`;
}

/**
 * Create or return the shared modal instance
 */
function getModalInstance() {
  if (modalInstance) return modalInstance;

  // Build DOM
  const overlay = document.createElement("div");
  overlay.className = "time-picker-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="time-picker-modal">
      <div class="time-picker-header">
        <span class="time-picker-title" id="tp-modal-title">Select Time</span>
        <button type="button" class="time-picker-close" id="tp-modal-close" aria-label="Close">✕</button>
      </div>

      <div class="time-picker-preview" id="tp-preview" aria-live="polite">--:-- --</div>

      <div class="wheel-container">
        <div class="wheel-lens"></div>
        <div class="wheel-vignette-top"></div>
        <div class="wheel-vignette-bottom"></div>

        <div class="wheel-column hour-col" id="tp-col-hour" tabindex="0" aria-label="Hour"></div>
        <div class="wheel-colon" aria-hidden="true">:</div>
        <div class="wheel-column minute-col" id="tp-col-minute" tabindex="0" aria-label="Minute"></div>
        <div class="wheel-column period-col" id="tp-col-period" tabindex="0" aria-label="Period"></div>
      </div>

      <div class="time-picker-actions">
        <button type="button" class="time-picker-btn btn-cancel" id="tp-btn-cancel">Cancel</button>
        <button type="button" class="time-picker-btn btn-set" id="tp-btn-set">Set Time</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const titleEl = overlay.querySelector("#tp-modal-title");
  const previewEl = overlay.querySelector("#tp-preview");
  const closeBtn = overlay.querySelector("#tp-modal-close");
  const hourCol = overlay.querySelector("#tp-col-hour");
  const minuteCol = overlay.querySelector("#tp-col-minute");
  const periodCol = overlay.querySelector("#tp-col-period");
  const cancelBtn = overlay.querySelector("#tp-btn-cancel");
  const setBtn = overlay.querySelector("#tp-btn-set");

  // Populate columns with circular wrap support
  populateColumn(hourCol, HOURS, HOUR_REPEATS, true);
  populateColumn(minuteCol, MINUTES, MINUTE_REPEATS, true);
  populateColumn(periodCol, PERIODS, PERIOD_REPEATS, false);

  // Setup roller physics for each column
  setupColumnPhysics(hourCol, HOURS, HOUR_REPEATS, true, updatePreview);
  setupColumnPhysics(minuteCol, MINUTES, MINUTE_REPEATS, true, updatePreview);
  setupColumnPhysics(periodCol, PERIODS, PERIOD_REPEATS, false, updatePreview);

  function updatePreview() {
    const h = getColumnValue(hourCol, HOURS, true);
    const m = getColumnValue(minuteCol, MINUTES, true);
    const p = getColumnValue(periodCol, PERIODS, false);
    if (previewEl) {
      previewEl.textContent = `${h}:${m} ${p}`;
    }
  }

  // Dismiss listeners
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // "Set Time" button listener
  setBtn.addEventListener("click", () => {
    if (!currentTargetInput) {
      closeModal();
      return;
    }

    const hour12 = parseInt(getColumnValue(hourCol, HOURS, true), 10);
    const minute = parseInt(getColumnValue(minuteCol, MINUTES, true), 10);
    const period = getColumnValue(periodCol, PERIODS, false);
    const time24 = to24HourString(hour12, minute, period);

    // Update input value and fire events
    currentTargetInput.value = time24;
    currentTargetInput.dispatchEvent(new Event("change", { bubbles: true }));
    currentTargetInput.dispatchEvent(new Event("input", { bubbles: true }));

    closeModal();
  });

  // Keyboard navigation within modal
  overlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      setBtn.click();
      return;
    }

    // Arrow keys for active column
    const activeEl = document.activeElement;
    if (activeEl === hourCol || activeEl === minuteCol || activeEl === periodCol) {
      const isHour = activeEl === hourCol;
      const isMinute = activeEl === minuteCol;
      const loop = isHour || isMinute;
      const items = isHour ? HOURS : isMinute ? MINUTES : PERIODS;
      const repeats = isHour ? HOUR_REPEATS : isMinute ? MINUTE_REPEATS : PERIOD_REPEATS;
      const curIdx = Math.round(activeEl.scrollTop / ITEM_HEIGHT);

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const targetIdx = loop ? curIdx - 1 : Math.max(0, curIdx - 1);
        setColumnIndex(activeEl, targetIdx, true);
        scheduleNormalize(activeEl, items.length, repeats, loop);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const targetIdx = loop ? curIdx + 1 : Math.min(items.length - 1, curIdx + 1);
        setColumnIndex(activeEl, targetIdx, true);
        scheduleNormalize(activeEl, items.length, repeats, loop);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (activeEl === hourCol) minuteCol.focus();
        else if (activeEl === minuteCol) periodCol.focus();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (activeEl === periodCol) minuteCol.focus();
        else if (activeEl === minuteCol) hourCol.focus();
      }
    }
  });

  modalInstance = {
    overlay,
    titleEl,
    previewEl,
    hourCol,
    minuteCol,
    periodCol,
    updatePreview,
  };

  return modalInstance;
}

/**
 * Populate column with top spacer, repeated items for circular rolling, and bottom spacer
 */
function populateColumn(col, baseItems, repeats, loop) {
  col.innerHTML = "";

  const topSpacer = document.createElement("div");
  topSpacer.className = "wheel-spacer";
  col.appendChild(topSpacer);

  const totalItems = repeats * baseItems.length;

  for (let r = 0; r < repeats; r++) {
    baseItems.forEach((item, baseIdx) => {
      const itemIdx = r * baseItems.length + baseIdx;
      const el = document.createElement("div");
      el.className = "wheel-item";
      el.textContent = item;
      el.dataset.itemIndex = itemIdx;
      el.dataset.baseIndex = baseIdx;

      // Direct click centers item and normalizes
      el.addEventListener("click", () => {
        setColumnIndex(col, itemIdx, true);
        scheduleNormalize(col, baseItems.length, repeats, loop);
      });

      col.appendChild(el);
    });
  }

  const bottomSpacer = document.createElement("div");
  bottomSpacer.className = "wheel-spacer";
  col.appendChild(bottomSpacer);
}

/**
 * Silently recenter a looping column to the middle repeat block so the user never hits an edge
 */
const normalizeTimeouts = new WeakMap();

function scheduleNormalize(col, baseCount, repeats, loop) {
  if (!loop) return;

  const existing = normalizeTimeouts.get(col);
  if (existing) clearTimeout(existing);

  const timeoutId = setTimeout(() => {
    const curIdx = Math.round(col.scrollTop / ITEM_HEIGHT);
    const midRepeat = Math.floor(repeats / 2);
    const curRepeat = Math.floor(curIdx / baseCount);

    if (curRepeat !== midRepeat) {
      const baseIdx = ((curIdx % baseCount) + baseCount) % baseCount;
      const normalizedIdx = midRepeat * baseCount + baseIdx;
      // Instant silent shift to middle set
      col.scrollTop = normalizedIdx * ITEM_HEIGHT;
    }
  }, 140);

  normalizeTimeouts.set(col, timeoutId);
}

/**
 * Setup mouse wheel, dragging, and visual update physics on a wheel column
 */
function setupColumnPhysics(col, baseItems, repeats, loop, onUpdate) {
  let isDragging = false;
  let startY = 0;
  let startScrollTop = 0;
  let lastY = 0;
  let lastTime = 0;
  let velocity = 0;
  let ticking = false;
  let prevSelectedEl = null;

  const baseCount = baseItems.length;
  const totalCount = repeats * baseCount;

  // Fast O(1) visual updater for selected item class
  function updateVisuals() {
    ticking = false;
    const centerIdx = Math.round(col.scrollTop / ITEM_HEIGHT);
    // col.children[0] is top spacer, so item index centerIdx is at children[centerIdx + 1]
    const selectedEl = col.children[centerIdx + 1];

    if (selectedEl && selectedEl !== prevSelectedEl) {
      if (prevSelectedEl) prevSelectedEl.classList.remove("selected");
      selectedEl.classList.add("selected");
      prevSelectedEl = selectedEl;
    }

    if (onUpdate) onUpdate();
  }

  col.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateVisuals);
      ticking = true;
    }
  });

  // Wheel handling: Step 1 item per wheel notch (seamless circular stepping)
  col.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      const curIdx = Math.round(col.scrollTop / ITEM_HEIGHT);
      let targetIdx = curIdx + dir;

      if (!loop) {
        targetIdx = Math.max(0, Math.min(totalCount - 1, targetIdx));
      }

      setColumnIndex(col, targetIdx, true);
      scheduleNormalize(col, baseCount, repeats, loop);
    },
    { passive: false }
  );

  // Mouse drag handling with momentum, infinite wrap, and snap
  col.addEventListener("mousedown", (e) => {
    isDragging = true;
    startY = e.clientY;
    startScrollTop = col.scrollTop;
    lastY = e.clientY;
    lastTime = Date.now();
    velocity = 0;
    col.style.scrollSnapType = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const dy = e.clientY - startY;
    col.scrollTop = startScrollTop - dy;

    // Seamless continuous wrap during drag so the drag never hits top or bottom
    if (loop) {
      const minThreshold = baseCount * ITEM_HEIGHT * 1.5;
      const maxThreshold = (totalCount - baseCount * 1.5) * ITEM_HEIGHT;
      const shiftDistance = baseCount * ITEM_HEIGHT * 2;

      if (col.scrollTop < minThreshold) {
        col.scrollTop += shiftDistance;
        startScrollTop += shiftDistance;
      } else if (col.scrollTop > maxThreshold) {
        col.scrollTop -= shiftDistance;
        startScrollTop -= shiftDistance;
      }
    }

    const now = Date.now();
    const dt = now - lastTime;
    if (dt > 0) {
      velocity = (lastY - e.clientY) / dt;
    }
    lastY = e.clientY;
    lastTime = now;
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    col.style.scrollSnapType = "y mandatory";

    // Projected landing with light inertia
    const projected = col.scrollTop + velocity * 80;
    let targetIdx = Math.round(projected / ITEM_HEIGHT);

    if (!loop) {
      targetIdx = Math.max(0, Math.min(totalCount - 1, targetIdx));
    }

    setColumnIndex(col, targetIdx, true);
    scheduleNormalize(col, baseCount, repeats, loop);
  });
}

function setColumnIndex(col, index, smooth = false) {
  const targetTop = index * ITEM_HEIGHT;
  if (smooth) {
    col.scrollTo({ top: targetTop, behavior: "smooth" });
  } else {
    col.scrollTop = targetTop;
  }
}

function getColumnValue(col, items, loop = false) {
  const curIdx = Math.round(col.scrollTop / ITEM_HEIGHT);
  if (loop) {
    const baseIdx = ((curIdx % items.length) + items.length) % items.length;
    return items[baseIdx] || items[0];
  }
  const idx = Math.max(0, Math.min(items.length - 1, curIdx));
  return items[idx] || items[0];
}

/**
 * Open the time picker modal for an input element
 */
export function openTimePicker(inputElement, title = "Select Time") {
  const modal = getModalInstance();
  currentTargetInput = inputElement;

  if (modal.titleEl) {
    modal.titleEl.textContent = `${title} 🐾`;
  }

  // Parse current input value or default to current time
  const currentVal = inputElement.value || "";
  const parsed = parseTimeString(currentVal);

  const hourBase = Math.max(0, Math.min(HOURS.length - 1, parsed.hour - 1));
  const minBase = Math.max(0, Math.min(MINUTES.length - 1, parsed.minute));
  const periodBase = parsed.period === "AM" ? 0 : 1;

  // Center in the middle repeat block for full bidirectional rolling room
  const hourIdx = Math.floor(HOUR_REPEATS / 2) * HOURS.length + hourBase;
  const minIdx = Math.floor(MINUTE_REPEATS / 2) * MINUTES.length + minBase;
  const periodIdx = periodBase;

  modal.overlay.classList.add("active");

  // Center the columns immediately
  setColumnIndex(modal.hourCol, hourIdx, false);
  setColumnIndex(modal.minuteCol, minIdx, false);
  setColumnIndex(modal.periodCol, periodIdx, false);

  modal.updatePreview();

  // Focus hour column for immediate keyboard responsiveness
  setTimeout(() => {
    modal.hourCol.focus();
  }, 50);
}

/**
 * Close the time picker modal
 */
export function closeModal() {
  if (modalInstance) {
    modalInstance.overlay.classList.remove("active");
  }
  if (currentTargetInput) {
    currentTargetInput.focus();
    currentTargetInput = null;
  }
}

/**
 * Bind custom scroll wheel picker to an input element.
 * Overrides inputElement.value so it works in 24h format for all code/storage,
 * while cleanly displaying 12-hour formatted time with AM/PM to the user.
 */
export function initTimePicker(inputElement, options = {}) {
  if (!inputElement) return;

  const title = options.title || "Select Time";

  // Make input element styled & accessible as interactive trigger
  inputElement.readOnly = true;
  inputElement.classList.add("custom-time-input");
  inputElement.setAttribute("role", "button");
  inputElement.setAttribute("aria-haspopup", "dialog");

  // Intercept .value property
  Object.defineProperty(inputElement, "value", {
    get() {
      return this.dataset.time24 || "";
    },
    set(newVal) {
      if (!newVal) {
        this.dataset.time24 = "";
        nativeValueDescriptor.set.call(this, "");
        return;
      }

      // If formatted as 12-hour with AM/PM
      if (/am|pm/i.test(newVal)) {
        const parsed = parseTimeString(newVal);
        const time24 = to24HourString(parsed.hour, parsed.minute, parsed.period);
        this.dataset.time24 = time24;
        nativeValueDescriptor.set.call(this, formatTo12Hour(time24));
        return;
      }

      // Format 24-hour time "HH:MM"
      const parts = newVal.split(":");
      if (parts.length >= 2) {
        let h = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        if (!isNaN(h) && !isNaN(m)) {
          h = Math.max(0, Math.min(23, h));
          m = Math.max(0, Math.min(59, m));
          const time24 = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
          this.dataset.time24 = time24;
          nativeValueDescriptor.set.call(this, formatTo12Hour(time24));
          return;
        }
      }

      this.dataset.time24 = newVal;
      nativeValueDescriptor.set.call(this, newVal);
    },
    configurable: true,
  });

  // Click & keyboard triggers
  inputElement.addEventListener("click", () => {
    openTimePicker(inputElement, title);
  });

  inputElement.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      openTimePicker(inputElement, title);
    }
  });
}
