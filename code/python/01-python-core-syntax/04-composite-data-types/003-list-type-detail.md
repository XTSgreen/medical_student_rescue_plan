---
title: 4.3 列表类型专题
sidebar:
  order: 3
---
# 4.3 列表类型（List）专题


列表是 Python 中使用频率最高的容器类型。它把一组数据按顺序组织起来，每个元素占据一个固定位置，可以随时读取、修改、增删。本专题在前一节列表基础之上，逐一拆解列表的字面量定义、索引与切片赋值、删除操作、各类方法、增量赋值、栈与队列用法、推导式、嵌套结构与底层运算符行为，帮助你建立对列表完整而精确的认识。

## 4.3.1 列表字面量定义

列表的字面量写法用一对方括号 `[]` 包裹，元素之间以逗号分隔。简单的两种形式是空列表 `[]` 和带元素的列表 `[1, 2, 3]`。解释器在读取到方括号时直接构造出列表对象，无需调用任何构造函数。

```python
empty = []
print(empty)              # []
print(type(empty))        # <class 'list'>

numbers = [1, 2, 3]
print(numbers)            # [1, 2, 3]
print(len(numbers))       # 3
```

空列表常用于先创建容器再逐步填充的场景，例如边读取数据边收集结果。带元素的列表则在定义时就把初始内容确定下来。除了字面量写法，也可以用 `list()` 构造函数把其他可迭代对象转换为列表，例如 `list(range(5))` 得到 `[0, 1, 2, 3, 4]`，`list("abc")` 得到 `['a', 'b', 'c']`。

## 4.3.2 列表元素可混合任意类型

Python 是动态类型语言，列表本身只保存元素的引用，对引用指向的对象类型没有任何限制。同一个列表中可以混合存放整数、浮点数、字符串、布尔值，甚至其他列表、字典或自定义对象。这种灵活性在处理异质数据时非常方便。

```python
mixed = [1, "hello", 3.14, True, [2, 4], {"key": "value"}]
print(mixed[0])           # 1，整数
print(mixed[1])           # hello，字符串
print(mixed[4])           # [2, 4]，嵌套列表
print(mixed[5])           # {'key': 'value'}，字典
```

混合类型列表的代价在于访问时需要清楚每个位置的数据类型，否则容易在后续运算中触发 `TypeError`。对于结构统一的数据，推荐让列表只存放同种类型；对于结构化的异质记录，用字典或数据类表示会更清晰。列表最适合存放同质数据或临时组合。

## 4.3.3 列表的索引赋值

列表是可变序列，可以通过索引直接对已有位置重新赋值，语法是 `list[index] = value`。赋值会替换该位置原来的元素，列表长度保持不变。索引既支持正向从 0 开始，也支持负向从 -1 开始。

```python
colors = ["red", "green", "blue"]
colors[0] = "yellow"
print(colors)             # ['yellow', 'green', 'blue']

colors[-1] = "black"
print(colors)             # ['yellow', 'green', 'black']
```

索引赋值要求索引在有效范围内，越界会抛出 `IndexError`。例如长度为 3 的列表，赋值 `colors[3] = "white"` 会报错，因为索引 3 已超出 0 到 2 的范围。索引赋值只能替换已有元素，无法用来新增元素，新增要用 `append` 或 `insert` 方法。

## 4.3.4 列表的切片赋值

切片赋值是对列表中一段连续区域进行替换，语法是 `list[start:stop] = iterable`。赋值的内容可以是任意可迭代对象，其元素会按顺序填入切片指定的位置，替换掉原来那段元素。切片遵循左闭右开原则，start 包含、stop 不包含。

```python
nums = [10, 20, 30, 40, 50]
nums[1:3] = [200, 300]
print(nums)               # [10, 200, 300, 40, 50]

nums[0:2] = [100, 200, 250]
print(nums)               # [100, 200, 250, 300, 40, 50]
```

切片赋值的一个特点是替换内容的长度可以与切片长度不同。第二个例子中切片 `nums[0:2]` 覆盖 2 个元素，却填入了 3 个新元素，列表因此变长。这种灵活性使切片赋值同时具备替换、插入和删除的能力，后续会详细展开。

## 4.3.5 切片赋值可改变列表长度

当赋值内容的长度与切片长度不一致时，列表会自动调整长度以容纳新内容。这个特性可以用来在指定位置插入元素，也可以用来删除一段元素。把切片设为空范围 `list[i:i]`，再赋值一个非空可迭代对象，就实现了在位置 i 处插入。

```python
data = [1, 2, 3, 4, 5]

# 插入：在索引 2 处插入多个元素
data[2:2] = [20, 30]
print(data)               # [1, 2, 20, 30, 3, 4, 5]

# 删除：把切片替换为空
data[1:4] = []
print(data)               # [1, 3, 4, 5]

# 清空全部
data[:] = []
print(data)               # []
```

切片替换为空可迭代对象等价于删除那段元素，后面的元素自动前移。`data[:] = []` 这种写法用空内容替换整个列表，效果与 `clear()` 相同，都保留列表对象本身。切片赋值改变长度的能力让列表操作非常灵活，但也需要谨慎使用，避免在遍历过程中意外修改长度导致逻辑混乱。

## 4.3.6 切片赋值支持步长

切片赋值可以带上步长参数，写作 `list[start:stop:step] = iterable`。带步长的切片赋值有一个严格要求：赋值内容的元素数量必须与切片选中的元素数量完全一致，否则抛出 `ValueError`。因为带步长时每个被替换的位置是离散的，解释器无法自动调整长度。

```python
nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

# 步长为 2，选中索引 0、2、4、6、8 共 5 个位置
nums[0:10:2] = [100, 102, 104, 106, 108]
print(nums)               # [100, 1, 102, 3, 104, 5, 106, 7, 108, 9]

# 数量不匹配会报错
# nums[0:10:2] = [1, 2, 3]   # ValueError: attempt to assign sequence of size 3 to extended slice of size 5
```

步长为 1 或省略步长时，赋值内容长度可以任意，因为连续切片可以伸缩。一旦指定了非 1 的步长，就进入**扩展切片**模式，必须严格遵守长度匹配规则。实际开发中带步长的切片赋值使用较少，多数场景用步长为 1 的切片即可满足需求。

## 4.3.7 del 语句删除列表元素

`del` 是一个语句而非函数，用于删除列表中指定索引位置的元素。删除后该位置之后的元素自动前移填补空位，列表长度减一。`del` 按位置删除，与按值删除的 `remove()` 形成互补。

```python
items = ["a", "b", "c", "d", "e"]
del items[1]
print(items)              # ['a', 'c', 'd', 'e']

del items[-1]
print(items)              # ['a', 'c', 'd']
```

`del items[index]` 要求索引有效，越界会抛 `IndexError`。删除操作是 O(n) 的，因为后面的元素都要前移，在列表头部频繁删除时性能开销明显。如果只需要取出末尾元素，用 `pop()` 更合适，因为它额外返回被删除的值。

## 4.3.8 del 语句删除列表切片

`del` 也可以删除一段切片，语法是 `del list[start:stop]`。删除切片后，切片之后的所有元素整体前移，列表长度相应减少。切片删除同样支持步长，带步长时会删除所有被步长选中的离散位置。

```python
nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

del nums[2:5]
print(nums)               # [0, 1, 5, 6, 7, 8, 9]

# 带步长删除：删掉所有偶数位置
del nums[::2]
print(nums)               # [1, 6, 8]
```

`del list[:]` 会删除列表所有元素，保留列表对象本身，效果等同于 `clear()`。这与 `del list` 不同，后者删除的是变量绑定本身，执行后该名字不再可用。切片删除是批量移除元素的简洁写法，比循环调用 `pop` 或 `remove` 更高效，因为元素移动只发生一次。

## 4.3.9 列表尾部追加元素

`append(value)` 是列表常用的方法，把单个元素追加到列表末尾。它直接在原列表上修改，不返回新列表，返回值是 `None`。`append` 的时间复杂度是 O(1)，因为列表内部维护了长度信息，追加时只需在末尾写入并更新长度。

```python
tasks = []
tasks.append("read")
tasks.append("write")
tasks.append("close")
print(tasks)              # ['read', 'write', 'close']
```

`append` 接受的是单个元素，即使传入一个列表，也会把整个列表作为一个元素追加，而不是展开其内容。这是 `append` 与 `extend` 的关键区别。如果发现追加后列表出现了意料之外的嵌套层级，多半是把 `extend` 的需求误写成了 `append`。

## 4.3.10 列表批量追加可迭代对象

`extend(iterable)` 把一个可迭代对象的所有元素依次追加到列表末尾，相当于在原列表上批量扩展。它与 `append` 的区别在于 `extend` 会展开传入的可迭代对象，而 `append` 把它作为单个元素加入。`extend` 同样就地修改，返回 `None`。

```python
base = [1, 2, 3]
base.extend([4, 5])
print(base)               # [1, 2, 3, 4, 5]

base.extend("ab")
print(base)               # [1, 2, 3, 4, 5, 'a', 'b']

# 对比 append 的行为
base.append([6, 7])
print(base)               # [1, 2, 3, 4, 5, 'a', 'b', [6, 7]]
```

`extend` 接受任何可迭代对象，包括列表、元组、字符串、集合、range 等。传入字符串时会把每个字符作为一个元素追加，这点需要留意。`extend` 与 `+=` 增量赋值在行为上等价，底层都调用相同的扩展逻辑，后续会详细对比。

## 4.3.11 列表指定位置插入元素

`insert(index, value)` 在指定索引位置插入一个元素，原来该位置及之后的元素整体后移。插入位置之后的所有元素都要移动，因此 `insert` 的时间复杂度是 O(n)。当 index 大于等于列表长度时，元素会被追加到末尾；当 index 为负数且绝对值超过长度时，元素会被插入到开头。

```python
queue = ["a", "b", "d"]
queue.insert(2, "c")
print(queue)              # ['a', 'b', 'c', 'd']

queue.insert(0, "start")
print(queue)              # ['start', 'a', 'b', 'c', 'd']

queue.insert(100, "end")
print(queue)              # ['start', 'a', 'b', 'c', 'd', 'end']
```

在列表头部频繁插入时，每次 `insert(0, value)` 都要把全部元素后移，性能开销显著。如果应用场景需要在两端频繁增删，应该改用 `collections.deque`，它在两端的操作都是 O(1)。对于偶尔的中间插入，`insert` 的写法直观清晰，可读性良好。

## 4.3.12 列表按值删除首个匹配元素

`remove(value)` 从列表中删除第一个等于 value 的元素，按值而非按位置删除。如果列表中存在多个匹配项，只删除最先出现的那个。如果要删除的值不存在，抛出 `ValueError`。`remove` 是 O(n) 操作，因为它需要先线性扫描找到目标，再移动后续元素。

```python
tags = ["error", "warn", "error", "info"]
tags.remove("error")
print(tags)               # ['warn', 'error', 'info']

# 要删除的值不存在
# tags.remove("debug")    # ValueError: list.remove(x): x not in list
```

调用 `remove` 前如果不确定值是否存在，应该先用 `in` 检查，或者用 try/except 捕获 `ValueError`。要删除所有匹配项，不能用循环直接 `remove`，因为删除会改变列表长度导致索引错乱，安全做法是用列表推导式重新生成。

```python
nums = [1, 2, 3, 2, 4, 2]
# 删除所有 2
nums = [x for x in nums if x != 2]
print(nums)               # [1, 3, 4]
```

## 4.3.13 列表按索引弹出元素

`pop([index])` 删除并返回指定位置的元素。省略 index 时默认弹出末尾元素，这是 O(1) 操作。指定 index 时，该位置之后的所有元素前移，是 O(n) 操作。`pop` 是列表方法中少数有返回值的，常用于取出并处理元素的场景。

```python
stack = [10, 20, 30, 40]
last = stack.pop()
print(last, stack)        # 40 [10, 20, 30]

second = stack.pop(1)
print(second, stack)      # 20 [10, 30]
```

`pop()` 与 `del` 的区别在于 `pop` 返回被删除的元素，`del` 只删除不返回。需要用到被删除值时用 `pop`，只需删除时用 `del` 或 `remove`。对空列表调用 `pop` 会抛 `IndexError`，使用前应确认列表非空。

## 4.3.14 列表清空所有元素

`clear()` 删除列表中的所有元素，使其变为空列表，但保留列表对象本身。清空后原列表对象的标识不变，所有引用该对象的变量都会看到空列表。`clear()` 是就地操作，返回 `None`。

```python
data = [1, 2, 3, 4, 5]
data.clear()
print(data)               # []
print(len(data))          # 0
```

`clear()` 与 `del data[:]` 效果相同，都清空内容保留对象。与 `data = []` 不同，后者是让变量指向一个新的空列表对象，原列表对象如果还被其他变量引用则不受影响。在需要重用同一个列表对象、同时让所有引用者都看到清空效果时，用 `clear()`。

## 4.3.15 列表查找元素首次出现索引

`index(value, start, end)` 返回列表中第一个等于 value 的元素的索引。start 和 end 是可选参数，限定搜索范围，遵循左闭右开原则。如果找不到目标值，抛出 `ValueError`。该方法只返回第一个匹配项的索引，无法直接获取所有匹配位置。

```python
letters = ["a", "b", "c", "b", "d"]
print(letters.index("b"))       # 1，第一个 b 的位置
print(letters.index("b", 2))    # 3，从索引 2 开始找
print(letters.index("b", 2, 4)) # 3，在索引 2 到 3 范围内找

# 找不到抛异常
# letters.index("z")            # ValueError: 'z' is not in list
```

调用 `index` 前如果不确定值是否存在，可以先 `in` 检查或用 try/except 捕获异常。如果需要找出所有匹配位置的索引，可以用列表推导式：`[i for i, x in enumerate(letters) if x == "b"]`。`index` 是线性扫描，对大列表频繁查找时考虑用字典建立值到索引的映射。

## 4.3.16 列表统计元素出现次数

`count(value)` 返回列表中等于 value 的元素个数，返回整数。如果没有匹配项则返回 0，不会抛异常。`count` 会遍历整个列表，时间复杂度是 O(n)。

```python
nums = [1, 2, 2, 3, 2, 4, 2]
print(nums.count(2))      # 4
print(nums.count(5))      # 0

words = ["go", "stop", "go", "wait", "go"]
print(words.count("go"))  # 3
```

`count` 适合偶尔统计某个值的出现频率。如果要统计列表中所有不同值的出现次数，逐个调用 `count` 效率很低，应该改用 `collections.Counter`，它一次遍历就能统计所有元素的频次。

```python
from collections import Counter
nums = [1, 2, 2, 3, 2, 4, 2]
c = Counter(nums)
print(c)                  # Counter({2: 4, 1: 1, 3: 1, 4: 1})
print(c[2])               # 4
```

## 4.3.17 列表原地排序

`sort(key=None, reverse=False)` 对列表进行原地排序，直接修改原列表，返回 `None`。默认按升序排列。reverse 参数设为 True 时降序排列。key 参数接受一个函数，用于指定排序依据，排序时每个元素先经过 key 函数转换再比较，原元素不变。

```python
nums = [3, 1, 4, 1, 5, 9, 2, 6]
nums.sort()
print(nums)               # [1, 1, 2, 3, 4, 5, 6, 9]

nums.sort(reverse=True)
print(nums)               # [9, 6, 5, 4, 3, 2, 1, 1]

words = ["banana", "apple", "cherry"]
words.sort(key=len)
print(words)              # ['apple', 'banana', 'cherry']

pairs = [(1, 3), (2, 1), (1, 2)]
pairs.sort(key=lambda x: x[1])
print(pairs)              # [(2, 1), (1, 2), (1, 3)]
```

`sort` 与内置函数 `sorted()` 的区别在于：`sort` 是列表方法，原地修改返回 `None`；`sorted()` 接受任何可迭代对象，返回一个新列表，原对象不变。需要保留原顺序时用 `sorted()`，需要原地修改时用 `sort()`。key 函数在每个元素上只调用一次，排序效率有保障。

## 4.3.18 列表原地反转

`reverse()` 将列表中的元素顺序原地反转，第一个变最后一个，最后一个变第一个，返回 `None`。反转后原列表被直接修改，不产生新列表。

```python
nums = [1, 2, 3, 4, 5]
nums.reverse()
print(nums)               # [5, 4, 3, 2, 1]
```

如果希望保留原列表、得到反转后的副本，可以用切片 `nums[::-1]` 或 `list(reversed(nums))`。`reversed()` 返回一个反向迭代器，不立即创建列表，配合 `list()` 才得到列表。`reverse()` 方法适合确实需要就地修改的场景，省去了创建新对象的内存开销。

```python
nums = [1, 2, 3, 4, 5]
reversed_copy = nums[::-1]
print(reversed_copy)      # [5, 4, 3, 2, 1]
print(nums)               # [1, 2, 3, 4, 5]，原列表不变
```

## 4.3.19 列表浅拷贝

列表的浅拷贝创建一个新的列表对象，但内层元素仍是原列表中相同对象的引用。实现浅拷贝有三种等价写法：`list.copy()` 方法、完整切片 `list[:]`、以及 `list()` 构造函数。浅拷贝后修改外层列表不会互相影响，但修改共享的内层可变对象会影响双方。

```python
original = [1, 2, 3]
shallow = original.copy()

shallow.append(4)
print(original)           # [1, 2, 3]，外层不受影响
print(shallow)            # [1, 2, 3, 4]

# 三种等价的浅拷贝写法
a = [1, 2, 3]
b = a.copy()
c = a[:]
d = list(a)
print(a == b == c == d)   # True
```

`b = a` 只是引用赋值，两个名字指向同一个列表对象，修改任一方另一方都变，这并非拷贝。要复制列表必须显式调用上述三种写法之一。当列表只包含数字、字符串等不可变元素时，浅拷贝就足够，因为不可变对象无法被修改，不存在共享风险。

## 4.3.20 列表的增量赋值

`+=` 增量赋值作用于列表时，底层调用 `__iadd__` 方法，行为等同于 `extend()`，把右侧可迭代对象的元素就地追加到原列表末尾，不创建新列表对象。原列表对象的身份保持不变，所有引用该对象的变量都能看到追加后的结果。

```python
a = [1, 2, 3]
b = a
a += [4, 5]
print(a)                  # [1, 2, 3, 4, 5]
print(b)                  # [1, 2, 3, 4, 5]，b 与 a 指向同一对象，同步变化
print(a is b)             # True
```

`+=` 与 `+` 的关键区别在于：`+=` 就地修改原对象，`+` 创建并返回新对象。`a = a + [4, 5]` 会生成一个新列表再绑定到 a，原对象不受影响，b 仍指向旧的 `[1, 2, 3]`。在函数内部对传入的列表参数使用 `+=` 会修改调用方的列表，使用 `+` 则不会，这一点在编写函数时要特别注意。

## 4.3.21 列表的重复赋值

`*=` 增量赋值作用于列表时，行为与 `+=` 不同。列表的 `__imul__` 方法会重新生成一个新的列表对象（内容是原列表重复 n 次），然后把这个新对象赋值给原变量。这意味着 `*=` 之后变量指向的对象身份发生了变化，原对象不再被引用。

```python
a = [1, 2]
b = a
a *= 3
print(a)                  # [1, 2, 1, 2, 1, 2]
print(b)                  # [1, 2]，b 仍指向原对象
print(a is b)             # False，a 指向了新对象
```

这个行为与 `+=` 形成对比：`+=` 真正就地在原对象上扩展，`*=` 虽然写作增量赋值，实际却生成了新对象。理解这一差异有助于避免在多变量引用同一列表时产生意外。如果确实需要就地重复，可以先用 `extend` 配合乘法生成再追加。

## 4.3.22 列表作为栈使用

栈是一种后进先出（LIFO）的数据结构，列表天然适合充当栈。用 `append()` 把元素压入栈顶，用 `pop()` 弹出栈顶元素，两个操作都是 O(1)，效率很高。栈在撤销操作、括号匹配、深度优先搜索等场景中广泛应用。

```python
stack = []
stack.append("step1")
stack.append("step2")
stack.append("step3")
print(stack)              # ['step1', 'step2', 'step3']

print(stack.pop())        # step3，最后压入的先弹出
print(stack.pop())        # step2
print(stack)              # ['step1']
```

用列表实现栈时，压栈和出栈都在列表尾部进行，无需移动其他元素，性能理想。需要注意对空栈调用 `pop` 会抛 `IndexError`，使用前应判断栈是否为空。栈的大小没有上限，受限于可用内存。

## 4.3.23 列表作为队列使用

队列是一种先进先出（FIFO）的数据结构。用列表实现队列时，`append()` 在尾部入队，`pop(0)` 从头部出队。然而 `pop(0)` 是 O(n) 操作，每次出队都要把后面所有元素前移，数据量大时性能很差。

```python
queue = []
queue.append("task1")
queue.append("task2")
queue.append("task3")

print(queue.pop(0))       # task1，最先入队的先出
print(queue.pop(0))       # task2
print(queue)              # ['task3']
```

::: note 队列的正确选择
当需要高效的队列操作时，应该使用 `collections.deque`。它在两端的追加和弹出都是 O(1)，是 Python 社区处理队列场景的标准做法。`deque.popleft()` 对应列表的 `pop(0)`，但效率高得多，数据量大时差异显著。
:::

```python
from collections import deque
queue = deque(["task1", "task2", "task3"])
queue.append("task4")
print(queue.popleft())    # task1，O(1) 出队
print(queue)              # deque(['task2', 'task3', 'task4'])
```

## 4.3.24 列表推导式基本形式

列表推导式是用一行表达式生成列表的语法糖，基本形式是 `[expr for item in iterable]`。它遍历可迭代对象的每个元素，对每个元素应用表达式 expr，把结果收集成新列表。相比等价的 for 循环，推导式更简洁，执行效率也略高。

```python
# 生成 0 到 4 的平方
squares = [x ** 2 for x in range(5)]
print(squares)            # [0, 1, 4, 9, 16]

# 字符串转大写
words = ["hello", "world"]
upper = [w.upper() for w in words]
print(upper)              # ['HELLO', 'WORLD']
```

推导式的表达式部分可以是任意合法的 Python 表达式，包括函数调用、算术运算、方法调用等。当逻辑简单时推导式可读性极佳，一旦逻辑复杂到需要多行解释，应该改回普通 for 循环，代码清晰比简洁更重要。

## 4.3.25 列表推导式带条件过滤

推导式可以在循环后加上 `if` 条件，对元素进行过滤，只有满足条件的元素才会进入结果列表。语法是 `[expr for item in iterable if condition]`。条件表达式在每次循环时求值，为 True 时保留该元素经过 expr 处理的结果。

```python
nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# 筛选偶数
evens = [x for x in nums if x % 2 == 0]
print(evens)              # [2, 4, 6, 8, 10]

# 筛选并转换
doubled_evens = [x * 2 for x in nums if x % 2 == 0]
print(doubled_evens)      # [4, 8, 12, 16, 20]
```

这里的 `if` 是过滤条件，位于 for 之后。还有一种 `if-else` 写法位于表达式部分，用于条件选择而非过滤，两者位置不同含义也不同。`[x if x > 0 else 0 for x in nums]` 会保留所有元素，把负数替换为 0，而 `[x for x in nums if x > 0]` 只保留正数。

## 4.3.26 列表推导式多重循环

推导式支持多个 for 子句，实现多重循环。语法是 `[expr for i in iter1 for j in iter2]`，等价于嵌套的 for 循环，外层循环在前，内层循环在后。每个 for 子句都可以带自己的 if 条件。

```python
# 笛卡尔积
pairs = [(x, y) for x in [1, 2] for y in ["a", "b"]]
print(pairs)              # [(1, 'a'), (1, 'b'), (2, 'a'), (2, 'b')]

# 等价的嵌套循环
pairs2 = []
for x in [1, 2]:
    for y in ["a", "b"]:
        pairs2.append((x, y))
print(pairs == pairs2)    # True

# 带条件的多重循环
result = [x * y for x in [1, 2, 3] for y in [1, 2, 3] if x != y]
print(result)             # [2, 3, 2, 6, 3, 6]
```

多重循环推导式虽然能压缩代码，但层数过多会严重损害可读性。一般建议最多两层，超过两层时改用显式嵌套循环更清晰。阅读多重循环推导式时，从左到右对应从外到内的循环层次，这一顺序与普通嵌套 for 循环一致。

## 4.3.27 嵌套列表的创建与索引访问

列表的元素可以是另一个列表，构成二维或多维结构。访问嵌套元素需要连续索引，`matrix[row][col]` 先取第 row 行，再取该行的第 col 列。这种结构常用于表示矩阵、表格、棋盘等二维数据。

```python
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]
print(matrix[0])          # [1, 2, 3]，第一行
print(matrix[1][2])       # 6，第二行第三列
print(matrix[2][0])       # 7，第三行第一列

# 修改某个元素
matrix[1][1] = 50
print(matrix[1])          # [4, 50, 6]
```

构造嵌套列表时有一个常见陷阱。`[[0] * 3] * 3` 看似生成了 3×3 的零矩阵，实际三行是同一个列表对象的引用，修改一行其他行也跟着变。正确写法是用推导式让每行独立创建。

```python
bad = [[0] * 3] * 3
bad[0][0] = 1
print(bad)                # [[1, 0, 0], [1, 0, 0], [1, 0, 0]]，三行都被改了

good = [[0] * 3 for _ in range(3)]
good[0][0] = 1
print(good)               # [[1, 0, 0], [0, 0, 0], [0, 0, 0]]，只有第一行变
```

`[0] * 3` 本身是安全的，因为 0 是不可变对象，三个位置指向同一个整数没有副作用。问题出在外层 `* 3` 把同一个内层列表复制了三份引用。推导式每次迭代都执行一次 `[0] * 3`，生成独立的内层列表，从而避免了引用共享。

## 4.3.28 列表的浅拷贝陷阱

浅拷贝只复制列表的外层结构，内层元素仍是原列表中相同对象的引用。当列表包含可变对象（如嵌套列表、字典）时，浅拷贝后的两个列表会通过共享的内层对象相互影响。这是初学者最容易踩到的陷阱之一。

```python
original = [[1, 2], [3, 4]]
shallow = original.copy()

# 修改外层：互不影响
shallow.append([5, 6])
print(original)           # [[1, 2], [3, 4]]，外层追加不影响 original
print(shallow)            # [[1, 2], [3, 4], [5, 6]]

# 修改内层：互相影响
shallow[0].append(99)
print(original)           # [[1, 2, 99], [3, 4]]，内层被共享，original 也变了
print(shallow)            # [[1, 2, 99], [3, 4], [5, 6]]
```

要彻底隔离所有层级，需要使用深拷贝。`copy.deepcopy()` 递归复制整个对象树，包括所有嵌套的可变对象，得到一个完全独立的副本。深拷贝代价较高，能用浅拷贝解决就不要用深拷贝。当列表只含数字、字符串等不可变元素时，浅拷贝就足够安全。

```python
import copy
original = [[1, 2], [3, 4]]
deep = copy.deepcopy(original)
deep[0].append(99)
print(original)           # [[1, 2], [3, 4]]，深拷贝完全独立
print(deep)               # [[1, 2, 99], [3, 4]]
```

## 4.3.29 列表支持 + 与 * 运算符

`+` 运算符把两个列表拼接成一个新列表，`*` 运算符把列表重复若干次生成新列表。两者都返回新列表，不修改原列表。`+` 两边必须都是列表，列表与整数相加会抛 `TypeError`。

```python
a = [1, 2]
b = [3, 4]
c = a + b
print(c)                  # [1, 2, 3, 4]
print(a)                  # [1, 2]，原列表不变

repeated = [0] * 4
print(repeated)           # [0, 0, 0, 0]

pattern = [1, 2] * 3
print(pattern)            # [1, 2, 1, 2, 1, 2]
```

`+` 创建新列表需要拷贝两个操作数的所有元素，频繁拼接时效率不高。如果只是把一个可迭代对象追加到列表末尾，用 `extend()` 或 `+=` 就地修改更高效。`*` 运算符在初始化定长列表时很方便，但用于嵌套可变对象时要警惕引用共享问题，正如前文嵌套列表陷阱所述。

## 4.3.30 列表的 __add__ 与 __iadd__ 底层行为区分

`+` 运算符对应列表的 `__add__` 方法，`+=` 运算符对应 `__iadd__` 方法。两者的底层行为有本质区别：`__add__` 总是创建并返回一个全新的列表对象，原列表不受影响；`__iadd__` 就地在原列表上扩展，返回原列表对象本身。这一差异在多变量引用同一列表时表现得很明显。

```python
a = [1, 2, 3]
b = a
a = a + [4]              # __add__：生成新列表，绑定到 a
print(a)                 # [1, 2, 3, 4]
print(b)                 # [1, 2, 3]，b 仍指向原对象
print(a is b)            # False

a = [1, 2, 3]
b = a
a += [4]                 # __iadd__：就地扩展原对象
print(a)                 # [1, 2, 3, 4]
print(b)                 # [1, 2, 3, 4]，b 与 a 同一对象，同步变化
print(a is b)            # True
```

对于不可变类型如元组和字符串，`__iadd__` 不存在，`+=` 会回退到 `__add__`，即创建新对象再重新绑定。这就是为什么对字符串执行 `+=` 总是生成新字符串对象。列表因为可变，定义了 `__iadd__` 来支持就地扩展，这也是 `+=` 比 `+` 在列表上更高效的原因。

## 4.3.31 列表的可变性对 += 操作的影响

由于列表是可变对象并且定义了 `__iadd__`，`+=` 会直接修改原列表对象。这意味着在函数内部对传入的列表参数使用 `+=`，会改变调用方传进来的列表，这种副作用常常出乎意料。如果不想修改原列表，应该用 `+` 创建新列表，或者先拷贝再扩展。

```python
def add_items(lst, items):
    lst += items          # 就地修改，影响调用方的列表
    return lst

data = [1, 2, 3]
add_items(data, [4, 5])
print(data)               # [1, 2, 3, 4, 5]，原列表被修改了

def add_items_safe(lst, items):
    lst = lst + items     # 创建新列表，不影响调用方
    return lst

data = [1, 2, 3]
add_items_safe(data, [4, 5])
print(data)               # [1, 2, 3]，原列表不受影响
```

::: note 可变默认参数的陷阱
定义函数时把可变对象作为默认参数值也会触发类似问题。`def f(lst=[])` 中的默认列表在函数定义时只创建一次，后续所有调用共享同一个列表对象。如果函数内部用 `+=` 或 `append` 修改了这个默认列表，下次调用的默认值就不再是空列表。正确做法是用 `None` 作为默认值，在函数内部判断后新建列表。
:::

```python
# 错误写法：默认列表被共享
def append_to(lst=[]):
    lst.append(1)
    return lst

print(append_to())        # [1]
print(append_to())        # [1, 1]，默认列表累积了上次的修改

# 正确写法
def append_to_safe(lst=None):
    if lst is None:
        lst = []
    lst.append(1)
    return lst

print(append_to_safe())   # [1]
print(append_to_safe())   # [1]，每次都是新列表
```

理解列表的可变性以及 `+=` 的就地修改行为，是编写可靠 Python 代码的关键。在涉及函数参数传递和默认值时，时刻留意可变对象可能带来的副作用，能避免大量难以排查的 bug。

## 练习题

### 第 1 题：写出下列列表操作的输出结果

阅读下面这段代码，在不运行的情况下写出它的输出。

```python
nums = [3, 1, 4, 1, 5, 9, 2, 6]
nums.append(7)
nums.sort()
print(nums)
nums.reverse()
print(nums)
print(nums.count(1))
```

::: details 参考答案
输出如下。`append(7)` 把 7 加到末尾，`sort()` 原地升序排列，`reverse()` 原地反转，`count(1)` 统计 1 出现的次数。

```
[1, 1, 2, 3, 4, 5, 6, 7, 9]
[9, 7, 6, 5, 4, 3, 2, 1, 1]
2
```

`sort` 和 `reverse` 都是原地修改返回 `None`，不能写成 `nums = nums.sort()`，否则 `nums` 会变成 `None`。
:::

### 第 2 题：用列表方法实现栈结构

请用 `append` 和 `pop` 实现一个简单的栈，依次压入 `"a"`、`"b"`、`"c"`，然后弹出栈顶元素两次，每次打印弹出的值和栈的当前状态。

::: details 参考答案
```python
stack = []
stack.append("a")
stack.append("b")
stack.append("c")
print("压入后:", stack)

top = stack.pop()
print("弹出:", top, "剩余:", stack)

top = stack.pop()
print("弹出:", top, "剩余:", stack)
```

输出：

```
压入后: ['a', 'b', 'c']
弹出: c 剩余: ['a', 'b']
弹出: b 剩余: ['a']
```

`append` 在尾部压入，`pop` 在尾部弹出，两个操作都是 O(1)，列表天然适合充当栈。栈是后进先出结构，最后压入的 `c` 最先弹出。
:::

### 第 3 题：用列表推导式生成平方数表并过滤

请用列表推导式生成 1 到 20 中所有奇数的平方，并打印结果。

::: details 参考答案
```python
squares = [x ** 2 for x in range(1, 21) if x % 2 == 1]
print(squares)
```

输出 `[1, 9, 25, 49, 81, 121, 169, 225, 289, 361]`。

推导式把循环、条件、表达式压缩到一行：`for x in range(1, 21)` 遍历，`if x % 2 == 1` 过滤奇数，`x ** 2` 计算平方。相比等价的 for 循环写法，推导式更简洁，执行效率也略高。
:::

### 第 4 题：项目练习题（命令行任务管理器）

命令行任务管理器需要一个 `add_task` 函数，向任务列表追加新任务。任务用字典表示，包含 `name` 和 `done` 字段。请实现该函数，并演示连续添加三个任务后列表的状态。注意避免可变默认参数陷阱。

::: details 参考答案
```python
def add_task(tasks, name):
    tasks.append({"name": name, "done": False})
    return tasks


# 注意：不要用 def add_task(tasks=[], name): 这种可变默认参数
# 应该在外部维护任务列表
tasks = []
add_task(tasks, "写文档")
add_task(tasks, "评审代码")
add_task(tasks, "修复 Bug")

print(tasks)
```

输出：

```
[{'name': '写文档', 'done': False}, {'name': '评审代码', 'done': False}, {'name': '修复 Bug', 'done': False}]
```

任务列表在外部创建并传入函数，避免可变默认参数在多次调用间共享同一对象的陷阱。`append` 把字典作为单个元素追加，列表存储任务对象的引用，后续修改某个任务的状态会反映到列表中。
:::

## 常见错误

**错误 1 · 可变默认参数在多次调用间累积**

原因:函数定义时 `def f(lst=[])` 的默认列表只创建一次，所有未传参的调用共享同一个列表对象。函数内部用 `append` 或 `+=` 修改该列表后，下次调用的默认值已不是空列表。

解决:用 `None` 作为默认值，函数体内判断 `if lst is None: lst = []`，每次调用都新建列表。

**错误 2 · 浅拷贝后修改内层列表，原列表跟着变**

原因:`list.copy()`、`list[:]`、`list()` 三种写法都只复制外层容器，内层可变对象仍是共享引用。修改切片副本的内层嵌套列表，原列表对应位置同步变化。

解决:需要完全隔离时用 `copy.deepcopy()` 递归复制整个对象树。列表只含数字、字符串等不可变元素时浅拷贝即可，无需深拷贝。

**错误 3 · `nums = nums.sort()` 之后 `nums` 变成 `None`**

原因:`sort()`、`reverse()`、`append()` 等列表方法就地修改并返回 `None`。把返回值重新赋给原变量，会把列表替换为 `None`。

解决:直接调用 `nums.sort()` 不赋值。需要保留原列表并得到排序结果时，用 `sorted(nums)` 返回新列表。

**错误 4 · `pop(0)` 实现队列时性能急剧下降**

原因:列表的 `pop(0)` 删除头部元素后，后续所有元素都要前移，时间复杂度为 O(n)。数据量大时每次出队都引发大规模数据搬运。

解决:改用 `collections.deque`，其 `popleft()` 和 `append()` 在两端都是 O(1)。需要栈结构时列表的 `pop()`（无参数，弹尾部）是 O(1)，无需更换。
