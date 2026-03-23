# SymbiLink Companion Apps Guide

## Overview

SymbiLink companion apps provide native experiences across macOS, iOS, and Android, connecting to your Gateway for seamless AI agent interaction.

## Architecture

```
┌─────────────────────────────────────────┐
│           SymbiLink Ecosystem           │
├─────────────────────────────────────────┤
│  ┌───────────┐ ┌─────────┐ ┌─────────┐│
│  │  macOS    │ │  iOS    │ │ Android ││
│  │  (Tauri)  │ │(SwiftUI)│ │(Kotlin) ││
│  └─────┬─────┘ └────┬────┘ └────┬────┘│
│        └─────────────┼───────────┘     │
│                      │                  │
│                ┌─────┴─────┐           │
│                │  Gateway  │           │
│                │ WebSocket │           │
│                └─────┬─────┘           │
│                      │                  │
│                ┌─────┴─────┐           │
│                │   Agent   │           │
│                │   Core    │           │
│                └───────────┘           │
└─────────────────────────────────────────┘
```

## Platform Details

### macOS Desktop App

**Technology**: Tauri (Rust + WebView)

**Features**:
- Menu bar integration
- System tray with status
- Push-to-talk voice
- Wake word detection
- Desktop notifications
- Auto-launch on startup
- Auto-update mechanism

**Build**:
```bash
cd apps/desktop
npm install
npm run dev        # Development
npm run build:mac  # Production build
```

### iOS Companion App

**Technology**: SwiftUI

**Features**:
- Chat interface
- Voice input/output
- Camera integration
- Biometric authentication
- Background refresh
- Widgets

**Build**:
```bash
cd apps/ios
open SymbiLink.xcodeproj
# Build and run in Xcode
```

### Android Companion App

**Technology**: Kotlin + Jetpack Compose

**Features**:
- Material Design 3 UI
- Voice tab with continuous mode
- Camera/screen capture
- Device commands
- Widget support
- Foreground service

**Build**:
```bash
cd apps/android
./gradlew assembleDebug
```

## Common Features

### Gateway Connection

All apps connect via WebSocket:

```typescript
const ws = new WebSocket('ws://gateway:18789');

ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'auth', token: 'xxx' }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMessage(message);
};
```

### Voice Integration

- **Push-to-talk**: Hold button to speak
- **Wake word**: "Hey SymbiLink" activation
- **TTS playback**: Agent responses spoken aloud

### Notifications

Desktop (Tauri):
```typescript
await invoke('plugin:notification|show', {
  title: 'New Message',
  body: message.content
});
```

iOS (Swift):
```swift
let content = UNMutableNotificationContent()
content.title = "New Message"
content.body = message.content
```

Android (Kotlin):
```kotlin
val notification = NotificationCompat.Builder(context, CHANNEL_ID)
    .setContentTitle("New Message")
    .setContentText(message.content)
    .build()
```

## Security

- All local data encrypted at rest
- TLS 1.3 for network connections
- No third-party analytics
- User controls all data sharing

## Troubleshooting

### Connection Issues
```bash
# Check Gateway health
curl http://localhost:18789/health

# Test WebSocket
wscat -c ws://localhost:18789
```

### Voice Not Working
1. Check microphone permissions
2. Verify audio device connected
3. Test with system voice recorder

---

*Version: 1.0.0*
*Last Updated: 2026-03-22*