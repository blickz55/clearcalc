document.addEventListener('DOMContentLoaded', () => {

  //
  // --- Credit Card Payoff Calculator ---
  //
  const balanceInput = document.getElementById('balance');
  const aprInput     = document.getElementById('apr');
  const paymentInput = document.getElementById('payment');
  const calcBtn      = document.getElementById('calculateBtn');
  const resultsDiv   = document.getElementById('results');

  if (calcBtn) {
    calcBtn.addEventListener('click', () => {
      resultsDiv.innerHTML = '';
      const balance = parseFloat(balanceInput.value);
      const apr     = parseFloat(aprInput.value);
      const payment = parseFloat(paymentInput.value);

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

      const monthlyRate  = apr / 100 / 12;
      let remaining      = balance;
      let totalInterest  = 0;
      let months         = 0;
      const maxMonths    = 1000;

      while (remaining > 0 && months < maxMonths) {
        const interestThisMonth = remaining * monthlyRate;
        totalInterest  += interestThisMonth;
        remaining       = remaining + interestThisMonth - payment;
        months++;
        if (remaining > balance) break;  // payment too low
      }

      if (months >= maxMonths || remaining > 0) {
        resultsDiv.innerHTML = `
          <p class="error">
            With that payment, balance won’t be paid off. Try a higher payment.
          </p>`;
      } else {
        resultsDiv.innerHTML = `
          <p>It will take <strong>${months}</strong> month${months===1?'':'s'} to pay off your balance.</p>
          <p>Total interest paid: <strong>$${totalInterest.toFixed(2)}</strong></p>
        `;
      }
    });
  }

  //
  // --- Debt Snowball Calculator ---
  //
  const snowballForm   = document.getElementById('snowballForm');
  const snowballOutput = document.getElementById('snowballResults');

  if (snowballForm) {
    snowballForm.addEventListener('submit', e => {
      e.preventDefault();
      snowballOutput.innerHTML = '';

      // Collect and filter debts
      const entries = Array.from(snowballForm.querySelectorAll('.debt-entry'));
      const debts = entries.map((entry, idx) => {
        const bal  = parseFloat(entry.querySelector('input[name="balance"]').value);
        const apr  = parseFloat(entry.querySelector('input[name="apr"]').value);
        const minP = parseFloat(entry.querySelector('input[name="minPayment"]').value);
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

      if (debts.length === 0) {
        snowballOutput.innerHTML = '<p class="error">Enter at least one debt with balance & payment.</p>';
        return;
      }

      // Sort by smallest balance first
      const order = debts.slice().sort((a,b) => a.startingBalance - b.startingBalance);
      let month = 0, MAX = 600;

      // Simulation
      while (debts.some(d => d.balance > 0.01) && month < MAX) {
        month++;
        debts.forEach(d => {
          if (d.balance > 0) {
            const i = d.balance * d.monthlyRate;
            d.balance     += i;
            d.interestPaid += i;
          }
        });
        const freed = debts
          .filter(d => d.balance <= 0.01)
          .reduce((sum,d) => sum + d.minPayment, 0);

        const target = order.find(d => d.balance > 0.01);

        debts.forEach(d => {
          if (d.balance > 0) {
            const pay = d.minPayment + (d === target ? freed : 0);
            d.balance -= pay;
            if (d.balance <= 0) {
              d.balance = 0;
              d.payoffMonth = month;
            }
          }
        });
      }

      // Render results
      if (month >= MAX) {
        snowballOutput.innerHTML = '<p class="error">Debts not paid off in reasonable time. Try higher payments.</p>';
      } else {
        const totalInt = debts.reduce((sum,d) => sum + d.interestPaid, 0).toFixed(2);
        let html = `<p><strong>All debts paid in ${month} months</strong></p>`;
        html += `<p>Total interest paid: $${totalInt}</p>`;
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
