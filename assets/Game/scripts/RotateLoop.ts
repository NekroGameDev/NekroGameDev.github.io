import { _decorator, Component, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RotateLoop')
export class RotateLoop extends Component {
    @property
    rotationSpeed: number = 360; // Скорость вращения в градусах в секунду

    @property
    direction: number = 1; // Направление вращения: 1 = по часовой, -1 = против часовой

    @property
    enabled: boolean = true; // Включен ли компонент

    private isPlaying: boolean = false;
    private currentRotation: number = 0;

    start() {
        const currentEuler = this.node.eulerAngles;
        this.currentRotation = currentEuler.z;
        if (this.enabled) {
            this.startLoop();
        }
    }

    onEnable() {
        if (this.enabled && !this.isPlaying) {
            this.startLoop();
        }
    }

    onDisable() {
        this.stopLoop();
    }

    /**
     * Запускает зацикленное вращение
     */
    public startLoop() {
        this.isPlaying = true;
    }

    /**
     * Останавливает зацикленное вращение
     */
    public stopLoop() {
        this.isPlaying = false;
    }

    update(deltaTime: number) {
        if (!this.isPlaying) return;

        // Непрерывно вращаем объект
        const rotationDelta = this.rotationSpeed * this.direction * deltaTime;
        this.currentRotation += rotationDelta;
        
        // Нормализуем угол, чтобы избежать переполнения
        this.currentRotation = this.currentRotation % 360;
        
        // Применяем вращение
        const currentEuler = this.node.eulerAngles;
        this.node.eulerAngles = new Vec3(
            currentEuler.x,
            currentEuler.y,
            this.currentRotation
        );
    }
}
