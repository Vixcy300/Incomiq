# Incomiq Mobile App

Flutter-based Android app for personal finance management with automatic bank SMS detection.

## Prerequisites

- Flutter SDK 3.22+ (Dart 3.3+)
- Android Studio / VS Code with Flutter extension
- Android emulator or physical device (API 26+)
- Running Incomiq backend server

## Quick Start

```bash
# Navigate to the mobile-native folder
cd mobile-native

# Install dependencies
flutter pub get

# Run code generation (Hive, Riverpod)
flutter pub run build_runner build --delete-conflicting-outputs

# Run on connected device/emulator
flutter run
```

## Running the Backend

The app defaults to `http://10.0.2.2:8000/api` which maps to your **host machine's localhost** from the Android emulator.

Start the backend:
```bash
cd ..
uvicorn app.main:app --reload --port 8000
```

> For a physical device, update the backend URL in **Settings → Backend API URL** to your computer's IP address: `http://192.168.x.x:8000/api`

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Financial health score, income/expense charts, AI insights |
| **Income** | Track income with categories, search and filter |
| **Expenses** | Expense tracking with SMS auto-import |
| **Goals** | Savings goals with progress rings and confetti |
| **Investments** | Risk quiz → personalised investment recommendations |
| **AI Chat** | Ask financial questions in English, Hindi, or Tamil |
| **Rules** | Automation rules (save 10%, alert on big spend, etc.) |
| **SMS Alerts** | Auto-detect bank transactions from SMS messages |
| **Settings** | Theme, backend URL, notifications, WhatsApp integration |

## SMS Bank Detection

The app automatically reads SMS messages matching Indian bank keywords:
- **Supported banks:** SBI, HDFC, ICICI, AXIS, KOTAK, PHONEPE, PAYTM, GPAY, Amazon Pay, YES Bank, IndusInd, and more

Grant SMS permission on first launch of the SMS Alerts tab.

## Architecture

```
lib/
├── main.dart                    # Entry point
├── core/
│   ├── theme.dart               # Material 3 theme + ThemeMode provider
│   ├── router.dart              # GoRouter with auth redirect
│   ├── shell/app_shell.dart     # Bottom navigation bar shell
│   ├── api/api_client.dart      # Dio HTTP client with JWT interceptor
│   ├── storage/hive_boxes.dart  # Hive local storage boxes
│   └── sms/
│       ├── sms_parser.dart      # Bank SMS regex parser
│       └── sms_service.dart     # SMS MethodChannel bridge
└── features/
    ├── auth/                    # Login/Signup screens
    ├── dashboard/               # Financial overview
    ├── income/                  # Income management
    ├── expenses/                # Expense management
    ├── goals/                   # Savings goals
    ├── investments/             # Risk quiz + recommendations
    ├── ai_chat/                 # AI financial advisor chat
    ├── rules/                   # Automation rules
    ├── sms_alerts/              # Bank SMS detection
    └── settings/                # App configuration
```

## Build for Release

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `flutter_riverpod` | 2.5.1 | State management |
| `go_router` | 14.2.0 | Navigation |
| `dio` | 5.4.3 | HTTP client |
| `hive_flutter` | 1.1.0 | Local storage |
| `fl_chart` | 0.68.0 | Charts |
| `dynamic_color` | 1.7.0 | Material You theming |
| `telephony` | 0.2.0 | SMS reading |
| `speech_to_text` | 6.6.2 | Voice input |
| `confetti` | 0.7.0 | Goal completion animation |
| `shimmer` | 3.0.0 | Loading skeletons |
| `permission_handler` | 11.3.1 | Runtime permissions |
| `flutter_local_notifications` | 17.2.2 | Push notifications |
