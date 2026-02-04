# 📱 Android Studio & Capacitor 开发适配备忘录

本备忘录用于记录在开发基于 Capacitor 的 WebView 游戏（如 Block Buster）时，解决 10x10 网格对齐、点击精度错位、以及移动端交互失效的关键方案。

---

## 一、 核心操作命令

在修改 Web 端（HTML/CSS/JS）代码后，必须通过以下步骤同步至 Android 工程：

| 命令 | 用途 |
| :--- | :--- |
| `npx cap copy` | **核心常用**。将 Web 代码同步到 Android 项目的 assets 文件夹。 |
| `npx cap sync` | 同步代码的同时更新原生插件配置（修改配置后使用）。 |
| `npx cap open android` | 唤起 Android Studio 并自动打开当前项目。 |

> **⚠️ 重要步骤：** 在 Android Studio 中点击运行（Run）前，建议先执行 **Build -> Clean Project**。这能确保 WebView 加载的是最新同步的资源，防止 CSS 缓存导致样式错位。

---

# 🛠️ Android Studio 环境优化与 C 盘瘦身指南

## 一、 环境变量配置 (Windows)

配置环境变量可以让你在任何目录下使用 `adb` 或 `npx cap` 命令。

### 1. 系统变量设置
1. 打开 **系统属性 -> 环境变量**。
2. **新建系统变量** `ANDROID_HOME`：
   - 变量名：`ANDROID_HOME`
   - 变量值：`D:\Android\Sdk` (指向你实际的 SDK 路径)
3. **编辑 Path 变量**，添加以下四个路径：
   - `%ANDROID_HOME%\platform-tools` (用于 adb 命令)
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`
   - `%ANDROID_HOME%\emulator`

---

## 二、 迁移资源以节省 C 盘空间

Android Studio 默认会将数 GB 的 SDK 和 模拟器镜像存放在 `C:\Users\用户名\AppData\Local`，必须将其迁移。

### 1. 迁移 SDK (核心瘦身)
1. 在 Android Studio 中打开：**Settings -> Languages & Frameworks -> Android SDK**。
2. 点击 **Edit**，选择一个非系统盘目录（如 `D:\Android\Sdk`）。
3. Android Studio 会自动将现有的 SDK 文件移动到新位置。

### 2. 迁移 .gradle 文件夹 (占用巨大)
Gradle 缓存通常占据 5GB+ 空间。
1. 打开 **Settings -> Build, Execution, Deployment -> Gradle**。
2. 修改 **Gradle user home** 为：`D:\Android\.gradle`。

### 3. 迁移 AVD 模拟器镜像
模拟器镜像默认存放在 `C:\Users\用户名\.android\avd`。
1. **设置环境变量**：
   - 新建系统变量：`ANDROID_AVD_HOME`
   - 变量值：`D:\Android\.android\avd`
2. **手动搬运**：将原 C 盘路径下的文件移动到新位置。

---

## 三、 文件默认保存位置修改

### 1. 修改项目默认存放路径
1. 打开 Android Studio。
2. **File -> New -> Project Settings -> Project Structure**。
3. 虽然没有全局的一键修改，但在每次新建项目时，手动将 `Project location` 修改为 `D:\AndroidProjects\...`。Android Studio 会记住上一次的选择。

### 2. 修改 IDE 配置与插件位置 (Idea.properties)
如果 C 盘依然吃紧，可以修改 IDE 自身的缓存路径：
1. 在 Android Studio 安装目录的 `bin` 文件夹下找到 `idea.properties`。
2. 取消以下行的注释并修改路径：
   - `idea.config.path=D:/Android/.AndroidStudio/config`
   - `idea.system.path=D:/Android/.AndroidStudio/system`
   - `idea.plugins.path=D:/Android/.AndroidStudio/plugins`

---

## 四、 常用维护命令

| 命令 | 用途 |
| :--- | :--- |
| `adb devices` | 检查手机/模拟器是否连接成功 |
| `adb logcat` | 查看手机实时运行日志（调试 Webview 报错时极有用） |
| `gradlew clean` | 在 Android Studio 终端运行，清理项目编译缓存 |