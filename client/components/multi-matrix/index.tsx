import React from 'react';
import h from 'react-hyperscript';
import chroma from 'chroma-js';
import MultiGrid from 'react-virtualized/dist/es/MultiGrid';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import debounce from 'lodash.debounce';
import Dropdown from 'react-dropdown';
import ReactHover, { Trigger, Hover } from 'react-hover';

import { MultiTabModal } from './multi-tab-modal';
import { NestedMultiMatrixCell } from './cell-renderer';
import {
  ContactMatrixCellLegend,
  ChemicalSynapseMatrixCellLegend,
  GapJunctionMatrixCellLegend,
} from './cell-legend';

import model from '../../model';

const multiMatrixData = {
  contactArea: {
    id: 2,
    label: 'Contact Area',
    value: 'contactArea',
    maxVal: model.stats.maxContactArea,
    colorScaleFn: chroma
      .scale(['white', 'red'])
      .domain([0, model.stats.maxContactArea])
      .gamma(0.6),
    dataFn: model.getContactArea,
    cellLegend: ContactMatrixCellLegend,
    symmetric: true,
  },
  chemicalSynapses: {
    id: 0,
    label: 'Chemical Synapses',
    value: 'chemicalSynapses',
    maxVal: model.stats.maxConnectivityCs,
    colorScaleFn: chroma
      .scale(['white', 'red'])
      .domain([0, model.stats.maxConnectivityCs])
      .gamma(0.6),
    dataFn: model.getChemicalSynapses,
    cellLegend: ChemicalSynapseMatrixCellLegend,
    symmetric: false,
  },
  gapJunctions: {
    id: 1,
    label: 'Gap Junctions',
    value: 'gapJunctions',
    maxVal: model.stats.maxConnectivityGj,
    colorScaleFn: chroma
      .scale(['white', 'red'])
      .domain([0, model.stats.maxConnectivityGj])
      .gamma(0.6),
    dataFn: model.getGapJunctions,
    cellLegend: GapJunctionMatrixCellLegend,
    symmetric: true,
  },
};
class NeuronColumnTabs extends React.PureComponent {
  render() {
    const { neuronTypeWithMostColumns, onNeuronTabClick } = this.props;
    return h(
      'div.column-neuron-tabs',
      model.allNeuronTypes().map((t) =>
        h(
          'div',
          {
            className: `${t} column-neuron-type-label ${
              neuronTypeWithMostColumns !== t
                ? 'neuron-type-label-deactivated'
                : 'neuron-type-label-activated'
            }`,
            onClick: () => {
              const firstNeuronIndexOfType = model.neurons.findIndex(
                (n) => n.canonicalType === t
              );
              onNeuronTabClick(firstNeuronIndexOfType);
            },
          },
          t
        )
      )
    );
  }
}

class NeuronRowTabs extends React.PureComponent {
  render() {
    const { neuronTypeWithMostRows, onNeuronTabClick } = this.props;
    return h(
      'div.row-neuron-tabs',
      model.allNeuronTypes().map((t) =>
        h(
          'div',
          {
            className: `${t} row-neuron-type-label ${
              neuronTypeWithMostRows !== t
                ? 'neuron-type-label-deactivated'
                : 'neuron-type-label-activated'
            }`,
            onClick: () => {
              const firstNeuronIndexOfType = model.neurons.findIndex(
                (n) => n.canonicalType === t
              );
              onNeuronTabClick(firstNeuronIndexOfType);
            },
          },
          t
        )
      )
    );
  }
}

class CellHoverDetail extends React.PureComponent {
  render() {
    const { selectedMatrix, hoveredRowIndex, hoveredColumnIndex } = this.props;
    if (hoveredRowIndex < 0 && hoveredColumnIndex < 0) {
      return h('div');
    }

    const rowNeuron = model.neurons[hoveredRowIndex].id;
    const columnNeuron = model.neurons[hoveredColumnIndex].id;
    const neuronPairKey = model.neuronPairKey(rowNeuron, columnNeuron);
    const annotations = model.getAnnotations(neuronPairKey);
    const { label } = multiMatrixData[selectedMatrix];
    const { data, datasets } =
      multiMatrixData[selectedMatrix].dataFn(neuronPairKey);

    if (data == null) {
      return h('div');
    }

    const dataPointDivs = datasets.map((datasetId, index) => {
      return h('div.hover-data-row', [
        h('div', datasetId),
        h('div', data[index]),
      ]);
    });
    return h('div.hover-tooltip', [
      h('div', `${label}:`),
      h('div', dataPointDivs),
    ]);
  }
}

export default class MultiMatrix extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedMatrix: multiMatrixData.contactArea.value,
      hoveredRowIndex: -1,
      hoveredColumnIndex: -1,
      scrollToColumn: 0,
      scrollToRow: 0,
      numVisibleRows: 0,
      numVisibleColumns: 0,
      neuronTypeWithMostRows: 'sensory',
      neuronTypewithMostColumns: 'sensory',
      rowInput: '',
      columnInput: '',
      showCellDetail: false,
      cellDetailKey: '',
    };
  }

  onDropdownSelect(e) {
    this.setState({
      selectedMatrix: e.value,
    });
  }

  handleSectionRendered = debounce((opts) => {
    const { rowStartIndex, rowStopIndex, columnStartIndex, columnStopIndex } =
      opts;

    const numVisibleRows = rowStopIndex - rowStartIndex;
    const numVisibleColumns = columnStopIndex - columnStartIndex;
    const neuronTypeWithMostRows = model.neurons[rowStopIndex].canonicalType;
    const neuronTypeWithMostColumns =
      model.neurons[columnStopIndex].canonicalType;

    this.setState({
      numVisibleRows,
      numVisibleColumns,
      neuronTypeWithMostRows,
      neuronTypeWithMostColumns,
    });
  }, 50);

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
  }, 50);

  render() {
    const matrixConfig = multiMatrixData[this.state.selectedMatrix];
    const { id, cellLegend, colorScaleFn, maxVal, dataFn, symmetric } =
      matrixConfig;

    return h('div.multi-matrix', [
      h('div.multi-matrix-header', [
        h(Dropdown, {
          onChange: (e) => this.onDropdownSelect(e),
          value: this.state.selectedMatrix,
          className: 'multi-matrix-title',
          options: Object.values(multiMatrixData),
        }),
        h('div.multi-matrix-controls', [
          h('div', [
            h('label', 'Find row neuron'),
            h('input.multi-matrix-input', {
              onChange: (e) => this.handleRowInputChange(e.target.value),
            }),
          ]),
          h('div', [
            h('label', 'Find column neuron'),
            h('input.multi-matrix-input', {
              onChange: (e) => this.handleColumnInputChange(e.target.value),
            }),
          ]),
        ]),
        h(NeuronColumnTabs, {
          neuronTypeWithMostColumns: this.state.neuronTypeWithMostColumns,
          onNeuronTabClick: (firstNeuronIndexOfType) => {
            if (firstNeuronIndexOfType >= 0) {
              this.scrollToColumnNeuron(firstNeuronIndexOfType);
            }
          },
        }),
      ]),
      h(MultiTabModal, {
        activeTab: id,
        isOpen: this.state.showCellDetail,
        className: 'modal',
        onClick: (e) => this.setState({ showCellDetail: false }),
        neuronPairKey: this.state.cellDetailKey,
      }),
      h(cellLegend, { maxVal, colorScaleFn }),
      h(
        ReactHover,
        {
          options: {
            followCursor: true,
            shiftX:
              this.state.hoveredColumnIndex >= model.neurons.length - 4 // shift tooltip to left side when near right side of page
                ? -200
                : 20,
            shiftY:
              this.state.hoveredRowIndex >= model.neurons.length - 7 // shift the tooltip up when it is near the bottom of the page
                ? -300
                : 0,
          },
        },
        [
          h(Trigger, { type: 'trigger' }, [
            h('div.row', [
              h(NeuronRowTabs, {
                neuronTypeWithMostRows: this.state.neuronTypeWithMostRows,
                onNeuronTabClick: (firstNeuronIndexOfType) => {
                  if (firstNeuronIndexOfType >= 0) {
                    this.scrollToRowNeuron(firstNeuronIndexOfType);
                  }
                },
              }),
              h(AutoSizer, [
                ({ width }) =>
                  h(MultiGrid, {
                    ...this.state,
                    overscanColumnCount: 2,
                    overscanRowCount: 2,
                    fixedColumnCount: 1,
                    fixedRowCount: 1,
                    cellRenderer: ({
                      isScrolling,
                      columnIndex,
                      rowIndex,
                      style,
                      isVisible,
                    }) =>
                      h(NestedMultiMatrixCell, {
                        dataFn,
                        symmetric,
                        isVisible,
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
                          this.handleCellClick(
                            e,
                            neuronKey,
                            rowIndex,
                            columnIndex
                          ),
                      }),
                    rowHeight: 40,
                    rowWidth: 80,
                    columnWidth: 80,
                    columnHeight: 40,
                    enableFixedColumnScroll: true,
                    enableFixedRowScroll: true,
                    height: 720,
                    width: width - 80,
                    onSectionRendered: (opts) =>
                      this.handleSectionRendered(opts),
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
              ]),
            ]),
          ]),
          h(Hover, { type: 'hover' }, [
            h(CellHoverDetail, {
              selectedMatrix: this.state.selectedMatrix,
              hoveredRowIndex: this.state.hoveredRowIndex,
              hoveredColumnIndex: this.state.hoveredColumnIndex,
            }),
          ]),
        ]
      ),
    ]);
  }
}
