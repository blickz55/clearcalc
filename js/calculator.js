// js/calculator.js
import { creditCardPayoff } from './lib/calculators.js';

function formatCurrency(num) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(num);
}

document.addEventListener('DOMContentLoaded', () => {
  const payoffForm    = document.getElementById('payoffForm');
  const payoffResults = document.getElementById('payoffResults');
  const chartCanvas   = document.getElementById('payoffChart');
  let payoffChart;

  // ← hide the empty chart container on initial load
  chartCanvas.style.display = 'none';

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

    // ensure payment covers at least first month interest
    const monthlyRate        = apr / 1200;
    const firstMonthInterest = balance * monthlyRate;
    if (payment <= firstMonthInterest) {
      payoffResults.innerHTML = `
        <p class="error">
          Your payment of <strong>${formatCurrency(payment)}</strong> is not enough 
          to cover the first month’s interest of <strong>${formatCurrency(firstMonthInterest)}</strong>.<br>
          Please increase your monthly payment.
        </p>`;
      return;
    }

    // build schedule
    const schedule = [];
    let bal    = balance;
    let safety = 0;
    while (bal > 0 && safety++ < 1000) {
      schedule.push(bal);
      const interest = bal * monthlyRate;
      bal = bal + interest - payment;
    }

    // totals
    const { months, totalInterest } = creditCardPayoff(balance, apr, payment);
    const totalPaid = months * payment;

    payoffResults.innerHTML = `
      <p>
        It will take <strong>${months}</strong> month${months === 1 ? '' : 's'} to pay off your balance.<br>
        Total interest paid: <strong>${formatCurrency(totalInterest)}</strong><br>
        Total amount paid: <strong>${formatCurrency(totalPaid)}</strong>
      </p>`;

    // ← reveal the canvas now that we're about to draw
    chartCanvas.style.display = 'block';

    // prepare chart data
    const labels = schedule.map((_, i) => `Mo ${i + 1}`);
    const data   = schedule.map(v => +v.toFixed(2));

    if (payoffChart) {
      payoffChart.data.labels          = labels;
      payoffChart.data.datasets[0].data = data;
      payoffChart.update();
    } else {
      payoffChart = new Chart(chartCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Remaining Balance',
            data,
            fill: true,
            tension: 0.3,
            backgroundColor: 'rgba(0,122,204,0.1)',
            borderColor: 'rgba(0,122,204,1)',
            pointRadius: 0
          }]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          scales: {
            x: {
              display: true,
              title: { display: true, text: 'Month' },
              ticks: { maxTicksLimit: 12 }
            },
            y: {
              ticks: {
                callback: val => formatCurrency(val)
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: ctx => formatCurrency(ctx.parsed.y)
              }
            },
            legend: { display: false }
          }
        }
      });
    }
  });
});
// … your existing imports & credit‑card code …

document.addEventListener('DOMContentLoaded', () => {
  // ───────────────── Debt‑Snowball Form ─────────────────
  const debtContainer    = document.getElementById('debtContainer');
  const addSnowballDebt  = document.getElementById('addSnowballDebt');
  const snowballForm     = document.getElementById('snowballForm');
  const snowballResults  = document.getElementById('snowballResults');
  let debtCount = 0;

  function addDebtRow() {
    debtCount++;
    const row = document.createElement('div');
    row.className = 'debt-entry';
    row.innerHTML = `
      <div class="field">
        <label>Debt ${debtCount} Balance ($):</label>
        <input type="number" name="balance" placeholder="e.g. 2000" required>
      </div>
      <div class="field">
        <label>APR (%):</label>
        <input type="number" step="0.01" name="apr" placeholder="e.g. 18.99" required>
      </div>
      <div class="field">
        <label>Min Payment ($):</label>
        <input type="number" name="minPayment" placeholder="e.g. 50" required>
      </div>
    `;
    debtContainer.append(row);
  }

  // start with 3 debts
  for (let i = 0; i < 3; i++) addDebtRow();
  addSnowballDebt.addEventListener('click', addDebtRow);

  snowballForm.addEventListener('submit', e => {
    e.preventDefault();
    const entries = Array.from(debtContainer.querySelectorAll('.debt-entry'))
      .map((row, idx) => {
        const bal  = parseFloat(row.querySelector('input[name="balance"]').value);
        const apr  = parseFloat(row.querySelector('input[name="apr"]').value);
        const minP = parseFloat(row.querySelector('input[name="minPayment"]').value);
        return isNaN(bal)||isNaN(apr)||isNaN(minP)
          ? null
          : { id: idx+1, startingBalance: bal, monthlyRate: apr/1200, minPayment: minP };
      })
      .filter(x => x);
    if (!entries.length) {
      snowballResults.innerHTML = '<p class="error">Please enter at least one valid debt.</p>';
      return;
    }
    const { months, totalInterest, details } = debtSnowball(entries);
    snowballResults.innerHTML = `
      <p>
        All debts paid in <strong>${months}</strong> month${months===1?'':'s'}.<br>
        Total interest paid: <strong>${formatCurrency(totalInterest)}</strong>
      </p>
      <ul>
        ${details.map(d =>
           `<li>Debt ${d.id}: ${d.payoffMonth} mo, interest ${formatCurrency(d.interestPaid)}</li>`
         ).join('')}
      </ul>
    `;
  });

  // … your avalanche logic follows …
});
