/** Controls - Camera and Object Manipulation */

function rotateCamera(deltaX, deltaY) {
    const state = window.appState;
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(state.camera.position);
    spherical.theta -= deltaX * 0.005;
    spherical.phi -= deltaY * 0.005;
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

    state.camera.position.setFromSpherical(spherical);
    state.camera.lookAt(0, 0, 0);

    state.camera2.position.copy(state.camera.position);
    state.camera2.lookAt(0, 0, 0);
}

function zoomCamera(delta) {
    const state = window.appState;
    const zoomFactor = 1 + delta * 0.001;
    state.camera.position.multiplyScalar(zoomFactor);
    state.camera.position.clampLength(2, 40); // Extended range for larger floor

    state.camera2.position.copy(state.camera.position);
    state.camera2.lookAt(0, 0, 0);
}

function onMouseDown(event) {
    window.appState.isDragging = true;
    window.appState.activeRenderer = 'camera';
    window.appState.previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onMouseDown2(event) {
    window.appState.isDragging = true;
    window.appState.isMovingObject = true;
    window.appState.isRotatingAgent = event.shiftKey || event.button === 2;
    window.appState.previousMousePosition = { x: event.clientX, y: event.clientY };

    // Prevent context menu on right-click
    if (event.button === 2) event.preventDefault();
}

function onMouseMove2(event) {
    const state = window.appState;
    if (!state.isDragging || !state.isMovingObject) return;

    const deltaX = event.clientX - state.previousMousePosition.x;
    const deltaY = event.clientY - state.previousMousePosition.y;

    if (state.sensorMode === 'ego') {
        if (state.isRotatingAgent) {
            // Rotate agent with shift+drag or right-click drag
            rotateAgent(-deltaX * 0.015);
        } else {
            // Move agent in ego mode
            moveAgent(deltaY * 0.015, -deltaX * 0.015);
        }
    } else {
        // Move object in grid mode
        state.cube.position.x += deltaY * 0.015;
        state.cube.position.z -= deltaX * 0.015;
        state.cube.position.x = Math.max(-GRID_RANGE + 0.5, Math.min(GRID_RANGE - 0.5, state.cube.position.x));
        state.cube.position.z = Math.max(-GRID_RANGE + 0.5, Math.min(GRID_RANGE - 0.5, state.cube.position.z));
    }

    state.previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onMouseUp2() {
    window.appState.isDragging = false;
    window.appState.isMovingObject = false;
    window.appState.isRotatingAgent = false;
}

function onMouseMove(event) {
    const state = window.appState;
    if (!state.isDragging || state.activeRenderer !== 'camera') return;

    const deltaX = event.clientX - state.previousMousePosition.x;
    const deltaY = event.clientY - state.previousMousePosition.y;

    rotateCamera(deltaX, deltaY);

    state.previousMousePosition = { x: event.clientX, y: event.clientY };
}

function onMouseUp() {
    window.appState.isDragging = false;
    window.appState.activeRenderer = null;
}

function onMouseWheel(event) {
    event.preventDefault();
    zoomCamera(event.deltaY);
}

function onMouseWheel2(event) {
    event.preventDefault();
    zoomCamera(event.deltaY);
}

function onWindowResize() {
    const state = window.appState;
    const container = document.getElementById('viewport-container');
    const w = container.clientWidth;
    const h = container.clientHeight;

    state.camera.aspect = (w * 0.5) / h;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(w, h);

    state.camera2.aspect = (w * 0.5) / h;
    state.camera2.updateProjectionMatrix();
    state.renderer2.setSize(w, h);

    if (window.initHeightChart) {
        window.initHeightChart();
    }
    if (window.drawHeightChart) {
        window.drawHeightChart();
    }
}
