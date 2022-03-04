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
import debounce from 'lodash.debounce';

import { getNeuronModels, getNeuronSynapses, getSynapsesBetween, getNerveRingModel } from 'services';
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

const neuronColorMap = {
  sensory: '#f9cef9',
  interneuron: '#ff887a',
  motor: '#b7daf5',
  modulatory: '#f9d77b',
  muscle: '#a8f5a2',
  unknown: '#d9d9d9',
};

const synapseColorMap = {
  pre: '#FAFFAB',
  post: '#800080',
  synapse: '#000000'
}

const synapseInfoKey = (info) => info.catmaidId;

export default class StlViewer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchInput: '',
      selectedNeurons: new Set(),
      showTooltip: false,
      selectedSynapse: null,
      selectedObject: null,
      colorPickerNeuron: '',
      showColorPicker: false,
      animating: false,
      showImageElements: false,
      synapsePositionInfo: [],
      synapseDetail: null,
      showSynapseDetail: false,
      synapseDetailPosition: {
        x: 0,
        y: 0
      },
    };

    neuronsSorted.forEach((n) => {
      let t = model.neuronInfo[n];
      let color = neuronColorMap['unknown'];

      if (t != null) {
        color = neuronColorMap[t.canonicalType];
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
        if(intersects.length > 1){
          const firstIntersect = intersects.filter(i => i.object.name !== 'Nerve ring')[0];

          firstIntersect != null ? this.selectedObject = firstIntersect.object : null;
        } else {
          this.selectedObject = intersects[0].object;

        }

        outlinePass.selectedObjects = [this.selectedObject];
        this.setState({
          showTooltip: true,
          selectedObject: this.selectedObject,
        });
      } else {
        this.selectedObject = null;
        outlinePass.selectedObjects = [];
        this.setState({
          showTooltip: false,
          selectedObject: null,
        });
      }

      this.composer.render();
    });

    this.renderer.domElement.addEventListener('click', (e) => {
      this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mousePosition, this.camera);
      const intersects = this.raycaster.intersectObject(this.scene, true);
      const firstSynapseIntersect = intersects.filter(i => i.object.name.includes('➝'))[0]; 
      if(firstSynapseIntersect) {
        const synapseData = firstSynapseIntersect.object.userData;
        this.setState({
          synapseDetail: synapseData,
          showSynapseDetail: true,
          synapseDetailPosition: {
            x: e.clientX,
            y: e.clientY
          }
        })
      } else {
        this.setState({
          showSynapseDetail: false
        });
      }
    })

    this.controls.addEventListener('change', debounce(e => {
      this.setState({
        synapseDetail: null,
        showSynapseDetail: false
      })
    }), 250);
    this.composer.render();

    const searchParams = new URLSearchParams(this.props.location.search);
    let searchInput = '';
    if(searchParams.has('neurons')){
      searchInput = searchParams.get('neurons')?.split(',').join(', ');
    }

    this.handleSearchBarChange({
      target:{
        value: searchInput
      }
    });
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
    const onlyOneNeuron = selectedNeurons.length === 1;

    Promise.all([
      getNeuronModels(Array.from(selectedNeurons)),
      onlyOneNeuron ? getNeuronSynapses(firstNeuron) : getSynapsesBetween(Array.from(selectedNeurons)),
      getNerveRingModel()
    ]).then(([neuronModelBuffers, synapsePositionInfo, nerveRingModelBuffer]) => {

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

      let loadModel = (buffer, modelName, color, opacity = 1.0, renderOrder = 0) => {
        const geometry = loader.parse(buffer);
        const material = new THREE.MeshMatcapMaterial({
          color: new THREE.Color(color),
          matcap: this.textures[0]
        });
        opacity != 1.0 ? material.transparent = true : null;
        opacity != 1.0 ? material.opacity = opacity : null;

        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = modelName;

        mesh.renderOrder = renderOrder;
        return mesh;
      }
      let createSphere = ([x, y, z], name, color, size, data) => {
        const geometry = new THREE.SphereGeometry( 2 * size, 16, 16 );
        const material = new THREE.MeshBasicMaterial( { color } );
        const sphere = new THREE.Mesh( geometry, material );
        sphere.position.set(x, y, z);
        sphere.name = name;
        sphere.userData = data;
        currentNeurons.add( sphere );
      }

      const nerveRing = loadModel(nerveRingModelBuffer, 'Nerve ring', '#d9d9d9', 0.3, 10);
      currentNeurons.add(nerveRing);


      neuronModelBuffers.forEach((buffer, index) => {
        const { neuronName, color } = this.state[selectedNeurons[index]];
        const mesh = loadModel(buffer, neuronName, color, !onlyOneNeuron ? 0.7 : 1);

        currentNeurons.add(mesh);

      });

      synapsePositionInfo.forEach(syn => {
        const { position, pre, post, catmaidId, volumeSize } = syn;
        const [x, y, z] = position;
        const translatedVolume = volumeSize / 10000000;
        let color = synapseColorMap['synapse'];

        if(onlyOneNeuron){
          if(pre === firstNeuron) {
            color = synapseColorMap['pre'];
          } else {
            color = synapseColorMap['post'];
          }
        }

        createSphere(
          [x, y, z], 
          `${pre} ➝ ${post.split(',').join(', ')}`,
          color,
          Math.min(Math.max(0.05, translatedVolume), 0.5),
          syn
        );
      });


      currentNeurons.rotation.y = Math.PI;


      // center the current neurons group
      const box = new THREE.Box3().setFromObject(currentNeurons);
      const c = box.getCenter(new THREE.Vector3());
      currentNeurons.position.set(-c.x, -c.y, -c.z);


      this.scene.add(currentNeurons);
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
    const { 
      showTooltip, 
      selectedObject, 
      searchInput, 
      synapseDetail,
      showSynapseDetail,
      synapseDetailPosition
    } = this.state;
    const onlyOneNeuron = Array.from(selectedNeurons).length === 1;
    const lastSearchTerm = searchInput.split(', ').pop();
    const searchSuggestions = unselectedNeurons.filter((n) =>
      n.neuronName.startsWith(lastSearchTerm)
    );

    const styles = {
      page: `w-screen h-screen ${showTooltip ? 'cursor-pointer' : ''}`,
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
      legendContainer: 'absolute top-2 right-2 w-60 shadow-lg rounded z-10',
      selectedNeuronLegend: '',
        // 'absolute top-2 right-2 w-60 shadow-lg rounded z-10',
      synapseLegend: '',
      // 'absolute top-10 right-2 w-60 shadow-lg rounded z-10',
      imageLegend: {
        container:
          'absolute -top-40 w-40 z-10 flex flex-col font-bold text-gray-700',
        imageLegendEntry: 'p-2 flex items-center',
        imageLegendEntryColor: 'rounded w-6 h-6 relative top-2',
      },
      imageWatermark: {
        container: 'p-2 absolute w-60 z-10 -top-40 -right-40',
      },
      watermark: {
        container: 'p-2 absolute h-10 w-10 bottom-2'
      },
      synapseInfo: 'absolute w-60 h-80 bottom-20 left-2 overflow-y-scroll bg-white shadow-lg rounded z-10',
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
        { visible: this.state.showTooltip, offsetX: 15, offsetY: 10 },
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
              presetColors: Object.values(neuronColorMap),
            }),
          ])
        : null,
      h('div', { className: styles.legendContainer }, [
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
      Array.from(selectedNeurons).length > 0
      ? h('div', { className: styles.synapseLegend }, [
          h(
            'div',
            { className: styles.selectedNeuronsContainer },
            (onlyOneNeuron ?  ['pre', 'post'] : ['synapse']).map(n => 
              h(NeuronListItem, {
                neuronName: n,
                color: synapseColorMap[n],
                selected: true,
                controller: this,
              }))
          ),
        ])
      : null,
      ]),
      this.state.synapsePositionInfo.length > 0 ? h('div', { className: styles.synapseInfo }, this.state.synapsePositionInfo.map(syn => {
        const { pre, post, catmaidLink, volumeSize } = syn;
        const neurons = [pre, ...post.split(',')].join('__');
        const nemanodeLink = `http://nemanode.zhen-tools.com?db=head&ds=witvliet_2020_8&in=${neurons}`
        return h('div', { 
          className: styles.synapseInfoEntry, 
        }, [
          h('div', `${pre} ➝ ${post.split(',').join(', ')}`),
          h('div', [
            `Volume: ${volumeSize} nm`,
            h('sup', '3')
          ]),
          h('div', [h('a', {target: '_blank', href: catmaidLink }, 'Open in CATMAID')]),
          h('div', [h('a', {target: '_blank', href: nemanodeLink }, 'Open in NemaNode')]),
        ])
      })) : null,
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
        // h(
        //   'i',
        //   {
        //     className: styles.colorPickerClose,
        //     onClick: (e) => {},
        //   },
        //   'gif_box'
        // ),
      ]),
      this.state.showSynapseDetail ? h('div', {
        className: 'bg-white p-4 rounded shadow-lg w-80',
        style: {
          position: 'absolute', 
          top: `${synapseDetailPosition.y}px`,
          left: `${synapseDetailPosition.x}px`,
          zIndex: 10
        }
      }, [
        h('div', {className: 'flex justify-between p-2'}, [
          h('div', {className: 'font-bold text-gray-700'}, `${synapseDetail.pre} ➝ ${synapseDetail.post.split(',').join(', ')}`),
          h('div', {className: 'text-gray-400 hover:text-gray-700 cursor-pointer', onClick: e => this.setState({showSynapseDetail: false})}, 'X'),
        ]),
        h('div', {className: 'flex pl-4 pr-4 pt-2 pb-2'}, [
          h('div', {className: 'text-gray-500 font-light mr-2'},'Volume:'),
          h('div', {className: 'text-gray-500 font-bold'}, [
            `${synapseDetail.volumeSize} nm`,
            h('sup', '3')  
          ])
        ]),
        h('div', {className: 'pl-4 pr-4 pt-2 pb-2 flex'}, [
          h('div', {className: 'text-gray-500 font-light mr-2' }, 'View in:'),
          h('div', [h('a', {className: 'mr-2 underline text-gray-500', target: '_blank', href: synapseDetail.catmaidLink }, 'CATMAID')]),
          h('div', [h('a', {className: 'underline text-gray-500', target: '_blank', href: `http://nemanode.zhen-tools.com?db=head&ds=witvliet_2020_8&in=${[synapseDetail.pre, ...synapseDetail.post.split(',')].join('__')}`}, 'NemaNode')
        ])
      ])
    ]) : null,
    h('div', { className: 'absolute bottom-10 right-10'}, '(2021 Witvliet et. al)')
    ]);
  }
}
