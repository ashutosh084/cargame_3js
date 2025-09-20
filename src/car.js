import * as THREE from 'three';

export const car = new THREE.Group();
export const wheelbase = 2.4;

// Geometric Brake Light Materials
const dullRed = 0x880000; // Dull red color
const brightRed = 0xff0000; // Bright red color
export const leftBrakeLightMaterial = new THREE.MeshLambertMaterial({ color: dullRed });
export const rightBrakeLightMaterial = new THREE.MeshLambertMaterial({ color: dullRed });

// Reverse Light Materials
const dullWhite = 0xcccccc; // Dull white/amber color
const brightWhite = 0xffffff; // Bright white color
export const leftReverseLightMaterial = new THREE.MeshLambertMaterial({ color: dullWhite });
export const rightReverseLightMaterial = new THREE.MeshLambertMaterial({ color: dullWhite });

// Point Lights for Brake Lights (still needed for actual light emission)
const brakeLightColor = 0xff0000;
const brakeLightIntensity = 0; // Initially off
const brakeLightDistance = 5;
export const leftBrakeLight = new THREE.PointLight(brakeLightColor, brakeLightIntensity, brakeLightDistance);
export const rightBrakeLight = new THREE.PointLight(brakeLightColor, brakeLightIntensity, brakeLightDistance);

// Point Lights for Reverse Lights
const reverseLightColor = 0xffffff;
const reverseLightIntensity = 0; // Initially off
const reverseLightDistance = 5;
export const leftReverseLight = new THREE.PointLight(reverseLightColor, reverseLightIntensity, reverseLightDistance);
export const rightReverseLight = new THREE.PointLight(reverseLightColor, reverseLightIntensity, reverseLightDistance);

export function createCar() {
    const carBody = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1, 4),
        new THREE.MeshLambertMaterial({ color: 0xff0000 })
    );
    carBody.position.y = 0.5;
    carBody.castShadow = true;    // Enable casting shadows
    carBody.receiveShadow = true; // Enable receiving shadows
    car.add(carBody);

    const carCabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.8, 2),
        new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    carCabin.position.y = 1.4;
    carCabin.position.z = -0.5;
    carCabin.castShadow = true;    // Enable casting shadows
    carCabin.receiveShadow = true; // Enable receiving shadows
    car.add(carCabin);

    // Geometric Brake Light Meshes
    const brakeLightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1); // Small box for brake light

    const leftBrakeLightMesh = new THREE.Mesh(brakeLightGeometry, leftBrakeLightMaterial);
    leftBrakeLightMesh.position.set(-0.7, 0.5, -2.05); // Position at rear, slightly behind car body
    leftBrakeLightMesh.castShadow = true;
    leftBrakeLightMesh.receiveShadow = true;
    car.add(leftBrakeLightMesh);

    const rightBrakeLightMesh = new THREE.Mesh(brakeLightGeometry, rightBrakeLightMaterial);
    rightBrakeLightMesh.position.set(0.7, 0.5, -2.05); // Position at rear, slightly behind car body
    rightBrakeLightMesh.castShadow = true;
    rightBrakeLightMesh.receiveShadow = true;
    car.add(rightBrakeLightMesh);

    // Geometric Reverse Light Meshes
    const reverseLightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1); // Small box for reverse light

    const leftReverseLightMesh = new THREE.Mesh(reverseLightGeometry, leftReverseLightMaterial);
    leftReverseLightMesh.position.set(-0.7, 0.7, -2.05); // Position at rear, slightly above brake lights
    leftReverseLightMesh.castShadow = true;
    leftReverseLightMesh.receiveShadow = true;
    car.add(leftReverseLightMesh);

    const rightReverseLightMesh = new THREE.Mesh(reverseLightGeometry, rightReverseLightMaterial);
    rightReverseLightMesh.position.set(0.7, 0.7, -2.05); // Position at rear, slightly above brake lights
    rightReverseLightMesh.castShadow = true;
    rightReverseLightMesh.receiveShadow = true;
    car.add(rightReverseLightMesh);

    // Headlights
    const headlightColor = 0xffffff;
    const headlightIntensity = 10;
    const headlightDistance = 100;
    const headlightAngle = Math.PI / 2;
    const headlightPenumbra = 0.5;

    const leftHeadlight = new THREE.SpotLight(headlightColor, headlightIntensity, headlightDistance, headlightAngle, headlightPenumbra);
    leftHeadlight.position.set(-0.7, 0.5, 2); // Position relative to car
    leftHeadlight.target.position.set(-0.7, 0.5, 10); // Target slightly in front
    car.add(leftHeadlight);
    car.add(leftHeadlight.target); // Add target to car group so it moves with the car

    const rightHeadlight = new THREE.SpotLight(headlightColor, headlightIntensity, headlightDistance, headlightAngle, headlightPenumbra);
    rightHeadlight.position.set(0.7, 0.5, 2); // Position relative to car
    rightHeadlight.target.position.set(0.7, 0.5, 10); // Target slightly in front
    car.add(rightHeadlight);
    car.add(rightHeadlight.target); // Add target to car group



    leftBrakeLight.position.set(-0.7, 0.5, -3); // Position relative to car
    car.add(leftBrakeLight);

    rightBrakeLight.position.set(0.7, 0.5, -3); // Position relative to car
    car.add(rightBrakeLight);

    leftReverseLight.position.set(-0.7, 0.7, -3); // Position relative to car
    car.add(leftReverseLight);

    rightReverseLight.position.set(0.7, 0.7, -3); // Position relative to car
    car.add(rightReverseLight);

    car.position.x = +2.5; // Position car on the left lane
    // car.rotation.y = Math.PI;
    return car;
}
