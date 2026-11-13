"""Bounded Electron renderer smoke test; clean up CI's lingering GUI helpers."""
import json
import os
import platform
import queue
import signal
import subprocess
import threading
import time

directory = 'mac-arm64' if platform.machine() == 'arm64' else 'mac'
process = subprocess.Popen([f'dist/{directory}/Pixel.app/Contents/MacOS/Pixel', '--smoke-test'],
                           stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                           text=True, start_new_session=True)
lines = queue.Queue()


def collect():
    for line in process.stdout:
        lines.put(line)
    lines.put(None)


threading.Thread(target=collect, daemon=True).start()
passed = False
deadline = time.monotonic() + 60
try:
    while time.monotonic() < deadline:
        try:
            line = lines.get(timeout=1)
        except queue.Empty:
            continue
        if line is None:
            break
        print(line.rstrip(), flush=True)
        try:
            result = json.loads(line)
            if result.get('smoke') == 'passed' and result.get('clips') == 25:
                passed = True
                break
        except (ValueError, AttributeError):
            pass
finally:
    # This is a new process group created only for this hidden test window.
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGKILL)
        process.wait(timeout=5)
if not passed:
    raise SystemExit('Renderer smoke test did not report success within 60 seconds.')
print('Renderer passed; test process group cleaned up.')
