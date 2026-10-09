# 在线编译 APK —— 不装 Android Studio 也能出包

如果不想下载 Android Studio（约 1GB+），可以用**云端构建服务**：把工程传上去，网页上点一下，
几分钟后下载 APK。以下按推荐程度排序。

---

## 方案 A：GitHub Actions（推荐 · 免费 · 配置已内置）⭐

> 工程里已写好流水线文件 `android-app/.github/workflows/build-apk.yml`，**零配置可用**。

**免费额度**：公开仓库不限分钟；私有仓库每月 2000 分钟（一次 Android 构建约 3~6 分钟，够打包几百次）。

### 操作步骤（全程网页，10 分钟）
1. **注册/登录 GitHub**（github.com）
2. **新建仓库** → 例如 `equip-check`
3. **上传工程**：把 `设备检查App/android-app/` 整个文件夹打包成 zip，
   在仓库页 `Add file → Upload files` 拖进去（或用 git 推送）。
   > 仓库根目录应能看到 `.github/`、`android/`、`www/`、`package.json`
4. **（可选，上架才需要）配置签名**：仓库 `Settings → Secrets and variables → Actions → New repository secret`，添加 4 个：
   | Name | Value |
   |---|---|
   | `KEYSTORE_BASE64` | keystore 文件的 Base64（生成方法见下） |
   | `KEYSTORE_PASSWORD` | 密钥库口令 |
   | `KEY_ALIAS` | 别名，如 `equipcheck` |
   | `KEY_PASSWORD` | 密钥口令 |
5. **触发构建**：顶部 `Actions` → 选择 `Build Android APK` → **Run workflow**（或直接推送一次代码）
6. **下载 APK**：构建完成（绿勾，约 5 分钟）→ 点进该次运行 → 底部 **Artifacts** → 下载 `设备检查-APK`
   - 配置了签名 → `app-release.apk`（可直接上架/分发）
   - 未配置签名 → `app-debug.apk`（可直接安装测试）

### keystore 生成与 Base64（没有本地 Java？用云电脑/同事电脑跑一次即可）
```bash
keytool -genkey -v -keystore equipcheck.keystore -alias equipcheck \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 equipcheck.keystore      # 输出的长串填到 KEYSTORE_BASE64
```
> ⚠️ keystore 与口令是**应用的身份证**：丢失后无法为同一应用发更新版本，务必离线备份。

---

## 方案 B：阿里云效 Flow（国内推荐 · 不用翻墙 · 基础版免费）

阿里云的 云效 DevOps 平台，内置 **EMAS Android 云构建**，服务器在国内，下载速度快。

1. 注册阿里云账号 → 进入 **云效（devops.aliyun.com）** → 开通基础版（免费）
2. **代码管理（Codeup）** 新建/导入仓库，把 `android-app/` 传上去
3. **流水线（Flow）→ 新建流水线** → 选 **Android 构建模板**（EMAS Android 构建）
4. 关联代码仓库与分支，配置签名信息（keystore 上传到构建配置里）
5. 运行流水线 → 构建产物里下载 **APK/AAB**
6. 免费额度以官网为准（基础版含流水线构建核心能力）

> 其他国内备选：**Gitee（码云）流水线**、腾讯云 CODING（均以官网当前免费额度为准）。

---

## 方案 C：GitHub Codespaces（云端开发机 · 浏览器里的"Android Studio 终端"）

不想配 CI、只想临时出一个包时最省事：

1. 把工程传到 GitHub（同方案 A 步骤 1~3）
2. 仓库页按 `.` 或 `Code → Codespaces → Create codespace`
3. 浏览器里打开终端，执行：
   ```bash
   sudo apt-get update && sudo apt-get install -y openjdk-17-jdk
   export ANDROID_HOME=$HOME/android-sdk
   yes | cmdline-tools/bin/sdkmanager --sdk_root=$ANDROID_HOME "platforms;android-36" "build-tools;36.0.0"
   cd android && ./gradlew assembleDebug
   ```
   （或直接装 GitHub 的 Android 预置环境，实际以镜像内工具为准）
4. `app/build/outputs/apk/debug/app-debug.apk` 右键 → Download

**免费额度**：个人免费版约 60 核心小时/月（1 小时左右出包，够用）。

---

## 方案 D：其他云构建 SaaS

| 平台 | 免费额度（以官网为准） | 特点 |
|---|---|---|
| **GitLab CI/CD** | 私有仓库约 400 分钟/月 | 写 `.gitlab-ci.yml`，用 Android 镜像跑 gradlew |
| **Bitrise** | 约 200 分钟/月 | 可视化工作流，移动端 CI 老牌 |
| **Codemagic** | 开源项目免费 | 对移动构建友好，网页配置简单 |
| **Ionic Appflow** | 按套餐 | Capacitor 官方云构建服务，专为本类工程设计 |

---

## ⚠️ 不推荐：网页版"HTML 转 APK"小工具

网上有不少「上传 HTML 一键生成 APK」的网站（WebIntoApp、AppsGeyser、Gonative 等），
**不建议用于正式上架**：

- **签名不受控**：用他们的 keystore 签名 → 你无法用同一签名发后续更新，且签名主体不是你的公司
- **代码经第三方**：检查数据/网页源码经过他人服务器，存在泄露与被注入广告/SDK 的风险
- **审核风险**：应用商店会核验签名主体、隐私政策与实际行为是否一致，极易被拒

如果只是给同事**临时试装**，可以偶尔用；正式发布请用上面 A/B 方案（自己保管 keystore）。

---

## 上架提醒（无论用哪种方式出包）

1. **先改包名**：`capacitor.config.json` 里 `appId`（如 `com.你的公司.equipcheck`）→ 改完 `npx cap sync android`
   （在线构建的话，改完重新上传对应文件即可；包名上架后不可更改）
2. **versionCode 每次上架 +1**，`versionName` 随版本走
3. 软著 / APP 备案 / 隐私政策 URL 等材料见 `BUILD.md` 第七章
4. 上架截图直接用 `设备检查App/预览/` 里的界面截图
