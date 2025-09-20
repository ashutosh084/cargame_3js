import * as THREE from 'three';
import { car, wheelbase, leftBrakeLight, rightBrakeLight, leftBrakeLightMaterial, rightBrakeLightMaterial, leftReverseLight, rightReverseLight, leftReverseLightMaterial, rightReverseLightMaterial } from './car.js';
import { keys } from './controls.js';
import { camera, carAmbientSound } from './scene.js';
import { checkCollisions } from './collisions.js';
import { debugBox, speedBars, speedText, steeringWheel, numberOfBars } from './ui.js';

export const maxSpeed = 0.90;
export const maxAcceleration = 0.001;
export const brakeAcceleration = maxAcceleration * 2;
export const friction = 0.999;
export const inducedFrictionFactor = 0.005;
export const maxFullTurnSpeed = 0.2;
export let currentSpeed = 0;
export let acceleration = 0;
export let inducedFriction = 0;

let firstPress = false;

export let steeringAngle = 0;
export const maxSteeringAngle = 30 * Math.PI / 180;
export const minSteeringAngle = 5 * Math.PI / 180;
export const steeringSpeed = maxSteeringAngle / 180;
export const autoCenterSpeed = maxSteeringAngle / 30;

export let effectiveMaxSteeringAngle = maxSteeringAngle;

export function updateCar() {
    const previousPosition = car.position.clone();
    const previousRotation = car.rotation.clone();

    const speedRatio = Math.abs(currentSpeed) / maxSpeed;

    if (keys.w || (!firstPress && currentSpeed < 0.25)) {
        if (keys.w) {
            firstPress = true;
        }
        if (currentSpeed < 0) {
            acceleration = brakeAcceleration;
        } else {
            acceleration = maxAcceleration * (1 - speedRatio);
        }
        currentSpeed += acceleration;
    } else if (keys.s) {
        firstPress = true;
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
        firstPress = true;
        steeringAngle += steeringSpeed;
    } else if (keys.d) {
        firstPress = true;
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
    if (Math.abs(currentSpeed) > 0.2) {
        carAmbientSound.volume = 0.5;
    } else if (Math.abs(currentSpeed) < 0.2 && Math.abs(currentSpeed) > 0.05) {
        carAmbientSound.volume = 0.2;
    } else if (Math.abs(currentSpeed) < 0.05) {
        carAmbientSound.volume = 0.1;
    }


    if (checkCollisions()) {
        car.position.copy(previousPosition);
        car.rotation.copy(previousRotation);
        currentSpeed = 0;
    }

    const dullRed = 0x880000; // Dull red color
    const brightRed = 0xff0000; // Bright red color

    if (keys.s && currentSpeed > 0) {
        leftBrakeLight.intensity = 1; // Adjust intensity as needed
        rightBrakeLight.intensity = 1; // Adjust intensity as needed
        leftBrakeLightMaterial.color.set(brightRed);
        rightBrakeLightMaterial.color.set(brightRed);
    } else {
        leftBrakeLight.intensity = 0;
        rightBrakeLight.intensity = 0;
        leftBrakeLightMaterial.color.set(dullRed);
        rightBrakeLightMaterial.color.set(dullRed);
    }

    const dullWhite = 0xcccccc; // Dull white/amber color
    const brightWhite = 0xffffff; // Bright white color

    if (currentSpeed < 0) {
        leftBrakeLight.intensity = 0;
        rightBrakeLight.intensity = 0;
        leftBrakeLightMaterial.color.set(dullRed);
        rightBrakeLightMaterial.color.set(dullRed);
        leftReverseLight.intensity = 1;
        rightReverseLight.intensity = 1;
        leftReverseLightMaterial.color.set(brightWhite);
        rightReverseLightMaterial.color.set(brightWhite);
    } else {
        leftReverseLight.intensity = 0;
        rightReverseLight.intensity = 0;
        leftReverseLightMaterial.color.set(dullWhite);
        rightReverseLightMaterial.color.set(dullWhite);
    }

    const cameraOffset = new THREE.Vector3(0, 4, -15);
    cameraOffset.applyEuler(car.rotation);
    camera.position.copy(car.position).add(cameraOffset);

    // Calculate the lookAt target
    const lookAtTargetOffset = new THREE.Vector3(0, 0, 5);
    lookAtTargetOffset.applyEuler(car.rotation);
    const lookAtPoint = car.position.clone().add(lookAtTargetOffset);

    // Adjust the y-coordinate of the lookAtPoint to achieve a 30-degree upward angle
    const horizontalDist = camera.position.distanceTo(new THREE.Vector3(lookAtPoint.x, camera.position.y, lookAtPoint.z));
    lookAtPoint.y = camera.position.y + horizontalDist * Math.tan(15 * Math.PI / 180);

    camera.lookAt(lookAtPoint);


    if (debugBox) {
        debugBox.innerHTML = `<h3>Debug Params</h3>\n            Steering Angle: ${(steeringAngle * 180 / Math.PI).toFixed(2)}°<br>\n            Effective Max Angle: ${(effectiveMaxSteeringAngle * 180 / Math.PI).toFixed(2)}°<br>\n            Speed: ${currentSpeed.toFixed(3)}<br>\n            Acceleration: ${acceleration.toFixed(3)}<br>\n            Induced Friction: ${inducedFriction.toFixed(4)}`;
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
