---
title: 1.4 统计分析
sidebar:
  order: 4
---

# 1.4 统计分析

数据一旦完成清洗与可视化，下一步就是把零散的观测值提炼成可被科学讨论的命题。统计分析承担的就是这一步。它把样本中可见的规律翻译成关于总体的推断，把直觉上的差异翻译成可被复核的概率陈述。作为以统计计算为核心使命的工具，R 语言内置函数与扩展包几乎覆盖了现代统计方法的全部主流分支。本节按一条逻辑主线展开：先用描述性统计认识数据，再借助概率分布理解随机性背后的结构，随后引入假设检验作为推断的统一框架，最后把这个框架分别应用到均值比较、非参数比较、相关与列联表三类常见问题上。每一节都把概念直觉放在函数用法之前，并在关键处附上 Python 等价代码以便对照。

## 1.4.1 描述性统计：数据的摘要与分布

描述性统计是任何分析的第一站。它的任务在于把数据中已经存在的形态用少数几个数字说清楚：数据集中在哪、有多散、形状是否对称、有没有离群的点。这些数字本身没有概率含义，但它们决定了后续推断方法的选择。一个严重右偏的变量，配对差值不服从正态分布的样本，都不应直接套用 t 检验，而应在描述阶段就被识别出来。

**集中趋势**用均值、中位数与众数描述数据的代表值。均值利用了每一个观测值的信息，对正态分布数据最具代表性，但容易被极端值拉偏；中位数只取中间位置，对极端值不敏感，更适合偏态数据；众数适用于分类变量。**离散程度**用方差、标准差、四分位距与变异系数描述数据的散布范围。标准差与原数据同单位，最为常用；四分位距 IQR 等于第 75 百分位数减第 25 百分位数，对极端值稳健；变异系数是标准差除以均值，无量纲，便于比较不同量纲的变量。

R 提供了三套层次不同的汇总函数。基础包 `summary()` 给出最小值、四分位数、均值与最大值六数概括，足以快速浏览；`psych::describe()` 在此基础上增加了标准差、偏度、峰度与标准误，适合探索性分析；`pastecs::stat.desc()` 提供最全面的统计量，开启 `norm = TRUE` 后还会附带正态性检验。下面以一份模拟的医学基线数据演示这三套函数的差异。

```r
set.seed(789)
medical_data <- data.frame(
  age    = round(rnorm(80, mean = 55, sd = 12)),
  bmi    = round(rnorm(80, mean = 25, sd = 3), 1),
  sbp    = round(rnorm(80, mean = 130, sd = 15)),
  dbp    = round(rnorm(80, mean = 85, sd = 10)),
  group  = sample(c("Treatment", "Control"), 80, replace = TRUE)
)

# 基础六数概括
summary(medical_data[, c("age", "bmi", "sbp", "dbp")])

# psych 包提供偏度、峰度、标准误
psych::describe(medical_data[, c("age", "bmi", "sbp", "dbp")])

# pastecs 包附带正态性检验
pastecs::stat.desc(medical_data[, c("age", "bmi", "sbp", "dbp")], norm = TRUE)
```

分布形状的检验离不开图形。直方图把连续变量切成等宽区间并计数，能直观展示分布的中心、对称性与尾部；QQ 图把样本分位数与理论正态分位数逐一对应，若点近似落在一条直线上则分布近似正态，若两端偏离直线则提示偏态或厚尾。两者配合使用，比单看偏度峰度数值更可靠，因为图形能识别具体的偏离位置。

```r
par(mfrow = c(1, 2))

# 直方图叠加正态密度曲线
hist(medical_data$sbp, breaks = 20, probability = TRUE,
     main = "收缩压分布", xlab = "收缩压 (mmHg)", col = "lightblue")
curve(dnorm(x, mean = mean(medical_data$sbp), sd = sd(medical_data$sbp)),
      add = TRUE, col = "red", lwd = 2)

# QQ 图判断正态性
qqnorm(medical_data$sbp, main = "收缩压 QQ 图", col = "steelblue")
qqline(medical_data$sbp, col = "red", lwd = 2)

par(mfrow = c(1, 1))
```

分组汇总是论文表一的核心。`dplyr` 的 `group_by() + summarise()` 组合语法清晰，可读性远好于基础 R 的 `tapply` 与 `aggregate`。`psych::describeBy()` 则能一次性输出各组的完整描述统计。下面这段代码同时演示了 dplyr 的现代写法与 psych 的快速报告写法。

```r
library(dplyr)

medical_data |>
  group_by(group) |>
  summarise(
    n         = n(),
    mean_age  = mean(age),
    sd_age    = sd(age),
    mean_sbp  = mean(sbp),
    median_bp = median(dbp)
  )

# 一行得到分组的完整描述统计
psych::describeBy(medical_data[, c("age", "sbp")], group = medical_data$group)
```

Python 用户在 pandas 中的等价写法是 `df.describe()`。它返回的数据框包含计数、均值、标准差、最小值、四分位数与最大值，与 R 的 `summary()` 在覆盖面上接近，但默认不含偏度与峰度。需要扩展统计量时改用 `scipy.stats.describe`。

```python
import pandas as pd

df = pd.DataFrame({
    "age": [55, 60, 48, 72, 51],
    "sbp": [128, 142, 119, 155, 130]
})

# pandas 默认描述统计
print(df.describe())

# 分组汇总
df["group"] = ["T", "C", "T", "C", "T"]
print(df.groupby("group").agg(["mean", "std", "median"]))
```

分位数与百分位数在医学参考值制定中尤为重要。儿童生长发育标准常用第 3、10、25、50、75、90、97 百分位数刻画，临床检验的正常范围常取第 2.5 与 97.5 百分位数。R 的 `quantile()` 函数可以计算任意百分位数，`fivenum()` 给出五数概括，`IQR()` 给出四分位距。当需要把不同量纲的变量放到同一尺度比较时，`scale()` 函数执行标准化，把数据转换为均值为 0、标准差为 1 的 z 分数，这是回归分析与聚类分析前常见的预处理步骤。

```r
# 计算常用百分位数
quantile(medical_data$sbp, probs = c(0.025, 0.25, 0.5, 0.75, 0.975))

# 五数概括
fivenum(medical_data$sbp)

# 标准化：均值为 0、标准差为 1
sbp_z <- scale(medical_data$sbp)
head(sbp_z, 3)
mean(sbp_z)   # 接近 0
sd(sbp_z)     # 接近 1

# |z| > 3 通常视为异常值
which(abs(sbp_z) > 3)
```

::: tip
描述统计不只是例行公事。它常常暴露数据录入错误、单位混淆、缺失模式与异常子群。一个常见的坑是分类变量被读成数值，此时 `summary()` 看起来正常但 `table()` 会立刻暴露问题。养成先 `str()` 再 `summary()` 再 `table()` 的习惯，能避免大部分低级错误。
:::

## 1.4.2 概率分布与抽样

描述统计处理的是已观测到的数据，推断统计则要把它推广到未观测的总体。这一步跳跃的理论基础是概率分布。概率分布给出随机变量取各种值的可能性，是连接样本与总体的数学桥梁。R 把每一种常见分布都实现为四个同源函数，命名规则统一，掌握这套规则就能在所有分布间自由切换。

四个函数前缀的含义是：**d** 给出概率密度或质量函数，计算某一点处的密度值；**p** 给出累积分布函数，计算小于等于某值的概率；**q** 给出分位数函数，反向计算给定概率对应的值；**r** 给出随机数生成函数，按指定分布抽样。把前缀与分布名组合，就得到一组函数：`dnorm`、`pnorm`、`qnorm`、`rnorm` 对应正态分布，`dt`、`pt`、`qt`、`rt` 对应 t 分布，`dchisq`、`df`、`dbinom`、`dpois` 等以此类推。

下表把统计中最常用的几类分布与它们的 R 函数族列出，方便查阅。

| 分布 | R 函数族 | 主要参数 | 典型应用 |
|:----:|:--------:|:--------:|:--------:|
| 正态 | `*norm` | mean, sd | 连续变量、抽样分布 |
| t | `*t` | df | 小样本均值推断 |
| 卡方 | `*chisq` | df | 方差检验、列联表 |
| F | `*f` | df1, df2 | 方差分析、方差比较 |
| 二项 | `*binom` | size, prob | 成功次数 |
| 泊松 | `*pois` | lambda | 单位时间计数 |

正态分布、t 分布、卡方分布与 F 分布之间有清晰的逻辑关系，理解这层关系就理解了大半个推断统计。**正态分布**是连续变量最常用的理论模型，许多生理指标近似服从正态分布。**t 分布**用于总体方差未知时对均值的推断，它的形状比正态分布略胖，自由度越大越接近正态；这意味着小样本下用 t 而非 z 是更诚实的做法。**卡方分布**是若干标准正态变量平方和的分布，方差估计与列联表检验都从它导出。**F 分布**则是两个独立卡方变量除以各自自由度之比，方差分析正是建立在 F 统计量之上的。这四者的关系可总结为一句话：从正态出发，平方得卡方，相除得 F，配上未知方差替换就得到 t。

下面的代码用 `d/p/q/r` 四个函数演示正态分布的常见操作。同样的模式可以平移到任何其他分布上。

```r
mu <- 120   # 收缩压均值
sigma <- 15 # 收缩压标准差

# d: 概率密度
dnorm(120, mean = mu, sd = sigma)

# p: 累积概率——收缩压低于 100 的概率
pnorm(100, mean = mu, sd = sigma)

# q: 分位数——95% 参考范围的上界
qnorm(0.975, mean = mu, sd = sigma)

# r: 随机抽样——模拟 1000 个观测
set.seed(2024)
bp_sim <- rnorm(1000, mean = mu, sd = sigma)
head(bp_sim)
```

中心极限定理是连接任何分布与正态分布的关键命题。它说的是：无论总体服从什么分布，只要方差有限，样本均值的分布在样本量足够大时趋近于正态。这一定理支撑了大样本下均值检验使用正态近似的合法性，也解释了为何正态分布在统计推断中无处不在。下面这段代码用蒙特卡洛模拟验证它：从一个明显右偏的指数分布总体中反复抽样，观察样本均值的分布如何随样本量增大而逼近正态。

```r
set.seed(333)
population <- rexp(100000, rate = 0.5)   # 右偏总体

par(mfrow = c(1, 3))
for (n in c(5, 30, 100)) {
  sample_means <- replicate(1000, mean(sample(population, size = n)))
  hist(sample_means, breaks = 30, probability = TRUE,
       main = paste("n =", n), xlab = "样本均值", col = "lightblue")
  curve(dnorm(x, mean = mean(population), sd = sd(population) / sqrt(n)),
        add = TRUE, col = "red", lwd = 2)
}
par(mfrow = c(1, 1))
```

模拟结果显示，当样本量为 5 时样本均值的分布仍带右偏，样本量达到 30 时已相当接近正态，样本量 100 时与叠加的正态曲线几乎重合。这种从形状失真到逼近对称的过程，就是中心极限定理在视觉上的体现。

离散分布同样遵循 `d/p/q/r` 命名规则。二项分布描述 n 次独立伯努利试验中的成功次数，期望为 $np$，是医学中最常见的离散模型，例如 20 名患者中治愈人数、100 次检测中阳性次数。泊松分布描述单位时间或单位空间内稀有事件发生次数，期望与方差相等，常用于急诊科单位时间到达人数、单位面积疾病发病数。下面这段代码演示两种分布的常见计算。

```r
# 二项分布：药物有效率 60%，20 名患者中恰好 12 人有效的概率
dbinom(12, size = 20, prob = 0.6)
# 最多 10 人有效的累积概率
pbinom(10, size = 20, prob = 0.6)
# 95% 分位数：至少多少人有效
qbinom(0.95, size = 20, prob = 0.6)

# 泊松分布：急诊科平均每小时 5 名患者
# 恰好 3 名患者的概率
dpois(3, lambda = 5)
# 超过 8 名患者的概率
1 - ppois(8, lambda = 5)

# 随机模拟 100 次二项试验
set.seed(20240)
rbinom(10, size = 20, prob = 0.6)
```

::: note
中心极限定理保证了样本均值的分布近似正态，但前提是总体方差有限。重尾分布如柯西分布不满足这一条件，样本均值不会收敛到正态。在生信分析中，基因表达量的对数变换常被使用，部分原因就是为了把重尾的原始分布压缩到方差有限的形态，让中心极限定理发挥作用。
:::

## 1.4.3 假设检验的逻辑

概率分布提供了数学语言，假设检验提供了把数据翻译成决策的流程。整个 20 世纪统计学的主流框架由 Fisher 与 Neyman-Pearson 共同奠定，其核心是反证法的概率版本：先假设总体中没有效应，再看在这种假设下观测到当前数据或更极端数据的概率有多大；如果这个概率足够小，就拒绝无效应的假设。

**原假设** $H_0$ 通常陈述无效应、无差异、相互独立。它是被检验的对象，也是被默认为真的起点。**备择假设** $H_1$ 陈述有效应、有差异、有关联，是研究者希望支持的命题。检验的逻辑在于评估 $H_0$ 是否站得住脚，而非直接证明 $H_1$ 为真。如果数据在 $H_0$ 下显得过于罕见，就拒绝 $H_0$；如果数据并不罕见，则只能说证据不足以拒绝 $H_0$，而不能说证明了 $H_0$。

**p 值** 是这一流程的核心量。它的严格定义是：在 $H_0$ 为真的前提下，观测到当前统计量或更极端统计量的概率。p 值小，意味着在 $H_0$ 下当前数据罕见，构成反对 $H_0$ 的证据；p 值大，意味着当前数据在 $H_0$ 下并不罕见，没有理由拒绝 $H_0$。p 值的常见误读有三类：把 p 值当作 $H_0$ 为真的概率、当作效应大小的度量、当作结果可复现的概率。这三种解读都是错误的，p 值只衡量数据与 $H_0$ 的相容程度。

**显著性水平** $\alpha$ 是研究者预先设定的阈值，通常取 0.05 或 0.01。当 p 值小于 $\alpha$ 时拒绝 $H_0$。这一阈值同时定义了第一类错误的上限。两类错误的含义如下表：

| 决策与真实情况 | $H_0$ 为真 | $H_0$ 为假 |
|:--------------:|:----------:|:----------:|
| 不拒绝 $H_0$ | 正确决策 | 第二类错误 $\beta$ |
| 拒绝 $H_0$ | 第一类错误 $\alpha$ | 正确决策（功效 $1-\beta$） |

第一类错误是假阳性，把没有效应说成有效应；第二类错误是假阴性，把存在效应说成不存在。两者存在此消彼长的关系：在样本量固定时，降低 $\alpha$ 会提高 $\beta$，反之亦然。唯一能同时降低两者的办法是增加样本量。**统计功效**定义为 $1-\beta$，即当 $H_1$ 为真时正确拒绝 $H_0$ 的概率。功效分析的核心目标是回答两个问题：在给定效应量与显著性水平下，需要多少样本才能以 80% 的概率检出效应；在给定样本量下，能以多大功效检出给定效应。

下面的代码用 `pwr` 包演示功效分析。效应量、显著性水平、功效与样本量四者中已知任意三个，可以求解第四个。

```r
library(pwr)

# 中等效应量 d=0.5、显著性水平 0.05、目标功效 0.8
# 求两样本 t 检验所需的每组样本量
pwr.t.test(d = 0.5, sig.level = 0.05, power = 0.8, type = "two.sample")
```

::: warning
p 值的误用在科研中由来已久。把 $p < 0.05$ 当作真理的开关，是过去十年可重复性危机的重要诱因之一。在报告结果时，应同时给出效应量、置信区间与 p 值，而不是只报 p 值是否显著。一个 $p = 0.04$ 的大样本结果与一个 $p = 0.06$ 的小样本结果，在科学意义上可能没有差别。
:::

**效应量** 衡量效应的实际大小，独立于样本量。p 值告诉你效应是否存在，效应量告诉你效应有多大。大样本下即使毫无实际意义的微小差异也能达到统计显著，因此只看 p 值容易被样本量误导。Cohen's d 是均值差异的常用效应量，定义为均值差除以合并标准差，0.2、0.5、0.8 分别对应小、中、大效应；$\eta^2$ 是方差分析的效应量，表示总变异中由组别解释的比例；Cramér's V 是列联表的效应量。报告结果时给出效应量与置信区间，比只报 p 值更有信息量。

```r
# 手动计算 Cohen's d
drug    <- rnorm(25, mean = 15, sd = 6)
placebo <- rnorm(25, mean = 8,  sd = 6)
s_pooled <- sqrt(((25 - 1) * sd(drug)^2 + (25 - 1) * sd(placebo)^2) / (25 + 25 - 2))
cohens_d <- (mean(drug) - mean(placebo)) / s_pooled
cohens_d

# 使用 DescTools 包便捷计算
DescTools::CohenD(drug, placebo)
```

多重比较是另一类需要警惕的陷阱。当对同一数据集进行多次检验时，至少有一次犯第一类错误的概率会随检验次数增加而膨胀。5 次独立检验在 $\alpha = 0.05$ 下，族错误率达到 $1 - 0.95^5 \approx 23\%$。校正方法分两类：Bonferroni 校正把 $\alpha$ 除以检验次数，控制族错误率，但偏保守；Benjamini-Hochberg 方法控制错误发现率 FDR，在组学数据分析中更常用。R 的 `p.adjust()` 函数内置了这些方法。

## 1.4.4 t 检验与方差分析

假设检验的逻辑一旦建立，就可以套用到不同的统计量上。最常见的一类问题是均值比较：一组样本的均值是否不同于某个已知值，两组样本的均值是否不同，多组样本的均值是否不全相同。t 检验处理前两种，方差分析处理第三种。

t 检验按设计不同分三种。**单样本 t 检验**比较一组样本的均值与已知值，统计量为 $t = (\bar{x} - \mu_0) / (s / \sqrt{n})$，自由度 $n-1$。**配对 t 检验**比较同一受试者在两个条件下的测量差值，等价于对差值做单样本 t 检验，自由度 $n-1$。**独立样本 t 检验**比较两组独立样本的均值差，方差齐性满足时使用合并方差 t 检验，方差不齐时使用 Welch 校正。Welch 校正是 R 的默认选项，它对正态性假设更稳健，即使在方差齐性满足时也几乎不损失功效，因此被许多统计学家推荐为默认选择。

下面这段代码演示三种 t 检验。先用 `t.test()` 完成单样本与配对检验，再对两组独立样本比较 Student 与 Welch 两种校正的差异。

```r
# 单样本 t 检验：收缩压均值是否不同于 120
set.seed(20241)
sbp <- rnorm(35, mean = 125, sd = 12)
t.test(sbp, mu = 120)

# 配对 t 检验：治疗前后的血压变化
before <- rnorm(20, mean = 145, sd = 10)
after  <- before - rnorm(20, mean = 8, sd = 4)
t.test(before, after, paired = TRUE)

# 独立样本 t 检验：新药组与安慰剂组的降压值
drug    <- rnorm(25, mean = 15, sd = 6)
placebo <- rnorm(25, mean = 8,  sd = 6)

# Welch 校正（默认，更稳健）
t.test(drug, placebo, var.equal = FALSE)

# Student t 检验（方差齐性假设）
t.test(drug, placebo, var.equal = TRUE)
```

Python 中 `scipy.stats` 提供了等价函数。`ttest_1samp` 对应单样本，`ttest_rel` 对应配对，`ttest_ind` 对应独立样本，参数 `equal_var` 控制 Student 或 Welch。

```python
from scipy import stats
import numpy as np

np.random.seed(20241)
drug    = np.random.normal(15, 6, 25)
placebo = np.random.normal(8,  6, 25)

# Welch 校正（推荐默认）
t_stat, p_value = stats.ttest_ind(drug, placebo, equal_var=False)
print(f"t = {t_stat:.3f}, p = {p_value:.4f}")
```

当组数超过两个时，多次两两 t 检验会放大族错误率，方差分析（ANOVA）通过一次整体检验避免这个问题。单因素方差分析把总变异分解为组间变异与组内变异，构造 F 统计量 $F = MS_{between} / MS_{within}$。原假设是所有组均值相等，备择假设是至少有一对组均值不等。ANOVA 是个整体检验，它告诉你存在差异但不说在哪一组，因此显著结果之后需要事后多重比较定位差异来源。

`aov()` 是 R 中拟合方差分析的标准函数，配合 `summary()` 查看 F 检验结果，配合 `TukeyHSD()` 做最常用的 Tukey 事后比较。Tukey HSD 控制所有两两比较的族错误率，是各组样本量相等时的首选方法。

```r
set.seed(20242)
drug_data <- data.frame(
  reduction = c(rnorm(25, 10, 3), rnorm(25, 12, 3), rnorm(25, 8, 3)),
  drug      = factor(rep(c("A", "B", "C"), each = 25))
)

# 整体方差分析
aov_fit <- aov(reduction ~ drug, data = drug_data)
summary(aov_fit)

# Tukey HSD 事后比较
TukeyHSD(aov_fit)
plot(TukeyHSD(aov_fit))
```

方差分析有三个假设：各组近似正态、方差齐性、观测独立。前两者可分别用 `shapiro.test()` 与 `car::leveneTest()` 检验。若方差齐性被拒绝，可改用 Welch ANOVA `oneway.test(var.equal = FALSE)`；若正态性严重不满足，应改用非参数的 Kruskal-Wallis 检验，本章下一节会展开。

当研究涉及两个或更多因素时，单因素方差分析扩展为多因素方差分析。例如同时考察药物类型与剂量对降压效果的影响，模型 `reduction ~ drug * dose` 中的 `*` 表示同时纳入主效应与交互效应。交互效应回答的问题是：一种药物在不同剂量下的差异模式，是否与另一种药物相同。如果交互项显著，说明一个因素的效应依赖于另一个因素的水平，此时不应单独解读主效应，而应分层分析。

```r
# 2x3 析因设计：2 种药物 x 3 种剂量
set.seed(20246)
factorial_data <- data.frame(
  drug = factor(rep(rep(c("A", "B"), each = 10), 3)),
  dose = factor(rep(rep(c("Low", "Mid", "High"), each = 20))),
  reduction = c(rnorm(20, 8, 2), rnorm(20, 12, 2))   # 简化的效应模式
)

# 两因素方差分析（含交互项）
factorial_aov <- aov(reduction ~ drug * dose, data = factorial_data)
summary(factorial_aov)
```

::: tip
报告 t 检验与 ANOVA 结果时，应同时给出均值、标准差、样本量、检验统计量、自由度、p 值与效应量。Cohen's d 是 t 检验的常用效应量，0.2、0.5、0.8 分别对应小、中、大效应；$\eta^2$ 是 ANOVA 的常用效应量，表示总变异中由组别解释的比例。效应量让读者判断差异的实际重要性，避免被大样本下的微小 p 值误导。
:::

## 1.4.5 非参数检验

参数检验依赖正态假设，但真实数据并不总是服从正态。当样本量很小、分布严重偏态、数据是等级变量或存在明显异常值时，参数检验的前提被破坏，结论也就不可靠。非参数检验不假设总体分布的具体形式，转而基于秩次进行推断，对上述场景更稳健。

非参数检验与参数检验存在清晰的对应关系。两独立样本的 t 检验对应 Mann-Whitney U 检验，在 R 中也叫 Wilcoxon 秩和检验；两配对样本的 t 检验对应 Wilcoxon 符号秩检验；单因素方差分析对应 Kruskal-Wallis 检验；重复测量方差分析对应 Friedman 检验。这些方法的共同思路是：把原始观测值转换为秩次，再对秩次做类似的检验，从而避免对分布形态的依赖。

非参数检验的代价是功效略低。当数据确实满足正态假设时，秩检验的渐近效率约为参数检验的 95%，损失并不大；当正态假设不成立时，非参数检验反而可能更有效。因此当对分布形态有怀疑且样本量不大时，非参数方法是更安全的选择。

下面的代码演示 Wilcoxon 秩和检验与 Kruskal-Wallis 检验。前者比较两组有序评分，后者比较三组连续指标。`wilcox.test()` 与 `kruskal.test()` 是 R 基础包自带的函数，无需额外加载扩展包。

```r
# Wilcoxon 秩和检验（Mann-Whitney U）：两种药物的疗效评分
set.seed(20243)
score_data <- data.frame(
  score = c(sample(1:5, 30, replace = TRUE,
                   prob = c(0.1, 0.15, 0.2, 0.3, 0.25)),
            sample(1:5, 30, replace = TRUE,
                   prob = c(0.25, 0.3, 0.2, 0.15, 0.1))),
  drug  = factor(rep(c("A", "B"), each = 30))
)

wilcox.test(score ~ drug, data = score_data)

# Kruskal-Wallis 检验：三种治疗方法的疗效比较
kw_data <- data.frame(
  score = c(rnorm(20, 60, 15), rnorm(20, 70, 15), rnorm(20, 55, 15)),
  group = factor(rep(c("A", "B", "C"), each = 20))
)

kruskal.test(score ~ group, data = kw_data)

# 事后多重比较：成对 Wilcoxon 检验 + Bonferroni 校正
pairwise.wilcox.test(kw_data$score, kw_data$group,
                     p.adjust.method = "bonferroni")
```

配对设计与重复测量设计也有对应的非参数方法。配对样本的差值若不服从正态分布，应使用 Wilcoxon 符号秩检验，在 `wilcox.test()` 中加上 `paired = TRUE` 参数即可。同一受试者在三个或更多条件下的重复测量，对应 Friedman 检验，它是单因素重复测量方差分析的非参数版本。Friedman 检验先在每个受试者内部对各条件排序，再对秩次做整体比较。

```r
# Wilcoxon 符号秩检验：治疗前后的疼痛评分（非正态）
set.seed(20247)
before <- rnorm(15, mean = 7, sd = 1.5)
after  <- before - rnorm(15, mean = 2, sd = 1)
wilcox.test(before, after, paired = TRUE)

# Friedman 检验：同一受试者三种治疗的评分
set.seed(20248)
friedman_data <- matrix(
  c(rnorm(12, 60, 8), rnorm(12, 70, 8), rnorm(12, 55, 8)),
  nrow = 12, ncol = 3,
  dimnames = list(NULL, c("T1", "T2", "T3"))
)
friedman.test(friedman_data)
```

何时选择非参数方法？一个实用的判断流程是：先检查数据类型。如果是等级变量或评分，直接用非参数方法；如果是连续变量，再检查正态性。正态性检查可以用 Shapiro-Wilk 检验配合 QQ 图，但要注意大样本下检验会过于敏感，几乎任何轻微偏离都会被判定为非正态。因此更实际的做法是结合样本量与图形判断：样本量大且偏离轻微时仍可用参数方法，因为中心极限定理保证了均值的近似正态；样本量小且偏离明显时改用非参数方法。

```r
# 正态性检验：Shapiro-Wilk
set.seed(20244)
normal_data  <- rnorm(50, mean = 50, sd = 10)
skewed_data  <- rexp(50, rate = 0.1)

shapiro.test(normal_data)   # p > 0.05，不拒绝正态
shapiro.test(skewed_data)   # p < 0.05，拒绝正态

# 配对 QQ 图对比
par(mfrow = c(1, 2))
qqnorm(normal_data,  main = "近似正态");  qqline(normal_data)
qqnorm(skewed_data,  main = "明显右偏");  qqline(skewed_data)
par(mfrow = c(1, 1))
```

::: note
Wilcoxon 秩和检验在 R 中默认使用正态近似计算 p 值，并附带连续性校正。当样本量很小（任一组少于 10 例）时，应改用精确分布，加上 `exact = TRUE` 参数即可。当数据中存在大量相同秩次（ties）时，正态近似可能不准，此时建议使用 `coin` 包的 `wilcox_test()` 函数，它能正确处理秩次相同的情况。
:::

## 1.4.6 相关分析与列联表

前面两节处理的都是均值比较，无论是 t 检验、方差分析还是其非参数对应方法，结局变量都是数值型。但在实际研究中，常常需要回答另一类问题：两个连续变量是否一起变化，两个分类变量是否相互独立。前者是相关分析，后者是列联表分析。

**Pearson 相关系数**衡量两个连续变量之间的线性关联程度，定义为协方差除以两个变量标准差的乘积。它取值在 $[-1, 1]$ 之间，绝对值越接近 1 线性关系越强，符号表示方向。Pearson 相关有三个前提：变量间关系是线性的、变量近似服从二元正态分布、无显著异常值。这三个前提中任何一个不满足，都会让 Pearson 相关给出误导性的数值。

**Spearman 相关系数**用秩次代替原始值计算 Pearson 相关，衡量的是变量间的单调关系而非线性关系。它对异常值稳健，适用于等级变量或不服从正态的连续变量。当关系明显非线性但单调时，Spearman 通常比 Pearson 更能反映真实关联。Kendall $\tau$ 是另一种基于秩的相关系数，对小样本与存在大量相同秩次的数据更稳健，但计算成本更高。

`cor.test()` 同时给出相关系数的点估计、置信区间与显著性检验。`cor()` 只计算相关系数不检验；当数据含缺失值时需指定 `use = "complete.obs"` 或 `"pairwise.complete.obs"` 处理。

```r
set.seed(20245)
n <- 60
x <- rnorm(n, mean = 100, sd = 15)
y <- 0.7 * x + rnorm(n, mean = 0, sd = 10)

# Pearson 相关
cor.test(x, y, method = "pearson")

# Spearman 秩相关（对异常值稳健）
cor.test(x, y, method = "spearman")

# 相关系数矩阵
medical_num <- medical_data[, c("age", "bmi", "sbp", "dbp")]
cor(medical_num)

# 可视化相关矩阵
corrplot::corrplot(cor(medical_num),
                   method = "color", type = "upper",
                   addCoef.col = "black", tl.col = "black")
```

Python 中相关系数的计算在 `pandas` 与 `scipy.stats` 中都有。`df.corr()` 给出相关矩阵，`stats.pearsonr` 与 `stats.spearmanr` 给出系数与 p 值。

```python
import pandas as pd
from scipy import stats

df = pd.DataFrame({"x": x, "y": y})
print(df.corr(method="pearson"))
print(df.corr(method="spearman"))

r, p = stats.pearsonr(x, y)
print(f"Pearson r = {r:.3f}, p = {p:.4f}")
```

当两个变量同时受到第三个变量影响时，简单相关系数可能高估或低估真实的关联。**偏相关** 在控制其他变量影响后计算两变量间的线性关联，能揭示被混杂变量掩盖的真实关系。例如血压与体重的关系可能部分由年龄驱动，控制年龄后两者的偏相关可能明显低于简单相关。R 的 `ppcor` 包提供 `pcor()` 与 `pcor.test()` 函数完成偏相关计算。

```r
# 偏相关：控制年龄后，体重与收缩压的相关
set.seed(20249)
age  <- rnorm(60, mean = 55, sd = 12)
bmi  <- 0.4 * (age - 55) + rnorm(60, sd = 3) + 25
sbp  <- 0.8 * (age - 55) + rnorm(60, sd = 8) + 130

# 简单相关可能被年龄驱动而偏高
cor.test(bmi, sbp)

# 控制年龄后的偏相关
library(ppcor)
pcor.test(bmi, sbp, age)
```

列联表分析处理两个分类变量的关联性。先 `table()` 生成频数表，再 `chisq.test()` 做卡方独立性检验。卡方检验的统计量是 $\sum (O - E)^2 / E$，其中 $O$ 是观测频数，$E$ 是行列独立假设下的期望频数。原假设是两个变量独立，备择假设是它们有关联。

卡方检验有一个重要前提：每个单元格的期望频数不宜过小，传统要求所有期望频数大于 5。当这一条件不满足时，应改用 **Fisher 精确检验**，它基于超几何分布直接计算给定边际下出现当前或更极端列联表的概率，对小样本与稀疏数据更可靠。医学研究中样本量小或事件罕见时，Fisher 检验是首选。

```r
# 卡方独立性检验：吸烟与肺癌
smoke_cancer <- matrix(c(60, 40, 30, 70), nrow = 2,
                       dimnames = list(吸烟 = c("是", "否"),
                                       肺癌 = c("是", "否")))
chisq.test(smoke_cancer)

# 查看期望频数与标准化残差
chisq.test(smoke_cancer)$expected
chisq.test(smoke_cancer)$stdres

# Fisher 精确检验：小样本或稀疏单元
small_table <- matrix(c(8, 2, 3, 7), nrow = 2,
                      dimnames = list(组别 = c("治疗", "对照"),
                                      结局 = c("有效", "无效")))
fisher.test(small_table)

# 效应量：Cramér's V
library(vcd)
assocstats(smoke_cancer)
```

配对分类数据需要用 McNemar 检验，它专用于同一受试者在两个时间点或两种条件下的二分类结果变化。例如治疗前后症状的有无，同一样本用两种检测方法的结果。McNemar 检验只关注列联表中非对角线的两个单元格，即结果发生变化的频数。

```r
# McNemar 检验：治疗前后的症状变化
mcnemar_table <- matrix(c(20, 30, 10, 40), nrow = 2,
                        dimnames = list(治疗前 = c("有症状", "无症状"),
                                        治疗后 = c("有症状", "无症状")))
mcnemar.test(mcnemar_table)

# 精确版本（小样本）
exact2x2::mcnemar.exact(mcnar_table)
```

::: warning
相关不等于因果。两个变量高度相关，可能因为一个导致另一个，也可能因为第三个变量同时影响两者，甚至可能纯粹是巧合。在报告相关分析时，应避免使用暗示因果的语言。要建立因果结论，需要研究设计层面的支持，如随机对照试验、自然实验或因果推断方法，单纯的相关系数无法承担这一任务。
:::

---

## 本节小结

统计分析把样本数据转化为关于总体的科学论断，这一过程有严格的逻辑链条。本节按照这条链条展开：先用描述性统计认识数据的中心、离散与分布形态，借助 `summary()`、`psych::describe()`、直方图与 QQ 图建立基本印象；再用概率分布理解随机性背后的结构，掌握 R 中 `d/p/q/r` 四类函数的统一命名规则，并通过模拟验证中心极限定理；随后引入假设检验作为推断的统一框架，理解原假设、备择假设、p 值、两类错误与统计功效的关系，警惕 p 值的常见误读与多重比较问题；最后把这套框架分别套用到三类问题上——均值比较对应 t 检验与方差分析，秩次比较对应 Wilcoxon 与 Kruskal-Wallis 检验，关联性分析对应 Pearson/Spearman 相关与卡方/Fisher 检验。

掌握统计分析的关键在于理解每个方法背后的假设与适用条件，而不是记住函数调用。每个检验都有它要求的前提：t 检验要求正态与方差齐性，方差分析要求正态、方差齐性与独立性，卡方检验要求期望频数足够大，Pearson 相关要求线性与二元正态。前提不满足时改用对应的方法：Welch 校正、Kruskal-Wallis、Fisher 精确检验、Spearman 秩相关。这种从前提出发选择方法的思维，是从工具使用者跨越到分析者的必经之路。R 的价值在于它把这套方法体系完整地暴露在统一接口下，让分析者能专注于科学问题本身，而无需为不同软件的实现差异分心。
