/** State Management - Dynamic State */
const state = {
    scene: null,
    camera: null,
    renderer: null,
    scene2: null,
    camera2: null,
    renderer2: null,
    cube: null,
    sensorPoints: null,
    heightBars: null,
    sensorData: [], // Will be initialized based on GRID_SIZE
    isDragging: false,
    activeRenderer: null,
    previousMousePosition: { x: 0, y: 0 },
    isMovingObject: false,
    sensorMode: 'grid' // 'grid' or 'ego'
};

// Make state globally accessible for other modules
window.appState = state;
