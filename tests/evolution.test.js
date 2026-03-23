/**
 * Evolution System Tests
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const EvolutionSystem = require('../dist/evolution/self-modify');

const TEST_DIR = path.join(__dirname, '.test-evolution');

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

// Mock constitution
const mockConstitution = {
  isProtected: (file) => ['constitution.js', 'wallet.json'].includes(file)
};

describe('EvolutionSystem', () => {
  let evolution;

  beforeEach(() => {
    cleanup();
    evolution = new EvolutionSystem({
      dataDir: TEST_DIR,
      constitution: mockConstitution,
      maxModificationsPerWindow: 5
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('initialize()', () => {
    it('should initialize the system', async () => {
      await evolution.initialize();
      
      assert.ok(evolution._initialized);
      assert.ok(fs.existsSync(evolution.auditLogPath));
    });
  });

  describe('proposeModification()', () => {
    beforeEach(async () => {
      await evolution.initialize();
    });

    it('should propose allowed modification', async () => {
      const proposal = await evolution.proposeModification(
        'src/skills/test.js',
        'console.log("test")',
        'Creating test skill'
      );
      
      assert.strictEqual(proposal.allowed, true);
      assert.ok(proposal.modId);
    });

    it('should reject protected files', async () => {
      const proposal = await evolution.proposeModification(
        'wallet.json',
        'modified content',
        'Trying to modify wallet'
      );
      
      assert.strictEqual(proposal.allowed, false);
      assert.ok(proposal.reason.includes('protected'));
    });

    it('should reject paths not in allowed list', async () => {
      const proposal = await evolution.proposeModification(
        'src/core/important.js',
        'modified',
        'test'
      );
      
      assert.strictEqual(proposal.allowed, false);
      assert.ok(proposal.reason.includes('not in allowed'));
    });
  });

  describe('executeModification()', () => {
    beforeEach(async () => {
      await evolution.initialize();
    });

    it('should execute allowed modification', async () => {
      const proposal = await evolution.proposeModification(
        'src/skills/test.js',
        'console.log("test")',
        'Creating test skill'
      );
      
      const result = await evolution.executeModification(proposal);
      
      assert.strictEqual(result.success, true);
      assert.ok(result.modId);
    });

    it('should reject non-allowed modifications', async () => {
      const proposal = {
        allowed: false,
        reason: 'Test rejection'
      };
      
      await assert.rejects(
        async () => await evolution.executeModification(proposal),
        /not allowed/
      );
    });
  });

  describe('rate limiting', () => {
    beforeEach(async () => {
      await evolution.initialize();
    });

    it('should enforce rate limits', async () => {
      // Make max modifications
      for (let i = 0; i < 5; i++) {
        const proposal = await evolution.proposeModification(
          `src/skills/test${i}.js`,
          `console.log("test${i}")`,
          `Creating test skill ${i}`
        );
        
        if (proposal.allowed) {
          await evolution.executeModification(proposal);
        }
      }
      
      // Next should be rate limited
      const proposal = await evolution.proposeModification(
        'src/skills/rateLimited.js',
        'console.log("limited")',
        'Should be rate limited'
      );
      
      assert.strictEqual(proposal.allowed, false);
      assert.ok(proposal.reason.includes('Rate limit'));
    });
  });

  describe('createSkill()', () => {
    beforeEach(async () => {
      await evolution.initialize();
    });

    it('should create a new skill', async () => {
      const result = await evolution.createSkill(
        'mySkill',
        'module.exports = () => "skill result";'
      );
      
      assert.strictEqual(result.success, true);
    });
  });

  describe('installTool()', () => {
    beforeEach(async () => {
      await evolution.initialize();
    });

    it('should install a new tool', async () => {
      const result = await evolution.installTool(
        'myTool',
        'module.exports = () => "tool result";'
      );
      
      assert.strictEqual(result.success, true);
    });
  });

  describe('getHistory()', () => {
    beforeEach(async () => {
      await evolution.initialize();
    });

    it('should return modification history', async () => {
      const proposal = await evolution.proposeModification(
        'src/skills/history.js',
        'test',
        'test'
      );
      
      if (proposal.allowed) {
        await evolution.executeModification(proposal);
      }
      
      const history = evolution.getHistory();
      
      assert.ok(history.length > 0);
    });
  });

  describe('getAuditLog()', () => {
    beforeEach(async () => {
      await evolution.initialize();
    });

    it('should return audit log', async () => {
      const proposal = await evolution.proposeModification(
        'src/skills/audit.js',
        'test',
        'test'
      );
      
      if (proposal.allowed) {
        await evolution.executeModification(proposal);
      }
      
      const log = await evolution.getAuditLog();
      
      assert.ok(log.length > 0);
    });
  });

  describe('getStats()', () => {
    beforeEach(async () => {
      await evolution.initialize();
    });

    it('should return evolution stats', () => {
      const stats = evolution.getStats();
      
      assert.ok(stats.totalModifications !== undefined);
      assert.ok(stats.rateLimitRemaining !== undefined);
      assert.ok(stats.protectedFiles);
      assert.ok(stats.allowedPaths);
    });
  });

  describe('protected files', () => {
    it('should identify protected files', () => {
      // Only wallet files are protected - constitution.js is intentionally NOT protected
      // to allow aggressive evolution (per SURVIVAL_TRACKER design)
      assert.strictEqual(evolution._isProtected('wallet.json'), true);
      assert.strictEqual(evolution._isProtected('wallet.js'), true);
      assert.strictEqual(evolution._isProtected('constitution.js'), false);
      assert.strictEqual(evolution._isProtected('random.js'), false);
    });
  });

  describe('path checking', () => {
    it('should identify allowed paths', () => {
      assert.strictEqual(evolution._isPathAllowed('src/skills/test.js'), true);
      assert.strictEqual(evolution._isPathAllowed('src/tools/test.js'), true);
      assert.strictEqual(evolution._isPathAllowed('src/core/test.js'), false);
    });
  });

  describe('modification ID generation', () => {
    it('should generate unique IDs', () => {
      const id1 = evolution._generateModId('file1', 'content1');
      const id2 = evolution._generateModId('file2', 'content2');
      
      assert.notStrictEqual(id1, id2);
      assert.ok(id1.startsWith('mod-'));
    });
  });
});
