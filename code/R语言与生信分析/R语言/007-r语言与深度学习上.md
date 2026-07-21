---
title: 1.7 深度学习（上）：基础与核心架构
sidebar:
  order: 7
---
# 1.7 深度学习（上）：基础与核心架构

深度学习是机器学习的一个分支，它通过多层非线性变换从数据中自动学习层次化的特征表示。在医学影像识别、基因表达分类、蛋白质结构预测等领域，深度学习已经取得了远超传统机器学习方法的成果。本节将系统介绍深度学习的核心概念、R 语言生态中的建模工具，以及如何用 Keras 和 torch 构建从基础前馈网络到卷积、循环、自编码器等各类模型。我们将从神经元的数学模型出发，逐步扩展到现代深度学习架构的设计与训练技巧，确保每一个概念都伴随可运行的 R 代码。

## 1.7.1 深度学习基本概念与 R 环境搭建

### 神经元：从生物模型到数学抽象

人工神经元是深度学习的最小计算单元，它模拟生物神经元接收多路输入信号、加权求和并通过激活函数决定是否发放输出的过程。给定输入向量 $\mathbf{x} \in \mathbb{R}^n$、权重向量 $\mathbf{w} \in \mathbb{R}^n$ 和偏置 $b$，神经元的输出可以写作 $y = f(\mathbf{w}^\top \mathbf{x} + b)$，其中 $f$ 是非线性激活函数。这个看似简单的运算在堆叠成千上万次之后，就构成了深度网络强大的表达能力。

层（layer）是若干神经元的集合，它们接收相同输入并各自计算输出。网络深度指从输入到输出所经过的层数，参数量则是所有权重和偏置的总数。一个简单的全连接网络，若每层 1000 个神经元，三层之间就有约 200 万参数；现代大模型则动辄数十亿参数。深度之所以重要，是因为它能用更少的神经元表达复杂的层次特征，浅层捕捉局部模式，深层组合出抽象语义。

### R 中的深度学习框架概览

R 生态中常用的深度学习框架主要有三套。keras 包通过 reticulate 调用 Python 的 Keras/TensorFlow 后端，社区成熟、文档完善，适合从图像到文本的多数任务。torch 包直接绑定 C++ 的 libtorch 库，无需 Python 环境，安装简洁，调试友好，在研究型用户中越来越流行。reticulate 本身不是深度学习框架，但它让 R 代码可以无缝调用 PyTorch、TensorFlow 以及任意 Python 库，作为桥梁使用。

选择框架时可以从两个角度判断。如果你已经在 Python 端积累了模型代码，或需要复用社区里大量 Keras 示例，keras 是顺理成章的选择。如果你希望在一个干净的 R 环境内完成从数据加载到模型部署的全流程，且重视安装稳定性，torch 更值得优先考虑。两者在表达能力上没有本质差距，差异更多体现在 API 风格和调试体验上。

下面安装并加载两个核心包：

::: warning 浏览器中无法运行
以下代码使用了 `keras`, `torch`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
# 安装 keras（首次执行）
# install.packages("keras")
# keras::install_keras()

# 安装 torch（首次执行）
# install.packages("torch")
# torch::install_torch()

library(keras)
library(torch)
```

### GPU 检测与环境验证

深度学习训练对算力高度敏感，CPU 训练小型网络尚可，遇到图像或序列任务几乎必须依赖 GPU。安装完成后应当先检查 GPU 是否被正确识别。TensorFlow 通过 `tf$config$list_physical_devices` 列出设备，torch 则使用 `torch_cuda_is_available()` 返回布尔值。

::: warning 浏览器中无法运行
以下代码使用了 `tensorflow`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
# 检查 TensorFlow 是否识别到 GPU
library(tensorflow)
tf$config$list_physical_devices("GPU")
# 若返回列表非空，说明 GPU 可用

# 检查 torch 是否能用 CUDA
torch::torch_cuda_is_available()
# TRUE 表示可用
torch::torch_cuda_device_count()
# 返回可用 GPU 数量
```

:::tip
Windows 用户安装 GPU 版 torch 时，需要确保已安装匹配版本的 CUDA Toolkit 和 cuDNN。如果 `torch_cuda_is_available()` 返回 `FALSE`，先在 PowerShell 中运行 `nvidia-smi` 确认驱动版本，再对照 torch 官网的版本兼容表。
:::

下面给出 Python 端等价的检测代码，方便熟悉 Python 的读者对照：

```python
# Python 对照
import tensorflow as tf
print(tf.config.list_physical_devices("GPU"))

import torch
print(torch.cuda.is_available())
print(torch.cuda.device_count())
```

### 框架选择的实战建议

在实际医学项目中，框架选择往往受到团队既有工具链的影响。如果课题组已经有基于 PyTorch 的预训练模型仓库，那么通过 reticulate 调用这些模型比改写为 R 原生代码更高效。如果是从零开始的 R 项目，torch 包的依赖更少、安装更可控，是优先推荐。本节的代码示例以 keras 为主，因为它在多分类、图像任务上的 API 更接近自然语言描述，便于初学者建立直觉；涉及张量操作时会同时给出 torch 的对应写法。

## 1.7.2 神经网络核心组件

### 张量：深度学习的数据容器

张量是多维数组的统称，是深度学习中所有数据的载体。零维张量就是标量，一维张量是向量，二维张量是矩阵，三维及以上则称为高阶张量。一张 RGB 图像在内存中是形状为 (height, width, 3) 的三维张量，一个批量图像则是 (batch, height, width, 3) 的四维张量。理解张量的形状变换是阅读深度学习代码的关键，因为绝大多数运行时错误都来自形状不匹配。

在 keras/tensorflow 中可以用 `tf$constant` 创建张量，在 torch 中则用 `torch_tensor`。两者在底层都指向高效的 C++ 实现，仅在接口风格上有差异：keras 用美元符号 `$` 调用方法，torch 在 R 中重载了 `+` `-` `*` 等运算符，写起来更接近数学公式。

::: warning 浏览器中无法运行
以下代码使用了 `tensorflow`, `torch`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
# TensorFlow 张量
library(tensorflow)
x <- tf$constant(array(1:24, dim = c(2, 3, 4)))
x$shape                   # 查看形状
tf$reshape(x, c(6, 4))    # 改变形状

# torch 张量
library(torch)
y <- torch_tensor(array(1:24, dim = c(2, 3, 4)))
y$size()                  # 查看形状
y$reshape(c(6, 4))        # 改变形状
```

:::note
R 中的维度顺序与 Python 一致，都是从最外层到最内层排列。但在使用 `array()` 构造数组时要特别小心：R 的 `array` 是按列优先填充，而 `tf$constant` 接收 R 数组时会按 C 顺序（行优先）解释。多数情况下使用真实数据加载器即可避免此问题，但在手工构造测试张量时要留意。
:::

### 层：构建网络的基本积木

层（layer）是网络的最小可复用模块。最常见的全连接层（Dense）将输入向量的每个分量连接到输出的每个分量，参数量为 `input_dim × units + units`。Dropout 层在训练时随机将一部分神经元置零，强制网络不要过度依赖个别特征。BatchNormalization 层对每个 mini-batch 的特征做归一化，使训练更稳定、收敛更快。三者常组合使用：Dense 提供表达能力，BatchNorm 稳定训练，Dropout 控制过拟合。

::: warning 浏览器中无法运行
以下代码使用了 `keras`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)

# 全连接层：256 个神经元，接 ReLU 激活
layer_dense(units = 256, activation = "relu")

# Dropout：训练时随机失活 30% 神经元
layer_dropout(rate = 0.3)

# 批归一化：对上一层的输出做归一化
layer_batch_normalization()
```

### 激活函数：引入非线性的关键

没有激活函数的多层网络在数学上等价于单层线性变换，因此激活函数是深度学习能够学到复杂模式的根本原因。ReLU 是目前最常用的隐层激活，它在正区间线性、负区间置零，计算简单且能缓解梯度消失。Sigmoid 把输出压到 (0, 1)，常用于二分类的输出层。Tanh 输出 (-1, 1)，在 RNN 中较常见。Softmax 用于多分类输出层，它将一组实数归一化为概率分布。LeakyReLU 和 ELU 是 ReLU 的改进版，在负区间保留微小梯度，能缓解神经元死亡问题。

选择激活函数的经验：隐层默认用 ReLU；若发现训练不稳定可试 ELU 或 LeakyReLU；输出层按任务类型选择，二分类用 Sigmoid，多分类用 Softmax，回归用线性（即不设 activation）。

```r
# 各类激活函数的调用方式
layer_dense(units = 64, activation = "relu")        # ReLU 隐层
layer_dense(units = 64, activation = "elu")         # ELU
layer_dense(units = 64, activation = "tanh")        # Tanh
layer_dense(units = 10, activation = "softmax")     # 多分类输出
layer_dense(units = 1, activation = "sigmoid")      # 二分类输出

# LeakyReLU 需要单独的层
model <- keras_model_sequential() %>%
  layer_dense(units = 64) %>%
  layer_leaky_relu(alpha = 0.1)
```

:::tip
医学数据常出现类别不平衡，例如罕见病检测中阳性样本仅占 5%。此时输出层的 Sigmoid 仍可用，但损失函数应改用 `binary_crossentropy` 并搭配类别权重 `class_weight` 参数，避免模型简单地把所有样本预测为多数类。
:::

### 损失函数：衡量预测与真实之间的差距

损失函数定义了模型优化的目标。回归任务通常用均方误差 MSE 或平均绝对误差 MAE；MSE 对大误差敏感，MAE 对异常值更稳健。二分类用二元交叉熵 `binary_crossentropy`，多分类用分类交叉熵 `categorical_crossentropy`（标签 one-hot）或 `sparse_categorical_crossentropy`（标签为整数）。当任务目标不能直接由标准损失覆盖时，可以自定义损失函数，只要写成接收 `y_true` 与 `y_pred` 两个张量并返回标量的 R 函数即可。

```r
# 内置损失
loss_mean_squared_error()
loss_binary_crossentropy()
loss_sparse_categorical_crossentropy()

# 自定义损失：带权重的二元交叉熵
weighted_bce <- function(y_true, y_pred) {
  weights <- y_true * 5 + 1   # 正样本权重为 6，负样本为 1
  ce <- k_binary_crossentropy(y_true, y_pred)
  k_mean(ce * weights)
}
```

### 优化器：沿着梯度下降

优化器决定了如何利用损失梯度更新参数。SGD 是最朴素的方案，仅按学习率乘以负梯度更新；加入动量（momentum）后能加速收敛。Adam 是目前最常用的优化器，它结合动量与自适应学习率，对超参数不敏感，适合作为默认选择。RMSprop 在 RNN 中表现稳定。学习率是最关键的超参数，过大导致发散，过小则收敛缓慢，通常从 1e-3 起步，根据训练曲线调整。

```r
optimizer_sgd(lr = 0.01, momentum = 0.9)
optimizer_adam(lr = 1e-3)
optimizer_rmsprop(lr = 1e-3)

# 学习率调度：每 10 个 epoch 衰减一半
schedule <- learning_rate_schedule_exponential_decay(
  initial_learning_rate = 1e-3,
  decay_rate = 0.5,
  decay_steps = 10
)
optimizer_adam(learning_rate = schedule)
```

### 评估指标：训练之外的成绩单

训练过程中除了损失，还需要可解释的指标来评估模型质量。分类任务常用 `metric_accuracy`，不平衡数据更应关注 `metric_auc`。医学场景下，灵敏度（召回率）与特异度往往比准确率更重要：灵敏度衡量模型对真正病例的识别能力，特异度衡量对健康对照的正确判别率。这两项指标在 Keras 中可以通过自定义 metric 函数实现。

```r
# 内置指标
metric_accuracy()
metric_auc()

# 自定义灵敏度 = TP / (TP + FN)
metric_sensitivity <- function(y_true, y_pred) {
  y_true <- k_cast(y_true, "float32")
  y_pred <- k_cast(k_round(y_pred), "float32")
  tp <- k_sum(y_true * y_pred)
  fn <- k_sum(y_true * (1 - y_pred))
  (tp + k_epsilon()) / (tp + fn + k_epsilon())
}
```

:::warning
自定义指标在 Keras 中以张量运算实现，不能使用 R 的 `if`/`else` 控制流，因为它们是在计算图中编译执行的。需要分支逻辑时使用 `tf$where` 等张量级条件操作。
:::

## 1.7.3 Keras 基础建模

### 顺序模型：最直观的堆叠方式

顺序模型（Sequential）是把若干层按顺序串联起来的最简结构，适用于单输入、单输出、无分支的网络。它的代码用管道符 `%>%` 串起来，读起来像食谱：先来一层全连接，再加 Dropout，再接一层，最后输出。对于初学者，从 Sequential 入手能快速建立对网络结构的整体印象，也便于调试每一层的输入输出形状。

下面用 Sequential 搭建一个用于二分类的全连接网络。输入是 30 维特征（例如乳腺癌威斯康星数据集），隐层两层，输出层一个 Sigmoid 神经元。

::: warning 浏览器中无法运行
以下代码使用了 `keras`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)

model <- keras_model_sequential() %>%
  layer_dense(units = 64, activation = "relu", input_shape = c(30)) %>%
  layer_dropout(rate = 0.3) %>%
  layer_dense(units = 32, activation = "relu") %>%
  layer_dropout(rate = 0.3) %>%
  layer_dense(units = 1, activation = "sigmoid")

summary(model)
```

### 函数式 API：当模型需要分支

当网络出现多输入、多输出或残差连接时，Sequential 的线性结构无法满足需求，此时需要用函数式 API。函数式 API 的核心思想是：每一层都是一个函数，输入张量经过这个函数得到输出张量，再把输出张量传给下一层。最终用 `keras_model()` 把输入和输出张量绑定成模型。这种写法自由度极高，可以构造 ResNet、Inception 等复杂结构。

```r
# 函数式 API：带残差连接的两层网络
input <- layer_input(shape = c(64))

x <- input %>%
  layer_dense(64, activation = "relu") %>%
  layer_dense(64, activation = "relu")

# 残差：把输入加到 x 上
output <- layer_add(list(x, input)) %>%
  layer_dense(10, activation = "softmax")

resnet_block <- keras_model(input, output)
summary(resnet_block)
```

:::note
残差连接是深度网络训练的关键技巧之一。它让梯度可以绕过中间层直接反向传播到浅层，缓解了深网络中的梯度消失问题。在医学影像分类中，预训练的 ResNet 系列仍是基线模型的有力候选。
:::

### compile：装配损失、优化器与指标

模型搭好之后，需要用 `compile()` 告诉它怎么学。`compile` 接收三个核心参数：损失函数、优化器和评估指标。损失函数决定梯度方向，优化器决定步长，指标则仅用于监控不影响训练。`compile` 不会启动训练，只是配置，因此可以反复调用以尝试不同损失或学习率。

```r
model %>% compile(
  optimizer = optimizer_adam(lr = 1e-3),
  loss = "binary_crossentropy",
  metrics = c("accuracy", metric_auc())
)
```

### fit：在数据上反复迭代

`fit()` 是真正启动训练的函数。它将训练数据按 `batch_size` 分批，前向计算损失、反向传播梯度，重复 `epochs` 轮。`validation_split` 会从训练集中切出一部分用于验证，便于观察是否过拟合。回调函数（callback）则在训练过程中按事件触发，例如每个 epoch 结束保存模型或早停。

```r
history <- model %>% fit(
  x = x_train,
  y = y_train,
  epochs = 50,
  batch_size = 32,
  validation_split = 0.2,
  callbacks = list(
    callback_early_stopping(patience = 5),
    callback_model_checkpoint("best_model.h5", save_best_only = TRUE)
  )
)
plot(history)
```

:::warning
`validation_split = 0.2` 会取数据末尾的 20% 作为验证集。如果你的数据在送入前没有打乱（例如先全部阳性再全部阴性），验证集分布会严重偏离训练集，得到误导性的指标。建议先 `sample()` 打乱数据再拆分，或显式提供 `validation_data`。
:::

### evaluate 与 predict：评估与预测

训练完成后，用 `evaluate()` 在测试集上得到最终的损失与指标，用 `predict()` 获得模型对新样本的预测概率。注意 `predict` 返回的是概率或 logits，需要按任务做后处理：二分类用 0.5 阈值，多分类取 argmax。

```r
# 测试集评估
model %>% evaluate(x_test, y_test)

# 预测概率
y_prob <- model %>% predict(x_test)
y_class <- ifelse(y_prob > 0.5, 1, 0)

# 多分类取最大概率类别
y_prob_multi <- model_multi %>% predict(x_test)
y_class_multi <- apply(y_prob_multi, 1, which.max)
```

### 模型保存与加载

训练好的模型应当持久化保存。Keras 推荐使用 TensorFlow SavedModel 格式（`save_model_tf`），它把结构、权重和优化器状态打包成一个目录，便于跨语言加载。HDF5 格式（`.h5`）仍然支持，但在新版本中已不推荐作为首选。如果只关心预测，也可以仅保存权重 `save_model_weights_hdf5`，再在加载时先重建结构再载入权重。

```r
# 保存为 SavedModel 目录
save_model_tf(model, "my_model")
# 加载
model <- load_model_tf("my_model")

# 也可保存为 HDF5
save_model_hdf5(model, "my_model.h5")
model <- load_model_hdf5("my_model.h5")
```

### 完整分类模型示例

把上面的环节串起来，给出一个完整可运行的二分类示例。这里使用内置的乳腺癌数据集做演示，重点展示从数据准备到模型评估的完整闭环。

::: warning 浏览器中无法运行
以下代码使用了 `keras`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)

# 准备数据
data <- read.csv("https://archive.ics.uci.edu/ml/machine-learning-databases/breast-cancer-wisconsin/wdbc.data",
                 header = FALSE)
x <- as.matrix(data[, 3:32])
y <- as.numeric(data[, 2] == "M")     # M 为恶性，标记为 1

# 标准化
x <- scale(x)

# 切分训练/测试
set.seed(42)
idx <- sample(nrow(x))
n_train <- floor(0.8 * nrow(x))
x_train <- x[idx[1:n_train], ]
y_train <- y[idx[1:n_train]]
x_test  <- x[idx[(n_train + 1):length(idx)], ]
y_test  <- y[idx[(n_train + 1):length(idx)]]

# 搭建并训练
model <- keras_model_sequential() %>%
  layer_dense(32, activation = "relu", input_shape = c(ncol(x))) %>%
  layer_dropout(0.3) %>%
  layer_dense(16, activation = "relu") %>%
  layer_dense(1, activation = "sigmoid")

model %>% compile(
  optimizer = optimizer_adam(lr = 1e-3),
  loss = "binary_crossentropy",
  metrics = c("accuracy", metric_auc())
)

history <- model %>% fit(
  x_train, y_train,
  epochs = 50, batch_size = 32,
  validation_split = 0.2,
  callbacks = callback_early_stopping(patience = 5, restore_best_weights = TRUE),
  verbose = 0
)

model %>% evaluate(x_test, y_test)
```

## 1.7.4 正则化与训练技巧

### 过拟合与欠拟合：诊断训练曲线

训练过程中观察损失曲线能判断模型状态。训练损失持续下降但验证损失开始上升，说明模型在记忆训练集，即过拟合；反之，训练损失与验证损失都很高且不再下降，是欠拟合，通常意味着模型容量不足或学习率不合适。理想状态是两条曲线都下降并趋于接近的水平。学会读曲线是调参的第一步，`plot(history)` 在 Keras 中会直接给出损失与指标的对比图。

### Dropout：随机失活的直觉

Dropout 的灵感来自集成学习。训练时随机让一部分神经元不参与计算，相当于每次都构造一个不同的子网络，最终预测时所有神经元都启用，等价于对大量子网络做平均。这种简单机制能显著降低神经元之间的共适应，提升泛化能力。Dropout 率通常取 0.2 到 0.5，过大会导致欠拟合，过小则起不到正则化作用。

```r
model <- keras_model_sequential() %>%
  layer_dense(128, activation = "relu", input_shape = c(100)) %>%
  layer_dropout(0.4) %>%
  layer_dense(64, activation = "relu") %>%
  layer_dropout(0.4) %>%
  layer_dense(10, activation = "softmax")
```

### 权重正则化：约束参数规模

L2 正则化在损失中加入权重的平方和，使权重趋近于零但不等于零，等价于权重衰减；L1 正则化加入绝对值和，会鼓励稀疏权重，部分参数严格为零。医学数据特征数往往多于样本数（p >> n），L1 正则化能起到特征选择的作用。在 Keras 中通过 `kernel_regularizer` 参数指定，可以同时作用于 kernel、bias 和 activity。

::: warning 浏览器中无法运行
以下代码使用了 `keras`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)

model <- keras_model_sequential() %>%
  layer_dense(
    units = 64,
    activation = "relu",
    input_shape = c(500),
    kernel_regularizer = regularizer_l1(l = 0.001)   # L1 正则
  ) %>%
  layer_dense(
    units = 64,
    activation = "relu",
    kernel_regularizer = regularizer_l2(l = 0.001)   # L2 正则
  ) %>%
  layer_dense(1, activation = "sigmoid")
```

### 批归一化：让训练更稳定

BatchNormalization 在每个 mini-batch 内对一层输出做标准化：减去均值、除以标准差，再用两个可学习参数做缩放和平移。它的作用是让每一层的输入分布不至于随训练剧烈变化，从而允许使用更大的学习率、加速收敛。位置选择有讲究：放在激活之前（conv → BN → ReLU）是经典做法，放在激活之后（conv → ReLU → BN）也常见，两者效果差异不大，按经验选择即可。

```r
model <- keras_model_sequential() %>%
  layer_dense(256, input_shape = c(784)) %>%
  layer_batch_normalization() %>%
  layer_activation("relu") %>%
  layer_dropout(0.3) %>%
  layer_dense(10, activation = "softmax")
```

### 早停法：在最合适的时刻停下

训练轮数过多容易过拟合，过少又欠拟合。早停法（EarlyStopping）监控验证集指标，当指标在若干轮内不再改善时自动终止训练。`patience` 控制容忍轮数，`restore_best_weights` 决定是否回滚到最佳模型权重。这两项参数在医学小数据集上尤其关键，因为训练曲线常出现剧烈波动。

```r
callback_early_stopping(
  monitor = "val_loss",
  patience = 10,
  restore_best_weights = TRUE
)
```

### 模型检查点：保存最佳模型

ModelCheckpoint 在每个 epoch 结束后评估验证指标，仅当指标改善时才保存模型到磁盘。这避免了训练后期过拟合导致最佳模型被覆盖的尴尬，配合 EarlyStopping 使用效果最佳：EarlyStopping 决定何时停，ModelCheckpoint 决定留下哪一份。

```r
callback_model_checkpoint(
  filepath = "best_model.h5",
  monitor = "val_loss",
  save_best_only = TRUE,
  mode = "min"
)
```

### 学习率调度：动态调整步长

学习率过大无法收敛到最优，过小则浪费时间。ReduceLROnPlateau 在验证损失进入平台期时自动降低学习率，给模型一次跳出局部最优的机会。更复杂的调度如余弦退火、warmup 可通过自定义回调实现。学习率调度的核心思想是：训练前期用大学习率快速接近最优区域，后期用小学习率精调。

```r
callbacks_list <- list(
  callback_reduce_lr_on_plateau(
    monitor = "val_loss",
    factor = 0.5,        # 学习率乘以 0.5
    patience = 5,
    min_lr = 1e-6
  ),
  callback_early_stopping(patience = 15, restore_best_weights = TRUE)
)
```

:::tip
医学影像数据集往往只有几百张图，极易过拟合。一个常用的组合策略是：网络中段加 Dropout 0.3 到 0.5、卷积层后接 BatchNorm、L2 权重衰减 1e-4、ReduceLROnPlateau 配合 EarlyStopping。这一组合在小数据上通常能把过拟合压制到可控范围。
:::

### 数据增强：从有限样本中制造变化

图像数据增强通过对训练图做随机翻转、旋转、平移、缩放等几何变换，让模型见到同一类样本的多种变体，相当于人为扩充数据集。Keras 提供 `image_data_generator` 实现实时增强，每个 batch 在送入网络前先做随机变换。对于医学影像，旋转与平移通常合理，翻转则需谨慎——例如胸片左右翻转可能改变心脏位置，不一定符合诊断逻辑。

```r
datagen <- image_data_generator(
  rotation_range = 20,
  width_shift_range = 0.2,
  height_shift_range = 0.2,
  horizontal_flip = TRUE,
  fill_mode = "nearest"
)

# 训练时使用增强后的数据
history <- model %>% fit(
  datagen %>% flow_images_from_directory(
    "data/train",
    target_size = c(224, 224),
    batch_size = 32,
    class_mode = "binary"
  ),
  steps_per_epoch = 100,
  epochs = 50
)
```

:::warning
医学影像增强需遵循解剖学常识。乳腺钼靶、胸片可以水平翻转，因为左右两侧解剖结构对称；但心脏超声、消化道内镜等有明确方向性的影像不应随意翻转，否则会引入虚假样本。增强策略应与临床医生讨论后确定。
:::

## 1.7.5 卷积神经网络（CNN）

### 卷积层：从局部特征到全局语义

卷积神经网络的核心是卷积层。直觉上，一个卷积核就是一个小窗口，它在输入图像上从左到右、从上到下滑动，每滑到一个位置就与窗口内的像素做点积，得到一个标量输出。整张图扫完后形成一张特征图，反映了图像中哪些位置出现了该核所关心的局部模式。低层卷积核学到边缘和纹理，高层卷积核组合出更复杂的结构，比如器官轮廓或细胞形态。相比全连接层，卷积层有两个关键优势：参数共享（同一个核在整张图上复用）和平移不变性（特征在图像中的位置变化不影响识别）。

卷积层的三个核心参数是核大小（kernel_size）、步长（strides）和填充（padding）。核大小决定感受野，常用 3×3；步长决定滑动间距，默认为 1；填充分 same（输出尺寸与输入相同）和 valid（不补零，输出尺寸缩小）。

::: warning 浏览器中无法运行
以下代码使用了 `keras`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)

model <- keras_model_sequential() %>%
  layer_conv_2d(
    filters = 32,
    kernel_size = c(3, 3),
    strides = c(1, 1),
    padding = "same",
    activation = "relu",
    input_shape = c(128, 128, 3)
  )
```

### 池化层：下采样与不变性

池化层对特征图做下采样，减小尺寸并保留主要信息。MaxPooling 取窗口内最大值，对平移和形变有一定鲁棒性；AveragePooling 取平均值，更平滑。GlobalAveragePooling 把整张特征图压成一个标量，常用于替换全连接层以减少参数，同时避免过拟合。

```r
model <- keras_model_sequential() %>%
  layer_conv_2d(32, c(3, 3), activation = "relu", input_shape = c(128, 128, 3)) %>%
  layer_max_pooling_2d(pool_size = c(2, 2)) %>%
  layer_conv_2d(64, c(3, 3), activation = "relu") %>%
  layer_max_pooling_2d(pool_size = c(2, 2)) %>%
  layer_global_average_pooling_2d() %>%
  layer_dense(10, activation = "softmax")
```

:::note
CNN 的典型结构是 **conv → pool → conv → pool → 全连接**。每经过一次池化，特征图尺寸减半、通道数往往翻倍，这种尺寸减半与深度翻倍的设计在 VGG、ResNet 等经典网络中反复出现。
:::

### 经典架构概览

LeNet 是最早的实用 CNN，由 Yann LeCun 在 1998 年提出，用于手写数字识别，包含两层卷积加两层全连接。VGG16 在 2014 年提出，用统一的 3×3 卷积堆叠到 16 层，证明了深度对性能的关键作用。ResNet 引入残差连接，让训练上百层的网络成为可能，至今仍是图像分类的强基线。在医学影像任务中，直接从零训练深层 CNN 几乎不可行——标注数据稀缺、计算资源有限，因此迁移学习成为主流方案。

### 迁移学习：站在巨人的肩膀上

迁移学习把在 ImageNet 等大规模数据集上预训练的模型作为特征提取器，仅训练顶部的分类层。这种做法利用了预训练模型在浅层学到的通用视觉特征（边缘、纹理），把数据需求量降到几百张图。Keras 内置了 VGG16、ResNet50、EfficientNet 等模型，通过 `application_vgg16` 等函数加载。

```r
# 加载预训练 VGG16，去掉顶层分类器，冻结卷积基
base_model <- application_vgg16(
  weights = "imagenet",
  include_top = FALSE,
  input_shape = c(224, 224, 3)
)
freeze_weights(base_model)

# 添加自定义分类头
model <- keras_model_sequential() %>%
  base_model %>%
  layer_global_average_pooling_2d() %>%
  layer_dense(256, activation = "relu") %>%
  layer_dropout(0.5) %>%
  layer_dense(1, activation = "sigmoid")

model %>% compile(
  optimizer = optimizer_adam(lr = 1e-4),
  loss = "binary_crossentropy",
  metrics = c("accuracy", metric_auc())
)
```

### 微调：解冻部分层

当数据足够多、与原任务分布差异较大时，可以解冻预训练模型的顶层卷积块，用很小的学习率（如 1e-5）联合微调。底层通用特征保持冻结，高层特化特征则针对新任务调整。微调要在新分类头训练收敛之后进行，否则随机初始化的梯度会破坏预训练权重。

```r
# 解冻最后一个卷积块
unfreeze_weights(base_model, from = "block5_conv1")
model %>% compile(
  optimizer = optimizer_adam(lr = 1e-5),   # 学习率显著减小
  loss = "binary_crossentropy",
  metrics = c("accuracy")
)
```

:::warning
微调时学习率必须远小于训练新分类头时的值，否则会快速破坏预训练权重。常见做法是从 1e-5 起步，配合 EarlyStopping 监控验证损失。一旦发现训练损失快速下降而验证损失上升，应立即停止并降低学习率。
:::

### 1D CNN：序列数据的卷积

并非所有卷积都是二维的。一维卷积沿序列方向滑动，常用于基因序列 motif 检测、心电波形分类、时间序列预测。1D CNN 比 RNN 训练更快，在某些任务上性能相当甚至更好，是处理长序列的优先候选。

```r
# DNA 序列分类：长度 1000，one-hot 编码为 4 通道
model <- keras_model_sequential() %>%
  layer_conv_1d(64, kernel_size = 8, activation = "relu",
                input_shape = c(1000, 4)) %>%
  layer_max_pooling_1d(pool_size = 4) %>%
  layer_conv_1d(128, kernel_size = 8, activation = "relu") %>%
  layer_global_max_pooling_1d() %>%
  layer_dense(64, activation = "relu") %>%
  layer_dense(1, activation = "sigmoid")
```

### CNN 可视化：理解模型在看什么

黑箱模型难以获得临床信任。特征图可视化展示每一层看到了什么模式；Grad-CAM 通过反向梯度定位输入图像中对预测贡献最大的区域，常用于在病灶切片上叠加热力图，帮助医生理解模型决策依据。Keras 提供 `keras::activation_model` 提取中间层输出，Grad-CAM 则需要手工计算梯度。下例展示如何提取某一卷积层的输出：

```r
# 提取前两层卷积的输出
layer_outputs <- lapply(model$layers[1:4], function(l) l$output)
activation_model <- keras_model(model$input, layer_outputs)
activations <- activation_model %>% predict(img_array)

# activations[[1]] 即第一层卷积的特征图
# 形状为 (1, height, width, filters)
dim(activations[[1]])
```

:::tip
Grad-CAM 在医学影像分类中具有双重价值：既是模型解释工具，也是质控手段。如果热力图集中在病灶以外的区域（如胸片上的引流管、文字标注），说明模型可能学到的是数据偏置而非真正的病理特征，此时应回到数据收集阶段修正。
:::

## 1.7.6 循环神经网络（RNN）与序列建模

### 为什么需要 RNN

前馈网络假设输入是独立的、固定长度的，但医学数据中大量任务带有时间维度：心电图、脑电信号、电子病历事件序列、患者随访记录。这类数据中当前时刻的输出依赖于过去的若干时刻，前馈网络无法直接建模这种依赖。循环神经网络通过在网络中引入时间反馈连接，让隐藏状态在每个时间步接收当前输入与上一步的隐藏状态，从而保留对历史的记忆。

### SimpleRNN：最朴素的循环结构

SimpleRNN 在每个时间步的计算为 $h_t = \tanh(W_x x_t + W_h h_{t-1} + b)$，把当前输入与上一步隐藏状态拼接后线性变换再激活。这种结构在长序列上会出现梯度消失或爆炸，难以捕捉远距离依赖，因此在实际任务中较少单独使用，更多作为理解 LSTM 的铺垫。

::: warning 浏览器中无法运行
以下代码使用了 `keras`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)

# SimpleRNN 处理长度 100 的时间序列，每步 8 维特征
model <- keras_model_sequential() %>%
  layer_simple_rnn(units = 64, input_shape = c(100, 8)) %>%
  layer_dense(1)
```

### LSTM 与 GRU：门控机制

LSTM（长短期记忆网络）通过引入门控机制解决了 SimpleRNN 的长期依赖问题。它有三个门：遗忘门决定保留多少旧记忆、输入门决定写入多少新信息、输出门决定输出多少。这种机制让梯度能够在长序列中稳定流动。GRU 是 LSTM 的简化版，合并了遗忘门与输入门，参数更少、训练更快，在多数任务上效果与 LSTM 接近。

```r
model <- keras_model_sequential() %>%
  layer_lstm(units = 64, input_shape = c(100, 8)) %>%
  layer_dense(1)

# GRU 版本
model_gru <- keras_model_sequential() %>%
  layer_gru(units = 64, input_shape = c(100, 8)) %>%
  layer_dense(1)
```

:::tip
没有明确证据表明 LSTM 一定优于 GRU。实际项目建议两者都试，按验证集指标选择。如果计算资源紧张，GRU 由于参数更少往往更快收敛。
:::

### 双向 RNN：同时利用过去与未来

标准 RNN 只用过去信息预测当前，但许多任务中未来信息同样有用——比如对整段心电信号做异常检测时，后续波形也能帮助判断当前点是否异常。双向 RNN 同时运行一个正向和一个反向 RNN，把两者隐状态拼接作为输出。代价是无法用于真正的在线预测，因为它需要等待整个序列到达后才能给出结果。

```r
model <- keras_model_sequential() %>%
  bidirectional(
    layer_lstm(units = 64, return_sequences = TRUE),
    input_shape = c(100, 8)
  ) %>%
  bidirectional(layer_lstm(units = 32)) %>%
  layer_dense(1)
```

### 堆叠 RNN 与 return_sequences

堆叠多层 RNN 能加深模型，提升表达能力。但 Keras 默认 RNN 层只返回最后一个时间步的输出，若要叠加第二层 RNN，必须设置 `return_sequences = TRUE` 让第一层返回所有时间步的输出，作为下一层的输入序列。最后一层 RNN 通常设为 `FALSE`，仅返回最终隐藏状态用于下游任务。

```r
model <- keras_model_sequential() %>%
  layer_lstm(64, return_sequences = TRUE, input_shape = c(100, 8)) %>%
  layer_lstm(32) %>%
  layer_dense(1)
```

### 时间序列预测案例

下面以一个合成的时间序列为例，演示用 LSTM 做单步预测：给定过去 50 个时间点，预测下一个点。先准备滑动窗口数据，再训练模型。这种单步预测结构是构建多步预测、序列到序列模型的基础。

```r
# 构造正弦波 + 噪声
t <- seq(0, 100, length.out = 1000)
series <- sin(t) + rnorm(length(t), sd = 0.1)

# 构造滑动窗口样本
make_windows <- function(series, window = 50) {
  n <- length(series)
  x <- t(sapply(1:(n - window), function(i) series[i:(i + window - 1)]))
  y <- series[(window + 1):n]
  list(
    x = array(x, dim = c(dim(x), 1)),
    y = y
  )
}
data <- make_windows(series, window = 50)

model <- keras_model_sequential() %>%
  layer_lstm(32, input_shape = c(50, 1)) %>%
  layer_dense(1)
model %>% compile(optimizer = "adam", loss = "mse")
history <- model %>% fit(data$x, data$y, epochs = 20, batch_size = 32,
                         validation_split = 0.2)
```

:::warning
时间序列数据不能随机打乱再做 `validation_split`，否则验证集会包含训练集的未来信息，导致指标虚高。应按时间顺序切分，例如前 80% 训练、后 20% 验证。`fit()` 中可设置 `shuffle = FALSE` 关闭随机打乱。
:::

### 可变长度序列：掩码与填充

电子病历的事件序列长度因患者而异，必须先填充（padding）到统一长度才能批量喂入网络。`layer_masking` 会标记填充位置为零的部分，让 RNN 在计算时忽略这些时间步，不污染隐藏状态。这对于含短序列的多数 batch 尤为重要，否则填充零会被 RNN 误当成真实信号。

```r
model <- keras_model_sequential() %>%
  layer_masking(mask_value = 0, input_shape = c(NA, 8)) %>%
  layer_lstm(64) %>%
  layer_dense(1, activation = "sigmoid")
```

:::note
`input_shape = c(NA, 8)` 中的 `NA` 表示时间维度可变，这在 R 中是少数能直接接受变长输入的方式之一。配合 `layer_masking` 后，同一模型可以处理长度从 10 到 500 不等的序列，无需为每种长度单独建模。
:::

## 1.7.7 自编码器与表示学习

### 自编码器：用自己的结构压缩自己

自编码器由编码器和解码器两部分组成。编码器把输入压缩成一个低维向量（瓶颈），解码器再从瓶颈向量重建原始输入。训练目标是让重建尽可能接近输入，因此瓶颈向量必须保留输入最重要的信息——这就完成了无监督的特征学习。与 PCA 不同，自编码器可以是非线性的，能够捕捉更复杂的结构，在医学数据中常用于降维、降噪和异常检测。

### 欠完备自编码器：用瓶颈维度控制信息量

瓶颈维度小于输入维度时，称为欠完备自编码器。瓶颈越窄，强制压缩越强，学到特征越抽象；过窄则会丢失关键信息，重建质量下降。瓶颈维度的选择类似 PCA 中主成分数，需要根据任务调参。在医学场景下，瓶颈维度常设为 16 到 64，既能压缩高维表达数据，又保留了细胞类型差异。

::: warning 浏览器中无法运行
以下代码使用了 `keras`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)

input_dim <- 100
encoding_dim <- 32

input <- layer_input(shape = c(input_dim))
encoded <- input %>%
  layer_dense(64, activation = "relu") %>%
  layer_dense(encoding_dim, activation = "relu")

decoded <- encoded %>%
  layer_dense(64, activation = "relu") %>%
  layer_dense(input_dim, activation = "sigmoid")

autoencoder <- keras_model(input, decoded)
autoencoder %>% compile(optimizer = "adam", loss = "mse")

# 单独取出编码器模型，用于特征提取
encoder <- keras_model(input, encoded)
```

### 去噪自编码器：从损坏中恢复

去噪自编码器的训练方式略有不同：先在输入上人为加噪（高斯噪声或随机置零），再让模型重建干净的原始输入。这种训练让模型学会区分信号与噪声，对噪声具有更强的鲁棒性。在医学影像中，去噪自编码器可以用于低剂量 CT 降噪、MRI 缺失重建，相比传统滤波方法能保留更多细节结构。

```r
# 加入高斯噪声的输入
noisy_input <- layer_input(shape = c(input_dim))
x <- noisy_input %>%
  layer_gaussian_noise(stddev = 0.5)

encoded <- x %>%
  layer_dense(64, activation = "relu") %>%
  layer_dense(32, activation = "relu")

decoded <- encoded %>%
  layer_dense(64, activation = "relu") %>%
  layer_dense(input_dim, activation = "sigmoid")

denoise_ae <- keras_model(noisy_input, decoded)
denoise_ae %>% compile(optimizer = "adam", loss = "mse")
```

### 变分自编码器：从确定性到概率

变分自编码器（VAE）把瓶颈向量从确定的实数变成概率分布：编码器输出均值和方差，从中采样得到瓶颈向量再解码。这种结构让 VAE 在重建输入之外，具备生成与训练数据分布相似的新样本的能力，是生成模型的代表之一。重参数化技巧（reparameterization trick）把采样操作改写为可微形式，使梯度能够反向传播通过随机节点，这是 VAE 能用反向传播训练的关键。

```r
# VAE 编码器：输出 z_mean 与 z_log_var
input <- layer_input(shape = c(input_dim))
h <- layer_dense(input, 64, activation = "relu")
z_mean <- layer_dense(h, encoding_dim)
z_log_var <- layer_dense(h, encoding_dim)

# 重参数化采样
sampling <- function(args) {
  c(z_mean, z_log_var) %<-% args
  epsilon <- k_random_normal(shape = k_shape(z_mean))
  z_mean + k_exp(z_log_var / 2) * epsilon
}
z <- layer_lambda(list(z_mean, z_log_var), sampling)

# 解码器
decoder_input <- layer_input(shape = c(encoding_dim))
decoded <- decoder_input %>%
  layer_dense(64, activation = "relu") %>%
  layer_dense(input_dim, activation = "sigmoid")

encoder <- keras_model(input, z)
decoder <- keras_model(decoder_input, decoded)
vae_output <- decoder(encoder(input))
vae <- keras_model(input, vae_output)
```

:::note
VAE 的损失由重建项与 KL 散度项组成，前者衡量重建质量，后者约束隐空间分布接近标准正态。两项权重需要平衡，KL 权重过大会导致重建模糊，过小则失去生成能力。常用做法是给 KL 项乘以 0.5 到 1 之间的系数，并通过实验调整。
:::

### 应用：降维与异常检测

自编码器最常见的两类应用是降维和异常检测。降维时把编码器部分单独取出，瓶颈向量即可作为低维特征，用于后续聚类或可视化，类似非线性 PCA。异常检测则利用重建误差：用正常样本训练自编码器，模型只学到正常数据的模式，遇到异常样本时重建误差会显著增大，据此设定阈值即可标记异常。这种无监督思路在罕见病筛查、设备故障预警中尤为实用，因为异常样本往往稀缺难以收集。

```r
# 计算每个样本的重建误差
reconstructions <- autoencoder %>% predict(x_test)
mse <- rowMeans((x_test - reconstructions)^2)

# 取 95% 分位数作为阈值
threshold <- quantile(mse, 0.95)
anomalies <- which(mse > threshold)
```

:::tip
异常检测的阈值不一定要用统计分位数确定。若有一小批标注的异常样本，应直接在异常样本上观察重建误差分布，选择能区分两者的阈值。在心电图异常检测中，常结合专家标注确定阈值，再在独立测试集上验证。
:::

### 在单细胞 RNA-Seq 降噪中的应用

单细胞 RNA-Seq 数据具有稀疏、高噪声、高维的特点，dropout 事件（基因表达本应存在却未被检测到）普遍存在。自编码器可以在细胞维度上学习低维表示，同时通过解码器补全被 drop 的表达值，实现降噪与降维的统一。SCVIS、DCA 等方法都基于自编码器，已成为单细胞分析流程中常用的预处理步骤。下面给出一个简化版的降噪自编码器应用于模拟单细胞数据：

```r
# 假设 expr 是 cells × genes 的 log 归一化表达矩阵
input_dim <- ncol(expr)

input <- layer_input(shape = c(input_dim))
encoded <- input %>%
  layer_dense(128, activation = "relu") %>%
  layer_dense(32, activation = "relu")     # 瓶颈维度

decoded <- encoded %>%
  layer_dense(128, activation = "relu") %>%
  layer_dense(input_dim, activation = "relu")

ae <- keras_model(input, decoded)
ae %>% compile(optimizer = "adam", loss = "mse")
ae %>% fit(expr, expr, epochs = 50, batch_size = 64, validation_split = 0.1)

# 提取降噪后的表达
denoised <- ae %>% predict(expr)

# 提取细胞低维表示用于后续聚类
encoder <- keras_model(input, encoded)
cell_embedding <- encoder %>% predict(expr)
```

:::tip
对于真实单细胞数据，建议使用专门的包如 DCA（Deep Count Autoencoder），它针对负二项分布设计了合适的损失函数，比直接用 MSE 的自编码器更符合 scRNA-Seq 数据特性。若仅做降维可视化，scVI、scanpy 等 Python 工具配合 reticulate 调用也是常见方案。
:::

## 本节小结

本节从神经元的数学定义出发，依次介绍了张量、层、激活函数、损失函数、优化器与评估指标等核心组件，然后用 Keras 演示了顺序模型与函数式 API 的搭建流程，并通过 Dropout、BatchNormalization、早停、迁移学习等技巧应对过拟合问题。卷积神经网络部分聚焦于医学影像的迁移学习与微调，循环神经网络部分覆盖了 LSTM、GRU、双向结构与时间序列预测，自编码器部分则延伸到去噪、变分自编码器与单细胞降噪应用。下一节将进入深度学习（下），讨论注意力机制、Transformer 以及更面向生物医学的实战项目。
