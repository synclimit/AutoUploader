from dotenv import load_dotenv
import os

load_dotenv()

APP_NAME = os.getenv("APP_NAME")
APP_ENV = os.getenv("APP_ENV")

APP_HOST = os.getenv("APP_HOST")
APP_PORT = os.getenv("APP_PORT")

DATABASE_URL = os.getenv("DATABASE_URL")

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = os.getenv("REDIS_PORT")