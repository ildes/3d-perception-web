# Height Map Sensor Visualization - Agent Instructions

## Project Overview
Vanilla JavaScript/HTML visualization using Three.js for 3D rendering. Modular architecture with script-based loading (not ES6 modules).

## Commands

### Testing
```bash
# Run full test suite (Playwright)
node test_heightmap.js

# Run with specific timeout
node test_heightmap.js --timeout=5000
```

### Development
```bash
# Install dependencies
npm install

# Serve locally (Python)
python3 -m http.server 8080
# Then open http://localhost:8080
```

## Code Style

### JavaScript
- **Functions**: camelCase (e.g., `createSensorVisualization`)
- **Constants**: UPPER_SNAKE_CASE for module-level (e.g., `GRID_SIZE`)
- **State**: Global `window.appState` object for cross-module communication
- **Comments**: JSDoc-style header comments for each file/module
- **Dispose Pattern**: Always dispose Three.js geometries/materials before recreation

### Module Structure
Files load in order (see index.html):
1. `config.js` - Constants and configuration
2. `state.js` - Global state management
3. `scene.js` - Three.js scene setup
4. `sensors.js` - Sensor grid visualization
5. `ui.js` - UI components
6. `grid-selector.js` - Grid configuration UI
7. `controls.js` - Mouse/camera controls
8. `main.js` - Entry point

### Global Exposure
Expose public APIs via `window.`:
```javascript
window.updateGridConfig = updateGridConfig;
window.recreateGrid = recreateGrid;
```

### CSS
- Use kebab-case for IDs/classes
- Color scheme: Dark theme (#0d1117, #21262d, #58a6ff)
- Font: 'Courier New', monospace

## Error Handling
- Check for DOM element existence before manipulation
- Guard Three.js operations with null checks on state objects
- Console errors are captured in Playwright tests

## Testing Guidelines
- Tests use Playwright with headless Chromium
- Tests verify no console errors on page load
- Wait 3 seconds for full initialization before assertions
