---
title: 2.9 类型转换与类型判断
sidebar:
  order: 9
---
# 2.9 类型转换与类型判断


Python 是动态类型语言，变量在运行时才确定类型。这种灵活性带来便利，也意味着数据在不同类型之间流动时需要可靠的转换与判断机制。本节覆盖显式类型转换函数、字符串与对象表示、类型判断的三种工具，以及 Python 独特的鸭子类型思想。掌握这些内容后，你就能在处理实际数据、解析用户输入、设计函数接口时，对类型流动有清晰把握。

## 2.9.1 显式类型转换函数

显式类型转换也叫**强制类型转换**，是用内置构造函数把一个类型的值转换成另一个类型。这与隐式转换不同：隐式转换由解释器自动完成（如 `1 + 2.0` 中整数 1 被自动转成浮点数），显式转换则需要程序员在代码中写明。在实际开发中，这好比把一份配置文件中的"年龄"字段从字符串读取为程序中的整数字段，必须显式指定目标类型。

Python 提供了一组内置函数完成常见类型之间的转换，每个函数名同时也是一个内置类型的名字。

### 数值类型之间的转换

`int()`、`float()`、`complex()` 用于数值类型之间的相互转换。`int()` 会截断小数部分而不是四舍五入，这点要特别注意。

```python
# int() 把浮点数或数字字符串转成整数
print(int(3.99))        # 3，截断小数部分
print(int("42"))        # 42，从字符串解析
print(int("  17  "))    # 17，会自动去除两端空白
print(int("0xff", 16))  # 255，按 16 进制解析字符串
print(int("1010", 2))   # 10，按 2 进制解析

# float() 把整数或字符串转成浮点数
print(float(5))         # 5.0
print(float("3.14"))    # 3.14
print(float("1e3"))     # 1000.0，支持科学计数法字符串

# complex() 构造复数
print(complex(1, 2))        # (1+2j)
print(complex("3+4j"))      # (3+4j)
```

注意 `int()` 处理浮点数时是向零截断，`int(-3.9)` 的结果是 `-3` 而不是 `-4`。如果需要四舍五入，应该用 `round()` 函数。处理带小数点的字符串时，`int("3.14")` 会抛出 `ValueError`，必须先 `float()` 再 `int()`。

### 布尔转换 bool()

`bool()` 把任意值转成 `True` 或 `False`。转换规则遵循一个朴素的原则：空与零为假，其余为真。

```python
# 数值：0 为假，非 0 为真
print(bool(0))        # False
print(bool(0.0))      # False
print(bool(42))       # True
print(bool(-1))       # True，负数也是真

# 空容器为假，非空容器为真
print(bool(""))       # False，空字符串
print(bool("0"))      # True，非空字符串（哪怕内容是字符 0）
print(bool([]))       # False，空列表
print(bool([0]))      # True，含一个元素的列表
print(bool({}))       # False，空字典
print(bool(None))     # False
```

`bool("0")` 的结果是 `True`，这是常见的坑：字符串 `"0"` 不是空字符串，所以为真。在实际开发中，读取 CSV 或用户输入得到的都是字符串，需要先把 `"0"` 转成数字再做布尔判断。

### 字符串转换 str()

`str()` 把任意对象转换成人类可读的字符串表示。这是最常用的转换，几乎每个对象都支持。

```python
print(str(42))        # "42"
print(str(3.14))      # "3.14"
print(str(True))      # "True"
print(str([1, 2, 3])) # "[1, 2, 3]"
print(str(None))      # "None"

# 自定义对象调用 str() 时会触发其 __str__ 方法
class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    def __str__(self):
        return f"用户({self.name}, {self.age}岁)"

u = User("张三", 45)
print(str(u))         # 用户(张三, 45岁)
```

### 容器类型之间的转换

`list()`、`tuple()`、`set()`、`frozenset()`、`dict()` 用于在不同容器之间转换。这些转换在实际开发中极为常用，比如把一组重复的 ID 去重、把键值对列表转成字典。

```python
# 字符串转列表：每个字符变成一个元素
print(list("ABC"))    # ['A', 'B', 'C']

# 列表与元组互转
print(tuple([1, 2, 3]))    # (1, 2, 3)
print(list((4, 5, 6)))     # [4, 5, 6]

# 列表转集合：自动去重，但丢失顺序
ids = ["U001", "U002", "U001", "U003"]
print(set(ids))       # {'U001', 'U003', 'U002'}，顺序不保证

# frozenset 是不可变的集合
fs = frozenset([1, 2, 3])
print(fs)             # frozenset({1, 2, 3})

# dict() 从键值对序列构造字典
pairs = [("name", "李四"), ("age", 30), ("dept", "技术部")]
print(dict(pairs))    # {'name': '李四', 'age': 30, 'dept': '技术部'}

# dict() 也可从关键字参数构造
print(dict(name="王五", age=25))  # {'name': '王五', 'age': 25}
```

集合转换最常见的用途是去重。但要注意，转换成 `set` 会丢失原始顺序，如果顺序重要，Python 3.7+ 应该用 `dict.fromkeys()` 保持插入顺序去重。

::: note 转换失败的处理
所有转换函数在遇到无法解析的输入时都会抛出 `ValueError`。比如 `int("abc")`、`float("12.3.4")`、`list(42)` 都会报错。处理用户输入或外部数据时，应该用 `try/except` 包裹转换逻辑，避免程序因一条坏数据而崩溃。
:::

## 2.9.2 repr() 与 str() 的区别

Python 有两个函数都能把对象转成字符串，但服务的对象不同。`str()` 面向最终用户，返回的是人类可读的友好表示；`repr()` 面向开发者和解释器，返回的是**无歧义的**表示，理想情况下能用 `eval()` 重新构造出原对象。

这好比系统里的两类记录：`str()` 是给普通用户看的提示信息，通俗易懂；`repr()` 是开发者之间的调试记录，需要精确到可以复现。

```python
# 字符串的两种表示差异最明显
s = "hello\nworld"
print(str(s))    # 输出两行：hello（换行）world
print(repr(s))   # 'hello\nworld'，转义符原样显示

# 数值的差异
print(str(3.14))    # 3.14
print(repr(3.14))   # 3.14

# 日期时间
import datetime
now = datetime.datetime(2024, 1, 15, 10, 30)
print(str(now))     # 2024-01-15 10:30:00
print(repr(now))    # datetime.datetime(2024, 1, 15, 10, 30)
```

观察 `repr(now)` 的输出：它看起来像一个 Python 表达式，把这个表达式传给 `eval()` 就能重新构造出原始的 `datetime` 对象。这就是 `repr()` 的设计目标，即**可重建性**。

### 自定义对象的两个方法

自定义类可以通过实现 `__str__` 和 `__repr__` 两个特殊方法分别控制两种表示。`__repr__` 是更基础的，如果只实现了 `__repr__` 而没有 `__str__`，`str()` 会回退到调用 `__repr__`。

```python
class PriceTag:
    def __init__(self, item, value, unit):
        self.item = item
        self.value = value
        self.unit = unit

    def __str__(self):
        # 面向用户：简洁友好
        return f"{self.item}: {self.value}{self.unit}"

    def __repr__(self):
        # 面向开发者：精确可重建
        return f"PriceTag(item={self.item!r}, value={self.value!r}, unit={self.unit!r})"

r = PriceTag("鼠标", 5.6, "元")
print(str(r))   # 鼠标: 5.6元
print(repr(r))  # PriceTag(item='鼠标', value=5.6, unit='元')
```

在交互式解释器中直接输入变量名回车，显示的就是 `repr()` 的结果；用 `print()` 输出时用的是 `str()`。调试时多看 `repr()`，展示给用户时用 `str()`。

## 2.9.3 eval() 执行字符串表达式

`eval()` 能把一个字符串当作 Python 表达式来执行并返回结果。这看似强大，实则危险：如果字符串来自不可信来源（用户输入、网络数据、配置文件），`eval()` 可能执行任意恶意代码，造成数据泄露或系统破坏。

在实际开发场景中，绝不要用 `eval()` 处理来自 CSV、数据库或用户表单的字符串。如果需要解析数值，用 `int()` 或 `float()`；如果需要解析结构化数据，用 `json.loads()`。`eval()` 仅在受控环境中（如自己写的测试代码、可信的字面量解析）才有用武之地，日常数据处理应避开它。

## 2.9.4 类型判断：type()

`type()` 返回一个对象的类型对象。这是最直接的类型查询方式，类似程序中通过类型检查直接确认某个变量的类型。

```python
print(type(42))           # <class 'int'>
print(type(3.14))         # <class 'float'>
print(type("hello"))      # <class 'str'>
print(type([1, 2, 3]))    # <class 'list'>
print(type(None))         # <class 'NoneType'>

# 用 type() 做相等判断
x = 42
if type(x) == int:
    print("x 是整数")

# 也可以用 is 判断，更推荐
if type(x) is int:
    print("x 是整数")
```

`type()` 返回的是类型对象本身，可以直接拿来构造新实例或做相等比较。但用 `type()` 判断类型有一个重要局限：它**不考虑继承关系**。这引出了下一节的 `isinstance()`。

## 2.9.5 类型判断：isinstance()

`isinstance(obj, type)` 检查对象是否属于指定类型，与 `type()` 的关键区别在于它**考虑继承关系**。此外，`isinstance()` 的第二个参数可以传一个类型元组，一次检查多种类型，这在处理混合输入时非常方便。

```python
print(isinstance(42, int))         # True
print(isinstance(42, float))       # False
print(isinstance(3.14, (int, float)))  # True，检查是否属于元组中的任一类型
print(isinstance("hello", (int, float, str)))  # True

# bool 是 int 的子类，所以
print(isinstance(True, int))        # True
print(type(True) == int)           # False，type() 不考虑继承
```

注意 `isinstance(True, int)` 返回 `True`，因为 `bool` 是 `int` 的子类（`True` 等于 1，`False` 等于 0）。这是 `isinstance()` 与 `type()` 最直观的差异之一。

### 一次检查多种类型

`isinstance()` 接受元组作为第二个参数，对象只要匹配元组中任一类型就返回 `True`：

```python
def describe(value):
    if isinstance(value, (int, float, complex)):
        return "数值类型"
    elif isinstance(value, (str, bytes)):
        return "文本类型"
    elif isinstance(value, (list, tuple, set)):
        return "序列或集合类型"
    elif isinstance(value, dict):
        return "映射类型"
    else:
        return "其他类型"

print(describe(42))          # 数值类型
print(describe("hello"))     # 文本类型
print(describe([1, 2, 3]))   # 序列或集合类型
print(describe({"a": 1}))    # 映射类型
```

这种写法比一长串 `or` 拼接的 `type()` 判断更简洁，也更符合 Python 风格。

## 2.9.6 issubclass()

`issubclass(cls, classinfo)` 检查一个类是否是另一个类的子类。它操作的是**类对象**，而不是实例。第二个参数同样支持类型元组。

```python
class Animal:
    pass

class Dog(Animal):
    pass

class Labrador(Dog):
    pass

print(issubclass(Dog, Animal))        # True
print(issubclass(Labrador, Animal))   # True，跨多级继承
print(issubclass(Animal, Dog))        # False，方向反了
print(issubclass(Dog, (int, str, Animal)))  # True，元组中任一匹配即可
print(issubclass(Dog, Dog))            # True，一个类是自身的子类
```

`issubclass()` 在自定义异常处理、框架插件机制中常用于检查传入的类是否符合预期层级。日常脚本中用得不多，但理解它有助于把握 Python 的类型体系。

## 2.9.7 type() vs isinstance() 的区别

这两者最核心的差异在于**是否考虑继承**。`type()` 返回对象的确切类型，做相等比较时只匹配精确类型；`isinstance()` 会沿着继承链向上查找，子类的实例也算作父类的实例。

```python
class Animal:
    pass

class Dog(Animal):
    pass

d = Dog()

# type() 不考虑继承
print(type(d) == Animal)    # False
print(type(d) == Dog)      # True

# isinstance() 考虑继承
print(isinstance(d, Animal))  # True
print(isinstance(d, Dog))     # True
```

这种差异在面向对象编程中尤为关键。假设你写了一个函数，接受任何 `Animal` 类型并处理它：

```python
def feed(animal):
    if type(animal) == Animal:  # 错误写法
        print("喂食动物")
    elif isinstance(animal, Animal):  # 正确写法
        print("喂食动物")
```

如果传入 `Dog` 实例，第一种写法会因为 `type(d) == Animal` 为 `False` 而跳过分支；第二种写法则能正确识别。**实际开发中应优先使用 `isinstance()`**，因为它尊重面向对象的多态原则。只有在需要精确匹配类型、明确排除子类时才用 `type()`。

::: note 为什么 bool 是 int 的子类
Python 中 `True` 和 `False` 实际上是 `int` 的子类实例，`True == 1` 和 `False == 0` 都为真。这是历史遗留设计，让布尔值可以参与数值运算。也正因为如此，`isinstance(True, int)` 返回 `True`，处理数值时要留意这种隐式关系。
:::

## 2.9.8 鸭子类型

Python 有一句著名的格言：**如果它走起来像鸭子，叫起来像鸭子，那它就是鸭子。** 这种思想叫做**鸭子类型**（Duck Typing），是 Python 类型系统的核心哲学之一。

鸭子类型的实质是：Python 不关心对象的实际类型是什么，只关心它**有没有需要的方法或属性**。如果一只动物有 `walk()` 和 `quack()` 方法，Python 就把它当鸭子用，至于它是不是真正的鸭子（继承自 `Duck` 类），无所谓。

```python
class Duck:
    def walk(self):
        print("鸭子摇摇摆摆走")
    def quack(self):
        print("嘎嘎嘎")

class Person:
    def walk(self):
        print("人直立行走")
    def quack(self):
        print("人模仿鸭子叫")

def make_it_quack(thing):
    # 不检查类型，只要 thing 有 quack 方法就行
    thing.quack()

make_it_quack(Duck())    # 嘎嘎嘎
make_it_quack(Person())  # 人模仿鸭子叫
```

`make_it_quack` 函数完全没有检查参数的类型，它只关心传入的对象是否能调用 `quack()`。这种风格让代码非常灵活：任何实现了所需方法的对象都能传入，无需继承某个特定基类。

### 鸭子类型在实际开发中的体现

Python 内置的迭代器协议就是鸭子类型的典型应用。任何实现了 `__iter__` 和 `__next__` 方法的对象都可以被 `for` 循环遍历，无论它是列表、字符串、文件对象，还是自定义的数据流。

```python
class RecordStream:
    """模拟一个可迭代的记录容器"""
    def __init__(self, records):
        self._records = records
        self._index = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self._index >= len(self._records):
            raise StopIteration
        record = self._records[self._index]
        self._index += 1
        return record

records = RecordStream(["记录A", "记录B", "记录C"])
# for 循环不关心 records 的类型，只要有 __iter__ 就能遍历
for r in records:
    print(r)
```

鸭子类型让 Python 的函数接口极其灵活，也带来一些代价：类型错误要到运行时才暴露，IDE 也难以提供精确的代码补全。对于大型项目，可以配合 `typing` 模块的类型注解和 mypy 静态检查工具，在保持灵活性的同时提前发现类型问题。对于数据处理脚本和原型开发，鸭子类型的简洁与自由往往正是所需的。

## 练习题

### 第1题 概念理解

阅读下面的代码，写出输出结果，并解释 `type()` 和 `isinstance()` 在判断布尔值时的差异。

```python
print(int(3.9))
print(int(-3.9))
print(bool("0"))
print(bool(""))
print(type(True) == int)
print(isinstance(True, int))
```

::: details 参考答案
```python
print(int(3.9))           # 3
print(int(-3.9))          # -3
print(bool("0"))          # True
print(bool(""))           # False
print(type(True) == int)  # False
print(isinstance(True, int))  # True
```

`int()` 对浮点数是向零截断，`int(3.9)` 和 `int(-3.9)` 都向零靠近，分别得到 3 和 -3。`bool("0")` 返回 `True`，因为 `"0"` 是非空字符串，字符串只要非空就为真。`type(True) == int` 返回 `False`，因为 `type()` 返回确切类型，不考虑继承关系。`isinstance(True, int)` 返回 `True`，因为 `bool` 是 `int` 的子类，`isinstance()` 沿继承链向上查找。
:::

### 第2题 代码编写
编写一个函数 `describe(value)`，用 `isinstance()` 配合类型元组判断输入值属于数值类型、文本类型、序列集合类型还是映射类型，返回类型描述字符串。用整数、字符串、列表、字典测试。

::: details 参考答案
```python
def describe(value):
    if isinstance(value, (int, float, complex)):
        return "数值类型"
    elif isinstance(value, (str, bytes)):
        return "文本类型"
    elif isinstance(value, (list, tuple, set)):
        return "序列或集合类型"
    elif isinstance(value, dict):
        return "映射类型"
    else:
        return "其他类型"

print(describe(42))          # 数值类型
print(describe("hello"))     # 文本类型
print(describe([1, 2, 3]))   # 序列或集合类型
print(describe({"a": 1}))    # 映射类型
print(describe(3.14))        # 数值类型
```

`isinstance()` 的第二个参数可以传一个类型元组，对象只要匹配元组中任一类型就返回 `True`。这种写法比一长串 `or` 拼接的 `type()` 判断更简洁，也更符合 Python 风格。注意 `bool` 是 `int` 的子类，`isinstance(True, int)` 也返回 `True`，如果需要排除布尔值要单独处理。
:::

### 第3题 进阶
阅读下面的代码，解释 `str()` 和 `repr()` 的区别。再编写一个简单的类 `Task`，实现 `__str__` 和 `__repr__` 两个方法，让 `print()` 输出简洁描述，`repr()` 输出能重建对象的表达式。

::: details 参考答案
```python
s = "hello\nworld"
print(str(s))    # 输出两行：hello 和 world
print(repr(s))   # 'hello\nworld'，转义符原样显示

class Task:
    def __init__(self, task_id, title, priority):
        self.task_id = task_id
        self.title = title
        self.priority = priority

    def __str__(self):
        return f"[{self.task_id}] {self.title}（优先级 {self.priority}）"

    def __repr__(self):
        return f"Task(task_id={self.task_id!r}, title={self.title!r}, priority={self.priority!r})"

t = Task("T001", "设计登录页面", 3)
print(t)        # [T001] 设计登录页面（优先级 3）
print(repr(t))  # Task(task_id='T001', title='设计登录页面', priority=3)
```

`str()` 面向最终用户，返回人类可读的友好表示。`repr()` 面向开发者，返回无歧义的精确表示，理想情况下能用 `eval()` 重建对象。自定义类实现 `__str__` 让 `print()` 输出友好文本，实现 `__repr__` 让调试时看到精确信息。`!r` 转换标志让 f-string 调用 `repr()` 而非默认的 `str()`，字符串会带上引号。
:::

### 第4题 项目实践
在一个任务管理程序中，需要处理用户输入的任务编号。编写函数 `parse_priority(raw)`，接收字符串输入，先判断是否为纯数字，是则转为整数并检查范围 1 到 5，不是则返回默认值 3。用 `"3"`、`"7"`、`"abc"`、`""` 测试。

::: details 参考答案
```python
def parse_priority(raw):
    # 判断是否为纯数字
    if not raw or not raw.isdigit():
        return 3
    priority = int(raw)
    # 检查范围
    if not (1 <= priority <= 5):
        return 3
    return priority

print(parse_priority("3"))    # 3
print(parse_priority("7"))    # 3，超出范围返回默认值
print(parse_priority("abc"))  # 3，非数字返回默认值
print(parse_priority(""))     # 3，空字符串返回默认值
print(parse_priority("5"))    # 5
```

`isdigit()` 判断字符串是否全为数字字符，避免直接 `int()` 转换非法字符串时抛 `ValueError`。空字符串要先排除，因为 `"".isdigit()` 返回 `False` 但空字符串本身需要特殊处理。范围检查用链式比较 `1 <= priority <= 5`，这是 Python 特有的简洁写法。函数在输入不合法时返回默认值而非报错，让程序在异常输入下仍能继续运行。
:::

## 常见错误

**错误 1 · `ValueError: invalid literal for int() with base 10: 'abc'`**

```python
print(int("abc"))     # ValueError
print(int("3.14"))    # ValueError
print(int("12.3.4"))  # ValueError
```

原因:`int()` 解析字符串时要求内容是合法的整数字面量，字母、小数点、多个小数点都会失败。`int()` 对浮点数是向零截断，但解析字符串时不会先做浮点转换。常见于处理用户输入或 CSV 数据时，未先校验就调用 `int()`。

解决:解析前用 `str.isdigit()` 判断是否为纯数字（注意空字符串先排除）。含小数的字符串先 `float()` 再 `int()`。来源不可控的输入用 `try/except ValueError` 包裹转换逻辑，避免一条坏数据导致整个程序崩溃。

**错误 2 · `bool("0")` 返回 `True`（期望 `False`）**

```python
print(bool("0"))   # True
print(bool(""))    # False
print(bool([]))    # False
print(bool([0]))   # True
```

原因:`bool()` 的规则是空与零为假，其余为真。字符串 `"0"` 是非空字符串，所以为真。列表 `[0]` 含一个元素（即使元素是 0），也为真。这与数值 `0` 为假不同，初学者容易混淆。

解决:把字符串先转成数值再判断布尔值，例如 `bool(int("0"))` 返回 `False`。处理用户输入的 "0"/"1" 之类标志位时，明确用 `if raw == "0":` 或 `if int(raw) == 0:` 判断，避免依赖 `bool()` 的隐式转换。

**错误 3 · `type(True) == int` 返回 `False`**

```python
print(type(True) == int)         # False
print(isinstance(True, int))     # True
```

原因:`type()` 返回对象的确切类型，不考虑继承关系。`True` 的确切类型是 `bool`，`bool` 是 `int` 的子类，但 `type(True)` 返回 `bool` 而非 `int`，所以 `== int` 为 `False`。`isinstance()` 沿继承链向上查找，`True` 既是 `bool` 也是 `int`。

解决:判断类型时优先用 `isinstance()`，它尊重面向对象的多态原则，子类实例也算父类实例。只有在需要精确匹配类型、明确排除子类时才用 `type() is`。判断布尔值用 `isinstance(x, bool)` 单独处理，避免 `isinstance(True, int)` 误判。

**错误 4 · `TypeError: argument of type 'int' is not iterable` 或 `AttributeError`**

```python
print(len(42))        # TypeError: object of type 'int' has no len()
print(42.startswith("4"))  # AttributeError
```

原因:对错误类型的对象调用了不适用方法或函数。`len()` 只接受有长度的容器和字符串，整数没有长度。`startswith` 是字符串方法，整数没有这个方法。动态类型语言中这类错误要到运行时才暴露。

解决:对来源不可控的数据先做类型检查 `isinstance(value, (str, list))` 再调用相应方法。或用 `try/except (TypeError, AttributeError)` 捕获。设计函数时在文档中说明参数类型，配合类型注解 `def func(s: str) -> int:` 让 IDE 和 mypy 提前发现问题。
