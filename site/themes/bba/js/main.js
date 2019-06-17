$(document).ready(function() {   
	console.log('why hello there');

	// prevent widows within inline-text
	$('.inline-text p, .inline-text li').each(function(){
		var string = $(this).html();
		string = string.replace(/ ([^ ]*)$/,'&nbsp;$1');
		$(this).html(string);
	});

	// configure FullPage: https://github.com/alvarotrigo/fullPage.js
	$('.js-fullpage-container').fullpage({
		//options here
		lazyLoading: false,
		scrollingSpeed: 600,
		sectionSelector: '.js-fullpage-section',
		scrollBar: true,
	});


	// Main Nav Toggling
	$(".site-nav__nav-toggle").on("click", function(e){
		e.preventDefault();
		$("body").toggleClass("nav-is-open");
	});

	// Escape key closes nav
	$(document).keyup(function(e) {
		if (e.keyCode == 27) {
		  $("body").removeClass("nav-is-open");
		}
	});

}); 