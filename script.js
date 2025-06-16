document.addEventListener("DOMContentLoaded", async function () {
    const animeGrid = document.getElementById("anime-grid");
    const REPO = "your-username/your-repo"; // Same as in anime.js
    const ANIME_JSON_URL = `https://raw.githubusercontent.com/${REPO}/main/anime.json`;

    async function fetchAnimeList() {
        try {
            const response = await fetch(ANIME_JSON_URL);
            if (!response.ok) throw new Error("Failed to fetch anime list");
            return await response.json();
        } catch (error) {
            console.error("Error fetching anime list:", error);
            return [];
        }
    }

    function renderAnimeList(animeList) {
        animeGrid.innerHTML = "";

        if (!animeList || animeList.length === 0) {
            showEmptyState();
            return;
        }

        animeList.forEach((anime) => {
            const animeCard = document.createElement("div");
            animeCard.className = "anime-card";

            const bannerImage = anime.image || "https://via.placeholder.com/300x150?text=No+Image";

            animeCard.innerHTML = `
                <img src="${bannerImage}" alt="${anime.name}" class="anime-banner">
                <div class="anime-info">
                    <h3 class="anime-title">${anime.name}</h3>
                </div>
            `;

            animeGrid.appendChild(animeCard);
        });
    }

    function showEmptyState() {
        animeGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tv"></i>
                <h3>No Anime Added Yet</h3>
                <p>Your anime list is currently empty</p>
            </div>
        `;
    }

    // Initialize
    const animeList = await fetchAnimeList();
    renderAnimeList(animeList);
});
