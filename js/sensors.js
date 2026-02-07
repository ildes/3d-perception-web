/** Sensors - Sensor Grid Visualization and Height Bars */

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
    
    const positions = state.sensorPoints.geometry.attributes.position.array;
    const cells = document.querySelectorAll('.sensor-cell');
    let detectedCount = 0;
    let maxHeight = 0;

    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const idx = i * GRID_SIZE + j;
            const x = -GRID_RANGE + (i + 0.5) * GRID_CELL_SIZE;
            const z = -GRID_RANGE + (j + 0.5) * GRID_CELL_SIZE;

            const raycasterLocal = new THREE.Raycaster();
            raycasterLocal.set(new THREE.Vector3(x, 3, z), new THREE.Vector3(0, -1, 0));
            const intersects = raycasterLocal.intersectObjects(state.scene.children, true);

            let hitY = 0;
            let found = false;
            for (const hit of intersects) {
                if (hit.object !== state.sensorPoints) {
                    hitY = hit.point.y;
                    found = true;
                    break;
                }
            }

            if (found) {
                hitY = Math.max(0, hitY);
                detectedCount++;
                maxHeight = Math.max(maxHeight, hitY);
            } else {
                hitY = 0;
            }

            state.sensorData[idx] = hitY;

            const pointIdx = idx * 3;
            positions[pointIdx] = x;
            positions[pointIdx + 1] = hitY + 0.05;
            positions[pointIdx + 2] = z;

            if (cells[idx]) {
                cells[idx].classList.toggle('active', hitY > 0.05);
            }

            const bar = state.heightBars.children[idx];
            if (bar) {
                const targetHeight = Math.max(0.01, hitY * 0.8);
                bar.position.y = targetHeight / 2;
                bar.geometry.dispose();
                bar.geometry = new THREE.BoxGeometry(
                    GRID_CELL_SIZE * 0.8,
                    targetHeight,
                    GRID_CELL_SIZE * 0.8
                );
                bar.position.y = targetHeight / 2;

                const intensity = hitY / 1.5;
                bar.material.color.setRGB(0.94 - intensity * 0.5, 0.53 - intensity * 0.2, 0.24 + intensity * 0.3);
                bar.material.emissive = new THREE.Color(0xf0883e);
                bar.material.emissiveIntensity = intensity * 0.5;
            }
        }
    }

    state.sensorPoints.geometry.attributes.position.needsUpdate = true;

    document.getElementById('detected-count').textContent = detectedCount;
    document.getElementById('max-height').textContent = maxHeight.toFixed(2) + 'm';
}

function recreateGrid() {
    const state = window.appState;
    
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

// Expose globally
window.recreateGrid = recreateGrid;
