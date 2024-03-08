import { OrbitControls } from "../node_modules/three-full/sources/controls/OrbitControls.js";
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r122/build/three.module.js';
import { RGBELoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js';

// Set up the scene
const scene = new THREE.Scene();

// Create a camera
const size = 300; // Adjusted size
const camera = new THREE.PerspectiveCamera(
  75,
  1, // Set aspect ratio to 1 for a square camera
  0.1,
  1000
);
camera.position.z = 2.5;

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(size, size); // Set renderer size to 150 by 150 pixels
document.body.appendChild(renderer.domElement);

// Declare envMap outside the loader callback
let envMap;

// Load the HDR texture
const loader = new RGBELoader();
loader.setDataType(THREE.UnsignedByteType);
loader.load(
  'assets/images/modern_bathroom_4k.hdr',
  (texture) => {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    envMap = pmremGenerator.fromEquirectangular(texture).texture;

    // Set the HDR texture as the background of the renderer
    renderer.setClearColor(new THREE.Color().setRGB(0, 0, 0), 0);
    //scene.background = envMap;

    texture.dispose();
    pmremGenerator.dispose();
  },
  undefined,
  (err) => {
    console.error('Error loading HDR texture', err);
  }
);

// Create a loader for the glTF model
const gltfLoader = new GLTFLoader();

// Load the glTF model
gltfLoader.load(
  'assets/3dObjects/faces.gltf',
  (gltf) => {
    // Once the model is loaded, you can access its mesh
    const facesMesh = gltf.scene;

    // Set the position, rotation, and scale of the loaded mesh as needed
    facesMesh.position.set(0, 0, 0); // Adjust the position
    facesMesh.rotation.set(0, 0, 0); // Adjust the rotation
    facesMesh.scale.set(1, 1, 1); // Adjust the scale

    // Add the loaded mesh to the scene
    scene.add(facesMesh);
  },
  undefined,
  (err) => {
    console.error('Error loading glTF model', err);
  }
);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Create orbital controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2;

// Animation
const animate = () => {
  requestAnimationFrame(animate);

  // Update controls
  controls.update();

  renderer.render(scene, camera);
};

animate();
