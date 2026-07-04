# Alias Manager

The active AI Pipeline never hardcodes a reference to a specific version (e.g. `Strategy v4`). Instead, the pipeline consumes the pointer `alias: production`. The Alias Manager is the sole entity allowed to update this symlink/JSON pointer, atomically swinging traffic to a newly promoted registry version.
