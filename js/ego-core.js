/** Ego Sensor Core - Main update loop and raycasting logic */

function initEgoSensor() {
    egoTensorData = new Float32Array(egoConfig.vBins * egoConfig.hBins);
    setupEgoUI();
    createTensorDisplay();
    createAgentMarker();
    createEgoRayVisualization();
    createEgoPointCloud();
}

function reinitEgoSensor() {
    const state = window.appState;
    egoTensorData = new Float32Array(egoConfig.vBins * egoConfig.hBins);
    createTensorDisplay();
    createEgoRayVisualization();
    createEgoPointCloud();
    updateTensorShapeDisplay();

    if (state.sensorMode === 'ego') {
        if (egoRayHelper) egoRayHelper.visible = true;
        if (egoPointCloud) egoPointCloud.visible = true;
    }
}

function updateEgoSensor() {
    const state = window.appState;
    if (state.sensorMode !== 'ego' || !egoTensorData) return;

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

            const rotatedDir = dir.clone();
            rotatedDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), agentRot);

            egoRayOrigin.set(agentPos.x, agentPos.y + egoConfig.agentHeight, agentPos.z);
            egoRaycaster.set(egoRayOrigin, rotatedDir);
            egoRaycaster.far = egoConfig.maxRange;

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

            egoTensorData[idx] = distance / egoConfig.maxRange;

            if (whiskers && whiskers[idx]) {
                const cylinder = whiskers[idx];

                if (hit) {
                    cylinder.visible = true;

                    const normalizedDist = distance / egoConfig.maxRange;
                    const tipLength = 0.1 + normalizedDist * 0.4;

                    const tipEndX = hitPoint.x;
                    const tipEndY = hitPoint.y;
                    const tipEndZ = hitPoint.z;
                    const tipStartX = hitPoint.x - rotatedDir.x * tipLength;
                    const tipStartY = hitPoint.y - rotatedDir.y * tipLength;
                    const tipStartZ = hitPoint.z - rotatedDir.z * tipLength;

                    cylinder.position.set(
                        (tipStartX + tipEndX) / 2,
                        (tipStartY + tipEndY) / 2,
                        (tipStartZ + tipEndZ) / 2
                    );

                    cylinder.scale.set(1, tipLength, 1);

                    cylinder.quaternion.setFromUnitVectors(
                        new THREE.Vector3(0, 1, 0),
                        rotatedDir
                    );

                    const baseBrightness = 1 - normalizedDist;
                    const brightness = Math.min(1, baseBrightness * egoConfig.brightnessMultiplier);
                    cylinder.material.color.setRGB(brightness, brightness, brightness);
                } else {
                    cylinder.visible = false;
                }
            }

            if (pointPositions) {
                const ptIdx = idx * 3;
                if (hit && hitPoint) {
                    const relX = hitPoint.x - agentPos.x;
                    const relY = hitPoint.y;
                    const relZ = hitPoint.z - agentPos.z;

                    const cosR = Math.cos(-agentRot);
                    const sinR = Math.sin(-agentRot);

                    pointPositions[ptIdx] = relX * cosR - relZ * sinR;
                    pointPositions[ptIdx + 1] = relY;
                    pointPositions[ptIdx + 2] = relX * sinR + relZ * cosR;

                    const baseBrightness = 1 - (distance / egoConfig.maxRange);
                    const brightness = Math.min(1, baseBrightness * egoConfig.brightnessMultiplier);
                    pointColors[ptIdx] = brightness;
                    pointColors[ptIdx + 1] = brightness;
                    pointColors[ptIdx + 2] = brightness;
                } else {
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

    updateEgoViewportCamera();

    document.getElementById('detected-count').textContent = hitCount;
    const minDistEl = document.getElementById('min-distance');
    if (minDistEl) {
        minDistEl.textContent = (minDist < egoConfig.maxRange ? minDist.toFixed(2) : '--') + 'm';
    }

    updateTensorDisplay();

    if (Math.random() < 0.05) {
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

window.initEgoSensor = initEgoSensor;
window.updateEgoSensor = updateEgoSensor;
window.reinitEgoSensor = reinitEgoSensor;
