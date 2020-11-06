import React from 'react';
import chroma from 'chroma-js';
import h from 'react-hyperscript';
import { VariableSizeGrid as Grid } from 'react-window';

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

class CellInput extends React.Component {
  render() {
    const rowCellNeuron = neuronsOrdered[this.props.rowIndex];
    const colCellNeuron = neuronsOrdered[this.props.columnIndex];
    const key = `${rowCellNeuron}$${colCellNeuron}`;
    const contactMatrixData = contactMatrix.contact_area[key];
    const matrixDataExists = contactMatrixData != null;

    const datasetContacts = matrixDataExists
      ? contactMatrixData.map((area) =>
          h('div', {
            style: {
              width: 30,
              height: 30,
              border: '1px solid gray',
              backgroundColor: areaScale(area),
            },
          })
        )
      : [];

    return h(
      'div',
      {
        id: this.props.id,
        className: this.props.className,
        style: this.props.style,
        type: this.props.type,
      },
      matrixDataExists ? datasetContacts : '-'
    );
  }
}

const getRenderedCursor = (children) =>
  children.reduce(
    (
      [minRow, maxRow, minColumn, maxColumn],
      { props: { columnIndex, rowIndex } }
    ) => {
      if (rowIndex < minRow) {
        minRow = rowIndex;
      }

      if (rowIndex > maxRow) {
        maxRow = rowIndex;
      }

      if (columnIndex < minColumn) {
        minColumn = columnIndex;
      }

      if (columnIndex > maxColumn) {
        maxColumn = columnIndex;
      }

      return [minRow, maxRow, minColumn, maxColumn];
    },
    [
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]
  );

const headerBuilder = (minColumn, maxColumn, columnWidth, stickyHeight) => {
  const columns = [];
  let left = [0],
    pos = 0;

  for (let c = 1; c <= maxColumn; c++) {
    pos += columnWidth(c - 1);
    left.push(pos);
  }

  for (let i = minColumn; i <= maxColumn; i++) {
    columns.push({
      height: stickyHeight,
      width: columnWidth(i),
      left: left[i],
      label: neuronsOrdered[i],
    });
  }

  return columns;
};

const columnsBuilder = (minRow, maxRow, rowHeight, stickyWidth) => {
  const rows = [];
  let top = [0],
    pos = 0;

  for (let c = 1; c <= maxRow; c++) {
    pos += rowHeight(c - 1);
    top.push(pos);
  }

  for (let i = minRow; i <= maxRow; i++) {
    rows.push({
      height: rowHeight(i),
      width: stickyWidth,
      top: top[i],
      label: neuronsOrdered[i],
    });
  }

  return rows;
};

export const GridColumn = ({ rowIndex, columnIndex, style }) => {
  return React.createElement(CellInput, {
    id: rowIndex + 1 + ',' + (columnIndex + 1),
    className: 'sticky-grid__data__column',
    rowIndex,
    columnIndex,
    style: style,
    type: 'text',
    defaultValue: '',
    cellChange: () => {},
  });
};

const StickyHeader = ({ stickyHeight, stickyWidth, headerColumns }) => {
  const baseStyle = {
    height: stickyHeight,
    width: stickyWidth,
  };
  const scrollableStyle = {
    left: stickyWidth,
  };
  return React.createElement(
    'div',
    {
      className: 'sticky-grid__header',
    },
    React.createElement(
      'div',
      {
        className: 'sticky-grid__header__base',
        style: baseStyle,
      },
      '.'
    ),
    React.createElement(
      'div',
      {
        className: 'sticky-grid__header__scrollable',
        style: scrollableStyle,
      },
      headerColumns.map(({ label, ...style }, i) =>
        React.createElement(
          'div',
          {
            className: 'sticky-grid__header__scrollable__column',
            style: style,
            key: i,
          },
          label
        )
      )
    )
  );
};

const StickyColumns = ({ rows, stickyHeight, stickyWidth }) => {
  const leftSideStyle = {
    top: stickyHeight,
    width: stickyWidth,
    height: `calc(100% - ${stickyHeight}px)`,
  };
  return React.createElement(
    'div',
    {
      className: 'sticky-grid__sticky-columns__container',
      style: leftSideStyle,
    },
    rows.map(({ label, ...style }, i) =>
      React.createElement(
        'div',
        {
          className: 'sticky-grid__sticky-columns__row',
          style: style,
          key: i,
        },
        label
      )
    )
  );
};

const StickyGridContext = React.createContext();
StickyGridContext.displayName = 'StickyGridContext';
const innerGridElementType = React.forwardRef(({ children, ...rest }, ref) =>
  React.createElement(
    StickyGridContext.Consumer,
    null,
    ({
      stickyHeight,
      stickyWidth,
      headerBuilder,
      columnsBuilder,
      columnWidth,
      rowHeight,
    }) => {
      const [minRow, maxRow, minColumn, maxColumn] = getRenderedCursor(
        children
      ); // TODO maybe there is more elegant way to get this

      const headerColumns = headerBuilder(
        minColumn,
        maxColumn,
        columnWidth,
        stickyHeight
      );
      const leftSideRows = columnsBuilder(
        minRow,
        maxRow,
        rowHeight,
        stickyWidth
      );
      const containerStyle = {
        ...rest.style,
        width: `${parseFloat(rest.style.width) + stickyWidth}px`,
        height: `${parseFloat(rest.style.height) + stickyHeight}px`,
      };
      const containerProps = {
        ...rest,
        style: containerStyle,
      };
      const gridDataContainerStyle = {
        top: stickyHeight,
        left: stickyWidth,
      };
      return React.createElement(
        'div',
        {
          className: 'sticky-grid__container',
          ref: ref,
          ...containerProps,
        },
        React.createElement(StickyHeader, {
          headerColumns: headerColumns,
          stickyHeight: stickyHeight,
          stickyWidth: stickyWidth,
        }),
        React.createElement(StickyColumns, {
          rows: leftSideRows,
          stickyHeight: stickyHeight,
          stickyWidth: stickyWidth,
        }),
        React.createElement(
          'div',
          {
            className: 'sticky-grid__data__container',
            style: gridDataContainerStyle,
          },
          children
        )
      );
    }
  )
);

export const StickyGrid = ({
  stickyHeight,
  stickyWidth,
  columnWidth,
  rowHeight,
  children,
  ...rest
}) =>
  React.createElement(
    StickyGridContext.Provider,
    {
      value: {
        stickyHeight,
        stickyWidth,
        columnWidth,
        rowHeight,
        headerBuilder,
        columnsBuilder,
      },
    },
    React.createElement(
      Grid,
      {
        columnWidth: columnWidth,
        rowHeight: rowHeight,
        innerElementType: innerGridElementType,
        ...rest,
      },
      children
    )
  );
