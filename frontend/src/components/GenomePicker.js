import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import SearchIcon from "@material-ui/icons/Search";
import {
    CardMedia,
    Container,
    ListItem,
    ListItemText,
    ListItemIcon,
    List,
    AppBar,
    Toolbar,
    TextField,
    makeStyles,
    withStyles,
    InputAdornment,
} from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Box from "@material-ui/core/Box";
import Link from "@material-ui/core/Link";
import SwipeableViews from "react-swipeable-views";
import { ActionCreators } from "../AppState";
import { treeOfLife } from "../model/genomes/allGenomes";
import { SessionUI } from "./SessionUI";

import "./GenomePicker.css";

/**
 * loading page for choose genome
 * @author Daofeng Li
 * @author Shane Liu
 */

const callbacks = { onGenomeSelected: ActionCreators.setGenome };

const LinkWithMargin = withStyles({
    root: {
        margin: "10px",
    },
})(Link);

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`full-width-tabpanel-${index}`}
            aria-labelledby={`full-width-tab-${index}`}
            style={{ overflow: "hidden" }}
            {...other}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired,
};

function a11yProps(index) {
    return {
        id: `full-width-tab-${index}`,
        "aria-controls": `full-width-tabpanel-${index}`,
    };
}

function GenomePicker(props) {
    const theme = useTheme();
    const [value, setValue] = React.useState(0);
    const [searchText, setSearchText] = useState("");

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const handleChangeIndex = (index) => {
        setValue(index);
    };

    // Map the genomes to a list of cards. Genome search engine filters by both the species and the different assemblies.
    // It is not case sensitive.
    const renderTreeCards = () => {
        return Object.entries(treeOfLife)
            .filter(([species2, details]) => {
                return (
                    species2.toLowerCase().includes(searchText.toLowerCase()) ||
                    details.assemblies.join("").toLowerCase().includes(searchText)
                );
            })
            .map(([species2, details], idx) => {
                let filteredAssemblies = details.assemblies;
                if (!species2.toLowerCase().includes(searchText.toLowerCase())) {
                    filteredAssemblies = details.assemblies.filter((e) =>
                        e.toLowerCase().includes(searchText.toLowerCase())
                    );
                }
                return (
                    <Grid item xs={12} md={4} align="center" key={idx}>
                        <GenomePickerCard
                            species={species2}
                            details={{ logoUrl: details.logoUrl, assemblies: filteredAssemblies }}
                            onChoose={(genomeName) => props.onGenomeSelected(genomeName)}
                        />
                    </Grid>
                );
            });
    };

    return (
        <>
            <AppHeader />
            <AppBar position="static" color="default">
                <Tabs
                    value={value}
                    onChange={handleChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                    aria-label="genome picker"
                >
                    <Tab label="Choose a Genome" {...a11yProps(0)} />
                    <Tab label="Load a session" {...a11yProps(1)} />
                </Tabs>
            </AppBar>
            <SwipeableViews
                axis={theme.direction === "rtl" ? "x-reverse" : "x"}
                index={value}
                onChangeIndex={handleChangeIndex}
            >
                <TabPanel value={value} index={0} dir={theme.direction}>
                    <Container maxWidth="md">
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="h4" style={{ margin: "25px", marginLeft: 0 }}>
                                    Please select a genome
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    id="outlined-margin-normal"
                                    placeholder="Search for a genome..."
                                    margin="normal"
                                    variant="outlined"
                                    style={{ width: "100%", paddingRight: "16px" }}
                                    className="searchFieldRounded"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </Grid>
                        </Grid>
                        <Grid container spacing={2}>
                            {renderTreeCards()}
                        </Grid>
                    </Container>
                </TabPanel>
                <TabPanel value={value} index={1} dir={theme.direction}>
                    {!process.env.REACT_APP_NO_FIREBASE ? (
                        <SessionUI bundleId={props.bundleId} withGenomePicker={true} />
                    ) : (
                        <p>Session function is only working with Firebase configuration.</p>
                    )}
                </TabPanel>
            </SwipeableViews>
        </>
    );
}

function AppHeader() {
    const styles = useStyles();
    return (
        <div>
            <AppBar color="transparent" position="static">
                <Toolbar disableGutters>
                    <img
                        src="https://epigenomegateway.wustl.edu/browser/favicon-144.png"
                        alt="Browser Icon"
                        style={{ height: 50, width: "auto", marginLeft: 20, marginRight: 20 }}
                    />
                    <Typography variant="h5" noWrap>
                        WashU <span style={{ fontWeight: 100 }}>Epigenome Browser</span>
                    </Typography>
                    <div className={styles.alignRight}>
                        <LinkWithMargin
                            href="https://epigenomegateway.readthedocs.io/en/latest/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Documentation
                        </LinkWithMargin>
                        <LinkWithMargin
                            href="https://epigenomegateway.wustl.edu/legacy/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Switch to the 'old' browser
                        </LinkWithMargin>
                    </div>
                </Toolbar>
            </AppBar>
        </div>
    );
}

function GenomePickerCard(props) {
    const styles = useStyles();
    const { species, details, onChoose } = props;
    const { logoUrl, assemblies } = details;

    const renderAssemblies = () => {
        return assemblies.map((assembly, idx) => {
            return (
                <ListItem key={idx} button onClick={() => onChoose(assembly)} style={{ height: 25 }}>
                    <ListItemIcon>
                        <ChevronRightIcon />
                    </ListItemIcon>
                    <ListItemText primary={assembly} />
                </ListItem>
            );
        });
    };

    return (
        <Card className={styles.card}>
            <CardMedia image={logoUrl} title={species} className={styles.media} />
            <CardContent>
                <Typography gutterBottom variant="h5" component="h2" className={styles.cardTitle}>
                    {species}
                </Typography>
                <List className={styles.vertScroll}>{renderAssemblies()}</List>
            </CardContent>
        </Card>
    );
}

const useStyles = makeStyles({
    root: {
        flexGrow: 1,
    },
    media: {
        height: 60,
        borderRadius: "10px",
    },
    cardTitle: {
        textTransform: "capitalize",
        textAlign: "left",
    },
    card: {
        borderRadius: "10px",
        height: "100%",
        width: "270px",
    },
    alignRight: {
        marginRight: 15,
        marginLeft: "auto",
    },
});

GenomePicker.propTypes = {
    onGenomeSelected: PropTypes.func, // Called on genome selection.  Sigature: (genomeName: string): void
    bundleId: PropTypes.string,
};

export default connect(null, callbacks)(GenomePicker);
