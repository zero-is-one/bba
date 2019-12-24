( function() {
	if ( $( "#homepage-video" ).length ) {

		var videoContainer = document.getElementById('homepage-video'),
		    nextVideo,
		    videoObjects =
		    [
		        document.createElement('video'),
		        document.createElement('video')
		    ],

		    vidSources = [],
		    //random starting point
		    nextActiveVideo = Math.floor((Math.random() * vidSources.length));

		$('.homepage-video__playlist')
		    .find('a[href]')  // only target <a>s which have a href attribute
		        .each(function() {
		            vidSources.push(this.href);
		        })
		    .end()
		;

		videoObjects[0].inx = 0; //set index
		videoObjects[1].inx = 1;

		initVideoElement(videoObjects[0]);
		initVideoElement(videoObjects[1]);

		videoObjects[0].autoplay = 'autoplay';
		videoObjects[0].src = vidSources[nextActiveVideo];
		videoContainer.appendChild(videoObjects[0]);

		videoObjects[1].style.display = 'none';
		videoContainer.appendChild(videoObjects[1]);

		function initVideoElement(video)
		{
		    video.playsinline = true;
		    video.muted = true;
		    video.preload = 'auto'; //but do not set autoplay, because it deletes preload

		    //loadedmetadata is wrong because if we use it then we get endless loop
		    video.onplaying = function(e)
		    {
		        //select next index. If is equal vidSources.length then it is 0
		        nextActiveVideo = ++nextActiveVideo % vidSources.length;

		        //replace the video elements against each other:
		        if(this.inx == 0)
		            nextVideo = videoObjects[1];
		        else
		            nextVideo = videoObjects[0];

		        nextVideo.src = vidSources[nextActiveVideo];
		        nextVideo.pause();
		    };

		    video.onended = function(e)
		    {
		        this.style.display = 'none';
		        nextVideo.style.display = 'block';
		        nextVideo.play();
		    };
		}


	}

} () );
