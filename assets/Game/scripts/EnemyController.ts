import { _decorator, Component, Animation, AnimationClip } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EnemyController')
export class EnemyController extends Component {
    @property(AnimationClip)
    runAnimation: AnimationClip = null!;

    private animation: Animation | null = null;

    start() {
        // Получаем компонент Animation
        this.animation = this.node.getComponent(Animation);
        if (!this.animation) {
            console.warn('[EnemyController] Animation component not found!');
        } else {
            console.log('[EnemyController] Animation component found');
            // Запускаем анимацию бега
            this.playRun();
        }
    }

    /**
     * Воспроизводит анимацию Run
     */
    public playRun() {
        if (!this.animation || !this.runAnimation) {
            return;
        }
        this.animation.play(this.runAnimation.name);
        console.log('[EnemyController] Playing Run animation');
    }
}
