import contactMatrix from '../data/contact-matrices';
import React from 'react';
import chroma from 'chroma-js';

let individualScale = chroma.scale(['white', 'red']).domain([0, 25]);
let heatmapScale = chroma.scale(['white', 'red']).domain([0, 50]);

export class Heatmap extends React.Component {
  render() {
    return <div>heatmap</div>;
  }
}
