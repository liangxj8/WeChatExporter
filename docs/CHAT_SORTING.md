# 聊天列表排序功能

## 功能概述

实现了类似微信的聊天列表展示逻辑：
1. ✅ 按最后消息时间倒序排列（最新的在上面）
2. ✅ 显示最后消息预览
3. ✅ 智能的时间显示格式

## 排序规则

### 优先级

```
按最后消息时间倒序（lastMessageTime DESC）
最近聊天的会话自动排在最前面
```

## 关于手机端置顶

⚠️ **微信 iOS 备份数据中不包含置顶状态**

经过数据库分析，发现：
- 置顶信息可能存储在本地缓存或加密的 BLOB 字段中
- iTunes/iCloud 备份不包含这些数据
- 因此无法读取手机端的真实置顶状态

**当前方案**: 按最后消息时间排序，最近聊天的自然排在前面，符合大多数使用场景。

### 示例

```
[置顶] 重要客户          刚刚         [消息]
[置顶] 项目群            10:30        李四: 好的
─────────────────────────────────────────
张三                     昨天         [图片]
工作群                   周三         王五: 明天见
老朋友                   12月1日      收到
```

## 技术实现

### 1. 后端实现

**文件**: `backend/src/services/database.ts`

#### 获取最后消息信息

```typescript
// 查询最后一条消息
const lastMsgResults = db.exec(`
  SELECT createTime, message, messageType 
  FROM "${tableName}" 
  ORDER BY createTime DESC 
  LIMIT 1
`);

// 提取时间和预览
lastMessageTime = lastMsg[0] as number;
lastMessagePreview = generatePreview(message, messageType);
```

#### 消息类型预览

| 类型 | messageType | 显示 |
|------|-------------|------|
| 文本 | 1 | 实际内容（前30字）|
| 图片 | 3 | [图片] |
| 语音 | 34 | [语音] |
| 视频 | 43 | [视频] |
| 表情 | 47 | [表情] |
| 链接 | 49 | [链接] |
| 其他 | - | [消息] |

#### 排序逻辑

```typescript
chatTables.sort((a, b) => {
  // 1. 置顶优先
  if (a.isPinned && !b.isPinned) return -1;
  if (!a.isPinned && b.isPinned) return 1;
  
  // 2. 时间倒序
  return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
});
```

### 2. 前端实现

**文件**: `frontend/src/pages/ChatListPage.tsx`

#### 时间格式化

根据时间距离现在的远近，显示不同格式：

```typescript
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  
  // 今天：10:30
  if (isToday(date)) {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // 昨天：昨天
  if (isYesterday(date)) {
    return '昨天';
  }
  
  // 本周：周三
  if (isThisWeek(date)) {
    return weekdays[date.getDay()];
  }
  
  // 本年：12月3日
  if (isThisYear(date)) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  
  // 更早：2023年12月3日
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};
```

#### 列表项显示

```tsx
<List.Item.Meta
  title={
    <Space>
      {/* 置顶图标 */}
      {chat.isPinned && <PushpinFilled style={{ color: '#faad14' }} />}
      
      {/* 昵称 */}
      <span>{chat.contact.nickname}</span>
      
      {/* 群聊标签 */}
      {chat.contact.isGroup && <Tag color="blue">群聊</Tag>}
    </Space>
  }
  description={
    <Space direction="vertical" size={0}>
      {/* 最后消息预览 */}
      <span style={{ color: '#999' }}>
        {chat.lastMessagePreview || '暂无消息'}
      </span>
      
      {/* 时间和消息数量 */}
      <Space>
        <ClockCircleOutlined />
        <span>{formatTime(chat.lastMessageTime)}</span>
        <span>·</span>
        <span>{chat.messageCount} 条消息</span>
      </Space>
    </Space>
  }
/>
```

#### 置顶功能

```typescript
const togglePin = (chat: ChatTable) => {
  // 1. 更新置顶状态
  const newIsPinned = !chat.isPinned;
  
  // 2. 更新本地状态
  setChats(prevChats => {
    const updated = prevChats.map(c =>
      c.tableName === chat.tableName ? { ...c, isPinned: newIsPinned } : c
    );
    
    // 3. 重新排序
    return sortChats(updated);
  });
  
  // 4. 提示用户
  message.success(newIsPinned ? '已置顶' : '已取消置顶');
};
```

## UI 设计

### 列表项布局

```
┌─────────────────────────────────────────────────┐
│ 📌 张三 [群聊]                       [置顶] [导出HTML] [导出JSON] │
│ [图片]                                           │
│ 🕐 昨天 · 150 条消息                             │
└─────────────────────────────────────────────────┘
```

### 颜色和图标

- **置顶图标**: 📌 黄色 (#faad14)
- **时钟图标**: 🕐 灰色
- **群聊标签**: 蓝色
- **消息预览**: 灰色，小字号

### 交互

1. **点击置顶按钮**: 切换置顶状态，列表自动重新排序
2. **点击导出按钮**: 导出聊天记录
3. **搜索**: 实时过滤，但保持排序规则

## 数据结构

### ChatTable 接口

```typescript
export interface ChatTable {
  tableName: string;          // 数据库表名
  messageCount: number;        // 消息总数
  contact: {
    md5: string;
    wechatId: string;
    nickname: string;
    isGroup: boolean;
  };
  lastMessageTime?: number;    // 最后消息时间戳（秒）
  isPinned?: boolean;          // 是否置顶
  lastMessagePreview?: string; // 最后消息预览
}
```

### API 响应示例

```json
{
  "success": true,
  "data": [
    {
      "tableName": "Chat_abc123",
      "messageCount": 150,
      "contact": {
        "md5": "abc123...",
        "wechatId": "wxid_abc123",
        "nickname": "张三",
        "isGroup": false
      },
      "lastMessageTime": 1701590400,
      "isPinned": true,
      "lastMessagePreview": "明天见"
    },
    {
      "tableName": "Chat_xyz789",
      "messageCount": 1200,
      "contact": {
        "md5": "xyz789...",
        "wechatId": "12345678@chatroom",
        "nickname": "项目群",
        "isGroup": true
      },
      "lastMessageTime": 1701580000,
      "isPinned": false,
      "lastMessagePreview": "李四: 好的"
    }
  ]
}
```

## 性能考虑

### 数据库查询

为了获取最后消息，需要对每个聊天表执行额外查询：

```sql
SELECT createTime, message, messageType 
FROM "Chat_xxx" 
ORDER BY createTime DESC 
LIMIT 1
```

**优化建议**:
- ✅ 使用 `LIMIT 1` 只取一条
- ✅ `createTime` 字段应该有索引
- ⚠️ 如果聊天数量很多（>100），可能需要缓存

### 前端排序

- ✅ 只在需要时重新排序（置顶切换、搜索）
- ✅ 使用 `useState` 缓存排序结果
- ✅ 搜索时保持排序规则

## 未来改进

1. **持久化置顶**: 将置顶状态保存到本地存储或数据库
2. **批量操作**: 支持批量置顶/取消置顶
3. **分组显示**: 置顶、今天、昨天、更早
4. **未读消息**: 显示未读消息数量（红点）
5. **草稿功能**: 显示未发送的草稿消息
6. **搜索历史**: 保存搜索记录

## 相关文件

- `backend/src/types/index.ts` - 类型定义
- `backend/src/services/database.ts` - 后端逻辑
- `frontend/src/types/index.ts` - 前端类型
- `frontend/src/pages/ChatListPage.tsx` - 前端界面

## 测试

### 测试场景

1. ✅ 默认按时间倒序排列
2. ✅ 置顶的聊天显示在最前面
3. ✅ 置顶内部也按时间排序
4. ✅ 切换置顶状态，列表自动重新排序
5. ✅ 搜索时保持排序规则
6. ✅ 时间显示格式正确

### 测试方法

```bash
# 1. 启动服务
./scripts/dev.sh

# 2. 打开浏览器
# 3. 选择一个用户
# 4. 查看聊天列表
# 5. 点击"置顶"按钮
# 6. 验证列表重新排序
# 7. 使用搜索功能
# 8. 验证时间格式
```

---

**更新时间**: 2025-12-03  
**版本**: 2.0.2

