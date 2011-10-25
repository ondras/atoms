var Socket = OZ.Class();
Socket.prototype.init = function(url) {
	this._url = null;
	this._id = Math.random();
	this._poll = null;
	this._response = this._response.bind(this);
	this.open(url);
}

Socket.prototype.send = function(data) {
	var d = data || {};
	d.client = this._id;
	OZ.Request(this._url, function(){}, {data:this._serialize(d), method:"post"});
	return this;
}

Socket.prototype.close = function() {
	if (this._poll) {
		this._poll.abort();
		this._poll = null;
	}
	return this;
}

Socket.prototype.open = function(url) {
	this.close();
	this._url = url;
	var d = {client:this._id};
	this._poll = OZ.Request(this._url, this._response, {data:this._serialize(d), method:"post"});
	return this;
}

Socket.prototype._response = function(data, status) {
	this._poll = null;
	if (status == 200) {
		var d = {client:this._id};
		this._poll = OZ.Request(this._url, this._response, {data:this._serialize(d), method:"post"});
		this.dispatch("message", data);
	} else {
		this.dispatch("error", {status:status, data:data});
	}
}

Socket.prototype._serialize = function(data) {
	var arr = [];
	for (var p in data) { arr.push(encodeURIComponent(p)+"="+encodeURIComponent(data[p])); }
	return arr.join("&");
}
