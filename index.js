import data from './data';
import React from 'react';
import ReactDOM from 'react-dom';

window.data = data;

let nodeSet = new Set();
Object.entries(data).forEach(([dataset, synapses]) => {
  synapses.forEach((s) => {
    nodeSet.add(s.classes[0]);
    nodeSet.add(s.classes[1]);
  });
});

let edges = [];
let datasetGroupedByConnection = {};

Object.entries(data).forEach(([dataset, synapses]) => {
  synapses.forEach((s) => {
    let key = `${s.classes[0]}|${s.classes[1]}`;
    if (datasetGroupedByConnection[key] == null) {
      datasetGroupedByConnection[key] = {
        daf2: {
          total: 0,
          data: [],
        },
        stigloher2: {
          total: 0,
          data: [],
        },
        stigloher3: {
          total: 0,
          data: [],
        },
      };
      datasetGroupedByConnection[key][dataset]['total'] = 1;
      datasetGroupedByConnection[key][dataset]['data'].push(s);
    } else {
      datasetGroupedByConnection[key][dataset]['total'] =
        datasetGroupedByConnection[key][dataset]['total'] + 1;
      datasetGroupedByConnection[key][dataset]['data'].push(s);
    }
  });
});

Object.entries(datasetGroupedByConnection).forEach(([pairKey, datasetData]) => {
  edges.push({
    data: {
      id: pairKey,
      source: pairKey.split('|')[0],
      target: pairKey.split('|')[1],
      intersection: Object.values(datasetData)
        .map((dataset) => dataset.total)
        .map((weight) => weight > 0)
        .reduce((a, b) => a && b, true),
      daf2:
        datasetData['daf2'].total > 0 &&
        datasetData['stigloher2'].total == 0 &&
        datasetData['stigloher3'].total == 0,
      stigloher2:
        datasetData['daf2'].total == 0 &&
        datasetData['stigloher2'].total > 0 &&
        datasetData['stigloher3'].total == 0,
      stigloher3:
        datasetData['daf2'].total == 0 &&
        datasetData['stigloher2'].total == 0 &&
        datasetData['stigloher3'].total > 0,
      datasetData,
    },
  });
});

let network = {
  nodes: Array.from(nodeSet).map((node) => ({ data: { id: node } })),
  edges,
};
window.network = network;
window.datasetGroupedByConnection = datasetGroupedByConnection;

class HeatmapCell extends React.Component {
  render() {
    return <div>cell</div>;
  }
}

class Heatmap extends React.Component {
  render() {
    let sortedNodes = network.nodes.map((n) => n.data.id).sort();
    return (
      <table className="heatmap">
        <thead>
          <tr>
            <th>.</th>
            {sortedNodes.map((n) => (
              <th className="sticky-x-header-cell">{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedNodes.map((n0) => (
            <tr>
              <th className="sticky-y-header-cell">{n0}</th>
              {sortedNodes.map((n1) => {
                return (
                  <td
                    className={`cell ${
                      datasetGroupedByConnection[`${n1}|${n0}`] == null
                        ? 'empty-cell'
                        : ''
                    }`}
                  >
                    <div onClick={(e) => console.log(e.target)}>
                      {datasetGroupedByConnection[`${n1}|${n0}`] != null
                        ? Object.entries(
                            datasetGroupedByConnection[`${n1}|${n0}`]
                          )
                            .map(([k, v]) => v.total)
                            .join(', ')
                        : 0}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      connectionData: null,
    };
  }

  render() {
    let synapsesList = [];

    // if (this.state.connectionData != null) {
    //   synapsesList = Object.values(this.state.connectionData.datasetData)
    //     .map((d) => d.data)
    //     .reduce((a, b) => a.concat(b), []);
    // }

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
