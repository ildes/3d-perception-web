/** Grid Selector - Interactive Grid Size Configuration */

let isSelecting = false;
let selectedSize = 8;

function initGridSelector() {
    const container = document.getElementById('grid-selector-cells');
    const slider = document.getElementById('grid-size-slider');
    
    if (!container || !slider) return;
    
    // Initialize with current grid size
    selectedSize = GRID_SIZE;
    slider.value = selectedSize;
    
    // Build the selector grid (16x16 max)
    buildSelectorGrid(container);
    
    // Highlight current selection
    updateSelectorHighlight(container, selectedSize);
    
    // Slider event
    slider.addEventListener('input', (e) => {
        selectedSize = parseInt(e.target.value);
        updateSelectorHighlight(container, selectedSize);
        updateGridSizeDisplay();
    });
    
    slider.addEventListener('change', (e) => {
        selectedSize = parseInt(e.target.value);
        applyGridSize(selectedSize);
    });
    
    // Mouse interaction for direct selection
    container.addEventListener('mousedown', (e) => {
        isSelecting = true;
        handleGridSelection(e, container);
    });
    
    container.addEventListener('mousemove', (e) => {
        if (isSelecting) {
            handleGridSelection(e, container);
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isSelecting) {
            isSelecting = false;
            applyGridSize(selectedSize);
        }
    });
    
    // Touch support
    container.addEventListener('touchstart', (e) => {
        isSelecting = true;
        handleGridSelection(e.touches[0], container);
        e.preventDefault();
    });
    
    container.addEventListener('touchmove', (e) => {
        if (isSelecting) {
            handleGridSelection(e.touches[0], container);
            e.preventDefault();
        }
    });
    
    document.addEventListener('touchend', () => {
        if (isSelecting) {
            isSelecting = false;
            applyGridSize(selectedSize);
        }
    });
}

function buildSelectorGrid(container) {
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(16, 1fr)';
    container.style.gridTemplateRows = 'repeat(16, 1fr)';
    container.style.gap = '1px';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.maxWidth = '140px';
    container.style.maxHeight = '140px';
    
    for (let i = 0; i < 256; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-selector-cell';
        cell.dataset.index = i;
        cell.dataset.row = Math.floor(i / 16);
        cell.dataset.col = i % 16;
        container.appendChild(cell);
    }
}

function handleGridSelection(e, container) {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const cellSize = rect.width / 16;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    // Clamp to valid range (4-16, even numbers)
    let size = Math.max(4, Math.min(16, Math.max(col, row) + 1));
    size = Math.ceil(size / 2) * 2; // Round to even number
    
    if (size !== selectedSize) {
        selectedSize = size;
        document.getElementById('grid-size-slider').value = selectedSize;
        updateSelectorHighlight(container, selectedSize);
        updateGridSizeDisplay();
    }
}

function updateSelectorHighlight(container, size) {
    const cells = container.querySelectorAll('.grid-selector-cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        cell.classList.toggle('active', row < size && col < size);
    });
}

function applyGridSize(newSize) {
    if (newSize === GRID_SIZE) return;
    
    // Update config
    updateGridConfig(newSize);
    
    // Update UI
    updateGridSizeDisplay();
    
    // Recreate all grid-related elements
    recreateGrid();
    
    console.log(`Grid size changed to ${newSize}×${newSize}`);
}

// Expose globally
window.initGridSelector = initGridSelector;
