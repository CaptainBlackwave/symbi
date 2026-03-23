# Voice Setup Guide - Wake Word Configuration

> *Configuring voice activation and speech capabilities for SymbiLink*

## Overview

SymbiLink supports voice activation with wake words like "Hey SymbiLink" and "OK SymbiLink". This guide covers setup, configuration, and troubleshooting.

---

## Features

- **Wake Word Detection** - Activate with "Hey SymbiLink" or "OK SymbiLink"
- **Speech-to-Text (STT)** - Convert voice commands to text
- **Text-to-Speech (TTS)** - Spoken responses from the agent
- **Privacy-First** - All audio processed locally (no cloud)

---

## Prerequisites

### Browser Support

| Browser | Wake Word | STT | TTS |
|---------|-----------|-----|-----|
| Chrome | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Firefox | ❌ | ✅ | ✅ |
| Safari | ❌ | ✅ | ✅ |

### System Requirements

- Microphone access
- HTTPS (required for microphone access in browsers)
- Modern browser with Web Audio API support

---

## Configuration

**File:** `config/voice.yml`

```yaml
voice:
  # Wake word detection
  wakeWord:
    enabled: true
    model: "./models/hey-symbilink.onnx"
    sensitivity: 0.7  # 0-1, higher = more sensitive
    keywords:
      - "hey symbilink"
      - "ok symbilink"
  
  # Text-to-Speech
  tts:
    provider: "browser"  # "browser", "elevenlabs", or "local"
    voice: "default"
    rate: 1.0  # Speech rate (0.5-2.0)
    pitch: 1.0  # Voice pitch (0-2)
  
  # Speech-to-Text
  stt:
    provider: "browser"  # "browser" or "whisper"
    model: "base"
    language: "en-US"
  
  # Audio settings
  audio:
    sampleRate: 16000
    frameLength: 512
    echoCancellation: true
    noiseSuppression: true
```

---

## Setup Instructions

### 1. Enable Wake Word Detection

```yaml
voice:
  wakeWord:
    enabled: true
    sensitivity: 0.7
    keywords:
      - "hey symbilink"
      - "ok symbilink"
```

### 2. Configure TTS Provider

#### Browser TTS (Default - No Setup Required)

```yaml
voice:
  tts:
    provider: "browser"
    voice: "default"
    rate: 1.0
    pitch: 1.0
```

#### ElevenLabs (Premium)

```yaml
voice:
  tts:
    provider: "elevenlabs"
    voice: "rachel"
```

Set environment variable:
```bash
ELEVENLABS_API_KEY=your-api-key
```

### 3. Configure STT Provider

#### Browser STT (Default - No Setup Required)

```yaml
voice:
  stt:
    provider: "browser"
    language: "en-US"
```

#### Whisper (Local - More Accurate)

```yaml
voice:
  stt:
    provider: "whisper"
    model: "base"  # "tiny", "base", "small", "medium", "large"
```

---

## Desktop App Integration

### Initialize Voice Manager

```typescript
import { VoiceManager } from './voice/voice-manager';

const voiceManager = new VoiceManager({
  wakeWord: {
    enabled: true,
    model: './models/hey-symbilink.onnx',
    sensitivity: 0.7,
    keywords: ['hey symbilink', 'ok symbilink']
  },
  tts: {
    provider: 'browser',
    voice: 'default',
    rate: 1.0,
    pitch: 1.0
  },
  stt: {
    provider: 'browser',
    language: 'en-US'
  }
});

await voiceManager.initialize();
```

### Start Listening

```typescript
// Start wake word detection
await voiceManager.startListening();

// Listen for wake word
voiceManager.on('wake_word_detected', (result) => {
  console.log('Wake word detected:', result.keyword);
  console.log('Confidence:', result.confidence);
});

// Listen for voice commands
voiceManager.on('command', (command) => {
  console.log('Transcript:', command.transcript);
  console.log('Confidence:', command.confidence);
  
  // Send to agent
  gateway.send({
    method: 'voice.command',
    params: { transcript: command.transcript }
  });
});
```

### Speak Responses

```typescript
// Speak text
await voiceManager.speak('Hello! How can I help you?');

// Speak with options
await voiceManager.speak('Processing your request...', {
  rate: 1.2,
  pitch: 1.0
});

// Stop speaking
voiceManager.stopSpeaking();
```

---

## Wake Word Detection

### How It Works

1. Audio captured from microphone
2. Processed through wake word model
3. Detection triggers listening mode
4. Speech recognition activates
5. Command sent to agent

### Sensitivity Settings

| Sensitivity | Behavior |
|-------------|----------|
| `0.3` | Low - Fewer false positives, may miss some activations |
| `0.5` | Medium - Balanced detection |
| `0.7` | High (default) - More responsive, some false positives |
| `0.9` | Very High - Very responsive, more false positives |

### Custom Wake Words

```yaml
voice:
  wakeWord:
    keywords:
      - "hey symbilink"
      - "ok symbilink"
      - "computer"
      - "assistant"
```

**Note:** Custom keywords require retraining the wake word model.

---

## Testing Wake Word Detection

### Simulate Detection (For Testing)

```typescript
// Simulate wake word detection
voiceManager.simulateDetection('hey symbilink');
```

### Check Status

```typescript
const status = voiceManager.getStatus();

console.log('Is listening:', status.isListening);
console.log('Is speaking:', status.isSpeaking);
console.log('Wake word enabled:', status.wakeWordEnabled);
console.log('Queue length:', status.queueLength);
```

---

## Available Voices

### Browser TTS Voices

```typescript
const voices = voiceManager.getVoices();

voices.forEach(voice => {
  console.log(`${voice.name} (${voice.lang})`);
});
```

### Common Voice Names

| Voice | Language | Gender |
|-------|----------|--------|
| `Google US English` | en-US | Female |
| `Google UK English Female` | en-GB | Female |
| `Google UK English Male` | en-GB | Male |
| `Microsoft David` | en-US | Male |
| `Microsoft Zira` | en-US | Female |

---

## Audio Settings

### Sample Rate

```yaml
voice:
  audio:
    sampleRate: 16000  # 16kHz is standard for speech
```

### Echo Cancellation

```yaml
voice:
  audio:
    echoCancellation: true  # Reduces echo from speakers
```

### Noise Suppression

```yaml
voice:
  audio:
    noiseSuppression: true  # Reduces background noise
```

---

## Troubleshooting

### Wake Word Not Detected

**Problem:** Wake word detection not working

**Solutions:**
1. Check microphone permissions
2. Increase sensitivity: `sensitivity: 0.9`
3. Speak clearly and close to microphone
4. Check browser console for errors

### Microphone Access Denied

**Problem:** Browser blocks microphone access

**Solutions:**
1. Enable HTTPS (required for microphone)
2. Allow microphone in browser settings
3. Check system microphone permissions

### TTS Not Working

**Problem:** No speech output

**Solutions:**
1. Check if `window.speechSynthesis` is available
2. Verify voice is installed: `voiceManager.getVoices()`
3. Check volume settings
4. Try different voice

### High Latency

**Problem:** Slow response to wake word

**Solutions:**
1. Use smaller Whisper model: `model: "tiny"`
2. Disable echo cancellation if not needed
3. Close other audio applications
4. Check system resources

### False Positives

**Problem:** Triggering without wake word

**Solutions:**
1. Decrease sensitivity: `sensitivity: 0.5`
2. Use more specific wake word
3. Check for background noise
4. Implement cooldown period

---

## Privacy & Security

### Local Processing

- All audio processed locally on device
- No audio sent to cloud servers
- Wake word model runs on-device

### No Recording

- Audio not recorded or stored
- Only processed in real-time
- No persistent audio files

### Permissions

```yaml
# Request minimal permissions
permissions:
  microphone: true
  camera: false
  location: false
```

---

## Advanced Configuration

### Custom Audio Processing

```typescript
// Custom audio frame handler
voiceManager.on('audio_frame', (frame) => {
  // Process audio data
  const energy = calculateEnergy(frame.data);
  
  if (energy > threshold) {
    // Voice detected
  }
});
```

### Event Handling

```typescript
// Listen for all events
voiceManager.on('initialized', () => {
  console.log('Voice manager ready');
});

voiceManager.on('listening_started', () => {
  console.log('Started listening');
});

voiceManager.on('listening_stopped', () => {
  console.log('Stopped listening');
});

voiceManager.on('speaking_started', (text) => {
  console.log('Speaking:', text);
});

voiceManager.on('speaking_ended', (text) => {
  console.log('Finished speaking');
});

voiceManager.on('error', (error) => {
  console.error('Voice error:', error);
});
```

### Cleanup

```typescript
// Cleanup when done
voiceManager.destroy();
```

---

## API Reference

### VoiceManager Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize voice system |
| `startListening()` | Start wake word detection |
| `stopListening()` | Stop listening |
| `speak(text, options?)` | Speak text |
| `stopSpeaking()` | Stop current speech |
| `simulateDetection(keyword?)` | Simulate wake word (testing) |
| `getVoices()` | Get available TTS voices |
| `getStatus()` | Get current status |
| `updateConfig(config)` | Update configuration |
| `destroy()` | Cleanup resources |

### Events

| Event | Description |
|-------|-------------|
| `initialized` | Voice manager ready |
| `wake_word_detected` | Wake word detected |
| `command` | Voice command received |
| `listening_started` | Started listening |
| `listening_stopped` | Stopped listening |
| `speaking_started` | Started speaking |
| `speaking_ended` | Finished speaking |
| `error` | Error occurred |

---

## Example: Complete Integration

```typescript
import { VoiceManager } from './voice/voice-manager';
import { Gateway } from './gateway';

async function setupVoice() {
  const gateway = new Gateway();
  const voiceManager = new VoiceManager();
  
  await voiceManager.initialize();
  
  // Handle wake word
  voiceManager.on('wake_word_detected', async (result) => {
    await voiceManager.speak('Yes?');
  });
  
  // Handle commands
  voiceManager.on('command', async (command) => {
    const response = await gateway.send({
      method: 'agent.chat',
      params: { message: command.transcript }
    });
    
    await voiceManager.speak(response.text);
  });
  
  // Start listening
  await voiceManager.startListening();
  
  console.log('Voice assistant ready!');
}

setupVoice();
```

---

*Last Updated: 2026-03-22*