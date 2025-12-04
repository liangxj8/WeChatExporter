# WeChatExporter 2.0 文档

欢迎来到 WeChatExporter 2.0 的文档中心！

## 📚 文档索引

### 🚀 快速开始
- **[QUICKSTART.md](QUICKSTART.md)** - 快速开始指南
  - 一键安装和启动
  - 使用流程说明
  - 功能介绍
  - 常见问题解答

### 💻 开发文档
- **[DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md)** - Python 后端重写开发总结
  - 技术栈介绍
  - 完整功能列表
  - 代码迁移对照
  - Bug 修复记录
  - 项目结构说明

### 📱 iOS 备份说明
- **[IOS_BACKUP_LIMITATIONS.md](IOS_BACKUP_LIMITATIONS.md)** - iOS 备份的限制和注意事项
  - 如何创建 iTunes/iCloud 备份
  - 找到微信数据路径
  - 备份相关问题解决

## 📖 其他资源

### 项目文档
- [根目录 README.md](../README.md) - 项目总览和功能介绍
- [backend/README.md](../backend/README.md) - Python 后端 API 详细文档
- [scripts/README.md](../scripts/README.md) - 脚本工具说明

### 在线资源
- **API 文档**: http://localhost:3000/docs（启动后端后访问）
- **项目主页**: https://github.com/yourusername/WeChatExporter
- **问题反馈**: https://github.com/yourusername/WeChatExporter/issues

## 🎯 文档导航

### 我是新用户
1. 阅读 [QUICKSTART.md](QUICKSTART.md) 了解如何安装和使用
2. 如果遇到 iOS 备份问题，查看 [IOS_BACKUP_LIMITATIONS.md](IOS_BACKUP_LIMITATIONS.md)
3. 访问 http://localhost:3000/docs 查看 API 文档

### 我是开发者
1. 阅读 [DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md) 了解技术架构
2. 查看 [backend/README.md](../backend/README.md) 了解后端 API
3. 参考 [scripts/README.md](../scripts/README.md) 了解开发工具

### 我想贡献代码
1. Fork 项目仓库
2. 阅读 [DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md) 了解项目结构
3. 提交 Pull Request

## 📝 版本历史

### v2.0.0 (2025-12-04) - Python 重写版本
- ✅ 后端从 Node.js 完全重写为 Python + FastAPI
- ✅ 新增数据分析功能（统计、词云、活跃度）
- ✅ 新增 AI 功能（总结、情感分析、问答）
- ✅ 前端适配新 API，新增数据分析界面
- ✅ 更简单的安装和使用流程
- ✅ 自动生成的 API 文档

### v1.0 - Node.js 版本（已弃用）
- 基于 NW.js 的桌面应用
- Node.js + TypeScript 后端
- 基础聊天记录查看和导出

## 🔗 快速链接

| 类型 | 链接 |
|------|------|
| 快速开始 | [QUICKSTART.md](QUICKSTART.md) |
| 开发总结 | [DEVELOPMENT_SUMMARY.md](DEVELOPMENT_SUMMARY.md) |
| iOS 备份 | [IOS_BACKUP_LIMITATIONS.md](IOS_BACKUP_LIMITATIONS.md) |
| 项目首页 | [../README.md](../README.md) |
| API 文档 | http://localhost:3000/docs |
| 后端文档 | [../backend/README.md](../backend/README.md) |

## 💡 提示

- 使用 `./scripts/setup.sh` 一键安装所有依赖
- 使用 `./scripts/dev.sh` 一键启动前后端
- 访问 http://localhost:3000/docs 查看交互式 API 文档
- 所有功能都可以在 Web 界面中操作，无需命令行

## 🐛 问题反馈

如果遇到问题：
1. 查看 [QUICKSTART.md](QUICKSTART.md) 的常见问题部分
2. 查看 GitHub Issues 是否有相同问题
3. 提交新的 Issue 并附上详细信息

---

**最后更新**: 2025-12-04  
**版本**: 2.0.0  
**技术栈**: Python + FastAPI + React + TypeScript
