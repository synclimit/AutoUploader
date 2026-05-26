from database.db import engine
from sqlalchemy import text

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("DATABASE CONNECTED")

except Exception as e:
    print("DATABASE ERROR:")
    print(e)