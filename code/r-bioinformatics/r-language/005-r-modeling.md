---
title: 1.5 统计建模
sidebar:
  order: 5
---

# 1.5 统计建模

统计建模是把经验观察转化为可量化、可检验、可预测的数学表达的过程，是数据分析的核心环节。本节从最基础的线性回归出发，逐步延伸到广义线性模型、混合效应模型、生存分析、正则化回归与模型选择，覆盖医学科研中最常遇到的建模场景。每个主题都强调模型背后的假设与直觉，而不只是罗列函数用法。读完本节后，你应当能够根据数据特征选择合适的模型，并正确解读 R 输出中的关键统计量。

## 1.5.1 线性回归：最小二乘的几何直觉

线性回归是统计建模的起点，几乎所有更复杂的模型都可以视为它的扩展。它假设因变量 Y 与自变量 X 之间存在线性关系，并通过最小化残差平方和来估计系数。从几何上看，最小二乘就是把观测向量 Y 投影到自变量张成的列空间上，投影向量就是拟合值，残差就是 Y 到该子空间的垂直距离。这一几何视角能帮助理解后续许多概念，例如自由度、残差分析与多重共线性。

模型的基本设定为 Y = β0 + β1·X1 + ... + βp·Xp + ε，其中 ε 服从均值为 0、方差相等的正态分布。这一假设包含四个关键要素：线性性（因变量与自变量关系为线性）、独立性（观测之间互不相关）、同方差性（残差方差恒定）与正态性（残差服从正态分布）。违反这些假设并不一定让模型完全失效，但会影响标准误估计与置信区间的准确性，进而影响假设检验的可靠性。

下面用 R 内置的 mtcars 数据集演示 mpg（每加仑行驶英里数）与 wt（车重）的简单线性回归。

```r
# 拟合简单线性回归
fit <- lm(mpg ~ wt, data = mtcars)

# 查看模型摘要
summary(fit)
```

summary() 输出的核心信息包括三部分：系数表、整体显著性、拟合优度。系数表中 Estimate 是回归系数，Std. Error 是标准误，t value 是 t 统计量，Pr(>|t|) 是 p 值。wt 的系数约为 -5.34，意味着车重每增加 1000 磅，mpg 平均下降约 5.34 英里。Multiple R-squared 表示模型解释的方差比例，Adjusted R-squared 则对自变量数量进行惩罚，更适合比较不同复杂度的模型。

::: tip
解读回归系数时务必注意变量单位。如果 wt 单位是 1000 磅，系数 -5.34 表示每增加 1000 磅的效应；如果换成千克，系数数值会完全不同，但模型本身的解释力不变。R 方与单位无关，是更通用的拟合优度指标。
:::

多元线性回归的解读与一元类似，但需要注意控制其他变量这一前提。系数 βj 表示在控制其他自变量不变时，Xj 每增加一个单位 Y 的平均变化量。这一控制是通过正交化实现的：本质上是用其他变量解释 Xj 的部分后，剩余部分对 Y 的效应。

```r
# 多元线性回归
fit_multi <- lm(mpg ~ wt + hp + cyl, data = mtcars)
summary(fit_multi)
```

模型摘要只能告诉你系数是否显著，无法判断模型假设是否成立。残差诊断图是检验假设的必备工具，R 中通过 plot(fit) 直接生成四张默认图。

```r
# 设置 2x2 画布绘制四张诊断图
par(mfrow = c(2, 2))
plot(fit)
```

四张诊断图各有用途。Residuals vs Fitted 检查线性性，若图中有明显曲线模式，说明线性假设可能不成立，应考虑加入二次项或非线性变换。Normal Q-Q 检查残差正态性，点应大致落在对角线上，尾部偏离影响不大，严重偏离则需考虑变量变换。Scale-Location 检查同方差性，红线应大致水平，若呈喇叭形则存在异方差。Residuals vs Leverage 识别高杠杆点与强影响点，关注 Cook 距离等高线之外的观测。

t 检验与 F 检验是模型摘要中的两类核心检验。t 检验针对单个系数，零假设是该系数为零，t 值是系数与标准误的比值，p 值反映该系数是否显著异于零。F 检验针对整个模型，零假设是所有斜率系数同时为零，检验模型整体是否比仅用均值预测更好。在一元回归中，F 检验与 t 检验等价；在多元回归中，F 检验只告诉你模型整体有用，具体哪些变量重要仍需看单独的 t 检验。

当线性假设不成立时，变量变换是常用的修复手段。对数变换能处理右偏分布与异方差，倒数变换能处理极端值，Box-Cox 变换能自动选择最优幂次。选择变换的依据是残差诊断图与领域可解释性：log(Y) 的系数表示百分比变化，比原始尺度的系数更易解读，因此经济学与流行病学常优先采用对数形式。

```r
# 对数变换处理右偏分布
fit_log <- lm(log(mpg) ~ wt + hp, data = mtcars)
summary(fit_log)

# Box-Cox 变换自动选择幂次
library(MASS)
bc <- boxcox(lm(mpg ~ wt + hp, data = mtcars), lambda = seq(-2, 2, 0.1))
bc$lambda[which.max(bc$y)]  # 最优 lambda
```

类别型自变量在 R 中通过因子（factor）处理。lm() 会自动将因子转为虚拟变量，第一个水平作为参照组，其他水平的系数表示与参照组的差异。对照方式可通过 relevel() 或 contrasts() 函数调整，例如把治疗组的参照设为安慰剂组，得到的系数更符合研究语境。

```r
# 类别型变量回归：cyl 作为因子
mtcars$cyl_factor <- factor(mtcars$cyl)
fit_factor <- lm(mpg ~ wt + cyl_factor, data = mtcars)
summary(fit_factor)
```

交互项用于刻画一个自变量对因变量的效应如何随另一个自变量变化。医学研究中常见的交互场景是药物效应因性别或基因型不同而异，这时需要把治疗与性别的交互项放入模型。交互项的系数解释为：与参照组相比，效应的额外增量。

```r
# 交互项：wt 与 cyl 的交互
fit_int <- lm(mpg ~ wt * cyl_factor, data = mtcars)
summary(fit_int)
```

公式中 wt * cyl_factor 等价于 wt + cyl_factor + wt:cyl_factor，最后一项是交互项。若交互项显著，说明 wt 对 mpg 的效应在不同 cyl 水平下不同，此时主效应系数不能单独解读，必须结合交互项。多项式回归通过加入 X²、X³ 项拟合非线性关系，本质是线性模型的扩展。

```r
# 多项式回归：拟合 mpg 与 wt 的非线性关系
fit_poly <- lm(mpg ~ poly(wt, 2), data = mtcars)
summary(fit_poly)

# 或直接使用 I() 函数
fit_poly2 <- lm(mpg ~ wt + I(wt^2), data = mtcars)
```

poly(wt, 2) 生成正交多项式，避免高次项间的共线性；I(wt^2) 直接加入原始平方项，系数更易解读但可能存在共线性。选择几阶多项式需要结合残差诊断与领域知识，过高的阶数会过拟合。

下面是 Python statsmodels 的对照实现，便于跨语言迁移。statsmodels 的 summary() 输出与 R 的格式接近，这种一致性使得两个工具可以互相验证结果。

```python
import statsmodels.api as sm
import pandas as pd

# 加载数据
df = pd.read_csv("mtcars.csv")
X = sm.add_constant(df[["wt", "hp", "cyl"]])
y = df["mpg"]

# 拟合模型并查看摘要
model = sm.OLS(y, X).fit()
print(model.summary())
```

## 1.5.2 广义线性模型：超越正态假设

线性回归要求因变量连续且近似正态，但医学研究中常见两类数据无法满足这一假设：二分类结局（如发病/未发病）与计数数据（如一年内住院次数）。直接用线性回归处理二分类结局会遇到根本困难：模型预测值可能小于 0 或大于 1，而概率必须在 0 到 1 之间。广义线性模型（Generalized Linear Model，GLM）通过引入链接函数解决这一问题。

GLM 的核心思想是不再直接对 Y 建模，而是对 Y 的条件期望 g(μ) 建模，其中 g 是链接函数，μ = E(Y|X)。不同的分布族对应不同的链接函数：二项分布用 logit 链接，泊松分布用 log 链接，正态分布用恒等链接（即线性回归）。这种统一框架让一类算法可以处理多种数据类型，所有 GLM 都通过最大似然估计而非最小二乘求解。

逻辑回归处理二分类结局，模型形式为 log(p/(1-p)) = β0 + β1·X。等号左边就是 logit 函数，它把 0 到 1 的概率映射到整个实数轴，从而避免线性回归的越界问题。等价地，可以写成 p = 1/(1 + exp(-β0 - β1·X))，这是更常见的 S 形曲线形式。系数 β1 解释为：X 每增加一个单位，logit（对数优势比）增加 β1。更直观的解释是优势比 OR = exp(β1)，表示 X 增加一个单位时，事件发生的优势变为原来的 exp(β1) 倍。

下面用 mtcars 数据集演示 am（变速箱类型：0=自动，1=手动）对 mpg 是否大于均值这一二分类结局的逻辑回归。

```r
# 构造二分类因变量
mtcars$mpg_high <- ifelse(mtcars$mpg > mean(mtcars$mpg), 1, 0)

# 拟合逻辑回归
logit_fit <- glm(mpg_high ~ wt + hp, data = mtcars, family = binomial)

# 查看摘要
summary(logit_fit)

# 计算优势比与置信区间
exp(coef(logit_fit))
exp(confint(logit_fit))
```

family = binomial 默认使用 logit 链接，对应逻辑回归。系数通过最大似然估计得到，summary() 输出中的 z value 与 t value 类似，是系数与标准误的比值。exp(coef()) 给出优势比，比原始系数更易解读。OR 大于 1 表示该变量增加时事件发生的优势上升，小于 1 表示下降。OR=2 意味着优势翻倍，OR=0.5 意味着优势减半。

逻辑回归没有 R 方的直接对应物，因为最大似然估计不基于方差分解。常用的替代指标是 McFadden 伪 R 方，定义为 1 - logL_full / logL_null，取值在 0 到 1 之间，但通常远小于线性回归的 R 方，0.2-0.4 已被视为良好拟合。更可靠的模型评估是预测准确率、AUC 与校准曲线，这些需要从预测概率出发计算。

```r
# 计算 McFadden 伪 R 方
loglik_full <- logLik(logit_fit)
loglik_null <- logLik(glm(mpg_high ~ 1, data = mtcars, family = binomial))
1 - as.numeric(loglik_full) / as.numeric(loglik_null)

# 预测概率与 AUC
library(pROC)
pred_prob <- predict(logit_fit, type = "response")
auc(mtcars$mpg_high, pred_prob)
```

链接函数的选择并非任意。二项分布的自然链接是 logit，但 probit 与 cloglog 也是合法选项。probit 链接对应潜变量服从正态分布的假设，结果与 logit 通常接近；cloglog 链接适用于事件发生率很低或很高的场景，常用于罕见病研究。医学研究中最常用 logit，因为其系数直接对应优势比，解释清晰。

::: warning
优势比 OR 与相对风险 RR 是两个不同概念。OR 是两组事件优势之比，RR 是两组事件概率之比。当事件发生率较低（小于 10%）时，OR 与 RR 数值接近；当事件率高时，OR 会显著偏离 RR。在病例对照研究中只能估计 OR，在队列研究中两者均可计算。
:::

泊松回归用于计数数据，假设因变量服从泊松分布，模型形式为 log(λ) = β0 + β1·X。系数解释为：X 每增加一个单位，事件发生率的对数增加 β1。指数化后得到发生率比（Incidence Rate Ratio，IRR），含义与优势比类似。

```r
# 模拟计数数据：医院日均门诊量
set.seed(42)
n <- 200
df <- data.frame(
  day = rpois(n, lambda = 50),
  staff = round(runif(n, 5, 20)),
  holiday = rbinom(n, 1, 0.1)
)

# 拟合泊松回归
pois_fit <- glm(day ~ staff + holiday, data = df, family = poisson)
summary(pois_fit)

# 发生率比
exp(coef(pois_fit))
exp(confint(pois_fit))
```

泊松回归有一个关键假设：均值等于方差。若方差显著大于均值，存在过度离散，标准误会被低估，p 值偏小，假阳性率上升。这时应改用 quasi-Poisson（family = quasipoisson）或负二项回归 MASS::glm.nb()。

```r
# 检查过度离散：残差偏差除以自由度
deviance(pois_fit) / df.residual(pois_fit)

# 若比值远大于 1，使用负二项回归
library(MASS)
nb_fit <- glm.nb(day ~ staff + holiday, data = df)
summary(nb_fit)
```

::: warning
泊松回归的等离散假设常被忽略。若数据存在过度离散（方差远大于均值），继续使用泊松回归会得到过窄的置信区间与过小的 p 值，导致假阳性。检查方法是看残差偏差与自由度的比值，显著大于 1 即提示过度离散。
:::

Python 中逻辑回归通常用 statsmodels 实现，输出格式与 R 接近。

```python
import statsmodels.api as sm
import numpy as np

# 准备数据
X = sm.add_constant(df[["wt", "hp"]])
y = df["mpg_high"]

# 拟合逻辑回归
logit_model = sm.Logit(y, X).fit()
print(logit_model.summary())

# 优势比
print(np.exp(logit_model.params))
print(np.exp(logit_model.conf_int()))
```

## 1.5.3 混合效应模型：处理嵌套数据

医学研究中数据常带有嵌套结构：学生在班级内，班级在学校内；患者在医院内，医院在地区内；同一个体被重复测量多次。若忽略这种结构，把所有观测当作独立样本处理，会低估标准误，得到过小的 p 值，导致假阳性。混合效应模型通过同时包含固定效应与随机效应来处理这类数据。

固定效应估计的是总体层面的效应，与普通回归的系数相同。随机效应则假设每个组（每个班级、每个个体）有自己的截距或斜率，这些组级效应服从均值为零的正态分布。随机截距模型允许每个组有不同的起点，随机斜率模型允许每个组有不同的变化趋势。模型通过限制估计参数数量（只估计随机效应的方差），既能捕捉组间差异，又能利用组内重复信息提升统计效力。

判断是否需要混合模型，关键是看数据是否存在组内相关性。组内相关系数（Intraclass Correlation Coefficient，ICC）衡量组间方差占总方差的比例。ICC 大于 0.1 通常认为组内相关不可忽略，应考虑混合模型。重复测量数据本质上也是一种嵌套结构，每个时间点嵌套在个体内，因此也适用同一框架。

下面用 lme4 包模拟一个重复测量数据并拟合混合效应模型。

```r
library(lme4)

# 模拟重复测量数据：30 个患者，每人 5 次随访
set.seed(123)
n_subj <- 30
n_time <- 5
df <- data.frame(
  subj = rep(1:n_subj, each = n_time),
  time = rep(1:n_time, n_subj),
  age = rep(rnorm(n_subj, 50, 10), each = n_time)
)
df$treatment <- rep(rbinom(n_subj, 1, 0.5), each = n_time)

# 添加随机截距效应
subj_effect <- rep(rnorm(n_subj, 0, 2), each = n_time)
df$bp <- 120 + 2 * df$time - 0.3 * df$age + 
         5 * df$treatment + subj_effect + rnorm(nrow(df), 0, 3)

# 拟合随机截距模型
fit_lmer <- lmer(bp ~ time + age + treatment + (1 | subj), data = df)
summary(fit_lmer)
```

公式中的 (1 | subj) 表示按 subj 分组的随机截距。若想同时加入随机斜率，写成 (1 + time | subj)，允许每个患者的血压随时间变化的斜率不同。summary() 输出分为两部分：固定效应给出系数与 t 值（混合模型中 t 值的精确分布复杂，lme4 默认不输出 p 值），随机效应给出方差组分，包括组间方差与残差方差。

::: note
lme4 不输出 p 值是出于统计严谨性考虑：固定效应的精确自由度难以确定。若需要 p 值，可使用 lmerTest 包（在加载 lme4 之前加载，自动替换 summary 方法并基于 Satterthwaite 近似给出 p 值），或用 car::Anova() 进行 Wald 卡方检验。
:::

```r
# 使用 lmerTest 获取 p 值
library(lmerTest)
fit_lmer2 <- lmer(bp ~ time + age + treatment + (1 | subj), data = df)
summary(fit_lmer2)

# 随机斜率模型
fit_slope <- lmer(bp ~ time + age + treatment + (1 + time | subj), data = df)
summary(fit_slope)
```

随机斜率模型允许每个个体有自身的变化轨迹，更贴近真实生理过程。但模型复杂度增加可能导致收敛困难，需要权衡。比较两个模型可以用 anova() 进行似然比检验，判断随机斜率的引入是否显著提升拟合优度。

```r
# 似然比检验比较随机截距与随机斜率模型
anova(fit_lmer2, fit_slope)
```

似然比检验比较两个嵌套模型的拟合优度，零假设是简化模型（随机截距）足够好。p 值显著提示随机斜率带来的额外复杂度是值得的。需要注意的是，混合模型的似然比检验在边界条件下（方差组分是否为零）分布复杂，传统卡方检验保守，需要使用混合卡方分布或参数自助法获得更准确的 p 值。

混合模型除了估计固定效应，还能预测每个组的随机效应，这称为最佳线性无偏预测（Best Linear Unbiased Predictor，BLUP）。BLUP 把组级效应收缩向总体均值，避免少量观测的组给出极端估计，这种收缩特性让混合模型在小样本组上比固定效应模型更稳定。

```r
# 提取每个患者的随机效应（BLUP）
ranef(fit_lmer2)

# 提取组级截距（固定效应 + 随机效应）
coef(fit_lmer2)
```

ranef() 返回每个组偏离总体均值的量，coef() 返回每个组实际的截距与斜率。两者结合能同时刻画总体规律与个体差异，这是混合模型相对固定效应模型的核心优势。

广义线性混合模型（GLMM）处理非正态的嵌套数据，例如二分类重复测量。lme4 包中用 glmer() 函数，用法与 glm() 类似，只需额外指定随机效应项。

```r
# 模拟二分类重复测量结局
df$response <- rbinom(nrow(df), 1, 0.3 + 0.1 * df$treatment)

# 拟合逻辑混合模型
fit_glmer <- glmer(response ~ time + treatment + (1 | subj),
                   data = df, family = binomial)
summary(fit_glmer)
```

ICC 的计算公式在两层模型中为：组间方差 / (组间方差 + 组内方差)。可以用 sjstats::icc() 或 performance::icc() 直接计算。ICC 接近 0 说明组内相关性弱，普通回归即可；ICC 较大说明必须用混合模型，否则标准误估计偏低。

```r
# 计算 ICC
library(performance)
icc(fit_lmer2)
```

::: tip
混合效应模型的样本量评估需同时考虑组数与每组观测数。组数较少（少于 20）时，随机效应方差的估计不稳定。一般建议组数至少 20-30，每组观测数至少 5-10，才能获得可靠的随机效应估计。
:::

## 1.5.4 生存分析：时间到事件数据

生存分析处理的是时间到事件数据，研究重点是从某起点到事件发生的时间长度。这类数据有一个独特特征：删失。在研究结束时，部分受试者可能仍未发生事件，或者中途失访，他们的真实事件时间未知，只知道大于最后一次观察时间。直接删除删失观测会引入偏倚，把它们当作事件发生又会高估事件率。生存分析通过专门的方法处理这一信息缺失。

删失分为右删失、左删失与区间删失三种。右删失最常见，指只知道事件时间大于某值；左删失指只知道事件时间小于某值；区间删失指事件时间落在某区间内。本节聚焦右删失，因为它在医学随访中最普遍。

Kaplan-Meier 估计是非参数方法，用于估计生存函数 S(t)，即在时间 t 仍未发生事件的概率。它基于条件概率的乘积极限：每到一个事件时间点，把尚未发生事件的样本中事件发生的比例作为该时刻的死亡概率，剩余比例累乘得到 S(t)。生存曲线呈阶梯状下降，每个台阶对应一次事件发生，删失观测用竖线标记。

下面用 survival 包对卵巢癌数据集进行 Kaplan-Meier 估计并绘制生存曲线。

```r
library(survival)

# 查看内置卵巢癌数据
head(ovarian)

# 拟合 Kaplan-Meier 估计
km_fit <- survfit(Surv(futime, fustat) ~ rx, data = ovarian)

# 绘制生存曲线
plot(km_fit, col = c("blue", "red"), lwd = 2,
     xlab = "时间（天）", ylab = "生存概率",
     main = "卵巢癌患者 Kaplan-Meier 生存曲线")
legend("topright", c("治疗组 A", "治疗组 B"),
       col = c("blue", "red"), lwd = 2)
```

Surv(futime, fustat) 是生存数据的标准格式，第一个参数是随访时间，第二个参数是事件状态（1=事件发生，0=删失）。survfit() 拟合 KM 曲线，公式右侧的 rx 表示按治疗组分层绘制。曲线下方的样本数表会随时间递减，反映风险集变化。

中位生存时间是生存分析中最常报告的概括性统计量，定义为生存概率降至 0.5 对应的时间。survfit() 对象通过 summary() 或 print() 可直接输出中位生存时间及其置信区间。需要注意的是，若随访结束时生存概率仍高于 0.5，中位生存时间无法估计，这种情况下应报告特定时间点（如 1 年、5 年）的生存率。

```r
# 提取中位生存时间与置信区间
print(km_fit)

# 提取特定时间点的生存概率
summary(km_fit, times = c(100, 200, 365))
```

两组生存曲线的差异可以用 log-rank 检验，survdiff() 函数实现。log-rank 检验的零假设是两组生存曲线无差异，p 值小于 0.05 提示两组生存时间有统计学差异。该方法在事件数较少时检验效能有限，通常建议每组事件数不少于 10。

```r
# log-rank 检验比较两组生存曲线
survdiff(Surv(futime, fustat) ~ rx, data = ovarian)
```

::: note
log-rank 检验对应的是 Wilcoxon 检验的扩展，对组间差异在整条曲线上等权敏感。若早期差异更大，可用 Wilcoxon（rho=1）；若晚期差异更受关注，可用 Peto-Peto 检验。survdiff() 通过 rho 参数切换检验类型。
:::

Cox 比例风险模型是生存分析的回归版本，允许在模型中纳入多个协变量。模型形式为 h(t|X) = h0(t) · exp(β1·X1 + ... + βp·Xp)，其中 h(t) 是风险函数，h0(t) 是基线风险。比例风险假设指任意两个个体的风险比恒定，不随时间变化。系数 β 解释为：X 每增加一个单位，风险比 HR = exp(β) 变为原来的 exp(β) 倍。

```r
# 拟合 Cox 比例风险模型
cox_fit <- coxph(Surv(futime, fustat) ~ age + ecog.ps + rx, data = ovarian)
summary(cox_fit)

# 风险比与置信区间
exp(coef(cox_fit))
exp(confint(cox_fit))
```

summary() 输出中 coef 是回归系数，exp(coef) 即风险比 HR。HR 大于 1 表示该因素增加事件风险（即缩短生存时间），小于 1 表示保护性因素。HR=2 意味着该变量每增加一个单位，事件发生风险翻倍；HR=0.5 意味着风险减半。Cox 模型的优势在于不需要指定基线风险的具体形式，半参数特性使其适用范围广。

Cox 模型的样本量评估遵循 events per variable（EPV）原则：每个候选自变量至少需要 10-15 个事件。这一经验法则源于模拟研究，违反时系数估计不稳定，置信区间过宽。与逻辑回归类似，Cox 模型更关心事件数而非总样本量，大量删失观测虽提供部分信息，但无法替代事件数对统计效力的贡献。

```r
# 查看事件数与删失数
table(ovarian$fustat)

# Cox 模型的 concordance 指数（C 指数）
cox_fit$concordance
```

C 指数是 Cox 模型的预测能力指标，含义类似 AUC，表示随机抽出一对个体时模型正确预测风险排序的概率。C 指数 0.5 表示无判别能力，0.7-0.8 为良好，0.8 以上为优秀。临床预测模型通常要求 C 指数至少达到 0.7 才有应用价值。

::: warning
Cox 模型的比例风险假设需要检验。可以用 cox.zph() 函数进行 Schoenfeld 残差检验，若某协变量的 p 值小于 0.05，提示该变量风险不随时间恒定，需要分层分析（strata()）或引入时变协变量。
:::

```r
# 检验比例风险假设
cox.zph(cox_fit)

# 绘制 Schoenfeld 残差图
plot(cox.zph(cox_fit))
```

若比例风险假设违反，可以改用分层 Cox 模型（对违反假设的变量分层）或时间依赖协变量。竞争风险模型处理多种事件类型（如死亡原因有多种），需要用 cmprsk 包或 survival 包的 finegray() 函数实现，超出本节范围。

## 1.5.5 正则化回归：岭回归与 LASSO

当自变量数量接近或超过样本量，或者自变量之间存在高度共线性时，普通最小二乘估计会变得极不稳定，系数方差爆炸，甚至无法求逆。正则化通过在损失函数中加入对系数大小的惩罚项，换取估计的稳定性，代价是引入少量偏差。这种偏差-方差权衡是机器学习的核心思想：在训练集上稍差的拟合，可能在测试集上表现更好。

岭回归（Ridge Regression）使用 L2 正则化，损失函数加上 λ·Σβ²。L2 惩罚让所有系数向零收缩，但不会变成零，因此保留所有变量，适合变量间高度共线性场景。LASSO（Least Absolute Shrinkage and Selection Operator）使用 L1 正则化，损失函数加上 λ·Σ|β|。L1 惩罚的特性使部分系数直接收缩为零，从而实现变量选择，更适合追求稀疏模型与可解释性的场景。

二者的几何差异可以这样理解：L2 约束区域是球形，等高线与球相切通常不在坐标轴上，因此系数收缩但不为零；L1 约束区域是菱形，等高线与菱形顶点相切的概率更高，因此部分系数正好为零。

glmnet 包是 R 中实现正则化回归的标准工具，同时支持岭回归、LASSO 与弹性网络。弹性网络（Elastic Net）结合 L1 与 L2 惩罚，参数 α 控制二者比例：α=0 为纯岭回归，α=1 为纯 LASSO，0 到 1 之间为弹性网络。

下面用模拟数据演示 glmnet 的用法。

```r
library(glmnet)

# 模拟高维数据：100 样本，50 变量，仅 5 个真实相关
set.seed(2024)
n <- 100
p <- 50
X <- matrix(rnorm(n * p), n, p)
true_beta <- c(rep(2, 5), rep(0, p - 5))
y <- X %*% true_beta + rnorm(n, 0, 1)

# 拟合 LASSO（alpha = 1）
lasso_fit <- glmnet(X, y, alpha = 1)

# 查看不同 lambda 下的系数路径
plot(lasso_fit, xvar = "lambda", label = TRUE)
```

glmnet 默认对变量标准化，避免量纲影响惩罚强度。lambda 是正则化强度参数，lambda 越大惩罚越强，系数越接近零。系数路径图展示每个变量系数随 lambda 变化的轨迹，可以看到 LASSO 让部分系数在较大 lambda 时已收缩为零，模型逐渐简化。

理解系数路径的读取方式很重要：图的横轴是 log(lambda)（从右往左 lambda 递减），纵轴是系数值。每条曲线代表一个变量，曲线何时降到零表示该变量何时被剔除。lambda 很大时所有系数为零；lambda 适中时只有少数强相关变量进入模型；lambda 很小时所有变量都保留，趋近普通最小二乘解。

正则化参数 lambda 必须通过交叉验证选择，避免主观决定。cv.glmnet() 实现 K 折交叉验证，自动绘制 MSE 与 lambda 关系图。

```r
# 10 折交叉验证选择 lambda
cv_fit <- cv.glmnet(X, y, alpha = 1, nfolds = 10)

# 绘制 CV 曲线
plot(cv_fit)

# 最优 lambda
cv_fit$lambda.min   # MSE 最小的 lambda
cv_fit$lambda.1se   # 最简模型的 lambda（一倍标准误准则）

# 提取最优模型的系数
coef(cv_fit, s = "lambda.1se")
```

lambda.min 给出交叉验证误差最小的 lambda，lambda.1se 给出误差在一倍标准误范围内最简的 lambda。后者倾向于更稀疏的模型，更适合变量选择场景。在实际应用中，两个值都可以尝试，结合领域知识选择。

::: tip
lambda.1se 与 lambda.min 之间的取舍体现了模型复杂度与预测精度的平衡。若更看重泛化能力与简洁性，选 lambda.1se；若更看重训练集拟合，选 lambda.min。样本量较小时，lambda.1se 通常更稳健。
:::

变量标准化在正则化回归中至关重要。L1 与 L2 惩罚对所有系数一视同仁，若变量量纲不同（如身高以厘米计、体重以千克计），量纲大的变量系数自然小，受惩罚反而轻，导致正则化效果失真。glmnet 默认标准化变量，但返回的系数是原始尺度的，便于解读。手动标准化时需用训练集均值与标准差变换测试集，避免数据泄露。

```r
# 手动标准化（用于理解原理）
X_scaled <- scale(X)
cv_fit_scaled <- cv.glmnet(X_scaled, y, alpha = 1, nfolds = 10)
# glmnet 默认 standardize = TRUE，通常无需手动标准化
```

岭回归只需把 alpha 设为 0，处理共线性场景效果优于 LASSO。

```r
# 岭回归
ridge_fit <- cv.glmnet(X, y, alpha = 0, nfolds = 10)
coef(ridge_fit, s = "lambda.min")
```

弹性网络通过调整 α 在岭回归与 LASSO 之间取得平衡，适合变量间存在强相关群组的场景（如基因组数据中的连锁不平衡区段）。α 的选择同样需要交叉验证，但计算成本较高，实践中常对几个候选值（如 0.1、0.5、0.9）分别验证。

```r
# 弹性网络：alpha = 0.5
enet_fit <- cv.glmnet(X, y, alpha = 0.5, nfolds = 10)
coef(enet_fit, s = "lambda.min")
```

::: note
glmnet 接受矩阵形式的 X，不接受数据框。若数据中有因子变量，需先用 model.matrix() 转换为虚拟变量矩阵。对于分类结局，glmnet 通过 family 参数支持逻辑回归（family="binomial"）与多项回归（family="multinomial"），正则化思想完全一致。
:::

Python 中正则化回归主要用 scikit-learn 实现。scikit-learn 用 alpha 表示正则化强度（与 R 的 lambda 含义相同，但参数命名不同）。

```python
from sklearn.linear_model import LassoCV, RidgeCV, ElasticNetCV
import numpy as np

# 交叉验证选择 LASSO 的 alpha
lasso = LassoCV(cv=10).fit(X, y)
print("最优 alpha:", lasso.alpha_)
print("系数:", lasso.coef_)

# 弹性网络
enet = ElasticNetCV(l1_ratio=[0.1, 0.5, 0.9], cv=10).fit(X, y)
print("最优 l1_ratio:", enet.l1_ratio_)
```

## 1.5.6 模型选择与诊断

建模过程中一个反复出现的问题是：应该把哪些变量放进模型？变量太少会遗漏重要解释因素，变量太多会增加过拟合风险并降低可解释性。模型选择的目标是在拟合优度与模型复杂度之间找到平衡，避免单纯追求 R 方最大化。R 方在加入任何变量时都不会下降，因此不能作为模型选择的唯一标准。

信息准则提供了一种统一的权衡框架。AIC（Akaike Information Criterion）公式为 -2·logL + 2·k，BIC（Bayesian Information Criterion）公式为 -2·logL + log(n)·k，其中 logL 是对数似然，k 是参数个数，n 是样本量。两者都对复杂模型施加惩罚，BIC 的惩罚项随样本量增大而更重，因此 BIC 倾向选择更简单的模型。AIC 在预测导向场景中更常用，BIC 在大样本下倾向于选择真实模型。

```r
# 比较两个嵌套模型的 AIC 与 BIC
fit1 <- lm(mpg ~ wt, data = mtcars)
fit2 <- lm(mpg ~ wt + hp + cyl, data = mtcars)

AIC(fit1, fit2)
BIC(fit1, fit2)
```

AIC 与 BIC 数值越小越好。比较时必须保证模型基于同一数据集（缺失值处理一致），否则比较无意义。需要注意的是，AIC/BIC 只在模型间比较时有意义，绝对数值无解读价值。当样本量很大时，BIC 与 AIC 的选择可能不一致，这时需要结合研究目的判断：预测用 AIC，解释用 BIC。

逐步回归是早期常用的自动变量选择方法，包括向前选择、向后剔除与双向逐步。但逐步回归在每次决策时只看局部最优，且多次检验导致 p 值不可靠，现代统计实践不推荐使用。更好的做法是基于领域知识预选变量，再用信息准则或交叉验证做最终决策。

交叉验证是另一种模型选择思路，通过数据本身评估泛化能力。K 折交叉验证把数据等分为 K 份，每次用 K-1 份训练、1 份测试，循环 K 次得到平均误差。这种方法直接估计模型在新数据上的表现，比信息准则更接近实际预测场景。

```r
# 简单实现 10 折交叉验证的 MSE
set.seed(2024)
folds <- sample(rep(1:10, length.out = nrow(mtcars)))
mse <- numeric(10)
for (k in 1:10) {
  train <- mtcars[folds != k, ]
  test  <- mtcars[folds == k, ]
  fit <- lm(mpg ~ wt + hp, data = train)
  pred <- predict(fit, newdata = test)
  mse[k] <- mean((test$mpg - pred)^2)
}
mean(mse)
```

手动实现交叉验证有助于理解原理，实际应用中可以用 caret 或 tidymodels 框架简化流程。交叉验证的折数选择需权衡计算成本与估计稳定性，10 折是常见折中方案。留一交叉验证（LOOCV）是 K 等于样本量的极端情况，估计偏差小但方差大，计算成本高。

重复 K 折交叉验证（repeated K-fold CV）通过对同一折数多次重复取平均，进一步降低估计方差。bootstrap 是另一种重抽样方法，通过有放回抽样生成多个训练集，能同时给出参数估计的置信区间。bootstrap 的优势是不依赖分布假设，适合小样本或非正态场景。

```r
# bootstrap 估计系数的标准误
library(boot)
boot_coef <- function(data, indices) {
  fit <- lm(mpg ~ wt + hp, data = data[indices, ])
  return(coef(fit))
}
boot_results <- boot(mtcars, boot_coef, R = 1000)
boot_results
boot.ci(boot_results, type = "perc", index = 2)  # wt 系数的置信区间
```

bootstrap 的核心思想是把样本视为总体的替代，通过重抽样模拟总体抽样过程。R=1000 表示重抽样 1000 次，每次得到一组系数估计，最终用这些估计的分布推断标准误与置信区间。percentile 法直接取分位数，更适合非对称分布；BCa 法更精确但计算成本高。

残差诊断是模型验证的必备环节。除前文提到的四张诊断图外，还需要检查多重共线性。方差膨胀因子（Variance Inflation Factor，VIF）衡量自变量间共线性程度，VIF 大于 5 通常提示存在显著共线性，大于 10 提示严重共线性。

```r
# 计算 VIF
library(car)
fit_full <- lm(mpg ~ wt + hp + disp + cyl, data = mtcars)
vif(fit_full)
```

VIF 的几何含义是：该变量与其他自变量回归得到的 R 方对应的容忍度的倒数，即 VIF = 1/(1-R²)。高 VIF 意味着该变量可由其他自变量线性组合近似表示，系数估计不稳定，标准误膨胀。处理方法包括删除冗余变量、合并相似变量、改用岭回归或主成分回归。

Cook 距离衡量单个观测对模型拟合的整体影响。删除某观测后系数变化越大，Cook 距离越大。一般以 4/(n-p-1) 作为参考阈值，超过此值的观测需要仔细检查。

```r
# 计算 Cook 距离并绘图
plot(fit_full, which = 4, 
     cook.levels = 4/(nrow(mtcars) - length(coef(fit_full)) + 1))
abline(h = 4/(nrow(mtcars) - length(coef(fit_full)) + 1), 
       col = "red", lty = 2)
```

::: note
影响点不一定就是异常值，它只是对系数估计影响大的观测。处理影响点时需要结合领域知识判断：如果是数据录入错误，应修正或删除；如果是真实但极端的观测，应保留并在报告中讨论其对结论的影响。盲目删除高 Cook 距离的观测会让结论失去代表性。
:::

正态性检验可以用 shapiro.test() 对残差进行，但大样本下该检验过于敏感，轻微偏离正态也会拒绝零假设。可视化方法（Q-Q 图）通常更实用，关注主体点是否在对角线上而非尾部细节。异方差检验用 car::ncvTest() 或 lmtest::bptest()，若存在异方差可考虑稳健标准误（sandwich 包）或对因变量做对数变换。

```r
# 残差正态性检验
shapiro.test(resid(fit_full))

# 异方差检验（Breusch-Pagan）
library(lmtest)
bptest(fit_full)

# 稳健标准误
library(sandwich)
library(lmtest)
coeftest(fit_full, vcov = vcovHC(fit_full, type = "HC1"))
```

自相关检验（Durbin-Watson）用于时间序列或空间数据，检验残差是否存在一阶自相关。检验统计量取值在 0 到 4 之间，2 表示无自相关，小于 2 正自相关，大于 2 负自相关。

```r
# 自相关检验
dwtest(fit_full)
```

完整的模型诊断流程应当成为建模的标配，而不只是事后补救。一个未经诊断的模型，其结论的可信度无法评估，所有漂亮的 p 值与 R 方都失去意义。

分类模型的评估需要一套与回归不同的指标。准确率看似直观但在不平衡数据上会误导：若 95% 的样本为阴性，全部预测为阴性可获得 95% 准确率，但模型毫无判别能力。更可靠的指标是敏感度（真阳性率）、特异度（真阴性率）与它们的平衡，以及综合指标 AUC。

```r
# 逻辑回归的预测性能评估
library(caret)
pred_class <- ifelse(pred_prob > 0.5, 1, 0)
confusionMatrix(factor(pred_class), factor(mtcars$mpg_high),
                positive = "1")
```

混淆矩阵给出敏感度、特异度、阳性预测值、阴性预测值等指标。阈值的选择影响这些指标的取值：阈值降低则敏感度上升特异度下降，反之亦然。ROC 曲线把所有阈值下的敏感度与（1-特异度）绘制成曲线，AUC 是曲线下面积，取值 0.5 到 1，反映模型整体判别能力。

::: tip
建模流程的推荐顺序：先检查数据质量与分布特征，再根据结局类型选择模型族（连续用 lm，二分类用 logistic，计数用 poisson，时间到事件用 Cox），然后通过交叉验证或信息准则选择变量，最后做完整的残差诊断。这一顺序能避免在错误模型上浪费精力。
:::

校准度是分类模型评估的另一维度，反映预测概率与实际事件率是否一致。一个判别力好但校准差的模型可能高估或低估风险，在临床决策中造成误导。校准曲线通过把预测概率分箱后比较预测均值与实际发生率绘制，理想模型应贴近对角线。Hosmer-Lemeshow 检验是传统的校准检验，但大样本下过于敏感，可视化方法更实用。

```r
# 校准曲线（用 rms 包）
library(rms)
dd <- datadist(mtcars)
options(datadist = "dd")
fit_cal <- lrm(mpg_high ~ wt + hp, data = mtcars)
cal <- calibrate(fit_cal, method = "boot", B = 1000)
plot(cal)
```

判别度（AUC）与校准度（校准曲线）从两个互补角度评估模型，二者都达标才算可用的预测模型。许多研究只报告 AUC 而忽略校准，这是不完整的评估。

## 本节小结

本节从线性回归的几何直觉出发，逐步扩展到广义线性模型、混合效应模型、生存分析与正则化回归，最后回到模型选择与诊断这一通用问题。每个模型背后都有明确的假设与适用场景，理解这些假设比记住函数用法更重要。模型选择的目标是在偏差与方差、拟合与泛化之间寻找平衡，而非追求 R 方最大化。诊断是建模不可省略的一环，只有经过检验的模型才能产出可信的结论。

## 练习题

### 第1题 线性回归系数解读

用 R 内置的 `mtcars` 数据集拟合 `lm(mpg ~ wt + hp, data = mtcars)`,解释 `wt` 与 `hp` 系数的含义,并说明在多元回归中为何不能单独解读 `wt` 系数。

::: details 参考答案

```r
fit <- lm(mpg ~ wt + hp, data = mtcars)
summary(fit)
```

`wt` 系数表示在控制 `hp`(马力)不变时,车重每增加 1000 磅,`mpg` 平均变化的量。`hp` 系数表示在控制 `wt` 不变时,马力每增加 1 单位,`mpg` 平均变化的量。

多元回归中系数的解释带有控制其他变量不变的前提。这是通过正交化实现的:用其他自变量解释当前变量后,剩余部分对因变量的效应。因此单独看 `wt` 系数忽略了 `hp` 的影响,与一元回归系数含义不同。
:::

### 第2题 逻辑回归与预测

用 `mtcars` 数据构造二分类变量 `mpg_high <- ifelse(mtcars$mpg > 20, 1, 0)`,拟合逻辑回归 `glm(mpg_high ~ wt + hp, data = mtcars, family = binomial)`,预测车重为 3 千磅、马力为 110 时 `mpg_high = 1` 的概率。

::: details 参考答案

```r
mtcars$mpg_high <- ifelse(mtcars$mpg > 20, 1, 0)

fit_logit <- glm(mpg_high ~ wt + hp, data = mtcars, family = binomial)
summary(fit_logit)

# 预测新样本
new_data <- data.frame(wt = 3, hp = 110)
pred_prob <- predict(fit_logit, newdata = new_data, type = "response")
pred_prob
```

`family = binomial` 指定逻辑回归。`predict()` 的 `type = "response"` 直接返回概率值,而非线性预测值(link scale)。若不加 `type = "response"`,返回的是 logit 变换前的线性组合,需要手动用 `plogis()` 转换才能得到概率。
:::

### 第3题 模型比较

用 `mtcars` 拟合两个模型:`fit1 <- lm(mpg ~ wt, data = mtcars)` 与 `fit2 <- lm(mpg ~ wt + hp + cyl, data = mtcars)`,用 AIC 与 BIC 比较两者,说明哪个模型更优。

::: details 参考答案

```r
fit1 <- lm(mpg ~ wt, data = mtcars)
fit2 <- lm(mpg ~ wt + hp + cyl, data = mtcars)

AIC(fit1, fit2)
BIC(fit1, fit2)
```

AIC 与 BIC 数值越小越好。两个指标可能给出不同结论:AIC 偏向预测精度,倾向于保留更多变量;BIC 惩罚更重,倾向于更简单的模型。比较时必须保证两个模型基于同一数据集,否则结果无意义。若 AIC 与 BIC 选择一致,结论较明确;若不一致,需结合研究目的判断:预测导向选 AIC 较小的模型,解释导向选 BIC 较小的模型。
:::

## 常见错误

**错误 1 · 因子参照水平不符合研究意图**

原因:`lm()` 把因子的第一个水平作为参照组,系数表示其他水平与参照组的差异。若数据中因子水平顺序不符合研究语境(如把治疗组作为参照而想看对照组的差异),系数解释会反向。

解决:用 `relevel(factor_var, ref = "对照组")` 显式设置参照水平。或在构建因子时用 `factor(x, levels = c("对照", "处理"))` 指定水平顺序。报告结果时明确标注参照组。

**错误 2 · `predict()` 报错 `newdata` 列名不匹配**

原因:`predict(fit, newdata = new_df)` 要求 `new_df` 的列名与模型公式中的自变量名完全一致。若列名拼写不同或缺失某个自变量,会报错或得到 NA。

解决:检查 `new_df` 的列名,确保与 `names(fit$coefficients)` 对应。若模型用了 `log(x)`,新数据中也要有原始列 `x`,不能预先做对数变换再传入,因为公式中的变换在预测时会自动执行。

**错误 3 · 多重共线性导致系数不稳定**

原因:自变量间高度相关时,`lm()` 的系数估计方差膨胀,标准误变大,p 值不显著,但模型整体 R 方可能很高。典型表现是单独放入某变量时显著,同时放入多个相关变量时都不显著。

解决:用 `car::vif()` 计算方差膨胀因子,VIF 大于 5 提示显著共线性,大于 10 提示严重共线性。处理方法包括删除冗余变量、合并相似变量、改用岭回归或主成分回归。在组学数据中,变量间相关性普遍较高,正则化回归比普通最小二乘更合适。

**错误 4 · 交叉验证中的数据泄露**

原因:在交叉验证前对全部数据做标准化或特征选择,测试集的信息泄漏到训练集,导致交叉验证误差过于乐观。模型上线后实际表现远不如验证结果。

解决:预处理参数(均值、标准差、变量筛选)只能在训练折上估计,再应用到测试折。用 `caret` 或 `tidymodels` 的 recipe 机制可以自动管理这一流程,确保预处理在交叉验证循环内部进行。
