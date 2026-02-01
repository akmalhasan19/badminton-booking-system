# Panduan Keamanan Upload Gambar - Security Guide

## Daftar Isi
- [Pendahuluan](#pendahuluan)
- [Daftar Serangan](#daftar-serangan)
- [Implementasi Mitigasi](#implementasi-mitigasi)
- [Best Practices](#best-practices)
- [Checklist Keamanan](#checklist-keamanan)

---

## Pendahuluan

Fitur upload gambar adalah salah satu vektor serangan paling umum dalam aplikasi web. Dokumen ini berisi daftar lengkap serangan yang mungkin terjadi dan solusi mitigasinya.

**Target Audience**: AI Agent untuk implementasi keamanan aplikasi web

---

## Daftar Serangan

### 1. Malicious File Upload (Arbitrary File Upload)

**Deskripsi Serangan:**
- Attacker mengupload file executable (PHP, JSP, ASP, ASPX) yang disamarkan sebagai gambar
- Menggunakan double extension seperti `shell.php.jpg` atau `backdoor.jpg.php`
- Null byte injection: `shell.php%00.jpg`
- Case manipulation: `shell.PhP` atau `SHELL.pHp`

**Dampak:**
- Remote Code Execution (RCE)
- Server compromise total
- Data breach
- Malware distribution

**Mitigasi:**

```markdown
PRIORITAS: CRITICAL

1. **Validasi Extension (Whitelist)**
   - HANYA izinkan: .jpg, .jpeg, .png, .gif, .webp
   - Gunakan whitelist, BUKAN blacklist
   - Case-insensitive checking
   
2. **Validasi MIME Type**
   - Cek header Content-Type
   - Validasi MIME type dari file content, bukan hanya dari header
   
3. **Magic Bytes/File Signature Validation**
   - Cek bytes pertama file untuk memastikan format yang benar
   - JPG: FF D8 FF
   - PNG: 89 50 4E 47
   - GIF: 47 49 46 38
   
4. **Rename File**
   - Generate nama file random (UUID, hash, timestamp)
   - Hapus karakter spesial dari nama file original
   - Format: {timestamp}_{random_hash}.{extension}
   
5. **Simpan Di Luar Web Root**
   - Upload ke direktori yang TIDAK bisa diakses langsung via URL
   - Atau gunakan storage terpisah (S3, GCS, CDN)
   
6. **Set File Permissions**
   - Chmod 644 (read-only untuk web server)
   - JANGAN set executable permission (755, 777)
   
7. **Disable Script Execution di Upload Directory**
   - .htaccess (Apache):
     ```apache
     <Directory /path/to/uploads>
         php_flag engine off
         AddType text/plain .php .php3 .php4 .php5 .phtml
     </Directory>
     ```
   - nginx:
     ```nginx
     location /uploads {
         location ~ \.php$ {
             deny all;
         }
     }
     ```
```

**Contoh Kode Implementasi:**

```python
import os
import hashlib
import uuid
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
UPLOAD_FOLDER = '/var/app/uploads'  # Outside web root

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_image(file_stream):
    """Validate file signature/magic bytes"""
    header = file_stream.read(512)
    file_stream.seek(0)
    
    # Check magic bytes
    if header[:3] == b'\xff\xd8\xff':  # JPEG
        return 'jpg'
    elif header[:8] == b'\x89\x50\x4e\x47\x0d\x0a\x1a\x0a':  # PNG
        return 'png'
    elif header[:6] in (b'GIF87a', b'GIF89a'):  # GIF
        return 'gif'
    return None

def generate_safe_filename(original_filename):
    """Generate unique, safe filename"""
    ext = original_filename.rsplit('.', 1)[1].lower()
    random_name = f"{uuid.uuid4().hex}_{int(time.time())}"
    return f"{random_name}.{ext}"

def save_upload(file):
    if file and allowed_file(file.filename):
        # Validate magic bytes
        if not validate_image(file.stream):
            raise ValueError("Invalid image file")
        
        # Generate safe filename
        filename = generate_safe_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        # Save file
        file.save(filepath)
        
        # Set permissions (read-only)
        os.chmod(filepath, 0o644)
        
        return filename
    raise ValueError("File type not allowed")
```

---

### 2. Path Traversal Attack (Directory Traversal)

**Deskripsi Serangan:**
- Filename berbahaya: `../../etc/passwd`, `../../../windows/system32/config`
- Overwrite file sistem penting
- Akses file di luar direktori upload

**Dampak:**
- Overwrite file konfigurasi
- Akses file sensitif
- System compromise

**Mitigasi:**

```markdown
PRIORITAS: CRITICAL

1. **Sanitasi Nama File**
   - Hapus semua path separator: / \ 
   - Hapus karakter berbahaya: .. (dot-dot)
   - Gunakan fungsi secure_filename atau equivalent
   
2. **Use Generated Filename**
   - Jangan gunakan nama file dari user sama sekali
   - Generate nama file sendiri (UUID/hash)
   
3. **Validate Final Path**
   - Pastikan path final berada di dalam upload directory
   - Gunakan realpath() dan cek prefix
   
4. **Whitelist Karakter**
   - Hanya izinkan: a-z, A-Z, 0-9, underscore, dash
```

**Contoh Kode:**

```python
import os
from pathlib import Path

def safe_join(directory, filename):
    """Safely join directory and filename"""
    # Remove any path components
    filename = os.path.basename(filename)
    
    # Remove dangerous characters
    filename = filename.replace('..', '').replace('/', '').replace('\\', '')
    
    # Join paths
    filepath = os.path.join(directory, filename)
    
    # Verify the final path is within directory
    real_directory = os.path.realpath(directory)
    real_filepath = os.path.realpath(filepath)
    
    if not real_filepath.startswith(real_directory):
        raise ValueError("Path traversal attempt detected")
    
    return filepath
```

---

### 3. Image Processing Exploits

**Deskripsi Serangan:**
- File gambar yang exploit vulnerability di library image processing
- ImageTragick (ImageMagick CVE-2016-3714)
- Buffer overflow di GD, Pillow, libpng, libjpeg
- Malformed image headers

**Dampak:**
- Remote Code Execution
- Denial of Service
- Information Disclosure

**Mitigasi:**

```markdown
PRIORITAS: HIGH

1. **Update Library Secara Berkala**
   - Selalu gunakan versi terbaru dari image processing library
   - Monitor CVE dan security advisories
   
2. **Disable Fitur Berbahaya**
   - ImageMagick: Disable coders berbahaya di policy.xml
   ```xml
   <policy domain="coder" rights="none" pattern="EPHEMERAL" />
   <policy domain="coder" rights="none" pattern="URL" />
   <policy domain="coder" rights="none" pattern="HTTPS" />
   <policy domain="coder" rights="none" pattern="MVG" />
   <policy domain="coder" rights="none" pattern="MSL" />
   ```
   
3. **Sandbox Image Processing**
   - Jalankan processing di isolated environment
   - Gunakan container atau VM terpisah
   - Limit resource usage (CPU, memory, time)
   
4. **Re-encode Images**
   - Load dan re-save gambar untuk strip malicious payload
   - Gunakan library yang aman (Pillow dengan validasi)
   
5. **Input Validation**
   - Batasi ukuran file (max 5MB untuk gambar biasa)
   - Batasi dimensi (max 4096x4096 pixels)
   - Timeout untuk processing (max 30 detik)
```

**Contoh Kode:**

```python
from PIL import Image
import io

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_DIMENSION = 4096

def safe_process_image(file_stream):
    """Safely process and re-encode image"""
    # Check file size
    file_stream.seek(0, 2)
    size = file_stream.tell()
    file_stream.seek(0)
    
    if size > MAX_IMAGE_SIZE:
        raise ValueError("File too large")
    
    try:
        # Open image with Pillow
        img = Image.open(file_stream)
        
        # Validate dimensions
        width, height = img.size
        if width > MAX_DIMENSION or height > MAX_DIMENSION:
            raise ValueError("Image dimensions too large")
        
        # Re-encode to remove any malicious payload
        output = io.BytesIO()
        img_format = img.format if img.format in ['JPEG', 'PNG', 'GIF'] else 'PNG'
        img.save(output, format=img_format)
        output.seek(0)
        
        return output
        
    except Exception as e:
        raise ValueError(f"Invalid or corrupted image: {str(e)}")
```

---

### 4. Stored XSS via SVG

**Deskripsi Serangan:**
- File SVG dengan embedded JavaScript
- Contoh: `<svg onload="alert(document.cookie)">`
- Event handlers: onclick, onerror, onload
- Script tags di dalam SVG

**Dampak:**
- Cross-Site Scripting (XSS)
- Session hijacking
- Credential theft
- Malware distribution

**Mitigasi:**

```markdown
PRIORITAS: HIGH

1. **Pertimbangkan Untuk TIDAK Mengizinkan SVG**
   - SVG inherently dangerous karena bisa contain scripts
   - Jika tidak mutlak perlu, lebih baik disable SVG upload
   
2. **Jika Harus Mengizinkan SVG:**
   
   a. **Sanitize SVG Content**
      - Strip semua event handlers (onload, onclick, dll)
      - Remove <script> tags
      - Remove external references
      - Gunakan library: DOMPurify, svg-sanitizer
   
   b. **Serve Dengan Header Yang Benar**
      ```
      Content-Type: image/svg+xml
      Content-Disposition: inline; filename="image.svg"
      X-Content-Type-Options: nosniff
      ```
   
   c. **Implement Content Security Policy**
      ```
      Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src data:;
      ```
   
   d. **Serve Dari Domain Terpisah**
      - Upload SVG di subdomain terpisah (cdn.example.com)
      - Gunakan CDN dengan domain berbeda
      
   e. **Convert SVG to Raster**
      - Convert SVG ke PNG/JPEG saat upload
      - Lebih aman tapi hilang scalability
```

**Contoh Kode:**

```python
import re
from lxml import etree

DANGEROUS_SVG_TAGS = ['script', 'iframe', 'object', 'embed', 'link']
DANGEROUS_ATTRIBUTES = ['onload', 'onerror', 'onclick', 'onmouseover', 
                       'onfocus', 'onblur', 'onchange', 'onsubmit']

def sanitize_svg(svg_content):
    """Sanitize SVG content to remove dangerous elements"""
    try:
        # Parse SVG
        parser = etree.XMLParser(remove_blank_text=True, resolve_entities=False)
        root = etree.fromstring(svg_content.encode('utf-8'), parser)
        
        # Remove dangerous tags
        for tag in DANGEROUS_SVG_TAGS:
            for element in root.xpath(f'.//{tag}'):
                element.getparent().remove(element)
        
        # Remove dangerous attributes
        for element in root.iter():
            for attr in DANGEROUS_ATTRIBUTES:
                if attr in element.attrib:
                    del element.attrib[attr]
            
            # Remove href with javascript:
            if 'href' in element.attrib:
                if element.attrib['href'].startswith('javascript:'):
                    del element.attrib['href']
        
        return etree.tostring(root, encoding='unicode')
        
    except Exception as e:
        raise ValueError(f"Invalid SVG: {str(e)}")

def handle_svg_upload(file):
    """Handle SVG upload safely"""
    content = file.read().decode('utf-8')
    
    # Sanitize
    sanitized = sanitize_svg(content)
    
    # Save with proper headers indicator
    # Store metadata to serve with correct headers later
    return sanitized
```

---

### 5. XXE (XML External Entity) Attack

**Deskripsi Serangan:**
- File SVG atau format berbasis XML yang load external entity
- Bisa membaca file lokal sistem
- Server-Side Request Forgery (SSRF)
- Denial of Service

**Contoh Payload:**
```xml
<?xml version="1.0"?>
<!DOCTYPE svg [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<svg>&xxe;</svg>
```

**Dampak:**
- File disclosure (baca file sensitif)
- SSRF ke internal network
- DoS via billion laughs attack

**Mitigasi:**

```markdown
PRIORITAS: HIGH

1. **Disable External Entity Processing**
   - Set XML parser untuk tidak resolve external entities
   - Disable DTD processing
   
2. **Validasi Ketat untuk SVG**
   - Reject file dengan DOCTYPE declaration
   - Reject file dengan ENTITY definition
   
3. **Use Safe XML Parser**
   - Configure parser dengan secure defaults
   - defusedxml library untuk Python
```

**Contoh Kode:**

```python
from defusedxml import ElementTree as DefusedET
from lxml import etree

def safe_parse_svg(svg_content):
    """Safely parse SVG preventing XXE"""
    try:
        # Use defusedxml to prevent XXE
        parser = etree.XMLParser(
            resolve_entities=False,
            no_network=True,
            dtd_validation=False,
            load_dtd=False
        )
        
        root = etree.fromstring(svg_content.encode('utf-8'), parser)
        
        # Additional check: reject if DOCTYPE present
        if b'<!DOCTYPE' in svg_content.encode('utf-8'):
            raise ValueError("DOCTYPE not allowed in SVG")
        
        if b'<!ENTITY' in svg_content.encode('utf-8'):
            raise ValueError("ENTITY declarations not allowed")
        
        return root
        
    except etree.XMLSyntaxError as e:
        raise ValueError(f"Invalid XML: {str(e)}")
```

---

### 6. Denial of Service (DoS)

**Deskripsi Serangan:**

a. **Large File Upload**
   - Upload file berukuran sangat besar (GB)
   - Menghabiskan disk space dan bandwidth

b. **Decompression Bomb**
   - File kecil yang menjadi sangat besar saat diproses
   - Contoh: 42.zip (42 KB → 4.5 PB)
   - PNG/JPEG dengan kompresi tinggi

c. **Pixel Flood**
   - Gambar dengan dimensi sangat besar
   - Menghabiskan memory saat di-decode

d. **Slow Upload Attack**
   - Upload sangat lambat untuk exhaust connection pool

**Dampak:**
- Server crash
- Disk space habis
- Memory exhaustion
- Service unavailable

**Mitigasi:**

```markdown
PRIORITAS: HIGH

1. **Batasi Ukuran File**
   - Max 5-10 MB untuk gambar biasa
   - Max 2 MB untuk avatar/profile picture
   - Reject di level web server DAN aplikasi
   
2. **Batasi Dimensi Gambar**
   - Max 4096x4096 pixels untuk gambar biasa
   - Max 1024x1024 untuk avatar
   - Check sebelum full processing
   
3. **Processing Timeout**
   - Set timeout 30 detik untuk image processing
   - Kill process jika melebihi timeout
   
4. **Rate Limiting**
   - Max 10 uploads per menit per user
   - Max 100 MB total per user per jam
   - Gunakan Redis/Memcached untuk tracking
   
5. **Async Processing**
   - Process gambar di background worker
   - Jangan block main request
   - Gunakan queue (Celery, RQ, Bull)
   
6. **Resource Limits**
   - Set memory limit untuk image processing
   - Limit CPU usage
   - Use cgroups/containers
   
7. **Check Compression Ratio**
   - Reject jika ratio terlalu tinggi (> 100:1)
   - Monitor decompressed size
```

**Contoh Kode:**

```python
from PIL import Image
import signal

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_PIXELS = 4096 * 4096
PROCESSING_TIMEOUT = 30

class TimeoutException(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutException("Image processing timeout")

def safe_image_upload(file, user_id):
    # Check file size
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    
    if size > MAX_FILE_SIZE:
        raise ValueError(f"File too large: {size} bytes")
    
    # Rate limiting check (pseudo-code)
    if not check_rate_limit(user_id):
        raise ValueError("Rate limit exceeded")
    
    # Set timeout for processing
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(PROCESSING_TIMEOUT)
    
    try:
        img = Image.open(file)
        
        # Check dimensions before full decode
        width, height = img.size
        if width * height > MAX_PIXELS:
            raise ValueError(f"Image too large: {width}x{height}")
        
        # Check decompression ratio (estimate)
        original_size = size
        # Estimate decompressed size
        estimated_size = width * height * 4  # RGBA
        ratio = estimated_size / original_size
        
        if ratio > 100:
            raise ValueError(f"Suspicious compression ratio: {ratio}")
        
        # Process image
        # ... (actual processing)
        
        signal.alarm(0)  # Cancel timeout
        
    except TimeoutException:
        raise ValueError("Image processing took too long")
    except Exception as e:
        signal.alarm(0)
        raise
```

---

### 7. Content Spoofing & Polyglot Files

**Deskripsi Serangan:**
- Upload file non-gambar dengan ekstensi gambar
- Polyglot files: valid sebagai gambar DAN executable
- File dengan header gambar tapi body berbahaya
- GIFAR: GIF + JAR file

**Dampak:**
- Bypass security filters
- Execute malicious code
- Confusion attack

**Mitigasi:**

```markdown
PRIORITAS: MEDIUM-HIGH

1. **Validasi Magic Bytes/File Signature**
   - Jangan hanya cek extension
   - Cek bytes pertama file
   - Pastikan konsisten dengan extension yang diklaim
   
2. **Re-encode Gambar**
   - Load dengan image library
   - Save ulang dengan library yang sama
   - Akan remove payload yang tidak valid
   
3. **Multiple Validation Layers**
   - MIME type validation
   - Extension validation  
   - Magic bytes validation
   - Image library validation (can it open?)
   
4. **Antivirus/Malware Scanning**
   - Scan semua uploaded files
   - ClamAV atau commercial solution
   - Quarantine suspicious files
```

**Contoh Kode:**

```python
import magic
from PIL import Image

MAGIC_BYTES = {
    'jpg': [b'\xff\xd8\xff'],
    'png': [b'\x89\x50\x4e\x47\x0d\x0a\x1a\x0a'],
    'gif': [b'GIF87a', b'GIF89a'],
    'webp': [b'RIFF', b'WEBP']
}

def validate_file_type(file_stream, claimed_extension):
    """Multi-layer file type validation"""
    file_stream.seek(0)
    header = file_stream.read(512)
    file_stream.seek(0)
    
    # 1. Magic bytes validation
    magic_valid = False
    for magic_byte in MAGIC_BYTES.get(claimed_extension, []):
        if header.startswith(magic_byte):
            magic_valid = True
            break
    
    if not magic_valid:
        raise ValueError("File signature doesn't match extension")
    
    # 2. MIME type validation with python-magic
    mime = magic.from_buffer(header, mime=True)
    expected_mime = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp'
    }
    
    if mime != expected_mime.get(claimed_extension):
        raise ValueError(f"MIME type mismatch: {mime}")
    
    # 3. Try to open with PIL
    try:
        file_stream.seek(0)
        img = Image.open(file_stream)
        img.verify()
        
        # Re-encode to strip any payload
        file_stream.seek(0)
        img = Image.open(file_stream)
        output = io.BytesIO()
        img.save(output, format=img.format)
        
        return output
        
    except Exception as e:
        raise ValueError(f"File cannot be processed as image: {str(e)}")
```

---

### 8. SSRF via Image URL

**Deskripsi Serangan:**
- Jika aplikasi bisa fetch image dari URL
- Attacker provide URL ke internal network
- Contoh: `http://localhost:8080/admin`, `http://169.254.169.254/latest/meta-data/`
- Bisa akses internal services, cloud metadata, databases

**Dampak:**
- Access internal services
- Port scanning
- Cloud credentials theft (AWS metadata)
- Data exfiltration

**Mitigasi:**

```markdown
PRIORITAS: CRITICAL (jika fitur URL upload ada)

1. **Whitelist Domain**
   - Hanya izinkan domain tertentu
   - Atau lebih baik: disable fetch dari URL sama sekali
   
2. **Blacklist IP Internal/Private**
   - 127.0.0.0/8 (localhost)
   - 10.0.0.0/8 (private)
   - 172.16.0.0/12 (private)
   - 192.168.0.0/16 (private)
   - 169.254.0.0/16 (link-local, AWS metadata)
   - ::1 (IPv6 localhost)
   
3. **Validasi URL Scheme**
   - Hanya izinkan: http, https
   - Block: file://, ftp://, gopher://, dict://
   
4. **DNS Rebinding Protection**
   - Resolve DNS dan cek IP sebelum request
   - Re-check IP setelah DNS resolution
   
5. **Network Segmentation**
   - Jalankan fetch service di isolated network
   - Tidak bisa akses internal network
   
6. **Timeout & Size Limit**
   - Connection timeout: 5 detik
   - Read timeout: 10 detik
   - Max response size: 10 MB
```

**Contoh Kode:**

```python
import requests
import socket
import ipaddress
from urllib.parse import urlparse

PRIVATE_IP_RANGES = [
    ipaddress.ip_network('127.0.0.0/8'),
    ipaddress.ip_network('10.0.0.0/8'),
    ipaddress.ip_network('172.16.0.0/12'),
    ipaddress.ip_network('192.168.0.0/16'),
    ipaddress.ip_network('169.254.0.0/16'),
    ipaddress.ip_network('::1/128'),
    ipaddress.ip_network('fc00::/7'),
]

ALLOWED_SCHEMES = ['http', 'https']

def is_private_ip(ip):
    """Check if IP is private/internal"""
    try:
        ip_obj = ipaddress.ip_address(ip)
        return any(ip_obj in network for network in PRIVATE_IP_RANGES)
    except:
        return True  # If can't parse, block it

def safe_fetch_image_from_url(url):
    """Safely fetch image from URL with SSRF protection"""
    
    # Parse URL
    parsed = urlparse(url)
    
    # Check scheme
    if parsed.scheme not in ALLOWED_SCHEMES:
        raise ValueError(f"Scheme not allowed: {parsed.scheme}")
    
    # Get hostname
    hostname = parsed.hostname
    if not hostname:
        raise ValueError("Invalid URL")
    
    # Resolve DNS
    try:
        ip = socket.gethostbyname(hostname)
    except socket.gaierror:
        raise ValueError("Cannot resolve hostname")
    
    # Check if IP is private
    if is_private_ip(ip):
        raise ValueError("Private IP addresses not allowed")
    
    # Make request with safeguards
    try:
        response = requests.get(
            url,
            timeout=(5, 10),  # (connect, read) timeout
            max_redirects=3,
            allow_redirects=True,
            stream=True,
            headers={'User-Agent': 'ImageFetcher/1.0'}
        )
        
        # Check content type
        content_type = response.headers.get('Content-Type', '')
        if not content_type.startswith('image/'):
            raise ValueError("URL does not point to an image")
        
        # Check size
        content_length = response.headers.get('Content-Length')
        if content_length and int(content_length) > 10 * 1024 * 1024:
            raise ValueError("Image too large")
        
        # Read with size limit
        MAX_SIZE = 10 * 1024 * 1024
        chunks = []
        total_size = 0
        
        for chunk in response.iter_content(chunk_size=8192):
            total_size += len(chunk)
            if total_size > MAX_SIZE:
                raise ValueError("Image size exceeded limit")
            chunks.append(chunk)
        
        return b''.join(chunks)
        
    except requests.RequestException as e:
        raise ValueError(f"Failed to fetch image: {str(e)}")
```

---

### 9. Metadata Exploitation

**Deskripsi Serangan:**
- EXIF data berisi malicious payload
- Metadata leak informasi sensitif:
  - GPS coordinates (lokasi foto diambil)
  - Device info (model kamera/HP)
  - Software version
  - Nama pemilik/photographer
  - Timestamp yang akurat

**Dampak:**
- Privacy violation
- Information disclosure
- Possible XSS via metadata fields
- Tracking users

**Mitigasi:**

```markdown
PRIORITAS: MEDIUM

1. **Strip Semua Metadata**
   - Remove EXIF, IPTC, XMP data
   - Keep only essential image data
   
2. **Whitelist Metadata (jika perlu)**
   - Hanya simpan metadata yang benar-benar perlu
   - Contoh: orientation untuk rotation
   
3. **Sanitize Metadata Values**
   - Escape special characters
   - Validate format
   - Limit length
```

**Contoh Kode:**

```python
from PIL import Image

def strip_metadata(image_path, output_path):
    """Remove all metadata from image"""
    img = Image.open(image_path)
    
    # Remove EXIF and other metadata
    data = list(img.getdata())
    image_without_exif = Image.new(img.mode, img.size)
    image_without_exif.putdata(data)
    
    # Save without metadata
    image_without_exif.save(output_path)
    
    return output_path

def selective_metadata(image_path, output_path):
    """Keep only safe metadata"""
    img = Image.open(image_path)
    
    # Get orientation (useful for display)
    exif = img.getexif()
    orientation = exif.get(0x0112)  # Orientation tag
    
    # Create new image
    data = list(img.getdata())
    new_img = Image.new(img.mode, img.size)
    new_img.putdata(data)
    
    # Add back only orientation
    if orientation:
        new_exif = Image.Exif()
        new_exif[0x0112] = orientation
        new_img.save(output_path, exif=new_exif)
    else:
        new_img.save(output_path)
    
    return output_path
```

---

### 10. Race Condition

**Deskripsi Serangan:**
- Upload file dan langsung akses sebelum validasi selesai
- Time-of-check to time-of-use (TOCTOU) vulnerability
- Exploit window antara upload dan validation

**Dampak:**
- Execute malicious file sebelum dihapus
- Bypass security checks

**Mitigasi:**

```markdown
PRIORITAS: MEDIUM

1. **Atomic Operations**
   - Upload ke temporary location dulu
   - Validasi lengkap
   - Baru move ke final location
   
2. **Unpredictable Filename**
   - Gunakan random UUID
   - Jangan gunakan sequential ID
   - Jangan expose filename pattern
   
3. **Quarantine Period**
   - File baru tidak langsung accessible
   - Delay 1-2 menit untuk full scan
   
4. **Two-Step Process**
   - Step 1: Upload + validate → temporary storage
   - Step 2: Background processing → move to final location
```

**Contoh Kode:**

```python
import os
import uuid
import shutil
import time

TEMP_UPLOAD_DIR = '/var/app/temp_uploads'
FINAL_UPLOAD_DIR = '/var/app/uploads'
QUARANTINE_DIR = '/var/app/quarantine'

def atomic_upload(file):
    """Upload with race condition protection"""
    
    # Generate unpredictable filename
    temp_filename = f"temp_{uuid.uuid4().hex}_{int(time.time())}"
    temp_path = os.path.join(TEMP_UPLOAD_DIR, temp_filename)
    
    # Save to temporary location
    file.save(temp_path)
    
    try:
        # Perform all validations
        validate_file_type(temp_path)
        validate_file_size(temp_path)
        validate_image_content(temp_path)
        scan_for_malware(temp_path)
        
        # Generate final filename
        final_filename = f"{uuid.uuid4().hex}.jpg"
        quarantine_path = os.path.join(QUARANTINE_DIR, final_filename)
        
        # Move to quarantine first (not directly accessible)
        shutil.move(temp_path, quarantine_path)
        
        # Schedule background job to move to final location
        # after additional processing and delay
        schedule_finalize_upload(quarantine_path, final_filename)
        
        return final_filename
        
    except Exception as e:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise

def finalize_upload(quarantine_path, final_filename):
    """Background task to finalize upload"""
    try:
        # Additional processing
        process_and_optimize_image(quarantine_path)
        
        # Final move
        final_path = os.path.join(FINAL_UPLOAD_DIR, final_filename)
        shutil.move(quarantine_path, final_path)
        
        # Set proper permissions
        os.chmod(final_path, 0o644)
        
    except Exception as e:
        # Log error and move to failed uploads
        logger.error(f"Failed to finalize upload: {e}")
        # Cleanup
```

---

## Implementasi Mitigasi

### Layer Pertahanan (Defense in Depth)

```markdown
Layer 1: Client-Side (User Education)
├─ Informasi user tentang file yang aman
└─ Basic validation (UX only, bukan security)

Layer 2: Network/WAF
├─ Rate limiting
├─ Request size limits
└─ WAF rules untuk common attacks

Layer 3: Web Server
├─ Upload directory restrictions
├─ File size limits
└─ Disable script execution

Layer 4: Application (CRITICAL)
├─ Extension whitelist
├─ MIME type validation
├─ Magic bytes verification
├─ Content validation
├─ Filename sanitization
├─ Safe file storage
└─ Metadata stripping

Layer 5: Processing
├─ Image re-encoding
├─ Antivirus scanning
├─ Async processing
└─ Resource limits

Layer 6: Storage
├─ Separate domain/CDN
├─ Proper headers
├─ Access controls
└─ Regular security audits
```

### Framework-Specific Implementation

#### Django

```python
# settings.py
MEDIA_ROOT = '/var/app/uploads'  # Outside web root
MEDIA_URL = '/media/'
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880

# validators.py
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
import magic

def validate_image_file(file):
    # Size check
    if file.size > 5 * 1024 * 1024:
        raise ValidationError("File too large")
    
    # Extension check
    ext = file.name.split('.')[-1].lower()
    if ext not in ['jpg', 'jpeg', 'png', 'gif']:
        raise ValidationError("Invalid file type")
    
    # Magic bytes check
    file.seek(0)
    mime = magic.from_buffer(file.read(1024), mime=True)
    if mime not in ['image/jpeg', 'image/png', 'image/gif']:
        raise ValidationError("File content doesn't match extension")
    
    file.seek(0)

# models.py
from django.db import models
from .validators import validate_image_file

def user_directory_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f"user_{instance.user.id}/{filename}"

class Photo(models.Model):
    image = models.ImageField(
        upload_to=user_directory_path,
        validators=[validate_image_file]
    )
```

#### Flask

```python
from flask import Flask, request
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = '/var/app/uploads'

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file', 400
    
    file = request.files['file']
    
    if file.filename == '':
        return 'No selected file', 400
    
    if file and allowed_file(file.filename):
        # Validate and save
        filename = secure_filename(file.filename)
        # ... additional validation
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return 'File uploaded', 200
    
    return 'Invalid file', 400
```

#### Express.js (Node)

```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
    destination: '/var/app/uploads',
    filename: (req, file, cb) => {
        const uniqueName = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueName}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

app.post('/upload', upload.single('image'), async (req, res) => {
    // Additional validation
    const filePath = req.file.path;
    
    try {
        // Validate magic bytes
        await validateImageFile(filePath);
        res.json({ success: true, filename: req.file.filename });
    } catch (error) {
        // Delete invalid file
        fs.unlinkSync(filePath);
        res.status(400).json({ error: error.message });
    }
});
```

---

## Best Practices

### 1. Principle of Least Privilege
```markdown
- Upload directory: read/write untuk app, read-only untuk web server
- Database user: hanya permissions yang dibutuhkan
- Service account: minimal permissions
```

### 2. Defense in Depth
```markdown
- Multiple validation layers
- Jangan rely pada satu metode saja
- Combine multiple techniques
```

### 3. Fail Secure
```markdown
- Default deny
- Whitelist > Blacklist
- Reject bila tidak yakin
```

### 4. Security by Design
```markdown
- Design dengan security dari awal
- Jangan tambahkan security sebagai afterthought
- Regular security review
```

### 5. Logging & Monitoring
```markdown
- Log semua upload attempts
- Monitor untuk patterns mencurigakan
- Alert untuk failed validations
- Regular audit logs
```

### 6. Regular Updates
```markdown
- Update libraries secara regular
- Monitor CVE dan security advisories
- Patch management process
- Dependency scanning (Dependabot, Snyk)
```

### 7. Security Testing
```markdown
- Penetration testing
- Automated security scanning
- Code review dengan security focus
- Upload malicious samples untuk testing
```

---

## Checklist Keamanan

### Pre-Upload
```
[ ] Rate limiting implemented
[ ] File size limits configured
[ ] CSRF protection enabled
[ ] Authentication & authorization checked
```

### Validation
```
[ ] Extension whitelist (not blacklist)
[ ] MIME type validation
[ ] Magic bytes / file signature check
[ ] Image can be opened by image library
[ ] File size within limits
[ ] Image dimensions within limits
[ ] Filename sanitized / regenerated
```

### Processing
```
[ ] Image re-encoding untuk strip payload
[ ] Metadata stripped atau sanitized
[ ] Antivirus scanning (if applicable)
[ ] Processing timeout configured
[ ] Resource limits set (memory, CPU)
[ ] Async processing untuk heavy tasks
```

### Storage
```
[ ] Files saved outside web root (or CDN)
[ ] Unpredictable filenames (UUID/hash)
[ ] Proper file permissions (644, not 777)
[ ] Script execution disabled di upload directory
[ ] Separate domain untuk serving (if possible)
```

### Serving
```
[ ] Proper Content-Type headers
[ ] Content-Disposition header set
[ ] X-Content-Type-Options: nosniff
[ ] CSP headers configured
[ ] No directory listing
[ ] Access controls implemented
```

### Monitoring
```
[ ] Upload attempts logged
[ ] Failed validations logged
[ ] Suspicious patterns monitored
[ ] Regular log review
[ ] Automated alerting configured
```

### Maintenance
```
[ ] Regular library updates
[ ] Security patches applied
[ ] Periodic security audits
[ ] Penetration testing scheduled
[ ] Old/unused files cleaned up
```

---

## Tools & Libraries Recommendations

### Python
```
- Pillow: Image processing
- python-magic: MIME type detection
- defusedxml: Safe XML parsing
- bleach: HTML/SVG sanitization
- ClamAV Python: Antivirus integration
```

### Node.js
```
- multer: File upload handling
- sharp: Image processing
- file-type: File type detection
- sanitize-filename: Filename sanitization
- express-rate-limit: Rate limiting
```

### PHP
```
- Intervention Image: Image processing
- finfo: File type detection
- League\Flysystem: File storage abstraction
- symfony/security: Security components
```

### General Tools
```
- ClamAV: Antivirus scanning
- ModSecurity: WAF
- fail2ban: Intrusion prevention
- OWASP ZAP: Security testing
- Burp Suite: Penetration testing
```

---

## Security Headers Configuration

### Apache (.htaccess)
```apache
<FilesMatch "\.(jpg|jpeg|png|gif)$">
    Header set X-Content-Type-Options "nosniff"
    Header set Content-Disposition "inline"
    Header set Content-Security-Policy "default-src 'none'; img-src 'self'; style-src 'unsafe-inline';"
</FilesMatch>

# Disable script execution in upload directory
<Directory /var/www/uploads>
    php_flag engine off
    RemoveHandler .php .phtml .php3
    RemoveType .php .phtml .php3
    Options -Indexes -ExecCGI
    AddType text/plain .php .phtml .php3
</Directory>
```

### Nginx
```nginx
location /uploads {
    # Disable script execution
    location ~ \.php$ {
        deny all;
    }
    
    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header Content-Security-Policy "default-src 'none'; img-src 'self'; style-src 'unsafe-inline';" always;
    
    # Disable directory listing
    autoindex off;
}
```

---

## Testing & Validation

### Manual Testing Checklist
```
[ ] Upload executable dengan extension gambar (.php.jpg)
[ ] Upload file sangat besar (DoS test)
[ ] Upload file dengan null byte (%00)
[ ] Upload SVG dengan JavaScript
[ ] Upload file dengan path traversal (../../)
[ ] Upload polyglot file (GIFAR)
[ ] Upload dengan Content-Type spoofing
[ ] Test rate limiting
[ ] Test concurrent uploads (race condition)
[ ] Upload dengan malformed headers
```

### Automated Testing Tools
```
- OWASP ZAP: Automated vulnerability scanning
- Burp Suite: Comprehensive testing
- Nikto: Web server scanner
- SQLMap: SQL injection (if applicable)
```

### Sample Malicious Files for Testing
```
⚠️ GUNAKAN HANYA DI TEST ENVIRONMENT

- EICAR test file: Antivirus testing
- Metasploit payloads: Penetration testing
- SVG with XSS: XSS testing
- Oversized files: DoS testing
- Polyglot files: Content spoofing testing
```

---

## Incident Response

### Jika Terjadi Breach

1. **Immediate Actions**
   ```
   - Isolate affected system
   - Disable upload functionality
   - Backup evidence
   - Alert security team
   ```

2. **Investigation**
   ```
   - Review logs
   - Identify attack vector
   - Assess damage
   - Check for backdoors
   ```

3. **Containment**
   ```
   - Remove malicious files
   - Patch vulnerabilities
   - Reset credentials
   - Update security rules
   ```

4. **Recovery**
   ```
   - Restore from clean backup
   - Re-enable services
   - Monitor closely
   - Verify integrity
   ```

5. **Post-Incident**
   ```
   - Document incident
   - Update security measures
   - Train team
   - Review and improve processes
   ```

---

## Additional Resources

### Documentation
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- CWE-434: Unrestricted Upload of File with Dangerous Type
- SANS: Securing File Upload Functionality

### Security Standards
- OWASP Top 10
- PCI DSS (if applicable)
- ISO 27001

### Community
- OWASP Community
- Security StackExchange
- r/netsec

---

## Revision History

- v1.0 - Initial version
- Created: 2025-02-01

---

**PENTING**: Dokumen ini harus direview dan diupdate secara regular seiring dengan perkembangan ancaman baru dan best practices security.

**NOTE UNTUK AI AGENT**: 
- Implementasikan SEMUA mitigasi yang sesuai dengan stack technology yang digunakan
- Prioritaskan berdasarkan level CRITICAL > HIGH > MEDIUM
- Jangan skip validation hanya untuk convenience
- Security > Performance > UX
- When in doubt, DENY access
