# Analytics Cache Design

## Multi-Level LRU Cache
Uses python `OrderedDict` for LRU eviction policies.

## Cache Limits & TTL
- **Analytics**: 100 max channels. TTL 600s.
- **Charts**: 200 max datasets. TTL 600s.
- **Videos**: 20 max channels. TTL 60s.
- **Quota**: 10 max. TTL 600s.
