import * as THREE from 'three';

// ==================== F1 TEAMS DATA ====================
const TEAMS = [
  { name: 'Red Bull Racing', color: 0x1e3a5f, accent: 0xe10600, numColor: 0xffffff, driver: 'Max Verstappen', power: 1050, topSpeed: 355, weight: 798 },
  { name: 'Mercedes-AMG', color: 0x00d2be, accent: 0xc0c0c0, numColor: 0xffffff, driver: 'Lewis Hamilton', power: 1040, topSpeed: 352, weight: 798 },
  { name: 'Scuderia Ferrari', color: 0xdc0000, accent: 0xffd700, numColor: 0xffd700, driver: 'Charles Leclerc', power: 1060, topSpeed: 358, weight: 798 },
  { name: 'McLaren', color: 0xff8700, accent: 0x000000, numColor: 0xffffff, driver: 'Lando Norris', power: 1035, topSpeed: 350, weight: 798 },
  { name: 'Aston Martin', color: 0x006f62, accent: 0xcedc00, numColor: 0xffffff, driver: 'Fernando Alonso', power: 1020, topSpeed: 348, weight: 798 },
  { name: 'Alpine', color: 0x0055a4, accent: 0xff69b4, numColor: 0xffffff, driver: 'Pierre Gasly', power: 1010, topSpeed: 345, weight: 798 },
  { name: 'Williams Racing', color: 0x00327d, accent: 0x00a0de, numColor: 0xffffff, driver: 'Alex Albon', power: 1000, topSpeed: 342, weight: 798 },
  { name: 'RB', color: 0x1a1a2e, accent: 0xffffff, numColor: 0xc0c0c0, driver: 'Daniel Ricciardo', power: 1015, topSpeed: 346, weight: 798 },
  { name: 'Sauber', color: 0x00e600, accent: 0x000000, numColor: 0xffffff, driver: 'Valtteri Bottas', power: 1000, topSpeed: 340, weight: 798 },
  { name: 'Haas F1 Team', color: 0xffffff, accent: 0xe10600, numColor: 0xe10600, driver: 'Kevin Magnussen', power: 995, topSpeed: 338, weight: 798 },
];

// ==================== TRACK WAYPOINTS (Silverstone-inspired) ====================
const TRACK_WAYPOINTS = [
  { x: 0, z: 0 },        // Start/Finish
  { x: 15, z: 8 },
  { x: 35, z: 20 },
  { x: 58, z: 25 },
  { x: 75, z: 15 },
  { x: 85, z: -5 },      // Village
  { x: 82, z: -30 },
  { x: 70, z: -50 },
  { x: 50, z: -65 },
  { x: 25, z: -75 },     // Wellington
  { x: 0, z: -78 },
  { x: -25, z: -72 },
  { x: -48, z: -58 },
  { x: -60, z: -38 },    // Luffield
  { x: -65, z: -15 },
  { x: -72, z: 5 },      // Copse
  { x: -78, z: 20 },
  { x: -75, z: 40 },
  { x: -60, z: 55 },
  { x: -38, z: 65 },
  { x: -15, z: 68 },     // Hangar Straight
  { x: 5, z: 60 },
  { x: 18, z: 48 },
  { x: 10, z: 25 },
  { x: 0, z: 0 },        // Back to start
];

const TRACK_WIDTH = 12;
const TOTAL_LAPS = 5;

// ==================== GAME STATE ====================
const state = {
  mode: 'loading',    // 'loading' | 'menu' | 'showroom' | 'driving' | 'paused'
  selectedCar: 0,
  cameraMode: 0,      // 0=chase, 1=cockpit
  lap: 1,
  lapStartTime: 0,
  lapTimes: [],
  bestLap: Infinity,
  checkpoints: new Set(),
  totalCheckpoints: 6,
  speed: 0,           // m/s
  gear: 0,
  rpm: 0,
  maxRPM: 15000,
  steerAngle: 0,
  handbrake: false,
  offTrack: false,
  offTrackTimer: 0,
  showroomTarget: null,
};

const input = { throttle: 0, brake: 0, steer: 0, handbrake: false };
const carObj = { mesh: null, wheels: [], speed: 0, rotation: 0, position: new THREE.Vector3(0, 0.35, 0) };

// ==================== THREE.JS SETUP ====================
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 200, 600);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.5, 1000);
camera.position.set(0, 12, -30);
camera.lookAt(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0x6688aa, 0.8);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffcc, 1.5);
sunLight.position.set(100, 150, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
scene.add(sunLight);

const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3a, 0.4);
scene.add(hemiLight);

// Ground
const groundGeo = new THREE.PlaneGeometry(600, 600);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
ground.receiveShadow = true;
scene.add(ground);

// ==================== CAR MODEL BUILDER ====================
function createCarModel(team) {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: team.color, roughness: 0.25, metalness: 0.75 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.3 });
  const accentMat = new THREE.MeshStandardMaterial({ color: team.accent, roughness: 0.3, metalness: 0.5, emissive: team.accent, emissiveIntensity: 0.1 });

  // Main body
  const bodyGeo = new THREE.BoxGeometry(0.85, 0.3, 3.8);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.35;
  body.castShadow = true;
  car.add(body);

  // Nose cone
  const noseGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.9, 8);
  const nose = new THREE.Mesh(noseGeo, bodyMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.22, 2.3);
  nose.castShadow = true;
  car.add(nose);

  // Front wing
  const fwGeo = new THREE.BoxGeometry(1.6, 0.04, 0.35);
  const fw = new THREE.Mesh(fwGeo, darkMat);
  fw.position.set(0, 0.12, 2.55);
  fw.castShadow = true;
  car.add(fw);
  const fwEpGeo = new THREE.BoxGeometry(0.3, 0.06, 0.35);
  [-0.65, 0.65].forEach(x => {
    const fwEp = new THREE.Mesh(fwEpGeo, accentMat);
    fwEp.position.set(x, 0.12, 2.55);
    fwEp.castShadow = true;
    car.add(fwEp);
  });

  // Rear wing
  const rwMainGeo = new THREE.BoxGeometry(1.1, 0.06, 0.55);
  const rwMain = new THREE.Mesh(rwMainGeo, darkMat);
  rwMain.position.set(0, 0.68, -1.85);
  rwMain.castShadow = true;
  car.add(rwMain);
  const rwPostGeo = new THREE.BoxGeometry(0.06, 0.35, 0.06);
  [-0.5, 0.5].forEach(x => {
    const post = new THREE.Mesh(rwPostGeo, darkMat);
    post.position.set(x, 0.5, -1.85);
    post.castShadow = true;
    car.add(post);
  });

  // Sidepods
  const podGeo = new THREE.BoxGeometry(0.5, 0.2, 1.2);
  [-0.5, 0.5].forEach(x => {
    const pod = new THREE.Mesh(podGeo, bodyMat);
    pod.position.set(x, 0.25, 0.3);
    car.add(pod);
  });
  // Accent stripe on sidepods
  const stripeGeo = new THREE.BoxGeometry(0.52, 0.08, 1.15);
  [-0.5, 0.5].forEach(x => {
    const stripe = new THREE.Mesh(stripeGeo, accentMat);
    stripe.position.set(x, 0.18, 0.3);
    car.add(stripe);
  });

  // Engine cover / airbox
  const airboxGeo = new THREE.BoxGeometry(0.4, 0.25, 1.0);
  const airbox = new THREE.Mesh(airboxGeo, bodyMat);
  airbox.position.set(0, 0.55, -0.5);
  car.add(airbox);
  const airInGeo = new THREE.BoxGeometry(0.25, 0.3, 0.3);
  const airIn = new THREE.Mesh(airInGeo, darkMat);
  airIn.position.set(0, 0.75, 0.0);
  car.add(airIn);

  // Halo
  const haloGeo = new THREE.TorusGeometry(0.28, 0.035, 8, 12, Math.PI);
  const halo = new THREE.Mesh(haloGeo, darkMat);
  halo.position.set(0, 0.6, 0.65);
  halo.rotation.set(Math.PI / 2, 0, 0);
  car.add(halo);

  // Tires
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 20);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.24, 8);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.2, metalness: 0.9 });

  const wheelPos = [
    { x: -0.6, z: 1.35 }, { x: 0.6, z: 1.35 },
    { x: -0.6, z: -1.2 }, { x: 0.6, z: -1.2 },
  ];

  const wheels = [];
  wheelPos.forEach(pos => {
    const wheelGrp = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheelGrp.add(tire);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    wheelGrp.add(rim);
    wheelGrp.position.set(pos.x, 0.3, pos.z);
    car.add(wheelGrp);
    wheels.push(wheelGrp);
  });

  // Driver helmet
  const helmetGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const helmetMat = new THREE.MeshStandardMaterial({ color: team.numColor, roughness: 0.3, metalness: 0.5 });
  const helmet = new THREE.Mesh(helmetGeo, helmetMat);
  helmet.position.set(0, 0.55, 0.7);
  car.add(helmet);

  // Number on nose (small colored plane)
  const numGeo = new THREE.CircleGeometry(0.12, 8);
  const numMat = new THREE.MeshStandardMaterial({ color: team.accent, roughness: 0.3 });
  const num = new THREE.Mesh(numGeo, numMat);
  num.rotation.x = -Math.PI / 2;
  num.position.set(0, 0.36, 2.0);
  car.add(num);

  car.castShadow = true;
  car.receiveShadow = true;
  return { mesh: car, wheels };
}

// ==================== TRACK BUILDER ====================
function createTrack() {
  const trackGroup = new THREE.Group();
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.85 });
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xe10600, roughness: 0.4 });
  const curbWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x3d7a3d, roughness: 0.95 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });
  const pitWallMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.3 });

  const pts = TRACK_WAYPOINTS;
  const n = pts.length;

  for (let i = 0; i < n - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);
    const midX = (a.x + b.x) / 2, midZ = (a.z + b.z) / 2;

    // Road segment
    const roadGeo = new THREE.PlaneGeometry(TRACK_WIDTH, length);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.rotation.z = angle;
    road.position.set(midX, 0.01, midZ);
    road.receiveShadow = true;
    trackGroup.add(road);

    // Center line
    const lineGeo = new THREE.PlaneGeometry(0.3, length);
    const line = new THREE.Mesh(lineGeo, curbWhiteMat);
    line.rotation.x = -Math.PI / 2;
    line.rotation.z = angle;
    line.position.set(midX, 0.02, midZ);
    trackGroup.add(line);

    // Curbs
    for (let side = -1; side <= 1; side += 2) {
      const curbX = midX + Math.cos(angle + Math.PI / 2) * side * TRACK_WIDTH / 2;
      const curbZ = midZ + Math.sin(angle + Math.PI / 2) * side * TRACK_WIDTH / 2;
      const segs = Math.floor(length / 1.5);

      for (let s = 0; s < segs; s++) {
        const frac = (s + 0.5) / segs;
        const cx = a.x + (b.x - a.x) * frac + Math.cos(angle + Math.PI / 2) * side * (TRACK_WIDTH / 2 + 0.4);
        const cz = a.z + (b.z - a.z) * frac + Math.sin(angle + Math.PI / 2) * side * (TRACK_WIDTH / 2 + 0.4);
        const mat = (s % 2 === 0) ? curbMat : curbWhiteMat;
        const curbGeo = new THREE.BoxGeometry(side < 0 ? 0.8 : 0.8, 0.05, 1.5);
        const curb = new THREE.Mesh(curbGeo, mat);
        curb.position.set(cx, 0.04, cz);
        curb.rotation.y = angle;
        curb.receiveShadow = true;
        trackGroup.add(curb);
      }
    }

    // Walls/barriers
    for (let side = -1; side <= 1; side += 2) {
      const wallX = midX + Math.cos(angle + Math.PI / 2) * side * (TRACK_WIDTH / 2 + 1.5);
      const wallZ = midZ + Math.sin(angle + Math.PI / 2) * side * (TRACK_WIDTH / 2 + 1.5);
      const wallGeo = new THREE.BoxGeometry(0.3, 0.6, length);
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(wallX, 0.3, wallZ);
      wall.rotation.y = angle;
      wall.castShadow = true;
      wall.receiveShadow = true;
      trackGroup.add(wall);
    }
  }

  // Checkpoint markers
  const checkpointIndices = [0, 5, 9, 13, 17, 21]; // 6 checkpoints around the track
  const markerGeo = new THREE.BoxGeometry(2, 3, 0.3);
  const markerMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.5, emissive: 0xff6600, emissiveIntensity: 0.5 });

  state.checkpointMarkers = [];
  checkpointIndices.forEach(idx => {
    if (idx < pts.length) {
      const p = pts[idx];
      const marker = new THREE.Mesh(markerGeo, markerMat.clone());
      marker.position.set(p.x, 1.5, p.z);
      trackGroup.add(marker);
      state.checkpointMarkers.push({ mesh: marker, index: idx });
    }
  });

  // Start/Finish line
  const sfGeo = new THREE.PlaneGeometry(TRACK_WIDTH, 1);
  const sfMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const sfLine = new THREE.Mesh(sfGeo, sfMat);
  sfLine.rotation.x = -Math.PI / 2;
  sfLine.position.set(pts[0].x, 0.03, pts[0].z);
  sfLine.rotation.z = Math.atan2(pts[1].x - pts[0].x, pts[1].z - pts[0].z);
  trackGroup.add(sfLine);

  // Checkerboard start line accents
  const ckSize = 0.5;
  for (let sx = -TRACK_WIDTH / 2; sx < TRACK_WIDTH / 2; sx += ckSize * 2) {
    for (let ck = 0; ck < 2; ck++) {
      const ckGeo = new THREE.PlaneGeometry(ckSize, 0.5);
      const ckLine = new THREE.Mesh(ckGeo, new THREE.MeshStandardMaterial({ color: ck % 2 === 0 ? 0x000000 : 0xffffff, roughness: 0.3 }));
      ckLine.rotation.x = -Math.PI / 2;
      const cAngle = Math.atan2(pts[1].x - pts[0].x, pts[1].z - pts[0].z);
      const perpAngle = cAngle + Math.PI / 2;
      ckLine.position.set(pts[0].x + Math.cos(perpAngle) * (sx + ckSize * ck + ckSize / 2), 0.04, pts[0].z + Math.sin(perpAngle) * (sx + ckSize * ck + ckSize / 2));
      ckLine.rotation.z = cAngle;
      trackGroup.add(ckLine);
    }
  }

  // Pit lane (simple - parallel to start straight)
  const pitLength = 40;
  const pitGeo = new THREE.PlaneGeometry(6, pitLength);
  const pitRoad = new THREE.Mesh(pitGeo, new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 }));
  pitRoad.rotation.x = -Math.PI / 2;
  pitRoad.rotation.z = Math.atan2(pts[1].x - pts[0].x, pts[1].z - pts[0].z);
  const startAngle = Math.atan2(pts[1].x - pts[0].x, pts[1].z - pts[0].z);
  const perpX = Math.cos(startAngle + Math.PI / 2);
  const perpZ = Math.sin(startAngle + Math.PI / 2);
  pitRoad.position.set(pts[0].x + perpX * 12, 0.02, pts[0].z + perpZ * 12);
  trackGroup.add(pitRoad);

  // Pit wall
  const pitWallGeo = new THREE.BoxGeometry(0.3, 1.2, pitLength);
  const pitWall = new THREE.Mesh(pitWallGeo, pitWallMat);
  pitWall.rotation.y = startAngle;
  pitWall.position.set(pts[0].x + perpX * 8.5, 0.6, pts[0].z + perpZ * 8.5);
  pitWall.castShadow = true;
  trackGroup.add(pitWall);

  // Scenery - trees around the track
  const treeGeo = new THREE.ConeGeometry(3, 8, 6);
  const treeTrunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 4, 6);
  const treeLeafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9 });
  const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.9 });

  const treePositions = [];
  for (let i = 0; i < 80; i++) {
    const segIdx = Math.floor(Math.random() * (n - 1));
    const a = pts[segIdx], b = pts[segIdx + 1];
    const t = Math.random();
    const dx = b.x - a.x, dz = b.z - a.z;
    const ang = Math.atan2(dx, dz);
    const side = Math.random() > 0.5 ? 1 : -1;
    const dist = 25 + Math.random() * 80;
    const tx = a.x + dx * t + Math.cos(ang + Math.PI / 2) * side * dist;
    const tz = a.z + dz * t + Math.sin(ang + Math.PI / 2) * side * dist;
    treePositions.push({ x: tx, z: tz });
  }

  treePositions.forEach(pos => {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(treeTrunkGeo, treeTrunkMat);
    trunk.position.y = 2;
    tree.add(trunk);
    const leaves = new THREE.Mesh(treeGeo, treeLeafMat);
    leaves.position.y = 7;
    leaves.castShadow = true;
    tree.add(leaves);
    tree.position.set(pos.x, 0, pos.z);
    const s = 0.6 + Math.random() * 0.8;
    tree.scale.set(s, s, s);
    tree.rotation.y = Math.random() * Math.PI * 2;
    trackGroup.add(tree);
  });

  // Grandstand near start/finish
  const gsGeo = new THREE.BoxGeometry(20, 5, 8);
  const gsMat = new THREE.MeshStandardMaterial({ color: 0x8888aa, roughness: 0.7, metalness: 0.2 });
  const grandstand = new THREE.Mesh(gsGeo, gsMat);
  grandstand.position.set(pts[0].x + perpX * (-15), 2.5, pts[0].z + perpZ * (-15));
  grandstand.rotation.y = startAngle;
  grandstand.castShadow = true;
  grandstand.receiveShadow = true;
  trackGroup.add(grandstand);

  // Grandstand roof
  const roofGeo = new THREE.PlaneGeometry(22, 10);
  const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.3 }));
  roof.rotation.x = -Math.PI / 2;
  roof.position.set(pts[0].x + perpX * (-15), 5.5, pts[0].z + perpZ * (-15));
  roof.rotation.z = startAngle;
  roof.castShadow = true;
  trackGroup.add(roof);

  scene.add(trackGroup);
  return trackGroup;
}

// ==================== PHYSICS ====================
function getClosestTrackPoint(px, pz) {
  let minDist = Infinity, closestIdx = 0, closestT = 0;
  const pts = TRACK_WAYPOINTS;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const lenSq = dx * dx + dz * dz;
    let t = ((px - a.x) * dx + (pz - a.z) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = a.x + dx * t, cz = a.z + dz * t;
    const dist = Math.sqrt((px - cx) ** 2 + (pz - cz) ** 2);
    if (dist < minDist) { minDist = dist; closestIdx = i; closestT = t; }
  }
  return { dist: minDist, idx: closestIdx, t: closestT };
}

function getTrackHeading(idx) {
  const pts = TRACK_WAYPOINTS;
  const a = pts[idx], b = pts[Math.min(idx + 1, pts.length - 1)];
  return Math.atan2(b.x - a.x, b.z - a.z);
}

function updatePhysics(dt) {
  const car = carObj;
  dt = Math.min(dt, 0.05); // Cap delta time

  // Input processing
  const accelForce = input.throttle * 25; // m/s^2
  const brakeForce = input.brake * 40;
  const dragForce = car.speed * car.speed * 0.003;
  const rollingResistance = car.speed * 0.5;

  // Off-track penalty
  const trackInfo = getClosestTrackPoint(car.position.x, car.position.z);
  const isOffTrack = trackInfo.dist > TRACK_WIDTH / 2 + 1;
  state.offTrack = isOffTrack;

  let gripMultiplier = isOffTrack ? 0.3 : 1.0;
  if (isOffTrack) {
    state.offTrackTimer += dt;
  } else {
    state.offTrackTimer = Math.max(0, state.offTrackTimer - dt * 2);
  }

  const offTrackDrag = isOffTrack ? car.speed * 3 : 0;

  // Speed update
  car.speed += (accelForce - brakeForce - dragForce - rollingResistance - offTrackDrag) * dt;
  car.speed = Math.max(0, Math.min(car.speed, 90)); // ~324 km/h max

  // Steering
  const maxSteerAngle = 0.035 * (1 - Math.min(car.speed / 80, 0.85)); // Less steering at high speed
  state.steerAngle += (input.steer * maxSteerAngle - state.steerAngle) * Math.min(dt * 8, 1);
  state.steerAngle *= 0.98;

  // Apply steering to rotation
  const steerEffect = state.steerAngle * (car.speed / 15) * gripMultiplier;
  car.rotation += steerEffect * dt * 3;

  // Update position
  car.position.x += Math.sin(car.rotation) * car.speed * dt;
  car.position.z += Math.cos(car.rotation) * car.speed * dt;

  // RPM & Gear
  state.rpm = (car.speed / 90) * state.maxRPM;
  if (car.speed < 0.5) state.gear = 0;
  else if (car.speed < 8) state.gear = 1;
  else if (car.speed < 16) state.gear = 2;
  else if (car.speed < 24) state.gear = 3;
  else if (car.speed < 33) state.gear = 4;
  else if (car.speed < 43) state.gear = 5;
  else if (car.speed < 55) state.gear = 6;
  else if (car.speed < 70) state.gear = 7;
  else state.gear = 8;

  state.speed = car.speed * 3.6; // Convert to km/h for display

  // Checkpoints
  const cpSpacing = Math.floor(TRACK_WAYPOINTS.length / state.totalCheckpoints);
  for (let i = 0; i < state.totalCheckpoints; i++) {
    const cpIdx = i * cpSpacing;
    const cp = TRACK_WAYPOINTS[cpIdx];
    const dist = Math.sqrt((car.position.x - cp.x) ** 2 + (car.position.z - cp.z) ** 2);
    if (dist < 10 && !state.checkpoints.has(i)) {
      state.checkpoints.add(i);
      if (state.checkpoints.size === state.totalCheckpoints) {
        // Lap complete!
        const lapTime = performance.now() - state.lapStartTime;
        state.lapTimes.push(lapTime);
        if (lapTime < state.bestLap) state.bestLap = lapTime;
        state.lap++;
        state.checkpoints.clear();
        state.lapStartTime = performance.now();
        if (state.lap > TOTAL_LAPS) {
          endRace();
        }
      }
    }
  }

  // Update car mesh
  if (car.mesh) {
    car.mesh.position.copy(car.position);
    car.mesh.position.y = 0.35;
    car.mesh.rotation.y = car.rotation + Math.PI;
    // Spin wheels
    const wheelSpin = car.speed * dt * 10;
    car.wheels.forEach(w => {
      const child = w.children[0];
      if (child) child.rotation.x += wheelSpin;
    });
  }
}

// ==================== CAMERA ====================
function updateCamera() {
  const car = carObj;
  if (state.mode !== 'driving') return;

  if (state.cameraMode === 0) {
    // Chase camera
    const behindX = car.position.x - Math.sin(car.rotation) * 8;
    const behindZ = car.position.z - Math.cos(car.rotation) * 8;
    const targetX = car.position.x;
    const targetZ = car.position.z;
    const targetY = 3;

    camera.position.lerp(new THREE.Vector3(behindX, 4.5, behindZ), 0.08);
    camera.lookAt(targetX, targetY, targetZ);
  } else {
    // Cockpit-ish
    const fwdX = car.position.x + Math.sin(car.rotation) * 1.5;
    const fwdZ = car.position.z + Math.cos(car.rotation) * 1.5;
    camera.position.set(car.position.x, 0.75, car.position.z);
    camera.lookAt(fwdX, 0.7, fwdZ);
  }
}

function updateShowroomCamera() {
  if (state.mode !== 'showroom' || !state.showroomTarget) return;
  const t = performance.now() * 0.0003;
  const r = 8;
  const cx = state.showroomTarget.position.x;
  const cz = state.showroomTarget.position.z;
  camera.position.set(cx + Math.cos(t) * r, 2.5, cz + Math.sin(t) * r);
  camera.lookAt(cx, 0.5, cz);
}

// ==================== SHOWROOM ====================
let showroomCars = [];
let showroomPlatform = null;
const showroomScene = new THREE.Group();

function buildShowroom() {
  // Clear previous
  while (showroomScene.children.length > 0) showroomScene.remove(showroomScene.children[0]);
  showroomCars = [];

  // Platform
  const platGeo = new THREE.CylinderGeometry(5, 5, 0.3, 32);
  const platMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.8 });
  showroomPlatform = new THREE.Mesh(platGeo, platMat);
  showroomPlatform.position.y = -0.15;
  showroomPlatform.receiveShadow = true;
  showroomScene.add(showroomPlatform);

  // Floor reflection
  const floorGeo = new THREE.PlaneGeometry(20, 20);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.3;
  showroomScene.add(floor);

  // Spotlights
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const spotLight = new THREE.SpotLight(0xffffff, 30, 15, Math.PI / 8, 0.3);
    spotLight.position.set(Math.cos(angle) * 6, 6, Math.sin(angle) * 6);
    spotLight.target.position.set(0, 0.5, 0);
    spotLight.castShadow = true;
    showroomScene.add(spotLight);
    showroomScene.add(spotLight.target);
  }

  // Create all cars in a circle
  TEAMS.forEach((team, i) => {
    const { mesh, wheels } = createCarModel(team);
    const angle = (i / TEAMS.length) * Math.PI * 2;
    mesh.position.set(Math.cos(angle) * 4, 0.35, Math.sin(angle) * 4);
    mesh.rotation.y = angle + Math.PI / 2;
    showroomScene.add(mesh);
    showroomCars.push({ mesh, wheels, team, index: i });
  });

  scene.add(showroomScene);
}

function selectShowroomCar(index) {
  state.selectedCar = index;
  const car = showroomCars[index];
  if (!car) return;
  state.showroomTarget = car.mesh;

  // Update UI
  document.getElementById('showroom-car-name').textContent = car.team.name;
  document.getElementById('showroom-car-driver').textContent = car.team.driver;
  document.getElementById('stat-power').textContent = car.team.power + ' HP';
  document.getElementById('stat-speed').textContent = car.team.topSpeed + ' km/h';
  document.getElementById('stat-weight').textContent = car.team.weight + ' kg';
}

// ==================== HUD ====================
function updateHUD() {
  if (state.mode !== 'driving') return;

  document.getElementById('speed-value').textContent = Math.round(state.speed);
  document.getElementById('gear-value').textContent = state.gear === 0 ? 'N' : state.gear;
  document.getElementById('lap-text').textContent = `LAP ${Math.min(state.lap, TOTAL_LAPS)}/${TOTAL_LAPS}`;

  // Lap time
  const elapsed = performance.now() - state.lapStartTime;
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  const ms = Math.floor((elapsed % 1000));
  document.getElementById('lap-time').textContent =
    `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;

  // Best lap
  if (state.bestLap < Infinity) {
    const bMins = Math.floor(state.bestLap / 60000);
    const bSecs = Math.floor((state.bestLap % 60000) / 1000);
    const bMs = Math.floor((state.bestLap % 1000));
    document.getElementById('best-time').textContent =
      `${String(bMins).padStart(2, '0')}:${String(bSecs).padStart(2, '0')}.${String(bMs).padStart(3, '0')}`;
  }

  // RPM bar
  const rpmPercent = (state.rpm / state.maxRPM) * 100;
  document.getElementById('rpm-bar').style.width = rpmPercent + '%';

  // RPM lights
  const lights = document.querySelectorAll('.rpm-light');
  lights.forEach((l, i) => { l.className = 'rpm-light'; });
  const thresholds = [50, 65, 75, 82, 88, 92, 95, 98];
  const colors = ['active-green', 'active-green', 'active-green', 'active-green', 'active-yellow', 'active-yellow', 'active-red', 'active-purple'];
  thresholds.forEach((t, i) => {
    if (rpmPercent >= t && lights[i]) lights[i].className = 'rpm-light ' + colors[i];
  });

  // Off-track warning
  document.getElementById('speed-section').style.color = state.offTrack ? '#ff4444' : '#ffffff';
}

function updateMinimap() {
  if (state.mode !== 'driving') return;
  const mmCanvas = document.getElementById('minimap-canvas');
  const ctx = mmCanvas.getContext('2d');
  const w = mmCanvas.width, h = mmCanvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, w, h);

  // Find bounds
  const pts = TRACK_WAYPOINTS;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  pts.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z); });
  const padX = (maxX - minX) * 0.15, padZ = (maxZ - minZ) * 0.15;
  minX -= padX; maxX += padX; minZ -= padZ; maxZ += padZ;
  const scaleX = w / (maxX - minX), scaleZ = h / (maxZ - minZ);
  const scale = Math.min(scaleX, scaleZ);
  const offX = (w - (maxX - minX) * scale) / 2 - minX * scale;
  const offZ = (h - (maxZ - minZ) * scale) / 2 - minZ * scale;

  function tx(x) { return x * scale + offX; }
  function tz(z) { return z * scale + offZ; }

  // Draw track
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tx(pts[0].x), tz(pts[0].z));
  for (let i = 1; i < pts.length; i++) ctx.lineTo(tx(pts[i].x), tz(pts[i].z));
  ctx.stroke();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Start line
  ctx.fillStyle = '#fff';
  ctx.fillRect(tx(pts[0].x) - 3, tz(pts[0].z) - 3, 6, 6);

  // Car position
  const cx = tx(carObj.position.x), cz = tz(carObj.position.z);
  ctx.fillStyle = TEAMS[state.selectedCar].color.toString(16).padStart(6, '0');
  ctx.fillStyle = '#' + ctx.fillStyle;
  ctx.fillStyle = '#e10600';
  ctx.beginPath();
  ctx.arc(cx, cz, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Direction triangle
  const dx = Math.sin(carObj.rotation) * 8, dz = Math.cos(carObj.rotation) * 8;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(cx + dx, cz + dz);
  ctx.lineTo(cx - dz * 0.3, cz + dx * 0.3);
  ctx.lineTo(cx + dz * 0.3, cz - dx * 0.3);
  ctx.fill();
}

// ==================== MODE MANAGEMENT ====================
function showMenu() {
  state.mode = 'menu';
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('main-menu').classList.remove('hidden');
  document.getElementById('showroom-ui').classList.add('hidden');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('pause-menu').classList.add('hidden');
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 200, 600);
  if (showroomScene.parent) scene.remove(showroomScene);
  if (carObj.mesh && carObj.mesh.parent) carObj.mesh.parent.remove(carObj.mesh);
  camera.position.set(0, 15, 25);
  camera.lookAt(0, 0, 0);
}

function showShowroom() {
  state.mode = 'showroom';
  document.getElementById('main-menu').classList.add('hidden');
  document.getElementById('showroom-ui').classList.remove('hidden');
  document.getElementById('hud').classList.add('hidden');
  scene.background = new THREE.Color(0x111111);
  scene.fog = new THREE.Fog(0x111111, 20, 60);
  buildShowroom();
  selectShowroomCar(state.selectedCar);
}

function startDriving() {
  state.mode = 'driving';
  document.getElementById('showroom-ui').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('pause-menu').classList.add('hidden');
  document.getElementById('main-menu').classList.add('hidden');

  // Remove showroom
  if (showroomScene.parent) scene.remove(showroomScene);

  // Create driven car
  if (carObj.mesh && carObj.mesh.parent) carObj.mesh.parent.remove(carObj.mesh);
  const team = TEAMS[state.selectedCar];
  const { mesh, wheels } = createCarModel(team);
  carObj.mesh = mesh;
  carObj.wheels = wheels;
  scene.add(mesh);

  // Place car at start
  const start = TRACK_WAYPOINTS[0];
  carObj.position.set(start.x, 0.35, start.z);
  carObj.rotation = getTrackHeading(0);
  carObj.speed = 0;
  state.speed = 0;
  state.gear = 0;
  state.rpm = 0;
  state.steerAngle = 0;
  state.lap = 1;
  state.lapTimes = [];
  state.bestLap = Infinity;
  state.checkpoints.clear();
  state.lapStartTime = performance.now();
  state.offTrack = false;
  state.offTrackTimer = 0;
  state.cameraMode = 0;

  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 200, 600);
  updateCamera();
}

function endRace() {
  state.mode = 'menu';
  const totalTime = state.lapTimes.reduce((a, b) => a + b, 0);
  const bestTime = state.bestLap;
  alert(`Race Complete!\nTotal time: ${(totalTime / 1000).toFixed(3)}s\nBest lap: ${(bestTime / 1000).toFixed(3)}s`);
  showMenu();
}

function togglePause() {
  if (state.mode === 'driving') {
    state.mode = 'paused';
    document.getElementById('pause-menu').classList.remove('hidden');
  } else if (state.mode === 'paused') {
    state.mode = 'driving';
    document.getElementById('pause-menu').classList.add('hidden');
    state.lapStartTime = performance.now() - (state.lapTimes.length > 0 ? state.lapTimes.reduce((a, b) => a + b, 0) : 0);
  }
}

// ==================== INPUT ====================
function setupInput() {
  const keyState = {};
  window.addEventListener('keydown', e => {
    keyState[e.code] = true;
    if (e.code === 'Space') { e.preventDefault(); input.handbrake = true; }
    if (e.code === 'KeyC') { state.cameraMode = state.cameraMode === 0 ? 1 : 0; }
    if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
  });
  window.addEventListener('keyup', e => { keyState[e.code] = false; if (e.code === 'Space') input.handbrake = false; });

  // Process input each frame
  window.processInput = () => {
    input.throttle = (keyState['KeyW'] || keyState['ArrowUp']) ? 1 : 0;
    input.brake = (keyState['KeyS'] || keyState['ArrowDown']) ? 1 : 0;
    input.steer = 0;
    if (keyState['KeyA'] || keyState['ArrowLeft']) input.steer = -1;
    if (keyState['KeyD'] || keyState['ArrowRight']) input.steer = 1;
    if (input.handbrake) input.brake = 1;
  };

  // Mobile controls
  const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
  if (isMobile) {
    document.getElementById('mobile-controls').classList.remove('hidden');
    document.getElementById('controls-info').classList.add('hidden');
    setupMobileControls();
  }
}

function setupMobileControls() {
  const left = document.getElementById('btn-left');
  const right = document.getElementById('btn-right');
  const brake = document.getElementById('btn-brake');
  const accel = document.getElementById('btn-accel');

  let mSteer = 0, mThrottle = 0, mBrake = 0;

  const addTouch = (el, setter) => {
    el.addEventListener('pointerdown', e => { e.preventDefault(); setter(1); });
    el.addEventListener('pointerup', e => { e.preventDefault(); setter(0); });
    el.addEventListener('pointerleave', e => { setter(0); });
  };

  addTouch(left, v => { mSteer = -v; });
  addTouch(right, v => { mSteer = v; });
  addTouch(accel, v => { mThrottle = v; });
  addTouch(brake, v => { mBrake = v; });

  window.processMobileInput = () => {
    if (state.mode !== 'driving') return;
    input.steer = mSteer;
    input.throttle = mThrottle;
    input.brake = mBrake;
  };
}

// ==================== UI EVENT LISTENERS ====================
function setupUI() {
  document.getElementById('btn-showroom').addEventListener('click', showShowroom);
  document.getElementById('btn-track').addEventListener('click', startDriving);
  document.getElementById('btn-drive').addEventListener('click', startDriving);
  document.getElementById('btn-prev-car').addEventListener('click', () => {
    state.selectedCar = (state.selectedCar - 1 + TEAMS.length) % TEAMS.length;
    selectShowroomCar(state.selectedCar);
  });
  document.getElementById('btn-next-car').addEventListener('click', () => {
    state.selectedCar = (state.selectedCar + 1) % TEAMS.length;
    selectShowroomCar(state.selectedCar);
  });
  document.getElementById('btn-showroom-back').addEventListener('click', showMenu);
  document.getElementById('btn-pause').addEventListener('click', togglePause);
  document.getElementById('btn-resume').addEventListener('click', togglePause);
  document.getElementById('btn-quit').addEventListener('click', () => {
    document.getElementById('pause-menu').classList.add('hidden');
    showMenu();
  });
}

// ==================== GAME LOOP ====================
let lastTime = 0;
function gameLoop(time) {
  requestAnimationFrame(gameLoop);

  const dt = lastTime ? (time - lastTime) / 1000 : 0.016;
  lastTime = time;

  if (window.processInput) window.processInput();
  if (window.processMobileInput) window.processMobileInput();

  if (state.mode === 'driving') {
    updatePhysics(dt);
    updateCamera();
    updateHUD();
    updateMinimap();
  } else if (state.mode === 'showroom') {
    updateShowroomCamera();
  }

  renderer.render(scene, camera);
}

// ==================== RESIZE ====================
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ==================== INIT ====================
function init() {
  createTrack();
  setupInput();
  setupUI();

  // Hide loading, show menu after a brief delay
  setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
    showMenu();
  }, 800);

  requestAnimationFrame(gameLoop);
}

init();
