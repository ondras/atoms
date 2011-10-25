var Canvas = OZ.Class();
Canvas.atoms = [
	null,
	[[.5,  .5]],
	[[.25, .25], [.75, .75]],
	[[.25, .25], [.5,  .5],  [.75, .75]],
	[[.25, .25], [.25, .75], [.75, .75], [.75, .25]],
	[[.25, .25], [.25, .75], [.5,  .5],  [.75, .75], [.75, .25]],
	[[.25, .25], [.25, .5],  [.25, .75], [.75, .25], [.75, .5],  [.75, .75]],
	[[.25, .25], [.25, .5],  [.25, .75], [.5,  .5],  [.75, .25], [.75, .5],  [.75, .75]],
	[[.25, .25], [.25, .5],  [.25, .75], [.5,  .25], [.5,  .75], [.75, .25], [.75, .5],  [.75, .75]],
	[[.25, .25], [.25, .5],  [.25, .75], [.5,  .25], [.5,  .5],  [.5,  .75], [.75, .25], [.75, .5], [.75, .75]]
];

Canvas.prototype.init = function(board, cellWidth, cellHeight, colors) {
	this._board = board;
	this._cellWidth = cellWidth;
	this._cellHeight = cellHeight;
	this._colors = colors;
	this._padding = 1;
	this._hoverPlayer = -1;
	
	var bw = board.getWidth();
	var bh = board.getHeight();
	var width = bw * (cellWidth + 2*this._padding) + 2*this._padding;
	var height = bh * (cellHeight + 2*this._padding) + 2*this._padding;
	
	var canvas = OZ.DOM.elm("canvas", {width:width, height:height});
	this._ctx = canvas.getContext("2d");
	
	OZ.Event.add(canvas, "click", this._click.bind(this));
	OZ.Event.add(canvas, "mousemove", this._mouse.bind(this));
	OZ.Event.add(canvas, "mouseout", this._mouse.bind(this));
	OZ.Event.add(canvas, "mouseover", this._mouse.bind(this));
}

Canvas.prototype.prepare = function() {
	var bw = this._board.getWidth();
	var bh = this._board.getHeight();

	this._ctx.save();
	this._ctx.lineWidth = 2;
	this._ctx.beginPath();
	
	for (var i=0;i<=bw;i++) {
		this._ctx.moveTo(this._padding + i*(this._cellWidth + 2*this._padding), 0);
		this._ctx.lineTo(this._padding + i*(this._cellWidth + 2*this._padding), this._ctx.canvas.height);
	}

	for (var j=0;j<=bh;j++) {
		this._ctx.moveTo(0, this._padding + j*(this._cellHeight + 2*this._padding));
		this._ctx.lineTo(this._ctx.canvas.width, this._padding + j*(this._cellHeight + 2*this._padding));
	}

	this._ctx.stroke();
	this._ctx.restore();
	
	this._ctx.lineWidth = 1.5;
}

Canvas.prototype.getCanvas = function() {
	return this._ctx.canvas;
}

Canvas.prototype.draw = function(x, y) {
	var left = x * (this._cellWidth + 2*this._padding) + 2*this._padding;
	var top = y * (this._cellHeight + 2*this._padding) + 2*this._padding;
	var w = this._cellWidth;
	var h = this._cellHeight;

	this._ctx.save();

	this._ctx.fillStyle = (this._board.isCritical(x, y) ? "yellow" : "white");
	this._ctx.fillRect(left, top, w, h);
		
	var player = this._board.getPlayer(x, y);
	this._ctx.fillStyle = this._colors[player];

	this._ctx.beginPath();

	var atoms = this._board.getAtoms(x, y);
	var positions = Canvas.atoms[atoms];
	for (var i=0;i<positions.length;i++) {
		this._drawAtom(left, top, w, h, positions[i]);
	}

	this._ctx.closePath();
	this._ctx.fill();
	this._ctx.stroke();
	this._ctx.restore();
}

Canvas.prototype._drawAtom = function(left, top, w, h, position) {
	var x = left + w*position[0];
	var y = top + h*position[1];
	var r = 0.1 * Math.min(this._cellWidth, this._cellHeight);
	this._ctx.moveTo(x+r, y);
	this._ctx.arc(x, y, r, 0, 2*Math.PI, false);
}

Canvas.prototype._click = function(e) {
	var coords = this._eventToCoords(e)
	this.dispatch("board-click", coords);
}

Canvas.prototype._mouse = function(e) {
	var coords = this._eventToCoords(e);
	if (this._board.isValid(coords.x, coords.y)) { /* mousover, mousemove */
		var player = this._board.getPlayer(coords.x, coords.y);
		if (player == this._hoverPlayer) { return; }
		
		OZ.DOM.removeClass(this._ctx.canvas, "player-" + this._hoverPlayer);
		this._hoverPlayer = player;
		if (this._hoverPlayer > -1) { OZ.DOM.addClass(this._ctx.canvas, "player-" + this._hoverPlayer); }
		
	} else if (this._hoverPlayer != -1) { /* mouseout */
		OZ.DOM.removeClass(this._ctx.canvas, "player-" + this._hoverPlayer);
		this._hoverPlayer = -1;
	}
}

Canvas.prototype._eventToCoords = function(e) {
	var pos = OZ.DOM.pos(this._ctx.canvas);
	var x = e.clientX - pos[0];
	var y = e.clientY - pos[1];
	x = Math.floor(x/(this._cellWidth + 2*this._padding));
	y = Math.floor(y/(this._cellHeight + 2*this._padding));
	return {x:x, y:y};
}
