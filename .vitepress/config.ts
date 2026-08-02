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
  title: '医学生自救计划',
  description: '医学生自救计划 · 互联网开发 / R语言与生信分析 / Python编程 / 人工智能的数学基础',


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
              text: '第二层 · 数据科学与AI工具箱（建设中）',
              collapsed: true,
              items: []
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
