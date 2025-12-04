"""微信数据解析服务"""
import os
import re
from pathlib import Path
from typing import Dict, List, Optional

from app.models import UserInfo
from app.utils.crypto import md5


class WeChatParser:
    """微信数据解析器"""
    
    def parse_login_info(self, documents_path: str) -> Dict[str, UserInfo]:
        """
        解析 LoginInfo2.dat 文件，提取微信号和昵称
        
        Args:
            documents_path: 微信数据目录路径
            
        Returns:
            用户信息字典 {md5: UserInfo}
        """
        user_info_map: Dict[str, UserInfo] = {}
        login_info_path = Path(documents_path) / 'LoginInfo2.dat'
        
        if not login_info_path.exists():
            print('LoginInfo2.dat 不存在')
            return user_info_map
        
        try:
            # 以二进制模式读取
            with open(login_info_path, 'rb') as f:
                content = f.read()
            
            # 转换为 latin-1 编码的字符串（保留所有字节）
            content_str = content.decode('latin-1')
            
            # 查找所有 wxid_ 模式的微信号
            wxid_pattern = re.compile(r'(wxid_[a-z0-9]{10,20})')
            matches = wxid_pattern.findall(content_str)
            
            if not matches:
                print('未找到任何微信号')
                return user_info_map
            
            # 去重
            unique_wxids = list(set(matches))
            print(f'LoginInfo2.dat 中找到 {len(unique_wxids)} 个微信号: {unique_wxids}')
            
            # 为每个微信号提取昵称
            for wxid in unique_wxids:
                wxid_index = content_str.find(wxid)
                
                if wxid_index > -1:
                    # 在微信号后面的 100 个字节内查找昵称
                    after_wxid = content_str[wxid_index + len(wxid):wxid_index + len(wxid) + 100]
                    possible_names: List[str] = []
                    current_name = ''
                    
                    # 提取可打印字符串
                    for char in after_wxid:
                        char_code = ord(char)
                        # ASCII 可打印字符或中文字符
                        if (0x20 <= char_code <= 0x7E) or char_code >= 0x4E00:
                            current_name += char
                        else:
                            if 2 <= len(current_name) <= 30:
                                possible_names.append(current_name)
                            current_name = ''
                    
                    # 过滤出最可能的昵称
                    nickname = ''
                    for name in possible_names:
                        trimmed = name.strip()
                        # 排除全大写、纯数字、纯符号的字符串
                        if (trimmed and 
                            not re.match(r'^[A-Z_]+$', trimmed) and
                            not re.match(r'^\+?\d+$', trimmed) and
                            not re.match(r'^[^a-zA-Z0-9\u4e00-\u9fa5]+$', trimmed)):
                            nickname = trimmed
                            break
                    
                    # 计算 MD5
                    wxid_md5 = md5(wxid)
                    user_info_map[wxid_md5] = UserInfo(
                        md5=wxid_md5,
                        wechatId=wxid,
                        nickname=nickname or wxid
                    )
            
            print(f'成功解析 {len(user_info_map)} 个用户信息')
            return user_info_map
        except Exception as e:
            print(f'parseLoginInfo 错误: {e}')
            return user_info_map
    
    def scan_users(self, documents_path: str) -> List[str]:
        """
        扫描 documents 目录，查找所有用户目录
        
        Args:
            documents_path: 微信数据目录路径
            
        Returns:
            用户 MD5 列表
        """
        user_md5s: List[str] = []
        documents_dir = Path(documents_path)
        
        if not documents_dir.exists():
            print(f'微信数据目录不存在: {documents_path}')
            return user_md5s
        
        # 遍历目录
        for item in documents_dir.iterdir():
            if item.is_dir():
                # 检查是否是 32 位 MD5 格式的目录
                if re.match(r'^[a-f0-9]{32}$', item.name, re.IGNORECASE):
                    # 检查是否包含 DB 目录
                    db_path = item / 'DB'
                    if db_path.exists() and db_path.is_dir():
                        user_md5s.append(item.name.lower())
        
        print(f'找到 {len(user_md5s)} 个用户目录')
        return user_md5s
    
    def get_user_avatar(self, documents_path: str, user_md5: str) -> Optional[str]:
        """
        获取用户头像路径
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            
        Returns:
            头像路径，不存在则返回 None
        """
        avatar_path = Path(documents_path) / user_md5 / 'Avatar' / 'lastHeadImage'
        return str(avatar_path) if avatar_path.exists() else None

