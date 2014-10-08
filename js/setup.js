var Setup = function() {
	this._dom = {
		container: document.querySelector("#setup"),
		local: {
			container: document.querySelector("#local"),	
			players: document.querySelector("#local-players"),	
			roster: document.querySelector("#local-roster"),
			play: document.querySelector("#local-play"),
			template: null,
			rosterItems: []
		},
		multiplayer: {
			container: document.querySelector("#multiplayer"),
			players: document.querySelector("#multiplayer-players"),
			game: document.querySelector("#multiplayer-game"),
			name: document.querySelector("#multiplayer-name"),
			play: document.querySelector("#multiplayer-play")
		}
	}
	
	this._setupLocal();
	this._setupMultiplayer();
	this._load();
}

Setup.prototype._setupLocal = function() {
	this._dom.local.template = this._dom.local.roster.querySelectorAll("p")[0];
	this._dom.local.template.parentNode.removeChild(this._dom.local.template);
	
	this._dom.local.play.addEventListener("click", this._playLocal.bind(this));
	this._dom.local.players.addEventListener("change", this._syncRoster.bind(this));
}

Setup.prototype._load = function() {
	var players = localStorage.getItem("local-players") || 2;
	this._dom.local.players.value = players;
	this._syncRoster();

	for (var i=0;i<players;i++) {
		var item = this._dom.local.rosterItems[i];
		var type = localStorage.getItem("local-"+i+"-type") || "ui";
		var name = localStorage.getItem("local-"+i+"-name") || ("Player" + Math.round(100*Math.random()));
		
		item.querySelectorAll("input")[0].value = name;
		item.querySelectorAll("select")[0].value = type;
	}

	var players = localStorage.getItem("multiplayer-players") || 2;
	var game = localStorage.getItem("multiplayer-game") || ("game" + Math.round(100*Math.random()));
	var name = localStorage.getItem("multiplayer-name") || ("Player" + Math.round(100*Math.random()));
	this._dom.multiplayer.players.value = players;
	this._dom.multiplayer.game.value = game;
	this._dom.multiplayer.name.value = name;
}

Setup.prototype._save = function() {
	/* local */
	localStorage.setItem("local-players", this._dom.local.players.value);
	for (var i=0;i<this._dom.local.rosterItems.length;i++) {
		var item = this._dom.local.rosterItems[i];
		var name = item.querySelectorAll("input")[0].value;
		var type = item.querySelectorAll("select")[0].value;
		localStorage.setItem("local-"+i+"-type", type);
		localStorage.setItem("local-"+i+"-name", name);
	}
	
	/* multiplayer */
	localStorage.setItem("multiplayer-players", this._dom.multiplayer.players.value);
	localStorage.setItem("multiplayer-game", this._dom.multiplayer.game.value);
	localStorage.setItem("multiplayer-name", this._dom.multiplayer.name.value);
}

Setup.prototype._syncRoster = function() {
	var players = parseInt(this._dom.local.players.value);

	while (this._dom.local.rosterItems.length < players) {
		var item = this._dom.local.template.cloneNode(true);
		var span = item.querySelectorAll("span")[0];
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
	this._dom.multiplayer.play.addEventListener("click", this._playMultiplayer.bind(this));
}

Setup.prototype._playLocal = function() {
	this._end();
	var game = new Atoms.Local();

	for (var i=0;i<this._dom.local.rosterItems.length;i++) {
		var item = this._dom.local.rosterItems[i];
		var name = item.querySelectorAll("input")[0].value || "[noname]";
		var type = item.querySelectorAll("select")[0].value;
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
	
	game = new Atoms.Multiplayer(game, players, name);
	game.start();
}

Setup.prototype._end = function() {
	this._save();
	this._dom.container.parentNode.removeChild(this._dom.container);
}
