#!/bin/bash
export PYTHONPATH=/home/runner/workspace/backend/vendor:$PYTHONPATH
cd /home/runner/workspace/backend
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000
