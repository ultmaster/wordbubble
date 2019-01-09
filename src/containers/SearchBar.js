import React from "react";
import InputBase from "@material-ui/core/InputBase";
import withStyles from "@material-ui/core/styles/withStyles";
import SearchIcon from '@material-ui/icons/Search';
import PropTypes from "prop-types";

const styles = (theme) => ({
  searchIcon: {
    width: theme.spacing.unit * 9,
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    fontSize: theme.typography.fontSize * 1.5,
    marginLeft: 0,
    width: '100%',
  },
  inputRoot: {
    color: 'inherit',
    width: '100%',
  },
  inputInput: {
    paddingLeft: theme.spacing.unit * 10,
    width: '100%',
    fontSize: theme.typography.fontSize * 1.5
  }
});

export const INITIAL_KEYWORD = "old";

class SearchBar extends React.Component {

  constructor(props) {
    super(props);
    this.passiveUpdate = this.passiveUpdate.bind(this);
  }

  state = {
    value: INITIAL_KEYWORD
  };

  handleChange = (event) => {
    this.setState({value: event.target.value});
  };

  handleOK = (event) => {
    if (event.keyCode === 13) {
      this.props.onSearch(this.state.value);
    }
  };

  passiveUpdate = (value) => {
    this.setState({value: value});
  };

  render = () => {
    const {classes} = this.props;

    return <div className={classes.search}>
      <div className={classes.searchIcon}>
        <SearchIcon/>
      </div>
      <InputBase
        placeholder="Search…"
        classes={{
          root: classes.inputRoot,
          input: classes.inputInput,
        }}
        value={this.state.value}
        onChange={this.handleChange.bind(this)}
        onKeyDown={this.handleOK.bind(this)}
      />
    </div>;
  }
}

SearchBar.propTypes = {
  onSearch: PropTypes.func,
  classes: PropTypes.object.isRequired,
  value: PropTypes.string
};

export default withStyles(styles)(SearchBar);