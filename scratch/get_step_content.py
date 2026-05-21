import json
import sys

transcript_path = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\.system_generated\logs\transcript.jsonl"
sys.stdout.reconfigure(encoding="utf-8")

with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if idx == 1477:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for call in tool_calls:
                args = call.get("args", {})
                code = args.get("CodeContent")
                print("Code Content in step 1477 loaded.")
                with open("scratch/step_1477_code.js", "w", encoding="utf-8") as out:
                    out.write(code)
                print("Wrote to scratch/step_1477_code.js")
