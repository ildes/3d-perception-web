/** Scene Setup - Main 3D Scene */

function initMainScene(container, w, h) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);

    const camera = new THREE.PerspectiveCamera(60, (w * 0.5) / h, 0.1, 100);
    camera.position.set(0, 3, 6);
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

    return { scene, camera, renderer };
}

function initSensorScene(container, w, h) {
    const scene2 = new THREE.Scene();
    scene2.background = new THREE.Color(0x0d1117);

    const camera2 = new THREE.PerspectiveCamera(60, (w * 0.5) / h, 0.1, 100);
    camera2.position.set(5, 5, 5);
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
        window.appState.cube.geometry.dispose();
        window.appState.cube.material.dispose();
        scene.remove(window.appState.cube);
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
        case 'chair':
            mesh = createChair(material);
            break;
        case 'stairs':
            mesh = createStairs(material);
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

function onGeometryChange(event) {
    createGeometry(event.target.value, window.appState.scene);
}
