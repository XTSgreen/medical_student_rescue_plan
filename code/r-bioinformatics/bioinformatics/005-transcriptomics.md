---
title: 2.5 转录组学分析
sidebar:
  order: 5
---

# 2.5 转录组学分析

转录组学研究特定时空条件下细胞或组织中所有RNA分子的集合，反映基因表达的动态状态。RNA-seq通过高通量测序捕获样本中RNA的序列信息，进而完成表达定量、差异表达分析和功能注释等任务。本章按数据流梳理RNA-seq分析的核心方法，重点呈现R语言生态下的分析实践。

## 2.5.1 RNA-seq 实验流程概览

RNA-seq实验设计需要在统计功效、成本和数据质量之间取得平衡。生物学重复来自不同个体，反映真实生物变异，是差异表达分析的必需条件；技术重复评估实验操作误差，通常不需要。每组至少3个生物学重复是统计检验的最低要求，5-6个重复能提高低表达基因的检测灵敏度。

测序策略决定数据的信息密度。双端测序从片段两端读序，提供更准确的剪接点识别和插入片段估计，适合可变剪接和新转录本发现；单端测序成本较低，能满足常规差异表达分析需求。基因表达谱分析通常需要20-30M reads，转录本组装和稀有转录本检测需要50-100M reads。

链特异性文库保留RNA分子的链方向信息，对反义转录本、重叠基因和lncRNA分析至关重要。dUTP法是常用的链特异性建库方法，通过在第二链cDNA合成时掺入dUTP实现方向标记。

```r
# 统计功效分析: 评估所需生物学重复数
library(RNASeqPower)
# 深度=20M, 离散度=0.4, alpha=0.05, power=0.8, 检测2倍变化
result <- RNASeqPower(nreps = 3:10, depth = 20, disp = 0.4,
                      alpha = 0.05, power = 0.8, effect = log2(2))
print(result)
```

::: warning 批次效应
批次效应来自实验时间、操作人员、试剂批次的系统性偏差。在实验设计阶段应随机化分配样本，将处理组均匀分布到各批次；无法消除时，需将批次信息纳入统计模型（如DESeq2的`design = ~ batch + condition`），而非事后数学校正。
:::

## 2.5.2 数据预处理与质控

原始测序数据需经质量评估和过滤才能用于比对。FastQC是基础质控工具，输出碱基质量分布、GC含量、接头污染等报告；MultiQC将多个样本的FastQC报告汇总为单一文档，便于批量比较。

接头修剪和质量过滤使用fastp完成，该工具集成质控、接头识别、滑动窗口过滤于一体，运行速度快且自动生成HTML报告。常见TruSeq接头序列为`AGATCGGAAGAGC`，fastp可自动检测双端数据的接头。

```bash
# 1. 质控
fastqc -t 8 -o qc/ raw_data/*.fastq.gz
multiqc -o qc/ qc/

# 2. 接头修剪与质量过滤
fastp -i sample_R1.fastq.gz -I sample_R2.fastq.gz \
    -o clean_R1.fq.gz -O clean_R2.fq.gz \
    --detect_adapter_for_pe \
    --cut_front --cut_tail \
    --cut_window_size 4 --cut_mean_quality 20 \
    --length_required 36 \
    --json fastp.json --html fastp.html

# 3. 去除rRNA reads (可选, 当rRNA比例>5%时)
sortmerna --ref silva-bac-16s-id.fasta,silva-bac-16s-id-index \
          --reads clean_R1.fq.gz --reads clean_R2.fq.gz \
          --other non_rRNA_1.fq.gz --other non_rRNA_2.fq.gz \
          --paired_in --fastx --log -a 8
```

Phred质量分数衡量碱基可靠性：Q20表示99%正确率，Q30表示99.9%正确率。滑动窗口策略在读段上滑动固定窗口，计算窗口内平均质量，低于阈值则截断后续碱基，比固定位置截断更灵活。

::: tip Globin去除
全血样本中globin mRNA可占总mRNA的50-70%，会严重稀释其他基因信号。研究全血或PBMC转录组时，建议在计算阶段比对到globin参考序列过滤相关reads，或使用globin去除建库试剂盒。
:::

## 2.5.3 序列比对

RNA-seq比对的特殊之处在于读段可能跨越剪接点，传统DNA比对器无法处理跨外显子的比对。剪接感知比对器（splice-aware aligner）专门设计用于识别剪接连接，将读段正确定位到基因组。

STAR采用两阶段比对策略：第一阶段使用最大可扩展种子快速定位候选位置，第二阶段进行精确比对。STAR速度快、灵敏度高，数小时内可完成人类全转录组比对。HISAT2采用分层图FM-index，索引文件更小、加载更快，适合内存受限环境。

索引构建需要参考基因组FASTA和基因注释GTF。GTF使比对器利用已知剪接位点提高准确性。STAR的`--sjdbOverhang`参数应设为读段长度减1。

```bash
# STAR比对流程
# 1. 构建基因组索引
STAR --runThreadN 16 \
     --runMode genomeGenerate \
     --genomeDir /path/to/STAR_index \
     --genomeFastaFiles GRCh38.fa \
     --sjdbGTFfile gencode.v44.annotation.gtf \
     --sjdbOverhang 149

# 2. 剪接感知比对
STAR --runThreadN 16 \
     --genomeDir /path/to/STAR_index \
     --readFilesIn clean_R1.fq.gz clean_R2.fq.gz \
     --readFilesCommand zcat \
     --outFileNamePrefix sample1_ \
     --outSAMtype BAM SortedByCoordinate \
     --quantMode GeneCounts \
     --twopassMode Basic

# 3. HISAT2比对 (替代方案, 内存占用更低)
hisat2-build GRCh38.fa hisat2_index/grch38
hisat2 -p 16 -x hisat2_index/grch38 \
    -1 clean_R1.fq.gz -2 clean_R2.fq.gz -S sample1.sam
```

比对质量评估使用RSeQC和Qualimap，检查比对率、外显子/内含子分布、5'/3'偏向性、基因体覆盖均一性等指标。SAM是文本格式比对结果，BAM是二进制压缩格式，CRAM是更高压缩比的存储格式（比BAM小40-60%）。

## 2.5.4 表达定量

定量方法分为基于完整比对和基于伪比对（quasi-alignment）两类。前者从BAM文件统计每个基因的reads数，后者通过k-mer索引快速推断read来源，速度极快且保持相当准确性。

### 2.5.4.1 基于比对的定量

featureCounts是Subread套件的计数工具，运行速度快且配置灵活。HTSeq-count是Python工具，提供Union、Intersection-strict、Intersection-nonempty三种计数模式。双端测序应使用片段计数（fragment）而非read计数，避免表达量被高估一倍。

多比对reads的处理是定量的核心难题。简单丢弃会低估基因家族表达量，随机分配会引入噪声。RSEM使用EM算法按表达证据分配概率权重，eXpress采用在线EM策略。

```r
# featureCounts定量
library(Rsubread)
fc <- featureCounts(files = list.files("bam_dir", "\\.bam$"),
                     annot.inbuilt = "hg38",
                     isGTFAnnotationFile = TRUE,
                     GTF.featureType = "exon",
                     GTF.attrType = "gene_id",
                     isPairedEnd = TRUE,    # 双端数据使用片段计数
                     useMetaFeatures = TRUE,
                     nthreads = 8)
counts <- fc$counts
print(head(counts))
```

### 2.5.4.2 伪比对定量

伪比对跳过完整比对，通过k-mer索引快速确定read最可能来源的转录本。Salmon和Kallisto比传统流程快数十倍。Salmon使用选择性映射（selective alignment）在快速定位后做局部验证，并提供GC偏倚和序列偏倚校正。Kallisto强调极致速度和最小内存占用，支持bootstrap生成表达量不确定性区间。

```bash
# Salmon伪比对定量
salmon index -t transcripts.fa -i salmon_index --type quasi -k 31
salmon quant -i salmon_index -l A \
    -1 clean_R1.fq.gz -2 clean_R2.fq.gz \
    -p 8 --validateMappings --gcBias --seqBias -o salmon_out
```

## 2.5.5 归一化方法

原始计数受测序深度、基因长度和RNA组成影响，不能直接跨样本比较。归一化消除这些技术性变异，使样本间表达量可比。

RPKM/FPKM同时校正测序深度和基因长度，但不适合跨样本比较：分母中的总reads数受少数极高表达基因影响，会人为压低其他基因表达。TPM改进了这一点，所有样本的TPM之和恒定为10^6，具有内在可比性，是跨样本比较的更好选择。

TMM（edgeR）和中位数归一化（DESeq2）专为差异表达设计。TMM在大多数基因不差异表达的前提下计算缩放因子，对组成型差异鲁棒。DESeq2的size factor基于每个基因计数与所有样本中位数的比值，对离群值抵抗力强。分位数归一化强制所有样本分布相同，可能过度修正真实生物学差异，主要用于微阵列数据。

```r
# 归一化方法比较
library(edgeR)

# 模拟计数数据
set.seed(123)
counts <- matrix(rnbinom(6000, mu = rpois(100, 500), size = 0.1),
                 nrow = 100, ncol = 6)
rownames(counts) <- paste0("Gene", 1:100)
colnames(counts) <- c("Ctrl1", "Ctrl2", "Ctrl3", "Treat1", "Treat2", "Treat3")
gene_lengths <- sample(500:15000, 100)

# TMM归一化 (edgeR默认)
y <- DGEList(counts = counts)
y <- calcNormFactors(y, method = "TMM")
print(y$samples$norm.factors)

# 计算TPM (跨样本比较推荐)
tpm_function <- function(counts_matrix, lengths) {
    rpk <- t(t(counts_matrix) / (lengths / 1000))
    tpm <- t(t(rpk) / colSums(rpk)) * 1e6
    return(tpm)
}
tpm_vals <- tpm_function(counts, gene_lengths)
print(colSums(tpm_vals))  # 每列应接近1e6
```

## 2.5.6 差异表达分析

差异表达分析识别条件间表达水平显著变化的基因，是RNA-seq分析的核心。RNA-seq计数数据离散、非负、存在过离散现象，负二项分布能很好地建模这种特性。

### 2.5.6.1 DESeq2

DESeq2是最广泛使用的差异分析工具，核心是离散度估计和负二项GLM拟合。离散度估计分三步：基因特异估计 → 拟合离散度-均值趋势曲线 → 经验贝叶斯收缩。高表达基因离散度估计可靠，收缩少；低表达基因估计不确定，收缩多，这解决了小样本下的估计不稳定问题。

设计公式`~ condition`表示表达仅受条件影响；`~ batch + condition`同时校正批次效应；`~ time + treatment + time:treatment`检验交互效应。批次效应应纳入设计公式而非事后校正，这样能正确估计自由度。

Wald检验用于两组比较，似然比检验（LRT）比较嵌套模型适合筛选性分析。LFC收缩（apeglm或ashr）将低表达基因的不稳定LFC估计向零收缩，使基因排序更可靠，特别适合GSEA输入。

```r
# DESeq2完整差异表达流程
library(DESeq2)

# 1. 创建DESeqDataSet
sample_info <- data.frame(
    row.names = colnames(counts),
    condition = factor(c(rep("Control", 3), rep("Treatment", 3))),
    batch = factor(c("B1", "B2", "B1", "B2", "B1", "B2"))
)
dds <- DESeqDataSetFromMatrix(
    countData = counts,
    colData = sample_info,
    design = ~ batch + condition
)

# 2. 预过滤低表达基因
keep <- rowSums(counts(dds)) >= 10
dds <- dds[keep, ]

# 3. 运行标准分析 (离散度估计 + GLM拟合 + Wald检验)
dds <- DESeq(dds)

# 4. 提取结果 (apeglm收缩LFC)
res <- results(dds, name = "condition_Treatment_vs_Control",
               alpha = 0.05)
res <- lfcShrink(dds, coef = "condition_Treatment_vs_Control",
                 type = "apeglm")
resOrdered <- res[order(res$padj), ]

# 5. 结果摘要
summary(resOrdered)
cat("显著差异基因数 (FDR<0.05):",
    sum(resOrdered$padj < 0.05, na.rm = TRUE), "\n")
```

::: note 独立过滤
DESeq2默认使用平均归一化计数作为过滤标准，排除几乎不可能达到显著性阈值的低表达基因，减少多重检验负担，从而放宽剩余基因的FDR阈值。独立过滤不增加假阳性率，因为它仅在过滤标准与检验统计量独立时生效。
:::

### 2.5.6.2 edgeR

edgeR同样基于负二项分布，离散度估计分三步：common dispersion（全局共享）→ trended dispersion（表达水平相关趋势）→ tagwise dispersion（基因特异，向趋势线收缩）。准似然F检验（QLF）通过额外估计考虑模型拟合不确定性，在小样本下更保守稳健，是edgeR推荐方法。

```r
# edgeR完整差异表达流程
library(edgeR)

# 1. 创建DGEList对象
group <- factor(c(rep("Control", 3), rep("Treatment", 3)))
y <- DGEList(counts = counts, group = group)

# 2. TMM归一化
y <- calcNormFactors(y, method = "TMM")

# 3. 离散度估计 (common -> trended -> tagwise)
design <- model.matrix(~group)
y <- estimateDisp(y, design = design, robust = TRUE)
plotBCV(y)  # 离散度-均值关系可视化

# 4. 准似然F检验 (推荐)
fit <- glmQLFit(y, design)
qlf <- glmQLFTest(fit, coef = 2)  # Treatment vs Control

# 5. 提取结果
topTags(qlf, n = 10)
res_edgeR <- topTags(qlf, n = Inf)$table
sig_genes <- subset(res_edgeR, FDR < 0.05 & abs(logFC) > 1)
cat("edgeR显著差异基因数:", nrow(sig_genes), "\n")
```

### 2.5.6.3 limma-voom

limma-voom将微阵列领域的limma框架适配到RNA-seq。voom变换将计数转为log-CPM，并用lowess拟合均值-方差关系，为每个观测值生成精确权重。高表达基因方差估计可靠获得高权重，低表达基因获得低权重。权重传递给limma的线性模型，使经验贝叶斯平滑有效运作。

limma框架的优势在于灵活的实验设计能力：contrasts矩阵定义任意对比组合，duplicateCorrelation处理配对样本，removeBatchEffect方便去除批次效应。复杂实验设计（多因素、配对、时间序列）下，limma-voom通常比DESeq2/edgeR更直观。

```r
# limma-voom完整流程
library(limma)
library(edgeR)

y <- DGEList(counts = counts, group = group)
y <- calcNormFactors(y)

# voom变换并绘制均值-方差趋势图
v <- voom(y, design = model.matrix(~group), plot = TRUE)

# 线性模型 + 经验贝叶斯
design <- model.matrix(~ 0 + group)
colnames(design) <- levels(group)
fit <- lmFit(v, design)
contrast.matrix <- makeContrasts(Treatment - Control, levels = design)
fit2 <- contrasts.fit(fit, contrast.matrix)
fit2 <- eBayes(fit2)

# 提取结果
topTable(fit2, coef = "Treatment - Control", number = 10)
```

::: tip 工具选择
DESeq2适合大多数常规分析；edgeR在样本量很小时可能表现更好；limma-voom在复杂实验设计（多因素、配对、时间序列）下最灵活。三者结果通常高度一致，可交叉验证关键发现。
:::

## 2.5.7 功能富集分析

差异表达分析识别变化的基因，功能富集分析回答这些基因在功能上有什么共同点。

### 2.5.7.1 过表示分析（ORA）

ORA检验差异表达基因列表中某功能类别（GO term或KEGG pathway）的基因数量是否显著多于随机期望，统计基础是超几何检验或Fisher精确检验。

背景基因集选择是ORA的关键但常被忽视的问题。推荐使用所有表达基因作为背景，反映实验实际能检测的范围。多重检验校正使用Benjamini-Hochberg FDR，阈值常为0.05。

clusterProfiler是Bioconductor中功能最全面的富集分析R包，支持GO、KEGG、Reactome等多种数据库，并提供dotplot、cnetplot、emapplot等可视化。

```r
# GO/KEGG过表示分析
library(clusterProfiler)
library(org.Hs.eg.db)

# 转换为Entrez ID
gene_list <- rownames(sig_genes)
entrez_ids <- bitr(gene_list, fromType = "SYMBOL",
                   toType = "ENTREZID", OrgDb = org.Hs.eg.db)

# GO富集分析
go_bp <- enrichGO(gene = entrez_ids$ENTREZID,
                  OrgDb = org.Hs.eg.db, ont = "BP",
                  pAdjustMethod = "BH", qvalueCutoff = 0.05,
                  readable = TRUE)

# KEGG通路富集
kegg_res <- enrichKEGG(gene = entrez_ids$ENTREZID, organism = "hsa",
                       pAdjustMethod = "BH", qvalueCutoff = 0.05)
cat("GO BP显著富集项数:", nrow(go_bp@result), "\n")
```

### 2.5.7.2 基因集富集分析（GSEA）

GSEA与ORA的根本区别在于使用所有基因的排序信息而非仅差异基因列表。GSEA假设协同发挥作用的基因在排序中应聚集在顶部或底部，通过游走统计量量化聚集程度，排列检验评估显著性。

预排序GSEA将基因按LFC或t统计量排序后输入分析，富集分数（ES）的最大偏离值即为该基因集得分，标准化后（NES）可跨基因集比较。fgsea是GSEA的高效R实现，可在数秒内完成MSigDB全库分析。

```r
# GSEA (fgsea)
library(fgsea)
library(msigdbr)

# 准备排序基因列表 (使用收缩LFC)
gene_ranks <- setNames(resOrdered$log2FoldChange, rownames(resOrdered))
gene_ranks <- sort(gene_ranks, decreasing = TRUE)

# 使用Hallmark基因集
hallmark <- msigdbr(species = "Homo sapiens", category = "H")
pathways <- split(hallmark$gene_symbol, hallmark$gs_name)

# 运行fgsea
fgsea_res <- fgsea(pathways, stats = gene_ranks, minSize = 15, maxSize = 500)
cat("GSEA显著通路数:",
    nrow(subset(fgsea_res, padj < 0.05)), "\n")
```

### 2.5.7.3 富集结果可视化

```r
# 富集结果可视化
library(enrichplot)

# dotplot: GO BP富集点图
dotplot(go_bp, showCategory = 20, title = "GO BP富集分析") +
    theme(axis.text.y = element_text(size = 8))

# cnetplot: 基因-通路网络图
cnetplot(go_bp, showCategory = 5, foldChange = gene_ranks)

# emapplot: 富集项关系网络
emapplot(go_bp, showCategory = 15)

# ridgeplot: GSEA基因集分布岭图
ridgeplot(fgsea_res[1:6, ])
```

## 2.5.8 可视化

差异表达结果的可视化是传达分析发现的关键手段。火山图同时展示统计显著性和效应大小，是最常用的差异表达可视化方式。热图展示差异基因在各样本中的表达模式，可直观看出样本分组和基因聚类一致性。PCA用于评估样本整体分布和批次效应。

```r
# 差异表达结果可视化
library(EnhancedVolcano)
library(pheatmap)
library(DESeq2)

res_df <- as.data.frame(resOrdered)
res_df$gene <- rownames(res_df)

# 1. 火山图
EnhancedVolcano(res_df,
    lab = res_df$gene, x = "log2FoldChange", y = "padj",
    pCutoff = 0.05, FCcutoff = 1,
    title = "差异表达火山图", subtitle = "DESeq2 + apeglm",
    pointSize = 2.0, labSize = 3.0)

# 2. PCA主成分分析 (评估样本分布)
vsd <- vst(dds, blind = TRUE)
pca_data <- plotPCA(vsd, intgroup = c("condition", "batch"),
                    returnData = TRUE)
percent_var <- round(100 * attr(pca_data, "percentVar"))
library(ggplot2)
ggplot(pca_data, aes(PC1, PC2, color = condition, shape = batch)) +
    geom_point(size = 3) +
    xlab(paste0("PC1: ", percent_var[1], "% variance")) +
    ylab(paste0("PC2: ", percent_var[2], "% variance")) +
    theme_minimal()

# 3. 热图 (Top50差异基因)
top50_genes <- head(rownames(resOrdered)[order(resOrdered$padj)], 50)
norm_counts <- assay(vsd)[top50_genes, ]
pheatmap(norm_counts,
         annotation_col = sample_info[, "condition", drop = FALSE],
         show_rownames = FALSE, cluster_rows = TRUE,
         scale = "row",
         main = "Top50 差异基因热图")

# 4. 导出增强列表
sig_res <- subset(res_df, padj < 0.05 & abs(log2FoldChange) > 1)
write.csv(sig_res, "DEG_results_FDR0.05_LFC1.csv", row.names = FALSE)
cat("导出显著差异基因数:", nrow(sig_res), "\n")
```

::: warning LFC收缩与排序
未经收缩的LFC对低表达基因极度不稳定，直接用于基因排序会被极端值扭曲。使用收缩后的LFC（apeglm或ashr）进行排序和GSEA输入，结果更能反映真实生物学差异。
:::

## 2.5.9 单细胞RNA-seq简介

单细胞RNA-seq（scRNA-seq）在单个细胞分辨率下研究基因表达，揭示细胞群体异质性和稀有细胞类型。10X Genomics基于微液滴技术，每次运行可处理数千到数万个细胞；Smart-seq2基于孔板，通量低但能获得全长转录本信息，适合可变剪接研究。

Seurat是scRNA-seq分析的主流R包，整合了质控、归一化、降维、聚类、注释等完整流程。

### 2.5.9.1 质量控制

每个细胞的UMI总数（nCount_RNA）和基因数（nFeature_RNA）是基本质量指标。线粒体基因比例是识别低质量细胞的关键：受损细胞会释放细胞质RNA，线粒体RNA相对保留导致比例升高，超过10-20%的细胞应过滤。双细胞检测使用DoubletFinder等工具识别异常高UMI的液滴。

```r
# Seurat单细胞质量控制
library(Seurat)
pbmc <- Read10X(data.dir = "filtered_feature_bc_matrix/")
seurat_obj <- CreateSeuratObject(counts = pbmc, project = "PBMC",
                                  min.cells = 3, min.features = 200)

# 计算线粒体基因比例
seurat_obj[["percent.mt"]] <- PercentageFeatureSet(seurat_obj, pattern = "^MT-")

# 可视化QC指标
VlnPlot(seurat_obj, features = c("nFeature_RNA", "nCount_RNA", "percent.mt"),
        ncol = 3)

# 过滤低质量细胞
seurat_obj <- subset(seurat_obj,
                     subset = nFeature_RNA > 200 & nFeature_RNA < 7500 &
                              percent.mt < 20)
cat("过滤后细胞数:", ncol(seurat_obj), "\n")
```

### 2.5.9.2 归一化与批次校正

sctransform使用正则化负二项回归对UMI计数建模，去除测序深度影响同时保留生物学变异，是Seurat推荐的归一化方法。批次效应整合多样本时使用Harmony（在PCA空间迭代调整）、Seurat Integration（基于锚点对齐）或fastMNN（基于相互最近邻）。

```r
# 归一化与批次校正
# sctransform归一化 (可回归线粒体比例等协变量)
seurat_obj <- SCTransform(seurat_obj, vars.to.regress = "percent.mt")

# PCA降维
seurat_obj <- RunPCA(seurat_obj, npcs = 50)
ElbowPlot(seurat_obj, ndims = 50)  # 选择主成分数量

# Harmony批次校正
library(harmony)
seurat_obj <- RunHarmony(seurat_obj, group.by.vars = "batch")
```

### 2.5.9.3 降维与聚类

PCA将高维表达矩阵降维到主成分空间，使用高度可变基因减少计算量并突出生物学变异。UMAP比t-SNE更好保留全局结构且运行更快，已成为scRNA-seq可视化的首选。Louvain/Leiden算法在K近邻图上进行社区检测，将相似细胞聚集成簇，分辨率参数控制簇的数量。

```r
# 降维与聚类
# UMAP降维与可视化
seurat_obj <- RunUMAP(seurat_obj, dims = 1:30, reduction = "harmony")
DimPlot(seurat_obj, reduction = "umap", label = TRUE)

# 聚类
seurat_obj <- FindNeighbors(seurat_obj, dims = 1:30, reduction = "harmony")
seurat_obj <- FindClusters(seurat_obj, resolution = 0.8)
```

### 2.5.9.4 细胞类型注释

标记基因识别使用FindAllMarkers比较每个簇与其他簇的差异表达基因。人工注释基于已知标记基因是金标准，SingleR等自动注释工具基于参考数据集加速注释过程。可视化使用小提琴图、特征图、点图展示标记基因表达模式。

```r
# 标记基因识别与可视化
markers <- FindAllMarkers(seurat_obj, only.pos = TRUE,
                          min.pct = 0.25, logfc.threshold = 0.25)
top5_markers <- markers %>% group_by(cluster) %>% top_n(n = 5, wt = avg_log2FC)

# 细胞类型自动注释 (SingleR)
library(SingleR)
library(celldex)
ref <- HumanPrimaryCellAtlasData()
predictions <- SingleR(test = seurat_obj@assays$RNA@data,
                       ref = ref, labels = ref$label.main)
seurat_obj$SingleR_label <- predictions$labels

# 可视化标记基因
VlnPlot(seurat_obj, features = c("CD3D", "CD14", "MS4A1"), ncol = 3)
FeaturePlot(seurat_obj, features = c("CD3D", "CD14"), cols = c("grey", "blue"))
DotPlot(seurat_obj, features = top5_markers$gene) + RotatedAxis()
DoHeatmap(seurat_obj, features = top5_markers$gene) + NoLegend()
```

### 2.5.9.5 轨迹推断与细胞通讯

轨迹推断重建细胞连续状态变化。Monocle3在UMAP降维后构建最小生成树推断细胞轨迹，Slingshot可在任意降维结果上拟合平滑曲线，scVelo利用未剪接/剪接mRNA比例推断细胞未来状态。

细胞间通讯分析基于配体-受体对数据库推断细胞类型间相互作用。CellChat提供信号流可视化和通路分析，CellPhoneDB通过统计检验识别显著富集的相互作用。

```r
# Monocle3轨迹分析
library(monocle3)
cds <- as.cell_data_set(seurat_obj)
cds <- learn_graph(cds)
cds <- order_cells(cds, root_cells = root_cluster_cells)
plot_cells(cds, color_cells_by = "pseudotime")

# 沿伪时间的差异表达基因
graph_test_res <- graph_test(cds, neighbor_graph = "principal_graph")
sig_genes <- subset(graph_test_res, q_value < 0.05)

# CellChat细胞间通讯分析
library(CellChat)
cellchat <- createCellChat(object = seurat_obj)
cellchat <- subsetData(cellchat)
cellchat <- identifyOverExpressedGenes(cellchat)
cellchat <- identifyOverExpressedInteractions(cellchat)
cellchat <- computeCommunProb(cellchat)
cellchat <- filterCommunication(cellchat, min.cells = 10)
cellchat <- computeCommunProbPathway(cellchat)
cellchat <- aggregateNet(cellchat)
netVisual_circle(cellchat@net$count, vertex.weight = groupSize)
```

## 2.5.10 工作流与可重复性

整合分析步骤为自动化流程确保可重复性。nf-core/rnaseq基于Nextflow，整合质控、比对、定量到差异表达的完整链，支持容器化执行。Snakemake使用Python风格规则定义，适合定制化流程。Docker/Singularity容器保证分析在不同计算环境中产生一致结果。

```bash
# nf-core/rnaseq工作流
nextflow run nf-core/rnaseq -profile docker \
    --input samplesheet.csv --outdir results \
    --genome GRCh38 --aligner star_salmon
```

```python
# Snakemake RNA-seq流程示例 (Snakefile)
rule all:
    input:
        "results/differential_expression/DEG_results.csv"

rule fastqc:
    input: "data/{sample}.fastq.gz"
    output: "qc/{sample}_fastqc.html"
    shell: "fastqc {input} -o qc/"

rule align:
    input:
        r1 = "data/{sample}_R1.fastq.gz",
        r2 = "data/{sample}_R2.fastq.gz"
    output: "results/aligned/{sample}.bam"
    shell: "STAR --runThreadN 8 --genomeDir index "
           "--readFilesIn {input.r1} {input.r2} "
           "--outSAMtype BAM SortedByCoordinate"

rule deseq2:
    input: expand("results/counts/{sample}.txt", sample=SAMPLES)
    output: "results/differential_expression/DEG_results.csv"
    script: "scripts/run_deseq2.R"
```

::: note 本节来源
本节内容由原 reStructuredText 文件迁移而来。如需查看原始 Sphinx 版本，请参考项目源码中的 .rst 文件。
:::

## 练习题

### 第1题 概念理解

某研究者使用 FPKM 进行跨样本比较，发现基因 A 在处理组中表达量低于对照组，但用 TPM 和 DESeq2 size factor 归一化后基因 A 实际上调表达。解释 FPKM 不适合跨样本比较的原因，并说明组成型偏倚如何导致这种方向性反转。

::: details 参考答案
FPKM 的分母是所有 reads 数（或片段数），受少数极高表达基因影响。若处理组中某些基因（如管家基因或污染转录本）表达极度升高，占用大量测序资源，其他基因（包括基因 A）的 FPKM 被系统性压低，即使其实际计数没有下降。TPM 先按基因长度归一化得到 RPK，再用 RPK 总和归一化，所有样本 TPM 之和恒定为 10^6，避免了组成型偏倚。DESeq2 的 size factor 基于每个基因与所有样本中位数的比值取中位数，对少数极高表达基因不敏感。当组成型偏倚存在时，FPKM 可能给出与真实方向相反的结果，TPM 和 DESeq2 归一化更稳健。跨样本比较应使用 TPM 或 DESeq2 size factor，FPKM 仅适合同一样本内不同基因的比较。
:::

### 第2题 参数分析

某研究者有 6 个样本（3 对照 3 处理），分两批测序：批次 1 包含 Control1、Control2、Treatment1，批次 2 包含 Control3、Treatment2、Treatment3。研究者使用 DESeq2 的 `design = ~ condition` 分析，PCA 显示样本按批次而非处理组聚集。研究者随后用 limma 的 `removeBatchEffect` 对 DESeq2 归一化后的计数矩阵校正，再做差异分析。说明该做法的错误，并给出正确方案。

::: details 参考答案
该做法有两处错误。第一，批次效应应在统计模型中估计，而非事后数学校正。`removeBatchEffect` 修改计数矩阵后破坏了负二项分布假设，DESeq2 的离散度估计和统计检验不再有效。第二，`removeBatchEffect` 用于 limma-voom 的 log-CPM 矩阵，不适用于原始计数。正确方案是将批次纳入 DESeq2 设计公式：`design = ~ batch + condition`。DESeq2 在拟合 GLM 时同时估计批次和处理效应，条件效应在控制批次效应后估计，统计检验的正确性得到保证。需要注意的是，批次与处理之间存在部分混淆（批次 1 多为对照，批次 2 多为处理），这会降低统计功效但不会使结果无效。实验设计阶段应随机化分配样本到各批次，避免完全混淆。
:::

### 第3题 概念理解

单细胞 RNA-seq 质控中，研究者将线粒体基因比例阈值设为 5%，过滤后丢失了 40% 的细胞，聚类后发现剩余细胞几乎全为一种类型。解释线粒体比例升高的生物学原因，并说明为何严格阈值会导致细胞类型丢失。

::: details 参考答案
线粒体比例升高有多种原因。细胞损伤导致细胞质 RNA 释放降解，线粒体 RNA 因有膜保护相对保留，比例被动升高。某些细胞类型生理上具有高线粒体含量，如心肌细胞、肝细胞、棕色脂肪细胞，其线粒体基因比例天然较高。代谢活跃的细胞（如激活的 T 细胞）线粒体转录增加以满足能量需求。不同细胞类型的基线线粒体比例差异很大，统一 5% 阈值会系统性过滤特定细胞类型。正确做法是先观察线粒体比例分布，按细胞类型或聚类后分别评估。阈值通常设 10-20%，特定组织可能需要更高。过滤应基于多维 QC 指标（nFeature、nCount、percent.mt）联合判断，而非单一指标。
:::

## 常见错误

**错误 1 · DESeq2 差异分析结果全部不显著，或 log2FoldChange 方向与预期相反**

原因：`results()` 函数的 `contrast` 或 `name` 参数使用错误。DESeq2 默认将因子按字母顺序排列，对照（Control）在处理（Treatment）之前时，`name = "condition_Control_vs_Treatment"` 表示对照相对处理的变化，与预期方向相反。`contrast` 参数中水平顺序为（分子，分母），写反会导致 LFC 符号反转。因子水平未在创建 DESeqDataSet 时显式指定，导致参考水平不是预期的对照组。

解决：创建 DESeqDataSet 前显式设定因子水平：`condition <- factor(condition, levels = c("Control", "Treatment"))`，使 Control 为参考水平。运行 `resultsNames(dds)` 查看可用系数名称，确认 `condition_Treatment_vs_Control` 存在。提取结果时用 `name = "condition_Treatment_vs_Control"` 或 `contrast = c("condition", "Treatment", "Control")`，后者格式为（变量名，分子水平，分母水平）。多组比较时用 `contrast = list(c("condition_B_vs_A", "condition_C_vs_A"))` 进行线性组合。

**错误 2 · 反义转录本检测到表达，重叠基因无法区分，lncRNA 分析结果异常**

原因：建库使用了链特异性文库（如 dUTP 法），但比对和定量阶段未设置链特异性参数。STAR 默认非链特异性模式，featureCounts 默认 `-s 0`（非链特异性），导致正反义 reads 混合计数。链特异性信息丢失后，反义转录本和正义转录本无法区分，重叠基因的 reads 随机分配。

解决：确认建库类型（dUTP/TruSeq Stranded 等），在 STAR 比对时使用 `--outSAMstrandField intronMotif` 配合 `--sjdbGTFfile` 提供剪接位点。featureCounts 根据建库方法设置 `-s` 参数：dUTP 法第二链测序用 `-s 1`（正向链特异性），第一链测序用 `-s 2`（反向链特异性）。HTSeq-count 用 `-s reverse` 或 `-s yes`。Salmon 在 `quant` 命令中用 `-l ISR` 或 `-l A`（自动检测）。建库类型不明时，用 RSeQC 的 `infer_experiment.py` 从 BAM 文件推断链特异性模式。

**错误 3 · PCA 显示样本按批次聚集，差异基因列表中大量批次相关基因**

原因：批次效应未在统计模型中处理。研究者使用 `design = ~ condition` 忽略批次变量，或先分析再用 `removeBatchEffect` 事后校正。事后校正修改了计数矩阵，破坏负二项分布假设，统计检验无效。批次与处理混淆时（如所有对照在批次 1，所有处理在批次 2），批次效应完全混淆处理效应，差异基因无法区分是批次还是处理引起。

解决：实验设计阶段随机化分配样本到批次，避免批次与处理混淆。分析时将批次纳入设计公式：DESeq2 用 `design = ~ batch + condition`，edgeR 设计矩阵加入 batch 列，limma-voom 在设计矩阵中加入 batch。批次变量在前、处理变量在后的顺序使统计检验估计的是控制批次后的处理效应。批次与处理完全混淆时无法通过统计方法解决，需要重新实验。`removeBatchEffect` 仅用于可视化（如热图、PCA），不用于差异分析前的计数校正。

**错误 4 · ORA 富集分析结果中显著条目极少或完全无富集，与 GSEA 结果矛盾**

原因：ORA 背景基因集选择错误。研究者使用全基因组所有基因作为背景，但 RNA-seq 只能检测表达基因，大量未表达基因被纳入背景后稀释了富集信号。另一种情况是使用差异基因列表本身作为背景，导致超几何检验失去意义。基因 ID 类型不匹配（SYMBOL 与 ENTREZID 混用）也会导致匹配失败。

解决：背景基因集使用所有表达基因（如 `rowSums(counts) > 10` 的基因），反映实验实际能检测的范围。差异基因列表和背景基因集使用相同的 ID 类型，clusterProfiler 的 `bitr` 函数完成 ID 转换。GO 富集分析设置 `universe` 参数指定背景集：`enrichGO(gene = sig_genes, universe = expressed_genes, OrgDb = org.Hs.eg.db, ...)`。ORA 和 GSEA 结果矛盾时，优先参考 GSEA，因为它使用所有基因的排序信息，不受任意阈值切割的影响。
