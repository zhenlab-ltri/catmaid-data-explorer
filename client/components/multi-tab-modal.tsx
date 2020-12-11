import React from 'react';
import h from 'react-hyperscript';
import Modal from 'react-modal';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { LineChart } from './charts';

export class MultiTabModal extends React.Component {
  render() {
    const { isOpen, className, onClick, neuronPairKey, activeTab } = this.props;
    const {
      data: gapJunctions,
      datasets: gapJunctionsDatasets,
    } = model.getGapJunctions(neuronPairKey);
    const {
      data: chemicalSynapses,
      datasets: chemicalSynapsesDatasets,
    } = model.getChemicalSynapses(neuronPairKey);
    const {
      data: contactAreas,
      datasets: contactAreaDatasets,
    } = model.getContactArea(neuronPairKey);

    const annotations = model.getAnnotations(neuronPairKey);
    const hasAnnotations = annotations.length > 0;

    const neuronPairText = `${neuronPairKey.replace('$', ' and ')}`;

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
        ]),
        h(Tabs, { defaultIndex: activeTab }, [
          h(TabList, [
            h(Tab, { disabled: chemicalSynapses == null }, 'Chemical Synapses'),
            h(Tab, { disabled: gapJunctions == null }, 'Gap Junctions'),
            h(Tab, { disabled: contactAreas == null }, 'Contact Area'),
          ]),
          h(TabPanel, { key: '0' }, [
            hasAnnotations
              ? h(
                  'div',
                  `Synapses between ${neuronPairText} are ${annotations[0]}`
                )
              : null,
            chemicalSynapses != null
              ? h(LineChart, {
                  id: 'chemicalSynapses',
                  stepSize: 1,
                  values: chemicalSynapses,
                  datasets: chemicalSynapsesDatasets,
                  label: `Chemical Synapses between ${neuronPairText}`,
                })
              : h(
                  'div',
                  `No chemical synapses found between ${neuronPairText}`
                ),
          ]),
          h(
            TabPanel,
            { key: '1' },
            gapJunctions != null
              ? h(LineChart, {
                  id: 'gapJunctions',
                  values: gapJunctions,
                  stepSize: 1,
                  datasets: gapJunctionsDatasets,
                  label: `Gap junctions between ${neuronPairText}`,
                })
              : h('div', `No gap junctions found between ${neuronPairText}`)
          ),
          h(TabPanel, { key: '2' }, [
            h(LineChart, {
              id: 'contactArea',
              values: contactAreas,
              datasets: contactAreaDatasets,
              label: `Contact area between ${neuronPairText} (${String.fromCharCode(
                181
              )}m^2)`,
            }),
          ]),
        ]),
      ]
    );
  }
}
