const fetch = require('node-fetch');
const { CATMAID_TOKEN } = require('./config.json');


(async () => {
  const res = await fetch('https://zhencatmaid.com/186/connectors/', {
    'method': 'post',
    'headers': {
      'Content-Type': 'application/json',
      'X-Authorization': `Token ${CATMAID_TOKEN}`
    }
  });

  const json = await res.json();

  console.log(json);
})()
