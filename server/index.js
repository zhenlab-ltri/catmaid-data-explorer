const express = require('express');
const fs = require('fs');

const app = express();

app.use(express.static('dist'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let isValidNeuron = neuronName => true;

app.get('/api/models/:neuronId', (req, res) => {
  const neuronId = req.params.neuronId ;
  // const validNeurons = input.filter(neruonName => isValidNeuron(neuronName));
  const stlModelFile = fs.readFileSync(`./server/3d-models/${neuronId}-SEM_adult.stl`);
  res.end(stlModelFile, 'binary');
});

app.listen(3000, () => console.log('Listening on port 3000!'));
