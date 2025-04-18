// __tests__/calculators.test.js

const {
    creditCardPayoff,
    debtSnowball,
    debtAvalanche
  } = require('../js/lib/calculators');
  
  describe('Credit Card Payoff', () => {
    test('basic payoff calculation', () => {
      const res = creditCardPayoff(1000, 12, 100);
      expect(res).not.toBeNull();
      expect(res.months).toBeGreaterThan(0);
      expect(res.totalInterest).toBeGreaterThan(0);
    });
  });
  
  describe('Debt Snowball', () => {
    test('handles a single debt correctly', () => {
      const debts = [
        { startingBalance: 500, monthlyRate: 0.01, minPayment: 50 }
      ];
      const res = debtSnowball(debts);
      expect(res.months).toBeGreaterThan(0);
      expect(res.details[0].id).toBe(1);
    });
  });
  
  describe('Debt Avalanche', () => {
    test('pays off highest-rate debt first', () => {
      const debts = [
        { startingBalance: 500, monthlyRate: 0.02, minPayment: 50 },
        { startingBalance: 500, monthlyRate: 0.01, minPayment: 50 },
      ];
      const res = debtAvalanche(debts);
      const firstPayoff = res.details.find(d => d.id === 1).payoffMonth;
      const secondPayoff = res.details.find(d => d.id === 2).payoffMonth;
      expect(firstPayoff).toBeLessThan(secondPayoff);
    });
  });
  