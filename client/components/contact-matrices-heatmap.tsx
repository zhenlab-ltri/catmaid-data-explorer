import React from 'react';
import h from 'react-hyperscript';
import chroma from 'chroma-js';
import MultiGrid from 'react-virtualized/dist/es/MultiGrid';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import debounce from 'lodash.debounce';
import Modal from 'react-modal';
import { Line } from 'react-chartjs-2';

import model from '../model';
import { monotonicIncreasing, monotonicDecreasing } from '../util';

const neuronClassToColor = {
  sensory: '#f9cef9',
  interneuron: '#ff887a',
  motor: '#b7daf5',
  modulatory: '#f9d77b',
  muscle: '#a8f5a2',
  other: '#d9d9d9',
};

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
          style: {
            ...style,
            overflow: 'visible',
            backgroundColor: neuronClassToColor[rowNeuronCanonicalType],
          },
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
          style: {
            ...style,
            backgroundColor: neuronClassToColor[colNeuronCanonicalType],
          },
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

class ContactAreaLineChart extends React.Component {
  render() {
    const { neuronPairKey } = this.props;
    const { contactAreas, contactAreaDatasets } = model.getContactArea(
      neuronPairKey
    );

    return h(Line, {
      data: {
        labels: contactAreaDatasets,
        datasets: [
          {
            label: `Contact area between ${neuronPairKey.replace(
              '$',
              ' and '
            )} (${String.fromCharCode(181)}m^2)`,
            data: contactAreas || [],
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
      lastRowIndex: 0,
      lastColumnIndex: 0,
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

    this.setState({
      lastRowIndex: rowStopIndex,
      lastColumnIndex: columnStopIndex,
    });
  }

  handleCellClick(e, neuronKey, rowIndex, columnIndex) {
    this.setState({
      showCellDetail: true,
      cellDetailKey: neuronKey,
    });
  }

  handleRowInputChange(newVal: string) {
    // TODO create function that centers searched neuron in row/col
    const neuronIndex = model.getIndexOfNeuron(newVal);

    this.setState(
      {
        rowInput: newVal,
      },
      () => {
        if (neuronIndex != null) {
          this.setState({
            scrollToRow: Math.min(neuronIndex + 6, model.neurons.length),
            hoveredRowIndex: neuronIndex,
          });
        }
      }
    );
  }

  handleColumnInputChange(newVal: string) {
    // TODO create function that centers searched neuron in row/col
    const neuronIndex = model.getIndexOfNeuron(newVal);

    this.setState(
      {
        columnInput: newVal,
      },
      () => {
        if (neuronIndex != null) {
          this.setState({
            scrollToColumn: Math.min(neuronIndex + 13, model.neurons.length),
            hoveredColumnIndex: neuronIndex,
          });
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
    const { colorScaleFn, lastRowIndex, lastColumnIndex } = this.state;
    const lastRowNeuronCanonicalType =
      model.neurons[lastRowIndex].canonicalType;
    const lastColumnNeuronCanonicalType =
      model.neurons[lastColumnIndex].canonicalType;

    const showColumnType = lastColumnIndex !== model.neurons.length - 2;
    const showRowType = lastRowIndex !== model.neurons.length - 2;

    return h('div.contact-matrix', [
      h('div.contact-matrix-header', [
        h('h3.contact-matrix-title', 'Contact Matrix'),
        showRowType
          ? h(
              'div.row-neuron-type-label',
              {
                style: {
                  backgroundColor:
                    neuronClassToColor[lastRowNeuronCanonicalType],
                },
              },
              `Type: ${lastRowNeuronCanonicalType}`
            )
          : null,
        showColumnType
          ? h(
              'div.column-neuron-type-label',
              {
                style: {
                  backgroundColor:
                    neuronClassToColor[lastColumnNeuronCanonicalType],
                },
              },
              `Type: ${lastColumnNeuronCanonicalType}`
            )
          : null,
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
      h(
        Modal,
        {
          style: {
            overlay: {
              zIndex: 1,
            },
          },
          isOpen: this.state.showCellDetail,
          className: 'modal',
        },
        [
          h(
            'button',
            { onClick: (e) => this.setState({ showCellDetail: false }) },
            'close'
          ),
          h(ContactAreaLineChart, { neuronPairKey: this.state.cellDetailKey }),
        ]
      ),
      h(
        AutoSizer,
        {
          disableHeight: true,
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
              height: 700,
              width,
              // isScrollingOptOut: true,
              onSectionRendered: (opts) => this.handleSectionRendered(opts),
              rowCount: model.neurons.length,
              columnCount: model.neurons.length,
              style: { border: '1px solid #ddd' },
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
    ]);
  }
}
