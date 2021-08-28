import { soundPlayer } from "./Audio";
import { memoizedBackgroundPattern } from "./Background";
import { WORLD_SIZE, GRAVITY, TERMINAL_VELOCITY, STEPS_PER_MILISECOND, SPEED_UNIT, scene as scene, context, keyboard, JUMP_SPEED, ACCELERATION_UNIT } from "./Globals";
import { between, sign } from "./Helpers";
import { LocalStorage } from "./LocalStorage";
import { activateMenu, fadeInTransition, fadeOutTransition, waitNextFrame } from "./Main";
import { Vector2D } from "./Vectorial";

abstract class GameObject {
    position: Vector2D = new Vector2D();

    get bottom() {
        return this.position.y + this.height;
    }

    get right() {
        return this.position.x + this.width;
    }

    get left() {
        return this.position.x;
    }

    get top() {
        return this.position.y;
    }

    boundBoxCollision(other: GameObject) {
        return this.right > other.left
            && this.left < other.right
            && this.bottom > other.top
            && this.top < other.bottom;
    }

    abstract get width(): number;
    abstract get height(): number;
}

class ScreenArea extends GameObject {
    width: number = 1000;
    height: number = 1000;
    speed: number = -50 * SPEED_UNIT;
    speedBoost: number = 0;
}

class RoundShape {
    width: number;
    begin: Vector2D;
    end: Vector2D;
    light = '#fff';
    shadow = '#999';

    constructor(x1: number, y1: number, x2: number, y2: number, width: number) {
        this.width = width;
        this.begin = new Vector2D(x1, y1);
        this.end = new Vector2D(x2, y2);
    }
}

const drawRoundShapeLight = (roundShape: RoundShape) => {
    context.save();

    context.strokeStyle = roundShape.light;
    const log = Math.log(roundShape.width * 4.4) / 1.8;
    context.translate(-0.07 * log, -0.07 * log);
    context.lineWidth = log;
    context.beginPath();
    context.moveTo(roundShape.begin.x, roundShape.begin.y);
    context.lineTo(roundShape.end.x, roundShape.end.y);
    context.stroke();

    context.restore();
};

const drawRoundShape = (roundShape: RoundShape) => {
    context.strokeStyle = roundShape.shadow;
    context.lineWidth = roundShape.width;
    context.beginPath();
    context.moveTo(roundShape.begin.x, roundShape.begin.y);
    context.lineTo(roundShape.end.x, roundShape.end.y);
    context.stroke();
};

export class Player extends GameObject {
    speed: Vector2D = new Vector2D();
    width: number = 70;
    height: number = 150;
    direction: number = 1;
    rocket: boolean = false;

    rocketParticles = new Set<any>();

    legGap = 0.25;
    armGap = 0.5;

    body = new RoundShape(0, 0.1, 0, 0.101, 1.0);
    leftLeg = new RoundShape(-this.legGap * 0.9, 0.3, -this.legGap, 0.8, 0.4);
    rightLeg = new RoundShape(this.legGap * 0.9, 0.3, this.legGap, 0.8, 0.4);
    head = new RoundShape(0, -0.5, 0, -0.501, 1.0);
    leftArm = new RoundShape(-this.armGap * 0.8, -0.1, -this.armGap, 0.3, 0.4);
    rightArm = new RoundShape(this.armGap * 0.8, -0.1, this.armGap, 0.3, 0.4);

    animationState = {
        legsRotation: -Math.PI / 2,
        armsRotation: -Math.PI / 2,
    };

    animationSpeed = {
        legsRotation: 50 * SPEED_UNIT,
        armsRotation: 50 * SPEED_UNIT,
    };

    restAnimation = [
        { legsRotation: -Math.PI / 2 - 0.1, armsRotation: -Math.PI / 2 - 0.1 },
    ];
    runAnimation = [
        { legsRotation: -Math.PI / 2 - 0.6, armsRotation: -Math.PI / 2 + 0.6 },
        { legsRotation: -Math.PI / 2 + 0.6, armsRotation: -Math.PI / 2 - 0.6 },
    ];
    jumpAnimation = [
        { legsRotation: -Math.PI / 2 - 0.8, armsRotation: -Math.PI / 2 + 1.2 },
        { goTo: 'fallingAnimation' },
    ];
    fallingAnimation = [
        { legsRotation: -Math.PI / 2 - 0.2, armsRotation: -Math.PI / 2 - 2.2 },
        { legsRotation: -Math.PI / 2 - 0.3, armsRotation: -Math.PI / 2 - 2.5 },
    ];
    risingAnimation = [
        { legsRotation: -Math.PI / 2 - 0.1, armsRotation: -Math.PI / 2 - 0.1 },
        { legsRotation: -Math.PI / 2 - 0.3, armsRotation: -Math.PI / 2 - 0.3 },
    ];

    animation: any = this.restAnimation;
    currentFrame = 0;

    updateAnimation() {
        if (this.currentFrame >= this.animation.length) {
            this.currentFrame = 0;
        }

        if (this.animation[this.currentFrame].goTo) {
            this.animation = this[this.animation[this.currentFrame].goTo];
            this.currentFrame = 0;
        }

        let reachedFrame = true;
        const animationTarget = this.animation[this.currentFrame];
        for (const key in this.animationState) {
            if (Math.abs(animationTarget[key] - this.animationState[key]) < this.animationSpeed[key]) {
                this.animationState[key] = animationTarget[key];
            } else {
                reachedFrame = false;
                this.animationState[key] += this.animationSpeed[key] * sign(animationTarget[key] - this.animationState[key]);
            }
        }

        if (reachedFrame) {
            this.currentFrame++;
        }
    }

    render() {
        context.save();

        if (this.rocket) {
            for (let i = 0; i < 30; i++) {
                this.rocketParticles.add({
                    speed: {
                        x: (0.5 - Math.random()) * 3,
                        y: 10,
                    },
                    x: this.position.x + this.width / 2,
                    y: i + this.position.y + this.height / 2,
                    time: 0,
                });
            }

            if (this.speed.y >= 0) {
                this.rocket = false;
            }
        }

        const particleLifeTime = 20;
        for (const particle of this.rocketParticles) {
            const progress =particle.time / particleLifeTime;
            context.lineWidth = 40 * (1 - Math.abs(0.3 - progress));
            context.lineCap = 'round';
            const yellow = 255 * Math.min(1, 1 - 2 * progress);
            const decay = Math.max(0, Math.min(1, 1 - progress));
            context.strokeStyle = `rgba(${255 * decay}, ${yellow * decay}, 0, ${0.1 * decay})`;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(particle.x, particle.y + 0.1);
            context.stroke();

            particle.time++;
            particle.x += particle.speed.x;
            particle.y += particle.speed.y;
            if (progress >= 1) {
                this.rocketParticles.delete(particle);
            }
        }

        this.updateAnimation();
        this.leftLeg.end.x = this.leftLeg.begin.x + 0.5 * Math.cos(this.animationState.legsRotation);
        this.leftLeg.end.y = this.leftLeg.begin.y - 0.5 * Math.sin(this.animationState.legsRotation);
        this.rightLeg.end.x = this.rightLeg.begin.x - 0.5 * Math.cos(this.animationState.legsRotation);
        this.rightLeg.end.y = this.rightLeg.begin.y - 0.5 * Math.sin(this.animationState.legsRotation);

        this.leftArm.end.x = this.leftArm.begin.x + 0.4 * Math.cos(this.animationState.armsRotation);
        this.leftArm.end.y = this.leftArm.begin.y - 0.4 * Math.sin(this.animationState.armsRotation);
        this.rightArm.end.x = this.rightArm.begin.x - 0.4 * Math.cos(this.animationState.armsRotation);
        this.rightArm.end.y = this.rightArm.begin.y - 0.4 * Math.sin(this.animationState.armsRotation);

        context.translate(this.left + this.width / 2, this.top + this.height / 2);
        context.scale(this.height / 2, this.height / 2);

        context.lineCap = 'round';

        drawRoundShape(this.leftArm);
        drawRoundShape(this.rightArm);
        drawRoundShapeLight(this.rightArm);
        drawRoundShapeLight(this.leftArm);
        drawRoundShape(this.leftLeg);
        drawRoundShape(this.rightLeg);
        drawRoundShapeLight(this.leftLeg);
        drawRoundShapeLight(this.rightLeg);

        drawRoundShape(this.head);
        drawRoundShape(this.body);

        drawRoundShapeLight(this.head);
        drawRoundShapeLight(this.body);

        if (this.direction === 1) {
            drawRoundShapeLight(this.leftLeg);
            drawRoundShape(this.leftArm);
            drawRoundShapeLight(this.leftArm);
        } else {
            drawRoundShapeLight(this.rightLeg);
            drawRoundShape(this.rightArm);
            drawRoundShapeLight(this.rightArm);
        }

        context.fillStyle = 'black';
        this.drawGlass();
        /*
        context.font = '0.4px Arial';
        context.textAlign = 'center';
        context.fillText('😄', 0.12 * this.direction, -0.45);
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.drawGlass();
        //*/

        context.strokeStyle = 'white';
        context.lineWidth = 0.05;
        context.beginPath();
        context.bezierCurveTo(0.35 * this.direction, -0.7, 0.34 * this.direction, -0.75, 0.26 * this.direction, -0.82);
        context.moveTo(0.4 * this.direction, -0.6);
        context.lineTo(0.4 * this.direction, -0.61);
        context.stroke();

        context.restore();
    }

    drawGlass() {
        context.beginPath();
        const startX = 0.3 * this.direction;
        const startY = -0.9;
        context.moveTo(startX, startY);
        context.bezierCurveTo(startX + 0.0 * this.direction, startY - 0.0, -0.5 * this.direction, -1.0, -0.0 * this.direction, -0.4);
        context.bezierCurveTo(0.4 * this.direction, -0.3, 0.73 * this.direction, -0.5, startX, startY);
        context.closePath();
        context.fill();
    }

    isOn(platform: Platform): boolean {
        return Math.abs(this.bottom - platform.top) < 1 && this.right > platform.left && this.left < platform.right;
    }

    tick(state: GameState) {
        const horizontalAccel = ACCELERATION_UNIT * 2000;
        const maxHorizontalSpeed = SPEED_UNIT * 500;
        if (keyboard.arrowLeft) {
            state.player.speed.x = Math.max(-maxHorizontalSpeed, state.player.speed.x - horizontalAccel);
            state.player.direction = -1;
            state.player.animation = state.player.runAnimation;
        } else if (keyboard.arrowRight) {
            state.player.speed.x = Math.min(maxHorizontalSpeed, state.player.speed.x + horizontalAccel);
            state.player.direction = 1;
            state.player.animation = state.player.runAnimation;
        } else {
            state.player.speed.x = Math.abs(state.player.speed.x) > horizontalAccel
                ? state.player.speed.x - sign(state.player.speed.x) * horizontalAccel
                : 0;

            if (state.onPlatform) {
                state.player.animation = state.player.restAnimation;
            }
        }

        // gravity
        if (!state.onPlatform) {
            state.player.speed.y = Math.min(TERMINAL_VELOCITY, state.player.speed.y + GRAVITY);
        } else if (keyboard.arrowUp) {
            state.player.speed.y = -JUMP_SPEED;
            state.player.animation = state.player.jumpAnimation;
            state.player.currentFrame = 0;
            soundPlayer.playJump();
        } else if (state.player.speed.y > 0) {
            state.player.speed.y = 0;
        }

        if (!state.onPlatform) {
            if (state.player.speed.y > 0) {
                state.player.animation = state.player.fallingAnimation;
            } else if (state.player.animation !== state.player.jumpAnimation) {
                if (state.player.speed.y < -JUMP_SPEED) {
                    state.player.animation = state.player.risingAnimation;
                } else {
                    state.player.animation = state.player.restAnimation;
                }
            }
        }

        state.player.position.add(state.player.speed);
    }
}

abstract class InteractiveObject extends GameObject {
    abstract render(): void;
    tick(state: GameState) { }
    preTick(state: GameState) { }
}

class Rocket extends InteractiveObject {
    width: number = 20;
    height: number = 20;

    leftTube: RoundShape;
    rightTube: RoundShape;

    constructor() {
        super();
        this.leftTube = new RoundShape(-0.1, -0.4, -0.1, 0.0, 0.5);
        this.rightTube = new RoundShape(0.1, -0.4, 0.1, 0.0, 0.5);
        this.leftTube.light = this.rightTube.light = '#ddd';
        this.leftTube.shadow = this.rightTube.shadow = '#999';
    }

    render() {
        context.save();
        context.translate(this.position.x + this.width / 2, this.position.y + this.width / 2);
        context.scale(60, 60);


        context.fillStyle = '#bbb';
        context.beginPath();
        context.moveTo(0, -1);
        context.bezierCurveTo(0.3, -0.8, 0.3, -0.4, 0.15, -0.1);
        context.lineTo(-0.15, -0.1)
        context.bezierCurveTo(-0.3, -0.4, -0.3, -0.8, 0, -1);
        context.closePath();
        context.fill();

        context.fillStyle = '#69f';
        context.beginPath();
        context.moveTo(0.25, -0.5);
        context.bezierCurveTo(0.45, -0.35, 0.4, 0, 0.4, 0);
        context.bezierCurveTo(0.3, -0.2, 0.20, -0.2, 0.20, -0.2);
        context.closePath();
        context.fill();
        context.beginPath();
        context.moveTo(-0.25, -0.5);
        context.bezierCurveTo(-0.45, -0.35, -0.4, 0, -0.4, 0);
        context.bezierCurveTo(-0.3, -0.2, -0.20, -0.2, -0.20, -0.2);
        context.closePath();
        context.fill();

        context.restore();
    }

    tick(state: GameState) {
        if (this.position.y > state.screenArea.bottom + WORLD_SIZE) {
            state.objects.delete(this);
        }

        if (!state.ending && this.boundBoxCollision(state.player)) {
            soundPlayer.playRocket();
            state.player.speed.y = -1.5 * JUMP_SPEED;
            state.player.rocket = true;
            state.screenArea.speedBoost = -1.2 * JUMP_SPEED - state.screenArea.speed;
        }
    }
}

abstract class Platform extends InteractiveObject {
    width: number = 100;
    height: number = 20;

    abstract render(): void;
    tick(state: GameState) {
        if (this.position.y > state.screenArea.bottom + WORLD_SIZE) {
            state.objects.delete(this);
        }
    }

    preTick(state: GameState) {
        if (state.player.speed.y >= 0 && state.player.isOn(this)) {
            state.onPlatform = this;
        }
    }
}

class StaticPlatform extends Platform {
    render() {

        context.save();
        context.translate(this.position.x, this.position.y);

        // Start bottom and middle
        context.save();
        context.translate(this.width / 2, this.height / 2 + 20);
        context.scale(this.width / 2, this.height / 2);
        context.beginPath();
        context.rect(-1, -3, 2, 2);
        context.ellipse(0, -1, 1, 1, 0, 0, Math.PI * 2);
        context.clip();

        const linear = context.createLinearGradient(-1, 0, 1, 0);
        linear.addColorStop(0.1, '#bbb');
        linear.addColorStop(0.2, '#fff');
        linear.addColorStop(0.3, '#bbb');
        linear.addColorStop(1, '#555');
        context.fillStyle = linear;
        context.fillRect(-1, -3, 2, 10);

        const linearRot = context.createLinearGradient(-1, 0, 0, 0.2);
        linearRot.addColorStop(0.1, `rgba(255, 255, 255, 0.0)`);
        linearRot.addColorStop(0.2, `rgba(255, 255, 255, 0.3)`);
        linearRot.addColorStop(0.3, `rgba(255, 255, 255, 0.0)`);
        linearRot.addColorStop(0.5, `rgba(255, 255, 255, 0.0)`);
        linearRot.addColorStop(0.6, `rgba(255, 255, 255, 0.3)`);
        linearRot.addColorStop(0.9, `rgba(255, 255, 255, 0.0)`);
        context.fillStyle = linearRot;
        context.fillRect(-1, -2, 2, 10);

        context.restore();
        // End bottom and middle

        // Start top
        context.save();
        context.translate(this.width / 2, this.height / 2 - 10);
        context.scale(this.width / 2, this.height / 2);
        const radial2 = context.createRadialGradient(0, -1, 0, 0, 0, 1);
        radial2.addColorStop(0.5, `rgba(120, 120, 120, 1.0)`);
        radial2.addColorStop(1, `rgba(160, 160, 160, 1.0)`);
        context.fillStyle = radial2;

        context.beginPath();
        context.ellipse(0, 0, 1, 1, 0, 0, Math.PI * 2);
        context.closePath();
        context.fill();
        context.restore();
        // End top

        context.restore();
    }
}

class IcePlatform extends Platform {
    time: number = IcePlatform.maxTime;
    disappearing: boolean = false;

    render() {
        context.save();
        context.translate(this.position.x, this.position.y);
        context.globalAlpha = this.time / IcePlatform.maxTime;

        // Start bottom and middle
        context.save();
        context.translate(this.width / 2, this.height / 2 + 20);
        context.scale(this.width / 2, this.height / 2);
        const radial = context.createRadialGradient(0, 0, 0, 0, 0, 1);
        radial.addColorStop(0.5, `rgba(255, 255, 255, 0.0)`);
        radial.addColorStop(1, `rgba(255, 255, 255, 0.2)`);
        context.fillStyle = radial;

        context.beginPath();
        context.ellipse(0, 0, 1, 1, 0, 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.rect(-1, -3, 2, 3);
        context.ellipse(0, 0, 1, 1, 0, 0, Math.PI * 2);
        context.clip();

        const linear = context.createLinearGradient(-1, 0, 1, 0);
        linear.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
        linear.addColorStop(0.2, `rgba(255, 255, 255, 0.0)`);
        linear.addColorStop(0.7, `rgba(255, 255, 255, 0.0)`);
        linear.addColorStop(1, `rgba(255, 255, 255, 0.5)`);
        context.fillStyle = linear;
        context.fillRect(-1, -3, 2, 10);

        const linearRot = context.createLinearGradient(-1, 0, 0, 0.2);
        linearRot.addColorStop(0.1, `rgba(255, 255, 255, 0.0)`);
        linearRot.addColorStop(0.2, `rgba(255, 255, 255, 0.3)`);
        linearRot.addColorStop(0.3, `rgba(255, 255, 255, 0.0)`);
        linearRot.addColorStop(0.5, `rgba(255, 255, 255, 0.0)`);
        linearRot.addColorStop(0.6, `rgba(255, 255, 255, 0.3)`);
        linearRot.addColorStop(0.9, `rgba(255, 255, 255, 0.0)`);
        context.fillStyle = linearRot;
        context.fillRect(-1, -3, 2, 10);

        context.restore();
        // End bottom and middle

        // Start top
        context.save();
        context.translate(this.width / 2, this.height / 2 - 10);
        context.scale(this.width / 2, this.height / 2);
        const radial2 = context.createRadialGradient(0, 0, 0, 0, 0, 1);
        radial2.addColorStop(0.5, `rgba(255, 255, 255, 0.0)`);
        radial2.addColorStop(1, `rgba(255, 255, 255, 0.7)`);
        context.fillStyle = radial2;

        context.beginPath();
        context.ellipse(0, 0, 1, 1, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
        // End top

        context.restore();

    }

    tick(state: GameState) {
        super.tick(state);

        if (this.disappearing) {
            if (this.time <= 0) {
                state.objects.delete(this);
            } else {
                this.time -= 1;
            }
        }

        if (state.onPlatform === this) {
            this.disappearing = true;
            soundPlayer.playIce();
        }
    }

    static get maxTime() {
        return 500 * STEPS_PER_MILISECOND;
    }
}

class MovingPlatform extends Platform {
    direction: number = 1;
    lightRotation: number = 0;
    lights = [
        {color: {red: 255, green: 0, blue: 0}, direction: 0},
        {color: {red: 255, green: 255, blue: 0}, direction: 2 * Math.PI / 3},
        {color: {red: 0, green: 0, blue: 255}, direction: 4 * Math.PI / 3},
    ];

    renderLight({red, green, blue}, direction: number) {
        context.save();
        context.translate(
            this.width / 2 + (this.width * Math.cos(direction)) / 2,
            this.height / 2 - 5 + (this.height * Math.sin(direction)) / 2,
        );
        context.scale(20, 20);
        const light = context.createRadialGradient(0, 0, 0, 0, 0, 1);
        light.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.9)`);
        light.addColorStop(0.1, `rgba(${red}, ${green}, ${blue}, 0.7)`);
        light.addColorStop(0.2, `rgba(${red}, ${green}, ${blue}, 0.2)`);
        light.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);
        context.fillStyle = light;
        context.beginPath();
        context.arc(0, 0, 1, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }

    render() {
        context.save();
        context.translate(this.position.x, this.position.y);

        for (const light of this.lights) {
            if ((light.direction + this.lightRotation) % (Math.PI * 2) >= Math.PI) {
                this.renderLight(light.color, light.direction + this.lightRotation);
            }
        }

        context.fillStyle = '#aaa';
        context.beginPath();
        context.ellipse(this.width / 2, this.height / 2 + 10, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = 'black';
        context.beginPath();
        context.ellipse(this.width / 2, this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = '#aaa';
        context.beginPath();
        context.ellipse(this.width / 2, this.height / 2 - 10, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        context.fill();

        for (const light of this.lights) {
            if ((light.direction + this.lightRotation) % (Math.PI * 2) < Math.PI) {
                this.renderLight(light.color, light.direction + this.lightRotation);
            }
        }

        this.lightRotation += 0.1;

        context.restore();
    }

    tick(state: GameState) {
        super.tick(state);

        this.position.x += MovingPlatform.horizontalSpeed * this.direction;
        if (state.onPlatform === this) {
            state.player.position.x += MovingPlatform.horizontalSpeed * this.direction;
        }

        if ((this.left <= 0 && this.direction < 0) || (this.right >= WORLD_SIZE && this.direction > 0)) {
            this.direction *= -1;
        }
    }


    static get horizontalSpeed() {
        return 100 * SPEED_UNIT;
    }
}

class GameState {
    paused: boolean = false;
    ending: boolean = false;
    over: boolean = false;
    previousTime: number = 0;
    player: Player = new Player();
    objects: Set<InteractiveObject> = new Set();
    screenArea: ScreenArea = new ScreenArea();
    nextPlatformTop: number = 0;
    previousPlatformX: number = 0;
    backgroundY: number = 0;
    onPlatform: Platform | null = null;
    highScore: number = LocalStorage.get().highScore;
    score: number = 0;

    tick() {
        this.onPlatform = null;
        for (const object of this.objects) {
            object.preTick(this);
        }

        if (this.screenArea.top - WORLD_SIZE < this.nextPlatformTop) {
            let platform: Platform;
            const type = Math.random();
            if (type < 0.1) {
                platform = new IcePlatform();
            } else if (type < 0.4) {
                platform = new MovingPlatform();
            } else {
                platform = new StaticPlatform();
            }

            this.objects.add(platform);
            platform.position.x = between(0, WORLD_SIZE - platform.width, this.previousPlatformX + (0.5 - Math.random()) * 500);
            platform.position.y = this.nextPlatformTop;
            this.previousPlatformX = platform.position.x;
            this.nextPlatformTop = this.nextPlatformTop - 100 - Math.random() * 100 * STEPS_PER_MILISECOND;

            if (type > 0.9) {
                const rocket = new Rocket();
                rocket.position.x = platform.left + (platform.width - rocket.width) * Math.random();
                rocket.position.y = platform.top - rocket.height;
                this.objects.add(rocket);
            }
        }

        this.player.tick(this);

        for (const object of this.objects) {
            object.tick(this);
        }

        if (this.screenArea.speedBoost < 0) {
            this.screenArea.speedBoost += GRAVITY;
        }

        if (this.screenArea.top > this.player.top) {
            this.screenArea.position.y = this.player.top;
        }

        this.screenArea.position.y += this.screenArea.speed + this.screenArea.speedBoost;
        this.backgroundY -= (this.screenArea.speed + this.screenArea.speedBoost) / 10;
        this.screenArea.speed = Math.max(-200 * SPEED_UNIT, this.screenArea.speed - 0.005 * SPEED_UNIT);
    }

    updateScore() {
        if (!this.ending) {
            this.score = -Math.round(this.screenArea.top / 100);
        }
    }
}

interface MovableObject {
    position: Vector2D;
    speed: Vector2D
}

/*
let sps: number = 0;
let fps: number = 0;
let spsCounter: number = 0;
let fpsCounter: number = 0;
*/

const render = (state: GameState) => {
    context.save();
    context.translate(0, window.innerHeight / 2);
    context.scale(1, scene.scale);
    context.translate(0, -WORLD_SIZE / 2);

    context.beginPath();
    context.rect(0, 0, window.innerWidth, WORLD_SIZE);
    context.closePath();
    context.clip();

    context.translate(window.innerWidth / 2, 0);
    context.scale(scene.scale, 1);
    context.translate(-WORLD_SIZE / 2, 0);

    context.translate(-state.screenArea.left, -state.screenArea.top);

    // render objects
    for (const object of state.objects) {
        object.render();
    }
    state.player.render();

    context.restore();

    context.save();
    context.scale(scene.scale, scene.scale);
    const highScore = `HI-SCORE ${state.highScore.toString().padStart(6, '0')}`;
    const score = `SCORE    ${state.score.toString().padStart(6, '0')}`;
    context.textBaseline = 'top';
    context.font = '1000 40px monospace'
    context.lineWidth = 5;
    context.strokeStyle = '#333';
    context.strokeText(highScore, 20, 20);
    context.strokeText(score, 20, 60);
    context.fillStyle = '#fff';
    context.fillText(highScore, 20, 20);
    context.fillText(score, 20, 60);

    context.restore();

    /*
    context.strokeText(`SPS ${sps}`, 20, 20);
    context.strokeText(`FPS ${fps}`, 20, 40);
    */
};

export const createGame = () => {
    const background = memoizedBackgroundPattern().getBackground();

    let gameTimeGap = 0;
    let currentStep: number = 0;

    const state = new GameState();

    state.backgroundY = background.getHeight() * Math.random();
    state.player.position.x = (WORLD_SIZE - state.player.width) / 2;
    state.player.position.y = 10;

    {
        const platform = new StaticPlatform();
        state.objects.add(platform);
        platform.position.x = (WORLD_SIZE - platform.width) / 2;
        platform.position.y = 200;
        state.previousPlatformX = platform.position.x;
    }

    const animate = (currentTime: number) => {
        state.updateScore();

        if (!state.ending && state.player.top > state.screenArea.bottom) {
            game.end();
        }

        background.draw(context, state.backgroundY);
        render(state);

        const timeGap = Math.min(500, currentTime - state.previousTime + gameTimeGap);
        const stepsTorun = (timeGap * STEPS_PER_MILISECOND) | 0;
        gameTimeGap = timeGap - (stepsTorun / STEPS_PER_MILISECOND);
        //spsCounter += stepsTorun;
        state.previousTime = currentTime;
        const targetStep = currentStep + stepsTorun;
        for (; currentStep < targetStep; currentStep++) {
            state.tick();
        }
        //fpsCounter++;
    };

    const game = {
        start: () => {
            document.body.classList.add('playing');
            soundPlayer.playGameStart();
            game.resumeLoop();
        },

        animate,

        state,

        loop: (currentTime: number) => {
            game.animate(currentTime);

            if (!game.state.over && !game.state.paused) {
                window.requestAnimationFrame(game.loop);
            }
        },

        resumeLoop: () => {
            document.body.classList.add('playing');
            game.state.paused = false;
            window.requestAnimationFrame((currentTime: number) => {
                state.previousTime = currentTime;
                game.loop(currentTime);
            });
        },

        pause: () => {
            document.body.classList.remove('playing');
            state.paused = true;
        },

        end: () => {
            document.body.classList.remove('playing');
            state.ending = true;
            soundPlayer.playGameOver();
            LocalStorage.update(storage => storage.highScore = Math.max(storage.highScore, state.score));
            fadeOutTransition(3000).then(async () => {
                state.over = true;
                await waitNextFrame();
                activateMenu();
                fadeInTransition(300);
            });
        },
    };

    return game;
}

/*
setInterval(() => {
    sps = spsCounter;
    fps = fpsCounter;
    spsCounter = 0;
    fpsCounter = 0;
}, 1000);
*/
