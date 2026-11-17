import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * AEROVISION — Authentic Airport Airfield & Commercial Airliner Hero Canvas
 * Visual Identity:
 * - Sky: Crisp White and Blue daylight sky with drifting fluffy white clouds and atmospheric horizon.
 * - Aircraft: True-to-life Commercial Passenger Airliner (Boeing 787 / A350) in luxury obsidian black livery.
 * - Airport Ground: Deep black asphalt runway with white markings & edge LEDs, flanked by realistic pine trees.
 * - Airport Infrastructure: Airport Checking Monitor Room (ATC Tower) with glazed observation cab, terminal building & hangars.
 */
export default function AirportHeroCanvas() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();

    // Generate White & Blue Atmospheric Sky Gradient Texture
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 32;
    skyCanvas.height = 512;
    const ctx = skyCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#1d4ed8'); // Deep zenith royal blue
    grad.addColorStop(0.35, '#38bdf8'); // Radiant cerulean sky blue
    grad.addColorStop(0.72, '#bae6fd'); // Soft light sky blue
    grad.addColorStop(0.92, '#f0f9ff'); // Atmospheric white-blue haze
    grad.addColorStop(1.0, '#ffffff'); // Pure white horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 512);

    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    skyTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = skyTexture;

    // Soft white-blue aerial perspective fog
    scene.fog = new THREE.FogExp2(0xe0f2fe, 0.009);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 1200);
    camera.position.set(0, 3.6, 18);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Crisp Daylight Lighting for White & Blue Sky
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.8);
    sunLight.position.set(35, 55, 30);
    scene.add(sunLight);

    const skyBounce = new THREE.DirectionalLight(0x7dd3fc, 1.4);
    skyBounce.position.set(-30, 20, -15);
    scene.add(skyBounce);

    // 3. Materials
    const obsidianGloss = new THREE.MeshStandardMaterial({
      color: 0x09090c,
      metalness: 0.92,
      roughness: 0.16,
      envMapIntensity: 1.8,
    });

    const matteBlack = new THREE.MeshStandardMaterial({
      color: 0x050507,
      metalness: 0.95,
      roughness: 0.42,
    });

    const titaniumSilver = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.96,
      roughness: 0.18,
    });

    const pureWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const greenBeaconMat = new THREE.MeshBasicMaterial({ color: 0x16a34a });
    const redBeaconMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const cabinWindowMat = new THREE.MeshBasicMaterial({ color: 0x1e293b }); // Tinted daytime airliner passenger windows
    const towerWindowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // Glazed blue sky reflection on ATC tower
    const runwayEdgeLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const taxiwayBlueMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });

    // 4. White Fluffy Atmospheric Clouds in the Blue Sky
    const cloudsGroup = new THREE.Group();
    scene.add(cloudsGroup);

    const cloudPuffMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.05,
      transparent: true,
      opacity: 0.88,
    });

    const createCloud = (x, y, z, scale = 1) => {
      const cloud = new THREE.Group();
      cloud.position.set(x, y, z);
      cloud.scale.set(scale, scale * 0.55, scale);

      const puffGeo = new THREE.SphereGeometry(1.6, 12, 12);
      const puffOffsets = [
        [0, 0, 0, 1.0],
        [-1.6, -0.2, 0.2, 0.85],
        [1.6, -0.15, -0.1, 0.9],
        [-0.8, 0.4, -0.2, 0.78],
        [0.9, 0.45, 0.1, 0.8],
        [2.6, -0.3, 0.1, 0.65],
        [-2.7, -0.35, -0.1, 0.6],
      ];

      puffOffsets.forEach(([px, py, pz, ps]) => {
        const puff = new THREE.Mesh(puffGeo, cloudPuffMat);
        puff.position.set(px, py, pz);
        puff.scale.setScalar(ps);
        cloud.add(puff);
      });

      return cloud;
    };

    // Distributed White Clouds across the Blue Sky
    const clouds = [
      createCloud(-45, 24, -80, 4.2),
      createCloud(42, 28, -95, 4.6),
      createCloud(-20, 32, -120, 5.0),
      createCloud(25, 22, -60, 3.8),
      createCloud(-60, 18, -40, 3.6),
      createCloud(58, 20, -45, 3.5),
      createCloud(0, 36, -140, 6.2),
    ];
    clouds.forEach((c) => cloudsGroup.add(c));

    // 5. Authentic Commercial Passenger Airliner (Boeing 787 / A350 Style) in Black
    const airplaneGroup = new THREE.Group();
    scene.add(airplaneGroup);
    airplaneGroup.position.set(0, 0.7, 0);

    // Fuselage
    const fuselageLength = 13.8;
    const fuselageRadius = 0.86;
    const fuselageBodyGeo = new THREE.CylinderGeometry(fuselageRadius, fuselageRadius, fuselageLength - 4.5, 32);
    fuselageBodyGeo.rotateX(Math.PI / 2);
    const fuselageBody = new THREE.Mesh(fuselageBodyGeo, obsidianGloss);
    fuselageBody.position.set(0, 0, 0.6);
    airplaneGroup.add(fuselageBody);

    // Streamlined Airliner Nose Cone
    const noseGeo = new THREE.ConeGeometry(fuselageRadius, 3.2, 32);
    noseGeo.rotateX(-Math.PI / 2);
    const nose = new THREE.Mesh(noseGeo, obsidianGloss);
    nose.position.set(0, -0.06, 5.25 + 0.6);
    airplaneGroup.add(nose);

    // Cockpit Windshield (6-Panel Wraparound Cockpit Glass)
    const windshieldGeo = new THREE.BoxGeometry(0.88, 0.38, 1.4);
    const windshieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7, // Reflecting white-blue sky
      metalness: 0.6,
      roughness: 0.1,
      transmission: 0.3,
      transparent: true,
      opacity: 0.92,
      reflectivity: 0.98,
    });
    const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
    windshield.position.set(0, 0.46, 5.4);
    windshield.rotation.x = -Math.PI / 8;
    airplaneGroup.add(windshield);

    // Tail Cone & APU Exhaust
    const tailConeGeo = new THREE.ConeGeometry(fuselageRadius, 3.6, 32);
    tailConeGeo.rotateX(Math.PI / 2);
    const tailCone = new THREE.Mesh(tailConeGeo, obsidianGloss);
    tailCone.position.set(0, 0.1, -4.9);
    airplaneGroup.add(tailCone);

    const apuExhaustGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.4, 16);
    apuExhaustGeo.rotateX(Math.PI / 2);
    const apu = new THREE.Mesh(apuExhaustGeo, titaniumSilver);
    apu.position.set(0, 0.15, -6.8);
    airplaneGroup.add(apu);

    // Passenger Cabin Windows
    const windowStripGeo = new THREE.BoxGeometry(0.08, 0.11, 0.22);
    const leftWindows = new THREE.Group();
    const rightWindows = new THREE.Group();
    const windowCount = 22;

    for (let i = 0; i < windowCount; i++) {
      const zPos = -3.2 + i * 0.38;
      const winLeft = new THREE.Mesh(windowStripGeo, cabinWindowMat);
      winLeft.position.set(-fuselageRadius - 0.02, 0.18, zPos);
      leftWindows.add(winLeft);

      const winRight = new THREE.Mesh(windowStripGeo, cabinWindowMat);
      winRight.position.set(fuselageRadius + 0.02, 0.18, zPos);
      rightWindows.add(winRight);
    }
    airplaneGroup.add(leftWindows);
    airplaneGroup.add(rightWindows);

    // Swept Commercial Wings with Curved Winglets
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(9.4, -4.2);
    wingShape.lineTo(9.2, -5.1);
    wingShape.lineTo(0, -3.2);
    wingShape.closePath();

    const wingExtrudeSettings = {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    wingGeo.rotateX(Math.PI / 2);

    const rightWing = new THREE.Mesh(wingGeo, obsidianGloss);
    rightWing.position.set(0.4, -0.15, 1.6);
    rightWing.rotation.z = -0.04;
    airplaneGroup.add(rightWing);

    const leftWing = new THREE.Mesh(wingGeo, obsidianGloss);
    leftWing.scale.x = -1;
    leftWing.position.set(-0.4, -0.15, 1.6);
    leftWing.rotation.z = 0.04;
    airplaneGroup.add(leftWing);

    // Modern Curved Winglets
    const wingletGeo = new THREE.BoxGeometry(0.12, 1.1, 0.65);
    wingletGeo.rotateZ(0.2);

    const rightWinglet = new THREE.Mesh(wingletGeo, obsidianGloss);
    rightWinglet.position.set(9.45, 0.38, -2.8);
    airplaneGroup.add(rightWinglet);

    const leftWinglet = new THREE.Mesh(wingletGeo, obsidianGloss);
    leftWinglet.position.set(-9.45, 0.38, -2.8);
    leftWinglet.rotation.z = -0.2;
    airplaneGroup.add(leftWinglet);

    // Wingtip Lights
    const starNavLight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), greenBeaconMat);
    starNavLight.position.set(9.5, 0.85, -2.7);
    airplaneGroup.add(starNavLight);

    const starStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), pureWhiteMat);
    starStrobe.position.set(9.55, 0.2, -3.1);
    airplaneGroup.add(starStrobe);

    const portNavLight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), redBeaconMat);
    portNavLight.position.set(-9.5, 0.85, -2.7);
    airplaneGroup.add(portNavLight);

    const portStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), pureWhiteMat);
    portStrobe.position.set(-9.55, 0.2, -3.1);
    airplaneGroup.add(portStrobe);

    // Twin High-Bypass Turbofan Jet Engines on Pylons
    const buildEngine = (isLeft) => {
      const xOffset = isLeft ? -3.4 : 3.4;

      const pylonGeo = new THREE.BoxGeometry(0.18, 0.65, 2.2);
      pylonGeo.rotateX(-0.1);
      const pylon = new THREE.Mesh(pylonGeo, matteBlack);
      pylon.position.set(xOffset, -0.38, 0.4);
      airplaneGroup.add(pylon);

      const cowlGeo = new THREE.CylinderGeometry(0.68, 0.62, 3.2, 24);
      cowlGeo.rotateX(Math.PI / 2);
      const nacelle = new THREE.Mesh(cowlGeo, obsidianGloss);
      nacelle.position.set(xOffset, -0.88, 0.2);
      airplaneGroup.add(nacelle);

      const intakeLipGeo = new THREE.TorusGeometry(0.62, 0.08, 16, 32);
      const intakeLip = new THREE.Mesh(intakeLipGeo, titaniumSilver);
      intakeLip.position.set(xOffset, -0.88, 1.8);
      airplaneGroup.add(intakeLip);

      const fanSpinnerGeo = new THREE.ConeGeometry(0.24, 0.65, 16);
      fanSpinnerGeo.rotateX(-Math.PI / 2);
      const fanSpinner = new THREE.Mesh(fanSpinnerGeo, titaniumSilver);
      fanSpinner.position.set(xOffset, -0.88, 1.45);
      airplaneGroup.add(fanSpinner);

      const exhaustGeo = new THREE.TorusGeometry(0.48, 0.07, 16, 32);
      const exhaustRing = new THREE.Mesh(exhaustGeo, pureWhiteMat);
      exhaustRing.position.set(xOffset, -0.88, -1.45);
      airplaneGroup.add(exhaustRing);
    };

    buildEngine(true);
    buildEngine(false);

    // Tail Section: Swept Fin & Stabilizers
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0, 3.4);
    finShape.lineTo(1.5, 3.3);
    finShape.lineTo(3.2, 0);
    finShape.closePath();

    const finExtrudeSettings = { depth: 0.14, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 };
    const finGeo = new THREE.ExtrudeGeometry(finShape, finExtrudeSettings);
    finGeo.rotateY(-Math.PI / 2);
    const verticalFin = new THREE.Mesh(finGeo, obsidianGloss);
    verticalFin.position.set(0.07, 0.72, -3.2);
    airplaneGroup.add(verticalFin);

    const finStripeGeo = new THREE.BoxGeometry(0.16, 0.25, 2.4);
    const finStripe = new THREE.Mesh(finStripeGeo, pureWhiteMat);
    finStripe.position.set(0, 3.1, -2.4);
    airplaneGroup.add(finStripe);

    const tailBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), redBeaconMat);
    tailBeacon.position.set(0, 4.15, -1.9);
    airplaneGroup.add(tailBeacon);

    const stabShape = new THREE.Shape();
    stabShape.moveTo(0, 0);
    stabShape.lineTo(3.6, -1.8);
    stabShape.lineTo(3.4, -2.3);
    stabShape.lineTo(0, -1.4);
    stabShape.closePath();

    const stabGeo = new THREE.ExtrudeGeometry(stabShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
    stabGeo.rotateX(Math.PI / 2);

    const rightStab = new THREE.Mesh(stabGeo, obsidianGloss);
    rightStab.position.set(0.15, 0.35, -4.5);
    airplaneGroup.add(rightStab);

    const leftStab = new THREE.Mesh(stabGeo, obsidianGloss);
    leftStab.scale.x = -1;
    leftStab.position.set(-0.15, 0.35, -4.5);
    airplaneGroup.add(leftStab);

    // Jet Heat Distortion / Vapor Particles
    const particleCount = 100;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const isLeft = i % 2 === 0;
      particlePositions[i * 3] = (isLeft ? -3.4 : 3.4) + (Math.random() - 0.5) * 0.35;
      particlePositions[i * 3 + 1] = -0.88 + (Math.random() - 0.5) * 0.35;
      particlePositions[i * 3 + 2] = -1.6 - Math.random() * 5.0;
      particleSpeeds[i] = 0.22 + Math.random() * 0.35;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.16,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const exhaustParticles = new THREE.Points(particleGeo, particleMat);
    airplaneGroup.add(exhaustParticles);

    // 6. Complete Airport Environment (Runway, Buildings, ATC Monitor Room & Trees)
    const airfieldWorld = new THREE.Group();
    scene.add(airfieldWorld);
    airfieldWorld.position.y = -6.4;

    // Main Black Asphalt Runway
    const tarmacGeo = new THREE.PlaneGeometry(16, 240);
    tarmacGeo.rotateX(-Math.PI / 2);
    const tarmacMat = new THREE.MeshStandardMaterial({
      color: 0x09090c,
      roughness: 0.7,
      metalness: 0.15,
    });
    const tarmac = new THREE.Mesh(tarmacGeo, tarmacMat);
    airfieldWorld.add(tarmac);

    // Grass Airfield Ground
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x143423, // Lush airfield grass
      roughness: 0.9,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.02;
    airfieldWorld.add(ground);

    // Taxiways
    const taxiwayGeo = new THREE.PlaneGeometry(12, 38);
    taxiwayGeo.rotateX(-Math.PI / 2);
    const taxiwayMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.75 });

    const taxiwayLeft = new THREE.Mesh(taxiwayGeo, taxiwayMat);
    taxiwayLeft.position.set(-18, 0.01, -30);
    taxiwayLeft.rotation.y = 0.45;
    airfieldWorld.add(taxiwayLeft);

    const taxiwayRight = new THREE.Mesh(taxiwayGeo, taxiwayMat);
    taxiwayRight.position.set(18, 0.01, 20);
    taxiwayRight.rotation.y = -0.45;
    airfieldWorld.add(taxiwayRight);

    // Runway Edge Lines
    const edgeLineGeo = new THREE.PlaneGeometry(0.38, 240);
    edgeLineGeo.rotateX(-Math.PI / 2);
    const leftEdgeLine = new THREE.Mesh(edgeLineGeo, pureWhiteMat);
    leftEdgeLine.position.set(-6.8, 0.025, 0);
    airfieldWorld.add(leftEdgeLine);

    const rightEdgeLine = new THREE.Mesh(edgeLineGeo, pureWhiteMat);
    rightEdgeLine.position.set(6.8, 0.025, 0);
    airfieldWorld.add(rightEdgeLine);

    // Runway Centerline Dashes
    const centerStripeGeo = new THREE.PlaneGeometry(0.42, 3.2);
    centerStripeGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 42; i++) {
      const stripe = new THREE.Mesh(centerStripeGeo, pureWhiteMat);
      stripe.position.set(0, 0.03, -110 + i * 5.6);
      airfieldWorld.add(stripe);
    }

    // Touchdown Zone Markings
    const tdzGeo = new THREE.PlaneGeometry(1.2, 3.4);
    tdzGeo.rotateX(-Math.PI / 2);
    for (let i = 0; i < 10; i++) {
      const zPos = -60 + i * 14;
      const leftMark = new THREE.Mesh(tdzGeo, pureWhiteMat);
      leftMark.position.set(-3.2, 0.028, zPos);
      airfieldWorld.add(leftMark);

      const rightMark = new THREE.Mesh(tdzGeo, pureWhiteMat);
      rightMark.position.set(3.2, 0.028, zPos);
      airfieldWorld.add(rightMark);
    }

    // Runway Edge White Lights
    const edgeLightGeo = new THREE.SphereGeometry(0.12, 12, 12);
    for (let i = 0; i < 50; i++) {
      const z = -110 + i * 4.6;
      const lLight = new THREE.Mesh(edgeLightGeo, runwayEdgeLightMat);
      lLight.position.set(-7.4, 0.16, z);
      airfieldWorld.add(lLight);

      const rLight = new THREE.Mesh(edgeLightGeo, runwayEdgeLightMat);
      rLight.position.set(7.4, 0.16, z);
      airfieldWorld.add(rLight);
    }

    // Taxiway Blue Lights
    for (let i = 0; i < 6; i++) {
      const bLightL = new THREE.Mesh(edgeLightGeo, taxiwayBlueMat);
      bLightL.position.set(-13 - i * 1.5, 0.16, -34 + i * 2.5);
      airfieldWorld.add(bLightL);

      const bLightR = new THREE.Mesh(edgeLightGeo, taxiwayBlueMat);
      bLightR.position.set(13 + i * 1.5, 0.16, 16 + i * 2.5);
      airfieldWorld.add(bLightR);
    }

    // AIRPORT CHECKING MONITOR ROOM / AIR TRAFFIC CONTROL (ATC) TOWER
    const towerGroup = new THREE.Group();
    towerGroup.position.set(-24, 0, -25);
    airfieldWorld.add(towerGroup);

    const baseBuildingGeo = new THREE.BoxGeometry(10, 4.5, 12);
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x22262d, roughness: 0.6, metalness: 0.3 });
    const baseBuilding = new THREE.Mesh(baseBuildingGeo, buildingMat);
    baseBuilding.position.set(0, 2.25, 0);
    towerGroup.add(baseBuilding);

    const towerShaftGeo = new THREE.CylinderGeometry(1.6, 2.2, 19, 16);
    const towerShaft = new THREE.Mesh(towerShaftGeo, buildingMat);
    towerShaft.position.set(0, 11.5, 0);
    towerGroup.add(towerShaft);

    // Glazed Checking Monitor Room Cab (Reflecting Blue Sky)
    const cabGeo = new THREE.CylinderGeometry(3.6, 2.8, 3.2, 12);
    const cab = new THREE.Mesh(cabGeo, towerWindowMat);
    cab.position.set(0, 22.2, 0);
    towerGroup.add(cab);

    const cabRoofGeo = new THREE.CylinderGeometry(4.1, 3.8, 0.6, 12);
    const cabRoof = new THREE.Mesh(cabRoofGeo, matteBlack);
    cabRoof.position.set(0, 24.1, 0);
    towerGroup.add(cabRoof);

    const radomeGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const radome = new THREE.Mesh(radomeGeo, pureWhiteMat);
    radome.position.set(0, 25.5, 0);
    towerGroup.add(radome);

    const antennaGeo = new THREE.CylinderGeometry(0.06, 0.08, 4.5, 8);
    const antenna = new THREE.Mesh(antennaGeo, titaniumSilver);
    antenna.position.set(0, 27.8, 0);
    towerGroup.add(antenna);

    const towerBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), redBeaconMat);
    towerBeacon.position.set(0, 30.1, 0);
    towerGroup.add(towerBeacon);

    // AIRPORT BUILDINGS: Terminal Concourse & Hangars
    const terminalGroup = new THREE.Group();
    terminalGroup.position.set(30, 0, -10);
    airfieldWorld.add(terminalGroup);

    const concourseGeo = new THREE.BoxGeometry(22, 7.5, 38);
    const terminalConcourse = new THREE.Mesh(concourseGeo, buildingMat);
    terminalConcourse.position.set(0, 3.75, 0);
    terminalGroup.add(terminalConcourse);

    const terminalGlassGeo = new THREE.PlaneGeometry(36, 4.5);
    terminalGlassGeo.rotateY(-Math.PI / 2);
    const terminalGlassMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    const terminalGlass = new THREE.Mesh(terminalGlassGeo, terminalGlassMat);
    terminalGlass.position.set(-11.1, 4.2, 0);
    terminalGroup.add(terminalGlass);

    const jetBridgeGeo = new THREE.BoxGeometry(10, 2.2, 2.2);
    const jetBridge = new THREE.Mesh(jetBridgeGeo, buildingMat);
    jetBridge.position.set(-16, 3.8, 4);
    terminalGroup.add(jetBridge);

    // Maintenance Hangar
    const hangarGroup = new THREE.Group();
    hangarGroup.position.set(-28, 0, 35);
    airfieldWorld.add(hangarGroup);

    const hangarBaseGeo = new THREE.BoxGeometry(18, 6.5, 20);
    const hangarBase = new THREE.Mesh(hangarBaseGeo, buildingMat);
    hangarBase.position.set(0, 3.25, 0);
    hangarGroup.add(hangarBase);

    const hangarDoorGeo = new THREE.PlaneGeometry(14, 5.2);
    hangarDoorGeo.rotateY(Math.PI / 2);
    const hangarDoorMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 });
    const hangarDoor = new THREE.Mesh(hangarDoorGeo, hangarDoorMat);
    hangarDoor.position.set(9.05, 2.8, 0);
    hangarGroup.add(hangarDoor);

    // EVERGREEN PINE TREES ALONG LEFT & RIGHT RUNWAY SHOULDERS
    const treeTrunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.4, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });

    const foliageConeGeo1 = new THREE.ConeGeometry(1.6, 2.4, 8);
    const foliageConeGeo2 = new THREE.ConeGeometry(1.2, 2.0, 8);
    const foliageConeGeo3 = new THREE.ConeGeometry(0.8, 1.6, 8);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x164e2e, // Crisp forest evergreen pine green
      roughness: 0.85,
    });

    const createTree = (x, z, scale = 1.0) => {
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      tree.scale.set(scale, scale, scale);

      const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
      trunk.position.y = 0.7;
      tree.add(trunk);

      const cone1 = new THREE.Mesh(foliageConeGeo1, foliageMat);
      cone1.position.y = 2.1;
      tree.add(cone1);

      const cone2 = new THREE.Mesh(foliageConeGeo2, foliageMat);
      cone2.position.y = 3.3;
      tree.add(cone2);

      const cone3 = new THREE.Mesh(foliageConeGeo3, foliageMat);
      cone3.position.y = 4.3;
      tree.add(cone3);

      return tree;
    };

    const treesGroup = new THREE.Group();
    airfieldWorld.add(treesGroup);

    const leftTreePositions = [
      { x: -16, z: -70, s: 1.2 },
      { x: -20, z: -64, s: 1.4 },
      { x: -18, z: -52, s: 1.1 },
      { x: -22, z: -45, s: 1.3 },
      { x: -17, z: -10, s: 1.2 },
      { x: -21, z: 2, s: 1.5 },
      { x: -16, z: 12, s: 1.0 },
      { x: -19, z: 22, s: 1.3 },
      { x: -23, z: 58, s: 1.4 },
      { x: -18, z: 68, s: 1.2 },
      { x: -22, z: 80, s: 1.5 },
      { x: -26, z: -80, s: 1.6 },
      { x: -30, z: -35, s: 1.4 },
      { x: -32, z: 10, s: 1.7 },
      { x: -35, z: 45, s: 1.5 },
    ];

    const rightTreePositions = [
      { x: 17, z: -80, s: 1.3 },
      { x: 21, z: -72, s: 1.5 },
      { x: 18, z: -60, s: 1.1 },
      { x: 23, z: -48, s: 1.4 },
      { x: 19, z: -34, s: 1.2 },
      { x: 22, z: 12, s: 1.3 },
      { x: 26, z: 24, s: 1.6 },
      { x: 18, z: 36, s: 1.1 },
      { x: 22, z: 48, s: 1.4 },
      { x: 19, z: 62, s: 1.2 },
      { x: 24, z: 74, s: 1.5 },
      { x: 28, z: 86, s: 1.3 },
      { x: 34, z: -55, s: 1.6 },
      { x: 36, z: 30, s: 1.5 },
      { x: 38, z: 55, s: 1.7 },
    ];

    leftTreePositions.forEach((p) => treesGroup.add(createTree(p.x, p.z, p.s)));
    rightTreePositions.forEach((p) => treesGroup.add(createTree(p.x, p.z, p.s)));

    // 7. Interactive Mouse Motion & Physics
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetMouseX = Math.max(-1, Math.min(1, x));
      targetMouseY = Math.max(-1, Math.min(1, y));
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse lerp
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      // Airliner Aerodynamic Flight Motion
      const floatBank = Math.sin(elapsedTime * 1.2) * 0.03;
      const floatPitch = Math.cos(elapsedTime * 0.9) * 0.02;

      airplaneGroup.rotation.z = -currentMouseX * 0.35 + floatBank;
      airplaneGroup.rotation.x = currentMouseY * 0.18 + floatPitch;
      airplaneGroup.rotation.y = -currentMouseX * 0.15;

      airplaneGroup.position.x = currentMouseX * 2.8;
      airplaneGroup.position.y = 0.6 + currentMouseY * 1.2 + Math.sin(elapsedTime * 1.5) * 0.12;

      // Moving Airfield & Runway Motion
      airfieldWorld.position.z = ((elapsedTime * 22) % 60) - 30;

      // Slow Gentle Cloud Drift across the Blue Sky
      cloudsGroup.children.forEach((c, idx) => {
        c.position.x += 0.015 * ((idx % 3) + 1);
        if (c.position.x > 80) c.position.x = -80;
      });

      // Jet Heat Vapor Animation
      const positions = particleGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 2] -= particleSpeeds[i];
        if (positions[i * 3 + 2] < -14) {
          positions[i * 3 + 2] = -1.6;
          const isLeft = i % 2 === 0;
          positions[i * 3] = (isLeft ? -3.4 : 3.4) + (Math.random() - 0.5) * 0.35;
          positions[i * 3 + 1] = -0.88 + (Math.random() - 0.5) * 0.35;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Flashing Lights
      const strobeOn = Math.floor(elapsedTime * 2.5) % 2 === 0;
      starStrobe.material.color.setHex(strobeOn ? 0xffffff : 0x222222);
      portStrobe.material.color.setHex(strobeOn ? 0xffffff : 0x222222);

      const beaconOn = Math.floor(elapsedTime * 1.5) % 2 === 0;
      tailBeacon.material.color.setHex(beaconOn ? 0xdc2626 : 0x450a0a);
      towerBeacon.material.color.setHex(beaconOn ? 0xdc2626 : 0x450a0a);

      camera.lookAt(airplaneGroup.position.x * 0.3, 0.4, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '100vh' }} />
    </div>
  );
}
