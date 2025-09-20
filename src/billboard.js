import * as THREE from 'three';
import { scene } from './scene.js';
import { roadWidth } from './road.js';

export let billboardData = [];

export async function loadBillboardData() {
    const response = await fetch('assets/billboard.json');
    billboardData = await response.json();
}

function createTextTexture(title, content) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'black';
    context.font = 'bold 40px Arial';
    context.textAlign = 'center';
    context.fillText(title, canvas.width / 2, 50);

    let fontSize = 50;
    if (content.length > 15) {
        fontSize = 42;
    }
    if (content.length > 25) {
        fontSize = 34;
    }
    context.font = `${fontSize}px Arial`;
    const lines = content.split('\n');
    let startY = 160 - (lines.length - 1) * (fontSize / 2 + 5); // Adjust startY to center multiple lines
    for (let i = 0; i < lines.length; i++) {
        context.fillText(lines[i], canvas.width / 2, startY + i * (fontSize + 10));
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

let index = -10;

export function spawnBillboardForChunk(chunk, camera) {
    if (billboardData.length === 0) return;

    const billboardGroup = new THREE.Group();

    const pillarGeometry = new THREE.BoxGeometry(0.5, 15, 0.5);
    const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.y = 1;
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    billboardGroup.add(pillar);

    const displayAreaGeometry = new THREE.BoxGeometry(20, 8, 0.2);
    const displayAreaMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const displayArea = new THREE.Mesh(displayAreaGeometry, displayAreaMaterial);
    displayArea.position.y = 12;
    displayArea.castShadow = true;
    displayArea.receiveShadow = true;
    billboardGroup.add(displayArea);

    const data = billboardData[index < 0 ? 0 : index];
    index++;
    if (index >= billboardData.length) {
        index = 0;
    }
    const textTexture = createTextTexture(data.title, data.content);
    const textMaterial = new THREE.MeshBasicMaterial({ map: textTexture, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const textGeometry = new THREE.PlaneGeometry(20, 8);
    const textPlane = new THREE.Mesh(textGeometry, textMaterial);
    textPlane.position.y = 12;
    textPlane.position.z = 0.11;
    billboardGroup.add(textPlane);

    const oopsTexture = createTextTexture("OOPS", "NOTHING HERE,\n TURN AROUND GO AHEAD");
    const oopsMaterial = new THREE.MeshBasicMaterial({ map: oopsTexture, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const oopsGeometry = new THREE.PlaneGeometry(20, 8);
    const oopsPlane = new THREE.Mesh(oopsGeometry, oopsMaterial);
    oopsPlane.position.y = 12;
    oopsPlane.position.z = -0.11;
    oopsPlane.rotation.y = Math.PI;
    billboardGroup.add(oopsPlane);

    billboardGroup.textPlane = textPlane;

    const side = Math.random() > 0.5 ? 1 : -1;
    billboardGroup.position.x = side * (roadWidth / 2 + 10);
    billboardGroup.rotation.y = Math.PI;

    chunk.add(billboardGroup);
}
