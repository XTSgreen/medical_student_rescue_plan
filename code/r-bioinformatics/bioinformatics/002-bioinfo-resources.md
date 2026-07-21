---
title: 2.2 生物信息资源与工具
sidebar:
  order: 2
---
# 2.2 生物信息资源与工具

生物信息学研究建立在三类基础设施之上：数据中心、数据库、数据标准格式。数据中心负责长期保存和分发数据，并维护与国际同行的同步机制；数据库按学科主题组织数据，提供检索、浏览和下载入口；数据标准格式则保证不同软件之间可以无歧义地交换信息。本章按这一层次组织，重点介绍各资源的定位、组织方式、检索方法和在生信分析中的具体用途，并在每节给出可运行的代码示例，帮助读者从概念理解过渡到实际操作。

## 2.2.1 国际主要数据中心

全球三大核酸数据中心通过 INSDC（International Nucleotide Sequence Database Collaboration）协议保持协作关系。INSDC 于 1988 年由 NCBI、EMBL（欧洲分子生物学实验室）和 DDBJ 共同建立，三方约定每日交换新提交的序列数据，因此向任一中心提交的序列通常在 24 小时内会出现在另外两个中心，并获得相同的 accession 编号。这种冗余存储机制保证了数据的安全性和全球可访问性，也意味着研究人员可以选择任意一个中心进行检索，结果基本一致。

### NCBI

美国国家生物技术信息中心（National Center for Biotechnology Information，NCBI）成立于 1988 年，隶属美国国立卫生研究院（NIH）的国家医学图书馆（NLM）。NCBI 是全球使用频率最高的生物信息数据中心，维护着数十个公开数据库，其中最常用的包括文献库 PubMed、核酸库 GenBank、蛋白库 Protein、变异库 dbSNP 与 ClinVar、表达库 GEO、测序原始数据库 SRA 等。

NCBI 的数据组织以 Entrez 为核心。Entrez 是一个跨库检索系统，允许用户用同一查询语句同时搜索多个数据库，并通过预计算的邻接关系在不同记录之间跳转。例如，从一条 GenBank 核酸记录可以链接到对应的蛋白序列、文献、结构以及基因注释，这种网状关联大幅简化了信息检索流程。Entrez 系统维护的数据库包括 PubMed（文献）、GenBank（核酸）、Protein（蛋白）、Gene（基因）、Structure（结构）、OMIM（遗传病）、SNP（变异）、GEO（表达）、SRA（测序原始数据）、Taxonomy（物种分类）等数十个，覆盖了生信分析的多数场景。除网页入口外，NCBI 还提供 BLAST 序列比对工具和 E-utilities 编程接口，前者用于基于序列相似性的功能注释，后者用于自动化批量检索，是生信分析中最常用的两类入口。

NCBI 的数据版本管理需要注意。GenBank 和 RefSeq 的数据持续更新，同一 accession 在不同时间访问可能得到不同内容。RefSeq 采用版本号机制（如 NM_000546.5 表示第 5 版），引用时应标注版本号以保证可重复性。NCBI 还维护历史归档，可以在需要时访问特定时间点的数据。

E-utilities 是一组基于 HTTP 的 RESTful 接口，包括 ESearch（检索）、EFetch（获取记录）、ESummary（获取摘要）、ELink（跨库链接）、EInfo（数据库信息）等工具。下面使用 Biopython 的 Entrez 模块检索 PubMed 中与 TP53 相关的文献，并获取其摘要。

```python
from Bio import Entrez

Entrez.email = "your_email@example.com"

handle = Entrez.esearch(db="pubmed", term="TP53 AND cancer", retmax=10)
record = Entrez.read(handle)
handle.close()

pmid_list = record["IdList"]
print(f"找到 {record['Count']} 篇相关文献")

handle = Entrez.efetch(db="pubmed", id=pmid_list, rettype="abstract")
abstracts = handle.read()
handle.close()
```

### EBI

欧洲生物信息学研究所（European Bioinformatics Institute，EMBL-EBI）位于英国剑桥附近的 Hinxton，成立于 1994 年，是欧洲分子生物学实验室（EMBL）的组成部分。EBI 维护 Ensembl 基因组数据库、UniProt 蛋白质库、ENA 核酸档案、ArrayExpress 表达数据库、PDBe 蛋白结构库等核心资源，并提供 InterPro 蛋白结构域识别、EMBOSS 序列分析等在线服务。

EBI 的数据组织强调归档优先和数据可追溯性。以 ENA 为例，每条记录都带有提交者信息、提交日期和修订历史，便于追溯数据的来源。EBI 的多数数据库都提供 RESTful API，接口设计遵循统一的资源定位规则，便于程序化访问。EBI 与 NCBI 在数据内容上有大量重叠，但在元数据标准和接口设计上各有侧重：EBI 更注重数据提交规范的完整性和跨库关联，NCBI 则在检索便利性和工具集成上更成熟。实际分析中，研究人员常常根据任务需求在两个中心之间切换使用。

EBI 还提供一批在线分析服务，适合不希望本地部署工具的用户。InterProScan 可以在线提交蛋白序列进行结构域预测；EMBOSS 提供序列翻译、限制酶切、引物设计等常用操作；Clustal Omega 提供多序列比对。这些服务通过网页表单或 API 调用，结果以邮件或下载链接返回。下面通过 Ensembl REST API 查询人类 TP53 基因的坐标信息。

```python
import requests

server = "https://rest.ensembl.org"
endpoint = "/lookup/symbol/homo_sapiens/TP53"
response = requests.get(server + endpoint, headers={"Content-Type": "application/json"})

if response.ok:
    gene_info = response.json()
    print(f"基因ID: {gene_info['id']}")
    print(f"染色体位置: {gene_info['seq_region_name']}:{gene_info['start']}-{gene_info['end']}")
    print(f"基因方向: {gene_info['strand']}")
```

### DDBJ

日本 DNA 数据银行（DNA Data Bank of Japan，DDBJ）成立于 1986 年，是 INSDC 的创始成员之一，由日本国家遗传研究所维护。DDBJ 与 GenBank 和 ENA 每日同步数据，主要服务于亚洲研究机构的数据提交需求，其提交工具和元数据规范与其他两个中心保持一致。对于中国和日本的科研人员，向 DDBJ 提交序列在地理上更近，网络传输速度更快，但数据的全球可见性与其他两个中心相同。DDBJ 提供与 NCBI 和 EBI 等价的功能，包括序列检索（getentry）、批量获取（DRA，对应 SRA）和注释提交（Mass Submission System），三方的数据通过 INSDC 协议保持一致，研究人员可以根据语言偏好和网络条件选择入口。

### 其他重要中心

除三大中心外，还有一些在特定领域具有不可替代地位的数据中心，值得生信分析人员熟悉。

**CNCB/NGDC**（China National Center for Bioinformation / National Genomics Data Center）是中国国家生物信息中心，由中国科学院北京基因组研究所维护，提供国家基因组数据云平台，包括 GSA（基因组序列归档，对应 SRA）、GWH（基因组仓库）、GVM（基因组变异库）、MethBank（DNA 甲基化库）等数据库。对于涉及人类遗传资源的数据，国内法规要求提交至 CNCB，这一要求基于《人类遗传资源管理条例》，旨在规范人类遗传资源的采集、保藏和利用。CNCB 的数据标准与 INSDC 兼容，同时支持中文元数据录入，便于国内研究人员使用。

**GISAID**（Global Initiative on Sharing All Influenza Data）最初专注于流感数据共享，在新冠疫情期间成为全球 SARS-CoV-2 基因组数据的主要来源。GISAID 要求数据使用者注册并签署使用协议，数据不可用于商业再分发，这一管理模式在数据开放与贡献者权益之间取得了平衡。GISAID 的贡献者保留对数据的所有权，可以在发表前控制数据使用，这吸引了大量研究团队主动提交数据。GISAID 的数据质量经过自动和人工审查，标注了序列完整性和覆盖度，便于筛选高质量数据。

**wwPDB**（Worldwide Protein Data Bank）是全球蛋白质数据银行联盟，成员包括美国的 RCSB PDB、欧洲的 PDBe 和日本的 PDBj，后来加入了中国的 PDBc（由中国国家蛋白质科学中心维护）。三大成员共同维护 PDB 结构数据库，并提供统一的归档格式，研究人员可以从任一成员站点获取相同的三维结构数据。各成员站点在数据呈现和查询工具上各有特色：RCSB PDB 提供丰富的查询和可视化工具，PDBe 提供与 EBI 其他数据库的整合查询，PDBj 提供亚洲地区的数据服务。

## 2.2.2 核心数据库分类

本节按数据类型介绍生信分析中常用的数据库。每个数据库都有其特定的数据组织方式和检索入口，了解这些差异有助于在分析中快速定位所需资源。

### 核酸序列数据库

核酸序列数据库存储 DNA 和 RNA 序列及其注释信息，是基因组学和转录组学研究的基础。其中 RefSeq 提供人工审校的高质量参考序列，常作为分析的标准对照。

**GenBank** 是 NCBI 维护的 INSDC 核心库，收录所有公开的核酸序列，包括直接提交的序列和从文献中整理的序列。GenBank 的数据量呈指数增长，每条记录以 accession 编号唯一标识，并附带提交者、来源物种、参考文献和功能注释。由于 GenBank 接受任何来源的序列，数据质量参差不齐，分析时需要注意甄别。GenBank 的注释采用 feature table 格式，常见的 feature 类型包括 source（来源）、gene（基因）、CDS（编码序列）、mRNA、exon、tRNA、rRNA 等，每个 feature 携带 qualifiers 描述其属性（如 /product、/translation、/organism），这些信息可用于自动化提取序列特征和功能注释。

**ENA**（European Nucleotide Archive）是 EBI 维护的欧洲核酸档案，强调归档优先与数据可追溯性。ENA 与 GenBank 数据同步，但在元数据描述和实验关联上更为严格。ENA 的数据按 raw reads、assembled sequences、functional genomics 三层组织，分别对应 SRA、GenBank、ArrayExpress 的功能，使研究人员可以在同一平台完成从原始数据到分析结果的全流程访问。

**RefSeq** 是 NCBI 维护的审校参考序列库，由 NCBI 工作人员根据文献和自动流程注释，序列质量较高，适合作为分析的参考标准。RefSeq 的 ID 采用规范的前缀：`NM_` 表示 mRNA，`NR_` 表示非编码 RNA，`NP_` 表示蛋白，`NG_` 表示基因组区域，`NC_` 表示完整染色体，`XM_` 和 `XP_` 表示模型（预测）mRNA 和蛋白。在比对和注释分析中，优先选用 RefSeq 序列可减少因原始数据错误带来的偏差。RefSeq 与 GenBank 的区别在于：GenBank 是原始提交数据的归档，保持提交时的原貌；RefSeq 是经过审校和标准化的参考版本，序列和注释经过 NCBI 整理。分析中选择 RefSeq 可以获得更一致的注释，避免不同提交者注释风格差异带来的问题。

**SRA**（Sequence Read Archive）存储高通量测序的原始读段数据，覆盖 Illumina、PacBio、Nanopore 等主流测序平台。SRA 数据以实验为单位组织，每个实验关联一个 BioProject 和一个 BioSample，便于追溯实验设计和样本来源。由于原始数据量大，SRA 采用专用压缩格式（.sra），需要通过 SRA Toolkit 转换为 FASTQ 后才能用于分析。SRA 的 ID 体系包括 SRR（Run，测序运行）、SRX（Experiment，实验）、SRS（Sample，样本）、SRP（Study，研究）和 ERP/DRP（EBI/DDBJ 等价编号），从 Run 到 Study 形成层级关系，便于按需获取数据。

SRA 数据的获取方式有多种：通过 NCBI SRA Explorer 或 EBI ENA Browser 在线浏览和下载；通过 prefetch 或 ENA Portal API 命令行下载；通过 SRA Toolkit 的 fasterq-dump 转换格式。对于大规模数据，ENA 通常提供直接的 FASTQ 下载链接，速度优于 NCBI 的 SRA 转换流程。分析时需要注意区分单端和双端数据，以及读取长度是否一致，这些信息影响下游工具的参数设置。

下面使用 Biopython 解析 GenBank 格式文件，提取序列和基因注释。

```python
from Bio import SeqIO

for record in SeqIO.parse("sequence.gb", "genbank"):
    print(f"序列ID: {record.id}, 长度: {len(record.seq)} bp")
    for feature in record.features:
        if feature.type == "gene":
            gene_name = feature.qualifiers.get("gene", ["未知"])[0]
            print(f"  基因: {gene_name}, 位置: {feature.location}")
```

SRA 数据需要通过 SRA Toolkit 下载与转换。prefetch 用于下载 .sra 文件，fasterq-dump 用于将 .sra 转换为 FASTQ，--split-files 参数将双端测序的成对读段分别输出。

```bash
# 安装: conda install -c bioconda sra-tools
prefetch SRR123456
fasterq-dump --split-files --threads 8 SRR123456
```

::: tip SRA 与 BioProject / BioSample 的关系
一个 BioProject 描述一个研究项目的整体设计，关联多个 BioSample（样本）和 SRA Experiment（实验）。这种三层结构使研究人员可以从项目层面理解数据组织，也可以精确到单个样本进行下载和分析。
:::

### 蛋白质序列数据库

UniProt 是蛋白质功能研究中最常用的数据库，由 EBI、SIB（瑞士生物信息学研究所）和 PIR（美国蛋白质信息资源）联合维护，整合了人工审校的 Swiss-Prot 和自动注释的 TrEMBL 两部分。

**UniProtKB/Swiss-Prot** 收录人工审校的高质量注释记录，每条记录的注释都经过文献核查和计算分析验证，虽然数据量较小，但注释准确，适合作为功能研究的权威参考。

**UniProtKB/TrEMBL** 收录自动注释的蛋白质序列，数据量远大于 Swiss-Prot，包含大量来自基因组翻译的预测蛋白。TrEMBL 的注释基于自动流程，准确度依赖算法质量，分析时需要结合其他证据判断。

UniProt 的每条记录有稳定的 accession 编号（如 P04637 对应人类 TP53），可在不同版本间保持引用一致。UniProt 的记录结构包括：蛋白描述（名称和 EC 编号）、基因名称、物种来源、注释（功能、催化活性、亚细胞定位、翻译后修饰、组织特异性、发育阶段、互作、亚基结构、序列相似性、功能位点）、序列特征（结构域、活性位点、结合位点、二硫键、变异）、参考文献和交叉引用（链接到 PDB、InterPro、Pfam 等数据库）。这种丰富的注释结构使 UniProt 成为蛋白功能分析的核心信息源，适合从单一蛋白的功能查询到大规模蛋白组注释的各类分析。

UniProt 的版本管理采用 release 周期，每 8 周发布一次新版本。每次发布可能新增记录、更新注释或合并重复记录。对于需要长期可重复性的分析，建议记录分析时使用的 UniProt 版本号，或在下载时保存版本信息。

除 UniProt 外，还有几个重要的蛋白特征数据库。**Pfam** 是蛋白质家族与结构域数据库，使用隐马尔可夫模型（HMM）描述每个家族的序列特征，通过 hmmscan 可以判断查询序列是否包含已知结构域。Pfam 的每个家族条目包括种子比对（seed alignment，用于构建 HMM）、完整比对（full alignment，所有成员的比对）、共识序列和结构域边界信息。Pfam 分为 Pfam-A（人工审校，质量高）和 Pfam-B（自动生成，覆盖面广），分析时优先使用 Pfam-A 的结果。**InterPro** 整合了 Pfam、SMART、PROSITE、CDD 等多个特征数据库，提供统一查询入口，避免在多个数据库之间重复搜索。InterProScan 是 InterPro 的命令行工具，支持本地批量分析，是蛋白注释流程的标准组件。

蛋白结构相关的数据库还包括 **CDD**（Conserved Domain Database，NCBI 维护的保守结构域库，整合了 Pfam、SMART 等多个来源）和 **SUPFAM**（超家族数据库，将 SCOP 和 PfAM 中的结构相关家族关联）。这些数据库在蛋白功能预测、结构建模和进化分析中各有用途，实际分析中常结合使用，交叉验证预测结果。

下面通过 UniProt REST API 获取人类 TP53 蛋白的功能注释。

```python
import requests

uniprot_id = "P04637"  # TP53
url = f"https://rest.uniprot.org/uniprotkb/{uniprot_id}.json"
response = requests.get(url)

if response.ok:
    data = response.json()
    print(f"蛋白质: {data['proteinDescription']['recommendedName']['fullName']['value']}")
    print(f"物种: {data['organism']['scientificName']}")
    for comment in data['comments']:
        if comment['commentType'] == 'FUNCTION':
            print(f"功能: {comment['texts'][0]['value']}")
```

::: tip Pfam 结构域搜索
使用 hmmer 工具搜索 Pfam 结构域：`hmmscan --domtblout results.txt Pfam-A.hmm protein.fasta`。Pfam-A 是人工审校的高质量家族集合，Pfam-B 是自动生成的补充集合，分析时优先使用 Pfam-A。

hmmscan 常用参数说明：

```bash
# 搜索 Pfam-A 结构域
hmmscan --domtblout domain_results.txt \
        --cut_tc \
        --cpu 8 \
        Pfam-A.hmm \
        query_proteins.fasta

# 结果文件各列含义：
# target_name: Pfam 家族名
# query_name: 查询蛋白 ID
# e-value: 结构域 E 值
# score: 结构域得分
# c-Evalue: 比对条件 E 值
# i-Evalue: 独立 E 值
```

`--cut_tc` 参数使用 Pfam 家族自带的 trusted cutoff 阈值，比默认的 gather 阈值更严格，能减少假阳性。分析结果时，i-Evalue（独立 E 值）小于 1e-5 的结构域通常可信。
:::

### 结构数据库

结构数据库存储生物大分子的三维结构数据，是理解分子功能和相互作用机制的关键。蛋白质结构数据通常来自实验测定，近年来预测结构也成为重要补充。

**PDB**（Protein Data Bank）是最早建立的生物数据库之一，始建于 1971 年，收录通过 X 射线晶体学、核磁共振（NMR）和冷冻电镜（cryo-EM）解析的实验结构。每条 PDB 记录以四位字符的 ID 标识（如 1TUP），包含原子坐标、分辨率、实验方法、配体信息等。PDB 文件格式历经 PDB 原始格式和 mmCIF 格式两种：原始 PDB 格式采用固定列宽，每行一个原子，字段按列对齐，但受限于 80 字符宽度，无法容纳超过 99999 个原子的结构；mmCIF 格式采用键值对方式，能容纳更大规模的结构数据，是 wwPDB 推荐的归档格式。

PDB 文件的主要记录类型包括：HEADER（标题和分类）、TITLE（结构标题）、COMPND（分子组成）、SOURCE（来源生物）、SEQRES（序列）、ATOM（原子坐标，标准残基）、HETATM（非标准残基和配体原子）、REMARK（注释信息，包括分辨率和方法）、HELIX 和 SHEET（二级结构）。分析 PDB 结构时，ATOM 记录中的 B-factor（温度因子）反映原子的柔性或不确定性，occupancy 反映原子的占据比例，这两个字段在结构质量评估中常用。

**AlphaFold DB** 是 DeepMind 提供的预测结构数据库，基于 AlphaFold2 算法预测，覆盖超过 2 亿个蛋白质的结构。AlphaFold DB 的每条记录附带 pLDDT（predicted Local Distance Difference Test）置信度评分，按残基给出预测质量：pLDDT > 90 表示高置信度，70-90 表示中等置信度，低于 50 表示低置信度，分析时应重点参考高置信度区域。对于缺乏实验结构的蛋白，AlphaFold DB 提供了高置信度的结构参考，但需要注意预测结构不能完全替代实验数据，尤其是柔性区域和复合物界面。

**SCOP**（Structural Classification of Proteins）和 **CATH** 是两个蛋白质结构分类系统，将蛋白质按折叠方式分层归类，用于研究结构演化关系和功能推断。SCOP 采用四级分类：class（全 α、全 β、α/β 等）、fold（拓扑结构）、superfamily（演化来源）、family（序列相似性），层级清晰。CATH 采用类似的四级分类：class、architecture、topology、homologous superfamily，但分类算法侧重几何特征。两个系统的分类结果大部分一致，但存在细节差异，分析时可对照使用。

**EMDB**（Electron Microscopy Data Bank）存储冷冻电镜三维重构数据，随着 cryo-EM 技术的分辨率突破，EMDB 数据量快速增长。EMDB 数据以三维密度图形式存储，与 PDB 原子模型配对发布，两者共同描述一个结构的完整信息。分析 cryo-EM 结构时，需要同时关注密度图的分辨率和原子模型的拟合质量（如 Q-score）。

下面使用 Biopython 的 PDB 模块解析 PDB 文件并计算残基间距离。

```python
from Bio.PDB import PDBParser
import numpy as np

parser = PDBParser()
structure = parser.get_structure("1TUP", "1tup.pdb")

model = structure[0]
chain = model['A']
ca_atom = chain[(' ', 100, ' ')]['CA']
ca_atom2 = chain[(' ', 101, ' ')]['CA']

vector = ca_atom.coord - ca_atom2.coord
distance = np.sqrt(np.sum(vector * vector))
print(f"残基间CA距离: {distance:.2f} Å")
```

### 基因组数据库

基因组数据库提供完整基因组序列和注释，是基因组学研究的参考基础。Ensembl 和 UCSC Genome Browser 因丰富的注释轨道和可视化功能，成为基因组研究中最常用的两个工具。

**Ensembl** 由 EBI 和 Sanger Institute 联合维护，始于 1999 年人类基因组计划，目前覆盖脊椎动物和部分非动物物种。Ensembl 提供基因组序列、基因注释、变异信息、比较基因组学数据，并通过 REST API 和 BioMart 支持批量下载。Ensembl 的基因注释由自动化流程生成，与 GENCODE 的人工审校注释互补。Ensembl 的 ID 体系规范清晰：基因以 `ENSG` 开头（如 ENSG00000141510 对应 TP53），转录本以 `ENST` 开头，蛋白以 `ENSP` 开头，这些 ID 在版本间保持稳定，适合作为分析中的主键。BioMart 是 Ensembl 的批量查询工具，支持按属性（如染色体位置、基因名、GO 术语）筛选并导出多个字段，适合一次性获取大批量基因的注释信息。

**UCSC Genome Browser** 由加州大学圣克鲁斯分校维护，以丰富的可视化轨道著称。UCSC 的轨道分为几大类：映射与测序轨道展示覆盖度和比对质量，基因与预测注释轨道展示多种注释来源（如 GENCODE、RefSeq、Ensembl），表观调控轨道展示组蛋白修饰和染色质状态，变异轨道展示 dbSNP 和结构变异。UCSC 支持用户自定义轨道，可以将自己的分析结果（如 BED、WIG、BigWig 文件）叠加到参考基因组上查看，这一功能在探索性分析中非常实用。UCSC 还提供 Table Browser 工具，支持按区间和字段批量导出轨道数据，适合需要提取特定区间注释的分析。

**GENCODE** 是人类和小鼠基因组注释的黄金标准，由 Sanger Institute 和 EBI 联合维护，分为基础注释（Comprehensive，包含所有注释）和基础蛋白编码注释（Basic，仅包含主要转录本）两个层级。GENCODE 的注释经过人工审校和实验验证，是转录组分析中常用的参考注释集。GENCODE 的转录本分类体系包括：蛋白编码（protein_coding）、长链非编码 RNA（lncRNA）、小 RNA（miRNA、snoRNA、snRNA）、假基因（pseudogene）等，每个转录本还标注证据等级（如KNOWN、NOVEL、PUTATIVE），帮助研究人员评估注释的可靠性。GENCODE 与 Ensembl 共享部分注释流程，但 GENCODE 经过更多人工审校，质量更高。

**1000 Genomes Project** 完成了对全球 26 个人群的基因组变异图谱构建，提供了人类群体遗传变异的基准数据，是群体遗传学和医学遗传学研究的重要参考。1000 Genomes 数据集的等位基因频率数据常用于判断新发现变异的稀有程度，其相位数据用于构建参考单倍型，是 imputation 分析（如 Beagle、Minimac）的输入。1000 Genomes 的样本经过匿名化处理，可用于无限制的公开研究。

**TAIR**（The Arabidopsis Information Resource）是拟南芥基因组数据库，是植物生物学研究的重要资源。TAIR 提供基因组注释、基因功能、突变体信息和文献整合，是植物基因功能研究的标准参考。TAIR 的部分数据需要订阅，但核心的基因组序列和注释免费提供。

模式生物库各有专精：**WormBase**（线虫）、**FlyBase**（果蝇）、**SGD**（酵母）、**MGI**（小鼠）、**ZFIN**（斑马鱼），这些数据库除基因组注释外，还提供表型、基因表达、遗传互作等物种特异信息。模式生物库的数据组织通常以基因为中心，整合遗传学、发育生物学和细胞生物学等多来源信息，支持跨物种比较研究。例如，使用同源基因（ortholog）映射，可以将小鼠 MGI 中的表型信息转移到人类基因研究，预测人类疾病相关基因的功能。

下面通过 Ensembl REST API 获取 TP53 基因的序列和转录本信息。

```python
import requests

server = "https://rest.ensembl.org"
gene_id = "ENSG00000141510"  # TP53

# 获取基因序列
response = requests.get(f"{server}/sequence/id/{gene_id}",
                       headers={"Content-Type": "application/json"})
if response.ok:
    data = response.json()
    print(f"序列长度: {len(data['seq'])} bp")

# 获取转录本信息
response = requests.get(f"{server}/lookup/id/{gene_id}?expand=1",
                       headers={"Content-Type": "application/json"})
if response.ok:
    gene_data = response.json()
    print(f"转录本数量: {len(gene_data['Transcript'])}")
```

### 转录调控数据库

转录调控数据库存储转录因子结合位点、表观遗传修饰和基因调控网络信息，是研究基因表达调控机制的基础。

**ENCODE**（Encyclopedia of DNA Elements）是人类基因组功能元件图谱计划，目标是识别人类基因组中所有功能元件。ENCODE 数据包括转录因子 ChIP-seq 结合位点、组蛋白修饰、染色质开放性（ATAC-seq、DNase-seq）、增强子、启动子和染色质状态注释，是研究人类基因调控的核心资源。ENCODE 的数据以实验为单位组织，每个实验关联一个生物学重复和技术重复，并提供质控指标（如 IDR 一致性）。ENCODE 数据通过其门户网站访问，支持按因子、细胞系、实验类型筛选，是表观遗传学研究的高频数据源。

**Roadmap Epigenomics** 项目聚焦人类表观遗传修饰图谱，覆盖上百种细胞类型和组织，提供组蛋白修饰、DNA 甲基化和染色质状态数据，与 ENCODE 互补。Roadmap 的染色质状态注释（ChromHMM 15 状态模型）将基因组分为启动子、增强子、绝缘子、转录区等类别，是理解基因组功能分区的重要参考。

**JASPAR** 是转录因子结合谱（PWM，Position Weight Matrix）数据库，收录了大量转录因子的序列特异性结合模型，用于预测 DNA 序列上的转录因子结合位点。JASPAR 分为 JASPAR CORE（实验验证，高质量）和 JASPAR UNVALIDATED 等子库。PWM 模型以位置权重矩阵形式存储，每列对应一个碱基位置，每行对应一种碱基，数值反映该碱基在该位置的偏好。JASPAR 的数据开源免费，是转录因子结合位点预测的标准参考。

**ChIP-Atlas** 和 **CistromeDB** 整合了大量 ChIP-seq 和 ATAC-seq 数据，支持按因子、细胞类型查询，便于发现已有的调控数据。CistromeDB 还提供峰位与基因的关联分析，预测转录因子的靶基因。

**RegulonDB** 是大肠杆菌基因调控网络的权威数据库，收录转录因子、结合位点、启动子和调控关系，是原核生物调控研究的标准参考。RegulonDB 提供完整的调控网络图，可用于研究调控网络的拓扑结构。

下面使用 Biopython 的 motifs 模块构建位置权重矩阵并在序列上搜索结合位点。

```python
from Bio import motifs
from Bio.Seq import Seq

motif_matrix = {
    'A': [3, 0, 0, 0, 0, 0],
    'C': [0, 5, 0, 0, 0, 0],
    'G': [2, 0, 5, 0, 5, 0],
    'T': [0, 0, 0, 5, 0, 5]
}
motif = motifs.Motif(counts=motif_matrix)
motif.background = {'A': 0.25, 'C': 0.25, 'G': 0.25, 'T': 0.25}

test_seq = Seq("ACGTACGTGTCAGTACGT")
for pos, score in motif.search(test_seq, threshold=5.0):
    print(f"位置: {pos}, 得分: {score:.2f}, 序列: {test_seq[pos:pos+motif.length]}")
```

### 代谢通路数据库

代谢通路数据库描述细胞内生化反应和分子网络，是系统生物学研究的重要资源。通路数据通过基因、蛋白、代谢物的 ID 与序列和结构数据关联，便于多组学整合分析。

**KEGG**（Kyoto Encyclopedia of Genes and Genomes）是京都基因与基因组百科全书，由日本京都大学维护。KEGG 通过统一的 KEGG ID 将基因、蛋白、代谢物和通路关联起来，其中通路图直观展示分子在生化反应中的位置和关系。KEGG 的通路编号遵循 `ko` + 编号（如 ko04110 为细胞周期）的命名规则，物种特异通路用物种前缀替换 `ko`（如 `hsa04110` 为人类细胞周期通路）。KEGG 的 REST API 支持按通路、基因、化合物查询，是通路富集分析的常用数据源。需要注意的是，KEGG 的部分 API 接口需要订阅许可，学术用户可通过学校或机构获取访问权限。

**Reactome** 是人工审校的人类生物通路数据库，由 EBI 和 OICR 联合维护。Reactome 的通路经过人工核对文献后录入，质量较高，并提供了详细的反应步骤和参与分子信息。Reactome 的数据以 SBGN（Systems Biology Graphical Notation）标准存储，支持导出为 BioPAX、SBML 等格式，便于与其他系统生物学工具集成。Reactome 还提供了 pathway analysis 工具，支持过表达分析（ORA）和基因集富集分析（GSEA）。

**BioCyc** 是一个通路数据库集合，包含 MetaCyc（实验验证的代谢通路，覆盖所有物种）和 EcoCyc（大肠杆菌全细胞模型）等子库，适合微生物代谢研究。BioCyc 系列数据库采用统一的 Pathway Tools 平台，支持通路可视化、基因组注释和代谢模型构建。

**WikiPathways** 是社区维护的开放通路库，允许研究人员贡献和编辑通路，覆盖面广但质量控制不如 Reactome 严格。WikiPathways 的开放编辑模式使其能快速收录新兴研究领域的通路，适合追踪前沿进展。

下面通过 KEGG REST API 查询细胞周期通路（hsa04110）的基因列表。

```python
import requests

pathway_id = "hsa04110"  # 细胞周期通路
response = requests.get(f"http://rest.kegg.jp/get/{pathway_id}")
if response.ok:
    print(response.text[:500])

response = requests.get(f"http://rest.kegg.jp/link/genes/{pathway_id}")
if response.ok:
    genes = [line.split('\t')[1] for line in response.text.strip().split('\n') if len(line.split('\t')) == 2]
    print(f"通路中基因数: {len(genes)}")
```

### 表达数据库

表达数据库存储基因表达谱数据，是转录组学研究的基础。这些数据库覆盖了从微阵列到高通量测序的不同技术平台，数据量和注释深度各有差异。

**GEO**（Gene Expression Omnibus）是 NCBI 维护的最大基因表达库，采用 Platform-Series-Sample 三层结构组织数据。Platform 描述芯片或测序平台，Series 描述一个实验研究，Sample 描述单个样本的表达数据。GEO 数据可以通过 accession 编号（GSE 表示系列，GSM 表示样本，GPL 表示平台）直接访问。GEO 的数据格式包括原始的 SOFT 格式和 MINiML 格式，以及整理好的表达矩阵，分析时通常使用后者。GEO 数据的元数据存储在 Series 和 Sample 记录中，包括实验设计、处理条件、对照设置等，这些信息对结果的解释至关重要。

**ArrayExpress** 是 EBI 维护的表达实验数据库，与 GEO 类似，但更强调 MIAME（Minimum Information About a Microarray Experiment）规范的元数据完整性。MIAME 规范要求提交者提供实验设计、样本、杂交、测量和归一化方法的详细信息，ArrayExpress 在提交时强制校验这些字段。对于需要严格元数据的分析（如 meta 分析），ArrayExpress 的数据质量更有保障。

**GTEx**（Genotype-Tissue Expression）项目提供了人类正常组织的基因表达数据，覆盖数十种组织类型，是研究组织特异性表达和正常变异范围的重要参考。GTEx 数据可用于判断一个基因在哪些组织高表达，或一个变异是否影响附近基因的表达（eQTL 分析）。

**CCLE**（Cancer Cell Line Encyclopedia）收录了上千个癌细胞系的多组学数据，包括表达、突变、拷贝数等，是癌症研究和药物筛选的常用资源。CCLE 数据常用于验证药物靶点在癌细胞系中的表达，或选择适合实验的细胞系模型。

**TCGA**（The Cancer Genome Atlas）收录了 33 种癌症的多组学数据，包括表达、突变、甲基化、拷贝数、miRNA 等，是癌症基因组学研究的核心数据集。TCGA 数据通过 GDC（Genomic Data Commons）门户访问，受控数据需要通过 dbGaP 申请权限。TCGA 的样本配对设计（肿瘤与癌旁正常组织）便于差异分析，是肿瘤研究的高频数据源。

**HPA**（Human Protein Atlas）提供人类蛋白质在组织和细胞中的表达图谱，包括免疫组化图像，是蛋白水平表达研究的重要补充。HPA 的数据基于 RNA-seq 和抗体染色两种技术，前者提供转录水平数据，后者提供蛋白定位和丰度信息，两者互补。

下面使用 GEOparse 下载并解析 GEO 数据集。

```python
import GEOparse

# 下载并解析 GEO 数据集
# gse = GEOparse.get_GEO(geo="GSE12345", destdir="./")
# for gsm_name, gsm in gse.gsms.items():
#     print(f"样本: {gsm_name}, 标题: {gsm.metadata.get('title', ['N/A'])[0]}")
```

### 互作数据库

互作数据库存储蛋白质与蛋白质、蛋白质与核酸等分子间的相互作用信息，是构建分子网络和理解生物学过程的基础。

**STRING** 是最大的蛋白互作整合库，整合了实验验证、数据库记录和计算预测的互作数据，并为每条互作给出置信度评分。STRING 支持按基因名或蛋白名查询互作网络，并提供网络可视化。STRING 的互作证据来源包括：数据库导入（KEGG、Reactome 等）、实验验证（酵母双杂交、亲和纯化等）、基因共表达、文本挖掘和基因组上下文（基因邻近、基因融合）。每条互作的置信度综合多种证据计算，分析时可以根据证据来源筛选高置信度互作。STRING 的物种覆盖面广，支持跨物种互作网络比较。

**BioGRID** 收录实验验证的蛋白质互作和遗传互作，数据经过人工整理，质量较高，适合需要高置信度互作的分析。BioGRID 记录每条互作的实验方法和文献来源，便于追溯证据强度。BioGRID 还收录遗传互作（如 synthetic lethal），对功能研究有特殊价值。

**IntAct** 和 **MINT** 收录分子互作的实验数据，记录详细的实验方法和证据，便于评估互作的可靠性。IntAct 采用 IMEx（International Molecular Exchange）标准，数据经过严格的人工整理。这些数据库的互作记录包含相互作用检测方法（如 co-immunoprecipitation、pull-down）、互作类型和证据置信度，是构建高置信度互作网络的首选数据源。

**CORUM** 收录哺乳动物蛋白复合物数据，提供复合物的组成和功能注释，是研究蛋白机器的基础。CORUM 的复合物经过人工整理，每个复合物记录包括组成亚基、功能、亚细胞定位和文献来源，适合研究复合物的组装和功能。

**DrugBank** 收录药物与靶点互作数据，包括药物分子、靶点蛋白、药理作用和相互作用信息，是药物研发和药物重定位研究的常用资源。DrugBank 同时提供药物代谢、药物-药物互作和药物转运信息，是药理学研究的重要参考。

下面通过 STRING API 查询 TP53 的互作伙伴。

```python
import requests

string_api_url = "https://string-db.org/api"
params = {
    "identifiers": "TP53",
    "species": 9606,
    "limit": 20,
    "caller_identity": "my_app"
}

response = requests.get(f"{string_api_url}/json/network", params=params)
if response.ok:
    interactions = response.json()
    print(f"找到 {len(interactions)} 个互作伙伴")
    for interaction in interactions[:10]:
        print(f"  {interaction['preferredName_B']}, 置信度: {interaction['score']:.3f}")
```

### 变异与疾病数据库

变异与疾病数据库收录基因组变异及其与表型的关联，是医学遗传学和精准医学研究的基础。

**dbSNP** 是 NCBI 维护的单核苷酸多态性库，收录短变异（SNP 和小的 indel），每条记录以 `rs` 开头的 ID 唯一标识。dbSNP 是变异注释中最常用的参考库，注释 VCF 文件时常会关联 dbSNP 的 rs ID。dbSNP 的 ID 在版本间保持稳定，但记录的详细信息（如等位基因频率、临床意义）会随数据更新而变化，引用时建议标注版本号。

**ClinVar** 是 NCBI 维护的临床意义变异库，收录变异与疾病关联的提交记录，并给出临床意义分级（致病、可能致病、意义未明、可能良性、良性）。ClinVar 的提交来自不同实验室，可能存在冲突判定，分析时需要查看证据等级和评审状态。ClinVar 采用星标系统表示记录的可信度：零星表示无冲突但证据有限，一星表示多提交者且无冲突，二星及以上表示有专业小组评审。临床报告中引用 ClinVar 时应优先选择高星标记录。

**GWAS Catalog** 收录全基因组关联研究（GWAS）报告的变异位点，记录变异与性状的关联显著性，是研究复杂疾病遗传基础的重要资源。GWAS Catalog 的数据经过人工整理，记录 p 值、效应大小、研究样本量等关键信息，便于跨研究比较。

**OMIM**（Online Mendelian Inheritance in Man）是人类孟德尔遗传在线数据库，收录遗传病和基因的关联，以叙述性记录为主，适合查阅疾病的分子机制。OMIM 编号以 MIM 号标识，前缀 6 表示常染色体基因座，1 表示常染色体显性遗传，2 表示常染色体隐性遗传，3 表示 X 连锁。

**gnomAD**（Genome Aggregation Database）和 **ExAC** 是大规模群体变异频率数据库，gnomAD 是 ExAC 的后继版本，覆盖外显子组和全基因组数据，样本量超过 10 万。这些数据库提供按人群分层的等位基因频率，用于判断变异在人群中的稀有程度，是变异致病性评估的关键依据。分析时常将等位基因频率高于 1% 的变异判定为可能的良性多态，但仍需结合具体疾病和遗传模式判断。

**dbVar** 收录结构变异（如拷贝数变异、倒位、易位），**dbGaP** 收录基因型与表型关联数据（含受控访问数据，需要申请权限）。

下面通过 E-utilities 检索 ClinVar 中 TP53 基因的致病变异。

```python
import requests

url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
params = {
    "db": "clinvar",
    "term": "TP53[gene] AND pathogenic[clinical_significance]",
    "retmax": 10,
    "rettype": "json"
}
response = requests.get(url, params=params)
if response.ok:
    print(response.text[:500])
```

### 非编码 RNA 数据库

非编码 RNA 是基因调控的重要参与者，相关数据库收录了不同类型的非编码 RNA 序列和注释。随着非编码 RNA 研究的深入，这些数据库在转录组分析和疾病机制研究中越来越重要。

**miRBase** 是 microRNA 序列和注释的权威数据库，收录已发现的 miRNA 前体和成熟体序列，并提供命名规范。miRBase 的 ID（如 hsa-miR-21-5p）是 miRNA 研究中的标准引用，其中 hsa 表示物种（人类），miR-21 是家族名，5p 表示来源于前体的 5 端（3p 则表示来源于 3 端）。miRBase 还提供 miRNA 的靶基因预测参考，但靶基因预测通常使用 TargetScan 或 miRanda 等专门工具，miRBase 主要作为序列和命名参考。

**Rfam** 是 RNA 家族数据库，使用协方差模型描述 RNA 家族的序列和二级结构特征，覆盖 miRNA、lncRNA、rRNA、snRNA、snoRNA 等多种类型。Rfam 的协方差模型同时考虑序列和结构保守性，适合识别具有保守二级结构的非编码 RNA，如 riboswitch 和核酶。

**RNAcentral** 整合了 miRBase、Rfam、Ensembl、GENCODE 等多个 RNA 数据库的数据，提供统一的检索入口和 ID（URS ID），便于跨库查询。RNAcentral 解决了非编码 RNA 数据分散的问题，是目前最全面的非编码 RNA 序列索引。

**NONCODE** 和 **lncRNAdb** 收录长链非编码 RNA 数据，lncRNAdb 侧重有功能注释的 lncRNA。LNCipedia 提供 lncRNA 的注释和预测靶基因，是 lncRNA 功能研究的常用参考。

## 2.2.3 数据检索与提交

数据检索与提交是生信分析的入口和出口。检索是从公共数据库获取已有数据用于分析，提交是将分析或实验产生的数据归还数据库供他人使用。本节介绍最常用的检索工具和数据提交流程。

### Entrez 系统与 E-utilities

Entrez 是 NCBI 的统一检索平台，支持跨库搜索和邻接关系浏览。Entrez 的查询语法使用字段限定符，例如 `TP53[Gene]` 限定在 Gene 字段搜索 TP53，`Homo sapiens[Organism]` 限定物种，`RefSeq[Filter]` 限定结果来源。多个条件用 AND、OR、NOT 连接，支持括号组合。这种结构化查询语法使研究人员能够精确控制检索范围，避免无关结果干扰。

E-utilities 是 Entrez 的编程接口，包括以下核心工具：ESearch 用于在指定数据库中检索记录 ID；EFetch 用于按 ID 获取完整记录；ESummary 用于获取记录摘要；ELink 用于查询跨库链接；EInfo 用于查询数据库的元信息；EPost 用于上传 ID 列表到历史服务器；ESpell 用于查询拼写建议。这些工具通过 HTTP 请求调用，返回 XML 或 JSON 格式数据，便于程序化处理。对于大批量检索，E-utilities 提供了 WebEnv 历史机制，可以避免在 URL 中传递超长的 ID 列表，提高检索效率。

下面使用 E-utilities 在核苷酸库中检索人类 TP53 的 RefSeq 序列，并获取 GenBank 格式记录。

```python
from Bio import Entrez

Entrez.email = "your_email@example.com"

search_term = "TP53[Gene] AND Homo sapiens[Organism] AND RefSeq[Filter]"
handle = Entrez.esearch(db="nucleotide", term=search_term, retmax=20)
record = Entrez.read(handle)
handle.close()

id_list = record["IdList"]
print(f"找到 {record['Count']} 条记录")

handle = Entrez.efetch(db="nucleotide", id=id_list, rettype="gb", retmode="xml")
records = Entrez.read(handle)
handle.close()

for record in records[:5]:
    print(f"序列ID: {record['GBSeq_primary-accession']}, 长度: {record['GBSeq_length']} bp")
```

R 语言用户可以使用 **rentrez** 包实现等价功能，接口设计与 Biopython 的 Entrez 模块类似。

```r
# rentrez 等价实现
library(rentrez)

entrez_email("your_email@example.com")
search_res <- entrez_search(db="nucleotide",
                            term="TP53[Gene] AND Homo sapiens[Organism] AND RefSeq[Filter]",
                            retmax=20)

records <- entrez_fetch(db="nucleotide", id=search_res$ids, rettype="gb")
```

::: warning E-utilities 使用规范
- 必须设置有效邮箱（NCBI 要求，便于在出现问题时联系）
- 大批量请求控制在每秒 3 次以内，建议使用 `time.sleep` 控制频率
- 工作日 9:00-17:00（美东时间）避免提交大批量任务，避开使用高峰
- 超过 100 条记录的请求应使用 WebEnv 历史机制，避免 URL 过长
:::

### BLAST 序列搜索

BLAST（Basic Local Alignment Search Tool）是序列相似性搜索的事实标准，使用启发式算法在速度和灵敏度之间取得平衡。BLAST 的核心思想是先在查询序列和数据库序列之间寻找短的高分匹配（seed），再向两端扩展生成局部比对，从而避免全局比对的计算开销。

BLAST 提供多种搜索模式以适应不同的查询与数据库组合：

- **BLASTn**：核酸查询序列对核酸数据库
- **BLASTp**：蛋白查询序列对蛋白数据库
- **BLASTx**：将核酸查询序列翻译为蛋白后对蛋白数据库
- **tBLASTn**：蛋白查询序列对核酸数据库（翻译后比对）
- **tBLASTx**：核酸查询序列翻译后对核酸数据库（翻译后比对）
- **PSI-BLAST**：迭代搜索，利用上一轮结果构建位置特异打分矩阵，发现远缘同源

BLAST 结果的核心指标是 E 值（Expectation value），表示在随机情况下期望出现同等或更高得分比对的数量。E 值越小，比对越可能是真实同源。实际分析中通常将 E 值阈值设为 1e-5 或更严格，并根据查询序列长度调整。除 E 值外，比特得分（bit score）也是常用指标，它独立于数据库规模，便于跨次比较。一致性百分比（identity）和覆盖度（coverage）用于判断比对质量，一般要求覆盖度超过 70% 且一致性足够高，才能可靠推断同源关系。

BLAST 的关键参数包括：`-evalue` 设定 E 值阈值，`-word_size` 设定种子长度（影响灵敏度与速度），`-matrix` 指定替换矩阵（蛋白搜索常用 BLOSUM62），`-gapopen` 和 `-gapextend` 设定空位罚分，`-num_threads` 设定并行线程数。对于远缘同源搜索，可使用 PSI-BLAST 或降低 E 值阈值并启用软掩码处理低复杂度区域。

下面展示本地 BLAST 流程。首先用 makeblastdb 构建数据库，再用 blastp 进行搜索。

```bash
# 本地 BLAST 流程
# 安装: conda install -c bioconda blast

makeblastdb -in reference_proteins.fasta -dbtype prot -out my_database
blastp -query query.fasta -db my_database -out results.txt -evalue 0.001 -outfmt 6

# -outfmt 6 输出列：
# qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore
```

也可以通过 Biopython 调用 NCBI 在线 BLAST 服务，适合不常使用本地数据库的场景。

```python
from Bio.Blast import NCBIWWW, NCBIXML

query_seq = "MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGP"
result_handle = NCBIWWW.qblast("blastp", "nr", query_seq, hitlist_size=10)

for record in NCBIXML.parse(result_handle):
    for alignment in record.alignments[:5]:
        hsp = alignment.hsps[0]
        print(f"{alignment.hit_id}: E值={hsp.expect:.2e}, "
              f"一致性={hsp.identities}/{hsp.align_length}")
```

::: note BLAST 与比对工具的区别
BLAST 用于查询序列与数据库的相似性搜索，发现同源序列；BWA、Bowtie2、minimap2 等工具用于将测序读段比对到参考基因组，处理的是大规模短序列的精确比对。两者目标不同，不能互相替代。
:::

### 数据提交工具

向数据库提交序列和实验数据需要使用专门工具，不同的数据类型对应不同的提交入口。

**BankIt** 是 GenBank 的在线提交工具，适合少量序列的快速提交，通过表单填写注释信息。BankIt 适合初学者和偶尔提交的用户，提交过程引导清晰，但一次只能提交一条序列，不适合大批量数据。

**Sequin** 和 **tbl2asn** 是 NCBI 的桌面提交工具，Sequin 提供图形界面（已停止更新，推荐使用 tbl2asn），tbl2asn 是命令行工具，适合批量提交和自动化流程。tbl2asn 通过模板文件（template.sbt）和 source table（包含样本来源和注释信息）生成符合 GenBank 规范的提交文件。tbl2asn 的典型工作流程是：准备 FASTA 序列和 feature table 文件，运行 tbl2asn 生成 .sqn 提交文件，验证无误后上传至 NCBI。tbl2asn 还会检查注释的规范性，如 CDS 翻译是否正确、特征位置是否合理，避免提交后因格式问题被退回。

**Webin** 是 ENA 的提交门户，支持序列、注释和原始数据的提交，与 NCBI 的提交流程对应。

**SRA Submission** 用于提交高通量测序原始数据，需要先注册 BioProject 和 BioSample，再提交原始数据文件。SRA 提交要求上传原始测序文件（如 FASTQ 或 Illumina 原始 bcl 文件），并填写测序平台、读长、建库策略等元数据。提交完成后，SRA 会生成 SRR accession，数据通常在几日内公开。多数期刊要求数据在文章发表前提交至 SRA 并获取 accession。

**BioProject** 用于组织项目级元数据，描述研究设计和数据集之间的关系；**BioSample** 用于描述样本信息，包括物种、组织、处理方式等。这两个数据库是 SRA 提交的前置依赖。BioProject 的注册需要描述项目目标、资助信息、数据类型，审核通过后获得 PRJNA（NCBI）或 PRJEB（ENA）编号。BioSample 的注册需要描述样本的采集、处理和存储信息，符合 BioSample 标准属性集（如 Human、Plant、Microbe）。提交流程中，BioProject 和 BioSample 的注册可以并行进行，但 SRA 提交依赖这两者完成。

::: note 数据提交的伦理与合规
涉及人类样本的数据提交需要遵守伦理审查和知情同意要求。人类基因组数据通常需要受控访问（如 dbGaP），而非完全公开。国内研究涉及人类遗传资源的数据需按照《人类遗传资源管理条例》提交至 CNCB/NGDC，并向相关部门备案。数据提交前应确认所属机构的数据共享政策和期刊要求。
:::

下面使用 Biopython 构建一个符合 GenBank 规范的序列记录，用于提交。

```python
from Bio import SeqIO
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
from Bio.SeqFeature import SeqFeature, FeatureLocation

seq = Seq("ATGGCCGTTACCGAAGGTGAAACCGTTGAAATGACCGGTGAACTGACCGGTGAACTG")
record = SeqRecord(seq, id="MYGENE001", name="MyGene",
                  description="Example gene for submission",
                  annotations={"molecule_type": "DNA",
                               "organism": "Homo sapiens"})

record.features.append(SeqFeature(
    FeatureLocation(0, 57), type="gene",
    qualifiers={"gene": "example_gene", "locus_tag": "EG001"}
))
record.features.append(SeqFeature(
    FeatureLocation(0, 57), type="CDS",
    qualifiers={"gene": "example_gene", "codon_start": 1,
                "transl_table": 1, "product": "example protein",
                "translation": str(seq.translate())}
))

with open("submission.gb", "w") as f:
    SeqIO.write(record, f, "genbank")
```

## 2.2.4 生物本体与术语库

生物本体为数据提供统一的语义框架，定义概念及其之间的关系（如 `is_a`、`part_of`、`regulates`）。本体在生信分析中的核心价值是使功能富集分析成为可能：通过将基因映射到本体术语，可以判断一组差异基因在哪些功能类别上显著富集。

### Gene Ontology (GO)

Gene Ontology 是使用最广泛的本体，旨在为不同物种的基因功能提供统一描述。GO 包含三个分支：**分子功能**（Molecular Function，描述基因产物在分子层面的活性，如激酶活性、DNA 结合）、**生物过程**（Biological Process，描述基因产物参与的生物学过程，如细胞凋亡、DNA 修复）、**细胞组分**（Cellular Component，描述基因产物作用的细胞位置，如细胞核、线粒体）。

GO 术语之间通过关系连接成有向无环图（DAG），例如 DNA 修复 `is_a` 细胞过程，核仁 `part_of` 细胞核。这种结构允许分析时考虑术语的层级关系，进行富集结果的简化或扩展。

GO 富集分析用于判断一组差异基因在功能上是否显著富集，常用方法是超几何检验。其零假设是差异基因在某个 GO 术语中的分布与背景一致，p 值越小越说明该功能类别在差异基因中富集。除超几何检验外，还有 GSEA（Gene Set Enrichment Analysis）方法，GSEA 不需要预先定义差异基因阈值，而是使用全部基因按排序（如 log2 fold change）计算富集分数，能发现温和但一致的差异。ORA（Over-Representation Analysis）和 GSEA 是两种主流富集方法，分析时可以根据数据特征选择：有明显差异基因列表时用 ORA，需要利用全基因排序信息时用 GSEA。下面是一个简化的超几何检验示例。

```python
from scipy import stats
import pandas as pd

# 模拟差异基因列表与背景基因集
diff_genes = {'TP53', 'BRCA1', 'MYC', 'EGFR', 'KRAS'}
background = {'TP53', 'BRCA1', 'MYC', 'EGFR', 'KRAS', 'PIK3CA',
              'PTEN', 'AKT1', 'MTOR', 'RB1', 'CCND1'}

# GO:0006915（凋亡过程）注释的基因集
go_genes = {'TP53', 'BRCA1', 'PTEN', 'RB1'}

# 超几何检验
k = len(diff_genes & go_genes)              # 差异基因中命中 GO 的数量
n = len(diff_genes)                         # 差异基因总数
K = len(background & go_genes)              # 背景中命中 GO 的数量
N = len(background)                         # 背景基因总数

pval = stats.hypergeom.sf(k - 1, N, K, n)
print(f"GO:0006915 富集 p 值: {pval:.4e}")
```

::: tip 富集分析的背景选择
背景基因集的选择直接影响富集结果。理想情况下，背景应包含所有被检测的基因（如表达分析中所有通过质控的基因），而非全基因组基因。背景选择不当会导致富集结果偏差。
:::

### 其他本体

除 GO 外，还有多个领域特异的本体服务于不同分析需求。本体的设计遵循 OBO（Open Biological and Biomedical Ontologies）Foundry 原则，保证术语定义明确、关系清晰、可机器解析。

**DO**（Disease Ontology）是疾病本体，为疾病提供结构化分类，常用于疾病相关基因的功能注释。DO 的术语层次关系清晰，如病毒性肺炎 `is_a` 肺炎 `is_a` 呼吸系统疾病，便于在富集分析中按层级聚合结果。DO 与 MeSH（医学主题词）、ICD（国际疾病分类）、SNOMED CT 等医学术语系统有交叉引用，便于跨系统查询。

**HPO**（Human Phenotype Ontology）是人类表型本体，标准化描述人类疾病表型，在临床遗传学和罕见病研究中应用广泛。HPO 的术语如 HP:0001263（全面发育迟缓）描述具体的临床表现，通过 HPO 标注患者表型后，可以使用表型相似性匹配算法（如 Phenomizer、Phrank）从候选基因列表中排序，辅助罕见病的分子诊断。HPO 与 OMIM、Orphanet 等数据库关联，是临床基因组分析的标准组件。

**ChEBI**（Chemical Entities of Biological Interest）是化学实体本体，描述小分子化合物及其关系，用于代谢组学和药物研究。ChEBI 为每个化合物提供标准命名、结构信息和生物学角色，便于在不同数据库之间统一化合物标识。

**SO**（Sequence Ontology）是序列特征本体，定义序列上的特征类型（如 gene、exon、CDS、mRNA、UTR、start_codon、stop_codon），GFF3 注释文件中的 type 列即引用 SO 术语。SO 的术语关系明确，如 exon `part_of` mRNA `part_of` gene，保证了注释的层级结构一致性。

**NCBI Taxonomy** 是生物分类学命名数据库，为所有 NCBI 数据库的物种信息提供统一编号（Taxonomy ID，如 9606 对应人类），是物种注释的标准来源。Taxonomy 数据库采用分类学层级（界门纲目科属种），支持按层级检索和聚类分析，在宏基因组学研究中用于物种组成注释。

**EFO**（Experimental Factor Ontology）是实验因素本体，描述实验中的变量和条件，GWAS Catalog 和 ArrayExpress 使用 EFO 标注实验因素。EFO 整合了多个本体（包括 GO、DO、ChEBI），提供跨领域的统一术语，便于多组学数据的整合分析。

## 2.2.5 数据标准与交换格式

统一的数据格式使不同软件和数据库之间可以无歧义地交换数据。本节按数据类型归纳生信分析中最常用的格式规范，重点说明字段含义和常见变体。

### FASTA / FASTQ

FASTA 和 FASTQ 是最基础的序列格式。FASTA 仅存储序列本身，FASTQ 在 FASTA 基础上增加每个碱基的质量值，用于存储测序读段。

**FASTA 格式**由两部分组成：以 `>` 开头的描述行，后接标识符和可选的描述信息；其后一行或多行为序列本身，通常每行 60 或 70 个字符。描述行的第一个空格前为 ID，空格后为描述。NCBI 的 FASTA 描述行采用 `gi|编号|数据库|accession|版本|名称` 的管道分隔格式，便于程序化解析。FASTA 格式简单灵活，但只能存储序列本身，无法携带质量值或注释信息，因此需要配合 GFF 或 GenBank 等注释格式使用。

```
# FASTA
>gene1 Homo sapiens TP53
ATGGAGGAGCCGCAGTCAGATCCTAGCGTCGAGCCCCCTCTGAGTCAGGAAACATTTTCAG
```

**FASTQ 格式**由四行为一个单位的记录组成：第一行以 `@` 开头，后接读段 ID 和描述；第二行为碱基序列；第三行以 `+` 开头，可重复 ID；第四行为质量值字符串，与碱基序列等长。质量值采用 Phred 编码，表示每个碱基被正确识别的概率。Phred 质量值 Q 与错误概率 P 的关系为 Q = -10 log10(P)。Illumina 测序数据的读段 ID 行还包含测序仪、流动槽、tile 坐标和簇坐标等信息，可用于识别 PCR 重复。

```
# FASTQ
@SEQ_ID
GATTTGGGGTTCAAAGCAGTATCGATCAAATAGTAAATCCATTTGTTCAACTCACAGTTT
+
!''*((((***+))%%%++)(%%%%).1***-+*''))**55CCF>>>>>>CCCCCCC65
```

常见的质量编码有两种：**Phred+33**（Sanger/Illumina 1.8+，ASCII 码范围 33-126）和 **Phred+64**（Illumina 1.3-1.7，ASCII 码范围 64-126）。Phred+33 是当前主流标准，分析前需要确认数据来源以避免错误解码。质量值字符 `!` 对应 Q0（错误率 100%），`I` 对应 Q40（错误率 0.01%）。常用质量阈值参考：Q20（错误率 1%）是基础质控线，Q30（错误率 0.1%）是高质量标准，Q40（错误率 0.01%）代表接近完美的碱基识别。现代 Illumina 测序仪多数碱基可达到 Q30 以上。

FASTQ 文件通常需要经过质控（如使用 FastQC 检查质量分布、GC 含量、接头序列等）、接头去除（如使用 Trimmomatic 或 fastp）和低质量裁剪后，才能用于后续比对分析。

```python
from Bio import SeqIO

for record in SeqIO.parse("example.fastq", "fastq"):
    print(f"{record.id}: {record.seq[:30]}..., 质量: {record.letter_annotations['phred_quality'][:10]}")
```

::: warning FASTQ 质量编码确认
旧版 Illumina 数据（1.3-1.7）使用 Phred+64 编码，直接用 Phred+33 解码会得到错误的高质量值。可使用 FastQC 检查数据质量编码，或在 Biopython 中显式指定：`SeqIO.parse(..., "fastq-illumina")`。
:::

### SAM / BAM / CRAM

SAM（Sequence Alignment/Map）格式存储测序读段与参考基因组的比对结果，是变异检测和表达定量的基础。BAM 是 SAM 的二进制压缩格式，CRAM 是更高效的压缩格式，三者信息等价。BAM 文件通过 BGZF 压缩（兼容 gzip 的块压缩），支持按位置随机访问，是分析中默认使用的格式。CRAM 相比 BAM 进一步压缩，通过引用参考序列和读段质量值的有损或无损压缩，文件大小可减少 30-50%，适合大规模数据存储和传输。CRAM 在读取时需要参考基因组文件，因此使用前需要确认参考序列的可访问性。

SAM 文件由头部（以 `@` 开头）和比对记录两部分组成。头部行定义参考序列（`@SQ`，包含 SN 名称和 LN 长度）、读段组（`@RG`，包含样本和文库信息，用于去重和变异 calling）、程序（`@PG`，记录比对软件和命令行）等元信息，是下游分析（如变异检测去重）所需的上下文。头部行以制表符分隔字段，格式为 `@XX\tkey:value\tkey:value`。每条比对记录有 11 个必填字段：

- **QNAME**：读段名称
- **FLAG**：比对标志位，使用位运算编码多个布尔信息（如 0x4 表示未比对，0x10 表示反向互补，0x2 表示双端比对正确，0x100 表示次级比对，0x400 表示 PCR 重复）
- **RNAME**：参考序列名称（染色体）
- **POS**：比对起始位置（1-based）
- **MAPQ**：比对质量，表示比对位置正确的概率，Phred 编码
- **CIGAR**：比对操作字符串，描述比对细节
- **RNEXT**：配对读段所在参考序列
- **PNEXT**：配对读段位置
- **TLEN**：插入片段长度
- **SEQ**：读段序列
- **QUAL**：读段质量

FLAG 字段是理解比对状态的关键。常用标志位包括：0x1 表示成对读段，0x2 表示双端都正确比对，0x4 表示读段未比对，0x8 表示配对读段未比对，0x10 表示读段比对到反向链，0x20 表示配对读段比对到反向链，0x100 表示次级比对（同一读段有更好的比对），0x400 和 0x800 表示 PCR 或测序重复。实际分析中常通过 FLAG 筛选高质量比对，例如去除重复（0x400）和次级比对（0x100）。

CIGAR 字段使用字母表示比对操作：`M` 表示匹配或错配，`I` 表示插入（相对于参考），`D` 表示缺失（相对于参考），`N` 表示跳过（intron，用于剪接比对），`S` 表示软裁剪（序列保留但未比对），`H` 表示硬裁剪（序列未保留），`=` 表示精确匹配，`X` 表示错配。例如 `50M2I48M` 表示 50 个匹配、2 个插入、48 个匹配；`25M150N25M` 表示 25 个匹配、150 个碱基的 intron 跳过、25 个匹配，这是剪接比对（如 STAR、HISAT2 输出）的典型模式。

下面使用 pysam 读取 BAM 文件并提取比对信息。

```python
import pysam

bamfile = pysam.AlignmentFile("aligned.bam", "rb")
for read in bamfile.fetch('chr1', 1000, 2000):
    print(f"{read.query_name}: pos={read.reference_start}, mapq={read.mapping_quality}")
bamfile.close()
```

::: tip SAM 文件排序与索引
分析前通常需要将 SAM 转换为 BAM（`samtools view -bS`）、按坐标排序（`samtools sort`）并建立索引（`samtools index`）。排序后的 BAM 文件支持随机访问，是变异检测工具的输入要求。

samtools 常用操作汇总：

```bash
# SAM 转 BAM
samtools view -bS input.sam -o output.bam

# 按坐标排序
samtools sort output.bam -o sorted.bam

# 建立索引
samtools index sorted.bam

# 查看指定区间的比对
samtools view sorted.bam chr1:1000000-2000000

# 统计比对信息
samtools flagstat sorted.bam

# 过滤读取（如去除 PCR 重复）
samtools view -b -F 1024 sorted.bam -o filtered.bam
```

其中 `-F` 参数用于过滤 FLAG 标志位，1024（0x400）表示 PCR 重复，`-F 1024` 表示去除 PCR 重复。类似的，`-F 4` 过滤未比对读段，`-F 256` 过滤次级比对。
:::

### VCF / BCF / GVCF

VCF（Variant Call Format）存储遗传变异信息，是变异检测的标准输出格式。BCF 是 VCF 的二进制格式，GVCF 是包含所有位点（含非变异位点）的扩展格式，用于多样本联合变异检测。

VCF 文件由元信息行（以 `##` 开头）、表头行（以 `#` 开头）和数据行组成。元信息行定义 INFO 和 FORMAT 字段的含义，表头行定义列名。数据行各字段含义如下：

- **CHROM**：染色体名称
- **POS**：变异位置（1-based，指参考等位基因第一个碱基）
- **ID**：变异标识，常用 dbSNP 的 rs ID
- **REF**：参考基因组上的碱基
- **ALT**：样本观察到的碱基，多等位基因用逗号分隔
- **QUAL**：变异质量，Phred 编码
- **FILTER**：质控过滤状态，PASS 表示通过
- **INFO**：变异的附加信息，以 key=value 形式存储（如 AF=0.01 表示等位基因频率）
- **FORMAT**：样本基因型字段定义
- **样本列**：每个样本的基因型数据，按 FORMAT 定义的顺序排列

FORMAT 字段常见的 key 包括：**GT**（基因型，0/0 表示纯合参考，0/1 表示杂合，1/1 表示纯合变异）、**DP**（覆盖深度）、**GQ**（基因型质量）、**AD**（等位基因深度）。INFO 字段常见的 key 包括：**AF**（等位基因频率）、**AC**（等位基因计数）、**AN**（等位基因总数）、**DP**（总深度）、**FS**（链偏倚检验）、**MQ**（比对质量均值）、**SOR**（链偏倚比值）。这些 INFO 字段常用于变异质控过滤，例如 FS > 60 提示链偏倚，MQ < 40 提示比对质量差。

下面是一个完整的 VCF 记录示例，展示各字段的实际内容：

```
##fileformat=VCFv4.2
##INFO=<ID=AF,Number=A,Type=Float,Description="Allele Frequency">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
##FORMAT=<ID=DP,Number=1,Type=Integer,Description="Read Depth">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	Sample1	Sample2
chr1	12345	rs123	A	T	500	PASS	AF=0.45	GT:DP	0/1:30	1/1:28
chr1	67890	rs456	G	C	50	LowQual	AF=0.01	GT:DP	0/0:25	0/1:10
```

::: tip 多等位基因处理
当同一位点存在多个 ALT 时，用逗号分隔（如 `A,T`）。基因型中的数字按 ALT 顺序对应：0/2 表示携带第二个 ALT 的杂合。分析多等位基因位点时需要先拆分（如使用 bcftools norm -m -），再进行注释和关联分析。
:::

```python
from cyvcf2 import VCF

for variant in VCF("variants.vcf"):
    print(f"{variant.CHROM}:{variant.POS} {variant.REF}>{variant.ALT}, "
          f"QUAL={variant.QUAL}")
```

::: tip VCF 注释顺序
位置为 1-based；REF 为参考基因组上的碱基；ALT 为样本观察到的碱基，多等位基因用逗号分隔。对于 indel，POS 指变异前一个稳定碱基的位置，REF 和 ALT 都包含该碱基，以保证表示的唯一性。
:::

### GFF / GTF / GFF3

GFF（Generic Feature Format）系列存储基因组注释信息，描述序列上的特征（基因、外显子、CDS 等）位置和属性。GFF3 是目前最常用的版本。

GFF3 文件由 9 列组成，以制表符分隔：

- **seqid**：序列 ID（如染色体名）
- **source**：注释来源（如 NCBI、Ensembl）
- **type**：特征类型，使用 SO（Sequence Ontology）术语（如 gene、mRNA、exon、CDS）
- **start**：起始位置（1-based，闭合区间）
- **end**：终止位置
- **score**：特征得分，可为 `.`
- **strand**：链方向（+、-、.）
- **phase**：CDS 的阅读框相位（0、1、2），其他特征为 `.`
- **attributes**：属性字段，以 `;` 分隔的 key=value 对

GFF3 的属性字段通过 `ID` 和 `Parent` 建立特征之间的层级关系，例如 mRNA 的 `Parent` 指向所属 gene，exon 的 `Parent` 指向所属 mRNA。这种结构便于追溯特征的组成关系。常用的属性 key 包括：`ID`（特征唯一标识）、`Name`（显示名称）、`Parent`（父特征 ID，可多个用逗号分隔）、`Alias`（别名）、`Note`（自由文本注释）、`gene_biotype`（基因生物类型，如 protein_coding、lncRNA、pseudogene）。

```
##gff-version 3
chr1	NCBI	gene	1000	5000	.	+	.	ID=gene001;Name=TP53
chr1	NCBI	mRNA	1000	5000	.	+	.	ID=transcript001;Parent=gene001
chr1	NCBI	exon	1000	1500	.	+	.	ID=exon001;Parent=transcript001
chr1	NCBI	CDS	1200	1500	.	+	0	ID=cds001;Parent=transcript001
```

phase 字段对 CDS 特征至关重要，表示该 CDS 在编码序列中的阅读框位置。phase 取值 0、1 或 2，分别表示 CDS 的第一个碱基是密码子的第 1、2、3 个碱基。拼接多个外显子 CDS 时，后一个 CDS 的 phase 由前一个 CDS 的长度决定，正确设置 phase 才能保证翻译结果的正确性。

GTF（Gene Transfer Format）与 GFF 类似，但属性字段使用 `gene_id "value"; transcript_id "value";` 语法，且不强制使用 `Parent` 关系。GTF 在转录组分析工具（如 HISAT2、StringTie）中仍被广泛使用。GTF 与 GFF3 的主要区别在于：GTF 的 type 列仅限于 gene、transcript、exon、CDS、UTR、start_codon、stop_codon 等固定类型，而 GFF3 可以使用任意 SO 术语；GTF 的属性字段必须以 `;` 结尾。

下面使用 gffutils 解析 GFF3 文件并查询基因。

```python
import gffutils

db = gffutils.create_db("annotations.gff3", dbfn="annotations.db",
                        force=True, keep_order=True)
for gene in db.features_of_type('gene'):
    print(f"{gene.id}: {gene.chrom}:{gene.start}-{gene.end} ({gene.strand})")
```

::: warning 位置系统差异
- BED 起始位置为 **0-based**，半开区间（end 不包含）
- GFF3 / VCF / SAM 位置为 **1-based**，闭合区间
跨格式转换时需特别处理，否则易引入 off-by-one 错误。例如 BED 的 `100 200` 对应 GFF3 的 `101 200`。
:::

### BED / bigBed

BED 格式存储基因组区间，是区间操作的基础格式。bigBed 是 BED 的二进制索引格式，适合大数据集，支持随机访问。

BED 格式前 3 列必填，后 9 列可选：

- **chrom**：染色体名称
- **chromStart**：起始位置（0-based）
- **chromEnd**：终止位置（半开区间，不包含）
- **name**：区间名称
- **score**：得分（0-1000）
- **strand**：链方向
- **thickStart / thickEnd**：绘制为粗线的起止位置
- **itemRgb**：显示颜色（R,G,B）
- **blockCount / blockSizes / blockStarts**：分块信息，用于外显子等

下面是一个 6 列 BED 文件示例，包含区间名称、得分和链方向：

```
chr1	100	200	gene1	500	+
chr1	300	450	gene2	800	-
chr2	1000	2000	peak1	900	+
```

BED 的半开区间设计使得区间长度可直接用 `end - start` 计算，避免了 off-by-one 问题。例如上述 `chr1 100 200` 表示长度为 100 bp 的区间，对应 GFF3 中的 `101 200`。BED 文件常用于峰位文件、区间列表和基因组浏览器轨道，是区间操作工具（如 BEDTools、bedops）的标准输入格式。

其他区间格式包括 BEDPE（区间对，用于结构变异和染色质互作）和 NarrowPeak / BroadPeak（用于 ChIP-seq 峰，附加信号值、p 值和 q 值列）。BED12（12 列 BED）通过 block 字段描述一个基因的多个外显子，是表示转录本结构的紧凑格式。

### 其他格式

除上述主要格式外，还有一些在特定分析中常用的格式。

**WIG / bigWig** 存储连续的基因组数值（如测序覆盖度、保守性得分）。WIG 是文本格式，有两种子格式：variableStep（可变步长，按位置记录数值）和 fixedStep（固定步长，按起始位置和步长记录数值）。

下面是一个 variableStep 格式的 WIG 文件示例：

```
variableStep chrom=chr1 span=20
100    10.5
120    12.3
140    11.8

fixedStep chrom=chr2 start=1000 step=50 span=20
5.0
6.2
4.8
```

bigWig 是二进制索引格式，支持随机访问，适合大数据集，在基因组浏览器中绘制覆盖度曲线时常用此格式。bigWig 文件可通过 wigToBigWig 工具从 WIG 转换得到，转换时需要提供染色体长度文件（chrom.sizes）。

**PDB / mmCIF** 存储蛋白质三维结构。PDB 是早期的固定列格式，每行一个原子记录，字段按列对齐；mmCIF 是基于 CIF 的灵活格式，采用键值对方式存储，能容纳更大规模的结构数据。结构分析软件如 PyMOL、Chimera 同时支持两种格式。mmCIF 是 wwPDB 当前的归档标准，新解析的结构以 mmCIF 格式提交和存储。

**mzML / mzXML** 存储质谱数据，记录质荷比、强度和保留时间，是蛋白质组学和代谢组学的原始数据格式。mzML 是当前标准格式，由 PSI（Proteomics Standards Initiative）制定，整合了 mzXML 和 mzData 两种旧格式。质谱分析软件如 MaxQuant、MS-GF+ 以 mzML 为输入。

**HDF5 / H5AD** 用于存储多维度数组数据。HDF5 支持分层组织和压缩，适合大规模数值数据。H5AD 是基于 HDF5 的 Scanpy/AnnData 标准格式，存储单细胞测序的表达矩阵、基因元数据和细胞元数据，是单细胞分析的标准格式。H5AD 文件内部包含 X（表达矩阵）、obs（细胞元数据）、var（基因元数据）、obsm（细胞嵌入，如 UMAP 坐标）等层级，结构清晰，便于程序化访问。

**MAGE-TAB / ISA-Tab** 用于表达实验的元数据交换，遵循 MIAME 和 ISA-Tab 规范，描述实验设计、样本和处理流程。MAGE-TAB 由 EBI 推动，与 ArrayExpress 配合使用；ISA-Tab 更通用，支持多组学实验描述，是数据提交到多个数据库时的统一元数据格式。

下面使用 h5py 创建一个简单的 HDF5 文件，模拟单细胞数据存储。

```python
import h5py
import numpy as np

with h5py.File("single_cell_data.h5", "w") as f:
    grp = f.create_group("expression")
    grp.create_dataset("matrix", data=np.random.rand(100, 2000))
    grp.create_dataset("gene_names",
                       data=np.array([f"Gene_{i}" for i in range(2000)], dtype='S'))
    grp.create_dataset("cell_barcodes",
                       data=np.array([f"Cell_{i}" for i in range(100)], dtype='S'))
```

## 2.2.6 Bioconductor 简介

Bioconductor 是基于 R 语言的生物信息分析开源项目，始于 2003 年，由 Fred Hutchinson 癌症研究中心的 Robert Gentleman 等人发起。Bioconductor 提供超过 2000 个相互协作的 R 包，覆盖基因组学、转录组学、表观组学、蛋白质组学等方向，是 R 语言生信生态的核心。

Bioconductor 的设计哲学是围绕统一的数据结构构建分析流程，使不同包之间可以无缝协作。其核心数据结构包括：**SummarizedExperiment** 用于存储表达矩阵及配套的样本和特征元数据，是 RNA-seq 分析的标准容器，内部包含 assays（一个或多个矩阵）、colData（样本元数据）和 rowData（特征元数据）三部分；**GRanges** 用于存储基因组区间，支持 overlap、coverage、flank 等区间运算，是基因组坐标操作的基础；**ExpressionSet** 是较早的表达数据结构，仍在部分包中使用；**VCF** 类（来自 VariantAnnotation 包）用于存储变异信息。这种统一的数据结构使得不同分析步骤之间可以无缝衔接，例如从比对结果（GRanges）到表达矩阵（SummarizedExperiment）再到差异基因列表（DESeqResults），数据流转不需要额外的格式转换。

Bioconductor 的包发布遵循半年一次的发布周期，每个版本对应特定版本的 R，保证包之间的兼容性。安装时使用专门的 `BiocManager::install()` 函数，而非普通的 `install.packages()`，以确保获取兼容版本的包。

常用包按功能分类如下：

- **GenomicRanges**：基因组区间操作，提供类似 BEDTools 的功能，包括 overlap、coverage、flank、reduce、disjoin 等，是区间运算的基础包
- **DESeq2 / edgeR / limma**：差异表达分析，DESeq2 和 edgeR 针对计数数据（使用负二项分布建模），limma 适用范围更广（基于线性模型，配合 voom 可处理 RNA-seq 数据）
- **Biostrings**：序列处理，提供字符串匹配、翻译、反向互补、限制酶切等操作
- **VariantAnnotation**：VCF 解析与变异注释，支持定位变异在基因组特征（如外显子、剪接位点）中的位置
- **rtracklayer**：导入导出 GFF、BED、WIG、BigWig 等格式，是连接文件与 R 数据结构的桥梁
- **AnnotationDbi / org.Hs.eg.db**：基因注释查询，org.Hs.eg.db 提供人类基因的 ID 映射（Entrez、Symbol、Ensembl、Uniprot 等），类似的其他物种包如 org.Mm.eg.db（小鼠）
- **clusterProfiler**：GO 与 KEGG 富集分析，支持 ORA 和 GSEA 两种模式，并提供丰富的可视化函数
- **GenomicAlignments**：处理 BAM 比对结果，支持 read 计数和比对质量过滤
- **BSgenome**：存储和访问完整基因组序列，提供按区间提取子序列的功能
- **tximport**：从 Salmon、Kallisto 等转录本定量工具导入数据，转换为基因水平表达矩阵

下面展示 DESeq2 差异表达分析的典型流程。DESeq2 内部使用负二项分布建模计数数据，通过方差缩减估计提高低重复样本的稳定性，是 RNA-seq 差异分析的主流工具。

```r
# 差异表达分析示例（DESeq2）
library(DESeq2)

dds <- DESeqDataSetFromMatrix(countData = counts,
                              colData = coldata,
                              design = ~ condition)
dds <- DESeq(dds)
res <- results(dds)
summary(res)
```

GenomicRanges 包提供了 BEDTools 等价的功能，下面展示区间操作的基本用法。

```r
# GenomicRanges 区间操作示例
library(GenomicRanges)

gr1 <- GRanges(c("chr1", "chr2"),
               IRanges(start = c(100, 200), end = c(500, 600)),
               strand = c("+", "-"))
gr2 <- GRanges("chr1", IRanges(300, 700), strand = "+")

# 查找重叠区间
hits <- findOverlaps(gr1, gr2)
print(hits)

# 计算覆盖度
coverage(gr1)
```

下面展示 clusterProfiler 的 GO 富集分析。clusterProfiler 支持 ORA（enrichGO）和 GSEA（gseGO）两种模式，并提供了多种 p 值校正方法。

```r
# GO 富集分析（clusterProfiler）
library(clusterProfiler)
library(org.Hs.eg.db)

ego <- enrichGO(gene = diff_gene_ids,
                OrgDb = org.Hs.eg.db,
                keyType = "ENTREZID",
                ont = "BP",
                pAdjustMethod = "BH",
                pvalueCutoff = 0.05)
head(ego)
```

::: tip Bioconductor 与 Python 生态的对应关系
- GenomicRanges ↔ pyranges / pybedtools
- DESeq2 在 Python 中无直接对应，通常通过 rpy2 调用 R 实现
- Biostrings ↔ Biopython Bio.Seq
- clusterProfiler ↔ gseapy / goatools
对于团队协作，可以根据成员的语言背景选择主分析框架，必要时通过文件交换实现跨语言协作。
:::

## 2.2.7 资源选择建议

实际研究中按数据类型选择对应资源，可以提高检索效率并保证数据质量。下表按数据类型归纳首选数据库和常用编程接口。

| 数据类型 | 首选数据库 | 编程接口 |
|---------|-----------|---------|
| 核酸序列 | GenBank / RefSeq / ENA | Biopython、rentrez |
| 蛋白质序列 | UniProt | REST API |
| 蛋白结构 | PDB / AlphaFold DB | Biopython.PDB |
| 蛋白结构域 | Pfam / InterPro | hmmscan、InterProScan |
| 基因组注释 | Ensembl / GENCODE | Ensembl REST API |
| 基因组可视化 | UCSC Genome Browser | Table Browser |
| 基因表达 | GEO / ArrayExpress | GEOparse |
| 正常组织表达 | GTEx | GTEx Portal |
| 癌症多组学 | TCGA / CCLE | GDC API |
| 蛋白互作 | STRING / BioGRID | STRING API |
| 通路 | KEGG / Reactome | KEGG REST API |
| 变异 | dbSNP / ClinVar / gnomAD | E-utilities |
| 群体频率 | gnomAD / 1000 Genomes | gnomAD API |
| 调控 | ENCODE / JASPAR | ENCODE portal |
| 非编码 RNA | miRBase / RNAcentral | REST API |
| 本体与富集 | GO / KEGG | clusterProfiler、gseapy |

在选择数据库时，需要注意几个原则。第一，优先选择经过人工审校的子集（如 RefSeq 优先于 GenBank，Swiss-Prot 优先于 TrEMBL），以减少数据噪声。人工审校的数据库虽然数据量较小，但注释准确，适合作为分析的标准参考；自动注释的数据库覆盖面广，适合初筛和大规模分析。第二，关注数据库的更新频率和版本，基因组版本（如 GRCh37 与 GRCh38）的差异会导致坐标不一致，注释版本（如 GENCODE 不同 release）的基因集也会变化。分析前需要确认所有数据使用同一版本，避免版本混乱导致坐标错位或基因缺失。第三，涉及人类样本的数据需要遵守相关伦理和法规要求，国内数据需提交至 CNCB/NGDC，国外数据提交至 NCBI 或 EBI，受控数据需通过 dbGaP 或 EGA 申请访问权限。

实际分析中，常见的数据获取路径包括：通过 API 编程获取（适合自动化流程）、通过网页下载批量数据（适合一次性获取参考数据集）、通过命令行工具下载（如 wget、aspera、gsutil，适合大数据集）。对于需要反复使用的数据（如参考基因组、注释文件），建议本地保存并记录版本，避免重复下载。对于 SRA 等大规模数据，优先使用 aspera 或 fasterq-dump 的多线程模式，提高下载效率。

掌握上述资源后，可以结合 Bioconductor（R）或 Biopython / scikit-bio（Python）构建完整的分析流程。对于大型项目，建议建立数据来源和版本的记录，保证分析的可重复性。数据来源记录应包括数据库名称、版本号、下载日期和获取方式，这些信息在论文方法部分和数据可用性声明中需要完整呈现。

::: note 本章要点回顾
本章介绍了生物信息学的三类核心基础设施：

- **数据中心**：NCBI、EBI、DDBJ 通过 INSDC 协作共享数据，CNCB、GISAID、wwPDB 在特定领域有不可替代地位
- **核心数据库**：按核酸、蛋白、结构、基因组、调控、通路、表达、互作、变异、非编码 RNA 分类，各有专精的数据库和检索方式
- **检索工具**：Entrez 与 E-utilities 用于 NCBI 跨库检索，BLAST 用于序列相似性搜索
- **数据格式**：FASTA/FASTQ 存储序列，SAM/BAM/CRAM 存储比对，VCF 存储变异，GFF3/GTF 存储注释，BED 存储区间
- **本体系统**：GO 是功能富集分析的基础，DO、HPO、SO 等服务于特定领域
- **分析框架**：Bioconductor（R）和 Biopython（Python）是两大主流生态，各有优势

实际分析中，建议从明确的数据类型出发，选择对应的首选数据库和工具，建立可重复的分析流程。
:::
