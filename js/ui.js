/** UI - UI Components and Updates */

function createSensorGridUI() {
    const gridContainer = document.getElementById('sensor-grid');
    gridContainer.innerHTML = ''; // Clear existing
    
    // Update grid CSS to match current size
    gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'sensor-cell';
        cell.dataset.index = i;
        gridContainer.appendChild(cell);
    }
}

function updateGridSizeDisplay() {
    document.getElementById('grid-size-display').textContent = `${GRID_SIZE} × ${GRID_SIZE}`;
    
    const preview = document.getElementById('grid-selector-preview');
    if (preview) {
        preview.textContent = `${GRID_SIZE} × ${GRID_SIZE}`;
    }
}

// Expose globally
window.createSensorGridUI = createSensorGridUI;
window.updateGridSizeDisplay = updateGridSizeDisplay;
