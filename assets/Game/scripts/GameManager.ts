import { _decorator, Component, Node, Label, director, AudioSource, Prefab, SpriteFrame, instantiate, UITransform, Sprite, input, Input, EventKeyboard, KeyCode, view, AudioClip, Vec3, tween, easing } from 'cc';
import { PlayerController } from './PlayerController';
import { BackgroundScroller } from './BackgroundScroller';
import { EnemyController } from './EnemyController';
const { ccclass, property } = _decorator;

export enum GameState {
    Start,
    Playing,
    Over,
    Finish
}

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Node)
    startScreen: Node = null!;

    @property(Node)
    gameOverScreen: Node = null!;

    @property(Label)
    scoreLabel: Label = null!;

    @property(Label)
    finalScoreLabel: Label = null!;

    @property(Node)
    player: Node = null!;

    @property(Node)
    obstacleContainer: Node = null!;

    @property(Node)
    background: Node = null!;

    @property(Prefab)
    obstaclePrefab: Prefab = null!;

    @property([Prefab])
    collectiblePrefabs: Prefab[] = []; // Массив префабов собираемых предметов

    @property(Prefab)
    finishPrefab: Prefab = null!; // Префаб финиша

    @property(Prefab)
    enemyPrefab: Prefab = null!; // Префаб противника

    @property
    enemySpawnY: number = 150; // Координата Y для спавна противников (относительно земли)

    @property
    enemySpawnIntervalMin: number = 6; // Минимальный интервал спавна противников в секундах

    @property
    enemySpawnIntervalMax: number = 10; // Максимальный интервал спавна противников в секундах

    @property
    enemySpeed: number = 2.5; // Скорость движения противников (может быть больше gameSpeed для более агрессивного движения)

    @property(AudioClip)
    collectSound: AudioClip = null!; // Звук сбора предмета

    @property(Node)
    collectTarget: Node = null!; // Узел, к которому летят собранные предметы (обычно счетчик очков)

    @property
    collectibleMinY: number = 50; // Минимальная высота спавна собираемых предметов (относительно земли)

    @property
    collectibleMaxY: number = 250; // Максимальная высота спавна собираемых предметов (относительно земли)

    @property
    collectibleCollectionRadius: number = 0.7; // Множитель радиуса сбора (0.7 = 70% от размера спрайта)

    @property
    sessionDuration: number = 45; // Длительность сессии в секундах (можно изменять)

    @property
    finishY: number = 150; // Высота финиша по Y (относительно земли)

    @property
    finishColliderScale: number = 1.5; // Множитель размера коллайдера финиша (1.5 = увеличение на 50%)

    @property
    obstacleSpawnOffsetY: number = 0; // Оффсет по Y для спавна препятствий (относительно земли)

    @property
    obstacleSpawnIntervalMin: number = 8; // Минимальный интервал спавна препятствий в секундах

    @property
    obstacleSpawnIntervalMax: number = 12; // Максимальный интервал спавна препятствий в секундах

    @property
    gameSpeed: number = 2; // Скорость игры (скорость движения фона и препятствий, можно изменять)

    @property(Node)
    victoryScreen: Node = null!; // Экран победы (если не указан, используется gameOverScreen)

    @property(SpriteFrame)
    playerSprite: SpriteFrame = null!;

    @property(SpriteFrame)
    obstacleSprite: SpriteFrame = null!;

    @property(SpriteFrame)
    backgroundSprite: SpriteFrame = null!;

    private gameState: GameState = GameState.Start;
    private score: number = 0;
    private playerHealth: number = 3;
    private maxHealth: number = 3;
    private isMuted: boolean = false;
    private tutorialShown: boolean = false;
    private firstObstacleSpawned: boolean = false;
    private obstacles: Node[] = [];
    private obstacleSpawnTimer: number = 0;
    private currentObstacleSpawnInterval: number = 0; // Текущий интервал спавна препятствий (случайный)
    private collectibles: Node[] = [];
    private collectibleSpawnTimer: number = 0;
    private collectibleSpawnInterval: number = 5; // Собираемые предметы появляются раз в 5 секунд
    private enemies: Node[] = [];
    private enemySpawnTimer: number = 0;
    private currentEnemySpawnInterval: number = 0; // Текущий интервал спавна противников (случайный)
    private runTimer: number = 0;
    private finishLine: Node | null = null; // Узел финиша
    private finishSpawned: boolean = false; // Флаг, что финиш уже создан

    /**
     * Получает узел Background, пытаясь найти его автоматически, если ссылка не установлена
     */
    private getBackgroundNode(): Node | null {
        if (this.background) {
            return this.background;
        }
        
        // Автоматический поиск
        const scene = director.getScene();
        if (scene) {
            const canvasNode = scene.getChildByName('Canvas');
            if (canvasNode) {
                const backgroundNode = canvasNode.getChildByName('Background');
                if (backgroundNode) {
                    this.background = backgroundNode; // Сохраняем для будущего использования
                    return backgroundNode;
                }
            }
        }
        
        return null;
    }

    start() {
        console.log('[GameManager] start() called');
        console.log('[GameManager] player:', this.player);
        console.log('[GameManager] startScreen:', this.startScreen);
        console.log('[GameManager] obstaclePrefab:', this.obstaclePrefab);
        console.log('[GameManager] background:', this.background);
        console.log('[GameManager] obstacleContainer:', this.obstacleContainer);
        
        // Попытка найти Background автоматически, если ссылка не установлена
        if (!this.background) {
            console.warn('[GameManager] Background reference is null, trying to find it automatically...');
            const scene = director.getScene();
            if (scene) {
                const canvasNode = scene.getChildByName('Canvas');
                if (canvasNode) {
                    const backgroundNode = canvasNode.getChildByName('Background');
                    if (backgroundNode) {
                        this.background = backgroundNode;
                        console.log('[GameManager] Found Background node automatically:', backgroundNode);
                    } else {
                        console.error('[GameManager] Background node not found in Canvas children');
                        console.log('[GameManager] Canvas children:', canvasNode.children.map(c => c.name));
                    }
                }
            }
        }
        
        this.initGame();
        this.bindInput();
        console.log('[GameManager] Input bound');
    }

    onDestroy() {
        this.unbindInput();
    }

    private bindInput() {
        console.log('[GameManager] Binding input events');
        input.on(Input.EventType.TOUCH_START, this.onGlobalTouchStart, this);
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        console.log('[GameManager] Input events bound');
    }

    private unbindInput() {
        input.off(Input.EventType.TOUCH_START, this.onGlobalTouchStart, this);
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private onGlobalTouchStart() {
        console.log('[Input] TOUCH_START');
        this.handlePrimaryAction();
    }

    private onKeyDown(event: EventKeyboard) {
        if (event.keyCode === KeyCode.SPACE) {
            console.log('[Input] SPACE');
            this.handlePrimaryAction();
        }
    }

    /**
     * Единая “главная кнопка”:
     * - если игра на стартовом экране — стартуем
     * - если игра идет — прыжок
     * - если game over — рестарт
     */
    private handlePrimaryAction() {
        console.log('[GameManager] handlePrimaryAction, gameState:', this.gameState);
        if (this.gameState === GameState.Start) {
            console.log('[Game] StartGame');
            this.startGame();
            return;
        }
        if (this.gameState === GameState.Playing) {
            console.log('[Game] Jump request');
            const pc = this.player?.getComponent(PlayerController);
            if (!pc) {
                console.error('[GameManager] PlayerController not found on player node!');
                return;
            }
            pc.requestJump();
            return;
        }
        if (this.gameState === GameState.Over) {
            console.log('[Game] Restart after GameOver');
            this.restartGame();
        }
    }

    initGame() {
        console.log('[GameManager] initGame()');
        this.gameState = GameState.Start;
        this.score = 0;
        this.playerHealth = this.maxHealth;
        this.tutorialShown = false;
        this.firstObstacleSpawned = false;
        this.obstacles = [];
        this.obstacleSpawnTimer = 0;
        this.currentObstacleSpawnInterval = this.obstacleSpawnIntervalMin + Math.random() * (this.obstacleSpawnIntervalMax - this.obstacleSpawnIntervalMin);
        this.enemySpawnTimer = 0;
        this.currentEnemySpawnInterval = this.enemySpawnIntervalMin + Math.random() * (this.enemySpawnIntervalMax - this.enemySpawnIntervalMin);
        
        // Останавливаем прокрутку фона
        const backgroundNode = this.getBackgroundNode();
        if (backgroundNode) {
            const scroller = backgroundNode.getComponent(BackgroundScroller);
            if (scroller) {
                scroller.stopScrolling();
            }
        }
        
        if (this.startScreen) {
        this.startScreen.active = true;
            console.log('[GameManager] StartScreen activated');
        } else {
            console.error('[GameManager] startScreen is null!');
        }
        
        if (this.gameOverScreen) {
        this.gameOverScreen.active = false;
        } else {
            console.error('[GameManager] gameOverScreen is null!');
        }
        
        this.updateScore();
        this.updateHealth();
        
        // Устанавливаем анимацию Idle при инициализации (если игра еще не началась)
        this.updatePlayerAnimation();
        
        console.log('[GameManager] initGame() completed, state:', this.gameState);
    }

    startGame() {
        this.gameState = GameState.Playing;
        this.startScreen.active = false;
        this.gameOverScreen.active = false;
        this.score = 0;
        this.playerHealth = this.maxHealth;
        this.tutorialShown = false;
        this.firstObstacleSpawned = false;
        this.obstacleSpawnTimer = 0;
        this.currentObstacleSpawnInterval = this.obstacleSpawnIntervalMin + Math.random() * (this.obstacleSpawnIntervalMax - this.obstacleSpawnIntervalMin);
        this.enemySpawnTimer = 0;
        this.currentEnemySpawnInterval = this.enemySpawnIntervalMin + Math.random() * (this.enemySpawnIntervalMax - this.enemySpawnIntervalMin);
        this.runTimer = 0;
        
        // Очищаем препятствия и собираемые предметы
        this.obstacleContainer.removeAllChildren();
        this.obstacles = [];
        this.collectibles = [];
        this.collectibleSpawnTimer = 0;
        this.enemies = [];
        this.enemySpawnTimer = 0;
        this.runTimer = 0;
        this.finishLine = null;
        this.finishSpawned = false;
        console.log('[Game] Obstacles cleared, start running');
        
        // Переключаем анимацию на бег и запускаем движение игрока
        this.updatePlayerAnimation();
        const playerController = this.player.getComponent(PlayerController);
        if (playerController) {
            playerController.setRunning(true);
        }
        
        // Запускаем прокрутку фона
        const backgroundNode = this.getBackgroundNode();
        if (backgroundNode) {
            const scroller = backgroundNode.getComponent(BackgroundScroller);
            if (scroller) {
                scroller.setScrollSpeed(this.gameSpeed);
                scroller.startScrolling();
                console.log('[GameManager] Background scrolling started');
            } else {
                console.warn('[GameManager] BackgroundScroller not found on background node');
            }
        } else {
            console.warn('[GameManager] background node is null! Please assign Background node in Inspector or ensure it exists in Canvas');
        }
        
        this.updateScore();
        this.updateHealth();
    }

    gameOver() {
        this.gameState = GameState.Over;
        this.gameOverScreen.active = true;
        this.finalScoreLabel.string = `Score: $${Math.floor(this.score)}`;
        
        // Останавливаем прокрутку фона
        const backgroundNode = this.getBackgroundNode();
        if (backgroundNode) {
            const scroller = backgroundNode.getComponent(BackgroundScroller);
            if (scroller) {
                scroller.stopScrolling();
            }
        }
        
        // Переключаем анимацию на Idle
        this.updatePlayerAnimation();
    }

    finish() {
        this.gameState = GameState.Finish;
        
        // Используем экран победы или gameOverScreen
        const victoryScreen = this.victoryScreen || this.gameOverScreen;
        if (victoryScreen) {
            victoryScreen.active = true;
            console.log('[GameManager] Victory screen activated');
        } else {
            console.error('[GameManager] Victory screen and gameOverScreen are both null!');
        }
        
        // Обновляем текст с очками
        if (this.finalScoreLabel) {
            this.finalScoreLabel.string = `Victory! Score: $${Math.floor(this.score)}`;
        }
        
        console.log('[Game] Finish reached, score:', this.score);
        
        // Останавливаем прокрутку фона
        const backgroundNode = this.getBackgroundNode();
        if (backgroundNode) {
            const scroller = backgroundNode.getComponent(BackgroundScroller);
            if (scroller) {
                scroller.stopScrolling();
            }
        }
        
        // Переключаем анимацию на Idle и останавливаем движение игрока
        this.updatePlayerAnimation();
        const playerController = this.player.getComponent(PlayerController);
        if (playerController) {
            playerController.setRunning(false);
        }
    }

    /**
     * Обновляет анимацию игрока в зависимости от состояния игры
     */
    private updatePlayerAnimation() {
        if (!this.player) {
            return;
        }
        
        const playerController = this.player.getComponent(PlayerController);
        if (!playerController) {
            console.warn('[GameManager] PlayerController not found on player node');
            return;
        }

        // Переключаем анимацию в зависимости от состояния игры
        if (this.gameState === GameState.Start || 
            this.gameState === GameState.Over || 
            this.gameState === GameState.Finish) {
            playerController.playIdle();
            playerController.setRunning(false);
        } else if (this.gameState === GameState.Playing) {
            // Во время игры проверяем, не прыгает ли игрок
            // Если прыгает, анимация прыжка уже установлена в PlayerController.jump()
            // Если не прыгает, играем бег
            if (!playerController.getIsJumping()) {
                playerController.playRun();
            }
            playerController.setRunning(true);
        }
    }

    updateScore() {
        if (this.scoreLabel) {
            this.scoreLabel.string = `$${Math.floor(this.score)}`;
        }
    }

    updateHealth() {
        // Обновление здоровья будет в UI компоненте
        console.log('[GameManager] updateHealth called, health:', this.playerHealth, '/', this.maxHealth);
        
        // Пытаемся найти HealthUI разными способами
        let healthUI = this.node.getComponentInChildren('HealthUI' as any);
        
        // Если не нашли через getComponentInChildren, ищем в сцене
        if (!healthUI) {
            const scene = director.getScene();
            if (scene) {
                const canvasNode = scene.getChildByName('Canvas');
                if (canvasNode) {
                    const uiNode = canvasNode.getChildByName('UI');
                    if (uiNode) {
                        const healthUINode = uiNode.getChildByName('HealthUI');
                        if (healthUINode) {
                            healthUI = healthUINode.getComponent('HealthUI' as any);
                        }
                    }
                }
            }
        }
        
        if (healthUI && typeof healthUI.updateHealth === 'function') {
            console.log('[GameManager] Calling healthUI.updateHealth');
            healthUI.updateHealth(this.playerHealth, this.maxHealth);
        } else {
            console.warn('[GameManager] HealthUI component not found or updateHealth method not available!');
        }
    }

    checkTutorial() {
        if (this.tutorialShown || !this.firstObstacleSpawned || this.obstacles.length === 0) {
            return;
        }

        const firstObstacle = this.obstacles[0];
        if (firstObstacle) {
            const obstaclePos = firstObstacle.getPosition(); // Локальные координаты
            const scene = director.getScene();
            if (!scene) return;
            const canvasNode = scene.getChildByName('Canvas');
            if (!canvasNode) return;
            const canvasTransform = canvasNode.getComponent(UITransform);
            if (!canvasTransform) return;
            const screenWidth = canvasTransform.width;
            
            if (obstaclePos.x < screenWidth * 0.7 && obstaclePos.x > screenWidth * 0.3) {
                const tutorialUI = this.node.getComponentInChildren('TutorialUI' as any);
                if (tutorialUI && typeof tutorialUI.showTutorial === 'function') {
                    tutorialUI.showTutorial();
                    this.tutorialShown = true;
                }
            }
        }
    }

    spawnObstacle() {
        if (!this.obstaclePrefab) {
            console.warn('[GameManager] spawnObstacle: obstaclePrefab is null!');
            return;
        }

        console.log('[GameManager] Spawning obstacle');
        const obstacle = instantiate(this.obstaclePrefab);
        
        if (!this.obstacleContainer) {
            console.error('[GameManager] obstacleContainer is null!');
            return;
        }
        
        this.obstacleContainer.addChild(obstacle);
        
        // Препятствия в Canvas (UI), используем локальные координаты
        let canvasNode = this.obstacleContainer.parent;
        if (!canvasNode || canvasNode.name !== 'Canvas') {
            const scene = director.getScene();
            if (!scene) {
                console.error('[GameManager] Scene is null!');
                return;
            }
            canvasNode = scene.getChildByName('Canvas');
            if (!canvasNode) {
                console.error('[GameManager] Canvas node not found!');
                return;
            }
        }
        const canvasTransform = canvasNode.getComponent(UITransform);
        if (!canvasTransform) {
            console.error('[GameManager] Canvas UITransform not found!');
            return;
        }
        const visible = view.getVisibleSize();
        const canvasWidth = canvasTransform.width || visible.width;
        const groundY = -visible.height / 2 + 150;
        
        // Используем локальные координаты относительно Canvas с настраиваемым оффсетом по Y
        const spawnX = canvasWidth / 2 + 50;
        const spawnY = groundY + this.obstacleSpawnOffsetY;
        obstacle.setPosition(spawnX, spawnY, 0);
        this.obstacles.push(obstacle);
        console.log('[GameManager] Obstacle spawned at', spawnX, spawnY, 'total obstacles:', this.obstacles.length);

        if (!this.firstObstacleSpawned) {
            this.firstObstacleSpawned = true;
            console.log('[GameManager] First obstacle spawned');
        }
    }

    spawnCollectible() {
        if (!this.collectiblePrefabs || this.collectiblePrefabs.length === 0) {
            console.warn('[GameManager] spawnCollectible: collectiblePrefabs array is empty!');
            return;
        }

        // Выбираем случайный префаб из массива
        const randomIndex = Math.floor(Math.random() * this.collectiblePrefabs.length);
        const selectedPrefab = this.collectiblePrefabs[randomIndex];
        
        if (!selectedPrefab) {
            console.warn('[GameManager] spawnCollectible: selected prefab is null!');
            return;
        }

        console.log('[GameManager] Spawning collectible from prefab', randomIndex);
        const collectible = instantiate(selectedPrefab);
        
        if (!this.obstacleContainer) {
            console.error('[GameManager] obstacleContainer is null!');
            return;
        }
        
        this.obstacleContainer.addChild(collectible);
        
        // Собираемые предметы в Canvas (UI), используем локальные координаты
        let canvasNode = this.obstacleContainer.parent;
        if (!canvasNode || canvasNode.name !== 'Canvas') {
            const scene = director.getScene();
            if (!scene) {
                console.error('[GameManager] Scene is null!');
                return;
            }
            canvasNode = scene.getChildByName('Canvas');
            if (!canvasNode) {
                console.error('[GameManager] Canvas node not found!');
                return;
            }
        }
        const canvasTransform = canvasNode.getComponent(UITransform);
        if (!canvasTransform) {
            console.error('[GameManager] Canvas UITransform not found!');
            return;
        }
        const visible = view.getVisibleSize();
        const canvasWidth = canvasTransform.width || visible.width;
        const groundY = -visible.height / 2 + 150;
        
        // Размещаем собираемый предмет на случайной высоте в заданном диапазоне
        const randomY = groundY + this.collectibleMinY + Math.random() * (this.collectibleMaxY - this.collectibleMinY);
        
        // Используем локальные координаты относительно Canvas
        collectible.setPosition(canvasWidth / 2 + 50, randomY, 0);
        this.collectibles.push(collectible);
        console.log('[GameManager] Collectible spawned at', canvasWidth / 2 + 50, randomY, 'total collectibles:', this.collectibles.length);
    }

    spawnEnemy() {
        if (!this.enemyPrefab) {
            console.warn('[GameManager] spawnEnemy: enemyPrefab is null!');
            return;
        }

        console.log('[GameManager] Spawning enemy');
        const enemy = instantiate(this.enemyPrefab);
        
        if (!this.obstacleContainer) {
            console.error('[GameManager] obstacleContainer is null!');
            return;
        }
        
        this.obstacleContainer.addChild(enemy);
        
        // Противники в Canvas (UI), используем локальные координаты
        let canvasNode = this.obstacleContainer.parent;
        if (!canvasNode || canvasNode.name !== 'Canvas') {
            const scene = director.getScene();
            if (!scene) {
                console.error('[GameManager] Scene is null!');
                return;
            }
            canvasNode = scene.getChildByName('Canvas');
            if (!canvasNode) {
                console.error('[GameManager] Canvas node not found!');
                return;
            }
        }
        const canvasTransform = canvasNode.getComponent(UITransform);
        if (!canvasTransform) {
            console.error('[GameManager] Canvas UITransform not found!');
            return;
        }
        const visible = view.getVisibleSize();
        const canvasWidth = canvasTransform.width || visible.width;
        const groundY = -visible.height / 2 + 150;
        
        // Размещаем противника на заданной высоте
        const enemyY = groundY + this.enemySpawnY;
        
        // Используем локальные координаты относительно Canvas
        enemy.setPosition(canvasWidth / 2 + 50, enemyY, 0);
        this.enemies.push(enemy);
        console.log('[GameManager] Enemy spawned at', canvasWidth / 2 + 50, enemyY, 'total enemies:', this.enemies.length);
    }

    spawnFinish() {
        if (!this.finishPrefab) {
            console.warn('[GameManager] spawnFinish: finishPrefab is null!');
            return;
        }

        if (this.finishSpawned) {
            return; // Финиш уже создан
        }

        console.log('[GameManager] Spawning finish line');
        const finish = instantiate(this.finishPrefab);
        
        if (!this.obstacleContainer) {
            console.error('[GameManager] obstacleContainer is null!');
            return;
        }
        
        this.obstacleContainer.addChild(finish);
        
        // Финиш в Canvas (UI), используем локальные координаты
        let canvasNode = this.obstacleContainer.parent;
        if (!canvasNode || canvasNode.name !== 'Canvas') {
            const scene = director.getScene();
            if (!scene) {
                console.error('[GameManager] Scene is null!');
                return;
            }
            canvasNode = scene.getChildByName('Canvas');
            if (!canvasNode) {
                console.error('[GameManager] Canvas node not found!');
                return;
            }
        }
        const canvasTransform = canvasNode.getComponent(UITransform);
        if (!canvasTransform) {
            console.error('[GameManager] Canvas UITransform not found!');
            return;
        }
        const visible = view.getVisibleSize();
        const canvasWidth = canvasTransform.width || visible.width;
        const groundY = -visible.height / 2 + 150;
        
        // Размещаем финиш на заданной высоте
        const finishY = groundY + this.finishY;
        
        // Используем локальные координаты относительно Canvas
        finish.setPosition(canvasWidth / 2 + 50, finishY, 0);
        this.finishLine = finish;
        this.finishSpawned = true;
        console.log('[GameManager] Finish line spawned at', canvasWidth / 2 + 50, finishY);
    }

    checkCollisions() {
        if (!this.player) return;

        // Для UI элементов используем локальные координаты
        const playerPos = this.player.getPosition();
        const playerTransform = this.player.getComponent(UITransform);
        const playerSprite = this.player.getComponent(Sprite);
        if (!playerTransform && !playerSprite) return;

        const playerWidth = playerTransform ? playerTransform.width : 60;
        const playerHeight = playerTransform ? playerTransform.height : 80;

        // Вычисляем прямоугольник игрока один раз для всех проверок коллизий
        const playerRect = {
            x: playerPos.x - playerWidth / 2,
            y: playerPos.y - playerHeight / 2,
            width: playerWidth,
            height: playerHeight
        };

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            const obstaclePos = obstacle.getPosition(); // Локальные координаты
            const obstacleTransform = obstacle.getComponent(UITransform);
            const obstacleSprite = obstacle.getComponent(Sprite);
            
            if (!obstacleTransform && !obstacleSprite) continue;

            const obstacleWidth = obstacleTransform ? obstacleTransform.width : 40;
            const obstacleHeight = obstacleTransform ? obstacleTransform.height : 60;

            // Простая проверка коллизии AABB (локальные координаты)

            const obstacleRect = {
                x: obstaclePos.x - obstacleWidth / 2,
                y: obstaclePos.y - obstacleHeight / 2,
                width: obstacleWidth,
                height: obstacleHeight
            };

            if (this.isColliding(playerRect, obstacleRect)) {
                this.playerHealth--;
                this.updateHealth();
                
                // Визуальный эффект получения урона
                const playerController = this.player.getComponent(PlayerController);
                if (playerController) {
                    playerController.playDamageEffect();
                }
                
                if (this.playerHealth <= 0) {
                    this.gameOver();
                } else {
                    // Удаляем препятствие после столкновения
                    obstacle.destroy();
                    this.obstacles.splice(i, 1);
                }
            }
        }

        // Проверка коллизий со собираемыми предметами
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            const collectiblePos = collectible.getPosition(); // Локальные координаты
            const collectibleTransform = collectible.getComponent(UITransform);
            const collectibleSprite = collectible.getComponent(Sprite);
            
            if (!collectibleTransform && !collectibleSprite) continue;

            const collectibleWidth = collectibleTransform ? collectibleTransform.width : 30;
            const collectibleHeight = collectibleTransform ? collectibleTransform.height : 30;

            // Уменьшенный радиус сбора для более точного сбора
            const collectionWidth = collectibleWidth * this.collectibleCollectionRadius;
            const collectionHeight = collectibleHeight * this.collectibleCollectionRadius;

            // Простая проверка коллизии AABB с уменьшенным радиусом (локальные координаты)
            const collectibleRect = {
                x: collectiblePos.x - collectionWidth / 2,
                y: collectiblePos.y - collectionHeight / 2,
                width: collectionWidth,
                height: collectionHeight
            };

            if (this.isColliding(playerRect, collectibleRect)) {
                // Собрали предмет - запускаем анимацию сбора
                this.collectItem(collectible, i);
            }
        }

        // Проверка коллизии с финишем
        if (this.finishLine && this.finishLine.isValid) {
            const finishPos = this.finishLine.getPosition();
            const finishTransform = this.finishLine.getComponent(UITransform);
            const finishSprite = this.finishLine.getComponent(Sprite);
            
            if (finishTransform || finishSprite) {
                const baseFinishWidth = finishTransform ? finishTransform.width : 100;
                const baseFinishHeight = finishTransform ? finishTransform.height : 200;
                
                // Расширяем коллайдер финиша с помощью множителя
                const finishWidth = baseFinishWidth * this.finishColliderScale;
                const finishHeight = baseFinishHeight * this.finishColliderScale;

                const finishRect = {
                    x: finishPos.x - finishWidth / 2,
                    y: finishPos.y - finishHeight / 2,
                    width: finishWidth,
                    height: finishHeight
                };

                if (this.isColliding(playerRect, finishRect)) {
                    console.log('[GameManager] Player reached finish line!');
                    this.finish();
                }
            }
        }

        // Проверка коллизии с противниками
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (!enemy || !enemy.isValid) continue;

            const enemyPos = enemy.getPosition();
            const enemyTransform = enemy.getComponent(UITransform);
            const enemySprite = enemy.getComponent(Sprite);
            
            if (!enemyTransform && !enemySprite) continue;

            const enemyWidth = enemyTransform ? enemyTransform.width : 60;
            const enemyHeight = enemyTransform ? enemyTransform.height : 80;

            const enemyRect = {
                x: enemyPos.x - enemyWidth / 2,
                y: enemyPos.y - enemyHeight / 2,
                width: enemyWidth,
                height: enemyHeight
            };

            if (this.isColliding(playerRect, enemyRect)) {
                console.log('[GameManager] Player collided with enemy!');
                // Наносим урон игроку
                this.playerHealth--;
                this.updateHealth();
                
                // Визуальный эффект получения урона
                const playerController = this.player.getComponent(PlayerController);
                if (playerController) {
                    playerController.playDamageEffect();
                }
                
                // Удаляем противника после столкновения
                enemy.destroy();
                this.enemies.splice(i, 1);
                
                // Проверяем, не закончилась ли игра
                if (this.playerHealth <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    isColliding(rect1: any, rect2: any): boolean {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    /**
     * Обрабатывает сбор предмета: анимация полета к счетчику, звук, добавление очков
     */
    private collectItem(collectible: Node, index: number) {
        // Удаляем из массива сразу, чтобы избежать повторного сбора
        this.collectibles.splice(index, 1);

        // Воспроизводим звук сбора
        if (this.collectSound) {
            const audioSource = this.getComponent(AudioSource);
            if (audioSource) {
                audioSource.playOneShot(this.collectSound, 1);
            } else {
                // Если AudioSource нет на GameManager, пытаемся найти в сцене
                const scene = director.getScene();
                if (scene) {
                    const canvasNode = scene.getChildByName('Canvas');
                    if (canvasNode) {
                        const audioSource = canvasNode.getComponent(AudioSource);
                        if (audioSource) {
                            audioSource.playOneShot(this.collectSound, 1);
                        }
                    }
                }
            }
        }

        // Получаем позицию игрока для первой части анимации
        let playerPos: Vec3;
        if (this.player) {
            const playerLocalPos = this.player.getPosition();
            playerPos = new Vec3(playerLocalPos.x, playerLocalPos.y, 0);
        } else {
            // Если игрок не найден, используем текущую позицию предмета
            playerPos = collectible.getPosition();
        }

        // Получаем позицию цели сбора (явно указанный узел или счетчик очков)
        let scorePos: Vec3;
        if (this.collectTarget) {
            // Используем явно указанный узел цели
            const targetLocalPos = this.collectTarget.getPosition();
            scorePos = new Vec3(targetLocalPos.x, targetLocalPos.y, 0);
            console.log('[GameManager] Using collectTarget position:', scorePos);
        } else if (this.scoreLabel && this.scoreLabel.node) {
            // Fallback: используем локальные координаты счетчика относительно Canvas
            const scoreLocalPos = this.scoreLabel.node.getPosition();
            scorePos = new Vec3(scoreLocalPos.x, scoreLocalPos.y, 0);
            console.log('[GameManager] Using scoreLabel position:', scorePos);
        } else {
            // Если ничего не найдено, используем верхний правый угол
            const visible = view.getVisibleSize();
            scorePos = new Vec3(visible.width / 2 - 50, visible.height / 2 - 50, 0);
            console.warn('[GameManager] Using fallback position for collect target');
        }

        const startPos = collectible.getPosition();
        const startScale = collectible.getScale();

        // Двухэтапная анимация: сначала к игроку, затем к счетчику очков
        tween(collectible)
            // Этап 1: Притягивание к игроку (быстрое, с увеличением)
            .to(0.2, { 
                position: playerPos,
                scale: new Vec3(startScale.x * 1.2, startScale.y * 1.2, 1)
            }, { 
                easing: easing.sineIn
            })
            // Этап 2: Полет от игрока к счетчику очков (с уменьшением)
            .to(0.4, { 
                position: scorePos,
                scale: new Vec3(startScale.x * 0.3, startScale.y * 0.3, 1)
            }, { 
                easing: easing.sineOut
            })
            .call(() => {
                // Добавляем очки после завершения анимации
                this.score += 50; // Даем 50 очков за каждый собранный предмет
                this.updateScore();
                console.log('[GameManager] Collectible collected! Score:', this.score);
                
                // Удаляем предмет после анимации
                collectible.destroy();
            })
            .start();
    }

    update(deltaTime: number) {
        if (this.gameState !== GameState.Playing) {
            return;
        }

        this.runTimer += deltaTime;
        
        // Логируем прогресс каждые 5 секунд
        if (Math.floor(this.runTimer) % 5 === 0 && Math.floor(this.runTimer * 10) % 10 === 0) {
            console.log('[GameManager] update: playing, timer:', this.runTimer.toFixed(1), '/', this.sessionDuration, 'obstacles:', this.obstacles.length, 'speed:', this.gameSpeed.toFixed(2));
        }
        
        // Спавним финиш после истечения времени сессии
        if (this.runTimer >= this.sessionDuration && !this.finishSpawned) {
            console.log('[GameManager] Session duration reached, spawning finish line');
            this.spawnFinish();
        }

        // Обновление препятствий
        const visible = view.getVisibleSize();
        const canvasWidth = visible.width;

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            const pos = obstacle.getPosition();
            obstacle.setPosition(pos.x - this.gameSpeed, pos.y, pos.z);

            // Удаляем препятствия за экраном
            if (pos.x < -canvasWidth / 2 - 100) {
                obstacle.destroy();
                this.obstacles.splice(i, 1);
                this.score += 10;
                this.updateScore();
            }
        }

        // Обновление собираемых предметов
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            if (!collectible || !collectible.isValid) {
                this.collectibles.splice(i, 1);
                continue;
            }
            
            const pos = collectible.getPosition();
            // Двигаем собираемый предмет влево вместе с препятствиями
            collectible.setPosition(pos.x - this.gameSpeed, pos.y, pos.z);

            // Удаляем собираемые предметы за экраном
            if (pos.x < -canvasWidth / 2 - 100) {
                collectible.destroy();
                this.collectibles.splice(i, 1);
            }
        }

        // Обновление финиша (движется вместе с препятствиями)
        if (this.finishLine && this.finishLine.isValid) {
            const finishPos = this.finishLine.getPosition();
            this.finishLine.setPosition(finishPos.x - this.gameSpeed, finishPos.y, finishPos.z);
        }

        // Обновление противников (движутся к игроку)
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (!enemy || !enemy.isValid) {
                this.enemies.splice(i, 1);
                continue;
            }
            
            const pos = enemy.getPosition();
            // Двигаем противника влево к игроку с заданной скоростью
            enemy.setPosition(pos.x - this.enemySpeed, pos.y, pos.z);

            // Удаляем противников за экраном
            if (pos.x < -canvasWidth / 2 - 100) {
                enemy.destroy();
                this.enemies.splice(i, 1);
            }
        }

        // Спавн новых препятствий с случайным интервалом
        this.obstacleSpawnTimer += deltaTime;
        if (this.obstacleSpawnTimer >= this.currentObstacleSpawnInterval) {
            this.obstacleSpawnTimer = 0;
            // Генерируем новый случайный интервал для следующего спавна
            this.currentObstacleSpawnInterval = this.obstacleSpawnIntervalMin + Math.random() * (this.obstacleSpawnIntervalMax - this.obstacleSpawnIntervalMin);
            console.log('[GameManager] Spawn timer triggered, spawning obstacle. Next spawn in:', this.currentObstacleSpawnInterval.toFixed(2), 'seconds');
            this.spawnObstacle();
        }

        // Спавн собираемых предметов раз в 5 секунд
        this.collectibleSpawnTimer += deltaTime;
        if (this.collectibleSpawnTimer >= this.collectibleSpawnInterval) {
            this.collectibleSpawnTimer = 0;
            console.log('[GameManager] Spawn timer triggered, spawning collectible');
            this.spawnCollectible();
        }

        // Спавн противников с случайным интервалом
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer >= this.currentEnemySpawnInterval) {
            this.enemySpawnTimer = 0;
            // Генерируем новый случайный интервал для следующего спавна
            this.currentEnemySpawnInterval = this.enemySpawnIntervalMin + Math.random() * (this.enemySpawnIntervalMax - this.enemySpawnIntervalMin);
            console.log('[GameManager] Spawn timer triggered, spawning enemy. Next spawn in:', this.currentEnemySpawnInterval.toFixed(2), 'seconds');
            this.spawnEnemy();
        }

        // Проверка коллизий
        this.checkCollisions();

        // Проверка туториала
        this.checkTutorial();

        // Увеличение скорости
        this.gameSpeed += 0.0001;
        
        // Синхронизируем скорость прокрутки фона
        const backgroundNode = this.getBackgroundNode();
        if (backgroundNode) {
            const scroller = backgroundNode.getComponent(BackgroundScroller);
            if (scroller) {
                scroller.setScrollSpeed(this.gameSpeed);
            }
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        const audioSource = this.getComponent(AudioSource);
        if (audioSource) {
            audioSource.volume = this.isMuted ? 0 : 1;
        }
    }

    restartGame() {
        this.initGame();
        // updatePlayerAnimation() уже вызывается в initGame()
    }
}
