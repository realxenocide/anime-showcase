// Configuration - Use environment variables in production!
const CONFIG = {
    GITHUB_TOKEN: window.GITHUB_TOKEN, // Netlify automatically injects this
    REPO: "realxenocide/anime-showcase",
    ANIME_JSON: "anime.json",
    MAX_FILE_SIZE: 20 * 1024 * 1024 // 20MB
};

// Debug token availability
console.log("GitHub Token Available:", !!CONFIG.GITHUB_TOKEN);

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
        
        console.log("Starting upload..."); // Debug log
        
        // 1. Upload image
        const imageUrl = await uploadImage(imageFile);
        console.log("Image uploaded to:", imageUrl); // Debug log
        
        // 2. Update anime.json
        await updateAnimeList({ 
            name: title, 
            image: imageUrl.split('/').pop(), // Store just filename
            addedAt: new Date().toISOString()
        });
        console.log("anime.json updated"); // Debug log
        
        // Success
        showMessage("Anime added successfully!", "success");
        document.getElementById('anime-form').reset();
        
    } catch (error) {
        console.error("Operation failed:", error); // Detailed error log
        showMessage(`Error: ${error.message}`, "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Add Anime";
    }
});

async function uploadImage(file) {
    // Validate file
    if (!file.type.startsWith('image/')) {
        throw new Error("Only image files are allowed (JPEG, PNG, etc.)");
    }
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        throw new Error(`Image must be smaller than ${CONFIG.MAX_FILE_SIZE/1024/1024}MB`);
    }

    const filename = generateFilename(file.name);
    const base64Content = await fileToBase64(file);
    
    console.log(`Uploading ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`); // Debug log
    
    const response = await fetch(
        `https://api.github.com/repos/${CONFIG.REPO}/contents/${filename}`,
        {
            method: "PUT",
            headers: {
                "Authorization": `token ${CONFIG.GITHUB_TOKEN}`,
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
    console.log("GitHub API Response:", data); // Debug log
    
    if (!response.ok) {
        // Enhanced error messages
        if (response.status === 401) {
            throw new Error("Authentication failed - check your GitHub token");
        } else if (response.status === 403) {
            throw new Error("Rate limit exceeded or no write permissions");
        }
        throw new Error(data.message || `Upload failed with status ${response.status}`);
    }
    
    return `https://raw.githubusercontent.com/${CONFIG.REPO}/main/${filename}`;
}

async function updateAnimeList(newAnime) {
    try {
        // Get current anime.json
        const response = await fetch(
            `https://api.github.com/repos/${CONFIG.REPO}/contents/${CONFIG.ANIME_JSON}`,
            {
                headers: {
                    "Authorization": `token ${CONFIG.GITHUB_TOKEN}`,
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
        } else if (response.status !== 404) {
            throw new Error(`Failed to fetch anime.json: ${response.status}`);
        }
        
        // Add new anime
        currentContent.push(newAnime);
        
        // Push update
        const updateResponse = await fetch(
            `https://api.github.com/repos/${CONFIG.REPO}/contents/${CONFIG.ANIME_JSON}`,
            {
                method: "PUT",
                headers: {
                    "Authorization": `token ${CONFIG.GITHUB_TOKEN}`,
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
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || "Failed to update anime list");
        }
    } catch (error) {
        console.error("Update failed:", error);
        throw new Error(`Could not update anime list: ${error.message}`);
    }
}

// Helper functions
function generateFilename(originalName) {
    const sanitized = originalName.toLowerCase()
        .replace(/[^a-z0-9.]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return `${Date.now()}-${sanitized}`;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Verify the Base64 content
            const result = reader.result;
            if (!result.startsWith('data:')) {
                reject(new Error("Invalid file read result"));
            } else {
                resolve(result.split(',')[1]);
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

function showMessage(text, type) {
    const el = document.getElementById('message');
    el.textContent = text;
    el.className = `message ${type}`;
    el.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            el.style.display = 'none';
        }, 5000);
    }
}
