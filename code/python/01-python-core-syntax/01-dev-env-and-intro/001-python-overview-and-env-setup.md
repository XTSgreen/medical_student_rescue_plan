---
title: 1.1 Python概述与开发环境准备
sidebar:
  order: 1
---
# 1.1 Python概述与开发环境准备

<span class="chapter-tag">Python核心语法基础</span>

Python 是当下最流行的通用编程语言之一，在数据科学、人工智能、Web 开发和自动化运维等领域都有广泛应用。掌握 Python 意味着能够直接处理数据、构建自动化脚本、开发各类应用。本节将从 Python 的历史与定位讲起，逐步覆盖语言特点、应用领域、安装配置、包管理、虚拟环境与开发工具选择等内容，目标是让你读完这一节后能拥有一台配置完整、可直接编写代码的 Python 工作环境。

## Python 语言的发展历史与版本演进

### 诞生背景与版本时间线

Python 的诞生可以追溯到 1989 年的圣诞节。荷兰国家数学与计算机研究所的 Guido van Rossum 为了打发假期，开始编写一门新的脚本语言，并以自己喜爱的英国喜剧团体 Monty Python 命名为 Python。这门语言在 1991 年发布第一个公开版本，继承了 ABC 语言的简洁语法，又吸收了 C 和 Unix 工具链的实用主义风格。Guido 至今仍被社区尊称为 BDFL（仁慈的独裁者），虽然他在 2018 年已退居幕后，由选举产生的指导委员会接管语言演进。

Python 2.0 于 2000 年发布，引入了垃圾回收、列表推导式等特性，奠定了现代 Python 的语法基础。Python 3.0 于 2008 年发布，是一次不向后兼容的重大修订。2020 年 1 月 1 日，Python 官方正式停止对 Python 2 的维护，所有新项目都应基于 Python 3 开发。本教程全程使用 Python 3.x，对应到具体版本，推荐使用 3.10 及以上的稳定版本。

### Python 2 与 Python 3 的关键差异

Python 2 与 3 之间最大的隔阂在于不向后兼容，这意味着用 Python 2 写的代码无法直接在 Python 3 上运行。几处关键差异需要了解，因为你在查阅旧资料时仍会遇到它们。

第一处差异是打印语句。Python 2 中 `print` 是语句，写法是 `print "hello"`；Python 3 中 `print` 是函数，写法是 `print("hello")`，必须加括号。这看似只是语法糖的变化，背后反映了 Python 3 对一致性的追求：所有可调用的东西都应该是函数。

第二处差异是字符串编码。Python 2 默认使用 ASCII 字符串，处理中文等非 ASCII 字符时需要显式声明 `# -*- coding: utf-8 -*-`，并区分 `str` 和 `unicode` 两种类型；Python 3 默认使用 Unicode 字符串，所有文本都是 `str` 类型，字节流单独用 `bytes` 类型表示。这一改动让 Python 3 在处理多语言文本时更加自然，对处理中文文本、多语种内容尤为友好。

第三处差异是整数除法。Python 2 中 `/` 对两个整数做除法会截断小数部分，例如 `3 / 2` 结果是 `1`；Python 3 中 `/` 总是返回浮点数，`3 / 2` 结果是 `1.5`，需要整除时用 `//` 运算符。这一改动避免了大量隐式 bug。

```python
# Python 3 的除法语义
print(3 / 2)   # 1.5，真除法
print(3 // 2)  # 1，整除
print(3 % 2)   # 1，取余
```

::: note 关于版本号
Python 的版本号遵循 `主版本.次版本.修订号` 的规则。3.12.1 表示主版本 3、次版本 12、修订号 1。次版本号每年大约更新一次，带来新语法和标准库改进；修订号只修复 bug。生产环境建议选择次版本号较高的稳定版，比如 3.11 或 3.12，避免使用刚发布的次版本。
:::

## Python 语言特点

理解一门语言的特点，能帮助你在合适的场景下选择它。Python 有几个显著的设计取向，决定了它的优势与短板。

### 解释型与逐行执行

Python 是解释型语言，源代码不需要预先编译成机器码，而是由解释器逐行读取、翻译、执行。这带来的直接好处是开发反馈快：你写完一行代码立刻就能看到结果，特别适合交互式探索数据分析。代价是运行速度比编译型语言（如 C、Rust）慢，因为每次执行都要重新翻译。

Python 的官方解释器叫 CPython，用 C 语言编写，是绝大多数人接触的 Python。后面提到的"安装 Python"默认就是安装 CPython。除 CPython 外还有 PyPy（JIT 加速）、Jython（运行在 JVM 上）等实现，但日常使用无需关心。

### 动态类型

Python 采用动态类型系统，变量的类型在运行时确定，无需在代码中声明。同一个变量可以先存整数再存字符串：

```python
x = 42          # 此时 x 是整数
print(type(x))  # <class 'int'>
x = "hello"     # 此时 x 是字符串
print(type(x))  # <class 'str'>
```

动态类型的好处是写起来灵活，少写很多样板代码；代价是类型错误要到运行时才暴露，IDE 也难以做严格的静态检查。对于大型项目，可以用 `typing` 模块加类型注解缓解这一问题，但注解本身不强制执行，需要配合 mypy 等静态检查工具。


### 面向对象与一切皆对象

什么是对象？

对象是一块存在于内存中的数据实体，它把两样东西联系到一起：状态和行为；状态指的是“它是什么或者他有什么属性”，行为指的是“它能做什么”（方法）。例如，一个学生对象可能有姓名、年龄、性别等属性，也有如学习、考试等方法。

为什么要使用对象？

如果你只用面向过程（C语言风格）写代码，所有数据和过程散落在外，当项目超过几万行，改一个数据可能会导致十几个函数报错（当然也不好找）；当有了对象之后，你可以将一个物体的数据和操作该物体的方法捆绑在同一个对象中，后期维护时可以只修改对象内的逻辑不影响其他对象，这是构建大型、多人协作、高复杂度系统的基石

不同编程语言里的“对象”有什么不同？

基于类（Class-based）——如 Java、C++、C#：严格按“蓝图（类）”来生产“产品（对象）”。你必须先定义类，才能创建对象。这是目前最主流的模式。
基于原型（Prototype-based）——如 JavaScript：没有“类”的硬性约束（ES6的class只是语法糖）。你可以直接拿一个现有对象当“原型”，克隆出一个新对象，并随时给新对象增加或删除属性，极其灵活，但也容易失控。
动态与静态：在 Python/JS 中，你可以随时给对象动态绑定一个新属性（比如 person.newAttr = 123）；但在 Java/C++ 中，对象的属性在编译时就已经固定死，运行时无法新增。

Python 是一门纯面向对象语言，**一切皆对象**。整数、字符串、函数、类本身，都是对象，都有类型、属性和方法。这意味着你可以查询任何东西的类型和方法：

```python
# 整数也是对象，有自己的方法
n = 42
print(n.bit_length())  # 6，42 的二进制位数

# 函数也是对象，可以当参数传递
def greet(name):
    return f"Hello, {name}"

print(greet.__name__)   # greet，函数对象的名字属性
functions = [greet, print, len]  # 函数可以放进列表
```

Python 支持类、继承、多态等完整的面向对象特性，但不强制你写面向对象代码。简单的脚本可以直接写函数，无需定义类。这种务实态度让 Python 既能写大型系统，也能写一次性数据处理脚本。

### 可嵌入性与可扩展性

Python 可以嵌入到 C/C++ 程序中作为脚本扩展，也可以反过来用 C/C++ 为 Python 编写扩展模块。NumPy、Pandas 这些性能关键库的底层都是 C 实现的，通过扩展接口暴露给 Python 调用。这种机制让 Python 兼具易用性和性能：上层用 Python 写逻辑，性能瓶颈用 C 加速。

图像处理库如 OpenCV、科学计算库如 NumPy 的底层就是 C/C++，Python 只是调用层。这种组合让你能用简洁的 Python 代码完成复杂的数值计算，而无需关心底层实现。

### 缩进语法

Python 用缩进而非大括号表示代码块，这是它最显眼的语法特征。同一层级的代码必须有相同的缩进，通常是 4 个空格：

```python
# 缩进表示代码块
def classify(age):
    if age >= 60:
        return "老年"
    elif age >= 18:
        return "成年"
    else:
        return "未成年"

print(classify(65))
```

缩进语法的好处是强制代码格式统一，阅读时层次清晰；代价是复制粘贴代码时容易破坏缩进，导致 `IndentationError`。养成用 4 个空格、不混用 Tab 和空格的习惯，可以避免绝大多数缩进问题。

## Python 应用领域概览

Python 之所以流行，很大程度上是因为它的应用领域极广。下面几个方向覆盖了 Python 最常见的使用场景。

### Web 开发

Python 在 Web 后端开发中占有一席之地。主流框架有三类。Django 是全功能框架，自带 ORM、后台管理、用户认证，适合快速搭建中大型站点。Flask 是轻量框架，只提供路由和请求响应，其他组件按需引入，适合小型项目和微服务。FastAPI 是较新的框架，基于类型注解自动生成 API 文档，性能接近 Node.js，适合构建机器学习模型的服务接口。

信息系统、数据查询接口这类项目，常用 FastAPI 或 Flask 暴露 RESTful API，前端再独立开发。

### 数据分析

数据分析是 Python 最强势的领域之一。NumPy 提供多维数组和向量化运算，是几乎所有数值库的底层依赖。Pandas 提供数据框结构和数据清洗、聚合、透视等操作，类似 R 的 data.frame 但生态更广。Matplotlib 是基础绘图库，Seaborn 在其上封装了统计图表，Plotly 则提供交互式图表。

数据清洗、字段统计、指标分布可视化，这一类任务的标配是 Pandas 加 Matplotlib 或 Seaborn。

### 人工智能

深度学习领域 Python 几乎是事实标准。PyTorch 由 Meta 开源，动态图机制深受研究者欢迎，是图像分割、图像分类等学术研究的主流选择。TensorFlow 由 Google 开源，部署生态更成熟，工业界使用较多。Hugging Face Transformers 提供大量预训练模型，自然语言处理（如实体识别）常基于它做微调。

### 自动化脚本

Python 写自动化脚本非常顺手。文件批处理（重命名、格式转换）、网页爬虫（requests 加 BeautifulSoup）、Excel 自动化（openpyxl）、运维脚本（subprocess 调用系统命令）都是常见用途。

### 医学领域的典型应用

医学影像处理方面，pydicom 读写 DICOM 文件，SimpleITK 提供 ITK 的 Python 接口，MONAI 是专门面向医学影像的深度学习框架。生物信息学方面，Biopython 处理序列、Pysam 操作 BAM/VCF 文件、Scanpy 做单细胞转录组分析。数据分析方面，lifelines 做生存分析，statsmodels 做回归建模。本教程后续章节会逐步展开这些库的使用。

## 操作系统兼容性

Python 是跨平台语言，三大主流操作系统 Windows、macOS、Linux 都有完善的官方支持。同一份 Python 代码，在三个系统上通常都能直接运行，这是 Python 跨平台特性的核心优势。

不同系统的安装方式和命令略有差异。Windows 系统上安装后命令通常是 `python`；macOS 和 Linux 系统上，由于历史上系统自带的 Python 2 占用了 `python` 命令，Python 3 通常以 `python3` 命令存在。这一差异在 macOS Ventura 之后有所缓解，新版系统默认没有预装 Python，安装后通过 `python3` 调用。

路径分隔符是跨平台开发的一个常见坑。Windows 用反斜杠 `\` 分隔路径，例如 `C:\Users\user\data.csv`；macOS 和 Linux 用正斜杠 `/`，例如 `/home/user/data.csv`。Python 的 `pathlib` 模块封装了路径操作，能自动适配当前系统的分隔符，建议写跨平台脚本时优先使用：

```python
from pathlib import Path

# pathlib 会自动处理路径分隔符
data_dir = Path("data") / "user" / "sample.csv"
print(data_dir)  # Windows: data\user\sample.csv; macOS/Linux: data/user/sample.csv
```

## Python 解释器的安装

Python 解释器是把源代码翻译成机器行为的程序。安装 Python 本质上就是安装解释器。Python 解释器有两种主要来源：官方 CPython 和第三方发行版。两者都能运行 Python 代码，区别在于附带工具和包管理方式不同。

### CPython 官方解释器

CPython 是 Python 官方维护的参考实现，从 https://www.python.org/downloads/ 下载对应系统的安装包即可。下面分系统说明安装要点。

Windows 系统下载 `.exe` 安装包后运行，安装界面有两个关键选项需要勾选。第一个是 **Add Python to PATH**，位于安装界面底部。勾选后系统会自动配置环境变量，安装完就能在命令行直接调用 `python` 命令；不勾选则需要手动配置 PATH，对初学者是个坑。第二个是 **Install for all users**，建议勾选，避免后续权限问题。安装路径避免中文和空格，例如 `D:\Python312` 比 `C:\Program Files\Python312` 更省心。

macOS 系统有两种推荐方式。第一种是用 Homebrew 包管理器，命令是 `brew install python@3.12`，安装后通过 `python3` 调用。第二种是从官网下载 `.pkg` 安装包，双击按提示安装。Homebrew 方式更便于后续升级，建议优先采用。

Linux 系统大多数发行版预装了 Python 3，但版本可能偏旧。Ubuntu/Debian 用 `sudo apt install python3 python3-pip` 安装；CentOS/RHEL 用 `sudo yum install python3` 安装。需要特定版本时可以编译源码，但日常使用包管理器版本即可。

::: note 关于 32 位与 64 位
现代操作系统基本都是 64 位，下载安装包时选择 64 位版本即可。32 位版本主要用于老旧硬件或特殊嵌入式场景。判断系统位数：Windows 右键"此电脑"查看"属性"中的"系统类型"；macOS 和 Linux 几乎全部是 64 位。
:::

### Anaconda 与 Miniconda

Anaconda 是面向数据科学的 Python 发行版，由 Anaconda 公司（原名 Continuum Analytics）维护。它把 Python 解释器、conda 包管理器、几百个数据科学常用包（NumPy、Pandas、Scikit-learn、Jupyter 等）打包成一个安装包，安装完即可直接做数据分析，免去逐个安装包的麻烦。Anaconda 适合初学者和数据科学从业者，尤其是带宽充足、磁盘空间充裕的环境。安装包大约 800MB，安装后占用 3GB 以上磁盘空间。

Miniconda 是 Anaconda 的精简版，只包含 Python 解释器和 conda 包管理器，不预装任何第三方包。Miniconda 适合需要灵活控制环境的用户：先用 conda 创建虚拟环境，再按需安装包。安装包大约 80MB，磁盘占用取决于你装了多少包。

conda 与 pip 的关系值得说明。pip 是 Python 官方的包管理器，只能安装 Python 包；conda 是 Anaconda 的包管理器，既能装 Python 包，也能装 C 库、R 语言、二进制工具等非 Python 依赖。某些科学计算库（如 GDAL、CUDA toolkit）的非 Python 依赖用 pip 安装容易出错，用 conda 安装更省心。但 conda 的包仓库不如 pip 的 PyPI 全面，许多新发布的包只有 pip 版本。实际工作中两者常常混用：conda 管理环境和底层依赖，pip 安装上层 Python 包。

::: warning Anaconda 的潜在坑
Anaconda 安装后会把自家 base 环境设为默认 Python 环境，可能在命令行前显示 `(base)` 字样。这会影响系统其他 Python 工具的行为。安装后建议运行 `conda config --set auto_activate_base false` 关闭自动激活，需要时再手动激活。
:::

## 环境变量配置与安装验证

### PATH 环境变量配置

PATH 是操作系统的环境变量，告诉系统在哪些目录下查找可执行文件。当你在命令行输入 `python` 时，系统会按 PATH 列出的目录顺序查找 `python.exe`（Windows）或 `python`（macOS/Linux），找到第一个就执行。如果 PATH 中没有 Python 安装目录，命令行会报错 `command not found` 或 `'python' 不是内部或外部命令`。

Windows 安装时勾选 **Add Python to PATH** 会自动配置，这是最省事的方式。如果安装时忘记勾选，可以手动配置：右键"此电脑"进入"属性"→"高级系统设置"→"环境变量"，在用户变量或系统变量的 `Path` 中添加两个路径，一个是 Python 安装目录（如 `D:\Python312`），一个是 Scripts 子目录（如 `D:\Python312\Scripts`，pip 等工具在此）。修改后需要重新打开命令行窗口才生效。

macOS 和 Linux 通过修改 shell 配置文件设置 PATH。bash 用户编辑 `~/.bash_profile` 或 `~/.bashrc`，zsh 用户（macOS Catalina 后默认）编辑 `~/.zshrc`，在文件末尾添加一行：

```bash
export PATH="/usr/local/bin:$PATH"
```

修改后执行 `source ~/.zshrc`（或对应文件）让配置立即生效，或重新打开终端。

### 验证安装是否成功

安装完成后，打开命令行验证。Windows 按 `Win+R` 输入 `cmd` 打开命令提示符，或在开始菜单搜索"命令提示符"；macOS 和 Linux 打开"终端"应用。

第一步检查 Python 版本，输入 `python --version`（Windows）或 `python3 --version`（macOS/Linux），正常应输出类似 `Python 3.12.1` 的版本号。如果提示找不到命令，说明 PATH 配置有问题，回到上一节检查环境变量。

```bash
python --version
# Python 3.12.1
```

第二步进入交互式环境，输入 `python` 或 `python3`，看到 `>>>` 提示符即说明解释器正常工作。在交互式环境中可以直接输入 Python 代码并立即看到结果，输入 `exit()` 或按 `Ctrl+Z`（Windows）/ `Ctrl+D`（macOS/Linux）退出。

```python
# 在交互式环境中
>>> 2 + 3
5
>>> print("Hello, Python")
Hello, Python
>>> exit()
```

第三步检查 pip 是否可用，输入 `pip --version`（Windows）或 `pip3 --version`（macOS/Linux），应输出 pip 版本和对应 Python 路径。pip 不可用会导致后续无法安装第三方库，必须解决。

```bash
pip --version
# pip 24.0 from D:\Python312\Lib\site-packages\pip (python 3.12)
```

## 包管理工具 pip

### pip 的安装与升级

pip 是 Python 官方的包管理器，名字是递归缩写"pip installs packages"。它从 PyPI（Python Package Index，Python 包索引）下载并安装第三方包。PyPI 上目前有超过 50 万个包，覆盖了绝大多数常见需求。

Python 3.4 及以上版本自带 pip，安装解释器时 pip 会一并安装，无需单独获取。如果验证时发现 pip 不可用，可以用 `ensurepip` 模块引导安装：

```bash
python -m ensurepip --upgrade
```

pip 自身也需要升级。PyPI 上的包格式和元数据规范在不断演进，旧版 pip 可能无法安装新格式的包。升级 pip 用以下命令，`-m pip` 的写法保证调用的是当前 Python 对应的 pip，避免多版本 Python 环境下混淆：

```bash
python -m pip install --upgrade pip
```

::: note 为什么用 python -m pip
直接运行 `pip install` 时，`pip` 命令对应哪个 Python 解释器取决于 PATH 顺序，多版本环境下可能装错地方。`python -m pip` 显式指定"用当前 python 的 pip"，更安全。养成这个习惯能避免很多环境问题。
:::

### pip 常用命令

pip 的核心命令有几个，掌握这几个就能覆盖日常 90% 的需求。

安装包用 `pip install 包名`，默认安装最新稳定版：

```bash
pip install numpy
```

安装指定版本用 `==` 指定：

```bash
pip install numpy==1.26.0
```

从 requirements 文件批量安装，常用于复现他人项目环境：

```bash
pip install -r requirements.txt
```

卸载包用 `pip uninstall 包名`，会询问确认，加 `-y` 跳过确认：

```bash
pip uninstall numpy -y
```

列出当前环境已安装的所有包用 `pip list`：

```bash
pip list
# 输出示例：
# Package    Version
# ---------- -------
# numpy      1.26.0
# pandas     2.1.4
# pip        24.0
```

导出当前环境的包列表用 `pip freeze`，输出格式可以直接写入 requirements 文件：

```bash
pip freeze > requirements.txt
```

查看某个包的详细信息用 `pip show 包名`，包括版本、依赖、安装路径、主页等：

```bash
pip show numpy
# 输出包括 Name、Version、Summary、Home-page、Author、Location、Requires 等
```

国内访问 PyPI 速度较慢，建议配置镜像源。清华 TUNA 镜像是常用的国内源：

```bash
# 临时使用镜像源安装
pip install numpy -i https://pypi.tuna.tsinghua.edu.cn/simple

# 永久配置镜像源（写入 pip 配置文件）
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

## 虚拟环境管理

### 为什么需要虚拟环境

虚拟环境是 Python 项目管理中的核心概念。要理解它的必要性，先看一个常见场景。

假设你在做两个项目：项目 A 依赖 NumPy 1.20（旧版接口），项目 B 依赖 NumPy 1.26（新功能）。如果两个项目共用一个全局 Python 环境，装了 NumPy 1.26 后项目 A 跑不起来，降回 1.20 后项目 B 又跑不起来。这种依赖冲突在长期开发中几乎必然出现。

虚拟环境的思路是给每个项目配一个独立的包目录。激活某个虚拟环境后，`pip install` 安装的包只进入该环境的目录，不影响其他环境。全局 Python 只保留标准库和 pip，具体项目的依赖各自隔离。

::: note 与工作间类比
虚拟环境类似独立的工作间。每个项目（任务）有自己的工作间（虚拟环境），往里面放的工具（安装包）只影响该工作间，不会污染其他项目。如果不隔离，所有工具堆在一间屋子里共用，必然出问题。
:::

虚拟环境的另一个好处是可复现。把某个项目的依赖导出为 `requirements.txt`，到任何机器上用 `pip install -r` 都能复刻相同环境。这对论文复现、协作开发、部署上线都至关重要。

### 创建虚拟环境

Python 标准库自带 `venv` 模块创建虚拟环境，无需额外安装。在项目根目录执行：

```bash
# 在项目目录下创建名为 .venv 的虚拟环境
python -m venv .venv
```

`.venv` 是约定俗成的虚拟环境目录名，前导点号让它在文件管理器中默认隐藏，避免污染项目视图。这一命令会在 `.venv` 目录下复制一份 Python 解释器（实际上是软链接）和一份空的 pip，结构上与全局 Python 安装目录类似。

如果你使用 Anaconda 或 Miniconda，conda 也能创建虚拟环境，而且 conda 创建的环境可以指定不同版本的 Python：

```bash
# 创建名为 ml 的环境，指定 Python 3.11
conda create -n ml python=3.11

# 创建名为 webdev 的环境，指定 Python 3.10 并预装 numpy
conda create -n webdev python=3.10 numpy
```

venv 和 conda 的主要区别：venv 只能用当前 Python 版本创建环境，包管理只能用 pip；conda 能为不同环境指定不同 Python 版本，包管理用 conda，也能在环境内用 pip。日常小型项目 venv 足够，需要管理多个 Python 版本或复杂非 Python 依赖时用 conda。

### 激活与退出虚拟环境

虚拟环境创建后并不会自动启用，需要手动激活。激活的本质是把虚拟环境的目录临时插到 PATH 最前面，让 `python` 和 `pip` 命令优先指向虚拟环境的副本。

Windows 系统的激活命令：

```bash
# cmd 或 PowerShell
.venv\Scripts\activate
```

macOS 和 Linux 系统的激活命令：

```bash
source .venv/bin/activate
```

激活成功后，命令行提示符前会显示虚拟环境名，例如 `(.venv) C:\project>`。此时 `python` 和 `pip` 命令都指向虚拟环境内的版本，`pip install` 安装的包也只进入虚拟环境。

退出虚拟环境用 `deactivate` 命令，无需参数：

```bash
deactivate
```

退出后命令行提示符恢复原样，PATH 也回到全局状态。注意 `deactivate` 是激活时由虚拟环境注入的命令，未激活状态下执行会报错。

::: warning 不要把虚拟环境提交到版本库
`.venv` 目录通常有几十 MB 到几百 MB，包含大量二进制文件，不应提交到 Git。在项目根目录的 `.gitignore` 中添加 `.venv/` 一行，避免误提交。需要复现环境时，提交 `requirements.txt` 即可。
:::

### 在虚拟环境中安装第三方包

下面演示虚拟环境隔离的效果。先创建并激活一个虚拟环境，安装一个包，再创建第二个虚拟环境，对比两个环境的包列表。

```bash
# 创建第一个环境 env1
python -m venv env1
# Windows
env1\Scripts\activate
# macOS/Linux
source env1/bin/activate

# 在 env1 中安装 numpy
pip install numpy
pip list
# 输出：numpy、pip 两行

# 退出 env1
deactivate

# 创建第二个环境 env2
python -m venv env2
# Windows
env2\Scripts\activate
# macOS/Linux
source env2/bin/activate

# env2 中没有 numpy
pip list
# 输出：只有 pip 一行

deactivate
```

可以看到，env1 中安装的 numpy 在 env2 中完全不存在，两个环境互不干扰。这就是虚拟环境的核心价值。

日常开发的标准流程是：每个新项目创建一个虚拟环境，激活后用 `pip install` 安装依赖，开发过程中用 `pip freeze > requirements.txt` 记录依赖版本，项目完成或交付时把 `requirements.txt` 随代码一起提交。

## 集成开发环境与编辑器

### IDE 的概念与分类

写 Python 代码不一定需要专门工具，记事本加命令行就能跑。但日常开发几乎都会用专门的编辑工具，因为它们能提供语法高亮、自动补全、调试、跳转定义等功能，大幅提升效率。

工具大致分三类。**轻量级编辑器**只提供文本编辑能力，通过插件扩展功能，启动快、占用低，代表是 VS Code 和 Sublime Text。**全功能 IDE**（Integrated Development Environment，集成开发环境）内置完整工具链，包括调试器、项目管理、版本控制集成等，代表是 PyCharm 和 Spyder。**交互式环境**以单元格为单位执行代码，适合数据探索和分析，代表是 Jupyter Notebook。

选哪种工具取决于工作场景。写大型项目、需要调试和重构时用 PyCharm 或 VS Code；做数据分析、需要逐步执行和即时可视化时用 Jupyter；快速写脚本时任意编辑器都行。本教程后续涉及数据分析的章节会推荐 Jupyter，涉及工程代码的章节会推荐 PyCharm 或 VS Code。

### 常用 IDE 与编辑器介绍

**PyCharm** 由 JetBrains 公司出品，是 Python 生态中最老牌的全功能 IDE。Community 版免费，Professional 版付费但支持 Web 开发、数据库工具等高级功能。PyCharm 的强项是代码补全、重构、调试器、远程开发支持，对大型项目友好。弱点是启动慢、内存占用高，不适合老旧机器。

**VS Code** 由微软出品，是当下最流行的轻量级编辑器。本身只是个文本编辑器，通过安装扩展支持各种语言。Python 扩展由微软官方维护，提供补全、调试、Jupyter 集成、远程开发等功能。VS Code 启动快、扩展丰富、跨平台，是大多数新手的默认选择。

**Jupyter Notebook** 是数据分析领域的标准工具，以网页形式呈现，代码按单元格组织，每个单元格可以独立执行并立即显示结果。适合探索性分析、教学演示、报告撰写。缺点是不适合写大型工程代码，没有完整的项目结构。

**JupyterLab** 是 Jupyter Notebook 的升级版，界面更接近 IDE，支持多标签、文件浏览器、终端、变量检查器等。JupyterLab 已经是 Jupyter 项目的推荐前端，新项目建议直接用 JupyterLab。

**Spyder** 是科学计算导向的 IDE，界面类似 RStudio，包含变量浏览器、IPython 控制台、绘图面板。适合从 R 或 MATLAB 转过来的用户，Anaconda 默认安装。

**IDLE** 是 Python 自带的简易 IDE，安装 Python 后即可使用。功能简陋，仅适合临时写几行代码或教学演示，不建议日常使用。

### PyCharm 的安装与配置

PyCharm 从 JetBrains 官网下载：https://www.jetbrains.com/pycharm/download/。选择 Community Edition（免费版）即可满足本教程全部需求。安装按默认选项进行，建议勾选创建桌面快捷方式和关联 `.py` 文件。

首次启动 PyCharm 会询问是否导入设置，选 `Do not import settings`。然后接受隐私协议、选择主题（Dark 或 Light），进入欢迎界面。

创建新项目的步骤：点击 `New Project`，选择项目路径，PyCharm 会自动检测系统已安装的 Python 解释器。如果想用虚拟环境，勾选 `New environment using Virtualenv`，PyCharm 会自动创建 `.venv` 目录；如果想用已有解释器，选择 `Previously configured interpreter`。点击 `Create` 完成创建。

项目创建后进入主界面。左侧是项目文件树，右侧是代码编辑器，底部是终端和 Python 控制台。写代码时，PyCharm 会自动补全、检查语法错误、提示重构建议。运行代码点击右上角绿色三角形，或按 `Shift+F10`。

配置解释器的入口在 `File → Settings → Project: 项目名 → Python Interpreter`（Windows/Linux）或 `PyCharm → Preferences → Project: 项目名 → Python Interpreter`（macOS）。在这里可以切换项目使用的解释器，添加或删除包。

### VS Code 的安装与配置

VS Code 从微软官网下载：https://code.visualstudio.com/。安装按默认选项进行，建议勾选"添加到 PATH"选项，方便后续从命令行启动。

首次启动 VS Code 后，安装 Python 扩展。点击左侧活动栏的扩展图标（或按 `Ctrl+Shift+X`），搜索"Python"，安装由 Microsoft 发布的官方 Python 扩展。这个扩展提供语法高亮、智能补全、代码导航、调试、单元测试、Jupyter 支持等功能。

打开一个 Python 文件后，VS Code 右下角会显示当前解释器。点击可以选择其他解释器，包括系统 Python 和虚拟环境。如果项目目录下有 `.venv`，VS Code 通常会自动检测并推荐切换。

创建项目的工作流通常是：在文件管理器中新建项目文件夹，用 VS Code 打开该文件夹（`File → Open Folder`），按 `Ctrl+` 加反引号打开集成终端，在终端中创建虚拟环境、安装包、写代码。这种"文件夹即项目"的模式比 PyCharm 的项目管理轻量，适合中小型项目。

VS Code 的常用快捷键值得记几个：`Ctrl+Shift+P` 打开命令面板，`Ctrl+P` 快速打开文件，`Ctrl+` 加反引号切换终端，`F5` 启动调试，`F9` 切换断点。熟练后效率很高。

## Jupyter Notebook 与 JupyterLab

### Jupyter Notebook

Jupyter Notebook 是数据分析领域的标志性工具。名字来源于它支持的三种核心语言：Julia、Python、R。它的核心特征是**单元格（cell）**工作模式：代码按单元格组织，每个单元格可以独立执行，执行结果立即显示在单元格下方。这种模式非常适合数据探索，你可以逐步加载数据、清洗、分析、可视化，每一步都看到中间结果。

安装 Jupyter Notebook 用 pip：

```bash
pip install notebook
```

启动 Jupyter Notebook 的方式是命令行：

```bash
jupyter notebook
```

执行后终端会显示一系列日志，浏览器自动打开 `http://localhost:8888/tree`，显示当前目录的文件树。如果没有自动打开，手动复制终端中显示的 URL 到浏览器即可。

Jupyter Notebook 的界面主要有几部分。顶部是菜单栏，包含 File、Edit、View、Insert、Cell、Kernel、Help 等菜单。菜单栏下方是工具栏，提供常用操作的快捷按钮，如运行单元格、停止内核、重启内核、切换单元格类型。主体是单元格区域，每个单元格可以独立编辑和执行。

单元格有两种主要类型。**Code 单元格**用于写 Python 代码，执行后显示输出。**Markdown 单元格**用于写说明文字，支持 Markdown 语法，可以插入标题、列表、公式、图片。这种代码与说明交替的组织方式让 Notebook 天然适合做数据分析报告。

```python
# Code 单元格示例
import pandas as pd

# 模拟用户数据
data = pd.DataFrame({
    "user_id": ["U001", "U002", "U003"],
    "age": [45, 62, 38],
    "city": ["北京", "上海", "广州"]
})
data
```

执行上述单元格后，Notebook 会直接显示数据框的表格形式，比纯文本输出直观得多。这种即时可视化是 Jupyter 的核心优势。

::: note Kernel 的概念
Jupyter 后台运行着一个 Python 进程叫 Kernel，负责执行单元格代码。所有单元格共享同一个 Kernel，意味着前面单元格定义的变量在后面的单元格中可直接使用。如果代码陷入死循环，点击工具栏的"停止"按钮中断 Kernel；如果状态错乱，点"重启"清空所有变量重新开始。
:::

### JupyterLab

JupyterLab 是 Jupyter 项目的下一代界面，定位是 Jupyter Notebook 的升级版。它保留了 Notebook 的核心交互模式，同时提供更接近 IDE 的多标签界面、文件浏览器、终端、变量检查器、绘图查看器等。

安装 JupyterLab：

```bash
pip install jupyterlab
```

启动命令：

```bash
jupyter lab
```

浏览器打开后，JupyterLab 的界面比 Notebook 更丰富。左侧是活动栏，包含文件浏览器、运行中的内核、命令面板、打开的标签等。中间是主工作区，支持多标签，可以同时打开多个 Notebook、终端、文本文件。右侧可以拖出变量检查器、属性面板等。

JupyterLab 兼容 Notebook 文件格式（`.ipynb`），原有 Notebook 文件可以直接在 JupyterLab 中打开和编辑。新项目建议直接用 JupyterLab，它的功能更完整，界面更现代，是 Jupyter 官方的推荐选择。

## 远程开发环境配置

实际工作中，你可能需要在远程服务器上跑 Python 代码。常见场景包括：大规模数据存储在远程服务器上、深度学习训练需要 GPU 服务器、数据分析需要集群算力。这种情况下需要在本地编辑器连接远程环境开发。

最基础的方式是 SSH 连接。SSH（Secure Shell）是远程登录协议，命令格式 `ssh username@server_ip`，输入密码后即可在远程服务器的终端中操作。在 SSH 终端中可以用 vim 或 nano 编辑代码，用 `python script.py` 运行。这种方式适合简单任务，但编辑体验不如本地 IDE。

VS Code 提供了 Remote SSH 扩展，能让你像编辑本地文件一样编辑远程文件。安装方法：在 VS Code 扩展市场搜索"Remote - SSH"并安装。使用步骤：按 `Ctrl+Shift+P` 打开命令面板，输入 `Remote-SSH: Connect to Host`，输入 `username@server_ip`，VS Code 会在远程服务器上安装一个代理进程，然后在新窗口中打开远程目录。此后所有编辑、运行、调试都在远程服务器上发生，但操作体验与本地完全一致。安装在该远程环境下的 Python 扩展也能正常工作。

PyCharm 的远程开发通过配置远程解释器实现。Professional 版支持此功能，Community 版不支持。配置入口在 `File → Settings → Project → Python Interpreter → Add Interpreter → On SSH`，填入 SSH 主机、用户名、密码或密钥，选择远程服务器上的 Python 解释器路径。配置完成后，PyCharm 会自动同步本地项目文件到远程服务器，运行和调试都在远程执行。

::: note SSH 密钥登录
频繁输入密码很麻烦，建议配置 SSH 密钥登录。本地执行 `ssh-keygen` 生成密钥对，把公钥（`id_rsa.pub`）追加到远程服务器的 `~/.ssh/authorized_keys` 文件中。此后 SSH 登录免密码，VS Code Remote SSH 也能直接连接。
:::

远程开发还需要注意几个细节。一是网络稳定性，断线会导致编辑器与远程连接中断，VS Code 通常能自动重连，PyCharm 需要手动重新同步。二是文件同步策略，VS Code Remote SSH 是直接在远程文件上操作，不存在同步问题；PyCharm 需要手动或自动同步本地与远程文件，注意避免覆盖。三是远程环境配置，远程服务器上也需要安装 Python 解释器、虚拟环境、所需依赖包，与本地配置流程一致。

到本节结束，你应该已经拥有一台配置完整的 Python 工作环境：解释器安装好、pip 可用、虚拟环境会建会激活、IDE 顺手。下一节我们将正式开始 Python 语法的学习，从变量、数据类型与运算符讲起。
