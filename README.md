# VitSplit - Expense Splitting App

## Overview

VitSplit is a modern expense splitting app built with React Native. It allows users to create groups, add expenses, and split bills with friends and family.

## Features

- User onboarding flow
- Authentication (Login/Signup)
- Create and manage groups
- Add expenses with details (amount, description, category, date, receipt image)
- Split expenses among group members
- Track balances and payments
- Dark mode support
- Modern UI with animations

## Tech Stack

- React Native
- React Navigation
- NativeWind (Tailwind CSS for React Native)
- React Native Reanimated
- React Native Gesture Handler
- React Native Vector Icons

## Prerequisites

- [Node.js > 18](https://nodejs.org) and npm (Recommended: Use [nvm](https://github.com/nvm-sh/nvm))
- [Watchman](https://facebook.github.io/watchman)
- [Xcode 15](https://developer.apple.com/xcode)
- [Cocoapods 1.15.2](https://cocoapods.org)
- [JDK > 17](https://www.oracle.com/java/technologies/javase-jdk17-downloads.html)
- [Android Studio and Android SDK](https://developer.android.com/studio)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/VitSplit.git
cd VitSplit

# Install dependencies
npm install

# Install iOS dependencies
cd ios && pod install && cd ..
```

## Usage

```bash
# Start the Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Project Structure

```
/src
  /assets            # Images, icons, and other static assets
  /components        # Reusable components
    /common          # Common UI components
    /onboarding      # Onboarding-related components
    /auth            # Authentication-related components
    /groups          # Group-related components
    /expenses        # Expense-related components
  /navigation        # Navigation configuration
  /screens           # App screens
    /onboarding      # Onboarding screens
    /auth            # Authentication screens
    /groups          # Group screens
    /expenses        # Expense screens
    /profile         # Profile screens
    /notifications   # Notification screens
  /hooks             # Custom hooks
  /utils             # Utility functions and mock data
  /context           # React context providers
  /theme             # Theme configuration
```

## Future Enhancements

- Backend integration with a real API
- Push notifications
- In-app payments
- Receipt scanning with OCR
- Export expenses to CSV/PDF
- Group statistics and insights

## License

MIT
