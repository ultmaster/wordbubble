import json
import re
import os
import progressbar

wordset = set()

def process(sent):
    global wordset
    for match in re.findall(r"\[(.*?)\]", sent):
        if "#" in match:
            wordset.add(match.split("#")[0])
        else:
            wordset.add(match)

def walk(d):
    if isinstance(d, str):
        process(d)
    elif isinstance(d, list):
        for k in d:
            walk(k)
    elif isinstance(d, dict):
        for v in d.values():
            walk(v)


# for dirname in ["words", "phrases", "thesaurus"]:
#     files = list(os.listdir(dirname))
#     with progressbar.ProgressBar(max_value=len(files)) as bar:
#         for idx, file in enumerate(files):
#             bar.update(idx)
#             with open(dirname + "/" + file) as f:
#                 data = json.loads(f.read())
#                 walk(data)


for file in os.listdir("thesaurus"):
    with open("thesaurus/" + file) as f:
        data = json.loads(f.read())
        ids = list(map(lambda x: x["id"], data["entries"]))
        for id in ids:
            wordset.add(id.split("#")[0])


for file in os.listdir("words"):
    if file in wordset:
        wordset.remove(file)

with open("wordlist", "w") as f:
    for word in wordset:
        print(word, file=f)
# print(len(wordset))