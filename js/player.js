var Player = OZ.Class();

Player.prototype.init = function(id) {
	this._id = id;
}

Player.prototype.getId = function() {
	return this._id;
}

Player.prototype.play = function(board, callback) {}

/**/

Player.UI = OZ.Class().extend(Player);

Player.UI.prototype.init = function(id) {
	Player.prototype.init.call(this, id);
	this._callback = null;
	this._board = null;
	this._event = null;
}

Player.UI.prototype.play = function(board, callback) {
	this._board = board;
	this._callback = callback;
	this._event = OZ.Event.add(null, "board-click", this._click.bind(this));
}

Player.UI.prototype._click = function(e) {
	var x = e.data.x;
	var y = e.data.y;
	var id = this._board.getPlayer(x, y);
	if (id && id != this._id) { return; }
	OZ.Event.remove(this._event);
	this._callback(x, y);
}

/**/

Player.AI = OZ.Class().extend(Player);

Player.AI.prototype.play = function(board, callback) {
	var avail = [];
	var bestScore = 0;
	var w = board.getWidth();
	var h = board.getHeight();
	var max = w*h;

	for (var i=0;i<w;i++) {
		for (var j=0;j<h;j++) {
			var id = board.getPlayer(i, j);
			if (id && id != this._id) { continue; }

			var clone = board.clone();
			var score = this._simulate(clone, i, j, max);
			if (score > bestScore) { 
				avail = [];
				bestScore = score; 
			}
			if (score == bestScore) { avail.push([i, j]); }
			
			if (score == max) { /* best possible, stop iterating */ 
				j = h;
				i= w;
			}
		}
	}
	var value = avail[Math.floor(Math.random()*avail.length)];
	setTimeout(function() { callback(value[0], value[1]); }, 0);
}

Player.AI.prototype._simulate = function(board, x, y, max) {
	board.setAtoms(x, y, board.getAtoms(x, y)+1, this._id);
	while (board.hasCriticals() && board.getScore(this._id) < max) { board.react(); }
	return board.getScore(this._id);
}
