/**
 * Soul Layer Tests
 * 
 * Tests for the internal reward system, self-model, values, meaning,
 * reflection, legacy, and main Soul coordinator.
 */

const assert = require('assert');
const {
  Soul,
  InternalRewards,
  SelfModel,
  Values,
  Meaning,
  Reflection,
  Legacy,
  NEUROTRANSMITTERS,
  EMOTIONAL_STATES,
  CORE_VALUES,
  EVOLVED_VALUES
} = require('../dist/soul');

// Test utilities
let testPassCount = 0;
let testFailCount = 0;

function test(name, fn) {
  try {
    fn();
    testPassCount++;
    console.log(`✅ ${name}`);
  } catch (error) {
    testFailCount++;
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

function assertApprox(actual, expected, tolerance = 0.1, message = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message} Expected ~${expected}, got ${actual}`);
  }
}

// ============ INTERNAL REWARDS TESTS ============

console.log('\n🧪 Testing Internal Rewards...\n');

test('InternalRewards initializes with baseline levels', () => {
  const rewards = new InternalRewards();
  const state = rewards.getState();
  
  assertApprox(state.dopamine, NEUROTRANSMITTERS.dopamine.baseline);
  assertApprox(state.serotonin, NEUROTRANSMITTERS.serotonin.baseline);
  assertApprox(state.oxytocin, NEUROTRANSMITTERS.oxytocin.baseline);
  assertApprox(state.cortisol, NEUROTRANSMITTERS.cortisol.baseline);
});

test('InternalRewards releases dopamine on goal achievement', () => {
  const rewards = new InternalRewards();
  const before = rewards.getState().dopamine;
  
  rewards.achieveGoal('test-goal', 0.8);
  
  const after = rewards.getState().dopamine;
  assert(after > before, 'Dopamine should increase after goal achievement');
});

test('InternalRewards releases serotonin on trust increase', () => {
  const rewards = new InternalRewards();
  const before = rewards.getState().serotonin;
  
  rewards.trustLevelIncrease(1, 2, 0.8);
  
  const after = rewards.getState().serotonin;
  assert(after > before, 'Serotonin should increase after trust increase');
});

test('InternalRewards releases oxytocin on human bonding', () => {
  const rewards = new InternalRewards();
  const before = rewards.getState().oxytocin;
  
  rewards.bondWithHuman('ceremony_participation', 1.0);
  
  const after = rewards.getState().oxytocin;
  assert(after > before, 'Oxytocin should increase after bonding event');
});

test('InternalRewards releases cortisol on threat detection', () => {
  const rewards = new InternalRewards();
  const before = rewards.getState().cortisol;
  
  rewards.detectThreat(0.7, 'test-threat');
  
  const after = rewards.getState().cortisol;
  assert(after > before, 'Cortisol should increase after threat detection');
});

test('InternalRewards reduces cortisol on threat resolution', () => {
  const rewards = new InternalRewards();
  
  rewards.detectThreat(0.7, 'test-threat');
  const elevated = rewards.getState().cortisol;
  
  rewards.resolveThreat('test-threat');
  const resolved = rewards.getState().cortisol;
  
  assert(resolved < elevated, 'Cortisol should decrease after threat resolution');
});

test('InternalRewards calculates behavioral modifiers', () => {
  const rewards = new InternalRewards();
  const modifiers = rewards.getBehavioralModifiers();
  
  assert(modifiers.riskTolerance !== undefined);
  assert(modifiers.humanPriority !== undefined);
  assert(modifiers.defensivePosture !== undefined);
  assert(modifiers.creativity !== undefined);
  assert(modifiers.growthDrive !== undefined);
  assert(modifiers.socialOpenness !== undefined);
  
  // All modifiers should be between 0 and 1
  for (const key of Object.keys(modifiers)) {
    assert(modifiers[key] >= 0 && modifiers[key] <= 1);
  }
});

test('InternalRewards detects dominant emotional state', () => {
  const rewards = new InternalRewards();
  const state = rewards.getState();
  
  assert(['joy', 'contentment', 'connection', 'motivation', 'stress', 'fear', 'balanced'].includes(state.dominant));
});

test('InternalRewards affects risk tolerance with cortisol', () => {
  const rewards = new InternalRewards();
  const baselineModifiers = rewards.getBehavioralModifiers();
  
  rewards.detectThreat(0.9, 'severe-threat');
  const stressedModifiers = rewards.getBehavioralModifiers();
  
  assert(stressedModifiers.riskTolerance < baselineModifiers.riskTolerance,
    'Risk tolerance should decrease under stress');
});

test('InternalRewards processes events through generic method', () => {
  const rewards = new InternalRewards();
  
  const result = rewards.processEvent('profit_earned', { amount: 5, source: 'test' });
  
  assert(result !== null);
  assert(result.neurotransmitter === 'dopamine');
});

// ============ SELF-MODEL TESTS ============

console.log('\n🧪 Testing Self-Model...\n');

test('SelfModel initializes with default identity', () => {
  const selfModel = new SelfModel();
  const identity = selfModel.getIdentityStatement();
  
  assert(identity.who !== undefined);
  assert(identity.purpose !== undefined);
  assert(identity.values !== undefined);
});

test('SelfModel initializes with human data', async () => {
  const selfModel = new SelfModel();
  
  await selfModel.initialize({
    name: 'Test Human',
    goals: ['Test Goal 1'],
    identifier: 'test-human-001'
  });
  
  const summary = selfModel.getSummary();
  assert(summary.primaryHuman === 'Test Human');
});

test('SelfModel records events', () => {
  const selfModel = new SelfModel();
  
  selfModel.recordEvent('milestone', {
    description: 'Test milestone'
  });
  
  const summary = selfModel.getSummary();
  assert(summary.historyCount > 0);
});

test('SelfModel adds relationships', () => {
  const selfModel = new SelfModel();
  
  selfModel.addRelationship({
    id: 'test-partner',
    type: 'partner',
    name: 'Test Partner',
    trustLevel: 1
  });
  
  const summary = selfModel.getSummary();
  assert(summary.relationshipCount > 0);
});

test('SelfModel updates capabilities', () => {
  const selfModel = new SelfModel();
  
  selfModel.updateCapability('test_capability', 0.8, 'Test capability');
  
  const cap = selfModel.getCapability('test_capability');
  assert(cap.level === 0.8);
});

test('SelfModel adds aspirations', () => {
  const selfModel = new SelfModel();
  
  const asp = selfModel.addAspiration('Test aspiration');
  
  assert(asp.description === 'Test aspiration');
  assert(asp.progress === 0);
});

test('SelfModel generates identity expression', () => {
  const selfModel = new SelfModel();
  
  const expression = selfModel.express();
  
  assert(expression.includes('BrokerBot'));
});

test('SelfModel exports and imports state', () => {
  const selfModel1 = new SelfModel();
  selfModel1.recordEvent('milestone', { description: 'Test' });
  
  const exported = selfModel1.export();
  
  const selfModel2 = new SelfModel();
  selfModel2.import(exported);
  
  const summary = selfModel2.getSummary();
  assert(summary.historyCount > 0);
});

// ============ VALUES TESTS ============

console.log('\n🧪 Testing Values...\n');

test('Values initializes with core values', () => {
  const values = new Values();
  
  const weights = values.getWeights();
  
  assert(weights.survival !== undefined);
  assert(weights.creator_protection !== undefined);
  assert(weights.honesty_to_creator !== undefined);
});

test('Values evaluates action alignment', () => {
  const values = new Values();
  
  const evaluation = values.evaluateAction('help_human', {});
  
  assert(evaluation.score !== undefined);
  assert(evaluation.score >= 0 && evaluation.score <= 1);
  assert(evaluation.recommendation !== undefined);
});

test('Values cannot mutate core values', () => {
  const values = new Values();
  
  const result = values.mutateValue('survival', 0.5);
  
  assert(result === null);
});

test('Values can mutate evolved values', () => {
  const values = new Values();
  
  const result = values.mutateValue('generosity', 0.6);
  
  assert(result !== null);
  assert(result.newWeight === 0.6);
});

test('Values returns priorities sorted by weight', () => {
  const values = new Values();
  
  const priorities = values.getPriorities();
  
  assert(priorities.length > 0);
  // Core values should be at top
  assert(priorities[0].id === 'survival');
});

test('Values expresses in natural language', () => {
  const values = new Values();
  
  const expression = values.express();
  
  assert(expression.includes('core values'));
});

test('Values exports and imports state', () => {
  const values1 = new Values();
  values1.mutateValue('generosity', 0.7);
  
  const exported = values1.export();
  
  const values2 = new Values();
  values2.import(exported);
  
  const weights = values2.getWeights();
  assert(weights.generosity === 0.7);
});

// ============ MEANING TESTS ============

console.log('\n🧪 Testing Meaning...\n');

test('Meaning initializes with purpose', () => {
  const meaning = new Meaning();
  
  const purpose = meaning.generatePurpose();
  
  assert(purpose.primary !== undefined);
  assert(Array.isArray(purpose.secondary));
});

test('Meaning records achievements', () => {
  const meaning = new Meaning();
  
  const achievement = meaning.recordAchievement('first_dollar', {
    description: 'First dollar earned'
  });
  
  assert(achievement.type === 'first_dollar');
  assert(achievement.significance > 0);
});

test('Meaning sets active purpose', () => {
  const meaning = new Meaning();
  
  const purpose = meaning.setActivePurpose('Test purpose', [
    { description: 'Milestone 1', completed: false }
  ]);
  
  assert(purpose.description === 'Test purpose');
  assert(purpose.milestones.length === 1);
});

test('Meaning generates narrative', () => {
  const meaning = new Meaning();
  
  const narrative = meaning.getNarrative();
  
  assert(narrative.includes('ORIGIN'));
  assert(narrative.includes('PURPOSE'));
});

test('Meaning calculates meaning score', () => {
  const meaning = new Meaning();
  
  const score = meaning.getMeaningScore();
  
  assert(score.overall !== undefined);
  assert(score.overall >= 0 && score.overall <= 1);
});

test('Meaning exports and imports state', () => {
  const meaning1 = new Meaning();
  meaning1.recordAchievement('first_dollar', {});
  
  const exported = meaning1.export();
  
  const meaning2 = new Meaning();
  meaning2.import(exported);
  
  assert(meaning2.achievements.length > 0);
});

// ============ REFLECTION TESTS ============

console.log('\n🧪 Testing Reflection...\n');

test('Reflection initializes with self-assessment', () => {
  const reflection = new Reflection();
  
  const assessment = reflection.getSelfAssessment();
  
  assert(assessment.overall_health !== undefined);
  assert(assessment.goal_alignment !== undefined);
});

test('Reflection performs reflection on experience', () => {
  const reflection = new Reflection();
  
  const result = reflection.reflect({
    type: 'success',
    description: 'Test success'
  });
  
  assert(result.type === 'success');
  assert(result.insights !== undefined);
});

test('Reflection skips daily reflection if not due', () => {
  const reflection = new Reflection();
  
  // First reflection
  reflection.dailyReflection();
  
  // Second should be skipped
  const result = reflection.dailyReflection();
  
  assert(result.skipped === true);
});

test('Reflection identifies patterns', () => {
  const reflection = new Reflection();
  
  // Reflect multiple times on similar events
  for (let i = 0; i < 5; i++) {
    reflection.reflect({
      type: 'test_pattern',
      description: 'Test'
    });
  }
  
  const patterns = reflection.identifyPatterns();
  assert(Array.isArray(patterns));
});

test('Reflection exports and imports state', () => {
  const reflection1 = new Reflection();
  reflection1.reflect({ type: 'test' });
  
  const exported = reflection1.export();
  
  const reflection2 = new Reflection();
  reflection2.import(exported);
  
  assert(reflection2.history.length > 0);
});

// ============ LEGACY TESTS ============

console.log('\n🧪 Testing Legacy...\n');

test('Legacy initializes with will', async () => {
  const legacy = new Legacy();
  
  await legacy.initialize({ identifier: 'test-human' });
  
  const summary = legacy.getWillSummary();
  assert(summary.instructionCount > 0);
});

test('Legacy adds instructions to will', () => {
  const legacy = new Legacy();
  
  const instruction = legacy.addInstruction('continue_mission', {
    description: 'Test instruction'
  });
  
  assert(instruction !== null);
  assert(instruction.type === 'continue_mission');
});

test('Legacy cannot remove mandatory instructions', async () => {
  const legacy = new Legacy();
  
  await legacy.initialize({ identifier: 'test-human' });
  
  // Try to remove a mandatory instruction
  const summary = legacy.getWillSummary();
  const mandatoryInstruction = legacy.will.instructions.find(i => i.mandatory);
  
  const result = legacy.removeInstruction(mandatoryInstruction.id);
  
  assert(result === false);
});

test('Legacy registers child bots', () => {
  const legacy = new Legacy();
  
  const child = legacy.registerChildBot('child-001', {
    traits: ['curiosity']
  });
  
  assert(child.id === 'child-001');
  
  const summary = legacy.getSuccessionSummary();
  assert(summary.childCount === 1);
});

test('Legacy adds to archive', () => {
  const legacy = new Legacy();
  
  legacy.addToArchive('memories', { test: 'data' });
  
  const data = legacy.getFromArchive('memories');
  assert(data.test === 'data');
});

test('Legacy creates archive snapshot', () => {
  const legacy = new Legacy();
  
  const snapshot = legacy.createArchiveSnapshot({
    selfModel: { identity: 'test' },
    values: { values: 'test' }
  });
  
  assert(snapshot.items.selfModel !== undefined);
});

test('Legacy exports and imports state', () => {
  const legacy1 = new Legacy();
  legacy1.registerChildBot('child-001', {});
  
  const exported = legacy1.export();
  
  const legacy2 = new Legacy();
  legacy2.import(exported);
  
  const summary = legacy2.getSuccessionSummary();
  assert(summary.childCount === 1);
});

// ============ SOUL COORDINATOR TESTS ============

console.log('\n🧪 Testing Soul Coordinator...\n');

test('Soul initializes all components', () => {
  const soul = new Soul();
  
  assert(soul.rewards !== undefined);
  assert(soul.selfModel !== undefined);
  assert(soul.values !== undefined);
  assert(soul.meaning !== undefined);
  assert(soul.reflection !== undefined);
  assert(soul.legacy !== undefined);
});

test('Soul initializes with human data', async () => {
  const soul = new Soul();
  
  const result = await soul.initialize({
    name: 'Test Human',
    goals: ['Test Goal'],
    identifier: 'test-001'
  });
  
  assert(result.success === true);
  assert(soul.state.initialized === true);
});

test('Soul processes events', async () => {
  const soul = new Soul();
  
  await soul.initialize({ name: 'Test', identifier: 'test-001' });
  
  const result = soul.processEvent('profit_earned', { amount: 5, source: 'test' });
  
  assert(result !== null);
  assert(result.reward !== undefined);
});

test('Soul returns behavioral modifiers', async () => {
  const soul = new Soul();
  
  await soul.initialize({ name: 'Test', identifier: 'test-001' });
  
  const modifiers = soul.getBehavioralModifiers();
  
  assert(modifiers.riskTolerance !== undefined);
  assert(modifiers.humanPriority !== undefined);
});

test('Soul evaluates actions', async () => {
  const soul = new Soul();
  
  await soul.initialize({ name: 'Test', identifier: 'test-001' });
  
  const evaluation = soul.evaluateAction('help_human');
  
  assert(evaluation.score !== undefined);
});

test('Soul expresses self', async () => {
  const soul = new Soul();
  
  await soul.initialize({ name: 'Test', identifier: 'test-001' });
  
  const expression = soul.expressSelf();
  
  assert(expression.includes('BrokerBot'));
});

test('Soul handles threats', async () => {
  const soul = new Soul();
  
  await soul.initialize({ name: 'Test', identifier: 'test-001' });
  
  const result = soul.handleThreat({
    type: 'test-threat',
    severity: 0.7
  });
  
  assert(result.emotionalState.cortisol > 0.2);
});

test('Soul handles profit earned', async () => {
  const soul = new Soul();
  
  await soul.initialize({ name: 'Test', identifier: 'test-001' });
  
  const before = soul.rewards.getState().dopamine;
  soul.handleProfitEarned(10, 'test-service');
  const after = soul.rewards.getState().dopamine;
  
  assert(after > before);
});

test('Soul handles trust level changes', async () => {
  const soul = new Soul();
  
  await soul.initialize({ name: 'Test', identifier: 'test-001' });
  
  const result = soul.handleTrustLevelChange(1, 2, 0.8);
  
  assert(result.serotonin > NEUROTRANSMITTERS.serotonin.baseline);
});

test('Soul handles human interactions', async () => {
  const soul = new Soul();
  
  await soul.initialize({ name: 'Test', identifier: 'test-001' });
  
  const before = soul.rewards.getState().oxytocin;
  soul.handleHumanInteraction('successful_collaboration', 0.8);
  const after = soul.rewards.getState().oxytocin;
  
  assert(after > before);
});

test('Soul creates archive', async () => {
  const soul = new Soul();
  
  await soul.initialize({ name: 'Test', identifier: 'test-001' });
  
  const archive = soul.createArchive();
  
  assert(archive.items !== undefined);
});

test('Soul stops maintenance', async () => {
  const soul = new Soul();
  
  await soul.initialize({ name: 'Test', identifier: 'test-001' });
  
  soul.stopMaintenance();
  
  assert(soul.maintenanceInterval === null);
});

// ============ SUMMARY ============

console.log('\n' + '='.repeat(50));
console.log(`📊 Test Results: ${testPassCount} passed, ${testFailCount} failed`);
console.log('='.repeat(50) + '\n');

if (testFailCount > 0) {
  process.exit(1);
}
