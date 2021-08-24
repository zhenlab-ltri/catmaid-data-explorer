import React from 'react';
import h from 'react-hyperscript';

import { ColorScale } from './color-scale';

export class CellLegend extends React.Component {
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

export class ContactMatrixCellLegend extends React.Component {
  render() {
    const { maxVal, colorScaleFn } = this.props;
    return h(
      CellLegend,
      {
        legendEntries: [
          {
            className: 'multi-matrix-legend-no-value',
            label: 'No contact',
          },
          {
            className: 'multi-matrix-legend-value-ignored',
            label: 'Symmetric values ignored',
          },
        ],
      },
      [
        h(ColorScale, {
          numSteps: 10,
          minVal: 0.0,
          minValLabel: '0',
          maxValLabel: `${Number(maxVal / 1000000).toFixed(2)} X 10^7`,
          maxVal,
          units: `${String.fromCharCode(181)}m^2`,
          colorScaleFn,
        }),
      ]
    );
  }
}

export class ChemicalSynapseMatrixCellLegend extends React.Component {
  render() {
    const { maxVal, colorScaleFn } = this.props;
    return h(
      CellLegend,
      {
        legendEntries: [
          {
            className: 'multi-matrix-legend-no-value',
            label: 'No chemical synapses',
          },
        ],
      },
      [
        h(ColorScale, {
          numSteps: 10,
          minVal: 0.0,
          minValLabel: '0',
          maxValLabel: maxVal,
          maxVal,
          units: '',
          colorScaleFn,
        }),
      ]
    );
  }
}

export class GapJunctionMatrixCellLegend extends React.Component {
  render() {
    const { maxVal, colorScaleFn } = this.props;
    return h(
      CellLegend,
      {
        legendEntries: [
          {
            className: 'multi-matrix-legend-no-value',
            label: 'No gap junctions',
          },
          {
            className: 'multi-matrix-legend-value-ignored',
            label: 'Symmetric values ignored',
          },
        ],
      },
      [
        h(ColorScale, {
          numSteps: 10,
          minVal: 0.0,
          minValLabel: '0',
          maxValLabel: maxVal,
          maxVal,
          units: '',
          colorScaleFn,
        }),
      ]
    );
  }
}
