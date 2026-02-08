/** Ego Sensor UI - Mode switching, configuration UI, and floor management */

function setupEgoUI() {
    const hSlider = document.getElementById('ego-h-bins');
    const vSlider = document.getElementById('ego-v-bins');
    const rangeSlider = document.getElementById('ego-range');
    
    // Sync sliders with config values
    if (hSlider) {
        hSlider.value = egoConfig.hBins;
        document.getElementById('ego-h-value').textContent = egoConfig.hBins;
    }
    if (vSlider) {
        vSlider.value = egoConfig.vBins;
        document.getElementById('ego-v-value').textContent = egoConfig.vBins;
    }
    if (rangeSlider) {
        rangeSlider.value = egoConfig.maxRange;
        document.getElementById('ego-range-value').textContent = egoConfig.maxRange;
    }
    
    // Initialize up angle slider
    const upAngleSlider = document.getElementById('ego-up-angle');
    if (upAngleSlider) {
        upAngleSlider.value = egoConfig.vAngleMax;
        document.getElementById('ego-up-angle-value').textContent = (egoConfig.vAngleMax >= 0 ? '+' : '') + egoConfig.vAngleMax + '°';
        
        upAngleSlider.addEventListener('input', (e) => {
            egoConfig.vAngleMax = parseInt(e.target.value);
            document.getElementById('ego-up-angle-value').textContent = (egoConfig.vAngleMax >= 0 ? '+' : '') + egoConfig.vAngleMax + '°';
            
            if (typeof createEgoConeVisualization === 'function') {
                createEgoConeVisualization();
            }
        });
    }
    
    // Initialize down angle slider
    const downAngleSlider = document.getElementById('ego-down-angle');
    if (downAngleSlider) {
        downAngleSlider.value = egoConfig.vAngleMin;
        document.getElementById('ego-down-angle-value').textContent = (egoConfig.vAngleMin >= 0 ? '+' : '') + egoConfig.vAngleMin + '°';
        
        downAngleSlider.addEventListener('input', (e) => {
            egoConfig.vAngleMin = parseInt(e.target.value);
            document.getElementById('ego-down-angle-value').textContent = (egoConfig.vAngleMin >= 0 ? '+' : '') + egoConfig.vAngleMin + '°';
            
            if (typeof createEgoConeVisualization === 'function') {
                createEgoConeVisualization();
            }
        });
    }
    
    // Initialize horizontal FOV slider
    const hFovSlider = document.getElementById('ego-h-fov');
    if (hFovSlider) {
        const currentHFov = egoConfig.hAngleMax - egoConfig.hAngleMin;
        hFovSlider.value = currentHFov;
        document.getElementById('ego-h-fov-value').textContent = currentHFov + '°';
        
        hFovSlider.addEventListener('input', (e) => {
            const hFov = parseInt(e.target.value);
            egoConfig.hAngleMin = -hFov / 2;
            egoConfig.hAngleMax = hFov / 2;
            document.getElementById('ego-h-fov-value').textContent = hFov + '°';
            
            if (typeof createEgoConeVisualization === 'function') {
                createEgoConeVisualization();
            }
        });
    }
    
    // Initialize scaling mode dropdown
    const scalingModeSelect = document.getElementById('ego-scaling-mode');
    if (scalingModeSelect) {
        scalingModeSelect.value = egoConfig.scalingMode || 'minmax';
        scalingModeSelect.addEventListener('change', (e) => {
            egoConfig.scalingMode = e.target.value;
        });
    }

    // Whisker visibility toggle
    const whiskerToggle = document.getElementById('show-whiskers');
    if (whiskerToggle) {
        whiskerToggle.checked = true;
        whiskerToggle.addEventListener('change', (e) => {
            if (egoRayHelper) {
                egoRayHelper.visible = e.target.checked;
            }
        });
    }

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

    const brightnessSlider = document.getElementById('ego-brightness');
    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', (e) => {
            egoConfig.brightnessMultiplier = parseFloat(e.target.value);
            document.getElementById('ego-brightness-value').textContent = egoConfig.brightnessMultiplier.toFixed(1);
        });
    }

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

        resizeFloorForMode('ego');

        if (egoAgentMarker) egoAgentMarker.visible = true;
        if (egoRayHelper) egoRayHelper.visible = true;
        if (egoPointCloud) egoPointCloud.visible = true;
        if (state.sensorPoints) state.sensorPoints.visible = false;
        if (state.heightBars) state.heightBars.visible = false;
        
        // Hide cone when switching to ego mode
        if (egoConeMesh) egoConeMesh.visible = false;
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

        resizeFloorForMode('grid');

        if (egoAgentMarker) egoAgentMarker.visible = false;
        if (egoRayHelper) egoRayHelper.visible = false;
        if (egoPointCloud) egoPointCloud.visible = false;
        if (egoConeMesh) egoConeMesh.visible = false;
        if (state.sensorPoints) state.sensorPoints.visible = true;
        if (state.heightBars) state.heightBars.visible = true;
    }
}

function resizeFloorForMode(mode) {
    const state = window.appState;
    if (!state.scene || !state.floor) return;

    const floorRange = (mode === 'ego') ? EGO_FLOOR_RANGE : GRID_RANGE;
    const floorSize = floorRange * 2;

    if (state.floor.geometry) {
        state.floor.geometry.dispose();
    }

    state.floor.geometry = new THREE.PlaneGeometry(floorSize, floorSize);

    const gridHelpers = state.scene.children.filter(c => c instanceof THREE.GridHelper);
    gridHelpers.forEach(g => {
        state.scene.remove(g);
        if (g.geometry) g.geometry.dispose();
        if (g.material) g.material.dispose();
    });

    const gridHelper = new THREE.GridHelper(floorSize, (mode === 'ego') ? 60 : GRID_SIZE, 0x30363d, 0x21262d);
    state.scene.add(gridHelper);
}

function updateTensorShapeDisplay() {
    const el = document.getElementById('tensor-shape-display');
    if (el) el.textContent = `${egoConfig.vBins} × ${egoConfig.hBins} = ${egoConfig.vBins * egoConfig.hBins}`;
}

window.setActiveMode = setActiveMode;
window.resizeFloorForMode = resizeFloorForMode;
window.updateTensorShapeDisplay = updateTensorShapeDisplay;
window.setupEgoUI = setupEgoUI;
