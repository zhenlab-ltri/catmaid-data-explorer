import data from './data';
import cytoscape from 'cytoscape';
import React from 'react';
import ReactDOM from 'react-dom';
import fcose from 'cytoscape-fcose';
import cose from 'cytoscape-cose-bilkent';

cytoscape.use(fcose);
cytoscape.use(cose);

window.data = data;

// let createNetwork = () => {
//   let nodeSet = new Set();
//   data['daf2'].forEach((s) => {
//     nodeSet.add(s.classes[0]);
//     nodeSet.add(s.classes[1]);
//   });

//   let edges = [];
//   let synapsesWeightMap = {};

//   data['daf2'].forEach((s) => {
//     let key = `${s.classes[0]}-${s.classes[1]}`;
//     if (synapsesWeightMap[key] == null) {
//       synapsesWeightMap[key] = 1;
//     } else {
//       synapsesWeightMap[key] = synapsesWeightMap[key] + 1;
//     }
//   });

//   Object.entries(synapsesWeightMap).forEach(([pairKey, weight]) => {
//     edges.push({
//       data: {
//         id: pairKey,
//         source: pairKey.split('-')[0],
//         target: pairKey.split('-')[1],
//         dataset: 'daf2',
//         weight,
//       },
//     });
//   });

//   return {
//     nodes: Array.from(nodeSet).map((node) => ({ data: { id: node } })),
//     edges,
//   };
// };
// let createNetwork = () => {
//   let nodeSet = new Set();
//   Object.entries(data).forEach(([dataset, synapses]) => {
//     synapses.forEach((s) => {
//       nodeSet.add(s.classes[0]);
//       nodeSet.add(s.classes[1]);
//     });
//   });

//   let edges = [];
//   Object.entries(data).forEach(([dataset, synapses]) => {
//     let synapsesWeightMap = {};

//     synapses.forEach((s) => {
//       let key = `${s.classes[0]}-${s.classes[1]}`;
//       if (synapsesWeightMap[key] == null) {
//         synapsesWeightMap[key] = 1;
//       } else {
//         synapsesWeightMap[key] = synapsesWeightMap[key] + 1;
//       }
//     });

//     Object.entries(synapsesWeightMap).forEach(([pairKey, weight]) => {
//       edges.push({
//         data: {
//           id: pairKey,
//           source: pairKey.split('-')[0],
//           target: pairKey.split('-')[1],
//           dataset,
//           weight,
//         },
//       });
//     });
//   });

//   return {
//     nodes: Array.from(nodeSet).map((node) => ({ data: { id: node } })),
//     edges,
//   };
// };

let createNetwork = () => {
  let nodeSet = new Set();
  Object.entries(data).forEach(([dataset, synapses]) => {
    synapses.forEach((s) => {
      nodeSet.add(s.classes[0]);
      nodeSet.add(s.classes[1]);
    });
  });

  let edges = [];
  let synapsesWeightMap = {};

  Object.entries(data).forEach(([dataset, synapses]) => {
    synapses.forEach((s) => {
      let key = `${s.classes[0]}-${s.classes[1]}`;
      if (synapsesWeightMap[key] == null) {
        synapsesWeightMap[key] = {
          daf2: 0,
          stigloher2: 0,
          stigloher3: 0,
        };
        synapsesWeightMap[key][dataset] = 1;
      } else {
        synapsesWeightMap[key][dataset] = synapsesWeightMap[key][dataset] + 1;
      }
    });
  });

  Object.entries(synapsesWeightMap).forEach(([pairKey, weights]) => {
    edges.push({
      data: {
        id: pairKey,
        source: pairKey.split('-')[0],
        target: pairKey.split('-')[1],
        intersection: Object.values(weights)
          .map((w) => w > 0)
          .reduce((a, b) => a && b, true),
        daf2:
          weights['daf2'] > 0 &&
          weights['stigloher2'] == 0 &&
          weights['stigloher3'] == 0,
        stigloher2:
          weights['daf2'] == 0 &&
          weights['stigloher2'] > 0 &&
          weights['stigloher3'] == 0,
        stigloher3:
          weights['daf2'] == 0 &&
          weights['stigloher2'] == 0 &&
          weights['stigloher3'] > 0,
        weights,
      },
    });
  });

  let network = {
    nodes: Array.from(nodeSet).map((node) => ({ data: { id: node } })),
    edges,
  };
  window.network = network;
  return network;
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      intersection: true,
      daf2: false,
      stigloher2: false,
      stigloher3: false,
      cy: cytoscape({
        headless: true,
        style: [
          // the stylesheet for the graph
          {
            selector: 'node',
            style: {
              width: 30,
              height: 30,
              'text-halign': 'center',
              'text-valign': 'center',
              'background-color': '#666',
              label: 'data(id)',
            },
          },

          {
            selector: 'edge',
            style: {
              width: 1,
              'line-color': (e) => {
                if (e.data('intersection')) {
                  return '#ff0000';
                }

                if (e.data('daf2')) {
                  return '#000cff';
                }

                if (e.data('stigloher2')) {
                  return '#0cff00';
                }

                if (e.data('stigloher3')) {
                  return '#ffe500';
                }

                return '#ccc';
              },
              'target-arrow-color': '#ccc',
              'target-arrow-shape': 'triangle',
              'curve-style': 'haystack',
            },
          },
        ],
      }),
    };
  }

  componentDidMount() {
    this.state.cy.mount(document.getElementById('network'));

    window.cy = this.state.cy;
    this.state.cy.add(createNetwork());
    this.state.cy
      .layout({
        name: 'cose-bilkent',
        quality: 'proof',
        uniformNodeDimensions: true,
        nodeSeperation: 1000,
        nodeRepulsion: 7000000,
        packComponents: false,
        animate: false,
        nodeDimensionsIncludeLabels: false,
      })
      .run();
    this.state.cy.fit();
  }

  updateNetwork() {}

  render() {
    return (
      <div>
        <div id="network"></div>
        <div id="dataset-toggle">
          <div className="row">
            <input
              type="checkbox"
              id="intersection"
              value="intersection"
              checked={this.state.intersection}
              onChange={(e) => {
                this.setState({ intersection: !this.state.intersection }, () =>
                  this.updateNetwork()
                );
              }}
            />
            <label> Intersection</label>
          </div>
          <div className="row">
            <input
              type="checkbox"
              id="daf2"
              checked={this.state.daf2}
              onChange={() =>
                this.setState({ daf2: !this.state.daf2 }, () =>
                  this.updateNetwork()
                )
              }
            />
            <label> Daf-2</label>
          </div>
          <div className="row">
            <input
              type="checkbox"
              id="stigloher2"
              checked={this.state.stigloher2}
              onChange={() =>
                this.setState({ stigloher2: !this.state.stigloher2 }, () =>
                  this.updateNetwork()
                )
              }
            />
            <label> Stigloher2</label>
          </div>
          <div className="row">
            <input
              type="checkbox"
              id="stigloher3"
              checked={this.state.stigloher3}
              onChange={() =>
                this.setState({ stigloher3: !this.state.stigloher3 }, () =>
                  this.updateNetwork()
                )
              }
            />
            <label> Stigloher3</label>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
