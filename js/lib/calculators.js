// js/lib/calculators.js

// Credit‐card payoff (now returns schedule)
export function creditCardPayoff(balance, apr, payment) {
    const monthlyRate = apr / 1200;
    let months = 0;
    let interest = 0;
    let bal = balance;
    const schedule = [balance];
  
    while (bal > 0) {
      const monthlyInterest = bal * monthlyRate;
      interest += monthlyInterest;
      bal = bal + monthlyInterest - payment;
      months++;
      schedule.push(Math.max(bal, 0));
      if (months > 1000) break; // safety valve
    }
  
    return { 
      months, 
      totalInterest: interest, 
      schedule 
    };
  }
  
  // Debt‐snowball
  export function debtSnowball(debts) {
    let totalInterest = 0;
    let month = 0;
    const details = [];
  
    // clone & sort by startingBalance
    const queue = debts
      .map(d => ({ ...d }))
      .sort((a, b) => a.startingBalance - b.startingBalance);
  
    while (queue.length) {
      month++;
      // pay minimum on all but first
      queue.slice(1).forEach(d => {
        d.startingBalance += d.startingBalance * d.monthlyRate - d.minPayment;
        totalInterest += d.startingBalance * d.monthlyRate;
      });
  
      // pay everything you can at first
      const primary = queue[0];
      const avail = queue.reduce((sum, d) => sum + d.minPayment, 0);
      primary.startingBalance += primary.startingBalance * primary.monthlyRate - avail;
      totalInterest += primary.startingBalance * primary.monthlyRate;
  
      if (primary.startingBalance <= 0) {
        details.push({ 
          id: primary.id, 
          payoffMonth: month, 
          interestPaid: totalInterest 
        });
        queue.shift();
      }
    }
  
    return {
      months: month,
      totalInterest,
      details
    };
  }
  
  // Debt‐avalanche
  export function debtAvalanche(debts) {
    let totalInterest = 0;
    let month = 0;
    const details = [];
  
    // clone & sort by monthlyRate descending
    const queue = debts
      .map(d => ({ ...d }))
      .sort((a, b) => b.monthlyRate - a.monthlyRate);
  
    while (queue.length) {
      month++;
      // pay min on all but first
      queue.slice(1).forEach(d => {
        d.startingBalance += d.startingBalance * d.monthlyRate - d.minPayment;
        totalInterest += d.startingBalance * d.monthlyRate;
      });
  
      // pay everything you can at first
      const primary = queue[0];
      const avail = queue.reduce((sum, d) => sum + d.minPayment, 0);
      primary.startingBalance += primary.startingBalance * primary.monthlyRate - avail;
      totalInterest += primary.startingBalance * primary.monthlyRate;
  
      if (primary.startingBalance <= 0) {
        details.push({ 
          id: primary.id, 
          payoffMonth: month, 
          interestPaid: totalInterest 
        });
        queue.shift();
      }
    }
  
    return {
      months: month,
      totalInterest,
      details
    };
  }
  