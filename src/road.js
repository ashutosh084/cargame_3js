import * as THREE from 'three';
import { scene, renderer } from './scene.js';
import { car } from './car.js';
import { spawnBillboardForChunk } from './billboard.js';

export const roadChunks = new Map();
export const terrainChunks = new Map();
export const chunkSize = 50;
export const roadWidth = 10;
export const renderDistance = 10;
export let currentChunkZ = 0;

const textureLoader = new THREE.TextureLoader();
const roadTexture = textureLoader.load('assets/road.jpg');
roadTexture.wrapS = THREE.RepeatWrapping;
roadTexture.wrapT = THREE.RepeatWrapping;
roadTexture.repeat.set(1, 10);
roadTexture.minFilter = THREE.LinearMipmapLinearFilter;
roadTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const barrierTexture = textureLoader.load('assets/barrier.jpg');
barrierTexture.wrapS = THREE.RepeatWrapping;
barrierTexture.wrapT = THREE.RepeatWrapping;
barrierTexture.repeat.set(10, 1);

const grassTexture = textureLoader.load('assets/grass.jpg');
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(50, 50);

const bushTexture = textureLoader.load('assets/bush.jpg');
bushTexture.transparent = true;

function createBush() {
    const bushGroup = new THREE.Group();
    const bushSize = 3; // Size of the bush planes

    const bushGeometry = new THREE.PlaneGeometry(bushSize, bushSize);
    const bushMaterial = new THREE.MeshLambertMaterial({
        map: bushTexture,
        transparent: true,
        alphaTest: 0.5, // Adjust as needed for transparency
        side: THREE.DoubleSide
    });

    const plane1 = new THREE.Mesh(bushGeometry, bushMaterial);
    plane1.castShadow = true;
    plane1.receiveShadow = true;
    bushGroup.add(plane1);

    const plane2 = new THREE.Mesh(bushGeometry, bushMaterial);
    plane2.rotation.y = Math.PI / 2; // Rotate by 90 degrees
    plane2.castShadow = true;
    plane2.receiveShadow = true;
    bushGroup.add(plane2);

    return bushGroup;
}

export function createRoadChunk(zIndex, camera) {
    const chunk = new THREE.Group();
    const chunkZ = zIndex * chunkSize;
    chunk.position.z = chunkZ;

    const roadGeometry = new THREE.PlaneGeometry(roadWidth, chunkSize);
    const roadMaterial = new THREE.MeshLambertMaterial({ map: roadTexture });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    chunk.add(road);

    const barrierHeight = 2;
    const barrierGeometry = new THREE.PlaneGeometry(chunkSize, barrierHeight);
    const barrierMaterial = new THREE.MeshLambertMaterial({ map: barrierTexture });

    const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    leftBarrier.position.x = -roadWidth / 2;
    leftBarrier.position.y = barrierHeight / 2;
    leftBarrier.rotation.y = Math.PI / 2;
    leftBarrier.castShadow = true;
    leftBarrier.receiveShadow = true;
    chunk.add(leftBarrier);

    const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    rightBarrier.position.x = roadWidth / 2;
    rightBarrier.position.y = barrierHeight / 2;
    rightBarrier.rotation.y = -Math.PI / 2;
    rightBarrier.castShadow = true;
    rightBarrier.receiveShadow = true;
    chunk.add(rightBarrier);

    chunk.barriers = [leftBarrier, rightBarrier];

    spawnBillboardForChunk(chunk, camera);

    scene.add(chunk);
    roadChunks.set(zIndex, chunk);
}

export function createTerrainChunk(zIndex) {
    const terrainGroup = new THREE.Group();
    const chunkZ = zIndex * chunkSize;
    terrainGroup.position.z = chunkZ;

    const terrainSize = roadWidth * 50;
    const terrainSegments = 10;
    const terrainMaxHeight = 5;

    const terrainGeometry = new THREE.PlaneGeometry(terrainSize, chunkSize, terrainSegments, terrainSegments);
    terrainGeometry.rotateX(-Math.PI / 2);

    const positionAttribute = terrainGeometry.attributes.position;

    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const z = positionAttribute.getZ(i);

        const y = (Math.sin((x + chunkZ) * 0.1) * 0.5 + Math.cos((z + chunkZ) * 0.05) * 0.5) * terrainMaxHeight;
        positionAttribute.setY(i, y - terrainMaxHeight / 2);
    }

    terrainGeometry.computeVertexNormals();

    const terrainMaterial = new THREE.MeshLambertMaterial({ map: grassTexture });
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.position.y = -5;
    terrain.receiveShadow = true;
    terrainGroup.add(terrain);

    // Add bushes
    const numberOfBushes = 15;
    const halfTerrainSize = terrainSize / 2;
    const bushSize = 3; // Define bushSize here for bushHeight calculation
    const bushHeight = bushSize; // Assuming bushSize is the height of the plane

    for (let i = 0; i < numberOfBushes; i++) {
        const randomX = (Math.random() * terrainSize) - halfTerrainSize;
        const randomZ = (Math.random() * chunkSize) - (chunkSize / 2);

        // Calculate terrain Y at this (randomX, randomZ)
        const terrainY = ((Math.sin((randomX + chunkZ) * 0.1) * 0.5 + Math.cos((randomZ + chunkZ) * 0.05) * 0.5) * terrainMaxHeight - terrainMaxHeight / 2) - 5;

        const bush = createBush();
        bush.position.set(randomX, terrainY + bushHeight + terrain.position.y, randomZ); // Position on terrain surface
        terrainGroup.add(bush);
    }

    scene.add(terrainGroup);
    terrainChunks.set(zIndex, terrainGroup);
}

export function updateChunks() {
    const newChunkZ = Math.round(car.position.z / chunkSize);
    if (newChunkZ !== currentChunkZ) {
        currentChunkZ = newChunkZ;

        const chunksToKeep = new Set();
        for (let i = currentChunkZ - renderDistance; i <= currentChunkZ + renderDistance; i++) {
            chunksToKeep.add(i);
        }

        for (const zIndex of chunksToKeep) {
            if (!roadChunks.has(zIndex)) {
                createRoadChunk(zIndex);
            }
            if (!terrainChunks.has(zIndex)) {
                createTerrainChunk(zIndex);
            }
        }

        for (const [zIndex, chunk] of roadChunks.entries()) {
            if (!chunksToKeep.has(zIndex)) {
                scene.remove(chunk);
                roadChunks.delete(zIndex);
            }
        }

        for (const [zIndex, chunk] of terrainChunks.entries()) {
            if (!chunksToKeep.has(zIndex)) {
                scene.remove(chunk);
                terrainChunks.delete(zIndex);
            }
        }
    }
}
