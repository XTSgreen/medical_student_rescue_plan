---
title: 2.3 数字类型
sidebar:
  order: 3
---
# 2.3 数字类型


数字是编程中最基础的数据形式。在实际开发中，年龄、价格、温度、分数、像素值、统计数据等都需要用数字表示。Python 提供了四种内置数字类型，分别是整数（int）、浮点数（float）、复数（complex）和布尔类型（bool）。本节将依次介绍每种类型的字面量写法、取值范围、内部表示，以及类型转换、格式化输出和常用数值函数。掌握这些内容后，你就能在代码中准确表达各种数值，并避免因类型不当引发的精度误差或逻辑错误。

## 整数类型

### 整数的字面量表示

整数（int）是没有小数部分的数字，可以是正数、负数或零。Python 支持四种进制的整数字面量写法，对应不同的应用场景。

常见的写法是**十进制**，也就是日常使用的 0 到 9 的数字组合，例如 `42`、`-7`、`0`。这是默认的进制，无需任何前缀。在记录用户年龄、商品编号、序号这类日常数值时，都用十进制。

**二进制**字面量以 `0b` 或 `0B` 开头，后跟 0 和 1 的组合。例如 `0b1010` 表示十进制的 10。二进制在位运算、底层硬件控制、图像像素掩码等场景中使用。图像处理中，掩膜（mask）数据常以二进制位的方式存储每个像素是否属于感兴趣区域，这时理解二进制就很有用。

**八进制**字面量以 `0o` 或 `0O` 开头，后跟 0 到 7 的数字。例如 `0o17` 表示十进制的 15。八进制在 Unix 文件权限表示中常见，例如文件权限 `0o755` 表示拥有者可读写执行、其他用户可读可执行。日常开发中较少直接使用八进制。

**十六进制**字面量以 `0x` 或 `0X` 开头，后跟 0 到 9 和 A 到 F（大小写均可）。例如 `0xFF` 表示十进制的 255，`0x1A` 表示十进制的 26。十六进制在表示颜色值、内存地址、哈希值时非常常见。比如颜色值 `0xFFFFFF`、加密后的数据指纹，常以十六进制字符串形式呈现。

```python
# 四种进制的整数字面量
decimal_num = 42
binary_num = 0b1010      # 等于十进制 10
octal_num = 0o17         # 等于十进制 15
hex_num = 0xFF           # 等于十进制 255

print(decimal_num, binary_num, octal_num, hex_num)
# 输出：42 10 15 255

# print 输出时总是显示为十进制
# 不同进制只是字面量写法不同，存储的数值相等
print(0b1010 == 10)  # True
```

::: note 关于前导零
不要在十进制数字前补零来对齐格式，例如写成 `007`。Python 3 中以 0 开头的数字会被视为非法语法（早期 Python 2 中表示八进制，已废弃）。如果需要格式化输出对齐，应使用字符串格式化方法（如 `f"{n:03d}"`），不要修改数字字面量本身。
:::

### 整数长度无限制

Python 3 的整数类型有一个非常友好的特性：**长度无限制**。这意味着你可以表示任意大的整数，只要内存允许。这一点与 C、Java 等语言不同，后者中 `int` 通常固定为 32 位或 64 位，超过范围会溢出。

```python
# 大整数运算，不会溢出
big_num = 10 ** 100
print(big_num)
# 输出：10000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000

# 计算 2 的 1000 次方
power_of_two = 2 ** 1000
print(len(str(power_of_two)))  # 302，结果有 302 位十进制数字
```

在实际计算中，组合概率、排列组合数、大整数哈希等都可能产生非常大的数值。Python 自动扩展整数位数，让你无需关心溢出问题。在 Python 2 中曾有 `int`（固定宽度）和 `long`（任意宽度）两种类型，Python 3 统一合并为 `int`，使用上更加简单。

::: note 性能权衡
虽然 Python 整数无上限，但小整数（通常在 -5 到 256 之间）会被解释器缓存复用，大整数每次都新建对象。因此大整数运算比小整数慢。涉及大规模数值计算时，应使用 NumPy 等库的定宽数组类型，而不是 Python 原生整数列表。
:::

## 浮点数类型

### 浮点数的字面量表示

浮点数（float）用于表示带小数部分的数值。Python 的浮点数遵循 IEEE 754 双精度标准，占用 8 字节内存。字面量有两种写法。

第一种是**十进制小数形式**，包含整数部分、小数点和小数部分。例如 `3.14`、`-0.5`、`0.0`。整数部分或小数部分可以为零，但小数点必须保留：`0.5` 可以简写为 `.5`，`5.0` 可以简写为 `5.`。在日常数据中，温度 `36.7`、价格 `5.6`、距离 `120.0` 等都用这种形式。

第二种是**科学计数法**，用 `e` 或 `E` 表示 10 的幂。例如 `1.2e-3` 表示 $1.2 \times 10^{-3}$，即 `0.0012`；`6.022e23` 表示阿伏加德罗常数。科学计数法在表示极大或极小的数值时非常方便，比如统计中的 p 值、物理常数、地理距离。

```python
# 浮点数字面量的两种写法
decimal_float = 3.14
decimal_short_1 = .5       # 等于 0.5
decimal_short_2 = 5.       # 等于 5.0

sci_float = 1.2e-3         # 等于 0.0012
sci_large = 6.022e23       # 阿伏加德罗常数
sci_neg = -2.5e10          # 等于 -25000000000.0

print(decimal_float, decimal_short_1, decimal_short_2)
# 输出：3.14 0.5 5.0
print(sci_float, sci_large, sci_neg)
# 输出：0.0012 6.022e+23 -25000000000.0

# 实际场景：溶液中某物质浓度
concentration = 1.5e-6  # 1.5 微摩尔每升，写作科学计数法更直观
```

### 浮点数的精度问题

浮点数采用 IEEE 754 双精度标准，使用 64 位存储，其中 1 位符号位、11 位指数位、52 位尾数位。这意味着浮点数能表示的**有效数字约为 15 到 17 位十进制数**，超出部分会被舍入。

更关键的问题是，许多十进制小数无法在二进制浮点数中精确表示。最经典的例子是 `0.1`：在二进制中它是无限循环小数，存储时被截断，导致 `0.1 + 0.2` 不等于 `0.3`。

```python
# 经典的浮点数精度问题
print(0.1 + 0.2)        # 输出：0.30000000000000004
print(0.1 + 0.2 == 0.3) # 输出：False

# 有效数字约 15-17 位
print(1 / 3)            # 输出：0.3333333333333333
print(1 / 7)            # 输出：0.14285714285714285

# 大数加小数可能丢失精度
big = 1e16
small = 1.0
print(big + small == big)  # True，small 被"吃掉"了
```

::: warning 浮点数不能直接用 == 比较
由于精度问题，**永远不要用 `==` 直接比较两个浮点数是否相等**。正确做法是检查两者之差的绝对值是否小于某个容差（epsilon）。在统计分析中，p 值、相关系数等浮点结果的比较尤其要注意这一点。

```python
import math

def almost_equal(a, b, eps=1e-9):
    return math.fabs(a - b) < eps

print(almost_equal(0.1 + 0.2, 0.3))  # True
```
:::

涉及金额、配比等对精度要求严格的场景，应使用 `decimal.Decimal` 类型而非内置 `float`，它能精确表示十进制小数。后续章节会详细介绍。

## 复数类型

### 复数的表示

复数（complex）由实部和虚部组成，数学上写作 $a + bi$，其中 $i$ 是虚数单位（$i^2 = -1$）。Python 中虚数单位写作 `j`（来自电气工程惯例，避免与电流符号 $i$ 混淆），字面量形式是 `real + imagj`，其中实部和虚部都是浮点数。

```python
# 复数字面量
z1 = 3 + 4j
z2 = 1.5 - 2.5j
z3 = 2j       # 纯虚数，实部为 0
z4 = 5 + 0j   # 实数表示为复数，虚部为 0

print(type(z1))  # <class 'complex'>
print(z1, z2, z3, z4)
# 输出：(3+4j) (1.5-2.5j) 2j (5+0j)
```

复数在信号处理、量子物理、电气工程等领域有广泛应用。音频信号处理中的傅里叶变换会产生复数输出，包含幅度和相位信息；通信系统中的 IQ 信号也涉及复数运算。日常开发中复数较少直接使用，但了解其表示方式有助于阅读相关算法代码。

### 复数的属性与方法

Python 复数对象提供三个属性来访问其组成部分：`.real` 返回实部，`.imag` 返回虚部，`.conjugate()` 返回共轭复数（虚部取反）。这三个属性都是只读的，不能修改。

```python
z = 3 + 4j

# 访问实部和虚部
print(z.real)         # 3.0
print(z.imag)         # 4.0
print(type(z.real))   # <class 'float'>，注意是 float 不是 int

# 求共轭复数
print(z.conjugate())  # (3-4j)

# 复数的模长：math.sqrt(real**2 + imag**2) 或 abs(z)
print(abs(z))         # 5.0，3-4-5 直角三角形
```

注意复数的实部和虚部都是 `float` 类型，即使字面量写的是整数。`abs()` 函数作用于复数时返回其模长（到原点的距离），这与实数取绝对值的语义自然衔接。

## 布尔类型

### 布尔类型的取值

布尔类型（bool）只有两个值：`True` 和 `False`，注意首字母大写。布尔值用于表示逻辑上的真与假，在条件判断、循环控制中大量使用。实际开发中，是否启用、是否激活、是否完成等二元状态都可以用布尔值表示。

```python
# 布尔类型
is_enabled = True
is_verified = False

print(type(is_enabled))  # <class 'bool'>
print(is_enabled, is_verified)  # True False

# 比较运算的结果是布尔值
age = 45
print(age >= 18)        # True
print(age < 18)         # False
print(age == 45)        # True
```

布尔值可以通过比较运算符（`==`、`!=`、`<`、`>`、`<=`、`>=`）得到，也可以通过逻辑运算符（`and`、`or`、`not`）组合。这部分内容在后续控制流章节会详细展开。

### 布尔类型与整数的关系

Python 中布尔类型是整数类型的子类，`True` 等价于 `1`，`False` 等价于 `0`。这意味着布尔值可以直接参与算术运算，也可以用在需要整数的地方。

```python
# 布尔值参与算术运算
print(True + True)    # 2
print(True + False)   # 1
print(False + 0)      # 0
print(True * 5)       # 5

# 等价比较
print(True == 1)      # True
print(False == 0)     # True
print(True is 1)      # False，is 比较的是身份而非值

# 实际用途：统计 True 的个数
flags = [True, False, True, True, False]  # 是否启用
enabled_count = sum(flags)
print(enabled_count)   # 3
```

这种设计在统计计数场景中非常方便。例如有一组用户的启用状态列表，用 `sum()` 直接累加就能得到启用用户数。`issubclass(bool, int)` 可以验证这一继承关系。

::: note 历史渊源
Python 2 中没有真正的布尔类型，True 和 False 只是 1 和 0 的别名。Python 3 引入了独立的 `bool` 类，但为了向后兼容保留了与整数的等价关系。这种实用主义设计让布尔值既能表示逻辑真假，又能参与数值计算。
:::

## 类型转换

### 数值类型转换函数

Python 提供四个内置函数用于数值类型之间的转换：`int()`、`float()`、`complex()`、`bool()`。转换时可能发生精度损失或抛出异常，需要理解每种的规则。

`int()` 将数值或字符串转为整数。对浮点数，它**向零取整**（截断小数部分，不是四舍五入）；对字符串，要求字符串内容是合法的整数字面量。

`float()` 将整数或字符串转为浮点数。字符串可以是十进制小数或科学计数法形式。

`complex()` 将数值或字符串转为复数。可以传一个参数（实部）或两个参数（实部和虚部）。

`bool()` 将任意值转为布尔值。以下值转为 `False`：`0`、`0.0`、`0j`、`""`（空字符串）、`[]`（空列表）、`{}`（空字典）、`None`。其他所有值转为 `True`。

```python
# int() 转换
print(int(3.9))        # 3，向零取整（不是 4）
print(int(-3.9))       # -3，向零取整
print(int("42"))       # 42
print(int("  100  "))  # 100，自动去除空白
# int("3.14")  # 报错：字符串必须是整数格式
# int("0x1A")  # 报错：默认只接受十进制字符串

# float() 转换
print(float(42))       # 42.0
print(float("3.14"))   # 3.14
print(float("1.2e-3")) # 0.0012
print(float("  -5  ")) # -5.0

# complex() 转换
print(complex(3))         # (3+0j)
print(complex(3, 4))      # (3+4j)
print(complex("3+4j"))    # (3+4j)，注意字符串内不能有空格

# bool() 转换
print(bool(0))         # False
print(bool(0.0))       # False
print(bool(42))        # True
print(bool(""))        # False
print(bool("hello"))   # True
print(bool([]))        # False
print(bool([1, 2]))    # True
```

### int() 的进制参数

`int()` 函数接受第二个参数 `base`，用于将字符串按指定进制解析为整数。`base` 取值范围是 0 和 2 到 36。`base=0` 时，字符串前缀决定进制（`0b` 二进制、`0o` 八进制、`0x` 十六进制，无前缀则按十进制）。

```python
# int() 的进制参数
print(int("101", 2))     # 5，二进制 101 等于十进制 5
print(int("17", 8))      # 15，八进制 17 等于十进制 15
print(int("FF", 16))     # 255，十六进制 FF 等于十进制 255
print(int("1A", 16))     # 26

# base=0 时根据前缀自动识别
print(int("0b1010", 0))  # 10
print(int("0o17", 0))    # 15
print(int("0xFF", 0))    # 255
print(int("42", 0))      # 42

# base 超过 10 时，字母 a-z 表示 10-35
print(int("z", 36))      # 35
```

这一功能在解析数据时有用。例如某些编码系统使用十六进制存储标识符，需要转成十进制参与计算时，`int(code, 16)` 即可。

### 特殊浮点数值

Python 浮点数支持三个特殊值：**正无穷**、**负无穷**和**非数字**（NaN, Not a Number）。它们在数学运算中可能自然产生，也可以通过 `float()` 显式构造。

```python
# 特殊浮点数值
inf = float("inf")
neg_inf = float("-inf")
nan = float("nan")

print(inf, neg_inf, nan)  # inf -inf nan

# 无穷大的运算性质
print(inf > 1e308)    # True，无穷大比任何有限数都大
print(inf + 1)        # inf
print(inf - inf)      # nan，无穷大相减无意义

# NaN 的特殊性：与自己都不相等
print(nan == nan)     # False
print(nan != nan)     # True

# 用 math.isnan 检测 NaN
import math
print(math.isnan(nan))  # True
print(math.isinf(inf))  # True
```

::: warning NaN 检测陷阱
由于 `NaN != NaN` 成立，**不能用 `==` 判断一个值是否是 NaN**。必须使用 `math.isnan()` 函数。在数据清洗中，缺失值常被表示为 NaN（Pandas 中常见），正确检测 NaN 是数据预处理的关键步骤。

除零行为也需了解。Python 中 `1 / 0` 会抛出 `ZeroDivisionError`，但 `1.0 / 0.0` 同样抛出异常，不会产生 inf。要得到 inf，需要用 `float("inf")` 或 `math.inf` 常量。某些场景下（如 NumPy 中）除零会得到 inf 或 nan 并发出警告，与原生 Python 行为不同。
:::

## 数字的格式化输出

将数字以特定格式输出是常见需求，比如保留两位小数、用科学计数法显示、添加千位分隔符等。Python 提供 `str.format()` 方法和 f-string 两种方式，配合**格式说明符**实现精细控制。格式说明符以冒号 `:` 开头，写在花括号内变量之后。

```python
# 常用格式说明符
value = 3.14159265358979

# :.Nf 保留 N 位小数（四舍五入）
print(f"{value:.2f}")    # 3.14
print(f"{value:.4f}")    # 3.1416

# :.Ne 科学计数法，保留 N 位小数
print(f"{value:.3e}")    # 3.142e+00

# :.Ng 自动选择定点或科学计数法，保留 N 位有效数字
print(f"{value:.4g}")    # 3.142

# 整数格式化
n = 42
print(f"{n:05d}")        # 00042，宽度 5，前补零
print(f"{n:>5d}")        # "    42"，右对齐
print(f"{n:<5d}")        # "42    "，左对齐
print(f"{n:^5d}")        # "  42  "，居中

# 千位分隔符
big_num = 1234567
print(f"{big_num:,}")    # 1,234,567
print(f"{big_num:_}")    # 1_234_567，下划线分隔

# 百分比显示
ratio = 0.856
print(f"{ratio:.1%}")    # 85.6%

# str.format() 方法的等价写法
print("{:.2f}".format(value))      # 3.14
print("{:,}".format(big_num))      # 1,234,567
```

实际开发中数据展示时，这些格式化技巧很常用。宽高值保留整数 `f"{w:.0f}/{h:.0f}"`、p 值显示三位有效数字 `f"{p:.3e}"`、用户规模加千位分隔符 `f"{pop:,}"`，都是实际场景。

```python
# 实际场景综合示例
user_count = 12345
conversion_rate = 0.9234
avg_cost = 15800.5
p_value = 0.00034

report = f"""
运营统计报告
样本量: {user_count:,} 人
转化率: {conversion_rate:.2%}
人均费用: {avg_cost:,.2f} 元
统计显著性 p = {p_value:.3e}
"""
print(report)
```

## 数学常量与运算函数

### 数学常量

Python 标准库 `math` 模块提供两个常用数学常量。`math.pi` 是圆周率 $\pi$，约 3.141592653589793。`math.e` 是自然对数的底 $e$，约 2.718281828459045。这两个常量以双精度浮点数存储，使用前需要 `import math`。

```python
import math

print(math.pi)  # 3.141592653589793
print(math.e)   # 2.718281828459045

# 圆的面积
radius = 5.0
area = math.pi * radius ** 2
print(f"面积: {area:.2f}")  # 面积: 78.54
```

### 内置数值函数

Python 提供一组内置函数用于常见数值运算，无需 import 即可使用。

`abs(x)` 返回 x 的绝对值。对实数是其数值大小，对复数是模长。

`round(x, n)` 对 x 四舍五入到 n 位小数。n 省略时返回最接近的整数（仍为整数类型），n 为正数时保留 n 位小数，n 为负数时对整数部分舍入。

`pow(x, y)` 返回 x 的 y 次方，等价于 `x ** y`。带第三个参数时 `pow(x, y, z)` 返回 $(x^y) \mod z$，比直接算更高效。

`divmod(a, b)` 返回元组 `(a // b, a % b)`，同时得到商和余数。

`max(...)` 和 `min(...)` 返回可迭代对象或多个参数中的最大值和最小值。

`sum(iterable)` 对可迭代对象求和，可指定起始值。

```python
# abs() 绝对值
print(abs(-5))       # 5
print(abs(-3.14))    # 3.14
print(abs(3 + 4j))   # 5.0，复数模长

# round() 四舍五入
print(round(3.14159, 2))   # 3.14
print(round(3.14159, 4))   # 3.1416
print(round(2.5))          # 2，注意：不是 3
print(round(3.5))          # 4
print(round(12345, -2))    # 12300，对百位舍入

# pow() 幂运算
print(pow(2, 10))         # 1024
print(pow(2, 10, 1000))   # 24，2^10 mod 1000

# divmod() 商和余数
print(divmod(17, 5))      # (3, 2)，17 = 5*3 + 2

# max() 和 min()
print(max(3, 7, 1, 9, 2))      # 9
print(min(3, 7, 1, 9, 2))      # 1
print(max([3, 7, 1, 9, 2]))    # 9，对可迭代对象
ages = [45, 62, 38, 55, 71]
print(max(ages), min(ages))    # 71 38

# sum() 求和
print(sum([1, 2, 3, 4, 5]))     # 15
print(sum([1, 2, 3], 10))       # 16，从 10 开始累加
print(sum(range(1, 101)))       # 5050，1 到 100 求和

# 实际场景：计算平均年龄
ages = [45, 62, 38, 55, 71, 28, 49]
avg_age = sum(ages) / len(ages)
print(f"平均年龄: {avg_age:.1f} 岁")  # 平均年龄: 49.7 岁
```

### round() 的舍入规则

`round()` 函数的舍入规则与许多人直觉不同。Python 3 采用**银行家舍入**（banker's rounding），也叫四舍六入五成双。当待舍入部分恰好等于 5 时，舍入到最近的**偶数**，而不是统一向上舍入。

```python
# 银行家舍入规则
print(round(2.5))    # 2，.5 向偶数舍入
print(round(3.5))    # 4，.5 向偶数舍入
print(round(0.5))    # 0
print(round(1.5))    # 2

print(round(2.51))   # 3，大于 5 正常进位
print(round(2.49))   # 2，小于 5 正常舍去

# 浮点数精度会影响舍入结果
print(round(2.675, 2))  # 2.67，不是 2.68
# 原因：2.675 实际存储为 2.67499999999999982...
```

::: warning 为什么用银行家舍入
传统的四舍五入在大量数据求和时会引入**系统性偏差**：所有 .5 都向上舍入，导致平均值偏高。银行家舍入让 .5 一半向上、一半向下（取决于前一位奇偶），长期统计下偏差趋于零。这一规则在财务、统计领域是标准做法。

实际开发中处理大量数据时，了解这一规则能避免困惑。如果你需要传统的四舍五入（.5 总是向上），可以使用 `decimal.Decimal` 配合 `ROUND_HALF_UP` 模式，或者在数值上加一个极小值（如 `math.floor(x + 0.5)`，但要注意浮点精度问题）。
:::

由于浮点数本身的精度问题，`round(2.675, 2)` 得到 `2.67` 而非 `2.68`。这是因为 `2.675` 在二进制浮点数中实际存储为略小于 2.675 的值，舍入时被当作 2.6749... 处理。对精度敏感的场景务必使用 `decimal` 模块。

至此，本节覆盖了 Python 四种数字类型的核心知识。整数无上限的特性让大数运算不再困扰，浮点数的精度问题提醒我们在比较和计算时要小心，复数为科学计算提供了完整支持，布尔类型作为整数的子类简化了计数逻辑。下一节将介绍 Python 中使用频率最高的字符串类型。

## 练习题

### 第1题 概念理解

阅读下面的代码，先写出你预期的输出结果，再运行验证。解释 `round()` 函数为什么对 `2.5` 和 `3.5` 给出了看似不一致的结果。

```python
print(0.1 + 0.2)
print(0.1 + 0.2 == 0.3)
print(round(2.5))
print(round(3.5))
print(round(2.675, 2))
```

::: details 参考答案
```python
print(0.1 + 0.2)          # 0.30000000000000004
print(0.1 + 0.2 == 0.3)   # False
print(round(2.5))          # 2
print(round(3.5))          # 4
print(round(2.675, 2))     # 2.67
```

`0.1` 和 `0.2` 在二进制浮点数中都无法精确表示，相加后得到一个略大于 `0.3` 的值，所以直接用 `==` 比较会返回 `False`。比较浮点数应该检查差的绝对值是否小于一个很小的容差。

`round()` 采用**银行家舍入**规则，当待舍入部分恰好等于 5 时，舍入到最近的偶数。`2.5` 舍入到 `2`，`3.5` 舍入到 `4`，两者都是偶数。`round(2.675, 2)` 得到 `2.67` 是因为 `2.675` 在浮点数中实际存储为略小于 2.675 的值，被当作 2.6749... 处理。
:::

### 第2题 代码编写
编写一段代码，定义一组统计数据，包含用户总数 `12567`、转化率 `0.9234`、人均费用 `15800.5`、p 值 `0.00034`。用 f-string 格式化输出一份报告，要求用户总数加千位分隔符，转化率显示为百分比保留一位小数，人均费用保留两位小数并加千位分隔符，p 值用科学计数法保留三位小数。

::: details 参考答案
```python
user_count = 12567
conversion_rate = 0.9234
avg_cost = 15800.5
p_value = 0.00034

report = f"""
统计报告
用户总数: {user_count:,} 人
转化率: {conversion_rate:.1%}
人均费用: {avg_cost:,.2f} 元
p 值: {p_value:.3e}
"""
print(report)
```

`:,` 添加千位分隔符，`.1%` 把小数转成百分比并保留一位小数，`:,.2f` 同时使用千位分隔符和两位小数，`.3e` 用科学计数法保留三位小数。这些格式说明符可以组合使用，写在冒号后的格式说明符中。
:::

### 第3题 进阶
布尔类型是整数类型的子类，`True` 等于 `1`，`False` 等于 `0`。利用这一特性，编写代码统计一组任务状态中已完成任务的数量，再用 `divmod()` 计算已完成任务按每页 10 条分页后的页数和余数。

::: details 参考答案
```python
tasks_done = [True, False, True, True, False, True, False, True, True, False, True, True, False]

# 利用 bool 是 int 子类，sum 直接累加 True 的个数
done_count = sum(tasks_done)
print(f"已完成任务数: {done_count}")  # 8

# divmod 同时得到商和余数
pages, remainder = divmod(done_count, 10)
print(f"页数: {pages}, 余数: {remainder}")  # 页数: 0, 余数: 8

# 更大的数据量
big_tasks = [True] * 137 + [False] * 63
big_done = sum(big_tasks)
pages, remainder = divmod(big_done, 10)
print(f"已完成: {big_done}, 页数: {pages}, 余数: {remainder}")
# 已完成: 137, 页数: 13, 余数: 7
```

`sum()` 遍历列表时把 `True` 当作 `1`、`False` 当作 `0` 累加，直接得到已完成数量。`divmod(a, b)` 返回元组 `(a // b, a % b)`，一步得到商和余数，比分两次调用更简洁。
:::

### 第4题 项目实践
在一个任务管理程序中，任务的优先级用整数 1 到 5 表示，5 为最高。假设有如下任务列表 `tasks = [3, 1, 5, 2, 4, 5, 1, 3]`，编写代码统计各优先级的任务数量，找出最高优先级和最低优先级，计算平均优先级并保留一位小数。

::: details 参考答案
```python
tasks = [3, 1, 5, 2, 4, 5, 1, 3]

# 统计各优先级数量
priority_counts = {}
for p in tasks:
    priority_counts[p] = priority_counts.get(p, 0) + 1
print("各优先级数量:", priority_counts)
# 各优先级数量: {3: 2, 1: 2, 5: 2, 2: 1, 4: 1}

# 最高和最低优先级
print(f"最高优先级: {max(tasks)}")  # 5
print(f"最低优先级: {min(tasks)}")  # 1

# 平均优先级
avg_priority = sum(tasks) / len(tasks)
print(f"平均优先级: {avg_priority:.1f}")  # 3.0
```

这个练习综合运用了 `max()`、`min()`、`sum()`、`len()` 等内置数值函数，以及字典的 `get()` 方法做分组统计。`max()` 和 `min()` 既能接受多个参数，也能接受可迭代对象。平均值的计算用 `sum() / len()`，配合 f-string 的 `.1f` 保留一位小数。
:::

## 常见错误

**错误 1 · `ValueError: invalid literal for int() with base 10: '3.14'`**

```python
print(int("3.14"))   # ValueError
print(int("0x1A"))   # ValueError，默认只接受十进制
```

原因:`int()` 解析字符串时要求内容是合法的整数字面量，含小数点、前缀（如 `0x`）、字母的字符串都会失败。`int()` 对浮点数是向零截断，但解析字符串时不会先做浮点转换。

解决:含小数的字符串先 `float()` 再 `int()`，例如 `int(float("3.14"))` 得到 `3`。十六进制字符串传第二个参数 `int("0x1A", 16)` 或 `int("1A", 16)`。处理来源不可控的输入时用 `try/except ValueError` 包裹。

**错误 2 · `ZeroDivisionError: division by zero`**

```python
print(1 / 0)     # ZeroDivisionError
print(1 // 0)    # ZeroDivisionError
print(1 % 0)     # ZeroDivisionError
```

原因:除数、取模的右操作数为 0 时触发。常见于统计数据中某分母为 0，例如计算平均值时 `sum(scores) / len(scores)`，而 `scores` 是空列表。

解决:除法前检查除数是否为 0，或用 `try/except ZeroDivisionError` 捕获。计算平均值时先判断 `if scores:` 再除。注意 `1.0 / 0.0` 同样抛异常，不会产生无穷大；要得到 `inf` 需用 `float("inf")` 或 `math.inf`。

**错误 3 · `round(2.5)` 得到 `2`（期望 `3`）**

```python
print(round(2.5))   # 2
print(round(3.5))   # 4
print(round(2.675, 2))  # 2.67，不是 2.68
```

原因:Python 3 的 `round()` 采用银行家舍入（四舍六入五成双），当待舍入部分恰好等于 5 时舍入到最近的偶数。`2.5` 舍入到 `2`，`3.5` 舍入到 `4`。`round(2.675, 2)` 得到 `2.67` 是因为 `2.675` 在浮点数中实际存储为略小于 2.675 的值。

解决:需要传统四舍五入（.5 总是向上）时用 `decimal.Decimal` 配合 `ROUND_HALF_UP` 模式。涉及金额、统计等精度敏感场景一律用 `decimal` 模块，避免浮点精度叠加舍入规则带来的偏差。

**错误 4 · `TypeError: unsupported operand type(s) for ** or pow(): 'complex' and 'float'`**

```python
print((-1) ** 0.5)  # 返回复数 (6.123e-17+1j)
print(pow(-1, 0.5)) # 同上
```

原因:对负数取非整数次幂，结果在实数域无定义，Python 自动返回复数类型。这不会报错，但返回的 `complex` 类型参与后续运算可能导致意外结果，例如作为 `math.sqrt` 的参数会抛 `TypeError`。

解决:需要实数结果时先判断被开方数是否为负，或直接用 `cmath` 模块处理复数。涉及混合数值类型的运算要留意结果类型可能从 `int`/`float` 变成 `complex`，影响后续逻辑分支。
