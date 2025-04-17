document.addEventListener('DOMContentLoaded', function() {
  //
  // --- Credit Card Payoff Calculator ---
  //
  const balanceInput = document.getElementById('balance');
  const aprInput     = document.getElementById('apr');
  const paymentInput = document.getElementById('payment');
  const calcBtn      = document.getElementById('calculateBtn');
  const resultsDiv   = document.getElementById('results');

  calcBtn.addEventListener('click', function() {
    resultsDiv.innerHTML = '';
    const balance = parseFloat(balanceInput.value);
    const apr     = parseFloat(aprInput.value);
    const payment = parseFloat(paymentInput.value);

    // Validation
    if (isNaN(balance) || balance <= 0) {
      resultsDiv.innerHTML = '<p class="error">Please enter a valid balance.</p>';
      return;
    }
    if (isNaN(apr) || apr <= 0) {
      resultsDiv.innerHTML = '<p class="error">Please enter a valid interest rate.</p>';
      return;
    }
    if (isNaN(payment) || payment <= 0) {
      resultsDiv.innerHTML = '<p class="error">Please enter a valid monthly payment.</p>';
      return;
    }

    // Amortization simulation
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
      // guard against non‑amortizing payments
      if (remaining > balance) break;
    }

    // Render
    if (months >= maxMonths || remaining > 0) {
      resultsDiv.innerHTML = `
        <p class="error">
          With that payment amount, the balance will not be paid off.
          Try increasing your monthly payment.
        </p>`;
    } else {
      resultsDiv.innerHTML = `
        <p>It will take <strong>${months}</strong> month${months===1?'':'s'} to pay off your balance.</p>
        <p>Total interest paid: <strong>$${totalInterest.toFixed(2)}</strong></p>
      `;
    }
  });

  //
  // --- Debt Snowball Calculator ---
  //
  const snowballForm   = document.getElementById('snowballForm');
  const snowballOutput = document.getElementById('snowballResults');

  if (snowballForm) {
    snowballForm.addEventListener('submit', function(e) {
      e.preventDefault();
      snowballOutput.innerHTML = '';

      // Gather & filter valid debts
      const rows = Array.from(snowballForm.querySelectorAll('.debt-entry'));
      const debts = rows.map((row, idx) => {
        const bal  = parseFloat(row.querySelector('input[name="balance"]').value);
        const apr  = parseFloat(row.querySelector('input[name="apr"]').value);
        const minP = parseFloat(row.querySelector('input[name="minPayment"]').value);
        return {
          id: idx + 1,
          startingBalance: bal,
          balance: bal,
          monthlyRate: apr > 0 ? apr/100/12 : 0,
          minPayment: minP,
          interestPaid: 0,
          payoffMonth: 0
        };
      }).filter(d => d.balance > 0 && d.minPayment > 0);

      if (!debts.length) {
        snowballOutput.innerHTML = '<p class="error">Fill in at least one debt with a balance & payment.</p>';
        return;
      }

      // Sort smallest-first
      const order = debts.slice().sort((a,b) => a.startingBalance - b.startingBalance);
      let month = 0, MAX = 600;

      // Simulate
      while (debts.some(d => d.balance > 0.01) && month < MAX) {
        month++;
        debts.forEach(d => {
          if (d.balance > 0) {
            const i = d.balance * d.monthlyRate;
            d.balance += i;
            d.interestPaid += i;
          }
        });
        const freed = debts.filter(d => d.balance <= 0.01)
                           .reduce((sum,d) => sum + d.minPayment, 0);
        const target = order.find(d => d.balance > 0.01);
        debts.forEach(d => {
          if (d.balance > 0) {
            let pay = d.minPayment + (d===target?freed:0);
            d.balance -= pay;
            if (d.balance <= 0) {
              d.balance = 0;
              d.payoffMonth = month;
            }
          }
        });
      }

      // Render
      if (month >= MAX) {
        snowballOutput.innerHTML = '<p class="error">Not paid off in a reasonable time.</p>';
      } else {
        const totalI = debts.reduce((sum,d)=>sum+d.interestPaid,0).toFixed(2);
        let html = `<p><strong>All debts paid in ${month} months</strong></p>`;
        html += `<p>Total interest paid: $${totalI}</p>`;
        html += '<h3>Payoff Details:</h3><ul>';
        debts.forEach(d => {
          html += `<li>Debt ${d.id}: ${d.payoffMonth} mo, interest $${d.interestPaid.toFixed(2)}</li>`;
        });
        html += '</ul>';
        snowballOutput.innerHTML = html;
      }
    });
  }
});
