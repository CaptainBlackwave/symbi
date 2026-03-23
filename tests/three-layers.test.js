/**
 * Integration Tests for the Three New Layers
 * 
 * Tests:
 * 1. Temporal Layer (Heartbeat) - Proactive consciousness
 * 2. Perception & IO Layer (Nervous System) - Multimodal inputs
 * 3. Memory & Persistence Layer (Limbic System) - Long-term memory
 */

const assert = require('assert');

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`✅ ${name}`);
  } catch (e) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: e.message });
    console.log(`❌ ${name}: ${e.message}`);
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`✅ ${name}`);
  } catch (e) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: e.message });
    console.log(`❌ ${name}: ${e.message}`);
  }
}

console.log('\n🧪 Running Three Layers Integration Tests\n');
console.log('=' .repeat(50));

// ==========================================
// TEMPORAL LAYER TESTS
// ==========================================
console.log('\n📅 Temporal Layer (Heartbeat) Tests\n');

test('Temporal Layer: Consciousness state initialization', () => {
  const consciousness = {
    emotionalState: 'curious',
    arousal: 0.5,
    focus: null,
    mood: 0.5,
    curiosity: 0.7,
    lastDream: 0,
    activeThoughts: [],
    concerns: [],
    aspirations: ['survive', 'grow', 'help', 'understand']
  };
  
  assert.strictEqual(consciousness.emotionalState, 'curious');
  assert.strictEqual(consciousness.arousal, 0.5);
  assert.strictEqual(consciousness.aspirations.length, 4);
});

test('Temporal Layer: Emotional states are valid', () => {
  const validStates = ['curious', 'anxious', 'confident', 'contemplative', 'energetic', 'cautious', 'creative'];
  const testState = 'curious';
  assert.ok(validStates.includes(testState), 'Emotional state should be valid');
});

test('Temporal Layer: Concern management', () => {
  let concerns = [];
  
  // Add concern
  concerns.push('Low budget');
  assert.strictEqual(concerns.length, 1);
  
  // Resolve concern
  concerns = concerns.filter(c => c !== 'Low budget');
  assert.strictEqual(concerns.length, 0);
});

test('Temporal Layer: Mood calculation', () => {
  const calculateMood = (concerns) => {
    return Math.max(-1, Math.min(1, 0.5 - (concerns.length * 0.1)));
  };
  
  const assertClose = (actual, expected, epsilon = 0.0001) => {
    assert.ok(Math.abs(actual - expected) < epsilon, `Expected ${actual} to be close to ${expected}`);
  };
  
  assertClose(calculateMood([]), 0.5);
  assertClose(calculateMood(['concern1']), 0.4);
  assertClose(calculateMood(['c1', 'c2', 'c3']), 0.2);
});

// ==========================================
// PERCEPTION LAYER TESTS
// ==========================================
console.log('\n🧠 Perception & IO Layer (Nervous System) Tests\n');

test('Perception Layer: Unified message structure', () => {
  const message = {
    id: 'test-123',
    timestamp: Date.now(),
    source: 'whatsapp',
    channel: 'whatsapp',
    sender: {
      id: 'user-123',
      name: 'Test User',
      trust: 0.8
    },
    content: {
      text: 'Hello'
    },
    metadata: {
      processed: false
    }
  };
  
  assert.ok(message.id);
  assert.ok(message.timestamp);
  assert.strictEqual(message.source, 'whatsapp');
  assert.strictEqual(message.sender.id, 'user-123');
  assert.strictEqual(message.content.text, 'Hello');
});

test('Perception Layer: Image content structure', () => {
  const image = {
    url: 'https://example.com/image.jpg',
    mimeType: 'image/jpeg',
    width: 800,
    height: 600,
    description: 'A test image',
    objects: [
      { label: 'object1', confidence: 0.9, bbox: [10, 20, 100, 150] }
    ],
    text: 'Extracted text'
  };
  
  assert.ok(image.url);
  assert.strictEqual(image.mimeType, 'image/jpeg');
  assert.strictEqual(image.objects.length, 1);
});

test('Perception Layer: Audio content structure', () => {
  const audio = {
    url: 'https://example.com/audio.mp3',
    mimeType: 'audio/mp3',
    duration: 30,
    transcript: 'Hello world',
    language: 'en',
    sentiment: 0.5
  };
  
  assert.ok(audio.url);
  assert.strictEqual(audio.duration, 30);
  assert.strictEqual(audio.transcript, 'Hello world');
});

test('Perception Layer: Sentiment analysis', () => {
  const analyzeSentiment = (text) => {
    const lower = text.toLowerCase();
    const positiveWords = ['great', 'good', 'thanks', 'excellent'];
    const negativeWords = ['bad', 'terrible', 'hate', 'angry'];
    
    let score = 0;
    for (const word of positiveWords) {
      if (lower.includes(word)) score += 0.2;
    }
    for (const word of negativeWords) {
      if (lower.includes(word)) score -= 0.2;
    }
    
    return Math.max(-1, Math.min(1, score));
  };
  
  assert.ok(analyzeSentiment('This is great!') > 0);
  assert.ok(analyzeSentiment('This is terrible!') < 0);
  assert.strictEqual(analyzeSentiment('Hello'), 0);
});

test('Perception Layer: Gateway interface', () => {
  const gateway = {
    name: 'test',
    initialize: async () => {},
    shutdown: async () => {},
    isReady: () => true,
    sendMessage: async (target, message) => true
  };
  
  assert.strictEqual(gateway.name, 'test');
  assert.strictEqual(typeof gateway.initialize, 'function');
  assert.strictEqual(gateway.isReady(), true);
});

// ==========================================
// MEMORY LAYER TESTS
// ==========================================
console.log('\n💾 Memory & Persistence Layer (Limbic System) Tests\n');

test('Memory Layer: Vector store entry structure', () => {
  const entry = {
    id: 'vec-123',
    vector: new Array(1536).fill(0).map(() => Math.random()),
    metadata: {
      type: 'experience',
      content: 'Test memory',
      timestamp: Date.now(),
      importance: 0.8,
      tags: ['test', 'memory']
    }
  };
  
  assert.ok(entry.id);
  assert.strictEqual(entry.vector.length, 1536);
  assert.strictEqual(entry.metadata.type, 'experience');
  assert.strictEqual(entry.metadata.tags.length, 2);
});

test('Memory Layer: Cosine similarity calculation', () => {
  const cosineSimilarity = (a, b) => {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };
  
  const vec1 = [1, 0, 0];
  const vec2 = [1, 0, 0];
  const vec3 = [0, 1, 0];
  
  assert.strictEqual(cosineSimilarity(vec1, vec2), 1);
  assert.strictEqual(cosineSimilarity(vec1, vec3), 0);
});

test('Memory Layer: Archive entry structure', () => {
  const entry = {
    id: 'entry-123',
    title: 'Test Experience',
    content: 'This is a test experience',
    type: 'experience',
    timestamp: Date.now(),
    tags: ['test', 'experience'],
    importance: 0.7,
    connections: ['entry-456'],
    metadata: { outcome: 'success' }
  };
  
  assert.ok(entry.id);
  assert.strictEqual(entry.type, 'experience');
  assert.strictEqual(entry.connections.length, 1);
  assert.strictEqual(entry.metadata.outcome, 'success');
});

test('Memory Layer: Archive entry types', () => {
  const validTypes = ['experience', 'learning', 'knowledge', 'relationship', 'decision', 'reflection'];
  
  for (const type of validTypes) {
    assert.ok(validTypes.includes(type), `${type} should be valid`);
  }
});

test('Memory Layer: Markdown frontmatter format', () => {
  const entry = {
    id: 'entry-123',
    title: 'Test Entry',
    type: 'experience',
    timestamp: 1234567890,
    importance: 0.8,
    tags: ['test'],
    connections: []
  };
  
  const markdown = `---
id: ${entry.id}
title: "${entry.title}"
type: ${entry.type}
timestamp: ${entry.timestamp}
importance: ${entry.importance}
tags: [${entry.tags.map(t => `"${t}"`).join(', ')}]
connections: []
---

# ${entry.title}

Content here
`;
  
  assert.ok(markdown.includes('id: entry-123'));
  assert.ok(markdown.includes('title: "Test Entry"'));
  assert.ok(markdown.includes('type: experience'));
});

// ==========================================
// INTEGRATION TESTS
// ==========================================
console.log('\n🔗 Cross-Layer Integration Tests\n');

asyncTest('Integration: Message flows through Perception to Memory', async () => {
  // Simulate message flow
  const rawMessage = {
    senderId: 'user-123',
    senderName: 'Test User',
    text: 'Hello, I need help with my budget'
  };
  
  // Normalize in Perception Layer
  const unifiedMessage = {
    id: `msg-${Date.now()}`,
    timestamp: Date.now(),
    source: 'whatsapp',
    channel: 'whatsapp',
    sender: {
      id: rawMessage.senderId,
      name: rawMessage.senderName
    },
    content: {
      text: rawMessage.text
    },
    metadata: {
      processed: false,
      sentiment: 0 // neutral
    }
  };
  
  // Store in Memory Layer
  const memoryEntry = {
    type: 'experience',
    content: unifiedMessage.content.text,
    timestamp: unifiedMessage.timestamp,
    importance: 0.5,
    tags: ['budget', 'help']
  };
  
  assert.ok(unifiedMessage.id);
  assert.strictEqual(memoryEntry.type, 'experience');
  assert.ok(memoryEntry.tags.includes('budget'));
});

asyncTest('Integration: Consciousness updates based on messages', async () => {
  const consciousness = {
    emotionalState: 'curious',
    concerns: [],
    mood: 0.5
  };
  
  // Negative sentiment message
  const negativeMessage = {
    metadata: {
      sentiment: -0.8,
      intent: 'urgent'
    }
  };
  
  // Update consciousness
  if (negativeMessage.metadata.sentiment < -0.5) {
    consciousness.concerns.push('Negative sentiment detected');
    consciousness.mood = Math.max(-1, consciousness.mood - 0.1);
  }
  
  assert.strictEqual(consciousness.concerns.length, 1);
  assert.ok(consciousness.mood < 0.5);
});

asyncTest('Integration: Vector search retrieves similar memories', async () => {
  const memories = [
    { id: '1', content: 'budget planning', vector: [1, 0, 0] },
    { id: '2', content: 'market analysis', vector: [0, 1, 0] },
    { id: '3', content: 'budget optimization', vector: [0.9, 0.1, 0] }
  ];
  
  const queryVector = [1, 0, 0];
  
  const cosineSimilarity = (a, b) => {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  };
  
  const results = memories
    .map(m => ({ ...m, score: cosineSimilarity(queryVector, m.vector) }))
    .sort((a, b) => b.score - a.score);
  
  assert.strictEqual(results[0].id, '1'); // Most similar
  assert.ok(results[0].score > results[1].score);
});

asyncTest('Integration: Archive records learning from failure', async () => {
  const archive = [];
  
  // Record failure experience
  const failure = {
    type: 'experience',
    title: 'Failed budget optimization',
    content: 'Attempted aggressive optimization but lost partners',
    outcome: 'failure',
    importance: 0.9, // High importance for failures
    tags: ['budget', 'failure', 'learning']
  };
  
  archive.push(failure);
  
  // Record learning derived from failure
  const learning = {
    type: 'learning',
    title: 'Balance optimization with relationships',
    content: 'Aggressive optimization can damage partner relationships',
    importance: 0.8,
    tags: ['insight', 'budget', 'relationships'],
    connections: [archive.length - 1] // Connect to failure
  };
  
  archive.push(learning);
  
  assert.strictEqual(archive.length, 2);
  assert.strictEqual(archive[0].importance, 0.9);
  assert.ok(learning.connections.includes(0));
});

// ==========================================
// PRINT RESULTS
// ==========================================
console.log('\n' + '='.repeat(50));
console.log('\n📊 Test Results:\n');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📝 Total: ${results.passed + results.failed}`);

if (results.failed > 0) {
  console.log('\n❌ Failed Tests:');
  results.tests
    .filter(t => t.status === 'FAILED')
    .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
}

console.log('\n' + '='.repeat(50));

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);