import { Polygon } from "./Geometry";
import { Vector2D, Matrix } from "./Vectorial";

export default class RenderablePolygon extends Polygon {
    public static readonly m1 = new Matrix(3);
    public static readonly m2 = new Matrix(3);
    public static readonly m3 = new Matrix(3);
    public readonly color: string;
    public readonly position: Vector2D;
    public readonly speed = new Vector2D();
    public direction = 0;
    public readonly transformedPolygon: Polygon;

    constructor(position: Vector2D, vertices: Matrix, color: string) {
        super(vertices);
        this.position = position;
        this.color = color;
        this.transformedPolygon = new Polygon(Matrix.copyFromArray(this.vertices));
    }

    prepareContext(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.position[0], this.position[1]);
        ctx.rotate(-this.direction);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.vertices[0][0], this.vertices[0][1]);
        for (var i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i][0], this.vertices[i][1]);
        }
        ctx.lineTo(this.vertices[0][0], this.vertices[0][1]);
        ctx.fill();
    }

    restoreContext(ctx: CanvasRenderingContext2D) {
        ctx.restore();
    }

    render(ctx: CanvasRenderingContext2D) {
        this.prepareContext(ctx);
        this.draw(ctx);
        this.restoreContext(ctx);
    }

    preStep() {
        Matrix.setToRotation(RenderablePolygon.m1, this.direction);
        Matrix.setToTranslation(RenderablePolygon.m2, this.position[0], this.position[1]);
        Matrix.multiply(RenderablePolygon.m1, RenderablePolygon.m2, RenderablePolygon.m3);

        Matrix.multiply(
            this.vertices,
            RenderablePolygon.m3,
            this.transformedPolygon.vertices
        );
    }

    step() {
    }
}