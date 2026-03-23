# Session Model Documentation

> *Conversation session management for SymbiLink*

## Overview

Sessions provide isolated conversation contexts for different users, groups, and agents. Each session maintains its own message history, context, and metadata.

## Session Types

| Type | Description | Use Case |
|------|-------------|----------|
| `main` | Direct conversation with a user | One-on-one chats |
| `group` | Group conversation context | Group chats, channels |
| `agent` | Agent-to-agent communication | Multi-agent coordination |

## Session Structure

```typescript
interface Session {
  id: string;                    // Unique session ID
  type: SessionType;             // main, group, or agent
  channelId?: string;            // Associated channel
  conversationId?: string;       // Conversation identifier
  groupId?: string;              // Group ID (for group sessions)
  createdAt: number;             // Creation timestamp
  lastActivity: number;          // Last activity timestamp
  state: SessionState;           // Session state
  active: boolean;               // Whether session is active
}

interface SessionState {
  messages: SessionMessage[];    // Message history
  context: Record<string, unknown>;  // Session context
  metadata: Record<string, unknown>; // Session metadata
}
```

## Using the Session Manager

### Basic Setup

```typescript
import { SessionManager } from './sessions';

const manager = new SessionManager({
  dataDir: './data/sessions',
  autoSave: true,
  saveInterval: 60000,  // Save every minute
  sessionTTL: 86400000  // 24 hours
});

await manager.initialize();
```

### Creating Sessions

```typescript
// Create a new session
const session = manager.create({
  type: 'main',
  channelId: 'telegram-main',
  conversationId: 'user-123'
});

// Get or create session (returns existing if found)
const session = manager.getOrCreate({
  type: 'main',
  channelId: 'telegram-main',
  conversationId: 'user-123'
});
```

### Managing Messages

```typescript
// Add a message to session
const message = manager.addMessage(session.id, {
  role: 'user',
  content: 'Hello!',
  channelType: 'telegram',
  metadata: {
    senderId: 'user-123'
  }
});

// Get messages from session
const messages = manager.getMessages(session.id);

// Get limited messages
const recentMessages = manager.getMessages(session.id, 10);
```

### Session Context

```typescript
// Update session context
manager.updateContext(session.id, {
  userName: 'John',
  preferences: { language: 'en' }
});

// Update session metadata
manager.updateMetadata(session.id, {
  lastIntent: 'greeting'
});
```

### Listing Sessions

```typescript
// List all sessions
const allSessions = manager.list();

// Filter by type
const mainSessions = manager.list({ type: 'main' });

// Filter by activity
const activeSessions = manager.list({ active: true });

// Filter by channel
const telegramSessions = manager.list({ channelId: 'telegram-main' });
```

### Session Statistics

```typescript
const stats = manager.getStats();
console.log(`Total: ${stats.total}, Active: ${stats.active}`);
console.log(`Main: ${stats.byType.main}, Group: ${stats.byType.group}`);
```

### Closing Sessions

```typescript
// Close a session (marks as inactive)
manager.close(session.id);

// Delete a session completely
manager.delete(session.id);
```

## Using the Session Router

The router automatically routes incoming messages to appropriate sessions.

### Basic Routing

```typescript
import { SessionRouter } from './sessions';

const router = new SessionRouter(manager, {
  defaultDirectSessionType: 'main',
  defaultGroupSessionType: 'group',
  requireMentionInGroups: true,
  botName: 'SymbiLink',
  mentionPatterns: ['@bot', '@symbilink', '/bot']
});

// Route an incoming message
const session = router.route(incomingMessage);

if (session) {
  // Message should be processed
  console.log(`Routed to session: ${session.id}`);
} else {
  // Message filtered out (e.g., no mention in group)
  console.log('Message filtered');
}
```

### Getting Sessions by Context

```typescript
// Get main session for a user
const mainSession = router.getMainSession('telegram-main', 'user-123');

// Get group session
const groupSession = router.getGroupSession('telegram-main', 'group-456');

// Get agent session
const agentSession = router.getAgentSession('agent-worker-1');
```

## Using Session Tools

Session tools enable multi-agent coordination.

### List Sessions

```typescript
import { SessionTools } from './sessions';

const tools = new SessionTools(manager, router);

// List all sessions
const result = await tools.sessions_list();

// List with filter
const result = await tools.sessions_list({ type: 'main', active: true });
```

### Send Messages Between Sessions

```typescript
// Send message to another session
await tools.sessions_send('target-session-id', 'Hello from another session!', {
  role: 'assistant'
});
```

### Get Session History

```typescript
// Get full history
const history = await tools.sessions_history('session-id');

// Get limited history
const history = await tools.sessions_history('session-id', {
  limit: 20,
  offset: 0,
  includeMetadata: true
});
```

### Update Session Context

```typescript
await tools.sessions_update_context('session-id', {
  currentTask: 'processing',
  progress: 50
});
```

## Session Persistence

Sessions are automatically persisted to disk:

```
data/sessions/
└── sessions.json   # All session data
```

The session manager handles:
- Auto-save at configured intervals
- Loading sessions on startup
- Cleanup of expired sessions

## Best Practices

1. **Session Cleanup**: Regularly close inactive sessions to free memory
2. **Context Limits**: Keep session context small; use metadata for large data
3. **Message Limits**: Set reasonable limits on message history
4. **TTL Configuration**: Set appropriate time-to-live based on use case

## Example: Complete Message Flow

```typescript
import { ChannelManager, SessionManager, SessionRouter } from './';

// Setup
const channelManager = new ChannelManager();
const sessionManager = new SessionManager();
const sessionRouter = new SessionRouter(sessionManager);

await sessionManager.initialize();

// Handle incoming message
channelManager.onMessage(async (message) => {
  // Route to session
  const session = sessionRouter.route(message);
  
  if (!session) return; // Filtered out
  
  // Add to session history
  sessionManager.addMessage(session.id, {
    role: 'user',
    content: message.content.text,
    channelType: message.channelType,
    metadata: { senderId: message.senderId }
  });
  
  // Process with agent
  const response = await agent.process(message.content.text, {
    sessionId: session.id,
    sessionType: session.type
  });
  
  // Add response to session
  sessionManager.addMessage(session.id, {
    role: 'assistant',
    content: response,
    channelType: message.channelType
  });
  
  // Send response
  await channelManager.send({
    channelType: message.channelType,
    channelId: message.channelId,
    conversationId: message.conversationId,
    content: { type: 'text', text: response }
  });
});
```

---

*For gateway integration, see [Gateway API Documentation](GATEWAY_API.md)*