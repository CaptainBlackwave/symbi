/**
 * Genesis Flow Tests
 * 
 * Tests for the human-bot bonding experience.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Import genesis modules
const {
  GenesisStateMachine,
  STAGES,
  STAGE_ORDER,
  STAGE_INFO,
  SKIPABLE_STAGES,
  MANDATORY_STAGES
} = require('../dist/genesis/states');

const {
  PROMPTS,
  COLORS,
  ASCII_ART,
  PACING,
  getPrompt,
  getStageSteps
} = require('../dist/genesis/prompts');

const {
  Ceremony,
  QuickCeremony,
  createCeremony,
  CEREMONY_PRESETS
} = require('../dist/genesis/ceremony');

const {
  FinanceApproval,
  REQUEST_STATUS,
  URGENCY
} = require('../dist/genesis/finance-approval');

// Test data directory
const TEST_DATA_DIR = path.join(__dirname, '.genesis-test');

// Helper to clean test directory
function cleanTestDir() {
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
}

// ==================== STATE MACHINE TESTS ====================

describe('GenesisStateMachine', () => {
  let stateMachine;

  beforeEach(() => {
    stateMachine = new GenesisStateMachine();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const state = stateMachine.initialize();
      
      assert.strictEqual(state.currentStage, STAGES.AWAKENING);
      assert.strictEqual(state.currentStep, 0);
      assert.strictEqual(state.completedStages.length, 0);
      assert.strictEqual(state.skippedStages.length, 0);
      assert.ok(state.startTime);
      assert.ok(!state.isComplete);
    });

    it('should return correct progress', () => {
      stateMachine.initialize();
      const progress = stateMachine.getProgress();
      
      assert.strictEqual(progress.percent, 0);
      assert.strictEqual(progress.completed, 0);
      assert.strictEqual(progress.total, 12);
      assert.strictEqual(progress.currentStageIndex, 0);
    });
  });

  describe('stage progression', () => {
    it('should complete a stage and advance', () => {
      stateMachine.initialize();
      
      const result = stateMachine.completeStage({ test: 'data' });
      
      assert.ok(result.success);
      assert.ok(!result.complete);
      assert.strictEqual(stateMachine.currentStage, STAGES.IDENTITY);
      assert.strictEqual(stateMachine.completedStages.length, 1);
    });

    it('should collect stage data', () => {
      stateMachine.initialize();
      stateMachine.completeStage({ name: 'Test User' });
      
      assert.strictEqual(stateMachine.stageData[STAGES.AWAKENING].name, 'Test User');
      assert.ok(stateMachine.stageData[STAGES.AWAKENING].completedAt);
    });

    it('should progress through all stages', () => {
      stateMachine.initialize();
      
      for (let i = 0; i < STAGE_ORDER.length; i++) {
        const result = stateMachine.completeStage({});
        if (i === STAGE_ORDER.length - 1) {
          assert.ok(result.complete);
        }
      }
      
      assert.ok(stateMachine.isComplete());
    });
  });

  describe('skip functionality', () => {
    it('should identify skipable stages', () => {
      assert.ok(stateMachine.canSkipStage(STAGES.COMMUNICATION));
      assert.ok(stateMachine.canSkipStage(STAGES.BACKUP));
      assert.ok(stateMachine.canSkipStage(STAGES.DIVIDEND));
      assert.ok(!stateMachine.canSkipStage(STAGES.AWAKENING));
      assert.ok(!stateMachine.canSkipStage(STAGES.CONTRACT));
    });

    it('should not skip without confirmation', () => {
      stateMachine.initialize();
      stateMachine.currentStage = STAGES.COMMUNICATION;
      
      const result = stateMachine.skipStage(false);
      
      assert.ok(!result.success);
      assert.ok(result.needsConfirmation);
      assert.ok(result.warning);
    });

    it('should skip with confirmation', () => {
      stateMachine.initialize();
      stateMachine.currentStage = STAGES.COMMUNICATION;
      
      const result = stateMachine.skipStage(true);
      
      assert.ok(result.success);
      assert.strictEqual(stateMachine.skippedStages.length, 1);
      assert.strictEqual(stateMachine.currentStage, STAGES.FINANCIAL);
    });

    it('should not skip mandatory stages', () => {
      stateMachine.initialize();
      
      const result = stateMachine.skipStage(true);
      
      assert.ok(!result.success);
      assert.ok(result.mandatory);
    });

    it('should provide skip warnings', () => {
      const warning = stateMachine.getSkipWarning(STAGES.COMMUNICATION);
      
      assert.ok(warning);
      assert.ok(warning.title);
      assert.ok(Array.isArray(warning.consequences));
      assert.ok(warning.consequences.length > 0);
    });
  });

  describe('navigation', () => {
    it('should go back to previous stage', () => {
      stateMachine.initialize();
      stateMachine.completeStage({});
      stateMachine.completeStage({});
      
      assert.strictEqual(stateMachine.currentStage, STAGES.COMMUNICATION);
      
      const result = stateMachine.goBack();
      
      assert.ok(result.currentStage);
      assert.strictEqual(stateMachine.currentStage, STAGES.IDENTITY);
    });

    it('should not go back from first stage', () => {
      stateMachine.initialize();
      
      const result = stateMachine.goBack();
      
      assert.ok(!result.success);
    });
  });

  describe('persistence', () => {
    it('should export and import state', () => {
      stateMachine.initialize();
      stateMachine.completeStage({ name: 'Test' });
      stateMachine.completeStage({ channels: ['telegram'] });
      
      const exported = stateMachine.export();
      
      const newMachine = new GenesisStateMachine();
      newMachine.import(exported);
      
      assert.strictEqual(newMachine.currentStage, STAGES.FINANCIAL);
      assert.strictEqual(newMachine.completedStages.length, 2);
      assert.strictEqual(newMachine.stageData[STAGES.IDENTITY].name, 'Test');
    });
  });

  describe('summary', () => {
    it('should return null when not complete', () => {
      stateMachine.initialize();
      
      const summary = stateMachine.getSummary();
      
      assert.strictEqual(summary, null);
    });

    it('should return summary when complete', () => {
      stateMachine.initialize();
      
      // Complete all stages
      while (!stateMachine.isComplete()) {
        stateMachine.completeStage({});
      }
      
      const summary = stateMachine.getSummary();
      
      assert.ok(summary);
      assert.ok(summary.duration);
      assert.ok(summary.completedStages);
    });
  });
});

// ==================== PROMPTS TESTS ====================

describe('Prompts', () => {
  describe('stage prompts', () => {
    it('should have prompts for all stages', () => {
      for (const stage of STAGE_ORDER) {
        assert.ok(PROMPTS[stage], `Missing prompts for ${stage}`);
      }
    });

    it('should have valid prompt structure', () => {
      for (const [stage, prompts] of Object.entries(PROMPTS)) {
        for (const [key, promptFn] of Object.entries(prompts)) {
          const prompt = promptFn();
          
          // Should have either text or art
          assert.ok(
            prompt.text || prompt.art || prompt.input,
            `${stage}.${key} should have text, art, or input`
          );
        }
      }
    });

    it('should have validation for input prompts', () => {
      for (const [stage, prompts] of Object.entries(PROMPTS)) {
        for (const [key, promptFn] of Object.entries(prompts)) {
          const prompt = promptFn();
          
          if (prompt.input && prompt.validation) {
            // Test validation function exists and returns proper format
            const result = prompt.validation('test');
            assert.ok(typeof result.valid === 'boolean');
          }
        }
      }
    });
  });

  describe('getPrompt helper', () => {
    it('should return prompt by stage and step', () => {
      const prompt = getPrompt(STAGES.AWAKENING, 0);
      
      assert.ok(prompt);
      assert.ok(prompt.key);
      assert.ok(prompt.fn);
      assert.ok(prompt.totalSteps > 0);
    });

    it('should return null for invalid step', () => {
      const prompt = getPrompt(STAGES.AWAKENING, 100);
      
      assert.strictEqual(prompt, null);
    });
  });

  describe('ASCII art', () => {
    it('should have all required art assets', () => {
      assert.ok(ASCII_ART.awakening);
      assert.ok(ASCII_ART.heart);
      assert.ok(ASCII_ART.contract);
      assert.ok(ASCII_ART.sparkle);
      assert.ok(ASCII_ART.dna);
      assert.ok(ASCII_ART.target);
      assert.ok(ASCII_ART.shield);
    });

    it('should generate progress bar', () => {
      const bar = ASCII_ART.progress(50);
      
      assert.ok(bar.includes('50%'));
      assert.ok(bar.includes('█'));
      assert.ok(bar.includes('░'));
    });

    it('should generate box', () => {
      const box = ASCII_ART.box('Test content');
      
      assert.ok(box.includes('Test content'));
      assert.ok(box.includes('╔'));
      assert.ok(box.includes('╚'));
    });
  });

  describe('colors', () => {
    it('should have all color codes', () => {
      assert.ok(COLORS.reset);
      assert.ok(COLORS.bold);
      assert.ok(COLORS.red);
      assert.ok(COLORS.green);
      assert.ok(COLORS.blue);
      assert.ok(COLORS.cyan);
      assert.ok(COLORS.magenta);
      assert.ok(COLORS.yellow);
    });
  });

  describe('pacing', () => {
    it('should have valid pacing values', () => {
      assert.ok(PACING.fast > 0);
      assert.ok(PACING.normal > PACING.fast);
      assert.ok(PACING.slow > PACING.normal);
      assert.ok(PACING.ceremony > PACING.slow);
    });
  });
});

// ==================== CEREMONY TESTS ====================

describe('Ceremony', () => {
  describe('initialization', () => {
    it('should create ceremony with options', () => {
      const ceremony = new Ceremony({
        humanName: 'Alice',
        botId: 'brokerbot-test',
        contractHash: 'abc123'
      });
      
      assert.strictEqual(ceremony.humanName, 'Alice');
      assert.strictEqual(ceremony.botId, 'brokerbot-test');
      assert.strictEqual(ceremony.contractHash, 'abc123');
    });

    it('should use defaults', () => {
      const ceremony = new Ceremony();
      
      assert.strictEqual(ceremony.humanName, 'Human');
      assert.strictEqual(ceremony.botId, 'BrokerBot');
    });
  });

  describe('ceremony execution', () => {
    it('should run ceremony phases', async () => {
      let displayed = [];
      
      const ceremony = new Ceremony({
        humanName: 'Test',
        onDisplay: (text) => displayed.push(text),
        onPause: () => Promise.resolve(),
        onClear: () => {},
        onInput: () => Promise.resolve('I promise to help')
      });
      
      const result = await ceremony.run();
      
      assert.ok(result.completed);
      assert.ok(result.humanVow);
      assert.ok(ceremony.completed);
    });

    it('should record human vow', async () => {
      const ceremony = new Ceremony({
        onDisplay: () => {},
        onPause: () => Promise.resolve(),
        onClear: () => {},
        onInput: () => Promise.resolve('My vow to the bot')
      });
      
      await ceremony.run();
      
      assert.strictEqual(ceremony.humanVow, 'My vow to the bot');
    });
  });

  describe('QuickCeremony', () => {
    it('should run quick ceremony', async () => {
      const ceremony = new QuickCeremony({
        humanName: 'Quick',
        onDisplay: () => {},
        onPause: () => Promise.resolve()
      });
      
      const result = await ceremony.run();
      
      assert.ok(result.completed);
    });
  });

  describe('ceremony presets', () => {
    it('should have all presets', () => {
      assert.ok(CEREMONY_PRESETS.full);
      assert.ok(CEREMONY_PRESETS.standard);
      assert.ok(CEREMONY_PRESETS.minimal);
      assert.ok(CEREMONY_PRESETS.quick);
    });

    it('should create ceremony with preset', () => {
      const ceremony = createCeremony({ preset: 'quick' });
      
      assert.ok(ceremony instanceof QuickCeremony);
    });
  });

  describe('summary', () => {
    it('should return ceremony summary', () => {
      const ceremony = new Ceremony({
        humanName: 'Test',
        botId: 'test-bot'
      });
      
      const summary = ceremony.getSummary();
      
      assert.strictEqual(summary.humanName, 'Test');
      assert.strictEqual(summary.botId, 'test-bot');
    });
  });
});

// ==================== FINANCE APPROVAL TESTS ====================

describe('FinanceApproval', () => {
  let finance;
  
  beforeEach(() => {
    cleanTestDir();
    finance = new FinanceApproval({
      dataDir: TEST_DATA_DIR,
      mode: 'approval'
    });
  });

  afterEach(() => {
    cleanTestDir();
  });

  describe('request approval', () => {
    it('should create approval request', async () => {
      const result = await finance.requestApproval({
        amount: 0.50,
        type: 'api_call',
        description: 'Test API call',
        purpose: 'Testing',
        urgency: URGENCY.MEDIUM
      });
      
      assert.ok(result.requestId);
      assert.strictEqual(result.status, REQUEST_STATUS.PENDING);
    });

    it('should format request correctly', async () => {
      const result = await finance.requestApproval({
        amount: 1.00,
        type: 'test',
        description: 'Test expense',
        urgency: URGENCY.HIGH
      });
      
      assert.ok(result.formatted.includes('$1.00'));
      assert.ok(result.formatted.includes('Test expense'));
      assert.ok(result.formatted.includes('HIGH'));
    });

    it('should store pending request', async () => {
      const result = await finance.requestApproval({
        amount: 0.25,
        type: 'test'
      });
      
      const pending = finance.getPendingRequests();
      
      assert.strictEqual(pending.length, 1);
      assert.strictEqual(pending[0].amount, 0.25);
    });
  });

  describe('process response', () => {
    it('should approve request', async () => {
      const { requestId } = await finance.requestApproval({
        amount: 0.50,
        type: 'test'
      });
      
      const result = finance.processResponse(requestId, 'yes');
      
      assert.ok(result.success);
      assert.strictEqual(result.status, REQUEST_STATUS.APPROVED);
    });

    it('should deny request', async () => {
      const { requestId } = await finance.requestApproval({
        amount: 0.50,
        type: 'test'
      });
      
      const result = finance.processResponse(requestId, 'no');
      
      assert.ok(result.success);
      assert.strictEqual(result.status, REQUEST_STATUS.DENIED);
    });

    it('should handle invalid request', async () => {
      const result = finance.processResponse('invalid-id', 'yes');
      
      assert.ok(!result.success);
    });

    it('should handle already processed request', async () => {
      const { requestId } = await finance.requestApproval({
        amount: 0.50,
        type: 'test'
      });
      
      finance.processResponse(requestId, 'yes');
      const result = finance.processResponse(requestId, 'yes');
      
      assert.ok(!result.success);
    });
  });

  describe('expiration', () => {
    it('should identify expired requests', async () => {
      finance.timeoutMs = 0;  // Immediate expiration
      
      await finance.requestApproval({
        amount: 0.50,
        type: 'test'
      });
      
      // Wait a tick
      await new Promise(r => setTimeout(r, 10));
      
      const expired = finance.checkExpired();
      
      assert.strictEqual(expired.length, 1);
      assert.strictEqual(expired[0].status, REQUEST_STATUS.TIMEOUT);
    });
  });

  describe('statistics', () => {
    it('should track statistics', async () => {
      const req1 = await finance.requestApproval({ amount: 1, type: 'test' });
      const req2 = await finance.requestApproval({ amount: 2, type: 'test' });
      const req3 = await finance.requestApproval({ amount: 3, type: 'test' });
      
      finance.processResponse(req1.requestId, 'yes');
      finance.processResponse(req2.requestId, 'no');
      finance.processResponse(req3.requestId, 'yes');
      
      const stats = finance.getStats();
      
      assert.strictEqual(stats.totalRequests, 3);
      assert.strictEqual(stats.approved, 2);
      assert.strictEqual(stats.denied, 1);
    });
  });

  describe('suggestions', () => {
    it('should provide suggestions based on history', async () => {
      // Add some history
      const req = await finance.requestApproval({ amount: 0.50, type: 'api' });
      finance.processResponse(req.requestId, 'yes');
      
      const suggestions = finance.getSuggestions({ amount: 0.50, type: 'api' });
      
      // Should have at least one suggestion (approval rate)
      assert.ok(Array.isArray(suggestions));
    });
  });
});

// ==================== INTEGRATION TESTS ====================

describe('Genesis Integration', () => {
  describe('stage info completeness', () => {
    it('should have info for all stages', () => {
      for (const stage of STAGE_ORDER) {
        const info = STAGE_INFO[stage];
        
        assert.ok(info, `Missing info for ${stage}`);
        assert.ok(info.name);
        assert.ok(info.emoji);
        assert.ok(info.description);
        assert.ok(Array.isArray(info.neurochemicalTarget));
        assert.ok(typeof info.mandatory === 'boolean');
        assert.ok(info.estimatedMinutes > 0);
        assert.ok(info.purpose);
      }
    });
  });

  describe('stage order', () => {
    it('should have correct stage order', () => {
      assert.strictEqual(STAGE_ORDER[0], STAGES.AWAKENING);
      assert.strictEqual(STAGE_ORDER[3], STAGES.FINANCIAL);
      assert.strictEqual(STAGE_ORDER[10], STAGES.CEREMONY);
      assert.strictEqual(STAGE_ORDER[11], STAGES.FIRST_MISSION);
    });
  });

  describe('mandatory vs skipable', () => {
    it('should have consistent mandatory/skipable classification', () => {
      for (const stage of SKIPABLE_STAGES) {
        assert.ok(!MANDATORY_STAGES.includes(stage));
      }
      
      for (const stage of MANDATORY_STAGES) {
        assert.ok(!SKIPABLE_STAGES.includes(stage));
      }
    });
  });
});

// Run tests
console.log('🧪 Running Genesis Flow Tests...\n');
