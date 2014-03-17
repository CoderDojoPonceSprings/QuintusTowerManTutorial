// 1. Wait for the onload event
window.addEventListener("load",function() {

  // 2. Set up a basic Quintus object
  //    with the necessary modules and controls
  //    to make things easy, we're going to fix this game at 640x480
  var Q = window.Q = Quintus({ development: true })
          .include("Sprites, Scenes, Input, 2D")
          .setup({ width: 640, height: 480 })
          .controls(true);

  // 3. Add in the default keyboard controls
  //    along with joypad controls for touch
  Q.input.keyboardControls();
  Q.input.joypadControls();

  // Add these two lines below the controls
  Q.gravityY = 0;
  Q.gravityX = 0;

  // Constants
  var SPRITE_PLAYER = 1;
  var SPRITE_TILES = 2;
  var SPRITE_ENEMY = 4;
  var SPRITE_DOT = 8;  

  Q.component("towerManControls", {
    // default properties to add onto our entity
    defaults: { speed: 100, direction: 'up' },

    // called when the component is added to
    // an entity
    added: function() {
      var p = this.entity.p;

      // add in our default properties
      Q._defaults(p,this.defaults);

      // every time our entity steps
      // call our step method
      this.entity.on("step",this,"step");
    },

    step: function(dt) {
      // grab the entity's properties
      // for easy reference
      var p = this.entity.p;

      // rotate the player
      // based on our velocity
      if(p.vx > 0) {
        p.angle = 90;
      } else if (p.vx < 0) {
        p.angle = -90;
      } else if (p.vy > 0) {
        p.angle = 180;
      } else if (p.vy < 0) {
        p.angle = 0;
      }

      // grab a direction from the input
      p.direction = Q.inputs['left']  ? 'left' :
                    Q.inputs['right'] ? 'right' :
                    Q.inputs['up']    ? 'up' :
                    Q.inputs['down']  ? 'down' : p.direction;

      // based on our direction, try to add velocity
      // in that direction
      switch(p.direction) {
        case "left": p.vx = -p.speed; break;
        case "right":p.vx = p.speed; break;
        case "up":   p.vy = -p.speed; break;
        case "down": p.vy = p.speed; break;
      }
    }
  });  

  Q.component("enemyControls", {
    defaults: { speed: 100, direction: 'left', switchPercent: 2},

    added: function() {
      var p = this.entity.p;

      Q._defaults(p, this.defaults);

      this.entity.on("step", this, "step");
      this.entity.on("hit", this, "changeDirection");
    },

    step: function(dt) {
      var p = this.entity.p;

      // Randomly try to switch directions
      if(Math.random() < p.switchPercent / 100) {
        this.tryDirection();
      }

      // Add velocity in the direction we are currently heading
      switch (p.direction) {
        case "left": p.vx = -p.speed; break;
        case "right": p.vx = p.speed; break;
        case "up": p.vy = -p.speed; break;
        case "down": p.vy = p.speed; break;
      }
    },

    // Try a random direction 90 degrees away from the 
    // current direction of movement
    tryDirection: function() {
      var p = this.entity.p;
      var from = p.direction;
      if (p.vy != 0 && p.vx == 0) {
        p.direction = Math.random() < 0.5 ? 'left' : 'right';
      } else if (p.vx != 0 && p.vy == 0) {
        p.direction = Math.random() < 0.6 ? 'up' : 'down';
      }
    },

    // Called every collision, if we're stuck,
    // try moving in a direction 90 degrees away from the normal 
    changeDirection: function(collision) {
      var p = this.entity.p;
      if (p.vx == 0 && p.vy == 0) {
        if (collision.normalY) {
          p.direction = Math.random() < 0.5 ? 'left' : 'right';
        } else if (collision.normalX) {
          p.direction = Math.random() < 0.5 ? 'up' : 'down';
        }
      }
    }
  });

  Q.Sprite.extend("Enemy", {
    init: function(p) {
      this._super(p, {
        sheet:"enemy",
        type: SPRITE_ENEMY,
        collisionMask: SPRITE_PLAYER | SPRITE_TILES
      });

      this.add("2d, enemyControls");
      this.on("hit.sprite", this, "hit");
    },

    hit: function(col) {
      if (col.obj.isA("Player")) {
        Q.stageScene("level1");
      }
    }
  });

  // 4. Add in a basic sprite to get started
  Q.Sprite.extend("Player", {
    init: function(p) {

      this._super(p,{
        sheet:"player",
        type: SPRITE_PLAYER,
        collisionMask: SPRITE_TILES | SPRITE_ENEMY | SPRITE_DOT
      });

      this.add("2d, towerManControls");
    }
  });

  Q.Sprite.extend("Dot", {
    init: function(p) {
      this._super(p,{
        sheet: 'dot',
        type: SPRITE_DOT,
        // Sensor settings
        sensor: true
      });

      this.on("sensor");
      this.on("inserted");
    },

    sensor: function() {
      this.destroy();
      this.stage.dotCount--;
      if(this.stage.dotCount == 0) {
        Q.stageScene("level1");
      }
    },

    inserted: function() {
      this.stage.dotCount = this.stage.dotCount || 0;
      this.stage.dotCount++;
    }    
  });

  Q.Dot.extend("Tower", {
    init: function(p) {  
      this._super(Q._defaults(p, {
        sheet: 'tower'
      }));
    }
  });

  Q.tilePos = function(col, row) {
    return { x: col*32 + 16, y: row*32 + 16 };
  };

  Q.TileLayer.extend("TowerManMap", {
    init: function() {
      this._super({
        type: SPRITE_TILES,
        dataAsset: 'level.json',
        sheet: 'tiles'
      });
    },
    setup: function() {
      var tiles = this.p.tiles = this.p.tiles.concat();
      var size = this.p.tileW;
      for (var y = 0; y < tiles.length; y++) {
        var row = tiles[y] = tiles[y].concat();
        for (var x = 0; x < row.length; x++) {
          var tile = row[x];
          // Replace 0's with dots and 2's with Towers
          if (tile == 0 || tile == 2) {
            var className = tile == 0 ? 'Dot' : 'Tower';
            this.stage.insert(new Q[className](Q.tilePos(x,y)));
            row[x] = 0;
          }
        }
      }
    }
  });

  Q.scene("level1", function(stage) {
    var map = stage.collisionLayer(new Q.TowerManMap());
    map.setup();
    var player = stage.insert(new Q.Player(Q.tilePos(10,7)));

    stage.insert(new Q.Enemy(Q.tilePos(10,4)));
    stage.insert(new Q.Enemy(Q.tilePos(15,10)));
    stage.insert(new Q.Enemy(Q.tilePos(5,10)));
  });

  Q.load("sprites.png, sprites.json, level.json, tiles.png", function() {
    Q.sheet("tiles", "tiles.png", { tileW: 32, tileH: 32 });
    Q.compileSheets("sprites.png", "sprites.json");
    Q.stageScene("level1");
  });
});
