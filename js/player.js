var Player = OZ.Class();
Player.prototype.init = function(number, name) {
	this._number = number;
	this._name = name;
}

Player.prototype.getName = function() {
	return this._name;
}

Player.prototype.play = function(board, callback) {}

/**/

Player.UI = OZ.Class().extend(Player);
Player.UI.prototype.init = function(number, name) {
	Player.prototype.init.call(this, number, name);
	this._callback = null;
	this._board = null;
	this._events = [];
	this._canvas = null;
}

Player.UI.prototype.play = function(board, callback) {
	this._board = board;
	this._callback = callback;
	this._events.push(OZ.Event.add(null, "board-click", this._click.bind(this)));
	this._events.push(OZ.Event.add(null, "board-mouse", this._mouse.bind(this)));
	if (this._canvas) { this._syncCursor(this._canvas); }
}

Player.UI.prototype._click = function(e) {
	this._canvas = e.target;
	var cursor = e.target.getCursor();
	var x = cursor[0];
	var y = cursor[1];
	
	if (!this._board.isValid(x, y)) { return; }
	var player = this._board.getPlayer(x, y);
	if (player > -1 && player != this._number) { return; }

	while (this._events.length) { OZ.Event.remove(this._events.pop()); }
	this._canvas.getCanvas().style.cursor = "";
	this._callback(x, y);
}

Player.UI.prototype._mouse = function(e) {
	this._syncCursor(e.target);
}

Player.UI.prototype._syncCursor = function(canvas) {
	this._canvas = canvas;
	var cursor = canvas.getCursor();
	var x = cursor[0];
	var y = cursor[1];

	if (!this._board.isValid(x, y)) { return; }
	var player = this._board.getPlayer(x, y);
	var canvas = canvas.getCanvas();
	
	canvas.style.cursor = (player > -1 && player != this._number ? "" : "pointer");
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
			var player = board.getPlayer(i, j);
			if (player > -1 && player != this._number) { continue; }

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
	board.setAtoms(x, y, board.getAtoms(x, y)+1, this._number);
	while (board.hasCriticals() && board.getScore(this._number) < max) { board.react(); }
	return board.getScore(this._number);
}
