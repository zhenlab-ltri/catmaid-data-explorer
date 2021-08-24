import React from 'react';
import h from 'react-hyperscript';
import { HashRouter as Router, Switch, Route, Link } from 'react-router-dom';
import ReactDOM from 'react-dom';

import MultiMatrix from './components/multi-matrix';

class HomePage extends React.Component {
  render() {
    return h('div.home-page', [
      h('div.header', [h('h1', 'Zhen Lab Tools')]),
      h('div.link-list', [
        h('div.card', [h(Link, { to: '/multi-matrix' }, 'Adjacency Matrix')]),
        h('div.card', [h(Link, { to: '/3d-viewer' }, '3D Neuron Viewer')]),
        h('div.card', [
          h('a', { href: 'http://nemanode.zhen-tools.com' }, 'Nemanode'),
        ]),
        h('div.card-disabled', [h('div', 'Dauer')]),
        h('div.card-disabled', [h('div', 'Gap Junctions')]),
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
        ]),
      ]),
    ]);
  }
}

ReactDOM.render(h(App), document.getElementById('app'));
