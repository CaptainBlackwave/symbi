# Skill Development Guide - Sandbox Requirements

> *Developing secure, sandboxed skills for SymbiLink*

## Overview

This guide covers developing skills that run in SymbiLink's Docker sandbox environment. The sandbox provides security isolation for untrusted skills while maintaining full functionality.

---

## Sandbox Architecture

```
┌─────────────────────────────────────────┐
│           Host System                   │
│  ┌───────────────────────────────────┐  │
│  │     Docker Container              │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   Skill Execution           │  │  │
│  │  │   - Non-root user           │  │  │
│  │  │   - Read-only filesystem    │  │  │
│  │  │   - Limited resources       │  │  │
│  │  │   - Network isolation       │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Skill Structure

```
my-skill/
├── index.js          # Main entry point
├── package.json      # Dependencies
├── skill.json        # Skill metadata
├── README.md         # Documentation
└── tests/            # Test files
    └── test.js
```

### skill.json (Required)

```json
{
  "name": "my-skill",
  "version": "1.0.0",
  "description": "Skill description",
  "author": "Your Name",
  "sandbox": {
    "memoryLimit": "256m",
    "cpuLimit": 0.5,
    "networkMode": "none",
    "timeout": 30000
  },
  "permissions": {
    "filesystem": false,
    "network": false,
    "shell": false
  },
  "entryPoint": "index.js"
}
```

### index.js (Entry Point)

```javascript
/**
 * Skill Entry Point
 * Must export a function or have a run() method
 */

// Option 1: Export function directly
module.exports = async function(context) {
  const { input, logger, storage } = context;
  
  logger.info('Skill executing...');
  
  // Process input
  const result = await processData(input);
  
  return {
    success: true,
    output: result
  };
};

// Option 2: Export object with run method
module.exports = {
  async run(context) {
    // Implementation
  }
};

async function processData(input) {
  // Your logic here
  return `Processed: ${input}`;
}
```

---

## Sandbox Configuration

### Resource Limits

```yaml
# config/sandbox.yml
sandbox:
  enabled: true
  defaultMemoryLimit: "256m"
  defaultCpuLimit: 0.5
  defaultTimeout: 30000
  networkMode: "none"
```

### Memory Limits

| Limit | Use Case |
|-------|----------|
| `128m` | Simple text processing |
| `256m` | Default - most skills |
| `512m` | Data processing |
| `1g` | Heavy computation |

### CPU Limits

| Limit | Description |
|-------|-------------|
| `0.25` | 25% of one core |
| `0.5` | 50% of one core (default) |
| `1.0` | 100% of one core |

---

## Context Object

The skill receives a context object with the following:

```typescript
interface SkillContext {
  input: any;                    // Input data
  logger: Logger;                // Logging interface
  storage: Storage;              // Persistent storage
  config: SkillConfig;           // Skill configuration
  emit: (event: string, data: any) => void;  // Event emission
}

interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

interface Storage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
}
```

### Example Usage

```javascript
module.exports = async function(context) {
  const { input, logger, storage } = context;
  
  // Log messages
  logger.info('Starting processing...');
  
  // Store data
  await storage.set('lastRun', Date.now());
  
  // Retrieve data
  const previous = await storage.get('previousValue');
  
  // Process
  const result = {
    current: input,
    previous,
    timestamp: Date.now()
  };
  
  logger.info('Processing complete');
  
  return result;
};
```

---

## Testing Skills

### Local Testing

```bash
# Test skill locally
npm test

# Test with sandbox
npx symbilink sandbox test ./my-skill
```

### Test File Example

```javascript
// tests/test.js
const { expect } = require('chai');
const skill = require('../index');

describe('My Skill', function() {
  it('should process input correctly', async function() {
    const context = {
      input: 'test input',
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {}
      },
      storage: {
        get: async () => null,
        set: async () => {},
        delete: async () => {},
        list: async () => []
      }
    };
    
    const result = await skill(context);
    
    expect(result.success).to.be.true;
    expect(result.output).to.be.a('string');
  });
});
```

### Sandbox Testing via API

```javascript
// Test skill in sandbox via Gateway WebSocket
{
  "type": "request",
  "method": "sandbox.test",
  "params": {
    "skillId": "my-skill",
    "skillPath": "/path/to/skill"
  }
}

// Response
{
  "type": "response",
  "result": {
    "success": true,
    "output": "Skill executed successfully",
    "duration": 150,
    "memoryUsed": 52428800
  }
}
```

---

## Security Best Practices

### 1. No Sensitive Data in Code

```javascript
// ❌ Bad
const API_KEY = 'secret-key-12345';

// ✅ Good - Use context config
module.exports = async function(context) {
  const apiKey = context.config.apiKey; // Passed at runtime
};
```

### 2. Validate All Input

```javascript
module.exports = async function(context) {
  const { input } = context;
  
  // Validate input
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input: expected string');
  }
  
  if (input.length > 10000) {
    throw new Error('Input too long');
  }
  
  // Sanitize
  const sanitized = input.replace(/[<>]/g, '');
  
  return { output: sanitized };
};
```

### 3. Handle Errors Gracefully

```javascript
module.exports = async function(context) {
  try {
    // Risky operation
    const result = await riskyOperation();
    return { success: true, output: result };
  } catch (error) {
    context.logger.error(`Operation failed: ${error.message}`);
    return { 
      success: false, 
      error: error.message 
    };
  }
};
```

### 4. Respect Resource Limits

```javascript
module.exports = async function(context) {
  // ❌ Bad - Unbounded loop
  let result = '';
  for (let i = 0; i < 1000000000; i++) {
    result += 'x';
  }
  
  // ✅ Good - Bounded operation
  const MAX_SIZE = 1024 * 1024; // 1MB
  let result = '';
  while (result.length < MAX_SIZE) {
    result += 'x';
  }
  
  return { output: result };
};
```

---

## Common Patterns

### Data Processing Skill

```javascript
module.exports = async function(context) {
  const { input, logger } = context;
  
  logger.info(`Processing ${input.length} items`);
  
  const results = input.map(item => {
    return {
      original: item,
      processed: item.toUpperCase(),
      timestamp: Date.now()
    };
  });
  
  return {
    success: true,
    count: results.length,
    data: results
  };
};
```

### Calculation Skill

```javascript
module.exports = async function(context) {
  const { input } = context;
  const { operation, values } = input;
  
  let result;
  switch (operation) {
    case 'sum':
      result = values.reduce((a, b) => a + b, 0);
      break;
    case 'average':
      result = values.reduce((a, b) => a + b, 0) / values.length;
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
  
  return { result };
};
```

### Text Analysis Skill

```javascript
module.exports = async function(context) {
  const { input } = context;
  const text = input.text || '';
  
  const analysis = {
    length: text.length,
    words: text.split(/\s+/).length,
    sentences: text.split(/[.!?]+/).length,
    characters: text.replace(/\s/g, '').length
  };
  
  return { analysis };
};
```

---

## Dependencies

### Allowed Dependencies

Skills can use npm packages specified in `package.json`:

```json
{
  "name": "my-skill",
  "version": "1.0.0",
  "dependencies": {
    "lodash": "^4.17.21",
    "moment": "^2.29.4"
  }
}
```

### Installation

```bash
# Install dependencies before packaging
npm install --production

# Package skill
tar -czf my-skill.tar.gz .
```

---

## Publishing to ClawHub

### 1. Package Your Skill

```bash
# Ensure all files are included
ls -la
# index.js
# package.json
# skill.json
# README.md

# Create package
tar -czf my-skill-1.0.0.tar.gz .
```

### 2. Publish via API

```javascript
{
  "type": "request",
  "method": "skills.install",
  "params": {
    "name": "my-skill",
    "version": "1.0.0"
  }
}
```

### 3. Verify Installation

```javascript
{
  "type": "request",
  "method": "skills.info",
  "params": {
    "name": "my-skill"
  }
}
```

---

## Troubleshooting

### Skill Timeout

**Problem:** Skill execution exceeds timeout

**Solution:** 
- Optimize code for performance
- Request higher timeout in `skill.json`
- Break into smaller operations

### Memory Limit Exceeded

**Problem:** Skill uses more memory than allocated

**Solution:**
- Process data in chunks
- Request higher memory limit
- Optimize data structures

### Permission Denied

**Problem:** Skill tries to access restricted resources

**Solution:**
- Review required permissions in `skill.json`
- Use allowed APIs only
- Request appropriate permissions

---

## API Reference

### Sandbox Status

```javascript
// Request
{ "method": "sandbox.status" }

// Response
{
  "enabled": true,
  "activeContainers": 3,
  "maxContainers": 10
}
```

### Test Skill

```javascript
// Request
{
  "method": "sandbox.test",
  "params": {
    "skillId": "my-skill",
    "skillPath": "/path/to/skill"
  }
}
```

---

*Last Updated: 2026-03-22*