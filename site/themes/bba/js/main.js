$(document).ready(function() {   
	// console.log('why hello there');

	// prevent widows within inline-text
	$('.inline-text p, .inline-text li').each(function(){
		var string = $(this).html();
		string = string.replace(/ ([^ ]*)$/,'&nbsp;$1');
		$(this).html(string);
	});

	// configure FullPage: https://github.com/alvarotrigo/fullPage.js
	if ( $( ".js-fullpage-container--work" ).length ) {
		$('.js-fullpage-container--work').fullpage({
			lazyLoading: false,
			scrollingSpeed: 1000,
			sectionSelector: '.js-fullpage-section',
			scrollBar: true,
		});
	}

	if ( $( ".js-fullpage-container--studio" ).length ) {
		$('.js-fullpage-container--studio').fullpage({
			lazyLoading: false,
			scrollingSpeed: 1000,
			sectionSelector: '.js-fullpage-section',
			scrollOverflow: true,
			responsiveWidth: 768,
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