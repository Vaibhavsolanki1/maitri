import { ENDPOINTS, getActiveUser, getSessionEntries } from "./modules/config.js";
import { initTheme, bindThemeToggle } from "./modules/theme.js";

const toggleTheme = document.getElementById("toggle-theme");
initTheme(toggleTheme);
bindThemeToggle(toggleTheme);

async function loadData() {
  const userName = getActiveUser();
  
  // Load History
  try {
    const res = await fetch(`${ENDPOINTS.history}?userName=${encodeURIComponent(userName)}`);
    const data = await res.json();
    
    const emotionsCount = {};
    if (data.items) {
      data.items.forEach(item => {
        if (item.emotion) {
          emotionsCount[item.emotion] = (emotionsCount[item.emotion] || 0) + 1;
        }
      });
    }
    
    const ctx = document.getElementById('emotionChart').getContext('2d');
    const chartStyleColor = document.body.dataset.theme === 'dark' ? 'rgba(212, 123, 94, 0.7)' : 'rgba(228, 127, 99, 0.7)';
    const chartStyleBorder = document.body.dataset.theme === 'dark' ? 'rgba(212, 123, 94, 1)' : 'rgba(228, 127, 99, 1)';
    const textColor = document.body.dataset.theme === 'dark' ? '#f6ece4' : '#2a1d18';

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(emotionsCount).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
        datasets: [{
          label: 'Emotion Frequency',
          data: Object.values(emotionsCount),
          backgroundColor: chartStyleColor,
          borderColor: chartStyleBorder,
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: textColor } },
          y: { ticks: { color: textColor } }
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
        div.className = "journal-card";
        
        const dateSpan = document.createElement("span");
        dateSpan.className = "tag-chip";
        dateSpan.textContent = new Date(item.timestamp).toLocaleString();
        
        const p = document.createElement("p");
        p.textContent = item.report;
        p.style.margin = "0";
        p.style.fontSize = "14px";
        
        div.appendChild(dateSpan);
        div.appendChild(p);
        list.appendChild(div);
      });
    } else {
      const p = document.createElement("p");
      p.textContent = "No reports found.";
      p.className = "data-empty";
      list.appendChild(p);
    }
  } catch(e) { console.error("Reports fetch failed", e); }
  
  // Load Meditation Sessions
  const medList = document.getElementById("meditation-list");
  medList.innerHTML = "";
  const sessions = getSessionEntries().filter(s => s.type === "meditation");
  
  if (sessions.length > 0) {
    sessions.forEach(session => {
      const div = document.createElement("div");
      div.className = "session-card";
      
      const titleSpan = document.createElement("span");
      titleSpan.style.fontWeight = "bold";
      const minutes = Math.floor(session.duration / 60);
      titleSpan.textContent = `${minutes} min session`;
      
      const dateSpan = document.createElement("span");
      dateSpan.style.fontSize = "12px";
      dateSpan.style.color = "var(--muted)";
      dateSpan.textContent = new Date(session.timestamp).toLocaleString();
      
      div.appendChild(titleSpan);
      div.appendChild(dateSpan);
      medList.appendChild(div);
    });
  } else {
    const p = document.createElement("p");
    p.textContent = "No sessions found.";
    p.className = "data-empty";
    medList.appendChild(p);
  }
}

loadData();
