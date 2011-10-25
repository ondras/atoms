var Setup = OZ.Class();
Setup.prototype.init = function() {
	this._container = OZ.DOM.elm("div", {id:"setup"});
	
	var h1 = OZ.DOM.elm("h1", {innerHTML:"Game setup"});
	var o1 = OZ.DOM.elm("label", {innerHTML:"<input type='radio' /> Local play"});
	var o2 = OZ.DOM.elm("label", {innerHTML:"<input type='radio' /> Multiplayer"});
	var c1 = this._buildContentLocal();
	var c2 = this._buildContentMultiplayer();

	OZ.DOM.append(
		[this._container, h1, o1, c1, o2, c2],
		[document.body, this._container]
	);
}

Setup.prototype._buildContentLocal = function() {
	return OZ.DOM.elm("hr");
}

Setup.prototype._buildContentMultiplayer = function() {
	return OZ.DOM.elm("hr");
}
