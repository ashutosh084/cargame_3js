import * as THREE from 'three';

// 1. Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// 2. Camera Setup (Perspective View)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, -10);
camera.lookAt(0, 0, 0);

// 3. Renderer Setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 30, 0);
scene.add(dirLight);

// 5. Ground Plane
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// 6. Car
const car = new THREE.Group();
const wheelbase = 2.4;
scene.add(car);

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


// 7. Billboards
const billboards = [];
const worldSize = 450;
let billboardData = [];

// Function to create a texture with text
function createTextTexture(title, content) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'black';
    context.font = 'bold 64px Arial';
    context.textAlign = 'center';
    context.fillText(title, canvas.width / 2, 100);

    let fontSize = 48;
    if (content.length > 15) {
        fontSize = 40;
    }
    if (content.length > 25) {
        fontSize = 32;
    }
    context.font = `${fontSize}px Arial`;
    context.fillText(content, canvas.width / 2, 180);

    return new THREE.CanvasTexture(canvas);
}

function spawnBillboard() {
    if (billboardData.length === 0) return;

    const billboardGroup = new THREE.Group();

    // Pillar
    const pillarGeometry = new THREE.BoxGeometry(1, 20, 1);
    const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.y = 10;
    billboardGroup.add(pillar);

    // Display Area
    const displayAreaGeometry = new THREE.BoxGeometry(16, 8, 0.4);
    const displayAreaMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const displayArea = new THREE.Mesh(displayAreaGeometry, displayAreaMaterial);
    displayArea.position.y = 24;
    billboardGroup.add(displayArea);

    // Text
    const data = billboardData[Math.floor(Math.random() * billboardData.length)];
    const textTexture = createTextTexture(data.title, data.content);
    const textMaterial = new THREE.MeshBasicMaterial({ map: textTexture });
    const textGeometry = new THREE.PlaneGeometry(16, 8);
    const textPlane = new THREE.Mesh(textGeometry, textMaterial);
    textPlane.position.y = 24;
    textPlane.position.z = 0.21; // Slightly in front of the display area
    billboardGroup.add(textPlane);


    billboardGroup.position.x = (Math.random() - 0.5) * worldSize;
    billboardGroup.position.z = (Math.random() - 0.5) * worldSize;

    scene.add(billboardGroup);
    billboards.push(billboardGroup);
}

// Load billboard data and spawn billboards
fetch('assets/billboard.json')
    .then(response => response.json())
    .then(data => {
        billboardData = data;
        for (let i = 0; i < 100; i++) {
            spawnBillboard();
        }
    });


// 8. Player Controls
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

// 9. Game Logic
const maxSpeed = 0.45;
const maxAcceleration = 0.001;
const brakeAcceleration = maxAcceleration * 5;
const friction = 0.999;
const inducedFrictionFactor = 0.005;
const maxFullTurnSpeed = 0.2;
let currentSpeed = 0;
let acceleration = 0;
let inducedFriction = 0;

let steeringAngle = 0;
const maxSteeringAngle = 30 * Math.PI / 180; // 30 degrees in radians
const minSteeringAngle = 5 * Math.PI / 180; // 5 degrees in radians
const steeringSpeed = maxSteeringAngle / 180;
const autoCenterSpeed = maxSteeringAngle / 30;

let effectiveMaxSteeringAngle = maxSteeringAngle;

// 10. UI
let debugBox;
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

const speedometer = document.createElement('div');
speedometer.style.position = 'absolute';
speedometer.style.bottom = '10px';
speedometer.style.left = '10px';
speedometer.style.display = 'flex';
speedometer.style.alignItems = 'flex-end';
document.body.appendChild(speedometer);

const speedBars = [];
const numberOfBars = 20;
for (let i = 0; i < numberOfBars; i++) {
    const bar = document.createElement('div');
    bar.style.width = '5px';
    bar.style.height = `${5 + i * 2}px`;
    bar.style.backgroundColor = 'grey';
    bar.style.marginRight = '2px';
    speedometer.appendChild(bar);
    speedBars.push(bar);
}

const speedText = document.createElement('div');
speedText.style.color = 'white';
speedText.style.fontFamily = 'monospace';
speedText.style.fontSize = '24px';
speedText.style.marginLeft = '10px';
speedometer.appendChild(speedText);

// Steering wheel UI
const steeringWheel = document.createElement('img');
// Make sure you have the steering.png file in the assets folder
steeringWheel.src = 'assets/steering.png';
steeringWheel.style.position = 'absolute';
steeringWheel.style.bottom = '80px'; // Position above the speedometer
steeringWheel.style.left = '10px';
steeringWheel.style.width = '80px';
steeringWheel.style.height = '80px';
document.body.appendChild(steeringWheel);


function updateCar() {
    const previousPosition = car.position.clone();
    const previousRotation = car.rotation.clone();

    // Speed and movement with inertia
    const speedRatio = Math.abs(currentSpeed) / maxSpeed;

    if (keys.w) {
        if (currentSpeed < 0) { // Braking while moving backward
            acceleration = brakeAcceleration;
        } else { // Accelerating forward
            acceleration = maxAcceleration * (1 - speedRatio);
        }
        currentSpeed += acceleration;
    } else if (keys.s) {
        if (currentSpeed > 0) { // Braking while moving forward
            acceleration = -brakeAcceleration;
        } else { // Accelerating backward
            acceleration = -maxAcceleration * (1 - speedRatio);
        }
        currentSpeed += acceleration;
    } else {
        currentSpeed *= friction;
        acceleration = 0;
    }

    // Steering
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
        // Auto-center steering
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

    // Induced friction from steering
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

    // Update camera to follow the car from behind
    const cameraOffset = new THREE.Vector3(0, 5, -10);
    cameraOffset.applyEuler(car.rotation);
    camera.position.copy(car.position).add(cameraOffset);
    camera.lookAt(car.position);

    // Make billboards face the camera
    billboards.forEach(billboard => {
        billboard.lookAt(camera.position);
    });

    // Update debug UI
    if (debugBox) {
        debugBox.innerHTML = `<h3>Debug Params</h3>
            Steering Angle: ${(steeringAngle * 180 / Math.PI).toFixed(2)}°<br>
            Effective Max Angle: ${(effectiveMaxSteeringAngle * 180 / Math.PI).toFixed(2)}°<br>
            Speed: ${currentSpeed.toFixed(3)}<br>
            Acceleration: ${acceleration.toFixed(3)}<br>
            Induced Friction: ${inducedFriction.toFixed(4)}`;
    }

    // Update speedometer
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

    // Update steering wheel rotation
    const steeringRotation = -steeringAngle * (180 / Math.PI) * 5; // Multiplier for visual effect
    steeringWheel.style.transform = `rotate(${steeringRotation}deg)`;
}

function checkCollisions() {
    const carBoundingBox = new THREE.Box3().setFromObject(car);

    for (const billboard of billboards) {
        const billboardBoundingBox = new THREE.Box3().setFromObject(billboard);
        if (carBoundingBox.intersectsBox(billboardBoundingBox)) {
            return true;
        }
    }
    return false;
}

// 11. Animation Loop
function animate() {
    requestAnimationFrame(animate);

    updateCar();

    renderer.render(scene, camera);
}

animate();

// 12. Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});