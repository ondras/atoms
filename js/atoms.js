var Atoms = OZ.Class();
Atoms.prototype.init = function() {
	this._board = new Board(3, 3);
	
	this._players = [];
	this._colors = ["blue", "red", "green", "yellow"];
	this._canvas = new Canvas(this._board, 80, 80, this._colors);
	
	this._currentName = OZ.DOM.elm("h1");
	this._scoreContainer = OZ.DOM.elm("h1");
	this._scores = [];
	this._reactionDelay = 200;

	document.body.appendChild(this._currentName);
	document.body.appendChild(this._scoreContainer);
	document.body.appendChild(this._canvas.getCanvas());

	this._canvas.prepare();
	this._currentPlayer = -1;	
}

Atoms.prototype.start = function() {}

Atoms.prototype._addPlayer = function(player) {
	if (this._players.length) {
		this._scoreContainer.appendChild(OZ.DOM.elm("span", {innerHTML:" : "}));
	}
	var score = OZ.DOM.elm("span", {innerHTML:"0", color:this._colors[this._players.length]});
	this._scoreContainer.appendChild(score);
	this._scores.push(score);
	
	this._players.push(player);
	return this;
}

Atoms.prototype._loop = function() {
	this._updateScore();

	var canvas = this._canvas.getCanvas();
	OZ.DOM.removeClass(canvas, "current-"+this._currentPlayer);
	
	do { /* find next playing player */
		this._currentPlayer = (this._currentPlayer+1) % this._players.length;
	} while (!this._players[this._currentPlayer]);

	OZ.DOM.addClass(canvas, "current-"+this._currentPlayer);
	
	this._currentName.innerHTML = this._players[this._currentPlayer].getName();
	this._currentName.style.color = this._colors[this._currentPlayer];
	this._players[this._currentPlayer].play(this._board, this._playerCallback.bind(this));
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

Atoms.prototype._playerCallback = function(x, y) {
	var number = this._board.getPlayer(x, y);
	if (number > -1 && number != this._currentPlayer) { 
		throw new Error("Player " + this._currentPlayer + " made an illegal move to " + [x, y]);
	}
	
	this._board.setAtoms(x, y, this._board.getAtoms(x, y)+1, this._currentPlayer);
	this._canvas.draw(x, y);
	this._check();
}

Atoms.prototype._check = function() {
	this._updateScore();
	var winner = this._board.getWinner();
	
	if (winner > -1) {
		this._announceWinner(winner);
		return;
	}
	
	if (this._board.hasCriticals()) {
		setTimeout(this._react.bind(this), this._reactionDelay);
		return;
	}
	
	this._loop();
}

Atoms.prototype._announceWinner = function(winner) {
	alert("Winner is " + this._players[winner].getName());
}

Atoms.prototype._react = function() {
	var changed = this._board.react();
	for (var i=0;i<changed.length;i++) {
		this._canvas.draw(changed[i][0], changed[i][1]);
	}
	this._check();
}

/**/

Atoms.Local = OZ.Class().extend(Atoms);
Atoms.Local.prototype.init = function() {
	Atoms.prototype.init.call(this);
	this.addPlayerAI("A");
	this.addPlayerAI("B");	
	this.addPlayerAI("C");	
}

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
	this._loop();
}

/**/

Atoms.Multiplayer = OZ.Class().extend(Atoms);
Atoms.Multiplayer.URL = "ajax/";
Atoms.Multiplayer.prototype.init = function(game, players, name) {
	Atoms.prototype.init.call(this);
	this._socket = null;
	this._event = null;

	this._createData = {
		game: game,
		players: players,
		name: name,
		type: "setup"
	};
}

Atoms.Multiplayer.prototype.start = function() {
	this._socket = new Socket(Atoms.Multiplayer.URL).send(this._createData);
	this._event = OZ.Event.add(this._socket, "message", this._message.bind(this));
}

Atoms.Multiplayer.prototype._message = function(e) {
	OZ.Event.remove(this._event);
	var data = JSON.parse(e.data);
	
	switch (data.type) {
		case "error":
			alert(data.message);
		break;
		
		case "create":
			this._create(data);
		break;
		
		default:
			throw new Error("Unknown message type " + data.type);
		break;
	}
}

/** 
 * Create game based on server definition of players
 */
Atoms.Multiplayer.prototype._create = function(data) {
	for (var i=0;i<data.names.length;i++) {
		if (i == data.index) {
			var player = new Player.UI(i, data.names[i]);
		} else {
			var player = new Player.Remote(i, data.names[i], this._socket);
		}
		this._addPlayer(player);
	}
	
	this._loop();
}

Atoms.Multiplayer.prototype._announceWinner = function(winner) {
	if (this._players[winner] instanceof Player.UI) { this._socket.send({type:"close"}); }
	Atoms.prototype._announceWinner.call(this, winner);
}

Atoms.Multiplayer.prototype._playerCallback = function(x, y) {
	if (this._players[this._currentPlayer] instanceof Player.UI) {
		var data = {
			type: "round", 
			x: x,
			y: y
		};
		this._socket.send(data);
	}
	Atoms.prototype._playerCallback.call(this, x, y);
}
