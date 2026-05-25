const role= sessionStorage.getItem('role') || 'student';
    const playerName = sessionStorage.getItem('playerName') || 'Player';

    document.getElementById('navAvatar').textContent = playerName.charAt(0).toUpperCase();

    // Student score card
    if (role === 'student') {
      const score = sessionStorage.getItem('finalScore') || 0;
      const total = sessionStorage.getItem('totalQuestions') || 0;
      document.getElementById('playerNameEl').textContent = playerName;
      document.getElementById('scoreEl').textContent = score + ' / ' + total;
    } else {
      document.getElementById('studentCard').style.display = 'none';
    }

    // Rankings
    const scoresRaw = sessionStorage.getItem('finalScores');
    const list = document.getElementById('rankingsList');
    if (scoresRaw) {
      const scores = JSON.parse(scoresRaw);
      scores.forEach((entry, i) => {
        const item = document.createElement('div');
        item.className = 'lb-item';

        const rank = document.createElement('span');
        rank.className = 'lb-rank' + (i === 0 ? ' gold' : i === 1 ? ' silver' : i === 2 ? ' bronze' : '');
        rank.textContent = '#' + (i + 1);

        const name = document.createElement('span');
        name.className = 'lb-name';
        name.textContent = entry.name;

        const pts = document.createElement('span');
        pts.className = 'lb-score';
        pts.textContent = entry.score ? entry.score.toLocaleString() + ' pts' : '0 pts';

        item.appendChild(rank);
        item.appendChild(name);
        item.appendChild(pts);
        list.appendChild(item);
      });
    } else {
      list.innerHTML = '<p style="color:#9ca3af;text-align:center;font-size:0.9rem;">No scores yet.</p>';
    }

    // Home button
    const homeBtn = document.getElementById('homeBtn');
    if (role === 'professor') homeBtn.href = '../Prof page/Classes page/professor2.html';
    else                      homeBtn.href = '../Student pages/Home page/index.html';
        const leaderboardContainer = document.getElementById("leaderboard");

        // Get data from sessionStorage
        let players = JSON.parse(sessionStorage.getItem("leaderboard")) || [];

        // Example fallback (for testing)
        if (players.length === 0) {
            players = [
                { name: "Salma", score: 100 },
                { name: "Ali", score: 80 },
                { name: "Mona", score: 60 }
            ];
        }

        // Sort by score descending
        players.sort((a, b) => b.score - a.score);

        function renderLeaderboard() {
            leaderboardContainer.innerHTML = "";

            players.forEach((player, index) => {
                const div = document.createElement("div");
                div.classList.add("player");

                if (index === 0) div.classList.add("top");

                div.innerHTML = `
                    <span class="rank">#${index + 1}</span>
                    <span>${player.name}</span>
                    <span>${player.score} pts</span>
                `;

                leaderboardContainer.appendChild(div);
            });
        }

        function goHome() {
            window.location.href = "index.html"; // change if needed
        }
        renderLeaderboard();
        document.getElementById("homeBtn").addEventListener("click", goHome);
