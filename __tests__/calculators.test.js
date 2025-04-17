// __tests__/calculators.test.js
import { creditCardPayoff, debtSnowball, debtAvalanche } from '../js/lib/calculators';

test('creditCardPayoff basic', () => {
  const res = creditCardPayoff(1000, 12, 100);
  expect(res).not.toBeNull();
  expect(res.months).toBeGreaterThan(0);
  expect(res.totalInterest).toBeGreaterThan(0);
});

test('snowball with single debt', () => {
  const debts = [{ startingBalance: 500, monthlyRate: 0.01, minPayment: 50 }];
  const res = debtSnowball(debts);
  expect(res.months).toBeGreaterThan(0);
  expect(res.details[0].id).toBe(1);
});

test('avalanche picks highest APR first', () => {
  const debts = [
    { startingBalance: 500, monthlyRate: 0.02, minPayment: 50 },
    { startingBalance: 500, monthlyRate: 0.01, minPayment: 50 },
  ];
  const res = debtAvalanche(debts);
  // higher-rate debt should pay off first
  expect(res.details.find(d=>d.id===1).payoffMonth)
    .toBeLessThan(res.details.find(d=>d.id===2).payoffMonth);
});
