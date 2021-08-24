import { memoizedBackgroundPattern } from "./Background";
import { WORLD_SIZE, GRAVITY, TERMINAL_VELOCITY, STEPS_PER_MILISECOND, SPEED_UNIT, STEPS_PER_SECOND, URL_RADIUS, scene as scene, canvas, context, keyboard, JUMP_SPEED, ACCELERATION_UNIT, menu } from "./Globals";
import { between, sign } from "./Helpers";
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
    speed: number = -200 * SPEED_UNIT;
    speedBoost: number = 0;
}

class RoundShape {
    width: number;
    begin: Vector2D;
    end: Vector2D;

    constructor(x1: number, y1: number, x2: number, y2: number, width: number) {
        this.width = width;
        this.begin = new Vector2D(x1, y1);
        this.end = new Vector2D(x2, y2);
    }
}

export class Player extends GameObject {
    speed: Vector2D = new Vector2D();
    width: number = 70;
    height: number = 150;
    direction: number = 1;

    legGap = 0.25;
    armGap = 0.5;

    body = new RoundShape(0, 0.1, 0, 0.1, 1.0);
    leftLeg = new RoundShape(-this.legGap * 0.9, 0.3, -this.legGap, 0.8, 0.4);
    rightLeg = new RoundShape(this.legGap * 0.9, 0.3, this.legGap, 0.8, 0.4);
    head = new RoundShape(0, -0.5, 0, -0.5, 1.0);
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

    drawRoundShapeLight(roundShape: RoundShape) {
        context.save();

        context.strokeStyle = '#fff';
        const log = Math.log(roundShape.width * 4.4) / 1.8;
        context.translate(-0.07 * log, -0.07 * log);
        context.lineWidth = log;
        context.beginPath();
        context.moveTo(roundShape.begin.x, roundShape.begin.y);
        context.lineTo(roundShape.end.x, roundShape.end.y);
        context.stroke();

        context.restore();
    }

    drawRoundShape(roundShape: RoundShape) {
        context.strokeStyle = '#999';
        context.lineWidth = roundShape.width;
        context.beginPath();
        context.moveTo(roundShape.begin.x, roundShape.begin.y);
        context.lineTo(roundShape.end.x, roundShape.end.y);
        context.stroke();
    }

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

        this.drawRoundShape(this.leftArm);
        this.drawRoundShape(this.rightArm);
        this.drawRoundShapeLight(this.rightArm);
        this.drawRoundShapeLight(this.leftArm);
        this.drawRoundShape(this.leftLeg);
        this.drawRoundShape(this.rightLeg);
        this.drawRoundShapeLight(this.leftLeg);
        this.drawRoundShapeLight(this.rightLeg);

        this.drawRoundShape(this.head);
        this.drawRoundShape(this.body);

        this.drawRoundShapeLight(this.head);
        this.drawRoundShapeLight(this.body);

        if (this.direction === 1) {
            this.drawRoundShapeLight(this.leftLeg);
            this.drawRoundShape(this.leftArm);
            this.drawRoundShapeLight(this.leftArm);
        } else {
            this.drawRoundShapeLight(this.rightLeg);
            this.drawRoundShape(this.rightArm);
            this.drawRoundShapeLight(this.rightArm);
        }

        context.fillStyle = 'black';
        this.drawGlass();
        /*
        context.font = '0.4px Arial';
        context.textAlign = 'center';
        context.fillText('😄', 0.12 * this.direction, -0.45);
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.drawGlass();
        */

        context.strokeStyle = 'white';
        context.lineWidth = 0.05;
        context.beginPath();
        context.bezierCurveTo(0.35 * this.direction, -0.7, 0.34 * this.direction, -0.75, 0.26 * this.direction, -0.82);
        context.moveTo(0.4 * this.direction, -0.6);
        context.lineTo(0.4 * this.direction, -0.6);
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

(async () => {
    // await new Promise(resolve => setTimeout(resolve, 200));
    // const background = await createBackground();
    /*
    setInterval(() => {
        context.drawImage(b1, 0, canvas.height / 2 - b1.height);
        context.drawImage(b1, 0, canvas.height / 2);
    }, 500);
    */

    /*
    const player = new Player();
    player.animation = player.runAnimation;

    setInterval(() => {
        // player.legsRotation = -Math.PI / 2 + Math.cos(rotation) * 0.5;
        context.save();
        context.translate(canvas.width / 2, canvas.height * 0.1);
        context.scale(3, 3);
        context.fillStyle = 'red';
        context.fillRect(player.left - 50, player.top - 20, player.width + 100, player.height + 40);
        context.fillStyle = 'blue';
        context.fillRect(player.left, player.top, player.width, player.height);
        player.render();
        context.restore();
    }, 20);
    */
})();

document.querySelector('#back').addEventListener('click', async () => {
    const c = document.createElement('div');
    c.style.position = 'absolute';
    c.style.left = '0';
    c.style.top = '0';
    c.style.width = '100vw';
    c.style.height = '100vh';
    c.style.overflow = 'auto';
    c.addEventListener('click', () => c.remove());
    document.body.appendChild(c);
    c.appendChild(await (memoizedBackgroundPattern().getPatternImage()));
});


abstract class InteractiveObject extends GameObject {
    abstract render(): void;
    tick(state: GameState) { }
    preTick(state: GameState) { }
}

class Spring extends InteractiveObject {
    width: number = 20;
    height: number = 20;

    render() {
        context.fillStyle = 'yellow';
        context.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    tick(state: GameState) {
        if (this.position.y > state.screenArea.bottom + WORLD_SIZE) {
            state.objects.delete(this);
        }

        if (this.boundBoxCollision(state.player)) {
            state.player.speed.y = -1.5 * JUMP_SPEED;
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
        context.fillStyle = 'blue';
        context.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}

class TemporaryPlatform extends Platform {
    time: number = TemporaryPlatform.maxTime;
    disappearing: boolean = false;

    render() {
        context.fillStyle = `rgba(0, 255, 0, ${this.time / TemporaryPlatform.maxTime})`;
        context.fillRect(this.position.x, this.position.y, this.width, this.height);
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
        }
    }

    static get maxTime() {
        return 500 * STEPS_PER_MILISECOND;
    }
}

class MovingPlatform extends Platform {
    direction: number = 1;

    render() {
        context.fillStyle = 'blue';
        context.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    tick(state: GameState) {
        super.tick(state);

        this.position.x += MovingPlatform.horizontalSpeed * this.direction;
        if (state.onPlatform === this) {
            state.player.position.x += MovingPlatform.horizontalSpeed * this.direction;
        }

        if (this.left <= 0 || this.right >= WORLD_SIZE) {
            this.direction *= -1;
        }
    }


    static get horizontalSpeed() {
        return 100 * SPEED_UNIT;
    }
}

interface GameState {
    paused: boolean;
    over: boolean;
    previousTime: number;
    player: Player;
    objects: Set<InteractiveObject>;
    screenArea: ScreenArea;
    nextPlatformTop: number;
    previousPlatformX: number;
    backgroundY: number;
    onPlatform: Platform | null;
}

interface MovableObject {
    position: Vector2D;
    speed: Vector2D
}

const speed = (objectState: MovableObject) => {
    objectState.position.add(objectState.speed);
};

/*
let sps: number = 0;
let fps: number = 0;
let spsCounter: number = 0;
let fpsCounter: number = 0;
*/

const render = (state: GameState) => {
    context.save();
    context.translate(scene.width / 2, 0);
    context.scale(scene.scale, scene.scale);
    context.translate(-WORLD_SIZE / 2, 0);
    context.translate(-state.screenArea.left, -state.screenArea.top);


    // render objects
    for (const object of state.objects) {
        object.render();
    }
    state.player.render();

    context.restore();

    /*
    context.strokeText(`SPS ${sps}`, 20, 20);
    context.strokeText(`FPS ${fps}`, 20, 40);
    */
};

export const start = async () => {
    const game = await createGame();

    requestAnimationFrame((currentTime: number) => {
        const startDelay = 1000;
        game.initialize(currentTime + startDelay);
        window.requestAnimationFrame(game.loop);
    });
};

export const createGame = async () => {
    const background = await (memoizedBackgroundPattern().createBackground());

    const tick = () => {
        // check if player is on platform
        state.onPlatform = null;
        for (const object of state.objects) {
            object.preTick(state);
        }

        if (state.screenArea.top - WORLD_SIZE < state.nextPlatformTop) {
            let platform: Platform;
            const type = Math.random();
            if (type < 0.1) {
                platform = new TemporaryPlatform();
            } else if (type < 0.4) {
                platform = new MovingPlatform();
            } else {
                platform = new StaticPlatform();
            }

            state.objects.add(platform);
            platform.position.x = between(0, WORLD_SIZE - platform.width, state.previousPlatformX + (0.5 - Math.random()) * 500);
            platform.position.y = state.nextPlatformTop;
            state.previousPlatformX = platform.position.x;
            state.nextPlatformTop = state.nextPlatformTop - 100 - Math.random() * 100 * STEPS_PER_MILISECOND;

            if (type > 0.9) {
                const spring = new Spring();
                spring.position.x = platform.left + (platform.width - spring.width) * Math.random();
                spring.position.y = platform.top - spring.height;
                state.objects.add(spring);
            }
        }

        state.player.tick(state);

        if (state.player.position.y > state.screenArea.bottom + WORLD_SIZE / 2) {
            state.over = true;
            menu.style.display = null;
        }

        for (const object of state.objects) {
            object.tick(state);
        }

        if (state.screenArea.speedBoost < 0) {
            state.screenArea.speedBoost += GRAVITY;
        }
        state.screenArea.position.y += state.screenArea.speed + state.screenArea.speedBoost;
        state.backgroundY -= (state.screenArea.speed + state.screenArea.speedBoost) / 10;
    };

    let gameTimeGap = 0;
    let currentStep: number = 0;

    const MAX_PLATFORMS = 50;
    const state: GameState = {
        paused: false,
        over: false,
        previousTime: 0,
        player: new Player(),
        objects: new Set(),
        screenArea: new ScreenArea(),
        nextPlatformTop: 0,
        previousPlatformX: 0,
        backgroundY: -background.height * Math.random(),
        onPlatform: null,
    };

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
        context.drawImage(background, (canvas.width - background.width) / 2, state.backgroundY);
        context.drawImage(background, (canvas.width - background.width) / 2, state.backgroundY + background.height);
        render(state);

        const timeGap = Math.min(500, currentTime - state.previousTime + gameTimeGap);
        const stepsTorun = (timeGap * STEPS_PER_MILISECOND) | 0;
        gameTimeGap = timeGap - (stepsTorun / STEPS_PER_MILISECOND);
        //spsCounter += stepsTorun;
        state.previousTime = currentTime;
        const targetStep = currentStep + stepsTorun;
        for (; currentStep < targetStep; currentStep++) {
            tick();
        }

        if (state.backgroundY > 0) {
            state.backgroundY -= background.height;
        }
        //fpsCounter++;
    };

    const game = {
        initialize: (currentTime: number) => {
            state.previousTime = currentTime;
            render(state);
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
            game.state.paused = false;
            window.requestAnimationFrame((currentTime: number) => {
                state.previousTime = currentTime;
                game.loop(currentTime);
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
