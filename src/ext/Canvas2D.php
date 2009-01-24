<?php

# Alert the user that this is not a valid entry point to MediaWiki 
# if they try to access the special pages file directly.
if (!defined('MEDIAWIKI')) {
  echo <<<EOT
  To install my extension, put the following line in LocalSettings.php:
  require_once( "\$IP/extensions/Canvas2D/Canvas2D.php" );
EOT;
        exit( 1 );
}

$wgExtensionFunctions[] = 'Canvas2DInit';

// Extension credits that will show up on Special:Version    
$wgExtensionCredits['parserhook'][] = array(
	'name'         => 'Canvas2D',
	'version'      => '0.1.0',
	'author'       => 'Christophe VG <xtof@thesoftwarefactory.be>', 
	'url'          => 'http://thesoftwarefactory.be/wiki/Canvas2D',
	'description'  => 'Allows wiki editors to use a textual DSL, ' .
	                  'which gets rendered shapes using the HTML5 '.
	                  'canvas element.'
);

function Canvas2DInit() {
  global $wgParser, $wgOut, $wgScriptPath;
  $path = "$wgScriptPath/extensions/Canvas2D";

  $wgParser->setHook( 'canvas2d', 'Canvas2DRender' );

  $wgOut->addHeadItem('Canvas2D-JS', 
		      "<script src=\"$path/Canvas2D.js\"></script>");  
  $wgOut->addHeadItem('Canvas2D-CSS', 
		      "<link href=\"$path/Canvas2D.css\" ".
		      "rel=\"stylesheet\" type=\"text/css\" />");
  return true;
}

function Canvas2DRender( $input, $args, $parser ) {
  static $diagramCount = 1;
  $name   = isset($args['name']) ? $args['name'] : "diagram" . $diagramCount++;
  $width  = isset($args['width'] ) ? $args['width']  : 375;
  $height = isset($args['height']) ? $args['height'] : 200;
  $float  = isset($args['float'])  ? $args['float']  : "left";
  $showSource = isset( $args['show'] ) ? 
    (strpos( $args['show'], "source"  ) !== false ) : true;
  $showConsole = isset( $args['show'] ) ? 
    (strpos( $args['show'], "console" ) !== false ) : true;
  $showAbout = isset( $args['show'] ) ? 
    (strpos( $args['show'], "about"   ) !== false ) : true;
  
  $tabberWidth   = $width  + 20;
  $tabberHeight  = $height + 55;
  $sourceHeight  = $height - 27;
  $consoleHeight = $height;
  $aboutHeight   = $height;

  $canvas = '<div class="Canvas2D-container" style="float:'.$float.'">' .
    '<canvas class="Canvas2D" id="' . $name . 
    '" width="'.$width.'" height="'.$height.'"></canvas></div>';
  $canvas .= '<pre id="'.$name.'Source" style="display:none">'.$input.'</pre>';

  return $canvas;
}

?>