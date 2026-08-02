---
title: 1.3 编程基础概念与程序结构入门
sidebar:
  order: 3
---
# 1.3 编程基础概念与程序结构入门



## 1.3.1 变量

### 什么是变量

变量是一个名字，它指向内存中的某个值。可以把它想象成贴在箱子上的标签：标签本身不是箱子里的物品，但它能找到对应的物品。类似地，变量名 `age` 不是数值 25 本身，但它指向存储 25 的那块内存。

```python
age = 25
name = "张三"
weight = 70.5
```

上面三行代码创建了三个变量，分别指向整数、字符串和浮点数。Python 在执行赋值时，会自动推断变量的类型，不需要你提前声明。

### 变量命名规则

Python 变量命名有硬性规则：只能使用字母、数字和下划线，不能以数字开头，区分大小写。以下是合法与非法命名的对比：

```python
# 合法
user_name = "张三"
age2 = 25
_private = "秘密"
MAX_RETRIES = 3

# 非法
2nd_user = "李四"   # 不能以数字开头
user-name = "王五"  # 不能用连字符
class = "一班"         # class 是关键字，不能用作变量名
```

### 变量命名规范

PEP 8 建议变量名用**小写字母加下划线**分隔（称为 snake_case），并且做到见名知意：

```python
# 推荐
item_count = 30
average_score = 85.5
is_active = True

# 不推荐
pc = 30        # 含义不明
averageScore = 85.5  # 应该用下划线
```

### 关键字

Python 有 35 个保留关键字，它们有特殊含义，不能用作变量名。下面是完整列表：

```text
False    None     True     and      as       assert   async
await    break    class    continue def      del      elif
else     except   finally  for      from     global   if
import   in       is       lambda   nonlocal not      or
pass     raise    return   try      while    with     yield
```

不用刻意背这个列表。随着编程经验积累，你会自然记住常用的关键字。在 IDE 中关键字通常会用不同颜色显示，不小心用了关键字作变量名时会报 `SyntaxError`。

### 内置函数名称

Python 还内置了一批常用函数，如 `print`、`input`、`len`、`type`、`int`、`float`、`str`、`list`、`dict` 等。这些名称**不是**关键字，语法上可以用作变量名，但**强烈不建议**这样做，因为会覆盖内置函数，导致后续代码出错：

```python
len = 10        # 别这么做！
print(len([1, 2, 3]))  # TypeError: 'int' object is not callable
```

### 常量概念

Python 没有真正的常量机制（不像 C 的 `const` 或 Java 的 `final`）。约定俗成的做法是用**全大写字母**命名表示常量，提醒程序员不要修改它：

```python
MAX_ITEMS = 100
PI = 3.14159265
DEFAULT_TIMEOUT = 30
```

这只是一种命名约定，Python 不会阻止你修改这些值。全大写是一种信号："这个值在设计上不应该改变"。

## 1.3.2 赋值

### 基本赋值

赋值运算符 `=` 将右侧的值赋给左侧的变量。注意 `=` 是赋值，不是数学上的"等于"：

```python
x = 10
name = "李四"
```

### 链式赋值

多个变量可以同时赋同一个值：

```python
a = b = c = 0
```

这行代码把 0 同时赋给 `a`、`b`、`c` 三个变量。

### 增量赋值

增量赋值运算符是算术运算符与 `=` 的组合，用于在原值基础上修改：

```python
count = 10
count += 5   # 等价于 count = count + 5，结果 15
count -= 3   # 等价于 count = count - 3，结果 12
count *= 2   # 等价于 count = count * 2，结果 24
count /= 4   # 等价于 count = count / 4，结果 6.0
```

完整的增量赋值运算符包括 `+=`、`-=`、`*=`、`/=`、`//=`、`%=`、`**=`。

## 1.3.3 动态类型

### 动态类型特性

Python 是动态类型语言，变量的类型在运行时确定，且可以随时改变。同一个变量可以先存整数，再存字符串：

```python
x = 10
print(type(x))  # <class 'int'>

x = "hello"
print(type(x))  # <class 'str'>
```

这种灵活性是 Python 的特点，但也要谨慎使用。随意改变变量类型会让代码难以理解，实际项目中应保持变量类型稳定。

### 类型检查 type()

`type()` 函数返回对象的类型：

```python
print(type(42))        # <class 'int'>
print(type(3.14))      # <class 'float'>
print(type("hello"))   # <class 'str'>
print(type(True))      # <class 'bool'>
```

### 类型转换

有时需要在不同类型之间转换。Python 提供了几个内置转换函数：

```python
# 字符串转整数
age = int("25")
print(age, type(age))  # 25 <class 'int'>

# 整数转浮点数
height = float(175)
print(height)          # 175.0

# 数字转字符串
s = str(42)
print(s, type(s))      # 42 <class 'str'>

# 布尔转换
print(bool(0))         # False
print(bool(1))         # True
print(bool(""))        # False（空字符串）
print(bool("hello"))   # True（非空字符串）
```

注意 `bool()` 的转换规则：0、0.0、空字符串、空列表、`None` 转为 `False`，其余转为 `True`。

## 1.3.4 运算符

### 算术运算符

Python 的算术运算符如下表所示：

| 运算符 | 含义 | 示例 | 结果 |
|--------|------|------|------|
| `+` | 加法 | `3 + 2` | `5` |
| `-` | 减法 | `3 - 2` | `1` |
| `*` | 乘法 | `3 * 2` | `6` |
| `/` | 真除法 | `7 / 2` | `3.5` |
| `//` | 整除 | `7 // 2` | `3` |
| `%` | 取余 | `7 % 2` | `1` |
| `**` | 幂运算 | `2 ** 3` | `8` |

需要特别区分 `/` 和 `//`：`/` 始终返回浮点数（真除法），`//` 返回整数部分（向下取整）：

```python
print(7 / 2)   # 3.5
print(7 // 2)  # 3
print(-7 // 2) # -4（向下取整，不是 -3）
```

`%` 取余运算在判断奇偶、周期性任务中很常用：

```python
if year % 4 == 0:
    print("可能是闰年")
```

### 比较运算符

比较运算符返回布尔值 `True` 或 `False`：

```python
print(3 == 3)   # True（相等）
print(3 != 4)   # True（不等）
print(3 > 2)    # True
print(3 < 2)    # False
print(3 >= 3)   # True
print(3 <= 2)   # False
```

Python 允许链式比较，这在判断区间时特别方便：

```python
age = 35
if 18 <= age <= 60:
    print("适龄劳动力")
```

### 逻辑运算符

逻辑运算符用于组合布尔表达式：

```python
is_adult = True
has_id = False

print(is_adult and has_id)  # False（两者都为 True 才 True）
print(is_adult or has_id)   # True（任一为 True 就 True）
print(not is_adult)         # False（取反）
```

`and` 和 `or` 具有短路特性：`and` 在左侧为 `False` 时不再评估右侧，`or` 在左侧为 `True` 时不再评估右侧。这在避免错误时很有用：

```python
# 如果 data 为 None，不会执行 len(data)，避免报错
if data is not None and len(data) > 0:
    print("数据非空")
```

### 运算符优先级与括号

Python 运算符有优先级高低，基本规则是"先乘除后加减"，幂运算 `**` 优先级高于乘除，比较运算符低于算术运算符，逻辑运算符低于比较运算符。

当优先级不明确时，**用括号**明确意图。括号不影响性能，却能大幅提升可读性：

```python
# 不用括号，含义不清晰
result = a + b * c > 10 and d < 5

# 用括号，含义清晰
result = (a + b * c > 10) and (d < 5)
```

::: note 括号的另一个用途
括号不仅改变运算优先级，还使长表达式更易读。在团队协作中，宁可多写一对括号，也不要让读者去翻优先级表。
:::

## 1.3.5 小结

本节建立了变量、赋值、类型、运算符这四个编程基础概念。变量是名字指向值的引用，Python 的动态类型让变量可以随时改变类型。算术、比较、逻辑三类运算符覆盖了日常编程的大部分需求。下一节将进入程序控制结构，学习 if 条件判断、for 循环和 while 循环，让程序具备根据条件做出决策和重复执行的能力。

## 练习题

### 第1题 概念理解

写出下面三行代码的输出结果，并解释 `//` 对负数取整时的行为。

```python
print(7 // 2)
print(-7 // 2)
print(-7 % 2)
```

::: details 参考答案
```python
print(7 // 2)   # 3
print(-7 // 2)  # -4
print(-7 % 2)   # 1
```

`//` 是向下取整，不是向零截断。`-7 / 2` 的结果是 `-3.5`，向下取整得到 `-4`，而不是 `-3`。`%` 与 `//` 配合使用满足公式 `a = (a // b) * b + (a % b)`，因此 `-7 = (-4) * 2 + 1`，余数是 `1`。这一点与 C、Java 等语言的取余行为不同，需要特别留意。
:::

### 第2题 代码编写

定义一个变量 `total` 初始值为 100，依次执行以下操作：加 50、乘 2、减 80、除以 4。要求全部使用增量赋值运算符（`+=`、`*=`、`-=`、`/=`），最后打印 `total` 的值和类型。

::: details 参考答案
```python
total = 100
total += 50    # 等价于 total = total + 50，结果 150
total *= 2     # 等价于 total = total * 2，结果 300
total -= 80    # 等价于 total = total - 80，结果 220
total /= 4     # 等价于 total = total / 4，结果 55.0

print(total)          # 55.0
print(type(total))    # <class 'float'>
```

增量赋值运算符是算术运算符与 `=` 的组合简写，让累加、累减等操作更简洁。注意 `/=` 的结果总是浮点数，即使能整除，`220 / 4` 的结果是 `55.0` 而非 `55`。
:::

### 第3题 进阶练习

给定变量 `age = 35` 和 `score = 78`，用一个布尔表达式判断该用户是否满足以下全部条件：年龄在 18 到 60 岁之间（含边界），分数在 60 到 100 之间（含边界），并且年龄不等于 30。要求使用链式比较和逻辑运算符，并解释短路求值如何在这里起作用。

::: details 参考答案
```python
age = 35
score = 78

result = (18 <= age <= 60) and (60 <= score <= 100) and (age != 30)
print(result)  # True
```

链式比较 `18 <= age <= 60` 等价于 `18 <= age and age <= 60`，但 `age` 只被求值一次。`and` 具有短路特性，当左侧表达式为 `False` 时，右侧不再求值。如果 `age` 是 15，第一个条件 `18 <= age <= 60` 为 `False`，整个表达式直接返回 `False`，后面的分数判断和年龄判断都不会执行。
:::

### 第4题 项目实践

命令行任务管理器中，每个任务有优先级（1 到 5 的整数，1 最高）和完成状态（布尔值）。请为这些数据定义合适的变量名和常量，并写一段布尔表达式判断某个任务是否属于高优先级且未完成。

::: details 参考答案
```python
# 常量定义，用全大写命名表示不应修改
MAX_PRIORITY = 3  # 优先级数值小于等于 3 视为高优先级

# 某个任务的当前状态
task_priority = 2
task_completed = False

# 判断是否为高优先级且未完成
is_urgent = (task_priority <= MAX_PRIORITY) and (not task_completed)
print(is_urgent)  # True
```

常量用全大写字母命名，提醒阅读者这个值在程序运行期间不应改变。变量用小写字母加下划线的 snake_case 风格，做到见名知意。后续章节学习数据结构后，可以把这些变量组织到字典或类中，更系统地管理任务。
:::

## 常见错误

**错误 1 · `NameError: name 'xxx' is not defined`**

原因:使用了未定义的变量名，常见于拼写错误、大小写不一致，或在使用前忘记赋值。

解决:检查报错行号指向的变量名，核对拼写和大小写。Python 区分大小写，`Score` 和 `score` 是两个不同变量。确保变量在使用的位置之前已经赋值。

**错误 2 · `TypeError: unsupported operand type(s) for +: 'int' and 'str'`**

原因:对不同类型的对象执行了不兼容的运算，例如把整数和字符串直接相加。

解决:运算前用 `str()`、`int()`、`float()` 等函数显式转换类型。需要把数字拼接到字符串中时，用 f-string 格式化（如 `f"年龄：{age}"`）比字符串拼接更安全。

**错误 3 · `SyntaxError: cannot assign to keyword`**

原因:把 Python 关键字（如 `class`、`for`、`if`）用作变量名，解释器无法识别。

解决:更换变量名，避开关键字列表。IDE 通常会用不同颜色高亮关键字，看到变色就应意识到这是保留字，不能用作标识符。

**错误 4 · `ValueError: invalid literal for int() with base 10: 'abc'`**

原因:用 `int()` 转换的字符串不是合法的整数字面量，例如包含字母、小数点或空白字符。

解决:转换前先确认字符串内容。处理用户输入时，用 `try-except` 捕获 `ValueError`，避免程序因非法输入崩溃。需要转换小数字符串时先用 `float()` 再用 `int()`。
