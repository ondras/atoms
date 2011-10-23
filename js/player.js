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
	var w = board.getWidth();
	var h = board.getHeight();
	for (var i=0;i<w;i++) {
		for (var j=0;j<h;j++) {
			var id = board.getPlayer(i, j);
			if (id && id != this._id) { continue; }
			avail.push([i, j]);
		}
	}
	
	var value = avail[Math.floor(Math.random()*avail.length)];
	setTimeout(function() { callback(value[0], value[1]); }, 0);
}
