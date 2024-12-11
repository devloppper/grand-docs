import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "博客",
  description: "技术留痕 厚积薄发",
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {text: '技术文档', link: '/tech'},
      {
        text: '站内跳转',
        items: [
          {
            text: "主站",
            link: "https://www.hujye.com",
          },
          {
            text: "Kibana",
            link: "https://kibana.hujye.com",
          },
        ]
      },

    ],

    sidebar: {
      "/tech/": [
        {
          text: '编程语言',
          items: [
            {text: 'Golang', link: '/tech/goland'},
            {text: 'Rust', link: '/tech/rust'}
          ]
        },
        {
          text: "数据库",
          items: [
            {
              text: 'MySQL',
              link: "/tech/mysql",
              items: [
                {
                    text:"Docker安装MySQL",
                    link: "/tech/mysql/docker.md"
                },
                {
                  text: "Golang-Gorm",
                  link: "/tech/mysql/gorm.md"
                }
              ]
            }
          ]
        },
        {
            text: "中间件",
            items: [
                {
                    text: "etcd",
                    link: "/tech/etcd",
                    items: [
                        {
                            text: "Docker安装etcd",
                            link: "/tech/etcd/docker.md"
                        }
                    ]
                }
            ]
        }
      ],
    },

    socialLinks: [
      {icon: 'github', link: 'https://github.com/devloppper/grand-docs'}
    ]
  },
  outDir: "../dist"
})