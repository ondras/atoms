var Atoms = OZ.Class();
Atoms.prototype.init = function() {
	this._board = new Board(6, 6);
	
	this._players = [];
	this._colors = ["blue", "red", "green", "yellow"];
	this._canvas = new Canvas(this._board, 80, 80, this._colors);
	
	this._scoreContainer = OZ.DOM.elm("table", {id:"score", innerHTML:"<tbody><tr></tr><tr></tr></tbody>"});
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
	var tr1 = this._scoreContainer.getElementsByTagName("tr")[0];
	var tr2 = this._scoreContainer.getElementsByTagName("tr")[1];
	if (this._players.length) {
		tr1.appendChild(OZ.DOM.elm("td", {innerHTML:":"}));
		tr2.appendChild(OZ.DOM.elm("td", {innerHTML:":"}));
	}

	var color = this._colors[this._players.length];
	var name = OZ.DOM.elm("td", {innerHTML:player.getName(), color:color});
	var score = OZ.DOM.elm("td", {innerHTML:"0", color:color});

	tr1.appendChild(name);
	tr2.appendChild(score);
	this._names.push(name);
	this._scores.push(score);
	
	this._players.push(player);
	return this;
}

Atoms.prototype._loop = function() {
	this._updateScore();
	if (this._currentPlayer > -1) { this._names[this._currentPlayer].style.textDecoration = ""; }

	do { /* find next playing player */
		this._currentPlayer = (this._currentPlayer+1) % this._players.length;
	} while (!this._players[this._currentPlayer]);

	if (this._currentPlayer > -1) { this._names[this._currentPlayer].style.textDecoration = "underline"; }
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
	alert("Winner: " + this._players[winner].getName());
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
Atoms.Multiplayer.prototype.init = function(game, players, name, url) {
	Atoms.prototype.init.call(this);
	this._socket = new (window.WebSocket || window.MozWebSocket)(url);
	OZ.Event.add(this._socket, "message", this._message.bind(this));
	OZ.Event.add(this._socket, "open", this._open.bind(this));
	OZ.Event.add(this._socket, "error", this._error.bind(this));

	this._loading = OZ.DOM.elm("a", {href:"#", innerHTML:"Waiting for other players &hellip; click to abort"});

	this._createData = {
		game: game,
		players: players,
		name: name
	};
}

Atoms.Multiplayer.prototype._error = function(e) {
	alert("Websocket communication error");
}

Atoms.Multiplayer.prototype._open = function() {
	this._send("join", this._createData);
	
	var p = OZ.DOM.elm("p", {id:"loading"});
	p.appendChild(this._loading);
	var sc = this._scoreContainer;
	sc.parentNode.insertBefore(p, sc);
	OZ.Event.add(this._loading, "click", this._abort.bind(this));
}

Atoms.Multiplayer.prototype._send = function(type, data) {
	data.type = type;
	this._socket.send(JSON.stringify(data));
}

Atoms.Multiplayer.prototype._message = function(e) {
	var data = JSON.parse(e.data);
	
	switch (data.type) {
		case "error":
			alert(data.error);
		break;
		
		case "create":
			this._create(data);
		break;
		
		case "round":
			this._playerCallback(data.x, data.y);
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
	this._loading.innerHTML = "Abort the game";
	var i=0;
	for (var name in data.players) {
		if (name == this._createData.name) {
			var player = new Player.UI(i, name);
		} else {
			var player = new Player(i, name);
		}
		this._addPlayer(player);
		i++;
	}
	
	this._loop();
}

Atoms.Multiplayer.prototype._playerCallback = function(x, y) {
	if (this._players[this._currentPlayer] instanceof Player.UI) {
		var data = {
			x: x,
			y: y
		};
		this._send("round", data);
	}
	Atoms.prototype._playerCallback.call(this, x, y);
}

Atoms.Multiplayer.prototype._abort = function(e) {
	location.reload();
}
