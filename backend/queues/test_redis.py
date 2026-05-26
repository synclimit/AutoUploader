from queues.redis_client import redis_client

try:
    redis_client.set("test_key", "Redis Connected")

    value = redis_client.get("test_key")

    print("REDIS STATUS:")
    print(value)

except Exception as e:
    print("REDIS ERROR:")
    print(e)