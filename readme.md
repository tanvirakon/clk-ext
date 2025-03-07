# Animated Timer Extension

A Chrome extension with an **always-animated icon** to keep important deadlines visible at all times. The continuously moving icon serves as a gentle reminder to manage your time effectively.

![Animated Icon Demo](demo.gif)

## Key Features

### 🔄 Always-Animated Icon
- Constantly animating extension icon
- Serves as a persistent visual reminder
- Smooth animation using OffscreenCanvas

### ⏰ Dual Timer Modes
- Target time (specific time of day)
- Custom countdown (minutes)

### 📌 Additional Features
- Floating timer window
- Visual notifications when time is up
- Naruto-inspired theme

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd ext
```

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Project Structure

```
ext/
├── manifest.json     # Extension configuration
├── background.js     # Icon animation logic
├── popup.js         # Popup interface logic
├── timer.js         # Timer window logic
├── utils.js         # Shared utility functions 
├── popup.html       # Popup interface
├── timer.html       # Timer window
├── styles.css       # Naruto-themed styles
└── icons/           # Animation frames
    ├── icon1.png    
    └── icon2.png
```

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
4. Use "Reset" to cancel

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

## Author

