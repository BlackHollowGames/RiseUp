// 1. INVENTORY SYSTEM STORAGE OBJECT ARRAY
const INVENTORY_DATABASE = [
    { id: "i1", name: "Bone Clay Mold", category: "molds", desc: "A clean, smooth cream clay skin option. The standard configuration for your character framework.", assetType: "Skin Tone", hex: "eae6df", equipped: true },
    { id: "i2", name: "Amethyst Mold", category: "molds", desc: "A rare, glowing deep violet clay skin variance. Extracted directly from premium studio packs.", assetType: "Skin Tone", hex: "7b3fd3", equipped: false },
    { id: "i3", name: "Mint Mold", category: "molds", desc: "A fresh pastel teal green procedural clay texture finish. Fully unlocked.", assetType: "Skin Tone", hex: "1fca8a", equipped: false },
    { id: "i4", name: "Rabbit Companion", category: "companions", desc: "A floating secondary companion pet asset. Hovering top-right from your main avatar.", assetType: "Pet Mesh", fallbackIcon: "🐰", equipped: true },
    { id: "i5", name: "Developer Code Tool", category: "gear", desc: "An exclusive equippable logic tool for high-tier sandbox debugging actions.", assetType: "Tool Asset", fallbackIcon: "🔧", equipped: false }
];

let selectedCategoryFilter = "molds";
let selectedActiveItemPointer = null;

const gridContainerSlot = document.getElementById("closetGridSlot");
const totalStorageLabel = document.getElementById("storageCountLabel");
const tabsList = document.querySelectorAll(".filterTabBtn");

// Inspect views elements
const viewEmpty = document.getElementById("emptyInspectView");
const viewActive = document.getElementById("activeInspectView");
const insName = document.getElementById("inspectItemName");
const insType = document.getElementById("inspectItemType");
const insDesc = document.getElementById("inspectItemDesc");
const insGraphic = document.getElementById("inspectItemGraphic");
const btnAction = document.getElementById("equipActionBtn");

// Run primary routines
refreshInventoryWorkspace();
bindInventoryMenuEvents();

function refreshInventoryWorkspace() {
    if (!gridContainerSlot) return;
    gridContainerSlot.innerHTML = "";

    // Parse and map storage cap pills values
    if (totalStorageLabel) {
        totalStorageLabel.textContent = `${INVENTORY_DATABASE.length}/20`;
    }

    // Filter items down to active category tab choice
    const scopedFilteredItems = INVENTORY_DATABASE.filter(item => item.category === selectedCategoryFilter);

    scopedFilteredItems.forEach(item => {
        const slotCell = document.createElement("div");
        slotCell.className = `closetSlotCell ${selectedActiveItemPointer?.id === item.id ? "activeTarget" : ""}`;

        // Dynamic rendering logic for preview icons based on items metrics
        if (item.category === "molds") {
            const rawHexStr = `#${item.hex}`;
            slotCell.innerHTML = `
                <div class="cellIconThumb" style="background: radial-gradient(circle at 30% 30%, #ffffff 0%, ${rawHexStr} 50%, #000000 130%);"></div>
                ${item.equipped ? '<div class="equippedTagIndicator"></div>' : ''}
            `;
        } else {
            slotCell.innerHTML = `
                <div class="cellIconThumb" style="background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; font-size: 20px;">${item.fallbackIcon || "📦"}</div>
                ${item.equipped ? '<div class="equippedTagIndicator"></div>' : ''}
            `;
        }

        // Action trigger: Inspect specific inventory item selection cell
        slotCell.addEventListener("click", () => {
            selectedActiveItemPointer = item;
            refreshInventoryWorkspace();
            loadInspectDetailsWindow(item);
        });

        gridContainerSlot.appendChild(slotCell);
    });
}

function loadInspectDetailsWindow(item) {
    if (!viewEmpty || !viewActive) return;

    // Toggle panels view visibility states
    viewEmpty.classList.add("hidden");
    viewActive.classList.remove("hidden");

    // Map content text items strings
    if (insName) insName.textContent = item.name;
    if (insType) insType.textContent = item.assetType;
    if (insDesc) insDesc.textContent = item.desc;

    // Synchronize preview display headers visual components
    if (insGraphic) {
        if (item.category === "molds") {
            insGraphic.style.background = `#${item.hex}`;
        } else {
            insGraphic.style.background = "rgba(255,255,255,0.03)";
            insGraphic.style.display = "flex";
            insGraphic.style.alignItems = "center";
            insGraphic.style.justifyContent = "center";
            insGraphic.style.fontSize = "42px";
            insGraphic.innerHTML = item.fallbackIcon || "📦";
        }
    }

    // Configure button action text indicators
    if (btnAction) {
        btnAction.textContent = item.equipped ? "Equipped" : "Equip Asset";
        btnAction.style.opacity = item.equipped ? "0.5" : "1";
        btnAction.style.pointerEvents = item.equipped ? "none" : "auto";
    }
}

function bindInventoryMenuEvents() {
    tabsList.forEach(tab => {
        tab.addEventListener("click", () => {
            tabsList.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            selectedCategoryFilter = tab.getAttribute("data-category");
            
            // Reset selection details pointer when swapping categories
            selectedActiveItemPointer = null;
            viewActive.classList.add("hidden");
            viewEmpty.classList.remove("hidden");

            refreshInventoryWorkspace();
        });
    });

    if (btnAction) {
        btnAction.addEventListener("click", () => {
            if (!selectedActiveItemPointer) return;

            // Clear previous selections within matching category boundaries
            INVENTORY_DATABASE.forEach(i => {
                if (i.category === selectedActiveItemPointer.category) {
                    i.equipped = false;
                }
            });

            // Set current target state as equipped
            selectedActiveItemPointer.equipped = true;
            
            refreshInventoryWorkspace();
            loadInspectDetailsWindow(selectedActiveItemPointer);
            alert(`Ecosystem synchronized: ${selectedActiveItemPointer.name} is now actively equipped!`);
        });
    }
}
