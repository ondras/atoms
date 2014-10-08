var Board = function(width, height) {
	this._width = width;
	this._height = height;
	this._data = [];
	this._criticals = [];
	this._score = [];
	
	for (var i=0;i<width;i++) {
		this._data.push([]);
		for (var j=0;j<height;j++) {
			var obj = {
				atoms: 0,
				threshold: 4,
				player: -1
			};
			if (j==0 || j+1 == height) { obj.threshold--; }
			if (i==0 || i+1 == width) { obj.threshold--; }
			this._data[i].push(obj);
		}
	}
}

Board.DIRS = [
	[ 0,  1],
	[ 0, -1],
	[ 1,  0],
	[-1,  0]
];

Board.prototype.clone = function() {
	var clone = new this.constructor(this._width, this._height);
	for (var i=0;i<this._width;i++) {
		for (var j=0;j<this._height;j++) {
			clone._data[i][j].atoms = this._data[i][j].atoms;
			clone._data[i][j].player = this._data[i][j].player;
		}
	}
	clone._criticals = this._criticals.slice();
	clone._score = this._score.slice();
	return clone;
}

Board.prototype.getScore = function(player) {
	return this._score[player];
}

Board.prototype.getWinner = function() {
	var max = this._width * this._height;
	for (var i=0;i<this._score.length;i++) {
		if (this._score[i] == max) { return i; }
	}
	return -1;
}

Board.prototype.getWidth = function() { 
	return this._width;
}

Board.prototype.getHeight = function() { 
	return this._height;
}

Board.prototype.getPlayer = function(xy) {
	return this._data[xy.x][xy.y].player;
}

Board.prototype.getAtoms = function(xy) {
	return this._data[xy.x][xy.y].atoms;
}

/**
 * @returns {bool} is critical?
 */
Board.prototype.setAtoms = function(xy, atoms, player) {
	var wasCritical = this.isCritical(xy);
	var wasPlayer = this.getPlayer(xy);
	this._data[xy.x][xy.y].atoms = atoms;
	this._data[xy.x][xy.y].player = player;
	
	/* adjust scores */
	if (wasPlayer != player) {
		if (!this._score[player]) { this._score[player] = 0; }
		this._score[player]++;
		if (wasPlayer > -1) { this._score[wasPlayer]--; }
	}
	
	/* adjust criticals */
	var isCritical = this.isCritical(xy);
	if (isCritical == wasCritical) { return; }
	
	if (isCritical) { 
		this._criticals.push(xy);
	} else if (wasCritical) {
		this._criticals = this._criticals.filter(function(critical) {
			return !critical.is(xy);
		});
	}	
}

Board.prototype.hasCriticals = function() {
	return (this._criticals.length > 0);
}

Board.prototype.isCritical = function(xy) {
	return this._data[xy.x][xy.y].atoms > this._data[xy.x][xy.y].threshold;
}

Board.prototype.react = function() {
	var changed = [];

	if (!this._criticals.length) { return changed; }

	var explode = this._criticals[0];

	var player = this.getPlayer(explode);
	var count = 0;

	for (var i=0;i<Board.DIRS.length;i++) {
		var dir = Board.DIRS[i];
		var xy = explode.plus(new XY(dir[0], dir[1]));
		if (!this.isValid(xy)) { continue; }
		count++;
		this.setAtoms(xy, this.getAtoms(xy)+1, player);
		changed.push(xy);
	}
	
	this.setAtoms(explode, this.getAtoms(explode) - count, player);
	changed.push(explode);

	return changed;
}

Board.prototype.isValid = function(xy) {
	return (xy.x >= 0 && xy.y >= 0 && xy.x < this._width && xy.y < this._height);
}
