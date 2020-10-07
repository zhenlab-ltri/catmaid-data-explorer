import data from './data';
import cytoscape from 'cytoscape';
import React from 'react';
import ReactDOM from 'react-dom';
import fcose from 'cytoscape-fcose';
import cose from 'cytoscape-cose-bilkent';
import debounce from 'lodash.debounce';

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
            selector: 'node:selected',
            style: {
              'background-color': '#0169d9',
              'text-outline-color': '#0169d9',
            },
          },
          {
            selector: 'edge',
            style: {
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
              'target-arrow-color': (e) => {
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
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
            },
          },
          {
            selector: '.expressed',
            style: {
              opacity: 1,
              'z-index': 1,
            },
          },
          {
            selector: '.unexpressed',
            style: {
              opacity: 0.05,
              'z-index': 0,
            },
          },
          {
            selector: 'edge.expressed',
            style: {
              opacity: 1,
              width: 5,
            },
          },
          {
            selector: 'edge.unexpressed',
            style: {
              width: 1,
              opacity: 0.05,
              'z-index': 0,
            },
          },
          {
            selector: '.highlighted',
            style: {
              opacity: 1,
              'z-index': 1,
            },
          },
          {
            selector: '.unhighlighted',
            style: {
              opacity: 0.05,
              'z-index': 0,
            },
          },
          {
            selector: 'edge.highlighted',
            style: {
              opacity: 1,
              width: 5,
            },
          },
          {
            selector: 'edge.unhighlighted',
            style: {
              width: 1,
              opacity: 0.05,
              'z-index': 0,
            },
          },
        ],
      }),
    };
  }

  componentDidMount() {
    let cy = this.state.cy;
    cy.mount(document.getElementById('network'));

    let nodeHoverMouseOver = debounce((evt) => {
      let node = evt.target;
      let elesToHighlight = node.closedNeighborhood();

      //Add highlighted class to node & its neighbourhood, unhighlighted to everything else
      cy.elements().addClass('unhighlighted');
      elesToHighlight.forEach((ele) => {
        ele.removeClass('unhighlighted');
        ele.addClass('highlighted');
      });
    }, 200);

    cy.on('tap', 'node', (evt) => {
      const tgt = evt.target;

      cy.elements().removeClass('expressed unexpressed');
      tgt.closedNeighborhood().addClass('expressed');
      cy.elements()
        .difference(tgt.closedNeighborhood())
        .addClass('unexpressed');
      tgt
        .closedNeighborhood()
        .layout({
          animate: true,
          name: 'concentric',
          fit: true,
          minNodeSpacing: 20,
          spacingFactor: 1.5,
          concentric: (ele) => {
            if (ele.same(tgt)) {
              return 2;
            } else {
              return 1;
            }
          },
          levelWidth: () => {
            return 1;
          },
        })
        .run();

      cy.elements()
        .difference(tgt.closedNeighborhood())
        .layout({
          fit: false,
          name: 'concentric',
          concentric: (ele) => 1,
          levelWidth: () => 1,
        })
        .run();
    });

    cy.on('mouseover', 'node', nodeHoverMouseOver);
    cy.on('mouseout', 'node', () => {
      nodeHoverMouseOver.cancel();
      cy.elements().removeClass('highlighted unhighlighted');
    });

    window.cy = cy;
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
            <label> Stigloher2 unique </label>
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
          <button onClick={() => this.updateNetwork()}>Reset</button>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
