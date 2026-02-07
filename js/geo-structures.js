/** Geometries - Structure objects (Wall, Chair, Stairs) */

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
    wallMat.color.setHex(0x8b4513);

    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(10, 8, 0.3),
        wallMat
    );
    wall.position.set(0, 4, 3);
    return wall;
}

function createChair(material) {
    const group = new THREE.Group();
    const woodMat = material.clone();
    woodMat.color.setHex(0x8b6914);

    const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.05, 0.45),
        woodMat
    );
    seat.position.y = 0.45;
    group.add(seat);

    const back = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.5, 0.05),
        woodMat
    );
    back.position.set(0, 0.72, -0.2);
    group.add(back);

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
