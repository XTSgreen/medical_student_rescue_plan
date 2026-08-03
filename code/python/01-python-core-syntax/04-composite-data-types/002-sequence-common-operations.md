---
title: 4.2 序列类型通用操作
sidebar:
  order: 2
---
# 4.2 序列类型通用操作（列表与元组共性）


列表和元组是 Python 中常用的两种序列类型。它们虽然一个可变一个不可变，但在索引、切片、拼接、比较等基础操作上完全一致。本节把这些共性操作集中讲解，帮助你一次掌握两套类型的通用用法，避免重复学习。理解这些操作后，你会发现列表和元组在读取层面几乎没有差异，区别仅在于能否原地修改。本节示例会同时用列表和元组演示，让你直观感受它们的操作一致性。

## 4.2.1 正向索引

序列中的每个元素都有一个位置编号，称为索引。Python 的正向索引从 **0** 开始，第一个元素索引为 0，第二个为 1，依此类推。通过 `seq[index]` 语法可以读取对应位置的元素。这种从零开始的编号方式与 C、Java 等语言一致，是绝大多数编程语言的通用约定。

```python
# 列表的正向索引
fruits = ["apple", "banana", "cherry", "date"]
print(fruits[0])    # apple，第一个
print(fruits[1])    # banana，第二个
print(fruits[3])    # date，第四个

# 元组的正向索引完全一致
point = (10, 20, 30)
print(point[0])     # 10
print(point[2])     # 30

# 字符串也是序列，索引取单个字符
word = "hello"
print(word[0])      # h
print(word[4])      # o
```

索引超出范围会抛出 IndexError，例如长度为 4 的列表访问索引 4 就会报错。合法的索引范围是 0 到 len(seq) - 1，使用前最好确认索引落在有效区间内，或者用异常捕获来处理越界情况。

## 4.2.2 负向索引

Python 支持负向索引，从 **-1** 开始指向序列末尾的最后一个元素。-1 是最后一个，-2 是倒数第二个，依此类推。负向索引的本质是把负数加上序列长度，所以 `seq[-1]` 等价于 `seq[len(seq) - 1]`。这种写法在需要取末尾元素时非常方便，不必先求长度。

```python
# 列表的负向索引
fruits = ["apple", "banana", "cherry", "date"]
print(fruits[-1])   # date，最后一个
print(fruits[-2])   # cherry，倒数第二个
print(fruits[-4])   # apple，等价于 fruits[0]

# 元组的负向索引
point = (10, 20, 30)
print(point[-1])    # 30

# 字符串的负向索引
word = "hello"
print(word[-1])     # o，最后一个字符
```

负向索引在取尾部元素时特别实用，例如读取日志列表的最后一条记录、获取队列中最近一次操作。负向索引同样受长度限制，超出范围也会抛 IndexError。长度为 4 的序列，合法的负向索引范围是 -1 到 -4。

## 4.2.3 切片操作

切片用 `[start:stop:step]` 语法截取序列的一段子序列。三个参数分别表示起始位置、结束位置和步长。切片遵循**含左不含右**的原则，即包含 start 位置的元素，不包含 stop 位置的元素。步长 step 表示每隔多少个元素取一个，默认为 1。

```python
numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# 基本切片：start 到 stop-1
print(numbers[2:5])     # [2, 3, 4]，索引 2、3、4
print(numbers[0:3])     # [0, 1, 2]，前三个

# 元组切片返回新元组
coords = (10, 20, 30, 40, 50)
print(coords[1:4])      # (20, 30, 40)

# 带步长的切片
print(numbers[1:8:2])   # [1, 3, 5, 7]，从索引 1 开始每隔一个取

# 负向步长：从右向左取
print(numbers[8:1:-1])  # [8, 7, 6, 5, 4, 3, 2]，倒着取
```

切片的一个重要特点是越界不会报错，解释器会自动把范围截断到有效区间。`numbers[5:100]` 返回 `[5, 6, 7, 8, 9]`，不会抛出 IndexError。这一点与单元素索引不同，让切片操作更安全也更灵活。

## 4.2.4 切片省略写法

切片的三个参数都可以省略，省略时会取默认值。省略 start 默认从序列开头开始，省略 stop 默认到序列末尾结束，省略 step 默认步长为 1。灵活运用省略写法能让代码更简洁。

```python
numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# 省略 start：从头到 stop
print(numbers[:4])      # [0, 1, 2, 3]

# 省略 stop：从 start 到末尾
print(numbers[6:])      # [6, 7, 8, 9]

# 全部省略：[:] 复制整个序列
print(numbers[:])       # [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# 省略 start 和 stop，只给 step
print(numbers[::2])     # [0, 2, 4, 6, 8]，隔一个取一个
print(numbers[::3])     # [0, 3, 6, 9]，每隔两个取一个

# 步长为 -1 反转序列
print(numbers[::-1])    # [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]

# 元组同样适用
t = (10, 20, 30, 40, 50)
print(t[::-1])          # (50, 40, 30, 20, 10)
```

其中 `[::-1]` 反转序列是 Python 中非常常见的技巧，比调用 `reverse()` 方法更轻量，因为切片返回新序列而不修改原序列，对不可变的元组和字符串同样适用。

## 4.2.5 切片返回新序列对象

切片操作总是返回一个新的序列对象，而不是原序列的视图。新对象包含了原序列中对应位置的元素引用，但外层容器是独立新建的。这意味着对切片结果的修改不会影响原序列，反之亦然。这种行为称为**浅拷贝**。

```python
# 切片生成新对象
original = [1, 2, 3, 4, 5]
sliced = original[1:4]
print(sliced)           # [2, 3, 4]
print(sliced is original)  # False，是不同对象

# 修改切片不影响原序列
sliced[0] = 99
print(sliced)           # [99, 3, 4]
print(original)         # [1, 2, 3, 4, 5]，原序列不变

# [:] 是复制序列的常用写法
copy_list = original[:]
copy_list.append(6)
print(original)         # [1, 2, 3, 4, 5]，原列表不受影响
print(copy_list)        # [1, 2, 3, 4, 5, 6]
```

需要注意的是，浅拷贝只复制外层容器，内层元素仍然是共享的引用。如果元素本身是可变对象（如嵌套列表），修改内层元素会同时影响原序列和切片。需要完全独立时要用 `copy.deepcopy()` 做深拷贝。

```python
# 浅拷贝下嵌套可变对象共享引用
nested = [[1, 2], [3, 4]]
shallow = nested[:]
shallow[0].append(99)
print(nested)           # [[1, 2, 99], [3, 4]]，原列表也变了
print(shallow)          # [[1, 2, 99], [3, 4]]
```

## 4.2.6 序列拼接运算符

`+` 运算符把两个同类型序列拼接成一个新序列，原序列保持不变。拼接后新序列的元素按左侧序列在前、右侧序列在后的顺序排列。`+` 要求两边是同类型序列，列表加列表、元组加元组都可以，但列表加元组会抛出 TypeError。

```python
# 列表拼接
list_a = [1, 2, 3]
list_b = [4, 5, 6]
combined = list_a + list_b
print(combined)         # [1, 2, 3, 4, 5, 6]
print(list_a)           # [1, 2, 3]，原列表不变

# 元组拼接
tuple_a = (1, 2)
tuple_b = (3, 4)
print(tuple_a + tuple_b)  # (1, 2, 3, 4)

# 字符串拼接
print("hello" + " " + "world")  # hello world

# 不同类型不能直接拼接
# print([1, 2] + (3, 4))  # TypeError: can only concatenate list to list
```

`+` 每次调用都会创建新对象并复制所有元素，在循环中反复拼接时性能较差。需要批量追加时，列表应使用 `extend()` 方法，元组可以先收集到列表再转换。

## 4.2.7 序列重复运算符

`*` 运算符把序列重复若干次，生成一个新序列。`seq * n` 表示把 seq 的内容重复 n 遍拼接在一起。这在初始化固定长度的序列或生成测试数据时很方便。

```python
# 列表重复
pattern = [0, 1]
print(pattern * 3)      # [0, 1, 0, 1, 0, 1]

# 元组重复
single = ("x",)
print(single * 4)       # ('x', 'x', 'x', 'x')

# 字符串重复
print("-" * 20)         # --------------------，生成分隔线
print("ab" * 3)         # ababab

# 重复零次得到空序列
print([1, 2] * 0)       # []
```

注意单个元素的元组必须写成 `(value,)` 带逗号的形式，否则括号会被当作数学运算的分组符号。`(5)` 是整数 5，`(5,)` 才是含一个元素的元组。

## 4.2.8 序列重复的整数倍规则

序列重复运算满足交换律，`n * seq` 与 `seq * n` 结果完全相同，其中 n 是整数，seq 是序列。重复次数为 0 或负数时，结果都是空序列。

```python
# 交换律：两种写法等价
seq = [1, 2]
print(3 * seq)          # [1, 2, 1, 2, 1, 2]
print(seq * 3)          # [1, 2, 1, 2, 1, 2]
print(3 * seq == seq * 3)  # True

# 零次和负数次重复
print(seq * 0)          # []
print(seq * -1)         # []，负数视为 0

# 字符串同样满足交换律
print(3 * "ab")         # ababab
print("ab" * 3)         # ababab
```

这个交换律让代码书写更灵活，你可以根据可读性选择把数字放前面还是序列放前面。常见做法是生成分隔线时写 `"-" * 40`，重复模式时写 `pattern * n`。

## 4.2.9 序列长度获取

`len()` 函数返回序列中元素的个数，适用于所有序列类型。它是 O(1) 操作，因为序列内部维护了长度信息，无需遍历。

```python
# 各种序列的长度
print(len([1, 2, 3, 4]))      # 4
print(len((10, 20, 30)))      # 3
print(len("hello"))           # 5
print(len(range(0, 10, 2)))   # 5，range 生成的元素个数

# 空序列长度为 0
print(len([]))                # 0
print(len(""))                # 0
```

`len()` 常用于循环边界控制和空序列判断。判断序列是否为空时，推荐直接 `if seq:` 而不是 `if len(seq) > 0:`，前者更简洁也更符合 Python 风格。

## 4.2.10 序列最大值与最小值

`max()` 和 `min()` 分别返回序列中的最大值和最小值。这两个函数要求序列中的元素之间可以比较大小，混合了不可比较类型（如数字和字符串）时会抛出 TypeError。

```python
# 数值序列的最大最小值
scores = [78, 95, 62, 88, 100]
print(max(scores))      # 100
print(min(scores))      # 62

# 元组同样适用
temps = (36.5, 37.2, 38.1, 36.8)
print(max(temps))       # 38.1
print(min(temps))       # 36.5

# 字符串序列按字典序比较
words = ["banana", "apple", "cherry"]
print(max(words))       # cherry
print(min(words))       # apple

# 也可以直接传多个参数
print(max(3, 7, 1, 9))  # 9
print(min(3, 7, 1, 9))  # 1
```

`max()` 和 `min()` 还接受可选的 `key` 参数，指定比较依据。例如按字符串长度找最长单词：`max(words, key=len)`。空序列调用这两个函数会抛出 ValueError，此时可以提供 `default` 参数指定默认返回值。

```python
empty = []
print(max(empty, default="无数据"))  # 无数据
```

## 4.2.11 序列元素求和

`sum()` 函数对序列中的数值元素求和，返回总和。它适用于包含数字（整数或浮点数）的序列，元素中有非数值类型会抛出 TypeError。

```python
# 数值求和
print(sum([1, 2, 3, 4, 5]))      # 15
print(sum([10.5, 20.3, 5.2]))    # 36.0

# 元组求和
print(sum((100, 200, 300)))      # 600

# range 求和
print(sum(range(1, 101)))        # 5050，1 到 100 的和

# 指定初始值
print(sum([1, 2, 3], 10))        # 16，初始值为 10
print(sum([1, 2, 3], 100))       # 106

# 空序列求和返回 0
print(sum([]))                   # 0
```

`sum()` 的第二个参数是初始值，默认为 0。当需要对浮点数求和且需要指定初始浮点值时，传入 `0.0` 可以确保结果为浮点类型。`sum()` 不能直接用于字符串拼接，字符串拼接应该用 `''.join(list)` 方法，效率更高。

## 4.2.12 序列元素计数

`count()` 方法统计序列中某个值出现的次数，返回整数。这是列表和元组共有的方法，字符串也有此方法。如果值不存在则返回 0。

```python
# 列表计数
tags = ["error", "warn", "error", "info", "error"]
print(tags.count("error"))    # 3
print(tags.count("debug"))    # 0

# 元组计数
dice = (1, 3, 5, 3, 2, 3)
print(dice.count(3))          # 3

# 字符串计数
text = "mississippi"
print(text.count("s"))        # 4
print(text.count("iss"))      # 2，支持子串计数
```

`count()` 的时间复杂度是 O(n)，需要遍历整个序列。如果需要统计所有元素的出现次数，用 `collections.Counter` 比反复调用 `count()` 更高效，一次遍历就能得到全部统计结果。

```python
from collections import Counter
tags = ["error", "warn", "error", "info", "error"]
counter = Counter(tags)
print(counter)  # Counter({'error': 3, 'warn': 1, 'info': 1})
print(counter["error"])  # 3
```

## 4.2.13 序列元素首次索引查找

`index()` 方法返回某个值在序列中第一次出现的索引位置。如果值不存在会抛出 ValueError。可以通过可选参数限制查找范围。

```python
# 列表查找索引
fruits = ["apple", "banana", "cherry", "banana", "date"]
print(fruits.index("banana"))     # 1，第一次出现的位置
print(fruits.index("banana", 2))  # 3，从索引 2 开始查找

# 元组查找索引
point = (10, 20, 30, 20, 50)
print(point.index(20))            # 1

# 字符串查找子串
text = "hello world"
print(text.index("world"))        # 6

# 值不存在会抛异常
# fruits.index("grape")  # ValueError: 'grape' is not in list

# 安全做法：先用 in 检查
if "grape" in fruits:
    print(fruits.index("grape"))
else:
    print("grape 不在列表中")
```

`index()` 只返回第一次出现的位置，要找所有出现位置需要配合循环或列表推导式。查找前用 `in` 检查可以避免异常，但会多一次遍历。更高效的做法是用 `try/except` 捕获 ValueError。

```python
# 用列表推导式找所有位置
positions = [i for i, v in enumerate(fruits) if v == "banana"]
print(positions)  # [1, 3]
```

## 4.2.14 序列的比较运算

序列之间可以用比较运算符进行比较，规则是**逐个元素按字典序比较**。从第一个元素开始，找到第一个不相等的位置，由该位置的元素大小决定整个序列的大小关系。如果所有对应元素都相等，则长度长的序列更大。

```python
# 逐元素比较
print([1, 2, 3] < [1, 2, 4])      # True，第三个元素 3 < 4
print([1, 2] < [1, 2, 3])         # True，前两个相同，短的更小
print([1, 2, 3] == [1, 2, 3])     # True，完全相同

# 元组比较
print((1, 2, 3) < (1, 2, 4))      # True
print((1, 2) < (1, 2, 3))         # True

# 字符串比较（按字符的 Unicode 码点）
print("abc" < "abd")              # True，c < d
print("abc" < "abcd")             # True，前三个相同，短的更小
print("apple" < "banana")         # True，a < b

# 混合类型不能比较
# print([1, "a"] < [1, "b"])      # 可能可以，因为第二个元素都是字符串
# print([1, 2] < ["a", "b"])      # TypeError: '<' not supported between int and str
```

比较时要求对应位置的元素类型兼容，数字和数字比、字符串和字符串比，类型不兼容会抛出 TypeError。这种字典序比较在排序场景中非常有用，`sorted()` 函数默认就是按这个规则排列序列元素的。

## 4.2.15 序列的乘法分配律行为与共享引用陷阱

用 `*` 重复序列时有一个容易踩的陷阱：当序列元素是可变对象时，重复操作复制的是引用而非对象本身。`[[]] * 3` 看似生成了三个独立的空列表，实际上三个位置引用的是同一个列表对象，修改其中一个会影响全部。

```python
# 陷阱：嵌套列表共享引用
bad = [[]] * 3
print(bad)              # [[], [], []]，看起来正常
bad[0].append(1)
print(bad)              # [[1], [1], [1]]，三个都变了

# 原因：三个元素是同一个列表对象
print(bad[0] is bad[1]) # True，身份相同

# 正确做法：用推导式各自创建
good = [[] for _ in range(3)]
print(good[0] is good[1])  # False，身份不同
good[0].append(1)
print(good)              # [[1], [], []]，只有第一个变了
```

这一陷阱的本质是 `*` 运算符对元素做浅拷贝，可变对象的引用被复制多份，指向同一个底层对象。不可变元素（如数字、字符串）不存在这个问题，因为不可变对象无法被修改，共享引用不会产生副作用。

```python
# 不可变元素重复没有问题
nums = [0] * 5
print(nums)             # [0, 0, 0, 0, 0]
nums[0] = 1             # 这是替换元素，不是修改原对象
print(nums)             # [1, 0, 0, 0, 0]，只有第一个变

# 可变元素重复才需要警惕
matrix_bad = [[0, 0]] * 3
matrix_bad[0][0] = 1
print(matrix_bad)       # [[1, 0], [1, 0], [1, 0]]，全部被改

matrix_good = [[0, 0] for _ in range(3)]
matrix_good[0][0] = 1
print(matrix_good)      # [[1, 0], [0, 0], [0, 0]]，只有第一行变
```

::: note 区分替换与修改
`nums[0] = 1` 是把索引 0 的引用替换为指向新对象 1，原对象 0 不受影响，所以其他位置不变。`bad[0].append(1)` 是通过引用修改了底层列表对象本身，所有指向该对象的引用都能看到变化。理解这一区别是避开共享引用陷阱的关键。
:::

掌握序列的通用操作后，你就能在列表和元组之间自如切换。下一节将进入组合数据类型更深入的话题，探讨字典与集合的专用操作和它们在数据去重、查找中的优势。

## 练习题

### 第 1 题：写出下列切片操作的结果

给定列表 `nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]`，在不运行的情况下写出下列表达式的值。

```python
nums[2:5]
nums[:3]
nums[-3:]
nums[::2]
nums[::-1]
```

::: details 参考答案
```python
nums[2:5]    # [2, 3, 4]，索引 2、3、4
nums[:3]     # [0, 1, 2]，前三个
nums[-3:]    # [7, 8, 9]，后三个
nums[::2]    # [0, 2, 4, 6, 8]，隔一个取一个
nums[::-1]   # [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]，反转
```

切片遵循左闭右开原则，`start` 包含、`stop` 不包含。省略 `start` 默认从开头，省略 `stop` 默认到末尾，`step` 为负数时从右向左取。`[::-1]` 是反转序列的常用技巧。
:::

### 第 2 题：用切片和索引访问嵌套列表

给定二维列表 `matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]`，请用一行代码取出第二行的前两个元素，并取出最后一行的最后一个元素。

::: details 参考答案
```python
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

row2_first_two = matrix[1][:2]
last_row_last = matrix[-1][-1]

print(row2_first_two)  # [4, 5]
print(last_row_last)   # 9
```

先用索引 `matrix[1]` 取出第二行（一个列表），再对它切片 `[:2]` 取前两个元素。负向索引 `[-1][-1]` 取最后一行的最后一个元素，链式访问反映数据的层级关系。
:::

### 第 3 题：分析 `[[]] * 3` 的共享引用陷阱

下面这段代码的输出是什么？请解释原因并给出修正方案。

```python
bad = [[]] * 3
bad[0].append(1)
print(bad)
```

::: details 参考答案
输出 `[[1], [1], [1]]`，三个位置都变了。

`[[]] * 3` 把同一个空列表对象的引用复制了三份，三个位置指向同一个列表。`bad[0].append(1)` 通过第一个引用修改了底层列表，所有引用都能看到变化。

修正方案是用推导式让每个位置独立创建列表：

```python
good = [[] for _ in range(3)]
good[0].append(1)
print(good)  # [[1], [], []]
```

推导式每次迭代都执行一次 `[]`，生成独立的内层列表，避免引用共享。这一陷阱的本质是 `*` 运算符对元素做浅拷贝，可变对象的引用被复制多份。
:::

### 第 4 题：项目练习题（命令行任务管理器）

命令行任务管理器的任务列表需要支持分页显示，每页显示 3 个任务。给定一个任务名称列表，请用切片实现分页功能，打印前两页的内容。

::: details 参考答案
```python
tasks = ["写文档", "评审代码", "修复 Bug", "测试", "部署", "回顾", "总结"]
page_size = 3

page1 = tasks[0:page_size]
page2 = tasks[page_size:page_size * 2]

print("第 1 页:", page1)
print("第 2 页:", page2)
```

输出：

```
第 1 页: ['写文档', '评审代码', '修复 Bug']
第 2 页: ['测试', '部署', '回顾']
```

切片的左闭右开特性让分页计算很自然：第 N 页的起始索引是 `(N-1) * page_size`，结束索引是 `N * page_size`。切片越界会自动截断，不必担心最后一页元素不足报错。
:::

## 常见错误

**错误 1 · `IndexError: list index out of range`**

原因:用大于或等于 `len(seq) - 1` 的正向索引访问元素，或用小于 `-len(seq)` 的负向索引访问元素。单元素索引不会自动截断，越界即报错。

解决:访问前用 `0 <= index < len(seq)` 检查，或用 `try/except IndexError` 捕获。若只需取尾部元素且容忍越界，改用切片 `seq[-1:]` 返回单元素列表而非报错。

**错误 2 · `TypeError: can only concatenate list (not "tuple") to list`**

原因:`+` 运算符要求两边是同类型序列，列表与元组直接拼接会抛出 TypeError。

解决:先用 `list()` 或 `tuple()` 把其中一方转换成与另一方相同的类型，再拼接。或者用解包写法 `[*list_a, *tuple_a]` 合并为新列表，避免类型不一致。

**错误 3 · `[[]] * 3` 修改一处全部变化**

原因:`*` 运算符对元素做浅拷贝，可变对象的引用被复制多份，三个位置指向同一个列表对象。通过任一引用修改底层列表，所有引用都能看到变化，表现为修改一处全部跟着变。

解决:用列表推导式 `[[] for _ in range(3)]` 让每次迭代独立创建列表，三个位置引用不同对象。不可变元素（数字、字符串、元组）不存在此问题，可直接用 `*`。
