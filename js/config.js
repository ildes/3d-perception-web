/** Configuration - Dynamic Grid Settings */

// Default values - can be changed at runtime
const DEFAULT_GRID_SIZE = 8;
const GRID_RANGE = 3; // Reduced from 6 to 3
const EGO_FLOOR_RANGE = 30; // 10x larger floor for ego-centric mode

// These will be computed based on current grid size
let GRID_SIZE = DEFAULT_GRID_SIZE;
let GRID_CELL_SIZE = GRID_RANGE * 2 / GRID_SIZE;

function updateGridConfig(newSize) {
    GRID_SIZE = newSize;
    GRID_CELL_SIZE = GRID_RANGE * 2 / GRID_SIZE;
    
    // Update global state
    if (window.appState) {
        window.appState.sensorData = new Array(GRID_SIZE * GRID_SIZE).fill(0);
    }
}

// Expose globally
window.updateGridConfig = updateGridConfig;
