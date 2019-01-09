import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {withStyles} from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import GpsFixedIcon from '@material-ui/icons/GpsFixed';
import withRoot from "../utils/withRoot";
import SettingsIcon from '@material-ui/icons/Settings';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import Fab from "@material-ui/core/Fab";
import Database from "../db";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import Slide from "@material-ui/core/Slide";
import LinearProgress from "@material-ui/core/LinearProgress";
import Graph from "./Graph";
import Entry from "./Entry";
import {CirclePicker} from 'react-color';
import {
  amber,
  blue,
  blueGrey,
  brown,
  cyan,
  deepOrange,
  deepPurple,
  green,
  grey,
  indigo,
  lightBlue,
  lightGreen,
  lime,
  orange,
  pink,
  purple,
  red,
  teal,
  yellow
} from "@material-ui/core/colors";
import SearchBar, {INITIAL_KEYWORD} from "./SearchBar";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Switch from "@material-ui/core/Switch";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";

const remote = require("electron").remote;

const windowWidth = remote.getCurrentWindow().getBounds().width;
const windowHeight = remote.getCurrentWindow().getBounds().height;
const drawerWidth = windowWidth * 0.3;

const styles = theme => ({
  root: {
    display: 'flex',
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButtonHidden: {
    display: 'none',
  },
  drawerPaper: {
    position: 'relative',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: 0,
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
    height: '100vh',
    overflow: 'auto',
  },
  drawerContent: {
    padding: theme.spacing.unit * 2,
    height: '100vh',
    overflowY: 'scroll'
  },
  chartContainer: {
    marginLeft: -22,
  },
  tableContainer: {
    height: 320,
  },
  h5: {
    marginBottom: theme.spacing.unit * 2,
  },
  grow: {
    flexGrow: 1,
  },
  title: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
  hidden: {
    display: 'none'
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.unit * 3,
    bottom: theme.spacing.unit * 3,
    backgroundColor: "#fff",
    "&:hover": {
      background: "#eee"
    }
  },
  fab2: {
    bottom: theme.spacing.unit * 12,
  },
  graph: {
    width: windowWidth - drawerWidth,
    height: windowHeight - theme.mixins.toolbar.minHeight,
    overflow: 'visible',
    position: 'absolute',
    top: theme.mixins.toolbar.minHeight,
    left: drawerWidth
  },
  graphOnDrawerClose: {
    width: windowWidth,
    left: 0
  },
  dialogContent: {
    overflowY: "visible"
  },
  dialogLabel: {
    paddingTop: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit
  },
  hopsControl: {
    marginLeft: theme.spacing.unit * 3,
    marginTop: theme.spacing.unit
  }
});

const Transition = (props) => {
  return <Slide direction="up" {...props} />;
};

const colorNames = [amber, blue, blueGrey, brown, cyan, deepOrange, deepPurple, green,
  grey, indigo, lightBlue, lightGreen, lime, orange, pink, purple, red, teal, yellow];
const colorPool = colorNames.map((n) => n[700]).concat(colorNames.map(n => n[200]));

const sample = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

class Index extends React.Component {

  state = {
    processing: false,
    open: true,
    settingsOpen: false,
    graph: {
      nodes: [],
      links: []
    },
    searchHistory: [],
    searchValue: INITIAL_KEYWORD,
    colors: {
      word: indigo[700],
      abstractWord: pink[700],
      phrase: blue[700],
      thesaurus: yellow[200],
    },
    checked: {
      word: true,
      abstractWord: true,
      phrase: false,
      thesaurus: true
    },
    charge: 1,
    hops: 2,
    alertOpen: false,
    alertMessage: ""
  };

  database = new Database();

  componentDidMount = () => {
    this.createSearch(this.state.searchValue);
  };

  handleDrawerToggle = () => {
    this.setState({open: !this.state.open});
  };

  handleSettingsOpen = () => {
    this.setState({settingsOpen: true});
  };

  handleSettingsClose = () => {
    this.setState({settingsOpen: false});
  };

  searchBarRef = React.createRef();

  createSearch = (searchValue) => {
    this.searchBarRef.current.passiveUpdate(searchValue);
    searchValue = searchValue.trim();
    this.setState({
      searchHistory: this.state.searchHistory.concat([searchValue]),
      searchValue: searchValue
    });
    this.handleSearch(searchValue);
  };

  translateSearchParams = (searchValue) => {
    let queryParams = {};
    const translator = {
      "id": "identity"
    };
    searchValue.split("|").forEach((val) => {
      const spliter = val.search(":");
      if (spliter === -1) {
        queryParams["name"] = val.trim();
      } else {
        let k = val.substring(0, spliter).trim();
        if (translator.hasOwnProperty(k)) k = translator[k];
        queryParams[k] = val.substring(spliter + 1).trim();
      }
    });
    return queryParams;
  };

  handleSearch = (searchValue) => {
    this.setState({processing: true});
    if (searchValue.search("---") !== -1) {
      const ends = searchValue.split("---");
      this.database.pathQuery(this.translateSearchParams(ends[0]), this.translateSearchParams(ends[1])).then(res => {
        if (!res.entry) {
          this.alert(res.errorMessage || "No path found.");
        } else {
          this.setState({processing: false, graph: res, entry: res.entry});
        }
      })
    } else {
      this.database.defaultQuery(this.translateSearchParams(searchValue), this.state.hops).then(res => {
        if (!res.entry) {
          this.alert(res.errorMessage || "No matching entry found.");
        } else {
          this.setState({processing: false, graph: res, entry: res.entry});
        }
      })
    }
  };

  handleSearchBack = () => {
    const searchValue = this.state.searchHistory[this.state.searchHistory.length - 2];
    this.searchBarRef.current.passiveUpdate(searchValue);
    this.setState({
      searchValue: searchValue,
      searchHistory: this.state.searchHistory.slice(0, -1)
    });
    this.handleSearch(searchValue);
  };

  handleColorChange = (color, name) => {
    let newColor = {...this.state.colors};
    newColor[name] = color.hex;
    this.setState({colors: newColor});
  };

  handleCheckChange = (type) => {
    let newChecked = {...this.state.checked};
    newChecked[type] = !newChecked[type];
    this.setState({checked: newChecked});
  };

  handlePathConstruct = () => {
    const searchValue1 = this.state.searchHistory[this.state.searchHistory.length - 2];
    const searchValue2 = this.state.searchHistory[this.state.searchHistory.length - 1];
    this.createSearch(searchValue1 + " --- " + searchValue2.trim());
  };

  alert = (alertMessage) => {
    this.setState({alertMessage: alertMessage, alertOpen: true, processing: false});
  };

  handleAlertClose = () => {
    this.setState({alertOpen: false});
  };

  handleStateChange = (name) => (ev) => {
    this.setState({[name]: ev.target.value});
  };

  graphRef = React.createRef();

  render() {
    const {classes} = this.props;

    return (
      <div className={classes.root}>
        <CssBaseline/>
        <AppBar position="absolute" className={classNames(classes.appBar, this.state.open && classes.appBarShift)}>
          <Toolbar>
            <IconButton
              color="inherit"
              onClick={this.handleDrawerToggle.bind(this)}
            >
              <MenuIcon/>
            </IconButton>
            <IconButton
              color="inherit"
              className={classNames(this.state.searchHistory.length <= 1 && classes.hidden)}
              onClick={this.handleSearchBack.bind(this)}>
              <ChevronLeftIcon/>
            </IconButton>
            <SearchBar onSearch={this.createSearch} value={this.state.searchValue} innerRef={this.searchBarRef}/>
            <IconButton
              color="inherit"
              className={classNames(this.state.searchHistory.length <= 1 && classes.hidden)}
              onClick={this.handlePathConstruct.bind(this)}
            >
              <TrendingUpIcon/>
            </IconButton>
          </Toolbar>
          <LinearProgress className={classNames(!this.state.processing && classes.hidden)} color="secondary"/>
        </AppBar>
        <Drawer
          variant="persistent"
          classes={{
            paper: classNames(classes.drawerPaper, !this.state.open && classes.drawerPaperClose),
          }}
          open={this.state.open}
        >
          <Entry entry={this.state.entry} className={classes.drawerContent} onSearch={this.createSearch}
                 handleHover={(id, enter) => this.graphRef.current.doScale(id, enter)}/>
        </Drawer>
        <main className={classes.content}>
          <div className={classes.appBarSpacer}/>
          <Graph graph={this.state.graph} colors={this.state.colors} display={this.state.checked}
                 onSearch={this.createSearch} charge={this.state.charge}
                 className={classNames(classes.graph, !this.state.open && classes.graphOnDrawerClose)}
                 innerRef={this.graphRef}/>
          <Fab onClick={() => this.graphRef.current.zoomFit()} className={classNames(classes.fab, classes.fab2)}>
            <GpsFixedIcon/>
          </Fab>
          <Fab onClick={this.handleSettingsOpen} className={classes.fab}>
            <SettingsIcon/>
          </Fab>
          <Dialog
            open={this.state.alertOpen}
            onClose={this.handleAlertClose}
            maxWidth="sm"
          >
            <DialogTitle>Warning</DialogTitle>
            <DialogContent>
              <DialogContentText>{this.state.alertMessage}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleAlertClose} color="primary">
                OK
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={this.state.settingsOpen}
            TransitionComponent={Transition}
            keepMounted
            onClose={this.handleSettingsClose}
            maxWidth={"md"}
          >
            <DialogTitle>
              Settings
            </DialogTitle>
            <DialogContent className={classes.dialogContent}>
              {Object.keys(this.state.colors).map(color =>
                <React.Fragment key={color}>
                  <Typography className={classes.dialogLabel} variant="body1">Color
                    for <b>{capitalize(color)}</b></Typography>
                  <CirclePicker color={this.state.colors[color]} colors={colorPool} circleSize={28}
                                circleSpacing={14} width={(28 + 14) * colorNames.length}
                                onChange={(val) => this.handleColorChange(val, color)}/>
                </React.Fragment>)}
              <Typography className={classes.dialogLabel} variant="h6">Display</Typography>
              <FormGroup row>
                <React.Fragment>
                  {Object.keys(this.state.checked).map(type =>
                    <FormControlLabel key={type}
                                      control={<Switch checked={this.state.checked[type]}
                                                       onChange={() => this.handleCheckChange(type)}
                                      />}
                                      label={capitalize(type)}
                    />)}
                </React.Fragment>
                <FormControl className={classes.hopsControl}>
                  <Select
                    value={this.state.charge}
                    onChange={this.handleStateChange("charge")}
                  >
                    <MenuItem value={1}>Low Charge</MenuItem>
                    <MenuItem value={2}>Medium Charge</MenuItem>
                    <MenuItem value={4}>High Charge</MenuItem>
                  </Select>
                </FormControl>
                <FormControl className={classes.hopsControl}>
                  <Select
                    value={this.state.hops}
                    onChange={this.handleStateChange("hops")}
                  >
                    <MenuItem value={1}>1 Hop</MenuItem>
                    <MenuItem value={2}>2 Hops</MenuItem>
                    <MenuItem value={3}>3 Hops</MenuItem>
                  </Select>
                </FormControl>
              </FormGroup>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    );
  }
}

Index.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withRoot(withStyles(styles)(Index));
