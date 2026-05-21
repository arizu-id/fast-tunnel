import json
import os

transcript_path = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\.system_generated\logs\transcript.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if idx < 2200 and "ssh.js" in line:
            try:
                data = json.loads(line)
                tool_calls = data.get("tool_calls", []) or []
                for call in tool_calls:
                    name = call.get("name")
                    args = call.get("args", {}) or {}
                    path = args.get("TargetFile") or args.get("AbsolutePath") or ""
                    if "ssh.js" in str(path):
                        content = args.get("CodeContent") or args.get("ReplacementContent") or ""
                        print(f"Step {idx}: {name} to {path}, content_len={len(content)}")
            except Exception as e:
                pass
