from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./documind.db"

    jwt_secret: str = "change-this-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    voyage_api_key: str = ""
    voyage_model: str = "voyage-3"

    pinecone_api_key: str = ""
    pinecone_index_name: str = "documind-enterprise"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"

    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
