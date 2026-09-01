---
title: 1.20 管道与组合估计器
sidebar:
  order: 20
---
# 1.20 管道与组合估计器

真实流程通常是一串步骤：标准化、填补缺失、特征选择、最后训练模型。手工一步步写很容易出错，尤其容易在测试集上误用训练集学到的参数。`sklearn.pipeline` 的 Pipeline 把多个转换器和一个估计器串成一条流水线，一次 `fit`、一次 `predict`，且在交叉验证中自动保证每折只在训练部分 `fit`、在验证部分只 `transform`，从机制上杜绝数据泄漏。`sklearn.compose` 进一步提供对列做不同处理的 ColumnTransformer，以及转换目标变量的 TransformedTargetRegressor。

## 1.20.1 Pipeline 管道

Pipeline 接收 `steps` 列表，每项是 `(名称, 估计器)` 元组。除最后一项外都是转换器（有 `transform`），最后一项是估计器（有 `predict`）。调用 `pipe.fit(X, y)` 时，数据依次流过每个转换器，最后交给估计器训练；调用 `pipe.predict(X)` 时，同样的转换流程再走一遍再预测：

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.svm import SVC
from sklearn.datasets import load_digits

X, y = load_digits(return_X_y=True)

pipe = Pipeline([
    ('scaler', StandardScaler()),   # 第 1 步:标准化
    ('pca', PCA(n_components=20)),  # 第 2 步:降维
    ('svc', SVC()),                 # 第 3 步:分类器
])

pipe.fit(X, y)
print(pipe.score(X, y))
```

### named_steps 访问中间步骤

管道内部每一步的结果可以通过 `named_steps` 按名称访问，例如查看 PCA 解释的方差：

```python
print(pipe.named_steps['pca'].explained_variance_ratio_[:5])
```

`named_steps` 支持两种访问方式：`pipe.named_steps['pca']` 或 `pipe['pca']`。

### set_params 调参语法

管道里某一步的参数用双下划线语法 `步骤名__参数名` 设置，交叉验证网格搜索也用它：

```python
pipe.set_params(svc__C=10, pca__n_components=30)
print(pipe.named_steps['svc'].C)   # 10
```

### Pipeline 防止数据泄漏

管道在交叉验证中的关键价值：`GridSearchCV` 的每折内，转换器的 `fit` 只发生在该折的训练部分，验证部分只 `transform`。若把「标准化后再交叉验证」写成先整体 `fit` 再划分，测试集信息会进入转换器。用管道包装后，这个过程自动且安全：

```python
from sklearn.model_selection import GridSearchCV

param_grid = {'svc__C': [0.1, 1, 10], 'svc__kernel': ['linear', 'rbf']}
grid = GridSearchCV(pipe, param_grid, cv=5)
grid.fit(X, y)
print(grid.best_params_)
```

## 1.20.2 make_pipeline 简化构造

`make_pipeline` 省略步骤命名，自动按类名生成 `'standardscaler'`、`'pca'` 这种小写名称，代码更短：

```python
from sklearn.pipeline import make_pipeline

pipe2 = make_pipeline(StandardScaler(), PCA(n_components=20), SVC())
print(pipe2.steps)   # [('standardscaler', ...), ('pca', ...), ('svc', ...)]
print(pipe2.named_steps['standardscaler'])
```

调参语法不变，只是步骤名变为自动生成的类名小写形式，例如 `svc__C`。不传参数想用 `set_params` 时，也可通过 `pipe2['svc']` 直接拿到步骤。

## 1.20.3 FeatureUnion 并行合并

FeatureUnion 并行应用多个转换器，把它们的输出**按列拼接**成一个矩阵。适合同时提取不同类型的特征，例如既做文本词频又做文本长度：

```python
from sklearn.pipeline import FeatureUnion
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.datasets import load_digits

X, y = load_digits(return_X_y=True)

union = FeatureUnion([
    ('pca', PCA(n_components=10)),
    ('scaled', make_pipeline(StandardScaler(), PCA(n_components=5))),
])
X_u = union.fit_transform(X)
print(X_u.shape)   # (1797, 15),两个分支的输出按列合并
```

`FeatureUnion` 的每个分支必须是转换器，`n_jobs` 参数可并行运行各分支。注意它不是「分列处理不同列」，而是「同一数据并行提取多种表示」。

## 1.20.4 ColumnTransformer 分列转换

真实表格数据往往混合数值列与类别列，需要**对不同列做不同转换**：数值列标准化、类别列独热编码。ColumnTransformer 正是为此设计。`transformers` 列表每项是 `(名称, 转换器, 列)`：

```python
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

df = pd.DataFrame({
    '年龄': [25, 30, 35],
    '收入': [5000, 8000, 12000],
    '城市': ['北京', '上海', '北京'],
    '性别': ['男', '女', '男'],
})

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ['年龄', '收入']),   # 数值列标准化
        ('cat', OneHotEncoder(), ['城市', '性别']),    # 类别列独热
    ])
X_processed = preprocessor.fit_transform(df)
print(X_processed.shape)   # 数值 2 列 + 独热 4 列 = 6 列
print(preprocessor.named_transformers_['num'])   # 可访问各转换器
```

`transformers` 的参数：第一项是名称，第二项是转换器（`'passthrough'` 表示原样保留该列，`'drop'` 表示丢弃），第三项是列（列名列表或整数索引）。`ColumnTransformer` 在 `fit` 时对指定列训练对应转换器，`transform` 时各自应用并拼接输出，因此同样遵循「训练集 fit、测试集 transform」的防泄漏原则。

### make_column_transformer 简化构造

`make_column_transformer` 省略名称，按转换器类型自动命名：

```python
from sklearn.compose import make_column_transformer

preprocessor2 = make_column_transformer(
    (StandardScaler(), ['年龄', '收入']),
    (OneHotEncoder(), ['城市', '性别']),
    remainder='drop',   # 未指定列的处理方式,默认丢弃
)
```

`remainder` 控制未在 `transformers` 中指定的列：默认 `'drop'` 丢弃，设为 `'passthrough'` 则原样保留。

### make_column_selector 按类型选择列

列很多时手写列名麻烦，`make_column_selector` 按 dtype 或列名模式自动选列：

```python
from sklearn.compose import make_column_selector
from sklearn.preprocessing import StandardScaler, OneHotEncoder

selector = make_column_selector(dtype_include='number')   # 选数值列
print(selector(df))   # ['年龄', '收入']

preprocessor3 = make_column_transformer(
    (StandardScaler(), make_column_selector(dtype_include='number')),
    (OneHotEncoder(), make_column_selector(dtype_include='object')),
)
```

`make_column_selector(dtype_include='number')` 选出所有数值列，`dtype_include='object'` 选出所有类别列；也可用 `pattern='前缀'` 按列名模式选择。配合 DataFrame 输入非常省事。

## 1.20.5 TransformedTargetRegressor 目标变量变换

有时目标变量也需要变换，比如偏斜的房价做对数变换后再回归，预测时再还原。`TransformedTargetRegressor` 自动完成「变换目标、训练、预测时逆变换」的全过程：

```python
import numpy as np
from sklearn.compose import TransformedTargetRegressor
from sklearn.linear_model import LinearRegression
from sklearn.datasets import make_regression
from sklearn.model_selection import train_test_split

X, y = make_regression(n_samples=200, noise=0.1, random_state=0)
y = np.abs(y) + 1   # 构造正目标,适合对数变换

ttr = TransformedTargetRegressor(
    regressor=LinearRegression(),
    func=np.log,             # 训练时对目标取对数
    inverse_func=np.exp,     # 预测时用指数还原
)
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)
ttr.fit(X_train, y_train)
print(ttr.predict(X_test)[:5])
```

`func` 是训练时对 y 施加的变换，`inverse_func` 是预测时把预测值逆变换回原尺度。相比自己手动「先 log y 再训练、再 exp 还原」，`TransformedTargetRegressor` 把这个流程封装成普通估计器，可直接放进 Pipeline 或 GridSearchCV。

## 1.20.6 完整示例:ColumnTransformer + Pipeline + GridSearchCV

把上面各组件组合成一个完整流程：混合类型的房价数据，数值列标准化、类别列独热，再接一个回归模型，最后网格调参。关键点：所有预处理都放进管道，交叉验证时每折自动只在训练部分 fit：

```python
import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer, make_column_selector
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import Ridge
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.metrics import r2_score

# 构造混合类型数据:数值列 + 类别列 + 连续目标
rng = np.random.RandomState(0)
df = pd.DataFrame({
    '面积': rng.normal(100, 20, 300),
    '房龄': rng.randint(0, 40, 300),
    '城市': rng.choice(['北京', '上海', '广州'], 300),
    '朝向': rng.choice(['南', '北', '东西'], 300),
})
df['房价'] = 3 * df['面积'] - 2 * df['房龄'] + \
    df['城市'].map({'北京': 100, '上海': 80, '广州': 60}) + rng.normal(0, 10, 300)

X = df.drop(columns='房价')
y = df['房价']

# 第 1 步:定义预处理,数值列标准化,类别列独热,自动选择列
preprocessor = ColumnTransformer([
    ('num', StandardScaler(), make_column_selector(dtype_include='number')),
    ('cat', OneHotEncoder(), make_column_selector(dtype_include='object')),
])

# 第 2 步:预处理 + 回归模型组装成管道
pipe = Pipeline([
    ('prep', preprocessor),
    ('model', Ridge()),
])

# 第 3 步:网格调参,参数名用 步骤名__参数名
param_grid = {'model__alpha': [0.1, 1, 10, 100]}
grid = GridSearchCV(pipe, param_grid, cv=5, scoring='r2')
grid.fit(X, y)

print(grid.best_params_)
print(grid.best_score_)

# 第 4 步:在留出的测试集上验证
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)
grid.fit(X_train, y_train)
print(r2_score(y_test, grid.predict(X_test)))
```

整个流程中，预处理和建模绑定为一个估计器：`grid.predict(X_test)` 会自动先对测试集做同样的列变换，且变换参数全部来自训练部分，不会有数据泄漏。后续若增加特征选择、缺失值填补等步骤，只需往 `steps` 里继续追加即可。

## 练习题

### 第1题 概念理解

说明 Pipeline 中转换器与估计器的区别；说明 `named_steps` 与 `set_params('步骤__参数')` 的用途；说明把预处理放进管道为什么能防止交叉验证中的数据泄漏。

::: details 参考答案

管道中除最后一项外都是转换器（实现 `transform`），最后一项是估计器（实现 `predict`），`fit` 时数据依次流过转换器再到估计器。`named_steps` 按名称访问中间步骤，`set_params('步骤__参数')` 用双下划线语法设置某步参数。放进管道后，交叉验证每折只在训练部分 `fit` 转换器、验证部分只 `transform`，测试集信息不会进入训练过程。
:::

### 第2题 代码编写

用 `make_pipeline(StandardScaler(), SVC())` 训练并评估；再用 `Pipeline([...])` 构造「标准化 + 主成分 + 逻辑回归」管道并用 GridSearchCV 调参。

::: details 参考答案

```python
from sklearn.pipeline import make_pipeline, Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, cross_val_score
from sklearn.datasets import load_digits

X, y = load_digits(return_X_y=True)

pipe1 = make_pipeline(StandardScaler(), SVC())
print(cross_val_score(pipe1, X, y, cv=5).mean())

pipe2 = Pipeline([
    ('scaler', StandardScaler()),
    ('pca', PCA(n_components=20)),
    ('lr', LogisticRegression(max_iter=1000)),
])
grid = GridSearchCV(pipe2, {'lr__C': [0.1, 1, 10]}, cv=5)
grid.fit(X, y)
print(grid.best_params_, grid.best_score_)
```

:::

### 第3题 进阶练习

构造含数值列与类别列的 DataFrame，用 `ColumnTransformer` 分别标准化与独热编码；把 `TransformedTargetRegressor`（对数变换目标）装进管道；最后用 `make_column_selector` 自动选列并跑一遍 GridSearchCV。

::: details 参考答案

```python
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer, TransformedTargetRegressor, make_column_selector
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import Ridge
from sklearn.model_selection import GridSearchCV

rng = np.random.RandomState(0)
df = pd.DataFrame({
    '面积': rng.normal(100, 20, 200),
    '城市': rng.choice(['A', 'B'], 200),
})
df['价格'] = np.abs(df['面积'] + df['城市'].map({'A': 10, 'B': -10})) + 1

X = df.drop(columns='价格')
y = df['价格']

preprocessor = ColumnTransformer([
    ('num', StandardScaler(), make_column_selector(dtype_include='number')),
    ('cat', OneHotEncoder(), make_column_selector(dtype_include='object')),
])

ttr = TransformedTargetRegressor(regressor=Ridge(), func=np.log, inverse_func=np.exp)
pipe = Pipeline([('prep', preprocessor), ('model', ttr)])

grid = GridSearchCV(pipe, {'model__regressor__alpha': [0.1, 1, 10]}, cv=5)
grid.fit(X, y)
print(grid.best_params_)
print(grid.best_score_)
```

:::

## 常见错误

**错误 1 · Pipeline 的 `steps` 里所有项都写了估计器**

原因:管道要求除最后一项外都是转换器,估计器没有 `transform` 方法。

解决:把估计器只放在列表最后,前面的步骤都用转换器。

**错误 2 · `set_params` 参数名写错,如 `svc_C`**

原因:步骤参数用双下划线 `步骤名__参数名` 连接。

解决:写 `pipe.set_params(svc__C=10)`,并确保步骤名与 `steps` 里一致。

**错误 3 · ColumnTransformer 没处理完的列被静默丢弃**

原因:`remainder` 默认 `'drop'`,未指定的列直接丢掉。

解决:想保留所有列就设 `remainder='passthrough'`,或明确在 transformers 中列出。

**错误 4 · 对测试集手动重复做预处理时复用了测试集的统计量**

原因:手工流程容易把 `scaler.fit_transform(X_test)` 写成整段重新 fit。

解决:把预处理放进 Pipeline 或 ColumnTransformer,预测时统一 `pipe.predict(X_test)`。

**错误 5 · TransformedTargetRegressor 逆变换写错导致预测尺度不对**

原因:`func` 与 `inverse_func` 必须互逆,且 `inverse_func` 只作用于预测值。

解决:检查 `np.log` 对应 `np.exp`、`np.sqrt` 对应 `np.square`,确保互逆。

**错误 6 · make_column_selector 在普通 DataFrame 上直接调用报错**

原因:它是给 ColumnTransformer 用的选择器对象,单独使用时需要传入 DataFrame。

解决:在 `make_column_transformer` 或 `ColumnTransformer` 内部使用,或按 `selector(df)` 方式手动传数据。
