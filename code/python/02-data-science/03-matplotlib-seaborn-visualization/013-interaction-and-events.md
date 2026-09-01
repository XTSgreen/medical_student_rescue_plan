---
title: 1.13 交互与事件
sidebar:
  order: 13
---
# 1.13 交互与事件

静态图只能展示预先画好的内容，遇到数据点密集、局部细节看不清时束手无策。Matplotlib 的交互机制允许用户缩放平移、点击取数，也允许脚本对鼠标、键盘事件做出响应。本节的交互代码只在**交互式后端**（如 `%matplotlib` 弹窗、Jupyter 内联）中有效，保存为静态图片时事件不生效。本节先讲内置的缩放平移，再讲如何用 `mpl_connect` 绑定鼠标、键盘、拾取与悬停事件，最后补充 `matplotlib.widgets` 的按钮与滑条控件。

## 1.13.1 内置缩放与平移工具栏

Matplotlib 绘制的图形窗口自带工具栏。启用交互式后端后，工具栏提供放大、平移、复位、保存图片等按钮。缩放与平移是最常用的两个操作：放大工具允许用鼠标框选一个区域放大，拖动时按住左键框选；平移工具在按住左键拖动时移动视口，适合查看大图的局部。右键单击或点击复位按钮可以回到初始视图。

使用事件之前，确认 `plt.get_backend()` 返回的是交互式后端名称（如 `TkAgg`、`QtAgg`、`nbAgg`），命令行的 `plt.show()` 会阻塞等待窗口关闭，Jupyter 中使用 `%matplotlib` 魔法命令切换后端。

## 1.13.2 鼠标事件 mpl_connect

要编写自定义交互，核心是 `fig.canvas.mpl_connect(event_name, callback)`。第一个参数是事件名称，第二个参数是回调函数。鼠标按下事件名为 `'button_press_event'`，回调函数接收一个事件对象：

```python
import matplotlib.pyplot as plt
import numpy as np

fig, ax = plt.subplots()
x = np.linspace(0, 10, 100)
ax.plot(x, np.sin(x))

def on_click(event):
    # 点击坐标轴内部才处理
    if event.inaxes is None:
        return
    print(f'点击坐标: x={event.xdata:.2f}, y={event.ydata:.2f}, '
          f'鼠标键={event.button}')

fig.canvas.mpl_connect('button_press_event', on_click)
plt.show()
```

事件对象的常用属性如下表：

| 属性 | 含义 |
| --- | --- |
| `event.x` / `event.y` | 鼠标在窗口中的像素坐标（左上角为原点） |
| `event.xdata` / `event.ydata` | 鼠标在数据坐标系中的坐标，缩放后仍正确 |
| `event.button` | 按下的鼠标键，左键为 1，中键为 2，右键为 3 |
| `event.inaxes` | 事件发生的坐标轴，在轴外为 `None` |
| `event.canvas` | 触发事件的画布对象 |

鼠标事件名称还有 `'button_release_event'`（松开鼠标）、`'scroll_event'`（滚轮，用 `event.step` 读滚动方向）。`xdata` 与 `ydata` 是数据坐标，缩放后仍然对应真实数据位置，做取数交互时必须用它。

常用的事件名还有 `'motion_notify_event'`（鼠标移动）、`'pick_event'`（拾取）、`'key_press_event'`（键盘按下）、`'key_release_event'`（键盘松开）、`'resize_event'`（窗口大小变化）。

## 1.13.3 键盘事件 key_press_event

键盘事件用 `'key_press_event'` 绑定，事件对象的 `event.key` 给出按下的按键：

```python
fig, ax = plt.subplots()
ax.plot(x, np.sin(x))

def on_key(event):
    # 按 k 键在图上画一条竖线，按 c 键清除
    if event.key == 'k':
        ax.axvline(x=5, color='red', linestyle='--')
        fig.canvas.draw_idle()
    elif event.key == 'c':
        ax.cla()
        ax.plot(x, np.sin(x))
        fig.canvas.draw_idle()

fig.canvas.mpl_connect('key_press_event', on_key)
plt.show()
```

`event.key` 的取值是字符串，字母按键为 `'a'`、`'1'` 这样的形式，组合键为 `'ctrl+a'`、`'shift+z'`。修改图形后要调用 `fig.canvas.draw_idle()` 或 `fig.canvas.draw()` 刷新画布，否则改动不会显示。键盘事件适合做快捷键：翻页查看不同分组、切换显示模式、清除标注。

## 1.13.4 拾取事件 pick_event

拾取事件让鼠标点击某个图形对象时触发回调。要让对象可拾取，给绘图函数传 `picker` 参数，或用 `artist.set_picker()` 设置：

```python
fig, ax = plt.subplots()
x = np.linspace(0, 10, 20)
y = np.sin(x)
sc = ax.scatter(x, y, s=60, picker=5)   # 半径 5 像素内算命中

def on_pick(event):
    # event.artist 是被点中的图形对象
    ind = event.ind[0]                  # 命中的点的索引
    print(f'拾取到第 {ind} 个点, 坐标 x={x[ind]:.2f}, y={y[ind]:.2f}')

fig.canvas.mpl_connect('pick_event', on_pick)
plt.show()
```

`picker` 传数字表示命中半径（像素），传布尔值 `True` 表示整个对象可拾取。拾取事件的 `event.artist` 是被点中的对象，`event.ind` 是该对象内部被命中的索引数组（散点图是点的索引，折线图是线段索引）。拾取事件常用于点选交互：点击散点弹出详情、点击柱子高亮分组。

## 1.13.5 悬停事件 motion_notify_event

鼠标移动事件配合坐标转换，可以在光标附近实时显示数据信息，常见做法是实现简单的悬停标注：

```python
import numpy as np
import matplotlib.pyplot as plt

fig, ax = plt.subplots()
x = np.linspace(0, 10, 50)
y = np.sin(x)
ax.plot(x, y)

# 先隐藏标注框
annot = ax.annotate('', xy=(0, 0), xytext=(10, 10),
                    textcoords='offset points',
                    bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.8))
annot.set_visible(False)

def on_move(event):
    if event.inaxes is None:
        annot.set_visible(False)
        fig.canvas.draw_idle()
        return
    # 找到距离光标最近的 x 点
    idx = np.argmin(np.abs(x - event.xdata))
    annot.xy = (x[idx], y[idx])
    annot.set_text(f'x={x[idx]:.2f}, y={y[idx]:.2f}')
    annot.set_visible(True)
    fig.canvas.draw_idle()

fig.canvas.mpl_connect('motion_notify_event', on_move)
plt.show()
```

`motion_notify_event` 触发的频率很高，回调里应只做轻量计算，避免把整个图重绘。上面的示例用 `annotate` 预先创建一个隐藏的文本标注框，移动时只更新文本与位置，用 `draw_idle()` 刷新，性能可以接受。频繁重绘时可以用 `fig.canvas.draw_idle()` 代替 `draw()`，它只在需要时重绘，减少无谓开销。

## 1.13.6 交互式图例

图例的 `pickable` 图例项也可以响应拾取事件，实现点击图例开关曲线的效果：

```python
import numpy as np
import matplotlib.pyplot as plt

fig, ax = plt.subplots()
x = np.linspace(0, 10, 100)
lines = {}
for name, color in [('sin', 'tab:blue'), ('cos', 'tab:orange')]:
    if name == 'sin':
        y = np.sin(x)
    else:
        y = np.cos(x)
    lines[name] = ax.plot(x, y, color=color, label=name)[0]

# 让图例项可拾取
leg = ax.legend()
for legline in leg.get_lines():
    legline.set_picker(True)

def on_pick_legend(event):
    # 通过图例线找到对应的数据线
    legline = event.artist
    idx = leg.get_lines().index(legline)
    line = lines[list(lines.keys())[idx]]
    # 切换可见性并同步图例的透明度
    vis = not line.get_visible()
    line.set_visible(vis)
    legline.set_alpha(1.0 if vis else 0.2)
    fig.canvas.draw_idle()

fig.canvas.mpl_connect('pick_event', on_pick_legend)
plt.show()
```

`legend.get_lines()` 返回图例里的图例线对象，给它们 `set_picker(True)` 后就能接收拾取事件。回调中通过图例线在列表中的位置反查对应的数据线，用 `set_visible(False)` 隐藏曲线、同时把图例项调成半透明表示已隐藏，再刷新画布。这样用户点击图例即可交互式开关曲线。

## 1.13.7 matplotlib.widgets 常用控件

`matplotlib.widgets` 提供现成的交互控件。按钮 `Button` 与滑条 `Slider` 是最常用的两个：

```python
from matplotlib.widgets import Button, Slider
import numpy as np
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(7, 4))
plt.subplots_adjust(bottom=0.25)

x = np.linspace(0, 10, 200)
line, = ax.plot(x, np.sin(x))

# 滑条：频率，位于图下方
ax_slider = plt.axes([0.15, 0.12, 0.6, 0.03])
slider = Slider(ax_slider, '频率', 0.1, 5.0, valinit=1.0)

# 按钮：复位，位于更下方
ax_button = plt.axes([0.35, 0.03, 0.3, 0.05])
button = Button(ax_button, '复位频率')

def update(val):
    line.set_ydata(np.sin(slider.val * x))
    fig.canvas.draw_idle()

def reset(event):
    slider.reset()

slider.on_changed(update)
button.on_clicked(reset)
plt.show()
```

`Slider(ax, label, valmin, valmax)` 在指定坐标轴位置创建滑条，`valinit` 设置初值，拖动时通过 `on_changed` 绑定的回调更新图形。`Button(ax, label)` 创建按钮，点击时触发 `on_clicked` 回调。控件所在的坐标轴用 `plt.axes([left, bottom, width, height])` 以图形相对位置创建，先调用 `plt.subplots_adjust(bottom=...)` 给下方控件留出空间。控件让读者可以调节参数、实时观察曲线变化，比写死参数再重新绘图更直观。

## 练习题

### 第1题 概念理解

说明 `event.xdata`、`event.ydata` 与 `event.x`、`event.y` 的区别；说明 `picker` 参数的作用；说明为什么 `motion_notify_event` 的回调要尽量轻量。

::: details 参考答案

`xdata`、`ydata` 是数据坐标系中的坐标，缩放后仍对应真实数据；`x`、`y` 是窗口像素坐标，以左上角为原点。`picker` 控制图形对象能否被拾取，传数字表示命中半径（像素），传 `True` 表示整个对象可拾取。鼠标移动事件触发非常频繁，回调里做重量级计算或整图重绘会造成明显卡顿。
:::

### 第2题 代码编写

绘制 50 个点的散点图，绑定 `button_press_event`，在控制台打印点击位置的数据坐标与鼠标键；绑定 `key_press_event`，按 `q` 键在点击位置画一个红色圆点。

::: details 参考答案

```python
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle

rng = np.random.default_rng(1)
x = rng.uniform(0, 10, 50)
y = rng.uniform(0, 10, 50)

fig, ax = plt.subplots()
ax.scatter(x, y)

def on_click(event):
    if event.inaxes is None:
        return
    print(f'x={event.xdata:.2f}, y={event.ydata:.2f}, 键={event.button}')
    if event.key == 'q':
        ax.add_patch(Circle((event.xdata, event.ydata), 0.3,
                            color='red', zorder=5))
        fig.canvas.draw_idle()

fig.canvas.mpl_connect('button_press_event', on_click)
plt.show()
```

:::

### 第3题 进阶练习

绘制 `y = sin(a·x)` 曲线，用 `Slider` 调节振幅 a（范围 0.1 到 3），用 `Button` 复位；再为曲线绑定拾取事件，点击曲线时打印最近数据点的索引与坐标。

::: details 参考答案

```python
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider, Button

x = np.linspace(0, 10, 200)
fig, ax = plt.subplots(figsize=(7, 4))
plt.subplots_adjust(bottom=0.25)
line, = ax.plot(x, np.sin(x), picker=3)

ax_s = plt.axes([0.15, 0.12, 0.6, 0.03])
slider = Slider(ax_s, '振幅', 0.1, 3.0, valinit=1.0)
ax_b = plt.axes([0.35, 0.03, 0.3, 0.05])
button = Button(ax_b, '复位')

def update(val):
    line.set_ydata(slider.val * np.sin(x))
    fig.canvas.draw_idle()

def reset(event):
    slider.reset()

def on_pick(event):
    if event.artist is line:
        ind = event.ind[0]
        print(f'第 {ind} 个点, x={x[ind]:.2f}, y={line.get_ydata()[ind]:.2f}')

slider.on_changed(update)
button.on_clicked(reset)
fig.canvas.mpl_connect('pick_event', on_pick)
plt.show()
```

:::

## 常见错误

**错误 1 · 绑定了事件但没有反应**

原因:运行在非交互后端，或 `plt.show()` 被关闭后回调无法触发。

解决:确认后端为交互式（如 `TkAgg`、`QtAgg`、`nbAgg`），在弹窗或内联环境下交互，静态保存的图片不支持事件。

**错误 2 · 回调里改图后界面上没有变化**

原因:修改了数据或添加了元素，但没有刷新画布。

解决:在回调末尾调用 `fig.canvas.draw_idle()` 或 `fig.canvas.draw()`。

**错误 3 · 点击坐标轴外部时报错**

原因:在 `event.inaxes is None` 时仍访问 `event.xdata`，得到 `None` 参与运算。

解决:回调开头判断 `if event.inaxes is None: return`。

**错误 4 · 拾取散点时报 `IndexError` 或取到错误索引**

原因:把 `event.ind` 当成单个整数用，或没有给绘图函数传 `picker`。

解决:`event.ind` 是数组，用 `event.ind[0]` 取第一个命中的索引；确保绘图时设置了 `picker`。
