// namespace for holding all Canvas2D related classes, functions and extensions
var Canvas2D = {
  // all known/registered shapes that can be used on this canvas
  shapes: $H(),

  // libraries are groups of shapes
  libraries: $H(),

  // global placeholder for extensions to register
  extensions: [],

  // one-shot activation of a Canvas
  activate: function activate(canvasId) {
    var canvas = document.getElementById(canvasId);
    if(canvas) {
      var manager = new Canvas2D.Manager();
      var book    = manager.setupBook(canvasId);
      var sheet   = book.addSheet();
      manager.startAll();
      return sheet;
    }
    throw( canvasId + " does not reference a known id on the document." );
  },

  // method to register a shape
  registerShape: function registerShape(shape) {
    // let's store a reference to the class in the prototype itself
    shape.prototype.__CLASS__ = shape;
    shape.prototype.getClass = function getClass() { return this.__CLASS__; };

    // mixin static methods for dealing with manifests
    Canvas2D.Shape.manifestHandling.iterate( function(key, value) {
      shape[key] = value;
    } );

    // register shape with all names (including aliasses)
    shape.getTypes().iterate(function(name) {
      Canvas2D.shapes.set(name, shape);
    } );

    // add shape to libraries
    shape.getLibraries().iterate(function(library) {
      if( !Canvas2D.libraries.get(library) ) { 
        Canvas2D.libraries.set(library, []);
      }
      Canvas2D.libraries.get(library).push(shape);
    } );

    // setup getters
    shape.getPropertiesConfig().iterate(function propertyConfigIterator(prop, config) {
      var propName = prop.substr(0,1).toUpperCase() + prop.substr(1);
      var getterName = "get"+propName;
      // if no getter is explicitly provided, ...
      if( typeof shape.prototype[getterName] == "undefined" ) {
        // if the prop's type config provides one ...
        if( config.createGetter ) {
          shape.prototype[getterName] = config.createGetter();
        } else {
          shape.prototype[getterName] = function() { return this.getProperty(prop);};
        }
      }
      var setterName = "set"+propName;
      if( typeof shape.prototype[setterName] == "undefined" ) {
        shape.prototype[setterName] = function(value) {
          this.setProperty(prop, value);
        };
      }
    }.scope(this));
  },

  getBook : function(id) {
    return Canvas2D.KickStarter.manager.getBook(id);
  },

  makePluggable : function makePluggable(shape) {
    // class level plugin registration
    shape.pluginClasses = [];
    shape.addPlugin = function addPlugin(name, plugin, exposes) {
      exposes = exposes || [];
      this.pluginClasses.push({name: name, clazz: plugin, exposes: exposes});
    };
    
    // instance level setup
    shape.prototype.setupPlugins = function setupPlugins() {
      this.plugins = $H();
      shape.pluginClasses.iterate(function(plugin) {
        var pluginInst = plugin.clazz.getInstance(this);
        if( pluginInst ) {
          this.plugins.set(plugin.name, pluginInst);
          plugin.exposes.iterate(function(func) {
            this[func] = function(arg1, arg2, arg3) { 
              pluginInst[func](arg1, arg2, arg3);
            };
          }.scope(this) );
          if( pluginInst.activate ) { pluginInst.activate(); }
        }
      }.scope(this) );
    };
    
    shape.prototype.getPlugin = function getPlugin(name) {
      return this.plugins.get(name);
    };

    // add setupPlugins as a Post-Init aspect
    var originalInit = shape.prototype.init;
    shape.prototype.init = function(element) {
      originalInit.call(this, element);
      this.setupPlugins();
    };
  }
};

Canvas2D.Defaults = {};

Canvas2D.Defaults.Canvas = {
  lineWidth      : 1,   
  useCrispLines  : true,
  lineStyle      : "solid",
  strokeStyle    : "black", 
  fillStyle      : "black", 
  font           : "10pt Sans-Serif", 
  textAlign      : "left", 
  textBaseline   : "alphabetic",
  textDecoration : "none"    
};
