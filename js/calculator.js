// js/calculator.js
import { creditCardPayoff, debtSnowball, debtAvalanche } from './lib/calculators.js';

function formatCurrency(num) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(num);
}

document.addEventListener('DOMContentLoaded', () => {
  // ────────────────────────────────── Credit Card Payoff (unchanged) ──
  // … your existing payoffForm code here …

  // ────────────────────────────────── Debt Snowball ───────────────────
  const snowballForm    = document.getElementById('snowballForm');
  const snowballResults = document.getElementById('snowballResults');
  const debtContainer   = document.getElementById('debtContainer');
  const addSnowBtn      = document.getElementById('addSnowballDebt');

  // Add‐another‐debt handler
  addSnowBtn.addEventListener('click', () => {
    const count = debtContainer.querySelectorAll('.debt-entry').length + 1;
    const div = document.createElement('div');
    div.className = 'debt-entry';
    div.innerHTML = `
      <label>Debt ${count} Balance ($):
        <input type="number" name="balance" placeholder="e.g. 2000" required />
      </label>
      <label>APR (%):
        <input type="number" step="0.01" name="apr" placeholder="e.g. 15.00" required />
      </label>
      <label>Min Payment ($):
        <input type="number" name="minPayment" placeholder="e.g. 50" required />
      </label>
    `;
    debtContainer.append(div);
  });

  // Submission handler
  snowballForm.addEventListener('submit', e => {
    e.preventDefault();

    // collect & validate
    const entries = Array.from(debtContainer.querySelectorAll('.debt-entry'))
      .map((row, i) => {
        const bal  = parseFloat(row.querySelector('input[name="balance"]').value);
        const apr  = parseFloat(row.querySelector('input[name="apr"]').value);
        const minP = parseFloat(row.querySelector('input[name="minPayment"]').value);
        return isNaN(bal) || isNaN(apr) || isNaN(minP)
          ? null
          : { id: i+1, startingBalance: bal, monthlyRate: apr/1200, minPayment: minP };
      })
      .filter(x => x);

    if (!entries.length) {
      snowballResults.innerHTML = '<p class="error">Please enter at least one valid debt.</p>';
      return;
    }

    // compute
    const { months, totalInterest, details } = debtSnowball(entries);

    // render
    snowballResults.innerHTML = `
      <p>
        All debts paid in <strong>${months}</strong> month${months===1?'':'s'}.<br>
        Total interest paid: <strong>${formatCurrency(totalInterest)}</strong>
      </p>
      <ul>
        ${details.map(d =>
          `<li>Debt ${d.id}: ${d.payoffMonth} mo, interest ${formatCurrency(d.interestPaid)}</li>`
        ).join('')}
      </ul>
    `;
  });


  // ────────────────────────────────── Debt Avalanche (unchanged) ────────
  // … your existing avalancheForm code here …
});
