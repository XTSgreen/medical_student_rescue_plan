---
title: 1.17 数据集
sidebar:
  order: 17
---
# 1.17 数据集

学习机器学习离不开数据。`sklearn.datasets` 提供三类数据来源：随包自带的**玩具数据集**、从网上下载的**真实世界数据集**、按参数**生成的数据集**。玩具数据集用于演示算法与快速测试，生成数据集用于构造受控的实验场景，真实世界数据集用于更接近实际的验证。本节依次介绍这三类数据，以及统一的数据容器 Bunch。

## 1.17.1 玩具数据集

玩具数据集随 scikit-learn 一起安装，无需联网即可加载，适合验证算法、跑通流程。它们都返回 Bunch 对象（见 1.17.6）。

### 分类数据集

```python
from sklearn.datasets import load_iris, load_digits, load_wine, load_breast_cancer

iris = load_iris()                 # 鸢尾花,150 个样本,4 个特征,3 类
print(iris.data.shape)             # (150, 4)
print(iris.target_names)           # ['setosa' 'versicolor' 'virginica']
print(iris.feature_names)          # 特征名列表

digits = load_digits()             # 手写数字,8x8 像素图像,10 类
print(digits.data.shape)           # (1797, 64)

wine = load_wine()                 # 葡萄酒,178 个样本,13 个特征,3 类
print(wine.data.shape)             # (178, 13)

cancer = load_breast_cancer()      # 乳腺癌,569 个样本,30 个特征,2 类
print(cancer.data.shape)           # (569, 30)
```

`load_digits` 的每个样本是 64 维向量（8×8 灰度像素展平），可以用 `digits.images` 取回二维图像。

### 回归数据集

```python
from sklearn.datasets import load_diabetes, load_linnerud

diabetes = load_diabetes()         # 糖尿病,442 个样本,10 个特征,回归
print(diabetes.data.shape)         # (442, 10)
print(diabetes.target[:5])         # 连续目标,疾病进展指标

linnerud = load_linnerud()         # 体能数据,20 个样本,3 特征,3 目标
print(linnerud.data.shape)         # (20, 3)
print(linnerud.target.shape)       # (20, 3),多输出回归
```

`load_linnerud` 有 3 个目标变量（引体向上、仰卧起坐、跳远），适合演示多输出回归。

### 已移除的 load_boston

波士顿房价数据集 `load_boston()` 因伦理问题（部分特征含种族信息）和许可问题，**已在 1.2 版本移除**，再调用会报错。替代方案是用 `fetch_california_housing()` 或自行下载波士顿数据。

## 1.17.2 真实世界数据集 fetch

真实世界数据集体积较大，首次调用时需要**联网下载**，scikit-learn 会把文件缓存到本地，之后离线可用。它们统一以 `fetch_` 开头。

```python
from sklearn.datasets import fetch_california_housing, fetch_20newsgroups

housing = fetch_california_housing()    # 加州房价,20640 个样本,8 特征,回归
print(housing.data.shape)                # (20640, 8)
print(housing.feature_names)

news = fetch_20newsgroups(subset='train')   # 20 个新闻组,文本分类
print(news.data[:1])                     # 文本内容列表
print(news.target_names)                 # 20 个类别名
```

其他常用 fetch 数据集：

| 加载函数 | 内容 | 任务类型 |
| --- | --- | --- |
| `fetch_olivetti_faces()` | 40 人的人脸照片,每类 10 张 | 图像分类/降维 |
| `fetch_lfw_people()` | LFW 名人脸部数据集 | 人脸识别 |
| `fetch_lfw_pairs()` | LFW 人脸配对数据集 | 人脸验证 |
| `fetch_20newsgroups()` | 20 个新闻组文本 | 文本分类 |
| `fetch_rcv1()` | 路透社新闻,多标签分类 | 多标签分类 |
| `fetch_covtype()` | 森林覆盖类型,581012 样本 | 大规模分类 |
| `fetch_kddcup99()` | KDD Cup 网络入侵检测 | 大规模分类 |
| `fetch_california_housing()` | 加州房价 | 回归 |

`fetch_lfw_people`、`fetch_rcv1`、`fetch_covtype`、`fetch_kddcup99` 数据量较大，下载时间较长。`fetch_20newsgroups` 的 `subset` 参数可选 `'train'`、`'test'`、`'all'` 三个子集。

### 已移除的 fetch_mldata

`fetch_mldata()` 用于从已关闭的 mldata.org 网站加载数据，该网站已停服，**函数已移除**。需要在线数据时改用 `fetch_openml()`（见 1.17.5）。

## 1.17.3 生成数据集 make

生成数据集按指定参数合成样本，用于构造受控实验：已知真实规律，便于检验算法效果。所有 `make_*` 函数默认返回元组 `(X, y)`，`X` 是特征矩阵，`y` 是标签数组。

### 分类生成器

```python
from sklearn.datasets import make_classification, make_blobs, make_gaussian_quantiles

# 三类别的可调分类数据
X, y = make_classification(n_samples=1000, n_features=20,
                           n_informative=5, n_redundant=5,
                           n_classes=3, random_state=0)
print(X.shape, y.shape)              # (1000, 20) (1000,)

# 聚类形状的斑点数据
X_b, y_b = make_blobs(n_samples=300, centers=3, cluster_std=1.0,
                      random_state=0)

# 高斯分位数数据,类别间有明确的非线性边界
X_q, y_q = make_gaussian_quantiles(n_samples=300, n_classes=3, random_state=0)
```

`make_classification` 的核心参数：`n_samples` 样本数、`n_features` 特征总数、`n_informative` 有效特征个数（携带类别信息）、`n_redundant` 冗余特征（是有效特征的线性组合）、`n_classes` 类别数。调整 `n_informative` 与 `n_redundant` 可以控制问题难度。`make_blobs` 生成各向同性高斯团，`centers` 指定聚类中心数；`make_gaussian_quantiles` 通过分位数切分产生非线性边界。

### 回归生成器

```python
from sklearn.datasets import make_regression, make_sparse_uncorrelated

# 多输出回归数据
X, y = make_regression(n_samples=200, n_features=10,
                       n_targets=3, noise=0.1, random_state=0)
print(y.shape)                        # (200, 3)

# 只有少数特征与目标相关的稀疏回归数据
X_s, y_s = make_sparse_uncorrelated(n_samples=200, n_features=20,
                                    random_state=0)
```

`make_regression` 的 `n_targets` 指定目标个数，大于 1 时生成多输出回归数据；`noise` 控制噪声强度。`make_sparse_uncorrelated` 只有少量特征与目标相关，特征之间互不相关，适合演示稀疏回归方法。

### 非线性可分数据

```python
from sklearn.datasets import make_circles, make_moons

X_c, y_c = make_circles(n_samples=300, factor=0.5, noise=0.05)   # 同心圆
X_m, y_m = make_moons(n_samples=300, noise=0.05)                 # 双月牙

# 特征完全重叠,线性分类器无法分开,用于演示核方法
```

`make_circles` 生成嵌套圆环，`make_moons` 生成交错月牙，两者都线性不可分，常用于演示核 SVM、决策树等非线性模型。

### 流形与多标签、回归函数数据

```python
from sklearn.datasets import make_s_curve, make_swiss_roll
from sklearn.datasets import make_multilabel_classification
from sklearn.datasets import make_friedman1, make_friedman2, make_friedman3

X_s, t_s = make_s_curve(n_samples=500)         # S 形流形
X_sw, t_sw = make_swiss_roll(n_samples=500)    # 瑞士卷流形

X_m, y_m = make_multilabel_classification(n_samples=200, n_classes=3)   # 多标签

X_f1, y_f1 = make_friedman1(n_samples=200)     # Friedman #1 回归函数
X_f2, y_f2 = make_friedman2(n_samples=200)     # Friedman #2
X_f3, y_f3 = make_friedman3(n_samples=200)     # Friedman #3
```

`make_s_curve` 与 `make_swiss_roll` 生成三维流形数据，返回 `(X, t)`，其中 `t` 是生成过程中的连续参数，可作为颜色编码用于可视化，常用于演示流形学习（如 Isomap、t-SNE）。`make_multilabel_classification` 返回的每个样本可能属于多个类别。`make_friedman1/2/3` 是经典的非线性回归测试函数，各有不同的交互项结构。

### 矩阵生成器

```python
from sklearn.datasets import make_spd_matrix, make_low_rank_matrix

# 对称正定矩阵,常用于测试协方差估计、多元正态采样
A = make_spd_matrix(n_dim=10)
print(A.shape)                      # (10, 10)

# 低秩矩阵,秩远小于维度
L = make_low_rank_matrix(n_samples=50, n_features=25, effective_rank=5)
```

`make_spd_matrix` 生成对称正定矩阵（所有特征值大于 0），`n_dim` 指定维度；`make_low_rank_matrix` 生成低秩矩阵，`effective_rank` 控制有效秩，常用于矩阵分解与降维演示。

## 1.17.4 数据加载工具

### load_files 从目录加载文本

把按类别分文件夹组织的文本目录加载为数据集。每个子文件夹名是类别，文件夹内的每个文件是一个样本：

```python
from sklearn.datasets import load_files

# 假设 data/ 下有 pos/ 与 neg/ 两个子文件夹
# texts = load_files('data', categories=['pos', 'neg'], encoding='utf-8')
```

`categories` 指定要加载的类别（子文件夹名），`encoding` 指定文本编码。返回 Bunch，`data` 是文本列表，`target` 是类别整数。

### load_sample_images 与 load_sample_image

加载随包自带的示例图像：

```python
from sklearn.datasets import load_sample_images, load_sample_image

images = load_sample_images()          # 加载全部示例图像
print(images.images[0].shape)          # (427, 640, 3),高、宽、RGB 通道

img = load_sample_image('china.jpg')   # 按文件名加载单张
print(img.shape)                       # (427, 640, 3)
```

返回的数组是 uint8 类型，喂给模型前通常要除以 255 归一化到 $[0,1]$。可用 `load_sample_image` 的 `images` 属性列出可用文件名。

## 1.17.5 外部数据集 fetch_openml

OpenML 是一个公开机器学习数据集平台。`fetch_openml` 通过数据集的 ID 从平台加载，覆盖数千个数据集：

```python
from sklearn.datasets import fetch_openml

# 通过 OpenML ID 加载数据集,例如 MNIST 的 ID 是 554
# mnist = fetch_openml(data_id=554, as_frame=True)
# print(mnist.data.shape)
```

常用参数：`data_id` 指定数据集 ID；`name` 也可按名称查找；`as_frame=True` 返回 Pandas DataFrame 形式。用 `data_id` 更精确，因为同名数据集可能对应多个版本。`fetch_openml` 需要联网，且某些数据集较大，首次加载耗时较长。

## 1.17.6 Bunch 对象

几乎所有 `load_*` 与 `fetch_*` 都返回 Bunch 对象。它像字典一样按属性访问数据，比普通字典更省事：

```python
from sklearn.datasets import load_iris

iris = load_iris()
print(iris.data)            # 特征矩阵,形状 (150, 4)
print(iris.target)          # 标签数组,形状 (150,)
print(iris.feature_names)   # 特征名列表
print(iris.target_names)    # 类别名列表
print(iris.DESCR)           # 数据集的完整描述文档
print(iris.filename)        # 数据源文件路径(部分数据集有)
```

常用属性：`data` 是特征矩阵，`target` 是标签，`feature_names` 是特征名，`target_names` 是类别名，`DESCR` 是数据集的描述文档（含背景、变量说明、引用）。Bunch 是 dict 的子类，也可以用 `iris['data']` 的方式访问。`load_digits` 还额外提供 `images` 属性（二维图像）与 `data`（展平向量）。

## 练习题

### 第1题 概念理解

说明玩具数据集、fetch 真实世界数据集、make 生成数据集的区别；说明 `n_informative` 与 `n_redundant` 的含义；说明 Bunch 对象的常见属性。

::: details 参考答案

玩具数据集随包安装无需联网，用于快速演示；fetch 数据集需联网下载真实数据；make 数据集按参数合成，已知真实规律便于受控实验。`n_informative` 是携带类别信息的有效特征数，`n_redundant` 是有效特征线性组合生成的冗余特征数。Bunch 常见属性有 `data`、`target`、`feature_names`、`target_names`、`DESCR`。
:::

### 第2题 代码编写

加载鸢尾花数据集，打印 `data`、`target`、`feature_names`、`target_names` 的形状与内容；用 `make_classification` 生成 500 个样本、3 个类别的数据并查看形状。

::: details 参考答案

```python
from sklearn.datasets import load_iris, make_classification

iris = load_iris()
print(iris.data.shape)
print(iris.target.shape)
print(iris.feature_names)
print(iris.target_names)
print(iris.DESCR[:200])

X, y = make_classification(n_samples=500, n_features=15,
                           n_informative=5, n_classes=3, random_state=0)
print(X.shape, y.shape)
```

:::

### 第3题 进阶练习

分别生成 `make_moons`、`make_circles`、`make_swiss_roll` 数据，用散点图（流形数据用 `t` 着色）观察结构；再用 `make_regression` 的 `n_targets=3` 生成多输出回归数据并打印 `y` 的形状。

::: details 参考答案

```python
import matplotlib.pyplot as plt
from sklearn.datasets import make_moons, make_circles, make_swiss_roll, make_regression

X_m, y_m = make_moons(n_samples=200, noise=0.05)
plt.scatter(X_m[:, 0], X_m[:, 1], c=y_m)
plt.title('moons')
plt.show()

X_c, y_c = make_circles(n_samples=200, factor=0.5, noise=0.05)
plt.scatter(X_c[:, 0], X_c[:, 1], c=y_c)
plt.title('circles')
plt.show()

X_s, t_s = make_swiss_roll(n_samples=300)
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')
ax.scatter(X_s[:, 0], X_s[:, 1], X_s[:, 2], c=t_s)
plt.title('swiss roll')
plt.show()

X_r, y_r = make_regression(n_samples=200, n_features=10, n_targets=3)
print(y_r.shape)   # (200, 3)
```

:::

## 常见错误

**错误 1 · 调用 `load_boston()` 报错**

原因:波士顿房价数据已在 scikit-learn 1.2 版本移除。

解决:改用 `fetch_california_housing()` 或自行加载数据。

**错误 2 · 调用 `fetch_*` 时联网失败或超时**

原因:真实世界数据集首次加载需要从网络下载。

解决:检查网络连接;或使用已下载缓存的数据,scikit-learn 会把文件缓存到本地,之后离线可用。

**错误 3 · `fetch_mldata()` 报错**

原因:mldata.org 网站已关闭,该函数已移除。

解决:改用 `fetch_openml()` 从 OpenML 平台加载。

**错误 4 · 把 `make_s_curve` 返回的 `t` 当标签用**

原因:`make_s_curve` 返回 `(X, t)`,其中 `t` 是流形上的连续参数,不是类别标签。

解决:理解返回语义,`t` 主要用于可视化着色。

**错误 5 · `make_classification` 设置了 `n_informative` 与 `n_classes` 但类别不平衡**

原因:默认各类别等概率生成,需要平衡时需额外处理。

解决:用 `weights` 参数指定各类别的样本比例。
