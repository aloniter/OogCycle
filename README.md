# 🌸 OogCycle - Period Tracking App

A simple, cute, and user-friendly period tracking web application designed for personal use.

## Features

- **📅 Calendar Interface**: Clean, month-view calendar as the primary interface
- **🩸 Period Tracking**: Easy logging of menstrual period start/end dates
- **🥚 Ovulation Tracking**: Automatic prediction and manual adjustment of ovulation dates
- **💭 Mood & Symptoms**: Simple mood tracking with cute icons/emojis
- **📊 Cycle Predictions**: Smart predictions based on historical data
- **🔒 Privacy First**: All data stored locally with optional backup functionality
- **📱 PWA Ready**: Works offline and can be installed as a mobile app

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: Local Storage API
- **PWA**: Web App Manifest + Service Worker
- **Hosting**: GitHub Pages ready

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OogCycle
   ```

2. **Run locally**
   - Simply open `index.html` in your browser
   - Or serve with a local server (recommended for PWA features):
     ```bash
     python -m http.server 8000
     # or
     npx serve .
     ```

3. **Visit the app**
   - Open `http://localhost:8000` in your browser

## Project Structure

```
OogCycle/
├── index.html          # Main HTML file
├── style.css           # CSS styles (cute, pastel design)
├── script.js           # JavaScript functionality
├── manifest.json       # PWA manifest
├── service-worker.js   # Service worker for offline functionality
├── plan.rtf           # Original project plan
└── README.md          # This file
```

## Usage

### Logging Your Period
- Click the "🩸 Log Period" button
- Or click on any day in the calendar
- Select "Start Period" or "End Period"

### Tracking Mood
- Click the "💭 Track Mood" button
- Choose from 6 mood options with cute emojis
- View mood indicators on the calendar

### Navigation
- Use the left/right arrows to navigate months
- Click on any day to see details or add data
- Use the bottom navigation to switch between views

## Design Principles

- **Simplicity First**: Minimal learning curve, intuitive interface
- **Cute & Approachable**: Soft color palette, friendly iconography
- **Privacy & Security**: All data stored locally, no account required
- **Mobile-First**: Responsive design optimized for mobile devices

## Data Privacy

- All data is stored locally in your browser
- No data is sent to external servers
- No account creation required
- Data can be exported as JSON for backup

## Future Features

- Gentle reminder notifications
- Cycle insights and statistics
- Data export/import functionality
- Optional PIN protection
- Cute themes and customization

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

MIT License - feel free to use and modify as needed.

---

Built with 💖 for simple, beautiful period tracking. 