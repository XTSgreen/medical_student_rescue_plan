---
title: 1.17 字符串处理进阶
sidebar:
  order: 17
---
# 1.17 字符串处理进阶

第 5 章介绍了 `.str` 访问器的基本操作，本节补充它的进阶能力：大小写变换的更多形式、按位置取字符、重复拼接、编码转换，以及与正则表达式深度配合的匹配、替换、提取。字符串清洗是数据预处理中最繁琐的环节，掌握 `.str` 的完整接口能显著减少手写循环。

## 1.17.1 大小写与规范化

`.str` 提供多种大小写变换：

```python
import pandas as pd

s = pd.Series(['hello world', 'pandas data', 'Python'])
print(s.str.capitalize())   # 首字母大写，其余小写 -> 'Hello world'
print(s.str.title())        # 每个单词首字母大写 -> 'Hello World'
print(s.str.swapcase())     # 大小写互换 -> 'HELLO WORLD'
print(s.str.normalize('NFKD'))  # Unicode 规范化
```

`.str.capitalize()` 只把每个字符串的首字母大写，`.str.title()` 把每个单词的首字母大写，`.str.swapcase()` 翻转每个字符的大小写。`.str.normalize()` 按给定形式（NFD、NFKD、NFC、NFKC）规范化 Unicode，用于处理全角半角、组合字符等问题。

## 1.17.2 按位置取字符

### .str.get()

`.str.get(i)` 取出每个字符串第 i 个字符：

```python
s = pd.Series(['abc', 'def', 'ghi'])
print(s.str.get(0))    # ['a', 'd', 'g']
print(s.str.get(-1))   # ['c', 'f', 'i']
```

### .str.slice_replace()

`.str.slice_replace(start, stop, repl)` 用新串替换指定区间：

```python
s = pd.Series(['abcdef', 'ghijkl'])
print(s.str.slice_replace(2, 4, 'XY'))
# ['abXYef', 'ghXYkl']
```

`start`、`stop` 不写时分别从开头、到结尾替换。

## 1.17.3 重复与拼接

### .str.repeat()

`.str.repeat(n)` 把每个字符串重复 n 次：

```python
s = pd.Series(['ab', 'cd'])
print(s.str.repeat(2))   # ['abab', 'cdcd']
```

### .str.cat()

`.str.cat()` 拼接字符串，支持多种模式。内部元素拼接：

```python
s = pd.Series(['a', 'b', 'c'])
print(s.str.cat(sep=', '))   # 'a, b, c'
```

与其他 Series 逐元素拼接：

```python
s1 = pd.Series(['a', 'b'])
s2 = pd.Series(['1', '2'])
print(s1.str.cat(s2, sep='-'))   # ['a-1', 'b-2']
```

`na_rep` 参数指定缺失值的填充文本：

```python
s3 = pd.Series(['a', None])
print(s3.str.cat(['1', '2'], sep='-', na_rep='?'))   # ['a-1', '?-2']
```

## 1.17.4 编码与解码

`.str.encode()` 按编码转成字节，`.str.decode()` 把字节解码回字符串：

```python
s = pd.Series(['中文', 'pandas'])
enc = s.str.encode('utf-8')
print(enc)                      # 每个元素是 bytes
print(enc.str.decode('utf-8'))  # 还原
```

编码转换在对接不同编码的外部系统（如写入 GBK 文件、处理网络字节流）时使用。

## 1.17.5 正则表达式

正则表达式是字符串处理最强大的工具，`.str` 系列方法把正则能力向量化。

### .str.contains() 匹配

`.str.contains(pattern)` 判断是否包含匹配子串，支持正则：

```python
s = pd.Series(['abc123', 'def456', 'xyz'])
print(s.str.contains(r'\d'))    # 是否含数字 -> [True, True, False]
print(s.str.contains('abc'))    # 是否含 abc
```

`regex=False` 时按字面文本匹配（不解释正则），`case=False` 忽略大小写。

### .str.match() 前缀匹配

`.str.match(pattern)` 判断字符串**开头**是否匹配模式，与 `contains` 的区别是 match 锚定开头：

```python
s = pd.Series(['apple', 'banana', 'applet'])
print(s.str.match('app'))    # [True, False, True]
print(s.str.contains('app')) # [True, False, True]（此处相同）
```

注意 `contains('app')` 匹配任意位置，`match('app')` 只匹配开头。二者在模式带 `^` 时效果相同，不带时行为不同。

### .str.findall() 全部匹配

`.str.findall()` 返回所有匹配的列表：

```python
s = pd.Series(['a1b2c3', 'xyz'])
print(s.str.findall(r'\d'))   # [['1', '2', '3'], []]
```

### .str.replace() 替换

`.str.replace()` 用正则或字面量替换，返回替换后的字符串：

```python
s = pd.Series(['2024-01-01', '2024-02-02'])
print(s.str.replace('-', '/'))          # 字面替换
print(s.str.replace(r'\d{4}', 'YYYY'))  # 正则替换
```

`regex=True` 时把 pattern 当正则，`regex=False` 时按字面替换。

### .str.extract() 与 .str.extractall() 提取

`.str.extract()` 用带捕获组的正则提取，每个捕获组生成一列，只返回第一个匹配：

```python
s = pd.Series(['name: 张三', 'name: 李四', 'x'])
print(s.str.extract(r'name: (\w+)'))
#      0
# 0   张三
# 1   李四
# 2   NaN
```

`.str.extractall()` 提取所有匹配，每个匹配占一行，配合 MultiIndex：

```python
s = pd.Series(['a1 b2', 'c3'])
print(s.str.extractall(r'([a-z])(\d)'))
#           0  1
#   match
# 0 0      a  1
#   1      b  2
# 1 0      c  3
```

`extract` 用于"每行最多一个目标"，`extractall` 用于"每行可能有多个目标"。

### .str.split() 拆分

`.str.split()` 拆分字符串，`expand=True` 把结果展开成多列：

```python
s = pd.Series(['a,b,c', 'd,e'])
print(s.str.split(','))
print(s.str.split(',', expand=True))
#      0    1    2
# 0    a    b    c
# 1    d    e  NaN
```

`expand=True` 时返回 DataFrame，长度不足的行补 NaN。`n` 参数限制拆分次数。

## 1.17.6 组合示例

清洗一列"编号-名称"格式的数据并提取信息：

```python
s = pd.Series(['ID-001:苹果', 'ID-002:香蕉', 'bad-record'])
df = s.str.extract(r'ID-(\d+):(.+)')
df.columns = ['编号', '名称']
print(df)
```

## 练习题

### 第1题 概念理解

说明 `.str.match()` 与 `.str.contains()` 的区别；说明 `.str.extract()` 与 `.str.extractall()` 的区别。

::: details 参考答案

`.str.match()` 只匹配字符串开头的模式，`.str.contains()` 匹配任意位置。`.str.extract()` 每行只返回第一个匹配，`.str.extractall()` 返回全部匹配并各占一行。
:::

### 第2题 代码编写

创建字符串 Series，用 `title`、`swapcase`、`zfill` 做变换；用 `split` 拆分并 `expand=True` 展开成多列；用 `replace` 替换正则匹配的内容。

::: details 参考答案

```python
import pandas as pd

s = pd.Series(['hello world', 'Python pandas'])
print(s.str.title())
print(s.str.swapcase())

s2 = pd.Series(['a,b,c', 'd,e'])
print(s2.str.split(',', expand=True))

s3 = pd.Series(['2024-01-01'])
print(s3.str.replace(r'\d{4}', 'YYYY'))
```

:::

### 第3题 进阶练习

用 `extract` 从 `'ID-001:苹果'` 这类字符串中提取编号和名称；用 `extractall` 提取一行中的多组键值；用 `get` 与 `slice_replace` 做位置级处理。

::: details 参考答案

```python
import pandas as pd

s = pd.Series(['ID-001:苹果', 'ID-002:香蕉'])
print(s.str.extract(r'ID-(\d+):(.+)'))

s2 = pd.Series(['k1=v1&k2=v2'])
print(s2.str.extractall(r'(\w+)=(\w+)'))

s3 = pd.Series(['abcdef'])
print(s3.str.get(0))
print(s3.str.slice_replace(1, 3, 'XY'))
```

:::

## 常见错误

**错误 1 · 正则里写普通字符却用了 `regex=False` 或反之**

原因:`replace`、`contains` 等方法的 `regex` 参数决定是否解释正则，混淆导致匹配结果错误。

解决:明确需要正则时写 `regex=True`（部分方法默认 True），纯文本时用 `regex=False`。

**错误 2 · `str.extract` 结果全是 NaN**

原因:模式没有捕获组（小括号），或数据不匹配模式。

解决:提取时必须用带捕获组的正则，如 `r'(\d+)'`；先单独测试模式能否匹配。

**错误 3 · 正则反斜杠转义出错**

原因:在 Python 字符串中写 `\d` 需要 `r'\d'`，否则 `\d` 被当成转义字符。

解决:正则一律用原始字符串 `r'...'`。

**错误 4 · `.str.split(expand=True)` 后列数不一致**

原因:各字符串拆分出的段数不同，Pandas 自动补 NaN 但列数取最大。

解决:需要固定列数时用 `n` 限制拆分次数，或拆后处理缺失。
