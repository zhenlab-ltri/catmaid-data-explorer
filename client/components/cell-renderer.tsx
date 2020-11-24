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
    const { gapJunctions } = model.getGapJunctions(neuronKey);
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
      ? h('div', {
          style: {
            width: style.width,
            height: style.height,
            backgroundColor: colorScaleFn(
              gapJunctions.reduce((a, b) => a + b, 0) / gapJunctions.length
            ),
          },
        })
      : gapJunctions.map((areaValue) =>
          h('div', {
            style: {
              width: style.width / gapJunctions.length,
              height: style.height,
              backgroundColor: colorScaleFn(areaValue),
            },
          })
        );

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
    const { chemicalSynapses } = model.getChemicalSynapses(neuronKey);
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
      ? h('div', {
          style: {
            width: style.width,
            height: style.height,
            backgroundColor: colorScaleFn(
              chemicalSynapses.reduce((a, b) => a + b, 0) /
                chemicalSynapses.length
            ),
          },
        })
      : chemicalSynapses.map((areaValue) =>
          h('div', {
            style: {
              width: style.width / chemicalSynapses.length,
              height: style.height,
              backgroundColor: colorScaleFn(areaValue),
            },
          })
        );

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
    const { contactAreas } = model.getContactArea(neuronKey);
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
      ? h('div', {
          style: {
            width: style.width,
            height: style.height,
            backgroundColor: colorScaleFn(
              contactAreas.reduce((a, b) => a + b, 0) / contactAreas.length
            ),
          },
        })
      : contactAreas.map((areaValue) =>
          h('div', {
            style: {
              width: style.width / contactAreas.length,
              height: style.height,
              backgroundColor: colorScaleFn(areaValue),
            },
          })
        );

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
