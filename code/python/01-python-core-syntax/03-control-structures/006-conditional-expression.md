---
title: 3.6 条件表达式（三元运算符）
sidebar:
  order: 6
---
# 3.6 条件表达式（三元运算符）


条件表达式是 Python 中用于在一行内完成条件判断并返回结果的语法结构，源自 C 语言家族的三元运算符，但写法上更接近自然语言。它适合在简单的二选一场景中使用，能让代码更紧凑，避免冗长的 `if-else` 语句。本节将系统讲解条件表达式的语法、返回值规则、优先级与结合性，以及在赋值、输出等常见场景中的使用方式。

## 3.6.1 条件表达式语法

条件表达式的语法形式是 `表达式1 if 条件 else 表达式2`。三个部分按这个顺序书写，先写条件成立时返回的表达式，再写 `if` 和判断条件，最后写 `else` 和条件不成立时返回的表达式。这种写法读起来接近自然语言，例如 `a if a > b else b` 可以直接读作「如果 a 大于 b 取 a，否则取 b」。

下面是一个比较两个数大小的例子。

```python
a = 10
b = 20
larger = a if a > b else b
print(larger)  # 20
```

条件 `a > b` 不成立，所以返回 `else` 后面的 `b`，`larger` 被赋值为 20。等价的 `if-else` 语句写法如下。

```python
a = 10
b = 20
if a > b:
    larger = a
else:
    larger = b
print(larger)  # 20
```

两者效果完全相同，但条件表达式只占一行，适合简单赋值场景。当分支逻辑复杂或包含多条语句时，应该使用完整的 `if-else` 结构，强行塞进一行反而降低可读性。

## 3.6.2 条件表达式的返回值

条件表达式是一个**表达式**而非语句，它有返回值，可以直接用在需要值的位置。返回值的规则很直接，条件为真时返回 `if` 前面的表达式结果，条件为假时返回 `else` 后面的表达式结果。两个表达式都会被求值之前的类型保留下来，不会做强制类型转换。

下面这个例子展示不同类型的返回值。

```python
score = 85
result = "及格" if score >= 60 else "不及格"
print(result)  # 及格

count = 3
item = "apple" if count == 1 else "apples"
print(item)  # apples
```

第一个例子中 `score >= 60` 为真，返回字符串 `"及格"`。第二个例子中 `count == 1` 为假，返回字符串 `"apples"`。返回值的类型与所选表达式一致，条件表达式本身不会改变类型。

条件表达式也可以返回数字、布尔值、甚至函数调用结果。

```python
x = -5
abs_x = x if x >= 0 else -x
print(abs_x)  # 5

flag = True
value = 1 if flag else 0
print(value)  # 1
```

需要特别说明的是，条件表达式只会计算被选中那一支的表达式，另一支不会求值。这一点在表达式有副作用时很重要，例如函数调用。

```python
def log_call(name):
    print(f"调用了 {name}")
    return name

debug = False
result = log_call("A") if debug else log_call("B")
print(result)
```

输出如下。

```
调用了 B
B
```

`debug` 为假，只调用了 `log_call("B")`，`log_call("A")` 不会被调用。这与 C 语言三元运算符的短路行为一致，避免了对不需要分支的求值。

## 3.6.3 条件表达式的优先级

条件表达式的优先级在 Python 运算符中处于较低位置，比算术运算符、比较运算符、逻辑运算符都要低，只比 `lambda` 表达式高。这意味着在混合表达式中，其他运算符会先于条件表达式求值，条件表达式通常需要用括号明确范围以避免歧义。

下面通过一个例子说明优先级的影响。

```python
a = 5
b = 10
result = a + b if a > 0 else 0
print(result)  # 15
```

由于条件表达式优先级低于加法，这段代码等价于 `result = (a + b) if (a > 0) else 0`，先算出 `a + b`，再根据条件返回。如果想表达「如果 a 大于 0，返回 a，否则返回 0，再加 b」，需要显式加括号。

```python
a = 5
b = 10
result = (a if a > 0 else 0) + b
print(result)  # 15
```

这里 `a` 为正，`a if a > 0 else 0` 返回 `a` 即 5，再加 `b` 得到 15。括号改变了求值顺序，结果在语义上更清晰。建议在复杂表达式中始终用括号标明条件表达式的范围，避免依赖优先级记忆造成的错误。

条件表达式优先级低于 `or`，意味着 `a or b if cond else c` 会被解析为 `(a or b) if cond else c`。条件表达式优先级高于 `lambda`，意味着 `lambda: a if cond else b` 会被解析为 `lambda: (a if cond else b)`，整个条件表达式作为 `lambda` 的返回值。

## 3.6.4 条件表达式的结合性

条件表达式是**右结合**的，当多个条件表达式连在一起时，解析从右向左进行。这一特性在嵌套使用时尤其重要，决定了多个 `if-else` 的配对方式。

先看一个简单的对比。

```python
x = 5
result1 = x if x > 0 else x if x == 0 else -x
print(result1)  # 5
```

由于右结合，这段代码等价于 `x if x > 0 else (x if x == 0 else -x)`。`x > 0` 为真，返回 `x` 即 5。如果误以为是左结合，可能会理解成 `(x if x > 0 else x) if x == 0 else -x`，结果是 `-x` 即 -5，这就错了。

右结合特性让嵌套条件表达式可以自然地按「先判断外层条件，再判断内层条件」的方式书写，符合从左到右的阅读习惯。下一节会详细展示嵌套用法。

## 3.6.5 条件表达式的嵌套

条件表达式可以嵌套使用，形式为 `a if cond1 else b if cond2 else c`，等价于 `a if cond1 else (b if cond2 else c)`。这种写法常用于三选一或多选一场景，把多层 `if-elif-else` 压缩到一行。

下面是一个根据分数段返回等级的例子。

```python
score = 78
grade = "A" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 else "D"
print(grade)  # C
```

解析顺序是先判断 `score >= 90`，为假则进入 `else` 部分，判断 `score >= 80`，再为假则判断 `score >= 70`。`score` 为 78，前两个条件都不成立，第三个成立，返回 `"C"`。等价的 `if-elif-else` 写法如下。

```python
score = 78
if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "D"
print(grade)  # C
```

嵌套层数不宜过多，超过两层时建议改用 `if-elif-else` 语句，否则可读性会显著下降。下面这种写法虽然语法合法，但难以理解。

```python
# 不推荐：嵌套层数过多
result = "高" if x > 80 else "中高" if x > 60 else "中" if x > 40 else "低" if x > 20 else "极低"
```

::: note 嵌套的可读性
嵌套条件表达式适合二选一或简单的三选一场景。分支较多时，使用 `if-elif-else` 语句或字典映射更清晰，调试也更方便。
:::

## 3.6.6 条件表达式在赋值语句中的使用

条件表达式最常见的用途是给变量赋值，根据条件从两个候选值中选择一个。这种写法比 `if-else` 语句更紧凑，适合简单的赋值分支。

下面是几个典型用法。第一个根据当前小时数选择问候语。

```python
hour = 14
greeting = "上午好" if hour < 12 else "下午好"
print(greeting)  # 下午好
```

第二个根据列表是否为空选择默认值。

```python
data = []
result = data if data else "无数据"
print(result)  # 无数据
```

第三个根据配置标志选择不同的处理方式。

```python
use_cache = True
source = "cache" if use_cache else "database"
print(source)  # cache
```

这些例子都有一个共同特点，赋值右侧的值由条件决定，逻辑简单清晰。当赋值逻辑复杂到需要多行代码或涉及多个变量时，应该改用完整的 `if-else` 语句。

条件表达式还可以用于同时给多个变量赋值，配合元组解包。

```python
a = 5
b = 3
a, b = (b, a) if a > b else (a, b)
print(a, b)  # 3 5
```

`a > b` 为真，返回 `(b, a)`，解包后 `a` 变成 3，`b` 变成 5，实现了条件交换。这种写法虽然简洁，但在生产代码中建议直接用普通 `if-else`，让意图更明确。

## 3.6.7 条件表达式在 print 中的直接使用

条件表达式可以直接作为 `print()` 的参数，根据条件输出不同的内容。这种方式避免了先定义一个临时变量再打印的繁琐步骤，适合简单的输出分支。

下面是一个根据成绩是否及格输出不同提示的例子。

```python
score = 58
print("通过" if score >= 60 else "未通过")  # 未通过
```

条件不成立，`print` 接收到的参数是 `"未通过"`，直接输出。等价的 `if-else` 写法如下。

```python
score = 58
if score >= 60:
    print("通过")
else:
    print("未通过")
```

两者效果相同，条件表达式版本更紧凑。这种用法在调试输出、状态显示等场景中很常见。

再看一个根据数值正负输出描述的例子。

```python
value = -3
print("正数" if value > 0 else "零" if value == 0 else "负数")  # 负数
```

这里使用了嵌套条件表达式处理三种情况。`value > 0` 为假，进入 `else` 分支，`value == 0` 也为假，最终返回 `"负数"`。嵌套写法在一行内完成判断，但当情况复杂时拆成 `if-elif-else` 更易读。

```python
value = -3
if value > 0:
    print("正数")
elif value == 0:
    print("零")
else:
    print("负数")
```

## 3.6.8 条件表达式与列表推导式结合

条件表达式常与**列表推导式**配合使用，在推导式中根据每个元素的条件返回不同的值。这种结合在数据转换中很实用，例如根据数值正负映射为不同标签。列表推导式的具体语法将在后续章节展开，此处先列出相关名称，了解两者可以配合使用即可。

## 3.6.9 条件表达式与 lambda 函数结合

条件表达式也可以与 **lambda** 函数结合，让匿名函数内部包含简单的条件判断。这种写法适合需要根据输入返回不同结果的简短函数场景。lambda 函数的详细语法将在函数章节展开，此处仅列出名称，便于后续对照学习。

## 练习题

### 第 1 题：写出下列条件表达式的值

阅读下面这段代码，在不运行的情况下写出 `result` 的值。

```python
x = -7
result = x if x >= 0 else -x
print(result)
```

::: details 参考答案
输出 `7`。`x >= 0` 为假，条件表达式返回 `else` 后面的 `-x`，即 7。这正是用条件表达式实现绝对值函数的典型写法。

由于条件表达式只计算被选中那一支，`-x` 只在条件为假时才会求值。
:::

### 第 2 题：用条件表达式根据分数返回等级

请用条件表达式根据变量 `score` 的值返回等级字符串：大于等于 90 返回 `"A"`，大于等于 60 返回 `"B"`，否则返回 `"C"`。

::: details 参考答案
```python
score = 78
grade = "A" if score >= 90 else "B" if score >= 60 else "C"
print(grade)
```

输出 `B`。嵌套条件表达式按从左到右的顺序判断：`score >= 90` 为假，进入 `else` 部分判断 `score >= 60` 为真，返回 `"B"`。

嵌套层数不宜过多，超过两层时改用 `if-elif-else` 语句更清晰。
:::

### 第 3 题：用条件表达式为字典设置默认值

给定变量 `config` 可能是字典或 `None`。请用条件表达式让 `settings` 在 `config` 为 `None` 时使用默认字典 `{"debug": False}`，否则使用 `config` 本身。

::: details 参考答案
```python
config = None
settings = config if config is not None else {"debug": False}
print(settings)
```

输出 `{'debug': False}`。条件表达式让默认值设置在一行内完成，避免了 `if-else` 语句的多行写法。

判断 `None` 必须用 `is not None`，这是 PEP 8 规范的明确要求，能避免把空字典等假值误判为 `None`。
:::

### 第 4 题：项目练习题（命令行任务管理器）

命令行任务管理器中每个任务有 `done` 字段表示完成状态。请用条件表达式在打印任务列表时，根据 `done` 的值在任务名后追加 `[完成]` 或 `[待办]` 标记。

::: details 参考答案
```python
tasks = [
    {"name": "写文档", "done": True},
    {"name": "评审代码", "done": False},
]

for task in tasks:
    mark = "[完成]" if task["done"] else "[待办]"
    print(f"{task['name']} {mark}")
```

输出：

```
写文档 [完成]
评审代码 [待办]
```

条件表达式让状态标记在一行内完成选择，避免在循环体中写 `if-else` 语句。这种紧凑写法适合简单的二选一输出场景，循环体保持简洁。
:::

## 常见错误

**错误 1 · `a + b if a > 0 else 0 的运算结果与预期不符`**

原因:条件表达式优先级低于算术运算符，`a + b if a > 0 else 0` 被解析为 `(a + b) if (a > 0) else 0`，而非 `a + (b if a > 0 else 0)`。

解决:在复杂表达式中用括号显式标明条件表达式的范围，避免依赖优先级记忆。

**错误 2 · `嵌套条件表达式可读性急剧下降`**

原因:多层嵌套的条件表达式写在一行，如 `a if cond1 else b if cond2 else c if cond3 else d`，阅读时需要从右向左解析，难以理解。

解决:嵌套超过两层时改用 `if-elif-else` 语句，每层分支独占一行。

**错误 3 · `用 == 判断 None 在条件表达式中行为异常`**

原因:`config if config == None else default` 中，如果 `config` 所属类重写了 `__eq__`，比较结果可能不符合预期。

解决:判断 `None` 使用 `is None` 或 `is not None`，写为 `config if config is not None else default`。
