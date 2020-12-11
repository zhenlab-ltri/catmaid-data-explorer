import React from 'react';
import h from 'react-hyperscript';

import model from '../model';

class RowHeaderCell extends React.PureComponent {
  render() {
    const { highlighted, label, style, className } = this.props;

    return h(
      'div',
      {
        key: `${label}$0`,
        className: `${className} matrix-cell-header ${
          highlighted ? 'matrix-cell-highlighted' : 'matrix-cell-unhighlighted'
        }`,
        style,
      },
      h('div', label)
    );
  }
}

class ColumnHeaderCell extends React.PureComponent {
  render() {
    const { highlighted, label, style, className } = this.props;

    return h(
      'div',
      {
        key: `0$${label}`,
        className: `${className} matrix-cell-header ${
          highlighted ? 'matrix-cell-highlighted' : 'matrix-cell-unhighlighted'
        }`,
        style,
      },
      h('div', label)
    );
  }
}

class IgnoredCell extends React.PureComponent {
  render() {
    const { rowNeuron, colNeuron, style } = this.props;
    return h('div', {
      key: model.neuronPairKey(rowNeuron, colNeuron),
      className: 'matrix-cell matrix-cell-ignored',
      style,
    });
  }
}

class EmptyCell extends React.PureComponent {
  render() {
    const {
      rowNeuron,
      colNeuron,
      style,
      onHover,
      onClick,
      rowIndex,
      columnIndex,
    } = this.props;

    return h('div', {
      className: 'matrix-cell matrix-cell-no-value',
      key: model.neuronPairKey(rowNeuron, colNeuron),
      onMouseOver: (e) => onHover(rowIndex, columnIndex),
      onClick: (e) =>
        onClick(
          e,
          model.neuronPairKey(rowNeuron, colNeuron),
          rowIndex,
          columnIndex
        ),
      style,
    });
  }
}

const ColoredCell = React.memo(function coloredCellInner(props) {
  const { width, height, colorScaleFn, collection } = props;

  return collection.map((val) =>
    h('div', {
      style: {
        width: width / collection.length,
        height: height,
        backgroundColor: colorScaleFn(val),
      },
    })
  );
});

export class GapJunctionMatrixCell extends React.PureComponent {
  render() {
    const {
      isScrolling,
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
    const { data: gapJunctions } = model.getGapJunctions(neuronKey);
    const noValue = gapJunctions == null;

    if (columnIndex === 0 && rowIndex === 0) {
      return h('div.matrix-cell', { key: '0-0', style });
    }

    // cell is in the row header
    if (columnIndex === 0 && rowIndex > 0) {
      return h(RowHeaderCell, {
        highlighted,
        className: rowNeuronCanonicalType,
        style,
        label: rowNeuron,
      });
    }

    // cell is in the column header
    if (rowIndex === 0 && columnIndex > 0) {
      return h(ColumnHeaderCell, {
        highlighted,
        className: colNeuronCanonicalType,
        style,
        label: colNeuron,
      });
    }

    // contact matrix data is symmetric
    // only render half the matrix
    if (rowIndex <= columnIndex) {
      return h(IgnoredCell, { rowNeuron, colNeuron, style });
    }

    if (noValue) {
      return h(EmptyCell, {
        rowNeuron,
        colNeuron,
        style,
        onHover,
        onClick,
        rowIndex,
        columnIndex,
      });
    }

    const gapJunctionsDiv = isScrolling
      ? h(ColoredCell, {
          width: style.width,
          height: style.height,
          colorScaleFn,
          collection: [
            gapJunctions.reduce((a, b) => a + b, 0) / gapJunctions.length,
          ],
        })
      : h(ColoredCell, {
          collection: gapJunctions,
          width: style.width,
          height: style.height,
          colorScaleFn,
        });

    return h(
      'div.matrix-cell',
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
        style,
      },
      gapJunctionsDiv
    );
  }
}

export class ChemicalSynapseMatrixCell extends React.PureComponent {
  render() {
    const {
      isScrolling,
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
    const { data: chemicalSynapses } = model.getChemicalSynapses(neuronKey);
    const noValue = chemicalSynapses == null;

    if (columnIndex === 0 && rowIndex === 0) {
      return h('div.matrix-cell', { key: '0-0', style });
    }

    // cell is in the row header
    if (columnIndex === 0 && rowIndex > 0) {
      return h(RowHeaderCell, {
        highlighted,
        className: rowNeuronCanonicalType,
        style,
        label: rowNeuron,
      });
    }

    // cell is in the column header
    if (rowIndex === 0 && columnIndex > 0) {
      return h(ColumnHeaderCell, {
        highlighted,
        className: colNeuronCanonicalType,
        style,
        label: colNeuron,
      });
    }

    if (noValue) {
      return h(EmptyCell, {
        rowNeuron,
        colNeuron,
        style,
        onHover,
        onClick,
        rowIndex,
        columnIndex,
      });
    }

    const chemicalSynapseDiv = isScrolling
      ? h(ColoredCell, {
          width: style.width,
          height: style.height,
          colorScaleFn,
          collection: [
            chemicalSynapses.reduce((a, b) => a + b, 0) /
              chemicalSynapses.length,
          ],
        })
      : h(ColoredCell, {
          collection: chemicalSynapses,
          width: style.width,
          height: style.height,
          colorScaleFn,
        });

    return h(
      'div.matrix-cell',
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
        style,
      },
      chemicalSynapseDiv
    );
  }
}

export class ContactMatrixCell extends React.PureComponent {
  render() {
    const {
      isScrolling,
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
    const { data: contactAreas } = model.getContactArea(neuronKey);
    const noValue = contactAreas == null;

    if (columnIndex === 0 && rowIndex === 0) {
      return h('div.matrix-cell', { key: '0-0', style });
    }

    // cell is in the row header
    if (columnIndex === 0 && rowIndex > 0) {
      return h(RowHeaderCell, {
        highlighted,
        className: rowNeuronCanonicalType,
        style,
        label: rowNeuron,
      });
    }

    // cell is in the column header
    if (rowIndex === 0 && columnIndex > 0) {
      return h(ColumnHeaderCell, {
        highlighted,
        className: colNeuronCanonicalType,
        style,
        label: colNeuron,
      });
    }

    // contact matrix data is symmetric
    // only render half the matrix
    if (rowIndex <= columnIndex) {
      return h(IgnoredCell, { rowNeuron, colNeuron, style });
    }

    if (noValue) {
      return h(EmptyCell, {
        rowNeuron,
        colNeuron,
        style,
        onHover,
        onClick,
        rowIndex,
        columnIndex,
      });
    }

    const contactAreaDiv = isScrolling
      ? h(ColoredCell, {
          width: style.width,
          height: style.height,
          colorScaleFn,
          collection: [
            contactAreas.reduce((a, b) => a + b, 0) / contactAreas.length,
          ],
        })
      : h(ColoredCell, {
          collection: contactAreas,
          width: style.width,
          height: style.height,
          colorScaleFn,
        });

    // const contactAreaDiv = h(ColoredCell, {
    //   collection: contactAreas,
    //   width: style.width,
    //   height: style.height,
    //   colorScaleFn,
    // });

    return h(
      'div.matrix-cell',
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
        style,
      },
      contactAreaDiv
    );
  }
}
