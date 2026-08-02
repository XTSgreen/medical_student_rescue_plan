---
title: 1.6 编程规范与风格初步
sidebar:
  order: 6
---
# 1.6 编程规范与风格初步


编程规范是协作的基础。程序员写代码有固定格式，命名、缩进、空格按规范书写，目的在于让任何接手的人都能快速读懂。Python 社区同样有一套通用规范，称为 PEP 8，它规定了缩进、命名、空格、换行等细节。初学阶段就遵守这些规则，能让你的代码从一开始就具备专业气质，也为后续参与开源项目、团队协作打下基础。本章将从 PEP 8 出发，覆盖命名、文档、注释、空格、换行等核心内容，帮助你建立正确的代码风格意识。

## 1.6.1 PEP 8 编码规范概览

PEP 是 Python Enhancement Proposal 的缩写，意为 Python 增强提案。PEP 8 是其中的第 8 号提案，专门描述代码风格。它由 Python 之父 Guido van Rossum 等人撰写，是整个 Python 社区公认的代码格式约定。几乎所有主流 Python 项目，无论是 Django、Flask 还是 NumPy，都遵循 PEP 8。阅读 PEP 8 文档本身是了解 Python 文化的好方法，原文地址在 python.org/dev/peps/pep-0008/。

### 缩进与行宽

Python 用缩进表示代码块的层次关系，因此缩进在 Python 中具有语法意义，不像 C 或 Java 仅靠花括号。PEP 8 规定每一级缩进使用 4 个空格，且不混用 Tab 与空格。混用会导致 `TabError` 或 `IndentationError`，这是初学者最常遇到的错误之一。在编辑器中建议把 Tab 键设置为自动插入 4 个空格，避免手动按空格的麻烦。

行宽方面，PEP 8 建议每行不超过 79 个字符。这个数字看起来过时，毕竟现在的显示器都很宽，但它的考量是兼容终端窗口与并排对比代码的场景。对于 docstring 和注释，建议更严格地控制在 72 字符内。在团队协作中，超长行会在 diff 工具中显示不便，也容易在代码评审时被要求修改。

```python
# 推荐写法
def calculate_area(length, width):
    # 4 个空格缩进
    return length * width

# 错误写法：混用 Tab 和空格会报错
# def calculate_area(length, width):
# \treturn length * width   # 这里是 Tab
```

### 空行规则

空行用于在视觉上分隔代码块。PEP 8 规定顶层函数与类之间空两行，类内的方法之间空一行。这里的顶层指的是模块级别定义的函数和类，而不是嵌套在函数内部的小函数。空行的目的是让阅读者一眼看出代码的逻辑边界，类似于文章中不同段落之间的空行。

```python
def parse_csv_file(text):
    """解析 CSV 文本"""
    pass


def parse_json_file(text):
    """解析 JSON 文本"""
    pass


class User:
    def __init__(self, name):
        self.name = name

    def get_age(self):
        return self.age
```

### 导入顺序

Python 项目通常会导入大量模块，导入语句的顺序影响可读性。PEP 8 推荐按三组顺序排列：标准库、第三方库、本地模块，每组之间空一行。标准库是 Python 自带的 `os`、`sys`、`time` 等；第三方库是通过 pip 安装的，例如 `numpy`、`pandas`；本地模块是你自己项目中的 `.py` 文件。这样分组能让阅读者快速判断每个导入的来源，排查依赖问题时尤其方便。

```python
# 标准库
import os
import sys
from datetime import datetime

# 第三方库
import numpy as np
import pandas as pd

# 本地模块
from utils.file_io import read_csv
from models.user import User
```

## 1.6.2 命名约定

命名是编程中最难的事情之一。一个准确的名字能让代码不言自明，一个含糊的名字会让维护者反复猜测。PEP 8 对不同类型的对象给出了不同的命名约定，掌握这些约定后，你看到名字就能判断它是变量、函数、类还是常量。

### 变量与函数：snake_case

变量和函数使用小写字母加下划线分隔单词，称为 snake_case。这种风格在 Python 中最为常见，因为 Python 语言本身的关键字就是小写的，整体风格保持一致。下划线在视觉上分隔单词，比驼峰命名更易读，特别是对于英语非母语的开发者。

```python
# 推荐
user_name = "张三"
score = 72

def calculate_area(length, width):
    return length * width

# 不推荐：使用了驼峰命名
userName = "张三"

def calculateArea(length, width):
    return length * width
```

### 类名：PascalCase

类名使用大驼峰命名，也叫 PascalCase，每个单词首字母大写，无下划线分隔。这种命名与变量函数的 snake_case 形成鲜明对比，让阅读者一眼区分一个标识符是类还是实例。Python 内置的 `str`、`list`、`dict` 虽然是小写，但这是历史遗留，自定义类应严格遵循 PascalCase。

```python
# 推荐
class UserRecord:
    pass


class DataAnalyzer:
    pass


# 不推荐
class user_record:
    pass
```

### 常量：UPPER_CASE

常量使用全大写字母加下划线分隔，称为 UPPER_CASE。常量指的是在程序运行期间不会改变的值，例如配置参数、数学常数、单位换算系数。Python 本身没有强制常量不可变，全大写命名是一种约定，告诉阅读者这个值不应被修改。

```python
# 推荐
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30
DAYS_PER_WEEK = 7

# 不推荐
maxRetries = 3
default_timeout = 30
```

### 私有成员：前缀下划线

以单下划线开头的名字表示私有，例如 `_name`、`_internal_method`。这种约定告诉其他开发者这个属性或方法仅供模块或类内部使用，不应在外部直接访问。Python 不会强制阻止访问，单下划线仅是一种约定。双下划线开头则会触发名称改写（name mangling），更强地隔离类内私有属性。

```python
class User:
    def __init__(self, name, id_number):
        self.name = name          # 公开属性
        self._id = id_number      # 私有属性，外部不应直接访问

    def _validate_id(self):       # 私有方法
        return len(self._id) == 18
```

## 1.6.3 文档字符串的写法

文档字符串（docstring）是放在函数、类、模块开头的三引号字符串，用于说明其用途、参数、返回值。Python 内置的 `help()` 函数会读取 docstring 并显示，IDE 也会在悬浮提示中展示。docstring 与普通注释的区别在于，前者是程序可访问的字符串对象，存储在 `__doc__` 属性中，后者仅供人类阅读。

### 单行与多行 docstring

短小的函数可以用单行 docstring，三引号放在同一行，首字母大写，句末加句号。复杂的函数应使用多行 docstring，首行是简要概述，空一行后是详细说明。多行 docstring 的结束三引号应单独占一行。

```python
def square(x):
    """返回 x 的平方。"""
    return x * x


def calculate_amount(price, quantity):
    """
    根据单价和数量计算总金额。

    参数:
        price (float): 单价，单位元。
        quantity (float): 数量。

    返回:
        float: 总金额，单位元。
    """
    return price * quantity
```

### Google 风格 docstring

社区有多种 docstring 规范，Google 风格最为流行，因为它结构清晰、可读性强，且能被 sphinx 等文档工具自动解析。Google 风格把参数、返回值、异常分块列出，每块以关键字开头，例如 `Args`、`Returns`、`Raises`。下面是一个完整示例：

```python
def classify_category(items, scores):
    """
    根据项目和评分给出分类结果。

    Args:
        items (list[str]): 项目名称列表。
        scores (dict): 评分字典，键为项目名，值为数值。

    Returns:
        dict: 分类结果，包含 category 和 confidence 两个字段。

    Raises:
        ValueError: 当项目列表为空时抛出。
    """
    if not items:
        raise ValueError("项目列表不能为空")
    # 分类逻辑略
    return {"category": "A类", "confidence": 0.85}
```

::: note docstring 与注释的区别
docstring 描述的是函数或类的对外契约，包括输入、输出、行为，是给调用者看的。注释描述的是实现细节或临时说明，是给维护者看的。简单判断标准是，docstring 回答**这个函数做什么**，注释回答**这里为什么这么写**。
:::

## 1.6.4 代码注释的最佳实践

注释是一把双刃剑。好的注释能解释代码无法表达的设计意图，坏的注释会让维护者怀疑代码本身是否可信。PEP 8 与众多资深工程师都强调一个原则：注释应解释**为什么**，代码做什么由代码本身说明。代码本身已经表达了做什么，注释重复一遍只是噪声。

### 解释为什么而非做什么

```python
# 坏注释：复述代码，没有增加信息
score = 72  # 把分数设为 72

# 好注释：解释背景或意图
# 该测试用例覆盖边界条件，分数偏低属预期
edge_score = 52
```

第一段注释完全是在翻译代码，任何人看到 `score = 72` 都知道是把分数设为 72，注释没有提供任何额外信息。第二段注释解释了为什么 52 这个看起来异常的值是正常的，这种背景信息在团队协作中尤为珍贵。

### 代码自解释时不需要注释

当代码本身已经足够清晰，再加注释就是冗余。好代码的标志之一是变量名、函数名准确到无需注释。下面两段代码功能相同，但后者通过命名消除了注释需求。

```python
# 需要注释才能理解
def f(x):
    return x / 1048576

# 自解释，无需注释
def convert_bytes_to_mb(bytes):
    return bytes / (1024 * 1024)
```

### 过时注释比没有注释更危险

代码会随需求变化，但注释常常被遗忘。当注释与代码矛盾时，维护者会陷入困惑，不知道该相信哪一方。这种过时注释的危害远大于没有注释。修改代码时务必同步修改相关注释，养成这个习惯能避免很多沟通成本。

```python
# 注释说取数量，代码实际取的是价格，明显过时
item_count = unit_price  # 获取数量
```

## 1.6.5 行末注释与独立注释

注释的位置有两种：行末注释紧跟在代码后面，独立注释独占一行。两者各有适用场景。行末注释适合对单行代码做简短说明，独立注释适合对一段逻辑做整体说明。

### 行末注释的格式

行末注释与代码之间至少空两格，使用 `#` 加一个空格开头。注释内容应简短，超过一行的应改用独立注释。行末注释过多会让代码显得杂乱，应控制使用频率。

```python
score = 72       # 考试分数，单位分
length = 120     # 长度，单位 mm
width = 80       # 宽度，单位 mm
```

### 独立注释的格式

独立注释独占一行，`#` 后加一个空格，再写注释内容。独立注释放在它所说明的代码块之前，让阅读者先看到说明再看实现。多行独立注释每行都以 `#` 开头，保持对齐。

```python
# 以下代码计算总价并判断折扣
# 折扣标准采用默认规则
unit_price = 50
quantity = 3
total = unit_price * quantity
```

## 1.6.6 空格使用规范

空格在代码中起到视觉分隔的作用，恰当的空格能让运算符和参数一目了然。PEP 8 对空格的使用有详细规定，核心原则是在必要处加空格提升可读性，在不必要处删除空格避免冗余。

### 运算符两侧

二元运算符两侧应各加一个空格，包括赋值号 `=`、加减乘除、比较运算符等。但运算符出现在函数参数默认值中时，PEP 8 建议不加空格，这是为了与关键字参数的语法区分。

```python
# 推荐
x = 1 + 2
y = x * 3 - 1
total = a + b + c

# 不推荐
x = 1+2
y = x*3-1

# 函数默认值中的等号两侧不加空格
def calculate_amount(price=70, quantity=10):
    return price * quantity
```

### 逗号与冒号

逗号后应加一个空格，冒号后也应加一个空格，这适用于列表、字典、集合、函数参数等多种场景。但字典键后的冒号前不加空格，切片操作中的冒号两侧也不加空格。

```python
# 推荐
numbers = [1, 2, 3, 4, 5]
user = {"name": "张三", "age": 45}

def greet(name, greeting="你好"):
    print(greeting, name)

# 不推荐
numbers = [1,2,3,4,5]
user = {"name":"张三","age":45}
```

### 函数调用括号内不留空格

函数调用和定义时，紧贴括号的位置不应有空格。这条规则也适用于列表、字典的索引与切片操作。空格只用于分隔元素之间，不用于括号内壁。

```python
# 推荐
result = calculate_area(65, 1.70)
first = numbers[0]
subset = numbers[1:5]

# 不推荐
result = calculate_area( 65, 1.70 )
first = numbers[ 0 ]
subset = numbers[1 : 5]
```

## 1.6.7 换行规则

当代码行超过 79 字符时需要换行。Python 提供了两种换行方式：括号内隐式换行和反斜杠显式换行。前者更推荐，后者仅在无法使用括号时使用。

### 括号内隐式换行

在小括号、中括号、大括号内部，Python 允许直接换行而不需要任何续行符。这种方式最干净，也是 PEP 8 首选的换行方式。换行后的内容可以自然对齐，也可以悬挂缩进。

```python
# 函数调用换行
result = create_user(
    name="张三",
    age=30,
    city="北京",
    gender="male",
)

# 列表换行
users = [
    "张三", "李四", "王五",
    "赵六", "钱七", "孙八",
]
```

### 反斜杠显式换行

反斜杠 `\` 是显式的续行符，告诉 Python 当前行未结束。这种方式仅在不适合用括号包裹的场景使用，例如长字符串拼接或长条件表达式。反斜杠后不能有任何字符，包括空格和注释，否则会报错。

```python
# 长条件表达式
if user_age > 60 and \
   user_is_admin and \
   user_is_active:
    print("高权限用户")

# 实际更推荐用括号
if (user_age > 60 and
    user_is_admin and
    user_is_active):
    print("高权限用户")
```

### 二元运算符前换行

当长表达式需要换行时，PEP 8 推荐在二元运算符**前**换行，这样阅读者一眼就能看到这行是接续上一行的运算，逻辑更清晰。这个规则在数学公式或布尔条件中尤其有用。

```python
# 推荐：运算符前换行
total = (first_value
         + second_value
         - third_value)

# 不推荐：运算符后换行
total = (first_value +
         second_value -
         third_value)
```

## 1.6.8 避免使用 from module import * 的原因

`from module import *` 是一种通配导入，它会把模块中所有公开名字一股脑倒入当前命名空间。这种写法看起来省事，实际上是 Python 中最容易出问题的导入方式，PEP 8 明确建议避免使用。

### 命名空间污染

Python 用模块名作为命名空间的前缀，例如 `os.path.join` 表示 `path` 是 `os` 模块的一部分。通配导入把这个前缀抹掉了，所有名字直接出现在当前作用域。如果你导入了两个模块，它们都有同名函数，后导入的会覆盖先导入的，且不会有任何警告。这种 bug 极难排查，因为代码看起来没问题，运行结果却莫名其妙。

```python
# 危险写法
from numpy import *
from math import *

# sqrt 现在指向 math.sqrt，覆盖了 numpy.sqrt
# 这两者行为不同，可能导致数值错误
result = sqrt(4)  # 你以为调用 numpy.sqrt，实际是 math.sqrt
```

### 难以追踪来源

当代码中出现一个陌生的函数名，阅读者需要知道它来自哪个模块才能查文档。通配导入让来源信息完全丢失，阅读者不得不搜索所有导入语句才能定位。在大型项目中，这种搜索成本会累加成显著的时间浪费。

```python
# 阅读者不知道 read_csv 来自哪里
from utils import *
from helpers import *
from parsers import *

data = read_csv("data.csv")  # read_csv 来自上面哪个模块？
```

推荐做法是显式导入需要的名字，或者保留模块名前缀。

```python
# 显式导入需要的名字
from pandas import read_csv, DataFrame

# 保留模块名前缀，最清晰
import pandas as pd
data = pd.read_csv("data.csv")
```

## 1.6.9 模块级 __all__ 变量的作用

`__all__` 是模块级的一个特殊变量，它是一个字符串列表，用于定义模块的公开接口。当其他模块使用 `from module import *` 导入时，只会导入 `__all__` 中列出的名字。这是一种主动控制模块对外暴露范围的方式，类似于商店的公开服务清单，列在清单上的服务对外提供，未列出的视为内部事务。

`__all__` 仅对通配导入生效，对显式导入无效。即使一个名字不在 `__all__` 中，外部仍然可以用 `from module import name` 显式导入它。因此 `__all__` 更多是一种约定，告诉使用者哪些是稳定公开的 API，哪些是可能变动的内部实现。

```python
# my_module.py
__all__ = ["parse_user", "format_report"]


def parse_user(text):
    """公开 API"""
    pass


def format_report(data):
    """公开 API"""
    pass


def _internal_helper():
    """内部函数，不对外暴露"""
    pass
```

```python
# 使用方
from my_module import *

# 只能用 parse_user 和 format_report
# _internal_helper 没有被导入
parse_user("...")    # 正常
format_report({...})    # 正常
_internal_helper()      # NameError
```

::: note 何时需要 __all__
`__all__` 主要用于库或框架的设计者，他们希望明确暴露的公开接口。对于普通的应用代码或脚本，几乎不需要写 `__all__`。初学阶段了解这个概念即可，在实际项目中遇到时再深入。
:::

掌握 PEP 8 的目的在于让代码可读、可维护。编程规范的本质是降低沟通成本，让不同人写的代码风格一致，让阅读者把注意力放在逻辑而非格式上。下一章将介绍开发工具链，包括自动格式化工具和代码检查工具，它们能帮你自动遵守 PEP 8，省去手动调整格式的繁琐工作。

## 练习题

### 第1题 概念理解

阅读下面这段代码，指出其中不符合 PEP 8 规范的地方，涉及命名、空格、空行、导入顺序等方面。

```python
import pandas as pd
import os
def calculateArea(length,width):
    return length*width
userName="张三"
```

::: details 参考答案
这段代码有几处不符合 PEP 8 规范。导入顺序不对，标准库 `os` 应排在第三方库 `pandas` 之前，且两组之间应空一行。函数名 `calculateArea` 使用了驼峰命名，应改为 snake_case 风格的 `calculate_area`。函数参数逗号后缺少空格，`length,width` 应写成 `length, width`。运算符两侧缺少空格，`length*width` 应写成 `length * width`。变量名 `userName` 用了驼峰命名，应改为 `user_name`。赋值号两侧缺少空格，`userName="张三"` 应写成 `user_name = "张三"`。顶层函数定义前后应各有两个空行。

修改后的代码：
```python
import os

import pandas as pd


def calculate_area(length, width):
    return length * width


user_name = "张三"
```
:::

### 第2题 代码编写

编写一个函数 `format_price`，接收单价和数量两个参数，返回总金额。要求遵循 PEP 8 规范：函数名用 snake_case，参数默认值的等号两侧不加空格，运算符两侧加空格，并添加符合 Google 风格的 docstring 说明参数和返回值。

::: details 参考答案
```python
def format_price(unit_price, quantity=1):
    """
    根据单价和数量计算总金额。

    Args:
        unit_price (float): 单价，单位元。
        quantity (int): 数量，默认为 1。

    Returns:
        float: 总金额，单位元。
    """
    return unit_price * quantity


print(format_price(7.5, 3))  # 22.5
```

函数名 `format_price` 使用小写字母加下划线的 snake_case 风格。参数默认值 `quantity=1` 的等号两侧不加空格，这是 PEP 8 的特殊规则，为了与关键字参数语法区分。运算符 `*` 两侧各加一个空格。docstring 采用 Google 风格，分 `Args` 和 `Returns` 两块说明参数和返回值。
:::

### 第3题 进阶练习

下面这段代码的注释属于坏注释，只复述了代码内容而没有提供额外信息。请重写注释，让它解释为什么这样做而非做了什么，并把变量名改得更见名知意。

```python
# 把 data 排序后取中间值
center = sorted(data)[len(data) // 2]
```

::: details 参考答案
```python
# 使用中位数而非均值，因为数据存在极端异常值，均值会被拉偏
median_value = sorted(data)[len(data) // 2]
```

原注释 `把 data 排序后取中间值` 只是在翻译代码，任何人看到 `sorted(data)[len(data) // 2]` 都能看出这是排序取中间值，注释没有提供任何额外信息。修改后的注释解释了为什么用中位数：因为数据存在极端异常值，均值会被拉偏。这种背景信息是代码本身无法表达的。变量名 `center` 改为 `median_value`，更清楚地表明这是中位数。
:::

### 第4题 项目实践

命令行任务管理器项目需要定义一些常量和函数。请为以下数据设计符合 PEP 8 的命名：存储任务数据的文件名常量、添加任务的函数、任务类、任务的最大标题长度常量。说明每种命名采用的风格及其原因。

::: details 参考答案
```python
# 常量用全大写字母加下划线，表示程序运行期间不应改变的值
TASK_DATA_FILE = "tasks.json"
MAX_TITLE_LENGTH = 50

# 函数用小写字母加下划线的 snake_case 风格
def add_task(title, priority=1):
    pass

# 类名用大驼峰的 PascalCase 风格，每个单词首字母大写
class TaskRecord:
    pass
```

常量 `TASK_DATA_FILE` 和 `MAX_TITLE_LENGTH` 用全大写字母加下划线，这是 PEP 8 对常量的约定，提醒阅读者这些值不应被修改。函数 `add_task` 用 snake_case，与 Python 关键字的小写风格保持一致。类 `TaskRecord` 用 PascalCase，每个单词首字母大写，与变量函数的小写风格形成对比，让阅读者一眼区分标识符是类还是实例或函数。
:::

## 常见错误

**错误 1 · `TabError: inconsistent use of tabs and spaces in indentation`**

原因:同一文件或同一代码块中混用了 Tab 字符和空格作为缩进，Python 3 不允许混用，直接报语法错误。

解决:在编辑器中把 Tab 键设置为自动插入 4 个空格。VS Code 在 `File → Preferences → Settings` 中搜索"tab size"设为 4，并勾选"Detect Indentation"。PyCharm 在 `Settings → Editor → Code Style → Python` 中勾选"Use tab character"为关闭状态。已有混用文件可用编辑器的"将 Tab 转为空格"功能批量转换。

**错误 2 · `E501 line too long 行宽超限`**

原因:单行代码超过 PEP 8 建议的 79 字符（注释和 docstring 建议 72 字符），flake8 等检查工具会报告 E501 警告。

解决:把长行拆分为多行。函数调用和定义用括号内隐式换行，长字符串用括号拼接或三引号字符串，长条件表达式用括号包裹后换行。也可以在项目配置文件（如 `setup.cfg` 的 `[flake8]` 段）中调高 `max-line-length`，但通常不建议超过 100。

**错误 3 · `通配导入 from module import * 导致命名空间污染`**

原因:通配导入把模块的所有公开名字倒入当前作用域，多个模块的同名函数会相互覆盖，且代码中调用的函数来源不可追溯。

解决:显式导入需要的名字，例如 `from math import sqrt, pi`；或保留模块名前缀，例如 `import math` 后用 `math.sqrt(4)`。在项目配置中可以用 flake8 的 `F403` 规则禁用通配导入，从工具层面避免此类问题。

**错误 4 · `命名风格混乱导致可读性下降`**

原因:同一个项目中混用了 snake_case、camelCase、PascalCase 等多种命名风格，或变量名缩写严重、含义模糊，阅读者无法从名字判断其类型和用途。

解决:统一遵循 PEP 8 命名约定，变量和函数用 snake_case，类用 PascalCase，常量用 UPPER_CASE。命名做到见名知意，避免 `a`、`b`、`tmp`、`data2` 这类无意义名字。使用 black 或 autopep8 自动格式化，配合 flake8 检查命名规则。
