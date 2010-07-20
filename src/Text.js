Canvas2D.Text = Canvas2D.Shape.extend( {
  beforeRender: function beforeRender(sheet) {
    this.width  = sheet.measureText(this.getText());
    this.height = sheet.getFontSize();
  },

  draw: function draw(sheet, left, top) {
    top += this.getHeight();
    sheet.useCrispLines  = this.getUseCrispLines();
    sheet.strokeStyle    = this.getColor();
    sheet.fillStyle      = this.getColor();
    sheet.font           = this.getFont();
    sheet.textAlign      = this.getTextAlign();
    sheet.textDecoration = this.getTextDecoration();

    sheet.fillText(this.getText(), left, top );
  }
} );

Canvas2D.Text.MANIFEST = {
  name         : "text",
  properties   : { 
    text           : new Canvas2D.Types.Text( { extractFrom:ADL.Value } ),
    color          : new Canvas2D.Types.Color(), 
    font           : new Canvas2D.Types.Font(), 
    textAlign      : new Canvas2D.Types.Align(),
    textDecoration : new Canvas2D.Types.FontDecoration()
  },
  libraries    : [ "Canvas2D" ]
};

Canvas2D.Text.Defaults = {
  text           : "",
  useCrispLines  : false,
  color          : "black",
  font           : "10pt Sans-Serif", 
  textAlign      : "left", 
  textDecoration : "none"
};

Canvas2D.registerShape( Canvas2D.Text );
