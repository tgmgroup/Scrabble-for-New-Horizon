# Dictionaries for English Learning

There are four main dictionaries here:

- Common English Words: A big list of almost 6,000 commonly used words, combining most of the other dictionaries here.
- New General Service List: A list of words containing about 93% of words found in books, texts, and life.
- New Horizon: A list of about 1,800 words used in the _New Horizons_ Japanese English textbooks
- New Horizon Plus: A list combining _New Horizon_ and _NGSL_

Find the repository for these dictionaries here: [Word List from New Horizons](https://github.com/tgmgroup/Word-List-from-New-Horizons/)

The original CSW2021 dictionary is also here, containing almost 28,000 words, many of them specialized and difficult for English learners.

## Dictionaries for English Learning

If you edit the dictionaries, run the dictionary compressor later using:

node node_modules/@cdot/dictionary/bin/compress.js ./dictionaries/Common-English-Words.txt ./dictionaries/Common-English-Words.dict
node node_modules/@cdot/dictionary/bin/compress.js ./dictionaries/New-Horizon.txt ./dictionaries/New-Horizon.dict
node node_modules/@cdot/dictionary/bin/compress.js ./dictionaries/New-Horizon-Plus.txt ./dictionaries/New-Horizon-Plus.dict
node node_modules/@cdot/dictionary/bin/compress.js ./dictionaries/New-General-Service-List.txt ./dictionaries/New-General-Service-List.dict
node node_modules/@cdot/dictionary/bin/compress.js ./dictionaries/CSW2021_English.txt ./dictionaries/CSW2021_English.dict

Replace the dictionary names as needed.
