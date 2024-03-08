import { OrbitControls } from "../node_modules/three-full/sources/controls/OrbitControls.js";
import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r122/build/three.module.js';
import { RGBELoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js';

//import { GLTFLoader } from "../node_modules/three-full/sources/loaders/GLTFLoader.js";

//node_modules\three-full\sources\loaders\GLTFLoader.js

function getScene() {
  return new THREE.Scene();
}

function getCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    1, // Set aspect ratio to 1 for a square camera
    0.1,
    1000
  );
  
  // Set the starting position to (0, 0, 0)
  camera.position.set(2.5, 0, 0);

  return camera;
}

function getRenderer() {
  // Create a camera
  const size = 300; // Adjusted size

  // Create a renderer
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(size, size); // Set renderer size to 150 by 150 pixels
  document.body.appendChild(renderer.domElement);

  return renderer;
}

function loadEnvMap(scene, renderer) {
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
}

function getDirectionalLight() {
  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);

  return directionalLight;
}

function getAmbientLight() {
  return new THREE.AmbientLight(0x404040);
}

function createOrbitControls(camera, renderer) {
  // Create orbital controls
  let controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2;

  return controls;
}

function getGlft(gltfObjectfile, callback) {
  // Ensure gltfObjectfile is a File object
  if (!(gltfObjectfile instanceof File)) {
    console.error('Invalid glTF file');
    return;
  }

  const loader = new GLTFLoader();
  const url = URL.createObjectURL(gltfObjectfile); // Create a URL for the File object

  loader.load(
    url,
    (gltf) => {
      // The loaded object is passed to the callback function
      if (callback && typeof callback === 'function') {
        callback(gltf.scene);
      }
      // Clean up the object URL after loading
      URL.revokeObjectURL(url);
    },
    undefined,
    (error) => {
      console.error('Error loading GLTF object:', error);
    }
  );
}

function createThreeScene(gltfObjectfile) {
  const scene = getScene();
  const camera = getCamera();
  const renderer = getRenderer();
  loadEnvMap(scene, renderer);
  scene.add(getDirectionalLight());
  scene.add(getAmbientLight());
  const controls = createOrbitControls(camera, renderer);

  // Create a container for the Three.js scene
  const threeContainer = document.createElement('div');
  threeContainer.className = 'three-container'; // Apply the CSS class for the three-container

  // Call getGlft with a callback function to add the loaded object to the scene
  getGlft(gltfObjectfile, (gltfObject) => {
    scene.add(gltfObject);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);

      // Update controls
      controls.update();

      renderer.render(scene, camera);
    };

    animate();
  });
  
  threeContainer.appendChild(renderer.domElement);

  return threeContainer;
}

function addShapeKeysToContainer(gltfObject) {
  console.log("gltfObject.morphTargetDictionary", gltfObject.children[0].morphTargetDictionary);

  // Log shape keys
  if (gltfObject && gltfObject.children.length > 0) {
    const firstObject = gltfObject.children[0];

    if (firstObject.morphTargetDictionary) {
      const shapeKeys = Object.keys(firstObject.morphTargetDictionary);

      const sliderContainer = document.createElement("div");
      sliderContainer.className = "slider-container";
      shapeKeys.forEach((key) => {
        const label = document.createElement("label");
        label.textContent = key;

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.01;

        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
      });
      return sliderContainer;
    } else {
      console.warn('The loaded object does not have shape keys.');
    }
  } else {
    console.warn('No objects found in the loaded glTF scene.');
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const addCardButton = document.getElementById("addCardButton");
  const filterInput = document.getElementById("filterInput");
  const cardList = document.getElementById("cardList");
  const formCardSection = document.getElementById("formCardSection");

  addCardButton.addEventListener("click", function () {
    showCardForm();
  });

  addCardButton.addEventListener("mouseenter", function () {
    showCardForm();
  });

  document.addEventListener("click", function (event) {
    const isInsideForm = event.target.closest("#cardForm");
    const isInsideAddCardButton = event.target === addCardButton;

    if (!isInsideForm && !isInsideAddCardButton) {
      hideCardForm();
    }
  });

  function showCardForm() {
    const existingForm = document.getElementById("cardForm");
    if (!existingForm) {
        const form = document.createElement("form");
        form.id = "cardForm";

        const titleInput = createInput("text", "title", "Enter the title for the new card:", "Title:");
        titleInput.querySelector("input").value = "Mask"; // Default title

        // Specify the accept attribute for glTF files
        const gltfInput = createInput("file", "gltfObject", "Choose a glTF 3D object file", "Choose 3D Object (glTF):");
        gltfInput.querySelector("input").accept = ".gltf, .glb";

        const placeholderImageInput = createInput("file", "placeholderImage", "Choose an image file", "Choose Image:");

        const submitButton = document.createElement("button");
        submitButton.type = "button";
        submitButton.textContent = "Create Card";
        submitButton.addEventListener("click", function () {
            const gltfFileInput = gltfInput.querySelector("input").files[0];
            const imageFileInput = placeholderImageInput.querySelector("input").files[0];

            if (imageFileInput && gltfFileInput) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    createCard(titleInput.querySelector("input").value, gltfFileInput, e.target.result);
                    form.reset();
                    filterCards(); // Update card list after adding a new card
                };
                reader.readAsDataURL(imageFileInput);
            } else {
                alert("Please choose both an image file and a glTF 3D object file.");
            }
        });

        form.appendChild(titleInput);
        form.appendChild(gltfInput);
        form.appendChild(placeholderImageInput);
        form.appendChild(submitButton);

        formCardSection.appendChild(form);
    }
}

  function hideCardForm() {
    const form = document.getElementById("cardForm");
    if (form) {
      form.remove();
    }
  }

  function createInput(type, name, placeholder, labelText, accept) {
    const inputContainer = document.createElement("div"); // Wrap input and label in a container
    inputContainer.className = "input-container";
  
    const label = document.createElement("label");
    label.textContent = labelText;
    inputContainer.appendChild(label);
  
    const input = document.createElement("input");
    input.type = type;
    input.name = name;
    input.placeholder = placeholder;
    if (type === "file") {
      input.accept = accept; // Set the accept attribute for file input
    }
  
    inputContainer.appendChild(input);
    return inputContainer;
  }

  function createCard(title, gltfObjectfile, placeholderImage) {
    const cardContainer = document.createElement("div");
    cardContainer.className = "card";

    const cardTitle = document.createElement("h3");
    cardTitle.textContent = title;

    const placeholderImageElement = document.createElement("img");
    placeholderImageElement.src = placeholderImage;
    placeholderImageElement.alt = "Uploaded Image";

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
        // Call a function to handle card deletion here
        deleteCard(cardContainer);
        cardContainer.remove();
    });

    const threeScene = createThreeScene(gltfObjectfile);

    cardContainer.appendChild(cardTitle);
    cardContainer.appendChild(placeholderImageElement);
    cardContainer.appendChild(threeScene);
    //cardContainer.appendChild(sliderContainer);
    cardContainer.appendChild(deleteButton);

    cardList.appendChild(cardContainer);
  }

  // Add this function to handle card deletion if needed
  function deleteCard(cardElement) {
    cardElement.remove();
  }

  function filterCards() {
    const searchTerm = filterInput.value.toLowerCase();
    const cards = document.querySelectorAll('.card');
  
    cards.forEach(card => {
      const cardTitle = card.querySelector('h3').textContent.toLowerCase();
      if (cardTitle.includes(searchTerm)) {
        card.style.display = 'inline-block'; // Set back to original display value
      } else {
        card.style.display = 'none';
      }
    });
  }
});
