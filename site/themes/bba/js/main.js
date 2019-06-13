$(document).ready(function() {   
	console.log('why hello there');

  // prevent widows within inline-text

  $('.inline-text p, .inline-text li').each(function(){
    var string = $(this).html();
    string = string.replace(/ ([^ ]*)$/,'&nbsp;$1');
    $(this).html(string);
  });


	$.scrollify({
		section:".js-scrollify",
		sectionName:false,
		scrollSpeed:300,
	    standardScrollElements: ".site-footer",
	});

	$(window).resize(function() {
	    $.scrollify.update();
	});

	$(window).on( "orientationchange", function() {
	    $.scrollify.update();
	});
}); 