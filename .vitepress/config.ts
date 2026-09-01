import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'
import container from 'markdown-it-container'


const admonitionTypes = [
  'note',
  'tip',
  'info',
  'warning',
  'danger',
  'success',
  'key-idea'
]

function registerAdmonitionContainers(md: any) {
  admonitionTypes.forEach(type => {
    md.use(container, type, {
      render(tokens: any[], idx: number, _options: any, env: any) {
        const token = tokens[idx]
        if (token.nesting === 1) {
          // 开标签：从 token.info 中提取标题
          // token.info 形如 " note 标题文本"，需剥掉类型名前缀
          const info = token.info.trim().slice(type.length).trim()
          const title = info ? md.renderInline(info, { references: env.references }) : ''
          if (title.trim()) {
            return `<div class="admonition ${type}"><p class="title">${title}</p>\n`
          }
          return `<div class="admonition ${type}">\n`
        }
        return '</div>\n'
      }
    })
  })
}

export default defineConfig({
  lang: 'zh-CN',
  title: '教程',
  description: '教程 · 互联网开发 / R语言与生信分析 / Python编程 / 人工智能的数学基础',


  base: '/medical_student_rescue_plan/',

  cleanUrls: true,
  lastUpdated: true,


  appearance: false,


  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag: string) =>
          tag.startsWith('mjx-') ||
          tag === 'eq' ||
          tag === 'eqn'
      }
    }
  },

 
  markdown: {
    config(md) {
      md.use(mathjax3, {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
       
          macros: {
            '\\R': '{\\mathbb{R}}',
            '\\N': '{\\mathbb{N}}',
            '\\C': '{\\mathbb{C}}',
            '\\Q': '{\\mathbb{Q}}',
            '\\Z': '{\\mathbb{Z}}'
          }
        }
      })
      registerAdmonitionContainers(md)
    },
    theme: { light: 'github-light', dark: 'github-light' },
    lineNumbers: true
  },


  themeConfig: {
    nav: [
      { text: '首页', link: '/' }
    ],

    sidebar: {
      '/': [

        {
          text: '互联网开发',
          collapsed: false,
          items: [
            {
              text: '前端开发',
              collapsed: true,
              items: [
                { text: '001 · 前端开发', link: '/code/web-dev/frontend/001-frontend' },
                { text: '002 · HTML 语言的简单应用与网页框架结构', link: '/code/web-dev/frontend/002-html-basics' },
                { text: '003 · HTML 语言与网页框架进阶', link: '/code/web-dev/frontend/003-html-advanced' },
                { text: '004 · 网页可访问性与现代 HTML 特性', link: '/code/web-dev/frontend/004-html-accessibility' },
                { text: '005 · CSS 语言与界面美化基础', link: '/code/web-dev/frontend/005-css-basics' },
                { text: '006 · CSS 语言与界面美化进阶', link: '/code/web-dev/frontend/006-css-advanced' },
                { text: '007 · CSS 语言与高效开发和性能管控', link: '/code/web-dev/frontend/007-css-performance' },
                { text: '008 · JavaScript 基础', link: '/code/web-dev/frontend/008-javascript-basics' },
                { text: '009 · JavaScript 核心深入与基础拓展', link: '/code/web-dev/frontend/009-javascript-core' },
                { text: '010 · JavaScript 与 ES6 新特性', link: '/code/web-dev/frontend/010-javascript-es6' },
                { text: '011 · JavaScript 中的异步编程与错误调试', link: '/code/web-dev/frontend/011-javascript-async' }
              ]
            },
            {
              text: '后端开发',
              collapsed: true,
              items: [
                { text: '1 · 后端开发', link: '/code/web-dev/backend/1-backend' }
              ]
            }
          ]
        },

        {
          text: 'R 语言与生信分析',
          collapsed: false,
          items: [
            {
              text: 'R 语言',
              collapsed: true,
              items: [
                { text: '001 · R 语言基础', link: '/code/r-bioinformatics/r-language/001-r-basics' },
                { text: '002 · R 语言数据清洗与预处理', link: '/code/r-bioinformatics/r-language/002-r-data-cleaning' },
                { text: '003 · R 语言与数据可视化', link: '/code/r-bioinformatics/r-language/003-r-data-visualization' },
                { text: '004 · R 语言统计分析', link: '/code/r-bioinformatics/r-language/004-r-statistics' },
                { text: '005 · R 语言统计与建模', link: '/code/r-bioinformatics/r-language/005-r-modeling' },
                { text: '006 · R 语言与机器学习', link: '/code/r-bioinformatics/r-language/006-r-machine-learning' },
                { text: '007 · 深度学习（上）：基础与核心架构', link: '/code/r-bioinformatics/r-language/007-deep-learning-1' },
                { text: '008 · 深度学习（下）：生成模型与前沿架构', link: '/code/r-bioinformatics/r-language/008-deep-learning-2' }
              ]
            },
            {
              text: '生物信息技术',
              collapsed: true,
              items: [
                { text: '001 · 计算机基础初步', link: '/code/r-bioinformatics/bioinformatics/001-computer-basics' },
                { text: '002 · 生物信息资源', link: '/code/r-bioinformatics/bioinformatics/002-bioinfo-resources' },
                { text: '003 · 序列分析与比对', link: '/code/r-bioinformatics/bioinformatics/003-sequence-alignment' },
                { text: '004 · 基因组学分析', link: '/code/r-bioinformatics/bioinformatics/004-genomics' },
                { text: '005 · 转录组学分析', link: '/code/r-bioinformatics/bioinformatics/005-transcriptomics' },
                { text: '006 · 表观遗传学分析', link: '/code/r-bioinformatics/bioinformatics/006-epigenomics' },
                { text: '007 · 蛋白质组学与代谢组学', link: '/code/r-bioinformatics/bioinformatics/007-proteomics-metabolomics' },
                { text: '008 · 系统生物学与网络分析', link: '/code/r-bioinformatics/bioinformatics/008-systems-biology' }
              ]
            }
          ]
        },

        {
          text: 'Python 编程',
          collapsed: false,
          items: [
            {
              text: '第一层 · Python 核心语法基础',
              collapsed: false,
              items: [
                {
                  text: '开发环境与编程入门',
                  collapsed: true,
                  items: [
                    { text: '1.1 Python概述与开发环境准备', link: '/code/python/01-python-core-syntax/01-dev-env-and-intro/001-python-overview-and-env-setup' },
                    { text: '1.2 第一个Python程序与基本交互模式', link: '/code/python/01-python-core-syntax/01-dev-env-and-intro/002-first-program-and-interactive-mode' },
                    { text: '1.3 编程基础概念与程序结构入门', link: '/code/python/01-python-core-syntax/01-dev-env-and-intro/003-programming-basics-and-structure' },
                    { text: '1.4 程序组织与模块导入初步', link: '/code/python/01-python-core-syntax/01-dev-env-and-intro/004-modules-and-imports' },
                    { text: '1.5 错误处理与调试入门', link: '/code/python/01-python-core-syntax/01-dev-env-and-intro/005-error-handling-and-debugging' },
                    { text: '1.6 编程规范与风格初步', link: '/code/python/01-python-core-syntax/01-dev-env-and-intro/006-coding-standards-and-style' },
                    { text: '1.7 开发工具与辅助功能入门', link: '/code/python/01-python-core-syntax/01-dev-env-and-intro/007-dev-tools-and-utilities' }
                  ]
                },
                {
                  text: '基本语法与数据类型',
                  collapsed: true,
                  items: [
                    { text: '2.1 变量、常量与赋值机制', link: '/code/python/01-python-core-syntax/02-syntax-and-data-types/001-variables-constants-assignment' },
                    { text: '2.2 运算符与表达式', link: '/code/python/01-python-core-syntax/02-syntax-and-data-types/002-operators-and-expressions' },
                    { text: '2.3 数字类型', link: '/code/python/01-python-core-syntax/02-syntax-and-data-types/003-numeric-types' },
                    { text: '2.4 字符串类型', link: '/code/python/01-python-core-syntax/02-syntax-and-data-types/004-string-type' },
                    { text: '2.5 列表类型', link: '/code/python/01-python-core-syntax/02-syntax-and-data-types/005-list-type' },
                    { text: '2.6 元组类型', link: '/code/python/01-python-core-syntax/02-syntax-and-data-types/006-tuple-type' },
                    { text: '2.7 字典类型', link: '/code/python/01-python-core-syntax/02-syntax-and-data-types/007-dictionary-type' },
                    { text: '2.8 集合类型', link: '/code/python/01-python-core-syntax/02-syntax-and-data-types/008-set-type' },
                    { text: '2.9 类型转换与类型判断', link: '/code/python/01-python-core-syntax/02-syntax-and-data-types/009-type-conversion-and-checking' },
                    { text: '2.10 输入输出与基本交互', link: '/code/python/01-python-core-syntax/02-syntax-and-data-types/010-input-output-for-data-types' }
                  ]
                },
                {
                  text: '程序控制结构',
                  collapsed: true,
                  items: [
                    { text: '3.1 顺序结构', link: '/code/python/01-python-core-syntax/03-control-structures/001-sequential-structure' },
                    { text: '3.2 分支结构', link: '/code/python/01-python-core-syntax/03-control-structures/002-branch-structure' },
                    { text: '3.3 for 循环', link: '/code/python/01-python-core-syntax/03-control-structures/003-for-loop' },
                    { text: '3.4 while 循环', link: '/code/python/01-python-core-syntax/03-control-structures/004-while-loop' },
                    { text: '3.5 循环控制与中断', link: '/code/python/01-python-core-syntax/03-control-structures/005-loop-control-and-break' },
                    { text: '3.6 条件表达式（三元运算符）', link: '/code/python/01-python-core-syntax/03-control-structures/006-conditional-expression' },
                    { text: '3.7 异常处理控制结构', link: '/code/python/01-python-core-syntax/03-control-structures/007-exception-handling-control' },
                    { text: '3.8 上下文管理控制结构', link: '/code/python/01-python-core-syntax/03-control-structures/008-context-manager-control' },
                    { text: '3.9 嵌套与复合控制结构', link: '/code/python/01-python-core-syntax/03-control-structures/009-nested-composite-control' }
                  ]
                },
                {
                  text: '组合数据类型',
                  collapsed: true,
                  items: [
                    { text: '4.1 分类与通用特性', link: '/code/python/01-python-core-syntax/04-composite-data-types/001-composite-types-overview' },
                    { text: '4.2 序列类型通用操作', link: '/code/python/01-python-core-syntax/04-composite-data-types/002-sequence-common-operations' },
                    { text: '4.3 列表类型专题', link: '/code/python/01-python-core-syntax/04-composite-data-types/003-list-type-detail' },
                    { text: '4.4 元组类型专题', link: '/code/python/01-python-core-syntax/04-composite-data-types/004-tuple-type-detail' },
                    { text: '4.5 字典类型专题', link: '/code/python/01-python-core-syntax/04-composite-data-types/005-dictionary-type-detail' },
                    { text: '4.6 集合类型专题', link: '/code/python/01-python-core-syntax/04-composite-data-types/006-set-type-detail' },
                    { text: '4.7 对象引用、拷贝与内存管理', link: '/code/python/01-python-core-syntax/04-composite-data-types/007-references-copy-memory' },
                    { text: '4.8 构造与类型转换', link: '/code/python/01-python-core-syntax/04-composite-data-types/008-construction-and-type-conversion' }
                  ]
                },
                {
                  text: '函数与模块化编程',
                  collapsed: true,
                  items: [
                    { text: '5.1 函数定义与调用基础', link: '/code/python/01-python-core-syntax/05-functions-and-modules/001-function-basics' },
                    { text: '5.2 参数传递机制', link: '/code/python/01-python-core-syntax/05-functions-and-modules/002-parameters-and-arguments' },
                    { text: '5.3 作用域与命名空间', link: '/code/python/01-python-core-syntax/05-functions-and-modules/003-scope-and-namespace' },
                    { text: '5.4 递归函数', link: '/code/python/01-python-core-syntax/05-functions-and-modules/004-recursion' },
                    { text: '5.5 匿名函数与高阶函数基础', link: '/code/python/01-python-core-syntax/05-functions-and-modules/005-lambda-and-higher-order' },
                    { text: '5.6 模块基础', link: '/code/python/01-python-core-syntax/05-functions-and-modules/006-module-basics' },
                    { text: '5.7 包与项目组织', link: '/code/python/01-python-core-syntax/05-functions-and-modules/007-packages' },
                    { text: '5.8 模块级特殊属性', link: '/code/python/01-python-core-syntax/05-functions-and-modules/008-module-special-attributes' },
                    { text: '5.9 代码组织与最佳实践', link: '/code/python/01-python-core-syntax/05-functions-and-modules/009-code-organization' }
                  ]
                },
                {
                  text: '文件与异常处理',
                  collapsed: true,
                  items: [
                    { text: '6.1 文件对象基础与打开模式', link: '/code/python/01-python-core-syntax/06-files-and-exceptions/001-file-object-basics' },
                    { text: '6.2 文本文件读取', link: '/code/python/01-python-core-syntax/06-files-and-exceptions/002-text-file-reading' },
                    { text: '6.3 文本文件写入与追加', link: '/code/python/01-python-core-syntax/06-files-and-exceptions/003-text-file-writing' },
                    { text: '6.4 二进制文件操作', link: '/code/python/01-python-core-syntax/06-files-and-exceptions/004-binary-file' },
                    { text: '6.5 文件指针移动与文件信息', link: '/code/python/01-python-core-syntax/06-files-and-exceptions/005-file-pointer' },
                    { text: '6.6 上下文管理语句', link: '/code/python/01-python-core-syntax/06-files-and-exceptions/006-with-statement' },
                    { text: '6.7 文件系统路径操作', link: '/code/python/01-python-core-syntax/06-files-and-exceptions/007-path-operations' },
                    { text: '6.8 异常体系与内置异常类型', link: '/code/python/01-python-core-syntax/06-files-and-exceptions/008-exception-hierarchy' },
                    { text: '6.9 异常捕获结构', link: '/code/python/01-python-core-syntax/06-files-and-exceptions/009-try-except' },
                    { text: '6.10 异常抛出与自定义异常', link: '/code/python/01-python-core-syntax/06-files-and-exceptions/010-raise-and-custom' },
                    { text: '6.11 断言与调试辅助', link: '/code/python/01-python-core-syntax/06-files-and-exceptions/011-assert-and-debug' },
                    { text: '6.12 文件操作典型异常场景', link: '/code/python/01-python-core-syntax/06-files-and-exceptions/012-file-exception-scenarios' }
                  ]
                },
                {
                  text: '实战项目',
                  collapsed: true,
                  items: [
                    { text: '命令行任务管理器', link: '/code/python/project/' }
                  ]
                }
              ]
            },
            {
              text: '第二层 · 数据科学与AI工具箱',
              collapsed: true,
              items: [
                {
                  text: 'NumPy 数值计算基础',
                  collapsed: true,
                  items: [
                    { text: '1.1 NumPy 基础与数组对象', link: '/code/python/02-data-science/01-numpy-foundation/001-numpy-basics-and-array-object' },
                    { text: '1.2 索引、切片与花式索引', link: '/code/python/02-data-science/01-numpy-foundation/002-indexing-slicing-fancy-indexing' },
                    { text: '1.3 数组形状操作', link: '/code/python/02-data-science/01-numpy-foundation/003-array-shape-operations' },
                    { text: '1.4 通用函数(ufunc)与向量化运算', link: '/code/python/02-data-science/01-numpy-foundation/004-ufunc-and-vectorization' },
                    { text: '1.5 聚合统计与矩阵运算', link: '/code/python/02-data-science/01-numpy-foundation/005-aggregation-and-matrix-operations' },
                    { text: '1.6 广播机制', link: '/code/python/02-data-science/01-numpy-foundation/006-broadcasting' },
                    { text: '1.7 高级数组操作', link: '/code/python/02-data-science/01-numpy-foundation/007-advanced-array-operations' },
                    { text: '1.8 数组输入输出(I/O)', link: '/code/python/02-data-science/01-numpy-foundation/008-io' },
                    { text: '1.9 随机数生成(numpy.random)', link: '/code/python/02-data-science/01-numpy-foundation/009-random-number-generation' },
                    { text: '1.10 性能与内存优化', link: '/code/python/02-data-science/01-numpy-foundation/010-performance-and-memory' },
                    { text: '1.11 实用辅助函数', link: '/code/python/02-data-science/01-numpy-foundation/011-utility-functions' },
                    { text: '1.12 版本与兼容性', link: '/code/python/02-data-science/01-numpy-foundation/012-version-and-compatibility' }
                  ]
                },
                {
                  text: 'Pandas 数据分析',
                  collapsed: true,
                  items: [
                    { text: '1.1 Pandas 概述与核心数据结构', link: '/code/python/02-data-science/02-pandas-data-analysis/001-pandas-overview-and-core-structures' },
                    { text: '1.2 数据查看与探索', link: '/code/python/02-data-science/02-pandas-data-analysis/002-data-inspection-and-exploration' },
                    { text: '1.3 索引与选择', link: '/code/python/02-data-science/02-pandas-data-analysis/003-indexing-and-selection' },
                    { text: '1.4 数据选择与过滤进阶', link: '/code/python/02-data-science/02-pandas-data-analysis/004-advanced-selection-and-filtering' },
                    { text: '1.5 数据清洗与预处理', link: '/code/python/02-data-science/02-pandas-data-analysis/005-data-cleaning-and-preprocessing' },
                    { text: '1.6 数据转换与变形', link: '/code/python/02-data-science/02-pandas-data-analysis/006-data-transformation-and-reshaping' },
                    { text: '1.7 分组聚合与转换', link: '/code/python/02-data-science/02-pandas-data-analysis/007-groupby-aggregation-and-transformation' },
                    { text: '1.8 时间序列处理', link: '/code/python/02-data-science/02-pandas-data-analysis/008-time-series-processing' },
                    { text: '1.9 输入输出(I/O)', link: '/code/python/02-data-science/02-pandas-data-analysis/009-input-output' },
                    { text: '1.10 窗口与滚动操作', link: '/code/python/02-data-science/02-pandas-data-analysis/010-rolling-and-window-operations' },
                    { text: '1.11 性能优化与内存管理', link: '/code/python/02-data-science/02-pandas-data-analysis/011-performance-optimization-and-memory' },
                    { text: '1.12 高级索引与层次化', link: '/code/python/02-data-science/02-pandas-data-analysis/012-advanced-indexing-and-hierarchical' },
                    { text: '1.13 可视化集成', link: '/code/python/02-data-science/02-pandas-data-analysis/013-visualization-integration' },
                    { text: '1.14 数据处理管道', link: '/code/python/02-data-science/02-pandas-data-analysis/014-data-processing-pipeline' },
                    { text: '1.15 分类数据与有序分类', link: '/code/python/02-data-science/02-pandas-data-analysis/015-categorical-data' },
                    { text: '1.16 稀疏数据', link: '/code/python/02-data-science/02-pandas-data-analysis/016-sparse-data' },
                    { text: '1.17 字符串处理进阶', link: '/code/python/02-data-science/02-pandas-data-analysis/017-string-processing-advanced' },
                    { text: '1.18 缺失值表示与插值', link: '/code/python/02-data-science/02-pandas-data-analysis/018-missing-data-and-interpolation' },
                    { text: '1.19 分组与窗口高级功能', link: '/code/python/02-data-science/02-pandas-data-analysis/019-advanced-groupby-and-window' },
                    { text: '1.20 合并连接详解', link: '/code/python/02-data-science/02-pandas-data-analysis/020-merge-join-options' },
                    { text: '1.21 时间序列高级特性', link: '/code/python/02-data-science/02-pandas-data-analysis/021-time-series-advanced' },
                    { text: '1.22 选项与设置', link: '/code/python/02-data-science/02-pandas-data-analysis/022-options-and-settings' },
                    { text: '1.23 测试工具', link: '/code/python/02-data-science/02-pandas-data-analysis/023-testing-tools' },
                    { text: '1.24 兼容性与版本', link: '/code/python/02-data-science/02-pandas-data-analysis/024-compatibility-and-version' }
                  ]
                },
                {
                  text: 'Matplotlib 可视化',
                  collapsed: true,
                  items: [
                    { text: '1.1 Matplotlib 基础架构', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/001-matplotlib-basics-and-architecture' },
                    { text: '1.2 图形容器与面向对象接口', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/002-figure-and-axes-objects' },
                    { text: '1.3 基本图表类型', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/003-basic-chart-types' },
                    { text: '1.4 高级图表类型', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/004-advanced-chart-types' },
                    { text: '1.5 子图与布局管理', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/005-subplots-and-layout' },
                    { text: '1.6 坐标轴与刻度控制', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/006-axis-and-tick-control' },
                    { text: '1.7 脊柱与边框控制', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/007-spines-and-border-control' },
                    { text: '1.8 图例与注释', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/008-legend-and-annotation' },
                    { text: '1.9 颜色与色彩映射', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/009-colors-and-colormaps' },
                    { text: '1.10 样式与主题', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/010-styles-and-themes' },
                    { text: '1.11 网格与辅助线', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/011-grid-and-reference-lines' },
                    { text: '1.12 填充与图形对象', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/012-fill-and-patches' },
                    { text: '1.13 交互与事件', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/013-interaction-and-events' },
                    { text: '1.14 动画', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/014-animation' },
                    { text: '1.15 输入输出与保存', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/015-input-output-and-saving' },
                    { text: '1.16 文本与字体管理', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/016-text-and-font-management' },
                    { text: '1.17 路径与变换', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/017-paths-and-transforms' }
                  ]
                },
                {
                  text: 'Seaborn 统计绘图',
                  collapsed: true,
                  items: [
                    { text: '1.1 Seaborn 基础与主题', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/018-seaborn-basics-and-themes' },
                    { text: '1.2 调色板', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/019-seaborn-palettes' },
                    { text: '1.3 统计关系绘图', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/020-relational-plots' },
                    { text: '1.4 分类数据绘图', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/021-categorical-plots' },
                    { text: '1.5 分布绘图', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/022-distribution-plots' },
                    { text: '1.6 回归与模型绘图', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/023-regression-and-model-plots' },
                    { text: '1.7 矩阵图与热图', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/024-matrix-plots-and-heatmaps' },
                    { text: '1.8 多图网格系统', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/025-facetgrid-system' },
                    { text: '1.9 绘图美学与参数细化', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/026-aesthetics-and-tuning' },
                    { text: '1.10 工具函数与辅助', link: '/code/python/02-data-science/03-matplotlib-seaborn-visualization/027-utility-functions' }
                  ]
                },
                {
                  text: 'Scikit-learn 机器学习',
                  collapsed: true,
                  items: [
                    { text: '1.1 基础类与工具', link: '/code/python/02-data-science/04-scikit-learn-ml/001-scikit-learn-basics-and-estimators' },
                    { text: '1.2 线性模型', link: '/code/python/02-data-science/04-scikit-learn-ml/002-linear-models' },
                    { text: '1.3 支持向量机与判别分析', link: '/code/python/02-data-science/04-scikit-learn-ml/003-svm-and-discriminant-analysis' },
                    { text: '1.4 最近邻', link: '/code/python/02-data-science/04-scikit-learn-ml/004-nearest-neighbors' },
                    { text: '1.5 内核岭回归与高斯过程', link: '/code/python/02-data-science/04-scikit-learn-ml/005-kernel-ridge-and-gaussian-process' },
                    { text: '1.6 朴素贝叶斯与交叉分解', link: '/code/python/02-data-science/04-scikit-learn-ml/006-naive-bayes-and-cross-decomposition' },
                    { text: '1.7 决策树', link: '/code/python/02-data-science/04-scikit-learn-ml/007-decision-trees' },
                    { text: '1.8 集成方法', link: '/code/python/02-data-science/04-scikit-learn-ml/008-ensemble-methods' },
                    { text: '1.9 多类多标签分类', link: '/code/python/02-data-science/04-scikit-learn-ml/009-multiclass-and-multilabel' },
                    { text: '1.10 特征选择', link: '/code/python/02-data-science/04-scikit-learn-ml/010-feature-selection' },
                    { text: '1.11 半监督学习与概率校准', link: '/code/python/02-data-science/04-scikit-learn-ml/011-semi-supervised-and-calibration' },
                    { text: '1.12 神经网络与保序回归', link: '/code/python/02-data-science/04-scikit-learn-ml/012-neural-networks-and-isotonic' },
                    { text: '1.13 聚类', link: '/code/python/02-data-science/04-scikit-learn-ml/013-clustering' },
                    { text: '1.14 矩阵分解与流形学习', link: '/code/python/02-data-science/04-scikit-learn-ml/014-decomposition-and-manifold' },
                    { text: '1.15 协方差估计与异常检测', link: '/code/python/02-data-science/04-scikit-learn-ml/015-covariance-and-anomaly-detection' },
                    { text: '1.16 数据转换与预处理', link: '/code/python/02-data-science/04-scikit-learn-ml/016-preprocessing-and-imputation' },
                    { text: '1.17 数据集', link: '/code/python/02-data-science/04-scikit-learn-ml/017-datasets' },
                    { text: '1.18 模型选择与交叉验证', link: '/code/python/02-data-science/04-scikit-learn-ml/018-model-selection-and-cross-validation' },
                    { text: '1.19 模型评估指标', link: '/code/python/02-data-science/04-scikit-learn-ml/019-model-evaluation-metrics' },
                    { text: '1.20 管道与组合估计器', link: '/code/python/02-data-science/04-scikit-learn-ml/020-pipeline-and-compose' },
                    { text: '1.21 模型检查、实用工具与配置', link: '/code/python/02-data-science/04-scikit-learn-ml/021-model-inspection-and-utility-tools' }
                  ]
                }
              ]
            },
            {
              text: '第三层 · 医学数据处理专向技能（建设中）',
              collapsed: true,
              items: []
            }
          ]
        },

        {
          text: '人工智能的数学基础',
          collapsed: false,
          items: [
            {
              text: '第一章 · 线性代数',
              collapsed: false,
              items: [
                { text: '1.1 向量与基本运算', link: '/code/ai-math/ch1-linear-algebra/ch1_1-vectors' },
                { text: '1.2 矩阵与线性变换', link: '/code/ai-math/ch1-linear-algebra/ch1_2-matrices' },
                { text: '1.3 线性方程组与秩', link: '/code/ai-math/ch1-linear-algebra/ch1_3-linear-equations' },
                { text: '1.4 向量空间与四大子空间', link: '/code/ai-math/ch1-linear-algebra/ch1_4-vector-spaces' },
                { text: '1.5 正交性与投影', link: '/code/ai-math/ch1-linear-algebra/ch1_5-orthogonality' },
                { text: '1.6 特征值与特征向量', link: '/code/ai-math/ch1-linear-algebra/ch1_6-eigenvalues' },
                { text: '1.7 奇异值分解', link: '/code/ai-math/ch1-linear-algebra/ch1_7-svd' },
                { text: '1.8 数值计算与稳定性', link: '/code/ai-math/ch1-linear-algebra/ch1_8-matrix-calculus' }
              ]
            },
            {
              text: '第二章 · 概率与统计',
              collapsed: false,
              items: [
                { text: '2.1 概率论基础（建设中）', link: '/code/ai-math/ch2-probability-statistics/' }
              ]
            },
            {
              text: '第三章 · 最优化',
              collapsed: false,
              items: [
                { text: '3.1 凸优化基础（建设中）', link: '/code/ai-math/ch3-optimization/' }
              ]
            }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/XTSgreen/medical_student_rescue_plan' }
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除',
            backButtonTitle: '返回',
            noResultsText: '没有找到相关结果',
            footer: {
              selectText: '选择',
              navigateText: '切换'
            }
          }
        }
      }
    },

    outline: {
      level: [2, 3],
      label: '本页目录'
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单'
  }
})
