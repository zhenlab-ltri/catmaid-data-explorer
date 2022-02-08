
import 'regenerator-runtime/runtime';


export const getNeuronModel = neuronName => {
  return fetch(`/api/models/${neuronName}`, {
    method: 'GET',
  }).then(res => res.arrayBuffer());
}

export const getNeuronModels = neuronNames => {
  const neuronModelPromises = neuronNames.map(neuronName => getNeuronModel(neuronName));

  return Promise.all(neuronModelPromises);
}

export const getNeuronSynapses = neuronName => {
  if(neuronName == null) {
    return Promise.resolve([]);
  };
  
  return fetch(`/api/synapses/${neuronName}`, {
    method: 'GET',
  }).then(res => res.json());
};

export const getNeuronsSynapses = neuronNames => {
  const neuronSynapses = neuronNames.map(neuronName => getNeuronSynapses(neuronName));

  return Promise.all(neuronSynapses);

}