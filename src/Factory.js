Canvas2D.Factory = {};

Canvas2D.Factory.extensions = {};

Canvas2D.Factory.extensions.ShortHands = {
    clear: function() {
	this.canvas.clearRect( 0, 0, 
			       this.htmlcanvas.width, 
			       this.htmlcanvas.height );
    },

    fillTextCenter : function(text, x, y, maxWidth) {
	var dx = this.measureText(text) / 2;
	this.fillText(text, x-dx, y, maxWidth);
    },
    fillTextRight : function(text, x, y, maxWidth) {
	var dx = this.measureText(text);
	this.fillText(text, x-dx, y, maxWidth);
    },

    strokeTextCenter : function(text, x, y, maxWidth) {
	var dx = this.measureText(text) / 2;
	this.strokeText(text, x-dx, y, maxWidth);
    },
    strokeTextRight : function(text, x, y, maxWidth) {
	var dx = this.measureText(text);
	this.strokeText(text, x-dx, y, maxWidth);
    },

    fillStrokeRect : function(left, top, width, height) {
	this.fillRect( left, top, width, height );
	this.strokeRect( left, top, width, height );
    }
};

Canvas2D.Factory.extensions.EventHandling = {
    on: function( event, handler ) {
	if( !this.eventHandlers ) { this.eventHandlers = []; }
	this.eventHandlers[event] = handler;
    },

    fireEvent: function( event, data ) {
	if( !this.eventHandlers ) { return; }
	if( this.eventHandlers[event] ) {
	    this.eventHandlers[event](data);
	}
    }
};

Canvas2D.Factory.extensions.DashedLineSupport = {
    setCurrentXY: function( x, y) {
	if( !this.currentX ) { this.currentX = 0; }
	if( !this.currentY ) { this.currentY = 0; }
	this.currentX = x;
	this.currentY = y;
    },

    moveTo: function(x,y) {
	this.canvas.moveTo( x, y );
	this.setCurrentXY( x, y );
    },

    lineTo: function(x,y) {
	this.transferProperties();
	if( this.lineStyle == "dashed" ) {
	    this._drawLine( this.currentX, this.currentY, x, y );
	} else {
	    this.canvas.lineTo( x, y );
	}
	this.setCurrentXY(x, y);
    },

    _plotPixel: function( x, y, c ) {
	with( this.canvas ) {
	    var oldStyle = strokeStyle;
	    beginPath();
	    strokeStyle = c;
	    fillStyle = c;
	    //fillRect(x,y,1,1);
	    // TODO: Why doesn't this produce crisp lines of width 1???
	    moveTo(x,y);
	    lineTo(x+1,y+1);
	    stroke();
	    closePath();
	    strokeStyle = oldStyle;
	}
    },

    _drawLine: function(x1, y1, x2, y2 ) {
	x1 = Math.floor(x1);
	x2 = Math.floor(x2);
	y1 = Math.floor(y1-1);
	y2 = Math.floor(y2-1);
	// to make sure other strokes are stroked:
	this.canvas.stroke();

	var c = this.strokeStyle;
	var style = this.lineStyle;

	var steep = Math.abs(y2 - y1) > Math.abs(x2 - x1);
	if (steep) {
            t = y1;            y1 = x1;            x1 = t;
            t = y2;            y2 = x2;            x2 = t;
	}
	var deltaX = Math.abs(x2 - x1);
	var deltaY = Math.abs(y2 - y1);
	var error = 0;
	var deltaErr = deltaY;
	var xStep;
	var yStep;
	var x = x1;
	var y = y1;
	if(x1 < x2) {  xStep = 1; } else { xStep = -1; }
	if(y1 < y2) {  yStep = 1; } else { yStep = -1;	}
	if( steep ) { this._plotPixel(y, x, c); } 
	else        { this._plotPixel(x, y, c); }
	var dot = 0;
	while( x != x2 ) {
            x = x + xStep;
            error = error + deltaErr;
            if( 2 * error >= deltaX ) {
		y = y + yStep;
		error = error - deltaX;
            }
	    var color = ( style != "dashed" || ++dot % 15 ) < 10 ? c : "white";
            if(steep) { this._plotPixel(y, x, color); } 
	    else      { this._plotPixel(x, y, color); }
	}
    }

};

Canvas2D.Factory.extensions.TextDecorationSupport = {
    decorateText : function(text, x, y, maxWidth) {
	if( !this.textDecoration ) { return; }

	this.save();
	this.textDecoration.toLowerCase().split(" ").each(function(decoration) {
	    var decorator = null;
	    switch(decoration) {
	    case "underline"   : decorator = this.underlineText;   break;
	    case "overline"    : decorator = this.overlineText;    break;
	    case "line-through": decorator = this.linethroughText; break;
	    }
	    if( decorator ) { 
		this.beginPath();
		var length = this.measureText(text);
		if( length > maxWidth ) { length = maxWidth; }
		decorator.call(this, text, x, y, length); 
		this.stroke();
		this.closePath();
	    }
	}.bind(this) );
	this.restore();
    },

    underlineText : function(text, x, y, length) {
        this.moveTo(x, y + 3);
        this.lineTo(length, y + 3);
    },

    overlineText : function(text, x, y, length) {
        this.moveTo(x, y - getFontSize(this.font) );
        this.lineTo(length, y - getFontSize(this.font) );
    },

    linethroughText : function(text, x, y, length) {
        this.moveTo(x, y - (getFontSize(this.font) / 2) + 2);
        this.lineTo(length, y - (getFontSize(this.font) / 2) + 2);
    }
};

Canvas2D.Factory.extensions.MouseEvents = {
    initialize: function($super, element) {
	$super(element);
	this.setupMouseEventHandlers();
    },

    setupMouseEventHandlers: function() {
	Event.observe(this.htmlcanvas, 'mousedown', 
		      this.handleMouseDown.bindAsEventListener(this));
	Event.observe(this.htmlcanvas, 'mouseup', 
		      this.handleMouseUp.bindAsEventListener(this));
	Event.observe(document, 'mousemove', 
		      this.handleMouseMove.bindAsEventListener(this));
    },

    getLeft: function() {
	var elem = this.htmlcanvas;
	var left = 0;
	while( elem != null ) {
	    left += elem.offsetLeft;
	    elem = elem.offsetParent;
	}
	return left;
    },

    getTop: function() {
	var elem = this.htmlcanvas;
	var top = 0;
	while( elem != null ) {
	    top += elem.offsetTop;
	    elem = elem.offsetParent;
	}
	return top;
    },

    getXY: function(event) {
	if( event == null ) { event = window.event; }
	if( event == null ) { return null;          }
	if( event.pageX || event.pageY ) {
            return { x: event.pageX - this.getLeft(), 
		     y: event.pageY - this.getTop()  };
	}
	return null;
    },

    handleMouseDown: function(event) {
	this.mousepressed = true;
	var pos = this.getXY(event);
	this.fireEvent( "mousedown", pos );
	this.mousePos = pos;
    },

    handleMouseUp: function(event) {
	this.mousepressed = false;
	var pos = this.getXY(event);
	this.fireEvent( "mouseup", pos );
	this.mousePos = pos;
    },

    handleMouseMove: function(event) {
	if( this.mousepressed ) { this.handleMouseDrag(event); }
	var pos = this.getXY(event);
	if( pos ) {
	    this.mouseOver = 
		( pos.x >= 0 && pos.x <= this.htmlcanvas.width )
		&&  
		( pos.y >= 0 && pos.y <= this.htmlcanvas.height );
	}
    },

    handleMouseDrag: function(event) {
	var pos = this.getXY(event);
	this.fireEvent( "mousedrag", { x: pos.x, 
				       y: pos.y, 
				       dx: pos.x - this.mousePos.x,
				       dy: pos.y - this.mousePos.y } );
	this.mousePos = pos;
    }
};
    
Canvas2D.Factory.CanvasText = {
    fillText : function(text, x, y, maxWidth) {
	this.strokeText(text, x, y, maxWidth);
	this.fill();
    },
    
    strokeText : function(text, x, y, maxWidth) {
    	this.beginPath();
	
    	this.save();
	
	this.moveTo(x, y);
	this.lineStyle = "solid";
	this.lineWidth = 1;

	if( this.textAlign == "center" ) { 
	    x -= this.measureText(text) / 2; 
	} else if( this.textAlign == "right" ) { 
	    x -= this.measureText(text);     
	}
	
	CanvasTextFunctions.draw(this, this.font, getFontSize(this.font), 
				 x, y, text);
	
	this.closePath();
	this.restore();
	
	this.decorateText(text, x, y, maxWidth);
    },
    
    measureText  : function(text) {
	return CanvasTextFunctions.measure( this.font, getFontSize(this.font), 
					    text);
    }
};

Canvas2D.Factory.GeckoCanvasText = {
    fillText     : function(text, x, y, maxWidth) {
        if (!this.canvas.fillText) {
            // fallback to pre Gecko 1.9.1 text rendering
            this.drawText(text, x, y, true);
        } 
        else {
            this.canvas.font = this.font;
            this.canvas.fillText(text, x, y, maxWidth);
        }
        this.decorateText(text, x, y, maxWidth);
    },

    strokeText   : function(text, x, y, maxWidth) {
        if (!this.canvas.strokeText) {
            // fallback to pre Gecko 1.9.1 text rendering
            this.drawText(text, x, y, false);
        } else {
            this.canvas.font = this.font;
            this.canvas.strokeText(text, x, y, maxWidth);
        }
        this.decorateText(text, x, y, maxWidth);
    },

    measureText  : function(text) {
        this.save();
        if (!this.canvas.measureText) {
            // fallback to pre Gecko 1.9.1 text measuring
            this.canvas.mozTextStyle = this.font;
            return this.canvas.mozMeasureText(text);
        } else {
            this.canvas.font = this.font;
            return this.canvas.measureText(text);
        }
        this.restore();
    },

    /**
     * Helper function to stroke text.
     * @param {DOMString} text The text to draw into the context
     * @param {float} x The X coordinate at which to begin drawing
     * @param {float} y The Y coordinate at which to begin drawing
     * @param {boolean} fill If true, then text is filled, 
     * 			otherwise it is stroked  
     */
    drawText : function(text, x, y, fill) {
        this.save();

        this.beginPath();
        this.translate(x, y);
        this.canvas.mozTextStyle = this.font;
        this.canvas.mozPathText(text);
        if (fill) {
            this.fill();
        } else {
            this.stroke();
        }
        this.closePath();

        this.restore();
    }
};

Canvas2D.Factory.setup = function(element) {
    var canvas = null;

    // dynamically add passthrough functions to CanvasBase, before we mixin
    passThroughFunctions = [ "scale", "translate", "transform", "setTransform",
			     "createLinearGradient",  "createRadialGradient",
			     "createPattern",
			     "clearRect", "fillRect", "strokeRect",
			     "arc", "rotate", "drawImage",
			     "lineTo", "moveTo",
			     "quadraticCurveTo",  "bezierCurveTo", "arcTo", "rect",
			     "fill", "stroke",
			     "closePath", "beginPath",
			     "clip", "isPointInPath",
			     "createImageData", "getImageData", "putImageData" ];
    passThroughFunctions.each(function(fnc) {
	    Canvas2D.CanvasBase.prototype[fnc] = function() {
		this.transferProperties();
		this.canvas[fnc].apply(this.canvas, arguments);
	    };
    });

    if( Prototype.Browser.WebKit ) { 
	canvas = Class.create( Canvas2D.CanvasBase, 
			       Canvas2D.Factory.CanvasText );
    }
    if( Prototype.Browser.Gecko )  {
      canvas = Class.create( Canvas2D.CanvasBase,
                             Canvas2D.Factory.GeckoCanvasText ); 
    }
    if( Prototype.Browser.IE )     { 
	canvas = Class.create( Canvas2D.CanvasBase, 
			       Canvas2D.Factory.CanvasText );
    }
    if( Prototype.Browser.Opera ) {
	throw( "Factory::setup: Opera support is currently disabled." );
    }
    if( Prototype.Browser.MobileSafari ) {
	throw( "Factory::setup: MobileSaferi support is currently disabled." );
    }

    if( canvas == null ) {
	throw( "Factory::setup: unknown browser." );
    }

    // mixin some functions that clearly are missing ;-)
    $H(Canvas2D.Factory.extensions).values().each(function(ext) {
	canvas = Class.create( canvas, ext );
    } );

    return new canvas(element);
};
