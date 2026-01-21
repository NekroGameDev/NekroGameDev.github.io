import { _decorator, Component, Node, Label, tween, Vec3, easing, input, Input, EventKeyboard, KeyCode } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TutorialUI')
export class TutorialUI extends Component {
    @property(Label)
    tutorialLabel: Label = null!;

    @property(Node)
    tutorialWindow: Node = null!; // Окно туториала (если не указано, используется tutorialLabel.node)

    private isShown: boolean = false;
    private onContinueCallback: (() => void) | null = null;

    start() {
        const window = this.tutorialWindow || (this.tutorialLabel ? this.tutorialLabel.node : null);
        if (window) {
            window.active = false;
        }
        if (this.tutorialLabel) {
            this.tutorialLabel.string = 'Tap or press SPACE to jump over enemies!';
        }
    }

    showTutorial(onContinue: () => void) {
        if (this.isShown) return;

        this.isShown = true;
        this.onContinueCallback = onContinue;

        const window = this.tutorialWindow || (this.tutorialLabel ? this.tutorialLabel.node : null);
        if (!window) {
            console.warn('[TutorialUI] No tutorial window or label found!');
            this.isShown = false;
            if (onContinue) onContinue();
            return;
        }

        window.active = true;
        window.setScale(0, 0, 1);

        // Плавное появление
        tween(window)
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
            .call(() => {
                // Ждем ввода от пользователя
                this.setupInput();
            })
            .start();
    }

    private setupInput() {
        // Обработка нажатия на экран
        input.once(Input.EventType.TOUCH_START, this.onInput, this);
        
        // Обработка нажатия пробела
        input.once(Input.EventType.KEY_DOWN, (event: EventKeyboard) => {
            if (event.keyCode === KeyCode.SPACE) {
                this.onInput();
            }
        }, this);
    }

    private onInput() {
        if (!this.isShown) return;

        const window = this.tutorialWindow || (this.tutorialLabel ? this.tutorialLabel.node : null);
        if (!window) return;

        // Плавное исчезновение
        tween(window)
            .to(0.3, { scale: new Vec3(0, 0, 1) }, { easing: easing.backIn })
            .call(() => {
                window.active = false;
                this.isShown = false;
                
                // Вызываем callback для продолжения игры
                if (this.onContinueCallback) {
                    this.onContinueCallback();
                    this.onContinueCallback = null;
                }
            })
            .start();
    }

    hideTutorial() {
        if (!this.isShown) return;

        const window = this.tutorialWindow || (this.tutorialLabel ? this.tutorialLabel.node : null);
        if (!window || !window.active) return;

        // Отменяем обработчики ввода
        input.off(Input.EventType.TOUCH_START, this.onInput, this);
        input.off(Input.EventType.KEY_DOWN, this.onInput, this);

        tween(window)
            .to(0.3, { scale: new Vec3(0, 0, 1) }, { easing: easing.backIn })
            .call(() => {
                window.active = false;
                this.isShown = false;
                this.onContinueCallback = null;
            })
            .start();
    }
}
