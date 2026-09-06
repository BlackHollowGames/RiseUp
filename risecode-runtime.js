(() => {

  "use strict";


  const Runtime = {


    /* ======================================================
       RUN
       ====================================================== */

    run(
      files,
      game
    ) {

      if (!game) {

        game =
          window.RiseUp3DGame;

      }


      if (!game) {

        throw new Error(
          "RiseUp 3D engine is unavailable."
        );
      }


      const source =
        (
          Array.isArray(files)
            ? files
            : []
        )
          .map(
            file =>
              file &&
              typeof file.code ===
                "string"
                ? file.code
                : ""
          )
          .join("\n");


      if (!source.trim()) {

        return game;

      }


      let parsed = [];


      if (
        window.RiseCode
      ) {

        parsed =
          window.RiseCode.parse(
            source
          );

      }


      const state =
        this.createState();


      game.scriptState =
        state;


      this.extractSettings(
        source,
        state
      );


      this.extractWeapon(
        source,
        state
      );


      this.extractLighting(
        source,
        state
      );


      this.extractHUD(
        source,
        state
      );


      this.extractMap(
        source,
        state
      );


      this.extractWaves(
        source,
        state
      );


      this.apply(
        game,
        state
      );


      /*
       * Process explicit commands.
       */
      parsed.forEach(
        instruction => {

          if (
            instruction.type ===
            "command"
          ) {

            this.command(
              instruction.value,
              game
            );

          }

        }
      );


      this.emit(
        "RiseScript executed."
      );


      return game;
    },


    /* ======================================================
       STATE
       ====================================================== */

    createState() {

      return {

        game: {

          name:
            "Untitled",

          mode:
            "FPS"

        },


        world: {

          gravity:
            25,

          skybox:
            "DaySky",

          ambientLight:
            0.35

        },


        camera: {

          mode:
            "FirstPerson",

          fov:
            90,

          sensitivity:
            0.8

        },


        player: {

          walkSpeed:
            7,

          runSpeed:
            11,

          jumpPower:
            9,

          health:
            100,

          maxHealth:
            100,

          armor:
            25,

          ammo:
            30,

          maxAmmo:
            30,

          reserveAmmo:
            120,

          score:
            0,

          kills:
            0,

          weapon:
            "Rifle"

        },


        rifle: {

          damage:
            25,

          fireRate:
            0.09,

          magazineSize:
            30,

          reloadTime:
            1.8,

          range:
            500,

          recoil:
            1.5,

          spread:
            0.015

        },


        lighting: {

          directional:
            true,

          intensity:
            1.2,

          fog:
            true,

          fogStart:
            80,

          fogEnd:
            220,

          bloom:
            false

        },


        map: {

          create:
            false

        },


        wave: {

          enabled:
            false,

          number:
            0

        },


        hud: {

          enabled:
            true

        }

      };
    },


    /* ======================================================
       SETTINGS
       ====================================================== */

    extractSettings(
      source,
      state
    ) {

      const read =
        (
          regex,
          fallback
        ) => {

          const match =
            source.match(
              regex
            );

          if (!match)
            return fallback;

          return this.value(
            match[1]
          );
        };


      state.game.name =
        read(
          /game\.name\s*=\s*(.+?);/,
          state.game.name
        );


      state.game.mode =
        read(
          /game\.mode\s*=\s*(.+?);/,
          state.game.mode
        );


      state.world.gravity =
        Number(
          read(
            /world\.gravity\s*=\s*(.+?);/,
            state.world.gravity
          )
        );


      state.world.skybox =
        read(
          /world\.skybox\s*=\s*(.+?);/,
          state.world.skybox
        );


      state.world.ambientLight =
        Number(
          read(
            /world\.ambientLight\s*=\s*(.+?);/,
            state.world.ambientLight
          )
        );


      state.camera.mode =
        read(
          /camera\.mode\s*=\s*(.+?);/,
          state.camera.mode
        );


      state.camera.fov =
        Number(
          read(
            /camera\.fov\s*=\s*(.+?);/,
            state.camera.fov
          )
        );


      state.camera.sensitivity =
        Number(
          read(
            /camera\.sensitivity\s*=\s*(.+?);/,
            state.camera.sensitivity
          )
        );


      state.player.walkSpeed =
        Number(
          read(
            /player\.walk\.speed\s*=\s*(.+?);/,
            state.player.walkSpeed
          )
        );


      state.player.runSpeed =
        Number(
          read(
            /player\.run\.speed\s*=\s*(.+?);/,
            state.player.runSpeed
          )
        );


      state.player.jumpPower =
        Number(
          read(
            /player\.jump\.power\s*=\s*(.+?);/,
            state.player.jumpPower
          )
        );


      state.player.maxHealth =
        Number(
          read(
            /player\.health\.max\s*=\s*(.+?);/,
            state.player.maxHealth
          )
        );


      state.player.health =
        Number(
          read(
            /player\.health\s*=\s*(.+?);/,
            state.player.health
          )
        );


      if (
        state.player.health >
        state.player.maxHealth
      ) {

        state.player.health =
          state.player.maxHealth;

      }


      state.hud.enabled =
        /ui\.create\(\s*"HUD"\s*\)/
          .test(
            source
          ) ||
        /ui\.createText/.test(
          source
        );
    },


    /* ======================================================
       WEAPON
       ====================================================== */

    extractWeapon(
      source,
      state
    ) {

      if (
        !/weapon\.create\(\s*"Rifle"\s*\)/
          .test(
            source
          )
      ) {

        return;

      }


      const properties = [

        [
          "damage",
          /Rifle\.damage\s*=\s*(.+?);/
        ],

        [
          "fireRate",
          /Rifle\.fireRate\s*=\s*(.+?);/
        ],

        [
          "magazineSize",
          /Rifle\.magazineSize\s*=\s*(.+?);/
        ],

        [
          "reloadTime",
          /Rifle\.reloadTime\s*=\s*(.+?);/
        ],

        [
          "range",
          /Rifle\.range\s*=\s*(.+?);/
        ],

        [
          "recoil",
          /Rifle\.recoil\s*=\s*(.+?);/
        ],

        [
          "spread",
          /Rifle\.spread\s*=\s*(.+?);/
        ]

      ];


      properties.forEach(
        ([name, regex]) => {

          const match =
            source.match(
              regex
            );


          if (!match)
            return;


          const number =
            Number(
              this.value(
                match[1]
              )
            );


          if (
            Number.isFinite(
              number
            )
          ) {

            state.rifle[name] =
              number;

          }

        }
      );


      state.player.maxAmmo =
        state.rifle.magazineSize;

      state.player.ammo =
        state.rifle.magazineSize;
    },


    /* ======================================================
       LIGHTING
       ====================================================== */

    extractLighting(
      source,
      state
    ) {

      state.lighting.directional =
        /lighting\.directional\.enabled\s*=\s*true/
          .test(
            source
          );


      state.lighting.fog =
        /lighting\.fog\.enabled\s*=\s*true/
          .test(
            source
          );


      const intensity =
        source.match(
          /lighting\.directional\.intensity\s*=\s*(.+?);/
        );


      if (intensity) {

        state.lighting.intensity =
          Number(
            this.value(
              intensity[1]
            )
          );

      }


      const fogStart =
        source.match(
          /lighting\.fog\.start\s*=\s*(.+?);/
        );


      if (fogStart) {

        state.lighting.fogStart =
          Number(
            this.value(
              fogStart[1]
            )
          );

      }


      const fogEnd =
        source.match(
          /lighting\.fog\.end\s*=\s*(.+?);/
        );


      if (fogEnd) {

        state.lighting.fogEnd =
          Number(
            this.value(
              fogEnd[1]
            )
          );

      }
    },


    /* ======================================================
       HUD
       ====================================================== */

    extractHUD(
      source,
      state
    ) {

      state.hud.enabled =
        /ui\.create\(\s*"HUD"\s*\)/
          .test(
            source
          );

      const crosshair =
        source.match(
          /ui\.Crosshair\.text\s*=\s*(.+?);/
        );


      if (
        crosshair
      ) {

        state.hud.crosshair =
          this.value(
            crosshair[1]
          );

      }
    },


    /* ======================================================
       MAP
       ====================================================== */

    extractMap(
      source,
      state
    ) {

      state.map.create =
        /\bcreateMap\s*\(\s*\)\s*;/
          .test(
            source
          ) ||
        /object\.create\(\s*"ArenaFloor"\s*\)/
          .test(
            source
          );
    },


    /* ======================================================
       WAVES
       ====================================================== */

    extractWaves(
      source,
      state
    ) {

      state.wave.enabled =
        /wave\.number\s*=/.test(
          source
        ) &&
        /spawnEnemy/.test(
          source
        );
    },


    /* ======================================================
       APPLY
       ====================================================== */

    apply(
      game,
      state
    ) {

      game.scriptState =
        state;


      if (
        typeof game.applyRiseScriptState ===
        "function"
      ) {

        game.applyRiseScriptState(
          state
        );

      }


      if (
        state.map.create &&
        typeof game.buildRiseStrikeArena ===
        "function"
      ) {

        game.buildRiseStrikeArena();

      }


      if (
        state.hud.enabled &&
        typeof game.showHUD ===
        "function"
      ) {

        game.showHUD();

      }


      if (
        typeof game.setRiseLighting ===
        "function"
      ) {

        game.setRiseLighting(
          state
        );

      }
    },


    /* ======================================================
       VALUE
       ====================================================== */

    value(
      text
    ) {

      let value =
        String(text)
          .trim()
          .replace(
            /;$/,
            ""
          );


      if (
        (
          value.startsWith(
            '"'
          ) &&
          value.endsWith(
            '"'
          )
        ) ||
        (
          value.startsWith(
            "'"
          ) &&
          value.endsWith(
            "'"
          )
        )
      ) {

        return value.substring(
          1,
          value.length - 1
        );

      }


      if (
        value ===
        "true"
      ) {

        return true;
      }


      if (
        value ===
        "false"
      ) {

        return false;
      }


      if (
        /^-?\d+(\.\d+)?$/
          .test(
            value
          )
      ) {

        return Number(
          value
        );

      }


      return value;
    },


    /* ======================================================
       COMMAND
       ====================================================== */

    command(
      command,
      game
    ) {

      const parts =
        command.split(
          "."
        );


      const action =
        parts.shift();


      const target =
        parts.join(
          "."
        );


      if (
        action === "Ban"
      ) {

        this.emit(
          `Ban ${target}`
        );

        return;
      }


      if (
        action === "Kick"
      ) {

        this.emit(
          `Kick ${target}`
        );

        return;
      }


      if (
        action === "Mute"
      ) {

        this.emit(
          `Mute ${target}`
        );

        return;
      }
    },


    /* ======================================================
       OUTPUT
       ====================================================== */

    emit(
      message
    ) {

      console.log(
        "RiseCode:",
        message
      );


      window.dispatchEvent(
        new CustomEvent(
          "riseup:runtime-output",
          {
            detail: {
              message
            }
          }
        )
      );
    }

  };


  /* ========================================================
     3D ENGINE
     ======================================================== */

  class RiseUp3DGame {


    constructor() {

      this.canvas =
        null;

      this.scene =
        null;

      this.camera =
        null;

      this.renderer =
        null;

      this.running =
        false;

      this.pointerLocked =
        false;

      this.keys =
        {};

      this.velocity =
        new THREE.Vector3();

      this.raycaster =
        new THREE.Raycaster();

      this.clock =
        new THREE.Clock();

      this.enemies =
        [];

      this.worldObjects =
        [];

      this.spawnPoints =
        [];

      this.mapGroup =
        null;

      this.weapon =
        null;

      this.muzzle =
        null;

      this.health =
        100;

      this.armor =
        25;

      this.ammo =
        30;

      this.reserveAmmo =
        120;

      this.score =
        0;

      this.kills =
        0;

      this.wave =
        0;

      this.reloading =
        false;

      this.lastShot =
        0;

      this.gravity =
        25;

      this.walkSpeed =
        7;

      this.runSpeed =
        11;

      this.jumpPower =
        9;

      this.yaw =
        0;

      this.pitch =
        0;

      this.onOutput =
        console.log;

      this.onToast =
        console.log;
    }


    /* ======================================================
       START
       ====================================================== */

    start(
      options
    ) {

      this.canvas =
        options.canvas;

      this.onOutput =
        options.onOutput ||
        console.log;

      this.onToast =
        options.onToast ||
        console.log;


      this.createRenderer();

      this.createScene();

      this.createCamera();

      this.createLights();

      this.createPlayer();

      this.createWeapon();

      this.createInput();

      this.running =
        true;


      this.animate();
    }


    stop() {

      this.running =
        false;


      this.removeInput();


      if (
        this.renderer
      ) {

        this.renderer.dispose();

      }


      this.enemies.forEach(
        enemy => {

          if (
            enemy.mesh &&
            enemy.mesh.parent
          ) {

            enemy.mesh.parent
              .remove(
                enemy.mesh
              );
          }

        }
      );


      this.enemies =
        [];


      if (
        this.renderer
      ) {

        this.renderer.clear();

      }
    }


    /* ======================================================
       RENDERER
       ====================================================== */

    createRenderer() {

      this.renderer =
        new THREE.WebGLRenderer({

          canvas:
            this.canvas,

          antialias:
            true,

          powerPreference:
            "high-performance"

        });


      this.renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio ||
            1,
          2
        )
      );


      this.renderer.setSize(
        this.canvas.clientWidth ||
          800,

        this.canvas.clientHeight ||
          500,

        false
      );


      this.renderer.shadowMap.enabled =
        true;


      this.renderer.outputColorSpace =
        THREE.SRGBColorSpace;
    }


    /* ======================================================
       SCENE
       ====================================================== */

    createScene() {

      this.scene =
        new THREE.Scene();


      this.scene.background =
        new THREE.Color(
          0x86b8df
        );


      this.scene.fog =
        new THREE.Fog(
          0x86b8df,
          90,
          240
        );
    }


    /* ======================================================
       CAMERA
       ====================================================== */

    createCamera() {

      this.camera =
        new THREE.PerspectiveCamera(
          90,
          1,
          0.1,
          1000
        );


      this.camera.position.set(
        0,
        3,
        20
      );


      this.camera.rotation.order =
        "YXZ";
    }


    /* ======================================================
       LIGHTS
       ====================================================== */

    createLights() {

      this.ambient =
        new THREE.HemisphereLight(
          0xd7edff,
          0x283320,
          1.45
        );


      this.scene.add(
        this.ambient
      );


      this.sun =
        new THREE.DirectionalLight(
          0xffffff,
          1.8
        );


      this.sun.position.set(
        60,
        100,
        50
      );


      this.sun.castShadow =
        true;


      this.sun.shadow.mapSize.set(
        2048,
        2048
      );


      this.scene.add(
        this.sun
      );
    }


    /* ======================================================
       PLAYER
       ====================================================== */

    createPlayer() {

      this.player = {

        exists:
          true,

        isGrounded:
          true,

        velocity:
          this.velocity,

        health:
          this.health,

        armor:
          this.armor,

        ammo:
          this.ammo,

        maxAmmo:
          30,

        reserveAmmo:
          this.reserveAmmo,

        score:
          this.score,

        kills:
          this.kills,

        weapon:
          "Rifle"

      };
    }


    /* ======================================================
       WEAPON
       ====================================================== */

    createWeapon() {

      const group =
        new THREE.Group();


      group.position.set(
        0.35,
        -0.28,
        -0.75
      );


      const body =
        new THREE.Mesh(

          new THREE.BoxGeometry(
            0.18,
            0.18,
            0.95
          ),

          new THREE.MeshStandardMaterial({
            color:
              0x20272d,

            metalness:
              0.8,

            roughness:
              0.3
          })

        );


      body.rotation.x =
        Math.PI / 2;


      group.add(
        body
      );


      const barrel =
        new THREE.Mesh(

          new THREE.CylinderGeometry(
            0.035,
            0.035,
            0.65,
            10
          ),

          new THREE.MeshStandardMaterial({
            color:
              0x0c0f12,

            metalness:
              0.9
          })

        );


      barrel.rotation.x =
        Math.PI / 2;


      barrel.position.z =
        -0.7;


      group.add(
        barrel
      );


      const light =
        new THREE.PointLight(
          0xffbd70,
          0,
          4
        );


      light.position.z =
        -1;


      group.add(
        light
      );


      this.muzzle =
        light;


      this.weapon =
        group;


      this.camera.add(
        group
      );


      this.scene.add(
        this.camera
      );
    }


    /* ======================================================
       INPUT
       ====================================================== */

    createInput() {

      this.mouseMove =
        event => {

          if (
            !this.pointerLocked ||
            !this.running
          )
            return;


          const sensitivity =
            this.scriptState
              ?.camera
              ?.sensitivity ||
            0.8;


          this.yaw -=
            event.movementX *
            .002 *
            sensitivity;


          this.pitch -=
            event.movementY *
            .002 *
            sensitivity;


          const limit =
            Math.PI *
            .48;


          this.pitch =
            Math.max(
              -limit,
              Math.min(
                limit,
                this.pitch
              )
            );


          this.camera.rotation.y =
            this.yaw;


          this.camera.rotation.x =
            this.pitch;
        };


      this.mouseDown =
        event => {

          if (
            event.button !==
            0
          )
            return;


          if (
            !this.pointerLocked
          )
            return;


          this.fire();

        };


      this.keyDown =
        event => {

          this.keys[
            event.code
          ] =
            true;


          if (
            event.code ===
            "KeyR"
          ) {

            this.reload();

          }


          if (
            event.code ===
            "Space"
          ) {

            this.jump();

          }

        };


      this.keyUp =
        event => {

          this.keys[
            event.code
          ] =
            false;

        };


      this.clickCanvas =
        () => {

          if (
            this.running
          ) {

            this.canvas
              .requestPointerLock();

          }

        };


      this.pointerLockChange =
        () => {

          this.pointerLocked =
            document
              .pointerLockElement ===
            this.canvas;


          const msg =
            $("fpsMessage");


          if (msg) {

            msg.textContent =
              this.pointerLocked
                ? "WASD • SHIFT • SPACE • R • CLICK"
                : "CLICK TO ENTER";

          }

        };


      window.addEventListener(
        "mousemove",
        this.mouseMove
      );

      window.addEventListener(
        "mousedown",
        this.mouseDown
      );

      window.addEventListener(
        "keydown",
        this.keyDown
      );

      window.addEventListener(
        "keyup",
        this.keyUp
      );


      this.canvas.addEventListener(
        "click",
        this.clickCanvas
      );


      document.addEventListener(
        "pointerlockchange",
        this.pointerLockChange
      );
    }


    removeInput() {

      if (
        !this.mouseMove
      )
        return;


      window.removeEventListener(
        "mousemove",
        this.mouseMove
      );


      window.removeEventListener(
        "mousedown",
        this.mouseDown
      );


      window.removeEventListener(
        "keydown",
        this.keyDown
      );


      window.removeEventListener(
        "keyup",
        this.keyUp
      );


      document.removeEventListener(
        "pointerlockchange",
        this.pointerLockChange
      );


      if (
        this.canvas
      ) {

        this.canvas.removeEventListener(
          "click",
          this.clickCanvas
        );

      }
    }


    /* ======================================================
       RISESCRIPT STATE
       ====================================================== */

    applyRiseScriptState(
      state
    ) {

      this.scriptState =
        state;


      this.gravity =
        Number(
          state.world.gravity
        ) || 25;


      this.walkSpeed =
        Number(
          state.player.walkSpeed
        ) || 7;


      this.runSpeed =
        Number(
          state.player.runSpeed
        ) || 11;


      this.jumpPower =
        Number(
          state.player.jumpPower
        ) || 9;


      this.health =
        Number(
          state.player.health
        ) ||
        100;


      this.ammo =
        Number(
          state.player.ammo
        ) ||
        30;


      this.reserveAmmo =
        Number(
          state.player.reserveAmmo
        ) ||
        120;


      if (
        this.camera
      ) {

        this.camera.fov =
          Number(
            state.camera.fov
          ) || 90;


        this.camera.updateProjectionMatrix();

      }


      if (
        state.camera.mode ===
        "FirstPerson"
      ) {

        this.camera.near =
          .1;

        this.camera.far =
          1000;

      }


      this.updateHUD();
    }


    /* ======================================================
       MAP
       ====================================================== */

    buildRiseStrikeArena() {

      if (
        !this.scene
      )
        return;


      if (
        this.mapGroup
      ) {

        this.scene.remove(
          this.mapGroup
        );

      }


      this.mapGroup =
        new THREE.Group();


      this.worldObjects =
        [];


      this.addBox(
        "ArenaFloor",
        0,
        -1,
        0,
        180,
        2,
        180,
        0x5d666d
      );


      this.addBox(
        "NorthWall",
        0,
        12,
        -90,
        180,
        25,
        3,
        0x364048
      );


      this.addBox(
        "SouthWall",
        0,
        12,
        90,
        180,
        25,
        3,
        0x364048
      );


      this.addBox(
        "EastWall",
        90,
        12,
        0,
        3,
        25,
        180,
        0x364048
      );


      this.addBox(
        "WestWall",
        -90,
        12,
        0,
        3,
        25,
        180,
        0x364048
      );


      this.addBox(
        "CentralBuilding",
        0,
        8,
        0,
        35,
        18,
        35,
        0x505c64
      );


      const covers = [

        [-35, 4, -25],
        [35, 4, -25],
        [-35, 4, 25],
        [35, 4, 25],
        [-55, 3, 0],
        [55, 3, 0]

      ];


      covers.forEach(
        p =>
          this.addBox(
            "Cover",
            p[0],
            p[1],
            p[2],
            12,
            8,
            5,
            0x56636b
          )
      );


      const platforms = [

        [-55, 5, -55],
        [55, 5, -55],
        [-55, 5, 55],
        [55, 5, 55]

      ];


      platforms.forEach(
        p =>
          this.addBox(
            "Platform",
            p[0],
            p[1],
            p[2],
            20,
            2,
            20,
            0x707b82
          )
      );


      this.spawnPoints = [

        new THREE.Vector3(
          -70,
          3,
          -70
        ),

        new THREE.Vector3(
          70,
          3,
          -70
        ),

        new THREE.Vector3(
          -70,
          3,
          70
        ),

        new THREE.Vector3(
          70,
          3,
          70
        )

      ];


      this.camera.position.copy(
        this.spawnPoints[0]
      );


      this.camera.position.y =
        3;


      this.yaw =
        Math.PI *
        .25;


      this.pitch =
        0;


      this.camera.rotation.y =
        this.yaw;


      this.camera.rotation.x =
        this.pitch;


      this.say(
        "3D arena created."
      );
    }


    addBox(
      name,
      x,
      y,
      z,
      width,
      height,
      depth,
      color
    ) {

      const geometry =
        new THREE.BoxGeometry(
          width,
          height,
          depth
        );


      const material =
        new THREE.MeshStandardMaterial({
          color,
          roughness: .7,
          metalness: .18
        });


      const mesh =
        new THREE.Mesh(
          geometry,
          material
        );


      mesh.position.set(
        x,
        y,
        z
      );


      mesh.castShadow =
        true;


      mesh.receiveShadow =
        true;


      mesh.userData.name =
        name;


      mesh.userData.world =
        true;


      this.mapGroup.add(
        mesh
      );


      this.worldObjects.push(
        mesh
      );


      this.scene.add(
        this.mapGroup
      );


      return mesh;
    }


    /* ======================================================
       LIGHTING
       ====================================================== */

    setRiseLighting(
      state
    ) {

      if (
        this.sun
      ) {

        this.sun.intensity =
          state.lighting
            ?.intensity ||
          1.2;

      }


      if (
        this.scene &&
        this.scene.fog
      ) {

        if (
          state.lighting
            ?.fog
        ) {

          this.scene.fog.near =
            state.lighting.fogStart ||
            80;

          this.scene.fog.far =
            state.lighting.fogEnd ||
            220;

        }

      }
    }


    /* ======================================================
       SHOOT
       ====================================================== */

    fire() {

      if (
        this.reloading
      )
        return;


      if (
        this.ammo <= 0
      ) {

        this.sayToast(
          "EMPTY MAGAZINE — PRESS R"
        );

        return;
      }


      const now =
        performance.now();


      const fireRate =
        Number(
          this.scriptState
            ?.rifle
            ?.fireRate
        ) ||
        .09;


      if (
        now -
        this.lastShot <
        fireRate *
        1000
      ) {

        return;
      }


      this.lastShot =
        now;


      this.ammo--;


      this.recoil();


      if (
        this.muzzle
      ) {

        this.muzzle.intensity =
          7;


        setTimeout(
          () => {

            if (
              this.muzzle
            ) {

              this.muzzle.intensity =
                0;

            }

          },
          45
        );
      }


      this.raycaster.setFromCamera(
        new THREE.Vector2(
          0,
          0
        ),
        this.camera
      );


      const targets =
        this.enemies
          .filter(
            enemy =>
              enemy.exists
          )
          .map(
            enemy =>
              enemy.mesh
          );


      const hits =
        this.raycaster
          .intersectObjects(
            targets,
            false
          );


      if (
        hits.length
      ) {

        const enemy =
          hits[0]
            .object
            .userData
            .enemy;


        if (
          enemy
        ) {

          this.damageEnemy(
            enemy,
            Number(
              this.scriptState
                ?.rifle
                ?.damage
            ) ||
            25
          );

        }


      } else {

        const worldHits =
          this.raycaster
            .intersectObjects(
              this.worldObjects,
              false
            );


        if (
          worldHits.length
        ) {

          this.createImpact(
            worldHits[0].point
          );

        }

      }


      this.updateHUD();
    }


    recoil() {

      this.camera.rotation.x -=
        .012;


      if (
        this.weapon
      ) {

        this.weapon.position.z =
          -.69;


        setTimeout(
          () => {

            if (
              this.weapon
            ) {

              this.weapon.position.z =
                -.75;

            }

          },
          70
        );
      }
    }


    createImpact(
      position
    ) {

      const geometry =
        new THREE.SphereGeometry(
          .08,
          6,
          6
        );


      const material =
        new THREE.MeshBasicMaterial({
          color:
            0xffc66f
        });


      const mesh =
        new THREE.Mesh(
          geometry,
          material
        );


      mesh.position.copy(
        position
      );


      this.scene.add(
        mesh
      );


      setTimeout(
        () => {

          this.scene.remove(
            mesh
          );

        },
        150
      );
    }


    /* ======================================================
       RELOAD
       ====================================================== */

    reload() {

      if (
        this.reloading
      )
        return;


      const maxAmmo =
        Number(
          this.scriptState
            ?.rifle
            ?.magazineSize
        ) ||
        30;


      if (
        this.ammo >=
        maxAmmo
      )
        return;


      if (
        this.reserveAmmo <=
        0
      )
        return;


      this.reloading =
        true;


      this.sayToast(
        "RELOADING..."
      );


      const reloadTime =
        (
          Number(
            this.scriptState
              ?.rifle
              ?.reloadTime
          ) ||
          1.8
        ) *
        1000;


      setTimeout(
        () => {

          const needed =
            maxAmmo -
            this.ammo;


          const amount =
            Math.min(
              needed,
              this.reserveAmmo
            );


          this.ammo +=
            amount;


          this.reserveAmmo -=
            amount;


          this.reloading =
            false;


          this.updateHUD();

        },
        reloadTime
      );
    }


    /* ======================================================
       JUMP
       ====================================================== */

    jump() {

      if (
        !this.player
          .isGrounded
      )
        return;


      this.velocity.y =
        this.jumpPower;


      this.player
        .isGrounded =
        false;
    }


    /* ======================================================
       ENEMIES
       ====================================================== */

    spawnWaveEnemy(
      type,
      position
    ) {

      const data = {

        Soldier: {
          health: 100,
          speed: 2.5,
          scale: 1
        },

        Heavy: {
          health: 200,
          speed: 1.5,
          scale: 1.3
        },

        Runner: {
          health: 70,
          speed: 4,
          scale: .85
        }

      };


      const config =
        data[type] ||
        data.Soldier;


      const geometry =
        new THREE.BoxGeometry(
          1.25,
          2.3,
          1
        );


      const material =
        new THREE.MeshStandardMaterial({

          color:
            type ===
            "Heavy"
              ? 0x66707a
              : type ===
                "Runner"
                ? 0xa94e4e
                : 0x873e45,

          roughness: .65

        });


      const mesh =
        new THREE.Mesh(
          geometry,
          material
        );


      mesh.scale.setScalar(
        config.scale
      );


      mesh.position.copy(
        position
      );


      mesh.castShadow =
        true;


      const enemy = {

        type,

        exists:
          true,

        health:
          config.health,

        speed:
          config.speed,

        attackCooldown:
          0,

        mesh

      };


      mesh.userData.enemy =
        enemy;


      this.scene.add(
        mesh
      );


      this.enemies.push(
        enemy
      );


      return enemy;
    }


    startWave() {

      this.wave++;


      const count =
        5 +
        this.wave *
        2;


      this.enemies = [];


      for (
        let i = 0;
        i < count;
        i++
      ) {

        const spawn =
          this.spawnPoints[
            Math.floor(
              Math.random() *
              this.spawnPoints.length
            )
          ];


        const roll =
          Math.random() *
          100;


        let type =
          "Soldier";


        if (
          this.wave >= 5 &&
          roll < 15
        ) {

          type =
            "Heavy";

        } else if (
          this.wave >= 3 &&
          roll < 35
        ) {

          type =
            "Runner";

        }


        this.spawnWaveEnemy(
          type,
          spawn.clone()
        );
      }


      this.say(
        `WAVE ${this.wave} — ${count} ENEMIES`
      );


      this.updateHUD();
    }


    updateEnemies(
      delta
    ) {

      if (
        !this.camera
      )
        return;


      for (
        const enemy of
          this.enemies
      ) {

        if (
          !enemy.exists
        )
          continue;


        const direction =
          new THREE.Vector3()
            .subVectors(
              this.camera.position,
              enemy.mesh.position
            );


        direction.y =
          0;


        const distance =
          direction.length();


        if (
          distance > 3
        ) {

          direction.normalize();


          enemy.mesh
            .position
            .addScaledVector(
              direction,
              enemy.speed *
              delta
            );


          enemy.mesh.lookAt(
            this.camera.position.x,
            enemy.mesh.position.y,
            this.camera.position.z
          );

        } else {

          enemy.attackCooldown -=
            delta;


          if (
            enemy.attackCooldown <=
            0
          ) {

            enemy.attackCooldown =
              1;


            this.damagePlayer(
              10
            );

          }
        }

      }


      const remaining =
        this.enemies.filter(
          enemy =>
            enemy.exists
        ).length;


      if (
        remaining === 0
      ) {

        this.startWave();

      }
    }


    damageEnemy(
      enemy,
      damage
    ) {

      if (
        !enemy.exists
      )
        return;


      enemy.health -=
        damage;


      if (
        enemy.health <=
        0
      ) {

        this.killEnemy(
          enemy
        );
      }
    }


    killEnemy(
      enemy
    ) {

      if (
        !enemy.exists
      )
        return;


      enemy.exists =
        false;


      enemy.mesh.material =
        enemy.mesh.material;


      this.scene.remove(
        enemy.mesh
      );


      this.kills++;
      this.score += 100;


      this.updateHUD();


      setTimeout(
        () => {

          if (
            this.running &&
            this.enemies.every(
              e =>
                !e.exists
            )
          ) {

            this.startWave();

          }

        },
        600
      );
    }


    damagePlayer(
      damage
    ) {

      if (
        this.armor > 0
      ) {

        const absorbed =
          Math.min(
            this.armor,
            damage *
            .5
          );


        this.armor -=
          absorbed;


        damage -=
          absorbed;
      }


      this.health -=
        damage;


      if (
        this.health <=
        0
      ) {

        this.health =
          0;


        this.sayToast(
          "YOU DIED"
        );


        setTimeout(
          () => {

            this.respawn();

          },
          1200
        );
      }


      this.updateHUD();
    }


    respawn() {

      const spawn =
        this.spawnPoints[
          Math.floor(
            Math.random() *
            this.spawnPoints.length
          )
        ];


      if (
        spawn
      ) {

        this.camera.position.copy(
          spawn
        );

        this.camera.position.y =
          3;

      }


      this.health =
        this.scriptState
          ?.player
          ?.maxHealth ||
        100;


      this.armor =
        25;


      this.ammo =
        this.scriptState
          ?.player
          ?.maxAmmo ||
        30;


      this.reserveAmmo =
        120;


      this.updateHUD();
    }


    /* ======================================================
       PLAYER MOVEMENT
       ====================================================== */

    updatePlayer(
      delta
    ) {

      if (
        !this.pointerLocked
      )
        return;


      const sprint =
        this.keys["ShiftLeft"] ||
        this.keys["ShiftRight"];


      const speed =
        sprint
          ? this.runSpeed
          : this.walkSpeed;


      let x =
        0;

      let z =
        0;


      if (
        this.keys[
          "KeyA"
        ]
      ) {

        x -= 1;

      }


      if (
        this.keys[
          "KeyD"
        ]
      ) {

        x += 1;

      }


      if (
        this.keys[
          "KeyW"
        ]
      ) {

        z -= 1;

      }


      if (
        this.keys[
          "KeyS"
        ]
      ) {

        z += 1;

      }


      const movement =
        new THREE.Vector3(
          x,
          0,
          z
        );


      if (
        movement.lengthSq()
      ) {

        movement.normalize();


        const forward =
          new THREE.Vector3();


        this.camera.getWorldDirection(
          forward
        );


        forward.y =
          0;


        forward.normalize();


        const right =
          new THREE.Vector3()
            .crossVectors(
              forward,
              new THREE.Vector3(
                0,
                1,
                0
              )
            )
            .normalize();


        const result =
          new THREE.Vector3();


        result
          .addScaledVector(
            right,
            x
          );


        result
          .addScaledVector(
            forward,
            -z
          );


        result.normalize();


        this.camera.position
          .addScaledVector(
            result,
            speed *
            delta
          );
      }


      this.velocity.y -=
        this.gravity *
        delta;


      this.camera.position.y +=
        this.velocity.y *
        delta;


      if (
        this.camera.position.y <=
        3
      ) {

        this.camera.position.y =
          3;


        this.velocity.y =
          0;


        this.player
          .isGrounded =
          true;
      }
    }


    /* ======================================================
       HUD
       ====================================================== */

    showHUD() {

      $("fpsHud")
        .classList.remove(
          "hidden"
        );


      this.updateHUD();
    }


    updateHUD() {

      const hp =
        $("hudHealth");


      const armor =
        $("hudArmor");


      const ammo =
        $("hudAmmo");


      const score =
        $("hudScore");


      const wave =
        $("hudWave");


      if (hp) {

        hp.textContent =
          `HP: ${Math.round(
            this.health
          )}`;

      }


      if (armor) {

        armor.textContent =
          `ARMOR: ${Math.round(
            this.armor
          )}`;

      }


      if (ammo) {

        ammo.textContent =
          `${this.ammo} / ${this.reserveAmmo}`;

      }


      if (score) {

        score.textContent =
          `SCORE: ${this.score}`;

      }


      if (wave) {

        wave.textContent =
          `WAVE ${this.wave}`;

      }


      if (
        this.scriptState
          ?.hud
          ?.crosshair
      ) {

        $("fpsCrosshair")
          .textContent =
          this.scriptState
            .hud
            .crosshair;

      }
    }


    /* ======================================================
       ANIMATE
       ====================================================== */

    animate() {

      if (
        !this.running
      )
        return;


      requestAnimationFrame(
        () =>
          this.animate()
      );


      const delta =
        Math.min(
          this.clock.getDelta(),
          .05
        );


      this.updatePlayer(
        delta
      );


      this.updateEnemies(
        delta
      );


      this.updateHUD();


      const width =
        this.canvas
          .clientWidth ||
        800;


      const height =
        this.canvas
          .clientHeight ||
        500;


      if (
        this.camera.aspect !==
        width /
        height
      ) {

        this.camera.aspect =
          width /
          height;


        this.camera
          .updateProjectionMatrix();


        this.renderer.setSize(
          width,
          height,
          false
        );
      }


      this.renderer.render(
        this.scene,
        this.camera
      );
    }


    /* ======================================================
       OUTPUT
       ====================================================== */

    say(
      message
    ) {

      try {

        this.onOutput(
          message
        );

      } catch {}

    }


    sayToast(
      message
    ) {

      try {

        this.onToast(
          message
        );

      } catch {}

    }

  }


  window.RiseCodeRuntime =
    Runtime;


  window.RiseUp3DGame =
    new RiseUp3DGame();


})();