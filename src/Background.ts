const randomIntBetween = (min: number, max: number): number => min + Math.floor((max - min) * Math.random());

export class Particle {
    opacity = Math.random() / 5;
    smokeSize = 5;
    points: Array<{x: number, y: number, size: number}> = [];
    scale: number;
    texture: HTMLCanvasElement;

    constructor (params: {width: number, height: number, steps: number, texture: HTMLCanvasElement}) {
        let direction = Math.random() * Math.PI * 2;
        let crazyness = 5; //Math.random();

        let minX = 0;
        let minY = 0;
        let maxX = 0;
        let maxY = 0;

        let x = 0;
        let y = 0;
        const minSpeed = 5 * params.width / 1000;
        const maxSpeed = 40 * params.width / 1000;

        for (let i = 0; i < params.steps; i++) {
            const speed = minSpeed + Math.random() * maxSpeed;
            const deltaX = Math.cos(direction) * speed;
            const deltaY = -Math.sin(direction) * speed;
            const size = speed * this.smokeSize;
            const halfSize = size / 2;
            const diagonalSize = Math.sqrt(2 * halfSize * halfSize);
            minX = Math.min(minX, x - diagonalSize);
            minY = Math.min(minY, y - diagonalSize);
            maxX = Math.max(maxX, x + diagonalSize);
            maxY = Math.max(maxY, y + diagonalSize);
            direction += crazyness * Math.PI * Math.random();
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
        context.rotate(Math.random() * Math.PI * 2);
        context.drawImage(this.texture, 0 - size / 2, 0 - size / 2, size, size);

        context.globalAlpha = 1;
        context.fillStyle = `rgba(${randomIntBetween(155, 255)}, ${randomIntBetween(155, 255)}, ${randomIntBetween(155, 255)}, ${Math.random()})`;
        context.translate(2 * Math.random() * size, 2 * Math.random() * size);
        context.beginPath();
        context.arc(0, 0, Math.random(), 0, Math.PI * 2);
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

    const xRand = -5 + Math.random() * 10;
    const yRand = -5 + Math.random() * 10;
    const xRand2 = 10 + Math.random() * (cx / 2);
    const yRand2 = 10 + Math.random() * (cy / 2);

    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${opacity})`;

    const steps = 200;
    for (let i = 0; i < steps; i++) {
        const randomNumber = Math.random();
        const x = Math.cos(Math.PI * 2 / xRand / steps * i) * randomNumber * xRand2 + cx;
        const y = Math.sin(Math.PI * 2 / yRand / steps * i) * randomNumber * yRand2 + cy;

        ctx.moveTo(x, y);
        ctx.beginPath();
        ctx.arc(x, y, randomNumber * 4, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas;
};

const drawDustCloud = ({steps, x, y, width, height, context}: {steps: number, x: number, y: number, width: number, height: number, context: CanvasRenderingContext2D}) => {
    const smokeSize = Math.round(Math.max(width, height) / 5);
    const colors = [randomIntBetween(0, 255), randomIntBetween(0, 255)];
    colors.push(Math.max(0, Math.max(255, 512 - colors[0] - colors[1])));
    const red = colors.splice(Math.floor(Math.random() * colors.length), 1).pop();
    const green = colors.splice(Math.floor(Math.random() * colors.length), 1).pop();
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

export const createBackgroundPattern = () => {
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
            const width = Math.round((0.5 + 1 * Math.random()) * patternSize);
            const height = Math.round((0.2 + 0.8 * Math.random()) * patternSize);
            const x = Math.round(Math.random() * patternSize - width / 2);
            const y = Math.round(Math.random() * (patternSize - height));
            const steps = 100;
            drawDustCloud({steps, x, y, width, height, context});
        }

        for (let i = 0; i < 50; i++) {
            context.beginPath();
            context.fillStyle = `rgba(${randomIntBetween(155, 255)}, ${randomIntBetween(155, 255)}, ${randomIntBetween(155, 255)}, ${Math.random()})`;
            context.arc(patternSize * Math.random(), patternSize * Math.random(), 1.5 * Math.random(), 0, Math.PI * 2);
            context.fill();
        }

        context.restore();

        patternCanvas.getContext('2d').drawImage(incrementCanvas, 0, filledScreens * patternSize * patternScale);
        filledScreens++;
    };

    const getBackground = () => {
        const getHeight = () => filledScreens * patternSize * patternScale;
        const background = {
            getHeight,
            canvas: patternCanvas, // backgroundCanvas,
            draw: (context: CanvasRenderingContext2D, yOffset: number) => {
                const realOffset = yOffset % getHeight();
                context.drawImage(patternCanvas, 0, realOffset - getHeight());
                context.drawImage(patternCanvas, 0, realOffset);
                patternCanvas
            }
        };
        return background;
    };

    return {
        increment,
        getBackground
    };
};

export const memoizedBackgroundPattern = (() => {
    let memoized = null;
    return () => {
        if (!memoized) {
            memoized = createBackgroundPattern();
        }
        return memoized;
    }
})();
