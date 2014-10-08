var Canvas = function(board, cellWidth, cellHeight, colors) {
	this._board = board;
	this._cellWidth = cellWidth;
	this._cellHeight = cellHeight;
	this._colors = colors;
	this._criticalColor = "yellow";
	this._padding = 1;
	this._cursor = [-1, -1];
	
	var canvas = document.createElement("canvas");
	canvas.width = board.getWidth() * (cellWidth + 2*this._padding) + 2*this._padding;
	canvas.height = board.getHeight() * (cellHeight + 2*this._padding) + 2*this._padding;
	this._ctx = canvas.getContext("2d");

	canvas.addEventListener("click", this);
	canvas.addEventListener("mouseover", this);
	canvas.addEventListener("mouseout", this);
	canvas.addEventListener("mousemove", this);
}

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

Canvas.prototype.prepare = function() {
	var bw = this._board.getWidth();
	var bh = this._board.getHeight();

	this._ctx.save();
	this._ctx.fillStyle = "white";
	this._ctx.fillRect(0, 0, this._ctx.canvas.width, this._ctx.canvas.height);

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

Canvas.prototype.draw = function(xy) {
	var left = xy.x * (this._cellWidth + 2*this._padding) + 2*this._padding;
	var top = xy.y * (this._cellHeight + 2*this._padding) + 2*this._padding;
	var w = this._cellWidth;
	var h = this._cellHeight;

	this._ctx.save();

	this._ctx.fillStyle = (this._board.isCritical(xy) ? this._criticalColor : "white");
	this._ctx.fillRect(left, top, w, h);
		
	var player = this._board.getPlayer(xy);
	this._ctx.fillStyle = this._colors[player];

	this._ctx.beginPath();

	var atoms = this._board.getAtoms(xy);
	var positions = Canvas.atoms[atoms];
	for (var i=0;i<positions.length;i++) {
		this._drawAtom(left, top, w, h, positions[i]);
	}

	this._ctx.closePath();
	this._ctx.fill();
	this._ctx.stroke();
	this._ctx.restore();
}

Canvas.prototype.getCursor = function() {
	return this._cursor;
}

Canvas.prototype.handleEvent = function(e) {
	switch (e.type) {
		case "click":
			publish("board-click", this);
		break;

		default:
			this._cursor = this._eventToCoords(e);
			publish("board-mouse", this);
		break;
	}
}

Canvas.prototype._drawAtom = function(left, top, w, h, position) {
	var x = left + w*position[0];
	var y = top + h*position[1];
	var r = 0.1 * Math.min(this._cellWidth, this._cellHeight);
	this._ctx.moveTo(x+r, y);
	this._ctx.arc(x, y, r, 0, 2*Math.PI, false);
}

Canvas.prototype._eventToCoords = function(e) {
	var rect = this._ctx.canvas.getBoundingClientRect();
	var x = e.clientX - rect.left;
	var y = e.clientY - rect.top;
	x = Math.floor(x/(this._cellWidth + 2*this._padding));
	y = Math.floor(y/(this._cellHeight + 2*this._padding));
	return new XY(x, y);
}
