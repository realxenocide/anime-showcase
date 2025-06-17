document.addEventListener("DOMContentLoaded", async () => {
    const animeGrid = document.getElementById("anime-grid");
    const REPO = "realxenocide/anime-showcase";
    const ANIME_JSON_URL = `https://raw.githubusercontent.com/${REPO}/main/anime.json?t=${Date.now()}`;

    async function fetchAnimeList() {
        try {
            const response = await fetch(ANIME_JSON_URL);
            if (!response.ok) throw new Error("Network response was not ok");
            const data = await response.json();
            return Array.isArray(data) ? data : []; // Always return array
        } catch (error) {
            console.error("Failed to fetch anime list:", error);
            return [];
        }
    }

    function renderAnimeList(animeList) {
        animeGrid.innerHTML = "";

        if (!animeList || animeList.length === 0) {
            animeGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tv"></i>
                    <h3>No Anime Added Yet</h3>
                    <a href="anime.html" class="button">Add Your First Anime</a>
                </div>
            `;
            return;
        }

        animeList.forEach(anime => {
            const animeCard = document.createElement("div");
            animeCard.className = "anime-card";
            animeCard.innerHTML = `
                <img src="https://raw.githubusercontent.com/${REPO}/main/${anime.image}" 
                     alt="${anime.name}" 
                     class="anime-banner">
                <div class="anime-info">
                    <h3>${anime.name}</h3>
                </div>
            `;
            animeGrid.appendChild(animeCard);
        });
    }

    // Initial load
    renderAnimeList(await fetchAnimeList());
    
    // Optional: Auto-refresh every 30 seconds
    setInterval(async () => {
        renderAnimeList(await fetchAnimeList());
    }, 30000);
});
