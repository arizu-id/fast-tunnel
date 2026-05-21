import json
transcript_path = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\.system_generated\logs\transcript.jsonl"
with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if "db-browse.js" in line:
            try:
                data = json.loads(line)
                content = data.get("content") or ""
                # check if there's any info in tool_calls
                for call in data.get("tool_calls", []):
                    if "db-browse.js" in str(call):
                        print(f"Step {idx} tool call: {call.get('name')} {call.get('args')}")
                if data.get("type") == "VIEW_FILE" and "db-browse.js" in data.get("content", ""):
                    print(f"Step {idx} view output: len={len(content)}, lines={len(content.splitlines())}")
            except:
                pass
