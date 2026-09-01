---
title: 1.15 输入输出与保存
sidebar:
  order: 15
---
# 1.15 输入输出与保存

图绘制完成后，最终要落地为可用的产物：保存成图片文件插入论文或网页、在弹窗中交互查看、生成内存图像直接交给下游程序，甚至反过来把已有图片读入程序做进一步分析。这一系列操作统称为图的输入输出。本节讲解 Matplotlib 的保存、显示、后端切换、缓冲渲染与图像读取，覆盖从画出来到用起来的完整链路。

## 1.15.1 保存图像 plt.savefig() 与 fig.savefig()

把图形保存成文件用 `savefig()`，它有两种调用方式。`plt.savefig()` 是 pyplot 接口，保存当前图形：

```python
import matplotlib.pyplot as plt

x = [1, 2, 3, 4, 5]
y = [2, 4, 1, 5, 3]

plt.plot(x, y)
plt.savefig('折线图.png')   # 保存当前图形为 PNG 文件
```

`fig.savefig()` 是 Figure 对象的方法，保存指定图形。两者功能完全一致，区别只在调用方式，使用面向对象接口时通常拿 `fig` 调用：

```python
fig, ax = plt.subplots()
ax.plot(x, y)
fig.savefig('折线图.png')
```

### 常用参数

`dpi` 控制输出分辨率，默认 100。屏幕显示够用，出版印刷建议 300：

```python
fig.savefig('折线图.png', dpi=300)
```

`bbox_inches` 控制保存区域。默认保存整个画布，周围常有多余空白；`bbox_inches='tight'` 自动裁剪到恰好包含所有绘图元素，是发布图片最常用的设置：

```python
fig.savefig('折线图.png', bbox_inches='tight')
```

`pad_inches` 只在 `bbox_inches='tight'` 时生效，指定裁剪后四周保留的留白，默认 0.1 英寸：

```python
fig.savefig('折线图.png', bbox_inches='tight', pad_inches=0.2)
```

`facecolor` 与 `edgecolor` 分别设置画布背景色与边框颜色，支持颜色名、十六进制值或 `'none'`（透明）：

```python
fig.savefig('折线图.png', facecolor='white', edgecolor='none')
```

`transparent=True` 让背景透明，适合叠加到网页或深色幻灯片上：

```python
fig.savefig('折线图.png', transparent=True)
```

## 1.15.2 输出格式

输出格式由文件名的扩展名决定，`.png` 得到 PNG，`.pdf` 得到 PDF，不需要单独指定 `format` 参数。常用格式分成两类：矢量图与位图。

| 格式 | 类型 | 特点与适用场景 |
| --- | --- | --- |
| PNG | 位图 | 支持透明、无损，网页与屏幕显示首选 |
| JPEG | 位图 | 有损压缩、体积小，不支持透明，适合照片类 |
| TIFF | 位图 | 无损、出版印刷常用 |
| PDF | 矢量图 | 缩放不失真，论文与印刷首选 |
| SVG | 矢量图 | 可缩放、可编辑，适合网页与插图软件 |
| EPS | 矢量图 | 老牌出版格式，部分期刊要求提交 |

矢量图以几何指令（线段、曲线、填充）描述图形，任意放大都保持清晰，文件体积小；位图按像素网格存储，放大到超过原始分辨率会变模糊。线条图、数据图优先用矢量格式，包含大量散点或照片时位图更合适：

```python
fig.savefig('figure.pdf')                      # 矢量图，论文投稿用
fig.savefig('figure.png', dpi=300)             # 位图，网页展示用
fig.savefig('figure.svg')                      # 矢量图，可编辑
fig.savefig('figure.eps')                      # 矢量图，出版格式
fig.savefig('figure.jpg')                      # 位图，有损压缩
fig.savefig('figure.tiff')                     # 位图，出版用
```

## 1.15.3 显示图像 plt.show()

`plt.show()` 打开窗口显示所有已创建的图形，一般放在脚本末尾调用：

```python
plt.plot([1, 2, 3], [1, 4, 2])
plt.show()
```

在 Jupyter 中图形会自动内嵌到单元格输出，通常不需要 `plt.show()`。交互式后端下 `plt.show()` 会阻塞直到窗口关闭，若希望保存后继续运行，把 `plt.show()` 放在 `plt.savefig()` 之后。

## 1.15.4 后端切换 matplotlib.use()

后端是 Matplotlib 把图形渲染到不同目标（屏幕窗口、图片文件、网页）的实现方式。`matplotlib.use()` 指定后端，其中 `'Agg'` 是无窗口后端，只把图形渲染成图像文件或内存字节，不弹任何窗口，适合服务器、批量脚本等没有显示环境的场景；`'TkAgg'` 使用 Tkinter 弹出交互窗口。

关键约束：`matplotlib.use()` 必须在导入 `pyplot` 之前调用，否则 pyplot 已经绑定当前后端，设置不生效：

```python
import matplotlib
matplotlib.use('Agg')          # 必须在导入 pyplot 之前
import matplotlib.pyplot as plt

plt.plot([1, 2, 3], [1, 4, 2])
plt.savefig('out.png')         # 无窗口，直接落盘
```

在 Linux 服务器、Docker 容器、定时任务脚本中运行 Matplotlib，不设置 Agg 后端时可能报错 `no display name and no $DISPLAY environment variable`，提前切换后端即可规避。

## 1.15.5 缓冲渲染 io.BytesIO()

保存到文件会写磁盘，需要再读回才能交给程序。使用 `io.BytesIO()` 配合 `savefig()` 可以把图形渲染进内存中的字节对象，不产生磁盘文件，适合上传到网络接口、直接转成 PIL 图像或做内存缓存：

```python
import matplotlib.pyplot as plt
import io

fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 4, 2])

buf = io.BytesIO()
fig.savefig(buf, format='png')   # 渲染进内存缓冲区
buf.seek(0)                      # 指针回到开头，方便读取
img = plt.imread(buf)            # 把内存图像读成数组
print(img.shape)
```

`savefig()` 第一个参数可以是路径字符串，也可以是文件对象；传入 `io.BytesIO()` 时用 `format='png'` 显式指定格式，因为没有扩展名可以推断。`buf.seek(0)` 把读写位置重置到开头，否则从缓冲区读取会得到空内容。

## 1.15.6 图像导入 plt.imread()

`plt.imread()` 读取图像文件并返回 NumPy 数组，彩色图返回三维数组（高、宽、RGB 三通道），灰度图返回二维数组。读取的数组可以直接用 `plt.imshow()` 显示，也可以交给 NumPy 做图像处理：

```python
import matplotlib.pyplot as plt

img = plt.imread('photo.png')
print(img.shape)          # (高, 宽, 3) 或 (高, 宽)
print(img.dtype)          # float32 或 uint8
plt.imshow(img)           # 把数组显示为图像
plt.axis('off')
plt.show()
```

`imread` 支持的文件对象与 `savefig` 保持一致，因此上一节的内存渲染结果可以无缝读回，形成渲染进内存、读回数组、继续处理的闭环。

## 练习题

### 第1题 概念理解

说明 `bbox_inches='tight'` 与 `pad_inches` 的作用；说明矢量图与位图的区别；说明 `matplotlib.use('Agg')` 的适用场景。

::: details 参考答案

`bbox_inches='tight'` 裁剪保存区域到恰好包含所有绘图元素，去掉多余空白；`pad_inches` 在该模式下控制四周留白。矢量图以几何指令存储、缩放不失真，位图按像素存储、放大会失真。`Agg` 是无窗口后端，适合无显示环境（服务器、批量脚本），只输出图像不弹窗。
:::

### 第2题 代码编写

绘制一条折线图，用 `fig.savefig()` 分别保存为 PNG（dpi=300、紧贴裁剪）与 PDF 两种格式，再调用 `plt.show()` 显示。

::: details 参考答案

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots()
ax.plot([1, 2, 3, 4], [1, 4, 2, 5])

fig.savefig('折线图.png', dpi=300, bbox_inches='tight')
fig.savefig('折线图.pdf')
plt.show()
```

:::

### 第3题 进阶练习

用 `io.BytesIO()` 把图形渲染进内存，读回 NumPy 数组并打印形状；用 `plt.imread()` 读取一张已有图片并显示；说明为什么读取内存缓冲区前需要调用 `seek(0)`。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import io

fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 4, 2])

buf = io.BytesIO()
fig.savefig(buf, format='png')
buf.seek(0)
img = plt.imread(buf)
print(img.shape)

photo = plt.imread('photo.png')
print(photo.shape)
plt.imshow(photo)
plt.axis('off')
plt.show()
```

`savefig()` 写入缓冲区后指针停在末尾，`seek(0)` 把指针重置到开头，否则 `imread` 从末尾读取不到任何字节。
:::

## 常见错误

**错误 1 · 无显示环境运行报 `no display name and no $DISPLAY environment variable`**

原因:默认后端需要图形界面，服务器或容器没有显示环境，无法打开窗口。

解决:在导入 `pyplot` 之前调用 `matplotlib.use('Agg')`，只渲染文件不弹窗。

**错误 2 · 调用 `matplotlib.use('Agg')` 后没有任何效果**

原因:`pyplot` 已经导入，后端在导入时被锁定，之后再设置不生效。

解决:把 `matplotlib.use()` 放在 `import matplotlib.pyplot` 之前，并确认没有其他代码先导入了 pyplot。

**错误 3 · 保存的图片周围留白过多，内容偏小**

原因:默认保存整个画布区域，四周空白也一并保存。

解决:使用 `bbox_inches='tight'` 自动裁剪，必要时用 `pad_inches` 调整留白。

**错误 4 · 保存为 JPEG 时透明背景变成黑色或报错**

原因:JPEG 格式不支持透明度，透明信息被丢弃。

解决:需要透明背景时使用 PNG，需要 JPEG 时设置 `facecolor='white'`。

**错误 5 · `plt.imread()` 读回的内存图像是空的**

原因:保存后没有调用 `seek(0)`，缓冲区指针停在末尾。

解决:读取前执行 `buf.seek(0)` 把指针重置到开头。
