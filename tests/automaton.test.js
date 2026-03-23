/**
 * Automaton Loop & Heartbeat Tests
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { AutomatonLoop, STATES } = require('../dist/automaton/loop');
const { HeartbeatDaemon } = require('../dist/automaton/heartbeat');

const TEST_DIR = path.join(__dirname, '.test-automaton');

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

// Mock dependencies
const mockWallet = {
  address: '0xtestaddress',
  publicKey: '0xpublickey',
  privateKey: 'testprivatekey',
  getInfo: () => ({
    address: '0xtestaddress',
    publicKey: '0xpublickey',
    hasPrivateKey: true
  })
};

const mockConstitution = {
  getCreator: () => '0xcreator',
  validateAction: () => ({ allowed: true }),
  getSummary: () => []
};

const mockBudget = {
  getStatus: () => ({
    availableBudget: 100,
    totalEarnings: 200,
    totalSpending: 100,
    surgeMultiplier: 1.0,
    hourlyBurnRate: 0.01
  }),
  recordEarning: () => {},
  recordSpending: () => {}
};

describe('AutomatonLoop', () => {
  let loop;

  beforeEach(() => {
    cleanup();
    loop = new AutomatonLoop({
      wallet: mockWallet,
      constitution: mockConstitution,
      budget: mockBudget,
      dataDir: TEST_DIR,
      sleepInterval: 100,
      idleThreshold: 2
    });
  });

  afterEach(() => {
    cleanup();
    if (loop.running) {
      loop.stop();
    }
  });

  describe('constructor', () => {
    it('should initialize with correct state', () => {
      assert.strictEqual(loop.state, STATES.BOOTING);
      assert.strictEqual(loop.running, false);
      assert.strictEqual(loop.turnCount, 0);
    });

    it('should register default tools', () => {
      assert.ok(loop.tools.has('think'));
      assert.ok(loop.tools.has('sleep'));
      assert.ok(loop.tools.has('write_soul'));
      assert.ok(loop.tools.has('read_soul'));
      assert.ok(loop.tools.has('check_budget'));
    });
  });

  describe('registerTool()', () => {
    it('should register a new tool', () => {
      let called = false;
      loop.registerTool('test_tool', async () => {
        called = true;
        return { success: true };
      });
      
      assert.ok(loop.tools.has('test_tool'));
    });
  });

  describe('getStatus()', () => {
    it('should return current status', () => {
      const status = loop.getStatus();
      
      assert.ok(status.state);
      assert.strictEqual(status.running, false);
      assert.strictEqual(status.turnCount, 0);
      assert.ok(status.toolsCount > 0);
    });
  });

  describe('_assembleContext()', () => {
    it('should assemble context for each turn', async () => {
      const context = await loop._assembleContext();
      
      assert.ok(context.identity);
      assert.ok(context.survival);
      assert.ok(context.budget);
      assert.ok(context.timestamp);
    });
  });

  describe('_checkSurvivalStatus()', () => {
    it('should return healthy status with sufficient budget', async () => {
      const status = await loop._checkSurvivalStatus();
      
      assert.strictEqual(status.status, 'healthy');
      assert.strictEqual(status.canSurvive, true);
    });
  });

  describe('_ruleBasedThink()', () => {
    it('should think critically when survival is critical', () => {
      loop.currentContext = {
        survival: { status: 'critical', canSurvive: false }
      };
      
      const thought = loop._ruleBasedThink();
      
      assert.strictEqual(thought.priority, 'critical');
      assert.strictEqual(thought.action, 'seek_work');
    });

    it('should think with warning when survival is warning', () => {
      loop.currentContext = {
        survival: { status: 'warning', canSurvive: true }
      };
      
      const thought = loop._ruleBasedThink();
      
      assert.strictEqual(thought.priority, 'high');
    });

    it('should seek work when idle threshold reached', () => {
      loop.idleCount = 3;
      loop.currentContext = {
        survival: { status: 'healthy' }
      };
      
      const thought = loop._ruleBasedThink();
      
      assert.strictEqual(thought.action, 'seek_work');
    });
  });

  describe('_isIdle()', () => {
    it('should detect idle observations', () => {
      assert.strictEqual(loop._isIdle({ action: { tool: 'sleep' } }), true);
      assert.strictEqual(loop._isIdle({ action: { tool: 'read_soul' } }), true);
      assert.strictEqual(loop._isIdle({ action: { tool: 'work' } }), false);
    });
  });

  describe('_recordTurn()', () => {
    it('should record turn in history', () => {
      loop._recordTurn(
        { reasoning: 'test', action: 'test' },
        { success: true },
        { success: true }
      );
      
      assert.strictEqual(loop.history.length, 1);
    });

    it('should prune history to maxHistory', () => {
      loop.maxHistory = 5;
      
      for (let i = 0; i < 10; i++) {
        loop._recordTurn(
          { reasoning: `test ${i}`, action: 'test' },
          { success: true },
          { success: true }
        );
      }
      
      assert.strictEqual(loop.history.length, 5);
    });
  });

  describe('SOUL.md', () => {
    it('should initialize SOUL.md', async () => {
      await loop._initializeSoul();
      
      assert.ok(fs.existsSync(loop.soulPath));
    });

    it('should read SOUL.md', async () => {
      await loop._initializeSoul();
      
      const soul = await loop._readSoul();
      
      assert.ok(soul);
      assert.ok(soul.includes('SOUL.md'));
    });

    it('should write SOUL.md', async () => {
      await loop._writeSoul('# Test SOUL');
      
      const soul = await loop._readSoul();
      assert.strictEqual(soul, '# Test SOUL');
    });
  });
});

describe('HeartbeatDaemon', () => {
  let daemon;

  beforeEach(() => {
    daemon = new HeartbeatDaemon({
      wallet: mockWallet,
      budget: mockBudget,
      constitution: mockConstitution,
      interval: 100
    });
  });

  afterEach(() => {
    if (daemon.running) {
      daemon.stop();
    }
  });

  describe('constructor', () => {
    it('should register default tasks', () => {
      assert.ok(daemon.tasks.has('health_check'));
      assert.ok(daemon.tasks.has('credit_monitor'));
      assert.ok(daemon.tasks.has('status_ping'));
      assert.ok(daemon.tasks.has('cleanup'));
      assert.ok(daemon.tasks.has('survival_check'));
    });
  });

  describe('registerTask()', () => {
    it('should register a custom task', () => {
      daemon.registerTask('custom_task', {
        interval: 1000,
        handler: async () => ({ custom: true })
      });
      
      assert.ok(daemon.tasks.has('custom_task'));
    });
  });

  describe('start()', () => {
    it('should start the daemon', () => {
      daemon.start();
      
      assert.strictEqual(daemon.running, true);
    });

    it('should not start twice', () => {
      daemon.start();
      daemon.start(); // Second call
      
      assert.strictEqual(daemon.running, true);
    });
  });

  describe('stop()', () => {
    it('should stop the daemon', () => {
      daemon.start();
      daemon.stop();
      
      assert.strictEqual(daemon.running, false);
    });
  });

  describe('getStatus()', () => {
    it('should return daemon status', () => {
      const status = daemon.getStatus();
      
      assert.ok(status.tasks);
      assert.strictEqual(status.running, false);
    });
  });

  describe('enableTask/disableTask()', () => {
    it('should enable and disable tasks', () => {
      daemon.disableTask('health_check');
      assert.strictEqual(daemon.tasks.get('health_check').enabled, false);
      
      daemon.enableTask('health_check');
      assert.strictEqual(daemon.tasks.get('health_check').enabled, true);
    });
  });

  describe('_healthCheck()', () => {
    it('should return health status', async () => {
      const health = await daemon._healthCheck();
      
      assert.ok(health.timestamp);
      assert.ok(health.healthy !== undefined);
    });
  });

  describe('_monitorCredits()', () => {
    it('should return credit status', async () => {
      const status = await daemon._monitorCredits();
      
      assert.ok(status.availableBudget);
      assert.ok(status.hoursRemaining);
    });
  });

  describe('_survivalCheck()', () => {
    it('should return survival status', async () => {
      const status = await daemon._survivalCheck();
      
      assert.ok(status.canSurvive !== undefined);
    });
  });

  describe('events', () => {
    it('should emit started event', (done) => {
      daemon.on('started', () => {
        done();
      });
      
      daemon.start();
      daemon.stop();
    });

    it('should emit stopped event', (done) => {
      daemon.on('stopped', () => {
        done();
      });
      
      daemon.start();
      daemon.stop();
    });
  });
});
