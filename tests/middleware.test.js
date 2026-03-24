/**
 * Phase 8: Middleware Chain Tests
 * Unit tests for the middleware system
 */

const assert = require('assert');

// Mock imports for testing
class MockMiddleware {
  constructor(name, order) {
    this.name = name;
    this.order = order;
    this.executed = false;
  }

  async execute(context, next) {
    this.executed = true;
    context.metadata = context.metadata || {};
    context.metadata[this.name] = Date.now();
    await next();
  }
}

// Simplified MiddlewareChain for testing
class MiddlewareChain {
  constructor() {
    this.middlewares = [];
    this.config = new Map();
  }

  register(middleware, config) {
    this.middlewares.push(middleware);
    // Always create config entry for middleware
    const existingConfig = this.config.get(middleware.name);
    this.config.set(middleware.name, {
      name: middleware.name,
      order: config?.order ?? middleware.order,
      enabled: config?.enabled ?? existingConfig?.enabled ?? true,
      options: config?.options ?? existingConfig?.options
    });
    this.middlewares.sort((a, b) => {
      const orderA = this.config.get(a.name)?.order ?? a.order;
      const orderB = this.config.get(b.name)?.order ?? b.order;
      return orderA - orderB;
    });
  }

  async execute(context) {
    const enabledMiddlewares = this.middlewares.filter(m => {
      const config = this.config.get(m.name);
      return config?.enabled ?? true;
    });

    let index = 0;
    const next = async () => {
      if (index < enabledMiddlewares.length) {
        const middleware = enabledMiddlewares[index++];
        await middleware.execute(context, next);
      }
    };
    await next();
  }

  configure(name, config) {
    const existing = this.config.get(name);
    if (existing) {
      this.config.set(name, { ...existing, ...config });
    }
  }

  enable(name) {
    this.configure(name, { enabled: true });
  }

  disable(name) {
    this.configure(name, { enabled: false });
  }

  list() {
    return this.middlewares.map(m => {
      const config = this.config.get(m.name);
      return {
        name: m.name,
        order: config?.order ?? m.order,
        enabled: config?.enabled ?? true
      };
    });
  }
}

// Test suite
async function runTests() {
  console.log('Running Middleware Chain Tests...\n');

  // Test 1: Middleware registration
  console.log('Test 1: Middleware registration');
  const chain = new MiddlewareChain();
  const mw1 = new MockMiddleware('MW1', 1);
  const mw2 = new MockMiddleware('MW2', 2);
  const mw3 = new MockMiddleware('MW3', 3);

  chain.register(mw1);
  chain.register(mw2);
  chain.register(mw3);

  assert.strictEqual(chain.middlewares.length, 3, 'Should have 3 middlewares');
  console.log('Test 1 passed\n');

  // Test 2: Execution order
  console.log('Test 2: Execution order');

  class OrderTestMiddleware {
    constructor(name, order, orderArray) {
      this.name = name;
      this.order = order;
      this.orderArray = orderArray;
    }

    async execute(context, next) {
      this.orderArray.push(this.name);
      await next();
    }
  }

  const orderChain = new MiddlewareChain();
  const orderArray = [];
  
  // Register in random order
  orderChain.register(new OrderTestMiddleware('Third', 3, orderArray));
  orderChain.register(new OrderTestMiddleware('First', 1, orderArray));
  orderChain.register(new OrderTestMiddleware('Second', 2, orderArray));

  await orderChain.execute({ metadata: {} });

  assert.deepStrictEqual(orderArray, ['First', 'Second', 'Third'], 'Should execute in order');
  console.log('Test 2 passed\n');

  // Test 3: Enable/Disable middleware
  console.log('Test 3: Enable/Disable middleware');
  const enableChain = new MiddlewareChain();
  const executionLog = [];

  class LogMiddleware {
    constructor(name, order, log) {
      this.name = name;
      this.order = order;
      this.log = log;
    }

    async execute(context, next) {
      this.log.push(this.name);
      await next();
    }
  }

  enableChain.register(new LogMiddleware('MW1', 1, executionLog));
  enableChain.register(new LogMiddleware('MW2', 2, executionLog));
  enableChain.register(new LogMiddleware('MW3', 3, executionLog));

  // Disable MW2
  enableChain.disable('MW2');

  await enableChain.execute({ metadata: {} });

  assert.deepStrictEqual(executionLog, ['MW1', 'MW3'], 'MW2 should be disabled');
  console.log('Test 3 passed\n');

  // Test 4: Re-enable middleware
  console.log('Test 4: Re-enable middleware');
  const reenableChain = new MiddlewareChain();
  const reenableLog = [];

  reenableChain.register(new LogMiddleware('MW1', 1, reenableLog));
  reenableChain.register(new LogMiddleware('MW2', 2, reenableLog));

  reenableChain.disable('MW2');
  await reenableChain.execute({ metadata: {} });

  assert.deepStrictEqual(reenableLog, ['MW1'], 'MW2 should be disabled');

  reenableLog.length = 0;
  reenableChain.enable('MW2');
  await reenableChain.execute({ metadata: {} });

  assert.deepStrictEqual(reenableLog, ['MW1', 'MW2'], 'MW2 should be re-enabled');
  console.log('Test 4 passed\n');

  // Test 5: Context enrichment
  console.log('Test 5: Context enrichment');
  const enrichChain = new MiddlewareChain();

  class EnrichMiddleware {
    constructor(name, order, key, value) {
      this.name = name;
      this.order = order;
      this.key = key;
      this.value = value;
    }

    async execute(context, next) {
      context[this.key] = this.value;
      await next();
    }
  }

  enrichChain.register(new EnrichMiddleware('MW1', 1, 'threadId', 'thread-123'));
  enrichChain.register(new EnrichMiddleware('MW2', 2, 'sandbox', { id: 'sandbox-1' }));

  const context = { metadata: {} };
  await enrichChain.execute(context);

  assert.strictEqual(context.threadId, 'thread-123', 'Should enrich threadId');
  assert.deepStrictEqual(context.sandbox, { id: 'sandbox-1' }, 'Should enrich sandbox');
  console.log('Test 5 passed\n');

  // Test 6: List middlewares
  console.log('Test 6: List middlewares');
  const listChain = new MiddlewareChain();
  listChain.register(new MockMiddleware('MW1', 1));
  listChain.register(new MockMiddleware('MW2', 2));
  listChain.disable('MW2');

  const list = listChain.list();
  assert.strictEqual(list.length, 2, 'Should list 2 middlewares');
  assert.strictEqual(list[0].name, 'MW1', 'First should be MW1');
  assert.strictEqual(list[0].enabled, true, 'MW1 should be enabled');
  assert.strictEqual(list[1].name, 'MW2', 'Second should be MW2');
  assert.strictEqual(list[1].enabled, false, 'MW2 should be disabled');
  console.log('Test 6 passed\n');

  // Test 7: Token counter approximation
  console.log('Test 7: Token counter approximation');

  class TokenCounter {
    countTokens(text) {
      if (!text) return 0;
      return Math.ceil(text.length / 4);
    }

    countMessageTokens(messages) {
      return messages.reduce((total, msg) => {
        let tokens = 2; // Role tokens
        tokens += this.countTokens(msg.content || '');
        return total + tokens;
      }, 0);
    }

    getTokenCount(options) {
      const messageTokens = this.countMessageTokens(options.messages || []);
      const limit = options.maxTokens || 8000;
      const available = Math.max(0, limit - messageTokens);
      const percentage = messageTokens / limit;

      return {
        total: messageTokens,
        messages: messageTokens,
        available,
        limit,
        percentage
      };
    }
  }

  const counter = new TokenCounter();
  
  // Test token counting
  assert.strictEqual(counter.countTokens(''), 0, 'Empty string should be 0 tokens');
  assert.strictEqual(counter.countTokens('test'), 1, '4 chars should be ~1 token');
  assert.strictEqual(counter.countTokens('this is a test'), 4, '14 chars should be ~4 tokens');

  // Test message token counting
  const messages = [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' }
  ];
  const msgTokens = counter.countMessageTokens(messages);
  assert(msgTokens > 0, 'Should count message tokens');

  // Test token count
  const tokenCount = counter.getTokenCount({
    messages: [{ role: 'user', content: 'A'.repeat(32000) }],
    maxTokens: 10000
  });
  assert(tokenCount.percentage > 0.7, 'Should detect high token usage');
  console.log('Test 7 passed\n');

  console.log('All middleware tests passed!');
}

// Run tests
runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});