# 新版微信数据库结构变化

## 概述

新版微信（iOS）的数据结构发生了重大变化，本文档记录了这些变化和对应的适配方案。

## 主要变化

### 1. 配置文件变化

| 旧版 | 新版 | 说明 |
|------|------|------|
| `mmsetting.archive` | `mmsettingext.archive` | 配置文件更名，且**不再包含用户昵称和微信号** |
| 包含用户信息 | 仅包含设置信息 | 新版文件只有应用设置，无个人信息 |

### 2. 数据库文件结构变化

#### 旧版结构
```
{userMd5}/DB/
├── MM.sqlite              # 所有聊天记录都在这里
│   ├── Chat_{md5}        # 每个联系人一个表
│   ├── Friend            # 联系人信息
│   └── ...
└── WCDB_Contact.sqlite    # 联系人详细信息
```

#### 新版结构
```
{userMd5}/DB/
├── MM.sqlite              # 基础信息（Friend表为空！）
├── message_1.sqlite       # 聊天记录分片 1
│   └── Chat_{md5}
├── message_2.sqlite       # 聊天记录分片 2
│   └── Chat_{md5}
├── message_3.sqlite       # 聊天记录分片 3
│   └── Chat_{md5}
├── message_4.sqlite       # 聊天记录分片 4
│   └── Chat_{md5}
└── WCDB_Contact.sqlite    # 联系人详细信息
```

### 3. 头像资源

新版微信在用户目录根目录下有 `lastHeadImage` 文件（JPEG 格式，500x500），可用作当前用户头像。

## 适配方案

### 用户信息获取

由于无法从配置文件获取用户信息，采用以下策略：

1. **昵称**：使用默认值"微信用户"
2. **头像**：使用 `lastHeadImage` 文件（如果存在）
3. **微信号**：留空

用户可以在导出后手动修改这些信息。

### 聊天记录查询

需要修改代码以支持多数据库查询：

```javascript
// 旧版：只查询 MM.sqlite
var db = new sqlite3.Database(MM.sqlite);

// 新版：需要查询所有 message_*.sqlite
var databases = [
    'MM.sqlite',
    'message_1.sqlite',
    'message_2.sqlite',
    'message_3.sqlite',
    'message_4.sqlite'
];
```

### 兼容性

代码需要同时支持旧版和新版结构：

1. 优先尝试旧版文件和表结构
2. 如果失败，尝试新版多数据库结构
3. 合并所有数据库中的聊天表列表

## 测试结果

✅ 成功识别 4 个新版微信用户目录  
✅ 成功使用默认昵称  
✅ 成功使用 lastHeadImage 作为头像  
✅ 数据库文件完整且可访问  
✅ 在 message_*.sqlite 中找到 Chat_ 表

## 后续工作

需要修改以下文件：

- `development/js/controller/chatList.js` - 支持多数据库查询
- `development/js/controller.js` - 更新数据导出逻辑

## 参考信息

测试环境：
- macOS Sequoia 15.0
- 微信 iOS 备份数据（2024年12月）
- 4 个用户目录，所有数据库使用新版结构

