import json
import os
import re
transcript_path = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\.system_generated\logs\transcript.jsonl"
file_lines = {}
with open(transcript_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            content = data.get("content") or ""
            if not isinstance(content, str):
                continue
            if "File Path: " in content and "Showing lines " in content:
                lines = content.splitlines()
                path = None
                for l in lines:
                    if "File Path: " in l:
                        match = re.search(r'file:///([^\s`]+)', l)
                        if match:
                            path = match.group(1).replace("%20", " ").replace("\\\\", "/").replace("\\", "/")
                            break
                if not path or not path.endswith(".js"):
                    continue
                norm_path = path.lower()
                if norm_path not in file_lines:
                    file_lines[norm_path] = {}
                for l in lines:
                    m = re.match(r'^(\d+):\s(.*)$', l)
                    if m:
                        line_num = int(m.group(1))
                        line_content = m.group(2)
                        file_lines[norm_path][line_num] = line_content
        except:
            pass
for path, lines_dict in file_lines.items():
    if not lines_dict:
        continue
    max_line = max(lines_dict.keys())
    reconstructed_lines = []
    for i in range(1, max_line + 1):
        reconstructed_lines.append(lines_dict.get(i, ""))
    out_dir = r"c:\xampp\htdocs\scratch\restored_views_struct"
    rel_path = path
    if "c:/xampp/htdocs/" in path:
        rel_path = path.split("c:/xampp/htdocs/", 1)[1]
    elif "htdocs/" in path:
        rel_path = path.split("htdocs/", 1)[1]
    dest = os.path.join(out_dir, rel_path.replace("/", "\\"))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "w", encoding="utf-8") as out_f:
        out_f.write("\n".join(reconstructed_lines))
    print(f"Restored {rel_path} to {dest} - total lines: {max_line}")
