// The game will use the whole window
const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

// The world width will be 10 times the size of the screen
const worldWidth = screenWidth * 10;
const maxWorldWidth = worldWidth * 2;

// Height of platform and joystick size (at the bottom)
const platformHeight = screenHeight / 6;
const joystickSize = platformHeight / 3;

// Both x and y velocity (depending on the screen size) 
const velocityX = screenWidth / 4;
const velocityY = screenHeight / 2;

// Number of clouds, tries, fires and coins
const numClouds = 25;
const numTrees = 50;
const numFires = 10;
const numCoins = 25;
const numStars = 50;
let timeout = false;
let volvan;
const numDragons = 25;


let config = {
    type: Phaser.AUTO,
    width: screenWidth,
    height: screenHeight,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: velocityY }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let platform, player, bell, dead;
let cursors, joyStick;
let score = 0, lives = 5, scoreText = null;
let gameOver = false;

// Init Phaser
let game = new Phaser.Game(config);

function preload() {
    // Load joyStick
    this.load.plugin('rexvirtualjoystickplugin', 'https://cdn.jsdelivr.net/npm/phaser3-rex-plugins@1.1.39/dist/rexvirtualjoystickplugin.min.js', true);

    // Load images
    this.load.image('cloud', 'assets/cloud.png');
    this.load.image('tree', 'assets/tree.png');
    this.load.image('bomb', 'assets/bomb.png');
    this.load.image('restart', 'assets/restart.png');
    this.load.image('volvan', 'assets/volvan.png');

    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('fire', 'assets/fire.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('coin', 'assets/coin.png', { frameWidth: 32, frameHeight: 32 });
    // Load sounds and music
    this.load.audio('bell', 'assets/ding.mp3');
    this.load.audio('dead', 'assets/dead.mp3');
    this.load.audio('music', 'assets/music.mp3');

    this.load.image('arrow', 'assets/arrow.png');
    this.load.image('tree2', 'assets/tree2.png');
    this.load.image('star', 'assets/star.png');
    this.load.audio('bell2', 'assets/ding2.mp3');
    this.load.spritesheet('dragon', 'assets/dragon.png', { frameWidth: 144, frameHeight: 128 });
}

function initSounds() {
    bell = this.sound.add('bell');
    bell2 = this.sound.add('bell2', { volume: 0.2 });

    dead = this.sound.add('dead');
    this.sound.add('music', { volume: 0.5 }).play({ loop: -1 });
}

function create() {
    initSounds.call(this);
    createWorld.call(this);
    for (i = 0; i < numTrees; i++) createTree.call(this);
    createAnimations.call(this);
    createPlayer.call(this);
    for(i=0; i<numClouds; i++) createCloud.call(this);
    showScore.call(this);
    for(i=0; i<numFires; i++) createFire.call(this);
    for(i=0; i<numCoins; i++) createCoin.call(this);
    showArrow.call(this);
    for (i = 0; i < numDragons; i++) createDragon.call(this);


}


function createWorld() {
    this.cameras.main.setBounds(0, 0, maxWorldWidth, screenHeight);
    this.physics.world.setBounds(0, 0, maxWorldWidth, screenHeight);

    // Sky
    sky = this.add.rectangle(0, 0, worldWidth, screenHeight, 0x87CEEB).setOrigin(0);
    this.add.rectangle(worldWidth, 0, worldWidth, screenHeight, 0xff0000).setOrigin(0);

    volvan = this.add.image(0, 0, 'volcan').setOrigin(0).setScrollFactor(0);
    volvan.displayWidth = screenWidth;
    volvan.displayHeight = screenHeight - platformHeight;

    // Platform
    platform = this.add.rectangle(0, screenHeight, worldWidth, platformHeight, 0xB76743).setOrigin(1);
    this.physics.add.existing(platform);
    platform.body.setCollideWorldBounds(true);
    platform2 = this.add.rectangle(worldWidth, screenHeight, worldWidth, platformHeight, 0x006600).setOrigin(0, 1);
    this.physics.add.existing(platform2);
    platform2.body.setCollideWorldBounds(true);

    this.add.image(worldWidth, 0, 'tree2').setOrigin(0.5, 0).setDisplaySize(screenWidth/5, screenHeight);
}

function createTree() {
    const x = Phaser.Math.Between(0, worldWidth);
    const y = screenHeight - platformHeight;
    const scale = Phaser.Math.FloatBetween(0.5, 2);
    this.add.image(x, y, 'tree').setOrigin(1).setScale(scale);
    this.add.image(x + worldWidth, y, 'tree2').setOrigin(1).setScale(scale * 2);

}

function createAnimations() {
    // Player
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }]
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });
    // Fire
    this.anims.create({
        key: 'burning',
        frames: this.anims.generateFrameNumbers('fire', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: -1
    });
    // Coin
    this.anims.create({
        key: 'rotate',
        frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });

    //Dragon
    this.anims.create({
        key: 'flying',
        frames: this.anims.generateFrameNumbers('dragon', { start: 0, end: 11 }),
        frameRate: 5,
        repeat: -1
    });
}

function createPlayer() {
    player = this.physics.add.sprite(0, screenHeight - platformHeight, 'dude').setOrigin(1).setScale(3).setBounce(0.2).setCollideWorldBounds(true);
    this.physics.add.collider(player, platform);
    this.physics.add.collider(player, platform2);

    this.cameras.main.startFollow(player, true, 0.05, 0.05);
    // Cursor keys and joystick
    cursors = this.input.keyboard.createCursorKeys();
    joyStick = this.plugins.get('rexvirtualjoystickplugin').add(this, {
        x: screenWidth / 2,
        y: screenHeight - joystickSize * 1.5,
        radius: joystickSize
    }).on('update', update, this);
}

function update() {
    if (gameOver) return;

  
    if (cursors.left.isDown || joyStick.left) {
        player.setVelocityX(-velocityX).anims.play('left', true);
    }
    else if (cursors.right.isDown || joyStick.right) {
        player.setVelocityX(velocityX).anims.play('right', true);
    }
    else {
        player.setVelocityX(0).anims.play('turn');
    }

    if ((cursors.up.isDown || joyStick.up) && player.body.touching.down) {
        player.setVelocityY(-velocityY);
    }
    if(player.x>= worldWidth){
        volvan.setVisible(true);
    }
    else{
        volvan.setVisible(false);
    }
}

function createCloud() {
    const x = Phaser.Math.Between(0, maxWorldWidth);
    const y = Phaser.Math.Between(0, screenHeight-platformHeight*3);
    const scale = Phaser.Math.FloatBetween(0.5, 1.5);
    this.add.image(x, y, 'cloud').setScale(scale);
}

function showScore() {
    if (!scoreText) scoreText = this.add.text(16, 16, '', { fontSize:(screenWidth/50)+'px', fill:'#000' }).setScrollFactor(0);
    scoreText.setText('Score:' + score + ' / Lives:' + lives);
}

function createFire() {
    const x = Phaser.Math.Between(screenWidth/2, maxWorldWidth);
    const y = Phaser.Math.Between(screenHeight-platformHeight, screenHeight);
    let fire = this.physics.add.sprite(x, y, 'fire').setOrigin(1).setScale(3).setImmovable(true).anims.play('burning', true)
    fire.body.setAllowGravity(false);
    this.physics.add.collider(player, fire, hitBombOrFire, null, this);   
}

function createCoin() {     
    const x = Phaser.Math.Between(screenWidth/3, worldWidth);
    const bounce = Phaser.Math.FloatBetween(0.1, 0.5);
    let coin = this.physics.add.sprite(x, 0, 'coin').setOrigin(1).setScale(3).setBounce(bounce).anims.play('rotate');
    coin.body.setOffset(0, -10);
    this.physics.add.collider(coin, platform);
    this.physics.add.overlap(player, coin, collectCoin, null, this);
}

function createBomb() {
    const x = Phaser.Math.Between(0, worldWidth);
    const v = Phaser.Math.Between(-velocityX, velocityX);
    let bomb = this.physics.add.image(x, 0, 'bomb').setScale(2).setBounce(1).setCollideWorldBounds(true).setVelocity(v, velocityY);
    bomb.body.setAllowGravity(false);
    this.physics.add.collider(bomb, platform);     
    this.physics.add.collider(player, bomb, hitBombOrFire, null, this);   
}

function collectCoin(player, coin) { 
    bell.play();
    coin.destroy();
    createCoin.call(this);
    createBomb.call(this);    

    score += 10;
    if (score % 100 == 0) lives++;
    showScore();
}

function hitBombOrFire(player, thing) {
    dead.play();
    lives--;
    showScore();
    player.setTint(0xff0000).anims.play('turn');

    if (lives == 0) {
        this.physics.pause();
        gameOver = true;
        this.add.image(screenWidth/2, screenHeight/2, 'restart').setScale(5).setScrollFactor(0).setInteractive().on('pointerdown', ()=>location.reload());                
    }
    else {
        thing.destroy();
        setTimeout(()=>player.clearTint(), 3000);
    }
}
function showArrow() {
    this.add.image(screenWidth, 0, 'arrow').setOrigin(1, 0).setScale(2).setScrollFactor(0).setInteractive().on('pointerdown', () => player.x = (player.x + worldWidth) % maxWorldWidth);
}

function createStar() {
    const x = Phaser.Math.Between(worldWidth, worldWidth * 2);
    const vX = Phaser.Math.Between(-velocityX, velocityX);
    const vY = Phaser.Math.Between(velocityY/2, velocityY);
    let star = this.physics.add.image(x, 0, 'star').setScale(0.5).setBounce(1).setCollideWorldBounds(true).setVelocity(vX, vY);
    star.body.setAllowGravity(false);
    this.physics.add.collider(star, platform);
    this.physics.add.collider(star, platform2);
    this.physics.add.collider(player, star, collectStar, null, this);
}

function protect(color) {
    player.setTint(color);
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => { timeout=false; player.clearTint() }, 3000);
}

function collectStar(player, star) {
    bell2.play();
    star.destroy();
    createStar.call(this);

    protect(0xFFFF00);

    score += 10;
    if (score % 100 == 0) lives++;
    showScore();
}

function createDragon() {
    const x = Phaser.Math.Between(worldWidth, worldWidth * 2);
    const y = Phaser.Math.Between(0, screenHeight - platformHeight);
    const v = Phaser.Math.Between(velocityY/2, velocityY);
    let dragon = this.physics.add.sprite(x, y, 'dragon').setOrigin(1).setSize(72, 64).setScale(2).anims.play('flying', true).setBounce(1).setVelocity(0, v);
    dragon.body.setAllowGravity(false).setCollideWorldBounds(true);
    this.physics.add.collider(dragon, platform2);
    this.physics.add.collider(player, dragon, hitDragon, null, this);
}

function hitDragon(player, dragon) {
    dead.play();
    lives--;
    showScore();

    protect(0xFF0000);

    if (lives == 0) {
        this.physics.pause();
        gameOver = true;
        this.add.image(screenWidth/2, screenHeight/2, 'restart').setScale(5).setScrollFactor(0).setInteractive().on('pointerdown', () => location.reload());
    }
    else {
        dragon.destroy();
    }
}