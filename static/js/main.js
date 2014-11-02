// Static settings variables
var GROUND_HEIGHT = 128,
    PATRICK_VELOCITY_X = 300;

var game = new Phaser.Game(
    800,
    600,
    Phaser.AUTO,
    'game_box',
    { preload: preload,
      create: create,
      update: update }
);

// Load static assets
function preload() {
    game.load.image('sky', 'static/imgs/sky.png');
    game.load.image('ground', 'static/imgs/platform.png');
    game.load.image('patty', 'static/imgs/patty.png');
    game.load.spritesheet('jellyfish', 'static/imgs/jellyfish_sprites.png', 29, 25);
    game.load.spritesheet('patrick', 'static/imgs/patrick_sprites.png', 30, 50);
}

// Ingame dynamic variables
var speed = 0,
    acceleration = 0,
    altitude = 0,

    player,
    platforms,
    patties,
    jellyfishes,
    cursors,

    altitude_text,

    facing_right = true,
    falling = false,

    starting_time,
    elapsed,
    milliseconds = 0,
    seconds = 0;


function updateTimer() {
    seconds = Math.floor(game.time.time / 1000);
    milliseconds = Math.floor(game.time.time);
    elapsed = game.time.time - starting_time;
}


function create() {
    // We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.add.sprite(0, 0, 'sky');

    // Enable physics for any object that is created in this group
    platforms = game.add.group();
    platforms.enableBody = true;
    var ground = platforms.create(
                    0,
                    game.world.height - GROUND_HEIGHT,
                    'ground');

    // Scale it to fit the width of the game (the original sprite is 400x32 in size)
    ground.scale.setTo(2, 4);

    // This stops it from falling away when you jump on it
    ground.body.immovable = true;

    player = game.add.sprite(
                game.world.width / 2,
                game.world.height - 150,
                'patrick');

    // We need to enable physics on the player
    game.physics.arcade.enable(player);

    player.body.bounce.y = 0.2;
    player.body.collideWorldBounds = true;

    player.animations.add('standing', [1]);
    player.animations.add('falling', [0]);
    player.anchor.setTo(0.5, 0.5);
    player.animations.play('standing');

    jellyfishes = game.add.group();
    jellyfishes.enableBody = true;

    patties = game.add.group();
    patties.enableBody = true;
    // Initial patty on ground to give Patrick a boost
    var first_patty = patties.create(
                        0.75 * game.world.width,
                        game.world.height - GROUND_HEIGHT - 50, 
                        'patty');

    first_patty.scale.setTo(0.5, 0.5);

    altitude_text = game.add.text(
        10, 
        10,
        'Altitude: 0', 
        { fontSize: '15px',
          fill: '#000' }
    );

    starting_time = game.time.time;
    elapsed = game.time.time - starting_time;

    // Controls
    cursors = game.input.keyboard.createCursorKeys();
}


function add_jellyfish() {
    var jelly = jellyfishes.create(
                    Math.floor(Math.random() * game.world.width),
                    0,
                    'jellyfish');
    jelly.body.bounce.y = 0.7 + Math.random() * 0.2;
    jelly.checkWorldBounds = true; 
    jelly.outOfBoundsKill = true;
    jelly.animations.add('swim', [0, 1, 2, 3], 12, true);
    jelly.animations.play('swim');

    // Start each jellyfish at a random animation to look more real
    jelly.animations.currentAnim.frame = Math.floor(Math.random() * 3);
}


function add_krabby_patty() {
    var patty = patties.create(
                    Math.floor(Math.random() * game.world.width),
                    0,
                    'patty');
    patty.scale.setTo(0.5, 0.5);
}


/*
 * IMPORTANT: Because the update function's contents vary in
 * functionality and depend on eachother, the seperate functions
 * must be divided in sequences.
 *
 * 1. Update all game clocks
 * 2. Check for all collisions
 * 3. Insert new objects if needed
 * 4. Update physics
 * 5. Update animations
 * 6. Check user keyboard input and perform needed actions
 * 7. Update text
 *
 */
function update() {
    // Update all game clocks
    updateTimer();

    // Check for *all* collisions
    //game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(jellyfishes, platforms);
    game.physics.arcade.collide(player, patties, collect_patty, null, this);

    game.physics.arcade.overlap(player,
                                jellyfishes,
                                hit_jellyfish,
                                null,
                                this);

    // Insert new objects if needed

    altitude += speed;

    // Game over
    if (altitude < 0) {
         
    }

    // New jellyfish are popped in every 20 milliseconds
    if (game.time.time % 20 === 0 && altitude > 0) {
        add_jellyfish();
    }

    // New krabby patties are popped in every 40 ms
    if (game.time.time % 20 === 0 && altitude > 0) {
        add_krabby_patty();
    }

    platforms.forEach(function(item) {
        item.body.velocity.y = speed;
        item.body.acceleration.y = acceleration;
    }, this);

    jellyfishes.forEach(function(item) {
        item.body.velocity.y = speed;
        item.body.acceleration.y = acceleration;
    }, this);

    patties.forEach(function(item) {
        item.body.velocity.y = speed;
        item.body.acceleration.y = acceleration;
    }, this);

    console.log("The speed is " + speed.toString());

    // Exhaust the effect of krabby patties so
    // they don't last forever
    if (altitude > 0 && game.time.time % 14 === 0) {
        speed -= 30;
        // acceleration -= 30;
    }

    // Reset the player's horiz velocity (movement)
    player.body.velocity.x = 0;

    falling = (speed <= 0 && altitude > 0);

    if (falling) {
        player.animations.play('falling');
    } else {
        player.animations.play('standing');
    }

    if (cursors.left.isDown) {
        player.body.velocity.x = -PATRICK_VELOCITY_X;
        if (facing_right) {
            facing_right = false; 
            player.scale.x *= -1;
        }
    }
    else if (cursors.right.isDown) {
        player.body.velocity.x = PATRICK_VELOCITY_X;
        if (!facing_right) {
            facing_right = true; 
            player.scale.x *= -1;
        }
    }
    else {
        // stand still, no horiz movement
        // player.animations.stop();
        // player.frame = 4;
    }
    
    if (game.time.time % 30 === 0) {
        altitude_text.text = 'Altitude: ' + altitude.toString();
    }
}


function collect_patty(player, patty) {
    console.log("Patty has been consumed!");
    patty.kill();
    speed += 500;
}


function hit_jellyfish(player, jellyfish) {
    jellyfish.kill();
    console.log("HIT JELLYFISH");
}
