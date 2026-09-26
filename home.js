import * as THREE from "three";

/**
 * ==========================================================================
 * RISEUP GAME ENGINE FRAMEWORK - CORE HOME CONTROLLER INTERFACE
 * ==========================================================================
 * Build Context: Procedural client asset delivery systems architecture.
 * Operational Model: Replicating premium cloud gaming client dashboard grids.
 * Footprint Configuration: Highly structured pipeline layer layout profiles.
 */

// Global System Configuration State Mutator Pointers
const ENGINE_SESSION_METRICS = {
    clientVersion: "R3D-CORE-V2.18.4",
    renderPipelineActive: false,
    analyticsBufferSynced: true,
    localCacheVersion: 1042,
    sessionTimestamp: 1790412852,
    debugMode: false
};

// 3D Engine execution hooks for the animated blue logo planet
let artScene = null;
let artCamera = null;
let artRenderer = null;
let planetSphereNode = null;
let planetRingNode = null;
let spaceParticlesNode = null;

// Target Document DOM Hook Selectors Cache Matrix
const DOM_CACHE = {
    canvasFrameSlot: document.getElementById("hero3dCanvasContainer"),
    topTabLinks: document.querySelectorAll(".topTabLink"),
    sidebarLinks: document.querySelectorAll(".navLink"),
    searchFieldInput: document.querySelector(".navSearchWrapper input"),
    alertBtnTextButton: document.querySelector(".navbarTextButton"),
    dropdownProfileAvatarPill: document.querySelector(".userProfileAvatarPill"),
    creditsCounterContainer: document.querySelector(".coinBalanceCounter"),
    exploreGamesHeroBtn: document.querySelector(".heroCallToActions .heroBtn.primary"),
    customizeAvatarHeroBtn: document.querySelector(".heroCallToActions .heroBtn.secondary"),
    absoluteProjectCreateBtn: document.querySelector(".absoluteCreateButton"),
    shortcutRowLinks: document.querySelectorAll(".viewAllRowLink"),
    discoverGamesShortcutBtn: document.querySelector(".discoverGamesShortcutBtn"),
    experienceCatalogCards: document.querySelectorAll(".experienceCatalogCard"),
    quickAccessLinkCards: document.querySelectorAll(".quickAccessLinkCard")
};

// Simulated Local Persistence Session Variable Store Mockups
class LocalStorageSessionAdapter {
    constructor() {
        this.storeName = "RISEUP_USER_METRICS";
        this.defaultDataMatrix = {
            walletCredits: 0,
            avatarMoldId: "bone_clay",
            levelRank: 24,
            currentXp: 12450,
            ownedSkins: ["clay", "bone_clay"],
            sessionToken: "AUTH_STIVE_PIERRE_X7812"
        };
        this.initializeStorageInstance();
    }

    initializeStorageInstance() {
        try {
            const existingCache = localStorage.getItem(this.storeName);
            if (!existingCache) {
                localStorage.setItem(this.storeName, JSON.stringify(this.defaultDataMatrix));
            }
        } catch (storageError) {
            console.warn("[Storage Adapter Exception] Sandbox environment locked local write streams:", storageError);
        }
    }

    retrieveProperty(keyField) {
        try {
            const dataString = localStorage.getItem(this.storeName);
            if (!dataString) return this.defaultDataMatrix[keyField];
            const parsedObject = JSON.parse(dataString);
            return parsedObject[keyField] !== undefined ? parsedObject[keyField] : this.defaultDataMatrix[keyField];
        } catch (e) {
            return this.defaultDataMatrix[keyField];
        }
    }

    updateProperty(keyField, assignmentValue) {
        try {
            const dataString = localStorage.getItem(this.storeName);
            const currentObject = dataString ? JSON.parse(dataString) : this.defaultDataMatrix;
            currentObject[keyField] = assignmentValue;
            localStorage.setItem(this.storeName, JSON.stringify(currentObject));
            return true;
        } catch (e) {
            return false;
        }
    }
}

const GlobalSessionStore = new LocalStorageSessionAdapter();

// Initialize Core Runtime Initializer
document.addEventListener("DOMContentLoaded", () => {
    console.log(`%c[RiseUp Bootstrapper] Initializing Client Engine: ${ENGINE_SESSION_METRICS.clientVersion}`, "color: #0070f3; font-weight: bold;");
    initHeroStudioArt();
    initializeUIActionEngine();
    synchronizeLocalUserInterfaceData();
});

/**
 * ==========================================================================
 * THREE.JS WORKSPACE GRAPHICS ARCHITECTURE
 * ==========================================================================
 * Renders the high-fidelity blue planetary logo sphere element procedurally.
 * Handles automatic aspect adjustment bounds and canvas layer alpha hooks.
 */
function initHeroStudioArt() {
    if (!DOM_CACHE.canvasFrameSlot) {
        console.warn("[Render Warning] Hero illustration viewport mount target context was missing from current DOM layout view tree.");
        return;
    }

    const boxWidth = DOM_CACHE.canvasFrameSlot.clientWidth;
    const boxHeight = DOM_CACHE.canvasFrameSlot.clientHeight;

    // Build Scene Pipeline Layers
    artScene = new THREE.Scene();
    
    artCamera = new THREE.PerspectiveCamera(42, boxWidth / boxHeight, 0.1, 100);
    artCamera.position.set(0, 0, 5.2);

    artRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    artRenderer.setSize(boxWidth, boxHeight);
    artRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    artRenderer.outputColorSpace = THREE.SRGBColorSpace;
    DOM_CACHE.canvasFrameSlot.appendChild(artRenderer.domElement);

    // Balanced Lighting Environment Array
    const ambientLightRig = new THREE.AmbientLight(0xffffff, 1.4);
    artScene.add(ambientLightRig);

    const cyanKeyGlowLight = new THREE.DirectionalLight(0x5ca2ff, 2.5);
    cyanKeyGlowLight.position.set(4, 3, 5);
    artScene.add(cyanKeyGlowLight);

    const backAccentRimLight = new THREE.DirectionalLight(0x7000ff, 1.2);
    backAccentRimLight.position.set(-4, -2, -3);
    artScene.add(backAccentRimLight);

    // Build the Primary Blue Logo Planet Compound Node
    planetSphereNode = new THREE.Group();
    
    const coreSphereGeometry = new THREE.SphereGeometry(1.25, 64, 64);
    const coreSphereMaterial = new THREE.MeshStandardMaterial({
        color: 0x0064e0,
        roughness: 0.18,
        metalness: 0.15,
        flatShading: false
    });
    
    const planetBaseMesh = new THREE.Mesh(coreSphereGeometry, coreSphereMaterial);
    planetSphereNode.add(planetBaseMesh);

    // Compound Mathematical Geometric Assembly modeling a Flat 'R' Monogram Mark profile
    const markMaterialProfile = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        roughness: 0.25,
        metalness: 0.05
    });
    
    const letterStemElement = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.76, 0.1), markMaterialProfile);
    letterStemElement.position.set(-0.24, 0, 1.22);
    planetSphereNode.add(letterStemElement);

    const letterLoopElement = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.08, 16, 32, Math.PI * 1.5), markMaterialProfile);
    letterLoopElement.position.set(-0.05, 0.17, 1.22);
    letterLoopElement.rotation.z = -Math.PI / 2;
    planetSphereNode.add(letterLoopElement);

    const letterLegElement = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.38, 0.1), markMaterialProfile);
    letterLegElement.position.set(0.01, -0.19, 1.22);
    letterLegElement.rotation.z = -Math.PI / 4;
    planetSphereNode.add(letterLegElement);

    artScene.add(planetSphereNode);

    // Ambient Space Dust Star Field Buffer Formulation
    const particleGeometryBuffer = new THREE.BufferGeometry();
    const particleCount = 45;
    const positionCoordinatesArray = new Float32Array(particleCount * 3);

    for (let indexOffset = 0; indexOffset < particleCount * 3; indexOffset += 3) {
        positionCoordinatesArray[indexOffset] = (Math.random() - 0.5) * 6;
        positionCoordinatesArray[indexOffset + 1] = (Math.random() - 0.5) * 4;
        positionCoordinatesArray[indexOffset + 2] = (Math.random() - 0.5) * 3;
    }

    particleGeometryBuffer.setAttribute("position", new THREE.BufferAttribute(positionCoordinatesArray, 3));
    const pointMaterialAsset = new THREE.PointsMaterial({
        color: 0x8ab9ff,
        size: 0.025,
        transparent: true,
        opacity: 0.4
    });
    spaceParticlesNode = new THREE.Points(particleGeometryBuffer, pointMaterialAsset);
    artScene.add(spaceParticlesNode);

    // Ambient Planetary Atmospheric Outer Ring Wire Frame
    const atmosphericRingGeometry = new THREE.TorusGeometry(1.85, 0.016, 8, 64);
    const atmosphericRingMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.08 
    });
    planetRingNode = new THREE.Mesh(atmosphericRingGeometry, atmosphericRingMaterial);
    planetRingNode.rotation.x = Math.PI / 2.2;
    planetRingNode.rotation.y = Math.PI / 5.5;
    artScene.add(planetRingNode);

    // Bind viewport adjustment listeners
    window.addEventListener("resize", handleCanvasResize, { passive: true });

    // Launch Animation Engine Frame Loops
    const executionClockInstance = new THREE.Clock();
    ENGINE_SESSION_METRICS.renderPipelineActive = true;

    function renderExecutionPipelineFrame() {
        if (!ENGINE_SESSION_METRICS.renderPipelineActive) return;
        requestAnimationFrame(renderExecutionPipelineFrame);
        
        const totalElapsedTime = executionClockInstance.getElapsedTime();

        // Slow smooth planetary spin calculation loop matrices
        if (planetSphereNode) {
            planetSphereNode.rotation.y = Math.sin(totalElapsedTime * 0.08) * 0.35;
            planetSphereNode.rotation.x = Math.cos(totalElapsedTime * 0.04) * 0.08;
        }

        if (planetRingNode) {
            planetRingNode.rotation.z = totalElapsedTime * 0.015;
        }

        if (spaceParticlesNode) {spaceParticlesNode.rotation.y = totalElapsedTime * -0.01;}artRenderer.render(artScene, artCamera);}renderExecutionPipelineFrame();}function handleCanvasResize() {if (!DOM_CACHE.canvasFrameSlot || !artRenderer || !artCamera) return;const containerWidth = DOM_CACHE.canvasFrameSlot.clientWidth;const containerHeight = DOM_CACHE.canvasFrameSlot.clientHeight;artCamera.aspect = containerWidth / containerHeight;artCamera.updateProjectionMatrix();artRenderer.setSize(containerWidth, containerHeight);}