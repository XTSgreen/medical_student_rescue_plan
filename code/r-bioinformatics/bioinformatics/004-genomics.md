---
title: 2.4 基因组学分析
sidebar:
  order: 4
---

# 2.4 基因组学分析

基因组学分析涵盖从测序数据获取到基因组解读的完整流程，包括测序、质控、比对、组装、注释、变异检测和比较分析等环节。本章按数据处理顺序介绍核心概念和工具，并以 R/Bioconductor 代码示例关键步骤。基因组学数据量大、流程长、工具多，理解每一步背后的原理比记忆命令更重要，因为不同实验设计、不同物种、不同质量的数据需要不同的处理策略。

## 2.4.1 高通量测序技术

测序技术是基因组学的数据基础。不同平台在读长、通量、错误率上各有取舍，选择平台是实验设计的第一步。平台选错会导致后续分析无法弥补的问题，例如用短读长数据检测大尺度结构变异、用低准确率数据做变异检测都会产生大量假阴性或假阳性。

### 测序平台概览

测序技术从第一代 Sanger 测序发展至今，已经历三代。第一代测序以双脱氧链终止法为代表，每次反应只能读取有限长度的序列，但准确率极高。第二代测序（Next-Generation Sequencing，NGS）通过大规模并行化大幅提高了通量，使单碱基成本下降数个数量级，但读长较短。第三代测序（单分子测序）直接观察单条 DNA 分子的合成或通过过程，读长大幅延长，但单位成本和准确率与二代测序各有取舍。

**Sanger 测序**使用双脱氧链终止法。其化学原理是将待测 DNA 作为模板，在 DNA 聚合酶作用下加入引物延伸，反应体系中除正常的脱氧核苷三磷酸（dNTP）外，还按一定比例掺入带有荧光标记的双脱氧核苷三磷酸（ddNTP）。ddNTP 在 3' 位缺少羟基，一旦掺入就使链延伸终止。反应结束后形成一系列长度相差一个碱基的末端标记产物，通过毛细管电泳按大小分离，依次读取末端的荧光信号即可得到碱基序列。Sanger 测序读长 700-1000bp，准确率高于 99.9%，至今仍是验证性测序的金标准，例如临床检测特定基因突变时常用 Sanger 验证 NGS 发现的变异。

**Illumina 测序**采用桥式 PCR 扩增和边合成边测序（Sequencing by Synthesis，SBS）策略。文库构建时在 DNA 片段两端连接接头，接头与流动池（flow cell）表面固定的寡核苷酸互补。片段杂交到表面后，聚合酶延伸形成第一条互补链，变性后模板脱离，新合成的链通过接头与表面另一组寡核苷酸杂交形成桥状结构，再经过聚合酶延伸完成桥式扩增。多轮循环后每个原始片段在同一位置形成数千条相同的簇（cluster）。测序时依次加入四种带有可逆终止子和不同荧光基团的 dNTP，每次只掺入一个碱基，成像后切除终止子和荧光基团，进入下一轮掺入。由于每轮反应都同步进行且反应时间可控，Illumina 测序的碱基质量随读长衰减较慢，错误率集中在 substitutions 而非 indels。Illumina 读长 75-300bp，通量极高，单碱基成本最低，是大群体重测序的首选。

::: tip Illumina 错误模式
Illumina 平台的主要错误类型是 substitution，indel 错误率很低，这一特性对后续变异检测算法设计影响很大。 substitutions 错误中又存在偏向性，例如某些循环位置 G→A 替换频率较高，这与试剂降解和荧光串扰有关。BQSR（碱基质量分数重校准）正是利用已知变异位点之外的观测错误率，对机器报告的碱基质量分数进行系统性修正。
:::

**PacBio SMRT**（Single Molecule Real-Time）测序直接观察单分子合成过程。其核心组件是零模波导孔（Zero-Mode Waveguide，ZMW），一种纳米级金属小孔，由于孔径远小于检测激光波长，激光只能照亮孔底部极小区域，从而将背景荧光降到极低。每个 ZMW 中固定一条 DNA 聚合酶，当带有不同荧光磷酸基团的 dNTP 进入活性位点时被激发出荧光，掺入后磷酸基团被切除，荧光信号随之消失。聚合酶持续工作即可实时读取整条链的合成。SMRT 读长极长，平均 10-25kb，最长可达 60kb 以上，但单次通过的错误率约 10-15%，主要表现为随机 indel。通过对同一条模板分子进行多次环形测序（Circular Consensus Sequencing，CCS），可以将错误率压低到 Q30 以上，这就是 HiFi 模式。HiFi 读长兼顾长读长和高准确率，适合高质量组装、复杂区域变异检测和全长转录组测序。

**Oxford Nanopore**（ONT）通过蛋白质纳米孔检测 DNA 通过时的电流变化。将纳米孔蛋白嵌入人工合成膜，两侧加电压后离子通过孔道形成稳定电流。DNA 在 motor 蛋白牵引下解链并单链穿过纳米孔，不同碱基组合占据孔道时对离子流的阻碍不同，产生特征性的电流变化信号，通过深度学习模型解码为碱基序列。ONT 读长可达 2Mb 以上，原则上只受 DNA 提取质量限制；设备便携，MinION 仅 U 盘大小，适合现场快速检测，例如疫情暴发期间的实时测序。R10.4.1 等新化学的单链准确率已接近 Q20，但 indel 错误率仍高于 Illumina 和 HiFi，特别是在同聚物区域。

| 平台 | 读长 | 准确率 | 通量 | 主要用途 |
|------|------|--------|------|----------|
| Sanger | 700-1000bp | >99.9% | 低 | 验证测序 |
| Illumina | 75-300bp | >99% | 极高 | 群体重测序 |
| PacBio HiFi | 10-25kb | >99.9% | 中等 | 基因组组装 |
| ONT | 10kb-2Mb+ | Q20+ | 中等 | 现场检测、超长读长 |

::: warning 平台选择不是单选题
复杂项目常需要多平台联合。例如人类基因组高质量组装通常采用 PacBio HiFi 产生连续 contig，再用 ONT 超长读段跨越大尺度重复，辅以 Hi-C 数据挂载到染色体级别。临床病原体监测中，Illumina 提供高准确率变异检测，ONT 提供现场快速响应。理解每种技术的化学原理和错误模式，才能根据研究问题做出合理选择。
:::

### 测序模式与深度

Illumina 文库构建时将 DNA 片段化到固定大小（通常 300-500bp），两端连接接头后测序。**双端测序**（Paired-end sequencing）从同一 DNA 片段两端分别测序，向中间延伸。两条读段之间是一段未测的插入片段，其长度分布是后续比对和结构变异检测的重要参数。配对读段的位置关系可以提高比对准确性并检测结构变异，例如插入片段长度异常提示缺失或插入，方向异常提示倒位或易位。**单端测序**（Single-end sequencing）只从一端测序，成本较低，适用于小 RNA 测序、ChIP-seq 等读长需求短的场合。

**测序深度**（Sequencing depth / coverage）指每个碱基平均被覆盖的次数，30X 表示每碱基平均覆盖 30 次。Lander-Waterman 理论基于泊松分布描述覆盖度与深度的关系：某个碱基至少被覆盖一次的概率为 1 − e<sup>−c</sup>，其中 c 为测序深度。30X 测序下理论覆盖度约为 99.9985%，但实际受 GC 偏性、PCR 扩增偏性、比对偏性等因素影响，部分区域可能完全没有覆盖，这就是常说的覆盖盲区。

不同应用场景对测序深度的要求差异显著。人类 WGS 通常需要 30X 以上，外显子组需要 50-100X（捕获效率低、目标区域小，需要更高深度补偿），体细胞突变检测（特别是肿瘤异质性样本）可能需要数百 X。低频变异检测时，深度直接决定检出下限：1000X 深度下理论上可以检出 1% 频率的变异，但需要考虑测序错误率和比对错误。

**Linked reads**（如 10x Genomics Chromium）通过微流控将长 DNA 分子（数十 kb）分离到油包水乳液中，每条分子加上相同 barcode 后再片段化测序。原始读段仍是短读长，但同一 barcode 的读段来自同一长 DNA 分子，可以借助 barcode 信息进行相位推断和结构变异检测。Linked reads 已被长读长测序逐步取代，但在已存档数据中仍有应用价值。

```python
import math

genome_size = 3_000_000_000
read_length = 150
total_reads = 600_000_000

depth = (total_reads * read_length) / genome_size
coverage_prob = 1 - math.exp(-depth)
print(f"测序深度: {depth:.1f}X")
print(f"理论覆盖度: {coverage_prob*100:.2f}%")
```

实际项目中还需要计算**有效深度**，即去除 PCR 重复后真正独立的覆盖次数。如果 PCR 重复率高达 30%，名义 30X 数据的有效深度可能只有 21X，这对变异检测的可靠性影响很大，需要在质控阶段重点关注。

### 质量控制指标

**Phred 质量分数**（Q）表示碱基识别的可靠程度，定义式为 Q = −10log<sub>10</sub>(P)，其中 P 是碱基识别错误的概率。Q20 对应 1% 错误率，Q30 对应 0.1% 错误率，Q40 对应 0.01% 错误率。Illumina 平台通常要求 Q30 比例达到 75% 以上，人类重测序数据 Q30 比例通常在 85% 以上。FASTQ 文件中每个碱基的质量分数用 ASCII 字符编码，通常范围从 '!' (Q0) 到 '~' (Q62)，不同平台偏移量不同（Phred+33 或 Phred+64）。

```python
def phred_to_error_prob(q):
    return 10 ** (-q / 10)

for q in [10, 20, 30, 40]:
    p = phred_to_error_prob(q)
    print(f"Q{q}: 错误率 {p*100:.2f}%, 准确率 {(1-p)*100:.2f}%")
```

除单碱基质量外，读段级别的质量也重要。MAPQ（Mapping Quality）表示比对位置的可靠程度，60 表示该读段比对到唯一位置的概率很高，0 表示该读段可比对到多个位置。在变异检测中，低 MAPQ 读段通常被过滤掉。

::: note 质量分数的局限
Phred 分数是测序仪根据图像信号质量估算的，与真实错误率之间存在系统偏差。同一种碱基在特定循环位置可能系统性地高估或低估质量，这种偏差可以通过 BQSR 修正。BQSR 利用已知变异位点之外的 **应该与参考一致** 的位置统计观察错误率，重新计算碱基质量分数，对 GATK 流程的变异检测准确率提升明显。
:::

## 2.4.2 测序数据预处理

原始测序数据包含接头序列、低质量碱基和 PCR 重复等技术噪音，预处理的目标是在保留真实信号的前提下去除噪音。预处理质量直接影响所有下游分析，**垃圾进、垃圾出**在基因组学中尤其明显。一份典型的人类 WGS 数据从原始 FASTQ 到最终 VCF，需要经过 5-8 个预处理步骤，每一步都涉及参数权衡。

### 质量评估

测序数据以 **FASTQ** 格式存储，每条读段由四行组成：第一行以 @ 开头是读段标识符，包含测序仪、流动池坐标等信息；第二行是碱基序列，使用 A/T/G/C/N 表示；第三行以 + 开头是分隔行；第四行是质量分数，每个字符对应第二行一个碱基，ASCII 编码减去偏移量得到 Phred 质量分数。FASTQ 是后续所有分析的输入，理解其格式对排查数据问题很重要。

**FastQC** 对 FASTQ 文件进行全面的质控分析，输出多个模块的报告。主要模块包括：Basic Statistics（基本统计）、Per base sequence quality（每位置质量分布）、Per tile sequence quality（流通池每 tile 质量，用于发现流通池缺陷）、Per sequence quality scores（每读段平均质量分布）、Per base sequence content（每位置碱基组成，正常随机文库应在中间区域 A/T/G/C 各占 25%）、Per sequence GC content（GC 分布）、Per base N content（N 含量）、Sequence Length Distribution（读长分布）、Sequence Duplication Levels（重复水平）、Overrepresented sequences（过度代表序列，可能是接头污染）、Adapter Content（接头含量）。

FastQC 报告中的警告需要结合实验设计解读。例如 RNA-seq 数据在 Read 1 起始位置常出现碱基组成偏倚，这是随机引物逆转录造成的，并非质量问题；ChIP-seq 数据的 GC 偏性可能反映免疫沉淀富集模式。Per base sequence content 模块在前 12 个碱基出现明显波动是 Illumina 文库随机引物引入的固定偏倚，称为 6-mer 偏倚，不影响后续分析。**MultiQC** 可以将多个 FastQC 报告汇总为综合报告，方便大样本量项目的整体把控，能够快速识别离群样本。

```bash
# FastQC 质量评估
fastqc -t 8 -o qc_reports/ sample_R1.fastq.gz sample_R2.fastq.gz
# MultiQC 汇总
multiqc -o multiqc_report/ qc_reports/
```

::: tip 文库类型与质控解读
不同文库类型的 FastQC 报告特征差异很大。双端 DNA 文库应有均衡的 GC 分布和较低的重复水平；RNA-seq 文库的 GC 分布反映转录本 GC 含量，重复水平可能较高（高表达基因贡献大量读段）；ChIP-seq 文库的重复水平受免疫沉淀效率影响；ATAC-seq 文库的插入片段大小分布应显示核小体周期性。解读质控报告时需要先理解文库构建原理。
:::

### 质量修剪与接头去除

**Trimmomatic** 支持滑动窗口质量修剪、接头去除和短读段过滤。常用参数包括 ILLUMINACLIP（接头识别）、SLIDINGWINDOW（窗口质量修剪）、LEADING/TRAILING（首尾低质量碱基切除）、MINLEN（最小读长）。Trimmomatic 用 Java 实现，速度较慢，但参数丰富、稳定可靠，仍是许多流程的标准组件。

**fastp** 集成了多种质控功能，速度比 Trimmomatic 快数倍，是大样本量时的优选。fastp 用 C++ 实现，单线程即可达到 Trimmomatic 多线程的速度，同时支持自动接头检测（对未知接头序列尤其有用）、polyG/polyX 尾部修剪、重叠对配对分析、UMI 处理等功能。fastp 还内置了质控报告，可以替代 FastQC+Trimmomatic 两步流程。

```bash
# Trimmomatic 双端质控
trimmomatic PE -threads 8 \
    sample_R1.fastq.gz sample_R2.fastq.gz \
    R1_paired.fq.gz R1_unpaired.fq.gz \
    R2_paired.fq.gz R2_unpaired.fq.gz \
    ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 \
    SLIDINGWINDOW:4:20 LEADING:20 TRAILING:20 MINLEN:50

# fastp 一键质控
fastp -i sample_R1.fastq.gz -I sample_R2.fastq.gz \
    -o clean_R1.fq.gz -O clean_R2.fq.gz \
    --detect_adapter_for_pe --cut_front --cut_tail \
    --length_required 50 --thread 8
```

::: warning 修剪要适度
过度修剪会丢失真实信号。MINLEN 设过大会丢弃大量读段降低有效深度，质量阈值设过高会人为切除真实变异位点附近的低质量区。一般 Q20 作为阈值已经足够严格，不建议使用 Q30。双端数据修剪后会出现 unpaired 读段，对于变异检测应只使用 paired 部分以保证片段信息完整。
:::

### 去除 PCR 重复

文库构建时需要通过 PCR 扩增获得足够上样量。PCR 扩增过程中，同一原始 DNA 片段可能被扩增多次，这些扩增产物最终测序会产生相同起始位置的读段，称为 PCR 重复。PCR 重复会造成等位基因频率偏差：如果某个等位基因的 PCR 扩增效率高于另一个，会人为提高其频率，干扰等位基因特异性表达和体细胞低频变异检测。

**Picard MarkDuplicates** 通过比对位置识别 PCR 重复。对于双端读段，使用 5' 位置和方向作为指纹，相同指纹的读段视为同一原始片段的 PCR 产物，保留每组中质量最高的一条。需要强调，MarkDuplicates 只能识别 PCR 重复，无法识别来自不同原始片段但起始位置恰好相同的真实读段。在高覆盖度区域这种"光学重复"或"位置重复"很常见，需要借助 UMIs（Unique Molecular Identifiers）才能准确区分。

UMI 是在文库构建时为每条原始片段加上一段随机条码（通常 8-12bp），相同 UMI 的读段确认为来自同一原始分子。UMI 工具（如 fgbio、umi_tools）根据 UMI 进行去重，可以准确去除 PCR 重复同时保留真实独立片段，是低频变异检测的标准做法。

```bash
# Picard 去重
picard MarkDuplicates I=aligned_sorted.bam O=dedup.bam \
    M=metrics.txt REMOVE_DUPLICATES=true
# samtools 去重（更快）
samtools markdup -r aligned_sorted.bam dedup.bam
```

RNA-seq 数据中高表达基因天然产生大量相同读段（同一转录本被多次随机片段化），这些读段虽然起始位置相同但来自不同的原始分子，属于真实信号，因此 RNA-seq 通常不去重。如需去重，应使用 UMI 标记的文库。

### 污染检测

样本污染在基因组学项目中很常见，例如人类样本中混入微生物 DNA、细胞系交叉污染、参考基因组选择错误等。**Kraken2** 基于 k-mer 精确匹配将读段分类到物种，使用压缩的数据结构存储所有参考基因组 k-mer，分类速度快但内存占用大（标准数据库 16GB+）。Kraken2 不会估计 k-mer 的进化距离，对未在数据库中的物种会做最近邻分类，可能产生假阳性，建议配合 Bracken 进行丰度估计。

**FastQ_Screen** 通过比对到多个参考基因组检测污染来源。将一部分读段比对到人、鼠、大肠杆菌等多个参考基因组，统计每个物种的比对比例，可以快速判断样本是否存在跨物种污染。对于人类样本，预期 95% 以上读段比对到人类基因组，如果鼠基因组比对比例超过 5%，提示存在鼠细胞污染或人鼠杂交细胞系。

```bash
kraken2 --db kraken2_db --paired R1.fq.gz R2.fq.gz \
    --report kraken_report.txt --output kraken_output.txt
```

::: tip 性别与污染检查
比对后通过性染色体读段比例可以快速核查样本性别。男性样本 X:Y 读段比例约 1:1，女性样本几乎无 Y 染色体读段。如果样本性别与记录不符，提示样本混淆，应立即排查。这种简单检查能避免后续大规模分析的浪费。
:::

## 2.4.3 序列比对

将读段比对到参考基因组是确定每条读段来源位置的基础步骤，比对质量直接影响后续变异检测。比对看似简单，实际面临多个挑战：人类基因组有 30 亿碱基，每次搜索都涉及大规模索引；基因组存在大量重复序列，部分读段无法唯一比对；读段中存在测序错误和真实变异，需要容错比对；Indel 会导致读段与参考错位，需要 gap 比对。

### 参考基因组准备

比对前需要准备参考基因组并建立索引。参考基因组通常以 **FASTA** 格式存储，每条染色体一个条目，每条序列前有以 > 开头的标识行。GRCh38（Genome Reference Consortium Human Build 38）是人类基因组最新主流参考，T2T-CHM13 是首个完整无 gap 的人类参考。选择参考基因组时应考虑版本、补丁（如 GRCh38.p14）和替代位点表示方式（ALT contig）。

参考基因组索引分为两类。**FASTA 索引**（.fai 文件）记录每条染色体的长度和偏移量，支持按位置快速访问，由 `samtools faidx` 生成。**比对工具特有索引**为该工具的搜索算法优化，例如 BWA 的 .bwt/.pac/.amb/.ann/.sa 索引、Bowtie2 的 .bt2/.ebwt 索引、minimap2 的 .mmi 索引。

```bash
# 创建 FASTA 索引
samtools faidx reference.fasta
# 创建 BWA 索引
bwa index reference.fasta
# 创建 minimap2 索引
minimap2 -d reference.mmi reference.fasta
```

参考基因组的 ALT contig 是 GRCh38 引入的特性，表示已知的多态性区域（如 MHC、KIR）的替代序列。ALT contig 会增加比对歧义，GATK Best Practices 推荐使用 ALT-aware 索引（`bwa index -a bwtsw`）并配合 ALT liftover 文件处理。简化方案是直接使用 GRCh38 的 primary assembly（去除 ALT 和 decoy contig）。

### 比对算法基础

短读长比对的核心问题是：给定一条 150bp 的读段和 3Gb 的参考基因组，快速找到读段可能来源的所有位置，并对每个候选位置评估比对质量。直接动态规划比对（Smith-Waterman）复杂度为 O(mn)，对全基因组搜索完全不现实。

**Burrows-Wheeler 变换**（BWT）和 **FM-index** 是现代短读长比对算法的核心数据结构，可以使人类基因组的索引压缩到约 3GB 内存，同时支持快速模式匹配。

BWT 是一种字符串变换，通过对原始字符串的所有循环移位排序后取最后一列。具体过程：在参考基因组末尾添加哨兵字符 `$`（字典序最小），生成所有循环移位，按字典序排序形成旋转矩阵，BWT 字符串就是矩阵的最后一列。BWT 的关键性质是：相似上下文的字符会被聚集在一起，使得 BWT 字符串容易出现长游程（runs），适合压缩。

**FM-index**（Full-text index in Minute space）基于 BWT 构建，包含三个核心组件：BWT 字符串本身（压缩存储）、C 数组（每个字符在排序矩阵第一列中首次出现的位置）、Occ 数组（在 BWT 中每个位置之前各字符的累计出现次数）。利用这三个组件可以实现 backward search：从模式串末尾开始，依次在 BWT 中向前搜索每个字符，每一步通过 C 数组和 Occ 数组计算当前匹配区间的范围。

backward search 的过程可以这样理解：维护一个区间 [top, bottom]，初始覆盖整个 BWT。每次迭代处理模式串的一个字符（从后向前），通过 C 数组和 Occ 数组将区间缩小到只包含以该字符结尾的子串。最终区间的大小就是模式串在参考中的出现次数，通过 LF-mapping 可以回溯到具体位置。

FM-index 的优势在于空间效率：人类基因组的 FM-index 仅需约 3GB 内存，相比 suffix tree 的数十 GB 大幅降低。这正是 BWA、Bowtie 等工具能在普通服务器上比对人类基因组的关键。

**种子扩展策略**（Seed-and-extend）将比对分为两步。第一步用 k-mer 在 FM-index 中快速定位候选位置，要求精确或近似匹配作为种子；第二步对每个候选位置用动态规划（Smith-Waterman 或其变体）进行精细比对，允许 gap 和错配，选择得分最高的位置作为最终比对。BWA-MEM 自适应选择种子长度，对长读段使用更长种子减少假阳性候选。

::: tip FM-index 查找示例
假设参考为 "banana$"，BWT 为 "annb$aa"，模式串 "ana" 的 backward search 过程：从空区间开始，处理 'a' 得到区间 [2,5]，处理 'n' 得到 [3,4]，处理 'a' 得到 [2,3]，最终区间大小 2，表示 "ana" 在 "banana" 中出现 2 次。这种查找的时间复杂度仅与模式串长度有关，与参考长度无关。
:::

### 短读长比对工具

**BWA-MEM** 基于 BWT/FM-index 实现种子扩展比对，对 70bp-1Mbp 读长都有良好表现，是 DNA 重测序的标准工具。MEM（Maximal Exact Match）指读段中无法再向两端扩展的精确匹配段。BWA-MEM 首先在 FM-index 中查找所有 MEM，对每个 MEM 进行种子扩展，最终通过 Smith-Waterman 精细比对选择最优位置。BWA-MEM 还会自动处理嵌合读段（chimeric reads），将一条读段拆分比对到多个位置，这对结构变异检测很重要。

**Bowtie2** 提供灵敏度与速度的灵活调节。`--very-fast` 模式速度快但灵敏度低，适合大批量参考比对；`--very-sensitive` 模式速度慢但能找到更多比对，适合远缘参考或异源比对。Bowtie2 使用 FM-index 但与 BWA-MEM 的种子策略不同，采用多种子（multiseed）策略，将读段切分为多个种子分别定位。

**STAR** 和 **HISAT2** 是 RNA-seq 的剪接感知比对工具，能识别跨越外显子-内含子边界的读段。RNA 经过剪接后外显子拼接在一起，但参考基因组中两个外显子之间隔着内含子，普通比对工具会将跨越剪接位点的读段视为含大 gap 而无法比对或比对错误。STAR 预先构建剪接点索引，通过未剪接的种子定位读段，再延伸跨越剪接点；HISAT2 使用层次化 FM-index，将基因组按已知剪接点和 SNP 分片，实现快速的剪接感知比对。STAR 速度快、内存占用大（人类基因组约 30GB），HISAT2 内存占用小（约 8GB）但速度稍慢。

```bash
# BWA-MEM 比对
bwa index reference.fasta
bwa mem -t 16 -M reference.fasta clean_R1.fq.gz clean_R2.fq.gz | \
    samtools view -bS - > aligned.bam

# Bowtie2 比对
bowtie2-build reference.fasta ref_index
bowtie2 -x ref_index -1 clean_R1.fq.gz -2 clean_R2.fq.gz \
    --threads 16 -S aligned.sam
```

::: warning BWA-MEM 的 -M 参数
`-M` 参数将较短的分段比对标记为次级比对（supplementary 而非 primary），主要为了兼容 Picard MarkDuplicates。新版 Picard 已支持 chimeric 比对，但 `-M` 仍是 GATK Best Practices 的推荐参数。
:::

### 长读长比对

短读长比对工具依赖 FM-index 精确种子，对错误率较高的长读长（PacBio CLR 错误率 10-15%，ONT 早期化学错误率 5-15%）效果不佳。**Minimap2** 使用 minimizer 索引，快速将 PacBio 和 Nanopore 读段比对到参考基因组，同时支持剪接感知模式。

minimizer 是这样定义的：在一段序列上滑动窗口，每个窗口内所有 k-mer 中字典序最小的（或哈希值最小的）作为 minimizer。这样从长读段中提取稀疏但具有代表性的种子，既能减少索引规模又能保持比对速度。Minimap2 在窗口大小、k-mer 大小、minimizer 数量上做了大量优化，对长读长比对的速度远超传统方法。

**NGMLR** 专为长读长结构变异检测设计，使用凹形 gap 罚分（concave gap penalty）模拟长读长中长 indel 的常见模式，对 SV 断点定位更准确。

```bash
# PacBio 比对
minimap2 -ax map-pb -t 16 reference.fasta pacbio_reads.fasta | \
    samtools sort -o aligned_pb.bam
# Nanopore 比对
minimap2 -ax map-ont -t 16 reference.fasta ont_reads.fasta | \
    samtools sort -o aligned_ont.bam
```

### 比对后处理

原始 SAM 文件需要排序、索引和统计。**samtools** 是核心工具集，flagstat 快速汇总比对情况，stats 生成详细统计报告。排序通常按参考基因组坐标排序（coordinate-sorted），方便后续去重、BQSR、变异检测等步骤；按读段名排序（queryname-sorted）的特殊用途是配合某些去重工具。

```bash
samtools sort -@ 16 -o aligned_sorted.bam aligned.bam
samtools index aligned_sorted.bam
samtools flagstat aligned_sorted.bam
samtools stats aligned_sorted.bam > stats.txt
```

flagstat 输出的关键指标包括：total（总读段）、mapped（已比对）、properly paired（正确配对）、duplicated（标记为重复）、singletons（单端比对）、mapped with mate on different chromosome（配对读段比对到不同染色体）。一个高质量人类 WGS 样本通常 properly paired 比例 >95%，duplicated <20%。

### 比对结果过滤

低质量比对会干扰变异检测。常见过滤包括去除未比对读段（flag 4）、低 MAPQ 比对（MAPQ<20）和次级比对（flag 256）。变异检测流程通常还有更严格的过滤，例如去除配对异常（properly paired 标志缺失）、插入片段大小异常的读段。

samtools view 的 `-F` 参数表示过滤掉匹配 flag 的读段，`-f` 参数表示只保留匹配 flag 的读段。常用 flag 含义：4（unmapped），8（mate unmapped），256（secondary），1024（PCR or optical duplicate），2048（supplementary）。

```bash
samtools view -b -q 20 -F 4 -F 256 aligned_sorted.bam > filtered.bam
```

::: warning 过滤需谨慎
过度过滤会引入偏倚。例如强制要求配对读段都比对会丢失性染色体上的读段（男性 X/Y 染色体无配对）。在变异检测流程中，GATK 推荐保留 MAPQ>=20 的读段并使用 BQSR 校准质量分数，而不是直接硬过滤掉更多读段。
:::

### SAM/BAM 格式

SAM（Sequence Alignment/Map）是文本格式，BAM 是其二进制压缩版本，CRAM 通过参考序列进一步压缩，空间约为 BAM 的 1/2 到 1/3。SAM 文件由头部（@开头）和比对行两部分组成。每行比对包含 11 个必填字段：QNAME（读段名）、FLAG（比对标志）、RNAME（参考名）、POS（比对位置）、MAPQ（比对质量）、CIGAR（比对细节）、RNEXT（配对读段参考）、PNEXT（配对读段位置）、TLEN（片段长度）、SEQ（序列）、QUAL（质量）。

**CIGAR 字符串**描述比对细节，每个操作由长度和类型组成。M 表示匹配/错配（ alignment match），I 表示插入（read 中有而 reference 中无），D 表示缺失（reference 中有而 read 中无），N 表示跳过（如内含子，主要用于 RNA-seq 比对），S 表示软裁剪（read 端部未参与比对但仍在 SEQ 字段中），H 表示硬裁剪（read 端部未参与比对且不在 SEQ 字段中）。例如 CIGAR `50M2I48M` 表示前 50 个碱基匹配，然后 read 中插入 2 个碱基，再匹配 48 个碱基。

FLAG 是按位编码的整数，每一位代表一种状态。例如 99 = 1+2+32+64，表示该读段是配对的（1）、正确配对的（2）、其 mate 是反向互补的（32）、read1（64）。samtools flagstat 通过解析 FLAG 字段汇总各类读段数量。

### R 中操作 BAM 文件

**Rsamtools** 是 Bioconductor 中操作 BAM 文件的核心包，支持按区间查询、按字段过滤，是 R 中处理比对数据的基础。

```r
library(Rsamtools)

# 查看 BAM 文件统计
bam_file <- "aligned_sorted.bam"
bf <- BamFile(bam_file)
seqinfo(bf)

# 读取特定区域的比对
which <- GRanges("chr1", IRanges(10000, 20000))
param <- ScanBamParam(which = which, what = c("qname", "pos", "cigar", "mapq"))
reads <- scanBam(bf, param = param)
head(reads[[1]]$qname)

# 计算覆盖度
cov <- coverage(bf)
mean(cov[["chr1"]])
```

GenomicAlignments 包提供更高级的接口，例如 summarizeOverlaps 用于计数 RNA-seq 读段到基因，readGAlignments 用于读取完整比对对象。

覆盖度分析是评估测序质量的基本操作。**GenomicAlignments::coverage** 计算每个碱基的覆盖深度，可以用于检测覆盖盲区、评估有效深度、识别拷贝数变化。

```r
library(GenomicAlignments)
library(GenomeInfoDb)

# 读取比对对象
ga <- readGAlignments("aligned_sorted.bam", param = ScanBamParam(
    what = c("qname", "mapq", "flag")))

# 查看比对质量分布
hist(mcols(ga)$mapq, breaks = 50, main = "MAPQ 分布",
     xlab = "Mapping Quality", col = "steelblue")

# 按染色体统计读段数
table(seqnames(ga))

# 计算特定区域的覆盖度
target_region <- GRanges("chr1", IRanges(1, 1000000))
cov <- coverage(ga)
mean_cov_chr1 <- mean(cov[["chr1"]][1:1000000])
cat(sprintf("chr1 前 1Mb 平均覆盖度: %.1fX\n", mean_cov_chr1))

# 识别覆盖盲区（覆盖度为 0 的区域）
windows <- tile(target_region, width = 10000)[[1]]
window_cov <- sapply(windows, function(w) {
    mean(cov[["chr1"]][start(w):end(w)])
})
zero_windows <- sum(window_cov == 0)
cat(sprintf("覆盖盲区窗口数: %d / %d\n", zero_windows, length(window_cov)))
```

::: tip 覆盖度评估
临床基因组学对覆盖度要求严格。例如遗传病基因检测时，目标基因的关键外显子需要至少 20X 覆盖才能可靠检测杂合变异。mosdepth、bedtools coverage 等工具可以高效计算区域覆盖度，配合 GenomicRanges 在 R 中分析可以输出可视化和统计报告。
:::

### 比对可视化

**IGV**（Integrative Genomics Viewer）是最常用的本地比对可视化工具，可以加载 BAM 文件查看读段在基因组上的比对情况。在 IGV 中查看变异位点的比对是确认变异真实性的最直接方法。常见判断标准包括：变异读段比例是否符合基因型（例如杂合位点应约 50% 读段支持 alt）、变异是否在两条链上都观察到（链偏倚提示测序错误）、附近读段的 indel 是否过多（提示错误定位）、读段起始位置是否过于集中（提示 PCR 重复）。

IGV 还支持加载 VCF、BED、GFF、BigWig 等多种格式，可以在同一视图中对比比对结果、变异、注释和覆盖度信号。对于 RNA-seq 数据，IGV 可以直观查看剪接模式；对于 SV 数据，IGV 可以查看分裂读段和 discordant pair 模式。

## 2.4.4 基因组组装

当没有参考基因组或需要发现参考基因组中缺失的序列时，从头组装是获得基因组序列的唯一途径。组装也是验证参考基因组质量的重要手段，参考基因组中的错误可以通过与新组装的比对发现。组装的难度主要由基因组重复程度、多态性水平、测序读长和数据质量决定。

人类基因组计划（1990-2003）历时十余年完成第一份人类基因组草图，耗资数十亿美元，使用 Sanger 测序和 BAC-by-BAC 策略。此后组装技术随测序技术发展不断演进：NGS 时代推动了 de Bruijn 图算法（Velvet、ALLPATHS、SPAdes）的成熟；长读长时代使 OLC 算法（Celera Assembler、Canu）重新成为主流；HiFi 时代则催生了 hifiasm 等高质量分相组装器，使人类基因组组装进入染色体级别单倍型解析的新阶段。

### 组装基础概念

组装的核心是把短读段拼接成更长的连续序列。读段两两之间的重叠是拼接的基础，但直接两两比较所有读段对计算量太大（O(n²)）。现代组装算法通过特殊数据结构避免显式两两比较。

**de Bruijn 图**（de Bruijn graph，DBG）将读段分解为 k-mer 后构建有向图，适用于短读长组装。具体过程：选择一个 k 值（例如 31），将每条读段分解为所有可能的 k-mer；每个 (k-1)-mer 作为图节点，每个 k-mer 表示从其前 (k-1)-mer 到后 (k-1)-mer 的有向边。读段中的连续 k-mer 在图中形成路径，所有读段共同构成整个基因组的 de Bruijn 图。

构建图后，组装的任务是找到遍历图中所有边一次的路径（Eulerian path）。de Bruijn 图的优势在于：相同 k-mer 在图中只出现一次，重复区域自然压缩；读段两两重叠通过 k-mer 间接表示，无需显式比较。劣势是 k-mer 大小固定，太小无法区分重复、太大覆盖不足导致图断裂；测序错误每个产生一个新 k-mer，需要严格的错误纠正。

**OLC 图**（Overlap-Layout-Consensus，重叠-布局-一致性）通过读段两两重叠确定排列顺序，适用于长读长组装。第一步 Overlap 使用高效算法（如 minimizer）找到所有读段两两之间的重叠关系；第二步 Layout 根据重叠关系将读段排列到字符串图（string graph）中，去除由重复导致的假重叠；第三步 Consensus 对每条 contig 上对齐的多条读段做多序列比对，通过一致性调用得到最终序列。

OLC 的优势在于利用长读长的长重叠信息，可以跨越重复区域；劣势是对错误率敏感，需要先进行读段纠错。PacBio CLR 和 ONT 早期化学的高错误率曾制约 OLC 应用，HiFi 数据的出现使 OLC 重新成为高质量组装的主流。

**Contig** 是组装的基本输出，由读段拼接形成的连续序列，中间无 gap。**Scaffold** 用 N 填充 contig 之间的间隙，长度比 contig 更长但准确度较低。Scaffold 的构建依赖配对读段、长读长、Hi-C、光学图谱等远距离信息。

**N50** 是评估组装连续性的核心指标，表示将 contig 按长度降序排列后累计长度达总长 50% 时的 contig 长度。N50 越大表示组装越连续。除 N50 外，N90（90% 时的 contig 长度）、最大 contig 长度、contig 数量等也是常用指标。N50 必须结合总组装长度解读：长度过短但 N50 高的组装可能漏掉了大量重复区域。

### 组装中的常见挑战

**重复区域**是组装的主要瓶颈。重复序列长度超过读长时，组装器无法判断重复属于哪个拷贝，导致组装断裂或错误合并。人类基因组中 segmental duplication（>1kb、>90% 相似度的重复）占 5-10%，是组装最困难的区域。着丝粒、端粒、rDNA 簇的高度重复区域需要超长读长才能跨越。

**杂合性**问题在杂合度高的物种（如部分鱼类、植物）中尤其严重。杂合位点导致 de Bruijn 图中出现分叉，组装器可能将两条单倍型分别组装为冗余 contig，或者将杂合区域折叠成单一 contig。前者造成组装总长度偏大，后者丢失相位信息。纯合样本（如近交系、单倍体）可以避免此问题。

**GC 偏性**导致高 GC 或低 GC 区域覆盖度不均。极端 GC 含量的区域在 PCR 扩增效率、测序反应中表现差，形成覆盖盲区。PCR-free 文库可以减少 GC 偏性但成本较高。组装算法需要平衡不同 GC 区域的覆盖，避免高 GC 区域过度碎片化。

**嵌合读段**来源于文库构建中的连接反应或转座事件，一条读段包含来自不同基因组位置的序列。嵌合读段会引入假重叠，导致组装错误连接。长读长数据中嵌合读段比例较高，Canu 等组装器有专门的嵌合检测步骤。

```python
def calculate_n50(lengths):
    sorted_lengths = sorted(lengths, reverse=True)
    total = sum(sorted_lengths)
    cumsum = 0
    for length in sorted_lengths:
        cumsum += length
        if cumsum >= total / 2:
            return length
    return 0

contigs = [50000, 35000, 28000, 20000, 15000, 12000, 8000, 5000, 3000, 1000]
print(f"N50: {calculate_n50(contigs):,} bp")
```

::: tip k-mer 选择
de Bruijn 图组装中，k 值选择很关键。k 太小（如 21）会导致重复区域无法区分，引入错误连接；k 太大（如 127）会导致覆盖不足、图过度碎片化。SPAdes 等工具采用多 k-mer 策略，先小 k 后大 k 综合多图结果，平衡了覆盖和区分度。
:::

### 短读长组装

**SPAdes** 采用多 k-mer 策略，先用较小 k-mer 捕获低覆盖区域，再用较大 k-mer 解决重复区域，是细菌基因组组装的首选。SPAdes 的核心创新是 multi-size de Bruijn graph：对多个 k 值分别构建图，然后通过图变换整合，最终从整合图中提取 contig。SPAdes 还支持杂合基因组组装（dipSPAdes）、宏基因组组装（metaSPAdes）、RNA-seq 组装（rnaSPAdes）等扩展模式。

对于真核基因组，短读长组装通常只能获得相对碎片化的结果，特别是高度重复区域（着丝粒、端粒、rDNA 簇）难以跨越。短读长组装的真核基因组 N50 通常在 kb 级别，远不及长读长组装的 Mb 级别。

```bash
spades.py -1 clean_R1.fq.gz -2 clean_R2.fq.gz \
    -o spades_output --threads 16 --memory 64
```

### 长读长组装

**Canu** 是 PacBio 和 Nanopore 数据的标准组装器，工作流程包括纠错、修剪和组装三阶段。纠错阶段使用重叠读段互相纠正，将原始错误率从 10-15% 降到 1% 以下；修剪阶段去除读段末端的低质量部分和嵌合读段；组装阶段构建 OLC 图，通过 **best overlap** 策略选择最可靠的重叠，然后遍历图生成 contig。Canu 的 best overlap 策略对每个读段选择错误率最低的重叠，避免低质量重叠引入错误连接。

**Hifiasm** 专为 PacBio HiFi 数据设计，可以实现分相组装，分别输出两套单倍型序列。HiFi 数据的高准确率（>99.9%）使组装无需显式纠错，可以保留原始读段的相位信息。Hifiasm 通过构建带有相位信息的 de Bruijn 图，在图中保留杂合位点的两条单倍型路径，最终输出两套单倍型 contig。HiFi 数据加上 Hi-C 信息，hifiasm 可以生成染色体级别的单倍型解析组装，质量远超传统流程。

**Flye** 是通用的长读长组装器，对高错误率数据表现稳健。Flye 的关键创新是使用重复图（repeat graph）显式建模重复区域：先构建近似组装，识别其中的重复边界，再通过重复图解决重复引起的歧义。Flye 支持 PacBio CLR/HiFi 和 ONT 数据，对小型到中型基因组（细菌到人类）都有良好表现。

```bash
# Hifiasm 分相组装
hifiasm -o asm -t 32 pacbio_hifi_reads.fasta.gz

# Flye Nanopore 组装
flye --nano-raw ont_reads.fasta.gz \
    --genome-size 3g --threads 32 --out-dir flye_output

# Canu 长读长组装
canu -p asm -d canu_output genomeSize=3g \
    -pacbio-raw pacbio_reads.fasta.gz
```

::: note HiFi 组装的优势
PacBio HiFi 数据结合 hifiasm 已经成为人类基因组组装的黄金标准。2022 年人类基因组完整序列（T2T-CHM13）的发布正是基于 HiFi 长读长和 ONT 超长读长，首次填补了人类基因组中所有 gap，包括此前无法组装的着丝粒、核糖体 DNA 簇和 segmental duplication 区域。
:::

### 组装评估

组装评估从连续性、准确性和完整性三个维度展开。**QUAST** 计算基本指标（N50、总长度、contig 数量）并与参考基因组比对评估准确性（错配率、indel 率、结构性错误）。**BUSCO** 通过搜索近缘物种的单拷贝直系同源基因评估基因完整性，完整单拷贝基因比例达 90% 以上通常认为是较好的组装。BUSCO 的原理是利用保守单拷贝基因在近缘物种中应该都存在且只有一份拷贝，缺失表示组装断裂在基因内部，重复表示组装冗余。

**Merqury** 基于 k-mer 频谱评估组装错误率，无需参考基因组。原理是：将原始读段中的 k-mer 与组装比对，组装中也应包含这些 k-mer。读段中存在但组装中缺失的 k-mer 表示组装断裂或漏掉区域；组装中存在但读段中没有的 k-mer 表示组装错误。Merqury 还可以比较两套单倍型组装，计算单倍型间的 phasing 错误率。

**LAI**（LTR Assembly Index）通过评估长末端重复反转录转座子（LTR-RT）的组装完整性来衡量组装质量，LTR-RT 是植物基因组中的主要重复成分，对组装挑战大，是衡量组装连续性的敏感指标。

```bash
quast.py assembly.fasta -r reference.fasta -o quast_report
busco -i assembly.fasta -l insecta_odb10 -m genome -o busco_result -c 16
```

### 组装抛光

长读长组装的初始 contig 错误率仍然较高（PacBio CLR 约 1%，ONT 约 2-5%），需要抛光（polishing）提升准确率。抛光分为基于读段的抛光和基于短读段的抛光两类。

**Racon** 使用长读段对组装进行快速抛光。Racon 将组装 contig 与所有读段比对，通过多序列比对在每个位置调用一致性序列，可以快速降低 indel 错误率。Racon 通常迭代 2-4 轮收敛。

**Medaka** 专为 ONT 数据设计，使用深度学习模型预测并修正 ONT 特有的错误模式。Medaka 训练了针对不同 ONT 化学的模型（R9.4、R10.4 等），错误率可以降到 0.5% 以下。Medaka 比 Racon 更准确，但只适用于 ONT 数据。

**Pilon** 使用 Illumina 短读段抛光组装，是跨平台抛光的标准工具。Pilon 将短读段比对到 contig，分析比对结果识别错配、indel、缺失区域，然后用短读段的一致性调用修正 contig。Pilon 可以同时修正 substitution 和 indel，对 SNV 错误的修正尤其有效。典型流程是 Racon/Medaka 粗抛光 + Pilon 精抛光，最终准确率可达 Q40 以上。

```bash
# Racon 长读长抛光（迭代 3 轮）
minimap2 -t 16 assembly.fasta long_reads.fasta > overlaps.paf
racon -t 16 long_reads.fasta overlaps.paf assembly.fasta > polished_1.fasta
# 重复 2-3 轮

# Pilon 短读长抛光
bwa mem -t 16 assembly.fasta short_R1.fq.gz short_R2.fq.gz | \
    samtools sort -o pilon.bam
samtools index pilon.bam
pilon --genome assembly.fasta --bam pilon.bam --output pilon_polished --threads 16
```

::: warning 抛光的局限
抛光无法修复结构性错误，例如组装将两条染色体错误连接、重复区域折叠等。这些错误需要在组装阶段通过更长的读长或 Hi-C 数据解决。抛光也无法填补组装 gap，只能修正已组装区域的碱基级错误。评估抛光效果应使用 Merqury 计算错误率，而非单纯依赖 BUSCO 完整性。
:::

### Scaffold 挂载与染色体定位

Contig 是组装的基本输出，但通常只是基因组片段，缺乏染色体级别的位置信息。将 contig 进一步组装成 scaffold 和染色体需要远距离信息。常用方法包括 Hi-C、光学图谱和遗传图谱。

**Hi-C** 是最常用的染色体挂载方法。Hi-C 实验通过甲醛固定细胞，限制酶酶切后连接空间邻近的 DNA 片段，测序得到全基因组范围内的相互作用频率矩阵。同一条染色体内部的相互作用频率远高于不同染色体之间，这种顺式偏好可以用于将 contig 分配到染色体。Juicer、3D-DNA、YaHS 等工具分析 Hi-C 接触矩阵，自动或半自动地将 contig 排序、定向、合并成染色体级别 scaffold。Hi-C 还能识别组装错误（如倒位、误连接），通过热图上的特征性模式可视化检查。

**光学图谱**（Optical mapping，如 Bionano Saphyr）将长 DNA 分子（数百 kb）固定并酶切，按顺序成像得到酶切位点模式。将组装 contig 的预测酶切模式与实际模式比对，可以确定 contig 之间的顺序和距离。光学图谱对大尺度结构问题敏感，是 Hi-C 的良好补充。

**遗传图谱**利用家系数据中的重组事件确定标记之间的距离。遗传图谱对植物和动物基因组组装很有用，但需要大量后代和密集的标记。对人类基因组，遗传图谱已被 Hi-C 取代。

```bash
# 3D-DNA Hi-C 挂载流程
juicer.sh -g assembly.fasta -s 5 -z reference.fa -D juicer_dir
3d-dna/run-asm-pipeline.sh -r 0 assembly.fasta aligned/merged_nodup.txt.gz
# YaHS Hi-C 挂载（更新工具）
yahs -o scaffolds assembly.fasta hic.bam
```

## 2.4.5 基因组注释

基因组注释识别和标记基因组中的功能元件，分为重复序列注释、基因结构注释和功能注释三个层次。组装得到的基因组序列本身只是字母串，注释赋予其生物学意义。注释质量直接决定后续功能研究的可靠性，错误注释会传播到所有下游分析。

注释是一项系统工程，涉及多个专业团队协作。大型注释项目（如 ENCODE、GENCODE）建立的注释流程包含实验验证和计算预测的多轮迭代。对新物种的首次注释通常需要 6-12 个月，结合转录组测序、同源物种数据、计算预测综合判断。注释完成后仍需定期更新，因为新证据（更多转录组数据、新同源物种、功能实验）会修正和补充原有注释。

### 重复序列注释

重复序列在人类基因组中占 50% 以上，在玉米基因组中甚至超过 80%。重复序列会干扰基因预测，造成假基因预测、错误外显子边界等，需要先识别和屏蔽。

重复序列主要分为两类。**串联重复**（Tandem repeat）包括微卫星（1-6bp 单元，如 CAG 重复）和小卫星（更长单元），由 DNA 复制滑动产生。**散布重复**（Dispersed repeat）主要是转座元件（Transposable Element，TE），包括反转录转座子（Class I，通过 RNA 中间体进行**复制-粘贴**式转座）和 DNA 转座子（Class II，通过**剪切-粘贴**式转座）。反转录转座子又分 LTR 型（长末端重复，如 ERV）、非 LTR 型（LINE、SINE）两大类。

**RepeatModeler** 从头发现重复序列家族，结合 RepeatScout（基于 k-mer 频率发现重复序列）、RECON（基于多序列比对识别重复边界）、Tandem Repeats Finder（识别串联重复）等多个工具，构建物种特异的重复序列库。LTR Retrotransposon 结构特殊（两端 LTR、内部 gag/pol），LTRharvest、LTR_FINDER_parallel 等专门工具可识别完整的 LTR-RT。

**RepeatMasker** 基于数据库屏蔽已知重复区域，使用 Cross_Match、RMBlast 或 HMMER 等比对引擎将组装序列与重复库比对，标记匹配区域。输出包括 masked fasta（重复区替换为 N）、GFF 注释文件和统计表。

```bash
# 从头建模
BuildDatabase -name my_species -engine ncbi assembly.fasta
RepeatModeler -database my_species -pa 16 -LTRStruct

# 重复序列屏蔽
RepeatMasker -pa 16 -lib consensi.fa.classified \
    -gff -dir repeatmasker_output assembly.fasta
```

::: tip 重复注释的两步策略
对研究较少的物种，建议采用 Dfam+RepBase 通用库 +物种特异库的策略。先用通用库屏蔽高度保守的重复家族，再用 RepeatModeler 从头发现物种特异家族，最后合并屏蔽。这样既保证已知重复的准确识别，又能发现新家族。
:::

### 基因结构注释

基因结构注释确定基因的位置、外显子-内含子边界和转录起始终止位点。真核基因结构复杂，可变剪接、UTR、非编码 RNA 等多种因素增加注释难度。方法分为三类。

**从头预测**（Ab initio prediction）基于统计特征，使用隐马尔可夫模型（HMM）或动态规划识别基因结构。Augustus 使用 HMM 模型化编码区、剪接位点、起始/终止密码子等信号，并通过物种特异参数优化准确率。GeneMark 使用非齐次马尔可夫模型识别编码区。从头预测的优势是无需先验数据，缺点是容易预测假基因、遗漏非典型基因。模型训练时使用已知基因集或近缘物种的注释作为训练数据，不同物种参数不同，跨物种使用会显著降低准确率。

**同源预测**基于已知物种蛋白质或转录组比对到目标基因组，推断基因结构。Exonerate 支持多种比对模式，包括蛋白质到基因组、cDNA 到基因组，能处理剪接位点。GeneWise 专门用于蛋白质到基因组的精细比对，建模剪接位点、移码等。同源预测的可靠性高，但只能注释有同源物的基因，物种特异基因无法发现。

**转录组证据**通过 RNA-seq 比对提供基因结构。HISAT2/StringTie 流程拼接转录本，PASA 整合转录本比对到基因组生成基因结构，TransDecoder 从转录本预测开放阅读框。RNA-seq 证据是最直接可靠的基因结构来源，特别是对可变剪接的检测。局限是低表达基因可能没有 RNA-seq 覆盖，需要结合从头预测。

**EvidenceModeler**（EVM）整合多源证据生成一致基因模型。EVM 给每种证据赋权重（如转录组证据权重 1.0、同源证据 0.5、从头预测 0.1），对每个候选基因模型计算加权得分，选择最高得分的作为最终模型。整合后的注释通常比任何单一方法都更可靠。PASA 进一步用转录本证据修正 EVM 输出，添加 UTR 和可变剪接 isoform。

::: tip 整合多种证据
单一方法预测结果往往不可靠，整合从头预测、同源预测和转录组证据是获得高质量注释的关键。典型的真核基因组注释流程包括：RepeatMasker 屏蔽、Augustus/GeneMark/SNAP 从头预测、Exonerate 同源比对、HISAT2+StringTie 转录组拼接、PASA 整合、EVM 一致化、PASA 修正。
:::

### 原核基因组注释

**Prokka** 是原核生物基因组注释的标准工具，一键完成基因预测、rRNA/tRNA 识别和功能注释，输出 GFF3、GBK 等多种格式。Prokka 内部调用 Prodigal 预测编码基因、Barrnap 识别 rRNA、Aragorn 识别 tRNA、HMMER 比对 Pfam 数据库。对于研究较多的物种，Prokka 可以提供较高质量注释；对于新物种，需要补充蛋白数据库比对和通路注释。

```bash
prokka --kingdom Bacteria --genus Escherichia \
    --outdir prokka_output --prefix sample assembly.fasta
```

### 功能注释

功能注释赋予基因产物生物学意义。基因结构注释只回答**基因在哪里**，功能注释回答**基因做什么**。

**序列同源**是最基础的功能推断方法。蛋白质序列比对到 Swiss-Prot（人工审校的高质量蛋白库）推断功能，BLAST 比对 evalue 1e-5 是常用阈值。同源传递功能注释需要注意：直系同源基因功能通常保守，旁系同源基因功能可能分化，仅靠序列相似性无法区分两者。

**InterProScan** 搜索多个蛋白质特征数据库（Pfam、SMART、PROSITE、PRINTS 等）识别保守结构域、家族、位点，分配 GO 术语。结构域注释比全长同源更可靠，因为不同基因可能共享部分结构域但功能不同。

**eggNOG-mapper** 基于直系同源群（orthologous group）注释，使用快速 Diamond 比对将查询蛋白映射到 eggNOG 数据库中的直系同源群，传递该群的保守功能注释。eggNOG v5+ 提供广泛物种覆盖和详细 GO/KEGG/COG 注释。

**KEGG 通路映射**将基因映射到代谢和信号通路，理解基因在生物系统中的作用。BlastKOALA、GhostKOALA 是 KEGG 在线注释工具，KAAS 提供本地化注释。

```bash
# InterProScan 功能注释
interproscan.sh -i proteins.fasta -f tsv,gff3 \
    -goterms -iprlookup -t p -cpu 16

# eggNOG-mapper 直系同源注释
emapper.py -i proteins.fasta --output eggnog_result --cpu 16

# BLAST 比对 Swiss-Prot
blastp -query proteins.fasta -db swissprot \
    -outfmt 6 -evalue 1e-5 -max_target_seqs 1 -num_threads 16
```

### 注释质量评估

**BUSCO** 同样可以评估注释基因集的完整性。完整的单拷贝同源基因应在注释中找到对应蛋白，缺失表示组装断裂在该基因内或注释遗漏。**GffCompare** 比较注释与转录组比对结果的一致性，检测遗漏基因和错误外显子边界。**OMArk** 是较新的注释质量评估工具，基于 proteome 比对评估注释完整性和正确性。

注释质量的常见问题包括：基因碎片化（断裂在两个 contig 上）、融合错误（两个基因被合并）、遗漏基因（特别是物种特异基因）、过度预测（假基因被注释为功能基因）。BUSCO 完整性、转录本比对一致性、与近缘物种的基因数比较是综合评估的关键指标。

### 非编码 RNA 注释

除蛋白质编码基因外，基因组中还包含大量非编码 RNA（ncRNA），它们在调控、催化、结构等方面发挥重要作用。ncRNA 注释通常在蛋白质编码基因注释后单独进行。

**tRNA** 注释使用 tRNAscan-SE，基于 tRNA 二级结构和序列特征识别 tRNA 基因，准确率高、假阳性低。tRNAscan-SE 还能预测 tRNA 的反密码子、二级结构和三级结构。

**rRNA** 注释使用 Barrnap，基于隐藏马尔可夫模型识别 5S、5.8S、16S/18S、23S/28S 四类 rRNA。rRNA 基因通常以串联重复形式存在（rDNA 簇），组装困难，注释时需要考虑部分 rRNA 基因可能缺失。

**miRNA** 注释使用 miRDeep2 等工具，基于 miRNA 前体的发夹结构和成熟 miRNA 的读段签名。miRNA 注释需要小 RNA 测序数据支持，仅靠基因组序列难以可靠识别。

**其他 ncRNA**（snRNA、snoRNA、lncRNA 等）注释使用 Infernal 软件，搜索 Rfam 数据库中的 RNA 共识结构模型。Infernal 基于协方差模型（Covariance Model，CM），同时考虑序列和二级结构保守性，对结构化 ncRNA 识别灵敏度高。

```bash
# tRNA 注释
tRNAscan-SE -o trna.txt assembly.fasta

# rRNA 注释
barrnap --kingdom euk assembly.fasta > rrna.gff

# Rfam 数据库搜索 ncRNA
cmscan --rfam --cut_ga --nohmmonly --tblout rfam.tbl \
    --fmt 2 --cpu 16 Rfam.cm assembly.fasta
```

## 2.4.6 变异检测

变异检测识别基因组变异，是医学基因组学和群体遗传学的核心技术。变异检测的可靠性取决于比对质量、测序深度和算法选择，假阳性会误导临床决策，假阴性会遗漏重要致病变异。

### 变异类型与 VCF 格式

变异按大小和性质分类。**SNV**（Single Nucleotide Variant，单核苷酸变异）指单个碱基的改变，包括 SNP（单核苷酸多态性，群体频率 >1%）和罕见 SNV。**Indel**（Insertion/Deletion）指 1-50bp 的插入或缺失。**SV**（Structural Variant，结构变异）指 >50bp 的变异，包括缺失（DEL）、重复（DUP）、倒位（INV）、易位（BND）和大的插入（INS）。**CNV**（Copy Number Variant）是重复或缺失导致的拷贝数变异，是 SV 的子集。

不同类型变异的检测策略不同：SNV 和小 indel 依赖读段级别的比对；中等尺度 SV 需要读段对、分裂读段和局部组装；大尺度 SV 还需要读段深度和长读长信息。

**复杂变异**指涉及多个断点或多种类型的变异，例如染色体内重排（同时发生缺失、倒位、易位）、chromothripsis（染色体破碎后重新拼接）和 kataegis（局部高频突变）。复杂变异在肿瘤基因组中常见，对检测算法要求高。长读长测序可以跨越整个复杂区域，是检测复杂变异的最有效方法。

**嵌合变异**指仅在部分细胞中存在的变异，例如体细胞突变早期克隆扩张、组织嵌合（不同组织遗传组成不同）。嵌合变异的检测需要高深度测序和专门的统计模型，频率可能低至 1% 以下，对去重和过滤要求严格。

**VCF**（Variant Call Format）是变异信息的标准格式，分为元信息行（##开头）、表头行（#CHROM 开头）和数据行。核心字段包括：CHROM（染色体）、POS（位置，1-based）、ID（变异 ID，如 dbSNP rs 号）、REF（参考等位基因）、ALT（替代等位基因）、QUAL（质量分数）、FILTER（过滤状态）、INFO（注释信息）、FORMAT（基因型字段格式）、样本基因型数据。

INFO 字段常见键包括：DP（该位点读段深度）、AF（等位基因频率）、MQ（比对质量）、FS（链偏倚 Fisher 检验 p-value）、QD（质量分数除以深度）、AC/AN（等位基因计数/总数）。FORMAT 字段常见键包括：GT（基因型，0/0、0/1、1/1、./.）、AD（等位基因深度）、DP（样本深度）、GQ（基因型质量）、PL（基因型似然值）。

```bash
# bcftools 变异标准化（左对齐并拆分多等位基因）
bcftools norm -f reference.fasta -m -any -Oz -o normalized.vcf.gz raw.vcf.gz
```

变异标准化是必须的预处理步骤。左对齐将 indel 移到最左可能位置，避免不同工具对同一变异表示不同；拆分多等位基因（如 A,T 在同一位点）使每个变异独立，简化后续注释和分析。

### 种系变异检测

**GATK HaplotypeCaller** 采用局部组装策略，是种系变异检测的标准工具。其工作流程包含四个关键步骤：

第一，**活跃区域识别**（Active region identification）。扫描比对文件，根据错配率、indel 信号等指标找到可能包含变异的区域，每个区域通常 50-300bp。这些区域将进入精细分析。

第二，**局部 de Bruijn 图组装**。在活跃区域内将读段分解为 k-mer（默认 k=10 和 k=25），构建 de Bruijn 图。参考基因组序列也加入图中作为锚点。图中的不同路径代表不同的可能单倍型，read 路径与参考路径的分叉点就是候选变异位点。局部组装的优势是可以检测到比对的 indel，特别是比对工具因 gap 罚分设置而漏掉的 indel。

第三，**配对隐马尔可夫模型**（Pair-HMM）计算每条 read 对每条单倍型的似然值。Pair-HMM 显式建模 substitution、insertion、deletion 三种状态及其转移概率，给出 read 与单倍型之间的比对概率。这一步的计算量大，GATK 使用 AVX 指令集优化。

第四，**贝叶斯基因型推断**。基于 Pair-HMM 得到的 read 似然值，结合先验（如群体等位基因频率），用贝叶斯公式计算每种基因型的后验概率，选择后验最高的基因型作为调用结果。基因型质量 GQ 是次优基因型与最优基因型对数似然之差。

HaplotypeCaller 在单样本模式下直接输出 VCF；在多样本流程中，先输出 gVCF（genomic VCF，包含变异位点和非变异位点的置信度），再通过 GenomicsDBImport 和 GenotypeGVCFs 联合基因分型，这样可以平衡计算效率和分型准确性。

**gVCF 格式**将整个基因组划分为置信区块，每个区块记录基因型置信度和观察到的等位基因。非变异区域以 `<NON_REF>` 表示潜在但未观察到的 alt 等位基因，配合 PL（基因型似然值）字段记录 0/0、0/1、1/1 三种基因型的似然。gVCF 的优势是保留了非变异位点的置信度信息，联合基因分型时可以利用多个样本的证据。

**联合基因分型**（Joint genotyping）是多样本项目的关键步骤。单样本 gVCF 中低置信度的 0/1 或 1/1 调用，在多样本联合分析时如果多个样本都支持，置信度会提高；反之，孤立的低置信度调用可能被判定为假阳性。联合基因分型的流程是：每个样本独立运行 HaplotypeCaller 生成 gVCF，用 GenomicsDBImport 将 gVCF 汇总到 GenomicsDB 数据库（按染色体区间分块），再用 GenotypeGVCFs 对每个区间联合基因分型。这种增量式流程在新增样本时只需重运行 GenotypeGVCFs，无需重新运行 HaplotypeCaller，适合大型队列项目。

::: warning 队列规模的策略选择
样本数 < 100 时可以单样本调用后合并；100-1000 样本应使用 gVCF 联合基因分型；>1000 样本时 GenomicsDBImport 内存压力大，需要按染色体分块并行处理。GLnexus 是 BCFtools 生态的替代工具，对超大队列优化更好。
:::

```bash
# GATK HaplotypeCaller 生成 gVCF
gatk HaplotypeCaller -R reference.fasta -I dedup.bam \
    -O sample.g.vcf.gz -ERC GVCF

# 多样本联合基因分型
gatk GenomicsDBImport --genomicsdb-workspace-path my_db \
    -V sample1.g.vcf.gz -V sample2.g.vcf.gz
gatk GenotypeGVCFs -R reference.fasta -V gendb://my_db -O cohort.vcf.gz

# BCFtools 快速变异检测
bcftools mpileup -f reference.fasta -Ou dedup.bam | \
    bcftools call -mv -Oz -o variants.vcf.gz
```

**BCFtools** 基于 mpileup 的碱基计数，速度较快。mpileup 收集每个位点的碱基组成和质量分数，bcftools call 使用贝叶斯模型推断基因型。BCFtools 的优势是速度快、内存占用小，对大规模群体数据更友好；缺点是没有局部组装，对 indel 的检测灵敏度低于 GATK。两者在 SNV 检测上结果接近，indel 检测上 GATK 通常更敏感。

**DeepVariant** 是 Google 开发的基于深度学习的变异检测工具，使用 Inception 卷积神经网络分析比对图像。DeepVariant 将每个候选位点周围的比对信息编码为图像（行是读段、列是位置、像素值编码碱基和质量），让 CNN 学习区分真实变异和测序错误。DeepVariant 在 Illumina、PacBio HiFi、ONT 数据上都表现优异，特别是对 indel 的检测准确率超过 GATK HaplotypeCaller。DeepVariant 的缺点是计算资源需求高（需要 GPU），训练数据偏向人类基因组。

### 体细胞变异检测

体细胞变异检测识别肿瘤组织相对于正常组织的获得性变异，通常需要肿瘤-正常配对样本设计。配对设计可以过滤掉种系变异（在正常样本中也存在），剩下的才是真正的体细胞变异。

**Mutect2** 是 GATK 中的体细胞变异检测工具，工作流程与 HaplotypeCaller 类似（局部组装 + Pair-HMM + 贝叶斯推断），但增加了几个体细胞特异步骤：

- **种系变异过滤**：使用群体等位基因频率数据库（如 gnomAD）作为先验，如果某变异在群体中频率较高，很可能不是体细胞变异。
- **Panel of Normals（PON）**：使用一批正常样本的变异调用结果识别系统性假阳性（如特定区域易产生比对错误），从肿瘤调用中过滤掉。
- **污染估计**：估计肿瘤样本中正常细胞污染比例，调整似然计算。
- **FilterMutectCalls**：综合多个指标（读段支持数、等位基因频率、链偏倚、定位质量等）进行过滤。

**Strelka2** 采用差分概率模型，灵敏度较高，对小 indel 检测特别优秀。Strelka2 使用配对样本的错误模型，能区分体细胞变异和正常样本的噪音。Strelka2 在肿瘤纯度低、测序深度有限的情况下表现优于 Mutect2。

**CNVkit** 检测体细胞拷贝数变异，基于读段深度方法，支持目标区段测序（如外显子组）和全基因组测序。CNVkit 使用池化的正常样本构建参考深度分布，对比肿瘤样本的深度偏差推断拷贝数。

**GATK gCNV** 是 GATK 推荐的拷贝数检测工具，使用贝叶斯隐马尔可夫模型对目标区段测序数据进行拷贝数推断。gCNV 支持同批次多样本协同分析，利用群体信息提升低覆盖度样本的检测灵敏度。流程分为两部分：DetermineGermlineCNVCalls 训练模型并调用拷贝数，PostprocessGermlineCalls 输出最终片段和基因型。

**肿瘤纯度与倍性估计**对体细胞变异检测有重要影响。肿瘤样本通常混有正常间质细胞（纯度 < 100%），且肿瘤基因组可能存在整体倍性改变。PureCN、FACETS、Sequenza 等工具同时估计肿瘤纯度、倍性和拷贝数，可以校正这些因素对变异频率的影响。在低纯度样本中，杂合变异的频率会偏离 50%，需要根据纯度调整。

```bash
gatk Mutect2 -R reference.fasta \
    -I tumor.bam -tumor tumor_sample \
    -I normal.bam -normal normal_sample \
    --germline-resource af-only-gnomad.vcf.gz \
    --panel-of-normals pon.vcf.gz \
    -O somatic_unfiltered.vcf.gz
gatk FilterMutectCalls -V somatic_unfiltered.vcf.gz \
    -R reference.fasta -O somatic_filtered.vcf.gz
```

::: warning 配对样本的重要性
无配对正常样本的体细胞变异检测会产生大量假阳性，包括种系变异、克隆造血变异、人工假阳性等。如果无法获得患者自身正常组织，可以使用血细胞作为正常样本（注意白血病等血液肿瘤例外）。PON 可以部分替代配对正常样本，但效果不如真正配对。
:::

### 结构变异检测

结构变异检测比 SNV/indel 检测更具挑战性，因为 SV 类型多样（缺失、重复、倒位、易位、插入）、断点位置精确、对读段比对模式影响复杂。检测策略包括四类。

**读段对方法**（Read-pair）基于双端读段的插入片段大小和方向异常。例如缺失导致读段对距离变短，插入导致距离变长，倒位导致读段对方向异常，易位导致配对读段比对到不同染色体。优势是简单直观，局限是无法定位断点到单碱基精度，对小 SV（<read pair insert size 的 1.5 倍）不敏感。

**分裂读段方法**（Split-read）基于单条读段跨越 SV 断点的情况，读段的一部分比对到断点一侧，另一部分比对到另一侧。可以定位断点到单碱基精度。需要比对工具支持 split-read 比对（如 BWA-MEM 的 supplementary alignment）。

**读段深度方法**（Read-depth）基于覆盖度变化检测拷贝数变异。缺失区域读段深度下降，重复区域读段深度上升。常用方法包括滑动窗口统计、HMM 模型、CBS（Circular Binary Segmentation）分段。局限是无法检测拷贝中性的 SV（如倒位、平衡易位）。

**局部组装方法**（Assembly-based）在候选 SV 区域进行局部组装，得到精确断点序列。Manta、DELLY 等工具综合使用读段对和分裂读段策略找候选，再通过局部组装确认和精确化。

**长读长方法**利用长读段跨越整个 SV 的优势，可以直接检测大尺度 SV。**Sniffles2** 是长读长 SV 检测的标准工具，通过分析长读段的 split alignment 检测各类 SV，对 50bp 以上的 SV 都有良好灵敏度。长读长 SV 检测对复杂区域（如 segmental duplication）的优势尤其明显。

```bash
# Manta SV 检测
configManta.py --bam aligned.bam --referenceFasta reference.fasta --runDir manta_run
manta_run/runWorkflow.py -m local -j 16

# Sniffles2 长读长 SV 检测
sniffles --input aligned_ont.bam --vcf sv_calls.vcf \
    --reference reference.fasta --threads 16
```

::: tip SV 检测的金标准
不同 SV 检测工具各有偏好，单一工具会漏检。临床和高质量研究通常整合多个工具（如 Manta+DELLY+LUMPY）的调用结果，使用 Survivor、Jasmine 等工具合并，再用长读长数据或 PCR 实验验证关键 SV。
:::

### 变异过滤

变异检测后还需要过滤低质量变异。两种主流策略各有适用场景。

**硬过滤**（Hard filter）使用 QUAL、DP、QD、FS、MQ 等指标过滤低质量变异。GATK Best Practices 推荐的硬过滤阈值包括：QD < 2.0、FS > 60.0、MQ < 40.0、MQRankSum < -12.5、ReadPosRankSum < -8.0。硬过滤简单直接，但每个位点独立判断，不考虑整体分布，对小样本或非模式物种是可行选择。

**VQSR**（Variant Quality Score Recalibration）利用机器学习模型区分真阳性和假阳性。VQSR 的核心思想是：利用已知的高置信变异集（如 HapMap、1000 Genomes 高置信位点、dbSNP）作为正训练集，假阳性候选作为负训练集，训练高斯混合模型（Gaussian Mixture Model），对每个变异计算 VQSLOD（Variant Quality Score Log Odds）分数，根据可信度截断值过滤。

VQSR 的工作流程：第一步收集变异的多个质量注释（QD、MQ、FS、SOR、ReadPosRankSum 等）作为特征；第二步用已知真阳性和假阳性训练 GMM，得到每个特征组合的似然比；第三步对所有变异计算 VQSLOD，按所需敏感度水平（如 truth sensitivity 99.0、99.5、99.8）选择截断值。

VQSR 的优势是综合考虑多个特征，比硬过滤更准确。但 VQSR 需要大量已知变异作为训练集，非人类物种可能不适用。一般需要至少数千个已知真阳性和数百个假阳性，否则 GMM 训练不稳定。

**Tranche 选择**是 VQSR 应用中的关键参数。Tranche 指 truth sensitivity 截断水平，例如 99.0 表示保留 99.0% 的已知真变异，余下的 1.0% 被过滤。常用 tranche 包括 99.0、99.5、99.8、99.9，数值越大保留越多变异但假阳性也越多。不同应用场景选择不同 tranche：临床诊断倾向 99.0 严格过滤以保证假阳性最低；群体遗传学研究倾向 99.5 或 99.8 保留更多变异以减少假阴性；SNV 和 indel 通常使用不同 tranche，因为 indel 的训练集较小、模型稳定性稍差。

::: tip 替代过滤策略
对于非模式物种，VQSR 不可用时可以考虑两种替代方案：一是直接使用硬过滤，根据 GATK Best Practices 推荐的 QD、FS、MQ、SOR 等阈值；二是基于已知变异集（即使数量较少）训练简化模型，如 DeepVariant 内置的过滤模型。无论哪种策略，都应通过 IGV 可视化抽查过滤前后的变异，评估过滤效果。
:::

```bash
# GATK 硬过滤
gatk VariantFiltration -V variants.vcf.gz \
    --filter-expression "QD < 2.0" --filter-name "QD2" \
    --filter-expression "FS > 60.0" --filter-name "FS60" \
    --filter-expression "MQ < 40.0" --filter-name "MQ40" \
    -O filtered.vcf.gz
```

::: warning CNV 与 SNV 过滤的区别
CNV 检测的过滤策略与 SNV 完全不同。CNV 调用主要考虑片段大小、读段支持数、log2 ratio、段间差异等指标。CNV 工具（如 CNVkit、GATK gCNV）通常内置质量控制，输出置信度分数，过滤阈值需要根据实验设计调整。
:::

### 变异注释

变异注释为变异添加生物学和临床意义。注释内容主要包括基因位置（外显子、内含子、剪接位点、基因间区）、效应类型（同义、错义、无义、移码、剪接位点改变）、群体频率（gnomAD、1000 Genomes）、致病性（ClinVar、HGMD）、功能预测（SIFT、PolyPhen、CADD、REVEL）等。

**SnpEff** 预测变异效应类型，基于转录本注释判断变异对蛋白质的影响。SnpEff 内置多个物种的数据库，使用简单，对常见物种注释速度快。

**ANNOVAR** 支持多种数据库注释，灵活性高，可以同时注释数十种数据库。ANNOVAR 的表格型输出便于下游统计，是临床变异注释的常用工具。

**VEP**（Variant Effect Predictor）由 Ensembl 团队开发，功能全面且持续更新，支持自定义转录本集、参考基因组版本和多种注释源。VEP 是 ICGC、TCGA 等大型项目的标准注释工具。

致病性查询使用 **ClinVar** 数据库（NIH 维护的临床变异公共数据库），整合文献报道和提交者评估。对于罕见病诊断，HGMD（Human Gene Mutation Database）专业版提供更全面的致病变异收录。ACMG/AMP 指南定义了基于证据等级的变异分类标准（致病、可能致病、意义未明、可能良性、良性），是临床报告的金标准。

**致病性预测工具**对错义变异特别重要，因为错义变异在人类基因组中数量多、效应难以预测。**SIFT** 基于序列保守性预测，分数 <0.05 认为有害。**PolyPhen-2** 结合序列和蛋白质结构特征，分数 >0.85 认为可能有害。**CADD**（Combined Annotation Dependent Depletion）整合多个注释，给出单一分数，分数 >20 表示前 1% 最可能有害。**REVEL** 专门针对罕见病错义变异，集成多个工具的结果。**SpliceAI** 基于深度学习预测剪接位点改变，对深度内含子变异的剪接效应预测准确率高。

**ACMG/AMP 分类**需要综合多种证据：群体频率（PM2、PS4）、计算预测（PP3、BP4）、功能实验（PS3、BS3）、家系共分离（PP1、BS4）、新发变异（PS2）、de novo 比例（PM6）等。InterVar、Varsome 等工具提供半自动化 ACMG 分类，但最终分类需要人工审核。

```bash
# SnpEff 注释
snpEff -v GRCh38 variants.vcf.gz > annotated.vcf

# VEP 注释
vep -i variants.vcf.gz -o annotated.vcf \
    --cache --assembly GRCh38 --offline --everything --fork 4

# ANNOVAR 注释
table_annovar.pl variants.vcf humandb/ -buildver hg38 -out annotated \
    -protocol refGene,clinvar,gnomad_exome,dbnsfp42a \
    -operation g,f,f,f -nastring . -vcfinput
```

::: warning 注释数据库的版本
致病性分类和群体频率数据会随时间更新。例如 ClinVar 中变异的致病性判断可能在新证据出现后改变，gnomAD v2 到 v3 增加了更多人群样本。临床报告中应明确记录所用的数据库版本和注释日期，旧版本可能给出过时的结论。建议定期重新注释历史数据，跟踪变异分类的变化。
:::

### R 中操作 VCF 文件

**VariantAnnotation** 是 Bioconductor 中读取和注释 VCF 文件的核心包，支持按区间查询、按字段过滤、变异效应注释。

```r
library(VariantAnnotation)

# 读取 VCF 文件
vcf <- readVcf("variants.vcf.gz")
head(rowData(vcf))

# 提取特定区域的变异
which <- GRanges("chr1", IRanges(1000000, 2000000))
param <- ScanVcfParam(which = which)
vcf_region <- readVcf("variants.vcf.gz", param = param)

# 注释变异效应
txdb <- TxDb.Hsapiens.UCSC.hg38.knownGene::TxDb.Hsapiens.UCSC.hg38.knownGene
loc <- locateVariants(vcf, txdb, CodingVariants())
head(loc)

# 提取基因型信息
gt <- geno(vcf)$GT
table(gt[, 1])
```

VariantAnnotation 还提供 `predictCoding` 函数，可以预测变异对蛋白质序列的影响，输出氨基酸改变、密码子位置等信息。对于群体分析，可以配合 snpStats 包进行 GWAS 关联分析。

```r
# 预测变异对蛋白质的影响
library(VariantAnnotation)
library(TxDb.Hsapiens.UCSC.hg38.knownGene)
library(BSgenome.Hsapiens.UCSC.hg38)

txdb <- TxDb.Hsapiens.UCSC.hg38.knownGene
genome <- BSgenome.Hsapiens.UCSC.hg38

vcf <- readVcf("variants.vcf.gz", genome = "hg38")
coding <- predictCoding(vcf, txdb, seqSource = genome)

# 查看变异效应分布
table(coding$CONSEQUENCE)

# 提取错义变异
missense <- coding[coding$CONSEQUENCE == "nonsynonymous", ]
head(missense[, c("GENEID", "TXID", "REFAA", "VARAA", "PROTEINLOC")])
```

对于大规模 VCF 处理，**vcfR** 包提供高效的读写和操作接口，特别适合系统发育分析。**pheatmap**、**ggplot2** 配合 VCF 数据可以可视化变异分布、基因型热图、PCA 等。

```r
library(vcfR)
vcf <- read.vcfR("variants.vcf.gz", verbose = FALSE)

# 提取基因型矩阵
gt <- extract.gt(vcf)
dp <- extract.gt(vcf, element = "DP", as.numeric = TRUE)

# 计算样本间遗传距离
genetic_dist <- dist(t(gt), method = "binary")
# 聚类可视化
plot(hclust(genetic_dist), main = "样本遗传距离聚类")
```

## 2.4.7 比较基因组学与泛基因组

比较基因组学通过比较不同物种或个体的基因组揭示进化关系和功能差异。比较可以在多个层次进行：序列层级（核苷酸差异）、基因层级（基因家族扩张收缩）、结构层级（共线性、染色体重排）、变异层级（SNV 频率差异）。

### 全基因组比对

不同物种基因组比对需要处理基因顺序重排、染色体融合断裂、大规模重复等复杂情况。**MUMmer** 使用后缀树算法快速寻找最大精确匹配（Maximal Unique Match），适合近缘物种比对。MUMmer 包含多个子工具：nucmer 进行核酸水平比对、promer 进行蛋白质翻译水平比对（适合远缘）、delta-filter 过滤比对结果、show-coords 输出坐标对应关系、mummerplot 绘制点图。

**LASTZ** 使用种子扩展策略，适合远缘物种比对。LASTZ 支持多种种子模式（如 12-of-19 编码种子），可以提高远缘比对的灵敏度。LASTZ 是 UCSC 基因组浏览器 chain/net 比对流程的基础。

**MCScanX** 检测共线性区块，是微共线性分析的标准工具。共线性区块指多个基因在同源染色体上保持顺序和方向的区域，反映物种分化前的祖先染色体结构。MCScanX 输入是 BLAST 比对结果和 GFF 注释，输出共线性区块的基因对清单，可以可视化展示染色体间的共线性关系。

```bash
# MUMmer 全基因组比对
nucmer --maxmatch -p cmp reference.fasta query.fasta
delta-filter -m -i 90 -l 1000 cmp.delta > filtered.delta
show-coords -THrd filtered.delta > coords.txt
mummerplot --png -p dotplot filtered.delta

# MCScanX 共线性分析
MCScanX mcscanx_input
```

### 直系同源与基因家族

理解直系同源和旁系同源的概念对功能推断和进化分析至关重要。**直系同源基因**（Ortholog）由物种分化产生，通常保持相同功能。例如人和鼠的 TP53 基因互为直系同源，都编码 p53 蛋白参与 DNA 损伤应答。**旁系同源基因**（Paralog）由基因复制产生，功能可能分化。例如人 TP53 和 P73 互为旁系同源，都编码 p53 家族蛋白但功能有差异。

直系同源推断方法有两类：基于树的方法（如 OrthoFinder、PhyloTree）通过构建基因树推断分化事件；基于图的方法（如 OrthoMCL、ProteinOrtho）基于序列相似性聚类，速度快但精度稍低。

**OrthoFinder** 推断直系同源关系并构建基因树。工作流程包括：所有物种间两两蛋白质 BLAST 比对、基于相似性聚类成基因家族、构建每个家族的基因树、用基因树和物种树推断直系同源关系。OrthoFinder 输出详细的直系同源组、基因树、基因重复事件，是综合质量最高的工具。

**CAFE**（Computational Analysis of gene Family Evolution）分析基因家族扩张与收缩。基于 birth-death 模型，估计每个家族在系统发育树每个分支的扩张/收缩速率，识别快速进化的家族。CAFE5 重写为 C++ 实现，支持大数据集。

```bash
orthofinder -f proteins_dir/ -t 16 -S diamond
cafe5 -i gene_families.txt -t species_tree.nwk -p
```

### 泛基因组分析

泛基因组（Pan-genome）是一个物种所有个体基因组的并集，反映物种的完整遗传多样性。泛基因组分为 **核心基因组**（core genome，所有个体共有）、**辅助基因组**（accessory genome，部分个体拥有）和**特异基因**（unique gene，单个个体特有）。核心基因通常编码生命必需功能，辅助基因与适应性和环境响应相关。

**Roary** 是大规模细菌泛基因组分析的标准工具，基于 BLAST 比对和基因家族聚类，输出核心基因和辅助基因清单。Roary 速度快、内存占用合理，可以处理数千个细菌基因组。Roary 要求输入为 Prokka 注释的 GFF3 文件，所有基因组使用一致的注释流程。

**Panaroo** 在去噪方面表现更优，特别适合处理注释错误和基因流（gene flux）。Panaroo 使用图算法整合多个基因组的注释，能识别被 Roary 错误聚类的基因，对低质量注释数据更稳健。

**Heaps 定律**拟合判断泛基因组是开放型还是闭合型。Heaps 定律形式为 G(n) = κn<sup>α</sup>，其中 G(n) 是 n 个基因组的泛基因组大小，κ 是常数，α 决定增长速率。α < 1 表示泛基因组开放型，新增基因组仍会带来大量新基因；α > 1 表示泛基因组闭合型，新增基因组的边际收益递减。细菌泛基因组 α 通常在 0.3-0.8 之间开放型，部分宿主相关细菌呈闭合型。

真核生物泛基因组分析比细菌复杂得多。真核基因组尺寸大、重复序列多、基因家族复杂，基于基因聚类的 Roary/Panaroo 方法难以直接应用。**minigraph-cactus** 是较新的真核泛基因组构建工具，基于多基因组比对生成泛基因组图，可以处理大尺度结构变异。植物泛基因组项目（如水稻、小麦泛基因组）显示，辅助基因组占总基因组的 10-30%，与环境适应和抗病相关。

::: note 泛基因组 SNV 调用
泛基因组框架下的 SNV 调用可以避免参考偏倚。传统方法将所有样本比对到同一参考，缺失参考的序列无法被检测。泛基因组方法将每个样本比对到泛基因组图，可以在图的不同路径上调用变异，发现参考基因组缺失的插入变异。pggb、vg 等工具支持泛基因组级别的变异调用。
:::

```bash
# Roary 泛基因组构建
roary -e -n -p 16 -i 95 -cd 99 *.gff

# Panaroo 高质量泛基因组
panaroo -i *.gff -o panaroo_output --clean-mode strict -t 16
```

```python
import numpy as np
from scipy.optimize import curve_fit

def heaps_law(n, kappa, alpha):
    return kappa * n ** alpha

sample_sizes = np.array([5, 10, 20, 30, 50, 80, 100])
pan_genes = np.array([4500, 5200, 6000, 6500, 7200, 7800, 8100])

popt, _ = curve_fit(heaps_law, sample_sizes, pan_genes)
kappa, alpha = popt
print(f"Heaps 参数: kappa={kappa:.1f}, alpha={alpha:.3f}")
print(f"泛基因组类型: {'开放型' if alpha < 1 else '闭合型'}")
```

### 图泛基因组

线性参考基因组存在偏倚：样本中存在但参考基因组缺失的序列无法正确比对，称为参考偏倚（reference bias）。例如非洲血统样本中存在但 GRCh38 缺失的序列，会被丢弃或错误比对，造成变异频率估计偏低。

**图泛基因组**（Graph pan-genome）将所有已知变异整合到图结构中，节点表示序列片段，边表示连接关系。比对待测样本读段到图，可以选择最优路径，避免参考偏倚。例如人类泛基因组图包含所有已知 insertion/deletion，样本的 insertion 读段可以直接比对到图中的插入路径，无需特殊处理。

**minigraph** 快速构建图泛基因组。minigraph 将多个组装的基因组渐进式合并到图，每个新基因组的序列通过 minimizer 比对定位到图，新序列作为分支添加。minigraph 速度极快（人类泛基因组几小时构建），但生成的图较简单，不区分等位基因状态。

**vg**（variation graph）提供完整的图基因组工具包，支持图构建、索引、比对、变异检测。vg 使用 GFA 格式存储图，使用 GCSA2 索引支持图上的模式匹配，使用 gbwt 图算法支持单倍型路径索引。vg giraffe 是高效的图比对工具，速度接近 BWA-MEM 但能减少参考偏倚。

```bash
# minigraph 图泛基因组构建
minigraph -c -xggs reference.fasta assemblies.txt > graph.gfa

# vg 图比对
vg construct -r reference.fasta -v variants.vcf.gz > graph.vg
vg index -x graph.xg -g graph.gcsa graph.vg
vg giraffe -x graph.xg -g graph.gcsa -H graph.min \
    -d graph.dist -f R1.fq.gz -f R2.fq.gz > aligned.gam
```

::: tip 人类泛基因组参考
Human Pangenome Reference Consortium（HPRC）正在构建高质量人类泛基因组参考，2023 年发布了首批 47 个分相组装，覆盖全球主要人群多样性。基于图泛基因组的变异检测可以显著降低参考偏倚，特别是对非洲血统样本的 indel 检测灵敏度提升明显。
:::

### 选择信号分析

自然选择在基因组上留下可识别的特征。通过比较多群体或群体内个体的等位基因频率分布，可以推断哪些区域受到选择压力，进而理解适应进化机制。

**选择性清除**（Selective sweep）发生在有利突变被快速固定时，连带周围连锁区域一起固定，导致该区域遗传多样性降低、等位基因频率谱偏移、连锁不平衡延长。检测方法包括：**核苷酸多样性 π** 在受选择区域显著降低；**Tajima's D** 在受选择区域为负值（近期选择）或正值（平衡选择）；**F<sub>ST</sub>** 在分化群体间差异选择区域显著升高；**iHS**（integrated Haplotype Score）检测等位基因频率相近但单倍型长度差异的位点，反映正在进行的选择；**XP-EHH** 检测群体间固定程度差异，反映近期完成的选择。

**dn/ds 比值**（也称 Ka/Ks）是检测蛋白质编码基因选择压力的经典指标。dn 是非同义替换率，ds 是同义替换率。dn/ds < 1 表示纯化选择（大多数基因），dn/ds = 1 表示中性进化，dn/ds > 1 表示正选择。PAML codeml 可以在分支模型、位点模型、分支-位点模型下计算 dn/ds，检测特定谱系或位点上的正选择。

```bash
# 计算群体遗传学统计量（使用 vcftools）
vcftools --gzvcf variants.vcf.gz --keep population1.txt \
    --site-pi --out pop1_pi
vcftools --gzvcf variants.vcf.gz \
    --weir-fst-pop pop1.txt --weir-fst-pop pop2.txt \
    --out fst_pop1_pop2

# PAML 正选择分析
# 准备密码子比对和树文件后运行 codeml
codeml codeml.ctl
```

::: note 选择信号解读
单一统计量检测到的选择信号可能有其他解释（如人口瓶颈、突变率变化）。高质量研究通常综合多个统计量、多个群体，结合功能注释和表型数据验证。受选择区域的功能注释可以揭示适应机制，例如高海拔人群的 EPAS1 基因、乳业人群的 LCT 基因增强子。
:::

## 2.4.8 单倍型分析

单倍型反映同一条染色体上紧密连锁的等位基因组合。**单倍型分型**（Phasing）确定变异之间的相位关系，对于理解基因组功能、疾病遗传模式和群体历史具有重要意义。许多基因的表达调控依赖于顺式作用元件的相位，例如增强子和启动子的变异在顺式构型下才影响表达；隐性致病基因的复合杂合需要分型才能正确判断是否致病。

### 分型方法

分型方法分为实验方法和计算方法两类。实验方法直接通过物理手段分离或区分两条单倍型，计算方法基于统计或读段信息推断相位。

**长读长分型**利用 PacBio HiFi 或 Nanopore 读段跨越多个变异位点的特性，直接确定相位。一条 15kb 的 HiFi 读段在一般多样性区域可以跨越数十个 SNV，这些 SNV 的相位关系可以直接读出。**WhatsHap** 使用读段覆盖图算法，将多条长读段链起来生成单倍型块。WhatsHap 对错误率不敏感，即使 ONT 较高错误率也能稳定分型，因为变异位点已经是高置信度的 SNV。

**Hi-C 分型**利用 Hi-C 数据的顺式偏好（同一条染色体相互作用频率高于不同染色体，同一等位基因相互作用频率高于不同等位基因），统计每对变异的 Hi-C 读段支持，推断相位。Hi-C 数据覆盖范围广，可以将分型块延伸到染色体级别。

** trio 分型**通过家系数据确定相位。对于一对父母-子代 trio，子代的杂合变异可以从父母的基因型推断：父亲杂合而母亲纯合时，子代从父亲继承的等位基因可以确定。Trio 分型是最可靠的方法，但需要家系样本。

**统计推断分型**基于群体连锁不平衡信息，使用 **SHAPEIT**、**Beagle**、**Eagle** 等工具。这些工具使用隐马尔可夫模型，将目标样本的变异与参考面板（reference panel）比较，从最相似的参考单倍型组合中拼接出目标样本的相位。统计分型需要参考面板，分型长度受 LD 衰减距离限制，通常为几十 kb 到几百 kb。

```bash
# WhatsHap 长读长分型
whatshap phase --reference reference.fasta \
    --output phased.vcf.gz variants.vcf.gz aligned_longread.bam

# SHAPEIT5 统计分型
shapeit5 --input variants.vcf.gz --reference reference.fasta \
    --map genetic_map.txt --region chr1:1-250000000 \
    --output phased.vcf.gz --thread 16
```

::: warning 统计分型的局限
统计分型在 LD 较弱的区域（如重组热点）会断开成多个块，无法生成连续的单倍型。对于罕见变异，参考面板中可能找不到合适的模板，分型错误率高。长读长和 Hi-C 分型可以弥补这些局限，是高质量分型的优选。
:::

### 分型质量评估

**Switch error rate** 衡量相邻位点相位翻转的比例，应低于 1%。Switch error 指分型在某位点切换到错误的单倍型，后续位点继续在该错误单倍型上。例如真实相位 0|1 0|1 0|1 1|0 1|0，如果分型为 0|1 0|1 1|0 1|0 1|0，则在第三个位点发生 switch error。

**Hamming error rate** 衡量单点错误率，每个位点的相位独立判断。**N50 分型长度** 衡量分型连续性，理想情况下应达到染色体级别。**NG50** 是考虑基因组大小的 N50 变体。

评估分型质量的标准方法是使用 trio 数据作为真值，对比统计或长读长分型与 trio 分型的差异。无 trio 时可以使用 WhatsHap compare 比较长读长分型和统计分型的一致性。

### 单倍型解析组装

**单倍型解析组装**（Haplotig-resolved assembly）直接产出两套单倍型序列，避免等位基因混合。传统组装将两条同源染色体的序列合并为一套，杂合区域会折叠或保留为冗余 contig，丢失相位信息。单倍型解析组装保留两套完整单倍型，更适合变异检测和功能研究。

**HiCanu** 针对 PacBio HiFi 数据在组装过程中区分单倍型。HiFi 数据的高准确率使杂合位点的两条单倍型读段可以准确区分，HiCanu 在 de Bruijn 图中保留两条单倍型路径，分别组装成两套 contig。**Hifiasm** 也是 HiFi 数据的高质量单倍型解析组装器，并支持结合 Hi-C 数据生成染色体级别的分相组装。

**DipAsm** 结合长读长和 Hi-C 数据实现染色体级分相组装。先用长读长组装生成 contig，再用 Hi-C 数据将 contig 挂载到染色体，并通过 Hi-C 信号区分两个单倍型的 contig。

**Trio-binning** 利用 trio 信息将读段按父母来源分桶，分别组装父母来源的单倍型。Trio-binning 在人类高质量组装中应用广泛，HPRC 项目大量使用 trio-binning 与 HiFi 数据生成高质量分相参考。

```bash
# HiCanu 分相组装
canu -p asm -d hicaru_output genomeSize=3g \
    -pacbio-hifi pacbio_hifi.fasta.gz maxInputCoverage=200

# Hifiasm 结合 Hi-C
hifiasm -o asm -t 32 --hi-c hic_read1.fq.gz --hi-c hic_read2.fq.gz \
    pacbio_hifi.fasta.gz
```

### 等位基因特异性表达

**等位基因特异性表达**（Allele-Specific Expression，ASE）指两个等位基因表达水平不一致的现象。ASE 可以反映顺式调控变异的影响，对理解杂合变异的功能效应很重要。ASE 检测需要先确定杂合位点，然后统计 RNA-seq 中每个等位基因的读段数量，使用二项检验或 beta-binomial 检验判断是否存在偏向。

二项检验假设读段随机从两个等位基因采样，比例应为 50:50。但实际 RNA-seq 存在 read 长度、位置、map 偏倚，造成系统性偏差，需要使用 WASP 等工具校准。beta-binomial 模型额外考虑过离散（over-dispersion），对样本间变异和读段间相关性更稳健。

```python
from scipy.stats import binomtest

def test_ase(ref_count, alt_count, min_count=10, p_threshold=0.05):
    total = ref_count + alt_count
    if total < min_count:
        return None
    result = binomtest(ref_count, total, 0.5)
    p_value = result.pvalue
    ref_ratio = ref_count / total
    is_ase = p_value < p_threshold and abs(ref_ratio - 0.5) > 0.2
    return {"ref_ratio": ref_ratio, "p_value": p_value, "is_ase": is_ase}

for ref, alt in [(85, 15), (55, 45), (120, 30)]:
    result = test_ase(ref, alt)
    if result:
        status = "ASE" if result["is_ase"] else "非 ASE"
        print(f"Ref:{ref} Alt:{alt} 比例:{result['ref_ratio']:.2f} {status}")
```

::: warning ASE 检测的偏倚来源
ASE 检测易受多重偏倚影响：参考偏倚（read 更易比对到参考等位基因）、map 质量偏倚（变异 read 被过滤）、读段位置偏倚（变异位于 read 末端更易出错）。WASP 等工具通过比对模拟和数据置换校准这些偏倚。ASE 结果应经过 IGV 可视化验证关键位点。
:::

## 2.4.9 分析流程与工作流

基因组学分析涉及多个步骤的组合，工作流管理系统将分析步骤定义为可执行流程，实现自动化、标准化和可重复。手工执行多步骤流程容易出错：忘记参数、版本不一致、中间文件管理混乱、无法重现结果。工作流系统通过代码定义流程，解决这些问题。

现代基因组学项目数据量大、步骤多、参与者众，工作流管理已经成为必备能力。一份典型的人类 WGS 数据分析从原始数据到最终报告涉及数十个工具调用、上百个中间文件，没有工作流系统几乎无法可靠管理。工作流系统还支持断点续跑、并行执行、资源调度，对大规模项目至关重要。

### 典型 WGS 流程

标准 WGS 流程包括质控、比对、排序标记重复、BQSR 碱基质量校准、变异检测和注释。**GATK Best Practices** 是目前最广泛使用的标准流程，但具体参数需要根据物种、样本类型和数据质量调整。

BQSR（Base Quality Score Recalibration）是 GATK 流程的特色步骤。原理是：测序仪报告的碱基质量分数存在系统偏差，可以通过统计观察错误率校准。BQSR 收集已知变异位点之外的所有 **应该与参考一致** 位置的碱基，按机器循环、前后碱基上下文、质量分数分组，统计每组观察到的错误率，重新计算校准后的质量分数。BQSR 需要已知变异集（如 dbSNP）作为掩码，否则真实变异会被当作错误。

```bash
# 1. 质控
fastp -i R1.fq.gz -I R2.fq.gz -o clean_R1.fq.gz -O clean_R2.fq.gz

# 2. 比对
bwa mem -t 16 reference.fasta clean_R1.fq.gz clean_R2.fq.gz | \
    samtools view -bS - > aligned.bam

# 3. 排序标记重复
samtools sort -@ 8 -o sorted.bam aligned.bam
picard MarkDuplicates I=sorted.bam O=dedup.bam M=metrics.txt
samtools index dedup.bam

# 4. BQSR
gatk BaseRecalibrator -I dedup.bam -R reference.fasta \
    --known-sites dbsnp.vcf.gz -O recal.table
gatk ApplyBQSR -I dedup.bam -R reference.fasta \
    --bqsr-recal-file recal.table -O recalibrated.bam

# 5. 变异检测
gatk HaplotypeCaller -R reference.fasta -I recalibrated.bam \
    -O sample.g.vcf.gz -ERC GVCF
```

流程中每一步都有其必要性。质控去除接头和低质量碱基避免引入假阳性；排序方便后续按位置访问；MarkDuplicates 消除 PCR 重复避免等位基因频率偏差；BQSR 校准碱基质量使变异检测的统计模型更准确；HaplotypeCaller 通过局部组装发现 indel。这些步骤前后依赖，跳过任何一步都会影响最终质量。

### 工作流语言

**Snakemake** 使用 Python 风格的规则定义分析步骤，通过文件名模式匹配自动确定依赖关系。每条规则定义输入、输出和执行命令，Snakemake 根据目标文件反推需要执行的规则和顺序。Snakemake 支持并行执行、断点续跑、Conda 集成、容器集成、云端执行等高级特性。Snakemake 的优势是与 Python 生态无缝集成，可以编写复杂的逻辑判断和数据处理。

**Nextflow** 使用 Groovy DSL，支持多种执行平台（local、SLURM、AWS Batch、Google Cloud、Kubernetes）和容器集成。Nextflow 的 channel 模型适合处理大量样本的并行流，社区提供了大量预构建的流水线（nf-core）可以复用。

**WDL**（Workflow Description Language）与 Terra 平台紧密集成，由 Broad Institute 开发，GATK 流程的官方 WDL 实现可以直接在 Terra 上运行。

**CWL** 是开放标准强调可移植性，支持多种执行引擎，适合跨平台工作流共享。

```python
# Snakemake 工作流示例 (Snakefile)
rule all:
    input:
        "results/variants/sample.vcf.gz"

rule align:
    input:
        r1="clean/{sample}_R1.fq.gz",
        r2="clean/{sample}_R2.fq.gz",
        ref="reference.fasta"
    output:
        bam="results/aligned/{sample}.bam"
    shell:
        "bwa mem -t 16 {input.ref} {input.r1} {input.r2} | "
        "samtools sort -@ 8 -o {output.bam}"

rule variant_call:
    input:
        bam="results/aligned/{sample}.bam",
        ref="reference.fasta"
    output:
        vcf="results/variants/{sample}.vcf.gz"
    shell:
        "gatk HaplotypeCaller -R {input.ref} -I {input.bam} -O {output.vcf}"
```

工作流语言的核心价值在于将分析过程代码化。代码化的流程可以版本控制、同行评审、跨平台复现，这是手工流程无法实现的。研究论文中报告流程代码已经成为越来越多期刊的要求。

### 工作流测试与可重复性

工作流的可重复性需要从多个层面保证。**版本固定**是最基本的要求，包括工具版本、数据库版本、参考基因组版本。Docker/Singularity 镜像通过 SHA256 标签固定工具版本；参考基因组应记录版本号（如 GRCh38.p14）和获取来源；数据库（如 dbSNP、gnomAD）应记录发布版本。

**工作流测试**确保流程修改不会破坏已有功能。常见的测试策略包括：使用小型测试数据集快速运行完整流程，验证输出格式和基本指标；使用已知结果的基准数据集，对比新流程与历史结果的一致性；使用随机的子集数据验证流程的健壮性。nf-core 等社区项目建立了完善的测试框架，每个工作流都附带测试数据和自动化测试脚本。

**CI/CD**（持续集成/持续部署）将测试自动化。每次工作流代码更新后，GitHub Actions、GitLab CI 等系统自动运行测试套件，只有通过测试的更改才能合并到主分支。这种实践在软件开发中已成熟，但在生信工作流中尚未普及，是提升流程质量的重要手段。

**数据管理**是可重复性的关键环节。大型数据集（如 TCGA、UK Biobank）需要记录获取日期、过滤条件、预处理步骤。中间文件应保留可追溯的生成命令，最终结果应关联到具体的工作流版本和参数配置。Research Data Management 系统可以帮助管理数据生命周期。

::: tip 可重复性清单
发表基因组学研究时建议准备可重复性清单：工作流代码仓库地址和版本号、Docker/Singularity 镜像地址、参考基因组和数据库版本、原始数据 accession number、关键参数设置、运行环境（OS、内存、CPU）。这些信息使读者可以完整复现分析。
:::

### 容器化与云平台

软件安装和版本管理是基因组学分析的痛点。不同工具依赖不同版本的库，直接安装容易冲突；不同版本的同一工具可能产生不同结果，可重复性受影响。**容器化**将软件及所有依赖打包到镜像中，确保跨环境一致运行。

**Docker** 是最流行的容器技术，但 Docker 需要 root 权限，在高性能计算集群上不安全。**Singularity**（现名 Apptainer）专为高性能计算设计，无需 root 权限即可运行容器，支持从 Docker 镜像转换。**Conda** 是轻量级的环境管理工具，不需要 root 权限，但隔离性不如容器。

云平台为基因组学提供计算资源和预配置环境。**Terra.bio** 原生支持 WDL 工作流，由 Broad Institute 维护，提供 GATK、FireCloud 等工具的云端运行。**DNAnexus** 和 **Seven Bridges** 提供预配置的基因组学分析环境，适合临床和研究使用。**AWS HealthOmics** 和 **Google Cloud Life Sciences** 是云厂商提供的生信专用服务，按使用量计费。

```bash
# Docker 容器化运行 BWA
docker run --rm -v /data:/data biocontainers/bwa:v0.7.17 \
    bwa mem -t 16 /data/reference.fasta /data/R1.fq.gz /data/R2.fq.gz

# Singularity 运行 GATK
singularity exec --bind /data:/data docker://broadinstitute/gatk:4.4.0.0 \
    gatk HaplotypeCaller -R /data/reference.fasta -I /data/aligned.bam \
    -O /data/variants.vcf.gz
```

::: warning 基因组数据安全
基因组数据高度敏感，分享前需要去标识化。但基因组序列本身具有高度可识别性，完全匿名化几乎不可能：仅需约 30-100 个独立 SNV 就能在群体中唯一识别一个人，结合家系信息更容易识别。受控访问机制（如 dbGaP、EGA）通过审批和数据使用协议保护数据安全，申请过程通常需要数周。基因组数据的存储和传输需要遵守相关法规（如 HIPAA、GDPR、人类遗传资源管理条例），研究方案需要伦理委员会审批和知情同意。

数据安全还包括技术层面的保护：传输使用加密协议（HTTPS、SFTP），存储使用磁盘加密，访问实行最小权限原则，定期审计访问日志。云端分析时需要确认云服务商的合规认证（如 HIPAA BAA、FedRAMP），避免数据出境问题。这些措施虽然增加分析复杂度，但对保护参与者隐私至关重要。
:::

---

::: note 本节来源
本节内容由原 reStructuredText 文件迁移而来。如需查看原始 Sphinx 版本，请参考项目源码中的 .rst 文件。
:::

## 练习题

### 第1题 概念理解

某研究者在 30X 人类全基因组测序数据中发现约 5% 的基因组区域完全没有 reads 覆盖，而 Lander-Waterman 理论预测 30X 深度下理论覆盖度应达到 99.9985%。解释理论预测与实际结果差异的原因，并说明这些覆盖盲区对变异检测的影响。

::: details 参考答案
Lander-Waterman 理论基于泊松分布假设 reads 在基因组上均匀随机分布，但实际测序和比对过程存在多种偏倚。GC 含量极端区域（如高 GC 启动子、AT 富集区）的 PCR 扩增效率低，导致覆盖度下降。重复序列区域（如着丝粒、端粒、片段重复）的 reads 无法唯一比对，被比对工具过滤。某些区域因参考基因组组装缺口或 ALT contig 而无法访问。覆盖盲区中的变异无法检测，造成系统性漏检，特别是结构变异和重复区域变异。长读长测序（PacBio HiFi、ONT）可以部分弥补这些盲区，因为长读段能跨越重复区域并减少 GC 偏倚。
:::

### 第2题 参数分析

某研究者对一种非模式哺乳动物（基因组约 2.5Gb）进行全基因组重测序，该物种没有 dbSNP 或已知变异数据库。研究者直接运行 GATK HaplotypeCaller 后应用 VQSR 过滤，结果 VQSR 训练失败或过滤效果极差。分析原因，并说明非模式物种的变异过滤应采用何种策略。

::: details 参考答案
VQSR 需要大量已知高置信变异作为训练集（人类至少需要数千个真阳性和数百个假阳性），通过高斯混合模型学习真变异与假变异的特征分布。非模式物种缺乏已知变异集，GMM 训练数据不足，模型无法收敛或泛化能力差。非模式物种应采用硬过滤策略，根据 GATK Best Practices 推荐的 QD < 2.0、FS > 60.0、MQ < 40.0、SOR > 3.0、ReadPosRankSum < -8.0、MQRankSum < -12.5 等阈值过滤。更稳妥的做法是先用 HaplotypeCaller 调用一批变异，从中筛选高置信位点（如深度适中、质量高、无链偏倚）作为临时训练集，再运行 VQSR。也可以用 DeepVariant 等基于神经网络的工具，其对训练集的依赖相对较低。BQSR 同样面临类似问题，可先用第一轮调用的变异集作为已知位点。
:::

### 第3题 概念理解

研究者在分析非洲血统样本的变异时发现，与欧洲血统样本相比，变异检测灵敏度降低，特别是 indel 的检出率明显偏低。解释这一现象的原因，并说明图泛基因组如何缓解该问题。

::: details 参考答案
线性参考基因组存在参考偏倚。GRCh38 主要基于欧洲血统样本构建，非洲血统样本中存在但参考缺失的序列无法正确比对，相关变异无法检出。reads 比对到参考时倾向于匹配参考等位基因，导致非参考等位基因的 reads 比对质量下降被过滤，等位基因频率估计偏低。indel 涉及插入或缺失，参考缺失的插入变异在比对中表现为大 gap，更容易被过滤。图泛基因组将所有已知变异整合到图结构中，节点表示序列片段，边表示连接关系。比对待测样本 reads 到图时可以选择最优路径，参考缺失的插入序列有对应路径，reads 能正确比对。HPRC 人类泛基因组参考显示，基于图的变异检测对非洲血统样本的 indel 灵敏度提升明显。图泛基因组不能完全消除参考偏倚，但能显著降低其影响。
:::

## 常见错误

**错误 1 · 变异位点坐标在 dbSNP 或 ClinVar 中查不到，VEP 注释结果显示变异位于基因间区**

原因：参考基因组版本不一致。比对使用 GRCh38（hg38）但注释数据库使用 GRCh37（hg19）的坐标，或反之。GRCh37 到 GRCh38 之间不仅有坐标偏移，还有补丁、修正和 ALT contig 调整，同一变异在两个版本中的位置可能相差数千碱基。整个流程中任一环节版本不匹配都会导致坐标错位。

解决：全流程使用同一版本参考基因组。FASTA 参考、GTF 注释、dbSNP、gnomAD、ClinVar、已知变异集（用于 BQSR）必须版本一致。在样本元数据中记录参考基因组版本号（如 GRCh38.p14），分析前用 `samtools view -H` 检查 BAM 头部的 @SQ 字段确认染色体命名（chr1 vs 1）和长度。跨版本比较时使用 UCSC LiftOver 或 NCBI Remap 转换坐标。

**错误 2 · FastQC 报告 Per base sequence quality 全部红色警告，质量分数普遍低于 20**

原因：FASTQ 质量编码误判。Illumina 1.8 之前的部分版本使用 Phred+64 编码，而当前主流平台和工具默认 Phred+33。工具按错误编码解析时，Q30 的碱基被读为极低分数，触发全线红色警告。旧版 Solexa/Illumina 数据混入新流程时容易出现该问题。

解决：查看 FastQC 报告的 Basic Statistics 模块，其中 Encoding 字段标注检测到的编码格式。若自动识别错误，在工具中显式指定编码：fastp 用 `--phred33` 或 `--phred64`，Trimmomatic 在命令行参数中指定 `-phred33` 或 `-phred64`。旧版 Solexa 数据需要先用 maq 等工具转换为 Phred 格式。

**错误 3 · bwa index 人类基因组时进程被 kill，或比对过程报 Segmentation fault**

原因：BWA 索引算法选择不当。`bwa index` 默认使用 `-a is` 算法，适用于小于 2GB 的小基因组（如细菌、病毒），人类基因组（约 3Gb）使用该算法会内存溢出。比对阶段如果索引文件不完整或内存不足，也会出现段错误。

解决：人类和大基因组使用 `-a bwtsw` 算法：`bwa index -a bwtsw reference.fasta`。该算法基于 BWT-SW，对大基因组内存友好，但需要约 5GB 内存。索引完成后确认生成 5 个文件（.bwt、.pac、.ann、.amb、.sa），缺一不可。比对时 BWA-MEM 人类基因组约需 4GB 内存，长读长比对（minimap2）内存占用类似。集群环境通过 SLURM 或 SGE 申请足够内存，避免 OOM killer 终止进程。

**错误 4 · GATK BaseRecalibrator 报错或 BQSR 后变异检测灵敏度无提升**

原因：BQSR 缺少已知变异位点。BQSR 的原理是统计已知变异位点之外的位置的观察错误率，重新校准碱基质量。没有已知变异集时，真实变异被当作测序错误参与校准，导致真实变异的质量分数被压低，假变异的质量分数被抬高，校准起反作用。非模式物种或新测序物种常遇到此问题。

解决：提供已知变异集 VCF 文件作为 `--known-sites` 参数。人类使用 dbSNP、Mills indel、1000 Genomes known sites。非模式物种可分两轮运行：第一轮 HaplotypeCaller 调用变异，筛选高置信位点（深度 10-100、QD > 2、无链偏倚）作为已知集；第二轮用该已知集运行 BQSR。如果物种完全没有先验信息，可以跳过 BQSR，直接用硬过滤，对最终结果影响有限。
