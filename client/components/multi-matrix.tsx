import React from 'react';
import h from 'react-hyperscript';
import chroma from 'chroma-js';
import MultiGrid from 'react-virtualized/dist/es/MultiGrid';
import AutoSizer from 'react-virtualized/dist/es/AutoSizer';
import debounce from 'lodash.debounce';
import Modal from 'react-modal';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Dropdown from 'react-dropdown';

import {
  ContactMatrixCell,
  ChemicalSynapseMatrixCell,
  GapJunctionMatrixCell,
} from './cell-renderer';
import {
  ContactMatrixCellLegend,
  ChemicalSynapseMatrixCellLegend,
  GapJunctionMatrixCellLegend,
} from './cell-legend';
import { LineChart } from './charts';

import model from '../model';

class MultiTabModal extends React.Component {
  render() {
    const { isOpen, className, onClick, neuronPairKey, activeTab } = this.props;
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

    const annotations = model.getAnnotations(neuronPairKey);

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
        h('div.modal-header', [
          h('button', { onClick: (e) => this.props.onClick(e) }, 'close'),
          h(
            'div',
            annotations.map((a) => h('div', a))
          ),
        ]),
        h(Tabs, { defaultIndex: activeTab }, [
          h(TabList, [
            h(Tab, 'Chemical Synapses'),
            h(Tab, 'Gap Junctions'),
            h(Tab, 'Contact Area'),
          ]),
          h(
            TabPanel,
            { key: '0' },
            chemicalSynapses != null
              ? h(LineChart, {
                  id: 'chemicalSynapses',
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
              ? h(LineChart, {
                  id: 'gapJunctions',
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
            h(LineChart, {
              id: 'contactArea',
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
    cellRenderer: ContactMatrixCell,
    cellLegend: ContactMatrixCellLegend,
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
    cellRenderer: ChemicalSynapseMatrixCell,
    cellLegend: ChemicalSynapseMatrixCellLegend,
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
    cellRenderer: GapJunctionMatrixCell,
    cellLegend: GapJunctionMatrixCellLegend,
  },
};

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
    const {
      rowStartIndex,
      rowStopIndex,
      columnStartIndex,
      columnStopIndex,
    } = opts;

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
    const {
      neuronTypeWithMostColumns,
      neuronTypeWithMostRows,
      selectedMatrix,
    } = this.state;

    const {
      colorScaleFn,
      cellRenderer,
      cellLegend,
      maxVal,
      id,
    } = multiMatrixData[selectedMatrix];

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
          neuronTypeWithMostColumns,
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
      h('div.row', [
        h(NeuronRowTabs, {
          neuronTypeWithMostRows,
          onNeuronTabClick: (firstNeuronIndexOfType) => {
            if (firstNeuronIndexOfType >= 0) {
              this.scrollToRowNeuron(firstNeuronIndexOfType);
            }
          },
        }),
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
                  h(cellRenderer, {
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
