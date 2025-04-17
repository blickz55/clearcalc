// js/calculator.js

document.addEventListener('DOMContentLoaded', function() {
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
    });
  });
  