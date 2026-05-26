# WIZUP EKKO Dispatch Helper

## Purpose

`wizup-ekko-dispatch` is a thin wrapper for running EKKO prompt files from the
canonical WIZUP repository with a stable environment and an automatic timestamped
log file.

## Usage

```bash
/Users/Ira/.hermes/bin/wizup-ekko-dispatch PROMPT_FILE
```

## Example

```bash
/Users/Ira/.hermes/bin/wizup-ekko-dispatch /tmp/wizup-ekko-audit.md
```

## Lane Boundaries

- EKKO/Gemini is the design-audit lane only.
- Codex remains the implementation lane.
- Kimi/JAZZPRO remains the conductor/verifier.

## Notes

- The helper forces `HOME=/Users/Ira`.
- The helper prepends a stable toolchain path before invoking `ekko`.
- The helper always runs from `/Users/Ira/Desktop/wizup-3.0`.
- Output is tee'd into `/Users/Ira/Desktop/wizup-3.0/.hermes-runs/ekko-dispatch-YYYYMMDD-HHMMSS.log`.
