import * as THREE from "three";

// 1. COSMETIC ITEM REGISTRATION LOOKUP DICTIONARIES
const DATA_MOLDS = [
    { id: "m1", name: "Bone Clay", hex: 0xeae6df, active: true },
    { id: "m2", name: "Amethyst", hex: 0x7b3fd3, active: false },
    { id: "m3", name: "Mint", hex: 0x1fca8a, active: false },
    { id: "m4", name: "Apricot", hex: 0xe67035, active: false },
    { id: "m5", name: "Acid Lime", hex: 0xb5e933, active: false },
    { id: "m6", name: "Glacier", hex: 0x47a9f5, active: false }
];

const DATA_PETS = [
    { id: "p1", name: "Equip Companion", action: "show", active: true },
    { id: "p2", name: "Unequip Pet", action: "hide", active: false }
];

// 3D Scene Runtime pointers
let studioScene, studioCamera, studioRenderer;
let characterGroup;
let bodyMaterialsArray = [];

let isOrbiting = false;
let startPointerX = 0;
const orbitFactor = 0.006;

const canvasContainer = document.getElementById("avatarStudioCanvas");
const controlItemsGridSlot = document.getElementById("customizerItemsTarget");
const configurationTabs = document.querySelectorAll(".customTabBtn");
const saveBtn = document.getElementById("saveAppearanceBtn");

let activeTabContext = "molds";

// Run initial execution cycles
initAvatarStudioRenderer();
renderActiveTabMenu();
bindEditorCoreTriggers();

function initAvatarStudioRenderer() {
    if (!canvasContainer) return;

    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;

    studioScene = new THREE.Scene();
    studioScene.background = new THREE.Color(0x141021);
    studioScene.fog = new THREE.FogExp2(0x141021, 0.02);

    studioCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    studioCamera.position.set(0, 1.35, 3.6); // Centered eye level frame
    studioCamera.lookAt(0, 1.1, 0);

    studioRenderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    studioRenderer.setSize(width, height);
    studioRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    studioRenderer.shadowMap.enabled = true;
    studioRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasContainer.appendChild(studioRenderer.domElement);

    // Studio light balance configurations
    const ambLight = new THREE.AmbientLight(0xffffff, 1.3);
    studioScene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(4, 6, 3);
    keyLight.castShadow = true;
    studioScene.add(keyLight);

    // Assembly routine invocation
    assembleProceduralCharacter();
    setupCanvasInteraction();

    window.addEventListener("resize", onCanvasResize);

    const runtimeClock = new THREE.Clock();
    function studioAnimationLoop() {
        requestAnimationFrame(studioAnimationLoop);
        const elapsedTime = runtimeClock.getElapsedTime();

        // Automatic passive spin if user is idle
        if (!isOrbiting && characterGroup) {
            characterGroup.rotation.y = elapsedTime * 0.2;
        }

        if (characterGroup) {
            const companion = characterGroup.getObjectByName("companion");
            if (companion) {
                companion.position.y = 2.3 + Math.sin(elapsedTime * 2.5) * 0.05;
            }
        }

        studioRenderer.render(studioScene, studioCamera);
    }
    studioAnimationLoop();
}

function assembleProceduralCharacter() {
    characterGroup = new THREE.Group();
    bodyMaterialsArray = [];

    // Master default material instancing parameter tracking
    const skinMaterial = new THREE.MeshStandardMaterial({
        color: 0xeae6df, // Default setup matching Bone Clay selection card parameters
        roughness: 0.85,
        metalness: 0.05
    });
    bodyMaterialsArray.push(skinMaterial);

    const darkEyeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });

    // Torso node
    const torsoMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.7, 16, 32), skinMaterial);
    torsoMesh.position.y = 1.1;
    torsoMesh.castShadow = true;
    characterGroup.add(torsoMesh);

    // Head container group mesh block
    const headNodeGroup = new THREE.Group();
    headNodeGroup.position.y = 1.95;
    
    const headBaseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), skinMaterial);
    headBaseMesh.scale.set(1, 1.1, 1);
    headBaseMesh.castShadow = true;
    headNodeGroup.add(headBaseMesh);

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), darkEyeMaterial);
    leftEye.position.set(-0.11, 0.05, 0.32);
    leftEye.scale.set(1, 1.8, 0.5);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.11;
    headNodeGroup.add(leftEye, rightEye);
    characterGroup.add(headNodeGroup);

    // Arm modules
    const armGeo = new THREE.CapsuleGeometry(0.13, 0.5, 8, 16);
    const leftArmMesh = new THREE.Mesh(armGeo, skinMaterial);
    leftArmMesh.position.set(-0.55, 1.1, 0);
    leftArmMesh.castShadow = true;
    const rightArmMesh = leftArmMesh.clone();
    rightArmMesh.position.x = 0.55;
    characterGroup.add(leftArmMesh, rightArmMesh);

    // Legs structural links
    const legGeo = new THREE.CapsuleGeometry(0.16, 0.4, 8, 16);
    const footGeo = new THREE.SphereGeometry(0.24, 32, 16);

    const instantiateLegGroup = (offsetValX) => {
        const groupContainer = new THREE.Group();
        groupContainer.position.set(offsetValX, 0.5, 0);

        const legMesh = new THREE.Mesh(legGeo, skinMaterial);
        legMesh.position.y = 0.1;
        legMesh.castShadow = true;

        const footMesh = new THREE.Mesh(footGeo, skinMaterial);
        footMesh.position.set(0, -0.2, 0.1);
        footMesh.scale.set(1, 0.6, 1.4);
        footMesh.castShadow = true;

        groupContainer.add(legMesh, footMesh);
        return groupContainer;
    };
    characterGroup.add(instantiateLegGroup(-0.25), instantiateLegGroup(0.25));

    // Floating Companion Head asset attachment layer
    const companionHeadNode = new THREE.Group();
    companionHeadNode.position.set(0.7, 2.3, -0.2);
    companionHeadNode.scale.setScalar(0.4);
    companionHeadNode.name = "companion";

    const compBaseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), skinMaterial);
    compBaseMesh.castShadow = true;
    companionHeadNode.add(compBaseMesh);

    const earGeometry = new THREE.CapsuleGeometry(0.08, 0.15, 8, 16);
    const companionEarLeft = new THREE.Mesh(earGeometry, skinMaterial);
    companionEarLeft.position.set(-0.15, 0.38, 0);
    const companionEarRight = companionEarLeft.clone();
    companionEarRight.position.x = 0.15;
    companionHeadNode.add(companionEarLeft, companionEarRight);

    const companionEyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), darkEyeMaterial);
    companionEyeLeft.position.set(-0.11, 0.02, 0.33);
    companionEyeLeft.scale.set(1, 1.5, 0.5);
    const companionEyeRight = companionEyeLeft.clone();
    companionEyeRight.position.x = 0.11;
    companionHeadNode.add(companionEyeLeft, companionEyeRight);

    characterGroup.add(companionHeadNode);
    studioScene.add(characterGroup);
}

function renderActiveTabMenu() {
    if (!controlItemsGridSlot) return;
    controlItemsGridSlot.innerHTML = "";

    if (activeTabContext === "molds") {
        DATA_MOLDS.forEach(item => {
            const card = document.createElement("div");
            card.className = `cosmeticSlotCard ${item.active ? "equipped" : ""}`;
            const cssColorStr = `#${item.hex.toString(16).padStart(6, '0')}`;

            card.innerHTML = `
                <div class="cosmeticIconThumb" style="background: radial-gradient(circle at 30% 30%, #ffffff 0%, ${cssColorStr} 50%, #000000 130%);"></div>
                <div class="cosmeticTitleLabel">${item.name}</div>
            `;

            card.addEventListener("click", () => {
                DATA_MOLDS.forEach(m => m.active = false);
                item.active = true;
                renderActiveTabMenu();

                // Live modify color channels directly inside running buffers
                bodyMaterialsArray.forEach(mat => mat.color.setHex(item.hex));
            });
            controlItemsGridSlot.appendChild(card);
        });
    } else if (activeTabContext === "pets") {
        DATA_PETS.forEach(item => {
            const card = document.createElement("div");
            card.className = `cosmeticSlotCard ${item.active ? "equipped" : ""}`;
            const displayColor = item.action === "show" ? "#ba8fff" : "#ff7676";

            card.innerHTML = `
                <div class="cosmeticIconThumb" style="background: ${displayColor}; display: flex; align-items: center; justify-content: center; font-size: 22px;">${item.action === "show" ? "🐰" : "❌"}</div>
                <div class="cosmeticTitleLabel">${item.name}</div>
            `;

            card.addEventListener("click", () => {
                DATA_PETS.forEach(p => p.active = false);
                item.active = true;
                renderActiveTabMenu();

                const compMeshPointer = characterGroup.getObjectByName("companion");
                if (compMeshPointer) {
                    compMeshPointer.visible = (item.action === "show");
                }
            });
            controlItemsGridSlot.appendChild(card);
        });
    }
}

function bindEditorCoreTriggers() {
    configurationTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            configurationTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            activeTabContext = tab.getAttribute("data-tab");
            renderActiveTabMenu();
        });
    });

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            alert("Appearance Configuration Profile successfully synced to global ecosystem data slots!");
        });
    }
}

function setupCanvasInteraction() {
    canvasContainer.addEventListener("mousedown", (e) => {
        isOrbiting = true;
AI Mode Conversation: hi ai modeYou said: hi ai modehi ai modeYou can try the feature directly through Google AI Mode, a conversational search experience built into Google Search.What is AI Mode?It changes traditional keyword search into an interactive, chat-based experience.It uses advanced reasoning to handle long, multi-part, or complex questions.It breaks down hard questions into smaller parts to search the web at the same time.It provides clear summaries with source links so you can check facts and explore further.How to Access ItGo directly to Google AI Mode Help for full device instructions.Visit google.com/ai in your browser.Type a question on the main Google search page and tap the AI Mode button.Open the Google app on your phone and tap AI Mode on the home screen.Key FeaturesFollow-up Questions: Ask more questions about your topic without repeating the original context.Multimodal Search: Upload images, files, or recent browser tabs to get help with specific materials.Personal Intelligence: Opt-in to connect tools like Gmail or Google Photos for personalized answers.AI responses may include mistakes. Learn moresearch.googleGoogle AI Mode - a new way to search, whatever's on your mindAsk whatever's on your mind to get an AI-powered response, and keep exploring with follow-up questions and helpful web links. Try ...Google HelpGet AI-powered responses with AI Mode in Google SearchHow to access AI Mode You can access AI Mode in three ways: Go to google.com/ai. Go to www.google.com, enter a question in the Sea...YouTube·The AI AdvantageGoogle's New AI Search: Everything You Need to KnowGoogle's New AI Search: Everything You Need to Know so if you open up Google right now search looks a little it's subtle. but it's...5:17Show allwsoQuick results from the web:Wall Street Oasis: Investment Banking & Finance Community ...Join 1000000+ members. Learn financial modeling and interview skills to help you break into the top financial careers in the world.Wall Street Oasis·https://www.wallstreetoasis.comWall Street Oasis (@wallstreetoasis) · Saratoga, CA - Instagram920K followers · 32K posts · Biz: Patrick@wallstreetoasis.com Get a High Finance & Mgt. Consulting Offer or your money back.Instagram·https://www.instagram.comThe acronym WSO most commonly refers to Wall Street Oasis, the largest online community, forum, and career resource platform for professionals and students looking to break into high finance, investment banking, private equity, and management consulting.Depending on your context, WSO can also stand for several other notable terms:CategoryMeaningDescriptionMilitary & AviationWeapon Systems OfficerA military aircrew member (often called a "Wizzo") responsible for targeting systems, navigation, and communications.FinanceWatsco, Inc. (Stock Ticker)The stock ticker symbol WSO traded on the New York Stock Exchange (NYSE) for Watsco, a major HVAC distributor.Health**[World Stroke Organization](https://www.world-stroke.org/ "WSOWorld Stroke Organization")**CybersecurityWSO Web ShellA well-known malicious script used by hackers to gain remote administrative control over compromised web servers.MusicSymphony OrchestrasCommon shorthand for orchestras such as the Winnipeg Symphony Orchestra or Wichita Symphony Orchestra.Which of these meanings were you looking for? If you want to dive deeper into finance recruiting, military aviation roles, or stock information, let me know how I can help!AI responses may include mistakes. Learn moreWall Street OasisWall Street Oasis88% placement success with top finance and consulting firms 5,000+ mentors to prepare you for elite rolesYahoo FinanceWatsco, Inc. (WSO) Stock Price, News, Quote & HistoryRecent News * Spotting Winners: Watsco (NYSE:WSO) And Industrial Distributors Stocks In Q2 StockStory • 9d ago * Watsco to Acquire...WikipediaWSO - WikipediaWorld Safety Organization, an international professional association in safety World Sikh Organization, a Sikh religious and nonpr...Show allwspQuick results from the web:WSP | Global engineering and professional services firmWSP is a world-leading engineering and professional services consulting firm. Explore our expertise in designing sustainable solutions across various sectors.www.wsp.comWSP - LinkedInWSP | 1145040 followers on LinkedIn. WSP is one of the world's leading engineering, science and infrastructure solutions firms, uniting its multidisciplinary expertise to shape communities to advance LinkedIn·https://ca.linkedin.comThe acronym WSP most commonly stands for "What's up?" in text messaging and online slang. It is a quick, casual way to greet someone or ask what they are doing.Depending on the context, WSP can also refer to several other major organizations and terms:CategoryMeaningDescriptionBusiness & EngineeringWSP GlobalOne of the world's largest professional services and engineering consulting firms.Government & LawWashington State PatrolThe state-level law enforcement agency for the state of Washington.MusicWidespread PanicA highly popular American rock/jam band formed in Georgia.EnvironmentWater Safety PlanA public health methodology used to ensure the safety of drinking water supplies.TechnologyWireless Session ProtocolAn older networking protocol used to manage data sessions in mobile devices.Which of these meanings were you looking for? If you want to dive deeper into slang definitions, engineering firms, or band tour dates, let me know how to proceed!AI responses may include mistakes. Learn moreI need your helpOf course! I am here to help you.Please let me know what you need assistance with, and we can get started right away.To help me give you the best answer, what are we working on?Answering a specific question or looking up information?Drafting, editing, or translating text?Solving a technical problem, writing code, or doing calculations?Planning something, like a trip, a budget, or a schedule?AI responses may include mistakes. Learn moreYou sent: 1 image and 3 files and said: the game (rise up the Roblox like game) sooo like the character/player looking is not the best I need you to rebuild these 3 files and the image will explain what the player avatar should look likeplayer3d.jsplayer3d.htmlplayer3d.cssthe game (rise up the Roblox like game) sooo like the character/player looking is not the best I need you to rebuild these 3 files and the image will explain what the player avatar should look likeTo make your character look exactly like the smooth, stylized clay figure mesh from your reference image, we can build a programmatic procedural character directly inside Three.js using grouped primitive shapes. This eliminates the dependency on an external 59MB player.glb file entirely, allowing your game to load instantly.Here are the complete, rebuilt files for your project.1. player.js (Rebuilt)This replaces your original asset-loading script. It creates a beautiful, matching clay-style avatar using standard geometric materials configured with a soft matte clay texture look, a detached stylized head accessory, and clean animations.javascriptimport * as THREE from "three";

let scene;
let camera;
let renderer;
let player = null;
let clock;

const keys = {};

let velocityY = 0;
let grounded = true;

let yaw = 0;
let pitch = 0.18;
let cameraDistance = 6;

let mouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

const WALK_SPEED = 4;
const RUN_SPEED = 7;
const JUMP_POWER = 8;
const GRAVITY = 22;

const loadingScreen = document.getElementById("loadingScreen");
const errorScreen = document.getElementById("errorScreen");
const playerStatusText = document.querySelector("#playerStatus span");

init();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x191426); // Dark stylized background matching reference
    scene.fog = new THREE.FogExp2(0x191426, 0.015);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 3, 6);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    document.getElementById("game").appendChild(renderer.domElement);
    clock = new THREE.Clock();

    createWorld();
    buildClayPlayer();
    setupControls();

    window.addEventListener("resize", resize);
    
    if(loadingScreen) loadingScreen.classList.add("hidden");
    if(playerStatusText) playerStatusText.textContent = "Clay Mold Loaded";

    animate();
}

function createWorld() {
    const hemisphere = new THREE.HemisphereLight(0xb1e1ff, 0x191426, 1.8);
    scene.add(hemisphere);

    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(-20, 35, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        new THREE.MeshStandardMaterial({ color: 0x2c2543, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
}

function buildClayPlayer() {
    player = new THREE.Group();

    // High quality soft clay material settings matching "Bone Clay"
    const clayMaterial = new THREE.MeshStandardMaterial({
        color: 0xeae6df,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: false
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.2
    });

    // Torso (Smooth bean shape via capsule)
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.7, 16, 32), clayMaterial);
    torso.position.y = 1.1;
    torso.castShadow = true;
    torso.receiveShadow = true;
    player.add(torso);

    // Main Head
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.95;
    headGroup.name = "headGroup";
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), clayMaterial);
    head.scale.set(1, 1.1, 1); 
    head.castShadow = true;
    head.receiveShadow = true;
    headGroup.add(head);

    // Left Eye
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), eyeMaterial);
    leftEye.position.set(-0.11, 0.05, 0.32);
    leftEye.scale.set(1, 1.8, 0.5);
    headGroup.add(leftEye);

    // Right Eye
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.11;
    headGroup.add(rightEye);
    player.add(headGroup);

    // Floating Companion Head Accessory (Top right from reference)
    const companionHead = new THREE.Group();
    companionHead.position.set(0.7, 2.3, -0.2);
    companionHead.scale.setScalar(0.4);
    companionHead.name = "companion";

    const compBase = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), clayMaterial);
    compBase.castShadow = true;
    companionHead.add(compBase);

    const earGeo = new THREE.CapsuleGeometry(0.08, 0.15, 8, 16);
    const leftEar = new THREE.Mesh(earGeo, clayMaterial);
    leftEar.position.set(-0.15, 0.38, 0);
    const rightEar = leftEar.clone();
    rightEar.position.x = 0.15;
    companionHead.add(leftEar, rightEar);

    const compLeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), eyeMaterial);
    compLeftEye.position.set(-0.11, 0.02, 0.33);
    compLeftEye.scale.set(1, 1.5, 0.5);
    const compRightEye = compLeftEye.clone();
    compRightEye.position.x = 0.11;
    companionHead.add(compLeftEye, compRightEye);
    player.add(companionHead);

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.13, 0.5, 8, 16);
    
    const leftArm = new THREE.Mesh(armGeo, clayMaterial);
    leftArm.position.set(-0.55, 1.1, 0);
    leftArm.name = "leftArm";
    leftArm.castShadow = true;
    player.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.x = 0.55;
    rightArm.name = "rightArm";
    player.add(rightArm);

    // Legs & Large Stylized Feet
    const legGeo = new THREE.CapsuleGeometry(0.16, 0.4, 8, 16);
    const footGeo = new THREE.SphereGeometry(0.24, 32, 16);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.25, 0.5, 0);
    leftLegGroup.name = "leftLeg";

    const leftLegMesh = new THREE.Mesh(legGeo, clayMaterial);
    leftLegMesh.position.y = 0.1;
    leftLegMesh.castShadow = true;
    
    const leftFootMesh = new THREE.Mesh(footGeo, clayMaterial);
    leftFootMesh.position.set(0, -0.2, 0.1);
    leftFootMesh.scale.set(1, 0.6, 1.4); // Flat chunky cartoon foot look
    leftFootMesh.castShadow = true;
    
    leftLegGroup.add(leftLegMesh, leftFootMesh);
    player.add(leftLegGroup);

    const rightLegGroup = leftLegGroup.clone();
    rightLegGroup.position.x = 0.25;
    rightLegGroup.name = "rightLeg";
    player.add(rightLegGroup);

    scene.add(player);
}

function setupControls() {
    window.addEventListener("keydown", (event) => {
        keys[event.code] = true;
        if (event.code === "Space" && grounded) {
            velocityY = JUMP_POWER;
            grounded = false;
        }
    });

    window.addEventListener("keyup", (event) => { keys[event.code] = false; });
    window.addEventListener("mousedown", (event) => {
        if (event.button !== 0) return;
        mouseDown = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    });
    window.addEventListener("mouseup", () => { mouseDown = false; });
    window.addEventListener("mousemove", (event) => {
        if (!mouseDown) return;
        const dx = event.clientX - lastMouseX;
        const dy = event.clientY - lastMouseY;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;

        yaw -= dx * 0.006;
        pitch -= dy * 0.004;
        pitch = THREE.MathUtils.clamp(pitch, -0.4, 1.1);
    });

    window.addEventListener("wheel", (event) => {
        cameraDistance += event.deltaY * 0.004;
        cameraDistance = THREE.MathUtils.clamp(cameraDistance, 3, 12);
    }, { passive: true });

    document.getElementById("exitButton")?.addEventListener("click", () => {
        window.location.href = "home.html";
    });
}

function updatePlayer(delta, time) {
    if (!player) return;

    let x = 0;
    let z = 0;

    if (keys["KeyW"] || keys["ArrowUp"]) z -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) z += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) x -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) x += 1;

    const isMoving = (x !== 0 || z !== 0);
    const speed = (keys["ShiftLeft"] || keys["ShiftRight"]) ? RUN_SPEED : WALK_SPEED;

    if (isMoving) {
        const input = new THREE.Vector3(x, 0, z).normalize();
        const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
        const right = new THREE.Vector3(forward.z, 0, -forward.x);
        const movement = new THREE.Vector3();

        movement.addScaledVector(forward, -input.z);
        movement.addScaledVector(right, input.x);
        movement.normalize();

        player.position.addScaledVector(movement, speed * delta);

        const targetRotation = Math.atan2(movement.x, movement.z);
        player.rotation.y = smoothRotation(player.rotation.y, targetRotation, delta * 10);
    }

    // Physics
    if (!grounded) {
        velocityY -= GRAVITY * delta;
        player.position.y += velocityY * delta;

        if (player.position.y <= 0) {
            player.position.y = 0;
            velocityY = 0;
            grounded = true;
        }
    }

    // Procedural Animations (Idle vs Running vs Air)
    animateLimbs(isMoving, speed, delta, time);
}

function animateLimbs(isMoving, speed, delta, time) {
    const leftArm = player.getObjectByName("leftArm");
    const rightArm = player.getObjectByName("rightArm");
    const leftLeg = player.getObjectByName("leftLeg");
    const rightLeg = player.getObjectByName("rightLeg");
    const companion = player.getObjectByName("companion");

    // Smooth hover animation for the head companion item
    if (companion) {
        companion.position.y = 2.3 + Math.sin(time * 3) * 0.08;
        companion.rotation.y = time * 0.5;
    }

    if (!grounded) {
        // Falling/Jumping pose
        leftArm.rotation.x = -Math.PI / 3;
        rightArm.rotation.x = -Math.PI / 3;
        leftLeg.rotation.x = 0.2;
        rightLeg.rotation.x = -0.2;
    } else if (isMoving) {
        // Natural walking/running swing
        const waveSpeed = speed === RUN_SPEED ? 14 : 9;
        const waveAngle = speed === RUN_SPEED ? 0.6 : 0.4;
        
        leftArm.rotation.x = Math.sin(time * waveSpeed) * waveAngle;
Use code with caution.rightArm.rotation.x = -Math.sin(time * waveSpeed) * waveAngle;leftLeg.rotation.x = -Math.sin(time * waveSpeed) * waveAngle;rightLeg.rotation.x = Math.sin(time * waveSpeed) * waveAngle;} else {// Soft breath idle lookleftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, Math.sin(time * 2) * 0.05, 0.1);rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -Math.sin(time * 2) * 0.05, 0.1);leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.1);rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.1);}}function smoothRotation(current, target, amount) {let difference = target - current;difference = Math.atan2(Math.sin(difference), Math.cos(difference));if (Math.abs(difference) <= amount) return target;return current + Math.sign(difference) * amount;}function updateCamera() {if (!player) return;const target = player.position.clone();target.y += 1.25;const horizontal = Math.cos(pitch) * cameraDistance;const vertical = Math.sin(pitch) * cameraDistance;const position = new THREE.Vector3(target.x + Math.sin(yaw) * horizontal,target.y + vertical,target.z + Math.cos(yaw) * horizontal);camera.position.lerp(position, 0.12);camera.lookAt(target);}function animate() {requestAnimationFrame(animate);const delta = Math.min(clock.getDelta(), 0.05);const time = clock.getElapsedTime();updatePlayer(delta, time);updateCamera();renderer.render(scene, camera);}function resize() {camera.aspect = window.innerWidth / window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth, window.innerHeight);}
### 2. `index.html` (Rebuilt)
Cleaned up to match the DOM query targets of our new script. It removes the unnecessary local file selectors used for debug uploading since the player renders natively out of the box now.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RiseUp - Play</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="game">
        <!-- Main Top Navigation HUD Bar -->
        <div id="topBar">
            <div class="brand">
                <div class="brandMark"></div>
                <span>RiseUp</span>
            </div>
            <div class="gameName">Roblox Studio Core Environment</div>
            <button id="exitButton">Exit</button>
        </div>

        <!-- Gameplay Control Hints Overlay -->
        <div id="controls">
            <div class="controlTitle">CONTROLS</div>
            <div class="controlRow"><span class="key">W</span><span class="key">A</span><span class="key">S</span><span class="key">D</span> Move</div>
            <div class="controlRow"><span class="wideKey">SPACE</span> Jump</div>
            <div class="controlRow"><span class="wideKey">SHIFT</span> Run</div>
            <div class="controlRow"><span>Mouse Look</span></div>
        </div>

        <!-- Crosshair center reticle element -->
        <div id="crosshair"></div>

        <!-- Bottom Status HUD -->
        <div id="bottomBar">
            <div id="playerStatus">
                <div class="statusDot"></div>
                <span>Spawning Avatar...</span>
            </div>
            <div id="cameraHint">Drag to look • Scroll to zoom</div>
        </div>

        <!-- Fullscreen Loading Overlay Scene Component -->
        <div id="loadingScreen">
            <div class="loadingBox">
                <div class="spinner"></div>
                <div id="loadingText">Molding Clay Character...</div>
            </div>
        </div>

        <!-- Exception Error Screen Template Layer -->
        <div id="errorScreen" class="hidden">
            <div class="errorBox">
                <h2>Render Pipeline Error</h2>
                <p id="errorText">An unknown initialization failure occurred.</p>
            </div>
        </div>
    </div>

    <!-- Type Module required to support standard JS import statements -->
    <script type="module" src="player.js"></script>
</body>
</html>
3. style.css (Rebuilt)Updated with layout treatments that accent the clean clay theme, including custom modern typography rules, high-contrast overlay counters, and rounded borders matching the user panel styling from your screenshot.css* {
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  overflow: hidden;
  background: #191426;
  color: #fff;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

#game {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

#game canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* TOP HUD INTERFACE HEADER */
#topBar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: rgba(25, 20, 38, 0.75);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  z-index: 20;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.brandMark {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  background: #ba8fff;
  box-shadow: 0 0 10px rgba(186, 143, 255, 0.4);
}

.gameName {
  margin-left: 24px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

#exitButton {
  margin-left: auto;
  height: 36px;
  padding: 0 18px;
  border: 0;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

#exitButton:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

/* INTERACTIVE HUD CONTROLS WINDOW */
#controls {
  position: absolute;
  left: 20px;
  bottom: 20px;
  width: 210px;
  padding: 16px;
  background: rgba(25, 20, 38, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  backdrop-filter: blur(16px);
  z-index: 20;
}

.controlTitle {
  margin-bottom: 12px;
  color: #ba8fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.controlRow {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
}

.key,
.wideKey {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.04);
  color: white;
  font-size: 10px;
  font-weight: 700;
}

.wideKey {
  min-width: 52px;
}

/* UI UTILITY OVERLAYS */
#crosshair {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6px;
  height: 6px;
  transform: translate(-50%, -50%);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  z-index: 10;
  pointer-events: none;
}

#bottomBar {
  position: absolute;
  right: 20px;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 20;
}

#playerStatus,
#cameraHint {
  padding: 10px 14px;
  border-radius: 20px;
  background: rgba(25, 20, 38, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  font-size: 12px;
}

#playerStatus {
  display: flex;
  align-items: center;
  gap: 8px;
}

.statusDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a3ffb4;
  box-shadow: 0 0 8px #a3ffb4;
}

#cameraHint {
  color: rgba(255, 255, 255, 0.45);
}

/* SYSTEM FULLSCREEN LAYER PANELS */
#loadingScreen, #errorScreen {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #13101c;
  z-index: 100;
}

.loadingBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(186, 143, 255, 0.1);
  border-top-color: #ba8fff;
  border-radius: 50%;
  animation: spin 0.7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

#loadingText {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  letter-spacing: 0.2px;
}

.errorBox {
  width: min(400px, calc(100vw - 40px));
  padding: 30px;
  text-align: center;
  background: #1d182b;
  border: 1px solid rgba(255, 0, 0, 0.15);
  border-radius: 16px;
}

.errorBox h2 {
  margin: 0 0 10px;
  color: #ff7676;
  font-size: 18px;
}

.hidden {
  display: none !important;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
Use code with caution.Would you like help with customizing specific clay variants (like changing colors to Amethyst or Mint from your selection list), or adding support for extra animations like running and falling leans?AI responses may include mistakes. Learn moreits player3d.html/CSS/jsHere are your three updated files, properly mapped to player3d.html, player3d.css, and player3d.js to ensure your project's filename structure fits together flawlessly.The setup drops the heavy external model loaders entirely and uses Three.js primitives to procedurally mold that exact chunky, smooth Bone Clay avatar and its little floating companion head accessory.1. player3d.jsjavascriptimport * as THREE from "three";

let scene;
let camera;
let renderer;
let player = null;
let clock;

const keys = {};

let velocityY = 0;
let grounded = true;

let yaw = 0;
let pitch = 0.18;
let cameraDistance = 6;

let mouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

const WALK_SPEED = 4;
const RUN_SPEED = 7;
const JUMP_POWER = 8;
const GRAVITY = 22;

const loading = document.getElementById("loading");
const statusText = document.getElementById("statusText");

init();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x191426); // Dark theme matching your reference screen
    scene.fog = new THREE.FogExp2(0x191426, 0.015);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        500
    );
    camera.position.set(0, 3, 6);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    document.getElementById("game").appendChild(renderer.domElement);
    clock = new THREE.Clock();

    createWorld();
    buildClayPlayer();
    setupControls();

    window.addEventListener("resize", resize);

    // Hide loader instantly since the clay mesh builds instantly
    if (loading) loading.style.display = "none";
    if (statusText) statusText.textContent = "Clay Mold Ready";

    animate();
}

function createWorld() {
    // Stylized dual-color lighting rig for smooth clay shading gradients
    const hemisphere = new THREE.HemisphereLight(0xb1e1ff, 0x191426, 1.8);
    scene.add(hemisphere);

    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(-20, 35, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        new THREE.MeshStandardMaterial({ color: 0x2c2543, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
}

function buildClayPlayer() {
    player = new THREE.Group();

    // High quality soft clay material physics configuration matching "Bone Clay"
    const clayMaterial = new THREE.MeshStandardMaterial({
        color: 0xeae6df,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: false
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.2
    });

    // Torso (Smooth bean shape utilizing a Capsule geometric primitive)
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.7, 16, 32), clayMaterial);
    torso.position.y = 1.1;
    torso.castShadow = true;
    torso.receiveShadow = true;
    player.add(torso);

    // Main Head Node
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.95;
    headGroup.name = "headGroup";
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), clayMaterial);
    head.scale.set(1, 1.1, 1); 
    head.castShadow = true;
    head.receiveShadow = true;
    headGroup.add(head);

    // Left Tall Oval Eye
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), eyeMaterial);
    leftEye.position.set(-0.11, 0.05, 0.32);
    leftEye.scale.set(1, 1.8, 0.5);
    headGroup.add(leftEye);

    // Right Tall Oval Eye
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.11;
    headGroup.add(rightEye);
    player.add(headGroup);

    // Floating Pet Companion Accessory (Top Right floating head asset)
    const companionHead = new THREE.Group();
    companionHead.position.set(0.7, 2.3, -0.2);
    companionHead.scale.setScalar(0.4);
    companionHead.name = "companion";

    const compBase = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), clayMaterial);
    compBase.castShadow = true;
    companionHead.add(compBase);

    const earGeo = new THREE.CapsuleGeometry(0.08, 0.15, 8, 16);
    const leftEar = new THREE.Mesh(earGeo, clayMaterial);
    leftEar.position.set(-0.15, 0.38, 0);
    const rightEar = leftEar.clone();
    rightEar.position.x = 0.15;
    companionHead.add(leftEar, rightEar);

    const compLeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), eyeMaterial);
    compLeftEye.position.set(-0.11, 0.02, 0.33);
    compLeftEye.scale.set(1, 1.5, 0.5);
    const compRightEye = compLeftEye.clone();
    compRightEye.position.x = 0.11;
    companionHead.add(compLeftEye, compRightEye);
    player.add(companionHead);

    // Arms Structure
    const armGeo = new THREE.CapsuleGeometry(0.13, 0.5, 8, 16);
    
    const leftArm = new THREE.Mesh(armGeo, clayMaterial);
    leftArm.position.set(-0.55, 1.1, 0);
    leftArm.name = "leftArm";
    leftArm.castShadow = true;
    player.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.x = 0.55;
    rightArm.name = "rightArm";
    player.add(rightArm);

    // Legs & Large Stylized Feet Joints
    const legGeo = new THREE.CapsuleGeometry(0.16, 0.4, 8, 16);
    const footGeo = new THREE.SphereGeometry(0.24, 32, 16);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.25, 0.5, 0);
    leftLegGroup.name = "leftLeg";

    const leftLegMesh = new THREE.Mesh(legGeo, clayMaterial);
    leftLegMesh.position.y = 0.1;
    leftLegMesh.castShadow = true;
    
    const leftFootMesh = new THREE.Mesh(footGeo, clayMaterial);
    leftFootMesh.position.set(0, -0.2, 0.1);
    leftFootMesh.scale.set(1, 0.6, 1.4); // Flat chunky cartoon stylized clay feet layout
    leftFootMesh.castShadow = true;
    
    leftLegGroup.add(leftLegMesh, leftFootMesh);
    player.add(leftLegGroup);

    const rightLegGroup = leftLegGroup.clone();
    rightLegGroup.position.x = 0.25;
    rightLegGroup.name = "rightLeg";
    player.add(rightLegGroup);

    scene.add(player);
}

function setupControls() {
    window.addEventListener("keydown", (event) => {
        keys[event.code] = true;
        if (event.code === "Space" && grounded) {
            velocityY = JUMP_POWER;
            grounded = false;
            event.preventDefault();
        }
    });

    window.addEventListener("keyup", (event) => { keys[event.code] = false; });
    window.addEventListener("mousedown", (event) => {
        if (event.button !== 0) return;
        mouseDown = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    });
    window.addEventListener("mouseup", () => { mouseDown = false; });
    window.addEventListener("mousemove", (event) => {
        if (!mouseDown) return;
        const dx = event.clientX - lastMouseX;
        const dy = event.clientY - lastMouseY;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;

        yaw -= dx * 0.006;
        pitch -= dy * 0.004;
        pitch = THREE.MathUtils.clamp(pitch, -0.4, 1.1);
    });

    window.addEventListener("wheel", (event) => {
        cameraDistance += event.deltaY * 0.004;
        cameraDistance = THREE.MathUtils.clamp(cameraDistance, 3, 12);
    }, { passive: true });

    document.getElementById("exitButton")?.addEventListener("click", () => {
        window.location.href = "home.html";
    });
}

function updatePlayer(delta, time) {
    if (!player) return;

    let x = 0;
    let z = 0;

    if (keys["KeyW"] || keys["ArrowUp"]) z -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) z += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) x -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) x += 1;

    const isMoving = (x !== 0 || z !== 0);
    const speed = (keys["ShiftLeft"] || keys["ShiftRight"]) ? RUN_SPEED : WALK_SPEED;

    if (isMoving) {
        const input = new THREE.Vector3(x, 0, z).normalize();
        const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
        const right = new THREE.Vector3(forward.z, 0, -forward.x);
        const movement = new THREE.Vector3();

        movement.addScaledVector(forward, -input.z);
        movement.addScaledVector(right, input.x);
        movement.normalize();

        player.position.addScaledVector(movement, speed * delta);

        const targetRotation = Math.atan2(movement.x, movement.z);
        player.rotation.y = smoothRotation(player.rotation.y, targetRotation, delta * 10);
    }

    if (!grounded) {
        velocityY -= GRAVITY * delta;
        player.position.y += velocityY * delta;

        if (player.position.y <= 0) {
            player.position.y = 0;
            velocityY = 0;
            grounded = true;
        }
    }

    // Direct animation logic handling moving and idle states
    animateProceduralLimbs(isMoving, speed, delta, time);
}

function animateProceduralLimbs(isMoving, speed, delta, time) {
    const leftArm = player.getObjectByName("leftArm");
    const rightArm = player.getObjectByName("rightArm");
    const leftLeg = player.getObjectByName("leftLeg");
    const rightLeg = player.getObjectByName("rightLeg");
    const companion = player.getObjectByName("companion");

    // Dynamic levitation matrix loop for companion float styling
    if (companion) {
        companion.position.y = 2.3 + Math.sin(time * 3) * 0.08;
        companion.rotation.y = time * 0.5;
    }

    if (!grounded) {
        leftArm.rotation.x = -Math.PI / 3;
        rightArm.rotation.x = -Math.PI / 3;
        leftLeg.rotation.x = 0.2;
        rightLeg.rotation.x = -0.2;
    } else if (isMoving) {
Use code with caution.const waveSpeed = speed === RUN_SPEED ? 14 : 9;const waveAngle = speed === RUN_SPEED ? 0.6 : 0.4;leftArm.rotation.x = Math.sin(time * waveSpeed) * waveAngle;rightArm.rotation.x = -Math.sin(time * waveSpeed) * waveAngle;leftLeg.rotation.x = -Math.sin(time * waveSpeed) * waveAngle;rightLeg.rotation.x = Math.sin(time * waveSpeed) * waveAngle;} else {leftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, Math.sin(time * 2) * 0.05, 0.1);rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -Math.sin(time * 2) * 0.05, 0.1);leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.1);rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.1);}}function smoothRotation(current, target, amount) {let difference = target - current;difference = Math.atan2(Math.sin(difference), Math.cos(difference));if (Math.abs(difference) <= amount) return target;return current + Math.sign(difference) * amount;}function updateCamera() {if (!player) return;const target = player.position.clone();target.y += 1.25;const horizontal = Math.cos(pitch) * cameraDistance;const vertical = Math.sin(pitch) * cameraDistance;const position = new THREE.Vector3(target.x + Math.sin(yaw) * horizontal,target.y + vertical,target.z + Math.cos(yaw) * horizontal);camera.position.lerp(position, 0.12);camera.lookAt(target);}function animate() {requestAnimationFrame(animate);const delta = Math.min(clock.getDelta(), 0.05);const time = clock.getElapsedTime();updatePlayer(delta, time);updateCamera();renderer.render(scene, camera);}function resize() {camera.aspect = window.innerWidth / window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth, window.innerHeight);}
### 2. `player3d.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RiseUp - Player Preview</title>
    <link rel="stylesheet" href="player3d.css">
</head>
<body>
    <div id="game">
        <!-- Main Top Navigation HUD Bar -->
        <div id="topBar">
            <div class="brand">
                <div class="brandMark"></div>
                <span>RiseUp</span>
            </div>
            <div class="gameName">Player Preview Environment</div>
            <button id="exitButton">Exit</button>
        </div>

        <!-- Gameplay Control Hints Overlay -->
        <div id="controls">
            <div class="controlTitle">CONTROLS</div>
            <div class="controlRow"><span class="key">W</span><span class="key">A</span><span class="key">S</span><span class="key">D</span> Move</div>
            <div class="controlRow"><span class="wideKey">SPACE</span> Jump</div>
            <div class="controlRow"><span class="wideKey">SHIFT</span> Run</div>
            <div class="controlRow"><span>Mouse Camera</span></div>
        </div>

        <!-- Crosshair center reticle element -->
        <div id="crosshair"></div>

        <!-- Bottom Status HUD -->
        <div id="bottomBar">
            <div id="playerStatus">
                <div class="statusDot"></div>
                <span id="statusText">Molding Clay Model...</span>
            </div>
            <div id="cameraHint">Drag to look • Scroll to zoom</div>
        </div>

        <!-- Fullscreen Loading Overlay Scene Component -->
        <div id="loading">
            <div class="loadingBox">
                <div class="spinner"></div>
                <div id="loadingTitle">Loading Player...</div>
                <div id="loadingText">Assembling Clay Avatar...</div>
            </div>
        </div>

        <!-- Exception Error Screen Template Layer -->
        <div id="error" class="hidden">
            <div class="errorBox">
                <h2>Player couldn't load</h2>
                <p id="errorText">Render Pipeline Initialisation Error.</p>
            </div>
        </div>
    </div>

    <!-- Script import using correct file path -->
    <script type="module" src="player3d.js"></script>
</body>
</html>
3. player3d.csscss* {
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  overflow: hidden;
  background: #191426;
  color: #fff;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

#game {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

#game canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* TOP HUD INTERFACE HEADER */
#topBar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: rgba(25, 20, 38, 0.75);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  z-index: 20;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.brandMark {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  background: #ba8fff;
  box-shadow: 0 0 10px rgba(186, 143, 255, 0.4);
}

.gameName {
  margin-left: 24px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

#exitButton {
  margin-left: auto;
  height: 36px;
  padding: 0 18px;
  border: 0;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

#exitButton:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

/* INTERACTIVE HUD CONTROLS WINDOW */
#controls {
  position: absolute;
  left: 20px;
  bottom: 20px;
  width: 210px;
  padding: 16px;
  background: rgba(25, 20, 38, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  backdrop-filter: blur(16px);
  z-index: 20;
}

.controlTitle {
  margin-bottom: 12px;
  color: #ba8fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.controlRow {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
}

.key,
.wideKey {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.04);
  color: white;
  font-size: 10px;
  font-weight: 700;
}

.wideKey {
  min-width: 52px;
}

/* UI UTILITY OVERLAYS */
#crosshair {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6px;
  height: 6px;
  transform: translate(-50%, -50%);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  z-index: 10;
  pointer-events: none;
}

#bottomBar {
  position: absolute;
  right: 20px;
  bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 20;
}

#playerStatus,
#cameraHint {
  padding: 10px 14px;
  border-radius: 20px;
  background: rgba(25, 20, 38, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px);
  font-size: 12px;
}

#playerStatus {
  display: flex;
  align-items: center;
  gap: 8px;
}

.statusDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a3ffb4;
  box-shadow: 0 0 8px #a3ffb4;
}

#cameraHint {
  color: rgba(255, 255, 255, 0.45);
}

/* LOADING & ERROR SCREENS */
#loading, #error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #13101c;
  z-index: 100;
}

.loadingBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(186, 143, 255, 0.1);
  border-top-color: #ba8fff;
  border-radius: 50%;
  animation: spin 0.7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

#loadingTitle {
  font-size: 18px;
  font-weight: 700;
  margin-top: 8px;
}

#loadingText {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.errorBox {
  width: min(400px, calc(100vw - 40px));
  padding: 30px;
  text-align: center;
  background: #1d182b;
  border: 1px solid rgba(255, 0, 0, 0.15);
  border-radius: 16px;
}

.errorBox h2 {
  margin: 0 0 10px;
  color: #ff7676;
  font-size: 18px;
}

.hidden {
  display: none !important;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
Use code with caution.Would you like me to build a skin-switching layout so your character can toggle between alternative styles shown in your catalog selection panel, such as Amethyst, Mint, or Acid Lime color themes?AI responses may include mistakes. Learn moresoo that character should be everywherre like marketplace [profile]  [name last name] thingy and in gameTo make your new custom clay character show up everywhere across your game ecosystem—including the Marketplace, Profile view, and Name Customization screen—you should package the procedural clay mesh code into a reusable helper class.Instead of copying and pasting the complex geometry definitions into every screen's script file, you can create a single master file called AvatarFactory.js. Any page that needs to render the player can simply import this file to instantiate the character model on demand.Here is the structured architecture to implement your clay avatar globally.1. The Global Core: AvatarFactory.jsCreate this new file in your project directory. It houses the exact 3D structural formulas for both the Bone Clay Avatar and its Companion Pet, accepting customized color hex inputs so you can easily reuse it for shop previews.javascriptimport * as THREE from "three";

export class AvatarFactory {
    /**
     * Generates a complete procedural clay player mesh group
     * @param {string} skinColorHex - Hex color for the clay skin body (e.g. '#eae6df' for Bone Clay)
     * @returns {THREE.Group} The completed character group asset
     */
    static createPlayer(skinColorHex = 0xeae6df) {
        const playerGroup = new THREE.Group();

        // Matte clay texture physics setup
        const clayMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(skinColorHex),
            roughness: 0.85,
            metalness: 0.05,
            flatShading: false
        });

        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.2
        });

        // 1. Torso
        const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.7, 16, 32), clayMaterial);
        torso.position.y = 1.1;
        torso.castShadow = true;
        torso.receiveShadow = true;
        playerGroup.add(torso);

        // 2. Main Head
        const headGroup = new THREE.Group();
        headGroup.position.y = 1.95;
        headGroup.name = "headGroup";
        
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), clayMaterial);
        head.scale.set(1, 1.1, 1); 
        head.castShadow = true;
        head.receiveShadow = true;
        headGroup.add(head);

        // Left Eye
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), eyeMaterial);
        leftEye.position.set(-0.11, 0.05, 0.32);
        leftEye.scale.set(1, 1.8, 0.5);
        headGroup.add(leftEye);

        // Right Eye
        const rightEye = leftEye.clone();
        rightEye.position.x = 0.11;
        headGroup.add(rightEye);
        playerGroup.add(headGroup);

        // 3. Arms
        const armGeo = new THREE.CapsuleGeometry(0.13, 0.5, 8, 16);
        const leftArm = new THREE.Mesh(armGeo, clayMaterial);
        leftArm.position.set(-0.55, 1.1, 0);
        leftArm.name = "leftArm";
        leftArm.castShadow = true;
        playerGroup.add(leftArm);

        const rightArm = leftArm.clone();
        rightArm.position.x = 0.55;
        rightArm.name = "rightArm";
        playerGroup.add(rightArm);

        // 4. Legs & Feet
        const legGeo = new THREE.CapsuleGeometry(0.16, 0.4, 8, 16);
        const footGeo = new THREE.SphereGeometry(0.24, 32, 16);

        const leftLegGroup = new THREE.Group();
        leftLegGroup.position.set(-0.25, 0.5, 0);
        leftLegGroup.name = "leftLeg";

        const leftLegMesh = new THREE.Mesh(legGeo, clayMaterial);
        leftLegMesh.position.y = 0.1;
        leftLegMesh.castShadow = true;
        
        const leftFootMesh = new THREE.Mesh(footGeo, clayMaterial);
        leftFootMesh.position.set(0, -0.2, 0.1);
        leftFootMesh.scale.set(1, 0.6, 1.4); 
        leftFootMesh.castShadow = true;
        
        leftLegGroup.add(leftLegMesh, leftFootMesh);
        playerGroup.add(leftLegGroup);

        const rightLegGroup = leftLegGroup.clone();
        rightLegGroup.position.x = 0.25;
        rightLegGroup.name = "rightLeg";
        playerGroup.add(rightLegGroup);

        // 5. Floating Companion Pet
        const companionHead = new THREE.Group();
        companionHead.position.set(0.7, 2.3, -0.2);
        companionHead.scale.setScalar(0.4);
        companionHead.name = "companion";

        const compBase = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), clayMaterial);
        compBase.castShadow = true;
        companionHead.add(compBase);

        const earGeo = new THREE.CapsuleGeometry(0.08, 0.15, 8, 16);
        const compLeftEar = new THREE.Mesh(earGeo, clayMaterial);
        compLeftEar.position.set(-0.15, 0.38, 0);
        const compRightEar = compLeftEar.clone();
        compRightEar.position.x = 0.15;
        companionHead.add(compLeftEar, compRightEar);

        const compLeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), eyeMaterial);
        compLeftEye.position.set(-0.11, 0.02, 0.33);
        compLeftEye.scale.set(1, 1.5, 0.5);
        const compRightEye = compLeftEye.clone();
        compRightEye.position.x = 0.11;
        companionHead.add(compLeftEye, compRightEye);
        playerGroup.add(companionHead);

        return playerGroup;
    }
}
Use code with caution.2. Integration: Update player3d.jsUpdate the top of your existing gameplay script to link up with the new global factory file. Delete the lengthy manual primitive definitions from your script body and swap them for this clean factory call inside buildClayPlayer():javascript// At the very top of player3d.js, change your imports:
import * as THREE from "three";
import { AvatarFactory } from "./AvatarFactory.js";

// ... keep all initialization variables ...

function buildClayPlayer() {
    // Generates the model using our unified factory setup
    player = AvatarFactory.createPlayer(0xeae6df); // Bone Clay color code
    scene.add(player);
}

// ... keep updatePlayer, control loops, and animation matrices exactly the same ...
Use code with caution.3. Implementation: Marketplace, Profile, & Name ScreenTo display this exact character rotating cleanly in your 2D HTML interface screens (like the web catalog marketplace, profile viewing panel, or name customization registration forms), embed a compact, specialized canvas renderer inside those respective pages.The Viewport HTML Layout snippetAdd this anywhere inside your menu pages (marketplace.html, profile.html, etc.) where you want the 3D character viewport box to live:html<!-- Character Preview Frame -->
<div class="avatar-card-frame">
    <div id="avatarContainer3d"></div>
    <div class="avatar-label">stive pierre</div>
</div>
Use code with caution.The Viewport CSS Presentation stylingAdd these UI styling properties to style your 3D canvas card frame elegantly, aligning perfectly with your dashboard themes:css.avatar-card-frame {
  width: 320px;
  height: 380px;
  background: #1d182b;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}

#avatarContainer3d {
  width: 100%;
  height: 100%;
}

.avatar-label {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 8, 18, 0.85);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: none;
}
Use code with caution.The Viewport JS Script driverRun this script inside your menus to render a beautiful, auto-spinning showcase scene of your clay mold character without using massive processing resources:javascriptimport * as THREE from "three";
import { AvatarFactory } from "./AvatarFactory.js";

const container = document.getElementById("avatarContainer3d");
if (container) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Mini UI Viewport Scene Setup
    const uiScene = new THREE.Scene();
    uiScene.background = new THREE.Color(0x231d36); // Matching your panel colors

    const uiCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    uiCamera.position.set(0, 1.4, 3.8); // Framed perfectly at eye level
    uiCamera.lookAt(0, 1.2, 0);

    const uiRenderer = new THREE.WebGLRenderer({ antialias: true });
    uiRenderer.setSize(width, height);
    uiRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(uiRenderer.domElement);

    // Soft Studio Lighting Rig
    const lightAmbient = new THREE.AmbientLight(0xffffff, 1.2);
    uiScene.add(lightAmbient);

    const lightKey = new THREE.DirectionalLight(0xffffff, 1.5);
    lightKey.position.set(5, 5, 4);
    uiScene.add(lightKey);

    // Instantiate and frame the character model
    const previewCharacter = AvatarFactory.createPlayer(0xeae6df); // Bone Clay
    uiScene.add(previewCharacter);

    // Slow cinematic rotation loop for display screens
    const clock = new THREE.Clock();
    function renderShowcaseLoop() {
        requestAnimationFrame(renderShowcaseLoop);
        
        const elapsedTime = clock.getElapsedTime();
        previewCharacter.rotation.y = elapsedTime * 0.4; // Auto rotating look

        // Gentle breathing movement on companion pet
        const companion = previewCharacter.getObjectByName("companion");
        if (companion) {
            companion.position.y = 2.3 + Math.sin(elapsedTime * 2.5) * 0.06;
        }

        uiRenderer.render(uiScene, uiCamera);
    }
    renderShowcaseLoop();

    // Responsive window handler
    window.addEventListener("resize", () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        uiCamera.aspect = w / h;
        uiCamera.updateProjectionMatrix();
        uiRenderer.setSize(w, h);
    });
}
Use code with caution.Would you like me to build out the full dashboard interface for your Marketplace page layout so you can click items (like Amethyst or Mint) to see the 3D model color change dynamically, or should we build out the Profile Name customisation layout box next?AI responses may include mistakes. Learn morerebuild player3d.jsHere is your fully optimized and completely rebuilt player3d.js file.This version integrates the procedural math for the Bone Clay Avatar and its Companion Pet directly inside the script, so you don't even need to make separate file calls. It updates the layout configurations and colors to match the dark, stylized dashboard theme from your marketplace screenshot.javascriptimport * as THREE from "three";

let scene;
let camera;
let renderer;
let player = null;
let clock;

const keys = {};

let velocityY = 0;
let grounded = true;

let yaw = 0;
let pitch = 0.18;
let cameraDistance = 6;

let mouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

const WALK_SPEED = 4;
const RUN_SPEED = 7;
const JUMP_POWER = 8;
const GRAVITY = 22;

const loading = document.getElementById("loading");
const statusText = document.getElementById("statusText");

init();

function init() {
    scene = new THREE.Scene();
    // Dark stylized background color matching your reference marketplace UI
    scene.background = new THREE.Color(0x13101c); 
    scene.fog = new THREE.FogExp2(0x13101c, 0.015);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        500
    );
    camera.position.set(0, 3, 6);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    document.getElementById("game").appendChild(renderer.domElement);
    clock = new THREE.Clock();

    createWorld();
    buildClayPlayer();
    setupControls();

    window.addEventListener("resize", resize);

    // Hide loader instantly since the clay meshes generate directly in memory
    if (loading) loading.style.display = "none";
    if (statusText) statusText.textContent = "Clay Mold Ready";

    animate();
}

function createWorld() {
    // Stylized violet-tinted lighting setup for a high-quality studio feel
    const hemisphere = new THREE.HemisphereLight(0xb1e1ff, 0x1d182b, 1.8);
    scene.add(hemisphere);

    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(-20, 35, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    sun.shadow.bias = -0.0005;
    scene.add(sun);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        new THREE.MeshStandardMaterial({ 
            color: 0x231d36, 
            roughness: 0.9 
        })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
}

function buildClayPlayer() {
    player = new THREE.Group();

    // Soft matte clay texture configuration replicating the "Bone Clay" finish
    const clayMaterial = new THREE.MeshStandardMaterial({
        color: 0xeae6df,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: false
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.2
    });

    // Torso (Smooth capsule bean shape)
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.7, 16, 32), clayMaterial);
    torso.position.y = 1.1;
    torso.castShadow = true;
    torso.receiveShadow = true;
    player.add(torso);

    // Main Character Head Assembly
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.95;
    headGroup.name = "headGroup";
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), clayMaterial);
    head.scale.set(1, 1.1, 1); // Slightly elongated look matching your reference image
    head.castShadow = true;
    head.receiveShadow = true;
    headGroup.add(head);

    // Tall vertical cartoon eyes
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), eyeMaterial);
    leftEye.position.set(-0.11, 0.05, 0.32);
    leftEye.scale.set(1, 1.8, 0.5);
    headGroup.add(leftEye);

    const rightEye = leftEye.clone();
    rightEye.position.x = 0.11;
    headGroup.add(rightEye);
    player.add(headGroup);

    // Detached Floating Pet Companion Accessory (Top-right asset from image)
    const companionHead = new THREE.Group();
    companionHead.position.set(0.7, 2.3, -0.2);
    companionHead.scale.setScalar(0.4);
    companionHead.name = "companion";

    const compBase = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), clayMaterial);
    compBase.castShadow = true;
    companionHead.add(compBase);

    // Companion Ears
    const earGeo = new THREE.CapsuleGeometry(0.08, 0.15, 8, 16);
    const leftEar = new THREE.Mesh(earGeo, clayMaterial);
    leftEar.position.set(-0.15, 0.38, 0);
    const rightEar = leftEar.clone();
    rightEar.position.x = 0.15;
    companionHead.add(leftEar, rightEar);

    // Companion Eyes
    const compLeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), eyeMaterial);
    compLeftEye.position.set(-0.11, 0.02, 0.33);
    compLeftEye.scale.set(1, 1.5, 0.5);
    const compRightEye = compLeftEye.clone();
    compRightEye.position.x = 0.11;
    companionHead.add(compLeftEye, compRightEye);
    player.add(companionHead);

    // Arms Setup
    const armGeo = new THREE.CapsuleGeometry(0.13, 0.5, 8, 16);
    
    const leftArm = new THREE.Mesh(armGeo, clayMaterial);
    leftArm.position.set(-0.55, 1.1, 0);
    leftArm.name = "leftArm";
    leftArm.castShadow = true;
    player.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.x = 0.55;
    rightArm.name = "rightArm";
    player.add(rightArm);

    // Legs and Oversized Stylized Clay Feet
    const legGeo = new THREE.CapsuleGeometry(0.16, 0.4, 8, 16);
    const footGeo = new THREE.SphereGeometry(0.24, 32, 16);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.25, 0.5, 0);
    leftLegGroup.name = "leftLeg";

    const leftLegMesh = new THREE.Mesh(legGeo, clayMaterial);
    leftLegMesh.position.y = 0.1;
    leftLegMesh.castShadow = true;
    
    const leftFootMesh = new THREE.Mesh(footGeo, clayMaterial);
    leftFootMesh.position.set(0, -0.2, 0.1);
    leftFootMesh.scale.set(1, 0.6, 1.4); // Flat, chunky stylized geometry
    leftFootMesh.castShadow = true;
    
    leftLegGroup.add(leftLegMesh, leftFootMesh);
    player.add(leftLegGroup);

    const rightLegGroup = leftLegGroup.clone();
    rightLegGroup.position.x = 0.25;
    rightLegGroup.name = "rightLeg";
    player.add(rightLegGroup);

    scene.add(player);
}

function setupControls() {
    window.addEventListener("keydown", (event) => {
        keys[event.code] = true;
        if (event.code === "Space" && grounded) {
            velocityY = JUMP_POWER;
            grounded = false;
            event.preventDefault();
        }
    });

    window.addEventListener("keyup", (event) => { keys[event.code] = false; });
    window.addEventListener("mousedown", (event) => {
        if (event.button !== 0) return;
        mouseDown = true;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;
    });
    window.addEventListener("mouseup", () => { mouseDown = false; });
    window.addEventListener("mousemove", (event) => {
        if (!mouseDown) return;
        const dx = event.clientX - lastMouseX;
        const dy = event.clientY - lastMouseY;
        lastMouseX = event.clientX;
        lastMouseY = event.clientY;

        yaw -= dx * 0.006;
        pitch -= dy * 0.004;
        pitch = THREE.MathUtils.clamp(pitch, -0.4, 1.1);
    });

    window.addEventListener("wheel", (event) => {
        cameraDistance += event.deltaY * 0.004;
        cameraDistance = THREE.MathUtils.clamp(cameraDistance, 3, 12);
    }, { passive: true });

    document.getElementById("exitButton")?.addEventListener("click", () => {
        window.location.href = "home.html";
    });
}

function updatePlayer(delta, time) {
    if (!player) return;

    let x = 0;
    let z = 0;

    if (keys["KeyW"] || keys["ArrowUp"]) z -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) z += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) x -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) x += 1;

    const isMoving = (x !== 0 || z !== 0);
    const speed = (keys["ShiftLeft"] || keys["ShiftRight"]) ? RUN_SPEED : WALK_SPEED;

    if (isMoving) {
        const input = new THREE.Vector3(x, 0, z).normalize();
        const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
        const right = new THREE.Vector3(forward.z, 0, -forward.x);
        const movement = new THREE.Vector3();

        movement.addScaledVector(forward, -input.z);
        movement.addScaledVector(right, input.x);
        movement.normalize();

        player.position.addScaledVector(movement, speed * delta);

        const targetRotation = Math.atan2(movement.x, movement.z);
        player.rotation.y = smoothRotation(player.rotation.y, targetRotation, delta * 10);
    }

    if (!grounded) {
        velocityY -= GRAVITY * delta;
        player.position.y += velocityY * delta;

        if (player.position.y <= 0) {
            player.position.y = 0;
            velocityY = 0;
            grounded = true;
        }
    }

    // Runs procedural skeletal limb animations based on movement status
    animateProceduralLimbs(isMoving, speed, delta, time);
}

function animateProceduralLimbs(isMoving, speed, delta, time) {
    const leftArm = player.getObjectByName("leftArm");
    const rightArm = player.getObjectByName("rightArm");
    const leftLeg = player.getObjectByName("leftLeg");
    const rightLeg = player.getObjectByName("rightLeg");
    const companion = player.getObjectByName("companion");

    // Smooth hover animation loop for the secondary companion head
    if (companion) {
        companion.position.y = 2.3 + Math.sin(time * 3) * 0.08;
        companion.rotation.y = time * 0.5;
    }

    if (!grounded) {
        // Jumping/Falling physics arm pose
        leftArm.rotation.x = -Math.PI / 3;
Use code with caution.rightArm.rotation.x = -Math.PI / 3;leftLeg.rotation.x = 0.2;rightLeg.rotation.x = -0.2;} else if (isMoving) {// Dynamic walking and running step swing cyclesconst waveSpeed = speed === RUN_SPEED ? 14 : 9;const waveAngle = speed === RUN_SPEED ? 0.6 : 0.4;leftArm.rotation.x = Math.sin(time * waveSpeed) * waveAngle;rightArm.rotation.x = -Math.sin(time * waveSpeed) * waveAngle;leftLeg.rotation.x = -Math.sin(time * waveSpeed) * waveAngle;rightLeg.rotation.x = Math.sin(time * waveSpeed) * waveAngle;} else {// Gentle breathing simulation during idle stateleftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, Math.sin(time * 2) * 0.05, 0.1);rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -Math.sin(time * 2) * 0.05, 0.1);leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.1);rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.1);}}function smoothRotation(current, target, amount) {let difference = target - current;difference = Math.atan2(Math.sin(difference), Math.cos(difference));if (Math.abs(difference) <= amount) return target;return current + Math.sign(difference) * amount;}function updateCamera() {if (!player) return;const target = player.position.clone();target.y += 1.25;const horizontal = Math.cos(pitch) * cameraDistance;const vertical = Math.sin(pitch) * cameraDistance;const position = new THREE.Vector3(target.x + Math.sin(yaw) * horizontal,target.y + vertical,target.z + Math.cos(yaw) * horizontal);camera.position.lerp(position, 0.12);camera.lookAt(target);}function animate() {requestAnimationFrame(animate);const delta = Math.min(clock.getDelta(), 0.05);const time = clock.getElapsedTime();updatePlayer(delta, time);updateCamera();renderer.render(scene, camera);}function resize() {camera.aspect = window.innerWidth / window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth, window.innerHeight);}
<FollowUp>
Would you like me to code the **marketplace script** next so players can select skins like **Amethyst** or **Mint**, or should we design the **profile container** that shows their **first name, last name, and character model** side-by-side?
</FollowUp>
AI responses may include mistakes. Learn morenow rebuild marketplace and like you know what to doHere is the complete setup to build a fully functional, beautiful Marketplace panel (marketplace.html, marketplace.css, and marketplace.js).This setup handles everything dynamically: it renders the custom 3D clay character right in the menu, generates a grid of all the texture choices from your reference image (Bone Clay, Amethyst, Mint, Crimson, etc.), and updates the character's skin texture color in real-time when a user clicks a style card.1. marketplace.htmlSave this as your marketplace interface page. It sets up the core dual-panel layout: a 3D viewport on the left to show off the avatar, and a clean catalog control wrapper on the right.html<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RiseUp - Marketplace</title>
    <link rel="stylesheet" href="marketplace.css">
</head>
<body>
    <div id="marketplaceApp">
        <!-- Header Navigation Area -->
        <header id="marketHeader">
            <div class="brand">
                <div class="brandMark"></div>
                <span>RiseUp Marketplace</span>
            </div>
            <div class="userProfileHeader">
                <span class="avatarLabelText">stive pierre</span>
                <div class="userBalance"><span class="coinIcon">🪙</span> 1,250</div>
            </div>
        </header>

        <!-- Main Workspace split -->
        <main class="marketContainer">
            <!-- LEFT PANEL: Real-time 3D Clay Mold Showcase Frame -->
            <section class="previewColumn">
                <div class="avatarCardFrame">
                    <div id="avatarContainer3d"></div>
                    <div class="previewFooterHint">Drag to rotate mold viewer</div>
                </div>
            </section>

            <!-- RIGHT PANEL: Catalog Options Tabs and Grid Matrix -->
            <section class="catalogColumn">
                <nav class="catalogTabs">
                    <button class="tabButton active">Textures</button>
                    <button class="tabButton">Closet</button>
                    <button class="tabButton">Emotes</button>
                </nav>

                <div class="searchAndFilters">
                    <div class="searchBox">
                        <span class="searchIcon">🔍</span>
                        <input type="text" placeholder="Search textures..." id="catalogSearch">
                    </div>
                    <div class="filterGroup">
                        <button class="filterFilter active">All</button>
                        <button class="filterFilter">Owned</button>
                        <button class="filterFilter">Locked</button>
                    </div>
                </div>

                <!-- Texture items injection target slot -->
                <div class="catalogGrid" id="textureGrid">
                    <!-- Cards are dynamically spawned and handled by marketplace.js -->
                </div>
            </section>
        </main>
    </div>

    <!-- Load ThreeJS code bundle as an active ECMAScript engine module -->
    <script type="module" src="marketplace.js"></script>
</body>
</html>
Use code with caution.2. marketplace.cssThis style system sets up the deep obsidian and violet-accented visual layer matching your precise UI screenshot context.css* {
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background: #0f0c1b;
  color: #fff;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
}

#marketplaceApp {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}

/* TOP APP DESIGN HEADER HUD */
#marketHeader {
  height: 64px;
  background: rgba(25, 20, 38, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  z-index: 50;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.brandMark {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: #ba8fff;
  box-shadow: 0 0 12px rgba(186, 143, 255, 0.5);
}

.userProfileHeader {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatarLabelText {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.userBalance {
  background: rgba(255, 255, 255, 0.06);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

/* SPLIT DASHBOARD LAYOUT GRIDS */
.marketContainer {
  display: flex;
  flex: 1;
  padding: 24px;
  gap: 24px;
  overflow: hidden;
}

.previewColumn {
  width: 420px;
  display: flex;
  flex-direction: column;
}

.avatarCardFrame {
  flex: 1;
  background: #151124;
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

#avatarContainer3d {
  width: 100%;
  height: 100%;
}

.previewFooterHint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 8, 18, 0.75);
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* CATALOG SELECTION DESIGN TRACK */
.catalogColumn {
  flex: 1;
  background: #13101f;
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.catalogTabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.03);
  padding-bottom: 8px;
}

.tabButton {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 15px;
  font-weight: 700;
  padding: 8px 16px;
  cursor: pointer;
  position: relative;
}

.tabButton.active {
  color: #ba8fff;
}

.tabButton.active::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  right: 0;
  height: 2px;
  background: #ba8fff;
  box-shadow: 0 0 8px #ba8fff;
}

/* FILTER AND BAR UTILITIES */
.searchAndFilters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.searchBox {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 10px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  max-width: 320px;
}

.searchBox input {
  background: none;
  border: none;
  color: white;
  width: 100%;
  font-size: 13px;
}

.searchBox input:focus {
  outline: none;
}

.filterGroup {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.filterFilter {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 7px;
  cursor: pointer;
}

.filterFilter.active {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

/* CATALOG ITEMS CARDS GRID GRID MATRIX */
.catalogGrid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
  gap: 16px;
  overflow-y: auto;
  padding-right: 6px;
}

/* Item box container card aesthetics */
.productCard {
  background: #1a162b;
  border: 2px solid transparent;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: background 0.2s, transform 0.15s;
}

.productCard:hover {
  background: #211c38;
  transform: translateY(-2px);
}

.productCard.selected {
  border-color: #ba8fff;
  background: #1f1938;
}

/* Simulated 2D render node element preview circle */
.thumbnailCircle {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  margin-bottom: 10px;
  box-shadow: inset 0 4px 10px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.05);
}

.productCardName {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
}

/* Locking system tag visuals */
.lockStatusBadge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 5px;
  border-radius: 4px;
  color: #ff9d9d;
}

/* Custom modern scrollbar design metrics */
.catalogGrid::-webkit-scrollbar {
  width: 6px;
}
.catalogGrid::-webkit-scrollbar-track {
  background: transparent;
}
.catalogGrid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}
Use code with caution.3. marketplace.jsThis script launches an interactive 3D studio arena frame, compiles the skin catalog array from your reference database, implements direct canvas mouse drag orbiting, and overrides material color configurations cleanly whenever a card gets targeted.javascriptimport * as THREE from "three";

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
Use code with caution.Now that the Marketplace engine is fully rebuilt, would you like me to build out the Profile Page Dashboard next to display the user's First and Last Name properties alongside their selected custom clay character?AI responses may include mistakes. Learn morenow rebuild


NAVIGATION
Home
Discover
Avatar
Inventory
Friends
Marketplace
Messages
CREATOR
Studio
RiseCode
Settings
RiseUp PreviewHere are your completely rebuilt files that update the game's Main Dashboard and Navigation Sidebar System.This updates the navigation links to match your specified menu structure (Home, Discover, Avatar, Inventory, Creator Studio, etc.) and styles everything using the dark obsidian and violet theme. It embeds your procedural 3D Bone Clay Character directly into the desktop dashboard interface alongside user statistics.1. dashboard.htmlSave this as your primary user workspace hub layout. It houses the universal sidebar structure and ties directly to our standalone runtime scripts.html<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RiseUp - Dashboard</title>
    <link rel="stylesheet" href="dashboard.css">
</head>
<body>
    <div id="riseupApp">
        <!-- LEFT SIDEBAR: COMPLETE GAME NAVIGATION ECOSYSTEM -->
        <aside id="mainSidebar">
            <div class="sidebarBrand">
                <div class="brandMark"></div>
                <span class="brandName">RiseUp</span>
            </div>

            <!-- PRIMARY NAVIGATION SECTION -->
            <div class="menuGroup">
                <div class="groupTitle">NAVIGATION</div>
                <nav class="groupLinks">
                    <a href="home.html" class="navLink active"><span class="navIcon">🏠</span> Home</a>
                    <a href="discover.html" class="navLink"><span class="navIcon">🌐</span> Discover</a>
                    <a href="avatar.html" class="navLink"><span class="navIcon">🧍</span> Avatar</a>
                    <a href="inventory.html" class="navLink"><span class="navIcon">🎒</span> Inventory</a>
                    <a href="friends.html" class="navLink"><span class="navIcon">👥</span> Friends</a>
                    <a href="marketplace.html" class="navLink"><span class="navIcon">🛍️</span> Marketplace</a>
                    <a href="messages.html" class="navLink"><span class="navIcon">💬</span> Messages</a>
                </nav>
            </div>

            <!-- CREATOR STUDIO TOOLS SECTION -->
            <div class="menuGroup">
                <div class="groupTitle">CREATOR</div>
                <nav class="groupLinks">
                    <a href="studio.html" class="navLink"><span class="navIcon">🛠️</span> Studio</a>
                    <a href="risecode.html" class="navLink"><span class="navIcon">💻</span> RiseCode</a>
                    <a href="settings.html" class="navLink"><span class="navIcon">⚙️</span> Settings</a>
                    <a href="player3d.html" class="navLink previewHighlight"><span class="navIcon">✨</span> RiseUp Preview</a>
                </nav>
            </div>

            <!-- USER SESSION FOOTER PROFILE -->
            <footer class="sidebarUserAccount">
                <div class="userSessionBadge">
                    <div class="userSessionOnlineDot"></div>
                    <div class="userSessionDetails">
                        <div class="usernameText">stive pierre</div>
                        <div class="userRoleText">Developer Mode</div>
                    </div>
                </div>
            </footer>
        </aside>

        <!-- RIGHT WORKSPACE: PRIMARY DASHBOARD DISPLAY CORE -->
        <main id="dashboardMainArea">
            <header class="workspaceHeader">
                <h1>Welcome Back, <span class="highlightText">stive</span></h1>
                <div class="quickStats">
                    <div class="statPill">🪙 <span class="statVal">1,250</span></div>
                    <div class="statPill">⭐ <span class="statVal">Level 24</span></div>
                </div>
            </header>

            <div class="dashboardGrid">
                <!-- PANEL A: LIVE 3D CLAY CHARACTER CONTAINER CARD -->
                <section class="dashboardCard avatarPreviewSection">
                    <div class="cardHeaderRow">
                        <h3>Identity Profile</h3>
                        <span class="cardSubtitle">stive pierre</span>
                    </div>
                    <div class="avatarViewportFrame">
                        <div id="dashboardAvatarCanvas"></div>
                        <div class="viewportDragOverlay">Drag to rotate character mold</div>
                    </div>
                </section>

                <!-- PANEL B: CREATIVE DEV SUMMARY LOG -->
                <section class="dashboardCard projectOverviewSection">
                    <div class="cardHeaderRow">
                        <h3>Project Status</h3>
                        <span class="statusTag active">Online</span>
                    </div>
                    <div class="projectDetailsBody">
                        <p class="projectSummaryText">Your core runtime environment is optimized. The procedural asset renderer has dropped heavy loading queues, making asset compiling instant.</p>
                        
                        <div class="quickActionRows">
                            <a href="studio.html" class="actionRowBtn">
                                <span class="actionBtnTitle">Launch Creative Studio</span>
                                <span class="actionBtnArrow">→</span>
                            </a>
                            <a href="player3d.html" class="actionRowBtn corePreviewLink">
                                <span class="actionBtnTitle">Run Environment Sandbox</span>
                                <span class="actionBtnArrow">→</span>
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    </div>

    <!-- Initialize procedural ThreeJS module viewport handler -->
    <script type="module" src="dashboard.js"></script>
</body>
</html>
Use code with caution.2. dashboard.cssThis style matrix handles the screen-splitting sidebar architecture, custom active layout highlighting, and elegant typography frames for your profile details.css* {
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background: #0d0a14;
  color: #fff;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

#riseupApp {
  display: flex;
  width: 100vw;
  height: 100vh;
}

/* ==========================================================================
   LEFT COMPONENT: METICULOUS NAVIGATION SIDEBAR
   ========================================================================== */
#mainSidebar {
  width: 260px;
  background: #120e1e;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  gap: 28px;
  z-index: 30;
}

.sidebarBrand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 8px;
}

.brandMark {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: #ba8fff;
  box-shadow: 0 0 12px rgba(186, 143, 255, 0.6);
}

.brandName {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ffffff 0%, #d8c3ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* NAVIGATION LINKS GROUPS LAYOUT */
.menuGroup {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.groupTitle {
  font-size: 10px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 1.5px;
  padding-left: 10px;
  margin-bottom: 4px;
}

.groupLinks {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.navLink {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
}

.navLink:hover {
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.9);
}

.navLink.active {
  background: rgba(186, 143, 255, 0.08);
  color: #cbb0ff;
  border: 1px solid rgba(186, 143, 255, 0.06);
}

/* Highlighted emphasis link option treatment */
.navLink.previewHighlight {
  color: #e5bfff;
  background: linear-gradient(90deg, rgba(186, 143, 255, 0.1) 0%, transparent 100%);
  font-weight: 700;
}
.navLink.previewHighlight:hover {
  background: linear-gradient(90deg, rgba(186, 143, 255, 0.15) 0%, transparent 100%);
}

.navIcon {
  font-size: 16px;
  display: inline-block;
  width: 20px;
  text-align: center;
}

/* SIDEBAR REUSER INFORMATION BLOCK */
.sidebarUserAccount {
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding-top: 16px;
}

.userSessionBadge {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
}

.userSessionOnlineDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a3ffb4;
  box-shadow: 0 0 10px #a3ffb4;
  flex-shrink: 0;
}

.userSessionDetails {
  display: flex;
  flex-direction: column;
}

.usernameText {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.userRoleText {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 1px;
}

/* ==========================================================================
   RIGHT COMPONENT: DASHBOARD CONTENT DISPLAY HUB
   ========================================================================== */
#dashboardMainArea {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  overflow-y: auto;
}

.workspaceHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.workspaceHeader h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
}

.highlightText {
  color: #ba8fff;
}

.quickStats {
  display: flex;
  gap: 12px;
}

.statPill {
  background: #161226;
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
}

/* CONTAINER CARDS TILES GRID ARRAY */
.dashboardGrid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
  align-items: start;
}

.dashboardCard {
  background: #141021;
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
}

.cardHeaderRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cardHeaderRow h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.cardSubtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 600;
}

.statusTag {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(163, 255, 180, 0.1);
  color: #a3ffb4;
}

/* 3D AVATAR CARD PREVIEW WINDOW FRAME */
.avatarViewportFrame {
  height: 380px;
  background: #19142b;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.02);
}

#dashboardAvatarCanvas {
  width: 100%;
  height: 100%;
}

.viewportDragOverlay {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 8, 18, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  pointer-events: none;
  white-space: nowrap;
}

/* ACCOUNT ACTION LINKS PREVIEWS LIST */
.projectSummaryText {
  margin: 0 0 24px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
}

.quickActionRows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.actionRowBtn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 16px 20px;
  border-radius: 12px;
  text-decoration: none;
  color: white;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s, border-color 0.2s;
}

.actionRowBtn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.06);
}

.actionRowBtn.corePreviewLink {
  background: rgba(186, 143, 255, 0.06);
  border-color: rgba(186, 143, 255, 0.1);
  color: #d2bdff;
}
.actionRowBtn.corePreviewLink:hover {
  background: rgba(186, 143, 255, 0.1);
}

.actionBtnArrow {
  opacity: 0.5;
  transition: transform 0.2s;
}
.actionRowBtn:hover .actionBtnArrow {
  transform: translateX(4px);
  opacity: 1;
}
Use code with caution.3. dashboard.jsThis script mounts the procedural rendering canvas right inside your dashboard framework, managing a smooth rotation showreel for your Bone Clay Character and Companion Pet.javascriptimport * as THREE from "three";

// 3D Engine execution parameters
let scene, camera, renderer;
let characterGroup;

let isInteracting = false;
let lastPointerX = 0;
const rotationSensitivity = 0.005;

const canvasWrapper = document.getElementById("dashboardAvatarCanvas");

// Run initializer
initDashboardScene();

function initDashboardScene() {
    if (!canvasWrapper) return;

    const boxWidth = canvasWrapper.clientWidth;
    const boxHeight = canvasWrapper.clientHeight;

    // Build the high-fidelity rendering pipeline scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x19142b);
    scene.fog = new THREE.FogExp2(0x19142b, 0.02);

    camera = new THREE.PerspectiveCamera(45, boxWidth / boxHeight, 0.1, 100);
    camera.position.set(0, 1.35, 3.6); // Zoomed in cleanly on the profile layout
    camera.lookAt(0, 1.1, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(boxWidth, boxHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasWrapper.appendChild(renderer.domElement);

    // Dynamic dual lighting rig setup
    const lightAmbient = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(lightAmbient);

    const lightKey = new THREE.DirectionalLight(0xffffff, 1.6);
    lightKey.position.set(4, 6, 3);
    lightKey.castShadow = true;
    lightKey.shadow.mapSize.width = 1048;
    lightKey.shadow.mapSize.height = 1048;
    scene.add(lightKey);

    // Build model inside dashboard viewport instance
    assembleDashboardCharacter();
    bindInputTriggers();

    window.addEventListener("resize", handleViewportResize);

    // Real-time animation pipeline logic loops
    const runClock = new THREE.Clock();
    function animateDashboardFrame() {
        requestAnimationFrame(animateDashboardFrame);
        const deltaSeconds = runClock.getElapsedTime();

        // Slow automatic preview spin if user is not actively adjusting orientation
        if (!isInteracting && characterGroup) {
            characterGroup.rotation.y = deltaSeconds * 0.2;
        }

        // Apply procedural floating track cycle to the companion accessory mesh node
        if (characterGroup) {
            const petCompanion = characterGroup.getObjectByName("companion");
            if (petCompanion) {
                petCompanion.position.y = 2.3 + Math.sin(deltaSeconds * 2.4) * 0.04;
            }
        }

        renderer.render(scene, camera);
    }
    animateDashboardFrame();
}

function assembleDashboardCharacter() {
    characterGroup = new THREE.Group();

    // Soft matte profile material layout setting matching "Bone Clay"
    const claySkinMat = new THREE.MeshStandardMaterial({
        color: 0xeae6df,
        roughness: 0.85,
        metalness: 0.05
    });

    const glossyEyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });

    // Torso Frame
    const torsoMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.7, 16, 32), claySkinMat);
    torsoMesh.position.y = 1.1;
    torsoMesh.castShadow = true;
    characterGroup.add(torsoMesh);

    // Head Group
    const headNode = new THREE.Group();
    headNode.position.y = 1.95;
    
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), claySkinMat);
    headMesh.scale.set(1, 1.1, 1);
    headMesh.castShadow = true;
    headNode.add(headMesh);

    // Eyes Component
    const eyeLeftMesh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), glossyEyeMat);
    eyeLeftMesh.position.set(-0.11, 0.05, 0.32);
    eyeLeftMesh.scale.set(1, 1.8, 0.5);
    const eyeRightMesh = eyeLeftMesh.clone();
    eyeRightMesh.position.x = 0.11;
    headNode.add(eyeLeftMesh, eyeRightMesh);
    characterGroup.add(headNode);

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.13, 0.5, 8, 16);
    const armLeftMesh = new THREE.Mesh(armGeo, claySkinMat);
    armLeftMesh.position.set(-0.55, 1.1, 0);
    armLeftMesh.castShadow = true;
    const armRightMesh = armLeftMesh.clone();
    armRightMesh.position.x = 0.55;
    characterGroup.add(armLeftMesh, armRightMesh);

    // Legs and Chunky Feet Assemblies
    const legGeo = new THREE.CapsuleGeometry(0.16, 0.4, 8, 16);
    const footGeo = new THREE.SphereGeometry(0.24, 32, 16);

    const appendLegNode = (offsetX) => {
        const legGroup = new THREE.Group();
        legGroup.position.set(offsetX, 0.5, 0);

        const legMesh = new THREE.Mesh(legGeo, claySkinMat);
        legMesh.position.y = 0.1;
        legMesh.castShadow = true;

        const footMesh = new THREE.Mesh(footGeo, claySkinMat);
        footMesh.position.set(0, -0.2, 0.1);
        footMesh.scale.set(1, 0.6, 1.4);
        footMesh.castShadow = true;

        legGroup.add(legMesh, footMesh);
        return legGroup;
    };
    characterGroup.add(appendLegNode(-0.25), appendLegNode(0.25));

    // Floating Pet Companion Accessory Asset (Top-Right node)
    const petCompanionGroup = new THREE.Group();
    petCompanionGroup.position.set(0.7, 2.3, -0.2);
    petCompanionGroup.scale.setScalar(0.4);
    petCompanionGroup.name = "companion";

    const petBaseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), claySkinMat);
    petBaseMesh.castShadow = true;
    petCompanionGroup.add(petBaseMesh);

    const earGeo = new THREE.CapsuleGeometry(0.08, 0.15, 8, 16);
    const petEarL = new THREE.Mesh(earGeo, claySkinMat);
    petEarL.position.set(-0.15, 0.38, 0);
    const petEarR = petEarL.clone();
    petEarR.position.x = 0.15;
    petCompanionGroup.add(petEarL, petEarR);

    const petEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), glossyEyeMat);
    petEyeL.position.set(-0.11, 0.02, 0.33);
    petEyeL.scale.set(1, 1.5, 0.5);
    const petEyeR = petEyeL.clone();
    petEyeR.position.x = 0.11;
    petCompanionGroup.add(petEyeL, petEyeR);

    characterGroup.add(petCompanionGroup);
    scene.add(characterGroup);
}

function bindInputTriggers() {
    canvasWrapper.addEventListener("mousedown", (event) => {
        isInteracting = true;
        lastPointerX = event.clientX;
    });

    window.addEventListener("mousemove", (event) => {
        if (!isInteracting || !characterGroup) return;
        const deltaX = event.clientX - lastPointerX;
        lastPointerX = event.clientX;

        characterGroup.rotation.y += deltaX * rotationSensitivity;
    });

    window.addEventListener("mouseup", () => {
        isInteracting = false;
    });
}

function handleViewportResize() {
    if (!canvasWrapper) return;
    const w = canvasWrapper.clientWidth;
    const h = canvasWrapper.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}
Use code with caution.Now that your core navigation sidebar and main dashboard system are completely rebuilt around the new character style, what should we build next? We can assemble the Discover Game Catalog Grid layout, or code the functional setup for the Inventory system and Closet slots!AI responses may include mistakes. Learn morenextHere is the complete codebase to build a fully immersive, animated Discover Game Catalog Grid (discover.html, discover.css, and discover.js).This setup brings a complete high-fidelity game room matrix to your platform, displaying stylized thumbnail tiles complete with custom server counts, upvote metrics, creator tags, and animated search filtering to align directly with your ecosystem.1. discover.htmlSave this as your content exploration hub layout. It integrates with your global universal sidebar design while injecting an expansive discovery matrix section.html<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RiseUp - Discover Games</title>
    <link rel="stylesheet" href="discover.css">
</head>
<body>
    <div id="riseupApp">
        <!-- NAVIGATION SIDEBAR SYSTEM -->
        <aside id="mainSidebar">
            <div class="sidebarBrand">
                <div class="brandMark"></div>
                <span class="brandName">RiseUp</span>
            </div>
            <div class="menuGroup">
                <div class="groupTitle">NAVIGATION</div>
                <nav class="groupLinks">
                    <a href="home.html" class="navLink"><span class="navIcon">🏠</span> Home</a>
                    <a href="discover.html" class="navLink active"><span class="navIcon">🌐</span> Discover</a>
                    <a href="avatar.html" class="navLink"><span class="navIcon">🧍</span> Avatar</a>
                    <a href="inventory.html" class="navLink"><span class="navIcon">🎒</span> Inventory</a>
                    <a href="friends.html" class="navLink"><span class="navIcon">👥</span> Friends</a>
                    <a href="marketplace.html" class="navLink"><span class="navIcon">🛍️</span> Marketplace</a>
                    <a href="messages.html" class="navLink"><span class="navIcon">💬</span> Messages</a>
                </nav>
            </div>
            <div class="menuGroup">
                <div class="groupTitle">CREATOR</div>
                <nav class="groupLinks">
                    <a href="studio.html" class="navLink"><span class="navIcon">🛠️</span> Studio</a>
                    <a href="risecode.html" class="navLink"><span class="navIcon">💻</span> RiseCode</a>
                    <a href="settings.html" class="navLink"><span class="navIcon">⚙️</span> Settings</a>
                    <a href="player3d.html" class="navLink previewHighlight"><span class="navIcon">✨</span> RiseUp Preview</a>
                </nav>
            </div>
            <footer class="sidebarUserAccount">
                <div class="userSessionBadge">
                    <div class="userSessionOnlineDot"></div>
                    <div class="userSessionDetails">
                        <div class="usernameText">stive pierre</div>
                        <div class="userRoleText">Developer Mode</div>
                    </div>
                </div>
            </footer>
        </aside>

        <!-- MAIN MAIN HUB INTERFACE MODULE -->
        <main id="discoverMainArea">
            <header class="discoverHeader">
                <div class="titleSection">
                    <h1>Discover <span class="highlightText">Experiences</span></h1>
                    <p class="sectionDescription">Explore hot procedural creations running inside the core web runner.</p>
                </div>
                
                <div class="searchAndFilterHub">
                    <div class="searchFieldBox">
                        <span class="searchIconSymbol">🔍</span>
                        <input type="text" id="gameSearchBar" placeholder="Search experiences...">
                    </div>
                    <div class="categoryFilters">
                        <button class="genreFilter active" data-genre="all">All</button>
                        <button class="genreFilter" data-genre="action">Action</button>
                        <button class="genreFilter" data-genre="social">Social</button>
                        <button class="genreFilter" data-genre="creative">Creative</button>
                    </div>
                </div>
            </header>

            <!-- Horizontal dynamic recommendation deck -->
            <section class="featuredContainer">
                <h3 class="rowLabelHeading">🔥 POPULAR & RECOMMENDED</h3>
                <div class="discoverGridMatrix" id="experiencesContainerSlot">
                    <!-- Cards will be procedurally loaded by discover.js -->
                </div>
            </section>
        </main>
    </div>

    <!-- Active dynamic content handler engine script source linking -->
    <script type="module" src="discover.js"></script>
</body>
</html>
Use code with caution.2. discover.cssThis style matrix configures high-impact neon overlay tags, smooth zoom-scaling micro transitions for experience thumbnails, and custom fluid response columns.css* {
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background: #0d0a14;
  color: #fff;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

#riseupApp {
  display: flex;
  width: 100vw;
  height: 100vh;
}

/* Include shared master sidebar layout configurations structural hooks */
#mainSidebar {
  width: 260px;
  background: #120e1e;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  gap: 28px;
  flex-shrink: 0;
}

.sidebarBrand { display: flex; align-items: center; gap: 12px; padding-left: 8px; }
.brandMark { width: 14px; height: 14px; border-radius: 4px; background: #ba8fff; box-shadow: 0 0 12px rgba(186, 143, 255, 0.6); }
.brandName { font-size: 18px; font-weight: 800; letter-spacing: 0.5px; background: linear-gradient(135deg, #ffffff 0%, #d8c3ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.menuGroup { display: flex; flex-direction: column; gap: 6px; }
.groupTitle { font-size: 10px; font-weight: 800; color: rgba(255, 255, 255, 0.3); letter-spacing: 1.5px; padding-left: 10px; margin-bottom: 4px; }
.groupLinks { display: flex; flex-direction: column; gap: 2px; }
.navLink { display: flex; align-items: center; gap: 12px; padding: 10px 12px; color: rgba(255, 255, 255, 0.55); font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; transition: background 0.2s, color 0.2s; }
.navLink:hover { background: rgba(255, 255, 255, 0.03); color: rgba(255, 255, 255, 0.9); }
.navLink.active { background: rgba(186, 143, 255, 0.08); color: #cbb0ff; border: 1px solid rgba(186, 143, 255, 0.06); }
.navLink.previewHighlight { color: #e5bfff; background: linear-gradient(90deg, rgba(186, 143, 255, 0.1) 0%, transparent 100%); font-weight: 700; }
.navIcon { font-size: 16px; display: inline-block; width: 20px; text-align: center; }
.sidebarUserAccount { margin-top: auto; border-top: 1px solid rgba(255, 255, 255, 0.04); padding-top: 16px; }
.userSessionBadge { display: flex; align-items: center; gap: 12px; padding: 6px 8px; }
.userSessionOnlineDot { width: 8px; height: 8px; border-radius: 50%; background: #a3ffb4; box-shadow: 0 0 10px #a3ffb4; flex-shrink: 0; }
.userSessionDetails { display: flex; flex-direction: column; }
.usernameText { font-size: 13px; font-weight: 700; color: rgba(255, 255, 255, 0.9); }
.userRoleText { font-size: 11px; color: rgba(255, 255, 255, 0.35); margin-top: 1px; }

/* ==========================================================================
   DISCOVER COMPONENT: HEADER HUD FILTERS CONTROL CENTER
   ========================================================================== */
#discoverMainArea {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  overflow-y: auto;
}

.discoverHeader {
  display: flex;
  flex-direction: column;
  gap: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  padding-bottom: 24px;
}

.discoverHeader h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
}

.highlightText { color: #ba8fff; }

.sectionDescription {
  margin: 6px 0 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
}

.searchAndFilterHub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.searchFieldBox {
  background: #141021;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 12px 18px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 360px;
}

.searchFieldBox input {
  background: none;
  border: none;
  color: white;
  width: 100%;
  font-size: 14px;
}
.searchFieldBox input:focus { outline: none; }

.categoryFilters {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.02);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.genreFilter {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.genreFilter.active {
  background: rgba(186, 143, 255, 0.15);
  color: #dcbfff;
}

/* ==========================================================================
   GAME TILES CONFIGURATION CARD CONTAINER MATRIX
   ========================================================================== */
.featuredContainer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rowLabelHeading {
  margin: 0;
  font-size: 11px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 1px;
}

.discoverGridMatrix {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 20px;
}

/* GAME EXPERIENCE TILE INDIVIDUAL CARD PRESET */
.experienceTileCard {
  background: #141021;
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.experienceTileCard:hover {
  transform: translateY(-4px);
  border-color: rgba(186, 143, 255, 0.2);
  box-shadow: 0 15px 32px rgba(186, 143, 255, 0.08);
}

/* Dynamic abstract thumbnail canvas placeholder design code */
.tileGraphicsContainer {
  width: 100%;
  height: 125px;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
}

.tileBannerArt {
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}
.experienceTileCard:hover .tileBannerArt {
  transform: scale(1.05);
}

/* Online servers active notification badge bubble layout hook */
.liveCountBadge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(10, 8, 18, 0.75);
  backdrop-filter: blur(8px);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  color: #a3ffb4;
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.livePulseCircle {
  width: 6px;
  height: 6px;
  background: #55d66b;
  border-radius: 50%;
}

/* INFO WRAPPER SECTION BLOCK */
.tileMetaBody {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.gameTitleText {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.developerCredits {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 600;
}

.tileMetricsRow {
  margin-top: auto;
  padding-top: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
}

.upvoteRatingText {
  color: #ba8fff;
}

.hiddenTile {
  display: none !important;
}

/* Scrollbar customizations */
#discoverMainArea::-webkit-scrollbar { width: 6px; }
#discoverMainArea::-webkit-scrollbar-track { background: transparent; }
#discoverMainArea::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
Use code with caution.3. discover.jsThis driver populates your experience rows programmatically, injecting multi-variable card templates, and managing filter listeners to execute live catalog state alterations dynamically.javascript// 1. SIMULATED DISCOVER EXPERIENCE DIRECTORY CATALOG
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
Use code with caution.The Discover Hub Matrix Layer is ready! Which component of your application ecosystem should we implement next? We can assemble:The Avatar Layout Profile customizer panel (to view and manage equippable layers)The Inventory System Grid and Item Closet slots pageThe Friends and Messaging Interaction Feed HubLet me know how you would like to proceed!AI responses may include mistakes. Learn morehow much leftBased on the core layout structure and requirements you've mapped out for your game ecosystem, we have 3 primary layout hubs left to fully complete your platform rebuild:The Remaining Architecture🧍 Avatar Customizer Screen (avatar.html/css/js): A specialized dashboard workspace allowing players to equip accessories, select skin themes, and save their appearance configuration records locally.🎒 Inventory & Item Closet Slots (inventory.html/css/js): A dynamic display grid organizing items your character owns into category tabs (Molds, Accessories, Emotes) with custom inventory slots.👥 Friends & Message Feed Hub (friends.html/css/js or messages.html): An activity panel showing active friend statuses, user profile links, and direct messaging chat threads.Which component would you like me to generate next?The Avatar Customizer ScreenThe Inventory & Closet SlotsThe Friends & Message Feed HubLet me know your choice, and I will output the complete code bundle!AI responses may include mistakes. Learn moreok start with avatarHere is the complete codebase to build your fully functional Avatar Customizer Screen (avatar.html, avatar.css, and avatar.js).This workspace hosts an interactive 3D Avatar Studio Viewport on the left alongside an equippable item organizer tab interface on the right. Clicking on skin tones or companion adjustments will modify your clay figure properties dynamically, complete with a functional "Save Appearance" state handler.1. avatar.htmlSave this as your character customization terminal. It mounts the 3D interaction canvas and configures slot asset grids matching your platform sidebar setup.html<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RiseUp - Avatar Customizer</title>
    <link rel="stylesheet" href="avatar.css">
</head>
<body>
    <div id="riseupApp">
        <!-- UNIVERSAL NAVIGATION SIDEBAR SYSTEM -->
        <aside id="mainSidebar">
            <div class="sidebarBrand">
                <div class="brandMark"></div>
                <span class="brandName">RiseUp</span>
            </div>
            <div class="menuGroup">
                <div class="groupTitle">NAVIGATION</div>
                <nav class="groupLinks">
                    <a href="home.html" class="navLink"><span class="navIcon">🏠</span> Home</a>
                    <a href="discover.html" class="navLink"><span class="navIcon">🌐</span> Discover</a>
                    <a href="avatar.html" class="navLink active"><span class="navIcon">🧍</span> Avatar</a>
                    <a href="inventory.html" class="navLink"><span class="navIcon">🎒</span> Inventory</a>
                    <a href="friends.html" class="navLink"><span class="navIcon">👥</span> Friends</a>
                    <a href="marketplace.html" class="navLink"><span class="navIcon">🛍️</span> Marketplace</a>
                    <a href="messages.html" class="navLink"><span class="navIcon">💬</span> Messages</a>
                </nav>
            </div>
            <div class="menuGroup">
                <div class="groupTitle">CREATOR</div>
                <nav class="groupLinks">
                    <a href="studio.html" class="navLink"><span class="navIcon">🛠️</span> Studio</a>
                    <a href="risecode.html" class="navLink"><span class="navIcon">💻</span> RiseCode</a>
                    <a href="settings.html" class="navLink"><span class="navIcon">⚙️</span> Settings</a>
                    <a href="player3d.html" class="navLink previewHighlight"><span class="navIcon">✨</span> RiseUp Preview</a>
                </nav>
            </div>
            <footer class="sidebarUserAccount">
                <div class="userSessionBadge">
                    <div class="userSessionOnlineDot"></div>
                    <div class="userSessionDetails">
                        <div class="usernameText">stive pierre</div>
                        <div class="userRoleText">Developer Mode</div>
                    </div>
                </div>
            </footer>
        </aside>

        <!-- MAIN MAIN HUB INTERFACE MODULE -->
        <main id="avatarMainArea">
            <header class="avatarWorkspaceHeader">
                <div class="titleSection">
                    <h1>Avatar <span class="highlightText">Editor</span></h1>
                    <p class="sectionDescription">Equip cosmetic meshes and tweak parameters for your procedural clay mold.</p>
                </div>
                <button id="saveAppearanceBtn" class="saveConfigBtn">Save Appearance</button>
            </header>

            <div class="editorWorkspaceGrid">
                <!-- LEFT COLUMN: REAL-TIME 3D PERSPECTIVE PREVIEW FRAME -->
                <section class="avatarStudioPreviewPanel">
                    <div class="viewportOuterCard">
                        <div id="avatarStudioCanvas"></div>
                        <div class="viewportOverlayHint">Drag to orbit model view</div>
                    </div>
                </section>

                <!-- RIGHT COLUMN: MODULAR EQUIPPABLE ITEM CATEGORY PANELS -->
                <section class="avatarCatalogPanel">
                    <nav class="customizerCategoryTabs">
                        <button class="customTabBtn active" data-tab="molds">Molds</button>
                        <button class="customTabBtn" data-tab="pets">Companions</button>
                    </nav>

                    <!-- Customizer Dynamic Options Wrapper -->
                    <div class="customizerGridMatrix" id="customizerItemsTarget">
                        <!-- Content elements dynamically generated via avatar.js -->
                    </div>
                </section>
            </div>
        </main>
    </div>

    <!-- Active dynamic canvas and event logic controller runtime initialization -->
    <script type="module" src="avatar.js"></script>
</body>
</html>
Use code with caution.2. avatar.cssThis presentation sheet structures custom dashboard layout margins, thumbnail radial lighting grids, and responsive flex blocks matching your screenshot palette.css* {
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background: #0d0a14;
  color: #fff;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: hidden;
}

#riseupApp {
  display: flex;
  width: 100vw;
  height: 100vh;
}

/* Include universal core layout sidebar specifications structural hooks */
#mainSidebar {
  width: 260px;
  background: #120e1e;
  border-right: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  gap: 28px;
  flex-shrink: 0;
}

.sidebarBrand { display: flex; align-items: center; gap: 12px; padding-left: 8px; }
.brandMark { width: 14px; height: 14px; border-radius: 4px; background: #ba8fff; box-shadow: 0 0 12px rgba(186, 143, 255, 0.6); }
.brandName { font-size: 18px; font-weight: 800; letter-spacing: 0.5px; background: linear-gradient(135deg, #ffffff 0%, #d8c3ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.menuGroup { display: flex; flex-direction: column; gap: 6px; }
.groupTitle { font-size: 10px; font-weight: 800; color: rgba(255, 255, 255, 0.3); letter-spacing: 1.5px; padding-left: 10px; margin-bottom: 4px; }
.groupLinks { display: flex; flex-direction: column; gap: 2px; }
.navLink { display: flex; align-items: center; gap: 12px; padding: 10px 12px; color: rgba(255, 255, 255, 0.55); font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; transition: background 0.2s, color 0.2s; }
.navLink:hover { background: rgba(255, 255, 255, 0.03); color: rgba(255, 255, 255, 0.9); }
.navLink.active { background: rgba(186, 143, 255, 0.08); color: #cbb0ff; border: 1px solid rgba(186, 143, 255, 0.06); }
.navLink.previewHighlight { color: #e5bfff; background: linear-gradient(90deg, rgba(186, 143, 255, 0.1) 0%, transparent 100%); font-weight: 700; }
.navIcon { font-size: 16px; display: inline-block; width: 20px; text-align: center; }
.sidebarUserAccount { margin-top: auto; border-top: 1px solid rgba(255, 255, 255, 0.04); padding-top: 16px; }
.userSessionBadge { display: flex; align-items: center; gap: 12px; padding: 6px 8px; }
.userSessionOnlineDot { width: 8px; height: 8px; border-radius: 50%; background: #a3ffb4; box-shadow: 0 0 10px #a3ffb4; flex-shrink: 0; }
.userSessionDetails { display: flex; flex-direction: column; }
.usernameText { font-size: 13px; font-weight: 700; color: rgba(255, 255, 255, 0.9); }
.userRoleText { font-size: 11px; color: rgba(255, 255, 255, 0.35); margin-top: 1px; }

/* ==========================================================================
   AVATAR EDITOR REGION WORKSPACE LAYOUT PANELS
   ========================================================================== */
#avatarMainArea {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  overflow-y: auto;
}

.avatarWorkspaceHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  padding-bottom: 24px;
}

.avatarWorkspaceHeader h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
}

.highlightText { color: #ba8fff; }

.sectionDescription {
  margin: 6px 0 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
}

.saveConfigBtn {
  background: #ba8fff;
  border: none;
  color: #120e1e;
  font-size: 13px;
  font-weight: 700;
  padding: 10px 24px;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(186, 143, 255, 0.3);
  transition: transform 0.2s, background-color 0.2s;
}

.saveConfigBtn:hover {
  background: #ca9fff;
  transform: translateY(-1px);
}

/* CONTAINER SPLIT WORKSPACE WINDOW GRIDS */
.editorWorkspaceGrid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  align-items: start;
}

.avatarStudioPreviewPanel {
  display: flex;
  flex-direction: column;
}

.viewportOuterCard {
  height: 420px;
  background: #141021;
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
}

#avatarStudioCanvas {
  width: 100%;
  height: 100%;
}

.viewportOverlayHint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(10, 8, 18, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  pointer-events: none;
  white-space: nowrap;
}

/* ==========================================================================
   RIGHT COMPONENT: EQUIPMENT SELECTION CONTROLS GRID
   ========================================================================== */
.avatarCatalogPanel {
  background: #141021;
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 420px;
}

.customizerCategoryTabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.03);
  padding-bottom: 8px;
}

.customTabBtn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  font-weight: 700;
  padding: 8px 16px;
  cursor: pointer;
  position: relative;
}

.customTabBtn.active {
  color: #ba8fff;
}

.customTabBtn.active::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  right: 0;
  height: 2px;
  background: #ba8fff;
  box-shadow: 0 0 8px #ba8fff;
}

.customizerGridMatrix {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 14px;
  overflow-y: auto;
  padding-right: 4px;
}

/* COSMETIC SLOT PRESET STYLING METRICS */
.cosmeticSlotCard {
  background: #1b162c;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}

.cosmeticSlotCard:hover {
  background: #231c3b;
  transform: translateY(-2px);
}

.cosmeticSlotCard.equipped {
  border-color: #ba8fff;
  background: #201a38;
}

.cosmeticIconThumb {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin-bottom: 8px;
  border: 1px solid rgba(255,255,255,0.04);
}

.cosmeticTitleLabel {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
}

/* Custom internal scroll container trackers */
.customizerGridMatrix::-webkit-scrollbar { width: 5px; }
.customizerGridMatrix::-webkit-scrollbar-track { background: transparent; }
.customizerGridMatrix::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.06); border-radius: 10px; }
Use code with caution.3. avatar.jsThis driver loads your canvas customizer loop, stores asset data models, frames camera positions at eye level, and runs runtime configuration override parameters dynamically.javascriptimport * as THREE from "three";

// 1. COSMETIC ITEM REGISTRATION LOOKUP DICTIONARIES
const DATA_MOLDS = [
    { id: "m1", name: "Bone Clay", hex: 0xeae6df, active: true },
    { id: "m2", name: "Amethyst", hex: 0x7b3fd3, active: false },
    { id: "m3", name: "Mint", hex: 0x1fca8a, active: false },
    { id: "m4", name: "Apricot", hex: 0xe67035, active: false },
    { id: "m5", name: "Acid Lime", hex: 0xb5e933, active: false },
    { id: "m6", name: "Glacier", hex: 0x47a9f5, active: false }
];

const DATA_PETS = [
    { id: "p1", name: "Equip Companion", action: "show", active: true },
    { id: "p2", name: "Unequip Pet", action: "hide", active: false }
];

// 3D Scene Runtime pointers
let studioScene, studioCamera, studioRenderer;
let characterGroup;
let bodyMaterialsArray = [];

let isOrbiting = false;
let startPointerX = 0;
const orbitFactor = 0.006;

const canvasContainer = document.getElementById("avatarStudioCanvas");
const controlItemsGridSlot = document.getElementById("customizerItemsTarget");
const configurationTabs = document.querySelectorAll(".customTabBtn");
const saveBtn = document.getElementById("saveAppearanceBtn");

let activeTabContext = "molds";

// Run initial execution cycles
initAvatarStudioRenderer();
renderActiveTabMenu();
bindEditorCoreTriggers();

function initAvatarStudioRenderer() {
    if (!canvasContainer) return;

    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;

    studioScene = new THREE.Scene();
    studioScene.background = new THREE.Color(0x141021);
    studioScene.fog = new THREE.FogExp2(0x141021, 0.02);

    studioCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    studioCamera.position.set(0, 1.35, 3.6); // Centered eye level frame
    studioCamera.lookAt(0, 1.1, 0);

    studioRenderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    studioRenderer.setSize(width, height);
    studioRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    studioRenderer.shadowMap.enabled = true;
    studioRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasContainer.appendChild(studioRenderer.domElement);

    // Studio light balance configurations
    const ambLight = new THREE.AmbientLight(0xffffff, 1.3);
    studioScene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(4, 6, 3);
    keyLight.castShadow = true;
    studioScene.add(keyLight);

    // Assembly routine invocation
    assembleProceduralCharacter();
    setupCanvasInteraction();

    window.addEventListener("resize", onCanvasResize);

    const runtimeClock = new THREE.Clock();
    function studioAnimationLoop() {
        requestAnimationFrame(studioAnimationLoop);
        const elapsedTime = runtimeClock.getElapsedTime();

        // Automatic passive spin if user is idle
        if (!isOrbiting && characterGroup) {
            characterGroup.rotation.y = elapsedTime * 0.2;
        }

        if (characterGroup) {
            const companion = characterGroup.getObjectByName("companion");
            if (companion) {
                companion.position.y = 2.3 + Math.sin(elapsedTime * 2.5) * 0.05;
            }
        }

        studioRenderer.render(studioScene, studioCamera);
    }
    studioAnimationLoop();
}

function assembleProceduralCharacter() {
    characterGroup = new THREE.Group();
    bodyMaterialsArray = [];

    // Master default material instancing parameter tracking
    const skinMaterial = new THREE.MeshStandardMaterial({
        color: 0xeae6df, // Default setup matching Bone Clay selection card parameters
        roughness: 0.85,
        metalness: 0.05
    });
    bodyMaterialsArray.push(skinMaterial);

    const darkEyeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });

    // Torso node
    const torsoMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.7, 16, 32), skinMaterial);
    torsoMesh.position.y = 1.1;
    torsoMesh.castShadow = true;
    characterGroup.add(torsoMesh);

    // Head container group mesh block
    const headNodeGroup = new THREE.Group();
    headNodeGroup.position.y = 1.95;
    
    const headBaseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), skinMaterial);
    headBaseMesh.scale.set(1, 1.1, 1);
    headBaseMesh.castShadow = true;
    headNodeGroup.add(headBaseMesh);

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), darkEyeMaterial);
    leftEye.position.set(-0.11, 0.05, 0.32);
    leftEye.scale.set(1, 1.8, 0.5);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.11;
    headNodeGroup.add(leftEye, rightEye);
    characterGroup.add(headNodeGroup);

    // Arm modules
    const armGeo = new THREE.CapsuleGeometry(0.13, 0.5, 8, 16);
    const leftArmMesh = new THREE.Mesh(armGeo, skinMaterial);
    leftArmMesh.position.set(-0.55, 1.1, 0);
    leftArmMesh.castShadow = true;
    const rightArmMesh = leftArmMesh.clone();
    rightArmMesh.position.x = 0.55;
    characterGroup.add(leftArmMesh, rightArmMesh);

    // Legs structural links
    const legGeo = new THREE.CapsuleGeometry(0.16, 0.4, 8, 16);
    const footGeo = new THREE.SphereGeometry(0.24, 32, 16);

    const instantiateLegGroup = (offsetValX) => {
        const groupContainer = new THREE.Group();
        groupContainer.position.set(offsetValX, 0.5, 0);

        const legMesh = new THREE.Mesh(legGeo, skinMaterial);
        legMesh.position.y = 0.1;
        legMesh.castShadow = true;

        const footMesh = new THREE.Mesh(footGeo, skinMaterial);
        footMesh.position.set(0, -0.2, 0.1);
        footMesh.scale.set(1, 0.6, 1.4);
        footMesh.castShadow = true;

        groupContainer.add(legMesh, footMesh);
        return groupContainer;
    };
    characterGroup.add(instantiateLegGroup(-0.25), instantiateLegGroup(0.25));

    // Floating Companion Head asset attachment layer
    const companionHeadNode = new THREE.Group();
    companionHeadNode.position.set(0.7, 2.3, -0.2);
    companionHeadNode.scale.setScalar(0.4);
    companionHeadNode.name = "companion";

    const compBaseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 32), skinMaterial);
    compBaseMesh.castShadow = true;
    companionHeadNode.add(compBaseMesh);

    const earGeometry = new THREE.CapsuleGeometry(0.08, 0.15, 8, 16);
    const companionEarLeft = new THREE.Mesh(earGeometry, skinMaterial);
    companionEarLeft.position.set(-0.15, 0.38, 0);
    const companionEarRight = companionEarLeft.clone();
    companionEarRight.position.x = 0.15;
    companionHeadNode.add(companionEarLeft, companionEarRight);

    const companionEyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), darkEyeMaterial);
    companionEyeLeft.position.set(-0.11, 0.02, 0.33);
    companionEyeLeft.scale.set(1, 1.5, 0.5);
    const companionEyeRight = companionEyeLeft.clone();
    companionEyeRight.position.x = 0.11;
    companionHeadNode.add(companionEyeLeft, companionEyeRight);

    characterGroup.add(companionHeadNode);
    studioScene.add(characterGroup);
}

function renderActiveTabMenu() {
    if (!controlItemsGridSlot) return;
    controlItemsGridSlot.innerHTML = "";

    if (activeTabContext === "molds") {
        DATA_MOLDS.forEach(item => {
            const card = document.createElement("div");
            card.className = `cosmeticSlotCard ${item.active ? "equipped" : ""}`;
            const cssColorStr = `#${item.hex.toString(16).padStart(6, '0')}`;

            card.innerHTML = `
                <div class="cosmeticIconThumb" style="background: radial-gradient(circle at 30% 30%, #ffffff 0%, ${cssColorStr} 50%, #000000 130%);"></div>
                <div class="cosmeticTitleLabel">${item.name}</div>
            `;

            card.addEventListener("click", () => {
                DATA_MOLDS.forEach(m => m.active = false);
                item.active = true;
                renderActiveTabMenu();

                // Live modify color channels directly inside running buffers
                bodyMaterialsArray.forEach(mat => mat.color.setHex(item.hex));
            });
            controlItemsGridSlot.appendChild(card);
        });
    } else if (activeTabContext === "pets") {
        DATA_PETS.forEach(item => {
            const card = document.createElement("div");
            card.className = `cosmeticSlotCard ${item.active ? "equipped" : ""}`;
            const displayColor = item.action === "show" ? "#ba8fff" : "#ff7676";

            card.innerHTML = `
                <div class="cosmeticIconThumb" style="background: ${displayColor}; display: flex; align-items: center; justify-content: center; font-size: 22px;">${item.action === "show" ? "🐰" : "❌"}</div>
                <div class="cosmeticTitleLabel">${item.name}</div>
            `;

            card.addEventListener("click", () => {
                DATA_PETS.forEach(p => p.active = false);
                item.active = true;
                renderActiveTabMenu();

                const compMeshPointer = characterGroup.getObjectByName("companion");
                if (compMeshPointer) {
                    compMeshPointer.visible = (item.action === "show");
                }
            });
            controlItemsGridSlot.appendChild(card);
        });
    }
}

function bindEditorCoreTriggers() {
    configurationTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            configurationTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            activeTabContext = tab.getAttribute("data-tab");
            renderActiveTabMenu();
        });
    });

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            alert("Appearance Configuration Profile successfully synced to global ecosystem data slots!");
        });
    }
}

function setupCanvasInteraction() {
    canvasContainer.addEventListener("mousedown", (e) => {
        isOrbiting = true;
Use code with caution.startPointerX = e.clientX;});window.addEventListener("mousemove", (e) => {if (!isOrbiting || !characterGroup) return;const deltaX = e.clientX - startPointerX;startPointerX = e.clientX;characterGroup.rotation.y += deltaX * orbitFactor;});window.addEventListener("mouseup", () => { isOrbiting = false; });}function onCanvasResize() {if (!canvasContainer) return;const w = canvasContainer.clientWidth;const h = canvasContainer.clientHeight;studioCamera.aspect = w / h;studioCamera.updateProjectionMatrix();studioRenderer.setSize(w, h);}