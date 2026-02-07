/** Scene Setup - Main 3D Scene */

function initMainScene(container, w, h) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);

    const camera = new THREE.PerspectiveCamera(60, (w * 0.5) / h, 0.1, 100);
    // Rotated 90 deg right (from Z axis to X axis), zoomed out 2x
    camera.position.set(12, 6, 0);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.autoClear = false;

    const ambientLight = new THREE.AmbientLight(0x606060, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(GRID_RANGE * 2, GRID_SIZE, 0x30363d, 0x21262d);
    scene.add(gridHelper);

    const planeGeometry = new THREE.PlaneGeometry(GRID_RANGE * 2, GRID_RANGE * 2);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d333b,
        side: THREE.DoubleSide,
        metalness: 0.2,
        roughness: 0.8
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    scene.add(plane);

    // Store floor reference for raycasting
    window.appState.floor = plane;

    return { scene, camera, renderer };
}

function initSensorScene(container, w, h) {
    const scene2 = new THREE.Scene();
    scene2.background = new THREE.Color(0x0d1117);

    const camera2 = new THREE.PerspectiveCamera(60, (w * 0.5) / h, 0.1, 100);
    // Start synced with main camera
    camera2.position.set(12, 6, 0);
    camera2.lookAt(0, 0, 0);

    const renderer2 = new THREE.WebGLRenderer({ antialias: true });
    renderer2.setSize(w, h);
    renderer2.shadowMap.enabled = true;
    renderer2.autoClear = false;

    const ambientLight2 = new THREE.AmbientLight(0x606060, 0.8);
    scene2.add(ambientLight2);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(5, 10, 5);
    scene2.add(directionalLight2);

    const gridHelper2 = new THREE.GridHelper(GRID_RANGE * 2, GRID_SIZE, 0x30363d, 0x21262d);
    scene2.add(gridHelper2);

    const plane2 = new THREE.Mesh(
        new THREE.PlaneGeometry(GRID_RANGE * 2, GRID_RANGE * 2),
        new THREE.MeshStandardMaterial({ color: 0x2d333b, side: THREE.DoubleSide })
    );
    plane2.rotation.x = -Math.PI / 2;
    plane2.position.y = -0.01;
    scene2.add(plane2);

    return { scene2, camera2, renderer2 };
}

function createGeometry(type, scene) {
    if (window.appState.cube) {
        // Properly dispose old geometry and material to prevent memory leak
        if (window.appState.cube.geometry) {
            window.appState.cube.geometry.dispose();
        }
        if (window.appState.cube.material) {
            window.appState.cube.material.dispose();
        }
        // Handle groups with children
        if (window.appState.cube.traverse) {
            window.appState.cube.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        scene.remove(window.appState.cube);
    }

    // Empty scene - no geometry, just return null marker
    if (type === 'empty') {
        // Create invisible placeholder so code doesn't break
        const placeholder = new THREE.Group();
        placeholder.visible = false;
        scene.add(placeholder);
        window.appState.cube = placeholder;
        return placeholder;
    }

    const material = new THREE.MeshStandardMaterial({
        color: 0x238636,
        metalness: 0.3,
        roughness: 0.4
    });

    let mesh;

    switch(type) {
        case 'sphere':
            mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), material);
            mesh.position.y = 0.5;
            break;
        case 'cylinder':
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 16), material);
            mesh.position.y = 0.5;
            break;
        case 'cone':
            mesh = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 16), material);
            mesh.position.y = 0.5;
            break;
        case 'torus':
            mesh = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.15, 8, 16), material);
            mesh.position.y = 0.5;
            break;
        case 'wall':
            mesh = createWall(material);
            break;
        case 'tallwall':
            mesh = createTallWall(material);
            break;
        case 'chair':
            mesh = createChair(material);
            break;
        case 'stairs':
            mesh = createStairs(material);
            break;
        case 'pyramid-stairs':
            mesh = createPyramidStairs(material);
            break;
        case 'rough-terrain':
            mesh = createRoughTerrain(material);
            break;
        case 'stepping-stones':
            mesh = createSteppingStones(material);
            break;
        case 'interior-room':
            mesh = createInteriorRoom(material);
            break;
        case 'corridor':
            mesh = createCorridor(material);
            break;
        default:
            mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
            mesh.position.y = 0.5;
    }

    mesh.castShadow = true;
    scene.add(mesh);

    window.appState.cube = mesh;
    return mesh;
}

function createWall(material) {
    const wallMat = material.clone();
    wallMat.color.setHex(0x6e7681);

    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 2.2, 0.15),
        wallMat
    );
    wall.position.set(0, 1.1, 1.2);
    return wall;
}

function createTallWall(material) {
    const wallMat = material.clone();
    wallMat.color.setHex(0x8b4513); // Brown for visibility

    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(10, 8, 0.3),  // Giant tall wall
        wallMat
    );
    wall.position.set(0, 4, 3);  // Centered, positioned in front
    return wall;
}

function createChair(material) {
    const group = new THREE.Group();
    const woodMat = material.clone();
    woodMat.color.setHex(0x8b6914);

    // Seat
    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.05, 0.45),
        woodMat
    );
    seat.position.y = 0.45;
    group.add(seat);

    // Back
    const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.5, 0.05),
        woodMat
    );
    back.position.set(0, 0.72, -0.2);
    group.add(back);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.04, 0.45, 0.04);
    const positions = [
        [-0.18, 0.225, 0.18],
        [0.18, 0.225, 0.18],
        [-0.18, 0.225, -0.18],
        [0.18, 0.225, -0.18]
    ];
    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, woodMat);
        leg.position.set(...pos);
        group.add(leg);
    });

    group.position.set(0.8, 0, 0);
    return group;
}

function createStairs(material) {
    const group = new THREE.Group();
    const stepMat = material.clone();
    stepMat.color.setHex(0x4a4a4a);

    const stepCount = 4;
    const stepHeight = 0.2;
    const stepDepth = 0.3;
    const stepWidth = 1.2;

    for (let i = 0; i < stepCount; i++) {
        const step = new THREE.Mesh(
            new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth),
            stepMat
        );
        step.position.set(
            0,
            stepHeight / 2 + i * stepHeight,
            -i * stepDepth
        );
        group.add(step);
    }

    group.position.set(0, 0, 0.5);
    return group;
}

// Isaac Gym style pyramid stairs terrain
function createPyramidStairs(material) {
    const group = new THREE.Group();
    const stepMat = material.clone();
    stepMat.color.setHex(0x5a6a4a);

    const terrainSize = 7.5;
    const stepWidth = 0.4;
    const stepHeight = 0.12;
    const platformSize = 0.8;

    let height = 0;
    let startX = -terrainSize / 2;
    let stopX = terrainSize / 2;
    let startZ = -terrainSize / 2;
    let stopZ = terrainSize / 2;

    while ((stopX - startX) > platformSize && (stopZ - startZ) > platformSize) {
        startX += stepWidth;
        stopX -= stepWidth;
        startZ += stepWidth;
        stopZ -= stepWidth;
        height += stepHeight;

        const width = stopX - startX;
        const depth = stopZ - startZ;

        const step = new THREE.Mesh(
            new THREE.BoxGeometry(width, stepHeight, depth),
            stepMat
        );
        step.position.set(
            (startX + stopX) / 2,
            height - stepHeight / 2,
            (startZ + stopZ) / 2
        );
        group.add(step);
    }

    return group;
}

// Isaac Gym style rough/bumpy terrain
function createRoughTerrain(material) {
    const group = new THREE.Group();
    const terrainMat = material.clone();
    terrainMat.color.setHex(0x6b5b45);

    const gridRes = 24;
    const terrainSize = 7.5;
    const cellSize = terrainSize / gridRes;
    const minHeight = 0;
    const maxHeight = 0.3;

    // Generate heightmap with smoothing
    const heights = [];
    for (let i = 0; i < gridRes; i++) {
        heights[i] = [];
        for (let j = 0; j < gridRes; j++) {
            heights[i][j] = minHeight + Math.random() * (maxHeight - minHeight);
        }
    }

    // Simple blur pass for smoother terrain
    const smoothed = [];
    for (let i = 0; i < gridRes; i++) {
        smoothed[i] = [];
        for (let j = 0; j < gridRes; j++) {
            let sum = heights[i][j];
            let count = 1;
            if (i > 0) { sum += heights[i-1][j]; count++; }
            if (i < gridRes-1) { sum += heights[i+1][j]; count++; }
            if (j > 0) { sum += heights[i][j-1]; count++; }
            if (j < gridRes-1) { sum += heights[i][j+1]; count++; }
            smoothed[i][j] = sum / count;
        }
    }

    for (let i = 0; i < gridRes; i++) {
        for (let j = 0; j < gridRes; j++) {
            const h = smoothed[i][j];
            const box = new THREE.Mesh(
                new THREE.BoxGeometry(cellSize * 0.95, h, cellSize * 0.95),
                terrainMat
            );
            box.position.set(
                (i - gridRes/2 + 0.5) * cellSize,
                h / 2,
                (j - gridRes/2 + 0.5) * cellSize
            );
            group.add(box);
        }
    }

    return group;
}

// Isaac Gym style stepping stones
function createSteppingStones(material) {
    const group = new THREE.Group();
    const stoneMat = material.clone();
    stoneMat.color.setHex(0x7a7a7a);

    const terrainSize = 7.5;
    const stoneSize = 0.5;
    const gap = 0.3;
    const spacing = stoneSize + gap;

    const cols = Math.floor(terrainSize / spacing);
    const rows = Math.floor(terrainSize / spacing);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            // Random chance to skip (creates gaps)
            if (Math.random() < 0.2) continue;

            const height = 0.1 + Math.random() * 0.4;
            const sizeVar = 0.8 + Math.random() * 0.4;

            const stone = new THREE.Mesh(
                new THREE.BoxGeometry(stoneSize * sizeVar, height, stoneSize * sizeVar),
                stoneMat
            );
            stone.position.set(
                (i - cols/2 + 0.5) * spacing + (Math.random() - 0.5) * 0.1,
                height / 2,
                (j - rows/2 + 0.5) * spacing + (Math.random() - 0.5) * 0.1
            );
            group.add(stone);
        }
    }

    return group;
}

// Simple interior room
function createInteriorRoom(material) {
    const group = new THREE.Group();
    const wallMat = material.clone();
    wallMat.color.setHex(0x8a8a7a);
    const floorMat = material.clone();
    floorMat.color.setHex(0x5a5a4a);

    const roomSize = 6;
    const wallHeight = 2;
    const wallThickness = 0.15;
    const doorWidth = 1;
    const doorHeight = 1.8;

    // Floor
    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize, 0.1, roomSize),
        floorMat
    );
    floor.position.y = 0.05;
    group.add(floor);

    // Back wall (solid)
    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize, wallHeight, wallThickness),
        wallMat
    );
    backWall.position.set(0, wallHeight/2, -roomSize/2);
    group.add(backWall);

    // Left wall (solid)
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, roomSize),
        wallMat
    );
    leftWall.position.set(-roomSize/2, wallHeight/2, 0);
    group.add(leftWall);

    // Right wall (solid)
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, roomSize),
        wallMat
    );
    rightWall.position.set(roomSize/2, wallHeight/2, 0);
    group.add(rightWall);

    // Front wall with door opening (two sections)
    const frontLeftWidth = (roomSize - doorWidth) / 2;
    const frontLeft = new THREE.Mesh(
        new THREE.BoxGeometry(frontLeftWidth, wallHeight, wallThickness),
        wallMat
    );
    frontLeft.position.set(-roomSize/4 - doorWidth/4, wallHeight/2, roomSize/2);
    group.add(frontLeft);

    const frontRight = new THREE.Mesh(
        new THREE.BoxGeometry(frontLeftWidth, wallHeight, wallThickness),
        wallMat
    );
    frontRight.position.set(roomSize/4 + doorWidth/4, wallHeight/2, roomSize/2);
    group.add(frontRight);

    // Door header
    const header = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, wallHeight - doorHeight, wallThickness),
        wallMat
    );
    header.position.set(0, doorHeight + (wallHeight - doorHeight)/2, roomSize/2);
    group.add(header);

    // Add a simple table
    const tableMat = material.clone();
    tableMat.color.setHex(0x6b4423);
    const tableTop = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.08, 0.7),
        tableMat
    );
    tableTop.position.set(-0.8, 0.75, -0.8);
    group.add(tableTop);

    // Table legs
    const legGeo = new THREE.BoxGeometry(0.06, 0.75, 0.06);
    [[-0.5, -0.25], [-0.5, 0.25], [0.5, -0.25], [0.5, 0.25]].forEach(([dx, dz]) => {
        const leg = new THREE.Mesh(legGeo, tableMat);
        leg.position.set(-0.8 + dx * 1.0, 0.375, -0.8 + dz * 0.5);
        group.add(leg);
    });

    return group;
}

// Corridor with obstacles
function createCorridor(material) {
    const group = new THREE.Group();
    const wallMat = material.clone();
    wallMat.color.setHex(0x6a6a6a);
    const floorMat = material.clone();
    floorMat.color.setHex(0x4a4a4a);

    const length = 12;
    const width = 3;
    const wallHeight = 2;
    const wallThickness = 0.15;

    // Floor
    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.1, length),
        floorMat
    );
    floor.position.y = 0.05;
    group.add(floor);

    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, length),
        wallMat
    );
    leftWall.position.set(-width/2, wallHeight/2, 0);
    group.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, length),
        wallMat
    );
    rightWall.position.set(width/2, wallHeight/2, 0);
    group.add(rightWall);

    // Add some obstacles along the corridor
    const obstacleMat = material.clone();
    obstacleMat.color.setHex(0x8b4513);

    // Box obstacle
    const box1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        obstacleMat
    );
    box1.position.set(-0.5, 0.25, -2);
    group.add(box1);

    // Cylinder obstacle
    const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.8, 16),
        obstacleMat
    );
    cyl.position.set(0.4, 0.4, 0);
    group.add(cyl);

    // Low barrier
    const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.3, 0.15),
        obstacleMat
    );
    barrier.position.set(0, 0.15, 2);
    group.add(barrier);

    group.position.z = -1;
    return group;
}

function onGeometryChange(event) {
    createGeometry(event.target.value, window.appState.scene);
}
