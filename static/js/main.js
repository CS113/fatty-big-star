// Static settings variables
var DEBUG = true,  // toggle this variable
    GAME_WIDTH = 800,
    GAME_HEIGHT = 600,
    GROUND_HEIGHT = 128,
    PATRICK_VELOCITY_X = 300,
    PATTY_SPEED_BOOST = 350,
    ENERGY_CAP = 500,
    GAME_TEXT = 'Lucida Grande',
    BLACK_HEX = '#000',
    GREEN_HEX = '#83F52C';

var game = new Phaser.Game(
        GAME_WIDTH,
        GAME_HEIGHT,
        Phaser.AUTO,
        'game_box',
        { preload: preload,
            create: create,
    update: update }
    );


// Load static assets
function preload() {
    game.load.image('ocean', 'static/imgs/undersea.jpg');
    game.load.image('black_bg', 'static/imgs/game_over.png');
    game.load.image('ground', 'static/imgs/platform.png');
    game.load.image('patty', 'static/imgs/patty.png');
    game.load.image('bubble', 'static/imgs/bubble.png');
    game.load.image('energy_bar', 'static/imgs/energy_bar.png');
    game.load.image('empty_energy_bar', 'static/imgs/empty_energy_bar.png');

    game.load.spritesheet('jellyfish', 'static/imgs/jellyfish_sprites.png', 29, 25);
    game.load.spritesheet('patrick', 'static/imgs/patrick_sprites.png', 45, 53);
    game.load.spritesheet('aura_good', 'static/imgs/powerup_sprite.png', 192, 192);
    game.load.spritesheet('shark', 'static/imgs/sharks.png', 103,45);
    game.load.spritesheet('squid', 'static/imgs/squidsheet.png', 49, 121);
    game.load.spritesheet('ink', 'static/imgs/ink.png', 600, 600);

    game.load.audio('background_music', ['static/sounds/485299_Underwater-Grotto-T.mp3']);
}


var _____,

    // Physics varaibles
    speed = 0,
    acceleration = 0,
    altitude = 0,
    energy = 0,
    patty_boost_timer = 0,

    // Entity groups
    player,
    platforms,
    patties,
    jellyfishes,
    cursors,
    bubbles,
    aura,
    sharks,
    energy_bar,
    inks,
    squids,

    // Text
    altitude_text,
    energy_text,


    //Timer,
    squid_timer,

    // Music
    bg_music,

    facing_right = true,

    // Time and interval variables
    starting_time,
    elapsed,
    milliseconds = 0,
    seconds = 0;


/*
 * Called on every game update(), updates the counters for
 * ingame seconds, elapsed time, and milliseconds. Important
 * because the time variables are used in game physics calculations.
 */
function update_timer() {
    seconds = Math.floor(game.time.time / 1000);
    milliseconds = Math.floor(game.time.time);
    elapsed = game.time.time - starting_time;
}


function create() {
    // Enable physics for in-game entities
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Add background sound
    bg_music = game.add.audio('background_music');
    if (!DEBUG) {
        bg_music.play();
    }

    // Add ocean background
    game.add.sprite(0, 0, 'ocean');

    platforms = game.add.group();
    // Enable physics for any object created in this group
    // Note that the sky has no physics enabled
    platforms.enableBody = true;
    // The first platform is just the ground
    var ground = platforms.create(
            0,
            game.world.height - GROUND_HEIGHT,
            'ground');

    // Scale it to fit the width of the game
    // (the original sprite is 400x32 in size)
    ground.scale.setTo(2, 4);

    // `body.immovable` set prevents movement after two
    // this object collides with another
    ground.body.immovable = true;

    // Add the main avatar, Patrick!
    player = game.add.sprite(
            game.world.width / 2,
            game.world.height - 150,
            'patrick');
    game.physics.arcade.enable(player);
    // player.body.bounce.y = 0.2;
    // player.body.gravity.y = 300;
    player.body.immovable = true;
    player.body.collideWorldBounds = true;
    player.animations.add('flying', [0, 1, 2], 15, true);
    player.animations.play('flying');
    player.anchor.setTo(0.5, 0.5);

    aura = game.add.sprite(50, 50, 'aura_good');
    aura.animations.add('revive', 
            [0, 1, 2, 3, 4, 5, 6, 7,
            8, 9, 10, 11, 12]);

    aura.scale.setTo(0.5, 0.5);
    aura.anchor.setTo(0.5, 0.5);
    aura.exists = false;

    jellyfishes = game.add.group();
    jellyfishes.enableBody = true;

    inks = game.add.group();
    inks.enableBody = true;

    squids = game.add.group();
    squids.enableBody = true;

    patties = game.add.group();
    patties.enableBody = true;

    sharks = game.add.group();
    sharks.enableBody = true;

    bubbles = game.add.group();
    bubbles.enableBody = true;

    // Initial patty on ground to give Patrick a boost
    var first_patty = patties.create(
            0.5 * game.world.width - 20,
            10, 
            'patty');
    first_patty.scale.setTo(0.4, 0.4);
    first_patty.body.gravity.y = 600;

    empty_energy_bar = game.add.sprite(game.width - (216 + 10), 10,
            'empty_energy_bar');
    empty_energy_bar.scale.setTo(1, 0.5);

    energy_bar = game.add.sprite(game.width - (216 + 10), 10,
            'energy_bar');
    energy_bar.scale.setTo(1, 0.5);

    altitude_text = game.add.text(
            10, 
            10,
            'Altitude: 0', 
            { font: '20px ' + GAME_TEXT,
                fill: BLACK_HEX }
            );

    energy_text = game.add.text(
            game.width - (212/2 + 20), 
            12,
            '0%', 
            { font: '11px ' + GAME_TEXT,
                fill: GREEN_HEX }
            );

    starting_time = game.time.time;
    elapsed = game.time.time - starting_time;

    // Controls
    cursors = game.input.keyboard.createCursorKeys();
}


function add_krabby_patty() {
    var patty = patties.create(
            Math.floor(Math.random() * game.world.width),
            0,
            'patty');
    patty.scale.setTo(0.4, 0.4);
}


/*
 * Some entities are different, we want to add them in groups
 * instead of randomlly spread out
 */
function add_grouped(entity_name) {
    var variance_mapping = {
        'bubble': 100,
        'jellyfish': 250
    };

    var max_jellyfish_group = 20;
    var max_bubble_group = 50;
    var max_group;

    /*Why not make this a dict?*/
    if (entity_name == 'bubble') {
        max_group = max_bubble_group;
    } else if (entity_name == 'jellyfish') {
        max_group = max_jellyfish_group;
    }

    var x_coord = Math.floor(Math.random() * game.world.width);
    var y_coord = 0;
    var n = Math.floor(4 + (Math.random() * max_group));

    for (var i = 0; i < n; i++) {
        var pos_neg = Math.random() <= 0.5 ? -1 : 1;
        var x_variance = pos_neg * Math.random() * variance_mapping[entity_name];
        var y_variance = -1 * Math.random() * variance_mapping[entity_name];
        // console.log(variance_mapping[entity_name]);
        /*Why not make this a dict?*/
        if (entity_name == 'bubble') {
            add_bubble(x_coord + x_variance,
                    y_coord + y_variance);
        } else if (entity_name == 'jellyfish') {
            add_jellyfish(x_coord + x_variance,
                    y_coord + y_variance);
        }
    }
}


function add_bubble(x_coord, y_coord) {
    var bubble = bubbles.create(x_coord, y_coord, 'bubble');

    bubble.body.bounce.y = 0.9 + Math.random() * 0.2;
    bubble.checkWorldBounds = true; 
    bubble.outOfBoundsKill = true;
    // rotate the bubble for a cool effect

    // bubbles should vary in size, but should be on the smaller
    // end because we have shitty sprites
    var size_variance = 0.1 + (Math.random() * 0.5);
    bubble.scale.setTo(size_variance, size_variance);
    bubble.angle = Math.floor(181 * Math.random());
}


function add_jellyfish(x_coord, y_coord) {
    var jelly = jellyfishes.create(x_coord, y_coord, 'jellyfish');

    jelly.body.bounce.y = 0.7 + Math.random() * 0.2;
    jelly.checkWorldBounds = true; 
    jelly.outOfBoundsKill = true;
    jelly.animations.add('swim', [0, 1, 2, 3], 12, true);
    jelly.animations.play('swim');
    jelly.oscl_coef = Math.random() * (100) + 200;
    jelly.x_speed = jelly.oscl_coef - 100;
    // Start each jellyfish at a random animation to look more real
    jelly.animations.currentAnim.frame = Math.floor(Math.random() * 3);
}


function add_shark() {
    var shark = sharks.create(
            0,
            Math.floor(Math.random() * game.world.height),
            'shark');
    shark.body.x = shark.body.x + 1;
    shark.checkWorldBounds = true; 
    shark.outOfBoundsKill = true;
    shark.animations.add('swim', [0, 1, 2], 12, true);
    shark.animations.play('swim');

    // Start each shark at a random animation to look more real
    shark.animations.currentAnim.frame = Math.floor(Math.random() * 2);
}


function add_ink() {
    var ink = inks.create(player.x-300, -200, 'ink');

    ink.checkWorldBounds = true;
    ink.outOfBoundsKill = true;
    ink.animations.add('show', [0] , 12, true);
    ink.animations.play('show');
}


function add_squid(x_coord, y_coord) {
    var squid = game.add.sprite(x_coord, y_coord, 'squid');
    squid.inputEnabled = true;

    squid.events.onInputDown.add(clicked, this);
    squid.events.onAddedToGroup.add(added_squid, this);
    squid.events.onOutOfBounds.add(squid_left, this);
    squids.add(squid);
    // var squid = squids.create(x_coord, y_coord, 'squid');
    squid.checkWorldBounds = true;
    // squid.angle = 90;
    squid.outOfBoundsKill = true;
    squid.animations.add('swim', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 12, true);
    squid.animations.play('swim');

}


function squid_left() {
    game.time.events.remove(squid_timer);
    squid_timer = undefined;
}

function clicked(sprite) {
    console.log("Clicked squid");
    sprite.destroy();
    game.time.events.remove(squid_timer);
    squid_timer = undefined;
}


function added_squid(){
    console.log("added a squid");
    if (squid_timer === undefined) {
        squid_timer = game.time.events.loop(
                Phaser.Timer.SECOND * 2.5 , add_ink, this);
    }

}


function numberWithCommas(n) {
    var parts=n.toString().split(".");
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
                            (parts[1] ? "." + parts[1] : "");
}


function update_physics() {
    // Update aura positions to patrick, this should be done elsewhere!
    aura.x = player.x;
    aura.y = player.y;

    platforms.forEach(function(item) {
        item.body.velocity.y = speed;
        item.body.acceleration.y = acceleration;
    }, this);

    jellyfishes.forEach(function(item) {
        item.body.velocity.x = item.x_speed;
        item.body.velocity.y = item.oscl_coef * Math.sin(game.time.now / 100) + speed;
    }, this);

    bubbles.forEach(function(item) {
        item.body.velocity.y = speed;
        item.body.acceleration.y = acceleration;
        item.angle = item.angle + ((Math.random() <= 0.5) ? 1 : -1);
    }, this);

    sharks.forEach(function(item) {
        item.body.velocity.x = speed;
        item.body.acceleration.x = acceleration;
        item.body.velocity.y = speed;
        item.body.acceleration.y = acceleration;
    }, this);

    patties.forEach(function(item) {
        // first patty has acceleration
        if (item.body.gravity.y === 0) {
            item.body.velocity.y = speed;
        }
        item.body.acceleration.y = acceleration;
    }, this);

    inks.forEach(function(item) {
        item.body.velocity.y = speed;
        item.body.acceleration.y = acceleration;
    }, this);

    squids.forEach(function(item) {
        item.body.velocity.y = (-0.1)*speed;
        item.body.acceleration.y = -acceleration;
        //console.log("Squid speed" + item.body.velocity.x);
    }, this);

    // Game over
    if (altitude < 0) {
        console.log("GAME OVER!"); 
        game_over();
        // lmfao .. we lazy
        window.location.reload();
    }

    // Exhaust effect of patties so they don't last forever
    if (energy > 0) {
        speed = 400;
        if (patty_boost_timer > 0) {
            speed = speed + PATTY_SPEED_BOOST;
            //acceleration += PATTY_SPEED_BOOST;
            patty_boost_timer--;
        }
        energy--;
    } else if (altitude > 0) {
        speed -= 30;
    }

    altitude += Math.floor(speed * (1/60));

    // Reset the player's horiz velocity (movement)
    player.body.velocity.x = 0;
}


/*
 * IMPORTANT: Because the update function's contents vary in
 * functionality and depend on each other, the separate functions
 * must be divided in sequences.
 *
 * 1. Update all game clocks
 * 2. Check for all collisions
 * 3. Insert or delete entities
 * 4. Update physics
 * 5. Update user inputs
 * 7. Update text & counters
 */
function update() {
    // ================================
    // ==== Update all game clocks ====
    // ================================
    update_timer();

    // ==============================
    // ==== Check for collisions ====
    // ==============================
    game.physics.arcade.collide(jellyfishes, platforms);
    game.physics.arcade.collide(patties, platforms);
    game.physics.arcade.collide(player,
            patties,
            collect_patty,
            null,
            this);
    game.physics.arcade.overlap(player,
            jellyfishes,
            hit_jellyfish,
            null,
            this);

    // ===============================
    // ==== Add & delete entities ====
    // ===============================

    if (game.time.time %
            (50 + Math.floor(Math.random() * 100)) === 0 && altitude > 0) {
                add_grouped('jellyfish');
            }

    if (game.time.time % 15 === 0 && altitude > 0) {
        add_krabby_patty();
    }

    if (game.time.time % 100 === 0 && altitude > 0) {
        add_shark();
    }

    if (altitude % 5400 === 0  && altitude > 999) {
        add_squid(50 + Math.floor(Math.random() * 650), 600);
    }

    if (game.time.time %
            (10 + Math.floor(Math.random() * 65)) === 0 && altitude > 0) {
                add_grouped('bubble');
            }

    // ==================
    // ===== Physics ====
    // ==================

    update_physics();

    // ====================
    // ==== Controller ====
    // ====================

    var falling = (speed <= 0 && altitude > 0);
    var flying = (altitude > 0); 

    if (flying) {
        player.animations.play('flying');
    } else {
        player.animations.stop();
    }

    if (cursors.left.isDown) {
        player.body.velocity.x = -PATRICK_VELOCITY_X;
        if (facing_right) {
            facing_right = false; 
            player.scale.x *= -1;
        }
    } else if (cursors.right.isDown) {
        player.body.velocity.x = PATRICK_VELOCITY_X;
        if (!facing_right) {
            facing_right = true; 
            player.scale.x *= -1;
        }
    } else if (!flying) {
        // stand still, no horiz movement
        player.animations.stop();
        player.frame = 2;
    }

    // ===========================
    // ==== Text and counters ====
    // ===========================
    if (game.time.time % 4 === 0) {
        altitude_as_string = numberWithCommas(altitude);
        altitude_text.text = 'Altitude: ' + altitude_as_string;

        var energy_percent = Math.floor(
                (energy / ENERGY_CAP) * 100).toString() + "%";
        energy_text.text = energy_percent;

        if (DEBUG) {
            console.log(
                    '<DEBUG>: Speed: ' + speed.toString() +
                    ', Energy: ' + energy.toString());
            console.log(energy_percent);
        }
    }

    energy_bar.width = (energy / ENERGY_CAP) * 212;
}


function collect_patty(player, patty) {
    patty.kill();

    aura.reset(player.x, player.y);
    aura.play('revive', 60, false, true);

    energy += 100;
    energy = Math.min(energy, ENERGY_CAP);

    patty_boost_timer = 15;
}


function hit_jellyfish(player, jellyfish) {
    jellyfish.kill();
    // TODO:
}


function game_over() {
    game.add.sprite(0, 0, 'black_bg'); 
    var game_over_text = game.add.text(
            game.width / 2 - 100, 
            game.height/2,
            'GAME OVER', 
            { font: '40px ' + GAME_TEXT,
                fill: '#FFF' }
            );
}
