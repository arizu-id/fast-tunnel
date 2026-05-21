import json
import os

transcript_path = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\.system_generated\logs\transcript.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if "ssh.js" in line:
            # Let's see what keys are in JSON if we parse it
            try:
                data = json.loads(line)
                has_calls = "tool_calls" in data
                calls_desc = ""
                if has_calls:
                    calls_desc = [c.get("name") for c in data.get("tool_calls", []) if c]
                print(f"Step {idx}: size={len(line)} has_calls={has_calls} calls={calls_desc}")
            except Exception as e:
                print(f"Step {idx}: size={len(line)} (JSON parse err: {e})")
