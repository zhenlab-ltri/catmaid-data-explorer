import data from '../../model/mona-catmaid-data.json';
import React from 'react';
import chroma from 'chroma-js';

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
window.data = data;
window.network = network;
window.datasetGroupedByConnection = datasetGroupedByConnection;

let minSynapses = 0;
let maxSynapses = Math.max(
  ...Object.values(datasetGroupedByConnection)
    .map((o) => Object.values(o).map((d) => d.total))
    .reduce((a, b) => a.concat(b), [])
);

let individualScale = chroma.scale(['white', 'red']).domain([minSynapses, 25]);
let heatmapScale = chroma.scale(['white', 'red']).domain([0, 50]);

console.log(minSynapses, maxSynapses);

const COLOR_BY = {
  UNIQUE: 0,
  HEATMAP: 1,
  INDIVIDUAL: 2,
};

export class Heatmap extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hoveredCellData: '',
      color: COLOR_BY.INDIVIDUAL,
      birdsEyeView: false,
    };
  }

  generateCellColor(pre, post) {
    if (this.state.color === COLOR_BY.UNIQUE) {
      return this.getUniqueColor(pre, post);
    }

    if (this.state.color === COLOR_BY.HEATMAP) {
      return this.getHeatmapColor(pre, post);
    }

    return {};
  }

  getHeatmapColor(pre, post) {
    let data = datasetGroupedByConnection[`${pre}|${post}`];
    if (data != null) {
      let daf2Weight = data['daf2'].total;
      let stig2Weight = data['stigloher2'].total;
      let stig3Weight = data['stigloher3'].total;
      return {
        backgroundColor: heatmapScale(daf2Weight + stig3Weight, stig2Weight),
      };
    }
    return {};
  }

  getIndividualColor(val) {
    if (this.state.color === COLOR_BY.INDIVIDUAL) {
      return {
        backgroundColor: individualScale(val),
      };
    }
    return {};
  }

  getUniqueColor(pre, post) {
    let data = datasetGroupedByConnection[`${pre}|${post}`];
    if (data != null) {
      let daf2Weight = data['daf2'].total;
      let stig2Weight = data['stigloher2'].total;
      let stig3Weight = data['stigloher3'].total;
      let isUnique = (a, b, c) => a > 0 && b === 0 && c === 0;
      if (isUnique(daf2Weight, stig2Weight, stig3Weight)) {
        return {
          backgroundColor: '#8bd8dd',
        };
      }
      if (isUnique(stig2Weight, daf2Weight, stig3Weight)) {
        return {
          backgroundColor: '#f4a2a3',
        };
      }

      if (isUnique(stig3Weight, daf2Weight, stig2Weight)) {
        return {
          backgroundColor: '#ffc28b',
        };
      }
    }
    return {};
  }

  changeClickedCellData(pre, post) {
    let data = datasetGroupedByConnection[`${pre}|${post}`];
    if (data == null) {
      return;
    }

    let dataGroupedBySynapseKey = {};
    let synapses = Object.values(data)
      .map((v) => v.data)
      .reduce((a, b) => a.concat(b), [])
      .forEach((synapse) => {
        let key = synapse.partners.join('$');

        if (dataGroupedBySynapseKey[key] == null) {
          dataGroupedBySynapseKey[key] = {
            'daf2-dauer': [],
            stigloher2: [],
            stigloher3: [],
          };
          dataGroupedBySynapseKey[key][synapse.dataset].push(
            synapse.catmaid_link
          );
        } else {
          dataGroupedBySynapseKey[key][synapse.dataset].push(
            synapse.catmaid_link
          );
        }
      });

    this.setState({
      hoveredCellData: dataGroupedBySynapseKey,
      modalOpen: true,
    });
  }

  render() {
    let sortedNodes = network.nodes.map((n) => n.data.id).sort();
    return (
      <div>
        <div className={'connection-info'}>
          <button onClick={() => this.setState({ color: COLOR_BY.UNIQUE })}>
            Unique
          </button>
          <button onClick={() => this.setState({ color: COLOR_BY.INDIVIDUAL })}>
            Heatmap - Individual
          </button>
          <button onClick={() => this.setState({ color: COLOR_BY.HEATMAP })}>
            Heatmap
          </button>
          <button
            onClick={() =>
              this.setState({ birdsEyeView: !this.state.birdsEyeView })
            }
          >
            Bird's eye view
          </button>

          {Object.entries(this.state.hoveredCellData).map(
            ([synapseKey, datasetData]) => {
              return (
                <div className="synapse-entry">
                  <div>{synapseKey.split('$').join(' - ')}</div>
                  {Object.entries(datasetData).map(
                    ([dataset, datasetEntries]) => {
                      return (
                        <div className="dataset-synapses-entry">
                          <div>
                            {dataset}: {datasetEntries.length}
                          </div>
                          {datasetEntries.map((e) => {
                            return (
                              <a
                                className="catmaid-link"
                                href={e}
                                target="_blank"
                              >
                                link
                              </a>
                            );
                          })}
                        </div>
                      );
                    }
                  )}
                </div>
              );
            }
          )}
        </div>
        <table
          className={
            this.state.birdsEyeView ? 'heatmap-birds-eye-view' : 'heatmap'
          }
        >
          <thead>
            <tr>
              <th>.</th>
              {sortedNodes.map((n) => (
                <th className="sticky-x-header-cell">{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedNodes.map((n1) => (
              <tr>
                <th className="sticky-y-header-cell">{n1}</th>
                {sortedNodes.map((n0) => {
                  return (
                    <td
                      style={this.generateCellColor(n1, n0)}
                      className={`cell ${
                        datasetGroupedByConnection[`${n1}|${n0}`] == null
                          ? 'empty-cell'
                          : ''
                      }`}
                    >
                      <div
                        className="cell-data"
                        onClick={() => this.changeClickedCellData(n1, n0)}
                      >
                        {datasetGroupedByConnection[`${n1}|${n0}`] != null
                          ? Object.entries(
                              datasetGroupedByConnection[`${n1}|${n0}`]
                            ).map(([k, v]) => (
                              <div
                                style={this.getIndividualColor(v.total)}
                                className="dataset-cell"
                              >
                                {v.total}
                              </div>
                            ))
                          : '-'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
