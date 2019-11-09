$(document).ready(function() {   
	// console.log('why hello there');

	// prevent widows within inline-text
	$('.inline-text p, .inline-text li').each(function(){
		var string = $(this).html();
		string = string.replace(/ ([^ ]*)$/,'&nbsp;$1');
		$(this).html(string);
	});

	// configure FullPage: https://github.com/alvarotrigo/fullPage.js
	if ( $( ".js-fullpage-container--work" ).length && $(window).width() > 768 ){
		$('.js-fullpage-container--work').fullpage({
			lazyLoading: false,
			scrollingSpeed: 1000,
			sectionSelector: '.js-fullpage-section',
		});
	} else {
		$(".js-fullpage-container--work").addClass("fullpage-container--css-snap");
    }


	if ( $( ".js-fullpage-container--studio" ).length && $(window).width() > 768 ){
		$('.js-fullpage-container--studio').fullpage({
			lazyLoading: false,
			scrollingSpeed: 1000,
			sectionSelector: '.js-fullpage-section',
			scrollOverflow: true,
		});
	}


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