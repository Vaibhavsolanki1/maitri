import { ENDPOINTS, getActiveUser } from "./modules/config.js";

async function loadData() {
  const userName = getActiveUser();
  
  // Load History
  try {
    const res = await fetch(`${ENDPOINTS.history}?userName=${encodeURIComponent(userName)}`);
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
    const res = await fetch(`${ENDPOINTS.reports}?userName=${encodeURIComponent(userName)}`);
    const data = await res.json();
    const list = document.getElementById("reports-list");
    list.innerHTML = "";
    
    if (data.items && data.items.length > 0) {
      data.items.forEach(item => {
        const div = document.createElement("div");
        div.style.cssText = "border-bottom: 1px solid var(--panel-border); padding: 15px 0;";
        
        const strong = document.createElement("strong");
        strong.style.cssText = "color: var(--accent); font-size: 14px;";
        strong.textContent = new Date(item.timestamp).toLocaleString();
        
        const p = document.createElement("p");
        p.style.cssText = "margin-top: 8px;";
        p.textContent = item.report;
        
        div.appendChild(strong);
        div.appendChild(p);
        list.appendChild(div);
      });
    } else {
      list.innerHTML = "<p>No reports found.</p>";
    }
  } catch(e) { console.error("Reports fetch failed", e); }
}

loadData();
