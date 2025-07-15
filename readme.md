# Animated Timer Extension

A Chrome extension with an **always-animated icon** to keep important deadlines visible at all times. The continuously moving icon serves as a gentle reminder to manage your time effectively.


## Key Features

### 🔄 Always-Animated Icon
- Constantly animating extension icon
- Serves as a persistent visual reminder
- Smooth animation using OffscreenCanvas

### ⏰ Dual Timer Modes
- Target time (specific time of day)
- Custom countdown (minutes)
- Pause/Resume functionality for custom timers

### 📌 Additional Features
- Floating timer window
- Visual notifications when time is up
- Naruto-inspired theme
- Stopwatch with pause/resume controls

## Installation

1. Clone this repository:
```bash
git clone https://github.com/tanvirakon/clk-ext.git
cd ext
```

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory


## How It Works

### Icon Animation
The extension uses Chrome's Alarms API and OffscreenCanvas to create smooth icon animations:
- Runs continuously in the background
- Updates every 0.5 seconds
- Memory-efficient implementation
- Persists across browser sessions

### Timer Functionality
1. Click the animated icon in Chrome
2. Choose your timer mode:
   - Set a specific time (HH:MM)
   - Or set a countdown in minutes
3. Click "Set Timer" to start
4. For custom timers, use the Pause/Resume button to control the countdown
5. Use "Reset" to cancel

## Technical Details

- Built with vanilla JavaScript (ES6 Modules)
- Chrome Extension APIs:
  - Alarms API for smooth icon animation
  - Storage API for persistence
  - Windows API for floating timer
- Modern JavaScript features:
  - OffscreenCanvas for efficient animation
  - ES6 Modules for code organization
  - Async/await for smooth performance

## Development

To modify the extension:

1. Make changes to source files
2. Reload the extension in `chrome://extensions/`
3. Test changes in Chrome

## License

MIT License - Feel free to use and modify


