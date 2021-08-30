import React from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import h from 'react-hyperscript';

import { getNeuronModels } from 'services';
import model from '../model';

// const STLLoader = TreeSTLLoader(THREE);
const loader = new STLLoader();
function createAnimate({ scene, camera, renderer }) {
  const triggers = [];

  function animate() {
    requestAnimationFrame(animate);

    triggers.forEach((trigger) => {
      trigger();
    });

    renderer.render(scene, camera);
  }
  function addTrigger(cb) {
    if (typeof cb === 'function') triggers.push(cb);
  }
  function offTrigger(cb) {
    const triggerIndex = triggers.indexOf(cb);
    if (triggerIndex !== -1) {
      triggers.splice(triggerIndex, 1);
    }
  }

  return {
    animate,
    addTrigger,
    offTrigger,
  };
}

export default class StlViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchInput: '',
      recognizedNeurons: [],
    };
  }

  componentDidMount() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      750,
      window.innerWidth / window.innerHeight,
      10,
      100000
    );
    const renderer = new THREE.WebGLRenderer();
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxDistance = 100;
    controls.minDistance = 10;

    /**
     * Light setup
     */
    const secondaryLight = new THREE.PointLight(0xff0000, 1, 100);
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
    const animate = createAnimate({ scene, camera, renderer });

    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.controls = controls;
    this.secondaryLight = secondaryLight;
    this.animate = animate;
  }

  viewNeuron() {
    const { recognizedNeurons } = this.state;

    getNeuronModels(recognizedNeurons).then((neuronModelBuffers) => {
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
      neuronModelBuffers.forEach((buffer) => {
        const geometry = loader.parse(buffer);
        const material = new THREE.MeshDepthMaterial();
        const mesh = new THREE.Mesh(geometry, material);

        mesh.geometry.computeVertexNormals(true);
        mesh.rotation.x = Math.PI / -2;

        currentNeurons.add(mesh);
      });

      this.scene.add(currentNeurons);
      // not sure what this is used for
      // this.animate.addTrigger(() => {});
      this.animate.animate();
    });
  }

  handleSearchBarChange(e) {
    let value = e.target.value;
    let isNeuron = (token) => model.neuronInfo[token] != null;
    let neurons = Array.from(
      new Set(value.split(' ').filter((token) => isNeuron(token)))
    );

    this.setState(
      {
        recognizedNeurons: neurons,
        searchInput: value,
      },
      () => this.viewNeuron()
    );
  }

  render() {
    const styles = {
      page: 'w-screen h-screen',
      searchbar:
        'absolute top-4 left-4 w-80 h-10 shadow-lg bg-white rounded z-10',
      searchbarInput: 'w-full h-full rounded',
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
      ]),
    ]);
  }
}
