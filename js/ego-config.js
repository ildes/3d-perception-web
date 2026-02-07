/** Ego Sensor Configuration and State */

const egoConfig = {
    hBins: 64,
    vBins: 32,
    maxRange: 5,
    vAngleMin: -60,
    vAngleMax: 30,
    hAngleMin: -180,
    hAngleMax: 180,
    agentHeight: 1.0,
    brightnessMultiplier: 1.5
};

let egoTensorData = null;
let egoRayHelper = null;
let egoAgentMarker = null;
let egoTensorCells = null;
let egoPointCloud = null;

const egoRaycaster = new THREE.Raycaster();
const egoRayOrigin = new THREE.Vector3();
const egoRayDir = new THREE.Vector3();

let lastEgoUpdate = 0;
const EGO_UPDATE_INTERVAL = 50;

window.egoConfig = egoConfig;
