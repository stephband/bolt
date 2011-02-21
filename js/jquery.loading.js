// jquery.loading.js
//
// 0.3
//
// Stephen Band
//
// Adds two plugins to the jQuery.fn namespace: .addLoadingIcon()
// and .removeLoadingIcon(). Loading icons are drawn in an html5
// canvas and support CSS transitions when jQuery.support.cssTransition
// is true.

(function(jQuery, undefined){
	
//	var debug = (window.console && console.log);
	var debug = false;
	// VAR
	
	var // A constant that enables us to make circular
			// quarter arcs from bezier curves.
			k = 0.5522847498,
			dot = [
				{ type: 'moveTo', data: [0,0] },
				{ type: 'bezierCurveTo', data: [k,0,1,1-k,1,1] },
				{ type: 'bezierCurveTo', data: [1,1,1,2,1,2] },
				{ type: 'bezierCurveTo', data: [1,2+k,k,3,0,3] },
				{ type: 'bezierCurveTo', data: [-k,3,-1,2+k,-1,2] },
				{ type: 'bezierCurveTo', data: [-1,2,-1,1,-1,1] },
				{ type: 'bezierCurveTo', data: [-1,1-k,-k,0,0,0] }
			];
	
	var d = {
				width: 160,
				height: 160,
				number: 12
			};
	
	// FUNCTIONS
	
	function canvas(width, height, fn){
		var c = document.createElement('canvas');
		
		c.setAttribute('width', width);
		c.setAttribute('height', height);
		
		return fn(c);
	}
	
	function context(canvas, fn){
		var c = canvas.getContext('2d');
		
		return fn(c);
	}
	
	function plot(context, path) {
		var i = -1,
				l = path.length;
		
		while ( ++i < l ){
			context[ path[i].type ].apply( context, path[i].data );
		}
	}
	
	function drawFrame(ctx, frame){
		var i = d.number,
				subframe = frame%4;
		
		if (subframe === 0) {
			ctx.rotate( Math.PI*2/i );
		}
		
		ctx.clearRect(-d.width, -d.height, d.width*2, d.height*2);
		ctx.save();
		ctx.fillStyle = 'rgb(255,255,255)';
		ctx.scale(6,6);
		
		while(i--){
			ctx.rotate( -Math.PI*2/d.number );
			ctx.save();
			ctx.translate(0,6);
			ctx.fillStyle = 'rgba(255,255,255,'+( 0.8 * i/(d.number-1) + 0.2 - subframe/80 )+')';
			ctx.beginPath();
			
			plot(ctx, dot);
			
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		}
		
		ctx.restore();
	}
	
	function Timer(frameDuration, fn){
		var i = 0, t;
		
		this.start = function timer(){
			fn(++i);
			debug && console.log('frame', i);
			// Set a timeout of 400 frames - we don't
			// want forgotten timers running away
			// with themselves.
			if ( i > 400 ) { return; }
			t = setTimeout(timer, frameDuration);
		};
		
		this.stop = function(){
			clearTimeout(t);
			t = null;
			i = 0;
		};
	}
	
	function Data( elem ) {
		var layer = jQuery('<div/>', { 'class': 'loading_layer layer' }),
				transitionEnd = jQuery.support.css && jQuery.support.css.transitionEnd,
				timer;
		
		canvas(d.width, d.height, function(canvas){
			context(canvas, function(ctx){
				// Origin in the centre
				ctx.translate(d.width/2, d.height/2);
				
				timer = new Timer(25, function(frameCount){
					drawFrame(ctx, frameCount);
				});
			});
			
			layer.html(canvas);
		});
		
		function started(){
			debug && console.log('Icon is already running, numbnuts.');
		}
		
		function stopped(){
			debug && console.log('You cannot stop an icon that is not running.');
		}
		
		function start(){
			// Start the timer, show the layer
			timer.start();
			elem.append( layer );
			
			// Force reflow and add transition class
			elem.width();
			elem.addClass( 'loading' );
			
			// Set state
			this.start = started;
			this.stop = stop;
		}
		
		function stop(){
			// Hide the layer and stop the timer, using css
			// transitions if they are available
//			if ( transitionEnd ) {
//				elem.bind( transitionEnd, function remove(e){
//					elem.unbind( transitionEnd, remove );
//					layer.remove();
//					timer.stop();
//				});
//			}
//			else {
				layer.remove();
				timer.stop();
//			}
			
			elem.removeClass( 'loading' );
			
			// Set state
			this.start = start;
			this.stop = stopped;
		}
		
		// Set state
		this.start = start;
		this.stop = stopped;
	}
	
	function returnData( elem ){
		var data = elem.data( 'loading' );
		
		// If there is no data object, construct a new one
		// and attach it to the element.
		if (!data) {
			data = new Data( elem );
			elem.data( 'loading', data );
		}
		
		return data;
	}
	
	// PLUGIN
	
	jQuery.fn.addLoadingIcon = function(o){
		return this.each(function(){
			var elem = jQuery(this),
					data = returnData(elem);
			
			data.start();
		});
	};
	
	jQuery.fn.removeLoadingIcon = function(){
		return this.each(function(){
			var elem = jQuery(this),
					data = elem.data('loading');
			
			// Nothing to do if the icon is not active
			if (!data) { return; }
			
			data.stop();
		});
	};
	
})(jQuery);


(function(jQuery, undefined){
  /* Hack to prevent double-click on button */	
  jQuery.fn.addLoadingButton = function(){
		return this.each(function(){
      var elem  = jQuery(this),
          text = elem.html(),
          href = elem.attr("href");
          
      elem.html(text+"...")
          .attr("href","#performing_action")
          .data("original",{"text": text,"href":href})
          .css({ pointerEvents: "none" });
		});
	};
  jQuery.fn.removeLoadingButton = function(){
		return this.each(function(){
		  var elem = jQuery(this),
		      text = elem.data("original").text,
		      href = elem.data("original").href;
		      
		  elem.html(text)
		      .attr("href",href)
		      .removeData("original")
		      .css({ pointerEvents: "auto" });
		});
	};
})(jQuery);
