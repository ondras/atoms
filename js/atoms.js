var Atoms = function() {
	this._board = new Board(6, 6);
	this._audio = new Audio();
	
	this._players = [];
	this._colors = ["blue", "red", "green", "orange"];
	this._canvas = new Canvas(this._board, 80, 80, this._colors);
	
	var table = document.createElement("table");
	table.id = "score";
	table.innerHTML = "<tbody><tr></tr><tr></tr></tbody>";
	this._scoreContainer = table;
	this._scores = [];
	this._names = [];
	this._reactionDelay = 200;

	document.body.appendChild(this._scoreContainer);
	document.body.appendChild(this._canvas.getCanvas());

	this._canvas.prepare();

	this._currentPlayer = -1;	
}

Atoms.prototype.start = function() {}

Atoms.prototype._addPlayer = function(player) {
	var tr1 = this._scoreContainer.querySelectorAll("tr")[0];
	var tr2 = this._scoreContainer.querySelectorAll("tr")[1];
	if (this._players.length) {
		var td = document.createElement("td");
		td.innerHTML = ":";
		tr1.appendChild(td);
		var td = document.createElement("td");
		td.innerHTML = ":";
		tr2.appendChild(td);
	}

	var color = this._colors[this._players.length];
	var name = document.createElement("td");
	name.style.color = color;
	name.innerHTML = player.getName();
	var score = document.createElement("td");
	score.style.color = color;
	score.innerHTML = 0;

	tr1.appendChild(name);
	tr2.appendChild(score);
	this._names.push(name);
	this._scores.push(score);
	
	this._players.push(player);
	return this;
}

Atoms.prototype._nextPlayer = function() {
	this._updateScore();
	if (this._currentPlayer > -1) { this._names[this._currentPlayer].style.textDecoration = ""; }

	do { /* find next playing player */
		this._currentPlayer = (this._currentPlayer+1) % this._players.length;
	} while (!this._players[this._currentPlayer]);

	if (this._currentPlayer > -1) { this._names[this._currentPlayer].style.textDecoration = "underline"; }
	this._players[this._currentPlayer].play(this._board).then(this._playerCallback.bind(this));
}

Atoms.prototype._updateScore = function() {
	var zeros = [];
	var total = 0;
	var max = this._board.getWidth() * this._board.getHeight();
	
	for (var i=0;i<this._players.length;i++) { 
		var score = this._board.getScore(i) || 0;
		total += score;
		this._scores[i].innerHTML = score;
		if (score == 0) { zeros.push(i); }
	}
	
	if (total == max) { /* disable players with score=0 */
		while (zeros.length) { this._players[zeros.pop()] = null; }
	}
}

Atoms.prototype._playerCallback = function(xy) {
	var number = this._board.getPlayer(xy);
	if (number > -1 && number != this._currentPlayer) { 
		throw new Error("Player " + this._currentPlayer + " made an illegal move to " + xy);
	}
	
	this._board.setAtoms(xy, this._board.getAtoms(xy)+1, this._currentPlayer);
	this._canvas.draw(xy);
	this._check(0);
}

Atoms.prototype._check = function(depth) {
	this._updateScore();
	var winner = this._board.getWinner();
	
	if (winner > -1) {
		this._announceWinner(winner);
		return;
	}
	
	if (this._board.hasCriticals()) {
		setTimeout(this._react.bind(this, depth), this._reactionDelay);
		return;
	}
	
	this._nextPlayer();
}

Atoms.prototype._announceWinner = function(winner) {
	this._audio.stop(); 
	alert("Winner: " + this._players[winner].getName());
}

Atoms.prototype._react = function(depth) {
	if (this._reactionDelay) { 
		this._audio.play(depth); 
		setTimeout(function() { this._audio.stop(); }.bind(this), this._reactionDelay * 0.5);
	}

	var changed = this._board.react();
	for (var i=0;i<changed.length;i++) {
		this._canvas.draw(changed[i]);
	}
	this._check(depth+1);
}

/**/

Atoms.Local = function() {
	Atoms.call(this);
}
Atoms.Local.prototype = Object.create(Atoms.prototype);

Atoms.Local.prototype.addPlayerUI = function(name) {
	var player = new Player.UI(this._players.length, name);
	return this._addPlayer(player);
}

Atoms.Local.prototype.addPlayerAI = function(name) {
	var player = new Player.AI(this._players.length, name);
	return this._addPlayer(player);
}

Atoms.Local.prototype.start = function() {
	var allAI = true;
	for (var i=0;i<this._players.length;i++) {
		if (!(this._players[i] instanceof Player.AI)) { allAI = false; } 
	}
	if (allAI) { this._reactionDelay = 0; }
	this._nextPlayer();
}

/**/

Atoms.Multiplayer = function(game, players, name) {
	this._playerCount = players;
	this._playerName = name;

	this._abort = document.createElement("a");
	this._abort.href = ".";
	this._abort.style.display = "block";
	this._abort.innerHTML = "Waiting for all players... (click to abort)";
	document.body.appendChild(this._abort);

	Atoms.apply(this);

	this._refs = {};
	this._refs.game = new Firebase("https://atoms.firebaseio.com/" + game);
	this._refs.game.once("value", this._connectOK, this._connectFail, this);
}
Atoms.Multiplayer.prototype = Object.create(Atoms.prototype);

Atoms.Multiplayer.prototype._connectOK = function(snap) {
	var data = snap.val();

	if (!data) { /* first - configure player count */
		snap.ref().child("playerCount").set(this._playerCount);
	} else {
		var remotePlayerCount = data.playerCount;
		if (remotePlayerCount != this._playerCount) {
			this._error("The game is already set with " + remotePlayerCount + " players, sorry.");
			return;
		}
		if (Object.keys(data.players).length >= remotePlayerCount) {
			this._error("The game is already full, sorry.");
			return;
		}
	}

	var players = snap.ref().child("players");
	players.on("value", this._playersChange, this);
	this._refs.player = players.push(this._playerName);
}

Atoms.Multiplayer.prototype._connectFail = function(error) {
	this._error(e.message);
}

Atoms.Multiplayer.prototype._playersChange = function(snap) {
	var players = snap.val();
	if (Object.keys(players).length != this._playerCount) { return; } /* not enough players */

	/* let's start the game by creating player instances */
	var thisId = this._refs.player.name();
	var count = 0;
	for (var id in players) {
		var name = players[id];
		if (id == thisId) { /* this is our playa */
			var player = new Player.UI(count, name);
		} else { /* remote player */
			var player = new Player(count, name);
		}
		this._addPlayer(player);
		count++;
	}

	this._refs.lastTurn = this._refs.game.child("lastTurn");
	this._refs.currentPlayer = this._refs.game.child("currentPlayer");
	this._refs.currentPlayer.on("value", this._currentPlayerChange.bind(this));

	this._abort.parentNode.removeChild(this._abort);

	this._nextPlayer(); /* let the first player play */
}

Atoms.Multiplayer.prototype._error = function(reason) {
	alert(reason);
	location.reload();
}

Atoms.Multiplayer.prototype._currentPlayerChange = function(snap) {
	if (this._players[this._currentPlayer] instanceof Player.UI) { /* human played, ignore */

	} else { /* remote player played; retrieve turn and apply it */
		if (snap.val() === null) { return; } /* not set yet */
		this._refs.lastTurn.once("value", function(snap) {
			var val = snap.val();
			this._playerCallback(new XY(val.x, val.y));
		}, this);
	}
}

Atoms.Multiplayer.prototype._playerCallback = function(xy) {
	if (this._players[this._currentPlayer] instanceof Player.UI) {
		this._refs.game.child("lastTurn").set({x:xy.x, y:xy.y});
		var nextPlayer = (this._currentPlayer + 1) % this._players.length;
		this._refs.currentPlayer.set(nextPlayer);
	}
	Atoms.prototype._playerCallback.call(this, xy);
}

Atoms.Multiplayer.prototype._announceWinner = function(winner) {
	var player = this._players[winner];
	if (player instanceof Player.UI) { this._refs.game.onDisconnect().remove(); } /* erase game data */

	return Atoms.prototype._announceWinner.apply(this, arguments);
}
