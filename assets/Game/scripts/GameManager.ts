import { _decorator, Component, Node, Label, director, AudioSource, Prefab, SpriteFrame, instantiate, UITransform, Sprite, input, Input, EventKeyboard, KeyCode, view, AudioClip, Vec3, tween, easing, Button } from 'cc';
import { PlayerController } from './PlayerController';
import { BackgroundScroller } from './BackgroundScroller';
import { EnemyController } from './EnemyController';
import { TutorialUI } from './TutorialUI';
import { ParticleEffect } from './ParticleEffect';
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

    @property(Button)
    startButton: Button = null!; // Кнопка для старта игры

    @property(Node)
    scaledObject: Node = null!; // Объект с зацикленным скейлом (1-0.9)

    @property(Node)
    enemyTutorialPopup: Node = null!; // Объект, который активируется при первом сближении с противником (пауза)

    @property(Node)
    gameOverScreen: Node = null!; // Основной объект окна проигрыша (контейнер, внутри него Part1 и Part2)

    @property(Node)
    gameOverScreenPart1: Node = null!; // Первая часть окна проигрыша (со спрайтом, дочерний объект GameOverScreen)

    @property(Node)
    gameOverScreenPart2: Node = null!; // Вторая часть окна проигрыша (основное окно, дочерний объект GameOverScreen)

    @property(Node)
    gameOverSprite: Node = null!; // Спрайт в первой части, который скейлится с 0 до 1

    @property
    gameOverAnimationDuration: number = 0.5; // Длительность анимации скейла спрайта

    @property(Button)
    restartButton: Button = null!; // Кнопка для перезапуска игры в окне проигрыша

    @property(Button)
    victoryRestartButton: Button = null!; // Кнопка для перезапуска игры в окне победы (если не указана, используется restartButton)

    @property(Label)
    scoreLabel: Label = null!;

    @property(Label)
    finalScoreLabel: Label = null!; // Label для отображения финального счета (используется в окне поражения)

    @property(Label)
    victoryScoreLabel: Label = null!; // Label для отображения счета в окне победы (если не указан, используется finalScoreLabel)

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

    @property(AudioClip)
    backgroundMusic: AudioClip = null!; // Фоновая музыка игры

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
    finishColliderWidthScale: number = 0.8; // Множитель ширины коллайдера финиша (0.8 = уменьшение ширины до 80%)

    @property
    finishColliderHeightMultiplier: number = 2.0; // Множитель высоты коллайдера финиша (2.0 = увеличение высоты в 2 раза, особенно вверх)

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

    @property([ParticleEffect])
    victoryParticleEffects: ParticleEffect[] = []; // Массив партикл эффектов при победе (запускаются одновременно)

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
    private firstEnemySpawned: boolean = false; // Флаг, что первый противник уже заспавнен
    private isGamePaused: boolean = false; // Флаг паузы для туториала
    private savedGameSpeed: number = 0; // Сохраненная скорость игры во время паузы
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
        this.bindStartButton();
        this.bindRestartButton();
        this.startScaleLoop();
        
        // Запускаем фоновую музыку при старте приложения (она будет играть постоянно)
        this.playBackgroundMusic();
        
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

    private bindStartButton() {
        if (this.startButton) {
            this.startButton.node.on(Button.EventType.CLICK, this.onStartButtonClick, this);
            console.log('[GameManager] Start button bound');
        } else {
            console.warn('[GameManager] Start button not assigned!');
        }
    }

    private startScaleLoop() {
        if (!this.scaledObject) {
            console.warn('[GameManager] Scaled object not assigned!');
            return;
        }

        const objectNode = this.scaledObject;
        const originalScale = new Vec3(0.05, 0.05, 0.05);
        const minScale = new Vec3(0.04, 0.04, 0.04);

        // Функция для зацикленного скейла
        const scaleLoop = () => {
            tween(objectNode)
                .to(0.5, { scale: minScale }, { easing: easing.sineInOut })
                .to(0.5, { scale: originalScale }, { easing: easing.sineInOut })
                .call(() => {
                    // Повторяем бесконечно
                    scaleLoop();
                })
                .start();
        };

        scaleLoop();
    }

    private onStartButtonClick() {
        console.log('[GameManager] Start button clicked');
        if (this.gameState === GameState.Start) {
            this.startGame();
        }
    }

    private bindRestartButton() {
        if (this.restartButton) {
            this.restartButton.node.on(Button.EventType.CLICK, this.onRestartButtonClick, this);
            console.log('[GameManager] Restart button bound');
        } else {
            console.warn('[GameManager] Restart button not assigned!');
        }

        // Привязываем кнопку рестарта для окна победы
        const victoryRestartBtn = this.victoryRestartButton || this.restartButton;
        if (victoryRestartBtn && victoryRestartBtn !== this.restartButton) {
            // Привязываем только если это другая кнопка
            victoryRestartBtn.node.on(Button.EventType.CLICK, this.onRestartButtonClick, this);
            console.log('[GameManager] Victory restart button bound');
        } else if (!victoryRestartBtn) {
            console.warn('[GameManager] Victory restart button not assigned and restartButton is also null!');
        }
    }

    private onRestartButtonClick() {
        console.log('[GameManager] Restart button clicked');
        if (this.gameState === GameState.Over || this.gameState === GameState.Finish) {
            this.restartGame();
        }
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
        // Если мы на паузе из-за туториала: по первому нажатию снимаем паузу и выполняем прыжок
        if (this.isGamePaused && this.gameState === GameState.Playing) {
            console.log('[GameManager] Continue from enemy tutorial + jump');
            this.resumeGameFromTutorial();
            const pc = this.player?.getComponent(PlayerController);
            if (pc) {
                pc.requestJump();
            }
            return;
        }
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
        this.isGamePaused = false;
        this.firstObstacleSpawned = false;
        this.firstEnemySpawned = false;
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
        
        // Скрываем окно победы
        if (this.victoryScreen) {
            this.victoryScreen.active = false;
            console.log('[GameManager] VictoryScreen deactivated');
        }
        
        // Скрываем обе части окна проигрыша
        if (this.gameOverScreenPart1) {
            this.gameOverScreenPart1.active = false;
        }
        if (this.gameOverScreenPart2) {
            this.gameOverScreenPart2.active = false;
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
        
        // Скрываем окно победы при старте новой игры
        if (this.victoryScreen) {
            this.victoryScreen.active = false;
        }
        
        this.score = 0;
        this.playerHealth = this.maxHealth;
        this.tutorialShown = false;
        this.isGamePaused = false;
        this.firstObstacleSpawned = false;
        this.firstEnemySpawned = false;
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
        console.log('[GameManager] gameOver() called');
        this.gameState = GameState.Over;
        
        // Убеждаемся, что вторая часть скрыта
        if (this.gameOverScreenPart2) {
            this.gameOverScreenPart2.active = false;
        }
        
        // Убеждаемся, что первая часть активна (она должна быть активна по умолчанию)
        if (this.gameOverScreenPart1) {
            this.gameOverScreenPart1.active = true;
        }
        
        // Активируем основной объект GameOverScreen
        if (this.gameOverScreen) {
        this.gameOverScreen.active = true;
            console.log('[GameManager] GameOverScreen activated (Part1 should be active inside)');
            
            // Анимируем спрайт с 0 до 1, если он указан
            if (this.gameOverSprite) {
                console.log('[GameManager] Animating sprite from 0 to 1');
                this.gameOverSprite.setScale(0, 0, 1);
                tween(this.gameOverSprite)
                    .to(this.gameOverAnimationDuration, { 
                        scale: new Vec3(1, 1, 1) 
                    }, { 
                        easing: easing.backOut 
                    })
                    .call(() => {
                        // После завершения анимации переключаемся на вторую часть
                        console.log('[GameManager] Sprite animation completed, switching to part 2');
                        this.showGameOverPart2();
                    })
                    .start();
            } else {
                // Если спрайт не указан, сразу переключаемся на вторую часть
                console.warn('[GameManager] gameOverSprite not assigned, showing part 2 immediately');
                this.showGameOverPart2();
            }
        } else {
            console.error('[GameManager] gameOverScreen not assigned!');
        }
        
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

    private showGameOverPart2() {
        console.log('[GameManager] showGameOverPart2() called');
        
        // Выключаем первую часть
        if (this.gameOverScreenPart1) {
            this.gameOverScreenPart1.active = false;
            console.log('[GameManager] Hiding game over part 1');
        }
        
        // Включаем вторую часть
        if (this.gameOverScreenPart2) {
            this.gameOverScreenPart2.active = true;
            if (this.finalScoreLabel) {
                this.finalScoreLabel.string = `$${Math.floor(this.score)}`;
            }
            console.log('[GameManager] Showing game over part 2');
        } else {
            console.warn('[GameManager] Part 2 not assigned!');
        }
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
        
        // Обновляем текст с очками (в том же формате, что и в окне поражения)
        const scoreLabel = this.victoryScoreLabel || this.finalScoreLabel;
        if (scoreLabel) {
            scoreLabel.string = `$${Math.floor(this.score)}`;
            console.log('[GameManager] Victory score updated:', scoreLabel.string);
        } else {
            console.warn('[GameManager] Neither victoryScoreLabel nor finalScoreLabel is assigned!');
        }
        
        console.log('[Game] Finish reached, score:', this.score);
        
        // Запускаем партикл эффекты при победе
        if (this.victoryParticleEffects && this.victoryParticleEffects.length > 0) {
            // Определяем позицию для партиклов (позиция игрока или финиша)
            let particlePosition: Vec3 | undefined = undefined;
            
            if (this.player && this.player.isValid) {
                // Используем позицию игрока
                particlePosition = this.player.getPosition().clone();
                console.log('[GameManager] Playing victory particle effects at player position:', particlePosition);
            } else if (this.finishLine && this.finishLine.isValid) {
                // Если игрок недоступен, используем позицию финиша
                particlePosition = this.finishLine.getPosition().clone();
                console.log('[GameManager] Playing victory particle effects at finish line position:', particlePosition);
            }
            
            // Запускаем все эффекты одновременно
            for (let i = 0; i < this.victoryParticleEffects.length; i++) {
                const effect = this.victoryParticleEffects[i];
                if (effect && effect.isValid) {
                    effect.play(particlePosition);
                    console.log(`[GameManager] Playing victory particle effect ${i + 1}/${this.victoryParticleEffects.length}`);
                } else {
                    console.warn(`[GameManager] victoryParticleEffects[${i}] is null or invalid!`);
                }
            }
        } else {
            console.warn('[GameManager] victoryParticleEffects array is empty or not assigned!');
        }
        
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
        // Проверяем приближение к противнику для показа туториала
        if (this.tutorialShown || this.isGamePaused || this.enemies.length === 0 || !this.firstEnemySpawned) {
            return;
        }

        // Находим ближайшего противника
        const scene = director.getScene();
        if (!scene) return;
        const canvasNode = scene.getChildByName('Canvas');
        if (!canvasNode) return;
        const canvasTransform = canvasNode.getComponent(UITransform);
        if (!canvasTransform) return;
        const screenWidth = canvasTransform.width;
        const playerPos = this.player ? this.player.getPosition() : null;
        if (!playerPos) return;

        // Ищем первого противника, который приближается к игроку
        // Упрощенная логика: показываем туториал как только противник появился и находится справа от игрока на умеренной дистанции
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (!enemy || !enemy.isValid) continue;

            const enemyPos = enemy.getPosition();
            const distanceToPlayer = Math.abs(enemyPos.x - playerPos.x);
            
            // Упрощенное условие: противник справа от игрока и на умеренной дистанции (25..150)
            // Область обнаружения уменьшена в 2 раза для более точного срабатывания
            if (enemyPos.x > playerPos.x && distanceToPlayer > 25 && distanceToPlayer < 150) {
                console.log('[GameManager] Tutorial trigger (near): enemy at', enemyPos.x, 'player at', playerPos.x, 'distance:', distanceToPlayer);
                this.pauseGameForTutorial();
                return;
            }
        }
    }

    private pauseGameForTutorial() {
        if (this.isGamePaused) return;

        console.log('[GameManager] Pausing game for tutorial');
        this.isGamePaused = true;
                    this.tutorialShown = true;

        // Сохраняем текущую скорость
        this.savedGameSpeed = this.gameSpeed;
        this.gameSpeed = 0;

        // Останавливаем прокрутку фона
        const backgroundNode = this.getBackgroundNode();
        if (backgroundNode) {
            const scroller = backgroundNode.getComponent(BackgroundScroller);
            if (scroller) {
                scroller.stopScrolling();
            }
        }

        // Показываем объект-попап (если задан). Продолжение: следующий тап/SPACE обработает handlePrimaryAction()
        console.log('[GameManager] pauseGameForTutorial: enemyTutorialPopup =', this.enemyTutorialPopup);
        if (this.enemyTutorialPopup) {
            console.log('[GameManager] Activating enemyTutorialPopup:', this.enemyTutorialPopup.name, 'isValid:', this.enemyTutorialPopup.isValid);
            
            // Убеждаемся, что родительские объекты тоже активны
            let parent = this.enemyTutorialPopup.parent;
            let parentChain = [];
            while (parent) {
                parentChain.push(parent.name + ' (active: ' + parent.active + ')');
                if (!parent.active) {
                    console.log('[GameManager] Activating parent:', parent.name);
                    parent.active = true;
                }
                parent = parent.parent;
            }
            console.log('[GameManager] Parent chain:', parentChain.join(' -> '));
            
            // Активируем сам объект
            this.enemyTutorialPopup.active = true;
            
            // Проверяем результат
            console.log('[GameManager] enemyTutorialPopup activated, active:', this.enemyTutorialPopup.active, 'isValid:', this.enemyTutorialPopup.isValid);
        } else {
            console.error('[GameManager] enemyTutorialPopup is null! Trying fallback TutorialUI...');
            // Fallback на старый TutorialUI (если нужен)
            const tutorialUI = this.node.getComponentInChildren(TutorialUI);
            if (tutorialUI) {
                console.log('[GameManager] Using TutorialUI fallback');
                tutorialUI.showTutorial(() => {
                    this.resumeGameFromTutorial();
                });
            } else {
                console.error('[GameManager] enemyTutorialPopup and TutorialUI not found!');
            }
        }
    }

    private resumeGameFromTutorial() {
        if (!this.isGamePaused) return;

        console.log('[GameManager] Resuming game from tutorial');
        this.isGamePaused = false;

        // Скрываем объект-попап
        if (this.enemyTutorialPopup) {
            this.enemyTutorialPopup.active = false;
        }

        // Восстанавливаем скорость игры
        this.gameSpeed = this.savedGameSpeed;

        // Возобновляем прокрутку фона
        const backgroundNode = this.getBackgroundNode();
        if (backgroundNode) {
            const scroller = backgroundNode.getComponent(BackgroundScroller);
            if (scroller) {
                scroller.setScrollSpeed(this.gameSpeed);
                scroller.startScrolling();
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
        
        // Отмечаем, что первый противник заспавнен
        if (!this.firstEnemySpawned) {
            this.firstEnemySpawned = true;
            console.log('[GameManager] First enemy spawned');
        }
        
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
        // Не проверяем коллизии во время паузы (туториал)
        if (this.isGamePaused) {
            return;
        }
        
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
                
                // Настраиваем коллайдер финиша: ширина с помощью finishColliderWidthScale, высота с помощью finishColliderHeightMultiplier
                const finishWidth = baseFinishWidth * this.finishColliderWidthScale;
                const finishHeight = baseFinishHeight * this.finishColliderHeightMultiplier;

                // Смещаем коллайдер вверх, чтобы он лучше улавливал игрока, который может быть выше финиша
                // Центр коллайдера смещается вверх на половину дополнительной высоты
                const heightOffset = (finishHeight - baseFinishHeight) / 2;

                const finishRect = {
                    x: finishPos.x - finishWidth / 2,
                    y: finishPos.y - finishHeight / 2 + heightOffset, // Смещаем вверх
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

        // Если игра на паузе (туториал), не обновляем игру
        if (this.isGamePaused) {
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

        // Проверка туториала (ПЕРЕД проверкой коллизий, чтобы успеть остановить игру)
        this.checkTutorial();

        // Проверка коллизий
        this.checkCollisions();

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

    /**
     * Воспроизводит фоновую музыку (запускается один раз при старте приложения)
     */
    private playBackgroundMusic() {
        if (!this.backgroundMusic) {
            console.warn('[GameManager] backgroundMusic not assigned!');
            return;
        }

        let audioSource = this.getComponent(AudioSource);
        if (!audioSource) {
            // Если AudioSource нет на GameManager, пытаемся найти в сцене или создать
            const scene = director.getScene();
            if (scene) {
                const canvasNode = scene.getChildByName('Canvas');
                if (canvasNode) {
                    audioSource = canvasNode.getComponent(AudioSource);
                    if (!audioSource) {
                        // Создаем AudioSource на Canvas, если его нет
                        audioSource = canvasNode.addComponent(AudioSource);
                    }
                }
            }
        }

        if (audioSource) {
            // Проверяем, не играет ли уже музыка
            if (audioSource.playing && audioSource.clip === this.backgroundMusic) {
                console.log('[GameManager] Background music is already playing');
                return;
            }
            
            audioSource.clip = this.backgroundMusic;
            audioSource.loop = true; // Зацикливаем музыку
            audioSource.volume = this.isMuted ? 0 : 1;
            audioSource.play();
            console.log('[GameManager] Background music started');
        } else {
            console.error('[GameManager] Could not find or create AudioSource for background music!');
        }
    }

    /**
     * Останавливает фоновую музыку
     */
    private stopBackgroundMusic() {
        let audioSource = this.getComponent(AudioSource);
        if (!audioSource) {
            const scene = director.getScene();
            if (scene) {
                const canvasNode = scene.getChildByName('Canvas');
                if (canvasNode) {
                    audioSource = canvasNode.getComponent(AudioSource);
                }
            }
        }

        if (audioSource && audioSource.playing) {
            audioSource.stop();
            console.log('[GameManager] Background music stopped');
        }
    }
}
