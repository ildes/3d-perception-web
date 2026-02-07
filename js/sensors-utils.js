/** Sensors - Utility functions for sensor management */

function recreateGrid() {
    const state = window.appState;

    // Update GridHelpers in both scenes
    updateGridHelpers(state.scene);
    updateGridHelpers(state.scene2);

    // Recreate sensor visualization in both scenes
    createSensorVisualization(state.scene);
    createHeightBars(state.scene2);

    // Recreate UI grid
    if (window.createSensorGridUI) {
        window.createSensorGridUI();
    }

    // Update grid selector
    if (window.initGridSelector) {
        window.initGridSelector();
    }
}

function updateGridHelpers(scene) {
    // Find and remove old GridHelper
    const oldHelper = scene.children.find(child => child instanceof THREE.GridHelper);
    if (oldHelper) {
        oldHelper.geometry.dispose();
        oldHelper.material.dispose();
        scene.remove(oldHelper);
    }

    // Create new GridHelper with updated size
    const gridHelper = new THREE.GridHelper(GRID_RANGE * 2, GRID_SIZE, 0x30363d, 0x21262d);
    scene.add(gridHelper);
}

// Expose globally
window.recreateGrid = recreateGrid;
