# ShirakawaFM — 个人站点

> 作品、写作与实验。名字就是身份，不需要额外的隐喻。

**在线地址：<https://shirakawafm.github.io>**

一个手写的静态站点：没有框架、没有构建步骤、没有第三方请求、没有统计脚本。
一份 CSS、两份 JavaScript、四个自托管字体文件，托管在 GitHub Pages。

---

## 设计说明

- **身份先行**：站点以 `ShirakawaFM` 这个名字组织，而不是把它解释成某个概念。首页、作品、写作、关于，四个部分对应四类公开信息。
- **编辑式排版**：Instrument Serif 用于大字号拉丁标题，IBM Plex Mono 用于编号、时间与元信息，中文回退到系统无衬线字体，靠字号、字距与留白建立层级。
- **纸、墨、一个朱红**：三组颜色，强调色只出现在编号、悬停与声音开关上。
- **一条会动的线**：首页的 canvas 随滚动速度与指针位置起伏，不是装饰性粒子，而是页面状态的可视化。
- **动效克制**：只动 `transform` 与 `opacity`；统一 `cubic-bezier(.16,1,.3,1)`；不劫持原生滚动；`prefers-reduced-motion` 下全部退化为静态。
- **默认安静**：没有自动播放的声音。环境音需要主动打开，用 WebAudio 实时生成，不加载音频文件。

## 页面结构

```text
/                          首页：身份、精选作品、最近写作、关于
/writing/                  写作归档
/writing/minimal-permissions.html
                           最小权限的代价：抖音画质扩展的 13 次迭代
/writing/release-pipeline.html
                           让发版自己发生：GitHub Actions 流水线
/writing/escape-the-template.html
                           把博客从模板里救出来：一次设计重写
/about/                    关于、工具、联系方式、本站说明
/404.html                  自定义 404
```

## 目录

```text
.
├── index.html
├── 404.html
├── writing/
│   ├── index.html
│   ├── minimal-permissions.html
│   ├── release-pipeline.html
│   └── escape-the-template.html
├── about/
│   └── index.html
└── assets/
    ├── css/site.css           设计变量、排版、组件、响应式
    ├── js/site.js             主题、时钟、菜单、光标、声音、阅读进度
    ├── js/home.js             首页 canvas 与轻微视差
    ├── fonts/                 Instrument Serif + IBM Plex Mono（SIL OFL）
    ├── favicon.svg
    └── og.png                 社交分享卡片（1200 × 630）
```

## 技术要点

| 项目 | 做法 |
| --- | --- |
| 框架 | 无。原生 HTML / CSS / JavaScript |
| 构建 | 无。源码即产物，GitHub Pages 直接托管 |
| 字体 | 自托管 4 个 woff2（约 70 KB），无 Google Fonts 请求 |
| 主题 | CSS 变量切换 paper / night，首屏内联脚本防止闪烁，选择写入 localStorage |
| 动效 | IntersectionObserver 入场、CSS clip 遮罩、rAF 光标跟随、Canvas 轨迹 |
| 无障碍 | 跳转链接、键盘可达菜单、可见焦点、`prefers-reduced-motion`、语义化标题层级 |
| 隐私 | 无 Cookie、无分析脚本、无外部请求 |

## 本地预览

任选一种静态服务器（不要直接双击 HTML，绝对路径资源需要服务器根目录）：

```bash
# Python
python -m http.server 8099

# Node
npx serve .
```

然后访问 <http://127.0.0.1:8099/>。

## 部署

仓库推送到 `main` 分支后，GitHub Pages 会自动发布。无需 Actions、无需 Jekyll：

1. Settings → Pages → Source 选择 **Deploy from a branch**；
2. Branch 选择 `main`，目录 `/ (root)`；
3. 保存后等待一分钟，访问 <https://shirakawafm.github.io>。

`.nojekyll` 让 Pages 跳过 Jekyll 处理，保证以纯静态文件发布。

## 新增一篇文章

1. 复制 `writing/minimal-permissions.html`，重命名为新的文章文件；
2. 修改 `<title>`、`description`、`og:*`、`canonical`；
3. 修改文章头部的分类、日期、阅读时间与标题；
4. 正文写在 `<article class="prose">` 内，二级标题使用 `id="s1"` 这样的锚点，并同步右侧目录；
5. 在 `writing/index.html` 与首页的写作列表中加入链接；
6. 更新 `sitemap.xml`。

## 字体许可

站点自托管 [Instrument Serif](https://github.com/Instrument/instrument-serif) 与
[IBM Plex Mono](https://github.com/IBM/plex)，两者均以 SIL Open Font License 授权，
完整许可见 [`assets/fonts/OFL.txt`](assets/fonts/OFL.txt)。

## English

A hand-written personal site for **ShirakawaFM** — works, notes and experiments.
No framework, no build step, no third-party requests, no analytics. One stylesheet,
two scripts and four self-hosted font files, served from GitHub Pages.

Design: editorial typography (Instrument Serif + IBM Plex Mono), paper/ink/vermilion palette,
one live trace line, restrained motion (transform + opacity only, no scroll hijacking,
`prefers-reduced-motion` respected), silence by default.

Live: <https://shirakawafm.github.io>

## License

- Code: [MIT](LICENSE)
- Writing and visual assets: © 2026 ShirakawaFM, all rights reserved.

## Contact

- GitHub: <https://github.com/ShirakawaFM>
- Email: <shirakawafm@outlook.com>
- Bilibili: <https://space.bilibili.com/209300529>
