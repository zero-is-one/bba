$(document).ready(function() {   
	console.log('why hello there');

	// prevent widows within inline-text
	$('.inline-text p, .inline-text li').each(function(){
		var string = $(this).html();
		string = string.replace(/ ([^ ]*)$/,'&nbsp;$1');
		$(this).html(string);
	});

	// configure FullPage: https://github.com/alvarotrigo/fullPage.js
	$('#fullpage').fullpage({
		//options here
		lazyLoading: false,
		scrollingSpeed: 600,
	});
}); 