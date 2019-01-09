import requests
import json
import traceback
from random import randint
from bs4 import BeautifulSoup
from collections import deque

headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en,zh-CN;q=0.9,zh;q=0.8",
    "Connection": "keep-alive",
    "Cookie": "search_mode=dictionary; _ga=GA1.3.2111844046.1546412911; local=CN; __qca=P0-1604591118-1546412910972; pl_did=5bd170df-9f40-433e-9e62-477dcd591213; pl_p=; dictionary=american; folding=unfolded; _gid=GA1.3.521431459.1546828224",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36"
}

starter = "https://www.macmillandictionary.com/dictionary/american/%s"
phrases = set()
thesaurus = set()
visited = set()

def process(item):
    ret = ""
    for c in item.contents:
        if isinstance(c, str):
            ret += c
        else:
            if 'DEFINITION-before' in c.get("class"):
                continue
            try:
                if c.name == "span" and len(c.contents) == 1 and c.contents[0].name == "a":
                    c = c.contents[0]
                link = c["href"]
                content = c.string
                if content.strip():
                    ret += "[%s]{%s}" % (link.split("/")[-1], content)
            except:
                ret += c.getText()

    return ret.strip()

def visit(url, visit_type="word", boundary=False):
    response = requests.get(url, headers=headers)
    name = response.url.split("/")[-1]
    if name in visited:
        return False
    
    visited.add(name)
    soup = BeautifulSoup(response.text, "lxml")
    try:
        headword = soup.find(id="headword")
        word = headword.find(class_="BASE-FORM").find(class_="BASE").getText()
        nxt = False
        if visit_type == "word":
            if headword.find(class_="redword") is not None:
                nxt = True
            part = soup.find(id="headbar").find(class_="PART-OF-SPEECH").getText().strip()
    except:
        return False
    
    senses = []

    sense_body = soup.find("ol", class_="senses")
    if sense_body is not None:
        for item in sense_body.findAll(class_="SENSE"):
            id = item["id"]
            if item.find(class_="MULTIWORD") is not None:
                continue
            definition_group = item.find(class_="DEFINITION")
            if definition_group is None:
                continue
            definition = process(definition_group)
            example_groups = item.findAll(class_="EXAMPLES")
            examples = []
            if example_groups is not None:
                for example_group in example_groups:
                    for example_item in example_group.findAll("p", class_="EXAMPLE"):
                        examples.append(process(example_item))
            senses.append({"id": id, "def": definition, "examples": examples})

    if not senses:
        return False

    if nxt:
        for div in soup.find_all(class_="THES"):
            the_name = div.find("a", class_="moreButton")["href"].split("/")[-1]
            thesaurus.add(the_name)

        phrases_container = soup.find(id="phrases_container")
        if phrases_container is not None:
            phrases_container = phrases_container.find("ul")
            if phrases_container is not None:
                for t in phrases_container.find_all("a"):
                    phrases.add(t["href"].split("/")[-1])
        phrasal_verbs_container = soup.find(id="phrasal_verbs_container")
        if phrasal_verbs_container is not None:
            phrasal_verbs_container = phrasal_verbs_container.find("ul")
            if phrasal_verbs_container is not None:
                for t in phrasal_verbs_container.find_all("a"):
                    phrases.add(t["href"].split("/")[-1])

    if visit_type == "word":
        ret = {"word": word, "part": part, "senses": senses}
        if boundary:
            ret["boundary"] = True
        print(name)
        with open("words/%s" % name, "w") as f:
            f.write(json.dumps(ret, indent=2, sort_keys=True))
    else:
        ret = {"phrase": word, "part": "phrase", "senses": senses}
        print(name)
        with open("phrases/%s" % name, "w") as f:
            f.write(json.dumps(ret, indent=2, sort_keys=True))
    return True


def go(word):
    url = starter % word
    i = 1
    while True:
        if not visit(url + "_" + str(i)):
            break
        i += 1


def go_phrase(word):
    visit(starter % word, visit_type="phrase")

# oxford 3000

# go("old")

# with open("oxford3000", "r", encoding="utf8") as f:
# with open("awl10", "r", encoding="utf8") as f:
#     wordlist = list(map(lambda x: x.strip(), f.read().split()))
#     for idx, word in enumerate(wordlist):
#         if "." in word:
#             continue
#         if " " in word:
#             phrases.add(word.replace(" ", "-"))
#         else:
#             go(word)
#             if idx % 10 == 0:
#                 print(idx)

# print(phrases)
# print(thesaurus)

# with open("phraselist", "w", encoding="utf8") as f:
#     for word in phrases:
#         print(word, file=f)

# for idx, phrase in enumerate(phrases):
#     go_phrase(phrase)
#     if idx % 10 == 0:
#         print(idx)

# with open("thesauruslist", "w", encoding="utf8") as f:
#     for word in thesaurus:
#         print(word, file=f)

with open("wordlist", encoding="utf8") as f:
    wordlist = sorted(list(map(lambda x: x.strip(), f.readlines())))
    for word in wordlist:
        visit(starter % word, visit_type="word", boundary=True)
