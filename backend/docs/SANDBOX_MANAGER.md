# Sandbox Manager

The Sandbox Manager is responsible for provisioning and destroying ephemeral execution contexts. When a `ChangePlan` specifies dependencies, the Sandbox Manager clones exact registry layer versions into this isolated container ensuring testing is completely uncoupled from production traffic.
