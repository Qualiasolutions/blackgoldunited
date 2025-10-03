#!/bin/bash

# Error Logger Hook
# Logs all errors to .claude/logs/errors.log

set -e

# Create logs directory if it doesn't exist
mkdir -p .claude/logs

ERROR_LOG=".claude/logs/errors.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

ERROR_MESSAGE=$1
ERROR_TOOL=$2
ERROR_CONTEXT=$3

# Log error with timestamp
echo "[$TIMESTAMP] ERROR in $ERROR_TOOL" >> "$ERROR_LOG"
echo "  Message: $ERROR_MESSAGE" >> "$ERROR_LOG"
echo "  Context: $ERROR_CONTEXT" >> "$ERROR_LOG"
echo "---" >> "$ERROR_LOG"

# Keep log file under 1MB by rotating
if [ -f "$ERROR_LOG" ]; then
  LOG_SIZE=$(stat -f%z "$ERROR_LOG" 2>/dev/null || stat -c%s "$ERROR_LOG" 2>/dev/null || echo 0)
  if [ "$LOG_SIZE" -gt 1048576 ]; then
    mv "$ERROR_LOG" "${ERROR_LOG}.old"
    echo "[$TIMESTAMP] Log rotated" > "$ERROR_LOG"
  fi
fi

echo "📝 Error logged to $ERROR_LOG"
exit 0
