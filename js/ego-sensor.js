/** Ego-Centric Spherical Sensor */

// Ego sensor configuration
const egoConfig = {
    hBins: 16,          // Horizontal angle bins (around agent)
    vBins: 8,           // Vertical angle bins (up/down)
    maxRange: 5,        // Max detection range in meters
    vAngleMin: -60,     // Looking down (degrees)
    vAngleMax: 30,      // Looking up (degrees)
    hAngleMin: -180,    // Full 360
    hAngleMax: 180,
    agentHeight: 1.0    // Height of sensor origin from ground
};

// Ego sensor state
let egoTensorData = null;
let egoRayHelper = null;
let egoAgentMarker = null;
let egoTensorCells = null;
let egoDepthBars = null; // Height bars for ego mode viewport

// Reusable objects for raycasting
const egoRaycaster = new THREE.Raycaster();
const egoRayOrigin = new THREE.Vector3();
const egoRayDir = new THREE.Vector3();

function initEgoSensor() {
    egoTensorData = new Float32Array(egoConfig.vBins * egoConfig.hBins);
    setupEgoUI();
    createTensorDisplay();
    createAgentMarker();
    createEgoRayVisualization();
    createEgoDepthBars();
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
        viewport2Label.textContent = 'DEPTH SENSOR VIEW';
        updateTensorShapeDisplay();

        // Show ego visualizations
        if (egoAgentMarker) egoAgentMarker.visible = true;
        if (egoRayHelper) egoRayHelper.visible = true;
        if (egoDepthBars) egoDepthBars.visible = true;
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

        // Show grid visualizations
        if (egoAgentMarker) egoAgentMarker.visible = false;
        if (egoRayHelper) egoRayHelper.visible = false;
        if (egoDepthBars) egoDepthBars.visible = false;
        if (state.sensorPoints) state.sensorPoints.visible = true;
        if (state.heightBars) state.heightBars.visible = true;
    }
}

function reinitEgoSensor() {
    egoTensorData = new Float32Array(egoConfig.vBins * egoConfig.hBins);
    createTensorDisplay();
    createEgoRayVisualization();
    createEgoDepthBars();
    updateTensorShapeDisplay();
}

function updateTensorShapeDisplay() {
    const el = document.getElementById('tensor-shape-display');
    if (el) el.textContent = `${egoConfig.vBins} × ${egoConfig.hBins}`;
}

function createTensorDisplay() {
    const container = document.getElementById('ego-tensor-display');
    if (!container) return;

    // Grid of colored cells only (no numbers)
    let html = `
        <div class="tensor-axis-label top">← Back | Front →</div>
        <div class="tensor-axis-label left">Up</div>
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
    egoTensorCells = container.querySelectorAll('.ego-tensor-cell');
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
        egoRayHelper.geometry.dispose();
        egoRayHelper.material.dispose();
    }

    const rayPositions = [];
    const rayColors = [];

    for (let v = 0; v < egoConfig.vBins; v++) {
        for (let h = 0; h < egoConfig.hBins; h++) {
            rayPositions.push(0, egoConfig.agentHeight, 0);
            rayColors.push(1.0, 1.0, 0.0); // Yellow

            const { dir } = getEgoRayDirection(v, h);
            rayPositions.push(dir.x * 0.5, egoConfig.agentHeight + dir.y * 0.5, dir.z * 0.5);
            rayColors.push(1.0, 0.5, 0.0); // Orange
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(rayPositions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(rayColors, 3));

    const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        linewidth: 2 // Note: may not work on all platforms
    });

    egoRayHelper = new THREE.LineSegments(geometry, material);
    egoRayHelper.visible = false;
    state.scene.add(egoRayHelper);
}

// Create depth visualization bars for ego mode (in scene2)
function createEgoDepthBars() {
    const state = window.appState;
    if (!state.scene2) return;

    if (egoDepthBars) {
        state.scene2.remove(egoDepthBars);
        egoDepthBars.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    const barsGroup = new THREE.Group();

    // Create a grid of bars representing the sensor tensor
    // Layout: horizontal = h bins, depth = v bins
    const barWidth = 0.3;
    const spacing = 0.35;
    const totalWidth = egoConfig.hBins * spacing;
    const totalDepth = egoConfig.vBins * spacing;

    for (let v = 0; v < egoConfig.vBins; v++) {
        for (let h = 0; h < egoConfig.hBins; h++) {
            const barMat = new THREE.MeshStandardMaterial({
                color: 0x888888,
                metalness: 0.3,
                roughness: 0.7
            });

            const barGeo = new THREE.BoxGeometry(barWidth, 0.1, barWidth);
            const bar = new THREE.Mesh(barGeo, barMat);

            // Position: center the grid
            const x = (h - egoConfig.hBins / 2 + 0.5) * spacing;
            const z = (v - egoConfig.vBins / 2 + 0.5) * spacing;

            bar.position.set(x, 0.05, z);
            bar.userData = { vIdx: v, hIdx: h };
            barsGroup.add(bar);
        }
    }

    barsGroup.visible = false;
    state.scene2.add(barsGroup);
    egoDepthBars = barsGroup;
}

function getEgoRayDirection(vIndex, hIndex) {
    const vAngle = egoConfig.vAngleMin +
        (vIndex / Math.max(1, egoConfig.vBins - 1)) * (egoConfig.vAngleMax - egoConfig.vAngleMin);
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

    const agentPos = egoAgentMarker ? egoAgentMarker.position : new THREE.Vector3(0, 0, 0);
    const agentRot = egoAgentMarker ? egoAgentMarker.rotation.y : 0;
    const rayPositions = egoRayHelper?.geometry.attributes.position.array;
    const rayColors = egoRayHelper?.geometry.attributes.color.array;

    let minDist = egoConfig.maxRange;
    let hitCount = 0;

    // Build exclusion set
    const excludeObjects = new Set();
    if (egoAgentMarker) egoAgentMarker.traverse(obj => excludeObjects.add(obj));
    if (egoRayHelper) excludeObjects.add(egoRayHelper);
    if (state.sensorPoints) excludeObjects.add(state.sensorPoints);
    if (egoDepthBars) egoDepthBars.traverse(obj => excludeObjects.add(obj));

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

            // Store normalized distance
            egoTensorData[idx] = distance / egoConfig.maxRange;

            // Update ray visualization
            if (rayPositions) {
                const rayIdx = idx * 6;
                rayPositions[rayIdx] = agentPos.x;
                rayPositions[rayIdx + 1] = agentPos.y + egoConfig.agentHeight;
                rayPositions[rayIdx + 2] = agentPos.z;

                const endDist = hit ? distance : egoConfig.maxRange * 0.3;
                rayPositions[rayIdx + 3] = agentPos.x + rotatedDir.x * endDist;
                rayPositions[rayIdx + 4] = agentPos.y + egoConfig.agentHeight + rotatedDir.y * endDist;
                rayPositions[rayIdx + 5] = agentPos.z + rotatedDir.z * endDist;

                // Color: bright yellow/orange when hit, dim when miss
                const colorIdx = idx * 6;
                if (hit) {
                    const t = distance / egoConfig.maxRange;
                    rayColors[colorIdx] = 1.0;
                    rayColors[colorIdx + 1] = 1 - t * 0.5;
                    rayColors[colorIdx + 2] = 0;
                    rayColors[colorIdx + 3] = 1.0;
                    rayColors[colorIdx + 4] = 0.5 - t * 0.3;
                    rayColors[colorIdx + 5] = 0;
                } else {
                    rayColors[colorIdx] = 0.3;
                    rayColors[colorIdx + 1] = 0.3;
                    rayColors[colorIdx + 2] = 0.3;
                    rayColors[colorIdx + 3] = 0.2;
                    rayColors[colorIdx + 4] = 0.2;
                    rayColors[colorIdx + 5] = 0.2;
                }
            }

            // Update depth bars in scene2
            if (egoDepthBars && egoDepthBars.children[idx]) {
                const bar = egoDepthBars.children[idx];
                // Height represents closeness (inverse of distance)
                const normalizedDist = distance / egoConfig.maxRange;
                const barHeight = Math.max(0.05, (1 - normalizedDist) * 2);

                bar.geometry.dispose();
                bar.geometry = new THREE.BoxGeometry(0.25, barHeight, 0.25);
                bar.position.y = barHeight / 2;

                // Color: white = close, black = far
                const brightness = 1 - normalizedDist;
                bar.material.color.setRGB(brightness, brightness, brightness);
                bar.material.emissive.setRGB(brightness * 0.3, brightness * 0.3, brightness * 0.3);
            }
        }
    }

    if (egoRayHelper) {
        egoRayHelper.geometry.attributes.position.needsUpdate = true;
        egoRayHelper.geometry.attributes.color.needsUpdate = true;
    }

    document.getElementById('detected-count').textContent = hitCount;
    const minDistEl = document.getElementById('min-distance');
    if (minDistEl) {
        minDistEl.textContent = (minDist < egoConfig.maxRange ? minDist.toFixed(2) : '--') + 'm';
    }

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
    }
}

function moveAgent(deltaX, deltaZ) {
    if (!egoAgentMarker) return;
    egoAgentMarker.position.x += deltaX;
    egoAgentMarker.position.z += deltaZ;
    egoAgentMarker.position.x = Math.max(-GRID_RANGE + 0.3, Math.min(GRID_RANGE - 0.3, egoAgentMarker.position.x));
    egoAgentMarker.position.z = Math.max(-GRID_RANGE + 0.3, Math.min(GRID_RANGE - 0.3, egoAgentMarker.position.z));
}

function rotateAgent(deltaAngle) {
    if (!egoAgentMarker) return;
    egoAgentMarker.rotation.y += deltaAngle;
}

function updateEgoViewportCamera() {
    const state = window.appState;
    if (!state.camera2 || !egoDepthBars) return;

    // Position camera to look at depth bars from above-front
    state.camera2.position.set(0, 4, 5);
    state.camera2.lookAt(0, 0, 0);
    state.camera2.fov = 50;
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
