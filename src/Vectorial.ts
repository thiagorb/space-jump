export class Vector2D {
    0: number;
    1: number;

    constructor(x: number = 0, y: number = 0) {
        this[0] = x;
        this[1] = y;
    }

    get x() {
        return this[0];
    }

    get y() {
        return this[1];
    }

    set x(value: number) {
        this[0] = value;
    }

    set y(value: number) {
        this[1] = value;
    }

    get length () {
        return 2;
    }

    copyFrom(other: Vector2D) {
        this.x = other.x;
        this.y = other.y;
        return this;
    }

    scalarProduct(other: Vector2D) {
        return this.x * other.x + this.y * other.y;
    }

    // modifies this vector so that it becomes the projection of itself over the other vector
    setAsProjectionWith(a: Vector2D) {
        const scalar = this.scalarProduct(this);
        if (scalar !== 0) {
            const factor = this.scalarProduct(a) / scalar;
            this.setAsScaledBy(factor);
        }
        return this;
    }

    setAsScaledBy(factor: number) {
        this.x *= factor;
        this.y *= factor;
        return this;
    }

    setAsPerpendicularTo(other: Vector2D) {
        const x = other.y;
        const y = -other.x;
        this.x = x;
        this.y = y;
        return this;
    }

    add(other: Vector2D) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    subtract(other: Vector2D) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }
}

export const squaredLength = (vector: Vector2D) =>
    vector[0] * vector[0] + vector[1] * vector[1];

export class Matrix {
    [index: number]: {[index: number]: number, length: number};

    public length: number;

    constructor(lines: number, columns: number = lines) {
        this.length = lines;
        for (var i = 0; i < lines; i++) {
            this[i] = new Array(columns);
        }
    }

    static copyFromArray(array: number[][]): Matrix {
        var copy = new Matrix(array.length, array[0].length);
        copy.length = array.length;
        for (var i = 0; i < array.length; i++) {
            copy[i] = new Array(array[i].length);
            for (var j = 0; j < array[i].length; j++) {
                copy[i][j] = array[i][j];
            }
        }
        return copy;
    }

    static multiply(a: Matrix, b: Matrix, result?: Matrix, n?: number, m?: number, p?: number): Matrix {
        n = n || a.length;
        m = m || b.length;
        p = p || b[0].length;
        result = result || new Matrix(n, p);
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < p; j++) {
                result[i][j] = 0;
                for (var k = 0; k < m; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        return result;
    }

    static setToTranslation(m: Matrix, x: number, y: number): Matrix {
        if (m.length !== 3) {
            throw new Error('Invalid matrix size');
        }

        Matrix.setToIdentity(m);
        m[2][0] = x;
        m[2][1] = y;
        return m;
    }

    static setToScale(m: Matrix, x: number, y: number): Matrix {
        if (m.length !== 3) {
            throw new Error('Invalid matrix size');
        }

        Matrix.setToIdentity(m);
        m[0][0] = x;
        m[1][1] = y;
        return m;
    }

    static setToRotation(m: Matrix, delta: number): Matrix {
        if (m.length !== 3) {
            throw new Error('Invalid matrix size');
        }

        Matrix.setToIdentity(m);
        var sin = Math.sin(delta);
        var cos = Math.cos(delta);
        m[0][0] = cos;
        m[0][1] = -sin;
        m[1][0] = sin;
        m[1][1] = cos;
        return m;
    }

    static identity(n: number)
    {
        var m = new Matrix(n);
        return Matrix.setToIdentity(m);
    }

    static setToIdentity(m: Matrix): Matrix {
        if (m.length !== m[0].length) {
            throw new Error('Invalid matrix size');
        }

        for (var i = 0; i < m.length; i++) {
            for (var j = 0; j < m.length; j++) {
                m[i][j] = 0;
            }
            m[i][i] = 1;
        }
        return m;
    }
}
