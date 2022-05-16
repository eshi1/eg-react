import Chromosome from "../Chromosome";
import Genome from "../Genome";
import TrackModel from "../../TrackModel";
import annotationTracks from "./annotationTracks.json";
import chromSize from "./chromSize.json";

const allSize = chromSize.map((genom) => new Chromosome(genom.chr, genom.size));
const genome = new Genome("picrh", allSize);

const navContext = genome.makeNavContext();
const defaultRegion = navContext.parse("NC_048595.1:100000-200000");
const defaultTracks = [
    // new TrackModel({
    //     type: "refbed",
    //     name: "PICRH RefBed",
    //     url: "http://XXXX/cors-downloads/PICRH/PICRH_refbed_Gene.bed.gz",
    // }),
    new TrackModel({
        type: "ruler",
        name: "Ruler",
    }),
];

const PICRH = {
    genome: genome,
    navContext: navContext,
    cytobands: {},
    defaultRegion: defaultRegion,
    defaultTracks: defaultTracks,
    annotationTracks,
};

export default PICRH;
