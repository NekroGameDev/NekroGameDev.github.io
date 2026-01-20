import { _decorator, Component, Node, Label, tween, Vec3, easing } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TutorialUI')
export class TutorialUI extends Component {
    @property(Label)
    tutorialLabel: Label = null!;

    private isShown: boolean = false;

    start() {
        if (this.tutorialLabel) {
            this.tutorialLabel.node.active = false;
            this.tutorialLabel.string = 'Jump to avoid enemies';
        }
    }

    showTutorial() {
        if (this.isShown || !this.tutorialLabel) return;

        this.isShown = true;
        this.tutorialLabel.node.active = true;
        this.tutorialLabel.node.setScale(0, 0, 1);

        // Плавное появление
        tween(this.tutorialLabel.node)
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
            .delay(3)
            .to(0.3, { scale: new Vec3(0, 0, 1) }, { easing: easing.backIn })
            .call(() => {
                this.tutorialLabel.node.active = false;
            })
            .start();
    }

    hideTutorial() {
        if (!this.tutorialLabel || !this.tutorialLabel.node.active) return;

        tween(this.tutorialLabel.node)
            .to(0.3, { scale: new Vec3(0, 0, 1) }, { easing: easing.backIn })
            .call(() => {
                this.tutorialLabel.node.active = false;
            })
            .start();
    }
}
