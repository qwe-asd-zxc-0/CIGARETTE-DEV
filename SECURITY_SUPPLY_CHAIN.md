# 🛡️ 供应链安全检查清单 (Supply Chain Security Checklist)

## 1. 锁定依赖版本 (Dependency Pinning)
- [x] 已在 `package.json` 中移除 `xlsx` 等关键库的 `^` 符号，强制使用固定版本。
- [x] 已创建 `.npmrc` 配置 `save-exact=true`，确保未来安装的新包也会自动锁定版本。

## 2. CI/CD 安全构建
在你的 CI/CD 配置文件（如 GitHub Actions, Vercel, Jenkins）中，**必须** 将安装命令从 `npm install` 改为：

```bash
npm ci
```

- `npm ci` (Clean Install) 会严格按照 `package-lock.json` 安装依赖。
- 如果 `package.json` 和 lock 文件不一致，它会直接报错停止构建，防止意外更新。

## 3. 引入安全审计
建议在 `package.json` 的 `scripts` 中加入安全检查，并在构建前运行：

```json
"scripts": {
  "prebuild": "npm audit --audit-level=high"
}
```

## 4. 危险依赖隔离 (Vendor)
对于像 `xlsx` 这样更新不频繁但风险较高的库，如果担心其被篡改，可以采取 **Vendor (本地化)** 策略：
1. 下载 `xlsx` 的源码或构建产物。
2. 放入项目的 `lib/vendor/xlsx` 目录。
3. 修改 `package.json` 指向本地路径：`"xlsx": "file:./lib/vendor/xlsx"`。
这样黑客就算控制了 npm 仓库，也无法影响你的项目。

## 5. 使用 Socket.dev 或 Snyk
建议安装 GitHub App 如 **Socket Security**。它会监控你的 Pull Request，如果检测到：
- 某个包突然添加了 `install` 脚本（可能在运行恶意代码）。
- 某个包的所有权发生了变更。
- 某个包包含混淆代码或网络请求。
它会直接阻止合并。
