// 1. SIMULATED DISCOVER EXPERIENCE DIRECTORY CATALOG
const DISCOVER_CATALOG = [
    { id: "g1", title: "RiseUp 3D Sand Box", developer: "stive pierre", genre: "creative", activePlayers: "1,240", rating: "98%", gradient: "linear-gradient(135deg, #3d236e 0%, #151124 100%)" },
    { id: "g2", title: "Clay Mold Combat", developer: "VoxelLabs", genre: "action", activePlayers: "842", rating: "94%", gradient: "linear-gradient(135deg, #6c1b39 0%, #1b1124 100%)" },
    { id: "g3", title: "Neon City Drift", developer: "CyberSprint", genre: "action", activePlayers: "2,105", rating: "91%", gradient: "linear-gradient(135deg, #1b536e 0%, #111a24 100%)" },
    { id: "g4", title: "Infinite Obby World", developer: "BlockyFun", genre: "creative", activePlayers: "450", rating: "88%", gradient: "linear-gradient(135deg, #1b6e40 0%, #112419 100%)" },
    { id: "g5", title: "Plaza Social hangout", developer: "MundoClub", genre: "social", activePlayers: "3,420", rating: "96%", gradient: "linear-gradient(135deg, #606e1b 0%, #222411 100%)" },
    { id: "g6", title: "Hide & Seek Mansion", developer: "PixelGlow", genre: "social", activePlayers: "190", rating: "85%", gradient: "linear-gradient(135deg, #6e3e1b 0%, #241911 100%)" }
];

const containerSlot = document.getElementById("experiencesContainerSlot");
const searchInputElement = document.getElementById("gameSearchBar");
const tabFilterButtons = document.querySelectorAll(".genreFilter");

// Start processing routine
assembleDiscoverCatalogGrid();
bindDiscoveryFilterListeners();

function assembleDiscoverCatalogGrid() {
    if (!containerSlot) return;
    containerSlot.innerHTML = ""; // Flush wrapper content frame

    DISCOVER_CATALOG.forEach(game => {
        const itemTileCard = document.createElement("div");
        itemTileCard.className = "experienceTileCard";
        itemTileCard.setAttribute("data-title-match", game.title.toLowerCase());
        itemTileCard.setAttribute("data-genre-type", game.genre);

        itemTileCard.innerHTML = `
            <div class="tileGraphicsContainer">
                <div class="tileBannerArt" style="background: ${game.gradient}"></div>
                <div class="liveCountBadge">
                    <div class="livePulseCircle"></div>
                    <span>${game.activePlayers} Live</span>
                </div>
            </div>
            <div class="tileMetaBody">
                <h4 class="gameTitleText">${game.title}</h4>
                <span class="developerCredits">by ${game.developer}</span>
                <div class="tileMetricsRow">
                    <span class="upvoteRatingText">👍 ${game.rating}</span>
                    <span>Experience</span>
                </div>
            </div>
        `;

        // Mock action route handler on clicking an item tile card
        itemTileCard.addEventListener("click", () => {
            if (game.id === "g1") {
                window.location.href = "player3d.html";
            } else {
                alert(`Routing instance connection parameters initialized for: ${game.title}`);
            }
        });

        containerSlot.appendChild(itemTileCard);
    });
}

function executeRuntimeGridFiltering() {
    const activeSearchQuery = searchInputElement ? searchInputElement.value.toLowerCase() : "";
    
    let targetSelectedGenre = "all";
    document.querySelectorAll(".genreFilter").forEach(btn => {
        if (btn.classList.contains("active")) {
            targetSelectedGenre = btn.getAttribute("data-genre");
        }
    });

    const activeTileNodeElements = document.querySelectorAll(".experienceTileCard");

    activeTileNodeElements.forEach(tile => {
        const titleString = tile.getAttribute("data-title-match");
        const genreString = tile.getAttribute("data-genre-type");

        const matchesQuery = titleString.includes(activeSearchQuery);
        const matchesGenre = (targetSelectedGenre === "all" || genreString === targetSelectedGenre);

        if (matchesQuery && matchesGenre) {
            tile.classList.remove("hiddenTile");
        } else {
            tile.classList.add("hiddenTile");
        }
    });
}

function bindDiscoveryFilterListeners() {
    // 1. Keystroke query scanning trigger hooks
    if (searchInputElement) {
        searchInputElement.addEventListener("input", executeRuntimeGridFiltering);
    }

    // 2. Navigation category tab selection listener switches
    tabFilterButtons.forEach(button => {
        button.addEventListener("click", () => {
            tabFilterButtons.forEach(b => b.classList.remove("active"));
            button.classList.add("active");

            executeRuntimeGridFiltering();
        });
    });
}
