import React from 'react';
import h from 'react-hyperscript';
import { HashRouter as Router, Switch, Route, Link } from 'react-router-dom';
import ReactDOM from 'react-dom';

import Heatmap from './components/contact-matrices-heatmap';
class App extends React.Component {
  render() {
    return h(Router, [
      h(Switch, [
        h(Route, {
          exact: true,
          path: '/',
          render: () => {
            return h('div', [
              h(Link, { to: '/contact-matrix' }, 'Contact Matrix'),
            ]);
          },
        }),
        h(Route, {
          exact: true,
          path: '/contact-matrix',
          component: Heatmap,
        }),
      ]),
    ]);
  }
}

ReactDOM.render(h(App), document.getElementById('app'));
