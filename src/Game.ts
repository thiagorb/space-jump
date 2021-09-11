import { soundPlayer } from "./Audio";
import { getBackground as getBackground } from "./Background";
import { WORLD_SIZE, scene as scene, keyboard, TAU, random, canvas } from "./Globals";
import { LocalStorage } from "./LocalStorage";
import { activateMenu, fadeInTransition, fadeOutTransition, waitNextFrame } from "./Main";
import { ranking } from "./Ranking";

const STEPS_PER_SECOND = 60;
const STEPS_PER_MILISECOND = STEPS_PER_SECOND / 1000;
const SPEED_UNIT = 1 / STEPS_PER_SECOND;
const ACCELERATION_UNIT = SPEED_UNIT / STEPS_PER_SECOND;
const GRAVITY = 2000 * ACCELERATION_UNIT;
const JUMP_SPEED = 1200 * SPEED_UNIT;
const TERMINAL_VELOCITY = 1000 * SPEED_UNIT;
const SPRITES_SCALE = 2;
const { cos, sin, max, min, abs, PI } = Math;
const sign = (value: number): (-1 | 0 | 1) => value > 0 ? 1 : (value < 0 ? -1 : 0);
const between = (lower: number, upper: number, value: number) => max(lower, min(upper, value));

interface Vector2D {
    x: number;
    y: number;
}

abstract class GameObject {
    position: Vector2D = { x: 0, y: 0 };

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
        this.begin = { x: x1, y: y1 };
        this.end = { x: x2, y: y2 };
    }
}

const drawRoundShapeLight = (context: CanvasRenderingContext2D, roundShape: RoundShape) => {
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

const drawRoundShape = (context: CanvasRenderingContext2D, roundShape: RoundShape) => {
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

interface Color {
    r: number,
    g: number,
    b: number,
    a: number
}

const createParticlesMaker = (
    {
        lifeTime,
        maxParticles,
        maxRadius,
        speed,
        direction,
        scale,
        mainAxisShift,
        colorOverTime,
    }:
        {
            lifeTime: number,
            maxParticles: number,
            maxRadius: number,
            speed: number,
            direction: number,
            scale: number,
            mainAxisShift: number,
            colorOverTime: (progress: number) => Color
        }
) => {
    const directionCos = cos(direction);
    const directionSin = sin(direction);
    const spriteSize = 2 * maxRadius;
    const spriteScaledSize = scale * spriteSize;
    const sprite = (() => {
        const canvas = document.createElement('canvas');
        canvas.width = spriteSize;
        canvas.height = spriteSize * lifeTime;
        const context = canvas.getContext('2d');
        for (let i = lifeTime; i--;) {
            const progress = i / lifeTime;
            const color = colorOverTime(progress);
            context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
            context.beginPath();
            const radius = maxRadius * (1 - abs(0.3 - progress));
            context.arc(maxRadius, maxRadius + spriteSize * i, radius, 0, TAU);
            context.closePath();
            context.fill();
        }
        return canvas;
    })();

    const make = () => {
        const particles = [...new Array(maxParticles)].map(() => ({
            speed: {
                x: 0,
                y: 0,
            },
            x: 0,
            y: 0,
            time: 0,
        }));

        let aliveParticles = 0;

        const add = (x: number, y: number, count: number, crossAxisSpread: number) => {
            for (let i = 0; i < count; i++) {
                aliveParticles = min(aliveParticles + 1, particles.length - 1);
                const particle = particles[aliveParticles - 1];
                const mainAxisSpeed = (speed + i);
                const crossAxisSpeed = (0.5 - random()) * 3;
                particle.speed.x = mainAxisSpeed * directionCos + crossAxisSpeed * directionSin;
                particle.speed.y = -mainAxisSpeed * directionSin + crossAxisSpeed * directionCos;
                const crossAxisShift = (0.5 - random()) * crossAxisSpread;
                particle.x = x - spriteScaledSize / 2 + mainAxisShift * i * directionCos + crossAxisShift * directionSin;
                particle.y = y - spriteScaledSize / 2 - mainAxisShift * i * directionSin + crossAxisShift * directionCos;
                particle.time = 0;
            }
        };

        const render = (context: CanvasRenderingContext2D) => {
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
                    particle.x * scaleX | 0,
                    particle.y * scaleY | 0,
                    spriteScaledSize * scaleX | 0,
                    spriteScaledSize * scaleY | 0
                );

                particle.time++;
                particle.x += particle.speed.x;
                particle.y += particle.speed.y;
            }

            context.restore();
        };

        return { add, render };
    };

    return { make };
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

type AnimationFrames = Array<{ [property: number]: number } | { goTo: AnimationId }>

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
    ],
];
const animations = new Map<AnimationId, AnimationFrames>(animationsList);

export class Player extends GameObject {
    speed: Vector2D = { x: 0, y: 0 };
    width: number = 70;
    height: number = 150;
    direction: number = 1;
    rocket: boolean = false;
    jumpGrace: number = 0;
    high: number = Infinity;
    dead: boolean = false;

    legGap = 0.25;
    armGap = 0.5;

    body = new RoundShape(0, 0.1, 0, 0.1, 1.0);
    leftLeg = new RoundShape(-this.legGap * 0.9, 0.3, -this.legGap, 0.8, 0.4);
    rightLeg = new RoundShape(this.legGap * 0.9, 0.3, this.legGap, 0.8, 0.4);
    head = new RoundShape(0, -0.5, 0, -0.5, 1.0);
    leftArm = new RoundShape(-this.armGap * 0.8, -0.1, -this.armGap, 0.3, 0.4);
    rightArm = new RoundShape(this.armGap * 0.8, -0.1, this.armGap, 0.3, 0.4);

    rocketParticles = createParticlesMaker({
        lifeTime: 20,
        maxParticles: 250,
        maxRadius: 25,
        speed: 10,
        direction: -PI / 2,
        scale: 1,
        mainAxisShift: 3,
        colorOverTime: (progress: number) => {
            const yellow = 255 * min(1, 1 - 2 * progress);
            const decay = between(0, 1, 1 - progress);
            return { r: 255 * decay, g: yellow * decay, b: 0, a: 0.3 * decay };
        },
    }).make();

    animationState = {
        [AnimationProperty.LegsRotation]: -PI / 2,
        [AnimationProperty.ArmsRotation]: -PI / 2,
    };

    private animationSpeed = 0.12;
    private deadAnimationSpeed = 0.04;

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
        const animationSpeed = this.dead ? this.deadAnimationSpeed : this.animationSpeed;
        for (const key in this.animationState) {
            const delta = frame[key] - this.animationState[key];
            if (abs(delta) < animationSpeed) {
                this.animationState[key] = frame[key];
            } else {
                reachedFrame = false;
                this.animationState[key] += animationSpeed * sign(delta);
            }
        }

        if (reachedFrame) {
            this.currentFrame++;
        }
    }

    render(context: CanvasRenderingContext2D) {
        context.save();

        if (this.rocket) {
            this.rocketParticles.add(this.position.x + this.width / 2, this.position.y + this.height / 2, 10, 10);

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
        const previousSpeed = this.speed.y;

        if (!this.dead && keyboard.arrowLeft) {
            this.speed.x = max(-maxHorizontalSpeed, this.speed.x - horizontalAccel);
            this.direction = -1;
            this.animation = AnimationId.Run;
        } else if (!this.dead && keyboard.arrowRight) {
            this.speed.x = min(maxHorizontalSpeed, this.speed.x + horizontalAccel);
            this.direction = 1;
            this.animation = AnimationId.Run;
        } else {
            this.speed.x = abs(this.speed.x) > horizontalAccel
                ? this.speed.x - sign(this.speed.x) * horizontalAccel
                : 0;

            if (state.onPlatform) {
                this.animation = AnimationId.Rest;
            }
        }

        if (!state.onPlatform) {
            this.speed.y = min(TERMINAL_VELOCITY, this.speed.y + GRAVITY);
        } else if (this.speed.y > 0) {
            this.speed.y = 0;
        }

        if ((state.onPlatform || this.jumpGrace > 0) && !this.dead && keyboard.arrowUp) {
            this.jumpGrace = 0;
            this.speed.y = -JUMP_SPEED;
            this.animation = AnimationId.Jump;
            this.currentFrame = 0;
            soundPlayer.playJump();
        }

        if (state.onPlatform) {
            this.jumpGrace = 85 * STEPS_PER_MILISECOND;
        } else {
            this.jumpGrace = max(0, this.jumpGrace - 1);
            if (this.speed.y > 0) {
                this.animation = AnimationId.Falling;
            } else if (this.animation !== AnimationId.Jump) {
                if (this.rocket) {
                    this.animation = AnimationId.Rising;
                } else {
                    this.animation = AnimationId.Rest;
                }
            }
        }

        this.position.x += this.speed.x;
        this.position.y += this.speed.y;

        if (previousSpeed <= 0 && this.speed.y >= 0) {
            this.high = this.bottom;
        }

        if (this.top > state.screenArea.bottom && this.speed.y >= state.screenArea.speed) {
            this.die();
        }
    }

    die() {
        this.dead = true;
    }
}

abstract class InteractiveObject extends GameObject {
    id: number;
    layer: number;

    abstract render(context: CanvasRenderingContext2D): void;
    tick(state: GameState) { }
    preTick(state: GameState) { }
}

class Alert extends InteractiveObject {
    width: number = 0;
    height: number = 0;
    visualAlert: number = 0;
    alpha: number = 0;

    render(context: CanvasRenderingContext2D) {
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height * 0.2);
        context.globalAlpha = this.alpha;
        gradient.addColorStop(0, 'rgba(255, 0, 0, 1.0)')
        gradient.addColorStop(0.3, 'rgba(255, 0, 0, 0.4)')
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)')
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height * 0.2);
        this.visualAlert++;
        context.globalAlpha = 1;
    }

    tick(state: GameState) {
        this.alpha = Math.abs((this.visualAlert % Comet.period) / Comet.period - 0.5);
        if (this.bottom > state.screenArea.top && this.alpha < 0.1) {
            state.removeObject(this);
        }
    }
}

class Comet extends InteractiveObject {
    public static radius: number = 25;
    width: number = Comet.radius * 2;
    height: number = Comet.radius * 2;
    public static period = STEPS_PER_SECOND;
    private static tailDirection = PI / 8;

    private static particlesMaker = createParticlesMaker({
        lifeTime: 20,
        maxParticles: 250,
        maxRadius: Comet.radius / 3 | 0,
        direction: Comet.tailDirection,
        speed: 30,
        scale: 6,
        mainAxisShift: 10,
        colorOverTime: (progress: number) => {
            const hueShift = 255 * min(1, 1 - 2 * progress);
            const decay = between(0, 1, 1 - progress);
            return { r: 255 * decay, g: hueShift * decay, b: 255, a: 0.1 * decay };
        },
    });

    private particles = Comet.particlesMaker.make();

    private static sprite = (() => {
        const spreadFactor = 2;
        const distanceBetweenCenters = Comet.radius * 8;
        const canvas = document.createElement('canvas');
        const width = Comet.radius + distanceBetweenCenters * cos(Comet.tailDirection) + Comet.radius * spreadFactor;
        const height = Comet.radius + distanceBetweenCenters * sin(Comet.tailDirection) + Comet.radius * spreadFactor;
        canvas.width = SPRITES_SCALE * width;
        canvas.height = SPRITES_SCALE * height;
        const context = canvas.getContext('2d');
        context.scale(SPRITES_SCALE, SPRITES_SCALE);

        const radius1 = Comet.radius;
        const center1X = Comet.radius;
        const center1Y = height - Comet.radius;
        context.beginPath();
        context.fillStyle = 'rgba(255, 255, 255, 0.8)';
        context.arc(center1X, center1Y, Comet.radius * 0.8, 0, TAU);
        context.fill();

        for (let i = 0; i < 500; i++) {
            const dir = random() * TAU;
            const distance = random() * 0.8;
            const gradient = context.createLinearGradient(0, 0, 1.5 * distanceBetweenCenters * random(), 0);
            gradient.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
            gradient.addColorStop(0.2, `rgba(255, 255, 255, 0.01)`);
            gradient.addColorStop(1, `rgba(255, 255, 255, 0.0)`);
            context.fillStyle = gradient;
            context.save();
            context.translate(center1X + distance * cos(dir) * radius1, center1Y - distance * sin(dir) * radius1);
            context.moveTo(0, 0);
            context.rotate(-Comet.tailDirection + (0.5 - random()) * PI / 6);
            context.fillRect(0, -5, distanceBetweenCenters * 2, 10);
            context.restore();
        }
        return canvas;
    })();

    render(context: CanvasRenderingContext2D) {
        this.particles.add(this.position.x + this.width / 2, this.position.y + this.height / 2, 2, 10);
        this.particles.render(context);
        context.drawImage(
            Comet.sprite,
            this.position.x,
            this.position.y + this.height - Comet.sprite.height / SPRITES_SCALE,
            Comet.sprite.width / SPRITES_SCALE,
            Comet.sprite.height / SPRITES_SCALE
        );
    }

    tick(state: GameState) {
        if (this.boundBoxCollision(state.player)) {
            state.player.die();
        }

        if (this.position.x < -WORLD_SIZE || this.position.y > state.screenArea.bottom + WORLD_SIZE / 2) {
            state.removeObject(this);
        }

        if (!state.paused && this.top < state.player.bottom) {
            soundPlayer.playAlert();
        }

        this.position.x -= 50 * SPEED_UNIT;
    }
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

    render(context: CanvasRenderingContext2D) {
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

        if (!state.player.dead && this.boundBoxCollision(state.player)) {
            soundPlayer.playRocket();
            state.player.speed.y = -1.5 * JUMP_SPEED;
            state.player.rocket = true;
            state.player.jumpGrace = 0;

            const deltaY = 1 - (state.player.top - state.screenArea.top) / WORLD_SIZE;
            state.screenArea.speedBoost = min(0, -1.6 * deltaY * JUMP_SPEED);
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
            state.removeObject(this);
        }
    }

    preTick(state: GameState) {
        if (this !== state.ignorePlatform && this.isPlayerOn(state.player) && !state.player.dead) {
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

    render(context: CanvasRenderingContext2D) {
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

    render(context: CanvasRenderingContext2D) {
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
            { red: 255, green: 0, blue: 0 },
            { red: 255, green: 255, blue: 0 },
            { red: 0, green: 0, blue: 255 },
        ];

        return colors.map(({ red, green, blue }) => {
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
    private static lightsAngle = TAU / MovingPlatform.lightSprites.length;

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

        context.fillStyle = '#000';
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

        const renderLight = (context: CanvasRenderingContext2D, sprite: typeof MovingPlatform.lightSprites[0], lightDirection: number) => {
            const direction = lightDirection + lightRotation;
            context.save();
            context.translate(
                this.width / 2 + (this.width * cos(direction)) / 2,
                this.height / 2 - 4 + (this.height * sin(direction)) / 2,
            );
            context.drawImage(sprite, 0, 0, sprite.width, sprite.height, -20, -20, 40, 40);
            context.restore();
        };

        return (context: CanvasRenderingContext2D) => {
            context.save();
            context.translate(this.position.x, this.position.y);

            for (let i = MovingPlatform.lightSprites.length; i--;) {
                const lightDirection = MovingPlatform.lightsAngle * i;
                if ((lightDirection + lightRotation) % TAU >= PI) {
                    renderLight(context, MovingPlatform.lightSprites[i], lightDirection);
                }
            }

            context.drawImage(MovingPlatform.sprite, 0, -10, Platform.width, Platform.height + 20);

            for (let i = MovingPlatform.lightSprites.length; i--;) {
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
    objectLayers: Array<Array<InteractiveObject>> = [[], [], []];
    screenArea: ScreenArea = new ScreenArea();
    nextPlatformTop: number = 0;
    previousPlatformX: number = 0;
    backgroundY: number = 0;
    onPlatform: Platform | null = null;
    ignorePlatform: Platform | null = null;
    highScore: number = ranking.getEntries()[0]?.score || 0;
    score: number = 0;
    rockets: boolean = false;
    nextComet: number = -10 * WORLD_SIZE;
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
        for (let layerIndex = this.objectLayers.length; layerIndex--;) {
            const layer = this.objectLayers[layerIndex];
            for (let objectIndex = layer.length; objectIndex--;) {
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

        if (this.screenArea.top - 2 * Comet.radius < this.nextComet) {
            const comet = new Comet();
            const cometAlert = new Alert();
            comet.position.x = cometAlert.position.x = (0.3 + random() * 0.7) * WORLD_SIZE;
            comet.position.y = cometAlert.position.y = this.nextComet - WORLD_SIZE;
            this.addObject(comet, 0);
            this.addObject(cometAlert, 2);

            this.nextComet = this.nextComet - (9 + 3 * random()) * WORLD_SIZE;
        }

        this.player.tick(this);

        for (let layerIndex = this.objectLayers.length; layerIndex--;) {
            const layer = this.objectLayers[layerIndex];
            for (let objectIndex = layer.length; objectIndex--;) {
                layer[objectIndex].tick(this);
            }
        }

        if (this.screenArea.speedBoost < 0) {
            this.screenArea.speedBoost += GRAVITY;
        }

        if (this.screenArea.top > this.player.top) {
            this.screenArea.position.y = this.player.top + this.player.speed.y;
            this.screenArea.speedBoost = min(
                this.screenArea.speedBoost,
                -1.3 * JUMP_SPEED - this.screenArea.speed
            );
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

const render = (state: GameState, context: CanvasRenderingContext2D) => {
    context.save();

    /**
     * The last layer is rendered separately, cause it is rendered before the clip/transforms.
     */
    {
        const layer = state.objectLayers[state.objectLayers.length - 1];
        for (let objectIndex = layer.length; objectIndex--;) {
            layer[objectIndex].render(context);
        }
    }

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

    for (let layerIndex = state.objectLayers.length - 1; layerIndex--;) {
        const layer = state.objectLayers[layerIndex];
        for (let objectIndex = layer.length; objectIndex--;) {
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
    context.font = '1000 40px monospace';
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

export const createGame = ({ rockets = false }) => {
    const background = getBackground();

    let gameTimeGap = 0;
    let currentStep: number = 0;

    const state = new GameState();
    state.backgroundY = background.getHeight() * random();
    state.player.position.x = (WORLD_SIZE - state.player.width) / 2;
    state.player.position.y = 50;
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
        const context = canvasContext;
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

        if (!state.ending && state.player.dead) {
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
                requestAnimationFrame(game.loop);
            }
        },

        startLoop: () => {
            document.body.classList.add('playing');
            requestAnimationFrame((currentTime: number) => {
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
            state.player.die();
            soundPlayer.playGameOver();
            ranking.addEntry(state.score);
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
