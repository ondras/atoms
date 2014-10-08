var Player = function(number, name) {
	this._number = number;
	this._name = name;
	this._resolve = null; /* returned promise's resolve */
}

Player.prototype.getName = function() {
	return this._name;
}

Player.prototype.play = function(board, callback) {
	return new Promise();
}

/**/

Player.UI = function(number, name) {
	Player.call(this, number, name);
	this._callback = null;
	this._board = null;
	this._canvas = null;
}
Player.UI.prototype = Object.create(Player.prototype);

Player.UI.prototype.play = function(board, callback) {
	this._board = board;
	subscribe("board-click", this);
	subscribe("board-mouse", this);
	if (this._canvas) { this._syncCursor(this._canvas); }

	return new Promise(function(resolve, reject) {
		this._resolve = resolve;
	}.bind(this));
}

Player.UI.prototype.handleMessage = function(message, publisher, data) {
	switch (message) {
		case "board-click":
			this._click(publisher);
		break;
		case "board-mouse":
			this._syncCursor(publisher);
		break;
	}
}

Player.UI.prototype._click = function(canvas) {
	this._canvas = canvas;
	var cursor = this._canvas.getCursor();

	if (!this._board.isValid(cursor)) { return; }
	var player = this._board.getPlayer(cursor);
	if (player > -1 && player != this._number) { return; }

	unsubscribe("board-click", this);
	unsubscribe("board-mouse", this);

	this._canvas.getCanvas().style.cursor = "";
	this._resolve(cursor);
	this._resolve = null;
}

Player.UI.prototype._syncCursor = function(canvas) {
	this._canvas = canvas;
	var cursor = canvas.getCursor();

	if (!this._board.isValid(cursor)) { return; }
	var player = this._board.getPlayer(cursor);
	var canvas = canvas.getCanvas();
	
	canvas.style.cursor = (player > -1 && player != this._number ? "" : "pointer");
}

/**/

Player.AI = function() {
	Player.apply(this, arguments);
}
Player.AI.prototype = Object.create(Player.prototype);

Player.AI.prototype.play = function(board) {
	var avail = [];
	var bestScore = 0;
	var w = board.getWidth();
	var h = board.getHeight();
	var max = w*h;

	for (var i=0;i<w;i++) {
		for (var j=0;j<h;j++) {
			var xy = new XY(i, j)
			var player = board.getPlayer(xy);
			if (player > -1 && player != this._number) { continue; }

			var clone = board.clone();
			var score = this._simulate(clone, xy, max);
			if (score > bestScore) { 
				avail = [];
				bestScore = score; 
			}
			if (score == bestScore) { avail.push(xy); }
			
			if (score == max) { /* best possible, stop iterating */ 
				j = h;
				i = w;
			}
		}
	}
	
	var value = avail[Math.floor(Math.random()*avail.length)];

	return Promise.resolve(value);
}

Player.AI.prototype._simulate = function(board, xy, max) {
	board.setAtoms(xy, board.getAtoms(xy)+1, this._number);
	while (board.hasCriticals() && board.getScore(this._number) < max) { board.react(); }
	return board.getScore(this._number);
}
