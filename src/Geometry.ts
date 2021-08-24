import { Matrix, squaredLength, Vector2D } from "./Vectorial";

export const bhaskara = (a: number, b: number, c: number) => {
    const disc = b * b - 4 * a * c;
    if (disc <= 0) return [undefined, undefined];
    const sqrtdisc = Math.sqrt(disc);
    const _2a = (2 * a);
    return [(-b + sqrtdisc) / _2a, (-b - sqrtdisc) / _2a];
};

export class Segment {
    private static readonly v1 = new Vector2D();
    private static readonly v2 = new Vector2D();

    constructor(public readonly p1: Vector2D, public readonly p2: Vector2D) {
    }

    get x1 () {
        return this.p1.x;
    }

    get y1 () {
        return this.p1.y;
    }

    get a () {
        return this.p2.x - this.x1;
    }

    get b () {
        return this.p2.y - this.y1;
    }

    // Returns the factor used to multiply this segment coefficients, in order to get
    // the coordinates of the intersection of this segment with the other segment.
    intersectionFactor(other: Segment): number {
        return (other.a * (this.y1 - other.y1) - other.b * (this.x1 - other.x1)) / (other.b * this.a - this.b * other.a);
    }

    // Returns the factor used to multiply the other segment coefficients, in order to get
    // the coordinates of the intersection of this segment with the other segment.
    intersectionFactorOther(other: Segment, factor: number): number {
        if (other.a)
            return (this.x1 + this.a * factor - other.x1) / other.a;
        else
            return (this.y1 + this.b * factor - other.y1) / other.b;
    }

    // Returns true if this segment intersects the other segment.
    intersectsWith(other: Segment, position: Vector2D = null): boolean {
        var factor = this.intersectionFactor(other);
        if (factor < 0 || factor > 1) return false;
        var otherFactor = this.intersectionFactorOther(other, factor);

        if (otherFactor < 0 || otherFactor > 1) {
            return false;
        }

        if (position) {
            position.x = this.x1 + this.a * factor;
            position.y = this.y1 + this.b * factor;
        }

        return true;
    }

    intersectsWithCircle(circle: Circle, position: Vector2D = null): boolean {
        /*/
        Segment.v1.x = this.a;
        Segment.v1.y = this.b;
        Segment.v1.setAsPerpendicularTo(Segment.v1);
        Segment.v2.x = this.x1;
        Segment.v2.y = this.y1;
        Segment.v2.subtract(circle.position);
        Segment.v1.setAsProjectionWith(Segment.v2);

        if (squaredLength(Segment.v1) > circle.squaredRadius) {
            return false;
        }

        if (circle.containsPoint(this.p1)) {
            position.copyFrom(this.p1);
            return true;
        }

        if (circle.containsPoint(this.p2)) {
            position.copyFrom(this.p2);
            return true;
        }

        // set v2 to the point of the segment's line that is the closest point to the circle's center
        Segment.v2.copyFrom(circle.position).add(Segment.v1);
        const factor = this.a !== 0 ? (Segment.v2.x - this.x1) / this.a : (Segment.v2.y - this.y1) / this.b;

        if (factor < 0 || factor > 1) {
            return false;
        }

        if (position) {
            position.copyFrom(Segment.v2);
        }

        return true;

        /*/
        const tx = this.x1 - circle.position[0];
        const ty = this.y1 - circle.position[1];

        const a = this.a * this.a + this.b * this.b;
        const b = 2 * (tx * this.a + ty * this.b);
        const c = tx * tx + ty * ty - circle.squaredRadius;

        const [t1, t2] = bhaskara(a, b, c);

        const r1 = 0 <= t1 && t1 <= 1;
        const r2 = 0 <= t2 && t2 <= 1;

        if (!r1 && !r2) {
            return false;
        }

        if (position) {
            const factor = r1 ? (r2 ? (t1 + t2) / 2 : t1): t2;
            position.x = this.x1 + this.a * factor;
            position.y = this.y1 + this.b * factor;
        }

        return true;
        //*/
    }
}

export interface Shape {
    intersectsWithSegment(segment: Segment, position?: Vector2D): boolean;

    intersectsWithPolygon(polygon: Polygon, position?: Vector2D): boolean;

    intersectsWithCircle(circle: Circle, position?: Vector2D): boolean;
}

export class Polygon implements Shape {
    private static readonly s1 = new Segment(new Vector2D(), new Vector2D());
    vertices: Array<Array<number>>;

    constructor(vertices: Matrix) {
        this.vertices = [];
        for (var i = 0; i < vertices.length; i++) {
            this.vertices.push([vertices[i][0], vertices[i][1], 1]);
        }
    }

    private copySegmentToS1(i: number): Segment {
        var i1 = (i + 1) % this.vertices.length;
        Polygon.s1.p1.x = this.vertices[i][0];
        Polygon.s1.p1.y = this.vertices[i][1];
        Polygon.s1.p2.x = this.vertices[i1][0];
        Polygon.s1.p2.y = this.vertices[i1][1];

        return Polygon.s1;
    }

    intersectsWithSegment(segment: Segment, position: Vector2D = null): boolean {
        for (var i = 0; i < this.vertices.length; i++) {
            if (segment.intersectsWith(this.copySegmentToS1(i), position)) {
                return true;
            }
        }

        return false;
    }

    intersectsWithPolygon(other: Polygon, position: Vector2D = null): boolean {
        for (var i = 0; i < this.vertices.length; i++) {
            if (other.intersectsWithSegment(this.copySegmentToS1(i), position)) {
                return true;
            }
        }

        return false;
    }

    intersectsWithCircle(circle: Circle, position: Vector2D = null) {
        for (var i = 0; i < this.vertices.length; i++) {
            if (this.copySegmentToS1(i).intersectsWithCircle(circle, position)) {
                return true;
            }
        }

        return false;
    }
}

export const squaredDistance = (p1: Vector2D, p2: Vector2D) => {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return dx * dx + dy * dy;
}

export const direction = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.atan2(y1 - y2, x2 - x1);
};

export class Circle implements Shape {
    private static readonly v1 = new Vector2D();
    public readonly radius: number;
    public readonly position: Vector2D;
    public readonly squaredRadius: number;

    constructor(radius: number, position: Vector2D)
    {
        this.radius = radius;
        this.squaredRadius = radius * radius;
        this.position = position;
    }

    containsPoint(point: Vector2D) {
        return squaredLength(Circle.v1.copyFrom(point).subtract(this.position)) <= this.squaredRadius;
    }

    intersectsWithPolygon(polygon: Polygon, position: Vector2D = null) {
        return polygon.intersectsWithCircle(this, position);
    }

    intersectsWithCircle(circle: Circle, position: Vector2D = null) {
        const radiusSum = this.radius + circle.radius;
        if (squaredDistance(this.position, circle.position) > radiusSum * radiusSum) {
            return false;
        }

        if (position) {
            const dx = circle.position.x - this.position.x;
            const dy = circle.position.y - this.position.y;
            const r = this.radius / (this.radius + circle.radius);
            position.x = this.position.x + dx * r;
            position.y = this.position.y + dy * r;
        }

        return true;
    }

    intersectsWithSegment(segment: Segment, position: Vector2D = null) {
        return segment.intersectsWithCircle(this, position);
    }
}