import React from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import TreeSTLLoader from 'three-stl-loader';

const STLLoader = TreeSTLLoader(THREE);
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
  componentDidMount() {
    const neurons = ['ALA', 'SIAVL', 'RMEV'];

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

    const loadStlPath = (pathToStl) => {
      loader.load(pathToStl, (geometry) => {
        const material = new THREE.MeshDepthMaterial();
        const mesh = new THREE.Mesh(geometry, material);

        mesh.geometry.computeVertexNormals(true);
        scene.add(mesh);

        mesh.rotation.x = Math.PI / -2;

        animate.addTrigger(() => {});
      });
    };

    animate.animate();
  }
  render() {
    return <div ref={(ref) => (this.mount = ref)} />;
  }
}
