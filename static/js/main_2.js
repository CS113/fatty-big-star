// Static settings variables
var DEBUG = true,
    GAME_WIDTH = 800,
    GAME_HEIGHT = 600,
    GROUND_HEIGHT = 128,
    SOUND_BUTTON_WIDTH = 25,
    PATRICK_VELOCITY_X = 400,
    PATRICK_VELOCITY_Y_PATTY = 300,
    PATRICK_VELOCITY_Y_GRAVITY_LOSS = 30,
    PATTY_ENERGY_BOOST = 30,
    PATTY_BOOST_DURATION = 7,
    FIRST_PATTY_ENERGY_BOOST = 175,
    FISHING_HOOK_TIMER = 100;
    PATTY_SPEED_BOOST = 375,
    HOOK_SPEED_BOOST = 500,
    ENERGY_CAP = 500,
    SHIELD_HEALTH = 5,
    ALTITUDE_CHUNK = 4000,
    ALTITUDE_SPEED_INCREASE_RATE = 1 / 60,
    SPEED_GAME_LOSS_THRESHHOLD = -1200,
    PATTY_LIMBO_HEIGHT = 200,
    GAME_TEXT = 'Lucida Grande',
    BLACK_HEX = '#000',
    GREEN_HEX = '#5DFC0A',
    COOKIE_USERNAME_KEY = 'fatty_big_star_username',
    COOKIE_EXPIRATION_DAYS = 7;

var game = new Phaser.Game(
        GAME_WIDTH,
        GAME_HEIGHT,
        Phaser.AUTO,
        'game_box',
        {
            preload: preload,
            create: create,
            update: update
        }
);

var DIPLOMACY = {
    OBSTACLE: 0,
    POWERUP: 1,
    NEUTRAL: 2
};

var entity_spawn_map = {
    'bubble': {
        // all rates are in seconds
        spawn_rate: Phaser.Timer.SECOND * 0.1,
        spawn_timer: null,
        spawn_timer_params: [add_grouped, this, 'bubble'],
        diplomacy: DIPLOMACY.NEUTRAL
    },
    'patty': {
        spawn_rate: Phaser.Timer.SECOND * 0.5,
        spawn_timer: null,
        spawn_timer_params: [add_patty_group, this],
        RATE_CAP: Phaser.Timer.SECOND * 2,
        diplomacy: DIPLOMACY.POWERUP
    },
    'jellyfish': {
        spawn_rate: Phaser.Timer.SECOND * 2.5,
        spawn_timer: null,
        spawn_timer_params: [add_grouped, this, 'jellyfish'],
        RATE_CAP: Phaser.Timer.SECOND * 1.5,
        diplomacy: DIPLOMACY.OBSTACLE
    },
    'shark': {
        spawn_rate: Phaser.Timer.SECOND * 3.5,
        spawn_timer: null,
        spawn_timer_params: [add_shark, this],
        RATE_CAP: Phaser.Timer.SECOND * 2,
        diplomacy: DIPLOMACY.OBSTACLE
    },
    'clam': {
        spawn_rate: Phaser.Timer.SECOND * 2,
        spawn_timer: null,
        spawn_timer_params: [add_clam, this],
        RATE_CAP: Phaser.Timer.SECOND * 2,
        diplomacy: DIPLOMACY.OBSTACLE
    },
    'squid': {
        spawn_rate: Phaser.Timer.SECOND * 13,
        spawn_timer: null,
        spawn_timer_params: [add_squid, this],
        RATE_CAP: Phaser.Timer.SECOND * 7,
        diplomacy: DIPLOMACY.OBSTACLE
    },
    'shield': {
        spawn_rate: Phaser.Timer.SECOND * 5,
        spawn_timer: null,
        spawn_timer_params: [add_bubble_shield, this],
        RATE_CAP: Phaser.Timer.SECOND * 15,
        diplomacy: DIPLOMACY.POWERUP
    },
    'hook': {
        spawn_rate: Phaser.Timer.SECOND * 3,
        spawn_timer: null,
        spawn_timer_params: [add_fishing_hook, this],
        RATE_CAP: Phaser.Timer.SECOND * 15,
        diplomacy: DIPLOMACY.POWERUP
    }
};


function preload() {
    game.load.image('ocean', 'static/imgs/undersea.jpg');
    game.load.image('black_bg', 'static/imgs/game_over.png');
    game.load.image('ground', 'static/imgs/platform.png');
    game.load.image('coral_ledge', 'static/imgs/coral_ledge.png');
    game.load.image('coral_side', 'static/imgs/coral_side.png');
    game.load.spritesheet('coral', 'static/imgs/coral_sprite.png', 300, 208);
    game.load.spritesheet('seaweed', 'static/imgs/seaweed_sprite.png', 48, 60);

    game.load.spritesheet('patrick', 'static/imgs/patrick_sprites.png', 46, 54);
    game.load.image('patty', 'static/imgs/patty.png');
    game.load.image('bubble', 'static/imgs/bubble.png');
	game.load.image('clam', 'static/imgs/clam.png');
    game.load.spritesheet('shark', 'static/imgs/sharks.png', 103,45);
    game.load.spritesheet('squid', 'static/imgs/squidsheet.png', 49, 121);
    game.load.spritesheet('ink', 'static/imgs/ink.png', 600, 600);
    game.load.spritesheet('jellyfish', 'static/imgs/jellyfish_sprites.png', 29, 25);
    game.load.image('hook', 'static/imgs/hook_sprite.png');

    game.load.spritesheet('aura_good', 'static/imgs/powerup_sprite.png', 192, 192);
    game.load.image('golden_bubble', 'static/imgs/golden_bubble.png');
    game.load.image('energy_bar', 'static/imgs/energy_bar.png');
    game.load.image('empty_energy_bar', 'static/imgs/empty_energy_bar.png');

    game.load.image('sound_off_button', 'static/imgs/turn_off_sound.png');
    game.load.image('sound_on_button', 'static/imgs/turn_on_sound.png');

    game.load.audio('hurt', ['static/sounds/hurt.mp3']);
    game.load.audio('pop', ['static/sounds/pop.mp3']);
    game.load.audio('hit', ['static/sounds/enhance.mp3']);
    game.load.audio('splat', ['static/sounds/splat.mp3']);
    game.load.audio('intro_gong', ['static/sounds/intro_gong.mp3']);
    game.load.audio('whoosh', ['static/sounds/whoosh.mp3']);
    game.load.audio('happy_bg', ['static/sounds/happy.mp3']);
}


var _____,

    // Physics varaibles
    speed = 0,
    acceleration = 0,
    altitude = 0,
    energy = 0,
    patty_boost_timer = 0,
    altitude_checkmark = ALTITUDE_CHUNK,
    final_altitude = 0,

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
    clams,
    corals,
    seaweeds,
    bubble_shields,  // powerups falling down
    shield,          // after acquiring the powerup, displayed on Patrick
    // only one fishing hook can be on screen at a time
    // after a hook is acquired, until it's used up, no new hooks will be
    // spawned
    fishing_hooks,   // similar to `bubble_shields`
    hook,            // similar to `shield`
    // fishing hook entities are special because they need
    // to have an auxilary fishing line drawn on top of them
    fishing_hook_line, 
    hook_line_sprite,

    // Text
    altitude_text,
    energy_text,
    press_space_blink_text,

    // Timer,
    squid_timer,
    hook_timer = 0,   // fishing hook duration timer

    // Music
    sounds,

    // Flags
    facing_right = true,
    game_ended = false,
    set_spawn_timers = false,
    shield_life = 0;  // bubble shields can soak 5 hits


/*
 * NOTE: Sprites are rendered in the order in which their
 * objects or groups are declared, e.g., `inks` is intentionally
 * at the very end because we want the ink to be displayed over
 * other other entities. Redeclaring an object or group will
 * effectively bring that sprite back to the top.
 */
function create() {
    sounds = {
        pop: game.add.audio('pop'),              // shark enters
        hurt: game.add.audio('hurt'),            // hit by obstacle
        splat: game.add.audio('splat'),          // ink on screen
        hit: game.add.audio('hit', 0.7),         // hit shield
        intro: game.add.audio('intro_gong', 0.4),
        whoosh: game.add.audio('whoosh', 0.2),   // hit patty
        happy_bg: game.add.audio('happy_bg', 0.3, true),
    };

    sounds.intro.play();
    sounds.happy_bg.play();

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.add.sprite(0, 0, 'ocean');

    platforms = game.add.group();
    platforms.enableBody = true;
    var ground = platforms.create(
                        0,
                        game.world.height - GROUND_HEIGHT,
                        'ground');

    // Scale ground to fit the width of the game
    ground.scale.setTo(2, 4);

    // `body.immovable` set prevents movement after collisions
    ground.body.immovable = true;

    player = game.add.sprite(
                game.world.width / 2,
                game.world.height - 150,
                'patrick');
    game.physics.arcade.enable(player);
    player.body.immovable = true;
    player.body.collideWorldBounds = true;

    player.animations.add('swimming',
                          [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                          60,
                          true);
    player.animations.add('falling',
                          [11, 12, 13],
                          30,
                          true);
    player.animations.add('walking',
                          [14, 15, 16, 17, 18, 19, 20, 21, 22],
                          25,
                          true);

    player.animations.play('swimming');
    player.anchor.setTo(0.5, 0.5);

    aura = game.add.sprite(50, 50, 'aura_good');
    aura.animations.add('revive', 
                        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    aura.scale.setTo(0.5, 0.5);
    aura.anchor.setTo(0.5, 0.5);
    aura.exists = false;

    shield = game.add.sprite(0, 0, 'golden_bubble');
    shield.exists = false;
    shield.scale.setTo(0.43, 0.43);
    shield.anchor.setTo(0.43, 0.43);

    hook = game.add.sprite(0, 0, 'hook');
    hook.exists = false;
    hook.scale.setTo(0.075, 0.075);

    fishing_hook_line = game.add.bitmapData(
                            game.world.width,
                            game.world.height);
    hook_line_sprite = game.add.sprite(0, 0, fishing_hook_line);

    jellyfishes = game.add.group();
    jellyfishes.enableBody = true;

    squids = game.add.group();
    squids.enableBody = true;

    patties = game.add.group();
    patties.enableBody = true;

    sharks = game.add.group();
    sharks.enableBody = true;

    bubbles = game.add.group();
    bubbles.enableBody = true;

    inks = game.add.group();
    inks.enableBody = true;
	
    clams = game.add.group();
    clams.enableBody = true;

    seaweeds = game.add.group();
    seaweeds.enableBody = true;

    corals = game.add.group();
    corals.enableBody = true;
	
    bubble_shields = game.add.group();
    bubble_shields.enableBody = true;

    fishing_hooks = game.add.group();
    fishing_hooks.enableBody = true;

    // ===== Initial background scenery =====
    var scenery_y_base = game.world.height - GROUND_HEIGHT - 170;

    var coral_ledge = platforms.create(0,
                                       scenery_y_base,
                                       'coral_ledge');
    coral_ledge.scale.setTo(0.5, 0.5);
    var coral_ledge_2 = platforms.create(game.width + 110,
                                         scenery_y_base - 50,
                                         'coral_ledge');
    coral_ledge_2.scale.setTo(0.7, 0.7);
    coral_ledge_2.scale.x *= -1; 

    var init_sw_1 = seaweeds.create(150, scenery_y_base + 120, 'seaweed');
    var init_sw_2 = seaweeds.create(550, scenery_y_base + 200, 'seaweed');
    init_sw_1.animations.add('flapping', [0, 1, 2], 4, true);
    init_sw_2.animations.add('flapping', [2, 1, 0], 3, true);
    init_sw_1.play('flapping');
    init_sw_2.play('flapping');

    var coral_1 = corals.create(150, scenery_y_base + 225, 'coral');
    coral_1.animations.add('flapping', [0, 1, 2, 3], 8, true);
    coral_1.scale.setTo(0.2, 0.2);
    coral_1.play('flapping');

    var coral_2 = corals.create(600, scenery_y_base + 120, 'coral');
    coral_2.animations.add('flapping', [3, 4, 0, 1], 10, true);
    coral_2.scale.setTo(0.4, 0.4);
    coral_2.play('flapping');

    var coral_3 = corals.create(550, scenery_y_base + 130, 'coral');
    coral_3.animations.add('flapping', [2, 1, 3, 0], 6, true);
    coral_3.scale.setTo(0.3, 0.3);
    coral_3.play('flapping');

    // initial patty on ground to give Patrick a boost
    var first_patty = patties.create(
            0.5 * game.world.width - 20,
            10, 
            'patty');
    first_patty.scale.setTo(0.4, 0.4);
    first_patty.body.gravity.y = 600;
    first_patty.is_first = true;
	
    // ===== Buttons & controls seperate from game world =====
    add_sound_control_button();
	
    empty_energy_bar = game.add.sprite(game.width - (216 + 10),
                                       10,
                                       'empty_energy_bar');
    empty_energy_bar.scale.setTo(1, 0.5);
    energy_bar = game.add.sprite(game.width - (216 + 10),
                                 10,
                                 'energy_bar');
    energy_bar.scale.setTo(1, 0.5);

    altitude_text = game.add.text(
                        10, 
                        10,
                        'Altitude: 0', 
                        { 
                            font: '20px ' + GAME_TEXT,
                            fill: GREEN_HEX
                        }
    );

    energy_text = game.add.text(
            game.width - (212/2 + 20), 
            12,
            '0%', 
            { 
                font: '11px ' + GAME_TEXT,
                fill: GREEN_HEX
            }
    );

    cursors = game.input.keyboard.createCursorKeys();
}


function add_sound_control_button() {
    function sound_off() {
        // TODO: turn ALL sounds off in the dict
        // sounds.bg_music.volume = 0;
        sound_off_button.width = 0;
        sound_on_button.width = SOUND_BUTTON_WIDTH;
    }
    function sound_on() {
        // sounds.bg_music.volume = 1;
        sound_off_button.width = SOUND_BUTTON_WIDTH;
        sound_on_button.width = 0;
    }

    sound_off_button = game.add.sprite(
                        game.width - 50, 40, 'sound_off_button');
    sound_off_button.width = SOUND_BUTTON_WIDTH;
    sound_off_button.height = SOUND_BUTTON_WIDTH;
	
    sound_on_button = game.add.sprite(
                        game.width - 50, 40, 'sound_on_button');
    sound_on_button.width = 0;
    sound_on_button.height = SOUND_BUTTON_WIDTH;

    sound_off_button.inputEnabled = true;
    sound_on_button.inputEnabled = true;

    sound_off_button.events.onInputDown.add(sound_off, this);
    sound_on_button.events.onInputDown.add(sound_on, this);
}


/*
 * This function toggles the rate of which the spawn rate method
 * for each entity is called. The rate is based on altitude.
 *
 * Every 4000 altitude, the game gets 'harder', powerups and patties
 * are spawned rarer while obstacles are spawned more frequently
 * This # was chosen b/c 4000 altitude gets traversed every few seconds
 */
function set_spawn_rates() {
    var entity_names = Object.keys(entity_spawn_map);

    if (altitude < altitude_checkmark) {
        if (set_spawn_timers) {
            return;
        }
        // init the spawn timer only after patrick begins going up
        if (altitude > 0) {
            // set spawn timers after altitude passes 0
            for (var i = 0; i < entity_names.length; i++) {
                var entity = entity_spawn_map[entity_names[i]];
                if (entity.spawn_timer === null) {
                    var params = entity.spawn_timer_params;
                    params.unshift(entity.spawn_rate);
                    entity.spawn_timer =
                        game.time.events.loop.apply(
                            game.time.events, params);
                }
            }
            set_spawn_timers = true;
        }
        return;
    }

    altitude_checkmark += ALTITUDE_CHUNK;

    for (var i = 0; i < entity_names.length; i++) {
        var entity = entity_spawn_map[entity_names[i]];
        // update the spawn rate based on altitude
        var rate_delta = Phaser.Timer.SECOND * 0.25;
        if (entity.diplomacy === DIPLOMACY.OBSTACLE) {
            // obstacles get more frequent
            entity.spawn_rate = Math.max(
                entity.spawn_rate - rate_delta, entity.RATE_CAP);
            entity.spawn_timer.delay = entity.spawn_rate;
        }
        else if (entity.diplomacy === DIPLOMACY.POWERUP) {
            // powerups start at a high rate and lose frequency
            entity.spawn_rate = Math.min(
                entity.spawn_rate + rate_delta, entity.RATE_CAP);
            entity.spawn_timer.delay = entity.spawn_rate;
        }
        else if (entity.diplomacy === DIPLOMACY.NEUTRAL) {
            // do nothing
        }
    }
}


/*
 * Inputs a number and returns the same number but
 * with a little subtracted or added to it. "A little"
 * here means a small percentage of the number itself
 */
function fuzz_number(number) {
    var percentage_num = Math.ceil(number * 0.30);
    var rand_coeff = Math.random() * percentage_num;
    if (Math.random() > 0.5) {
        rand_coeff *= -1;
    }
    return Math.ceil(number + rand_coeff);
}


function add_patty(x, y) {
    var patty = patties.create(x, y, 'patty');
    patty.scale.setTo(0.35, 0.35);
    return patty;
}


function add_varied_patties(n) {
    var variance = 50;
    var x_start = Math.floor(Math.random() * (
                game.world.width - variance));
    var y_coord = 0;

    for (var i = 0; i < n; ++i) {
        var x_coord = Math.floor(x_start +
                variance * (2 * Math.random() - 1));
        var patty = add_patty(x_coord, y_coord);
        y_coord -= patty.height +
            Math.floor(Math.random() * 2 * variance);
    }
}


function add_step_patties(n) {
    var x_step = 60;
    var y_step = 90;

    var x_start = Math.floor(Math.random() * game.world.width);
    var y_start = 0;

    var x_dir = (Math.random() < 0.5) ? -1 : 1;

    for (var i = 0; i < n; ++i) {
        var x_coord = x_start + x_step * i * x_dir;
        var y_coord = y_start - y_step * i;
        add_patty(x_coord, y_coord);
    }
}


/*
 * Group has a random center and start
 * coords and number of individual patties are varied
 *
 * As the game gets harder (higher altitude) instead of
 * spawning fewer patties per "group", we will spawn fewer
 * groups but maintain the same number of patties per group
 * so `range_patties` and `offset` remain the same
 */
function add_patty_group() {
	var range_patties = 7;
	var offset = 3;

    var patterns = [add_varied_patties, add_step_patties];
	var num_patties = offset + Math.floor(Math.random() * range_patties);
	var pat = Math.floor(Math.random() * patterns.length);
	patterns[pat](num_patties);
}


/*
 * Some entities are different, we want to add them in groups
 * instead of randomlly spread out
 * TODO: Delete this method, it's getting too clunky..
 */
function add_grouped(entity_name) {
    var variance_mapping = {
        'bubble': 100,
        'jellyfish': 180
    };
    var spawn_mapping = {
        'bubble': add_bubble,
        'jellyfish': add_jellyfish
    };
    var max_mapping = {
        'bubble': 50,
        'jellyfish': 15
    };

    var x_coord = Math.floor(Math.random() * game.world.width);
    var y_coord = 0;
	var direction = 1;

    if (entity_name == 'jellyfish') {
        var dice_roll = Math.random() < 0.5;
        x_coord = dice_roll < 0.5 ? 0 : game.world.width - 1;
        direction = x_coord === 0 ? 1 : -1; 
    }

    var n = Math.floor(4 + (Math.random() * max_mapping[entity_name]));
    for (var i = 0; i < n; i++) {
        var pos_neg = Math.random() <= 0.5 ? -1 : 1;
        var x_variance = pos_neg * Math.random() *
                            variance_mapping[entity_name];
        var y_variance = -1 * Math.random() *
                            variance_mapping[entity_name];

        spawn_mapping[entity_name](
            x_coord + x_variance,
            y_coord + y_variance,
            direction);
    }
}


function add_bubble(x_coord, y_coord, direction) {
    var bubble = bubbles.create(x_coord, y_coord, 'bubble');

    bubble.body.bounce.y = 0.9 + Math.random() * 0.2;
    bubble.checkWorldBounds = true; 
    bubble.outOfBoundsKill = true;
    // bubbles should vary in size, but should be on the smaller
    // end because we have shitty sprites
    var size_variance = 0.1 + (Math.random() * 0.5);
    bubble.scale.setTo(size_variance, size_variance);
    // rotate the bubble for a cool effect
    bubble.angle = Math.floor(181 * Math.random());
}


function add_jellyfish(x_coord, y_coord, direction) {
    var jelly = jellyfishes.create(x_coord, y_coord, 'jellyfish');

    jelly.body.bounce.y = 0.7 + Math.random() * 0.2;
    jelly.animations.add('swim', [0, 1, 2, 3], 12, true);
    jelly.animations.play('swim');
    jelly.oscl_coef = (Math.random() * (200) + 200) * direction;

	if (direction > 0) {
		jelly.x_speed = (jelly.oscl_coef - 100);
	} else {
		jelly.x_speed = (jelly.oscl_coef + 100);
	}	

    // Start each jellyfish at a random animation to look more real
    jelly.animations.currentAnim.frame = Math.floor(Math.random() * 3);
}


function add_shark() {
    sounds.pop.play();

    var y_coord = 300;
    var coin = (Math.random() <= 0.5) ? -1 : 1;
    var x_coord = (coin === -1) ? game.world.width : 0;
	var shark = sharks.create(x_coord, y_coord, 'shark');

    shark.anchor.setTo(0.5, 1);
    shark.scale.x = coin;
	shark.side = coin;		
    shark.checkWorldBounds = true; 
    shark.outOfBoundsKill = true;
    shark.animations.add('swim', [0, 1, 2], 12, true);
    shark.animations.play('swim');

    shark.animations.currentAnim.frame = 
                        Math.floor(Math.random() * 2);
}


function add_clam() {
    var clam = clams.create(player.x - 22.8, 0, 'clam');
    clam.scale.setTo(0.4, 0.4);
    clam.checkWorldBounds = true;
    clam.outOfBoundsKill = true;
    clam.angle = Math.floor(181 * Math.random());

    // rotate clams at random rates and directions
    clam.rotate_dir = (Math.random() < 0.5) ? 1 : -1;
    clam.rotate_rate = Math.ceil(1 + (Math.random() * 4));
}


function add_bubble_shield() {
    var shield = bubble_shields.create(
                    Math.random() * game.world.width,
                    0,
                    'golden_bubble');
    shield.checkWorldBounds = true;
    shield.outOfBoundsKill = true;
    shield.scale.setTo(0.43, 0.43);
}


function add_fishing_hook() {
    // this is really hacky .. and a terrible example on how
    // to implement the feature of "only having one entity
    // at a time", this was done because our demo day is soon
    if (hook_timer) {
        return;
    }
    var fhook = fishing_hooks.create(
                    Math.random() * game.world.width,
                    0,
                    'hook');
    fhook.scale.setTo(0.075, 0.075);
}


// draws lines for any given fishing hooks on screen
function add_fishing_hook_line(hook) {
    fishing_hook_line.clear();
    fishing_hook_line.ctx.strokeStyle = 'white';
    fishing_hook_line.ctx.beginPath();
    fishing_hook_line.ctx.moveTo(hook.x + 40, 0);
    fishing_hook_line.ctx.lineTo(hook.x + 40, hook.y + 15);
    fishing_hook_line.ctx.lineWidth = 2;
    fishing_hook_line.ctx.stroke();
    fishing_hook_line.ctx.closePath();

    fishing_hook_line.render();
    fishing_hook_line.refreshBuffer(); 
}


// for simplicity, only one line is to exist at once: this is
// because only one fishing hook will exist at once. instead of
// removing the line via bitmapdata, we redraw it as nothing
function remove_fishing_hook_line() {
    fishing_hook_line.clear();
    fishing_hook_line.ctx.strokeStyle = 'white';
    fishing_hook_line.ctx.beginPath();
    fishing_hook_line.ctx.moveTo(0, 0);
    fishing_hook_line.ctx.lineTo(0, 0);
    fishing_hook_line.ctx.lineWidth = 2;
    fishing_hook_line.ctx.stroke();
    fishing_hook_line.ctx.closePath();

    fishing_hook_line.render();
    fishing_hook_line.refreshBuffer(); 
}


function add_squid() {
    function add_ink() {
        sounds.splat.play();
        var ink = inks.create(player.x - 300, -200, 'ink');
        ink.checkWorldBounds = true;
        ink.outOfBoundsKill = true;
        ink.animations.add('show', [0] , 12, true);
        ink.animations.play('show');
    }
    function squid_left() {
        game.time.events.remove(squid_timer);
        squid_timer = undefined;
    }
    function clicked(sprite) {
        sprite.destroy();
        game.time.events.remove(squid_timer);
        squid_timer = undefined;
    }
    function added_squid() {
        if (squid_timer === undefined) {
            squid_timer = game.time.events.loop(
                Phaser.Timer.SECOND * 2.5 , add_ink, this);
        }
    }

    var squid = game.add.sprite(
                    50 + Math.floor(Math.random() * 650),
                    600,
                    'squid');
    squid.inputEnabled = true;
    squid.events.onInputDown.add(clicked, this);
    squid.events.onAddedToGroup.add(added_squid, this);
    squid.events.onOutOfBounds.add(squid_left, this);

    squids.add(squid);

    squid.checkWorldBounds = true;
    squid.outOfBoundsKill = true;
    squid.animations.add('swim',
                         [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                         12,
                         true);
    squid.animations.play('swim');
}


function numberWithCommas(n) {
    var parts=n.toString().split(".");
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
                            (parts[1] ? "." + parts[1] : "");
}


function update_physics() {
    aura.x = player.x;
    aura.y = player.y;

    shield.x = player.x;
    shield.y = player.y;

    hook.x = player.x - 23;
    hook.y = player.y - 53;

    hook.exists = (hook_timer > 0) ? true : false;
    shield.exists = (shield_life > 0) ? true : false;
	
    platforms.forEach(function(item) {
        item.body.velocity.y = speed;
        item.body.acceleration.y = acceleration;
    }, this);

    jellyfishes.forEach(function(item) {
        item.body.velocity.x = item.x_speed;
        item.body.velocity.y = item.oscl_coef *
                                Math.sin(game.time.now / 100) + speed;
    }, this);

    for (var i = 0; i < jellyfishes.length; i++) {
        var item = jellyfishes.getChildAt(i);
        if (item.body.y > (game.world.height)) {
            item.destroy();
            i--;
        }
    }

    bubbles.forEach(function(item) {
        if (game_ended) {
            item.body.velocity.y = 120;
        } else {
            item.body.velocity.y = speed;
        }
        item.body.acceleration.y = acceleration;
        item.angle = item.angle + ((Math.random() <= 0.5) ? 1 : -1);
    }, this);

    sharks.forEach(function(item) {
        item.body.velocity.x = 700 * item.side;
        item.body.acceleration.x = 1000 * item.side;
        if (speed < 0 || acceleration < 0) {
            item.body.acceleration.y = -500;
            item.body.velocity.y = -500;
        } else {
            item.body.velocity.y = 0;
            item.body.acceleration.y = 0;
        }
    }, this);

    patties.forEach(function(item) {
        // first patty has acceleration
        if (item.body.gravity.y === 0) {
            item.body.velocity.y = speed;
        }
        item.body.acceleration.y = acceleration;
    }, this);

    // we handle garbage collecting our own patties
    // instead using phaser's "outOfWorldBoundsKill"
    // service because we spawn patties above the top
    // of the game window to generate patterns
    for (var i = 0; i < patties.length; i++) {
        var item = patties.getChildAt(i);
        if (item.body.y > 
                (game.world.height + PATTY_LIMBO_HEIGHT)) {
            item.destroy();
            i--;
        }
    }

    inks.forEach(function(item) {
        item.body.velocity.y = speed;
        item.body.acceleration.y = acceleration;
    }, this);

    clams.forEach(function(item) {
        item.body.velocity.y = speed * 2;
        item.body.acceleration.y = acceleration;
        if (speed < 0 || acceleration < 0) {
            item.body.velocity.y = PATRICK_VELOCITY_Y_PATTY;
            item.body.acceleration.y = 200;
            item.body.gravity.y = 150;
        }
        item.angle += (item.rotate_rate * item.rotate_dir);
    }, this);	

    seaweeds.forEach(function(item) {
        item.body.velocity.y = speed;
        item.body.acceleration.x = acceleration;
    }, this);

    corals.forEach(function(item) {
        item.body.velocity.y = speed;
        item.body.acceleration.x = acceleration;
    }, this);

    bubble_shields.forEach(function(item) {
        item.body.velocity.y = speed * 1.5;
        item.body.acceleration.y = acceleration;
        item.body.gravity.y = 150;
        if (speed < 0 || acceleration < 0) {
            item.body.velocity.y = PATRICK_VELOCITY_Y_PATTY;
            item.body.acceleration.y = 200;
            item.body.gravity.y = 150;
        }
    }, this);
	
    ////////////////////////////////////////////////////////////////////////
    ////////////// fishing hook & line code is really hacky ////////////////
    ////////////////////////////////////////////////////////////////////////
    
    fishing_hooks.forEach(function(item) {
        item.body.velocity.y = speed;
        item.body.acceleration.y = acceleration;
        item.body.gravity.y = 150;
        if (speed < 0 || acceleration < 0) {
            item.body.velocity.y = PATRICK_VELOCITY_Y_PATTY;
            item.body.acceleration.y = 200;
            item.body.gravity.y = 150;
        }
    }, this);

    // manual fishing hook garbage collection
    for (var i = 0; i < fishing_hooks.length; i++) {
        var item = fishing_hooks.getChildAt(i);
        if (item.body.y > game.world.height) {
            item.destroy();
            i--;
        }
    }

    if (fishing_hooks.length == 1) {
        var hookOnScreen = fishing_hooks.getChildAt(0);
        add_fishing_hook_line(hookOnScreen);
    }
    else if (hook_timer > 0) {
        add_fishing_hook_line(hook);
    }
    else if (fishing_hooks.length == 0 && hook_timer == 0) {
        remove_fishing_hook_line();
    }
    else {
        console.log('ERROR: There should only be ' +
                    'one hook onscreen at a time');
    }

    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    squids.forEach(function(item) {
        // Fix squid physics effect. Squids are unique because they 
        // are naturally floating upwards, not downwards.

        // If our speed is negative (falling) the squid should quickly
        // zoom up, not the before action (fall down slowly)
        var speed_coeff = -0.1;
        if (speed < 0) {
            speed_coeff = 1;
        }
        item.body.velocity.y = speed_coeff * speed;
    }, this);


    // console.log(patties.length + " " + jellyfishes.length + " " + bubble_shields.length + " " + clams.length + " " + bubbles.length + " " + sharks.length);


    // Game over when Patrick has been falling for a little bit
    // Safe assumption because all entities are killed after
    // they fall off the map, Patrick has no way of getting up
    if ((speed < SPEED_GAME_LOSS_THRESHHOLD || altitude < 0) && !game_ended) {
        game_over();
    }

    // Exhaust effect of patties so they don't last forever
    if (energy > 0 || hook_timer > 0) {
        speed = PATRICK_VELOCITY_Y_PATTY;
        if (patty_boost_timer > 0) {
            speed += PATTY_SPEED_BOOST;
            patty_boost_timer--;
        }
        // hook speed boosts are seperate from patties and energy
        if (hook_timer > 0) {
            speed += HOOK_SPEED_BOOST;
            hook_timer--;
        }
        energy--;
    }
    else if (altitude > 0) {
        speed -= PATRICK_VELOCITY_Y_GRAVITY_LOSS;
    }

    if (speed > 0) {
        altitude += Math.floor(speed * ALTITUDE_SPEED_INCREASE_RATE);
    }

    // Reset the player's horiz velocity (movement)
    player.body.velocity.x = 0;
}


function update() {
    // ==========================
    // ==== Check collisions ====
    // ==========================

    game.physics.arcade.collide(clams, platforms);
    game.physics.arcade.collide(jellyfishes, platforms);
    game.physics.arcade.collide(patties, platforms);
    game.physics.arcade.collide(
        player,
        patties,
        hit_patty,
        null,
        this
    );
    game.physics.arcade.overlap(
        player,
        jellyfishes,
        hit_jellyfish,
        null,
        this
    );
    game.physics.arcade.overlap(
        player,
        clams,
        hit_clam,
        null,
        this
    );
    game.physics.arcade.overlap(
        player,
        sharks,
        hit_shark,
        null,
        this
    );
    game.physics.arcade.overlap(
        player,
        bubble_shields,
        hit_shield,
        null,
        this
    );
    game.physics.arcade.overlap(
        player,
        fishing_hooks,
        hit_fishing_hook,
        null,
        this
    );
		
    set_spawn_rates();

    update_physics();

    // ===========================
    // ==== Avatar controller ====
    // ===========================

    var walking = altitude === 0;
    var falling = (speed <= 0 && altitude > 0);
    var swimming = (speed > 0 && altitude > 0); 

    if (swimming && hook_timer == 0) {
        player.animations.play('swimming');
    }
    else if (walking) {
        player.animations.play('walking');
    }
    else if (falling) {
        player.animations.play('falling');
    }
    else {
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
    } 

    if (hook_timer > 0 || 
           (walking && !cursors.left.isDown &&
           !cursors.right.isDown)) {
        player.animations.stop();
        player.frame = 14;
    }

    // ===========================
    // ==== Text and counters ====
    // ===========================

    altitude_as_string = numberWithCommas(altitude);
    altitude_text.text = 'Altitude: ' + altitude_as_string;

    var energy_percent = Math.floor(
            (energy / ENERGY_CAP) * 100).toString() + "%";
    energy_text.text = energy_percent;
    energy_bar.width = (energy / ENERGY_CAP) * 212;
}


function hit_patty(player, patty) {
    sounds.whoosh.play();
    patty.destroy();

    aura.reset(player.x, player.y);
    aura.play('revive', 60, false, true);

    energy += PATTY_ENERGY_BOOST;
    energy = Math.min(energy, ENERGY_CAP);

    if (patty.is_first) {
        energy += FIRST_PATTY_ENERGY_BOOST;
    }

    patty_boost_timer = PATTY_BOOST_DURATION;
}


function hit_jellyfish(player, jellyfish) {
    jellyfish.destroy();
	if (shield_life === 0) {
        energy = 0;
        sounds.hurt.play();
    } else {
        shield_life--;
        sounds.hit.play();
    }
}


function hit_clam(player, clam) {
    clam.kill();
    if (shield_life === 0) {
        sounds.hurt.play();
        energy = Math.max(energy - 50, 0);
    } else {
        shield_life--;
        sounds.hit.play();
    }
}	


function hit_shield(player, bubble) {
	shield.exists = true;
	shield_life = SHIELD_HEALTH;
	bubble.kill();
}


function hit_fishing_hook(player, inHook) {
    hook.exists = true;
    hook_timer = FISHING_HOOK_TIMER;
    inHook.destroy();
}


function hit_shark(player, shark) {
	shark.kill();
    if (!game_ended && shield_life === 0) {
        sounds.hurt.play();
        game_over();
    } else {
        shield_life--;
        sounds.hit.play();
    }
}


function add_end_text(text, x_coord, y_coord, size) {
    return game.add.text(x_coord, y_coord, text, 
            {font: size + ' ' + GAME_TEXT, fill: '#add8e6'});
}


function send_highscores() {
    var username = $('#username_field').val();
    var post_to = '/api/highscore_send';
    
    if (!username || 0 === username.length) {
        alert('Enter a valid username!');
        return;
    }

    $.post(post_to, { name: username, score: final_altitude },
        function(response) {
            var send_status = response.status;
            if (!send_status) {
                add_end_text('HIGHSCORE SEND ERROR');
            } else {
                $.cookie(COOKIE_USERNAME_KEY,
                         username,
                         {expires: 7});
                window.location.reload();
            }
        }, 'json'
    );
}


function game_over() {
    game_ended = true;
    speed = 0;
    acceleration = 0;

    game.add.sprite(0, 0, 'black_bg'); 

    // re-add new bubbles group over the black background
    bubbles = game.add.group();
    bubbles.enableBody = true;

    final_altitude = altitude.toString();

    add_end_text('Game Over!',
                 game.width / 2 - 110,
                 game.height/2 - 170,
                 '40px');

    add_end_text('Final score: ' + numberWithCommas(final_altitude),
                 game.width / 2 - 80,
                 game.height/2 + 170,
                 '18px');

    press_space_blink_text = add_end_text('Press ? to skip',
                                          game.width / 2 - 65,
                                          game.height - 70,
                                          '18px');

    game.time.events.loop(Phaser.Timer.SECOND * 0.6,
                          function(text) {
                              text.visible = !text.visible;
                          }, this, press_space_blink_text);

    // remove the spawn timer after the game ends
    var entity_names = Object.keys(entity_spawn_map); 
    for (var i = 0; i < entity_names.length; i++) {
        var entity = entity_spawn_map[entity_names[i]];
        if (entity.spawn_timer) {
            game.time.events.remove(entity.spawn_timer);
        }
    }

    // add a spawn timer for bubbles, for garnishing the exit screen
    var bubble_dat = entity_spawn_map['bubble'];
    var bubble_spawn_params = bubble_dat.spawn_timer_params;
    var post_game_bubble_timer = game.time.events.loop.apply(
                                    game.time.events, bubble_spawn_params);

    post_game_bubble_timer.delay = Phaser.Timer.SECOND * 0.75;

    var body = $('body');
    body.append(
        '<div id="username_input_group" class="input-group" ' +
        'style="position:absolute;' +
            'left:' +
            (($( window ).width() / 2) - 150).toString() + 'px;' +
            'top: ' +
            (game.height / 2).toString() + 'px;">' +
        '<input id="username_field" type="text" ' +
           'class="form-control" placeholder="username, then press enter">' + 
        '<span class="input-group-btn">' + 
           '<button onclick="send_highscores()" class="btn btn-default" ' +
               'type="button">enter</button>' +
        '</span>' +
        '</div>');
    
    var prev_username = $.cookie(COOKIE_USERNAME_KEY);
    if (prev_username !== undefined) {
        $('#username_field').val(prev_username);
    }

    // autoselect the input field
    $('#username_field').select();

    // add listener so user can submit pressing enter
    $('#username_field').keypress(function( event ) {
        if (event.which === 13) {
            send_highscores();
        }
    });

    body.keypress(function( event ) {
        if (event.which === 63) {
            window.location.reload();
        }
    });
}
