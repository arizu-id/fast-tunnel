import json, re
transcript_path = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\.system_generated\logs\transcript.jsonl"
with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if "db.js" in line and "view_file" in line:
            try:
                data = json.loads(line)
                print(f"Step {idx}: type={data.get('type')}, status={data.get('status')}")
                if "tool_calls" in data:
                    for call in data["tool_calls"]:
                        if call["name"] == "view_file":
                            print(f"  Args: {call['args']}")
            except:
                pass
