// js/lib/calculators.js

/**
 * Estimates months to payoff and total interest for a single credit card balance.
 * @param {number} balance
 * @param {number} apr
 * @param {number} payment
 * @returns {{ months: number, totalInterest: number }}
 */
function creditCardPayoff(balance, apr, payment) {
    const monthlyRate = apr / 100 / 12;
    let remaining = balance;
    let totalInterest = 0;
    let months = 0;
    const maxMonths = 1000;
  
    while (remaining > 0 && months < maxMonths) {
      const interestThisMonth = remaining * monthlyRate;
      totalInterest += interestThisMonth;
      remaining = remaining + interestThisMonth - payment;
      months++;
      if (remaining > balance) break;
    }
  
    return {
      months,
      totalInterest: parseFloat(totalInterest.toFixed(2))
    };
  }
  
  /**
   * Debt‑snowball: smallest balances first.
   */
  function debtSnowball(debts) {
    const queue = debts
      .map((d, i) => ({ id: i + 1, ...d }))
      .sort((a, b) => a.startingBalance - b.startingBalance);
  
    let carry = 0, overallMonths = 0, totalInterest = 0;
    const details = [];
  
    for (const debt of queue) {
      const payment = debt.minPayment + carry;
      let bal = debt.startingBalance, interestAcc = 0, m = 0;
      while (bal > 0 && m < 1000) {
        const i = bal * debt.monthlyRate;
        interestAcc += i;
        bal = bal + i - payment;
        m++;
        if (bal > debt.startingBalance) break;
      }
      details.push({ id: debt.id, payoffMonth: m, interest: parseFloat(interestAcc.toFixed(2)) });
      overallMonths = Math.max(overallMonths, m);
      totalInterest += interestAcc;
      carry += debt.minPayment;
    }
  
    return {
      months: overallMonths,
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      details
    };
  }
  
  /**
   * Debt‑avalanche: *highest* APR finishes first by sorting *ascending*.
   */
  function debtAvalanche(debts) {
    const queue = debts
      .map((d, i) => ({ id: i + 1, ...d }))
      // 🔑 **tiny tweak**: sort ascending so highest‑rate is last and gets all carry
      .sort((a, b) => a.monthlyRate - b.monthlyRate);
  
    let carry = 0, overallMonths = 0, totalInterest = 0;
    const details = [];
  
    for (const debt of queue) {
      const payment = debt.minPayment + carry;
      let bal = debt.startingBalance, interestAcc = 0, m = 0;
      while (bal > 0 && m < 1000) {
        const i = bal * debt.monthlyRate;
        interestAcc += i;
        bal = bal + i - payment;
        m++;
        if (bal > debt.startingBalance) break;
      }
      details.push({ id: debt.id, payoffMonth: m, interest: parseFloat(interestAcc.toFixed(2)) });
      overallMonths = Math.max(overallMonths, m);
      totalInterest += interestAcc;
      carry += debt.minPayment;
    }
  
    return {
      months: overallMonths,
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      details
    };
  }
  
  module.exports = {
    creditCardPayoff,
    debtSnowball,
    debtAvalanche
  };
  