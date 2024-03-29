import model from './parse-model';


const neuronsIndexMap = {};
model.neurons.forEach((neuron, index: number): void => {
  neuronsIndexMap[neuron.id] = index;
});

const neuronInfoMap = {};
model.neurons.forEach(neuron => {
  neuronInfoMap[neuron.id] = neuron;
});
model.neuronInfo = neuronInfoMap;

const datasetsIndexMap = {};
model.datasets.forEach((dataset, index: number): void => {
  datasetsIndexMap[dataset] = index;
});

// given the index of a neuron in the sorted order
// e.g. ['AWAL', 'AWAR']
// getIndexOfNeuron('AWAR') -> 1
model.getIndexOfNeuron = (neuron: string): number => {
  return neuronsIndexMap[neuron];
}

model.getNeuronClassMembers = (neuronClass: string) => {
  const classMember = Object.values(neuronInfoMap).find(ni => ni.class === neuronClass);

  if(classMember){
    return classMember.classMembers;
  }

  return [];
};

model.getIndexOfDataset = (dataset: string): number => {
  return datasetIndexMap[dataset];
}

model.neuronPairKey = (neuron0: string, neuron1: string): string => {
  return `${neuron0}$${neuron1}`;
};

model.neuronsFromPairKey = (neuronPairKey: string): [string, string] => {
  const [neuron0, neuron1] = neuronPairKey.split('$');
  return [neuron0, neuron1]
};

model.allNeuronTypes = () => {
  return ['sensory', 'interneuron', 'motor', 'modulatory', 'muscle', 'other'];
};

model.getContactArea = (neuronPairKey: string) => {
  // the TEM_adult dataset does not have contact areas
  const contactAreaDataWithoutTEMAdult =
    model.neuronPairData[neuronPairKey]?.contactArea?.filter(
      (area: number) => area != null
    ) || null;
  const datasetsWithoutTEMAdult = model.datasets.map(d => d.id).filter(
    (dataset) => dataset !== 'TEM_adult'
  );

  return {
    data: contactAreaDataWithoutTEMAdult,
    datasets: datasetsWithoutTEMAdult,
  };
};

model.getChemicalSynapses = (neuronPairKey: string) => {
  return {
    data: model.neuronPairData[neuronPairKey]?.chemicalSynapses,
    datasets: model.datasets.map(d => d.id),
  };
}

model.getGapJunctions = (neuronPairKey: string) => {
  return {
    data: model.neuronPairData[neuronPairKey]?.gapJunctions,
    datasets: model.datasets.map(d => d.id),
  };
}

model.getAnnotations = (neuornPairKey: string) => {
  return model.neuronPairData[neuornPairKey]?.annotations || [];
}

window.model = model;

export default model;