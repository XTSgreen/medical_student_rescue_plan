---
title: 3.3 for 循环
sidebar:
  order: 3
---
# 3.3 for 循环


for 循环是 Python 中用于遍历可迭代对象的核心语法结构。它把"对容器中的每个元素做同一件事"这一常见需求压缩到一行语句中，避免手动管理索引和边界。本节从基本语法入手，逐步覆盖常见可迭代对象、range 函数、字典迭代、enumerate 与 zip、嵌套循环以及迭代过程中的安全性问题，帮助你建立对 for 循环的完整认识。

## 3.3.1 for 循环的基本语法

for 循环的基本写法是 `for 变量 in 可迭代对象:`，后面跟一个缩进的循环体。每次迭代，解释器从可迭代对象中取出一个元素赋给循环变量，然后执行一次循环体，直到元素被取完为止。

```python
for letter in "ABC":
    print(letter)
# A
# B
# C
```

循环变量在每次迭代时被重新绑定，循环结束后仍然保留最后一次的值，可以在循环外继续使用。循环体必须缩进，缩进风格通常用四个空格，与函数、条件语句的缩进规则一致。for 语句末尾的冒号不可省略，它是 Python 语法的一部分，标志着一个代码块的开始。

## 3.3.2 可迭代对象类型

for 循环能遍历任何可迭代对象。Python 内置的可迭代类型包括字符串、列表、元组、字典、集合以及 range 对象等。不同类型迭代时取出的内容不同：字符串取出字符，列表和元组取出元素，字典默认取出键，集合取出元素（顺序不保证），range 对象取出整数。

```python
# 字符串
for ch in "hi":
    print(ch, end=" ")
# h i

# 列表
for n in [10, 20, 30]:
    print(n, end=" ")
# 10 20 30

# 元组
for item in (1, 2, 3):
    print(item, end=" ")
# 1 2 3

# 字典（默认迭代键）
for k in {"a": 1, "b": 2}:
    print(k, end=" ")
# a b

# 集合
for x in {7, 8, 9}:
    print(x, end=" ")
# 7 8 9（顺序可能不同）

# range 对象
for i in range(3):
    print(i, end=" ")
# 0 1 2
```

判断一个对象是否可迭代，可以看它是否实现了 `__iter__` 方法。实际开发中更常用的做法是直接把它放进 for 循环测试，遇到 `TypeError: 'xxx' object is not iterable` 就说明该对象不可迭代。文件对象、生成器、map 与 filter 等也属于可迭代对象，会在后续章节展开。

## 3.3.3 range() 函数的三种形式

range 函数专门用于生成一段整数序列，是 for 循环最常见的搭档。它有三种调用形式：`range(stop)`、`range(start, stop)` 和 `range(start, stop, step)`。无论哪种形式，range 返回的都是 range 对象，不会生成列表，这种惰性设计让它在生成大序列时不占用额外内存。

`range(stop)` 从 0 开始，每次加 1，直到但不包括 stop：

```python
for i in range(4):
    print(i, end=" ")
# 0 1 2 3
```

`range(start, stop)` 从 start 开始，到 stop 之前结束：

```python
for i in range(2, 6):
    print(i, end=" ")
# 2 3 4 5
```

`range(start, stop, step)` 在前两者基础上指定步长：

```python
for i in range(1, 10, 2):
    print(i, end=" ")
# 1 3 5 7 9
```

三种形式本质上是参数个数决定的语法糖，省略的参数会取默认值：start 默认为 0，step 默认为 1。需要整数序列时优先使用 range，而不是手工构造列表，因为 range 对象只保存三个参数，内存占用与序列长度无关。

## 3.3.4 range() 的 stop 值不包含在迭代范围内

range 的 stop 是一个**开区间**边界，迭代过程中不会出现等于 stop 的值。这一设计与切片的左闭右开原则保持一致，方便配合索引使用。例如遍历长度为 n 的列表时，`range(n)` 正好覆盖所有合法索引 0 到 n-1。

```python
data = ["a", "b", "c"]
for i in range(len(data)):
    print(i, data[i])
# 0 a
# 1 b
# 2 c
```

如果误把 stop 当成包含值，会少迭代一次或者多迭代一次。新手常犯的错是把 `range(1, 5)` 当成 1 到 5，实际它只产生 1、2、3、4。记住 stop 是"到此为止"的标志，不参与取值。这一规则在切片、字符串查找等场景中反复出现，理解一次即可处处适用。

## 3.3.5 range() 的 step 可为负数

step 为负数时，range 生成递减序列，此时 start 必须大于 stop 才能取出元素，否则结果为空。这种形式常用于反向遍历索引或者按递减步长采样：

```python
for i in range(5, 0, -1):
    print(i, end=" ")
# 5 4 3 2 1

for i in range(10, 0, -3):
    print(i, end=" ")
# 10 7 4 1
```

注意 `range(5, 0, -1)` 不会产生 0，因为 stop 仍是开区间。如果想包含 0，应该写 `range(5, -1, -1)`。step 不能为 0，否则会抛出 `ValueError: range() arg 3 must not be zero`。step 为正数时要求 start 小于 stop，否则结果同样为空，这一对称性使得 range 的行为在不同方向上保持一致。

## 3.3.6 for 循环中直接迭代字典

把字典直接放在 for 循环中，默认迭代的是它的键。这一行为等价于调用 `dict.keys()`，但写法更简洁。由于 Python 3.7 起字典保持插入顺序，迭代顺序与写入顺序一致，结果可预期。

```python
scores = {"math": 90, "english": 85, "physics": 78}
for key in scores:
    print(key, scores[key])
# math 90
# english 85
# physics 78
```

直接迭代字典的场景多见于只需要键的逻辑，比如统计键的数量或检查某些键是否存在。如果同时需要键和值，推荐使用后面介绍的 `items()` 方法，避免在循环体中再做一次 `dict[key]` 查找。直接迭代字典时修改字典结构（增删键）同样会引发迭代异常，处理方式参考后文的安全性章节。

## 3.3.7 字典的 .keys()、.values()、.items() 在 for 中的使用

字典提供三个视图对象方法来支撑不同维度的迭代。`.keys()` 返回所有键的视图，`.values()` 返回所有值的视图，`.items()` 返回所有键值对的视图，每个键值对是一个元组。视图对象是动态的，字典改变时视图同步反映变化。

```python
stock = {"apple": 5, "banana": 3, "cherry": 8}

# 只迭代键
for fruit in stock.keys():
    print(fruit, end=" ")
# apple banana cherry

# 只迭代值
for count in stock.values():
    print(count, end=" ")
# 5 3 8

# 迭代键值对
for fruit, count in stock.items():
    print(f"{fruit}: {count}")
# apple: 5
# banana: 3
# cherry: 8
```

`items()` 配合解包是处理字典最常用的模式，循环体中可以直接拿到键和值，无需二次查找。视图对象本身不支持索引访问，如果需要按下标取值，可以先转成列表，例如 `list(stock.values())[0]`。视图相比列表更省内存，因为它不会复制字典内容，只是引用字典的内部结构。

## 3.3.8 enumerate() 函数在 for 中的使用

有时既需要元素本身，又需要它在序列中的位置索引，这时用 enumerate 函数最合适。enumerate 返回一个迭代器，每次产出一个形如 `(索引, 元素)` 的元组，默认索引从 0 开始。

```python
tasks = ["load", "process", "save"]
for idx, task in enumerate(tasks):
    print(idx, task)
# 0 load
# 1 process
# 2 save
```

enumerate 接受第二个参数 `start` 来指定起始索引，常用于人类阅读时从 1 开始编号的场景：

```python
for no, task in enumerate(tasks, start=1):
    print(f"步骤 {no}: {task}")
# 步骤 1: load
# 步骤 2: process
# 步骤 3: save
```

相比 `for i in range(len(tasks))` 的写法，enumerate 更简洁也更快，因为它避免了在循环体中通过索引访问元素。这种写法是 Python 中遍历带索引序列的推荐方式，能同时拿到位置和元素，可读性也更好。

## 3.3.9 zip() 函数在 for 中的并行迭代使用

zip 函数把多个可迭代对象按位置打包成一个个元组，配合 for 循环可以并行遍历多个序列。当其中一个序列较短时，zip 在最短的那个序列耗尽时停止，较长的部分被忽略。

```python
names = ["Alice", "Bob", "Carol"]
ages = [25, 30, 28]
for name, age in zip(names, ages):
    print(f"{name} is {age}")
# Alice is 25
# Bob is 30
# Carol is 28
```

如果需要严格等长并行，可以使用 `itertools.zip_longest`，缺少的部分用 `fillvalue` 填充。zip 也常用于把两个列表快速组装成字典，`dict(zip(names, ages))` 得到 `{'Alice': 25, 'Bob': 30, 'Carol': 28}`，这种组合写法在数据对齐场景中非常实用。zip 的参数个数不限，三个以上序列也能并行打包，只要解包时变量数量匹配即可。

## 3.3.10 嵌套 for 循环

for 循环体内部可以再写 for 循环，构成嵌套结构。外层循环每执行一次，内层循环完整跑一遍。嵌套循环常用于处理二维结构，比如矩阵、表格、笛卡尔积。

```python
for i in range(3):
    for j in range(3):
        print(f"({i},{j})", end=" ")
    print()
# (0,0) (0,1) (0,2)
# (1,0) (1,1) (1,2)
# (2,0) (2,1) (2,2)
```

嵌套循环的总迭代次数等于各层次数的乘积，三层以上嵌套会让性能迅速下降，使用时要留意数据规模。Python 中可以用推导式把简单的双层 for 压缩成一行，例如 `[(i, j) for i in range(3) for j in range(3)]`，可读性视具体情况而定。嵌套循环的缩进层级要严格区分，多一层缩进就多一层循环作用域，混淆缩进会导致逻辑错误。

## 3.3.11 for 循环中修改迭代对象的安全性问题

在 for 循环中直接修改正在迭代的列表（增删元素）是危险的。Python 的 for 循环内部依赖索引或迭代器位置，列表长度一旦改变，后续取出的元素位置就会错乱，可能跳过元素或重复访问，甚至导致索引越界。

```python
nums = [1, 2, 3, 4, 5]
# 试图删除所有偶数
for n in nums:
    if n % 2 == 0:
        nums.remove(n)
print(nums)
# [1, 3, 5]，看似正确，但换一组数据就会出错
```

::: warning 不要边遍历边修改
这段代码在某些情况下能"碰巧"得到正确结果，但本质上不可靠。迭代器维护的内部位置不会随列表缩短而调整，删除一个元素后，下一个被访问的实际上是原来再下一个位置的元素，导致跳过。
:::

推荐的做法是构造一个新列表存放结果，或者在迭代副本上进行修改。对于过滤类需求，列表推导式是最简洁的方案：

```python
nums = [1, 2, 3, 4, 5]
# 推荐写法：用推导式生成新列表
odds = [n for n in nums if n % 2 != 0]
print(odds)
# [1, 3, 5]
```

## 3.3.12 遍历列表时使用切片副本避免索引问题

当确实需要在遍历过程中修改原列表时，可以通过切片创建一份副本，对副本遍历，对原列表修改。切片 `[:]` 产生一个浅拷贝，遍历副本不会受到原列表修改的影响。

```python
items = ["a", "b", "c", "d"]
for item in items[:]:        # 遍历副本
    if item == "b":
        items.remove(item)   # 修改原列表
print(items)
# ['a', 'c', 'd']
```

这种写法在需要边遍历边删除的场景下安全可靠。要注意切片是**浅拷贝**，如果列表元素是可变对象（如嵌套列表），修改元素内部仍会影响两边。深层次修改应该使用 `copy.deepcopy` 生成完全独立的副本。另一种等价写法是 `for item in list(items):`，`list()` 同样会生成新列表，效果与切片一致，选择哪种看个人偏好。

## 3.3.13 for 循环结合解包赋值

for 循环的循环变量支持解包赋值，当可迭代对象每次产出的元素本身是固定长度的序列（如元组、列表）时，可以直接在 for 行把元素解包到多个变量。这种写法比先取索引再访问更直观。

```python
pairs = [(1, "a"), (2, "b"), (3, "c")]
for num, letter in pairs:
    print(num, letter)
# 1 a
# 2 b
# 3 c
```

解包要求变量数量与元素长度一致，否则会抛出 `ValueError: too many values to unpack` 或 `not enough values to unpack`。前文 `dict.items()` 与 `zip()` 的示例都属于这种模式。如果只关心部分值，可以用下划线 `_` 占位忽略其余变量，例如 `for k, _ in pairs:` 只取第一个值。星号解包 `for first, *rest in pairs:` 也能用，把多余的部分收集成列表，灵活处理不定长结构。

## 练习题

### 第 1 题：写出下列代码的输出结果

阅读下面这段 for 循环代码，在不运行的情况下写出它的输出。

```python
for i in range(1, 6):
    if i % 2 == 0:
        continue
    print(i, end=" ")
```

::: details 参考答案
输出如下。`range(1, 6)` 产生 1、2、3、4、5，偶数被 `continue` 跳过，只打印奇数。

```
1 3 5 
```
:::

### 第 2 题：编写代码计算列表中所有偶数的和

给定列表 `numbers = [12, 7, 8, 15, 20, 3]`，请用 for 循环遍历并累加所有偶数，最后打印结果。

::: details 参考答案
```python
numbers = [12, 7, 8, 15, 20, 3]
total = 0

for n in numbers:
    if n % 2 == 0:
        total += n

print("偶数之和:", total)
```

输出 `偶数之和: 40`，即 12 + 8 + 20。在循环外初始化累加变量，循环内用 `if` 判断偶数后再累加，是统计类问题的标准写法。
:::

### 第 3 题：用 enumerate 同时获取索引和元素

给定列表 `tasks = ["load", "process", "save", "report"]`，请用 `enumerate` 遍历它，输出形如 `步骤 1: load` 的内容，序号从 1 开始。

::: details 参考答案
```python
tasks = ["load", "process", "save", "report"]

for no, task in enumerate(tasks, start=1):
    print(f"步骤 {no}: {task}")
```

输出：

```
步骤 1: load
步骤 2: process
步骤 3: save
步骤 4: report
```

`enumerate` 比 `range(len(tasks))` 更简洁，因为它同时返回索引和元素，避免在循环体中再做一次索引访问。
:::

### 第 4 题：项目练习题（命令行任务管理器）

命令行任务管理器用一个列表 `tasks` 存储任务名称。请编写代码遍历该列表，按行打印每个任务的编号和名称，编号从 1 开始。如果列表为空，打印提示信息"暂无任务"。

::: details 参考答案
```python
tasks = ["完成需求文档", "提交代码评审", "修复测试失败"]

if not tasks:
    print("暂无任务")
else:
    for idx, name in enumerate(tasks, start=1):
        print(f"{idx}. {name}")
```

输出：

```
1. 完成需求文档
2. 提交代码评审
3. 修复测试失败
```

利用 `if not tasks` 判断空列表，这是 Python 风格的空容器检查方式。`enumerate` 让编号和任务名同时可用，符合列表展示的常见需求。
:::

## 常见错误

**错误 1 · `TypeError: 'int' object is not iterable`**

原因:把整数直接放进 `for` 循环迭代。整数不是可迭代对象，无法逐个取出元素。

解决:改用 `range()` 生成整数序列，例如 `for i in range(10)` 而非 `for i in 10`。

**错误 2 · `range(1, 5) 期望产生 1 到 5 但实际只有 1 到 4`**

原因:range 的 stop 参数是开区间边界，不包含等于 stop 的值。这是 off-by-one 错误的常见来源。

解决:把 stop 值加 1。要遍历 1 到 5，写 `range(1, 6)`。

**错误 3 · `边遍历边删除列表元素导致跳过元素`**

原因:在 `for` 循环中调用 `list.remove()` 删除元素后，列表长度改变，迭代器内部位置错乱，下一个被访问的元素实际上是原来再下一个位置的元素。

解决:遍历列表的副本（`for item in items[:]`），对原列表修改；或用列表推导式生成新列表。

**错误 4 · `ValueError: too many values to unpack`**

原因:for 循环的循环变量数量与可迭代对象每次产出的元素长度不一致。例如对二元组列表用 `for a, b, c in pairs` 解包。

解决:确认循环变量数量与元素长度一致，或用星号解包 `for first, *rest in pairs` 收集多余部分。
