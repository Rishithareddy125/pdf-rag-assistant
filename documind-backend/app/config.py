from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./documind.db"

    jwt_secret: str = "change-this-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"

    pinecone_api_key: str = ""
    pinecone_index_name: str = "documind-enterprise"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"

    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
