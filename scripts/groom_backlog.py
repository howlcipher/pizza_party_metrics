def groom():
    with open('documentation/improvements.md', 'r') as f:
        lines = f.readlines()
        
    table_start = -1
    table_end = -1
    for i, line in enumerate(lines):
        if line.startswith('| # |'):
            table_start = i
        if table_start != -1 and i > table_start + 1 and not line.startswith('|'):
            table_end = i
            break
            
    if table_start == -1:
        return

    # we will just do this manually or via simpler script.
    print(f"Table from {table_start} to {table_end}")


groom()
