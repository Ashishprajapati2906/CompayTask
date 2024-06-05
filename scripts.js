document.addEventListener("DOMContentLoaded", function () {
  const monthSelect = document.getElementById("month-select");
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const transactionsTable = document.getElementById("transactions-table");
  const prevButton = document.getElementById("prev-button");
  const nextButton = document.getElementById("next-button");
  const statisticsDiv = document.getElementById("statistics");
  const barChartCanvas = document.getElementById("bar-chart");

  let currentPage = 1;

  function fetchTransactions(month, searchText = "", page = 1) {
    fetch(
      `http://localhost:3000/transactions?month=${month}&search=${searchText}&page=${page}`
    )
      .then((response) => response.json())
      .then((data) => {
        // Clear previous transactions
        transactionsTable.innerHTML = "";

        // Add new transactions
        data.forEach((transaction) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${transaction.title}</td>
            <td>${transaction.price}</td>
            <td>${transaction.description}</td>
          `;
          transactionsTable.appendChild(row);
        });
      })
      .catch((error) => console.error("Error fetching transactions:", error));
  }

  function fetchStatistics(month) {
    fetch(`http://localhost:3000/statistics?month=${month}`)
      .then((response) => response.json())
      .then((data) => {
        statisticsDiv.innerHTML = `
          <h2>Statistics</h2>
          <p>Total Sale Amount: ${data.totalSaleAmount}</p>
          <p>Total Sold Items: ${data.totalSoldItems}</p>
          <p>Total Not Sold Items: ${data.totalNotSoldItems}</p>
        `;
      })
      .catch((error) => console.error("Error fetching statistics:", error));
  }

  function fetchBarChart(month) {
    fetch(`http://localhost:3000/bar-chart?month=${month}`)
      .then((response) => response.json())
      .then((data) => {
        const labels = data.map((item) => item.range);
        const counts = data.map((item) => item.count);

        const barChart = new Chart(barChartCanvas, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Number of Items",
                data: counts,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              yAxes: [
                {
                  ticks: {
                    beginAtZero: true,
                  },
                },
              ],
            },
          },
        });
      })
      .catch((error) => console.error("Error fetching bar chart data:", error));
  }

  function updatePaginationButtons() {
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = false; // Reset next button
  }

  monthSelect.addEventListener("change", function () {
    const selectedMonth = parseInt(monthSelect.value);
    fetchTransactions(selectedMonth, searchInput.value);
    fetchStatistics(selectedMonth);
    fetchBarChart(selectedMonth);
  });

  searchButton.addEventListener("click", function () {
    const selectedMonth = parseInt(monthSelect.value);
    fetchTransactions(selectedMonth, searchInput.value);
  });

  prevButton.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      const selectedMonth = parseInt(monthSelect.value);
      fetchTransactions(selectedMonth, searchInput.value, currentPage);
    }
    updatePaginationButtons();
  });

  nextButton.addEventListener("click", function () {
    currentPage++;
    const selectedMonth = parseInt(monthSelect.value);
    fetchTransactions(selectedMonth, searchInput.value, currentPage);
    updatePaginationButtons();
  });

  // Initial fetch and display of transactions, statistics, and bar chart for default month (March)
  const defaultMonth =3;
  fetchTransactions(defaultMonth);
  fetchStatistics(defaultMonth);
  fetchBarChart(defaultMonth);

  updatePaginationButtons();
});
