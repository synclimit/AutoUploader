# Watch Folder Diagnostic CLI Tool

## Overview

As part of the Sprint 10.4.2 runtime integration, a new diagnostic CLI tool has been added to provide operators and developers with exact trace details of how the Watch Folder Engine is interpreting the configuration. This completely eliminates silent failures.

## Command Usage

```bash
python prompt_cli.py trace-watch-folder [Channel Name]
```

## Trace Structure

The trace command evaluates every pipeline configured for the specified channel, evaluating the following criteria sequentially:

1. **Watch Folder Enabled**: Checks if `enabled=True` in the config block.
2. **Folder Exists**: Validates if the local directory path is mapped and accessible.
3. **Packages Found**: Triggers an on-demand scan using `scanner.scan` to count viable folder structures.
4. **Daily Limit**: Displays the configured `daily_limit`.
5. **Already Imported Today**: Checks the `today_intake` from `pipeline_states`.
6. **Remaining**: Computes remaining slots for today.
7. **Schedule Mode**: Checks if it's operating in `youtube` or `application` mode.
8. **Queue Created / Validation**: Checks if the next package in the folder is valid and not a duplicate. Determines if it will successfully trigger an `UploadTask`.

## Example Output

```
====================================
WATCH FOLDER TRACE
====================================
Channel
My Channel

Pipeline: LONG

Watch Folder Enabled
PASS

Folder Exists
PASS

Packages Found
3
PASS

Daily Limit
2
PASS

Already Imported Today
0
PASS

Remaining
2
PASS

Schedule Mode
application
PASS

Valid Non-Locked Candidates: 3
Queue Created
YES
PASS
====================================
```

If a step fails (e.g., Folder not found, Daily limit reached, Validation Failed), the trace halts at that specific step for that pipeline and outputs `FAIL` with a clear `Reason`. This allows for deterministic troubleshooting.
