import React from 'react';
import h from 'react-hyperscript';
import chroma from 'chroma-js';
import MultiGrid from 'react-virtualized/dist/es/MultiGrid';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import debounce from 'lodash.debounce';
import Modal from 'react-modal';
import { Line } from 'react-chartjs-2';

import contactMatrix from '../data/combined-contact-matrices.json';

import { monotonicIncreasing, monotonicDecreasing } from '../util';

const areaScale = chroma
  .scale(['white', 'red'])
  .domain([0.0, contactMatrix.stats.max_area])
  .gamma(0.6);

const datasetsOrdered = contactMatrix.dataset_index_order;

const neuronsOrdered = [
  'ADFL',
  'ADFR',
  'ADLL',
  'ADLR',
  'AFDL',
  'AFDR',
  'ALML',
  'ALMR',
  'ALNL',
  'ALNR',
  'AQR',
  'ASEL',
  'ASER',
  'ASGL',
  'ASGR',
  'ASHL',
  'ASHR',
  'ASIL',
  'ASIR',
  'ASJL',
  'ASJR',
  'ASKL',
  'ASKR',
  'AUAL',
  'AUAR',
  'AVM',
  'AWAL',
  'AWAR',
  'AWBL',
  'AWBR',
  'AWCL',
  'AWCR',
  'BAGL',
  'BAGR',
  'DVA',
  'FLPL',
  'FLPR',
  'IL2DL',
  'IL2DR',
  'IL2L',
  'IL2R',
  'IL2VL',
  'IL2VR',
  'OLLL',
  'OLLR',
  'OLQDL',
  'OLQDR',
  'OLQVL',
  'OLQVR',
  'PLNL',
  'PLNR',
  'SAADL',
  'SAADR',
  'SAAVL',
  'SAAVR',
  'SDQL',
  'SDQR',
  'URBL',
  'URBR',
  'URXL',
  'URXR',
  'URYDL',
  'URYDR',
  'URYVL',
  'URYVR',
  'ADAL',
  'ADAR',
  'AIAL',
  'AIAR',
  'AIBL',
  'AIBR',
  'AINL',
  'AINR',
  'AIYL',
  'AIYR',
  'AIZL',
  'AIZR',
  'AVAL',
  'AVAR',
  'AVBL',
  'AVBR',
  'AVDL',
  'AVDR',
  'AVEL',
  'AVER',
  'BDUL',
  'BDUR',
  'DVC',
  'PVCL',
  'PVCR',
  'PVNL',
  'PVNR',
  'PVPL',
  'PVPR',
  'PVR',
  'PVT',
  'RIAL',
  'RIAR',
  'RIBL',
  'RIBR',
  'RIFL',
  'RIFR',
  'RIGL',
  'RIGR',
  'RIH',
  'RIML',
  'RIMR',
  'RIPL',
  'RIPR',
  'RIR',
  'IL1DL',
  'IL1DR',
  'IL1L',
  'IL1R',
  'IL1VL',
  'IL1VR',
  'RIVL',
  'RIVR',
  'RMDDL',
  'RMDDR',
  'RMDL',
  'RMDR',
  'RMDVL',
  'RMDVR',
  'RMED',
  'RMEL',
  'RMER',
  'RMEV',
  'RMFL',
  'RMFR',
  'RMHL',
  'RMHR',
  'SIADL',
  'SIADR',
  'SIAVL',
  'SIAVR',
  'SIBDL',
  'SIBDR',
  'SIBVL',
  'SIBVR',
  'SMBDL',
  'SMBDR',
  'SMBVL',
  'SMBVR',
  'SMDDL',
  'SMDDR',
  'SMDVL',
  'SMDVR',
  'URADL',
  'URADR',
  'URAVL',
  'URAVR',
  'ADEL',
  'ADER',
  'AIML',
  'AIMR',
  'ALA',
  'AVFL',
  'AVFR',
  'AVHL',
  'AVHR',
  'AVJL',
  'AVJR',
  'AVKL',
  'AVKR',
  'AVL',
  'CEPDL',
  'CEPDR',
  'CEPVL',
  'CEPVR',
  'HSNL',
  'HSNR',
  'PVQL',
  'PVQR',
  'RICL',
  'RICR',
  'RID',
  'RIS',
  'RMGL',
  'RMGR',
  'BWM-DL01',
  'BWM-DR01',
  'BWM-VL01',
  'BWM-VR01',
  'BWM-DL02',
  'BWM-DR02',
  'BWM-VL02',
  'BWM-VR02',
  'BWM-DL03',
  'BWM-DR03',
  'BWM-VL03',
  'BWM-VR03',
  'BWM-DL04',
  'BWM-DR04',
  'BWM-VL04',
  'BWM-VR04',
  'BWM-DL05',
  'BWM-DR05',
  'BWM-VL05',
  'BWM-VR05',
  'BWM-DL06',
  'BWM-DR06',
  'BWM-VL06',
  'BWM-VR06',
  'BWM-DL07',
  'BWM-DR07',
  'BWM-VL07',
  'BWM-VR07',
  'BWM-DL08',
  'BWM-DR08',
  'BWM-VL08',
  'BWM-VR08',
  'CANL',
  'CANR',
  'CEPshDL',
  'CEPshDR',
  'CEPshVL',
  'CEPshVR',
  'GLRDL',
  'GLRDR',
  'GLRL',
  'GLRR',
  'GLRVL',
  'GLRVR',
  'excgl',
];

const neuronsIndexMap = {};
neuronsOrdered.forEach((neuron, index) => {
  neuronsIndexMap[neuron] = index;
});

// component that renders color scale bars using a sequence of divs
// dependent on a chroma-js scale object that maps values to colors
class ColorScale extends React.Component {
  render() {
    const { numSteps, minVal, maxVal, units, colorScaleFn } = this.props;
    const stepSize = maxVal / numSteps;
    const colorScaleDivs = [...Array(numSteps).keys()].map((el, index) => {
      return h('div.color-scalebar-item', {
        style: { backgroundColor: colorScaleFn(index * stepSize) },
      });
    });

    return h('div.color-scale', [
      h('div', `${minVal} ${units}`),
      h('div.color-scalebar', colorScaleDivs),
      h('div', `${maxVal} ${units}`),
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

    return h('div.cell-legend', legendEntryDivs);
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
    } = this.props;
    const rowNeuron = neuronsOrdered[rowIndex];
    const colNeuron = neuronsOrdered[columnIndex];
    const neuronKey = `${rowNeuron}$${colNeuron}`;
    const contactMatrixData = contactMatrix.contact_area[neuronKey];
    let backgroundColor = 'white';

    if (contactMatrixData == null) {
      backgroundColor = 'gray';
    } else {
      if (monotonicIncreasing(contactMatrixData)) {
        backgroundColor = 'black';
      }

      if (monotonicDecreasing(contactMatrixData)) {
        backgroundColor = 'blue';
      }
    }

    if (columnIndex === 0 && rowIndex === 0) {
      return h('div.contact-matrix-cell', { key: '0-0', style });
    }

    // cell is in the row header
    if (columnIndex === 0 && rowIndex > 0) {
      return h(
        'div.contact-matrix-cell',
        {
          key: `${rowNeuron}$0`,
          style: {
            ...style,
            fontSize: highlighted ? '1.25em' : '0.7em',
          },
        },
        rowNeuron
      );
    }

    // cell is in the column header
    if (rowIndex === 0 && columnIndex > 0) {
      return h(
        'div.contact-matrix-cell',
        {
          key: `0$${colNeuron}`,
          style: {
            ...style,
            fontSize: highlighted ? '1.25em' : '0.7em',
          },
        },
        colNeuron
      );
    }

    // contact matrix data is symmetric
    // only render half the matrix
    if (rowIndex <= columnIndex) {
      return h('div.contact-matrix-cell', {
        key: `${rowNeuron}$${colNeuron}`,
        style: {
          ...style,
          border: '1px solid black',
          // opacity: 0.2,
          backgroundColor: '#514d4d',
        },
      });
    }

    return h(
      'div.contact-matrix-cell',
      {
        key: `${rowNeuron}$${colNeuron}`,
        onMouseOver: (e) => onHover(e),
        onClick: (e) =>
          onClick(e, `${rowNeuron}$${colNeuron}`, rowIndex, columnIndex),
        style: {
          ...style,
          border: '1px solid black',
          opacity: contactMatrixData == null ? 0.2 : 1,
          backgroundColor,
          cursor: contactMatrixData == null ? 'default' : 'pointer',
        },
      },
      contactMatrixData == null
        ? []
        : contactMatrixData.map((areaValue) =>
            h('div', {
              style: {
                height: monotonicIncreasing(contactMatrixData)
                  ? style.height - 8
                  : style.height,
                width:
                  (monotonicIncreasing(contactMatrixData)
                    ? style.width - 8
                    : style.width) / contactMatrixData.length,
                backgroundColor: areaScale(areaValue),
              },
            })
          )
    );
  }
}

export default class ContactMatrix extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hoveredRowIndex: -1,
      hoveredColumnIndex: -1,
      fixedColumnCount: 1,
      fixedRowCount: 1,
      scrollToColumn: 0,
      scrollToRow: 0,
      rowInput: '',
      colInput: '',
      showCellDetail: false,
      cellDetailKey: '',
    };
  }

  handleCellClick(e, neuronKey, rowIndex, columnIndex) {
    this.setState({
      showCellDetail: true,
      cellDetailKey: neuronKey,
    });
  }

  handleRowInputChange(newVal: string) {
    this.setState(
      {
        rowInput: newVal,
      },
      () => {
        if (neuronsIndexMap[newVal] != null) {
          this.setState({
            scrollToRow: Math.min(
              neuronsIndexMap[newVal] + 6,
              neuronsOrdered.length
            ),
            hoveredRowIndex: neuronsIndexMap[newVal],
          });
        }
      }
    );
  }

  handleColInputChange(newVal: string) {
    this.setState(
      {
        colInput: newVal,
      },
      () => {
        if (neuronsIndexMap[newVal] != null) {
          this.setState({
            scrollToColumn: Math.min(
              neuronsIndexMap[newVal] + 13,
              neuronsOrdered.length
            ),
            hoveredColumnIndex: neuronsIndexMap[newVal],
          });
        }
      }
    );
  }

  render() {
    return h('div.contact-matrix', [
      h('div.contact-matrix-header', [
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
              onChange: (e) => this.handleColInputChange(e.target.value),
            }),
          ]),
        ]),
        h(ColorScale, {
          numSteps: 60,
          minVal: 0.0,
          maxVal: contactMatrix.stats.max_area,
          units: `${String.fromCharCode(181)}m^2`,
          colorScaleFn: areaScale,
        }),
      ]),
      h(CellLegend, {
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
      }),
      h(
        Modal,
        {
          style: {
            overlay: {
              zIndex: 1,
            },
          },
          isOpen: this.state.showCellDetail,
          className: 'contact-matrix-cell-detail-modal',
        },
        [
          h(
            'button',
            { onClick: (e) => this.setState({ showCellDetail: false }) },
            'close'
          ),
          h(Line, {
            data: {
              labels: datasetsOrdered,
              datasets: [
                {
                  label: `Contact area between ${this.state.cellDetailKey.replace(
                    '$',
                    ' and '
                  )} (${String.fromCharCode(181)}m^2)`,
                  data: contactMatrix.contact_area[this.state.cellDetailKey],
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
          }),
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
              cellRenderer: ({ columnIndex, rowIndex, style }) =>
                h(ContactMatrixCell, {
                  columnIndex,
                  rowIndex,
                  key: `${rowIndex}-${columnIndex}`,
                  style,
                  highlighted:
                    columnIndex === this.state.hoveredColumnIndex ||
                    rowIndex === this.state.hoveredRowIndex,
                  onHover: debounce((e) => {
                    this.setState({
                      hoveredColumnIndex: columnIndex,
                      hoveredRowIndex: rowIndex,
                    });
                  }, 350),
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
              rowCount: neuronsOrdered.length,
              columnCount: neuronsOrdered.length,
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
