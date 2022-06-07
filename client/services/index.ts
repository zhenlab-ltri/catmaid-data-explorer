
import 'regenerator-runtime/runtime';

const neuronModelBufferCache = {};

export const getNeuronModel = neuronName => {

  if(neuronModelBufferCache[neuronName]) {
    return Promise.resolve(neuronModelBufferCache[neuronName]);
  }

  return fetch(`/api/models/${neuronName}`, {method: 'GET',})
    .then(res => res.arrayBuffer())
    .then(res => {
      neuronModelBufferCache[neuronName] = res;
      return res;
    });
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

export const getSynapsesBetween = neurons => {
  if(neurons.length === 0) {
    return Promise.resolve([]);
  };

  return fetch(`/api/synapses?${new URLSearchParams({ neurons: neurons.join(',')})}`, {
    method: 'GET',
  }).then(res => res.json());

}

export const getNeuronsSynapses = neuronNames => {
  const neuronSynapses = neuronNames.map(neuronName => getNeuronSynapses(neuronName));

  return Promise.all(neuronSynapses);
}

export const getNeuronClassSynapses = neuronClassMembers => {
  return fetch(`/api/neuron-class-synapses?${new URLSearchParams({ neuronClassMembers: neuronClassMembers.join(',')})}`, {
    method: 'GET',
  }).then(res => res.json());
}


let nerveRingArrayBuffer = null;
export const getNerveRingModel = () => {
  if(nerveRingArrayBuffer != null){
    return Promise.resolve(nerveRingArrayBuffer);
  } else {
    return fetch('/api/models/nervering').then( res => res.arrayBuffer()).then( res => {
      nerveRingArrayBuffer = res;
      return res;
    });
  }
}
