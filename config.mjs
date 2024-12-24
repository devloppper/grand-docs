import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "博客",
    description: "技术留痕 厚积薄发",
    cleanUrls: true,
    head: [['link', {rel: 'icon', href: '/favicon.ico'}]],
    lang: 'zh-cn',
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            {text: '技术文档', link: '/tech'},
            {text: '项目', link: "/project"},
            {text: '主站', link: "https://www.hujye.com"},
            // {
            //     text: '站内跳转',
            //     items: [
            //         {
            //             text: "主站",
            //             link: "https://www.hujye.com",
            //         },
            //         {
            //             text: "Kibana",
            //             link: "https://kibana.hujye.com",
            //         },
            //     ]
            // },

        ],

        sidebar: {
            "/tech/": [
                {
                    text: '编程语言',
                    items: [
                        {text: 'Golang', link: '/tech/golang'},
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
                                    text: "Docker安装MySQL",
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
                },
                {
                    text: "组件",
                    items: [
                        {
                            text: "Excel",
                            link: "/tech/excel"
                        }
                    ]
                }
            ],
            "/project/": [
                {
                    text: '业余工具',
                    items: [
                        {text: '安卓自动滑屏幕', link: '/project/other/android-swipe.md'},
                    ]
                },
            ],
            "/tech/golang": [
                {
                    text: "Golang",
                    items: [
                        {text: '语法', link: '/tech/golang/grammar'},
                    ]
                }
            ]
        },

        socialLinks: [
            {icon: 'github', link: 'https://github.com/devloppper/grand-docs'}
        ]
    },
    outDir: "../dist"
})