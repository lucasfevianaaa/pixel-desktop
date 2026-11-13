"""Optional local speech/conversation engines for Apple Silicon. Python 3.12+."""
import json
import os
import platform
import subprocess
import sys
from pathlib import Path

if sys.platform != 'darwin' or platform.machine() != 'arm64':
    raise SystemExit('Este motor local usa Apple Silicon. O mascote com as vozes gravadas funciona também no Windows e no Mac Intel.')
if int(platform.mac_ver()[0].split('.')[0]) < 26:
    raise SystemExit('Esta versão dos motores MLX requer macOS 26 ou mais recente.')
if sys.version_info < (3, 12):
    raise SystemExit('Instale Python 3.12 ou mais recente para configurar a conversa local.')
root = Path.home() / 'Library/Application Support/Pixel'
target = root / 'local-engine'
target.mkdir(parents=True, exist_ok=True)
python = target / 'venv/bin/python3'
subprocess.run([sys.executable, '-m', 'venv', str(target / 'venv')], check=True)
subprocess.run([str(python), '-m', 'pip', 'install', '-r', str(Path(__file__).with_name('requirements.txt'))], check=True)
cache = target / 'models'
script = '''from huggingface_hub import snapshot_download
import os
for model in ['mlx-community/Qwen3-1.7B-4bit', 'mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16', 'Systran/faster-whisper-base']:
    print('Baixando', model, flush=True)
    snapshot_download(model, cache_dir=os.environ['PIXEL_MODEL_CACHE'])
'''
subprocess.run([str(python), '-c', script], env={**os.environ, 'PIXEL_MODEL_CACHE': str(cache)}, check=True)
config = root / 'assistant-local.json'
config.write_text(json.dumps({'python': str(python), 'cache': str(cache)}, indent=2))
config.chmod(0o600)
print('Pronto. Abra o Pixel e pressione ⌘⇧P. A primeira resposta demora mais enquanto os modelos carregam.')
