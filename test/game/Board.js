/* See README.md at the root of this distribution for copyright and
   license information */
/* eslint-env mocha,node */

import { assert } from "chai";
import { setupPlatform } from "../TestPlatform.js";

import { Edition } from "../../src/game/Edition.js";
import { Game } from "../../src/game/Game.js";
const Board = Game.CLASSES.Board;
const Tile = Game.CLASSES.Tile;

/**
 * Unit tests for Board class
 */
describe("game/Board", () => {

  before(setupPlatform);

  it("construct, parse, place, and unplace", () => {
    return Edition.load("Test")
    .then(edition => {
      let b = new Board(Game.CLASSES, edition);
      b.parse(Game.CLASSES, edition,
        "|Q| | | | | | | | | | |\n" +
        "|U| | | | | | | | | | |\n" +
        "|E| | | | | | | | | | |\n" +
        "|S|C|I|E|N|C|E| | | | |\n" +
        "|T| | | | | | | | | | |\n" +
        "|I| | | | | | | | | | |\n" +
        "|O|P|I|N|I|O|N| | | | |\n" +
        "|N| | | | | |O|M| | | |\n" +
        "| | | | | | | | | | | |\n" +
        "| | | | | | | | | | | |\n" +
              "| | | | | | | | | | | |");
      b.at(6, 6).unplaceTile();
      b.at(6, 6).placeTile(new Tile(
        { letter: "N", isBlank: true }), true);
      assert.equal(b.stringify(),
                   "|Q| | | | | | | | | |8|\n" +
                   "|U|4| | | | | | | |4| |\n" +
                   "|E| |7| | | | | |7| | |\n" +
                   "|S|C|I|E|N|C|E|3| | | |\n" +
                   "|T| | | |2| |2| | | | |\n" +
                   "|I| | | | |6| | | | | |\n" +
                   "|O|P|I|N|I|O|n| | | | |\n" +
                   "|N| | |3| | |O|M| | | |\n" +
                   "| | |7| | | | | |7| | |\n" +
                   "| |4| | | | | | | |4| |\n" +
                   "|8| | | | | | | | | |8|\n");
      assert.equal(b.squaresUsed(), 22);
      b.at(0, 8).placeTile(new Tile(
        { letter: "S" }), false);
      assert.equal(b.stringify(),
                   "|Q| | | | | | | | | |8|\n" +
                   "|U|4| | | | | | | |4| |\n" +
                   "|E| |7| | | | | |7| | |\n" +
                   "|S|C|I|E|N|C|E|3| | | |\n" +
                   "|T| | | |2| |2| | | | |\n" +
                   "|I| | | | |6| | | | | |\n" +
                   "|O|P|I|N|I|O|n| | | | |\n" +
                   "|N| | |3| | |O|M| | | |\n" +
                   "|S| |7| | | | | |7| | |\n" +
                   "| |4| | | | | | | |4| |\n" +
                   "|8| | | | | | | | | |8|\n");
      assert.equal(b.squaresUsed(), 23);
      assert(b.hasUnlockedTiles());
    });
  });

  it("pack", () => {
    return Edition.load("Test")
    .then(edition => {
      let b = new Board(Game.CLASSES, edition);
      b.parse(Game.CLASSES, edition,
        "|Q| | | | | | | | | | |\n" +
        "|U| | | | | | | | | | |\n" +
        "|E| | | | | | | | | | |\n" +
        "|S|C|I|E|N|C|E| | | | |\n" +
        "|T| | | | | | | | | | |\n" +
        "|I| | | | | | | | | | |\n" +
        "|O|P|I|N|I|O|N| | | | |\n" +
        "|N| | | | | |O|M| | | |\n" +
        "| | | | | | | | | | | |\n" +
        "| | | | | | | | | | | |\n" +
              "| | | | | | | | | | | |");
      // SMELL: hack
      b.squares[0][0].tile.isBlank = true;
      const uri = b.pack();
      assert.equal(uri, "qUESTION(6)C--P(7)I--I(7)E--N(7)N--I(7)C--O(7)E--NO(10)M(36)");

      b = new Board(Game.CLASSES, edition);
      b.unpack(uri, edition);
      assert.equal(b.stringify(),
                   "|q| | | | | | | | | |8|\n" +
                   "|U|4| | | | | | | |4| |\n" +
                   "|E| |7| | | | | |7| | |\n" +
                   "|S|C|I|E|N|C|E|3| | | |\n" +
                   "|T| | | |2| |2| | | | |\n" +
                   "|I| | | | |6| | | | | |\n" +
                   "|O|P|I|N|I|O|N| | | | |\n" +
                   "|N| | |3| | |O|M| | | |\n" +
                   "| | |7| | | | | |7| | |\n" +
                   "| |4| | | | | | | |4| |\n" +
                   "|8| | | | | | | | | |8|\n"); 
      assert(b.squares[0][0].tile.isBlank);
    });
  });

  it("touching old", () => {
    return Edition.load("Test")
    .then(edition => {
      let b = new Board(Game.CLASSES, edition);
      for (let r = 0; r < b.rows; r++)
        for (let c = 0; c < b.cols; c++)
          assert(!b.touchingOld(r, c));
      const mr = Math.floor(b.rows / 2);
      const mc = Math.floor(b.cols / 2);
      let sq = b.at(mr, mc);
      let t = new Tile({letter: "?"});
      sq.placeTile(t, true);
      assert.equal(t.row, mr);
      assert.equal(t.col, mc);
      assert(sq.hasLockedTile());

      b.at(0, 0).placeTile(new Tile({letter: "t"}), true);
      b.at(0, b.rows-1).placeTile(new Tile({letter: "T"}), true);
      b.at(b.cols-1, 0).placeTile(new Tile({letter: "b"}), true);
      b.at(b.cols-1, b.rows-1).placeTile(new Tile({letter: "B"}), true);
      //console.log(b);
      for (let r = 0; r < b.rows; r++) {
        for (let c = 0; c < b.cols; c++) {
          if (r == mr && (c == mc-1 || c == mc+1)
              || c == mc && (r == mr-1 || r == mr+1)
              || r == 0 && (c == 1 || c == b.cols-2)
              || c == 0 && (r == 1 || r == b.rows-2)
              || r == b.rows - 1 && (c == 1 || c == b.cols - 2)
              || c == b.cols - 1 && (r == 1 || r == b.cols - 2))
            assert(b.touchingOld(r, c), `${r} ${c}`);
          else
            assert(!b.touchingOld(r, c), `${r} ${c}`);
        }
      }
    });
  });

  it("scorePlay", () => {
    return Edition.load("Test")
    .then(edition => {
      let b = new Board(Game.CLASSES, edition);
      for (let r = 0; r < b.rows; r++)
        for (let c = 0; c < b.cols; c++)
          assert(!b.touchingOld(r, c));
      const mr = Math.floor(b.rows / 2);
      const mc = Math.floor(b.cols / 2);

      const W = new Tile({letter: "W", score:4});
      const O = new Tile({letter: "O", score:1});
      const R = new Tile({letter: "R", score:2, isBlank:true});
      const D = new Tile({letter: "D", score:3});
      // Q_________Q
      // _q_______q_
      // __T_____T__
      // ___t___t___
      // ____d_d____
      // _____WORD__
      // ____d_d____
      // ___t___t___
      // __T_____T__
      // _q_______q_
      // Q_________Q
      let w0 = [];
      let g0 = b.scorePlay(mc+3, mr, 1, 0, [ W, O, R, D ], w0);
      assert.deepEqual(w0, [{ word: "WORD", score: 20 } ]);
      assert.equal(g0, 20);

      // Lock down the play
      b.at(mc, mr).placeTile(W, true);
      b.at(mc+1, mr).placeTile(O, true);
      R.letter = "R";
      b.at(mc+2, mr).placeTile(R, true);
      b.at(mc+3, mr).placeTile(D, true);

      // Score another play that extends the existing word
      const S = new Tile({letter: "S", score: 1});
      const U = new Tile({letter: "U", score: 1});
      const N = new Tile({letter: "N", isBlank:true, score: 2});

      // Q_________Q
      // _q_______q_
      // __T_____T__
      // ___t___t___
      // ____d_d____
      // ____SWORD__
      // ____U_d____
      // ___tN__t___
      // __T_____T__
      // _q_______q_
      // Q_________Q
      const w1 = [];
      const g1 = b.scorePlay(mc - 1, mr + 2, 0, 1, [ S, U, N ], w1);
      assert.deepEqual(w1, [
        { word: "SWORD", score: 11 },
        { word: "SUN", score: 5 } ]);
      assert.equal(g1, 16);

      b.at(mc-1, mr).placeTile(S, true);
      b.at(mc-1, mr + 1).placeTile(U, true);
      b.at(mc-1, mr + 2).placeTile(N, true);

      // Score another play that intersects the existing word
      const I = new Tile({letter: "I", score: 1});
      const C = new Tile({letter: "C", score: 2});
      const K = new Tile({letter: "K", score: 2});

      // Q_________Q
      // _q_______q_
      // __T_____T__
      // ___t___t___
      // ____d_d____
      // ____SWORD__
      // ____U_d_I__
      // ___tN__tC__
      // __T_____K__
      // _q_______q_
      // Q_________Q
      const w2 = [];
      const g2 = b.scorePlay(mc+3, mr+3, 1, 0, [ D, I, C, K ], w2);
      assert.deepEqual(w2, [ { word: "DICK", score: 24 } ]);
      assert.equal(g2, 24);

      //console.log(b.stringify());
    });
  });
});
