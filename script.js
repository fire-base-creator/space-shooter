const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions
canvas.width = 800;
canvas.height = 600;

// Game state
let gameRunning = false;
let score = 0;
let lives = 3;
let highScore = localStorage.getItem('spaceHighScore') || 0;
document.getElementById('highScoreValue').innerText = highScore;

// Player object
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 7,
    color: '#00ffcc'
};

// Bullets array
let bullets = [];
const bulletSpeed = 8;
const bulletCooldownMax = 10;
let bulletCooldown = 0;

// Enemies array
let enemies = [];
const enemyRows = 3;
const enemyCols = 8;
const enemyWidth = 40;
const enemyHeight = 35;
let enemyDirection = 1;
let enemyStepDown = 0;

// Stars for background
let stars = [];

// Controls
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
};

// Initialize stars
function initStars() {
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2,
            alpha: Math.random() * 0.8 + 0.2
        });
    }
}

// Create enemy fleet
function createEnemies() {
    enemies = [];
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            enemies.push({
                x: col * (enemyWidth + 10) + 50,
                y: row * (enemyHeight + 10) + 50,
                width: enemyWidth,
                height: enemyHeight,
                alive: true,
                type: row
            });
        }
    }
}

// Draw player ship
function drawPlayer() {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffcc';
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.lineTo(player.x + player.width - 10, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height - 15);
    ctx.lineTo(player.x + 10, player.y + player.height);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#ff00cc';
    ctx.arc(player.x + player.width / 2, player.y + 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// Draw bullets
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffff00';
        ctx.fillRect(bullet.x, bullet.y, 4, 10);
    });
    ctx.shadowBlur = 0;
}

// Draw enemies
function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.alive) {
            ctx.fillStyle = enemy.type === 0 ? '#ff4444' : enemy.type === 1 ? '#ff8844' : '#ffaa44';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ff0000';
            ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(enemy.x + 5, enemy.y + 5, 8, 8);
            ctx.fillRect(enemy.x + enemy.width - 13, enemy.y + 5, 8, 8);
        }
    });
    ctx.shadowBlur = 0;
}

// Draw stars
function drawStars() {
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Update player movement
function updatePlayer() {
    if (keys.ArrowLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
}

// Update bullets
function updateBullets() {
    bullets = bullets.filter(bullet => bullet.y > 0);
    bullets.forEach(bullet => {
        bullet.y -= bulletSpeed;
    });
}

// Update enemies movement
function updateEnemies() {
    let moveDown = false;
    
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        enemy.x += 2 * enemyDirection;
        
        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            moveDown = true;
        }
    });
    
    if (moveDown) {
        enemyDirection *= -1;
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.y += 20;
            }
        });
    }
    
    // Check if enemies reach bottom
    enemies.forEach(enemy => {
        if (enemy.alive && enemy.y + enemy.height >= player.y) {
            gameOver();
        }
    });
}

// Check collisions
function checkCollisions() {
    // Bullet vs Enemy
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        let hit = false;
        
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (enemy.alive &&
                bullet.x < enemy.x + enemy.width &&
                bullet.x + 4 > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + 10 > enemy.y) {
                
                enemy.alive = false;
                hit = true;
                score += 10;
                document.getElementById('scoreValue').innerText = score;
                break;
            }
        }
        
        if (hit) {
            bullets.splice(i, 1);
        }
    }
    
    // Player vs Enemy
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (enemy.alive &&
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            
            enemy.alive = false;
            lives--;
            document.getElementById('livesValue').innerText = lives;
            
            if (lives <= 0) {
                gameOver();
            }
            break;
        }
    }
    
    // Win condition
    const aliveEnemies = enemies.filter(e => e.alive).length;
    if (aliveEnemies === 0) {
        gameWin();
    }
}

// Shoot bullet
function shoot() {
    if (bulletCooldown <= 0) {
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10
        });
        bulletCooldown = bulletCooldownMax;
    }
}

// Game over function
function gameOver() {
    gameRunning = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spaceHighScore', highScore);
        document.getElementById('highScoreValue').innerText = highScore;
    }
    document.getElementById('finalScore').innerText = score;
    document.getElementById('gameOverScreen').style.display = 'block';
}

// Game win function
function gameWin() {
    gameRunning = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('spaceHighScore', highScore);
        document.getElementById('highScoreValue').innerText = highScore;
    }
    alert('🎉 YOU WIN! 🎉\nFinal Score: ' + score);
    document.getElementById('finalScore').innerText = score;
    document.getElementById('gameOverScreen').style.display = 'block';
}

// Reset game
function resetGame() {
    score = 0;
    lives = 3;
    bullets = [];
    player.x = canvas.width / 2 - 25;
    document.getElementById('scoreValue').innerText = score;
    document.getElementById('livesValue').innerText = lives;
    createEnemies();
    bulletCooldown = 0;
    enemyDirection = 1;
    gameRunning = true;
    document.getElementById('gameOverScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'none';
}

// Start game
function startGame() {
    resetGame();
    gameRunning = true;
}

// Draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStars();
    drawEnemies();
    drawPlayer();
    drawBullets();
}

// Update game logic
function update() {
    if (!gameRunning) return;
    
    updatePlayer();
    updateBullets();
    updateEnemies();
    checkCollisions();
    
    if (bulletCooldown > 0) {
        bulletCooldown--;
    }
}

// Animation loop
function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.key === 'ArrowRight') keys.ArrowRight = true;
    if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        keys.Space = true;
        if (gameRunning) shoot();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.key === 'ArrowRight') keys.ArrowRight = false;
    if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        keys.Space = false;
    }
});

// Touch controls for mobile
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    if (touchX > 0 && touchX < canvas.width - player.width) {
        player.x = touchX;
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) shoot();
});

canvas.addEventListener('mousemove', (e) => {
    if (!gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    if (mouseX > 0 && mouseX < canvas.width - player.width) {
        player.x = mouseX;
    }
});

canvas.addEventListener('click', (e) => {
    if (gameRunning) shoot();
});

// Start screen button
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', startGame);

// Initialize
initStars();
createEnemies();
animate();