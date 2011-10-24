var Socket = OZ.Class();

Socket.prototype.init = function(url) {
	this._url = null;
	this._request = null;
	this._response = this._response.bind(this);
	this.open(url);
}

Socket.prototype.send = function(data) {
	if (this._request) { this._request.abort(); }
	this._request = OZ.Request(this._url, this._response, {data:data, method:"post"});
}

Socket.prototype.close = function() {
	if (this._request) {
		this._request.abort();
		this._request = null;
	}
}

Socket.prototype.open = function(url) {
	this.close();
	this._url = url;
	this._request = OZ.Request(this._url, this._response, {method:"post"});
}

Socket.prototype._response = function(data, status) {
	this._request = null;
	if (status == 200) {
		this.dispatch("message", {data:data});
		this._request = OZ.Request(this._url, this._response, {method:"post"});
	} else {
		this.dispatch("error", {status:status, data:data});
	}
}
