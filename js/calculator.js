document.addEventListener('DOMContentLoaded', () => {
  // --- Debt Snowball Logic ---
  const form   = document.getElementById('snowballForm');
  const output = document.getElementById('snowballResults');

  form.addEventListener('submit', e => {
    e.preventDefault();
    output.innerHTML = '';

    // Gather & filter valid debts
    const rows = Array.from(form.querySelectorAll('.debt-entry'));
    const debts = rows.map((row, i) => {
      const bal  = parseFloat(row.querySelector('input[name="balance"]').value);
      const apr  = parseFloat(row.querySelector('input[name="apr"]').value);
      const minP = parseFloat(row.querySelector('input[name="minPayment"]').value);
      return {
        id: i + 1,
        balance: bal,
        startingBalance: bal,
        monthlyRate: apr > 0 ? apr/100/12 : 0,
        minPayment: minP,
        interestPaid: 0,
        payoffMonth: 0
      };
    }).filter(d => d.balance > 0 && d.minPayment > 0);

    if (!debts.length) {
      output.innerHTML = '<p class="error">Please fill in at least one debt with balance &amp; payment.</p>';
      return;
    }

    // Sort by smallest balance first
    const order = [...debts].sort((a,b) => a.startingBalance - b.startingBalance);
    let month = 0, MAX = 600;

    // Simulation loop
    while (debts.some(d => d.balance > 0.01) && month < MAX) {
      month++;
      // Accrue interest
      debts.forEach(d => {
        if (d.balance > 0) {
          const interest = d.balance * d.monthlyRate;
          d.balance     += interest;
          d.interestPaid += interest;
        }
      });
      // Freed up payment from paid debts
      const freed = debts
        .filter(d => d.balance <= 0.01)
        .reduce((sum, d) => sum + d.minPayment, 0);

      // Target current debt
      const target = order.find(d => d.balance > 0.01);

      // Apply payments
      debts.forEach(d => {
        if (d.balance > 0) {
          let pay = d.minPayment + (d === target ? freed : 0);
          d.balance -= pay;
          if (d.balance <= 0) {
            d.balance = 0;
            d.payoffMonth = month;
          }
        }
      });
    }

    // Output results
    if (month >= MAX) {
      output.innerHTML = '<p class="error">Debts not paid off within a reasonable time. Try higher payments.</p>';
    } else {
      const totalInt = debts.reduce((sum,d) => sum + d.interestPaid, 0).toFixed(2);
      let html = `<p><strong>All debts paid in ${month} months</strong></p>`;
      html += `<p>Total interest paid: $${totalInt}</p>`;
      html += '<h3>Payoff Details:</h3><ul>';
      debts.forEach(d => {
        html += `<li>Debt ${d.id}: ${d.payoffMonth} mo, interest $${d.interestPaid.toFixed(2)}</li>`;
      });
      html += '</ul>';
      output.innerHTML = html;
    }
  });
});
