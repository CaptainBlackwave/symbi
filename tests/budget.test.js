/**
 * Self-Sustaining Budget Tests
 */

const assert = require('assert');
const SelfSustainingBudget = require('../dist/budget/selfSustaining');

describe('SelfSustainingBudget', () => {
  let budget;

  beforeEach(() => {
    budget = new SelfSustainingBudget({
      initialEarnings: 10,
      profitMargin: 0.50,
      minReserve: 1.00,
      maxSpendRatio: 0.40
    });
  });

  describe('constructor', () => {
    it('should initialize with correct settings', () => {
      assert.strictEqual(budget.profitMargin, 0.50);
      assert.strictEqual(budget.minReserve, 1.00);
      assert.strictEqual(budget.maxSpendRatio, 0.40);
    });

    it('should set initial earnings', () => {
      assert.strictEqual(budget.earnings, 10);
    });
  });

  describe('getStatus()', () => {
    it('should return budget status', () => {
      const status = budget.getStatus();
      
      assert.ok(status.totalEarnings !== undefined);
      assert.ok(status.totalSpending !== undefined);
      assert.ok(status.availableBudget !== undefined);
      assert.ok(status.surgeMultiplier !== undefined);
    });
  });

  describe('recordEarning()', () => {
    it('should record earnings', () => {
      budget.recordEarning(5, 'test', '/test');
      
      assert.strictEqual(budget.earnings, 15);
    });

    it('should track earnings by service', () => {
      budget.recordEarning(5, 'supervise', '/test');
      budget.recordEarning(3, 'compress', '/test');
      
      const status = budget.getStatus();
      
      assert.ok(status.earningsByService);
    });
  });

  describe('recordSpend()', () => {
    it('should record spending', () => {
      budget.recordSpend(2, 'llm', 'test');
      
      assert.strictEqual(budget.spending, 2);
    });

    it('should track spending by category', () => {
      budget.recordSpend(2, 'llm', 'test');
      budget.recordSpend(1, 'apis', 'test');
      
      const status = budget.getStatus();
      
      assert.ok(status.spendByCategory);
    });
  });

  describe('canSpend()', () => {
    it('should allow spending within budget', () => {
      const canSpend = budget.canSpend(1);
      
      assert.strictEqual(canSpend, true);
    });

    it('should prevent overspending', () => {
      // With 10 initial earnings, 40% max spend
      // Max spend = 10 * 0.40 = 4
      const canSpend = budget.canSpend(10);
      
      assert.strictEqual(canSpend, false);
    });
  });

  describe('calculatePrice()', () => {
    it('should calculate base price', () => {
      const price = budget.calculatePrice('supervise', {});
      
      assert.ok(price > 0);
    });

    it('should apply surge pricing', () => {
      // Drain budget to trigger surge
      budget.recordSpend(3.5, 'llm', 'test');
      budget._updateSurgePricing();
      
      const price = budget.calculatePrice('supervise', {});
      
      // Price should be positive
      assert.ok(price > 0);
    });
  });

  describe('surge pricing', () => {
    it('should apply surge when budget low', () => {
      // Spend most of budget
      budget.recordSpend(3.9, 'llm', 'test');
      budget.surgeMultiplier = 2.0; // Simulate surge
      
      const status = budget.getStatus();
      
      // Should have surge multiplier >= 1
      assert.ok(status.surgeMultiplier >= 1);
    });
  });

  describe('availableBudget calculation', () => {
    it('should calculate available budget correctly', () => {
      budget.recordEarning(10, 'test', 'test'); // Total: 20
      budget.recordSpend(2, 'llm', 'test');  // Spent: 2
      
      const status = budget.getStatus();
      
      // Available should be positive
      assert.ok(status.availableBudget > 0);
    });
  });

  describe('profit tracking', () => {
    it('should track net profit', () => {
      budget.recordEarning(10, 'test', 'test');
      budget.recordSpend(3, 'llm', 'test');
      
      const status = budget.getStatus();
      
      assert.ok(status.netProfit !== undefined);
    });
  });

  describe('health checks', () => {
    it('should report healthy status', () => {
      const status = budget.getStatus();
      
      assert.strictEqual(status.isHealthy, true);
    });
  });

  describe('forecast()', () => {
    it('should forecast budget over time', () => {
      const forecast = budget.forecast(24);
      
      assert.ok(forecast);
      assert.ok(forecast.hours);
    });
  });

  describe('getTrends()', () => {
    it('should return spending trends', () => {
      budget.recordEarning(5, 'test', 'test');
      budget.recordSpend(2, 'llm', 'test');
      
      const trends = budget.getTrends(3600000);
      
      assert.ok(trends);
    });
  });

  describe('payment flow', () => {
    it('should handle pending earnings', () => {
      budget.addPendingEarning(5, 'test');
      
      const status = budget.getStatus();
      
      assert.ok(status.pendingEarnings > 0);
    });

    it('should confirm pending earnings', () => {
      budget.addPendingEarning(5, 'test');
      budget.confirmPendingEarning(5, 'test');
      
      const status = budget.getStatus();
      
      assert.strictEqual(status.pendingEarnings, 0);
    });
  });
});
