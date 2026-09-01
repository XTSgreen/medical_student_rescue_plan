---
title: 1.9 输入输出(I/O)
sidebar:
  order: 9
---
# 1.9 输入输出(I/O)

前几章处理的都是内存中的数据，但真实项目的数据来自各种文件：CSV、Excel、JSON、数据库表，甚至专用格式。Pandas 提供成对的读取与写入函数，把外部数据读成 DataFrame、把 DataFrame 写回文件。本节按格式分类讲解，重点放在最常用的 CSV 与 Excel，其他格式做完整覆盖以便按需查阅。

## 1.9.1 文本文件

### read_csv 与 to_csv

`pd.read_csv()` 读取逗号分隔的文本文件，是最常用的读取函数：

```python
import pandas as pd

df = pd.read_csv('data.csv')
print(df.head())
```

常用参数：`sep` 指定分隔符、`encoding` 指定编码（中文数据常用 `'utf-8'` 或 `'gbk'`）、`header` 指定表头行、`index_col` 指定索引列、`parse_dates` 指定解析为日期的列：

```python
df = pd.read_csv('data.csv', sep=',', encoding='utf-8',
                 index_col='id', parse_dates=['日期'])
```

`pd.to_csv()` 写回 CSV：

```python
df.to_csv('output.csv', index=False, encoding='utf-8')
```

`index=False` 不写行索引，`encoding='utf-8-sig'` 可让 Excel 正确识别中文。

### read_table 与 read_fwf

`pd.read_table()` 以任意分隔符读取文本，行为与 `read_csv` 一致但 `sep` 默认是制表符；`pd.read_fwf()` 读取固定宽度列的文件：

```python
df = pd.read_table('data.tsv')            # 制表符分隔
df = pd.read_fwf('fixed.txt')             # 固定宽度
```

### JSON

`pd.read_json()` 读取 JSON 文件，`pd.to_json()` 写出。`orient` 参数控制 JSON 的结构：

```python
df = pd.read_json('data.json')
df.to_json('out.json', orient='records')
```

### HTML

`pd.read_html()` 解析 HTML 页面中的表格，返回 DataFrame 列表：

```python
tables = pd.read_html('page.html')
df = tables[0]   # 取第一个表格
```

`pd.to_html()` 把 DataFrame 写成 HTML 表格。

### XML

`pd.read_xml()` 读取 XML 文件，`pd.to_xml()` 写出：

```python
df = pd.read_xml('data.xml')
df.to_xml('out.xml')
```

## 1.9.2 Excel 文件

`pd.read_excel()` 读取 Excel，`sheet_name` 指定工作表，可以传名称、索引或 `None`（返回所有表的字典）：

```python
df = pd.read_excel('data.xlsx', sheet_name='Sheet1')
all_sheets = pd.read_excel('data.xlsx', sheet_name=None)   # 字典
```

`pd.to_excel()` 写出，配合 `pd.ExcelWriter` 可以一次写多个工作表：

```python
with pd.ExcelWriter('out.xlsx') as writer:
    df1.to_excel(writer, sheet_name='一表', index=False)
    df2.to_excel(writer, sheet_name='二表', index=False)
```

`ExcelWriter` 上下文管理器自动保存文件，`engine='openpyxl'` 是 xlsx 的默认引擎。

## 1.9.3 SQL 数据库

Pandas 通过 SQLAlchemy 连接数据库。`pd.read_sql()` 执行 SQL 查询并返回 DataFrame：

```python
import sqlalchemy

engine = sqlalchemy.create_engine('sqlite:///db.sqlite')
df = pd.read_sql('SELECT * FROM table_name', engine)
```

`pd.read_sql_query()` 只接受查询语句，`pd.read_sql_table()` 只接受表名。`pd.to_sql()` 把 DataFrame 写入数据库表：

```python
df.to_sql('table_name', engine, if_exists='replace', index=False)
```

`if_exists` 取值 `'fail'`（表存在则报错）、`'replace'`（删除重建）、`'append'`（追加）。

## 1.9.4 HDF5 格式

HDF5 是适合大规模科学数据的二进制格式，`pd.read_hdf()` 与 `pd.to_hdf()` 支持键值存储：

```python
df.to_hdf('data.h5', key='df', mode='w')
df2 = pd.read_hdf('data.h5', key='df')
```

需要安装 `tables` 库。

## 1.9.5 Parquet 格式

Parquet 是列式存储格式，压缩率高、读写快，适合大数据：

```python
df.to_parquet('data.parquet')
df2 = pd.read_parquet('data.parquet')
```

需要安装 `pyarrow` 库。

## 1.9.6 Feather 格式

Feather 是跨语言（R 与 Python）共享数据的轻量格式：

```python
df.to_feather('data.feather')
df2 = pd.read_feather('data.feather')
```

需要安装 `pyarrow` 库。

## 1.9.7 Stata、SAS、SPSS 格式

这三种是统计软件的数据格式：

```python
df.to_stata('data.dta')           # Stata
df2 = pd.read_stata('data.dta')
df3 = pd.read_sas('data.sas7bdat')  # SAS
df4 = pd.read_spss('data.sav')      # SPSS
```

`read_sas` 与 `read_spss` 只读不写，读取 SPSS 需要 `pyreadstat` 库。

## 1.9.8 Pickle 格式

Pickle 是 Python 原生序列化格式，可以保存任意 Python 对象，速度最快但只限 Python 使用、且有安全问题（不读取不可信来源的 pickle）：

```python
df.to_pickle('data.pkl')
df2 = pd.read_pickle('data.pkl')
```

## 1.9.9 剪贴板

`pd.read_clipboard()` 读取系统剪贴板中的表格（常用于把 Excel 复制内容读入），`pd.to_clipboard()` 把 DataFrame 写入剪贴板：

```python
df = pd.read_clipboard()   # 复制表格后调用
df.to_clipboard()
```

## 1.9.10 字典与列表转换

DataFrame 与 Python 内置结构互转：

```python
df = pd.DataFrame({'A': [1, 2], 'B': [3, 4]})

print(df.to_dict())                    # 字典：{列: {索引: 值}}
print(df.to_dict('records'))           # 记录列表
print(df['A'].to_list())               # 列表
print(df.to_numpy())                   # 数组

df2 = pd.DataFrame.from_dict({'A': [1, 2]})       # 从字典创建
df3 = pd.DataFrame.from_records([{'A': 1}, {'A': 2}])   # 从记录创建
```

`.to_dict()` 的 `orient` 参数控制输出结构，`'records'` 是面向行的列表，`'list'` 是面向列的字典，`'index'` 是面向索引的字典。

## 1.9.11 其他输出

```python
print(df.to_string())        # 字符串表示
print(df.to_markdown())      # Markdown 表格
print(df.to_latex())         # LaTeX 表格
print(df.to_records())       # 记录数组
```

`to_markdown` 方便把结果直接粘贴进 Markdown 文档，`to_latex` 用于学术论文的 LaTeX 表格。

## 练习题

### 第1题 概念理解

说明 `read_csv` 常用参数 `sep`、`encoding`、`parse_dates`、`index_col` 的作用；说明 `ExcelWriter` 相比多次 `to_excel` 的优势。

::: details 参考答案

`sep` 指定分隔符，`encoding` 指定文本编码，`parse_dates` 把列解析为时间类型，`index_col` 指定索引列。`ExcelWriter` 可以在一次会话中把多张表写入同一个 Excel 的不同工作表。
:::

### 第2题 代码编写

创建一个 DataFrame，分别用 `to_csv`、`to_json`、`to_excel` 写出；再用对应读取函数读回并验证内容一致。

::: details 参考答案

```python
import pandas as pd

df = pd.DataFrame({'A': [1, 2, 3], 'B': ['x', 'y', 'z']})
df.to_csv('tmp.csv', index=False)
df.to_json('tmp.json')
df.to_excel('tmp.xlsx', index=False)

print(pd.read_csv('tmp.csv'))
print(pd.read_json('tmp.json'))
print(pd.read_excel('tmp.xlsx'))
```

:::

### 第3题 进阶练习

用 `ExcelWriter` 把三张表写入同一个 Excel 的三个工作表，再用 `read_excel(sheet_name=None)` 读回；用 `to_dict('records')` 把 DataFrame 转成记录列表，再用 `from_records` 还原。

::: details 参考答案

```python
import pandas as pd

df1 = pd.DataFrame({'a': [1]})
df2 = pd.DataFrame({'b': [2]})
df3 = pd.DataFrame({'c': [3]})

with pd.ExcelWriter('multi.xlsx') as writer:
    df1.to_excel(writer, sheet_name='t1', index=False)
    df2.to_excel(writer, sheet_name='t2', index=False)
    df3.to_excel(writer, sheet_name='t3', index=False)

sheets = pd.read_excel('multi.xlsx', sheet_name=None)
print(sheets.keys())

records = df1.to_dict('records')
print(pd.DataFrame.from_records(records))
```

:::

## 常见错误

**错误 1 · `UnicodeDecodeError: 'utf-8' codec can't decode byte...`**

原因:文件编码不是 UTF-8,常见于 Windows 生成的中文 CSV(GBK 编码)。

解决:指定 `encoding='gbk'` 或 `encoding='utf-8-sig'` 尝试读取。

**错误 2 · 读入后日期列仍是字符串**

原因:`read_csv` 默认把日期当字符串,没有 `parse_dates` 参数。

解决:加 `parse_dates=['列名']`,或读入后用 `pd.to_datetime` 转换。

**错误 3 · `to_excel` 报缺少 `openpyxl` 库**

原因:Excel 读写依赖 openpyxl 库,未安装时报错。

解决:`pip install openpyxl`。

**错误 4 · 读入 CSV 后第一列变成无名索引列**

原因:CSV 里保存了行索引,读入时被当成普通列。

解决:写出时用 `index=False`,或读入时用 `index_col=0` 把该列设为索引。
