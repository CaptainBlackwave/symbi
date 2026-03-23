# API Reference - New WebSocket Methods

> *Gateway WebSocket API for Phase 6 features*

## Overview

This document covers all new WebSocket API methods added in Phase 6 for sandbox, cron, permissions, and canvas functionality.

---

## Connection

```
ws://localhost:18789
```

### Authentication (if enabled)

```javascript
{
  "type": "request",
  "method": "auth",
  "params": {
    "token": "your-auth-token"
  }
}
```

---

## Sandbox API

### sandbox.status

Get current sandbox status.

**Request:**
```javascript
{
  "type": "request",
  "method": "sandbox.status"
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "enabled": true,
    "activeContainers": 3,
    "maxContainers": 10
  }
}
```

### sandbox.test

Test a skill in sandbox environment.

**Request:**
```javascript
{
  "type": "request",
  "method": "sandbox.test",
  "params": {
    "skillId": "my-skill",
    "skillPath": "/path/to/skill"
  }
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "success": true,
    "output": "Skill executed successfully",
    "error": null,
    "duration": 150,
    "memoryUsed": 52428800
  }
}
```

---

## Cron API

### cron.create

Create a new cron job.

**Request:**
```javascript
{
  "type": "request",
  "method": "cron.create",
  "params": {
    "name": "Daily Backup",
    "expression": "0 2 * * *",
    "command": "backup.run",
    "metadata": {
      "type": "backup",
      "priority": "high"
    }
  }
}
```

**Cron Expression Format:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-6, Sunday=0)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Common Patterns:**
| Expression | Description |
|------------|-------------|
| `* * * * *` | Every minute |
| `*/5 * * * *` | Every 5 minutes |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Every day at midnight |
| `0 9 * * 1-5` | Weekdays at 9 AM |
| `0 0 * * 0` | Every Sunday |

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "id": "job-1234567890-abc123",
    "name": "Daily Backup",
    "expression": "0 2 * * *",
    "command": "backup.run",
    "enabled": true,
    "nextRun": 1711158000000,
    "createdAt": 1711113600000
  }
}
```

### cron.list

List all cron jobs.

**Request:**
```javascript
{
  "type": "request",
  "method": "cron.list"
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": [
    {
      "id": "job-123",
      "name": "Daily Backup",
      "expression": "0 2 * * *",
      "command": "backup.run",
      "enabled": true,
      "lastRun": 1711072800000,
      "nextRun": 1711158000000,
      "createdAt": 1710813600000
    },
    {
      "id": "job-456",
      "name": "Hourly Check",
      "expression": "0 * * * *",
      "command": "health.check",
      "enabled": true,
      "nextRun": 1711117200000,
      "createdAt": 1711113600000
    }
  ]
}
```

### cron.delete

Delete a cron job.

**Request:**
```javascript
{
  "type": "request",
  "method": "cron.delete",
  "params": {
    "jobId": "job-123"
  }
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "success": true
  }
}
```

### cron.pause

Pause a cron job.

**Request:**
```javascript
{
  "type": "request",
  "method": "cron.pause",
  "params": {
    "jobId": "job-123"
  }
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "success": true
  }
}
```

### cron.resume

Resume a paused cron job.

**Request:**
```javascript
{
  "type": "request",
  "method": "cron.resume",
  "params": {
    "jobId": "job-123"
  }
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "success": true
  }
}
```

### cron.status

Get cron scheduler status.

**Request:**
```javascript
{
  "type": "request",
  "method": "cron.status"
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "running": true,
    "totalJobs": 5,
    "enabledJobs": 4,
    "disabledJobs": 1
  }
}
```

---

## Permissions API

### permissions.check

Check if a tool is allowed for a session.

**Request:**
```javascript
{
  "type": "request",
  "method": "permissions.check",
  "params": {
    "sessionType": "group",
    "sessionId": "session-123",
    "tool": "shell.exec"
  }
}
```

**Response (Allowed):**
```javascript
{
  "type": "response",
  "result": {
    "allowed": true,
    "reason": "Tool allowed"
  }
}
```

**Response (Denied):**
```javascript
{
  "type": "response",
  "result": {
    "allowed": false,
    "reason": "Tool explicitly denied"
  }
}
```

**Response (Rate Limited):**
```javascript
{
  "type": "response",
  "result": {
    "allowed": false,
    "reason": "Rate limit exceeded",
    "rateLimited": true
  }
}
```

### permissions.audit

Get permission audit log.

**Request:**
```javascript
{
  "type": "request",
  "method": "permissions.audit",
  "params": {
    "sessionType": "main",
    "sessionId": "session-456",
    "limit": 100
  }
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": [
    {
      "timestamp": 1711135200000,
      "sessionType": "main",
      "sessionId": "session-456",
      "tool": "shell.exec",
      "allowed": true,
      "reason": "All tools allowed"
    },
    {
      "timestamp": 1711135150000,
      "sessionType": "main",
      "sessionId": "session-456",
      "tool": "file.write",
      "allowed": true,
      "reason": "All tools allowed"
    }
  ]
}
```

### permissions.stats

Get permission statistics.

**Request:**
```javascript
{
  "type": "request",
  "method": "permissions.stats"
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "totalChecks": 1523,
    "allowedChecks": 1450,
    "deniedChecks": 73,
    "bySessionType": {
      "main": { "allowed": 800, "denied": 0 },
      "group": { "allowed": 450, "denied": 50 },
      "dm": { "allowed": 150, "denied": 15 },
      "guest": { "allowed": 50, "denied": 8 }
    },
    "byTool": {
      "shell.exec": { "allowed": 300, "denied": 73 },
      "file.read": { "allowed": 500, "denied": 0 },
      "file.write": { "allowed": 400, "denied": 0 },
      "browser.navigate": { "allowed": 250, "denied": 0 }
    }
  }
}
```

---

## Canvas API

### canvas.create

Create a new canvas.

**Request:**
```javascript
{
  "type": "request",
  "method": "canvas.create",
  "params": {
    "sessionId": "session-789",
    "title": "Data Analysis Dashboard"
  }
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "id": "canvas-1234567890-xyz789",
    "title": "Data Analysis Dashboard",
    "sessionId": "session-789",
    "contents": [],
    "createdAt": 1711135200000,
    "updatedAt": 1711135200000
  }
}
```

### canvas.list

List all canvases.

**Request:**
```javascript
{
  "type": "request",
  "method": "canvas.list",
  "params": {
    "sessionId": "session-789"
  }
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": [
    {
      "id": "canvas-123",
      "title": "Data Analysis Dashboard",
      "sessionId": "session-789",
      "createdAt": 1711135200000,
      "updatedAt": 1711135200000
    },
    {
      "id": "canvas-456",
      "title": "Performance Metrics",
      "sessionId": "session-789",
      "createdAt": 1711131600000,
      "updatedAt": 1711134800000
    }
  ]
}
```

### canvas.delete

Delete a canvas.

**Request:**
```javascript
{
  "type": "request",
  "method": "canvas.delete",
  "params": {
    "canvasId": "canvas-123"
  }
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "success": true
  }
}
```

### canvas.push

Push content to a canvas.

**Request:**
```javascript
{
  "type": "request",
  "method": "canvas.push",
  "params": {
    "canvasId": "canvas-123",
    "type": "html",
    "data": "<h1>Sales Report</h1><p>Total: $1,234,567</p>",
    "position": { "x": 0, "y": 0 },
    "size": { "width": 400, "height": 300 }
  }
}
```

**Content Types:**
| Type | Description | Data Format |
|------|-------------|-------------|
| `html` | HTML content | HTML string |
| `markdown` | Markdown content | Markdown string |
| `chart` | Data visualization | Chart config object |
| `code` | Code with syntax highlighting | Code string |

**Chart Data Example:**
```javascript
{
  "canvasId": "canvas-123",
  "type": "chart",
  "data": {
    "type": "line",
    "title": "Revenue Trend",
    "labels": ["Jan", "Feb", "Mar", "Apr"],
    "datasets": [
      {
        "label": "Revenue",
        "data": [100, 150, 200, 180]
      }
    ]
  }
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "id": "content-789",
    "type": "html",
    "data": "<h1>Sales Report</h1><p>Total: $1,234,567</p>",
    "position": { "x": 0, "y": 0 },
    "size": { "width": 400, "height": 300 },
    "createdAt": 1711135250000,
    "updatedAt": 1711135250000
  }
}
```

### canvas.update

Update existing content.

**Request:**
```javascript
{
  "type": "request",
  "method": "canvas.update",
  "params": {
    "canvasId": "canvas-123",
    "contentId": "content-789",
    "updates": {
      "data": "<h1>Sales Report</h1><p>Total: $2,345,678</p>",
      "position": { "x": 100, "y": 50 }
    }
  }
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "id": "content-789",
    "type": "html",
    "data": "<h1>Sales Report</h1><p>Total: $2,345,678</p>",
    "position": { "x": 100, "y": 50 },
    "size": { "width": 400, "height": 300 },
    "createdAt": 1711135250000,
    "updatedAt": 1711135300000
  }
}
```

### canvas.remove

Remove content from canvas.

**Request:**
```javascript
{
  "type": "request",
  "method": "canvas.remove",
  "params": {
    "canvasId": "canvas-123",
    "contentId": "content-789"
  }
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "success": true
  }
}
```

### canvas.status

Get canvas manager status.

**Request:**
```javascript
{
  "type": "request",
  "method": "canvas.status"
}
```

**Response:**
```javascript
{
  "type": "response",
  "result": {
    "enabled": true,
    "running": true,
    "port": 18790,
    "canvasCount": 5,
    "clientCount": 3
  }
}
```

---

## Canvas WebSocket (Separate Server)

Connect to canvas WebSocket server for real-time updates:

```
ws://localhost:18790
```

### Subscribe to Canvas

```javascript
{
  "type": "subscribe",
  "canvasId": "canvas-123"
}
```

### Receive Canvas State

```javascript
{
  "type": "canvas_state",
  "canvas": {
    "id": "canvas-123",
    "title": "Data Analysis Dashboard",
    "contents": [...],
    "createdAt": 1711135200000,
    "updatedAt": 1711135200000
  }
}
```

### Receive Content Updates

```javascript
{
  "type": "content_added",
  "canvasId": "canvas-123",
  "content": {
    "id": "content-new",
    "type": "html",
    "data": "<p>New content</p>",
    "position": { "x": 0, "y": 0 },
    "size": { "width": 400, "height": 300 }
  }
}
```

```javascript
{
  "type": "content_updated",
  "canvasId": "canvas-123",
  "content": { ... }
}
```

```javascript
{
  "type": "content_removed",
  "canvasId": "canvas-123",
  "contentId": "content-789"
}
```

---

## Error Handling

### Standard Error Response

```javascript
{
  "type": "response",
  "id": "request-id",
  "error": {
    "code": -32601,
    "message": "Method not found: invalid.method"
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `-32700` | Parse error |
| `-32600` | Invalid message type |
| `-32601` | Method not found |
| `-32000` | Execution error |
| `-32001` | Not authenticated |

---

## Complete Example

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:18789');

ws.on('open', () => {
  console.log('Connected to Gateway');
  
  // Create a cron job
  ws.send(JSON.stringify({
    type: 'request',
    id: 'req-1',
    method: 'cron.create',
    params: {
      name: 'Hourly Health Check',
      expression: '0 * * * *',
      command: 'health.check'
    }
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message);
  
  if (message.id === 'req-1') {
    console.log('Cron job created:', message.result);
  }
});

ws.on('close', () => {
  console.log('Disconnected');
});
```

---

*Last Updated: 2026-03-22*