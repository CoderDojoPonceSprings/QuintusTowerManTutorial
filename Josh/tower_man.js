window.addEventListener("load", function() {
  // Setup Quintus
  var Q = window.Q = Quintus(
    { development: true })
    .include("Sprites, Scenes, Input, 2D")
    .setup({ width: 640, height: 480 });
    
  // Key and joy controls
  Q.input.keyboardControls();
  Q.input.joypadControls();
  
  // Basic sprite
  Q.Sprite.extend("Player", {
    init: function(p) {
      this._super(p, {
        sheet:"player"
      });
      
      this.add("2d");
    }
  });
  
  // Minimal level
  Q.scene("level1", function(stage) {
    var player = stage.insert(
      new Q.Player({ x: 48, y: 48}));
  });
  
  // Load and start the level
  Q.load("http://html5gametutorial.com/tower_man/images/sprites.png, http://html5gametutorial.com/tower_man/data/sprites.json, level.json", function() {
    Q.load("http://html5gametutorial.com/tower_man/images/sprites.png", "http://html5gametutorial.com/tower_man/data/sprites.json");
    Q.stageScene("level1");
  });
});