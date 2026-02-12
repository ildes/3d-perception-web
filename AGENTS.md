# Height Map Sensor Visualization - Agent Instructions

## Project Overview
Vanilla JavaScript/HTML visualization using Three.js (r128) for 3D rendering. Designed for humanoid motion generation model to "see" the environment via tensor-based sensor outputs. Modular architecture with script-based loading (not ES6 modules).

## File Structure

```
grid/
├── index.html              # Main HTML, UI controls, script loading order
├── css/
│   ├── styles-base.css     # Base styles, layout, common components (174 lines)
│   ├── styles-grid.css     # Grid mode specific styles (121 lines)
│   ├── styles-ego.css      # Ego mode config styles (72 lines)
│   └── styles-tensor.css   # Tensor display styles (54 lines)
├── js/
│   ├── config.js           # Constants: GRID_RANGE=3, EGO_FLOOR_RANGE=30, DEFAULT_GRID_SIZE=8
│   ├── state.js            # Global window.appState object
│   ├── scene-core.js       # Three.js scene setup (cameras, lights, renderers)
│   ├── geo-basic.js        # Geometry dispatcher and basic shapes (91 lines)
│   ├── geo-structures.js   # Wall, TallWall, Chair, Stairs (87 lines)
│   ├── geo-terrains.js     # PyramidStairs, RoughTerrain, SteppingStones (129 lines)
│   ├── geo-interiors.js    # InteriorRoom, Corridor (143 lines)
│   ├── sensors-grid.js     # Grid mode sensor (top-down heightmap) (210 lines)
│   ├── sensors-utils.js    # Grid helper utilities (40 lines)
│   ├── ui.js               # UI components for grid mode
│   ├── grid-selector.js    # Grid size selector UI
│   ├── controls.js         # Mouse/camera controls for both viewports
│   ├── ego-config.js       # Ego sensor configuration and state (31 lines)
│   ├── ego-visualization.js # Agent markers, whiskers, point cloud, cone, tensor (273 lines)
│   ├── ego-ui.js           # Mode switching and UI management (200 lines)
│   ├── ego-core.js         # Main update loop and raycasting (218 lines)
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
- **Default config**: 64×21 bins, 10m range, 1.0 brightness, min-max scaling
- V-bins auto-calculated from h-bins: `round(hBins/3/4) * 4` (nearest divisible by 4)
- H-bins configurable: 4-128 (default 64, step 4)
- Vertical FOV: Separate sliders for up (+30°) and down (-60°) angles
- Horizontal FOV: Slider 0°-360° (360°=full sphere, 180°=forward hemisphere)
- Data Scaling: None (raw), Normalize (0-1), Histogram Equalization, Min-Max (default)
- Whisker visualization: Only shows tips near hit points (shorter=closer, longer=farther)
- Whisker toggle: Checkbox to show/hide whiskers for performance
- Yellow cone appears on FOV adjustment, fades out over 4 seconds
- Agent projects onto geometry (walks on top of stairs, tables, etc.)
- Floor size: 60×60 units in ego mode (10x larger than grid mode)
- Tensor display: HTML5 Canvas-based pixel rendering (no DOM divs)
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

### Geometry Files
```javascript
// geo-basic.js
createGeometry(type, scene)     // Main dispatcher, handles disposal

// geo-structures.js
createWall(material)            // Simple wall
createTallWall(material)        // Giant wall
createChair(material)           // Chair with legs
createStairs(material)          // Simple 4-step stairs

// geo-terrains.js
createPyramidStairs(material)   // Isaac Gym style concentric stairs
createRoughTerrain(material)    // Random elevation bumps (smoothed)
createSteppingStones(material)  // Irregular platforms with gaps

// geo-interiors.js
createInteriorRoom(material)    // Room with walls, door, table, invisible roof for raycasting
createCorridor(material)        // Long hallway with obstacles
```

### ego-config.js - Configuration
```javascript
egoConfig = {
    hBins: 64,              // Horizontal bins (4-128, step 4)
    vBins: 21,              // Auto-calculated from hBins
    maxRange: 10,           // Max raycast distance (1-20m, integer)
    vAngleMin: -60,         // Look down angle
    vAngleMax: 30,          // Look up angle
    hAngleMin: -180,        // Horizontal FOV min
    hAngleMax: 180,         // Horizontal FOV max
    agentHeight: 1.0,       // Sensor origin height
    brightnessMultiplier: 1.0,
    scalingMode: 'minmax'   // 'none' | 'normalize' | 'equalize' | 'minmax'
};

calculateVBins(hBins)           // Returns nearest divisible by 4 to hBins/3
updateVBinsFromHBins()          // Updates egoConfig.vBins from hBins
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
setupEgoUI()                // Initialize UI controls and sync with config
```

### ego-visualization.js - Visual Elements
```javascript
createAgentMarker()         // Ground ring, arrow, sensor indicator
createEgoRayVisualization() // Whisker cylinders for ray hits
createEgoPointCloud()       // Point cloud for viewport2
createTensorDisplay()       // Build HTML5 Canvas for tensor visualization
updateTensorDisplay()       // Draw pixel data on canvas (yellow=close, blue=far)
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
- Split into 4 files: styles-base.css, styles-grid.css, styles-ego.css, styles-tensor.css

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
1. Choose appropriate file based on category:
   - `geo-basic.js` - Basic primitives
   - `geo-structures.js` - Buildings, furniture
   - `geo-terrains.js` - Outdoor terrain types
   - `geo-interiors.js` - Indoor environments
2. Add case to `createGeometry()` switch in `geo-basic.js`
3. Create `createYourGeometry(material)` function returning THREE.Mesh or THREE.Group
4. Add `<option value="your-geometry">Label</option>` to `#geometry-select` in `index.html`
5. For terrain groups, use `optgroup` for organization

## Script Loading Order (index.html)
Scripts must load in dependency order:
```html
<script src="js/config.js"></script>
<script src="js/state.js"></script>
<script src="js/geo-basic.js"></script>      <!-- createGeometry() dispatcher -->
<script src="js/geo-structures.js"></script> <!-- Wall, Chair, Stairs -->
<script src="js/geo-terrains.js"></script>   <!-- Pyramid, Rough, Stepping -->
<script src="js/geo-interiors.js"></script>  <!-- Room, Corridor -->
<script src="js/scene-core.js"></script>    <!-- Depends on geo-* -->
<script src="js/sensors-grid.js"></script>  <!-- Grid mode sensor -->
<script src="js/sensors-utils.js"></script> <!-- Grid helpers -->
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
