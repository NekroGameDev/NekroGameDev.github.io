import { _decorator, Component, Vec3, tween, easing, director, UITransform, view, Animation, AnimationClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {
    @property
    jumpHeight: number = 200;

    @property
    jumpDuration: number = 0.5;

    @property
    groundOffset: number = 150;

    @property(AnimationClip)
    idleAnimation: AnimationClip = null!;

    @property(AnimationClip)
    runAnimation: AnimationClip = null!;

    @property(AnimationClip)
    jumpAnimation: AnimationClip = null!;

    private isJumping: boolean = false;
    private groundY: number = 0;
    private startY: number = 0;
    private isGroundReady: boolean = false;
    private animation: Animation | null = null;
    private currentAnimationState: string = '';

    start() {
        console.log('[PlayerController] start() called');
        // UI размеры Canvas иногда готовы не в тот же кадр — пробуем и дальше в update()
        this.tryInitGround();
        
        // Получаем компонент Animation
        this.animation = this.node.getComponent(Animation);
        if (!this.animation) {
            console.warn('[PlayerController] Animation component not found!');
        } else {
            console.log('[PlayerController] Animation component found');
            // По умолчанию играем Idle анимацию
            this.playIdle();
        }
    }

    private tryInitGround() {
        // Player находится в Canvas (UI), используем локальные координаты
        let canvasNode = this.node.parent;
        console.log('[PlayerController] tryInitGround, parent:', canvasNode?.name);
        
        // Если Player не в Canvas, ищем Canvas в сцене
        if (!canvasNode || canvasNode.name !== 'Canvas') {
            console.log('[PlayerController] Parent is not Canvas, searching in scene');
            const scene = director.getScene();
            if (!scene) {
                console.error('[PlayerController] Scene is null!');
                return;
            }
            canvasNode = scene.getChildByName('Canvas');
            if (!canvasNode) {
                console.error('[PlayerController] Canvas node not found in scene!');
                return;
            }
            console.log('[PlayerController] Canvas found in scene');
        }

        const visibleHeight = view.getVisibleSize().height;
        if (visibleHeight <= 0) {
            console.log('[PlayerController] Visible height is 0, waiting...');
            return;
        }

        // Для UI элементов используем локальные координаты относительно Canvas
        // groundY = нижний край экрана + отступ
        this.groundY = -visibleHeight / 2 + this.groundOffset;
        this.startY = this.groundY;
        this.isGroundReady = true;

        // Используем локальные координаты
        const currentPos = this.node.getPosition();
        this.node.setPosition(currentPos.x, this.groundY, 0);
        console.log('[Player] Ground initialized at', this.groundY);
    }

    jump() {
        if (!this.isGroundReady) {
            console.warn('[PlayerController] jump() called but ground not ready');
            return;
        }
        if (this.isJumping) {
            console.log('[PlayerController] jump() called but already jumping');
            return;
        }

        console.log('[PlayerController] Starting jump from', this.groundY, 'to', this.groundY + this.jumpHeight);
        this.isJumping = true;
        
        // Переключаем на анимацию прыжка
        this.playJump();
        
        const currentPos = this.node.getPosition();
        const targetY = this.groundY + this.jumpHeight;

        // Прыжок вверх (используем локальные координаты)
        tween(this.node)
            .to(this.jumpDuration / 2, { position: new Vec3(currentPos.x, targetY, 0) }, { easing: easing.quadOut })
            .call(() => {
                // Падение вниз
                const posAfterJump = this.node.getPosition();
                tween(this.node)
                    .to(this.jumpDuration / 2, { position: new Vec3(posAfterJump.x, this.groundY, 0) }, { easing: easing.quadIn })
                    .call(() => {
                        this.isJumping = false;
                        // После прыжка возвращаемся к бегу (если игра идет)
                        this.playRun();
                    })
                    .start();
            })
            .start();
    }

    /**
     * Дергается из GameManager: первый тап — старт, дальше тап = прыжок.
     */
    public requestJump() {
        console.log('[PlayerController] requestJump() called, isGroundReady:', this.isGroundReady, 'isJumping:', this.isJumping);
        this.jump();
    }

    update() {
        if (!this.isGroundReady) {
            this.tryInitGround();
            return;
        }

        // Защита от "падения": пока не прыгаем — держим игрока на земле
        // Используем локальные координаты для UI элементов
        const currentPos = this.node.getPosition();
        if (!this.isJumping && Math.abs(currentPos.y - this.groundY) > 0.1) {
            this.node.setPosition(currentPos.x, this.groundY, 0);
        }
    }

    /**
     * Воспроизводит анимацию Idle
     */
    public playIdle() {
        if (!this.animation || !this.idleAnimation) {
            return;
        }
        if (this.currentAnimationState === 'idle') {
            return; // Уже играет
        }
        this.animation.play(this.idleAnimation.name);
        this.currentAnimationState = 'idle';
        console.log('[PlayerController] Playing Idle animation');
    }

    /**
     * Воспроизводит анимацию Run
     */
    public playRun() {
        if (!this.animation || !this.runAnimation) {
            return;
        }
        if (this.isJumping) {
            return; // Не переключаем на бег во время прыжка
        }
        if (this.currentAnimationState === 'run') {
            return; // Уже играет
        }
        this.animation.play(this.runAnimation.name);
        this.currentAnimationState = 'run';
        console.log('[PlayerController] Playing Run animation');
    }

    /**
     * Воспроизводит анимацию Jump
     */
    public playJump() {
        if (!this.animation || !this.jumpAnimation) {
            return;
        }
        if (this.currentAnimationState === 'jump') {
            return; // Уже играет
        }
        this.animation.play(this.jumpAnimation.name);
        this.currentAnimationState = 'jump';
        console.log('[PlayerController] Playing Jump animation');
    }

    /**
     * Проверяет, прыгает ли игрок в данный момент
     */
    public getIsJumping(): boolean {
        return this.isJumping;
    }
}
