import React from 'react';
import ReactDOM from 'react-dom';

// import {Heatmap} from './components/mona-catmaid-heatmap';
import { Heatmap } from './components/contact-matrices-heatmap';

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
        <Heatmap></Heatmap>
      </div>
    );
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
