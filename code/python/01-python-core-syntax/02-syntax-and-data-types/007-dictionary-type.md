---
title: 2.7 字典类型
sidebar:
  order: 7
---
# 2.7 字典类型

<span class="chapter-tag">Python核心语法基础</span>

医学场景中经常需要把信息以键值对的形式成对存放，比如患者 ID 对应姓名、检验项目对应结果、ICD 编码对应诊断名称。这种一一对应的关系在 Python 中由字典（dict）类型来表达。字典是 Python 中最重要的内置数据结构之一，几乎所有稍微复杂的数据组织都会用到它。本节将从字面量写法讲起，逐步介绍字典的创建、访问、修改、迭代、推导式与嵌套结构，帮助你在处理临床数据时能够熟练运用这一利器。

## 2.7.1 字典字面量

字典的字面量写法是用一对花括号包裹若干"键: 值"对，键值对之间用逗号分隔，键与值之间用冒号连接。下面这条语句创建了一个以患者 ID 为键、姓名为值的字典：

```python
patient_names = {
    "P001": "张三",
    "P002": "李四",
    "P003": "王五"
}
print(patient_names)
# {'P001': '张三', 'P002': '李四', 'P003': '王五'}
```

键和值都可以是任意表达式，不必是字符串字面量。下面的例子中键是整数（年龄），值是字符串（年龄段描述）：

```python
age_group = {0: "新生儿", 18: "成人", 65: "老年"}
print(age_group[65])  # 老年
```

字典允许键和值类型混合，同一个字典中可以同时存在不同类型的键。这种灵活性在处理异构数据时非常方便。

## 2.7.2 空字典

创建空字典最直接的方式是写一对不包含任何内容的花括号：

```python
empty_dict = {}
print(type(empty_dict))  # <class 'dict'>
print(empty_dict)        # {}
```

也可以用 `dict()` 内置函数无参数调用得到空字典：`empty = dict()`。空字典常作为初始容器，在循环中逐步填入数据，类似外科手术开始前准备好的空器械盘，随着手术推进逐渐摆上各种工具。

## 2.7.3 可变、键值对集合与插入顺序

字典是**可变**类型，可以在创建之后增删改键值对。它本质上是键值对的集合，每个键唯一指向一个值。从 Python 3.7 开始（CPython 3.6 起作为实现细节），字典保证按**插入顺序**遍历元素，也就是说先写入的键值对在迭代时先出现。

```python
d = {}
d["A"] = 1
d["B"] = 2
d["C"] = 3
print(list(d.keys()))  # ['A', 'B', 'C']
```

这一点对打印输出和数据导出很重要。例如按时间顺序录入生命体征时，遍历字典能保持录入顺序，便于按时间轴回看。在 Python 3.6 之前字典顺序未定义，从旧代码迁移时要注意这一点。

## 2.7.4 键必须是不可变类型

字典的键必须可哈希，也就是不可变类型才能当键。常用的合法键类型有数字、字符串和元组；列表、字典、集合这些可变类型不能作为键，强行使用会抛出 TypeError。

```python
legal = {1: "int", "name": "str", (1, 2): "tuple"}
print(legal[(1, 2)])  # tuple
```

```python
bad = {[1, 2]: "list"}  # TypeError: unhashable type: 'list'
```

可以理解为字典内部用**哈希表**结构组织键，可哈希意味着对象的哈希值在其生命周期内不变。可变对象的哈希值会随内容改变而失效，所以被禁止。临床场景中常常用字符串（如病案号）或元组（如（科室，床号））作为复合键，这种组合既稳定又便于查询。

## 2.7.5 键的唯一性

字典中每个键只能出现一次。如果在字面量里对同一个键写了多次，后写的值会覆盖先写的值，最终字典只保留最后那个值。

```python
d = {"P001": "张三", "P001": "李四", "P002": "王五"}
print(d)  # {'P001': '李四', 'P002': '王五'}
```

这一特性在数据清洗时很有用。比如从多个数据源合并患者记录时，可以逐条写入字典，后到的覆盖先到的，最终得到唯一键的最新值。要注意这种"后者覆盖"是无声发生的，不会报错，所以为了避免误覆盖，写入前最好用 `in` 检查键是否存在。

## 2.7.6 通过键访问值

字典访问用方括号语法 `d[key]`，返回与键对应的值。如果键不存在会抛出 **KeyError**，这点与列表越界抛 IndexError 类似。

```python
vitals = {"heart_rate": 78, "spo2": 98, "temperature": 36.7}
print(vitals["heart_rate"])  # 78
print(vitals["blood_pressure"])  # KeyError: 'blood_pressure'
```

直接用方括号访问要求你对键的存在性有把握，否则就要用 try/except 处理异常。当数据来源不可控时，比如解析 JSON 接口返回的医学报告，这种写法很容易出问题，下一小节的 `get()` 方法是更安全的替代。

## 2.7.7 get 方法避免异常

`get(key)` 在键存在时返回对应值，键不存在时返回 None 而不报错。可以传入第二个参数作为默认值，键缺失时返回该默认值。

```python
vitals = {"heart_rate": 78, "spo2": 98}
print(vitals.get("heart_rate"))       # 78
print(vitals.get("blood_pressure"))   # None
print(vitals.get("blood_pressure", "未测量"))  # 未测量
```

处理体检数据时常有缺项，比如某项化验未做、某次生命体征未记录。用 `get()` 配合默认值，能让代码在缺数据时仍优雅运行，类似临床接诊时遇到病史不全的病人不能直接放弃，要给一个合理假设继续推理。

## 2.7.8 字典长度

`len()` 返回字典中键值对的数量：

```python
icd = {"J00": "急性鼻咽炎", "J01": "急性鼻窦炎", "J02": "急性咽炎"}
print(len(icd))  # 3
```

判断字典是否为空也可以用 `len(d) == 0`，更 Pythonic 的写法是直接 `if not d:`，因为空字典在布尔上下文中为 False。

## 2.7.9 成员检查

`in` 和 `not in` 用于检查某个键是否在字典中，注意它们检查的是键而不是值。

```python
lab = {"WBC": 6.5, "RBC": 4.8, "HGB": 138}
print("WBC" in lab)        # True
print("PLT" in lab)        # False
print("PLT" not in lab)    # True
print(6.5 in lab)          # False，6.5 是值不是键
```

成员检查在写入前判断、读取前防御等场景非常常用。处理患者主诉列表时，先用 `if symptom in symptom_dict` 判断是否是已知症状，再决定是查询还是新增条目，能避免大量异常处理代码。

## 2.7.10 字典迭代与视图对象

字典提供三个方法返回**视图对象**：`keys()` 返回所有键，`values()` 返回所有值，`items()` 返回所有键值对元组。视图对象是动态的，会反映字典的实时变化，且不占用额外内存。

```python
vitals = {"hr": 78, "spo2": 98, "temp": 36.7}

for key in vitals.keys():
    print(key)
# hr
# spo2
# temp

for value in vitals.values():
    print(value)
# 78
# 98
# 36.7

for key, value in vitals.items():
    print(f"{key}: {value}")
# hr: 78
# spo2: 98
# temp: 36.7
```

直接对字典迭代（`for k in d:`）等价于迭代 `d.keys()`。需要同时拿到键和值时用 `items()` 最方便。视图对象可以被转换为列表：`list(d.keys())`，但通常没必要，因为视图本身就支持迭代和成员检查。

## 2.7.11 常用字典方法

字典提供了丰富的方法，可以分为获取与设置、更新与合并、删除、复制几类。下面按用途分别介绍。

### 获取与设置

`get(key, default)` 已在 2.7.7 介绍过，用于安全取值。`setdefault(key, default)` 在键不存在时插入默认值并返回该值，键存在时直接返回原值不做修改。这一方法适合在分组统计时初始化缺失键。

```python
visits = {}
# 统计每位患者的就诊次数
for patient in ["P001", "P002", "P001", "P003", "P001"]:
    visits.setdefault(patient, 0)
    visits[patient] += 1
print(visits)  # {'P001': 3, 'P002': 1, 'P003': 1}
```

`fromkeys(iterable, value)` 是类方法，用可迭代对象中的每个元素作为键，统一填充同一个值，常用于初始化结构相同的字典。

```python
metrics = ["hr", "spo2", "temp"]
baseline = dict.fromkeys(metrics, 0)
print(baseline)  # {'hr': 0, 'spo2': 0, 'temp': 0}
```

### 更新与合并

`update(other)` 用另一个字典或键值对序列更新当前字典，已存在的键会被覆盖，新键会被添加。Python 3.9+ 还引入了 `|` 运算符合并字典，以及 `|=` 原地更新运算符。

```python
base = {"hr": 78, "spo2": 98}
extra = {"temp": 36.7, "hr": 80}  # hr 会被覆盖
base.update(extra)
print(base)  # {'hr': 80, 'spo2': 98, 'temp': 36.7}

# Python 3.9+ 的合并运算符
merged = {"a": 1} | {"b": 2, "a": 3}
print(merged)  # {'a': 3, 'b': 2}
```

合并运算符 `|` 创建新字典，不会修改原字典；`update()` 是原地修改。临床数据整合时，比如把基本信息表与化验结果表合并成一份完整病历，这类操作很常见。

### 删除

`pop(key)` 删除指定键并返回对应值，键不存在时可指定默认返回值，否则抛出 KeyError。`popitem()` 删除并返回最后插入的键值对（Python 3.7+ 是末尾，之前是任意位置），空字典调用会抛 KeyError。`clear()` 清空字典所有内容。

```python
queue = {"P001": "急诊", "P002": "门诊", "P003": "住院"}

dept = queue.pop("P001")
print(dept)   # 急诊
print(queue)  # {'P002': '门诊', 'P003': '住院'}

last = queue.popitem()
print(last)   # ('P003', '住院')
print(queue)  # {'P002': '门诊'}

queue.clear()
print(queue)  # {}
```

### 复制

`copy()` 返回字典的浅拷贝，新字典的键值对与原字典相同，但其中嵌套的可变对象仍是引用。如果需要深拷贝，要使用 `copy` 模块的 `deepcopy()` 函数。

```python
import copy
original = {"info": {"name": "张三", "age": 30}}
shallow = original.copy()
deep = copy.deepcopy(original)

shallow["info"]["age"] = 31
print(original["info"]["age"])  # 31，浅拷贝下原字典也被改了

deep["info"]["age"] = 50
print(original["info"]["age"])  # 仍是 31，深拷贝完全独立
```

处理嵌套的患者数据时，浅拷贝经常导致意外修改，需要在写代码前想清楚是要共享引用还是各自独立。

## 2.7.12 del 语句删除键值对

除了 `pop()`，还可以用 `del` 语句删除指定键值对。`del` 不返回值，键不存在时抛 KeyError。

```python
medication = {"aspirin": 100, "metformin": 500, "atorvastatin": 20}
del medication["aspirin"]
print(medication)  # {'metformin': 500, 'atorvastatin': 20}
```

`del` 适合明确知道键存在、且不需要返回值的删除场景。如果数据来源不可靠，用 `pop(key, default)` 更安全。`del` 还可以删除整个变量：`del medication`，之后 `medication` 名字不再存在，访问会抛 NameError。

## 2.7.13 字典推导式

字典推导式用 `{key_expr: value_expr for item in iterable if condition}` 的语法从可迭代对象构造字典，是处理数据的高效写法。下面例子把患者姓名列表转为"姓名: 长度"的字典：

```python
names = ["张三", "李四", "欧阳修"]
name_len = {name: len(name) for name in names}
print(name_len)  # {'张三': 2, '李四': 2, '欧阳修': 3}
```

更实用的场景是结合条件过滤和函数计算。下面的代码根据检验值是否落在正常范围内，给每项打上"正常"或"异常"标签：

```python
lab_results = {"WBC": 6.5, "RBC": 4.8, "PLT": 80, "HGB": 138}
normal_range = {"WBC": (4, 10), "RBC": (4, 5.5), "PLT": (100, 300), "HGB": (120, 160)}

status = {
    item: "正常" if normal_range[item][0] <= value <= normal_range[item][1] else "异常"
    for item, value in lab_results.items()
}
print(status)
# {'WBC': '正常', 'RBC': '正常', 'PLT': '异常', 'HGB': '正常'}
```

推导式可以加 `if` 条件做过滤，也可以嵌套，但为了可读性，过复杂的逻辑应改用普通 for 循环。

## 2.7.14 嵌套字典

字典的值可以是任意类型，包括另一个字典，这就形成了嵌套结构。处理临床数据时，嵌套字典几乎是标配，比如一位患者有基本信息、生命体征、化验结果三类信息，每类自身又是一个字典。

```python
patient = {
    "basic": {"name": "张三", "age": 45, "gender": "M"},
    "vitals": {"hr": 78, "spo2": 98, "temp": 36.7},
    "lab": {"WBC": 6.5, "HGB": 138}
}

# 多层访问用连续方括号
print(patient["basic"]["name"])      # 张三
print(patient["vitals"]["hr"])       # 78
print(patient["lab"]["WBC"])         # 6.5
```

嵌套越深，访问链越长，某一层缺失就会让整条访问链抛 KeyError。安全做法是逐层 `get()`，或者用 `try/except` 兜底。

```python
# 安全访问三层嵌套
bp = patient.get("vitals", {}).get("blood_pressure", "未测")
print(bp)  # 未测
```

这种链式 `get()` 配合空字典兜底，是处理结构不稳定的医学数据（如不同厂商的检验报告 JSON）的常用技巧。

## 2.7.15 字典排序

字典本身没有 `sort()` 方法，但可以借助内置 `sorted()` 函数按键或值排序。`sorted()` 返回的是列表，可以用 `dict()` 重新转成有序字典。

```python
lab_results = {"WBC": 6.5, "RBC": 4.8, "PLT": 220, "HGB": 138}

# 按键排序
by_key = dict(sorted(lab_results.items()))
print(by_key)
# {'HGB': 138, 'PLT': 220, 'RBC': 4.8, 'WBC': 6.5}

# 按值排序
by_value = dict(sorted(lab_results.items(), key=lambda kv: kv[1]))
print(by_value)
# {'RBC': 4.8, 'WBC': 6.5, 'HGB': 138, 'PLT': 220}
```

`sorted()` 的 `key` 参数接收一个函数，决定排序依据。`lambda kv: kv[1]` 表示用每个键值对的第二个元素（值）作为排序键。需要降序时加 `reverse=True`。

排序结果赋值回原变量后，由于 Python 3.7+ 字典保持插入顺序，新字典就会按排序后的顺序遍历。处理检验报告、ICD 编码列表时常需要按键字典序展示，这时 `sorted(d.items())` 就够了。
