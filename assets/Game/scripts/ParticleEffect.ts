import { _decorator, Component, Node, SpriteFrame, Sprite, UITransform, Vec3, tween, easing, Color } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Компонент для создания партикл эффекта из случайных SpriteFrame
 * Частицы выстреливают вверх с разными скоростями и направлениями
 */
@ccclass('ParticleEffect')
export class ParticleEffect extends Component {
    @property([SpriteFrame])
    spriteFrames: SpriteFrame[] = []; // Массив SpriteFrame для случайного выбора

    @property
    particleCount: number = 30; // Количество частиц

    @property
    minSpeed: number = 300; // Минимальная скорость частиц (пикселей в секунду)

    @property
    maxSpeed: number = 600; // Максимальная скорость частиц (пикселей в секунду)

    @property
    spreadAngle: number = 45; // Угол разброса частиц в градусах (от вертикали вверх)

    @property
    minLifetime: number = 0.8; // Минимальное время жизни частицы (секунды)

    @property
    maxLifetime: number = 1.5; // Максимальное время жизни частицы (секунды)

    @property
    minScale: number = 0.5; // Минимальный размер частицы

    @property
    maxScale: number = 1.2; // Максимальный размер частицы

    @property
    gravity: number = -200; // Гравитация (отрицательное значение = вниз)

    @property
    fadeOutDuration: number = 0.3; // Длительность затухания в конце жизни (секунды)

    private particles: Node[] = []; // Массив созданных частиц
    private particleContainer: Node | null = null; // Контейнер для частиц

    start() {
        // Создаем контейнер для частиц, если его нет
        if (!this.particleContainer) {
            this.particleContainer = new Node('ParticleContainer');
            this.node.addChild(this.particleContainer);
        }
    }

    /**
     * Запускает партикл эффект из указанной позиции
     * @param position Позиция, из которой вылетают частицы (в локальных координатах родителя)
     */
    public play(position?: Vec3) {
        if (!this.spriteFrames || this.spriteFrames.length === 0) {
            console.warn('[ParticleEffect] No sprite frames assigned!');
            return;
        }

        // Очищаем предыдущие частицы
        this.clearParticles();

        // Создаем контейнер, если его нет
        if (!this.particleContainer) {
            this.particleContainer = new Node('ParticleContainer');
            this.node.addChild(this.particleContainer);
        }

        const startPos = position || Vec3.ZERO;

        // Создаем частицы
        for (let i = 0; i < this.particleCount; i++) {
            this.createParticle(startPos, i);
        }
    }

    /**
     * Создает одну частицу
     */
    private createParticle(startPos: Vec3, index: number) {
        // Выбираем случайный SpriteFrame
        const randomFrameIndex = Math.floor(Math.random() * this.spriteFrames.length);
        const spriteFrame = this.spriteFrames[randomFrameIndex];

        if (!spriteFrame) {
            console.warn('[ParticleEffect] Invalid sprite frame at index', randomFrameIndex);
            return;
        }

        // Создаем узел для частицы
        const particle = new Node(`Particle_${index}`);
        this.particleContainer!.addChild(particle);

        // Добавляем Sprite компонент
        const sprite = particle.addComponent(Sprite);
        sprite.spriteFrame = spriteFrame;

        // Получаем или добавляем UITransform для размера (он может уже существовать)
        let transform = particle.getComponent(UITransform);
        if (!transform) {
            transform = particle.addComponent(UITransform);
        }
        transform.setContentSize(spriteFrame.width, spriteFrame.height);

        // Устанавливаем начальную позицию
        particle.setPosition(startPos);

        // Случайный размер
        const scale = this.minScale + Math.random() * (this.maxScale - this.minScale);
        particle.setScale(scale, scale, 1);

        // Случайное время жизни
        const lifetime = this.minLifetime + Math.random() * (this.maxLifetime - this.minLifetime);

        // Случайная скорость
        const speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);

        // Случайный угол (от вертикали вверх с разбросом)
        const angleRange = this.spreadAngle * Math.PI / 180; // Конвертируем в радианы
        const angle = Math.PI / 2 + (Math.random() - 0.5) * angleRange * 2; // PI/2 = вверх, добавляем разброс

        // Вычисляем направление движения
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        // Вычисляем конечную позицию (с учетом гравитации)
        // Используем физику: x = x0 + vx*t, y = y0 + vy*t + 0.5*g*t^2
        const finalX = startPos.x + velocityX * lifetime;
        const finalY = startPos.y + velocityY * lifetime + 0.5 * this.gravity * lifetime * lifetime;

        // Случайное вращение
        const rotationSpeed = (Math.random() - 0.5) * 720; // От -360 до +360 градусов в секунду
        const finalRotation = rotationSpeed * lifetime;

        // Анимация движения и вращения
        tween(particle)
            .to(lifetime, {
                position: new Vec3(finalX, finalY, 0),
                eulerAngles: new Vec3(0, 0, finalRotation)
            }, {
                easing: easing.sineOut
            })
            .start();

        // Анимация затухания в конце
        const fadeStartTime = lifetime - this.fadeOutDuration;
        if (fadeStartTime > 0) {
            tween(particle)
                .delay(fadeStartTime)
                .to(this.fadeOutDuration, {
                    // Затухание через изменение альфа канала
                }, {
                    onUpdate: (target: Node, ratio: number) => {
                        const sprite = target.getComponent(Sprite);
                        if (sprite) {
                            const color = sprite.color.clone();
                            color.a = Math.floor(255 * (1 - ratio));
                            sprite.color = color;
                        }
                    },
                    easing: easing.sineIn
                })
                .call(() => {
                    // Удаляем частицу после завершения анимации
                    if (particle && particle.isValid) {
                        particle.destroy();
                    }
                })
                .start();
        } else {
            // Если время жизни слишком короткое, просто удаляем через lifetime
            this.scheduleOnce(() => {
                if (particle && particle.isValid) {
                    particle.destroy();
                }
            }, lifetime);
        }

        this.particles.push(particle);
    }

    /**
     * Очищает все частицы
     */
    public clearParticles() {
        if (this.particleContainer) {
            this.particleContainer.destroyAllChildren();
        }
        this.particles = [];
    }

    onDestroy() {
        this.clearParticles();
    }
}
