import { scene, camera, renderer, dirLight, updateSky } from './scene.js';
import { createCar, car, leftBrakeLight, rightBrakeLight } from './car.js';
import { setupKeyControls } from './controls.js';
import { updateCar, currentSpeed } from './gameLogic.js';
import { updateChunks, createRoadChunk, createTerrainChunk, renderDistance, starsChunks } from './road.js';
import { loadBillboardData } from './billboard.js';
import { initUI } from './ui.js';
import { AudioListener, AudioLoader, PositionalAudio } from 'three';

let lightCycleTime = 0;
const lightMovementDuration = 30; // seconds
const lightOffDuration = 30; // seconds
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
    dirLight.position.z = car.position.z - 50; // Keep light source behind and above car
    dirLight.position.y = 50; // Keep light source high enough
    dirLight.target.position.z = car.position.z; // Make light target the car's current Z position
    dirLight.target.updateMatrixWorld(); // Important for the target to update

    // Update light cycle time
    lightCycleTime = (lightCycleTime + deltaTime) % lightCycleDuration;
    if (lightCycleTime < lightMovementDuration) {
        // Light is in movement phase (day)
        const progress = lightCycleTime / lightMovementDuration;

        // X-direction: +50 to -50 (sin wave from 0 to PI)
        dirLight.position.x = car.position.x + 100 * Math.cos(progress * Math.PI);

        // Y-direction: 0 to 50 to 0 (sin wave from 0 to PI, then PI to 2PI)
        // We are keeping Y fixed at 50 for consistent shadows
        dirLight.position.y = car.position.y + 50 * Math.sin(progress * Math.PI);

        dirLight.intensity = 1; // Light is on
        updateSky(false); // Day sky

        // Hide stars during the day
        starsChunks.forEach(starsGroup => {
            starsGroup.children[0].visible = false;
        });
    } else {
        // Light is in off phase (night)
        dirLight.intensity = 0; // Keep light on for consistent shadows
        updateSky(true); // Night sky

        leftBrakeLight.intensity = 1; // Adjust intensity as needed
        rightBrakeLight.intensity = 1; // Adjust intensity as needed

        // Show stars during the night
        starsChunks.forEach(starsGroup => {
            starsGroup.children[0].visible = true;
        });
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
