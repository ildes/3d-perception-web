/** Geometries - Basic shapes and dispatcher */

function createGeometry(type, scene) {
    if (window.appState.cube) {
        if (window.appState.cube.geometry) {
            window.appState.cube.geometry.dispose();
        }
        if (window.appState.cube.material) {
            window.appState.cube.material.dispose();
        }
        if (window.appState.cube.traverse) {
            window.appState.cube.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
        scene.remove(window.appState.cube);
    }

    if (type === 'empty') {
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

window.createGeometry = createGeometry;
