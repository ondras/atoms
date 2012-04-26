#!/usr/bin/env v8cgi

var AS = require("./server").AS;
var Server = require("websocket").Server;
var ws = new Server("0.0.0.0", 8888);
ws.addApplication(new AS(ws));
ws.run();
