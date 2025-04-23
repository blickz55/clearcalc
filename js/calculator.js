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
  // ─────────────────────────────────── CREDIT CARD PAYOFF ────────────────
  const payoffForm    = document.getElementById('payoffForm');
  const payoffResults = document.getElementById('payoffResults');
  const payoffCanvas  = document.getElementById('payoffChart');
  let payoffChart;

  if (payoffForm) {
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

      // first‑month interest check
      const monthlyRate        = apr / 1200;
      const firstMonthInterest = balance * monthlyRate;
      if (payment <= firstMonthInterest) {
        payoffResults.innerHTML = `
          <p class="error">
            Your payment of <strong>${formatCurrency(payment)}</strong> isn’t enough to cover 
            the first month’s interest of <strong>${formatCurrency(firstMonthInterest)}</strong>.
          </p>`;
        return;
      }

      // build balance schedule
      const schedule = [];
      let bal = balance, guard = 0;
      while (bal > 0 && guard++ < 1000) {
        schedule.push(+bal.toFixed(2));
        const interest = bal * monthlyRate;
        bal = bal + interest - payment;
      }

      // compute totals
      const { months, totalInterest } = creditCardPayoff(balance, apr, payment);
      const totalPaid = months * payment;
// Render payoff chart
if (payoffChart) {
  payoffChart.destroy(); // Destroy existing chart if it exists
}
payoffChart = new Chart(payoffCanvas, {
  type: 'line',
  data: {
    labels: schedule.map((_, i) => `Month ${i + 1}`),
    datasets: [{
      label: 'Balance Remaining',
      data: schedule,
      borderColor: '#007bff',
      fill: false,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    animation: {
      duration: 800,
      easing: 'easeOutQuart'
    },
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Month'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Balance ($)'
        }
      }
    }
  }
});
// ✅ Trigger the animation after chart is drawn
document.querySelector('.chart-wrapper').classList.add('active');

      payoffResults.innerHTML = `
        <p>
          It will take <strong>${months}</strong> month${months === 1 ? '' : 's'} to pay off your balance.<br>
          Total interest paid: <strong>${formatCurrency(totalInterest)}</strong><br>
          Total amount paid: <strong>${formatCurrency(totalPaid)}</strong>
        </p>`;

      // render/update Chart.js
      if (payoffCanvas) {
        const labels = schedule.map((_, i) => `Mo ${i + 1}`);
        if (payoffChart) {
          payoffChart.data.labels = labels;
          payoffChart.data.datasets[0].data = schedule;
          payoffChart.update();
        } else {
          payoffChart = new Chart(payoffCanvas.getContext('2d'), {
            type: 'line',
            data: {
              labels,
              datasets: [{
                label: 'Remaining Balance',
                data: schedule,
                fill: true,
                tension: 0.3,
                backgroundColor: 'rgba(0,122,204,0.1)',
                borderColor: 'rgba(0,122,204,1)',
                pointRadius: 0
              }]
            },
            options: {
              // keep the canvas at the size you set in HTML/CSS:
              responsive: false,
              maintainAspectRatio: false,
              scales: {
                x: {
                  display: true,
                  title: { display: true, text: 'Month' },
                  ticks: { maxTicksLimit: labels.length }
                },
                y: {
                  ticks: { callback: v => formatCurrency(v) }
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
        payoffCanvas.classList.add('active');
      }
    });
  }


  // ─────────────────────────────────── DEBT SNOWBALL ───────────────────
  const snowballForm    = document.getElementById('snowballForm');
  const debtContainer   = document.getElementById('debtContainer');
  const addSnowballBtn  = document.getElementById('addSnowballDebt');
  const snowballResults = document.getElementById('snowballResults');
  const snowballCanvas  = document.getElementById('snowballChart');
  let snowballChart, snowballCount = 3;

  if (snowballForm) {
    // add another debt
    addSnowballBtn.addEventListener('click', () => {
      if (snowballCount >= 10) return;
      snowballCount++;
      const entry = document.createElement('div');
      entry.className = 'debt-entry';
      entry.innerHTML = `
        <label>Debt ${snowballCount} Balance ($):
          <input name="balance" type="number" placeholder="e.g. 1000">
        </label>
        <label>APR (%):
          <input name="apr" type="number" step="0.01" placeholder="e.g. 12.00">
        </label>
        <label>Min Payment ($):
          <input name="minPayment" type="number" placeholder="e.g. 25">
        </label>`;
      debtContainer.append(entry);
    });

    // calculate snowball
    snowballForm.addEventListener('submit', e => {
      e.preventDefault();
      // gather entries
      const entries = Array.from(debtContainer.children)
        .map((row, i) => {
          const b = parseFloat(row.querySelector('input[name="balance"]').value);
          const a = parseFloat(row.querySelector('input[name="apr"]').value);
          const m = parseFloat(row.querySelector('input[name="minPayment"]').value);
          return isNaN(b) || isNaN(a) || isNaN(m)
            ? null
            : { id: i + 1, startingBalance: b, monthlyRate: a / 1200, minPayment: m };
        })
        .filter(x => x);

      if (!entries.length) {
        snowballResults.innerHTML = '<p class="error">Please enter at least one valid debt.</p>';
        return;
      }

      // ensure total min payments > total first‑month interest
      const totalInterestMonth1 = entries
        .reduce((sum, d) => sum + d.startingBalance * d.monthlyRate, 0);
      const totalMinPayments    = entries
        .reduce((sum, d) => sum + d.minPayment, 0);
      if (totalMinPayments <= totalInterestMonth1) {
        snowballResults.innerHTML = `
          <p class="error">
            Your combined minimum payments 
            <strong>${formatCurrency(totalMinPayments)}</strong> 
            don’t cover the first month’s interest 
            <strong>${formatCurrency(totalInterestMonth1)}</strong>. 
            Please increase one or more payments.
          </p>`;
        return;
      }
// make sure each minPayment > first‑month interest
const bad = entries.find(d => d.minPayment <= d.startingBalance * d.monthlyRate);
if (bad) {
  snowballResults.innerHTML = `
    <p class="error">
      Debt ${bad.id}'s minimum payment of <strong>${formatCurrency(bad.minPayment)}</strong><br>
      does not cover its first month’s interest of
      <strong>${formatCurrency(bad.startingBalance * bad.monthlyRate)}</strong>.<br>
      Please increase that payment.
    </p>
  `;
  return;
}
      // run algorithm
      const { months, totalInterest, details } = debtSnowball(entries);
      const initialSum = entries.reduce((s, d) => s + d.startingBalance, 0);
      const totalPaid  = initialSum + totalInterest;

      // render text results
      snowballResults.innerHTML = `
        <p>
          All debts paid in <strong>${months}</strong> month${months === 1 ? '' : 's'}<br>
          Total interest paid: <strong>${formatCurrency(totalInterest)}</strong><br>
          Total amount paid: <strong>${formatCurrency(totalPaid)}</strong>
        </p>
        <ul>
  ${details.map(d =>
    `<li>Debt ${d.id} paid off in ${d.payoffMonth} mo, cumulative interest so far: ${formatCurrency(d.interestPaid)}</li>`
  ).join('')}
</ul>`;

      // build and render chart
      const sim = entries.map(d => ({ ...d }));
      const schedule = [];
      let guard = 0;
      while (sim.length && guard++ < 1000) {
        schedule.push(
          sim.reduce((s, d) => s + d.startingBalance, 0)
        );
        // pay others' minimums
        sim.slice(1).forEach(d => {
          d.startingBalance += d.startingBalance * d.monthlyRate - d.minPayment;
        });
        // pay everything into primary
        const p = sim[0];
        const avail = sim.reduce((s, d) => s + d.minPayment, 0);
        p.startingBalance += p.startingBalance * p.monthlyRate - avail;
        if (p.startingBalance <= 0) sim.shift();
      }

      if (snowballCanvas) {
        const labels = schedule.map((_, i) => `Mo ${i + 1}`);
        if (snowballChart) {
          snowballChart.data.labels = labels;
          snowballChart.data.datasets[0].data = schedule;
          snowballChart.update();
        } else {
          snowballChart = new Chart(snowballCanvas.getContext('2d'), {
            type: 'line',
            data: {
              labels,
              datasets: [{
                label: 'Total Remaining',
                data: schedule,
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
                  ticks: { maxTicksLimit: labels.length }
                },
                y: {
                  ticks: { callback: v => formatCurrency(v) }
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
        snowballCanvas.classList.add('active');
      }
      document.querySelector("#snowballChart").closest(".chart-wrapper").classList.add("active");

    });
  }


  // ─────────────────────────────────── DEBT AVALANCHE ──────────────────
const avalancheForm    = document.getElementById('avalancheForm');
const avContainer      = document.getElementById('avalancheContainer');
const addAvalancheBtn  = document.getElementById('addAvalancheDebt');
const avalancheResults = document.getElementById('avalancheResults');
const avalancheCanvas  = document.getElementById('avalancheChart');
let avalancheChart, avalancheCount = 3;

if (avalancheForm) {
  // add another debt
  addAvalancheBtn.addEventListener('click', () => {
    if (avalancheCount >= 10) return;
    avalancheCount++;
    const div = document.createElement('div');
    div.className = 'debt-entry';
    div.innerHTML = `
      <label>Debt ${avalancheCount} Balance ($):
        <input name="balance" type="number" placeholder="e.g. 1000">
      </label>
      <label>APR (%):
        <input name="apr" type="number" step="0.01" placeholder="e.g. 12.00">
      </label>
      <label>Min Payment ($):
        <input name="minPayment" type="number" placeholder="e.g. 25">
      </label>`;
    avContainer.append(div);
  });

  avalancheForm.addEventListener('submit', e => {
    e.preventDefault();

    // gather entries
    const entries = Array.from(avContainer.children)
      .map((row,i) => {
        const b = parseFloat(row.querySelector('input[name="balance"]').value);
        const a = parseFloat(row.querySelector('input[name="apr"]').value);
        const m = parseFloat(row.querySelector('input[name="minPayment"]').value);
        return isNaN(b)||isNaN(a)||isNaN(m)
          ? null
          : { id:i+1, startingBalance:b, monthlyRate:a/1200, minPayment:m };
      })
      .filter(x=>x);

    if (!entries.length) {
      avalancheResults.innerHTML = '<p class="error">Please enter at least one valid debt.</p>';
      return;
    }

    // first‑month combined interest check
    const totalInterestMonth1 = entries.reduce((sum,d)=> sum + d.startingBalance*d.monthlyRate, 0);
    const totalMinPayments    = entries.reduce((sum,d)=> sum + d.minPayment, 0);
    if (totalMinPayments <= totalInterestMonth1) {
      avalancheResults.innerHTML = `
        <p class="error">
          Your combined payments <strong>${formatCurrency(totalMinPayments)}</strong> 
          don’t cover first month’s interest <strong>${formatCurrency(totalInterestMonth1)}</strong>.<br>
          Please increase your payments.
        </p>`;
      return;
    }

    // run avalanche algorithm
    const { months, totalInterest, details } = debtAvalanche(entries);
    const initialSum = entries.reduce((s,d)=> s+d.startingBalance, 0);
    const totalPaid  = initialSum + totalInterest;

    avalancheResults.innerHTML = `
      <p>
        All debts paid in <strong>${months}</strong> month${months===1?'':'s'}<br>
        Total interest paid: <strong>${formatCurrency(totalInterest)}</strong><br>
        Total amount paid: <strong>${formatCurrency(totalPaid)}</strong>
      </p>
      <ul>
  ${details.map(d =>
    `<li>Debt ${d.id} paid off in ${d.payoffMonth} mo, cumulative interest so far: ${formatCurrency(d.interestPaid)}</li>`
  ).join('')}
</ul>`;

    // build schedule
    const sim = entries.slice().sort((a,b)=>b.monthlyRate - a.monthlyRate);
    const schedule = [];
    let guard=0;
    while (sim.length && guard++ < 1000) {
      schedule.push(sim.reduce((s,d)=> s + d.startingBalance, 0));
      sim.slice(1).forEach(d=>{
        d.startingBalance += d.startingBalance*d.monthlyRate - d.minPayment;
      });
      const p = sim[0];
      const avail = sim.reduce((s,d)=> s + d.minPayment, 0);
      p.startingBalance += p.startingBalance*p.monthlyRate - avail;
      if (p.startingBalance <= 0) sim.shift();
    }

    // render chart
    if (avalancheCanvas) {
      const labels = schedule.map((_,i)=>`Mo ${i+1}`);
      if (avalancheChart) {
        avalancheChart.data.labels = labels;
        avalancheChart.data.datasets[0].data = schedule;
        avalancheChart.update();
      } else {
        avalancheChart = new Chart(avalancheCanvas.getContext('2d'), {
          type:'line',
          data:{ labels, datasets:[{
            label:'Total Remaining',
            data: schedule,
            fill:true,
            tension:0.3,
            backgroundColor:'rgba(0,122,204,0.1)',
            borderColor:'rgba(0,122,204,1)',
            pointRadius:0
          }]},
          options:{
            responsive:false,
            maintainAspectRatio:false,
            scales:{
              x:{ display:true, title:{display:true,text:'Month'}, ticks:{maxTicksLimit:labels.length} },
              y:{ ticks:{callback:v=>formatCurrency(v)} }
            },
            plugins:{
              tooltip:{ callbacks:{ label:ctx=>formatCurrency(ctx.parsed.y) } },
              legend:{ display:false }
            }
          }
        });
      }
      avalancheCanvas.classList.add('active');
    }
    document.querySelector("#avalancheChart").closest(".chart-wrapper").classList.add("active");

  });
}
});
