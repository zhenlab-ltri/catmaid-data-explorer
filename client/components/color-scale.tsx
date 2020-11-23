import React from 'react';
import h from 'react-hyperscript';

// component that renders color scale bars using a sequence of divs
// dependent on a chroma-js scale object that maps values to colors
export class ColorScale extends React.Component {
  render() {
    const {
      numSteps,
      minVal,
      maxVal,
      minValLabel,
      maxValLabel,
      units,
      colorScaleFn,
    } = this.props;
    const stepSize = maxVal / numSteps;
    const colorScaleDivs = [...Array(numSteps).keys()].map((el, index) => {
      return h('div.color-scalebar-item', {
        style: { backgroundColor: colorScaleFn(index * stepSize) },
      });
    });

    return h('div.color-scale', [
      h('div.color-scalebar', colorScaleDivs),
      h('div', `[${minValLabel}, ${maxValLabel}] ${units}`),
    ]);
  }
}
