"""Run after editing game files to refresh the offline patch manifest."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
files=sorted(p for p in root.rglob('*') if p.is_file() and p.suffix in {'.js','.html','.png','.jpg','.webp','.webmanifest'} and p.name!='sw.js')
hashes={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
template=(root/'worker.template').read_text()
version=hashlib.sha256((json.dumps(hashes)+template).encode()).hexdigest()[:16]
(root/'sw.js').write_text('const version='+json.dumps(version)+';\nconst hashes='+json.dumps(hashes,indent=2)+';\n'+template)
