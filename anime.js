// GitHub Configuration (replace with your details)
const GITHUB_TOKEN = "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"; // Securely handle this in production!
const REPO = "realxenocide/anime-showcase";   // e.g., "myusername/anime-showcase"
const ANIME_JSON_PATH = "anime.json";
const IMAGES_DIR = "images/";

document.getElementById('anime-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const imageFile = document.getElementById('image').files[0];
    
    try {
        // 1. Upload image to GitHub
        const imageUrl = await uploadImageToGitHub(imageFile);
        
        // 2. Update anime.json
        await addAnimeToGitHub({ name: title, image: imageUrl });
        
        // Show success
        document.getElementById('success-message').style.display = 'block';
        document.getElementById('anime-form').reset();
        
        setTimeout(() => {
            document.getElementById('success-message').style.display = 'none';
        }, 2000);
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to add anime. Check console for details.");
    }
});

async function uploadImageToGitHub(file) {
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
                content: base64Content.split(',')[1],
            }),
        }
    );
    
    if (!response.ok) throw new Error("Image upload failed");
    
    return `https://raw.githubusercontent.com/${REPO}/main/${path}`;
}

async function addAnimeToGitHub(newAnime) {
    const response = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${ANIME_JSON_PATH}`,
        {
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json",
            },
        }
    );
    
    if (!response.ok) throw new Error("Failed to fetch anime.json");
    
    const data = await response.json();
    const currentContent = JSON.parse(atob(data.content));
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
                sha: data.sha,
            }),
        }
    );
    
    if (!updateResponse.ok) throw new Error("Failed to update anime.json");
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
}
