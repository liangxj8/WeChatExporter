"""配置管理"""
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置"""
    
    # 服务器配置
    host: str = "0.0.0.0"
    port: int = 3000
    debug: bool = True
    
    # 微信数据路径
    wechat_documents_path: Optional[str] = None
    
    # OpenAI 配置
    openai_api_key: Optional[str] = None
    openai_base_url: str = "https://api.openai.com/v1"
    
    # 词云配置
    wordcloud_font_path: str = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
    wordcloud_width: int = 800
    wordcloud_height: int = 600
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# 全局配置实例
settings = Settings()

