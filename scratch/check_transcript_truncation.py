import json
transcript_path = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\.system_generated\logs\transcript.jsonl"
with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if "write_to_file" in line:
            try:
                data = json.loads(line)
                for call in data.get("tool_calls", []):
                    if call["name"] == "write_to_file":
                        path = call["args"].get("TargetFile") or ""
                        content = call["args"].get("CodeContent") or ""
                        is_trunc = "<truncated" in content
                        print(f"Step {idx}: file={path}, len={len(content)}, truncated={is_trunc}")
            except:
                pass
