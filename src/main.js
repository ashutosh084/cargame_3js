import { scene, camera, renderer, dirLight } from './scene.js';
import { createCar, car } from './car.js';
import { setupKeyControls } from './controls.js';
import { updateCar } from './gameLogic.js';
import { updateChunks, createRoadChunk, createTerrainChunk, renderDistance } from './road.js';
import { loadBillboardData } from './billboard.js';
import { initUI } from './ui.js';

let lightCycleTime = 0;
const lightMovementDuration = 60; // seconds
const lightOffDuration = 60; // seconds
const lightCycleDuration = lightMovementDuration + lightOffDuration;
let lastFrameTime = 0;

function animate(currentTime) {
    requestAnimationFrame(animate);

    if (!lastFrameTime) {
        lastFrameTime = currentTime;
    }
    const deltaTime = (currentTime - lastFrameTime) / 1000; // convert to seconds
    lastFrameTime = currentTime;

    updateCar();
    updateChunks();

    // Update shadow camera to follow the car
    // dirLight.position.z = car.position.z - 50; // Keep light source behind and above car
    // dirLight.target.position.z = car.position.z; // Make light target the car's current Z position
    dirLight.target.updateMatrixWorld(); // Important for the target to update

    // Update light cycle time
    lightCycleTime = (lightCycleTime + deltaTime) % lightCycleDuration;
    console.log('Light cycle time:', lightCycleTime)
    if (lightCycleTime < lightMovementDuration) {
        console.log('Light is in movement phase')
        // Light is in movement phase
        const progress = lightCycleTime / lightMovementDuration;

        // X-direction: +50 to -50 (sin wave from 0 to PI)
        dirLight.position.x = 50 * Math.cos(progress * Math.PI);

        // Y-direction: 0 to 50 to 0 (sin wave from 0 to PI, then PI to 2PI)
        // This will make it go from 0 to 50 and back to 0 over the movement duration
        dirLight.position.y = 50 * Math.sin(progress * Math.PI);

        dirLight.intensity = 1; // Light is on
        console.log('Light position:', dirLight.position)
    } else {
        console.log('Light is in off phase')
        // Light is in off phase
        dirLight.intensity = 0; // Light is off
    }

    renderer.render(scene, camera);
}

async function init() {
    setupKeyControls();
    initUI();
    scene.add(createCar());
    await loadBillboardData();

    for (let i = -renderDistance; i <= renderDistance; i++) {
        createRoadChunk(i, camera);
        createTerrainChunk(i);
    }
    requestAnimationFrame(animate);
}

init();
