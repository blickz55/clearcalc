// js/calculator.js

document.addEventListener('DOMContentLoaded', function() {
  // --- Credit Card Payoff Calculator ---
  const balanceInput = document.getElementById('balance');
  const aprInput     = document.getElementById('apr');
  const paymentInput = document.getElementById('payment');
  const calcBtn      = document.getElementById('calculateBtn');
  const resultsDiv   = document.getElementById('results');

  calcBtn.addEventListener('click', function() {
    // Clear previous results
    resultsDiv.innerHTML = '';

    // Parse inputs
    const balance = parseFloat(balanceInput.value);
    const apr     = parseFloat(aprInput.value);
    const payment = parseFloat(paymentInput.value);

    // Validate
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

    // Calculation
    const monthlyRate = apr / 100 / 12;
    let remaining    = balance;
    let totalInterest = 0;
    let months        = 0;
    const maxMonths   = 1000; // safety to avoid infinite loop

    while (remaining > 0 && months < maxMonths) {
      const interestThisMonth = remaining * monthlyRate;
      totalInterest += interestThisMonth;
      remaining = remaining + interestThisMonth - payment;
      months++;
      // If payment doesn't even cover the interest, break
      if (remaining > balance) {
        break;
      }
    }

    // Render results
    if (months >= maxMonths || remaining > 0) {
      resultsDiv.innerHTML = `
        <p class="error">
          With the given payment amount, your balance will not be paid off.
          Try increasing your monthly payment.
        </p>`;
    } else {
      resultsDiv.innerHTML = `
        <p>It will take <strong>${months}</strong> month${months === 1 ? '' : 's'} to pay off your balance.</p>
        <p>Total interest paid: <strong>$${totalInterest.toFixed(2)}</strong></p>
      `;
    }
  });  // ← end of payoff listener

  // --- Debt Snowball Calculator ---
  const snowballForm   = document.getElementById('snowballForm');
  const snowballOutput = document.getElementById('snowballResults');

  snowballForm.addEventListener('submit', function(e) {
    e.preventDefault();
    snowballOutput.innerHTML = '';

    // Gather debts
    const entries = Array.from(snowballForm.querySelectorAll('.debt-entry'));
    const debts = entries.map((entry, idx) => {
      const bal  = parseFloat(entry.querySelector('input[name="balance"]').value);
      const apr  = parseFloat(entry.querySelector('input[name="apr"]').value);
      const minP = parseFloat(entry.querySelector('input[name="minPayment"]').value);
      return {
        id: idx + 1,
        startingBalance: bal,
        balance: bal,
        monthlyRate: apr / 100 / 12,
        minPayment: minP,
        interestPaid: 0,
        payoffMonth: null
      };
    });

    // Basic validation
    for (const d of debts) {
      if (d.balance <= 0 || d.minPayment <= 0) {
        snowballOutput.innerHTML = '<p class="error">All balances and payments must be greater than 0.</p>';
        return;
      }
    }

    // Determine snowball order (smallest starting balance first)
    const order = debts.slice().sort((a, b) => a.startingBalance - b.startingBalance);
    const totalMin = debts.reduce((sum, d) => sum + d.minPayment, 0);

    let month = 0;
    const maxMonths = 600;

    // Run simulation
    while (debts.some(d => d.balance > 0.01) && month < maxMonths) {
      month++;

      // 1) Accrue interest
      debts.forEach(d => {
        if (d.balance > 0) {
          const interest = d.balance * d.monthlyRate;
          d.balance     += interest;
          d.interestPaid += interest;
        }
      });

      // 2) Calculate freed-up payment from paid-off debts
      const freedPayment = debts
        .filter(d => d.balance <= 0.01)
        .reduce((sum, d) => sum + d.minPayment, 0);

      // 3) Find current target (first unpaid in the snowball order)
      const target = order.find(d => d.balance > 0.01);

      // 4) Apply payments
      debts.forEach(d => {
        if (d.balance > 0) {
          let payment = d.minPayment;
          if (d === target) payment += freedPayment;
          d.balance -= payment;
          if (d.balance <= 0) {
            d.balance = 0;
            if (!d.payoffMonth) d.payoffMonth = month;
          }
        }
      });
    }

    // Render results
    if (month >= maxMonths) {
      snowballOutput.innerHTML = '<p class="error">Balance not paid off in a reasonable time. Try higher payments.</p>';
    } else {
      const totalInterest = debts
        .reduce((sum, d) => sum + d.interestPaid, 0)
        .toFixed(2);

      let html = `<p>All debts paid off in <strong>${month}</strong> months.</p>`;
      html += `<p>Total interest paid: <strong>$${totalInterest}</strong></p>`;
      html += '<h3>Payoff Schedule:</h3><ul>';
      debts.forEach(d => {
        html += `<li>Debt ${d.id}: paid in ${d.payoffMonth} mo; interest: $${d.interestPaid.toFixed(2)}</li>`;
      });
      html += '</ul>';
      snowballOutput.innerHTML = html;
    }
  });  // ← end of snowball listener

});  // ← end of DOMContentLoaded
