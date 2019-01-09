import React from "react";
import withStyles from "@material-ui/core/styles/withStyles";
import Typography from "@material-ui/core/Typography";
import classNames from 'classnames';
import {bboxCollide} from "d3-bboxCollide";

String.prototype.decapitalize = function () {
  return this.charAt(0).toLowerCase() + this.slice(1);
};

const stylesConstant = {
  label: {
    maxWidth: 100,
    lineHeight: 1.1
  }
};

const styles = theme => ({
  fullContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  hidden: {
    display: 'none'
  },
  movable: {},
  scalable: {
    transition: "all .2s ease-in-out",
    '&:hover': {
      transform: 'scale(1.2)'
    }
  }
});

const d3 = require("d3");

d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};

const drag = simulation => {
  const dragstarted = (d) => {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  };

  const dragged = (d) => {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  };

  const dragended = (d) => {
    if (!d3.event.active) simulation.alphaTarget(0);
    if (d.center) return;
    d.fx = null;
    d.fy = null;
  };

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
};

class Graph extends React.Component {

  componentDidMount = () => {
    this.svg = d3.select(this.svgRef.current);
    this.svgZoomer = this.svg.append("g");
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", this.zoomed);
    this.linkContainer = this.svgZoomer.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6);
    this.nodeContainer = this.svgZoomer.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.9)
      .style("font-family", "Roboto");
    this.svg.call(this.zoom);
    this.simulation = null;
    this.positionSet = {};
    this.previousGraph = null;
    this.previousConfig = null;
    this.doScale = () => {
    };
  };

  componentDidUpdate = () => {
    const {graph} = this.props;
    const boundingRect = this.svg.node().getBoundingClientRect();
    const config = JSON.stringify(this.props.colors) + JSON.stringify(this.props.display) +
      JSON.stringify({width: boundingRect.width, height: boundingRect.height}) +
      this.props.charge;

    if (graph !== this.previousGraph || config !== this.previousConfig) {
      this.previousGraph = graph;
      this.previousConfig = config;
      this.chart(graph, boundingRect.width, boundingRect.height);
    }
  };

  brightnessByHex = (hex) => {
    const m = hex.substr(1).match(hex.length === 7 ? /(\S{2})/g : /(\S{1})/g);
    if (m) {
      const r = parseInt(m[0], 16), g = parseInt(m[1], 16), b = parseInt(m[2], 16);
      return ((r * 299) + (g * 587) + (b * 114)) / 1000;
    }
    return 0;
  };

  scale = (group, reverse) => {
    const color = this.props.colors[group.decapitalize()];
    if (!reverse) return color;
    if (this.brightnessByHex(color) > 180) return "black";
    return "white";
  };

  buildText = (textNodes) => {
    textNodes.each(function () {
      const text = d3.select(this);
      text.selectAll("tspan").remove();
      let words = text.text().split(/\s+/).reverse();
      let word;
      let line = [];
      let lineNumber = 0;
      const lineHeight = stylesConstant.label.lineHeight;
      const dy = 0;
      let tspan = text.text(null)
        .append("tspan")
        .attr("x", 0)
        .attr("dy", dy + "em")
        .attr("alignment-baseline", "central");
      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(" "));
        if (line.length > 1 && tspan.node().getComputedTextLength() > stylesConstant.label.maxWidth) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan")
            .attr("x", 0)
            .attr("dy", ++lineNumber * lineHeight + dy + "em")
            .attr("alignment-baseline", "central")
            .text(word);
        }
      }
      text.selectAll("tspan").attr("y", -lineNumber * lineHeight / 2 + "em");
    });
  };

  handleClick = (d) => {
    this.props.onSearch("id: " + d.identity + " | group: " + d.group);
  };

  zoomed = () => {
    const currentTransform = d3.event.transform;
    this.svgZoomer.attr("transform", currentTransform);
  };

  zoomFit = () => {
    const bounds = this.svgZoomer.node().getBBox();
    const parent = this.svgZoomer.node().parentElement;
    const fullWidth = parent.clientWidth, fullHeight = parent.clientHeight;
    const width = bounds.width,
      height = bounds.height;
    const midX = bounds.x + width / 2,
      midY = bounds.y + height / 2;
    if (width === 0 || height === 0) return; // nothing to fit
    const scale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

    const transform = d3.zoomIdentity
      .translate(translate[0], translate[1])
      .scale(scale);

    this.svg
      .transition()
      .duration(500)
      .call(this.zoom.transform, transform);
  };

  chart = (data, width, height) => {
    const {classes, display} = this.props;

    const {links, nodes} = data;
    nodes.forEach((item) => {
      if (item.center) {
        item.fx = width / 2;
        item.fy = height / 2;
      }
    });

    const textLength = (current) => {
      const spacing = 15;
      const textNode = d3.select(current.parentNode).select("text");
      const spans = textNode.selectAll("tspan");
      if (spans.empty()) return textNode.node().getComputedTextLength() + spacing;
      let maximumLength = 0;
      spans.each(function () {
        maximumLength = Math.max(maximumLength, this.getComputedTextLength());
      });
      return maximumLength + spacing;
    };

    const textHeight = (current) => {
      const spacing = 0.3;
      const textNode = d3.select(current.parentNode).select("text");
      const spans = textNode.selectAll("tspan");
      if (!spans.empty())
        return (stylesConstant.label.lineHeight * spans.nodes().length + spacing);
      else return stylesConstant.label.lineHeight + spacing;
    };

    const hidden = (d) => !d.center && !display[d.group.decapitalize()];

    const abstract = (n) => n.length > 5 ? n.substr(0, 5) + "..." : n;

    /* bind link data */
    this.link = this.linkContainer
      .selectAll("line")
      .data(links, (d) => `link_${d.id}`);

    /* modify link elements */
    this.link.enter()
      .append("line")
      .attr("stroke-width", 3)
      .filter(d => d.type === "DERIVES")
      .attr("stroke", "#444")
      .attr("stroke-opacity", 0.9);
    this.link.exit().remove();
    this.link = this.linkContainer.selectAll("line");

    /* bind node data */
    this.node = this.nodeContainer
      .selectAll(`g.${classes.movable}`)
      .data(nodes, (d) => `node_${d.id}`);

    /* modify node elements */
    const movableCreated = this.node.enter().append("g").attr("class", classes.movable);  // immediate: movable
    const newCreatedNodes = movableCreated.append("g").attr("class", classes.scalable);  // indirect: scalable
    const exitNodes = this.node.exit();
    exitNodes.selectAll(`g.${classes.scalable}`)
      .transition(d3.transition().duration(200))
      .attr("transform", "scale(0.01)")
      .on("end", () => {
        exitNodes.remove();
      });

    newCreatedNodes.attr("transform", "scale(0.01)")
      .transition(d3.transition().duration(200))
      .attr("transform", "scale(1)");

    /* set node font (for all) */
    this.node = this.nodeContainer.selectAll(`g.${classes.movable}`);
    this.node.style("font-size", d => {
      let fontSize = 11;
      if (d.center) fontSize = d.name.length > 30 ? 30 : 40;
      else if (hidden(d)) fontSize = 13;
      else if (d.name.search(" ") === -1) fontSize = 20;
      else {
        const len = d.name.length;
        if (len <= 25) fontSize = 16;
        if (len <= 35) fontSize = 14;
        if (len <= 50) fontSize = 12;
      }
      return d.fontSize = fontSize;
    }).style("font-weight", d => {
      if (d.center) return 800;
      return 500;
    });

    /* bind event for new */
    const buildText = this.buildText.bind(this);
    newCreatedNodes.on("click", this.handleClick);
    movableCreated.on("mouseenter", function (d) {
      const selector = d3.select(this);
      selector.moveToFront();
      if (hidden(d)) {
        selector.select("text").text(d.name).call(buildText);
        selector.select("rect")
          .each(function (d) {
            d.width = textLength(this);
            d.height = textHeight(this) * d.fontSize;
          })
          .transition(d3.transition().duration(200))
          .attr("width", d => d.width)
          .attr("height", d => d.height)
          .attr("x", d => -d.width / 2)
          .attr("y", d => -d.height / 2);
      }
    });

    movableCreated.on("mouseleave", function (d) {
      if (hidden(d)) {
        const selector = d3.select(this);
        selector.select("text").text(abstract(d.name));
        selector.select("tspan").remove();
        selector.select("rect")
          .each(function (d) {
            d.width = textLength(this);
            d.height = textHeight(this) * d.fontSize;
          })
          .transition(d3.transition().duration(200))
          .attr("width", d => d.width)
          .attr("height", d => d.height)
          .attr("x", d => -d.width / 2)
          .attr("y", d => -d.height / 2);
      }
    });

    /* external event */
    this.doScale = (id, enter = true) => {
      this.node.filter(d => d.id === id)
        .moveToFront()
        .select(`g.${classes.scalable}`)
        .transition(d3.transition().duration(50))
        .attr("transform", enter ? "scale(1.5)" : "scale(1)");
    };
    this.doScale = this.doScale.bind(this);

    /* create rect and text for new */
    newCreatedNodes.append("rect");

    newCreatedNodes.append("text")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "central")
      .style("stroke-width", 0)
      .style("fill", d => this.scale(d.group, true));

    /* clear previous external event */
    this.node.selectAll(`g.${classes.scalable}`).attr("transform", "");

    /* propagate font size */
    this.node.selectAll("text")
      .style("font-size", function () {
        const data = d3.select(this.parentNode.parentNode).datum();
        d3.select(this).datum(data);
        return data.fontSize;
      })
      .text(d => hidden(d) ? abstract(d.name) : d.name)
      .filter((d) => !hidden(d))
      .call(this.buildText); /* build word wrap */

    /* adjust rect size for all */
    this.node.selectAll("rect")
      .each(function () {
        let d = d3.select(this.parentNode.parentNode).datum(); // two level propagate
        d.width = textLength(this);
        d.height = textHeight(this) * d.fontSize;
        d3.select(this).datum(d);
      })
      .attr("fill", d => this.scale(d.group))
      .attr("width", d => d.width)
      .attr("height", d => d.height)
      .attr("x", d => -d.width / 2)
      .attr("y", d => -d.height / 2)
      .attr("rx", 3)
      .attr("ry", 3);

    if (!this.simulation) {
      this.simulation = d3.forceSimulation(nodes)
        .on("tick", () => {
          this.link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

          this.node
            .attr("transform", d => {
              this.positionSet[d.id] = {x: d.x, y: d.y};
              return `translate(${d.x}, ${d.y})`;
            });
        });
    }

    /* bind drag event */
    movableCreated.style("cursor", "pointer")
      .call(drag(this.simulation));

    let spacing = 3;
    if (nodes.length < 10) spacing = 15;
    else if (nodes.length < 25) spacing = 8;
    spacing *= this.props.charge;

    this.simulation.nodes(nodes);
    this.simulation.force("link", d3.forceLink(links).id(d => d.id));
    this.simulation.force("x", d3.forceX(width / 2).strength(0.5));
    this.simulation.force("y", d3.forceY(height / 2));
    this.simulation.force("collide", bboxCollide(d => [[-d.width / 2 - spacing, -d.height / 2 - spacing],
      [d.width / 2 + spacing, d.height / 2 + spacing]]).strength(0.1));
    this.simulation.alpha(1).restart();
  };

  svgRef = React.createRef();

  render = () => {
    return <svg ref={this.svgRef}
                className={this.props.className}
    />
  }
}

export default withStyles(styles)(Graph)