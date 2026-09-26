import * as THREE from "three";

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
