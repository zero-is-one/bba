/*!
 * jQuery Scrollify
 * Version 1.0.20
 *
 * Requires:
 * - jQuery 1.7 or higher
 *
 * https://github.com/lukehaas/Scrollify
 *
 * Copyright 2016, Luke Haas
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.



if touchScroll is false - update index

 */
(function (global,factory) {
  "use strict";
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], function($) {
      return factory($, global, global.document);
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = factory(require('jquery'), global, global.document);
  } else {
    // Browser globals
    factory(jQuery, global, global.document);
  }
}(typeof window !== 'undefined' ? window : this, function ($, window, document, undefined) {
  "use strict";
  var heights = [],
    names = [],
    elements = [],
    overflow = [],
    index = 0,
    currentIndex = 0,
    interstitialIndex = 1,
    hasLocation = false,
    timeoutId,
    timeoutId2,
    $window = $(window),
    portHeight,
    top = $window.scrollTop(),
    scrollable = false,
    locked = false,
    scrolled = false,
    manualScroll,
    swipeScroll,
    util,
    disabled = false,
    scrollSamples = [],
    scrollTime = new Date().getTime(),
    firstLoad = true,
    initialised = false,
    destination = 0,
    wheelEvent = 'onwheel' in document ? 'wheel' : document.onmousewheel !== undefined ? 'mousewheel' : 'DOMMouseScroll',
    settings = {
      //section should be an identifier that is the same for each section
      section: ".section",
      sectionName: "section-name",
      interstitialSection: "",
      easing: "easeOutExpo",
      scrollSpeed: 1100,
      offset: 0,
      scrollbars: true,
      target:"html,body",
      standardScrollElements: false,
      setHeights: true,
      overflowScroll:true,
      updateHash: true,
      touchScroll:true,
      before:function() {},
      after:function() {},
      afterResize:function() {},
      afterRender:function() {}
    };
  function getportHeight() {
    return ($window.height() + settings.offset);
  }
  function animateScroll(index,instant,callbacks,toTop) {
    if(currentIndex===index) {
      callbacks = false;
    }
    if(disabled===true) {
      return true;
    }
    if(names[index]) {
      scrollable = false;
      if(firstLoad===true) {
        firstLoad = false;
        settings.afterRender();
      }
      if(callbacks) {
        if( typeof settings.before == 'function' && settings.before(index,elements) === false ){
          return true;
        }
      }
      interstitialIndex = 1;
      destination = (!index) ? 0 : heights[index];
      if(firstLoad===false && currentIndex>index && toTop===false) {
        //We're going backwards
        if(overflow[index]) {
          portHeight = getportHeight();

          interstitialIndex = parseInt(elements[index].outerHeight()/portHeight);

          destination = parseInt(heights[index])+(elements[index].outerHeight()-portHeight);
        }
      }


      if(settings.updateHash && settings.sectionName && !(firstLoad===true && index===0)) {
        if(history.pushState) {
            try {
              history.replaceState(null, null, names[index]);
            } catch (e) {
              if(window.console) {
                console.warn("Scrollify warning: Page must be hosted to manipulate the hash value.");
              }
            }

        } else {
          window.location.hash = names[index];
        }
      }

      currentIndex = index;
      if(instant) {
        $(settings.target).stop().scrollTop(destination);
        if(callbacks) {
          settings.after(index,elements);
        }
      } else {
        locked = true;
        if( $().velocity ) {
          $(settings.target).stop().velocity('scroll', {
            duration: settings.scrollSpeed,
            easing: settings.easing,
            offset: destination,
            mobileHA: false
          });
        } else {
          $(settings.target).stop().animate({
            scrollTop: destination
          }, settings.scrollSpeed,settings.easing);
        }

        if(window.location.hash.length && settings.sectionName && window.console) {
          try {
            if($(window.location.hash).length) {
              console.warn("Scrollify warning: ID matches hash value - this will cause the page to anchor.");
            }
          } catch (e) {}
        }
        $(settings.target).promise().done(function(){
          locked = false;
          firstLoad = false;
          if(callbacks) {
            settings.after(index,elements);
          }
        });
      }

    }
  }

  function isAccelerating(samples) {
    function average(num) {
      var sum = 0;

      var lastElements = samples.slice(Math.max(samples.length - num, 1));

      for(var i = 0; i < lastElements.length; i++){
          sum += lastElements[i];
      }

      return Math.ceil(sum/num);
    }

    var avEnd = average(10);
    var avMiddle = average(70);

    if(avEnd >= avMiddle) {
      return true;
    } else {
      return false;
    }
  }
  var scrollify = function(options) {
    initialised = true;
    $.easing['easeOutExpo'] = function(x, t, b, c, d) {
      return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
    };

    manualScroll = {
      handleMousedown:function() {
        if(disabled===true) {
          return true;
        }
        scrollable = false;
        scrolled = false;
      },
      handleMouseup:function() {
        if(disabled===true) {
          return true;
        }
        scrollable = true;
        if(scrolled) {
          //instant,callbacks
          manualScroll.calculateNearest(false,true);
        }
      },
      handleScroll:function() {
        if(disabled===true) {
          return true;
        }
        if(timeoutId){
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(function(){
          scrolled = true;
          if(scrollable===false) {
            return false;
          }
          scrollable = false;
          //instant,callbacks
          manualScroll.calculateNearest(false,true);
        }, 200);
      },
      calculateNearest:function(instant,callbacks) {
        top = $window.scrollTop();
        var i =1,
          max = heights.length,
          closest = 0,
          prev = Math.abs(heights[0] - top),
          diff;
        for(;i<max;i++) {
          diff = Math.abs(heights[i] - top);

          if(diff < prev) {
            prev = diff;
            closest = i;
          }
        }
        if((atBottom() && closest>index) || atTop()) {
          index = closest;
          //index, instant, callbacks, toTop
          animateScroll(closest,instant,callbacks,false);
        }
      },
      wheelHandler:function(e) {
        if(disabled===true) {
          return true;
        } else if(settings.standardScrollElements) {
          if($(e.target).is(settings.standardScrollElements) || $(e.target).closest(settings.standardScrollElements).length) {
            return true;
          }
        }
        if(!overflow[index]) {
          e.preventDefault();
        }
        var currentScrollTime = new Date().getTime();


        e = e || window.event;
        var value;
        if (e.originalEvent) {
            value = e.originalEvent.wheelDelta || -e.originalEvent.deltaY || -e.originalEvent.detail;
        } else {
            value = e.wheelDelta || -e.deltaY || -e.detail;
        }
        var delta = Math.max(-1, Math.min(1, value));

        //delta = delta || -e.originalEvent.detail / 3 || e.originalEvent.wheelDelta / 120;

        if(scrollSamples.length > 149){
          scrollSamples.shift();
        }
        //scrollSamples.push(Math.abs(delta*10));
        scrollSamples.push(Math.abs(value));

        if((currentScrollTime-scrollTime) > 200){
          scrollSamples = [];
        }
        scrollTime = currentScrollTime;


        if(locked) {
          return false;
        }
        if(delta<0) {
          if(index<heights.length-1) {
            if(atBottom()) {
              if(isAccelerating(scrollSamples)) {
                e.preventDefault();
                index++;
                locked = true;
                //index, instant, callbacks, toTop
                animateScroll(index,false,true, false);
              } else {
                return false;
              }
            }
          }
        } else if(delta>0) {
          if(index>0) {
            if(atTop()) {
              if(isAccelerating(scrollSamples)) {
                e.preventDefault();
                index--;
                locked = true;
                //index, instant, callbacks, toTop
                animateScroll(index,false,true, false);
              } else {
                return false
              }
            }
          }
        }

      },
      keyHandler:function(e) {
        if(disabled===true || document.activeElement.readOnly===false) {
          return true;
        } else if(settings.standardScrollElements) {
          if($(e.target).is(settings.standardScrollElements) || $(e.target).closest(settings.standardScrollElements).length) {
            return true;
          }
        }
        if(locked===true) {
          return false;
        }
        if(e.keyCode==38 || e.keyCode==33) {
          if(index>0) {
            if(atTop()) {
              e.preventDefault();
              index--;
              //index, instant, callbacks, toTop
              animateScroll(index,false,true,false);
            }
          }
        } else if(e.keyCode==40 || e.keyCode==34) {
          if(index<heights.length-1) {
            if(atBottom()) {
              e.preventDefault();
              index++;
              //index, instant, callbacks, toTop
              animateScroll(index,false,true,false);
            }
          }
        }
      },
      init:function() {
        if(settings.scrollbars) {
          $window.on('mousedown', manualScroll.handleMousedown);
          $window.on('mouseup', manualScroll.handleMouseup);
          $window.on('scroll', manualScroll.handleScroll);
        } else {
          $("body").css({"overflow":"hidden"});
        }
        window.addEventListener(wheelEvent, manualScroll.wheelHandler, { passive: false });
        //$(document).bind(wheelEvent,manualScroll.wheelHandler);
        $window.on('keydown', manualScroll.keyHandler);
      }
    };

    swipeScroll = {
      touches : {
        "touchstart": {"y":-1,"x":-1},
        "touchmove" : {"y":-1,"x":-1},
        "touchend"  : false,
        "direction" : "undetermined"
      },
      options:{
        "distance" : 30,
        "timeGap" : 800,
        "timeStamp" : new Date().getTime()
      },
      touchHandler: function(event) {
        if(disabled===true) {
          return true;
        } else if(settings.standardScrollElements) {
          if($(event.target).is(settings.standardScrollElements) || $(event.target).closest(settings.standardScrollElements).length) {
            return true;
          }
        }
        var touch;
        if (typeof event !== 'undefined'){
          if (typeof event.touches !== 'undefined') {
            touch = event.touches[0];
            switch (event.type) {
              case 'touchstart':
                swipeScroll.touches.touchstart.y = touch.pageY;
                swipeScroll.touches.touchmove.y = -1;

                swipeScroll.touches.touchstart.x = touch.pageX;
                swipeScroll.touches.touchmove.x = -1;

                swipeScroll.options.timeStamp = new Date().getTime();
                swipeScroll.touches.touchend = false;
              case 'touchmove':
                swipeScroll.touches.touchmove.y = touch.pageY;
                swipeScroll.touches.touchmove.x = touch.pageX;
                if(swipeScroll.touches.touchstart.y!==swipeScroll.touches.touchmove.y && (Math.abs(swipeScroll.touches.touchstart.y-swipeScroll.touches.touchmove.y)>Math.abs(swipeScroll.touches.touchstart.x-swipeScroll.touches.touchmove.x))) {
                  //if(!overflow[index]) {
                    event.preventDefault();
                  //}
                  swipeScroll.touches.direction = "y";
                  if((swipeScroll.options.timeStamp+swipeScroll.options.timeGap)<(new Date().getTime()) && swipeScroll.touches.touchend == false) {

                    swipeScroll.touches.touchend = true;
                    if (swipeScroll.touches.touchstart.y > -1) {

                      if(Math.abs(swipeScroll.touches.touchmove.y-swipeScroll.touches.touchstart.y)>swipeScroll.options.distance) {
                        if(swipeScroll.touches.touchstart.y < swipeScroll.touches.touchmove.y) {

                          swipeScroll.up();

                        } else {
                          swipeScroll.down();

                        }
                      }
                    }
                  }
                }
                break;
              case 'touchend':
                if(swipeScroll.touches[event.type]===false) {
                  swipeScroll.touches[event.type] = true;
                  if (swipeScroll.touches.touchstart.y > -1 && swipeScroll.touches.touchmove.y > -1 && swipeScroll.touches.direction==="y") {

                    if(Math.abs(swipeScroll.touches.touchmove.y-swipeScroll.touches.touchstart.y)>swipeScroll.options.distance) {
                      if(swipeScroll.touches.touchstart.y < swipeScroll.touches.touchmove.y) {
                        swipeScroll.up();

                      } else {
                        swipeScroll.down();

                      }
                    }
                    swipeScroll.touches.touchstart.y = -1;
                    swipeScroll.touches.touchstart.x = -1;
                    swipeScroll.touches.direction = "undetermined";
                  }
                }
              default:
                break;
            }
          }
        }
      },
      down: function() {

        if(index<heights.length) {

          if(atBottom() && index<heights.length-1) {

            index++;
            //index, instant, callbacks, toTop
            animateScroll(index,false,true,false);
          } else {
            portHeight = getportHeight();
            if(Math.floor(elements[index].height()/portHeight)>interstitialIndex) {

              interstitialScroll(parseInt(heights[index])+(portHeight*interstitialIndex));
              interstitialIndex += 1;

            } else {
              interstitialScroll(parseInt(heights[index])+(elements[index].outerHeight()-portHeight));
            }

          }
        }
      },
      up: function() {
        if(index>=0) {
          if(atTop() && index>0) {

            index--;
            //index, instant, callbacks, toTop
            animateScroll(index,false,true,false);
          } else {

            if(interstitialIndex>2) {
              portHeight = getportHeight();

              interstitialIndex -= 1;
              interstitialScroll(parseInt(heights[index])+(portHeight*interstitialIndex));

            } else {

              interstitialIndex = 1;
              interstitialScroll(parseInt(heights[index]));
            }
          }

        }
      },
      init: function() {
        if (document.addEventListener && settings.touchScroll) {
          var eventListenerOptions = {
            passive: false
          };
          document.addEventListener('touchstart', swipeScroll.touchHandler, eventListenerOptions);
          document.addEventListener('touchmove', swipeScroll.touchHandler, eventListenerOptions);
          document.addEventListener('touchend', swipeScroll.touchHandler, eventListenerOptions);
        }
      }
    };


    util = {
      refresh:function(withCallback,scroll) {
        clearTimeout(timeoutId2);
        timeoutId2 = setTimeout(function() {
          //retain position
          sizePanels(true);
          //scroll, firstLoad
          calculatePositions(scroll,false);
          if(withCallback) {
              settings.afterResize();
          }
        },400);
      },
      handleUpdate:function() {
        //callbacks, scroll
        //changed from false,true to false,false
        util.refresh(false,false);
      },
      handleResize:function() {
        //callbacks, scroll
        util.refresh(true,false);
      },
      handleOrientation:function() {
        //callbacks, scroll
        util.refresh(true,true);
      }
    };
    settings = $.extend(settings, options);

    //retain position
    sizePanels(false);

    calculatePositions(false,true);

    if(true===hasLocation) {
      //index, instant, callbacks, toTop
      animateScroll(index,false,true,true);
    } else {
      setTimeout(function() {
        //instant,callbacks
        manualScroll.calculateNearest(true,false);
      },200);
    }
    if(heights.length) {
      manualScroll.init();
      swipeScroll.init();

      $window.on("resize",util.handleResize);
      if (document.addEventListener) {
        window.addEventListener("orientationchange", util.handleOrientation, false);
      }
    }
    function interstitialScroll(pos) {
      if( $().velocity ) {
        $(settings.target).stop().velocity('scroll', {
          duration: settings.scrollSpeed,
          easing: settings.easing,
          offset: pos,
          mobileHA: false
        });
      } else {
        $(settings.target).stop().animate({
          scrollTop: pos
        }, settings.scrollSpeed,settings.easing);
      }
    }

    function sizePanels(keepPosition) {
      if(keepPosition) {
        top = $window.scrollTop();
      }

      var selector = settings.section;
      overflow = [];
      if(settings.interstitialSection.length) {
        selector += "," + settings.interstitialSection;
      }
      if(settings.scrollbars===false) {
        settings.overflowScroll = false;
      }
      portHeight = getportHeight();
      $(selector).each(function(i) {
        var $this = $(this);

        if(settings.setHeights) {
          if($this.is(settings.interstitialSection)) {
            overflow[i] = false;
          } else {
            if(($this.css("height","auto").outerHeight()<portHeight) || $this.css("overflow")==="hidden") {
              $this.css({"height":portHeight});

              overflow[i] = false;
            } else {

              $this.css({"height":$this.outerHeight()});

              if(settings.overflowScroll) {
                overflow[i] = true;
              } else {
                overflow[i] = false;
              }
            }

          }

        } else {

          if(($this.outerHeight()<portHeight) || (settings.overflowScroll===false)) {
            overflow[i] = false;
          } else {
            overflow[i] = true;
          }
        }
      });
      if(keepPosition) {
        $window.scrollTop(top);
      }
    }
    function calculatePositions(scroll,firstLoad) {
      var selector = settings.section;
      if(settings.interstitialSection.length) {
        selector += "," + settings.interstitialSection;
      }
      heights = [];
      names = [];
      elements = [];
      $(selector).each(function(i){
          var $this = $(this);
          if(i>0) {
            heights[i] = parseInt($this.offset().top) + settings.offset;
          } else {
            heights[i] = parseInt($this.offset().top);
          }
          if(settings.sectionName && $this.data(settings.sectionName)) {
            names[i] = "#" + $this.data(settings.sectionName).toString().replace(/ /g,"-");
          } else {
            if($this.is(settings.interstitialSection)===false) {
              names[i] = "#" + (i + 1);
            } else {
              names[i] = "#";
              if(i===$(selector).length-1 && i>1) {
                heights[i] = heights[i-1] + (parseInt($($(selector)[i-1]).outerHeight()) - parseInt($(window).height())) + parseInt($this.outerHeight());
              }
            }
          }
          elements[i] = $this;
          try {
            if($(names[i]).length && window.console) {
              console.warn("Scrollify warning: Section names can't match IDs - this will cause the browser to anchor.");
            }
          } catch (e) {}

          if(window.location.hash===names[i]) {
            index = i;
            hasLocation = true;
          }

      });

      if(true===scroll) {
        //index, instant, callbacks, toTop
        animateScroll(index,false,false,false);
      }
    }

    function atTop() {
      if(!overflow[index]) {
        return true;
      }
      top = $window.scrollTop();
      if(top>parseInt(heights[index])) {
        return false;
      } else {
        return true;
      }
    }
    function atBottom() {
      if(!overflow[index]) {
        return true;
      }
      top = $window.scrollTop();
      portHeight = getportHeight();

      if(top<parseInt(heights[index])+(elements[index].outerHeight()-portHeight)-28) {

        return false;

      } else {
        return true;
      }
    }
  }

  function move(panel,instant) {
    var z = names.length;
    for(;z>=0;z--) {
      if(typeof panel === 'string') {
        if (names[z]===panel) {
          index = z;
          //index, instant, callbacks, toTop
          animateScroll(z,instant,true,true);
        }
      } else {
        if(z===panel) {
          index = z;
          //index, instant, callbacks, toTop
          animateScroll(z,instant,true,true);
        }
      }
    }
  }
  scrollify.move = function(panel) {
    if(panel===undefined) {
      return false;
    }
    if(panel.originalEvent) {
      panel = $(this).attr("href");
    }
    move(panel,false);
  };
  scrollify.instantMove = function(panel) {
    if(panel===undefined) {
      return false;
    }
    move(panel,true);
  };
  scrollify.next = function() {
    if(index<names.length) {
      index += 1;
      //index, instant, callbacks, toTop
      animateScroll(index,false,true,true);
    }
  };
  scrollify.previous = function() {
    if(index>0) {
      index -= 1;
      //index, instant, callbacks, toTop
      animateScroll(index,false,true,true);
    }
  };
  scrollify.instantNext = function() {
    if(index<names.length) {
      index += 1;
      //index, instant, callbacks, toTop
      animateScroll(index,true,true,true);
    }
  };
  scrollify.instantPrevious = function() {
    if(index>0) {
      index -= 1;
      //index, instant, callbacks, toTop
      animateScroll(index,true,true,true);
    }
  };
  scrollify.destroy = function() {
    if(!initialised) {
      return false;
    }
    if(settings.setHeights) {
      $(settings.section).each(function() {
        $(this).css("height","auto");
      });
    }
    $window.off("resize",util.handleResize);
    if(settings.scrollbars) {
      $window.off('mousedown', manualScroll.handleMousedown);
      $window.off('mouseup', manualScroll.handleMouseup);
      $window.off('scroll', manualScroll.handleScroll);
    }
    // $window.off(wheelEvent,manualScroll.wheelHandler);
    window.removeEventListener(wheelEvent,manualScroll.wheelHandler);
    $window.off('keydown', manualScroll.keyHandler);

    if (document.addEventListener && settings.touchScroll) {
      document.removeEventListener('touchstart', swipeScroll.touchHandler, false);
      document.removeEventListener('touchmove', swipeScroll.touchHandler, false);
      document.removeEventListener('touchend', swipeScroll.touchHandler, false);
    }
    heights = [];
    names = [];
    elements = [];
    overflow = [];
  };
  scrollify.update = function() {
    if(!initialised) {
      return false;
    }
    util.handleUpdate();
  };
  scrollify.current = function() {
    return elements[index];
  };
  scrollify.currentIndex = function() {
    return index;
  };
  scrollify.disable = function() {
    disabled = true;
  };
  scrollify.enable = function() {
    disabled = false;
    if (initialised) {
      //instant,callbacks
      manualScroll.calculateNearest(false,false);
    }
  };
  scrollify.isDisabled = function() {
    return disabled;
  };
  scrollify.setOptions = function(updatedOptions) {
    if(!initialised) {
      return false;
    }
    if(typeof updatedOptions === "object") {
      settings = $.extend(settings, updatedOptions);
      util.handleUpdate();
    } else if(window.console) {
      console.warn("Scrollify warning: setOptions expects an object.");
    }
  };
  $.scrollify = scrollify;
  return scrollify;
}));

(function(window, factory) {
	var lazySizes = factory(window, window.document);
	window.lazySizes = lazySizes;
	if(typeof module == 'object' && module.exports){
		module.exports = lazySizes;
	}
}(window, function l(window, document) {
	'use strict';
	/*jshint eqnull:true */
	if(!document.getElementsByClassName){return;}

	var lazysizes, lazySizesConfig;

	var docElem = document.documentElement;

	var Date = window.Date;

	var supportPicture = window.HTMLPictureElement;

	var _addEventListener = 'addEventListener';

	var _getAttribute = 'getAttribute';

	var addEventListener = window[_addEventListener];

	var setTimeout = window.setTimeout;

	var requestAnimationFrame = window.requestAnimationFrame || setTimeout;

	var requestIdleCallback = window.requestIdleCallback;

	var regPicture = /^picture$/i;

	var loadEvents = ['load', 'error', 'lazyincluded', '_lazyloaded'];

	var regClassCache = {};

	var forEach = Array.prototype.forEach;

	var hasClass = function(ele, cls) {
		if(!regClassCache[cls]){
			regClassCache[cls] = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		}
		return regClassCache[cls].test(ele[_getAttribute]('class') || '') && regClassCache[cls];
	};

	var addClass = function(ele, cls) {
		if (!hasClass(ele, cls)){
			ele.setAttribute('class', (ele[_getAttribute]('class') || '').trim() + ' ' + cls);
		}
	};

	var removeClass = function(ele, cls) {
		var reg;
		if ((reg = hasClass(ele,cls))) {
			ele.setAttribute('class', (ele[_getAttribute]('class') || '').replace(reg, ' '));
		}
	};

	var addRemoveLoadEvents = function(dom, fn, add){
		var action = add ? _addEventListener : 'removeEventListener';
		if(add){
			addRemoveLoadEvents(dom, fn);
		}
		loadEvents.forEach(function(evt){
			dom[action](evt, fn);
		});
	};

	var triggerEvent = function(elem, name, detail, noBubbles, noCancelable){
		var event = document.createEvent('Event');

		if(!detail){
			detail = {};
		}

		detail.instance = lazysizes;

		event.initEvent(name, !noBubbles, !noCancelable);

		event.detail = detail;

		elem.dispatchEvent(event);
		return event;
	};

	var updatePolyfill = function (el, full){
		var polyfill;
		if( !supportPicture && ( polyfill = (window.picturefill || lazySizesConfig.pf) ) ){
			if(full && full.src && !el[_getAttribute]('srcset')){
				el.setAttribute('srcset', full.src);
			}
			polyfill({reevaluate: true, elements: [el]});
		} else if(full && full.src){
			el.src = full.src;
		}
	};

	var getCSS = function (elem, style){
		return (getComputedStyle(elem, null) || {})[style];
	};

	var getWidth = function(elem, parent, width){
		width = width || elem.offsetWidth;

		while(width < lazySizesConfig.minSize && parent && !elem._lazysizesWidth){
			width =  parent.offsetWidth;
			parent = parent.parentNode;
		}

		return width;
	};

	var rAF = (function(){
		var running, waiting;
		var firstFns = [];
		var secondFns = [];
		var fns = firstFns;

		var run = function(){
			var runFns = fns;

			fns = firstFns.length ? secondFns : firstFns;

			running = true;
			waiting = false;

			while(runFns.length){
				runFns.shift()();
			}

			running = false;
		};

		var rafBatch = function(fn, queue){
			if(running && !queue){
				fn.apply(this, arguments);
			} else {
				fns.push(fn);

				if(!waiting){
					waiting = true;
					(document.hidden ? setTimeout : requestAnimationFrame)(run);
				}
			}
		};

		rafBatch._lsFlush = run;

		return rafBatch;
	})();

	var rAFIt = function(fn, simple){
		return simple ?
			function() {
				rAF(fn);
			} :
			function(){
				var that = this;
				var args = arguments;
				rAF(function(){
					fn.apply(that, args);
				});
			}
		;
	};

	var throttle = function(fn){
		var running;
		var lastTime = 0;
		var gDelay = lazySizesConfig.throttleDelay;
		var rICTimeout = lazySizesConfig.ricTimeout;
		var run = function(){
			running = false;
			lastTime = Date.now();
			fn();
		};
		var idleCallback = requestIdleCallback && rICTimeout > 49 ?
			function(){
				requestIdleCallback(run, {timeout: rICTimeout});

				if(rICTimeout !== lazySizesConfig.ricTimeout){
					rICTimeout = lazySizesConfig.ricTimeout;
				}
			} :
			rAFIt(function(){
				setTimeout(run);
			}, true)
		;

		return function(isPriority){
			var delay;

			if((isPriority = isPriority === true)){
				rICTimeout = 33;
			}

			if(running){
				return;
			}

			running =  true;

			delay = gDelay - (Date.now() - lastTime);

			if(delay < 0){
				delay = 0;
			}

			if(isPriority || delay < 9){
				idleCallback();
			} else {
				setTimeout(idleCallback, delay);
			}
		};
	};

	//based on http://modernjavascript.blogspot.de/2013/08/building-better-debounce.html
	var debounce = function(func) {
		var timeout, timestamp;
		var wait = 99;
		var run = function(){
			timeout = null;
			func();
		};
		var later = function() {
			var last = Date.now() - timestamp;

			if (last < wait) {
				setTimeout(later, wait - last);
			} else {
				(requestIdleCallback || run)(run);
			}
		};

		return function() {
			timestamp = Date.now();

			if (!timeout) {
				timeout = setTimeout(later, wait);
			}
		};
	};

	(function(){
		var prop;

		var lazySizesDefaults = {
			lazyClass: 'lazyload',
			loadedClass: 'lazyloaded',
			loadingClass: 'lazyloading',
			preloadClass: 'lazypreload',
			errorClass: 'lazyerror',
			//strictClass: 'lazystrict',
			autosizesClass: 'lazyautosizes',
			srcAttr: 'data-src',
			srcsetAttr: 'data-srcset',
			sizesAttr: 'data-sizes',
			//preloadAfterLoad: false,
			minSize: 40,
			customMedia: {},
			init: true,
			expFactor: 1.5,
			hFac: 0.8,
			loadMode: 2,
			loadHidden: true,
			ricTimeout: 0,
			throttleDelay: 125,
		};

		lazySizesConfig = window.lazySizesConfig || window.lazysizesConfig || {};

		for(prop in lazySizesDefaults){
			if(!(prop in lazySizesConfig)){
				lazySizesConfig[prop] = lazySizesDefaults[prop];
			}
		}

		window.lazySizesConfig = lazySizesConfig;

		setTimeout(function(){
			if(lazySizesConfig.init){
				init();
			}
		});
	})();

	var loader = (function(){
		var preloadElems, isCompleted, resetPreloadingTimer, loadMode, started;

		var eLvW, elvH, eLtop, eLleft, eLright, eLbottom;

		var defaultExpand, preloadExpand, hFac;

		var regImg = /^img$/i;
		var regIframe = /^iframe$/i;

		var supportScroll = ('onscroll' in window) && !(/(gle|ing)bot/.test(navigator.userAgent));

		var shrinkExpand = 0;
		var currentExpand = 0;

		var isLoading = 0;
		var lowRuns = -1;

		var resetPreloading = function(e){
			isLoading--;
			if(e && e.target){
				addRemoveLoadEvents(e.target, resetPreloading);
			}

			if(!e || isLoading < 0 || !e.target){
				isLoading = 0;
			}
		};

		var isNestedVisible = function(elem, elemExpand){
			var outerRect;
			var parent = elem;
			var visible = getCSS(document.body, 'visibility') == 'hidden' || (getCSS(elem.parentNode, 'visibility') != 'hidden' && getCSS(elem, 'visibility') != 'hidden');

			eLtop -= elemExpand;
			eLbottom += elemExpand;
			eLleft -= elemExpand;
			eLright += elemExpand;

			while(visible && (parent = parent.offsetParent) && parent != document.body && parent != docElem){
				visible = ((getCSS(parent, 'opacity') || 1) > 0);

				if(visible && getCSS(parent, 'overflow') != 'visible'){
					outerRect = parent.getBoundingClientRect();
					visible = eLright > outerRect.left &&
						eLleft < outerRect.right &&
						eLbottom > outerRect.top - 1 &&
						eLtop < outerRect.bottom + 1
					;
				}
			}

			return visible;
		};

		var checkElements = function() {
			var eLlen, i, rect, autoLoadElem, loadedSomething, elemExpand, elemNegativeExpand, elemExpandVal, beforeExpandVal;

			var lazyloadElems = lazysizes.elements;

			if((loadMode = lazySizesConfig.loadMode) && isLoading < 8 && (eLlen = lazyloadElems.length)){

				i = 0;

				lowRuns++;

				if(preloadExpand == null){
					if(!('expand' in lazySizesConfig)){
						lazySizesConfig.expand = docElem.clientHeight > 500 && docElem.clientWidth > 500 ? 500 : 370;
					}

					defaultExpand = lazySizesConfig.expand;
					preloadExpand = defaultExpand * lazySizesConfig.expFactor;
				}

				if(currentExpand < preloadExpand && isLoading < 1 && lowRuns > 2 && loadMode > 2 && !document.hidden){
					currentExpand = preloadExpand;
					lowRuns = 0;
				} else if(loadMode > 1 && lowRuns > 1 && isLoading < 6){
					currentExpand = defaultExpand;
				} else {
					currentExpand = shrinkExpand;
				}

				for(; i < eLlen; i++){

					if(!lazyloadElems[i] || lazyloadElems[i]._lazyRace){continue;}

					if(!supportScroll){unveilElement(lazyloadElems[i]);continue;}

					if(!(elemExpandVal = lazyloadElems[i][_getAttribute]('data-expand')) || !(elemExpand = elemExpandVal * 1)){
						elemExpand = currentExpand;
					}

					if(beforeExpandVal !== elemExpand){
						eLvW = innerWidth + (elemExpand * hFac);
						elvH = innerHeight + elemExpand;
						elemNegativeExpand = elemExpand * -1;
						beforeExpandVal = elemExpand;
					}

					rect = lazyloadElems[i].getBoundingClientRect();

					if ((eLbottom = rect.bottom) >= elemNegativeExpand &&
						(eLtop = rect.top) <= elvH &&
						(eLright = rect.right) >= elemNegativeExpand * hFac &&
						(eLleft = rect.left) <= eLvW &&
						(eLbottom || eLright || eLleft || eLtop) &&
						(lazySizesConfig.loadHidden || getCSS(lazyloadElems[i], 'visibility') != 'hidden') &&
						((isCompleted && isLoading < 3 && !elemExpandVal && (loadMode < 3 || lowRuns < 4)) || isNestedVisible(lazyloadElems[i], elemExpand))){
						unveilElement(lazyloadElems[i]);
						loadedSomething = true;
						if(isLoading > 9){break;}
					} else if(!loadedSomething && isCompleted && !autoLoadElem &&
						isLoading < 4 && lowRuns < 4 && loadMode > 2 &&
						(preloadElems[0] || lazySizesConfig.preloadAfterLoad) &&
						(preloadElems[0] || (!elemExpandVal && ((eLbottom || eLright || eLleft || eLtop) || lazyloadElems[i][_getAttribute](lazySizesConfig.sizesAttr) != 'auto')))){
						autoLoadElem = preloadElems[0] || lazyloadElems[i];
					}
				}

				if(autoLoadElem && !loadedSomething){
					unveilElement(autoLoadElem);
				}
			}
		};

		var throttledCheckElements = throttle(checkElements);

		var switchLoadingClass = function(e){
			addClass(e.target, lazySizesConfig.loadedClass);
			removeClass(e.target, lazySizesConfig.loadingClass);
			addRemoveLoadEvents(e.target, rafSwitchLoadingClass);
			triggerEvent(e.target, 'lazyloaded');
		};
		var rafedSwitchLoadingClass = rAFIt(switchLoadingClass);
		var rafSwitchLoadingClass = function(e){
			rafedSwitchLoadingClass({target: e.target});
		};

		var changeIframeSrc = function(elem, src){
			try {
				elem.contentWindow.location.replace(src);
			} catch(e){
				elem.src = src;
			}
		};

		var handleSources = function(source){
			var customMedia;

			var sourceSrcset = source[_getAttribute](lazySizesConfig.srcsetAttr);

			if( (customMedia = lazySizesConfig.customMedia[source[_getAttribute]('data-media') || source[_getAttribute]('media')]) ){
				source.setAttribute('media', customMedia);
			}

			if(sourceSrcset){
				source.setAttribute('srcset', sourceSrcset);
			}
		};

		var lazyUnveil = rAFIt(function (elem, detail, isAuto, sizes, isImg){
			var src, srcset, parent, isPicture, event, firesLoad;

			if(!(event = triggerEvent(elem, 'lazybeforeunveil', detail)).defaultPrevented){

				if(sizes){
					if(isAuto){
						addClass(elem, lazySizesConfig.autosizesClass);
					} else {
						elem.setAttribute('sizes', sizes);
					}
				}

				srcset = elem[_getAttribute](lazySizesConfig.srcsetAttr);
				src = elem[_getAttribute](lazySizesConfig.srcAttr);

				if(isImg) {
					parent = elem.parentNode;
					isPicture = parent && regPicture.test(parent.nodeName || '');
				}

				firesLoad = detail.firesLoad || (('src' in elem) && (srcset || src || isPicture));

				event = {target: elem};

				if(firesLoad){
					addRemoveLoadEvents(elem, resetPreloading, true);
					clearTimeout(resetPreloadingTimer);
					resetPreloadingTimer = setTimeout(resetPreloading, 2500);

					addClass(elem, lazySizesConfig.loadingClass);
					addRemoveLoadEvents(elem, rafSwitchLoadingClass, true);
				}

				if(isPicture){
					forEach.call(parent.getElementsByTagName('source'), handleSources);
				}

				if(srcset){
					elem.setAttribute('srcset', srcset);
				} else if(src && !isPicture){
					if(regIframe.test(elem.nodeName)){
						changeIframeSrc(elem, src);
					} else {
						elem.src = src;
					}
				}

				if(isImg && (srcset || isPicture)){
					updatePolyfill(elem, {src: src});
				}
			}

			if(elem._lazyRace){
				delete elem._lazyRace;
			}
			removeClass(elem, lazySizesConfig.lazyClass);

			rAF(function(){
				if( !firesLoad || (elem.complete && elem.naturalWidth > 1)){
					if(firesLoad){
						resetPreloading(event);
					} else {
						isLoading--;
					}
					switchLoadingClass(event);
				}
			}, true);
		});

		var unveilElement = function (elem){
			var detail;

			var isImg = regImg.test(elem.nodeName);

			//allow using sizes="auto", but don't use. it's invalid. Use data-sizes="auto" or a valid value for sizes instead (i.e.: sizes="80vw")
			var sizes = isImg && (elem[_getAttribute](lazySizesConfig.sizesAttr) || elem[_getAttribute]('sizes'));
			var isAuto = sizes == 'auto';

			if( (isAuto || !isCompleted) && isImg && (elem[_getAttribute]('src') || elem.srcset) && !elem.complete && !hasClass(elem, lazySizesConfig.errorClass) && hasClass(elem, lazySizesConfig.lazyClass)){return;}

			detail = triggerEvent(elem, 'lazyunveilread').detail;

			if(isAuto){
				 autoSizer.updateElem(elem, true, elem.offsetWidth);
			}

			elem._lazyRace = true;
			isLoading++;

			lazyUnveil(elem, detail, isAuto, sizes, isImg);
		};

		var onload = function(){
			if(isCompleted){return;}
			if(Date.now() - started < 999){
				setTimeout(onload, 999);
				return;
			}
			var afterScroll = debounce(function(){
				lazySizesConfig.loadMode = 3;
				throttledCheckElements();
			});

			isCompleted = true;

			lazySizesConfig.loadMode = 3;

			throttledCheckElements();

			addEventListener('scroll', function(){
				if(lazySizesConfig.loadMode == 3){
					lazySizesConfig.loadMode = 2;
				}
				afterScroll();
			}, true);
		};

		return {
			_: function(){
				started = Date.now();

				lazysizes.elements = document.getElementsByClassName(lazySizesConfig.lazyClass);
				preloadElems = document.getElementsByClassName(lazySizesConfig.lazyClass + ' ' + lazySizesConfig.preloadClass);
				hFac = lazySizesConfig.hFac;

				addEventListener('scroll', throttledCheckElements, true);

				addEventListener('resize', throttledCheckElements, true);

				if(window.MutationObserver){
					new MutationObserver( throttledCheckElements ).observe( docElem, {childList: true, subtree: true, attributes: true} );
				} else {
					docElem[_addEventListener]('DOMNodeInserted', throttledCheckElements, true);
					docElem[_addEventListener]('DOMAttrModified', throttledCheckElements, true);
					setInterval(throttledCheckElements, 999);
				}

				addEventListener('hashchange', throttledCheckElements, true);

				//, 'fullscreenchange'
				['focus', 'mouseover', 'click', 'load', 'transitionend', 'animationend', 'webkitAnimationEnd'].forEach(function(name){
					document[_addEventListener](name, throttledCheckElements, true);
				});

				if((/d$|^c/.test(document.readyState))){
					onload();
				} else {
					addEventListener('load', onload);
					document[_addEventListener]('DOMContentLoaded', throttledCheckElements);
					setTimeout(onload, 20000);
				}

				if(lazysizes.elements.length){
					checkElements();
					rAF._lsFlush();
				} else {
					throttledCheckElements();
				}
			},
			checkElems: throttledCheckElements,
			unveil: unveilElement
		};
	})();


	var autoSizer = (function(){
		var autosizesElems;

		var sizeElement = rAFIt(function(elem, parent, event, width){
			var sources, i, len;
			elem._lazysizesWidth = width;
			width += 'px';

			elem.setAttribute('sizes', width);

			if(regPicture.test(parent.nodeName || '')){
				sources = parent.getElementsByTagName('source');
				for(i = 0, len = sources.length; i < len; i++){
					sources[i].setAttribute('sizes', width);
				}
			}

			if(!event.detail.dataAttr){
				updatePolyfill(elem, event.detail);
			}
		});
		var getSizeElement = function (elem, dataAttr, width){
			var event;
			var parent = elem.parentNode;

			if(parent){
				width = getWidth(elem, parent, width);
				event = triggerEvent(elem, 'lazybeforesizes', {width: width, dataAttr: !!dataAttr});

				if(!event.defaultPrevented){
					width = event.detail.width;

					if(width && width !== elem._lazysizesWidth){
						sizeElement(elem, parent, event, width);
					}
				}
			}
		};

		var updateElementsSizes = function(){
			var i;
			var len = autosizesElems.length;
			if(len){
				i = 0;

				for(; i < len; i++){
					getSizeElement(autosizesElems[i]);
				}
			}
		};

		var debouncedUpdateElementsSizes = debounce(updateElementsSizes);

		return {
			_: function(){
				autosizesElems = document.getElementsByClassName(lazySizesConfig.autosizesClass);
				addEventListener('resize', debouncedUpdateElementsSizes);
			},
			checkElems: debouncedUpdateElementsSizes,
			updateElem: getSizeElement
		};
	})();

	var init = function(){
		if(!init.i){
			init.i = true;
			autoSizer._();
			loader._();
		}
	};

	lazysizes = {
		cfg: lazySizesConfig,
		autoSizer: autoSizer,
		loader: loader,
		init: init,
		uP: updatePolyfill,
		aC: addClass,
		rC: removeClass,
		hC: hasClass,
		fire: triggerEvent,
		gW: getWidth,
		rAF: rAF,
	};

	return lazysizes;
}
));

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
//# sourceMappingURL=bba.js.map
