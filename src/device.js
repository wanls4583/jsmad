Mad.AudioDevice = function(refill, channelCount, sampleRate){
	var channelSample = null;
	var audioContext = new(AudioContext || WebkitAudioContext)();
	var played = false;

	_play();

	function _play(){
		channelSample = [];
		for(var i=0; i<channelCount; i++){
			channelSample[i] = new Float32Array(1152*100);
		}
		if(refill(channelSample) && !played){
		    var buffer = audioContext.createBuffer(channelCount, channelSample[0].length, sampleRate );
		    for(var i=0; i<channelCount; i++){
			    buffer.copyToChannel(channelSample[i], i, 0);
		    }
		    var bufferSourceNode = audioContext.createBufferSource();
		    bufferSourceNode.buffer = buffer;
		    bufferSourceNode.connect(audioContext.destination);
		    bufferSourceNode.start(0);
		    // played = true;
		}
		setTimeout(function(){
			_play();
		},3000);
	}
}
