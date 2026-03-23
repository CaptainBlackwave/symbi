# Gateway API Documentation

> *WebSocket control plane for SymbiLink*

## Overview

The Gateway provides a WebSocket-based control plane for managing sessions, channels, and events. It uses a JSON-RPC style protocol for communication.

## Connection

### WebSocket Endpoint

```
ws://127.0.0.1:18789
```

### Connect Example

```javascript
const ws = new WebSocket('ws://127.0.0.1:18789');

ws.onopen = () => {
  console.log('Connected to SymbiLink Gateway');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

## Message Protocol

### Request Format

```json
{
  "id": "req-123",
  "type": "request",
  "method": "gateway.status",
  "params": {}
}
```

### Response Format

```json
{
  "type": "response",
  "id": "req-123",
  "result": {
    "running": true,
    "port": 18789,
    "clients": 1,
    "uptime": 3600000,
    "channels": 3
  }
}
```

### Error Format

```json
{
  "type": "response",
  "id": "req-123",
  "error": {
    "code": -32601,
    "message": "Method not found"
  }
}
```

## Authentication

### Authenticate

```json
{
  "id": "auth-1",
  "type": "request",
  "method": "auth",
  "params": {
    "token": "your-auth-token"
  }
}
```

**Response:**
```json
{
  "type": "response",
  "id": "auth-1",
  "result": {
    "success": true
  }
}
```

## Methods

### gateway.status

Get the current gateway status.

**Request:**
```json
{
  "id": "status-1",
  "type": "request",
  "method": "gateway.status",
  "params": {}
}
```

**Response:**
```json
{
  "type": "response",
  "id": "status-1",
  "result": {
    "running": true,
    "port": 18789,
    "clients": 2,
    "uptime": 3600000,
    "channels": 3
  }
}
```

### gateway.ping

Ping the gateway to check connectivity.

**Request:**
```json
{
  "id": "ping-1",
  "type": "request",
  "method": "gateway.ping",
  "params": {}
}
```

**Response:**
```json
{
  "type": "response",
  "id": "ping-1",
  "result": {
    "pong": true,
    "timestamp": 1711000000000
  }
}
```

### channels.list

List all registered channels and their status.

**Request:**
```json
{
  "id": "channels-1",
  "type": "request",
  "method": "channels.list",
  "params": {}
}
```

**Response:**
```json
{
  "type": "response",
  "id": "channels-1",
  "result": [
    {
      "type": "telegram",
      "channelId": "main-telegram",
      "connected": true,
      "metrics": {
        "messagesSent": 42,
        "messagesReceived": 38,
        "uptime": 3600000
      }
    },
    {
      "type": "whatsapp",
      "channelId": "main-whatsapp",
      "connected": true,
      "metrics": {
        "messagesSent": 15,
        "messagesReceived": 12,
        "uptime": 3600000
      }
    }
  ]
}
```

### channels.send

Send a message through a channel.

**Request:**
```json
{
  "id": "send-1",
  "type": "request",
  "method": "channels.send",
  "params": {
    "channelType": "telegram",
    "channelId": "main-telegram",
    "conversationId": "123456789",
    "content": {
      "type": "text",
      "text": "Hello from Gateway!"
    }
  }
}
```

**Response:**
```json
{
  "type": "response",
  "id": "send-1",
  "result": {
    "success": true
  }
}
```

### sessions.list

List all active sessions.

**Request:**
```json
{
  "id": "sessions-1",
  "type": "request",
  "method": "sessions.list",
  "params": {
    "type": "main",
    "active": true
  }
}
```

**Response:**
```json
{
  "type": "response",
  "id": "sessions-1",
  "result": [
    {
      "id": "main-telegram-123456789",
      "type": "main",
      "channelId": "main-telegram",
      "conversationId": "123456789",
      "active": true,
      "messageCount": 15
    }
  ]
}
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid request | Malformed request |
| -32601 | Method not found | Unknown method |
| -32000 | Server error | Internal error |
| -32000 | Not authenticated | Authentication required |

## Events

The gateway emits events to connected clients:

### welcome

Sent when a client connects.

```json
{
  "type": "welcome",
  "clientId": "client-1",
  "authenticated": false,
  "message": "Connected to SymbiLink Gateway"
}
```

---

*For session management tools, see [Session Model Documentation](SESSION_MODEL.md)*