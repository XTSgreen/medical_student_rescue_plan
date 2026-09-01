---
title: 1.14 动画
sidebar:
  order: 14
---
# 1.14 动画

静态图记录某一个时刻，动画则呈现随时间的变化过程。心电图的波形演化、肿瘤体积随疗程的变化、人群感染率的扩散，都是动画适合表达的内容。Matplotlib 的 `matplotlib.animation` 模块提供 `FuncAnimation` 与 `ArtistAnimation` 两种动画构造方式，并支持保存为 GIF、MP4 或 HTML 文件。本节讲解动画的创建、保存、实时更新，以及 `blit` 加速的原理和中文处理的注意事项。

## 1.14.1 FuncAnimation 基本用法

`FuncAnimation` 通过反复调用一个更新函数来逐帧刷新图形。核心参数有 `init_func`、`func`、`frames`、`interval`、`blit`：

```python
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

fig, ax = plt.subplots(figsize=(7, 4))
x = np.linspace(0, 2 * np.pi, 100)
line, = ax.plot(x, np.sin(x))
ax.set_ylim(-1.5, 1.5)

def update(frame):
    # frame 从 0 递增，作为相位偏移
    line.set_ydata(np.sin(x + frame / 10))
    return line,

anim = FuncAnimation(fig, update, frames=100, interval=50, blit=True)
plt.show()
```

各参数的含义：`func` 是每一帧调用的更新函数，接收当前帧号作为参数，返回要更新的图形对象列表；`init_func` 是初始帧函数，用于绘制静止的第一帧背景；`frames` 是帧号序列，可以是整数（自动生成 0 到 N-1）、列表或迭代器；`interval` 是每帧间隔毫秒数，默认 200；`blit` 开启后只重绘变化的区域，能明显加速。

`func` 必须返回**可迭代的图形对象列表**，即使只有一个对象也要写成 `return line,`。`init_func` 可选，配合 `blit=True` 时提供初始画面，避免第一帧出现空白。

## 1.14.2 ArtistAnimation 用法

`ArtistAnimation` 先把每一帧要显示的所有图形对象准备好，再按帧顺序播放，适合帧内容互不相同、难以用更新函数统一描述的场景：

```python
from matplotlib.animation import ArtistAnimation
import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots(figsize=(7, 4))
ax.set_xlim(0, 2 * np.pi)
ax.set_ylim(-1.5, 1.5)

frames = []
for shift in np.linspace(0, 2 * np.pi, 50):
    # 每帧画一个独立的图形对象并记录
    line, = ax.plot(np.linspace(0, 2 * np.pi, 100),
                    np.sin(np.linspace(0, 2 * np.pi, 100) + shift),
                    color='steelblue')
    frames.append([line])

anim = ArtistAnimation(fig, frames, interval=50, blit=True)
plt.show()
```

`ArtistAnimation(fig, frames)` 的 `frames` 是一个列表，每个元素是一帧的所有图形对象组成的列表。它把每一帧完整地绘制出来再播放，交互性不如 `FuncAnimation`，但代码结构直观。`interval` 与 `blit` 参数含义与 `FuncAnimation` 相同。

## 1.14.3 动画写入器与保存

动画可以直接保存为文件。`anim.save()` 的第一个参数是文件名，扩展名决定格式，配合 `writer` 指定写入器：

```python
# 保存为 GIF，使用 PillowWriter
anim.save('wave.gif', writer='pillow', fps=20)

# 保存为 MP4，使用 FFMpegWriter
anim.save('wave.mp4', writer='ffmpeg', fps=20)

# 保存为 HTML5 视频，使用 HTMLWriter
anim.save('wave.html', writer='html', fps=20)
```

常用写入器如下表：

| 写入器 | 对应格式 | 说明 |
| --- | --- | --- |
| `PillowWriter` | GIF | 基于 Pillow，安装 Pillow 即可用，无需额外软件 |
| `FFMpegWriter` | MP4、WebM | 需要系统安装 FFmpeg，画质与压缩率更好 |
| `HTMLWriter` | HTML | 内嵌为 HTML5 视频，浏览器直接播放 |

`fps` 表示每秒帧数，与 `interval` 的关系是 `interval = 1000 / fps`。保存时若使用 `writer='ffmpeg'` 而系统没有安装 FFmpeg，会报错，此时改用 `writer='pillow'` 或先安装 FFmpeg。GIF 体积较大且颜色数有限，需要高画质时优先保存 MP4。

`FancyArrowPatch`、动画专用文本等图形对象在保存 GIF 时可能因量化出现色块，属于格式本身的限制。

## 1.14.4 实时更新与交互模式

不保存文件时，可以让动画在窗口里实时播放。`plt.ion()` 开启交互模式，绘图命令立即刷新而不阻塞；`plt.ioff()` 关闭交互模式恢复默认行为。配合 `fig.canvas.draw()` 与 `fig.canvas.flush_events()` 手动刷新：

```python
import numpy as np
import matplotlib.pyplot as plt

plt.ion()                       # 开启交互模式
fig, ax = plt.subplots()
x = np.linspace(0, 10, 200)
line, = ax.plot(x, np.sin(x))
ax.set_ylim(-1.5, 1.5)

for i in range(200):
    line.set_ydata(np.sin(x + i / 10))
    fig.canvas.draw()           # 重新绘制画布
    fig.canvas.flush_events()   # 处理窗口事件，让画面及时显示
    plt.pause(0.02)             # 暂停，控制刷新节奏

plt.ioff()                      # 关闭交互模式
plt.show()
```

`fig.canvas.draw()` 触发一次完整重绘，`fig.canvas.flush_events()` 让 GUI 事件循环及时处理，两者配合才能让改动即时显示。`plt.pause()` 在交互模式下暂停指定秒数并刷新窗口，适合做简单的实时演示。注意 `draw()` 在非交互模式下会阻塞到窗口关闭，因此实时更新必须配合 `ion()` 使用。

## 1.14.5 blit 加速原理

`blit=True` 的核心思想是**只重绘发生变化的区域**。默认情况下每帧都会重绘整个画布，包括坐标轴、刻度、标题等静止元素；开启 `blit` 后，Matplotlib 把背景（不变化的元素）渲染成一张位图缓存，每帧只把变化的图形对象贴到对应区域上，省去大量重绘工作。

```python
anim = FuncAnimation(fig, update, frames=100, interval=50, blit=True)
```

使用 `blit=True` 有两个前提：`update` 函数必须返回需要更新的图形对象列表；通常要提供 `init_func` 绘制初始背景，否则第一帧可能是空白。`blit` 加速在 `FuncAnimation` 与 `ArtistAnimation` 上都适用，帧数多、元素复杂的动画提升尤其明显。代价是代码约束更多，且某些动态变化的元素（如坐标轴范围、标题）不会被缓存，需要把它们也放进返回列表或关掉 `blit`。

## 1.14.6 中文与字体注意事项

动画保存为图片时同样受字体影响。默认字体不含中文，直接绘制中文会出现方框。两个处理思路：

```python
import matplotlib.pyplot as plt

# 方法一：设置支持中文的字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei']
plt.rcParams['axes.unicode_minus'] = False   # 修正负号显示为方块的问题
```

方法二是使用 `matplotlib.font_manager` 指定一个中文字体文件并注册。中文字体体积较大，GIF 或 MP4 每帧都要渲染文字，动画帧数多时文字区域会成为性能瓶颈。动画中的中文应尽量精简，标题与坐标轴标签保持简短，动态更新的文本（如实时数值）数量不要太多，避免逐帧重绘文字拖慢速度。

保存 GIF 时文字边缘可能出现锯齿或色块，这是 GIF 256 色调色板导致的，需要清晰文字时改用 MP4 或 HTML 输出。

## 练习题

### 第1题 概念理解

说明 `FuncAnimation` 的 `func`、`frames`、`interval`、`blit` 四个参数各自的作用；说明 `blit=True` 的加速原理；说明保存 MP4 需要的条件。

::: details 参考答案

`func` 是每帧调用的更新函数，`frames` 提供帧号序列，`interval` 是帧间隔毫秒数，`blit` 控制是否只重绘变化区域。`blit=True` 时背景被缓存为位图，每帧只贴更新区域，省去整幅重绘。保存 MP4 需要系统安装 FFmpeg，并用 `writer='ffmpeg'` 或 `writer=FFMpegWriter(...)` 指定写入器。
:::

### 第2题 代码编写

用 `FuncAnimation` 制作一个正弦波动画，相位随帧号变化，设置 `interval=50` 与 `blit=True`，提供 `init_func` 绘制初始背景，并保存为 GIF 文件。

::: details 参考答案

```python
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

x = np.linspace(0, 2 * np.pi, 100)

fig, ax = plt.subplots(figsize=(7, 4))
line, = ax.plot([], [], color='steelblue')
ax.set_xlim(0, 2 * np.pi)
ax.set_ylim(-1.5, 1.5)
ax.set_xlabel('时间')
ax.set_ylabel('振幅')

def init():
    line.set_data([], [])
    return line,

def update(frame):
    line.set_data(x, np.sin(x + frame / 10))
    return line,

anim = FuncAnimation(fig, update, init_func=init,
                     frames=100, interval=50, blit=True)
anim.save('sine_wave.gif', writer='pillow', fps=20)
plt.show()
```

:::

### 第3题 进阶练习

用 `ArtistAnimation` 制作逐帧展示的正弦波动画并保存为 MP4；随后用 `plt.ion()` 编写一个实时更新的动画循环，每帧更新数据后调用 `fig.canvas.draw()` 与 `fig.canvas.flush_events()`，最后用 `plt.ioff()` 关闭交互模式。

::: details 参考答案

```python
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import ArtistAnimation

# ArtistAnimation 逐帧展示
x = np.linspace(0, 2 * np.pi, 100)
fig, ax = plt.subplots(figsize=(7, 4))
ax.set_xlim(0, 2 * np.pi)
ax.set_ylim(-1.5, 1.5)

frames = []
for phase in np.linspace(0, 2 * np.pi, 40):
    line, = ax.plot(x, np.sin(x + phase), color='steelblue')
    frames.append([line])

anim = ArtistAnimation(fig, frames, interval=60)
anim.save('sine_wave.mp4', writer='ffmpeg', fps=20)

# 实时更新循环
plt.ion()
fig2, ax2 = plt.subplots()
line2, = ax2.plot(x, np.sin(x))
ax2.set_ylim(-1.5, 1.5)
for i in range(60):
    line2.set_ydata(np.sin(x + i / 8))
    fig2.canvas.draw()
    fig2.canvas.flush_events()
    plt.pause(0.05)
plt.ioff()
plt.show()
```

:::

## 常见错误

**错误 1 · `anim.save('file.mp4', writer='ffmpeg')` 报找不到 FFmpeg**

原因:系统没有安装 FFmpeg，或可执行文件不在 PATH 中。

解决:安装 FFmpeg 并加入 PATH，或改用 `writer='pillow'` 保存为 GIF，或用 `writer='html'` 保存为 HTML 视频。

**错误 2 · `FuncAnimation` 的更新函数报 `TypeError`**

原因:`update` 返回值不是可迭代对象，例如写成 `return line`。

解决:返回列表或元组，写成 `return line,`。

**错误 3 · 开启 `blit=True` 后第一帧空白或元素不更新**

原因:没有提供 `init_func` 绘制初始背景，或变化的元素没有放进返回列表。

解决:提供 `init_func` 并让它返回全部初始元素；把需要更新的对象都放进 `update` 的返回值。

**错误 4 · 实时循环里窗口卡住不刷新**

原因:只调用了 `set_ydata` 没有重绘，或 `ion()` 没有开启。

解决:在循环里调用 `fig.canvas.draw()` 与 `fig.canvas.flush_events()`，并先用 `plt.ion()` 开启交互模式。

**错误 5 · 动画里的中文显示为方框**

原因:默认字体不含中文字形。

解决:设置 `plt.rcParams['font.sans-serif']` 为中文字体，并设置 `plt.rcParams['axes.unicode_minus'] = False` 修正负号显示。
