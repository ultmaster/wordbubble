from py2neo import Graph, NodeMatcher
import py2neo
import json
import os
import progressbar

def uglify(word):
    return word.replace("-", "_")

graph = Graph("bolt://127.0.0.1:7687", auth=("neo4j", "971021"))

graph.run("match (n) detach delete n")
abstract_word_set = set()
identity_map = dict()


def get_identity_map():
    graph_matcher = NodeMatcher(graph)
    ret = dict()
    for label in ["Word", "AbstractWord", "Phrase"]:
        for node in graph_matcher.match(label):
            ret[node["identity"]] = node
    print("Current identity map size:", len(ret))
    return ret


with open("stopword") as stopword_file:
    stopword_set = set(stopword_file.read().strip().split())


with graph.begin() as tx:
    print("Creating words...")
    files = sorted(os.listdir("words"))
    with progressbar.ProgressBar(max_value=len(files)) as bar:
        for idx, file in enumerate(files):
            bar.update(idx)
            with open("words/" + file) as f:
                data = json.loads(f.read())
            node = py2neo.data.Node("Word", identity=file, name=data["word"], senses=json.dumps(data["senses"]))
            if data.get("part"):
                node["part"] = data["part"]
            if file != data["word"]:
                abstract_word_set.add(data["word"])
            tx.create(node)
identity_map = get_identity_map()

with graph.begin() as tx:
    graph_matcher = NodeMatcher(graph)
    print("Gathering abstract words...")
    with progressbar.ProgressBar(max_value=len(abstract_word_set)) as bar:
        for idx, word in enumerate(abstract_word_set):
            bar.update(idx)
            node_list = list(graph_matcher.match(name__exact=word))
            node = py2neo.data.Node("AbstractWord", identity=word, name=word)
            tx.create(node)
            for v in node_list:
                tx.create(py2neo.data.Relationship(node, "MIGHT_BE", v))
identity_map = get_identity_map()

with graph.begin() as tx:
    with open("awl10") as f:
        lst = list(map(lambda line: line.strip().split(), f.readlines()))
        with progressbar.ProgressBar(max_value=len(lst)) as bar:
            for idx, rel in enumerate(lst):
                bar.update(idx)
                root = rel[0]
                if root not in identity_map:
                    continue
                for child in rel[1:]:
                    if child not in identity_map:
                        continue
                    tx.create(py2neo.data.Relationship(identity_map[root], "DERIVES", identity_map[child]))

with graph.begin() as tx:
    print("Creating phrases...")
    files = sorted(os.listdir("phrases"))
    with progressbar.ProgressBar(max_value=len(files)) as bar:
        for idx, file in enumerate(files):
            bar.update(idx)
            if "-" not in file:
                continue
            with open("phrases/" + file) as f:
                data = json.loads(f.read())
            phrase = py2neo.data.Node("Phrase", identity=file, name=data["phrase"], senses=json.dumps(data["senses"]))
            tx.create(phrase)
            for word in set(filter(lambda x: x not in stopword_set, data["phrase"].split())):
                # print(file, word)
                if word in identity_map:
                    tx.create(py2neo.data.Relationship(phrase, "CONTAINS", identity_map[word]))
identity_map = get_identity_map()

with graph.begin() as tx:
    graph_matcher = NodeMatcher(graph)
    print("Creating thesaurus...")
    files = sorted(os.listdir("thesaurus"))
    with progressbar.ProgressBar(max_value=len(files)) as bar:
        for idx, file in enumerate(files):
            bar.update(idx)
            with open("thesaurus/" + file) as f:
                data = json.loads(f.read())
            thesaurus = py2neo.data.Node("Thesaurus", identity=file, name=data["thesaurus"], type=data["type"], entries=json.dumps(data["entries"]))
            tx.create(thesaurus)
            for word in set(map(lambda x: x["id"].split("#")[0], data["entries"])):
                if word in identity_map:
                    tx.create(py2neo.data.Relationship(thesaurus, "HAS", identity_map[word]))
identity_map = get_identity_map()
