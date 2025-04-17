// js/lib/calculators.js

/**
 * Estimates months to payoff and total interest for a single credit card balance.
 * @param {number} balance  – starting balance in dollars
 * @param {number} apr      – annual percentage rate (e.g. 18.99 for 18.99%)
 * @param {number} payment  – fixed monthly payment in dollars
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
      // if payment doesn't cover interest, bail out
      if (remaining > balance) break;
    }
  
    return {
      months,
      totalInterest: parseFloat(totalInterest.toFixed(2))
    };
  }
  
  /**
   * Debt‑snowball strategy: pay off smallest balances first.
   * @param {Array<{ startingBalance: number, monthlyRate: number, minPayment: number }>} debts
   * @returns {{ months: number, totalInterest: number, details: Array<{id:number,payoffMonth:number,interest:number}> }}
   */
  function debtSnowball(debts) {
    // assign IDs and sort by ascending balance
    const queue = debts
      .map((d, i) => ({ id: i + 1, ...d }))
      .sort((a, b) => a.startingBalance - b.startingBalance);
  
    let carryPayment = 0;
    let overallMonths = 0;
    let totalInterest = 0;
    const details = [];
  
    for (const debt of queue) {
      const payment = debt.minPayment + carryPayment;
      let balance = debt.startingBalance;
      let interestAccrued = 0;
      let months = 0;
  
      while (balance > 0 && months < 1000) {
        const interestThisMonth = balance * debt.monthlyRate;
        interestAccrued += interestThisMonth;
        balance = balance + interestThisMonth - payment;
        months++;
        if (balance > debt.startingBalance) break;
      }
  
      details.push({
        id: debt.id,
        payoffMonth: months,
        interest: parseFloat(interestAccrued.toFixed(2))
      });
  
      overallMonths = Math.max(overallMonths, months);
      totalInterest += interestAccrued;
      carryPayment += debt.minPayment; // roll min‑payment into next debt
    }
  
    return {
      months: overallMonths,
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      details
    };
  }
  
  /**
   * Debt‑avalanche strategy: pay highest‑rate debt first.
   * @param {Array<{ startingBalance: number, monthlyRate: number, minPayment: number }>} debts
   * @returns {{ months: number, totalInterest: number, details: Array<{id:number,payoffMonth:number,interest:number}> }}
   */
  function debtAvalanche(debts) {
    // assign IDs and sort by descending rate (highest APR first)
    const queue = debts
      .map((d, i) => ({ id: i + 1, ...d }))
      .sort((a, b) => b.monthlyRate - a.monthlyRate);
  
    let carryPayment = 0;
    let overallMonths = 0;
    let totalInterest = 0;
    const details = [];
  
    for (const debt of queue) {
      const payment = debt.minPayment + carryPayment;
      let balance = debt.startingBalance;
      let interestAccrued = 0;
      let months = 0;
  
      while (balance > 0 && months < 1000) {
        const interestThisMonth = balance * debt.monthlyRate;
        interestAccrued += interestThisMonth;
        balance = balance + interestThisMonth - payment;
        months++;
        if (balance > debt.startingBalance) break;
      }
  
      details.push({
        id: debt.id,
        payoffMonth: months,
        interest: parseFloat(interestAccrued.toFixed(2))
      });
  
      overallMonths = Math.max(overallMonths, months);
      totalInterest += interestAccrued;
      carryPayment += debt.minPayment;
    }
  
    return {
      months: overallMonths,
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      details
    };
  }
  
  // export as CommonJS
  module.exports = {
    creditCardPayoff,
    debtSnowball,
    debtAvalanche
  };
  