import { _decorator, Component, Node, Button, Sprite, SpriteFrame, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MuteButton')
export class MuteButton extends Component {
    @property(SpriteFrame)
    muteIcon: SpriteFrame = null!;

    @property(SpriteFrame)
    unmuteIcon: SpriteFrame = null!;

    private isMuted: boolean = false;
    private sprite: Sprite = null!;

    start() {
        const button = this.node.getComponent(Button);
        if (button) {
            button.node.on(Button.EventType.CLICK, this.onClick, this);
        }

        this.sprite = this.node.getComponent(Sprite);
        if (this.sprite && this.unmuteIcon) {
            this.sprite.spriteFrame = this.unmuteIcon;
        }
    }

    onClick() {
        this.isMuted = !this.isMuted;

        if (this.sprite) {
            this.sprite.spriteFrame = this.isMuted ? this.muteIcon : this.unmuteIcon;
        }

        // Уведомляем GameManager
        const scene = director.getScene();
        if (!scene) return;
        const gameManager = scene.getComponentInChildren('GameManager' as any);
        if (gameManager && typeof gameManager.toggleMute === 'function') {
            gameManager.toggleMute();
        }
    }
}
