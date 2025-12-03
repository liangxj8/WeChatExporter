# WeChatExporter 安装指南

本文档提供快速安装和运行 WeChatExporter 的方法。

## 快速开始

### 方式一：使用自动化脚本（推荐）

我们提供了自动化脚本来简化安装过程：

#### 1. 配置环境

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

此脚本将自动完成以下操作：
- ✓ 检测系统环境（macOS 版本和架构）
- ✓ 检测并配置 Python（支持 Python 3）
- ✓ 智能下载 NW.js（Intel: v0.40.1，Apple Silicon: v0.80.0 原生版本）
- ✓ 自动更新项目配置文件
- ✓ 安装项目依赖（npm install）
- ✓ 针对对应架构编译 sqlite3 模块

#### 2. 运行应用

```bash
chmod +x scripts/run.sh
./scripts/run.sh
```

### 方式二：手动安装

如果自动化脚本遇到问题，可以按照以下步骤手动安装：

#### 1. 安装前置依赖

**必需软件：**
- Node.js (推荐 v10.16.3 或更高版本)
- Xcode（用于编译 native 模块）

安装 Node.js：
```bash
brew install node
```

#### 2. 下载 NW.js

根据你的 Mac 架构下载对应版本：

**Intel Mac (x64):**
```bash
# 下载
curl -L https://dl.nwjs.io/v0.40.1/nwjs-v0.40.1-osx-x64.zip -o nwjs.zip

# 解压
unzip nwjs.zip

# 移动到项目目录
mv nwjs-v0.40.1-osx-x64 nwjs
```

**Apple Silicon (arm64):**
```bash
# 下载
curl -L https://dl.nwjs.io/v0.80.0/nwjs-v0.80.0-osx-arm64.zip -o nwjs.zip

# 解压
unzip nwjs.zip

# 移动到项目目录
mv nwjs-v0.80.0-osx-arm64 nwjs
```

#### 3. 安装项目依赖

```bash
cd development
npm install
```

#### 4. 配置 sqlite3 模块

项目已包含预编译的 sqlite3 模块，需要将其复制到正确位置：

```bash
# 创建目标目录
mkdir -p development/node_modules/sqlite3/lib/binding/node-webkit-v0.40.1-darwin-x64

# 复制预编译的模块
cp development/framework/node-webkit-v0.40.1-darwin-x64/node_sqlite3.node \
   development/node_modules/sqlite3/lib/binding/node-webkit-v0.40.1-darwin-x64/
```

如果预编译模块不可用，需要手动编译：

```bash
# 1. 安装 Xcode（从 App Store）
# 2. 接受 Xcode 许可协议
sudo xcodebuild -license

# 3. 安装 node-gyp
sudo npm install -g node-gyp

# 4. 编译 sqlite3
cd development
npm install sqlite3 --build-from-source \
  --runtime=node-webkit \
  --target_arch=x64 \
  --target=0.40.1 \
  --registry=https://registry.npm.taobao.org
```

#### 5. 运行应用

```bash
# 如果使用项目内的 NW.js
./nwjs/nwjs.app/Contents/MacOS/nwjs development

# 如果使用系统安装的 nw
nw development
```

## 使用说明

### 准备微信备份数据

1. 使用 iTunes 备份 iPhone（**不要加密备份**）
2. 使用第三方工具（如 iMazing）导出微信的 Documents 文件夹
3. 记住导出的路径，稍后在应用中需要选择此路径

### 运行应用程序

1. 启动 WeChatExporter：
   ```bash
   ./scripts/run.sh
   ```

2. 在应用中：
   - 点击"开始原始数据分析"
   - 选择微信 Documents 文件夹路径
   - 选择要导出的联系人
   - 设置导出目录和日期范围
   - 点击"开始生成数据"

3. 查看导出的聊天记录：
   - 返回主页，点击"显示聊天记录"
   - 选择刚才导出的 output 目录
   - 即可浏览聊天记录

## 目录结构

安装完成后，项目目录结构如下：

```
WeChatExporter/
├── scripts/              # 自动化脚本
│   ├── setup.sh         # 环境配置脚本
│   └── run.sh           # 应用运行脚本
├── nwjs/                # NW.js 运行时（自动下载）
├── development/         # 应用主目录
│   ├── node_modules/   # Node.js 依赖
│   ├── framework/      # 第三方框架和预编译模块
│   ├── js/             # JavaScript 源代码
│   ├── templates/      # HTML 模板
│   └── package.json    # 项目配置
├── INSTALL.md          # 本文档
└── README.md           # 项目说明
```

## 常见问题

### 1. 提示 "未找到 NW.js"

运行环境配置脚本：
```bash
./scripts/setup.sh
```

### 2. sqlite3 模块加载失败

确保已正确复制或编译 sqlite3 模块：
```bash
ls -la development/node_modules/sqlite3/lib/binding/node-webkit-v0.40.1-darwin-x64/node_sqlite3.node
```

如果文件不存在，重新运行配置脚本或手动编译。

### 3. npm install 失败

尝试使用国内镜像：
```bash
npm install --registry=https://registry.npmmirror.com
```

### 3b. Apple Silicon 上 sqlite3 编译失败

确保已安装 Xcode Command Line Tools：
```bash
xcode-select --install
```

如果仍然失败，手动编译（针对 NW.js v0.80.0）：
```bash
cd development
npm install sqlite3@latest --build-from-source \
  --runtime=node-webkit \
  --target_arch=arm64 \
  --target=0.80.0
```

### 4. Xcode 相关错误

如果出现以下错误：
```
xcode-select: error: tool 'xcodebuild' requires Xcode
```

解决方法：
1. 从 App Store 安装 Xcode
2. 接受许可协议：
   ```bash
   sudo xcodebuild -license
   ```
3. 重新运行安装步骤

### 5. 权限问题

如果脚本无法执行，添加执行权限：
```bash
chmod +x scripts/*.sh
```

## 版本兼容性

- **操作系统**: macOS 10.12 或更高版本
- **架构**: Intel (x64) 和 Apple Silicon (arm64) 均原生支持
- **Node.js**: v8.11.3 或更高版本（推荐 v16+）
- **Python**: Python 2.7 或 Python 3.x
- **NW.js**: 
  - Intel Mac: v0.40.1
  - Apple Silicon: v0.80.0（原生 arm64）

### Apple Silicon (M1/M2/M3/M4) 原生支持

- ⚡ **完全原生运行**，无需 Rosetta 2
- ⚡ NW.js v0.80.0 原生 arm64 版本
- ⚡ sqlite3 编译为 arm64 native 版本
- ⚡ 性能更优，功耗更低

## 支持与反馈

如果遇到问题：

1. 查看运行日志：应用右上角 -> 工具 -> 导出运行日志
2. 参考原项目 README.md 中的疑难问题部分
3. 在 GitHub 上提交 Issue

## 卸载

如需卸载，删除以下内容即可：

```bash
# 删除 NW.js
rm -rf nwjs/

# 删除 node_modules（可选）
rm -rf development/node_modules/

# 删除下载的压缩包（如果有）
rm -f nwjs-*.zip
```

---

**提示**: 首次使用建议使用自动化脚本（方式一），它会自动处理大部分配置工作。

