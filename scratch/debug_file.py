import os
filepath = r"C:\Users\Arief Zufar Hilmi\.gemini\antigravity-ide\brain\58aeea26-cb53-4852-9604-082c0b2a756a\scratch\reconstructed\assets\js\modules\ssh.js"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read().strip()
print("Length:", len(content))
print("Start characters:", repr(content[:10]))
print("End characters:", repr(content[-10:]))
print("Starts with quote:", content.startswith('"'))
print("Ends with quote:", content.endswith('"'))
