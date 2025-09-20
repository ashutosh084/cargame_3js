import * as THREE from 'three';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 100, 200);

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
export const renderer = new THREE.WebGLRenderer({ antialias: true });

const dayAmbientSound = new Audio('assets/outside-day.mp3');
const nightAmbientSound = new Audio('assets/outside-night.mp3');
export const carAmbientSound = new Audio('assets/driving.mp3');

dayAmbientSound.loop = true;
nightAmbientSound.loop = true;
carAmbientSound.loop = true;

dayAmbientSound.volume = 0;
nightAmbientSound.volume = 0;
carAmbientSound.volume = 0;

// Function to start audio playback
function startAmbientSounds() {
    dayAmbientSound.play().catch(e => console.error("Error playing day ambient sound:", e));
    nightAmbientSound.play().catch(e => console.error("Error playing night ambient sound:", e));
    carAmbientSound.play().catch(e => console.error("Error playing car ambient sound:", e));

    // Remove the event listener after the first interaction
    document.body.removeEventListener('click', startAmbientSounds);
    document.body.removeEventListener('keydown', startAmbientSounds);
}

// Add event listeners to start audio on user interaction
document.body.addEventListener('click', startAmbientSounds);
document.body.addEventListener('keydown', startAmbientSounds);

const FADE_DURATION = 2000; // milliseconds
const FADE_INTERVAL = 50; // milliseconds
const MAX_VOLUME = 0.5; // Adjust as needed

let currentFadeInterval = null;

export function updateSky(isNight) {

    const targetDayVolume = isNight ? 0 : MAX_VOLUME;
    const targetNightVolume = isNight ? MAX_VOLUME : 0;
    console.log(dayAmbientSound.volume, nightAmbientSound.volume)

    let setCurrentFadeTimeout = (dayAmbientSound,
        nightAmbientSound,
        isNight,
        MAX_VOLUME,
        FADE_DURATION,
        FADE_INTERVAL,
    ) => setTimeout(() => {
        const dayVolumeStep = (targetDayVolume - dayAmbientSound.volume) / (FADE_DURATION / FADE_INTERVAL);
        const nightVolumeStep = (targetNightVolume - nightAmbientSound.volume) / (FADE_DURATION / FADE_INTERVAL);

        dayAmbientSound.volume += dayVolumeStep;
        nightAmbientSound.volume += nightVolumeStep;

        dayAmbientSound.volume = Math.max(0, Math.min(MAX_VOLUME, dayAmbientSound.volume));
        nightAmbientSound.volume = Math.max(0, Math.min(MAX_VOLUME, nightAmbientSound.volume));

        console.log('Day Volume:', dayAmbientSound.volume, 'Night Volume:', nightAmbientSound.volume);

        if (
            (isNight && Math.ceil(nightAmbientSound.volume) >= MAX_VOLUME && Math.floor(dayAmbientSound.volume) <= 0) ||
            (!isNight && Math.ceil(dayAmbientSound.volume) >= MAX_VOLUME && Math.floor(nightAmbientSound.volume) <= 0)
        ) {

        } else {
            setCurrentFadeTimeout(
                dayAmbientSound,
                nightAmbientSound,
                isNight,
                MAX_VOLUME,
                FADE_DURATION,
                FADE_INTERVAL,
                dayVolumeStep,
                nightVolumeStep
            )
        }
    }, FADE_INTERVAL);

    setCurrentFadeTimeout(
        dayAmbientSound,
        nightAmbientSound,
        isNight,
        MAX_VOLUME,
        FADE_DURATION,
        FADE_INTERVAL
    );


    if (isNight) {
        scene.background = new THREE.Color(0x000000); // Night sky color
        scene.fog.color.set(0x000000);
    } else {
        scene.background = new THREE.Color(0x87CEEB); // Day sky color
        scene.fog.color.set(0x87CEEB);
    }
}

// Initial call to set the correct ambient sound based on initial state (assuming day initially)
updateSky(false);


renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true; // Enable shadow maps
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Optional: for softer shadows

const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);
export const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(-50, 50, -50); // Adjusted Y position for better shadows
dirLight.castShadow = true; // Enable shadow casting for the directional light

// Configure shadow camera for better shadow quality
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 1000;
dirLight.shadow.camera.left = -100;
dirLight.shadow.camera.right = 100;
dirLight.shadow.camera.top = 100;
dirLight.shadow.camera.bottom = -100;
scene.add(dirLight);
