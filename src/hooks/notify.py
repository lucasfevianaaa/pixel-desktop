#!/usr/bin/python3
"""Local-only activity bridge. Discards prompts, outputs and tool arguments."""
import json,os,sys,time,uuid,hashlib
from pathlib import Path

def write_event(data,folder=None):
    event=data.get('hook_event_name')
    if event not in {'SessionStart','UserPromptSubmit','PreToolUse','PermissionRequest','Stop','Interrupt','SessionEnd'}:return
    default=Path(os.environ.get('APPDATA',str(Path.home()/'AppData/Roaming')))/'Pixel' if sys.platform=='win32' else Path.home()/'Library/Application Support/Pixel'
    folder=Path(folder or default/'events')
    folder.mkdir(parents=True,exist_ok=True)
    safe={'event':event,'tool_name':str(data.get('tool_name',''))[:150],'time':time.time()}
    if isinstance(data.get('session_id'),str):safe['session']=hashlib.sha256(data['session_id'].encode()).hexdigest()[:16]
    if isinstance(data.get('turn_id'),str):safe['turn']=hashlib.sha256(data['turn_id'].encode()).hexdigest()[:16]
    stem=str(time.time_ns())+'-'+uuid.uuid4().hex
    pending=folder/(stem+'.tmp');target=folder/(stem+'.json')
    pending.write_text(json.dumps(safe),encoding='utf-8');pending.chmod(0o600);pending.replace(target)
    # Keep the mailbox bounded even when the mascot is closed.
    for old in sorted(folder.glob('*.json'))[:-64]:
        try:old.unlink()
        except OSError:pass
if __name__=='__main__':
    try:write_event(json.loads(sys.stdin.read(2_000_000)))
    except Exception:pass
