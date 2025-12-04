"""数据分析服务"""
from typing import Dict, List, Any, Optional
from datetime import datetime
from collections import Counter
import jieba
import jieba.analyse

from app.services.database import WeChatDatabase


class WeChatAnalytics:
    """微信聊天记录数据分析"""
    
    def __init__(self):
        self.db = WeChatDatabase()
        # 停用词列表（可以扩展）
        self.stop_words = set([
            '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
            '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有',
            '看', '好', '自己', '这', '那', '什么', '吗', '他', '她', '它', '们',
            '啊', '哦', '呢', '吧', '哈', '嗯', '哎', '哟', '嘿', '嘛', '呀'
        ])
    
    def get_chat_statistics(
        self,
        documents_path: str,
        user_md5: str,
        table_name: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        获取聊天统计数据
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            table_name: 表名
            start_date: 开始日期（YYYY-MM-DD）
            end_date: 结束日期（YYYY-MM-DD）
            
        Returns:
            统计数据字典
        """
        # 获取所有消息（不限制数量）
        messages = self.db.get_messages(
            documents_path, user_md5, table_name,
            limit=100000,  # 大数量限制
            offset=0,
            start_date=start_date,
            end_date=end_date
        )
        
        if not messages:
            return {
                'totalMessages': 0,
                'dateRange': {'start': None, 'end': None},
                'messageTypes': {},
                'dailyCount': [],
                'hourlyDistribution': []
            }
        
        # 消息类型统计
        type_counter = Counter()
        # 每日消息数量
        daily_counter = Counter()
        # 每小时分布
        hourly_counter = Counter(range(24))  # 初始化 0-23 小时
        
        # 日期范围
        min_time = float('inf')
        max_time = 0
        
        for msg in messages:
            msg_type = msg.get('Type', 0)
            create_time = msg.get('CreateTime', 0)
            
            # 类型统计
            type_name = self._get_message_type_name(msg_type)
            type_counter[type_name] += 1
            
            # 时间统计
            if create_time:
                min_time = min(min_time, create_time)
                max_time = max(max_time, create_time)
                
                # 日期
                dt = datetime.fromtimestamp(create_time)
                date_str = dt.strftime('%Y-%m-%d')
                daily_counter[date_str] += 1
                
                # 小时
                hourly_counter[dt.hour] += 1
        
        # 构建每日数据（按时间排序）
        daily_data = []
        if daily_counter:
            sorted_dates = sorted(daily_counter.keys())
            for date in sorted_dates:
                daily_data.append({
                    'date': date,
                    'count': daily_counter[date]
                })
        
        # 构建每小时数据
        hourly_data = []
        for hour in range(24):
            hourly_data.append({
                'hour': hour,
                'count': hourly_counter[hour]
            })
        
        return {
            'totalMessages': len(messages),
            'dateRange': {
                'start': datetime.fromtimestamp(min_time).strftime('%Y-%m-%d') if min_time != float('inf') else None,
                'end': datetime.fromtimestamp(max_time).strftime('%Y-%m-%d') if max_time > 0 else None
            },
            'messageTypes': dict(type_counter),
            'dailyCount': daily_data,
            'hourlyDistribution': hourly_data
        }
    
    def get_user_activity(
        self,
        documents_path: str,
        user_md5: str,
        table_name: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        获取用户活跃度分析（主要用于群聊）
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            table_name: 表名
            start_date: 开始日期
            end_date: 结束日期
            
        Returns:
            活跃度数据
        """
        from app.utils.crypto import md5, decode_user_name_info, get_friendly_name
        
        # 获取所有消息
        messages = self.db.get_messages(
            documents_path, user_md5, table_name,
            limit=100000,
            offset=0,
            start_date=start_date,
            end_date=end_date
        )
        
        # 获取联系人信息
        contacts_map = self.db.get_contacts(documents_path, user_md5)
        
        # 统计每个用户的发言次数
        user_counter = Counter()
        
        for msg in messages:
            # 只统计文本消息中的发送者
            if msg.get('Type') == 1 and msg.get('Message'):
                message_text = msg['Message']
                if ':\n' in message_text:
                    parts = message_text.split(':\n', 1)
                    if len(parts) >= 2:
                        sender_id = parts[0].strip()
                        
                        # 解析发送者昵称
                        sender_md5 = md5(sender_id)
                        sender_contact = contacts_map.get(sender_md5)
                        sender_name = ''
                        
                        if sender_contact:
                            sender_name = decode_user_name_info(sender_contact.db_contact_remark)
                        
                        if not sender_name or sender_name == sender_id:
                            sender_name = get_friendly_name(sender_id, '', False)
                        
                        user_counter[sender_name] += 1
        
        # 按发言次数排序
        sorted_users = user_counter.most_common(50)  # 只取前50名
        
        ranking = []
        for rank, (user_name, count) in enumerate(sorted_users, 1):
            ranking.append({
                'rank': rank,
                'userName': user_name,
                'messageCount': count
            })
        
        return {
            'totalUsers': len(user_counter),
            'ranking': ranking
        }
    
    def get_word_frequency(
        self,
        documents_path: str,
        user_md5: str,
        table_name: str,
        top_n: int = 100,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        获取词频统计
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            table_name: 表名
            top_n: 返回前 N 个高频词
            start_date: 开始日期
            end_date: 结束日期
            
        Returns:
            词频列表 [{'word': '词', 'count': 次数}, ...]
        """
        # 获取所有文本消息
        messages = self.db.get_messages(
            documents_path, user_md5, table_name,
            limit=100000,
            offset=0,
            start_date=start_date,
            end_date=end_date
        )
        
        # 提取所有文本内容
        all_text = []
        for msg in messages:
            if msg.get('Type') == 1 and msg.get('Message'):
                text = msg['Message']
                # 如果是群聊消息，去掉发送者部分
                if ':\n' in text:
                    parts = text.split(':\n', 1)
                    if len(parts) >= 2:
                        text = parts[1]
                all_text.append(text)
        
        if not all_text:
            return []
        
        # 合并所有文本
        full_text = ' '.join(all_text)
        
        # 使用 jieba 分词
        words = jieba.lcut(full_text)
        
        # 过滤：去除停用词、单字、数字、标点
        filtered_words = []
        for word in words:
            word = word.strip()
            if (len(word) >= 2 and 
                word not in self.stop_words and
                not word.isdigit() and
                word.isalnum()):
                filtered_words.append(word)
        
        # 统计词频
        word_counter = Counter(filtered_words)
        
        # 返回前 N 个
        result = []
        for word, count in word_counter.most_common(top_n):
            result.append({
                'word': word,
                'count': count
            })
        
        return result
    
    def _get_message_type_name(self, msg_type: int) -> str:
        """获取消息类型名称"""
        type_map = {
            1: '文本',
            3: '图片',
            34: '语音',
            43: '视频',
            47: '表情',
            48: '位置',
            49: '链接/文件',
            10000: '系统消息'
        }
        return type_map.get(msg_type, f'其他({msg_type})')

