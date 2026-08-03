---
title: 1.8 深度学习（下）：生成模型与前沿架构
sidebar:
  order: 8
---
# 1.8 深度学习（下）：生成模型与前沿架构

上册围绕判别式模型展开，关注如何把输入映射到标签。本册转向生成式模型与前沿架构，关注如何让网络产生新的样本、理解长程依赖关系、处理图结构数据。生成对抗网络与 Transformer 已经改变了医学图像合成与生物序列建模的工具链，图神经网络则把深度学习推广到蛋白质相互作用、代谢网络等非欧几里得数据上。本节同时介绍 torch 包的进阶用法、模型调优与解释工具、以及把训练好的模型部署为可调用服务的方法，覆盖从研究原型到生产环境的完整链路。

## 1.8.1 生成对抗网络（GAN）

判别式模型回答样本属于哪一类，生成式模型回答样本本身长什么样。生成对抗网络用一种巧妙的方式把生成问题转化为博弈问题：训练两个网络相互对抗，一个负责造假，一个负责识假，二者在交替训练中共同进化。这种机制让 GAN 能够学习复杂的数据分布，并在医学图像合成、数据增强等任务中起作用。

### 生成器与判别器的博弈直觉

生成器接收一个随机噪声向量，输出一张伪造样本。判别器接收样本（真实或伪造），输出一个概率值表示真伪。生成器的目标是让判别器把伪造样本判为真，判别器的目标是把伪造样本判为假。当生成器足够强时，判别器无法区分真伪，输出接近 0.5，此时生成器学到了真实数据分布。

这种博弈对应一个极小极大优化目标。固定判别器时，生成器希望最小化判别器识别伪造样本的能力；固定生成器时，判别器希望最大化识别能力。两者交替更新，理论上收敛到纳什均衡。

下面是 GAN 损失函数的数学表达，理解它对调试训练过程很重要。

```
min_G max_D V(D, G) = E_x[log D(x)] + E_z[log(1 - D(G(z)))]
```

其中 x 是真实样本，z 是噪声，G(z) 是生成样本，D(·) 是判别器输出。

::: note 博弈的脆弱性
GAN 的训练动态比判别模型复杂得多。判别器过强时生成器梯度消失，过弱时生成器学不到有用信号。医学数据维度高、样本量小，更容易出现训练崩溃。实践中需要仔细调节学习率、批次大小与网络容量，必要时使用 WGAN、谱归一化等稳定化技术。
:::

### 在 R 中实现 DCGAN

DCGAN 把卷积网络引入 GAN，生成器用反卷积把噪声上采样为图像，判别器用标准卷积下采样判别真伪。下面是一个处理 64×64 灰度医学图像的 DCGAN 骨架，使用 keras 包构建。

先定义生成器，把 100 维噪声逐步上采样为 64×64 单通道图像。

::: warning 浏览器中无法运行
以下代码使用了 `keras`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)

latent_dim <- 100

generator <- keras_model_sequential(name = "generator") %>%
  # 输入：100维噪声 -> 4x4x256
  layer_dense(units = 4 * 4 * 256, use_bias = FALSE,
              input_shape = c(latent_dim)) %>%
  layer_batch_normalization() %>%
  layer_activation_leaky_relu() %>%
  layer_reshape(target_shape = c(4, 4, 256)) %>%
  
  # 上采样到 8x8x128
  layer_conv_2d_transpose(filters = 128, kernel_size = c(4, 4),
                          strides = c(2, 2), padding = "same",
                          use_bias = FALSE) %>%
  layer_batch_normalization() %>%
  layer_activation_leaky_relu() %>%
  
  # 上采样到 16x16x64
  layer_conv_2d_transpose(filters = 64, kernel_size = c(4, 4),
                          strides = c(2, 2), padding = "same",
                          use_bias = FALSE) %>%
  layer_batch_normalization() %>%
  layer_activation_leaky_relu() %>%
  
  # 上采样到 32x32x32
  layer_conv_2d_transpose(filters = 32, kernel_size = c(4, 4),
                          strides = c(2, 2), padding = "same",
                          use_bias = FALSE) %>%
  layer_batch_normalization() %>%
  layer_activation_leaky_relu() %>%
  
  # 上采样到 64x64x1，tanh把输出压缩到[-1, 1]
  layer_conv_2d_transpose(filters = 1, kernel_size = c(4, 4),
                          strides = c(2, 2), padding = "same",
                          use_bias = FALSE, activation = "tanh")

summary(generator)
```

再定义判别器，标准卷积栈输出单个 sigmoid 概率。

```r
discriminator <- keras_model_sequential(name = "discriminator") %>%
  layer_conv_2d(filters = 32, kernel_size = c(4, 4),
                strides = c(2, 2), padding = "same",
                input_shape = c(64, 64, 1)) %>%
  layer_activation_leaky_relu() %>%
  layer_dropout(rate = 0.3) %>%
  
  layer_conv_2d(filters = 64, kernel_size = c(4, 4),
                strides = c(2, 2), padding = "same") %>%
  layer_activation_leaky_relu() %>%
  layer_dropout(rate = 0.3) %>%
  
  layer_conv_2d(filters = 128, kernel_size = c(4, 4),
                strides = c(2, 2), padding = "same") %>%
  layer_activation_leaky_relu() %>%
  layer_dropout(rate = 0.3) %>%
  
  layer_flatten() %>%
  layer_dense(units = 1, activation = "sigmoid")

summary(discriminator)
```

### 对抗训练循环

GAN 没有现成的高层 fit 接口，需要手动编写训练循环。每一步先更新判别器，再更新生成器。下面是训练循环的核心代码，使用 keras 的低层 API 与 gradient_tape。

```r
# 编译两个模型：判别器用标准二分类，生成器通过组合模型训练
discriminator %>% compile(
  optimizer = optimizer_adam(learning_rate = 2e-4, beta_1 = 0.5),
  loss = "binary_crossentropy",
  metrics = c("accuracy")
)

# 组合模型：把生成器与判别器串起来，训练时只更新生成器
gan_input <- layer_input(shape = c(latent_dim))
gan_output <- discriminator(generator(gan_input))
gan <- keras_model(gan_input, gan_output)
discriminator$trainable <- FALSE  # 训练生成器时冻结判别器
gan %>% compile(
  optimizer = optimizer_adam(learning_rate = 2e-4, beta_1 = 0.5),
  loss = "binary_crossentropy"
)

batch_size <- 64
epochs <- 200

for (epoch in seq_len(epochs)) {
  for (batch in 1:n_batches) {
    real_images <- get_batch(real_dataset, batch_size)  # 真实图像批次
    noise <- matrix(runif(batch_size * latent_dim, -1, 1),
                    nrow = batch_size, ncol = latent_dim)
    fake_images <- generator %>% predict(noise, verbose = 0)
  
    # 标签平滑：真实用0.9，伪造用0.1
    real_labels <- matrix(0.9, nrow = batch_size, ncol = 1)
    fake_labels <- matrix(0.1, nrow = batch_size, ncol = 1)
  
    # 训练判别器
    d_loss_real <- discriminator %>% train_on_batch(real_images, real_labels)
    d_loss_fake <- discriminator %>% train_on_batch(fake_images, fake_labels)
  
    # 训练生成器：希望判别器把伪造样本判为真
    noise <- matrix(runif(batch_size * latent_dim, -1, 1),
                    nrow = batch_size, ncol = latent_dim)
    misleading_labels <- matrix(1, nrow = batch_size, ncol = 1)
    g_loss <- gan %>% train_on_batch(noise, misleading_labels)
  }
  cat(sprintf("Epoch %d  D_real=%.3f D_fake=%.3f  G=%.3f\n",
              epoch, d_loss_real[1], d_loss_fake[1], g_loss[1]))
}
```

::: warning 标签平滑
真实标签用 0.9 而非 1.0，伪造标签用 0.1 而非 0.0，称为单边标签平滑。它能防止判别器过早达到饱和，给生成器留下可学习的梯度信号。这是 DCGAN 训练中成本最低、效果最显著的稳定化技巧之一。
:::

### 条件 GAN（cGAN）

普通 GAN 生成的样本不可控。条件 GAN 在生成器与判别器输入端同时引入条件信息（如类别标签），让生成过程服从指定约束。生成器接收噪声加类别标签，判别器接收图像加类别标签，二者都通过拼接或嵌入层融合条件信息。

下面是 cGAN 的关键改动：用嵌入层把类别标签映射为稠密向量，再与噪声拼接。

```r
n_classes <- 5
label_embedding_dim <- 50

# 生成器：噪声 + 标签嵌入
gen_noise <- layer_input(shape = c(latent_dim), name = "noise")
gen_label <- layer_input(shape = c(1), dtype = "int32", name = "label")
label_emb <- gen_label %>%
  layer_embedding(input_dim = n_classes, output_dim = label_embedding_dim) %>%
  layer_flatten()

gen_input <- layer_concatenate(list(gen_noise, label_emb))
gen_output <- generator(gen_input)
cgenerator <- keras_model(list(gen_noise, gen_label), gen_output)

# 判别器：图像 + 标签嵌入
disc_image <- layer_input(shape = c(64, 64, 1), name = "image")
disc_label <- layer_input(shape = c(1), dtype = "int32", name = "label")
disc_label_emb <- disc_label %>%
  layer_embedding(input_dim = n_classes, output_dim = label_embedding_dim) %>%
  layer_dense(units = 64 * 64) %>%
  layer_reshape(target_shape = c(64, 64, 1))

disc_input <- layer_concatenate(list(disc_image, disc_label_emb), axis = 3L)
disc_output <- discriminator(disc_input)
cdiscriminator <- keras_model(list(disc_image, disc_label), disc_output)
```

### 模式崩溃问题

GAN 训练中常见的失败模式是模式崩溃：生成器发现某几种样本能骗过判别器，就把所有噪声都映射到这几种样本上，丧失多样性。医学图像生成中，模式崩溃会让合成数据高度同质，失去增强训练集的意义。

缓解模式崩溃的常用策略包括：使用 WGAN 或 WGAN-GP 把 JS 散度替换为 Wasserstein 距离；在判别器中加入谱归一化约束其 Lipschitz 常数；使用 minibatch discrimination 让判别器比较批次内样本差异；引入经验缓冲区存放历史生成样本。

::: tip WGAN-GP 在 R 中的选择
WGAN-GP 需要计算梯度惩罚项，对应 `gradient_penalty` 自定义损失。keras 包在 R 中支持自定义损失函数，但需要通过 `backend` 接口调用张量运算。如果项目对训练稳定性要求高，优先考虑切换到 torch 包，它的自动微分机制让自定义损失编写更直观。
:::

### 医学图像生成与数据增强

医学影像数据集往往类别不平衡，少数病灶样本不足以训练稳健的判别模型。GAN 可以合成少数类样本扩充训练集，缓解不平衡。常见做法是用 cGAN 按病灶类别生成合成影像，与真实样本混合后训练下游分类器。

需要注意，合成样本必须经过医学专家审核确认解剖合理性，否则可能引入虚假模式导致分类器在真实数据上表现下降。合成数据更适合作为辅助增强手段，不能完全替代真实数据。

## 1.8.2 注意力机制与 Transformer

循环网络通过隐状态串行处理序列，长距离依赖关系在反向传播中容易衰减。注意力机制提供了一种直接跨越任意距离的通路：每个位置可以动态关注序列中所有其他位置，按相关性加权聚合信息。Transformer 把这一机制发挥到极致，完全摒弃循环结构，仅靠注意力堆叠出强大模型，成为当前生物序列建模的主流架构。

### 注意力基本思想：查询、键、值

注意力机制借用数据库检索的概念。给定一个查询向量 q，与一组键值对 (k_i, v_i)，注意力输出是所有值向量的加权和，权重由查询与键的相似度决定。相似度通常用点积度量，经过 softmax 归一化为概率分布。

直观理解：查询像是一个提问，键是数据库中每条记录的索引，值是记录内容。提问与索引越匹配，对应内容被读取的权重越大。

下面是单次注意力的计算公式，理解它对实现 Transformer 层是必要的。

```
Attention(Q, K, V) = softmax(Q · K^T / sqrt(d_k)) · V
```

其中 d_k 是键向量维度，sqrt(d_k) 用于稳定 softmax 的梯度。

### 自注意力计算

自注意力指查询、键、值都来自同一输入序列。每个位置同时作为查询者与被查询者，序列内部任意两位置可以直接交互。这种机制让 Transformer 在一层之内就能捕捉长程依赖，等价于循环网络多层叠加的效果。

下面是自注意力的 R 实现，用 keras 后端张量运算展示计算过程。

::: warning 浏览器中无法运行
以下代码使用了 `keras`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)
K <- backend()

# 输入形状：(batch_size, seq_len, embed_dim)
self_attention <- function(inputs, d_k) {
  # 三个独立线性变换生成 Q、K、V
  Q <- inputs %>% layer_dense(units = d_k, use_bias = FALSE)
  K_mat <- inputs %>% layer_dense(units = d_k, use_bias = FALSE)
  V <- inputs %>% layer_dense(units = d_k, use_bias = FALSE)
  
  # 注意力权重：Q · K^T / sqrt(d_k)
  scores <- K_batch_dot(Q, K_mat, axes = 2L) / sqrt(d_k)
  weights <- scores %>% layer_activation_softmax(axis = -1L)
  
  # 加权求和
  output <- K_batch_dot(weights, V, axes = 2L)
  output
}
```

::: note 缩放因子的作用
点积的方差随 d_k 线性增长。d_k 较大时点积值会落入 softmax 的饱和区，梯度接近零。除以 sqrt(d_k) 把方差控制回 1 附近，保持梯度健康。这是 Transformer 实现中容易被忽略的细节，去掉缩放会让深层模型难以训练。
:::

### 多头注意力

单头注意力一次只能学习一种关注模式。多头注意力把 Q、K、V 投影到多个子空间，每个子空间独立计算注意力，最后拼接输出。这相当于让模型同时从多个视角建模序列内部关系，例如一个头关注语法依赖，另一个头关注语义相似。

下面是多头注意力的实现骨架，使用 keras 的子类化层。

```r
multi_head_attention <- R6::R6Class(
  classname = "MultiHeadAttention",
  inherit = keras$layers$Layer,
  public = list(
    num_heads = NULL,
    d_k = NULL,
    wq = NULL, wk = NULL, wv = NULL, wo = NULL,
  
    initialize = function(num_heads, d_k) {
      self$num_heads <- num_heads
      self$d_k <- d_k
    },
  
    build = function(input_shape) {
      embed_dim <- input_shape[[3]]
      self$wq <- keras$layers$Dense(self$num_heads * self$d_k)
      self$wk <- keras$layers$Dense(self$num_heads * self$d_k)
      self$wv <- keras$layers$Dense(self$num_heads * self$d_k)
      self$wo <- keras$layers$Dense(embed_dim)
    },
  
    call = function(inputs, training = FALSE) {
      # 此处省略头维度拆分与注意力计算的细节
      # 输出再经 wo 线性投影回 embed_dim
    }
  )
)
```

### 位置编码

自注意力本身对位置不敏感：打乱输入顺序得到的输出只是元素重排，模型并不知道哪个位置在前哪个在后。位置编码为每个位置附加一个位置相关的向量，让注意力计算时能感知顺序信息。

原始 Transformer 用正弦余弦函数生成位置编码，不同频率对应不同位置周期。

```r
positional_encoding <- function(seq_len, embed_dim) {
  position <- array(seq_len) - 1
  div_term <- exp(log(10000) * (2 * (array(embed_dim / 2) - 1)) / embed_dim)
  
  pe <- matrix(0, nrow = seq_len, ncol = embed_dim)
  for (i in seq_len) {
    for (j in seq_len(embed_dim / 2)) {
      pe[i, 2 * j - 1] <- sin(position[i] / div_term[j])
      pe[i, 2 * j]     <- cos(position[i] / div_term[j])
    }
  }
  pe
}
```

::: tip 可学习的位置嵌入
除正弦余弦编码外，更常见的做法是把位置当作词表，用 `layer_embedding` 让模型自己学习每个位置的嵌入向量。这种方式更灵活，但需要预设最大序列长度。生物序列任务中，最大长度通常由基因或蛋白质序列长度决定。
:::

### Transformer 编码器与解码器

完整 Transformer 由编码器栈与解码器栈组成。编码器每层包含多头自注意力与前馈网络，并配残差连接与层归一化。解码器额外多一个跨注意力子层，关注编码器输出。BERT 只用编码器，适合理解类任务；GPT 只用解码器，适合生成类任务。

下面是编码器单层的 R 实现骨架。

```r
transformer_encoder_block <- function(embed_dim, num_heads, dff, dropout_rate = 0.1) {
  # 接收形状 (batch, seq_len, embed_dim)
  function(inputs) {
    # 子层1：多头自注意力 + 残差 + LayerNorm
    attn_output <- inputs %>% 
      layer_multi_head_attention(num_heads = num_heads,
                                  key_dim = embed_dim %/% num_heads,
                                  dropout = dropout_rate)
    attn_output <- layer_add(list(inputs, attn_output))
    attn_output <- layer_layer_normalization(epsilon = 1e-6)(attn_output)
  
    # 子层2：前馈网络（两层全连接）+ 残差 + LayerNorm
    ffn_output <- attn_output %>%
      layer_dense(units = dff, activation = "relu") %>%
      layer_dense(units = embed_dim) %>%
      layer_dropout(rate = dropout_rate)
    output <- layer_add(list(attn_output, ffn_output))
    output <- layer_layer_normalization(epsilon = 1e-6)(output)
    output
  }
}
```

### BERT 与 GPT 的 R 接口

预训练 Transformer 模型如 BERT、GPT 在 Hugging Face Transformers 中有完整实现。R 用户通过 reticulate 调用 Python 接口，能直接加载预训练权重做下游任务。

下面展示如何通过 reticulate 加载 BERT 模型并提取文本特征。

::: warning 浏览器中无法运行
以下代码使用了 `reticulate`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(reticulate)

# 确保 Python 环境中已安装 transformers
# reticulate::py_install("transformers", pip = TRUE)
transformers <- import("transformers")
torch <- import("torch")

# 加载预训练 BERT 与分词器
tokenizer <- transformers$AutoTokenizer$from_pretrained("bert-base-uncased")
model <- transformers$AutoModel$from_pretrained("bert-base-uncased")

# 对一段医学文本提取上下文向量
text <- "BRCA1 mutations increase the risk of breast and ovarian cancer."
inputs <- tokenizer(text, return_tensors = "pt", truncation = TRUE,
                    max_length = 128, padding = TRUE)
with(torch$no_grad(), {
  outputs <- model(**inputs)
})
# 最后一层隐藏状态，形状 (1, seq_len, 768)
last_hidden <- outputs$last_hidden_state$detach()$numpy()
dim(last_hidden)
```

::: warning reticulate 调用的环境一致性
reticulate 调用的 Python 解释器必须与安装 transformers 的环境一致。可以用 `reticulate::py_config()` 检查当前使用的 Python 路径，用 `Sys.setenv(RETICULATE_PYTHON = "/path/to/python")` 指定解释器。环境不一致是最常见的报错来源，部署时尤其要注意。
:::

### 在基因序列与蛋白质结构预测中的应用

Transformer 在生物信息学中的应用日益广泛。基因序列可视为字符序列，把碱基 A/C/G/T 当作词表，用 Transformer 学习调控元件、剪接位点等模式。蛋白质序列类似，氨基酸作为词表，模型可以预测二级结构、接触图、功能位点。

AlphaFold2 把 Transformer 应用到结构预测的核心环节，通过 Evoformer 同时建模序列与成对特征，大幅提升预测精度。在 R 中虽然无法直接复现 AlphaFold2 全流程，但可以调用 ColabFold 的 REST 接口或本地部署版本，把序列预测任务的结果取回 R 做后续统计分析。

## 1.8.3 图神经网络（GNN）

图像与文本有规则的网格结构，但很多生物数据本质是图：蛋白质相互作用网络中蛋白质是节点、相互作用是边；代谢网络中代谢物是节点、反应是边。传统卷积无法直接处理这种非欧几里得结构，图神经网络为这类数据提供了专门的建模工具。

### 图数据表示

一个图由节点集合与边集合定义。在 R 中常用三种张量描述图：邻接矩阵表示节点连接关系、节点特征矩阵描述每个节点的属性、边特征矩阵描述每条边的属性。邻接矩阵在大图上稀疏，应使用稀疏张量或边列表存储以节省内存。

下面是构造简单图数据的代码，使用 igraph 配合矩阵表示。

```r
library(igraph)

# 5个节点的蛋白质相互作用网络
edges <- rbind(
  c(1, 2), c(1, 3), c(2, 3), c(3, 4), c(4, 5), c(2, 5)
)
g <- graph_from_edgelist(edges, directed = FALSE)

# 邻接矩阵
A <- as_adjacency_matrix(g, type = "both", sparse = TRUE)
print(A)

# 节点特征矩阵：5个蛋白质，每个20维特征
X <- matrix(rnorm(5 * 20), nrow = 5, ncol = 20)

# 边特征矩阵：每条边一个特征向量
E <- matrix(rnorm(6 * 8), nrow = 6, ncol = 8)
```

::: note 邻接矩阵归一化
直接用邻接矩阵做消息传递会让高度数节点的特征累加过大，导致数值不稳定。常用做法是对称归一化：Â = D^(-1/2) (A + I) D^(-1/2)，其中 D 是度矩阵，I 是单位阵。这一步在 GCN 中是默认操作。
:::

### 图卷积网络（GCN）原理

GCN 的核心思想是节点聚合邻居信息更新自身表示。每一层 GCN 把节点特征与归一化邻接矩阵相乘，再经过可学习的线性变换与激活函数。堆叠多层 GCN 后，每个节点能感知更远的邻居，形成多跳聚合。

下面是 GCN 单层的前向计算公式，简洁但信息量很大。

```
H^(l+1) = sigma(Â · H^(l) · W^(l))
```

其中 H^(l) 是第 l 层的节点特征矩阵，W^(l) 是该层权重，sigma 是激活函数，Â 是归一化邻接矩阵。

### 图注意力网络（GAT）

GCN 用度数归一化确定邻居权重，对所有邻居一视同仁。GAT 让模型自己学习每个邻居的注意力权重，与 Transformer 中的注意力思想一致。这种机制更适合邻居贡献差异较大的场景，例如蛋白质网络中强相互作用与弱相互作用的区分。

下面是 GAT 注意力权重的计算思路，权重通过节点对的相似度学习得到。

```
alpha_ij = softmax_j(LeakyReLU(a^T · [W·h_i || W·h_j]))
h_i' = sigma(sum_j alpha_ij · W · h_j)
```

其中 || 表示向量拼接，a 是注意力向量，alpha_ij 是节点 i 对邻居 j 的注意力权重。

### 在 R 中通过 reticulate 调用 DGL 或 PyTorch Geometric

R 生态目前没有成熟的图神经网络原生包。主流做法是通过 reticulate 调用 Python 的 DGL 或 PyTorch Geometric。两者都提供丰富的 GCN、GAT、GraphSAGE 等层实现，并在生物网络数据上有大量应用案例。

下面是通过 reticulate 调用 PyTorch Geometric 构建 GCN 的示例。

::: warning 浏览器中无法运行
以下代码使用了 `reticulate`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(reticulate)
# reticulate::py_install("torch_geometric", pip = TRUE)

torch <- import("torch")
torch_geometric <- import("torch_geometric")
nn <- import("torch.nn")
F <- import("torch.nn.functional")

GCN <- torch$nn$Module$define_class("GCN", list(
  initialize = function(self, in_dim, hidden_dim, out_dim) {
    self$conv1 <- torch_geometric$nn$GCNConv(in_dim, hidden_dim)
    self$conv2 <- torch_geometric$nn$GCNConv(hidden_dim, out_dim)
  },
  forward = function(self, x, edge_index) {
    x <- self$conv1(x, edge_index)
    x <- F$relu(x)
    x <- F$dropout(x, p = 0.5, training = self$training)
    x <- self$conv2(x, edge_index)
    F$log_softmax(x, dim = 1L)
  }
))

model <- GCN(in_dim = 20L, hidden_dim = 64L, out_dim = 5L)
optimizer <- torch$optim$Adam(model$parameters(), lr = 0.01)
```

::: warning R6 风格与 Python 类的差异
reticulate 调用 PyTorch 时，子类化 nn.Module 在 R 中语法较繁琐。复杂模型建议直接在 Python 文件中定义，R 端通过 `import_from_path` 加载，这样调试更方便，也能复用 Python 社区的代码示例。
:::

### 在生物网络中的应用

蛋白质相互作用网络中，GNN 可以预测蛋白质功能：已知部分蛋白质的功能标签，通过图聚合把标签传播到邻居节点，预测未知功能蛋白质。代谢网络中，GNN 可以预测酶-底物关系、代谢通量变化。药物发现领域，GNN 用于预测药物-靶点相互作用，把药物分子当作图（原子为节点、化学键为边），靶点蛋白质当作另一张图，做图对图匹配。

## 1.8.4 深度学习在生物信息学中的应用

前面的章节讨论了模型本身，本节把镜头转向具体任务。生物信息学的数据类型丰富，从一维序列到二维图像再到高维表达谱，每种数据都有合适的深度学习架构。理解任务与架构的匹配关系，比掌握某个具体模型更重要。

### 基因表达数据建模（RNA-Seq + keras）

RNA-Seq 数据是高维表格，每行一个样本，每列一个基因表达量。任务是肿瘤分型、生存预测、亚型发现等。深度学习在高维小样本场景容易过拟合，应配合强正则化或先用降维方法压缩特征。

下面是一个 RNA-Seq 多分类模型，输入是基因表达矩阵，输出是肿瘤亚型。

::: warning 浏览器中无法运行
以下代码使用了 `keras`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)

# 假设 expr 是 (n_samples, n_genes) 矩阵，labels 是整数标签
n_genes <- 2000
n_classes <- 4

rnaseq_model <- keras_model_sequential(name = "rnaseq_classifier") %>%
  layer_dense(units = 512, activation = "relu",
              kernel_regularizer = regularizer_l2(1e-4),
              input_shape = c(n_genes)) %>%
  layer_dropout(rate = 0.5) %>%
  layer_dense(units = 128, activation = "relu",
              kernel_regularizer = regularizer_l2(1e-4)) %>%
  layer_dropout(rate = 0.5) %>%
  layer_dense(units = n_classes, activation = "softmax")

rnaseq_model %>% compile(
  optimizer = optimizer_adam(learning_rate = 1e-3),
  loss = "sparse_categorical_crossentropy",
  metrics = c("accuracy")
)

history <- rnaseq_model %>% fit(
  x_train, y_train,
  validation_data = list(x_val, y_val),
  epochs = 100,
  batch_size = 32,
  callbacks = list(
    callback_early_stopping(monitor = "val_loss", patience = 10,
                            restore_best_weights = TRUE)
  )
)
```

::: tip 高维小样本的对策
基因表达数据典型场景是几百样本对几万基因。直接喂入深度模型容易过拟合。可行做法：先用 DESeq2 筛选差异表达基因、用 PCA 降到几十维、或用自编码器学习紧凑表示，再喂入下游模型。预训练表示在小样本上常常优于端到端训练。
:::

### 蛋白质序列分类（CNN/RNN）

蛋白质序列是字符序列，氨基酸字母表共 20 个标准字符加少量修饰字符。一维卷积网络能高效捕捉局部 motif，循环网络能建模长程依赖，Transformer 则兼顾两者。

下面是蛋白质序列分类的数据准备步骤，把氨基酸序列转为数值张量。

```r
# 氨基酸词表
aa_vocab <- c("A", "R", "N", "D", "C", "E", "Q", "G", "H", "I",
              "L", "K", "M", "F", "P", "S", "T", "W", "Y", "V")
aa_to_idx <- setNames(seq_along(aa_vocab) - 1L, aa_vocab)

encode_sequence <- function(seq, max_len = 512) {
  chars <- strsplit(substr(seq, 1, max_len), "")[[1]]
  idx <- sapply(chars, function(c) aa_to_idx[[c]])
  idx[is.na(idx)] <- 20L  # 未知字符映射到20
  c(idx, rep(0L, max_len - length(idx)))  # 补齐到max_len
}

# 批量编码
sequences <- c("MVLSPADKTNVKAAW", "MKWVTFISLLLLFSSAYSRGVFRRDTHK")
x_protein <- t(sapply(sequences, encode_sequence, max_len = 32))
dim(x_protein)
```

下面是处理蛋白质序列的 1D CNN 模型。

```r
prot_model <- keras_model_sequential(name = "protein_cnn") %>%
  layer_embedding(input_dim = 21, output_dim = 64,
                  input_length = 32) %>%
  layer_conv_1d(filters = 128, kernel_size = 3, activation = "relu",
                padding = "same") %>%
  layer_max_pooling_1d(pool_size = 2) %>%
  layer_conv_1d(filters = 64, kernel_size = 3, activation = "relu",
                padding = "same") %>%
  layer_global_max_pooling_1d() %>%
  layer_dropout(rate = 0.4) %>%
  layer_dense(units = 32, activation = "relu") %>%
  layer_dense(units = 1, activation = "sigmoid")

prot_model %>% compile(
  optimizer = optimizer_adam(1e-3),
  loss = "binary_crossentropy",
  metrics = c("accuracy", "AUC")
)
```

### 药物靶点相互作用预测

药物靶点相互作用预测输入是药物分子与靶点蛋白质的二元组，输出是结合概率。常见架构是双流网络：一路用 GNN 处理药物分子图，另一路用 CNN 处理蛋白质序列，两个表示拼接后通过全连接层输出。这种架构在 DTI 预测benchmark 上表现稳健。

下面是双流网络的骨架代码。

```r
# 药物分子图分支（这里简化为特征向量输入）
drug_input <- layer_input(shape = c(256), name = "drug_features")
drug_branch <- drug_input %>%
  layer_dense(units = 128, activation = "relu") %>%
  layer_dropout(rate = 0.3)

# 蛋白质序列分支
target_input <- layer_input(shape = c(512), name = "target_seq")  # 嵌入后的序列
target_branch <- target_input %>%
  layer_dense(units = 128, activation = "relu") %>%
  layer_dropout(rate = 0.3)

# 融合与输出
merged <- layer_concatenate(list(drug_branch, target_branch))
output <- merged %>%
  layer_dense(units = 64, activation = "relu") %>%
  layer_dropout(rate = 0.3) %>%
  layer_dense(units = 1, activation = "sigmoid")

dti_model <- keras_model(list(drug_input, target_input), output)
dti_model %>% compile(
  optimizer = optimizer_adam(1e-3),
  loss = "binary_crossentropy",
  metrics = c("accuracy", "AUC")
)
```

::: warning 负样本采样偏差
DTI 数据集的负样本通常是随机配对，可能包含尚未发现的真实相互作用。这种标签噪声会让模型评估偏高。建议使用去噪交叉验证或基于时间切分的评估方式，避免过度乐观地报告性能。
:::

### 单细胞 RNA-Seq 降维与聚类（自编码器）

单细胞 RNA-Seq 数据维度高、噪声大、稀疏严重。自编码器通过编码-解码结构学习紧凑表示，可作为 PCA 的非线性扩展，用于降维、去噪与聚类预处理。变分自编码器（VAE）进一步引入先验分布约束，让隐空间适合生成与插值。

下面是单细胞数据用的变分自编码器骨架。

```r
original_dim <- 2000  # 高变基因数
latent_dim <- 32

encoder_input <- layer_input(shape = c(original_dim), name = "encoder_input")
h <- encoder_input %>%
  layer_dense(units = 256, activation = "relu") %>%
  layer_dense(units = 64, activation = "relu")

z_mean <- h %>% layer_dense(units = latent_dim, name = "z_mean")
z_log_var <- h %>% layer_dense(units = latent_dim, name = "z_log_var")

# 重参数化采样层
sampling <- function(args) {
  c(z_mean, z_log_var) %<-% args
  epsilon <- k_random_normal(shape = k_shape(z_mean), mean = 0, stddev = 1)
  z_mean + k_exp(z_log_var / 2) * epsilon
}
z <- layer_lambda(list(z_mean, z_log_var), sampling)

encoder <- keras_model(encoder_input, list(z_mean, z_log_var, z))

# 解码器
decoder_input <- layer_input(shape = c(latent_dim))
decoder_output <- decoder_input %>%
  layer_dense(units = 64, activation = "relu") %>%
  layer_dense(units = 256, activation = "relu") %>%
  layer_dense(units = original_dim)
decoder <- keras_model(decoder_input, decoder_output)

vae_output <- decoder(z)
vae <- keras_model(encoder_input, vae_output)
```

### 医学图像分类（病理切片、CT）

医学影像分类是卷积网络的主战场。病理切片分类常配合多实例学习：整张切片切成若干 patch，每个 patch 单独预测，再聚合为整片诊断结果。CT 影像分类则常配合 3D 卷积，捕捉层间空间关系。

下面是用预训练 ResNet 做迁移学习的代码，适合样本量有限的病理 patch 分类。

```r
# 加载 ImageNet 预训练的 ResNet50，去掉顶层分类器
base_model <- application_resnet50(
  weights = "imagenet",
  include_top = FALSE,
  input_shape = c(224, 224, 3)
)

# 冻结骨干网络
freeze_weights(base_model)

# 添加新的分类头
transfer_model <- keras_model_sequential() %>%
  base_model %>%
  layer_global_average_pooling_2d() %>%
  layer_dropout(rate = 0.4) %>%
  layer_dense(units = 1, activation = "sigmoid")

transfer_model %>% compile(
  optimizer = optimizer_adam(1e-4),
  loss = "binary_crossentropy",
  metrics = c("accuracy", "AUC")
)

# 先训练分类头几个 epoch
history <- transfer_model %>% fit(
  train_generator,  # 图像数据生成器
  steps_per_epoch = 100,
  epochs = 10,
  validation_data = val_generator,
  validation_steps = 20
)

# 解冻部分顶层卷积块，用更小学习率微调
unfreeze_weights(base_model, from = "conv5_block1_1_conv")
transfer_model %>% compile(
  optimizer = optimizer_adam(1e-5),
  loss = "binary_crossentropy",
  metrics = c("accuracy", "AUC")
)
```

::: tip 数据增强对医学影像的双刃剑
旋转、翻转等几何增强对一般图像有效，但医学影像中某些变换可能产生不符合解剖学的样本。例如胸片左右翻转会改变心脏位置，可能误导模型。增强策略需要结合医学领域知识，不能机械套用计算机视觉的常见做法。
:::

### 模型解释工具（lime、shap）

医学场景下模型必须可解释。R 中常用的解释工具包括 lime（局部解释）、shap（基于博弈论的归因）、iml（统一接口）。下面用 lime 解释一个文本分类模型的预测。

```r
library(lime)

# 假设 model_predict 函数返回类别概率矩阵
model_predict <- function(texts) {
  # 把文本转为模型输入张量
  inputs <- tokenizer$batch_encode_plus(texts, padding = TRUE,
                                         truncation = TRUE, max_length = 128,
                                         return_tensors = "pt")
  with(torch$no_grad(), {
    outputs <- model(**inputs)
  })
  outputs$logits$softmax(dim = 1L)$detach()$numpy()
}

explainer <- lime(训练文本向量, model_predict, 
                  preprocess = function(x) x)

explanation <- explain(测试文本[1], explainer, n_labels = 1, n_features = 5)
plot_text_explanations(explanation)
```

### Shiny 集成实时预测

把训练好的模型嵌入 Shiny 应用，让临床用户通过网页交互预测。下面是 Shiny 应用的核心结构，加载预训练模型并响应上传图像。

::: warning 浏览器中无法运行
以下代码使用了 `keras`, `shiny`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(shiny)
library(keras)

# 全局加载模型，避免每次请求重复加载
model <- load_model_tf("saved_model/medical_cnn")

ui <- fluidPage(
  titlePanel("病理切片分类器"),
  sidebarLayout(
    sidebarPanel(
      fileInput("image", "上传病理切片", accept = c("image/png", "image/jpeg"))
    ),
    mainPanel(
      imageOutput("preview"),
      verbatimTextOutput("prediction")
    )
  )
)

server <- function(input, output, session) {
  output$preview <- renderImage({
    req(input$image)
    list(src = input$image$datapath, width = 256)
  }, deleteFile = FALSE)
  
  output$prediction <- renderPrint({
    req(input$image)
    img <- image_load(input$image$datapath, target_size = c(224, 224)) %>%
      image_to_array() %>%
      array_reshape(c(1, 224, 224, 3)) / 255
    prob <- model %>% predict(img)
    cat(sprintf("恶性概率: %.4f\n", prob[1, 1]))
  })
}

shinyApp(ui, server)
```

## 1.8.5 PyTorch for R（torch 包）进阶

keras 包通过 reticulate 调用 Python 后端，部署时依赖完整 Python 环境。torch 包直接绑定 libtorch C++ 库，R 进程内运行 PyTorch，无需 Python。这一特性让 torch 包在 R 原生部署场景中更轻便。理解 torch 的进阶用法，能让你在需要灵活自定义模型时不依赖 Python。

### 张量与自动微分

torch 张量与 PyTorch 张量接口几乎一致，关键差异是 R 的 1-based 索引。自动微分通过 `requires_grad = TRUE` 标记需要梯度的张量，调用 `backward()` 自动计算所有依赖张量的梯度。

下面用 torch 实现简单的梯度下降，演示自动微分流程。

::: warning 浏览器中无法运行
以下代码使用了 `torch`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(torch)

# 待优化变量
x <- torch_tensor(2.0, requires_grad = TRUE)

# 定义损失函数：loss = (x - 5)^2
loss <- (x - 5)^2

# 反向传播计算梯度
loss$backward()

# 查看梯度
cat("梯度:", as.numeric(x$grad), "\n")

# 简单梯度下降更新
with_no_grad({
  x$sub_(0.1 * x$grad)
})
# 清零梯度，避免累加
x$grad$zero_()
```

::: note 梯度累加机制
PyTorch 与 torch 包默认累加梯度，多次 backward 后梯度会叠加。这是为梯度累积、多损失反向传播设计的特性，但容易让初学者困惑。每次反向传播后必须显式 `zero_()` 清零梯度。可以用 `with_no_grad({...})` 包裹权重更新代码，避免更新操作被记录到计算图。
:::

### 自定义 nn_module 构建网络

torch 包用 `nn_module` 定义网络，与 PyTorch 的 `nn.Module` 概念一致。`initialize` 中创建子层，`forward` 中定义前向计算。这种写法比 keras 顺序模型更灵活，能表达任意控制流与多输入输出。

下面用 nn_module 实现一个 MLP。

```r
mlp <- nn_module(
  initialize = function(input_dim, hidden_dim, output_dim) {
    self$fc1 <- nn_linear(input_dim, hidden_dim)
    self$fc2 <- nn_linear(hidden_dim, output_dim)
    self$dropout <- nn_dropout(0.5)
  },
  forward = function(x) {
    x %>% 
      self$fc1() %>% 
      nnf_relu() %>% 
      self$dropout() %>% 
      self$fc2()
  }
)

model <- mlp(input_dim = 100, hidden_dim = 64, output_dim = 10)
print(model)

# 测试前向传播
dummy_input <- torch_randn(c(32, 100))
output <- model(dummy_input)
print(output$shape)
```

### 手动训练循环

torch 包没有 keras 的 fit 高层接口，训练循环需要手写。这种写法虽然繁琐，但完全透明，方便调试与定制。下面是一个完整的训练循环，包含前向、反向、更新、评估。

```r
model <- mlp(input_dim = 100, hidden_dim = 64, output_dim = 4)

optimizer <- optim_adam(model$parameters, lr = 1e-3)
loss_fn <- nn_cross_entropy_loss()

n_epochs <- 30
batch_size <- 64

for (epoch in seq_len(n_epochs)) {
  model$train()
  # 假设 dataset 是数据框或矩阵
  indices <- sample(seq_len(n_samples))
  
  for (i in seq(1, n_samples, by = batch_size)) {
    batch_idx <- indices[i:min(i + batch_size - 1, n_samples)]
    x_batch <- torch_tensor(x_train[batch_idx, ], dtype = torch_float32())
    y_batch <- torch_tensor(y_train[batch_idx], dtype = torch_long())
  
    # 前向
    logits <- model(x_batch)
    loss <- loss_fn(logits, y_batch)
  
    # 反向
    optimizer$zero_grad()
    loss$backward()
    optimizer$step()
  }
  
  # 验证
  model$eval()
  with_no_grad({
    x_val_t <- torch_tensor(x_val, dtype = torch_float32())
    logits <- model(x_val_t)
    val_pred <- logits$argmax(dim = 2L)
    val_acc <- mean(as.array(val_pred) == y_val)
  })
  cat(sprintf("Epoch %d  val_acc=%.4f\n", epoch, val_acc))
}
```

### 数据加载器（dataloader）

torch 包提供 `dataloader` 包装 `dataset`，自动处理批次、打乱、并行加载。自定义 dataset 通过继承 `dataset` 类实现 `getitem` 与 `length` 方法。

下面是自定义 dataset 与 dataloader 的示例。

```r
# 自定义 dataset
medical_dataset <- dataset(
  name = "medical_dataset",
  initialize = function(x, y) {
    self$x <- x
    self$y <- y
  },
  .getitem = function(i) {
    list(
      x = torch_tensor(self$x[i, ], dtype = torch_float32()),
      y = torch_tensor(self$y[i], dtype = torch_long())
    )
  },
  .length = function() {
    nrow(self$x)
  }
)

train_ds <- medical_dataset(x_train, y_train)
train_dl <- dataloader(train_ds, batch_size = 64, shuffle = TRUE)

# 迭代 dataloader
coro::loop(
  for (batch in train_dl) {
    x_batch <- batch$x
    y_batch <- batch$y
    # 训练代码...
  }
)
```

::: tip 数据加载的并行化
dataloader 的 `num_workers` 参数控制并行加载进程数。医学影像等需要从磁盘读取的场景，提升 `num_workers` 能显著加速训练。但 Windows 系统下多进程加载可能不稳定，建议先用 `num_workers = 0` 调试，再增加并行度。
:::

### 迁移预训练模型（torchvision）

torchvision 通过 reticulate 调用 Python 接口，能加载 ImageNet 预训练的 ResNet、EfficientNet 等模型，用于迁移学习。下面是加载预训练 ResNet 并替换分类头的示例。

::: warning 浏览器中无法运行
以下代码使用了 `reticulate`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(reticulate)
# reticulate::py_install("torchvision", pip = TRUE)

torchvision <- import("torchvision")
torch <- import("torch")

# 加载预训练 ResNet18
model <- torchvision$models$resnet18(pretrained = TRUE)

# 冻结所有参数
for (param in model$parameters()) param$requires_grad_(FALSE)

# 替换最后的分类头
model$fc <- torch$nn$Linear(model$fc$in_features, 2L)

# 仅新分类头参与梯度更新
optimizer <- torch$optim$Adam(model$fc$parameters(), lr = 1e-3)
```

### 与 reticulate 的协同

torch 包与 reticulate 可以共存：torch 处理 R 原生张量运算，reticulate 调用 Python 生态的特殊功能。两者之间的张量通过 `as.array()` 与 `torch_tensor()` 互转。这种协同在需要使用 Hugging Face Transformers 或 PyTorch Geometric 时特别有用。

::: warning 张量互转的开销
R 张量与 Python 张量互转会触发内存拷贝，大批量数据频繁互转会成为性能瓶颈。设计混合代码时应让张量在某一侧停留尽可能久，减少跨边界传递次数。最佳实践是把数据准备完全放在一侧，只传递最终的张量结果。
:::

## 1.8.6 模型优化与超参数调优

深度学习模型的可调参数多：网络深度、宽度、学习率、批次大小、正则化系数、训练轮数等。手动试错成本高且不可靠。系统化的调优工具能自动探索超参数空间，找到接近最优的配置。

### keras_tuner 包

keras_tuner 提供三种搜索算法：RandomSearch 随机采样、Hyperband 早停淘汰劣质配置、BayesianOptimization 用高斯过程建模目标函数。三种方法各有适用场景，Hyperband 在计算预算有限时通常性价比最高。

下面用 Hyperband 调优 MLP 的层数、单元数、学习率。

::: warning 浏览器中无法运行
以下代码使用了 `keras`, `kerastuner`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)
library(kerastuner)

build_model <- function(hp) {
  model <- keras_model_sequential()
  
  # 调节层数（1到3层）
  n_layers <- hp$Int("n_layers", min_value = 1L, max_value = 3L)
  
  for (i in seq_len(n_layers)) {
    model %>% layer_dense(
      units = hp$Int(paste0("units_", i), min_value = 32L, max_value = 256L, step = 32L),
      activation = "relu"
    )
    model %>% layer_dropout(
      rate = hp$Float(paste0("dropout_", i), min_value = 0.1, max_value = 0.5, step = 0.1)
    )
  }
  
  model %>% layer_dense(units = 1, activation = "sigmoid")
  
  model %>% compile(
    optimizer = optimizer_adam(
      learning_rate = hp$Choice("lr", values = c(1e-2, 1e-3, 1e-4))
    ),
    loss = "binary_crossentropy",
    metrics = c("accuracy")
  )
  model
}

tuner <- Hyperband(
  build_model,
  objective = "val_accuracy",
  max_epochs = 30,
  directory = "tuner_results",
  project_name = "mlp_tuning"
)

tuner %>% fit_tuner(
  x_train, y_train,
  validation_data = list(x_val, y_val),
  callbacks = list(callback_early_stopping(monitor = "val_loss", patience = 5))
)

best_model <- tuner %>% get_best_models(num_models = 1)[[1]]
best_hps <- tuner %>% get_best_hyperparameters(num_trials = 1)[[1]]
print(best_hps$values)
```

::: tip 调参预算的分配
Hyperband 把预算分配给多个配置并提前淘汰表现差的，能在有限计算资源下探索更多配置。建议先用较小的 max_epochs 跑一遍粗筛，再用更精细的搜索算法在最优区域附近做精调。盲目用大规模搜索会浪费大量计算。
:::

### 学习率查找器

学习率是重要的超参数。学习率查找器（Learning Rate Finder）从小到大逐步增加学习率，记录损失变化，绘制曲线找到下降最快的区间作为初始学习率。keras 包没有内置实现，但可以通过自定义回调实现。

下面是学习率查找器的简化实现。

```r
lr_finder <- callback_lambda(
  on_train_begin = function(logs) {
    self$lrs <- numeric()
    self$losses <- numeric()
  },
  on_batch_end = function(batch, logs) {
    # 指数增长学习率
    lr <- 1e-7 * 10^(batch / 100)
    k_set_value(model$optimizer$learning_rate, lr)
    self$lrs <- c(self$lrs, lr)
    self$losses <- c(self$losses, logs$loss)
    if (lr > 1) model$stop_training <- TRUE
  }
)

model %>% fit(x_train, y_train, epochs = 1, callbacks = list(lr_finder))

plot(log10(lr_finder$lrs), lr_finder$losses, type = "l",
     xlab = "log10(learning rate)", ylab = "loss",
     main = "Learning Rate Finder")
```

::: warning 查找器后必须重置模型
学习率查找过程会让模型权重严重偏移，不能直接用于后续训练。正确做法是用查找器确定学习率范围，然后重新初始化模型，用找到的学习率重新训练。
:::

### 模型量化与剪枝基础

部署到边缘设备时模型体积与推理速度成为关键。量化把权重从 float32 转为 int8，模型体积减少 4 倍，推理速度提升 2-3 倍。剪枝把权重中接近零的元素置零，配合稀疏存储能进一步压缩。

下面用 tensorflow_model_optimization 通过 reticulate 做剪枝。

::: warning 浏览器中无法运行
以下代码使用了 `reticulate`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(reticulate)
# reticulate::py_install("tensorflow-model-optimization", pip = TRUE)

tfmot <- import("tensorflow_model_optimization")

prune_low_magnitude <- tfmot$sparsity$keras$prune_low_magnitude

# 计算训练步数
num_train_samples <- nrow(x_train)
batch_size <- 64
epochs <- 10
end_step <- ceiling(num_train_samples / batch_size) * epochs

pruning_params <- list(
  pruning_schedule = tfmot$sparsity$keras$ConstantSparsity(
    target_sparsity = 0.5,
    begin_step = 0L,
    end_step = as.integer(end_step),
    frequency = 100L
  )
)

model_for_pruning <- prune_low_magnitude(model, **pruning_params)
model_for_pruning %>% compile(
  optimizer = optimizer_adam(1e-3),
  loss = "binary_crossentropy",
  metrics = c("accuracy")
)
```

### 混合精度训练与分布式

混合精度训练把部分计算用 float16、部分用 float32，能加速 GPU 训练并降低显存占用。分布式训练把数据并行切分到多 GPU 上，缩短训练时间。

下面是开启混合精度的代码。

::: warning 浏览器中无法运行
以下代码使用了 `tensorflow`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(tensorflow)
tf$keras$mixed_precision$set_global_policy("mixed_float16")

# 模型构建照常，输出层建议显式指定 float32
output_layer <- layer_dense(units = 1, activation = "sigmoid",
                            dtype = "float32")
```

分布式训练通过 `tf$distribute$MirroredStrategy` 包装模型构建过程。

```r
strategy <- tf$distribute$MirroredStrategy()
with(strategy$scope(), {
  model <- build_model()
  model %>% compile(optimizer = optimizer_adam(1e-3),
                    loss = "binary_crossentropy",
                    metrics = c("accuracy"))
})
# 后续训练照常，框架自动分配批次到各 GPU
```

## 1.8.7 可解释性与模型调试

医学场景下的模型不能是黑箱。临床医生需要知道模型为何做出某个判断，监管机构要求提供决策依据。可解释性工具让深度模型的预测过程可视化，是医学 AI 落地的必备环节。

### Grad-CAM 在 R 中的实现

Grad-CAM 通过输出对最后卷积层特征图的梯度，定位对预测贡献最大的图像区域。它生成的热力图直观显示模型关注的解剖位置，是医学影像分类常用的解释工具。

下面是 Grad-CAM 的核心实现，需要用 keras 的低层 API 取中间层输出与梯度。

::: warning 浏览器中无法运行
以下代码使用了 `keras`, `tensorflow`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)
library(tensorflow)
K <- backend()

grad_cam <- function(model, image, class_idx, last_conv_layer_name) {
  # 构建子模型：输入 + (最后卷积层输出, 原始预测)
  grad_model <- keras_model(
    inputs = model$input,
    outputs = list(
      get_layer(model, last_conv_layer_name)$output,
      model$output
    )
  )
  
  with(tf$GradientTape() %as% tape, {
    inputs <- tf$cast(image, tf$float32)
    c(conv_outputs, predictions) %<-% grad_model(inputs, training = FALSE)
    loss <- predictions[, class_idx]
  })
  
  # 计算梯度
  grads <- tape$gradient(loss, conv_outputs)
  pooled_grads <- k_mean(grads, axis = c(1L, 2L))
  
  # 加权求和
  conv_outputs <- conv_outputs[1, , , ]  # 去掉批次维
  heatmap <- conv_outputs %*% as.array(pooled_grads)
  heatmap <- pmax(heatmap, 0)
  heatmap <- heatmap / max(heatmap)
  heatmap
}
```

::: note Grad-CAM 的局限
Grad-CAM 只能解释卷积网络，对 Transformer 或全连接网络不适用。它的分辨率受限于最后卷积层的特征图大小，定位精度有限。对医学影像中的小病灶，可能需要 Grad-CAM++ 或 Score-CAM 等改进版本。
:::

### 特征重要性：排列重要性与 SHAP

排列重要性通过打乱单个特征观察性能下降幅度，评估该特征对模型的整体贡献。SHAP 基于博弈论的 Shapley 值，给出每个特征对单个预测的边际贡献。两者互补：排列重要性看全局，SHAP 看局部。

下面用 DALEX 计算排列重要性。

::: warning 浏览器中无法运行
以下代码使用了 `keras`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(DALEX)
library(keras)

# 把 keras 模型包装为 DALEX 能理解的预测函数
predict_function <- function(model, newdata) {
  arr <- as.matrix(newdata)
  model %>% predict(arr)
}

explainer <- explain(
  model = rnaseq_model,
  data = as.data.frame(x_val),
  y = y_val,
  predict_function = predict_function,
  label = "RNA-Seq MLP"
)

permutation_importance <- model_parts(explainer, B = 10)
plot(permutation_importance)
```

下面用 shapviz 调用 Python 的 SHAP 计算。

::: warning 浏览器中无法运行
以下代码使用了 `reticulate`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(reticulate)
library(shapviz)

# 假设已有训练好的 XGBoost 模型作为对比
# SHAP 对树模型计算高效，深度模型可用 DeepSHAP
shap <- import("shap")

# 用背景数据集构建解释器
background <- x_train[sample(seq_len(nrow(x_train)), 50), ]
explainer <- shap$DeepExplainer(model, background)

shap_values <- explainer$shap_values(x_val[1:10, ])
# 在 R 中可视化
sv <- shapviz(shap_values[[1]], X = as.data.frame(x_val[1:10, ]))
sv_importance(sv)
sv_waterfall(sv, row_id = 1)
```

### 局部解释：LIME

LIME 通过在单个样本邻域采样、拟合局部线性模型，给出该样本的解释。它对任意模型都适用，是黑箱模型的通用解释工具。下面用一个文本分类的例子。

```r
library(lime)

# 假设 predict_fn 把文本转为模型预测概率
explainer <- lime(
  x = training_texts,
  model = predict_fn,
  preprocess = function(x) x
)

explanation <- explain(
  test_text[1],
  explainer,
  n_labels = 1,
  n_features = 8,
  n_permutations = 1000
)

plot_text_explanations(explanation)
```

::: warning LIME 的随机性
LIME 基于局部采样，每次解释结果可能不同。重要的解释应多次运行取平均，或固定随机种子。在临床场景下，不稳定的解释会让医生对模型失去信任。
:::

### TensorBoard 集成可视化

TensorBoard 是 TensorFlow 配套的可视化工具，能实时展示训练曲线、计算图、权重分布、模型结构。keras 包通过回调机制无缝接入。

```r
tensorboard_callback <- callback_tensorboard(
  log_dir = "logs/fit",
  histogram_freq = 1,
  write_graph = TRUE,
  write_images = FALSE,
  update_freq = "epoch",
  profile_batch = 0
)

history <- model %>% fit(
  x_train, y_train,
  validation_data = list(x_val, y_val),
  epochs = 50,
  callbacks = list(tensorboard_callback)
)
```

在另一个终端启动 TensorBoard 即可访问可视化界面。

```bash
tensorboard --logdir logs/fit
```

### 自定义回调记录中间层输出

调试神经网络时，观察中间层激活能帮助定位问题层。下面是一个自定义回调，在每个 epoch 结束时记录指定层的输出统计量。

```r
intermediate_logger <- R6::R6Class(
  classname = "IntermediateLogger",
  inherit = KerasCallback,
  public = list(
    layer_name = NULL,
    stats = list(),
  
    initialize = function(layer_name) {
      self$layer_name <- layer_name
    },
  
    on_epoch_end = function(epoch, logs = list()) {
      intermediate_model <- keras_model(
        inputs = model$input,
        outputs = get_layer(model, self$layer_name)$output
      )
      activation <- intermediate_model %>% predict(x_val[1:32, ])
      self$stats <- c(self$stats, list(list(
        epoch = epoch,
        mean = mean(activation),
        std = sd(activation),
        fraction_zero = mean(activation == 0)
      )))
      cat(sprintf("[%s] mean=%.4f std=%.4f zero_frac=%.4f\n",
                  self$layer_name, mean(activation), sd(activation),
                  mean(activation == 0)))
    }
  )
)

logger <- intermediate_logger$new("dense_1")
history <- model %>% fit(
  x_train, y_train,
  validation_data = list(x_val, y_val),
  epochs = 50,
  callbacks = list(logger)
)
```

::: tip 死亡神经元的检测
监控中间层激活的零值比例能发现死亡 ReLU 问题。如果某层激活零值比例持续高于 90%，说明大量神经元停止工作，应降低学习率或更换激活函数。自定义回调让这种诊断可以在训练过程中持续进行。
:::

## 1.8.8 生产环境部署

训练好的模型需要部署为可调用的服务，才能进入临床工作流。R 生态的部署方案包括把模型导出为标准格式、用 plumber 构建REST API、把模型打包为 R 包、或在 Shiny 应用中加载模型做实时预测。每种方案适合不同的部署场景。

### 模型导出为 SavedModel 格式

keras 训练的模型可以导出为 TensorFlow 的 SavedModel 格式，与 Python 生态完全兼容。导出后模型可以被 TensorFlow Serving、TFLite、TensorFlow.js 等工具加载，部署灵活度高。

::: warning 浏览器中无法运行
以下代码使用了 `keras`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(keras)

# 保存为 SavedModel 格式
save_model_tf(model, "saved_model/medical_cnn")

# 也可以保存为 HDF5 格式（单一文件）
save_model_hdf5(model, "model.h5")

# 加载
loaded_model <- load_model_tf("saved_model/medical_cnn")
```

::: tip 部署格式选择
SavedModel 是目录结构，包含计算图与权重，适合 TensorFlow Serving 与跨语言部署。HDF5 是单一文件，便于版本管理与分发，但只支持 Python/R 生态。生产环境优先选 SavedModel，研究阶段可用 HDF5。
:::

### TensorFlow Serving 部署

TensorFlow Serving 是 Google 开源的模型服务系统，支持模型版本管理、批量推理、gRPC 与 REST 接口。把 SavedModel 放到指定目录，启动 Serving 即可对外提供推理服务。

下面用 docker 启动 TensorFlow Serving 的命令。

```bash
docker run -t --rm -p 8501:8501 \
  -v "$(pwd)/saved_model:/models/medical_cnn" \
  -e MODEL_NAME=medical_cnn \
  tensorflow/serving
```

下面在 R 中通过 httr 调用 Serving 的 REST 接口。

```r
library(httr)

predict_via_serving <- function(input_array) {
  url <- "http://localhost:8501/v1/models/medical_cnn:predict"
  body <- list(instances = list(input_array))
  response <- POST(url, body = toJSON(body, auto_unbox = TRUE),
                   content_type_json())
  content(response)$predictions
}

# 测试调用
result <- predict_via_serving(x_test[1, , drop = FALSE])
print(result)
```

### 用 plumber 构建深度学习 API

plumber 把 R 函数转为 REST API，是 R 生态构建服务的标准工具。把模型加载与预测逻辑封装为 plumber 端点，能让 R 训练的模型对外提供推理服务。

下面是 plumber API 的完整定义。

::: warning 浏览器中无法运行
以下代码使用了 `keras`, `plumber`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
# plumber.R
library(plumber)
library(keras)

# 全局加载模型，避免每次请求重复加载
model <- NULL

#* @filter model_init
function(req, res) {
  if (is.null(model)) {
    model <<- load_model_tf("saved_model/medical_cnn")
  }
  plumber::forward()
}

#* 健康检查
#* @get /health
function() {
  list(status = "ok", model_loaded = !is.null(model))
}

#* 病理切片预测
#* @post /predict
function(req) {
  image_array <- req$body$image  # 假设前端发送已预处理的数组
  image_array <- array_reshape(image_array, c(1, 224, 224, 3))
  prob <- model %>% predict(image_array)
  list(probability_malignant = as.numeric(prob[1, 1]))
}
```

启动 plumber 服务。

::: warning 浏览器中无法运行
以下代码使用了 `plumber`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(plumber)
pr <- plumb("plumber.R")
pr %>% pr_run(port = 8000)
```

::: warning 并发与单线程
plumber 默认单线程处理请求，深度学习推理耗时较长时会阻塞后续请求。生产部署应配合 `future` 包或 docker 多副本方案，提升并发能力。对延迟敏感的场景，建议改用 TensorFlow Serving，它原生支持批量与多线程。
:::

### 模型打包为 R 包

把训练好的模型与预测函数打包为 R 包，便于版本管理与分发。模型文件作为包的 extdata 或 raw 数据，加载包时自动读入。

下面是包结构的典型布局与加载函数。

```
medicalcnn/
├── DESCRIPTION
├── NAMESPACE
├── R/
│   └── predict.R
└── inst/
    └── extdata/
        └── model.h5
```

下面是 R/predict.R 的内容。

```r
#' 加载病理切片模型
#' @return 加载的 keras 模型
load_medical_model <- function() {
  model_path <- system.file("extdata", "model.h5", package = "medicalcnn")
  keras::load_model_hdf5(model_path)
}

#' 预测恶性概率
#' @param image_array 224x224x3 的数值数组
#' @return 概率数值
predict_malignant <- function(image_array, model = NULL) {
  if (is.null(model)) model <- load_medical_model()
  x <- array_reshape(image_array, c(1, 224, 224, 3)) / 255
  as.numeric(model %>% keras::predict(x))
}
```

::: tip 模型文件大小管理
深度学习模型文件常达数百 MB，放进 R 包会让包体积膨胀。可以用 `tools::Rtools` 的包数据压缩、或在包的 `.onLoad` 中从远程仓库按需下载。后者让 R 包本体保持小巧，部署时再拉取模型权重。
:::

### Shiny 应用中加载模型实时预测

Shiny 是 R 生态构建交互式应用的标准工具。把模型嵌入 Shiny，让临床用户通过网页上传影像、查看预测结果与解释。下面是一个完整的 Shiny 应用骨架，包含模型加载、图像预处理、预测与 Grad-CAM 解释。

::: warning 浏览器中无法运行
以下代码使用了 `keras`, `shiny`, `imager`，依赖 Python/TensorFlow/系统环境或 Bioconductor 工具链，无法在浏览器内的 WebR 沙箱中运行。请在本地 R 环境中执行。
:::

```r
library(shiny)
library(keras)
library(imager)

model <- load_model_tf("saved_model/medical_cnn")

preprocess_image <- function(path) {
  img <- load_image(path) |> resize_image(c(224, 224))
  arr <- as.array(img)[, , 1:3] / 255
  array_reshape(arr, c(1, 224, 224, 3))
}

ui <- fluidPage(
  titlePanel("病理切片实时分析"),
  sidebarLayout(
    sidebarPanel(
      fileInput("img", "上传切片图像", accept = c("image/png", "image/jpeg")),
      actionButton("predict", "运行预测"),
      hr(),
      sliderInput("threshold", "判定阈值", min = 0, max = 1, value = 0.5)
    ),
    mainPanel(
      tabsetPanel(
        tabPanel("原图", imageOutput("original")),
        tabPanel("预测结果", verbatimTextOutput("result")),
        tabPanel("解释热图", plotOutput("heatmap"))
      )
    )
  )
)

server <- function(input, output, session) {
  output$original <- renderImage({
    req(input$img)
    list(src = input$img$datapath, width = 300)
  }, deleteFile = FALSE)
  
  observeEvent(input$predict, {
    req(input$img)
    arr <- preprocess_image(input$img$datapath)
    prob <- as.numeric(model %>% predict(arr))
    threshold <- input$threshold
  
    output$result <- renderPrint({
      cat(sprintf("恶性概率: %.4f\n", prob))
      cat(sprintf("判定结果: %s\n", ifelse(prob > threshold, "恶性", "良性")))
    })
  
    output$heatmap <- renderPlot({
      hm <- grad_cam(model, arr, 1L, "conv5_block3_out")
      plot_heatmap_overlay(input$img$datapath, hm)
    })
  })
}

shinyApp(ui, server)
```

::: tip 临床部署的合规要求
医学 AI 应用进入临床需满足监管要求：模型预测必须留存可追溯日志、提供人机交互复核机制、定期评估性能漂移。Shiny 应用本身只是前端，配套的审计、版本管理、性能监控需要专门设计与实现。在临床部署前，应与医院信息科与伦理委员会充分沟通。
:::

---

## 本节小结

本节覆盖了深度学习在 R 中的进阶内容。生成对抗网络通过生成器与判别器的博弈学习数据分布，在医学图像合成与数据增强中有直接应用。Transformer 通过自注意力机制建模长程依赖，已成为生物序列建模的主流架构，预训练模型通过 reticulate 接入 R 生态。图神经网络把深度学习推广到蛋白质相互作用、代谢网络等图结构数据，通过 reticulate 调用 DGL 或 PyTorch Geometric 实现。

torch 包提供纯 R 的 PyTorch 体验，适合需要灵活自定义且不希望依赖 Python 的场景。模型调优与解释工具让深度模型从黑箱走向可信，keras_tuner、Grad-CAM、SHAP、LIME 构成完整的调优与解释工具链。生产部署方面，SavedModel 格式、TensorFlow Serving、plumber API、Shiny 应用分别对应不同部署场景，覆盖从研究原型到临床落地的完整路径。掌握这些工具，医学研究者能够在 R 中独立完成从数据到部署的深度学习全流程。

## 练习题

### 第1题 GAN 训练流程

说明 GAN 训练中生成器与判别器的交替更新流程,以及标签平滑(真实标签用 0.9 而非 1.0)的作用。

::: details 参考答案

GAN 训练的每一步先更新判别器,再更新生成器。更新判别器时,用真实样本与生成器产生的伪造样本分别训练,目标是让判别器正确区分真伪。更新生成器时,冻结判别器,让生成器产生伪造样本并希望判别器把它们判为真,目标是让生成器学会骗过判别器。

标签平滑把真实样本的目标标签从 1.0 改为 0.9,伪造样本从 0.0 改为 0.1。这能防止判别器过早达到饱和(输出趋近 1 或 0),给生成器留下可学习的梯度信号。单边标签平滑是 DCGAN 训练中成本最低、效果最显著的稳定化技巧之一。
:::

### 第2题 自注意力机制

写出自注意力机制的核心计算公式,并解释缩放因子 $\sqrt{d_k}$ 的作用。

::: details 参考答案

自注意力的计算公式为:

```
Attention(Q, K, V) = softmax(Q · K^T / sqrt(d_k)) · V
```

其中 Q、K、V 分别是查询、键、值矩阵,$d_k$ 是键向量维度。

缩放因子 $\sqrt{d_k}$ 用于控制点积的方差。点积的方差随 $d_k$ 线性增长,$d_k$ 较大时点积值会落入 softmax 的饱和区,梯度接近零,模型难以训练。除以 $\sqrt{d_k}$ 把方差控制回 1 附近,保持梯度健康。去掉缩放会让深层 Transformer 难以收敛。
:::

### 第3题 模型部署方式选择

说明 SavedModel、TensorFlow Serving、plumber 三种部署方式的适用场景与优缺点。

::: details 参考答案

SavedModel 是 TensorFlow 的标准模型格式,包含计算图与权重。它适合作为模型导出的中间格式,可被多种工具加载。优点是跨语言兼容,缺点是本身不提供服务接口。

TensorFlow Serving 是专门的模型服务系统,支持版本管理、批量推理、gRPC 与 REST 接口。它适合高并发生产环境,性能最优,但需要 Docker 或独立部署,对运维有要求。

plumber 把 R 函数转为 REST API,适合快速原型与 R 团队内部部署。优点是开发简单、与 R 生态无缝衔接,缺点是默认单线程,深度学习推理耗时长时会阻塞请求。延迟敏感的生产场景应优先选 TensorFlow Serving,研究与原型阶段用 plumber 更便捷。
:::

## 常见错误

**错误 1 · `reticulate` 调用的 Python 环境不一致**

原因:`reticulate` 默认使用系统 Python,可能与安装 transformers 或 torch 的 conda 环境不同。环境不一致导致找不到已安装的包,报 `ModuleNotFoundError`。

解决:用 `reticulate::py_config()` 检查当前使用的 Python 路径。用 `Sys.setenv(RETICULATE_PYTHON = "/path/to/python")` 或在项目根目录创建 `.Rprofile` 指定解释器。conda 用户可用 `reticulate::use_condaenv("env_name")`。

**错误 2 · GAN 训练崩溃或模式崩溃**

原因:判别器过强时生成器梯度消失,无法学习;过弱时生成器学不到有用信号。模式崩溃指生成器只产生少数几种样本,丧失多样性。GAN 的训练动态比判别模型复杂得多,没有自动收敛保证。

解决:使用标签平滑防止判别器饱和;降低学习率或调整网络容量;改用 WGAN、WGAN-GP 等稳定化变体;在判别器中加入谱归一化约束 Lipschitz 常数;使用 minibatch discrimination 让判别器比较批次内样本差异。

**错误 3 · torch 中梯度累加导致参数更新错误**

原因:PyTorch 与 torch 包默认累加梯度,多次 `backward()` 后梯度叠加。若不在每次反向传播后清零梯度,参数更新方向会受历史梯度干扰,训练不收敛。

解决:每次反向传播后调用 `optimizer$zero_grad()` 清零梯度。权重更新代码用 `with_no_grad({...})` 包裹,避免更新操作被记录到计算图。梯度累加机制在梯度累积(模拟大 batch)场景中有用,但需要显式控制清零时机。

**错误 4 · `predict()` 时忘记 batch 维度**

原因:keras 的 `predict()` 期望输入包含 batch 维度。单样本预测时若直接传入一维或二维数组,形状与模型 `input_shape` 不匹配,会报维度错误。

解决:用 `array_reshape(x, c(1, ...))` 在最前面加 batch 维度。例如 224×224×3 的图像应reshape 为 `c(1, 224, 224, 3)`。批量预测时 batch 维度等于样本数,无需额外处理。
