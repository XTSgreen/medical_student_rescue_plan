---
title: 2.7 蛋白质组学与代谢组学
sidebar:
  order: 7
---

# 2.7 蛋白质组学与代谢组学

蛋白质组学关注基因表达的最终产物——蛋白质的丰度、修饰与相互作用；代谢组学研究细胞内小分子代谢物的整体变化，最直接反映即时生理状态。两者共同构成系统生物学的重要层次，在疾病标志物发现、药物靶点鉴定和通路解析中发挥关键作用。本节聚焦从结构基础到数据分析的核心方法。

## 2.7.1 蛋白质结构与序列基础

蛋白质功能由其结构决定。结构层次分为四级：一级结构指氨基酸序列，决定所有高层次结构信息；二级结构由氢键稳定，包括 α 螺旋、β 折叠和无规卷曲；三级结构是整条多肽链在三维空间的折叠；四级结构由多条多肽链（亚基）组装形成功能性复合物。理解这些层次有助于选择合适的分析工具。

```r
# 使用 Bioconductor 分析蛋白质序列理化性质
library(Biostrings)
library(Peptides)

seq <- "MKWVTFISLLFLFSSAYSRGVFRRDTHKSEIAHRFKDLGE"
aa_seq <- AAString(seq)

cat(sprintf("序列长度: %d aa\n", length(aa_seq)))
cat(sprintf("分子量: %.2f Da\n", mw(seq)))
cat(sprintf("等电点 pI: %.2f\n", pI(seq)))
cat(sprintf("疏水性 GRAVY: %.3f\n", gravy(seq)))
cat(sprintf("半衰期 (mammalian): %s h\n", halfLife(seq)[1]))
```

::: tip 序列分析要点
等电点（pI）决定蛋白在等电聚焦中的迁移行为；疏水性（GRAVY）影响膜蛋白预测和分离策略；不稳定指数（II）> 40 提示蛋白体内半衰期较短。
:::

结构域是蛋白质的独立功能单元。InterPro、Pfam、SMART 数据库提供结构域注释。预测工具包括 HMMER（基于隐马尔可夫模型）和 InterProScan（整合多数据库）。当分析差异蛋白时，结构域富集可揭示功能共性。

```r
# 蛋白序列中跨膜区与信号肽预测（示意）
# TMHMM 和 SignalP 通常通过命令行调用
# R 端可用 kebab 或 prophene 等辅助包整理结果

# 模拟结构域注释结果
domain_annotation <- data.frame(
    Protein = c("EGFR_HUMAN", "EGFR_HUMAN", "TP53_HUMAN"),
    Domain = c("Receptor_L_domain", "Protein_kinase_domain", "P53_DNA_bind"),
    Start = c(1, 712, 95),
    End = c(165, 979, 288),
    Source = c("Pfam PF00757", "Pfam PF00069", "Pfam PF00870"),
    stringsAsFactors = FALSE
)
print(domain_annotation)
```

蛋白质结构预测是连接序列与三维结构的桥梁。AlphaFold2 利用深度学习从多序列比对中提取信息，在 CASP14 中取得革命性突破，使高精度结构预测进入实用阶段。pLDDT 是 AlphaFold2 输出的局部置信度评分（0-100），> 70 为高可信，< 50 可能无序。R 生态结构分析较弱，预测与结构评估主要在 Python 中完成。

```python
# AlphaFold2 预测结果质量评估
import json
import numpy as np

def analyze_plddt(json_file):
    """解析 AlphaFold2 输出的 pLDDT 置信度"""
    with open(json_file, 'r') as f:
        data = json.load(f)

    plddt = np.array(data[0]['plddt'])
    seq_length = len(plddt)

    print(f"蛋白质长度: {seq_length} 残基")
    print(f"平均 pLDDT: {np.mean(plddt):.1f}")
    print(f"  >90 (极高置信): {np.sum(plddt > 90)} ({np.sum(plddt>90)/seq_length*100:.1f}%)")
    print(f"  >70 (高置信):   {np.sum(plddt > 70)} ({np.sum(plddt>70)/seq_length*100:.1f}%)")
    print(f"  <50 (可能无序): {np.sum(plddt <= 50)} ({np.sum(plddt<=50)/seq_length*100:.1f}%)")

    # 质量分级
    avg_plddt = np.mean(plddt)
    if avg_plddt > 90:
        quality = "极高 (适合药物设计)"
    elif avg_plddt > 70:
        quality = "良好 (可用于对接)"
    elif avg_plddt > 50:
        quality = "中等 (需谨慎使用)"
    else:
        quality = "较低 (建议使用实验结构)"
    print(f"整体质量评估: {quality}")
    return plddt

# R 与 Python 工具选择:
# - Python: AlphaFold2/ESMFold 预测、PyMOL 可视化、BioPython 结构处理
# - R: bio3d 包支持基本结构分析与动力学轨迹读取，但预测能力有限
```

## 2.7.2 质谱技术与数据采集

质谱（MS）是蛋白质组学和代谢组学的核心检测平台。电喷雾电离（ESI）与液相色谱联用（LC-MS/MS）是现代蛋白质组学标准配置，可在线分离复杂肽段混合物。基质辅助激光解吸电离（MALDI）适合高通量筛选和组织成像。高分辨平台（Orbitrap、Q-TOF、FT-ICR）提供精确的质量测定。

数据采集模式决定数据的覆盖深度与定量一致性。**数据依赖采集（DDA）**选择 MS1 中强度最高的 top N 母离子进行碎裂，鉴定质量高但偏向高丰度肽段。**数据非依赖采集（DIA）**按预设质量窗口逐一碎裂所有母离子，一致性好但数据处理复杂。**靶向模式（PRM/MRM）**预先选定目标肽段，灵敏度和重现性最佳。

```bash
# 原始数据转换为开放格式 mzML
msconvert input.raw --mzML \
    --filter "peakPicking true 1" \
    --zlib -o output_dir/

# DIA-NN 处理 DIA 数据（深度学习谱图库预测）
dia-nnn --f dia_data/*.dia \
    --lib library.tsv \
    --out dia_nn_output/ \
    --threads 16 --qvalue 0.01 --ppm 20
```

::: warning DIA 与 DDA 选择
大队列研究和临床验证优先选择 DIA 以保证跨样本一致性；新物种或新 PTM 发现性研究推荐 DDA 以获得更高质量的 MS/MS 谱图用于数据库搜索。
:::

Bioconductor 的 **MSnbase** 包提供质谱数据的 R 原生处理能力，支持 mzML、mzXML 等开放格式的读写、可视化与基础数据处理。ProtGenerics 定义了质谱数据处理的通用接口，使不同分析包实现互通。Pyteomics 是 Python 生态对应工具，适合脚本化批处理。

```r
# MSnbase 读取与处理质谱数据
library(MSnbase)

# 读取 mzML 文件
# ms_data <- readMSData("sample.mzML", mode = "onDisk")

# 模拟质谱数据处理流程
# 1. 谱图清理（去除低质量峰）
# clean_data <- clean(ms_data)
# 2. 去除低强度噪声
# filtered_data <- filterIntensity(clean_data, threshold = 1000)
# 3. 峰中心化（提高质量精度）
# centered_data <- pickPeaks(filtered_data)
# 4. 谱图可视化
# plot(centered_data[[1]], full = TRUE)

cat("MSnbase 核心功能: 读取、清理、峰检测、可视化\n")
cat("ProtGenerics 标准接口: chromatogram, spectra, peaksCount, tic\n")
```

```python
# Python 对应实现（pyteomics 读取质谱数据）
# from pyteomics import mzml, auxiliary
# import matplotlib.pyplot as plt

# with mzml.read("sample.mzML") as reader:
#     for spectrum in reader:
#         if spectrum["ms level"] == 2:
#             mz = spectrum["m/z array"]
#             intensity = spectrum["intensity array"]
#             # 谱图处理与可视化
#             break

# R 与 Python 选择建议:
# - R (MSnbase): 与 Bioconductor 生态深度集成，下游统计与 Biostrings、limma 无缝衔接
# - Python (pyteomics): 适合大规模文件批处理、深度学习管道预处理、与 pandas/scikit-learn 整合
```

## 2.7.3 蛋白质定量与差异分析

定量策略分标记与非标记两类。**TMT/iTRAQ** 等压标记支持多路复用（最多 16 样本），但存在比率压缩问题。**SILAC** 代谢标记适合培养细胞，定量精度高。**Label-free（LFQ）** 基于谱图计数或 MS1 峰面积，操作简单且通量高。

MaxQuant 是蛋白质组学最广泛使用的分析软件套件，集成 Andromeda 搜索引擎、LFQ 算法和 PTM 鉴定功能。Perseus 配套 MaxQuant 用于下游统计分析、可视化和功能注释，支持过滤、归一化、聚类和富集分析的完整流程。

```r
# MSstats 差异蛋白分析流程
library(MSstats)

# 输入数据需包含 ProteinName, Condition, BioReplicate, Run, Intensity
sample_info <- data.frame(
    ProteinName = rep(paste0("Protein_", sprintf("%04d", 1:100)), each = 6),
    Condition = rep(c("Control", "Treatment"), each = 3, times = 100),
    BioReplicate = rep(1:3, times = 200),
    Run = rep(1:6, times = 100),
    Intensity = c(rlnorm(300, 10, 0.5), rlnorm(300, 11, 0.5))
)

processed <- MSstats::dataProcess(sample_info,
    normalization = "globalStandards",
    summaryMethod = "TMP")

comparison <- matrix(c(-1, 1), nrow = 1)
rownames(comparison) <- "Treatment_vs_Control"
result <- MSstats::groupComparison(processed, contrast.matrix = comparison)
head(result$ComparisonResult)
```

差异蛋白分析需考虑蛋白质组数据方差随丰度变化的特性。**DEqMS** 在 limma 基础上引入肽段数作为先验，对低肽段数蛋白给出更稳健的统计推断，是蛋白质组数据特异化的差异分析工具。

```r
# DEqMS 蛋白质组特异差异分析
library(DEqMS)
library(limma)

set.seed(123)
expr_matrix <- matrix(rnorm(500 * 12, mean = 10, sd = 2), nrow = 500)
rownames(expr_matrix) <- paste0("Protein_", 1:500)
colnames(expr_matrix) <- paste0(c("Ctrl_", "Treat_"), rep(1:6, each = 2))

# 注入差异
expr_matrix[1:30, 7:12] <- expr_matrix[1:30, 7:12] + 3

group <- factor(c(rep("Control", 6), rep("Treatment", 6)))
design <- model.matrix(~group)

fit <- lmFit(expr_matrix, design)
fit <- eBayes(fit)

# DEqMS 额外使用肽段数信息
proteinInfo <- data.frame(
    uniqueID = rownames(expr_matrix),
    nPep = sample(1:20, 500, replace = TRUE),
    spInt = runif(500, 1e6, 1e9)
)
fit_deqms <- DEqMS(expr_matrix, design, group, proteinInfo)
res <- topTable(fit_deqms, coef = 2, number = Inf)

cat(sprintf("显著差异蛋白 (FDR<0.05, |logFC|>1): %d\n",
    sum(res$adj.P.Val < 0.05 & abs(res$logFC) > 1)))
```

缺失值处理是蛋白质组数据的关键环节。缺失值分两类：MCAR（随机缺失）适合 KNN 或随机森林插补；MNAR（非随机缺失，多为低丰度未检出）适合最小值替换法。归一化方法包括中位数归一化、分位数归一化和 VSN。选择应基于数据特征和实验设计。

## 2.7.4 蛋白质功能注释与相互作用

差异蛋白列表需要置于功能背景下解读。GO 和 KEGG 富集分析与转录组学方法基本一致，但蛋白质组数据基因数量较少，需注意统计功效。InterPro 结构域富集可揭示结构功能层面的共性。

```r
# 蛋白质功能富集分析
library(clusterProfiler)
library(org.Hs.eg.db)

sig_proteins <- c("TP53", "BRCA1", "MYC", "AKT1", "MTOR",
                  "EGFR", "VEGFA", "BCL2", "CASP3", "CDKN1A")
entrez_ids <- bitr(sig_proteins, fromType = "SYMBOL",
                   toType = "ENTREZID", OrgDb = org.Hs.eg.db)

go_bp <- enrichGO(gene = entrez_ids$ENTREZID, OrgDb = org.Hs.eg.db,
                  ont = "BP", pAdjustMethod = "BH", pvalueCutoff = 0.05)
head(go_bp)

kegg_res <- enrichKEGG(gene = entrez_ids$ENTREZID, organism = 'hsa',
                        pAdjustMethod = "BH", pvalueCutoff = 0.05)
head(kegg_res)
```

蛋白质相互作用（PPI）网络将差异蛋白置于全局互作背景下解读。**STRING** 数据库整合实验、共表达、文本挖掘等多种证据，置信度评分可调。**BioGRID** 侧重实验验证的物理和遗传相互作用，覆盖多物种。两者均提供 R 接口（STRINGdb、BioGRID）方便批量分析。

```r
# STRING 相互作用网络分析
library(STRINGdb)

string_db <- STRINGdb$new(version = "12.0", species = 9606,
                          score_threshold = 700, input_directory = "")

# 映射蛋白并提取互作网络
mapped <- string_db$map(sig_proteins, "gene", removeUnmappedRows = TRUE)
hits <- mapped$STRING_id

# 获取互作对
interactions <- string_db$get_interactions(hits)
cat(sprintf("互作边数: %d\n", nrow(interactions)))

# Hub 蛋白识别（连接度最高）
degree_table <- sort(table(c(interactions$from, interactions$to)),
                     decreasing = TRUE)
cat("Top 5 hub 蛋白:\n"); print(head(degree_table, 5))
```

::: note PPI 数据库选择
STRING 适合综合证据的网络构建和可视化；BioGRID 适合需要严格实验证据支持的互作研究；对于深度验证，IntAct 提供最详细的互作检测方法注释。
:::

## 2.7.5 翻译后修饰组学

翻译后修饰（PTM）极大扩展蛋白质功能空间，目前已识别超过 400 种 PTM 类型。PTM 动态调控蛋白质活性、稳定性、定位和相互作用，多数疾病的分子机制与异常 PTM 相关。

磷酸化是研究最成熟的 PTM。磷酸肽在总肽段中占比不到 1%，富集步骤至关重要。TiO2 和 IMAC 是两种主流磷酸肽富集方法，联合使用可提高覆盖度。位点定位使用 PhosphoRS 计算定位置信度，概率 > 0.75 为可靠，> 0.95 为高置信。

```r
# 磷酸化位点分析示例
phospho_sites <- data.frame(
    gene = c("EGFR", "MAPK1", "AKT1", "RB1"),
    position = c(992, 185, 473, 807),
    localization_prob = c(0.99, 0.92, 0.88, 0.96),
    motif = c("[ST]Px[RK]", "[ST]P", "[RK]x[ST]", "[ST]Px[K]"),
    logFC = c(-2.3, -1.8, -2.1, -1.5),
    stringsAsFactors = FALSE
)

# 高置信位点筛选
high_conf <- phospho_sites[phospho_sites$localization_prob > 0.75, ]
cat(sprintf("高置信磷酸化位点: %d / %d\n", nrow(high_conf), nrow(phospho_sites)))

# 激酶-底物推断（基序推断上游激酶家族）
motif_to_kinase <- list(
    "[ST]P" = "MAPK/CDK",
    "[ST]Px[RK]" = "CDK",
    "[RK]x[ST]" = "PKA/PKB (AKT)"
)
for (i in seq_len(nrow(high_conf))) {
    kinase_family <- motif_to_kinase[[high_conf$motif[i]]]
    cat(sprintf("  %s %d (%s) -> %s\n", high_conf$gene[i],
        high_conf$position[i], high_conf$motif[i], kinase_family))
}
```

其他常见 PTM 类型：泛素化使用 K-ε-GG 抗体富集（特征质量偏移 +114.043 Da）；乙酰化在代谢调控中重要，用抗乙酰赖氨酸抗体富集；糖基化分 N-糖（NXS/T 共有序）和 O-糖（无共有序列），HILIC 或凝集素富集；甲基化需高分辨质谱区分乙酰化（Δ = 0.036 Da）。

## 2.7.6 代谢组学数据处理

代谢组学最能反映即时生理状态。非靶向代谢组学尽可能全面检测所有代谢物，适合发现性研究；靶向代谢组学使用标准品绝对定量，适合验证和临床检测。样本淬灭需立即终止酶活性，原则是越快越冷越好。

```r
# 代谢组学数据预处理
set.seed(456)
n_metab <- 200
meta_matrix <- matrix(rlnorm(n_metab * 24, meanlog = 8, sdlog = 1.5),
                      nrow = n_metab, ncol = 24)
# 注入 5% 缺失值
meta_matrix[sample(length(meta_matrix), length(meta_matrix) * 0.05)] <- NA

cat(sprintf("原始特征数: %d × 样本数: %d\n", nrow(meta_matrix), ncol(meta_matrix)))
cat(sprintf("缺失值比例: %.1f%%\n",
    sum(is.na(meta_matrix)) / length(meta_matrix) * 100))

# 过滤高缺失特征
detect_rate <- rowSums(!is.na(meta_matrix)) / ncol(meta_matrix)
meta_filtered <- meta_matrix[detect_rate > 0.5, ]
cat(sprintf("过滤后特征数: %d\n", nrow(meta_filtered)))

# PQN 归一化（Probabilistic Quotient Normalization）
pqn_normalize <- function(mat) {
    ref_sample <- apply(mat, 1, median, na.rm = TRUE)
    quotients <- sweep(mat, 1, ref_sample, "/")
    median_quotient <- apply(quotients, 2, median, na.rm = TRUE)
    sweep(mat, 2, median_quotient, "/")
}
meta_norm <- pqn_normalize(meta_filtered)
meta_log <- log2(meta_norm + 1)
```

XCMS 是 R 生态最成熟的代谢组处理包，提供峰检测、对齐和分组功能。MZmine 提供 GUI 友好的桌面端，MS-DIAL 在亚洲广泛使用。

```r
# XCMS 数据处理流程
library(xcms)

# 峰检测参数（CentWave 算法适合高分辨 LC-MS 数据）
cwp <- CentWaveParam(
    peakwidth = c(5, 30),       # 色谱峰宽度范围（秒）
    snthresh = 10,              # 信噪比阈值
    prefilter = c(3, 10000),    # 前置过滤（峰数, 强度）
    ppm = 15                    # 质量精度
)

# xdata <- findChromPeaks(xdata, param = cwp)
# xdata <- groupChromPeaks(xdata,
#     param = PeakDensityParam(bw = 5, minFraction = 0.5))
# xdata <- fillChromPeaks(xdata)
# feature_matrix <- featureValues(xdata, value = "into")
```

多变量统计是代谢组学的核心分析手段。PCA 用于整体数据结构和异常值检测；PLS-DA 和 OPLS-DA 是有监督分类方法，VIP 值筛选重要变量。OPLS-DA 存在过拟合风险，必须用置换检验验证。

```r
# PCA 与差异代谢物筛选
group_info <- factor(rep(c("Control", "Disease"), each = 12))

pca_result <- prcomp(t(meta_log), scale. = TRUE, center = TRUE)
var_explained <- summary(pca_result)$importance[2, ] * 100
cat(sprintf("PC1: %.1f%%, PC2: %.1f%%\n",
    var_explained[1], var_explained[2]))

# 组间 PC1 差异检验
pc1_groups <- split(pca_result$x[, 1], group_info)
cat(sprintf("PC1 组间差异 p = %.2e\n",
    t.test(pc1_groups[[1]], pc1_groups[[2]])$p.value))

# 差异代谢物：fold change + FDR
p_values <- apply(meta_log, 1, function(x) {
    t.test(x[group_info == "Control"], x[group_info == "Disease"])$p.value
})
fold_change <- rowMeans(meta_log[, group_info == "Disease"]) -
               rowMeans(meta_log[, group_info == "Control"])
padj <- p.adjust(p_values, method = "BH")

sig_metabs <- which(padj < 0.05 & abs(fold_change) > log2(1.5))
cat(sprintf("差异代谢物数: %d\n", length(sig_metabs)))
```

代谢物鉴定遵循 MSI 四级标准：Level 1（标准品确认）、Level 2（谱图库匹配）、Level 3（分子式推测）、Level 4（未知特征）。HMDB、METLIN、MassBank、KEGG 是主要数据库。**MetaboAnalyst** 是最全面的在线代谢组学平台，覆盖从原始数据处理到通路富集和生物标志物发现的完整工作流。

```r
# 代谢通路富集（MetaboAnalystR）
library(MetaboAnalystR)

# 实际流程需要文件输入
# mSet <- InitDataObjects("conc", "stat", FALSE)
# mSet <- SetAnalStrategy(mSet, "tt")
# mSet <- PrepareOPLSR(mSet, imgSet, 1, 0, "F")
# mSet <- msea_metabo_analysis(mSet, "HMDB", "hyper", "qval", 0.05)
```

## 2.7.7 多组学整合分析

多组学整合融合基因组、转录组、蛋白质组、代谢组等多层次数据，构建更全面的生物学理解。每种数据类型维度、噪声水平和统计特性不同，整合方法需考虑这些差异。

**MOFA**（Multi-Omics Factor Analysis）使用贝叶斯因子分析模型，从多组学数据中识别共享和特异的变异因子，适用于无监督的整合。**DIABLO**（mixOmics 框架）使用多块稀疏 PLS 进行有监督的多组学整合和分类。**iNMF** 扩展 NMF 到多组学场景。

```r
# MOFA 多组学整合分析
library(MOFA2)

# 构建 MOFA 输入对象（实际数据需为 MultiAssayExperiment 或 list）
# mofa_data <- create_mofa(list(
#     RNA = rna_matrix,
#     Protein = prot_matrix,
#     Metabolite = metab_matrix
# ))
#
# model <- prepare_mofa(mofa_data,
#     views = c("RNA", "Protein", "Metabolite"),
#     factors = 10)
# model <- run_mofa(model, ncores = 4)
#
# plot_variance_explained(model)
# plot_factors(model, factors = 1:3)
```

典型应用场景包括：mRNA-蛋白表达相关性评估（通常 r = 0.4-0.6，不一致区域暗示翻译后调控）；代谢组与转录组共变化通路分析（如糖酵解上调伴随葡萄糖消耗和乳酸积累）；多组学聚类识别癌症亚型（iCluster、SNF）。

```r
# mRNA-蛋白表达一致性分析
set.seed(789)
n_genes <- 200
rna_expr <- matrix(rnorm(n_genes * 20, mean = 8, sd = 1.5), nrow = n_genes)
# 注入相关性
prot_expr <- rna_expr * 0.6 + matrix(rnorm(n_genes * 20, sd = 1), nrow = n_genes)

cor_vec <- sapply(1:n_genes, function(i) {
    cor(rna_expr[i, ], prot_expr[i, ], method = "pearson")
})

cat(sprintf("mRNA-蛋白平均相关性: r = %.3f\n", mean(cor_vec)))
cat(sprintf("高度一致 (r > 0.7): %d 个基因\n", sum(cor_vec > 0.7)))
cat(sprintf("弱相关 (r < 0.3): %d 个基因\n", sum(cor_vec < 0.3)))
```

## 2.7.8 空间组学与机器学习应用

空间组学保留样本位置信息，可在组织原位解析蛋白质和代谢物分布。MALDI 成像质谱（MALDI-IMS）是空间代谢组学和脂质组学的核心技术，逐点扫描组织切片，重建代谢物空间分布图。DESI-MS 在常压下操作，适合术中分析。Cardinal R 包支持 imzML 标准格式的空间统计分析。

```r
# Cardinal 空间质谱数据分析
library(Cardinal)

# 读取 imzML 数据
# ms_data <- readImzML("tissue_scan.imzML")

# 数据预处理
# ms_proc <- process(ms_data,
#     peakPick(method = "mad", snr = 3),
#     peakAlign(tolerance = 200, units = "ppm"),
#     normalize(method = "tic"))

# 可视化特定 m/z 空间分布
# image(ms_process, mz = 885.55, main = "PI(34:1) [M+H]+")

# 空间分割
# seg_result <- spatialShrunkenCentroids(ms_process, r = 1.5)
# image(seg_result, col = discrete.colors(4))
```

机器学习已深度应用于蛋白质组和代谢组学。**Percolator** 用半监督 SVM 重校准肽段鉴定打分，FDR 控制相同下可提升 20-50% 鉴定量。**Prosit** 基于深度神经网络预测肽段碎裂谱图，可替代或补充实验谱图库。**SIRIUS + CSI:FingerID** 用于代谢物结构预测，从 MS/MS 谱图推断分子指纹。

::: tip AI 工具应用建议
Prosit 预测谱图库特别适合 DIA 分析；SIRIUS 适合非靶向代谢组中无法通过谱图库匹配鉴定的未知特征峰；预测工具结果应视为候选而非结论，必须经实验验证。
:::

## 2.7.9 标准工作流与数据存档

标准化工作流保证研究的可重复性。**MaxQuant** 集成蛋白质组学全流程分析，**Skyline** 是靶向质谱的黄金标准工具。代谢组学侧，**MetaboAnalyst** 和 **MZmine** 提供完整 GUI 工作流。**nf-core/proteomics** 基于 Nextflow 提供容器化、可扩展的蛋白质组学管道，适合大队列处理。

```bash
# nf-core/proteomics 工作流
nextflow run nf-core/proteomics \
    --input 'raw_data/*.raw' \
    --fasta reference/uniprot_human.fasta \
    --protocol iRT \
    --profile docker \
    --max_cpus 16 --max_memory '64.GB' \
    -resume -workdir work_dir/
```

质量控制是评估数据可靠性的核心环节。**PTXQC** 自动生成 MaxQuant 输出的 QC 报告，包含鉴定数量趋势、质量误差分布、保留时间一致性等指标。QC4Metabolomics 服务代谢组数据，监控内标稳定性和批次漂移。建议在实验设计阶段就安排 pool QC、空白对照和标准品对照。

```r
# PTXQC 质量控制报告生成
# library(PTXQC)
# qc <- load_and_merge('mqpar_output/')
# report(qc, outputDir = 'qc_report/')
```

数据存档是发表研究的必要环节。**PRIDE**（EBI 维护）是蛋白质组学最常用的公共数据库；**MassIVE** 与 ProteomeXchange 联盟互联；**MetaboLights** 是代谢组学公开数据库，遵循 MSI 标准；**GNPS** 提供天然产物分子网络分析功能。

::: note 本节来源
本节内容由原 reStructuredText 文件迁移而来。如需查看原始 Sphinx 版本，请参考项目源码中的 .rst 文件。
:::
