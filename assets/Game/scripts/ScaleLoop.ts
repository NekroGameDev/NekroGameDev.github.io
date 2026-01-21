import { _decorator, Component, Vec3, tween, easing } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ScaleLoop')
export class ScaleLoop extends Component {
    @property
    minScale: number = 0.9; // Минимальный масштаб

    @property
    maxScale: number = 1.0; // Максимальный масштаб

    @property
    duration: number = 1.0; // Длительность одного цикла в секундах

    @property
    enabled: boolean = true; // Включен ли компонент

    private originalScale: Vec3 = new Vec3(1, 1, 1);
    private isPlaying: boolean = false;

    start() {
        this.originalScale = this.node.getScale().clone();
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
     * Запускает зацикленный скейл
     */
    public startLoop() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.scaleLoop();
    }

    /**
     * Останавливает зацикленный скейл
     */
    public stopLoop() {
        this.isPlaying = false;
        tween(this.node).stop();
    }

    private scaleLoop() {
        if (!this.isPlaying) return;

        const minScaleVec = new Vec3(this.minScale, this.minScale, this.originalScale.z);
        const maxScaleVec = new Vec3(this.maxScale, this.maxScale, this.originalScale.z);

        tween(this.node)
            .to(this.duration / 2, { scale: minScaleVec }, { easing: easing.sineInOut })
            .to(this.duration / 2, { scale: maxScaleVec }, { easing: easing.sineInOut })
            .call(() => {
                if (this.isPlaying) {
                    this.scaleLoop();
                }
            })
            .start();
    }
}
