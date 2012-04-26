var Setup = OZ.Class();
Setup.URL = "ws://" + location.hostname + ":8888/atoms";
Setup.prototype.init = function() {
	this._dom = {
		container: OZ.$("setup"),
		local: {
			container: OZ.$("local"),	
			players: OZ.$("local-players"),	
			roster: OZ.$("local-roster"),
			play: OZ.$("local-play"),
			template: null,
			rosterItems: []
		},
		multiplayer: {
			container: OZ.$("multiplayer"),
			players: OZ.$("multiplayer-players"),
			game: OZ.$("multiplayer-game"),
			name: OZ.$("multiplayer-name"),
			play: OZ.$("multiplayer-play"),
			url: OZ.$("multiplayer-url")
		}
	}
	
	this._setupLocal();
	this._setupMultiplayer();
	this._load();
}

Setup.prototype._setupLocal = function() {
	this._dom.local.template = this._dom.local.roster.getElementsByTagName("p")[0];
	this._dom.local.template.parentNode.removeChild(this._dom.local.template);
	
	OZ.Event.add(this._dom.local.play, "click", this._playLocal.bind(this));
	OZ.Event.add(this._dom.local.players, "change", this._syncRoster.bind(this));
}

Setup.prototype._load = function() {
	var players = localStorage.getItem("local-players") || 2;
	this._dom.local.players.value = players;
	this._syncRoster();

	for (var i=0;i<players;i++) {
		var item = this._dom.local.rosterItems[i];
		var type = localStorage.getItem("local-"+i+"-type") || "ui";
		var name = localStorage.getItem("local-"+i+"-name") || ("Player" + Math.round(100*Math.random()));
		
		item.getElementsByTagName("input")[0].value = name;
		item.getElementsByTagName("select")[0].value = type;
	}

	var players = localStorage.getItem("multiplayer-players") || 2;
	var game = localStorage.getItem("multiplayer-game") || ("game" + Math.round(100*Math.random()));
	var name = localStorage.getItem("multiplayer-name") || ("Player" + Math.round(100*Math.random()));
	var url = localStorage.getItem("multiplayer-url") || this.constructor.URL;
	this._dom.multiplayer.players.value = players;
	this._dom.multiplayer.game.value = game;
	this._dom.multiplayer.name.value = name;
	this._dom.multiplayer.url.value = url;
}

Setup.prototype._save = function() {
	/* local */
	localStorage.setItem("local-players", this._dom.local.players.value);
	for (var i=0;i<this._dom.local.rosterItems.length;i++) {
		var item = this._dom.local.rosterItems[i];
		var name = item.getElementsByTagName("input")[0].value;
		var type = item.getElementsByTagName("select")[0].value;
		localStorage.setItem("local-"+i+"-type", type);
		localStorage.setItem("local-"+i+"-name", name);
	}
	
	/* multiplayer */
	localStorage.setItem("multiplayer-players", this._dom.multiplayer.players.value);
	localStorage.setItem("multiplayer-game", this._dom.multiplayer.game.value);
	localStorage.setItem("multiplayer-name", this._dom.multiplayer.name.value);
	localStorage.setItem("multiplayer-url", this._dom.multiplayer.url.value);
}

Setup.prototype._syncRoster = function() {
	var players = parseInt(this._dom.local.players.value);

	while (this._dom.local.rosterItems.length < players) {
		var item = this._dom.local.template.cloneNode(true);
		var span = item.getElementsByTagName("span")[0];
		this._dom.local.rosterItems.push(item);
		span.innerHTML = this._dom.local.rosterItems.length + ".";
		this._dom.local.roster.appendChild(item);
	}
	
	while (this._dom.local.rosterItems.length > players) {
		var item = this._dom.local.rosterItems.pop();
		item.parentNode.removeChild(item);
	}
	
}

Setup.prototype._setupMultiplayer = function() {
	OZ.Event.add(this._dom.multiplayer.play, "click", this._playMultiplayer.bind(this));
}

Setup.prototype._playLocal = function() {
	this._end();
	var game = new Atoms.Local();

	for (var i=0;i<this._dom.local.rosterItems.length;i++) {
		var item = this._dom.local.rosterItems[i];
		var name = item.getElementsByTagName("input")[0].value || "[noname]";
		var type = item.getElementsByTagName("select")[0].value;
		if (type == "ui") {
			game.addPlayerUI(name);
		} else {
			game.addPlayerAI(name);
		}
	}

	game.start();
}

Setup.prototype._playMultiplayer = function() {
	this._end();
	
	var game = this._dom.multiplayer.game.value;
	var name = this._dom.multiplayer.name.value;
	var players = parseInt(this._dom.multiplayer.players.value);
	var url = this._dom.multiplayer.url.value;
	
	game = new Atoms.Multiplayer(game, players, name, url);
	game.start();
}

Setup.prototype._end = function() {
	this._save();
	this._dom.container.parentNode.removeChild(this._dom.container);
}
