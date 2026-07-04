import os
import subprocess
import json
from typing import Dict, Any
from .metadata_cache import metadata_cache_instance

class VideoMetadataService:
    @staticmethod
    def getMetadata(video_path: str) -> Dict[str, Any]:
        """
        Retrieves video metadata using ffprobe and os.path.getsize.
        Uses LRU cache to avoid duplicate expensive calls.
        Returns: { size, duration, resolution, bitrate, fps }
        """
        if not video_path or not os.path.exists(video_path):
            return {
                "size": "Unavailable",
                "duration": "Unavailable",
                "resolution": "Unavailable",
                "bitrate": "Unavailable",
                "fps": "Unavailable"
            }

        cached_data = metadata_cache_instance.get(video_path)
        if cached_data:
            return cached_data

        try:
            # Get file size
            size_bytes = os.path.getsize(video_path)
            size_mb = size_bytes / (1024 * 1024)
            size_str = f"{size_mb:.2f} MB"
            if size_mb >= 1000:
                size_str = f"{size_mb / 1024:.2f} GB"

            # Execute ffprobe
            cmd = [
                'ffprobe',
                '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=width,height,duration,r_frame_rate,bit_rate',
                '-show_entries', 'format=duration,bit_rate',
                '-of', 'json',
                video_path
            ]
            
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
            if result.returncode != 0:
                raise RuntimeError(f"ffprobe failed: {result.stderr}")
                
            probe_data = json.loads(result.stdout)
            
            # Parse Duration
            duration_sec = 0.0
            if 'format' in probe_data and 'duration' in probe_data['format']:
                duration_sec = float(probe_data['format']['duration'])
            elif 'streams' in probe_data and len(probe_data['streams']) > 0 and 'duration' in probe_data['streams'][0]:
                duration_sec = float(probe_data['streams'][0]['duration'])
                
            duration_str = VideoMetadataService._format_duration(duration_sec)

            # Parse Resolution & FPS & Bitrate
            resolution = "Unknown"
            fps = "Unknown"
            bitrate_str = "Unknown"
            
            if 'streams' in probe_data and len(probe_data['streams']) > 0:
                stream = probe_data['streams'][0]
                
                # Resolution
                width = stream.get('width', 0)
                height = stream.get('height', 0)
                if width and height:
                    resolution = f"{width}x{height}"
                    
                # FPS
                r_frame_rate = stream.get('r_frame_rate', '0/0')
                if r_frame_rate and '/' in r_frame_rate:
                    num, den = r_frame_rate.split('/')
                    if den != '0':
                        fps_val = float(num) / float(den)
                        fps = f"{fps_val:.2f}"
                        
                # Bitrate (try stream first, then format)
                bitrate_val = stream.get('bit_rate')
                if not bitrate_val and 'format' in probe_data:
                    bitrate_val = probe_data['format'].get('bit_rate')
                    
                if bitrate_val:
                    bitrate_kbps = float(bitrate_val) / 1000
                    bitrate_str = f"{bitrate_kbps:.0f} kbps"

            metadata = {
                "size": size_str,
                "duration": duration_str,
                "resolution": resolution,
                "bitrate": bitrate_str,
                "fps": fps
            }
            
            # Cache the result
            metadata_cache_instance.set(video_path, metadata)
            
            return metadata
            
        except Exception as e:
            # Return fallback on error
            return {
                "size": f"{os.path.getsize(video_path) / (1024*1024):.2f} MB" if os.path.exists(video_path) else "Unavailable",
                "duration": "Error",
                "resolution": "Error",
                "bitrate": "Error",
                "fps": "Error"
            }

    @staticmethod
    def _format_duration(seconds: float) -> str:
        if seconds <= 0:
            return "00:00"
        
        mins, secs = divmod(int(seconds), 60)
        hours, mins = divmod(mins, 60)
        
        if hours > 0:
            return f"{hours:02d}:{mins:02d}:{secs:02d}"
        return f"{mins:02d}:{secs:02d}"
