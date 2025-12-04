"""词云生成服务"""
import io
import base64
from typing import Optional
from PIL import Image
from wordcloud import WordCloud
import matplotlib
matplotlib.use('Agg')  # 使用非交互式后端

from app.services.analytics import WeChatAnalytics
from app.config import settings


class WeChatWordCloud:
    """微信聊天记录词云生成器"""
    
    def __init__(self):
        self.analytics = WeChatAnalytics()
    
    def generate_wordcloud(
        self,
        documents_path: str,
        user_md5: str,
        table_name: str,
        width: int = 800,
        height: int = 600,
        background_color: str = 'white',
        colormap: str = 'viridis',
        max_words: int = 200,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> str:
        """
        生成词云图片（返回 base64 编码）
        
        Args:
            documents_path: 微信数据目录路径
            user_md5: 用户 MD5
            table_name: 表名
            width: 图片宽度
            height: 图片高度
            background_color: 背景颜色
            colormap: 颜色方案
            max_words: 最大词数
            start_date: 开始日期
            end_date: 结束日期
            
        Returns:
            base64 编码的 PNG 图片
        """
        # 获取词频数据
        word_freq = self.analytics.get_word_frequency(
            documents_path, user_md5, table_name,
            top_n=max_words,
            start_date=start_date,
            end_date=end_date
        )
        
        if not word_freq:
            # 如果没有数据，返回空白图片
            return self._generate_empty_image(width, height)
        
        # 转换为 {word: count} 字典
        word_dict = {item['word']: item['count'] for item in word_freq}
        
        # 创建词云对象
        try:
            wc = WordCloud(
                font_path=settings.wordcloud_font_path,
                width=width,
                height=height,
                background_color=background_color,
                colormap=colormap,
                max_words=max_words,
                relative_scaling=0.5,
                min_font_size=10
            )
            
            # 生成词云
            wc.generate_from_frequencies(word_dict)
            
            # 转换为图片
            image = wc.to_image()
            
            # 转换为 base64
            return self._image_to_base64(image)
        except Exception as e:
            print(f'生成词云失败: {e}')
            # 返回错误提示图片
            return self._generate_error_image(width, height, str(e))
    
    def _image_to_base64(self, image: Image.Image) -> str:
        """将 PIL Image 转换为 base64 字符串"""
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        image_bytes = buffer.getvalue()
        return base64.b64encode(image_bytes).decode('utf-8')
    
    def _generate_empty_image(self, width: int, height: int) -> str:
        """生成空白提示图片"""
        from PIL import ImageDraw, ImageFont
        
        image = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(image)
        
        text = '暂无数据'
        # 尝试使用中文字体，如果失败则使用默认字体
        try:
            font = ImageFont.truetype(settings.wordcloud_font_path, 40)
        except:
            font = ImageFont.load_default()
        
        # 获取文本大小
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # 居中绘制
        x = (width - text_width) / 2
        y = (height - text_height) / 2
        draw.text((x, y), text, fill='gray', font=font)
        
        return self._image_to_base64(image)
    
    def _generate_error_image(self, width: int, height: int, error: str) -> str:
        """生成错误提示图片"""
        from PIL import ImageDraw, ImageFont
        
        image = Image.new('RGB', (width, height), color='white')
        draw = ImageDraw.Draw(image)
        
        text = f'生成失败: {error[:30]}'
        try:
            font = ImageFont.truetype(settings.wordcloud_font_path, 30)
        except:
            font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (width - text_width) / 2
        y = (height - text_height) / 2
        draw.text((x, y), text, fill='red', font=font)
        
        return self._image_to_base64(image)

