---
title: 2.4 字符串类型
sidebar:
  order: 4
---
# 2.4 字符串类型

<span class="chapter-tag">Python核心语法基础</span>

字符串是 Python 中使用频率最高的数据类型之一。在医学场景中，病人姓名、诊断结果、病历文本、基因序列、药品名称、检查报告等内容都以字符串形式存在。Python 提供了丰富的字符串操作能力，从基础的拼接、切片到高级的格式化输出，覆盖了文本处理的绝大多数需求。本节将系统介绍字符串的字面量写法、转义机制、运算操作、索引切片规则、内置方法分类，以及三种格式化方式和格式说明符的完整语法。掌握这些内容后，你就能在代码中自如地处理各类文本数据。

## 字符串字面量与转义

### 字符串字面量的四种写法

Python 字符串字面量可以用四种引号形式表示，分别是单引号 `'...'`、双引号 `"..."`、三单引号 `'''...'''` 和三双引号 `"""..."""`。四种形式在功能上没有本质区别，选择哪种主要取决于字符串内容是否包含引号本身，以及是否需要跨行。

单引号和双引号用于简短的单行字符串。两者的区别在于：如果字符串内容包含双引号，就用单引号包裹，反之亦然。这样可以避免使用转义字符，提升可读性。三引号用于跨多行的字符串，三单引号和三双引号功能相同。三引号字符串会原样保留内部的所有换行和缩进，常用于函数文档字符串（docstring）和长文本。

```python
# 单引号字符串
s1 = 'Hello, Python'
s2 = 'He said "good morning"'  # 内部含双引号，外部用单引号

# 双引号字符串
s3 = "Hello, Python"
s4 = "It's a patient"  # 内部含单引号，外部用双引号

# 三引号字符串，可跨行
s5 = '''第一行
第二行
第三行'''

s6 = """这是一个
多行字符串"""

print(s1)
print(s2)
print(s4)
print(s5)
# 输出保留换行：
# 第一行
# 第二行
# 第三行
```

医学场景中，包含撇号的诊断描述（如 `patient's history`）适合用双引号包裹；包含引号的医嘱引用（如 `医生说"立即停药"`）适合用单引号包裹。多行病历摘要、检查报告正文则适合用三引号。

### 转义字符

转义字符以反斜杠 `\` 开头，用于在字符串中表示一些无法直接输入或具有特殊含义的字符。Python 支持的转义字符与 C 语言基本一致。

最常用的是 `\n` 表示换行，`\t` 表示水平制表符（Tab），`\\` 表示反斜杠本身，`\'` 和 `\"` 分别表示单引号和双引号。这五个覆盖了绝大多数日常需求。`\r` 表示回车（光标回到行首），在某些操作系统（旧版 macOS）的文本文件中作为换行符，Windows 文本文件用 `\r\n` 组合作为换行。

```python
# 常用转义字符
print("第一行\n第二行")      # \n 换行
print("列1\t列2\t列3")       # \t 制表符对齐
print("路径: C:\\Users\\data")  # \\ 反斜杠本身
print('It\'s a test')        # \' 单引号
print("He said \"hi\"")      # \" 双引号
```

还有一些较少见的转义字符。`\b` 是退格符（Backspace），`\f` 是换页符，`\v` 是垂直制表符，`\a` 是响铃符（终端会发出提示音）。这些主要用于终端控制和老式打印机格式，现代编程中很少用到。

对于需要用字符编码表示的场景，Python 提供两种形式。`\ooo` 是最多三位八进制数，表示对应 ASCII 字符；`\xhh` 是两位十六进制数，表示对应 ASCII 字符。`\N{name}` 是 Unicode 字符名称，例如 `\N{GREEK SMALL LETTER ALPHA}` 表示希腊字母 $\alpha$。`\uhhhh` 和 `\Uhhhhhhhh` 分别用 4 位和 8 位十六进制表示 Unicode 字符。

```python
# 八进制和十六进制转义
print("\101")       # A，八进制 101 对应 ASCII 65
print("\x41")       # A，十六进制 41 对应 ASCII 65
print("\x4e\x4f")   # NO

# Unicode 名称和码点
print("\N{HEAVY CHECK MARK}")  # ✓
print("\u03b1")      # α，希腊字母 alpha
print("\u20ac")      # €，欧元符号

# 医学场景：特殊符号
print("血型: A\u2003Rh\u2003+")  # 使用 em 空格分隔
print("体温 \N{DEGREE SIGN}C")   # 体温 °C
```

::: note 转义字符在医学文本的潜在坑
从医院信息系统导出的文本数据可能包含各种不可见字符（如 `\r`、`\t`、不间断空格 `\u00a0`），这些字符会导致字符串比较失败但肉眼看不出来。处理这类数据时，建议先用 `repr()` 查看字符串的真实内容，再决定如何清洗。
:::

### 原始字符串

原始字符串（raw string）以 `r` 或 `R` 前缀开头，反斜杠在其中不作为转义字符，而是原样保留。这一特性在处理正则表达式、Windows 文件路径、LaTeX 公式等包含大量反斜杠的文本时非常有用。

```python
# 普通字符串中的反斜杠需要转义
path_normal = "C:\\Users\\data\\sample.csv"
print(path_normal)  # C:\Users\data\sample.csv

# 原始字符串，反斜杠原样保留
path_raw = r"C:\Users\data\sample.csv"
print(path_raw)  # C:\Users\data\sample.csv

# 正则表达式场景
import re
# 不用原始字符串：每个反斜杠都要写两次
pattern1 = "\\d{3}-\\d{4}"
# 用原始字符串：直接写正则
pattern2 = r"\d{3}-\d{4}"
# 两者等价，但原始字符串更易读
print(re.findall(pattern2, "电话 010-1234, 021-5678"))
# ['010-1234', '021-5678']
```

原始字符串的唯一限制是：引号内的反斜杠不能作为最后一个字符，因为 `r"\""` 这种写法中，`\"` 仍会被解析为字符串结束的转义。如果需要在原始字符串末尾放反斜杠，可以用拼接：`r"C:\data" "\\"`。

## 字符串的基本运算

### 字符串拼接

加号 `+` 运算符用于将多个字符串连接成一个新字符串。参与运算的必须是字符串类型，不能直接拼接数字。拼接操作会创建新字符串对象，原字符串不变。

```python
# 字符串拼接
first = "张"
last = "三"
full = first + last
print(full)  # 张三

# 拼接多个字符串
greeting = "Hello" + ", " + "Python"
print(greeting)  # Hello, Python

# 不能直接拼接字符串和数字
age = 45
# print("年龄: " + age)  # 报错：TypeError
print("年龄: " + str(age))  # 正确：先把数字转为字符串

# 医学场景
patient_id = "P001"
diagnosis = "高血压"
record = "病人 " + patient_id + " 诊断为 " + diagnosis
print(record)  # 病人 P001 诊断为 高血压
```

需要拼接大量字符串时，`+` 会产生性能问题，因为每次拼接都创建新对象。推荐使用 `str.join()` 方法或 f-string，后续章节会介绍。

### 字符串重复

星号 `*` 运算符用于将字符串重复指定次数。这一运算在生成分隔线、对齐填充等场景中常用。

```python
# 字符串重复
print("-" * 30)        # ------------------------------
print("Abc" * 3)       # AbcAbcAbc
print("= " * 5)        # = = = = =

# 重复零次或负数次得到空字符串
print("x" * 0)         # 空字符串
print("x" * -1)        # 空字符串

# 医学场景：生成报告分隔线
print("=" * 40)
print("病人检验报告")
print("=" * 40)
```

## 字符串的索引与切片

### 字符串索引

字符串是一个字符序列，每个字符都有位置编号。**正向索引**从 `0` 开始（第一个字符索引为 0），**负向索引**从 `-1` 开始（最后一个字符索引为 -1）。两种索引方式可以混用。

```python
s = "Python"
#  正向索引: 0  1  2  3  4  5
#  负向索引:-6 -5 -4 -3 -2 -1

print(s[0])    # P，第一个字符
print(s[1])    # y
print(s[5])    # n，最后一个字符（正向）
print(s[-1])   # n，最后一个字符（负向）
print(s[-2])   # o，倒数第二个
print(s[-6])   # P，第一个字符（负向）

# 索引越界会报错
# print(s[6])   # IndexError: string index out of range
# print(s[-7])  # IndexError
```

医学场景中，索引常用于提取编码的某一位。例如病历号 `P2024-001` 中，`code[0]` 是病人类型标识，`code[1:5]` 是年份。

### 字符串切片

切片用于从字符串中截取一段子串，语法是 `s[start:stop:step]`。**关键规则是含左不含右**：包含 `start` 位置的字符，不包含 `stop` 位置的字符。三个参数都可以省略，省略 `start` 默认从开头开始，省略 `stop` 默认到结尾，省略 `step` 默认步长为 1。

```python
s = "Hello, Python"

# 基本切片：[start:stop]，含左不含右
print(s[0:5])     # Hello
print(s[7:13])    # Python
print(s[0:1])     # H，只有一个字符

# 省略参数
print(s[:5])      # Hello，省略 start
print(s[7:])      # Python，省略 stop
print(s[:])       # Hello, Python，完整拷贝

# 负索引切片
print(s[-6:])     # Python，最后 6 个字符
print(s[-6:-1])   # Pytho，注意不含最后一位

# step 步长
print(s[0:13:2])  # Hlo yhn，每隔一个取一个
print(s[::2])     # Hlo yhn，从头到尾步长 2
print(s[::3])     # Hl,h，步长 3

# 负步长：反向取字符
print(s[::-1])    # nohtyP ,olleH，字符串反转
print(s[13:0:-1]) # nohtyP ,olle，反向切片

# 医学场景：从基因序列中提取片段
dna = "ATGCGATAGCAGTT"
codon = dna[0:3]   # ATG，起始密码子
print(codon)
```

::: note 切片不会越界报错
与索引不同，切片的 `start` 和 `stop` 超出范围不会抛出 `IndexError`，而是自动截断到有效范围。这一特性让切片操作非常安全。

```python
s = "Python"
print(s[0:100])   # Python，stop 超出范围自动截断
print(s[-100:3])  # Pyt，start 超出范围自动截断
print(s[10:20])   # 空字符串，范围完全在字符串之外
```
:::

### 字符串长度

`len()` 函数返回字符串中的字符个数，包括空格、标点和不可见字符。注意这里数的是 Unicode 字符数，不是字节数，中文字符每个算一个字符。

```python
print(len("Python"))        # 6
print(len("你好，Python"))  # 9，中文和标点各算一个字符
print(len(""))              # 0，空字符串
print(len(" "))             # 1，空格也是一个字符

# 医学场景：验证病历号长度
patient_id = "P2024001"
if len(patient_id) != 8:
    print("病历号长度不正确")
else:
    print("病历号格式正确")
```

### 字符串迭代

字符串是可迭代对象，可以用 `for` 循环逐字符遍历。每次循环得到一个字符（长度为 1 的字符串）。

```python
# 逐字符遍历
for ch in "Python":
    print(ch)
# 输出：P y t h o n（每行一个）

# 配合 enumerate 获取索引和字符
for i, ch in enumerate("ATCG"):
    print(f"位置 {i}: {ch}")
# 位置 0: A
# 位置 1: T
# 位置 2: C
# 位置 3: G

# 医学场景：统计 DNA 序列中各碱基数量
dna = "ATGCGATAGCAGTT"
counts = {"A": 0, "T": 0, "C": 0, "G": 0}
for base in dna:
    if base in counts:
        counts[base] += 1
print(counts)  # {'A': 4, 'T': 4, 'C': 3, 'G': 3}
```

### 成员检查

`in` 和 `not in` 运算符用于检查某个子串是否存在于字符串中，返回布尔值。这一操作是线性扫描，子串越长速度越慢，但对日常文本处理足够。

```python
s = "病人诊断为高血压二期"

print("高血压" in s)      # True
print("糖尿病" in s)      # False
print("糖尿病" not in s)  # True

# 检查单个字符
print("A" in "ATCG")    # True
print("N" in "ATCG")    # False

# 医学场景：根据诊断文本判断
diagnosis = "2型糖尿病，合并视网膜病变"
if "糖尿病" in diagnosis:
    print("该病人患有糖尿病")
if "视网膜" in diagnosis:
    print("存在视网膜并发症")
```

### 字符串不可变性

Python 字符串是**不可变对象**（immutable），一旦创建，其内容不能被修改。试图通过索引赋值修改某个字符会抛出 `TypeError`。需要修改字符串时，必须创建一个新字符串，常用方式是切片拼接或调用字符串方法。

```python
s = "Python"
# s[0] = "J"  # TypeError: 'str' object does not support item assignment

# 修改字符串的正确做法：切片拼接
new_s = "J" + s[1:]
print(new_s)  # Jython

# 替换字符用 replace 方法（返回新字符串）
replaced = s.replace("P", "J")
print(replaced)  # Jython

# 原字符串保持不变
print(s)  # Python
```

不可变性带来的好处是字符串可以作为字典的键（key）或集合（set）的元素，因为其哈希值不会变化。同时不可变性也让字符串在多线程环境下天然安全，无需加锁。代价是频繁修改字符串时性能较差，应该用列表收集片段再 `join`。

## 字符串方法

Python 字符串对象内置了大量方法，覆盖大小写转换、对齐填充、查找替换、分割连接、空白去除、类型判断等功能。所有方法都返回新字符串，不修改原字符串（因为字符串不可变）。

### 大小写转换方法

`capitalize()` 将字符串首字符大写、其余小写。`title()` 将每个单词的首字母大写。`lower()` 将所有字符转为小写。`upper()` 将所有字符转为大写。`swapcase()` 大小写互换。`casefold()` 类似 `lower()` 但更激进，专门用于不区分大小写的比较，能处理德语 ß 等特殊字符。

```python
s = "Hello, World"

print(s.capitalize())  # Hello, world
print(s.title())       # Hello, World
print(s.lower())       # hello, world
print(s.upper())       # HELLO, WORLD
print(s.swapcase())    # hELLO, wORLD

# casefold 用于不区分大小写比较
german = "Straße"
print(german.lower())     # straße
print(german.casefold())  # strasse，ß 被转为 ss
print("strasse" == german.casefold())  # True
```

医学场景中，统一药品名称大小写、规范化诊断文本时常用 `lower()` 或 `upper()`。`casefold()` 适合处理多语言数据。

### 对齐填充方法

`center(width, fillchar)` 居中对齐，`ljust(width, fillchar)` 左对齐，`rjust(width, fillchar)` 右对齐，三者都用 `fillchar`（默认空格）填充到指定宽度。`zfill(width)` 用零在左侧填充到指定宽度，常用于编号补齐。

```python
s = "42"

print(s.center(10))       # "    42    "
print(s.center(10, "-"))  # "----42----"
print(s.ljust(10, "."))   # "42........"
print(s.rjust(10, "."))   # "........42"
print(s.zfill(8))         # "00000042"

# 医学场景：病历号补齐
patient_num = 42
patient_id = f"P{str(patient_num).zfill(6)}"
print(patient_id)  # P000042

# 对齐表格输出
print("姓名".ljust(8) + "年龄".rjust(4) + "诊断".ljust(10))
print("张三".ljust(8) + "45".rjust(4) + "高血压".ljust(10))
```

### 查找替换方法

`find(sub)` 从左向右查找子串，返回首次出现的索引，找不到返回 `-1`。`rfind(sub)` 从右向左查找。`index(sub)` 与 `find` 相同，但找不到时抛出 `ValueError`。`rindex(sub)` 是 `index` 的反向版本。`count(sub)` 统计子串出现次数。`replace(old, new, count)` 将 `old` 替换为 `new`，可选第三个参数限制替换次数。

```python
s = "Hello, Python, Hello World"

# find 查找子串位置
print(s.find("Hello"))    # 0，首次出现的位置
print(s.find("hello"))    # -1，区分大小写，找不到
print(s.rfind("Hello"))   # 14，最后一次出现的位置
print(s.find("Python"))   # 7

# index 与 find 的区别
print(s.index("Python"))  # 7
# s.index("hello")  # 抛出 ValueError

# count 统计出现次数
print(s.count("Hello"))   # 2
print(s.count("o"))       # 4
print(s.count("xyz"))     # 0

# replace 替换
print(s.replace("Hello", "Hi"))          # Hi, Python, Hi World
print(s.replace("Hello", "Hi", 1))       # Hi, Python, Hello World，只替换第一个
print(s.replace("o", "0"))               # Hell0, Pyth0n, Hell0 W0rld
```

::: note find 与 index 的选择
`find` 找不到时返回 `-1`，`index` 找不到时抛出异常。选择哪个取决于你的逻辑：如果找不到是合理情况，用 `find` 配合条件判断；如果找不到说明程序出错，用 `index` 让异常尽早暴露。
:::

### 分割连接方法

`split(sep, maxsplit)` 按分隔符将字符串切分为列表，默认按空白字符（空格、Tab、换行）分割，`maxsplit` 限制分割次数。`rsplit()` 从右侧开始分割。`splitlines()` 按行分割，保留或去除换行符可选。`partition(sep)` 将字符串分为三部分：分隔符前、分隔符本身、分隔符后，返回三元组。`join(iterable)` 是 `split` 的逆操作，用指定字符串连接可迭代对象中的元素。

```python
# split 分割
s = "张三,45,高血压,糖尿病"
parts = s.split(",")
print(parts)  # ['张三', '45', '高血压', '糖尿病']

# 按空白分割（默认行为）
text = "Hello   Python  World"
print(text.split())     # ['Hello', 'Python', 'World']，自动处理多空格
print(text.split(" "))  # ['Hello', '', '', 'Python', '', 'World']，按单空格分割

# maxsplit 限制分割次数
print(s.split(",", 2))  # ['张三', '45', '高血压,糖尿病']

# rsplit 从右侧分割
print("a.b.c.d".rsplit(".", 2))  # ['a.b', 'c', 'd']

# splitlines 按行分割
multiline = "第一行\n第二行\n第三行"
print(multiline.splitlines())  # ['第一行', '第二行', '第三行']

# partition 分为三部分
print("patient@hospital".partition("@"))
# ('patient', '@', 'hospital')
print("no_at_sign".partition("@"))
# ('no_at_sign', '', '')，找不到时分隔符和后部分为空

# join 连接字符串
words = ["Hello", "Python", "World"]
print(" ".join(words))   # Hello Python World
print("-".join(words))   # Hello-Python-World
print(",".join(words))   # Hello,Python,World

# 医学场景：拼接基因序列
bases = ["ATG", "CGA", "TAG", "CAG", "TT"]
dna = "".join(bases)
print(dna)  # ATGCGATAGCAGTT
```

`join()` 是处理大量字符串拼接的推荐方式，效率远高于 `+` 反复拼接。其原理是预先计算结果长度，一次性分配内存，避免了中间字符串对象的反复创建。

### 去除空白方法

`strip()` 去除字符串两端的指定字符（默认为空白，包括空格、Tab、换行）。`lstrip()` 只去除左端，`rstrip()` 只去除右端。可以传入参数指定要去除的字符集合。

```python
# 去除两端空白
s = "  Hello, Python  "
print(s.strip())    # "Hello, Python"
print(s.lstrip())   # "Hello, Python  "
print(s.rstrip())   # "  Hello, Python"

# 去除指定字符
print("###Hello###".strip("#"))   # Hello
print("xyzHelloxyz".strip("xyz"))  # Hello，去除两端所有 x、y、z
print("\t\nHello\n\t".strip())    # Hello

# 医学场景：清洗用户输入
user_input = "  高血压  \n"
clean = user_input.strip()
print(f"[{clean}]")  # [高血压]
```

从医院信息系统导出的文本数据经常带有前后空白，比较或存储前应先 `strip()` 清洗，避免因不可见空白导致逻辑错误。

### 判断类型方法

这类方法以 `is` 开头，返回布尔值，用于判断字符串的字符组成特征。`isalpha()` 判断是否全为字母，`isdigit()` 判断是否全为数字，`isalnum()` 判断是否全为字母或数字，`isspace()` 判断是否全为空白字符。`islower()`、`isupper()`、`istitle()` 判断大小写形式。

```python
# 字符组成判断
print("Hello".isalpha())     # True
print("Hello123".isalpha())  # False
print("12345".isdigit())     # True
print("12.34".isdigit())     # False，小数点不是数字
print("Hello123".isalnum())  # True
print("   ".isspace())       # True
print("".isspace())          # False，空字符串不是空白

# 中文字符也算字母
print("你好".isalpha())      # True
print("123".isdigit())       # True

# 大小写判断
print("hello".islower())     # True
print("HELLO".isupper())     # True
print("Hello World".istitle())  # True，每个单词首字母大写

# 医学场景：验证输入
age_input = "45"
if age_input.isdigit():
    age = int(age_input)
    print(f"年龄: {age}")
else:
    print("请输入数字")
```

::: warning isdigit 的陷阱
`isdigit()` 对一些特殊 Unicode 数字字符（如 `'²'` 上标 2、`'٣'` 阿拉伯数字 3）也返回 `True`，但 `int()` 转换这些字符可能失败或得到意外结果。处理纯 ASCII 数字时，更严格的做法是 `s.isascii() and s.isdigit()`。
:::

### 其他常用方法

`startswith(prefix)` 和 `endswith(suffix)` 判断字符串是否以指定前缀开头或后缀结尾，支持传入元组匹配多种可能。`encode(encoding)` 将字符串编码为字节串，用于文件读写或网络传输。

```python
# startswith 和 endswith
filename = "patient_data.csv"
print(filename.startswith("patient"))  # True
print(filename.endswith(".csv"))       # True
print(filename.endswith((".csv", ".txt", ".json")))  # True，匹配多种后缀

# 医学场景：按文件类型处理
filename = "ct_scan.dcm"
if filename.endswith(".dcm"):
    print("处理 DICOM 影像文件")
elif filename.endswith(".csv"):
    print("处理临床数据表格")

# encode 编码
s = "你好，Python"
b = s.encode("utf-8")
print(b)              # b'\xe4\xbd\xa0\xe5\xa5\xbd\xef\xbc\x8cPython'
print(len(b))         # 16，UTF-8 下中文占 3 字节
decoded = b.decode("utf-8")
print(decoded == s)   # True
```

## 字符串格式化

字符串格式化是将变量值嵌入到字符串模板中的操作，是日常编程的高频需求。Python 历史上出现了三种格式化方式，从旧到新分别是 `%` 格式化、`str.format()` 方法和 f-string。新代码推荐使用 f-string，但阅读旧代码时仍会遇到前两种。

### 三种格式化方式

**旧式 % 格式化**借鉴自 C 语言的 `printf` 语法，用 `%s`、`%d`、`%f` 等占位符表示要插入的值，再用 `%` 运算符连接模板和值。这种方式历史悠久，但表达能力有限，多个参数时容易出错。

```python
# 旧式 % 格式化
name = "张三"
age = 45
bp = 140.5

print("姓名: %s, 年龄: %d" % (name, age))
# 姓名: 张三, 年龄: 45

print("血压: %.1f mmHg" % bp)
# 血压: 140.5 mmHg

# 常用占位符
# %s 字符串, %d 整数, %f 浮点数, %x 十六进制, %% 百分号本身
print("完成度: %d%%" % 80)  # 完成度: 80%
```

**str.format() 方法**是 Python 2.6 引入的方式，用花括号 `{}` 作为占位符，通过位置参数或关键字参数传入值。比 `%` 格式化更灵活，支持嵌套属性访问和索引。

```python
# str.format() 方法
# 位置参数
print("姓名: {}, 年龄: {}".format("张三", 45))
# 姓名: 张三, 年龄: 45

# 通过索引复用参数
print("{0}今年{1}岁，{0}是医生".format("李四", 38))
# 李四今年38岁，李四是医生

# 关键字参数
print("姓名: {name}, 年龄: {age}".format(name="王五", age=52))

# 访问属性和索引
patient = {"name": "赵六", "age": 60}
print("病人: {p[name]}, {p[age]}岁".format(p=patient))

# 格式说明符
print("血压: {:.1f} mmHg".format(140.567))  # 血压: 140.6 mmHg
print("编号: {:06d}".format(42))             # 编号: 000042
```

**f-string**（formatted string literal）是 Python 3.6 引入的方式，在字符串前加 `f` 或 `F` 前缀，花括号内直接写 Python 表达式，运行时求值并嵌入。这是当前最推荐的方式，语法简洁、可读性强、性能也最好。

```python
# f-string
name = "张三"
age = 45
bp = 140.567

print(f"姓名: {name}, 年龄: {age}")
# 姓名: 张三, 年龄: 45

# 花括号内可以是任意表达式
print(f"明年 {age + 1} 岁")
print(f"姓名长度: {len(name)}")
print(f"血压均值: {(140 + 150 + 135) / 3:.1f}")

# 调用函数
def get_status(bp):
    return "偏高" if bp > 130 else "正常"

print(f"血压状态: {get_status(bp)}")

# 医学场景：生成报告
patient_id = "P001"
diagnosis = "高血压"
risk = 0.85
print(f"病人 {patient_id} 诊断为 {diagnosis}，10年心血管风险 {risk:.1%}")
# 病人 P001 诊断为 高血压，10年心血管风险 85.0%
```

::: note f-string 的调试技巧
Python 3.8 起，f-string 支持 `=` 后缀，可以同时显示变量名和值，调试时非常方便：

```python
x = 42
y = "hello"
print(f"{x=}, {y=}")  # x=42, y='hello'
```

这一特性让你无需重复写变量名，特别适合打印多个变量用于调试。
:::

### 格式化迷你语言

花括号内冒号 `:` 之后的部分称为**格式说明符**（format specification），遵循一套完整的迷你语言规范。完整语法是 `[[fill]align][sign][#][0][width][grouping_option][.precision][type]`，各部分都是可选的，组合使用能实现精细控制。

**填充与对齐**部分：`fill` 是任意填充字符，`align` 是对齐方式，`<` 左对齐、`>` 右对齐、`^` 居中、`=` 数字专用（符号后在数字前补零）。例如 `:_^10` 表示用下划线填充、居中、宽度 10。

**符号**部分：`+` 表示正数也显示加号，`-` 表示正数不显示符号（默认），空格表示正数前留空格。

**宽度**部分：数字表示最小字段宽度，不足时按对齐方式填充。

**精度**部分：以 `.` 开头跟数字，对浮点数表示小数位数，对字符串表示最大字符数。

**千位分隔符**：逗号 `,` 用逗号分隔千位，下划线 `_` 用下划线分隔。

**类型码**部分：`d` 整数、`f` 定点浮点数、`e` 科学计数法、`g` 自动选择、`%` 百分比、`x` 十六进制、`o` 八进制、`b` 二进制、`s` 字符串。

```python
value = 3.14159265
num = 1234567
ratio = 0.856

# 填充与对齐
print(f"{value:_^20.4f}")  # _____3.1416______
print(f"{value:>20.4f}")   #               3.1416
print(f"{value:<20.4f}")   # 3.1416

# 符号显示
print(f"{42:+d}")   # +42
print(f"{-42:+d}")  # -42
print(f"{42: d}")   #  42，正数前留空格

# 宽度与精度
print(f"{value:10.4f}")  #     3.1416，宽度 10，4 位小数
print(f"{'Hello':.3}")   # Hel，字符串精度限制字符数

# 千位分隔符
print(f"{num:,}")   # 1,234,567
print(f"{num:_}")   # 1_234_567

# 类型码
print(f"{255:x}")     # ff，十六进制
print(f"{255:X}")     # FF，大写十六进制
print(f"{255:o}")     # 377，八进制
print(f"{255:b}")     # 11111111，二进制
print(f"{255:#b}")    # 0b11111111，带前缀
print(f"{value:e}")   # 3.141593e+00，科学计数法
print(f"{value:.3e}") # 3.142e+00
print(f"{value:g}")   # 3.14159，自动选择
print(f"{ratio:.1%}") # 85.6%，百分比

# 综合示例
big_num = 1234567.891
print(f"{big_num:,.2f}")  # 1,234,567.89

# 医学场景
dose = 0.025
print(f"剂量: {dose:.3f} mg")  # 剂量: 0.025 mg
```

::: note 类型码 g 的行为
`g` 类型码会根据数值大小自动选择定点或科学计数法：当数值的指数小于 -4 或大于等于精度时用科学计数法，否则用定点表示。这在显示可能跨多个数量级的数据（如基因表达量、p 值）时很方便，能避免过多前导零或尾随零。
:::

### repr() 和 !r 转换

`repr()` 函数返回对象的**字符串表示**，目标是能完整反映对象的状态，便于调试。对字符串而言，`repr()` 会用引号包裹并显示所有转义字符，而 `str()` 或直接打印只显示字符串内容。

在格式化中，可以用 `!r` 转换标志让 f-string 或 `format()` 调用 `repr()` 而非默认的 `str()`。这在调试时能区分看起来相同但实际不同的字符串（如有无前后空白、是否包含不可见字符）。

```python
s = "Hello\nWorld"

# str 与 repr 的区别
print(str(s))    # Hello（换行）World，显示内容
print(repr(s))   # 'Hello\nWorld'，显示转义字符

# f-string 中使用 !r
name = "张三"
print(f"姓名: {name}")     # 姓名: 张三
print(f"姓名: {name!r}")   # 姓名: '张三'，带引号

# 调试场景：揭示隐藏的空白
user_input = "  高血压  "
print(f"输入: {user_input}")    # 输入:   高血压
print(f"输入: {user_input!r}")  # 输入: '  高血压  '，看清空白

# !s 和 !a 也有
# !s 调用 str()（默认行为），!a 调用 ascii()（非 ASCII 字符转义）
print(f"{'你好'!a}")  # '\u4f60\u597d'

# format() 方法等价写法
print("值: {!r}".format("test"))  # 值: 'test'
```

::: note 何时用 repr
调试时打印变量值，建议用 `!r` 或 `repr()`，它能暴露空白、换行、引号等隐藏信息，帮助定位问题。生产环境输出给用户看的报告，则用默认的 `str()` 形式。Python 中 `__repr__` 和 `__str__` 两个魔法方法分别对应这两种表示，自定义类可以通过实现它们控制输出。
:::

至此，本节完整介绍了字符串类型的字面量、运算、索引切片、方法分类和格式化方式。字符串是 Python 中最灵活的内置类型之一，方法众多但各有侧重。日常编程中，f-string 配合格式说明符能解决绝大多数格式化需求，`split` 和 `join` 处理文本切分与拼接，`strip` 和判断方法用于数据清洗。下一节将进入控制流，学习如何让程序根据条件执行不同的代码路径。
