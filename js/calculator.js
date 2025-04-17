// this file assumes calculators.js (with creditCardPayoff, debtSnowball, debtAvalanche) is already loaded
document.addEventListener('DOMContentLoaded', () => {
  //
  // CREDIT CARD PAYOFF (no changes from before)
  //
  const creditForm = document.getElementById('creditForm');
  if (creditForm) {
    const out = document.getElementById('creditResults');
    creditForm.addEventListener('submit', e => {
      e.preventDefault();
      out.innerHTML = '';
      const b = parseFloat(creditForm.balance.value);
      const r = parseFloat(creditForm.apr.value);
      const p = parseFloat(creditForm.payment.value);
      if (!b || !r || !p) {
        out.innerHTML = '<p class="error">Please fill in all fields.</p>';
        return;
      }
      const res = creditCardPayoff(b, r, p);
      out.innerHTML = `
        <p>It will take <strong>${res.months}</strong> month${res.months===1?'':'s'} to pay off your balance.</p>
        <p>Total interest paid: <strong>$${res.totalInterest.toFixed(2)}</strong></p>
      `;
    });
  }

  //
  // GENERIC “ADD ANOTHER DEBT” HELPER
  //
  function addDebt(formSelector) {
    const container = document.querySelector(`${formSelector} .debt-entries`);
    const count = container.querySelectorAll('.debt-entry').length + 1;
    const entry = document.createElement('div');
    entry.className = 'debt-entry';
    entry.innerHTML = `
      <label>Debt ${count} Balance ($):
        <input type="number" name="balance" placeholder="e.g. 2000" required>
      </label>
      <label>APR (%):
        <input type="number" step="0.01" name="apr" placeholder="e.g. 18.99" required>
      </label>
      <label>Min Payment ($):
        <input type="number" name="minPayment" placeholder="e.g. 50" required>
      </label>
    `;
    container.appendChild(entry);
  }

  //
  // DEBT SNOWBALL
  //
  const snowballForm = document.getElementById('snowballForm');
  if (snowballForm) {
    document.getElementById('addDebtSnowball')
      .addEventListener('click', () => addDebt('#snowballForm'));

    snowballForm.addEventListener('submit', e => {
      e.preventDefault();
      const out = document.getElementById('snowballResults');
      out.innerHTML = '';

      // gather data
      const entries = Array.from(snowballForm.querySelectorAll('.debt-entry'));
      const debts = entries
        .map((ent,i) => {
          const b = parseFloat(ent.balance.value);
          const a = parseFloat(ent.apr.value);
          const m = parseFloat(ent.minPayment.value);
          return { id: i+1, startingBalance: b, monthlyRate: a/100/12, minPayment: m };
        })
        .filter(d => d.startingBalance>0 && d.monthlyRate>0 && d.minPayment>0);

      if (!debts.length) {
        out.innerHTML = '<p class="error">Please enter at least one valid debt.</p>';
        return;
      }

      // compute
      const res = debtSnowball(debts);

      // render
      let html = `<p><strong>All debts paid in ${res.months} month${res.months===1?'':'s'}</strong><br>
                  Total interest paid: $${res.totalInterest.toFixed(2)}</p>
                  <ul>`;
      res.details.forEach(d => {
        html += `<li>Debt ${d.id}: ${d.payoffMonth} mo, interest $${d.interest.toFixed(2)}</li>`;
      });
      html += '</ul>';
      out.innerHTML = html;
    });
  }

  //
  // DEBT AVALANCHE
  //
  const avalancheForm = document.getElementById('avalancheForm');
  if (avalancheForm) {
    document.getElementById('addDebtAvalanche')
      .addEventListener('click', () => addDebt('#avalancheForm'));

    avalancheForm.addEventListener('submit', e => {
      e.preventDefault();
      const out = document.getElementById('avalancheResults');
      out.innerHTML = '';

      const entries = Array.from(avalancheForm.querySelectorAll('.debt-entry'));
      const debts = entries
        .map((ent,i) => {
          const b = parseFloat(ent.balance.value);
          const a = parseFloat(ent.apr.value);
          const m = parseFloat(ent.minPayment.value);
          return { id: i+1, startingBalance: b, monthlyRate: a/100/12, minPayment: m };
        })
        .filter(d => d.startingBalance>0 && d.monthlyRate>0 && d.minPayment>0);

      if (!debts.length) {
        out.innerHTML = '<p class="error">Please enter at least one valid debt.</p>';
        return;
      }

      const res = debtAvalanche(debts);

      let html = `<p><strong>All debts paid in ${res.months} month${res.months===1?'':'s'}</strong><br>
                  Total interest paid: $${res.totalInterest.toFixed(2)}</p>
                  <ul>`;
      res.details.forEach(d => {
        html += `<li>Debt ${d.id}: ${d.payoffMonth} mo, interest $${d.interest.toFixed(2)}</li>`;
      });
      html += '</ul>';
      out.innerHTML = html;
    });
  }
});
