import React from "react";
import Typography from "@material-ui/core/es/Typography/Typography";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/es/ListItemText/ListItemText";
import withStyles from "@material-ui/core/styles/withStyles";
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import IconButton from "@material-ui/core/IconButton";
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import ListItemIcon from "@material-ui/core/ListItemIcon";
import LaunchIcon from '@material-ui/icons/Launch';


const styles = (theme) => ({
  listItems: {
    display: "list-item",
    marginLeft: -theme.spacing.unit * 2,
    marginRight: -theme.spacing.unit * 2,
    width: 'auto'
  },
  title: {
    paddingTop: theme.spacing.unit * 3,
    paddingBottom: theme.spacing.unit * 2
  },
  link: {
    color: theme.palette.secondary.main,
    textDecoration: 'none',
    cursor: 'pointer'
  },
  listSentences: {
    paddingBottom: 0
  },
  listItemsLink: {
    marginLeft: -theme.spacing.unit * 2,
    marginRight: -theme.spacing.unit * 2,
    width: 'auto'
  }
});

class Entry extends React.Component {

  renderSentence = (sentence, abstract = false) => {
    let tokens = [];
    const TEXT = 0, LINK_PROCESSING = 1, LINK_COMPLETE = 2,
      DISPLAY_TEXT_PROCESSING = 3;
    let link = '', text = '', status = TEXT;
    for (let i = 0; i < sentence.length; ++i) {
      const ch = sentence[i];
      if (status === TEXT) {
        if (ch === '[') {
          tokens.push(text);
          link = text = '';
          status = LINK_PROCESSING;
        } else {
          text += ch;
        }
      } else if (status === LINK_PROCESSING) {
        if (ch === ']') {
          status = LINK_COMPLETE;
        } else {
          link += ch;
        }
      } else if (status === LINK_COMPLETE) {
        if (ch === '{') {
          status = DISPLAY_TEXT_PROCESSING;
        } else {
          console.error("error: expected {");
        }
      } else if (status === DISPLAY_TEXT_PROCESSING) {
        if (ch === '}') {
          if (abstract) tokens.push(text);
          else {
            if (link.search("#") !== -1) link = link.split("#")[0];
            tokens.push(<span data-entry={link} className={this.props.classes.link}
                              onClick={this.handleEntryClick}>{text}</span>);
          }
          link = text = '';
          status = TEXT;
        } else {
          text += ch;
        }
      }
    }

    if (status !== TEXT) {
      console.error("error: parse failed");
      return sentence;
    } else {
      if (text) {
        tokens.push(text);
      }
      if (abstract) return tokens.join("");
      else return <React.Fragment>
        {tokens.map((token, i) => <React.Fragment key={i}>{token}</React.Fragment>)}
      </React.Fragment>
    }
  };

  renderThesaurusAbstract = (thesaurus) => {
    const words = thesaurus.entries.map((entry) => entry.entry);
    let lst = [];
    words.forEach((word) => {
      if (lst.length < 5 && (lst.length === 0 || lst[lst.length - 1] !== word))
        lst.push(word);
    });
    return lst.join(", ") + "...";
  };

  handleEntryClick = (event) => {
    this.props.onSearch("id: " + event.target.getAttribute("data-entry"));
  };

  handleAbstractClick = (identity, group = null) => {
    if (!group) this.props.onSearch(`id: ${identity}`);
    else this.props.onSearch(`id: ${identity} | group: ${group}`);
  };

  handleAbstractHover = (id, enter = true) => {
    this.props.handleHover(id, enter);
  };

  render = () => {
    const {entry, className, classes} = this.props;
    if (!entry) return <React.Fragment/>;
    let content = <React.Fragment/>;
    if (entry.group === "Word" || entry.group === "Phrase") {
      const part = entry.part ? <Typography variant="h6" color="textSecondary">{entry.part}</Typography> : "";
      const relatedItems = entry.related ? <List>
        {entry.related.map((related) => (
          <ListItem button key={`${entry.id}_${related.id}`} className={classes.listItemsLink}
                    onClick={() => this.handleAbstractClick(related.identity, related.group)}
                    onMouseEnter={() => this.handleAbstractHover(related.id, true)}
                    onMouseLeave={() => this.handleAbstractHover(related.id, false)}>
            <ListItemIcon>
              <LaunchIcon/>
            </ListItemIcon>
            <ListItemText primary={related.name}/>
          </ListItem>
        ))}
      </List> : "";
      content = <React.Fragment>
        {part}
        {relatedItems}
        <List>
          {entry.senses.map((n, i) => {
            const thesaurus = n.thesaurus ? <ListItem button className={classes.listItemsLink}
                                                      onClick={() => this.handleAbstractClick(n.thesaurus.identity, n.thesaurus.group)}
                                                      onMouseEnter={() => this.handleAbstractHover(n.thesaurus.id, true)}
                                                      onMouseLeave={() => this.handleAbstractHover(n.thesaurus.id, false)}>
              <ListItemIcon>
                <ArrowForwardIcon/>
              </ListItemIcon>
              <ListItemText primary={`${n.thesaurus.type}: ${n.thesaurus.name}`}
                            secondary={this.renderThesaurusAbstract(n.thesaurus)}/>
            </ListItem> : "";

            return <React.Fragment key={n.id}>
              <ListItem className={classes.listItems}>
                <Typography>
                  {i + 1}. {this.renderSentence(n.def)}
                </Typography>
                <List component="div" disablePadding dense>
                  {n.examples.map((v, i) => (
                    <ListItem key={`${n.id}_${i}`} component="div" className={classes.listSentences}>
                      <ListItemText primary={this.renderSentence(v)}/>
                    </ListItem>
                  ))}
                </List>
              </ListItem>
              {thesaurus}
            </React.Fragment>
          })}
        </List>
      </React.Fragment>
    } else if (entry.group === "AbstractWord") {
      content = <List>
        {entry.related.map(n => <ListItem button key={n.id} className={classes.listItemsLink}
                                          onClick={() => this.handleAbstractClick(n.identity, n.group)}
                                          onMouseEnter={() => this.handleAbstractHover(n.id, true)}
                                          onMouseLeave={() => this.handleAbstractHover(n.id, false)}>
          <ListItemIcon>
            <ArrowForwardIcon/>
          </ListItemIcon>
          <ListItemText primary={n.part ? `${n.name} (${n.part})` : n.name}
                        secondary={this.renderSentence(n.senses[0].def, true)}/>
        </ListItem>)}
      </List>
    } else if (entry.group === "Thesaurus") {
      content = <React.Fragment>
        <Typography variant="h5">{entry.type}</Typography>
        <List>
          {entry.entries.map(n => <ListItem button key={n.id} className={classes.listItemsLink}
                                            onClick={() => this.handleAbstractClick(n.id.split("#")[0])}>
            <ListItemIcon>
              <ArrowForwardIcon/>
            </ListItemIcon>
            <ListItemText primary={n.entry}
                          secondary={this.renderSentence(n.comment)}/>
          </ListItem>)}
        </List>
      </React.Fragment>;
    }
    return <div className={className}>
      <Typography variant={entry.name.length <= 20 ? "h3" : "h4"} className={classes.title}>
        {entry.name}
      </Typography>
      {content}
    </div>
  };
}

export default withStyles(styles)(Entry);