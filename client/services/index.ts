
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