const express = require('express');
const fetch = require('node-fetch');
const { CATMAID_URL, CATMAID_TOKEN } = require('./config.json');

const CATMAID_GAP_JUNCTION_RELATION = 'gapjunction_with'
const CATMAID_PRE_SYNAPTIC_RELATION = 'presynaptic_to'
const CATMAID_POST_SYNAPTIC_RELATION = 'postsynaptic_to'



const app = express();


app.use(express.static('dist'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// take in a single project id and export the data
// options - format: csv/json, gap junctions
app.post('/api/export-data', (req, res) => {
  const { format, connectionType, projectId, stackId } = req.body;
})

// take in a list of project/stack id objects
app.post('/api/comparison', (req, res) => {
  const { projectInfoList } = req.body;
});

app.get('/api/projects', async (req, res) => {
  const r = await fetch(`${CATMAID_URL}/projects/`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `Token ${CATMAID_TOKEN}`
    }
  });

  const json = await r.json();

  return res.json(json);
});

app.get('/api/annotations', async (req, res) => {
  const { projectId } = req.query;
  const r = await fetch(`${CATMAID_URL}/${projectId}/annotations/query-targets`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `Token ${CATMAID_TOKEN}`
    }
  });

  const json = await r.json();

  return res.json(json);
});

app.get('/api/relations', async (req, res) => {
  const { projectId } = req.query;
  const r = await fetch(`${CATMAID_URL}/${projectId}/connectors/types/`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `Token ${CATMAID_TOKEN}`
    }
  });


  const json = await r.json();

  return res.json(json);
});

app.get('/api/chemical-synapses', async (req, res) => {
  const { projectId } = req.query;
  const r = await fetch(`${CATMAID_URL}/${projectId}/connectors/`, {
    method: 'post',
    body: {
      'with_partners': true,
      'relation_type': [CATMAID_PRE_SYNAPTIC_RELATION, CATMAID_POST_SYNAPTIC_RELATION]
    },
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `Token ${CATMAID_TOKEN}`
    }
  });

  const json = await r.json();

  return res.json(json);
});

app.get('/api/chemical-synapses', async (req, res) => {
  const { projectId } = req.query;
  const r = await fetch(`${CATMAID_URL}/${projectId}/connectors/`, {
    method: 'post',
    body: {
      'with_partners': true,
      'relation_type': [CATMAID_PRE_SYNAPTIC_RELATION, CATMAID_POST_SYNAPTIC_RELATION]
    },
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `Token ${CATMAID_TOKEN}`
    }
  });

  const json = await r.json();

  return res.json(json);
});

app.get('/api/gap-junctions', async (req, res) => {
  const { projectId } = req.query;
  const r = await fetch(`${CATMAID_URL}/${projectId}/connectors/`, {
    method: 'post',
    body: {
      'with_partners': true,
      'relation_type': CATMAID_GAP_JUNCTION_RELATION
    },
    headers: {
      'Content-Type': 'application/json',
      'X-Authorization': `Token ${CATMAID_TOKEN}`
    }
  });

  const json = await r.json();

  return res.json(json);
});


app.listen(3000, () => console.log('Listening on port 3000!'));
