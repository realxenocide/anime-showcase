// Configuration
const CONFIG = {
    REPO: "realxenocide/anime-showcase",
    ANIME_JSON: "anime.json",
    MAX_FILE_SIZE: 20 * 1024 * 1024 // 20MB
};

// Secure token fetch
async function getGitHubToken() {
    try {
        const response = await fetch('/.netlify/functions/github-auth');
        if (!response.ok) throw new Error('Failed to get token');
        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Token fetch error:', error);
        return null;
    }
}

document.getElementById('anime-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    const messageEl = document.getElementById('message');
    
    try {
        // Validate inputs
        const title = document.getElementById('title').value.trim();
        const imageFile = document.getElementById('image').files[0];
        
        if (!title) throw new Error("Anime title is required");
        if (!imageFile) throw new Error("Image is required");
        
        // Set loading state
        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading...";
        messageEl.textContent = "";
        messageEl.className = "message";
        
        // Get fresh token for each request
        const token = await getGitHubToken();
        if (!token) throw new Error("Authentication failed - please refresh and try again");
        
        // 1. Upload image
        const imageUrl = await uploadImage(imageFile, token);
        
        // 2. Update anime.json
        await updateAnimeList({ 
            name: title, 
            image: imageUrl.split('/').pop(),
            addedAt: new Date().toISOString()
        }, token);
        
        // Success
        showMessage("Anime added successfully!", "success");
        document.getElementById('anime-form').reset();
        
    } catch (error) {
        showMessage(error.message, "error");
        console.error("Error:", error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Add Anime";
    }
});

async function uploadImage(file, token) {
    // Validate file
    if (!file.type.startsWith('image/')) {
        throw new Error("Only image files are allowed");
    }
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        throw new Error(`Image must be smaller than ${CONFIG.MAX_FILE_SIZE/1024/1024}MB`);
    }

    const filename = generateFilename(file.name);
    const base64Content = await fileToBase64(file);
    
    const response = await fetch(
        `https://api.github.com/repos/${CONFIG.REPO}/contents/${filename}`,
        {
            method: "PUT",
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify({
                message: `Add image: ${filename}`,
                content: base64Content,
            }),
        }
    );
    
    const data = await response.json();
    if (!response.ok) {
        if (response.status === 401) throw new Error("Invalid GitHub token");
        if (response.status === 403) throw new Error("Rate limit exceeded");
        throw new Error(data.message || "Image upload failed");
    }
    
    return `https://raw.githubusercontent.com/${CONFIG.REPO}/main/${filename}`;
}

async function updateAnimeList(newAnime, token) {
    // Get current anime.json
    const response = await fetch(
        `https://api.github.com/repos/${CONFIG.REPO}/contents/${CONFIG.ANIME_JSON}`,
        {
            headers: {
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json",
            },
        }
    );
    
    let currentContent = [];
    let sha = null;
    
    if (response.ok) {
        const data = await response.json();
        currentContent = JSON.parse(atob(data.content));
        sha = data.sha;
    }
    
    // Add new anime
    currentContent.push(newAnime);
    
    // Push update
    const updateResponse = await fetch(
        `https://api.github.com/repos/${CONFIG.REPO}/contents/${CONFIG.ANIME_JSON}`,
        {
            method: "PUT",
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `Add anime: ${newAnime.name}`,
                content: btoa(JSON.stringify(currentContent, null, 2)),
                sha: sha,
            }),
        }
    );
    
    if (!updateResponse.ok) {
        throw new Error("Failed to update anime list");
    }
}

// Helper functions
function generateFilename(originalName) {
    return `${Date.now()}-${originalName.toLowerCase().replace(/[^a-z0-9.]/g, '-')}`;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showMessage(text, type) {
    const el = document.getElementById('message');
    el.textContent = text;
    el.className = `message ${type}`;
}
