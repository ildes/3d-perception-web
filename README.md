# 3D Perception Web

Interactive 3D sensor visualization for reinforcement learning agents. View environment heightmaps and ego-centric perception tensors in real-time.

![Demo](https://ildes.github.io/3d-perception-web/)

## Features

- **Grid Mode**: Top-down height-map sensor projecting rays onto a configurable grid
- **Ego-Centric Mode**: Spherical raycasting from agent's perspective (360° horizontal, -60° to +30° vertical)
- **Multiple Environments**: Cube, stairs, rough terrain, stepping stones, interior rooms, and more
- **Real-time Tensor Visualization**: See what an RL agent "sees" as numeric tensors

## Quick Start

```bash
# Serve locally
python3 -m http.server 8080
# Open http://localhost:8080
```

## Controls

| Viewport | Action | Effect |
|----------|--------|--------|
| Left (3D) | Drag | Orbit camera |
| Left (3D) | Scroll | Zoom |
| Right (Sensor) | Drag | Move object (grid) / agent (ego) |
| Right (Sensor) | Shift+Drag | Rotate agent (ego only) |
| Right (Sensor) | Scroll | Zoom |

## Sensor Modes

### Grid Mode
- Aerial height-map with configurable grid size (4×4 to 32×32)
- Output: `[GRID_SIZE × GRID_SIZE]` tensor of height values
- Range: ±3 meters

### Ego-Centric Mode
- First-person perception from agent height (1.0m)
- Output: `[V_BINS × H_BINS]` tensor of normalized distances
- Horizontal: 32 bins (full 360°)
- Vertical: 16 bins (-60° to +30°)
- Range: Up to 20 meters

## Tech Stack

- Three.js (r128) for 3D rendering
- Vanilla JavaScript (no build step)
- Playwright for testing

## Development

```bash
# Run tests
node test_heightmap.js

# Install dependencies (for testing)
npm install
```

## License

MIT
