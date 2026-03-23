# Channel Adapter Guide

> *Creating and using channel adapters for SymbiLink*

## Overview

Channel adapters provide a unified interface for communicating across different messaging platforms. Each adapter implements the `ChannelAdapter` interface, allowing consistent message handling regardless of the underlying channel.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ChannelManager                        │
│  - Registers adapters                                   │
│  - Routes messages                                      │
│  - Manages connections                                  │
└─────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   Telegram   │ │   WhatsApp   │ │   Discord    │
    │   Adapter    │ │   Adapter    │ │   Adapter    │
    └──────────────┘ └──────────────┘ └──────────────┘
```

## Available Adapters

| Adapter | Type | Description |
|---------|------|-------------|
| `TelegramAdapter` | `telegram` | Telegram Bot API integration |
| `WhatsAppAdapter` | `whatsapp` | WhatsApp Business API integration |
| `DiscordAdapter` | `discord` | Discord bot integration |
| `WebChatAdapter` | `webchat` | WebSocket browser chat |
| `AudioAdapter` | `audio` | Speech-to-text / Text-to-speech |
| `VisionAdapter` | `vision` | Image analysis and OCR |

## Using the Channel Manager

### Basic Setup

```typescript
import { ChannelManager, TelegramAdapter, WhatsAppAdapter } from './channels';

const manager = new ChannelManager();

// Register adapters
manager.registerAdapter(new TelegramAdapter(), {
  type: 'telegram',
  channelId: 'main-telegram',
  enabled: true,
  credentials: {
    botToken: process.env.TELEGRAM_BOT_TOKEN
  }
});

manager.registerAdapter(new WhatsAppAdapter(), {
  type: 'whatsapp',
  channelId: 'main-whatsapp',
  enabled: true,
  credentials: {
    apiKey: process.env.WHATSAPP_API_KEY,
    phoneNumberId: process.env.WHATSAPP_PHONE_ID
  }
});

// Initialize and connect
await manager.initializeAll();
await manager.connectAll();
```

### Handling Incoming Messages

```typescript
manager.onMessage(async (message) => {
  console.log(`Received from ${message.channelType}: ${message.content.text}`);
  
  // Process message through your agent
  const response = await agent.process(message.content.text);
  
  // Send response back
  await manager.send({
    channelType: message.channelType,
    channelId: message.channelId,
    conversationId: message.conversationId,
    content: {
      type: 'text',
      text: response
    }
  });
});
```

### Monitoring Channel Status

```typescript
// Get status of all channels
const status = manager.getStatus();
console.log(`${manager.getConnectedCount()} channels connected`);

// Get specific channel status
const telegramStatus = manager.getChannelStatus('telegram', 'main-telegram');
```

## Creating a Custom Adapter

### Step 1: Extend BaseChannelAdapter

```typescript
import { BaseChannelAdapter, ChannelConfig, ChannelCapabilities, OutgoingMessage } from '../types';

export class MyAdapter extends BaseChannelAdapter {
  readonly type = 'mychannel' as const;

  protected async onInitialize(config: ChannelConfig): Promise<void> {
    // Initialize your channel with config
    const apiKey = config.credentials.apiKey;
    // ... setup code
  }

  protected async onConnect(): Promise<void> {
    // Establish connection
    // ... connection code
  }

  protected async onDisconnect(): Promise<void> {
    // Clean up connection
    // ... cleanup code
  }

  protected async onSend(message: OutgoingMessage): Promise<void> {
    // Send message through your channel
    // ... send code
  }

  protected onGetCapabilities(): Partial<ChannelCapabilities> {
    return {
      text: true,
      images: true,
      audio: false,
      files: true,
      replies: true
    };
  }
}
```

### Step 2: Emit Incoming Messages

```typescript
// When you receive a message from your channel
private handleIncoming(rawMessage: any): void {
  const incomingMessage: IncomingMessage = {
    id: `msg-${Date.now()}`,
    channelType: this.type,
    channelId: this.channelId,
    conversationId: rawMessage.conversationId,
    senderId: rawMessage.senderId,
    senderName: rawMessage.senderName,
    content: {
      type: 'text',
      text: rawMessage.text
    },
    timestamp: Date.now(),
    isGroup: rawMessage.isGroup || false,
    raw: rawMessage
  };

  this.emitMessage(incomingMessage);
}
```

### Step 3: Register with ChannelManager

```typescript
const manager = new ChannelManager();
manager.registerAdapter(new MyAdapter(), {
  type: 'mychannel',
  channelId: 'my-channel-1',
  enabled: true,
  credentials: {
    apiKey: 'your-api-key'
  }
});
```

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch and emit appropriate events
2. **Rate Limiting**: Implement rate limiting to avoid API bans
3. **Reconnection**: Auto-reconnect on connection loss with exponential backoff
4. **Message Queuing**: Queue messages during disconnection and send on reconnect
5. **Logging**: Log all API interactions for debugging
6. **Validation**: Validate all incoming data before processing

---

*For more examples, see the existing adapter implementations in `src/channels/adapters/`*