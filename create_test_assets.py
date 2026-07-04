import os
import subprocess

assets_dir = "test_assets"
os.makedirs(assets_dir, exist_ok=True)

videos = [
    {"name": "video_720p_30s.mp4", "duration": 30, "size": "1280x720"},
    {"name": "video_1080p_2m.mp4", "duration": 120, "size": "1920x1080"},
    {"name": "video_4k_5m.mp4", "duration": 300, "size": "3840x2160"}
]

for v in videos:
    filepath = os.path.join(assets_dir, v["name"])
    if not os.path.exists(filepath):
        print(f"Generating {filepath}...")
        # Very fast generation: 1fps, ultrafast preset, testsrc pattern
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi", "-i", f"testsrc=duration={v['duration']}:size={v['size']}:rate=1",
            "-c:v", "libx264", "-preset", "ultrafast", "-crf", "30",
            "-pix_fmt", "yuv420p", filepath
        ]
        subprocess.run(cmd, check=True)
        print(f"Created {filepath}")
    else:
        print(f"{filepath} already exists, skipping.")

print("Test assets generation complete.")
