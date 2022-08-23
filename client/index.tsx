import React from 'react';
import h from 'react-hyperscript';
import { HashRouter as Router, Switch, Route, Link } from 'react-router-dom';
import ReactDOM from 'react-dom';

import StlViewer from './components/3d-viewer/index';
import Sandbox from './components/sandbox';

import neuronViewerImg from './images/3d_neuron_viewer.png';
import nemanodeImage from './images/nemanode.png';
class HomePage extends React.Component {
  render() {
    const styles = {
      container: 'w-screen h-screen bg-gray-50',
      header:
        'h-1/2 bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-600 text-white flex justify-center ',
      cardPositioner: 'container mx-auto flex items-stretch justify-center',
      cardContainer:
        'container mx-auto flex items-center justify-center relative w-4/5 h-96 bottom-40 border-gray border-2 rounded-lg shadow-xl bg-gray-200',
      cardContent:
        'ml-10 mr-10 flex flex-col w-60 h-80 shadow-lg z-10 bg-gray-100 hover:shadow-xl',
      cardContentDisabled:
        'ml-10 mr-10 flex flex-col w-60 h-80 shadow-lg z-10 bg-gray-100 hover:shadow-xl opacity-40',
      cardImage:
        'w-80 h-50 justify-center transform scale-90 border-2 border-gray',
    };

    return h('div', { className: styles.container }, [
      h('div', { className: styles.header }, [
        h('div', [
          h(
            'h1',
            { className: 'mt-20 text-5xl logo tracking-wide' },
            'Zhen Lab Tools'
          ),
          h('span', { className: 'text-gray-200' }, 'Explore the '),
          h('span', { className: 'text-gray-200 italic' }, 'C. elegans '),
          h('span', { className: 'text-gray-200' }, 'Connectome'),
        ]),
      ]),
      h('div', { className: styles.cardPositioner }, [
        h('div', { className: styles.cardContainer }, [
          h(Link, { to: '/3d-viewer' }, [
            h('div', { className: styles.cardContent }, [
              h('img', { className: styles.cardImage, src: neuronViewerImg }),
              h('div', { className: 'text-center text-gray-700 font-bold' }, [
                '3D Neuron Viewer',
              ]),
            ]),
          ]),
          h('a', { href: 'http://nemanode.com' }, [
            h('div', { className: styles.cardContent }, [
              h('img', { className: styles.cardImage, src: nemanodeImage }),
              h('div', { className: 'text-center text-gray-700 font-bold' }, [
                'NemaNode',
              ]),
            ]),
          ]),
          h('a', { href: 'https://mohaddadnia.github.io/CaImg-Web/' }, [
            h('div', { className: styles.cardContent }, [
              h('img', { className: styles.cardImage, src: 'https://mohaddadnia.github.io/CaImg-Web/icon.png' }),
              h('div', { className: 'text-center text-gray-700 font-bold' }, [
                'CaImg - Calcium imaging pipeline',
              ]),
            ]),
          ]),
        ]),
      ]),
    ]);
  }
}

class App extends React.Component {
  render() {
    return h('div', [
      h(Router, [
        h(Switch, [
          h(Route, {
            exact: true,
            path: '/',
            component: HomePage,
          }),
          h(Route, {
            exact: true,
            path: '/3d-viewer',
            component: StlViewer,
          }),
          h(Route, {
            exact: true,
            path: '/sandbox',
            component: Sandbox,
          }),
        ]),
      ]),
    ]);
  }
}

ReactDOM.render(h(App), document.getElementById('app'));
