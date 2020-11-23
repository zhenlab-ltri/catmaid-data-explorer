import React from 'react';
import h from 'react-hyperscript';

import { Line } from 'react-chartjs-2';

export class LineChart extends React.Component {
  render() {
    const { id, label, datasets, values } = this.props;

    return h(Line, {
      id,
      data: {
        labels: datasets,
        datasets: [
          {
            label,
            data: values || [],
            fill: false,
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgba(255, 99, 132, 0.2)',
          },
        ],
      },
      options: {
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
              },
            },
          ],
        },
      },
    });
  }
}
