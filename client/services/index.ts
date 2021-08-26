
import 'regenerator-runtime/runtime';


export const getNeuronModel = neuronName => {
  return fetch(`/api/models/${neuronName}`, {
    method: 'GET',
  }).then(res => res.arrayBuffer());
}