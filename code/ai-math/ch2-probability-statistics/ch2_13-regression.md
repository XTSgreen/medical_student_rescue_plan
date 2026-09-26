---
title: 2.13 回归分析与线性模型
sidebar:
  order: 13
---
# 2.13 回归分析与线性模型

前面几节把推断的对象限定为单个参数或单个分布。实际问题的形式通常是：某个人群的人均消费如何随收入变化，某商品的销量如何随价格与促销投入变化，某台设备的能耗如何随负载与温度变化。这类问题关心的是变量之间的函数关系，需要把响应变量表示为若干解释变量的函数，并同时给出系数估计、区间与检验。这一套方法统称为**回归分析**（regression analysis）。

线性回归是回归分析中结构最简单、理论最完整的一类。它的重要性来自三个方面：最小二乘估计有闭式解且几何意义清晰（投影到解释变量张成的子空间，与线性代数部分的结论直接衔接）；参数估计的分布可以精确写出，检验与区间都有闭式结果；许多非线性模型通过变换或推广可以纳入同一框架，广义线性模型、方差分析、混合效应模型都是它的推广形式。

本节从最小二乘与 Gauss-Markov 定理出发，依次讨论回归诊断、变量选择与正则化、稳健与分位数回归、广义线性模型、平滑模型与混合效应模型；最后说明回归工具在因果推断中的边界：相关关系的估计不等于因果效应的估计，工具变量、选择模型与生存模型分别处理三类特殊的结构。贝叶斯线性回归与高斯过程回归已在 2.6 节与 2.12 节提及，本节给出它们在回归框架中的位置。

## 2.13.1 线性回归与最小二乘

### 模型设定

**多元线性回归**（multiple linear regression）把响应变量 $y$ 表示为 $p$ 个解释变量的线性组合加上误差项：

$$
y_i = \beta_0 + \beta_1 x_{i1} + \cdots + \beta_p x_{ip} + \varepsilon_i, \qquad i = 1, \ldots, n
$$

写成矩阵形式为

$$
\mathbf{y} = \mathbf{X}\boldsymbol{\beta} + \boldsymbol{\varepsilon}
$$

其中 $\mathbf{X}$ 是 $n \times (p+1)$ 的**设计矩阵**（design matrix），第一列全为 $1$ 对应截距项。误差项的标准假设为：均值为零、方差相同、互不相关，即 $E[\boldsymbol{\varepsilon}] = \mathbf{0}$、$\mathrm{Cov}(\boldsymbol{\varepsilon}) = \sigma^2\mathbf{I}$。正态性假设只在小样本的精确推断中需要，大样本下系数估计的渐近分布由中心极限定理保证。

模型中的线性指对参数线性，解释变量本身可以是变换后的形式：$x^2$、$\log x$、交互项 $x_1 x_2$ 都可以作为新列加入设计矩阵，模型仍然属于线性回归。这一灵活性使线性模型的处理范围远大于字面含义。

### 最小二乘解

**最小二乘**（ordinary least squares，OLS）的准则是最小化残差平方和：

$$
\hat{\boldsymbol{\beta}} = \arg\min_{\boldsymbol{\beta}} \|\mathbf{y} - \mathbf{X}\boldsymbol{\beta}\|^2
$$

对目标函数求导并令其为零，得到**法方程**（normal equation）：

$$
\mathbf{X}^T\mathbf{X}\hat{\boldsymbol{\beta}} = \mathbf{X}^T\mathbf{y}
$$

设计矩阵列满秩时 $\mathbf{X}^T\mathbf{X}$ 可逆，解为

$$
\hat{\boldsymbol{\beta}} = \left(\mathbf{X}^T\mathbf{X}\right)^{-1}\mathbf{X}^T\mathbf{y}
$$

### 几何解释

法方程的形式在线性代数部分已经出现过：$\mathbf{X}^T(\mathbf{y} - \mathbf{X}\hat{\boldsymbol{\beta}}) = \mathbf{0}$ 说明残差向量与设计矩阵的每一列正交，即残差落在列空间的正交补中。最小二乘解是把 $\mathbf{y}$ 正交投影到 $\mathbf{X}$ 的列空间得到的系数，投影矩阵为

$$
\mathbf{H} = \mathbf{X}\left(\mathbf{X}^T\mathbf{X}\right)^{-1}\mathbf{X}^T
$$

$\mathbf{H}$ 是对称幂等矩阵，称为**帽子矩阵**（hat matrix），因为 $\hat{\mathbf{y}} = \mathbf{H}\mathbf{y}$。它的对角元 $h_{ii}$ 是第 $i$ 个观测的**杠杆值**（leverage），度量该观测在设计空间中距离其他观测的远近。

投影视角给出两条直接结论：残差与拟合值正交，因此 $\mathbf{y}$ 的平方和可以分解为

$$
\underbrace{\sum_{i=1}^{n}(y_i - \bar{y})^2}_{\text{总平方和 SST}} = \underbrace{\sum_{i=1}^{n}(\hat{y}_i - \bar{y})^2}_{\text{回归平方和 SSR}} + \underbrace{\sum_{i=1}^{n}(y_i - \hat{y}_i)^2}_{\text{残差平方和 SSE}}
$$

这就是勾股定理在数据空间中的形式。拟合优度指标 $R^2 = \text{SSR}/\text{SST} = 1 - \text{SSE}/\text{SST}$ 度量拟合值解释了多少变异。

### Gauss-Markov 定理

**Gauss-Markov 定理**（Gauss-Markov theorem）给出最小二乘解的最优性：在误差均值为零、同方差、互不相关（不必正态）的假设下，最小二乘估计是**最佳线性无偏估计**（best linear unbiased estimator，BLUE）。最佳的含义是在所有线性无偏估计中方差最小。

定理的边界需要明确：它只在线性无偏估计的范围内给出最优性，非线性估计或允许偏倚的估计（如岭估计）可能更好；它依赖于误差协方差为 $\sigma^2\mathbf{I}$，异方差或相关误差下最小二乘不再是 BLUE，此时用加权最小二乘或广义最小二乘恢复最优性。

### 系数估计的分布与检验

在误差为正态且同方差的假设下，系数估计服从多元正态：

$$
\hat{\boldsymbol{\beta}} \sim N\left(\boldsymbol{\beta}, \ \sigma^2\left(\mathbf{X}^T\mathbf{X}\right)^{-1}\right)
$$

$\sigma^2$ 未知时用无偏估计 $\hat{\sigma}^2 = \text{SSE} / (n - p - 1)$ 替代，单个系数的标准化形式服从 t 分布：

$$
\frac{\hat{\beta}_j - \beta_j}{\widehat{se}(\hat{\beta}_j)} \sim t(n - p - 1), \qquad \widehat{se}(\hat{\beta}_j) = \hat{\sigma}\sqrt{\left[\left(\mathbf{X}^T\mathbf{X}\right)^{-1}\right]_{jj}}
$$

由此可以直接构造系数的置信区间与显著性检验。整体检验（所有斜率同时为零）用 F 统计量：

$$
F = \frac{\text{SSR} / p}{\text{SSE} / (n - p - 1)} \sim F(p, \ n - p - 1)
$$

$R^2$ 随解释变量增加而单调上升，因此不能直接用于比较变量数不同的模型。**调整 $R^2$**（adjusted $R^2$）加入自由度的惩罚：

$$
R^2_{\text{adj}} = 1 - \frac{\text{SSE} / (n - p - 1)}{\text{SST} / (n - 1)}
$$

```python
import numpy as np

rng = np.random.default_rng(15)
n, p = 200, 3
X = rng.normal(size=(n, p))
beta_true = np.array([1.0, 2.0, -1.5, 0.5])
Xc = np.column_stack([np.ones(n), X])
y = Xc @ beta_true + rng.normal(scale=1.2, size=n)

# 最小二乘的手写实现
beta_hat = np.linalg.solve(Xc.T @ Xc, Xc.T @ y)
print(f"系数估计 = {np.round(beta_hat, 4)}")
print(f"真值     = {beta_true}")

# 标准误与 t 统计量
resid = y - Xc @ beta_hat
dof = n - p - 1
sigma2 = resid @ resid / dof
cov_beta = sigma2 * np.linalg.inv(Xc.T @ Xc)
se = np.sqrt(np.diag(cov_beta))
t_stat = beta_hat / se
print(f"标准误   = {np.round(se, 4)}")
print(f"t 统计量 = {np.round(t_stat, 3)}")

# 拟合优度
sst = ((y - y.mean()) ** 2).sum()
sse = (resid ** 2).sum()
r2 = 1 - sse / sst
r2_adj = 1 - (sse / dof) / (sst / (n - 1))
print(f"R² = {r2:.4f}，调整 R² = {r2_adj:.4f}")
```

## 2.13.2 回归诊断

### 残差的类型

模型拟合完成后需要检查假设是否成立，检查的对象是残差。**原始残差** $e_i = y_i - \hat{y}_i$ 的方差不相同（$h_{ii}$ 大的观测残差方差小），直接比较会误导。**标准化残差**把残差除以各自的标准差：

$$
r_i = \frac{e_i}{\hat{\sigma}\sqrt{1 - h_{ii}}}
$$

**学生化残差**（studentized residual）进一步在计算第 $i$ 个残差的标准差时剔除该观测，得到的残差在正态假设下服从 t 分布：

$$
t_i = \frac{e_i}{\hat{\sigma}_{(i)}\sqrt{1 - h_{ii}}}
$$

剔除的影响在样本量大时很小，小样本时差别明显。判断异常值的经验界限是 $|t_i| > 3$，超过说明该观测与模型不符，需要检查数据录入或考虑稳健方法。

### 杠杆值与影响点

**杠杆值** $h_{ii}$ 取值在 $[0, 1]$ 内，总和等于参数个数 $p + 1$，平均值为 $(p+1)/n$。经验规则是 $h_{ii} > 2(p+1)/n$ 视为高杠杆点。高杠杆说明该观测在设计空间中孤立，它的残差方差小（拟合被迫穿过它），对系数的影响大。

**影响点**（influential point）是删除后系数明显变化的观测。几个常用的度量：

| 度量      | 含义                               | 经验界限                          |
| --------- | ---------------------------------- | --------------------------------- |
| Cook 距离 | 删除该点后所有拟合值变化的总体度量 | $> 1$ 需检查                    |
| DFFITS    | 删除该点后该点拟合值变化的标准化量 | $\| \cdot \| > 2\sqrt{(p+1)/n}$ |
| DFBETAS   | 删除该点后单个系数变化的标准化量   | $\| \cdot \| > 2/\sqrt{n}$      |

Cook 距离同时包含残差与杠杆的信息：残差大但杠杆小的观测对系数影响有限，杠杆大但残差小的观测也不改变拟合，两者都大时才构成影响点。

### 异方差与自相关

**异方差**（heteroskedasticity）指误差方差不相等。后果是系数估计仍然无偏，但标准误的公式不再正确，t 检验与 F 检验失效。识别方法是画残差对拟合值（或对解释变量）的散点图，观察散布是否随横轴变化；**Breusch-Pagan 检验**与 **White 检验**给出正式的检验统计量。

处理方式有三种：对响应变量做变换（如对数变换常能稳定方差）、使用**加权最小二乘**（权重取方差的倒数）、使用**稳健标准误**（heteroskedasticity-consistent standard errors）。稳健标准误不改变系数估计，只修正标准误的计算，是最省事的做法：

$$
\widehat{\mathrm{Cov}}(\hat{\boldsymbol{\beta}}) = \left(\mathbf{X}^T\mathbf{X}\right)^{-1}\left(\sum_{i=1}^{n} e_i^2 \mathbf{x}_i \mathbf{x}_i^T\right)\left(\mathbf{X}^T\mathbf{X}\right)^{-1}
$$

**自相关**（autocorrelation）指误差项之间存在相关，常见于时间序列数据。后果与异方差类似，标准误错误且系数估计不再有效。识别方法是画残差对时间的图或计算残差的自相关函数，**Durbin-Watson 统计量**给出滞后一阶自相关的检验。处理方法包括加入滞后项、使用广义最小二乘或对标准误做**聚类稳健**修正。

### 多重共线性

**多重共线性**（multicollinearity）指解释变量之间存在强线性关系。后果是设计矩阵接近奇异，$( \mathbf{X}^T\mathbf{X})^{-1}$ 的对角元很大，系数标准误随之膨胀，系数估计对数据的微小变动敏感，符号甚至可能反转。注意共线性不影响预测的准确性，它影响的是单个系数的解释。

识别工具有两个。**方差膨胀因子**（variance inflation factor，VIF）把第 $j$ 个变量对其余变量做回归得到 $R_j^2$，

$$
\text{VIF}_j = \frac{1}{1 - R_j^2}
$$

经验规则是 VIF 超过 $10$（对应 $R_j^2 > 0.9$）说明共线性严重。**条件数**（condition number）是设计矩阵的最大奇异值与最小奇异值之比，超过 $30$ 提示问题，超过 $100$ 说明共线性严重。

处理方式包括删除相关变量、合并为一个综合指标、用主成分回归或偏最小二乘提取正交成分、使用岭回归（2.10 节）压缩系数。选择哪一种取决于分析目的：目的是系数解释时通常删除或合并，目的是预测时正则化更合适。

```python
import numpy as np

# 制造共线性：第三个变量近似等于前两个之和
rng = np.random.default_rng(20)
n = 120
x1 = rng.normal(size=n)
x2 = rng.normal(size=n)
x3 = x1 + x2 + rng.normal(scale=0.05, size=n)     # 高度相关
X = np.column_stack([x1, x2, x3])
y = 2 * x1 - 1 * x2 + 0.5 * x3 + rng.normal(scale=1.0, size=n)

Xc = np.column_stack([np.ones(n), X])
beta_hat = np.linalg.solve(Xc.T @ Xc, Xc.T @ y)
resid = y - Xc @ beta_hat
sigma2 = resid @ resid / (n - 4)
se = np.sqrt(np.diag(sigma2 * np.linalg.inv(Xc.T @ Xc)))

print("共线性严重时的系数估计：")
for j, name in enumerate(["截距", "x1", "x2", "x3"]):
    print(f"  {name:4s}：估计 {beta_hat[j]:+7.3f}，标准误 {se[j]:.3f}")

def vif(X):
    out = []
    for j in range(X.shape[1]):
        others = np.delete(X, j, axis=1)
        others = np.column_stack([np.ones(len(X)), others])
        coef = np.linalg.lstsq(others, X[:, j], rcond=None)[0]
        r2 = 1 - ((X[:, j] - others @ coef) ** 2).sum() / ((X[:, j] - X[:, j].mean()) ** 2).sum()
        out.append(1 / (1 - r2))
    return out

print(f"VIF：{np.round(vif(X), 2)}")
print(f"条件数 = {np.linalg.cond(Xc):.1f}")
# 系数标准误远大于无共线性时的水平，估计值偏离真值较多
```

## 2.13.3 变量选择与模型评价

### 子集选择

解释变量较多时需要一个选择过程。**最优子集选择**（best subset selection）枚举所有变量组合，用某个准则评价后选最优。变量数为 $p$ 时需要考虑 $2^p$ 个模型，$p = 20$ 时已超过一百万，$p$ 更大时不可行。

**逐步回归**（stepwise regression）用贪心策略降低搜索量。**前向选择**（forward selection）从空模型开始逐个加入对准则改善最大的变量；**后向消除**（backward elimination）从全模型开始逐个删除贡献最小的变量；双向逐步在两方向之间交替。三种方法都只探索了模型空间的一小部分，结果是局部最优，且序贯检验未做多重比较校正，p 值与 $R^2$ 会被高估。逐步回归适合作为探索工具，用交叉验证评估最终模型的表现更可靠。

### 信息准则

**AIC**（Akaike information criterion）与 **BIC**（Bayesian information criterion）在拟合优度上加入复杂度惩罚：

$$
\text{AIC} = -2\log L + 2k, \qquad \text{BIC} = -2\log L + k\log n
$$

其中 $k$ 是参数个数，$L$ 是最大似然值。正态误差的线性回归下 $\log L$ 与残差平方和直接相关，两个准则都等价于对 SSE 做惩罚。BIC 的惩罚项随 $\log n$ 增长，比 AIC 更重，倾向选择更简约的模型；AIC 的目标是预测最优，BIC 的目标是识别真实模型（在真实模型属于候选集合的假设下）。

BIC 可以从贝叶斯角度理解：对边缘似然做拉普拉斯近似，取对数后主要项正好是 $-2\log L + k \log n$（2.12 节的拉普拉斯近似给出推导起点）。这一联系说明 BIC 与贝叶斯因子在大样本下的关系。

### 交叉验证

**交叉验证**（cross-validation）直接估计模型的样本外预测误差，不依赖具体准则。$k$ 折交叉验证把数据分成 $k$ 份，轮流用其中一份做验证、其余做训练，取平均误差。

$$
\text{CV}_k = \frac{1}{k} \sum_{j=1}^{k} \frac{1}{n_j} \sum_{i \in \text{fold}_j} \left(y_i - \hat{y}_i^{(-j)}\right)^2
$$

$k = n$ 时退化为**留一法**（leave-one-out），它的计算可以利用线性模型的闭式结果（$y_i - \hat{y}_i^{(-j)} = e_i / (1 - h_{ii})$），不必真的拟合 $n$ 次。$k = 5$ 或 $10$ 是常用选择，兼顾偏差与方差：$k$ 小时训练集小、估计偏悲观，$k$ 大时方差大。

时间序列数据不能随机划分折，需要使用**时间序列交叉验证**：用前面的时间窗训练、用紧随其后的窗口验证，逐步向前滚动。分层数据需要**分层 $k$ 折**，保证每折的类别比例与总体一致。模型选择本身也要用交叉验证时，套一层**嵌套交叉验证**，避免用同一份数据既选模型又估误差。

## 2.13.4 正则化回归

### 岭回归与 Lasso

2.10 节已给出两种正则化估计的定义与贝叶斯解释，这里补充它们的回归中的表现差别。

**岭回归**（ridge regression）的系数平方惩罚使系数连续收缩但不为零。它的主要作用是对抗共线性：加上 $\lambda\mathbf{I}$ 后条件数改善，系数的方差显著下降，代价是引入偏差。$\lambda$ 通过交叉验证选择，**岭迹图**（ridge trace）画出各系数随 $\lambda$ 的变化路径，可以看出收缩的顺序。

**Lasso**（least absolute shrinkage and selection operator）的系数绝对值惩罚在原点处不可导，使部分系数精确为零，同时完成估计与选择。Lasso 的变量选择一致性有前提：设计矩阵满足一定条件（如不可表示条件）且真实系数足够大，否则可能选错变量。变量高度相关时 Lasso 倾向于随机保留其中一个，这一点与岭回归的均匀分配不同。

**弹性网**（elastic net）结合两种惩罚，$\lambda_1\|\boldsymbol{\beta}\|_1 + \lambda_2\|\boldsymbol{\beta}\|_2^2$，在相关变量组上倾向于同时保留或同时排除，适合变量成组相关的场景。

### 变体

按数据结构的不同，Lasso 有几个常用变体。**自适应 Lasso**（adaptive Lasso）对每个系数使用不同的权重（通常取初始估计绝对值倒数的幂），使大系数受惩罚更小、小系数受惩罚更大，从而改善变量选择的一致性。**组 Lasso**（group Lasso）对预先分组的系数整体惩罚，使整组同时为零或同时保留，适合分类变量产生的哑变量组或多模态特征的组结构。**稀疏组 Lasso**在组内与组间同时施加惩罚，允许某些组整体保留但组内仍有个别系数为零。**融合 Lasso**（fused Lasso）对相邻系数的差施加惩罚，使相邻系数接近，适合有序的变量（如相邻时间点、相邻的空间位置）。

### 求解算法

Lasso 的求解不能用梯度下降（目标函数在原点不可导），常用三种算法。**坐标下降**（coordinate descent）逐分量优化，每次只更新一个系数并保持其他不变，此时目标函数变成一元凸问题，有闭式解（软阈值算子）。坐标下降简单、稳定、易并行，是 `glmnet` 等工具的默认算法。**最小角回归**（least angle regression，LARS）沿着与当前残差相关度相同的方向前进，每次遇到新的变量进入活跃集时改变方向，可以给出完整的正则化路径，计算量与最小二乘相当。**近端梯度法**（proximal gradient）在梯度步之后施加软阈值操作，适合大规模问题与可以与随机梯度结合的场景。

```python
import numpy as np

def soft_threshold(z, gamma):
    """软阈值算子：Lasso 坐标下降的单步解"""
    return np.sign(z) * max(abs(z) - gamma, 0.0)

def lasso_coordinate_descent(X, y, lam, max_iter=500, tol=1e-6):
    """Lasso 的坐标下降实现（不含截距项，数据应已中心化）"""
    n, p = X.shape
    beta = np.zeros(p)
    for _ in range(max_iter):
        beta_old = beta.copy()
        for j in range(p):
            r = y - X @ beta + X[:, j] * beta[j]              # 剔除第 j 个变量的部分残差
            rho = X[:, j] @ r
            z = X[:, j] @ X[:, j]
            beta[j] = soft_threshold(rho, lam * n / 2) / (z + 1e-12)
        if np.max(np.abs(beta - beta_old)) < tol:
            break
    return beta

rng = np.random.default_rng(22)
n, p = 150, 8
X = rng.normal(size=(n, p))
X = X - X.mean(axis=0)
y_true = np.array([3.0, 0.0, 0.0, -2.0, 0.0, 1.0, 0.0, 0.0])
y = X @ y_true + rng.normal(scale=1.0, size=n)
y = y - y.mean()

for lam in [0.02, 0.1, 0.3]:
    b = lasso_coordinate_descent(X, y, lam)
    print(f"lambda = {lam:.2f}：非零系数 {np.sum(np.abs(b) > 1e-8)} 个，估计 = {np.round(b, 3)}")
# lambda 增大时非零系数个数减少，稀疏结构逐步显现
```

## 2.13.5 稳健回归与分位数回归

### 稳健回归

最小二乘的目标函数是残差平方和，平方放大了大残差的影响，一个极端观测可以显著拉动回归面。**稳健回归**（robust regression）改用增长较慢的损失函数。**Huber 损失**在残差小于阈值 $\delta$ 时用平方、大于时用线性：

$$
\rho_\delta(e) = \begin{cases} \frac{1}{2}e^2, & |e| \leq \delta \\ \delta|e| - \frac{1}{2}\delta^2, & |e| > \delta \end{cases}
$$

它在中心区域保持二次收敛的效率，在尾部限制极端值的影响。损失对残差求导得到影响函数，Huber 损失的影响函数有界（线性增长被截断），而平方损失的影响函数随残差线性增长无界。求解用**迭代重加权最小二乘**（iteratively reweighted least squares，IRLS）：每次用当前残差计算权重，再做一次加权最小二乘，迭代至收敛。

其他稳健方法包括最小绝对偏差回归（$L_1$ 回归，对应中位数回归）、最小中位数平方（崩溃点高但计算量大）、M 估计与 MM 估计（在稳健性与效率之间折中）。

### 分位数回归

**分位数回归**（quantile regression）估计响应变量条件分布的分位数而非条件均值。给定分位数 $\tau \in (0, 1)$，系数通过最小化非对称绝对损失得到：

$$
\hat{\boldsymbol{\beta}}(\tau) = \arg\min_{\boldsymbol{\beta}} \sum_{i=1}^{n} \rho_\tau\left(y_i - \mathbf{x}_i^T\boldsymbol{\beta}\right), \qquad
\rho_\tau(e) = \begin{cases} \tau e, & e \geq 0 \\ (\tau - 1)e, & e < 0 \end{cases}
$$

$\tau = 0.5$ 时退化为最小绝对偏差回归，给出条件中位数。分位数回归的价值在于描述分布的不同部分：收入对不同因素的敏感程度在低收入组与高收入组可能完全不同，均值回归只能给出一个折中的斜率。求解可以化为线性规划问题，标准工具（`statsmodels`、`quantreg`）都有实现。

## 2.13.6 广义线性模型

### 三个组成部分

线性回归要求响应变量连续且方差恒定。计数数据、二值数据、比例数据的均值与方差都不满足这一条件，需要一个更宽的框架。**广义线性模型**（generalized linear model，GLM）由三部分组成：

| 组成部分 | 内容                                                    |
| -------- | ------------------------------------------------------- |
| 随机部分 | 响应变量服从指数族分布（2.5 节）                        |
| 系统部分 | 线性预测子$\eta_i = \mathbf{x}_i^T\boldsymbol{\beta}$ |
| 链接函数 | 单调可微函数$g$，满足 $g(E[y_i]) = \eta_i$          |

链接函数把响应变量的期望与线性预测子连接起来。$\eta$ 的取值不受限制，而均值有限制（二值数据的均值在 $(0, 1)$、计数数据的均值大于零），链接函数负责把限制解除。

### 常见 GLM

**逻辑回归**（logistic regression）处理二值响应，链接函数为 logit：

$$
\log \frac{\mu_i}{1 - \mu_i} = \mathbf{x}_i^T\boldsymbol{\beta}, \qquad \mu_i = \frac{1}{1 + e^{-\mathbf{x}_i^T\boldsymbol{\beta}}}
$$

系数解释为对数几率的变化：$\beta_j$ 表示 $x_j$ 增加一个单位时对数优势的变化量，$e^{\beta_j}$ 是**优势比**（odds ratio），表示优势的倍数变化。这一点在报告结果时很重要，因为逻辑回归的系数不是概率的变化率。

**泊松回归**（Poisson regression）处理计数响应，链接函数为对数：$\log \mu_i = \mathbf{x}_i^T\boldsymbol{\beta}$。$e^{\beta_j}$ 解释为计数均值的变化倍数。计数数据的方差大于均值时（**过散布**，2.4 节），泊松假设不成立，改用**负二项回归**（negative binomial regression），它在均值之外多一个离散参数。

其他常见形式包括：**多项逻辑回归**处理多类别响应，**有序逻辑回归**处理有序类别，**伽马回归**与**逆高斯回归**处理正的连续响应，**Tweedie 回归**用一个参数统一处理含大量零值的正值响应（如保险理赔金额，零与正值混合）。

### 估计与推断

GLM 的参数估计同样用极大似然，但似然方程一般没有闭式解，用**迭代重加权最小二乘**（IRLS）求解：每次迭代构造一个工作响应变量与权重，做一次加权最小二乘，迭代至收敛。这一算法可以理解为对似然面的牛顿法，收敛速度通常是二次的。

推断可以用 2.11 节的三大检验。**偏差**（deviance）是 GLM 的拟合优度度量，定义为

$$
D = 2\left[\log L(\text{饱和模型}) - \log L(\text{拟合模型})\right]
$$

饱和模型是每个观测有独立参数的模型，偏差度量拟合模型与饱和模型的差距。偏差在大样本下近似服从卡方分布，可以用于嵌套模型的比较（类似线性回归的 F 检验）。**皮尔逊残差**与**偏差残差**是 GLM 的常规残差，诊断方式与线性回归类似。

```python
import numpy as np
from scipy import optimize

# 逻辑回归的牛顿法实现（含截距）
rng = np.random.default_rng(25)
n = 400
X = rng.normal(size=(n, 2))
Xc = np.column_stack([np.ones(n), X])
beta_true = np.array([-0.5, 1.5, -1.0])
p_true = 1 / (1 + np.exp(-Xc @ beta_true))
y = rng.binomial(1, p_true).astype(float)

def neg_loglik(beta):
    eta = Xc @ beta
    # 数值稳定的对数似然
    return -np.sum(y * eta - np.logaddexp(0, eta))

res = optimize.minimize(neg_loglik, np.zeros(3), method="BFGS")
print(f"逻辑回归系数（数值优化）= {np.round(res.x, 4)}")
print(f"真值                    = {beta_true}")
print(f"优势比                  = {np.round(np.exp(res.x), 4)}")

# 迭代重加权最小二乘（一次迭代的形式展示）
beta = res.x
mu = 1 / (1 + np.exp(-Xc @ beta))
W = np.diag(mu * (1 - mu))
z = Xc @ beta + np.linalg.solve(W, y - mu)
beta_irls = np.linalg.solve(Xc.T @ W @ Xc, Xc.T @ W @ z)
print(f"IRLS 一步更新            = {np.round(beta_irls, 4)}")
```

## 2.13.7 非线性与平滑模型

### 广义加法模型

线性模型假定每个解释变量的效应是线性的。**广义加法模型**（generalized additive model，GAM）把线性预测子中的每一项替换为平滑函数：

$$
g(E[y]) = \beta_0 + f_1(x_1) + f_2(x_2) + \cdots + f_p(x_p)
$$

每个 $f_j$ 用样条基或局部回归表示，并用粗糙度惩罚控制平滑程度（2.10 节）。模型的加法结构使每个变量的效应可以单独画图解释，这是 GAM 相对黑箱模型的主要优势。拟合用**惩罚似然**加平滑参数的交叉验证选择，或把惩罚解释为随机效应后用混合模型拟合（下面第 2.13.8 节）。

### 高斯过程回归与贝叶斯线性回归

**高斯过程回归**（Gaussian process regression）把函数本身视为随机对象，用 2.8 节的核函数给出函数值的联合分布，用条件公式给出预测分布（2.6 节）。它给出的是完整的预测分布而非点预测，且预测的不确定性随远离训练数据而增大，这一性质在许多场景中比区间估计更有用。

**贝叶斯线性回归**（Bayesian linear regression）在系数上放先验，后验均值与岭回归的估计形式一致（高斯先验对应 $L_2$ 惩罚），额外给出系数的完整后验分布。层次贝叶斯扩展把先验的参数也作为待估对象，可以实现自适应的收缩强度。

## 2.13.8 混合效应模型与层次数据

### 固定效应与随机效应

数据具有分组结构时（同一班级的学生、同一门店的多天销量、同一用户的多条记录），组内观测比组间观测更相似，误差不再独立。**混合效应模型**（mixed effects model）通过在模型中加入随机效应来处理这一结构：

$$
y_{ij} = \underbrace{\mathbf{x}_{ij}^T\boldsymbol{\beta}}_{\text{固定效应}} + \underbrace{u_j}_{\text{随机效应}} + \varepsilon_{ij}, \qquad u_j \sim N(0, \sigma_u^2), \quad \varepsilon_{ij} \sim N(0, \sigma^2)
$$

**固定效应**（fixed effect）描述对所有组都相同的系数，**随机效应**（random effect）描述各组相对总体的偏移。$u_j$ 被建模为随机变量，这使模型可以在组间借力：样本量小的组，其偏移估计被拉向零，形成类似层次贝叶斯的部分汇聚（2.12 节）。

**方差分量**（variance components）$\sigma_u^2$ 与 $\sigma^2$ 分别是组间与组内方差。**组内相关**（intraclass correlation，ICC）定义为

$$
\text{ICC} = \frac{\sigma_u^2}{\sigma_u^2 + \sigma^2}
$$

它度量同一组内两个观测的相关程度，也决定了忽略分组结构对标准误的扭曲程度。ICC 较大时忽略分组会导致标准误严重低估、显著性被高估。

参数估计用**限制最大似然**（restricted maximum likelihood，REML）或最大似然。REML 在估计方差分量时剔除固定效应的影响，得到的方差估计偏差更小，是多数软件的默认设置。模型比较时注意：用 REML 拟合的模型只能在固定效应相同的条件下比较，固定效应不同的模型需要改用最大似然。

其他结构包括随机斜率（各组对某个变量的敏感度不同）、交叉随机效应（同一观测同时属于两种分组）、嵌套随机效应（组内有子组）。**纵向数据**（longitudinal data，同一对象多次测量）与**面板数据**（panel data，同一对象多个时期的多个变量）是这类模型的主要应用场景。

## 2.13.9 回归工具与因果问题

### 工具变量与两阶段最小二乘

解释变量与误差相关时（**内生性**），最小二乘估计有偏且不一致，偏差不会随样本量增大而消失。来源包括遗漏变量、测量误差、双向因果。**工具变量**（instrumental variable，IV）是满足两个条件的变量：与内生解释变量相关（相关性），且只通过该变量影响响应（外生性）。**两阶段最小二乘**（two-stage least squares，2SLS）先回归内生变量得到拟合值，再用拟合值做回归：

$$
\text{第一阶段：} \ \mathbf{x} = \mathbf{Z}\boldsymbol{\pi} + \mathbf{v}, \qquad \text{第二阶段：} \ \mathbf{y} = \hat{\mathbf{X}}\boldsymbol{\beta} + \boldsymbol{\varepsilon}
$$

工具变量与内生变量相关性弱时（**弱工具**），2SLS 估计的偏差与方差都会显著恶化，需要用第一阶段 F 统计量诊断（经验规则是大于 $10$）。IV 的完整讨论与 Do 算子、倾向得分等方法一起构成因果推断的内容，见 2.14 节。

### 受限因变量与选择模型

响应变量的取值受限制时，普通回归会产生偏误。**Tobit 模型**处理删失响应：观测到的值在某个界限处被截断（例如用户消费金额在 $0$ 处集中），模型把截断机制写入似然。**Heckman 选择模型**处理样本选择：数据只包含被选中的个体（例如只观测到了解雇风险者的工资），模型用一个选择方程刻画入选概率，再在回归中修正选择带来的偏差。

### 生存回归

响应变量是事件发生时间且存在删失时（2.2 节），用**生存回归**。**Cox 比例风险模型**（Cox proportional hazards model）是半参数方法：只对风险比的函数形式作假设，不指定基线风险的形式：

$$
h(t \mid \mathbf{x}) = h_0(t) \exp\left(\mathbf{x}^T\boldsymbol{\beta}\right)
$$

系数通过**部分似然**（partial likelihood）估计，基线风险 $h_0(t)$ 不参与估计，这是它受欢迎的原因。**比例风险假设**（风险之比不随时间变化）需要检验，违背时改用分层 Cox 模型或时变系数。**加速失效时间模型**（accelerated failure time model，AFT）是参数方法，直接对生存时间的对数建模，假设更具体但解释更直观。

## 2.13.10 本节小结

::: success 从最小二乘到广义回归框架
本节把回归分析组织成一条逐步放宽假设的链条。最小二乘在误差同方差且互不相关的假设下给出最佳线性无偏估计，几何上等于把响应投影到解释变量张成的子空间，法方程与投影矩阵把估计、拟合值与残差联系起来。回归诊断检查假设是否成立，杠杆值与 Cook 距离识别影响点，异方差与自相关破坏标准误的正确性并可分别用稳健标准误与广义最小二乘处理，多重共线性放大系数方差并影响解释而非预测。变量选择在子集搜索、信息准则与交叉验证之间取舍，正则化回归用偏差换方差并在高维情形下完成变量选择。广义线性模型通过链接函数把指数族响应与线性预测子连接，逻辑回归与泊松回归扩展到二值与计数数据。平滑模型、混合效应模型与生存模型分别处理非线性关系、分组结构与删失响应。工具变量、Tobit 与 Heckman 模型揭示了回归在因果问题上的局限：当解释变量与误差相关或样本经过选择时，系数不再具有因果解释，需要用 2.14 节的识别策略。
:::

变量数接近或超过样本数时，前面的方法会整体失效：最小二乘无解、交叉验证不稳定、信息准则的自由度项失去意义。同时，实际数据中的变量往往来自非随机化的观测，回归系数与因果效应之间存在系统性差距。下一节讨论这两类问题：高维统计给出稀疏假设下的估计与推断方法，因果推断给出从观测数据识别因果效应的条件与策略。

## 练习题

### 第 1 题 概念推导

设简单线性回归模型 $y_i = \beta_0 + \beta_1 x_i + \varepsilon_i$，误差满足 Gauss-Markov 假设。推导最小二乘估计 $\hat{\beta}_1$ 的表达式，写出 $\mathrm{Var}(\hat{\beta}_1)$ 的公式，并说明为什么 $x$ 的离散程度越大估计越精确。

::: details 参考答案
**估计表达式**：把 $\mathbf{X} = [\mathbf{1}, \mathbf{x}]$ 代入 $\hat{\boldsymbol{\beta}} = (\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\mathbf{y}$，整理后得到

$$
\hat{\beta}_1 = \frac{\sum_{i=1}^{n}(x_i - \bar{x})(y_i - \bar{y})}{\sum_{i=1}^{n}(x_i - \bar{x})^2}, \qquad \hat{\beta}_0 = \bar{y} - \hat{\beta}_1\bar{x}
$$

$\hat{\beta}_1$ 是 $y$ 的线性组合，系数为 $(x_i - \bar{x}) / \sum_j (x_j - \bar{x})^2$，这解释了对 $y$ 的偏离以 $x$ 的偏离为权重。

**方差公式**：由 $\mathrm{Var}(\hat{\boldsymbol{\beta}}) = \sigma^2(\mathbf{X}^T\mathbf{X})^{-1}$，取 $(1,1)$ 元素的分块结果，

$$
\mathrm{Var}(\hat{\beta}_1) = \frac{\sigma^2}{\sum_{i=1}^{n}(x_i - \bar{x})^2}
$$

**离散程度的作用**：分母是 $x$ 的总变异，$x$ 的取值越分散，分母越大，估计的方差越小。直观解释是斜率由 $x$ 的变化范围内的信息决定，$x$ 只在一个很窄的区间上变化时，直线的倾斜程度难以确定。实验设计中有意把处理水平拉开（例如药物剂量的高低组），正是为了增大分母、提高斜率估计的精度。同样的道理说明对超出数据范围的 $x$ 做预测风险很大：斜率的不确定性在远端被放大，外推的预测方差随距离平方增长。
:::

### 第 2 题 计算推理

某电商平台用线性回归分析日销售额，解释变量为广告投入（万元）与是否周末（哑变量）。拟合结果为 $\hat{\beta}_0 = 20$，$\hat{\beta}_{\text{广告}} = 4.5$，$\hat{\beta}_{\text{周末}} = 6$，广告投入的标准误为 $1.5$，样本量 $n = 60$，参数个数为 $3$。请给出广告投入系数的 $95\%$ 置信区间，说明它的解释含义；再判断周末效应是否显著。

::: details 参考答案
**置信区间**：自由度为 $n - k - 1 = 60 - 3 = 57$，$t_{0.975}(57) \approx 2.002$，区间为

$$
4.5 \pm 2.002 \times 1.5 = [1.497, \ 7.503]
$$

**解释含义**：广告投入每增加 $1$ 万元，日销售额平均增加 $4.5$ 万元，$95\%$ 置信区间为 $[1.50, 7.50]$ 万元。需要注意三点：区间较宽，说明估计精度有限，实际效应可能小到 $1.5$ 万元；这一系数是控制周末效应后的偏效应，含义是同一工作日类型下广告与销售额的关系；系数反映的是观测数据中的关联，若广告投入本身与季节性需求相关，系数不能解释为广告的因果效应。

**周末效应的显著性**：题目未给出周末系数的标准误，无法直接判断。合理的做法是补充报告标准误与 t 统计量，或用整体 F 检验判断模型整体是否有效。如果周末系数的标准误为 $2.5$，则 $t = 6 / 2.5 = 2.4$，对应双侧 p 值约为 $0.02$，在 $0.05$ 水平下显著。报告时应当同时给出两项系数的标准误与区间，只给点估计无法判断精度。
:::

### 第 3 题 代码验证

用坐标下降求解 Lasso，在一组含无关变量的数据上观察正则化强度对稀疏性的影响；再用交叉验证选择 $\lambda$，与真实系数结构对照。最后比较岭回归与 Lasso 在变量高度相关时的表现差异。

::: details 参考答案

```python
import numpy as np

def soft_threshold(z, gamma):
    return np.sign(z) * max(abs(z) - gamma, 0.0)

def lasso_cd(X, y, lam, max_iter=300, tol=1e-7):
    n, p = X.shape
    beta = np.zeros(p)
    for _ in range(max_iter):
        old = beta.copy()
        for j in range(p):
            r = y - X @ beta + X[:, j] * beta[j]
            beta[j] = soft_threshold(X[:, j] @ r, lam * n / 2) / (X[:, j] @ X[:, j])
        if np.max(np.abs(beta - old)) < tol:
            break
    return beta

def ridge(X, y, lam):
    p = X.shape[1]
    return np.linalg.solve(X.T @ X + lam * np.eye(p), X.T @ y)

rng = np.random.default_rng(44)
n, p = 120, 10
X = rng.normal(size=(n, p))
X = X - X.mean(axis=0)
beta_true = np.array([3.0, 0, 0, -2.0, 0, 0, 0, 1.5, 0, 0])
y = X @ beta_true + rng.normal(scale=1.0, size=n)
y = y - y.mean()

print("正则化强度对稀疏性的影响（Lasso）")
for lam in [0.01, 0.05, 0.15, 0.4]:
    b = lasso_cd(X, y, lam)
    print(f"  lambda = {lam:.2f}：非零系数 {int(np.sum(np.abs(b) > 1e-6)):2d} 个")

# 用简单网格与验证集选择 lambda
idx = rng.permutation(n)
train, valid = idx[:90], idx[90:]
best = min(
    [0.01, 0.03, 0.06, 0.1, 0.2, 0.4],
    key=lambda lam: ((y[valid] - X[valid] @ lasso_cd(X[train], y[train], lam)) ** 2).mean(),
)
b_final = lasso_cd(X[train], y[train], best)
print(f"验证集选出的 lambda = {best}")
print(f"选出模型的系数 = {np.round(b_final, 3)}")
print(f"真值           = {beta_true}")

# 相关变量下 Lasso 与岭的差别
Xc = X.copy()
Xc[:, 1] = Xc[:, 0] + rng.normal(scale=0.05, size=n)     # 制造一对高度相关的变量
yc = Xc @ beta_true + rng.normal(scale=1.0, size=n)
yc = yc - yc.mean()
b_lasso = lasso_cd(Xc, yc, 0.1)
b_ridge = ridge(Xc, yc, 5.0)
print(f"\nLasso 对相关变量的处理：{np.round(b_lasso[:3], 3)}")
print(f"岭回归对相关变量的处理：{np.round(b_ridge[:3], 3)}")
```

典型输出显示 Lasso 在 $\lambda$ 较小时保留较多变量，随 $\lambda$ 增大非零系数个数下降，最终保留的变量与真实非零位置大致一致。相关变量部分，Lasso 倾向于把系数集中到其中一个变量、把另一个压为零，岭回归则把系数近似平均分配。两种处理各自的适用场景取决于分析目的：需要稀疏解释时用 Lasso，需要稳定预测时岭回归更可靠。
:::

### 第 4 题 综合应用

某内容平台想估计文章长度对阅读完成率的影响。数据的响应变量是完成率（$0$ 到 $1$ 之间的比例），另有两个解释变量：文章长度与是否含图片。请说明为什么线性回归不适合这一数据，给出适合的模型形式，说明系数的解释方式与诊断方法。

::: details 参考答案
**线性回归的问题**：响应变量是比例，取值被限制在 $[0, 1]$。线性模型预测的均值可以超出这一范围，误差方差随均值变化（接近 $0$ 或 $1$ 时方差小、接近 $0.5$ 时方差大），违背同方差假设。残差也不服从正态分布，系数的检验与区间失效。

**合适的模型**：比例型响应常用的做法有两种。第一种是把比例视为二值结果的聚合，用**分数逻辑回归**（fractional logit），模型形式与逻辑回归相同但允许响应取 $[0, 1]$ 内的任意值，准似然按二项分布的形式构造。第二种是**贝塔回归**，直接对比例建模（2.5 节的贝塔分布），可以容纳比例的过散布。若数据包含大量 $0$ 与 $1$，用**零一膨胀贝塔模型**，把边界值单独建模。

以分数逻辑回归为例，模型为

$$
\log \frac{\mu_i}{1 - \mu_i} = \beta_0 + \beta_1 \cdot \text{长度}_i + \beta_2 \cdot \text{含图片}_i
$$

**系数解释**：$\beta_1$ 表示长度每增加一个单位，完成率的对数几率的变化量，$e^{\beta_1}$ 是优势比的倍数。含图片的系数 $e^{\beta_2}$ 表示在相同长度下，含图片的文章完成率优势是不含图片文章的倍数。解释时避免说成完成率的变化百分点，因为 logit 链接是非线性的，边际效应随基准水平变化。需要在原尺度上解释时，报告在平均值处的边际效应或预测概率曲线。

**诊断方法**：检查偏差残差对拟合值的图，观察是否存在系统性模式；用**过散布检验**判断是否需要改用贝塔回归；检查杠杆值与影响点；用**Hosmer-Lemeshow 类检验**（对比例数据）或校准曲线评估预测概率与实际比例的一致性。模型比较用偏差检验或交叉验证的对数似然。样本量足够时，把响应按解释变量分组、观察组内比例与预测概率的差异，也是有效的诊断方式。
:::

## 常见错误

**错误 1 · 把回归系数解释为因果效应**

原因：回归给出的是条件关联，只有在解释变量与误差项独立（无遗漏变量、无测量误差、无双向因果）时，系数才等于因果效应。观测数据中这三个条件通常都不成立，系数会系统性地偏离真实效应，甚至出现符号反转。

解决：明确分析目标。只做预测时不必强调因果解释，报告预测性能即可；要给出因果结论时，先写出变量之间的因果结构假设，判断效应是否可识别，再用工具变量、倾向得分或准实验设计等方法估计，见 2.14 节。

**错误 2 · 用 $R^2$ 比较变量数不同的模型**

原因：$R^2$ 随解释变量增加而单调不减，加入无关变量也能提高 $R^2$。直接比较不同变量数的 $R^2$ 会系统性地偏向变量更多的模型。

解决：比较时用调整 $R^2$、AIC、BIC 或交叉验证误差，它们都含复杂度惩罚或直接估计样本外误差。报告 $R^2$ 时同时给出变量数与样本量，便于读者判断。

**错误 3 · 忽略共线性直接解释单个系数**

原因：共线性严重时系数标准误膨胀，估计对数据扰动敏感，符号可能反转。此时单个系数的数值与方向都不可靠，但模型的整体预测仍然可用。

解决：先计算 VIF 或条件数，发现共线性后按目的处理：需要解释单个系数时删除相关变量、合并指标或用主成分回归；只需要预测时用岭回归或弹性网。报告时说明共线性的存在与处理方式。

**错误 4 · 对分组数据不做处理直接用普通回归**

原因：同一组内的观测相关（同一门店的销量、同一用户的记录），误差不再独立。普通最小二乘的标准误低估真实不确定性，显著性被高估，组间差异被错误地归因到组内变量。

解决：检查组内相关（ICC）的大小，明显大于零时使用混合效应模型或在标准误上做聚类修正。报告时说明分组变量的层次结构与处理方式，模型比较时注意固定效应与随机效应的划分。
