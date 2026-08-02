---
title: 2.6 表观遗传学分析
sidebar:
  order: 6
---

# 2.6 表观遗传学分析

表观遗传学研究在不改变DNA序列的情况下基因表达发生可遗传变化的机制。其核心层次包括DNA甲基化、组蛋白修饰、染色质可及性与三维结构，共同决定哪些基因在特定细胞类型和发育阶段被激活或沉默。表观遗传修饰具有动态性和可逆性，受环境因素影响显著，在发育调控、疾病发生和衰老过程中扮演关键角色。当基因组层面的变异无法完全解释表型差异时，表观遗传学分析往往能提供重要的补充信息。本章系统介绍DNA甲基化、染色质可及性、组蛋白修饰和染色质互作的核心分析内容，涵盖从实验技术到数据分析的完整流程。

## 2.6.1 DNA甲基化分析

DNA甲基化是最早被发现且研究最深入的表观遗传修饰之一。在哺乳动物中，DNA甲基化主要发生在CpG二核苷酸的胞嘧啶5号碳原子上，形成5-甲基胞嘧啶（5mC）。CpG位点在基因组中分布不均，约70-80%的分散CpG通常处于甲基化状态，而聚集形成的CpG岛主要位于基因启动子区域，通常保持非甲基化。当启动子CpG岛发生异常甲基化时，会导致基因转录沉默，这一机制在肿瘤抑制基因失活中尤为常见。DNA甲基化分析的目标是定量测量各CpG位点的甲基化水平，比较不同样本之间的差异，揭示甲基化在基因调控和疾病中的作用。

### 2.6.1.1 甲基化检测技术

重亚硫酸盐测序（BS-seq）是DNA甲基化检测的金标准。其原理是利用重亚硫酸盐处理DNA，将未甲基化的胞嘧啶（C）转化为尿嘧啶（U），而甲基化的胞嘧啶（5mC）保持不变。经PCR扩增后，U被读作T，5mC仍读作C。通过比较处理前后的序列变化，可在单碱基分辨率下确定每个CpG位点的甲基化状态。BS-seq成本较高，因为重亚硫酸盐处理会导致DNA降解，需要较高的测序深度补偿。

简化代表性重亚硫酸盐测序（RRBS）通过限制性内切酶（如MspI）切割富含CpG的片段，然后对这些片段进行重亚硫酸盐测序，以较低成本覆盖大部分CpG岛和启动子区域。RRBS适合大样本量研究，在成本和覆盖度之间提供良好平衡。

甲基化DNA免疫沉淀测序（MeDIP-seq）利用抗5mC抗体特异性富集甲基化的DNA片段。与BS-seq不同，MeDIP-seq不提供单碱基分辨率，而是反映基因组区域的整体甲基化水平，适合大尺度的甲基化模式筛查。甲基化敏感限制性内切酶测序（MRE-seq）利用HpaII等酶只能切割非甲基化CpG位点的特性识别未甲基化区域，常与MeDIP-seq联合使用以提供互补的甲基化图谱。

全基因组重亚硫酸盐测序（WGBS）对整个基因组进行重亚硫酸盐处理和深度测序，理论上覆盖所有CpG位点。WGBS是最全面的甲基化检测方法，但成本最高，通常每个样本需要30倍以上的基因组覆盖度。靶向甲基化测序结合目标区域捕获技术和BS-seq，通过探针捕获感兴趣的基因组区域，在保持单碱基分辨率的同时大幅降低测序成本，适合验证WGBS发现的候选区域或临床标志物研究。

::: note 5hmC检测
氧化重亚硫酸盐测序（oxBS-seq）和Tet辅助重亚硫酸盐测序（TAB-seq）可区分5mC和5hmC（5-羟甲基胞嘧啶）。5hmC是TET蛋白氧化5mC的产物，在脑组织中含量丰富。oxBS-seq先用氧化剂将5hmC氧化为5fC，再经重亚硫酸盐处理，从而单独检测5mC；将常规BS-seq结果减去oxBS-seq结果即得到5hmC分布。TAB-seq则通过TET蛋白将5mC氧化为5caC，同时保护5hmC不被转化，从而单独检测5hmC。
:::

长读长测序技术为甲基化检测提供了新途径。纳米孔测序通过电信号变化直接检测DNA上的甲基化修饰，无需重亚硫酸盐处理，可同时检测5mC、5hmC、6mA等多种修饰类型，并获得长读长信息，有助于在重复区域和结构变异区域进行甲基化分析。PacBio HiFi利用SMRT测序的动力学信息检测DNA甲基化，聚合酶遇到甲基化碱基时聚合速率发生变化，HiFi读长兼具高准确性和长读长优势。

单细胞重亚硫酸盐测序（scBS-seq）将BS-seq应用于单个细胞，能够揭示细胞群体中甲基化的异质性。由于单细胞DNA量极少，scBS-seq需要全基因组扩增，会引入覆盖度不均匀和扩增偏倚。尽管如此，scBS-seq在研究早期胚胎发育、肿瘤异质性和罕见细胞类型的甲基化特征方面具有不可替代的价值。

甲基化阵列（Illumina 450K和EPIC 850K）是基于探针杂交的甲基化检测平台。450K阵列覆盖约45万个CpG位点，EPIC 850K覆盖约85万个CpG位点并增加了增强子区域的覆盖。阵列的优势在于成本低、通量高、数据质量稳定，是大规模EWAS研究中最常用的平台。

```bash
# 不同甲基化检测技术的典型测序深度要求
# WGBS: ~30x 基因组覆盖度
# RRBS: ~10-30x 有效覆盖度（仅覆盖CpG富集区域）
# MeDIP-seq: ~20-40M reads
# EPIC 850K阵列: 无需测序，芯片扫描

# RRBS文库制备示例（使用MspI酶切）
# MspI识别CCGG位点，切割后产生含CpG的片段
# 典型片段大小: 40-220bp
```

### 2.6.1.2 甲基化数据分析流程

重亚硫酸盐比对是甲基化数据分析的第一步。重亚硫酸盐处理后基因组序列发生C到T的转换，常规比对工具无法直接使用。Bismark通过将参考基因组和测序读段分别进行C-to-T和G-to-A转换，然后使用Bowtie2或HISAT2进行三方向比对，最终确定读段的最佳比对位置和原始链方向。BSMAP使用容错匹配策略处理重亚硫酸盐转换。BWA-meth是BWA-MEM的重亚硫酸盐适配版本，速度较快且内存占用较低。GemBS集成了比对、甲基化调用和下游分析的综合流程。处理大规模WGBS数据时，Bismark和BWA-meth效率较高，GemBS适合需要标准化流程的项目。

```bash
# Bismark比对流程
# 1. 构建重亚硫酸盐基因组索引
bismark_genome_preparation /path/to/reference_genome/

# 2. 比对（双端测序）
bismark --genome /path/to/reference_genome/ \
    -1 sample_R1.fq.gz -2 sample_R2.fq.gz \
    --parallel 8 --output_dir bismark_output/

# 3. 去重
deduplicate_bismark --paired bismark_output/sample_R1_bismark_bt2_pe.bam

# 4. 甲基化提取
bismark_methylation_extractor \
    --paired-end --gzip --comprehensive \
    --bedGraph --CX_context \
    bismark_output/sample_R1_bismark_bt2_pe.deduplicated.bam
```

甲基化调用从比对结果中提取每个CpG位点的甲基化信息。Bismark methylation extractor统计每个CpG位点上支持甲基化（C）和非甲基化（T）的读段数量。MethylDackel是另一个快速的甲基化调用工具，可处理Bismark或其他比对器产生的BAM文件。

甲基化水平通常使用beta值度量，公式为 $\beta = mC / (mC + umC)$ ，其中mC是支持甲基化的读段数，umC是支持非甲基化的读段数。beta值取值范围0到1，0表示完全非甲基化，1表示完全甲基化。另一种常用度量是M值，公式为 $M = log2(\beta / (1 - \beta))$ 。M值在统计检验中更为稳定，近似服从正态分布，适合差异甲基化分析；beta值在结果展示和生物学解释时更为直观。

```r
# 甲基化水平计算
mC <- 8
umC <- 12
beta <- mC / (mC + umC)
cat(sprintf("Beta值: %.4f\n", beta))
M <- log2(beta / (1 - beta))
cat(sprintf("M值: %.4f\n", M))

# 批量计算beta值和M值
meth_counts <- data.frame(
    mC = c(8, 15, 2, 20, 5),
    umC = c(12, 5, 18, 0, 15)
)
meth_counts$beta <- with(meth_counts, mC / (mC + umC))
meth_counts$M <- with(meth_counts, log2(beta / (1 - beta)))
print(meth_counts)
```

过滤低覆盖度CpG位点是为了确保甲基化水平估计的可靠性。覆盖度过低的位点其甲基化水平估计方差较大，容易引入假阳性或假阴性的差异甲基化结果。通常建议每个CpG位点至少有5-10倍覆盖度才纳入分析，WGBS数据可能需要更高阈值。还需要过滤位于已知SNP位点的CpG，因为SNP导致的C-to-T变化会被误认为甲基化状态变化。处理阵列数据时，需要过滤检测p值大于0.01的探针和交叉反应性探针。

CpG岛注释将甲基化位点映射到基因组功能区域。CpG岛通常定义为长度至少200bp、GC含量大于50%、观察值与期望值之比大于0.6的基因组区域。除CpG岛本身，还需注释CpG岛上下游岸区（shore，距离CpG岛2kb以内）和架子区（shelf，距离CpG岛2-4kb）。研究表明，组织特异性和疾病相关的差异甲基化更多地发生在CpG岛的岸区而非岛内。

差异甲基化分析是比较不同组别之间甲基化水平的统计方法。DSS（Dispersion Shrinkage for Sequencing data）使用贝叶斯方法估计甲基化水平的离散度，然后进行Wald检验或似然比检验识别差异甲基化位点，特别适合基于测序的甲基化数据。limma包通过经验贝叶斯方法提高小样本情况下的统计功效，可应用于甲基化阵列数据。methylKit提供从比对到差异分析的完整流程。RnBeads是综合的甲基化分析框架，支持阵列和测序数据。处理WGBS或RRBS数据时DSS是推荐选择，阵列数据则常用limma和RnBeads。

```r
# 使用DSS进行差异甲基化分析
library(DSS)
library(bsseq)

# 构建BSseq对象
positions <- c(100, 200, 300, 400, 500)
chr <- rep("chr1", 5)

# 对照组样本
meth_ctrl1 <- c(8, 15, 2, 20, 5)
total_ctrl1 <- c(20, 20, 20, 20, 20)
meth_ctrl2 <- c(7, 14, 3, 18, 6)
total_ctrl2 <- c(20, 20, 20, 20, 20)

# 处理组样本
meth_treat1 <- c(15, 8, 12, 19, 16)
total_treat1 <- c(20, 20, 20, 20, 20)
meth_treat2 <- c(16, 7, 13, 20, 15)
total_treat2 <- c(20, 20, 20, 20, 20)

BSobj <- BSseq(
    chr = chr, pos = positions,
    M = cbind(meth_ctrl1, meth_ctrl2, meth_treat1, meth_treat2),
    Cov = cbind(total_ctrl1, total_ctrl2, total_treat1, total_treat2),
    sampleNames = c("ctrl1", "ctrl2", "treat1", "treat2")
)

# 差异甲基化分析
dmlTest <- DMLtest(BSobj, group1 = c("ctrl1", "ctrl2"),
                    group2 = c("treat1", "treat2"))
head(dmlTest)

# 调用差异甲基化位点（DML）
dmls <- callDML(dmlTest, p.threshold = 0.001)
head(dmls)

# 调用差异甲基化区域（DMR）
dmrs <- callDMR(dmlTest, p.threshold = 0.01)
head(dmrs)
```

DMR（差异甲基化区域）检测将相邻的差异甲基化位点合并为连续区域。单个CpG位点的差异甲基化可能由技术噪音引起，而连续多个CpG位点的一致性差异更可能具有生物学意义。DMR检测算法基于滑动窗口或区域分割策略，将相邻的差异甲基化位点合并并评估整个区域的统计显著性。合并后的DMR需满足最小长度（通常至少包含3个CpG位点）、最小甲基化差异（如delta beta > 0.2）和统计显著性（如FDR < 0.05）。报告差异甲基化结果时，DMR通常比单个DMP更具生物学可解释性。

差异甲基化位点（DMP）统计关注单个CpG位点水平的差异分析，输出每个CpG位点的甲基化差异、p值和校正后的FDR值。DMP筛选标准通常包括FDR < 0.05和绝对甲基化差异 > 0.2。DMP分析提供最细粒度的信息，但需要注意多重检验校正问题，因为人类基因组中约有2800万个CpG位点。

基因组区域甲基化特征分析关注不同功能区域的甲基化模式。启动子区域的甲基化通常与基因沉默相关，当启动子CpG岛发生高甲基化时，转录因子无法结合，基因表达被抑制。基因体甲基化呈现不同模式，高甲基化的基因体往往与活跃转录的基因相关，可能与抑制基因内转录起始和转座子活性有关。增强子区域的甲基化变化对基因表达的影响更为复杂，低甲基化的增强子通常处于活跃状态。重复元件（如LINE、SINE、LTR）的甲基化维持基因组稳定性，其去甲基化可能导致转座子激活和基因组不稳定。

### 2.6.1.3 甲基化功能解析

启动子甲基化与基因表达负相关分析是甲基化功能研究中最基本的分析。在大多数情况下，启动子区域CpG岛的高甲基化与基因表达下调相关，因为甲基化的CpG会阻碍转录因子结合，同时招募甲基化结合蛋白（如MeCP2），进而招募组蛋白去乙酰化酶等抑制性复合物，形成紧密的染色质结构。同时拥有甲基化数据和RNA-seq数据时，可通过计算启动子甲基化水平与基因表达量之间的相关系数验证这一负相关关系。需要注意，这种负相关并非绝对的，基因体甲基化与基因表达可能呈正相关，而增强子甲基化的关系则更为复杂。

甲基化定量性状位点（mQTL）分析将DNA甲基化水平作为数量性状，寻找与甲基化变异相关的遗传变异位点。mQTL分析的基本思路与eQTL分析类似，通过线性回归模型检验SNP基因型与CpG位点甲基化水平之间的关联。mQTL分为cis-mQTL（SNP与CpG位点在基因组上距离较近，通常在1Mb以内）和trans-mQTL（距离较远或位于不同染色体）。cis-mQTL效应通常较强且容易检测，trans-mQTL效应较弱但可能揭示跨染色体的调控网络。

甲基化与转录因子结合位点关系分析探讨甲基化如何影响转录因子的DNA结合活性。许多转录因子的识别序列包含CpG，甲基化可直接阻碍这些转录因子的结合。CTCF是对甲基化高度敏感的绝缘子蛋白，其结合位点的甲基化会导致CTCF结合丧失，进而影响染色质环结构和基因表达。一些蛋白（如MeCP2、Kaiso）特异性地结合甲基化的CpG位点，招募抑制性复合物。

等位基因特异性甲基化（ASM）是指基因组上同一CpG位点在两条同源染色体上具有不同甲基化状态的现象，包括基因组印记相关的ASM和遗传变异导致的ASM。基因组印记由亲本来源决定，印记基因只表达来自特定亲本的等位基因。使用长读长测序或等位基因特异性比对可检测ASM现象，这对于理解等位基因特异性表达和印记基因的调控至关重要。

甲基化年龄推断（DNAm年龄，表观遗传时钟）利用特定CpG位点的甲基化水平预测个体生物学年龄。DNA甲基化随年龄发生规律性变化，某些CpG位点的甲基化水平与年龄高度相关。Horvath时钟使用353个CpG位点，适用于多种组织类型；Hannum时钟使用71个CpG位点，主要基于血液样本开发。DNAm年龄与实际年龄的差值被称为年龄加速（AgeAccel），正值意味着个体的表观遗传年龄大于实际年龄，可能与加速衰老或疾病风险增加相关。

甲基化与疾病关联（EWAS，表观组关联研究）将甲基化作为暴露因素或中间表型，研究其与疾病或性状之间的关联。EWAS设计类似于GWAS，但以CpG位点为单位检验甲基化水平与表型的关联。EWAS面临的主要挑战包括细胞类型异质性（不同细胞类型的甲基化模式差异很大）、多重检验负担（数百万个CpG位点）和因果方向的确定（甲基化变化是疾病的原因还是结果）。

```r
# 启动子甲基化与基因表达相关性分析
set.seed(42)
n_genes <- 100
promoter_meth <- runif(n_genes, 0, 1)
gene_expr <- -0.6 * promoter_meth + rnorm(n_genes, 0.5, 0.2)
gene_expr <- pmax(gene_expr, 0)

cor_test <- cor.test(promoter_meth, gene_expr, method = "spearman")
cat(sprintf("Spearman相关系数: %.4f, p值: %.4e\n",
            cor_test$estimate, cor_test$p.value))

# 简单的mQTL分析模拟
genotypes <- sample(c(0, 1, 2), n_genes, replace = TRUE,
                    prob = c(0.5, 0.4, 0.1))
meth_levels <- 0.3 + 0.15 * genotypes + rnorm(n_genes, 0, 0.1)
mQTL_result <- lm(meth_levels ~ genotypes)
summary(mQTL_result)
```

## 2.6.2 染色质可及性分析

染色质可及性是指染色质DNA被蛋白质和酶（如转录因子、RNA聚合酶等）接触和结合的能力。在真核细胞中，DNA缠绕在组蛋白八聚体上形成核小体，核小体进一步折叠形成高级染色质结构。染色质处于开放状态时，DNA暴露出来，转录因子可以结合并调控基因表达；染色质处于紧密状态时，DNA被包裹在核小体内部，转录因子无法接触。染色质可及性分析的目标是绘制基因组中开放染色质区域的图谱，识别活跃的调控元件，并推断转录因子的结合活性。

### 2.6.2.1 检测技术

ATAC-seq（Assay for Transposase-Accessible Chromatin）是目前最主流的染色质可及性检测技术。它利用Tn5转座酶优先切割和标记开放染色质区域的DNA，同时加入测序接头，一步完成开放区域的切割和文库构建。ATAC-seq的优势在于实验流程简单快速（约3小时）、所需起始细胞量少（低至500个细胞），且能同时提供核小体定位信息。

DNase-seq（DNase I超敏感位点测序）利用DNase I酶优先切割开放染色质区域的特性识别DNase I超敏感位点（DHS）。DNase-seq是最早用于全基因组染色质可及性检测的技术之一，ENCODE项目产生了大量人类和小鼠DNase-seq数据作为参考。与ATAC-seq相比，DNase-seq需要更多起始细胞和更复杂的实验流程。

MNase-seq（微球菌核酸酶测序）利用微球菌核酸酶优先消化核小体之间的连接DNA，保留核小体包裹的DNA片段。与ATAC-seq和DNase-seq检测开放区域不同，MNase-seq主要用来确定核小体的精确位置。通过分析MNase消化后保留的约147bp DNA片段，可在全基因组范围内绘制核小体占据图谱。

NOMe-seq（核小体占据与甲基化测序）结合GpC甲基转移酶和重亚硫酸盐测序，同时检测核小体占据和内源性DNA甲基化状态。GpC甲基转移酶在开放染色质区域对GpC二核苷酸进行甲基化，而核小体包裹的GpC则被保护。通过重亚硫酸盐测序同时读取GpC甲基化（反映染色质可及性）和CpG甲基化（反映内源性甲基化），NOMe-seq可在同一分子上同时获得两种表观遗传信息。

scATAC-seq（单细胞ATAC-seq）将ATAC-seq技术应用于单个细胞，揭示细胞群体中染色质可及性的异质性。scATAC-seq数据具有极度稀疏的特点，每个细胞通常只捕获基因组中少数开放区域的信号。常用平台包括10X Genomics Chromium和Sci-ATAC-seq。基于转座酶的索引技术（sci-ATAC）通过组合索引策略大幅提高单细胞ATAC-seq的通量，使用多轮分池和标记以组合方式为每个细胞赋予独特的条形码。

空间ATAC-seq是空间组学技术在染色质可及性领域的延伸，能够在保留组织空间位置信息的同时检测染色质可及性。空间ATAC-seq使得研究者可以在组织切片的原位观察不同区域的染色质开放状态，对于理解组织微环境中细胞状态的异质性具有重要意义。

### 2.6.2.2 ATAC-seq数据分析

ATAC-seq数据的比对使用能够处理可变长度片段的比对器。Bowtie2是最常用的ATAC-seq比对工具，支持局部比对和末端到末端比对模式。minimap2也可用于ATAC-seq比对，特别是在处理长读长ATAC-seq数据时。建议使用--very-sensitive模式并允许最多2个错配，以平衡灵敏度和特异性。

```bash
# ATAC-seq比对流程
# 1. 比对到参考基因组
bowtie2 -x /path/to/genome_index \
    -1 sample_R1.fq.gz -2 sample_R2.fq.gz \
    --very-sensitive -X 2000 \
    -p 8 -S sample.sam

# 2. 转换为BAM并排序
samtools view -bS sample.sam | samtools sort -o sample.sorted.bam
samtools index sample.sorted.bam

# 3. 去除线粒体reads
samtools idxstats sample.sorted.bam | cut -f 1 | grep -v "chrM" | \
    xargs samtools view -b sample.sorted.bam > sample.noMT.bam
samtools index sample.noMT.bam
```

::: warning 线粒体reads去除
去除线粒体reads是ATAC-seq数据处理中特别重要的一步。线粒体DNA没有核小体结构，完全处于开放状态，Tn5转座酶会大量切割线粒体DNA。在典型的ATAC-seq数据中，线粒体reads可能占总reads的20-60%，如果不加以去除会严重影响有效数据的比例。当线粒体reads比例异常高（超过50%）时，可能需要检查实验质量或考虑使用线粒体DNA含量较低的细胞类型。
:::

片段长度分布分析是ATAC-seq数据质量控制的核心指标。ATAC-seq产生的DNA片段长度分布呈现特征性的周期性模式：核小体游离片段（NFR）长度小于100bp，代表转录因子结合的开放区域；单核小体片段约180-247bp，代表被单个核小体包裹的DNA；双核小体片段约315-473bp；三核小体片段约558-615bp。高质量的ATAC-seq实验应显示出清晰的核小体游离峰和单核小体峰。

```r
# ATAC-seq片段长度分布分析
library(ggplot2)

# 模拟片段长度分布数据
fragment_lengths <- c(
    rnorm(5000, mean = 50, sd = 20),
    rnorm(3000, mean = 200, sd = 30),
    rnorm(1500, mean = 400, sd = 40),
    rnorm(500, mean = 600, sd = 50)
)

frag_df <- data.frame(length = fragment_lengths)
ggplot(frag_df, aes(x = length)) +
    geom_histogram(binwidth = 5, fill = "steelblue", color = "white") +
    scale_x_continuous(limits = c(0, 800)) +
    labs(title = "ATAC-seq片段长度分布",
         x = "片段长度(bp)", y = "Reads数") +
    theme_minimal()
```

Tn5转座酶偏移校正（Tn5 offset）是ATAC-seq数据分析的特殊步骤。Tn5转座酶以二聚体形式结合DNA，在两个位置同时切割，导致插入位点存在系统性偏移。对于正链reads需要向3'端偏移+4bp，负链reads需要向5'端偏移-5bp，这种+4/-5的偏移校正可以准确定位Tn5插入位点，从而正确反映核小体游离区的边界。如果不进行偏移校正，峰值调用结果可能会出现偏移，影响后续的基序分析和足迹分析的准确性。

峰值调用（peak calling）使用MACS2进行，采用--nomodel --shift -100 --extsize 200的参数设置，这是ATAC-seq数据的推荐参数。ATAC-seq峰值代表开放染色质区域，这些区域富集了转录因子结合位点和活跃的调控元件。比较不同样本的ATAC-seq数据时，一致性峰值集合（consensus peaks）的构建是必要的，它确保下游的差异分析基于相同的基因组区域。

差异可及性分析使用DiffBind或csaw等R包进行。DiffBind以峰值区域的read计数为输入，使用DESeq2或edgeR的统计框架识别在不同条件之间显著差异的开放区域。DiffBind可以处理复杂的实验设计，包括配对设计、时间序列等。

```r
# 使用DiffBind进行差异可及性分析
library(DiffBind)

# 创建样本信息表
samples <- data.frame(
    SampleID = c("ctrl1", "ctrl2", "treat1", "treat2"),
    Condition = c("control", "control", "treatment", "treatment"),
    bamReads = c("ctrl1.bam", "ctrl2.bam", "treat1.bam", "treat2.bam"),
    Peaks = c("ctrl1_peaks.narrowPeak", "ctrl2_peaks.narrowPeak",
              "treat1_peaks.narrowPeak", "treat2_peaks.narrowPeak"),
    PeakCaller = "narrow"
)

# 创建DBA对象
dba_obj <- dba(sampleSheet = samples)

# 计算一致性峰值
dba_obj <- dba.count(dba_obj, minOverlap = 2)

# 差异分析
dba_obj <- dba.contrast(dba_obj, categories = DBA_CONDITION,
                        minMembers = 2)
dba_obj <- dba.analyze(dba_obj)

# 提取差异可及性区域
diff_regions <- dba.report(dba_obj, th = 0.05)
head(diff_regions)
```

基序富集分析在差异可及性区域中寻找转录因子结合基序的富集模式，推断哪些转录因子可能驱动了观察到的染色质可及性变化。HOMER的findMotifsGenome命令可以快速在基因组区域中搜索已知的和de novo的转录因子结合基序。MEME套件提供了更全面的基序分析工具，包括MEME（de novo基序发现）、AME（已知基序富集检验）和CentriMo（中心富集分析）。

足迹分析（footprinting）在ATAC-seq数据中检测转录因子结合位点上reads覆盖度下降的模式。当转录因子结合到DNA上时，它会保护该区域免受Tn5切割，在开放区域的信号中形成一个局部的凹陷，即足迹。HINT-ATAC是专门为ATAC-seq数据设计的足迹分析工具，考虑了Tn5偏移和核小体信号的影响。TOBIAS通过比较不同条件下的足迹深度变化来推断转录因子活性的变化。

核小体定位分析利用ATAC-seq数据中的核小体相关片段推断核小体的精确位置。ATAC-seq数据中单核小体片段（约180-247bp）的末端对应核小体的边界，通过分析这些片段的分布可以推断核小体的位置和占据频率。NucTools是一个用于核小体定位分析的工具，可分析核小体占据图谱和核小体定位的周期性模式。

scATAC-seq分析流程需要处理数据的极度稀疏性。Signac是Seurat生态系统的单细胞ATAC-seq分析R包，提供从预处理到降维聚类的完整流程，可与Seurat的scRNA-seq分析无缝整合。ArchR是高性能的单细胞染色质可及性分析框架，支持大规模数据集处理，提供峰值调用、基序富集、轨迹推断等功能。Cicero专注于分析单细胞染色质可及性数据中的共可及性（co-accessibility）模式，通过识别远距离开放区域之间的共可及性关系推断增强子-启动子的连接。

```r
# 使用Signac进行scATAC-seq分析
library(Signac)
library(Seurat)

# 读取10X Genomics scATAC-seq数据
counts <- Read10X_h5("filtered_peak_bc_matrix.h5")
fragment_file <- "fragments.tsv.gz"

# 创建ChromatinAssay对象
chrom_assay <- CreateChromatinAssay(
    counts = counts,
    sep = c(":", "-"),
    fragments = fragment_file
)

# 创建Seurat对象
atac_obj <- CreateSeuratObject(
    counts = chrom_assay,
    assay = "peaks"
)

# 计算核小体信号和TSS富集分数
atac_obj <- NucleosomeSignal(atac_obj)
atac_obj <- TSSEnrichment(atac_obj)

# 质量过滤
atac_obj <- subset(
    atac_obj,
    nCount_peaks > 1000 &
    nCount_peaks < 50000 &
    nucleosome_signal < 2 &
    TSS.enrichment > 2
)

# 降维和聚类
atac_obj <- RunTFIDF(atac_obj)
atac_obj <- FindTopFeatures(atac_obj, min.cutoff = "q0")
atac_obj <- RunSVD(atac_obj)
atac_obj <- RunUMAP(atac_obj, reduction = "lsi", dims = 2:30)
atac_obj <- FindNeighbors(atac_obj, reduction = "lsi", dims = 2:30)
atac_obj <- FindClusters(atac_obj, resolution = 0.5)
```

## 2.6.3 组蛋白修饰分析

组蛋白修饰是表观遗传调控的另一个核心层次。组蛋白的N端尾巴可以发生多种共价修饰，包括甲基化、乙酰化、磷酸化、泛素化等，这些修饰改变染色质的结构和蛋白质相互作用，从而影响基因的表达状态。不同类型的组蛋白修饰标记不同的染色质状态：某些修饰（如H3K4me3、H3K27ac）标记活跃的基因调控区域，另一些修饰（如H3K27me3、H3K9me3）则标记沉默的染色质区域。组蛋白修饰分析的主要技术是染色质免疫沉淀测序（ChIP-seq），通过特异性抗体富集目标修饰的基因组区域，然后通过测序确定这些区域的位置。

### 2.6.3.1 ChIP-seq基础

染色质免疫沉淀测序（ChIP-seq）利用特异性抗体识别并结合目标蛋白或修饰，通过免疫沉淀将蛋白质-DNA复合物从细胞裂解物中分离出来，最后对富集的DNA片段进行测序。ChIP-seq实验的成功与否在很大程度上取决于抗体质量和实验条件的优化。计划ChIP-seq实验时，需要仔细考虑抗体选择、交联条件、对照设置和测序深度等因素。

抗体选择是ChIP-seq实验中最关键的决策之一。抗体的特异性直接决定实验结果的可靠性，非特异性抗体会导致背景信号升高和假阳性峰的出现。选择抗体时，应优先考虑经过ChIP-seq验证的抗体，并查阅ENCODE等数据库中该抗体的历史使用数据。抗体的批次间差异也需要关注，不同批次的同一抗体可能表现不同。建议参考ENCODE推荐的抗体列表，并在可能的情况下使用已发表研究中验证过的抗体。

交联条件的选择取决于目标蛋白的类型。XChIP（交联ChIP）使用甲醛等交联剂将蛋白质与DNA固定在一起，适用于大多数转录因子和组蛋白修饰的研究。Native ChIP（非交联ChIP）不使用交联剂，直接利用微球菌核酸酶消化染色质，适用于组蛋白修饰的研究，因为组蛋白与DNA的结合比转录因子更为稳定。研究组蛋白修饰时，Native ChIP通常能提供更低的背景和更精确的信号；研究转录因子时，XChIP是必需的，因为转录因子与DNA的结合较弱，不交联会在操作过程中丢失。

::: tip 输入对照
输入对照（input DNA）是ChIP-seq实验中必不可少的阴性对照。input DNA是未经免疫沉淀的DNA样本，它反映了染色质片段化和测序过程中的偏倚，如开放染色质区域更容易被片段化和测序。在峰值调用时，input对照用于估计背景信号水平，从而区分真实的富集信号和背景噪音。每个样本都应配备相应的input对照，否则峰值调用的可靠性会大打折扣。
:::

ChIP-seq实验设计还需要考虑峰数量期望和测序深度。不同类型的组蛋白修饰产生不同特征的峰：转录因子和活性启动子标记（如H3K4me3）产生尖锐的窄峰，通常需要20-40M reads即可获得良好的覆盖；广泛修饰（如H3K27me3、H3K36me3）覆盖较大的基因组区域，产生宽峰，需要更高的测序深度（40-60M reads）。

### 2.6.3.2 ChIP-seq数据分析

ChIP-seq数据的比对通常使用Bowtie2或BWA进行，比对参数设置与ATAC-seq类似，使用--very-sensitive模式以获得最佳的比对效果。比对后需要检查比对率、唯一比对率等质量指标，比对率过低可能提示样本质量问题或参考基因组选择不当。

重复去除是ChIP-seq数据处理中的重要步骤。PCR扩增产生的重复reads不代表真实的生物学信号，需要被标记或去除。Picard的MarkDuplicates工具是最常用的去重工具，它可以标记PCR重复而不删除它们，保留信息用于后续的质量评估。去重后的唯一比对reads数是评估文库复杂度的重要指标。

```bash
# ChIP-seq数据处理流程
# 1. 比对
bowtie2 -x /path/to/genome_index \
    -U chip_sample.fq.gz \
    --very-sensitive -p 8 \
    -S chip_sample.sam

# 2. 转换并排序
samtools view -bS chip_sample.sam | samtools sort -o chip_sample.sorted.bam
samtools index chip_sample.sorted.bam

# 3. 去除PCR重复
picard MarkDuplicates \
    INPUT=chip_sample.sorted.bam \
    OUTPUT=chip_sample.dedup.bam \
    METRICS_FILE=chip_sample.metrics.txt \
    REMOVE_DUPLICATES=true
samtools index chip_sample.dedup.bam
```

峰值调用是ChIP-seq数据分析的核心步骤，目标是从比对数据中识别基因组上被目标蛋白或修饰显著富集的区域。MACS2是最广泛使用的峰值调用工具，对于转录因子和H3K4me3等产生窄峰的修饰，使用默认的narrow peak模式；对于H3K27me3和H3K36me3等产生宽峰的修饰，使用--broad参数调用broad peak。SICER专门设计用于检测广泛组蛋白修饰的富集区域，利用空间聚类算法识别跨越数kb到数十kb的富集区域。HOMER的findPeaks命令提供多种峰值调用算法和丰富的注释功能。

```bash
# MACS2峰值调用
# 窄峰（转录因子，H3K4me3等）
macs2 callpeak -t chip_sample.dedup.bam \
    -c input_sample.dedup.bam \
    -f BAM -g hs \
    -n sample_narrow \
    --outdir peaks/ \
    -q 0.01

# 宽峰（H3K27me3，H3K36me3等）
macs2 callpeak -t chip_sample.dedup.bam \
    -c input_sample.dedup.bam \
    -f BAM -g hs \
    -n sample_broad \
    --outdir peaks/ \
    --broad -q 0.1
```

峰值质量控制使用ENCODE项目制定的标准评估ChIP-seq数据质量。FRiP（Fraction of Reads in Peaks）应大于0.01，即至少1%的reads落在峰值区域内，这个阈值对于组蛋白修饰可能更高。NSC（Normalized Strand Cross-correlation）和RSC（Relative Strand Cross-correlation）是基于链间交叉相关分析的质量指标，NSC应大于1.05，RSC应大于0.8。

峰可视化帮助研究者直观地理解组蛋白修饰的分布模式。IGV可以逐个基因查看ChIP-seq信号的分布，适合检查个别候选基因区域的修饰状态。deepTools提供批量生成热图和metaplot的功能，可以在TSS等参考点周围绘制所有基因的信号分布，揭示组蛋白修饰的整体模式。

```bash
# deepTools可视化
# 生成bigWig文件
bamCoverage -b chip_sample.dedup.bam \
    -o chip_sample.bw \
    --binSize 10 \
    --normalizeUsing RPGC \
    --effectiveGenomeSize 2913022398 \
    --extendReads

# 绘制TSS周围的metaplot
computeMatrix reference-point \
    -S chip_sample.bw \
    -R genes.bed \
    --referencePoint TSS \
    -b 3000 -a 3000 \
    -o matrix_TSS.gz

plotProfile -m matrix_TSS.gz \
    -o profile_TSS.png \
    --perGroup

# 绘制热图
plotHeatmap -m matrix_TSS.gz \
    -o heatmap_TSS.png
```

差异结合分析比较不同条件之间组蛋白修饰或转录因子结合的差异。DiffBind是专门为ChIP-seq差异分析设计的R包，使用DESeq2或edgeR作为统计后端，对峰值区域的reads计数进行差异检验。MAnorm通过比较两个样本之间的信号强度来识别差异结合区域，不需要生物学重复。CSAR基于泊松分布模型检验富集信号的差异。有生物学重复时DiffBind是推荐选择，只有单个样本时MAnorm可作为替代方案。

超级增强子鉴定是ChIP-seq分析中的一个重要应用。超级增强子是一类覆盖范围大、信号强度高的增强子簇，在细胞身份决定和疾病发生中发挥关键作用。ROSE（Rank Ordering of Super-Enhancers）算法利用H3K27ac的ChIP-seq信号鉴定超级增强子，其基本思路是将相邻的H3K27ac峰缝合为增强子区域，然后按照信号强度排序，通过斜率变化点区分超级增强子和普通增强子。

共结合分析通过比较多个ChIP-seq数据集的峰值重叠研究不同蛋白或修饰之间的协同关系。例如，同时分析转录因子和组蛋白修饰的ChIP-seq数据，可以发现转录因子结合位点与特定组蛋白修饰的共定位模式。共结合分析通常使用bedtools intersect等工具计算峰值重叠，并使用统计检验评估重叠的显著性。

### 2.6.3.3 组蛋白修饰功能解读

活性启动子标记（H3K4me3和H3K9ac）是识别活跃转录基因的关键表观遗传特征。H3K4me3在活跃基因的转录起始位点（TSS）附近形成特征性的峰，通常跨越TSS上下游约1-2kb。H3K9ac与H3K4me3经常共定位，两者的存在标志着启动子处于开放和活跃的状态。判断一个基因是否在特定细胞类型中活跃表达时，H3K4me3和H3K9ac的ChIP-seq信号是比DNA甲基化更直接的活性标记。

活性增强子标记（H3K27ac和H3K4me1）是识别活跃增强子的核心特征。H3K4me1在增强子区域富集，但单独的H3K4me1不能区分活跃增强子和poised增强子。H3K27ac是区分活跃增强子（H3K27ac阳性）和poised增强子（H3K27ac阴性、H3K4me1阳性）的关键标记。识别细胞类型特异性的活跃增强子时，H3K27ac的ChIP-seq数据是最重要的依据。

转录延伸标记（H3K36me3）沿着活跃转录的基因体分布，从TSS下游延伸到转录终止位点。H3K36me3的分布范围与基因的长度和转录活性相关，长基因和高表达基因具有更强的H3K36me3信号。H3K36me3还与剪接调控和DNA甲基化维持相关，Setd2介导的H3K36me3可以招募DNMT3B进行基因体甲基化。

多梳抑制标记（H3K27me3和H3K9me2/me3）标记沉默的染色质区域。H3K27me3由多梳抑制复合物2（PRC2）催化，覆盖大范围的基因组区域，在发育调控基因的启动子区域尤为常见。H3K9me2和H3K9me3主要与组成型异染色质相关，标记着丝粒、端粒和重复元件等区域。H3K27me3和H3K4me3同时存在的启动子被称为二价启动子（bivalent promoter），在胚胎干细胞中常见，代表基因处于准备状态，可以快速激活或永久沉默。

::: note 基因体甲基化与H3K36me3
基因体内的CpG甲基化与H3K36me3呈正相关，活跃转录的基因同时具有高水平的基因体甲基化和H3K36me3。这种关联的分子机制是H3K36me3可以招募DNMT3B到基因体区域进行甲基化，而基因体甲基化又可以抑制异常的基因内转录起始。同时分析甲基化和组蛋白修饰数据时，基因体区域H3K36me3与甲基化的正相关是一个可预期的特征。
:::

染色质状态分割与注释将多种组蛋白修饰的ChIP-seq数据整合，将基因组划分为具有不同功能状态的区域。ChromHMM基于隐马尔可夫模型（HMM）学习多种组蛋白修饰的组合模式，将基因组分割为不同数目的状态（如15状态或25状态模型），每种状态对应特定的染色质功能（如活跃启动子、强增强子、弱增强子、转录延伸、多梳抑制等）。Segway使用动态贝叶斯网络进行类似的分割，但建模方式不同。ENCODE 25状态模型和15状态模型使用不同组合的组蛋白修饰定义染色质状态，每种状态有明确的生物学含义和命名。

```bash
# 使用ChromHMM进行染色质状态分割（命令行示例）
# ChromHMM需要Java运行环境
# 1. 准备输入文件：将每个样本的BAM转换为二值化的信号文件
# BinarizeBam命令将BAM文件转换为ChromHMM格式

# 2. 学习染色质状态模型
# LearnModel命令执行HMM模型训练
# java -jar ChromHMM.jar LearnModel -p 8 binarized_dir output_dir 15 hg38

# 3. 结果解读
# emissions_15.txt: 各状态的组蛋白修饰发射概率
# transitions_15.txt: 状态之间的转移概率
# sample_15_segments.bed: 基因组分割结果
```

## 2.6.4 染色质互作分析

染色质在细胞核中通过折叠和环化形成复杂的三维结构。染色质互作分析研究基因组上远距离位点之间的物理接触，这些互作对于基因调控至关重要——增强子可以跨越数十万甚至数百万碱基对与启动子形成环状结构来激活基因表达。染色质构象捕获技术及其衍生方法使得全基因组范围内的染色质互作检测成为可能，为理解基因调控的空间维度提供了强有力的工具。

### 2.6.4.1 染色质构象捕获技术

3C（染色质构象捕获）是最早的染色质互作检测技术，通过甲醛交联固定细胞内蛋白质-DNA复合物，然后用限制性内切酶消化，在近距离连接后检测特定的一对基因组位点之间的互作频率。3C是**一对一**的检测模式，只能检测预先选定的两个位点之间的互作，适合验证已知的增强子-启动子互作。

4C（环状染色质构象捕获）采用**一对全**的检测模式，以一个特定的位点（viewpoint）为锚点，检测其与基因组上所有其他位点的互作。4C通过反向PCR扩增viewpoint周围的连接片段，然后进行高通量测序。研究一个特定基因或增强子与全基因组的互作网络时，4C提供全面的信息。

5C（3C-碳拷贝）采用**多对多**的检测模式，通过设计覆盖目标区域的引物池同时检测多个位点之间的互作。5C适合研究特定基因组区域（如一个基因簇或一个拓扑关联结构域）内部的所有互作关系，但引物设计的复杂性限制了其应用范围。

Hi-C是**全对全**的染色质互作检测技术，使用生物素标记的核苷酸富集连接片段，然后进行全基因组测序，理论上可以检测基因组上所有位点对之间的互作频率。Hi-C数据通常以接触矩阵（contact matrix）的形式呈现，矩阵中每个元素表示对应两个基因组区域之间的互作频率。Hi-C是研究全基因组染色质组织结构的最强大工具。

Capture Hi-C结合Hi-C和靶向捕获技术，通过设计探针捕获包含特定区域（如所有基因启动子）的连接片段，以更高的分辨率和深度检测目标区域的互作。Capture Hi-C特别适合研究启动子与远端调控元件之间的互作，在疾病遗传学研究中被广泛用于将GWAS信号与靶基因连接起来。

ChIA-PET（染色质免疫沉淀-配对末端标签测序）结合ChIP和Hi-C的原理，先通过免疫沉淀富集特定蛋白（如RNA聚合酶II、CTCF等）介导的染色质互作，然后检测这些蛋白相关的互作网络。HiChIP和PLAC-seq是ChIA-PET的改进版本，在Hi-C文库制备后进行免疫沉淀，实验流程更简单且信噪比更高，需要的细胞量更少。

Micro-C使用微球菌核酸酶代替限制性内切酶消化染色质，实现核小体分辨率的染色质互作检测。与Hi-C相比，Micro-C能够检测更精细的染色质结构，包括相邻核小体之间的互作。SPRITE（Split-Pool Recognition of Interactions by Tag Extension）不依赖连接反应，通过多轮分池和标记识别同一复合物中的多个DNA分子，可以检测包含多个位点的复合互作。

### 2.6.4.2 Hi-C数据分析

Hi-C数据的比对需要将双端reads分别比对到参考基因组，然后根据比对位置确定每对reads代表的基因组互作。HiC-Pro是一个完整的Hi-C数据处理流程，包括比对、过滤、接触矩阵构建和归一化。Juicer是Aiden实验室开发的Hi-C分析流程，提供从原始数据到可视化的端到端解决方案。distiller是Juicer的下一代版本，使用更模块化的设计。处理大规模Hi-C数据时，HiC-Pro和Juicer是两个最成熟的选择。

```bash
# 使用Juicer处理Hi-C数据
# Juicer自动化流程
juicer.sh -g hg38 -s MboI -z /path/to/genome.fa \
    -p /path/to/chrom.sizes \
    -y /path/to/restriction_sites.txt \
    -d /path/to/fastq_dir/ \
    -D /path/to/juicer_dir/ \
    -t 16

# 使用HiC-Pro
HiC-Pro -i /path/to/fastq_dir/ \
    -o /path/to/output/ \
    -c config_hicpro.txt
```

过滤噪音是Hi-C数据处理中必不可少的步骤。自连接（self-ligation）是指同一条限制性片段的两端被连接在一起的情况，这些读对不包含互作信息。未连接（dangling end）是指限制性酶切后未被连接的末端，这些读对也不代表真实的互作。PCR重复需要被去除以避免扩增偏倚。

接触矩阵构建将过滤后的互作读对按照基因组位置分箱（binning），构建表示互作频率的矩阵。bin大小的选择影响数据的分辨率和信噪比：较小的bin（如5kb）提供更高的分辨率但噪音较大，较大的bin（如1Mb）信号更平滑但丢失细节。常用的bin大小包括5kb、10kb、25kb、50kb、100kb、500kb和1Mb。在分辨率和信噪比之间取得平衡时，25kb-50kb的bin大小通常是TAD分析的良好起点。

ICE归一化（迭代纠正经验偏差消除）是Hi-C数据归一化的标准方法。ICE假设基因组上每个bin的互作总数应该相等，任何偏差都来源于技术噪音。ICE通过迭代地除以行和列的边际来消除系统偏差，直到矩阵收敛。归一化后的接触矩阵更适合进行下游的TAD检测和环识别。比较不同样本的Hi-C数据时，归一化是确保可比性的关键步骤。

质量控制评估Hi-C数据的多个方面。顺式（cis）互作比率是指同一条染色体内的互作占总互作的比例，高质量的Hi-C数据顺式比率通常较高。反式（trans）互作比率是不同染色体之间的互作比例。有效读对比例是经过过滤后保留的读对占总读对的比例。受限制片段比对效率反映了比对到预期限制性酶切片段的reads比例。

---

## 实战示例

表观遗传学分析在实际研究中有着广泛的应用场景，从癌症甲基化标志物的发现到免疫细胞活化过程中的染色质重塑，从三维基因组互作解析到早期胚胎发育的表观重编程。本节通过五个具有代表性的实际案例，展示如何将前面介绍的表观遗传学分析方法整合应用于具体的科学问题。

### 范例一：癌症中DNA甲基化异常与预后标志物

DNA甲基化异常是癌症中最常见的表观遗传学改变之一，肿瘤抑制基因启动子的高甲基化导致的基因沉默是肿瘤发生发展的重要机制。一个典型应用场景是收集100例肝细胞癌组织与配对的癌旁正常组织进行WGBS，鉴定与预后相关的甲基化标志物并解释肿瘤抑制基因沉默的机制。配对设计可以有效控制个体间的遗传背景差异，使得检测到的甲基化变化更可能与肿瘤相关。

整个分析流程从WGBS数据的质控和比对开始。使用fastp对原始测序数据进行质量过滤和接头修剪后，使用Bismark将重亚硫酸盐处理后的reads比对到人类参考基因组上。Bismark将参考基因组进行原位重亚硫酸盐转化后建立索引，然后将测序reads与转化后的基因组进行比对，从而正确处理重亚硫酸盐测序中C到T的转化。比对完成后，使用deduplicate_bismark去除PCR重复，然后使用bismark_methylation_extractor提取每个CpG位点的甲基化状态信息。

差异甲基化分析使用DSS包进行。DSS采用基于beta-binomial回归模型的方法，考虑甲基化数据中常见的过度离散问题，并使用经验Bayes方法对离散参数进行收缩估计以提高统计功效。设置筛选标准为绝对beta值差异大于0.2且FDR小于0.01，最终鉴定出约2000个差异甲基化位点（DMP）和100个差异甲基化区域（DMR）。启动子区域的高甲基化尤其值得关注，因为启动子高甲基化通常与基因表达沉默相关。

注释与可视化使用annotatr或ChIPseeker等R包将DMR注释到基因组功能区域，包括启动子、基因体、增强子和重复元件等。在肝癌案例中，启动子区域的DMR附近经常关联表达下调的肿瘤抑制基因，如CDKN2A（p16）和RASSF1A。CDKN2A是细胞周期调控的关键基因，其启动子高甲基化导致的沉默在多种癌症中反复出现；RASSF1A参与Ras信号通路的负调控，其甲基化沉默在肝癌中也是高频事件。

甲基化与基因表达的整合分析需要同一批样本的RNA-seq数据。对100对肝癌和正常组织同时进行RNA-seq测序，可以获得匹配的甲基化和表达数据。通过计算启动子甲基化水平与对应基因表达值之间的相关性，可以验证甲基化对基因表达的调控作用。超甲基化启动子与基因表达呈显著负相关，特别是那些启动子DMR对应的基因，其表达下调的幅度更为显著。

生存分析是将甲基化标志物与临床预后联系起来的核心步骤。基于关键CpG位点的甲基化值对患者进行层次聚类，可以将患者分为高风险和低风险两组。使用Cox比例风险模型评估甲基化水平与生存时间的关联，计算风险比（hazard ratio）和置信区间。高风险组的患者甲基化模式与更差的总体生存率显著相关，提示这些甲基化标志物具有预后预测价值。

```bash
# WGBS数据处理流程 (Bismark)
# 1. 构建重亚硫酸盐基因组索引
bismark_genome_preparation /path/to/hg38/

# 2. 比对 (双端测序)
bismark --genome /path/to/hg38/ \
    -1 tumor_R1.fq.gz -2 tumor_R2.fq.gz \
    --parallel 8 --output_dir bismark_tumor/

bismark --genome /path/to/hg38/ \
    -1 normal_R1.fq.gz -2 normal_R2.fq.gz \
    --parallel 8 --output_dir bismark_normal/

# 3. 去重
deduplicate_bismark --paired bismark_tumor/tumor_bismark_bt2_pe.bam
deduplicate_bismark --paired bismark_normal/normal_bismark_bt2_pe.bam

# 4. 甲基化提取
bismark_methylation_extractor \
    --paired-end --gzip --comprehensive \
    --bedGraph --CX_context \
    bismark_tumor/tumor_bismark_bt2_pe.deduplicated.bam

bismark_methylation_extractor \
    --paired-end --gzip --comprehensive \
    --bedGraph --CX_context \
    bismark_normal/normal_bismark_bt2_pe.deduplicated.bam
```

```r
# 差异甲基化分析 (DSS)
library(DSS)
library(bsseq)

# 构建BSseq对象 (示例: 3对肿瘤/正常样本)
chr <- rep("chr9", 5)
pos <- c(21994789, 21994801, 21994810, 21994825, 21994833)

# 肿瘤样本甲基化计数
M_tumor <- cbind(c(18, 20, 15, 19, 17),
                 c(16, 19, 14, 20, 18),
                 c(17, 21, 16, 18, 16))
# 正常样本甲基化计数
M_normal <- cbind(c(3, 5, 2, 4, 3),
                  c(4, 6, 3, 5, 4),
                  c(2, 4, 1, 3, 2))
# 总覆盖度
Cov_tumor <- cbind(rep(20, 5), rep(20, 5), rep(20, 5))
Cov_normal <- cbind(rep(20, 5), rep(20, 5), rep(20, 5))

BSobj <- BSseq(
    chr = chr, pos = pos,
    M = cbind(M_tumor, M_normal),
    Cov = cbind(Cov_tumor, Cov_normal),
    sampleNames = c("T1", "T2", "T3", "N1", "N2", "N3")
)

# 差异甲基化检验
dmlTest <- DMLtest(BSobj,
                   group1 = c("T1", "T2", "T3"),
                   group2 = c("N1", "N2", "N3"))
head(dmlTest)

# 调用DML (差异甲基化位点)
dmls <- callDML(dmlTest, p.threshold = 0.001)
head(dmls)

# 调用DMR (差异甲基化区域)
dmrs <- callDMR(dmlTest, p.threshold = 0.01, delta = 0.2)
head(dmrs)
```

```r
# 甲基化与表达整合 + 生存分析
library(survival)
library(survminer)

# 甲基化与表达相关性分析
meth_values <- c(0.85, 0.78, 0.12, 0.91, 0.65, 0.08, 0.72, 0.45)
expr_values <- c(1.2, 2.1, 8.5, 0.8, 3.2, 9.1, 2.5, 5.8)
cor_test <- cor.test(meth_values, expr_values, method = "spearman")
cat(sprintf("启动子甲基化与基因表达相关性: rho = %.3f, p = %.4e\n",
            cor_test$estimate, cor_test$p.value))

# 基于甲基化聚类分组
meth_matrix <- matrix(rnorm(100 * 50, mean = 0.5, sd = 0.2), nrow = 100)
hc <- hclust(dist(t(meth_matrix)), method = "ward.D2")
risk_group <- cutree(hc, k = 2)

# Cox回归生存分析
survival_data <- data.frame(
    time = rnorm(50, mean = 60, sd = 30),
    status = sample(0:1, 50, replace = TRUE, prob = c(0.3, 0.7)),
    group = factor(risk_group)
)
cox_model <- coxph(Surv(time, status) ~ group, data = survival_data)
summary(cox_model)

# Kaplan-Meier曲线
fit <- survfit(Surv(time, status) ~ group, data = survival_data)
ggsurvplot(fit, data = survival_data,
           pval = TRUE, risk.table = TRUE,
           xlab = "时间 (月)", ylab = "生存概率",
           title = "基于甲基化分组的生存曲线")
```

### 范例二：ATAC-seq和RNA-seq揭示免疫细胞活化时的染色质重塑

T细胞活化是适应性免疫应答的核心事件，理解这一过程中染色质可及性的动态变化对于揭示转录调控的分子机制至关重要。一个典型应用场景是从人外周血分离初始CD4+T细胞，使用抗CD3/CD28抗体进行激活，在0小时、6小时和24小时三个时间点分别收集细胞进行ATAC-seq和RNA-seq测序。时间序列设计可以捕捉T细胞从静息状态到完全活化过程中染色质重塑的逐步变化。

ATAC-seq数据的处理从比对开始。使用Bowtie2将测序reads比对到人类参考基因组hg38上，由于ATAC-seq使用Tn5转座酶切割开放染色质区域，比对参数需要设置较大的插入片段上限（通常-X 2000）以容纳核小体包裹的较长片段。比对后需要去除线粒体reads，因为线粒体基因组没有核小体包裹，Tn5转座酶可以自由切割，导致线粒体reads在ATAC-seq数据中占比极高（可达30-50%）。

Tn5转座酶偏移校正对于准确定位Tn5插入位点至关重要。Tn5转座酶以二聚体形式结合DNA，在两个位置同时切割，导致插入位点的偏移。对于正链reads需要向3'端偏移+4bp，负链reads需要向5'端偏移-5bp，这种+4/-5的偏移校正可以准确定位Tn5插入位点，从而正确反映核小体游离区的边界。

峰值调用使用MACS2进行，采用--nomodel --shift -100 --extsize 200的参数设置。在每个时间点分别调用峰值后，可以获得各时间点的开放染色质区域集合。0小时样本的峰值代表初始T细胞中已经开放的染色质区域，6小时和24小时样本中新增的峰值则代表T细胞活化过程中新开放的区域。

差异可及性分析使用DiffBind包进行。6小时与0小时比较鉴定出早期响应的差异可及性区域，24小时与0小时比较鉴定出晚期响应的区域。早期响应区域可能包含即时早期基因的调控元件，而晚期响应区域可能包含效应基因的调控元件。

基序富集分析使用HOMER进行，识别差异可及性区域中富集的转录因子结合基序。早期（0-6小时）差异开放区域富集AP-1家族转录因子（Fos、Jun）的结合基序，AP-1是T细胞受体信号通路的即时早期响应因子。晚期（24小时）差异开放区域则富集NFAT和NF-κB的结合基序，这些转录因子分别响应钙信号和炎症信号，驱动T细胞效应功能的获得。

足迹分析使用TOBIAS工具，在核小体游离区内检测转录因子结合留下的足迹。与简单的基序富集分析不同，足迹分析可以推断转录因子的实际结合活性。TOBIAS通过比较不同条件下足迹的深度变化，可以量化转录因子结合活性的动态变化。AP-1家族转录因子在6小时即显示出强烈的足迹信号，而NFAT的足迹在24小时才变得显著。

RNA-seq差异表达与ATAC-seq数据的整合是理解染色质重塑功能效应的关键。对同一批样本进行RNA-seq测序，使用DESeq2鉴定差异表达基因后，将差异表达基因的启动子或增强子区域与差异可及性区域进行重叠分析。共表达基因的启动子或增强子的开放动态与表达变化方向一致——可及性增加的区域对应的基因表达上调，反之亦然。

```bash
# ATAC-seq数据处理流程
# 1. 比对 (Bowtie2)
bowtie2 -x /path/to/hg38_index \
    -1 sample_R1.fq.gz -2 sample_R2.fq.gz \
    --very-sensitive -X 2000 \
    -p 12 -S sample.sam 2> align_log.txt

# 2. 转换、排序、索引
samtools view -bS sample.sam | samtools sort -o sample.sorted.bam
samtools index sample.sorted.bam

# 3. 去除线粒体reads
samtools idxstats sample.sorted.bam | cut -f 1 | grep -v "chrM" | \
    xargs samtools view -b sample.sorted.bam > sample.noMT.bam

# 4. 去除PCR重复
picard MarkDuplicates INPUT=sample.noMT.bam OUTPUT=sample.dedup.bam \
    METRICS_FILE=sample.metrics.txt REMOVE_DUPLICATES=true
samtools index sample.dedup.bam

# 5. Tn5偏移校正 + 峰值调用 (MACS2)
# 正链偏移+4, 负链偏移-5
samtools view -H sample.dedup.bam > header.sam
samtools view sample.dedup.bam | \
    awk '($2==0 || $2==16)' | \
    awk '{if($2==0) $4=$4+4; else $4=$4-5; print}' | \
    cat header.sam - | samtools view -b - > sample.shifted.bam

macs2 callpeak -t sample.shifted.bam -f BAMPE \
    --nomodel --shift -100 --extsize 200 \
    -g hs -n sample_peaks --keep-dup all -q 0.05
```

```r
# 差异可及性分析 (DiffBind)
library(DiffBind)

# 创建样本信息表
samples <- dba.sampleSheet(
    SampleID = c("T0_1", "T0_2", "T0_3", "T6_1", "T6_2", "T6_3",
                  "T24_1", "T24_2", "T24_3"),
    Condition = rep(c("T0h", "T6h", "T24h"), each = 3),
    bamReads = list.files("bam/", pattern = "*.dedup.bam$", full.names = TRUE),
    Peaks = list.files("peaks/", pattern = "*.narrowPeak$", full.names = TRUE),
    PeakCaller = "narrow"
)

# 创建DBA对象
dba_obj <- dba(sampleSheet = samples)

# 计算一致性峰值 (至少在2个样本中出现)
dba_obj <- dba.count(dba_obj, minOverlap = 2)

# 差异分析: T6h vs T0h
dba_contrast <- dba.contrast(dba_obj, categories = DBA_CONDITION,
                             minMembers = 2)
dba_analyze <- dba.analyze(dba_contrast)

# 提取差异可及性区域
diff_peaks <- dba.report(dba_analyze, th = 0.05, fold = 1)
cat(sprintf("差异可及性区域数: %d\n", length(diff_peaks)))
```

```bash
# 基序富集分析 (HOMER)
# 早期响应区域 (T6h vs T0h) 的基序富集
findMotifsGenome.pl diff_peaks_early.bed hg38 homer_early_out/ -size 200 -mask

# 晚期响应区域 (T24h vs T0h) 的基序富集
findMotifsGenome.pl diff_peaks_late.bed hg38 homer_late_out/ -size 200 -mask

# 足迹分析 (TOBIAS)
# 1. 纠正Tn5偏移
TOBIAS ATACorrect --bam sample.dedup.bam \
    --genome hg38.fa --out sample_corrected.bw

# 2. 足迹检测
TOBIAS FootprintScores --bam sample.dedup.bam \
    --regions peaks.narrowPeak \
    --genome hg38.fa --out footprints.bw

# 3. 比较不同条件的足迹
TOBIAS BINDetect --motifs JASPAR2022.motif \
    --footprints footprints_T0.bw footprints_T6.bw footprints_T24.bw \
    --regions peaks.narrowPeak \
    --genome hg38.fa --out BINDetect_output/
```

### 范例三：Hi-C鉴定疾病相关增强子-启动子环路

全基因组关联研究（GWAS）已经发现大量与复杂疾病相关的遗传变异，但其中约90%位于非编码区域，这些变异如何影响疾病风险一直是遗传学中的核心难题。冠状动脉疾病的GWAS研究发现多个非编码风险SNP位于增强子域内，但这些增强子的靶基因往往不是基因组线性距离上最近的基因，而是通过三维染色质互作连接的远端基因。为了鉴定这些非编码变异的靶基因，对血管平滑肌细胞进行H3K27ac HiChIP实验，利用H3K27ac标记捕获与活性增强子互作的启动子区域。

HiChIP数据的处理使用HiC-Pro流程进行。HiC-Pro支持从原始fastq文件到标准化接触矩阵的完整分析流程。对于HiChIP数据，HiC-Pro首先将reads比对到参考基因组，然后识别有效的配对读段，过滤自连接、未连接和PCR重复等噪音读段，最终构建不同分辨率的接触矩阵。HiChIP相比传统Hi-C的优势在于通过免疫沉淀富集了与特定组蛋白修饰相关的染色质互作，在相同的测序深度下可以获得更高信噪比的互作信号。

峰检测首先对H3K27ac信号进行峰值调用，确定增强子的基因组位置。使用MACS2对HiChIP数据中的ChIP信号部分进行峰值调用，鉴定H3K27ac富集的区域作为候选增强子。互作调用使用FitHiC2进行，它基于接触矩阵中的互作频率和基因组距离的期望分布识别显著的染色质互作。FitHiC2考虑了基因组距离对互作频率的影响——距离越近的位点互作频率越高。

将GWAS SNP与增强子区域进行重叠分析是连接遗传变异与靶基因的关键步骤。使用bedtools intersect将GWAS显著SNP（p < 5e-8）与H3K27ac峰值区域进行重叠，找到风险等位基因影响的增强子。对于每个包含GWAS SNP的增强子，查找其通过HiChIP互作连接的启动子，启动子对应的基因即为候选靶基因。这种基于三维基因组互作的靶基因映射比简单的线性距离方法更准确。在这个案例中，SORT1和CILP2等基因被鉴定为冠状动脉疾病风险SNP的候选靶基因。SORT1编码sortilin蛋白，参与脂质代谢，其表达变化与低密度脂蛋白胆固醇水平密切相关。

```bash
# HiChIP数据处理流程 (HiC-Pro)
# 1. 配置HiC-Pro参数
# config_hichip.txt中设置参考基因组、限制性酶切位点等

# 2. 运行HiC-Pro
/path/to/HiC-Pro/bin/HiC-Pro \
    -i fastq_dir/ \
    -o hichip_output/ \
    -c config_hichip.txt \
    -p 12

# 3. H3K27ac峰值调用 (MACS2)
macs2 callpeak -t hichip_ChIP.bam -c hichip_input.bam \
    -f BAMPE -g hs -n H3K27ac_peaks \
    --keep-dup all -q 0.01 --broad

# 4. 互作调用 (FitHiC2)
FitHiC2.py -b hichip_output/iced_matrix/5000/ \
    -o fithic2_output/ \
    -l 5000 -p 12 \
    --lib 50000000
```

```r
# GWAS SNP与增强子重叠 + 靶基因映射
library(GenomicRanges)
library(rtracklayer)

# 读取GWAS SNP
gwas_snps <- read.csv("CAD_GWAS_significant.csv")
gr_snps <- GRanges(seqnames = gwas_snps$chr,
                   ranges = IRanges(start = gwas_snps$pos, width = 1),
                   rsid = gwas_snps$rsid, pvalue = gwas_snps$pvalue)

# 读取H3K27ac增强子峰值
enhancers <- import("H3K27ac_peaks.broadPeak")
gr_enhancers <- GRanges(seqnames = seqnames(enhancers),
                        ranges = ranges(enhancers),
                        name = enhancers$name)

# 读取互作对
interactions <- read.csv("fithic2_output/significant_interactions.csv")
gr_enh <- GRanges(seqnames = interactions$chr1,
                  ranges = IRanges(start = interactions$start1,
                                   end = interactions$end1))
gr_prom <- GRanges(seqnames = interactions$chr2,
                   ranges = IRanges(start = interactions$start2,
                                    end = interactions$end2),
                   gene = interactions$gene_name)

# SNP与增强子重叠
snp_in_enhancer <- findOverlaps(gr_snps, gr_enhancers)
cat(sprintf("落在增强子内的GWAS SNP数: %d\n", length(snp_in_enhancer)))

# 查找增强子互作的靶基因
for (i in seq_len(length(snp_in_enhancer))) {
    snp_idx <- queryHits(snp_in_enhancer)[i]
    enh_idx <- subjectHits(snp_in_enhancer)[i]
    enh_region <- gr_enhancers[enh_idx]
    target_genes <- gr_prom$gene[overlapsAny(gr_prom, enh_region)]
    if (length(target_genes) > 0) {
        cat(sprintf("SNP %s -> 增强子 -> 靶基因: %s\n",
                    gr_snps$rsid[snp_idx],
                    paste(target_genes, collapse = ", ")))
    }
}
```

### 范例四：组蛋白修饰图谱描绘早期胚胎发育的表观重编程

早期胚胎发育是表观遗传重编程最剧烈的阶段之一，受精后的合子需要擦除亲本的表观遗传记忆并建立新的表观遗传程序以支持胚胎发育。一个典型应用场景是研究小鼠卵细胞受精后不同阶段（合子基因激活前后）的组蛋白修饰重塑过程，使用少量细胞的ChIP-seq（Low-input ChIP-seq）分析H3K4me3和H3K27me3两种修饰的动态变化。H3K4me3标记活性启动子，H3K27me3标记多梳抑制区域，这两种修饰的动态重塑反映了胚胎发育过程中基因激活和沉默的程序性变化。

少量细胞ChIP-seq的技术挑战在于起始材料有限，传统的ChIP-seq通常需要数百万个细胞，而早期胚胎每个阶段可能只有数十到数百个细胞可用。Low-input ChIP-seq通过优化交联条件、使用carrier DNA和改进文库构建方法来适应低输入量。例如，使用Micrococcal Nuclease（MNase）代替超声片段化可以更温和地切割染色质，减少材料损失；使用线性扩增（如T7聚合酶扩增）代替PCR扩增可以减少扩增偏倚。

ChIP-seq数据的比对和峰值调用遵循标准流程，但需要注意不同组蛋白修饰的峰值特征差异。使用Bowtie2将reads比对到小鼠参考基因组mm10后，使用MACS2进行峰值调用。H3K4me3产生窄而尖锐的峰值，集中在转录起始位点附近，使用MACS2的默认窄峰模式调用。H3K27me3则产生宽而弥散的峰值，覆盖大范围的基因组区域，需要使用MACS2的宽峰模式（--broad参数）或SICER工具进行调用。SICER特别适合检测宽峰修饰，通过空间聚类识别富集区域，对H3K27me3等广泛分布的修饰具有更高的灵敏度。

染色质状态分段使用ChromHMM进行，基于多组组蛋白修饰的组合模式将基因组分割为不同的功能状态。使用H3K4me3和H3K27me3两种修饰作为输入，ChromHMM可以识别出活性启动子状态（H3K4me3阳性）、多梳抑制状态（H3K27me3阳性）和二价状态（H3K4me3和H3K27me3同时阳性）等。二价染色质状态在胚胎干细胞和早期胚胎中特别常见，它将激活和抑制信号同时置于一个基因的启动子上，使基因处于待命状态，在后续分化中根据信号决定激活还是沉默。

动态模式分析揭示了受精后组蛋白修饰的非对称性重塑。在受精后的合子中，父源基因组上H3K4me3被广泛建立，而H3K27me3则被非对称性消除。这种非对称性反映了父本和母本基因组在受精后经历不同的表观遗传重编程过程——父本基因组在受精后经历大规模的组蛋白替换，精子的组蛋白被卵细胞的组蛋白变体替换，新组装的染色质倾向于建立活性标记H3K4me3；母本基因组则保留了卵细胞中的组蛋白修饰模式，包括部分H3K27me3标记。

基因表达关联分析将组蛋白修饰变化与母源转录本降解和合子基因激活联系起来。在合子基因激活之前，胚胎发育依赖于母源沉积的mRNA和蛋白质，这些母源因子在合子基因激活后逐渐被降解。母源转录本降解伴随其基因座上H3K4me3的减少和H3K27me3的增加，而合子新激活基因的启动子则获得H3K4me3标记。

差异分析使用MAnorm比较不同发育阶段之间重编程区域的峰强度变化。MAnorm通过将共享峰作为参考来归一化两个样本之间的全局信号差异，然后计算每个峰区域的log2倍数变化。可视化热图使用deepTools的computeMatrix计算所有基因启动子区域的H3K4me3和H3K27me3信号分布，然后使用plotHeatmap生成热图。在早期胚胎中，H3K4me3不仅出现在传统的启动子区域，还在大量非启动子区域（如基因间区和内含子中）被建立，这种非经典的H3K4me3分布是早期胚胎特有的表观遗传特征，可能与合子基因激活的准备有关。

```bash
# Low-input ChIP-seq数据处理流程
# 1. 比对 (Bowtie2)
bowtie2 -x /path/to/mm10_index \
    -U sample.fq.gz \
    --very-sensitive -p 8 \
    -S sample.sam 2> align_log.txt

# 2. 过滤和排序
samtools view -bS -q 30 sample.sam | samtools sort -o sample.sorted.bam
samtools index sample.sorted.bam

# 3. 去除PCR重复
picard MarkDuplicates INPUT=sample.sorted.bam OUTPUT=sample.dedup.bam \
    METRICS_FILE=sample.metrics.txt REMOVE_DUPLICATES=true

# 4. 峰值调用
# H3K4me3 (窄峰)
macs2 callpeak -t H3K4me3.dedup.bam -c input.dedup.bam \
    -f BAM -g mm -n H3K4me3_peaks -q 0.01

# H3K27me3 (宽峰)
macs2 callpeak -t H3K27me3.dedup.bam -c input.dedup.bam \
    -f BAM -g mm -n H3K27me3_peaks -q 0.01 --broad

# 或使用SICER检测H3K27me3宽峰
# SICER.sh input_dir/ H3K27me3.dedup.bam input.dedup.bam mm10 200 150 0.86 600 0.01
```

```bash
# deepTools可视化热图
# 1. 生成矩阵
computeMatrix reference-point \
    --regions gene_promoters.bed \
    --scorefiles H3K4me3_zygote.bw H3K4me3_2cell.bw \
                 H3K27me3_zygote.bw H3K27me3_2cell.bw \
    --referencePoint TSS \
    -b 3000 -a 3000 \
    --binSize 50 --missingDataAsZero \
    -o matrix_promoters.gz

# 2. 绘制热图
plotHeatmap -m matrix_promoters.gz \
    --colorMap RdBu_r \
    --whatToShow "heatmap and colorbar" \
    --zMin -2 --zMax 2 \
    -o heatmap_promoters.png

# 3. 非启动子区H3K4me3分析
computeMatrix reference-point \
    --regions non_promoter_H3K4me3.bed \
    --scorefiles H3K4me3_zygote.bw H3K4me3_2cell.bw \
    --referencePoint center \
    -b 3000 -a 3000 \
    -o matrix_non_promoter.gz

plotHeatmap -m matrix_non_promoter.gz \
    --colorMap RdBu_r \
    -o heatmap_non_promoter_H3K4me3.png
```

### 范例五：表观遗传时钟预测衰老速度

表观遗传时钟通过测量特定CpG位点的甲基化水平来预测个体的生物学年龄，为量化衰老速度和评估抗衰老干预效果提供了分子层面的工具。一个典型应用场景是从GEO数据库下载多个队列（年龄范围20-90岁）血液样本的Illumina 450K甲基化芯片数据，构建一个预测年龄的模型并评估健康生活方式对表观遗传年龄加速（AgeAccel）的影响。

数据质量控制与归一化是甲基化芯片数据分析的首要步骤。使用minfi包读取IDAT格式的原始芯片数据，首先进行样本级别的质控，去除检测p值不合格的探针（通常阈值0.01）、性别不匹配的样本和异常样本。探针级别的质控需要去除检测失败的探针、位于性染色体上的探针（避免性别混淆）、已知含有SNP的探针以及交叉反应性探针。归一化使用ChAMP包或minfi包中的functional normalization方法，后者通过将探针信号与对照探针进行回归来去除技术变异。

筛选年龄相关CpG位点是构建表观遗传时钟的基础。弹性网络回归是构建表观遗传时钟最常用的方法，它结合L1正则化（Lasso，促进稀疏性）和L2正则化（Ridge，处理共线性），可以在数十万个CpG位点中选择一个信息量最大的子集。通过交叉验证确定最优的正则化参数后，弹性网络回归最终选出一组CpG位点及其权重系数。

Horvath时钟的原始模型使用353个CpG位点，通过弹性网络回归从超过20000个候选位点中筛选得到。表观遗传年龄的计算公式为：表观年龄 = sum(weight_i × beta_i) + intercept，其中weight_i是第i个CpG位点的回归系数，beta_i是其甲基化水平。由于年龄与甲基化之间的关系可能是非线性的，Horvath时钟还使用了一个反变换函数将预测值映射回年龄尺度。

表观遗传年龄加速（AgeAccel）是衡量个体衰老速度偏离人群平均水平的指标。AgeAccel = 表观遗传年龄 - 实际年龄，正值表示表观遗传年龄大于实际年龄（加速衰老），负值表示延缓衰老。另一种计算方式是残差法，即将表观遗传年龄对实际年龄进行线性回归，取残差作为AgeAccel。残差法的优势在于它自动校正了表观遗传年龄与实际年龄之间的系统性偏差。

生活方式问卷数据分析将AgeAccel与生活方式因素进行关联，评估健康行为对衰老速度的影响。使用线性回归模型将AgeAccel作为因变量，运动频率、饮食质量、吸烟状态等生活方式因素作为自变量，同时校正年龄、性别、细胞比例等协变量。高运动组（每周运动超过150分钟）的AgeAccel比低运动组减少约3年，表明规律运动可以延缓表观遗传衰老。吸烟者的AgeAccel比非吸烟者增加约2年，与GrimAge时钟中吸烟相关CpG位点的发现一致。

外部验证是评估表观遗传时钟泛化能力的关键步骤。使用一个独立的验证数据集（不参与模型训练）来评估时钟的预测精度。在验证集中，计算每个样本的表观遗传年龄并与实际年龄进行比较，计算相关系数（R²）和中位绝对误差（MAD）。一个可靠的表观遗传时钟在验证集上的R²应大于0.8，MAD应小于5年。

```r
# 表观遗传时钟分析流程
library(minfi)
library(ChAMP)
library(glmnet)
library(survival)

# 1. 读取和质控450K芯片数据
# 读取IDAT文件
rgSet <- read.metharray.exp(base = "idat_dir/")
sample_names <- sampleNames(rgSet)

# 质量控制
qc <- getQC(rgSet)
plotQC(qc)

# 检测p值过滤
detP <- detectionP(rgSet)
keep <- colMeans(detP) < 0.01
rgSet <- rgSet[, keep]

# 2. 归一化 (Functional Normalization)
mSet <- preprocessFunnorm(rgSet)
beta_matrix <- getBeta(mSet)

# 去除低质量探针
# (性染色体探针、SNP探针、交叉反应探针等)
annotation <- getAnnotation(mSet)
keep_probes <- !(annotation$chr %in% c("chrX", "chrY")) &
               !grepl("rs", annotation$Name)
beta_matrix <- beta_matrix[keep_probes, ]

# 3. 弹性网络回归筛选年龄相关CpG位点
age <- pheno_data$age

# 标准化beta值
beta_t <- t(beta_matrix)
beta_t[is.na(beta_t)] <- 0

# 弹性网络回归 (alpha = 0.5为弹性网络)
cv_fit <- cv.glmnet(beta_t, age, alpha = 0.5, nfolds = 10)
best_lambda <- cv_fit$lambda.min
cat(sprintf("最优lambda: %.4f\n", best_lambda))

# 提取非零系数的CpG位点
coef <- coef(cv_fit, s = "lambda.min")
selected_cpgs <- rownames(coef)[which(coef != 0)][-1]
cat(sprintf("选中的CpG位点数: %d\n", length(selected_cpgs)))

# 4. 计算表观遗传年龄
weights <- coef[selected_cpgs, ]
intercept <- coef[1, ]
pred_age <- beta_t[, selected_cpgs] %*% weights + intercept

# 5. 计算AgeAccel (残差法)
lm_fit <- lm(pred_age ~ age)
age_accel <- residuals(lm_fit)
cat(sprintf("AgeAccel范围: %.2f 到 %.2f\n",
            min(age_accel), max(age_accel)))
```

```r
# 6. 生活方式与AgeAccel关联分析
lifestyle_data <- data.frame(
    age_accel = as.numeric(age_accel),
    exercise = factor(c(rep("high", 50), rep("low", 50))),
    smoking = factor(c(rep("smoker", 30), rep("non-smoker", 70))),
    sex = factor(c(rep("M", 45), rep("F", 55))),
    age = age
)

# 线性回归: 运动与AgeAccel
fit_exercise <- lm(age_accel ~ exercise + age + sex, data = lifestyle_data)
summary(fit_exercise)

# 线性回归: 吸烟与AgeAccel
fit_smoking <- lm(age_accel ~ smoking + age + sex, data = lifestyle_data)
summary(fit_smoking)

# 7. 外部验证
# 在验证集上计算表观遗传年龄
# val_beta: 验证集的beta值矩阵
# val_age: 验证集的实际年龄
val_pred_age <- val_beta_t[, selected_cpgs] %*% weights + intercept
cor_val <- cor(val_pred_age, val_age)
mad_val <- median(abs(val_pred_age - val_age))
cat(sprintf("验证集: R² = %.3f, MAD = %.1f年\n", cor_val^2, mad_val))
```

表观遗传时钟提供了一个整合性的分子指标，综合数百个CpG位点的甲基化信息，可以更敏感地检测衰老速度的变化。当评估一种新的抗衰老干预（如热量限制、运动处方或药物干预）时，表观遗传时钟可以在相对较短的时间内（数月到数年）检测到AgeAccel的变化，而不需要等待数十年才能观察到临床终点的差异。这种快速评估的能力大大加速了抗衰老研究的进展，目前多项临床试验正在使用表观遗传时钟作为主要终点来评估候选抗衰老药物的效果。

---

::: note 本节来源
本节内容由原 reStructuredText 文件迁移而来。如需查看原始 Sphinx 版本，请参考项目源码中的 .rst 文件。
:::

## 练习题

### 第1题 概念理解

某研究者进行 ATAC-seq 分析后发现，调用出的峰值顶点（summit）相对于已知的转录因子结合位点系统性偏移约 10bp。研究者未执行 Tn5 偏移校正。解释偏移产生的原因，并说明 +4/-5 校正的具体含义。

::: details 参考答案
Tn5 转座酶以同源二聚体形式结合 DNA，两个单体分别在复合物的两侧切割 DNA，切割位点之间相距 9bp。Tn5 复合物的中心位于两个切割位点的中间，而测序读段的起始位置对应切割位点。因此正链读段的起始位置比 Tn5 结合中心偏移 +4bp（向 3' 端），负链读段的起始位置偏移 -5bp（向 5' 端）。未经校正时，正链 reads 堆积在 Tn5 结合位点下游 4bp 处，负链 reads 堆积在上游 5bp 处，峰顶点偏离真实 Tn5 插入位置约 9bp。校正方法是将正链 reads 起始位置减 4bp，负链 reads 起始位置加 5bp，使两类 reads 对齐到 Tn5 结合中心。该校正对足迹分析（如 TOBIAS）尤其关键，因为足迹的精度要求在数个碱基以内。
:::

### 第2题 参数分析

某研究者对 H3K27me3 ChIP-seq 数据使用 MACS2 默认参数（窄峰模式）调用峰值，结果峰片段化，遗漏了大范围已知 H3K27me3 区域。解释窄峰模式不适合 H3K27me3 的原因，并说明应使用何种参数或工具。

::: details 参考答案
H3K27me3 是一种宽域分布的组蛋白修饰，覆盖数十 kb 到数百 kb 的基因组区域，由 PRC2 复合物催化沉积。MACS2 默认窄峰模式假设峰值集中、尖锐（如转录因子结合位点），通过局部泊松模型检测富集峰，对宽域修饰会将其切分为多个不连续的小峰，丢失大范围的低水平富集信号。H3K27me3 应使用 MACS2 的宽峰模式：`macs2 callpeak --broad --broad-cutoff 0.1`，该模式使用更大的窗口平滑信号，输出宽域峰区域。更专业的替代工具是 SICER，它通过空间聚类识别富集区域，利用间隙大小参数允许中间有低信号区域但整体富集的大区域被合并为一个峰，对 H3K27me3 等宽域修饰灵敏度更高。H3K9me3 同样需要宽峰模式或 SICER。H3K4me3 和 H3K27ac 等窄域修饰使用默认窄峰模式即可。
:::

### 第3题 概念理解

某研究者使用 beta 值直接进行 t 检验筛选差异甲基化位点，发现在甲基化水平接近 0 或 1 的 CpG 位点出现大量假阳性。解释 beta 值不适合统计检验的原因，并说明 M 值的优势。

::: details 参考答案
beta 值取值范围被限制在 [0, 1] 区间，在接近边界（0 或 1）时方差被压缩，呈现严重的异方差性。t 检验假设数据服从正态分布且方差齐性，beta 值在这两个假设上都不满足：分布高度偏态（特别是接近 0 或 1 时），且不同甲基化水平的方差差异很大。高甲基化或低甲基化位点的方差被人为压缩后，少量计数变化即可产生极小的 p 值，造成假阳性。M 值定义为 $M = log2(\beta / (1 - \beta))$，将 [0, 1] 区间映射到实数域，近似服从正态分布，方差在不同甲基化水平间更均匀，满足 t 检验和线性模型的基本假设。差异甲基化分析应使用 M 值进行统计检验，结果展示时再转换为 beta 值便于生物学解释。DSS 和 methylKit 等工具内部使用 beta-binomial 模型，直接建模甲基化和非甲基化计数，避免了 beta 值的统计问题。
:::

## 常见错误

**错误 1 · ATAC-seq 峰值信号弱，FRiP 低于 0.01，TSS 富集分数低**

原因：未去除线粒体 reads。线粒体基因组无核小体包裹，Tn5 转座酶可自由切割，导致线粒体 reads 占总 reads 的 30-50%。这些 reads 不提供核基因组开放性信息，却占用大量测序深度，稀释了核基因组信号。线粒体 reads 过多还会干扰峰值调用，使核基因组区域的覆盖度人为降低。

解决：比对后用 `samtools idxstats` 检查 chrM reads 比例。去除线粒体 reads：`samtools view -b -h sample.bam $(samtools idxstats sample.bam | cut -f 1 | grep -v chrM) > sample.noMT.bam`。去除后再进行去重和峰值调用。线粒体 reads 比例超过 30% 时还应检查细胞制备质量，细胞膜破损会释放线粒体 DNA。对于特殊样本（如心肌细胞），可考虑使用 OMNI-ATAC 协议降低线粒体污染。

**错误 2 · ChIP-seq 峰值调用出现大量基因间区假阳性峰，富集区域集中在开放染色质**

原因：缺少 Input DNA 对照。MACS2 在无对照时使用泊松分布估计背景，假设基因组各区域背景均匀。实际背景受 mappability、GC 含量、开放染色质等因素影响存在系统偏差，开放染色质区域天然富集更多 reads，被误判为富集峰。无对照的 ChIP-seq 在基因密集区和启动子区域产生大量假阳性。

解决：每个 ChIP-seq 实验都应包含 Input DNA 对照（交联但不免疫沉淀的 DNA）。MACS2 调用峰值时用 `-c input.bam` 指定对照，工具会构建背景模型并扣除系统性偏差。无 Input 时可用 IgG 对照作为替代，但效果不如 Input。ENCODE 标准要求 ChIP-seq 必须有 Input 或 IgG 对照。已经无对照的数据可用 blacklist 区域过滤已知的假阳性区域（ENCODE blacklist），但无法完全弥补对照缺失的影响。

**错误 3 · 重亚硫酸盐测序比对率极低（低于 10%），大量 reads 未比对**

原因：使用常规比对工具（BWA-MEM、Bowtie2）比对重亚硫酸盐处理后的 reads。重亚硫酸盐将未甲基化的 C 转化为 T，reads 与参考基因组之间存在大量 C-T 不匹配，常规比对工具的容错策略无法处理这种系统性转换，大部分 reads 因 mismatches 过多而无法比对。

解决：使用专门的重亚硫酸盐比对工具。Bismark 将参考基因组和 reads 分别进行 C-to-T 和 G-to-A 转换后在转换后的空间比对，正确处理 C-T 转换。BWA-meth 是 BWA-MEM 的重亚硫酸盐适配版本，命令行接口与 BWA-MEM 类似，运行速度较快。BSMAP 使用容错匹配策略处理转换。比对前确认参考基因组版本一致，Bismark 需要先用 `bismark_genome_preparation` 构建重亚硫酸盐索引。比对后用 `bismark_methylation_extractor` 提取每个 CpG 位点的甲基化和非甲基化计数。

**错误 4 · Hi-C 接触矩阵 TAD 边界不稳定，样本间比较出现大量虚假差异**

原因：使用未归一化的原始接触矩阵进行下游分析。原始矩阵受 mappability（重复区域 reads 少）、GC 含量（PCR 扩增偏倚）、限制酶切位点分布不均、测序深度差异等系统性偏差影响，这些技术噪音掩盖了真实的生物学差异。直接比较两个样本的原始矩阵会在偏差区域产生虚假的差异信号。

解决：对接触矩阵进行归一化处理。ICE（Iterative Correction and Eigenvector）归一化假设每个 bin 的总互作数应该相等，通过迭代除以行和列的边际消除系统偏差。KR（Knight-Ruiz）归一化是另一种平衡方法，收敛更快。HiC-Pro 和 Juicer 流程默认输出归一化后的矩阵。比较不同样本时，确保使用相同 bin 大小和相同的归一化方法。下游分析（TAD 调用、loop 检测、compartment 识别）应在归一化矩阵上进行。TAD 调用工具（如 HiCExplorer、cooler）通常内置归一化步骤，但仍需检查输入矩阵质量。
