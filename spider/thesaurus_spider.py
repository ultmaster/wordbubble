import requests
import json
from random import randint
from bs4 import BeautifulSoup
from collections import deque

headers = {
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en,zh-CN;q=0.9,zh;q=0.8",
    "Connection": "keep-alive",
    "Cookie": "search_mode=dictionary; _ga=GA1.3.2111844046.1546412911; _gid=GA1.3.399757652.1546412911; local=CN; __qca=P0-1604591118-1546412910972; pl_did=5bd170df-9f40-433e-9e62-477dcd591213; pl_p=; dictionary=american; folding=unfolded",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36"
}

starter = "https://www.macmillandictionary.com/thesaurus-category/american/%s"


def process(item):
    ret = ""
    for c in item.contents:
        if isinstance(c, str):
            ret += c
        else:
            if 'DEFINITION-before' in c.get("class"):
                continue
            if "part-of-speech" in c.get("class"):
                continue
            try:
                link = c["href"]
                content = c.string
                if content.strip():
                    ret += "[%s]{%s}" % (link.split("/")[-1], content)
            except:
                ret += c.getText()

    return ret.strip()


def visit(url):
    response = requests.get(url, headers=headers)
    name = response.url.split("/")[-1]

    soup = BeautifulSoup(response.text, "lxml")
    try:
        title_container = soup.find("h1", class_="cattitle")
        thesaurus = title_container.contents[0]
        assert isinstance(thesaurus, str)
    except:
        return False
    
    typeName = None
    entries = []
    content_container = soup.find(id="leftContent")
    for idx, child in enumerate(content_container.contents):
        # print(child)
        if idx == 0:
            if child.name != "h2":
                return False
            typeName = child.getText()
        else:
            try:
                if isinstance(child, str):
                    continue
                if child["class"] != ["entry", "top"]:
                    break
                a_container = child.contents[0]
                id = a_container["href"].split("/")[-1]
                entry = a_container.getText()
                comment = process(child.find("p"))
                # print(id, entry, comment)
                if not comment:
                    continue
                if not id or not entry:
                    break
                entries.append({"id": id, "entry": entry, "comment": comment})
            except:
                break
            
    if typeName is None or len(entries) <= 2:
        return False

    ret = {"thesaurus": thesaurus, "type": typeName, "entries": entries}
    print(name)
    with open("thesaurus/%s" % name, "w") as f:
        f.write(json.dumps(ret, indent=2, sort_keys=True))
    return True


with open("thesauruslist", "r") as f:
    wordlist = list(map(lambda x: x.strip(), f.readlines()))
    for idx, word in enumerate(wordlist):
        visit(starter % word)
        if idx % 10 == 0:
            print(idx)
