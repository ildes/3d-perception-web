# Height Map Sensor Visualization - Agent Instructions

## Project Overview
Vanilla JavaScript/HTML visualization using Three.js (r128) for 3D rendering. Designed for humanoid motion generation model to "see" the environment via tensor-based sensor outputs. Modular architecture with script-based loading (not ES6 modules).

## File Structure

```
grid/
├── index.html          # Main HTML, UI controls, script loading order
├── css/styles.css      # All styling, dark theme, tensor display grid
├── js/
│   ├── config.js       # Constants: GRID_RANGE=3, EGO_FLOOR_RANGE=30, DEFAULT_GRID_SIZE=8
│   ├── state.js        # Global window.appState object
│   ├── scene.js        # Three.js setup, ALL geometry creation functions
│   ├── sensors.js      # Grid mode sensor (top-down heightmap)
│   ├── ui.js           # UI components for grid mode
│   ├── grid-selector.js # Grid size selector UI
│   ├── controls.js     # Mouse/camera controls for both viewports
│   ├── ego-sensor.js   # Ego-centric mode: raycasting, whiskers, point cloud, agent movement
│   └── main.js         # Entry point: init(), animate() loop
├── test_heightmap.js   # Playwright test
└── AGENTS.md           # This file
```

## Sensor Modes

### Grid Mode (Top-Down)
- Aerial height-map sensor projecting rays downward onto a configurable grid
- Output: `[GRID_SIZE × GRID_SIZE]` tensor of height values
- Visualization: Height-displaced bars with orange color, sensor points in left viewport also displaced
- UI: Packed grid display (no gaps/margins) with horizontal flip to match 3D view
- Use case: Understanding terrain/obstacles from bird's eye view

### Ego-Centric Mode
- Spherical raycasting from agent's perspective at `agentHeight` (1.0m)
- Output: `[V_BINS × H_BINS]` tensor of normalized distances (0=close, 1=far/max range)
- Vertical FOV: -60° (down) to +30° (up)
- Horizontal FOV: Full 360° (cylinder unwrap: center=forward, edges=back)
- Whisker visualization: Only shows tips near hit points (shorter=closer, longer=farther)
- Agent projects onto geometry (walks on top of stairs, tables, etc.)
- Floor size: 60×60 units in ego mode (10x larger than grid mode)
- Use case: First-person spatial understanding for RL training

## Key Functions by File

### config.js
```javascript
GRID_RANGE = 3;            // Grid mode floor ±3 units
EGO_FLOOR_RANGE = 30;      // Ego mode floor ±30 units (10x larger)
DEFAULT_GRID_SIZE = 8;
updateGridConfig(newSize)  // Updates grid dimensions
```

### scene.js - Geometry Creation
```javascript
createGeometry(type, scene)     // Main dispatcher, handles disposal
createPyramidStairs(material)   // Isaac Gym style concentric stairs
createRoughTerrain(material)    // Random elevation bumps (smoothed)
createSteppingStones(material)  // Irregular platforms with gaps
createInteriorRoom(material)    // Room with walls, door, table
createCorridor(material)        // Long hallway with obstacles
createStairs(material)          // Simple 4-step stairs
createChair(material)           // Chair with legs
createWall(material)            // Simple wall
createTallWall(material)        // Giant wall
```

### ego-sensor.js - Ego Mode Core
```javascript
egoConfig = {
    hBins: 32,              // Horizontal bins (8-64)
    vBins: 16,              // Vertical bins (4-32)
    maxRange: 20,           // Max raycast distance
    vAngleMin: -60,         // Look down angle
    vAngleMax: 30,          // Look up angle
    agentHeight: 1.0,       // Sensor origin height
    brightnessMultiplier: 2.0
};

initEgoSensor()             // Setup tensor, UI, markers, whiskers, point cloud
setActiveMode(mode)         // Switch 'grid'/'ego', resizes floor
resizeFloorForMode(mode)    // Swaps floor geometry and grid helper
updateEgoSensor()           // Main update: raycasting, whiskers, point cloud, tensor
moveAgent(deltaX, deltaZ)   // Move agent with ground projection
projectAgentToGround()      // Raycast down to place agent on geometry
rotateAgent(deltaAngle)     // Rotate agent heading
createTensorDisplay()       // Build HTML grid for tensor visualization
updateTensorDisplay()       // Color cells by distance (yellow=close, blue=far)
```

### controls.js - Input Handling
```javascript
onMouseDown/Move/Up(e)      // Left viewport: camera orbit
onMouseDown2/Move2/Up2(e)   // Right viewport: object/agent drag
onMouseWheel/Wheel2(e)      // Zoom controls
// Ego mode: Shift+drag or right-click drag = rotate agent
```

### main.js - App Lifecycle
```javascript
init()      // Setup scenes, create geometry, attach events
animate()   // Render loop, calls updateEgoSensor() or updateSensorData()
// Spin checkbox controls object rotation
```

## Commands

### Testing
```bash
node test_heightmap.js          # Playwright test with mode switching
```

### Development
```bash
npm install                     # Install Playwright
python3 -m http.server 8080     # Serve locally
# Open http://localhost:8080
```

## Code Style

### JavaScript
- **Functions**: camelCase (e.g., `createSensorVisualization`)
- **Constants**: UPPER_SNAKE_CASE for module-level (e.g., `GRID_SIZE`, `GRID_RANGE`)
- **State**: Global `window.appState` object for cross-module communication
- **Dispose Pattern**: Always dispose Three.js geometries/materials before recreation
- **Raycasting**: Whitelist approach - raycast against `[state.cube, state.floor]`

### CSS
- Use kebab-case for IDs/classes
- Color scheme: Dark theme (#0d1117, #21262d, #58a6ff)
- Tensor grid uses `scaleY(-1)` to flip vertically

## Global State (window.appState)
```javascript
{
    scene, camera, renderer,      // Left viewport (3D scene)
    scene2, camera2, renderer2,   // Right viewport (sensor data)
    cube,                         // Current geometry object
    floor,                        // Floor plane for raycasting
    sensorPoints,                 // Grid mode point visualization
    heightBars,                   // Grid mode bar visualization
    sensorMode,                   // 'grid' or 'ego'
    sensorData,                   // Grid mode height array
    isDragging                    // Drag state
}
```

## Available Geometries
**Basic:** Empty Scene, Cube, Sphere, Cylinder, Cone, Torus
**Structures:** Wall, Giant Tall Wall, Chair, Stairs
**Isaac Gym Terrains:** Pyramid Stairs, Rough Terrain, Stepping Stones
**Interior Spaces:** Room w/ Table, Corridor

## Controls
| Viewport | Action | Effect |
|----------|--------|--------|
| Left (3D) | Drag | Orbit camera |
| Left (3D) | Scroll | Zoom |
| Right (Sensor) | Drag | Move object (grid) / agent (ego) |
| Right (Sensor) | Shift+Drag | Rotate agent (ego only) |
| Right (Sensor) | Right-drag | Rotate agent (ego only) |
| Right (Sensor) | Scroll | Zoom |

## Adding New Geometry
1. Add case to `createGeometry()` switch in `scene.js`
2. Create `createYourGeometry(material)` function returning THREE.Mesh or THREE.Group
3. Add `<option value="your-geometry">Label</option>` to `#geometry-select` in `index.html`
4. For terrain groups, use `optgroup` for organization
