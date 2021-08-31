import { soundPlayer } from "./Audio";
import { memoizedBackgroundPattern as getBackground } from "./Background";
import { WORLD_SIZE, GRAVITY, TERMINAL_VELOCITY, STEPS_PER_MILISECOND, SPEED_UNIT, scene as scene, context, keyboard, JUMP_SPEED, ACCELERATION_UNIT, TAU, random } from "./Globals";
import { LocalStorage } from "./LocalStorage";
import { activateMenu, fadeInTransition, fadeOutTransition, waitNextFrame } from "./Main";

interface Vector2D {
    x: number;
    y: number;
}

const { cos, sin, max, min, abs, PI } = Math;
const sign = (value: number): (-1 | 0 | 1) => value > 0 ? 1: (value < 0 ? -1 : 0);
const between = (lower: number, upper: number, value: number) => max(lower, min(upper, value));

abstract class GameObject {
    position: Vector2D = {x: 0, y: 0};

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
        this.begin = {x: x1, y: y1};
        this.end = {x: x2, y: y2};
    }
}

const drawRoundShapeLight = (context: CanvasRenderingContext2D, roundShape: RoundShape) => {
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

const drawRoundShape = (context: CanvasRenderingContext2D, roundShape: RoundShape) => {
    context.strokeStyle = roundShape.shadow;
    context.lineWidth = roundShape.width;
    context.beginPath();
    context.moveTo(roundShape.begin.x, roundShape.begin.y);
    context.lineTo(roundShape.end.x, roundShape.end.y);
    context.stroke();
};

const rocketParticles = () => {
    const lifeTime = 20;
    const maxParticles: number = 250;
    const particles = [...new Array(maxParticles)].map(() => ({
        speed: {
            x: 0,
            y: 0,
        },
        x: 0,
        y: 0,
        time: 0,
    }));

    const colors = [...new Array(lifeTime)].map((_, i) => {
        const progress = i / lifeTime;
        const yellow = 255 * min(1, 1 - 2 * progress);
        const decay = between(0, 1, 1 - progress);
        return `rgba(${255 * decay}, ${yellow * decay}, 0, ${0.3 * decay})`;
    });

    let aliveParticles = 0;

    return {
        add: (x: number, y: number) => {
            for (let i = 0; i < 10; i++) {
                aliveParticles = min(aliveParticles + 1, particles.length - 1);
                const particle = particles[aliveParticles - 1];
                particle.speed.x = (0.5 - random()) * 3;
                particle.speed.y = 10 + i;
                particle.x = x + (0.5 - random()) * 10;
                particle.y = y + 3 * i;
                particle.time = 0;
            }
        },

        render: (context: CanvasRenderingContext2D) => {
            for (let i = 0; i < aliveParticles; i++) {
                const particle = particles[i];
                const progress = particle.time / lifeTime;
                if (progress >= 1) {
                    aliveParticles--;
                    if (i !== aliveParticles) {
                        const tmp = particles[i];
                        particles[i] = particles[aliveParticles];
                        particles[aliveParticles] = tmp;
                    }

                    continue;
                }

                context.fillStyle = colors[particle.time];
                context.beginPath();
                const radius = Math.round(25 * (1 - abs(0.3 - progress)));
                context.arc(particle.x, particle.y, radius, 0, TAU);
                context.closePath();
                context.fill();

                particle.time++;
                particle.x += particle.speed.x;
                particle.y += particle.speed.y;
            }
        }
    }
};

const enum AnimationProperty {
    LegsRotation = 0,
    ArmsRotation = 1,
}

type Animation = Array<{[property: number]: number} | {goTo: string}>

const restAnimation: Animation = [
    {
        [AnimationProperty.LegsRotation]: -PI / 2 - 0.1,
        [AnimationProperty.ArmsRotation]: -PI / 2 - 0.1
    },
];

const runAnimation: Animation = [
    {
        [AnimationProperty.LegsRotation]: -PI / 2 - 0.6,
        [AnimationProperty.ArmsRotation]: -PI / 2 + 0.6
    },
    {
        [AnimationProperty.LegsRotation]: -PI / 2 + 0.6,
        [AnimationProperty.ArmsRotation]: -PI / 2 - 0.6
    },
];

const jumpAnimation: Animation = [
    {
        [AnimationProperty.LegsRotation]: -PI / 2 - 0.8,
        [AnimationProperty.ArmsRotation]: -PI / 2 + 1.2
    },
    { goTo: 'fallingAnimation' },
];

const fallingAnimation = [
    {
        [AnimationProperty.LegsRotation]: -PI / 2 - 0.2,
        [AnimationProperty.ArmsRotation]: -PI / 2 - 2.2
    },
    {
        [AnimationProperty.LegsRotation]: -PI / 2 - 0.3,
        [AnimationProperty.ArmsRotation]: -PI / 2 - 2.5
    },
];

const risingAnimation = [
    {
        [AnimationProperty.LegsRotation]: -PI / 2 - 0.1,
        [AnimationProperty.ArmsRotation]: -PI / 2 - 0.1
    },
    {
        [AnimationProperty.LegsRotation]: -PI / 2 - 0.3,
        [AnimationProperty.ArmsRotation]: -PI / 2 - 0.3
    },
];

export class Player extends GameObject {
    speed: Vector2D = {x: 0, y: 0};
    width: number = 70;
    height: number = 150;
    direction: number = 1;
    rocket: boolean = false;
    jumpGrace: number = 0;

    legGap = 0.25;
    armGap = 0.5;

    body = new RoundShape(0, 0.1, 0, 0.101, 1.0);
    leftLeg = new RoundShape(-this.legGap * 0.9, 0.3, -this.legGap, 0.8, 0.4);
    rightLeg = new RoundShape(this.legGap * 0.9, 0.3, this.legGap, 0.8, 0.4);
    head = new RoundShape(0, -0.5, 0, -0.501, 1.0);
    leftArm = new RoundShape(-this.armGap * 0.8, -0.1, -this.armGap, 0.3, 0.4);
    rightArm = new RoundShape(this.armGap * 0.8, -0.1, this.armGap, 0.3, 0.4);

    rocketParticles = rocketParticles();

    animationState = {
        [AnimationProperty.LegsRotation]: -PI / 2,
        [AnimationProperty.ArmsRotation]: -PI / 2,
    };

    animationSpeed = {
        [AnimationProperty.LegsRotation]: 0.12,
        [AnimationProperty.ArmsRotation]: 0.12,
    };

    animation: Animation = restAnimation;
    currentFrame = 0;

    updateAnimation() {
        if (this.currentFrame >= this.animation.length) {
            this.currentFrame = 0;
        }

        const frame = this.animation[this.currentFrame];
        if ('goTo' in frame) {
            this.animation = this[frame.goTo];
            this.currentFrame = 0;
        }

        let reachedFrame = true;
        for (const key in this.animationState) {
            if (abs(frame[key] - this.animationState[key]) < this.animationSpeed[key]) {
                this.animationState[key] = frame[key];
            } else {
                reachedFrame = false;
                this.animationState[key] += this.animationSpeed[key] * sign(frame[key] - this.animationState[key]);
            }
        }

        if (reachedFrame) {
            this.currentFrame++;
        }
    }

    render(context: CanvasRenderingContext2D) {
        context.save();

        if (this.rocket) {
            this.rocketParticles.add(this.position.x + this.width / 2, this.position.y + this.height / 2);

            if (this.speed.y >= 0) {
                this.rocket = false;
            }
        }

        this.rocketParticles.render(context);

        this.updateAnimation();
        this.leftLeg.end.x = this.leftLeg.begin.x + 0.5 * cos(this.animationState[AnimationProperty.LegsRotation]);
        this.leftLeg.end.y = this.leftLeg.begin.y - 0.5 * sin(this.animationState[AnimationProperty.LegsRotation]);
        this.rightLeg.end.x = this.rightLeg.begin.x - 0.5 * cos(this.animationState[AnimationProperty.LegsRotation]);
        this.rightLeg.end.y = this.rightLeg.begin.y - 0.5 * sin(this.animationState[AnimationProperty.LegsRotation]);

        this.leftArm.end.x = this.leftArm.begin.x + 0.4 * cos(this.animationState[AnimationProperty.ArmsRotation]);
        this.leftArm.end.y = this.leftArm.begin.y - 0.4 * sin(this.animationState[AnimationProperty.ArmsRotation]);
        this.rightArm.end.x = this.rightArm.begin.x - 0.4 * cos(this.animationState[AnimationProperty.ArmsRotation]);
        this.rightArm.end.y = this.rightArm.begin.y - 0.4 * sin(this.animationState[AnimationProperty.ArmsRotation]);

        context.translate(this.left + this.width / 2, this.top + this.height / 2);
        context.scale(this.height / 2, this.height / 2);

        context.lineCap = 'round';

        drawRoundShape(context, this.leftArm);
        drawRoundShape(context, this.rightArm);
        drawRoundShapeLight(context, this.rightArm);
        drawRoundShapeLight(context, this.leftArm);
        drawRoundShape(context, this.leftLeg);
        drawRoundShape(context, this.rightLeg);
        drawRoundShapeLight(context, this.leftLeg);
        drawRoundShapeLight(context, this.rightLeg);

        drawRoundShape(context, this.head);
        drawRoundShape(context, this.body);

        drawRoundShapeLight(context, this.head);
        drawRoundShapeLight(context, this.body);

        if (this.direction === 1) {
            drawRoundShapeLight(context, this.leftLeg);
            drawRoundShape(context, this.leftArm);
            drawRoundShapeLight(context, this.leftArm);
        } else {
            drawRoundShapeLight(context, this.rightLeg);
            drawRoundShape(context, this.rightArm);
            drawRoundShapeLight(context, this.rightArm);
        }

        context.save();
        this.drawGlass(context);
        context.clip();
        context.scale(2 / this.height, 2 / this.height);
        const background = getBackground();
        context.translate(WORLD_SIZE / 2 - background.canvas.width / 2 - this.left - this.width / 2, 0);
        background.draw(context, this.top);
        context.restore();

        context.strokeStyle = 'white';
        context.lineWidth = 0.05;
        context.beginPath();
        context.bezierCurveTo(0.35 * this.direction, -0.7, 0.34 * this.direction, -0.75, 0.26 * this.direction, -0.82);
        context.moveTo(0.4 * this.direction, -0.6);
        context.lineTo(0.4 * this.direction, -0.61);
        context.stroke();

        context.restore();
    }

    drawGlass(context: CanvasRenderingContext2D) {
        context.beginPath();
        const startX = 0.3 * this.direction;
        const startY = -0.9;
        context.moveTo(startX, startY);
        context.bezierCurveTo(startX + 0.0 * this.direction, startY - 0.0, -0.5 * this.direction, -1.0, -0.0 * this.direction, -0.4);
        context.bezierCurveTo(0.4 * this.direction, -0.3, 0.73 * this.direction, -0.5, startX, startY);
        context.closePath();
    }

    tick(state: GameState) {
        const horizontalAccel = ACCELERATION_UNIT * 2000;
        const maxHorizontalSpeed = SPEED_UNIT * 500;
        if (!state.ending && keyboard.arrowLeft) {
            state.player.speed.x = max(-maxHorizontalSpeed, state.player.speed.x - horizontalAccel);
            state.player.direction = -1;
            state.player.animation = runAnimation;
        } else if (!state.ending && keyboard.arrowRight) {
            state.player.speed.x = min(maxHorizontalSpeed, state.player.speed.x + horizontalAccel);
            state.player.direction = 1;
            state.player.animation = runAnimation;
        } else {
            state.player.speed.x = abs(state.player.speed.x) > horizontalAccel
                ? state.player.speed.x - sign(state.player.speed.x) * horizontalAccel
                : 0;

            if (state.onPlatform) {
                state.player.animation = restAnimation;
            }
        }

        // gravity
        if (!state.onPlatform) {
            state.player.speed.y = min(TERMINAL_VELOCITY, state.player.speed.y + GRAVITY);
        } else if (state.player.speed.y > 0) {
            state.player.speed.y = 0;
        }

        if ((state.onPlatform || this.jumpGrace > 0) && !state.ending && keyboard.arrowUp) {
            this.jumpGrace = 0;
            state.player.speed.y = -JUMP_SPEED;
            state.player.animation = jumpAnimation;
            state.player.currentFrame = 0;
            soundPlayer.playJump();
        }

        if (state.onPlatform) {
            this.jumpGrace = 100 * STEPS_PER_MILISECOND;
        } else {
            this.jumpGrace = max(0, this.jumpGrace - 1);
            if (state.player.speed.y > 0) {
                state.player.animation = fallingAnimation;
            } else if (state.player.animation !== jumpAnimation) {
                if (state.player.rocket) {
                    state.player.animation = risingAnimation;
                } else {
                    state.player.animation = restAnimation;
                }
            }
        }

        state.player.position.x += state.player.speed.x;
        state.player.position.y += state.player.speed.y;
    }
}

abstract class InteractiveObject extends GameObject {
    abstract render(context: CanvasRenderingContext2D): void;
    tick(state: GameState) { }
    preTick(state: GameState) { }
}

class Rocket extends InteractiveObject {
    width: number = 20;
    height: number = 20;

    leftTube: RoundShape;
    rightTube: RoundShape;
    rotation: number = 0;

    constructor() {
        super();
        this.leftTube = new RoundShape(-0.1, -0.4, -0.1, 0.0, 0.5);
        this.rightTube = new RoundShape(0.1, -0.4, 0.1, 0.0, 0.5);
        this.leftTube.light = this.rightTube.light = '#ddd';
        this.leftTube.shadow = this.rightTube.shadow = '#999';
    }

    bodyPath(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.moveTo(0, -1);
        context.bezierCurveTo(0.3, -0.8, 0.3, -0.4, 0.15, -0.1);
        context.lineTo(-0.15, -0.1)
        context.bezierCurveTo(-0.3, -0.4, -0.3, -0.8, 0, -1);
        context.closePath();
    }

    wingsPath(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.moveTo(0.25, -0.5);
        context.bezierCurveTo(0.45, -0.35, 0.4, 0, 0.4, 0);
        context.bezierCurveTo(0.3, -0.2, 0.20, -0.2, 0.20, -0.2);
        context.moveTo(-0.25, -0.5);
        context.bezierCurveTo(-0.45, -0.35, -0.4, 0, -0.4, 0);
        context.bezierCurveTo(-0.3, -0.2, -0.20, -0.2, -0.20, -0.2);
        context.closePath();
    }

    render(context: CanvasRenderingContext2D) {
        context.save();
        context.translate(this.position.x + this.width / 2, this.position.y + this.width / 2);
        context.scale(60, 60);
        context.rotate(cos(this.rotation * 0.1) * 0.1);
        this.rotation++;

        context.lineWidth = 0.07;
        context.lineCap = 'round';
        context.strokeStyle = '#fff';
        this.bodyPath(context);
        context.stroke();
        this.wingsPath(context);
        context.stroke();

        context.fillStyle = '#bbb';
        this.bodyPath(context);
        context.fill();

        context.fillStyle = '#69f';
        this.wingsPath(context);
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

            const deltaY = 1 - (state.player.top - state.screenArea.top) / WORLD_SIZE;
            state.screenArea.speedBoost = min(0, -1.6 * deltaY * JUMP_SPEED    );
        }
    }
}

abstract class Platform extends InteractiveObject {
    static width: number = 100;
    static height: number = 20;
    get width() {
        return Platform.width;
    }

    get height() {
        return Platform.height;
    }

    abstract render(context: CanvasRenderingContext2D): void;
    tick(state: GameState) {
        if (this.position.y > state.screenArea.bottom + WORLD_SIZE) {
            state.objects.delete(this);
        }
    }

    preTick(state: GameState) {
        if (this !== state.ignorePlatform && state.player.speed.y >= 0 && this.isPlayerOn(state.player)) {
            state.onPlatform = this;
            state.player.position.y = this.top - state.player.height;
        }
    }

    isPlayerOn(player: Player): boolean {
        return abs(player.bottom - this.top) < 10 && player.right > this.left && player.left < this.right;
    }
}

class StaticPlatform extends Platform {
    render = (() => {
        const linear = context.createLinearGradient(-1, 0, 1, 0);
        linear.addColorStop(0.1, '#bbb');
        linear.addColorStop(0.2, '#fff');
        linear.addColorStop(0.3, '#bbb');
        linear.addColorStop(1, '#555');

        const linearRot = context.createLinearGradient(-1, 0, 0, 0.2);
        linearRot.addColorStop(0.1, `rgba(255, 255, 255, 0.0)`);
        linearRot.addColorStop(0.2, `rgba(255, 255, 255, 0.3)`);
        linearRot.addColorStop(0.3, `rgba(255, 255, 255, 0.0)`);
        linearRot.addColorStop(0.5, `rgba(255, 255, 255, 0.0)`);
        linearRot.addColorStop(0.6, `rgba(255, 255, 255, 0.3)`);
        linearRot.addColorStop(0.9, `rgba(255, 255, 255, 0.0)`);

        const radial2 = context.createRadialGradient(0, -1, 0, 0, 0, 1);
        radial2.addColorStop(0.5, `rgba(120, 120, 120, 1.0)`);
        radial2.addColorStop(1, `rgba(160, 160, 160, 1.0)`);

        return (context: CanvasRenderingContext2D) => {
            context.save();
            context.translate(this.position.x, this.position.y);

            // Start bottom and middle
            context.save();
            context.translate(Platform.width / 2, Platform.height / 2 + 20);
            context.scale(Platform.width / 2, Platform.height / 2);
            context.beginPath();
            context.rect(-1, -3, 2, 2);
            context.ellipse(0, -1, 1, 1, 0, 0, TAU);
            context.clip();
            context.fillStyle = linear;
            context.fillRect(-1, -3, 2, 10);

            context.fillStyle = linearRot;
            context.fillRect(-1, -2, 2, 10);

            context.restore();
            // End bottom and middle

            // Start top
            context.save();
            context.translate(Platform.width / 2, Platform.height / 2 - 10);
            context.scale(Platform.width / 2, Platform.height / 2);
            context.fillStyle = radial2;

            context.beginPath();
            context.ellipse(0, 0, 1, 1, 0, 0, TAU);
            context.closePath();
            context.fill();
            context.restore();
            // End top

            context.restore();
        };
    })();
}

class IcePlatform extends Platform {
    time: number = IcePlatform.maxTime;
    disappearing: boolean = false;


    render = (() => {
        const radial = context.createRadialGradient(0, 0, 0, 0, 0, 1);
        radial.addColorStop(0.5, `rgba(255, 255, 255, 0.0)`);
        radial.addColorStop(1, `rgba(255, 255, 255, 0.2)`);

        const linear = context.createLinearGradient(-1, 0, 1, 0);
        linear.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
        linear.addColorStop(0.2, `rgba(255, 255, 255, 0.0)`);
        linear.addColorStop(0.7, `rgba(255, 255, 255, 0.0)`);
        linear.addColorStop(1, `rgba(255, 255, 255, 0.5)`);

        const linearRot = context.createLinearGradient(-1, 0, 0, 0.2);
        linearRot.addColorStop(0.1, `rgba(255, 255, 255, 0.0)`);
        linearRot.addColorStop(0.2, `rgba(255, 255, 255, 0.3)`);
        linearRot.addColorStop(0.3, `rgba(255, 255, 255, 0.0)`);
        linearRot.addColorStop(0.5, `rgba(255, 255, 255, 0.0)`);
        linearRot.addColorStop(0.6, `rgba(255, 255, 255, 0.3)`);
        linearRot.addColorStop(0.9, `rgba(255, 255, 255, 0.0)`);

        const radial2 = context.createRadialGradient(0, 0, 0, 0, 0, 1);
        radial2.addColorStop(0.5, `rgba(255, 255, 255, 0.0)`);
        radial2.addColorStop(1, `rgba(255, 255, 255, 0.7)`);

        return (context: CanvasRenderingContext2D) => {
            context.save();
            context.translate(this.position.x, this.position.y);
            context.globalAlpha = this.time / IcePlatform.maxTime;

            // Start bottom and middle
            context.save();
            context.translate(this.width / 2, this.height / 2 + 20);
            context.scale(this.width / 2, this.height / 2);
            context.fillStyle = radial;

            context.beginPath();
            context.ellipse(0, 0, 1, 1, 0, 0, TAU);
            context.fill();

            context.beginPath();
            context.rect(-1, -3, 2, 3);
            context.ellipse(0, 0, 1, 1, 0, 0, TAU);
            context.clip();

            context.fillStyle = linear;
            context.fillRect(-1, -3, 2, 10);

            context.fillStyle = linearRot;
            context.fillRect(-1, -3, 2, 10);

            context.restore();
            // End bottom and middle

            // Start top
            context.save();
            context.translate(this.width / 2, this.height / 2 - 10);
            context.scale(this.width / 2, this.height / 2);
            context.fillStyle = radial2;

            context.beginPath();
            context.ellipse(0, 0, 1, 1, 0, 0, TAU);
            context.fill();
            context.restore();
            // End top

            context.restore();
        };
    })();

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

    isPlayerOn(player: Player): boolean {
        return this.time > IcePlatform.maxTime * 0.7 && super.isPlayerOn(player);
    }

    static get maxTime() {
        return 500 * STEPS_PER_MILISECOND;
    }
}

class MovingPlatform extends Platform {
    direction: number = 1;

    render = (() => {
        const createLightGradient = ({ red, green, blue }) => {
            const light = context.createRadialGradient(0, 0, 0, 0, 0, 1);
            light.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.9)`);
            light.addColorStop(0.1, `rgba(${red}, ${green}, ${blue}, 0.7)`);
            light.addColorStop(0.2, `rgba(${red}, ${green}, ${blue}, 0.2)`);
            light.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);
            return light;
        };

        let lightRotation: number = 0;
        const lights = [
            {gradient: createLightGradient({red: 255, green: 0, blue: 0}), direction: 0},
            {gradient: createLightGradient({red: 255, green: 255, blue: 0}), direction: TAU / 3},
            {gradient: createLightGradient({red: 0, green: 0, blue: 255}), direction: 4 * PI / 3},
        ];

        const renderLight = (light: typeof lights[0]) => {
            const direction = light.direction + lightRotation;
            context.save();
            context.translate(
                this.width / 2 + (this.width * cos(direction)) / 2,
                this.height / 2 - 5 + (this.height * sin(direction)) / 2,
            );
            context.scale(20, 20);
            context.fillStyle = light.gradient;
            context.beginPath();
            context.arc(0, 0, 1, 0, TAU);
            context.fill();
            context.restore();
        };

        return (context: CanvasRenderingContext2D) => {
            context.save();
            context.translate(this.position.x, this.position.y);

            for (const light of lights) {
                if ((light.direction + lightRotation) % TAU >= PI) {
                    renderLight(light);
                }
            }

            context.fillStyle = '#aaa';
            context.beginPath();
            context.ellipse(this.width / 2, this.height / 2 + 10, this.width / 2, this.height / 2, 0, 0, TAU);
            context.fill();

            context.fillStyle = 'black';
            context.beginPath();
            context.ellipse(this.width / 2, this.height / 2, this.width / 2, this.height / 2, 0, 0, TAU);
            context.fill();

            context.fillStyle = '#aaa';
            context.beginPath();
            context.ellipse(this.width / 2, this.height / 2 - 10, this.width / 2, this.height / 2, 0, 0, TAU);
            context.fill();

            for (const light of lights) {
                if ((light.direction + lightRotation) % TAU < PI) {
                    renderLight(light);
                }
            }

            lightRotation = (TAU + lightRotation + this.direction * 0.1) % TAU;

            context.restore();
        }
    })();

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
    ignorePlatform: Platform | null = null;
    highScore: number = LocalStorage.get().highScore;
    score: number = 0;
    rockets: boolean = false;

    tick() {
        if (keyboard.arrowDown && !this.ignorePlatform) {
            this.ignorePlatform = this.onPlatform;
        }

        this.onPlatform = null;
        for (const object of this.objects) {
            object.preTick(this);
        }

        if (this.ignorePlatform) {
            if ((this.onPlatform && this.onPlatform !== this.ignorePlatform) || this.player.speed.y < 0) {
                this.ignorePlatform = null;
            }
        }

        if (this.screenArea.top - WORLD_SIZE < this.nextPlatformTop) {
            let platform: Platform;
            const type = random();
            if (type < 0.1) {
                platform = new IcePlatform();
            } else if (type < 0.4) {
                platform = new MovingPlatform();
            } else {
                platform = new StaticPlatform();
            }

            this.objects.add(platform);
            platform.position.x = between(0, WORLD_SIZE - platform.width, this.previousPlatformX + (0.5 - random()) * 500);
            platform.position.y = this.nextPlatformTop;
            this.previousPlatformX = platform.position.x;
            this.nextPlatformTop = this.nextPlatformTop - 100 - random() * 50;

            if (type > 0.9 || (this.rockets && type >= 0.4)) {
                const rocket = new Rocket();
                rocket.position.x = platform.left + (platform.width - rocket.width) * random();
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
        this.screenArea.speed = max(-200 * SPEED_UNIT, this.screenArea.speed - 0.02 * SPEED_UNIT);
    }

    updateScore() {
        if (!this.ending) {
            this.score = -Math.round(this.screenArea.top / 100);
        }
    }
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
        object.render(context);
    }
    state.player.render(context);

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

export const createGame = ({rockets = false}) => {
    const background = getBackground();

    let gameTimeGap = 0;
    let currentStep: number = 0;

    const state = new GameState();

    state.backgroundY = background.getHeight() * random();
    state.player.position.x = (WORLD_SIZE - state.player.width) / 2;
    state.player.position.y = 10;
    state.rockets = rockets;

    {
        const platform = new StaticPlatform();
        state.objects.add(platform);
        platform.position.x = (WORLD_SIZE - platform.width) / 2;
        platform.position.y = 200;
        state.previousPlatformX = platform.position.x;
    }

    const animate = (currentTime: number) => {
        state.updateScore();

        background.draw(context, state.backgroundY);
        render(state);

        const timeGap = min(500, currentTime - state.previousTime + gameTimeGap);
        const stepsTorun = (timeGap * STEPS_PER_MILISECOND) | 0;
        gameTimeGap = timeGap - (stepsTorun / STEPS_PER_MILISECOND);
        //spsCounter += stepsTorun;
        state.previousTime = currentTime;
        const targetStep = currentStep + stepsTorun;
        for (; currentStep < targetStep; currentStep++) {
            state.tick();
        }

        if (!state.ending && state.player.top > state.screenArea.bottom && state.player.speed.y >= state.screenArea.speed) {
            game.end();
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
            LocalStorage.update(storage => storage.highScore = max(storage.highScore, state.score));
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
