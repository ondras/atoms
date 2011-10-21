var Board = OZ.Class();

Board.DIRS = [
	[ 0,  1],
	[ 0, -1],
	[ 1,  0],
	[-1,  0]
];

Board.prototype.init = function(width, height) {
	this._width = width;
	this._height = height;
	this._data = [];
	for (var i=0;i<width;i++) {
		this._data.push([]);
		for (var j=0;j<height;j++) {
			this._data[i].push({atoms:0, player:null}):
		}
	}
}

Board.prototype.getWinner = function() {
	var players = [];
	for (var i=0;i<this._width;i++) {
		for (var j=0;j<this._height;j++) {
			var id = this._getPlayer(i, j);
			if (players.indexOf(id) == -1) { players.push(id); }
		}
	}
	
	return (players.length == 1 ? player[0] : null);
}

Board.prototype.isValid = function(x, y) {
	return (x >= 0 && y >= 0 && x < this._width && y < this._height);
}

Board.prototype.getWidth = function() { 
	return this._width;
}

Board.prototype.getHeight = function() { 
	return this._height;
}

Board.prototype.getPlayer = function(x, y) {
	return this._data[x][y].player;
}

Board.prototype.getAtoms = function(x, y) {
	return this._data[x][y].atoms;
}

Board.prototype.setAtoms = function(x, y, atoms, player) {
	this._data[x][y].atoms = atoms;
	this._data[x][y].player = player;
}

