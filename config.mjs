import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "博客",
    description: "技术留痕 厚积薄发",
    cleanUrls: true,
    head: [['link', {rel: 'icon', href: '/favicon.ico'}]],
    lang: 'zh-cn',
    themeConfig: {
        search: {
            provider: 'local',
            options: {
                locales: {
                    root: { //这里是个大坑，zh是不生效的，改为root即可
                        translations: {
                            button: {
                                buttonText: '搜索',
                                buttonAriaLabel: '搜索文档'
                            },
                            modal: {
                                noResultsText: '无法找到相关结果',
                                resetButtonTitle: '清除查询条件',
                                footer: {
                                    selectText: '选择',
                                    navigateText: '切换'
                                }
                            }
                        }
                    }
                }
            }
        },
        nav: [
            {text: '目录', link: '/catalogue'},
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
            "/golang/": [
                {
                    text: '基础语法',
                    items: [
                        {text: '基本', link: '/golang/grammar-basic'},
                        {text: '高级', link: '/golang/grammar-advance'},
                        {text: '版本特性', link: '/golang/feature'},
                    ]
                },
                {
                    text: '三方包',
                    items: [
                        { text: "gorm", link: '/golang/gorm'},
                        { text: "excelize", link: '/golang/excelize'}
                    ]
                }
            ],
            "/excel/": [
                {
                    text: "openXML",
                    items: [
                        { text: "基础", link :"/excel/openXML-basic"}
                    ]
                }
            ],
            "/docker/": [
                {
                    text: "基本使用",
                    items: [
                        { text: "安装", link :"/docker/install"}
                    ]
                },
                {
                    text: "容器部署示例",
                    items: [
                        { text: "MySQL", link: "/docker/deploy-mysql"},
                        { text: "Etcd", link: "/docker/deploy-etcd"}
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

        },

        socialLinks: [
            {icon: 'github', link: 'https://github.com/devloppper/grand-docs'}
        ]
    },
    outDir: "../dist"
})