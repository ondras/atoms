#!/usr/bin/env v8cgi

var AS = function(ws) {
	this._ws = ws;
	this._games = {};
}

AS.prototype.path = "/atoms";

AS.prototype.onmessage = function(client, data) {
	data = JSON.parse(data);
	var type = data.type;
	system.stdout.writeLine("[message] " + type + " from " + client);
	
	switch (type) {
		case "join":
			this._join(client, data);
		break;
		case "round":
			this._round(client, data);
		break;
	}
}

AS.prototype.ondisconnect = function(client, code, message) {
	var gameName = this._clientToGameName(client);
	if (!gameName) { return; }

	var game = this._games[gameName];
	for (var name in game.players) {
		var c = game.players[name];
		if (c != client) { this._ws.disconnect(c, 1001, "Player left game"); }
	}
	delete this._games[gameName];
	
}

AS.prototype._debug = function(str) {
	system.stdout.writeLine(str);
}

AS.prototype._join = function(client, data) {
	var game = data.game;
	var name = data.name;
	
	if (game in this._games) { /* check name */
		if (name in this._games[game].players) {
			this._send(client, "error", {error:"Duplicate player name"});
			return;
		}
		if (data.players != this._games[game].playerCount) {
			this._send(client, "error", {error:"Bad player count"});
			return;
		}
	} else {
		this._debug("[join] creating game " + game);
		this._games[game] = {
			players: {},
			playerCount: data.players
		}
	}
	
	var g = this._games[game];
	
	var count = 0;
	for (var p in g.players) { count++; }
	if (count == g.playerCount) {
		this._send(client, "error", {error:"Game already started"});
		return;
	}
	
	g.players[name] = client;
	count++;
	if (count == g.playerCount) { this._startGame(game); }
}

AS.prototype._startGame = function(gameName) {
	var game = this._games[gameName];
	var clients = [];
	var data = {players:{}};
	
	for (var name in game.players) {
		data.players[name] = true;
		clients.push(game.players[name]);
	}
	
	for (var i=0;i<clients.length;i++) {
		var client = clients[i];
		this._send(client, "create", data);
	}
}

AS.prototype._round = function(client, data) {
	this._debug("[play] round " + client + " plays " + JSON.stringify(data));
	var gameName = this._clientToGameName(client);
	if (!gameName) { return; }
	
	var game = this._games[gameName];
	for (var name in game.players) {
		var c = game.players[name];
		if (c == client) { continue; }
		this._send(c, "round", data);
	}
}

AS.prototype._send = function(client, type, data) {
	data.type = type;
	data = JSON.stringify(data);
	this._ws.send(client, data);
}


AS.prototype._clientToGameName = function(client) {
	for (var name in this._games) {
		var players = this._games[name].players;
		for (var playerName in players) {
			if (players[playerName] == client) { return name; }
		}
	}
}

var Server = require("websocket").Server;
var ws = new Server("0.0.0.0", 8888);
ws.addApplication(new AS(ws));
ws.run();
