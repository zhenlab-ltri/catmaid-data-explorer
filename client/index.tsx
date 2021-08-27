import React from 'react';
import h from 'react-hyperscript';
import { HashRouter as Router, Switch, Route, Link } from 'react-router-dom';
import ReactDOM from 'react-dom';

import MultiMatrix from './components/multi-matrix';
import StlViewer from './components/3d-viewer';
import Sandbox from './components/sandbox';

class HomePage extends React.Component {
  render() {
    return h('div.container.w-screen.m-0', [
      h('h1.text-lg.text-center', 'Zhen Lab Tools'),
      h('div.container.flex', [
        h('div.shadow.p-1', [
          h(Link, { to: '/multi-matrix' }, 'Adjacency Matrix'),
        ]),
        h('div.shadow', [h(Link, { to: '/3d-viewer' }, '3D Neuron Viewer')]),
        h('div.shadow', [
          h('a', { href: 'http://nemanode.zhen-tools.com' }, 'Nemanode'),
        ]),
        h('div.shadow', [h('div', 'Dauer Branch Analysis')]),
        h('div.shadow', [h('div', 'Gap Junctions')]),
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
