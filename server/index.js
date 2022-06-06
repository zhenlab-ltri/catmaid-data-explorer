const express = require('express');
const fs = require('fs');
const basicAuth = require('express-basic-auth');
const app = express();
const path = require('path');
const parseSTL = require('parse-stl');

const { USER, PASSWORD } = require('../config.json');
const catmaidConnectors = require('./catmaid-synapse-info.json');

const catmaidIdLinkMap = {};
catmaidConnectors.connectors.forEach(entry => {
  const [
    id, x, y, z,
    confidence,
    creator_id,
    editor_id,
    creation_time, 
    edition_time ] = entry;
  
    catmaidIdLinkMap[`${id}`] = `https://zhencatmaid.com/?pid=${135}&zp=${z}&yp=${y}&xp=${x}&tool=tracingtool&sid0=${101}&s0=0`;
});


const synapseSizeMap = {};
const csv = fs.readFileSync('./server/synapse-sizes.txt');
csv.toString().split('\n')
  .map(line => line.split('  '))
  .filter((lineItems) => !lineItems[0].includes('synapses') && lineItems[0] != '')
  .forEach(([synapseInfoStr, _, numVoxels, volumeSize]) => {
    const [pre, post, catmaidId] = synapseInfoStr.split(' ');
    const cleanedCatmaidId = catmaidId.replace('"', '');
    synapseSizeMap[cleanedCatmaidId] = volumeSize;
  });

const averageSynapseSize = Object.values(synapseSizeMap).reduce((a, b) => a + b, 0) / Object.values(synapseSizeMap).length;
// const sortedSizes = Objecst.values(synapseSizeMap).map(size => parseInt(size) / 10000000).filter(s =>  !isNaN(s)).sort();
// console.log(sortedSizes, sortedSizes.length);
// console.log(sortedSizes[0], sortedSizes[Math.floor(sortedSizes.length / 2)], sortedSizes[sortedSizes.length - 1]);

const synapseFileInfo = f => { 
  const data = f.split('.')[1].split('_');
  return {
    pre: data[0],
    post: data[1].split(','),
    catmaidId: data[2].split('-')[0] 
  };
};

const synapseInfoList = fs.readdirSync('./server/3d-models/synapses/').map( f => {
  const { pre, post, catmaidId } = synapseFileInfo(f);

  const stlData = parseSTL(fs.readFileSync(`./server/3d-models/synapses/${f}`));
  return {
    position: stlData.positions[stlData.positions.length / 2], 
    pre,
    post: post.join(','),
    catmaidId,
    volumeSize: parseInt(synapseSizeMap[catmaidId]) || averageSynapseSize,
    catmaidLink: catmaidIdLinkMap[catmaidId]
  };

});



if (USER !== '' && PASSWORD !== '') {
  console.log(USER, PASSWORD);
  app.use(basicAuth({
      users: { [USER]: PASSWORD },
      challenge: true
  }));
}

app.use(express.static('dist'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/branchplotter', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../../branch_synapse_plotter/branch_plotter.html'));
});

app.get('/synapseplotter', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../../branch_synapse_plotter/synapse_plotter.html'));
});

let isValidNeuron = neuronName => true;

app.get('/api/models/nervering', (req, res) => {
  const nerveRingModel = fs.readFileSync('./server/3d-models/nervering/nervering-SEM_adult.stl');
  res.end(nerveRingModel, 'binary');
});

app.get('/api/models/:neuronId', (req, res) => {
  const neuronId = req.params.neuronId ;
  // const validNeurons = input.filter(neruonName => isValidNeuron(neuronName));
  const stlModelFile = fs.readFileSync(`./server/3d-models/${neuronId}-SEM_adult.stl`);
  res.end(stlModelFile, 'binary');
});


app.get('/api/synapses/:neuronId', (req, res) => {
  const neuronId = req.params.neuronId;

  const relevantSynapses = synapseInfoList.filter(entry => {
    const { pre, post } = entry;
    return pre === neuronId || post.split(',').includes(neuronId);
  });

  res.json(relevantSynapses);
})

app.get('/api/synapses', (req, res) => {

  const neurons = new Set(req.query.neurons.split(','))

  const relevantSynapses = synapseInfoList.filter(entry => {
    const { pre, post } = entry;

    const preInNeurons = neurons.has(pre);
    const anyPostInNeurons = Array.from(neurons).filter(n => post.split(',').includes(n)).length > 0;

    return preInNeurons && anyPostInNeurons;
  });

  res.json(relevantSynapses);
});

app.listen(3000, () => console.log('Listening on port 3000!'));
