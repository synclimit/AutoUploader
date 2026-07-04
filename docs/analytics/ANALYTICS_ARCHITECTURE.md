# Enterprise Analytics Architecture

## Core Principle
Analytics is **Single Source of Truth (SSOT)**. All runtime metrics come from YouTube API via the cache layer. Never write metrics to SQLite.

## Flow
`Dashboard -> analyticsStore -> Analytics Gateway -> Analytics Service -> Cache -> Provider -> API`

## Components
1. **Gateway**: Single Entry Point for all Analytics requests.
2. **Service**: Business Logic, Cache Coordination, Retry Policy.
3. **Provider**: Plugin architecture for data sources.
4. **Cache Layer**: LRU Multi-level cache.
