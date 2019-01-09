import os

lst = []
for file in os.listdir("tlist"):
    with open("tlist/" + file) as f:
        lst.extend(list(map(lambda x: x.strip(), f.readlines())))

for word in sorted(list(set(lst))):
    print(word)