
with open('public/shuttlecock-cursor.svg', 'r') as f:
    lines = f.readlines()

# Modify header size to be cursor-friendly
# Line index 1 is the <svg ... width="100%" ...> line
if 'width="100%"' in lines[1]:
    lines[1] = lines[1].replace('width="100%"', 'width="32px" height="32px"')

# Write excluding the black background path (lines 3-11 in 1-based indexing, so indices 2-10)
# We keep indices 0, 1. Skip 2..10. Keep 11..end.
new_content = lines[0:2] + lines[11:]

with open('public/shuttlecock-cursor.svg', 'w') as f:
    f.writelines(new_content)
