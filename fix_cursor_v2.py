
import os

source = 'public/shuttlecock-cursor1.svg'
target = 'public/shuttlecock-cursor.svg'

with open(source, 'r') as f:
    lines = f.readlines()

# Resize to 48px (User requested "slightly larger" than default, default usually small, prev was 32px)
if 'width="100%"' in lines[1]:
    lines[1] = lines[1].replace('width="100%"', 'width="48px" height="48px"')

# Remove lines 3-11 (black background path)
# Indices 2 to 10
new_content = lines[0:2] + lines[11:]

with open(target, 'w') as f:
    f.writelines(new_content)

# Delete source
try:
    os.remove(source)
except:
    pass
