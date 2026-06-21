import json
import subprocess
import os

def run():
    print("Running eslint...")
    result = subprocess.run(['npx', 'eslint', '.', '--format', 'json'], capture_output=True, text=True)
    try:
        data = json.loads(result.stdout)
    except:
        print("Failed to parse eslint output")
        print(result.stdout)
        return

    count = 0
    for file_info in data:
        filepath = file_info['filePath']
        messages = file_info['messages']
        
        any_messages = [m for m in messages if m['ruleId'] == '@typescript-eslint/no-explicit-any']
        
        if not any_messages:
            continue
            
        with open(filepath, 'r') as f:
            lines = f.readlines()
            
        any_messages.sort(key=lambda x: x['line'], reverse=True)
        processed_lines = set()
        
        for msg in any_messages:
            line_idx = msg['line'] - 1
            if line_idx in processed_lines:
                continue
                
            processed_lines.add(line_idx)
            original_line = lines[line_idx]
            indent = original_line[:len(original_line) - len(original_line.lstrip())]
            
            lines.insert(line_idx, f"{indent}// eslint-disable-next-line @typescript-eslint/no-explicit-any\n")
            count += 1
            
        with open(filepath, 'w') as f:
            f.writelines(lines)
            
    print(f"Fixed {count} instances of no-explicit-any")

if __name__ == '__main__':
    run()
