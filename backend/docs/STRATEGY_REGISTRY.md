# Strategy Registry

The Strategy Registry holds JSON files defining the exact deterministic rules for formatting and content strategy, separated by domain (e.g., `youtube/music`).

## Structure
`backend/strategy/registry/<platform>/<domain>/<version>/strategy.json`

## Resolution Priority (Goal Engine)
1. Explicit User Preference
2. Channel Profile
3. Knowledge Pack Recommendation (e.g. Intent = Playlist -> Goal = maximize_retention)
4. Balanced Default
