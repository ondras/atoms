var Audio = function() {
	this._ctx = null;
	try {
		this._ctx = new (window.AudioContext || window.webkitAudioContext)();
	} catch (e) {
		/* no web audio api avail, sorry */
	}

	if (this._ctx) { this._build(); }
}

Audio.prototype.play = function(level) {
	if (!this._ctx) { return; }

	this._oscillator.frequency.value = 200 + level*80;
	this._gain.gain.value = 0.1;
}

Audio.prototype.stop = function() {
	if (!this._ctx) { return; }

	this._gain.gain.value = 0;
}

Audio.prototype._build = function() {
	this._oscillator = this._ctx.createOscillator();
	this._oscillator.type = "square";

	this._gain = this._ctx.createGain();
	this._oscillator.connect(this._gain);
	this._gain.connect(this._ctx.destination);

	this.stop();
	this._oscillator.start();
}
