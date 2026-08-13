---
title: 1.4 通用函数(ufunc)与向量化运算
sidebar:
  order: 4
---
# 1.4 通用函数(ufunc)与向量化运算

数组的运算方式与普通 Python 列表完全不同。对列表,四则运算要么报错要么是拼接;对数组,一个运算符就对所有元素同时执行运算,这就是**向量化**。向量化的底层是通用函数(universal function,简称 ufunc),它逐个元素地应用数学运算,而整个计算在 C 层完成,速度远快于 Python 循环。本节将系统讲解运算符的向量化、比较与逻辑运算、NumPy 内置的数学函数,以及自定义 ufunc 的方法。

## 1.4.1 算术运算的向量化

数组的 `+ - * / // % **` 都是逐元素运算,形状相同的数组逐位计算,标量与数组运算时标量广播到每个元素:

```python
import numpy as np

a = np.array([1, 2, 3, 4])
b = np.array([10, 20, 30, 40])

print(a + b)   # [11 22 33 44]
print(a - b)   # [ -9 -18 -27 -36]
print(a * b)   # [10 40 90 160]
print(b / a)   # [10. 10. 10. 10.]
print(b // a)  # [10 10 10 10]
print(b % a)   # [0 0 0 0]
print(a ** 2)  # [ 1  4  9 16]

print(a + 10)  # [11 12 13 14]，标量广播
print(a * 2)   # [2 4 6 8]
```

运算符与 ufunc 函数是一一对应的:`a + b` 等价于 `np.add(a, b)`,`a * b` 等价于 `np.multiply(a, b)`。

```python
print(np.add(a, b))      # [11 22 33 44]
print(np.multiply(a, b)) # [10 40 90 160]
```

### 除零行为

数组除零与 Python 不同,不抛异常,而是产生 inf、-inf 或 nan 并发出 RuntimeWarning:

```python
import numpy as np

a = np.array([1.0, -1.0, 0.0, 2.0])
print(a / 0)
# [inf -inf nan inf]，并伴随 RuntimeWarning: divide by zero
```

`0/0` 得到 `nan`,非零数除以 0 得到 `inf`。运算结果类型由 NumPy 决定,整数数组除零会产生警告且结果未定义,通常应转换为浮点再运算。

### 幂运算与符号

```python
a = np.array([1, 2, 3])
print(a ** 2)    # [1 4 9]
print(-a)        # [-1 -2 -3]
print(+a)        # [1 2 3]
```

## 1.4.2 比较运算的向量化

比较运算 `> < == >= <= !=` 逐元素比较,返回布尔数组:

```python
import numpy as np

a = np.array([1, 5, 3, 8])
b = np.array([2, 5, 6, 4])

print(a > b)    # [False False False  True]
print(a >= 5)   # [False  True False  True]
print(a == b)   # [False  True False False]
print(a != b)   # [ True False  True  True]
print(a < 3)    # [ True False False False]
```

比较结果可以直接作为布尔索引使用,这在第 2 章已经见过:

```python
a = np.array([1, 5, 3, 8])
print(a[a >= 5])   # [5 8]
```

## 1.4.3 逻辑运算的向量化

数组的逐元素逻辑运算使用位运算符 `&`(与)、`|`(或)、`~`(非)、`^`(异或),不能用 Python 的 `and`/`or`:

```python
import numpy as np

a = np.array([True, True, False, False])
b = np.array([True, False, True, False])

print(a & b)   # [ True False False False]
print(a | b)   # [ True  True  True False]
print(~a)      # [False False  True  True]
print(a ^ b)   # [False  True  True False]
```

逻辑运算常用于组合多个条件生成布尔掩码:

```python
x = np.array([1, 5, 9, 12, 20])
print((x > 3) & (x < 15))     # [False  True  True  True False]
print(x[(x > 3) & (x < 15)])  # [ 5  9 12]
```

`np.logical_and`、`np.logical_or`、`np.logical_not` 是等价的函数形式。

## 1.4.4 数学函数(ufunc)

### 三角函数

```python
import numpy as np

x = np.array([0, np.pi / 6, np.pi / 2])
print(np.sin(x))    # [0.  0.5 1. ]
print(np.cos(x))    # [1.  0.8660254 6.123234e-17]
print(np.tan(x))    # [0.  0.57735027 1.6331239e+16]

# 反三角函数
print(np.arcsin(0.5))     # 0.5235987755982989
print(np.arccos(1.0))     # 0.0
print(np.arctan(1.0))     # 0.7853981633974483
```

### 双曲函数

```python
import numpy as np

x = np.array([0, 1, 2])
print(np.sinh(x))   # [0.  1.17520119 3.62686041]
print(np.cosh(x))   # [1.  1.54308063 3.76219569]
print(np.tanh(x))   # [0.  0.76159416 0.96402758]
```

### 指数与对数

```python
import numpy as np

x = np.array([0, 1, 2, 3])
print(np.exp(x))        # [1. 2.71828183 7.3890561 20.08553692]
print(np.expm1(x))      # exp(x) - 1,小 x 时精度更高
print(np.log(x + 1))    # [0. 0.69314718 1.09861229 1.38629436]
print(np.log10(np.array([1, 10, 100])))   # [0. 1. 2.]
print(np.log2(np.array([1, 2, 4, 8])))    # [0. 1. 2. 3.]
print(np.log1p(np.array([0, 1, 2])))      # log(1+x),小 x 时精度更高
```

`expm1` 和 `log1p` 在自变量接近 0 时比 `exp`/`log` 精度更高,用于处理数值上接近 0 的场景。

### 幂与开方

```python
import numpy as np

x = np.array([1, 4, 9, 16])
print(np.sqrt(x))        # [1. 2. 3. 4.]
print(np.square(x))      # [1 16 81 256]
print(np.cbrt(x))        # 立方根 [1. 1.58740105 2.08008382 2.5198421]
print(np.power(x, 2))    # [1 16 81 256]
print(x ** 2)            # 等价于 power
```

### 绝对值与符号

```python
import numpy as np

a = np.array([-1, 2, -3, 0])
print(np.abs(a))     # [1 2 3 0]
print(np.fabs(a))    # [1. 2. 3. 0.]，浮点专用，更快
print(np.sign(a))    # [-1  1 -1  0]，符号：-1/0/1
```

### 取整

```python
import numpy as np

a = np.array([2.1, 2.7, -2.1, -2.7])
print(np.ceil(a))    # [ 3.  3. -2. -2.]，向上取整
print(np.floor(a))   # [ 2.  2. -3. -3.]，向下取整
print(np.rint(a))    # [ 2.  3. -2. -3.]，四舍五入
print(np.trunc(a))   # [ 2.  2. -2. -2.]，向零截断
```

### 浮点数分解

```python
import numpy as np

a = np.array([3.75, -2.5])
# modf 返回小数部分和整数部分
frac, whole = np.modf(a)
print(frac)    # [ 0.75 -0.5 ]
print(whole)   # [ 3.  -2. ]

# frexp 分解为尾数和指数: x = mantissa * 2^exponent
mant, exp = np.frexp(a)
print(mant, exp)   # 例如 0.9375 2 表示 3.75 = 0.9375 * 2^2

# ldexp 是 frexp 的逆运算
print(np.ldexp(mant, exp))   # [ 3.75 -2.5 ]
```

### 复数函数

```python
import numpy as np

c = np.array([3 + 4j, 1 - 1j])
print(np.real(c))    # [3. 1.]，实部
print(np.imag(c))    # [4. -1.]，虚部
print(np.conj(c))    # [3.-4.j 1.+1.j]，共轭
print(np.angle(c))   # 辐角(弧度) [0.92729522 -0.78539816]
```

## 1.4.5 自定义 ufunc:np.frompyfunc()

`np.frompyfunc()` 把普通 Python 函数包装成逐元素执行的 ufunc:

```python
import numpy as np

def my_func(x):
    if x > 0:
        return "pos"
    return "neg"

uf = np.frompyfunc(my_func, 1, 1)   # 1 个输入, 1 个输出
a = np.array([-1, 2, -3, 0])
print(uf(a))   # ['neg' 'pos' 'neg' 'neg']
```

`frompyfunc(func, nin, nout)` 的第一个参数是函数,第二个是输入参数个数,第三个是输出个数。包装后函数能直接作用于整个数组。注意自定义 ufunc 仍逐元素调用 Python 函数,性能与内置 ufunc 有差距,适合逻辑较复杂的场景。

## 1.4.6 np.where() 条件向量化选择

`np.where(condition, x, y)` 是向量化的三目运算符:condition 为 `True` 的位置取 `x` 对应元素,为 `False` 的位置取 `y` 对应元素:

```python
import numpy as np

a = np.array([1, 5, 3, 8])
print(np.where(a > 3, 100, 0))   # [0 100 0 100]

# x、y 也可以是数组
x = np.array([10, 20, 30, 40])
y = np.array([-1, -2, -3, -4])
print(np.where(a > 3, x, y))     # [ -1  20  -3  40]
```

只传一个参数的 `np.where(condition)` 返回满足条件元素的索引:

```python
a = np.array([1, 5, 3, 8])
print(np.where(a > 3))   # (array([1, 3]),)，索引数组组成的元组
```

`where` 是数据清洗中常用的向量化替换工具,例如把负数替换为 0:

```python
data = np.array([1, -2, 3, -4, 5])
clean = np.where(data < 0, 0, data)
print(clean)   # [1 0 3 0 5]
```

## 1.4.7 np.select()

`np.select()` 支持多条件多结果,比嵌套 `where` 更清晰。它接收条件列表、结果列表,按顺序匹配第一个为真的条件:

```python
import numpy as np

data = np.array([5, 15, 25, 35, 45])
conds = [data < 10, data < 30, data < 50]   # 按顺序检查
choices = ["低", "中", "高"]

result = np.select(conds, choices, default="未知")
print(result)   # ['低' '中' '中' '高' '高']
```

`data < 10` 为真时取 "低",否则看 `data < 30` 取 "中",以此类推。default 处理都不满足的情况。

## 1.4.8 np.vectorize() 函数向量化包装

`np.vectorize()` 与 `frompyfunc` 类似,把普通函数包装成可对数组逐元素调用的函数,且返回类型更规范:

```python
import numpy as np

def classify(x):
    if x >= 90:
        return "A"
    elif x >= 60:
        return "B"
    else:
        return "C"

vfunc = np.vectorize(classify)
scores = np.array([85, 92, 45, 70])
print(vfunc(scores))   # ['B' 'A' 'C' 'B']
```

`vectorize` 通过 `otypes` 参数指定输出类型,避免类型推断问题:

```python
vfunc = np.vectorize(classify, otypes=[str])
```

`vectorize` 本质上仍是逐元素调用 Python 函数,性能低于内置 ufunc。它适合无法用现有 ufunc 组合、必须用自定义逻辑处理的场景。

## 练习题

### 第1题 概念理解

写出下面代码的输出结果,并解释数组算术运算与列表运算的区别。

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
print(a * b)
print(a + 1)
print((a > 2) & (b < 6))
```

::: details 参考答案

```python
[4 10 18]
[2 3 4]
[False False  True]
```

数组 `*` 是逐元素相乘,列表 `*` 是重复;数组加标量是广播到每个元素;比较产生布尔数组,`&` 逐元素做逻辑与。
:::

### 第2题 代码编写

给定 `scores = np.array([55, 82, 90, 47, 73, 100])`,用 `np.where` 把及格(≥60)的分数映射为 1、不及格映射为 0;再用 `np.select` 把分数分成 优(≥90)/良(≥75)/中(≥60)/差 四档。

::: details 参考答案

```python
import numpy as np

scores = np.array([55, 82, 90, 47, 73, 100])

passed = np.where(scores >= 60, 1, 0)
print(passed)   # [0 1 1 0 1 1]

conds = [scores >= 90, scores >= 75, scores >= 60]
choices = ["优", "良", "中"]
grades = np.select(conds, choices, default="差")
print(grades)   # ['差' '良' '优' '差' '中' '优']
```

:::

### 第3题 进阶练习

对 `x = np.array([0.1, 0.5, 1.0, 2.0, 10.0])` 分别计算 `np.log(x)` 与 `np.log1p(x)` 的差值,观察小数值时的差异,并说明 `expm1`/`log1p` 的应用场景。

::: details 参考答案

```python
import numpy as np

x = np.array([0.1, 0.5, 1.0, 2.0, 10.0])
print(np.log(x))      # [-2.30258509 -0.69314718  0.  0.69314718  2.30258509]
print(np.log1p(x))    # [ 0.09531018  0.40546511  0.69314718  1.09861229  2.39789527]

# log1p(x) 约等于 log(1+x),当 x 很小时比直接算 log(1+x) 精度更高
print(np.log1p(1e-16))    # 1e-16，高精度
print(np.log(1 + 1e-16))  # 0.0，精度丢失
```

当自变量接近 0 时,`log(1+x)` 直接计算会因浮点舍入丢失精度,`log1p` 内部处理避免了这一问题。
:::

### 第4题 项目实践

命令行任务管理器要计算任务的剩余时间比例。假设任务进度存在 `progress = np.array([0.2, 0.5, 0.9, 0.1])`。用向量化运算把进度换算成剩余比例(1 - progress),并对进度超过 0.8 的任务打上"即将完成"标记。

::: details 参考答案

```python
import numpy as np

progress = np.array([0.2, 0.5, 0.9, 0.1])
remaining = 1 - progress          # 向量化
print(remaining)                  # [0.8 0.5 0.1 0.9]

status = np.where(progress > 0.8, "即将完成", "进行中")
print(status)                     # ['进行中' '进行中' '即将完成' '进行中']
```

:::

## 常见错误

**错误 1 · 用 Python 的 `and`/`or` 对数组做逻辑运算**

原因:`and`/`or` 期望布尔值,对数组求值会报 `ValueError: The truth value of an array with more than one element is ambiguous`。

解决:数组逐元素逻辑运算用 `&`、`|`、`~`,或用 `np.logical_and` 等函数。

**错误 2 · 对数组使用列表的 `+` 语义**

原因:期望拼接却得到逐元素相加,或反之。数组 `+` 是逐元素加法,不是拼接。

解决:拼接用 `np.concatenate` 等函数;逐元素运算直接用运算符。

**错误 3 · 忘记除法产生的 inf/nan**

原因:数组除零不抛异常,产生 `inf`/`nan` 并伴随警告,后续统计可能被污染。

解决:运算前检查除数为 0 的元素,或用 `np.where` 保护,或后续用 `np.isinf`/`np.isnan` 清洗。

**错误 4 · `np.where` 与 `np.select` 参数顺序混淆**

原因:`np.where(cond, x, y)` 三个参数是条件、真值、假值;`np.select(conds, choices)` 是条件列表、结果列表。写反会导致结果错误或参数数量报错。

解决:确认函数签名。多条件时用 `select`,单条件时用 `where`。
