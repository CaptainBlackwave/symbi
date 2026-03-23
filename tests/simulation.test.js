/**
 * Simulation Environment Tests
 * 
 * Tests the complete simulation environment including:
 * - Mock services (LLM, Registry, Wallet, Market, Network)
 * - Scenario engine
 * - Time control
 * - Integration with bot systems
 */

const assert = require('assert');
const { SimulationEnvironment } = require('../dist/simulation');

describe('SimulationEnvironment', () => {
  let sim;

  beforeEach(() => {
    sim = new SimulationEnvironment({
      initialBalance: 10.00,
      initialAgents: 5,
      timeAcceleration: 100,
      verbose: false
    });
  });

  afterEach(async () => {
    if (sim) {
      await sim.stop();
    }
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultSim = new SimulationEnvironment();
      
      assert.ok(defaultSim.llmServer);
      assert.ok(defaultSim.registry);
      assert.ok(defaultSim.wallet);
      assert.ok(defaultSim.market);
      assert.ok(defaultSim.network);
      assert.ok(defaultSim.time);
      assert.ok(defaultSim.scenarios);
    });

    it('should initialize with custom config', () => {
      assert.strictEqual(sim.wallet.getBalance(), 10.00);
      assert.strictEqual(sim.registry.getAgentCount(), 5);
    });
  });

  describe('start/stop', () => {
    it('should start simulation', async () => {
      await sim.start();
      
      const metrics = sim.getMetrics();
      assert.ok(metrics.startTime > 0);
    });

    it('should stop simulation', async () => {
      await sim.start();
      await sim.stop();
      
      const metrics = sim.getMetrics();
      assert.ok(metrics.elapsedReal >= 0);
    });

    it('should not start twice', async () => {
      await sim.start();
      
      try {
        await sim.start();
        assert.fail('Should have thrown');
      } catch (error) {
        assert.ok(error.message.includes('already running'));
      }
    });
  });

  describe('time control', () => {
    it('should advance time', async () => {
      await sim.start();
      
      const before = sim.time.elapsed();
      await sim.advance(1000);
      const after = sim.time.elapsed();
      
      assert.ok(after > before);
    });

    it('should support time acceleration', async () => {
      const fastSim = new SimulationEnvironment({
        timeAcceleration: 1000,
        verbose: false
      });
      
      await fastSim.start();
      await fastSim.advance(1000);
      
      // Simulated time should be much faster than real time
      assert.ok(fastSim.time.elapsed() > 1000);
      
      await fastSim.stop();
    });
  });

  describe('mock LLM', () => {
    it('should complete requests', async () => {
      const result = await sim.llmServer.complete({
        messages: [{ role: 'user', content: 'Test request' }],
        taskType: 'reasoning'
      });
      
      assert.ok(result.content);
      assert.ok(result.usage.cost >= 0);
      assert.ok(result.usage.inputTokens > 0);
      assert.ok(result.usage.outputTokens > 0);
    });

    it('should handle decomposition', async () => {
      const result = await sim.llmServer.complete({
        messages: [{ role: 'user', content: 'Research market trends' }],
        taskType: 'decomposition'
      });
      
      const tasks = JSON.parse(result.content);
      assert.ok(Array.isArray(tasks));
      assert.ok(tasks.length > 0);
    });

    it('should track usage', async () => {
      await sim.llmServer.complete({
        messages: [{ role: 'user', content: 'Test 1' }],
        taskType: 'reasoning'
      });
      
      await sim.llmServer.complete({
        messages: [{ role: 'user', content: 'Test 2' }],
        taskType: 'reasoning'
      });
      
      const usage = sim.llmServer.getUsage();
      assert.strictEqual(usage.requests, 2);
      assert.ok(usage.totalCost > 0);
    });
  });

  describe('mock registry', () => {
    it('should have initial agents', () => {
      const agents = sim.registry.getActiveAgents();
      assert.ok(agents.length > 0);
    });

    it('should discover agents by capability', () => {
      const agents = sim.registry.discoverByCapability('research');
      assert.ok(agents.length > 0);
      assert.ok(agents[0].capabilities['research'] || 
                Object.keys(agents[0].capabilities).some(c => c.includes('research')));
    });

    it('should perform handshake', async () => {
      const agents = sim.registry.getActiveAgents();
      const result = await sim.registry.handshake(agents[0].id);
      
      assert.strictEqual(result.success, true);
      assert.ok(result.agent);
    });

    it('should add and remove agents', () => {
      const initialCount = sim.registry.getAgentCount();
      
      const agent = sim.registry.addAgent({
        name: 'Test-Agent',
        capabilities: { test: true }
      });
      
      assert.strictEqual(sim.registry.getAgentCount(), initialCount + 1);
      
      sim.registry.removeAgent(agent.id);
      assert.strictEqual(sim.registry.getAgentCount(), initialCount);
    });
  });

  describe('mock wallet', () => {
    it('should track balance', () => {
      assert.strictEqual(sim.wallet.getBalance(), 10.00);
    });

    it('should record earnings', async () => {
      await sim.wallet.recordEarning(5, 'supervise', 'Test earning');
      assert.strictEqual(sim.wallet.getBalance(), 15.00);
    });

    it('should record spending', async () => {
      const success = await sim.wallet.recordSpend(2, 'llm', 'Test spend');
      
      assert.strictEqual(success, true);
      assert.strictEqual(sim.wallet.getBalance(), 8.00);
    });

    it('should prevent overspending', async () => {
      const success = await sim.wallet.recordSpend(20, 'llm', 'Too much');
      
      assert.strictEqual(success, false);
      assert.strictEqual(sim.wallet.getBalance(), 10.00);
    });

    it('should check affordability', () => {
      assert.strictEqual(sim.wallet.canAfford(5), true);
      assert.strictEqual(sim.wallet.canAfford(15), false);
    });
  });

  describe('mock market', () => {
    it('should have market conditions', () => {
      const conditions = sim.market.getAllConditions();
      assert.ok(conditions.length > 0);
    });

    it('should calculate optimal price', () => {
      const price = sim.market.calculateOptimalPrice('supervise', 0.5);
      assert.ok(price > 0);
    });

    it('should generate requests', () => {
      const request = sim.market.generateRequest();
      
      if (request) {
        assert.ok(request.id);
        assert.ok(request.service);
        assert.ok(request.client);
        assert.ok(request.maxPrice > 0);
      }
    });

    it('should spike demand', () => {
      const before = sim.market.getDemand('supervise');
      sim.market.spikeDemand('supervise', 2);
      const after = sim.market.getDemand('supervise');
      
      assert.ok(after > before);
    });
  });

  describe('mock network', () => {
    it('should track network stats', () => {
      const stats = sim.network.getStats();
      
      assert.ok(stats.totalAgents > 0);
      assert.ok(stats.activeAgents > 0);
    });

    it('should simulate attacks', () => {
      sim.network.simulateAttack('ddos');
      
      const events = sim.network.getEvents();
      const attackEvent = events.find(e => e.type === 'attack');
      
      assert.ok(attackEvent);
    });

    it('should simulate growth', () => {
      const before = sim.network.getStats().totalAgents;
      sim.network.simulateGrowth(2);
      const after = sim.network.getStats().totalAgents;
      
      assert.ok(after > before);
    });
  });

  describe('scenarios', () => {
    it('should list available scenarios', () => {
      const scenarios = sim.scenarios.getAvailableScenarios();
      
      assert.ok(scenarios.includes('cold-start'));
      assert.ok(scenarios.includes('budget-crisis'));
      assert.ok(scenarios.includes('competition'));
    });

    it('should load scenario', async () => {
      await sim.scenarios.load('cold-start');
      
      const current = sim.scenarios.getCurrentScenario();
      assert.strictEqual(current.name, 'Cold Start');
    });

    it('should track progress', async () => {
      await sim.scenarios.load('first-earnings');
      
      const progress = sim.scenarios.getProgress();
      assert.ok(progress.total > 0);
    });
  });

  describe('metrics', () => {
    it('should track metrics', async () => {
      await sim.start();
      
      // Simulate some activity
      await sim.llmServer.complete({
        messages: [{ role: 'user', content: 'Test' }],
        taskType: 'reasoning'
      });
      
      await sim.wallet.recordEarning(0.05, 'supervise', 'Test');
      
      const metrics = sim.getMetrics();
      
      assert.ok(metrics.tasksCompleted >= 0);
      assert.ok(metrics.totalEarnings >= 0);
    });
  });

  describe('events', () => {
    it('should emit started event', async () => {
      let started = false;
      sim.on('started', () => { started = true; });
      
      await sim.start();
      assert.strictEqual(started, true);
    });

    it('should emit stopped event', async () => {
      let stopped = false;
      sim.on('stopped', () => { stopped = true; });
      
      await sim.start();
      await sim.stop();
      assert.strictEqual(stopped, true);
    });

    it('should emit crisis event', async () => {
      let crisisEmitted = false;
      sim.on('crisis', () => { crisisEmitted = true; });
      
      // Drain wallet to trigger crisis
      sim.wallet.setBalance(0.5);
      await sim.wallet.recordSpend(0.3, 'test', 'Drain');
      
      assert.strictEqual(crisisEmitted, true);
    });
  });

  describe('snapshots', () => {
    it('should create snapshot', async () => {
      await sim.start();
      
      const snapshot = sim.getSnapshot();
      
      assert.ok(snapshot.wallet);
      assert.ok(snapshot.registry);
      assert.ok(snapshot.market);
      assert.ok(snapshot.network);
      assert.ok(snapshot.metrics);
    });

    it('should load snapshot', async () => {
      await sim.start();
      
      const snapshot = sim.getSnapshot();
      snapshot.wallet.balance = 999;
      
      sim.loadSnapshot(snapshot);
      
      assert.strictEqual(sim.wallet.getBalance(), 999);
    });
  });

  describe('reset', () => {
    it('should reset simulation', async () => {
      await sim.start();
      await sim.llmServer.complete({
        messages: [{ role: 'user', content: 'Test' }],
        taskType: 'reasoning'
      });
      
      sim.reset();
      
      const metrics = sim.getMetrics();
      assert.strictEqual(metrics.tasksCompleted, 0);
      assert.strictEqual(metrics.totalEarnings, 0);
    });
  });

  describe('integration', () => {
    it('should run full simulation cycle', async () => {
      await sim.start();
      
      // Advance time and let market generate requests
      await sim.advance(5000);
      
      // Process some LLM requests
      await sim.llmServer.complete({
        messages: [{ role: 'user', content: 'Analyze market' }],
        taskType: 'decomposition'
      });
      
      // Record earnings
      await sim.wallet.recordEarning(0.05, 'supervise', 'Service completed');
      
      // Check handshakes
      const agents = sim.registry.getActiveAgents();
      if (agents.length > 0) {
        await sim.registry.handshake(agents[0].id);
      }
      
      const metrics = sim.getMetrics();
      
      assert.ok(metrics.tasksCompleted > 0);
      assert.ok(metrics.totalEarnings > 0);
      assert.ok(metrics.elapsedSimulated > 0);
    });
  });
});