---
title: 2.3 序列分析与比对
sidebar:
  order: 3
---
# 2.3 序列分析与比对

序列分析与比对是生物信息学的核心方法。从一条DNA序列的碱基组成，到两条序列的相似性比对，再到多条序列的进化关系推断，这些方法贯穿生物信息学研究的各个环节。当你拿到一条新的测序序列，无论是从实验中获得还是从数据库下载，第一件事通常是分析它的基本特征，包括长度、碱基组成、GC含量、是否含有开放阅读框等。这些特征决定了后续分析策略的选择。例如，GC含量异常的序列可能来自不同物种的污染，含有完整ORF的序列才可能是蛋白质编码基因。

随后，你需要将这条序列与已知序列进行比较，判断它的功能与进化来源。比较两条序列时使用双序列比对，比较多条序列时使用多序列比对。基于多序列比对结果，可以构建系统发育树、发现保守基序、检测自然选择。本章系统介绍序列特征解析、双序列比对、多序列比对、基序与结构域发现、分子进化分析等内容，并给出R语言（Biostrings、msa、ape）与Python（Biopython）的实现示例。

序列分析在不同研究领域的应用重点有所不同。在**基因组学**中，序列比对用于基因注释、基因组组装验证和比较基因组学；在**转录组学**中，短读长比对是RNA-seq表达定量和差异分析的基础；在**蛋白质组学**中，结构域分析和序列比对用于功能注释和同源建模；在**进化生物学**中，系统发育分析揭示物种和基因的进化历史；在**医学基因组学**中，序列比对用于变异检测和临床诊断。不同应用对算法的精度、速度和参数选择有不同要求，理解算法原理有助于根据具体需求选择合适工具。

本章的内容组织遵循从基础到应用的逻辑：先介绍单序列特征解析（2.3.1），再讲双序列比对（2.3.2），然后扩展到多序列比对（2.3.3），接着是基序与结构域发现（2.3.4），最后是分子进化分析（2.3.5）和特殊应用（2.3.6、2.3.7）。每一节都先讲解概念和算法原理，再给出代码示例，便于读者理论与实践结合。建议读者按顺序学习，也可以根据需要跳转到特定章节。

## 2.3.1 序列特征解析

序列特征解析是对单条序列进行基本性质分析的过程，是后续比对与功能分析的基础。碱基组成、GC含量、开放阅读框、重复序列等特征会直接影响分析策略的选择与结果解读。在开始任何比对或功能分析之前，先了解序列本身的性质，可以避免许多常见错误，例如将低复杂度区域误认为同源信号、在错误的阅读框下翻译蛋白质、忽略模糊碱基导致的比对偏差等。

### 碱基组成与GC含量

GC含量指序列中G和C碱基所占的百分比，是描述基因组特征的基本参数之一。不同物种的基因组GC含量差异显著，人类基因组约为41%，某些细菌可超过70%，而疟原虫等原生动物的GC含量可低至20%以下。同一基因组内不同区域的GC含量也存在差异，基因密集区往往GC含量较高，启动子和CpG岛附近的GC含量尤其突出，这种分布不均匀性是基因预测和功能元件识别的重要线索。

GC含量影响DNA的物理化学性质。GC碱基对之间有三个氢键，而AT碱基对只有两个，因此GC含量高的DNA分子更稳定，熔解温度（Tm）也更高。Tm值的经验估算公式为 Tm = 64.9 + 41 × (G+C-16.4) / (A+T+G+C)，更精确的最近邻法考虑了碱基堆积效应。引物设计时需要保证GC含量在40-60%之间，以获得合适的退火温度；长片段PCR的GC含量过低会导致扩增效率下降。

GC偏斜度定义为（G-C）/（G+C），AT偏斜度定义为（A-T）/（A+T）。在细菌基因组中，复制起始点附近的GC偏斜度会发生显著变化，前导链G富集而C贫乏，后随链反之，这一规律被用于预测复制起始点和终止点。在真核生物中，链不对称性同样存在，与转录方向和复制机制相关。

```python
from Bio.SeqUtils import gc_fraction
from Bio.Seq import Seq

seq = Seq("ATGGAGGAGCCGCAGTCAGATCCTAGCGTCGAGCCCCCTCTGAGTCAGGAAACATTTTCAGACCTATGGAAACTACTTCCTGAAAACAACGTTCTGTCCCCCTTGCCGTCCCAAGCAATGGATGATTTGATGCTGTCCCCGGACGATATTGAACAATGGTTCACTGAAGACCCAGGTCCAGATGA")

gc_content = gc_fraction(seq) * 100
g_count = seq.count('G')
c_count = seq.count('C')
a_count = seq.count('A')
t_count = seq.count('T')
gc_skew = (g_count - c_count) / (g_count + c_count)
at_skew = (a_count - t_count) / (a_count + t_count)

print(f"GC含量: {gc_content:.2f}%")
print(f"GC偏斜度: {gc_skew:.4f}")
print(f"AT偏斜度: {at_skew:.4f}")
```

R语言中可以使用Biostrings包完成同样的分析。Biostrings是Bioconductor生态中处理生物序列的核心包，支持DNAString、RNAString、AAString等序列类，并提供高效的字符串操作和模式匹配功能。

```r
library(Biostrings)

seq <- DNAString("ATGGAGGAGCCGCAGTCAGATCCTAGCGTCGAGCCCCCTCTGAGTCAGGAAACATTTTCAGACCTATGGAAACTACTTCCTGAAAACAACGTTCTGTCCCCCTTGCCGTCCCAAGCAATGGATGATTTGATGCTGTCCCCGGACGATATTGAACAATGGTTCACTGAAGACCCAGGTCCAGATGA")

base_freq <- alphabetFrequency(seq, baseOnly = TRUE)
gc_content <- (base_freq["G"] + base_freq["C"]) / sum(base_freq) * 100
gc_skew <- (base_freq["G"] - base_freq["C"]) / (base_freq["G"] + base_freq["C"])

cat(sprintf("GC含量: %.2f%%\n", gc_content))
cat(sprintf("GC偏斜度: %.4f\n", gc_skew))
```

::: tip 滑动窗口分析GC含量
对于长序列，整体GC含量可能掩盖局部变异。使用滑动窗口计算每个窗口的GC含量，可以识别GC富集区（如CpG岛）和AT富集区（如复制起始点）。窗口大小通常选择500bp到数kb，步长可设为窗口大小的一半。Biostrings的`slidingWindow`函数和自定义脚本均可实现这一分析。
:::

### 开放阅读框预测

开放阅读框（ORF）是从起始密码子ATG到终止密码子（TAA、TAG、TGA）之间的连续编码区域。ORF预测是基因预测的基础，需要同时考虑六种阅读框（正链三种、负链三种）。每种阅读框对应于从序列的不同位置开始按三联体密码子读取，正链的frame 0从位置0开始，frame 1从位置1开始，frame 2从位置2开始，负链的阅读框则在反向互补链上同理定义。

原核生物的ORF通常直接对应蛋白质编码基因，基因密度高，识别相对简单。真核生物则需要考虑剪接位点，外显子-内含子边界遵循GT-AG规则（5'端GT供体位点，3'端AG受体位点），完整的基因结构需要通过隐马尔可夫模型或神经网络等复杂算法预测，常用工具包括AUGUSTUS、GeneMark、GlimmerHMM等。

判断ORF是否为真实基因，长度是一个重要指标。随机序列中出现长度超过100个密码子（300bp）ORF的概率很低，因此较长ORF更可能是真实基因。此外还可以参考编码区的统计学特征，如密码子使用偏好性（真实基因的密码子使用具有物种特异性偏好，由tRNA丰度决定）、GC含量三周期性（编码区密码子第三位GC含量通常与第一位和第二位不同）、六聚体频率（编码区的六核苷酸频率与非编码区差异显著）等。

真核生物基因预测比原核生物复杂得多，需要考虑外显子-内含子结构。AUGUSTUS使用广义隐马尔可夫模型（GHMM），同时建模外显子、内含子、间区序列和各类剪接信号；GeneMark结合GeneMark.hmm和GeneMark.EXE，前者用于自训练HMM，后者用于外显子预测；GlimmerHMM专注于真核基因预测，整合了剪接位点预测和外显子打分。这些工具通常需要训练物种特异参数，或使用预训练模型。对于新测序物种，可以先用 BRAKER1 等工具结合RNA-seq数据进行训练，提高预测精度。

::: note 基因预测的策略选择
基因预测分为从头预测（ab initio）和基于证据的预测两类。从头预测仅基于序列统计特征，适合无注释参考的新物种，但精度有限。基于证据的预测整合转录组数据（RNA-seq、EST）、蛋白质同源、保守性等多源信息，精度显著提高。MAKER和BRAKER2是整合多种证据的常用流程。对于高质量注释，建议结合多种方法的结果，使用EVidenceModeler等工具进行整合，得到一致性基因集。
:::

```python
from Bio.Seq import Seq

dna_seq = Seq("ATGGAGGAGCCGCAGTCAGATCCTAGCGTCGAGCCCCCTCTGAGTCAGGAAACATTTTCAGACCTATGGAAACTACTTCCTGAAAACAACGTTCTGTCCCCCTTGCCGTCCCAAGCAATGGATGATTTGATGCTGTCCCCGGACGATATTGAACAATGGTTCACTGAAGACCCAGGTCCAGATGATAGCTGA")

stop_codons = ['TAA', 'TAG', 'TGA']

for strand, seq in [('+', dna_seq), ('-', dna_seq.reverse_complement())]:
    for frame in range(3):
        orf_start = None
        for pos in range(frame, len(seq) - 2, 3):
            codon = str(seq[pos:pos+3])
            if codon == 'ATG' and orf_start is None:
                orf_start = pos
            elif codon in stop_codons and orf_start is not None:
                orf_len = pos + 3 - orf_start
                if orf_len >= 150:
                    protein = seq[orf_start:pos+3].translate()
                    print(f"链{strand} 阅读框{frame}: ORF位置 {orf_start}-{pos+3}, 长度{orf_len}bp, 蛋白质长度{len(protein)-1}aa")
                orf_start = None
```

::: warning 起始密码子的多样性
虽然ATG是最常见的起始密码子，但某些生物使用非标准起始密码子，如细菌中的GTG、TTG，线粒体中的ATA、ATT。这些非ATG起始密码子在翻译时仍读为甲硫氨酸。Predicting真实的翻译起始位点需要考虑Shine-Dalgarno序列（原核生物）或Kozak序列（真核生物）等上游信号。
:::

### 序列转换与模糊碱基

序列转换包括互补、反向和反向互补三种操作。互补操作将A与T互换、G与C互换；反向操作将序列从右到左重新排列；反向互补是反向后再互补。设计PCR引物时需要获取模板链的反向互补链序列，因为引物的方向决定了扩增的链。转录时需要将DNA编码链转换为RNA序列（T替换为U）。

IUPAC模糊码用于表示碱基位置的不确定性，在处理测序数据、设计简并引物和表示多态性位点时常用。N表示任意碱基（A、T、C、G），R表示嘌呤（A或G），Y表示嘧啶（C或T），S表示强氢键碱基（G或C），W表示弱氢键碱基（A或T），K表示酮基碱基（G或T），M表示氨基碱基（A或C），B表示非A（C、G、T），D表示非C，H表示非G，V表示非T。简并引物设计时，根据同源比对中各位点的保守性选择适当的IUPAC码，可以在一次反应中扩增多个同源序列。

```r
library(Biostrings)

seq <- DNAString("ATGGAGGAGCCGCAGTCAGATCCTAGCG")

complement_seq <- complement(seq)
reverse_seq <- reverse(seq)
rev_comp <- reverseComplement(seq)

cat("原始序列:  ", as.character(seq), "\n")
cat("互补序列:  ", as.character(complement_seq), "\n")
cat("反向互补:  ", as.character(rev_comp), "\n")

# 翻译为蛋白质
protein <- translate(seq)
cat("翻译蛋白:  ", as.character(protein), "\n")
```

::: note IUPAC模糊码的存储
处理含模糊碱基的序列时，Biostrings会自动处理IUPAC码。`matchPattern`和`vmatchPattern`函数支持模糊匹配，例如 `matchPattern("GART", seq)` 会匹配GAAT、GAGT、GAAT等所有符合IUPAC码的可能。但需要注意，含有过多N的序列在比对和功能分析中可能产生问题，通常建议在分析前过滤或mask。
:::

### 蛋白质理化性质

等电点（pI）是蛋白质净电荷为零时的pH值，分子量是所有氨基酸残基的质量之和。这两个参数在蛋白质纯化（等电聚焦、离子交换层析）和质谱鉴定中必不可少。等电聚焦利用pH梯度分离不同pI的蛋白质，离子交换层析则根据净电荷差异实现分离。质谱鉴定中，理论分子量与实测分子量的比对可以验证蛋白质身份。

蛋白质的稳定性与氨基酸组成密切相关。疏水性氨基酸（Ala、Val、Leu、Ile、Phe、Trp、Met）富集于蛋白质核心或跨膜区域，亲水性氨基酸（Asp、Glu、Lys、Arg、Ser、Thr）多分布于表面。疏水性图谱基于Kyte-Doolittle标度，沿序列滑动计算平均疏水性，窗口大小通常为7-19个残基。连续疏水区域（长度超过20个残基且平均疏水性高）通常对应跨膜螺旋或信号肽的疏水核心。

除Kyte-Doolittle外，还有多种疏水性标度，各有侧重。Hopp-Woods标度专为识别表面抗原表位设计，亲水区域得分高；Eisenberg标度综合考虑了疏水性和其他物理化学性质；Wimley-White标度基于实验测定的残基从水到辛醇的转移自由能，更接近真实生物物理环境。不同标度在预测跨膜区时可能给出略有差异的结果，建议对关键分析使用多种标度比较。

蛋白质二级结构预测可以从序列推断α螺旋、β折叠和无规卷曲的分布。早期的Chou-Fasman方法基于氨基酸的二级结构倾向性，简单但精度有限。现代方法如PSIPRED、JPred基于位置特异性得分矩阵（PSSM）和机器学习，精度可达80%以上。AlphaFold2等深度学习方法已能从序列预测三维结构，大幅提升了结构生物学的效率，但理解基础的序列特征分析对于解读预测结果和设计实验仍然必要。

蛋白质的稳定性可以通过多种参数评估。**熔解温度Tm**是蛋白质一半变性时的温度，Tm高表示稳定性好。**Gibbs自由能变化ΔG**反映折叠与展开态的能量差。这些参数可通过实验（差示扫描量热法DSC、圆二色谱CD）测量，也可用软件预测（如FoldX、I-Mutant）。疏水残基比例、二硫键数量、Pro和Gly的分布、盐桥网络等都影响稳定性。蛋白质工程中常通过引入二硫键、增加疏水核心堆积、优化盐桥等策略提升稳定性。

```python
from Bio.SeqUtils.ProtParam import ProteinAnalysis

protein_seq = "MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGP"
analyzed = ProteinAnalysis(protein_seq)

mw = analyzed.molecular_weight()
pi = analyzed.isoelectric_point()
aa_percent = analyzed.get_amino_acids_percent()
hydrophobic_ratio = aa_percent['A'] + aa_percent['V'] + aa_percent['L'] + aa_percent['I'] + aa_percent['F'] + aa_percent['W']

print(f"长度: {len(protein_seq)}aa, 分子量: {mw/1000:.2f}kDa, 等电点: {pi:.2f}")
print(f"疏水残基比例: {hydrophobic_ratio:.2%}")
```

::: tip 信号肽与跨膜预测
SignalP预测信号肽，TMHMM和Phobius预测跨膜结构域。Phobius能同时区分信号肽和跨膜螺旋，避免误判。DeepLoc基于深度学习预测亚细胞定位，准确率较高。预测跨膜蛋白时，建议同时使用多个工具，综合判断跨膜区数量和拓扑结构。TMHMM基于HMM建模跨膜区-环区-胞内/胞外的状态转换，输出每个残基位于跨膜区、胞内或胞外的概率。
:::

::: note 序列分析的典型工作流
获得新序列后，建议按以下步骤进行序列特征分析：第一步用BLAST初步搜索相似序列，判断序列的来源和可能功能；第二步用ORFfinder或getorf预测ORF，确定编码区域；第三步用InterProScan或HMMER注释结构域；第四步用SignalP、TMHMM、DeepLoc等预测亚细胞定位和跨膜结构；第五步进行多序列比对，识别保守位点；最后用MEGA或IQ-TREE构建系统发育树，分析进化关系。每一步的结果都会影响后续分析，需要谨慎解读。
:::

### 序列复杂度与k-mer分析

序列复杂度反映序列中碱基或氨基酸排列的多样性。低复杂度区域（如homopolymer run "AAAAAA"、简单重复"ATATAT"或富含少数残基的区域）在生物学分析中容易产生假阳性信号，需要在比对前识别和处理。BLAST使用SEG算法（蛋白质）和DUST算法（核酸）自动屏蔽低复杂度区域。

序列复杂度的度量方法包括：**Shannon熵** H = -Σp(i)·log2(p(i))，其中p(i)是字符i的频率，熵越低表示复杂度越低；** linguistic complexity**比较观察到的k-mer数与理论最大k-mer数的比值；**Wootton-Federhen复杂度**（SEG算法使用）基于最长低复杂度片段的得分。

k-mer分析是研究序列组成的重要方法。k-mer指长度为k的连续子序列，一条长度为L的序列包含L-k+1个k-mer。统计所有k-mer的频率分布可以揭示序列特征：随机序列的k-mer分布均匀，而真实基因组由于密码子偏好、重复元件等存在偏差。k-mer分析应用广泛：物种分类（Kraken、Centrifuge基于k-mer数据库）、基因组大小估计（KmerGenie、Jellyfish）、基因组组装质量评估、序列比较（Mash基于k-mer集合的Jaccard距离）等。

```python
from collections import Counter

def kmer_frequency(seq, k):
    """计算k-mer频率"""
    kmers = [seq[i:i+k] for i in range(len(seq) - k + 1)]
    return Counter(kmers)

seq = "ATGGAGGAGCCGCAGTCAGATCCTAGCGTCGAGCCCCCT"
kmer_counts = kmer_frequency(seq, k=3)

# 计算Shannon熵
import math
total = sum(kmer_counts.values())
entropy = -sum((c/total) * math.log2(c/total) for c in kmer_counts.values())
max_entropy = math.log2(min(4**3, total))

print(f"3-mer种类数: {len(kmer_counts)}")
print(f"Shannon熵: {entropy:.2f} bits (最大: {max_entropy:.2f})")
print(f"复杂度比: {entropy/max_entropy:.2%}")
```

k-mer分析在多序列比对中也有应用。MUSCLE使用k-mer距离快速估算序列相似性，避免对所有序列对进行完整比对，大幅加速初始距离矩阵的构建。这种基于组成的快速估算在序列数量大时特别有效。

## 2.3.2 双序列比对

双序列比对通过将两条序列对齐排列，找出相似性与差异性，用于判断同源性、推断功能和估计进化距离。获得新序列后，直接的功能推断方法就是与数据库中已知序列比对。当比对结果显示两条序列高度相似时，可以推测它们具有共同的祖先（同源性），并借鉴已知序列的功能信息注释新序列。

双序列比对的本质是在两条序列的字符之间建立对应关系，允许插入空位（gap）表示插入或缺失事件。比对质量由打分函数量化，包括匹配奖励、错配罚分和空位罚分。最优比对是得分最高（或罚分最低）的比对方案。

### 动态规划算法

双序列比对的算法基础是动态规划，通过构建得分矩阵寻找最优比对路径。动态规划的核心思想是将复杂问题分解为子问题，子问题的最优解组合得到原问题的最优解。对于两条长度分别为m和n的序列，构建一个(m+1)×(n+1)的矩阵，每个单元格表示两条序列前缀的比对得分。

**Needleman-Wunsch算法**用于全局比对，对两条序列的整个长度进行比对，适用于长度相近且整体相似的序列。算法分为两步：矩阵填充和回溯。矩阵填充时，单元格F(i,j)的值由三种选择决定：F(i-1,j-1) + s(xi,yj)（匹配或错配）、F(i-1,j) + d（在序列2中插入空位）、F(i,j-1) + d（在序列1中插入空位），取三者最大值。第一行和第一列初始化为递增的空位罚分。回溯从矩阵右下角F(m,n)开始，根据每个单元格的来源逆向追溯至左上角F(0,0)，路径决定比对结果。

**Smith-Waterman算法**用于局部比对，只比对最相似的片段，适用于长度差异大或只有局部区域相似的序列。与Needleman-Wunsch的主要区别在于：矩阵填充时允许负值被替换为零，即H(i,j) = max(0, H(i-1,j-1)+s(xi,yj), H(i-1,j)+d, H(i,j-1)+d)；回溯从矩阵中的最大值开始，遇到零值即停止。这种设计使算法能自动定位最相似的区域，跳过不相似的端部序列。

两种算法的时间复杂度均为O(mn)，空间复杂度也是O(mn)。对于长序列，可以使用Hirschberg算法将空间复杂度降至O(min(m,n))，但需要两次扫描。实际应用中，数据库搜索需要比对数百万条序列，O(mn)的复杂度仍然太慢，这催生了BLAST等启发式算法。

为便于理解算法过程，下面以两条短序列"ACGT"和"AGT"为例，演示Needleman-Wunsch算法的矩阵填充与回溯。设匹配得分为+2，错配罚分为-1，空位罚分为-1。矩阵的第一行和第一列初始化为递增的空位罚分（0, -1, -2, -3, ...）。

填充过程从F(1,1)开始，依次计算每个单元格。以F(2,2)为例，序列1的第2位为C，序列2的第2位为G（错配），三种选择为：F(1,1)+s(C,G)=2+(-1)=1（对角，错配）、F(1,2)+d=1+(-1)=0（上方，序列2插入空位）、F(2,1)+d=1+(-1)=0（左方，序列1插入空位），取最大值1。完整矩阵填充结果如下（行表示序列1"ACGT"，列表示序列2"AGT"）：

```
        -    A    G    T
  -     0   -1   -2   -3
  A    -1    2    1    0
  C    -2    1    1    0
  G    -3    0    3    2
  T    -4   -1    2    5
```

回溯从右下角F(4,3)=5开始。F(4,3)=5来自F(3,2)+s(T,T)=3+2=5，因此记录对角移动（T与T匹配）；F(3,2)=3来自F(2,1)+s(G,G)=1+2=3，对角移动（G与G匹配）；F(2,1)=1来自F(1,0)+d=-1+(-1)=-2、F(1,1)+s(C,A)=2+(-1)=1、F(2,0)+d=-2+(-1)=-3中的最大值1，对角移动（C与A错配）；F(1,1)=2来自F(0,0)+s(A,A)=0+2=2，对角移动（A与A匹配）。最终比对结果为：

```
ACGT
A-GT
```

中间的"-"表示在序列2中插入空位，对应于序列1的C位没有匹配对象。该比对的总得分为 2(match A) + (-1)(gap) + (-1)(mismatch C/A) + 2(match G) + 2(match T) = 4。

实际应用中，Biopython的`pairwise2`模块封装了Needleman-Wunsch和Smith-Waterman算法，无需手动构建矩阵。

```python
from Bio import pairwise2
from Bio.pairwise2 import format_alignment

seq1 = "ATGGAGGAGCCGCAGT"
seq2 = "ATGGAGCCGCAGTCAG"

global_aligns = pairwise2.align.globalms(seq1, seq2, 2, -1, -0.5, -0.1)
print("全局比对 (Needleman-Wunsch):")
for a in global_aligns[:2]:
    print(format_alignment(*a))

local_aligns = pairwise2.align.localms(seq1, seq2, 2, -1, -0.5, -0.1)
print("局部比对 (Smith-Waterman):")
for a in local_aligns[:2]:
    print(format_alignment(*a))
```

`globalms`和`localms`函数名中的字母含义：`global`或`local`指定算法类型，`m`表示使用匹配/错配得分，`s`表示使用空位开罚分和延伸罚分。参数依次为匹配得分、错配罚分、空位开罚分、空位延伸罚分。

类似地，可以演示Smith-Waterman算法的矩阵填充过程。以序列"ACGT"和"AGT"为例，匹配+2、错配-1、空位-1。与Needleman-Wunsch的关键区别是：第一行和第一列初始化为0（而非递增空位罚分），且每个单元格的值不小于0。完整矩阵如下：

```
        -    A    G    T
  -     0    0    0    0
  A     0    2    1    0
  C     0    1    1    0
  G     0    0    3    2
  T     0    0    2    5
```

矩阵的最大值为5（右下角），从该位置开始回溯，遇到0值停止。回溯路径与Needleman-Wunsch相同，得到局部比对结果"ACGT/A-GT"，得分5。由于两条短序列整体相似，局部比对与全局比对结果相同。当序列长度差异大或只有部分区域相似时，局部比对能跳过不相关区域，仅比对最相似的片段。

点矩阵法（Dot plot）将两条序列作为矩阵的行和列，相同碱基的格点标记，相似区域形成对角线，插入缺失导致对角线中断。该方法直观展示相似性模式，适合发现重复区域、反向互补和基因组重排事件。滑动窗口版本的Dot plot要求窗口内匹配数超过阈值才标记，可以减少随机匹配的噪声。Dot plot不依赖打分函数，能展示原始相似性，但难以给出量化的比对得分。

```python
import numpy as np
import matplotlib.pyplot as plt

def dot_plot(seq1, seq2, window=10, threshold=7):
    """绘制滑动窗口点矩阵图"""
    len1, len2 = len(seq1), len(seq2)
    matrix = np.zeros((len1, len2))
    for i in range(len1 - window + 1):
        for j in range(len2 - window + 1):
            matches = sum(1 for k in range(window) if seq1[i+k] == seq2[j+k])
            if matches >= threshold:
                matrix[i, j] = matches
    plt.figure(figsize=(8, 8))
    plt.imshow(matrix, cmap='Greys', aspect='equal')
    plt.xlabel('Sequence 2')
    plt.ylabel('Sequence 1')
    plt.title(f'Dot Plot (window={window}, threshold={threshold})')
    plt.show()

# 示例：比较两条序列
seq1 = "ATGGAGGAGCCGCAGTCAGATCCTAGCGTCGAGCCCCCT"
seq2 = "ATGGAGCCGCAGTCAGCGTCGAGCCCCCTCTGAGTCAGG"
dot_plot(seq1, seq2, window=8, threshold=6)
```

Dot plot的对角线模式可以揭示不同类型的序列关系：连续对角线表示相似区域无插入缺失；断开后再延续的对角线表示存在插入缺失；反向对角线（从右上到左下）表示反向互补相似，常见于反向重复序列；多条平行对角线表示串联重复。在基因组比较中，Dot plot能快速定位重排、倒位和易位事件。

### 打分矩阵

打分矩阵评估碱基或氨基酸替换的得分，基于生物学观察：某些替换在进化中更常出现，应给予更高得分。打分矩阵的选择直接影响比对结果，错误的矩阵可能导致同源序列被遗漏或非同源序列被误判为相似。

DNA比对通常使用简单的匹配+错配模型，例如匹配+2、错配-1。更精细的模型区分转换（transition）和颠换（transversion）：**转换**指嘌呤间（A-G）或嘧啶间（C-T）的替换，**颠换**指嘌呤与嘧啶间的替换。转换在进化中更常出现，因为化学结构相似的碱基更容易被错误复制，罚分较轻；颠换较少见且对蛋白质结构影响更大，罚分较重。

**PAM系列**基于观察到的氨基酸替换频率构建。Margaret Dayhoff等人在1978年构建了PAM1矩阵，表示每100个残基平均发生1次可接受突变（Point Accepted Mutation）。PAM1基于71个蛋白质家族的紧密相关序列构建，反映了短期进化距离的替换模式。PAM1的构建过程包括：从紧密相关蛋白质的比对中收集可接受点突变（即不导致蛋白质功能丧失的替换）；统计每种氨基酸被其他氨基酸替换的次数；结合各氨基酸的出现频率，计算相对突变率；构建替换概率矩阵M，其中M[i,j]表示氨基酸i被氨基酸j替换的概率；通过马尔可夫过程，矩阵自乘n次得到PAMn矩阵，对应每100个残基发生n次突变的进化距离。

通过矩阵自乘，可以得到PAM250等更高阶的矩阵，对应更远的进化距离。PAM250是常用的PAM矩阵，适合距离约25亿年的进化分歧。比对近缘序列选小PAM值（如PAM30、PAM70），远缘序列选大PAM值（如PAM250）。PAM矩阵的局限性在于构建所用的数据库较小（71个家族，约1300个替换），且外推到远距离时假设替换模式不变，可能与实际进化过程有偏差。

**BLOSUM系列**基于蛋白质家族保守模块（blocks）的替换频率，由Henikoff夫妇在1992年构建。BLOSUM矩阵的编号表示构建矩阵时所用的模块的最低同一性百分比，例如BLOSUM62基于同一性不超过62%的模块构建。BLOSUM90适合高度相似序列，BLOSUM45适合远缘序列，BLOSUM62是常用的默认选择，适用于大多数蛋白质比对场景。与PAM矩阵不同，BLOSUM直接基于观察数据，不依赖外推，因此对远缘序列的拟合更可靠，多数实际应用中表现更好。

BLOSUM矩阵的构建步骤：第一步从PROSITE数据库中收集蛋白质家族的保守模块（blocks），每个模块是多序列比对的高度保守区域；第二步按模块内序列的同一性百分比将模块分组，如BLOSUM62使用同一性≤62%的模块；第三步统计每对氨基酸在模块同一列中同时出现的次数，得到观察频率矩阵；第四步计算每对氨基酸的期望频率（假设氨基酸独立出现）；第五步计算对数似然比得分 s(i,j) = log2(observed(i,j) / expected(i,j))，得分矩阵以2为底的对数形式存储，单位为半比特（half-bit）。正分表示该替换比随机期望更常见，负分表示更少见。

::: note PAM与BLOSUM的对应关系
PAM和BLOSUM的编号含义相反：PAM编号越大对应越远的进化距离，BLOSUM编号越大对应越近的进化距离。大致对应关系：PAM40≈BLOSUM90，PAM80≈BLOSUM80，PAM120≈BLOSUM62，PAM160≈BLOSUM45，PAM250≈BLOSUM30。这种关系反映了两种矩阵构建方法的不同视角：PAM从近距离外推到远距离，BLOSUM直接观察不同距离的数据。
:::

::: tip PAM和BLOSUM的选择
对于序列同一性较高的比对（>80%），PAM40或BLOSUM90更敏感；对于中等相似性（50-80%），BLOSUM62是标准选择；对于远缘序列（<50%），BLOSUM45或PAM250更合适。BLAST的蛋白质搜索默认使用BLOSUM62。如果研究的是特定类型的蛋白质（如跨膜蛋白、线粒体蛋白），可考虑专用的打分矩阵，如针对跨膜蛋白的SLIM矩阵。
:::

### 空位罚分

空位罚分模型决定了比对的空位模式。简单的线性空位罚分对每个空位位置收取相同罚分，这种模型不符合生物学实际，因为连续的插入缺失（由复制滑脱等机制引起）比分散的插入缺失更可能发生。

**仿射空位罚分**是常用模型，将空位罚分分为开罚分（gap open）和延伸罚分（extension）。开设一个新空位时收取开罚分（通常较重，如-10），空位每延长一位收取延伸罚分（通常较轻，如-0.5或-1）。这种模型鼓励连续空位而非分散空位，更符合进化生物学观察。计算公式为：gap_penalty = open + extend × (length - 1)。

参数选择直接影响比对结果。较小的空位罚分产生更多空位，适合进化距离较远、可能发生多次插入缺失的序列；较大的空位罚分倾向连续匹配区域，适合相似性较高的序列。常用参数组合包括：BLAST默认的+2/-1匹配得分配合-2开罚分/-1延伸罚分，Clustal的矩阵特异性罚分等。R的`pairwise2`函数中，参数顺序为(match, mismatch, gap_open, gap_extend)。

### BLAST家族

动态规划复杂度为O(mn)，对长序列和大规模数据库搜索太慢。例如，比对一条1kb序列与人类基因组（3Gb），需要3×10^12次计算，单核CPU需要数小时。**BLAST**（Basic Local Alignment Search Tool）通过牺牲一定灵敏度大幅提高速度，是目前数据库搜索的主流方法，速度可比Smith-Waterman快数十倍。

BLAST家族根据查询序列和数据库类型的不同组合，提供了多种工具：

| 工具    | 查询序列 | 数据库   | 用途               |
| ------- | -------- | -------- | ------------------ |
| blastn  | 核酸     | 核酸     | 核酸序列搜索       |
| blastp  | 蛋白质   | 蛋白质   | 蛋白质序列搜索     |
| blastx  | 核酸翻译 | 蛋白质   | 新转录本功能推断   |
| tblastn | 蛋白质   | 核酸翻译 | 基因组中找蛋白同源 |
| tblastx | 核酸翻译 | 核酸翻译 | 远缘核酸同源检测   |

选择哪种工具取决于研究目的。当你有一条新的mRNA序列，想找其编码蛋白质的功能，使用blastx直接翻译查询序列与蛋白质数据库比对，比先用blastn找核酸同源更敏感。当你有一个已知蛋白质，想在刚测序完成的基因组中找同源基因，使用tblastn将基因组数据库翻译为所有六种阅读框的蛋白质，再与查询序列比对。

BLAST的核心思想是**词长种子扩展**（seed and extend）。算法分为三步：首先在查询序列中提取所有长度为w的词（word），构建查询词表；然后在数据库中搜索与查询词精确匹配或近似匹配的位置作为种子（hit），蛋白质默认词长为3，核酸默认词长为11；最后从每个种子位置向两侧扩展，使用Smith-Waterman局部比对算法计算扩展后的比对得分，保留高分结果。

较短词长提高灵敏度但降低速度，因为需要扫描的种子数量增多。blastn的默认词长为11，对于短序列（如引物）应使用`-task blastn-short`并降低词长至7。BLAST还采用两步种子策略（two-hit method），要求在同一条对角线上出现两个相近的种子（距离小于40）才进行扩展，进一步减少无效计算。这一优化能将扩展次数减少到原始种子数的1-5%，对大规模数据库搜索十分必要。

对于蛋白质搜索，BLAST允许种子位置的近似匹配（neighborhood word）。查询序列的每个词与所有可能的词比较，得分高于阈值T的词都作为种子。例如，查询序列中的三肽"ALK"，可能扩展为"AIK"、"AVK"等得分高于T的词。T值越低，种子数越多，灵敏度越高但速度越慢。这种设计使蛋白质BLAST在不牺牲太多速度的情况下，能发现远缘同源。

现代BLAST替代方案在特定场景下表现更优。DIAMOND专为大规模蛋白质数据库搜索设计，速度比BLAST快100-20000倍，精度接近。MMseqs2支持蛋白-蛋白、蛋白-核酸、核酸-核酸搜索，灵敏度与速度可调。Lambda是基于与DIAMOND相似思想的轻量级工具。这些工具使用k-mer索引和 SIMD指令加速，适合宏基因组学等大规模数据。

**E值**表示随机情况下期望得到的得分不低于当前得分的命中数，E值越小越显著。例如E=0.01表示在随机数据库中期望出现1次这样的命中，而E=10则期望出现10次，后者很可能是随机噪声。**比特分**是标准化得分，不受打分矩阵和空位罚分影响，便于不同比对间比较。比特分的计算公式为 S' = (λ·S - lnK) / ln2，其中λ和K是Karlin-Altschul统计量，依赖于打分矩阵和序列组成。E值小于0.05或0.01通常被认为具有统计显著性，但对于大规模数据库搜索，更严格的阈值（如1e-5或1e-10）更合适。

```bash
# 构建BLAST数据库
makeblastdb -in custom_sequences.fasta -dbtype nucl -out custom_db

# blastn搜索
blastn -query query.fasta -db custom_db -evalue 1e-5 -outfmt 6 -num_threads 4 -out blast_results.tsv

# blastp搜索
blastp -query protein_query.fasta -db nr -evalue 1e-10 -matrix BLOSUM62 -outfmt "6 qseqid sseqid pident length evalue bitscore" -out blastp_results.tsv

# 短序列比对（引物搜索）
blastn -query primers.fasta -db custom_db -task blastn-short -evalue 1000 -word_size 7 -out short_blast.tsv
```

`-outfmt 6`输出表格格式，便于程序化处理；`-outfmt 7`增加注释行；`-outfmt 0`为默认的可读格式。常用字段包括qseqid（查询ID）、sseqid（数据库ID）、pident（百分比同一性）、length（比对长度）、evalue、bitscore等。

::: warning 低复杂度区域过滤
BLAST默认使用DUST（核酸）和SEG（蛋白质）过滤低复杂度区域。低复杂度区域（如homopolymer run、简单重复序列）由于组成偏差，易产生虚假高分匹配，搜索前必须屏蔽。重复序列也需用RepeatMasker屏蔽，否则可能导致假阳性。对于基因组搜索，建议先用RepeatMasker屏蔽转座子等重复元件，再进行BLAST搜索，可以显著减少假阳性并加速搜索。
:::

E值的计算基于Karlin-Altschul统计理论，该理论证明随机序列比对得分服从极值分布（Gumbel分布），而非正态分布。这一理论结果是BLAST统计显著性的数学基础。E值公式为 E = K·m·n·e^(-λ·S)，其中m是查询序列长度，n是数据库总长度，S是原始比对得分，K和λ是依赖于打分矩阵和序列组成的参数。

```python
import numpy as np

m, n = 1000, 10000000  # 查询长度, 数据库长度
K, lam = 0.13, 0.318   # Karlin-Altschul参数
raw_score = 50

E_value = K * m * n * np.exp(-lam * raw_score)
bit_score = (lam * raw_score - np.log(K)) / np.log(2)
P_value = 1 - np.exp(-E_value)

print(f"E值: {E_value:.2e}, 比特分: {bit_score:.2f}, P值: {P_value:.2e}")
```

注意E值与数据库大小的关系：数据库越大，相同得分对应的E值越大，越不显著。这意味着搜索人类基因组数据库得到的E值通常比搜索细菌基因组数据库大。比较不同数据库搜索结果时，应使用比特分而非E值。

除了标准的BLAST家族，还有两个特殊变种。**PSI-BLAST**（Position-Specific Iterated BLAST）用于发现远缘同源，工作流程是：第一轮标准blastp搜索得到初始命中；从显著命中构建PSSM（位置特异性得分矩阵）；第二轮用PSSM作为查询继续搜索，能发现标准BLAST遗漏的远缘同源；重复迭代直至收敛。PSI-BLAST能将检测极限从约25%序列同一性扩展到约20%，但需警惕迭代过程中PSSM被假阳性污染，建议每轮人工检查新加入的命中。

**PHI-BLAST**（Pattern-Hit Initiated BLAST）结合序列模式与相似性搜索，先在查询序列中匹配指定的PROSITE模式（如 kinase的[H-R]D[KT]S），再在数据库中搜索同时含该模式且与查询相似的序列。这种模式+相似性的双重过滤能显著提高功能注释的精确性，特别适合识别特定功能位点的同源蛋白。

::: tip BLAST结果解读要点
解读BLAST结果时需关注几点：第一，比对覆盖度（query coverage），低覆盖度的高分匹配可能是结构域水平的相似而非全长同源；第二，比对一致性（percent identity），结合查询序列长度判断，短序列的高一致性意义有限；第三，E值与数据库大小相关，跨数据库比较用比特分；第四，检查比对的具体位置，避免将低复杂度区域或重复元件的匹配误判为同源；第五，参考多个数据库的注释，注意数据库注释错误也可能传播。
:::

## 2.3.3 多序列比对

多序列比对（MSA）将三条或更多序列同时比对，揭示序列间的保守性与变异性模式，是构建系统发育树、发现功能位点和蛋白质结构预测的基础。多序列比对能识别跨多条序列的保守区域，这种保守性反映功能或结构约束，是单条序列分析无法获得的信息。

多序列比对的应用场景广泛：发现蛋白质家族的保守催化残基、识别DNA调控元件的核心基序、为HMM模型构建提供训练数据、为系统发育分析提供输入数据、辅助蛋白质三维结构预测（如同源建模时的模板比对）。

### 算法策略

多序列比对的计算复杂度随序列数量指数增长。对于k条长度为n的序列，精确动态规划的时间复杂度为O(n^k)，即使只有5条长度为100的序列，计算量也达到10^10量级。因此实际应用均采用近似策略，在速度和精度之间权衡。

**渐进比对**（Progressive alignment）是经典策略，由Feng和Doolittle在1987年提出，Clustal系列采用此方法。算法分为三步：第一步计算所有序列两两比对，得到k×k的距离矩阵；第二步基于距离矩阵构建引导树（guide tree），通常使用NJ法或UPGMA法；第三步按引导树的拓扑顺序，从最相似的两条序列开始逐步加入新序列，每次将新序列与已有的多序列比对进行profile-profile比对。渐进比对的优点是速度快，时间复杂度约为O(N^2·L^2)，适合大量序列；缺点是早期比对错误会传播到后续步骤，无法纠正（贪婪算法的固有局限）。

ClustalW在基本渐进策略基础上引入了多项优化：根据序列相似性动态调整打分矩阵（近缘序列用BLOSUM90，远缘序列用BLOSUM45）；根据进化距离调整空位罚分（远缘序列空位罚分较低）；对hydrophilic残基富集的空位区域降低开罚分（模拟loop区的插入缺失）；利用辅助信息（如二级结构预测）引导比对。Clustal Omega是新一代工具，使用HMM profile代替序列进行profile-profile比对，精度显著提升。

**迭代比对**通过多轮迭代优化结果，弥补渐进比对一次性决策的缺陷。MUSCLE采用两阶段迭代：第一阶段（draft stage）使用k-mer距离快速构建初始距离矩阵和比对；第二阶段（refinement stage）根据当前比对重新计算距离，重建树，然后对树的每个分支尝试重新比对，保留改善的版本。MUSCLE的refinement通过计算当前比对的SP得分作为参考，重新比对后如果得分改善则保留，否则回退。这一过程重复至收敛或达到最大迭代次数。

MAFFT提供多种策略，每种策略适合不同的应用场景。**FFT-NS-2**是最快速的模式，使用快速傅里叶变换（FFT）加速距离计算，适合>10000条序列的初筛。**FFT-NS-i**在FFT-NS-2基础上增加迭代优化步骤，精度略高但速度仍快。**L-INS-i**采用局部双序列比对构建一致性库，再基于库执行渐进比对，对含大量indel的序列（如富含loop的RNA序列）效果最好。**E-INS-i**允许长插入缺失，适合远缘序列（如同一性<30%的蛋白质）比对。**G-INS-i**使用全局双序列比对构建库，适合全长序列且无大段indel的情况。MAFFT的`--auto`选项会根据序列数量和长度自动选择合适策略，对大多数场景是合理选择。

MAFFT还提供一些特殊功能：`--add`和`--addfragments`将新序列添加到已有比对中，而不重新计算整个比对，适合增量更新；`--adjustdirection`根据序列方向自动调整（对RNA序列有用）；`--memsave`减少内存使用，适合大型比对；`--thread`指定多线程，加速计算。

**一致性比对**整合多个双序列比对结果，提高比对精度。T-Coffee的核心思想是：如果两条序列在双序列比对中匹配的残基对，在与其他序列的比对中也保持一致，则这一比对更可靠。算法先生成所有序列对的双序列比对（可选结构信息），计算每个残基对的一致性权重，再基于一致性权重执行渐进比对。一致性方法的精度通常高于纯渐进方法，但速度较慢。

**基于HMM的方法**将多序列比对建模为概率模型。配置文件HMM（profile HMM）由Krogh等人于1994年提出，将多序列比对转化为隐马尔可夫模型。模型沿比对列展开，每个保守列对应一个匹配状态（match state, M），插入状态（insert state, I）表示相对于保守列的额外插入，删除状态（delete state, D）表示保守列的缺失。三类状态按列顺序串联，形成从左到右的状态链。

每个匹配和插入状态都有氨基酸（或核苷酸）的发射概率分布，反映该位置的保守性。高度保守的位置，匹配状态对应残基的发射概率接近1，其他残基概率接近0；可变位置的发射分布较平坦。状态间的转移概率反映插入缺失的频率：保守区域的M→M转移概率高（很少发生indel），可变区域的M→I和M→D转移概率较高。这些概率通过已有比对估计，加入Dirichlet先验避免过拟合。

HMMER是profile HMM的代表性工具，构建配置文件HMM表示序列家族特征，用于数据库同源搜索。相对于BLAST的逐位匹配，HMM考虑序列的整体进化模式，对远缘同源更敏感，能发现序列同一性低于25%的同源关系，而BLAST在30%以下就难以检测。HMMER3在算法上进行了优化，速度接近BLAST，同时保持高灵敏度，已成为Pfam数据库注释的标准工具。PSI-BLAST采用类似思想，通过迭代搜索构建位置特异性得分矩阵（PSSM），但建模能力弱于完整的HMM。

profile HMM的局限在于假设位点独立进化，忽略了位点间的依赖性。对于存在协同进化的位点（如RNA二级结构中的配对位点、蛋白质中的接触残基），需要协方差模型（covariance model）等更复杂的方法。Infernal是基于协方差模型的RNA家族数据库Rfam的搜索工具。

```bash
# Clustal Omega
clustalo -i input.fasta -o aligned.fasta --outfmt fasta --force

# MAFFT快速策略
mafft --auto input.fasta > aligned.fasta

# MAFFT高精度策略
mafft --linsi input.fasta > aligned_linsi.fasta

# MUSCLE
muscle -in input.fasta -out aligned_muscle.fasta

# trimAl清洗比对
trimal -in aligned.fasta -out trimmed.fasta -automated1
```

::: note 工具速度对比
对于N条长度为L的序列，典型运行时间：Clustal Omega约为O(N·L^2)，MAFFT的fft-ns-2约为O(N^2·L)，MUSCLE约为O(N^2·L^2)。处理大量序列（>1000条）时，MAFFT的FFT策略优势明显；处理少量远缘序列时，MAFFT的l-ins-i或T-Coffee更精确。
:::

处理大规模多序列比对（数千到数万条序列）时需要特殊策略。**序列聚类去冗余**是第一步，用CD-HIT（按序列同一性阈值聚类，如90%）或MMseqs2（更快的替代方案）去除高度相似序列，保留代表序列。**分批比对**将大集合分成若干小批，每批单独比对，再合并，可以避免内存溢出。**渐进式策略选择**：FFT-NS-2是最快的MAFFT策略，适合初筛；PartTree是MAFFT的大规模模式，处理>10000条序列仍能保持合理速度。**结果验证**：大规模比对难以人工检查，可用GUIDANCE2或MARE评估比对质量，自动去除低质量序列或列。

对于超大规模数据（如宏基因组学中的数十万条序列），传统多序列比对工具不适用，需要专门的近似方法。**MMseqs2**的profile-profile比对可以在合理时间内处理海量序列。**Foldseek**基于结构相似性进行快速搜索和聚类，适合蛋白质结构大数据。这些工具牺牲部分精度换取速度，适合初步分析，关键结果仍需用精确方法验证。

### R语言实现多序列比对

R语言中msa包封装了Clustal Omega、ClustalW和MUSCLE，可以直接在R环境中调用。比对结果可转换为ape包的bin对象，用于后续系统发育分析。这种集成允许在统一的R环境中完成从比对到建树的完整流程，便于结果的可视化和下游分析。

```r
library(msa)
library(ape)

# 读取序列
sequences <- readDNAStringSet("input_sequences.fasta")

# 使用Clustal Omega进行多序列比对
alignment <- msa(sequences, method = "ClustalOmega")

# 转换为ape包的bin格式用于建树
aln_bin <- as.DNAbin(alignment)

# 计算距离矩阵
dist_matrix <- dist.dna(aln_bin, model = "K80")

# 构建NJ树
nj_tree <- nj(dist_matrix)

# 绘制树
plot(nj_tree, main = "Neighbor-Joining Tree")
add.scale.bar()
```

msa包的`method`参数可选"ClustalOmega"、"ClustalW"或"MUSCLE"。比对结果显示为`MsaAAMultipleAlignment`或`MsaDNAMultipleAlignment`对象，可以使用`print`、`show`方法查看，也可以使用`msaPrettyPrint`生成LaTeX格式的彩色比对图。

完整的R语言系统发育分析流程示例，从FASTA文件读取到带自举值的树：

```r
library(Biostrings)
library(msa)
library(ape)
library(phangorn)

# 1. 读取序列并进行多序列比对
sequences <- readDNAStringSet("input_sequences.fasta")
alignment <- msa(sequences, method = "ClustalOmega", order = "input")

# 2. 转换格式并清洗比对
aln_bin <- as.DNAbin(alignment)
# 使用phangorn的clean方法去除低质量列
aln_clean <- aln_bin[, colSums(aln_bin != "n" & aln_bin != "-") > 0.5 * nrow(aln_bin)]

# 3. 选择最优替代模型
phangorn_aln <- phyDat(aln_clean, type = "DNA")
mt <- modelTest(phangorn_aln, model = c("JC", "K80", "HKY", "GTR"))
best_model <- mt$Model[which.min(mt$AIC)]
cat("最优模型:", as.character(best_model), "\n")

# 4. 使用最优模型构建ML树
starting_tree <- nj(dist.dna(aln_clean, model = "K80"))
fit <- pml(starting_tree, data = phangorn_aln, model = as.character(best_model))
fit_optimized <- optim.pml(fit, model = as.character(best_model),
                            rearrangement = "stochastic",
                            optGamma = TRUE, optInv = TRUE)

# 5. 自举检验
bs <- bootstrap.pml(fit_optimized, bs = 100, trees = TRUE)

# 6. 绘制带自举值的树
plot(fit_optimized$tree, main = "Phylogenetic Tree (ML)")
add.scale.bar()
```

此流程体现了完整的系统发育分析步骤：比对、清洗、模型选择、建树、自举检验。phangorn的`modelTest`函数类似jModelTest，自动比较多个模型的AIC/BIC并推荐最优模型。`bootstrap.pml`执行传统Felsenstein自举，对100次重抽样数据分别建树，最后计算各节点的自举支持度。

::: tip 工具选择
MAFFT的fft-ns-i适合大量序列快速比对，l-ins-i适合需要高准确率的比对。PRANK考虑插入删除的进化模型，特别适合进化分析，能正确处理插入缺失事件，避免过度比对导致的假同源。比对清洗推荐trimAl的automated1策略，该策略根据比对一致性自动选择最合适的清洗方法。对于蛋白质序列，建议先用MAFFT l-ins-i比对，再用trimAl清洗。
:::

### 比对后处理

比对清洗（trimming）去除不可靠区域，保留高质量列。低质量列通常表现为高度可变、含大量空位或出现异常残基，这些区域可能是比对错误或无生物学意义的序列分歧。保留这些列会引入噪声，影响系统发育分析和基序发现。

**Gblocks**用严格统计标准筛选保守列，参数包括最小保守块长度、最大连续非保守列数、空位允许比例等。Gblocks的严格性使其可能过度删除，导致信息丢失。**trimAl**提供多种自动策略（automated1、gappyout、strict），基于不同的启发式算法选择保留列。**BMGE**基于熵值和相似性选择列，可以处理模糊碱基和空位，适用于核苷酸和蛋白质比对。**ClipKit**是较新的工具，采用更智能的保留策略，只去除过于稀疏或过于保守的列。

构建系统发育树时，清洗后的比对能减少噪声影响，但过度清洗会丢失真正的进化信号。一般建议保留60-90%的原始比对列，平衡信噪比和信息量。

常用比对格式各有特点：FASTA格式简单通用，仅包含序列名称和比对后的序列（空位用"-"表示）；Clustal格式带序列编号和保守性标记（"*"表示完全保守，":"表示强保守组，"."表示弱保守组）；Phylip格式是系统发育分析的标准格式，严格要求序列名长度一致（通常10字符）；Nexus格式可以包含树信息和比对信息，支持注释块；Stockholm格式是Pfam数据库的标准格式，支持多序列比对和注释信息。

**序列徽标**（Sequence Logo）由Schneider和Stephens在1990年提出，用字母高度表示每个位置的残基频率和信息量。在每个位置，字母按频率从大到小自上而下排列，总高度反映该位置的信息量（bits）。信息量的计算公式为 R(sequence) = log2(K) - H(i)，其中K是字母表大小（DNA为4，蛋白质为20），H(i) = -Σp(b,i)·log2(p(b,i)) 是位置i的熵。完全保守的位置信息量最大（DNA为2 bits，蛋白质为log2(20)≈4.32 bits），完全随机的位置信息量为0。WebLogo是在线工具，ggseqlogo是R语言包，可以生成出版质量的Logo图。

```r
# 使用ggseqlogo绘制序列徽标
library(ggseqlogo)
library(Biostrings)

# 读取比对文件
alignment <- readDNAStringSet("aligned.fasta")

# 转换为ggseqlogo需要的格式
sequences <- as.character(alignment)
ggplot() + geom_logo(sequences, seq_type = "dna") +
  theme_logo() +
  ggtitle("Sequence Logo of Aligned Sequences")
```

ggseqlogo支持DNA、RNA和蛋白质序列，可以自定义颜色方案、字号、堆叠方式等。对于蛋白质比对，logo图能直观展示保守的催化残基（如丝氨酸蛋白酶的催化三联体His-Asp-Ser）和结构关键残基。对于DNA调控元件，logo图能展示转录因子结合位点的特异性模式。

```python
from Bio import AlignIO
from Bio.Align import AlignInfo

alignment = AlignIO.read("aligned.fasta", "fasta")
summary = AlignInfo.SummaryInfo(alignment)
consensus = summary.dumb_consensus(threshold=0.5)

print(f"序列数量: {len(alignment)}, 比对长度: {alignment.get_alignment_length()}")
print(f"一致性序列: {consensus}")
```

一致性序列（consensus sequence）反映每个位置的主要残基，但丢失了频率信息。`dumb_consensus`使用简单多数投票，`gaps_consensus`考虑空位，更精细的分析可以使用PSSM或Logo图。

## 2.3.4 序列基序与结构域

序列基序是DNA或蛋白质中反复出现的短序列模式，与特定生物学功能相关。DNA基序通常是转录因子结合位点、启动子元件或剪接信号，长度通常为6-20bp。蛋白质基序可能是酶活性位点、结合位点、翻译后修饰位点或结构标记，长度从几个残基到数十个残基不等。

结构域是蛋白质中具有独立结构和功能的部分，通常由50-250个氨基酸残基组成，能独立折叠。结构域是蛋白质进化的基本单位，通过重组合形成多样化的蛋白质。识别序列中的结构域可以推断蛋白质的功能和进化起源。

### 基序表示模型

**共有序列**列出每个位置最常出现的碱基，如TATA框表示为TATAWAWR（W=A或T，R=A或G）。这种表示法直观但丢失频率细节，无法区分"该位置90%为A"和"该位置60%为A"的情况。共有序列适合展示高度保守的基序，但难以描述有变异的结合位点。

**位置频率矩阵**（PFM）记录每个位置各碱基出现次数。例如，对10条已知TATA框序列统计，第一位置10次都是T，第二位置8次A和2次G，依此类推。PFM是基序的原始数据，但不同基序的总计数可能不同，不便直接比较。

**位置概率矩阵**（PPM）将PFM归一化为频率，每列和为1。为避免零概率问题（某位置从未观察到某碱基），通常添加伪计数（pseudocount），如0.5或基于背景频率的贝叶斯伪计数。

**位置权重矩阵**（PWM）将频率转换为对数似然比权重，公式为 PWM[i,b] = log2(PPM[i,b] / background[b])。背景频率通常取均匀分布（各0.25）或基因组实际频率。PWM得分大于零表示该碱基在该位置比随机期望更常见，小于零表示更少见。判断序列是否包含某转录因子结合位点时，用PWM计算匹配得分：将序列每个位置的PWM值相加，得分高于阈值则判定为结合位点。

**位置特异性得分矩阵**（PSSM）与PWM基本同义，有时特指经过背景频率校正和log转换的矩阵。在BLAST的PSI-BLAST中，PSSM通过迭代搜索不断更新，能捕捉蛋白质家族的保守模式。

PWM的实际应用中，阈值选择是关键问题。阈值过高会遗漏真实位点（假阴性），过低会产生大量假阳性。常用的阈值确定方法包括：**基于背景分布**：随机生成大量序列，计算PWM得分分布，取p<0.05或p<0.01对应的分值作为阈值；**基于已知位点**：用已知真实结合位点的得分分布确定阈值，如取最低得分；**FDR控制**：在已知阴性和阳性集上计算ROC曲线，选择满足特定FDR的阈值。对于ChIP-seq数据，可以通过比对input对照的得分分布确定富集阈值。

::: warning PWM的生物学局限性
标准PWM假设各位置独立贡献，这一假设在生物学上并不总是成立。研究表明，许多转录因子的结合特异性存在位置间依赖性，例如bZIP家族的结合位点中相邻位置存在协同效应。这种依赖性可以用dinucleotide PWM、Markov模型或深度学习模型捕捉，但需要更多训练数据。此外，PWM不考虑DNA形状特征（如小沟宽度、螺旋扭曲），这些特征也影响TF结合特异性。对于精确的TF结合预测，建议使用考虑这些因素的模型，如DNAshapeR或DeepBind。
:::

```python
import numpy as np

pfm = np.array([
    [10, 0, 0, 0], [0, 0, 10, 0], [0, 0, 10, 0], [10, 0, 0, 0],
    [0, 5, 5, 0], [0, 0, 0, 10], [0, 0, 0, 10], [5, 0, 5, 0]
])

background = np.array([0.25, 0.25, 0.25, 0.25])
pseudocount = 0.5
total = pfm.sum(axis=1, keepdims=True)
ppm = (pfm + pseudocount) / (total + 4 * pseudocount)
pwm = np.log2(ppm / background)

bases = ['A', 'C', 'G', 'T']
test_seq = "TATATATA"
score = sum(pwm[i, bases.index(base)] for i, base in enumerate(test_seq))
print(f"序列 {test_seq} 的PWM得分: {score:.2f}")
```

::: warning PWM的局限性
标准PWM假设各位置独立贡献，忽略了位置间的依赖性。例如，在某些转录因子结合位点中，相邻位置的碱基选择存在协同效应。针对这一局限，发展了dinucleotide weight matrix、Bayesian network、深度学习模型等方法，能建模位置间依赖关系，预测精度更高。
:::

### 基序发现算法

基序发现分为两种场景：从头发现（de novo discovery）从一组序列中寻找富集的基序，无需先验知识；已知基序匹配（known motif scanning）用已知PWM在序列中搜索匹配位点。两种场景的算法不同。

**枚举法**穷举所有可能短序列模式，统计富集显著性。对于长度为w的基序，枚举所有4^w种DNA模式（w=8时为65536种），统计每种模式在输入序列中的出现次数与背景期望的偏差，用统计检验（如Fisher精确检验或超几何检验）评估显著性。DREME专用于发现短而精确的DNA基序，采用字典树加速枚举。FIMO用已知PWM扫描序列匹配位点，对每个位置计算PWM得分并评估显著性。枚举法结果确定性强，但长基序计算量大，且难以处理模糊匹配。

**概率方法**通过迭代优化发现基序。MEME（Multiple EM for Motif Elicitation）使用期望最大化（EM）算法，从随机初始基序出发反复迭代：E步估计每个位置是基序起始位置的概率，M步根据这些概率更新基序模型。MEME假设基序在每条序列中出现零次或一次（OOPS模型）或至多一次（ZOOPS模型），适合发现普遍存在的基序。Gibbs采样通过随机选择基序位置迭代更新，适合发现只存在于部分序列中的基序，对噪声更鲁棒。MEME和Gibbs采样的结果依赖初始值，建议多次运行取最优。

**比较基因组学方法**利用跨物种保守性发现功能基序。功能重要的调控元件受选择压力约束，在近缘物种间表现出高于背景的保守性。PhyloCon比较多个物种同源序列，将多序列比对与基序发现结合。PhastCons基于系统发育HMM检测保守非编码元件（CNE），区分受选择的中性进化区域。这些方法对启动子、增强子等调控元件的发现特别有效。

基于ChIP-seq数据的基序发现是当前常用的转录因子结合位点发现方法。ChIP-seq富集了特定TF结合的DNA片段，从这些片段中从头发现基序可以发现TF的特异性结合模式。HOMER的`findMotifs.pl`和MEME-ChIP流程整合了从头发现和已知基序匹配，并提供背景序列选择、富集分析等功能。DeepBind和DanQ等深度学习方法在大规模数据上训练卷积神经网络或RNN，预测精度显著提升，但需要大量标注数据。

实际分析ChIP-seq数据的基序发现流程通常包括：第一步对ChIP-seq峰进行质量控制，去除低质量峰；第二步提取峰中心区域（如峰顶前后100bp）作为输入序列，因为TF结合位点通常位于峰中心附近；第三步选择合适的背景序列，可以选用GC含量匹配的随机区域或输入对照（input control）的对应区域；第四步运行MEME-ChIP或HOMER进行从头发现和已知基序匹配；第五步用Tomtom比较发现的基序与JASPAR等数据库，推断TF身份；最后用FIMO或MCAST在基因组范围扫描匹配位点，验证富集情况。

::: tip 基序分析的注意事项
基序发现的结果需要谨慎解读。第一，从头发现的基序可能是测序偏差或PCR扩增偏好的产物，需要与已知基序比较验证。第二，ChIP-seq数据中常发现"超级基序"（如CTCF、SP1等 ubiquitous TF），这些基序可能是染色质结构相关因子，与研究目标TF的直接结合无关。第三，基序的统计显著性受背景选择影响，GC含量匹配的背景比随机背景更严格。第四，多个TF可能识别相似基序（如bZIP家族），需要结合ChIP-seq实验信息和表达数据综合判断。
:::

### 数据库与工具

**MEME Suite**是完整的基序分析工具包，包含MEME（从头发现）、DREME（短基序）、FIMO（扫描）、MAST（搜索）、AME（富集分析）、Tomtom（基序比较）、MEME-ChIP（ChIP-seq专用流程）等组件，覆盖了基序分析的完整流程。

转录因子结合谱数据库收录了实验验证的TF结合位点模型：**JASPAR**是免费开放的真核TF数据库，按物种分类（ vertebrates、insects、plants、fungi等），提供PWM模型和元数据；**TRANSFAC**是商业数据库，覆盖范围广但需订阅；**HOCOMOCO**提供人类和小鼠的高质量TF结合模型，基于ChIP-seq数据构建；**CIS-BP**整合了原核和真核的TF结合数据，包含已测量和推断的模型。Tomtom可将发现的基序与这些数据库比较，找到最相似的已知基序，推断可能的TF身份。

蛋白质结构域数据库收录了蛋白质家族和结构域的HMM模型：**Pfam**是广泛使用的蛋白家族数据库，每个家族由多序列比对和HMM组成，提供家族注释和功能信息；**InterPro**整合了Pfam、SMART、PROSITE、CDD等多个数据库，提供统一的注释接口；**SMART**专注于信号通路相关的结构域；**CDD**是NCBI维护的保守结构域数据库，包含手工编辑和自动构建的模型。InterProScan是整合注释工具，可以一次查询多个数据库。HMMER基于配置文件HMM搜索Pfam等数据库，比BLAST更敏感，适合发现远缘同源。

```bash
# HMMER搜索Pfam数据库
hmmscan --pfamtblout pfam_results.txt Pfam-A.hmm protein.fasta

# MEME从头基序发现
meme input.fasta -o meme_output -nmotifs 5 -minw 6 -maxw 20

# FIMO用已知基序扫描序列
fimo motif.meme sequences.fasta > fimo_results.tsv

# Tomtom比较基序
tomtom query.meme jaspar_database.meme -o tomtom_output
```

hmmscan用蛋白质序列搜索HMM数据库（找序列中的结构域），hmmsearch用HMM模型搜索蛋白质序列数据库（找某家族的所有成员），hmmbuild从多序列比对构建HMM。这三种工具的关系需要注意。

蛋白质结构域分析的实际工作流包括：第一步用InterProScan进行整合注释，一次查询Pfam、SMART、CDD、TIGRFAM等多个数据库，获得全面的结构域注释；第二步对关键结构域用hmmscan单独验证，调整E值阈值；第三步查看结构域在序列上的位置分布，绘制结构域架构图；第四步结合UniProt、PDB等数据库的功能注释，理解结构域的生物学功能；第五步对结构域序列单独建树，分析结构域的进化历史。

::: tip 结构域分析注意事项
结构域边界预测可能有偏差，特别是当多个结构域相邻或重叠时。对于嵌套结构域（一个结构域插入到另一个结构域中），需要仔细检查比对结果。低复杂度区域和卷曲螺旋区域可能被误判为结构域，应用SEG和COILS过滤。多结构域蛋白质的进化分析应分别处理每个结构域，因为不同结构域可能有不同的进化历史和选择压力。Pfam数据库分为Pfam-A（手工编辑的高质量家族）和Pfam-B（自动生成的家族），优先参考Pfam-A注释。
:::

## 2.3.5 分子进化分析

分子进化分析利用分子序列数据研究生物进化关系和过程。通过比较同源序列，可以推断系统发育关系、估计进化速率、检测自然选择、重建祖先序列。分子进化分析的理论基础是中性进化理论，该理论认为大多数分子变异是中性的，由随机遗传漂变决定频率，少数受自然选择影响。

同源序列分为三种类型：**直系同源**（ortholog）由物种分化产生，通常保留相似功能，是适合用于系统发育分析的序列；**旁系同源**（paralog）由基因重复产生，功能可能分化；**异同源**（xenolog）由水平基因转移产生。区分这三种同源关系对正确解读进化分析结果十分必要。

### 进化模型

进化模型描述分子序列在进化过程中发生替换的数学规律，是系统发育树构建和进化假设检验的基础。模型通过描述替换速率矩阵和碱基/氨基酸频率，定义了序列进化的概率模型，使得不同进化假设可以通过似然值比较检验。

**核苷酸替代模型**从简单到复杂形成层级：JC69（Jukes-Cantor 1969）假设所有碱基替换速率相等、碱基频率均为0.25，是简单的模型，参数最少；K80（Kimura 2-parameter 1980）区分转换和颠换，假设碱基频率相等，加入一个参数；F81（Felsenstein 1981）允许不同碱基频率，但仍假设替换速率相等；HKY85（Hasegawa-Kishino-Yano 1985）结合转换/颠换差异和碱基频率差异，是实际应用中常用的模型之一；GTR（General Time Reversible）是最一般的时间可逆模型，有6个替换速率参数和3个频率参数，参数最多但最灵活。

模型选择使用似然比检验（LRT）、AIC（Akaike Information Criterion）或BIC（Bayesian Information Criterion）。AIC = 2k - 2lnL（k为参数数，lnL为对数似然），BIC = k·ln(n) - 2lnL（n为位点数），两者都偏好高似然和少参数，但BIC对参数的惩罚更重，倾向于选择更简单的模型。这些准则在模型拟合优度和参数数量之间权衡，避免过拟合。ModelTest或jModelTest自动计算多个模型的AIC/BIC，推荐最优模型。IQ-TREE的ModelFinder是当前最快的自动模型选择工具，支持核苷酸、氨基酸和密码子模型，并考虑+Γ和+I的组合。

实际分析常需添加伽马分布（+Γ）建模位点间速率异质性（保守位点的进化速率低，可变位点的进化速率高），通常用4-8个离散类别近似连续Γ分布；以及不变位点比例（+I）表示完全不变的位点。+Γ和+I的组合（+I+Γ）在某些情况下存在参数不可识别问题，近年来的实践倾向于仅使用+Γ。对于密码子模型，需要考虑密码子频率模型（如F3x4、F61、ECM），F3x4假设三个密码子位置独立，是常用的折中选择。

**氨基酸替代模型**针对蛋白质序列：Poisson模型简单，假设所有氨基酸替换速率相等；Dayhoff（PAM）基于早期少量数据构建；JTT（Jones-Taylor-Thornton）基于更大数据集；WAG（Whelan-And-Goldman）和LG（Le-Gascuel）分别针对球蛋白和广泛蛋白质，是较新的模型；mtREV专用于线粒体蛋白，mtZOA用于线粒体编码的蛋白质；mtMetazoan、mtInv、mtVert等针对不同分类群。LG通常是较好的默认选择，对于特定类型蛋白质应选择对应模型。

模型选择不当会严重影响系统发育推断。如果模型过简单（如对远缘序列使用JC69），可能无法捕捉替换模式差异，导致长枝吸引和错误拓扑；如果模型过复杂，参数估计方差增大，计算时间增加。对于多数蛋白质分析，LG+Γ或WAG+Γ是合理的起点；对于RNA病毒等快速进化序列，GTR+Γ+I常被选用。

**密码子替代模型**区分同义和非同义替换，是检测自然选择的核心工具。**dN/dS比率**（也称ω）是关键参数：dN是非同义替换率，dS是同义替换率，ω=dN/dS。ω<1表示纯化选择（purifying selection），非同义突变有害，被淘汰；ω=1表示中性进化（neutral evolution），非同义突变中性；ω>1表示正选择（positive selection），非同义突变有利，被保留。绝大多数蛋白质的平均ω在0.1-0.3之间，反映普遍的纯化选择。Goldman-Yang和Muse-Gaut是两种主要的密码子替代模型框架，前者将密码子作为单元建模，后者分别建模每个核苷酸位置。

dN/dS的计算方法有几种。**计数法**（counting method）直接统计同义和非同义替换数，再除以对应位点数。例如，对于两条序列的密码子比对，统计每位点的同义替换数（Sd）和非同义替换数（Nd），结合同义位点数（S）和非同义位点数（N），计算 dS = Sd/S 和 dN = Nd/N，再按JC69等模型校正。Nei-Gojobori方法是经典的计数法，考虑了替换路径的可能性。**最大似然法**通过密码子替代模型估计ω，更精确但计算量大。**贝叶斯方法**（如FUBAR）通过MCMC估计ω的后验分布，可以同时分析所有位点。

需要注意的是，整体dN/dS只能反映平均选择压力，会遗漏只在部分位点或分支发生的正选择。例如，一个蛋白质可能在催化位点受强正选择（ω>1），但在大多数位点受纯化选择（ω<<1），整体平均ω仍小于1。这是位点模型和分支-位点模型发展的动机，它们允许ω在不同位点或分支变化，能识别局部正选择。

### 系统发育树构建

系统发育树构建方法分为距离法、最大简约法、最大似然法和贝叶斯法，每种方法基于不同原理，适用于不同场景。

**距离法**先计算两两进化距离，再基于距离矩阵建树。进化距离由观察到的替换数经模型校正得到，例如JC69校正公式为 d = -3/4 · ln(1 - 4/3 · p)，其中p是观察到的差异比例。当p接近0.75时（随机序列的期望差异），JC69距离趋向无穷大，反映了多重替换（同一位置发生多次替换）的校正。**邻接法**（Neighbor-Joining, NJ）逐步合并最近分类单元，在每一步选择使总分支长度最小的合并，速度快，适合大数据集的初步分析。

NJ算法的核心是Q准则。对于n个分类单元，每对(i,j)计算Q(i,j) = (n-2)·d(i,j) - Σd(i,k) - Σd(j,k)，选择Q值最小的对作为合并对象。合并后形成的新节点u与剩余分类单元的距离为 d(u,k) = (d(i,k) + d(j,k) - d(i,j)) / 2，分支长度 d(i,u) = d(i,j)/2 + (Σd(i,k) - Σd(j,k)) / (2(n-2))。重复此过程直到只剩2个分类单元。NJ不需要假设分子钟，适合进化速率差异大的数据，是距离法中常用的方法。

**UPGMA**（Unweighted Pair Group Method with Arithmetic mean）假设分子钟恒定（所有分支进化速率相同），产生超度量树（ultrametric tree），所有叶节点到根的距离相等。进化速率差异大时可能产生错误拓扑。UPGMA适用于高度保守序列或近缘物种分析，对于距离差异较大的数据应使用NJ。**最小进化法**（Minimum Evolution）在所有可能拓扑中选择总分支长度最小的树，使用最小二乘法估计分支长度。距离法计算快但信息丢失较多，因为两两距离压缩了多序列比对的信息。

**最大简约法**（Maximum Parsimony, MP）寻找最少进化步骤的拓扑，即所需字符状态变化最少的树。MP不需显式假设进化模型，原理简单直观。但MP有长枝吸引（long branch attraction）问题：当两条进化距离较远的序列由于平行突变偶然相似时，MP可能错误地将它们聚为一类。MP适合保守序列和近缘物种的分析，对进化速率差异大的数据不推荐。

**最大似然法**（Maximum Likelihood, ML）在给定进化模型和拓扑下计算似然值，选择最大似然树。似然值的计算使用Felsenstein的pruning算法，从树叶向树根递归计算每个节点每个状态的概率。由于树的拓扑空间随分类单元数指数增长，无法穷举搜索，需要启发式树搜索策略：NNI（Nearest Neighbor Interchange）每次只交换相邻分支；SPR（Subtree Pruning and Regrafting）剪下一棵子树重新嫁接到其他位置；TBR（Tree Bisection and Reconnection）将树分成两半再以不同方式重连。SPR的搜索范围比NNI大，TBR更大但更慢。分支支持度用自举（bootstrap）评估，通常1000次重抽样，自举值>70%被认为支持较好。ML平衡准确率和效率，目前广泛使用。

**贝叶斯法**通过MCMC（Markov Chain Monte Carlo）采样估计树的后验概率分布。贝叶斯方法将树、分支长度和模型参数都视为随机变量，通过先验分布和似然函数计算后验分布。后验概率 P(树|数据) ∝ P(数据|树)·P(树)，其中P(数据|树)是似然函数，P(树)是先验分布。由于后验分布无法解析计算，使用MCMC采样近似：算法在参数空间中游走，按Metropolis-Hastings准则接受或拒绝新状态，最终样本的分布近似后验分布。

MrBayes使用MCMCMC（Metropolis-coupled MCMC）加速收敛，运行多链（cold chain和hot chains）并行探索参数空间，hot chain的提议接受概率更高，能跨越参数空间的局部最优。周期性地将hot chain的状态与cold chain交换，提高混合效率。BEAST（Bayesian Evolutionary Analysis Sampling Trees）构建时间标度树并估计分化时间，可以同时估计树拓扑、分化时间和进化速率，支持严格的分子钟和松弛分子钟（relaxed clock，允许进化速率在分支间变化）。

贝叶斯方法的优点是直接获得后验概率作为支持度（>0.95通常认为支持强），可以整合复杂先验（如化石校准点、分化时间先验），输出参数的置信区间（如95% HPD区间）。缺点是MCMC运行时间长（大型数据集可能需要数天到数周）且需判断收敛。收敛判断标准包括：用Tracer检查ESS（effective sample size）>200，表明采样充分；链间方差（potential scale reduction factor, PSRF）<1.01，表明多链收敛到同一分布；用AWTY或RWTY包检查树拓扑的收敛。BEAST的输入需要指定替代模型、分子钟模型、树先验（如Yule模型用于物种树、Coalescent模型用于种群历史）和化石校准点。

```r
library(ape)

# 读取比对序列
aln <- read.dna("aligned.fasta", format = "fasta")

# 计算距离矩阵（K80模型）
dist_matrix <- dist.dna(aln, model = "K80")

# NJ建树
nj_tree <- nj(dist_matrix)

# 自举检验（100次重复）
boot_trees <- boot.phylo(nj_tree, aln, function(x) nj(dist.dna(x, model = "K80")), B = 100)

# 绘制带自举值的树
plot(nj_tree, main = "Phylogenetic Tree (NJ)")
nodelabels(boot_trees, frame = "none", bg = "white")
add.scale.bar()

# 最大似然建树（使用phangorn包）
library(phangorn)
phangorn_aln <- phyDat(aln, type = "DNA")
ml_tree <- pml(nj_tree, data = phangorn_aln)
ml_tree_opt <- optim.pml(ml_tree, model = "GTR", rearrangement = "stochastic")
logLik(ml_tree_opt)
```

ape包是R语言系统发育分析的核心包，提供树的读写、操作、可视化和基本建树功能。phangorn包扩展了ape，提供ML建树、模型选择和祖先重建。`optim.pml`的`model`参数支持JC、K80、HKY、GTR等模型，`rearrangement`参数支持NNI和SPR。

```bash
# IQ-TREE：自动模型选择+建树+自举
iqtree2 -s aligned.fasta -m MFP -bb 1000 -alrt 1000 -nt AUTO

# RAxML：最大似然法建树
raxmlHPC -s aligned.fasta -n output -m GTRGAMMA -p 12345 -# 20

# FastTree：快速近似ML建树
FastTree -gtr -nt aligned.fasta > tree.nwk
```

IQ-TREE的`-m MFP`（ModelFinder Plus）自动选择最优替代模型，`-bb 1000`使用超快速自举（UFBoot）1000次，`-alrt 1000`同时进行SH-aLRT检验，两者的组合支持度（如SH-aLRT≥80%且UFBoot≥95%）被认为是可靠的。RAxML适合大规模数据的ML建树，使用GTRGAMMA模型。FastTree使用近似ML算法，速度比RAxML快数倍，适合超大规模数据集（如数千个OTU的微生物组数据）的快速建树。

合并树（consensus tree）整合多棵树信息：严格合并树（strict consensus）只包含所有输入树中都出现的分支，最保守，常用于自举树的合并展示；多数合并树（majority-rule consensus）包含超过50%输入树中出现的分支，常用；50% majority-rule是标准选择。还有扩展的多数合并树，可以显示频率低于50%的分支但用不同样式标注。

自举值的解释需要谨慎。传统ML自举值（Felsenstein自举）的经验法则：自举值≥70%被认为支持较好，≥85%为强支持，<50%为弱支持。但自举值与节点深度有关，深层节点（接近根）的自举值通常较低，因为涉及更多进化事件。IQ-TREE的UFBoot采用超快速自举算法，由于算法差异，UFBoot的解释阈值与传统自举不同：UFBoot≥95%对应传统自举约70%，因此UFBoot的解释阈值更高。

::: warning 自举值的局限
传统自举检验假设位点独立同分布，但实际序列中位点间存在依赖性（如密码子的三个位置、相邻位点的连锁），可能导致自举值偏高。此外，自举值反映的是数据集内部一致性，而非真实拓扑的可信度。当数据存在系统偏差（如长枝吸引、组成异质性）时，即使自举值为100%也可能是错误的拓扑。对于关键结论，建议同时使用多种方法（如ML+贝叶斯）和多种模型验证。
:::

树与树的比较可以使用多种方法。Robinson-Foulds（RF）距离是常用的树距离度量，定义为两棵树的不一致分支数除以2，归一化后为0-1之间。RF距离计算快但敏感于个别分支差异。quartet距离计算两棵树中四分类单元拓扑一致的占比。路径距离基于分类单元对之间的路径长度差异。这些距离可用于评估建树方法的稳定性、识别离群树或聚类相似树。

树可视化工具：FigTree是轻量级桌面工具，适合publication quality图形，支持分支颜色、节点标注、轴缩放等；ggtree是R包，基于ggplot2，功能强大，支持丰富注释（如分类群信息、性状数据、基因presence/absence、表达数据），与phytools、treeio等包协同工作；iTOL是在线工具，支持丰富的注释层，可以上传树文件并添加多层注释；Dendroscope专门为大树（>10000个分类单元）的可视化设计，支持矩形、辐射、圆形等多种布局。MEGA内置的Tree Explorer也提供基本的可视化和编辑功能。

### 正选择检测

正选择检测是进化分析中最受关注的应用。dN/dS>1表明非同义突变被自然选择保留，是适应性进化的分子证据。检测正选择的方法学发展迅速，从早期的整体dN/dS计算到分支模型、位点模型、分支-位点模型，灵敏度不断提高。

**分支模型**允许不同分支有不同ω值，检测特定谱系的正选择。例如，比较"前景分支"（感兴趣的谱系，如蝙蝠祖先）和"背景分支"（其他谱系）的ω，如果前景分支的ω显著高于背景且大于1，则支持该谱系受正选择。似然比检验比较自由模型（两参数）与零假设模型（一参数）。

**位点模型**允许不同密码子位点有不同ω值，不预设哪些位点受选择。M0（one-ratio）假设所有位点ω相同；M1a（neutral）假设两类位点（ω<1和ω=1）；M2a（selection）在M1a基础上加入ω>1的位点类；M7（beta）假设ω服从beta分布（0<ω<1）；M8（beta+ω>1）在M7基础上加入ω>1的位点。M7 vs M8的似然比检验是标准方法，显著拒绝M7支持M8时表明存在正选择位点。BEB（Bayes Empirical Bayes）方法识别受正选择的具体位点，输出每个位点的后验概率。

**分支-位点模型**同时考虑分支和位点差异，检测特定谱系上的部分位点受正选择，灵敏度最高。model A（branch-site test 2）是比较常用的检验，零假设为前景分支的ω≤1，备择为ω>1。BEB方法识别前景分支上受正选择的位点。

```bash
# PAML CODEML：位点模型检测正选择
# codeml.ctl配置：
#   seqfile = aligned_codons.phy
#   treefile = tree.nwk
#   NSsites = 7 8
codeml codeml.ctl

# HyPhy：MEME检测偶发性正选择
hyphy meme --alignment aligned_codons.fasta --tree tree.nwk

# HyPhy：BUSTED检测基因水平正选择
hyphy busted --alignment aligned_codons.fasta --tree tree.nwk

# HyPhy：FEL检测位点水平选择
hyphy fel --alignment aligned_codons.fasta --tree tree.nwk
```

PAML的CODEML需要特殊的密码子比对格式（.phy）和带分支标签的树文件（#1标记前景分支）。HyPhy提供了更友好的命令行接口和可视化结果，FUBAR使用贝叶斯方法同时估计所有位点的ω，速度较快。

正选择检测的完整工作流包括以下步骤：第一步准备密码子比对，确保序列是完整编码区且无内部终止密码子，使用PAL2NAL或MACSE将蛋白质比对转换为密码子比对；第二步构建系统发育树，推荐使用ML方法（如IQ-TREE）并确保树根合理；第三步选择检测方法和模型，根据生物学问题选择分支模型（已知哪些分支可能受选择）、位点模型（不知道哪些位点受选择）或分支-位点模型（已知分支且想找具体位点）；第四步运行CODEML或HyPhy，记录似然值和参数估计；第五步进行似然比检验，比较零假设模型和备择模型的2ΔlnL与χ²分布临界值；第六步用BEB方法识别受选择的具体位点；最后结合结构信息（如已知蛋白质结构上的位置）解读结果。

::: warning 正选择检测的常见陷阱
正选择检测容易受假阳性影响，需注意几点：第一，序列质量差（测序错误、错误比对）会产生虚假的高dN/dS，分析前应仔细清洗比对；第二，基因转换（gene conversion）和重组会破坏树的一致性，导致假阳性，可用GARD或RDP4检测重组；第三，过短的序列（<50密码子）统计效力不足，难以检测正选择；第四，多重检验问题，对许多基因或位点同时检验需进行FDR校正；第五，ω>1不一定是适应性进化的证据，也可能是放松的纯化选择，需要结合功能验证或群体遗传学证据。
:::

::: note 选择压力方法
RELAX检测选择压力放松或加强，比较两组分支的ω比值。MEME（Mixed Effects Model of Evolution）检测偶发性正选择，允许ω在不同分支变化，适合检测仅在部分谱系发生的正选择。FEL（Fixed Effects Likelihood）用固定效应估计每位点dN/dS，适合大数据集。SLAC（Single-Likelihood Ancestor Counting）基于祖先序列重建，计算每个位点的替换数，速度快。BUSTED检测基因水平偶发正选择，给出整基因是否受正选择的全局判断。aBSREL是自适应分支-位点模型，对每个分支独立检测正选择。
:::

### 进化工具

**MEGA**（Molecular Evolutionary Genetics Analysis）是流行的图形化软件，集成比对、模型选择、建树和编辑功能，界面友好，适合初学者。**IQ-TREE**提供高效ML建树，内置ModelFinder自动选择最优替代模型，支持超快速自举（UFBoot），是当前最推荐的ML建树工具之一。**RAxML**（Randomized Axelerated Maximum Likelihood）是大规模ML建树的标准工具，对超大数据集优化良好。**FastTree**使用近似ML算法，速度比RAxML快数倍，适合超大规模数据集的快速分析。**PAML**（Phylogenetic Analysis by Maximum Likelihood）专注密码子水平分析，CODEML是检测正选择的标准工具。**HyPhy**提供灵活的选择压力检测方法，支持多种模型。**BEAST**用于贝叶斯系统发育和分化时间估计，可以整合化石校准点。**MrBayes**是经典的贝叶斯建树工具。

### 祖先序列重建与基因家族进化

**祖先序列重建**（Ancestral Sequence Reconstruction, ASR）根据现存物种序列和系统发育树推断祖先节点序列。ASR基于进化模型，计算每个内部节点每个状态的后验概率。边际重建（marginal reconstruction）为每个位点独立推断最可能状态，不考虑位点间相关性；联合重建（joint reconstruction）考虑所有位点的联合概率，给出整体最可能的祖先序列。ASR用于研究蛋白质进化历史（如重建古蛋白质的活性、稳定性）、重建古代基因功能、设计特定性质的蛋白质（如耐高温酶）。实验验证表明，重建的祖先蛋白质通常具有可折叠、可表达、有功能的特性，支持重建方法的可靠性。

ASR的实际应用包括几个方面。**古生物学**：通过重建远古蛋白质（如数十亿年前的祖先酶），研究蛋白质功能的演化，实验验证这些重建蛋白质的活性和稳定性可以检验进化假设。**蛋白质工程**：祖先蛋白质通常具有更高的稳定性（耐高温、抗变性）和更广的底物谱，作为蛋白质工程的起点具有优势。**进化医学**：重建病原体祖先序列，研究其历史进化轨迹和适应性变化。**受体进化**：重建激素受体家族的祖先序列，揭示配体特异性的演化机制。

```r
# 使用ape包进行祖先序列重建
library(ape)
library(phangorn)

# 读取比对和树
aln <- read.dna("aligned.fasta", format = "fasta")
tree <- read.tree("tree.nwk")

# 转换格式
phangorn_aln <- phyDat(aln, type = "DNA")

# 边际重建（基于最大似然）
anc_ml <- ancestral.pars(tree, phangorn_aln, type = "ML")

# 查看祖先节点的序列概率
# anc_ml是列表，每个元素对应一个节点
# 每个元素是矩阵，行是位点，列是核苷酸概率

# 提取最可能的祖先序列
get_ancestor_seq <- function(anc, node) {
  probs <- anc[[node]]
  apply(probs, 1, function(row) {
    bases <- c("a", "c", "g", "t")
    bases[which.max(row)]
  })
}

# 获取根节点的祖先序列
root_seq <- get_ancestor_seq(anc_ml, length(anc_ml))
cat("祖先序列:", paste(root_seq, collapse=""), "\n")
```

ASR的准确性取决于多个因素：进化模型的适当性（模型错误会导致重建偏差）、树的准确性（错误的拓扑导致错误重建）、序列采样（采样不足的分支重建置信度低）。对于关键位点，建议查看后验概率分布，而非仅取最可能状态。概率接近均匀的位置表明重建不确定，需要在解读时谨慎。

**基因重复与丢失**是基因家族进化的重要事件。基因重复为新功能化（neofunctionalization）提供原料，重复基因的一个拷贝保留原功能，另一个拷贝可以自由进化新功能。亚功能化（subfunctionalization）是另一种命运，重复基因分别保留原基因的不同功能。Notung协调基因树与物种树的不一致，通过reconciliation分析识别重复和丢失事件，判断基因树中的不一致是由基因重复还是基因丢失引起。

直系同源和旁系同源的区分是基因家族分析的基础。**直系同源**（ortholog）由物种分化产生，通常保留相似功能，是跨物种功能注释的基础；**旁系同源**（paralog）由基因重复产生，功能可能分化，是基因功能创新的重要来源。OrthoFinder同时推断直系同源群和物种树，是当前常用工具，准确率高于OrthoMCL、InParanoid等早期方法。基因获得与丢失分析（如CAFE工具）可以识别扩张或收缩的基因家族，揭示适应性进化。

基因重复后的命运有几种可能。**新功能化**（neofunctionalization）是经典模型：重复基因的一个拷贝保留原功能，另一个拷贝由于松懈了选择压力而自由进化，可能获得新功能。**亚功能化**（subfunctionalization）是另一种命运：重复基因分别保留原基因的不同功能（如不同组织表达或不同底物特异性），两者共同完成原基因的全部功能。**非功能化**（nonfunctionalization）是最常见的结果：一个拷贝由于有害突变而成为假基因，最终丢失。DDC模型（Duplication-Degeneration-Complementation）描述了亚功能化的过程。最近的研究表明，重复基因的命运还受表达分化、调控演化、表观遗传修饰等因素影响。

全基因组复制（Whole Genome Duplication, WGD）是基因家族扩张的重要机制，在植物和脊椎动物进化中频繁发生。WGD后所有基因都成为旁系同源，为进化创新提供了原材料。识别WGD事件的方法包括：基于Ks分布（同义替换距离）的峰值检测，WGD事件会在Ks分布中产生一个峰值；基于共线性分析，WGD会产生大范围的共线性区块。植物基因组通常经历多轮WGD，如禾本科植物经历的ρ、σ、τ事件。MCScanX和WGDI等工具可以识别和分析WGD事件。

## 2.3.6 序列比较的特殊应用

### 全基因组比对与共线性分析

全基因组比对比较两个或多个完整基因组，用于发现结构变异、保守区域和重排事件。与单序列比对不同，全基因组比对需要处理基因组的规模（数百万到数十亿碱基）和复杂结构（重复、转座子、重排），算法需要专门设计。

MUMmer适合近缘物种全基因组比对，基于最大精确匹配（Maximal Unique Match）算法，能高效发现基因组间的共线性区域和结构变异。nucmer是MUMmer的核酸比对核心程序，promer翻译为蛋白质后比对，适合远缘物种。LASTZ用于远缘物种全基因组比对，是UCSC基因组浏览器chain/net流程的核心工具，可以处理大段插入缺失和重排。minimap2支持长读长和全基因组比对，算法基于最小化子（minimizer）索引，速度极快，是第三代测序数据比对的首选。

共线性分析检测基因组间保守的基因排列顺序，反映基因组进化中的重排事件。同线性（synteny）原指同一染色体上的基因排列，现在常用于指跨物种的基因排列保守性。MCScanX是常用工具，可检测共线性区域并分析基因重复事件（如全基因组复制WGD、串联重复、分散重复）。共线性分析需要先完成基因注释和基因间同源关系推断，然后将同源基因对在染色体上的位置连接，识别共线性区块。

```bash
# MUMmer全基因组比对
nucmer --maxmatch -p genome_comparison reference.fasta query.fasta
delta-filter -m genome_comparison.delta > filtered.delta
show-coords -rcl filtered.delta > coords.txt

# minimap2全基因组比对
minimap2 -x asm5 reference.fasta query.fasta > alignment.paf

# MCScanX共线性分析
MCScanX gene_collinearity
```

minimap2的`-x`参数预设不同比对模式：asm5适合差异<5%的近缘基因组比对，asm10适合差异<10%，asm20适合差异<20%的远缘基因组比对。

全基因组比对的结果可以用于多种下游分析。结构变异检测基于全基因组比对识别缺失、插入、倒位、易位等大尺度变异。MUMmer的`show-snps`和`show-diff`工具可以提取SNP和结构变异。svmu和Assemblytics是专门的结构变异检测工具。保守性分析计算每个位点的保守性得分，用于识别受选择的元件。多重全基因组比对（如MULTIZ、ROAST流程）可以将多个物种的基因组对齐到参考基因组，生成多基因组比对，是 comparative genomics 的基础。UCSC基因组浏览器提供的100-way alignment（100种脊椎动物）和30-way mammalian alignment就是这类资源。

::: tip 全基因组比对工具选择
选择全基因组比对工具时考虑物种距离和数据类型：近缘物种（<5%差异）用MUMmer或minimap2 asm5；中等距离（5-15%）用LAST或minimap2 asm10；远缘物种（>15%）用LASTZ或ChainNet；组装质量评估用QUAST或BUSCO。对于大型基因组（>1Gb），需要考虑内存和计算时间，minimap2通常是最快的选择。对于需要高精度比对的场景（如医学基因组学），建议使用BWA-MEM进行读长水平比对，而非组装水平比对。
:::

### 系统发育足迹分析

系统发育足迹分析（phylogenetic footprinting）通过比较多个物种的非编码序列发现保守调控元件。功能重要的调控元件受选择压力约束，在近缘物种间表现出高于背景的保守性。中性进化的非编码序列则随时间积累突变，保守性逐渐降低。通过比较多物种的同源非编码区域，可以识别受选择的元件。

该方法的关键是选择合适进化距离的物种。距离太近，所有序列都太相似，无法区分功能元件和背景；距离太远，即使是功能元件也已经发散。对于人类调控元件分析，常用的比较物种包括小鼠（~80 Myr）、狗（~90 Myr）、鸡（~300 Myr）等。phastCons基于系统发育HMM识别保守区域，假设序列由保守和非保守两种状态组成，通过HMM推断状态转换。phyloP对每位点进行保守性检验，输出每个位点的保守性p值，可以识别加速进化（正选择）的位点。增强子和保守非编码元件（CNE）的识别是重要应用，这些元件通常位于基因间区或内含子中，传统的基因中心分析会遗漏它们。

### 短读长比对

短读长比对到参考基因组是重测序分析的核心步骤。第二代测序（Illumina等）产生数千万到数十亿条短读长（50-300bp），需要高效比对到参考基因组。与BLAST不同，短读长比对需要处理大量读长、允许错配和小indel、支持剪接比对。

**BWA**（Burrows-Wheeler Aligner）广泛使用，基于BWT（Burrows-Wheeler Transform）索引，内存占用低，速度快。BWA-MEM是当前推荐算法，能处理100bp到1Mbp的读长，自动选择最佳种子。BWA-MEM的算法分为三步：seed（用MEM算法找到精确匹配种子）、extend（用SW算法扩展种子，得到比对）、clip（处理软裁剪和补充比对）。BWA-MEM对长读长（>100bp）表现优于早期的BWA-backtrack和BWA-sw。

**Bowtie2**采用FM-index（基于BWT）快速比对，支持gap比对和局部比对模式，适合RNA-seq和ChIP-seq。Bowtie2的`--very-fast`到`--very-sensitive`预设参数提供了速度和灵敏度的权衡，`--local`模式允许读长两端软裁剪，适合处理adapter污染或低质量末端。Bowtie2对短读长（<50bp）的比对效率高，是small RNA-seq等应用的常用工具。

**HISAT2**是RNA-seq专用剪接感知比对工具，能正确比对跨越外显子-内含子边界的读段，基于全局FM-index和大量局部FM-index的层次索引，速度比TopHat2快数十倍。HISAT2的剪接比对策略包括：先用常规seed-extend找到候选比对位置；对于未比对或部分比对的读长，在已知剪接位点（来自GTF注释）附近搜索剪接信号（GT-AG、GC-AG、AT-AC）；结合读长组和配对信息确定最终剪接比对。HISAT2支持混合模式（已知+de novo剪接位点发现），适合新转录本发现研究。STAR是另一款流行的RNA-seq比对工具，基于后缀数组，速度极快但内存占用较大（人类基因组需要~30GB内存）。

剪接感知比对的关键挑战是处理可变剪接事件，包括外显子跳跃（exon skipping）、互斥外显子（mutually exclusive exons）、内含子保留（intron retention）和替代5'/3'剪接位点。比对工具需要正确识别这些事件的读长，下游分析（如rMATS、DEXSeq）才能定量分析可变剪接。

这些工具基于Burrows-Wheeler变换和FM-index，与序列比对理论基础密切相关。BWT是一种可逆的字符串变换，将原始字符串转换为便于压缩和索引的形式。FM-index基于BWT，支持高效的backward search，能在O(m)时间内（m为查询长度）判断查询是否存在于文本中，是大规模序列比对的关键数据结构。

```bash
# BWA比对流程
bwa index reference.fasta
bwa mem -t 8 reference.fasta reads_R1.fastq reads_R2.fastq > aligned.sam

# Bowtie2比对
bowtie2-build reference.fasta ref_index
bowtie2 -x ref_index -1 reads_R1.fastq -2 reads_R2.fastq -S aligned.sam

# HISAT2剪接感知比对
hisat2-build reference.fasta ref_index
hisat2 -x ref_index -1 reads_R1.fastq -2 reads_R2.fastq -S rna_aligned.sam
```

比对结果通常以SAM/BAM格式存储，SAM是文本格式，BAM是二进制压缩格式。SAM文件由头部（@开头）和比对行组成，每条读长对应一行，包含11个必填字段（QNAME、FLAG、RNAME、POS、MAPQ、CIGAR、RNEXT、PNEXT、TLEN、SEQ、QUAL）和可选字段（TAG:TYPE:VALUE格式）。FLAG字段是位标志，编码读长的多种属性（如是否配对、是否比对到反向链、是否二次比对等）。CIGAR字符串描述比对细节，如"50M"表示50个匹配，"30M1I19M"表示30匹配+1插入+19匹配。

后续使用samtools进行排序、索引、过滤、变异调用等处理。典型流程：`samtools view -bS aligned.sam > aligned.bam`将SAM转为BAM；`samtools sort aligned.bam -o sorted.bam`按参考基因组位置排序；`samtools index sorted.bam`创建索引（必须先排序）；`samtools view -b -q 20 sorted.bam > filtered.bam`过滤低质量比对；`samtools mpileup -uf ref.fa sorted.bam | bcftools call -mv -Oz -o variants.vcf.gz`进行变异调用。深度数据分析还涉及GATK、FreeBayes等更专业的变异调用工具。

::: tip 长读长比对
第三代测序（PacBio、Oxford Nanopore）错误率5-15%，读长达数十kb甚至Mb级，传统短读长工具不适用。minimap2采用最小化子（minimizer）索引结合动态规划，是长读长比对首选工具。minimap2的`-x map-pb`预设适合PacBio CLR读长，`-x map-ont`适合Oxford Nanopore读长，`-x asm10`适合组装基因组间的比对。长读长比对允许较高的错配率，但能跨越重复区域和大段indel，对结构变异检测有独特优势。
:::

## 2.3.7 比对性能与统计

### 比对得分标准化

原始比对得分依赖打分矩阵和空位罚分，不同参数设置下的得分不能直接比较。例如，使用BLOSUM62打分矩阵得到的得分100与使用BLOSUM45得到的得分100，对应的统计意义完全不同。为了跨参数比较，需要将原始得分标准化。

**比特分**通过标准化消除打分参数影响，公式为 S' = (λ·S - lnK) / ln2，其中λ和K是Karlin-Altschul统计量，依赖于打分矩阵和序列组成，S是原始比对得分。比特分表示原始得分相对于随机分布的偏离程度，以比特（bits）为单位。比较不同BLAST搜索结果、不同打分矩阵下的比对时，应使用比特分而非原始得分。比特分与E值的关系为 E = m·n·2^(-S')，其中m和n是查询序列和数据库的有效长度。

### 统计显著性

BLAST统计显著性基于极值分布理论。Karlin-Altschul理论证明随机序列比对得分服从Gumbel分布（极值分布的一种），而非正态分布。这一理论结果是BLAST统计显著性的数学基础，使E值的计算有严格的理论依据。

E值公式为 E = K·m·n·e^(-λ·S)，其中m是查询序列长度，n是数据库总长度，S是原始比对得分，K和λ是依赖于打分矩阵和序列组成的参数。E值的直观理解是：在随机情况下，期望得到多少个得分不低于S的比对。E值越小，比对的统计显著性越高。P值与E值关系为 P = 1 - e^(-E)，当E值很小时P值约等于E值（如E=0.001时P≈0.001）。P值的严格定义是：在随机情况下，至少得到一个得分不低于S的比对的概率。

注意E值与数据库大小的关系：数据库越大，相同得分对应的E值越大，越不显著。这意味着搜索人类基因组数据库得到的E值通常比搜索细菌基因组数据库大。比较不同数据库搜索结果时，应使用比特分而非E值。E值还受查询序列长度影响：长查询序列更容易产生随机高分匹配，E值相应增大。

**多重检验校正**：对1000条序列分别BLAST搜索，即使每条序列的E值阈值设为0.05，整体期望假阳性数为1000×0.05=50个，远超可接受范围。Bonferroni校正最保守，将阈值除以检验次数（0.05/1000=5e-5），控制家族错误率（FWER）；FDR校正（如Benjamini-Hochberg方法）控制假发现率，更宽松，大规模分析中常用。对于ChIP-seq等基因组规模的分析，FDR校正几乎是必需的。

### 敏感性与特异性

**敏感性**（sensitivity）指真实同源序列被正确检出的比例，计算公式为 TP/(TP+FN)，FN是假阴性数；**特异性**（specificity）指检出序列中真正同源的比例，计算公式为 TN/(TN+FP)，但在数据库搜索中常指精确度（precision）= TP/(TP+FP)，FP是假阳性数。两者存在权衡：降低E值阈值提高特异性但降低敏感性，升高阈值提高敏感性但降低特异性。

探索性研究可放宽阈值（如E<1），优先发现可能的同源序列，后续通过其他证据验证；确认性研究应使用严格阈值（如E<1e-10），减少假阳性。F-measure（F1 score）是敏感性和精确度的调和平均，可以综合评估算法性能。ROC曲线和精确率-召回率曲线（PR curve）是评估分类器性能的标准工具，曲线下面积（AUC）越大表示整体性能越好。

ROC曲线以假阳性率（1-specificity）为横轴，真阳性率（sensitivity）为纵轴，绘制不同阈值下的性能点连成的曲线。ROC-AUC为0.5表示随机分类，1.0表示完美分类。PR曲线以召回率（敏感性）为横轴，精确度为纵轴，在类别不平衡（如正样本远少于负样本）时比ROC更敏感。对于数据库搜索，同源序列（正样本）通常远少于非同源序列（负样本），因此PR曲线更适合评估搜索性能。

::: warning 评估数据的金标准问题
比对算法评估的根本困难在于缺乏绝对的金标准。结构比对（如基于DALI、CE的蛋白质结构比对）常被作为序列比对的金标准，但结构本身也受方法选择影响。模拟数据可以控制真实参数，但模拟过程的假设可能与真实进化不符。因此，基准评估结果应作为参考，实际应用中需结合领域知识判断。对于关键分析，建议用多种算法（如MAFFT、T-Coffee、Clustal Omega）生成比对，比较结果一致性，关注分歧区域的处理。
:::

### 比对评估基准

评估比对算法性能的基准数据集基于已知结构或人工模拟的比对：**BAliBASE**是最早的蛋白质多序列比对标准，包含多个参考集合（如小等价子集、大等价子集、空位富集子集等）；**HomFam**基于Homstrad结构比对数据库，将结构比对作为"金标准"；**SABmark**分为超家族（superfamily）和扭曲家族（twilight zone）两级，覆盖不同相似性范围；**PREFAB**结合结构比对和序列比对，通过一致性评估算法精度；**QUAM**是较新的基准，包含质量分级。

比对质量评分：**Sum-of-pairs**（SP score）是所有序列对在每一列的得分之和，是常用的评分；**Column Score**（CS）是正确列的比例，要求一列中所有残基对都正确；**TC Score**（Total Column score）是完全正确列的比例，最严格；**fD**和**fM**分别衡量假发现率和假阳性率。这些评分在BAliBASE等基准数据集上计算，可以客观比较不同算法的精度。

### 实践考量与常见陷阱

实际进行序列比对和进化分析时，除了掌握算法和工具，还需要理解常见陷阱并采取相应策略。本节总结几个关键实践要点。

**序列选择与数据准备**。多序列比对前应筛选合适的序列：去除过短、过长或含大量模糊碱基（N）的序列；保留代表性序列，避免某一分支过度采样导致建树偏向；对于远缘序列，考虑先构建profile或使用结构信息辅助比对。序列数量并非越多越好，超过数百条序列时建树的计算负担显著增加，且可能稀释关键信号。建议先用CD-HIT或MMseqs2聚类去冗余，每类保留1-3条代表序列。

**模型违反与系统误差**。系统发育方法都基于模型假设，当数据违反假设时结果可能出错。常见的违反包括：碱基组成异质性（不同分类群的碱基频率差异显著）、速率异质性（不同分支进化速率差异大，导致长枝吸引）、位点间依赖性（密码子位点、RNA配对位点）。检测和应对方法包括：用IQ-TREE的`-m TESTMERGEONLY`或TreeSet测试组成异质性；用后验预测检验评估模型拟合；用不分枝模型或site-heterogeneous模型（如Poisson+CAT、LG+C60）应对长枝吸引；对密码子数据使用密码子模型而非核苷酸模型。

**比对不确定区域的处理**。空位富集区域和高变区域的比对通常不可靠，不同算法的结果可能差异显著。系统发育分析前应该用trimAl或BMGE清洗这些区域。对于关键分析，可以生成多个不同严格度的清洗版本（如保留90%、70%、50%列），分别建树比较结果一致性。如果核心拓扑在不同清洗版本下保持稳定，结果更可信。

**自举检验的合理使用**。自举检验是评估节点支持度的标准方法，但需注意：自举值反映数据集内部一致性，而非拓扑的真实性；高自举值不保证拓扑正确，特别是存在系统偏差时。对于关键节点，建议同时报告多种支持度指标（如ML自举、贝叶斯后验概率、SH-aLRT），并用多种方法建树比较。贝叶斯方法的后验概率通常高于ML自举值，跨方法比较时应使用相应阈值。

**软件版本与可重复性**。生物信息学软件更新频繁，不同版本的算法和默认参数可能变化，导致结果差异。建议记录所用软件的版本号、完整命令行参数和运行环境，使用Snakemake、Nextflow等流程管理工具保证可重复性。对于发表的研究，应将比对文件、树文件和关键中间结果存入公开数据库（如TreeBASE、Figshare），便于他人验证。

**计算资源规划**。大规模比对和建树可能需要大量计算资源。MAFFT的fft-ns-i处理10000条序列约需数GB内存和数十分钟；RAxML建树对大数据集可能需要数百GB内存和数天计算；BEAST的MCMC可能运行数周。规划时应考虑序列数量、长度和所需精度，选择合适的算法和工作站或集群资源。云平台（如AWS、阿里云）和超算中心提供了弹性资源选项。

::: tip 序列比对学习路径
初学者建议按以下路径学习：先用MEGA完成简单的多序列比对和建树，理解基本流程；再用Biopython或R脚本批处理数据，掌握自动化分析；然后学习IQ-TREE和MAFFT的命令行用法，处理大规模数据；最后根据研究需要深入学习特定方法，如正选择检测（PAML、HyPhy）、贝叶斯分化时间估计（BEAST）、祖先序列重建（ape、Phytools）。每一步都配合实际数据练习，加深理解。
:::

::: note 本节来源
本节内容由原 reStructuredText 文件迁移而来。如需查看原始 Sphinx 版本，请参考项目源码中的 .rst 文件。
:::

## 练习题

### 第1题 概念理解

BLAST 搜索同一条查询序列时，在数据库 A（100 万条序列）中得到某命中的 E 值为 1e-5，在数据库 B（1000 万条序列）中同一命中的 E 值变为 1e-4。解释 E 值随数据库规模变化的原因，并说明跨数据库比较命中显著性时应使用哪种指标。

::: details 参考答案
E 值公式为 E = K·m·n·e^(-λ·S)，其中 n 是数据库总长度。数据库增大 10 倍，同一得分 S 对应的 E 值也增大 10 倍，显著性降低。更大的数据库中随机产生高分匹配的概率更高，因此相同得分在更大数据库中统计意义更弱。跨数据库比较时应使用比特分 S' = (λ·S - lnK) / ln2，它已标准化掉数据库规模影响，仅反映比对本身的质量。
:::

### 第2题 参数分析

需要比对一组同一性约 35% 的远缘蛋白质序列（约 80 条，长度 300-400 aa），用于构建系统发育树。说明应选择哪种多序列比对工具和策略、用什么打分矩阵、比对后是否需要清洗、建树用什么模型。

::: details 参考答案
比对工具选 MAFFT 的 L-INS-i 策略（`mafft --linsi`），该策略基于局部双序列比对构建一致性库，对含较多 indel 的远缘序列效果最好。打分矩阵选 BLOSUM45，适合同一性低于 50% 的远缘序列。比对后用 trimAl 的 `-automated1` 策略清洗不可靠列，减少噪声对建树的影响。建树用 IQ-TREE 的 `-m MFP` 自动选择最优替代模型（远缘蛋白常落在 LG+Γ 或 WAG+Γ），配合 UFBoot 1000 次自举检验。
:::

### 第3题 概念理解

某研究者在 RNA-seq 分析中用 BWA-MEM 将读段比对到参考基因组，下游 StringTie 定量时发现大量 reads 比对到内含子区域，转录本表达量异常偏低。分析原因，并说明应改用什么比对工具及关键参数。

::: details 参考答案
BWA-MEM 不具备剪接感知能力，将跨越外显子-内含子边界的 reads 强行比对到参考基因组连续位置，导致 reads 堆积在内含子上，外显子-外显子剪接连接处的 reads 无法正确比对。RNA-seq 比对应使用 HISAT2 或 STAR 等剪接感知工具。HISAT2 通过 `--known-splicesite-infile` 提供已知剪接位点，STAR 通过 `--sjdbGTFfile` 提供 GTF 注释。两者能正确识别剪接信号（GT-AG），将跨外显子 reads 比对为分段匹配（CIGAR 含 N 操作），StringTie 等下游工具才能正确定量转录本。
:::

## 常见错误

**错误 1 · BLAST 短序列用默认参数导致漏检**

原因：blastn 默认 word_size 为 11，对短于 30 bp 的引物或 miRNA 序列，种子命中数过少，灵敏度大幅下降，可能完全无命中。

解决：短序列搜索使用 `-task blastn-short`，该任务自动将 word_size 降为 7 并调整 E 值阈值。同时适当放宽 E 值（如 `-evalue 1000`），因为短序列的随机匹配概率本身就高，过严的 E 值会过滤掉真实命中。

**错误 2 · 多序列比对后未清洗直接建树**

原因：比对中的高变区和空位富集区是比对算法最不确定的部分，包含大量噪声。直接用于建树会引入虚假信号，导致长枝吸引或支持度虚高。

解决：建树前用 trimAl 的 `-automated1` 策略或 BMGE 清洗比对，去除空位比例高、一致性低的列。关键分析可生成多个清洗版本（保留 90%、70%、50% 列），分别建树比较核心拓扑的稳定性。

**错误 3 · 远缘序列用 BLOSUM62 比对导致灵敏度不足**

原因：BLOSUM62 适合同一性 50-80% 的序列。对同一性低于 40% 的远缘序列，BLOSUM62 对保守替换的奖励不足，真实的同源匹配可能低于阈值被过滤。

解决：根据序列同一性选择打分矩阵。同一性 30-50% 用 BLOSUM45，同一性 30% 以下用 BLOSUM30 或 PAM250。BLAST 蛋白搜索可用 PSI-BLAST 迭代构建 PSSM，将检测极限从约 25% 同一性扩展到约 20%。

**错误 4 · 正选择检测未做密码子比对格式转换**

原因：CODEML 要求密码子比对（.phy 格式，序列长度为 3 的倍数），直接用蛋白质比对的核苷酸序列会导致移码和翻译错误，dN/dS 计算结果完全不可靠。

解决：先用 PAL2NAL 或 MACSE 将蛋白质多序列比对转换为密码子比对，保证每个密码子对齐。转换前确认序列是完整 CDS 且无内部终止密码子。比对中含 gap 的密码子需按工具要求处理（CODEML 会自动跳过含 gap 的密码子）。
