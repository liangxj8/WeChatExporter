# WeChatExporter 故障排查指南

## 问题：应用启动但看不到界面

### 症状
- 任务栏有应用图标
- 终端没有致命错误
- 但是看不到应用窗口

### 可能的原因和解决方案

#### 1. 窗口在屏幕外

**解决方案：**
使用 macOS 的窗口管理功能将窗口移回屏幕：
1. 在任务栏点击应用图标激活
2. 按 `Command + Option + F` 进入全屏
3. 退出全屏后窗口会重新定位

或者：
1. 在任务栏点击应用图标
2. 按住 `Option` 键点击应用图标
3. 选择 "显示所有窗口"

#### 2. 首次运行权限问题

**解决方案：**
1. 右键点击 `nwjs/nwjs.app`
2. 选择 "打开"
3. 在弹出的对话框中点击 "打开"
4. 这样会绕过 macOS 的 Gatekeeper 限制

#### 3. 使用正确的启动方式

**推荐启动方式：**

```bash
# 方式 1: 使用脚本（推荐）
./scripts/run.sh

# 方式 2: 使用 open 命令
open -a "./nwjs/nwjs.app" --args "./development"

# 方式 3: 直接执行
./nwjs/nwjs.app/Contents/MacOS/nwjs ./development
```

#### 4. 检查应用是否真的在运行

打开 "活动监视器" (Activity Monitor)，搜索 "nwjs" 或 "WeChatExporter"：
- 如果看到进程但没有窗口，结束进程后重新启动
- 确保只有一个实例在运行

#### 5. 清除应用缓存

有时候应用缓存会导致问题：

```bash
# 删除应用数据
rm -rf ~/Library/Application\ Support/Wechat

# 重新启动
./scripts/run.sh
```

#### 6. 查看控制台日志

启动应用时查看详细日志：

```bash
# 使用调试模式启动
./nwjs/nwjs.app/Contents/MacOS/nwjs ./development --remote-debugging-port=9222
```

然后在浏览器访问 `http://localhost:9222` 查看调试信息。

#### 7. 验证 NW.js 完整性

确保下载了完整的 SDK 版本：

```bash
# 检查关键文件
ls -lh nwjs/nwjs.app/Contents/Frameworks/nwjs\ Framework.framework/Versions/*/libnode.dylib
ls -lh nwjs/nwjs.app/Contents/Frameworks/nwjs\ Framework.framework/Versions/*/libffmpeg.dylib

# 如果缺失，重新配置
./scripts/clean.sh
./scripts/setup.sh
```

#### 8. macOS 安全设置

检查 macOS 安全与隐私设置：
1. 打开 "系统设置" -> "隐私与安全性"
2. 如果看到关于 nwjs.app 的提示，点击 "仍要打开"
3. 重新启动应用

### 常见错误信息

#### Cannot open app.nw
```
ERROR:zip.cc Cannot open 'app.nw': FILE_ERROR_NOT_FOUND
```
**说明：** 这是警告信息，可以忽略。NW.js 会自动从命令行参数指定的目录运行。

#### Failed to load node library
```
FATAL Failed to load node library: libnode.dylib
```
**解决：** 需要使用 SDK 版本，运行 `./scripts/clean.sh && ./scripts/setup.sh`

#### Library not loaded: libffmpeg.dylib
```
Library not loaded: @loader_path/libffmpeg.dylib
```
**解决：** 运行 `./scripts/install-ffmpeg.sh`

### 完全重置

如果以上方法都不行，执行完全重置：

```bash
# 1. 清理所有内容
./scripts/clean.sh

# 2. 删除应用数据
rm -rf ~/Library/Application\ Support/Wechat

# 3. 关闭所有 nwjs 进程（在活动监视器中）

# 4. 重新配置
./scripts/setup.sh

# 5. 重新启动
./scripts/run.sh
```

### 获取帮助

如果问题仍然存在，请：
1. 检查终端完整输出
2. 查看活动监视器中的进程状态
3. 在 GitHub Issues 中报告，附上：
   - macOS 版本
   - 芯片类型（Intel / Apple Silicon）
   - 完整的错误日志
   - 截图（如有）

### 成功启动的标志

正常启动时应该看到：
- 窗口标题：微信备份
- 主界面有两个大按钮：
  - "开始原始数据分析"
  - "显示聊天记录"
- 窗口大小：1200x800
- 有菜单栏和工具栏

---

**提示：** 如果只是想测试应用是否能启动，可以尝试使用开发者工具：

```bash
open -a "./nwjs/nwjs.app" --args "./development" --remote-debugging-port=9222
```

然后访问 http://localhost:9222 查看应用状态。

