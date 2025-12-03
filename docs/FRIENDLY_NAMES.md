# 友好名称显示优化

## 问题

之前的版本在聊天列表中直接显示 `wxid_xxx` 这样的原始微信号，非常不友好，难以辨别具体是哪个联系人。

## 解决方案

### 1. 改进昵称解析算法

**位置**: `backend/src/utils/crypto.ts` 的 `decode_user_name_info` 函数

**改进点**:
- ✅ 支持多种字符编码（UTF-8、UTF-16LE、ASCII）
- ✅ 更智能的字符串提取（支持中文、英文、数字、常见符号）
- ✅ 更严格的过滤条件（长度、格式、内容）
- ✅ 优先选择包含中文的昵称
- ✅ 排序选择最合适的昵称

### 2. 添加友好名称生成器

**新增函数**: `getFriendlyName(wechatId, nickname, isGroup)`

**显示规则**:

| 场景 | 原始显示 | 新显示 |
|------|----------|--------|
| 有真实昵称 | `wxid_abc123` | `张三` |
| 无昵称（普通） | `wxid_abc123def` | `联系人-abc123de` |
| 无昵称（群聊） | `xxx@chatroom` | `群聊-xxx` |
| 特殊 ID | `gh_xxx` | `联系人-gh_xxx` |

### 3. 在聊天表查询中应用

**位置**: `backend/src/services/database.ts` 的 `getChatTables` 方法

**逻辑流程**:
```typescript
1. 从联系人数据库获取联系人信息
2. 尝试解析 dbContactRemark 字段获取昵称
3. 如果解析失败或昵称就是 wxid，使用友好名称生成器
4. 根据是否群聊选择不同的前缀
```

## 效果对比

### 之前
```
wxid_abc123defgh  (150条消息)
wxid_xyz789mnop   (320条消息)
12345678@chatroom (1200条消息)
```

### 现在
```
张三              (150条消息)
联系人-xyz789mn   (320条消息)
群聊-12345678     (1200条消息)
```

或者如果能解析到昵称：
```
张三              (150条消息)
李四工作群        (320条消息)
家庭群            (1200条消息)
```

## 技术细节

### 昵称解析优先级

1. **最高优先级**: 解析出的包含中文的昵称
2. **中等优先级**: 解析出的英文/数字昵称
3. **最低优先级**: 生成的友好名称（联系人-xxx 或 群聊-xxx）

### 过滤规则

解析出的字符串需要满足以下条件才会被认为是有效昵称：
- ✅ 长度在 2-30 个字符之间
- ✅ 不是纯符号（如 `_____`）
- ✅ 不是纯数字（如 `123456`）
- ✅ 不是全大写长串（如 `TYPING_INTERVAL`）

### 友好名称格式

```typescript
// 普通联系人
wxid_abc123def  → 联系人-abc123de  (取 wxid_ 后8位)

// 群聊
12345678@chatroom → 群聊-12345678  (取 @ 前8位)

// 其他格式
gh_xxx123 → 联系人-gh_xxx12  (取前8位)
```

## 使用示例

### API 响应

**GET `/api/chats?path=...&userMd5=...`**

```json
{
  "success": true,
  "data": [
    {
      "tableName": "Chat_abc123def",
      "messageCount": 150,
      "contact": {
        "md5": "abc123def...",
        "wechatId": "wxid_abc123def",
        "nickname": "张三",        // 解析成功的昵称
        "isGroup": false
      }
    },
    {
      "tableName": "Chat_xyz789mnop",
      "messageCount": 320,
      "contact": {
        "md5": "xyz789mnop...",
        "wechatId": "wxid_xyz789mnop",
        "nickname": "联系人-xyz789mn",  // 生成的友好名称
        "isGroup": false
      }
    },
    {
      "tableName": "Chat_12345678",
      "messageCount": 1200,
      "contact": {
        "md5": "12345678...",
        "wechatId": "12345678@chatroom",
        "nickname": "群聊-12345678",    // 群聊的友好名称
        "isGroup": true
      }
    }
  ]
}
```

### 前端显示

React 组件会直接使用 `chat.contact.nickname` 字段，无需额外处理：

```tsx
<List.Item.Meta
  title={
    <span>
      {chat.contact.nickname}  {/* 直接显示友好名称 */}
      {chat.contact.isGroup && <Tag color="blue">群聊</Tag>}
    </span>
  }
  description={`${chat.contact.wechatId} · ${chat.messageCount} 条消息`}
/>
```

## 测试

### 测试场景

1. **有真实昵称**: 应该显示解析出的中文/英文昵称
2. **无昵称但有联系人**: 应该显示 `联系人-xxx`
3. **群聊**: 应该显示 `群聊-xxx` 和蓝色标签
4. **特殊格式 ID**: 应该正确处理并生成友好名称

### 测试方法

```bash
# 启动后端
cd backend && npm run dev

# 测试 API
curl "http://localhost:3000/api/chats?path=/Users/hankin/Downloads/Documents&userMd5=YOUR_USER_MD5"

# 查看返回的 nickname 字段是否友好
```

## 未来改进

可能的优化方向：

1. **从群公告获取群名**: 解析群聊的公告信息获取真实群名
2. **从聊天记录推断**: 通过最后几条消息推断可能的昵称
3. **用户自定义**: 允许用户手动设置昵称
4. **缓存昵称**: 缓存解析结果，提高性能

## 相关文件

- `backend/src/utils/crypto.ts` - 昵称解析和友好名称生成
- `backend/src/services/database.ts` - 应用友好名称逻辑
- `frontend/src/pages/ChatListPage.tsx` - 前端显示

---

更新日期: 2025-12-03

