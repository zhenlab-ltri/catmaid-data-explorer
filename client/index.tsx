import React from 'react';
import h from 'react-hyperscript';
import { HashRouter as Router, Switch, Route, Link } from 'react-router-dom';
import ReactDOM from 'react-dom';

import MultiMatrix from './components/contact-matrices-heatmap';

class App extends React.Component {
  render() {
    return h(Router, [
      h(Switch, [
        h(Route, {
          exact: true,
          path: '/',
          render: () => {
            return h('div', [h(Link, { to: '/multi-matrix' }, 'Multi Matrix')]);
          },
        }),
        h(Route, {
          exact: true,
          path: '/multi-matrix',
          component: MultiMatrix,
        }),
      ]),
    ]);
  }
}

ReactDOM.render(h(App), document.getElementById('app'));
