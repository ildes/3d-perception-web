/** Main Entry Point */

function init() {
    // Initialize state
    window.appState.sensorData = new Array(GRID_SIZE * GRID_SIZE).fill(0);
    
    const container = document.getElementById('viewport-container');
    const vp1 = document.getElementById('viewport1');
    const vp2 = document.getElementById('viewport2');
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Initialize scenes
    const mainScene = initMainScene(container, w, h);
    const sensorScene = initSensorScene(container, w, h);

    // Store in global state
    window.appState.scene = mainScene.scene;
    window.appState.camera = mainScene.camera;
    window.appState.renderer = mainScene.renderer;
    window.appState.scene2 = sensorScene.scene2;
    window.appState.camera2 = sensorScene.camera2;
    window.appState.renderer2 = sensorScene.renderer2;

    // Create initial geometry
    createGeometry('cube', mainScene.scene);

    // Create visualizations
    createSensorVisualization(mainScene.scene);
    createHeightBars(sensorScene.scene2);

    // Create UI
    createSensorGridUI();
    initGridSelector();
    updateGridSizeDisplay();

    // Attach canvases to viewports
    vp1.appendChild(mainScene.renderer.domElement);
    vp2.appendChild(sensorScene.renderer2.domElement);

    // Event listeners
    mainScene.renderer.domElement.addEventListener('mousedown', onMouseDown);
    mainScene.renderer.domElement.addEventListener('mousemove', onMouseMove);
    mainScene.renderer.domElement.addEventListener('mouseup', onMouseUp);
    mainScene.renderer.domElement.addEventListener('wheel', onMouseWheel);

    sensorScene.renderer2.domElement.addEventListener('mousedown', onMouseDown2);
    sensorScene.renderer2.domElement.addEventListener('mousemove', onMouseMove2);
    sensorScene.renderer2.domElement.addEventListener('mouseup', onMouseUp2);
    sensorScene.renderer2.domElement.addEventListener('wheel', onMouseWheel2);

    document.getElementById('geometry-select').addEventListener('change', onGeometryChange);
    window.addEventListener('resize', onWindowResize);

    // Initial sensor update
    updateSensorData();
}

function animate() {
    requestAnimationFrame(animate);

    const state = window.appState;
    const time = Date.now() * 0.001;
    
    if (!state.isDragging && state.cube) {
        state.cube.rotation.y = time * 0.5;
    }

    updateSensorData();

    if (state.renderer && state.scene && state.camera) {
        state.renderer.clear();
        state.renderer.render(state.scene, state.camera);
    }

    if (state.renderer2 && state.scene2 && state.camera2) {
        state.renderer2.clear();
        state.renderer2.render(state.scene2, state.camera2);
    }
}

// Start application
init();
animate();
