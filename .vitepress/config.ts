import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'
import container from 'markdown-it-container'

// ============================================================
// 全局 VitePress 配置
// 站点：医学生自救计划
// 风格参考：https://datawhalechina.github.io/math-for-ai/#/
//   - 浅色 docsify 风格
//   - 主页右侧显示 README，左侧显示层层递进的章节目录
//   - 顶部三大模块：互联网开发 / R语言与生信分析 / 人工智能的数学基础
// ============================================================

// ============================================================
// 自定义 admonition 容器类型
// 用法（在 markdown 中）：
//   ::: note 书写规范提示
//   内容支持完整 markdown：$...$ 公式、`code`、**bold**、列表等
//   :::
// 渲染为 <div class="admonition note"><p class="title">书写规范提示</p>...</div>
// CSS 类已定义于 theme/styles/components.css
// 说明：对于 VitePress 已注册的内置容器（tip/info/warning/danger），
// 这里覆盖其渲染规则，输出 .admonition 类 HTML 而非 .custom-block 类
// ============================================================
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

  // GitHub Pages 部署：仓库名 medical_student_rescue_plan
  // 访问 URL：https://xtsgreen.github.io/medical_student_rescue_plan/
  base: '/medical_student_rescue_plan/',

  cleanUrls: true,
  lastUpdated: true,

  // 始终使用浅色主题（docsify 风格），不显示主题切换按钮
  appearance: false,

  // 让 Vue 忽略 MathJax 输出的自定义元素（如 <mjx-container>）
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

  // MarkDown 扩展：MathJax 3 + 自定义 admonition 容器
  markdown: {
    config(md) {
      md.use(mathjax3, {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
          // 解决 \R \N \C 等符号报错：定义宏
          macros: {
            '\\R': '{\\mathbb{R}}',
            '\\N': '{\\mathbb{N}}',
            '\\C': '{\\mathbb{C}}',
            '\\Q': '{\\mathbb{Q}}',
            '\\Z': '{\\mathbb{Z}}'
          }
        }
      })
      // 注册自定义 admonition 容器（::: note / ::: tip / ::: key-idea 等）
      // 必须在 mathjax3 之后注册，确保容器内的 $...$ 公式能被 MathJax 处理
      registerAdmonitionContainers(md)
    },
    theme: { light: 'github-light', dark: 'github-light' },
    lineNumbers: true
  },

  // 主题配置
  themeConfig: {
    // 站点级导航：精简顶部菜单
    nav: [
      { text: '首页', link: '/' },
      { text: '互联网开发', link: '/code/互联网开发/' },
      { text: 'R语言与生信', link: '/code/R语言与生信分析/' },
      { text: '人工智能的数学基础', link: '/code/人工智能的数理基础/' }
    ],

    // ============================================================
    // 统一侧边栏：覆盖三大模块，层层递进
    // 顶层是「大模块」，第二层是「章」，第三层是「节」
    // ============================================================
    sidebar: {
      '/': [
        // ---------- 互联网开发 ----------
        {
          text: '互联网开发',
          collapsed: false,
          items: [
            {
              text: '前端开发',
              collapsed: true,
              items: [
                { text: '001 · 前端开发', link: '/code/互联网开发/前端开发/001-前端开发' },
                { text: '002 · HTML 语言的简单应用与网页框架结构', link: '/code/互联网开发/前端开发/002-html语言的简单应用与网页框架结构' },
                { text: '003 · HTML 语言与网页框架进阶', link: '/code/互联网开发/前端开发/003-html语言与网页框架进阶' },
                { text: '004 · 网页可访问性与现代 HTML 特性', link: '/code/互联网开发/前端开发/004-网页可访问性与现代html特性' },
                { text: '005 · CSS 语言与界面美化基础', link: '/code/互联网开发/前端开发/005-css语言与界面美化基础' },
                { text: '006 · CSS 语言与界面美化进阶', link: '/code/互联网开发/前端开发/006-css语言与界面美化进阶' },
                { text: '007 · CSS 语言与高效开发和性能管控', link: '/code/互联网开发/前端开发/007-css语言与高效开发和性能管控' },
                { text: '008 · JavaScript 基础', link: '/code/互联网开发/前端开发/008-javascript基础' },
                { text: '009 · JavaScript 核心深入与基础拓展', link: '/code/互联网开发/前端开发/009-javascript核心深入与基础拓展' },
                { text: '010 · JavaScript 与 ES6 新特性', link: '/code/互联网开发/前端开发/010-javascript与es6新特性' },
                { text: '011 · JavaScript 中的异步编程与错误调试', link: '/code/互联网开发/前端开发/011-javascript中的异步编程与错误调试' }
              ]
            },
            {
              text: '后端开发',
              collapsed: true,
              items: [
                { text: '1 · 后端开发', link: '/code/互联网开发/后端开发/1-后端开发' }
              ]
            }
          ]
        },

        // ---------- R 语言与生信分析 ----------
        {
          text: 'R 语言与生信分析',
          collapsed: false,
          items: [
            {
              text: 'R 语言',
              collapsed: true,
              items: [
                { text: '001 · R 语言基础', link: '/code/R语言与生信分析/R语言/001-r语言基础' },
                { text: '002 · R 语言数据清洗与预处理', link: '/code/R语言与生信分析/R语言/002-r语言数据清洗与预处理' },
                { text: '003 · R 语言与数据可视化', link: '/code/R语言与生信分析/R语言/003-r语言与数据可视化' },
                { text: '004 · R 语言统计分析', link: '/code/R语言与生信分析/R语言/004-r语言统计分析' },
                { text: '005 · R 语言统计与建模', link: '/code/R语言与生信分析/R语言/005-r语言统计与建模' },
                { text: '006 · R 语言与机器学习', link: '/code/R语言与生信分析/R语言/006-r语言与机器学习' },
                { text: '007 · 深度学习（上）：基础与核心架构', link: '/code/R语言与生信分析/R语言/007-r语言与深度学习上' },
                { text: '008 · 深度学习（下）：生成模型与前沿架构', link: '/code/R语言与生信分析/R语言/008-r语言与深度学习下' }
              ]
            },
            {
              text: '生物信息技术',
              collapsed: true,
              items: [
                { text: '001 · 计算机基础初步', link: '/code/R语言与生信分析/生物信息技术/001-计算机基础初步' },
                { text: '002 · 生物信息资源', link: '/code/R语言与生信分析/生物信息技术/002-生物信息资源' },
                { text: '003 · 序列分析与比对', link: '/code/R语言与生信分析/生物信息技术/003-序列分析与比对' },
                { text: '004 · 基因组学分析', link: '/code/R语言与生信分析/生物信息技术/004-基因组学分析' },
                { text: '005 · 转录组学分析', link: '/code/R语言与生信分析/生物信息技术/005-转录组学分析' },
                { text: '006 · 表观遗传学分析', link: '/code/R语言与生信分析/生物信息技术/006-表观遗传学分析' },
                { text: '007 · 蛋白质组学与代谢组学', link: '/code/R语言与生信分析/生物信息技术/007-蛋白质组学与代谢组学' },
                { text: '008 · 系统生物学与网络分析', link: '/code/R语言与生信分析/生物信息技术/008-系统生物学与网络分析' }
              ]
            }
          ]
        },

        // ---------- 人工智能的数学基础 ----------
        {
          text: '人工智能的数学基础',
          collapsed: false,
          items: [
            {
              text: '第一章 · 线性代数',
              collapsed: false,
              items: [
                { text: '1.1 向量与基本运算', link: '/code/人工智能的数理基础/ch1-线性代数/ch1_1-向量与基本运算' },
                { text: '1.2 矩阵与线性变换', link: '/code/人工智能的数理基础/ch1-线性代数/ch1_2-矩阵与线性变换' },
                { text: '1.3 线性方程组与秩', link: '/code/人工智能的数理基础/ch1-线性代数/ch1_3-线性方程组与秩' },
                { text: '1.4 向量空间与四大子空间', link: '/code/人工智能的数理基础/ch1-线性代数/ch1_4-向量空间与四大子空间' },
                { text: '1.5 正交性与投影', link: '/code/人工智能的数理基础/ch1-线性代数/ch1_5-正交性与投影' },
                { text: '1.6 特征值与特征向量', link: '/code/人工智能的数理基础/ch1-线性代数/ch1_6-特征值与特征向量' },
                { text: '1.7 奇异值分解（SVD）', link: '/code/人工智能的数理基础/ch1-线性代数/ch1_7-奇异值分解' },
                { text: '1.8 矩阵微积分与数值计算', link: '/code/人工智能的数理基础/ch1-线性代数/ch1_8-矩阵微积分与数值计算' }
              ]
            },
            {
              text: '第二章 · 概率与统计',
              collapsed: false,
              items: [
                { text: '2.1 概率论基础', link: '/code/人工智能的数理基础/ch2-概率与统计/' },
                { text: '2.2 随机变量与分布', link: '/code/人工智能的数理基础/ch2-概率与统计/' },
                { text: '2.3 参数估计', link: '/code/人工智能的数理基础/ch2-概率与统计/' },
                { text: '2.4 假设检验', link: '/code/人工智能的数理基础/ch2-概率与统计/' }
              ]
            },
            {
              text: '第三章 · 最优化',
              collapsed: false,
              items: [
                { text: '3.1 凸优化基础', link: '/code/人工智能的数理基础/ch3-最优化/' },
                { text: '3.2 梯度下降法', link: '/code/人工智能的数理基础/ch3-最优化/' },
                { text: '3.3 牛顿法与拟牛顿法', link: '/code/人工智能的数理基础/ch3-最优化/' },
                { text: '3.4 约束优化', link: '/code/人工智能的数理基础/ch3-最优化/' }
              ]
            }
          ]
        }
      ]
    },

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ],

    // 搜索
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

    // 右侧大纲
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
