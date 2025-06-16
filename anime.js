// GitHub Configuration - Use environment variables in production!
const GITHUB_TOKEN = "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"; // Replace with new token
const REPO = "realxenocide/anime-showcase";
const ANIME_JSON_PATH = "anime.json";
const IMAGES_DIR = "images/";

document.getElementById('anime-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value.trim();
    const imageFile = document.getElementById('image').files[0];
    
    // Basic validation
    if (!title || !imageFile) {
        alert("Please provide both anime title and image");
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading...";
        
        // 1. Upload image to GitHub
        const imageUrl = await uploadImageToGitHub(imageFile);
        
        // 2. Update anime.json
        await addAnimeToGitHub({ 
            name: title, 
            image: imageUrl,
            addedAt: new Date().toISOString() // Add timestamp
        });
        
        // Show success
        document.getElementById('success-message').style.display = 'block';
        document.getElementById('anime-form').reset();
        
        setTimeout(() => {
            document.getElementById('success-message').style.display = 'none';
        }, 2000);
    } catch (error) {
        console.error("Error:", error);
        alert(`Failed to add anime: ${error.message}`);
    } finally {
        // Reset button state
        const submitBtn = document.querySelector('#anime-form button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Add Anime";
        }
    }
});

async function uploadImageToGitHub(file) {
    // Validate file type
    if (!file.type.match('image.*')) {
        throw new Error("Only image files are allowed");
    }

    // Limit file size (2MB example)
    if (file.size > 2 * 1024 * 1024) {
        throw new Error("Image must be smaller than 2MB");
    }

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
    const path = `${IMAGES_DIR}${filename}`;
    
    const base64Content = await toBase64(file);
    
    const response = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${path}`,
        {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `Add image: ${filename}`,
                content: base64Content.split(',')[1], // Remove data URL prefix
            }),
        }
    );
    
    const responseData = await response.json();
    
    if (!response.ok) {
        // Handle specific GitHub API errors
        if (response.status === 409) {
            throw new Error("File already exists. Try again.");
        }
        throw new Error(responseData.message || "Image upload failed");
    }
    
    return `https://raw.githubusercontent.com/${REPO}/main/${path}`;
}

async function addAnimeToGitHub(newAnime) {
    // First try to get existing anime.json
    let currentContent = [];
    let sha = null;
    
    try {
        const getResponse = await fetch(
            `https://api.github.com/repos/${REPO}/contents/${ANIME_JSON_PATH}`,
            {
                headers: {
                    "Authorization": `token ${GITHUB_TOKEN}`,
                    "Accept": "application/vnd.github.v3+json",
                },
            }
        );
        
        if (getResponse.ok) {
            const data = await getResponse.json();
            currentContent = JSON.parse(atob(data.content));
            sha = data.sha;
        }
    } catch (error) {
        console.warn("Couldn't fetch existing anime.json, creating new one");
    }
    
    // Add new anime
    currentContent.push(newAnime);
    
    const updateResponse = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${ANIME_JSON_PATH}`,
        {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `Add anime: ${newAnime.name}`,
                content: btoa(JSON.stringify(currentContent, null, 2)),
                sha: sha, // Required for updates, null for new files
            }),
        }
    );
    
    if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || "Failed to update anime.json");
    }
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(new Error("Failed to read image file"));
    });
}
