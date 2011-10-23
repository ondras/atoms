var Atoms = OZ.Class();

Atoms.prototype.init = function() {
	this._board = new Board(6, 6);
	this._canvas = new Canvas(this._board, 100, 100);
	document.body.appendChild(this._canvas.getCanvas());
	
	this._players = [new Player.UI("a"), new Player.AI("b")];
	this._canvas.definePlayerColor("a", "blue");
	this._canvas.definePlayerColor("b", "red");
	this._canvas.prepare();
	
	this._currentPlayer = null;
	
	this._loop();
}

Atoms.prototype._loop = function() {
	this._currentPlayer = this._players.shift();
	this._players.push(this._currentPlayer);
	this._currentPlayer.play(this._board, this._playerCallback.bind(this));
}

Atoms.prototype._playerCallback = function(x, y) {
	var id = this._board.getPlayer(x, y);
	var currentId = this._currentPlayer.getId();
	if (id && id != currentId) { 
		throw new Error("Player " + currentId + " made an illegal move to " + [x, y]);
	}
	
	var atoms = this._board.getAtoms(x, y);
	this._board.setAtoms(x, y, atoms+1, currentId);
	this._canvas.draw(x, y);
	this._check();
}

Atoms.prototype._check = function() {
	var winner = this._board.getWinner();
	
	if (winner) {
		alert("Winner is " + winner);
		return;
	}
	
	if (this._board.hasCriticals()) {
		setTimeout(this._react.bind(this), 200);
		return;
	}
	
	this._loop();
}

Atoms.prototype._react = function() {
	var changed = this._board.react();
	for (var i=0;i<changed.length;i++) {
		this._canvas.draw(changed[i][0], changed[i][1]);
	}
	this._check();
}
