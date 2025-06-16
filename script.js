const CONFIG = {
    REPO: "realxenocide/anime-showcase",
    ANIME_JSON_URL: `https://raw.githubusercontent.com/realxenocide/anime-showcase/main/anime.json`
};

document.addEventListener("DOMContentLoaded", async () => {
    const animeGrid = document.getElementById("anime-grid");
    
    try {
        const animeList = await fetchAnimeList();
        renderAnimeList(animeList);
    } catch (error) {
        showError();
        console.error("Failed to load anime list:", error);
    }
});

async function fetchAnimeList() {
    const response = await fetch(CONFIG.ANIME_JSON_URL);
    if (!response.ok) throw new Error("Failed to fetch data");
    return await response.json();
}

function renderAnimeList(animeList) {
    const animeGrid = document.getElementById("anime-grid");
    animeGrid.innerHTML = "";

    if (!animeList || animeList.length === 0) {
        showEmptyState();
        return;
    }

    animeList.forEach(anime => {
        const imageUrl = `https://raw.githubusercontent.com/${CONFIG.REPO}/main/${anime.image}`;
        const animeCard = document.createElement("div");
        animeCard.className = "anime-card";
        animeCard.innerHTML = `
            <img src="${imageUrl}" alt="${anime.name}" class="anime-banner">
            <div class="anime-info">
                <h3>${anime.name}</h3>
                <small>Added: ${new Date(anime.addedAt).toLocaleDateString()}</small>
            </div>
        `;
        animeGrid.appendChild(animeCard);
    });
}

function showEmptyState() {
    document.getElementById("anime-grid").innerHTML = `
        <div class="empty-state">
            <i class="fas fa-tv"></i>
            <h3>No Anime Added Yet</h3>
            <p>Your anime list is currently empty</p>
            <a href="anime.html" class="button">Add Your First Anime</a>
        </div>
    `;
}

function showError() {
    document.getElementById("anime-grid").innerHTML = `
        <div class="empty-state error">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Failed to Load Anime</h3>
            <p>Please try refreshing the page</p>
        </div>
    `;
}
