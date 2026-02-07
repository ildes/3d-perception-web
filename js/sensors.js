/** Sensors - Sensor Grid Visualization and Height Bars */

// Reusable raycaster to avoid allocations each frame
const sensorRaycaster = new THREE.Raycaster();
const rayOrigin = new THREE.Vector3();
const rayDirection = new THREE.Vector3(0, -1, 0);

// Throttling control
let lastSensorUpdate = 0;
const SENSOR_UPDATE_INTERVAL = 50; // ~20fps for sensor updates
const COLOR_BINS = 64; // Quantization bins for color

// Quantize value to N bins
function quantize(value, maxValue, bins) {
    const normalized = Math.min(1, Math.max(0, value / maxValue));
    return Math.floor(normalized * (bins - 1)) / (bins - 1);
}

function createSensorVisualization(targetScene) {
    // Remove existing if any
    if (window.appState.sensorPoints) {
        targetScene.remove(window.appState.sensorPoints);
        window.appState.sensorPoints.geometry.dispose();
        window.appState.sensorPoints.material.dispose();
    }
    
    const pointsGeometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const x = -GRID_RANGE + (i + 0.5) * GRID_CELL_SIZE;
            const z = -GRID_RANGE + (j + 0.5) * GRID_CELL_SIZE;
            positions.push(x, 0.05, z);
        }
    }

    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const pointsMaterial = new THREE.PointsMaterial({
        color: 0x58a6ff,
        size: 0.15,
        transparent: true,
        opacity: 0.9
    });

    const sensorPoints = new THREE.Points(pointsGeometry, pointsMaterial);
    targetScene.add(sensorPoints);
    
    window.appState.sensorPoints = sensorPoints;
    return sensorPoints;
}

function createHeightBars(targetScene) {
    // Remove existing if any
    if (window.appState.heightBars) {
        targetScene.remove(window.appState.heightBars);
        window.appState.heightBars.children.forEach(child => {
            child.geometry.dispose();
            child.material.dispose();
        });
    }
    
    const heightBars = new THREE.Group();

    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const barMaterial = new THREE.MeshStandardMaterial({
                color: 0xf0883e,
                metalness: 0.4,
                roughness: 0.5
            });

            const barGeometry = new THREE.BoxGeometry(GRID_CELL_SIZE * 0.8, 0.01, GRID_CELL_SIZE * 0.8);
            const bar = new THREE.Mesh(barGeometry, barMaterial);

            const x = -GRID_RANGE + (i + 0.5) * GRID_CELL_SIZE;
            const z = -GRID_RANGE + (j + 0.5) * GRID_CELL_SIZE;

            bar.position.set(x, 0, z);
            bar.userData = { gridIndex: i * GRID_SIZE + j };
            heightBars.add(bar);
        }
    }

    heightBars.position.y = 0.01;
    targetScene.add(heightBars);
    
    window.appState.heightBars = heightBars;
    return heightBars;
}

function updateSensorData() {
    const state = window.appState;
    if (!state.sensorPoints || !state.heightBars) return;
    if (state.sensorMode === 'ego') return; // Skip in ego mode

    // Throttle updates
    const now = performance.now();
    if (now - lastSensorUpdate < SENSOR_UPDATE_INTERVAL) return;
    lastSensorUpdate = now;

    const positions = state.sensorPoints.geometry.attributes.position.array;
    const cells = document.querySelectorAll('.sensor-cell');
    let detectedCount = 0;
    let maxHeight = 0;

    // Build list of objects TO raycast against (whitelist approach)
    // Only include the actual geometry object (cube/wall/etc)
    const targetObjects = [];
    if (state.cube && state.cube.visible) {
        targetObjects.push(state.cube);
    }

    // If no target objects, all sensors should read 0
    if (targetObjects.length === 0) {
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            state.sensorData[i] = 0;

            // Reset sensor point Y position
            positions[i * 3 + 1] = 0.05;

            if (cells[i]) cells[i].classList.remove('active');

            const bar = state.heightBars.children[i];
            if (bar) {
                // Reset to base height and color
                bar.scale.y = 1;
                bar.position.y = 0.005;
                bar.material.color.setRGB(0.94, 0.53, 0.24);
            }
        }
        state.sensorPoints.geometry.attributes.position.needsUpdate = true;
        document.getElementById('detected-count').textContent = 0;
        document.getElementById('max-height').textContent = '0.00m';
        return;
    }

    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const idx = i * GRID_SIZE + j;
            const x = -GRID_RANGE + (i + 0.5) * GRID_CELL_SIZE;
            const z = -GRID_RANGE + (j + 0.5) * GRID_CELL_SIZE;

            // Reuse raycaster instance - shoot from high above
            rayOrigin.set(x, 20, z);
            sensorRaycaster.set(rayOrigin, rayDirection);

            // Only raycast against target objects (the geometry we care about)
            const intersects = sensorRaycaster.intersectObjects(targetObjects, true);

            let hitY = 0;
            if (intersects.length > 0) {
                hitY = intersects[0].point.y;
                // Only count as detection if hit something above ground level
                if (hitY > 0.01) {
                    detectedCount++;
                    maxHeight = Math.max(maxHeight, hitY);
                } else {
                    hitY = 0;
                }
            }

            state.sensorData[idx] = hitY;

            // Update sensor point Y position based on hit height
            const posIdx = idx * 3;
            positions[posIdx + 1] = 0.05 + hitY;

            // Flip horizontally for UI display
            const uiIdx = i * GRID_SIZE + (GRID_SIZE - 1 - j);
            if (cells[uiIdx]) {
                cells[uiIdx].classList.toggle('active', hitY > 0.05);
            }

            const bar = state.heightBars.children[idx];
            if (bar) {
                // Update bar height based on detected height
                const barHeight = Math.max(0.01, hitY);
                bar.scale.y = barHeight / 0.01; // Scale relative to base height
                bar.position.y = barHeight / 2; // Center bar at half its height

                // Consistent orange color (matching accent2: #f0883e)
                bar.material.color.setRGB(0.94, 0.53, 0.24);
            }
        }
    }

    // Mark positions buffer as needing update
    state.sensorPoints.geometry.attributes.position.needsUpdate = true;

    document.getElementById('detected-count').textContent = detectedCount;
    document.getElementById('max-height').textContent = maxHeight.toFixed(2) + 'm';

    // Log tensor output for debugging (only when something is detected)
    if (detectedCount > 0 && Math.random() < 0.05) { // Log ~5% of frames to avoid spam
        console.log('Grid Tensor [' + GRID_SIZE + 'x' + GRID_SIZE + ']:');
        let tensorStr = '';
        for (let i = 0; i < GRID_SIZE; i++) {
            let row = '';
            for (let j = 0; j < GRID_SIZE; j++) {
                const val = state.sensorData[i * GRID_SIZE + j];
                row += val.toFixed(2).padStart(5) + ' ';
            }
            tensorStr += row + '\n';
        }
        console.log(tensorStr);
    }
}

function recreateGrid() {
    const state = window.appState;

    // Update GridHelpers in both scenes
    updateGridHelpers(state.scene);
    updateGridHelpers(state.scene2);

    // Recreate sensor visualization in both scenes
    createSensorVisualization(state.scene);
    createHeightBars(state.scene2);

    // Recreate UI grid
    if (window.createSensorGridUI) {
        window.createSensorGridUI();
    }

    // Update grid selector
    if (window.initGridSelector) {
        window.initGridSelector();
    }
}

function updateGridHelpers(scene) {
    // Find and remove old GridHelper
    const oldHelper = scene.children.find(child => child instanceof THREE.GridHelper);
    if (oldHelper) {
        oldHelper.geometry.dispose();
        oldHelper.material.dispose();
        scene.remove(oldHelper);
    }

    // Create new GridHelper with updated size
    const gridHelper = new THREE.GridHelper(GRID_RANGE * 2, GRID_SIZE, 0x30363d, 0x21262d);
    scene.add(gridHelper);
}

// Expose globally
window.recreateGrid = recreateGrid;
