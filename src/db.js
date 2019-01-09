import client from "axios";

const auth = {
  username: "neo4j",
  password: "971021"
};

const endpoint = "http://localhost:7474/db/data/transaction/commit";

const d3graphFromQueryResult = (res) => {
  let idSet = new Set(), edgeSet = new Set();
  let nodes = [], links = [];
  res.results[0].data.forEach((row) => {
    row.graph.nodes.forEach((n) => {
      if (!idSet.has(n.id)) {
        let rest = n.properties;
        if (rest.hasOwnProperty("entries")) {
          rest.entries = JSON.parse(rest.entries);
        }
        if (rest.hasOwnProperty("senses")) {
          rest.senses = JSON.parse(rest.senses);
        }
        nodes.push({id: n.id, group: n.labels[0], ...rest});
        idSet.add(n.id);
      }
    });
    row.graph.relationships.forEach((r) => {
      if (!edgeSet.has(r.id)) {
        links.push({source: r.startNode, target: r.endNode, type: r.type, id: r.id});
        edgeSet.add(r.id);
      }
    });
  });
  return {nodes: nodes, links: links};
};

const getBestEntry = (nodes, links, queryParams) => {
  const assessValue = (type) => {
    if (type === "AbstractWord") return 3;
    if (type === "Word") return 2;
    return 1;
  };
  let bestEntry, bestValue = 0;
  nodes.forEach((val) => {
    let matching = true;
    Object.keys(queryParams).forEach((key) => {
      if (val.hasOwnProperty(key) && val[key] !== queryParams[key])
        matching = false;
    });
    if (matching) {
      if (assessValue(val.group) > bestValue) {
        bestEntry = val;
        bestValue = assessValue(val.group);
      }
    }
  });
  if (bestEntry) {
    let nodesMap = {};
    nodes.forEach((node) => {
      nodesMap[node.id] = node;
    });
    if (bestEntry.group === "AbstractWord") {
      bestEntry.related = [];
      links.forEach((edge) => {
        if (edge.source === bestEntry.id) {
          if (nodesMap.hasOwnProperty(edge.target) && nodesMap[edge.target].group === "Word") {
            bestEntry.related.push(nodesMap[edge.target]);
          }
        }
      });
    } else if (bestEntry.group === "Word" || bestEntry.group === "Phrase") {
      bestEntry.related = [];
      links.forEach((edge) => {
        if (edge.source === bestEntry.id) {
          const target = {...nodesMap[edge.target]};
          target.type = edge.type;
          bestEntry.related.push(target);
        } else if (edge.target === bestEntry.id && nodesMap[edge.source].group === "Thesaurus") {
          const thesaurus = {...nodesMap[edge.source]};
          thesaurus.entries.forEach((entry) => {
            const [relatedItem, relatedSense] = entry.id.split("#");
            if (relatedItem === bestEntry.identity) {
              bestEntry.senses.forEach((sense) => {
                if (sense.id === relatedSense) {
                  sense.thesaurus = thesaurus;
                }
              });
            }
          });
        }
      });
    }
  }
  return bestEntry;
};

class Database {
  asMatcher = (queryParams, name = "a") => {
    let matcher = "", group = "";
    if (queryParams.hasOwnProperty("group")) {
      matcher = name + ":" + queryParams.group;
      group = queryParams.group;
      delete queryParams.group;
    }
    matcher += "{" + Object.keys(queryParams).map(key => `${key}: "${queryParams[key]}"`).join(",") + "}";
    if (group) queryParams.group = group;
    return matcher;
  };

  defaultQuery = (queryParams, hops) => {
    const statement = `match (${this.asMatcher(queryParams)})-[rel*0..${hops}]-(word) return distinct word, rel`;
    return client.post(endpoint, {
      "statements": [{
        "statement": statement,
        "resultDataContents": ["graph"]
      }]
    }, {
      method: "POST",
      auth: auth
    }).then(response => {
      let d3result = d3graphFromQueryResult(response.data);
      const limit = 300;
      if (d3result.nodes.length > limit) {
        return {errorMessage: `The number of nodes found has exceeded the limit (${limit}). Try to reduce the hop limit and search again.`};
      }
      const bestEntry = getBestEntry(d3result.nodes, d3result.links, queryParams);
      if (bestEntry) {
        bestEntry.center = true;
        d3result.entry = bestEntry;
      }
      return d3result;
    }).catch(error => {
      console.error(error);
      return {};
    })
  };

  pathQuery = (queryParams1, queryParams2) => {
    const statement = `match p = shortestPath((${this.asMatcher(queryParams1)})-[*..100]-(${this.asMatcher(queryParams2, "b")})) return p`;
    console.log(statement);
    return client.post(endpoint, {
      "statements": [{
        "statement": statement,
        "resultDataContents": ["graph"]
      }]
    }, {
      method: "POST",
      auth: auth
    }).then(response => {
      let d3result = d3graphFromQueryResult(response.data);
      const bestEntry = getBestEntry(d3result.nodes, d3result.links, queryParams1);
      if (bestEntry)
        d3result.entry = bestEntry;
      return d3result;
    }).catch(error => {
      console.error(error);
      return {};
    });
  }
}

export default Database;