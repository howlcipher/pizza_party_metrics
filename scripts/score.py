import re
from datetime import datetime


def parse_improvements():
    with open('documentation/improvements.md', 'r') as f:
        content = f.read()

    # Find the table
    table_pattern = re.compile(r'(\| # \| Improvement \| Status \| Score \(V×D÷E\) \| Claude model \| Gemini model \| ROI rationale \|\n\| --- \| --- \| --- \| --- \| --- \| --- \| --- \|\n)(.*?)(\n\n)', re.DOTALL)
    m = table_pattern.search(content)
    if not m:
        print("Table not found!")
        return

    table_header = m.group(1)
    table_body = m.group(2)
    
    rows = table_body.strip().split('\n')
    
    table_data = {}
    for row in rows:
        cols = [c.strip() for c in row.split('|')][1:-1]
        if len(cols) >= 7:
            num = int(cols[0])
            table_data[num] = {
                'title': cols[1],
                'status': cols[2],
                'score_str': cols[3],
                'claude': cols[4],
                'gemini': cols[5],
                'rationale': cols[6]
            }

    # Now parse the details to sync statuses and find new ones
    detail_blocks = re.split(r'\n### (?=\d+\.)', content)
    
    details_data = {}
    
    new_content_blocks = [detail_blocks[0]]
    
    for block in detail_blocks[1:]:
        num_match = re.match(r'^(\d+)\. (.*?)\n', block)
        if not num_match:
            new_content_blocks.append("### " + block)
            continue
            
        num = int(num_match.group(1))
        title = num_match.group(2)
        
        status = '📅 Pending'
        
        done_m = re.search(r'\*\*Done note \((.*?)\):\*\*', block)
        closed_m = re.search(r'\*\*Status:\*\*.*?Closed', block)
        below_m = re.search(r'\*\*Status:\*\*.*?below floor', block)
        
        if done_m:
            status = f"Done ({done_m.group(1)})"
        elif closed_m:
            status = "Closed"
        elif below_m:
            status = "⚠️ below floor"
        
        details_data[num] = {
            'title': title,
            'status': status,
            'block': block
        }
        
    # Reconcile new items (50-54) into table_data
    for num, detail in details_data.items():
        if num not in table_data:
            table_data[num] = {
                'title': detail['title'],
                'status': detail['status'],
                'score_str': '-',
                'claude': 'claude-3-7-sonnet-20250219',
                'gemini': 'gemini-3.1-pro-high',
                'rationale': '8 (High Value) * 1.0 (new capability) / 4 = 2.00'
            }
        else:
            table_data[num]['status'] = detail['status']

    # Compute theme decay
    theme_counts = {}
    for num, data in table_data.items():
        if 'Done' in data['status'] or 'Closed' in data['status']:
            title = data['title']
            clean_title = re.sub(r'\[.*?\] ', '', title)
            if ':' in clean_title:
                theme = clean_title.split(':')[0].strip()
                theme_counts[theme] = theme_counts.get(theme, 0) + 1

    # Rescore
    for num, data in table_data.items():
        if 'Done' in data['status'] or 'Closed' in data['status']:
            continue
            
        title = data['title']
        clean_title = re.sub(r'\[.*?\] ', '', title)
        theme = ""
        if ':' in clean_title:
            theme = clean_title.split(':')[0].strip()
            
        rat = data['rationale']
        v_m = re.search(r'^(\d+)', rat)
        e_m = re.search(r'/\s*(\d+)', rat)
        if not v_m or not e_m:
            continue
        v = float(v_m.group(1))
        e = float(e_m.group(1))
        
        new_cap = 'new capability' in rat.lower()
        if new_cap:
            decay = 1.0
        else:
            done_count = theme_counts.get(theme, 0)
            decay = 1.0 * (0.5 ** done_count)
            
        score = (v * decay) / e
        
        v_desc = re.search(r'\((.*?)\)', rat)
        v_desc_str = f"({v_desc.group(1)})" if v_desc else ""
        decay_str = "(new capability)" if new_cap else "(decay)"
        
        data['rationale'] = f"{int(v)} {v_desc_str} * {decay:g} {decay_str} / {int(e)} = {score:.2f}"
        data['score_str'] = f"{score:.2f}"
        data['score_val'] = score
        
        if score < 0.5:
            data['status'] = '⚠️ below floor'
            details_data[num]['status'] = '⚠️ below floor'
            block = details_data[num]['block']
            if '**Status:**' in block:
                block = re.sub(r'\*\*Status:\*\*.*', r'**Status:** ⚠️ below floor\n**Scoring Note (' + datetime.now().strftime('%Y-%m-%d') + r'):** Re-scored below 0.5 ROI floor due to theme decay.', block)
            else:
                pass
            details_data[num]['block'] = block
        else:
            data['status'] = '📅 Pending'
            details_data[num]['status'] = '📅 Pending'
            block = details_data[num]['block']
            if '⚠️ below floor' in block:
                block = re.sub(r'\*\*Status:\*\* ⚠️ below floor\n\*\*Scoring Note.*?\n', r'**Status:** 📅 Pending\n', block, flags=re.DOTALL)
            elif '**Status:**' in block:
                block = re.sub(r'\*\*Status:\*\*.*', r'**Status:** 📅 Pending', block)
            details_data[num]['block'] = block

    def sort_key(item):
        num, data = item
        if 'Done' in data['status'] or 'Closed' in data['status']:
            return (1, 0)  # done items at the bottom
        else:
            return (0, -data.get('score_val', 0))

    sorted_items = sorted(table_data.items(), key=sort_key)
    
    new_table_lines = []
    for num, data in sorted_items:
        new_table_lines.append(f"| {num} | {data['title']} | {data['status']} | {data['score_str']} | {data['claude']} | {data['gemini']} | {data['rationale']} |")
        
    new_table = table_header + '\n'.join(new_table_lines) + '\n\n'
    
    new_details = "\n## Details\n\n"
    for num in sorted(details_data.keys()):
        new_details += f"### {num}. {details_data[num]['block'].strip()}\n\n"
        
    full_new_content = content[:m.start(1)] + new_table + new_details
    
    with open('documentation/improvements.md', 'w') as f:
        f.write(full_new_content.strip() + '\n')
        
    print("Grooming complete.")


parse_improvements()
