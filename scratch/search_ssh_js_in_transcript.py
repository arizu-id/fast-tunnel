import json
import re

transcript_path = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\.system_generated\logs\transcript.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if "connectSsh" in line and "function connectSsh" in line:
            try:
                data = json.loads(line)
                print(f"Step {idx} - type: {data.get('type')}, status: {data.get('status')}")
                tool_calls = data.get("tool_calls", []) or []
                for call in tool_calls:
                    name = call.get("name")
                    args = call.get("args", {}) or {}
                    path = args.get("TargetFile") or args.get("AbsolutePath") or ""
                    print(f"  Tool Call: {name} on {path}")
                    if "ssh.js" in path and name in ["write_to_file", "replace_file_content", "multi_replace_file_content"]:
                        content = args.get("CodeContent") or args.get("ReplacementContent") or ""
                        print(f"    Content length: {len(content)}")
                        if "truncated" not in line.lower():
                            print("    Untruncated tool call line!")
            except Exception as e:
                print(f"Error parsing step {idx}: {e}")
