  computeScalebarMeasurement() {
    return {
      scalebarMeasurement: (this.visualization.renderer.domElement.getBoundingClientRect().width * this.visualization.camera.zoom) /
    (this.visualization.camera.right - this.visualization.camera.left),
      scalebarMinWidth: this.visualization.renderer.domElement.getBoundingClientRect().width / 5
    };
  }

  this.visualization.controls.addEventListener('change', () => {
    this.view.showTooltip = false;
    let { scalebarMeasurement, scalebarMinWidth } = this.computeScalebarMeasurement();
    this.view.scalebarMeasurement = scalebarMeasurement;
    this.view.scalebarMinWidth = scalebarMinWidth;
  });

  mounted: () => {
    this.controller.initializeVisualization();
    let { scalebarMeasurement, scalebarMinWidth } = this.controller.computeScalebarMeasurement();
    this.scalebarMeasurement = scalebarMeasurement;
    this.scalebarMinWidth = scalebarMinWidth;

  },

    // scale bar state
    scalebarMeasurement: 0,
    scalebarMinWidth: 0,

    
    scalebarContent: () => {
        let width = 0;
        let scalebarDisplayVal = '';
        for (let i = 0; i < SCALE_BAR_SIZES.length; ++i) {
            scalebarDisplayVal = SCALE_BAR_SIZES[i];
            width = SCALE_BAR_SIZES[i] * this.scalebarMeasurement;
            if (width > Math.min(192, this.scalebarMinWidth)) {
            break;
            }
        }

        let ui = 0;
        while (scalebarDisplayVal >= 1000 && ui < SCALE_BAR_UNITS.length - 1) {
            scalebarDisplayVal /= 1000;
            ++ui;
        }

        return {
            width,
            scalebarDisplayVal: `${scalebarDisplayVal} ${SCALE_BAR_UNITS[ui]}`
        };


        getScaleBarStyle: () => {
            let textColor = '#777';
            return {
                'width': `${this.scalebarContent.width}px`,
                'position': 'absolute',
                'left': '10px',
                'bottom': '10px',
                'padding': '5px',
                'border-left': `2px solid ${textColor}`,
                'border-bottom': `2px solid ${textColor}`,
                'color': textColor
            };
            },

<div class="ntv-scale-bar" :style="getScaleBarStyle({})">
    {{ scalebarContent.scalebarDisplayVal }}
</div>