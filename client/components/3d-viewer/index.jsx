import React from "react";
import ReactDOM from "react-dom";
import * as THREE from "three";
import { SketchPicker } from "react-color";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer";
import MouseTooltip from "react-sticky-mouse-tooltip";
import mergeImages from "merge-images";
import html2canvas from "html2canvas";
import h from "react-hyperscript";
import { saveAs } from "file-saver";
import debounce from "lodash.debounce";
import ReactTooltip from "react-tooltip";
import {
  Button,
  Popover,
  Text,
  Stack,
  Group,
  Switch,
  CloseButton,
  TextInput,
} from "@mantine/core";

import Tour from "reactour";
import {
  getNeuronModels,
  getNeuronSynapses,
  getSynapsesBetween,
  getNeuronClassSynapses,
  getNerveRingModel,
} from "services";
import texture from "../../images/texture.jpg";
import neurons from "../../model/neurons.json";
import model from "../../model";

const loader = new STLLoader();
const NeuronListItem = (props) => {
  const {
    neuronName,
    color,
    selected,
    topLevelOnClick = () => {},
    colorOnClick = () => {},
  } = props;

  const styles = {
    NeuronListItem: `flex justify-between row items-center pl-4 pr-4 pt-2 pb-2 hover:bg-gray-300 cursor-pointer`,
    neuronName: "",
    neuronChecked: "cursor-pointer mr-4",
    neuronColor: "relative cursor-pointer w-4 h-4 shadow-inner rounded-full",
  };

  return h(
    "div",
    {
      className: styles.NeuronListItem,
      onClick: (e) => topLevelOnClick(e),
    },
    [
      h(
        "div",
        {
          className: "w-20 flex items-center",
        },
        [h("div", { className: styles.neuronName }, neuronName)]
      ),
      selected
        ? h("div", {
            style: { backgroundColor: color },
            onClick: (e) => colorOnClick(e),
            className: styles.neuronColor,
          })
        : null,
    ]
  );
};

const bodyCells = [
  "B01DL",
  "B01DR",
  "B01VL",
  "B01VR",
  "B02DL",
  "B02DR",
  "B02VL",
  "B02VR",
  "B03DL",
  "B03DR",
  "B03VL",
  "B03VR",
  "B04DL",
  "B04DR",
  "B04VL",
  "B04VR",
  "B05DL",
  "B05DR",
  "B05VL",
  "B05VR",
  "B06DL",
  "B06DR",
  "B06VL",
  "B06VR",
  "B07DL",
  "B07DR",
  "B07VL",
  "B07VR",
  "B08DL",
  "B08DR",
  "B08VL",
  "B08VR",
];
const neuronsSorted = neurons.filter((c) => !bodyCells.includes(c)).sort();
const neuronClassesSorted = Array.from(
  new Set(
    neuronsSorted.map((n) =>
      model.neuronInfo[n] != null ? model.neuronInfo[n].class : ""
    )
  )
).sort();

const neuronColorMap = {
  sensory: "#f9cef9",
  interneuron: "#ff887a",
  motor: "#b7daf5",
  modulatory: "#f9d77b",
  muscle: "#a8f5a2",
  unknown: "#d9d9d9",
};

const styles = {
  searchbar:
    "absolute top-2 left-2 w-60 max-h-96 shadow-lg bg-white rounded z-10 overflow-y-scroll",
  stickyTop: "sticky top-0",
  searchbarInput: "p-4 w-full h-10 rounded",
  controls:
    "p-2 absolute top-2 shadow-lg flex bg-white  z-10 rounded left-1/2 transform -translate-x-1/2 items-center",
  animateButton:
    "bg-white shadow text-gray-600 rounded m-1 hover:bg-gray-200 pl-2 pr-2 m-4",
  selectedNeuronsContainer:
    "rounded border-2 shadow-lg border-gray-300 bg-gray-100 font-bold text-gray-700",
  unselectedNeuronsContainer: "w-full h-full text-gray-400",
  neuronNameTooltip: "bg-white font-bold text-gray-700 shadow-lg p-4 rounded",
  colorPicker: "",
  colorPickerWidget: "bg-white absolute top-14 right-64 border-2 rounded",
  colorPickerClose:
    "mr-2 bg-white cursor-pointer material-icons text-gray-400 hover:text-gray-600 z-10",
  legendContainer: "absolute top-2 right-2 w-60 shadow-lg rounded z-10",
  selectedNeuronLegend: "",
  // 'absolute top-2 right-2 w-60 shadow-lg rounded z-10',
  synapseLegend: "",
  // 'absolute top-10 right-2 w-60 shadow-lg rounded z-10',
  imageLegend: {
    container:
      "absolute -top-40 w-40 z-10 flex flex-col font-bold text-gray-700",
    imageLegendEntry: "p-2 flex items-center",
    imageLegendEntryColor: "rounded w-6 h-6 relative top-2",
  },
  imageWatermark: {
    container: "p-2 absolute w-60 z-10 -top-40 -right-40",
  },
  watermark: {
    container: "p-2 absolute h-10 w-10 bottom-2",
  },
  synapseInfo:
    "absolute w-60 h-80 bottom-20 left-2 overflow-y-scroll bg-white shadow-lg rounded z-10",
};

export default class StlViewer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showSettings: false,
      showNeuronModels: true,
      showSynapseModels: true,
      showWormBody: true,
      showTour: false,
      searchInput: "",
      selectedNeurons: new Set(),
      showTooltip: false,
      selectedSynapse: null,
      selectedObject: null,
      clickedObject: null,
      colorPickerNeuron: "",
      showColorPicker: false,
      animating: false,
      showImageElements: false,
      synapsePositionInfo: [],
      synapseDetail: null,
      showColorPickerSynapse: false,
      synapseColors: {
        pre: "#5e7993",
        post: "#a58627",
        synapse: "#000000",
      },
      colorPickerSynapse: "",
      showSynapseDetail: false,
      // synapseDetailPosition: {
      //   x: 0,
      //   y: 0
      // },
      neuronState: {},
      neuronClassState: {},
    };

    neuronsSorted.forEach((n) => {
      let t = model.neuronInfo[n];
      let color = neuronColorMap["unknown"];

      if (t != null) {
        color = neuronColorMap[t.canonicalType];
      }
      this.state.neuronState[n] = {
        neuronName: n,
        selected: false,
        isNeuron: true,
        color,
      };
    });

    neuronClassesSorted.forEach((c) => {
      this.state.neuronClassState[c] = {
        neuronName: c,
        selected: false,
        isNeuron: false,
        classMembers: model.getNeuronClassMembers(c),
      };
    });

    this.imageLegendRef = React.createRef();
    this.imageWatermarkRef = React.createRef();
  }

  componentDidMount() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      750,
      window.innerWidth / window.innerHeight,
      1,
      100000
    );
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    const controls = new OrbitControls(camera, renderer.domElement);

    /**
     * Light setup
     */
    const secondaryLight = new THREE.AmbientLight(0x404040);
    secondaryLight.position.set(5, 5, 5);
    scene.add(secondaryLight);

    renderer.setSize(window.innerWidth, window.innerHeight);
    this.mount.appendChild(renderer.domElement);

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener("resize", onWindowResize, false);

    camera.position.z = 100;

    scene.background = new THREE.Color(0xd9d8d4);

    const textureLoader = new THREE.TextureLoader();

    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.controls = controls;
    this.secondaryLight = secondaryLight;

    this.textures = [textureLoader.load(texture)];
    this.raycaster = new THREE.Raycaster();
    this.mousePosition = new THREE.Vector2();
    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    const outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      scene,
      camera
    );
    this.outlinePass = outlinePass;
    outlinePass.visibleEdgeColor.setHex(0xff4503);
    outlinePass.edgeGlow = 0.05;
    outlinePass.edgeStrength = 10;
    this.composer.addPass(outlinePass);
    this.controls.addEventListener("change", () => {
      this.composer.render();
    });

    // hover tooltip
    this.selectedObject = null;
    this.renderer.domElement.addEventListener("pointermove", (e) => {
      if (e.isPrimary === false) return;
      this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mousePosition, this.camera);
      const intersects = this.raycaster.intersectObject(this.scene, true);
      if (intersects.length > 0) {
        if (intersects.length > 1) {
          const firstIntersect = intersects.filter(
            (i) => i.object.name !== "Nerve ring"
          )[0];

          firstIntersect != null
            ? (this.selectedObject = firstIntersect.object)
            : null;
        } else {
          this.selectedObject = intersects[0].object;
        }

        // this.selectedObject != null ? outlinePass.selectedObjects = [this.selectedObject] : outlinePass.selectedObjects = [];
        this.setState({
          showTooltip: true,
          selectedObject: this.selectedObject,
        });
      } else {
        // this.selectedObject = null;
        // outlinePass.selectedObjects = [];
        this.setState({
          showTooltip: false,
          selectedObject: null,
        });
      }
    });

    this.renderer.domElement.addEventListener("click", (e) => {
      this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mousePosition, this.camera);
      const intersects = this.raycaster.intersectObject(this.scene, true);
      const firstSynapseIntersect = intersects.filter((i) =>
        i.object.name.includes("➝")
      )[0];

      if (firstSynapseIntersect) {
        const synapseData = firstSynapseIntersect.object.userData;
        this.setState({
          synapseDetail: synapseData,
          showSynapseDetail: true,
          // synapseDetailPosition: {
          //   x: e.clientX + 150,
          //   y: e.clientY - 25
          // }
        });
        this.outlinePass.selectedObjects = [firstSynapseIntersect.object];
      } else {
        this.setState({
          showSynapseDetail: false,
        });
        this.outlinePass.selectedObjects = [];
      }
      this.composer.render();
    });

    this.controls.addEventListener(
      "change",
      debounce((e) => {
        this.setState({
          synapseDetail: null,
          showSynapseDetail: false,
          showSettings: false,
        });
      }),
      250
    );
    this.composer.render();

    this.directionIndicatorScene = {};
    const directionScene = new THREE.Scene();
    const directionRenderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    directionRenderer.setSize(250, 250);
    this.directionMount.append(directionRenderer.domElement);
    const directionCamera = new THREE.PerspectiveCamera(750, 1, 1, 100000);
    directionCamera.position.z = 100;
    const axesHelper = new THREE.AxesHelper(15);
    directionScene.add(axesHelper);
    directionScene.background = new THREE.Color(0xd9d8d4);
    const directionControls = new OrbitControls(
      directionCamera,
      directionRenderer.domElement
    );
    directionControls.enableZoom = false;
    directionControls.addEventListener("change", () => {
      directionRenderer.render(directionScene, directionCamera);
    });

    const dorsalDiv = document.createElement("div");
    dorsalDiv.className = "label";
    dorsalDiv.textContent = "Dorsal";
    dorsalDiv.style.marginTop = "-1em";
    const dorsalLabel = new CSS2DObject(dorsalDiv);
    dorsalLabel.position.set(0, 20, 0);
    axesHelper.add(dorsalLabel);

    const posteriorDiv = document.createElement("div");
    posteriorDiv.className = "label";
    posteriorDiv.textContent = "Posterior";
    posteriorDiv.style.marginTop = "-1em";
    const posteriorLabel = new CSS2DObject(posteriorDiv);
    posteriorLabel.position.set(20, 0, 0);
    axesHelper.add(posteriorLabel);

    const leftDiv = document.createElement("div");
    leftDiv.className = "label";
    leftDiv.textContent = "Left";
    leftDiv.style.marginTop = "-1em";
    const leftLabel = new CSS2DObject(leftDiv);
    leftLabel.position.set(0, 0, 20);
    axesHelper.add(leftLabel);

    axesHelper.position.setY(-10);
    directionRenderer.render(directionScene, directionCamera);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(250, 250);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.top = "0px";

    this.directionMount.append(labelRenderer.domElement);
    labelRenderer.render(directionScene, directionCamera);

    this.controls.addEventListener("change", (e) => {
      directionCamera.rotation.copy(this.camera.rotation);
      directionCamera.position.copy(
        this.camera.position.clone().normalize().multiplyScalar(100)
      );

      directionRenderer.render(directionScene, directionCamera);
      this.composer.render();
      labelRenderer.render(directionScene, directionCamera);
    });

    const searchParams = new URLSearchParams(this.props.location.search);
    let searchInput = "";
    if (searchParams.has("neurons")) {
      searchInput = searchParams.get("neurons")?.split(",").join(", ");
    }

    this.handleSearchBarChange({
      target: {
        value: searchInput,
      },
    });
  }

  setShowSettingsMenu(show) {
    this.setState({
      showSettings: show,
    });
  }

  handleNeuronColorClick(neuronName) {
    let nextShowColorPicker = !this.state.showColorPicker;
    let nextColorPickerNeuron = "";
    if (nextShowColorPicker || neuronName != this.state.colorPickerNeuron) {
      nextColorPickerNeuron = neuronName;
      nextShowColorPicker = true;
    }

    this.setState({
      colorPickerNeuron: nextColorPickerNeuron,
      showColorPicker: nextShowColorPicker,
    });
  }

  // start the process of changing a color for pre, post or synapse
  handleSynapseColorClick(synapseType) {
    let showColorPickerSynapse = !this.state.showColorPickerSynapse;
    let nextColorPickerSynapse = "";
    if (
      showColorPickerSynapse ||
      synapseType != this.state.colorPickerSynapse
    ) {
      nextColorPickerSynapse = synapseType;
      showColorPickerSynapse = true;
    }

    this.setState({
      colorPickerSynapse: nextColorPickerSynapse,
      showColorPickerSynapse: showColorPickerSynapse,
    });
  }

  handleSynapseColorPickerChange(color) {
    const nextSynapseColorState = Object.assign(this.state.synapseColors, {
      [this.state.colorPickerSynapse]: color.hex,
    });

    this.setState(
      {
        synapseColors: nextSynapseColorState,
      },
      () =>
        this.debouncedUpdateSynapseMeshColor(
          color,
          this.state.colorPickerSynapse
        )
    );
  }

  updateNeuronMeshColor = (color, neuron) => {
    let neuronObj = this.scene.getObjectByName(this.state.colorPickerNeuron);

    neuronObj.material.color.set(color.hex);
    this.composer.render();
  };

  debouncedUpdateNeuronMeshColor = debounce(this.updateNeuronMeshColor, 200);

  updateSynapseMeshColor = (color, synapseType) => {
    this.scene.getObjectByName("currentNeurons").children.forEach((c) => {
      if (c.userData.type === synapseType) {
        c.material.color.set(color.hex);
      }
    });

    this.composer.render();
  };

  debouncedUpdateSynapseMeshColor = debounce(this.updateSynapseMeshColor, 200);

  handleColorPickerChange(color) {
    const nextNeuronState = Object.assign(
      this.state.neuronState[this.state.colorPickerNeuron],
      {
        color: color.hex,
      }
    );

    this.setState(
      {
        neuronState: {
          ...this.state.neuronState,
          [this.state.colorPickerNeuron]: nextNeuronState,
        },
      },
      () =>
        this.debouncedUpdateNeuronMeshColor(color, this.state.colorPickerNeuron)
    );
  }

  viewNeuron() {
    const selectedNeurons = neuronsSorted.filter(
      (n) => this.state.neuronState[n].selected
    );
    const firstNeuron = Array.from(selectedNeurons)[0];
    const allAreClassMembers = Array.from(selectedNeurons)
      .map((n) => this.state.neuronState[n] != null)
      .reduce((a, b) => a && b, true);
    const allHaveSameClass =
      new Set(Array.from(selectedNeurons).map((n) => model.neuronInfo[n].class))
        .size === 1;
    const onlyOneNeuron = selectedNeurons.length === 1;
    const onlyOneNeuronClass =
      selectedNeurons.length > 1 && allAreClassMembers && allHaveSameClass;

    Promise.all([
      getNeuronModels(Array.from(selectedNeurons)),
      onlyOneNeuron
        ? getNeuronSynapses(firstNeuron)
        : onlyOneNeuronClass
        ? getNeuronClassSynapses(selectedNeurons)
        : getSynapsesBetween(Array.from(selectedNeurons)),
      getNerveRingModel(),
    ]).then(
      ([neuronModelBuffers, synapsePositionInfo, nerveRingModelBuffer]) => {
        let currentNeuronGroup = this.scene.getObjectByName("currentNeurons");
        this.scene.remove(currentNeuronGroup);
        if (currentNeuronGroup != null) {
          currentNeuronGroup.children.forEach((child) => {
            child.geometry.dispose();
            child.material.dispose();
          });
          currentNeuronGroup = null;
        }

        let currentNeurons = new THREE.Group();
        currentNeurons.name = "currentNeurons";

        let loadModel = (
          buffer,
          modelName,
          color,
          opacity = 1.0,
          renderOrder = 0
        ) => {
          const geometry = loader.parse(buffer);
          const material = new THREE.MeshMatcapMaterial({
            color: new THREE.Color(color),
            matcap: this.textures[0],
          });
          opacity != 1.0 ? (material.transparent = true) : null;
          opacity != 1.0 ? (material.opacity = opacity) : null;

          const mesh = new THREE.Mesh(geometry, material);
          mesh.name = modelName;

          mesh.renderOrder = renderOrder;
          return mesh;
        };
        let createSphere = ([x, y, z], name, color, size, data) => {
          const geometry = new THREE.SphereGeometry(2 * size, 16, 16);
          const material = new THREE.MeshMatcapMaterial({
            color: new THREE.Color(color),
            matcap: this.textures[0],
          });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(x, y, z);
          sphere.name = name;
          sphere.userData = data;
          currentNeurons.add(sphere);
        };

        if (this.state.showWormBody) {
          const nerveRing = loadModel(
            nerveRingModelBuffer,
            "Nerve ring",
            "#d9d9d9",
            0.3,
            10
          );
          currentNeurons.add(nerveRing);
        }

        if (this.state.showNeuronModels) {
          neuronModelBuffers.forEach((buffer, index) => {
            const { neuronName, color } =
              this.state.neuronState[selectedNeurons[index]];
            const mesh = loadModel(buffer, neuronName, color, 0.6);

            currentNeurons.add(mesh);
          });
        }

        if (this.state.showSynapseModels) {
          synapsePositionInfo.forEach((syn) => {
            const { position, pre, post, catmaidId, volumeSize } = syn;
            const [x, y, z] = position;
            const translatedVolume = volumeSize / 10000000;
            let color = this.state.synapseColors["synapse"];
            let type = "synapse";

            if (onlyOneNeuron) {
              if (pre === firstNeuron) {
                color = this.state.synapseColors["pre"];
                type = "pre";
              } else {
                color = this.state.synapseColors["post"];
                type = "post";
              }
            }

            if (onlyOneNeuronClass) {
              if (selectedNeurons.includes(pre)) {
                color = this.state.synapseColors["pre"];
                type = "pre";
              } else {
                color = this.state.synapseColors["post"];
                type = "post";
              }
            }

            createSphere(
              [x, y, z],
              `${pre} ➝ ${post.split(",").join(", ")}`,
              color,
              Math.min(Math.max(0.05, translatedVolume), 0.5),
              Object.assign(syn, { type })
            );
          });
        }

        currentNeurons.rotation.y = Math.PI;

        // center the current neurons group
        const box = new THREE.Box3().setFromObject(currentNeurons);
        const c = box.getCenter(new THREE.Vector3());
        currentNeurons.position.set(-c.x, -c.y, -c.z);

        this.scene.add(currentNeurons);
        this.composer.render();
      }
    );
  }

  toggleAnimationLoop() {
    this.setState(
      {
        animating: !this.state.animating,
      },
      () => {
        if (this.state.animating) {
          this.controls.autoRotate = true;
          this.controls.autoRotateSpeed = 10;
          this.renderer.setAnimationLoop(() => {
            this.composer.render();
            this.controls.update();
          });
        } else {
          this.renderer.setAnimationLoop(null);
          this.composer.render();
          this.controls.autoRotate = false;
          this.controls.update();
        }
      }
    );
  }

  handleSearchBarChange(e) {
    let value = e.target.value.toUpperCase();
    let isNeuron = (token) => neurons.indexOf(token) !== -1;
    let isNeuronClass = (token) => this.state.neuronClassState[token] != null;
    let recognizedNeurons = new Set(
      value.split(", ").filter((token) => isNeuron(token))
    );

    let recognizedNeuronClasses = new Set(
      value.split(", ").filter((token) => isNeuronClass(token))
    );

    Array.from(recognizedNeuronClasses).forEach((c) => {
      model.getNeuronClassMembers(c).forEach((cm) => recognizedNeurons.add(cm));
    });

    let nextState = {
      selectedNeurons: recognizedNeurons,
      searchInput: value,
      neuronState: {},
    };

    neuronsSorted.forEach(
      (n) =>
        (nextState.neuronState[n] = Object.assign(this.state.neuronState[n], {
          selected: false,
        }))
    );

    recognizedNeurons.forEach(
      (n) =>
        (nextState.neuronState[n] = Object.assign(this.state.neuronState[n], {
          selected: true,
        }))
    );

    this.setState(nextState, () => this.viewNeuron());
  }

  toggleNeuron(neuronName, selected) {
    const nextNeuronState = Object.assign(this.state.neuronState[neuronName], {
      selected,
    });

    let nextSearchInput = "";

    if (selected) {
      const tokens = this.state.searchInput.split(", ");
      const lastToken = tokens.pop();
      nextSearchInput = `${
        tokens.length > 0 ? tokens.join(", ") + ", " : ""
      }${neuronName},`;
    } else {
      // const tokens = this.state.searchInput.split(',').filter(item => item != neuronName);
      // nextState['searchInput'] = tokens.join(',');
      // console.log(nextState['searchInput'])
    }

    this.setState(
      {
        neuronState: {
          ...this.state.neuronState,
          [this.state.neuronState[neuronName]]: nextNeuronState,
        },
        searchInput: nextSearchInput,
      },
      () => this.viewNeuron()
    );
  }

  toggleNeuronClass(neuronClass, selected) {
    const nextNeuronClassState = Object.assign(
      this.state.neuronClassState[neuronClass],
      {
        selected,
      }
    );

    const nextNeuronClassMembersState = {};

    const classMembers = model.getNeuronClassMembers(neuronClass);
    classMembers.forEach((member) => {
      nextNeuronClassMembersState[this.state.neuronState[member]] =
        Object.assign(this.state.neuronState[member], { selected });
    });

    let nextSearchInput = "";

    if (selected) {
      const tokens = this.state.searchInput.split(", ");
      const lastToken = tokens.pop();
      nextSearchInput = `${
        tokens.length > 0 ? tokens.join(", ") + ", " : ""
      }${neuronClass},`;
    } else {
      // const tokens = this.state.searchInput.split(',').filter(item => item != neuronName);
      // nextState['searchInput'] = tokens.join(',');
      // console.log(nextState['searchInput'])
    }

    this.setState(
      {
        neuronState: {
          ...this.state.neuronState,
          nextNeuronClassMembersState,
        },
        neuronClassState: {
          ...this.state.neuronClassState,
          nextNeuronClassState,
        },
        searchInput: nextSearchInput,
      },
      () => this.viewNeuron()
    );
  }

  exportImage() {
    const { selectedNeurons } = this.getNeuronPartitions();
    this.setState(
      {
        showImageElements: true,
      },
      async () => {
        let mimeType = "image/png";
        let viewerImage = this.renderer.domElement.toDataURL(mimeType);
        let legendNode = ReactDOM.findDOMNode(this.imageLegendRef.current);
        let watermarkNode = ReactDOM.findDOMNode(
          this.imageWatermarkRef.current
        );

        let legendComponentCanvas = await html2canvas(legendNode, {
          scrollY: -window.scrollY,
        });
        let watermarkCanvas = await html2canvas(watermarkNode, {
          scrollY: -window.scrollY,
        });
        let legendImage = legendComponentCanvas.toDataURL(mimeType);
        let watermarkImage = watermarkCanvas.toDataURL(mimeType);

        let combinedImage = await mergeImages([
          { src: viewerImage, x: 0, y: 0 },
          { src: legendImage, x: 0, y: 0 },
          {
            src: watermarkImage,
            x: this.renderer.domElement.clientWidth - 340,
            y: this.renderer.domElement.clientHeight - 80,
          },
        ]);
        saveAs(
          combinedImage,
          `${selectedNeurons.map((n) => n.neuronName).join("_")}.png`
        );
        this.setState({
          showImageElements: false,
        });
      }
    );
  }

  getNeuronPartitions() {
    const selectedNeurons = [];
    const unselectedNeurons = [];

    neuronsSorted.forEach((n) => {
      const neuronInfo = Object.assign(this.state.neuronState[n], {
        neuronName: n,
      });
      if (this.state.neuronState[n].selected) {
        selectedNeurons.push(neuronInfo);
      } else {
        unselectedNeurons.push(neuronInfo);
      }
    });

    return {
      selectedNeurons,
      unselectedNeurons,
    };
  }

  getNeuronClassPartitions() {
    const selectedNeuronClasses = [];
    const unselectedNeuronClasses = [];

    neuronClassesSorted.forEach((c) => {
      if (this.state.neuronClassState[c].selected) {
        selectedNeuronClasses.push(this.state.neuronClassState[c]);
      } else {
        unselectedNeuronClasses.push(this.state.neuronClassState[c]);
      }
    });

    return {
      selectedNeuronClasses,
      unselectedNeuronClasses,
    };
  }

  render() {
    const { selectedNeurons, unselectedNeurons } = this.getNeuronPartitions();
    const { selectedNeuronClasses, unselectedNeuronClasses } =
      this.getNeuronClassPartitions();
    const {
      showTooltip,
      selectedObject,
      searchInput,
      synapseDetail,
      showSynapseDetail,
      // synapseDetailPosition
    } = this.state;
    const onlyOneNeuron = Array.from(selectedNeurons).length === 1;
    const lastSearchTerm = searchInput.split(", ").pop();
    const _selectedNeurons = neuronsSorted.filter(
      (n) => this.state.neuronState[n].selected
    );
    const allAreClassMembers = Array.from(_selectedNeurons)
      .map((n) => this.state.neuronState[n] != null)
      .reduce((a, b) => a && b, true);
    const allHaveSameClass =
      new Set(
        Array.from(_selectedNeurons).map((n) => model.neuronInfo[n].class)
      ).size === 1;
    const onlyOneNeuronClass =
      _selectedNeurons.length > 1 && allAreClassMembers && allHaveSameClass;

    const searchSuggestions = [...unselectedNeurons, ...unselectedNeuronClasses]
      .sort((a, b) => b.neuronName - a.neuronName)
      .filter((n) => n.neuronName.startsWith(lastSearchTerm));

    // return h(TourProvider, { steps, isOpen: true }, [
    // h('div', { id: 'app', className: `w-screen h-screen ${showTooltip ? 'cursor-pointer' : ''}`, ref: (r) => (this.mount = r) }, [

    return h(
      "div",
      {
        id: "app",
        className: `w-screen h-screen ${showTooltip ? "cursor-pointer" : ""}`,
        ref: (r) => (this.mount = r),
      },
      [
        h(
          "div",
          {
            id: "searchbar",
            "data-tour": "step=1",
            className: styles.searchbar,
          },
          [
            h("div", { className: styles.stickyTop }, [
              h(TextInput, {
                size: "md",
                radius: "sm",
                onChange: (e) => this.handleSearchBarChange(e),
                value: this.state.searchInput,
                placeholder: "Search neurons",
              }),
            ]),
            this.state.searchInput !== ""
              ? h("div", { className: styles.unselectedNeuronsContainer }, [
                  ...searchSuggestions.map((n) => {
                    if (n.isNeuron) {
                      return h(NeuronListItem, {
                        neuronName: n.neuronName,
                        selected: n.selected,
                        color: n.color,
                        topLevelOnClick: () =>
                          this.toggleNeuron(n.neuronName, !n.selected),
                        colorOnClick: () => {},
                      });
                    } else {
                      return h(NeuronListItem, {
                        neuronName: n.neuronName,
                        selected: false,
                        color: "",
                        topLevelOnClick: () =>
                          this.toggleNeuronClass(n.neuronName, !n.selected),
                        colorOnClick: () => {},
                      });
                    }
                  }),
                ])
              : null,
          ]
        ),
        h(
          MouseTooltip,
          { visible: this.state.showTooltip, offsetX: 50, offsetY: -25 },
          [
            h(
              "div",
              { className: styles.neuronNameTooltip },
              selectedObject != null ? selectedObject.name : null
            ),
          ]
        ),
        this.state.showColorPicker
          ? h(
              "div",
              { id: "colorpicker", className: styles.colorPickerWidget },
              [
                h(Group, [
                  h(CloseButton, {
                    onClick: (e) =>
                      this.setState({
                        colorPickerNeuron: "",
                        showColorPicker: false,
                      }),
                  }),
                  h(
                    "div",
                    { className: "justify-self-center" },
                    `Color Picker - ${this.state.colorPickerNeuron}`
                  ),
                ]),
                h(SketchPicker, {
                  className: styles.colorPicker,
                  color:
                    this.state.neuronState[this.state.colorPickerNeuron].color,
                  onChange: (color, e) =>
                    this.handleColorPickerChange(color, e),
                  presetColors: Object.values(neuronColorMap),
                }),
              ]
            )
          : null,
        this.state.showColorPickerSynapse
          ? h(
              "div",
              { id: "syapsecolorpicker", className: styles.colorPickerWidget },
              [
                h(Group, [
                  h(CloseButton, {
                    onClick: (e) =>
                      this.setState({
                        colorPickerSynapse: "",
                        showColorPickerSynapse: false,
                      }),
                  }),
                  h(
                    "div",
                    { className: "justify-self-center" },
                    `Color Picker - ${this.state.colorPickerSynapse}`
                  ),
                ]),
                h(SketchPicker, {
                  className: styles.colorPicker,
                  color:
                    this.state.synapseColors[this.state.colorPickerSynapse],
                  onChange: (color, e) =>
                    this.handleSynapseColorPickerChange(color, e),
                }),
              ]
            )
          : null,

        h("div", { id: "legend", className: styles.legendContainer }, [
          Array.from(selectedNeurons).length > 0
            ? h("div", { className: styles.selectedNeuronLegend }, [
                h(
                  "div",
                  { className: styles.selectedNeuronsContainer },
                  Array.from(selectedNeurons).map((n) =>
                    h(NeuronListItem, {
                      ...n,
                      colorPickerNeuron: this.state.colorPickerNeuron,
                      colorOnClick: (e) => {
                        e.stopPropagation();
                        this.handleNeuronColorClick(n.neuronName);
                      },
                      controller: this,
                    })
                  )
                ),
              ])
            : null,
          Array.from(selectedNeurons).length > 0
            ? h("div", { className: styles.synapseLegend }, [
                h(
                  "div",
                  { className: styles.selectedNeuronsContainer },
                  (onlyOneNeuron || onlyOneNeuronClass
                    ? ["pre", "post"]
                    : ["synapse"]
                  ).map((n) =>
                    h(NeuronListItem, {
                      neuronName: n,
                      color: this.state.synapseColors[n],
                      selected: true,
                      colorOnClick: (e) => {
                        e.stopPropagation();
                        this.handleSynapseColorClick(n);
                      },
                    })
                  )
                ),
              ])
            : null,
        ]),
        this.state.synapsePositionInfo.length > 0
          ? h(
              "div",
              { className: styles.synapseInfo },
              this.state.synapsePositionInfo.map((syn) => {
                const { pre, post, catmaidLink, volumeSize } = syn;
                const neurons = [pre, ...post.split(",")].join("__");
                const nemanodeLink = `http://nemanode.com?db=head&ds=witvliet_2020_8&in=${neurons}`;
                return h(
                  "div",
                  {
                    className: styles.synapseInfoEntry,
                  },
                  [
                    h("div", `${pre} ➝ ${post.split(",").join(", ")}`),
                    h("div", [`Volume: ${volumeSize} nm`, h("sup", "3")]),
                    h("div", [
                      h(
                        "a",
                        { target: "_blank", href: nemanodeLink },
                        "Open in NemaNode"
                      ),
                    ]),
                  ]
                );
              })
            )
          : null,
        this.state.showImageElements
          ? h(
              "div",
              {
                ref: this.imageLegendRef,
                className: styles.imageLegend.container,
              },
              Array.from(selectedNeurons).map((n) =>
                h(
                  "div",
                  {
                    style: { backgroundColor: "#D9D8D4" },
                    className: styles.imageLegend.imageLegendEntry,
                  },
                  [
                    h("div", { className: "mr-2 self-start" }, n.neuronName),
                    h("div", {
                      style: { backgroundColor: n.color },
                      className: styles.imageLegend.imageLegendEntryColor,
                    }),
                  ]
                )
              )
            )
          : null,
        this.state.showImageElements
          ? h(
              "div",
              {
                ref: this.imageWatermarkRef,
                style: { backgroundColor: "#D9D8D4" },
                className: styles.imageWatermark.container,
              },
              [h("div", "(2021 Witvliet et al.)")]
            )
          : null,
        h("div", { className: styles.controls }, [
          h(
            "i",
            {
              id: "animate",
              "data-tip": true,
              "data-for": "animation-tooltip",
              className: styles.colorPickerClose,
              onClick: (e) => this.toggleAnimationLoop(),
            },
            "animation"
          ),
          h(
            "i",
            {
              id: "exportimage",
              "data-tip": true,
              "data-for": "export-image-tooltip",
              className: styles.colorPickerClose,
              onClick: (e) => this.exportImage(),
            },
            "image"
          ),
          h(
            Popover,
            {
              style: {
                marginTop: 6,
              },
              closeOnClickOutside: true,
              trapFocus: false,
              opened: this.state.showSettings,
              onClose: () => this.setShowSettingsMenu(false),
              target: h(
                "i",
                {
                  id: "settings",
                  "data-tip": true,
                  "data-for": "view-settings-tooltip",
                  className: styles.colorPickerClose,
                  onClick: (e) => this.setShowSettingsMenu(true),
                },
                "settings"
              ),
              width: 260,
              position: "bottom",
              withArrow: true,
            },
            [
              h(Stack, { id: "controls" }, [
                h(Group, { position: "apart" }, [
                  h(Text, "Settings"),
                  h(CloseButton, {
                    onClick: () => this.setShowSettingsMenu(false),
                  }),
                ]),
                h(Switch, {
                  onLabel: "ON",
                  offLabel: "OFF",
                  size: "md",
                  checked: this.state.showWormBody,
                  onChange: (e) => {
                    this.setState({ showWormBody: e.target.checked });
                    this.viewNeuron();
                  },
                  label: "Toggle worm body",
                }),
                h(Switch, {
                  onLabel: "ON",
                  offLabel: "OFF",
                  size: "md",
                  checked: this.state.showSynapseModels,
                  onChange: (e) => {
                    this.setState({ showSynapseModels: e.target.checked });
                    this.viewNeuron();
                  },
                  label: "Toggle synapses",
                }),
                h(Switch, {
                  onLabel: "ON",
                  offLabel: "OFF",
                  size: "md",
                  checked: this.state.showNeuronModels,
                  onChange: (e) => {
                    this.setState({ showNeuronModels: e.target.checked });
                    this.viewNeuron();
                  },
                  label: "Toggle neurons",
                }),
              ]),
            ]
          ),
          h(
            "i",
            {
              id: "help",
              "data-tip": true,
              "data-for": "view-help-tooltip",
              className: styles.colorPickerClose,
              onClick: (e) => {
                this.handleSearchBarChange({ target: { value: "AIY, ASEL" } });
                this.setState({
                  showColorPicker: true,
                  colorPickerNeuron: "ASEL",
                });
                this.setState({ showTour: true });
              },
            },
            "help"
          ),
          h(
            ReactTooltip,
            { id: "animation-tooltip", type: "light" },
            "Toggle animation loop"
          ),
          h(
            ReactTooltip,
            { id: "export-image-tooltip", type: "light" },
            "Export image"
          ),
          h(
            ReactTooltip,
            { id: "view-settings-tooltip", type: "light" },
            "Settings"
          ),
          h(ReactTooltip, { id: "view-help-tooltip", type: "light" }, "Help"),

          // h(
          //   'i',
          //   {
          //     className: styles.colorPickerClose,
          //     onClick: (e) => {},
          //   },
          //   'gif_box'
          // ),
        ]),
        this.state.showSynapseDetail
          ? h(
              "div",
              {
                className:
                  "bg-white p-4 rounded shadow-lg w-80 absolute left-2 top-1/3 z-10",
              },
              [
                h("div", { className: "flex justify-between p-2" }, [
                  h(
                    "div",
                    { className: "font-bold text-gray-700" },
                    `${synapseDetail.pre} ➝ ${synapseDetail.post
                      .split(",")
                      .join(", ")}`
                  ),
                  h(
                    "div",
                    {
                      className:
                        "text-gray-400 hover:text-gray-700 cursor-pointer",
                      onClick: (e) =>
                        this.setState({ showSynapseDetail: false }),
                    },
                    "X"
                  ),
                ]),
                h("div", { className: "flex pl-4 pr-4 pt-2 pb-2" }, [
                  h(
                    "div",
                    { className: "text-gray-500 font-light mr-2" },
                    "Volume:"
                  ),
                  h("div", { className: "text-gray-500 font-bold" }, [
                    `${synapseDetail.volumeSize} nm`,
                    h("sup", "3"),
                  ]),
                ]),
                h("div", { className: "pl-4 pr-4 pt-2 pb-2 flex" }, [
                  h(
                    "div",
                    { className: "text-gray-500 font-light mr-2" },
                    "View in:"
                  ),
                  h("div", [
                    h(
                      "a",
                      {
                        className: "underline text-gray-500",
                        target: "_blank",
                        href: `http://nemanode.com?db=head&ds=witvliet_2020_8&in=${[
                          synapseDetail.pre,
                          ...synapseDetail.post.split(","),
                        ].join("__")}`,
                      },
                      "NemaNode"
                    ),
                  ]),
                ]),
              ]
            )
          : null,
        h(
          "div",
          { className: "absolute bottom-2 w-60 inset-x-1/2" },
          "SEM Adult (2021 Witvliet et al.)"
        ),
        h("div", {
          id: "directionindicator",
          ref: (r) => (this.directionMount = r),
          className: "absolute bottom-2 right-2 h-[250] w-[250] ",
        }),
        h(Tour, {
          steps: [
            {
              selector: "#searchbar",
              content: (
                <p>
                  Input your favorite neurons or neuron classes seperated by a
                  comma. For example: AIY, ASEL
                </p>
              ),
              position: "bottom",
            },
            {
              selector: "#app",
              position: [100, 100],
              content: (
                <p>
                  Explore the 3D model by dragging your mouse and zooming in and
                  out.
                </p>
              ),
            },
            {
              selector: "#app",
              position: [100, 100],
              content: <p>Click synapses spheres for more information.</p>,
            },
            {
              selector: "#animate",
              content: <p>Perform a continuous rotation animation.</p>,
            },
            {
              selector: "#exportimage",
              content: <p>Export the 3D view as a png image.</p>,
            },
            {
              selector: "#settings",
              content: <p>Show/hide various elements of the 3D view.</p>,
            },
            {
              selector: "#help",
              content: <p>Show/hide the tour</p>,
            },
            {
              selector: "#legend",
              content: (
                <p>
                  Click on the colored circle of any neuron or synapse to open
                  the color picker.
                </p>
              ),
            },
            {
              selector: "#colorpicker",
              content: <p>Chose a color for the selected neuron.</p>,
            },
            {
              selector: "#directionindicator",
              content: <p>Dorsal, posterior and left indicators.</p>,
            },
          ],
          showNumber: false,
          isOpen: this.state.showTour,
          rounded: 4,
          lastStepNextButton: <Button>Done</Button>,
          onRequestClose: () => this.setState({ showTour: false }),
        }),
      ]
    );
  }
}
