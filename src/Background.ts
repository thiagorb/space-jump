import { random, TAU } from "./Globals";

const randomIntBetween = (min: number, max: number): number => min + Math.floor((max - min) * random());

class Particle {
    opacity = random() / 5;
    smokeSize = 5;
    points: Array<{x: number, y: number, size: number}> = [];
    scale: number;
    texture: HTMLCanvasElement;

    constructor (params: {width: number, height: number, steps: number, texture: HTMLCanvasElement}) {
        let direction = random() * TAU;
        let crazyness = 5; //random();

        let minX = 0;
        let minY = 0;
        let maxX = 0;
        let maxY = 0;

        let x = 0;
        let y = 0;
        const minSpeed = 5 * params.width / 1000;
        const maxSpeed = 40 * params.width / 1000;

        for (let i = 0; i < params.steps; i++) {
            const speed = minSpeed + random() * maxSpeed;
            const deltaX = Math.cos(direction) * speed;
            const deltaY = -Math.sin(direction) * speed;
            const size = speed * this.smokeSize;
            const halfSize = size / 2;
            const diagonalSize = Math.sqrt(2 * halfSize * halfSize);
            minX = Math.min(minX, x - diagonalSize);
            minY = Math.min(minY, y - diagonalSize);
            maxX = Math.max(maxX, x + diagonalSize);
            maxY = Math.max(maxY, y + diagonalSize);
            direction += crazyness * Math.PI * random();
            this.points.push({ x, y, size });
            x += deltaX;
            y += deltaY;
        }

        this.scale = Math.min(
            Math.min(1, (params.width / 2) / Math.max(-minX, maxX)),
            Math.min(1, (params.height / 2) / Math.max(-minY, maxY)),
        );
        this.texture = params.texture;
    }

    render(context: CanvasRenderingContext2D) {
        context.save();

        const {x, y, size} = this.points.pop();
        context.globalAlpha = 15 * this.opacity / size;
        context.scale(this.scale, this.scale);
        context.translate(x, y);
        context.rotate(random() * TAU);
        context.drawImage(this.texture, 0 - size / 2, 0 - size / 2, size, size);

        context.globalAlpha = 1;
        context.fillStyle = `rgba(${randomIntBetween(155, 255)}, ${randomIntBetween(155, 255)}, ${randomIntBetween(155, 255)}, ${random()})`;
        context.translate(2 * random() * size, 2 * random() * size);
        context.beginPath();
        context.arc(0, 0, random(), 0, TAU);
        context.fill();

        context.restore();
    }
}

const createSmokeParticle = ({color: {red, green, blue, opacity}}) => {
    const canvas = document.createElement('canvas');

    const size = 80;
    const cx = size * 0.5;
    const cy = size * 0.5;

    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const xRand = -5 + random() * 10;
    const yRand = -5 + random() * 10;
    const xRand2 = 10 + random() * (cx / 2);
    const yRand2 = 10 + random() * (cy / 2);

    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${opacity})`;

    const steps = 200;
    for (let i = 0; i < steps; i++) {
        const randomNumber = random();
        const x = Math.cos(TAU / xRand / steps * i) * randomNumber * xRand2 + cx;
        const y = Math.sin(TAU / yRand / steps * i) * randomNumber * yRand2 + cy;

        ctx.moveTo(x, y);
        ctx.beginPath();
        ctx.arc(x, y, randomNumber * 4, 0, TAU);
        ctx.fill();
    }

    return canvas;
};

const drawDustCloud = ({steps, x, y, width, height, context}: {steps: number, x: number, y: number, width: number, height: number, context: CanvasRenderingContext2D}) => {
    const smokeSize = Math.round(Math.max(width, height) / 5);
    const colors = [randomIntBetween(0, 255), randomIntBetween(0, 255)];
    colors.push(Math.max(0, Math.max(255, 512 - colors[0] - colors[1])));
    const red = colors.splice(Math.floor(random() * colors.length), 1).pop();
    const green = colors.splice(Math.floor(random() * colors.length), 1).pop();
    const blue = colors[0];
    const particles = [...new Array(10)].map((_, i) => new Particle({
        width,
        height,
        steps,
        texture: createSmokeParticle({color: {red, green, blue, opacity: .15}}),
    }));

    /*
    context.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.7)`;
    context.fillRect(x, y, width, height);
    //*/
    context.save();
    context.translate(x + width / 2, y + height / 2);
    for (let i = 0; i < steps; i++) {
        for (const particle of particles) {
            particle.render(context);
        }
    }
    context.restore();
};

const createBackgroundPattern = () => {
    const patternSize = 1000; // Math.max(screen.width, screen.height);
    const patternScale = Math.max(screen.width, screen.height) / patternSize;
    const maxScreens = 10;
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = patternSize * patternScale;
    patternCanvas.height = maxScreens * patternSize * patternScale;

    let filledScreens = 0;

    const increment = () =>{
        if (filledScreens >= maxScreens) {
            return;
        }

        const incrementCanvas = document.createElement('canvas');
        incrementCanvas.width = patternSize * patternScale;
        incrementCanvas.height = patternSize * patternScale;
        const context = incrementCanvas.getContext('2d');
        context.save();
        context.scale(patternScale, patternScale);
        context.fillStyle = '#000';
        context.fillRect(0, 0, patternSize, patternSize);

        const clouds = randomIntBetween(2, 4);
        for (let i = 0; i < clouds; i++) {
            const width = Math.round((0.5 + 1 * random()) * patternSize);
            const height = Math.round((0.2 + 0.8 * random()) * patternSize);
            const x = Math.round(random() * patternSize - width / 2);
            const y = Math.round(random() * (patternSize - height));
            const steps = 100;
            drawDustCloud({steps, x, y, width, height, context});
        }

        for (let i = 0; i < 50; i++) {
            context.beginPath();
            context.fillStyle = `rgba(${randomIntBetween(155, 255)}, ${randomIntBetween(155, 255)}, ${randomIntBetween(155, 255)}, ${random()})`;
            context.arc(patternSize * random(), patternSize * random(), 1.5 * random(), 0, TAU);
            context.fill();
        }

        context.restore();

        patternCanvas.getContext('2d').drawImage(incrementCanvas, 0, filledScreens * patternSize * patternScale);
        /*
        const patternContext = patternCanvas.getContext('2d');
        patternContext.fillStyle = 'blue';
        patternContext.fillRect(0, filledScreens * patternScale * patternSize, 50, 50);
        patternContext.fillStyle = 'red';
        patternContext.fillRect(0, (filledScreens + 1) * patternScale * patternSize - 50, 50, 50);
        //*/

        filledScreens++;
    };

    const getHeight = () => filledScreens * patternSize * patternScale;

    return {
        increment,
        getHeight,
        canvas: patternCanvas,
        draw: (context: CanvasRenderingContext2D, yOffset: number, width: number, height: number) => {
            const relativeHeight = getHeight() * width / patternCanvas.width;
            for (let offset = (-10000 * relativeHeight + yOffset) % relativeHeight; offset < height; offset += relativeHeight) {
                context.drawImage(patternCanvas, 0, 0, patternCanvas.width, getHeight(), 0, offset, width, relativeHeight);
            }
        }
    };
};

export const getBackground: () => ReturnType<typeof createBackgroundPattern> = (() => {
    let memoized = null;
    return () => {
        if (!memoized) {
            memoized = createBackgroundPattern();
        }
        return memoized;
    }
})();
