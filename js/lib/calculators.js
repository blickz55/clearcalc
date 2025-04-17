// js/lib/calculators.js

/**
 * Returns { months, totalInterest } for fixed‐payment payoff.
 */
export function creditCardPayoff(balance, apr, payment) {
    const monthlyRate = apr / 100 / 12;
    let remaining    = balance;
    let totalInterest = 0;
    let months        = 0;
    const maxMonths   = 1000;
  
    while (remaining > 0 && months < maxMonths) {
      const interestThisMonth = remaining * monthlyRate;
      totalInterest += interestThisMonth;
      remaining = remaining + interestThisMonth - payment;
      months++;
      if (remaining > balance) break;
    }
  
    if (months >= maxMonths || remaining > 0) {
      return null; // signal “never pays off”
    }
    return { months, totalInterest };
  }
  
  
  /**
   * Generic snowball & avalanche runner.
   *
   * @param debts array of { startingBalance, monthlyRate, minPayment }
   * @param pickNext function(debts)->debt to apply freed payment to
   * @returns { months, totalInterest, details: Array<{id,payoffMonth,interestPaid}> }
   */
  export function runDebtStrategy(debts, pickNext) {
    // clone debts
    const ds = debts.map((d,i)=>({
      id: i+1,
      balance: d.startingBalance,
      monthlyRate: d.monthlyRate,
      minPayment: d.minPayment,
      interestPaid: 0,
      payoffMonth: 0
    }));
    let month=0, MAX=600;
    while (ds.some(d=>d.balance>0.01) && month<MAX) {
      month++;
      ds.forEach(d=>{
        if (d.balance>0) {
          const i = d.balance * d.monthlyRate;
          d.balance += i;
          d.interestPaid += i;
        }
      });
      const freed = ds.filter(d=>d.balance<=0.01)
                      .reduce((sum,d)=>sum+d.minPayment,0);
      const target = pickNext(ds);
      ds.forEach(d=>{
        if (d.balance>0) {
          d.balance -= d.minPayment + (d===target?freed:0);
          if (d.balance<=0) {
            d.balance=0;
            d.payoffMonth=month;
          }
        }
      });
    }
    if (month>=MAX) return null;
    const totalInterest = ds.reduce((s,d)=>s+d.interestPaid,0);
    return {
      months: month,
      totalInterest,
      details: ds.map(d=>({ id:d.id, payoffMonth:d.payoffMonth, interestPaid:d.interestPaid }))
    };
  }
  
  export function debtSnowball(debts) {
    return runDebtStrategy(debts, ds =>
      [...ds].sort((a,b)=>a.balance-b.balance).find(d=>d.balance>0.01)
    );
  }
  
  export function debtAvalanche(debts) {
    return runDebtStrategy(debts, ds =>
      [...ds].sort((a,b)=>b.monthlyRate-a.monthlyRate).find(d=>d.balance>0.01)
    );
  }
  