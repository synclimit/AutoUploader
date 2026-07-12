import json
import os
from models import UploadTask, Channel

class GenerationContext:
    def __init__(self, prompt: str):
        self.prompt = prompt

    def get_prompt(self) -> str:
        return self.prompt

class ContextBuilder:
    @staticmethod
    def build(task: UploadTask, channel: Channel) -> GenerationContext:
        # 1. Filename (Seed Keyword)
        filename = os.path.basename(task.video_path) if task.video_path else "unknown"
        seed_keyword, _ = os.path.splitext(filename)
        
        # 2. Channel AI Identity (Brand Profile)
        try:
            identity = json.loads(channel.ai_identity) if channel.ai_identity else {}
        except:
            identity = {}
            
        # 3. Upload Defaults
        try:
            defaults = json.loads(channel.upload_defaults) if channel.upload_defaults else {}
        except:
            defaults = {}
            
        # Combine into prompt
        prompt = f"""CHANNEL PROFILE
Name: {channel.channel_name}
Category: {identity.get('channel_category', 'Not specified')}
Brand Description: {identity.get('channel_description', 'Not specified')}
Audience: {identity.get('target_audience', 'Not specified')}
Writing Style: {identity.get('writing_style', 'Not specified')}
Tone: {identity.get('tone', 'Not specified')}
Vocabulary: {identity.get('vocabulary', 'Not specified')}
Avoid Words: {identity.get('avoid_words', 'Not specified')}
CTA: {identity.get('preferred_cta', 'Not specified')}
Primary Keywords: {identity.get('primary_keywords', 'Not specified')}
Secondary Keywords: {identity.get('secondary_keywords', 'Not specified')}
Notes: {identity.get('notes', 'Not specified')}

UPLOAD DEFAULTS
Language: {defaults.get('language', 'Not specified')}
Playlist: {defaults.get('playlist', 'Not specified')}
Category: {defaults.get('category', 'Not specified')}
License: {defaults.get('license', 'Not specified')}
Privacy: {defaults.get('privacy', 'Not specified')}

VIDEO
Filename: {filename}
Extracted Keyword: {seed_keyword}

TASK
Generate:
- SEO Title
- SEO Description
- SEO Tags

Output the result as a raw JSON object with keys: "title", "description", "tags". Do not wrap in markdown code blocks.
"""
        return GenerationContext(prompt=prompt)
