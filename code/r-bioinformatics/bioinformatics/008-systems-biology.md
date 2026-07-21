---
title: 2.8 系统生物学与网络分析
sidebar:
  order: 8
---

# 2.8 系统生物学与网络分析

系统生物学将基因、蛋白质、代谢物等分子视为相互关联的网络，通过图论、统计建模和计算分析揭示生命活动的整体规律。生物网络为理解信号转导、代谢调控、疾病发生等复杂过程提供了核心分析框架。本章覆盖网络基础、构建方法、拓扑分析、通路富集、多组学整合与典型应用。

## 2.8.1 生物网络与图论基础

图论将复杂系统抽象为节点（node）和边（edge）构成的图。生物网络中节点代表分子，边代表相互作用或关系。图分为有向图与无向图、加权图与无权图。转录因子调控是有向图，蛋白质-蛋白质相互作用（PPI）是无向图。

网络数据常用两种格式存储：邻接矩阵是 N×N 方阵，便于矩阵运算但占用空间大；边列表每行记录一条边的两端及权重，适合稀疏生物网络。

```python
import networkx as nx

G = nx.Graph()
G.add_edges_from([(1, 2), (2, 3), (3, 4), (4, 1), (2, 4)])

print("邻接矩阵:\n", nx.adjacency_matrix(G).todense())
print("边列表:", list(G.edges()))
print(f"节点数: {G.number_of_nodes()}, 边数: {G.number_of_edges()}")
print(f"是否连通: {nx.is_connected(G)}, 直径: {nx.diameter(G)}")
```

**核心拓扑指标**：

- **度（degree）**：节点连接的边数。有向图分入度和出度。许多生物网络呈幂律度分布 P(k) ~ k^(-γ)，称为无标度网络，存在少数高度连接的 hub 节点。
- **聚类系数**：节点邻居间实际边数与可能边数之比。生物网络聚类系数高，反映功能模块化。
- **最短路径与直径**：节点间最短边数路径。小世界网络兼具高聚类和短路径，信号可快速传播。
- **模块度（modularity）**：衡量社区结构强度，取值约 [-0.5, 1]，越大表示社区越明显。

::: tip 二分图与超图
药物-靶点、miRNA-靶基因网络是二分图，节点分两类，边只跨类连接。蛋白质复合物、多底物代谢反应可用超图表示，一条超边连接任意数量节点。
:::

## 2.8.2 常见生物网络类型

**蛋白质-蛋白质相互作用网络（PPI）**：节点为蛋白质，边为物理结合。数据来自酵母双杂交（Y2H）、亲和纯化-质谱（AP-MS）等高通量实验，STRING、BioGRID、IntAct 是主要数据库。PPI 网络通常无向、稀疏、无标度。

**基因调控网络（GRN）**：转录因子指向靶基因的有向网络。构建可基于 ChIP-seq 识别结合位点，或从表达数据推断（GENIE3、ARACNE）。GRN 决定细胞分化与命运决定。

**代谢网络**：节点为代谢物、反应或酶，边代表参与或转化关系，常用二分图或超图表示。KEGG、MetaCyc 提供通路数据，ModelSEED 支持从基因组注释重建模型。

**共表达网络**：基于表达数据构建，边表示表达相关性。WGCNA 是最广泛使用的方法，使用软阈值将相关矩阵转为邻接矩阵，识别共表达模块。

**其他常见网络**：信号转导网络（有向，Pathway Commons、SignaLink）、miRNA-靶基因网络（TargetScan、miRDB）、疾病-基因网络（DisGeNET、OMIM）、药物-靶点网络（DrugBank、TTD）、ceRNA 网络（竞争结合 miRNA）。

## 2.8.3 网络构建方法

### 2.8.3.1 从数据库导入 PPI

STRING 整合实验验证、共表达、文献挖掘等多源信息并为每条相互作用提供置信度评分。

```python
import pandas as pd
import networkx as nx

ppi_data = pd.DataFrame({
    'protein1': ['TP53', 'TP53', 'TP53', 'MDM2', 'MDM2'],
    'protein2': ['MDM2', 'CDKN1A', 'BAX', 'CDKN1A', 'RB1'],
    'score': [0.999, 0.998, 0.997, 0.856, 0.743]
})

G = nx.from_pandas_edgelist(ppi_data, 'protein1', 'protein2', edge_attr='score')
print(f"节点数: {G.number_of_nodes()}, 边数: {G.number_of_edges()}")
```

### 2.8.3.2 从组学数据推断网络

WGCNA 通过软阈值将相关矩阵转换为邻接矩阵，再计算拓扑重叠矩阵（TOM）并层次聚类识别模块。

```r
library(WGCNA)

set.seed(2024)
expr_data <- matrix(rnorm(1000 * 30, mean = 8, sd = 1.5), nrow = 1000)
rownames(expr_data) <- paste0("Gene_", 1:1000)
expr_data[1:50, 16:30] <- expr_data[1:50, 16:30] + 2  # 注入共表达模式

sft <- pickSoftThreshold(t(expr_data), powerVector = 1:20)
soft_power <- ifelse(sft$powerEstimate < 1, 6, sft$powerEstimate)

adjacency <- adjacency(t(expr_data), power = soft_power)
TOM <- TOMsimilarity(adjacency)
gene_tree <- hclust(as.dist(1 - TOM), method = "average")
modules <- cutreeDynamic(dendro = gene_tree, distM = 1 - TOM,
                         deepSplit = 2, minClusterSize = 30)
print(table(labels2colors(modules)))
```

**推断方法选型**：

| 方法 | 原理 | 适用场景 |
|------|------|----------|
| WGCNA | 软阈值加权相关 | 共表达模块识别 |
| GENIE3 | 随机森林特征重要性 | 基因调控网络 |
| ARACNE | 互信息 + DPI 去间接边 | 调控网络 |
| 贝叶斯网络 | 概率图模型 | 因果推断 |
| SCENIC | 共表达 + motif | 单细胞调控网络 |

::: warning 因果与相关
共表达和互信息网络只能反映相关性。确定因果关系需要扰动实验（敲除、抑制）或时间序列数据，配合贝叶斯网络或 ODE 模型。
:::

## 2.8.4 网络拓扑分析

### 2.8.4.1 中心性指标

中心性量化节点重要性。度中心性直接用度值；介数中心性衡量节点作为最短路径桥梁的程度；紧密中心性是到其他节点平均距离的倒数；特征向量中心性考虑邻居的重要性；PageRank 适用于有向网络。

```r
library(igraph)

set.seed(2024)
g <- barabasi.game(100, power = 1, directed = FALSE)

centrality_df <- data.frame(
    Node = 1:100,
    Degree = degree(g),
    Betweenness = betweenness(g),
    Closeness = closeness(g),
    Eigenvector = eigen_centrality(g)$vector
)

hub_nodes <- order(centrality_df$Degree, decreasing = TRUE)[1:5]
print("Hub 节点（度最高的前 5 个）:")
print(centrality_df[hub_nodes, ])
```

```python
import networkx as nx
import pandas as pd

G = nx.barabasi_albert_graph(100, 3, seed=2024)

df = pd.DataFrame({
    'Degree': nx.degree_centrality(G),
    'Betweenness': nx.betweenness_centrality(G),
    'Closeness': nx.closeness_centrality(G),
    'Eigenvector': nx.eigenvector_centrality(G, max_iter=1000),
    'PageRank': nx.pagerank(G)
})
print("中心性指标相关性:")
print(df.corr().round(3))
```

### 2.8.4.2 社区检测

社区检测将网络划分为内部紧密、外部稀疏的子网络。Louvain 通过模块度贪婪优化速度快；Leiden 是其改进版保证良好连接；Walktrap 基于随机游走距离；Infomap 使用信息论编码。

```python
import networkx as nx
from networkx.algorithms.community import (
    louvain_communities, greedy_modularity_communities
)

G = nx.random_partition_graph([30, 30, 40], 0.3, 0.02, seed=2024)

louvain_parts = louvain_communities(G, seed=2024)
greedy_parts = list(greedy_modularity_communities(G))

print(f"Louvain: {len(louvain_parts)} 社区, 模块度 = "
      f"{nx.algorithms.community.modularity(G, louvain_parts):.4f}")
print(f"贪婪优化: {len(greedy_parts)} 社区, 模块度 = "
      f"{nx.algorithms.community.modularity(G, greedy_parts):.4f}")
```

### 2.8.4.3 网络鲁棒性

通过模拟节点或边移除评估抗干扰能力。无标度网络对随机错误鲁棒，但对靶向移除 hub 节点非常脆弱。在生物网络中可识别必需基因和脆弱环节。

## 2.8.5 网络可视化

**Cytoscape** 是生物网络可视化的核心平台，支持 SIF、GML、XGMML 格式，通过 App 扩展功能：ClueGO（富集）、MCODE（模块）、CytoHubba（hub 识别）、stringApp（STRING 导入）。

**igraph**（R/Python）实现数百种网络算法，适合脚本化分析。**ggraph** 将网络图集成到 ggplot2 语法。**visNetwork** 基于 vis.js 提供 R/Shiny 交互可视化。**Gephi** 适合大规模网络布局探索。

```r
library(igraph)

set.seed(2024)
g <- barabasi.game(100, power = 1, directed = FALSE)
communities <- cluster_louvain(g)

plot(communities, g,
     vertex.size = degree(g) * 0.5,
     vertex.label = NA,
     main = "网络社区结构")
```

::: tip 可视化策略
大型网络优先用力导向布局（Fruchterman-Reingold）揭示结构，再按模块着色。节点大小映射度或介数，边粗细映射权重。超过 1000 节点考虑先做社区检测再分块渲染。
:::

## 2.8.6 通路与富集分析

### 2.8.6.1 通路数据库

**KEGG** 提供人工整理的代谢和信号通路图，是通路分析的标准参考。**Reactome** 专注于人类生物学，通路具有层次结构并附详细文献注释。**Pathway Commons** 整合多数据库提供统一查询接口。

### 2.8.6.2 过表达分析（ORA）

对差异基因列表做超几何检验，识别显著富集的通路。

```r
library(clusterProfiler)
library(org.Hs.eg.db)

# 假设 deg_genes 是差异基因 symbol 列表
deg_genes <- c("TP53", "MDM2", "CDKN1A", "BAX", "BCL2", "MYC", "RB1")

ego <- enrichGO(gene = deg_genes,
                OrgDb = org.Hs.eg.db,
                keyType = "SYMBOL",
                ont = "BP",
                pAdjustMethod = "BH",
                pvalueCutoff = 0.05)
head(ego@result, 10)

# KEGG 通路富集
ekegg <- enrichKEGG(gene = bitr(deg_genes, "SYMBOL", "ENTREZID", org.Hs.eg.db)$ENTREZID,
                    organism = "hsa")
head(ekegg@result, 10)
```

### 2.8.6.3 基因集富集分析（GSEA）

GSEA 不需要预先定义差异基因，而是对全基因按表达变化排序后检验基因集是否在排序顶部或底部富集，能捕捉微小但协同的变化。

```r
library(clusterProfiler)
library(ReactomePA)

# geneList 是按 logFC 降序排序的命名向量
# 实际数据来自差异表达分析
set.seed(2024)
geneList <- sort(rnorm(1000), decreasing = TRUE)
names(geneList) <- paste0("Gene_", 1:1000)

# Reactome 通路 GSEA
# 实际使用需要 ENTREZID
# gse_res <- gsePathway(geneList, organism = "human", pvalueCutoff = 0.05)
```

::: warning ORA vs GSEA
ORA 依赖阈值切割差异基因，会丢失边界基因信息。GSEA 使用全基因排序，更敏感但需要完整排序列表。样本量小、效应弱时优先 GSEA。
:::

### 2.8.6.4 通路拓扑富集

传统富集将基因视为独立集合。拓扑富集考虑基因在通路中的位置和连接度，如 SPIA、Pathway-Express。Hub 节点或关键分支点的变化权重更高。

## 2.8.7 多组学整合

### 2.8.7.1 相似性网络融合（SNF）

SNF 将不同组学数据转为样本相似性网络，再通过迭代融合保留互补信息，在癌症亚型分类中表现优异。

### 2.8.7.2 异构网络与多层网络

异构网络包含多种节点类型（基因、疾病、药物、通路），可整合不同层次的生物信息。多层网络将同一组节点在不同关系层（PPI、共表达、遗传互作）上的连接分开表示，揭示关系间的相互作用。

### 2.8.7.3 网络对齐

IsoRank、NetAligner 寻找不同网络间节点和子结构的对应关系，用于比较物种间的网络保守性，识别进化上保守的功能模块。

## 2.8.8 疾病网络与药物重定位

疾病-基因关联网络（DisGeNET、OMIM、ClinVar）将疾病与相关基因连接，可揭示共享遗传基础的疾病簇。药物-靶点网络（DrugBank、TTD）描述药物与作用靶点关系，是药物重定位的核心资源。

**疾病模块假说**：疾病相关基因在 PPI 网络中形成紧密连接区域。若药物靶点模块与疾病模块在网络中重叠或邻近，则该药物可能对该疾病有效。

**网络扩散方法**：随机游走重启（RWR）从种子节点（药物靶点或疾病基因）出发，在网络中传播信号，计算其他节点的访问概率，用于基因优先级排序和药物重定位。

```python
import networkx as nx
import numpy as np

def random_walk_with_restart(G, seed_nodes, restart_prob=0.7, max_iter=100):
    n = G.number_of_nodes()
    p0 = np.zeros(n)
    p0[seed_nodes] = 1.0 / len(seed_nodes)

    A = nx.to_numpy_array(G)
    degree = A.sum(axis=1)
    degree[degree == 0] = 1
    T = A / degree[:, np.newaxis]

    p = p0.copy()
    for _ in range(max_iter):
        p_new = (1 - restart_prob) * T.T @ p + restart_prob * p0
        if np.linalg.norm(p_new - p) < 1e-6:
            break
        p = p_new
    return p

np.random.seed(2024)
G = nx.barabasi_albert_graph(500, 3, seed=2024)
drug_targets = [10, 25, 42, 78, 103]
disease_genes = [45, 89, 156, 201, 267]

scores = random_walk_with_restart(G, drug_targets)
print("药物靶点对疾病基因的网络传播得分:")
for gene in disease_genes:
    print(f"  基因 {gene}: {scores[gene]:.6f}")
```

## 2.8.9 动态建模基础

### 2.8.9.1 常微分方程（ODE）

ODE 模型描述分子浓度的连续变化，dx/dt = f(x, p)。质量作用定律用于基元反应 v = k[A][B]；米氏动力学描述酶反应 v = Vmax[S]/(Km + [S])；希尔方程建模协同结合 Y = [L]^n/(Kd + [L]^n)。

```r
library(deSolve)

# p53-MDM2 负反馈振荡模型
p53_mdm2_model <- function(time, state, params) {
    with(as.list(c(state, params)), {
        dp53 <- k_synth + (k_act * D * p53) / (K_act + p53) -
                k_deg_p53 * MDM2 * p53
        dMDM2 <- (k_trans * p53^n) / (K_trans^n + p53^n) - k_deg_mdm2 * MDM2
        list(c(dp53, dMDM2))
    })
}

params <- c(k_synth = 0.1, k_act = 2.0, D = 1.0, K_act = 0.5,
            k_trans = 1.5, K_trans = 0.3, n = 4,
            k_deg_p53 = 1.0, k_deg_mdm2 = 0.08)

out <- ode(y = c(p53 = 0.1, MDM2 = 0.05),
           times = seq(0, 48, 0.1),
           func = p53_mdm2_model, parms = params)

plot(out[, "time"], out[, "p53"], type = "l", col = "red",
     xlab = "时间 (h)", ylab = "浓度", main = "p53-MDM2 振荡")
lines(out[, "time"], out[, "MDM2"] * 5, col = "blue", lty = 2)
```

::: note 分岔与敏感性
参数变化可引起系统定性改变，称为分岔。p53-MDM2 系统中损伤信号强度 D 超过阈值时从稳态转为振荡。敏感性分析识别关键参数（通常是降解速率常数），指导药物靶点选择。
:::

### 2.8.9.2 随机与离散建模

分子数目少时随机涨落显著，Gillespie 算法精确模拟化学主方程，τ-leaping 是其加速近似。布尔网络将基因状态简化为开/关，通过逻辑函数描述调控，适合大规模网络。BoolNet 是 R 中分析布尔网络的工具，可识别吸引子对应细胞表型。

### 2.8.9.3 建模工具

COPASI 提供图形化 ODE 和随机模拟；CellDesigner 用于绘制 SBML 模型；Tellurium 是 Python 环境；BioModels 数据库存储已发表模型。SBML 是模型交换标准格式。

## 2.8.10 单细胞与空间网络分析

**单细胞共表达网络**：hdWGCNA、scWGCNA 针对单细胞数据高维度和稀疏性优化，识别细胞类型特异性共表达模块。

**细胞-细胞通讯网络**：CellChat、NicheNet、CellPhoneDB 从配体-受体相互作用推断细胞间信号传递。CellChat 计算通信概率（综合配体表达、受体表达和先验强度），从配体-受体对、信号通路、细胞群体三层面解析通讯模式。

```r
library(CellChat)

# 假设 seurat_obj 是已注释的 Seurat 对象
# 实际流程
# cellchat <- createCellChat(object = seurat_obj@assays$RNA@data,
#                            meta = seurat_obj@meta.data, group.by = "cell_type")
# cellchat@DB <- CellChatDB.human
# cellchat <- subsetData(cellchat)
# cellchat <- identifyOverExpressedGenes(cellchat)
# cellchat <- identifyOverExpressedInteractions(cellchat)
# cellchat <- computeCommProb(cellchat)
# cellchat <- filterCommunication(cellchat, min.cells = 10)
# cellchat <- aggregateNet(cellchat)
#
# netVisual_circle(cellchat@net$weight,
#                  vertex.label = levels(cellchat@idents))

cat("CellChat 流程: 创建对象 -> 加载配体受体库 -> 预处理 ->\n")
cat("计算通信概率 -> 过滤 -> 聚合网络 -> 可视化\n")
```

**空间邻近网络**：空间转录组保留细胞位置信息，基于物理距离构建邻近网络，结合配体-受体分析识别空间特异性通讯，可验证 CellChat 预测的细胞间邻近性。

**单细胞调控网络**：SCENIC+ 结合共表达和 motif 分析推断细胞类型特异性调控网络；Pando 使用多模态数据（ATAC + RNA）提高推断准确性。

## 2.8.11 实战示例

### 2.8.11.1 WGCNA 识别乳腺癌模块

从 TCGA 乳腺癌 RNA-seq 数据出发，筛选高变异基因（MAD 前 25%），选择软阈值 β 使网络符合无标度拓扑，构建 TOM 并层次聚类识别模块，将模块特征基因与 ER 状态等临床性状关联。

```r
library(WGCNA)
library(clusterProfiler)
library(org.Hs.eg.db)
library(survival)

# 模块特征基因与临床性状关联
# moduleTraitCor <- cor(MEs, clinical_data, use = "p")
# significant_modules <- which(abs(moduleTraitCor[, "ER_status"]) > 0.7)

# Hub 基因：基因显著性 GS 与模块成员关系 MM 均高
# geneSignificance <- cor(expr_filtered, clinical_data$ER_status)
# moduleMembership <- cor(expr_filtered, MEs[, module_of_interest])
# hub_genes <- names(which(geneSignificance > 0.8 & moduleMembership > 0.8))

# GO 富集
# ego <- enrichGO(gene = hub_genes, OrgDb = org.Hs.eg.db,
#                 keyType = "SYMBOL", ont = "BP")

# 生存分析验证预后价值
# fit <- survfit(Surv(time, event) ~ group_high, data = clinical_data)
# surv_diff <- survdiff(Surv(time, event) ~ group_high)

cat("WGCNA 流程: 数据预处理 -> 软阈值选择 -> TOM 构建 ->\n")
cat("动态剪树 -> 模块-性状关联 -> Hub 基因识别 -> 功能富集 -> 生存验证\n")
```

::: tip 模块分析的稳健性
模块水平分析比单基因更稳健，减少多重比较问题。模块特征基因作为整体代表，适合构建预后模型。
:::

### 2.8.11.2 GENIE3 推断调控网络

GENIE3 将调控推断转化为回归问题：每个靶基因为响应变量，所有转录因子为预测变量，训练随机森林并提取变量重要性作为调控权重。

```r
library(GENIE3)
library(igraph)

# weight_matrix <- GENIE3(expression_mat, regulators = tf_names, nCores = 4)
# link_list <- getLinkList(weight_matrix)
# filtered_links <- link_list[1:ceiling(nrow(link_list) * 0.05), ]  # top 5%
#
# net <- graph_from_data_frame(filtered_links, directed = TRUE)
# hub_tfs <- sort(degree(net, mode = "out"), decreasing = TRUE)[1:10]
# communities <- cluster_louvain(as.undirected(net))

cat("GENIE3 流程: 表达矩阵 + TF 列表 -> 随机森林回归 ->\n")
cat("权重矩阵 -> 阈值过滤 -> 网络验证 -> 模块检测 -> motif 富集\n")
```

### 2.8.11.3 网络药理学预测中药机制

以黄连解毒汤治疗类风湿关节炎为例：从 TCMSP 筛选活性成分（OB ≥ 30% 且 DL ≥ 0.18），SwissTargetPrediction 预测靶点，与 GeneCards 疾病基因取交集，构建成分-靶点-疾病网络和 PPI 网络，clusterProfiler 做 KEGG 富集，AutoDock Vina 做分子对接验证。

```r
library(igraph)
library(clusterProfiler)

# 核心流程
# 1. 活性成分筛选: OB >= 30 且 DL >= 0.18
# 2. 靶点预测: SwissTargetPrediction + STITCH + PharmMapper
# 3. 疾病基因: GeneCards + DisGeNET + OMIM
# 4. 取交集: compound_targets ∩ disease_genes
# 5. 构建 PPI 网络 (STRING)
# 6. MCODE 模块检测
# 7. KEGG/GO 富集
# 8. 分子对接验证 (AutoDock Vina, 结合能 < -7 kcal/mol 为强结合)

cat("网络药理学流程: 成分筛选 -> 靶点预测 -> 疾病基因 ->\n")
cat("交集 -> PPI 网络 -> 模块检测 -> 通路富集 -> 分子对接\n")
```

### 2.8.11.4 CellChat 解析肿瘤免疫微环境

从 scRNA-seq 数据推断细胞间通讯，识别肿瘤细胞通过 PD-L1 抑制 T 细胞、CAF 通过 TGF-β 促免疫抑制等关键信号轴，预测免疫治疗响应。

```r
library(CellChat)

# 完整流程
# cellchat <- createCellChat(object = expr_matrix, meta = meta_df, group.by = "cell_type")
# cellchat@DB <- CellChatDB.human
# cellchat <- subsetData(cellchat)
# cellchat <- identifyOverExpressedGenes(cellchat)
# cellchat <- identifyOverExpressedInteractions(cellchat)
# cellchat <- computeCommProb(cellchat)
# cellchat <- filterCommunication(cellchat, min.cells = 10)
# cellchat <- aggregateNet(cellchat)
# cellchat <- netAnalysis_computeCentrality(cellchat, slot.name = "netP")
#
# # 圈图可视化
# netVisual_circle(cellchat@net$weight, vertex.label = levels(cellchat@idents))
#
# # 信号通路热图
# netAnalysis_signalingRole_heatmap(cellchat, pattern = "outgoing")
#
# # 免疫检查点子网络
# # 检查 PD-L1 (CD274) 与 PD-1 (PDCD1) 的通信概率

cat("CellChat 流程: 创建对象 -> 加载 LR 库 -> 计算通信概率 ->\n")
cat("聚合网络 -> 中心性分析 -> 通路热图 -> 检查点子网络\n")
```

::: warning 空间验证
CellChat 基于单细胞数据丢失空间信息。配体-受体相互作用通常需要物理邻近，应结合空间转录组或多重免疫荧光验证预测的细胞间邻近性。
:::

## 2.8.12 网络分析与机器学习

**图嵌入**将节点映射到低维向量空间保留网络结构。node2vec 使用随机游走 + Word2Vec；GraphSAGE 采样邻居聚合特征；图卷积网络（GCN）扩展卷积到图结构；图注意力网络（GAT）用注意力机制加权邻居。

**链路预测**预测缺失边，特征工程方法提取共同邻居、Jaccard、Adamic-Adar 等相似性，深度方法使用图自编码器。应用于 PPI 网络补全和药物-靶点预测。

**网络显著性检验**：通过排列检验评估网络特征（模块度、基因集聚集）的统计显著性。配置模型保持度序列随机化边连接，构建零分布。

```python
import networkx as nx
from gensim.models import Word2Vec
import numpy as np

def random_walk(G, start, length):
    walk = [start]
    for _ in range(length - 1):
        neighbors = list(G.neighbors(walk[-1]))
        if not neighbors:
            break
        walk.append(np.random.choice(neighbors))
    return walk

G = nx.karate_club_graph()
walks = []
for _ in range(10):
    for node in G.nodes():
        walks.append([str(n) for n in random_walk(G, node, 20)])

model = Word2Vec(walks, vector_size=64, window=5, min_count=1, sg=1)
print(f"节点 0 的嵌入向量 (前 10 维): {model.wv['0'][:10].round(4)}")
```

::: note 本章来源
本节内容由原 reStructuredText 文件迁移并精简而来。
:::
