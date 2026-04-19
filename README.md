# Birds Retail Audit App (PWA)

A mobile-optimized, high-contrast retail auditing tool designed for speed and efficiency in the field. This application allows users to perform store audits, manage store lists, and capture data with a professional "charcoal and green" interface.

## 🚀 Quick Start
1. **Access the App**: [Insert Your GitHub Pages URL Here]
2. **Setup**: Click the **"Audit Setup"** button to import your audit configurations via JSON or CSV.
3. **Audit**: Navigate through categories and questions to record compliance, add comments, and attach photos.

## 📱 PWA Features
This repository is configured to be converted into a native-like mobile app using **PWA Builder**:
- **Offline Capability**: Works without an internet connection via the Service Worker (`sw.js`).
- **Installable**: Can be added to the home screen on iOS and Android.
- **App Store Ready**: The `manifest.json` provides the necessary metadata for submission to Google Play and the Apple App Store.

## 📂 File Structure
- `index.html`: The main application shell and UI logic.
- `manifest.json`: Web App Manifest for PWA installation and branding.
- `sw.js`: Service Worker for offline caching and performance.
- `icon.png`: App icon (512x512).

## 🛠 Technical Details
- **Design System**: High-contrast dark mode (Charcoal #0b0f14 / Birds Green #10b981).
- **Storage**: Uses local browser storage to persist audit progress.
- **Exporting**: Supports exporting completed audits to JSON for data analysis.

## 🏗 Deployment to App Stores
1. Host this repository on **GitHub Pages**.
2. Go to [PWABuilder.com](https://www.pwabuilder.com/).
3. Enter your URL and follow the steps to generate your Android (APK/AAB) or iOS (XCode) packages.
