Canvas2D.Sheet = Canvas2D.Shape.extend( {
  setCanvas: function setCanvas(canvas) {
    this.canvas = canvas;
    this.wireCanvasDelegation();
    this.setupProperties();
  },

  getHeight: function getHeight() {
    return this.canvas.canvas.height;
  },

  wireCanvasDelegation: function wireCanvasDelegation() {
    if( !this.canvas ) { return; }

    Canvas2D.Sheet.Operations.iterate(function(operation) {
      if( operation == "restore" ) {
        this[operation] = function() {
          this.canvas[operation].apply(this.canvas, arguments);
          this.transferBackProperties();
          return;
        }.scope(this);
      } else {
        this[operation] = function() {
          this.transferProperties();
          return this.canvas[operation].apply(this.canvas, arguments);
        }.scope(this);
      }
    }.scope(this) );
  },

  setupProperties: function setupProperties() {
    Canvas2D.Sheet.Properties.iterate( function(prop) {
      this[prop] = Canvas2D.Sheet.Defaults[prop] || this.canvas[prop];
    }.scope(this) );
  },

  transferProperties : function() {
    Canvas2D.Sheet.Properties.iterate(function(prop) {
      this.canvas[prop] = this[prop];
    }.scope(this) );
  },

  transferBackProperties : function() {
    Canvas2D.Sheet.Properties.iterate(function(prop) {
      this[prop] = this.canvas[prop];
    }.scope(this) );
  },

  clear: function() {
    this.positions      = []; // list of shapes on the sheet
    this.shapesMap      = {}; // name to shape mapping
    this.positionsMap   = {}; // shape to position mapping

    this.fireEvent( "change" );
  },

  freeze: function() { this.fireEvent( "freeze" ); },
  thaw:   function() { this.fireEvent( "thaw" );   },

  at: function(left, top) {
    this.newTop  = top;
    this.newLeft = left;
    return this;
  },

  put: function(shape) {
    return this.add(shape);
  },
  
  remove: function remove(shape) {
    var baseName = shape.getName().replace(/<.*$/,'');
    shape.on( "change", function(){} );
    delete this.shapesMap[baseName];
    this.positions.remove(this.positionsMap[baseName]);
    delete this.positionsMap[baseName];
    this.fireEvent( "removeShape", shape );
    this.makeDirty();
  },

  add: function add(shape) {
    var baseName = shape.getName().replace(/<.*$/,'');
    if( this.shapesMap[baseName] ) {
      var logger = this.book ? this.book : console;
      logger.log( "WARNING: Shape with name '" + baseName + 
      "' already exists. Skipping." );
      return null;
    }

    var position = new Canvas2D.Position( shape, this.newLeft, this.newTop);
    shape   .on( "change", this.makeDirty.scope(this) );
    position.on( "change", this.makeDirty.scope(this) );

    this.newLeft = null;
    this.newTop = null;

    this.positions.push(position);
    this.shapesMap[baseName] = shape;
    this.positionsMap[shape.getName()] = position;

    this.fireEvent( "newShape", "added new shape" + 
    ( position.getLeft() != null ? 
    "@" + position.getLeft() + "," +
    position.getTop() : "" ) );

    this.makeDirty();

    return shape;
  },

  getPosition: function getPosition(shape) {
    return this.positionsMap[shape.getName()];
  },

  render: function() {
    var delayed = [];
    this.positions.iterate( function(shape) { 
      if( shape.delayRender() ) {
        delayed.push(shape);
      } else {
        shape.render(this); 
      }
    }.scope(this) );

    delayed.iterate( function(shape) { shape.render(this); }.scope(this) );
  },

  toADL: function() {
    var s = "";
    s += "Sheet "  + this.name;
    s += " +" + this.style + " {\n";
    this.positions.iterate(function(shape) { 
      var t = shape.toADL("  ");
      if( t ) { s += t + "\n"; }
    } );
    s += "}";
    return s;
  }
} );

Canvas2D.Sheet.Properties = [ 
"globalAlpha", "globalCompositeOperation",
"strokeStyle", "fillStyle", "lineWidth", 
"lineCap", "lineJoin", "miterLimit", 
"shadowOffsetX", "shadowOffsetY", "shadowBlur", "shadowColor",
"font", "textAlign", "textBaseline",
"lineStyle", "useCrispLines", "textDecoration" 
];

Canvas2D.Sheet.Operations = [ 
"save", "restore", 
"scale", "rotate", "translate", "transform", "setTransform",
"createRadialGradient", "createPattern",
"clearRect", "fillRect", "strokeRect",
"beginPath", "closePath", "moveTo", "lineTo",
"quadraticCurveTo", "bezierCurveTo", 
"arcTo", "rect", "arc",
"fill", "stroke", 
"clip","isPointInPath", 
"fillText","fillText","strokeText","strokeText","measureText",
"drawImage","createImageData","getImageData","putImageData",
"getFontSize", "fillStrokeRect" 
];

Canvas2D.Sheet.MANIFEST = {
  name      : "sheet",
  properties : {
    book  : Canvas2D.Types.Parent,
    style : Canvas2D.Types.Selection( 
      { values: [ "static", "dynamic" ], asKey: true } 
    )
  },
  libraries : [ "Canvas2D" ]
};

Canvas2D.registerShape( Canvas2D.Sheet );

Canvas2D.Sheet.Defaults = { 
  name           : "newSheet",
  style          : "static",
  lineWidth      : 1,   
  lineStyle      : "solid",
  strokeStyle    : "black", 
  fillStyle      : "black", 
  font           : "10pt Sans-Serif", 
  textAlign      : "left", 
  textBaseline   : "alphabetic",
  textDecoration : "none",
  shadowColor    : "rgba(0,0,0,0.0)"
};
