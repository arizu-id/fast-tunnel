import json
transcript_path = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\.system_generated\logs\transcript.jsonl"
with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if idx in (2202, 2537, 2541, 2563):
            data = json.loads(line)
            print(f"Step {idx}: type={data.get('type')}")
            tool_calls = data.get("tool_calls", []) or []
            for call in tool_calls:
                print(f"  tool={call.get('name')}")
                args = call.get("args", {})
                for k, v in args.items():
                    if k in ("CodeContent", "ReplacementContent", "TargetContent"):
                        s = str(v)
                        print(f"    {k}: len={len(s)}")
                        print(f"    {k} preview: {repr(s[:200])} ... {repr(s[-200:])}")
