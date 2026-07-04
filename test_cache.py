import sys
sys.path.insert(0, "./backend")
from prompt_cli import compile_prompt

class Args:
    registry_name = "youtube_metadata_music"

print("--- RUN 1 ---")
compile_prompt(Args())
print("\n--- RUN 2 ---")
compile_prompt(Args())
