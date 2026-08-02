---
title: 3.2 分支结构
sidebar:
  order: 2
---
# 3.2 分支结构


分支结构让程序能够根据不同的条件选择不同的执行路径。顺序结构只能让程序从头到尾走一条路，遇到需要做判断的场景就显得无能为力。比如根据分数判定等级、根据用户角色显示不同菜单、根据输入合法性选择处理或报错，这些都依赖分支结构。Python 用 `if`、`elif`、`else` 三个关键字构建分支，配合条件表达式实现复杂的判断逻辑。本节将从最基本的 `if` 语法出发，逐步覆盖多分支、嵌套、条件表达式中的各类运算符，以及数据类型的真假判定规则。

## 3.2.1 if 语句的基本语法（if 条件表达式:）

`if` 语句是最基本的分支结构，语法形式为 `if 条件表达式:`，冒号后面换行缩进的代码块就是条件为真时要执行的语句。条件表达式放在 `if` 和冒号之间，必须返回一个能被解释为布尔值的对象。冒号是 `if` 语句的必备部分，遗漏会直接报 `SyntaxError`。

```python
# 最基本的 if 语句
score = 85

if score >= 60:
    print("及格了")

print("判断结束")
```

上述代码中，`score >= 60` 的结果是 `True`，所以进入 `if` 内部的代码块，打印出"及格了"。最后一条 `print("判断结束")` 缩进量为 0，不在 `if` 代码块内，无论条件真假都会执行。如果 `score` 改成 50，则 `if` 内部的语句被跳过，只输出"判断结束"。

需要特别注意冒号和缩进的配合。冒号表示一个代码块的开始，下一行必须缩进进入这个代码块。如果 `if` 后面直接写不缩进的语句，解释器会认为 `if` 没有代码块，报 `IndentationError` 或 `SyntaxError`。

```python
# 错误示范：缺少冒号
# if score >= 60
#     print("及格了")  # SyntaxError: expected ':'

# 错误示范：缺少缩进
# if score >= 60:
# print("及格了")  # IndentationError
```

## 3.2.2 if-else 双分支结构

`if-else` 构成双分支结构，当 `if` 条件为真时执行 `if` 代码块，否则执行 `else` 代码块。两条路径必走其一，不会有第三种可能。`else` 后面也必须加冒号，且不能单独使用，必须与一个 `if` 配对。

```python
# if-else 双分支
score = 50

if score >= 60:
    print("及格")
else:
    print("不及格")
```

`if-else` 适合处理非此即彼的判断。比如判断一个数是奇数还是偶数、判断用户是否成年、判断文件是否存在。当条件只有两种结果时，用 `if-else` 比写两个独立的 `if` 更清晰，也能让程序少做一次判断，因为 `else` 隐含了 `if` 条件为假这一前提。

```python
# 判断奇偶
number = 17

if number % 2 == 0:
    print(number, "是偶数")
else:
    print(number, "是奇数")
```

## 3.2.3 if-elif-else 多分支结构

当判断条件多于两种时，使用 `if-elif-else` 结构。`elif` 是 `else if` 的缩写，表示在前一个条件为假的前提下，再判断这个新条件。整个结构从上到下依次判断，一旦某个分支的条件为真，就执行该分支的代码块，执行完毕后跳出整个 `if-elif-else` 结构，不再判断后续分支。`else` 放在最后，作为所有条件都不满足时的兜底。

```python
# if-elif-else 多分支：分数等级判定
score = 78

if score >= 90:
    print("优秀")
elif score >= 80:
    print("良好")
elif score >= 60:
    print("及格")
else:
    print("不及格")
```

上述代码中，`score` 是 78，第一个条件 `score >= 90` 为假，继续判断第二个条件 `score >= 80` 也为假，再判断第三个条件 `score >= 60` 为真，执行 `print("及格")`，然后跳出整个结构。即使后面还有 `else` 分支，也不会执行。

多分支结构的判断顺序很重要。条件要从严格到宽松排列，先判断范围小的，再判断范围大的。如果把上面的条件反过来写，先判断 `score >= 60`，那么 78、85、95 都会进入第一个分支，后续的细分永远不会执行。

```python
# 错误示范：条件顺序不对
score = 95

if score >= 60:
    print("及格")        # 95 也会进这里
elif score >= 80:
    print("良好")        # 永远不会执行
elif score >= 90:
    print("优秀")        # 永远不会执行
```

## 3.2.4 elif 的数量无上限

`elif` 的数量没有上限，可以根据需要添加任意多个。比如根据月份判断季节、根据成绩分段、根据 HTTP 状态码返回不同提示，都可能用到大量 `elif`。当 `elif` 数量过多时，可读性会下降，这时可以考虑用字典映射或函数分派来替代，但 `elif` 仍是基础写法。

```python
# 多个 elif：根据月份判断季节
month = 7

if month in (3, 4, 5):
    print("春季")
elif month in (6, 7, 8):
    print("夏季")
elif month in (9, 10, 11):
    print("秋季")
elif month in (12, 1, 2):
    print("冬季")
else:
    print("无效月份")
```

上述代码用四个 `elif` 处理四季，加上 `else` 兜底，逻辑清晰。实际开发中如果分支超过五六个，且每个分支的判断逻辑相似，可以考虑重构为数据驱动的方式：

```python
# 数据驱动替代大量 elif
season_map = {
    3: "春季", 4: "春季", 5: "春季",
    6: "夏季", 7: "夏季", 8: "夏季",
    9: "秋季", 10: "秋季", 11: "秋季",
    12: "冬季", 1: "冬季", 2: "冬季",
}

month = 7
print(season_map.get(month, "无效月份"))
```

数据驱动的方式把判断逻辑转化为查表操作，扩展时只需在字典中加键值对，不必修改分支结构。这种思路在分支数量大且判断规则统一时尤为有效。

## 3.2.5 条件表达式的结果隐式转换为布尔值（True/False）

`if` 后面的条件表达式不一定是显式的布尔值，Python 会调用内置函数 `bool()` 把表达式的结果隐式转换为 `True` 或 `False`。这意味着你可以直接写 `if data:` 而不必写 `if len(data) > 0:`，让代码更简洁。这种隐式转换的规则会在本节后面专门讲解，这里先看一个简单示例。

```python
# 条件表达式隐式转换为布尔值
items = [1, 2, 3]

if items:                # 等价于 if bool(items):
    print("列表非空")

empty_list = []

if empty_list:           # 等价于 if bool(empty_list):
    print("这行不会执行")
else:
    print("列表为空")
```

上述代码中，`items` 是非空列表，`bool(items)` 返回 `True`，进入第一个分支。`empty_list` 是空列表，`bool(empty_list)` 返回 `False`，进入 `else` 分支。Python 程序员习惯用这种简洁写法判断容器是否非空，避免显式调用 `len()`。

## 3.2.6 分支代码块必须缩进

`if`、`elif`、`else` 后面的代码块必须缩进，这是 Python 语法的强制要求。冒号表示代码块的开始，下一行开始的缩进语句就是该代码块的内容。缩进量必须一致，多一条语句少一条语句都靠缩进来界定归属。这与上一节顺序结构中讲到的缩进规则完全一致。

```python
# 分支代码块的缩进
score = 85

if score >= 60:
    print("及格了")        # 属于 if 块
    grade = "PASS"        # 属于 if 块
    print("等级是", grade)  # 属于 if 块

print("结束")              # 不属于 if 块，必然执行
```

如果代码块只有一条语句，也不能省略缩进直接写在同一行后面。Python 允许把单条语句写在冒号后面同一行，但仅限于极简场景，PEP 8 规范不推荐这种写法：

```python
# 语法允许但不推荐的单行写法
if score >= 60: print("及格")

# 推荐的多行写法
if score >= 60:
    print("及格")
```

## 3.2.7 else 子句的悬挂（与最近 if 匹配）

`else` 子句总是与同一缩进层级上最近的未匹配 `if` 配对。这条规则在嵌套 `if` 中尤其重要，决定了 `else` 究竟属于哪一层判断。Python 通过缩进明确归属，没有 C 语言中著名的 dangling else 歧义问题，但仍需要理解配对规则，避免写出与预期不符的代码。

```python
# else 与最近 if 匹配
x = 10
y = 5

if x > 0:
    if y > 0:
        print("x 和 y 都为正")
    else:
        print("x 为正，y 不为正")   # 这个 else 属于内层 if
else:
    print("x 不为正")               # 这个 else 属于外层 if
```

上述代码中，内层 `else` 与内层 `if y > 0:` 配对，因为它们缩进层级相同。外层 `else` 与外层 `if x > 0:` 配对。`x` 是 10 大于 0，进入外层 `if`，`y` 是 5 也大于 0，所以执行 `print("x 和 y 都为正")`。如果把 `y` 改成负数，会执行内层 `else` 打印"x 为正，y 不为正"。

缩进决定了配对关系。如果想让 `else` 与外层 `if` 配对，把内层 `if` 改成不带 `else` 的形式，或者把内层 `if` 整体用括号或额外缩进隔离。Python 的缩进强制让配对关系在视觉上一目了然，这是相比大括号语言的一个优势。

## 3.2.8 嵌套 if 语句（if 内部再包含 if）

`if` 语句的代码块内部可以再包含 `if` 语句，形成嵌套。嵌套用于需要多重判断的场景，比如先判断外部条件是否满足，再在满足的前提下做进一步判断。嵌套层数过多会让代码难以阅读，应控制嵌套深度，一般不超过三层。

```python
# 嵌套 if：先判断登录状态，再判断权限
is_logged_in = True
user_role = "admin"

if is_logged_in:
    if user_role == "admin":
        print("显示管理后台")
    elif user_role == "editor":
        print("显示编辑界面")
    else:
        print("显示普通用户界面")
else:
    print("请先登录")
```

上述代码先判断用户是否登录，登录后再根据角色显示不同界面。两层嵌套逻辑清晰：外层处理登录状态，内层处理角色权限。如果不嵌套，把所有条件写在一层 `if-elif` 中，每个分支都要重复判断 `is_logged_in`，代码会冗长且易错：

```python
# 不嵌套的等价写法，条件重复
if is_logged_in and user_role == "admin":
    print("显示管理后台")
elif is_logged_in and user_role == "editor":
    print("显示编辑界面")
elif is_logged_in:
    print("显示普通用户界面")
else:
    print("请先登录")
```

两种写法功能等价，但嵌套版本更清晰地表达了"登录后才有权限判断"的层次关系。实际开发中应根据逻辑结构选择合适的写法，避免不必要的深层嵌套。

## 3.2.9 嵌套 if-else 的缩进层级

嵌套 `if-else` 时，每一层都有自己的缩进，层数越多缩进越深。保持每层缩进量一致（推荐 4 个空格）是可读性的基础。深层嵌套的代码往往难以理解，因为读者需要在大脑里同时维护多个判断分支的状态。当嵌套超过三层时，应考虑用提前返回、合并条件、提取函数等方式简化。

```python
# 深层嵌套的示例（不推荐）
def check_access(user):
    if user is not None:
        if user.is_active:
            if user.has_permission:
                if user.age >= 18:
                    return "允许访问"
                else:
                    return "年龄不足"
            else:
                return "无权限"
        else:
            return "账号未激活"
    else:
        return "用户不存在"
```

上述代码用四层嵌套表达一系列前置条件判断，可读性较差。可以改用提前返回的方式，把判断拍平：

```python
# 提前返回，拍平嵌套（推荐）
def check_access(user):
    if user is None:
        return "用户不存在"
    if not user.is_active:
        return "账号未激活"
    if not user.has_permission:
        return "无权限"
    if user.age < 18:
        return "年龄不足"
    return "允许访问"
```

两种写法功能相同，但第二种每一行只关注一个条件，逻辑从上到下层层过滤，阅读时无需在大脑里维护嵌套状态。这种"卫语句"风格是处理多层判断的常用技巧。

## 3.2.10 条件表达式中的 and、or、not 逻辑组合（短路求值影响分支走向）

`and`、`or`、`not` 是 Python 的三个逻辑运算符，用于组合多个条件。`and` 表示所有条件都为真时结果为真，`or` 表示任一条件为真时结果为真，`not` 表示取反。这三个运算符都有短路求值特性：`and` 在左操作数为假时直接返回左操作数，不再计算右操作数；`or` 在左操作数为真时直接返回左操作数，不再计算右操作数。短路求值不仅影响性能，也会影响程序行为，因为右侧表达式可能包含副作用。

```python
# and 短路：左操作数为假，右操作数不计算
def check_admin(user):
    return user.role == "admin"


user = None
# 如果 user 是 None，user.role 会报 AttributeError
# 用 and 短路避免这个错误
if user is not None and user.role == "admin":
    print("是管理员")
else:
    print("不是管理员或用户为空")
```

上述代码中，`user is not None` 为假时，`and` 直接返回 `False`，不再计算 `user.role == "admin"`。如果不用短路，对 `None` 访问 `.role` 会抛出 `AttributeError`。这种"先检查再访问"的模式在 Python 中极为常见。

```python
# or 短路：左操作数为真，右操作数不计算
config = {"host": "localhost"}

# 优先用配置文件中的值，没有则用默认值
host = config.get("host") or "127.0.0.1"
print(host)  # localhost

empty_config = {}
host = empty_config.get("host") or "127.0.0.1"
print(host)  # 127.0.0.1
```

`or` 的短路特性常用于设置默认值。`config.get("host")` 返回 `None` 时，`or` 继续计算右侧，返回 `"127.0.0.1"`。如果配置中已有值，`or` 直接返回该值，右侧的默认值不会被使用。这种写法比 `if-else` 简洁，但要小心 `0`、`False`、空字符串等被当作假值的情况。

```python
# not 取反
is_active = False
if not is_active:
    print("未激活")

# 复合逻辑
age = 25
has_ticket = True
if age >= 18 and has_ticket and not is_active:
    print("条件满足")
```

::: note 短路求值与返回值
Python 的 `and` 和 `or` 返回参与运算的操作数本身，不是布尔值。`a and b` 在 `a` 为假时返回 `a`，否则返回 `b`；`a or b` 在 `a` 为真时返回 `a`，否则返回 `b`。这种行为让 `or` 可以用来设置默认值，也让 `and` 可以用来取最后一个真值。理解这一点能解释为什么 `0 or 5` 返回 5，而 `0 and 5` 返回 0。
:::

## 3.2.11 条件表达式中的比较运算符链式使用（如 a < b <= c）

Python 支持比较运算符的链式写法，比如 `a < b <= c` 等价于 `a < b and b <= c`，但 `b` 只计算一次。这种链式写法在数学表达式中尤为自然，比如判断一个值是否落在某个区间，写起来直观且不易出错。其他许多语言不支持这种写法，需要拆开成两个独立的比较。

```python
# 链式比较：判断分数是否在及格区间
score = 78

if 60 <= score < 80:
    print("及格但未达良好")

# 等价写法
if score >= 60 and score < 80:
    print("及格但未达良好")
```

链式写法在表达区间判断时更接近数学符号，可读性更好。还可以扩展为更长的链：

```python
# 三段链式比较
x = 5
if 0 < x < 10:
    print("x 在 0 到 10 之间")

# 检查字母是否在小写字母范围内
char = "m"
if "a" <= char <= "z":
    print("小写字母")
```

链式比较中的每个操作数只计算一次，这一点在操作数是函数调用或有副作用时尤其重要。比如 `a() < b() <= c()` 中，`b()` 只会被调用一次，而写成 `a() < b() and b() <= c()` 则 `b()` 会被调用两次。这种细微差异在性能敏感或依赖副作用的场景下需要注意。

## 3.2.12 条件表达式中的成员运算符 in / not in

`in` 运算符用于判断一个值是否是某个容器（如列表、元组、字符串、字典、集合）的成员，返回布尔值。`not in` 是它的否定形式。在 `if` 条件中使用 `in` 可以让代码简洁地表达"是否包含"的判断，比显式循环查找更直观。

```python
# in 判断成员关系
fruits = ["apple", "banana", "cherry"]

if "banana" in fruits:
    print("列表中有香蕉")

if "grape" not in fruits:
    print("列表中没有葡萄")

# 字符串中的子串判断
email = "user@example.com"
if "@" in email:
    print("邮箱格式可能正确")

# 字典判断键是否存在
user = {"name": "张三", "age": 45}
if "name" in user:
    print("用户有 name 字段")

if "phone" not in user:
    print("用户没有 phone 字段")
```

`in` 在不同容器上的性能差异很大。在列表和元组上，`in` 需要遍历整个容器，时间复杂度为 O(n)；在集合和字典上，`in` 基于哈希表查找，时间复杂度为 O(1)。当频繁判断成员关系且数据量大时，应把列表转换为集合：

```python
# 频繁判断时用集合而非列表
valid_codes = {"A001", "A002", "A003", "A004"}  # 集合

code = "A003"
if code in valid_codes:
    print("有效代码")
```

## 3.2.13 条件表达式中的身份运算符 is / is not

`is` 运算符判断两个变量是否引用同一个对象，`is not` 是它的否定形式。`is` 与 `==` 的区别在前面章节已经讲过：`is` 比较身份，`==` 比较值。在 `if` 条件中，`is` 最常见的用途是判断变量是否为 `None`，因为 `None` 是单例对象，全程序只有一个。

```python
# is 判断 None
result = None

if result is None:
    print("结果为空，未执行")

if result is not None:
    print("结果已生成")
else:
    print("结果为空")
```

判断 `None` 必须用 `is`，这是 PEP 8 规范的明确要求。原因有两点：一是 `None` 是单例，用 `is` 判断身份比 `==` 判断值更准确；二是某些自定义类可能重写 `__eq__` 方法，导致 `== None` 的行为不符合预期，而 `is` 不会被重写，行为始终一致。

```python
# is 判断布尔值（虽然可以，但通常直接用变量本身）
flag = True

if flag is True:    # 语法正确，但啰嗦
    print("为真")

if flag:            # 推荐写法
    print("为真")
```

::: warning 不要用 is 比较普通值
`is` 只用于判断 `None`、`True`、`False` 等单例对象，不要用来比较数值、字符串、列表等普通对象的值是否相等。由于小整数缓存的存在，`a = 100; b = 100; a is b` 可能返回 `True`，但换一个大数字就返回 `False`，这种不一致容易引入隐蔽的 bug。判断值相等始终用 `==`。
:::

## 3.2.14 空数据类型的布尔值（None, 0, 0.0, '', [], (), {}, set() 均为 False）

Python 中每个对象都可以被 `bool()` 函数转换为布尔值。以下对象的布尔值为 `False`：`None`、布尔值 `False`、所有数值类型的零（`0`、`0.0`、`0j`）、空序列（`''`、`[]`、`()`）、空映射（`{}`）、空集合（`set()`）。这些被称为"假值"（falsy values），除此之外的对象布尔值都为 `True`。

```python
# 各种假值
falsy_values = [None, False, 0, 0.0, 0j, "", [], (), {}, set()]

for value in falsy_values:
    print(repr(value), "的布尔值是", bool(value))
```

上述代码会输出所有假值及其布尔值 `False`。在 `if` 条件中直接使用这些值，会被判定为假，跳过对应分支：

```python
# 直接判断变量真假
count = 0
if count:               # 等价于 if bool(0):
    print("有数量")
else:
    print("数量为零")    # 实际执行这行

name = ""
if name:
    print("有名字")
else:
    print("名字为空")    # 实际执行这行

items = []
if items:
    print("列表非空")
else:
    print("列表为空")    # 实际执行这行
```

这种简洁写法在 Python 中极为常见，被视为地道的代码风格。它比显式写 `if count != 0:` 或 `if len(items) > 0:` 更简洁，也更容易阅读。

::: note 注意 0 和 False 的等价性
在 Python 中，`0` 和 `False` 在布尔上下文中是等价的，`0.0` 和 `False` 也是。这意味着 `if 0:` 和 `if False:` 行为完全相同。但 `0` 和 `False` 不是同一个对象（`0 is False` 返回 `False`），它们只是布尔值相同。类似地，`1` 和 `True` 在布尔上下文中等价，但不是同一对象。
:::

## 3.2.15 非空数据类型的布尔值均为 True

除了上面列出的假值，其他所有对象的布尔值都为 `True`，无论其内容如何。非空字符串、非空列表、非零数值、自定义类的实例，都会被判定为真。这一点容易让初学者踩坑：以为 `if [0]:` 会因为列表里只有 0 而为假，实际上列表本身非空，布尔值就是 `True`。

```python
# 非空容器为真
print(bool([0]))          # True，列表非空
print(bool([False]))      # True，列表非空
print(bool([""]))         # True，列表非空
print(bool("False"))      # True，字符串非空
print(bool("0"))          # True，字符串非空
print(bool([None]))       # True，列表非空
```

上述示例都返回 `True`，因为判断的是容器本身是否非空，而不是容器内元素的真假。`[0]` 是包含一个元素的列表，列表非空，所以为真。`"0"` 是包含一个字符的字符串，字符串非空，所以为真。这一点在写条件判断时容易出错，需要区分"容器本身是否为空"和"容器内元素的值"。

```python
# 区分容器本身和容器内元素
data = [0]

if data:                  # 判断列表是否非空
    print("列表非空")      # 执行这行

if data[0]:               # 判断列表第一个元素是否为真
    print("第一个元素为真")
else:
    print("第一个元素为假")  # 执行这行，因为 0 是假值
```

## 3.2.16 分支结构中可包含任意语句（包括循环、异常等）

`if`、`elif`、`else` 的代码块内可以包含任意合法的 Python 语句，不限于简单的赋值或打印。可以放循环、函数定义、异常处理、类定义，甚至可以再嵌套一个完整的分支结构。这种灵活性让分支结构能够组织复杂的逻辑。

```python
# 分支内包含循环和异常处理
data = [1, 2, 3, 4, 5]
mode = "sum"

if mode == "sum":
    total = 0
    for item in data:
        total += item
    print("总和", total)
elif mode == "product":
    try:
        product = 1
        for item in data:
            product *= item
        print("乘积", product)
    except OverflowError:
        print("数值溢出")
elif mode == "stats":
    if len(data) > 0:
        print("最大值", max(data))
        print("最小值", min(data))
        print("平均值", sum(data) / len(data))
    else:
        print("数据为空")
else:
    print("未知模式")
```

上述代码在每个分支中分别使用了循环、异常处理、嵌套分支，展示了分支结构内可以容纳任意复杂度的逻辑。实际开发中，分支内的逻辑过于复杂时，建议提取为函数，让分支结构只负责调度：

```python
# 把分支内逻辑提取为函数
def compute_sum(data):
    total = 0
    for item in data:
        total += item
    return total


def compute_product(data):
    try:
        product = 1
        for item in data:
            product *= item
        return product
    except OverflowError:
        return None


def compute_stats(data):
    if len(data) == 0:
        return None
    return {
        "max": max(data),
        "min": min(data),
        "avg": sum(data) / len(data),
    }


# 分支结构只负责调度
if mode == "sum":
    print("总和", compute_sum(data))
elif mode == "product":
    result = compute_product(data)
    if result is None:
        print("数值溢出")
    else:
        print("乘积", result)
elif mode == "stats":
    stats = compute_stats(data)
    if stats is None:
        print("数据为空")
    else:
        print(stats)
else:
    print("未知模式")
```

提取函数后，分支结构变得简洁，每个函数专注做一件事，便于测试和复用。这是处理复杂分支逻辑的常用重构手法。

学完本节，你应该掌握了 Python 分支结构的全部基础：从最基本的 `if` 到多分支 `elif`，从嵌套判断到条件表达式中的各类运算符，以及数据类型真假判定的规则。下一节将进入循环结构的学习，看看程序如何重复执行某段代码。

## 练习题

### 第 1 题：写出下列代码的输出结果

阅读下面这段分支结构代码，在不运行的情况下写出它的输出。

```python
score = 76

if score >= 90:
    print("优秀")
elif score >= 80:
    print("良好")
elif score >= 60:
    print("及格")
else:
    print("不及格")

print("判定完成")
```

::: details 参考答案
输出如下。`score` 为 76，前两个条件都不成立，第三个条件 `score >= 60` 成立，执行 `print("及格")` 后跳出整个 `if-elif-else` 结构，最后无条件执行 `print("判定完成")`。

```
及格
判定完成
```
:::

### 第 2 题：编写判断年份是否为闰年的代码

闰年的判定规则：能被 4 整除但不能被 100 整除，或者能被 400 整除。请用 `if-else` 编写一段代码，判断变量 `year` 是否为闰年，并打印结果。

::: details 参考答案
```python
year = 2024

if (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0):
    print(year, "是闰年")
else:
    print(year, "不是闰年")
```

把两个条件用 `and` 和 `or` 组合起来，注意 `and` 优先级高于 `or`，括号让逻辑更清晰。2024 能被 4 整除且不能被 100 整除，输出"是闰年"。
:::

### 第 3 题：用嵌套分支实现用户登录与权限校验

请编写一段代码，先判断变量 `is_logged_in` 是否为 `True`，登录后再根据 `user_role` 的值（`"admin"`、`"editor"`、`"user"`）输出对应的界面名称。未登录时输出提示让用户先登录。

::: details 参考答案
```python
is_logged_in = True
user_role = "editor"

if is_logged_in:
    if user_role == "admin":
        print("显示管理后台")
    elif user_role == "editor":
        print("显示编辑界面")
    else:
        print("显示普通用户界面")
else:
    print("请先登录")
```

外层 `if` 判断登录状态，内层 `if-elif-else` 判断角色。嵌套结构清晰地表达了"登录后才有权限判断"的层次关系，避免在每个分支里重复检查 `is_logged_in`。
:::

### 第 4 题：项目练习题（命令行任务管理器）

命令行任务管理器接收用户输入的命令字符串，根据命令执行不同操作。请用 `if-elif-else` 编写命令分发逻辑，支持 `add`、`list`、`done`、`quit` 四个命令，未知命令输出提示。`quit` 命令打印告别信息。

::: details 参考答案
```python
command = "list"

if command == "add":
    print("执行添加任务")
elif command == "list":
    print("执行列出任务")
elif command == "done":
    print("执行标记完成")
elif command == "quit":
    print("再见，退出程序")
else:
    print("未知命令:", command)
```

命令分发是分支结构最常见的应用之一。当命令数量增多到六七个以上时，可以考虑改用字典映射，把命令字符串映射到对应的处理函数，避免 `elif` 链过长。
:::

## 常见错误

**错误 1 · `SyntaxError: expected ':'`**

原因:`if`、`elif`、`else` 关键字后遗漏了冒号。冒号是 Python 语法的一部分，标志代码块的开始。

解决:在条件表达式或 `else` 关键字后补上冒号 `:`。

**错误 2 · `if-elif-else 链中后续分支永不执行`**

原因:条件顺序从宽松到严格排列，前面的宽条件把后续窄条件的范围全部覆盖。例如先写 `score >= 60` 再写 `score >= 90`，90 分以上的数据在第一个分支就被拦截。

解决:条件从严格到宽松排列，先判断范围小的，再判断范围大的。

**错误 3 · `用 == 判断 None 导致行为异常`**

原因:用 `== None` 判断空值时，如果对象所属类重写了 `__eq__` 方法，比较结果可能不符合预期。`==` 比较的是值，`None` 应当用身份比较。

解决:判断 `None` 始终使用 `is None` 或 `is not None`，这是 PEP 8 规范的明确要求。

**错误 4 · `嵌套 if 中 else 配对到错误的层级`**

原因:`else` 总是与同一缩进层级上最近的未匹配 `if` 配对。缩进写错会导致 `else` 归属到非预期的 `if`，逻辑与预期不符。

解决:检查 `else` 的缩进量，确认它与目标 `if` 处于同一层级。用缩进明确表达配对关系。
