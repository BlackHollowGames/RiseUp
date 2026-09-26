import * as THREE from "three";

/**
 * ==========================================================================
 * RISEUP CLIENT GLOBAL CORE INITIALIZATION ARCHITECTURE
 * ==========================================================================
 */
class RiseUpAppEngine {
    constructor() {
        // Core State Node Repository
        this.sessionState = {
            user: { username: "stive pierre", credits: 1250, initial: "S", rank: "Developer" },
            interface: { sidebarExpanded: true, activeTab: "home", activeFilters: null },
            cachedSessions: []
        };

        // DOM Tracking Target Nodes Map
        this.domElements = {
            canvasContainer: document.getElementById("hero3dCanvasContainer"),
            creditDisplay: document.querySelector(".coinBalanceCounter .coinVal"),
            creditsBox: document.querySelector(".coinBalanceCounter"),
            searchField: document.querySelector(".navSearchWrapper input"),
            cards: document.querySelectorAll(".experienceCatalogCard"),
            quickLinks: document.querySelectorAll(".quickAccessLinkCard"),
            topTabs: document.querySelectorAll(".topTabLink"),
            sidebarLinks: document.querySelectorAll(".navLink")
        };

        // Subsystem Handle Bindings
        this.graphicsEngine = null;
    }

    /**
     * Spawns core subsystem routines
     */
    launchEnginePipeline() {
        console.log("%c[RiseUp Core Engine] Initializing ultra-detailed subsystem managers...", "color: #0074ff; font-weight: bold;");
        
        this.initializeStateTrackingHUD();
        this.bootGraphicsPipeline3D();
        this.registerParallaxCardsEngine();
        this.bindUserActionTriggers();
    }

    /**
     * Synchs initial state models cleanly with HTML rendering channels
     */
    initializeStateTrackingHUD() {
        if (this.domElements.creditDisplay) {
            this.domElements.creditDisplay.textContent = this.sessionState.user.credits.toLocaleString();
        }
    }

    /**
     * ==========================================================================
     * ADVANCED THREE.JS GRAPHICS MANAGEMENT MANAGER
     * Renders a custom hyper-reflective, glassmorphic atmospheric planet sphere
     * ==========================================================================
     */
    bootGraphicsPipeline3D() {
        const container = this.domElements.canvasContainer;
        if (!container) return;

        const w = container.clientWidth;
        const h = container.clientHeight;

        // 1. Scene & Multi-Pass Perspective Configurations
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
        camera.position.set(0, 0, 4.2);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.4;
        container.appendChild(renderer.domElement);

        // 2. High-Fidelity Dual-Point Cinematic Lighting Rig
        const ambLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambLight);

        const keyRimLight = new THREE.DirectionalLight(0x00a2ff, 3.5); // Radiant azure edge rim backlight
        keyRimLight.position.set(5, 4, 3);
        scene.add(keyRimLight);

        const softFillLight = new THREE.DirectionalLight(0xb38fff, 1.8); // Subtle cinematic magenta front fill light
        softFillLight.position.set(-5, -2, 2);
        scene.add(softFillLight);

        // 3. Build Procedural Compound Node Objects Group
        const planetClusterGroup = new THREE.Group();

        // Shiny Glassmorphic Base Sphere Geometry Formulation
        const corePlanetMesh = new THREE.Mesh(
            new THREE.SphereGeometry(1.15, 64, 64),
            new THREE.MeshStandardMaterial({
                color: 0x0055ff,
                roughness: 0.08,
                metalness: 0.15,
                bumpScale: 0.05,
                flatShading: false
            })
        );
        planetClusterGroup.add(corePlanetMesh);

        // Extrude and position sharp compound white letter "R" sign panels onto front axis bounds
        const signFaceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.1 });
        
        const rStem = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.8, 0.1), signFaceMat);
        rStem.position.set(-0.24, 0, 1.12);
        planetClusterGroup.add(rStem);

        const rLoop = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.08, 16, 32, Math.PI * 1.5), signFaceMat);
        rLoop.position.set(-0.06, 0.2, 1.12);
        rLoop.rotation.z = -Math.PI / 2;
        planetClusterGroup.add(rLoop);

        const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.1), signFaceMat);
        rLeg.position.set(0.02, -0.18, 1.12);
        rLeg.rotation.z = -Math.PI / 4;
        planetClusterGroup.add(rLeg);

        scene.add(planetClusterGroup);

        // 4. Create Outer Atmospheric Orbit Space Dust Ring Node
        const outerOrbitRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.75, 0.015, 8, 128),
            new THREE.MeshBasicMaterial({ color: 0x00a2ff, transparent: true, opacity: 0.15 })
        );
        outerOrbitRing.rotation.x = Math.PI / 2.2;
        outerOrbitRing.rotation.y = Math.PI / 5;
        scene.add(outerOrbitRing);

        // 5. Track Real-time Mouse Movements to Generate Intermittent Hover Matrix Slopes
        let physicsPointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
        window.addEventListener("mousemove", (e) => {
            physicsPointer.targetX = (e.clientX / window.innerWidth) * 2 - 1;
            physicsPointer.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // 6. Execution Runtime Anim Loop Setup
        const systemClock = new THREE.Clock();
        const renderMatrixLoop = () => {
            requestAnimationFrame(renderMatrixLoop);
            const elapsedTime = systemClock.getElapsedTime();

            // Interpolate tracking parameters smoothly using standard mathematical LERP formulas
            physicsPointer.x += (physicsPointer.targetX - physicsPointer.x) * 0.05;
            physicsPointer.y += (physicsPointer.targetY - physicsPointer.y) * 0.05;

            // Apply procedural continuous timeline spins layered over active pointer coordinate deltas
            if (planetClusterGroup) {
                planetClusterGroup.rotation.y = (Math.sin(elapsedTime * 0.12) * 0.3) + (physicsPointer.x * 0.4);
                planetClusterGroup.rotation.x = (Math.cos(elapsedTime * 0.06) * 0.1) + (-physicsPointer.y * 0.2);
            }

            if (outerOrbitRing) {
                outerOrbitRing.rotation.z = elapsedTime * 0.015;
            }

            renderer.render(scene, camera);
        };
        renderMatrixLoop();

        // 7. Responsive Rescale Anchor Handler Link
        window.addEventListener("resize", () => {
            const currentWidth = container.clientWidth;
            const currentHeight = container.clientHeight;
            camera.aspect = currentWidth / currentHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(currentWidth, currentHeight);
        });
    }

    /**
     * ==========================================================================
     * HIGH-FIDELITY PARALLAX CARDS DISPLACEMENT MANAGEMENT
     * Adds advanced fluid mouse tilt physics to game thumbnail grid blocks
     * ==========================================================================
     */
    registerParallaxCardsEngine() {
        const structuralTiles = document.querySelectorAll(".experienceCatalogCard, .quickAccessLinkCard, .welcomeHeroSection");
        
        structuralTiles.forEach(tile => {
            tile.style.transformStyle = "preserve-3d";
            tile.style.transition = "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.2s, box-shadow 0.2s";

            tile.addEventListener("mousemove", (event) => {
                const boundaryRect = tile.getBoundingClientRect();
                
                // Track pointer pixel displacements relative to card midpoint anchors
                const relativePointerX = event.clientX - boundaryRect.left;
                const relativePointerY = event.clientY - boundaryRect.top;
                
                // Formulate coordinate percentage ranges spanning values from -0.5 to 0.5
                const normalizedDisplacementX = (relativePointerX / boundaryRect.width) - 0.5;
                const normalizedDisplacementY = (relativePointerY / boundaryRect.height) - 0.5;

                // Restrict extreme tilting configurations using maximum angular caps
                const finalCalculatedTiltY = (normalizedDisplacementX * 8).toFixed(2);  // Degrees span restriction
                const finalCalculatedTiltX = (-normalizedDisplacementY * 8).toFixed(2); // Degrees span restriction

                tile.style.transform = `perspective(800px) rotateX(${finalCalculatedTiltX}deg) rotateY(${finalCalculatedTiltY}deg) scale3d(1.015, 1.015, 1.015)`;
                
                // Enhance visual depth by dynamic shifting highlight layer gradients inside children parameters
                const interiorThumbNode = tile.querySelector(".cardThumbnailFallback, .quickAccessIconCircle");
                if (interiorThumbNode) {
                    interiorThumbNode.style.transform = "translateZ(12px)";
                    interiorThumbNode.style.transition = "transform 0.1s ease";
                }
            });

            tile.addEventListener("mouseleave", () => {
                // Revert component transform positioning vectors smoothly back to baseline grids values
                // tile.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";const interiorThumbNode = tile.querySelector(".cardThumbnailFallback, .quickAccessIconCircle");if (interiorThumbNode) {interiorThumbNode.style.transform = "translateZ(0px)";}});});}/*** ==========================================================================* SYSTEM ROUTING INTERACTION AND EVENT REGISTRATION LISTENERS* ==========================================================================*/bindUserActionTriggers() {const engineContext = this;// 1. RESTRUCTURE NAVIGATION CLICK TRANSITIONS (Sidebar + Header links pooling)const bindRoutingNode = (elementNode) => {if (!elementNode) return;elementNode.addEventListener("click", (e) => {e.preventDefault();const primaryTargetUrl = elementNode.getAttribute("href");console.log([Router Action] Preparing secure data slots context handshake for path: ${primaryTargetUrl});// Trigger quick outward body fade transition effects across active containersdocument.body.style.opacity = "0.45";document.body.style.transition = "opacity 0.12s ease-out";setTimeout(() => { window.location.href = primaryTargetUrl; }, 120);});};engineContext.domElements.sidebarLinks.forEach(link => bindRoutingNode(link));engineContext.domElements.topTabs.forEach(tab => bindRoutingNode(tab));engineContext.domElements.quickLinks.forEach(card => bindRoutingNode(card));// 2. DISCOVER CORE SEARCH SUBMISSIONS PARSERif (engineContext.domElements.searchField) {engineContext.domElements.searchField.addEventListener("keydown", (e) => {if (e.key === "Enter" && engineContext.domElements.searchField.value.trim() !== "") {const cleanStringQuery = engineContext.domElements.searchField.value.trim();console.log([Database Filtering] Passing query variables upstream: "${cleanStringQuery}");window.location.href = discover.html?search=${encodeURIComponent(cleanStringQuery)};}});}// 3. MOCK REAL-TIME TRANSACTION MANAGER (Click balance pillar to add funds)if (engineContext.domElements.creditsBox) {engineContext.domElements.creditsBox.style.cursor = "pointer";engineContext.domElements.creditsBox.addEventListener("click", () => {engineContext.sessionState.user.credits += 500;// Animate micro flash changes indicators directly inside value boxesif (engineContext.domElements.creditDisplay) {engineContext.domElements.creditDisplay.style.color = "#00ff77";engineContext.domElements.creditDisplay.style.transition = "color 0.05s ease";engineContext.domElements.creditDisplay.textContent = engineContext.sessionState.user.credits.toLocaleString();setTimeout(() => {engineContext.domElements.creditDisplay.style.color = "#ffffff";}, 200);}console.log([Ledger Synch] Transaction authorized. Balance: ${engineContext.sessionState.user.credits} Credits.);});}// 4. ACTION HOOK SHORTCUT REDIRECT STRINGSconst shortcutCallButtons = document.querySelectorAll(".heroCallToActions .heroBtn, .absoluteCreateButton, .discoverGamesShortcutBtn, .viewAllRowLink");shortcutCallButtons.forEach(btn => bindRoutingNode(btn));// 5. GRID EXPERIENCE TILES LAUNCH PARSERSengineContext.domElements.cards.forEach(card => {card.addEventListener("click", () => {const targetGameTitle = card.querySelector(".cardGameTitle")?.textContent || "Experience Bundle";console.log([Client Sandbox] Allocating thread sockets memory. Spin lock up for experience instance: "${targetGameTitle}");// Direct route to our running runtime canvas engine frame pagewindow.location.href = "player3d.html";});});}}/**Instantiate framework engine runner inside the globally active client session layer*/document.addEventListener("DOMContentLoaded", () => {const riseupAppInstance = new RiseUpAppEngine();riseupAppInstance.launchEnginePipeline();});