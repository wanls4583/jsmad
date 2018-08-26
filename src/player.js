Mad.Player = function(url, callback) {
    var self = this;
    this.stream = new Mad.AjaxStream(url, function() {
        self._init();
        callback();
    });
};

Mad.Player.prototype._init = function() {
    this.mp3 = new Mad.MP3File(this.stream);
    this.id3 = this.mp3.getID3v2Stream();
    this.mpeg = this.mp3.getMpegStream();
    this.synth = new Mad.Synth();
    this.frame = new Mad.Frame();
    this.frame = Mad.Frame.decode(this.frame, this.mpeg);
    if (this.frame == null) {
        if (this.mpeg.error == Mad.Error.BUFLEN) {
            console.log("End of file!");
        }
        return;
    }

    this.channelCount = this.frame.header.nchannels();
    this.sampleRate = this.frame.header.samplerate;

    console.log("this.playing " + this.channelCount + " channels, samplerate = " + this.sampleRate + " audio, mode " + this.frame.header.mode);

    this.offset = 0;
    this.absoluteFrameIndex = 0;
    this.synth.frame(this.frame);
};

Mad.Player.prototype.refill = function(audioBuffer, size) {
    for (var i = 0; i < size; i++) {
        for (var ch = 0; ch < this.channelCount; ++ch) {
            audioBuffer.getChannelData(ch).set(this.synth.pcm.samples[ch], this.offset);
        }
        this.offset += this.synth.pcm.samples[0].length;
        this.frame = Mad.Frame.decode(this.frame, this.mpeg);
        if (this.frame == null) {
            if (this.stream.error == Mad.Error.BUFLEN) {
                console.log("End of file!");
            }
            console.log("Error! code = " + this.mpeg.error);
            this.playing = false;
            return false;
        } else {
            this.synth.frame(this.frame);
            this.absoluteFrameIndex++;
        }
    }
    return true;
};

Mad.Player.prototype.play = function() {
    var audioContext = new(window.AudioContext || window.webkitAudioContext)(); //音频上下文对象
    var self = this;

    var audioBuffer = audioContext.createBuffer(this.channelCount, 200 * this.sampleRate, this.sampleRate);
    var bufferSourceNode = audioContext.createBufferSource();

    _fillData();
    bufferSourceNode.buffer = audioBuffer;
    bufferSourceNode.connect(audioContext.destination);
    bufferSourceNode.start(0);

    function _fillData() {
        if (self.refill(audioBuffer, 20)) {
            setTimeout(function() {
                _fillData();
            }, 100);
        }
    }
}