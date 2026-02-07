/** Ego-Centric Spherical Sensor */

// Ego sensor configuration
const egoConfig = {
    hBins: 64,          // Horizontal angle bins (around agent)
    vBins: 32,          // Vertical angle bins (up/down)
    maxRange: 5,        // Max detection range in meters
    vAngleMin: -60,     // Looking down (degrees)
    vAngleMax: 30,      // Looking up (degrees)
    hAngleMin: -180,    // Full 360
    hAngleMax: 180,
    agentHeight: 1.0,   // Height of sensor origin from ground
    brightnessMultiplier: 1.5  // Multiplier for distance-based brightness
};

// Ego sensor state
let egoTensorData = null;
let egoRayHelper = null;
let egoAgentMarker = null;
let egoTensorCells = null;
let egoPointCloud = null; // Point cloud for viewport2

// Reusable objects for raycasting
const egoRaycaster = new THREE.Raycaster();
const egoRayOrigin = new THREE.Vector3();
const egoRayDir = new THREE.Vector3();

// Throttling for ego sensor
let lastEgoUpdate = 0;
const EGO_UPDATE_INTERVAL = 50; // ~20fps

function initEgoSensor() {
    egoTensorData = new Float32Array(egoConfig.vBins * egoConfig.hBins);
    setupEgoUI();
    createTensorDisplay();
    createAgentMarker();
    createEgoRayVisualization();
    createEgoPointCloud();
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
            egoConfig.maxRange = parseFloat(e.target.value);
            document.getElementById('ego-range-value').textContent = egoConfig.maxRange;
            document.getElementById('range-display').textContent = egoConfig.maxRange + 'm';
        });
    }

    const brightnessSlider = document.getElementById('ego-brightness');
    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', (e) => {
            egoConfig.brightnessMultiplier = parseFloat(e.target.value);
            document.getElementById('ego-brightness-value').textContent = egoConfig.brightnessMultiplier.toFixed(1);
        });
    }

    // Mode toggle
    const modeToggle = document.getElementById('mode-toggle');
    if (modeToggle) {
        modeToggle.addEventListener('click', (e) => {
            if (e.target.classList.contains('mode-btn')) {
                setActiveMode(e.target.dataset.mode);
            }
        });
    }
}

function setActiveMode(mode) {
    const state = window.appState;
    state.sensorMode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    const gridConfig = document.querySelector('.grid-selector-container');
    const egoConfigEl = document.getElementById('ego-config');
    const sensorGrid = document.getElementById('sensor-grid');
    const viewport2 = document.getElementById('viewport2');
    const viewport2Label = viewport2 ? viewport2.querySelector('.viewport-label') : null;

    if (mode === 'ego') {
        if (gridConfig) gridConfig.style.display = 'none';
        if (egoConfigEl) egoConfigEl.style.display = 'block';
        if (sensorGrid) sensorGrid.style.display = 'none';
        document.getElementById('stat-grid-size').style.display = 'none';
        document.getElementById('stat-tensor-shape').style.display = 'flex';
        document.getElementById('stat-max-height').style.display = 'none';
        document.getElementById('stat-min-dist').style.display = 'flex';
        document.getElementById('range-display').textContent = egoConfig.maxRange + 'm';
        if (viewport2Label) viewport2Label.textContent = 'AGENT POV';
        updateTensorShapeDisplay();

        // Resize floor for ego mode (10x larger)
        resizeFloorForMode('ego');

        // Show ego visualizations
        if (egoAgentMarker) egoAgentMarker.visible = true;
        if (egoRayHelper) egoRayHelper.visible = true;
        if (egoPointCloud) egoPointCloud.visible = true;
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
        document.getElementById('range-display').textContent = '±' + GRID_RANGE + 'm';
        if (viewport2Label) viewport2Label.textContent = 'SENSOR DATA';

        // Resize floor back to grid mode size
        resizeFloorForMode('grid');

        // Show grid visualizations
        if (egoAgentMarker) egoAgentMarker.visible = false;
        if (egoRayHelper) egoRayHelper.visible = false;
        if (egoPointCloud) egoPointCloud.visible = false;
        if (state.sensorPoints) state.sensorPoints.visible = true;
        if (state.heightBars) state.heightBars.visible = true;
    }
}

function resizeFloorForMode(mode) {
    const state = window.appState;
    if (!state.scene || !state.floor) return;

    const floorRange = (mode === 'ego') ? EGO_FLOOR_RANGE : GRID_RANGE;
    const floorSize = floorRange * 2;

    // Dispose old geometry
    if (state.floor.geometry) {
        state.floor.geometry.dispose();
    }

    // Create new floor geometry
    state.floor.geometry = new THREE.PlaneGeometry(floorSize, floorSize);

    // Also update the grid helper
    const gridHelpers = state.scene.children.filter(c => c instanceof THREE.GridHelper);
    gridHelpers.forEach(g => {
        state.scene.remove(g);
        if (g.geometry) g.geometry.dispose();
        if (g.material) g.material.dispose();
    });

    const gridHelper = new THREE.GridHelper(floorSize, (mode === 'ego') ? 60 : GRID_SIZE, 0x30363d, 0x21262d);
    state.scene.add(gridHelper);
}

function reinitEgoSensor() {
    const state = window.appState;
    egoTensorData = new Float32Array(egoConfig.vBins * egoConfig.hBins);
    createTensorDisplay();
    createEgoRayVisualization();
    createEgoPointCloud();
    updateTensorShapeDisplay();

    // Restore visibility if in ego mode
    if (state.sensorMode === 'ego') {
        if (egoRayHelper) egoRayHelper.visible = true;
        if (egoPointCloud) egoPointCloud.visible = true;
    }
}

function updateTensorShapeDisplay() {
    const el = document.getElementById('tensor-shape-display');
    if (el) el.textContent = `${egoConfig.vBins} × ${egoConfig.hBins}`;
}

function createTensorDisplay() {
    const container = document.getElementById('ego-tensor-display');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    const totalCells = egoConfig.vBins * egoConfig.hBins;
    console.log(`Creating tensor display: ${egoConfig.vBins}x${egoConfig.hBins} = ${totalCells} cells`);

    // Grid of colored cells only (no numbers)
    // Cylinder unwrap: left edge = back-left (-180°), center = forward (0°), right edge = back-right (+180°)
    let html = `
        <div class="tensor-axis-label top">Back ← | Front | → Back</div>
        <div class="tensor-axis-label left">Down</div>
        <div class="ego-tensor-grid" style="grid-template-columns: repeat(${egoConfig.hBins}, 1fr); grid-template-rows: repeat(${egoConfig.vBins}, 1fr);">
    `;

    // Render rows in reverse order so top of display = looking up, bottom = looking down
    for (let v = egoConfig.vBins - 1; v >= 0; v--) {
        for (let h = 0; h < egoConfig.hBins; h++) {
            const idx = v * egoConfig.hBins + h;
            html += `<div class="ego-tensor-cell" data-idx="${idx}"></div>`;
        }
    }

    html += '</div>';
    container.innerHTML = html;
    egoTensorCells = container.querySelectorAll('.ego-tensor-cell');
    console.log(`Created ${egoTensorCells.length} tensor cells`);
}

function createAgentMarker() {
    const state = window.appState;
    if (!state.scene) return;

    if (egoAgentMarker) {
        state.scene.remove(egoAgentMarker);
        egoAgentMarker.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    const agentColor = 0xff6600;
    const agentGroup = new THREE.Group();

    // Simple ground ring - shows position
    const ringGeo = new THREE.RingGeometry(0.3, 0.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: agentColor, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    agentGroup.add(ring);

    // Direction indicator - arrow on ground pointing forward
    const arrowGeo = new THREE.ConeGeometry(0.15, 0.4, 8);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.rotation.x = Math.PI / 2;
    arrow.position.set(0, 0.03, 0.5);
    agentGroup.add(arrow);

    // Sensor height indicator - small floating ring at sensor origin
    const sensorRingGeo = new THREE.RingGeometry(0.08, 0.12, 16);
    const sensorRingMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
    const sensorRing = new THREE.Mesh(sensorRingGeo, sensorRingMat);
    sensorRing.rotation.x = -Math.PI / 2;
    sensorRing.position.y = egoConfig.agentHeight;
    agentGroup.add(sensorRing);

    agentGroup.visible = false;
    state.scene.add(agentGroup);
    egoAgentMarker = agentGroup;
}

function createEgoRayVisualization() {
    const state = window.appState;
    if (!state.scene) return;

    if (egoRayHelper) {
        state.scene.remove(egoRayHelper);
        egoRayHelper.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    // Use a group of cylinder meshes for whisker tips
    egoRayHelper = new THREE.Group();
    const whiskerRadius = 0.005; // Half width

    for (let v = 0; v < egoConfig.vBins; v++) {
        for (let h = 0; h < egoConfig.hBins; h++) {
            const { dir } = getEgoRayDirection(v, h);

            // Create cylinder geometry for each whisker
            const cylGeo = new THREE.CylinderGeometry(whiskerRadius, whiskerRadius, 1, 4);
            const cylMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const cylinder = new THREE.Mesh(cylGeo, cylMat);

            // Store direction for later updates
            cylinder.userData = { v, h, dir: dir.clone() };

            // Initially hidden (zero scale)
            cylinder.scale.set(1, 0.001, 1);
            cylinder.visible = false;

            egoRayHelper.add(cylinder);
        }
    }

    egoRayHelper.visible = false;
    state.scene.add(egoRayHelper);
}

// Create point cloud visualization for ego mode viewport2
function createEgoPointCloud() {
    const state = window.appState;
    if (!state.scene2) return;

    if (egoPointCloud) {
        state.scene2.remove(egoPointCloud);
        egoPointCloud.geometry.dispose();
        egoPointCloud.material.dispose();
    }

    const numPoints = egoConfig.vBins * egoConfig.hBins;
    const positions = new Float32Array(numPoints * 3);
    const colors = new Float32Array(numPoints * 3);

    // Initialize all points at origin
    for (let i = 0; i < numPoints; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.9
    });

    egoPointCloud = new THREE.Points(geometry, material);
    egoPointCloud.visible = false;
    state.scene2.add(egoPointCloud);
}

function getEgoRayDirection(vIndex, hIndex) {
    const vAngle = egoConfig.vAngleMin +
        (vIndex / Math.max(1, egoConfig.vBins - 1)) * (egoConfig.vAngleMax - egoConfig.vAngleMin);

    // Cylinder unwrap orientation: center column = forward (0°), edges = back (±180°)
    // Map hIndex [0, hBins-1] → [-180°, +180°]
    const hAngle = egoConfig.hAngleMin +
        (hIndex / Math.max(1, egoConfig.hBins - 1)) * (egoConfig.hAngleMax - egoConfig.hAngleMin);

    const vRad = vAngle * Math.PI / 180;
    const hRad = hAngle * Math.PI / 180;

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

    // Throttle updates to ~20fps
    const now = performance.now();
    if (now - lastEgoUpdate < EGO_UPDATE_INTERVAL) return;
    lastEgoUpdate = now;

    const agentPos = egoAgentMarker ? egoAgentMarker.position : new THREE.Vector3(0, 0, 0);
    const agentRot = egoAgentMarker ? egoAgentMarker.rotation.y : 0;
    const whiskers = egoRayHelper?.children;
    const pointPositions = egoPointCloud?.geometry.attributes.position.array;
    const pointColors = egoPointCloud?.geometry.attributes.color.array;

    let minDist = egoConfig.maxRange;
    let hitCount = 0;

    // Whitelist approach: raycast against geometry and floor
    const targetObjects = [];
    if (state.cube && state.cube.visible) {
        targetObjects.push(state.cube);
    }
    if (state.floor) {
        targetObjects.push(state.floor);
    }

    for (let v = 0; v < egoConfig.vBins; v++) {
        for (let h = 0; h < egoConfig.hBins; h++) {
            const idx = v * egoConfig.hBins + h;
            const { dir } = getEgoRayDirection(v, h);

            // Rotate direction by agent's Y rotation
            const rotatedDir = dir.clone();
            rotatedDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), agentRot);

            egoRayOrigin.set(agentPos.x, agentPos.y + egoConfig.agentHeight, agentPos.z);
            egoRaycaster.set(egoRayOrigin, rotatedDir);
            egoRaycaster.far = egoConfig.maxRange;

            // Only raycast against target objects
            const intersects = targetObjects.length > 0
                ? egoRaycaster.intersectObjects(targetObjects, true)
                : [];

            let distance = egoConfig.maxRange;
            let hit = false;
            let hitPoint = null;

            if (intersects.length > 0) {
                distance = intersects[0].distance;
                hitPoint = intersects[0].point.clone();
                hit = true;
                hitCount++;
                minDist = Math.min(minDist, distance);
            }

            // Store normalized distance
            egoTensorData[idx] = distance / egoConfig.maxRange;

            // Update whisker cylinder visualization - show only tip near hit point
            if (whiskers && whiskers[idx]) {
                const cylinder = whiskers[idx];

                if (hit) {
                    cylinder.visible = true;

                    // Tip length: shorter for close hits, longer for far hits
                    // Close = 0.1, Far = 0.5 of distance (inversely proportional visibility)
                    const normalizedDist = distance / egoConfig.maxRange;
                    const tipLength = 0.1 + normalizedDist * 0.4; // 0.1 to 0.5

                    // Position tip at the hit point, extending back toward agent
                    const tipEndX = hitPoint.x;
                    const tipEndY = hitPoint.y;
                    const tipEndZ = hitPoint.z;
                    const tipStartX = hitPoint.x - rotatedDir.x * tipLength;
                    const tipStartY = hitPoint.y - rotatedDir.y * tipLength;
                    const tipStartZ = hitPoint.z - rotatedDir.z * tipLength;

                    // Position at midpoint of tip
                    cylinder.position.set(
                        (tipStartX + tipEndX) / 2,
                        (tipStartY + tipEndY) / 2,
                        (tipStartZ + tipEndZ) / 2
                    );

                    // Scale Y to tip length
                    cylinder.scale.set(1, tipLength, 1);

                    // Orient cylinder along ray direction
                    cylinder.quaternion.setFromUnitVectors(
                        new THREE.Vector3(0, 1, 0),
                        rotatedDir
                    );

                    // Color: bright for close, dim for far (with brightness multiplier)
                    const baseBrightness = 1 - normalizedDist;
                    const brightness = Math.min(1, baseBrightness * egoConfig.brightnessMultiplier);
                    cylinder.material.color.setRGB(brightness, brightness, brightness);
                } else {
                    // Hide whisker when no hit
                    cylinder.visible = false;
                }
            }

            // Update point cloud for viewport2 - points in agent-relative space
            if (pointPositions) {
                const ptIdx = idx * 3;
                if (hit && hitPoint) {
                    // Transform hit point to agent-local coordinates
                    // Use world Y (not relative to agent) so points stay above floor plane
                    const relX = hitPoint.x - agentPos.x;
                    const relY = hitPoint.y;  // Keep world Y so floor stays at 0
                    const relZ = hitPoint.z - agentPos.z;

                    // Rotate back by agent rotation to get consistent forward view
                    const cosR = Math.cos(-agentRot);
                    const sinR = Math.sin(-agentRot);

                    pointPositions[ptIdx] = relX * cosR - relZ * sinR;
                    pointPositions[ptIdx + 1] = relY;
                    pointPositions[ptIdx + 2] = relX * sinR + relZ * cosR;

                    // Color based on distance with brightness multiplier
                    const baseBrightness = 1 - (distance / egoConfig.maxRange);
                    const brightness = Math.min(1, baseBrightness * egoConfig.brightnessMultiplier);
                    pointColors[ptIdx] = brightness;
                    pointColors[ptIdx + 1] = brightness;
                    pointColors[ptIdx + 2] = brightness;
                } else {
                    // No hit - hide point far away
                    pointPositions[ptIdx] = 0;
                    pointPositions[ptIdx + 1] = -100;
                    pointPositions[ptIdx + 2] = 0;
                }
            }
        }
    }

    if (egoPointCloud) {
        egoPointCloud.geometry.attributes.position.needsUpdate = true;
        egoPointCloud.geometry.attributes.color.needsUpdate = true;
    }

    // Update viewport2 camera to look at point cloud from behind agent perspective
    updateEgoViewportCamera();

    document.getElementById('detected-count').textContent = hitCount;
    const minDistEl = document.getElementById('min-distance');
    if (minDistEl) {
        minDistEl.textContent = (minDist < egoConfig.maxRange ? minDist.toFixed(2) : '--') + 'm';
    }

    updateTensorDisplay();

    // Log tensor output for debugging (only occasionally to avoid spam)
    if (Math.random() < 0.05) { // Log ~5% of frames
        console.log('Ego Tensor [' + egoConfig.vBins + 'x' + egoConfig.hBins + '] (normalized distances):');
        let tensorStr = '';
        for (let v = 0; v < egoConfig.vBins; v++) {
            let row = '';
            for (let h = 0; h < egoConfig.hBins; h++) {
                const val = egoTensorData[v * egoConfig.hBins + h];
                row += val.toFixed(2).padStart(5) + ' ';
            }
            tensorStr += row + '\n';
        }
        console.log(tensorStr);
    }
}

function updateTensorDisplay() {
    if (!egoTensorCells || !egoTensorData) return;

    const expectedCells = egoConfig.vBins * egoConfig.hBins;
    if (egoTensorCells.length !== expectedCells) {
        // Tensor size mismatch - recreate display
        createTensorDisplay();
        return;
    }

    for (let i = 0; i < egoTensorCells.length && i < egoTensorData.length; i++) {
        const cell = egoTensorCells[i];
        const normalizedDist = egoTensorData[i];

        // Close = bright yellow/white, far = dark blue (not pure black)
        const baseBrightness = 1 - normalizedDist;
        const brightness = Math.min(1, baseBrightness * egoConfig.brightnessMultiplier);

        // Use color gradient: bright hits are yellow-white, far/no-hit is dark blue
        const r = Math.round(brightness * 255);
        const g = Math.round(brightness * 255);
        const b = Math.round(30 + brightness * 225); // min 30 so "no hit" shows as dark blue
        cell.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }
}

// Reusable raycaster for ground projection
const groundRaycaster = new THREE.Raycaster();
const groundRayOrigin = new THREE.Vector3();
const groundRayDir = new THREE.Vector3(0, -1, 0);

function moveAgent(deltaX, deltaZ) {
    if (!egoAgentMarker) return;
    egoAgentMarker.position.x += deltaX;
    egoAgentMarker.position.z += deltaZ;
    // Use larger bounds for ego mode
    const range = EGO_FLOOR_RANGE;
    egoAgentMarker.position.x = Math.max(-range + 0.3, Math.min(range - 0.3, egoAgentMarker.position.x));
    egoAgentMarker.position.z = Math.max(-range + 0.3, Math.min(range - 0.3, egoAgentMarker.position.z));

    // Project agent onto geometry below
    projectAgentToGround();
}

function projectAgentToGround() {
    if (!egoAgentMarker) return;
    const state = window.appState;

    // Raycast from high above agent position downward
    groundRayOrigin.set(egoAgentMarker.position.x, 50, egoAgentMarker.position.z);
    groundRaycaster.set(groundRayOrigin, groundRayDir);
    groundRaycaster.far = 100;

    // Raycast against geometry and floor
    const targetObjects = [];
    if (state.cube && state.cube.visible) {
        targetObjects.push(state.cube);
    }
    if (state.floor) {
        targetObjects.push(state.floor);
    }

    if (targetObjects.length > 0) {
        const intersects = groundRaycaster.intersectObjects(targetObjects, true);
        if (intersects.length > 0) {
            // Place agent on top of the highest surface at this XZ position
            egoAgentMarker.position.y = intersects[0].point.y;
        }
    }
}

function rotateAgent(deltaAngle) {
    if (!egoAgentMarker) return;
    egoAgentMarker.rotation.y += deltaAngle;
}

function updateEgoViewportCamera() {
    // Sync camera2 with main camera (same position/rotation)
    const state = window.appState;
    if (!state.camera2 || !state.camera) return;

    state.camera2.position.copy(state.camera.position);
    state.camera2.quaternion.copy(state.camera.quaternion);
    state.camera2.fov = state.camera.fov;
    state.camera2.updateProjectionMatrix();
}

// Expose globally
window.initEgoSensor = initEgoSensor;
window.updateEgoSensor = updateEgoSensor;
window.updateEgoViewportCamera = updateEgoViewportCamera;
window.setActiveMode = setActiveMode;
window.moveAgent = moveAgent;
window.rotateAgent = rotateAgent;
window.egoConfig = egoConfig;
