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
  const chartWrap     = chartCanvas.parentElement;
  let payoffChart;

  chartWrap.classList.remove('active'); // start closed

  if (payoffForm) {
    payoffForm.addEventListener('submit', e => {
      e.preventDefault();

      const balance = parseFloat(payoffForm.balance.value);
      const apr     = parseFloat(payoffForm.apr.value);
      const payment = parseFloat(payoffForm.payment.value);

      if (isNaN(balance) || isNaN(apr) || isNaN(payment) || payment <= 0) {
        payoffResults.innerHTML = '<p class="error">Please enter valid numbers for all fields.</p>';
        return;
      }

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

      // build the payoff schedule
      const schedule = [];
      let bal = balance, safety = 0;
      while (bal > 0 && safety++ < 1000) {
        schedule.push(bal);
        const interest = bal * monthlyRate;
        bal = bal + interest - payment;
      }

      // get totals
      const { months, totalInterest } = creditCardPayoff(balance, apr, payment);
      const totalPaid = months * payment;

      payoffResults.innerHTML = `
        <p>
          It will take <strong>${months}</strong> month${months === 1 ? '' : 's'} to pay off your balance.<br>
          Total interest paid: <strong>${formatCurrency(totalInterest)}</strong><br>
          Total amount paid: <strong>${formatCurrency(totalPaid)}</strong>
        </p>`;

      // prepare chart data
      const labels = schedule.map((_, i) => `Mo ${i + 1}`);
      const data   = schedule.map(v => parseFloat(v.toFixed(2)));

      // reveal & animate open
      chartWrap.classList.add('active');

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
              backgroundColor: 'rgba(0, 122, 204, 0.1)',
              borderColor: 'rgba(0, 122, 204, 1)',
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
                ticks: { callback: val => formatCurrency(val) }
              }
            },
            plugins: {
              tooltip: {
                callbacks: { label: ctx => formatCurrency(ctx.parsed.y) }
              },
              legend: { display: false }
            }
          }
        });
      }
    });
  }
});
