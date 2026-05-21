import json
transcript_path = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\.system_generated\logs\transcript.jsonl"
with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if idx == 3046:
            data = json.loads(line)
            content = data.get("content") or ""
            print(f"Step {idx}: type={data.get('type')}, len={len(content)}, truncated={'<truncated' in content}")
            if len(content) > 200:
                print("Start of content:", content[:200])
                print("End of content:", content[-200:])
            else:
                print("Content:", content)
