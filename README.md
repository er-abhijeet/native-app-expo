# AI Photo Gallery - Mobile App

This repository contains the mobile application frontend for the AI Photo Gallery system. Built with React Native and Expo, it serves as the primary user interface for capturing, uploading, and viewing photos with advanced AI-driven auto-sharing features.

## 📱 Features

- **Auth0 Integration:** Secure user authentication and registration.
- **Camera & Gallery Access:** Seamlessly capture new photos or upload existing ones from the device media library.
- **AI Auto-Sharing:** Uploaded photos are sent to the backend where AI detects faces. If your face is recognized in someone else's photo, it automatically appears in your shared queue!
- **Modern UI:** Styled using NativeWind (Tailwind CSS for React Native) for a clean, responsive, and intuitive user experience.

## 🛠️ Tech Stack

- **Framework:** React Native & Expo
- **Routing:** Expo Router
- **Styling:** NativeWind (Tailwind CSS)
- **Authentication:** React Native Auth0
- **Storage/State:** AsyncStorage

## 🚀 Getting Started

### Prerequisites
- Node.js
- npm or yarn
- Expo CLI
- Expo Go app on your physical device (or an iOS Simulator / Android Emulator)

### Installation

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables for Auth0 and your backend API endpoint.
4. Start the development server:
   ```bash
   npm start
   ```
5. Scan the QR code with the Expo Go app on your phone, or press `i` for iOS simulator or `a` for Android emulator.

## 🧩 How it connects to the system
This is **1 of 3** repositories in the AI Photo Gallery ecosystem. 
- It acts as the client, sending images to the **Backend Server** for processing.
- The **Web Portal** provides an alternative view, mapping out where photos were taken.
