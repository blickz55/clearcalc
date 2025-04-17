// js/calculator.js
import {
  creditCardPayoff,
  debtSnowball,
  debtAvalanche
} from './lib/calculators.js';

function formatCurrency(num) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(num);
}

document.addEventListener('DOMContentLoaded', () => {
  //
  // ── CREDIT‑CARD PAYOFF ───────────────────────────────────────────────
  //
  const payoffForm    = document.getElementById('payoffForm');
  if (payoffForm) {
    const payoffResults = document.getElementById('payoffResults');
    const chartCanvas   = document.getElementById('payoffChart');
    let payoffChart;

    payoffForm.addEventListener('submit', e => {
      e.preventDefault();

      const balance = parseFloat(payoffForm.balance.value);
      const apr     = parseFloat(payoffForm.apr.value);
      const payment = parseFloat(payoffForm.payment.value);

      // validation
      if (isNaN(balance) || isNaN(apr) || isNaN(payment) || payment <= 0) {
        payoffResults.innerHTML = '<p class="error">Please enter valid numbers for all fields.</p>';
        return;
      }

      const monthlyRate        = apr / 1200;
      const firstMonthInterest = balance * monthlyRate;
      if (payment <= firstMonthInterest) {
        payoffResults.innerHTML = `
          <p class="error">
            Your payment of <strong>${formatCurrency(payment)}</strong> is not enough to cover 
            the first month’s interest of <strong>${formatCurrency(firstMonthInterest)}</strong>.
          </p>`;
        return;
      }

      // build the amortization schedule
      const schedule = [];
      let bal = balance, guard = 0;
      while (bal > 0 && guard++ < 1000) {
        schedule.push(bal);
        const interest = bal * monthlyRate;
        bal = bal + interest - payment;
      }

      // totals
      const { months, totalInterest } = creditCardPayoff(balance, apr, payment);
      const totalPaid = months * payment;

      payoffResults.innerHTML = `
        <p>
          It will take <strong>${months}</strong> month${months===1?'':'s'} to pay off your balance.<br>
          Total interest paid: <strong>${formatCurrency(totalInterest)}</strong><br>
          Total amount paid: <strong>${formatCurrency(totalPaid)}</strong>
        </p>`;

      // render/update Chart.js
      if (chartCanvas) {
        const labels = schedule.map((_, i) => `Mo ${i+1}`);
        const data   = schedule.map(v => +v.toFixed(2));

        if (payoffChart) {
          payoffChart.data.labels = labels;
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
                x: { display: false },
                y: {
                  ticks: { callback: val => formatCurrency(val) }
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
      }
    });
  }

  //
  // ── DEBT‑SNOWBALL ─────────────────────────────────────────────────────
  //
  const snowballForm    = document.getElementById('snowballForm');
  if (snowballForm) {
    const debtContainer  = document.getElementById('debtContainer');
    const addDebtBtn     = document.getElementById('addSnowballDebt');
    const snowballResults= document.getElementById('snowballResults');
    let count = debtContainer.querySelectorAll('.debt-entry').length || 3;

    // dynamic +Add another debt
    addDebtBtn.addEventListener('click', () => {
      if (count >= 10) return;
      count++;
      const div = document.createElement('div');
      div.className = 'debt-entry';
      div.innerHTML = `
        <label>Debt ${count} Balance ($):
          <input name="balance" type="number" placeholder="e.g. 1000">
        </label>
        <label>APR (%):
          <input name="apr" type="number" step="0.01" placeholder="e.g. 12.00">
        </label>
        <label>Min Payment ($):
          <input name="minPayment" type="number" placeholder="e.g. 25">
        </label>`;
      debtContainer.append(div);
    });

    snowballForm.addEventListener('submit', e => {
      e.preventDefault();
      const entries = Array.from(
        debtContainer.querySelectorAll('.debt-entry')
      )
      .map((row,i) => {
        const b = parseFloat(row.querySelector('input[name="balance"]').value);
        const a = parseFloat(row.querySelector('input[name="apr"]').value);
        const m = parseFloat(row.querySelector('input[name="minPayment"]').value);
        return (isNaN(b)||isNaN(a)||isNaN(m))
          ? null
          : { id:i+1, startingBalance:b, monthlyRate:a/1200, minPayment:m };
      })
      .filter(x => x);

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
          ${details.map(d=>
            `<li>Debt ${d.id}: ${d.payoffMonth} mo, interest ${formatCurrency(d.interestPaid)}</li>`
          ).join('')}
        </ul>`;
    });
  }

  //
  // ── DEBT‑AVALANCHE ────────────────────────────────────────────────────
  //
  const avalancheForm    = document.getElementById('avalancheForm');
  if (avalancheForm) {
    const avalancheResults = document.getElementById('avalancheResults');
    avalancheForm.addEventListener('submit', e => {
      e.preventDefault();
      const entries = Array.from(
        document.querySelectorAll('.debt-entry')
      )
      .map((row,i) => {
        const b = parseFloat(row.querySelector('input[name="balance"]').value);
        const a = parseFloat(row.querySelector('input[name="apr"]').value);
        const m = parseFloat(row.querySelector('input[name="minPayment"]').value);
        return (isNaN(b)||isNaN(a)||isNaN(m))
          ? null
          : { id:i+1, startingBalance:b, monthlyRate:a/1200, minPayment:m };
      })
      .filter(x => x);

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
          ${details.map(d=>
            `<li>Debt ${d.id}: ${d.payoffMonth} mo, interest ${formatCurrency(d.interestPaid)}</li>`
          ).join('')}
        </ul>`;
    });
  }
});
