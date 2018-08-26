Mad.AjaxStream = function(url, callback) {
    var self = this;
    this.state = { 'offset': 0 };
    this.state.request = new XMLHttpRequest();
    this.state.request.open('GET', url, true);
    this.state.request.responseType = 'arraybuffer';
    this.state.request.onload = function() {
        self.updateBuffer();
        callback(self);
    }
    this.state.request.setRequestHeader("Range", 'bytes=139246-');
    this.state.request.send();
}

Mad.AjaxStream.prototype = new Mad.ByteStream();

Mad.AjaxStream.prototype.updateBuffer = function() {
    this.state['arrayBuffer'] = this.state['request'].response;
    this.state['byteBuffer'] = new Uint8Array(this.state['arrayBuffer']);
    this.state['amountRead'] = this.state['arrayBuffer'].byteLength;
    this.state['contentLength'] = this.state['request'].getResponseHeader('Content-Length');
}

Mad.AjaxStream.prototype.absoluteAvailable = function(n) {
    if (n > this.state['amountRead']) {
        throw new Error("buffer underflow with absoluteAvailable!");
    } else {
        return true;
    }
}

Mad.AjaxStream.prototype.seek = function(n) {
    this.state['offset'] += n;
}

Mad.AjaxStream.prototype.read = function(n) {
    var result = this.peek(n);

    this.seek(n);

    return result;
}

Mad.AjaxStream.prototype.peek = function(n) {
    if (this.available(n)) {
        var offset = this.state['offset'];

        var result = this.get(offset, n);

        return result;
    } else {
        throw new Error("buffer underflow with peek!");
    }
}

Mad.AjaxStream.prototype.get = function(offset, length) {
    if (this.absoluteAvailable(offset + length)) {
        var tmpbuffer = "";
        for (var i = offset; i < offset + length; i += 1) {
            tmpbuffer = tmpbuffer + String.fromCharCode(this.state['byteBuffer'][i]);
        }
        return tmpbuffer;
    } else {
        throw new Error("buffer underflow with get!");
    }
}

Mad.ByteStream.prototype.getU8 = function(offset, bigEndian) {
    if (this.state['byteBuffer']) {
        return this.state['byteBuffer'][offset];
    }

    return this.get(offset, 1).charCodeAt(0);
}

Mad.AjaxStream.prototype.requestAbsolute = function(n, callback) {
    if (n < this.state['amountRead']) {
        callback();
    } else {
        this.state['callbacks'].push([n, callback]);
    }
}

Mad.AjaxStream.prototype.request = function(n, callback) {
    this.requestAbsolute(this.state['offset'] + n, callback);
}