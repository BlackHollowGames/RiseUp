import * as THREE from "three";

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
rightArm.rotation.x = -Math.PI / 3;leftLeg.rotation.x = 0.2;rightLeg.rotation.x = -0.2;} else if (isMoving) {// Dynamic walking and running step swing cyclesconst waveSpeed = speed === RUN_SPEED ? 14 : 9;const waveAngle = speed === RUN_SPEED ? 0.6 : 0.4;leftArm.rotation.x = Math.sin(time * waveSpeed) * waveAngle;rightArm.rotation.x = -Math.sin(time * waveSpeed) * waveAngle;leftLeg.rotation.x = -Math.sin(time * waveSpeed) * waveAngle;rightLeg.rotation.x = Math.sin(time * waveSpeed) * waveAngle;} else {// Gentle breathing simulation during idle stateleftArm.rotation.x = THREE.MathUtils.lerp(leftArm.rotation.x, Math.sin(time * 2) * 0.05, 0.1);rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, -Math.sin(time * 2) * 0.05, 0.1);leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, 0, 0.1);rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, 0, 0.1);}}function smoothRotation(current, target, amount) {let difference = target - current;difference = Math.atan2(Math.sin(difference), Math.cos(difference));if (Math.abs(difference) <= amount) return target;return current + Math.sign(difference) * amount;}function updateCamera() {if (!player) return;const target = player.position.clone();target.y += 1.25;const horizontal = Math.cos(pitch) * cameraDistance;const vertical = Math.sin(pitch) * cameraDistance;const position = new THREE.Vector3(target.x + Math.sin(yaw) * horizontal,target.y + vertical,target.z + Math.cos(yaw) * horizontal);camera.position.lerp(position, 0.12);camera.lookAt(target);}function animate() {requestAnimationFrame(animate);const delta = Math.min(clock.getDelta(), 0.05);const time = clock.getElapsedTime();updatePlayer(delta, time);updateCamera();renderer.render(scene, camera);}function resize() {camera.aspect = window.innerWidth / window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth, window.innerHeight);}
