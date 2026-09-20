# LocatorJS（Next.js 16 / React 19）

本项目使用 `@locator/runtime` 显示 LocatorJS 交互界面，同时在 `next.config.ts` 的
`turbopack.rules` 中针对开发环境的 `*.tsx`、`*.jsx` 文件调用
`@locator/webpack-loader`，将源码位置写入 JSX。**运行库本身不提供源码位置信息。**

## 本地验证（Windows PowerShell）

```powershell
git switch dev
git pull
pnpm install
# 停止正在运行的 Next.js dev 进程后，清理缓存并重新编译
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
pnpm dev
```

在本机开发地址（如 `http://localhost:3000`）打开页面，按住 **Alt**，
移动鼠标到自己编写的组件上，再点击 LocatorJS 标记。
macOS 使用 Option。移动端没有 Alt/Option 键，
请先在桌面浏览器验证源文件定位。

- 只在 `pnpm dev` 中执行源码定位注入，`next build` / `pnpm start` 不注入。
- `next.config.ts` 修改后**必须重启**开发服务器；仅浏览器刷新不会重新读取 loader。
- Next.js 16 默认使用 Turbopack；仅配置 `webpack()` 不会影响 `pnpm dev`。
- 如果可以显示组件标记但无法打开编辑器，请确认安装并配置了 VS Code/Cursor 的 URL 协议处理器。
  Windows 远程浏览器或手机不能直接调用电脑本地编辑器协议。
- 第三方组件（`node_modules`）、SVG、纯服务端内容不保证能定位到你的业务源码；
  优先在 `app/` 和 `components/` 内的 TSX 组件测试。
- 如果开发服务器报出 `@locator/webpack-loader` 的编译错误，请保留完整错误堆栈，
  不要仅关闭 runtime，因为那样会留下「显示 LocatorJS 但找不到源码」的半接入状态。
