# Android 打包与上架指南（Capacitor 8）

> 💡 **不想安装 Android Studio？** 见同目录 **`CLOUD-BUILD.md`**：GitHub Actions / 阿里云效 / Codespaces 等在线构建，网页点一下即可下载 APK（流水线已内置）。

本工程已把网页打包为 **Android 原生工程**（Capacitor），图标、启动屏、隐私政策、国内镜像均已配置。
你只需要一台装了 **Android Studio + JDK 17** 的电脑，即可编译出 APK / AAB。

> 工程位置：`设备检查App/android-app/`（网页源码在 `www/`，安卓工程在 `android/`）

---

## 一、准备环境（一次性）

| 工具 | 版本要求 | 说明 |
|---|---|---|
| JDK | **17 或 21** | Android Studio 自带 JBR 即可；命令行构建需自行安装并配置 `JAVA_HOME` |
| Android Studio | 最新版 | 下载：<https://developer.android.com/studio>（国内可用镜像站） |
| Android SDK | **compileSdk 36**（工程已配） | 首次打开工程时 Studio 会自动提示安装 |
| Node.js | 18+ | 仅修改网页后重新同步时需要 |

命令行方式（可选）：安装 Android command-line tools 后执行
`sdkmanager "platforms;android-36" "build-tools;36.0.0"`。

---

## 二、最快出包：Android Studio 图形化

1. **打开工程**：Android Studio → `File → Open` → 选择 `设备检查App/android-app/android`
2. **等待 Gradle Sync**：首次同步会下载依赖（已配置阿里云/腾讯镜像，国内一般 2~5 分钟）
   - 若卡住：`File → Settings → Build Tools → Gradle` 检查 Gradle JDK 选 17/21
3. **运行到手机**：
   - 手机开启「开发者选项 → USB 调试」，用数据线连接
   - 或 `Tools → Device Manager` 创建模拟器
   - 点工具栏绿色 **Run ▶**，即可看到 App（图标为琥珀「检」字）
4. **出正式包**：菜单 `Build → Generate Signed App Bundle / APK`
   - 选 **APK**（直接分发）或 **AAB**（Google Play / 部分国内商店要求）
   - 创建/选择签名密钥（见下方「四、签名」）→ 选 `release` → Finish
   - 产物：`android/app/build/outputs/apk/release/app-release.apk`

---

## 三、命令行构建（CI / 不用 Studio）

```bash
cd 设备检查App/android-app/android

# 调试包（无需签名，可直接装真机测试）
./gradlew assembleDebug          # Windows: gradlew.bat assembleDebug
# 产物: app/build/outputs/apk/debug/app-debug.apk

# 发布包（需先配好签名，见下）
./gradlew assembleRelease
# 产物: app/build/outputs/apk/release/app-release.apk

# 商店上传包（Google Play / 华为等部分商店）
./gradlew bundleRelease
# 产物: app/build/outputs/bundle/release/app-release.aab
```

---

## 四、发布签名（上架必须，只做一次）

### 1. 生成密钥库
```bash
keytool -genkey -v -keystore equipcheck.keystore \
  -alias equipcheck -keyalg RSA -keysize 2048 -validity 10000
```
按提示填写口令、单位信息（**记住口令并妥善备份 keystore 文件**——丢了就无法更新应用）。

### 2. 配置签名
把 `equipcheck.keystore` 放到 `android-app/android/keystore/`（新建目录）。
签名信息由 `app/build.gradle` 里的 `signingConfigs.release` 读取，支持两种方式：

**方式一：本地 `android/gradle.properties`（不提交代码库）**
```properties
KEYSTORE_FILE=../keystore/equipcheck.keystore
KEYSTORE_PASSWORD=你的密钥库口令
KEY_ALIAS=equipcheck
KEY_PASSWORD=你的密钥口令
```

**方式二：环境变量（CI/云端构建用，如 GitHub Actions Secrets）**
```bash
export KEYSTORE_FILE=../keystore/equipcheck.keystore
export KEYSTORE_PASSWORD=... export KEY_ALIAS=equipcheck
export KEY_PASSWORD=...
./gradlew assembleRelease
```

> ⚠️ 生产环境不要把口令明文提交到代码库；keystore 文件也不要提交（`.gitignore` 已排除）。

---

## 五、上架前必改：应用标识与版本号

编辑 `设备检查App/android-app/capacitor.config.json`：

```json
{
  "appId": "com.yourcompany.equipcheck",     ← 改成自己公司的包名（全局唯一，上架后不可改）
  "appName": "设备检查",                       ← 桌面显示名
  "webDir": "www",
  "android": {
    "versionCode": 1,                          ← 每次上架 +1（整数）
    "versionName": "2.0.0"                     ← 向用户展示的版本号
  }
}
```

改完执行（把网页资源同步进安卓工程）：

```bash
cd 设备检查App/android-app
npm install          # 首次/换电脑时
npx cap sync android
```

---

## 六、网页更新流程（日常迭代）

改动 `设备检查App/` 下的 `index.html / app.css / app.js / privacy.html` 后：

```bash
# 1) 同步到打包工程
cp ../index.html ../app.css ../app.js ../sw.js ../manifest.webmanifest ../privacy.html www/
cp -r ../icons www/

# 2) 同步进安卓工程
npm install && npx cap sync android

# 3) 重新打包（Studio 点 Run，或命令行 ./gradlew assembleRelease）
```

## 七、国内应用商店上架清单

| 事项 | 说明 |
|---|---|
| **开发者账号** | 华为/小米/OPPO/vivo/应用宝等各商店开放平台注册（一般免费，需企业或个人实名） |
| **软件著作权（软著）** | 主流商店基本必备，可网上代办或自行在中国版权保护中心申请（约 30~40 个工作日） |
| **APP 备案（工信部）** | 2023 年起强制。需主体已有 ICP 备案，通过「工业和信息化部 APP 备案系统」提交，审核通过获得备案号；商店会核验 |
| **隐私政策** | 需提供可访问的 URL。本工程已内置 `www/privacy.html`，部署到公司网站即可获得链接；**首次启动隐私弹窗已内置**（应用内首次进入会弹出同意框，符合审核要求） |
| **权限声明** | 本应用仅声明 `INTERNET`，不申请任何敏感权限（相机/定位/通讯录等），审核风险低 |
| **应用截图** | 直接用 `设备检查App/预览/` 里的界面截图（390×844 已符合主流商店要求） |
| **应用图标** | 已生成全套（含自适应图标）；商店上传用 512×512 可直接取 `icons/icon-512.png` |
| **包体要求** | 64 位支持默认开启；targetSdk 36 满足当前主流商店要求 |
| **备案号展示** | 部分商店要求在「设置/关于」里展示备案号——可在 `app.js` 的「关于」卡片内补充一行 |

## 八、可选：热更新（网页放公司服务器）

若希望**不发新版 APK 也能更新页面**，把网页部署到公司 HTTPS 服务器后，
修改 `capacitor.config.json`：

```json
"server": {
  "url": "https://your-company.com/equip/"
}
```

> 注意：`server.url` 模式下应用加载远程网页，需要服务器 HTTPS；隐私政策与备案信息需与实际运营主体一致。
> 默认（不配 url）为**纯离线内置**模式，更适合内网工具。

---

## 九、常见问题

| 问题 | 处理 |
|---|---|
| Gradle 下载慢 / 失败 | 已配置腾讯镜像（`gradle-wrapper.properties`）与阿里云 Maven 镜像；如仍失败，注释里的原始地址可换回 |
| `Unsupported class file major version` | JDK 版本不对，用 JDK 17 或 21 |
| 手机装不上（解析包错误） | 确认 arm/arm64 与系统匹配；真机系统版本 ≥ Android 7（minSdk 24） |
| 页面样式在老手机上异常 | 建议系统 WebView 更新到较新版本（国产 ROM 设置里搜「WebView」） |
| 数据迁移 | App 内「设置 → 导出全部数据」生成 JSON，新设备「导入备份」；与网页版数据格式完全一致 |
| 想改包名/图标 | 包名见「五」；图标重新生成后覆盖 `android/app/src/main/res/mipmap-*` 并 `npx cap sync android` |

---

## 十、验证记录（本工程已自测）

- 网页逻辑 17 项 Node 用例 + 28 项 Chromium 移动端 E2E 全部通过
- Android 工程结构完整：`npx cap add android` 生成，图标 5 密度 × 3 类 + 11 张启动屏已品牌化
- 首次启动隐私确认弹窗已内置（上架合规）；原生环境自动跳过 PWA Service Worker 注册
