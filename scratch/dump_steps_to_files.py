import json
import os
import sys

transcript_path = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\.system_generated\logs\transcript.jsonl"
steps_to_dump = [2202, 2537, 2541, 2563]

with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if idx in steps_to_dump:
            try:
                data = json.loads(line)
                tool_calls = data.get("tool_calls", []) or []
                for c_idx, call in enumerate(tool_calls):
                    name = call.get("name")
                    args = call.get("args", {}) or {}
                    for k, v in args.items():
                        if k in ("CodeContent", "ReplacementContent", "TargetContent"):
                            s = str(v)
                            out_name = f"c:\\xampp\\htdocs\\scratch\\step_{idx}_call_{c_idx}_{k}.js"
                            with open(out_name, "w", encoding="utf-8") as out_f:
                                out_f.write(s)
                            print(f"Saved step {idx} {k} (len {len(s)}) to {out_name}")
            except Exception as e:
                print(f"Error on step {idx}: {e}")
