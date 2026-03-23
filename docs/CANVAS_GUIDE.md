# Canvas Guide - Visual Workspace Usage

> *Agent-driven visual interfaces for SymbiLink*

## Overview

Canvas provides a visual workspace where the AI agent can create and manage dynamic content including HTML, markdown, charts, and code. Content updates in real-time via WebSocket.

---

## Features

- **Real-time Updates** - Content updates instantly via WebSocket
- **Multiple Content Types** - HTML, Markdown, Charts, Code
- **Session Isolation** - Each session has independent canvases
- **Multi-client Support** - Multiple clients can subscribe to same canvas
- **Safe Execution** - Sandboxed code evaluation

---

## Configuration

**File:** `config/canvas.yml`

```yaml
canvas:
  enabled: true
  port: 18790
  host: "127.0.0.1"
  maxCanvases: 10
  maxContentSize: "1mb"
  allowedOrigins:
    - "http://localhost:18789"
    - "https://*.tailscale.com"
  rendering:
    sandboxedEval: true
    maxWidth: 1920
    maxHeight: 1080
    allowedTypes:
      - "html"
      - "markdown"
      - "chart"
      - "code"
  security:
    safeEvalOnly: true
    maxCodeLength: 1000
```

---

## Quick Start

### 1. Create a Canvas

```javascript
// Via Gateway WebSocket
{
  "type": "request",
  "method": "canvas.create",
  "params": {
    "sessionId": "session-123",
    "title": "My Dashboard"
  }
}

// Response
{
  "result": {
    "id": "canvas-abc123",
    "title": "My Dashboard",
    "sessionId": "session-123",
    "contents": [],
    "createdAt": 1711135200000
  }
}
```

### 2. Connect to Canvas WebSocket

```javascript
const ws = new WebSocket('ws://localhost:18790');

ws.on('open', () => {
  // Subscribe to canvas
  ws.send(JSON.stringify({
    type: 'subscribe',
    canvasId: 'canvas-abc123'
  }));
});
```

### 3. Push Content

```javascript
{
  "type": "request",
  "method": "canvas.push",
  "params": {
    "canvasId": "canvas-abc123",
    "type": "html",
    "data": "<h1>Hello World</h1>",
    "position": { "x": 0, "y": 0 },
    "size": { "width": 400, "height": 300 }
  }
}
```

---

## Content Types

### HTML

Render HTML content directly.

```javascript
{
  "canvasId": "canvas-abc123",
  "type": "html",
  "data": "<div class='card'><h2>Sales Report</h2><p>Total: $12,345</p></div>",
  "position": { "x": 0, "y": 0 },
  "size": { "width": 400, "height": 200 }
}
```

### Markdown

Render Markdown with syntax highlighting.

```javascript
{
  "canvasId": "canvas-abc123",
  "type": "markdown",
  "data": "# Project Status\n\n- ✅ Task 1 complete\n- ⏳ Task 2 in progress\n- ❌ Task 3 pending",
  "position": { "x": 0, "y": 220 },
  "size": { "width": 400, "height": 200 }
}
```

### Charts

Create data visualizations.

```javascript
{
  "canvasId": "canvas-abc123",
  "type": "chart",
  "data": {
    "type": "line",
    "title": "Revenue Trend",
    "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
    "datasets": [
      {
        "label": "Revenue",
        "data": [10000, 15000, 13000, 17000, 20000],
        "borderColor": "#3b82f6"
      },
      {
        "label": "Expenses",
        "data": [8000, 9000, 11000, 10000, 12000],
        "borderColor": "#ef4444"
      }
    ]
  },
  "position": { "x": 420, "y": 0 },
  "size": { "width": 500, "height": 300 }
}
```

**Chart Types:**
| Type | Description |
|------|-------------|
| `line` | Line chart |
| `bar` | Bar chart |
| `pie` | Pie chart |
| `doughnut` | Doughnut chart |
| `radar` | Radar chart |

### Code

Display code with syntax highlighting.

```javascript
{
  "canvasId": "canvas-abc123",
  "type": "code",
  "data": "function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}",
  "position": { "x": 0, "y": 440 },
  "size": { "width": 400, "height": 200 }
}
```

---

## WebSocket Protocol

### Connection

```
ws://localhost:18790
```

### Messages

#### Subscribe to Canvas

```javascript
// Request
{
  "type": "subscribe",
  "canvasId": "canvas-abc123"
}

// Response
{
  "type": "canvas_state",
  "canvas": {
    "id": "canvas-abc123",
    "title": "My Dashboard",
    "contents": [...],
    "createdAt": 1711135200000,
    "updatedAt": 1711135200000
  }
}
```

#### Unsubscribe

```javascript
{
  "type": "unsubscribe"
}
```

#### Receive Content Updates

```javascript
// Content added
{
  "type": "content_added",
  "canvasId": "canvas-abc123",
  "content": {
    "id": "content-xyz",
    "type": "html",
    "data": "<p>New content</p>",
    "position": { "x": 0, "y": 0 },
    "size": { "width": 400, "height": 300 }
  }
}

// Content updated
{
  "type": "content_updated",
  "canvasId": "canvas-abc123",
  "content": { ... }
}

// Content removed
{
  "type": "content_removed",
  "canvasId": "canvas-abc123",
  "contentId": "content-xyz"
}

// Canvas deleted
{
  "type": "canvas_deleted",
  "canvasId": "canvas-abc123"
}
```

---

## Agent Integration

### Create Canvas from Agent

```typescript
import { CanvasManager } from './canvas/canvas-manager';

const canvasManager = new CanvasManager();
await canvasManager.start();

// Agent creates canvas
const canvas = canvasManager.createCanvas('session-123', 'Analysis Dashboard');

// Agent pushes content
canvasManager.pushContent(canvas.id, {
  type: 'html',
  data: '<h1>Analysis Results</h1>',
  position: { x: 0, y: 0 },
  size: { width: 600, height: 100 }
});

// Agent updates content
canvasManager.updateContent(canvas.id, contentId, {
  data: '<h1>Updated Results</h1>'
});
```

### Agent Tools for Canvas

```typescript
// Tool: canvas.create
{
  name: 'canvas.create',
  description: 'Create a new visual canvas',
  parameters: { title: { type: 'string', required: true } },
  handler: async (params, context) => {
    return canvasManager.createCanvas(context.sessionId, params.title);
  }
}

// Tool: canvas.push
{
  name: 'canvas.push',
  description: 'Push content to a canvas',
  parameters: {
    canvasId: { type: 'string', required: true },
    type: { type: 'string', enum: ['html', 'markdown', 'chart', 'code'], required: true },
    data: { type: 'any', required: true }
  },
  handler: async (params, context) => {
    return canvasManager.pushContent(params.canvasId, {
      type: params.type,
      data: params.data,
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 }
    });
  }
}
```

---

## Web Client Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Canvas Client</title>
  <style>
    #canvas { position: relative; width: 100%; height: 600px; border: 1px solid #ccc; }
    .content { position: absolute; border: 1px solid #ddd; padding: 10px; }
  </style>
</head>
<body>
  <div id="canvas"></div>
  
  <script>
    const canvas = document.getElementById('canvas');
    const ws = new WebSocket('ws://localhost:18790');
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        canvasId: 'canvas-abc123'
      }));
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'canvas_state':
          renderCanvas(message.canvas);
          break;
        case 'content_added':
          addContent(message.content);
          break;
        case 'content_updated':
          updateContent(message.content);
          break;
        case 'content_removed':
          removeContent(message.contentId);
          break;
      }
    };
    
    function renderCanvas(canvasData) {
      canvas.innerHTML = '';
      canvasData.contents.forEach(content => addContent(content));
    }
    
    function addContent(content) {
      const div = document.createElement('div');
      div.id = content.id;
      div.className = 'content';
      div.style.left = content.position.x + 'px';
      div.style.top = content.position.y + 'px';
      div.style.width = content.size.width + 'px';
      div.style.height = content.size.height + 'px';
      
      switch (content.type) {
        case 'html':
          div.innerHTML = content.data;
          break;
        case 'markdown':
          div.innerHTML = marked.parse(content.data);
          break;
        case 'chart':
          renderChart(div, content.data);
          break;
        case 'code':
          div.innerHTML = `<pre><code>${escapeHtml(content.data)}</code></pre>`;
          break;
      }
      
      canvas.appendChild(div);
    }
    
    function updateContent(content) {
      const existing = document.getElementById(content.id);
      if (existing) {
        existing.style.left = content.position.x + 'px';
        existing.style.top = content.position.y + 'px';
        existing.innerHTML = content.data;
      }
    }
    
    function removeContent(contentId) {
      const element = document.getElementById(contentId);
      if (element) element.remove();
    }
    
    function renderChart(container, chartData) {
      // Use Chart.js or similar library
      const canvasEl = document.createElement('canvas');
      container.appendChild(canvasEl);
      new Chart(canvasEl, {
        type: chartData.type,
        data: {
          labels: chartData.labels,
          datasets: chartData.datasets
        }
      });
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  </script>
</body>
</html>
```

---

## Dashboard Example

### Complete Dashboard Layout

```javascript
// Create dashboard canvas
const canvas = await canvasManager.createCanvas('session-123', 'Sales Dashboard');

// Header
await canvasManager.pushContent(canvas.id, {
  type: 'html',
  data: '<h1 style="color: #333;">Sales Dashboard</h1>',
  position: { x: 0, y: 0 },
  size: { width: 1200, height: 60 }
});

// Revenue Chart
await canvasManager.pushContent(canvas.id, {
  type: 'chart',
  data: {
    type: 'line',
    title: 'Monthly Revenue',
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [{ label: 'Revenue', data: [10000, 15000, 13000, 17000] }]
  },
  position: { x: 0, y: 70 },
  size: { width: 580, height: 300 }
});

// Product Chart
await canvasManager.pushContent(canvas.id, {
  type: 'chart',
  data: {
    type: 'pie',
    title: 'Sales by Product',
    labels: ['Product A', 'Product B', 'Product C'],
    datasets: [{ data: [45, 30, 25] }]
  },
  position: { x: 600, y: 70 },
  size: { width: 580, height: 300 }
});

// Summary Table
await canvasManager.pushContent(canvas.id, {
  type: 'html',
  data: `
    <table style="width:100%; border-collapse:collapse;">
      <tr style="background:#f0f0f0;">
        <th style="padding:10px; text-align:left;">Metric</th>
        <th style="padding:10px; text-align:right;">Value</th>
      </tr>
      <tr>
        <td style="padding:10px;">Total Revenue</td>
        <td style="padding:10px; text-align:right;">$55,000</td>
      </tr>
      <tr>
        <td style="padding:10px;">Total Orders</td>
        <td style="padding:10px; text-align:right;">1,234</td>
      </tr>
      <tr>
        <td style="padding:10px;">Avg Order Value</td>
        <td style="padding:10px; text-align:right;">$44.58</td>
      </tr>
    </table>
  `,
  position: { x: 0, y: 380 },
  size: { width: 1200, height: 150 }
});
```

---

## Security

### Sandboxed Evaluation

Code evaluation is restricted to safe expressions only:

```yaml
canvas:
  security:
    safeEvalOnly: true
    maxCodeLength: 1000
```

**Allowed:**
- Simple math: `2 + 2`, `10 * 5`
- String operations: `"hello".length`
- Array methods: `[1,2,3].map(x => x * 2)`

**Blocked:**
- `eval()`, `Function()`
- `require()`, `import`
- `process`, `global`, `window`
- File system access

### Content Size Limits

```yaml
canvas:
  maxContentSize: "1mb"
```

### Origin Restrictions

```yaml
canvas:
  allowedOrigins:
    - "http://localhost:18789"
    - "https://*.tailscale.com"
```

---

## API Reference

### Canvas Methods

| Method | Description |
|--------|-------------|
| `canvas.create(sessionId, title)` | Create new canvas |
| `canvas.list(sessionId?)` | List canvases |
| `canvas.delete(canvasId)` | Delete canvas |
| `canvas.push(canvasId, content)` | Push content |
| `canvas.update(canvasId, contentId, updates)` | Update content |
| `canvas.remove(canvasId, contentId)` | Remove content |
| `canvas.status` | Get manager status |

### Content Object

```typescript
interface CanvasContent {
  id: string;
  type: 'html' | 'markdown' | 'chart' | 'code';
  data: unknown;
  position: { x: number; y: number };
  size: { width: number; height: number };
  createdAt: number;
  updatedAt: number;
}
```

---

## Troubleshooting

### Canvas Not Updating

**Problem:** Content changes not reflected

**Solutions:**
1. Verify WebSocket connection is open
2. Check subscription is active
3. Verify canvas ID is correct
4. Check browser console for errors

### Connection Refused

**Problem:** Cannot connect to canvas WebSocket

**Solutions:**
1. Verify canvas server is running
2. Check port configuration (default: 18790)
3. Verify firewall allows connection
4. Check allowed origins

### Content Not Rendering

**Problem:** Content appears blank

**Solutions:**
1. Check content type is supported
2. Verify data format is correct
3. Check size dimensions are valid
4. Review browser console for errors

### Performance Issues

**Problem:** Canvas updates are slow

**Solutions:**
1. Reduce number of content items
2. Optimize content size
3. Limit update frequency
4. Use efficient data structures

---

## Best Practices

### 1. Organize Content Layout

```javascript
// Use consistent spacing
const SPACING = 20;
const HEADER_HEIGHT = 60;
const CONTENT_HEIGHT = 300;

// Position items in grid
positions: [
  { x: 0, y: HEADER_HEIGHT },
  { x: 400 + SPACING, y: HEADER_HEIGHT },
  { x: 0, y: HEADER_HEIGHT + CONTENT_HEIGHT + SPACING }
]
```

### 2. Update Efficiently

```javascript
// Update only changed content
canvasManager.updateContent(canvasId, contentId, {
  data: newData  // Only update data, not position/size
});
```

### 3. Handle Errors

```javascript
try {
  const content = canvasManager.pushContent(canvasId, contentData);
} catch (error) {
  console.error('Failed to push content:', error.message);
}
```

### 4. Cleanup Old Canvases

```javascript
// List and delete old canvases
const canvases = canvasManager.listCanvases(sessionId);
const oldCanvases = canvases.filter(c => 
  Date.now() - c.createdAt > 24 * 60 * 60 * 1000
);

oldCanvases.forEach(canvas => {
  canvasManager.deleteCanvas(canvas.id);
});
```

---

*Last Updated: 2026-03-22*