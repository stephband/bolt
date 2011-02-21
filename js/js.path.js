// Temporary merge of path.js and path.union.js --------------------------


// Path
// 
// 0.5
// 
// A wrapper, and library of methods for manipulating, paths.


(function(undefined){
	
	// VAR
	
	var debug = (window.console && console.log);
	
	var pi = Math.PI,
			pi2 = 2*pi,
			sin = Math.sin,
			cos = Math.cos;
			
	var svgTypeMap = {
				moveTo: 'M',
				lineTo: 'L',
				bezierCurveTo: 'C',
				closePath: 'Z'
			};
	
	var svgToPathMap = {
				M: { type: 'moveTo', length: 2 },
				L: { type: 'lineTo', length: 2 },
				C: { type: 'bezierCurveTo', length: 6 }
				//Z: { type: 'closePath', length: 0 },
				//z: { type: 'closePath', length: 0 }
			};
	
	// EXTEND
	
	if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
  }
	
	// FUNCTIONS
	
	// Converts cartesian [x, y] to polar [distance, angle] coordinates,
	// normalised to upwards, clockwise, angle 0 - 2pi.
	
	function toPolar(cart) {
		var x = cart[0],
				y = cart[1] * -1;
		
		// Detect quadrant and work out vector
		if (y === 0) 	{ return x === 0 ? [0, 0] : x > 0 ? [x, 0.5 * pi] : [-x, 1.5 * pi] ; }
		if (y < 0) 		{ return x === 0 ? [-y, pi] : [Math.sqrt(x*x + y*y), Math.atan(x/y) + pi] ; }
		if (y > 0) 		{ return x === 0 ? [y, 0] : [Math.sqrt(x*x + y*y), (x > 0) ? Math.atan(x/y) : pi2 + Math.atan(x/y)] ; }
	}
	
	// Converts [distance, angle] vector to cartesian [x, y] coordinates.
	
	function toCartesian(vect) {
		var d = vect[0],
				a = vect[1];
		
		// Work out cartesian coordinates
		return [ Math.sin(a) * d, - Math.cos(a) * d ];
	}
	
	// Turn an SVG path DOM element into a Path. Some regex borrowed
	// from canvg ( http://code.google.com/p/canvg/ )
	// TODO: Error handling...
	
	function svgDataToPath( d ){
			var path = Object.create(pathPrototype),
					map, l, i, k, m, arr;
    	
    	// TODO: floating points, convert to real lexer based on http://www.w3.org/TR/SVG11/paths.html#PathDataBNF
    	d = d.replace(/,/gm,' '); // get rid of all commas
    	d = d.replace(/([A-Za-z])([A-Za-z])/gm,'$1 $2'); // separate commands from commands
    	d = d.replace(/([A-Za-z])([A-Za-z])/gm,'$1 $2'); // separate commands from commands
    	d = d.replace(/([A-Za-z])([^\s])/gm,'$1 $2'); // separate commands from points
    	d = d.replace(/([^\s])([A-Za-z])/gm,'$1 $2'); // separate commands from points
    	d = d.replace(/([0-9])([+\-])/gm,'$1 $2'); // separate digits when no comma
    	d = d.replace(/(\.[0-9]*)(\.)/gm,'$1 $2'); // separate digits when no comma
    	d = d.replace(/([Aa](\s+[0-9]+){3})\s+([01])\s*([01])/gm,'$1 $3 $4 '); // shorthand elliptical arc path syntax
			d = d.split(' ');
			
			l = d.length;
			i = -1;
			k = 0;
			
			while (++i < l) {
				if ( svgToPathMap[ d[i] ] ) {
					map = svgToPathMap[ d[i] ];
					
					path[k] = {
						type: map.type
					};
					
					if ( map.length ) {
						arr = d.slice( i+1, i+1+map.length );
						m = map.length;
						
						// Convert from strings to numbers
						while (m--) { arr[m] = parseFloat( arr[m] ); }
						path[k].data = arr;
					}
					else {
						path[k].data = [];
					}
					
					k++;
					i = i+map.length;
				}
			}
			
			path.length = k;
			return path;
	}
	
	// Define the Path API as a prototype
	
	var pathPrototype = {
		
		// .addDeformPath() takes a name and path, and stores the
		// cartesian difference between that path and this one in the
		// .deformPaths property, using the name as the key. If the
		// number and type of lines in the deform path does not match
		// those in this path, it must throw a silent error.
		
		addDeform: function( name, deformPath ){
			var l = this.length,
					data, i, deform, deformData, outData;
			
			if (!this.deforms) { this.deforms = {}; }
			
			deform = this.deforms[name] = {};
			
			// Check lengths match
			if (debug) {
			  if ( this.length !== deformPath.length ) {
			  	debug && console.log('[Path] trying to addDeformPath, but lengths don\'t match', this.length, deformPath.length);
			  }
			}
			
			// Loop through path instructions
			while(l--){
				data = this[l].data;
				i = data.length;
				deformData = deformPath[l].data;
				outData = [];
				
				// Check types match
				if (debug) {
					if ( this[l].type !== deformPath[l].type ) {
						debug && console.log('[Path] trying to addDeformPath, but types at point '+l+' don\'t match');
					}
				}
				
				// process data
				while(i--){
					outData[i] = deformData[i] - data[i];
				}
				
				deform[l] = outData;
			}
			
			return this;
		},
		
		// .removeDeformPath() removes the deform path of this name
		// from the deformPaths property. There is no real reason for
		// this method, other than symmetry.
		
		removeDeform: function( name ){
			if (this.deforms && this.deforms[name]) {
				delete this.deforms[name];
			}
			
			return this;
		},
		
		// .deform() takes an option object with keys that correspond
		// to named deformPaths and values that describe how much of
		// that deformPath to apply to this path, where 0 is none and
		// 1 is 100% of the deformPath. Values outside of the range
		// 0-1 are allowed.
		
		deform: function( options ){
			var path = Object.create(pathPrototype),
					l = this.length,
					deforms = this.deforms,
					data, i, value, key, outData;
					
			// Loop through path instructions
			while(l--){
				data = this[l].data;
				i = data.length;
				outData = [];
				
				// Process coordinates
				while(i--){
					value = data[i];
					
					// Process deforms
					for (key in options) {
						value = value + deforms[key][l][i] * options[key] ;
					}
					
					outData[i] = value;
				}
				
				path[l] = { type: this[l].type, data: outData };
			}
			
			path.length = this.length;
			return path;
		},
		
		// .displace() is a special form of deform, where all points
		// are displaced by the same amount along the x and y axes.
		
		displace: function( x, y ){
			var path = Object.create(pathPrototype),
					l = this.length,
					data, i, outData;
					
			// Loop through path instructions
			while(l--){
				data = this[l].data;
				i = data.length;
				outData = [];
				
				// Split data into coordinate pairs and process
				while(i){
					
					outData[i-2] = data[i-2] + x;
					outData[i-1] = data[i-1] + y;
					
					i = i-2;
				}
				
				path[l] = { type: this[l].type, data: outData };
			}
			
			path.length = this.length;
			return path;
		},
		
		// .rotate() takes all points and rotates them round the origin
		
		rotate: function( angle ){
			var l = this.length,
					path = Object.create(pathPrototype),
					data, i, polar, cart, outData;
			
			// Loop through path instructions
			while(l--){
				data = this[l].data;
				i = data.length;
				outData = [];
				
				// Split data into coordinate pairs and process
				while(i){
					polar = toPolar( data.slice(i-2, i) );
					cart = toCartesian( [ polar[0], polar[1]+angle ] );
					
					outData[i-2] = cart[0];
					outData[i-1] = cart[1];
					
					i = i-2;
				}
				
				path[l] = { type: this[l].type, data: outData };
			}
			
			path.length = this.length;
			return path;
		},
		
		// Spherize wraps the 'flat' plane of points round a sphere,
		// where radius is the radius of the sphere as seen from
		// an infinite distance, and distance defines the amount of
		// perspective distortion applied to that projection.
		// [TODO: origin is not implemented]
		
		spherize: function( radius, distance ){
			var r = radius || 100,
					z = distance || 800,
					l = this.length,
					path = Object.create(pathPrototype),
					data, i, dr, ds, polar, cart, outData;
			
			// Loop through path instructions
			while(l--){
				data = this[l].data;
				i = data.length;
				outData = [];
				
				// Split data into coordinate pairs and process
				while(i){
					polar = toPolar( data.slice(i-2, i) );
					
					dr = polar[0] / r;
					ds = ( z*r*sin(dr) ) / ( z-r*cos(dr) );
					cart = toCartesian( [ds, polar[1]] );
					
					outData[i-2] = cart[0];
					outData[i-1] = cart[1];
					
					i = i-2;
				}
				
				path[l] = { type: this[l].type, data: outData };
			}
			
			path.length = this.length;
			return path;
		},
		
		// [TODO] .union() takes another path object as an argument,
		// and calculates and returns the union of that path and the
		// current path as a new path.
		
		union: function( inPath ){
			var result = new pathUnion(this,inPath);
			var pUnion = result.path;
			var l = pUnion.length;
			var path = Object.create(pathPrototype);
			
			while(l--){
				path[l] = { type: pUnion[l].type, data: pUnion[l].data };
			}
			
			// Calculate the union of 'this' and 'path', populate and
			// return the resulting path.   
			
			path.length = pUnion.length;
			return path;
		},
		
		// Calculate the mean centre of all the points in the path
		// and return an [ x, y ] array.
		
		mean: function(){
			var l = this.length,
					xSum = 0, ySum = 0,
					data, i, result;
			
			// Loop through path instructions
			while(l--){
				data = this[l].data;
				i = data.length;
				
				xSum += data[i-2];
				ySum += data[i-1];
			}
			
			result = [ xSum/this.length, ySum/this.length ];
			
			// Cache this answer for next time some monkey asks for it.
			this.mean = function(){
				return result;
			};
			
			return result;
		},
		
		// Calculate the centre of an imaginary box that encloses all
		// the points.
		
		centre: function(){
			var limits = this.limits(),
					result;
			
			result = [ ( (limits[2]-limits[0]) / 2 ) + limits[0] , ( (limits[3]-limits[1]) / 2 ) + limits[1] ];
			
			// Cache the result
			this.centre = function(){
				return result;
			};
			
			return result;
		},
		
		// Find the range of the points
		
		range: function(){
			var limits = this.limits();
			return [ limits[2] - limits[0], limits[3] - limits[1] ];
		},
		
		// Find the limits of the points
		
		limits: function(){
			var l = this.length,
					xMin, yMin, xMax, yMax,
					data, i, result;
			
			while(l--){
				data = this[l].data;
				
				if (data) {
					i = data.length;
					
					xMin = ( xMin === undefined || data[i-2] < xMin ) ? data[i-2] : xMin ;
					yMin = ( yMin === undefined || data[i-1] < yMin ) ? data[i-1] : yMin ;				
					xMax = ( xMax === undefined || data[i-2] > xMax ) ? data[i-2] : xMax ;
					yMax = ( yMax === undefined || data[i-1] > yMax ) ? data[i-1] : yMax ;
				}
			}
			
			result = [ xMin, yMin, xMax, yMax ];
			
			// Cache this answer for next time some monkey asks for it.
			this.limits = function(){
				return result;
			};
			
			return result;
		},
		
		// .concat() like Array.concat()
		
		concat: function( inPath ){
			var array = [],
					i = -1,
					lt = this.length,
					li = inPath.length,
					path = Object.create(pathPrototype);
			
			while (lt--){
				path[lt] = this[lt];
			}
			
			while (li--){
				path[li + this.length] = inPath[li];
			}
			
			path.length = this.length + inPath.length;
			
			return path;
		},
		
		// .toJSON() returns this data as a JSON Array
		
		toJSON: function(){
			var array = [],
					i = -1,
					l = this.length;
			
			while (++i < l) {
				array.push( this[i] );
			}
			
			return JSON.stringify( array );
		},
		
		// .toSVG() returns this path as an SVG DOMNode.
		
		toSVG: function( options ){
			var pathNode = document.createElement('path'),
					key;
			
			for ( key in options ){
				pathNode.setAttribute( key, options[key] );
			}
			pathNode.setAttribute( 'd', this.toSVGData() );
			return pathNode;
		},
		
		toSVGData: function(){
			var array = [],
					i = -1,
					l = this.length;
			
			while (++i < l) {
				array.push( svgTypeMap[ this[i].type ] + this[i].data.join(' ') );
			}
			
			return array.join(' ');
		}
	};
	
	// Path() takes an object that defines a path, or a JSON string
	// that defines a path, or an SVGDOMNode that defines a path, and
	// constructs an array-like object with a chainable API.
	
	function Path( obj ){
		var path, l;
		
		// If the path is an svg path DOM element, translate it to
		// a path obj.
		if ( obj.nodeType && obj.nodeType === 1 ) {
			return svgDataToPath( obj.getAttribute('d') );
		}
		
		// If it's a string, let's assume we're trying to parse SVG data
		if ( typeof obj === 'string' ) {
			return svgDataToPath( obj );
		}
		
		path = Object.create(pathPrototype);
		l = path.length = obj.length;
		
		// Copy array to object to make array-like object 
		while (l--){
			path[l] = obj[l];
		}
		
		return path;
	}
	
	window.Path = Path;
	
})();



// path.union.js ------------------------------------------------------



/*** pathIntersection ***/

function pathUnion(path1,path2){
	this.paths = [path1,path2];	
	/*[[indexPath1,indexPath2,[ [{x:X,y:Y}, t1,t2],...]]]*/
	var res = this.getAllInsersectionPoints();
	this.points = res;
	this.path = [];
	if(!res.length){
		this.path = this.getPathsUnion();
	}
	else{
		this.start = this.getStartPoint();
		this.getOverallPath();
	}
	this.path = this.getPathFromPoints(this.path);
}

/*gets the path union (non intersection case)*/
pathUnion.prototype.getPathsUnion = function(){
	var limits = [],
			i = 0;
	limits[0] = this.getPathLimits(0);
	limits[1] = this.getPathLimits(1);
	var path0 = [];
	var path1 = [];
	for(i=0;i<this.bounds[0].length;i++)
		path0.push(this.getPoints(this.bounds[0][i]));
	for(i=0;i<this.bounds[1].length;i++)
		path1.push(this.getPoints(this.bounds[1][i]));
	var mid0 = limits[0][0].lerp(limits[0][1],0.5);
	var res1 = this.isPointInside(mid0,limits[1]);
	if(res1) return path1;
	var mid1 = limits[1][0].lerp(limits[1][1],0.5);
	var res2 = this.isPointInside(mid1,limits[0]);
	if(res2) return path0;
	return path0.concat(path1);
};

/*checks if the point is inside the path*/
pathUnion.prototype.isPointInside = function(p,limits){
	return (p.x<=limits[1].x&&p.x>=limits[0].x&&p.y<=limits[1].y&&p.y>=limits[0].y);
};

pathUnion.prototype.getPathLimits = function(pi){
	var minX = Infinity;
	var minY = Infinity;
	var maxX = -Infinity;
	var maxY = -Infinity;
	var bounds = this.bounds[pi];
	for(var i =0; i < bounds.length;i++){
		var points = this.getPoints(bounds[i]);
		for(var j = 0; j < points.length; j++){
			minX = Math.min(minX,points[j].x);
			minY = Math.min(minY,points[j].y);
			maxX = Math.max(maxX,points[j].x);
			maxY = Math.max(maxY,points[j].y);
		}
	}
	return [new Point(minX,minY),new Point(maxX,maxY)];
};

/**gets overall path
	@param pi - path index
	@param li - line index
	@param point - point of intersection
**/
pathUnion.prototype.getOverallPath = function(pi,li,point){
	if(!arguments.length){
		pi = this.start[0];
		li = this.start[1];
		this.startPoint = [this.bounds[pi][li][0],this.bounds[pi][li][1]];

	}
	var i = li;
	
	var bounds = this.bounds[pi];
	var endX = bounds[i][bounds[i].length-2];
	var endY = bounds[i][bounds[i].length-1];
	 
	var p =  this.getLineIntersectionPoints(pi,i),
			curve;
		
	/*if the line needs being splitted*/
	if(point){
		curve = this.getSplittedCurveAfter(pi,i,point);
			
		this.path.push(curve[0]);
		if(curve[1] == (p.length-1)){
			
			endX = curve[0][3].x;
			endY = curve[0][3].y;
			
		 	if(this.isPathFinished(pi,i,endX,endY)){
				return null;
			}
			else{
			
				i = this.getNextIndex(pi,i,curve[0][3]);
				
				endX = bounds[i][bounds[i].length-2];
				endY = bounds[i][bounds[i].length-1];
			}
		}else{
			return this.getOverallPath(1-pi,p[curve[1]+1].line2Index,p[curve[1]+1].point);
		}
	}
	if(!this.getLineIntersectionPoints(pi,i).length&&this.isPathFinished(pi,i,endX,endY)){
		
		this.path.push(this.getPoints(bounds[i]));
		return null;
	}
	
	if(!this.processed_points)
	   	this.processed_points = {};
	if(!this.processed_points[pi])
		this.processed_points[pi] = {};
	
	
	p =  this.getLineIntersectionPoints(pi,i);
	
	if(!p.length){
		
		var pI = this.getPoints(bounds[i]);
	   	this.path.push(pI);
	  	i = this.getNextIndex(pi,i,pI[pI.length-1]);
	    return this.getOverallPath(pi,i);
	}
	else{
		if(!this.processed_points[pi][i])
			this.processed_points[pi][i] = 0;
		var inters_point = this.processed_points[pi][i];
		if(!p[inters_point]) return;
		
		curve = this.getSplittedCurveBefore(pi,i,p[inters_point].point);
	    this.processed_points[pi][i]++;
		
	   	this.path.push(curve[0]);
	   	return this.getOverallPath(1-pi,p[inters_point].line2Index,p[inters_point].point);
	}
	
	return null;
};

pathUnion.prototype.isPathFinished = function(pi,i,x,y){
	var bounds = this.bounds[pi];
	if((pi==this.start[0])&&(i==(bounds.length-1))&&this.startPoint[0]==x&&this.startPoint[1]==y)
		return true;
	return false;
};

/** gets the index for the next point in overall path
    @param pi - path index
	@param i - line index
	@param point - the last point of a line
	returns 
**/
pathUnion.prototype.getNextIndex = function(pi,i,point){
	var path = this.bounds[pi];
	for(var j=0; j<path.length;j++){
		var points = this.getPoints(path[j]);
		if(points.length==1) continue;
		if(points[0].isEqual(point)) return j;
	}
};
/**splits the curve by point and returns the 1st sub curve
    @param pi - path index
	@param i - line index
	@param point - splitting point
	returns array:
		0: curve [p0,p1,p2,p3]
		1: the index of the point
**/
pathUnion.prototype.getSplittedCurveBefore = function(pi,i,point){
	var curves = this.getAllSubCurves(pi,i);
	var p =  this.getLineIntersectionPoints(pi,i);
	for(var j = 0; j<p.length;j++)
		if(p[j].point == point) return [curves[j],j];
};
/**splits the curve by point and returns the 2st sub curve
    @param pi - path index
	@param i - line index
	@param point - splitting point
	returns array:
		0: curve [p0,p1,p2,p3]
		1: the index of the point
**/
pathUnion.prototype.getSplittedCurveAfter = function(pi,i,point){
	var curves = this.getAllSubCurves(pi,i);
	var p =  this.getLineIntersectionPoints(pi,i);
	for(var j = 0; j<p.length;j++)
		if(p[j].point == point) return [curves[j+1],j];
};
/** gets the array of all sub curves of a curve
    @param pi - path index
	@param i - line index
	returns the array [[p00,p01,p02,p03],[p10,p11,p12,p13],..]
**/
pathUnion.prototype.getAllSubCurves = function(pi,i){
	var p =  this.getLineIntersectionPoints(pi,i);
	if(!p.length) return [this.getPoints(this.bounds[pi][i])];
	var curves = [];
	var res, temp;
	for(var j = 0; j<p.length;j++){
		if(!j)			
			res = this.splitCurve( this.getPoints(this.bounds[pi][i]),p[0].point);
		else 
			res = this.splitCurve(temp,p[j].point);
		
		temp = res[1];
		curves[j] = res[0];
		if(j==(p.length-1)) curves[p.length] = res[1];
	}
	return curves;
};
/**get path the [{type:canvasMethod,data:[param0,param1,...]},...] format
   @param points - array of path points [[param00,param01,...],...]
   returns array
**/
pathUnion.prototype.getPathFromPoints= function(points){
	var path = [];
	if(points.length) path.push({type:"moveTo",data:[points[0][0].x,points[0][0].y]});
	for(var i = 0; i < points.length;i++){
		var p = points[i];
		if(p.length==1){
			path.push({type:"moveTo",data:[p[0].x,p[0].y]});
		}
		else if(p.length==2)
			path.push({type:"lineTo",data:[p[1].x,p[1].y]});
		else if(p.length==4)
			path.push({type:"bezierCurveTo",data:[p[1].x,p[1].y,p[2].x,p[2].y,p[3].x,p[3].y]});
	}
	return path;
};

/** gets points of intersection for a certain line
    @param pathIndex - index of a path (0 or 1)
	@param lineIndex - index of the line in a path
	returns the array (sorted by t) of objects {}:
	   t: the t of a point,
	   line2Index: index of the line in path 2, 
	   point: {x:X,y:Y}
**/
pathUnion.prototype.getLineIntersectionPoints = function(pathIndex,lineIndex){
	var points = [];
	var ip = this.points;
	for(var j = 0; j< ip.length;j++){
		if(ip[j][pathIndex]&&ip[j][pathIndex] == lineIndex){
			for(var k = 0; k< ip[j][2].length;k++){
				points.push({t:ip[j][2][k][1+pathIndex],line2Index:ip[j][1-pathIndex],point:ip[j][2][k][0]});
			}
		}
	}
	points.sort(function(a,b){return a.t > b.t ? 1 : -1; });
	return points;
};
/** gets the start point of the overall path
    @param pathIndex - index of a path (0 or 1)
	@param lineIndex - index of the line in a path
	@param line2Index - index of the checked line in the other path
	returns array of [pathIndex,lineIndex]
**/
pathUnion.prototype.getStartPoint = function(i,ic,jc){
	if(!arguments.length){
		i=0;
		ic=0;
		jc=1;
	}
	ic++;
	
	var spath = this.bounds[i][ic];
	var limits = this.getPathLimits(1-i);
	if(!this.isPointInside(new Point(spath[0],spath[1]),limits))
		return [i,ic];
	var maxP = limits[1];
	var path2 = this.bounds[1-i];
	var length = 0;
	for(var k=1;k< path2.length;k++){
		var p = this.getPoints(path2[k]);
		if(p.length<4) continue;
		var res = this.intersectLineCurve(new Point(spath[0],spath[1]),new Point(maxP.x+1,maxP.y+10),p[0],p[1],p[2],p[3]);
		if(res){
			length +=res.length;
		}
	}
	if(length&&length%2)
		return this.getStartPoint(1-i,jc,ic);
	return [i,ic];
};
/** splits the bezier curve on 2 curves
	@param c - the array of 4 control points [{x:x0,y:y0},...,{x:x3,y:y3}]
	@param p - the point of intersection {x:X,y:Y}
	returns array of control points for 2 subcurves [[{x:x01,y:y01},...],[{x:x02,y:y02},...]]
**/
pathUnion.prototype.splitCurve = function(c,p){
	var t = this.getT(c[0],c[1],c[2],c[3],p);
	var sub1 = [];
	var sub2 = [];
	sub1[0] = c[0];
	sub1[1] = this.splitLine(c[0],c[1],t);
	var q = this.splitLine(c[1],c[2],t);
	sub1[2] = this.splitLine(sub1[1],q,t);
	sub1[3] = p;
	sub2[0] = p;
	sub2[2] = this.splitLine(c[2],c[3],t);
	sub2[1] = this.splitLine(q,sub2[2],t);
	sub2[3] = c[3];
	return [sub1,sub2];
};
/** gets t for intersection point
	@param p0 - the 1st control point 
	@param p1 - the 2nd control point 
	@param p2 - the 3rd control point 
	@param p3 - the 4th control point 
	@param p - the point of intesection 
	@returns t
**/
pathUnion.prototype.getT = function(p0,p1,p2,p3,p){
	var ax = 3*(p1.x-p0.x)+3*(p3.x-p2.x)-2*(p3.x-p0.x);
	var ay = 3*(p1.y-p0.y)+3*(p3.y-p2.y)-2*(p3.y-p0.y);
	var bx = -6*(p1.x-p0.x)-3*(p3.x-p2.x)+3*(p3.x-p0.x);
	var by = -6*(p1.y-p0.y)-3*(p3.x-p2.y)+3*(p3.x-p0.y);
	var cx = 3*(p1.x-p0.x);
	var cy = 3*(p1.y-p0.y);
	var a,b,c;
	if(ax !== 0){
		var d = ay/ax;
		/*parameters of quadratic equation*/	
		a = d*bx-by;
		b = d*cx-cy;
		c = d*p0.x-d*p.x-p0.y+p.y;
	}
	else{
		a = bx;
		b = cx;
		c = p0.x-p.x;
	}
	var t1 = 2*c/(-b-Math.sqrt(b*b-4*a*c));
	var t2 = 2*c/(-b+Math.sqrt(b*b-4*a*c));
	var t = [];
	if((t1<=1)&&(t1>=0)) t.push(t1);
	if((t2<=1)&&(t2>=0)) t.push(t2);
	if(t.length==1){
	
		return t[0];
	}
	else if(t.length==2){
		return (this.checkT(p0,p1,p2,p3,p,t[0])?t[0]:t[1]);
	}
};
/** tests t for intersection point
	@param p0 - the 1st control point 
	@param p1 - the 2nd control point 
	@param p2 - the 3rd control point 
	@param p3 - the 4th control point 
	@param p - the point of intesection
	@param t - tested t of intersection
	@returns true/false result
**/
pathUnion.prototype.checkT = function(p0,p1,p2,p3,p,t){
	var at = 1-t;
	var at2 = at*at;
	var at3 = at2*at;
	var t2 = t*t;
	var t3 = t2*t;
	var pT = p0.multiply(at3).add(p1.multiply(3*t*at2)).add(p2.multiply(3*t2*at)).add(p3.multiply(t3));
	return pT.isEqual(p);
};
/** splits the line on 2 sub lines
 	@param a - line start {x:X0,y:Y0}
	@param b - line end {x:X1,y:Y1}
	@param t - t of intersection (0<=t<=1)
	returns the point of intersection {x:X,y:Y}
**/
pathUnion.prototype.splitLine = function(a,b,t){
	return a.add(b.subtract(a).multiply(t));
};
/*sets paths bounds*/
pathUnion.prototype.setBounds = function(){
	if(!this.bounds){
		this.bounds = [];
		this.bounds[0] = this.getBounds(this.paths[0]);
		this.bounds[1] = this.getBounds(this.paths[1]);
	}
};
/** gets all points of intersction for two paths
	returns the array of:
		0: the index of the line in path 1
		1: the index of the line in path 2
		2: [{x:X,y:Y}, t1,t2]
**/
pathUnion.prototype.getAllInsersectionPoints = function(){
	var path1 = this.paths[0];
	var path2 = this.paths[1];
	var arr = this.getInsertsectedPoligons(path1,path2);
	this.setBounds();
	var points = [];
	for(var l = 0; l < arr.length; l++){
		var i = arr[l][0];
		var j = arr[l][1];
		var res = this.intersectLines(path1[i].type,path2[j].type,this.bounds[0][i],this.bounds[1][j]);
		if(res&&res.length)
			points.push([i,j,res]);
	}
	return points;
};
pathUnion.prototype.addIntersectionPoint =function(points,i,j,p){
	var exists = false;
	for(var k =0;k < points.length;k++){
		if(points[k][0]==i&&points[k][1]==j){
			exists = true;
			break;
		}
	}
	if(exists){
		for(var l=0;l<points[k][2].length;l++){
			if(points[k][2][l][0]==p)
				return points;
		}
		points[k][2].push([p]);
	}
	else points.push([i,j,[[p]]]);
	return points;
};
/** returns "bounds" interpretation for a path:
		moveTo[x,y] => [x,y]
		lineTo[x2,y2] => [x1,y1,x2,y2]
		bezierCurveTo[x2,y2,x3,y3,x4,y4] =>[x1,y1,x2,y2,x3,y3,x4,y4] 
**/
pathUnion.prototype.getBounds = function(path){
	var bounds = [];
	if(!path) return;
	for(var i =0 ; i < path.length; i++){
		if(!path[i].data) continue;
		if(path[i].type == "moveTo"){
			bounds[i] = path[i].data;
		}
		else if(i!=0){
			bounds[i] = [];
			bounds[i][0] = bounds[i-1][bounds[i-1].length-2];
			bounds[i][1] = bounds[i-1][bounds[i-1].length-1];
			bounds[i] = bounds[i].concat(path[i].data);
		}
		if(bounds[i].length&&bounds[i].length>4){
			var rand = Math.random();
			if(bounds[i][2]==parseInt(bounds[i][2],10))
				bounds[i][2] += 0.01;
			if(bounds[i][3]==parseInt(bounds[i][3],10))
				bounds[i][3] +=  0.02;
		}
	}
	return bounds;
};
/**gets array of possible intersections**/
pathUnion.prototype.getInsertsectedPoligons = function(path1,path2){
	if(!arguments.length){
		path1 = this.paths[0];
		path2 = this.paths[1];
	}
	this.setBounds();
	var inter = [];
	for(var i= 0; i < path1.length; i++){
		for(var j=0; j < path2.length; j++){
			if(path1[i].type&&path2[j].type){
				var res  = this.intersectBounds(path1[i].type,path2[j].type,this.bounds[0][i],this.bounds[1][j]);
				if(res) inter.push([i,j]);
			}
		}
	}
	return inter;
};

/**gets array of objects class Point from values array
   @param values - array [a0,a1,...]
   return array of Point objects [p0,p1,...] where p0.x = a0 and p0.y = a1
**/
pathUnion.prototype.getPoints = function(values){
	var pp = [];
	for(var i = 0; i < values.length; i +=2){
		pp.push(new Point(values[i],values[i+1]));
	}
	return pp;
};

pathUnion.prototype.intersectBounds = function(method1,method2,bounds1,bounds2){
	var p1 = this.getPoints(bounds1);
	var p2 = this.getPoints(bounds2);
	var res;
	if(method1 == "bezierCurveTo"){
	    if(method2 == "lineTo")
			res = this.intersectLinePolygon(p2[0],p2[1],[p1[0],p1[1],p1[2],p1[3]]);
		else if(method2 == "bezierCurveTo")
			res = this.intersectPolygonPolygon([p1[0],p1[1],p1[2],p1[3]],[p2[0],p2[1],p2[2],p2[3]]);
	}
	else if(method1 == "lineTo"){
		if(method2 == "lineTo")
			res = this.intersectLineLine(p1[0],p1[1],p2[0],p2[1]);
		else  if(path2[j].type == "bezierCurveTo")
			res = this.intersectLinePolygon(p1[0],p1[1],[p2[0],p2[1],p2[2],p2[3]]);
	}							
	return res;
};
pathUnion.prototype.intersectLines = function(method1,method2,bounds1,bounds2){
	var p1 = this.getPoints(bounds1);
	var p2 = this.getPoints(bounds2);
	var res;
	if(method1 == "bezierCurveTo"){
	    if(method2 == "lineTo")
			res = this.intersectLineCurve(p2[0],p2[1],p1[0],p1[1],p1[2],p1[3]);
		else if(method2 == "bezierCurveTo"){
			res = this.intersectCurveCurve(p1[0],p1[1],p1[2],p1[3],p2[0],p2[1],p2[2],p2[3]);
		}
	}
	else if(method1 == "lineTo"){
		if(method2 == "lineTo")
			res = this.intersectLineLine(p1[0],p1[1],p2[0],p2[1]);
		else  if(path2[j].type == "bezierCurveTo")
			res = this.intersectLineCurve(p1[0],p1[1],p2[0],p2[1],p2[2],p2[3]);
	}							
	return res;
};
/**gets the points of intersection for two lines**/
pathUnion.prototype.intersectLineLine = function(a1, a2, b1, b2, infinite) {
	var ca = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    var cb = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    var d = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
	if ( d != 0 ) {
		var ua = ca / d;
		var ub = cb / d;
        if(infinite){
			var p = new Point(a1.x + ua * (a2.x - a1.x),a1.y + ua * (a2.y - a1.y));
			if(p.x>a1.x&&p.y>a1.y)
				return p;
		}
		else if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1 ) {
        	return new Point(a1.x + ua * (a2.x - a1.x),a1.y + ua * (a2.y - a1.y));
        }
	} 
	return null;
};
pathUnion.prototype.intersectLinePolygon = function(a1, a2, Points,infinite) {
	var pp = [];
	for ( var i = 0; i < Points.length; i++ ) {
       	var res = this.intersectLineLine(a1, a2, Points[i], Points[(i+1) % Points.length],infinite);
    	if(res)
			pp.push(res);
    }
	return (pp.length?pp:null);
};
pathUnion.prototype.intersectPolygonPolygon = function(Points1, Points2) {
    var pp = [];
    for ( var i = 0; i < Points1.length; i++ ) {
    	var res = this.intersectLinePolygon(Points1[i], Points1[(i+1) % Points1.length], Points2);
	   	if(res)
			pp.push(res);
    }
	return (pp.length?pp:null);
};
pathUnion.prototype.getRoots=function(a0,a1,a2,a3){
	var results=new Array();
	var c3=a0;
	var c2=a1/c3;
	var c1=a2/c3;
	var c0=a3/c3;
	var a = (3*c1-c2*c2)/3;
	var b = (2*c2*c2*c2-9*c1*c2+27*c0)/27;
	var offset = c2/3;
	var discrim = b*b/4 + a*a*a/27;
	var halfB = b/2;
	var t = 1e-6;
	var tmp;
	if(Math.abs(discrim) <= t)
		disrim=0;
	if(discrim>0){
		var e=Math.sqrt(discrim);
		var root;
		tmp=-halfB+e;
		if(tmp>=0)root=Math.pow(tmp,1/3);
		else root=-Math.pow(-tmp,1/3);
		tmp=-halfB-e;
		if(tmp>=0)root+=Math.pow(tmp,1/3);
		else root-=Math.pow(-tmp,1/3);
		results.push(root-offset);
	}
	else if(discrim<0){
		var distance=Math.sqrt(-a/3);
		var angle=Math.atan2(Math.sqrt(-discrim),-halfB)/3;
		var cos=Math.cos(angle);
		var sin=Math.sin(angle);var sqrt3=Math.sqrt(3);
		results.push(2*distance*cos-offset);
		results.push(-distance*(cos+sqrt3*sin)-offset);
		results.push(-distance*(cos-sqrt3*sin)-offset);
	}
	else{
		if(halfB>=0)tmp=-Math.pow(halfB,1/3);else tmp=Math.pow(-halfB,1/3);results.push(2*tmp-offset);results.push(-tmp-offset);
	}
	return results;
};
/*gets points of intersection line with bezier curve (the approach was taken from http://www.kevlindev.com/)*/
pathUnion.prototype.intersectLineCurve = function(a1, a2, p1, p2, p3, p4) {
    var a, b, c, d;      
    var c3, c2, c1, c0;  
	var cl;               
    var n;                
    var min = a1.min(a2); 
    var max = a1.max(a2); 
	
    var result = [];
    a = p1.multiply(-1);
    b = p2.multiply(3);
    c = p3.multiply(-3);
    d = a.add(b.add(c.add(p4)));
    c3 = new Point(d.x, d.y);

    a = p1.multiply(3);
    b = p2.multiply(-6);
    c = p3.multiply(3);
    d = a.add(b.add(c));
    c2 = new Point(d.x, d.y);

    a = p1.multiply(-3);
    b = p2.multiply(3);
    c = a.add(b);
    c1 = new Point(c.x, c.y);

    c0 = new Point(p1.x, p1.y);
	
    n = new Point(a1.y - a2.y, a2.x - a1.x);
    
    cl = a1.x*a2.y - a2.x*a1.y;
    
	roots = this.getRoots(
        n.dot(c3),
        n.dot(c2),
        n.dot(c1),
        n.dot(c0) + cl
    );

    for ( var i = 0; i < roots.length; i++ ) {
        var t = roots[i]; 
		
        if ( 0 <= t && t <= 1 ) {
            var p5 = p1.lerp(p2, t);
            var p6 = p2.lerp(p3, t);
            var p7 = p3.lerp(p4, t);
            var p8 = p5.lerp(p6, t);
            var p9 = p6.lerp(p7, t);
			
            var p10 = p8.lerp(p9, t);

            if ( a1.x == a2.x ) {
                if ( min.y <= p10.y && p10.y <= max.y ) {
                    result.push( [p10,t]);
                }
            } else if ( a1.y == a2.y ) {
                if ( min.x <= p10.x && p10.x <= max.x ) {
                    result.push([p10,t]);
                }
            } else if ( p10.isGE(min) && p10.isLE(max) ) {
               result.push([p10,t]);
            }
        }
    }

    return result;
};
/*gets points of intersection bezier curve with bezier curve (the approach was taken from http://www.kevlindev.com/)*/
pathUnion.prototype.intersectCurveCurve=function(a1,a2,a3,a4,b1,b2,b3,b4){
    var a, b, c, d;         
    var c13, c12, c11, c10; 
    var c23, c22, c21, c20; 
    var result = [];

    a = a1.multiply(-1);
    b = a2.multiply(3);
    c = a3.multiply(-3);
    d = a.add(b.add(c.add(a4)));
    c13 = new Point(d.x, d.y);

    a = a1.multiply(3);
    b = a2.multiply(-6);
    c = a3.multiply(3);
    d = a.add(b.add(c));
    c12 = new Point(d.x, d.y);

    a = a1.multiply(-3);
    b = a2.multiply(3);
    c = a.add(b);
    c11 = new Point(c.x, c.y);

    c10 = new Point(a1.x, a1.y);

    a = b1.multiply(-1);
    b = b2.multiply(3);
    c = b3.multiply(-3);
    d = a.add(b.add(c.add(b4)));
    c23 = new Point(d.x, d.y);

    a = b1.multiply(3);
    b = b2.multiply(-6);
    c = b3.multiply(3);
    d = a.add(b.add(c));
    c22 = new Point(d.x, d.y);

    a = b1.multiply(-3);
    b = b2.multiply(3);
    c = a.add(b);
    c21 = new Point(c.x, c.y);

    c20 = new Point(b1.x, b1.y);

    var c10x2 = c10.x*c10.x;
    var c10x3 = c10.x*c10.x*c10.x;
    var c10y2 = c10.y*c10.y;
    var c10y3 = c10.y*c10.y*c10.y;
    var c11x2 = c11.x*c11.x;
    var c11x3 = c11.x*c11.x*c11.x;
    var c11y2 = c11.y*c11.y;
    var c11y3 = c11.y*c11.y*c11.y;
    var c12x2 = c12.x*c12.x;
    var c12x3 = c12.x*c12.x*c12.x;
    var c12y2 = c12.y*c12.y;
    var c12y3 = c12.y*c12.y*c12.y;
    var c13x2 = c13.x*c13.x;
    var c13x3 = c13.x*c13.x*c13.x;
    var c13y2 = c13.y*c13.y;
    var c13y3 = c13.y*c13.y*c13.y;
    var c20x2 = c20.x*c20.x;
    var c20x3 = c20.x*c20.x*c20.x;
    var c20y2 = c20.y*c20.y;
    var c20y3 = c20.y*c20.y*c20.y;
    var c21x2 = c21.x*c21.x;
    var c21x3 = c21.x*c21.x*c21.x;
    var c21y2 = c21.y*c21.y;
    var c22x2 = c22.x*c22.x;
    var c22x3 = c22.x*c22.x*c22.x;
    var c22y2 = c22.y*c22.y;
    var c23x2 = c23.x*c23.x;
    var c23x3 = c23.x*c23.x*c23.x;
    var c23y2 = c23.y*c23.y;
    var c23y3 = c23.y*c23.y*c23.y;
    var poly = new Polynomial(
        -c13x3*c23y3 + c13y3*c23x3 - 3*c13.x*c13y2*c23x2*c23.y +
            3*c13x2*c13.y*c23.x*c23y2,
        -6*c13.x*c22.x*c13y2*c23.x*c23.y + 6*c13x2*c13.y*c22.y*c23.x*c23.y + 3*c22.x*c13y3*c23x2 -
            3*c13x3*c22.y*c23y2 - 3*c13.x*c13y2*c22.y*c23x2 + 3*c13x2*c22.x*c13.y*c23y2,
        -6*c21.x*c13.x*c13y2*c23.x*c23.y - 6*c13.x*c22.x*c13y2*c22.y*c23.x + 6*c13x2*c22.x*c13.y*c22.y*c23.y +
            3*c21.x*c13y3*c23x2 + 3*c22x2*c13y3*c23.x + 3*c21.x*c13x2*c13.y*c23y2 - 3*c13.x*c21.y*c13y2*c23x2 -
            3*c13.x*c22x2*c13y2*c23.y + c13x2*c13.y*c23.x*(6*c21.y*c23.y + 3*c22y2) + c13x3*(-c21.y*c23y2 -
            2*c22y2*c23.y - c23.y*(2*c21.y*c23.y + c22y2)),
        c11.x*c12.y*c13.x*c13.y*c23.x*c23.y - c11.y*c12.x*c13.x*c13.y*c23.x*c23.y + 6*c21.x*c22.x*c13y3*c23.x +
            3*c11.x*c12.x*c13.x*c13.y*c23y2 + 6*c10.x*c13.x*c13y2*c23.x*c23.y - 3*c11.x*c12.x*c13y2*c23.x*c23.y -
            3*c11.y*c12.y*c13.x*c13.y*c23x2 - 6*c10.y*c13x2*c13.y*c23.x*c23.y - 6*c20.x*c13.x*c13y2*c23.x*c23.y +
            3*c11.y*c12.y*c13x2*c23.x*c23.y - 2*c12.x*c12y2*c13.x*c23.x*c23.y - 6*c21.x*c13.x*c22.x*c13y2*c23.y -
            6*c21.x*c13.x*c13y2*c22.y*c23.x - 6*c13.x*c21.y*c22.x*c13y2*c23.x + 6*c21.x*c13x2*c13.y*c22.y*c23.y +
            2*c12x2*c12.y*c13.y*c23.x*c23.y + c22x3*c13y3 - 3*c10.x*c13y3*c23x2 + 3*c10.y*c13x3*c23y2 +
            3*c20.x*c13y3*c23x2 + c12y3*c13.x*c23x2 - c12x3*c13.y*c23y2 - 3*c10.x*c13x2*c13.y*c23y2 +
            3*c10.y*c13.x*c13y2*c23x2 - 2*c11.x*c12.y*c13x2*c23y2 + c11.x*c12.y*c13y2*c23x2 - c11.y*c12.x*c13x2*c23y2 +
            2*c11.y*c12.x*c13y2*c23x2 + 3*c20.x*c13x2*c13.y*c23y2 - c12.x*c12y2*c13.y*c23x2 -
            3*c20.y*c13.x*c13y2*c23x2 + c12x2*c12.y*c13.x*c23y2 - 3*c13.x*c22x2*c13y2*c22.y +
            c13x2*c13.y*c23.x*(6*c20.y*c23.y + 6*c21.y*c22.y) + c13x2*c22.x*c13.y*(6*c21.y*c23.y + 3*c22y2) +
            c13x3*(-2*c21.y*c22.y*c23.y - c20.y*c23y2 - c22.y*(2*c21.y*c23.y + c22y2) - c23.y*(2*c20.y*c23.y + 2*c21.y*c22.y)),
        6*c11.x*c12.x*c13.x*c13.y*c22.y*c23.y + c11.x*c12.y*c13.x*c22.x*c13.y*c23.y + c11.x*c12.y*c13.x*c13.y*c22.y*c23.x -
            c11.y*c12.x*c13.x*c22.x*c13.y*c23.y - c11.y*c12.x*c13.x*c13.y*c22.y*c23.x - 6*c11.y*c12.y*c13.x*c22.x*c13.y*c23.x -
            6*c10.x*c22.x*c13y3*c23.x + 6*c20.x*c22.x*c13y3*c23.x + 6*c10.y*c13x3*c22.y*c23.y + 2*c12y3*c13.x*c22.x*c23.x -
            2*c12x3*c13.y*c22.y*c23.y + 6*c10.x*c13.x*c22.x*c13y2*c23.y + 6*c10.x*c13.x*c13y2*c22.y*c23.x +
            6*c10.y*c13.x*c22.x*c13y2*c23.x - 3*c11.x*c12.x*c22.x*c13y2*c23.y - 3*c11.x*c12.x*c13y2*c22.y*c23.x +
            2*c11.x*c12.y*c22.x*c13y2*c23.x + 4*c11.y*c12.x*c22.x*c13y2*c23.x - 6*c10.x*c13x2*c13.y*c22.y*c23.y -
            6*c10.y*c13x2*c22.x*c13.y*c23.y - 6*c10.y*c13x2*c13.y*c22.y*c23.x - 4*c11.x*c12.y*c13x2*c22.y*c23.y -
            6*c20.x*c13.x*c22.x*c13y2*c23.y - 6*c20.x*c13.x*c13y2*c22.y*c23.x - 2*c11.y*c12.x*c13x2*c22.y*c23.y +
            3*c11.y*c12.y*c13x2*c22.x*c23.y + 3*c11.y*c12.y*c13x2*c22.y*c23.x - 2*c12.x*c12y2*c13.x*c22.x*c23.y -
            2*c12.x*c12y2*c13.x*c22.y*c23.x - 2*c12.x*c12y2*c22.x*c13.y*c23.x - 6*c20.y*c13.x*c22.x*c13y2*c23.x -
            6*c21.x*c13.x*c21.y*c13y2*c23.x - 6*c21.x*c13.x*c22.x*c13y2*c22.y + 6*c20.x*c13x2*c13.y*c22.y*c23.y +
            2*c12x2*c12.y*c13.x*c22.y*c23.y + 2*c12x2*c12.y*c22.x*c13.y*c23.y + 2*c12x2*c12.y*c13.y*c22.y*c23.x +
            3*c21.x*c22x2*c13y3 + 3*c21x2*c13y3*c23.x - 3*c13.x*c21.y*c22x2*c13y2 - 3*c21x2*c13.x*c13y2*c23.y +
            c13x2*c22.x*c13.y*(6*c20.y*c23.y + 6*c21.y*c22.y) + c13x2*c13.y*c23.x*(6*c20.y*c22.y + 3*c21y2) +
            c21.x*c13x2*c13.y*(6*c21.y*c23.y + 3*c22y2) + c13x3*(-2*c20.y*c22.y*c23.y - c23.y*(2*c20.y*c22.y + c21y2) -
            c21.y*(2*c21.y*c23.y + c22y2) - c22.y*(2*c20.y*c23.y + 2*c21.y*c22.y)),
        c11.x*c21.x*c12.y*c13.x*c13.y*c23.y + c11.x*c12.y*c13.x*c21.y*c13.y*c23.x + c11.x*c12.y*c13.x*c22.x*c13.y*c22.y -
            c11.y*c12.x*c21.x*c13.x*c13.y*c23.y - c11.y*c12.x*c13.x*c21.y*c13.y*c23.x - c11.y*c12.x*c13.x*c22.x*c13.y*c22.y -
            6*c11.y*c21.x*c12.y*c13.x*c13.y*c23.x - 6*c10.x*c21.x*c13y3*c23.x + 6*c20.x*c21.x*c13y3*c23.x +
            2*c21.x*c12y3*c13.x*c23.x + 6*c10.x*c21.x*c13.x*c13y2*c23.y + 6*c10.x*c13.x*c21.y*c13y2*c23.x +
            6*c10.x*c13.x*c22.x*c13y2*c22.y + 6*c10.y*c21.x*c13.x*c13y2*c23.x - 3*c11.x*c12.x*c21.x*c13y2*c23.y -
            3*c11.x*c12.x*c21.y*c13y2*c23.x - 3*c11.x*c12.x*c22.x*c13y2*c22.y + 2*c11.x*c21.x*c12.y*c13y2*c23.x +
            4*c11.y*c12.x*c21.x*c13y2*c23.x - 6*c10.y*c21.x*c13x2*c13.y*c23.y - 6*c10.y*c13x2*c21.y*c13.y*c23.x -
            6*c10.y*c13x2*c22.x*c13.y*c22.y - 6*c20.x*c21.x*c13.x*c13y2*c23.y - 6*c20.x*c13.x*c21.y*c13y2*c23.x -
            6*c20.x*c13.x*c22.x*c13y2*c22.y + 3*c11.y*c21.x*c12.y*c13x2*c23.y - 3*c11.y*c12.y*c13.x*c22x2*c13.y +
            3*c11.y*c12.y*c13x2*c21.y*c23.x + 3*c11.y*c12.y*c13x2*c22.x*c22.y - 2*c12.x*c21.x*c12y2*c13.x*c23.y -
            2*c12.x*c21.x*c12y2*c13.y*c23.x - 2*c12.x*c12y2*c13.x*c21.y*c23.x - 2*c12.x*c12y2*c13.x*c22.x*c22.y -
            6*c20.y*c21.x*c13.x*c13y2*c23.x - 6*c21.x*c13.x*c21.y*c22.x*c13y2 + 6*c20.y*c13x2*c21.y*c13.y*c23.x +
            2*c12x2*c21.x*c12.y*c13.y*c23.y + 2*c12x2*c12.y*c21.y*c13.y*c23.x + 2*c12x2*c12.y*c22.x*c13.y*c22.y -
            3*c10.x*c22x2*c13y3 + 3*c20.x*c22x2*c13y3 + 3*c21x2*c22.x*c13y3 + c12y3*c13.x*c22x2 +
            3*c10.y*c13.x*c22x2*c13y2 + c11.x*c12.y*c22x2*c13y2 + 2*c11.y*c12.x*c22x2*c13y2 -
            c12.x*c12y2*c22x2*c13.y - 3*c20.y*c13.x*c22x2*c13y2 - 3*c21x2*c13.x*c13y2*c22.y +
            c12x2*c12.y*c13.x*(2*c21.y*c23.y + c22y2) + c11.x*c12.x*c13.x*c13.y*(6*c21.y*c23.y + 3*c22y2) +
            c21.x*c13x2*c13.y*(6*c20.y*c23.y + 6*c21.y*c22.y) + c12x3*c13.y*(-2*c21.y*c23.y - c22y2) +
            c10.y*c13x3*(6*c21.y*c23.y + 3*c22y2) + c11.y*c12.x*c13x2*(-2*c21.y*c23.y - c22y2) +
            c11.x*c12.y*c13x2*(-4*c21.y*c23.y - 2*c22y2) + c10.x*c13x2*c13.y*(-6*c21.y*c23.y - 3*c22y2) +
            c13x2*c22.x*c13.y*(6*c20.y*c22.y + 3*c21y2) + c20.x*c13x2*c13.y*(6*c21.y*c23.y + 3*c22y2) +
            c13x3*(-2*c20.y*c21.y*c23.y - c22.y*(2*c20.y*c22.y + c21y2) - c20.y*(2*c21.y*c23.y + c22y2) -
            c21.y*(2*c20.y*c23.y + 2*c21.y*c22.y)),
        -c10.x*c11.x*c12.y*c13.x*c13.y*c23.y + c10.x*c11.y*c12.x*c13.x*c13.y*c23.y + 6*c10.x*c11.y*c12.y*c13.x*c13.y*c23.x -
            6*c10.y*c11.x*c12.x*c13.x*c13.y*c23.y - c10.y*c11.x*c12.y*c13.x*c13.y*c23.x + c10.y*c11.y*c12.x*c13.x*c13.y*c23.x +
            c11.x*c11.y*c12.x*c12.y*c13.x*c23.y - c11.x*c11.y*c12.x*c12.y*c13.y*c23.x + c11.x*c20.x*c12.y*c13.x*c13.y*c23.y +
            c11.x*c20.y*c12.y*c13.x*c13.y*c23.x + c11.x*c21.x*c12.y*c13.x*c13.y*c22.y + c11.x*c12.y*c13.x*c21.y*c22.x*c13.y -
            c20.x*c11.y*c12.x*c13.x*c13.y*c23.y - 6*c20.x*c11.y*c12.y*c13.x*c13.y*c23.x - c11.y*c12.x*c20.y*c13.x*c13.y*c23.x -
            c11.y*c12.x*c21.x*c13.x*c13.y*c22.y - c11.y*c12.x*c13.x*c21.y*c22.x*c13.y - 6*c11.y*c21.x*c12.y*c13.x*c22.x*c13.y -
            6*c10.x*c20.x*c13y3*c23.x - 6*c10.x*c21.x*c22.x*c13y3 - 2*c10.x*c12y3*c13.x*c23.x + 6*c20.x*c21.x*c22.x*c13y3 +
            2*c20.x*c12y3*c13.x*c23.x + 2*c21.x*c12y3*c13.x*c22.x + 2*c10.y*c12x3*c13.y*c23.y - 6*c10.x*c10.y*c13.x*c13y2*c23.x +
            3*c10.x*c11.x*c12.x*c13y2*c23.y - 2*c10.x*c11.x*c12.y*c13y2*c23.x - 4*c10.x*c11.y*c12.x*c13y2*c23.x +
            3*c10.y*c11.x*c12.x*c13y2*c23.x + 6*c10.x*c10.y*c13x2*c13.y*c23.y + 6*c10.x*c20.x*c13.x*c13y2*c23.y -
            3*c10.x*c11.y*c12.y*c13x2*c23.y + 2*c10.x*c12.x*c12y2*c13.x*c23.y + 2*c10.x*c12.x*c12y2*c13.y*c23.x +
            6*c10.x*c20.y*c13.x*c13y2*c23.x + 6*c10.x*c21.x*c13.x*c13y2*c22.y + 6*c10.x*c13.x*c21.y*c22.x*c13y2 +
            4*c10.y*c11.x*c12.y*c13x2*c23.y + 6*c10.y*c20.x*c13.x*c13y2*c23.x + 2*c10.y*c11.y*c12.x*c13x2*c23.y -
            3*c10.y*c11.y*c12.y*c13x2*c23.x + 2*c10.y*c12.x*c12y2*c13.x*c23.x + 6*c10.y*c21.x*c13.x*c22.x*c13y2 -
            3*c11.x*c20.x*c12.x*c13y2*c23.y + 2*c11.x*c20.x*c12.y*c13y2*c23.x + c11.x*c11.y*c12y2*c13.x*c23.x -
            3*c11.x*c12.x*c20.y*c13y2*c23.x - 3*c11.x*c12.x*c21.x*c13y2*c22.y - 3*c11.x*c12.x*c21.y*c22.x*c13y2 +
            2*c11.x*c21.x*c12.y*c22.x*c13y2 + 4*c20.x*c11.y*c12.x*c13y2*c23.x + 4*c11.y*c12.x*c21.x*c22.x*c13y2 -
            2*c10.x*c12x2*c12.y*c13.y*c23.y - 6*c10.y*c20.x*c13x2*c13.y*c23.y - 6*c10.y*c20.y*c13x2*c13.y*c23.x -
            6*c10.y*c21.x*c13x2*c13.y*c22.y - 2*c10.y*c12x2*c12.y*c13.x*c23.y - 2*c10.y*c12x2*c12.y*c13.y*c23.x -
            6*c10.y*c13x2*c21.y*c22.x*c13.y - c11.x*c11.y*c12x2*c13.y*c23.y - 2*c11.x*c11y2*c13.x*c13.y*c23.x +
            3*c20.x*c11.y*c12.y*c13x2*c23.y - 2*c20.x*c12.x*c12y2*c13.x*c23.y - 2*c20.x*c12.x*c12y2*c13.y*c23.x -
            6*c20.x*c20.y*c13.x*c13y2*c23.x - 6*c20.x*c21.x*c13.x*c13y2*c22.y - 6*c20.x*c13.x*c21.y*c22.x*c13y2 +
            3*c11.y*c20.y*c12.y*c13x2*c23.x + 3*c11.y*c21.x*c12.y*c13x2*c22.y + 3*c11.y*c12.y*c13x2*c21.y*c22.x -
            2*c12.x*c20.y*c12y2*c13.x*c23.x - 2*c12.x*c21.x*c12y2*c13.x*c22.y - 2*c12.x*c21.x*c12y2*c22.x*c13.y -
            2*c12.x*c12y2*c13.x*c21.y*c22.x - 6*c20.y*c21.x*c13.x*c22.x*c13y2 - c11y2*c12.x*c12.y*c13.x*c23.x +
            2*c20.x*c12x2*c12.y*c13.y*c23.y + 6*c20.y*c13x2*c21.y*c22.x*c13.y + 2*c11x2*c11.y*c13.x*c13.y*c23.y +
            c11x2*c12.x*c12.y*c13.y*c23.y + 2*c12x2*c20.y*c12.y*c13.y*c23.x + 2*c12x2*c21.x*c12.y*c13.y*c22.y +
            2*c12x2*c12.y*c21.y*c22.x*c13.y + c21x3*c13y3 + 3*c10x2*c13y3*c23.x - 3*c10y2*c13x3*c23.y +
            3*c20x2*c13y3*c23.x + c11y3*c13x2*c23.x - c11x3*c13y2*c23.y - c11.x*c11y2*c13x2*c23.y +
            c11x2*c11.y*c13y2*c23.x - 3*c10x2*c13.x*c13y2*c23.y + 3*c10y2*c13x2*c13.y*c23.x - c11x2*c12y2*c13.x*c23.y +
            c11y2*c12x2*c13.y*c23.x - 3*c21x2*c13.x*c21.y*c13y2 - 3*c20x2*c13.x*c13y2*c23.y + 3*c20y2*c13x2*c13.y*c23.x +
            c11.x*c12.x*c13.x*c13.y*(6*c20.y*c23.y + 6*c21.y*c22.y) + c12x3*c13.y*(-2*c20.y*c23.y - 2*c21.y*c22.y) +
            c10.y*c13x3*(6*c20.y*c23.y + 6*c21.y*c22.y) + c11.y*c12.x*c13x2*(-2*c20.y*c23.y - 2*c21.y*c22.y) +
            c12x2*c12.y*c13.x*(2*c20.y*c23.y + 2*c21.y*c22.y) + c11.x*c12.y*c13x2*(-4*c20.y*c23.y - 4*c21.y*c22.y) +
            c10.x*c13x2*c13.y*(-6*c20.y*c23.y - 6*c21.y*c22.y) + c20.x*c13x2*c13.y*(6*c20.y*c23.y + 6*c21.y*c22.y) +
            c21.x*c13x2*c13.y*(6*c20.y*c22.y + 3*c21y2) + c13x3*(-2*c20.y*c21.y*c22.y - c20y2*c23.y -
            c21.y*(2*c20.y*c22.y + c21y2) - c20.y*(2*c20.y*c23.y + 2*c21.y*c22.y)),
        -c10.x*c11.x*c12.y*c13.x*c13.y*c22.y + c10.x*c11.y*c12.x*c13.x*c13.y*c22.y + 6*c10.x*c11.y*c12.y*c13.x*c22.x*c13.y -
            6*c10.y*c11.x*c12.x*c13.x*c13.y*c22.y - c10.y*c11.x*c12.y*c13.x*c22.x*c13.y + c10.y*c11.y*c12.x*c13.x*c22.x*c13.y +
            c11.x*c11.y*c12.x*c12.y*c13.x*c22.y - c11.x*c11.y*c12.x*c12.y*c22.x*c13.y + c11.x*c20.x*c12.y*c13.x*c13.y*c22.y +
            c11.x*c20.y*c12.y*c13.x*c22.x*c13.y + c11.x*c21.x*c12.y*c13.x*c21.y*c13.y - c20.x*c11.y*c12.x*c13.x*c13.y*c22.y -
            6*c20.x*c11.y*c12.y*c13.x*c22.x*c13.y - c11.y*c12.x*c20.y*c13.x*c22.x*c13.y - c11.y*c12.x*c21.x*c13.x*c21.y*c13.y -
            6*c10.x*c20.x*c22.x*c13y3 - 2*c10.x*c12y3*c13.x*c22.x + 2*c20.x*c12y3*c13.x*c22.x + 2*c10.y*c12x3*c13.y*c22.y -
            6*c10.x*c10.y*c13.x*c22.x*c13y2 + 3*c10.x*c11.x*c12.x*c13y2*c22.y - 2*c10.x*c11.x*c12.y*c22.x*c13y2 -
            4*c10.x*c11.y*c12.x*c22.x*c13y2 + 3*c10.y*c11.x*c12.x*c22.x*c13y2 + 6*c10.x*c10.y*c13x2*c13.y*c22.y +
            6*c10.x*c20.x*c13.x*c13y2*c22.y - 3*c10.x*c11.y*c12.y*c13x2*c22.y + 2*c10.x*c12.x*c12y2*c13.x*c22.y +
            2*c10.x*c12.x*c12y2*c22.x*c13.y + 6*c10.x*c20.y*c13.x*c22.x*c13y2 + 6*c10.x*c21.x*c13.x*c21.y*c13y2 +
            4*c10.y*c11.x*c12.y*c13x2*c22.y + 6*c10.y*c20.x*c13.x*c22.x*c13y2 + 2*c10.y*c11.y*c12.x*c13x2*c22.y -
            3*c10.y*c11.y*c12.y*c13x2*c22.x + 2*c10.y*c12.x*c12y2*c13.x*c22.x - 3*c11.x*c20.x*c12.x*c13y2*c22.y +
            2*c11.x*c20.x*c12.y*c22.x*c13y2 + c11.x*c11.y*c12y2*c13.x*c22.x - 3*c11.x*c12.x*c20.y*c22.x*c13y2 -
            3*c11.x*c12.x*c21.x*c21.y*c13y2 + 4*c20.x*c11.y*c12.x*c22.x*c13y2 - 2*c10.x*c12x2*c12.y*c13.y*c22.y -
            6*c10.y*c20.x*c13x2*c13.y*c22.y - 6*c10.y*c20.y*c13x2*c22.x*c13.y - 6*c10.y*c21.x*c13x2*c21.y*c13.y -
            2*c10.y*c12x2*c12.y*c13.x*c22.y - 2*c10.y*c12x2*c12.y*c22.x*c13.y - c11.x*c11.y*c12x2*c13.y*c22.y -
            2*c11.x*c11y2*c13.x*c22.x*c13.y + 3*c20.x*c11.y*c12.y*c13x2*c22.y - 2*c20.x*c12.x*c12y2*c13.x*c22.y -
            2*c20.x*c12.x*c12y2*c22.x*c13.y - 6*c20.x*c20.y*c13.x*c22.x*c13y2 - 6*c20.x*c21.x*c13.x*c21.y*c13y2 +
            3*c11.y*c20.y*c12.y*c13x2*c22.x + 3*c11.y*c21.x*c12.y*c13x2*c21.y - 2*c12.x*c20.y*c12y2*c13.x*c22.x -
            2*c12.x*c21.x*c12y2*c13.x*c21.y - c11y2*c12.x*c12.y*c13.x*c22.x + 2*c20.x*c12x2*c12.y*c13.y*c22.y -
            3*c11.y*c21x2*c12.y*c13.x*c13.y + 6*c20.y*c21.x*c13x2*c21.y*c13.y + 2*c11x2*c11.y*c13.x*c13.y*c22.y +
            c11x2*c12.x*c12.y*c13.y*c22.y + 2*c12x2*c20.y*c12.y*c22.x*c13.y + 2*c12x2*c21.x*c12.y*c21.y*c13.y -
            3*c10.x*c21x2*c13y3 + 3*c20.x*c21x2*c13y3 + 3*c10x2*c22.x*c13y3 - 3*c10y2*c13x3*c22.y + 3*c20x2*c22.x*c13y3 +
            c21x2*c12y3*c13.x + c11y3*c13x2*c22.x - c11x3*c13y2*c22.y + 3*c10.y*c21x2*c13.x*c13y2 -
            c11.x*c11y2*c13x2*c22.y + c11.x*c21x2*c12.y*c13y2 + 2*c11.y*c12.x*c21x2*c13y2 + c11x2*c11.y*c22.x*c13y2 -
            c12.x*c21x2*c12y2*c13.y - 3*c20.y*c21x2*c13.x*c13y2 - 3*c10x2*c13.x*c13y2*c22.y + 3*c10y2*c13x2*c22.x*c13.y -
            c11x2*c12y2*c13.x*c22.y + c11y2*c12x2*c22.x*c13.y - 3*c20x2*c13.x*c13y2*c22.y + 3*c20y2*c13x2*c22.x*c13.y +
            c12x2*c12.y*c13.x*(2*c20.y*c22.y + c21y2) + c11.x*c12.x*c13.x*c13.y*(6*c20.y*c22.y + 3*c21y2) +
            c12x3*c13.y*(-2*c20.y*c22.y - c21y2) + c10.y*c13x3*(6*c20.y*c22.y + 3*c21y2) +
            c11.y*c12.x*c13x2*(-2*c20.y*c22.y - c21y2) + c11.x*c12.y*c13x2*(-4*c20.y*c22.y - 2*c21y2) +
            c10.x*c13x2*c13.y*(-6*c20.y*c22.y - 3*c21y2) + c20.x*c13x2*c13.y*(6*c20.y*c22.y + 3*c21y2) +
            c13x3*(-2*c20.y*c21y2 - c20y2*c22.y - c20.y*(2*c20.y*c22.y + c21y2)),
        -c10.x*c11.x*c12.y*c13.x*c21.y*c13.y + c10.x*c11.y*c12.x*c13.x*c21.y*c13.y + 6*c10.x*c11.y*c21.x*c12.y*c13.x*c13.y -
            6*c10.y*c11.x*c12.x*c13.x*c21.y*c13.y - c10.y*c11.x*c21.x*c12.y*c13.x*c13.y + c10.y*c11.y*c12.x*c21.x*c13.x*c13.y -
            c11.x*c11.y*c12.x*c21.x*c12.y*c13.y + c11.x*c11.y*c12.x*c12.y*c13.x*c21.y + c11.x*c20.x*c12.y*c13.x*c21.y*c13.y +
            6*c11.x*c12.x*c20.y*c13.x*c21.y*c13.y + c11.x*c20.y*c21.x*c12.y*c13.x*c13.y - c20.x*c11.y*c12.x*c13.x*c21.y*c13.y -
            6*c20.x*c11.y*c21.x*c12.y*c13.x*c13.y - c11.y*c12.x*c20.y*c21.x*c13.x*c13.y - 6*c10.x*c20.x*c21.x*c13y3 -
            2*c10.x*c21.x*c12y3*c13.x + 6*c10.y*c20.y*c13x3*c21.y + 2*c20.x*c21.x*c12y3*c13.x + 2*c10.y*c12x3*c21.y*c13.y -
            2*c12x3*c20.y*c21.y*c13.y - 6*c10.x*c10.y*c21.x*c13.x*c13y2 + 3*c10.x*c11.x*c12.x*c21.y*c13y2 -
            2*c10.x*c11.x*c21.x*c12.y*c13y2 - 4*c10.x*c11.y*c12.x*c21.x*c13y2 + 3*c10.y*c11.x*c12.x*c21.x*c13y2 +
            6*c10.x*c10.y*c13x2*c21.y*c13.y + 6*c10.x*c20.x*c13.x*c21.y*c13y2 - 3*c10.x*c11.y*c12.y*c13x2*c21.y +
            2*c10.x*c12.x*c21.x*c12y2*c13.y + 2*c10.x*c12.x*c12y2*c13.x*c21.y + 6*c10.x*c20.y*c21.x*c13.x*c13y2 +
            4*c10.y*c11.x*c12.y*c13x2*c21.y + 6*c10.y*c20.x*c21.x*c13.x*c13y2 + 2*c10.y*c11.y*c12.x*c13x2*c21.y -
            3*c10.y*c11.y*c21.x*c12.y*c13x2 + 2*c10.y*c12.x*c21.x*c12y2*c13.x - 3*c11.x*c20.x*c12.x*c21.y*c13y2 +
            2*c11.x*c20.x*c21.x*c12.y*c13y2 + c11.x*c11.y*c21.x*c12y2*c13.x - 3*c11.x*c12.x*c20.y*c21.x*c13y2 +
            4*c20.x*c11.y*c12.x*c21.x*c13y2 - 6*c10.x*c20.y*c13x2*c21.y*c13.y - 2*c10.x*c12x2*c12.y*c21.y*c13.y -
            6*c10.y*c20.x*c13x2*c21.y*c13.y - 6*c10.y*c20.y*c21.x*c13x2*c13.y - 2*c10.y*c12x2*c21.x*c12.y*c13.y -
            2*c10.y*c12x2*c12.y*c13.x*c21.y - c11.x*c11.y*c12x2*c21.y*c13.y - 4*c11.x*c20.y*c12.y*c13x2*c21.y -
            2*c11.x*c11y2*c21.x*c13.x*c13.y + 3*c20.x*c11.y*c12.y*c13x2*c21.y - 2*c20.x*c12.x*c21.x*c12y2*c13.y -
            2*c20.x*c12.x*c12y2*c13.x*c21.y - 6*c20.x*c20.y*c21.x*c13.x*c13y2 - 2*c11.y*c12.x*c20.y*c13x2*c21.y +
            3*c11.y*c20.y*c21.x*c12.y*c13x2 - 2*c12.x*c20.y*c21.x*c12y2*c13.x - c11y2*c12.x*c21.x*c12.y*c13.x +
            6*c20.x*c20.y*c13x2*c21.y*c13.y + 2*c20.x*c12x2*c12.y*c21.y*c13.y + 2*c11x2*c11.y*c13.x*c21.y*c13.y +
            c11x2*c12.x*c12.y*c21.y*c13.y + 2*c12x2*c20.y*c21.x*c12.y*c13.y + 2*c12x2*c20.y*c12.y*c13.x*c21.y +
            3*c10x2*c21.x*c13y3 - 3*c10y2*c13x3*c21.y + 3*c20x2*c21.x*c13y3 + c11y3*c21.x*c13x2 - c11x3*c21.y*c13y2 -
            3*c20y2*c13x3*c21.y - c11.x*c11y2*c13x2*c21.y + c11x2*c11.y*c21.x*c13y2 - 3*c10x2*c13.x*c21.y*c13y2 +
            3*c10y2*c21.x*c13x2*c13.y - c11x2*c12y2*c13.x*c21.y + c11y2*c12x2*c21.x*c13.y - 3*c20x2*c13.x*c21.y*c13y2 +
            3*c20y2*c21.x*c13x2*c13.y,
        c10.x*c10.y*c11.x*c12.y*c13.x*c13.y - c10.x*c10.y*c11.y*c12.x*c13.x*c13.y + c10.x*c11.x*c11.y*c12.x*c12.y*c13.y -
            c10.y*c11.x*c11.y*c12.x*c12.y*c13.x - c10.x*c11.x*c20.y*c12.y*c13.x*c13.y + 6*c10.x*c20.x*c11.y*c12.y*c13.x*c13.y +
            c10.x*c11.y*c12.x*c20.y*c13.x*c13.y - c10.y*c11.x*c20.x*c12.y*c13.x*c13.y - 6*c10.y*c11.x*c12.x*c20.y*c13.x*c13.y +
            c10.y*c20.x*c11.y*c12.x*c13.x*c13.y - c11.x*c20.x*c11.y*c12.x*c12.y*c13.y + c11.x*c11.y*c12.x*c20.y*c12.y*c13.x +
            c11.x*c20.x*c20.y*c12.y*c13.x*c13.y - c20.x*c11.y*c12.x*c20.y*c13.x*c13.y - 2*c10.x*c20.x*c12y3*c13.x +
            2*c10.y*c12x3*c20.y*c13.y - 3*c10.x*c10.y*c11.x*c12.x*c13y2 - 6*c10.x*c10.y*c20.x*c13.x*c13y2 +
            3*c10.x*c10.y*c11.y*c12.y*c13x2 - 2*c10.x*c10.y*c12.x*c12y2*c13.x - 2*c10.x*c11.x*c20.x*c12.y*c13y2 -
            c10.x*c11.x*c11.y*c12y2*c13.x + 3*c10.x*c11.x*c12.x*c20.y*c13y2 - 4*c10.x*c20.x*c11.y*c12.x*c13y2 +
            3*c10.y*c11.x*c20.x*c12.x*c13y2 + 6*c10.x*c10.y*c20.y*c13x2*c13.y + 2*c10.x*c10.y*c12x2*c12.y*c13.y +
            2*c10.x*c11.x*c11y2*c13.x*c13.y + 2*c10.x*c20.x*c12.x*c12y2*c13.y + 6*c10.x*c20.x*c20.y*c13.x*c13y2 -
            3*c10.x*c11.y*c20.y*c12.y*c13x2 + 2*c10.x*c12.x*c20.y*c12y2*c13.x + c10.x*c11y2*c12.x*c12.y*c13.x +
            c10.y*c11.x*c11.y*c12x2*c13.y + 4*c10.y*c11.x*c20.y*c12.y*c13x2 - 3*c10.y*c20.x*c11.y*c12.y*c13x2 +
            2*c10.y*c20.x*c12.x*c12y2*c13.x + 2*c10.y*c11.y*c12.x*c20.y*c13x2 + c11.x*c20.x*c11.y*c12y2*c13.x -
            3*c11.x*c20.x*c12.x*c20.y*c13y2 - 2*c10.x*c12x2*c20.y*c12.y*c13.y - 6*c10.y*c20.x*c20.y*c13x2*c13.y -
            2*c10.y*c20.x*c12x2*c12.y*c13.y - 2*c10.y*c11x2*c11.y*c13.x*c13.y - c10.y*c11x2*c12.x*c12.y*c13.y -
            2*c10.y*c12x2*c20.y*c12.y*c13.x - 2*c11.x*c20.x*c11y2*c13.x*c13.y - c11.x*c11.y*c12x2*c20.y*c13.y +
            3*c20.x*c11.y*c20.y*c12.y*c13x2 - 2*c20.x*c12.x*c20.y*c12y2*c13.x - c20.x*c11y2*c12.x*c12.y*c13.x +
            3*c10y2*c11.x*c12.x*c13.x*c13.y + 3*c11.x*c12.x*c20y2*c13.x*c13.y + 2*c20.x*c12x2*c20.y*c12.y*c13.y -
            3*c10x2*c11.y*c12.y*c13.x*c13.y + 2*c11x2*c11.y*c20.y*c13.x*c13.y + c11x2*c12.x*c20.y*c12.y*c13.y -
            3*c20x2*c11.y*c12.y*c13.x*c13.y - c10x3*c13y3 + c10y3*c13x3 + c20x3*c13y3 - c20y3*c13x3 -
            3*c10.x*c20x2*c13y3 - c10.x*c11y3*c13x2 + 3*c10x2*c20.x*c13y3 + c10.y*c11x3*c13y2 +
            3*c10.y*c20y2*c13x3 + c20.x*c11y3*c13x2 + c10x2*c12y3*c13.x - 3*c10y2*c20.y*c13x3 - c10y2*c12x3*c13.y +
            c20x2*c12y3*c13.x - c11x3*c20.y*c13y2 - c12x3*c20y2*c13.y - c10.x*c11x2*c11.y*c13y2 +
            c10.y*c11.x*c11y2*c13x2 - 3*c10.x*c10y2*c13x2*c13.y - c10.x*c11y2*c12x2*c13.y + c10.y*c11x2*c12y2*c13.x -
            c11.x*c11y2*c20.y*c13x2 + 3*c10x2*c10.y*c13.x*c13y2 + c10x2*c11.x*c12.y*c13y2 +
            2*c10x2*c11.y*c12.x*c13y2 - 2*c10y2*c11.x*c12.y*c13x2 - c10y2*c11.y*c12.x*c13x2 + c11x2*c20.x*c11.y*c13y2 -
            3*c10.x*c20y2*c13x2*c13.y + 3*c10.y*c20x2*c13.x*c13y2 + c11.x*c20x2*c12.y*c13y2 - 2*c11.x*c20y2*c12.y*c13x2 +
            c20.x*c11y2*c12x2*c13.y - c11.y*c12.x*c20y2*c13x2 - c10x2*c12.x*c12y2*c13.y - 3*c10x2*c20.y*c13.x*c13y2 +
            3*c10y2*c20.x*c13x2*c13.y + c10y2*c12x2*c12.y*c13.x - c11x2*c20.y*c12y2*c13.x + 2*c20x2*c11.y*c12.x*c13y2 +
            3*c20.x*c20y2*c13x2*c13.y - c20x2*c12.x*c12y2*c13.y - 3*c20x2*c20.y*c13.x*c13y2 + c12x2*c20y2*c12.y*c13.x
    );
	var roots=poly.getRootsInInterval(0,1);
	for(var i=0;i<roots.length;i++){
		var s=roots[i];
		var xRoots=new Polynomial(c13.x,c12.x,c11.x,c10.x-c20.x-s*c21.x-s*s*c22.x-s*s*s*c23.x).getRoots();
		var yRoots=new Polynomial(c13.y,c12.y,c11.y,c10.y-c20.y-s*c21.y-s*s*c22.y-s*s*s*c23.y).getRoots();
		if(xRoots.length>0&&yRoots.length>0){
			var toler=0.001; //1e-4;
			checkRoots:for(var j=0;j<xRoots.length;j++){
				var xRoot=xRoots[j];
				if(0<=xRoot&&xRoot<=1){
				for(var k=0;k<yRoots.length;k++){
					if(Math.abs(xRoot-yRoots[k])<toler){
						result.push([c23.multiply(s*s*s).add(c22.multiply(s*s).add(c21.multiply(s).add(c20))),xRoot,roots[i]]);
						break checkRoots;
					}
				}
			}
		}
	}}
    return result;
};
/*Point*/
function Point(x,y){
	this.x = x;
	this.y = y;
}
Point.prototype.add = function(point2){
	return new Point(this.x+point2.x,this.y+point2.y);
};
Point.prototype.addValue = function(value){
	return new Point(this.x+value,this.y+value);
};
Point.prototype.multiply=function(value){
	return new Point(this.x*value,this.y*value);
};
Point.prototype.dot=function(point2){
	return this.x*point2.x+this.y*point2.y;
};
Point.prototype.lerp=function(point2,t){
	return new Point(this.x+(point2.x-this.x)*t,this.y+(point2.y-this.y)*t);
};
Point.prototype.isGE=function(point2){
	return(this.x>=point2.x&&this.y>=point2.y);
};
Point.prototype.isLE=function(point2){
	return(this.x<=point2.x&&this.y<=point2.y);
};
Point.prototype.min=function(point2){
	return new Point(Math.min(this.x,point2.x),Math.min(this.y,point2.y));
};
Point.prototype.max=function(point2){
	return new Point(Math.max(this.x,point2.x),Math.max(this.y,point2.y));
};
Point.prototype.subtract=function(point2){
	return new Point(this.x-point2.x,this.y-point2.y);
};
Point.prototype.isEqual=function(point2){
	return(parseInt(this.x,10)==parseInt(point2.x,10)&&parseInt(this.y,10)==parseInt(point2.y,10));
};

/*Polinimial*/
function Polynomial(){
	this.coefs=[];
   	if(arguments.length>0)
		for(var i=arguments.length-1;i>=0;i--)
   			this.coefs.push(arguments[i]);
	this.tolerance =1e-6;
	this.accuracy=6
}
Polynomial.prototype.eval=function(x){
    var result=0;
	for(var i=this.coefs.length-1;i>=0;i--)
	   result=result*x+this.coefs[i];
	   return result;
};
Polynomial.prototype.simplify=function(){
	for(var i=this.getDegree();i>=0;i--){
		if(Math.abs(this.coefs[i])<=this.tolerance) {
			this.coefs.pop();
		}
		else {
			break;
		}
	}
};
Polynomial.prototype.bisection=function(min,max){
	var minValue=this.eval(min);
	var maxValue=this.eval(max);
	var result;
	if(Math.abs(minValue)<=this.tolerance)
		result=min;
	else if(Math.abs(maxValue)<=this.tolerance)
		result=max;
	else if(minValue*maxValue<=0){
		var tmp1=Math.log(max-min);
		var tmp2=Math.log(10)*this.accuracy;
		var iters=Math.ceil((tmp1+tmp2)/Math.log(2));
		for(var i=0;i<iters;i++){
			result=0.5*(min+max);
			var value=this.eval(result);
			if(Math.abs(value)<=this.tolerance){
				break;
			}
			if(value*minValue<0){
				max=result;
				maxValue=value;
			}else{
				min=result;minValue=value;
			}
		}
	}
	return result;
};
Polynomial.prototype.getDegree=function(){
	return this.coefs.length-1;
};
Polynomial.prototype.getDerivative=function(){var derivative=new Polynomial();for(var i=1;i<this.coefs.length;i++){derivative.coefs.push(i*this.coefs[i]);}return derivative;};
Polynomial.prototype.getRoots=function(){var result;this.simplify();switch(this.getDegree()){case 0:result=new Array();break;case 1:result=this.getLinearRoot();break;case 2:result=this.getQuadraticRoots();break;case 3:result=this.getCubicRoots();break;case 4:result=this.getQuarticRoots();break;default:result=new Array();}return result;};
Polynomial.prototype.getRootsInInterval=function(min,max){
	var roots=new Array();
	var root;
	if(this.getDegree()==1){
		root=this.bisection(min,max);
		if(root!=null)roots.push(root);
	}else{
		var deriv=this.getDerivative();
		var droots=deriv.getRootsInInterval(min,max);
		if(droots.length>0){
			root=this.bisection(min,droots[0]);
			if(root!=null)roots.push(root);
			for(i=0;i<=droots.length-2;i++){
				root=this.bisection(droots[i],droots[i+1]);
				if(root!=null)roots.push(root);
			}
			root=this.bisection(droots[droots.length-1],max);
			if(root!=null)
				roots.push(root);
		}else{
			root=this.bisection(min,max);
			if(root!=null)
				roots.push(root);
		}
	}
	return roots;
};
Polynomial.prototype.getCubicRoots=function(){var results=new Array();if(this.getDegree()==3){var c3=this.coefs[3];var c2=this.coefs[2]/c3;var c1=this.coefs[1]/c3;var c0=this.coefs[0]/c3;var a=(3*c1-c2*c2)/3;var b=(2*c2*c2*c2-9*c1*c2+27*c0)/27;var offset=c2/3;var discrim=b*b/4 + a*a*a/27;var halfB=b/2;if(Math.abs(discrim)<=this.tolerance)disrim=0;if(discrim>0){var e=Math.sqrt(discrim);var tmp;var root;tmp=-halfB+e;if(tmp>=0)root=Math.pow(tmp,1/3);else root=-Math.pow(-tmp,1/3);tmp=-halfB-e;if(tmp>=0)root+=Math.pow(tmp,1/3);else root-=Math.pow(-tmp,1/3);results.push(root-offset);}else if(discrim<0){var distance=Math.sqrt(-a/3);var angle=Math.atan2(Math.sqrt(-discrim),-halfB)/3;var cos=Math.cos(angle);var sin=Math.sin(angle);var sqrt3=Math.sqrt(3);results.push(2*distance*cos-offset);results.push(-distance*(cos+sqrt3*sin)-offset);results.push(-distance*(cos-sqrt3*sin)-offset);}else{var tmp;if(halfB>=0)tmp=-Math.pow(halfB,1/3);else tmp=Math.pow(-halfB,1/3);results.push(2*tmp-offset);results.push(-tmp-offset);}}return results;};
Polynomial.prototype.getQuadraticRoots=function(){var results=new Array();if(this.getDegree()==2){var a=this.coefs[2];var b=this.coefs[1]/a;var c=this.coefs[0]/a;var d=b*b-4*c;if(d>0){var e=Math.sqrt(d);results.push(0.5*(-b+e));results.push(0.5*(-b-e));}else if(d==0){results.push(0.5*-b);}}return results;};
