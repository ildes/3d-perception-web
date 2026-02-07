/** Ego Sensor Agent - Movement, rotation, and camera functions */

const groundRaycaster = new THREE.Raycaster();
const groundRayOrigin = new THREE.Vector3();
const groundRayDir = new THREE.Vector3(0, -1, 0);

function moveAgent(deltaX, deltaZ) {
    if (!egoAgentMarker) return;
    egoAgentMarker.position.x += deltaX;
    egoAgentMarker.position.z += deltaZ;
    const range = EGO_FLOOR_RANGE;
    egoAgentMarker.position.x = Math.max(-range + 0.3, Math.min(range - 0.3, egoAgentMarker.position.x));
    egoAgentMarker.position.z = Math.max(-range + 0.3, Math.min(range - 0.3, egoAgentMarker.position.z));

    projectAgentToGround();
}

function projectAgentToGround() {
    if (!egoAgentMarker) return;
    const state = window.appState;

    groundRayOrigin.set(egoAgentMarker.position.x, 50, egoAgentMarker.position.z);
    groundRaycaster.set(groundRayOrigin, groundRayDir);
    groundRaycaster.far = 100;

    const targetObjects = [];
    if (state.cube && state.cube.visible) {
        targetObjects.push(state.cube);
    }
    if (state.floor) {
        targetObjects.push(state.floor);
    }

    if (targetObjects.length > 0) {
        const intersects = groundRaycaster.intersectObjects(targetObjects, true);
        if (intersects.length > 0) {
            egoAgentMarker.position.y = intersects[0].point.y;
        }
    }
}

function rotateAgent(deltaAngle) {
    if (!egoAgentMarker) return;
    egoAgentMarker.rotation.y += deltaAngle;
}

function updateEgoViewportCamera() {
    const state = window.appState;
    if (!state.camera2 || !state.camera) return;

    state.camera2.position.copy(state.camera.position);
    state.camera2.quaternion.copy(state.camera.quaternion);
    state.camera2.fov = state.camera.fov;
    state.camera2.updateProjectionMatrix();
}

window.moveAgent = moveAgent;
window.rotateAgent = rotateAgent;
window.updateEgoViewportCamera = updateEgoViewportCamera;
