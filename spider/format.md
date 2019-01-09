# Words

All words must be with stars.

BFS based on oxford word list, with words in example sentences. Words in example sentences are terminals and won't be expanded.

* Filename: `add_1`
* Format:
    * word: `add`
    * part: `verb` (lower)
    * senses: list
        * id: `add_1__1`
        * def: `to put something with another thing or group of things`
        * examples: list(str)
            * `They’ve added two [major_1]{major} [company]{companies} to their impressive list of clients.`

Word spider will collect names of phrases and thesaurus for the next step.

# Phrases

All the phrases must use existing words.

* Format:
    * phrase: `add in`
    * senses: same

# Thesaurus

All the thesaurus must use existing words and phrases and senses.

* Format:
    * thesaurus: `To put things together or in a particular order`
    * type: `Related words`
    * entries: list
        * id: `pretend#pretend__1`
        * entry: `pretend`
        * comment: `a set of...`
