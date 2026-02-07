/** Geometries - Terrain objects (Pyramid, Rough Terrain, Stepping Stones) */

function createPyramidStairs(material) {
    const group = new THREE.Group();
    const stepMat = material.clone();
    stepMat.color.setHex(0x5a6a4a);

    const terrainSize = 7.5;
    const stepWidth = 0.4;
    const stepHeight = 0.12;
    const platformSize = 0.8;

    let height = 0;
    let startX = -terrainSize / 2;
    let stopX = terrainSize / 2;
    let startZ = -terrainSize / 2;
    let stopZ = terrainSize / 2;

    while ((stopX - startX) > platformSize && (stopZ - startZ) > platformSize) {
        startX += stepWidth;
        stopX -= stepWidth;
        startZ += stepWidth;
        stopZ -= stepWidth;
        height += stepHeight;

        const width = stopX - startX;
        const depth = stopZ - startZ;

        const step = new THREE.Mesh(
            new THREE.BoxGeometry(width, stepHeight, depth),
            stepMat
        );
        step.position.set(
            (startX + stopX) / 2,
            height - stepHeight / 2,
            (startZ + stopZ) / 2
        );
        group.add(step);
    }

    return group;
}

function createRoughTerrain(material) {
    const group = new THREE.Group();
    const terrainMat = material.clone();
    terrainMat.color.setHex(0x6b5b45);

    const gridRes = 24;
    const terrainSize = 7.5;
    const cellSize = terrainSize / gridRes;
    const minHeight = 0;
    const maxHeight = 0.3;

    const heights = [];
    for (let i = 0; i < gridRes; i++) {
        heights[i] = [];
        for (let j = 0; j < gridRes; j++) {
            heights[i][j] = minHeight + Math.random() * (maxHeight - minHeight);
        }
    }

    const smoothed = [];
    for (let i = 0; i < gridRes; i++) {
        smoothed[i] = [];
        for (let j = 0; j < gridRes; j++) {
            let sum = heights[i][j];
            let count = 1;
            if (i > 0) { sum += heights[i-1][j]; count++; }
            if (i < gridRes-1) { sum += heights[i+1][j]; count++; }
            if (j > 0) { sum += heights[i][j-1]; count++; }
            if (j < gridRes-1) { sum += heights[i][j+1]; count++; }
            smoothed[i][j] = sum / count;
        }
    }

    for (let i = 0; i < gridRes; i++) {
        for (let j = 0; j < gridRes; j++) {
            const h = smoothed[i][j];
            const box = new THREE.Mesh(
                new THREE.BoxGeometry(cellSize * 0.95, h, cellSize * 0.95),
                terrainMat
            );
            box.position.set(
                (i - gridRes/2 + 0.5) * cellSize,
                h / 2,
                (j - gridRes/2 + 0.5) * cellSize
            );
            group.add(box);
        }
    }

    return group;
}

function createSteppingStones(material) {
    const group = new THREE.Group();
    const stoneMat = material.clone();
    stoneMat.color.setHex(0x7a7a7a);

    const terrainSize = 7.5;
    const stoneSize = 0.5;
    const gap = 0.3;
    const spacing = stoneSize + gap;

    const cols = Math.floor(terrainSize / spacing);
    const rows = Math.floor(terrainSize / spacing);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (Math.random() < 0.2) continue;

            const height = 0.1 + Math.random() * 0.4;
            const sizeVar = 0.8 + Math.random() * 0.4;

            const stone = new THREE.Mesh(
                new THREE.BoxGeometry(stoneSize * sizeVar, height, stoneSize * sizeVar),
                stoneMat
            );
            stone.position.set(
                (i - cols/2 + 0.5) * spacing + (Math.random() - 0.5) * 0.1,
                height / 2,
                (j - rows/2 + 0.5) * spacing + (Math.random() - 0.5) * 0.1
            );
            group.add(stone);
        }
    }

    return group;
}
