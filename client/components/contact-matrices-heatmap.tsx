import React from 'react';
import h from 'react-hyperscript';
import chroma from 'chroma-js';
import MultiGrid from 'react-virtualized/dist/es/MultiGrid';
import debounce from 'lodash.debounce';
import contactMatrix from '../data/combined-contact-matrices.json';
const areaScale = chroma
  .scale(['white', 'red'])
  .domain([0.0, contactMatrix.stats.max_area]);

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

const monotonicIncreasing = (arr) =>
  arr.every((ele, index, arr) => (index > 0 ? ele > arr[index - 1] : true));
const monotonicDecreasing = (arr) =>
  arr.every((ele, index, arr) => (index > 0 ? ele < arr[index - 1] : true));

class ContactMatrixCell extends React.Component {
  render() {
    const { highlighted, columnIndex, rowIndex, style, onHover } = this.props;
    const rowNeuron = neuronsOrdered[rowIndex];
    const colNeuron = neuronsOrdered[columnIndex];
    const neuronKey = `${rowNeuron}$${colNeuron}`;
    const contactMatrixData = contactMatrix.contact_area[neuronKey];
    let backgroundColor = 'white';

    if (contactMatrixData == null) {
      backgroundColor = 'gray';
    } else {
      if (monotonicIncreasing(contactMatrixData)) {
        backgroundColor = 'red';
      }

      if (monotonicDecreasing(contactMatrixData)) {
        backgroundColor = 'blue';
      }
    }

    if (columnIndex === 0 && rowIndex === 0) {
      return h('div.contact-matrix-cell', { key: '0-0', style });
    }
    if (columnIndex === 0 && rowIndex > 0) {
      return h(
        'div.contact-matrix-cell',
        {
          key: `${rowNeuron}-0`,
          style: {
            ...style,
            fontSize: highlighted ? '1em' : '0.7em',
            opacity: highlighted ? 1 : 0.2,
          },
        },
        rowNeuron
      );
    }
    if (rowIndex === 0 && columnIndex > 0) {
      return h(
        'div.contact-matrix-cell',
        {
          key: `0-${colNeuron}`,
          style: {
            ...style,
            fontSize: highlighted ? '1em' : '0.7em',
            opacity: highlighted ? 1 : 0.2,
          },
        },
        colNeuron
      );
    }

    return h('div.contact-matrix-cell', {
      key: `${rowNeuron}-${colNeuron}`,
      onMouseOver: (e) => onHover(e),
      style: {
        ...style,
        border: '1px solid black',
        opacity: contactMatrixData == null || !highlighted ? 0.2 : 1,
        backgroundColor,
      },
    });
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
    };
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
      h('div.contact-matrix-controls', [
        h('div.contact-matrix-input', [
          h('label', 'Find row neuron'),
          h('input', {
            onChange: (e) => this.handleRowInputChange(e.target.value),
          }),
        ]),
        h('div.contact-matrix-input', [
          h('label', 'Find column neuron'),
          h('input', {
            onChange: (e) => this.handleColInputChange(e.target.value),
          }),
        ]),
      ]),
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
          }),
        rowHeight: 50,
        rowWidth: 50,
        columnWidth: 50,
        columnHeight: 50,
        enableFixedColumnScroll: true,
        enableFixedRowScroll: true,
        height: 750,
        width: 1300,
        rowCount: neuronsOrdered.length + 1,
        columnCount: neuronsOrdered.length + 1,
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
    ]);
  }
}
