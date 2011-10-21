var Atoms = OZ.Class();

Atoms.prototype.init = function() {
	this._board = new Board(6, 6);
	this._canvas = new Canvas();
	
	this._players = [new Player.AI("a"), new Player.AI("b")];
	this._currentPlayer = null;
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
}
