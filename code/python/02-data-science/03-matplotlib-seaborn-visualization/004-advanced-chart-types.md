---
title: 1.4 高级图表类型
sidebar:
  order: 4
---
# 1.4 高级图表类型

上一节覆盖了趋势、分布、比较类的基本图表。当数据带有空间结构或高维信息时，需要更专业的图表类型：二维函数的取值用等高线图与热图，方向向量场用箭头图，随时间演化的频谱用频谱图，三维结构用 mplot3d 的立体图。本节介绍 9 类高级图表，重点放在它们与基本图表的差异、所需的数据组织方式（尤其是网格化与投影），以及关键参数。三维与极坐标等内容在医学成像、神经电生理、空间分布分析中经常出现。

## 1.4.1 等高线图 contour() 与 contourf()

等高线图用等值线或色块表示二维函数 $z=f(x,y)$ 的取值。`ax.contour()` 画等值线，`ax.contourf()` 画填充色块。两者的前提是先把 x、y 网格化，用 `np.meshgrid()` 生成网格坐标，再在每个格点上计算 z：

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(-3, 3, 100)
y = np.linspace(-3, 3, 100)
X, Y = np.meshgrid(x, y)          # 网格坐标
Z = np.sin(np.sqrt(X ** 2 + Y ** 2))   # 每个格点上的函数值

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))

cs1 = ax1.contour(X, Y, Z, levels=12, cmap='viridis')
ax1.clabel(cs1, inline=True, fontsize=8)   # 标注等值线数值
ax1.set_title('contour 等值线')

cs2 = ax2.contourf(X, Y, Z, levels=20, cmap='coolwarm')
fig.colorbar(cs2, ax=ax2)
ax2.set_title('contourf 填充')
fig.tight_layout()
fig.show()
```

`np.meshgrid(x, y)` 返回两个与 z 同形状的数组 X、Y，X 的每行相同、Y 的每列相同，代表平面上每个格点的横纵坐标。`levels` 是等值线数量或指定的取值列表，`cmap` 是颜色映射，`ax.clabel()` 在等值线上标注数值。`contourf` 的返回值可传给 `colorbar` 添加颜色条。等高线图适合展示二维标量场，如温度分布、势能面、影像强度的空间变化。

## 1.4.2 伪彩色热图 imshow()

`ax.imshow()` 把二维数组渲染成彩色热图，每个格子对应一个数值，本质是把数组当作图像显示。常用于矩阵可视化、相关性矩阵、灰度影像。关键参数有 `cmap`、`interpolation`、`origin`、`aspect`：

```python
rng = np.random.default_rng(1)
data = np.random.rand(10, 10)

fig, ax = plt.subplots()
im = ax.imshow(data, cmap='plasma', interpolation='nearest',
               origin='upper')
fig.colorbar(im, ax=ax)
ax.set_xticks(range(10))
ax.set_yticks(range(10))
fig.show()
```

`cmap` 控制颜色映射，`interpolation='nearest'` 用最近邻方式渲染（不插值平滑，适合离散矩阵），`origin='upper'` 表示数组第 0 行显示在顶部（图像惯例），`'lower'` 则是矩阵坐标惯例（第 0 行在底部）。`aspect` 控制格子的纵横比，`aspect='auto'` 时填满坐标轴。`imshow` 的坐标轴默认是像素索引而非数据坐标，需要显示真实数据坐标时用 `extent` 参数指定范围：

```python
im = ax.imshow(Z, extent=(-3, 3, -3, 3), origin='lower', cmap='viridis')
```

`extent` 按 `(left, right, bottom, top)` 指定数据的实际坐标范围。

## 1.4.3 极坐标图 polar

极坐标图用角度与半径表示数据，适合方向性数据与周期性数据。创建方式有两种：`fig.add_subplot(projection='polar')` 或 `plt.subplot(projection='polar')`，`plt.polar()` 是 pyplot 的快捷入口。极坐标下用 `theta`（角度，弧度）与 `r`（半径）绘图：

```python
fig = plt.figure()
ax = fig.add_subplot(111, projection='polar')

theta = np.linspace(0, 2 * np.pi, 100)
r = 1 + 0.5 * np.sin(4 * theta)     # 四叶玫瑰线

ax.plot(theta, r, 'b-', label='r = 1 + 0.5sin(4θ)')
ax.fill_between(theta, 0, r, alpha=0.2)
ax.legend(loc='upper right')
fig.show()
```

`projection='polar'` 指定极坐标投影，此后 `ax.plot()`、`ax.fill_between()` 等都按角度-半径解释。`plt.polar(theta, r)` 等价于创建极坐标子图并绘图。极坐标图的方向数据（如风向、相位）与周期性信号展示上有天然优势，`theta` 默认从右侧 0 弧度开始逆时针旋转。极坐标图也可以叠加散点、柱状图（扇形柱）等。

## 1.4.4 三维图 mplot3d

三维图位于 `mpl_toolkits.mplot3d` 模块，通过 `fig.add_subplot(projection='3d')` 或 `Axes3D` 创建。较新的 Matplotlib 版本中无需显式导入 `Axes3D`，直接指定 `projection='3d'` 即可，但为了兼容性仍然可以 `from mpl_toolkits.mplot3d import Axes3D`。三维坐标轴提供 `scatter3D()`、`plot3D()`、`plot_surface()`、`plot_wireframe()`、`contour3D()`、`bar3D()` 等绘图方法：

```python
import matplotlib.pyplot as plt
import numpy as np

fig = plt.figure(figsize=(10, 6))

# 三维散点
ax1 = fig.add_subplot(2, 3, 1, projection='3d')
rng = np.random.default_rng(2)
xs = rng.normal(0, 1, 50)
ys = rng.normal(0, 1, 50)
zs = rng.normal(0, 1, 50)
ax1.scatter3D(xs, ys, zs, c=zs, cmap='viridis', s=30)
ax1.set_title('scatter3D')

# 三维曲线
ax2 = fig.add_subplot(2, 3, 2, projection='3d')
t = np.linspace(0, 4 * np.pi, 200)
ax2.plot3D(np.sin(t), np.cos(t), t / 4, 'b-')
ax2.set_title('plot3D')

# 三维曲面
ax3 = fig.add_subplot(2, 3, 3, projection='3d')
x = np.linspace(-2, 2, 60)
y = np.linspace(-2, 2, 60)
X, Y = np.meshgrid(x, y)
Z = np.sin(X) * np.cos(Y)
surf = ax3.plot_surface(X, Y, Z, cmap='coolwarm', alpha=0.9)
ax3.set_title('plot_surface')

# 三维线框
ax4 = fig.add_subplot(2, 3, 4, projection='3d')
ax4.plot_wireframe(X, Y, Z, color='gray', alpha=0.5)
ax4.set_title('plot_wireframe')

# 三维等高线
ax5 = fig.add_subplot(2, 3, 5, projection='3d')
ax5.contour3D(X, Y, Z, 15, cmap='viridis')
ax5.set_title('contour3D')

# 三维柱状图
ax6 = fig.add_subplot(2, 3, 6, projection='3d')
bx, by = np.meshgrid(np.arange(4), np.arange(4))
bz = rng.integers(1, 10, (4, 4)).astype(float)
ax6.bar3D(bx.ravel(), by.ravel(), np.zeros(16), 0.6, 0.6,
          bz.ravel(), shade=True)
ax6.set_title('bar3D')

fig.tight_layout()
fig.show()
```

各方法的要点：`scatter3D(x, y, z)` 接受三组等长数组，可用 `c` 与 `cmap` 着色；`plot3D(x, y, z)` 画三维曲线；`plot_surface(X, Y, Z)` 需要网格化后的 X、Y 与 Z，`rstride`/`cstride` 控制网格密度，`cmap` 与 `alpha` 控制外观；`plot_wireframe(X, Y, Z)` 只画线框不填充；`contour3D(X, Y, Z, n)` 在三维空间画等高线；`bar3D(x, y, z0, dx, dy, dz)` 的参数分别是柱底位置、宽、深、高。三维图的旋转视角通过 `ax.view_init(elev, azim)` 调整俯仰角与方位角。

## 1.4.5 三角剖分图 tripcolor()、triplot()、tricontour()

当数据点是不规则散点（没有网格结构）时，无法直接使用 `contour` 与 `plot_surface`。此时先对散点做**三角剖分（Delaunay triangulation）**，把平面划分成三角形网格，再在三角网格上绘制。`plt.tripcolor()` 在三角形上填充颜色，`plt.triplot()` 画三角网格线，`plt.tricontour()` 在三角网格上画等高线：

```python
rng = np.random.default_rng(3)
x = rng.uniform(-3, 3, 80)
y = rng.uniform(-3, 3, 80)
z = np.sin(x) * np.cos(y)      # 不规则点上的函数值

fig, ax = plt.subplots()
ax.triplot(x, y, 'k-', alpha=0.3)          # 三角网格
tp = ax.tripcolor(x, y, z, cmap='viridis') # 三角填充
fig.colorbar(tp, ax=ax)
ax.tricontour(x, y, z, levels=8, colors='black', linewidths=0.5)
ax.set_title('三角剖分图')
fig.show()
```

三个函数都接收散点的 x、y 数组与对应的 z 取值，内部自动完成三角剖分。`triplot` 画出网格便于观察剖分结果，`tripcolor` 用色块表达取值，`tricontour` 叠加等值线。这套方法适合地理采样点、野外测量等数据天然不规则分布的场合。若需要显式控制三角剖分，可先创建 `matplotlib.tri.Triangulation` 对象再传给各函数。

## 1.4.6 箭头图 quiver() 与 quiverkey()

`ax.quiver()` 绘制二维向量场，每个位置画一个箭头表示该点的矢量（大小与方向），常用于梯度场、风场、流体速度场。`ax.quiverkey()` 添加图例箭头，说明箭头长度对应的数值大小：

```python
x = np.linspace(-2, 2, 15)
y = np.linspace(-2, 2, 15)
X, Y = np.meshgrid(x, y)
U = -Y                    # x 方向分量
V = X                     # y 方向分量

fig, ax = plt.subplots()
q = ax.quiver(X, Y, U, V, scale=15, color='steelblue')
ax.quiverkey(q, X=0.9, Y=1.02, U=1, label='大小 = 1', labelpos='E')
ax.set_aspect('equal')
fig.show()
```

`ax.quiver(X, Y, U, V)` 中 X、Y 是箭头起点网格，U、V 是对应的向量分量。关键参数有 `scale`（箭头整体缩放，越大箭头越短）、`scale_units`（缩放单位，`'xy'` 表示按数据坐标）、`color`、`pivot`（旋转中心，默认 `'tail'`）。`quiverkey(q, X, Y, U, label)` 在图上放置一个参考箭头，其中 `U` 是箭头代表的数值，`label` 是说明文字。向量场可视化常用 `ax.quiver` 观察方向与强度的空间分布。

## 1.4.7 流线图 streamplot()

`ax.streamplot()` 根据向量场绘制流线，流线是处处与向量场方向相切的曲线，适合展示流动模式与汇、源、涡旋结构，视觉上比箭头图更平滑。关键参数有 `density`（流线密度）、`color`（可映射到速度大小）、`linewidth`、`arrowstyle`：

```python
x = np.linspace(-3, 3, 100)
y = np.linspace(-3, 3, 100)
X, Y = np.meshgrid(x, y)
U = -1 - Y ** 2 + X          # x 方向速度
V = 1 + X - Y ** 2           # y 方向速度
speed = np.sqrt(U ** 2 + V ** 2)

fig, ax = plt.subplots()
strm = ax.streamplot(X, Y, U, V, color=speed, cmap='plasma',
                     density=1.5, linewidth=1.5, arrowstyle='->')
fig.colorbar(strm.lines, ax=ax, label='速度大小')
ax.set_title('流线图')
fig.show()
```

`streamplot` 在网格上插值生成流线，`density` 控制流线数量（越大越密），`color` 可以传一个与网格同形状的数组（如速度大小）配合 `cmap` 着色，`linewidth` 也可按数组逐线变化。返回的 `strm.lines` 是流线集合，可传给 `colorbar`。与 `quiver` 相比，`streamplot` 强调整体流动模式，`quiver` 强调逐点方向与大小。

## 1.4.8 频谱图 specgram()

`ax.specgram()` 对一维信号做短时傅里叶变换，把时间-频率-能量三维信息压缩成二维图：横轴是时间，纵轴是频率，颜色表示该时频点的能量强度。常用于语音、脑电、振动信号分析。关键参数有 `NFFT`（窗口长度）、`Fs`（采样率）、`noverlap`（窗口重叠）、`cmap`：

```python
fs = 1000.0                          # 采样率 1000 Hz
t = np.arange(0, 4, 1 / fs)
# 前 2 秒 50 Hz 正弦，后 2 秒 200 Hz 正弦
freq = np.where(t < 2, 50, 200)
signal = np.sin(2 * np.pi * freq * t) + 0.5 * np.random.randn(len(t))

fig, ax = plt.subplots()
ax.specgram(signal, NFFT=256, Fs=fs, noverlap=128, cmap='viridis')
ax.set_xlabel('时间 (秒)')
ax.set_ylabel('频率 (Hz)')
ax.set_title('频谱图')
fig.show()
```

`NFFT` 是每次 FFT 的窗口点数，越大频率分辨率越高、时间分辨率越低；`noverlap` 是相邻窗口的重叠样本数，常用 `NFFT` 的一半；`Fs` 是采样率，决定频率轴的单位。图中能清楚看到 2 秒处频率从 50 Hz 跳到 200 Hz。`ax.specgram()` 返回 `(spectrum, freqs, t, im)` 四元组，`im` 可用于 colorbar。类似的时频分析还有 `plt.specgram`、`ax.psd()`（功率谱密度）。

## 1.4.9 图像叠加 fig.figimage() 与 ax.imshow()

`ax.imshow()` 除了画热图，也用于显示真实图像（灰度图或 RGB 图），并可与图表内容在同一坐标轴内叠加。`fig.figimage()` 则把图像直接放在 Figure 画布上，不进入任何 Axes 坐标系统，适合纯图像排版：

```python
rng = np.random.default_rng(4)
img = rng.integers(0, 256, (50, 80), dtype=np.uint8)   # 模拟灰度图

fig = plt.figure()
fig.figimage(img, xo=0, yo=0, cmap='gray')   # 直接放画布左上角

ax = fig.add_axes([0.3, 0.5, 0.5, 0.4])
ax.imshow(img, cmap='gray', interpolation='bicubic')
ax.set_title('ax.imshow 显示图像')
fig.show()
```

`fig.figimage()` 的 `xo`、`yo` 是图像在画布上的像素偏移，`cmap` 指定灰度映射，适合多张图或与文字组合的版式。`ax.imshow(img)` 把图像当作 Axes 的内容，可与 `ax.plot()` 等叠加，例如在医学影像上叠加标记点。显示真彩图时传 `(H, W, 3)` 形状的 RGB 数组即可。两者都能用 `alpha` 控制透明度实现叠加效果。

## 练习题

### 第1题 概念理解

说明 `np.meshgrid()` 在等高线图与三维曲面中的作用；说明 `imshow()` 中 `extent` 与 `origin` 参数的含义；说明三角剖分图适用于什么数据类型；说明 `quiver()` 与 `streamplot()` 的差异。

::: details 参考答案

`np.meshgrid()` 生成网格坐标 X、Y，与 z 同形状，用于计算每个格点上的函数值，是 contour、plot_surface 等网格化绘图的前提。`extent` 指定数组在真实数据坐标中的范围 `(left, right, bottom, top)`，`origin` 控制第 0 行在顶部还是底部。三角剖分图适用于不规则散点数据，先做 Delaunay 三角剖分再绘图。`quiver` 逐点画箭头强调方向和大小，`streamplot` 画流线强调整体流动模式。
:::

### 第2题 代码编写

定义函数 $z=\sin(\sqrt{x^2+y^2})$，在 $x,y \in [-3,3]$ 上先用 `meshgrid` 网格化，画出 `contourf` 填充等高线图并添加 colorbar；再用 `plot_surface` 画出对应的三维曲面。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(-3, 3, 80)
y = np.linspace(-3, 3, 80)
X, Y = np.meshgrid(x, y)
Z = np.sin(np.sqrt(X ** 2 + Y ** 2))

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4),
                               subplot_kw={'projection': None})

cs = ax1.contourf(X, Y, Z, levels=20, cmap='viridis')
fig.colorbar(cs, ax=ax1)
ax1.set_title('填充等高线图')
ax1.set_aspect('equal')

ax2 = fig.add_subplot(1, 2, 2, projection='3d')
ax2.plot_surface(X, Y, Z, cmap='coolwarm', alpha=0.9)
ax2.set_title('三维曲面')

fig.tight_layout()
fig.show()
```

:::

### 第3题 进阶练习

生成 60 个随机散点及其函数值，用 `tripcolor` 与 `tricontour` 绘制不规则点数据的可视化；生成一个旋转向量场并同时用 `quiver` 与 `streamplot` 展示；生成含两个不同频率段的信号并用 `specgram` 观察时频变化。

::: details 参考答案

```python
import matplotlib.pyplot as plt
import numpy as np

rng = np.random.default_rng(9)
fig = plt.figure(figsize=(12, 8))

# 三角剖分图
ax1 = fig.add_subplot(2, 2, 1)
x = rng.uniform(-3, 3, 60)
y = rng.uniform(-3, 3, 60)
z = np.sin(x) * np.cos(y)
ax1.triplot(x, y, 'k-', alpha=0.2)
tp = ax1.tripcolor(x, y, z, cmap='viridis')
fig.colorbar(tp, ax=ax1)
ax1.tricontour(x, y, z, levels=6, colors='black', linewidths=0.5)
ax1.set_title('三角剖分图')

# 向量场：旋转场
X, Y = np.meshgrid(np.linspace(-2, 2, 15), np.linspace(-2, 2, 15))
U = -Y
V = X

ax2 = fig.add_subplot(2, 2, 2)
ax2.quiver(X, Y, U, V, scale=15)
ax2.set_title('quiver 箭头图')
ax2.set_aspect('equal')

ax3 = fig.add_subplot(2, 2, 3)
speed = np.sqrt(U ** 2 + V ** 2)
ax3.streamplot(X, Y, U, V, color=speed, cmap='plasma')
ax3.set_title('streamplot 流线图')
ax3.set_aspect('equal')

# 频谱图
fs = 1000.0
t = np.arange(0, 4, 1 / fs)
freq = np.where(t < 2, 50, 200)
signal = np.sin(2 * np.pi * freq * t) + 0.5 * rng.standard_normal(len(t))

ax4 = fig.add_subplot(2, 2, 4)
ax4.specgram(signal, NFFT=256, Fs=fs, noverlap=128, cmap='viridis')
ax4.set_xlabel('时间 (秒)')
ax4.set_ylabel('频率 (Hz)')
ax4.set_title('频谱图')

fig.tight_layout()
fig.show()
```

:::

## 常见错误

**错误 1 · 用 `contour` 画散点数据报错 "Input z must be a 2D array"**

原因:`contour` 要求 z 是网格化后的二维数组,直接传一维散点取值会报错。

解决:先用 `np.meshgrid` 生成 X、Y,再在网格上计算 Z;散点数据改用 `tripcolor` 或 `tricontour`。

**错误 2 · 三维图创建时报 "Unknown projection '3d'"**

原因:旧版本 Matplotlib 需要显式导入 `Axes3D`,或版本过旧不支持 `projection='3d'`。

解决:在文件开头添加 `from mpl_toolkits.mplot3d import Axes3D`,或升级 Matplotlib 版本。

**错误 3 · `imshow` 显示结果上下颠倒**

原因:`origin` 默认 `'upper'` 按图像惯例显示,与矩阵坐标习惯相反。

解决:设置 `origin='lower'` 让第 0 行显示在底部,或明确 `extent` 指定坐标范围。

**错误 4 · 极坐标图 `projection='polar'` 下绘制柱状图宽度异常**

原因:极坐标下 `width` 参数单位是弧度,传整数度数会导致柱条过宽。

解决:把角度换算成弧度,如 `width=np.deg2rad(30)`。

**错误 5 · `quiver` 箭头过大或过小看不清**

原因:默认 `scale` 未设置时按自动算法缩放,数据量级差异大时效果不佳。

解决:手动调整 `scale`,并用 `quiverkey` 添加参考箭头说明长度与数值的对应关系。

**错误 6 · `specgram` 画出的频谱图频率轴与预期不符**

原因:`Fs` 未设置或设置错误,频率轴单位不正确。

解决:确认 `Fs` 为真实采样率,并配合 `NFFT` 与 `noverlap` 权衡时间分辨率与频率分辨率。
