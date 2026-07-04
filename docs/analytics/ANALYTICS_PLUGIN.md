# Analytics Plugin Architecture

## Concept
The analytics engine is provider-agnostic. All external API integrations must implement `IAnalyticsProvider`.

## Implementing a Plugin
1. Create `plugin_name.py`.
2. Inherit from `IAnalyticsProvider`.
3. Implement `get_channel_metrics()`, `get_analytics_metrics()`, `get_chart_data()`, and `get_videos()`.
4. Register the plugin in `analytics_service.py` under the `providers` map.
