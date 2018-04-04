import React from 'react'
import PropTypes from 'prop-types';

import DesignRenderer from './DesignRenderer';
import BarChartDesigner from '../art/BarChartDesigner';
import DisplayedRegionModel from '../model/DisplayedRegionModel';
import { getRelativeCoordinates } from '../util';

/**
 * Component that renders a bar chart graphic.
 * 
 * @author Silas Hsu
 */
class BarChart extends React.PureComponent {
    static propTypes = {
        viewRegion: PropTypes.instanceOf(DisplayedRegionModel).isRequired, // Region to display
        data: PropTypes.arrayOf(PropTypes.object).isRequired, // The data to display.  Array of BarChartRecord.
        width: PropTypes.number.isRequired, // Graphic width
        height: PropTypes.number.isRequired, // Graphic height
        options: PropTypes.object, // Drawing options.  Will be passed to BarChartDesigner.
        style: PropTypes.object, // CSS
        type: PropTypes.number, // Render element type.  See DesignRenderer.js

        /**
         * Called when the user mouses over the graphic.  Signature
         *     (event: MouseEvent, record: BarChartRecord): void
         *         `event`: the mousemove event that triggered this
         *         `record`: the record that was hovered over, or null if there is no record at this position.
         */
        onRecordHover: PropTypes.func,

        onMouseLeave: PropTypes.func, // Works as one would expect.  Signature: (event: MouseEvent): void
    };

    static defaultProps = {
        renderSvg: false,
        onRecordHover: (event, record) => undefined,
        onMouseLeave: (event) => undefined
    };

    /**
     * Binds event listeners.
     * 
     * @param {Object} props - props as specified by React
     */
    constructor(props) {
        super(props);
        this.mouseMoved = this.mouseMoved.bind(this);
        this.xToData = [];
    }

    /**
     * Callback for when the mouse is moved over the chart.  Calls the onRecordHover callback.
     * 
     * @param {MouseEvent} event - event that triggered this callback
     */
    mouseMoved(event) {
        const coords = getRelativeCoordinates(event);
        const record = this.xToData[Math.round(coords.x)] || null;
        this.props.onRecordHover(event, record);
    }

    /**
     * @inheritdoc
     */
    render() {
        const {viewRegion, data, width, height, options, style, type, onMouseLeave} = this.props;
        const designer = new BarChartDesigner(viewRegion, data, width, height, options);
        const design = designer.design();
        this.xToData = designer.getCoordinateMap();
        return (
        <DesignRenderer
            type={type}
            width={width}
            height={height}
            style={style}
            onMouseMove={this.mouseMoved}
            onMouseLeave={onMouseLeave}
        >
            {design}
        </DesignRenderer>
        );
    }
}

export default BarChart;
