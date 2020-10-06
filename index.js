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
              color: '#fff',
              width: 30,
              height: 30,
              'text-halign': 'center',
              'text-valign': 'center',
              'background-color': '#666',
              label: 'data(id)',
              'background-color': '#555',
              'text-outline-color': '#555',
              'text-outline-width': 4,
            },
          },

          {
            selector: 'edge',
            style: {
              'haystack-radius': 0.25,
              opacity: 0.6,
              width: (e) => {
                return Math.max(
                  3,
                  Math.log(
                    Object.values(e.data('weights')).reduce((a, b) => a + b, 0)
                  )
                );
              },
              'line-color': (e) => {
                if (e.data('intersection')) {
                  return '#949494';
                }

                if (e.data('daf2')) {
                  return '#8bd8dd';
                }

                if (e.data('stigloher2')) {
                  return '#f4a2a3';
                }

                if (e.data('stigloher3')) {
                  return '#ffc28b';
                  949494;
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
    this.updateNetwork();
  }

  updateNetwork() {
    let newNetwork = {
      nodes: network.nodes,
      edges: network.edges.filter(
        (e) =>
          (e.data.intersection && this.state.intersection) ||
          (e.data.daf2 && this.state.daf2) ||
          (e.data.stigloher2 && this.state.stigloher2) ||
          (e.data.stigloher3 && this.state.stigloher3)
      ),
    };

    this.state.cy.remove('*');
    this.state.cy.add(newNetwork);
    this.state.cy
      .nodes()
      .filter((n) => n.connectedEdges().size() === 0)
      .remove();
    this.state.cy
      .layout({
        name: 'grid',
        sort: (a, b) => {
          if (a.data('id') > b.data('id')) {
            return 1;
          }

          if (a.data('id') === b.data('id')) {
            return 0;
          }

          if (a.data('id') < b.data('id')) {
            return -1;
          }
        },
        // name: 'cose-bilkent',
        // quality: 'proof',
        // uniformNodeDimensions: true,
        // nodeSeperation: 1000,
        // nodeRepulsion: 7000000,
        // packComponents: false,
        // animate: false,
        // nodeDimensionsIncludeLabels: false,
      })
      .run();
    // this.state.cy.fit();
  }

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
            <label> Daf-2 unique</label>
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
            <label> Stigloher2 unique</label>
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
            <label> Stigloher3 unique</label>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
