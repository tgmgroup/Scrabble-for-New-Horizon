if (typeof exports == 'object') {
    _ = require('underscore');
}

/*
  Coding Exercise: multiplayer online Scrabble(tm) clone written in
  modern HTML, CSS, and JavaScript

  IMPORTANT COPYRIGHT NOTICE:

  SCRABBLE® is a registered trademark. All intellectual property
  rights in and to the game are owned in the U.S.A and Canada by
  Hasbro Inc., and throughout the rest of the world by J.W. Spear &
  Sons Limited of Maidenhead, Berkshire, England, a subsidiary of
  Mattel Inc.

  This experimental project is not associated with any of the owners
  of the Scrabble brand.

*/

/*
  Useful references:

  http://en.wikipedia.org/wiki/Scrabble_letter_distributions

  http://en.wikipedia.org/wiki/Scrabble
  http://fr.wikipedia.org/wiki/Scrabble

  http://www.hasbro.com/scrabble/en_US/glossary.cfm
  http://www.hasbro.com/scrabble/en_US/rulesSetup.cfm

*/

/*
  Similar HTML/Javascript projects:

  http://www.themaninblue.com/writing/perspective/2004/01/27/

  http://code.google.com/p/scrabbly/source/browse/trunk/scrabble.js
*/

if (typeof triggerEvent == 'undefined') {
    triggerEvent = function() {
        // console.log.apply(console, arguments);
    }
}

function Bag(contents)
{
    this.contents = contents ? contents.slice() : [];
}

Bag.prototype.add = function(element) {
    this.contents.push(element);
};

Bag.prototype.remove = function(element) {
    var index = this.contents.indexOf(element);
    if (index != -1) {
        return this.contents.splice(index, 1)[0];
    }
};

Bag.prototype.contains = function(element) {
    return this.contents.indexOf(element) != -1;
};

var boardLen = 0;
var middle = Math.floor(boardLen/2);
function MakeBoardArray()
{
	if (boardLen==0) {
    		console.log('MakeBoardArray size=0');
		throw "boardLen=0";
	}
	else
	{
    		console.log('MakeBoardArray size=' + boardLen.toString());
	}
    var retval = new Array(boardLen);
    for (var x = 0; x < boardLen; x++) {
        retval[x] = new Array(boardLen);
    }
    return retval;
}

var letterDistributions = {
    'English':  [ { score: 0, count: 2},

		  { letter: "E", score: 1, count: 12},
		  { letter: "A", score: 1, count: 9},
		  { letter: "I", score: 1, count: 9},
		  { letter: "O", score: 1, count: 8},
		  { letter: "N", score: 1, count: 6},
		  { letter: "R", score: 1, count: 6},
		  { letter: "T", score: 1, count: 6},
		  { letter: "L", score: 1, count: 4},
		  { letter: "S", score: 1, count: 4},
		  { letter: "U", score: 1, count: 4},

		  { letter: "D", score: 2, count: 4},
		  { letter: "G", score: 2, count: 3},

		  { letter: "B", score: 3, count: 2},
		  { letter: "C", score: 3, count: 2},
		  { letter: "M", score: 3, count: 2},
		  { letter: "P", score: 3, count: 2},

		  { letter: "F", score: 4, count: 2},
		  { letter: "H", score: 4, count: 2},
		  { letter: "V", score: 4, count: 2},
		  { letter: "W", score: 4, count: 2},
		  { letter: "Y", score: 4, count: 2},

		  { letter: "K", score: 5, count: 1},

		  { letter: "J", score: 8, count: 1},
		  { letter: "X", score: 8, count: 1},

		  { letter: "Q", score: 10, count: 1},
		  { letter: "Z", score: 10, count: 1}],
    'Estonian':  [ { score: 0, count: 2},
                  { letter: "E", score: 1, count: 9},
                  { letter: "A", score: 1, count: 10},
                  { letter: "I", score: 1, count: 9},
                  { letter: "O", score: 1, count: 5},
                  { letter: "N", score: 2, count: 4},
                  { letter: "R", score: 2, count: 2},
                  { letter: "T", score: 1, count: 7},
                  { letter: "L", score: 1, count: 5},
                  { letter: "S", score: 1, count: 8},
                  { letter: "U", score: 1, count: 5},
                  { letter: "D", score: 2, count: 4},
                  { letter: "G", score: 3, count: 2},
                  { letter: "B", score: 4, count: 1},
                  { letter: "M", score: 2, count: 4},
                  { letter: "P", score: 4, count: 2},
                  { letter: "F", score: 4, count: 1},
                  { letter: "H", score: 4, count: 2},
                  { letter: "V", score: 3, count: 2},
                  { letter: "K", score: 1, count: 5},
                  { letter: "J", score: 4, count: 2},
                  { letter: "Z", score: 10, count: 1},
                  { letter: "Š", score: 10, count: 1},
                  { letter: "Ž", score: 10, count: 1},
                  { letter: "Õ", score: 5, count: 2},
                  { letter: "Ä", score: 5, count: 2},
                  { letter: "Ö", score: 6, count: 2},
                  { letter: "Ü", score: 5, count: 2}],
    'Estonian-SS':  [ { score: 0, count: 4},
                  { letter: "E", score: 1, count: 18},
                  { letter: "A", score: 1, count: 20},
                  { letter: "I", score: 1, count: 18},
                  { letter: "O", score: 1, count: 10},
                  { letter: "N", score: 2, count: 8},
                  { letter: "R", score: 2, count: 4},
                  { letter: "T", score: 1, count: 14},
                  { letter: "L", score: 1, count: 10},
                  { letter: "S", score: 1, count: 16},
                  { letter: "U", score: 1, count: 10},
                  { letter: "D", score: 2, count: 8},
                  { letter: "G", score: 3, count: 4},
                  { letter: "B", score: 4, count: 2},
                  { letter: "M", score: 2, count: 8},
                  { letter: "P", score: 4, count: 4},
                  { letter: "F", score: 4, count: 2},
                  { letter: "H", score: 4, count: 4},
                  { letter: "V", score: 3, count: 4},
                  { letter: "K", score: 1, count: 10},
                  { letter: "J", score: 4, count: 4},
                  { letter: "Z", score: 10, count: 2},
                  { letter: "Š", score: 10, count: 2},
                  { letter: "Ž", score: 10, count: 2},
                  { letter: "Õ", score: 5, count: 4},
                  { letter: "Ä", score: 5, count: 4},
                  { letter: "Ö", score: 6, count: 4},
                  { letter: "Ü", score: 5, count: 4}],
    'Czech':  [ { score: 0, count: 2},
	          { letter: "A", score: 1, count: 5},
                  { letter: "Á", score: 2, count: 2},
                  { letter: "B", score: 3, count: 2},
		  { letter: "C", score: 2, count: 3},
		  { letter: "Č", score: 4, count: 1},
		  { letter: "D", score: 1, count: 3},
		  { letter: "Ď", score: 8, count: 1},
		  { letter: "E", score: 1, count: 5},
		  { letter: "É", score: 3, count: 2},
		  { letter: "Ě", score: 3, count: 2},
		  { letter: "F", score: 5, count: 1},
		  { letter: "G", score: 5, count: 1},
		  { letter: "H", score: 2, count: 3},
		  { letter: "I", score: 1, count: 4},
		  { letter: "Í", score: 2, count: 3},
		  { letter: "J", score: 2, count: 2},
		  { letter: "K", score: 1, count: 3},
		  { letter: "L", score: 1, count: 3},
		  { letter: "M", score: 2, count: 3},
		  { letter: "N", score: 1, count: 5},
		  { letter: "Ň", score: 6, count: 1},
		  { letter: "O", score: 1, count: 6},
		  { letter: "Ó", score: 7, count: 1},
		  { letter: "P", score: 1, count: 3},
		  { letter: "R", score: 1, count: 3},
		  { letter: "Ř", score: 4, count: 2},
		  { letter: "S", score: 1, count: 4},
		  { letter: "Š", score: 4, count: 2},
		  { letter: "T", score: 1, count: 4},
		  { letter: "Ť", score: 7, count: 1},
		  { letter: "U", score: 2, count: 3},
		  { letter: "Ú", score: 5, count: 1},
		  { letter: "Ů", score: 4, count: 1},
		  { letter: "V", score: 1, count: 4},
		  { letter: "X", score: 10, count: 1},
		  { letter: "Y", score: 2, count: 2},
		  { letter: "Ý", score: 4, count: 2},
		  { letter: "Z", score: 2, count: 2},
		  { letter: "Ž", score: 4, count: 1}],
    'Czech-SS':  [ { score: 0, count: 4},
	          { letter: "A", score: 1, count: 10},
                  { letter: "Á", score: 2, count: 4},
                  { letter: "B", score: 3, count: 4},
		  { letter: "C", score: 2, count: 6},
		  { letter: "Č", score: 4, count: 2},
		  { letter: "D", score: 1, count: 6},
		  { letter: "Ď", score: 8, count: 2},
		  { letter: "E", score: 1, count: 10},
		  { letter: "É", score: 3, count: 4},
		  { letter: "Ě", score: 3, count: 4},
		  { letter: "F", score: 5, count: 2},
		  { letter: "G", score: 5, count: 2},
		  { letter: "H", score: 2, count: 6},
		  { letter: "I", score: 1, count: 8},
		  { letter: "Í", score: 2, count: 6},
		  { letter: "J", score: 2, count: 4},
		  { letter: "K", score: 1, count: 6},
		  { letter: "L", score: 1, count: 6},
		  { letter: "M", score: 2, count: 6},
		  { letter: "N", score: 1, count: 10},
		  { letter: "Ň", score: 6, count: 2},
		  { letter: "O", score: 1, count: 12},
		  { letter: "Ó", score: 7, count: 2},
		  { letter: "P", score: 1, count: 6},
		  { letter: "R", score: 1, count: 6},
		  { letter: "Ř", score: 4, count: 4},
		  { letter: "S", score: 1, count: 8},
		  { letter: "Š", score: 4, count: 4},
		  { letter: "T", score: 1, count: 8},
		  { letter: "Ť", score: 7, count: 2},
		  { letter: "U", score: 2, count: 6},
		  { letter: "Ú", score: 5, count: 2},
		  { letter: "Ů", score: 4, count: 2},
		  { letter: "V", score: 1, count: 8},
		  { letter: "X", score: 10, count: 2},
		  { letter: "Y", score: 2, count: 4},
		  { letter: "Ý", score: 4, count: 4},
		  { letter: "Z", score: 2, count: 4},
		  { letter: "Ž", score: 4, count: 2}],
    'French': [ { score: 0, count: 2},
		{ letter: "E", score: 1, count: 15},
		{ letter: "A", score: 1, count: 9},
		{ letter: "I", score: 1, count: 8},
		{ letter: "N", score: 1, count: 6},
		{ letter: "O", score: 1, count: 6},
		{ letter: "R", score: 1, count: 6},
		{ letter: "S", score: 1, count: 6},
		{ letter: "T", score: 1, count: 6},
		{ letter: "U", score: 1, count: 6},
		{ letter: "L", score: 1, count: 5},
		{ letter: "D", score: 2, count: 3},
		{ letter: "G", score: 2, count: 2},
		{ letter: "M", score: 3, count: 3},
		{ letter: "B", score: 3, count: 2},
		{ letter: "C", score: 3, count: 2},
		{ letter: "P", score: 3, count: 2},
		{ letter: "F", score: 4, count: 2},
		{ letter: "H", score: 4, count: 2},
		{ letter: "V", score: 4, count: 2},
		{ letter: "J", score: 8, count: 1},
		{ letter: "Q", score: 8, count: 1},
		{ letter: "K", score: 10, count: 1},
		{ letter: "W", score: 10, count: 1},
		{ letter: "X", score: 10, count: 1},
		{ letter: "Y", score: 10, count: 1},
		{ letter: "Z", score: 10, count: 1}
	      ],
    'German': [ { score: 0, count: 2},
		{ letter: "E", score: 1, count: 15},
		{ letter: "N", score: 1, count: 9},
		{ letter: "S", score: 1, count: 7},
		{ letter: "I", score: 1, count: 6},
		{ letter: "R", score: 1, count: 6},
		{ letter: "T", score: 1, count: 6},
		{ letter: "U", score: 1, count: 6},
		{ letter: "A", score: 1, count: 5},
		{ letter: "D", score: 1, count: 4},
		{ letter: "H", score: 2, count: 4},
		{ letter: "G", score: 2, count: 3},
		{ letter: "L", score: 2, count: 3},
		{ letter: "O", score: 2, count: 3},
		{ letter: "M", score: 3, count: 4},
		{ letter: "B", score: 3, count: 2},
		{ letter: "W", score: 3, count: 1},
		{ letter: "Z", score: 3, count: 1},
		{ letter: "C", score: 4, count: 2},
		{ letter: "F", score: 4, count: 2},
		{ letter: "K", score: 4, count: 2},
		{ letter: "P", score: 4, count: 1},
		{ letter: "Ä", score: 6, count: 1},
		{ letter: "J", score: 6, count: 1},
		{ letter: "Ü", score: 6, count: 1},
		{ letter: "V", score: 6, count: 1},
		{ letter: "Ö", score: 8, count: 1},
		{ letter: "X", score: 8, count: 1},
		{ letter: "Q", score: 10, count: 1},
		{ letter: "Y", score: 10, count: 1}],
    'Hungarian': [ { score: 0, count: 2},
        { letter: "A", score: 1, count: 6},
        { letter: "E", score: 1, count: 6},
        { letter: "K", score: 1, count: 6},
        { letter: "T", score: 1, count: 5},
        { letter: "Á", score: 1, count: 4},
        { letter: "L", score: 1, count: 4},
        { letter: "N", score: 1, count: 4},
        { letter: "R", score: 1, count: 4},
        { letter: "I", score: 1, count: 3},
        { letter: "M", score: 1, count: 3},
        { letter: "O", score: 1, count: 3},
        { letter: "S", score: 1, count: 3},
        { letter: "B", score: 2, count: 3},
        { letter: "D", score: 2, count: 3},
        { letter: "G", score: 2, count: 3},
        { letter: "Ó", score: 2, count: 3},
        { letter: "É", score: 3, count: 3},
        { letter: "H", score: 3, count: 2},
        { letter: "SZ", score: 3, count: 2},
        { letter: "V", score: 3, count: 2},
        { letter: "F", score: 4, count: 2},
        { letter: "GY", score: 4, count: 2},
        { letter: "J", score: 4, count: 2},
        { letter: "Ö", score: 4, count: 2},
        { letter: "P", score: 4, count: 2},
        { letter: "U", score: 4, count: 2},
        { letter: "Ü", score: 4, count: 2},
        { letter: "Z", score: 4, count: 2},
        { letter: "C", score: 5, count: 1},
        { letter: "Í", score: 5, count: 1},
        { letter: "NY", score: 5, count: 1},
        { letter: "CS", score: 7, count: 1},
        { letter: "Ő", score: 7, count: 1},
        { letter: "Ő", score: 7, count: 1},
        { letter: "Ú", score: 7, count: 1},
        { letter: "Ű", score: 7, count: 1},
        { letter: "LY", score: 8, count: 1},
        { letter: "ZS", score: 8, count: 1},
        { letter: "TY", score: 10, count: 1}
        ],
    'Nederlands':  [
	{ score: 0, count: 2},
	{ letter: "A", score: 1, count: 6},
	{ letter: "B", score: 3, count: 2},
	{ letter: "C", score: 5, count: 2},
	{ letter: "D", score: 2, count: 5},
	{ letter: "E", score: 1, count: 18},
	{ letter: "F", score: 4, count: 2},
	{ letter: "G", score: 3, count: 3},
	{ letter: "H", score: 4, count: 2},
	{ letter: "I", score: 1, count: 4},
	{ letter: "J", score: 4, count: 2},
	{ letter: "K", score: 3, count: 3},
	{ letter: "L", score: 3, count: 3},
	{ letter: "M", score: 3, count: 3},
	{ letter: "N", score: 1, count: 10},
	{ letter: "O", score: 1, count: 6},
	{ letter: "P", score: 3, count: 2},
	{ letter: "Q", score: 10, count: 1},
	{ letter: "R", score: 2, count: 5},
	{ letter: "S", score: 2, count: 5},
	{ letter: "T", score: 2, count: 5},
	{ letter: "U", score: 4, count: 3},
	{ letter: "V", score: 4, count: 2},
	{ letter: "W", score: 5, count: 2},
	{ letter: "X", score: 8, count: 1},
	{ letter: "Y", score: 4, count: 2},
	{ letter: "Z", score: 4, count: 2}
    ],
    'French-SS': [ { score: 0, count: 4},
		{ letter: "E", score: 1, count: 30},
		{ letter: "A", score: 1, count: 18},
		{ letter: "I", score: 1, count: 16},
		{ letter: "N", score: 1, count: 12},
		{ letter: "O", score: 1, count: 12},
		{ letter: "R", score: 1, count: 12},
		{ letter: "S", score: 1, count: 12},
		{ letter: "T", score: 1, count: 12},
		{ letter: "U", score: 1, count: 12},
		{ letter: "L", score: 1, count: 10},
		{ letter: "D", score: 2, count: 6},
		{ letter: "G", score: 2, count: 4},
		{ letter: "M", score: 3, count: 6},
		{ letter: "B", score: 3, count: 4},
		{ letter: "C", score: 3, count: 4},
		{ letter: "P", score: 3, count: 4},
		{ letter: "F", score: 4, count: 4},
		{ letter: "H", score: 4, count: 4},
		{ letter: "V", score: 4, count: 4},
		{ letter: "J", score: 8, count: 2},
		{ letter: "Q", score: 8, count: 2},
		{ letter: "K", score: 10, count: 2},
		{ letter: "W", score: 10, count: 2},
		{ letter: "X", score: 10, count: 2},
		{ letter: "Y", score: 10, count: 2},
		{ letter: "Z", score: 10, count: 2}
	      ],
    'German-SS': [ { score: 0, count: 4},
		{ letter: "E", score: 1, count: 30},
		{ letter: "N", score: 1, count: 18},
		{ letter: "S", score: 1, count: 14},
		{ letter: "I", score: 1, count: 12},
		{ letter: "R", score: 1, count: 12},
		{ letter: "T", score: 1, count: 12},
		{ letter: "U", score: 1, count: 12},
		{ letter: "A", score: 1, count: 10},
		{ letter: "D", score: 1, count: 8},
		{ letter: "H", score: 2, count: 8},
		{ letter: "G", score: 2, count: 6},
		{ letter: "L", score: 2, count: 6},
		{ letter: "O", score: 2, count: 6},
		{ letter: "M", score: 3, count: 8},
		{ letter: "B", score: 3, count: 4},
		{ letter: "W", score: 3, count: 2},
		{ letter: "Z", score: 3, count: 2},
		{ letter: "C", score: 4, count: 4},
		{ letter: "F", score: 4, count: 4},
		{ letter: "K", score: 4, count: 4},
		{ letter: "P", score: 4, count: 2},
		{ letter: "Ä", score: 6, count: 2},
		{ letter: "J", score: 6, count: 2},
		{ letter: "Ü", score: 6, count: 2},
		{ letter: "V", score: 6, count: 2},
		{ letter: "Ö", score: 8, count: 2},
		{ letter: "X", score: 8, count: 2},
		{ letter: "Q", score: 10, count: 2},
		{ letter: "Y", score: 10, count: 2}],
    'Hungarian-SS': [ { score: 0, count: 4},
        { letter: "A", score: 1, count: 12},
        { letter: "E", score: 1, count: 12},
        { letter: "K", score: 1, count: 12},
        { letter: "T", score: 1, count: 10},
        { letter: "Á", score: 1, count: 8},
        { letter: "L", score: 1, count: 8},
        { letter: "N", score: 1, count: 8},
        { letter: "R", score: 1, count: 8},
        { letter: "I", score: 1, count: 6},
        { letter: "M", score: 1, count: 6},
        { letter: "O", score: 1, count: 6},
        { letter: "S", score: 1, count: 6},
        { letter: "B", score: 2, count: 6},
        { letter: "D", score: 2, count: 6},
        { letter: "G", score: 2, count: 6},
        { letter: "Ó", score: 2, count: 6},
        { letter: "É", score: 3, count: 6},
        { letter: "H", score: 3, count: 4},
        { letter: "SZ", score: 3, count: 4},
        { letter: "V", score: 3, count: 4},
        { letter: "F", score: 4, count: 4},
        { letter: "GY", score: 4, count: 4},
        { letter: "J", score: 4, count: 4},
        { letter: "Ö", score: 4, count: 4},
        { letter: "P", score: 4, count: 4},
        { letter: "U", score: 4, count: 4},
        { letter: "Ü", score: 4, count: 4},
        { letter: "Z", score: 4, count: 4},
        { letter: "C", score: 5, count: 2},
        { letter: "Í", score: 5, count: 2},
        { letter: "NY", score: 5, count: 2},
        { letter: "CS", score: 7, count: 2},
        { letter: "Ő", score: 7, count: 2},
        { letter: "Ő", score: 7, count: 2},
        { letter: "Ú", score: 7, count: 2},
        { letter: "Ű", score: 7, count: 2},
        { letter: "LY", score: 8, count: 2},
        { letter: "ZS", score: 8, count: 2},
        { letter: "TY", score: 10, count: 2}
        ],
    'Nederlands-SS':  [
	{ score: 0, count: 4},
	{ letter: "A", score: 1, count: 12},
	{ letter: "B", score: 3, count: 4},
	{ letter: "C", score: 5, count: 4},
	{ letter: "D", score: 2, count: 10},
	{ letter: "E", score: 1, count: 36},
	{ letter: "F", score: 4, count: 4},
	{ letter: "G", score: 3, count: 6},
	{ letter: "H", score: 4, count: 4},
	{ letter: "I", score: 1, count: 8},
	{ letter: "J", score: 4, count: 4},
	{ letter: "K", score: 3, count: 6},
	{ letter: "L", score: 3, count: 6},
	{ letter: "M", score: 3, count: 6},
	{ letter: "N", score: 1, count: 20},
	{ letter: "O", score: 1, count: 12},
	{ letter: "P", score: 3, count: 4},
	{ letter: "Q", score: 10, count: 2},
	{ letter: "R", score: 2, count: 10},
	{ letter: "S", score: 2, count: 10},
	{ letter: "T", score: 2, count: 10},
	{ letter: "U", score: 4, count: 6},
	{ letter: "V", score: 4, count: 4},
	{ letter: "W", score: 5, count: 4},
	{ letter: "X", score: 8, count: 2},
	{ letter: "Y", score: 4, count: 4},
	{ letter: "Z", score: 4, count: 4}
    ],
    'English-SS':  [ 
		  { letter: "A", score: 1, count: 16},
		  { letter: "B", score: 3, count: 4},
		  { letter: "C", score: 3, count: 6},
		  { letter: "D", score: 2, count: 8},
		  { letter: "E", score: 1, count: 24},
		  { letter: "F", score: 4, count: 4},
		  { letter: "G", score: 2, count: 5},
		  { letter: "H", score: 4, count: 5},
		  { letter: "I", score: 1, count: 13},
		  { letter: "J", score: 8, count: 2},
		  { letter: "K", score: 5, count: 2},
		  { letter: "L", score: 1, count: 7},
		  { letter: "M", score: 3, count: 6},
		  { letter: "N", score: 1, count: 13},
		  { letter: "O", score: 1, count: 15},
		  { letter: "P", score: 3, count: 4},
		  { letter: "Q", score: 10, count: 2},
		  { letter: "R", score: 1, count: 13},
		  { letter: "S", score: 1, count: 10},
		  { letter: "T", score: 1, count: 15},
		  { letter: "U", score: 1, count: 7},
		  { letter: "V", score: 4, count: 3},
		  { letter: "W", score: 4, count: 4},
		  { letter: "X", score: 8, count: 2},
		  { letter: "Y", score: 4, count: 4},
		  { letter: "Z", score: 10, count: 2},
	    { score: 0, count: 4}
    ],
    'Test': [ { score: 0, count: 1},

          { letter: "E", score: 1, count: 1},
          { letter: "N", score: 1, count: 1},
          { letter: "S", score: 1, count: 1},
          { letter: "I", score: 1, count: 1},
          { letter: "R", score: 1, count: 1},
          { letter: "T", score: 1, count: 1},
          { letter: "U", score: 1, count: 1},
          { letter: "A", score: 1, count: 1},
          { letter: "D", score: 1, count: 1},

          { letter: "H", score: 2, count: 1},
          { letter: "G", score: 2, count: 1},
          { letter: "L", score: 2, count: 1},
          { letter: "O", score: 2, count: 1},

          { letter: "M", score: 3, count: 1},
          { letter: "B", score: 3, count: 1},
          { letter: "W", score: 3, count: 1},
          { letter: "Z", score: 3, count: 1},

          { letter: "C", score: 4, count: 1},
          { letter: "F", score: 4, count: 1},
          { letter: "K", score: 4, count: 1}
            ]};

function type_of(obj) {
    if (typeof(obj) == 'object') {
        if (typeof obj.length == "undefined" || !obj.length) {
            return 'object';
        }
        else {
            return 'array';
        }
    }
    return typeof(obj);
}

function Tile(letter, score)
{
    this.letter = letter;
    this.score = score;
}

Tile.prototype.isBlank = function() {
    return this.score == 0;
};

Tile.prototype.toString = function() {
    return "Tile: [" + (this.isBlank() ? "blank" : this.letter) + "] --> " + this.score;
};

function Square(type, owner) {
    this.type = type;
    this.owner = owner;

    this.x = 0;
    this.y = 0;
}

Square.prototype.placeTile = function(tile, locked) {
    if (tile && this.tile) {
        throw "square already occupied: " + this;
    }

    if (tile) {
        this.tile = tile;
        this.tileLocked = locked;
    } else {
        delete this.tile;
        delete this.tileLocked;
    }

    triggerEvent('SquareChanged', [ this ]);
};

Square.prototype.toString = function() {
    var string =  'Square type ' + this.type + ' x: ' + this.x;
    if (this.y != -1) {
        string += '/' + this.y;
    }
    if (this.tile) {
        string += ' => ' + this.tile;
        if (this.tileLocked) {
            string += ' (Locked)';
        }
    }
    return string;
};

function Board(size) {
	switch(size) {
		case 'Regular':
			boardLen = 15;
			break;
		default:
			boardLen = 21;
			break;
	}
	this.Dimension = boardLen;
	middle = Math.floor(boardLen/2);
    console.log('size=' + boardLen.toString() + " middle=" + middle.toString());
    this.squares = MakeBoardArray();

    for (var y = 0; y < this.Dimension; y++) {
	for (var x = 0; x < this.Dimension; x++) {
	    var centerStart = false;

	    var square = new Square('Normal', this);
	    
	    //var middle = Math.floor(this.Dimension / 2);
	    var halfMiddle = Math.ceil(middle / 2);
	    if (this.Dimension == 15) {

	    if ((x == 0 || x == this.Dimension - 1 || x == middle)
		&& (y == 0 || y == this.Dimension - 1 || y == middle && x != middle)) {
 		square = new Square('TripleWord', this);
	    } else if (x == middle && y == middle
		       || x > 0 && x < middle - 2 && (y == x || y == this.Dimension - x - 1)
		       || x > middle + 2 && x < this.Dimension - 1 && (x == y || x == this.Dimension - y - 1)) {
 		square = new Square('DoubleWord', this);
 		if (x == middle && y == middle) {
 		    centerStart = true;
 		}
	    } else if ((x == middle - 1 || x == middle + 1)
		       && (y == middle - 1 || y == middle + 1)
		       || (x == 0 || x == this.Dimension - 1 || x == middle) && (y == middle + halfMiddle || y == middle - halfMiddle)
		       || (y == 0 || y == this.Dimension - 1 || y == middle) && (x == middle + halfMiddle || x == middle - halfMiddle)
		       || (y == middle + 1 || y == middle - 1) && (x == middle + halfMiddle + 1 || x == middle - halfMiddle - 1)
		       || (x == middle + 1 || x == middle - 1) && (y == middle + halfMiddle + 1 || y == middle - halfMiddle - 1)) {
 		square = new Square('DoubleLetter', this);
	    } else if ((x == middle - 2 || x == middle + 2)
		       && (y == middle - 2 || y == middle + 2)
		       || (y == middle + 2 || y == middle - 2) && (x == middle + halfMiddle + 2 || x == middle - halfMiddle - 2)
		       || (x == middle + 2 || x == middle - 2) && (y == middle + halfMiddle + 2 || y == middle - halfMiddle - 2)) {
 		square = new Square('TripleLetter', this);
 	    }

	    } else if (this.Dimension == 21) {
	    
	    if ((x == 0 && y == 0) || (x == this.Dimension-1 && y == this.Dimension-1) 
		    || (x == this.Dimension-1 && y == 0) || (x == 0 && y == this.Dimension-1)) {
		square = new Square('QuadWord', this);
	    } else if (
	    	(x == 2 && y == 5) || (y == 2 && x == 5) 
		        || (x == this.Dimension-1-5 && y == 2) || (y == this.Dimension-1-5 && x == 2)
	    		|| (x == 5 && y == this.Dimension-1-2) || (y == this.Dimension-1-2 && x == 5) 
			|| (x == this.Dimension-1-2 && y == this.Dimension-1-5) || (y == this.Dimension-1-2 && x == this.Dimension-1-5)) {
		square = new Square('QuadLetter', this);
            } else if (((x == 3 || x == middle || x == this.Dimension-1-3) 
		    && (y == 3 || (y == middle && x != middle) || (y == this.Dimension-1-3)))// original 8 3xW
            	|| (x == 0 && (y == middle-3 || y == middle+3)) || (x == this.Dimension-1 && (y == middle+3 || y == middle-3))
            	|| (y == 0 && (x == middle-3 || x == middle+3)) || (y == this.Dimension-1 && (x == middle+3 || x == middle-3))) {
		square = new Square('TripleWord', this);
	    } else if ((x == middle && y == middle) // board middle
		       || (x >= 0 && x < middle - 2 && (y == x || y == this.Dimension - x - 1)) // one main diagonal
		       || (x > middle + 2 && x <= this.Dimension - 1 && (x == y || x == this.Dimension - y - 1)) // other main diagonal

		       || ((x < middle || x > this.Dimension-1-3) && (y+7 == x)) // top start: left to right minor diagonal
		       || ((x < 3 || x > middle) && (y == this.Dimension - x - 1 - 7)) // top start: right to left minor diagonal
		       || ((x < middle || x > this.Dimension-1-3) && (y+x == 27)) // right start: right to left minor diagonal
		       || ((y < middle || y > this.Dimension-1-3) && (x+7 == y)) // left start: left to right minor diagonal
		       || ((y < 3 || y > middle) && (x == this.Dimension - y - 1 - 7))) { // left start: right to left minor diagonal
		square = new Square('DoubleWord', this);
		if (x == middle && y == middle) {
		    centerStart = true;
		}
	    } else if ((x == middle - 1 || x == middle + 1) && (y == middle - 1 || y == middle + 1) // one-off from board middle
		       || (x == 0 && y==3) || (y == 0 && x == 3)  // row and column 0
		       || (x == 0 && y==middle) || (y == 0 && x == middle) 
		       || (x == 0 && y==this.Dimension-1-3) || (y == 0 && x == this.Dimension-1-3) 
		       || (x == this.Dimension-1 && y==3) || (y == this.Dimension-1 && x == 3)  // row and column 20
		       || (x == this.Dimension-1 && y==middle) || (y == this.Dimension-1 && x == middle) 
		       || (x == this.Dimension-1 && y==this.Dimension-1-3) || (y == this.Dimension-1 && x == this.Dimension-1-3) 
		       || (x == 3 && y==middle-4) || (y == 3 && x == middle-4) // row and column 3
		       || (x == 3 && y==middle+4) || (y == 3 && x == middle+4) 
		       || (x == this.Dimension-1-3 && y==middle-4) || (y == this.Dimension-1-3 && x == middle-4) // row and column 17
		       || (x == this.Dimension-1-3 && y==middle+4) || (y == this.Dimension-1-3 && x == middle+4) 
		       || (x == 5 && y==middle-1) || (y == 5 && x == middle-1) // row and column 5
		       || (x == 5 && y==middle+1) || (y == 5 && x == middle+1) 
		       || (x == this.Dimension-1-5 && y==middle-1) || (y == this.Dimension-1-5 && x == middle-1) // row and column 15
		       || (x == this.Dimension-1-5 && y==middle+1) || (y == this.Dimension-1-5 && x == middle+1) 
		       || (x == 6 && y==middle) || (y == 6 && x == middle)  // row and column 6
		       || (x == this.Dimension-1-6 && y==middle) || (y == this.Dimension-1-6 && x == middle))
		       {
		square = new Square('DoubleLetter', this);
	    } else if (((x == middle - 2 || x == middle + 2) && (y == middle - 2 || y == middle + 2)) // 2 squares off board middle
		       || (x == 1 && y == 4) || (y == 1 && x == 4) // row+col 1
		       || (x == 1 && y == this.Dimension-1-4) || (y == 1 && x == this.Dimension-1-4)
		       || (x == this.Dimension-1-1 && y == 4) || (y == this.Dimension-1-1 && x == 4) // row+col 19
		       || (x == this.Dimension-1-1 && y == this.Dimension-1-4) || (y == this.Dimension-1-1 && x == this.Dimension-1-4)
		       || (x == 4 && y == middle-2) || (y == 4 && x == middle-2) // row+col 4
		       || (x == 4 && y == middle+2) || (y == 4 && x == middle+2)
		       || (x == this.Dimension-1-4 && y == middle-2) || (y == this.Dimension-1-4 && x == middle-2) // row+col 16
		       || (x == this.Dimension-1-4 && y == middle+2) || (y == this.Dimension-1-4 && x == middle+2))
			{
		square = new Square('TripleLetter', this);
	    }
		}

	    square.x = x;
	    square.y = y;
	    this.squares[x][y] = square;
	}
    }

    triggerEvent('BoardReady', [ this ]);
}

Board.fromServerData = function(data) {
    console.log('fromServerData');
    data.constructor = Board.prototype;
    for (var y = 0; y < data.Dimension; y++) {
	for (var x = 0; x < data.Dimension; x++) {
            var square = data.squares[x][y];
            square.prototype = Square.prototype;
            if (square.tile) {
                square.tile.prototype = Tile.prototype;
            }
        }
    }
    console.log('fromServerData done');
    return data;
};

Board.prototype.Dimension = 0; //boardLen;

Board.prototype.forAllSquares = function(f) {
    for (var y = 0; y < this.Dimension; y++) {
	for (var x = 0; x < this.Dimension; x++) {
            f(this.squares[x][y]);
        }
    }
};

Board.prototype.emptyTiles = function() {
    this.forAllSquares(function (square) {
        square.placeTile(null);
    });
};

Board.prototype.toString = function() {
    return "Board " + this.Dimension + " x " + this.Dimension;
};

function Rack(size) {
    this.squares = [];

    for (var x = 0; x < size; x++) {
        var square = new Square('Normal', this);
        square.x = x;
        square.y = -1;
        this.squares[x] = square;
    }

    triggerEvent('RackReady', [ this ]);
}

Rack.prototype.emptyTiles = function() {
    for (var x = 0; x < this.squares.length; x++) {
	var square = this.squares[x];
	
	square.placeTile(null);
    }
};

Rack.prototype.toString = function() {
    return "Rack " + this.squares.length;
};

Rack.prototype.letters = function() {
    return _.reduce(this.squares,
                    function (accu, square) {
                        if (square.tile) {
                            accu.push(square.tile.letter);
                        }
                        return accu;
                    },
                    []);
};

Rack.prototype.findLetterSquare = function(letter, includingBlank) {
    var blankSquare = null;
    var square = _.find(this.squares,
                        function(square) {
                            if (square.tile) {
                                if (square.tile.isBlank() && !blankSquare) {
                                    blankSquare = square;
                                } else if (square.tile.letter == letter) {
                                    return true;
                                }
                            }
                        });
    if (square) {
        return square;
    } else if (includingBlank) {
        return blankSquare;
    } else {
        return null;
    }
};

function LetterBag()
{
}

LetterBag.create = function(language, size) {
    var letterBag = new LetterBag;
    var langPlus = language;
    switch (size) {
		    	case 'Regular':
                                boardLen=15;
                                break;
	    		default:
                                boardLen=21;
		    		langPlus += "-SS";
                                break;
    }
    var letterDistribution = letterDistributions[langPlus];
    middle = Math.floor(boardLen/2);


    letterBag.tiles = [];
    letterBag.legalLetters = '';


    if (!letterDistribution) {
        throw 'unsupported language: ' + language;
    }
    for (var i = 0; i < letterDistribution.length; ++i) {
	var letterDefinition = letterDistribution[i];
	
	var tile = new Tile(letterDefinition.letter || " ", letterDefinition.score);
        if (letterDefinition.letter) {
            letterBag.legalLetters += letterDefinition.letter;
        }
	
	for (var n = 0; n < letterDefinition.count; ++n) {
	    var tile = new Tile(letterDefinition.letter || " ", letterDefinition.score);
	    letterBag.tiles.push(tile);
	}
    }
    return letterBag;
};

LetterBag.prototype.shake = function()
{
    var count = this.tiles.length;
    for (i = 0; i < count * 3; i++) {
        var a = Math.floor(Math.random() * count);
        var b = Math.floor(Math.random() * count);
        var tmp = this.tiles[b];
        this.tiles[b] = this.tiles[a];
        this.tiles[a] = tmp;
    }
};

LetterBag.prototype.getRandomTile = function()
{
    this.shake();

    return this.tiles.pop();
};

LetterBag.prototype.addBag = function(otherBag)
{
    for (var i = 0; otherBag.tiles.length; i++) {
        this.tiles.push(otherBag.tiles.pop());
    }
};

LetterBag.prototype.getRandomTiles = function(count)
{
    this.shake();

    var retval = [];
    for (var i = 0; this.tiles.length && (i < count); i++) {
        retval.push(this.tiles.pop());
    }
    return retval;
};

LetterBag.prototype.returnTile = function(tile)
{
    this.tiles.push(tile);
};

LetterBag.prototype.returnTiles = function(tiles)
{
    this.tiles = this.tiles.concat(tiles);
};

LetterBag.prototype.remainingTileCount = function(tile)
{
    return this.tiles.length;
};

function calculateMove(squares)
{
    // Check that the start field is occupied
    boardLen = squares.length;
    middle = Math.floor(boardLen/2);
    if (!squares[middle][middle].tile) {
	    console.log("error calculateMove: middle=" + middle.toString());
        return { error: "start field must be used" };
    }
    //console.log("calculateMove: middle=" + middle.toString());
    
    // Determine that the placement of the Tile(s) is legal
    
    // Find top-leftmost placed tile
    var x;
    var y;
    var topLeftX;
    var topLeftY;
    var tile;
    for (y = 0; !tile && y < boardLen; y++) {
        for (x = 0; !tile && x < boardLen; x++) {
            if (squares[x][y].tile && !squares[x][y].tileLocked) {
                tile = squares[x][y].tile;
                topLeftX = x;
                topLeftY = y;
            }
        }
    }
    if (!tile) {
        return { error: "no new tile found" };
    }
    
    // Remember which newly placed tile positions are legal
    var legalPlacements = MakeBoardArray();
    legalPlacements[topLeftX][topLeftY] = true;

    function touchingOld(x, y) {
	    switch(boardLen) {
		    case 21:
        var retval = 
        (x > 0 && squares[x - 1][y].tile && squares[x - 1][y].tileLocked)
            || (x < 20 && squares[x + 1][y].tile && squares[x + 1][y].tileLocked)
            || (y > 0 && squares[x][y - 1].tile && squares[x][y - 1].tileLocked)
            || (y < 20 && squares[x][y + 1].tile && squares[x][y + 1].tileLocked);
			    break;
		    default:
        var retval = 
        (x > 0 && squares[x - 1][y].tile && squares[x - 1][y].tileLocked)
            || (x < 14 && squares[x + 1][y].tile && squares[x + 1][y].tileLocked)
             || (y > 0 && squares[x][y - 1].tile && squares[x][y - 1].tileLocked)
            || (y < 14 && squares[x][y + 1].tile && squares[x][y + 1].tileLocked);
			    break;
	    }
        return retval;
    }

    var isTouchingOld = touchingOld(topLeftX, topLeftY);
    var horizontal = false;
    for (var x = topLeftX + 1; x < boardLen; x++) {
        if (!squares[x][topLeftY].tile) {
            break;
        } else if (!squares[x][topLeftY].tileLocked) {
            legalPlacements[x][topLeftY] = true;
            horizontal = true;
            isTouchingOld = isTouchingOld || touchingOld(x, topLeftY);
        }
    }

    if (!horizontal) {
        for (var y = topLeftY + 1; y < boardLen; y++) {
            if (!squares[topLeftX][y].tile) {
                break;
            } else if (!squares[topLeftX][y].tileLocked) {
                legalPlacements[topLeftX][y] = true;
                isTouchingOld = isTouchingOld || touchingOld(topLeftX, y);
            }
        }
    }

    //var middle = Math.floor(boardLen/2);
    if (!isTouchingOld && !legalPlacements[middle][middle]) {
        return { error: 'not touching old tile ' + topLeftX + '/' + topLeftY };
    }

    // Check whether there are any unconnected other placements, count total tiles on board
    var totalTiles = 0;
    for (var x = 0; x < boardLen; x++) {
        for (var y = 0; y < boardLen; y++) {
            var square = squares[x][y];
            if (square.tile) {
                totalTiles++;
                if (!square.tileLocked && !legalPlacements[x][y]) {
                    return { error: 'unconnected placement' };
                }
            }
        }
    }

    if (totalTiles == 1) {
        return { error: 'first word must consist of at least two letters' };
    }

    var move = { words: [] };

    // The move was legal, calculate scores
    function horizontalWordScores(squares) {
        var score = 0;
        for (var y = 0; y < boardLen; y++) {
            for (var x = 0; x < boardLen-1; x++) {
                if (squares[x][y].tile && squares[x + 1][y].tile) {
                    var wordScore = 0;
                    var letters = '';
                    var wordMultiplier = 1;
                    var isNewWord = false;
                    for (; x < boardLen && squares[x][y].tile; x++) {
                        var square = squares[x][y];
                        var letterScore = square.tile.score;
                        isNewWord = isNewWord || !square.tileLocked;
                        if (!square.tileLocked) {
                            switch (square.type) {
                            case 'DoubleLetter':
                                letterScore *= 2;
                                break;
                            case 'DoubleWord':
                                wordMultiplier *= 2;
                                break;
                            case 'TripleLetter':
                                letterScore *= 3;
                                break;
                            case 'TripleWord':
                                wordMultiplier *= 3;
                                break;
                            case 'QuadLetter':
                                letterScore *= 4;
                                break;
                            case 'QuadWord':
                                wordMultiplier *= 4;
                                break;
                            case 'QuintLetter':
                                letterScore *= 5;
                                break;
                            case 'QuintWord':
                                wordMultiplier *= 5;
                                break;
                            }
                        }
                        wordScore += letterScore;
                        letters += square.tile.letter;
                    }
                    wordScore *= wordMultiplier;
                    if (isNewWord) {
                        move.words.push({ word: letters, score: wordScore });
                        score += wordScore;
                    }
                }
            }
        }
        return score;
    }

    move.score = horizontalWordScores(squares);
    // Create rotated version of the board to calculate vertical word scores.
    var rotatedSquares = MakeBoardArray();
    for (var x = 0; x < boardLen; x++) {
        for (var y = 0; y < boardLen; y++) {
            rotatedSquares[x][y] = squares[y][x];
        }
    }
    move.score += horizontalWordScores(rotatedSquares);

    // Collect and count tiles placed.
    var tilesPlaced = [];
    for (var x = 0; x < boardLen; x++) {
        for (var y = 0; y < boardLen; y++) {
            var square = squares[x][y];
            if (square.tile && !square.tileLocked) {
                tilesPlaced.push({ letter: square.tile.letter,
                                   x: x,
                                   y: y,
                                   blank: square.tile.isBlank() });
            }
        }
    }
    if (tilesPlaced.length == 7) {
        move.score += 50;
        move.allTilesBonus = true;
    }
    move.tilesPlaced = tilesPlaced;

    return move;
}

if (typeof exports == 'object') {
    exports.Tile = Tile;
    exports.Square = Square;
    exports.Rack = Rack;
    exports.Board = Board;
    exports.calculateMove = calculateMove;
    exports.LetterBag = LetterBag;
    exports.Bag = Bag;
}
