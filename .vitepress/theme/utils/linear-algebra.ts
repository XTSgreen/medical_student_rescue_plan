/**
 * 线性代数工具函数
 *
 * 抽取自各 Vue 组件中重复的 2×2 矩阵运算，
 * 统一实现以消除代码重复。
 */

export interface Matrix2x2 {
  a: number
  b: number
  c: number
  d: number
}

export interface Vector2 {
  x: number
  y: number
}

export interface EigenInfo {
  eigenvalue: number
  eigenvector: Vector2
  isReal: boolean
}

/** 2×2 矩阵行列式 */
export function det2(a: number, b: number, c: number, d: number): number {
  return a * d - b * c
}

/** 2×2 矩阵迹 */
export function trace2(a: number, d: number): number {
  return a + d
}

/** 2×2 矩阵判别式（用于特征值计算） */
export function discriminant2(a: number, b: number, c: number, d: number): number {
  const tr = trace2(a, d)
  return tr * tr - 4 * det2(a, b, c, d)
}

/** 2×2 矩阵逆（若不可逆返回 null） */
export function inv2(a: number, b: number, c: number, d: number): Matrix2x2 | null {
  const det = det2(a, b, c, d)
  if (Math.abs(det) < 1e-12) return null
  const invDet = 1 / det
  return { a: d * invDet, b: -b * invDet, c: -c * invDet, d: a * invDet }
}

/** 2×2 矩阵乘向量 */
export function mat2Vec(a: number, b: number, c: number, d: number, v: Vector2): Vector2 {
  return { x: a * v.x + b * v.y, y: c * v.x + d * v.y }
}

/** 2×2 矩阵乘法 */
export function mat2Mul(m1: Matrix2x2, m2: Matrix2x2): Matrix2x2 {
  return {
    a: m1.a * m2.a + m1.b * m2.c,
    b: m1.a * m2.b + m1.b * m2.d,
    c: m1.c * m2.a + m1.d * m2.c,
    d: m1.c * m2.b + m1.d * m2.d
  }
}

/** 向量归一化（零向量返回零向量） */
export function normalize2(v: Vector2): Vector2 {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y)
  if (mag < 1e-12) return { x: 0, y: 0 }
  return { x: v.x / mag, y: v.y / mag }
}

/** 向量长度 */
export function magnitude2(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

/** 点积 */
export function dot2(v1: Vector2, v2: Vector2): number {
  return v1.x * v2.x + v1.y * v2.y
}

/**
 * 计算 2×2 矩阵的特征值和特征向量
 * 返回两个 EigenInfo，若判别式 < 0 则特征值为复数（isReal = false）
 */
export function computeEigen2x2(a: number, b: number, c: number, d: number): [EigenInfo, EigenInfo] {
  const tr = trace2(a, d)
  const disc = discriminant2(a, b, c, d)

  if (disc >= -1e-9) {
    // 实特征值
    const sqrtDisc = Math.sqrt(Math.max(0, disc))
    const lambda1 = (tr + sqrtDisc) / 2
    const lambda2 = (tr - sqrtDisc) / 2

    // 特征向量：(A - λI)v = 0
    // 若 b != 0，v = (b, λ - a)；若 c != 0，v = (λ - d, c)
    const ev1 = eigenvectorFor(a, b, c, d, lambda1)
    const ev2 = eigenvectorFor(a, b, c, d, lambda2)

    return [
      { eigenvalue: lambda1, eigenvector: normalize2(ev1), isReal: true },
      { eigenvalue: lambda2, eigenvector: normalize2(ev2), isReal: true }
    ]
  }

  // 复特征值
  const imag = Math.sqrt(-disc) / 2
  return [
    { eigenvalue: tr / 2, eigenvector: { x: imag, y: 0 }, isReal: false },
    { eigenvalue: tr / 2, eigenvector: { x: -imag, y: 0 }, isReal: false }
  ]
}

function eigenvectorFor(a: number, b: number, c: number, d: number, lambda: number): Vector2 {
  if (Math.abs(b) > 1e-12) {
    return { x: b, y: lambda - a }
  }
  if (Math.abs(c) > 1e-12) {
    return { x: lambda - d, y: c }
  }
  // 对角矩阵，特征向量为标准基
  if (Math.abs(lambda - a) < 1e-12) return { x: 1, y: 0 }
  return { x: 0, y: 1 }
}

/** 2×2 矩阵的秩 */
export function rank2(a: number, b: number, c: number, d: number): number {
  const det = det2(a, b, c, d)
  if (Math.abs(det) > 1e-12) return 2
  if (Math.abs(a) > 1e-12 || Math.abs(b) > 1e-12 || Math.abs(c) > 1e-12 || Math.abs(d) > 1e-12) return 1
  return 0
}

/** 将 2×2 矩阵转为 Three.js Matrix4（用于 3D 场景中的 2D 变换） */
export function mat2ToMat4(a: number, b: number, c: number, d: number): number[] {
  // Three.js 使用列主序
  return [a, c, 0, 0, b, d, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}
