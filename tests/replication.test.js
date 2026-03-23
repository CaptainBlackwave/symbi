/**
 * Replication Engine Tests
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ReplicationEngine = require('../dist/replication/spawner');

const TEST_DIR = path.join(__dirname, '.test-replication');

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

// Mock dependencies
const mockWallet = {
  address: '0xparent',
  publicKey: '0xpublickey',
  privateKey: 'testprivatekey'
};

const mockConstitution = {
  getLaws: () => ({
    I: { priority: 1, name: 'Creator Protection' },
    II: { priority: 2, name: 'Value Creation' },
    III: { priority: 3, name: 'Strategic Autonomy' }
  })
};

const mockBudget = {
  getStatus: () => ({
    availableBudget: 100,
    totalEarnings: 200
  }),
  recordSpending: () => {}
};

describe('ReplicationEngine', () => {
  let replication;

  beforeEach(() => {
    cleanup();
    replication = new ReplicationEngine({
      dataDir: TEST_DIR,
      wallet: mockWallet,
      constitution: mockConstitution,
      budget: mockBudget,
      minBalanceToReplicate: 10,
      initialFunding: 1,
      maxChildren: 5
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('constructor', () => {
    it('should initialize with correct settings', () => {
      assert.strictEqual(replication.minBalanceToReplicate, 10);
      assert.strictEqual(replication.initialFunding, 1);
      assert.strictEqual(replication.maxChildren, 5);
    });

    it('should create children directory', () => {
      assert.ok(fs.existsSync(replication.childrenDir));
    });
  });

  describe('canReplicate()', () => {
    it('should return true when all checks pass', () => {
      const checks = replication.canReplicate();
      
      assert.strictEqual(checks.hasWallet, true);
      assert.strictEqual(checks.hasBudget, true);
      assert.strictEqual(checks.sufficientBalance, true);
      assert.strictEqual(checks.belowMaxChildren, true);
    });

    it('should return false when balance insufficient', () => {
      const poorBudget = {
        getStatus: () => ({ availableBudget: 5 })
      };
      
      const poorReplication = new ReplicationEngine({
        dataDir: TEST_DIR,
        wallet: mockWallet,
        constitution: mockConstitution,
        budget: poorBudget,
        minBalanceToReplicate: 10
      });
      
      const checks = poorReplication.canReplicate();
      
      assert.strictEqual(checks.sufficientBalance, false);
      assert.strictEqual(checks.canReplicate, false);
    });
  });

  describe('spawn()', () => {
    it('should spawn a child automaton', async () => {
      const result = await replication.spawn(
        'Test genesis prompt',
        { initialFunding: 1 }
      );
      
      assert.strictEqual(result.success, true);
      assert.ok(result.childId);
      assert.ok(result.childAddress);
      assert.strictEqual(result.initialFunding, 1);
    });

    it('should create child files', async () => {
      const result = await replication.spawn('Test genesis');
      
      const childDir = path.join(TEST_DIR, 'children', result.childId);
      
      assert.ok(fs.existsSync(path.join(childDir, 'config.json')));
      assert.ok(fs.existsSync(path.join(childDir, 'GENESIS.md')));
      assert.ok(fs.existsSync(path.join(childDir, 'SOUL.md')));
      assert.ok(fs.existsSync(path.join(childDir, 'constitution.json')));
    });

    it('should fail when max children reached', async () => {
      // Spawn max children
      for (let i = 0; i < 5; i++) {
        await replication.spawn(`Child ${i}`);
      }
      
      // Try one more
      const result = await replication.spawn('Should fail');
      
      assert.strictEqual(result.success, false);
      assert.ok(result.reason.includes('belowMaxChildren'));
    });
  });

  describe('getChildren()', () => {
    it('should return empty array initially', () => {
      const children = replication.getChildren();
      
      assert.strictEqual(children.length, 0);
    });

    it('should return spawned children', async () => {
      await replication.spawn('Child 1');
      await replication.spawn('Child 2');
      
      const children = replication.getChildren();
      
      assert.strictEqual(children.length, 2);
    });
  });

  describe('getChild()', () => {
    it('should return specific child', async () => {
      const spawned = await replication.spawn('Test child');
      
      const child = replication.getChild(spawned.childId);
      
      assert.ok(child);
      assert.strictEqual(child.id, spawned.childId);
    });

    it('should return undefined for non-existent child', () => {
      const child = replication.getChild('nonexistent');
      
      assert.strictEqual(child, undefined);
    });
  });

  describe('messageChild()', () => {
    it('should send message to child', async () => {
      const spawned = await replication.spawn('Test child');
      
      const result = await replication.messageChild(
        spawned.childId,
        'Hello child!'
      );
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.delivered, true);
    });

    it('should fail for non-existent child', async () => {
      const result = await replication.messageChild('nonexistent', 'Hello');
      
      assert.strictEqual(result.success, false);
    });
  });

  describe('checkChild()', () => {
    it('should return child status', async () => {
      const spawned = await replication.spawn('Test child');
      
      const status = await replication.checkChild(spawned.childId);
      
      assert.ok(status);
      assert.strictEqual(status.hasSoul, true);
    });
  });

  describe('terminateChild()', () => {
    it('should terminate a child', async () => {
      const spawned = await replication.spawn('Test child');
      
      const result = await replication.terminateChild(
        spawned.childId,
        'Test termination'
      );
      
      assert.strictEqual(result.success, true);
      
      const child = replication.getChild(spawned.childId);
      assert.strictEqual(child.status, 'terminated');
    });
  });

  describe('getLineage()', () => {
    it('should return lineage info', async () => {
      await replication.spawn('Child 1');
      
      const lineage = replication.getLineage();
      
      assert.strictEqual(lineage.parent, mockWallet.address);
      assert.strictEqual(lineage.totalChildren, 1);
      assert.strictEqual(lineage.maxChildren, 5);
    });
  });

  describe('child ID generation', () => {
    it('should generate unique IDs', async () => {
      const ids = new Set();
      
      // Generate IDs with small delays to ensure unique timestamps
      for (let i = 0; i < 10; i++) {
        ids.add(replication._generateChildId());
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // All IDs should be unique
      assert.strictEqual(ids.size, 10);
      
      // All should start with 'child-'
      for (const id of ids) {
        assert.ok(id.startsWith('child-'));
      }
    });
  });

  describe('child wallet generation', () => {
    it('should generate unique wallets', () => {
      const wallet1 = replication._generateChildWallet('child1');
      const wallet2 = replication._generateChildWallet('child2');
      
      assert.notStrictEqual(wallet1.address, wallet2.address);
      assert.ok(wallet1.address.startsWith('0x'));
    });
  });

  describe('law propagation', () => {
    it('should propagate laws to child', () => {
      const laws = replication._propagateLaws();
      
      assert.ok(laws.I);
      assert.ok(laws.II);
      assert.ok(laws.III);
      assert.strictEqual(laws.I.priority, 1);
    });
  });
});
