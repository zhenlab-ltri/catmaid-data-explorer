import React from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import h from 'react-hyperscript';

import { getNeuronModels } from 'services';
import model from '../model';
import texture from '../images/texture.jpg';

const loader = new STLLoader();

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

    this.renderer.render(this.scene, this.camera);
    this.controls.addEventListener('change', () =>
      this.renderer.render(this.scene, this.camera)
    );

    this.textures = [textureLoader.load(texture)];
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
        const material = new THREE.MeshMatcapMaterial({
          color: new THREE.Color(0x49ef4),
          matcap: this.textures[0],
        });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.geometry.computeVertexNormals(true);
        mesh.rotation.x = Math.PI / -2;
        currentNeurons.add(mesh);
      });

      const bbox = new THREE.BoxHelper(currentNeurons, 0xffff00);
      currentNeurons.add(bbox);

      // center the current neurons group
      const box = new THREE.Box3().setFromObject(currentNeurons);
      const c = box.getCenter(new THREE.Vector3());
      currentNeurons.position.set(-c.x, -c.y, -c.z);

      this.scene.add(currentNeurons);
      this.renderer.render(this.scene, this.camera);
    });
  }

  runAnimationLoop() {
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 10;
    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
      this.controls.update();
    });
  }

  stopAnimationLoop() {
    this.renderer.setAnimationLoop(null);
    this.controls.autoRotate = false;
    this.controls.update();
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
      animateButtons:
        'absolute right-20 top-4 shadow-lg flex bg-white  z-10 rounded',
      animateButton:
        'bg-white shadow text-gray-600 rounded m-1 hover:bg-gray-200 pl-2 pr-2 m-4',
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
