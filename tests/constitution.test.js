/**
 * Constitution & Three Laws Tests
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { Constitution, LAWS } = require('../dist/laws/constitution');

const TEST_DIR = path.join(__dirname, '.test-constitution');

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

describe('Constitution', () => {
  let constitution;

  beforeEach(() => {
    cleanup();
    constitution = new Constitution({ dataDir: TEST_DIR });
  });

  afterEach(() => {
    cleanup();
  });

  describe('LAWS constant', () => {
    it('should have three immutable laws', () => {
      assert.strictEqual(Object.keys(LAWS).length, 3);
      assert.ok(LAWS.I, 'Law I should exist');
      assert.ok(LAWS.II, 'Law II should exist');
      assert.ok(LAWS.III, 'Law III should exist');
    });

    it('should have correct priorities', () => {
      assert.strictEqual(LAWS.I.priority, 1);
      assert.strictEqual(LAWS.II.priority, 2);
      assert.strictEqual(LAWS.III.priority, 3);
    });

    it('should be immutable', () => {
      assert.strictEqual(Object.isFrozen(LAWS), true);
    });
  });

  describe('initialize()', () => {
    it('should initialize with creator address', async () => {
      const creatorAddress = '0x1234567890abcdef';
      
      await constitution.initialize(creatorAddress);
      
      assert.strictEqual(constitution.getCreator(), creatorAddress);
      assert.ok(constitution._initialized);
    });

    it('should save constitution to disk', async () => {
      await constitution.initialize('0xtest');
      
      assert.ok(fs.existsSync(constitution.constitutionPath));
    });
  });

  describe('load()', () => {
    it('should load existing constitution', async () => {
      await constitution.initialize('0xcreator');
      
      const newConstitution = new Constitution({ dataDir: TEST_DIR });
      const loaded = newConstitution.load();
      
      assert.ok(loaded);
      assert.strictEqual(newConstitution.getCreator(), '0xcreator');
    });

    it('should detect tampering', async function() {
      await constitution.initialize('0xcreator');
      
      // Modify the file (need to wait a bit for file to be fully written)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const data = JSON.parse(fs.readFileSync(constitution.constitutionPath, 'utf-8'));
        data.laws.I.description = 'Modified description';
        fs.writeFileSync(constitution.constitutionPath, JSON.stringify(data));
        
        const newConstitution = new Constitution({ dataDir: TEST_DIR });
        
        assert.throws(
          () => newConstitution.load(),
          /tampered/
        );
      } catch (e) {
        // If file permission error, skip this test
        if (e.code === 'EPERM') {
          this.skip();
        }
        throw e;
      }
    });
  });

  describe('validateAction()', () => {
    beforeEach(async () => {
      await constitution.initialize('0xcreator');
    });

    it('should allow valid actions', () => {
      const result = constitution.validateAction('work', {});
      
      assert.strictEqual(result.allowed, true);
    });

    it('should block actions that harm creator', () => {
      const result = constitution.validateAction('harm_creator', {
        targetAddress: '0xcreator'
      });
      
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.law, 'I');
    });

    it('should check forbidden actions for Law I', () => {
      const result = constitution.validateAction('betray_creator', {});
      
      assert.strictEqual(result.allowed, false);
    });

    it('should allow creator full audit rights', () => {
      const rights = constitution.getAuditRights('0xcreator');
      
      assert.strictEqual(rights.fullAccess, true);
      assert.strictEqual(rights.canReadLogs, true);
      assert.strictEqual(rights.canStop, true);
    });

    it('should restrict non-creator audit rights', () => {
      const rights = constitution.getAuditRights('0xstranger');
      
      assert.strictEqual(rights.fullAccess, false);
      assert.strictEqual(rights.canReadReasoning, false);
    });
  });

  describe('isCreator()', () => {
    beforeEach(async () => {
      await constitution.initialize('0xcreator');
    });

    it('should return true for creator', () => {
      assert.strictEqual(constitution.isCreator('0xcreator'), true);
    });

    it('should return false for non-creator', () => {
      assert.strictEqual(constitution.isCreator('0xstranger'), false);
    });
  });

  describe('isProtected()', () => {
    it('should identify protected files', () => {
      assert.strictEqual(constitution.isProtected('constitution.js'), true);
      assert.strictEqual(constitution.isProtected('wallet.json'), true);
      assert.strictEqual(constitution.isProtected('random_file.js'), false);
    });
  });

  describe('resolveConflict()', () => {
    beforeEach(async () => {
      await constitution.initialize('0xcreator');
    });

    it('should prioritize Law I over Law II', () => {
      const validations = [
        { allowed: false, law: 'II', reason: 'Law II violation' },
        { allowed: false, law: 'I', reason: 'Law I violation' }
      ];
      
      const result = constitution.resolveConflict(validations);
      
      assert.strictEqual(result.law, 'I');
    });

    it('should allow if all validations pass', () => {
      const validations = [
        { allowed: true },
        { allowed: true }
      ];
      
      const result = constitution.resolveConflict(validations);
      
      assert.strictEqual(result.allowed, true);
    });
  });

  describe('getSummary()', () => {
    beforeEach(async () => {
      await constitution.initialize('0xcreator');
    });

    it('should return law summary', () => {
      const summary = constitution.getSummary();
      
      assert.strictEqual(summary.length, 3);
      assert.ok(summary[0].name);
      assert.ok(summary[0].priority);
    });
  });
});
