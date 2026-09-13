(() => {
  "use strict";

  /*
   * =========================================================
   * RISEUP PLAYER 3D
   * Combined character + gameplay engine
   *
   * player3d.js
   * =========================================================
   *
   * Includes:
   * - RiseUp character model
   * - Face
   * - Idle animation
   * - Walk animation
   * - Run animation
   * - Jump animation
   * - Falling animation
   * - Gravity
   * - Character movement
   * - Third-person camera
   * - Mouse look
   * - World
   * - Ground
   * - Sky
   * - Sun
   * - Trees
   * - Platforms
   * - FPS counter
   * =========================================================
   */

  const RiseUpPlayer3D = {
    scene: null,
    camera: null,
    renderer: null,

    character: null,

    ground: null,
    grid: null,

    keys: {
      w: false,
      a: false,
      s: false,
      d: false,
      shift: false
    },

    mouse: {
      locked: false,
      yaw: 0,
      pitch: -0.18,
      sensitivity: 0.0025
    },

    cameraDistance: 7,
    cameraHeight: 3.0,

    lastTime: 0,
    frames: 0,
    fpsTime: 0,
    fps: 60,

    elements: {}
  };

  /* =========================================================
     CHARACTER
     ========================================================= */

  class RiseUpCharacter {
    constructor(
      scene,
      options = {}
    ) {
      this.scene =
        scene;

      this.group =
        new THREE.Group();

      this.group.name =
        "RiseUpCharacter";

      this.walkSpeed =
        Number(
          options.walkSpeed
        ) || 7;

      this.runSpeed =
        Number(
          options.runSpeed
        ) || 12;

      this.jumpPower =
        Number(
          options.jumpPower
        ) || 10;

      this.gravity =
        Number(
          options.gravity
        ) || 25;

      this.velocityY =
        0;

      this.grounded =
        true;

      this.state =
        "idle";

      this.time =
        0;

      this.keys = {
        w: false,
        a: false,
        s: false,
        d: false,
        shift: false
      };

      this.createMaterials();

      this.createCharacter();

      this.group.position.set(
        Number(
          options.x
        ) || 0,

        Number(
          options.y
        ) || 0,

        Number(
          options.z
        ) || 6
      );

      scene.add(
        this.group
      );
    }

    /* =======================================================
       CHARACTER MATERIALS
       ======================================================= */

    createMaterials() {
      this.yellowMaterial =
        new THREE.MeshStandardMaterial({
          color: 0xffe047,
          roughness: 0.42,
          metalness: 0
        });

      this.blueMaterial =
        new THREE.MeshStandardMaterial({
          color: 0x249bff,
          roughness: 0.4,
          metalness: 0
        });

      this.greenMaterial =
        new THREE.MeshStandardMaterial({
          color: 0x00a82d,
          roughness: 0.45,
          metalness: 0
        });

      this.blackMaterial =
        new THREE.MeshStandardMaterial({
          color: 0x101010,
          roughness: 0.3,
          metalness: 0
        });
    }

    /* =======================================================
       CHARACTER BUILD
       ======================================================= */

    createCharacter() {
      this.body =
        new THREE.Group();

      this.body.name =
        "CharacterBody";

      this.createHead();

      this.createTorso();

      this.createArms();

      this.createLegs();

      this.group.add(
        this.body
      );
    }

    /* =======================================================
       HEAD
       ======================================================= */

    createHead() {
      this.head =
        new THREE.Group();

      this.head.name =
        "Head";

      const head =
        new THREE.Mesh(
          new THREE.SphereGeometry(
            0.5,
            40,
            32
          ),

          this.yellowMaterial
        );

      head.name =
        "HeadMesh";

      head.castShadow =
        true;

      head.receiveShadow =
        true;

      this.head.add(
        head
      );

      /*
       * Eyes
       */

      const eyeGeometry =
        new THREE.SphereGeometry(
          0.056,
          16,
          12
        );

      const leftEye =
        new THREE.Mesh(
          eyeGeometry,
          this.blackMaterial
        );

      const rightEye =
        new THREE.Mesh(
          eyeGeometry,
          this.blackMaterial
        );

      leftEye.position.set(
        -0.16,
        0.05,
        0.456
      );

      rightEye.position.set(
        0.16,
        0.05,
        0.456
      );

      this.head.add(
        leftEye
      );

      this.head.add(
        rightEye
      );

      /*
       * Smile
       */

      const smileCurve =
        new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(
            -0.12,
            -0.08,
            0.467
          ),

          new THREE.Vector3(
            0,
            -0.16,
            0.482
          ),

          new THREE.Vector3(
            0.12,
            -0.08,
            0.467
          )
        );

      const smile =
        new THREE.Mesh(
          new THREE.TubeGeometry(
            smileCurve,
            16,
            0.014,
            8,
            false
          ),

          this.blackMaterial
        );

      this.head.add(
        smile
      );

      this.head.position.y =
        1.77;

      this.body.add(
        this.head
      );
    }

    /* =======================================================
       TORSO
       ======================================================= */

    createTorso() {
      let geometry;

      if (
        typeof THREE.CapsuleGeometry ===
        "function"
      ) {
        geometry =
          new THREE.CapsuleGeometry(
            0.4,
            0.72,
            8,
            20
          );
      } else {
        geometry =
          new THREE.CylinderGeometry(
            0.4,
            0.4,
            1,
            32
          );
      }

      this.torso =
        new THREE.Mesh(
          geometry,
          this.blueMaterial
        );

      this.torso.name =
        "Torso";

      this.torso.position.y =
        1;

      this.torso.castShadow =
        true;

      this.torso.receiveShadow =
        true;

      this.body.add(
        this.torso
      );
    }

    /* =======================================================
       ARMS
       ======================================================= */

    createArms() {
      this.leftArm =
        this.createLimb(
          "LeftArm",
          0.15,
          0.75,
          this.yellowMaterial
        );

      this.rightArm =
        this.createLimb(
          "RightArm",
          0.15,
          0.75,
          this.yellowMaterial
        );

      this.leftArm.position.set(
        -0.58,
        1,
        0
      );

      this.rightArm.position.set(
        0.58,
        1,
        0
      );

      this.body.add(
        this.leftArm
      );

      this.body.add(
        this.rightArm
      );
    }

    /* =======================================================
       LEGS
       ======================================================= */

    createLegs() {
      this.leftLeg =
        this.createLimb(
          "LeftLeg",
          0.18,
          0.64,
          this.greenMaterial
        );

      this.rightLeg =
        this.createLimb(
          "RightLeg",
          0.18,
          0.64,
          this.greenMaterial
        );

      this.leftLeg.position.set(
        -0.24,
        0.25,
        0
      );

      this.rightLeg.position.set(
        0.24,
        0.25,
        0
      );

      this.body.add(
        this.leftLeg
      );

      this.body.add(
        this.rightLeg
      );
    }

    /* =======================================================
       LIMBS
       ======================================================= */

    createLimb(
      name,
      radius,
      height,
      material
    ) {
      let geometry;

      if (
        typeof THREE.CapsuleGeometry ===
        "function"
      ) {
        geometry =
          new THREE.CapsuleGeometry(
            radius,
            height,
            8,
            14
          );
      } else {
        geometry =
          new THREE.CylinderGeometry(
            radius,
            radius,
            height +
              radius * 2,
            20
          );
      }

      const limb =
        new THREE.Mesh(
          geometry,
          material
        );

      limb.name =
        name;

      limb.castShadow =
        true;

      limb.receiveShadow =
        true;

      return limb;
    }

    /* =======================================================
       KEY INPUT
       ======================================================= */

    setKey(
      key,
      pressed
    ) {
      const value =
        String(
          key
        ).toLowerCase();

      if (
        Object.prototype.hasOwnProperty.call(
          this.keys,
          value
        )
      ) {
        this.keys[value] =
          pressed;
      }
    }

    /* =======================================================
       PLAYER UPDATE
       ======================================================= */

    update(
      delta,
      cameraYaw
    ) {
      this.time +=
        delta;

      const direction =
        new THREE.Vector3();

      if (
        this.keys.w
      ) {
        direction.z -= 1;
      }

      if (
        this.keys.s
      ) {
        direction.z += 1;
      }

      if (
        this.keys.a
      ) {
        direction.x -= 1;
      }

      if (
        this.keys.d
      ) {
        direction.x += 1;
      }

      /*
       * Movement
       */

      if (
        direction.lengthSq() >
        0
      ) {
        direction.normalize();

        direction.applyAxisAngle(
          new THREE.Vector3(
            0,
            1,
            0
          ),
          cameraYaw
        );

        const running =
          this.keys.shift;

        const speed =
          running
            ? this.runSpeed
            : this.walkSpeed;

        this.group.position.x +=
          direction.x *
          speed *
          delta;

        this.group.position.z +=
          direction.z *
          speed *
          delta;

        const targetRotation =
          Math.atan2(
            direction.x,
            direction.z
          );

        this.group.rotation.y =
          smoothAngle(
            this.group.rotation.y,
            targetRotation,
            Math.min(
              1,
              delta * 12
            )
          );

        this.state =
          running
            ? "running"
            : "walking";
      } else if (
        this.grounded
      ) {
        this.state =
          "idle";
      }

      /*
       * Gravity
       */

      this.updatePhysics(
        delta
      );

      /*
       * Animation
       */

      this.updateAnimation();
    }

    /* =======================================================
       PHYSICS
       ======================================================= */

    updatePhysics(
      delta
    ) {
      if (
        !this.grounded
      ) {
        this.velocityY -=
          this.gravity *
          delta;

        this.group.position.y +=
          this.velocityY *
          delta;

        if (
          this.velocityY < 0
        ) {
          this.state =
            "falling";
        }
      }

      if (
        this.group.position.y <=
        0
      ) {
        this.group.position.y =
          0;

        this.velocityY =
          0;

        this.grounded =
          true;

        if (
          this.state ===
            "falling" ||
          this.state ===
            "jumping"
        ) {
          this.state =
            "idle";
        }
      }
    }

    /* =======================================================
       JUMP
       ======================================================= */

    jump() {
      if (
        !this.grounded
      ) {
        return;
      }

      this.velocityY =
        this.jumpPower;

      this.grounded =
        false;

      this.state =
        "jumping";
    }

    /* =======================================================
       ANIMATION STATE
       ======================================================= */

    updateAnimation() {
      if (
        this.state ===
        "running"
      ) {
        this.animateRun(
          this.time
        );

        return;
      }

      if (
        this.state ===
        "walking"
      ) {
        this.animateWalk(
          this.time
        );

        return;
      }

      if (
        this.state ===
          "jumping" ||
        this.state ===
          "falling"
      ) {
        this.animateJump(
          this.time
        );

        return;
      }

      this.animateIdle(
        this.time
      );
    }

    /* =======================================================
       IDLE
       ======================================================= */

    animateIdle(
      time
    ) {
      const breathing =
        Math.sin(
          time * 1.8
        );

      const sway =
        Math.sin(
          time * 0.7
        );

      /*
       * Gentle breathing.
       */

      this.body.position.y =
        breathing *
        0.018;

      this.torso.scale.y =
        1 +
        breathing *
        0.01;

      /*
       * Head.
       */

      this.head.rotation.x =
        Math.sin(
          time * 0.8
        ) *
        0.012;

      this.head.rotation.z =
        Math.sin(
          time * 0.6
        ) *
        0.012;

      /*
       * Arms.
       */

      this.leftArm.rotation.x =
        Math.sin(
          time * 1.1
        ) *
        0.012;

      this.rightArm.rotation.x =
        Math.sin(
          time * 1.1 +
            Math.PI
        ) *
        0.012;

      this.leftArm.rotation.z =
        -0.07 +
        sway *
        0.01;

      this.rightArm.rotation.z =
        0.07 +
        sway *
        0.01;

      /*
       * Legs.
       */

      this.leftLeg.rotation.x =
        0;

      this.rightLeg.rotation.x =
        0;
    }

    /* =======================================================
       WALK
       ======================================================= */

    animateWalk(
      time
    ) {
      const cycle =
        Math.sin(
          time * 8
        );

      const opposite =
        Math.sin(
          time * 8 +
            Math.PI
        );

      this.body.position.y =
        Math.abs(
          cycle
        ) *
        0.035;

      this.leftLeg.rotation.x =
        cycle *
        0.45;

      this.rightLeg.rotation.x =
        opposite *
        0.45;

      this.leftArm.rotation.x =
        opposite *
        0.3;

      this.rightArm.rotation.x =
        cycle *
        0.3;

      this.head.rotation.x =
        Math.sin(
          time * 8
        ) *
        0.015;

      this.torso.scale.y =
        1.01;
    }

    /* =======================================================
       RUN
       ======================================================= */

    animateRun(
      time
    ) {
      const cycle =
        Math.sin(
          time * 12
        );

      const opposite =
        Math.sin(
          time * 12 +
            Math.PI
        );

      this.body.position.y =
        Math.abs(
          cycle
        ) *
        0.06;

      this.leftLeg.rotation.x =
        cycle *
        0.78;

      this.rightLeg.rotation.x =
        opposite *
        0.78;

      this.leftArm.rotation.x =
        opposite *
        0.55;

      this.rightArm.rotation.x =
        cycle *
        0.55;

      this.head.rotation.x =
        -0.035;
    }

    /* =======================================================
       JUMP
       ======================================================= */

    animateJump(
      time
    ) {
      this.body.position.y =
        Math.sin(
          time * 5
        ) *
        0.02;

      this.leftArm.rotation.x =
        -0.4;

      this.rightArm.rotation.x =
        -0.4;

      this.leftLeg.rotation.x =
        0.18;

      this.rightLeg.rotation.x =
        -0.18;

      this.head.rotation.x =
        -0.025;
    }

    /* =======================================================
       PUBLIC CHARACTER CONTROLS
       ======================================================= */

    setPosition(
      x,
      y,
      z
    ) {
      this.group.position.set(
        x,
        y,
        z
      );
    }

    getPosition() {
      return {
        x:
          this.group.position.x,

        y:
          this.group.position.y,

        z:
          this.group.position.z
      };
    }
  }

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    cacheElements();

    if (
      !window.THREE
    ) {
      showError(
        "Three.js could not load."
      );

      return;
    }

    setupScene();

    setupWorld();

    setupCharacter();

    setupControls();

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    hideLoading();

    requestAnimationFrame(
      gameLoop
    );
  }

  /* =========================================================
     ELEMENTS
     ========================================================= */

  function cacheElements() {
    RiseUpPlayer3D.elements.viewport =
      document.getElementById(
        "viewport"
      );

    RiseUpPlayer3D.elements.fps =
      document.getElementById(
        "fpsCounter"
      );

    RiseUpPlayer3D.elements.state =
      document.getElementById(
        "stateCounter"
      );

    RiseUpPlayer3D.elements.loading =
      document.getElementById(
        "loading"
      );
  }

  /* =========================================================
     SCENE
     ========================================================= */

  function setupScene() {
    const viewport =
      RiseUpPlayer3D
        .elements
        .viewport;

    if (!viewport) {
      throw new Error(
        "Viewport element not found."
      );
    }

    RiseUpPlayer3D.scene =
      new THREE.Scene();

    RiseUpPlayer3D.scene.background =
      new THREE.Color(
        0x91bddd
      );

    RiseUpPlayer3D.scene.fog =
      new THREE.Fog(
        0x91bddd,
        55,
        280
      );

    RiseUpPlayer3D.camera =
      new THREE.PerspectiveCamera(
        65,
        1,
        0.1,
        2000
      );

    RiseUpPlayer3D.camera.position.set(
      0,
      4,
      12
    );

    RiseUpPlayer3D.renderer =
      new THREE.WebGLRenderer({
        antialias: true
      });

    RiseUpPlayer3D.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio ||
          1,
        2
      )
    );

    RiseUpPlayer3D.renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    RiseUpPlayer3D.renderer.shadowMap.enabled =
      true;

    RiseUpPlayer3D.renderer.shadowMap.type =
      THREE.PCFSoftShadowMap;

    viewport.innerHTML =
      "";

    viewport.appendChild(
      RiseUpPlayer3D
        .renderer
        .domElement
    );
  }

  /* =========================================================
     WORLD
     ========================================================= */

  function setupWorld() {
    const scene =
      RiseUpPlayer3D.scene;

    /*
     * Sky.
     */

    const sky =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          900,
          32,
          20
        ),
        new THREE.MeshBasicMaterial({
          color: 0x91bddd,
          side:
            THREE.BackSide
        })
      );

    scene.add(
      sky
    );

    /*
     * Atmosphere.
     */

    const hemisphere =
      new THREE.HemisphereLight(
        0xe3f2ff,
        0x34402f,
        2.4
      );

    scene.add(
      hemisphere
    );

    /*
     * Sun.
     */

    const sun =
      new THREE.DirectionalLight(
        0xfff0cf,
        3.5
      );

    sun.position.set(
      60,
      110,
      40
    );

    sun.castShadow =
      true;

    sun.shadow.mapSize.width =
      2048;

    sun.shadow.mapSize.height =
      2048;

    sun.shadow.camera.left =
      -110;

    sun.shadow.camera.right =
      110;

    sun.shadow.camera.top =
      110;

    sun.shadow.camera.bottom =
      -110;

    scene.add(
      sun
    );

    /*
     * Ground.
     */

    const ground =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          500,
          2,
          500
        ),

        new THREE.MeshStandardMaterial({
          color: 0x526550,
          roughness: 1
        })
      );

    ground.position.y =
      -1;

    ground.receiveShadow =
      true;

    RiseUpPlayer3D.ground =
      ground;

    scene.add(
      ground
    );

    /*
     * Grid.
     */

    const grid =
      new THREE.GridHelper(
        300,
        60,
        0x8ea18e,
        0x617063
      );

    grid.position.y =
      0.01;

    RiseUpPlayer3D.grid =
      grid;

    scene.add(
      grid
    );

    createEnvironment();
  }

  function createEnvironment() {
    createPlatform(
      0,
      0,
      0,
      5,
      0.5,
      5,
      0x4e7594
    );

    createPlatform(
      0,
      0,
      -22,
      4,
      0.5,
      4,
      0x607968
    );

    createPlatform(
      23,
      0,
      0,
      4,
      0.5,
      4,
      0x776f54
    );

    createTree(
      -13,
      0,
      -8
    );

    createTree(
      15,
      0,
      -16
    );

    createTree(
      -18,
      0,
      17
    );

    createTree(
      24,
      0,
      18
    );
  }

  function createPlatform(
    x,
    y,
    z,
    width,
    height,
    depth,
    color
  ) {
    const platform =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          width * 2,
          height * 2,
          depth * 2
        ),

        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.85
        })
      );

    platform.position.set(
      x,
      y,
      z
    );

    platform.castShadow =
      true;

    platform.receiveShadow =
      true;

    RiseUpPlayer3D.scene.add(
      platform
    );
  }

  function createTree(
    x,
    y,
    z
  ) {
    const trunk =
      new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.35,
          0.48,
          3,
          12
        ),

        new THREE.MeshStandardMaterial({
          color: 0x765038,
          roughness: 1
        })
      );

    trunk.position.set(
      x,
      y + 1.5,
      z
    );

    trunk.castShadow =
      true;

    RiseUpPlayer3D.scene.add(
      trunk
    );

    const leaves =
      new THREE.Mesh(
        new THREE.SphereGeometry(
          1.8,
          20,
          15
        ),

        new THREE.MeshStandardMaterial({
          color: 0x438149,
          roughness: 0.95
        })
      );

    leaves.position.set(
      x,
      y + 4,
      z
    );

    leaves.castShadow =
      true;

    RiseUpPlayer3D.scene.add(
      leaves
    );
  }

  /* =========================================================
     CHARACTER SETUP
     ========================================================= */

  function setupCharacter() {
    RiseUpPlayer3D.character =
      new RiseUpCharacter(
        RiseUpPlayer3D.scene,
        {
          x: 0,
          y: 0,
          z: 6,

          walkSpeed: 7,
          runSpeed: 12,
          jumpPower: 10,
          gravity: 25
        }
      );
  }

  /* =========================================================
     CONTROLS
     ========================================================= */

  function setupControls() {
    const renderer =
      RiseUpPlayer3D
        .renderer;

    document.addEventListener(
      "keydown",
      onKeyDown
    );

    document.addEventListener(
      "keyup",
      onKeyUp
    );

    renderer.domElement.addEventListener(
      "click",
      () => {
        if (
          renderer.domElement
            .requestPointerLock
        ) {
          renderer.domElement.requestPointerLock();
        }
      }
    );

    document.addEventListener(
      "mousemove",
      onMouseMove
    );

    document.addEventListener(
      "pointerlockchange",
      () => {
        RiseUpPlayer3D.mouse =
          RiseUpPlayer3D.mouse || {
            locked: false
          };

        RiseUpPlayer3D.mouse.locked =
          document.pointerLockElement ===
          renderer.domElement;
      }
    );
  }

  function onKeyDown(
    event
  ) {
    const key =
      event.key.toLowerCase();

    const character =
      RiseUpPlayer3D.character;

    if (
      key === "w" ||
      key === "a" ||
      key === "s" ||
      key === "d"
    ) {
      RiseUpPlayer3D.keys[key] =
        true;

      character?.setKey(
        key,
        true
      );
    }

    if (
      key === "shift"
    ) {
      RiseUpPlayer3D.keys.shift =
        true;

      character?.setKey(
        "shift",
        true
      );
    }

    if (
      event.code === "Space"
    ) {
      event.preventDefault();

      character?.jump();
    }
  }

  function onKeyUp(
    event
  ) {
    const key =
      event.key.toLowerCase();

    const character =
      RiseUpPlayer3D.character;

    if (
      key === "w" ||
      key === "a" ||
      key === "s" ||
      key === "d"
    ) {
      RiseUpPlayer3D.keys[key] =
        false;

      character?.setKey(
        key,
        false
      );
    }

    if (
      key === "shift"
    ) {
      RiseUpPlayer3D.keys.shift =
        false;

      character?.setKey(
        "shift",
        false
      );
    }
  }

  function onMouseMove(
    event
  ) {
    if (
      !RiseUpPlayer3D.mouse ||
      !RiseUpPlayer3D.mouse.locked
    ) {
      return;
    }

    RiseUpPlayer3D.mouse.yaw -=
      event.movementX *
      RiseUpPlayer3D.mouse.sensitivity;

    RiseUpPlayer3D.mouse.pitch -=
      event.movementY *
      RiseUpPlayer3D.mouse.sensitivity;

    RiseUpPlayer3D.mouse.pitch =
      Math.max(
        -0.9,
        Math.min(
          0.55,
          RiseUpPlayer3D.mouse.pitch
        )
      );
  }

  /* =========================================================
     CAMERA
     ========================================================= */

  function updateCamera(
    delta
  ) {
    const character =
      RiseUpPlayer3D.character;

    const camera =
      RiseUpPlayer3D.camera;

    if (
      !character ||
      !camera
    ) {
      return;
    }

    const player =
      character.group.position;

    const mouse =
      RiseUpPlayer3D.mouse;

    const yaw =
      mouse?.yaw || 0;

    const pitch =
      mouse?.pitch || -0.18;

    const distance =
      RiseUpPlayer3D.cameraDistance;

    const horizontalDistance =
      distance *
      Math.cos(
        pitch
      );

    const target =
      new THREE.Vector3(
        player.x,
        player.y + 1.25,
        player.z
      );

    const desired =
      new THREE.Vector3(
        player.x -
          Math.sin(yaw) *
          horizontalDistance,

        player.y +
          1.25 -
          Math.sin(pitch) *
          distance,

        player.z -
          Math.cos(yaw) *
          horizontalDistance
      );

    camera.position.lerp(
      desired,
      Math.min(
        1,
        delta * 8
      )
    );

    camera.lookAt(
      target
    );
  }

  /* =========================================================
     GAME LOOP
     ========================================================= */

  function gameLoop(
    timestamp
  ) {
    const delta =
      RiseUpPlayer3D.lastTime
        ? Math.min(
            0.05,
            (
              timestamp -
              RiseUpPlayer3D.lastTime
            ) /
            1000
          )
        : 0.016;

    RiseUpPlayer3D.lastTime =
      timestamp;

    updateFPS(
      delta
    );

    if (
      RiseUpPlayer3D.character
    ) {
      RiseUpPlayer3D.character.update(
        delta,
        RiseUpPlayer3D.mouse?.yaw ||
          0
      );
    }

    updateCamera(
      delta
    );

    updateHUD();

    if (
      RiseUpPlayer3D.renderer
    ) {
      RiseUpPlayer3D.renderer.render(
        RiseUpPlayer3D.scene,
        RiseUpPlayer3D.camera
      );
    }

    requestAnimationFrame(
      gameLoop
    );
  }

  /* =========================================================
     FPS
     ========================================================= */

  function updateFPS(
    delta
  ) {
    RiseUpPlayer3D.frames++;

    RiseUpPlayer3D.fpsTime +=
      delta;

    if (
      RiseUpPlayer3D.fpsTime >=
      0.5
    ) {
      RiseUpPlayer3D.fps =
        Math.round(
          RiseUpPlayer3D.frames /
            RiseUpPlayer3D.fpsTime
        );

      RiseUpPlayer3D.frames =
        0;

      RiseUpPlayer3D.fpsTime =
        0;
    }
  }

  function updateHUD() {
    const fps =
      RiseUpPlayer3D
        .elements
        .fps;

    const state =
      RiseUpPlayer3D
        .elements
        .state;

    const character =
      RiseUpPlayer3D.character;

    if (fps) {
      fps.textContent =
        `${RiseUpPlayer3D.fps} FPS`;
    }

    if (
      state &&
      character
    ) {
      state.textContent =
        character.state
          .charAt(0)
          .toUpperCase() +
        character.state.slice(1);
    }
  }

  /* =========================================================
     RESIZE
     ========================================================= */

  function resize() {
    const viewport =
      RiseUpPlayer3D
        .elements
        .viewport;

    const camera =
      RiseUpPlayer3D.camera;

    const renderer =
      RiseUpPlayer3D.renderer;

    if (
      !viewport ||
      !camera ||
      !renderer
    ) {
      return;
    }

    const width =
      Math.max(
        1,
        viewport.clientWidth
      );

    const height =
      Math.max(
        1,
        viewport.clientHeight
      );

    renderer.setSize(
      width,
      height,
      false
    );

    camera.aspect =
      width /
      height;

    camera.updateProjectionMatrix();
  }

  /* =========================================================
     LOADING
     ========================================================= */

  function hideLoading() {
    const loading =
      RiseUpPlayer3D
        .elements
        .loading;

    if (!loading) {
      return;
    }

    setTimeout(
      () => {
        loading.classList.add(
          "hidden"
        );
      },
      300
    );
  }

  function showError(
    message
  ) {
    const loading =
      RiseUpPlayer3D
        .elements
        .loading;

    if (!loading) {
      alert(message);
      return;
    }

    loading.innerHTML =
      `
        <div class="loading-box">
          <strong>RiseUp</strong>
          <span>${escapeHtml(
            message
          )}</span>
        </div>
      `;
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.RiseUpPlayer3D =
    RiseUpPlayer3D;

  window.RiseUpCharacter =
    RiseUpCharacter;

  /* =========================================================
     START
     ========================================================= */

  init();
})();
