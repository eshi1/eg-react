import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import AnnotationArrows from '../commonComponents/AnnotationArrows';
import LinearDrawingModel from '../../../model/LinearDrawingModel';
import Gene from '../../../model/Gene';
import OpenInterval from '../../../model/interval/OpenInterval';

const HEIGHT = 9;
const UTR_HEIGHT = 5;
const LABEL_SIZE = HEIGHT * 1.5;

const LABEL_BACKGROUND_PADDING = 2;
const DEFAULT_COLOR = "blue";
const DEFAULT_BACKGROUND_COLOR = "white";

/**
 * A visualization of Gene objects.  Renders SVG elements.
 * 
 * @author Silas Hsu and Daofeng Li
 */
class GeneAnnotation extends React.PureComponent {
    static HEIGHT = HEIGHT;

    static propTypes = {
        gene: PropTypes.instanceOf(Gene).isRequired, // Gene structure to draw
        absLocation: PropTypes.instanceOf(OpenInterval).isRequired, // Location of gene in the nav context coordinates
        drawModel: PropTypes.instanceOf(LinearDrawingModel).isRequired, // Drawing model
        y: PropTypes.number, // y offset
        viewWindow: PropTypes.instanceOf(OpenInterval), // X range of visible pixels, used for label positioning
        isMinimal: PropTypes.bool, // If true, display only a minimal box
        options: PropTypes.shape({
            color: PropTypes.string,
            backgroundColor: PropTypes.string,
        }),
    };

    static defaultProps = {
        y: 0,
        viewWindow: new OpenInterval(-Infinity, Infinity),
        isMinimal: false,
        options: {},
        onClick: () => undefined
    };

    constructor(props) {
        super(props);
        this.state = {
            exonClipId: _.uniqueId("GeneAnnotation")
        };
    }

    /**
     * Renders a series of rectangles centered on the horizontal axis of the annotation.
     * @param {OpenInterval[]} absIntervals - nav context intervals in which to draw
     * @param {number} height - height of all the rectangles
     * @param {string} color - color of all the rectangles
     * @return {JSX.Element[]} <rect> elements
     */
    renderCenteredRects(absIntervals, height, color) {
        const drawModel = this.props.drawModel;
        return absIntervals.map(interval => {
            const x = drawModel.baseToX(interval.start);
            const width = drawModel.basesToXWidth(interval.getLength());
            return <rect key={x} x={x} y={(HEIGHT - height) / 2} width={width} height={height} fill={color} />;
        });
    }

    /**
     * Draws the annotation.
     * 
     * @return {null}
     * @override
     */
    render() {
        const {gene, absLocation, drawModel, y, viewWindow, isMinimal, options, onClick} = this.props;
        const exonClipId = this.state.exonClipId;
        const color = options.color || DEFAULT_COLOR;
        const backgroundColor = options.backgroundColor || DEFAULT_BACKGROUND_COLOR;
        const startX = Math.max(-1, drawModel.baseToX(absLocation.start));
        const endX = Math.min(drawModel.baseToX(absLocation.end), drawModel.getDrawWidth() + 1);
        const containerProps = {
            transform: `translate(0 ${y})`,
            onClick: event => onClick(event, gene)
        };

        const coveringRect = <rect // Box that covers the whole annotation to increase the click area
            x={startX}
            y={0}
            width={endX - startX}
            height={HEIGHT}
            fill={isMinimal ? color : backgroundColor}
        />;
        if (isMinimal) { // Just render a box if minimal.
            return <g {...containerProps} >{coveringRect}</g>;
        }

        const centerY = HEIGHT / 2;
        const centerLine = <line x1={startX} y1={centerY} x2={endX} y2={centerY} stroke={color} strokeWidth={2} />;

        // Exons, which are split into translated and non-translated ones (i.e. utrs)
        const {absTranslated, absUtrs} = gene.getAbsExons(absLocation);
        const exons = this.renderCenteredRects(absTranslated, HEIGHT, color); // These are the translated exons

        const isToRight = gene.getIsForwardStrand();
        const intronArrows = <AnnotationArrows
            startX={startX}
            endX={endX}
            height={HEIGHT}
            isToRight={isToRight}
            color={color}
        />;
        // clipPath is an invisible element that defines where another element may draw.  We pass its id to exonArrows.
        const exonClip = <clipPath id={exonClipId} >{exons}</clipPath>;
        const exonArrows = <AnnotationArrows
            startX={startX}
            endX={endX}
            height={HEIGHT}
            isToRight={isToRight}
            color={backgroundColor}
            clipId={exonClipId}
        />;

        // utrArrowCover covers up arrows where the UTRs will be
        const utrArrowCover = this.renderCenteredRects(absUtrs, HEIGHT, backgroundColor);
        const utrs = this.renderCenteredRects(absUtrs, UTR_HEIGHT, color);

        // Label
        let labelX, textAnchor;
        let labelBackground = null;
        // Label width is approx. because calculating bounding boxes is expensive.
        const estimatedLabelWidth = gene.getName().length * HEIGHT;
        const isBlockedLeft = startX - estimatedLabelWidth < viewWindow.start; // Label obscured if put on the left
        const isBlockedRight = endX + estimatedLabelWidth > viewWindow.end; // Label obscured if put on the right
        if (!isBlockedLeft) { // Yay, we can put it on the left!
            labelX = startX - 1;
            textAnchor = "end";
        } else if (!isBlockedRight) { // Yay, we can put it on the right!
            labelX = endX + 1;
            textAnchor = "start";
        } else { // Just put it directly on top of the annotation
            labelX = viewWindow.start + 1;
            textAnchor = "start";
            // We have to add some background for contrast purposes.
            labelBackground = <rect
                x={viewWindow.start - LABEL_BACKGROUND_PADDING}
                y={0}
                width={estimatedLabelWidth + LABEL_BACKGROUND_PADDING * 2}
                height={HEIGHT}
                fill={backgroundColor}
                opacity={0.65}
            />;
        }

        const label = (
            <text x={labelX} y={0} alignmentBaseline="hanging" textAnchor={textAnchor} fontSize={LABEL_SIZE} >
                {gene.getName()}
            </text>
        );

        return (
        <g {...containerProps} >
            {coveringRect}
            {centerLine}
            {exons}
            {exonClip}
            {intronArrows}
            {exonArrows}
            {utrArrowCover}
            {utrs}
            {labelBackground}
            {label}
        </g>
        );
    }
}

export default GeneAnnotation;
