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
  // ──────────────────────────────
  // Credit‑Card Payoff Form
  // ──────────────────────────────
  const payoffForm    = document.getElementById('payoffForm');
  const payoffResults = document.getElementById('payoffResults');

  if (payoffForm) {
    payoffForm.addEventListener('submit', e => {
      e.preventDefault();

      const balance = parseFloat(payoffForm.balance.value);
      const apr     = parseFloat(payoffForm.apr.value);
      const payment = parseFloat(payoffForm.payment.value);

      // basic validation
      if (isNaN(balance) || isNaN(apr) || isNaN(payment) || payment <= 0) {
        payoffResults.innerHTML = '<p class="error">Please enter valid numbers for all fields.</p>';
        return;
      }

      // check that payment actually exceeds first month’s interest
      const monthlyRate      = apr / 1200;
      const firstMonthInterest = balance * monthlyRate;
      if (payment <= firstMonthInterest) {
        payoffResults.innerHTML = `
          <p class="error">
            Your payment of <strong>${formatCurrency(payment)}</strong> is not enough 
            to cover the first month’s interest of <strong>${formatCurrency(firstMonthInterest)}</strong>.<br>
            Please increase your monthly payment above your monthly interest.
          </p>
        `;
        return;
      }

      // perform the payoff calculation
      const { months, totalInterest } = creditCardPayoff(balance, apr, payment);
      const totalPaid = months * payment;

      payoffResults.innerHTML = `
        <p>
          It will take <strong>${months}</strong> month${months === 1 ? '' : 's'} to pay off your balance.<br>
          Total interest paid: <strong>${formatCurrency(totalInterest)}</strong><br>
          Total amount paid: <strong>${formatCurrency(totalPaid)}</strong>
        </p>
      `;
    });
  }

  // ──────────────────────────────
  // Debt‑Snowball Form (unchanged)
  // ──────────────────────────────
  const snowballForm    = document.getElementById('snowballForm');
  const snowballResults = document.getElementById('snowballResults');

  if (snowballForm) {
    snowballForm.addEventListener('submit', e => {
      e.preventDefault();
      const entries = Array.from(
        document.querySelectorAll('.debt-entry')
      ).map((row, i) => {
        const bal  = parseFloat(row.querySelector('input[name="balance"]').value);
        const apr  = parseFloat(row.querySelector('input[name="apr"]').value);
        const minP = parseFloat(row.querySelector('input[name="minPayment"]').value);
        return isNaN(bal) || isNaN(apr) || isNaN(minP)
          ? null
          : { id: i + 1, startingBalance: bal, monthlyRate: apr / 1200, minPayment: minP };
      }).filter(x => x);

      if (!entries.length) {
        snowballResults.innerHTML = '<p class="error">Please enter at least one valid debt.</p>';
        return;
      }

      const { months, totalInterest, details } = debtSnowball(entries);
      snowballResults.innerHTML = `
        <p>
          All debts paid in <strong>${months}</strong> month${months===1?'':'s'}<br>
          Total interest paid: <strong>${formatCurrency(totalInterest)}</strong>
        </p>
        <ul>
          ${details
            .map(d => `<li>Debt ${d.id}: ${d.payoffMonth} mo, interest ${formatCurrency(d.interestPaid)}</li>`)
            .join('')}
        </ul>
      `;
    });
  }

  // ──────────────────────────────
  // Debt‑Avalanche Form (unchanged)
  // ──────────────────────────────
  const avalancheForm    = document.getElementById('avalancheForm');
  const avalancheResults = document.getElementById('avalancheResults');

  if (avalancheForm) {
    avalancheForm.addEventListener('submit', e => {
      e.preventDefault();
      const entries = Array.from(
        document.querySelectorAll('.debt-entry')
      ).map((row, i) => {
        const bal  = parseFloat(row.querySelector('input[name="balance"]').value);
        const apr  = parseFloat(row.querySelector('input[name="apr"]').value);
        const minP = parseFloat(row.querySelector('input[name="minPayment"]').value);
        return isNaN(bal) || isNaN(apr) || isNaN(minP)
          ? null
          : { id: i + 1, startingBalance: bal, monthlyRate: apr / 1200, minPayment: minP };
      }).filter(x => x);

      if (!entries.length) {
        avalancheResults.innerHTML = '<p class="error">Please enter at least one valid debt.</p>';
        return;
      }

      const { months, totalInterest, details } = debtAvalanche(entries);
      avalancheResults.innerHTML = `
        <p>
          All debts paid in <strong>${months}</strong> month${months===1?'':'s'}<br>
          Total interest paid: <strong>${formatCurrency(totalInterest)}</strong>
        </p>
        <ul>
          ${details
            .map(d => `<li>Debt ${d.id}: ${d.payoffMonth} mo, interest ${formatCurrency(d.interestPaid)}</li>`)
            .join('')}
        </ul>
      `;
    });
  }
});
