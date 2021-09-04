import { soundPlayer } from "./Audio";
import { getBackground as getBackground } from "./Background";
import { WORLD_SIZE, scene as scene, keyboard, TAU, random, canvas } from "./Globals";
import { LocalStorage } from "./LocalStorage";
import { activateMenu, fadeInTransition, fadeOutTransition, waitNextFrame } from "./Main";

const STEPS_PER_SECOND = 60;
const STEPS_PER_MILISECOND = STEPS_PER_SECOND / 1000;
const SPEED_UNIT = 1 / STEPS_PER_SECOND;
const ACCELERATION_UNIT = SPEED_UNIT / STEPS_PER_SECOND;
const GRAVITY = 2000 * ACCELERATION_UNIT;
const JUMP_SPEED = 1200 * SPEED_UNIT;
const TERMINAL_VELOCITY = 1000 * SPEED_UNIT;
const SPRITES_SCALE = 2;
const { cos, sin, max, min, abs, PI } = Math;
const sign = (value: number): (-1 | 0 | 1) => value > 0 ? 1: (value < 0 ? -1 : 0);
const between = (lower: number, upper: number, value: number) => max(lower, min(upper, value));

/*
class WrappedContextState {
    public x: number = 0;
    public y: number = 0;
    public scaleX: number = 1;
    public scaleY: number = 1;
    public rotation: boolean = false;

    copyTo(other: WrappedContextState) {
        other.x = this.x;
        other.y = this.y;
        other.scaleX = this.scaleX;
        other.scaleY = this.scaleY;
        other.rotation = false;
    }
}

export class WrappedContext {
    private context: CanvasRenderingContext2D;

    private states = [...new Array(10)].map(() => new WrappedContextState());
    private state: WrappedContextState = this.states[0];
    private currentStateIndex = 1;

    constructor(context: CanvasRenderingContext2D) {
        this.context = context;
    }

    beginPath(): void {
        this.context.beginPath();
    }

    closePath(): void {
        this.context.closePath();
    }

    moveTo(x: number, y: number): void {
        this.context.moveTo(this.xCoordinate(x), this.yCoordinate(y));
    }

    lineTo(x: number, y: number): void {
        this.context.lineTo(this.xCoordinate(x), this.yCoordinate(y));
    }

    bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
        this.context.bezierCurveTo(
            this.xCoordinate(x1),
            this.yCoordinate(y1),
            this.xCoordinate(x2),
            this.yCoordinate(y2),
            this.xCoordinate(x3),
            this.yCoordinate(y3),
        );
    }

    drawImage(image: CanvasImageSource, x1: number, y1: number, dw1: number, dh1: number, x2: number = undefined, y2: number = undefined, dw2: number = undefined, dh2: number = undefined) {
        if (x2 === undefined) {
            this.context.drawImage(
                image,
                this.xCoordinate(x1),
                this.yCoordinate(y1),
                dw1 * this.state.scaleX | 0,
                dh1 * this.state.scaleY | 0
            );
            return;
        }
        this.context.drawImage(
            image,
            x1, y1,
            dw1,
            dh1,
            this.xCoordinate(x2),
            this.yCoordinate(y2),
            dw2 * this.state.scaleX | 0,
            dh2 * this.state.scaleY | 0
        );
    }

    strokeText(text: string, x: number, y: number) {
        this.context.strokeText(text, this.xCoordinate(x), this.yCoordinate(y));
    }

    fillText(text: string, x: number, y: number) {
        this.context.fillText(text, this.xCoordinate(x), this.yCoordinate(y));
    }

    stroke(): void {
        this.context.stroke();
    }

    fill(): void {
        this.context.fill();
    }

    clip(): void {
        this.context.clip();
    }

    fillRect(x: number, y: number, width: number, height: number): void {
        this.context.fillRect(
            this.xCoordinate(x),
            this.yCoordinate(y),
            width * this.state.scaleX | 0,
            height * this.state.scaleY | 0
        );
    }

    clearRect(x: number, y: number, width: number, height: number): void {
        this.context.clearRect(
            this.xCoordinate(x),
            this.yCoordinate(y),
            width * this.state.scaleX | 0,
            height * this.state.scaleY | 0
        );
    }

    rect(x: number, y: number, width: number, height: number): void {
        this.context.rect(
            this.xCoordinate(x),
            this.yCoordinate(y),
            width * this.state.scaleX | 0,
            height * this.state.scaleY | 0
        );
    }

    arc(x: number, y: number, radius: number, start: number, end: number): void {
        this.context.ellipse(
            this.xCoordinate(x),
            this.yCoordinate(y),
            radius * this.state.scaleX | 0,
            radius * this.state.scaleY | 0,
            0,
            start,
            end
        );
    }

    xCoordinate(x: number): number {
        return this.state.x + this.state.scaleX * x | 0;
    }

    yCoordinate(y: number): number {
        return this.state.y + this.state.scaleY * y | 0;
    }

    set strokeStyle(value: string) {
        this.context.strokeStyle = value;
    }

    set fillStyle(value: string) {
        this.context.fillStyle = value;
    }

    set lineCap(value: CanvasLineCap) {
        this.context.lineCap = value;
    }

    set textBaseline(value: CanvasTextBaseline) {
        this.context.textBaseline = value;
    }

    set lineWidth(value: number) {
        this.context.lineWidth = value * this.state.scaleX | 0;
    }

    set globalAlpha(value: number) {
        this.context.globalAlpha = value;
    }

    translate(x: number, y: number): void {
        this.state.x = this.xCoordinate(x);
        this.state.y = this.yCoordinate(y);
    }

    scale(scaleX: number, scaleY: number): void {
        this.state.scaleX *= scaleX;
        this.state.scaleY *= scaleY;
    }

    rotate(angle: number): void {
        this.context.save();
        this.context.translate(this.xCoordinate(0), this.yCoordinate(0));
        this.context.scale(this.state.scaleX, this.state.scaleY);
        this.context.rotate(angle);
        this.save();
        this.state.x = 0;
        this.state.y = 0;
        this.state.scaleX = 1;
        this.state.scaleY = 1;
        this.state.rotation = true;
    }

    save(): void {
        this.states[this.currentStateIndex - 1].copyTo(this.states[this.currentStateIndex]);
        this.currentStateIndex++;
        this.state = this.states[this.currentStateIndex - 1];
    }

    restore(): void {
        if (this.state.rotation) {
            this.context.restore();
            this.currentStateIndex--;
        }
        this.currentStateIndex--;
        this.state = this.states[this.currentStateIndex - 1];
    }

    setFont(weight: number, size: number, family: string): void {
        this.context.font = `${weight} ${size * this.state.scaleX | 0}px ${family}`;
    }
}

const setFont = (context: WrappedContext, weight: number, size: number, family: string) => {
    context.setFont(weight, size, family);
};

export const wrapContext = (context: CanvasRenderingContext2D) => new WrappedContext(context);

/*/
export type WrappedContext = CanvasRenderingContext2D;
const setFont = (context: WrappedContext, weight: number, size: number, family: string) => {
    context.font = `${weight} ${size}px ${family}`;
};
export const wrapContext = (context: CanvasRenderingContext2D) => context;
//*/

interface Vector2D {
    x: number;
    y: number;
}

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

const drawRoundShapeLight = (context: WrappedContext, roundShape: RoundShape) => {
    const log = Math.log(roundShape.width * 4.4) / 1.8;
    const shift = -0.07 * log;

    if (roundShape.begin.x === roundShape.end.x && roundShape.begin.y === roundShape.end.y) {
        context.fillStyle = roundShape.light;
        context.beginPath();
        context.arc(roundShape.begin.x + shift, roundShape.begin.y + shift, log / 2, 0, TAU);
        context.fill();
    } else {
        context.strokeStyle = roundShape.light;
        context.lineWidth = log;
        context.beginPath();
        context.moveTo(roundShape.begin.x + shift, roundShape.begin.y + shift);
        context.lineTo(roundShape.end.x + shift, roundShape.end.y + shift);
        context.stroke();
    }
};

const drawRoundShape = (context: WrappedContext, roundShape: RoundShape) => {
    if (roundShape.begin.x === roundShape.end.x && roundShape.begin.y === roundShape.end.y) {
        context.fillStyle = roundShape.shadow;
        context.beginPath();
        context.arc(roundShape.begin.x, roundShape.begin.y, roundShape.width / 2, 0, TAU);
        context.fill();
    } else {
        context.strokeStyle = roundShape.shadow;
        context.lineWidth = roundShape.width;
        context.beginPath();
        context.moveTo(roundShape.begin.x, roundShape.begin.y);
        context.lineTo(roundShape.end.x, roundShape.end.y);
        context.stroke();
    }
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

    const maxRadius = 50;
    const spriteSize = 2 * maxRadius;
    const spriteScaledSize = 0.5 * spriteSize;
    const sprite = (() => {
        const canvas = document.createElement('canvas');
        canvas.width = spriteSize;
        canvas.height = spriteSize * lifeTime;
        const context = canvas.getContext('2d');
        for (let i = lifeTime; i--; ) {
            const progress = i / lifeTime;
            const yellow = 255 * min(1, 1 - 2 * progress);
            const decay = between(0, 1, 1 - progress);
            const radius = maxRadius * (1 - abs(0.3 - progress));
            context.fillStyle = `rgba(${255 * decay}, ${yellow * decay}, 0, ${0.3 * decay})`;
            context.beginPath();
            context.arc(maxRadius, maxRadius + spriteSize * i, radius, 0, TAU);
            context.closePath();
            context.fill();
        }
        return canvas;
    })();

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

        render: (context: WrappedContext) => {
            if (aliveParticles === 0) {
                return;
            }

            const transform = context.getTransform();
            context.save();
            context.resetTransform();
            context.translate(transform.m41 | 0, transform.m42 | 0);
            const scaleX = transform.m11;
            const scaleY = transform.m22;

            for (let i = aliveParticles; i--; ) {
                const particle = particles[i];
                if (particle.time >= lifeTime) {
                    aliveParticles--;
                    if (i !== aliveParticles) {
                        particles[i].x = particles[aliveParticles].x;
                        particles[i].y = particles[aliveParticles].y;
                        particles[i].time = particles[aliveParticles].time;
                        particles[i].speed.x = particles[aliveParticles].speed.x;
                        particles[i].speed.y = particles[aliveParticles].speed.y;
                    }

                    continue;
                }

                context.drawImage(
                    sprite,
                    0,
                    particle.time * spriteSize,
                    spriteSize,
                    spriteSize,
                    (particle.x - spriteScaledSize / 2) * scaleX | 0,
                    (particle.y - spriteScaledSize / 2) * scaleY | 0,
                    spriteScaledSize * scaleX | 0,
                    spriteScaledSize * scaleY | 0
                );

                particle.time++;
                particle.x += particle.speed.x;
                particle.y += particle.speed.y;
            }

            context.restore();
        }
    }
};

const enum AnimationProperty {
    LegsRotation = 0,
    ArmsRotation = 1,
}

const enum AnimationId {
    Rest = 0,
    Run = 1,
    Jump = 2,
    Falling = 3,
    Rising = 4,
};

type AnimationFrames = Array<{[property: number]: number} | {goTo: AnimationId}>

const animationsList: Array<[AnimationId, AnimationFrames]> = [
    [
        AnimationId.Rest,
        [
            {
                [AnimationProperty.LegsRotation]: -PI / 2 - 0.1,
                [AnimationProperty.ArmsRotation]: -PI / 2 - 0.1
            },
        ]
    ],

    [
        AnimationId.Run,
        [
            {
                [AnimationProperty.LegsRotation]: -PI / 2 - 0.6,
                [AnimationProperty.ArmsRotation]: -PI / 2 + 0.6
            },
            {
                [AnimationProperty.LegsRotation]: -PI / 2 + 0.6,
                [AnimationProperty.ArmsRotation]: -PI / 2 - 0.6
            },
        ]
    ],

    [
        AnimationId.Jump,
        [
            {
                [AnimationProperty.LegsRotation]: -PI / 2 - 0.8,
                [AnimationProperty.ArmsRotation]: -PI / 2 + 1.2
            },
            { goTo: AnimationId.Falling },
        ]
    ],

    [
        AnimationId.Falling,
        [
            {
                [AnimationProperty.LegsRotation]: -PI / 2 - 0.2,
                [AnimationProperty.ArmsRotation]: -PI / 2 - 2.2
            },
            {
                [AnimationProperty.LegsRotation]: -PI / 2 - 0.3,
                [AnimationProperty.ArmsRotation]: -PI / 2 - 2.5
            },
        ],
    ],

    [
        AnimationId.Rising,
        [
            {
                [AnimationProperty.LegsRotation]: -PI / 2 - 0.1,
                [AnimationProperty.ArmsRotation]: -PI / 2 - 0.1
            },
            {
                [AnimationProperty.LegsRotation]: -PI / 2 - 0.3,
                [AnimationProperty.ArmsRotation]: -PI / 2 - 0.3
            },
        ]
    ]
];
const animations = new Map<AnimationId, AnimationFrames>(animationsList);

export class Player extends GameObject {
    speed: Vector2D = {x: 0, y: 0};
    width: number = 70;
    height: number = 150;
    direction: number = 1;
    rocket: boolean = false;
    jumpGrace: number = 0;
    high: number = Infinity;

    legGap = 0.25;
    armGap = 0.5;

    body = new RoundShape(0, 0.1, 0, 0.1, 1.0);
    leftLeg = new RoundShape(-this.legGap * 0.9, 0.3, -this.legGap, 0.8, 0.4);
    rightLeg = new RoundShape(this.legGap * 0.9, 0.3, this.legGap, 0.8, 0.4);
    head = new RoundShape(0, -0.5, 0, -0.5, 1.0);
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

    animation: AnimationId = AnimationId.Rest;
    currentFrame = 0;

    updateAnimation() {
        const animation = animations.get(this.animation);
        if (this.currentFrame >= animation.length) {
            this.currentFrame = 0;
        }

        const frame = animation[this.currentFrame];
        if ('goTo' in frame) {
            this.animation = frame.goTo;
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

    render(context: WrappedContext) {
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

        this.drawGlass(context);
        context.fillStyle = '#000';
        context.fill();

        context.fillStyle = context.strokeStyle = '#fff';
        context.lineWidth = 0.05;
        context.beginPath();
        context.bezierCurveTo(0.35 * this.direction, -0.7, 0.34 * this.direction, -0.75, 0.26 * this.direction, -0.82);
        context.stroke();

        context.beginPath();
        context.arc(0.4 * this.direction, -0.6, 0.025, 0, TAU);
        context.fill();

        context.restore();
    }

    drawGlass(context: WrappedContext) {
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
        const previousSpeed = state.player.speed.y;

        if (!state.ending && keyboard.arrowLeft) {
            state.player.speed.x = max(-maxHorizontalSpeed, state.player.speed.x - horizontalAccel);
            state.player.direction = -1;
            state.player.animation = AnimationId.Run;
        } else if (!state.ending && keyboard.arrowRight) {
            state.player.speed.x = min(maxHorizontalSpeed, state.player.speed.x + horizontalAccel);
            state.player.direction = 1;
            state.player.animation = AnimationId.Run;
        } else {
            state.player.speed.x = abs(state.player.speed.x) > horizontalAccel
                ? state.player.speed.x - sign(state.player.speed.x) * horizontalAccel
                : 0;

            if (state.onPlatform) {
                state.player.animation = AnimationId.Rest;
            }
        }

        if (!state.onPlatform) {
            state.player.speed.y = min(TERMINAL_VELOCITY, state.player.speed.y + GRAVITY);
        } else if (state.player.speed.y > 0) {
            state.player.speed.y = 0;
        }

        if ((state.onPlatform || this.jumpGrace > 0) && !state.ending && keyboard.arrowUp) {
            this.jumpGrace = 0;
            state.player.speed.y = -JUMP_SPEED;
            state.player.animation = AnimationId.Jump;
            state.player.currentFrame = 0;
            soundPlayer.playJump();
        }

        if (state.onPlatform) {
            this.jumpGrace = 85 * STEPS_PER_MILISECOND;
        } else {
            this.jumpGrace = max(0, this.jumpGrace - 1);
            if (state.player.speed.y > 0) {
                state.player.animation = AnimationId.Falling;
            } else if (state.player.animation !== AnimationId.Jump) {
                if (state.player.rocket) {
                    state.player.animation = AnimationId.Rising;
                } else {
                    state.player.animation = AnimationId.Rest;
                }
            }
        }

        state.player.position.x += state.player.speed.x;
        state.player.position.y += state.player.speed.y;

        if (previousSpeed <= 0 && state.player.speed.y >= 0) {
            state.player.high = state.player.bottom;
        }
    }
}

abstract class InteractiveObject extends GameObject {
    id: number;
    layer: number;

    abstract render(context: WrappedContext): void;
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

    render(context: WrappedContext) {
        context.save();
        context.translate(this.position.x + this.width / 2, this.position.y + this.width / 2);
        this.rotation++;
        context.scale(1 / SPRITES_SCALE, 1 / SPRITES_SCALE);
        context.translate(this.width / 2, this.height / 2);
        context.rotate(cos(this.rotation * 0.1) * 0.1);
        context.translate(-Rocket.sprite.width / 2, -Rocket.sprite.height * 4 / 5);
        context.drawImage(Rocket.sprite, 0, 0, Rocket.sprite.width, Rocket.sprite.height);

        context.restore();
    }

    private static sprite = (() => {
        const canvas = document.createElement('canvas');
        canvas.width = 54 * SPRITES_SCALE;
        canvas.height = 70 * SPRITES_SCALE;
        const context = canvas.getContext('2d');
        context.save();
        context.scale(SPRITES_SCALE, SPRITES_SCALE);
        context.translate(27, 63);

        const bodyPath = () => {
            context.beginPath();
            context.moveTo(0, -1);
            context.bezierCurveTo(0.3, -0.8, 0.3, -0.4, 0.15, -0.1);
            context.lineTo(-0.15, -0.1)
            context.bezierCurveTo(-0.3, -0.4, -0.3, -0.8, 0, -1);
        };

        const wingsPath = () => {
            context.beginPath();
            context.moveTo(0.25, -0.5);
            context.bezierCurveTo(0.45, -0.35, 0.4, 0, 0.4, 0);
            context.bezierCurveTo(0.3, -0.2, 0.20, -0.2, 0.20, -0.2);
            context.moveTo(-0.25, -0.5);
            context.bezierCurveTo(-0.45, -0.35, -0.4, 0, -0.4, 0);
            context.bezierCurveTo(-0.3, -0.2, -0.20, -0.2, -0.20, -0.2);
        };

        context.scale(60, 60);

        context.lineWidth = 0.07;
        context.lineCap = 'round';
        context.strokeStyle = '#fff';
        bodyPath();
        context.stroke();
        wingsPath();
        context.stroke();

        context.fillStyle = '#bbb';
        bodyPath();
        context.fill();

        context.fillStyle = '#69f';
        wingsPath();
        context.fill();

        context.restore();

        return canvas;
    })();

    tick(state: GameState) {
        if (this.position.y > state.screenArea.bottom + WORLD_SIZE) {
            state.removeObject(this);
        }

        if (!state.ending && this.boundBoxCollision(state.player)) {
            soundPlayer.playRocket();
            state.player.speed.y = -1.5 * JUMP_SPEED;
            state.player.rocket = true;
            state.player.jumpGrace = 0;

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

    abstract render(context: WrappedContext): void;
    tick(state: GameState) {
        if (this.position.y > state.screenArea.bottom + WORLD_SIZE) {
            state.removeObject(this);
        }
    }

    preTick(state: GameState) {
        if (this !== state.ignorePlatform && this.isPlayerOn(state.player)) {
            state.onPlatform = this;
            state.player.position.y = this.top - state.player.height;
        }
    }

    isPlayerOn(player: Player): boolean {
        return (
            player.speed.y >= 0
            && player.right > this.left
            && player.left < this.right
            && player.high < this.top + 1
            && abs(player.bottom - this.top) < 10
        );
    }
}

class StaticPlatform extends Platform {
    private static sprite = (() => {
        const canvas = document.createElement('canvas');
        canvas.width = Platform.width * SPRITES_SCALE;
        canvas.height = (Platform.height + 20) * SPRITES_SCALE;
        const context = canvas.getContext('2d');

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

        context.save();
        context.scale(SPRITES_SCALE, SPRITES_SCALE);
        context.translate(0, 10);

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

        return canvas;
    })();

    render(context: WrappedContext) {
        context.drawImage(StaticPlatform.sprite, this.position.x, this.position.y - 10, Platform.width, Platform.height + 20);
    }
}

class IcePlatform extends Platform {
    time: number = IcePlatform.maxTime;
    disappearing: boolean = false;

    private static sprite = (() => {
        const canvas = document.createElement('canvas');
        canvas.width = Platform.width * SPRITES_SCALE;
        canvas.height = (Platform.height + 40) * SPRITES_SCALE;
        const context = canvas.getContext('2d');

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

        context.save();
        context.scale(SPRITES_SCALE, SPRITES_SCALE);
        context.translate(0, 10);

        // Start bottom and middle
        context.save();
        context.translate(Platform.width / 2, Platform.height / 2 + 20);
        context.scale(Platform.width / 2, Platform.height / 2);
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
        context.translate(Platform.width / 2, Platform.height / 2 - 10);
        context.scale(Platform.width / 2, Platform.height / 2);
        context.fillStyle = radial2;

        context.beginPath();
        context.ellipse(0, 0, 1, 1, 0, 0, TAU);
        context.fill();
        context.restore();
        // End top

        context.restore();

        return canvas;
    })();

    render(context: WrappedContext) {
        context.globalAlpha = this.time / IcePlatform.maxTime;
        context.drawImage(IcePlatform.sprite, this.position.x, this.position.y - 10, Platform.width, Platform.height + 40);
        context.globalAlpha = 1;
    }

    tick(state: GameState) {
        super.tick(state);

        if (this.disappearing) {
            if (this.time <= 0) {
                state.removeObject(this);
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
        return 400 * STEPS_PER_MILISECOND;
    }
}

class MovingPlatform extends Platform {
    private static lightSprites = (() => {
        const colors = [
            {red: 255, green: 0, blue: 0},
            {red: 255, green: 255, blue: 0},
            {red: 0, green: 0, blue: 255},
        ];

        return colors.map(({red, green, blue}) => {
            const lightCanvas = document.createElement('canvas');
            const side = 50;
            lightCanvas.width = side;
            lightCanvas.height = side;
            const lightContext = lightCanvas.getContext('2d');

            const gradient = lightContext.createRadialGradient(0, 0, 0, 0, 0, 1);
            gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0.9)`);
            gradient.addColorStop(0.1, `rgba(${red}, ${green}, ${blue}, 0.7)`);
            gradient.addColorStop(0.2, `rgba(${red}, ${green}, ${blue}, 0.2)`);
            gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);

            lightContext.save();
            lightContext.translate(side / 2, side / 2);
            lightContext.scale(side / 2, side / 2);
            lightContext.fillStyle = gradient;
            lightContext.beginPath();
            lightContext.arc(0, 0, 1, 0, TAU);
            lightContext.fill();
            lightContext.restore();

            return lightCanvas;
        });
    })();
    private static lightsAngle = Math.PI * 2 / MovingPlatform.lightSprites.length;

    private static sprite = (() => {
        const canvas = document.createElement('canvas');
        canvas.width = Platform.width * SPRITES_SCALE;
        canvas.height = (Platform.height + 20) * SPRITES_SCALE;
        const context = canvas.getContext('2d');
        context.save();
        context.scale(SPRITES_SCALE, SPRITES_SCALE);

        context.fillStyle = '#aaa';
        context.beginPath();
        context.ellipse(Platform.width / 2, Platform.height / 2 + 20, Platform.width / 2, Platform.height / 2, 0, 0, TAU);
        context.fill();

        context.fillStyle = 'black';
        context.beginPath();
        context.ellipse(Platform.width / 2, Platform.height / 2 + 10, Platform.width / 2, Platform.height / 2, 0, 0, TAU);
        context.fill();

        context.fillStyle = '#aaa';
        context.beginPath();
        context.ellipse(Platform.width / 2, Platform.height / 2, Platform.width / 2, Platform.height / 2, 0, 0, TAU);
        context.fill();

        context.restore();

        return canvas;
    })();

    direction: number = 1;

    render = (() => {
        let lightRotation: number = 0;

        const renderLight = (context: WrappedContext, sprite: typeof MovingPlatform.lightSprites[0], lightDirection: number) => {
            const direction = lightDirection + lightRotation;
            context.save();
            context.translate(
                this.width / 2 + (this.width * cos(direction)) / 2,
                this.height / 2 - 4 + (this.height * sin(direction)) / 2,
            );
            context.drawImage(sprite, 0, 0, sprite.width, sprite.height, -20, -20, 40, 40);
            context.restore();
        };

        return (context: WrappedContext) => {
            context.save();
            context.translate(this.position.x, this.position.y);

            for (let i = MovingPlatform.lightSprites.length; i--; ) {
                const lightDirection = MovingPlatform.lightsAngle * i;
                if ((lightDirection + lightRotation) % TAU >= PI) {
                    renderLight(context, MovingPlatform.lightSprites[i], lightDirection);
                }
            }

            context.drawImage(MovingPlatform.sprite, 0, -10, Platform.width, Platform.height + 20);

            for (let i = MovingPlatform.lightSprites.length; i--; ) {
                const lightDirection = MovingPlatform.lightsAngle * i;
                if ((lightDirection + lightRotation) % TAU < PI) {
                    renderLight(context, MovingPlatform.lightSprites[i], lightDirection);
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

interface LevelConfig {
    minStaticPlatform: number;
    maxStaticPlatform: number;
    minRocket: number;
    maxRocket: number;
    minMovingPlatform: number;
    maxMovingPlatform: number;
    minIcePlatform: number;
    maxIcePlatform: number;
}

class GameState {
    paused: boolean = false;
    ending: boolean = false;
    over: boolean = false;
    previousTime: number = 0;
    player: Player = new Player();
    objectLayers: Array<Array<InteractiveObject>> = [[], []];
    screenArea: ScreenArea = new ScreenArea();
    nextPlatformTop: number = 0;
    previousPlatformX: number = 0;
    backgroundY: number = 0;
    onPlatform: Platform | null = null;
    ignorePlatform: Platform | null = null;
    highScore: number = LocalStorage.get().highScore;
    score: number = 0;
    rockets: boolean = false;
    public static normalMode = () => {
        let level = 0;
        let createdPlatforms = 0;

        const initialLevels = [
            {
                platformCount: 9,
                minStaticPlatform: 0,
                maxStaticPlatform: 1,
                minRocket: 0,
                maxRocket: 0,
                minMovingPlatform: 0,
                maxMovingPlatform: 0,
                minIcePlatform: 0,
                maxIcePlatform: 0,
            },
            {
                platformCount: 1,
                minStaticPlatform: 0,
                maxStaticPlatform: 1,
                minRocket: 0,
                maxRocket: 1,
                minMovingPlatform: 0,
                maxMovingPlatform: 0,
                minIcePlatform: 0,
                maxIcePlatform: 0,
            },
            {
                platformCount: 10,
                minStaticPlatform: 0,
                maxStaticPlatform: 1,
                minRocket: 0,
                maxRocket: 0,
                minMovingPlatform: 0,
                maxMovingPlatform: 0,
                minIcePlatform: 0,
                maxIcePlatform: 0,
            },
            {
                platformCount: 20,
                minStaticPlatform: 0,
                maxStaticPlatform: 0.5,
                minRocket: 0,
                maxRocket: 0,
                minMovingPlatform: 0,
                maxMovingPlatform: 0,
                minIcePlatform: 0.5,
                maxIcePlatform: 1,
            },
            {
                platformCount: 20,
                minStaticPlatform: 0,
                maxStaticPlatform: 0.5,
                minRocket: 0,
                maxRocket: 0,
                minMovingPlatform: 0.5,
                maxMovingPlatform: 1,
                minIcePlatform: 0,
                maxIcePlatform: 0,
            }
        ];

        const levelConfigs = [
            // all mixed
            {
                platformCount: 30,
                minStaticPlatform: 0,
                maxStaticPlatform: 0.6,
                minRocket: 0,
                maxRocket: 0.1,
                minMovingPlatform: 0.6,
                maxMovingPlatform: 0.9,
                minIcePlatform: 0.9,
                maxIcePlatform: 1.0,
            },
            // only moving platforms
            {
                platformCount: 10,
                minStaticPlatform: 0,
                maxStaticPlatform: 0,
                minRocket: 0,
                maxRocket: 0,
                minMovingPlatform: 0,
                maxMovingPlatform: 1,
                minIcePlatform: 0,
                maxIcePlatform: 0,
            },
            // only ice
            {
                platformCount: 30,
                minStaticPlatform: 0,
                maxStaticPlatform: 0,
                minRocket: 0,
                maxRocket: 0,
                minMovingPlatform: 0,
                maxMovingPlatform: 0,
                minIcePlatform: 0,
                maxIcePlatform: 1,
            },
            // half ice, half moving
            {
                platformCount: 30,
                minStaticPlatform: 0,
                maxStaticPlatform: 0,
                minRocket: 0,
                maxRocket: 0,
                minMovingPlatform: 0,
                maxMovingPlatform: 0.5,
                minIcePlatform: 0.5,
                maxIcePlatform: 1,
            },
            // mixed with extra rockets
            {
                platformCount: 50,
                minStaticPlatform: 0,
                maxStaticPlatform: 0.7,
                minRocket: 0,
                maxRocket: 0.7,
                minMovingPlatform: 0.6,
                maxMovingPlatform: 0.9,
                minIcePlatform: 0.9,
                maxIcePlatform: 1.0,
            }
        ];

        return () => {
            let currentLevel;
            if (level < initialLevels.length) {
                currentLevel = initialLevels[level];
                createdPlatforms++;
                if (currentLevel.platformCount === createdPlatforms) {
                    level++;
                    createdPlatforms = 0;
                }
            } else {
                currentLevel = levelConfigs[level - initialLevels.length];
                createdPlatforms++;
                if (currentLevel.platformCount === createdPlatforms) {
                    level = initialLevels.length + (random() * levelConfigs.length | 0);
                    createdPlatforms = 0;
                }
            }

            return currentLevel;
        };
    };

    public static rocketsMode = () => () => ({
        minStaticPlatform: 0,
        maxStaticPlatform: 0.6,
        minRocket: 0,
        maxRocket: 0.6,
        minMovingPlatform: 0.6,
        maxMovingPlatform: 0.9,
        minIcePlatform: 0.9,
        maxIcePlatform: 1.0,
    });

    levelConfig: () => LevelConfig = GameState.normalMode();

    tick() {
        if (keyboard.arrowDown && !this.ignorePlatform) {
            this.ignorePlatform = this.onPlatform;
        }

        this.onPlatform = null;
        for (let layerIndex = this.objectLayers.length; layerIndex--; ) {
            const layer = this.objectLayers[layerIndex];
            for (let objectIndex = layer.length; objectIndex--; ) {
                layer[objectIndex].preTick(this);
            }
        }

        if (this.ignorePlatform) {
            if ((this.onPlatform && this.onPlatform !== this.ignorePlatform) || this.player.speed.y < 0) {
                this.ignorePlatform = null;
            }
        }

        if (this.screenArea.top - WORLD_SIZE < this.nextPlatformTop) {
            let platform: Platform;
            const type = random();
            const levelConfig = this.levelConfig();
            if (type >= levelConfig.minIcePlatform && type < levelConfig.maxIcePlatform) {
                platform = new IcePlatform();
            }

            if (type >= levelConfig.minMovingPlatform && type < levelConfig.maxMovingPlatform) {
                platform = new MovingPlatform();
            }

            if (type >= levelConfig.minStaticPlatform && type < levelConfig.maxStaticPlatform) {
                platform = new StaticPlatform();
            }

            this.addObject(platform);
            platform.position.x = between(0, WORLD_SIZE - platform.width, this.previousPlatformX + (0.5 - random()) * 500);
            platform.position.y = this.nextPlatformTop;
            this.previousPlatformX = platform.position.x;
            this.nextPlatformTop = this.nextPlatformTop - 100 - random() * 50;

            if (type >= levelConfig.minRocket && type < levelConfig.maxRocket) {
                const rocket = new Rocket();
                rocket.position.x = platform.left + (platform.width - rocket.width) * random();
                rocket.position.y = platform.top - rocket.height;
                this.addObject(rocket, 0);
            }
        }

        this.player.tick(this);

        for (let layerIndex = this.objectLayers.length; layerIndex--; ) {
            const layer = this.objectLayers[layerIndex];
            for (let objectIndex = layer.length; objectIndex--; ) {
                layer[objectIndex].tick(this);
            }
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
            this.score = -(this.screenArea.top / 100 | 0);
        }
    }

    addObject(object: InteractiveObject, layerIndex: number = 1) {
        const layer = this.objectLayers[layerIndex];
        layer.push(object);
        object.id = layer.length;
        object.layer = layerIndex;
    }

    removeObject(object: InteractiveObject) {
        const layer = this.objectLayers[object.layer];
        const last = layer.pop();
        if (object !== last) {
            last.id = object.id;
            layer[object.id - 1] = last;
        }
    }
}

/*
let sps: number = 0;
let fps: number = 0;
let spsCounter: number = 0;
let fpsCounter: number = 0;
*/

const render = (state: GameState, context: WrappedContext) => {
    context.save();
    context.translate(0, canvas.height / 2);
    context.translate(0, -WORLD_SIZE * scene.scale / 2);

    context.beginPath();
    context.rect(0, 0, canvas.width, WORLD_SIZE * scene.scale);
    context.closePath();
    context.clip();

    context.translate(canvas.width / 2, 0);
    context.scale(scene.scale, scene.scale);
    context.translate(-WORLD_SIZE / 2, 0);

    context.translate(-state.screenArea.left, -state.screenArea.top);

    for (let layerIndex = state.objectLayers.length; layerIndex--; ) {
        const layer = state.objectLayers[layerIndex];
        for (let objectIndex = layer.length; objectIndex--; ) {
            layer[objectIndex].render(context);
        }
    }
    state.player.render(context);

    context.restore();

    context.save();
    context.scale(scene.scale, scene.scale);
    const highScore = `HI-SCORE ${state.highScore.toString().padStart(6, '0')}`;
    const score = `SCORE    ${state.score.toString().padStart(6, '0')}`;
    context.textBaseline = 'top';
    setFont(context, 1000, 40, 'monospace');
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
    state.levelConfig = rockets ? GameState.rocketsMode() : GameState.normalMode();

    {
        const platform = new StaticPlatform();
        state.addObject(platform);
        platform.position.x = (WORLD_SIZE - platform.width) / 2;
        platform.position.y = 200;
        state.previousPlatformX = platform.position.x;
    }

    const animate = (currentTime: number) => {
        state.updateScore();

        const canvasContext = canvas.getContext('2d');
        // canvasContext.imageSmoothingEnabled = false;
        // canvasContext.imageSmoothingQuality = 'low';
        const context = wrapContext(canvasContext);
        canvas.width = canvas.width; // This seems to be faster than clearRect for some reason
        background.draw(context, state.backgroundY, canvas.width, canvas.height);
        render(state, context);

        const timeGap = min(500, currentTime - state.previousTime + gameTimeGap);
        const stepsTorun = (timeGap * STEPS_PER_MILISECOND) | 0;
        gameTimeGap = timeGap - (stepsTorun / STEPS_PER_MILISECOND);
        //spsCounter += stepsTorun;
        state.previousTime = currentTime;
        if (!state.paused) {
            const targetStep = currentStep + stepsTorun;
            for (; currentStep < targetStep; currentStep++) {
                state.tick();
            }
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
            game.startLoop();
        },

        animate,

        state,

        loop: (currentTime: number) => {
            game.animate(currentTime);

            if (!game.state.over) {
                window.requestAnimationFrame(game.loop);
            }
        },

        startLoop: () => {
            document.body.classList.add('playing');
            window.requestAnimationFrame((currentTime: number) => {
                state.previousTime = currentTime;
                game.loop(currentTime);
            });
        },

        pause: () => {
            document.body.classList.remove('playing');
            state.paused = true;
        },

        unpause: () => {
            document.body.classList.add('playing');
            state.paused = false;
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

onerror = (error) => {
    alert(error.toString());
};
