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
let egoTensorCells = null;

// Reusable objects for raycasting
const egoRaycaster = new THREE.Raycaster();
const egoRayOrigin = new THREE.Vector3();
const egoRayDir = new THREE.Vector3();

function initEgoSensor() {
    // Initialize tensor data
    egoTensorData = new Float32Array(egoConfig.vBins * egoConfig.hBins);

    // Setup UI event listeners
    setupEgoUI();

    // Create tensor display (div-based with values)
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
    const viewport2 = document.getElementById('viewport2');
    const viewport2Label = viewport2.querySelector('.viewport-label');

    if (mode === 'ego') {
        if (gridConfig) gridConfig.style.display = 'none';
        if (egoConfigEl) egoConfigEl.style.display = 'block';
        if (sensorGrid) sensorGrid.style.display = 'none';
        document.getElementById('stat-grid-size').style.display = 'none';
        document.getElementById('stat-tensor-shape').style.display = 'flex';
        document.getElementById('stat-max-height').style.display = 'none';
        document.getElementById('stat-min-dist').style.display = 'flex';
        document.getElementById('range-display').textContent = egoConfig.maxRange + 'm';
        viewport2Label.textContent = 'AGENT VIEW';
        viewport2.classList.add('ego-mode');
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
        viewport2Label.textContent = 'SENSOR DATA';
        viewport2.classList.remove('ego-mode');

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
    const el = document.getElementById('tensor-shape-display');
    if (el) el.textContent = `${egoConfig.vBins} × ${egoConfig.hBins}`;
}

function createTensorDisplay() {
    const container = document.getElementById('ego-tensor-display');
    if (!container) return;

    // Create grid of divs instead of canvas for showing values
    let html = `
        <div class="tensor-axis-label top">← Back | Front →</div>
        <div class="tensor-axis-label left">Up ↑</div>
        <div class="ego-tensor-grid" style="grid-template-columns: repeat(${egoConfig.hBins}, 1fr);">
    `;

    for (let v = 0; v < egoConfig.vBins; v++) {
        for (let h = 0; h < egoConfig.hBins; h++) {
            const idx = v * egoConfig.hBins + h;
            html += `<div class="ego-tensor-cell" data-idx="${idx}"></div>`;
        }
    }

    html += '</div>';
    container.innerHTML = html;

    // Cache cell references
    egoTensorCells = container.querySelectorAll('.ego-tensor-cell');
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

    // Bright uniform color for visibility
    const agentColor = 0xff6600;
    const agentMat = new THREE.MeshBasicMaterial({ color: agentColor });

    const agentGroup = new THREE.Group();

    // Body (cylinder) - larger and brighter
    const bodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.9, 16);
    const body = new THREE.Mesh(bodyGeo, agentMat);
    body.position.y = 0.55;
    agentGroup.add(body);

    // Head (sphere) - larger
    const headGeo = new THREE.SphereGeometry(0.18, 16, 12);
    const head = new THREE.Mesh(headGeo, agentMat);
    head.position.y = 1.15;
    agentGroup.add(head);

    // Direction indicator (large cone pointing forward) - very visible
    const dirGeo = new THREE.ConeGeometry(0.15, 0.4, 8);
    const dirMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const dir = new THREE.Mesh(dirGeo, dirMat);
    dir.rotation.x = Math.PI / 2;
    dir.position.set(0, egoConfig.agentHeight, 0.35);
    agentGroup.add(dir);

    // Sensor origin indicator (glowing sphere)
    const sensorGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const sensorMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const sensor = new THREE.Mesh(sensorGeo, sensorMat);
    sensor.position.y = egoConfig.agentHeight;
    agentGroup.add(sensor);

    // Add rings around agent for visibility
    const ringGeo = new THREE.RingGeometry(0.35, 0.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: agentColor, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    agentGroup.add(ring);

    agentGroup.visible = false;
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
            rayColors.push(1.0, 1.0, 1.0);

            // End point (will be updated during raycasting)
            const { dir } = getEgoRayDirection(v, h);
            rayPositions.push(dir.x, egoConfig.agentHeight + dir.y, dir.z);
            rayColors.push(1.0, 1.0, 1.0);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(rayPositions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(rayColors, 3));

    const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.6
    });

    egoRayHelper = new THREE.LineSegments(geometry, material);
    egoRayHelper.visible = false;
    state.scene.add(egoRayHelper);
}

function getEgoRayDirection(vIndex, hIndex) {
    // Calculate angles
    const vAngle = egoConfig.vAngleMin +
        (vIndex / Math.max(1, egoConfig.vBins - 1)) * (egoConfig.vAngleMax - egoConfig.vAngleMin);
    const hAngle = egoConfig.hAngleMin +
        (hIndex / Math.max(1, egoConfig.hBins - 1)) * (egoConfig.hAngleMax - egoConfig.hAngleMin);

    // Convert to radians
    const vRad = vAngle * Math.PI / 180;
    const hRad = hAngle * Math.PI / 180;

    // Spherical to Cartesian (Y up, Z forward, X right)
    const cosV = Math.cos(vRad);
    const dir = new THREE.Vector3(
        Math.sin(hRad) * cosV,
        Math.sin(vRad),
        Math.cos(hRad) * cosV
    );

    return { dir, vAngle, hAngle };
}

function updateEgoSensor() {
    const state = window.appState;
    if (state.sensorMode !== 'ego' || !egoTensorData) return;

    const agentPos = egoAgentMarker ? egoAgentMarker.position : new THREE.Vector3(0, 0, 0);
    const agentRot = egoAgentMarker ? egoAgentMarker.rotation.y : 0;
    const rayPositions = egoRayHelper?.geometry.attributes.position.array;
    const rayColors = egoRayHelper?.geometry.attributes.color.array;

    let minDist = egoConfig.maxRange;
    let hitCount = 0;

    // Build exclusion set (objects not to hit)
    const excludeObjects = new Set();
    if (egoAgentMarker) {
        egoAgentMarker.traverse(obj => excludeObjects.add(obj));
    }
    if (egoRayHelper) excludeObjects.add(egoRayHelper);
    if (state.sensorPoints) excludeObjects.add(state.sensorPoints);

    for (let v = 0; v < egoConfig.vBins; v++) {
        for (let h = 0; h < egoConfig.hBins; h++) {
            const idx = v * egoConfig.hBins + h;
            const { dir } = getEgoRayDirection(v, h);

            // Rotate direction by agent's Y rotation
            const rotatedDir = dir.clone();
            rotatedDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), agentRot);

            // Set ray origin at agent position + height
            egoRayOrigin.set(
                agentPos.x,
                agentPos.y + egoConfig.agentHeight,
                agentPos.z
            );

            egoRaycaster.set(egoRayOrigin, rotatedDir);
            egoRaycaster.far = egoConfig.maxRange;

            const intersects = egoRaycaster.intersectObjects(state.scene.children, true);

            let distance = egoConfig.maxRange;
            let hit = false;

            for (const intersect of intersects) {
                if (!excludeObjects.has(intersect.object)) {
                    distance = intersect.distance;
                    hit = true;
                    hitCount++;
                    minDist = Math.min(minDist, distance);
                    break;
                }
            }

            // Store normalized distance (0 = touching, 1 = max range)
            egoTensorData[idx] = distance / egoConfig.maxRange;

            // Update ray visualization
            if (rayPositions) {
                const rayIdx = idx * 6;
                // Start point
                rayPositions[rayIdx] = agentPos.x;
                rayPositions[rayIdx + 1] = agentPos.y + egoConfig.agentHeight;
                rayPositions[rayIdx + 2] = agentPos.z;
                // End point
                const endDist = hit ? distance : egoConfig.maxRange * 0.5;
                rayPositions[rayIdx + 3] = agentPos.x + rotatedDir.x * endDist;
                rayPositions[rayIdx + 4] = agentPos.y + egoConfig.agentHeight + rotatedDir.y * endDist;
                rayPositions[rayIdx + 5] = agentPos.z + rotatedDir.z * endDist;

                // Color: white = close, dark gray = far (grayscale)
                const colorIdx = idx * 6;
                const brightness = hit ? (1 - distance / egoConfig.maxRange) : 0.2;
                rayColors[colorIdx] = brightness;
                rayColors[colorIdx + 1] = brightness;
                rayColors[colorIdx + 2] = brightness;
                rayColors[colorIdx + 3] = brightness;
                rayColors[colorIdx + 4] = brightness;
                rayColors[colorIdx + 5] = brightness;
            }
        }
    }

    if (egoRayHelper) {
        egoRayHelper.geometry.attributes.position.needsUpdate = true;
        egoRayHelper.geometry.attributes.color.needsUpdate = true;
    }

    // Update stats
    document.getElementById('detected-count').textContent = hitCount;
    const minDistEl = document.getElementById('min-distance');
    if (minDistEl) {
        minDistEl.textContent = (minDist < egoConfig.maxRange ? minDist.toFixed(2) : '--') + 'm';
    }

    // Update tensor display with values
    updateTensorDisplay();
}

function updateTensorDisplay() {
    if (!egoTensorCells || !egoTensorData) return;

    for (let i = 0; i < egoTensorCells.length && i < egoTensorData.length; i++) {
        const cell = egoTensorCells[i];
        const normalizedDist = egoTensorData[i];

        // Black to white gradient (close = white, far = black)
        const brightness = Math.round((1 - normalizedDist) * 255);
        cell.style.backgroundColor = `rgb(${brightness}, ${brightness}, ${brightness})`;

        // Show actual distance value in meters
        const actualDist = normalizedDist * egoConfig.maxRange;
        if (normalizedDist < 1.0) {
            cell.textContent = actualDist.toFixed(1);
            // Dark text on light bg, light text on dark bg
            cell.style.color = brightness > 128 ? '#000' : '#fff';
        } else {
            cell.textContent = '—';
            cell.style.color = '#666';
        }
    }
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

function updateFirstPersonCamera() {
    const state = window.appState;
    if (!state.camera2 || !egoAgentMarker) return;

    const agentPos = egoAgentMarker.position;
    const agentRot = egoAgentMarker.rotation.y;

    // Position camera at agent's head height
    state.camera2.position.set(
        agentPos.x,
        agentPos.y + egoConfig.agentHeight + 0.15, // Slightly above sensor origin (eye level)
        agentPos.z
    );

    // Look in the direction the agent is facing
    const lookDistance = 5;
    const lookTarget = new THREE.Vector3(
        agentPos.x + Math.sin(agentRot) * lookDistance,
        agentPos.y + egoConfig.agentHeight, // Look straight ahead
        agentPos.z + Math.cos(agentRot) * lookDistance
    );
    state.camera2.lookAt(lookTarget);

    // Adjust FOV for first-person feel
    if (state.camera2.fov !== 75) {
        state.camera2.fov = 75;
        state.camera2.updateProjectionMatrix();
    }
}

// Expose globally
window.initEgoSensor = initEgoSensor;
window.updateEgoSensor = updateEgoSensor;
window.updateFirstPersonCamera = updateFirstPersonCamera;
window.setActiveMode = setActiveMode;
window.moveAgent = moveAgent;
window.rotateAgent = rotateAgent;
window.egoConfig = egoConfig;
