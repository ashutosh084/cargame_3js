import * as THREE from 'three';
import { car } from './car.js';
import { roadChunks, currentChunkZ } from './road.js';

export function checkCollisions() {
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
