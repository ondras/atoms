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
	this._criticals = [];
	this._score = {};
	
	for (var i=0;i<width;i++) {
		this._data.push([]);
		for (var j=0;j<height;j++) {
			var obj = {
				atoms: 0,
				threshold: 4,
				player: null
			};
			if (j==0 || j+1 == height) { obj.threshold--; }
			if (i==0 || i+1 == width) { obj.threshold--; }
			this._data[i].push(obj);
		}
	}
}

Board.prototype.clone = function() {
	var clone = new this.constructor(this._width, this._height);
	for (var i=0;i<this._width;i++) {
		for (var j=0;j<this._height;j++) {
			clone._data[i][j].atoms = this._data[i][j].atoms;
			clone._data[i][j].player = this._data[i][j].player;
		}
	}
	for (var i=0;i<this._criticals.length;i++) { clone.criticals.push(this._criticals[i]); }
	for (var player in this._score) { clone._score[player] = this._score[player]; }
	
	return clone;
}

Board.prototype.getScore = function(player) {
	return this._score[player] || 0;
}

Board.prototype.getWinner = function() {
	var players = [];
	for (var i=0;i<this._width;i++) {
		for (var j=0;j<this._height;j++) {
			var id = this.getPlayer(i, j);
			if (players.indexOf(id) == -1) { players.push(id); }
		}
	}

	return (players.length == 1 ? players[0] : null);
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

/**
 * @returns {bool} is critical?
 */
Board.prototype.setAtoms = function(x, y, atoms, player) {
	var wasCritical = this.isCritical(x, y);
	var wasPlayer = this.getPlayer(x, y);
	this._data[x][y].atoms = atoms;
	this._data[x][y].player = player;
	
	/* adjust scores */
	if (wasPlayer != player) {
		if (!(player in this._score)) { this._score[player] = 0; }
		this._score[player]++;
		if (wasPlayer) { this._score[wasPlayer]--; }
	}
	
	/* adjust criticals */
	var isCritical = this.isCritical(x, y);
	if (isCritical == wasCritical) { return; }
	
	if (isCritical) { 
		this._criticals[x+"-"+y] = [x, y];
	} else {
		delete this._criticals[x+"-"+y];
	}	
}

Board.prototype.hasCriticals = function() {
	for (var p in this._criticals) { return true; }
	return false;
}

Board.prototype.isCritical = function(x, y) {
	return this._data[x][y].atoms > this._data[x][y].threshold;
}

Board.prototype.react = function() {
	var todo = [];
	var changed = {};
	for (var p in this._criticals) { todo.push(this._criticals[p]); }
	if (!todo.length) { return []; }
	
	while (todo.length) {
		var coords = todo.pop();
		this._reactOne(coords[0], coords[1], changed);
	}
	
	var results = [];
	for (var p in changed) { results.push(changed[p]); }
	return results;
}

/**
 * Explode one field (must be critical!), record all changed fields in 'changed' object
 */
Board.prototype._reactOne = function(x, y, changed) {
	var player = this.getPlayer(x, y);
	var count = 0;

	for (var i=0;i<Board.DIRS.length;i++) {
		var dir = Board.DIRS[i];
		var xx = x + dir[0];
		var yy = y + dir[1];
		if (!this._isValid(xx, yy)) { continue; }
		count++;
		this.setAtoms(xx, yy, this.getAtoms(xx, yy)+1, player);
		changed[xx+"-"+yy] = [xx, yy];
	}
	
	this.setAtoms(x, y, this.getAtoms(x, y) - count, player);
	changed[x+"-"+y] = [x, y];
}

Board.prototype._isValid = function(x, y) {
	return (x >= 0 && y >= 0 && x < this._width && y < this._height);
}

