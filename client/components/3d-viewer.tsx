import React from 'react';
import * as THREE from 'three';
import chroma from 'chroma-js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';

import MouseTooltip from 'react-sticky-mouse-tooltip';

import h from 'react-hyperscript';

import { getNeuronModels } from 'services';
import model from '../model';
import texture from '../images/texture.jpg';

const loader = new STLLoader();
const NeuronListItem = props => {
  const { neuronName, color, selected, controller } = props;
  const styles = {
    NeuronListItem: 'cursor-pointer flex justify-between row items-center pl-4 pr-4 pt-2 pb-2 hover:bg-gray-300',
    neuronName: '',
    neuronChecked: 'cursor-pointer mr-4',
    neuronColorPicker: 'w-5 h-5 shadow-inner rounded hover:w-8 hover:h-8'
  };

  return h('div', {className: styles.NeuronListItem, onClick: () => controller.toggleNeuron(neuronName, !selected)}, [
    h('div', {className: 'w-20 flex items-center'}, [
      h('input', { className: styles.neuronChecked, type: 'checkbox', checked: selected, onChange: () => controller.toggleNeuron(neuronName, !selected)}),
      h('div', {className: styles.neuronName}, neuronName),  
    ]),
    selected ? 
      h('div', { style: {backgroundColor: color}, className: styles.neuronColorPicker}, '') : null
  ]);
};


const neuronsSorted = model.neurons.map(n => n.id).sort();

export default class StlViewer extends React.Component {
  constructor(props) {
    super(props);


    this.state = {
      searchInput: '',
      selectedNeurons: new Set(),
      showNeuronNameTooltip: false,
      hoveredNeuron: null
    };

    neuronsSorted.forEach(n => {
      this.state[n] = {
        selected: false,
        color: chroma.random().hex()
      };
    });
  }

  componentDidMount() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      750,
      window.innerWidth / window.innerHeight,
      10,
      100000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxDistance = 500;
    controls.minDistance = 10;

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

    window.addEventListener('resize', onWindowResize, false);

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

    const renderPass = new RenderPass( this.scene, this.camera );
    this.composer.addPass(renderPass);
    const outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
    outlinePass.visibleEdgeColor.setHex(0xff4503);
    outlinePass.edgeGlow = 0.05;
    outlinePass.edgeStrength = 10;
    this.composer.addPass(outlinePass);
    this.controls.addEventListener('change', () => {
      this.composer.render();
    });

    // hover outline
    this.selectedObject = null;
    this.renderer.domElement.addEventListener('pointermove', e => {
      if (e.isPrimary === false) return;
      this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mousePosition, this.camera);
      const intersects = this.raycaster.intersectObject(this.scene, true);

      if (intersects.length > 0) {
        this.selectedObject = intersects[ 0 ].object;
        outlinePass.selectedObjects = [this.selectedObject];
        this.setState({
          showNeuronNameTooltip: true,
          selectedObject: this.selectedObject
        })
      } else {
        this.selectedObject = null;
        outlinePass.selectedObjects = [];
        this.setState({
          showNeuronNameTooltip: false,
          selectedObject: null
        })
      }

      this.composer.render();      
    });
    this.composer.render();

  }

  viewNeuron() {
    const selectedNeurons = neuronsSorted.filter(n => this.state[n].selected);

    getNeuronModels(Array.from(selectedNeurons)).then((neuronModelBuffers) => {
      let currentNeuronGroup = this.scene.getObjectByName('currentNeurons');
      this.scene.remove(currentNeuronGroup);
      if (currentNeuronGroup != null) {
        currentNeuronGroup.children.forEach((child) => {
          child.geometry.dispose();
          child.material.dispose();
        });
        currentNeuronGroup = null;
      }

      let currentNeurons = new THREE.Group();
      currentNeurons.name = 'currentNeurons';

      neuronModelBuffers.forEach((buffer, index) => {
        const {neuronName, color } = this.state[selectedNeurons[index]];
        const geometry = loader.parse(buffer);
        const material = new THREE.MeshMatcapMaterial({
          color: new THREE.Color(color),
          matcap: this.textures[0],
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = neuronName;

        mesh.geometry.computeVertexNormals(true);
        mesh.rotation.x = Math.PI / -2;
        currentNeurons.add(mesh);
      });

      // center the current neurons group
      const box = new THREE.Box3().setFromObject(currentNeurons);
      const c = box.getCenter(new THREE.Vector3());
      currentNeurons.position.set(-c.x, -c.y, -c.z);

      this.scene.add(currentNeurons);
      this.composer.render();      
    });
  }

  runAnimationLoop() {
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 10;
    this.renderer.setAnimationLoop(() => {
      this.composer.render();      
      this.controls.update();
    });
  }

  stopAnimationLoop() {
    this.renderer.setAnimationLoop(null);
    this.composer.render();
    this.controls.autoRotate = false;
    this.controls.update();
  }

  handleSearchBarChange(e) {
    let value = e.target.value;
    let isNeuron = (token) => model.neuronInfo[token] != null;
    let neurons = new Set(value.split(' ').filter((token) => isNeuron(token)))

    let nextState = {
      selectedNeurons: neurons,

    };

    neurons.forEach(n => nextState[n] = Object.assign(this.state[n], {selected: true}));

    this.setState(nextState, () => this.viewNeuron());
  }

  toggleNeuron(neuronName, selected){
    const nextState = {

    };
    nextState[neuronName] = Object.assign(this.state[neuronName], {
      selected
    });

    this.setState(nextState, () => this.viewNeuron());
  }

  render() {
    const selectedNeurons = [];
    const unselectedNeurons = [];
    const { showNeuronNameTooltip, selectedObject } = this.state;

    neuronsSorted.forEach(n => {
      const neuronInfo = Object.assign(this.state[n], {neuronName: n});
      if (this.state[n].selected){
        selectedNeurons.push(neuronInfo);
      } else {
        unselectedNeurons.push(neuronInfo);
      }
    });
    const styles = {
      page: 'w-screen h-screen',
      searchbar:
        'absolute top-4 left-4 w-60 h-2/3 shadow-lg bg-white rounded z-10 overflow-scroll',
      searchbarInput: ' p-4 w-full h-10 rounded',
      animateButtons:
        'absolute right-20 top-4 shadow-lg flex bg-white  z-10 rounded',
      animateButton:
        'bg-white shadow text-gray-600 rounded m-1 hover:bg-gray-200 pl-2 pr-2 m-4',
        selectedNeuronsContainer: ' sticky top-0 border-2 border-gray-300 bg-gray-300 font-bold text-gray-700',
        unselectedNeuronsContainer: 'text-gray-400',
        neuronNameTooltip: 'bg-white text-gray-400 shadow-lg p-4 rounded'
    };
    

    return h('div', { className: styles.page, ref: (r) => (this.mount = r) }, [
      h('div', { className: styles.searchbar }, [
        h('input', {
          type: 'text',
          className: styles.searchbarInput,
          onChange: (e) => this.handleSearchBarChange(e),
          value: this.state.searchInput,
          placeholder: 'Search neurons',
        }),
        h('div', { className: styles.selectedNeuronsContainer}, Array.from(selectedNeurons).map(n => h(NeuronListItem, { ...n, controller: this} ) )),
        h('div', { className: styles.unselectedNeuronsContainer}, unselectedNeurons.map(n => h(NeuronListItem, { ...n, controller: this})))
      ]),
      h(MouseTooltip, { visible: this.state.showNeuronNameTooltip, offsetX: 15, offsetY: 10}, [
        h('div', { className: styles.neuronNameTooltip},  selectedObject != null ? selectedObject.name : null)
      ]), 
      h('div', { className: styles.animateButtons }, [
        h(
          'button',
          {
            className: styles.animateButton,
            onClick: () => this.runAnimationLoop(),
          },
          'Start animation'
        ),
        h(
          'button',
          {
            className: styles.animateButton,
            onClick: () => this.stopAnimationLoop(),
          },
          'Stop animation'
        ),
      ]),
    ]);
  }
}
