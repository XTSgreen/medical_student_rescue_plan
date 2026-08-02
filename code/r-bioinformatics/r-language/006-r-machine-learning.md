---
title: 1.6 机器学习
sidebar:
  order: 6
---
# 1.6 机器学习

机器学习已经渗透到生物医学研究的各个角落，从基因表达数据的样本分类、影像数据的病灶识别，到电子病历的表型挖掘，都能看到它的身影。本节以 R 为主语言，把机器学习的核心脉络压缩成一条主干：从问题定义、数据预处理、监督学习算法，到模型评估、超参数调优，再到无监督学习。每个关键概念都会附上可运行的 R 代码，并在适当时机给出 Python sklearn 的对照，方便跨语言协作。

医学研究的样本量通常不大、噪声却很高，机器学习流程中的任何一步疏忽都会被放大。本节强调工程纪律：训练集与测试集严格隔离、预处理在训练集上估计参数后应用到测试集、交叉验证用于模型选择而非最终评估。这些原则看起来繁琐，却是保证结论可重复的唯一路径。

::: note
本节代码依赖 caret、tidymodels、randomForest、ranger、xgboost、recipes、yardstick、pROC、Rtsne、umap、rpart 等包。运行前请用 install.packages() 安装。
:::

## 1.6.1 机器学习的问题分类

机器学习的本质是函数逼近。给定一组观测数据 $\{(x_i, y_i)\}_{i=1}^{n}$，希望学到一个映射 $\hat{f}$，使它在未见数据上的表现接近真实生成函数 $f$。Tom Mitchell 给出的经典定义是：如果计算机程序在任务 T 上的性能 P 随经验 E 的积累而改善，就说它从经验 E 中学习。这个定义把任务、性能、经验三个要素抽象出来，至今仍是机器学习的概念骨架。

根据标签是否存在、标签是离散还是连续，问题被划分成不同范式，对应的算法、评估指标和工程实践也不同。**监督学习与无监督学习的分野**在于训练数据是否带标签。监督学习把 $(x, y)$ 配对喂给模型，目标是学到 $x \to y$ 的映射，常见子类是分类（$y$ 离散）和回归（$y$ 连续）。无监督学习只有 $x$，目标是发现数据的内在结构，例如聚类把相似样本归组、降维把高维数据投影到低维空间。半监督学习介于两者之间，少量样本有标签、大量样本无标签，在医学影像标注成本高的场景中很常见。

分类与回归的差别看似只是标签类型，但它决定了评估指标和决策边界的形式。分类用混淆矩阵、准确率、ROC 这套语言，回归用 MSE、MAE、$R^2$ 这套语言。把回归问题强行离散化做分类，或把分类问题当回归处理，都会引入偏差。医学场景中一个常见错误是把生存时间直接分类成是否死亡，而忽略删失数据，应该用专门的生存分析模型。

R 的机器学习生态主要有三套框架。caret 是老牌框架，API 统一、文档完善，适合教学和快速原型。tidymodels 是 RStudio 主推的现代框架，基于整洁模型理念，与 dplyr、ggplot2 风格一致，适合工程化项目。mlr3 是性能导向的框架，支持并行和大规模实验，适合严肃的模型对比研究。本节代码以 caret 和 tidymodels 为主，新项目建议优先选 tidymodels。

::: tip
新项目优先选 tidymodels，它与 tidyverse 生态无缝衔接，长期维护更友好。维护老代码或跟随教程时再用 caret。两套框架的核心思路一致，迁移成本不高。
:::

训练集与测试集的划分是机器学习工程化的第一道防线。训练集用来拟合模型，测试集只在最终评估时用一次，两者必须严格隔离。常见的比例是 7:3 或 8:2，但更重要的原则是分布一致。当类别不平衡时，要用分层抽样保证训练集和测试集中正负样本比例一致。在医学数据中，罕见病样本往往只有几十例，随机切分可能让测试集中完全没有某类样本，导致评估失败。

下面的代码用 caret 完成分层抽样划分，把 iris 数据集拆成 70% 训练集和 30% 测试集。

```r
library(caret)
set.seed(42)
train_idx <- createDataPartition(iris$Species, p = 0.7, list = FALSE)
train_set <- iris[train_idx, ]
test_set  <- iris[-train_idx, ]
table(train_set$Species)
table(test_set$Species)
```

createDataPartition 默认做分层抽样，会保持原始数据中各类别比例。如果直接用 sample() 随机切分，小类样本可能全部进入某一侧，导致评估失真。tidymodels 的 initial_split() 提供了等价接口，参数 strata 指定分层变量。

```r
library(rsample)
set.seed(42)
split <- initial_split(iris, prop = 0.7, strata = Species)
train_set <- training(split)
test_set  <- testing(split)
```

过拟合与欠拟合是模型复杂度问题的两个极端。过拟合的模型把训练数据中的噪声也学进去了，表现为训练集误差极低、测试集误差显著上升；欠拟合的模型连训练数据中的主要规律都没学到，训练集和测试集误差都高。对应的统计原理是偏差-方差权衡：模型复杂度低时偏差高、方差低，复杂度高时偏差低、方差高，总误差呈 U 形曲线。集成学习中的随机森林通过平均多棵树降低方差，梯度提升通过逐步修正残差降低偏差，是两类不同的应对策略。

判断过拟合的方法是对比训练集和验证集的误差曲线。如果训练集误差持续下降而验证集误差开始上升，就是过拟合的信号，应该早停、加正则化或减少模型复杂度。caret 和 tidymodels 在交叉验证时都会输出这条曲线，便于诊断。

下面的代码用 caret 演示学习曲线的绘制思路：随着训练样本量增加，训练集和验证集误差如何变化。学习曲线是诊断过拟合与欠拟合的可视化工具。

```r
library(caret)
set.seed(42)
ctrl <- trainControl(method = "cv", number = 10)

# 用不同训练样本比例拟合模型，观察学习曲线
sizes <- seq(0.2, 1.0, by = 0.1)
train_err <- numeric(length(sizes))
val_err   <- numeric(length(sizes))

for (i in seq_along(sizes)) {
  n_train <- floor(sizes[i] * nrow(iris))
  idx <- sample(seq_len(nrow(iris)), n_train)
  sub_train <- iris[idx, ]
  fit <- train(Species ~ ., data = sub_train, method = "rf",
               trControl = ctrl, tuneLength = 3)
  train_err[i] <- 1 - max(fit$results$Accuracy)
  val_err[i]   <- 1 - fit$results$Accuracy[which.max(fit$results$Accuracy)]
}

plot(sizes * nrow(iris), train_err, type = "b", pch = 19, col = "red",
     xlab = "Training Size", ylab = "Error",
     ylim = range(c(train_err, val_err)))
lines(sizes * nrow(iris), val_err, type = "b", pch = 19, col = "blue")
legend("topright", legend = c("Train", "Validation"),
       col = c("red", "blue"), lty = 1)
```

如果两条曲线在样本量增大时仍然差距明显，说明模型高方差、过拟合，增加数据通常有帮助。如果两条曲线都收敛到较高的误差水平，说明模型高偏差、欠拟合，需要换更复杂的模型或加入更多特征。这种诊断能直接指向改进方向，比盲目调参有效得多。

::: note
半监督学习在医学影像标注成本高的场景中越来越重要。它的思路是用少量标注数据训练初步模型，再用模型对未标注数据打伪标签，筛选高置信度的伪标签加入训练集。强化学习在临床试验的个性化治疗方案设计中也有应用，但本节不展开，建议参考专题资料。
:::

## 1.6.2 特征工程与数据预处理

原始数据几乎从不能直接喂给模型。特征工程的核心任务是把数据整理成算法能消化的形式，同时尽量保留与目标相关的信号。这一步的功夫决定了模型的上限，算法只是逼近这个上限的工具。在医学数据中，特征工程还包括缺失值处理、单位统一、异常值识别等数据质量工作，这些工作的质量直接决定后续分析是否可靠。

缺失值填充是第一步。R 中常见的策略是用中位数填充数值变量、用众数填充类别变量，更精细的做法是按组分组建模预测缺失值。选择策略时要看缺失机制：完全随机缺失（MCAR）下简单填充即可，随机缺失（MAR）需要用其他变量辅助预测，非随机缺失（MNAR）则任何填充都有偏。医学数据中的缺失常常是 MAR，例如重症患者的某些指标更可能未测，这时用简单的中位数填充会引入偏差。

标准化和归一化把不同量纲的特征拉到同一尺度，对 KNN、SVM、神经网络这类依赖距离或梯度的算法至关重要。Z-score 标准化把数据变换成均值 0、标准差 1 的分布，公式为 $z = (x - \mu) / \sigma$，适合大致正态的数据。Min-Max 归一化把数据压缩到 [0, 1] 区间，公式为 $x' = (x - \min) / (\max - \min)$，适合已知边界的特征，如年龄、BMI。Robust 缩放用中位数和四分位距，公式为 $x' = (x - \text{median}) / \text{IQR}$，对异常值稳健，适合医学检验指标这种长尾分布的数据。

下面用 R 手工实现三种缩放方法并对比效果，帮助直观理解它们的差异。

```r
# 生成带异常值的数据
set.seed(42)
x <- c(rnorm(100, mean = 50, sd = 10), 200)  # 最后一个是异常值

# Z-score 标准化
z_score <- (x - mean(x)) / sd(x)

# Min-Max 归一化
min_max <- (x - min(x)) / (max(x) - min(x))

# Robust 缩放
robust <- (x - median(x)) / IQR(x)

# 对比：异常值在三种缩放下的相对位置
tail(data.frame(original = x, z_score, min_max, robust), 3)
```

从输出可以看到，异常值 200 在 Z-score 下被映射到约 5，在 Min-Max 下被映射到 1（其他点都被压缩到 0.7 以下），在 Robust 下被映射到约 8。Min-Max 最受异常值影响，Robust 缩放保留了原始数据的主体形状。决策树和随机森林对量纲不敏感，但统一缩放不会有害。

类别变量编码是把字符串或因子转成数值的过程。one-hot 编码适合无序类别，会为每个水平生成一个 0/1 列，但水平数过多时会导致维度爆炸。label encoding 适合有序类别（如低、中、高），用一个整数表示。目标编码（target encoding）用每个类别对应的目标变量均值代替原值，适合高基数类别，但要小心目标泄漏，必须在交叉验证内部计算编码值。

recipes 包是 tidymodels 生态的预处理流水线工具。它把所有预处理步骤声明为一个配方，再统一 bake 到训练集和测试集，避免手工操作造成的训练-测试集不一致。下面这段代码展示了典型的预处理流水线。

```r
library(recipes)
library(modeldata)
data(penguins)

# 构建预处理配方
rec <- recipe(sex ~ ., data = penguins) %>%
  step_impute_median(all_numeric()) %>%              # 数值变量用中位数填充
  step_impute_mode(all_nominal(), -sex) %>%          # 类别变量用众数填充
  step_dummy(all_nominal(), -sex, one_hot = TRUE) %>% # one-hot 编码
  step_normalize(all_numeric())                      # Z-score 标准化

# 在训练集上 prepare，应用到训练集和测试集
rec_prep <- prep(rec, training = penguins)
train_baked <- bake(rec_prep, new_data = NULL)
# test_baked <- bake(rec_prep, new_data = test_set)
```

step_* 系列函数各司其职：step_impute_* 填充缺失值，step_dummy 做 one-hot，step_normalize 做 Z-score 标准化。prep() 在训练集上估计参数（如均值、标准差、众数），bake() 把参数应用到任意数据上。new_data = NULL 表示应用到训练集本身。这种训练-应用分离的设计，能严格防止测试集信息泄漏到训练流程。

::: warning
对测试集做标准化时，必须用训练集估计的均值和标准差。如果对整体数据先标准化再切分，测试集的统计量就被混入训练阶段，导致泛化能力被高估。这是新手最常犯的错误之一，却很难从结果上看出来。
:::

下面是 Python sklearn 的对照实现，便于跨语言协作时对照思路。sklearn 的 ColumnTransformer 和 Pipeline 与 recipes 的设计理念相似，都是把预处理与模型串成一条不可拆分的流水线。

```python
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline

# 数值列与类别列分开处理
numeric_features = ["bill_length_mm", "bill_depth_mm", "flipper_length_mm"]
categorical_features = ["species", "island"]

preprocessor = ColumnTransformer([
    ("num", Pipeline([("imputer", SimpleImputer(strategy="median")),
                      ("scaler", StandardScaler())]), numeric_features),
    ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")),
                      ("onehot", OneHotEncoder())]), categorical_features),
])
```

特征选择是预处理的高阶环节，目的是剔除与目标无关或冗余的特征，提高模型泛化性、降低计算成本。三类方法各有适用场景：过滤法用统计量（方差阈值、相关系数、卡方检验）独立评估每个特征，速度快但忽略特征间交互；包装法（如递归特征消除 RFE）把特征选择嵌入模型训练过程，效果更好但计算贵；嵌入法（如 LASSO、树模型特征重要性）让模型自己在训练中选择特征，是兼顾效率和效果的折中。下面用 caret 的 rfe 函数做递归特征消除。

```r
library(caret)
set.seed(42)
ctrl <- rfeControl(functions = rfFuncs, method = "cv", number = 10)
rfe_fit <- rfe(iris[, -5], iris$Species, sizes = 1:4, rfeControl = ctrl)
rfe_fit$optVariables
```

rfe 函数从全部特征出发，每轮剔除最不重要的若干特征，用交叉验证评估每个特征子集的性能，optVariables 返回最优子集。在基因表达数据这种 p >> n 的场景中，特征选择几乎是必做步骤。

## 1.6.3 监督学习：核心算法

监督学习的算法家族庞大，但医学研究中最常用的是 KNN、决策树、随机森林和梯度提升。理解每个算法的直觉比记住函数调用更重要，因为算法选择、调参和故障排查都依赖对原理的把握。这一节会用 R 代码演示每个算法，同时点出原理中的关键假设和典型陷阱。

**KNN（K-Nearest Neighbors）** 是最朴素的分类算法。它的核心思想是给定一个待预测样本，找训练集中距离它最近的 K 个邻居，用这 K 个邻居的多数标签作为预测。距离度量通常用欧氏距离，K 值通过交叉验证选择，过小会过拟合、过大会欠拟合。KNN 的假设是相近的样本倾向于属于同一类，这在特征空间中分布相对均匀时成立。它对量纲敏感，所以必须先做标准化；对高维数据效果差，因为高维空间中所有点之间的距离都趋于相近，这就是所谓的维度灾难。

下面是 KNN 的 R 实现示例，用 caret 统一接口训练并预测。caret 的 train() 是统一入口，preProcess 参数把预处理嵌入交叉验证流程，tuneGrid 指定 K 值搜索范围。

```r
library(caret)
set.seed(42)
ctrl <- trainControl(method = "cv", number = 10)
knn_fit <- train(Species ~ ., data = iris,
                 method = "knn",
                 preProcess = c("center", "scale"),
                 trControl = ctrl,
                 tuneGrid = data.frame(k = 1:15))
knn_fit$bestTune
confusionMatrix(predict(knn_fit, iris), iris$Species)
```

bestTune 返回交叉验证选出的最优 K。preProcess = c("center", "scale") 表示在每个交叉验证折内部单独做标准化，避免信息泄漏。这种细节是 caret 相对于手工流程的核心优势。

KNN 的距离度量除了欧氏距离，还可以用曼哈顿距离（$L_1$ 范数）、闵可夫斯基距离（参数化的 $L_p$ 范数）或余弦相似度。曼哈顿距离对异常值更稳健，适合高维稀疏数据；余弦相似度关注方向而非幅度，适合文本向量。caret 通过 metric 参数切换距离度量，kknn 包还支持加权 KNN，距离近的邻居投票权重更大。

下面是 Python sklearn 的 KNN 对照实现。sklearn 的 KNeighborsClassifier 接口与 caret 类似，但需要手动组合预处理与模型。

```python
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score

pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("knn", KNeighborsClassifier(n_neighbors=5)),
])

# 交叉验证
scores = cross_val_score(pipe, X, y, cv=10, scoring="accuracy")
print(f"CV accuracy: {scores.mean():.3f} ± {scores.mean():.3f}")
```

sklearn 的 Pipeline 把预处理和模型串成一条链，保证交叉验证时每折都重新估计预处理参数，与 caret 的 preProcess 行为一致。

**决策树（Decision Tree）** 通过递归切分特征空间构建一棵判别树。在每个内部节点，算法选择一个特征和一个切分点，使切分后子节点的纯度提升最大。常用的纯度指标是基尼系数和信息增益，前者计算更快，后者基于信息论。决策树会一直生长直到所有叶子节点纯度达到 100%，但这必然过拟合，所以需要剪枝。剪枝分预剪枝（限制 maxdepth、minsplit 等参数）和后剪枝（用复杂度参数 cp 修剪子树）两种。

决策树的最大优点是可解释性强，可以画出整棵树直观理解决策路径；最大缺点是容易过拟合，单棵树的泛化能力通常很差。把多棵树组合起来形成集成学习，是改善决策树的标准做法。

```r
library(rpart)
library(rpart.plot)
tree_fit <- rpart(Species ~ ., data = iris,
                  control = rpart.control(cp = 0.01, maxdepth = 4))
rpart.plot(tree_fit)
printcp(tree_fit)
```

cp 是复杂度参数，控制树的成长深度，cp 越小树越深。printcp() 输出不同 cp 下的交叉验证误差，用来选择最优剪枝点。一般选交叉验证误差最小的 cp，或采用 one-SE rule 选最简模型。one-SE rule 是在最优 cp 的 1 倍标准差范围内选最简单的模型，能进一步降低过拟合风险，是统计学中常用的稳健策略。

下面用 prune() 对决策树做后剪枝，展示从完全生长到剪枝的过程。

```r
# 先让树充分生长
full_tree <- rpart(Species ~ ., data = iris,
                   control = rpart.control(cp = 0, minsplit = 1))
# 选最优 cp
opt_cp <- full_tree$cptable[which.min(full_tree$cptable[, "xerror"]), "CP"]
# 剪枝
pruned_tree <- prune(full_tree, cp = opt_cp)
rpart.plot(pruned_tree)
```

充分生长的树会过拟合，剪枝后的树更简单但泛化更好。xerror 列是交叉验证误差，CP 列是对应的复杂度参数。剪枝的本质是用偏差换取方差，让模型更稳健。

**随机森林（Random Forest）** 是决策树的集成学习代表。它构建数百棵决策树，每棵树用 bootstrap 采样的训练子集和随机选择的特征子集，最后通过投票或平均得到预测。这种双重随机性降低了树之间的相关性，使整体方差大幅下降。随机森林几乎不需要调参就能给出不错的结果，对量纲不敏感，还能输出特征重要性，是医学研究的首选基线模型。

随机森林的偏差等于单棵树的偏差，方差通过平均降低。要让方差降低得明显，树之间的相关性必须低，所以 mtry（每次分裂时随机选择的特征数）不能太大。分类问题默认 mtry 取 $\sqrt{p}$，回归问题取 $p/3$。

```r
library(randomForest)
set.seed(42)
rf_fit <- randomForest(Species ~ ., data = iris, ntree = 500, mtry = 2,
                       importance = TRUE)
rf_fit
varImpPlot(rf_fit)
```

ntree 是树的数量，mtry 是每次分裂时随机选择的特征数。importance = TRUE 让模型额外计算特征重要性。varImpPlot() 画出特征重要性条形图，可以直观看出哪些变量对预测贡献最大。

随机森林有一个免费的内部验证机制：袋外误差（OOB error）。每棵树用 bootstrap 样本训练，约 37% 的样本不会被采到，这些样本可以用来测试这棵树。所有树的 OOB 预测汇总起来，相当于一次留一交叉验证，是评估随机森林泛化能力的便捷指标。

```r
# OOB 误差随树数变化
plot(rf_fit, main = "OOB Error vs Number of Trees")
legend("topright", legend = colnames(rf_fit$err.rate),
       lty = 1, col = 1:4)
```

rf_fit$err.rate 是一个矩阵，第一列是 OOB 误差，后续列是每个类别的误差。曲线平稳后的树数就是合适的 ntree 值，通常 200 到 500 棵树足够。

::: tip
特征重要性是随机森林的副产品，但要注意它对高基数类别变量有偏好。如果要更稳健的特征贡献度估计，可以用 SHAP 值或排列重要性。caret 的 varImp() 函数提供了排列重要性的统一接口。DALEX 和 iml 包可以与任何模型配合做更深入的解释性分析。
:::

**梯度提升（Gradient Boosting）** 是另一种集成思路。与随机森林并行建树不同，梯度提升串行建树，每棵新树拟合前一棵树的残差。这种逐步修正误差的策略使模型表现通常优于随机森林，但对超参数更敏感。学习率、树深度、迭代次数三者共同决定模型复杂度，需要配合早停策略避免过拟合。

XGBoost 是梯度提升的高效实现，支持正则化、缺失值处理和并行计算，是 Kaggle 竞赛的常胜工具。LightGBM 是同类替代，在速度和内存上更优，适合大规模数据。下面是 XGBoost 的 R 实现，XGBoost 接受矩阵输入，需要先把数据框转成 xgb.DMatrix。

```r
library(xgboost)
library(Matrix)

# 准备训练矩阵
train_matrix <- model.matrix(Species ~ . - 1, data = iris)
train_label <- as.numeric(iris$Species) - 1  # XGBoost 要求标签从 0 开始

dtrain <- xgb.DMatrix(data = train_matrix, label = train_label)

# 训练
set.seed(42)
xgb_fit <- xgboost(data = dtrain,
                   nrounds = 100,
                   max_depth = 4,
                   eta = 0.1,
                   objective = "multi:softmax",
                   num_class = 3,
                   verbose = 0)
importance_matrix <- xgb.importance(model = xgb_fit)
xgb.plot.importance(importance_matrix)
```

nrounds 是迭代次数，max_depth 是单棵树深度，eta 是学习率。三者共同决定模型复杂度，通常要配合早停策略避免过拟合。

下面用 xgb.cv() 寻找最佳迭代轮数。它会做 K 折交叉验证，输出每轮的训练误差和验证误差，便于判断在哪一轮停止。

```r
set.seed(42)
cv_fit <- xgb.cv(data = dtrain,
                 nrounds = 200,
                 max_depth = 4,
                 eta = 0.1,
                 objective = "multi:softmax",
                 num_class = 3,
                 nfold = 10,
                 early_stopping_rounds = 10,
                 verbose = 0)
cv_fit$best_iteration
cv_fit$evaluation_log[cv_fit$best_iteration, ]
```

early_stopping_rounds = 10 表示如果验证误差连续 10 轮没有改善就停止。best_iteration 返回最优轮数，可以直接用于训练最终模型。这种基于验证集的早停策略比手工指定 nrounds 更稳健。

::: warning
XGBoost 默认不进行交叉验证，nrounds 过大会直接过拟合。建议用 xgb.cv() 找到最佳迭代轮数，再用早停参数 early_stopping_rounds 训练。在医学小样本场景下，XGBoost 的过拟合风险比随机森林更高，要谨慎调参。subsample 和 colsample_bytree 两参数控制每棵树看到的数据和特征比例，调低可以增加随机性、降低过拟合。
:::

四种算法的适用场景可以用一张表快速对照。选择基线模型时，随机森林通常是首选；性能竞赛或中等以上数据量下，XGBoost 表现更好；需要可解释性时选决策树；小数据基线对比用 KNN。

|   算法   | 训练速度 | 预测速度 | 可解释性 | 调参难度 |   适用场景   |
| :------: | :------: | :------: | :------: | :------: | :----------: |
|   KNN   |    快    |    慢    |    中    |    低    |  小数据基线  |
|  决策树  |    快    |    快    |    高    |    低    | 可解释性需求 |
| 随机森林 |    中    |    中    |    中    |    低    |   默认基线   |
| XGBoost |    慢    |    快    |    中    |    高    |   性能竞赛   |

实际项目中通常先跑随机森林做基线，再用 XGBoost 挤压性能。当样本量小于特征数（如基因表达数据）时，要额外注意正则化和特征选择，避免严重过拟合。

## 1.6.4 模型评估

训练出模型只是开始，评估才是判断模型能否上线的依据。评估的核心思想是用模型没见过的数据测试泛化能力，所以评估方法和评估指标同等重要。在医学场景中，错误的评估可能导致模型在真实临床环境中失效，后果比一般应用严重得多。这一节会介绍交叉验证、分类指标和 ROC 曲线三类工具。

**交叉验证** 是评估泛化误差的标准方法。K 折交叉验证把训练集等分成 K 份，每次用 K-1 份训练、1 份验证，循环 K 次取平均。K 通常取 5 或 10，太小方差大、太大偏差小但计算贵。留一交叉验证（LOOCV）是 K 等于样本量的极端情况，几乎无偏但方差极大，适合小样本场景。当类别不平衡时，要用分层 K 折保证每折的类别比例一致。

```r
library(caret)
ctrl <- trainControl(method = "cv", number = 10,
                     classProbs = TRUE,
                     summaryFunction = multiClassSummary)
set.seed(42)
cv_fit <- train(Species ~ ., data = iris, method = "rf", trControl = ctrl)
cv_fit$results
```

trainControl 是 caret 评估流程的控制中心，method 指定交叉验证类型，classProbs 决定是否输出类别概率（ROC 等指标需要），summaryFunction 指定评估指标计算函数。multiClassSummary 会一次性输出准确率、Kappa、多类 AUC 等十余个指标。

LOOCV 是 K 折交叉验证的极端情况，每次留一个样本做验证、其余做训练，循环 n 次。它的优点是几乎无偏，因为每次训练用了几乎所有数据；缺点是方差大、计算贵，适合小样本场景。caret 用 method = "LOOCV" 启用。

```r
ctrl_loo <- trainControl(method = "LOOCV")
set.seed(42)
loo_fit <- train(Species ~ ., data = iris, method = "knn",
                 preProcess = c("center", "scale"),
                 trControl = ctrl_loo,
                 tuneGrid = data.frame(k = 1:15))
loo_fit$results
```

LOOCV 在 n 较大时计算量惊人，因为要训练 n 次模型。对于线性模型可以利用公式解析解加速，但对树模型等非线性算法只能老老实实跑 n 次。

嵌套交叉验证用于在模型选择阶段就严格评估泛化能力。外层循环做评估，内层循环做超参数调优，两者独立。非嵌套交叉验证用同一份数据既调参又评估，会乐观估计泛化误差。在医学研究中如果报告的模型性能来自非嵌套交叉验证，通常要打折扣理解。

```r
# 嵌套交叉验证的简化示意
set.seed(42)
outer_folds <- createFolds(iris$Species, k = 5)
outer_acc <- numeric(5)

for (i in seq_along(outer_folds)) {
  test_idx <- outer_folds[[i]]
  outer_train <- iris[-test_idx, ]
  outer_test  <- iris[test_idx, ]
  # 内层交叉验证调超参数
  inner_ctrl <- trainControl(method = "cv", number = 5)
  inner_fit <- train(Species ~ ., data = outer_train, method = "rf",
                     trControl = inner_ctrl, tuneLength = 3)
  # 在外层测试集上评估
  pred <- predict(inner_fit, outer_test)
  outer_acc[i] <- mean(pred == outer_test$Species)
}
mean(outer_acc)
```

这段代码用 5 折外层、5 折内层做嵌套交叉验证，得到的准确率才是模型选择阶段的诚实估计。注意每折的外层训练集都要重新做完整的内层调参，计算量是普通交叉验证的 K 倍。

**分类指标** 从混淆矩阵派生。混淆矩阵是一个 $C \times C$ 的方阵，行是真实类别、列是预测类别，对角线元素是分类正确的样本数。从混淆矩阵可以推出准确率（accuracy）、精确率（precision）、召回率（recall）和 F1 分数。准确率在类别不平衡时会失真，例如 99% 的负样本时全预测负类也有 99% 准确率。精确率关注预测为正的样本中有多少真是正，召回率关注真实的正样本有多少被找出来，F1 是两者的调和平均。

```r
library(caret)
pred <- predict(cv_fit, iris)
confusionMatrix(pred, iris$Species)
```

caret 的 confusionMatrix() 同时输出混淆矩阵和一系列派生指标，是 R 中最便捷的评估入口。对于二分类，输出会额外包含敏感性、特异性、阳性预测值、阴性预测值等医学常用指标。

::: note
医学诊断场景中，召回率（敏感性）通常比精确率更重要，因为漏诊的代价远高于误诊。需要根据具体任务选择合适的指标。例如癌症筛查模型要高召回率，确诊模型则要高精确率。
:::

**ROC 曲线与 AUC** 评估二分类模型的概率输出。ROC 曲线以假阳性率（FPR）为横轴、真阳性率（TPR）为纵轴，绘制不同阈值下的分类表现。AUC 是 ROC 曲线下面积，取值 0 到 1，0.5 表示随机猜测，1 表示完美分类。AUC 的优点是对阈值不敏感、对类别不平衡稳健，是医学预测模型的标准报告指标。

```r
library(pROC)
library(randomForest)
set.seed(42)
rf_bin <- randomForest(factor(Species == "setosa") ~ ., data = iris)
roc_obj <- roc(iris$Species == "setosa", rf_bin$votes[, "TRUE"])
plot(roc_obj, print.auc = TRUE)
auc(roc_obj)
```

pROC 是 R 中最常用的 ROC 工具，plot() 直接画出 ROC 曲线并显示 AUC。rf_bin$votes 是随机森林中每棵树投给每个类别的票数比例，可以当作概率使用。需要注意的是，随机森林的 votes 是有限样本的投票比例，与逻辑回归的连续概率性质不同，对极值不够敏感。

PR 曲线是 ROC 在不平衡场景下的替代。当正类样本占比低于 5% 时，ROC 曲线会显得过于乐观，PR 曲线能更真实反映模型表现。医学数据中罕见病预测应该同时报告 ROC 和 PR 曲线。

下面是 PR 曲线的 R 实现，用 PRROC 包计算精确率-召回率曲线下面积。

```r
library(PRROC)
pred_prob <- rf_bin$votes[, "TRUE"]
truth <- iris$Species == "setosa"
pr_obj <- pr.curve(scores.class0 = pred_prob[truth],
                   scores.class1 = pred_prob[!truth],
                   curve = TRUE)
plot(pr_obj)
pr_obj$auc.integral
```

PR 曲线的横轴是召回率，纵轴是精确率。AUC-PR 越接近 1 越好，但在不平衡数据上即使是好模型的 AUC-PR 也可能远低于 1，这是数据本身的难度决定的。

对于回归问题，评估指标完全不同。常用的有均方误差 MSE、均方根误差 RMSE、平均绝对误差 MAE 和决定系数 $R^2$。MSE 对大误差敏感，MAE 对异常值稳健，$R^2$ 表示模型解释的方差比例，取值 0 到 1。caret 的 defaultSummary() 函数会同时输出 RMSE、$R^2$ 和 MAE。

```r
library(caret)
set.seed(42)
reg_fit <- train(mpg ~ ., data = mtcars, method = "rf",
                 trControl = trainControl(method = "cv", number = 5))
reg_fit$results
```

下面是 Python sklearn 的对照实现。sklearn 的指标函数都是无状态的，接受真实标签和预测值即可计算，比 R 的面向对象风格更函数式。

```python
from sklearn.metrics import confusion_matrix, classification_report, roc_auc_score
from sklearn.model_selection import cross_val_score

# 交叉验证
cv_scores = cross_val_score(model, X, y, cv=10, scoring="accuracy")

# 评估指标
y_true = [...]
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

print(confusion_matrix(y_true, y_pred))
print(classification_report(y_true, y_pred))
print("AUC:", roc_auc_score(y_true, y_prob))
```

classification_report 一次性输出精确率、召回率、F1 和样本数，相当于 R 中 confusionMatrix() 的指标部分。scoring 参数指定交叉验证的评估指标，常用值包括 accuracy、roc_auc、f1、precision、recall。

## 1.6.5 超参数调优

模型参数分两类：模型参数由训练数据学习得到，超参数由人工设定、不能用训练数据估计。KNN 的 K、随机森林的 mtry、XGBoost 的 max_depth 都属于超参数。超参数调优的目标是在超参数空间中找到使交叉验证性能最高的组合，本质是一个嵌套的优化问题。

**网格搜索** 是最直接的策略：列出每个超参数的候选值，对所有组合做交叉验证，选最优。它的优点是简单、可并行、覆盖全面，缺点是维度灾难，超参数一多就指数级爆炸。**随机搜索** 在超参数空间随机采样固定数量的组合，效率更高，而且在某些超参数不重要时反而更可能找到好组合。James Bergstra 等人的实验表明，随机搜索在相同预算下通常不弱于网格搜索，特别是当只有少数超参数真正影响性能时。

下面是 caret 的网格搜索示例，对随机森林的 mtry 做网格搜索。caret 通过统一接口调用 ranger，ranger 是 randomForest 的高性能替代。

```r
library(caret)
set.seed(42)
tune_grid <- expand.grid(mtry = 1:4,
                         splitrule = "gini",
                         min.node.size = 1)
ctrl <- trainControl(method = "cv", number = 10)
rf_tune <- train(Species ~ ., data = iris, method = "ranger",
                 trControl = ctrl, tuneGrid = tune_grid)
rf_tune$bestTune
plot(rf_tune)
```

plot() 会画出不同超参数组合下的交叉验证准确率，便于直观判断最优区间。如果曲线在某段平台期，说明对应超参数对性能影响不大，可以缩小搜索范围。

tidymodels 的 tune 包提供了更现代的调优接口。它把超参数标记为待调对象，用网格搜索或随机搜索拟合候选模型，最后通过 collect_metrics() 收集结果。tune() 把超参数标记为待调对象，tune_grid 在交叉验证上自动搜索。grid = 10 表示随机采样 10 组超参数。

```r
library(tidymodels)
set.seed(42)
rf_spec <- rand_forest(mtry = tune(), trees = 500, min_n = tune()) %>%
  set_engine("ranger") %>%
  set_mode("classification")

rf_workflow <- workflow() %>%
  add_recipe(recipe(Species ~ ., data = iris)) %>%
  add_model(rf_spec)

set.seed(42)
rf_tune <- tune_grid(rf_workflow,
                     resamples = vfold_cv(iris, v = 10),
                     grid = 10)
show_best(rf_tune, metric = "accuracy")
select_best(rf_tune, metric = "accuracy")
```

select_best() 返回最优组合，可以直接 finalize_workflow() 嵌入最终模型。tidymodels 的设计哲学是把每个步骤都明确声明，便于复现和审计，这在医学研究这种需要严格记录分析流程的场景中尤其有用。

::: tip
tidymodels 推荐用 grid = 10 或 grid = 20 的随机搜索作为起点，效果不理想再扩大网格或切换到贝叶斯优化。grid_max_entropy() 可以生成空间覆盖更均匀的网格。
:::

**贝叶斯优化** 用代理模型（通常为高斯过程）拟合超参数与交叉验证分数之间的关系，用采集函数决定下一组该试哪个超参数。它的优势是能用更少的评估次数找到好组合，特别适合单次训练昂贵的模型（如深度学习或大型 XGBoost）。R 中可以用 tidymodels 的 tune_bayes() 实现贝叶斯优化。

```r
library(tidymodels)
set.seed(42)
rf_bayes <- tune_bayes(rf_workflow,
                       resamples = vfold_cv(iris, v = 10),
                       initial = 5, iter = 20,
                       metrics = metric_set(accuracy))
show_best(rf_bayes)
```

initial 指定初始随机搜索次数，iter 指定贝叶斯迭代次数。每次迭代会基于已有结果选择下一个最值得评估的点。贝叶斯优化的代价是单次迭代的元计算开销大，所以当单次模型训练很快时，它的优势会被抵消，反而不如网格搜索。

下面是 Python sklearn 的调优对照实现。sklearn 的 GridSearchCV 和 RandomizedSearchCV 提供网格与随机搜索，scikit-optimize 库提供贝叶斯优化。

```python
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from scipy.stats import randint
from sklearn.ensemble import RandomForestClassifier

param_grid = {"max_depth": [3, 5, 7, None],
              "n_estimators": [100, 300, 500]}

grid_search = GridSearchCV(RandomForestClassifier(),
                           param_grid, cv=10, scoring="accuracy",
                           n_jobs=-1)
grid_search.fit(X_train, y_train)
print(grid_search.best_params_)

# 随机搜索
param_dist = {"max_depth": randint(3, 20),
              "n_estimators": randint(100, 1000)}
rand_search = RandomizedSearchCV(RandomForestClassifier(),
                                  param_dist, n_iter=20, cv=10,
                                  scoring="accuracy", n_jobs=-1)
rand_search.fit(X_train, y_train)
```

GridSearchCV 的参数空间是显式列表，RandomizedSearchCV 的参数空间是分布对象，n_iter 控制采样次数。n_jobs = -1 表示用全部 CPU 核心并行。

调优完成后，要用选定的超参数在全量训练集上重新训练模型，再用测试集做一次最终评估。这一步不能省略：如果直接报告调优过程中的交叉验证分数，会乐观估计泛化能力，因为超参数本身已经从这些数据中学到了信号。tidymodels 提供了 finalize_workflow() 函数把最优超参数填回 workflow，再用 last_fit() 做最终训练和测试。

```r
library(tidymodels)
best_params <- select_best(rf_tune, metric = "accuracy")
final_wf <- rf_workflow %>%
  finalize_workflow(best_params)

set.seed(42)
final_fit <- final_wf %>%
  last_fit(split = initial_split(iris, prop = 0.7, strata = Species))
final_fit$.metrics
```

last_fit() 在训练集上拟合、在测试集上评估，一次完成，且严格保证测试集只用于这次最终评估。这种工程化设计能最大程度避免人为失误导致的评估偏差。

::: note
超参数调优容易陷入另一个陷阱：在测试集上反复调参、看结果、再调参。这相当于把测试集当成验证集用，最终性能估计会被严重乐观化。正确做法是严格区分调参用的验证集和最终评估用的测试集，测试集只在最后一次用。
:::

## 1.6.6 无监督学习

无监督学习没有标签，目标是发现数据的内在结构。医学研究中常见的应用是患者亚型分型、基因表达模式发现、单细胞数据可视化。无监督方法的结果需要结合领域知识解释，单纯依赖算法输出容易得到没有生物学意义的簇。这一节会介绍 K-means、层次聚类、PCA、t-SNE 和 UMAP 五个核心方法。

**K-means 聚类** 是最常用的划分方法。算法随机初始化 K 个聚类中心，迭代执行两步：把每个样本分配到最近的中心，再把中心更新为簇内样本均值。算法保证收敛到局部最优，所以通常多跑几次取最优解。K 值通过肘部法则或轮廓系数选择。K-means 假设簇是凸形且大小相近，对异常值敏感，不适合发现任意形状的簇。

下面用 R 实现 K-means，并用肘部法则选择 K。nstart 指定随机初始化次数，取最优结果。tot.withinss 是簇内平方和，K 增大时单调下降，肘部对应的 K 通常是最优选择。

```r
set.seed(42)
data_scaled <- scale(iris[, -5])

# 肘部法则
wss <- sapply(1:10, function(k) {
  kmeans(data_scaled, centers = k, nstart = 10)$tot.withinss
})
plot(1:10, wss, type = "b", xlab = "K", ylab = "Within-cluster SS")

# 选 K = 3
km_fit <- kmeans(data_scaled, centers = 3, nstart = 10)
table(km_fit$cluster, iris$Species)
```

轮廓系数是更客观的聚类质量指标，取值 -1 到 1，越接近 1 表示簇内紧凑、簇间分离。可以用 cluster::silhouette() 计算。

```r
library(cluster)
sil <- silhouette(km_fit$cluster, dist(data_scaled))
summary(sil)
plot(sil)
```

当存在真实标签作为参考时，可以用调整兰德指数（ARI）和归一化互信息（NMI）评估聚类结果与真实标签的一致性。ARI 取值 -1 到 1，0 表示随机聚类、1 表示完全一致，对类别数不敏感，是更公平的对比指标。mclust 包提供了 adjustedRandIndex() 函数。

```r
library(mclust)
adjustedRandIndex(km_fit$cluster, iris$Species)
```

ARI 也能用于比较两种聚类方法的结果一致性，是验证聚类稳定性的常用工具。

**层次聚类** 不需要预先指定 K，而是构建一棵聚类树。凝聚式层次聚类从每个样本自成一簇开始，每步合并最相似的两簇，直到所有样本合成一簇。相似度通过链接方式定义：单链接取两簇间最近距离、全链接取最远距离、平均链接取平均距离、Ward 法最小化簇内方差。聚类树用树状图展示，可以直观看出簇的层次结构，再用 cutree() 切割到想要的簇数。

```r
d <- dist(data_scaled)
hc_fit <- hclust(d, method = "ward.D2")
plot(hc_fit)
rect.hclust(hc_fit, k = 3)
clusters <- cutree(hc_fit, k = 3)
table(clusters, iris$Species)
```

ward.D2 是 Ward 最小方差法的变体，对球形簇效果好。树状图的高度反映合并时的距离，越高的合并表示簇之间差异越大。rect.hclust() 在树状图上标出切割位置，便于直观检查簇的边界。

::: warning
层次聚类一旦合并就不可回溯，错误的早期合并会传播到最终结果。对噪声敏感的数据建议先用 K-means 或密度方法验证稳定性。不同链接方式的结果可能差异巨大，建议多试几种再做结论。
:::

**主成分分析（PCA）** 是最常用的降维方法。它通过线性变换把原始特征投影到一组正交的主成分上，每个主成分是原始特征的线性组合，按方差大小排序。前几个主成分通常能解释数据的大部分变异，可以用来做可视化、特征压缩或消除共线性。PCA 假设数据关系是线性的，对非线性结构效果差，且对量纲敏感，必须先做标准化。

```r
pca_fit <- prcomp(data_scaled, center = TRUE, scale. = TRUE)
summary(pca_fit)
biplot(pca_fit)
```

prcomp 是 R 内置的 PCA 实现，summary() 输出每个主成分的解释方差比例。biplot 同时展示样本和变量在主成分空间中的位置，可以直观看出哪些变量对主成分贡献最大。Cumulative Proportion 列表示前若干主成分累计解释的方差比例，通常希望前两三个主成分能解释 70% 以上的变异。

碎石图是选择主成分数量的可视化工具。横轴是主成分序号，纵轴是对应的特征值或解释方差比例。理想碎石图会有一段陡峭下降后明显变平的拐点，拐点之前的主成分保留，之后的视为噪声。

```r
# 碎石图
plot(pca_fit$sdev^2, type = "b", pch = 19,
     xlab = "Principal Component", ylab = "Variance")
abline(h = 1, lty = 2, col = "red")  # Kaiser 准则：保留特征值 > 1 的主成分
```

Kaiser 准则建议保留特征值大于 1 的主成分，因为原始标准化变量的方差就是 1，特征值小于 1 的主成分携带的信息比单个原始变量还少。这个准则简单但偏保守，实际应用中还要结合累积方差比例和领域知识。

主成分的因子加载量反映原始变量对主成分的贡献。pca_fit$rotation 是加载量矩阵，每列对应一个主成分，每行对应一个原始变量。加载量的绝对值越大，变量对该主成分的贡献越大。

```r
# 查看前两个主成分的加载量
loading <- pca_fit$rotation[, 1:2]
loading[order(-abs(loading[, 1])), 1]  # 对 PC1 贡献最大的变量
```

PCA 在基因表达数据分析中有特殊地位。当样本数远小于基因数时，PCA 可以把数千维表达数据压缩到几十维，同时保留主要变异，下游建模的稳定性和可解释性都会提升。需要注意的是，PCA 是无监督的，它不区分类别信息，压缩后的主成分不一定与生物学金型相关，必要时可以用 PLS、LDA 等监督降维方法。

**t-SNE 和 UMAP** 是非线性降维方法，专门用于高维数据可视化。t-SNE 把高维距离转换成概率相似度，在低维空间重建这个分布，对局部结构保留好但丢失全局结构。UMAP 用拓扑学方法保留局部和全局结构，速度比 t-SNE 快、参数更直观，是单细胞数据可视化的主流选择。两者都只能用于可视化，不能作为下游建模的输入特征，因为它们的输出没有稳定语义，且对随机种子敏感。

```r
library(Rtsne)
set.seed(42)
tsne_fit <- Rtsne(data_scaled, dims = 2, perplexity = 30)
plot(tsne_fit$Y, col = iris$Species, pch = 19,
     xlab = "t-SNE 1", ylab = "t-SNE 2")
```

perplexity 是 t-SNE 的关键参数，控制每个点考虑的邻居数，通常取 5 到 50。perplexity 太小会把数据切成碎片，太大会让所有点挤成一团。

```r
library(umap)
set.seed(42)
umap_fit <- umap(data_scaled)
plot(umap_fit$layout, col = iris$Species, pch = 19,
     xlab = "UMAP 1", ylab = "UMAP 2")
```

UMAP 的关键参数是 n_neighbors 和 min_dist，前者控制局部结构粒度，后者控制点在低维空间的紧凑程度。n_neighbors 大时关注全局结构，小时关注局部细节。

下面用 patchwork 把 PCA、t-SNE、UMAP 三种降维结果并排展示，便于直观对比它们在同一数据上的表现差异。

```r
library(ggplot2)
library(patchwork)

# 准备三种降维结果
pca_df <- data.frame(PC1 = pca_fit$x[, 1],
                     PC2 = pca_fit$x[, 2],
                     Species = iris$Species)
tsne_df <- data.frame(tSNE1 = tsne_fit$Y[, 1],
                      tSNE2 = tsne_fit$Y[, 2],
                      Species = iris$Species)
umap_df <- data.frame(UMAP1 = umap_fit$layout[, 1],
                      UMAP2 = umap_fit$layout[, 2],
                      Species = iris$Species)

p1 <- ggplot(pca_df, aes(PC1, PC2, color = Species)) +
  geom_point() + ggtitle("PCA")
p2 <- ggplot(tsne_df, aes(tSNE1, tSNE2, color = Species)) +
  geom_point() + ggtitle("t-SNE")
p3 <- ggplot(umap_df, aes(UMAP1, UMAP2, color = Species)) +
  geom_point() + ggtitle("UMAP")

p1 + p2 + p3 + plot_layout(guides = "collect")
```

PCA 会保留原始数据中变异最大的方向，setosa 类通常能与其它两类清晰分开，但 versicolor 和 virginica 可能有重叠。t-SNE 和 UMAP 通过非线性变换能把三类分得更开，但簇间的距离不反映真实相似度，只能看相对位置。

::: note
t-SNE 和 UMAP 的结果具有随机性，不同随机种子下结果会变化。解读时关注模式而非具体坐标，必要时多次运行确认稳定性。如果同一簇在不同种子下分裂或合并，说明聚类结构本身不稳健。
:::

PCA、t-SNE、UMAP 三者各有定位：PCA 用于线性降维和特征工程，t-SNE 和 UMAP 用于可视化探索。把它们用在错误场景会得到误导性结果，例如用 t-SNE 输出做聚类，距离关系已经被扭曲，簇的大小和距离都不可信。正确的工作流是先用 PCA 做初步降维和降噪，再用 t-SNE 或 UMAP 做可视化，必要时用聚类算法在 PCA 后的数据上分型。

::: tip
单细胞 RNA-seq 数据分析的标准流程是：先做 PCA 降到 30-50 维，再用 UMAP 进一步降到 2 维可视化，聚类算法在 PCA 后的数据上运行。直接对原始几千维基因表达做 t-SNE 或聚类既慢又容易受噪声干扰。
:::

## 本节小结

机器学习的工程实践可以压缩成一条主线：先把数据按分布一致的方式切分成训练集和测试集，再用 recipes 之类的流水线做预处理，然后选合适的算法拟合，用交叉验证评估泛化能力，用网格或贝叶斯方法调超参数，最后在无监督场景用聚类和降维发现结构。R 的 caret 和 tidymodels 是这条主线上的两套工具，前者老牌稳健、后者现代整洁，搭配 randomForest 和 XGBoost 能覆盖医学研究的大部分需求。

掌握这套流程的关键在于理解每一步背后的统计原理。预处理为什么要训练-应用分离、交叉验证为什么不能在测试集上调参、随机森林为什么对量纲不敏感、t-SNE 为什么不能用作特征工程，这些问题的答案决定了你能否在数据出问题时知道从哪里排查。本节给出了主干框架，具体算法的细节、医学场景的实战案例、深度学习的扩展等内容，建议在做实际项目时按需查阅专题文档。

医学研究中机器学习的最终价值不在于模型本身，而在于能否回答科学问题。一个 AUC 0.85 的诊断模型如果用错了人群、漏掉了关键协变量、或评估流程存在信息泄漏，结论依然不可信。把工程纪律做扎实，把每个步骤的假设和限制想清楚，机器学习才能从漂亮的演示变成可靠的研究工具。

## 练习题

### 第1题 训练集与测试集划分

用 `iris` 数据集,按 7:3 比例划分训练集与测试集,要求分层抽样保持各类别比例。写出用 `caret` 与 `rsample` 两种包的实现代码。

::: details 参考答案

```r
library(caret)
set.seed(42)
train_idx <- createDataPartition(iris$Species, p = 0.7, list = FALSE)
train_set <- iris[train_idx, ]
test_set  <- iris[-train_idx, ]

# rsample 写法
library(rsample)
set.seed(42)
split <- initial_split(iris, prop = 0.7, strata = Species)
train_set <- training(split)
test_set  <- testing(split)
```

`createDataPartition()` 默认做分层抽样,保持原始数据中各类别比例。`rsample::initial_split()` 的 `strata` 参数指定分层变量。随机切分时小类样本可能全部进入某一侧,分层抽样能避免这种风险。
:::

### 第2题 随机森林训练与评估

用 `caret` 训练随机森林模型预测 `iris` 的 `Species`,使用 10 折交叉验证,并在测试集上计算准确率与混淆矩阵。

::: details 参考答案

```r
library(caret)
set.seed(42)

ctrl <- trainControl(method = "cv", number = 10)
rf_fit <- train(Species ~ ., data = train_set, method = "rf",
                trControl = ctrl, tuneLength = 3)

# 测试集预测
pred <- predict(rf_fit, newdata = test_set)
confusionMatrix(pred, test_set$Species)
```

`trainControl(method = "cv", number = 10)` 设置 10 折交叉验证。`method = "rf"` 指定随机森林,`tuneLength = 3` 让 caret 自动尝试 3 个 `mtry` 值。`confusionMatrix()` 输出准确率、敏感度、特异度等指标,并给出按类别拆分的统计量。
:::

### 第3题 PCA 降维与可视化

对 `iris` 的四个数值列做 PCA,绘制前两个主成分的散点图,按 `Species` 着色,并解释前两个主成分解释的方差比例。

::: details 参考答案

```r
iris_scaled <- scale(iris[, 1:4])
pca_fit <- prcomp(iris_scaled, center = TRUE, scale. = TRUE)
summary(pca_fit)

# 散点图
plot(pca_fit$x[, 1], pca_fit$x[, 2], col = iris$Species, pch = 19,
     xlab = "PC1", ylab = "PC2")
legend("topright", legend = levels(iris$Species), col = 1:3, pch = 19)
```

`prcomp()` 执行 PCA,`summary()` 输出每个主成分的解释方差比例。前两个主成分通常能解释 iris 数据 95% 以上的变异。PCA 对量纲敏感,必须先做标准化(`scale. = TRUE`),否则方差大的变量会主导主成分方向。散点图中 setosa 通常与其他两类清晰分离,versicolor 与 virginica 有一定重叠。
:::

## 常见错误

**错误 1 · 未设随机种子导致结果不可复现**

原因:随机森林、K-means、交叉验证划分等都涉及随机过程,不设 `set.seed()` 每次运行结果不同,无法复现也无法调试。

解决:在数据划分、模型训练、随机搜索等关键步骤前调用 `set.seed(42)`。团队协作时把种子写入项目配置,确保所有人得到一致结果。注意种子只在当前 R 会话有效,重启后需重新设置。

**错误 2 · 预处理在全量数据上拟合导致数据泄露**

原因:标准化、缺失值填充等预处理在全量数据(含测试集)上估计参数,再用到训练集与测试集。测试集的分布信息泄漏到训练过程,交叉验证误差过于乐观。

解决:预处理参数只能在训练折上估计。用 `caret` 的 `preProcess` 参数或 `tidymodels` 的 `recipe` 机制,它们会自动在交叉验证循环内部执行预处理,避免泄露。手动实现时,把训练集的均值与标准差保存下来,再应用到测试集。

**错误 3 · 用 t-SNE 或 UMAP 输出做聚类**

原因:t-SNE 与 UMAP 是非线性降维方法,输出坐标的距离关系已被扭曲,簇的大小与间距不反映真实相似度。在这些坐标上做 K-means 或层次聚类会得到误导性结果。

解决:t-SNE 与 UMAP 仅用于可视化探索。聚类应在 PCA 降维后的数据上进行,因为 PCA 保留线性距离关系。单细胞数据分析的标准流程是 PCA 降到 30-50 维,再在该空间上聚类,最后用 UMAP 可视化聚类结果。

**错误 4 · 在测试集上反复调参**

原因:用测试集评估不同超参数组合,根据测试集表现选择最优参数,相当于把测试集当作验证集。测试集信息泄漏到模型选择过程,最终性能估计被严重乐观化。

解决:严格区分验证集与测试集。超参数调优只在训练集的交叉验证折上进行,测试集只在最后一次评估时使用。`tidymodels` 的 `last_fit()` 把这一流程固化,确保测试集不被反复触碰。
