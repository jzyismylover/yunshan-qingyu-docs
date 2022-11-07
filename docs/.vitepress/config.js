module.exports = {
  base: '/yunshan-qingyu-docs/',
  title: 'qingyu-docs',
  description: '项目总结',
  themeConfig: {
    nav: createNav(),
    sidebar: createSidebar(),
    markdown: {
      toc: { includeLevel: [1, 2, 3, 4, 5] },
    },
  },
}

function createNav() {
  return [
    {
      text: '项目总结',
      link: '/learning/',
    },
  ]
}

function createSidebar() {
  return {
    '/learning/': [
      {
        children: [
          {
            text: '总结',
            link: '/learning/',
          },
        ],
      },
    ],
  }
}
