/* eslint-env browser, jquery */

/**
 * User interface to a game in a browser
 */
const uideps = [
	"jqueryui",
	"cookie",
	"socket.io",
	"game/Fridge",
	"game/Tile",
	"game/Bag",
	"game/Rack",
	"game/Game" ];

define("browser/Ui", uideps, (jq, ck, socket_io, Fridge, Tile, Bag, Rack, Game) => {

	class Ui {

		constructor() {

			const splitUrl = document.URL.match(/.*\/([0-9a-f]+)$/);
			if (!splitUrl)
				throw Error(`cannot parse url ${document.URL}`);
			const gameKey = splitUrl[1];

			this.selectedSquare = null;
			this.thisPlayer = null; // lateinit in loadGame
			this.boardLocked = false;

			// This will GET application/json
			$.get(`/game/${gameKey}`,
				  frozen => {
					  console.log(`Loading game ${gameKey}`);
					  const game = Fridge.thaw(frozen, Game.classes);
					  this.loadGame(game);
					  this.attachListeners();
				  });
		}

		isPlayer(index) {
			return this.thisPlayer.index === index;
		}

		/**
		 * Send a game command to the server. Game commands are recognised
		 * by being sent using POST. Moves are 'makeMove', 'challenge',
		 * 'swap', 'takeBack', and 'pass'
		 */
		sendCommand(command, args, success) {
			this.cancelNotification();
			$.post(`/game/${this.game.key}`, {
				command: command,
				// Note we JSON.stringify because $.post will
				// otherwise convert all numbers to strings. PITA!
				args: JSON.stringify(args)
			})
			.done(success)
			.fail((jqXHR, textStatus, errorThrown) => {
				console.error(`${command} returned error: ${textStatus} (${errorThrown})`);
			});
		}

		/**
		 * Scroll to end of log.
		 * @param speed animation duration in ms
		 */
		scrollLogToEnd(speed) {
			$('#log').animate({
				scrollTop: $('#log').prop('scrollHeight')
			}, speed);
		}

		/**
		 * Play an audio clip, identified by id. Clips must be
		 * pre-loaded in the HTML.
		 */
		playAudio(id) {
			let audio = document.getElementById(id);

			if (audio.playing)
				audio.pause();

			audio.defaultPlaybackRate = 1;
			audio.volume = 1;

			try {
				audio.currentTime = 0;
				audio.play();
			}
			catch(e) {
				const currentTime = () => {
					audio.currentTime = 0;
					audio.removeEventListener("canplay", currentTime, true);
					audio.play();
				};
				audio.addEventListener("canplay", currentTime, true);
			}
		}

		/**
		 * If this is a timed game, start the timeout counter. This is
		 * purely for visual feedback; the actual timer is on the server.
		 */
		startCountdown(abstime) {
			if (abstime <= 0)
				return;
			console.debug("Starting timer feedback");
			$("#timeout").show();
			function tick() {
				let remainSecs = Math.floor((abstime - Date.now()) / 1000);
				$('#timeout').text(remainSecs);
				if (remainSecs > 0)
					setTimeout(tick, 1000);
			}
			tick();
		}

		/**
		 * Append information a turn it is to the log.
		 * @param turn a Turn
		 */
		appendTurnToLog(turn) {
			const player = this.game.players[turn.player];
			const $scorediv = $("<div class='score'></div>");
			const mess = $.i18n('log-turn', player.name);
			$scorediv.append(`<span class='playerName'>${mess}</span>`);

			const $div = $("<div class='moveScore'></div>");
			$div.append($scorediv);

			const $detail = $("<div class='moveDetail'></div>");

			switch (turn.type) {
			case 'move':
				{
					// Compose a description of the words created
					let ws = 0;
					let sum = 0;
					for (let word of turn.move.words) {
						$detail.append(
							$.i18n('log-move', word.word, word.score))
						.append(' ');
						ws++;
						sum += word.score;
					}
					if (ws > 1 || turn.deltaScore > sum)
						$detail.append($.i18n('log-total', turn.deltaScore));
				}
				break;
			case 'swap':
				$detail.text($.i18n('log-swap', turn.newTiles.length));
				break;
			case 'timeout':
			case 'pass':
			case 'challenge-won':
			case 'challenge-failed':
			case 'took-back':
				$detail.text($.i18n(`log-${turn.type}`));
				break;
			default:
				// Terminal, no point in translating
				throw Error(`Unknown move type ${turn.type}`);
			}
			$div.append($detail);
			$('#log').append($div);
		}

		/**
		 * Append a formatted "next game" message to the log
		 */
		logNextGameMessage(nextGameKey) {
			let $but = $("<button></button>");
			if (nextGameKey) {
				$but.addClass('nextGame')
				.text($.i18n('button-next-game'));
				const $a = $("<a></a>");
				$a.attr(
					"href", `/game/${nextGameKey}/${$.cookie(this.game.key)}`);
				$a.append($but);
				$('#log').append($a);
				$('#makeNextGame').remove();
			} else {
				$but.text($.i18n('button-another-game'));
				$but.on('click',
						() => $.post(`/anotherGame/${this.game.key}`));
				let $ngb = $("<div id='makeNextGame'></div>")
					.append($but)
					.append(" ")
					.append($.i18n('log-same-players'));
				$('#log').append($ngb);
			}
		}

		/**
		 * Append a formatted "end of game" message to the log
		 */
		logEndMessage(info, cheer) {
			const winners = [];
			let youWon = false;

			info.players.forEach(playerState => {
				const isme = this.isPlayer(playerState.player);
				if (playerState.score === info.winningScore) {
					if (isme) {
						if (cheer)
							this.playAudio("endCheer");
						youWon = true;
						winners.push($.i18n('you'));
					} else {
						winners.push(
							this.game.players[playerState.player].name);
					}
				}

				const player = this.game.players[playerState.player];
				player.score = playerState.score;

				const $gsd = $("<div class='gameEndScore'></div>");
				const name = isme ? $.i18n("You") : player.name;
				if (playerState.tally > 0) {
					$gsd.text($.i18n('log-gained-from-racks',
									 name, playerState.tally));
				} else if (playerState.tally < 0) {
					$gsd.text($.i18n(
						"log-lost-for-rack",
						name,
						-playerState.tally,
						playerState.tilesLeft.join(',')));
				}
				$('#log').append($gsd);
				player.refreshDOM();
			});

			if (cheer && !youWon)
				this.playAudio("lost");

			$("#whosturn").text($.i18n('notify-game-over'));

			let who;
			if (winners.length == 0)
				who = "";
			else if (winners.length == 1)
				who = winners[0];
			else
				who = $.i18n('log-name-name',
							 winners.slice(0, length - 1).join(", "),
							 winners[winners.length - 1]);

			let has = (winners.length == 1 && !youWon) ? 1 : 2;
			let $div = $("<div class='gameEnded'></div>");
			$div.text($.i18n(info.reason, $.i18n('log-winner', who, has)));

			$('#log').append($div);

			this.logNextGameMessage(info.nextGameKey);
		}

		/**
		 * Add a message to the chat pane. Message test that matches
		 * an i18n message identifier will be automatically translated
		 * with supplied message args
		 */
		chatMessage(message) {
			// If $.i18n doesn't find a trnaslation, it will simply
			// return the message
			let args = [ message.text ];
			if (typeof message.args === "string")
				args.push(message.args);
			else if (message.args instanceof Array)
				args = args.concat(message.args);
			const msg = $.i18n.apply(null, args);
			console.debug(`Server: Message ${msg}`);
			// Chat received
			let $mess = $(`<div><span class='name'>${message.name}</span>: ${msg}</div>`);
			$('#chatLog')
			.append($mess)
			.animate({ scrollTop: $('#chatLog').prop('scrollHeight') }, 100);

			if (message.name != this.thisPlayer.name)
				this.notify(message.name, msg);
		}

		/**
		 * Show who's turn it is
		 */
		updateWhosTurn(whosTurn) {
			let $wt = $('#whosturn');
			if (this.isPlayer(whosTurn)) {
				$wt.text($.i18n('turn-yours'));
				$('#turnControls').css('display', 'block');
			} else {
				$wt.text($.i18n('turn-theirs',
								this.game.players[whosTurn].name));
				$('#turnControls').css('display', 'none');
			}
		}

		/**
		 * Update the display of the number of tiles remaining in the
		 * letter bag and player's racks. This includes showing the
		 * swap rack, if enough tiles remain in the bag.
		 */
		updateTileCounts() {
			let remains = this.game.letterBag.remainingTileCount();
			if (remains > 0) {
				const mess = $.i18n('letterbag-remaining', remains);
				$('#letterbagStatus').html(`<div>${mess}</div>`);
				$('#scoreboard td.remainingTiles').empty();
			} else {
				$('#letterbagStatus').text($.i18n('letterbag-empty'));
				const countElements = $('#scoreboard td.remainingTiles');
				this.game.players.forEach(
					(player, i) =>
					$(countElements[i]).text(`(${player.rack.squaresUsed()})`));
			}
			if (remains < this.game.board.rackCount)
				$('#swapRack').hide();
			else
				$('#swapRack').show();
		}

		/**
		 * A game has been read; load it into the UI
		 * @param game the Game being played
		 */
		loadGame(game) {
			console.log("Loading UI for", game.toString());

			this.game = game;

			// Number of tiles placed on the board since the last turn
			this.placedCount = 0;

			// Can swap up to swapCount tiles
			this.swapRack = new Rack(this.game.board.swapCount);

			const playerKey = $.cookie(this.game.key);
			this.thisPlayer = this.game.getPlayerFromKey(playerKey);

			let $players = this.game.createPlayerTableDOM(this.thisPlayer);
			$("#scoreboard").append($players);

			const $board = this.game.board.createDOM();
			$('#board').append($board);
			this.game.board.refreshDOM();

			$('#tileRack').append(this.thisPlayer.rack.createDOM('Rack'));
			this.thisPlayer.rack.refreshDOM();

			$('#swapRack').append(this.swapRack.createDOM('Swap', 'SWAP'));
			this.swapRack.refreshDOM();

			const gs = $.i18n('log-game-started');
			$('#log').append(`<p class='gameStart'>${gs}</p>`);

			for (let turn of game.turns)
				this.appendTurnToLog(turn);

			if (game.ended)
				this.logEndMessage(game.ended, false);

			this.scrollLogToEnd(0);

			this.updateWhosTurn(game.whosTurn);
			this.lockBoard(!this.isPlayer(game.whosTurn));

			this.updateGameStatus();

			let lastTurn = game.turns.length && game.turns[game.turns.length - 1];

			if (lastTurn && lastTurn.type == 'move') {
				if (this.isPlayer(game.whosTurn))
					this.addChallengePreviousButton(lastTurn);
				else
					this.addTakeBackPreviousButton(lastTurn);
			}

			$("#shuffleButton").on('click', () => this.shuffleRack());
			$("#takeBackButton").on('click', () => this.takeBackTiles());
			$("#turnButton").on('click', () => this.makeMove());
		}

		/**
		 * Attach socket and event listeners
		 */
		attachListeners() {
			const transports = [
				'websocket', 'htmlfile',
				'xhr-multipart', 'xhr-polling', 'jsonp-polling'];

			this.socket = socket_io.connect(null, { transports: transports });

			let $reconnectDialog = null;

			this.socket

			.on('connect', () => {
				if ($reconnectDialog) {
					$reconnectDialog.dialog("close");
					$reconnectDialog = null;
				}
				console.debug('Server: Socket connected');
				if (this.wasConnected) {
					this.cancelNotification();
					//window.location = window.location;
				} else {
					this.wasConnected = true;
					this.socket.emit('join', {
						gameKey: this.game.key,
						playerKey: this.thisPlayer.key
					});
				}
			})

			.on('disconnect', () => {
				console.debug('Server: Socket disconnected');
				$reconnectDialog = $('#problemDialog')
				.text($.i18n('warn-server-disconnected'))
				.dialog({ modal: true });
				const ui = this;
				setTimeout(() => {
					ui.socket.emit('join', {
						gameKey: this.game.key,
						playerKey: this.thisPlayer.key
					});
				}, 1000);

			})

			.on('turn', turn => this.processTurn(turn))

			.on('gameEnded', end => {
				console.debug("Received gameEnded");
				this.logEndMessage(end, true);
				this.notify($.i18n('notify-game-over'),
							$.i18n('notify-body-game-over'));
			})

			.on('nextGame', nextGameKey =>
				this.logNextGameMessage(nextGameKey))

			.on('message', message =>
				this.chatMessage(message))

			.on('join', info => {
				console.debug("Server: Player ", info, " joining");
				if (info.timeout)
					this.startCountdown(info.timeout);

				const player = this.game.getPlayerFromKey(info.playerKey);
				if (player)
					player.online(true);
			})

			.on('leave', playerKey => {
				// Server has indicated game has been left
				// AFAICT this
				const player = this.game.getPlayerFromKey(playerKey);
				console.debug(`Server: Player ${player.name} leaving`);
				player.online(false);
			});

			let ui = this;
			$('input[name=message]')
			.on('change', function() {
				// Send chat
				ui.socket.emit(
					'message',
					{ name: ui.thisPlayer.name, text: $(this).val() });
				$(this).val('');
			});

			// Events raised by game components. The Refresh events are
			// not currently used.
			$(document)
			.on('SquareChanged',
				(e, square) => square.refreshDOM())

			.on('SelectSquare',
				(e, square) => this.selectSquare(square))

			.on('DropSquare',
				(e, source, square) => this.dropSquare(source, square))

			.on('Refresh',
				() => this.refresh())

			.on('RefreshRack',
				() => this.thisPlayer.rack.refreshDOM())

			.on('RefreshBoard',
				() => this.game.board.refreshDOM());
		}

		// Square selection is used for click-click moves when dragging
		// isn't available
		selectSquare(square) {
			if (square)
				console.log(`select ${square.id}`);
			if (this.selectedSquare) {
				if (this.selectedSquare.tile && square
					&& square !== this.selectedSquare)
					// A square has previously been clicked, and we
					// are clicking a different square
					this.moveTile(this.selectedSquare, square);
				this.selectedSquare.setSelected(false);
			}
			this.selectedSquare = square;
			if (square)
				this.selectedSquare.setSelected(true);
		}

		// Handler for 'DropSquare' event, invoked when a draggable has
		// been dropped on a square.
		dropSquare(source, square) {
			this.moveTile(source, square);
			this.playAudio("tiledown");
			this.selectSquare(null);
		}

		refresh() {
			this.thisPlayer.rack.refreshDOM();
			this.game.board.refreshDOM();
		}

		moveTile(fromSquare, toSquare) {
			let tile = fromSquare.tile;

			if (fromSquare.owner === this.game.board) {
				if (toSquare.owner !== this.game.board)
					this.placedCount--;
			} else if (toSquare.owner === this.game.board)
				this.placedCount++;

			fromSquare.placeTile(null);
			if (tile.isBlank) {			
				if (fromSquare.owner != this.game.board
					&& toSquare.owner == this.game.board) {

					let $dlg = $('#blankDialog');
					let $tab = $("#blankLetterTable");
					$tab.empty();
					let ll = this.game.letterBag.legalLetters.slice();
					let dim = Math.ceil(Math.sqrt(ll.length));
					let rowlength = dim;
					let $row = null;
					while (ll.length > 0) {
						let letter = ll.shift();
						if (rowlength == dim) {
							if ($row)
								$tab.append($row);
							$row = $("<tr></tr>");
							rowlength = 0;
						}
						let $td = $(`<td>${letter}</td>`);
						$td.on('click', () => {
							// Horrible hack
							tile.letter = letter;
							toSquare.refreshDOM();
							$dlg.dialog("close");
						});
						$row.append($td);
						rowlength++;
					}
					if ($row)
						$tab.append($row);

					$dlg.dialog({
						modal: true,
						closeOnEscape: false,
						closeText: "hide"
					});

				} else if (toSquare.owner == this.thisPlayer.rack
						   || toSquare.owner == this.swapRack) {
					tile.letter = ' ';
					toSquare.refreshDOM();
				}
			}
			toSquare.placeTile(tile);
			if (!this.boardLocked)
				window.setTimeout(() => this.updateGameStatus(), 500);
		}

		updateGameStatus() {
			$('#move').empty();
			this.updateTileCounts();
			if (this.placedCount > 0) {
				// Player has dropped some tiles on the board
				// (tileCount > 0), move action is to make the move
				this.setMoveAction('commitMove', 'Make move');
				let move = this.game.board.analyseMove();
				if (typeof move === "string") {
					$('#move').append($.i18n(move));
					$('#turnButton').attr('disabled', 'disabled');
				} else {
					const $score = $(`<div>score: ${move.score}</div>`);
					$('#move').append($score);
					for (const word of move.words)
						$('#move').append(`<div>${word.word} ${word.score}</div>`);
					$('#turnButton').removeAttr('disabled');
				}

				// Use visibility and not display to keep the layout stable
				$('#takeBackButton').css('visibility', 'inherit');
				$('#swapRack').hide();
			} else if (this.swapRack.squaresUsed() > 0) {
				// Swaprack has tiles on it, change the move action
				// to swap
				this.setMoveAction('swap', 'Swap tiles');
				$('#board .ui-droppable').droppable('disable');
				$('#turnButton').removeAttr('disabled');
				$('#takeBackButton').css('visibility', 'inherit');
			} else {
				// Otherwise turn action is a pass
				this.setMoveAction('pass', 'Pass');
				$('#board .ui-droppable').droppable('enable');
				$('#turnButton').removeAttr('disabled');
				$('#takeBackButton').css('visibility', 'hidden');
			}
		}

		/**
		 * Set board locked status. The board is locked when it's
		 * not this player's turn.
		 */
		lockBoard(newVal) {
			if (newVal)
				$('#turnButton').attr('disabled', 'disabled');
			else
				$('#turnButton').removeAttr('disabled');
			this.boardLocked = newVal;
			this.game.board.refreshDOM();
		}

		/**
		 * Process a Turn object received to show the result of a
		 * command.
		 * @param turn a Turn
		 */
		processTurn(turn) {
			console.debug('Turn ', turn);
			this.appendTurnToLog(turn);
			this.scrollLogToEnd(300);
            this.removeMoveActionButtons();
			let player = this.game.players[turn.player];
			player.score += turn.deltaScore;
			player.refreshDOM();
			$(".lastPlacement").removeClass("lastPlacement");

			switch (turn.type) {
			case 'challenge-won':
			case 'took-back':
				// Move new tiles out of challenged player's rack
				// into the bag
				for (let newTile of turn.newTiles) {
					const tile = player.rack.removeTile(newTile);
					this.game.letterBag.returnTile(tile);
				}

				// Take back the placements from the board into the
				// challenged player's rack
				for (const placement of turn.move.placements) {
					let square = this.game.at(placement.col, placement.row);
					const recoveredTile = square.tile;
					square.placeTile(null);
					player.rack.addTile(recoveredTile);
				}

				// Refresh rack, if it's us
				if (this.isPlayer(turn.player)) {
					player.rack.refreshDOM();
					if (turn.type === 'challenge-won') {
						this.playAudio("oops");
						this.notify(
							$.i18n('notify-title-challenged'),
							$.i18n('notify-body-challenged',
								   this.game.players[turn.challenger].name,
								   -turn.score));
					}
				}

				if (turn.type == 'took-back') {
					this.notify(
						$.i18n('notify-title-retracted'),
						$.i18n('notify-body-retracted',
							   this.game.players[turn.challenger].name));
				}
				break;

			case 'challenge-failed':
				if (this.isPlayer(turn.player)) {
					this.playAudio("oops");
					this.notify(
						$.i18n('notify-title-you-failed'),
						$.i18n('notify-body-you-failed'));
				} else {
					this.playAudio("oops");
					this.notify(
						$.i18n('notify-title-they-failed'),
						$.i18n('notify-body-they-failed', player.name));
				}
				break;

			case 'move':
				if (!this.isPlayer(turn.player)) {
					// Put the tiles placed in a turn into place on
					// the board for a player who is not this player.
					for (let placement of turn.move.placements) {
						let square = this.game.at(placement.col, placement.row);
						player.rack.removeTile(placement);
						square.placeTile(placement, true); // lock it down
						// Highlight it as just placed
						let $div = $(`#Board_${placement.col}x${placement.row}`);
						$div.addClass("lastPlacement");
					}
				}

				// Add new tiles to the rack once board placements are done
				for (let newTile of turn.newTiles)
					player.rack.addTile(newTile);

				if (this.isPlayer(turn.player))
					player.rack.refreshDOM();

				// Shrink the bag by the number of placed tiles. This is purely
				// to keep the counts in synch, we never use tiles taken
				// from the bag on the client side.
				this.game.letterBag.getRandomTiles(
					this.game.letterBag.remainingTileCount() - turn.leftInBag);
				break;
			}

			if (this.isPlayer(turn.nextToGo)) {
				this.playAudio("yourturn");
				if (turn.timeout)
					this.startCountdown(turn.timeout);
				this.lockBoard(false);
			} else
				this.lockBoard(true);

			if (typeof turn.nextToGo === 'number'
				&& turn.type !== 'challenge-won') {

				this.updateWhosTurn(turn.nextToGo);
				if (turn.type == 'move')
					this.addTakeBackPreviousButton(turn);

				if (this.isPlayer(turn.nextToGo)
					&& turn.type !== 'took-back') {
					// It's our turn, and we didn't just take back
					this.notify($.i18n('notify-title-your-turn'),
								$.i18n('notify-body-your-turn',
									   this.game.players[turn.player].name));

					if (turn.type === 'move')
						this.addChallengePreviousButton(turn);
				}
			}
			this.game.whosTurn = turn.nextToPlay;
			this.updateGameStatus();
		}

		/**
		 * After a move, remove the move information and lock the board
		 * until it's our turn again
		 */
		afterMove() {
			this.removeMoveActionButtons();
			$('#move').empty();
			this.lockBoard(true);
		}

		/**
		 * Add an action button that affects a previous move to the log
		 * pane.
		 */
		addLastMoveActionButton(action, label) {
			let $button =
				$(`<div><button class='moveAction'>${label}</button></div>`);
			$button.click(() => this[action]());
			$('#log div.moveScore').last().append($button);
		}

		/**
		 * Add a "Challenge" button to the log pane to challenge the last
		 * player's move (if it wasn't us)
		 */
		addChallengePreviousButton(turn) {
			if (this.isPlayer(turn.player))
				return;
			this.addLastMoveActionButton(
				'challenge', $.i18n('button-challenge'));
		}

		/**
		 * Add a "Take back" button to the log pane to take back
		 * (this player's) previous move.
		 */
		addTakeBackPreviousButton(turn) {
			if (this.isPlayer(turn.player))
				// It's us!
				this.addLastMoveActionButton(
					'takeBackMove', $.i18n('button-take-back'));
		}

		/**
		 * Remove any action buttons from the log pane.
		 */
		removeMoveActionButtons() {
			$('button.moveAction').remove();
		}

		/**
		 * Action on "Challenge" button clicked
		 */
		challenge() {
			this.takeBackTiles();
			this.afterMove();
			this.sendCommand('challenge');
		}

		/**
		 * Handler for the "Make Move" button. Invoked via 'makeMove'.
		 */
		commitMove() {
			let move = this.game.board.analyseMove();
			if (typeof move === "string") {
				// fatal - should never get here
				$('#problemDialog')
				.text($.i18n(move))
				.dialog();
				return;
			}
			this.afterMove();
			if (move.bonus > 0)
				this.playAudio("bonusCheer");

			for (let i = 0; i < move.placements.length; i++) {
				let tilePlaced = move.placements[i];
				let square = this.game.at(tilePlaced.col, tilePlaced.row);
				square.tileLocked = true;
				square.refreshDOM();
			}
			this.placedCount = 0;
			this.sendCommand('makeMove', move);

			this.enableNotifications();
		}

		/**
		 * Handler for the "Take back" button clicked. Invoked via 'makeMove'.
		 */
		takeBackMove() {
			this.takeBackTiles();
			this.afterMove();
			this.sendCommand('takeBack');
		}

		/**
		 * Handler for the "Pass" button clicked. Invoked via 'makeMove'.
		 */
		pass() {
			this.takeBackTiles();
			this.afterMove();
			this.sendCommand('pass');
		}

		/**
		 * Handler for the "Swap" button clicked. Invoked via 'makeMove'.
		 */
		swap() {
			this.afterMove();
			let tiles = this.swapRack.tiles();
			this.swapRack.empty();
			this.sendCommand(
				'swap',
				tiles,
				data => this.handleMoveResponse(data));
		}

		/**
		 * Set the action when the turn button is pressed.
		 * @param action function name e.g. commitMove
		 * @param title button text
		 */
		setMoveAction(action, title) {
			$('#turnButton')
			.data('action', action)
			.empty()
			.append(title);
		}

		/**
		 * Handler for a click on the 'Make Move' button. This button
		 * may be associated with different actions depending on the
		 * state, through the 'data-action' attribute.
		 * 'commitMove' will send the current tile placements to the server
		 * 'swap' will sawp the tiles currently on the swap rack
		 * 'pass' will pass the current move (set when no tiles are placed)
		 * This action will map to the matching function in 'this'.
		 */
		makeMove() {
			let action = $('#turnButton').data('action');
			console.debug('makeMove =>', action);
			this[action]();
		}

		/**
		 * Handler for a click on the 'Take Back' button
		 */
		takeBackTiles() {
			const freeRackSquares = [];
			this.thisPlayer.rack.forEachSquare(square => {
				if (!square.tile)
					freeRackSquares.push(square);
			});

			function putBackToRack(tile) {
				let square = freeRackSquares.pop();
				square.tile = tile;
				if (tile.isBlank)
					tile.letter = ' ';
				square.refreshDOM();
			}

			this.game.board.forEachSquare(boardSquare => {
				if (boardSquare.tile && !boardSquare.tileLocked) {
					putBackToRack(boardSquare.tile);
					boardSquare.tile = null;
					this.placedCount--;
					boardSquare.refreshDOM();
				}
			});

			this.swapRack.forEachSquare(square => {
				if (square.tile) {
					putBackToRack(square.tile);
					square.tile = null;
					square.refreshDOM();
				}
			});
			this.updateGameStatus();
		}

		/**
		 * Handler for click on the 'Shuffle' button
		 */
		shuffleRack() {
			this.thisPlayer.rack.shuffle().refreshDOM();
		}

		// TODO: look at HTML5 notifications API
		enableNotifications() {
			// must be called in response to user action
			if (window.webkitNotifications) {
				console.debug('notification permission:',
							  window.webkitNotifications.checkPermission());
				if (window.webkitNotifications.checkPermission() != 0) {
					console.debug('requesting notification permission');
					window.webkitNotifications.requestPermission();
				}
			}
		}

		// TODO: either use HTML5 Notification API, or
		// provide this feedback some other way
		notify(title, text) {
			if (window.webkitNotifications) {
				this.cancelNotification();
				let notification = window.webkitNotifications
					.createNotification('favicon.ico', title, text);
				this.notification = notification;
				$(notification)
				.on('click', function () {
					this.cancel();
				})
				.on('close', () => {
					delete this.notification;
				});
				notification.show();
			}
		}

		cancelNotification() {
			if (this.notification) {
				this.notification.cancel();
				delete this.notification;
			}
		}
	}

	return Ui;
});
