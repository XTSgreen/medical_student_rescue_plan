---
title: 1.1 R 语言基础与设计哲学
sidebar:
  order: 1
---
# 1.1 R 语言基础与设计哲学

R 语言是专门为统计学设计的语言，这个出身决定了它的基本特性：它把数据当作一等公民，把统计函数当作内置工具，把向量化运算当作默认的思考方式。本节将从 R 的设计理念切入，融合向量化思维这一贯穿全书的编程思想，再逐步展开数据类型、数据结构、运算规则与工程实践四个层面。理解R的关键在于接受它数据优先的基本特性

## 1.1.1 R 的诞生与定位

### 统计学家写给统计学家的语言

R 的历史可以追溯到 1976 年贝尔实验室的 S 语言。John Chambers 和他的同事们设计 S 的初衷很朴素：让统计学家不用写 Fortran 就能完成数据分析。1993 年，Ross Ihaka 和 Robert Gentleman 在新西兰奥克兰大学用 S 的语法思想重新实现了一个开源版本，取两人名字的首字母命名为 R。这段血统决定了 R 与 Python、Java 这类通用语言的根本差异：R 从第一天起就是为数据分析量身定做的。

通用语言处理数据需要外挂库。Python 的数据分析能力几乎全部来自第三方库：例如NumPy 提供数值数组，pandas 提供数据框，matplotlib 提供绘图，scipy 提供统计函数。这些库是优秀的，但它们是嫁接到语言之上的。R 则相反，数据框、向量、因子、统计分布、绘图设备都是语言的原生部分。例如`mean(x)` 等用于统计分析的函数等在R中是作为默认行为存在的，不需要任何调用。

这种统计原生的设计带来了一个显著的优势：R 在统计建模、生物信息学、临床试验数据分析这些领域有着不可替代的地位。Bioconductor 项目（R 的生物信息学包生态）提供了从基因表达分析到流式细胞术的全套工具链，这些工具的底层都假设用户使用 R 的数据结构。当你后续学习转录组学分析时，几乎每一步操作都建立在 R 的数据框和向量之上。

### R 与通用语言的定位差异

R 并非要取代 Python，二者擅长的问题域不同。下表给出一个粗略的对照：

| 维度     | R                              | Python                 |
| -------- | ------------------------------ | ---------------------- |
| 设计目标 | 统计分析与数据可视化           | 通用编程               |
| 数据结构 | 原生向量、数据框、因子         | 依赖 NumPy/pandas      |
| 向量化   | 语言内置，默认行为             | 依赖 NumPy，需显式调用 |
| 统计函数 | 原生`mean`/`sd`/`t.test` | 依赖 scipy.stats       |
| 绘图     | 原生`plot`/ggplot2           | 依赖 matplotlib        |
| 部署场景 | 分析报告、研究脚本             | 生产系统、Web 后端     |
| 性能     | 解释执行，C/Fortran 底层       | 解释执行，C 底层       |

这个对照不是要分高下。在实际的生物信息学工作流中，R 负责统计建模与可视化，Python 负责数据处理与机器学习，两者常常并存。本教程以 R 为主线，关键概念处会附 Python 对照，帮助你建立两种语言的映射。

::: note 关于原生一词的含义
当我们说 R 的向量是原生的，意思是向量运算直接由 R 解释器的 C 底层执行，不经过任何中间层。而 Python 的向量化需要先 `import numpy`，再把列表转换成 `np.array`，调用 numpy 的 C 扩展完成运算。两者虽然最终都依赖 C 底层的数值库，但 R 省去了切换到数值库这一认知开销。
:::

## 1.1.2 环境搭建：R 引擎与 RStudio IDE

### R 与 RStudio 的分工

R 是一门语言，RStudio 是一个 IDE（集成开发环境）。这个区分类似 Python 与 PyCharm 的关系：你可以只用命令行的 R 运行代码，但 RStudio 让这个过程更顺畅。必须先安装 R 引擎，再安装 RStudio，相对应的，RStudio 只是一个开发工具，没有 R 它什么都做不了。

R 的安装包从 CRAN（Comprehensive R Archive Network）下载，地址是 https://cran.r-project.org/。  选择对应操作系统的版本，按默认选项安装即可。注意安装路径避免中文和空格，这是所有编程工具的通用建议。

RStudio 从 Posit 公司官网下载：https://posit.co/download/rstudio/。 选择免费的 Desktop 版本即可。

### RStudio 的四面板工作流

RStudio 打开后默认显示四个面板，理解它们的协作方式能让你的工作流顺畅许多。

左上是**脚本编辑器**，用于编写和保存 `.R` 文件。选中代码按 `Ctrl+Enter` 可以把当前行或选中块发送到控制台执行。这个编辑到发送到执行的循环是 R 交互式编程的核心。

左下是**控制台**，直接执行 R 代码并立即显示结果。控制台适合做快速验证，但代码不会被保存。正式的分析代码应该写在脚本编辑器里。

右上是**环境面板**，显示当前内存中的所有变量、数据框、函数。这一栏是 R 区别于 Python 的一个贴心设计：你随时能看到 `x` 是什么类型、有多少行、什么结构。History 标签记录执行过的命令。

右下是**多用途面板**，包含 Files（文件管理）、Plots（图形预览）、Packages（包管理）、Help（帮助文档）、Viewer（HTML 内容预览）。其中 Help 标签特别重要——在控制台输入 `?mean` 就会在这里显示 `mean` 函数的文档。

### 项目管理：.Rproj 文件

RStudio 的项目功能通过 `.Rproj` 文件实现。一个项目对应一个文件夹，里面存放代码、数据、输出。打开 `.Rproj` 文件时，RStudio 会自动把工作目录设为该文件夹，避免相对路径混乱。

创建项目的步骤：`File → New Project → New Directory → New Project`，输入项目名和路径即可。建议每个分析任务单独建一个项目，比如 `rna-seq-analysis/`、`clinical-trial/`。这样做的好处是项目之间环境独立，代码和数据放在一起，便于分享和版本管理。

工作目录是 R 读写文件的默认位置。用 `getwd()` 查看当前目录，用 `setwd()` 修改。但在项目模式下，工作目录会自动设好，一般不需要也不建议手动调用 `setwd()`这条命令会导致你的脚本在不同的机器上运行时失效。

```r
# 查看当前工作目录
getwd()

# 读取项目内 data/ 子目录的 CSV 文件
# 相对路径基于工作目录，项目模式下推荐这种写法
df <- read.csv("data/expression.csv")
```

对应的 Python 写法需要先 `import pandas`，路径处理则依赖 `os` 或 `pathlib`：

```python
import pandas as pd
from pathlib import Path

# Python 需要显式构造路径，相对路径基于脚本运行位置
df = pd.read_csv("data/expression.csv")
```

## 1.1.3 向量化思维

### 标量循环与向量运算

向量化是 R 与 Python 在编程范式上最显著的差异

考虑一个简单任务：把一组基因表达量从 log2 值转换回原始值（2 的幂）。用 Python 的列表写法，你需要循环遍历每个元素：

```python
# Python：标量循环写法
log2_values = [3.2, 5.1, 2.8, 4.5, 6.0]
original = []
for v in log2_values:
    original.append(2 ** v)
# [9.19, 34.30, 6.96, 22.63, 64.0]
```

用 NumPy 可以向量化：

```python
import numpy as np
log2_arr = np.array([3.2, 5.1, 2.8, 4.5, 6.0])
original = 2 ** log2_arr  # 向量化运算
```

用 R 写，向量化是默认行为，不需要任何库：

```r
# R：向量化是语言原生行为
log2_values <- c(3.2, 5.1, 2.8, 4.5, 6.0)
original <- 2 ^ log2_values
# [1]  9.189586 34.297483  6.964405 22.627417 64.000000
```

`c()` 是 R 的合并函数（combine），把多个值拼成向量。`2 ^ log2_values` 这一行代码对整个向量做逐元素的幂运算，底层由 C 执行，没有中间层的插入意味着更快的运行和分析速度，当然，随着python的发展也有大量专注于性能提升的包出现，例如cython，但是既然我们是R教程就暂且按下不表。

### 循环补齐：向量与标量的运算规则

R 的向量化有一条重要规则：当两个长度不等的向量参与运算时，短向量会被循环补齐到长向量的长度。最常见的是向量与标量（长度为 1 的向量）的运算：

```r
x <- c(1, 2, 3, 4, 5)
x * 2          # 标量 2 补齐为 c(2,2,2,2,2)
# [1]  2  4  6  8 10

x + 10         # 标量 10 补齐为 c(10,10,10,10,10)
# [1] 11 12 13 14 15
```

如果短向量长度不是长向量长度的整数倍，R 会给出警告但仍执行：

```r
c(1, 2, 3) + c(10, 20)   # 长度 3 不是 2 的整数倍
# [1] 11 22 13
# Warning message: longer object length is not a multiple of shorter object length
```

这里的运算过程是 `c(1,2,3) + c(10,20,10)`——短向量 `c(10,20)` 循环补齐成 `c(10,20,10)`，然后逐元素相加。循环补齐在向量化运算中极为常用，比如给数据框的每一列乘以不同的权重。

Python 的 NumPy 有类似机制叫广播（broadcasting），但语义更严格：维度必须满足特定规则，否则报错。R 的循环补齐更宽松，这也是它统计原生的某种体现：统计计算中经常遇到不等长向量的运算。

::: warning 循环补齐的陷阱
循环补齐虽然方便，但当两个向量长度刚好成倍数关系时，R 不会警告，可能导致静默错误。例如你想给两列数据各乘一个权重，却误写成 `c(1,2,3,4) * c(10,20)`，R 会把 `c(10,20)` 补齐成 `c(10,20,10,20)` 静默执行。养成检查向量长度的习惯，能避免这类 bug。
:::

### 向量化的性能含义

向量化不只是写法简洁，它直接关系到性能。R 是解释执行的语言，`for` 循环每次迭代都要经过解释器开销。而向量化运算直接调用 C 层的循环，速度可以快几十倍。

下面是一个对照实验：对 100 万个随机数取平方。

```r
# R：循环写法
x <- runif(1e6)
result_loop <- numeric(1e6)
system.time({
  for (i in 1:1e6) {
    result_loop[i] <- x[i] ^ 2
  }
})
#    user  system elapsed
#   0.34    0.00    0.34   （约 340 毫秒）

# R：向量化写法
system.time({
  result_vec <- x ^ 2
})
#    user  system elapsed
#   0.00    0.00    0.00   （不到 10 毫秒）
```

性能差距来自解释器开销。`for` 循环里每一次 `result_loop[i] <- x[i] ^ 2` 都要经过 R 解释器的类型检查、下标越界检查、赋值操作。向量化版本把整个循环下放到 C 层，跳过了这些检查。

这并不意味着 `for` 循环在 R 中不能用。当循环次数少、或者每一步有复杂的副作用时，`for` 循环仍然清晰可读。但处理大量数据时，优先寻找向量化的写法。后续章节会介绍 `apply` 家族、`purrr::map` 等函数式工具，它们本质上是向量化思维的延伸。

## 1.1.4 赋值与运算

### 赋值符号的设计

R 的赋值符号是 `<-`，而不是多数语言用的 `=`。这个符号源自 1970 年代的 APL 语言，箭头形象地表示把右边的值赋给左边。`=` 在 R 中也能赋值，但社区约定用 `<-`。主要原因有二：一是 `<-` 在代码中更显眼，便于区分赋值与函数参数传递；二是 `=` 在函数调用中表示参数绑定（`mean(x = 1:10`），用它赋值会在某些场景产生歧义。

```r
# 推荐写法
gene_count <- 12500

# 也能工作，但不符合社区约定
gene_count = 12500

# 右向赋值（少用，但偶尔在管道中见到）
12500 -> gene_count

# 多重赋值（R 没有原生支持，这是常见误写）
# a, b <- 1, 2  # 错误，R 不支持这种语法
```

Python 的对照：Python 用 `=` 赋值，支持多重赋值 `a, b = 1, 2`，R 需要分两行写。

### 算术与逻辑运算

R 的算术运算符与 Python 基本一致，唯一需要注意的是整数除法和幂运算的写法：

```r
# 算术运算
10 + 3    # 13
10 - 3    # 7
10 * 3    # 30
10 / 3    # 3.333333，始终返回浮点数
10 %/% 3  # 3，整数除法（Python 的 //）
10 %% 3   # 1，取余（Python 的 %）
10 ^ 3    # 1000，幂运算（Python 的 **）
```

逻辑运算符有一个 R 特有的设计：单符号 `&` `|` 是向量化运算，双符号 `&&` `||` 只取第一个元素。这个区分在 `if` 条件判断中很重要：

```r
x <- c(TRUE, FALSE, TRUE)

# 向量化逻辑运算：对每个元素独立运算
x & c(FALSE, TRUE, TRUE)   # FALSE FALSE TRUE
x | c(FALSE, TRUE, TRUE)   # TRUE TRUE  TRUE

# 标量逻辑运算：只看第一个元素，用于 if 条件
x && c(FALSE, TRUE, TRUE)  # FALSE（只比较第一个）
x || c(FALSE, TRUE, TRUE)  # TRUE（只比较第一个）
```

Python 的 `and` `or` 是标量运算符，对整个对象求布尔值。NumPy 的 `&` `|` 是向量化的，但要求两侧都是布尔数组。R 把这两种模式都内建到语言里了。

### 运算的向量化行为

R 的运算符本质上是函数。`+` 是函数 `"+"()` 的语法糖，`^` 是 `"^"()`。这意味着它们自动获得向量化行为——对向量的每个元素独立应用。统计函数同样如此：

```r
scores <- c(85, 92, 78, 88, 95)

# 统计函数自动向量化
mean(scores)    # 87.6，均值
sd(scores)      # 6.50，标准差
median(scores)  # 88，中位数
range(scores)   # 78 95，最小最大值
quantile(scores, c(0.25, 0.75))  # 81.5 90.5，四分位数

# 数学函数也对向量逐元素作用
log(scores)      # 对每个值取自然对数
sqrt(scores)     # 对每个值开方
round(scores, 1) # 保留一位小数
```

Python 的对照需要导入库：

```python
import numpy as np
scores = np.array([85, 92, 78, 88, 95])

np.mean(scores)
np.std(scores, ddof=1)   # 注意 ddof 参数
np.median(scores)
np.percentile(scores, [25, 75])

np.log(scores)
np.sqrt(scores)
np.round(scores, 1)
```

对照可见，作为统计学原生的语言， R 的统计函数命名更简洁（`sd`  对比 `np.std`），且默认参数更贴近统计学习惯（R 的 `sd` 默认用 n-1 作分母，Python 需要显式指定 `ddof=1`）。

## 1.1.5 数据类型

### 基本类型与隐式转换

R 的基本数据类型有四种：数值（numeric）、字符（character）、逻辑（logical）、整数（integer）。其中数值默认是双精度浮点数，加 `L` 后缀才表示整数。这与 Python 不同——Python 区分 `int` 和 `float`，且 `int` 可以无限大。

```r
# 数值（默认双精度）
x <- 3.14
typeof(x)    # "double"

# 整数（需要 L 后缀）
n <- 100L
typeof(n)    # "integer"

# 字符
gene <- "BRCA1"
typeof(gene) # "character"

# 逻辑
is_expressed <- TRUE
typeof(is_expressed)  # "logical"
```

类型转换有一套隐式规则：逻辑 < 整数 < 数值 < 字符。当不同类型出现在同一向量里时，R 会把它们统一到最高的类型。

```r
# 逻辑与数值混合：逻辑转为数值（TRUE→1, FALSE→0）
c(TRUE, FALSE, 3.14)     # 1.00 0.00 3.14

# 数值与字符混合：数值转为字符
c(1, 2, "three")         # "1" "2" "three"
```

Python 的列表可以混合类型而不转换，这是动态语言的特性。但 R 的向量是同质的：一个向量只能存一种类型。这个限制看似严格，实则是性能与正确性的保障：同质向量可以连续存储在内存中，C 层运算不需要类型检查。

### 因子：分类数据的语言级支持

因子（factor）是 R 独有的类型，用于表示分类数据。Python 没有对应的原生类型，pandas 的 `Categorical` 是后加的模仿。

为什么 R 要专门设计一个类型来表示分类？因为统计建模中分类变量有特殊的处理方式。线性回归里，分类变量需要编码成哑变量（dummy variable）；方差分析中，分类变量决定分组。R 的因子把这些元信息内置到数据本身。

```r
# 创建无序因子：治疗分组
treatment <- factor(c("control", "drug_A", "drug_B", "control", "drug_A"))
treatment
# [1] control drug_A  drug_B  control drug_A 
# Levels: control drug_A drug_B

# 查看水平（所有可能的类别）
levels(treatment)   # "control" "drug_A" "drug_B"

# 创建有序因子：疾病严重程度
severity <- factor(c("mild", "severe", "moderate", "mild"),
                   levels = c("mild", "moderate", "severe"),
                   ordered = TRUE)
severity
# [1] mild    severe  moderate mild   
# Levels: mild < moderate < severe

# 有序因子可以比较大小
severity[1] < severity[2]   # TRUE（mild < severe）
```

因子的底层是整数向量加上一个水平属性。`c("mild", "severe")` 在内存中存为 `c(1, 3)`，配上一张映射表 `1→mild, 2→moderate, 3→severe`。这种存储方式既节省内存，又便于统计模型调用。

在这里提示一个初学者常犯的一个错误：用 `c()` 合并因子时，因子会被转成字符。正确做法是用 `unlist(list(f1, f2))` 或 `forcats::fct_c()`。

### 缺失值：NA 的哲学

R 用 `NA` 表示缺失值，这是一个特殊的标记，表示这里本该有值但没有。Python 用 `None` 表示空对象，用 `NaN` 表示非数值，两者含义不同。R 的 `NA` 统一覆盖了**缺失**这一语义。

```r
# 含缺失值的向量
expression <- c(5.2, NA, 3.8, NA, 7.1)

# NA 的传播规则：NA 参与运算结果仍是 NA
expression + 1          # 6.2 NA 4.8 NA 8.1
mean(expression)        # NA（默认不忽略 NA）

# na.rm = TRUE 显式忽略 NA
mean(expression, na.rm = TRUE)   # 5.366667

# 检测缺失值
is.na(expression)       # FALSE TRUE FALSE TRUE FALSE
sum(is.na(expression))  # 2，缺失值个数
```

`na.rm = TRUE` 这个参数体现了 R **显式优于隐式** 的设计哲学。默认情况下 `mean()` 遇到 NA 返回 NA，强迫你意识到数据有缺失。想要忽略必须显式声明。这个设计避免了统计计算中**静默丢弃数据**的隐患。

Python 的 pandas 默认会跳过 NaN（`df.mean()` 默认 `skipna=True`），行为相反。两种设计各有道理：R 更保守，pandas 更方便。理解这个差异，能避免从 Python 切换到 R 时的困惑。

除了 `NA`，R 还有两个特殊值：`NULL` 表示空对象（长度为 0），`NaN` 表示非数值（0/0 的结果），`Inf` 表示无穷（1/0 的结果）。

```r
NULL          # 空对象
length(NULL)  # 0

NA            # 缺失值
length(NA)    # 1

0 / 0         # NaN
1 / 0         # Inf
```

## 1.1.6 数据结构

### 向量：R 的基本单位

向量是 R 最基本的数据结构。前面已经用过多次，这里系统梳理它的创建、索引与命名。

创建向量有三种主要方式：`c()` 合并、`seq()` 生成序列、`rep()` 重复。

```r
# c() 合并已知值
genes <- c("BRCA1", "TP53", "EGFR", "KRAS")

# seq() 生成序列
seq(1, 10, by = 2)           # 1 3 5 7 9
seq(1, 10, length.out = 5)   # 1 3.25 5.5 7.75 10

# 简写：整数序列
1:5                          # 1 2 3 4 5

# rep() 重复
rep(c("A", "B"), times = 3)  # A B A B A B
rep(c("A", "B"), each = 2)   # A A B B
```

索引用方括号，支持正整数、负整数、逻辑值、名称四种方式。这套索引语法在后续的数据框、列表中会反复出现。

```r
scores <- c(math = 85, english = 92, biology = 78, chemistry = 88)

# 正整数索引
scores[1]          # 85，第一个元素
scores[c(1, 3)]    # 85 78，第一和第三个

# 负整数索引：排除
scores[-1]         # 92 78 88，排除第一个
scores[-c(1, 2)]   # 78 88，排除前两个

# 逻辑索引：筛选
scores[scores > 85]   # 92 88

# 名称索引
scores["biology"]     # 78
scores[c("math", "biology")]  # 85 78
```

Python 的对照：NumPy 数组用 `[0]` 索引（从 0 开始），R 用 `[1]`（从 1 开始）。pandas 的 Series 支持标签索引，与 R 的命名向量类似。注意 R 索引从 1 开始这个差异，碎碎念一下这是从 Fortran 继承的传统，由此可以看出史山无处不在

### 矩阵与数组

矩阵是二维同质数据结构，数组是更高维的推广。它们本质上是向量加上维度属性。

```r
# 创建矩阵
# nrow 指定行数，数据默认按列填充
expr_matrix <- matrix(c(5, 8, 3, 7, 6, 9), nrow = 2)
expr_matrix
#      [,1] [,2] [,3]
# [1,]    5    3    6
# [2,]    8    7    9

# 设置行列名
rownames(expr_matrix) <- c("sample1", "sample2")
colnames(expr_matrix) <- c("geneA", "geneB", "geneC")

# 索引：[行, 列]
expr_matrix["sample1", "geneB"]   # 3
expr_matrix[1, ]                  # 5 3 6，第一行
expr_matrix[, 2]                  # 3 7，第二列
```

矩阵运算有两条容易混淆的路径：`*` 是逐元素相乘，`%*%` 是矩阵乘法。这与 Python/NumPy 不同——NumPy 的 `*` 是逐元素，`@` 才是矩阵乘法。

```r
A <- matrix(c(1, 2, 3, 4), nrow = 2)
B <- matrix(c(5, 6, 7, 8), nrow = 2)

A * B     # 逐元素相乘
#      [,1] [,2]
# [1,]    5   21
# [2,]   12   32

A %*% B   # 矩阵乘法
#      [,1] [,2]
# [1,]   23   31
# [2,]   34   46

t(A)      # 转置
diag(A)   # 对角线
```

数组是矩阵的高维推广，通过 `dim` 参数指定每个维度的长度。在生物信息学中，三维数组常用于存储多通道图像数据或多个样本的基因表达矩阵。

### 列表

向量要求所有元素同类型，列表则允许混合类型。列表是 R 中最灵活的数据结构，相当于 Python 的字典，但键是有序的整数索引（可以附加名字）。

```r
# 列表可以包含不同类型、不同长度的元素
patient <- list(
  id = "P001",
  age = 45,
  diagnosis = c("hypertension", "diabetes"),
  lab_results = data.frame(
    test = c("glucose", "cholesterol"),
    value = c(126, 210)
  )
)

# 索引：[] 返回子列表，[[]] 或 $ 返回元素本身
patient["age"]          # 列表，长度 1
patient[["age"]]        # 数值 45
patient$age             # 数值 45（等价于上一行）

# 嵌套列表访问
patient$lab_results$value   # 126 210
```

`[]` 与 `[[]]` 的区分是 R 列表索引的要点。`[]` 永远返回同类型的容器（列表取子集仍是列表），`[[]]` 跨越容器取出内容。这条规则也适用于向量——`vec[1]` 返回长度 1 的向量，`vec[[1]]` 返回单个元素。

列表在 R 的生态中地位特殊：统计模型的返回值几乎都是列表。`lm()` 返回的回归结果是一个列表，包含系数、残差、R 方等组件。`t.test()` 的返回值也是列表，包含统计量、p 值、置信区间。理解列表的索引方式是阅读 R 统计函数文档的前提。

### 数据框

数据框（data frame）是 R 中最常用的数据结构，相当于一张 Excel 表格：每列是一个变量（可以是不同类型），每行是一个观测。它是**等长向量的列表**——技术上 `data.frame` 继承自 `list`，但约束每列长度相同。

```r
# 创建数据框
patients <- data.frame(
  id = c("P001", "P002", "P003"),
  age = c(45, 62, 38),
  treatment = factor(c("drug_A", "control", "drug_A")),
  response = c(0.85, 0.32, 0.71)
)

# 查看结构
str(patients)
# 'data.frame': 3 obs. of  4 variables:
#  $ id       : chr  "P001" "P002" "P003"
#  $ age      : num  45 62 38
#  $ treatment: Factor w/ 2 levels "control","drug_A": 2 1 2
#  $ response : num  0.85 0.32 0.71

# 统计摘要
summary(patients)
#       id                age         treatment    response   
# Length:3           Min.   :38.0   control:1   Min.   :0.320  
# Class :character   1st Qu.:41.5   drug_A :2   1st Qu.:0.515  
# Mode  :character   Median :45.0               Median :0.710  
#                     Mean   :48.3               Mean   :0.627  
#                     3rd Qu.:53.5               3rd Qu.:0.780  
#                     Max.   :62.0               Max.   :0.850
```

数据框的索引继承了向量、矩阵、列表的全部语法，这是它强大也是它混乱的根源。同一个目标可以用多种写法达成：

```r
# 取列（返回向量）
patients$age            # 列表语法
patients[["age"]]       # 列表语法
patients[, "age"]       # 矩阵语法

# 取列（返回数据框）
patients["age"]         # 列表语法，单列数据框
patients[, "age", drop = FALSE]  # 矩阵语法，保留数据框

# 取行
patients[1, ]           # 第一行
patients[patients$age > 40, ]    # 筛选行

# 取单元格
patients[1, "age"]      # 45
```

`drop = FALSE` 这个参数需要提起注意。默认情况下，单列数据框用矩阵语法取出会**降维**成向量。这在写函数时容易引发 bug——传进来的数据框取一列后变成了向量，后续代码假设它是数据框就会出错。`drop = FALSE` 强制保留数据框类型。

Python pandas 的 DataFrame 在设计上参考了 R 的数据框，两者语法有很多对应关系：

```python
import pandas as pd

patients = pd.DataFrame({
    "id": ["P001", "P002", "P003"],
    "age": [45, 62, 38],
    "treatment": ["drug_A", "control", "drug_A"],
    "response": [0.85, 0.32, 0.71]
})

patients["age"]              # 对应 R 的 patients$age
patients.loc[patients["age"] > 40, :]  # 对应 R 的 patients[patients$age > 40, ]
patients.describe()          # 对应 R 的 summary(patients)
```

R 与 pandas 的主要差异在索引：R 用 `[行, 列]` 一套语法走到底，pandas 区分 `.loc`（标签）和 `.iloc`（位置）。R 的语法更统一，pandas 的语义更清晰。

## 1.1.7 函数与包管理

### 函数定义与调用

R 的函数定义语法与 Python 类似，但参数传递有独特设计。

```r
# 定义函数
calc_bmi <- function(weight_kg, height_m) {
  bmi <- weight_kg / height_m ^ 2
  return(bmi)
}

# 调用：位置参数
calc_bmi(70, 1.75)   # 22.85714

# 调用：命名参数（推荐，参数多时更清晰）
calc_bmi(weight_kg = 70, height_m = 1.75)

# 调用：参数顺序可变
calc_bmi(height_m = 1.75, weight_kg = 70)
```

R 函数的参数匹配支持位置与命名混合，且命名参数可以部分匹配（如 `weight = 70` 匹配 `weight_kg`），但部分匹配在严格编程中不推荐，容易引发歧义。

函数可以设置默认参数值：

```r
# 带默认参数的函数
standardize <- function(x, center = TRUE, scale = TRUE) {
  if (center) x <- x - mean(x, na.rm = TRUE)
  if (scale)  x <- x / sd(x, na.rm = TRUE)
  x
}

# 只修改 scale 参数，center 用默认值
standardize(c(1, 2, 3, 4, 5), scale = FALSE)
```

### 包的安装与加载

R 的扩展包从 CRAN 安装，用 `install.packages()` 一次性下载并安装。生物信息学相关的包从 Bioconductor 安装，需要先安装 BiocManager。

::: warning 浏览器中无法运行
以下代码使用了 `DESeq2`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
# 从 CRAN 安装
install.packages("ggplot2")

# 从 Bioconductor 安装
if (!requireNamespace("BiocManager", quietly = TRUE))
  install.packages("BiocManager")
BiocManager::install("DESeq2")

# 加载包
library(ggplot2)
library(DESeq2)
```

`install.packages()` 只需运行一次，包就永久安装在本地。`library()` 每次启动 R 会话都需要调用，把包的函数加载到当前环境。这个区分类似 Python 的 `pip install` 与 `import`。

::: tip 包管理的工程实践
正式项目建议用 `renv` 包管理依赖，它为每个项目创建独立的包库，类似 Python 的 virtualenv。在 `.Rproj` 项目中运行 `renv::init()` 初始化，后续安装的包都记录在 `renv.lock` 文件里，别人拿到项目可以 `renv::restore()` 还原完全相同的环境。
:::

## 1.1.8 代码风格与工程习惯

### 注释与可读性

R 的注释用 `#`，没有多行注释语法。块注释通过连续的 `#` 行实现。

```r
# 计算基因表达矩阵的 z-score
# 输入：表达矩阵（行=基因，列=样本）
# 输出：标准化后的矩阵
standardize_expr <- function(expr_mat) {
  # 按行计算均值和标准差
  row_means <- rowMeans(expr_mat)
  row_sds <- apply(expr_mat, 1, sd)
  
  # 中心化与缩放
  z_score <- (expr_mat - row_means) / row_sds
  return(z_score)
}
```

代码风格上，R 社区遵循 tidyverse 风格指南（https://style.tidyverse.org/）。核心要点：

- 变量名用小写下划线：`gene_count` 而不是 `geneCount` 或 `gene.count`
- `<-` 赋值，不用 `=`
- 逗号后加空格：`c(1, 2, 3)` 而不是 `c(1,2,3)`
- 运算符两侧加空格：`x + y` 而不是 `x+y`
- 函数名用小写下划线：`calc_bmi()`

这些约定不是强制的，但遵循它们能让代码与其他 R 用户的工作衔接顺畅。

### 帮助系统

R 的帮助系统是它被低估的优势。任何函数的文档都能用 `?` 或 `help()` 调出，在 RStudio 的 Help 面板显示。

```r
?mean          # 查看 mean 函数文档
?data.frame    # 查看 data.frame 函数文档

# 搜索不知道确切名字的函数
help.search("linear regression")
??aov          # 模糊搜索 aov 相关内容

# 运行示例代码
example(ggplot2)
```

帮助文档的结构通常包括 Description（描述）、Usage（用法）、Arguments（参数）、Details（细节）、Value（返回值）、Examples（示例）。阅读 Examples 部分是学习新函数最快的方式——它给出可直接运行的代码。

---

## 本节小结

R 语言的设计理念可以浓缩为一句话：把数据放在第一位。向量是默认的思考单位，统计函数是语言的原生部分，数据框是分析的标准载体。这套设计从 S 语言继承而来，为统计学家和生物信息学工作者服务了近半个世纪。

掌握 R 的关键三件事：第一，接受向量化思维，少写循环而多用向量化运算；第二，理解数据结构的层次：向量是原子，矩阵是二维向量，列表是万能容器，数据框是统计格式；第三，养成查帮助的习惯，`?function` 能解决大部分疑问。

下一节将进入数据清洗与预处理，在真实数据上练习这些概念。真实数据很少是干净的，处理它需要本节建立的基础，也需要 `dplyr` 和 `tidyr` 这些工具包的帮助。但

## 练习题

### 第1题 向量化运算

给定向量 `log2_values <- c(3.2, 5.1, 2.8, 4.5, 6.0)`,用一行 R 代码将其转换为原始表达量(2 的幂),并计算转换后向量的均值与标准差。

::: details 参考答案

```r
log2_values <- c(3.2, 5.1, 2.8, 4.5, 6.0)
original <- 2 ^ log2_values
mean(original)
sd(original)
```

`2 ^ log2_values` 直接对整个向量做逐元素幂运算,无需循环。`mean()` 与 `sd()` 默认对向量所有元素求统计量。
:::

### 第2题 数据框索引

给定数据框 `patients <- data.frame(id = 1:3, age = c(45, 62, 38), treatment = factor(c("A", "B", "A")))`,用三种不同写法取出 `age` 列作为数值向量。

::: details 参考答案

```r
patients <- data.frame(id = 1:3, age = c(45, 62, 38),
                       treatment = factor(c("A", "B", "A")))

patients$age           # 列表语法
patients[["age"]]      # 列表语法
patients[, "age"]      # 矩阵语法
```

三种写法等价返回数值向量。注意 `patients["age"]` 用单方括号返回的是单列数据框而非向量。
:::

### 第3题 因子比较

给定 `sev <- factor(c("mild", "severe", "moderate"), levels = c("mild", "moderate", "severe"), ordered = TRUE)`,判断 `sev[1] < sev[2]` 的结果并解释。

::: details 参考答案

```r
sev <- factor(c("mild", "severe", "moderate"),
              levels = c("mild", "moderate", "severe"),
              ordered = TRUE)
sev[1] < sev[2]
# [1] TRUE
```

有序因子的比较基于水平顺序。`mild` 是第一个水平,`severe` 是第三个水平,因此 `mild < severe` 返回 `TRUE`。无序因子无法做大小比较。
:::

## 常见错误

**错误 1 · `longer object length is not a multiple of shorter object length`**

原因:两个不等长向量做运算时,短向量长度不是长向量长度的整数倍,R 给出警告但仍执行循环补齐。常见于给多列赋权重时向量长度写错。

解决:用 `length()` 检查向量长度,确认运算意图。若是按列赋权重,改用矩阵乘法或显式 `rep()` 到目标长度。

**错误 2 · `Error in $<-.data.frame: replacement has X rows, data has Y rows`**

原因:给数据框某列赋值时,右侧向量长度与数据框行数不一致。常因 `factor()` 丢弃了水平或 `ifelse()` 返回长度异常。

解决:用 `nrow(df)` 与 `length(new_col)` 对照检查,确保长度匹配。`ifelse()` 条件返回 NA 时长度仍与输入一致,但若条件向量本身长度错位则会出错。

**错误 3 · 因子被当作字符串处理**

原因:用 `c()` 合并因子时,R 会把因子转换为字符向量再合并,丢失水平信息。例如 `c(factor("A"), factor("B"))` 返回字符向量而非因子。

解决:合并因子用 `unlist(list(f1, f2))` 或 `forcats::fct_c(f1, f2)`,保留水平属性。

**错误 4 · 列表索引 `[]` 与 `[[]]` 混淆**

原因:`lst["name"]` 返回长度为 1 的子列表,`lst[["name"]]` 返回元素本身。混淆会让下游代码接到一个意外的列表包装。

解决:取元素本身用 `[[]]` 或 `$`,取子列表用 `[]`。写函数时若需要单元素,用 `[[`。