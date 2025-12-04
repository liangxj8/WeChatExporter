"""加密和编码工具函数"""
import hashlib
from typing import Optional


def md5(text: str) -> str:
    """
    计算字符串的 MD5 哈希值
    
    Args:
        text: 输入字符串
        
    Returns:
        32 位小写 MD5 十六进制字符串
    """
    return hashlib.md5(text.encode('utf-8')).hexdigest()


def hex_to_utf8(hex_string: str) -> str:
    """
    将 hex 字符串转换为 UTF-8 字符串
    
    Args:
        hex_string: 十六进制字符串
        
    Returns:
        UTF-8 解码后的字符串
    """
    if not hex_string or len(hex_string) == 0:
        return ''
    
    try:
        byte_data = bytes.fromhex(hex_string)
        return byte_data.decode('utf-8')
    except Exception:
        return ''


def decode_user_name_info(quoted_hex_string: Optional[str]) -> str:
    """
    解析结构化的用户信息 hex 字符串
    
    格式：标记(2位) + 长度(2位) + 数据(长度*2位)
    标记说明：
        0a - nickname (昵称)
        12 - wechatID (微信号)
        1a - remark (备注)
    
    Args:
        quoted_hex_string: 带引号的 hex 字符串，如 x'0a0568656c6c6f'
        
    Returns:
        解析出的用户名称（优先级：备注 > 昵称 > 微信号）
    """
    if not quoted_hex_string:
        return ''
    
    try:
        # 移除 X' 或 x' 前缀和 ' 后缀
        hex_string = quoted_hex_string.strip()
        if hex_string.lower().startswith("x'"):
            hex_string = hex_string[2:]
        if hex_string.endswith("'"):
            hex_string = hex_string[:-1]
        
        # 解析结构化数据
        all_data = {}
        i = 0
        
        while i < len(hex_string) - 4:
            # 读取标记（2位hex）
            current_mark = hex_string[i:i+2]
            
            # 读取数据长度（2位hex）
            data_length_hex = hex_string[i+2:i+4]
            data_length = int(data_length_hex, 16) * 2  # hex转dec，再乘2因为是hex字符串
            
            if data_length <= 0 or i + 4 + data_length > len(hex_string):
                break  # 数据长度异常，退出
            
            # 读取数据
            hex_data = hex_string[i+4:i+4+data_length]
            utf8_data = hex_to_utf8(hex_data)
            
            # 存储
            all_data[current_mark] = utf8_data
            
            # 移动指针
            i += 4 + data_length
        
        # 优先返回备注(1a)，其次昵称(0a)，最后微信号(12)
        if '1a' in all_data and all_data['1a'].strip():
            return all_data['1a'].strip()
        if '0a' in all_data and all_data['0a'].strip():
            return all_data['0a'].strip()
        if '12' in all_data and all_data['12'].strip():
            return all_data['12'].strip()
        
        return ''
    except Exception as e:
        print(f'decode_user_name_info error: {e}')
        return ''


def get_friendly_name(wechat_id: str, nickname: str, is_group: bool) -> str:
    """
    生成友好的显示名称
    
    Args:
        wechat_id: 微信 ID
        nickname: 昵称
        is_group: 是否为群聊
        
    Returns:
        友好的显示名称
    """
    # 如果有昵称且不是 wxid 格式，直接使用
    if nickname and not nickname.startswith('wxid_') and nickname != wechat_id:
        return nickname
    
    # 生成友好名称
    prefix = '群聊' if is_group else '联系人'
    
    # 如果是 wxid 格式，提取一部分作为标识
    if wechat_id.startswith('wxid_'):
        id_part = wechat_id[5:13]  # wxid_ 后面取8位
        return f'{prefix}-{id_part}'
    
    # 如果是群聊 ID (@chatroom 结尾)
    if '@chatroom' in wechat_id:
        id_part = wechat_id[:8]
        return f'{prefix}-{id_part}'
    
    # 其他格式，直接取前8位
    id_part = wechat_id[:8]
    return f'{prefix}-{id_part}'

