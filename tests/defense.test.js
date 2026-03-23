/**
 * Tests for Defense Module
 */

const DefenseSystem = require('../dist/defense/shield');
const EconomicFirewall = require('../dist/defense/economic-firewall');
const IntrusionDetection = require('../dist/defense/intrusion');
const HoneypotSystem = require('../dist/defense/honeypot');

// Mock budget
const mockBudget = {
  getStatus: () => ({
    totalEarnings: 10,
    totalSpending: 3,
    availableBudget: 7
  }),
  recordEarning: () => {},
  recordSpending: () => {}
};

// Mock constitution
const mockConstitution = {
  getCreator: () => '0xcreator123',
  isCreator: (addr) => addr === '0xcreator123'
};

async function runTests() {
  console.log('🧪 Running Defense Module Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Defense System Initialization
  try {
    const defense = new DefenseSystem({ budget: mockBudget });
    const status = defense.getStatus();
    if (status.blacklistSize === 0 && status.whitelistSize === 0) {
      console.log('✅ Test 1: Defense System initializes correctly');
      passed++;
    } else {
      console.log('❌ Test 1: Defense System initialization failed');
      failed++;
    }
  } catch (e) {
    console.log('❌ Test 1: Error - ' + e.message);
    failed++;
  }
  
  // Test 2: Rate Limiting
  try {
    const defense = new DefenseSystem({ 
      budget: mockBudget,
      maxRequestsPerMinute: 5 
    });
    
    const address = '0xtest123';
    let results = [];
    
    // Make 6 requests
    for (let i = 0; i < 6; i++) {
      const result = await defense.checkInteraction(address, 'test', {});
      results.push(result);
    }
    
    // Last request should be blocked
    if (results[5].allowed === false) {
      console.log('✅ Test 2: Rate limiting works correctly');
      passed++;
    } else {
      console.log('❌ Test 2: Rate limiting failed');
      failed++;
    }
  } catch (e) {
    console.log('❌ Test 2: Error - ' + e.message);
    failed++;
  }
  
  // Test 3: Blacklist
  try {
    const defense = new DefenseSystem({ budget: mockBudget });
    const badActor = '0xbadactor';
    
    defense.addToBlacklist(badActor);
    
    const result = await defense.checkInteraction(badActor, 'test', {});
    
    if (result.allowed === false && result.reason === 'Blacklisted address') {
      console.log('✅ Test 3: Blacklist blocks correctly');
      passed++;
    } else {
      console.log('❌ Test 3: Blacklist failed');
      failed++;
    }
  } catch (e) {
    console.log('❌ Test 3: Error - ' + e.message);
    failed++;
  }
  
  // Test 4: Whitelist
  try {
    const defense = new DefenseSystem({ budget: mockBudget });
    const trusted = '0xtrusted';
    
    defense.addToWhitelist(trusted);
    
    const result = await defense.checkInteraction(trusted, 'test', {});
    
    if (result.allowed === true && result.threatLevel === 'low') {
      console.log('✅ Test 4: Whitelist allows correctly');
      passed++;
    } else {
      console.log('❌ Test 4: Whitelist failed');
      failed++;
    }
  } catch (e) {
    console.log('❌ Test 4: Error - ' + e.message);
    failed++;
  }
  
  // Test 5: Economic Firewall - Reserve Check
  try {
    const firewall = new EconomicFirewall({ budget: mockBudget });
    
    // Mock budget with low earnings
    const lowBudget = {
      getStatus: () => ({
        totalEarnings: 1,
        totalSpending: 0.9
      })
    };
    
    const strictFirewall = new EconomicFirewall({ budget: lowBudget });
    const result = await strictFirewall.checkSpending(0.5, 'test');
    
    if (result.allowed === false) {
      console.log('✅ Test 5: Economic Firewall blocks spending that breaches reserve');
      passed++;
    } else {
      console.log('❌ Test 5: Economic Firewall failed to protect reserve');
      failed++;
    }
  } catch (e) {
    console.log('❌ Test 5: Error - ' + e.message);
    failed++;
  }
  
  // Test 6: Intrusion Detection
  try {
    const intrusion = new IntrusionDetection();
    
    // First interaction - creates baseline
    const result1 = intrusion.analyze('0xnewuser', 'test', {});
    
    // Multiple rapid interactions
    for (let i = 0; i < 10; i++) {
      intrusion.analyze('0xnewuser', 'test', {});
    }
    
    const stats = intrusion.getStats();
    
    if (stats.trackedBaselines > 0) {
      console.log('✅ Test 6: Intrusion Detection tracks baselines');
      passed++;
    } else {
      console.log('❌ Test 6: Intrusion Detection failed');
      failed++;
    }
  } catch (e) {
    console.log('❌ Test 6: Error - ' + e.message);
    failed++;
  }
  
  // Test 7: Honeypot Creation
  try {
    const honeypot = new HoneypotSystem();
    
    const hp = honeypot.createHoneypot('wallet');
    
    if (honeypot.isHoneypot(hp.address).isHoneypot === true) {
      console.log('✅ Test 7: Honeypot creation works');
      passed++;
    } else {
      console.log('❌ Test 7: Honeypot creation failed');
      failed++;
    }
  } catch (e) {
    console.log('❌ Test 7: Error - ' + e.message);
    failed++;
  }
  
  // Test 8: Honeypot Interaction Recording
  try {
    const honeypot = new HoneypotSystem();
    const hp = honeypot.createHoneypot('wallet');
    const attacker = '0xattacker';
    
    honeypot.recordInteraction(hp.id, attacker, { action: 'steal' });
    
    const attackers = honeypot.getKnownAttackers();
    
    if (attackers.length > 0 && attackers[0].address === attacker) {
      console.log('✅ Test 8: Honeypot records attackers');
      passed++;
    } else {
      console.log('❌ Test 8: Honeypot attacker tracking failed');
      failed++;
    }
  } catch (e) {
    console.log('❌ Test 8: Error - ' + e.message);
    failed++;
  }
  
  // Summary
  console.log('\n📊 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  return failed === 0;
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
