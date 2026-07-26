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
  description: '医学生自救计划 · 互联网开发 / R语言与生信分析 / 人工智能的数学基础',


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
                { text: '2.1 概率论基础', link: '/code/ai-math/ch2-probability-statistics/' },
                { text: '2.2 随机变量与分布', link: '/code/ai-math/ch2-probability-statistics/' },
                { text: '2.3 参数估计', link: '/code/ai-math/ch2-probability-statistics/' },
                { text: '2.4 假设检验', link: '/code/ai-math/ch2-probability-statistics/' }
              ]
            },
            {
              text: '第三章 · 最优化',
              collapsed: false,
              items: [
                { text: '3.1 凸优化基础', link: '/code/ai-math/ch3-optimization/' },
                { text: '3.2 梯度下降法', link: '/code/ai-math/ch3-optimization/' },
                { text: '3.3 牛顿法与拟牛顿法', link: '/code/ai-math/ch3-optimization/' },
                { text: '3.4 约束优化', link: '/code/ai-math/ch3-optimization/' }
              ]
            }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
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
