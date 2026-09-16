# Dokploy 中文版（可切换中英文）

基于官方 Dokploy v0.30.6，内置**运行时中英文切换**：界面默认跟随浏览器语言，可在侧边栏底部或登录页底部一键切换 `English (Official)` / `简体中文`，选择保存在浏览器 localStorage 中。

- 源码保持官方英文原版，中文通过内置字典在浏览器端实时渲染，不影响任何业务逻辑与升级路径
- 覆盖范围：侧边栏导航、登录/注册页、首页、项目页、通用按钮/状态/表单提示、组织与邀请、常见删除确认等高频界面文案（约 350 条字典）；未覆盖的深层设置页保持英文，后续可在字典中继续补充

## 分支说明

| 分支 | 说明 |
|---|---|
| `main` | 英文原版 + 运行时语言切换（推荐，本分支构建镜像） |
| `static-zh` | 静态替换版：源码直接改为中文（无切换能力，仅留档） |

## 如何构建镜像

1. 在 GitHub 创建一个**新仓库**（推荐 public，Actions 免费）或 fork 本项目，例如 `dokploy-zh`
2. 把本目录推上去：

```bash
cd D:\mianban\dokploy-0.30.6
git remote add origin https://github.com/<你的用户名>/dokploy-zh.git
git push -u origin main          # 中文切换版
git push origin static-zh        # 静态中文版（可选）
```

3. 推送后 GitHub Actions 会自动执行 `.github/workflows/build-zh.yml`，构建约 15-25 分钟
4. 构建完成后镜像地址为：

```
ghcr.io/<你的用户名>/dokploy-zh:zh-latest
```

> 私有仓库/私有包需要先 `docker login ghcr.io`；public 仓库的包默认公开，建议在仓库 Packages 设置里把包可见性设为 Public。

## 如何部署

### 方式一：全新安装（直接用中文镜像）

```bash
DOKPLOY_IMAGE=ghcr.io/<你的用户名>/dokploy-zh bash install.sh
```

（install.sh 已支持 `DOKPLOY_IMAGE` 环境变量覆盖官方镜像）

### 方式二：已有官方版，在线切换到中文版（推荐，保留全部数据）

```bash
docker service update --image ghcr.io/<你的用户名>/dokploy-zh:zh-latest dokploy
```

切回官方版：

```bash
docker service update --image dokploy/dokploy:v0.30.6 dokploy
```

数据库、配置、已部署的应用全部保留，只换 UI 程序。

## 语言切换逻辑

- 未手动选择过语言时：浏览器语言为 `zh*` 自动显示中文，否则英文
- 手动切换后：以 localStorage 中 `DOKPLOY_LANG` 为准（按用户/浏览器维度记忆）
- 切换会刷新页面生效；后端返回的错误消息保持英文（仅翻译前端静态文案）

## 维护

- 字典文件：`apps/dokploy/components/shared/i18n-zh/dict.ts`（EN→ZH 键值对，按需补充）
- 翻译引擎：`apps/dokploy/components/shared/i18n-zh/zh-provider.tsx`（MutationObserver 实时翻译）
- 切换开关：`language-toggle.tsx`（侧边栏）、`language-switch-inline.tsx`（登录页）
- 升级官方新版本：用新 tag 源码覆盖后，重新套用本目录 `i18n-zh/` 三个组件 + `_app.tsx`/`side.tsx`/`index.tsx` 的接入点即可
