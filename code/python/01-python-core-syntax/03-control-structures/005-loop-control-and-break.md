---
title: 3.5 循环控制与中断
sidebar:
  order: 5
---
# 3.5 循环控制与中断

循环结构在执行过程中往往需要根据中途出现的条件改变原本的迭代流程，例如找到目标后立即停止搜索、跳过某些不需要处理的元素、或保留一个尚未实现的循环体占位。Python 提供了 `break`、`continue`、`pass` 三个控制语句以及 `else` 子句来处理这些场景。本节系统讲解这四种机制的工作原理和使用方式，帮助你在循环中精确控制执行流程。

## 3.5.1 break 语句：终止所在循环

`break` 语句的作用是立即终止它所在的那一层循环，程序会跳出整个循环体，继续执行循环之后的下一条语句。无论循环条件是否仍然成立，也无论 `for` 还剩多少元素没有遍历，遇到 `break` 就会立刻结束循环。`break` 通常配合 `if` 判断使用，在满足某个条件时主动退出，而不是等循环条件自然失效。

下面是一个查找目标元素的例子，找到第一个等于 7 的数后立即退出循环，剩余的元素不再处理。

```python
numbers = [3, 1, 7, 9, 2, 7, 5]
target = 7
found_index = -1

for i, value in enumerate(numbers):
    if value == target:
        found_index = i
        break

print(f"找到目标，位置在 {found_index}")  # 找到目标，位置在 2
```

执行到 `i=2` 时 `value` 等于 7，条件成立，先把索引保存到 `found_index`，然后 `break` 跳出循环。即使后面还有第二个 7 也不会被处理，循环结束后打印的结果是位置 2。如果不写 `break`，循环会把所有元素都遍历一遍，`found_index` 最终保存的是最后一个 7 的位置，这与查找第一个目标的需求不符。

## 3.5.2 break 在嵌套循环中的作用范围

当多层循环嵌套时，`break` 只作用于它直接所在的那一层循环，外层循环不受影响。这是初学者容易混淆的地方，看到 `break` 就以为整个嵌套结构全部退出，`break` 只跳出最内层。如果需要从多层嵌套中一次性退出，需要借助标志位、函数 `return`、或异常机制来配合实现。

下面的例子用双重循环在二维表中查找目标值，找到后内层循环退出，外层循环继续下一行。

```python
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]
target = 5
result = None

for row_idx, row in enumerate(matrix):
    for col_idx, value in enumerate(row):
        if value == target:
            result = (row_idx, col_idx)
            break
    # 这里的 break 只退出内层，外层 for 会继续执行
    print(f"已扫描第 {row_idx} 行")

print(f"目标位置: {result}")  # 目标位置: (1, 1)
```

内层 `break` 在第 1 行第 1 列找到 5 时触发，退出内层循环，但外层循环还会继续扫描第 2 行。如果希望找到后立刻停止所有扫描，可以引入一个标志变量，在外层循环条件中检查它。

```python
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]
target = 5
result = None
found = False

for row_idx, row in enumerate(matrix):
    for col_idx, value in enumerate(row):
        if value == target:
            result = (row_idx, col_idx)
            found = True
            break
    if found:
        break

print(f"目标位置: {result}")  # 目标位置: (1, 1)
```

引入 `found` 标志后，内层 `break` 退出后立即在外层检查 `found`，成立则再次 `break` 退出外层。这种写法在多层嵌套中很常见，也是处理这类需求最直接的方式。

## 3.5.3 continue 语句：跳过本次循环剩余语句

`continue` 语句的作用是跳过当前这一次迭代中剩余的语句，直接进入下一次循环判断。与 `break` 不同，`continue` 不会终止整个循环，只是提前结束本次迭代。在 `for` 循环中，`continue` 触发后会立刻去取下一个元素；在 `while` 循环中，`continue` 触发后会重新检查循环条件。

`continue` 常用于过滤场景，遇到不符合条件的元素就跳过，只处理满足条件的数据。下面的例子跳过列表中的所有负数，只对非负数求和。

```python
values = [10, -5, 20, -3, 15, -8, 25]
total = 0

for v in values:
    if v < 0:
        continue
    total += v

print(f"非负数之和: {total}")  # 非负数之和: 70
```

当 `v` 为负数时 `continue` 触发，跳过 `total += v` 这一行，直接处理下一个元素。把过滤逻辑写在循环开头，能让后续的累加代码保持简洁，不需要再嵌套一层 `if`。这种结构在数据处理中很常见，遇到异常数据、缺失值、不合法输入时跳过处理。

## 3.5.4 continue 在 for 和 while 中的使用

`continue` 在 `for` 和 `while` 两种循环中的行为略有差异。`for` 循环的迭代由可迭代对象驱动，`continue` 触发后会自动取出下一个元素，迭代变量自动更新。`while` 循环的迭代由条件判断驱动，`continue` 触发后会回到条件判断处，此时循环变量需要已经在循环体中更新过，否则容易造成死循环。

先看 `for` 中的 `continue`，遍历字符串跳过所有元音字母。

```python
text = "Hello World"
result = ""

for ch in text:
    if ch.lower() in "aeiou":
        continue
    result += ch

print(result)  # Hll Wrld
```

`for` 循环自动从字符串取下一个字符，`continue` 只需要跳过添加操作即可。

再看 `while` 中的 `continue`，打印 1 到 10 中所有奇数。

```python
i = 0
while i < 10:
    i += 1
    if i % 2 == 0:
        continue
    print(i)
```

输出依次是 1、3、5、7、9。这里有一个关键细节，`i += 1` 必须写在 `if` 判断之前。如果把 `i += 1` 放在 `continue` 之后，当 `i` 为偶数时 `continue` 触发，`i += 1` 这一行不会执行，循环条件 `i < 10` 永远成立，程序陷入死循环。在 `while` 中使用 `continue` 时要注意计数器的更新位置。

## 3.5.5 pass 语句：空操作占位

`pass` 是一个空操作语句，执行时什么都不做，程序继续往下运行。它的主要用途是保持语法结构的完整性。Python 要求 `if`、`for`、`while`、函数定义、类定义等结构必须有缩进的语句体，如果暂时不写实现，又不想留下语法错误，就用 `pass` 占位。

在循环场景中，`pass` 常用于先搭好循环框架，循环体之后再补充实现。

```python
for i in range(5):
    pass  # 循环体暂未实现，先占位
```

这段代码能正常执行，循环五次什么也不做。在开发初期先写好整体结构，逐步填充实现细节，`pass` 让这种增量开发方式成为可能。

`pass` 也常用于 `if` 分支中，当某个分支暂时不需要处理时占位。

```python
value = 0
if value > 0:
    print("正数")
elif value < 0:
    print("负数")
else:
    pass  # 零的情况暂不处理
```

如果不写 `pass` 而是留空，解释器会报 `IndentationError`。`pass` 在这里起到结构填充的作用，让代码在语法上合法，同时明确表示这个分支是有意留空的。

## 3.5.6 else 子句与循环配合

Python 的循环有一个比较特殊的语法，`for` 和 `while` 都可以接一个 `else` 子句。`else` 子句写在循环体之后，与循环语句对齐缩进，循环结束时由解释器根据情况决定是否执行。这种写法在大多数语言中不存在，是 Python 的特有语法。

基本结构如下。

```python
for item in iterable:
    # 循环体
    if condition:
        break
else:
    # 循环正常结束时执行
    pass
```

`while` 循环的写法类似。

```python
while condition:
    # 循环体
    if stop_condition:
        break
else:
    # 循环正常结束时执行
    pass
```

`else` 子句常用于循环后的收尾处理，例如搜索失败时给出提示。下面是一个查找质数的例子，循环结束后根据是否触发 `break` 决定输出。

```python
n = 17
for i in range(2, n):
    if n % i == 0:
        print(f"{n} 不是质数，能被 {i} 整除")
        break
else:
    print(f"{n} 是质数")  # 17 是质数
```

如果 `n` 能被某个 `i` 整除，说明 `n` 不是质数，`break` 触发退出循环，`else` 不执行。如果整个循环走完都没有触发 `break`，说明没有任何 `i` 能整除 `n`，`n` 是质数，`else` 执行。这种写法避免了引入额外的标志变量，逻辑更紧凑。

## 3.5.7 else 子句的执行条件

`else` 子句的执行规则需要明确记忆：当循环**正常结束**时执行，也就是循环条件自然变为假，或可迭代对象被完整遍历完，并且整个过程中没有触发 `break`。只要循环是以这种方式结束的，`else` 就会执行。

下面这个例子展示 `else` 在循环正常结束时的执行情况。

```python
for i in range(3):
    print(f"当前 i = {i}")
else:
    print("循环正常结束，else 执行")
```

输出如下。

```
当前 i = 0
当前 i = 1
当前 i = 2
循环正常结束，else 执行
```

循环把 0、1、2 全部遍历完，没有遇到 `break`，所以 `else` 执行。`while` 循环也是同样规则。

```python
count = 0
while count < 3:
    print(f"count = {count}")
    count += 1
else:
    print("while 循环正常结束")
```

输出如下。

```
count = 0
count = 1
count = 2
while 循环正常结束
```

`count` 从 0 增长到 3 时条件 `count < 3` 变为假，循环自然结束，`else` 执行。

## 3.5.8 else 子句在循环中不执行的条件

`else` 子句不执行的情况只有一种，循环过程中触发了 `break`。一旦 `break` 执行，循环立即终止，`else` 子句被跳过。这一规则同时适用于 `for` 和 `while`。

对比下面两段代码就能看出区别。先看不触发 `break` 的情况。

```python
for i in range(5):
    if i == 10:  # 永远不会成立
        break
else:
    print("else 执行")  # 这一行会打印
```

再看触发 `break` 的情况。

```python
for i in range(5):
    if i == 3:
        break
else:
    print("else 执行")  # 这一行不会打印
```

第一段代码条件 `i == 10` 始终不成立，循环正常走完，`else` 执行。第二段代码在 `i == 3` 时触发 `break`，循环提前结束，`else` 被跳过。`continue` 不会影响 `else` 的执行，因为 `continue` 只是跳过本次迭代，不会提前终止循环。

```python
for i in range(5):
    if i == 3:
        continue
    print(i)
else:
    print("else 执行")  # 这一行会打印
```

输出如下。

```
0
1
2
4
else 执行
```

`continue` 跳过了 `i == 3` 时的打印，但循环依然正常结束，所以 `else` 执行。理解了 `break` 与 `continue` 对 `else` 的不同影响，才能正确使用循环 `else` 子句。

## 3.5.9 无限循环的终止方式

`while True` 形式的循环称为无限循环，循环条件永远为真，自身无法自然结束。终止这种循环的方式是在循环体内部使用 `break` 或 `return`。`break` 退出循环后继续执行循环之后的代码，`return` 则直接结束当前函数，把控制权返回给调用方。

下面是一个使用 `break` 终止无限循环的例子，模拟交互式输入。

```python
while True:
    user_input = input("请输入命令（输入 quit 退出）: ")
    if user_input == "quit":
        print("程序退出")
        break
    print(f"你输入了: {user_input}")

print("循环结束，继续执行后续代码")
```

当用户输入 `quit` 时 `break` 触发，循环终止，程序继续执行 `print("循环结束，继续执行后续代码")`。这种方式适合在循环之后还需要做收尾工作的场景。

如果把这段逻辑封装成函数，可以用 `return` 直接退出。

```python
def interactive_session():
    while True:
        user_input = input("请输入命令（输入 quit 退出）: ")
        if user_input == "quit":
            print("程序退出")
            return
        print(f"你输入了: {user_input}")

interactive_session()
```

`return` 触发后函数立即结束，循环自然随之终止。`return` 适合在函数内部需要提前退出的场景，可以同时返回一个值给调用方。

## 3.5.10 while 循环中的计数器手动控制

`while` 循环的迭代不像 `for` 循环那样自动推进，循环变量需要程序员手动更新。如果忘记更新，或更新逻辑被跳过，循环条件永远成立，就会形成死循环。死循环会占用 CPU 资源不释放，程序看起来卡住不动，是 `while` 循环常见的错误。

正确的写法是确保每次迭代都更新循环变量。下面是一个累加 1 到 100 的例子。

```python
total = 0
i = 1
while i <= 100:
    total += i
    i += 1

print(f"1 到 100 的和: {total}")  # 1 到 100 的和: 5050
```

`i += 1` 在循环体最后执行，确保每次迭代 `i` 都会加 1，当 `i` 超过 100 时条件 `i <= 100` 为假，循环结束。

如果计数器更新语句被意外跳过，就会造成死循环。下面是一个错误示例。

```python
i = 0
total = 0
while i < 10:
    if i % 2 == 0:
        i += 1
        continue
    total += i
    i += 1  # 当 i 为偶数时这行不会执行
```

这段代码逻辑上没有死循环，因为偶数分支里已经更新了 `i`。但如果偶数分支忘记写 `i += 1`，`continue` 跳过后 `i` 始终是 0，循环条件 `i < 10` 永远成立，程序陷入死循环。在 `while` 中使用 `continue` 时要特别小心，确保计数器更新逻辑不会被跳过。

::: note 死循环的应对
如果不小心写出死循环，在命令行运行时按下 `Ctrl + C` 可以强制中断程序。在 IDE 中通常有停止按钮可以终止运行。开发时可以先在小范围数据上测试循环逻辑，确认无误后再处理完整数据。
:::

## 3.5.11 循环控制语句在异常处理中的交互

循环控制语句在异常处理结构中也会出现，涉及的关键字包括 `try`、`except`、`finally`、`raise`。当循环体内抛出异常时，`break`、`continue` 与异常处理机制的交互需要特别注意，例如 `finally` 块在 `continue` 或 `break` 触发时仍会执行。这些内容将在异常处理章节展开讨论，此处先列出相关名称以便后续对照。

## 练习题

### 第 1 题：写出下列代码的输出结果

阅读下面这段循环控制代码，在不运行的情况下写出它的输出。

```python
for i in range(1, 8):
    if i % 3 == 0:
        continue
    if i == 5:
        break
    print(i, end=" ")
```

::: details 参考答案
输出 `1 2 4 `。

`i` 依次取 1、2、3、4、5、6、7。`i=3` 时被 `continue` 跳过不打印；`i=1`、`2`、`4` 正常打印；`i=5` 时触发 `break` 立即退出循环，5 本身不会被打印，后续的 6、7 也不会被处理。
:::

### 第 2 题：用 break 查找第一个大于阈值的元素

给定列表 `data = [3, 7, 2, 9, 4, 11, 6]`，请用 for 循环配合 `break` 找到第一个大于 8 的元素，打印它的值和索引。如果找不到，打印"未找到"。

::: details 参考答案
```python
data = [3, 7, 2, 9, 4, 11, 6]
found_index = -1
found_value = None

for i, value in enumerate(data):
    if value > 8:
        found_index = i
        found_value = value
        break

if found_index != -1:
    print(f"找到: 值={found_value}, 索引={found_index}")
else:
    print("未找到")
```

输出 `找到: 值=9, 索引=3`。找到第一个满足条件的元素后立即 `break`，避免遍历整个列表。用一个标志变量 `found_index` 区分"找到"和"未找到"两种情况。
:::

### 第 3 题：用 for-else 判断一个数是否为质数

请用 for 循环配合 `else` 子句判断数字 17 是否为质数。质数是只能被 1 和自身整除的大于 1 的整数。提示：循环从 2 到 n-1，如果发现能整除就 `break`，`else` 子句在没有 `break` 时执行。

::: details 参考答案
```python
n = 17

for i in range(2, n):
    if n % i == 0:
        print(f"{n} 不是质数，能被 {i} 整除")
        break
else:
    print(f"{n} 是质数")
```

输出 `17 是质数`。循环遍历 2 到 16，没有任何数能整除 17，循环正常结束触发 `else` 子句。`for-else` 结构避免了引入额外的标志变量，逻辑紧凑。
:::

### 第 4 题：项目练习题（命令行任务管理器）

命令行任务管理器的任务列表中每个任务是一个字典，包含 `name` 和 `done` 两个字段。请编写代码查找第一个未完成的任务并打印其名称，使用 `break` 在找到后立即停止遍历。

::: details 参考答案
```python
tasks = [
    {"name": "写文档", "done": True},
    {"name": "评审代码", "done": False},
    {"name": "修复 Bug", "done": False},
]

found = None
for task in tasks:
    if not task["done"]:
        found = task["name"]
        break

if found:
    print("下一个待办任务:", found)
else:
    print("所有任务已完成")
```

输出 `下一个待办任务: 评审代码`。`break` 让循环在找到第一个未完成任务后立即停止，不必遍历整个列表。这是任务管理器中"找出下一个待办"功能的典型实现。
:::

## 常见错误

**错误 1 · `break 只跳出内层循环，外层继续执行`**

原因:`break` 只作用于它直接所在的那一层循环，不影响外层循环。在多层嵌套中误以为 `break` 能一次性退出所有循环。

解决:引入标志变量，内层 `break` 后在外层检查标志并再次 `break`；或把嵌套循环封装成函数，用 `return` 一次性退出。

**错误 2 · `while 中 continue 跳过计数器更新导致死循环`**

原因:`continue` 触发后跳过本次迭代剩余语句，如果计数器更新语句位于 `continue` 之后，循环变量不更新，条件永远成立。

解决:把计数器更新语句放在 `continue` 之前，确保每轮迭代都会执行更新。

**错误 3 · `for-else 的 else 子句在 break 时仍然执行`**

原因:误以为 `else` 子句在循环结束后总是执行。`else` 仅在循环正常结束（未被 `break` 中断）时执行。

解决:确认 `else` 的语义是循环完毕后做的事，仅在没触发 `break` 时执行。如果需要无论是否 break 都执行的逻辑，放到循环外部而非 `else` 块中。
