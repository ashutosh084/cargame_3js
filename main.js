import * as THREE from 'three';

// 1. Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 100, 200);

// 2. Camera and Renderer
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 3. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(20, 30, 0);
scene.add(dirLight);

// 4. Car
const car = new THREE.Group();
const wheelbase = 2.4;
scene.add(car);
car.rotation.y = Math.PI;

const carBody = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 4),
    new THREE.MeshLambertMaterial({ color: 0xff0000 })
);
carBody.position.y = 0.5;
car.add(carBody);

const carCabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.8, 2),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
);
carCabin.position.y = 1.4;
carCabin.position.z = -0.5;
car.add(carCabin);


// 5. Player Controls
const keys = {
    w: false,
    s: false,
    a: false,
    d: false,
};

window.addEventListener('keydown', (event) => {
    if (keys[event.key.toLowerCase()] !== undefined) {
        keys[event.key.toLowerCase()] = true;
    }
});

window.addEventListener('keyup', (event) => {
    if (keys[event.key.toLowerCase()] !== undefined) {
        keys[event.key.toLowerCase()] = false;
    }
});

// 6. Game Logic
const maxSpeed = 0.45;
const maxAcceleration = 0.001;
const brakeAcceleration = maxAcceleration * 2;
const friction = 0.999;
const inducedFrictionFactor = 0.005;
const maxFullTurnSpeed = 0.2;
let currentSpeed = 0;
let acceleration = 0;
let inducedFriction = 0;

let steeringAngle = 0;
const maxSteeringAngle = 30 * Math.PI / 180;
const minSteeringAngle = 5 * Math.PI / 180;
const steeringSpeed = maxSteeringAngle / 180;
const autoCenterSpeed = maxSteeringAngle / 30;

let effectiveMaxSteeringAngle = maxSteeringAngle;

// 7. Road Generation
const roadChunks = new Map();
const terrainChunks = new Map(); // New map for terrain chunks
const chunkSize = 50;
const roadWidth = 10;
const renderDistance = 10; // chunks ahead and behind
let currentChunkZ = 0;

let billboardData = [];
fetch('assets/billboard.json')
    .then(response => response.json())
    .then(data => {
        billboardData = data;
        init();
    });

const textureLoader = new THREE.TextureLoader();
const roadTexture = textureLoader.load('assets/road.jpg');
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, 10); // Repeat texture for road length
roadTexture.minFilter = THREE.LinearMipmapLinearFilter; // Ensure trilinear filtering
roadTexture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Enable anisotropic filtering

const barrierTexture = textureLoader.load('assets/barrier.jpg');
barrierTexture.wrapS = THREE.RepeatWrapping;
barrierTexture.wrapT = THREE.RepeatWrapping;
barrierTexture.repeat.set(10, 1); // Repeat texture for barrier length

const grassTexture = textureLoader.load('assets/grass.jpg'); // Assuming grass.jpg exists
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(50, 50); // Adjust repeat as needed

function createRoadChunk(zIndex) {
    const chunk = new THREE.Group();
    const chunkZ = zIndex * chunkSize;
    chunk.position.z = chunkZ;

    // Road surface
    const roadGeometry = new THREE.PlaneGeometry(roadWidth, chunkSize);
    const roadMaterial = new THREE.MeshLambertMaterial({ map: roadTexture });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    chunk.add(road);

    // Barriers
    const barrierHeight = 2;
    const barrierGeometry = new THREE.PlaneGeometry(chunkSize, barrierHeight);
    const barrierMaterial = new THREE.MeshLambertMaterial({ map: barrierTexture });

    const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    leftBarrier.position.x = -roadWidth / 2;
    leftBarrier.position.y = barrierHeight / 2;
    leftBarrier.rotation.y = Math.PI / 2;
    chunk.add(leftBarrier);

    const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    rightBarrier.position.x = roadWidth / 2;
    rightBarrier.position.y = barrierHeight / 2;
    rightBarrier.rotation.y = -Math.PI / 2;
    chunk.add(rightBarrier);

    chunk.barriers = [leftBarrier, rightBarrier];

    // Billboard
    spawnBillboardForChunk(chunk);

    scene.add(chunk);
    roadChunks.set(zIndex, chunk);
}

function createTerrainChunk(zIndex) { // New function for terrain chunks
    const terrainGroup = new THREE.Group();
    const chunkZ = zIndex * chunkSize;
    terrainGroup.position.z = chunkZ;

    const terrainSize = roadWidth * 10; // Make terrain wider than the road
    const terrainSegments = 10; // Fewer segments for performance, can be adjusted
    const terrainMaxHeight = 5; // Max height of hills, adjusted for scale

    const terrainGeometry = new THREE.PlaneGeometry(terrainSize, chunkSize, terrainSegments, terrainSegments);
    terrainGeometry.rotateX(-Math.PI / 2); // Rotate to be horizontal

    const positionAttribute = terrainGeometry.attributes.position;

    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const z = positionAttribute.getZ(i);

        // Simple noise function using sine waves and randomness
        const y = (Math.sin((x + chunkZ) * 0.1) * 0.5 + Math.cos((z + chunkZ) * 0.05) * 0.5 + Math.random() * 0.2) * terrainMaxHeight;
        positionAttribute.setY(i, y - terrainMaxHeight / 2); // Offset to keep terrain centered around 0
    }

    terrainGeometry.computeVertexNormals(); // Recalculate normals for lighting

    const terrainMaterial = new THREE.MeshLambertMaterial({ map: grassTexture });
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.position.y = -5; // Position below the road
    terrainGroup.add(terrain);

    scene.add(terrainGroup);
    terrainChunks.set(zIndex, terrainGroup);
}

function updateChunks() { // Renamed and updated to handle both road and terrain
    const newChunkZ = Math.round(car.position.z / chunkSize);
    if (newChunkZ !== currentChunkZ) {
        currentChunkZ = newChunkZ;

        const chunksToKeep = new Set();
        for (let i = currentChunkZ - renderDistance; i <= currentChunkZ + renderDistance; i++) {
            chunksToKeep.add(i);
        }

        // Update Road Chunks
        for (const zIndex of chunksToKeep) {
            if (!roadChunks.has(zIndex)) {
                createRoadChunk(zIndex);
            }
            if (!terrainChunks.has(zIndex)) { // Also create terrain chunk
                createTerrainChunk(zIndex);
            }
        }

        for (const [zIndex, chunk] of roadChunks.entries()) {
            if (!chunksToKeep.has(zIndex)) {
                scene.remove(chunk);
                roadChunks.delete(zIndex);
            }
        }

        // Update Terrain Chunks
        for (const [zIndex, chunk] of terrainChunks.entries()) {
            if (!chunksToKeep.has(zIndex)) {
                scene.remove(chunk);
                terrainChunks.delete(zIndex);
            }
        }
    }
}

// 8. Billboard Generation
function createTextTexture(title, content) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'black';
    context.font = 'bold 48px Arial';
    context.textAlign = 'center';
    context.fillText(title, canvas.width / 2, 80);

    let fontSize = 50;
    if (content.length > 15) {
        fontSize = 42;
    }
    if (content.length > 25) {
        fontSize = 34;
    }
    context.font = `${fontSize}px Arial`;
    context.fillText(content, canvas.width / 2, 160);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function spawnBillboardForChunk(chunk) {
    if (billboardData.length === 0) return;

    const billboardGroup = new THREE.Group();

    const pillarGeometry = new THREE.BoxGeometry(0.5, 15, 0.5); // Extended height
    const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.y = 2.5; // Adjusted position to sink into terrain
    billboardGroup.add(pillar);

    const displayAreaGeometry = new THREE.BoxGeometry(8, 4, 0.2);
    const displayAreaMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const displayArea = new THREE.Mesh(displayAreaGeometry, displayAreaMaterial);
    displayArea.position.y = 12;
    billboardGroup.add(displayArea);

    const data = billboardData[Math.floor(Math.random() * billboardData.length)];
    const textTexture = createTextTexture(data.title, data.content);
    const textMaterial = new THREE.MeshBasicMaterial({ map: textTexture, side: THREE.DoubleSide });
    const textGeometry = new THREE.PlaneGeometry(8, 4);
    const textPlane = new THREE.Mesh(textGeometry, textMaterial);
    textPlane.position.y = 12;
    textPlane.position.z = 0.11;
    billboardGroup.add(textPlane);
    billboardGroup.textPlane = textPlane;

    const side = Math.random() > 0.5 ? 1 : -1;
    billboardGroup.position.x = side * (roadWidth / 2 + 10);

    chunk.add(billboardGroup);
}


// 9. UI
let debugBox, speedometer, speedBars = [], speedText, steeringWheel;
const numberOfBars = 20;

function initUI() {
    if (import.meta.env.VITE_ENV === 'local') {
        debugBox = document.createElement('div');
        debugBox.style.position = 'absolute';
        debugBox.style.top = '10px';
        debugBox.style.left = '10px';
        debugBox.style.padding = '10px';
        debugBox.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        debugBox.style.color = 'white';
        debugBox.style.fontFamily = 'monospace';
        document.body.appendChild(debugBox);

        const title = document.createElement('h3');
        title.innerText = 'Debug Params';
        title.style.margin = '0 0 10px 0';
        title.style.padding = '0';
        debugBox.appendChild(title);
    }

    speedometer = document.createElement('div');
    speedometer.style.position = 'absolute';
    speedometer.style.bottom = '10px';
    speedometer.style.left = '10px';
    speedometer.style.display = 'flex';
    speedometer.style.alignItems = 'flex-end';
    document.body.appendChild(speedometer);

    for (let i = 0; i < numberOfBars; i++) {
        const bar = document.createElement('div');
        bar.style.width = '5px';
        bar.style.height = `${5 + i * 2}px`;
        bar.style.backgroundColor = 'grey';
        bar.style.marginRight = '2px';
        speedometer.appendChild(bar);
        speedBars.push(bar);
    }

    speedText = document.createElement('div');
    speedText.style.color = 'white';
    speedText.style.fontFamily = 'monospace';
    speedText.style.fontSize = '24px';
    speedText.style.marginLeft = '10px';
    speedometer.appendChild(speedText);

    steeringWheel = document.createElement('img');
    steeringWheel.src = 'assets/steering.png';
    steeringWheel.style.position = 'absolute';
    steeringWheel.style.bottom = '80px';
    steeringWheel.style.left = '10px';
    steeringWheel.style.width = '80px';
    steeringWheel.style.height = '80px';
    document.body.appendChild(steeringWheel);
}

// 10. Collision Detection
function checkCollisions() {
    const carBoundingBox = new THREE.Box3().setFromObject(car);

    const currentChunk = roadChunks.get(currentChunkZ);
    if (!currentChunk) return false;

    const chunksToCheck = [currentChunk];
    const prevChunk = roadChunks.get(currentChunkZ - 1);
    if (prevChunk) chunksToCheck.push(prevChunk);
    const nextChunk = roadChunks.get(currentChunkZ + 1);
    if (nextChunk) chunksToCheck.push(nextChunk);

    for (const chunk of chunksToCheck) {
        for (const barrier of chunk.barriers) {
            const barrierBoundingBox = new THREE.Box3().setFromObject(barrier);
            if (carBoundingBox.intersectsBox(barrierBoundingBox)) {
                return true;
            }
        }
    }

    return false;
}


// 11. Animation Loop
function animate() {
    requestAnimationFrame(animate);
    updateCar();
    updateChunks(); // Call the updated function
    renderer.render(scene, camera);
}

function init() {
    initUI();
    // Removed createTerrain() as it's now handled by createTerrainChunk
    for (let i = -renderDistance; i <= renderDistance; i++) {
        createRoadChunk(i);
        createTerrainChunk(i); // Create initial terrain chunks
    }
    animate();
}

function updateCar() {
    const previousPosition = car.position.clone();
    const previousRotation = car.rotation.clone();

    const speedRatio = Math.abs(currentSpeed) / maxSpeed;

    if (keys.w) {
        if (currentSpeed < 0) {
            acceleration = brakeAcceleration;
        } else {
            acceleration = maxAcceleration * (1 - speedRatio);
        }
        currentSpeed += acceleration;
    } else if (keys.s) {
        if (currentSpeed > 0) {
            acceleration = -brakeAcceleration;
        } else {
            acceleration = -maxAcceleration * (1 - speedRatio);
        }
        currentSpeed += acceleration;
    } else {
        currentSpeed *= friction;
        acceleration = 0;
    }

    let speedT = 0;
    if (Math.abs(currentSpeed) > maxFullTurnSpeed) {
        speedT = Math.min(1, (Math.abs(currentSpeed) - maxFullTurnSpeed) / (maxSpeed - maxFullTurnSpeed));
    }
    effectiveMaxSteeringAngle = maxSteeringAngle - (maxSteeringAngle - minSteeringAngle) * speedT;

    if (keys.a) {
        steeringAngle += steeringSpeed;
    } else if (keys.d) {
        steeringAngle -= steeringSpeed;
    } else {
        if (currentSpeed !== 0) {
            if (steeringAngle > 0) {
                steeringAngle -= autoCenterSpeed * (Math.abs(currentSpeed) / maxSpeed);
                if (steeringAngle < 0) steeringAngle = 0;
            } else if (steeringAngle < 0) {
                steeringAngle += autoCenterSpeed * (Math.abs(currentSpeed) / maxSpeed);
                if (steeringAngle > 0) steeringAngle = 0;
            }
        }
    }

    steeringAngle = Math.max(-effectiveMaxSteeringAngle, Math.min(effectiveMaxSteeringAngle, steeringAngle));

    if (currentSpeed !== 0 && currentSpeed !== acceleration) {
        const turnRatio = Math.abs(steeringAngle) / maxSteeringAngle;
        inducedFriction = turnRatio * inducedFrictionFactor;
        currentSpeed *= (1 - inducedFriction);
    } else {
        inducedFriction = 0;
    }

    currentSpeed = Math.max(-maxSpeed / 2, Math.min(maxSpeed, currentSpeed));

    if (Math.abs(currentSpeed) < 0.001) {
        currentSpeed = 0;
    }

    car.position.x += Math.sin(car.rotation.y) * currentSpeed;
    car.position.z += Math.cos(car.rotation.y) * currentSpeed;

    if (Math.abs(currentSpeed) > 0.01) {
        car.rotation.y += (currentSpeed / wheelbase) * Math.tan(steeringAngle);
    }

    if (checkCollisions()) {
        car.position.copy(previousPosition);
        car.rotation.copy(previousRotation);
        currentSpeed = 0;
    }

    const cameraOffset = new THREE.Vector3(0, 5, -10);
    cameraOffset.applyEuler(car.rotation);
    camera.position.copy(car.position).add(cameraOffset);
    camera.lookAt(car.position);

    if (debugBox) {
        debugBox.innerHTML = `<h3>Debug Params</h3>
            Steering Angle: ${(steeringAngle * 180 / Math.PI).toFixed(2)}°<br>
            Effective Max Angle: ${(effectiveMaxSteeringAngle * 180 / Math.PI).toFixed(2)}°<br>
            Speed: ${currentSpeed.toFixed(3)}<br>
            Acceleration: ${acceleration.toFixed(3)}<br>
            Induced Friction: ${inducedFriction.toFixed(4)}`;
    }

    const activeBars = Math.round(speedRatio * numberOfBars);
    const greenBars = Math.round(numberOfBars * 0.7);

    speedBars.forEach((bar, i) => {
        if (i < activeBars) {
            if (i < greenBars) {
                bar.style.backgroundColor = 'lime';
            } else {
                bar.style.backgroundColor = 'red';
            }
        } else {
            bar.style.backgroundColor = 'grey';
        }
    });

    const speedKmph = Math.round(speedRatio * 100);
    speedText.innerText = `${speedKmph} km/h`;

    const steeringRotation = -steeringAngle * (180 / Math.PI) * 5;
    steeringWheel.style.transform = `rotate(${steeringRotation}deg)`;
}

// ... (rest of the file is the same)