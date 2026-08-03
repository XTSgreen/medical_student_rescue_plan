---
title: 1.4 程序组织与模块导入初步
sidebar:
  order: 4
---
# 1.4 程序组织与模块导入初步

## 1.4.1 模块（module）概念

模块是 Python 代码组织的基本单位。**一个 `.py` 文件就是一个模块**，文件名就是模块名。例如 `utils.py` 这个文件对应的模块名是 `utils`。模块内部可以定义函数、类、变量，这些对象统称为模块的成员。

模块存在的意义在于把相关功能聚集在一起。这类似于工具箱的分格收纳：把字符串处理工具放一格，把日期计算工具放另一格，每格工具有自己的用途，又能组合使用。在程序中，你把字符串处理函数放进 `string_utils.py`，把日期计算函数放进 `date_utils.py`，需要哪部分功能就导入对应模块。

模块带来三个直接好处。代码被拆分到多个文件后，单个文件规模可控，阅读和定位问题都更方便。不同模块之间通过明确的导入关系协作，彼此的内部实现可以独立修改而不相互干扰。功能相同的模块可以在多个项目中复用，避免重复编写。

## 1.4.2 包（package）概念

当模块数量继续增加，扁平地堆在一个目录里又会变得混乱。包就是用来组织模块的上一级单位。**包是一个包含 `__init__.py` 文件的目录**，目录名就是包名。目录下的每个 `.py` 文件是这个包的子模块。

包对应到公司就是部门的概念。一个公司里包含研发部、市场部、财务部等多个部门，每个部门是公司下的一个单元。同样地，一个 `utils` 包目录下可以有 `files.py`、`stats.py`、`reports.py` 等子模块，它们共同构成工具相关的功能集合。

`__init__.py` 文件可以是空的，它的存在向 Python 表明这个目录应被当作包处理。在较新的 Python 版本中，没有 `__init__.py` 的目录也能作为包使用，称为命名空间包，但初学阶段建议显式创建 `__init__.py`，避免引入额外复杂度。

包可以嵌套，形成多层结构。`utils.files` 可以是一个子包，它本身又是一个目录，包含 `csv_io.py`、`json_io.py` 等模块。这种层级组织让大型项目的代码结构清晰可循。

## 1.4.3 标准库模块概览

Python 自带一批功能丰富的模块，称为标准库。标准库无需安装，导入即可使用。下表列出几个常用的标准库模块及其用途。

| 模块名      | 主要用途                           |
| ----------- | ---------------------------------- |
| math        | 数学函数，如三角函数、对数、阶乘   |
| random      | 生成随机数、随机抽样               |
| os          | 操作系统接口，路径、文件、环境变量 |
| sys         | 解释器相关参数，模块搜索路径、退出 |
| datetime    | 日期和时间处理                     |
| json        | JSON 格式的读写与转换              |
| re          | 正则表达式匹配                     |
| collections | 扩展数据结构，如计数器、默认字典   |
| statistics  | 基本统计量，均值、中位数、标准差   |
| pathlib     | 面向对象的路径操作                 |

标准库覆盖了大部分日常编程需求。处理数值指标时用 `statistics` 算均值标准差，读取配置文件用 `json` 解析数据，批量处理文件用 `os` 和 `pathlib` 遍历目录。在引入第三方库之前，先查一查标准库是否已经提供对应功能，往往能省去不少依赖管理麻烦。

## 1.4.4 导入模块的方式

Python 提供了几种导入语法，适用于不同场景。

基本的形式是 `import 模块名`。导入后，模块内的成员需要通过模块名加点号访问。

```python
import math

# 通过模块名访问成员
print(math.pi)        # 输出 3.141592653589793
print(math.sqrt(25))  # 输出 5.0
```

当模块名较长或与已有名称冲突时，可以用 `as` 起别名。别名在后续代码中替代原模块名使用。

```python
import numpy as np
import pandas as pd

# 用别名调用
arr = np.array([1, 2, 3])
```

如果只需要模块中的某个函数或变量，用 `from 模块名 import 成员`。这样可以直接使用成员名，无需加模块名前缀。

```python
from math import sqrt, pi

print(sqrt(16))  # 输出 4.0，无需写 math.sqrt
print(pi)        # 输出 3.141592653589793
```

`from ... import` 也支持 `as` 别名，常用于给成员起更短或更明确的名字。

```python
from statistics import mean as avg

scores = [85, 90, 78, 92]
print(avg(scores))  # 输出 86.25
```

还有一种 `from 模块名 import *` 的写法，它会导入模块的所有公开成员。这种写法不推荐使用。原因在于它会把模块的所有名字倒入当前命名空间，容易覆盖你已有的同名变量，也让代码的来源变得难以追溯。读到 `sqrt(16)` 时，你无法判断 `sqrt` 来自 `math` 还是其他模块，调试和维护成本都会上升。需要多个成员时，显式列出它们是更稳妥的做法。

::: note 关于 import * 的补充
某些交互式环境或教学示例中会见到 `from math import *`，那是为了简化输入。在正式项目代码中应避免这种写法，改用显式导入。
:::

## 1.4.5 模块搜索路径（sys.path）

执行 `import` 语句时，Python 需要知道去哪里找对应模块。它按固定顺序在一组目录中查找，这组目录记录在 `sys.path` 列表里。

```python
import sys

# 查看模块搜索路径
for path in sys.path:
    print(path)
```

`sys.path` 的内容大致按以下顺序构成。第一项通常是当前脚本所在目录，也就是你运行 Python 时所在的目录。接下来是环境变量 `PYTHONPATH` 中列出的目录。然后是 Python 标准库所在目录。最后是已安装的第三方库目录，例如虚拟环境的 `site-packages`。

Python 按这个顺序依次查找，找到第一个匹配的模块就停止。这意味着如果你在当前目录建了一个 `math.py`，再执行 `import math`，Python 会优先导入你的文件而不是标准库的 `math`。这种**同名覆盖**常常导致莫名其妙的问题，给模块起名时要避开标准库名。

理解搜索路径有助于解决 `ModuleNotFoundError`。当报错说找不到某个模块时，原因通常是该模块没有安装，或者它所在的目录不在 `sys.path` 中。虚拟环境管理工具会自动把对应目录加入路径，这也是为什么推荐用虚拟环境隔离项目依赖。

## 1.4.6 自定义模块的创建与导入

编写自己的模块很简单，创建一个 `.py` 文件并在其中定义函数或变量即可。下面是一个简单的 `mymodule.py` 文件内容。

```python
# mymodule.py
"""一个简单的自定义模块，演示模块的基本结构。"""

def average_score(total, count):
    """计算平均分。total 为总分，count 为人数。"""
    return total / count

def score_level(value):
    """根据分数返回等级。"""
    if value >= 90:
        return "优秀"
    elif value >= 80:
        return "良好"
    elif value >= 60:
        return "及格"
    else:
        return "不及格"

version = "1.0"
```

在同一目录下的另一个文件中，可以直接导入并使用这个模块。

```python
# main.py
import mymodule

value = mymodule.average_score(750, 9)
print(f"平均分 = {value:.2f}")              # 输出 平均分 = 83.33
print(f"等级：{mymodule.score_level(value)}")  # 输出 等级：良好
print(f"模块版本：{mymodule.version}")    # 输出 模块版本：1.0
```

也可以只导入需要的函数。

```python
# main.py
from mymodule import average_score, score_level

value = average_score(750, 9)
print(score_level(value))  # 输出 良好
```

自定义模块第一次被导入时，Python 会执行该模块的全部顶层代码，并把模块对象缓存到 `sys.modules`。之后再次导入同一模块时，直接使用缓存，不会重复执行。这也是为什么模块里的函数定义只生效一次。

## 1.4.7 模块的 `__name__` 属性与 `if __name__ == "__main__":` 的作用

每个模块都有一个内置属性 `__name__`，它的值取决于模块是如何被运行的。**当一个 `.py` 文件被直接运行时，它的 `__name__` 等于字符串 `"__main__"`。当它被导入到别的文件时，`__name__` 等于模块名。**

利用这个特性，可以在模块里写一段只在直接运行时才执行的代码，被导入时则跳过。这种写法常见的位置是模块末尾的测试代码。

```python
# mymodule.py
def average_score(total, count):
    return total / count

def score_level(value):
    if value >= 90:
        return "优秀"
    elif value >= 80:
        return "良好"
    elif value >= 60:
        return "及格"
    else:
        return "不及格"

# 直接运行时执行测试，被导入时跳过
if __name__ == "__main__":
    print("自测结果：")
    print(average_score(750, 9))    # 直接运行时输出 83.333...
    print(score_level(95))          # 直接运行时输出 优秀
```

直接运行 `mymodule.py` 时，`__name__` 为 `"__main__"`，测试代码执行。在 `main.py` 里 `import mymodule` 时，`mymodule.__name__` 为 `"mymodule"`，测试代码被跳过，不会打印测试输出。

这种模式类似于模块的自检流程。一个模块独立运行时会跑自测代码确认功能正常，但当被其他模块导入调用时，就不需要再跑一遍自测。`if __name__ == "__main__":` 是区分这两种情形的开关。

养成在模块中放测试代码的习惯，可以让你随时单独运行某个文件验证其功能，又不必担心被导入时产生副作用。

## 1.4.8 包的结构与导入

包让模块形成层级结构。假设有如下目录结构。

```
utils/
    __init__.py
    files.py
    stats.py
    reports.py
```

`utils` 是一个包，`files`、`stats`、`reports` 是它的子模块。导入子模块有几种写法。

```python
# 导入整个子模块，用完整路径访问
import utils.files

utils.files.read_text("data.txt")
```

```python
# 导入子模块并起别名
import utils.reports as rp

rp.generate("月度报告", count=100)
```

```python
# 从包中导入某个子模块
from utils import stats

stats.compute_mean([85, 90, 78])
```

```python
# 从子模块导入具体函数
from utils.stats import compute_mean

compute_mean([85, 90, 78])
```

`__init__.py` 文件除了标记目录为包，还可以用来控制包的导入行为。在 `__init__.py` 中可以写导入语句，让用户直接 `from utils import compute_mean` 就能用，而不必写完整子模块路径。初学阶段保持 `__init__.py` 为空即可，等功能复杂后再考虑在其中做导入控制。

## 1.4.9 相对导入与绝对导入的概念

在包内部，子模块之间相互引用有两种风格。

**绝对导入**从顶层包名开始写完整路径。这种方式清晰明确，无论从哪里调用都能找到目标。

```python
# 在 utils/files.py 中引用同包的 stats 模块
from utils.stats import compute_mean
```

**相对导入**用点号表示当前位置。一个点 `.` 表示当前包，两个点 `..` 表示上一级包。它只能用在包内部的模块中。

```python
# 在 utils/files.py 中引用同包的 stats 模块
from .stats import compute_mean
from . import reports
```

相对导入的好处是包整体改名或移动位置时，内部引用不用修改。它的缺点是可读性差，看到 `from . import stats` 时需要先弄清楚当前在哪个包里。绝对导入可读性更好，但在深层嵌套的包中路径会很长。

初学阶段建议统一使用绝对导入，等熟悉包结构后再按需采用相对导入。需要注意的是，相对导入在直接运行模块文件时会报错，因为它依赖包的上下文。这也就是为什么包内部的测试代码通常通过 `python -m utils.files` 这种以模块方式运行，而不是直接 `python utils/files.py`。

## 练习题

### 第1题 概念理解

阅读下面这段代码，解释 `if __name__ == "__main__":` 的作用，并说明直接运行该文件与被其他文件导入时，代码的执行行为有何不同。

```python
# calc.py
def double(x):
    return x * 2

if __name__ == "__main__":
    print(double(5))
```

::: details 参考答案
`__name__` 是每个模块的内置属性。当一个 `.py` 文件被直接运行时，它的 `__name__` 等于字符串 `"__main__"`，`if` 条件成立，测试代码执行，打印 `10`。当它被其他文件 `import calc` 导入时，`__name__` 等于模块名 `"calc"`，`if` 条件不成立，测试代码被跳过。

这种机制让模块既能被独立运行做自测，又能被其他模块安全导入而不产生副作用。把测试代码放在 `if __name__ == "__main__":` 块中是 Python 的常见习惯。
:::

### 第2题 代码编写

创建一个自定义模块 `math_tools.py`，在其中定义一个函数 `circle_area` 接收半径参数，返回圆的面积（使用 `math.pi`）。然后在同一目录下的另一个文件中，分别用 `import` 和 `from ... import` 两种方式导入并调用这个函数。

::: details 参考答案
math_tools.py 内容：
```python
import math

def circle_area(radius):
    """根据半径计算圆的面积。"""
    return math.pi * radius ** 2
```

main.py 内容：
```python
# 方式一：import 模块名，通过模块名访问
import math_tools
print(math_tools.circle_area(5))  # 78.53981633974483

# 方式二：from ... import 直接导入函数
from math_tools import circle_area
print(circle_area(5))  # 78.53981633974483
```

方式一通过模块名加点号访问成员，能清楚看出函数来源。方式二直接使用函数名，代码更简洁，但当导入的成员较多时来源会变得不清晰。需要多个成员时，建议显式列出每个名字，避免使用 `from module import *`。
:::

### 第3题 进阶练习

假设有如下包结构，`utils` 是一个包，`stats.py` 中定义了函数 `mean`。请写出四种不同的导入语句，分别用不同方式在 `main.py` 中调用 `mean([85, 90, 78])`，并说明每种写法的适用场景。

```
project/
    main.py
    utils/
        __init__.py
        stats.py
```

::: details 参考答案
```python
# 方式一：导入整个子模块，用完整路径访问
import utils.stats
utils.stats.mean([85, 90, 78])

# 方式二：导入子模块并起别名
import utils.stats as st
st.mean([85, 90, 78])

# 方式三：从包中导入子模块
from utils import stats
stats.mean([85, 90, 78])

# 方式四：从子模块导入具体函数
from utils.stats import mean
mean([85, 90, 78])
```

方式一路径完整，适合需要明确来源的大型项目。方式二用别名简化书写，适合模块名较长的情况。方式三省略顶层包名，代码较简洁。方式四最简洁，适合只用到模块中少数几个函数的场景。初学阶段建议统一使用绝对导入，可读性更好。
:::

### 第4题 项目实践

命令行任务管理器项目随着功能增加，代码会逐渐膨胀。请思考如何把这个项目拆分成多个模块，例如任务管理逻辑、文件存储逻辑、用户交互逻辑分别放在不同文件中。画出你设想的目录结构，并说明每个模块的职责。

::: details 参考答案
设想的项目结构：
```
task_manager/
    __init__.py
    main.py        # 程序入口，负责菜单显示和用户交互
    tasks.py       # 任务管理逻辑，定义任务的数据结构和增删改查
    storage.py     # 文件存储逻辑，负责任务数据的读写持久化
    display.py     # 输出格式化逻辑，负责菜单和任务列表的展示
```

`main.py` 是入口文件，通过 `import` 引入其他模块的函数，组织整体流程。`tasks.py` 只关心任务本身的逻辑，不涉及如何存储或显示。`storage.py` 只负责把任务数据写入文件或从文件读取。`display.py` 只负责把任务格式化输出给用户。

这种拆分让每个模块职责单一，修改存储方式时不必动任务逻辑，修改显示格式时不必动存储代码。后续章节学习函数和类后，可以在每个模块中进一步组织代码。
:::

## 常见错误

**错误 1 · `ModuleNotFoundError: No module named 'xxx'`**

原因:Python 在 `sys.path` 中找不到对应模块。常见情形是第三方库未安装、虚拟环境未激活导致找不到已安装的包，或自定义模块文件不在当前目录或搜索路径中。

解决:第三方库用 `pip install 包名` 安装；确认命令行提示符前有虚拟环境名（如 `(.venv)`），未激活则先激活；自定义模块要保证它与运行脚本在同一目录，或在 `sys.path` 包含的目录中。

**错误 2 · `自定义模块与标准库同名导致行为异常`**

原因:在当前目录建了 `math.py`、`random.py` 等与标准库同名的文件，Python 优先导入当前目录的文件，覆盖标准库。

解决:给自定义模块换一个不与标准库冲突的名字，例如 `my_math.py`、`utils_random.py`。报错现象通常是某个标准库函数突然不可用或行为异常，检查当前目录文件名即可定位。

**错误 3 · `ImportError: attempted relative import with no known parent package`**

原因:在包内部的模块中使用了相对导入（如 `from . import stats`），却用 `python utils/files.py` 直接运行该文件，相对导入依赖包上下文，直接运行时没有包信息。

解决:改用 `python -m utils.files` 以模块方式运行，让 Python 知道当前模块所属的包。或者把相对导入改为绝对导入（如 `from utils.stats import compute_mean`），绝对导入不依赖运行方式。

**错误 4 · `AttributeError: module 'xxx' has no attribute 'yyy'`**

原因:从模块中导入了不存在的成员，或导入后模块被同名变量覆盖。常见于 `from module import *` 后忘记了哪些名字可用，或用模块名作了变量名。

解决:用 `dir(模块名)` 查看模块实际导出的成员列表，确认名字拼写正确。避免使用 `from module import *`，改用显式导入具体名字，让来源和拼写都清晰可见。
