import contactMatrix from '../data/contact-matrices.json';
import React from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import h from 'react-hyperscript';

import { StickyGrid, GridColumn } from './StickyGrid';

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

const Cell = ({ columnIndex, rowIndex, style }) => {
  let className = '';
  let content = '.';
  if (columnIndex === 0 && rowIndex > 0) {
    content = neuronsOrdered[rowIndex - 1];
    // className = 'sticky-y-header-cell';
  }

  if (columnIndex > 0 && rowIndex === 0) {
    content = neuronsOrdered[columnIndex - 1];
    // className = 'sticky-x-header-cell';
  }

  return h(
    `div`,
    {
      className: className,
      style: style,
      key: `${columnIndex}-${rowIndex}`,
    },
    content
  );
};

// const Cell = ({ columnIndex, rowIndex, style }) => (
//   <div style={style}>
//     Item {rowIndex},{columnIndex}
//   </div>
// );

// const Example = () => (
//   <Grid
//     columnCount={1000}
//     columnWidth={100}
//     height={150}
//     rowCount={1000}
//     rowHeight={35}
//     width={300}
//   >
//     {Cell}
//   </Grid>
// );

export class Heatmap extends React.Component {
  render() {
    return h(
      StickyGrid,
      {
        width: 1000,
        height: 500,
        columnCount: neuronsOrdered.length + 1,
        rowCount: neuronsOrdered.length + 1,
        rowHeight: (index) => 60,
        columnWidth: (index) => 240,
        stickyHeight: 40,
        stickyWidth: 120,
        handleScroll: () => {},
      },
      GridColumn
    );
  }

  // render() {
  //   return h(
  //     Grid,
  //     {
  //       columnCount: neuronsOrdered.length + 1,
  //       columnWidth: 100,
  //       height: 500,
  //       rowCount: neuronsOrdered.length + 1,
  //       rowHeight: 35,
  //       width: 1000,
  //     },
  //     Cell
  //   );
  // }

  getContactMatrixData(neuron1: string, neuron2: string) {
    const key = `${neuron1}$${neuron2}`;
    const data = contactMatrix[key];
    // const data = null;

    if (data != null) {
      return Object.entries(data);
    } else {
      return [];
    }
  }

  // render() {
  //   return h('div', [
  //     h('table.heatmap', [
  //       h('thead', [
  //         h('tr', [
  //           h('th', '.'),
  //           ...neuronsOrdered.map((n) => h('th.sticky-x-header-cell', n)),
  //         ]),
  //       ]),
  //       h(
  //         'tbody',
  //         neuronsOrdered.map((n1) =>
  //           h('tr', [
  //             h('th.sticky-y-header-cell', n1),
  //             ...neuronsOrdered.map((n0) =>
  //               h('td.cell', { style: {} }, [
  //                 h(
  //                   'div.cell-data',
  //                   this.getContactMatrixData(n1, n0).map(([k, v]) =>
  //                     h('div.dataset-cell', v)
  //                   )
  //                 ),
  //               ])
  //             ),
  //           ])
  //         )
  //       ),
  //     ]),
  //   ]);
  // }
}
