# LocatorJS（Next.js 16 + React 19）

已接入 **LocatorJS 项目内运行库** 和 **Turbopack 源码定位 loader**，无需 Next Locator。

## 本地启动

```powershell
git checkout feat/connect-orval-api
git pull
pnpm install --no-frozen-lockfile
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
pnpm dev
```

打开终端显示的本地开发地址（通常是 `http://localhost:3000`）。根布局在开发环境加载 `@locator/runtime`，按住 **Alt**（macOS 为 Option），移动鼠标定位组件并点击跳转代码。首次使用需要设置 VS Code / Cursor 等编辑器，并允许浏览器打开编辑器链接。

`@locator/webpack-loader` 为 Next.js 16 Turbopack 编译注入源码定位信息。LocatorJS UI 仅在开发环境初始化。

**注意：** 远程环境未能执行 `pnpm install` 更新锁文件。首次拉取后请运行上面的 `pnpm install --no-frozen-lockfile`，再提交生成的 `pnpm-lock.yaml`。更新锁文件前，`pnpm install --frozen-lockfile` 可能失败。
