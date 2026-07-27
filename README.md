# 医学生自救计划

## 项目介绍

在医疗系统逐步腐烂的当下，希望这个项目能帮助一部分医学生 / 计算机初学者找到出路，预计知识面将涵盖互联网开发、原生开发、深度学习、机器学习、硬件开发、嵌入式等的基础知识，起到帮助入门的作用。

此外，这个项目也是我自己学习和巩固各种计算机知识的日志，祝我们共同进步。

QQ 群：965751576

## 技术栈

- **文档站点**：[VitePress](https://vitepress.dev/) 构建的静态文档站点
- **数学公式**：MathJax 3
- **交互演示**：Three.js + Vue 3 组件
- **内容格式**：Markdown

## 开发指南

项目使用 VitePress 构建文档，npm 管理依赖：

```sh
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建静态站点到 .vitepress/dist/
npm run build

# 预览构建产物
npm run preview
```

## 项目结构

```
.
├── .vitepress/          # VitePress 配置与主题
│   ├── config.ts        # 站点配置（导航、侧边栏、Markdown 插件）
│   └── theme/           # 自定义主题
│       ├── components/  # Vue 交互组件（Three.js 演示等）
│       ├── composables/ # Vue composables（资源管理）
│       ├── utils/       # 工具函数（线性代数运算等）
│       └── styles/      # 全局样式
├── code/
│   ├── ai-math/         # 人工智能的数学基础
│   ├── r-bioinformatics/# R 语言与生信分析
│   └── web-dev/         # 互联网开发
├── index.md             # 首页
└── package.json
```

## 部署

站点通过 GitHub Actions 自动构建并部署到 GitHub Pages。

访问地址：https://xtsgreen.github.io/medical_student_rescue_plan/
