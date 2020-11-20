

import compressedModel from './model.full-compression';


// Convert the compressed model json file into an easier to understand js object

const compressedTypeToReadableType = {
  's': 'sensory',
  'm': 'modulatory',
  'i': 'interneuron',
  't': 'motor',
  'u': 'muscle',
  'o': 'other'
};

const compressedNeurotransmitterTypeToReabableType = {
  'a': 'acetylcholine',
  'd': 'dopamine',
  'g': 'glutamate',
  's': 'serotonin',
  'u': 'unknown',
  't': 'tyramine',
  'o': 'octopamine',
  'G': 'GABA'
};

const compressedAnnotationToReadable = {
  'i': 'developmentally added',
  'd': 'developmentally pruned',
  's': 'stable',
  'v': 'variable',
  'p': 'postembryonic'
};


const parsedNeurons = compressedModel.neurons.map(compressedNeuron => {
  const { id, c, t, nt, cm, ct } = compressedNeuron;
  return {
    id,
    class: c,
    canonicalType: ct,
    types: t.split('').map(compressedType => compressedTypeToReadableType[compressedType]),
    neurotransmitterTypes: nt.split('').map(compressed => compressedNeurotransmitterTypeToReabableType[compressed]),
    classMembers: cm.map(classMemberNumberIndex => compressedModel.neurons[classMemberNumberIndex].id)
  }
});


const parsedNeuronPairData = Object.fromEntries(
  Object.entries(compressedModel.neuronPairData).map( ([neuronIndexKey, compressedPairData]) => {
    const { a, ca, c, g } = compressedPairData;
    const [nIndex0, nIndex1] = neuronIndexKey.split('$');
    const neuronStringKey = `${parsedNeurons[nIndex0].id}$${parsedNeurons[nIndex1].id}`;

    const parsedAnnotations = a?.map(compressedAnnotation => compressedAnnotationToReadable[compressedAnnotation]);

    const parsedData = {};

    ca ? parsedData.contactArea = ca : null;
    c ? parsedData.chemicalSynapses = c : null;
    g ? parsedData.gapJunctions = g : null;
    a ? parsedData.annotations = parsedAnnotations : null;

    return [neuronStringKey, parsedData];
  })
);

export default {
  datasets: compressedModel.datasets,
  neurons: parsedNeurons,
  stats: compressedModel.stats,
  neuronPairData: parsedNeuronPairData
};
