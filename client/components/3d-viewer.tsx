import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import chroma from 'chroma-js';
import debounce from 'lodash.debounce';
import { SketchPicker } from 'react-color';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import MouseTooltip from 'react-sticky-mouse-tooltip';
import mergeImages from 'merge-images';
import html2canvas from 'html2canvas';
import h from 'react-hyperscript';
import { saveAs } from 'file-saver';

import { getNeuronModels, getNeuronSynapses, getNeuronsSynapses } from 'services';
import texture from '../images/texture.jpg';
import neurons from '../model/neurons.json';
import model from '../model';

const loader = new STLLoader();
const NeuronListItem = (props) => {
  const { neuronName, color, selected, colorPickerNeuron, controller } = props;

  const styles = {
    NeuronListItem: `flex justify-between row items-center pl-4 pr-4 pt-2 pb-2 hover:bg-gray-300 cursor-pointer`,
    neuronName: '',
    neuronChecked: 'cursor-pointer mr-4',
    neuronColor: 'relative cursor-pointer w-6 h-4 shadow-inner rounded',
  };

  return h(
    'div',
    {
      className: styles.NeuronListItem,
      onClick: () => controller.toggleNeuron(neuronName, !selected),
    },
    [
      h(
        'div',
        {
          className: 'w-20 flex items-center',
        },
        [
          h('input', {
            className: styles.neuronChecked,
            type: 'checkbox',
            checked: selected,
            onChange: () => controller.toggleNeuron(neuronName, !selected),
          }),
          h('div', { className: styles.neuronName }, neuronName),
        ]
      ),
      selected
        ? h('div', {
            style: { backgroundColor: color },
            onClick: () => props.controller.handleNeuronColorClick(neuronName),
            className: styles.neuronColor,
          })
        : null,
    ]
  );
};

const neuronsSorted = neurons.sort();

const colorMap = {
  sensory: '#f9cef9',
  interneuron: '#ff887a',
  motor: '#b7daf5',
  modulatory: '#f9d77b',
  muscle: '#a8f5a2',
  unknown: '#d9d9d9',
};

export default class StlViewer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchInput: '',
      selectedNeurons: new Set(),
      showNeuronNameTooltip: false,
      hoveredNeuron: null,
      colorPickerNeuron: '',
      showColorPicker: false,
      animating: false,
      showImageElements: false,
    };

    neuronsSorted.forEach((n) => {
      let t = model.neuronInfo[n];
      let color = colorMap['unknown'];

      if (t != null) {
        color = colorMap[t.canonicalType];
      }
      this.state[n] = {
        selected: false,
        color,
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
    controls.maxDistance = 50000;
    controls.minDistance = 1;

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
    this.controls.addEventListener('change', () => {
      this.composer.render();
    });

    // hover outline
    this.selectedObject = null;
    this.renderer.domElement.addEventListener('pointermove', (e) => {
      if (e.isPrimary === false) return;
      this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mousePosition, this.camera);
      const intersects = this.raycaster.intersectObject(this.scene, true);

      if (intersects.length > 0) {
        this.selectedObject = intersects[0].object;
        // console.log(this.selectedObject);
        // console.log(this.selectedObject.getWorldPosition(new THREE.Vector3()));

        outlinePass.selectedObjects = [this.selectedObject];
        this.setState({
          showNeuronNameTooltip: true,
          selectedObject: this.selectedObject,
        });
      } else {
        this.selectedObject = null;
        outlinePass.selectedObjects = [];
        this.setState({
          showNeuronNameTooltip: false,
          selectedObject: null,
        });
      }

      this.composer.render();
    });
    this.composer.render();
  }

  handleNeuronColorClick(neuronName) {
    let nextShowColorPicker = !this.state.showColorPicker;
    let nextColorPickerNeuron = '';
    if (nextShowColorPicker || neuronName != this.state.colorPickerNeuron) {
      nextColorPickerNeuron = neuronName;
      nextShowColorPicker = true;
    }

    this.setState({
      colorPickerNeuron: nextColorPickerNeuron,
      showColorPicker: nextShowColorPicker,
    });
  }

  updateNeuronMeshColor = (color, neuron) => {
    let neuronObj = this.scene.getObjectByName(this.state.colorPickerNeuron);

    neuronObj.material.color.set(color.hex);
    this.composer.render();
  };

  debouncedUpdateNeuronMeshColor = debounce(this.updateNeuronMeshColor, 200);

  handleColorPickerChange(color) {
    const nextState = {};
    nextState[this.state.colorPickerNeuron] = Object.assign(
      this.state[this.state.colorPickerNeuron],
      {
        color: color.hex,
      }
    );

    this.setState(nextState, () =>
      this.debouncedUpdateNeuronMeshColor(color, this.state.colorPickerNeuron)
    );
  }

  viewNeuron() {
    const selectedNeurons = neuronsSorted.filter((n) => this.state[n].selected);
    const firstNeuron = Array.from(selectedNeurons).shift();
    Promise.all([
      getNeuronModels(Array.from(selectedNeurons)),
      getNeuronSynapses(firstNeuron)
    ]).then(([neuronModelBuffers, synapsePositionInfo]) => {

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
      let orientModel = (mesh) => {
        // mesh.geometry.computeVertexNormals(true);
        // mesh.rotation.z = Math.PI / -2;
        // mesh.rotation.x = Math.PI / -2;
      };

      let loadModel = (buffer, modelName, color) => {
        const geometry = loader.parse(buffer);
        const material = new THREE.MeshMatcapMaterial({
          color: new THREE.Color(color),
          matcap: this.textures[0],
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = modelName;
        return mesh;
      }
      let createSphere = ([x, y, z], name, color, size) => {
        const geometry = new THREE.SphereGeometry( 2 * size, 16, 16 );
        const material = new THREE.MeshBasicMaterial( { color } );
        const sphere = new THREE.Mesh( geometry, material );
        sphere.position.set(x, y, z);
        sphere.name = name;
        orientModel(sphere);
        currentNeurons.add( sphere );

      }

      neuronModelBuffers.forEach((buffer, index) => {
        const { neuronName, color } = this.state[selectedNeurons[index]];
        const mesh = loadModel(buffer, neuronName, color);

        orientModel(mesh);

        currentNeurons.add(mesh);

      });

      synapsePositionInfo.forEach(syn => {
        const { position, pre, post, catmaidId, volumeSize } = syn;
        const [x, y, z] = position;

        createSphere(
          [x, y, z], 
          `pre: ${pre}, post: ${post}, catmaid id: ${catmaidId}`,
           pre === firstNeuron ? '#FAFFAB' : '#800080',
           volumeSize / 10000000
        );
      });



      // center the current neurons group
      const box = new THREE.Box3().setFromObject(currentNeurons);
      const c = box.getCenter(new THREE.Vector3());
      currentNeurons.position.set(-c.x, -c.y, -c.z);

      this.scene.add(currentNeurons);
      // const axesHelper = new THREE.AxesHelper( 5 );
      // this.scene.add( axesHelper );

      this.composer.render();
    });
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
    let recognizedNeurons = new Set(
      value.split(', ').filter((token) => isNeuron(token))
    );

    let nextState = {
      selectedNeurons: recognizedNeurons,
      searchInput: value,
    };

    recognizedNeurons.forEach(
      (n) => (nextState[n] = Object.assign(this.state[n], { selected: true }))
    );

    this.setState(nextState, () => this.viewNeuron());
  }

  toggleNeuron(neuronName, selected) {
    const nextState = {};
    nextState[neuronName] = Object.assign(this.state[neuronName], {
      selected,
    });

    if (selected) {
      const tokens = this.state.searchInput.split(', ');
      const lastToken = tokens.pop();
      nextState['searchInput'] = `${
        tokens.length > 0 ? tokens.join(', ') + ', ' : ''
      }${neuronName},`;
    }

    this.setState(nextState, () => this.viewNeuron());
  }

  exportImage() {
    const { selectedNeurons } = this.getNeuronPartitions();
    this.setState(
      {
        showImageElements: true,
      },
      async () => {
        let mimeType = 'image/png';
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
            x: this.renderer.domElement.clientWidth - 300,
            y: this.renderer.domElement.clientHeight - 60,
          },
        ]);
        saveAs(
          combinedImage,
          `${selectedNeurons.map((n) => n.neuronName).join('_')}.png`
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
      const neuronInfo = Object.assign(this.state[n], { neuronName: n });
      if (this.state[n].selected) {
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

  render() {
    const { selectedNeurons, unselectedNeurons } = this.getNeuronPartitions();
    const { showNeuronNameTooltip, selectedObject, searchInput } = this.state;
    const lastSearchTerm = searchInput.split(', ').pop();
    const searchSuggestions = unselectedNeurons.filter((n) =>
      n.neuronName.startsWith(lastSearchTerm)
    );

    const styles = {
      page: 'w-screen h-screen',
      searchbar:
        'absolute top-2 left-2 w-60 max-h-96 shadow-lg bg-white rounded z-10 overflow-y-scroll',
      stickyTop: 'sticky top-0',
      searchbarInput: 'p-4 w-full h-10 rounded',
      controls:
        'p-2 absolute top-2 shadow-lg flex bg-white  z-10 rounded left-1/2 transform -translate-x-1/2 items-center',
      animateButton:
        'bg-white shadow text-gray-600 rounded m-1 hover:bg-gray-200 pl-2 pr-2 m-4',
      selectedNeuronsContainer:
        'rounded border-2 shadow-lg border-gray-300 bg-gray-100 font-bold text-gray-700',
      unselectedNeuronsContainer: 'w-full h-full text-gray-400',
      neuronNameTooltip:
        'bg-white font-bold text-gray-700 shadow-lg p-4 rounded',
      colorPicker: '',
      colorPickerWidget: 'bg-white absolute top-14 right-64 border-2',
      colorPickerClose:
        'mr-2 bg-white cursor-pointer material-icons text-gray-400 hover:text-gray-600 z-10',
      selectedNeuronLegend:
        'absolute top-2 right-2 w-60 shadow-lg rounded z-10',
      imageLegend: {
        container:
          'absolute -top-40 w-40 z-10 flex flex-col font-bold text-gray-700',
        imageLegendEntry: 'p-2 flex items-center',
        imageLegendEntryColor: 'rounded w-6 h-6 relative top-2',
      },
      imageWatermark: {
        container: 'p-2 absolute w-60 z-10 -top-40 -right-40',
      },
    };

    return h('div', { className: styles.page, ref: (r) => (this.mount = r) }, [
      h('div', { className: styles.searchbar }, [
        h('div', { className: styles.stickyTop }, [
          h('input', {
            type: 'text',
            className: styles.searchbarInput,
            onChange: (e) => this.handleSearchBarChange(e),
            value: this.state.searchInput,
            placeholder: 'Search neurons',
          }),
        ]),
        this.state.searchInput !== ''
          ? h(
              'div',
              { className: styles.unselectedNeuronsContainer },
              searchSuggestions.map((n) =>
                h(NeuronListItem, {
                  ...n,
                  colorPickerNeuron: this.state.colorPickerNeuron,
                  controller: this,
                })
              )
            )
          : null,
      ]),
      h(
        MouseTooltip,
        { visible: this.state.showNeuronNameTooltip, offsetX: 15, offsetY: 10 },
        [
          h(
            'div',
            { className: styles.neuronNameTooltip },
            selectedObject != null ? selectedObject.name : null
          ),
        ]
      ),
      this.state.showColorPicker
        ? h('div', { className: styles.colorPickerWidget }, [
            h('div', { className: 'flex items-center p-2' }, [
              h(
                'i',
                {
                  className: styles.colorPickerClose,
                  onClick: (e) =>
                    this.setState({
                      colorPickerNeuron: '',
                      showColorPicker: false,
                    }),
                },
                'close'
              ),
              h(
                'div',
                { className: 'justify-self-center' },
                `Color Picker - ${this.state.colorPickerNeuron}`
              ),
            ]),
            h(SketchPicker, {
              className: styles.colorPicker,
              color: this.state[this.state.colorPickerNeuron].color,
              onChange: (color, e) => this.handleColorPickerChange(color, e),
              presetColors: Object.values(colorMap),
            }),
          ])
        : null,
      Array.from(selectedNeurons).length > 0
        ? h('div', { className: styles.selectedNeuronLegend }, [
            h(
              'div',
              { className: styles.selectedNeuronsContainer },
              Array.from(selectedNeurons).map((n) =>
                h(NeuronListItem, {
                  ...n,
                  colorPickerNeuron: this.state.colorPickerNeuron,
                  controller: this,
                })
              )
            ),
          ])
        : null,
      this.state.showImageElements
        ? h(
            'div',
            {
              ref: this.imageLegendRef,
              className: styles.imageLegend.container,
            },
            Array.from(selectedNeurons).map((n) =>
              h(
                'div',
                {
                  style: { backgroundColor: '#D9D8D4' },
                  className: styles.imageLegend.imageLegendEntry,
                },
                [
                  h('div', { className: 'mr-2 self-start' }, n.neuronName),
                  h('div', {
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
            'div',
            {
              ref: this.imageWatermarkRef,
              style: { backgroundColor: '#D9D8D4' },
              className: styles.imageWatermark.container,
            },
            '(2021 Witvliet et al.)'
          )
        : null,
      h('div', { className: styles.controls }, [
        h(
          'i',
          {
            className: styles.colorPickerClose,
            onClick: (e) => this.toggleAnimationLoop(),
          },
          'animation'
        ),
        h(
          'i',
          {
            className: styles.colorPickerClose,
            onClick: (e) => this.exportImage(),
          },
          'image'
        ),
        h(
          'i',
          {
            className: styles.colorPickerClose,
            onClick: (e) => {},
          },
          'gif_box'
        ),
      ]),
    ]);
  }
}
