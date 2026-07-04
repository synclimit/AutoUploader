# Rollback Reference

Simultaneously with any alias swing, the engine creates a `PromotionRollback` object containing the explicit `previous_version`. If a newly promoted version degrades unexpectedly in live traffic, an operator can execute this rollback command to instantly revert the `production` alias back to the known-good state.
