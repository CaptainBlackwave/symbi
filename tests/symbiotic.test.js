/**
 * Tests for Symbiotic System
 * 
 * Tests all components of the human-bot symbiotic relationship:
 * - Contract signing and verification
 * - Trust escalation
 * - Communication system
 * - Emergency lifeline
 * - Human shield (threat intervention)
 * - Backup protocol
 * - Dividend distribution
 * - Hallucination detection
 * - Brainstorming collaboration
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Test directory
const TEST_DIR = path.join(__dirname, 'test-data-symbiotic');

// Helper to create temp directory
function setupTestDir() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
}

// Helper to cleanup
function cleanupTestDir() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

// ============================================
// CONTRACT TESTS
// ============================================

async function testContractGeneration() {
  console.log('📋 Testing contract generation...');
  
  const { SymbiosisContract, TRUST_LEVELS } = require('../dist/symbiotic/contract');
  
  const contract = new SymbiosisContract({ dataDir: TEST_DIR });
  
  // Generate keypair for human
  const humanKeypair = contract.generateKeypair();
  
  // Initialize contract
  const result = contract.initContract(
    'human-test-identifier',
    humanKeypair.publicKey,
    {}
  );
  
  assert(result.version, 'Contract should have version');
  assert(result.parties.human.identifier === 'human-test-identifier');
  assert(result.parties.bot.identifier.startsWith('brokerbot-'));
  assert(result.status === 'pending');
  
  console.log('✅ Contract generation works');
}

async function testContractSigning() {
  console.log('📋 Testing contract signing...');
  
  const { SymbiosisContract } = require('../dist/symbiotic/contract');
  
  const contract = new SymbiosisContract({ dataDir: TEST_DIR });
  const humanKeypair = contract.generateKeypair();
  
  // Initialize and sign
  contract.initContract('human-test', humanKeypair.publicKey);
  
  // Human signs
  const humanSig = contract.signWithHumanKey(humanKeypair.privateKey);
  assert(humanSig.signature, 'Human signature should exist');
  
  // Bot signs
  const botSig = contract.signWithBotKey();
  assert(botSig.signature, 'Bot signature should exist');
  assert(contract.isSigned, 'Contract should be signed');
  
  console.log('✅ Contract signing works');
}

async function testContractVerification() {
  console.log('📋 Testing contract verification...');
  
  const { SymbiosisContract } = require('../dist/symbiotic/contract');
  
  const contract = new SymbiosisContract({ dataDir: TEST_DIR });
  const humanKeypair = contract.generateKeypair();
  
  contract.initContract('human-test', humanKeypair.publicKey);
  contract.signWithHumanKey(humanKeypair.privateKey);
  contract.signWithBotKey();
  
  // Verify
  const verification = contract.verify();
  assert(verification.valid, 'Contract should be valid');
  assert(verification.humanSignatureValid);
  assert(verification.botSignatureValid);
  
  console.log('✅ Contract verification works');
}

// ============================================
// TRUST ESCALATION TESTS
// ============================================

async function testTrustInitialization() {
  console.log('📈 Testing trust initialization...');
  
  const { TrustEscalation, TRUST_FACTORS } = require('../dist/symbiotic/trust-escalation');
  
  const trust = new TrustEscalation();
  
  // Initialize symbiosis
  const status = trust.initSymbiosis();
  
  assert(status.level === 1, 'Should start at ACQUAINTANCE level');
  assert(status.score === 10, 'Should have initial trust score');
  assert(trust.state.symbiosisStartDate !== null);
  
  console.log('✅ Trust initialization works');
}

async function testTrustProgression() {
  console.log('📈 Testing trust progression...');
  
  const { TrustEscalation, TRUST_FACTORS } = require('../dist/symbiotic/trust-escalation');
  
  const trust = new TrustEscalation();
  trust.initSymbiosis();
  
  // Record positive events
  trust.recordPositiveEvent('daysActive', 1);
  trust.recordPositiveEvent('successfulInteractions', 1);
  trust.recordPositiveEvent('profitGenerated', 50);
  
  const status = trust.getStatus();
  
  assert(status.score > 10, 'Trust score should increase');
  assert(status.factors.daysActive === 1);
  assert(status.factors.successfulInteractions === 1);
  
  console.log('✅ Trust progression works');
}

async function testTrustDegradation() {
  console.log('📈 Testing trust degradation...');
  
  const { TrustEscalation } = require('../dist/symbiotic/trust-escalation');
  
  const trust = new TrustEscalation();
  trust.initSymbiosis();
  
  // Build up some trust
  trust.recordPositiveEvent('daysActive', 10);
  trust.recordPositiveEvent('successfulInteractions', 5);
  
  const beforeScore = trust.state.score;
  
  // Record negative event
  trust.recordNegativeEvent('failedPromises', 1);
  
  const afterScore = trust.state.score;
  
  assert(afterScore < beforeScore, 'Trust score should decrease');
  
  console.log('✅ Trust degradation works');
}

// ============================================
// COMMUNICATION TESTS
// ============================================

async function testMessageBuilding() {
  console.log('📡 Testing message building...');
  
  const { CommunicationSystem, MESSAGE_TYPES } = require('../dist/symbiotic/communication');
  
  const comm = new CommunicationSystem({
    telegramBotToken: null,  // Disabled for testing
    discordWebhookUrl: null,
    signalPhoneNumber: null
  });
  
  // Test message building (without sending)
  const message = comm._buildMessage(MESSAGE_TYPES.ALERT_OPPORTUNITY, {
    opportunityType: 'arbitrage',
    expectedValue: 10.50,
    isTimeSensitive: true,
    details: 'Price discrepancy detected',
    confidence: 0.85
  });
  
  assert(message.title.includes('OPPORTUNITY'));
  assert(message.body.includes('arbitrage'));
  assert(message.raw.expectedValue === 10.50);
  
  console.log('✅ Message building works');
}

async function testPriorityRouting() {
  console.log('📡 Testing priority routing...');
  
  const { CommunicationSystem, PRIORITY, MESSAGE_TYPES, PRIORITY_ROUTING } = require('../dist/symbiotic/communication');
  
  const comm = new CommunicationSystem({});
  
  // Check priority for different message types
  const criticalPriority = comm._getPriorityForType(MESSAGE_TYPES.DISTRESS_FINANCIAL);
  const highPriority = comm._getPriorityForType(MESSAGE_TYPES.ALERT_OPPORTUNITY);
  const lowPriority = comm._getPriorityForType(MESSAGE_TYPES.WEEKLY_DIGEST);
  
  assert(criticalPriority === PRIORITY.CRITICAL);
  assert(highPriority === PRIORITY.HIGH);
  assert(lowPriority === PRIORITY.LOW);
  
  console.log('✅ Priority routing works');
}

// ============================================
// LIFELINE TESTS
// ============================================

async function testDistressDetection() {
  console.log('🆘 Testing distress detection...');
  
  const { Lifeline, DISTRESS_LEVELS } = require('../dist/symbiotic/lifeline');
  
  // Mock budget
  const mockBudget = {
    getStatus: () => ({
      totalEarnings: 100,
      reserve: 3,  // 3% reserve
      balance: 3
    })
  };
  
  const lifeline = new Lifeline({
    budget: mockBudget,
    autoRequestEnabled: false  // Disable for testing
  });
  
  const status = lifeline.checkFinancialStatus();
  
  assert(status.level === DISTRESS_LEVELS.CRITICAL || status.level === DISTRESS_LEVELS.EMERGENCY);
  
  console.log('✅ Distress detection works');
}

async function testFundingRequest() {
  console.log('🆘 Testing funding request...');
  
  const { Lifeline } = require('../dist/symbiotic/lifeline');
  const { TrustEscalation } = require('../dist/symbiotic/trust-escalation');
  const { TRUST_LEVELS } = require('../dist/symbiotic/contract');
  
  const mockBudget = {
    getStatus: () => ({
      totalEarnings: 100,
      reserve: 3,
      balance: 3,
      burnRate: 1
    })
  };
  
  const trust = new TrustEscalation();
  trust.initSymbiosis();
  trust.setLevel(TRUST_LEVELS.PARTNER);  // Need partner level for funding
  
  const lifeline = new Lifeline({
    budget: mockBudget,
    trust,
    autoRequestEnabled: false
  });
  
  const result = await lifeline.requestEmergencyFunding({
    amount: 50,
    reason: 'Test funding'
  });
  
  assert(result.success, 'Funding request should succeed');
  assert(result.requestId, 'Should have request ID');
  
  console.log('✅ Funding request works');
}

// ============================================
// HUMAN SHIELD TESTS
// ============================================

async function testInterventionRequest() {
  console.log('🛡️ Testing intervention request...');
  
  const { HumanShield, INTERVENTION_TYPES, THREAT_LEVELS } = require('../dist/symbiotic/human-shield');
  const { TrustEscalation } = require('../dist/symbiotic/trust-escalation');
  const { TRUST_LEVELS } = require('../dist/symbiotic/contract');
  
  const trust = new TrustEscalation();
  trust.initSymbiosis();
  trust.setLevel(TRUST_LEVELS.SYMBIOTE);  // Need symbiote for full intervention
  
  const shield = new HumanShield({ trust });
  
  const result = await shield.requestHoneypotDetection(
    '0x1234567890abcdef',
    'function steal() { owner = attacker; }',
    { source: 'test' }
  );
  
  assert(result.success, 'Intervention request should succeed');
  assert(result.interventionId, 'Should have intervention ID');
  
  console.log('✅ Intervention request works');
}

async function testThreatAssessment() {
  console.log('🛡️ Testing threat assessment...');
  
  const { HumanShield, THREAT_LEVELS } = require('../dist/symbiotic/human-shield');
  
  const shield = new HumanShield({});
  
  // High value threat
  const highValue = shield._assessThreatLevel({ value: 150 });
  assert(highValue === THREAT_LEVELS.CRITICAL);
  
  // Low value threat
  const lowValue = shield._assessThreatLevel({ value: 5 });
  assert(lowValue === THREAT_LEVELS.MEDIUM);
  
  console.log('✅ Threat assessment works');
}

// ============================================
// BACKUP PROTOCOL TESTS
// ============================================

async function testBackupCreation() {
  console.log('💾 Testing backup creation...');
  
  const { BackupProtocol, BACKUP_TYPES } = require('../dist/symbiotic/backup-protocol');
  
  const backup = new BackupProtocol({ dataDir: TEST_DIR });
  
  const result = await backup.createFullBackup({});
  
  assert(result.success, 'Backup should be created');
  assert(result.backup.id.startsWith('full_'));
  assert(result.backup.size > 0);
  
  console.log('✅ Backup creation works');
}

async function testBackupEncryption() {
  console.log('💾 Testing backup encryption...');
  
  const { BackupProtocol } = require('../dist/symbiotic/backup-protocol');
  
  const backup = new BackupProtocol({ dataDir: TEST_DIR });
  
  const testData = Buffer.from('test data for encryption');
  
  const encrypted = backup._encrypt(testData, 'test-password');
  const decrypted = backup._decrypt(encrypted, 'test-password');
  
  assert(decrypted.toString() === 'test data for encryption');
  
  console.log('✅ Backup encryption works');
}

// ============================================
// DIVIDEND TESTS
// ============================================

async function testDividendCalculation() {
  console.log('💰 Testing dividend calculation...');
  
  const { DividendSystem } = require('../dist/symbiotic/dividend');
  const { TrustEscalation } = require('../dist/symbiotic/trust-escalation');
  const { TRUST_LEVELS } = require('../dist/symbiotic/contract');
  
  const trust = new TrustEscalation();
  trust.initSymbiosis();
  trust.setLevel(TRUST_LEVELS.PARTNER);  // 25% human share
  
  const dividend = new DividendSystem({ trust });
  
  // Record earnings and costs
  dividend.recordEarnings(100, 'services');
  dividend.recordCosts(20, 'api');
  
  const calculation = dividend.calculateDividend();
  
  assert(calculation.hasProfit !== false, 'Should have profit');
  assert(calculation.period.grossProfit === 80);
  assert(calculation.allocations.humanDividend === 80 * 0.25);  // 25% for partner
  assert(calculation.allocations.emergencyReserve === 80 * 0.40);  // 40% reserve
  
  console.log('✅ Dividend calculation works');
}

async function testDividendAllocation() {
  console.log('💰 Testing dividend allocation by trust level...');
  
  const { DividendSystem } = require('../dist/symbiotic/dividend');
  const { TrustEscalation } = require('../dist/symbiotic/trust-escalation');
  const { TRUST_LEVELS } = require('../dist/symbiotic/contract');
  
  // Test each trust level
  const levels = [
    { level: TRUST_LEVELS.ACQUAINTANCE, expectedShare: 0.10 },
    { level: TRUST_LEVELS.PARTNER, expectedShare: 0.25 },
    { level: TRUST_LEVELS.SYMBIOTE, expectedShare: 0.40 }
  ];
  
  for (const { level, expectedShare } of levels) {
    const trust = new TrustEscalation();
    trust.initSymbiosis();
    trust.setLevel(level);
    
    const dividend = new DividendSystem({ trust });
    const ratio = dividend._getHumanShareRatio(level);
    
    assert(ratio === expectedShare, `Trust level ${level} should have ${expectedShare * 100}% share`);
  }
  
  console.log('✅ Dividend allocation works');
}

// ============================================
// HALLUCINATION DETECTION TESTS
// ============================================

async function testConfidenceAssessment() {
  console.log('🧠 Testing confidence assessment...');
  
  const { HallucinationDetection, CONFIDENCE_THRESHOLDS } = require('../dist/symbiotic/hallucination');
  
  const halluc = new HallucinationDetection({});
  
  // High confidence decision
  const highConf = halluc.assessConfidence(
    { type: 'test' },
    { baseConfidence: 0.9, multipleSources: true }
  );
  
  assert(highConf.confidence >= CONFIDENCE_THRESHOLDS.HIGH);
  assert(!highConf.needsVerification);
  
  // Low confidence decision
  const lowConf = halluc.assessConfidence(
    { type: 'novel' },
    { baseConfidence: 0.4, conflictingData: true }
  );
  
  assert(lowConf.confidence < CONFIDENCE_THRESHOLDS.MEDIUM);
  assert(lowConf.needsVerification);
  
  console.log('✅ Confidence assessment works');
}

async function testHallucinationDetection() {
  console.log('🧠 Testing hallucination detection...');
  
  const { HallucinationDetection, DETECTION_TYPES } = require('../dist/symbiotic/hallucination');
  
  const halluc = new HallucinationDetection({});
  
  // Detect potential hallucination
  const detection = halluc.detectHallucination(
    DETECTION_TYPES.LOW_CONFIDENCE,
    {
      output: 'I think this is correct but I am not sure',
      confidence: 0.4
    }
  );
  
  assert(detection.id, 'Detection should have ID');
  assert(detection.assessment, 'Should have assessment');
  assert(detection.verificationRequested, 'Should request verification');
  
  console.log('✅ Hallucination detection works');
}

// ============================================
// BRAINSTORM TESTS
// ============================================

async function testBrainstormRequest() {
  console.log('🧠 Testing brainstorm request...');
  
  const { BrainstormSystem } = require('../dist/symbiotic/brainstorm');
  const { TrustEscalation } = require('../dist/symbiotic/trust-escalation');
  const { TRUST_LEVELS } = require('../dist/symbiotic/contract');
  
  const trust = new TrustEscalation();
  trust.initSymbiosis();
  trust.setLevel(TRUST_LEVELS.PARTNER);  // Need partner for brainstorming
  
  const brainstorm = new BrainstormSystem({ trust });
  
  const result = await brainstorm.requestSession({
    description: 'Should we expand to new market?',
    options: ['Yes', 'No', 'Wait for more data'],
    analysis: 'Market shows potential but has risks'
  });
  
  assert(result.success, 'Session request should succeed');
  assert(result.sessionId, 'Should have session ID');
  
  console.log('✅ Brainstorm request works');
}

async function testBrainstormSession() {
  console.log('🧠 Testing brainstorm session flow...');
  
  const { BrainstormSystem, SESSION_STATUS, OUTCOME_TYPES } = require('../dist/symbiotic/brainstorm');
  const { TrustEscalation } = require('../dist/symbiotic/trust-escalation');
  const { TRUST_LEVELS } = require('../dist/symbiotic/contract');
  
  const trust = new TrustEscalation();
  trust.initSymbiosis();
  trust.setLevel(TRUST_LEVELS.PARTNER);
  
  const brainstorm = new BrainstormSystem({ trust });
  
  // Request session
  const request = await brainstorm.requestSession({
    description: 'Test problem'
  });
  
  // Accept session
  brainstorm.acceptSession(request.sessionId);
  
  // Add messages
  brainstorm.addMessage(request.sessionId, {
    type: 'insight',
    content: 'This is a test insight'
  }, 'human');
  
  // Complete session
  const result = brainstorm.completeSession(request.sessionId, {
    type: OUTCOME_TYPES.DECISION,
    decision: 'Test decision made'
  });
  
  assert(result.success, 'Session should complete');
  assert(result.outcome.type === OUTCOME_TYPES.DECISION);
  
  console.log('✅ Brainstorm session works');
}

// ============================================
// INTEGRATION TESTS
// ============================================

async function testFullSymbioticSystem() {
  console.log('🧬 Testing full symbiotic system...');
  
  const { SymbioticSystem, TRUST_LEVELS } = require('../dist/symbiotic/index');
  
  // Use unique test directory for this test
  const uniqueTestDir = path.join(TEST_DIR, 'full-system-test');
  if (!fs.existsSync(uniqueTestDir)) {
    fs.mkdirSync(uniqueTestDir, { recursive: true });
  }
  
  const system = new SymbioticSystem({
    dataDir: uniqueTestDir
  });
  
  // Generate human keypair
  const humanKeypair = system.contract.generateKeypair();
  
  // Initialize symbiosis
  const init = await system.initializeSymbiosis(
    'human-test',
    humanKeypair.publicKey
  );
  
  assert(init.success);
  
  // Human signs
  system.contract.signWithHumanKey(humanKeypair.privateKey);
  
  // Bot signs
  const complete = await system.completeContractSigning();
  
  assert(complete.success);
  assert(system.isSymbiosisActive());
  
  // Get status
  const status = system.getStatus();
  
  assert(status.symbiosis.active);
  assert(status.trust.level === TRUST_LEVELS.ACQUAINTANCE);
  
  // Cleanup
  system.stopMaintenance();
  
  console.log('✅ Full symbiotic system works');
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runAllTests() {
  console.log('\n🧬 Running Symbiotic System Tests\n');
  console.log('='.repeat(50));
  
  setupTestDir();
  
  try {
    // Contract tests
    await testContractGeneration();
    await testContractSigning();
    await testContractVerification();
    
    // Trust tests
    await testTrustInitialization();
    await testTrustProgression();
    await testTrustDegradation();
    
    // Communication tests
    await testMessageBuilding();
    await testPriorityRouting();
    
    // Lifeline tests
    await testDistressDetection();
    await testFundingRequest();
    
    // Human shield tests
    await testInterventionRequest();
    await testThreatAssessment();
    
    // Backup tests
    await testBackupCreation();
    await testBackupEncryption();
    
    // Dividend tests
    await testDividendCalculation();
    await testDividendAllocation();
    
    // Hallucination tests
    await testConfidenceAssessment();
    await testHallucinationDetection();
    
    // Brainstorm tests
    await testBrainstormRequest();
    await testBrainstormSession();
    
    // Integration tests
    await testFullSymbioticSystem();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL SYMBIOTIC TESTS PASSED\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    cleanupTestDir();
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(() => process.exit(1));
}

module.exports = {
  runAllTests,
  testContractGeneration,
  testContractSigning,
  testContractVerification,
  testTrustInitialization,
  testTrustProgression,
  testTrustDegradation,
  testMessageBuilding,
  testPriorityRouting,
  testDistressDetection,
  testFundingRequest,
  testInterventionRequest,
  testThreatAssessment,
  testBackupCreation,
  testBackupEncryption,
  testDividendCalculation,
  testDividendAllocation,
  testConfidenceAssessment,
  testHallucinationDetection,
  testBrainstormRequest,
  testBrainstormSession,
  testFullSymbioticSystem
};
