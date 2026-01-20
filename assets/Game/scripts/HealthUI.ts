import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Vec3, tween, easing } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HealthUI')
export class HealthUI extends Component {
    @property(SpriteFrame)
    heartSprite: SpriteFrame = null!;

    @property
    heartSpacing: number = 30;

    private hearts: Node[] = [];
    private maxHealth: number = 3;

    start() {
        this.initHearts();
    }

    initHearts() {
        // Очищаем существующие сердца
        this.node.removeAllChildren();
        this.hearts = [];

        // Создаем сердца
        for (let i = 0; i < this.maxHealth; i++) {
            const heart = new Node('Heart');
            const sprite = heart.addComponent(Sprite);
            sprite.spriteFrame = this.heartSprite;
            
            let transform = heart.getComponent(UITransform);
            if (!transform) {
                transform = heart.addComponent(UITransform);
            }
            transform.width = 30;
            transform.height = 30;

            heart.setPosition(i * this.heartSpacing, 0, 0);
            this.node.addChild(heart);
            this.hearts.push(heart);
        }
    }

    updateHealth(currentHealth: number, maxHealth: number) {
        this.maxHealth = maxHealth;

        // Обновляем количество сердец
        while (this.hearts.length < maxHealth) {
            const heart = new Node('Heart');
            const sprite = heart.addComponent(Sprite);
            sprite.spriteFrame = this.heartSprite;
            
            let transform = heart.getComponent(UITransform);
            if (!transform) {
                transform = heart.addComponent(UITransform);
            }
            transform.width = 30;
            transform.height = 30;

            heart.setPosition(this.hearts.length * this.heartSpacing, 0, 0);
            this.node.addChild(heart);
            this.hearts.push(heart);
        }

        // Обновляем видимость сердец
        console.log('[HealthUI] updateHealth called, currentHealth:', currentHealth, 'maxHealth:', maxHealth, 'hearts count:', this.hearts.length);
        
        for (let i = 0; i < this.hearts.length; i++) {
            const heart = this.hearts[i];
            if (!heart || !heart.isValid) continue;
            
            if (i < currentHealth) {
                // Сердце должно быть видимым
                heart.active = true;
                const sprite = heart.getComponent(Sprite);
                if (sprite) {
                    sprite.enabled = true;
                }
                // Плавное появление
                tween(heart)
                    .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
                    .start();
            } else {
                // Сердце должно быть скрыто
                // Сразу скрываем спрайт для мгновенной обратной связи
                const sprite = heart.getComponent(Sprite);
                if (sprite) {
                    sprite.enabled = false;
                }
                // Плавное исчезновение
                tween(heart)
                    .to(0.3, { scale: new Vec3(0.5, 0.5, 1) }, { easing: easing.backIn })
                    .call(() => {
                        heart.active = false;
                    })
                    .start();
            }
        }
        
        console.log('[HealthUI] Health updated, visible hearts:', currentHealth);
    }
}
