# LocatorJS（开发环境）

本项目使用 **LocatorJS 浏览器扩展**定位 UI 组件源代码，不再使用 Next Locator。

## 启用

1. 从 [LocatorJS 官方仓库](https://github.com/infi-pc/locatorjs/tree/master/apps/extension) 安装 Chrome / Edge 浏览器扩展。
2. 在本地代码仓库中执行 `pnpm install`、`pnpm dev`。
3. 在浏览器打开 `http://localhost:3000`，按住 **Alt**（macOS 为 Option），移动鼠标查看组件定位框，点击定位框跳转编辑器。
4. 在扩展设置中选用本机编辑器（例如 VS Code 或 Cursor），并允许浏览器打开对应的编辑器协议。

LocatorJS 扩展在开发模式读取 React/Next.js 的源码定位信息；**浏览器扩展必须由开发者自行安装和启用**，不能由项目的 npm 依赖自动安装到浏览器。这个方案不加载运行时代码、不修改生产构建，也无需额外 Babel/Webpack 配置。若 Next.js 16 + React 19 下扩展提示 `No source info found for this element`，先检查扩展兼容性及开发模式；不要重新安装 Next Locator 或依赖旧版 `locatorjs` 包来绕过。
