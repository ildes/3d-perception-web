# Height Map Sensor Visualization - Agent Instructions

## Project Overview
Vanilla JavaScript/HTML visualization using Three.js (r128) for 3D rendering. Designed for humanoid motion generation model to "see" the environment via tensor-based sensor outputs. Modular architecture with script-based loading (not ES6 modules).

## File Structure

```
grid/
├── index.html              # Main HTML, UI controls, script loading order
├── css/styles.css          # All styling, dark theme, tensor display grid
├── js/
│   ├── config.js           # Constants: GRID_RANGE=3, EGO_FLOOR_RANGE=30, DEFAULT_GRID_SIZE=8
│   ├── state.js            # Global window.appState object
│   ├── scene-core.js       # Three.js scene setup (cameras, lights, renderers)
│   ├── geometries.js       # ALL geometry creation functions (449 lines)
│   ├── sensors.js          # Grid mode sensor (top-down heightmap)
│   ├── ui.js               # UI components for grid mode
│   ├── grid-selector.js    # Grid size selector UI
│   ├── controls.js         # Mouse/camera controls for both viewports
│   ├── ego-config.js       # Ego sensor configuration and state (28 lines)
│   ├── ego-visualization.js # Agent markers, whiskers, point cloud, tensor display (187 lines)
│   ├── ego-ui.js           # Mode switching and UI management (135 lines)
│   ├── ego-core.js         # Main update loop and raycasting (178 lines)
│   ├── ego-agent.js        # Agent movement and rotation (59 lines)
│   └── main.js             # Entry point: init(), animate() loop
├── test_heightmap.js       # Playwright test
└── AGENTS.md               # This file
```

## Sensor Modes

### Grid Mode (Top-Down)
- Aerial height-map sensor projecting rays downward onto a configurable grid
- Output: `[GRID_SIZE × GRID_SIZE]` tensor of height values
- Visualization: Height-displaced bars with orange color, sensor points in left viewport also displaced
- UI: Packed grid display (no gaps/margins) with horizontal flip to match 3D view
- Use case: Understanding terrain/obstacles from bird's eye view

### Ego-Centric Mode (Default)
- Spherical raycasting from agent's perspective at `agentHeight` (1.0m)
- Output: `[V_BINS × H_BINS]` tensor of normalized distances (0=close, 1=far/max range)
- **Default config**: 64×32 bins, 5m range, 1.5 brightness
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

### scene-core.js - Scene Setup
```javascript
initMainScene(container, w, h)   // Setup left viewport (3D scene)
initSensorScene(container, w, h) // Setup right viewport (sensor view)
onGeometryChange(event)          // Geometry select handler
```

### geometries.js - Geometry Creation
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

### ego-config.js - Configuration
```javascript
egoConfig = {
    hBins: 64,              // Horizontal bins (8-64)
    vBins: 32,              // Vertical bins (4-32)
    maxRange: 5,            // Max raycast distance
    vAngleMin: -60,         // Look down angle
    vAngleMax: 30,          // Look up angle
    agentHeight: 1.0,       // Sensor origin height
    brightnessMultiplier: 1.5
};
```

### ego-core.js - Sensor Loop
```javascript
initEgoSensor()             // Setup tensor, UI, markers, whiskers, point cloud
reinitEgoSensor()           // Recreate sensor when bins change
updateEgoSensor()           // Main update: raycasting, whiskers, point cloud, tensor
```

### ego-ui.js - Mode Management
```javascript
setActiveMode(mode)         // Switch 'grid'/'ego', resizes floor
resizeFloorForMode(mode)    // Swaps floor geometry and grid helper
updateTensorShapeDisplay()  // Update tensor shape UI
```

### ego-visualization.js - Visual Elements
```javascript
createAgentMarker()         // Ground ring, arrow, sensor indicator
createEgoRayVisualization() // Whisker cylinders for ray hits
createEgoPointCloud()       // Point cloud for viewport2
createTensorDisplay()       // Build HTML grid for tensor visualization
updateTensorDisplay()       // Color cells by distance (yellow=close, blue=far)
getEgoRayDirection(v, h)    // Calculate ray direction for bin
```

### ego-agent.js - Agent Control
```javascript
moveAgent(deltaX, deltaZ)   // Move agent with ground projection
projectAgentToGround()      // Raycast down to place agent on geometry
rotateAgent(deltaAngle)     // Rotate agent heading
updateEgoViewportCamera()   // Sync camera2 with main camera
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
1. Add case to `createGeometry()` switch in `geometries.js`
2. Create `createYourGeometry(material)` function returning THREE.Mesh or THREE.Group
3. Add `<option value="your-geometry">Label</option>` to `#geometry-select` in `index.html`
4. For terrain groups, use `optgroup` for organization

## Script Loading Order (index.html)
Scripts must load in dependency order:
```html
<script src="js/config.js"></script>
<script src="js/state.js"></script>
<script src="js/geometries.js"></script>    <!-- createGeometry() used by scene-core -->
<script src="js/scene-core.js"></script>    <!-- Depends on geometries -->
<script src="js/sensors.js"></script>
<script src="js/ui.js"></script>
<script src="js/grid-selector.js"></script>
<script src="js/controls.js"></script>
<script src="js/ego-config.js"></script>    <!-- Must load before ego-* modules -->
<script src="js/ego-visualization.js"></script>  <!-- Uses egoConfig -->
<script src="js/ego-ui.js"></script>        <!-- Uses egoConfig -->
<script src="js/ego-core.js"></script>      <!-- Uses visualization functions -->
<script src="js/ego-agent.js"></script>
<script src="js/main.js"></script>          <!-- Entry point, uses all above -->
```
