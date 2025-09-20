import * as THREE from 'three';
import { scene, renderer } from './scene.js';
import { car } from './car.js';
import { spawnBillboardForChunk } from './billboard.js';

export const roadChunks = new Map();
export const terrainChunks = new Map();
export const starsChunks = new Map();
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

function createBush(size = 3) {
    const bushGroup = new THREE.Group();
    const bushGeometry = new THREE.PlaneGeometry(size, size);
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

function createPillarTree() {
    const treeGroup = new THREE.Group();

    // Pillar (trunk)
    const pillarHeight = 6;
    const pillarWidth = 1;
    const pillarGeometry = new THREE.BoxGeometry(pillarWidth, pillarHeight, pillarWidth);
    const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Wood color
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.y = pillarHeight / 2; // Position pillar so its base is at y=0
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    treeGroup.add(pillar);

    // Bushes on top
    const bushSize = 4; // Slightly larger bushes
    const bush1 = createBush(bushSize);
    bush1.position.set(0, pillarHeight + bushSize * 0.3, 0);
    bush1.rotation.y = Math.random() * Math.PI * 2;
    treeGroup.add(bush1);

    const bush2 = createBush(bushSize);
    bush2.position.set(bushSize * 0.3, pillarHeight + bushSize * 0.1, bushSize * 0.3);
    bush2.rotation.y = Math.random() * Math.PI * 2;
    treeGroup.add(bush2);

    const bush3 = createBush(bushSize);
    bush3.position.set(-bushSize * 0.3, pillarHeight + bushSize * 0.1, -bushSize * 0.3);
    bush3.rotation.y = Math.random() * Math.PI * 2;
    treeGroup.add(bush3);

    return treeGroup;
}

function createStarsForChunk(zIndex) {
    const starsGroup = new THREE.Group();
    const chunkZ = zIndex * chunkSize;
    starsGroup.position.z = chunkZ;

    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });

    const starVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() + 0.1) * 200;
        const z = (Math.random() - 0.5) * 200;
        starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.visible = false; // Initially invisible
    starsGroup.add(stars);

    return starsGroup;
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

    const barrierHeight = 1;
    const barrierGeometry = new THREE.PlaneGeometry(chunkSize, barrierHeight);
    const barrierMaterial = new THREE.MeshLambertMaterial({ map: barrierTexture });

    const leftBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    leftBarrier.position.x = -roadWidth / 2;
    leftBarrier.position.y = 1;
    leftBarrier.rotation.y = Math.PI / 2;
    leftBarrier.castShadow = true;
    leftBarrier.receiveShadow = true;
    chunk.add(leftBarrier);

    const rightBarrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
    rightBarrier.position.x = roadWidth / 2;
    rightBarrier.position.y = 1;
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
    terrainGroup.rotation.x = -10 * (Math.PI / 180); // Rotate by 10 degrees around X-axis

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
        let randomX;
        do {
            randomX = (Math.random() * terrainSize) - halfTerrainSize;
        } while (randomX > -roadWidth / 2 - bushSize / 2 && randomX < roadWidth / 2 + bushSize / 2);
        const randomZ = (Math.random() * chunkSize) - (chunkSize / 2);

        // Calculate terrain Y at this (randomX, randomZ)
        const terrainY = ((Math.sin((randomX + chunkZ) * 0.1) * 0.5 + Math.cos((randomZ + chunkZ) * 0.05) * 0.5) * terrainMaxHeight - terrainMaxHeight / 2) - 5;

        const bush = createBush();
        bush.position.set(randomX, terrainY + bushHeight + terrain.position.y + 2, randomZ); // Position on terrain surface with offset
        terrainGroup.add(bush);
    }

    // Add pillar trees
    const numberOfPillarTrees = Math.floor(numberOfBushes / 2);
    const pillarTreeHeight = 6; // From createPillarTree function
    const pillarTreeWidth = 1; // From createPillarTree function

    for (let i = 0; i < numberOfPillarTrees; i++) {
        let randomX;
        do {
            randomX = (Math.random() * terrainSize) - halfTerrainSize;
        } while (randomX > -roadWidth / 2 - pillarTreeWidth / 2 && randomX < roadWidth / 2 + pillarTreeWidth / 2);
        const randomZ = (Math.random() * chunkSize) - (chunkSize / 2);

        // Calculate terrain Y at this (randomX, randomZ)
        const terrainY = ((Math.sin((randomX + chunkZ) * 0.1) * 0.5 + Math.cos((randomZ + chunkZ) * 0.05) * 0.5) * terrainMaxHeight - terrainMaxHeight / 2) - 5;

        const pillarTree = createPillarTree();
        pillarTree.position.set(randomX, terrainY + pillarTreeHeight / 2 + terrain.position.y + 2, randomZ); // Position on terrain surface with offset
        terrainGroup.add(pillarTree);
    }

    const starsGroup = createStarsForChunk(zIndex);
    scene.add(starsGroup);
    starsChunks.set(zIndex, starsGroup);

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

                // Remove stars associated with this chunk
                const starsGroup = starsChunks.get(zIndex);
                if (starsGroup) {
                    scene.remove(starsGroup);
                    starsGroup.children[0].geometry.dispose();
                    starsGroup.children[0].material.dispose();
                    starsChunks.delete(zIndex);
                }
            }
        }
    }
}

