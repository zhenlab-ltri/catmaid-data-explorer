import model from './model.compressed.json'

// get neuron key
// contact matrix data exists for neuron pair
// get neuron from index
// get index of neuron

// export const neuronPairKey = (neuron0: string, neuron1: string): string => {
//   return `${neuron0}$${neuron1}`;
// };

// export const neuronsFromPairKey = (neuronPairKey: string): [string, string] => {
//   const [ neuron0, neuron1 ] = neuronPairKey.split('$');
//   return [neuron0, neuron1]
// }


const neuronsIndexMap = {};
model.neuronsSorted.forEach((neuron: string, index: number): void => {
  neuronsIndexMap[neuron] = index;
});

const datasetsIndexMap = {};
model.datasetsSorted.forEach((dataset: string, index: number): void => {
  datasetsIndexMap[dataset] = index;
});

// given the index of a neuron in the sorted order
// e.g. ['AWAL', 'AWAR']
// getIndexOfNeuron('AWAR') -> 1
model.getIndexOfNeuron = (neuron: string): number => {
  return neuronsIndexMap[neuron];
}

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


model.getContactArea = (neuronPairKey: string) => {
  // the TEM_adult dataset does not have contact areas
  const contactAreaDataWithoutTEMAdult =
    model.neuronPairData[neuronPairKey]?.contact?.filter(
      (area: number) => area != null
    ) || null;
  const datasetsWithoutTEMAdult = model.datasetsSorted.filter(
    (dataset: string) => dataset !== 'TEM_adult'
  );

  return {
    contactAreas: contactAreaDataWithoutTEMAdult,
    contactAreaDatasets: datasetsWithoutTEMAdult,
  };
};



export default model;
