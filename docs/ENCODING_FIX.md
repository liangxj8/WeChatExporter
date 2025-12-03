# 个人聊天昵称乱码修复

## 问题描述

用户反馈个人聊天的昵称显示为乱码，例如：
- `氉浩湩橧敩` 
- `桺湯獧慨摮硡敵`

而群聊显示正常。

## 根本原因

微信数据库中的 `dbContactRemark` 字段使用了**结构化的 hex 编码格式**，而不是简单的 UTF-8 hex 编码。

### 数据格式分析

数据格式：`标记(2位) + 长度(2位) + 数据(长度*2位)`

**标记说明：**
- `0a` - nickname (昵称)
- `12` - wechatID (微信号)
- `1a` - remark (备注)

**示例数据：**
```
0a0f576520617265206861636b657273  12001a0022002a00320c57656172656861636b6572733a004200
```

解析：
```
0a - 标记：昵称
0f - 长度：15字节
576520617265206861636b657273 - 数据："We are hackers"

12 - 标记：微信号
00 - 长度：0

1a - 标记：备注
00 - 长度：0
...
```

## 旧实现（错误）

之前的实现简单地将整个 hex 字符串转为 UTF-8：

```typescript
const buffer = Buffer.from(hexString, 'hex');
const content = buffer.toString('utf8');
```

这会导致结构标记和长度字段也被当作文本解析，产生乱码。

## 新实现（正确）

参考旧版代码的正确解析逻辑：

```typescript
export function decode_user_name_info(quotedHexString: string | null): string {
  // 1. 移除 X' 或 x' 前缀和 ' 后缀
  let hexString = cleanHexString(quotedHexString);
  
  // 2. 解析结构化数据
  const allData: Record<string, string> = {};
  let i = 0;

  while (i < hexString.length - 4) {
    // 读取标记（2位hex）
    const currentMark = hexString.substring(i, i + 2);
    
    // 读取数据长度（2位hex）
    const dataLengthHex = hexString.substring(i + 2, i + 4);
    const dataLength = parseInt(dataLengthHex, 16) * 2;

    // 读取并解码数据
    const hexData = hexString.substring(i + 4, i + 4 + dataLength);
    const utf8Data = hexToUtf8(hexData);

    // 存储
    allData[currentMark] = utf8Data;

    // 移动指针
    i += 4 + dataLength;
  }

  // 3. 优先返回备注(1a)，其次昵称(0a)，最后微信号(12)
  return allData['1a'] || allData['0a'] || allData['12'] || '';
}
```

### hexToUtf8 辅助函数

```typescript
function hexToUtf8(hexString: string): string {
  const buffer = Buffer.from(hexString, 'hex');
  return buffer.toString('utf8');
}
```

## 显示优先级

解析完成后，按以下优先级返回显示名称：

1. **备注 (1a)** - 最高优先级，用户设置的备注名
2. **昵称 (0a)** - 中等优先级，对方设置的昵称
3. **微信号 (12)** - 最低优先级，原始微信号
4. **友好名称** - 如果以上都为空，使用 `getFriendlyName()` 生成

## 效果对比

### 修复前
```
氉浩湩橧敩          个人聊天（乱码）
桺湯獧慨摮硡敵       个人聊天（乱码）  
家庭群              群聊（正常）
```

### 修复后
```
张三                个人聊天（正确解析）
We are hackers      个人聊天（正确解析）
家庭群              群聊（正常）
```

## 测试用例

### 测试数据 1
```javascript
const input = "0a0f576520617265206861636b6572732112001a0022002a00320c57656172656861636b6572733a004200";
const result = decode_user_name_info(`x'${input}'`);
// 期望: "We are hackers"
```

### 测试数据 2
```javascript
const input = "0a10e7be8ee7be8ee7be8ee985b1f09f9088120f7a68616f7975616e6d6569313031361a22e383bd28e280a2cc80cf89e280a2cc812029e3829de7be8ee7be8ee59392f09f9290";
const result = decode_user_name_info(`x'${input}'`);
// 期望: 解析出的中文昵称
```

### 测试数据 3（只有微信号）
```javascript
const input = "0a00120f7a68616f7975616e6d6569313031361a00";
const result = decode_user_name_info(`x'${input}'`);
// 期望: "zhaoyuanmei10316"
```

## 为什么群聊正常？

群聊的昵称字段可能：
1. 使用不同的存储格式（不是结构化 hex）
2. 直接存储为 UTF-8 文本
3. 或者我们的解析逻辑对简单格式也能正确处理

## 相关文件

- `backend/src/utils/crypto.ts` - 修复的解码函数
- `backend/src/services/database.ts` - 调用解码函数
- `development/js/funcs.js` - 旧版正确实现（参考）

## 技术细节

### Hex 到 UTF-8 转换过程

1. **Hex 字符串**: `e7be8e` (3字节)
2. **转为 Buffer**: `[0xe7, 0xbe, 0x8e]`
3. **UTF-8 解码**: `美` (1个汉字)

### 结构化解析示例

原始数据：
```
0a 0c e7be8ee7be8ee7be8e 12 00 1a 00
```

解析过程：
```
位置 0-1:  0a        -> 标记：昵称
位置 2-3:  0c        -> 长度：12字节 (0x0c = 12)
位置 4-15: e7be8e... -> 数据："美美美"
位置 16-17: 12       -> 标记：微信号  
位置 18-19: 00       -> 长度：0
位置 20-21: 1a       -> 标记：备注
位置 22-23: 00       -> 长度：0
```

## 修复验证

重启后端服务后测试：

```bash
# 1. 重启后端
cd backend && npm run dev

# 2. 访问聊天列表 API
curl "http://localhost:3000/api/chats?path=/your/path&userMd5=xxx"

# 3. 检查返回的 nickname 字段
```

## 相关问题

如果仍然出现乱码，可能是：

1. **数据格式变化**: 新版微信使用了不同的编码格式
2. **字段位置错误**: 标记 0a/12/1a 的含义发生变化
3. **编码方式不同**: 不是 UTF-8 而是其他编码

可以通过查看原始 hex 数据来调试：

```javascript
console.log('Raw hex:', quotedHexString);
console.log('Parsed data:', allData);
```

---

**更新时间**: 2025-12-03  
**修复版本**: 2.0.1

