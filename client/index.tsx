import React from 'react';
import ReactDOM from 'react-dom';

import {Heatmap} from './components/mona-catmaid-heatmap';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connectionData: null,
    };
  }

  render() {
    return (
      <div>
        <div className="pre-label">Presynaptic Neuron</div>
        <div className="post-label">Postsynaptic Neuron</div>
        <Heatmap></Heatmap>
      </div>
    );
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
