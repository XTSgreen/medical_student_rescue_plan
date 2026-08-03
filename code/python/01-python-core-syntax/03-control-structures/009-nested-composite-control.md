---
title: 3.9 嵌套与复合控制结构
sidebar:
  order: 9
---
# 3.9 嵌套与复合控制结构


实际程序中的控制流很少是单一层级的。一段逻辑往往需要先判断外部条件，再在判断成立时进入循环，循环体内又需要根据元素特征做进一步分支，甚至还要在分支里处理可能抛出的异常。这种一层套一层的写法称为**嵌套**，而把不同类型的控制结构组合起来解决一个完整任务则称为**复合控制结构**。Python 通过缩进来界定代码块（不像 C 或 Java 使用大括号），因此嵌套在 Python 中表现得直观，每一层缩进都对应一个语义层级。本节系统讨论分支、循环、异常处理、上下文管理四类结构的相互嵌套方式，以及嵌套深度管理与跳出多重嵌套的工程技巧。

## 3.9.1 分支结构内部嵌套分支结构

最基础的嵌套形式是在一个 `if` 分支的内部再写 `if`。当外层条件成立后，还需要进一步细分处理时，就需要内层分支。典型场景是分层判定：先判断大类，再在小类内判断细节。例如对一段用户输入做安全校验，先判断是否为空，非空时再判断长度是否合法，长度合法时再判断是否包含非法字符。

```python
# 分层校验用户名
username = input("请输入用户名: ").strip()

if not username:
    print("用户名不能为空")
else:
    if len(username) < 3:
        print("用户名长度至少 3 个字符")
    elif len(username) > 20:
        print("用户名长度不能超过 20 个字符")
    else:
        # 长度合法，进一步检查字符组成
        if username[0].isdigit():
            print("用户名不能以数字开头")
        elif not username.isalnum():
            print("用户名只能包含字母和数字")
        else:
            print(f"用户名 {username} 校验通过")
```

这种写法的执行顺序是自外向内的：只有外层条件成立，才会进入内层判断。内层判断的代码缩进多了一级，表示它依赖于外层条件成立这个前提。需要注意，当外层使用 `elif` 链时，内层分支只会在其归属的那个外层分支中执行，与其他外层分支互不干扰。

嵌套分支的另一种常见形态是在 `if` 和 `else` 各自内部再嵌套分支，形成对称的细分结构。

```python
# 根据分数段给出评级
score = 78

if score >= 60:
    # 及格后再细分
    if score >= 90:
        grade = "优秀"
    elif score >= 80:
        grade = "良好"
    else:
        grade = "及格"
else:
    # 不及格的细分
    if score >= 50:
        grade = "接近及格"
    else:
        grade = "不及格"

print(f"评级: {grade}")
```

嵌套分支让逻辑层级清晰，但要避免过度嵌套。当 `if` 内部又嵌套 `if`，且内层 `if` 还有 `elif` 和 `else` 时，缩进会迅速加深。如果发现嵌套层数超过三层，通常可以通过提前 `return`、合并条件或拆分函数来简化。这种简化技巧在 3.9.9 节会专门讨论。

## 3.9.2 分支结构内部嵌套循环结构

分支判断成立后，往往需要在分支内部执行循环任务。例如在通过权限校验后批量处理数据，或在某个模式被选中后启动循环计算。这种嵌套的特征是循环整体受外层分支控制，分支不成立则循环根本不会被执行。

```python
# 根据用户选择的操作模式执行不同的循环
mode = "sum"
data = [3, 7, 2, 9, 4]

if mode == "sum":
    total = 0
    for num in data:
        total += num
    print(f"求和结果: {total}")
elif mode == "max":
    # 在另一个分支中嵌套另一个循环
    current = data[0]
    for num in data[1:]:
        if num > current:
            current = num
    print(f"最大值: {current}")
elif mode == "filter":
    # 嵌套带条件的循环
    positives = []
    for num in data:
        if num > 5:
            positives.append(num)
    print(f"大于 5 的数: {positives}")
else:
    print("未知模式")
```

这种结构的优势在于把循环的**启动条件**和**循环体本身**分离。外层分支决定要不要循环、按什么策略循环，内层循环专注于迭代逻辑。在命令行工具或交互式程序中，这种写法常见：根据用户输入的子命令进入不同的处理分支，每个分支内部是各自独立的循环处理。

需要注意的是，分支内部的循环仍然受 `break` 和 `continue` 影响，但这两个关键字只作用于最内层循环，不会跳出到外层分支之外。如果需要根据循环结果决定分支后续走向，应当通过变量传递信号。

```python
# 在分支内的循环中查找目标，找到后处理
target = 7
found = False

if target is not None:
    for item in [1, 3, 7, 9]:
        if item == target:
            found = True
            break
    # 循环结束后，根据 found 决定后续动作
    if found:
        print(f"已找到 {target}，开始后续处理")
    else:
        print(f"未找到 {target}")
```

## 3.9.3 循环结构内部嵌套分支结构

这是常见的嵌套形式之一。遍历一组数据时，对每个元素都要做条件判断，根据判断结果执行不同操作。典型场景包括过滤、分类、查找、累加条件命中项等。循环负责遍历，分支负责针对当前元素做决策，二者协作完成整体任务。

```python
# 将一组整数按奇偶分类
numbers = [12, 5, 8, 17, 20, 3, 9]
evens = []
odds = []

for n in numbers:
    if n % 2 == 0:
        evens.append(n)
    else:
        odds.append(n)

print(f"偶数: {evens}")
print(f"奇数: {odds}")
```

循环内的分支可以更复杂，包含多个 `elif` 分支甚至嵌套的循环。例如对一组学生成绩做分级统计，遍历每个成绩，根据其分段累加到对应的计数器上。

```python
# 成绩分级统计
scores = [92, 65, 78, 45, 88, 95, 30, 70]
counter = {"优秀": 0, "良好": 0, "及格": 0, "不及格": 0}

for s in scores:
    if s >= 90:
        counter["优秀"] += 1
    elif s >= 80:
        counter["良好"] += 1
    elif s >= 60:
        counter["及格"] += 1
    else:
        counter["不及格"] += 1

for level, count in counter.items():
    print(f"{level}: {count} 人")
```

循环内嵌套分支时，要留意 `continue` 的使用。`continue` 会跳过当前元素后续的分支判断，直接进入下一轮循环。在过滤场景中合理使用 `continue` 可以减少缩进层级，让主逻辑保持平铺。

```python
# 跳过无效数据，只处理有效数据
raw_values = ["12", "abc", "34", "", "56"]

for raw in raw_values:
    if not raw.strip():
        continue  # 跳过空字符串
    if not raw.lstrip("-").isdigit():
        continue  # 跳过非数字
    value = int(raw)
    print(f"处理: {value * 2}")
```

这种写法通过 `continue` 把异常情况提前排除，让正常处理的代码留在最外层缩进上，可读性优于把所有逻辑塞进一个深层 `else` 块中。这种模式被称为**早返回**或**早跳过**，是控制嵌套深度的常用手段。

## 3.9.4 循环结构内部嵌套循环结构

循环嵌套循环用于处理二维结构或笛卡尔积场景。外层循环每迭代一次，内层循环完整执行一遍。最典型的例子是遍历二维矩阵、打印乘法表、生成所有组合对。理解嵌套循环的关键在于认清内层循环的执行次数等于外层循环次数乘以内层循环次数，因此总迭代数会迅速增长。

```python
# 打印九九乘法表
for i in range(1, 10):
    for j in range(1, i + 1):
        product = i * j
        print(f"{j}x{i}={product}", end="  ")
    print()  # 每行结束后换行
```

这段代码中，外层循环控制行号 `i`，内层循环控制列号 `j`，内层循环的上界依赖外层变量 `i`，因此每行的列数递增。当 `i = 1` 时内层执行 1 次，`i = 2` 时执行 2 次，依此类推，总执行次数为 1+2+3+...+9 = 45 次。

处理二维数据时，嵌套循环几乎是必然选择。下面的例子遍历一个由列表组成的列表（即二维列表），对每个元素进行累加。

```python
# 计算二维矩阵所有元素之和
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

total = 0
for row in matrix:        # 外层遍历每一行
    for cell in row:      # 内层遍历行中的每个元素
        total += cell

print(f"总和: {total}")  # 45
```

嵌套循环在执行效率上需要特别留意。当外层循环 N 次内层循环 M 次时，总迭代数为 N×M。如果两层都是万级规模，总迭代数就是亿级，可能造成明显的性能问题。在这种规模下，应考虑用集合查找、字典映射或 NumPy 向量化操作替代嵌套循环。

```python
# 查找两个列表中的公共元素
# 低效写法：双层循环，O(n*m)
list_a = [1, 2, 3, 4, 5]
list_b = [4, 5, 6, 7, 8]
common = []
for a in list_a:
    for b in list_b:
        if a == b:
            common.append(a)
            break

# 高效写法：用集合求交集，O(n+m)
common_fast = list(set(list_a) & set(list_b))
```

::: note 嵌套循环的命名建议
外层循环变量与内层循环变量应使用语义化的名字，避免都用 `i`、`j`、`k` 这种无意义的字母。例如遍历行列时用 `row`、`col`，遍历学生和课程时用 `student`、`course`。良好的命名能在不增加缩进的情况下显著提升可读性。
:::

## 3.9.5 循环结构内部嵌套异常处理结构

循环处理一批数据时，难免遇到部分元素有问题：解析失败的字符串、除零、键不存在等。如果不用异常处理，一条坏数据会让整个循环中断，后续数据全部得不到处理。把 `try/except` 嵌套在循环内部，可以捕获单个元素的处理错误，跳过该元素后继续处理后续数据。

```python
# 把一组字符串转成整数，跳过无法转换的
raw_inputs = ["10", "20", "abc", "30", "12.5", "40"]
results = []

for raw in raw_inputs:
    try:
        value = int(raw)
        results.append(value)
    except ValueError:
        print(f"跳过无法解析的输入: {raw!r}")

print(f"成功转换: {results}")  # [10, 20, 30, 40]
```

注意 `try` 块的位置：它位于循环体内部，每轮迭代都会重新进入和退出 `try`。这种写法保证上一轮的异常不会影响下一轮。如果把 `try` 放在循环外面，第一次异常就会跳到循环之外的 `except`，剩余元素不会被处理，这通常不是想要的语义。

循环内的异常处理常用于读取文件、解析网络响应、处理用户批量输入等场景。一个稍复杂的例子是从一组配置项中提取数值，对格式异常、缺失字段、数值越界分别处理。

```python
configs = ["timeout=30", "retries=abc", "cache=", "size=1024", "port=99999"]
settings = {}

for line in configs:
    try:
        key, value_str = line.split("=")
        if not value_str:
            raise ValueError("值为空")
        value = int(value_str)
        if value < 0 or value > 65535:
            raise ValueError(f"数值越界: {value}")
        settings[key] = value
    except ValueError as e:
        print(f"配置项 {line!r} 无效: {e}")

print(f"有效配置: {settings}")
```

这种写法把校验逻辑放在 `try` 内部，主动 `raise` 抛出异常由同一 `except` 统一捕获。逻辑紧凑，错误信息也集中。要注意异常处理不应被滥用为常规流程控制，只有在真正异常的情况下才应抛出和捕获。

## 3.9.6 异常处理结构内部嵌套分支或循环结构

`try/except/else/finally` 块内部本身就是一个普通的代码块，可以放置任意控制结构。在 `except` 中常常需要根据异常类型或异常信息做不同处理，这就需要嵌套分支。在 `else` 或 `finally` 中也常需要循环执行清理或重试操作。

```python
# 在 except 中根据异常类型分别处理
def parse_value(s):
    try:
        return int(s)
    except ValueError as e:
        msg = str(e)
        if "invalid literal" in msg:
            print(f"  非数字字符: {s!r}")
        else:
            print(f"  其他解析错误: {msg}")
        return None
    except TypeError:
        print(f"  类型错误，传入的值不是字符串")
        return None

parse_value("42")     # 正常返回 42
parse_value("abc")    # 非数字字符
parse_value(None)     # 类型错误
```

异常处理内部嵌套循环的典型场景是**重试机制**。某个操作可能因为瞬时故障失败，比如网络请求、文件锁定、数据库连接。在 `except` 中等待一段时间后重新尝试，循环若干次直至成功或耗尽重试次数。

```python
import time

def fetch_with_retry(url, max_retries=3):
    for attempt in range(1, max_retries + 1):
        try:
            # 模拟一个可能失败的操作
            if attempt < 3:
                raise ConnectionError(f"连接失败 (第 {attempt} 次)")
            return f"来自 {url} 的数据"
        except ConnectionError as e:
            print(f"  错误: {e}")
            if attempt < max_retries:
                print(f"  等待 {attempt} 秒后重试...")
                time.sleep(attempt)
            else:
                print("  已达最大重试次数，放弃")
                raise

data = fetch_with_retry("https://example.com/api")
print(f"获取成功: {data}")
```

这个例子展示了循环与异常处理的深度协作：外层循环控制重试次数，`try` 内部执行可能失败的操作，`except` 中判断是否还有重试机会。最后一次失败时通过 `raise` 不带参数重新抛出原异常，让调用者感知到操作最终失败。

`finally` 块内部也可以嵌套循环，常用于清理多个资源。

```python
# finally 中清理多个临时文件
import os

temp_files = ["t1.tmp", "t2.tmp", "t3.tmp"]
try:
    # 主操作
    raise RuntimeError("主流程出错")
finally:
    # 无论是否出错都清理
    for f in temp_files:
        try:
            os.remove(f)
            print(f"已删除 {f}")
        except FileNotFoundError:
            pass
```

`finally` 中的嵌套循环还自带异常处理，保证单个文件删除失败不影响其他文件的清理。这种**防御性清理**在生产代码中很常见。

## 3.9.7 with 语句内部嵌套分支或循环结构

`with` 语句用于资源管理，保证资源在使用完毕后被正确释放。`with` 内部的代码块同样可以嵌套任意控制结构。常见的场景是在打开文件后逐行处理，对每行内容做分支判断或循环解析。

```python
# 统计文件中各类日志条目数量
counts = {"INFO": 0, "WARNING": 0, "ERROR": 0}

with open("app.log", encoding="utf-8") as f:
    for line in f:                    # 循环遍历每一行
        line = line.strip()
        if line.startswith("[INFO]"):
            counts["INFO"] += 1
        elif line.startswith("[WARNING]"):
            counts["WARNING"] += 1
        elif line.startswith("[ERROR]"):
            counts["ERROR"] += 1

print(counts)
```

`with` 内部嵌套循环遍历文件对象是最经典的文件处理模式。`for line in f` 按行迭代，内存占用低，适合处理大文件。循环体内的分支根据行内容做不同处理。整个过程中即使某行处理抛出异常，`with` 也会保证文件被正确关闭。

多个 `with` 之间也可以嵌套，用于同时管理多个资源。Python 允许在一条 `with` 语句中用逗号分隔多个上下文管理器，等价于多层嵌套。

```python
# 同时打开输入和输出文件
with open("input.txt", encoding="utf-8") as fin, \
     open("output.txt", "w", encoding="utf-8") as fout:
    for line in fin:
        cleaned = line.strip()
        if cleaned:                  # 只写出非空行
            fout.write(cleaned + "\n")
```

这等价于两层 `with` 嵌套，但写法更紧凑。注意如果两个资源的创建顺序有依赖（第二个资源依赖第一个），仍应写成显式的多层嵌套形式。

`with` 内部嵌套异常处理也很常见，用于处理单个元素的问题而不影响整体资源生命周期。

```python
# 读取数字文件，跳过无法解析的行
numbers = []
with open("numbers.txt", encoding="utf-8") as f:
    for line in f:
        try:
            numbers.append(int(line.strip()))
        except ValueError:
            print(f"跳过非数字行: {line.strip()!r}")

print(f"读取到 {len(numbers)} 个数字")
```

## 3.9.8 嵌套结构的缩进层级管理

Python 用缩进表示代码块的层级关系，每级缩进通常为 4 个空格（PEP 8 规定）。嵌套越深，缩进越多，代码在视觉上越向右偏移。理解缩进与语义的对应关系是阅读和编写嵌套结构的基本功。

下面是一段三层嵌套的代码，标注了每一层对应的语义。

```python
data = {"users": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]}
# 第一层：访问字典
if "users" in data:
    users = data["users"]
    # 第二层：遍历列表
    for user in users:
        # 第三层：判断每个用户
        if user.get("age", 0) >= 30:
            print(f"{user['name']} 已达 30 岁")
```

缩进让代码块的归属清晰：`for` 循环整体位于 `if` 成立时执行，`if` 判断位于循环的每一轮中执行。阅读嵌套代码时，应当从外向内逐层理解：先看最外层条件，再看外层条件成立时执行的循环，最后看循环体内对每个元素的处理。

管理缩进层级的核心原则是**让最外层保持简洁，把细节下推到内层或函数中**。当代码顶层就有很深的缩进时，往往意味着主流程被淹没在细节里。下面是一个反例：

```python
# 反例：主流程被埋在多层缩进下
def process(items):
    if items:
        for item in items:
            if item is not None:
                try:
                    result = do_something(item)
                    if result:
                        print(result)
                except Exception:
                    pass
```

通过提前返回和提前跳过，可以把主流程拉回到顶层缩进：

```python
# 正例：通过早返回和 continue 减少缩进
def process(items):
    if not items:
        return

    for item in items:
        if item is None:
            continue

        try:
            result = do_something(item)
        except Exception:
            continue

        if result:
            print(result)
```

两种写法功能完全等价，但第二种每个步骤都贴近左侧，阅读时不需要横向追踪缩进。这种重构技巧在 3.9.9 节还会进一步讨论。

## 3.9.9 嵌套结构的可读性规范（最大嵌套层数建议）

嵌套层数过多会让代码难以阅读和维护。业界普遍建议单个函数的最大嵌套深度控制在 **3 到 4 层**以内。超过这个深度时，人脑跟踪每一层条件与循环的语境会变得吃力，bug 容易在层与层之间藏匿。

衡量嵌套深度的方法是数从函数体到当前语句之间跨越了多少个 `if`、`for`、`while`、`try`、`with` 块。例如下面的代码片段中，`print` 语句的嵌套深度为 4。

```python
def analyze(data):
    if data:                        # 第 1 层
        for item in data:           # 第 2 层
            if item.active:         # 第 3 层
                try:                # 第 4 层
                    print(item.value)
                except AttributeError:
                    pass
```

降低嵌套深度的常用手段有几种。第一种是**提前返回**，在函数开头就排除异常情况，让主流程不进入缩进。第二种是**提前跳过**，在循环开头用 `continue` 排除不需要的元素。第三种是把内层逻辑**抽取成独立函数**，把复杂度封装到函数内部。

```python
# 把内层逻辑抽成函数，主流程保持平铺
def process_item(item):
    if not item.active:
        return None
    try:
        return item.value
    except AttributeError:
        return None

def analyze(data):
    if not data:
        return
    for item in data:
        result = process_item(item)
        if result is not None:
            print(result)
```

抽取函数后，主流程 `analyze` 的最大嵌套深度从 4 降为 2，每个函数都聚焦于单一职责。这种重构并不会增加运行时开销，但显著降低了阅读和测试的难度。

::: note 嵌套深度的工具检测
静态检查工具如 `pylint`、`flake8` 配合 `flake8-cognitive-complexity` 插件可以自动检测函数嵌套深度。在 CI 流程中加入这类检查，能在代码合并前提醒开发者关注过深的嵌套。建议团队约定一个阈值（如 4 层），超过阈值的函数需要重构。
:::

除了控制嵌套深度，还要关注**认知复杂度**，即理解一段代码所需的心智负担。两段嵌套深度相同的代码，认知复杂度可能差异很大。例如纯线性 `if/elif/elif` 链即使很长也容易理解，而三层嵌套 `if` 内部带 `break` 和 `continue` 的代码就难懂得多。重构时优先简化后者。

## 3.9.10 使用 break 跳出多重嵌套的唯一方式（需结合标志变量或封装函数）

`break` 关键字的一个易错点是它**只跳出最内层循环**，对外层循环毫无影响。这一点在多层嵌套中尤其需要警惕。看下面的反例：

```python
# 反例：break 只跳出内层循环
target = 7
matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]

for row in matrix:
    for cell in row:
        if cell == target:
            print(f"找到 {target}")
            break  # 只跳出内层 for，外层继续遍历下一行
    # 外层循环不会自动停止
```

这段代码在找到目标后会打印一条消息，但外层循环仍会继续遍历剩下的行。这种 bug 在二维查找中常见。

要在找到目标后跳出所有嵌套循环，Python 没有提供直接跳多层的关键字，必须借助其他手段。最直接的两种方式是**标志变量**和**封装函数**。

第一种方式是用标志变量配合外层条件判断。引入一个布尔变量记录是否已找到目标，外层循环在每轮检查这个变量，命中则再次 `break`。

```python
# 方式一：标志变量
target = 7
found = False

for row in matrix:
    for cell in row:
        if cell == target:
            found = True
            break  # 跳出内层
    if found:
        break  # 跳出外层

if found:
    print(f"找到 {target}")
else:
    print("未找到")
```

这种方式可行但略显啰嗦，每层循环都要加一次 `if found: break`。在三层以上嵌套中，这种重复会变得繁琐。

第二种方式是把查找逻辑封装到函数中，找到目标后直接 `return`，绕过所有嵌套层级。这是 Python 中跳出多重嵌套最简洁的写法。

```python
# 方式二：封装函数，用 return 跳出所有嵌套
def find_target(matrix, target):
    for row in matrix:
        for cell in row:
            if cell == target:
                return True  # 直接返回，跳出所有循环
    return False

if find_target(matrix, 7):
    print("找到 7")
else:
    print("未找到")
```

`return` 一次性退出整个函数，所有嵌套层级都不需要额外的标志变量。这种写法把查找逻辑独立成函数，主调用处只关心是否找到，符合关注点分离原则。

::: note 第三种方式：异常与 for/else
理论上也可以通过抛出自定义异常来跳出多重嵌套，在循环外用 `try/except` 捕获。但这种做法把异常当作流程控制工具，违反了异常只用于异常情况的惯例，可读性也不如前两种方式，除非确实有特殊的清理需求，否则不推荐使用。
:::

Python 还提供了 `for...else` 和 `while...else` 语法，`else` 块在循环**正常结束**（没有遇到 `break`）时执行。这种结构可以替代标志变量，让查找失败的逻辑更紧凑。

```python
# 使用 for/else 替代标志变量
target = 7
for row in matrix:
    for cell in row:
        if cell == target:
            print(f"找到 {target}")
            break
    else:
        # 内层循环正常结束，说明本行没找到，继续下一行
        continue
    # 内层循环遇到 break，说明已找到，跳出外层
    break
else:
    # 外层循环正常结束，说明所有行都没找到
    print("未找到")
```

`for/else` 的语义略显隐晦，初学者容易混淆。在团队代码中如果觉得可读性不佳，仍以函数封装加 `return` 的方式为首选。

## 3.9.11 复合条件的短路求值在嵌套结构中的性能考量

Python 的逻辑运算符 `and` 和 `or` 采用**短路求值**：`a and b` 中如果 `a` 为假，就不再计算 `b`；`a or b` 中如果 `a` 为真，就不再计算 `b`。这一特性在嵌套结构中常被用来替代部分 `if` 嵌套，让代码更紧凑，同时避免不必要的计算。

考虑下面这段嵌套判断：

```python
# 用嵌套 if 做条件检查
def safe_divide(a, b):
    if b != 0:
        if a is not None:
            return a / b
    return None
```

利用短路求值，可以把两层 `if` 合并成一个表达式：

```python
# 用 and 短路合并条件
def safe_divide(a, b):
    if b != 0 and a is not None:
        return a / b
    return None
```

两种写法等价，但第二种少了一层缩进。当条件较多时，这种合并能显著降低嵌套深度。

短路求值在性能上的价值体现在它能**避免昂贵的计算**。当后续条件依赖前面条件的成立时，把依赖关系放在 `and` 链中，可以让前面的便宜检查挡住后面的昂贵检查。

```python
# 先做廉价的长度检查，再做昂贵的正则匹配
import re

def is_valid_email(s):
    # 长度检查很便宜，先做
    # 正则匹配较贵，放在 and 后面
    return (isinstance(s, str)
            and len(s) >= 5
            and len(s) <= 254
            and "@" in s
            and re.match(r"^[^@]+@[^@]+\.[^@]+$", s) is not None)

print(is_valid_email("user@example.com"))  # True
print(is_valid_email("x"))                  # False，不会执行正则
```

这段代码先做类型检查、长度检查、子串检查，这些都极快；只有这些检查全部通过后才会执行相对昂贵的正则匹配。如果输入明显不合法（比如长度只有 1），函数会在前几个条件就返回，不会浪费时间在正则上。这种**便宜前置、昂贵后置**的条件排序原则在性能敏感的代码中很重要。

在嵌套循环中，短路求值也能用于优化内层判断。下面的例子在二维矩阵中查找满足多个条件的元素，把条件按计算成本从低到高排列，可以让大部分元素在前几个条件就被排除。

```python
# 在二维数据中查找符合条件的第一个元素
matrix = [
    [(1, "a"), (2, "b"), (3, "c")],
    [(4, "d"), (5, "e"), (6, "f")],
    [(7, "g"), (8, "h"), (9, "i")],
]

def find_first_match(data, min_value, target_letter):
    for row in data:
        for value, letter in row:
            # 廉价检查前置：数值比较
            # 昂贵检查后置：字符串匹配
            if value >= min_value and letter == target_letter:
                return (value, letter)
    return None

print(find_first_match(matrix, 5, "h"))  # (8, 'h')
```

需要警惕的是短路求值有**副作用**的陷阱。如果 `and` 后面的表达式包含函数调用，而该函数有副作用（修改全局状态、打印日志、写入文件），那么当短路发生时这个副作用就不会被执行。在调试时这可能导致日志缺失或状态不一致。

```python
# 短路可能跳过有副作用的调用
def log_access(x):
    print(f"访问了 {x}")
    return True

# 当 a 为假时，log_access 不会被调用
a = False
if a and log_access("重要数据"):
    print("处理数据")
# 不会打印 "访问了 重要数据"
```

如果副作用必须执行，应当把它从条件中拆出来单独调用，避免被短路跳过。在嵌套结构中，这一点很重要，因为短路行为发生在条件表达式中，不像显式 `if` 那样直观。

综合来看，短路求值是 Python 中一项基础但强大的特性。在嵌套结构中合理使用它，既能减少缩进层级，又能避免不必要的计算。使用时把便宜的条件前置、昂贵的条件后置，同时避免在条件中嵌入有副作用的调用，就可以兼顾性能与可读性。

## 练习题

### 第 1 题：写出下列嵌套循环的输出结果

阅读下面这段嵌套循环代码，在不运行的情况下写出它的输出。

```python
for i in range(3):
    for j in range(3):
        if i == j:
            continue
        print(f"({i},{j})", end=" ")
    print()
```

::: details 参考答案
输出如下。外层循环 `i` 取 0、1、2，内层循环 `j` 取 0、1、2。`i == j` 时被 `continue` 跳过，所以每行只打印两个坐标对。

```
(0,1) (0,2) 
(1,0) (1,2) 
(2,0) (2,1) 
```
:::

### 第 2 题：用循环嵌套分支对数据分类

给定列表 `numbers = [12, 5, 8, 17, 20, 3, 9]`，请用 for 循环遍历，配合 if-else 把偶数放进 `evens` 列表，奇数放进 `odds` 列表，最后打印两个列表。

::: details 参考答案
```python
numbers = [12, 5, 8, 17, 20, 3, 9]
evens = []
odds = []

for n in numbers:
    if n % 2 == 0:
        evens.append(n)
    else:
        odds.append(n)

print("偶数:", evens)
print("奇数:", odds)
```

输出：

```
偶数: [12, 8, 20]
奇数: [5, 17, 3, 9]
```

循环负责遍历，分支负责针对当前元素做决策，这是循环内嵌套分支常见的形态。两个收集列表在循环外初始化，循环中根据条件分别追加。
:::

### 第 3 题：用循环嵌套异常处理跳过无效数据

给定列表 `raw = ["10", "abc", "20", "", "30"]`，请用 for 循环遍历，对每个元素尝试转换为整数并加入结果列表。无法转换的元素打印警告并跳过，不让一条坏数据中断整个循环。

::: details 参考答案
```python
raw = ["10", "abc", "20", "", "30"]
results = []

for item in raw:
    try:
        value = int(item)
        results.append(value)
    except ValueError:
        print(f"跳过无效输入: {item!r}")

print("成功转换:", results)
```

输出：

```
跳过无效输入: 'abc'
跳过无效输入: ''
成功转换: [10, 20, 30]
```

`try` 块放在循环体内部，每轮迭代都会重新进入和退出 `try`，保证上一轮的异常不影响下一轮。如果把 `try` 放在循环外面，第一次异常就会跳出循环，后续数据得不到处理。
:::

### 第 4 题：项目练习题（命令行任务管理器）

命令行任务管理器需要把任务按状态分组统计。给定任务列表，每个任务有 `name` 和 `status` 字段（值为 `"todo"`、`"done"`、`"cancelled"`），请用循环嵌套分支统计每种状态的任务数量，并打印结果。

::: details 参考答案
```python
tasks = [
    {"name": "写文档", "status": "done"},
    {"name": "评审代码", "status": "todo"},
    {"name": "修复 Bug", "status": "todo"},
    {"name": "旧需求", "status": "cancelled"},
    {"name": "测试", "status": "done"},
]

counter = {"todo": 0, "done": 0, "cancelled": 0}

for task in tasks:
    status = task["status"]
    if status in counter:
        counter[status] += 1
    else:
        print(f"未知状态: {status}")

for status, count in counter.items():
    print(f"{status}: {count} 个")
```

输出：

```
todo: 2 个
done: 2 个
cancelled: 1 个
```

外层循环遍历任务列表，内层分支判断状态并累加到对应的计数器。这是任务管理器中"统计概览"功能的典型实现，循环与分支协作完成数据聚合。
:::

## 常见错误

**错误 1 · `break 只跳出最内层循环，外层继续遍历`**

原因:在多层嵌套循环中，`break` 仅作用于直接包含它的那一层循环，外层循环不受影响。二维查找中常见此问题，找到目标后外层仍继续扫描剩余行。

解决:引入标志变量，内层 `break` 后在外层检查标志并再次 `break`；或把查找逻辑封装成函数，用 `return` 一次性退出所有循环。

**错误 2 · `嵌套循环缩进错误导致内层循环归属错误`**

原因:Python 用缩进界定代码块层级，内层循环的缩进量写错会导致它归属到错误的外层结构。少缩进一级会让内层循环脱离外层分支，多缩进一级会让普通语句被误认为循环体。

解决:检查每层循环的缩进量，外层与内层相差 4 个空格。用编辑器的缩进辅助线对照层级关系。

**错误 3 · `短路求值跳过有副作用的函数调用`**

原因:`and` 和 `or` 采用短路求值，左操作数满足条件时右操作数不计算。如果右操作数包含有副作用的调用（如日志记录、状态修改），短路发生时副作用不会执行。

解决:把必须执行的副作用从条件表达式中拆出，单独调用。不要在 `and`/`or` 条件中嵌入有副作用的调用。
