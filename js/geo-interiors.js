/** Geometries - Interior spaces (Room, Corridor) */

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

    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize, 0.1, roomSize),
        floorMat
    );
    floor.position.y = 0.05;
    group.add(floor);

    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize, wallHeight, wallThickness),
        wallMat
    );
    backWall.position.set(0, wallHeight/2, -roomSize/2);
    group.add(backWall);

    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, roomSize),
        wallMat
    );
    leftWall.position.set(-roomSize/2, wallHeight/2, 0);
    group.add(leftWall);

    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, roomSize),
        wallMat
    );
    rightWall.position.set(roomSize/2, wallHeight/2, 0);
    group.add(rightWall);

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

    const header = new THREE.Mesh(
        new THREE.BoxGeometry(doorWidth, wallHeight - doorHeight, wallThickness),
        wallMat
    );
    header.position.set(0, doorHeight + (wallHeight - doorHeight)/2, roomSize/2);
    group.add(header);

    const roof = new THREE.Mesh(
        new THREE.BoxGeometry(roomSize, wallThickness, roomSize),
        wallMat
    );
    roof.position.y = wallHeight + wallThickness / 2;
    roof.visible = false;
    roof.userData.isInvisibleRaycastSurface = true;
    group.add(roof);

    const tableMat = material.clone();
    tableMat.color.setHex(0x6b4423);
    const tableTop = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.08, 0.7),
        tableMat
    );
    tableTop.position.set(-0.8, 0.75, -0.8);
    group.add(tableTop);

    const legGeo = new THREE.BoxGeometry(0.06, 0.75, 0.06);
    [[-0.5, -0.25], [-0.5, 0.25], [0.5, -0.25], [0.5, 0.25]].forEach(([dx, dz]) => {
        const leg = new THREE.Mesh(legGeo, tableMat);
        leg.position.set(-0.8 + dx * 1.0, 0.375, -0.8 + dz * 0.5);
        group.add(leg);
    });

    return group;
}

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

    const floor = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.1, length),
        floorMat
    );
    floor.position.y = 0.05;
    group.add(floor);

    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, length),
        wallMat
    );
    leftWall.position.set(-width/2, wallHeight/2, 0);
    group.add(leftWall);

    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, wallHeight, length),
        wallMat
    );
    rightWall.position.set(width/2, wallHeight/2, 0);
    group.add(rightWall);

    const obstacleMat = material.clone();
    obstacleMat.color.setHex(0x8b4513);

    const box1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        obstacleMat
    );
    box1.position.set(-0.5, 0.25, -2);
    group.add(box1);

    const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.8, 16),
        obstacleMat
    );
    cyl.position.set(0.4, 0.4, 0);
    group.add(cyl);

    const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.3, 0.15),
        obstacleMat
    );
    barrier.position.set(0, 0.15, 2);
    group.add(barrier);

    group.position.z = -1;
    return group;
}
