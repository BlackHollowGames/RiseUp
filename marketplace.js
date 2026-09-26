import * as THREE from "three";

// 1. DATA DICTIONARY: Replicating your exact color palette from the screen asset
const SKIN_CATALOG = [
    { id: "clay", name: "Clay", hex: 0xc4b39e, owned: true },
    { id: "bone_clay", name: "Bone Clay", hex: 0xeae6df, owned: true },
    { id: "amethyst", name: "Amethyst", hex: 0x7b3fd3, owned: true },
    { id: "mint", name: "Mint", hex: 0x1fca8a, owned: true },
    { id: "apricot", name: "Apricot", hex: 0xe67035, owned: true },
    { id: "glacier", name: "Glacier", hex: 0x47a9f5, owned: true },
    { id: "lagoon", name: "Lagoon", hex: 0x19dfc5, owned: true },
    { id: "acid_lime", name: "Acid Lime", hex: 0xb5e933, owned: true },
    { id: "crimson", name: "Crimson", hex: 0xe01b44, owned: false },
    { id: "fuchsia", name: "Fuchsia", hex: 0xe23f9c, owned: false },
    { id: "tangerine", name: "Tangerine", hex: 0xf39f21, owned: false },
    { id: "blurple", name: "Blurple", hex: 0x3d4cb8, owned: false }
];

// 3D Scene handles
let uiScene, uiCamera, uiRenderer;
let previewCharacterGroup;
let clayMaterialsArray = []; // Tracks character mesh pointers to switch colors on the fly

// Orbit interaction logic handles
let isDragging = false;
let previousMouseX = 0;
const targetRotationVelocity = 0.005;

const container = document.getElementById("avatarContainer3d");
const gridTarget = document.getElementById("textureGrid");

// Initialize execution runtime
initMarketplaceStudio();
populateCatalogUI();

function initMarketplaceStudio() {
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Standard high performance 3D studio frame configuration
    uiScene = new THREE.Scene();
    uiScene.background = new THREE.Color(0x151124);
    uiScene.fog = new THREE.FogExp2(0x151124, 0.02);

    uiCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    uiCamera.position.set(0, 1.4, 3.8); // Framed perfectly at eye level
    uiCamera.lookAt(0, 1.1, 0);

    uiRenderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    uiRenderer.setSize(width, height);
    uiRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    uiRenderer.shadowMap.enabled = true;
    uiRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(uiRenderer.domElement);

    // Dynamic dual-light balance setup for deep clay gradient shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    uiScene.add(ambientLight);

    const studioKeyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    studioKeyLight.position.set(5, 8, 4);
    studioKeyLight.castShadow = true;
    studioKeyLight.shadow.mapSize.width = 1048;
    studioKeyLight.shadow.mapSize.height = 1048;
    uiScene.add(studioKeyLight);

    // Build the clay player model directly inside menu memory
    buildShowcaseAvatar();
    setupMouseInteraction();

    window.addEventListener("resize", handleResize);
    
    // Core engine rendering loop
    const clock = new THREE.Clock();
    function renderLoop() {
        requestAnimationFrame(renderLoop);
        const elapsedTime = clock.getElapsedTime();

        // Slow cinematic idle rotation if user is not actively dragging the model
        if (!isDragging && previewCharacterGroup) {
            previewCharacterGroup.rotation.y = elapsedTime * 0.25;
        }

        // Float tracking calculations for the little companion asset
        if (previewCharacterGroup) {
            const companion = previewCharacterGroup.getObjectByName("companion");
            if (companion) {
                companion.position.y = 2.3 + Math.sin(elapsedTime * 2.8) * 0.05;
            }
        }

        uiRenderer.render(uiScene, uiCamera);
    }
    renderLoop();
}

function buildShowcaseAvatar() {
    previewCharacterGroup = new THREE.Group();
    clayMaterialsArray = []; // Flush tracking container

    // Instantiate master default texture tracker
    const sharedClayMaterial = new THREE.MeshStandardMaterial({
        color: 0xeae6df, // Default to Bone Clay
        roughness: 0.85,
        metalness: 0.05
    });
    clayMaterialsArray.push(sharedClayMaterial);

    const glossEyeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });

    // Torso Base
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.7, 16, 32), sharedClayMaterial);
    torso.position.y = 1.1;
    torso.castShadow = true;
    previewCharacterGroup.add(torso);

    // Main head geometry node
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.95;
    
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), sharedClayMaterial);
    headMesh.scale.set(1, 1.1, 1);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Cartoon vertical eyes
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), glossEyeMaterial);
    leftEye.position.set(-0.11, 0.05, 0.32);
    leftEye.scale.set(1, 1.8, 0.5);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.11;
    headGroup.add(leftEye, rightEye);
    previewCharacterGroup.add(headGroup);

    // Arms Elements
    const armGeometry = new THREE.CapsuleGeometry(0.13, 0.5, 8, 16);
    const leftArm = new THREE.Mesh(armGeometry, sharedClayMaterial);
    leftArm.position.set(-0.55, 1.1, 0);
    leftArm.castShadow = true;
    const rightArm = leftArm.clone();
    rightArm.position.x = 0.55;
    previewCharacterGroup.add(leftArm, rightArm);

    // Legs and Chunky Clay feet layout components
    const legGeometry = new THREE.CapsuleGeometry(0.16, 0.4, 8, 16);
    const footGeometry = new THREE.SphereGeometry(0.24, 32, 16);

    const buildLeg = (posX) => {
        const legGroup = new THREE.Group();
        legGroup.position.set(posX, 0.5, 0);
        
        const legMesh = new THREE.Mesh(legGeometry, sharedClayMaterial);
        legMesh.position.y = 0.1;
        legMesh.castShadow = true;

        const footMesh = new THREE.Mesh(footGeometry, sharedClayMaterial);
        footMesh.position.set(0, -0.2, 0.1);
        footMesh.scale.set(1, 0.6, 1.4);
        footMesh.castShadow = true;

        legGroup.add(legMesh, footMesh);
        return legGroup;
    };
    previewCharacterGroup.add(buildLeg(-0.25), buildLeg(0.25));

    // Floating Pet Companion Accessory (Top-right asset)
    const companionHead = new THREE.Group();
    companionHead.position.set(0.7, 2.3, -0.2);
    companionHead.scale.setScalar(0.4);
    companionHead.name = "companion";

    const compBase = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), sharedClayMaterial);
    compBase.castShadow = true;
    companionHead.add(compBase);

    const earGeometry = new THREE.CapsuleGeometry(0.08, 0.15, 8, 16);
    const compLeftEar = new THREE.Mesh(earGeometry, sharedClayMaterial);
    compLeftEar.position.set(-0.15, 0.38, 0);
    const compRightEar = compLeftEar.clone();
    compRightEar.position.x = 0.15;
    companionHead.add(compLeftEar, compRightEar);

    const compLeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), glossEyeMaterial);
    compLeftEye.position.set(-0.11, 0.02, 0.33);
    compLeftEye.scale.set(1, 1.5, 0.5);
    const compRightEye = compLeftEye.clone();
    compRightEye.position.x = 0.11;
    companionHead.add(compLeftEye, compRightEye);
    
    previewCharacterGroup.add(companionHead);
    uiScene.add(previewCharacterGroup);
}

function updateAvatarSkinColor(hexColor) {
    // Cycles through all referenced materials and updates color values live
    clayMaterialsArray.forEach(material => {
        material.color.setHex(hexColor);
    });
}

function populateCatalogUI() {
    if (!gridTarget) return;
    gridTarget.innerHTML = ""; // Clear wrapper

    SKIN_CATALOG.forEach(item => {
        const card = document.createElement("div");
        card.className = `productCard ${item.id === "bone_clay" ? "selected" : ""}`;
        card.setAttribute("data-hex", item.hex);

        // Convert the structural base hex into standard CSS rgb format strings to tint thumbnails
        const colorCSSString = `#${item.hex.toString(16).padStart(6, '0')}`;

        card.innerHTML = `
            <div class="thumbnailCircle" style="background: radial-gradient(circle at 30% 30%, #ffffff 0%, ${colorCSSString} 40%, #000000 120%);"></div>
            <div class="productCardName">${item.name}</div>
            ${!item.owned ? '<div class="lockStatusBadge">🔒</div>' : ''}
        `;

        card.addEventListener("click", () => {
            // Uncheck previous elements
            document.querySelectorAll(".productCard").forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");

            // Execute programmatic color update directly into ThreeJS scene nodes
            updateAvatarSkinColor(item.hex);
        });

        gridTarget.appendChild(card);
    });
}

function setupMouseInteraction() {
    container.addEventListener("mousedown", (e) => {
        isDragging = true;
        previousMouseX = e.clientX;
    });

    window.addEventListener("mousemove", (e) => {
        if (!isDragging || !previewCharacterGroup) return;
        const deltaX = e.clientX - previousMouseX;
        previousMouseX = e.clientX;

        // Apply mouse drag displacement value directly into object orientation rotation values
        previewCharacterGroup.rotation.y += deltaX * targetRotationVelocity;
    });

    window.addEventListener("mouseup", () => {
        isDragging = false;
    });
}

function handleResize() {
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    uiCamera.aspect = w / h;
    uiCamera.updateProjectionMatrix();
    uiRenderer.setSize(w, h);
}
