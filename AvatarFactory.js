import * as THREE from "three";

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
