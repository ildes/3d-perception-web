/** Scene Core - Scene initialization and management */

function initMainScene(container, w, h) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1117);

    const camera = new THREE.PerspectiveCamera(60, (w * 0.5) / h, 0.1, 100);
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

    window.appState.floor = plane;

    return { scene, camera, renderer };
}

function initSensorScene(container, w, h) {
    const scene2 = new THREE.Scene();
    scene2.background = new THREE.Color(0x0d1117);

    const camera2 = new THREE.PerspectiveCamera(60, (w * 0.5) / h, 0.1, 100);
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

function onGeometryChange(event) {
    createGeometry(event.target.value, window.appState.scene);
}
