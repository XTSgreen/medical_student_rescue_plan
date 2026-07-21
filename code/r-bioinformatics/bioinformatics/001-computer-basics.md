---
title: 2.1 计算机与编程基础
sidebar:
  order: 1
---

# 2.1 计算机与编程基础

生物信息学分析处理的数据量通常远超普通办公软件的承受范围：一组人全基因组测序数据动辄数十 GB，转录组分析需要并行处理成百上千个样本，流程编排涉及十余个工具的串联调用。这些工作无法在图形界面下点击完成，必须借助命令行、脚本和版本控制等工具完成。

本章按 Linux 操作系统、Shell 脚本编程、环境与包管理、Python 编程、Git 版本控制、容器化技术这六个主题依次展开。这六个主题并非任意挑选，而是覆盖了一次完整生信分析所需的全部基础设施：Linux 提供运行环境与文件管理能力；Shell 脚本将重复操作自动化；Conda 解决多版本软件共存问题；Python 承担数据处理与可视化；Git 保证分析过程可追溯；Docker 与 Singularity 则让分析环境可移植、可复现。每节先给出概念与原理，再给出可直接运行的代码示例，并在关键位置标注常见陷阱。

## 2.1.1 Linux 操作系统

生信分析工具绝大多数运行在 Linux 平台。BWA、STAR、GATK、samtools 等核心软件以 Linux 为首选目标平台，许多工具甚至不提供 Windows 版本。掌握 Linux 不是可选项，而是从事生信分析的前提。

Linux 与 Windows 的根本差异在于其以命令行为主要交互界面。命令行的优势在于：操作可记录、可重放、可脚本化；远程登录时仅传输文本，对网络带宽要求低；批量操作效率远高于图形界面。这些特性恰好契合生信分析需要处理大量文件、长时间运行任务、在远程服务器上作业的需求。

### 文件系统结构

Linux 文件系统采用单根树状结构，所有文件和设备都挂载在根目录 `/` 下。这种设计与 Windows 的多盘符结构（C:、D:）不同：在 Linux 中，U 盘、新硬盘、网络文件系统都会作为某个目录出现在树中，访问方式与本地文件完全一致。这种统一接口简化了程序开发，也使用户无需关心数据物理位置。

Linux 遵循文件系统层次标准（FHS，Filesystem Hierarchy Standard），各目录有明确分工。生物信息学工作中需要识别以下关键目录：

| 目录 | 用途 | 日常使用场景 |
|------|------|--------------|
| `/home` | 用户主目录，`~` 的简写 | 存放项目、脚本、数据 |
| `/usr/local` | 本地编译安装的软件 | 源码安装 samtools 等 |
| `/var/log` | 系统与服务日志 | 排查任务失败原因 |
| `/tmp` | 临时文件，重启清空 | 程序中间产物 |
| `/etc` | 系统配置文件 | 修改环境变量、服务配置 |
| `/proc` | 内核状态接口 | 查看内存、CPU 信息 |
| `/opt` | 第三方软件安装目录 | 商业软件、大型工具套件 |
| `/dev` | 设备文件 | 挂载磁盘、终端设备 |

```bash
# 查看当前所在目录
pwd

# 切换到主目录
cd ~

# 切换到上一级目录
cd ..

# 切换到上一次所在目录
cd -

# 查看目录内容（长格式、人类可读大小）
ls -lh

# 显示隐藏文件（以 . 开头的文件）
ls -la

# 按修改时间倒序排列
ls -lt
```

::: tip 主目录简写
`~` 等价于 `$HOME`，在路径中可以直接使用，例如 `~/data/sample.fastq`。这个简写在脚本中尤为常用，使脚本不依赖具体的用户名。
:::

::: warning /tmp 目录的特性
`/tmp` 在大多数发行版中会在重启时清空，部分系统还会定期清理超过一定时间的文件。不要将分析结果或重要中间文件长期存放在 `/tmp`，否则可能因系统重启而丢失。
:::

路径分为绝对路径与相对路径。绝对路径以 `/` 开头，从根目录开始定位，例如 `/home/bioinfo/data/sample.fastq`；相对路径不以 `/` 开头，从当前目录开始定位，例如 `../data/sample.fastq`。脚本中建议使用绝对路径，避免因执行目录不同导致找不到文件。

### 用户与权限

Linux 是多用户系统，每份文件都有明确的所有者和权限设置。这种设计保证了多用户共享服务器时彼此隔离：A 用户无法误删 B 用户的分析结果，普通用户也无法破坏系统文件。

每个文件有三组权限，分别对应**所有者**、**所属组**、**其他用户**，每组包含**读 r (4)**、**写 w (2)**、**执行 x (1)** 三种权限。`ls -l` 输出第一列的十字符中，第一位是文件类型（`-` 表示普通文件，`d` 表示目录，`l` 表示符号链接），后九位按顺序对应三组权限。

权限对文件和目录的含义不同，这是初学者常混淆的点：

| 权限 | 数字 | 字符表示 | 文件含义 | 目录含义 |
|------|------|----------|----------|----------|
| 读 r | 4 | r | 查看内容 | 列出文件名 |
| 写 w | 2 | w | 修改内容 | 创建/删除文件 |
| 执行 x | 1 | x | 运行脚本 | 进入目录 |

对目录而言，`x` 权限意味着可以进入该目录（`cd` 进入），`r` 权限意味着可以列出目录内容。要访问目录中的文件，必须同时拥有目录的 `x` 权限。这是为什么有时即便文件本身可读，仍然无法访问的原因：父目录缺少 `x` 权限。

```bash
# 创建用户并设置密码
sudo useradd -m -s /bin/bash bioinfo
sudo passwd bioinfo

# 查看文件权限
ls -l sample.fastq
# -rw-r--r-- 1 user group 1024 Jan 1 10:00 sample.fastq

# 数字方式设置权限：所有者 rwx=7, 组 r-x=5, 其他 r-x=5
chmod 755 script.sh

# 字母方式：为所有者添加执行权限
chmod u+x script.sh

# 为所有用户添加读权限
chmod a+r sample.fastq

# 递归修改目录及其内容
chmod -R 755 project_dir/
```

新建文件的默认权限由 `umask` 决定。`umask 022` 表示新建文件权限为 644（rw-r--r--），新建目录为 755（rwxr-xr-x）。可以通过 `umask` 命令查看或修改当前值。

修改所有者使用 `chown`，递归修改目录使用 `-R` 选项：

```bash
sudo chown bioinfo:bioinfo data.txt
sudo chown -R bioinfo:bioinfo /home/bioinfo/project
```

::: note 权限数字的计算
权限数字是三种权限值之和。`rwx` = 4+2+1 = 7，`r-x` = 4+0+1 = 5，`r--` = 4+0+0 = 4。因此 `755` 表示所有者 rwx、组 r-x、其他 r-x。这种方式紧凑但需要熟悉，初学者也可以使用字母方式。
:::

### 进程管理

每个运行的程序是一个进程，拥有唯一的进程 ID (PID)。Linux 通过进程调度器分配 CPU 时间，多进程并行运行。生信分析中长时间运行的任务（如比对、变异检测）需要正确管理，避免 SSH 断开时被终止。

`ps` 查看进程快照，`top` 或 `htop` 提供实时视图。`top` 输出的关键列包括：PID、USER、%CPU、%MEM、COMMAND。系统负载（load average）显示三个数字，分别代表 1、5、15 分钟的平均负载，理想情况下应低于 CPU 核心数。

```bash
# 查看所有进程
ps aux

# 查找特定进程
ps aux | grep bwa

# 按用户过滤
ps -u bioinfo

# 实时监控
top
htop

# 后台运行并忽略挂起信号
nohup python analysis.py > output.log 2>&1 &

# 查看后台任务
jobs
jobs -l

# 将后台任务调到前台
fg %1
```

`nohup` 与 `&` 配合是生信分析中最常用的后台运行方式。`nohup` 使进程忽略 SIGHUP 信号（终端关闭时发送），`&` 使进程在后台运行。输出重定向到文件，便于后续查看。更专业的方案是使用 `tmux` 或 `screen`，它们提供会话保持能力：即使 SSH 断开，会话中的进程继续运行，重新登录后可以恢复会话。

```bash
# 创建新的 tmux 会话
tmux new -s analysis

# 在会话中运行任务后 detach：Ctrl+B 然后按 D

# 重新连接会话
tmux attach -t analysis

# 列出所有会话
tmux ls
```

终止进程使用 `kill` 命令，通过发送信号实现：

```bash
kill 12345        # 发送 SIGTERM，正常终止
kill -9 12345     # 发送 SIGKILL，强制终止
kill -15 12345    # 显式发送 SIGTERM
pkill -f "bwa mem" # 按命令名模式终止
```

::: warning 强制终止的风险
`kill -9` 立即结束进程，进程无法进行清理工作，可能导致临时文件未清理或数据损坏。先尝试 `kill`（即 SIGTERM），等待几秒无响应时再使用 `-9`。对于写入中间文件的生信工具，强制终止可能留下不完整的 BAM 文件，需删除后重新运行。
:::

### 磁盘与文件管理

生物信息学数据文件常达数十 GB，人全基因组测序的 BAM 文件约 100 GB，原始 FASTQ 数据更大。服务器磁盘空间是稀缺资源，多个项目并行时容易耗尽。开始分析前必须检查磁盘空间，避免任务中途因空间不足失败——这种情况下的失败往往伴随着不完整的输出文件，难以诊断。

```bash
# 查看文件系统空间
df -h

# 查看指定目录所在分区的空间
df -h /home/bioinfo

# 查看目录占用（汇总）
du -sh .

# 找出最大的 10 个文件
du -ah | sort -rh | head -n 10

# 查看指定目录下各子目录大小
du -sh */ | sort -h
```

`df` 显示文件系统级别的空间使用，`du` 显示目录级别的占用。两者结果有时不一致：当进程持有已删除文件的句柄时，`df` 显示空间已用，但 `du` 找不到对应文件。这种情况需要重启占用进程或重启系统才能释放。

文件操作命令需要区分清楚，因为部分操作不可逆：

```bash
# 复制文件和目录
cp source.txt dest.txt
cp -r source_dir/ dest_dir/

# 移动或重命名
mv old.txt new.txt

# 删除（不可恢复，谨慎使用 -rf）
rm file.txt
rm -r directory/
rm -i important.txt   # 交互确认

# 创建符号链接，避免数据复制
ln -s /path/to/data data_link

# 创建硬链接（同一文件系统的不同引用）
ln source.txt hardlink.txt
```

符号链接（软链接）与硬链接的区别：符号链接是指向另一个路径的指针，删除原文件后链接失效；硬链接是同一个 inode 的不同引用，删除原文件后硬链接仍可访问内容。生信分析中通常使用符号链接整理工作目录，硬链接较少使用。

::: tip 符号链接的用途
将分散在不同目录的样本数据链接到统一工作目录，方便批量处理，且不占用额外空间。例如将 `/data/project_A/sample1.fastq`、`/data/project_B/sample2.fastq` 都链接到 `~/analysis/` 下，分析脚本只需扫描一个目录。
:::

::: warning rm -rf 的危险性
`rm -rf` 递归强制删除，没有任何确认。`rm -rf /` 会删除整个系统。绝对不要在脚本中使用 `rm -rf $VAR/`，当 `$VAR` 为空时命令变成 `rm -rf /`，造成灾难性后果。安全做法是先检查变量非空：`rm -rf "${VAR:?error}/"`。
:::

### 文本编辑器

vim 与 nano 是命令行两大编辑器。远程登录服务器修改配置文件时，图形界面编辑器无法使用，必须依赖命令行编辑器。nano 适合快速修改配置文件，vim 适合长时间编写代码。

nano 是所见即所得的编辑器，底部显示快捷键，新手友好。vim 采用模态设计：在普通模式下按键被解释为命令，按 `i` 进入插入模式才能输入文本，按 `Esc` 回到普通模式。这种设计初学时较陡，但熟练后编辑效率极高，且 vim 预装在几乎所有 Linux 系统中。

| 操作 | nano | vim |
|------|------|-----|
| 打开文件 | `nano file` | `vim file` |
| 编辑模式 | 直接输入 | 按 `i` 进入插入模式 |
| 保存 | `Ctrl+O` | `Esc` 后输入 `:w` |
| 退出 | `Ctrl+X` | `Esc` 后输入 `:q` |
| 保存退出 | `Ctrl+O` 后 `Ctrl+X` | `Esc` 后输入 `:wq` |
| 强制退出不保存 | `Ctrl+X` 后选 N | `Esc` 后输入 `:q!` |
| 跳到行首 | `Ctrl+A` | `0` |
| 跳到行尾 | `Ctrl+E` | `$` |
| 搜索 | `Ctrl+W` | `/pattern` 后回车 |

vim 普通模式下的常用命令：`gg` 跳到文件首，`G` 跳到文件末，`:100` 跳到第 100 行，`dd` 删除整行，`yy` 复制整行，`p` 粘贴，`u` 撤销，`Ctrl+R` 重做。

### 环境变量

环境变量是程序运行时的配置信息，由 shell 维护并传递给子进程。生信工具依赖多个环境变量确定行为：`PATH` 决定命令查找路径，`LD_LIBRARY_PATH` 决定动态库查找路径，`PYTHONPATH` 决定 Python 模块查找路径，`JAVA_HOME` 决定 Java 运行时位置。

理解环境变量的传递机制很重要：父进程的环境变量会被子进程继承，但子进程对环境变量的修改不会影响父进程。这就是为什么在脚本中 `export PATH=...` 后，脚本退出后 PATH 又恢复原值。

```bash
# 查看变量值
echo $PATH

# 查看所有环境变量
env
printenv

# 临时设置（仅当前会话有效）
export PATH=/home/user/bin:$PATH

# 永久生效：写入 bashrc
echo 'export PATH=/home/user/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

`PATH` 变量是一个以冒号分隔的目录列表。执行命令时，shell 按 `PATH` 中目录的顺序查找同名可执行文件，找到的第一个被执行。因此 `PATH` 中前面的目录优先级更高。将自定义路径放在 `PATH` 前面可以覆盖系统默认命令。

配置文件的加载顺序：登录 shell 读取 `~/.bash_profile`（或 `~/.profile`），非登录交互 shell 读取 `~/.bashrc`。Conda 初始化通常写入 `~/.bashrc`，因此在新开终端时自动生效。

::: note 环境变量丢失问题
有时通过 `ssh server "command"` 直接执行命令时，环境变量似乎丢失。这是因为非交互非登录 shell 默认不读取 `~/.bashrc`。解决方法是在 `~/.ssh/environment` 中设置所需变量，或在命令前显式 source 配置文件：`ssh server "source ~/.bashrc && command"`。
:::

### 压缩与归档

生信数据文件体积大，传输和存储都需要压缩。`tar` 是最常用的归档工具，配合 `gzip` 或 `bzip2` 实现压缩。归档（archive）与压缩（compress）是两个概念：归档将多个文件合并为单个文件，压缩通过算法减少文件体积。`tar` 命令通常同时完成这两个操作。

```bash
# 创建 gzip 压缩归档
tar czvf archive.tar.gz directory/

# 解压到当前目录
tar xzvf archive.tar.gz

# 解压到指定目录
tar xzvf archive.tar.gz -C /target/

# 查看 archive 内容（不解压）
tar tzvf archive.tar.gz

# gzip 单文件
gzip file.txt        # 生成 file.txt.gz，原文件删除
gunzip file.txt.gz

# zcat 直接查看 gzip 压缩文件内容
zcat file.txt.gz | head
```

不同压缩算法在速度与压缩率间权衡：

| 格式 | 压缩命令 | 解压命令 | 特点 |
|------|----------|----------|------|
| .tar.gz | `tar czvf` | `tar xzvf` | 速度与压缩率平衡，最常用 |
| .tar.bz2 | `tar cjvf` | `tar xjvf` | 压缩率更高，速度较慢 |
| .tar.xz | `tar cJvf` | `tar xJvf` | 压缩率最高，速度最慢 |
| .zip | `zip -r` | `unzip` | 跨平台兼容 |
| .gz | `gzip` | `gunzip` | 单文件压缩，与 tar 配合 |
| .zst | `zstd` | `unzstd` | 新格式，速度极快 |

生信数据中 FASTQ、BAM、VCF 等格式通常带有 gzip 压缩版本（`.fastq.gz`、`.bam` 本身已压缩）。许多工具（如 `samtools view`、`zcat`、`pigz`）可以直接读写压缩文件，避免解压步骤。

### 远程访问与文件传输

生信分析通常在远程服务器或集群上进行。SSH 提供安全的远程登录和文件传输，所有通信加密。密钥认证比密码更安全，且免输入，是连接服务器的推荐方式。

SSH 密钥基于非对称加密：本地保留私钥，公钥复制到远程服务器的 `~/.ssh/authorized_keys` 文件中。连接时，服务器用公钥发起挑战，本地用私钥应答，全程不传输密码。

```bash
# 远程登录
ssh username@hostname

# 指定端口
ssh -p 2222 username@hostname

# 生成密钥对
ssh-keygen -t rsa -b 4096

# 生成更安全的 ed25519 密钥
ssh-keygen -t ed25519

# 将公钥复制到远程主机
ssh-copy-id username@hostname

# 复制文件到远程
scp localfile.txt username@hostname:/remote/path/

# 递归复制目录
scp -r localdir/ username@hostname:/remote/path/

# 使用 rsync 同步目录（仅传变化部分）
rsync -avz localdir/ username@hostname:/remote/path/

# 断点续传
rsync -avz --partial --progress localdir/ username@hostname:/remote/path/
```

`~/.ssh/config` 文件可以配置主机别名，简化连接命令：

```
Host cluster
    HostName login.cluster.org
    User bioinfo
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
```

配置后，`ssh cluster` 即可连接，`scp file cluster:/path/` 即可传输文件。`ServerAliveInterval` 让客户端定期发送保持连接的包，防止长时间不活动后连接被断开。

::: tip rsync 与 scp 的选择
单次传输少量文件用 `scp`，同步大量文件或大文件用 `rsync`。`rsync` 支持断点续传和差异同步，仅传输变化的部分，对网络带宽和传输时间都有显著节省。传输几十 GB 的测序数据时，`rsync` 是首选。
:::

端口转发是 SSH 的重要功能。生信分析中常用的场景是将远程服务器上运行的 Jupyter Notebook 端口转发到本地：

```bash
# 本地端口转发：访问 localhost:8888 等同于访问远程的 localhost:8888
ssh -L 8888:localhost:8888 username@hostname

# 远程端口转发
ssh -R 8888:localhost:8888 username@hostname
```

### 管道与重定向

重定向改变命令的输入输出流向，管道将一个命令的输出连接到另一个命令的输入。理解这两个机制是构建复杂命令行操作的基础。

每个进程启动时默认打开三个文件描述符：标准输入（stdin，fd 0）、标准输出（stdout，fd 1）、标准错误（stderr，fd 2）。重定向就是改变这些文件描述符指向的位置。

```bash
# 标准输出重定向（覆盖）
ls > filelist.txt

# 追加
echo "log entry" >> logfile.txt

# 标准错误重定向
command 2> error.log

# 同时重定向标准输出和标准错误
command > output.log 2>&1
command &> output.log

# 丢弃输出
command > /dev/null 2>&1

# 从文件输入
sort < unsorted.txt

# 管道：统计包含 pattern 的行数
cat file.txt | grep "pattern" | wc -l

# Here document：多行输入
cat << 'EOF' > config.txt
parameter1 value1
parameter2 value2
EOF
```

管道是 Unix 哲学的核心体现：每个程序做好一件事，通过管道组合完成复杂任务。`program1 | program2 | program3` 将前一个程序的 stdout 连接到后一个程序的 stdin。生信分析中常见的管道应用：

```bash
# 统计 FASTQ 文件 reads 数量
zcat sample.fastq.gz | awk 'NR%4==1' | wc -l

# 提取 BAM 文件中特定区域的 reads
samtools view input.bam chr1:1000000-2000000 | cut -f1 | sort -u | wc -l

# 从 VCF 中提取 PASS 的变异
zcat variants.vcf.gz | grep -v '^#' | awk '$7=="PASS"' | wc -l
```

::: warning 管道中的错误处理
默认情况下，管道只看最后一个命令的退出状态。如果中间命令失败，整个管道仍可能"成功"。例如 `cat nonexistent.txt | grep "pattern"` 不会报错。使用 `set -o pipefail` 可以让管道中任一命令失败时整体失败，这对脚本可靠性至关重要。
:::

### 查找与过滤

`find` 按条件查找文件，`grep` 按模式搜索文本内容。这两个工具是日常操作中最高频的命令之一。

`find` 遍历目录树，根据文件名、大小、修改时间、权限等条件查找。它支持 `-exec` 选项对找到的每个文件执行命令：

```bash
# 按文件名查找
find . -name "*.fastq"

# 大小写不敏感
find . -iname "*.FASTQ"

# 按大小查找（大于 100 MB）
find . -size +100M

# 按修改时间查找（7 天内）
find . -mtime -7

# 按类型查找（仅目录）
find . -type d -name "results"

# 组合条件：AND / OR
find . -name "*.fastq" -o -name "*.fasta"
find . -name "*.bam" -size +1G

# 对找到的文件执行命令
find . -name "*.txt" -exec wc -l {} \;

# 批量执行（+ 比 \; 更高效）
find . -name "*.fastq" -exec gzip {} +
```

`grep` 按模式搜索文本内容，支持基本正则表达式（BRE）和扩展正则表达式（ERE）。`-E` 选项启用扩展正则，支持 `+`、`?`、`|` 等元字符：

```bash
grep "gene" file.txt          # 基本搜索
grep -i "gene" file.txt       # 忽略大小写
grep -v "gene" file.txt       # 显示不匹配的行
grep -c "gene" file.txt       # 只显示匹配行数
grep -rn "error" /var/log/    # 递归显示行号
grep -E "gene[0-9]+" file.txt # 扩展正则
grep -A 3 "gene" file.txt     # 显示匹配行及后 3 行
grep -B 2 "gene" file.txt     # 显示匹配行及前 2 行
grep -C 5 "gene" file.txt     # 显示匹配行及前后各 5 行
grep -f patterns.txt file.txt # 从文件读取多个模式
```

生信分析中 grep 的典型应用包括：从 GFF 提取特定基因注释、从日志中找出错的行、从 SAM 文件中过滤未比对的 reads。

## 2.1.2 Shell 脚本编程

命令行操作虽然强大，但每次都需要手动输入命令。当分析流程涉及多个步骤、需要重复执行或参数变化时，将这些命令组织成脚本可以大幅提升效率。Shell 脚本就是一系列命令的有序集合，由 shell 解释执行。

生信分析中 Shell 脚本的典型用途：批量处理多个样本、串接多个工具形成流程、自动化质量控制与报告生成、定时运行定期任务。熟练编写 Shell 脚本是从手动操作到自动化分析的关键一步。

### 通配符与变量

Shell 通配符（globbing）用于匹配文件名，由 shell 在执行命令前展开。这与正则表达式不同，通配符只用于文件名匹配，规则更简单。

```bash
# 通配符
ls *.fastq              # 所有 fastq 文件
ls sample?.fastq        # sample1.fastq, sampleA.fastq（? 匹配单个字符）
ls sample[123].fastq    # sample1, sample2, sample3（[] 匹配其中之一）
ls sample[!0-9].fastq   # 不以数字结尾的样本
mkdir project_{A,B,C}   # 创建 project_A, project_B, project_C（花括号展开）

# 变量
data_dir=/data/project
sample_name="sample_001"
echo "${sample_name}_R1.fastq"   # 大括号避免歧义

# 命令替换
current_date=$(date +%Y%m%d)
file_count=$(ls | wc -l)
```

变量赋值时等号两边不能有空格，这是初学者最常犯的错误。`data_dir = /data/project` 会被解释为执行命令 `data_dir` 并传参 `=` 和 `/data/project`。

变量引用时建议加双引号：`"$var"`。不加引号时，如果变量值包含空格，会被拆分为多个参数；加双引号则保持原值。单引号 `'$var'` 不进行变量展开，输出字面字符串 `$var`。

```bash
file="my file.txt"
ls $file       # 错误：被拆分为两个参数 "my" 和 "file.txt"
ls "$file"     # 正确：作为一个参数
```

::: tip 花括号的用途
`${var}_suffix` 用花括号明确变量边界，避免歧义。例如 `echo $var_R1` 会被解释为变量 `var_R1`，而 `echo ${var}_R1` 才能正确输出 `sample_001_R1`。在变量名后紧跟下划线、字母或数字时，应使用花括号。
:::

### 数组与特殊变量

bash 支持一维数组（bash 4.0+ 支持关联数组）。数组在批量处理样本时极为有用，可以将样本列表存储在一个变量中：

```bash
# 数组
samples=(sample1 sample2 sample3)
echo ${samples[0]}          # 第一个元素
echo ${samples[@]}          # 所有元素
echo ${#samples[@]}         # 数组长度
samples+=(sample4)          # 追加元素

# 遍历数组
for s in "${samples[@]}"; do
    echo "Processing $s"
done

# 关联数组（bash 4.0+）
declare -A gene_lengths
gene_lengths["TP53"]=393
gene_lengths["BRCA1"]=1863
for gene in "${!gene_lengths[@]}"; do
    echo "$gene: ${gene_lengths[$gene]}"
done
```

特殊变量由 shell 自动设置，提供脚本运行环境信息：

```bash
echo "Script: $0"           # 脚本名
echo "Args: $#"             # 参数个数
echo "All args: $@"         # 所有参数（每个参数独立）
echo "All args: $*"         # 所有参数（合并为单个字符串）
echo "Exit status: $?"      # 上一命令退出状态
echo "PID: $$"              # 当前进程 ID
echo "Background PID: $!"   # 最近后台进程 ID
```

`$@` 与 `$*` 的区别：`$@` 保留每个参数的独立性，加引号时（`"$@"`）每个参数仍是一个独立的引号字符串；`$*` 将所有参数合并为一个字符串。脚本中处理参数时应使用 `"$@"`。

### 条件判断

`if` 语句根据命令退出状态决定执行分支。退出状态 0 表示成功，非 0 表示失败。`test` 命令或方括号 `[ ]` 用于条件测试，方括号两侧必须有空格。

bash 提供两种测试语法：`[ ]` 是 POSIX 兼容语法，`[[ ]]` 是 bash 扩展语法。`[[ ]]` 支持模式匹配（`=~`）、逻辑运算符（`&&`、`||`）、无需引号保护变量，推荐在 bash 脚本中使用。

```bash
# 文件测试
if [ -f "data.txt" ]; then
    echo "File exists"
elif [ -d "data" ]; then
    echo "Directory exists"
else
    echo "Not found"
fi

# 使用 [[ ]] 扩展语法
if [[ -f "data.txt" && $count -gt 0 ]]; then
    echo "File exists and count is positive"
fi

# 数值比较：-eq -ne -lt -le -gt -ge
if [ $count -gt 100 ]; then
    echo "Large dataset"
fi

# 字符串比较
if [ "$str1" = "$str2" ]; then
    echo "Equal"
fi

# 正则匹配（仅 [[ ]] 支持）
if [[ "$filename" =~ ^sample_[0-9]+\.fastq$ ]]; then
    echo "Valid sample filename"
fi
```

常用文件测试运算符：

| 运算符 | 含义 |
|--------|------|
| `-f file` | 存在且为普通文件 |
| `-d dir` | 存在且为目录 |
| `-e path` | 存在（任何类型） |
| `-r file` | 可读 |
| `-w file` | 可写 |
| `-x file` | 可执行 |
| `-s file` | 存在且非空 |
| `file1 -nt file2` | file1 比 file2 新 |
| `file1 -ot file2` | file1 比 file2 旧 |

`case` 语句适合多分支离散值判断，比一连串 `if-elif` 更清晰：

```bash
case $file_type in
    *.fastq)  echo "FASTQ file" ;;
    *.fasta)  echo "FASTA file" ;;
    *.bam)    echo "BAM file" ;;
    *.vcf)    echo "VCF file" ;;
    *)        echo "Unknown" ;;
esac

# 多模式匹配
case $status in
    0)      echo "Success" ;;
    1|2|3)  echo "Warning" ;;
    *)      echo "Error" ;;
esac
```

### 循环

`for` 遍历列表，`while` 在条件为真时重复执行。批量处理文件是循环最常见的用途。

```bash
# 遍历文件
for file in *.fastq; do
    echo "Processing $file"
    wc -l "$file"
done

# 遍历数组
for sample in "${samples[@]}"; do
    fastqc "${sample}.fastq"
done

# C 风格循环
for ((i=1; i<=10; i++)); do
    echo "Number: $i"
done

# 步长循环
for i in {1..10..2}; do
    echo "Odd: $i"
done
```

`while` 循环配合 `read` 命令可以逐行处理文件，这是处理表格数据的常用模式：

```bash
# 逐行读取文件
while read -r line; do
    echo "$line"
done < data.txt

# 读取多列（CSV 处理）
while IFS=',' read -r col1 col2 col3; do
    echo "Name: $col1, Value: $col2"
done < data.csv

# 跳过注释行和空行
while read -r line; do
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    process "$line"
done < config.txt
```

`break` 跳出循环，`continue` 跳过本次迭代进入下一次。`while` 循环的常见模式包括等待文件出现、监控进程状态：

```bash
# 等待文件出现
while [ ! -f "output.txt" ]; do
    sleep 5
done

# 等待进程结束
while pgrep -f "bwa mem" > /dev/null; do
    sleep 60
    echo "Still running..."
done
```

### 函数

函数将重复使用的命令封装为可调用单元，使脚本结构清晰、易于维护。使用 `local` 定义局部变量避免污染全局作用域，这是编写健壮函数的关键。

```bash
process_file() {
    local file=$1
    local output_dir=$2
    if [ -f "$file" ]; then
        wc -l "$file"
        return 0
    else
        echo "Error: $file not found" >&2
        return 1
    fi
}

process_file "data.fastq" "results/"

# 通过命令替换捕获函数输出
get_file_count() {
    ls -1 "$1" 2>/dev/null | wc -l
}
count=$(get_file_count "data/")
```

函数通过位置参数接收参数（`$1`、`$2` 等），通过 `return` 返回退出状态码（0-255）。要返回字符串或数值，使用 `echo` 输出并通过命令替换捕获。区分这两种返回方式很重要：

```bash
# 返回状态码
check_file() {
    [ -f "$1" ]
}

# 返回字符串
get_filename() {
    basename "$1" .fastq
}

if check_file "data.fastq"; then
    name=$(get_filename "data.fastq")
    echo "Found: $name"
fi
```

::: tip 函数与脚本的参数
函数内部 `$1`、`$2` 是函数的参数，而非脚本的参数。要在函数内访问脚本参数，需在调用函数时显式传递，或使用额外变量保存。这是初学者常遇到的混淆点。
:::

### 调试技巧

Shell 脚本没有类型检查和编译阶段，错误往往在运行时才暴露。`set` 命令开启调试选项，是编写健壮脚本的关键：

| 选项 | 作用 |
|------|------|
| `set -x` | 打印执行的每条命令（带 + 前缀） |
| `set -e` | 命令失败时立即退出 |
| `set -u` | 使用未定义变量时报错 |
| `set -o pipefail` | 管道中任一命令失败则整体失败 |
| `set -v` | 打印读取的每行（不展开变量） |

```bash
#!/bin/bash
set -euxo pipefail

input_fastq="${1:?Error: input FASTQ required}"
output_dir="${2:-results}"

mkdir -p "$output_dir"
fastqc "$input_fastq" -o "$output_dir"
```

`set -e` 使脚本在任一命令失败时立即退出，避免错误被忽略后继续执行造成更大问题。`set -u` 强制变量先定义后使用。`set -o pipefail` 让管道中的错误不被吞掉。组合使用 `set -euo pipefail`（常简写为 `set -euo pipefail`）是 Shell 脚本的最佳实践。

但 `set -e` 有一些例外情况需要了解：在 `if`、`while`、`||`、`&&` 等条件判断中失败的命令不会触发退出。这使我们可以安全地写 `if command; then ...`。

::: tip 调试单个命令
运行时使用 `bash -x script.sh` 开启跟踪，`bash -n script.sh` 仅检查语法不执行，`bash -v script.sh` 显示读取的每一行。这些选项不修改脚本内容，便于临时调试。
:::

### 常用文本处理工具

`awk`、`sed`、`cut`、`sort`、`uniq` 是 Shell 文本处理的核心工具，组合使用可以完成复杂的数据处理。这些工具遵循 Unix 哲学：每个工具专注一个功能，通过管道组合实现复杂任务。

**awk** 是一个完整的文本处理语言，按行处理输入，将每行按分隔符拆分为字段。`$0` 表示整行，`$1`、`$2` 表示各字段，`NR` 是当前行号，`NF` 是字段数。awk 程序由 `BEGIN`、主体、`END` 三部分组成：

```bash
# awk 按列处理
awk '{print $1}' data.txt                       # 打印第一列
awk -F, '{print $1, $3}' data.csv               # 指定逗号分隔
awk '$3 > 100 {print $0}' data.txt              # 条件过滤
awk '{sum+=$1} END {print sum/NR}' numbers.txt  # 计算平均值

# FASTQ 文件平均读长
awk 'NR%4==2 {sum+=length($0); count++} END {print sum/count}' sample.fastq

# 统计 GFF 中各类特征数量
awk '$3=="gene" {gene++} $3=="exon" {exon++} $3=="CDS" {cds++} 
END {print "Gene:", gene; print "Exon:", exon; print "CDS:", cds}' annotation.gff

# 计算每个染色体的基因密度
awk '$3=="gene" {count[$1]++} END {for (chr in count) print chr, count[chr]}' genes.gff | sort -k1,1
```

**sed** 是流编辑器（stream editor），按行处理文本，支持替换、删除、插入等操作。`s/old/new/` 是最常用的替换命令：

```bash
sed 's/old/new/g' file.txt          # 全局替换（g 表示每行所有匹配）
sed 's/old/new/' file.txt           # 仅替换每行第一个匹配
sed -i 's/old/new/g' file.txt       # 原地修改（-i）
sed -i.bak 's/old/new/g' file.txt   # 原地修改并备份原文件
sed '/pattern/d' file.txt           # 删除匹配行
sed -n '10,20p' file.txt            # 打印 10-20 行
sed 's/^\s*//' file.txt             # 删除行首空白
```

::: warning sed -i 的风险
`sed -i` 直接修改原文件，没有撤销机会。建议先不带 `-i` 测试输出正确后再加 `-i`，或使用 `-i.bak` 自动创建备份文件。
:::

**cut** 提取列，比 awk 更简单但功能有限：

```bash
cut -f1,3 data.txt                  # 制表符分隔，提取 1、3 列
cut -d, -f1 data.csv                # 逗号分隔
cut -c1-10 file.txt                 # 提取每行 1-10 字符
```

**sort** 与 **uniq** 配合用于统计频次。`sort` 支持按字典序、数值、月份等排序，`uniq` 去除相邻重复行（因此必须先排序）：

```bash
sort data.txt | uniq -c | sort -nr  # 统计并按频率排序
sort -k2,2n data.txt                # 按第 2 列数值升序
sort -k1,1 -k2,2n bed.txt           # 先按第 1 列字典序，再按第 2 列数值
```

生信分析中这些工具的典型组合：

```bash
# 统计 FASTQ reads 数量
wc -l sample.fastq | awk '{print $1/4}'

# 提取 BED 文件中所有染色体并统计数量
cut -f1 regions.bed | sort -u | wc -l

# 从 VCF 中提取每个样本的变异数量
zcat variants.vcf.gz | grep -v '^#' | cut -f10 | grep -oE '[^:]+:[^:]+:[^:]+' | sort | uniq -c

# 计算每条染色体的基因数
awk '$3=="gene" {print $1}' genes.gff | sort | uniq -c | sort -k1,1nr
```

## 2.1.3 环境与包管理

生信分析使用的软件工具链极其复杂：不同工具依赖不同版本的 Python、不同版本的底层库，甚至不同版本的编译器。直接在系统上安装所有工具几乎必然导致冲突——A 工具需要 samtools 1.10，B 工具需要 samtools 1.15，两者无法共存。环境管理器通过创建隔离的环境解决了这个问题。

Conda 是生物信息学最流行的环境管理器。它同时管理 Python 包和系统级软件（如 samtools、bwa、fastqc），这是它相比 pip 的最大优势。Mamba 是 Conda 的 C++ 重写版，依赖解析速度更快，命令完全兼容，推荐替代 Conda。

### Conda 与 Mamba

Conda 由 Anaconda 公司开发，最初为 Python 数据科学场景设计，后被生信社区广泛采用。它的核心机制是：每个环境是一个独立目录，包含自己的 Python 解释器、库和可执行文件。激活环境时，shell 的 PATH 优先指向该环境的 bin 目录，使该环境的工具优先于系统工具。

```bash
# 安装 Miniconda
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh

# 初始化
conda init bash
source ~/.bashrc

# 安装 Mamba
conda install -c conda-forge mamba

# 之后所有 conda 命令可以用 mamba 替换
mamba install -c bioconda samtools
```

::: tip Miniconda vs Anaconda
Miniconda 是最小化安装，仅包含 conda 和 Python；Anaconda 预装大量数据科学包，体积庞大。生信分析中推荐 Miniconda，按需安装所需软件，避免占用磁盘和产生不必要的依赖冲突。
:::

### 频道配置

频道是 Conda 包的来源仓库。Conda 从配置的频道中查找并安装软件包，频道顺序决定优先级。生物信息学推荐配置顺序为 conda-forge、bioconda、defaults，优先级从高到低。

这三个频道各有分工：**conda-forge** 是社区维护的通用软件仓库，提供大量开源软件的最新版本；**bioconda** 专门收录生物信息学软件，由生信社区维护；**defaults** 是 Anaconda 官方频道，软件较旧但稳定。bioconda 的软件依赖 conda-forge 提供的库，因此 conda-forge 必须在 bioconda 之前。

```bash
# 配置清华镜像源（国内用户推荐，加速下载）
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/conda-forge/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/bioconda/
conda config --set show_channel_urls yes

# 设置严格频道优先级
conda config --set channel_priority strict

# 查看当前频道
conda config --show channels
```

::: warning 频道顺序
Bioconda 依赖 conda-forge 提供的库，必须保证 conda-forge 优先级高于 bioconda。设置 `channel_priority strict` 可避免版本冲突，确保依赖解析时优先选择高优先级频道的包。如果不设置严格优先级，conda 可能混用不同频道的包，导致难以调试的问题。
:::

### 环境管理

每个 Conda 环境相互隔离，包含独立的 Python 版本和软件包。为不同分析任务创建独立环境，避免依赖冲突。例如，RNA-seq 流程使用一套工具版本，重测序流程使用另一套，两者不应相互影响。

```bash
# 创建环境
conda create -n rna_seq python=3.9
conda create -n genome python=3.9 numpy pandas

# 激活与退出
conda activate rna_seq
conda deactivate

# 查看所有环境
conda env list

# 在环境中安装软件
conda install -c bioconda samtools bwa fastqc
mamba install -c bioconda star hisat2 stringtie

# 查看环境中已安装的包
conda list
conda list | grep samtools

# 导出环境配置
conda env export > environment.yml
conda env export --no-builds > environment.yml  # 不包含 build 信息，跨平台友好

# 从配置文件重建环境
conda env create -f environment.yml

# 删除环境
conda env remove -n rna_seq

# 清理缓存
conda clean -a
```

| 操作 | 命令 |
|------|------|
| 创建环境 | `conda create -n name python=3.9` |
| 激活环境 | `conda activate name` |
| 退出环境 | `conda deactivate` |
| 列出环境 | `conda env list` |
| 安装包 | `conda install -c bioconda pkg` |
| 导出环境 | `conda env export > env.yml` |
| 重建环境 | `conda env create -f env.yml` |

::: tip 环境导出的最佳实践
`environment.yml` 文件记录环境中的所有软件及版本，是分析可复现的关键。在论文发表时附上这个文件，其他研究者可以精确重建分析环境。注意 `--no-builds` 选项可以使文件跨平台使用，因为不同平台的 build 字符串不同。
:::

Conda 环境的常见问题及解决方法：

::: warning 常见问题
- **环境冲突**：安装新包时可能升级已有包，破坏依赖关系。解决：在安装前用 `conda install --dry-run` 预览变更，或使用 `mamba` 获得更快的依赖解析
- **Solving environment 慢**：Conda 的依赖解析算法较慢，复杂环境可能耗时数分钟。解决：使用 Mamba，或将环境拆分为多个
- **软件不在 Conda 中**：少数生信软件未上传到 bioconda。解决：从源码编译安装到环境的 bin 目录，或使用 Docker
- **版本过旧**：bioconda 上的版本可能滞后。解决：检查 conda-forge 或软件官方仓库
:::

### Python venv 虚拟环境

纯 Python 项目可以使用更轻量的 venv。venv 只管理 Python 包，不管理系统级软件，因此体积更小、创建更快。当分析流程不依赖 samtools、bwa 等命令行工具，仅使用 Python 库（如 pandas、scikit-learn）时，venv 是合适的选择。

```bash
# 创建虚拟环境
python -m venv myproject_env

# 激活
source myproject_env/bin/activate

# 安装包
pip install numpy pandas matplotlib
pip install biopython

# 导出依赖
pip freeze > requirements.txt

# 从依赖文件安装
pip install -r requirements.txt

# 退出
deactivate

# 删除环境：直接删除目录即可
rm -rf myproject_env
```

venv 与 Conda 的对比：venv 更轻量、更接近原生 Python，但无法管理系统级软件；Conda 功能更全面，可以一键安装 samtools 等命令行工具，但体积更大。生信分析通常涉及命令行工具，Conda 更合适；纯 Python 数据分析脚本可以用 venv。

## 2.1.4 Python 编程基础

Shell 脚本擅长文件操作和流程串联，但处理复杂数据结构、统计分析、可视化时能力有限。Python 凭借简洁的语法、丰富的科学计算库、强大的生信生态，成为生信分析的首选编程语言。

Python 在生信分析中的典型用途：编写定制化分析脚本（如统计序列特征、计算 GC 含量）、处理表格数据（表达矩阵、注释表格）、调用生信工具的 Python 接口（pysam、pybedtools）、可视化（Matplotlib、Seaborn）、机器学习（scikit-learn、PyTorch）。本章介绍 Python 的核心语法和生信常用库。

### 数据类型与结构

Python 使用缩进表示代码块，建议 4 个空格（PEP 8 规范）。变量动态类型，无需声明。这种设计使 Python 代码可读性强，但需要注意类型相关的运行时错误。

```python
# 基本类型
gene_name = "TP53"           # 字符串
expression = 45.6            # 浮点数
read_count = 1000            # 整数
is_significant = True        # 布尔值
missing_value = None         # 空值

# 字符串操作
seq = "ATGCGATCG"
print(len(seq))              # 长度
print(seq.upper())           # 大写
print(seq.lower())           # 小写
print(seq.replace("AT", "AT-"))  # 替换
print(seq[1:4])              # 切片
print(f"Sequence: {seq}, Length: {len(seq)}")  # f-string 格式化
```

Python 内置数据结构有四种，各有适用场景：

```python
# 列表：有序可变，适合存储同类元素序列
genes = ["BRCA1", "TP53", "EGFR"]
genes.append("MYC")                       # 追加
genes.insert(0, "KRAS")                   # 插入
genes.remove("BRCA1")                     # 删除指定值
print(genes[0], genes[-1], genes[1:3])   # 索引与切片
print(len(genes))                         # 长度

# 元组：有序不可变，可作为字典键，用于固定结构
coordinates = (100, 200, 300)
chrom_pos = ("chr1", 1000, 2000)           # 染色体位置三元组

# 字典：键值对，常用于存储映射关系
gene_info = {
    "name": "TP53",
    "chromosome": "chr17",
    "start": 7668421,
    "end": 7687490,
    "strand": "+"
}
print(gene_info["name"])
print(gene_info.get("score", 0))          # 键不存在时返回默认值
for key, value in gene_info.items():
    print(f"{key}: {value}")

# 集合：无序唯一，用于去重和成员测试
unique_genes = set(["TP53", "BRCA1", "TP53", "EGFR"])
print(len(unique_genes))                   # 3，去重后
print("TP53" in unique_genes)             # 成员测试，O(1) 复杂度

# 集合运算
set1 = {"TP53", "BRCA1", "EGFR"}
set2 = {"BRCA1", "MYC", "KRAS"}
print(set1 & set2)   # 交集
print(set1 | set2)   # 并集
print(set1 - set2)   # 差集
```

::: tip 选择数据结构的原则
需要有序且可修改用列表；有序且不可修改用元组；需要键值映射用字典；需要去重或快速成员判断用集合。选择合适的数据结构能显著提升代码效率和可读性。
:::

### 控制流程

`if-elif-else` 进行条件分支，`for` 遍历可迭代对象，`while` 在条件为真时循环。Python 的 `for` 循环遍历可迭代对象，与 C 语言的计数循环不同，更接近自然语言的"对于集合中的每个元素"。

```python
# 条件分支
expression = 15.5
if expression > 20:
    status = "high"
elif expression > 10:
    status = "medium"
else:
    status = "low"

# for 循环
for gene in ["TP53", "BRCA1", "EGFR"]:
    print(f"Processing {gene}")

# 带索引遍历
genes = ["TP53", "BRCA1", "EGFR"]
for i, gene in enumerate(genes):
    print(f"{i}: {gene}")

# 同时遍历多个序列
samples = ["s1", "s2", "s3"]
values = [10, 20, 30]
for sample, value in zip(samples, values):
    print(f"{sample}: {value}")
```

推导式（comprehension）是 Python 的特色语法，用简洁的方式创建新数据结构。熟练使用推导式可以让代码更简洁、运行更快（比等价的 for 循环加 append 快）：

```python
# 列表推导式
values = [10.5, 12.3, 8.7, 15.2]
high = [x for x in values if x > 10]
doubled = [x * 2 for x in values]

# 字典推导式
lengths = {"TP53": 393, "BRCA1": 1863, "EGFR": 1210}
long = {k: v for k, v in lengths.items() if v > 500}

# 集合推导式
unique_chroms = {line.split()[0] for line in open("genes.gff")}
```

`break` 跳出循环，`continue` 跳过本次迭代，`else` 子句在循环正常结束（未 break）时执行：

```python
# 查找第一个满足条件的元素
for gene in gene_list:
    if gene.startswith("TP"):
        target = gene
        break
else:
    # 循环正常结束（未找到）
    target = None
```

### 函数

`def` 定义函数，参数可以有默认值。Python 函数参数传递采用"对象引用"机制：可变对象（列表、字典）的修改会影响调用方，不可变对象（数字、字符串、元组）的修改不会。

```python
def calculate_gc_content(sequence):
    """计算序列的 GC 含量百分比"""
    sequence = sequence.upper()
    gc = sequence.count('G') + sequence.count('C')
    return gc / len(sequence) * 100

def analyze_sequence(sequence, min_length=10):
    """分析序列，min_length 有默认值"""
    if len(sequence) < min_length:
        return None
    return {
        "length": len(sequence),
        "gc": calculate_gc_content(sequence)
    }
```

`*args` 接收任意位置参数（打包为元组），`**kwargs` 接收任意关键字参数（打包为字典）。这使函数可以接受不定数量的参数：

```python
def calculate_mean(*values):
    """接收任意数量的数值，计算平均值"""
    return sum(values) / len(values)

print(calculate_mean(1, 2, 3, 4, 5))

def create_sample(name, **metadata):
    """创建样本记录，metadata 是任意键值对"""
    return {"name": name, **metadata}

sample = create_sample("S001", tissue="liver", donor="patient_A")
```

`lambda` 定义匿名函数，常用于高阶函数（如 `sorted`、`map`、`filter`）的参数。lambda 只能包含单个表达式：

```python
# 匿名函数：按 G 含量排序
sequences = ["ATGC", "GCTA", "TTAA"]
sorted_seqs = sorted(sequences, key=lambda x: x.count('G'))

# map 和 filter
lengths = list(map(len, sequences))
gc_rich = list(filter(lambda x: x.count('G') + x.count('C') > x.count('A') + x.count('T'), sequences))
```

生信分析中常用的函数模式：

```python
# 反向互补
def reverse_complement(seq):
    comp = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
            'a': 't', 't': 'a', 'g': 'c', 'c': 'g',
            'N': 'N', 'n': 'n'}
    return ''.join(comp.get(b, 'N') for b in reversed(seq))

# 翻译为氨基酸（简化版）
def translate_dna(seq, codon_table=None):
    if codon_table is None:
        codon_table = {
            'ATA': 'I', 'ATC': 'I', 'ATT': 'I', 'ATG': 'M',
            'ACA': 'T', 'ACC': 'T', 'ACG': 'T', 'ACT': 'T',
            # ... 完整密码子表
            'TAA': '*', 'TAG': '*', 'TGA': '*'
        }
    protein = ''
    for i in range(0, len(seq) - 2, 3):
        codon = seq[i:i+3].upper()
        protein += codon_table.get(codon, 'X')
    return protein
```

### 文件操作

使用 `with` 语句自动管理文件资源，即使发生异常也能正确关闭。这种写法避免了手动 `close` 的繁琐和遗漏，是处理文件的标准做法。大文件应逐行读取，避免一次性加载到内存——生信文件动辄数 GB，全量加载会导致内存溢出。

```python
# 逐行读取大文件
with open("large_file.txt", 'r') as f:
    for line in f:
        line = line.strip()
        process(line)

# 读取整个文件（仅小文件）
with open("small.txt", 'r') as f:
    content = f.read()

# 写入文件
with open("output.txt", 'w') as f:
    f.write("result\n")

# 追加模式
with open("log.txt", 'a') as f:
    f.write("new entry\n")
```

生信分析中最常见的文件格式是 FASTA 和 FASTQ，掌握这两个格式的读写是基本功：

```python
# 读取 FASTA 文件
def read_fasta(file_path):
    """读取 FASTA 文件，返回 {id: sequence} 字典"""
    sequences = {}
    current_id = None
    current_seq = []
    with open(file_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('>'):
                if current_id:
                    sequences[current_id] = ''.join(current_seq)
                current_id = line[1:].split()[0]
                current_seq = []
            else:
                current_seq.append(line)
        if current_id:
            sequences[current_id] = ''.join(current_seq)
    return sequences

# 写入文件
def write_fasta(sequences, output_file, line_width=60):
    """写入 FASTA 文件，每行 line_width 个字符"""
    with open(output_file, 'w') as f:
        for seq_id, sequence in sequences.items():
            f.write(f">{seq_id}\n")
            for i in range(0, len(sequence), line_width):
                f.write(sequence[i:i+line_width] + "\n")

# 读取 gz 压缩文件
import gzip
with gzip.open("sample.fastq.gz", 'rt') as f:
    for line in f:
        process(line)
```

::: warning FASTA 文件的多行序列
FASTA 格式中一条序列可能跨多行，因此读取时需要累积非 `>` 开头的行。初学者常犯的错误是假设每条序列占一行，导致序列被截断。上面的 `read_fasta` 函数正确处理了这种情况。
:::

### 异常处理

`try-except` 捕获异常，`finally` 始终执行资源清理。Python 的异常是对象，有完整的类型层次结构。捕获具体异常类型，避免空 `except` 隐藏错误——这是初学者最常犯的错误，会让 bug 难以定位。

```python
try:
    with open("nonexistent.txt", 'r') as f:
        content = f.read()
except FileNotFoundError:
    print("File not found")
except PermissionError:
    print("Permission denied")
except Exception as e:
    print(f"Unexpected error: {e}")
    raise  # 重新抛出，让上层处理
finally:
    print("Cleanup here")  # 无论是否异常都执行
```

`else` 子句在 try 块没有异常时执行，`finally` 无论是否异常都执行：

```python
try:
    result = perform_analysis()
except AnalysisError as e:
    log_error(e)
else:
    save_result(result)  # 仅成功时执行
finally:
    cleanup()            # 总是执行
```

主动抛出异常使用 `raise`，用于参数验证和前置条件检查：

```python
def validate_dna(sequence):
    """验证 DNA 序列仅含 ATGC"""
    invalid_bases = set(sequence.upper()) - set('ATGCN')
    if invalid_bases:
        raise ValueError(f"Invalid bases: {invalid_bases}")
    return True

def calculate_gc(sequence):
    """计算 GC 含量，先验证"""
    validate_dna(sequence)
    gc = sequence.upper().count('G') + sequence.upper().count('C')
    return gc / len(sequence) * 100
```

::: tip 异常处理的最佳实践
- 捕获具体异常，而非笼统的 `Exception`
- 不要用异常处理替代正常流程控制（如用 try-except 替代 if-else）
- 在异常发生处处理，而非在远处捕获
- 记录足够的上下文信息（输入值、堆栈跟踪）便于调试
:::

### 模块与生物信息学库

Python 通过 `import` 导入模块，模块组织相关函数和类。Python 标准库提供丰富的功能，生信分析还有专门的第三方库。

**Biopython** 是最成熟的 Python 生信库，提供序列处理、文件格式解析、数据库访问等功能：

```python
# Biopython：序列操作
from Bio import SeqIO
from Bio.Seq import Seq
from Bio.SeqUtils import gc_fraction

seq = Seq("ATGCGATCGATCGATCG")
print(seq.reverse_complement())  # 反向互补
print(seq.translate())           # 翻译为氨基酸
print(gc_fraction(seq))          # GC 含量

# 遍历 FASTA 记录
for record in SeqIO.parse("example.fasta", "fasta"):
    print(f"{record.id}: {len(record.seq)} bp")

# 转换格式：GenBank 转 FASTA
records = SeqIO.parse("input.gb", "genbank")
count = SeqIO.write(records, "output.fasta", "fasta")
print(f"Converted {count} records")

# 解析 FASTQ 并统计质量
from Bio import SeqIO
qualities = []
for record in SeqIO.parse("sample.fastq", "fastq"):
    qualities.extend(record.letter_annotations["phred_quality"])
print(f"Mean quality: {sum(qualities)/len(qualities):.2f}")
```

**pandas** 是数据分析的核心库，处理表格数据（表达矩阵、注释表、统计结果）极为方便：

```python
import pandas as pd

# 创建表达矩阵
df = pd.DataFrame({
    'gene': ['TP53', 'BRCA1', 'EGFR', 'MYC'],
    'sample1': [10.5, 5.2, 20.1, 15.3],
    'sample2': [12.3, 6.1, 18.5, 14.8],
    'sample3': [8.7, 4.8, 22.3, 16.1]
})

# 基本操作
df['mean'] = df[['sample1', 'sample2', 'sample3']].mean(axis=1)
high_expr = df[df['mean'] > 10]
print(df.sort_values('mean', ascending=False))

# 读取和写入文件
df = pd.read_csv("expression.csv", index_col=0)
df = pd.read_csv("data.tsv", sep='\t')
df.to_csv("output.csv")

# 分组统计
grouped = df.groupby('chromosome')['gene_count'].sum()

# 合并表格
merged = pd.merge(df1, df2, on='gene_id', how='left')
```

**NumPy** 提供高效的数值计算，特别是多维数组操作。pandas 内部基于 NumPy，许多函数返回 NumPy 数组：

```python
import numpy as np

# 创建数组
arr = np.array([[10.5, 12.3, 8.7],
                [5.2, 6.1, 4.8],
                [20.1, 18.5, 22.3]])

# 统计运算
print(np.mean(arr, axis=1))  # 按行求均值
print(np.mean(arr, axis=0))  # 按列求均值
print(np.std(arr))           # 标准差
print(np.max(arr, axis=1))   # 每行最大值

# 矩阵运算
matrix = np.random.randn(100, 10)
normalized = (matrix - matrix.mean(axis=0)) / matrix.std(axis=0)

# 向量化比循环快得多
# 慢：for 循环
result = []
for x in range(1000000):
    result.append(x ** 2)
# 快：向量化
result = np.arange(1000000) ** 2
```

**Matplotlib** 与 **Seaborn** 用于数据可视化：

```python
import matplotlib.pyplot as plt
import seaborn as sns

# 简单折线图
plt.plot([1, 2, 3, 4], [10, 20, 25, 30])
plt.xlabel("Sample")
plt.ylabel("Expression")
plt.title("Gene Expression Trend")
plt.savefig("expression.png", dpi=150)
plt.close()

# 热图（表达矩阵可视化）
import numpy as np
data = np.random.randn(10, 5)
sns.heatmap(data, cmap="RdBu_r", center=0)
plt.savefig("heatmap.png", dpi=150)
```

### 正则表达式

`re` 模块提供正则表达式操作。正则表达式是描述文本模式的紧凑语法，在解析生信文件格式（GFF、GTF、VCF）的属性字段时极为有用。建议使用原始字符串 `r'...'` 避免反斜杠转义问题——这是初学者最常犯的错误。

```python
import re

# 提取 GFF 属性字段中的基因 ID
gff_line = "chr17\tHAVANA\tgene\t7668421\t7687490\t.\t+\t.\tID=gene:TP53;Name=TP53"
match = re.search(r'ID=gene:(\w+);Name=(\w+)', gff_line)
if match:
    print(f"Gene ID: {match.group(1)}")
    print(f"Name: {match.group(2)}")

# 命名捕获组（更可读）
match = re.search(r'(?P<chr>\w+):(?P<start>\d+)-(?P<end>\d+)', "chr17:7668421-7687490")
print(match.group('chr'), match.group('start'), match.group('end'))

# 验证 DNA 序列
def validate_dna(seq):
    return bool(re.match(r'^[ATGCN]+$', seq, re.IGNORECASE))

# 查找限制性酶切位点
for m in re.finditer(r'GAATTC', "ATGCGAATTCGATCGAATTCCGATCG"):
    print(f"EcoRI site at position {m.start()}")
```

`re` 模块的主要函数：

| 函数 | 作用 |
|------|------|
| `re.search(pattern, string)` | 在字符串中搜索第一个匹配 |
| `re.match(pattern, string)` | 仅匹配字符串开头 |
| `re.fullmatch(pattern, string)` | 匹配整个字符串 |
| `re.findall(pattern, string)` | 返回所有匹配的字符串列表 |
| `re.finditer(pattern, string)` | 返回所有匹配的迭代器，含位置 |
| `re.sub(pattern, repl, string)` | 替换匹配 |
| `re.split(pattern, string)` | 按模式分割 |

```python
# findall 提取所有匹配
sequences = "ATGCGATCGGTAATGCGATCGGTAATGCGATCGGTA"
start_codons = re.findall(r'ATG', sequences)
print(f"Found {len(start_codons)} start codons")

# sub 替换
cleaned = re.sub(r'\s+', ' ', "hello   world\n\ttab")
# 'hello world tab'
```

::: tip 原始字符串的重要性
正则表达式中 `\\d` 表示数字。在普通字符串中需要写 `'\\d'`（两个反斜杠），在原始字符串中只需写 `r'\d'`。原始字符串让正则表达式更清晰，避免反斜杠地狱。例如 `re.match(r'^\w+@\w+\.\w+$', email)` 比 `re.match('^\\w+@\\w+\\.\\w+$', email)` 可读得多。
:::

## 2.1.5 Git 版本控制

生信分析是探索性工作，代码经常修改、回退、重构。没有版本控制，文件会变成 `analysis_v1.py`、`analysis_v2.py`、`analysis_final.py`、`analysis_really_final.py` 的混乱状态。Git 提供完整的修改历史，支持随时回退、分支实验、协作开发，是分析可复现性的基础保障。

Git 在生信分析中的核心价值：记录每次修改的代码与对应的分析结果，使分析过程可追溯；通过分支在不影响主线的情况下尝试新方法；通过远程仓库备份代码，避免本地数据丢失；通过提交信息说明每次修改的目的，便于团队协作和未来回顾。

### 基本概念

Git 是分布式版本控制系统，每个开发者持有完整仓库副本，包括所有历史记录。与集中式版本控制（如 SVN）不同，分布式系统的本地仓库就是完整的，可以离线提交、查看历史、创建分支。

Git 的三个核心区域构成工作流：

- **工作区**（working directory）：实际文件，你能看到和编辑的文件
- **暂存区**（staging area / index）：`git add` 后、`git commit` 前的待提交内容
- **仓库**（repository）：`git commit` 后形成的提交历史

这种三阶段设计允许你将相关修改组织成一次提交，而非所有修改一起提交。例如，你可以先暂存修复 bug 的修改并提交，再暂存新功能的修改并提交，使历史清晰。

| 概念 | 说明 |
|------|------|
| 仓库 (repository) | 包含项目所有文件和历史记录 |
| 提交 (commit) | 文件快照，含 SHA-1 哈希、作者、消息 |
| 分支 (branch) | 指向某提交的可移动指针 |
| 暂存区 (staging) | `git add` 后、`git commit` 前的待提交内容 |
| HEAD | 指向当前分支最新提交的指针 |
| 远程 (remote) | 远程仓库的引用，如 origin |

Git 内部将每次提交存储为快照（snapshot），而非差异（diff）。每次提交记录当时所有文件的状态，通过哈希树结构高效存储和检索。这种设计使查看历史、切换版本都非常快。

### 基本工作流

修改文件 → `git add` 加入暂存区 → `git commit` 提交到仓库。每次提交应只包含逻辑相关的修改，提交消息简洁描述改动内容。好的提交消息让未来的自己或合作者能快速理解每次修改的目的。

```bash
# 初始化仓库
mkdir bioinfo_project && cd bioinfo_project
git init

# 配置用户信息（仅需一次）
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 配置默认编辑器和分支名
git config --global core.editor vim
git config --global init.defaultBranch main

# 添加文件并提交
git add analysis.py
git add README.md
git commit -m "Add analysis script and README"

# 查看状态与历史
git status
git log --oneline
git log --graph --oneline --all
git log --oneline --since="2 weeks ago"

# 查看差异
git diff                  # 工作区与暂存区
git diff --staged         # 暂存区与最新提交
git diff HEAD~1           # 当前与上次提交
git diff a1b2c3d e4f5g6h  # 两个提交之间
```

提交消息的撰写规范：第一行简短描述（50 字符内），空行后详细说明。使用现在时态（"Add feature" 而非 "Added feature"）。常见的提交类型前缀：`feat:`（新功能）、`fix:`（修复）、`docs:`（文档）、`refactor:`（重构）、`test:`（测试）。

```bash
# 良好的提交消息
git commit -m "feat: add GC content calculation function

- Add calculate_gc() in sequence_utils.py
- Validate input sequence before calculation
- Add unit tests for edge cases"
```

::: tip git add 的精细化使用
`git add -p`（patch 模式）允许你交互式地选择文件的哪些部分加入暂存区。当一个文件包含多处修改时，可以用它将不同修改分开提交。这是保持提交历史整洁的有效工具。
:::

### 分支管理

分支允许并行开发不同功能。Git 的分支创建极快（仅创建一个指针），鼓励频繁使用分支。常见的分支策略：主分支保持稳定，新功能在 feature 分支开发，完成后合并回主分支。

```bash
# 创建并切换分支
git checkout -b feature-add-qc
# 等同于：git branch feature-add-qc && git checkout feature-add-qc

# 查看所有分支
git branch -a

# 切换回主分支并合并
git checkout master
git merge feature-add-qc

# 删除已合并的分支
git branch -d feature-add-qc

# 强制删除（未合并）
git branch -D feature-add-qc

# 重命名分支
git branch -m old_name new_name
```

合并分支时可能产生冲突。冲突发生在两个分支修改了同一文件的同一部分。Git 会在冲突文件中标记冲突区域：

```
<<<<<<< HEAD
当前分支的内容
=======
要合并的分支的内容
>>>>>>> feature-branch
```

解决冲突的步骤：编辑文件，保留需要的内容，删除冲突标记，然后 `git add` 标记冲突已解决，最后 `git commit` 完成合并。

`git merge` 与 `git rebase` 的区别：`merge` 创建一个合并提交，保留两条分支的历史；`rebase` 将当前分支的提交"嫁接"到目标分支顶部，使历史线性。rebase 使历史更整洁，但会改写提交哈希，不要在公共分支上使用。

::: warning rebase 的风险
`git rebase` 会改写提交历史，已推送到远程的提交被 rebase 后会与远程历史分叉。规则是：**绝不要 rebase 已推送到公共分支的提交**。rebase 仅用于整理本地未推送的提交。
:::

### 远程仓库

远程仓库用于多人协作和备份。GitHub、GitLab、Gitee 是常用的远程仓库托管平台。`git push` 推送本地提交，`git pull` 拉取远程更新并合并，`git fetch` 仅获取不合并。

```bash
# 克隆远程仓库
git clone https://github.com/user/project.git

# 添加远程仓库
git remote add origin https://github.com/user/project.git

# 首次推送并设置上游
git push -u origin master

# 后续推送
git push
git push origin feature-branch

# 拉取更新
git pull origin master
# 等同于 git fetch + git merge

# 仅获取不合并（更安全）
git fetch origin
git log origin/master  # 查看远程变化
git merge origin/master  # 确认后再合并

# 查看远程仓库
git remote -v
```

::: tip pull 与 fetch 的选择
`git pull` 会自动合并远程变化，可能产生意外的合并提交。推荐的工作流是先用 `git fetch` 获取远程变化，查看 `git log origin/master` 评估变化，再决定是否合并。这样可以避免意外覆盖本地修改。
:::

### 撤销操作

撤销操作可能丢失修改，需谨慎。`git reflog` 记录所有引用变更，可用于恢复误删提交。理解各种撤销操作的作用范围很重要：

```bash
# 丢弃工作区修改（未 add 的修改）
git checkout -- analysis.py
git restore analysis.py  # 新语法

# 取消暂存（已 add 但未 commit）
git reset HEAD analysis.py
git restore --staged analysis.py  # 新语法

# 修改最后一次提交（合并新修改到上次提交）
git commit --amend -m "New message"
# 注意：amend 会改写提交哈希，已推送的提交不要 amend

# 回退到指定提交（保留工作区修改）
git reset --soft a1b2c3d   # 保留暂存区
git reset --mixed a1b2c3d  # 默认，重置暂存区

# 回退到指定提交（丢弃后续修改）
git reset --hard a1b2c3d

# 创建一个新提交来撤销指定提交（安全，不改写历史）
git revert a1b2c3d

# 查看操作历史
git reflog
```

`reset --hard` 与 `revert` 的区别：`reset --hard` 直接删除历史，已推送的提交无法用此方法撤销；`revert` 创建一个反向提交，安全且不改写历史，适合公共分支。

::: warning reset --hard 的风险
`git reset --hard` 会丢弃所有未提交的修改，执行前确认工作区没有需要保留的内容。如果误操作，可以用 `git reflog` 找到之前的 HEAD 位置，再 `git reset --hard <旧哈希>` 恢复。但 reflog 也有过期时间（默认 90 天），不要指望能无限恢复。
:::

### .gitignore 配置

生物信息学项目应将大文件、临时文件、结果文件排除在版本控制之外。`.gitignore` 文件指定 Git 应忽略的文件模式。

```bash
cat > .gitignore << 'EOF'
# 数据文件
*.fastq
*.fasta
*.bam
*.vcf
*.bigwig
*.bed

# 结果文件
results/*.txt
results/*.pdf
results/*.png

# 临时文件
*.log
*.tmp
__pycache__/
*.pyc
.ipynb_checkpoints/

# Conda 环境
env/
.venv/

# 系统文件
.DS_Store
Thumbs.db

# IDE 文件
.vscode/
.idea/
EOF
```

::: tip 大文件管理
测序数据等大文件不应纳入 Git。使用 Git LFS（Large File Storage）或专门的数据存储系统管理，仅在仓库中保留示例数据用于测试。`.gitignore` 只对未跟踪的文件生效，已被跟踪的文件需要先 `git rm --cached` 移除跟踪。
:::

```bash
# 安装 Git LFS
git lfs install

# 跟踪大文件类型
git lfs track "*.bam"
git lfs track "*.fastq.gz"

# 提交 LFS 配置
git add .gitattributes
git commit -m "Configure Git LFS"
```

### 标签与别名

标签（tag）用于标记重要提交，如发布版本：

```bash
# 创建轻量标签
git tag v1.0

# 创建附注标签（推荐，包含更多信息）
git tag -a v1.0 -m "Release version 1.0"

# 推送标签到远程
git push origin v1.0
git push origin --tags

# 查看标签
git tag
git show v1.0
```

Git 别名可以简化常用命令：

```bash
git config --global alias.st "status -s"
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.lg "log --oneline --graph --all"
```

配置后，`git st` 等同于 `git status -s`，`git lg` 显示美观的图形化历史。

## 2.1.6 容器化技术

生信分析环境的复现性是一个长期难题：在 A 服务器上运行正常的流程，到 B 服务器可能因软件版本不同而失败。容器化技术将应用程序及其所有依赖（操作系统库、Python、samtools 等）打包成镜像，镜像在任何支持容器运行时的系统上行为一致。这是实现可重复分析的关键技术。

容器与虚拟机的区别：虚拟机包含完整的操作系统，启动慢、占用大；容器共享主机内核，仅隔离应用及其依赖，启动快、占用小。这种轻量级隔离使容器在生信分析中迅速普及。

### Docker 基础

Docker 是最流行的容器化平台。镜像（image）是只读模板，容器（container）是镜像的运行实例。一次构建的镜像可以在开发机、测试服务器、生产集群上完全一致地运行。

| 概念 | 说明 |
|------|------|
| 镜像 (image) | 只读模板，包含运行环境 |
| 容器 (container) | 镜像的运行实例 |
| Dockerfile | 构建镜像的指令文件 |
| 数据卷 (volume) | 持久化数据，独立于容器生命周期 |
| 注册表 (registry) | 镜像仓库，如 Docker Hub |
| 仓库 (repository) | 同一镜像的不同版本集合 |

```bash
# 拉取镜像
docker pull biocontainers/fastqc:v0.11.9

# 列出本地镜像
docker images

# 构建镜像
docker build -t bioinfo-analysis:1.0 .

# 运行容器（挂载数据目录）
docker run -v /path/to/data:/data bioinfo-analysis:1.0

# 后台运行
docker run -d --name analysis bioinfo-analysis:1.0

# 交互式运行
docker run -it bioinfo-analysis:1.0 bash

# 查看运行中的容器
docker ps
docker ps -a  # 包括已停止的

# 进入运行中的容器
docker exec -it analysis bash

# 查看日志、停止、删除
docker logs analysis
docker stop analysis
docker rm analysis

# 删除镜像
docker rmi bioinfo-analysis:1.0
```

容器运行时的关键参数：

- `-v host_path:container_path`：挂载主机目录到容器，使容器可以访问数据
- `-p host_port:container_port`：端口映射，将容器端口暴露到主机
- `-e VAR=value`：设置环境变量
- `--name`：指定容器名称
- `--rm`：容器退出后自动删除
- `-w /path`：设置工作目录

```bash
# 典型的生信分析运行
docker run --rm \
    -v /home/bioinfo/data:/data \
    -v /home/bioinfo/results:/results \
    -w /data \
    biocontainers/fastqc:v0.11.9 \
    fastqc sample.fastq -o /results
```

::: warning 容器中的数据
容器内的文件系统是临时的，容器删除后所有写入的数据都会丢失。需要持久化的数据必须写入挂载的卷或绑定目录。这是初学者最常犯的错误：在容器内运行分析，结果随容器删除而消失。
:::

### Dockerfile 编写

Dockerfile 是构建镜像的指令文件，从基础镜像开始，逐步添加软件和配置。每条指令创建一个层（layer），合理排序可利用缓存加速构建——Docker 会缓存每一层，只有指令变化时才重新构建该层及后续层。

```dockerfile
FROM python:3.9-slim

LABEL maintainer="your.email@example.com"
LABEL description="Bioinformatics analysis environment"

WORKDIR /app

# 安装系统依赖（合并 RUN 减少层数）
RUN apt-get update && apt-get install -y \
    wget bzip2 libncurses5-dev zlib1g-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 安装 Miniconda
RUN wget -q https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh \
    && bash Miniconda3-latest-Linux-x86_64.sh -b -p /opt/conda \
    && rm Miniconda3-latest-Linux-x86_64.sh
ENV PATH="/opt/conda/bin:${PATH}"

# 配置频道并安装生物信息学工具
RUN conda config --add channels bioconda \
    && conda config --add channels conda-forge \
    && conda install -y fastqc bwa samtools bcftools \
    && conda clean -afy

# 复制脚本并设置入口
COPY scripts/ /app/scripts/
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENTRYPOINT ["python", "/app/scripts/pipeline.py"]
```

Dockerfile 常用指令：

| 指令 | 作用 |
|------|------|
| `FROM` | 指定基础镜像，必须是第一条指令 |
| `RUN` | 构建时执行命令，创建新层 |
| `COPY` | 复制文件到镜像 |
| `ADD` | 类似 COPY，支持 URL 和自动解压 |
| `WORKDIR` | 设置工作目录 |
| `ENV` | 设置环境变量 |
| `EXPOSE` | 声明容器监听端口 |
| `ENTRYPOINT` | 容器启动时执行的命令 |
| `CMD` | 容器启动默认命令，可被 docker run 参数覆盖 |

::: tip 镜像优化
合并 `RUN` 指令减少层数，使用 `conda clean -afy` 清理缓存，选择 `slim` 基础镜像，可显著减小镜像体积。将不常变化的指令放在前面（如安装系统依赖），常变化的放在后面（如复制代码），可以最大化利用缓存。
:::

构建镜像的技巧：

```bash
# 构建时指定标签
docker build -t bioinfo-analysis:1.0 .

# 不使用缓存构建（用于排查缓存问题）
docker build --no-cache -t bioinfo-analysis:1.0 .

# 查看镜像历史（每层大小）
docker history bioinfo-analysis:1.0
```

### Docker Compose

Docker Compose 用 YAML 文件定义多容器应用，一键启动包含数据库、Web、分析服务的完整平台。生信分析中，Compose 常用于搭建包含 Jupyter、数据库、分析服务的开发环境。

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: bioinfo_db
      POSTGRES_USER: bioinfo
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  jupyter:
    image: jupyter/datascience-notebook
    ports:
      - "8888:8888"
    volumes:
      - ./notebooks:/home/jovyan/work
      - ./data:/home/jovyan/data
    environment:
      - JUPYTER_ENABLE_LAB=yes

  analysis:
    build: ./analysis
    volumes:
      - ./data:/data
      - ./results:/results
    depends_on:
      - postgres

volumes:
  postgres_data:
```

```bash
# 启动所有服务（后台）
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f jupyter

# 停止并删除容器
docker-compose down

# 停止但保留容器
docker-compose stop

# 重建并启动
docker-compose up -d --build
```

### Singularity

Singularity（现称 Apptainer）专为 HPC 集群环境设计。普通用户即可运行容器，无需 root 权限，这是它与 Docker 的最大区别——Docker 需要 root 权限或用户加入 docker 组（等同于 root），在共享集群中不可接受。

Singularity 镜像为单个 SIF 文件，便于传输和管理。它还自动挂载用户的家目录，使容器内可以直接访问 `$HOME` 下的文件。

```bash
# 从 Docker Hub 拉取并转换为 SIF
singularity pull fastqc.sif docker://biocontainers/fastqc:v0.11.9

# 从 Singularity Hub 拉取
singularity pull image.sif library://user/collection/image:tag

# 执行容器中的命令
singularity exec fastqc.sif fastqc sample.fastq

# 运行容器定义的入口脚本
singularity run fastqc.sif sample.fastq

# 交互式 shell
singularity shell fastqc.sif

# 绑定挂载数据目录
singularity exec -B /path/to/data:/data fastqc.sif fastqc /data/sample.fastq

# 从 Dockerfile 构建（需要 sudo）
singularity build fastqc.sif docker://biocontainers/fastqc:v0.11.9

# 从 Singularity 定义文件构建
singularity build analysis.sif analysis.def
```

::: note HPC 环境选择
共享集群中优先使用 Singularity 而非 Docker。Singularity 与 Slurm、Nextflow、Snakemake 集成良好，且无需管理员权限。大多数 HPC 中心已预装 Singularity，用户可以直接运行容器化分析流程。
:::

Singularity 定义文件示例：

```singularity
Bootstrap: docker
From: python:3.9-slim

%post
    apt-get update && apt-get install -y wget bzip2
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
    bash Miniconda3-latest-Linux-x86_64.sh -b -p /opt/conda
    rm Miniconda3-latest-Linux-x86_64.sh
    /opt/conda/bin/conda install -y -c bioconda samtools bwa fastqc
    /opt/conda/bin/conda clean -afy

%environment
    export PATH=/opt/conda/bin:$PATH

%runscript
    exec python "$@"

%labels
    Author bioinfo
    Version v1.0
```

### 容器化生物信息学流程

将分析流程容器化可保证可重复性。**Biocontainers** 项目为 Bioconda 中的软件提供对应容器镜像，覆盖数千个生物信息学工具。这些镜像可以直接拉取使用，无需自己构建：

```bash
# 拉取特定工具的容器
docker pull biocontainers/samtools:v1.15.1
docker pull biocontainers/bwa:v0.7.17
docker pull quay.io/biocontainers/fastqc:0.11.9--0

# 运行容器化工具
docker run --rm -v $PWD:/data biocontainers/samtools:v1.15.1 \
    samtools view -bS /data/aligned.sam > aligned.bam
```

实际生信流程涉及多个工具的串联，手动调用容器较为繁琐。**Nextflow** 和 **Snakemake** 是两个流行的工作流管理系统，可以协调多个容器的执行、管理数据流和依赖关系：

- **Nextflow**：基于 Groovy 的 DSL，支持云端和 HPC 部署，社区维护了大量生信流程（如 nf-core/rnaseq）
- **Snakemake**：基于 Python 的 DSL，语法接近 Makefile，与 Python 生态集成紧密

这些工作流系统的核心价值在于：将分析流程定义为代码，使整个流程可版本控制、可测试、可复现。结合容器化，可以在任何环境中重现完全相同的分析结果。

数据应通过数据卷或绑定挂载存储在容器外部，避免容器删除后数据丢失。集群环境中通常使用共享文件系统（如 NFS、Lustre、GPFS），通过绑定挂载访问数据。这种设计使数据与计算分离，多个容器可以并行处理同一份数据。

```bash
# 使用 Nextflow 运行容器化流程
nextflow run nf-core/rnaseq \
    -profile docker \
    --input samplesheet.csv \
    --genome GRCh37 \
    --outdir results/

# 使用 Snakemake 运行
snakemake --use-singularity \
    --singularity-args "-B /shared/data:/data" \
    --cores 32
```

::: tip 容器化的最佳实践
- 为每个分析流程构建专门的镜像，避免在一个镜像中堆积过多工具
- 镜像打上明确的版本标签（如 `analysis:1.0`），避免使用 `latest` 以保证可复现性
- 将镜像推送到注册表（Docker Hub、私有 registry）备份，避免本地丢失
- 在论文方法部分记录镜像名称和版本，使其他研究者可以精确复现
- 敏感数据不应打入镜像，通过挂载方式访问
:::
