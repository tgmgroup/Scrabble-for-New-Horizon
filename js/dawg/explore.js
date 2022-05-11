/*Copyright (C) 2019-2022 The Xanado Project https://github.com/cdot/Xanado
License MIT. See README.md at the root of this distribution for full copyright
and license information*/
/* eslint-env node */

/**
 * Command-line program to explore the words encoded in a DAWG
 * generated by {@link module:js/dawg/compressor}
 * 
 * `node js/dawg/explore.js` will tell you how to use it
 * @module
 */
const requirejs = require("requirejs");

requirejs.config({
	baseUrl: `${__dirname}/../..`,
	paths: {
		dawg: "js/dawg",
		game: "js/game",
		platform: "js/server/ServerPlatform"
	}
});

const DESCRIPTION = "USAGE\n  node explore.js [options] <dictionary> <words>\n"
	  + "Explore a DAWG dictionary.";

requirejs(["node-getopt", "platform", "dawg/Dictionary"], (Getopt, Platform, Dictionary) => {

	const biglist = {};
	
	function eachRoot(opt, root, dict) {
		if (opt.options.list) {
			if (root.node.child) {
				let list = [];
				console.log(`-- ${root.word} --`);
				biglist[root.word] = true;
				root.node.child.eachWord(root.word, w => list.push(w));
				
				list = list.filter(w => !biglist[w]);
				list.forEach(w => biglist[w] = true);
				
				console.log(list.join("\n"));
			}
		} else if (root.node && root.node.isEndOfWord)
			console.log(`"${root.word}" was found`,
						root.node.child ? "& is a root" : "");
		else if (root.node && root.node.child)
			console.log(`"${root.word}" is a root`);
		else
			console.log(`"${root.word}" NOT FOUND`);
	}
	
	function checkSequence(word, dict) {
		if (dict.hasSequence(word))
			console.log(`"${word}" is a valid sequence`);
		else
			console.log(`"${word}" is NOT a valid sequence`);
	}
	
	function withDictionary(opt, words) {
		console.log(`Loading dictionary from ${opt.dawgfile}`);
		Dictionary.load(opt.dawgfile)
		.then(dict => {
			if (opt.options.sequence)
				for (let w of words)
					checkSequence(w, dict);
			else if (typeof opt.options.anagrams !== "undefined") {
				if (words.length === 0)
					throw "Need letters to find anagrams of";

				for (let w of words) {
					const word = w.toUpperCase();
					let anag = Object.keys(dict.findAnagrams(word));
					if (opt.options.anagrams > 0)
						anag = anag.filter(word => word.length >= opt.options.anagrams);
					console.log(`\n${anag.length} words found in "${word}":`);
					console.log(anag.join(", "));
				}
			}
			else {
				const roots = [];

				if (words.length === 0) {
					// Dump of entire dawg
					let letter = dict.root.child;
					while (letter) {
						roots.push({ word: letter.letter, node: dict.root });
						letter = letter.next;
					}
				} else {
					for (let w of words) {
						const word = w.toUpperCase();
						const node = dict.match(word);
						if (node)
							roots.push({ word: word, node: node });
					}
					roots.sort((a, b) => {
						return a.word.length > b.word.length ? -1 :
						a.word.length === b.word.length ? 0 : 1;
					});
				}

				for (let root of roots)
					eachRoot(opt, root, dict);
			}
		});
	}

	const opt = Getopt.create([
        ["", "help", "Show this help"],
		["", "list", "Without parameters, dump a complete list of the words in the DAWG. With parameters, dump all words that have the parameters word(s) as their root"],
		["", "file=ARG", "Check all words read from file"],
		["", "anagrams[=ARG]", "Find anagrams of the words. Optionally require sub-anagrams to be a minimum length."],
		["", "sequence", "Determine if the strings passed are valid sub-sequences of any word in the dictionary e.g. 'UZZL' is a valid sub-sequence in an English dictionary as it is found in 'PUZZLE', but 'UZZZL' isn't"]
	])
        .bindHelp()
        .setHelp(`${DESCRIPTION}\nOPTIONS\n[[OPTIONS]]`)
		.parseSystem();

    if (opt.argv.length == 0) {
        opt.showHelp();
        throw "No DAWG filename given";
    } else {
		opt.dawgfile = opt.argv.shift();
	}

	if (opt.options.file) {
		Platform.getResource(opt.options.file)
		.then(data => {
			const words = data.toString().split(/\s+/);
			console.log(`Checking ${words.length} words`);
			withDictionary(opt, words);
		});
		
	}
	else
		withDictionary(opt, opt.argv);
	
});
