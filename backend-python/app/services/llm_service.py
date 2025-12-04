"""大模型服务"""
from typing import Optional, List, Dict, Any
from openai import OpenAI

from app.config import settings
from app.services.database import WeChatDatabase


class LLMService:
    """大模型服务（基于 OpenAI API）"""
    
    def __init__(self):
        self.db = WeChatDatabase()
        self.client: Optional[OpenAI] = None
        
        # 初始化 OpenAI 客户端
        if settings.openai_api_key:
            self.client = OpenAI(
                api_key=settings.openai_api_key,
                base_url=settings.openai_base_url
            )
    
    def _check_client(self):
        """检查客户端是否已初始化"""
        if not self.client:
            raise ValueError("OpenAI API Key 未配置，请在 .env 文件中设置 OPENAI_API_KEY")
    
    def _get_messages_text(
        self,
        documents_path: str,
        user_md5: str,
        table_name: str,
        limit: int = 1000,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[str]:
        """
        获取消息文本列表
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            table_name: 表名
            limit: 限制数量
            start_date: 开始日期
            end_date: 结束日期
            
        Returns:
            消息文本列表
        """
        messages = self.db.get_messages(
            documents_path, user_md5, table_name,
            limit=limit, offset=0,
            start_date=start_date, end_date=end_date
        )
        
        text_messages = []
        for msg in messages:
            if msg.get('Type') == 1 and msg.get('Message'):
                text = msg['Message']
                # 如果是群聊消息，去掉发送者部分
                if ':\n' in text:
                    parts = text.split(':\n', 1)
                    if len(parts) >= 2:
                        text = parts[1]
                text_messages.append(text)
        
        return text_messages
    
    def summarize_chat(
        self,
        documents_path: str,
        user_md5: str,
        table_name: str,
        limit: int = 1000,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        总结聊天内容
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            table_name: 表名
            limit: 限制数量
            start_date: 开始日期
            end_date: 结束日期
            
        Returns:
            总结结果 {'summary': '总结内容', 'topics': ['话题1', '话题2']}
        """
        self._check_client()
        
        # 获取消息文本
        messages = self._get_messages_text(
            documents_path, user_md5, table_name, limit, start_date, end_date
        )
        
        if not messages:
            return {
                'summary': '暂无消息内容',
                'topics': []
            }
        
        # 合并消息（限制长度）
        combined_text = '\n'.join(messages[:500])  # 最多取 500 条
        if len(combined_text) > 10000:
            combined_text = combined_text[:10000] + '...'
        
        # 构建 prompt
        prompt = f"""请分析以下微信聊天记录，提供：
1. 简要总结（100-200字）
2. 主要讨论的话题（3-5个关键词）

聊天记录：
{combined_text}

请用 JSON 格式回答：
{{
  "summary": "总结内容",
  "topics": ["话题1", "话题2", "话题3"]
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "你是一个专业的聊天记录分析助手。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            result_text = response.choices[0].message.content
            
            # 尝试解析 JSON
            import json
            try:
                result = json.loads(result_text)
                return result
            except:
                # 如果解析失败，返回原始文本
                return {
                    'summary': result_text,
                    'topics': []
                }
        except Exception as e:
            print(f'调用 LLM 失败: {e}')
            raise
    
    def sentiment_analysis(
        self,
        documents_path: str,
        user_md5: str,
        table_name: str,
        limit: int = 1000,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        情感分析
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            table_name: 表名
            limit: 限制数量
            start_date: 开始日期
            end_date: 结束日期
            
        Returns:
            情感分析结果 {'sentiment': 'positive/neutral/negative', 'score': 0.8, 'description': '描述'}
        """
        self._check_client()
        
        # 获取消息文本
        messages = self._get_messages_text(
            documents_path, user_md5, table_name, limit, start_date, end_date
        )
        
        if not messages:
            return {
                'sentiment': 'neutral',
                'score': 0.5,
                'description': '暂无消息内容'
            }
        
        # 合并消息（限制长度）
        combined_text = '\n'.join(messages[:300])
        if len(combined_text) > 8000:
            combined_text = combined_text[:8000] + '...'
        
        # 构建 prompt
        prompt = f"""请分析以下微信聊天记录的整体情感倾向：

聊天记录：
{combined_text}

请用 JSON 格式回答：
{{
  "sentiment": "positive/neutral/negative",
  "score": 0.0-1.0,
  "description": "简要描述情感特点"
}}
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "你是一个专业的情感分析助手。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                max_tokens=300
            )
            
            result_text = response.choices[0].message.content
            
            # 尝试解析 JSON
            import json
            try:
                result = json.loads(result_text)
                return result
            except:
                return {
                    'sentiment': 'neutral',
                    'score': 0.5,
                    'description': result_text
                }
        except Exception as e:
            print(f'调用 LLM 失败: {e}')
            raise
    
    def qa_chat_history(
        self,
        documents_path: str,
        user_md5: str,
        table_name: str,
        question: str,
        limit: int = 1000,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> str:
        """
        基于聊天历史的问答
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            table_name: 表名
            question: 用户问题
            limit: 限制数量
            start_date: 开始日期
            end_date: 结束日期
            
        Returns:
            回答内容
        """
        self._check_client()
        
        # 获取消息文本
        messages = self._get_messages_text(
            documents_path, user_md5, table_name, limit, start_date, end_date
        )
        
        if not messages:
            return '暂无聊天记录，无法回答问题。'
        
        # 合并消息（限制长度）
        combined_text = '\n'.join(messages[:500])
        if len(combined_text) > 10000:
            combined_text = combined_text[:10000] + '...'
        
        # 构建 prompt
        prompt = f"""基于以下微信聊天记录，回答用户的问题。如果聊天记录中没有相关信息，请如实说明。

聊天记录：
{combined_text}

用户问题：{question}

请简洁回答：
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "你是一个专业的聊天记录问答助手，基于提供的聊天记录回答问题。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            return response.choices[0].message.content
        except Exception as e:
            print(f'调用 LLM 失败: {e}')
            raise

