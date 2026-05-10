/**
 * mentions.html — competitor snapshot + Chart.js bars (demo).
 */
(function () {
  const tickStyle = { color: "rgba(0,0,0,0.45)", font: { family: "IBM Plex Mono", size: 10 } };
  const gridStyle = { color: "rgba(0,0,0,0.06)" };

  function drawCharts() {
    if (typeof Chart === "undefined") return;

    const reachEl = document.getElementById("chart-reach");
    const influEl = document.getElementById("chart-influ");
    if (!reachEl || !influEl) return;

    new Chart(reachEl, {
      type: "bar",
      data: {
        labels: ["AgentForce", "AutoGPT UI", "You", "TaskBot"],
        datasets: [
          {
            data: [2200, 540, 180, 95],
            backgroundColor: ["#1a1a1a", "#1a1a1a", "#e1ff00", "#1a1a1a"],
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridStyle.color }, ticks: tickStyle },
          y: {
            grid: { color: gridStyle.color },
            ticks: {
              ...tickStyle,
              callback: (v) => (v >= 1000 ? v / 1000 + "k" : v),
            },
            beginAtZero: true,
          },
        },
      },
    });

    new Chart(influEl, {
      type: "bar",
      data: {
        labels: ["AgentForce", "AutoGPT UI", "You", "TaskBot"],
        datasets: [
          {
            data: [41, 22, 8, 5],
            backgroundColor: ["#1a1a1a", "#1a1a1a", "#e1ff00", "#1a1a1a"],
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridStyle.color }, ticks: tickStyle },
          y: {
            grid: { color: gridStyle.color },
            ticks: {
              ...tickStyle,
              callback: (v) => v + "%",
            },
            beginAtZero: true,
            max: 50,
          },
        },
      },
    });
  }

  window.addEventListener("load", drawCharts);
})();
