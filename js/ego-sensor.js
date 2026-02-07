/** Ego-Centric Spherical Sensor */

// Ego sensor configuration
const egoConfig = {
    hBins: 16,          // Horizontal angle bins (around agent)
    vBins: 8,           // Vertical angle bins (up/down)
    maxRange: 5,        // Max detection range in meters
    vAngleMin: -60,     // Looking down (degrees)
    vAngleMax: 30,      // Looking up (degrees)
    hAngleMin: -180,    // Full 360 or -90 to 90 for front-facing
    hAngleMax: 180,
    agentHeight: 1.0    // Height of sensor origin from ground
};

// Ego sensor state
let egoTensorData = null;
let egoRayHelper = null;
let egoAgentMarker = null;
let egoTensorCanvas = null;
let egoTensorCtx = null;

// Reusable objects for raycasting
const egoRaycaster = new THREE.Raycaster();
const egoRayOrigin = new THREE.Vector3();
const egoRayDir = new THREE.Vector3();

function initEgoSensor() {
    // Initialize tensor data
    egoTensorData = new Float32Array(egoConfig.vBins * egoConfig.hBins);

    // Setup UI event listeners
    setupEgoUI();

    // Create tensor display canvas
    createTensorDisplay();

    // Create agent marker in scene
    createAgentMarker();

    // Create ray visualization
    createEgoRayVisualization();
}

function setupEgoUI() {
    const hSlider = document.getElementById('ego-h-bins');
    const vSlider = document.getElementById('ego-v-bins');
    const rangeSlider = document.getElementById('ego-range');

    if (hSlider) {
        hSlider.addEventListener('input', (e) => {
            egoConfig.hBins = parseInt(e.target.value);
            document.getElementById('ego-h-value').textContent = egoConfig.hBins;
            reinitEgoSensor();
        });
    }

    if (vSlider) {
        vSlider.addEventListener('input', (e) => {
            egoConfig.vBins = parseInt(e.target.value);
            document.getElementById('ego-v-value').textContent = egoConfig.vBins;
            reinitEgoSensor();
        });
    }

    if (rangeSlider) {
        rangeSlider.addEventListener('input', (e) => {
            egoConfig.maxRange = parseInt(e.target.value);
            document.getElementById('ego-range-value').textContent = egoConfig.maxRange;
            document.getElementById('range-display').textContent = egoConfig.maxRange + 'm';
        });
    }

    // Mode toggle
    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
        modeToggle.addEventListener('click', (e) => {
            if (e.target.classList.contains('mode-btn')) {
                const mode = e.target.dataset.mode;
                setActiveMode(mode);
            }
        });
    }
}

function setActiveMode(mode) {
    const state = window.appState;
    state.sensorMode = mode;

    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Toggle visibility of config sections
    const gridConfig = document.querySelector('.grid-selector-container');
    const egoConfigEl = document.getElementById('ego-config');
    const sensorGrid = document.getElementById('sensor-grid');

    if (mode === 'ego') {
        if (gridConfig) gridConfig.style.display = 'none';
        if (egoConfigEl) egoConfigEl.style.display = 'block';
        if (sensorGrid) sensorGrid.style.display = 'none';
        document.getElementById('stat-grid-size').style.display = 'none';
        document.getElementById('stat-tensor-shape').style.display = 'flex';
        document.getElementById('stat-max-height').style.display = 'none';
        document.getElementById('stat-min-dist').style.display = 'flex';
        updateTensorShapeDisplay();

        // Show ego visualizations
        if (egoAgentMarker) egoAgentMarker.visible = true;
        if (egoRayHelper) egoRayHelper.visible = true;
        if (state.sensorPoints) state.sensorPoints.visible = false;
        if (state.heightBars) state.heightBars.visible = false;
    } else {
        if (gridConfig) gridConfig.style.display = 'flex';
        if (egoConfigEl) egoConfigEl.style.display = 'none';
        if (sensorGrid) sensorGrid.style.display = 'grid';
        document.getElementById('stat-grid-size').style.display = 'flex';
        document.getElementById('stat-tensor-shape').style.display = 'none';
        document.getElementById('stat-max-height').style.display = 'flex';
        document.getElementById('stat-min-dist').style.display = 'none';
        document.getElementById('range-display').textContent = '±2.0m';

        // Show grid visualizations
        if (egoAgentMarker) egoAgentMarker.visible = false;
        if (egoRayHelper) egoRayHelper.visible = false;
        if (state.sensorPoints) state.sensorPoints.visible = true;
        if (state.heightBars) state.heightBars.visible = true;
    }
}

function reinitEgoSensor() {
    egoTensorData = new Float32Array(egoConfig.vBins * egoConfig.hBins);
    createTensorDisplay();
    createEgoRayVisualization();
    updateTensorShapeDisplay();
}

function updateTensorShapeDisplay() {
    document.getElementById('tensor-shape-display').textContent =
        `${egoConfig.vBins} × ${egoConfig.hBins}`;
}

function createTensorDisplay() {
    const container = document.getElementById('ego-tensor-display');
    if (!container) return;

    container.innerHTML = `
        <div class="tensor-label top">Front</div>
        <div class="tensor-label bottom">Back</div>
        <div class="tensor-label left">Up</div>
        <div class="tensor-label right">Down</div>
        <canvas id="ego-tensor-canvas"></canvas>
    `;

    egoTensorCanvas = document.getElementById('ego-tensor-canvas');
    egoTensorCanvas.width = egoConfig.hBins;
    egoTensorCanvas.height = egoConfig.vBins;
    egoTensorCanvas.style.width = '100%';
    egoTensorCanvas.style.height = 'auto';
    egoTensorCanvas.style.aspectRatio = `${egoConfig.hBins} / ${egoConfig.vBins}`;
    egoTensorCtx = egoTensorCanvas.getContext('2d');
}

function createAgentMarker() {
    const state = window.appState;
    if (!state.scene) return;

    // Remove existing
    if (egoAgentMarker) {
        state.scene.remove(egoAgentMarker);
        egoAgentMarker.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    // Create agent representation (capsule-like)
    const agentGroup = new THREE.Group();

    // Body (cylinder)
    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xf0883e,
        transparent: true,
        opacity: 0.8
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    agentGroup.add(body);

    // Head (sphere)
    const headGeo = new THREE.SphereGeometry(0.15, 16, 12);
    const headMat = new THREE.MeshStandardMaterial({
        color: 0xf0883e,
        transparent: true,
        opacity: 0.8
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.15;
    agentGroup.add(head);

    // Direction indicator (cone pointing forward)
    const dirGeo = new THREE.ConeGeometry(0.08, 0.2, 8);
    const dirMat = new THREE.MeshStandardMaterial({ color: 0x58a6ff });
    const dir = new THREE.Mesh(dirGeo, dirMat);
    dir.rotation.x = Math.PI / 2;
    dir.position.set(0, egoConfig.agentHeight, 0.25);
    agentGroup.add(dir);

    // Sensor origin indicator (small sphere)
    const sensorGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const sensorMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const sensor = new THREE.Mesh(sensorGeo, sensorMat);
    sensor.position.y = egoConfig.agentHeight;
    agentGroup.add(sensor);

    agentGroup.visible = false; // Hidden by default
    state.scene.add(agentGroup);
    egoAgentMarker = agentGroup;
}

function createEgoRayVisualization() {
    const state = window.appState;
    if (!state.scene) return;

    // Remove existing
    if (egoRayHelper) {
        state.scene.remove(egoRayHelper);
        egoRayHelper.geometry.dispose();
        egoRayHelper.material.dispose();
    }

    // Create line segments for rays
    const rayPositions = [];
    const rayColors = [];

    for (let v = 0; v < egoConfig.vBins; v++) {
        for (let h = 0; h < egoConfig.hBins; h++) {
            // Start point (origin)
            rayPositions.push(0, egoConfig.agentHeight, 0);
            rayColors.push(0.34, 0.65, 1.0); // Blue start

            // End point (will be updated during raycasting)
            const { dir } = getEgoRayDirection(v, h);
            rayPositions.push(dir.x, egoConfig.agentHeight + dir.y, dir.z);
            rayColors.push(0.34, 0.65, 1.0);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(rayPositions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(rayColors, 3));

    const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.4
    });

    egoRayHelper = new THREE.LineSegments(geometry, material);
    egoRayHelper.visible = false;
    state.scene.add(egoRayHelper);
}

function getEgoRayDirection(vIndex, hIndex) {
    // Calculate angles
    const vAngle = egoConfig.vAngleMin +
        (vIndex / (egoConfig.vBins - 1)) * (egoConfig.vAngleMax - egoConfig.vAngleMin);
    const hAngle = egoConfig.hAngleMin +
        (hIndex / (egoConfig.hBins - 1)) * (egoConfig.hAngleMax - egoConfig.hAngleMin);

    // Convert to radians
    const vRad = vAngle * Math.PI / 180;
    const hRad = hAngle * Math.PI / 180;

    // Spherical to Cartesian
    // Y is up, Z is forward, X is right
    const cosV = Math.cos(vRad);
    const dir = new THREE.Vector3(
        Math.sin(hRad) * cosV,  // X (left/right)
        Math.sin(vRad),          // Y (up/down)
        Math.cos(hRad) * cosV    // Z (forward/back)
    );

    return { dir, vAngle, hAngle };
}

function updateEgoSensor() {
    const state = window.appState;
    if (state.sensorMode !== 'ego' || !egoTensorData) return;

    const agentPos = egoAgentMarker ? egoAgentMarker.position : new THREE.Vector3(0, 0, 0);
    const rayPositions = egoRayHelper?.geometry.attributes.position.array;
    const rayColors = egoRayHelper?.geometry.attributes.color.array;

    let minDist = egoConfig.maxRange;
    let hitCount = 0;

    // Build exclusion set
    const excludeObjects = new Set([egoAgentMarker, egoRayHelper, state.sensorPoints]);

    for (let v = 0; v < egoConfig.vBins; v++) {
        for (let h = 0; h < egoConfig.hBins; h++) {
            const idx = v * egoConfig.hBins + h;
            const { dir } = getEgoRayDirection(v, h);

            // Set ray origin at agent position + height
            egoRayOrigin.set(
                agentPos.x,
                agentPos.y + egoConfig.agentHeight,
                agentPos.z
            );
            egoRayDir.copy(dir);

            egoRaycaster.set(egoRayOrigin, egoRayDir);
            egoRaycaster.far = egoConfig.maxRange;

            const intersects = egoRaycaster.intersectObjects(state.scene.children, true);

            let distance = egoConfig.maxRange;
            let hit = false;

            for (const intersect of intersects) {
                // Skip excluded objects
                let obj = intersect.object;
                let excluded = false;
                while (obj) {
                    if (excludeObjects.has(obj)) {
                        excluded = true;
                        break;
                    }
                    obj = obj.parent;
                }

                if (!excluded) {
                    distance = intersect.distance;
                    hit = true;
                    hitCount++;
                    minDist = Math.min(minDist, distance);
                    break;
                }
            }

            // Normalize distance to 0-1 (1 = max range/no hit)
            egoTensorData[idx] = distance / egoConfig.maxRange;

            // Update ray visualization
            if (rayPositions) {
                const rayIdx = idx * 6; // 2 points * 3 components
                // Start point
                rayPositions[rayIdx] = agentPos.x;
                rayPositions[rayIdx + 1] = agentPos.y + egoConfig.agentHeight;
                rayPositions[rayIdx + 2] = agentPos.z;
                // End point
                const endDist = hit ? distance : egoConfig.maxRange * 0.3;
                rayPositions[rayIdx + 3] = agentPos.x + dir.x * endDist;
                rayPositions[rayIdx + 4] = agentPos.y + egoConfig.agentHeight + dir.y * endDist;
                rayPositions[rayIdx + 5] = agentPos.z + dir.z * endDist;

                // Color based on distance (red = close, green = far)
                const colorIdx = idx * 6;
                if (hit) {
                    const t = distance / egoConfig.maxRange;
                    // Start color
                    rayColors[colorIdx] = 1 - t;     // R
                    rayColors[colorIdx + 1] = t;     // G
                    rayColors[colorIdx + 2] = 0.2;   // B
                    // End color
                    rayColors[colorIdx + 3] = 1 - t;
                    rayColors[colorIdx + 4] = t;
                    rayColors[colorIdx + 5] = 0.2;
                } else {
                    // No hit - dim blue
                    rayColors[colorIdx] = 0.2;
                    rayColors[colorIdx + 1] = 0.3;
                    rayColors[colorIdx + 2] = 0.5;
                    rayColors[colorIdx + 3] = 0.2;
                    rayColors[colorIdx + 4] = 0.3;
                    rayColors[colorIdx + 5] = 0.5;
                }
            }
        }
    }

    if (egoRayHelper) {
        egoRayHelper.geometry.attributes.position.needsUpdate = true;
        egoRayHelper.geometry.attributes.color.needsUpdate = true;
    }

    // Update stats
    document.getElementById('detected-count').textContent = hitCount;
    document.getElementById('min-distance').textContent =
        (minDist < egoConfig.maxRange ? minDist.toFixed(2) : '--') + 'm';

    // Update tensor display
    updateTensorDisplay();
}

function updateTensorDisplay() {
    if (!egoTensorCtx || !egoTensorData) return;

    const imageData = egoTensorCtx.createImageData(egoConfig.hBins, egoConfig.vBins);

    for (let v = 0; v < egoConfig.vBins; v++) {
        for (let h = 0; h < egoConfig.hBins; h++) {
            const idx = v * egoConfig.hBins + h;
            const pixelIdx = idx * 4;

            const dist = egoTensorData[idx];

            // Color mapping: close = hot (red/orange), far = cool (blue/black)
            // Inverted: low distance = bright, high distance = dark
            const intensity = 1 - dist;

            if (dist < 1.0) {
                // Hit something - use heat map
                imageData.data[pixelIdx] = Math.floor(255 * Math.min(1, intensity * 2));      // R
                imageData.data[pixelIdx + 1] = Math.floor(255 * Math.max(0, intensity * 2 - 1) * 0.5); // G
                imageData.data[pixelIdx + 2] = Math.floor(50 * (1 - intensity));               // B
            } else {
                // No hit - dark blue
                imageData.data[pixelIdx] = 20;
                imageData.data[pixelIdx + 1] = 30;
                imageData.data[pixelIdx + 2] = 50;
            }
            imageData.data[pixelIdx + 3] = 255; // Alpha
        }
    }

    egoTensorCtx.putImageData(imageData, 0, 0);
}

// Move agent with mouse in ego mode
function moveAgent(deltaX, deltaZ) {
    if (!egoAgentMarker) return;

    egoAgentMarker.position.x += deltaX;
    egoAgentMarker.position.z += deltaZ;

    // Clamp to grid bounds
    egoAgentMarker.position.x = Math.max(-GRID_RANGE + 0.3, Math.min(GRID_RANGE - 0.3, egoAgentMarker.position.x));
    egoAgentMarker.position.z = Math.max(-GRID_RANGE + 0.3, Math.min(GRID_RANGE - 0.3, egoAgentMarker.position.z));
}

function rotateAgent(deltaAngle) {
    if (!egoAgentMarker) return;
    egoAgentMarker.rotation.y += deltaAngle;
}

// Expose globally
window.initEgoSensor = initEgoSensor;
window.updateEgoSensor = updateEgoSensor;
window.setActiveMode = setActiveMode;
window.moveAgent = moveAgent;
window.rotateAgent = rotateAgent;
window.egoConfig = egoConfig;
