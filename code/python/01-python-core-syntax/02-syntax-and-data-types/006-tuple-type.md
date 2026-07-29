---
title: 2.6 元组类型
sidebar:
  order: 6
---
# 2.6 元组类型

<span class="chapter-tag">Python核心语法基础</span>

元组是 Python 中另一种有序序列类型，外形与列表相似，但创建后不可修改。如果列表像可随时调整的床位名册，元组更像已封存的病历档案，记录一旦确立就不能再改动。本节将从字面量写法讲起，覆盖元组的索引、拆包、与列表的相互转换、不可变性细节以及命名元组，帮助你理解何时该用元组代替列表。

## 2.6.1 元组字面量

元组字面量用圆括号 `()` 包起来，元素之间用逗号分隔。Python 也允许省略圆括号，直接用逗号分隔的多个值就是一个元组，这种写法在函数返回多值时特别常见：

```python
vitals = (72, 120, 36.5)
print(vitals)               # (72, 120, 36.5)
print(type(vitals))         # <class 'tuple'>

# 圆括号可省略
vitals2 = 72, 120, 36.5
print(vitals2)              # (72, 120, 36.5)
print(vitals == vitals2)    # True
```

省略圆括号的写法叫做**隐式元组**，常用于 `return a, b, c` 这样的多值返回，背后其实就是返回一个元组，调用方再用拆包接收。

## 2.6.2 单元素元组需加逗号

单元素元组必须写成 `(value,)`，结尾那个逗号不可省。`(value)` 只是带括号的表达式，Python 会把它当成普通值而非元组。这一规则源于括号在 Python 中有多重含义：分组、函数调用、元组字面量，单元素时只有逗号才能消歧：

```python
single = (42,)
print(type(single))         # <class 'tuple'>

not_tuple = (42)
print(type(not_tuple))      # <class 'int'>

# 即使没有括号，加逗号也是元组
also_tuple = 42,
print(type(also_tuple))     # <class 'tuple'>
```

::: note 末尾逗号的习惯
多元素元组的末尾逗号可有可无，`(1, 2, 3,)` 与 `(1, 2, 3)` 等价。许多项目约定多元素元组也保留末尾逗号，便于后续追加元素时少改一行，也避免版本控制产生多余的 diff 噪音。
:::

## 2.6.3 空元组 ()

空元组写成 `()` 或调用 `tuple()`，两者等价。空元组用处不多，主要出现在需要返回**无值**的函数中，或作为占位符：

```python
empty1 = ()
empty2 = tuple()
print(len(empty1))          # 0
print(empty1 == empty2)     # True
```

注意空元组 `()` 不需要逗号，这是单元素元组规则的一个例外。因为空元组的括号本身就是元组标识，没有歧义；而单元素时括号可能被当成表达式分组，必须用逗号区分。

## 2.6.4 元组是不可变的有序序列

元组的核心特征是**不可变**。一旦创建，元组的长度和每个位置的元素就固定下来，无法通过索引赋值修改，也无法 append、remove 或 sort。这种限制带来了几个实际优势：不可变意味着元组可以作为字典的键、可以作为集合的元素，而列表不行；不可变还意味着元组在多线程环境下天然安全，无需加锁：

```python
point = (3, 5)
# point[0] = 4              # TypeError: 'tuple' object does not support item assignment
```

医学场景中，元组适合表示一旦确定就不应改动的数据，例如病人 ID 与出生日期的组合 `(patient_id, birth_date)`，封装成元组能避免误改。元组的不可变性也向函数调用方传递一个明确信号：这个值不会被改动，可以放心传递。

## 2.6.5 元组索引和切片

元组的索引和切片语法与列表完全一致，只是返回的新序列也是元组：

```python
patient = ("P001", "张三", 45, "高血压")
print(patient[0])           # P001
print(patient[-1])          # 高血压
print(patient[1:3])         # ('张三', 45)，切片仍是元组
print(patient[::-1])        # ('高血压', 45, '张三', 'P001')，反转
```

索引越界同样抛 `IndexError`，切片越界自动截断。这些行为与列表一致，掌握列表的索引切片就掌握了元组的索引切片，唯一的差异是切片结果类型仍是元组。

## 2.6.6 元组拼接和重复

`+` 拼接两个元组返回新元组，`*` 重复若干次返回新元组。由于元组不可变，这些操作都不会修改原元组：

```python
day_shift = ("张医生", "李医生")
night_shift = ("王医生",)
full = day_shift + night_shift
print(full)                 # ('张医生', '李医生', '王医生')

alert = ("异常",) * 3
print(alert)                # ('异常', '异常', '异常')
```

注意单元素元组 `("王医生",)` 必须加逗号，否则 `("王医生")` 只是个字符串，与元组拼接会报 `TypeError`。

## 2.6.7 元组长度

`len()` 返回元组的元素个数，与列表用法相同：

```python
patient = ("P001", "张三", 45)
print(len(patient))         # 3
```

## 2.6.8 成员检查

`in` 和 `not in` 判断元素是否在元组中，用法与列表相同。元组的成员检查同样是线性扫描：

```python
allergies = ("青霉素", "磺胺")
print("青霉素" in allergies)        # True
print("阿司匹林" not in allergies)  # True
```

## 2.6.9 元组方法：count() 和 index()

元组只有两个公开方法：`count(value)` 统计某值出现的次数，`index(value)` 返回第一个匹配的位置。列表的 append、remove、sort 等修改类方法在元组上都不存在：

```python
t = (1, 2, 2, 3, 2)
print(t.count(2))           # 3
print(t.index(2))           # 1
```

`index()` 找不到值会抛 `ValueError`，调用前最好先 `in` 检查或用 try/except 捕获。方法数量少反映了元组的设计取向：作为只读容器，不需要修改类方法。

## 2.6.10 元组拆包

元组拆包是把元组的各个元素一次性赋给多个变量，语法直观，是 Python 中处理多值的核心技巧。变量数必须与元组长度一致，否则抛 `ValueError`：

```python
patient = ("P001", "张三", 45)
pid, name, age = patient
print(pid)                  # P001
print(name)                 # 张三
print(age)                  # 45
```

带星号 `*` 的变量会收集剩余元素为一个列表，这种用法在处理**前几个明确、剩余可变**的场景时很方便：

```python
record = ("P001", "张三", 45, "高血压", "糖尿病", "高血脂")
pid, name, age, *diagnoses = record
print(pid)                  # P001
print(diagnoses)            # ['高血压', '糖尿病', '高血脂']
print(type(diagnoses))      # <class 'list'>
```

::: note 拆包与函数返回值
Python 函数返回多个值时，实际返回的是一个元组，调用方用拆包接收。例如 `status, msg = check_patient(pid)` 看似返回了两个值，本质是返回一个二元组然后拆开。这种模式让 Python 函数接口非常灵活。
:::

## 2.6.11 元组与列表的相互转换

`tuple()` 把列表转为元组，`list()` 把元组转为列表。转换产生新对象，原对象不变。这种转换在需要可变与不可变特性切换时常用：

```python
t = (1, 2, 3)
lst = list(t)
lst.append(4)
print(lst)                  # [1, 2, 3, 4]
print(t)                    # (1, 2, 3)，原元组不变

new_t = tuple(lst)
print(new_t)                # (1, 2, 3, 4)
```

转换是 O(n) 操作，需要遍历整个序列。频繁互转通常意味着数据结构选择不当，应当一开始就根据是否需要修改来选定类型。

## 2.6.12 元组的不可变性细节

元组的不可变是指**元组本身的结构和元素引用**不可变，但如果元素本身是可变对象，那个对象的内部状态仍然可以修改。这一点经常让初学者困惑：

```python
t = (["张三", 45], ["李四", 60])
t[0].append("高血压")
print(t)                    # (['张三', 45, '高血压'], ['李四', 60])
# t[0] = ["新病人"]         # TypeError，不能改元组本身
```

`t[0]` 始终指向同一个列表对象，元组的不可变性没有被破坏；但这个列表对象本身是可变的，可以 append、remove。这类似医院科室编制固定，但科室内部人员可以调动。

元组不可变带来的一个推论是：**只有当元组的所有元素都是不可变类型时，元组才能哈希**，才能作为字典的键或集合的元素。含列表的元组不可哈希：

```python
hash((1, 2, 3))             # 可哈希，返回一个整数
# hash((1, [2, 3]))         # TypeError: unhashable type: 'list'
```

## 2.6.13 命名元组

普通元组只能用索引访问元素，位置一多就容易记错含义，例如 `(72, 120, 36.5)` 不看上下文很难判断哪个是心率、哪个是血压。`collections.namedtuple` 给元组的每个位置起个名字，既保留了元组的轻量与不可变，又获得了字段访问的可读性：

```python
from collections import namedtuple

# 定义一个名为 VitalSigns 的命名元组，含三个字段
VitalSigns = namedtuple("VitalSigns", ["heart_rate", "systolic_bp", "temperature"])

vs = VitalSigns(heart_rate=72, systolic_bp=120, temperature=36.5)
print(vs.heart_rate)        # 72，按字段名访问
print(vs[1])                # 120，仍可按索引访问
print(vs._fields)           # ('heart_rate', 'systolic_bp', 'temperature')
```

命名元组本质仍是元组，与普通元组完全兼容，可以用 `isinstance(vs, tuple)` 验证。它比定义类更轻量，比普通元组更易读，是表示简单不可变数据结构的常用选择。Python 3.7 之后的 `dataclass` 提供了类似但更强大的功能，需要默认值、类型注解或方法时优先用 dataclass。

掌握元组后，你已经理解了 Python 中两种最基本的序列类型。下一节我们将进入字符串与字典等更复杂的数据类型，进一步扩展处理医学数据的能力。
