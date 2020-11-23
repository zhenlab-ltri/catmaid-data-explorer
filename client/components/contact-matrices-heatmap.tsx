import React from 'react';
import h from 'react-hyperscript';
import chroma from 'chroma-js';
import MultiGrid from 'react-virtualized/dist/es/MultiGrid';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import debounce from 'lodash.debounce';
import Modal from 'react-modal';
import { Line } from 'react-chartjs-2';
import Select from 'react-select';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import model from '../model';
import { monotonicIncreasing, monotonicDecreasing } from '../util';

class MultiTabModal extends React.Component {
  render() {
    const { isOpen, className, onClick, neuronPairKey } = this.props;
    const { gapJunctions, gapJunctionsDatasets } = model.getGapJunctions(
      neuronPairKey
    );
    const {
      chemicalSynapses,
      chemicalSynapsesDatasets,
    } = model.getChemicalSynapses(neuronPairKey);
    const { contactAreas, contactAreaDatasets } = model.getContactArea(
      neuronPairKey
    );

    return h(
      Modal,
      {
        style: {
          overlay: {
            zIndex: 1,
          },
        },
        isOpen,
        className,
      },
      [
        h('button', { onClick: (e) => this.props.onClick(e) }, 'close'),
        h(Tabs, [
          h(TabList, [
            h(Tab, 'Chemical Synapses'),
            h(Tab, 'Gap Junctions'),
            h(Tab, 'Contact Area'),
          ]),
          h(
            TabPanel,
            { key: '0' },
            chemicalSynapses != null
              ? h(NeuronPairLineChart, {
                  id: 'cs',
                  values: chemicalSynapses,
                  datasets: chemicalSynapsesDatasets,
                  label: `Chemical Synapses between ${neuronPairKey.replace(
                    '$',
                    ' and '
                  )}`,
                })
              : h(
                  'div',
                  `No chemical synapses found between ${neuronPairKey.replace(
                    '$',
                    ' and '
                  )}`
                )
          ),
          h(
            TabPanel,
            { key: '1' },
            gapJunctions != null
              ? h(NeuronPairLineChart, {
                  id: 'gj',
                  values: gapJunctions,
                  datasets: gapJunctionsDatasets,
                  label: `Gap junctions between ${neuronPairKey.replace(
                    '$',
                    ' and '
                  )}`,
                })
              : h(
                  'div',
                  `No gap junctions found between ${neuronPairKey.replace(
                    '$',
                    ' and '
                  )}`
                )
          ),
          h(TabPanel, { key: '2' }, [
            h(NeuronPairLineChart, {
              id: 'ca',
              values: contactAreas,
              datasets: contactAreaDatasets,
              label: `Contact area between ${neuronPairKey.replace(
                '$',
                ' and '
              )} (${String.fromCharCode(181)}m^2)`,
            }),
          ]),
        ]),
      ]
    );
  }
}

// component that renders color scale bars using a sequence of divs
// dependent on a chroma-js scale object that maps values to colors
class ColorScale extends React.Component {
  render() {
    const {
      numSteps,
      minVal,
      maxVal,
      minValLabel,
      maxValLabel,
      units,
      colorScaleFn,
    } = this.props;
    const stepSize = maxVal / numSteps;
    const colorScaleDivs = [...Array(numSteps).keys()].map((el, index) => {
      return h('div.color-scalebar-item', {
        style: { backgroundColor: colorScaleFn(index * stepSize) },
      });
    });

    return h('div.color-scale', [
      h('div.color-scalebar', colorScaleDivs),
      h('div', `[${minValLabel}, ${maxValLabel}] ${units}`),
    ]);
  }
}

class CellLegend extends React.Component {
  render() {
    const { legendEntries } = this.props;

    const legendEntryDivs = legendEntries.map((entry) => {
      return h('div.cell-legend-entry', [
        h('div', { className: entry.className }),
        h('div', entry.label),
      ]);
    });

    return h('div.cell-legend', [...legendEntryDivs, this.props.children]);
  }
}

class ContactMatrixCell extends React.Component {
  render() {
    const {
      highlighted,
      columnIndex,
      rowIndex,
      style,
      onHover,
      onClick,
      colorScaleFn,
    } = this.props;
    const rowNeuron = model.neurons[rowIndex].id;
    const colNeuron = model.neurons[columnIndex].id;
    const rowNeuronCanonicalType = model.neurons[rowIndex].canonicalType;
    const colNeuronCanonicalType = model.neurons[columnIndex].canonicalType;
    const neuronKey = model.neuronPairKey(rowNeuron, colNeuron);
    const { contactAreas } = model.getContactArea(neuronKey);

    let backgroundColor = 'white';

    if (contactAreas == null) {
      backgroundColor = 'gray';
    } else {
      if (monotonicIncreasing(contactAreas)) {
        backgroundColor = 'black';
      }

      if (monotonicDecreasing(contactAreas)) {
        backgroundColor = 'blue';
      }
    }

    if (columnIndex === 0 && rowIndex === 0) {
      return h('div.contact-matrix-cell', { key: '0-0', style });
    }

    // cell is in the row header
    if (columnIndex === 0 && rowIndex > 0) {
      const content = [
        h(
          'div',
          { style: { fontSize: highlighted ? '1.25em' : '0.7em' } },
          rowNeuron
        ),
      ];

      return h(
        'div.contact-matrix-cell',
        {
          key: `${rowNeuron}$0`,
          className: `contact-matrix-cell ${rowNeuronCanonicalType}`,
          style,
        },
        content
      );
    }

    // cell is in the column header
    if (rowIndex === 0 && columnIndex > 0) {
      const content = [
        h(
          'div',
          { style: { fontSize: highlighted ? '1.25em' : '0.7em' } },
          colNeuron
        ),
      ];

      return h(
        'div.contact-matrix-cell',
        {
          key: `0$${colNeuron}`,
          className: `contact-matrix-cell ${colNeuronCanonicalType}`,
          style,
        },
        content
      );
    }

    // contact matrix data is symmetric
    // only render half the matrix
    if (rowIndex <= columnIndex) {
      return h('div.contact-matrix-cell', {
        key: model.neuronPairKey(rowNeuron, colNeuron),
        style: {
          ...style,
          border: '1px solid black',
          backgroundColor: '#514d4d',
        },
      });
    }

    return h(
      'div.contact-matrix-cell',
      {
        key: model.neuronPairKey(rowNeuron, colNeuron),
        onMouseOver: (e) => onHover(rowIndex, columnIndex),
        onClick: (e) =>
          this.props.onClick(
            e,
            model.neuronPairKey(rowNeuron, colNeuron),
            rowIndex,
            columnIndex
          ),
        style: {
          ...style,
          border: '1px solid black',
          opacity: contactAreas == null ? 0.2 : 1,
          backgroundColor,
          cursor: contactAreas == null ? 'default' : 'pointer',
        },
      },
      contactAreas == null
        ? []
        : contactAreas.map((areaValue) =>
            h('div', {
              style: {
                height: monotonicIncreasing(contactAreas)
                  ? style.height - 8
                  : style.height,
                width:
                  (monotonicIncreasing(contactAreas)
                    ? style.width - 8
                    : style.width) / contactAreas.length,
                backgroundColor: colorScaleFn(areaValue),
              },
            })
          )
    );
  }
}

class NeuronPairLineChart extends React.Component {
  render() {
    const { id, label, datasets, values } = this.props;

    return h(Line, {
      id,
      data: {
        labels: datasets,
        datasets: [
          {
            label,
            data: values || [],
            fill: false,
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgba(255, 99, 132, 0.2)',
          },
        ],
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    });
  }
}

export default class ContactMatrix extends React.Component {
  constructor(props) {
    super(props);

    const colorScaleFn = chroma
      .scale(['white', 'red'])
      .domain([0.0, model.stats.maxContactArea])
      .gamma(0.6);

    this.state = {
      hoveredRowIndex: -1,
      hoveredColumnIndex: -1,
      scrollToColumn: 0,
      scrollToRow: 0,
      numVisibleRows: 0,
      numVisibleColumns: 0,
      rowInput: '',
      columnInput: '',
      showCellDetail: false,
      cellDetailKey: '',
      colorScaleFn,
    };
  }

  handleSectionRendered(opts) {
    const {
      rowStartIndex,
      rowStopIndex,
      columnStartIndex,
      columnStopIndex,
    } = opts;

    const numVisibleRows = rowStopIndex - rowStartIndex;
    const numVisibleColumns = columnStopIndex - columnStartIndex;

    this.setState({
      numVisibleRows,
      numVisibleColumns,
    });
  }

  handleCellClick(e, neuronKey, rowIndex, columnIndex) {
    this.setState(
      {
        cellDetailKey: neuronKey,
      },
      () =>
        this.setState({
          showCellDetail: true,
        })
    );
    // this.setState({
    //   showCellDetail: true,
    //   cellDetailKey: neuronKey,
    // });
  }

  scrollToColumnNeuron(neuronIndex: number) {
    // scroll to the neuron and make sure it's column is centered
    const columnPadding = Math.floor(this.state.numVisibleColumns / 2);
    this.setState({
      scrollToColumn: Math.min(
        neuronIndex + columnPadding,
        model.neurons.length
      ),
      hoveredColumnIndex: neuronIndex,
    });
  }

  scrollToRowNeuron(neuronIndex: number) {
    // scroll to the row neuron and make sure it's column is centered
    const rowPadding = Math.floor(this.state.numVisibleRows / 2);
    this.setState({
      scrollToRow: Math.min(neuronIndex + rowPadding, model.neurons.length),
      hoveredRowIndex: neuronIndex,
    });
  }

  handleRowInputChange(newVal: string) {
    const neuronIndex = model.getIndexOfNeuron(newVal);

    this.setState(
      {
        rowInput: newVal,
      },
      () => {
        if (neuronIndex != null) {
          this.scrollToRowNeuron(neuronIndex);
        }
      }
    );
  }

  handleColumnInputChange(newVal: string) {
    const neuronIndex = model.getIndexOfNeuron(newVal);

    this.setState(
      {
        columnInput: newVal,
      },
      () => {
        if (neuronIndex != null) {
          this.scrollToColumnNeuron(neuronIndex);
        }
      }
    );
  }
  handleCellHover = debounce((rowIndex, columnIndex) => {
    this.setState({
      hoveredColumnIndex: columnIndex,
      hoveredRowIndex: rowIndex,
    });
  }, 5);

  render() {
    const { colorScaleFn } = this.state;

    const neuronClassColumnTabs = h(
      'div.column-neuron-tabs',
      model.allNeuronTypes().map((t) =>
        h(
          'div',
          {
            className: `${t} column-neuron-type-label`,
            onClick: (e) => {
              const firstNeuronIndexOfType = model.neurons.findIndex(
                (n) => n.canonicalType === t
              );
              if (firstNeuronIndexOfType >= 0) {
                this.scrollToColumnNeuron(firstNeuronIndexOfType);
              }
            },
          },
          t
        )
      )
    );

    const neuronClassRowTabs = h(
      'div.row-neuron-tabs',
      model.allNeuronTypes().map((t) =>
        h(
          'div',
          {
            className: `${t} row-neuron-type-label`,
            onClick: (e) => {
              const firstNeuronIndexOfType = model.neurons.findIndex(
                (n) => n.canonicalType === t
              );
              if (firstNeuronIndexOfType >= 0) {
                this.scrollToRowNeuron(firstNeuronIndexOfType);
              }
            },
          },
          t
        )
      )
    );

    return h('div.contact-matrix', [
      h('div.contact-matrix-header', [
        // h(Select, {
        //   className: 'contact-matrix-title',
        //   options: [
        //     { value: 'gap-junctions', label: 'Gap Junctions' },
        //     { value: 'chemical-synapses', label: 'Chemical Synapses' },
        //     { value: 'contact-area', label: 'Contact Area' },
        //   ],
        // }),
        h('h3.contact-matrix-title', 'Contact Matrix'),
        h('div.contact-matrix-controls', [
          h('div', [
            h('label', 'Find row neuron'),
            h('input.contact-matrix-input', {
              onChange: (e) => this.handleRowInputChange(e.target.value),
            }),
          ]),
          h('div', [
            h('label', 'Find column neuron'),
            h('input.contact-matrix-input', {
              onChange: (e) => this.handleColumnInputChange(e.target.value),
            }),
          ]),
        ]),
        neuronClassColumnTabs,
      ]),
      h(
        CellLegend,
        {
          legendEntries: [
            {
              className: 'contact-matrix-legend-monotonic',
              label: 'Monotonic increasing',
            },
            {
              className: 'contact-matrix-legend-no-contact',
              label: 'No contact',
            },
            {
              className: 'contact-matrix-legend-value-ignored',
              label: 'Symmetric values ignored',
            },
          ],
        },
        [
          h(ColorScale, {
            numSteps: 5,
            minVal: 0.0,
            minValLabel: '0',
            maxValLabel: `${Number(
              model.stats.maxContactArea / 1000000
            ).toFixed(2)} X 10^7`,
            maxVal: model.stats.maxContactArea,
            units: `${String.fromCharCode(181)}m^2`,
            colorScaleFn: colorScaleFn,
          }),
        ]
      ),
      h(MultiTabModal, {
        isOpen: this.state.showCellDetail,
        className: 'modal',
        onClick: (e) => this.setState({ showCellDetail: false }),
        neuronPairKey: this.state.cellDetailKey,
      }),
      h('div.row', [
        neuronClassRowTabs,
        h(
          AutoSizer,
          {
            // disableHeight: true,
          },
          [
            ({ width }) =>
              h(MultiGrid, {
                ...this.state,
                fixedColumnCount: 1,
                fixedRowCount: 1,
                cellRenderer: ({ isScrolling, columnIndex, rowIndex, style }) =>
                  h(ContactMatrixCell, {
                    isScrolling,
                    columnIndex,
                    rowIndex,
                    colorScaleFn,
                    key: `${rowIndex}$${columnIndex}`,
                    style,
                    highlighted:
                      columnIndex === this.state.hoveredColumnIndex ||
                      rowIndex === this.state.hoveredRowIndex,
                    onHover: this.handleCellHover,
                    onClick: (e, neuronKey, rowIndex, columnIndex) =>
                      this.handleCellClick(e, neuronKey, rowIndex, columnIndex),
                  }),
                rowHeight: 40,
                rowWidth: 80,
                columnWidth: 80,
                columnHeight: 40,
                enableFixedColumnScroll: true,
                enableFixedRowScroll: true,
                height: 720,
                width: width - 80,
                onSectionRendered: (opts) => this.handleSectionRendered(opts),
                rowCount: model.neurons.length,
                columnCount: model.neurons.length,
                styleBottomLeftGrid: {
                  borderRight: '2px solid #aaa',
                  backgroundColor: '#f7f7f7',
                },
                styleTopLeftGrid: {
                  borderBottom: '2px solid #aaa',
                  borderRight: '2px solid #aaa',
                  backgroundColor: '#f7f7f7',
                },
                styleTopRightGrid: {
                  borderBottom: '2px solid #aaa',
                  backgroundColor: '#f7f7f7',
                },
                hideTopRightGridScrollbar: true,
                hideBottomLeftGridScrollbar: true,
              }),
          ]
        ),
      ]),
    ]);
  }
}
