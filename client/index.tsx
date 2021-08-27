import React from 'react';
import h from 'react-hyperscript';
import { HashRouter as Router, Switch, Route, Link } from 'react-router-dom';
import ReactDOM from 'react-dom';

import MultiMatrix from './components/multi-matrix';
import StlViewer from './components/3d-viewer';
import Sandbox from './components/sandbox';

class HomePage extends React.Component {
  render() {
    const styles = {
      container: 'w-screen h-screen bg-gray-50',
      header: 'h-96 bg-gray-600 text-white flex items-center justify-center ',
      contentLinks: 'flex items-stretch',
      cardContainer: 'container mx-auto flex items-stretch justify-center',
      card: 'w-60 h-80 shadow-lg hover:shadow-xl ml-10 mr-10',
      cardContent:
        'w-60 h-80 relative bottom-20 shadow-lg z-10 bg-gray-50 rounded-md',
    };

    return h('div', { className: styles.container }, [
      h('div', { className: styles.header }, [
        h('div', [
          h('h1', { className: 'mt-30 text-5xl logo' }, 'Zhen Lab Tools'),
          h('span', { className: '' }, 'Explore the '),
          h('span', { className: ' italic' }, 'C. Elegans '),
          h('span', { className: '' }, 'Connectome'),
        ]),
      ]),
      h('div', { className: styles.cardContainer }, [
        h('div', { className: styles.card }, [
          h('div', { className: styles.cardContent }, 'NemaNode'),
        ]),
        h('div', { className: styles.card }, [
          h('div', { className: styles.cardContent }, '3D Neuron Viewer'),
        ]),
        h('div', { className: styles.card }, [
          h('div', { className: styles.cardContent }, 'Dauer Branch Analysis'),
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
            path: '/multi-matrix',
            component: MultiMatrix,
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
