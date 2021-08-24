const randomIntBetween = (min: number, max: number): number => min + Math.floor((max - min) * Math.random()); 

export class Particle {
    osc1 = {
        osc: 0,
        val: 0,
        freq: Math.random() 
    };
    
    osc2 = {
        osc: 0,
        val: 0,
        freq: Math.random() 
    };
    
    counter = 0;
    
    size = Math.random() * 100;
    growth = Math.random() / 20;
    life = Math.random();
    opacity = Math.random() / 5;
    speed = {
        x: Math.random(),
        y: Math.random() 
    };
    
    rotationOsc = Math.round(Math.random()) ? 'osc1' : 'osc2';
    x: number;
    y: number;
    oldX: number;
    oldY: number;
    smokeSize = 5;
    texture: HTMLCanvasElement;
    
    constructor (params: {x: number, y: number, color: {red: number, green: number, blue: number, opacity: number}}) {
        this.x = params.x;
        this.y = params.y;
        this.oldX = params.x;
        this.oldY = params.y;
        this.texture = createSmokeParticle(params.color);
    }
    
    update(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.sqrt(Math.pow(this.x - this.oldX, 2) + Math.pow(this.y - this.oldY, 2)) * this.smokeSize;
        this.counter += 0.01;
        this.growth = Math.sin(this.life);
        this.life -= 0.001;
        this.osc1.osc = Math.sin(this.osc1.val += this.osc1.freq);
        this.osc2.osc = Math.cos(this.osc2.val += this.osc2.freq);
        this.oldX = this.x;
        this.oldY = this.y;
    }
    
    render(context: CanvasRenderingContext2D) {
        context.save();
        
        context.globalAlpha = this.opacity / (this.size / 50);
        context.translate(this.x, this.y);
        context.rotate(Math.random() * Math.PI * 2);
        context.drawImage(this.texture, 0 - this.size / 2, 0 - this.size / 2, this.size, this.size);
        
        context.globalAlpha = 1;
        context.beginPath();
        context.fillStyle = `rgba(${randomIntBetween(155, 255)}, ${randomIntBetween(155, 255)}, ${randomIntBetween(155, 255)}, ${Math.random()})`;
        
        context.arc(Math.random() * this.size, Math.random() * this.size, Math.random(), 0, Math.PI * 2);
        context.fill();
        
        context.restore();
    }
}

const createSmokeParticle = ({red, green, blue, opacity}) => {
    const canvas = document.createElement('canvas');
    
    const w = 100;
    const h = 100;
    const cx = w * 0.5;
    const cy = h * 0.5;
    
    canvas.width = w;
    canvas.height = h;
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
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, randomNumber * 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return canvas;
};

const drawDustCloud = ({x, y, width, height, context}) => {
    const colors = [randomIntBetween(0, 255), randomIntBetween(0, 255)];
    colors.push(Math.max(0, Math.max(255, 512 - colors[0] - colors[1])));
    const red = colors.splice(Math.floor(Math.random() * colors.length), 1).pop();
    const green = colors.splice(Math.floor(Math.random() * colors.length), 1).pop();
    const blue = colors[0];
    const particles = [...new Array(10)].map((_, i) => new Particle({x: x + width / 2, y: y + height / 2, color: {red, green, blue, opacity: .15}}));
    const steps = Math.log(width * height) * (100 + 200 * Math.random()) / 50;
    
    for (let i = 0; i < steps; i++) {
        for (const particle of particles) {
            particle.update(x + width * Math.random(), y + height * Math.random());
        }

        for (const particle of particles) {
            particle.render(context);
        }
    }
};

export const createBackgroundPattern = () => {
    const gapScreens = 1;
    const maxScreens = 10;
    const cloudsPerScreen = 3;
    let patternImage;

    let filledScreens = 0;

    const increment = () => new Promise(resolve => {
        if (filledScreens >= maxScreens) {
            return;
        }

        filledScreens++;

        console.log('incremeneted');

        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = screen.width;
        patternCanvas.height = (filledScreens + gapScreens * 2) * screen.height;
        const context = patternCanvas.getContext('2d');
        if (patternImage) {
            context.drawImage(patternImage, 0, 0);
        }

        for (let i = 0; i < cloudsPerScreen; i++) {
            const width = 300 + Math.random() * 400;
            const height = 100 + Math.random() * 700;
            const x = Math.random() * patternCanvas.width;
            const y = (gapScreens + filledScreens - 1) * screen.height + Math.random() * (screen.height - height);
            drawDustCloud({x, y, width, height, context});
        }

        patternImage = new Image();
        patternImage.src = patternCanvas.toDataURL();
        patternImage.addEventListener('load', resolve);
    });

    const createBackground = () => new Promise<HTMLImageElement>(resolve => {
        const backgroundCanvas = document.createElement('canvas');
        backgroundCanvas.width = screen.width;
        backgroundCanvas.height = screen.height * filledScreens;
        const context = backgroundCanvas.getContext('2d');
        context.fillStyle = 'black';
        context.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
        context.drawImage(patternImage, 0, -gapScreens * screen.height);
        context.drawImage(patternImage, 0, (filledScreens - gapScreens) * screen.height);
        context.drawImage(patternImage, 0, filledScreens * screen.height);
        const image = new Image();
        image.src = backgroundCanvas.toDataURL();
        image.addEventListener('load', () => resolve(image));
    });

    return {
        getPatternImage: () => patternImage,
        increment,
        createBackground
    };
};

export const createBackground = () => new Promise<HTMLImageElement>(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width = screen.width;
    const screens = 5;
    canvas.height = screen.height * screens;
    const context = canvas.getContext('2d');
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const maxHeight = Math.min(700, canvas.height / 6);
    for (let i = 0; i < screens * 3; i++) {
        const width = 300 + Math.random() * 400;
        const height = 100 + Math.random() * maxHeight;
        const x = Math.random() * canvas.width;
        const y = 1 * height + Math.random() * (canvas.height - 3 * height);
        drawDustCloud({x, y, width, height, context});
    }

    const image = new Image();
    image.src = canvas.toDataURL();
    image.addEventListener('load', () => resolve(image));
});

export const memoizedBackgroundPattern = (() => {
    let memoized = null;
    return () => {
        if (!memoized) {
            memoized = createBackgroundPattern();
        }
        return memoized;
    }
})();
