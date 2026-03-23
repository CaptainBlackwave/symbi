# Security Guide - Tool Allowlist Configuration

> *Production-mode tool restrictions and session-based permissions*

## Overview

The Security system enforces tool access control based on session types, providing production-ready restrictions that prevent unauthorized tool usage while maintaining flexibility for legitimate operations.

---

## Session Types

| Session Type | Description | Access Level |
|--------------|-------------|--------------|
| `main` | Primary agent session | Full access to all tools |
| `group` | Group chat sessions | Restricted - no shell/filesystem |
| `dm` | Direct message sessions | Moderate - no shell/delete |
| `guest` | Guest/unauthenticated | Minimal - read-only |

---

## Configuration

**File:** `config/security.yml`

```yaml
security:
  toolAllowlist:
    enabled: true
    mode: "strict"  # "strict" or "permissive"
    logAllCalls: true
  
  sessionDefaults:
    main:
      shell: true
      filesystem: true
      network: true
      browser: true
      skills: true
    
    group:
      shell: false
      filesystem: false
      network: true
      browser: true
      skills: true
    
    guest:
      shell: false
      filesystem: false
      network: false
      browser: false
      skills: false
  
  rateLimiting:
    enabled: true
    defaultLimit: 60  # Calls per minute
  
  audit:
    enabled: true
    maxEntries: 10000
    logDeniedOnly: false
```

---

## Permission Modes

### Strict Mode (Recommended for Production)
- Tools not in allowlist are **denied by default**
- Only explicitly allowed tools can be used
- Best for security-sensitive environments

### Permissive Mode (Development/Testing)
- Tools not in denylist are **allowed by default**
- Useful for development and testing
- Not recommended for production

---

## Tool Categories

### Shell Tools
| Tool | Description | Main | Group | DM | Guest |
|------|-------------|------|-------|-----|-------|
| `shell.exec` | Execute shell commands | ✅ | ❌ | ❌ | ❌ |
| `shell.stream` | Stream command output | ✅ | ❌ | ❌ | ❌ |

### Filesystem Tools
| Tool | Description | Main | Group | DM | Guest |
|------|-------------|------|-------|-----|-------|
| `file.read` | Read file contents | ✅ | ❌ | ✅ | ❌ |
| `file.write` | Write to files | ✅ | ❌ | ✅ | ❌ |
| `file.delete` | Delete files | ✅ | ❌ | ❌ | ❌ |
| `file.list` | List directory contents | ✅ | ❌ | ✅ | ❌ |

### Network Tools
| Tool | Description | Main | Group | DM | Guest |
|------|-------------|------|-------|-----|-------|
| `network.request` | HTTP requests | ✅ | ✅ | ✅ | ❌ |
| `browser.navigate` | Navigate browser | ✅ | ✅ | ✅ | ❌ |
| `browser.screenshot` | Take screenshots | ✅ | ✅ | ✅ | ❌ |

### Skills Tools
| Tool | Description | Main | Group | DM | Guest |
|------|-------------|------|-------|-----|-------|
| `skills.install` | Install skills | ✅ | ❌ | ❌ | ❌ |
| `skills.execute` | Execute skills | ✅ | ✅ | ✅ | ❌ |
| `skills.list` | List available skills | ✅ | ✅ | ✅ | ❌ |

---

## WebSocket API

### Check Permission

```javascript
// Request
{
  "type": "request",
  "method": "permissions.check",
  "params": {
    "sessionType": "group",
    "sessionId": "session-123",
    "tool": "shell.exec"
  }
}

// Response
{
  "type": "response",
  "result": {
    "allowed": false,
    "reason": "Tool explicitly denied"
  }
}
```

### Get Audit Log

```javascript
// Request
{
  "type": "request",
  "method": "permissions.audit",
  "params": {
    "sessionType": "main",
    "limit": 100
  }
}

// Response
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
    }
  ]
}
```

### Get Statistics

```javascript
// Request
{
  "type": "request",
  "method": "permissions.stats"
}

// Response
{
  "type": "response",
  "result": {
    "totalChecks": 1523,
    "allowedChecks": 1450,
    "deniedChecks": 73,
    "bySessionType": {
      "main": { "allowed": 800, "denied": 0 },
      "group": { "allowed": 450, "denied": 50 },
      "guest": { "allowed": 200, "denied": 23 }
    },
    "byTool": {
      "shell.exec": { "allowed": 300, "denied": 73 },
      "file.read": { "allowed": 500, "denied": 0 }
    }
  }
}
```

---

## Rate Limiting

Configure per-tool rate limits:

```yaml
security:
  rateLimiting:
    enabled: true
    defaultLimit: 60  # Calls per minute
    toolLimits:
      shell.exec: 30
      network.request: 100
      file.write: 50
```

When rate limit is exceeded:
```javascript
{
  "allowed": false,
  "reason": "Rate limit exceeded",
  "rateLimited": true
}
```

---

## Audit Logging

### Log Structure

```typescript
interface AuditLogEntry {
  timestamp: number;        // Unix timestamp in ms
  sessionType: SessionType; // 'main' | 'group' | 'dm' | 'guest'
  sessionId: string;        // Unique session identifier
  tool: string;             // Tool name (e.g., 'shell.exec')
  allowed: boolean;         // Whether access was granted
  reason: string;           // Explanation for decision
}
```

### Querying Logs

```javascript
// Get denied access attempts only
const denied = permissionManager.getAuditLog({ allowed: false });

// Get logs for specific session
const sessionLogs = permissionManager.getAuditLog({ 
  sessionId: 'session-123' 
});

// Get logs since timestamp
const recent = permissionManager.getAuditLog({ 
  since: Date.now() - 3600000 // Last hour
});
```

---

## Best Practices

### 1. Use Strict Mode in Production
```yaml
security:
  toolAllowlist:
    mode: "strict"
```

### 2. Enable Audit Logging
```yaml
security:
  audit:
    enabled: true
    logAllCalls: true
```

### 3. Set Rate Limits for Sensitive Tools
```yaml
security:
  rateLimiting:
    enabled: true
    toolLimits:
      shell.exec: 30
      config.modify: 10
```

### 4. Regular Audit Review
```javascript
// Check for suspicious patterns
const stats = permissionManager.getStats();
if (stats.deniedChecks > stats.allowedChecks * 0.1) {
  console.log('Warning: High denial rate detected');
}
```

### 5. Custom Permissions for Special Sessions
```javascript
// Override permissions for specific session
permissionManager.setCustomPermissions('session-special', {
  sessionType: 'main',
  tools: [
    { tool: 'shell.exec', allowed: true, rateLimit: 10 }
  ],
  capabilities: {
    shell: true,
    filesystem: false,
    network: true,
    browser: false,
    skills: false
  }
});
```

---

## Security Considerations

1. **Default Deny**: In strict mode, unknown tools are denied
2. **Session Isolation**: Each session type has independent permissions
3. **Rate Limiting**: Prevents abuse of sensitive tools
4. **Audit Trail**: Complete history of all access attempts
5. **No Privilege Escalation**: Sessions cannot upgrade their own permissions

---

## Troubleshooting

### Tool Denied Unexpectedly
1. Check session type: `permissions.check`
2. Review audit log: `permissions.audit`
3. Verify configuration: `config/security.yml`
4. Check if strict mode is enabled

### Rate Limit Issues
1. Check current limits: `permissions.stats`
2. Adjust limits in configuration
3. Implement client-side throttling

### Audit Log Growing Too Large
1. Set `logDeniedOnly: true` to reduce volume
2. Reduce `maxEntries` in configuration
3. Implement log rotation

---

*Last Updated: 2026-03-22*