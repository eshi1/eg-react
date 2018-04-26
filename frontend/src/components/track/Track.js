import React from 'react';
import PropTypes from 'prop-types';
import memoizeOne from 'memoize-one';

import TrackLoadingNotice from './commonComponents/TrackLoadingNotice';
import MetadataIndicator from './commonComponents/MetadataIndicator';

import getComponentName from '../getComponentName';
import { getSubtypeConfig } from './subtypeConfig';

import TrackModel from '../../model/TrackModel';
import DisplayedRegionModel from '../../model/DisplayedRegionModel';
import RegionExpander from '../../model/RegionExpander';
import OpenInterval from '../../model/interval/OpenInterval';

import './Track.css';

/**
 * Props that will be passed to track legend components.
 */
export const LEGEND_PROP_TYPES = {
    trackModel: PropTypes.instanceOf(TrackModel).isRequired, // Track metadata
    data: PropTypes.any.isRequired, // Track data
    options: PropTypes.object.isRequired, // Options for the track
};

/**
 * Props that will be passed to track visualizer components.
 */
export const VISUALIZER_PROP_TYPES = {
    trackModel: PropTypes.instanceOf(TrackModel).isRequired, // Track metadata
    data: PropTypes.any.isRequired, // Track data
    viewRegion: PropTypes.instanceOf(DisplayedRegionModel).isRequired, // Region to visualize
    width: PropTypes.number.isRequired, // Visualization width
    options: PropTypes.object.isRequired, // Options for the track
    /**
     * X range of visible pixels, assuming the user has not dragged the view
     */
    viewWindow: PropTypes.instanceOf(OpenInterval),
};

/**
 * A function that returns a Component that only updates while its `isLoading` prop is false.  `isloading` will be
 * consumed; the wrapped component will not receive it.  This function exists since we don't want our visualizer to
 * rerender while data is loading.
 * 
 * @param {React.Component} WrappedComponent - Component to wrap
 * @return {React.Component} component that only updates while `isLoading` = false
 */
function freezeWhileLoading(WrappedComponent) {
    return class extends React.Component {
        static displayName = `freezeWhileLoading(${getComponentName(WrappedComponent)})`;

        shouldComponentUpdate(nextProps) {
            return !nextProps.isLoading;
        }

        render() {
            const {isLoading, ...rest} = this.props;
            return <WrappedComponent {...rest} />;
        }
    };
}

const REGION_EXPANDER = new RegionExpander(1);
// This memoization is very important, as it avoids rerendering the visualizer when extraneous props change
REGION_EXPANDER.calculateExpansion = memoizeOne(REGION_EXPANDER.calculateExpansion);
const WideDiv = freezeWhileLoading('div');

/**
 * Manages the following common to all tracks:
 *     - Data fetch
 *     - Legend
 *     - Visualizer
 * These are all determined by getSubtypeConfig.js.  For more information on how this all works, see TrackSubtype.ts and
 * the README.
 * 
 * @author Silas Hsu
 */
export class Track extends React.PureComponent {
    static propTypes = {
        trackModel: PropTypes.instanceOf(TrackModel).isRequired, // Track metadata
        viewRegion: PropTypes.instanceOf(DisplayedRegionModel).isRequired, // The region of the genome to display
        width: PropTypes.number.isRequired, // Width of the track's visualizer
        metadataTerms: PropTypes.arrayOf(PropTypes.string), // Terms for which to render metadata handles
        xOffset: PropTypes.number, // The horizontal amount to translate visualizations
        index: PropTypes.number, // The index of the track in the parent container.  Passed directly to the callbacks.
        /**
         * Called on context menu events.  Signature: (event: MouseEvent, index: number): void
         */
        onContextMenu: PropTypes.func,
        /**
         * Called on click events, except those clicks that happen on the metadata indicator.
         * Signature: (event: MouseEvent, index: number): void
         */
        onClick: PropTypes.func,
        /**
         * Called when user clicks on a metadata box.  Signature: (event: MouseEvent, term: string, index: number)
         *     `event` - the click event
         *     `term` - the metadata term associated with the box
         *     `index` - the index prop passed to the track
         */
        onMetadataClick: PropTypes.func,
    };

    static defaultProps = {
        xOffset: 0,
        onContextMenu: () => undefined,
        onClick: () => undefined,
        onMetadataClick: () => undefined,
    };

    /**
     * Initializes data source and state.
     * 
     * @param {Object} props - props as specified by React
     */
    constructor(props) {
        super(props);
        const trackSubtype = getSubtypeConfig(props.trackModel);
        this.dataSource = trackSubtype.getDataSource ? trackSubtype.getDataSource(props.trackModel) : null;

        this.state = {
            data: [],
            isLoading: this.dataSource != null,
            error: null,
        };
        this.fetchData(props);

        this.ignoreNextClick = false;
        this.handleContextMenu = this.handleContextMenu.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleMetadataClick = this.handleMetadataClick.bind(this);
        this.mergeDefaultOptions = memoizeOne(this.mergeDefaultOptions);
    }

    /**
     * If the view region has changed, sends a request for data
     * 
     * @param {object} prevProps - previous props
     * @override
     */
    componentDidUpdate(prevProps) {
        if (this.props.viewRegion !== prevProps.viewRegion) {
            if (this.dataSource) {
                this.setState({isLoading: true});
                this.fetchData(this.props);
            }
        }
    }

    /**
     * Calls cleanUp on the associated DataSource.
     */
    componentWillUnmount() {
        if (this.dataSource) {
            this.dataSource.cleanUp();
        }
    }

    /**
     * Uses this track's DataSource to fetch data within a view region, and then sets state.
     * 
     * @param {Object} props - props object; contains the region for which to fetch data
     * @return {Promise<void>} a promise that resolves when fetching is done, including when there is an error.
     */
    fetchData(props) {
        if (!this.dataSource) {
            return Promise.resolve();
        }

        const viewExpansion = REGION_EXPANDER.calculateExpansion(props.width, props.viewRegion);
        return this.dataSource.getData(viewExpansion.expandedRegion, props).then(data => {
            // When the data finally comes in, be sure it is still what the user wants
            if (this.props.viewRegion === props.viewRegion) {
                const trackSubtype = getSubtypeConfig(this.props.trackModel);
                const processedData = trackSubtype.processData ? trackSubtype.processData(data, this.props) : data;
                this.setState({
                    isLoading: false,
                    data: processedData,
                    error: null,
                });
            }
        }).catch(error => {
            if (this.props.viewRegion === props.viewRegion) {
                if (process.env.NODE_ENV !== 'test') {
                    console.error(error);
                }
                this.setState({
                    isLoading: false,
                    error: error,
                });
            }
        });
    }

    handleContextMenu(event) {
        this.props.onContextMenu(event, this.props.index);
    }

    handleClick(event) {
        if (!this.ignoreNextClick) {
            this.props.onClick(event, this.props.index);
        }
        this.ignoreNextClick = false;
    }

    handleMetadataClick(event, term) {
        this.ignoreNextClick = true; // Since the onClick event will be called right after this
        this.props.onMetadataClick(event, term, this.props.index);
    }

    /**
     * 
     */
    mergeDefaultOptions(trackOptions) {
        const trackSubtype = getSubtypeConfig(this.props.trackModel);
        return Object.assign({}, trackSubtype.defaultOptions, this.props.trackModel.options);
    }

    /**
     * Renders track legend, visualizer, loading notice, etc.
     * 
     * @return {JSX.Element} element to render
     * @override
     */
    render() {
        const {width, viewRegion, trackModel, xOffset, metadataTerms} = this.props;
        const viewExpansion = REGION_EXPANDER.calculateExpansion(width, viewRegion);
        const {expandedRegion, expandedWidth, viewWindow} = viewExpansion;
        const data = this.state.data;
        const trackSubtype = getSubtypeConfig(trackModel);
        const Legend = trackSubtype.legend;
        const Visualizer = trackSubtype.visualizer;
        const options = this.mergeDefaultOptions(trackModel.options);

        return (
        <div
            style={{backgroundColor: this.state.error ? "pink" : "white"}}
            className={trackModel.isSelected ? "Track Track-selected-border" : "Track"}
            onContextMenu={this.handleContextMenu}
            onClick={this.handleClick}
        >
            {this.state.isLoading ? <TrackLoadingNotice /> : null}
            <Legend trackModel={trackModel} data={data} options={options} />
            <WideDiv
                isLoading={this.state.isLoading}
                viewExpansion={viewExpansion}
                xOffset={xOffset}
                style={{backgroundColor: trackModel.options.backgroundColor}}
            >
                <Visualizer
                    data={data}
                    viewRegion={expandedRegion}
                    width={expandedWidth}
                    viewWindow={viewWindow}
                    trackModel={trackModel}
                    options={options}
                />
            </WideDiv>
            <MetadataIndicator track={trackModel} terms={metadataTerms} onClick={this.handleMetadataClick} />
        </div>
        );
    }
}

export default Track;
