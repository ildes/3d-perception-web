/** Ego Sensor Visualization - Agent marker, whiskers, point cloud */

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

    const ringGeo = new THREE.RingGeometry(0.3, 0.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: agentColor, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    agentGroup.add(ring);

    const arrowGeo = new THREE.ConeGeometry(0.15, 0.4, 8);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.rotation.x = Math.PI / 2;
    arrow.position.set(0, 0.03, 0.5);
    agentGroup.add(arrow);

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

    egoRayHelper = new THREE.Group();
    const whiskerRadius = 0.005;

    for (let v = 0; v < egoConfig.vBins; v++) {
        for (let h = 0; h < egoConfig.hBins; h++) {
            const { dir } = getEgoRayDirection(v, h);

            const cylGeo = new THREE.CylinderGeometry(whiskerRadius, whiskerRadius, 1, 4);
            const cylMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const cylinder = new THREE.Mesh(cylGeo, cylMat);

            cylinder.userData = { v, h, dir: dir.clone() };
            cylinder.scale.set(1, 0.001, 1);
            cylinder.visible = false;

            egoRayHelper.add(cylinder);
        }
    }

    egoRayHelper.visible = false;
    state.scene.add(egoRayHelper);
}

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

function createTensorDisplay() {
    const container = document.getElementById('ego-tensor-display');
    if (!container) return;

    container.innerHTML = '';

    const totalCells = egoConfig.vBins * egoConfig.hBins;
    console.log(`Creating tensor display: ${egoConfig.vBins}x${egoConfig.hBins} = ${totalCells} cells`);

    let html = `
        <div class="tensor-axis-label top">Back ← | Front | → Back</div>
        <div class="tensor-axis-label left">Down</div>
        <div class="ego-tensor-grid" style="grid-template-columns: repeat(${egoConfig.hBins}, 1fr); grid-template-rows: repeat(${egoConfig.vBins}, 1fr);">
    `;

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

function updateTensorDisplay() {
    if (!egoTensorCells || !egoTensorData) return;

    const expectedCells = egoConfig.vBins * egoConfig.hBins;
    if (egoTensorCells.length !== expectedCells) {
        createTensorDisplay();
        return;
    }

    for (let i = 0; i < egoTensorCells.length && i < egoTensorData.length; i++) {
        const cell = egoTensorCells[i];
        const normalizedDist = egoTensorData[i];

        const baseBrightness = 1 - normalizedDist;
        const brightness = Math.min(1, baseBrightness * egoConfig.brightnessMultiplier);

        const r = Math.round(brightness * 255);
        const g = Math.round(brightness * 255);
        const b = Math.round(30 + brightness * 225);
        cell.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }
}



function createEgoConeVisualization() {
    const state = window.appState;
    if (!state.scene) return;

    if (egoConeMesh) {
        state.scene.remove(egoConeMesh);
        egoConeMesh.geometry.dispose();
        egoConeMesh.material.dispose();
        egoConeMesh = null;
    }

    if (egoConeFadeTimeout) {
        clearTimeout(egoConeFadeTimeout);
        egoConeFadeTimeout = null;
    }

    const agentPos = egoAgentMarker ? egoAgentMarker.position.clone() : new THREE.Vector3(0, egoConfig.agentHeight, 0);
    agentPos.y = egoConfig.agentHeight;
    
    const maxRange = egoConfig.maxRange;
    const vMin = egoConfig.vAngleMin * Math.PI / 180;
    const vMax = egoConfig.vAngleMax * Math.PI / 180;
    const totalVAngle = vMax - vMin;
    
    // Create a cone geometry that represents the FOV
    // The cone points along -Y by default in Three.js, apex at top
    // We want the apex at the agent position, pointing forward (along -Z) but with vertical spread
    const coneHeight = maxRange;
    const coneRadius = maxRange * Math.tan(totalVAngle / 2);
    const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 64, 1, true);
    
    const coneMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    egoConeMesh = new THREE.Mesh(coneGeo, coneMat);
    
    // The cone points up (Y+) by default. We need to:
    // 1. Rotate it to point forward (-Z direction) 
    // 2. Apply the vertical midpoint rotation
    const midAngle = (vMin + vMax) / 2;
    
    // Rotate cone to point forward (-Z), then apply vertical tilt
    egoConeMesh.rotation.x = -Math.PI / 2 + midAngle;
    
    // Position the cone so its apex is at the agent position
    // The cone's origin is at its center, so we need to offset it by half height
    egoConeMesh.position.copy(agentPos);
    egoConeMesh.translateZ(-coneHeight / 2);

    state.scene.add(egoConeMesh);
    egoConeStartTime = Date.now();

    animateConeFade();
}

function animateConeFade() {
    if (!egoConeMesh) return;

    const elapsed = Date.now() - egoConeStartTime;
    const duration = 4000;
    const progress = Math.min(elapsed / duration, 1);

    egoConeMesh.material.opacity = 0.3 * (1 - progress);

    if (progress < 1) {
        requestAnimationFrame(animateConeFade);
    } else {
        const state = window.appState;
        if (state.scene && egoConeMesh) {
            state.scene.remove(egoConeMesh);
            egoConeMesh.geometry.dispose();
            egoConeMesh.material.dispose();
            egoConeMesh = null;
        }
    }
}

window.createEgoConeVisualization = createEgoConeVisualization;
