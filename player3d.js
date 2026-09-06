import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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
const loadingTitle = document.getElementById("loadingTitle");
const loadingText = document.getElementById("loadingText");

const errorScreen = document.getElementById("error");
const errorText = document.getElementById("errorText");

const chooseModel = document.getElementById("chooseModel");
const modelFile = document.getElementById("modelFile");
const errorFile = document.getElementById("errorFile");

const retryButton = document.getElementById("retryButton");
const errorRetry = document.getElementById("errorRetry");

const statusText = document.getElementById("statusText");

const loader = new GLTFLoader();

init();
startLoading();

function init() {
    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x75cfff);

    scene.fog = new THREE.Fog(
        0x75cfff,
        30,
        120
    );

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

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure = 1.15;

    document
        .getElementById("game")
        .appendChild(renderer.domElement);

    clock = new THREE.Clock();

    createWorld();
    setupControls();

    window.addEventListener(
        "resize",
        resize
    );

    animate();
}

function createWorld() {

    const hemisphere =
        new THREE.HemisphereLight(
            0xffffff,
            0x5b8c58,
            2.4
        );

    scene.add(hemisphere);

    const sun =
        new THREE.DirectionalLight(
            0xffffff,
            3
        );

    sun.position.set(
        -20,
        35,
        20
    );

    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;

    scene.add(sun);

    const ground =
        new THREE.Mesh(
            new THREE.PlaneGeometry(300, 300),
            new THREE.MeshStandardMaterial({
                color: 0x66a85e,
                roughness: 1
            })
        );

    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;

    scene.add(ground);

    const pad =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                2.3,
                2.3,
                0.16,
                64
            ),
            new THREE.MeshStandardMaterial({
                color: 0xe8edf2,
                roughness: 0.8
            })
        );

    pad.position.y = 0.08;
    pad.receiveShadow = true;

    scene.add(pad);
}

async function startLoading() {

    setLoading(
        "Loading player...",
        "Checking for your 3D player model..."
    );

    /*
     * IMPORTANT:
     *
     * When player3d.html is opened directly from the
     * Chromebook, Chrome can block:
     *
     * models/player.glb
     *
     * Instead of waiting forever, we try it briefly.
     */

    const timeout = new Promise((_, reject) => {
        setTimeout(() => {
            reject(
                new Error(
                    "Automatic local loading timed out."
                )
            );
        }, 5000);
    });

    try {

        const gltf =
            await Promise.race([
                loadGLB("models/player.glb"),
                timeout
            ]);

        addPlayer(gltf.scene);

    } catch (error) {

        console.warn(
            "Automatic GLB loading unavailable:",
            error
        );

        showLocalFileOption();
    }
}

function loadGLB(path) {

    return new Promise(
        (resolve, reject) => {

            loader.load(
                path,

                resolve,

                (progress) => {

                    if (
                        progress &&
                        progress.total > 0
                    ) {

                        const percent =
                            Math.round(
                                (
                                    progress.loaded /
                                    progress.total
                                ) * 100
                            );

                        setLoading(
                            "Loading player...",
                            `${percent}% loaded`
                        );
                    }
                },

                reject
            );
        }
    );
}

function showLocalFileOption() {

    setLoading(
        "Player file ready",
        "Choose your real player.glb to load it directly."
    );

    chooseModel.style.display =
        "inline-flex";

    retryButton.style.display =
        "inline-flex";

    statusText.textContent =
        "Waiting for player.glb";
}

function handleFile(file) {

    if (!file) return;

    const name =
        file.name.toLowerCase();

    if (!name.endsWith(".glb")) {

        showError(
            "Please choose the actual player.glb file."
        );

        return;
    }

    setLoading(
        "Loading your 3D player...",
        "Reading " + file.name
    );

    chooseModel.style.display =
        "none";

    retryButton.style.display =
        "none";

    statusText.textContent =
        "Loading 3D model";

    /*
     * This is the important part.
     *
     * URL.createObjectURL lets Chrome read
     * the 59 MB GLB directly without needing
     * Live Server.
     */
    const objectURL =
        URL.createObjectURL(file);

    loader.load(
        objectURL,

        (gltf) => {

            URL.revokeObjectURL(
                objectURL
            );

            addPlayer(
                gltf.scene
            );
        },

        (progress) => {

            if (
                progress &&
                progress.total > 0
            ) {

                const percent =
                    Math.round(
                        (
                            progress.loaded /
                            progress.total
                        ) * 100
                    );

                setLoading(
                    "Loading your 3D player...",
                    `${percent}%`
                );
            } else {

                setLoading(
                    "Loading your 3D player...",
                    "Processing 59 MB model..."
                );
            }
        },

        (error) => {

            URL.revokeObjectURL(
                objectURL
            );

            console.error(
                "GLB loading error:",
                error
            );

            showError(
                "Chrome couldn't read this GLB. Make sure you selected your actual player.glb."
            );
        }
    );
}

function addPlayer(model) {

    if (player) {
        scene.remove(player);
    }

    player = model;

    let meshCount = 0;

    player.traverse((object) => {

        if (object.isMesh) {

            meshCount++;

            object.castShadow = true;
            object.receiveShadow = true;

            /*
             * Keep the original materials and textures.
             * We do NOT replace them or make the model fake.
             */
            if (object.material) {

                object.material.side =
                    THREE.FrontSide;
            }
        }
    });

    /*
     * Find the model's original dimensions.
     */
    const box =
        new THREE.Box3()
            .setFromObject(player);

    const size =
        new THREE.Vector3();

    box.getSize(size);

    /*
     * Normalize the player to approximately
     * 2.5 world units tall.
     */
    if (size.y > 0) {

        const scale =
            2.5 / size.y;

        player.scale.setScalar(
            scale
        );
    }

    /*
     * Recalculate after scaling.
     */
    const finalBox =
        new THREE.Box3()
            .setFromObject(player);

    const center =
        new THREE.Vector3();

    finalBox.getCenter(center);

    player.position.x =
        -center.x;

    player.position.z =
        -center.z;

    player.position.y =
        -finalBox.min.y;

    scene.add(player);

    velocityY = 0;
    grounded = true;

    loading.style.display =
        "none";

    errorScreen.style.display =
        "none";

    statusText.textContent =
        "Player ready";

    console.log(
        "RiseUp 3D player loaded."
    );

    console.log(
        "Meshes:",
        meshCount
    );

    console.log(
        "Original size:",
        size
    );
}

function setupControls() {

    window.addEventListener(
        "keydown",
        (event) => {

            keys[event.code] = true;

            if (
                event.code === "Space" &&
                grounded
            ) {

                velocityY =
                    JUMP_POWER;

                grounded = false;

                event.preventDefault();
            }
        }
    );

    window.addEventListener(
        "keyup",
        (event) => {

            keys[event.code] = false;
        }
    );

    window.addEventListener(
        "mousedown",
        (event) => {

            if (event.button !== 0)
                return;

            mouseDown = true;

            lastMouseX =
                event.clientX;

            lastMouseY =
                event.clientY;
        }
    );

    window.addEventListener(
        "mouseup",
        () => {

            mouseDown = false;
        }
    );

    window.addEventListener(
        "mousemove",
        (event) => {

            if (!mouseDown)
                return;

            const dx =
                event.clientX -
                lastMouseX;

            const dy =
                event.clientY -
                lastMouseY;

            lastMouseX =
                event.clientX;

            lastMouseY =
                event.clientY;

            yaw -= dx * 0.006;

            pitch -= dy * 0.004;

            pitch =
                THREE.MathUtils.clamp(
                    pitch,
                    -0.4,
                    1.1
                );
        }
    );

    window.addEventListener(
        "wheel",
        (event) => {

            cameraDistance +=
                event.deltaY * 0.004;

            cameraDistance =
                THREE.MathUtils.clamp(
                    cameraDistance,
                    3,
                    12
                );
        },
        {
            passive: true
        }
    );

    document
        .getElementById("exitButton")
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "home.html";
            }
        );

    modelFile?.addEventListener(
        "change",
        (event) => {

            handleFile(
                event.target.files?.[0]
            );
        }
    );

    errorFile?.addEventListener(
        "change",
        (event) => {

            handleFile(
                event.target.files?.[0]
            );
        }
    );

    retryButton?.addEventListener(
        "click",
        () => {

            chooseModel.style.display =
                "inline-flex";

            retryButton.style.display =
                "none";

            setLoading(
                "Choose your player",
                "Select the real player.glb file."
            );
        }
    );

    errorRetry?.addEventListener(
        "click",
        () => {

            errorScreen.style.display =
                "none";

            startLoading();
        }
    );
}

function updatePlayer(delta) {

    if (!player)
        return;

    let x = 0;
    let z = 0;

    if (
        keys["KeyW"] ||
        keys["ArrowUp"]
    ) {
        z -= 1;
    }

    if (
        keys["KeyS"] ||
        keys["ArrowDown"]
    ) {
        z += 1;
    }

    if (
        keys["KeyA"] ||
        keys["ArrowLeft"]
    ) {
        x -= 1;
    }

    if (
        keys["KeyD"] ||
        keys["ArrowRight"]
    ) {
        x += 1;
    }

    if (x !== 0 || z !== 0) {

        const input =
            new THREE.Vector3(
                x,
                0,
                z
            ).normalize();

        const forward =
            new THREE.Vector3(
                Math.sin(yaw),
                0,
                Math.cos(yaw)
            );

        const right =
            new THREE.Vector3(
                forward.z,
                0,
                -forward.x
            );

        const movement =
            new THREE.Vector3();

        movement.addScaledVector(
            forward,
            -input.z
        );

        movement.addScaledVector(
            right,
            input.x
        );

        movement.normalize();

        const speed =
            keys["ShiftLeft"] ||
            keys["ShiftRight"]
                ? RUN_SPEED
                : WALK_SPEED;

        player.position.addScaledVector(
            movement,
            speed * delta
        );

        const targetRotation =
            Math.atan2(
                movement.x,
                movement.z
            );

        player.rotation.y =
            smoothRotation(
                player.rotation.y,
                targetRotation,
                delta * 10
            );
    }

    if (!grounded) {

        velocityY -=
            GRAVITY * delta;

        player.position.y +=
            velocityY * delta;

        if (
            player.position.y <= 0
        ) {

            player.position.y = 0;

            velocityY = 0;

            grounded = true;
        }
    }
}

function smoothRotation(
    current,
    target,
    amount
) {

    let difference =
        target - current;

    difference =
        Math.atan2(
            Math.sin(difference),
            Math.cos(difference)
        );

    if (
        Math.abs(difference) <= amount
    ) {
        return target;
    }

    return current +
        Math.sign(difference) *
        amount;
}

function updateCamera() {

    if (!player)
        return;

    const target =
        player.position.clone();

    target.y += 1.25;

    const horizontal =
        Math.cos(pitch) *
        cameraDistance;

    const vertical =
        Math.sin(pitch) *
        cameraDistance;

    const position =
        new THREE.Vector3(
            target.x +
                Math.sin(yaw) *
                horizontal,

            target.y +
                vertical,

            target.z +
                Math.cos(yaw) *
                horizontal
        );

    camera.position.lerp(
        position,
        0.12
    );

    camera.lookAt(
        target
    );
}

function setLoading(
    title,
    text
) {

    loading.style.display =
        "flex";

    loadingTitle.textContent =
        title;

    loadingText.textContent =
        text;

    errorScreen.style.display =
        "none";
}

function showError(message) {

    loading.style.display =
        "none";

    errorScreen.style.display =
        "flex";

    errorText.textContent =
        message;

    statusText.textContent =
        "Player error";
}

function animate() {

    requestAnimationFrame(
        animate
    );

    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );

    updatePlayer(delta);
    updateCamera();

    renderer.render(
        scene,
        camera
    );
}

function resize() {

    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );
}