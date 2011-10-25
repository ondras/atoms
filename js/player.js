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
	var player = this._board.getPlayer(x, y);
	if (player > -1 && player != this._number) { return; }
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

/**/
Player.Remote = OZ.Class();

Player.Remote.prototype.init = function(number, name, socket) {
	Player.prototype.init.call(this, number, name);
	this._callback = null;
	this._socket = socket;
	this._event = null;
}

Player.Remote.prototype.play = function(board, callback) {
	this._callback = callback;
	this._event = OZ.Event.addListener(this._socket, "message", this._message.bind(this));
}

Player.Remote.prototype._message = function(e) {
	OZ.Event.remove(this._event);

	var data = JSON.parse(e.data);
	switch (data.type) {
		case "error":
			alert(data.message);
		break;
		
		case "round":
			this._callback(data.x, data.y);	
		break;
		
		default:
			throw new Error("Unknown message type " + data.type);
		break;
	}
}
