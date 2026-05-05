async function loadData() {
  const userName = localStorage.getItem("maitriActiveUser") || "Guest";
  
  // Load History
  try {
    const res = await fetch(`http://localhost:3000/history?userName=${userName}`);
    const data = await res.json();
    
    // Process emotions
    const emotionsCount = {};
    data.items.forEach(item => {
      if (item.emotion) {
        emotionsCount[item.emotion] = (emotionsCount[item.emotion] || 0) + 1;
      }
    });
    
    const ctx = document.getElementById('emotionChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(emotionsCount).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
        datasets: [{
          label: 'Emotion Frequency',
          data: Object.values(emotionsCount),
          backgroundColor: 'rgba(228, 127, 99, 0.7)',
          borderColor: 'rgba(228, 127, 99, 1)',
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  } catch(e) { console.error("History fetch failed", e); }
  
  // Load Reports
  try {
    const res = await fetch(`http://localhost:3000/reports?userName=${userName}`);
    const data = await res.json();
    const list = document.getElementById("reports-list");
    if (data.items && data.items.length > 0) {
      list.innerHTML = data.items.map(item => `
        <div style="border-bottom: 1px solid var(--panel-border); padding: 15px 0;">
          <strong style="color: var(--accent); font-size: 14px;">${new Date(item.timestamp).toLocaleString()}</strong>
          <p style="margin-top: 8px;">${item.report}</p>
        </div>
      `).join('');
    } else {
      list.innerHTML = "<p>No reports found.</p>";
    }
  } catch(e) { console.error("Reports fetch failed", e); }
}

loadData();
