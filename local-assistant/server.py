"""Pixel local API. Loopback only, per-process token, no saved conversations."""
import base64
import contextlib
import io
import json
import os
import re
import secrets
import sys
import wave
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

TOKEN = os.environ.get('PIXEL_LOCAL_TOKEN', '')
MAX_BODY = 2_000_000
MODELS = {
    'chat': 'mlx-community/Qwen3-1.7B-4bit',
    'voice': 'mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16',
    'ears': 'Systran/faster-whisper-base',
}
history = []
brain = voice = ears = None


def model_path(key):
    from huggingface_hub import snapshot_download
    return snapshot_download(MODELS[key], local_files_only=True)


def chat(text, context=''):
    global brain, history
    from mlx_lm import load, generate
    from mlx_lm.sample_utils import make_sampler
    if brain is None:
        brain = load(model_path('chat'))
    model, tokenizer = brain
    system = ('Você é Pixelito, um pequeno colega de trabalho bem-humorado. '
              'Responda somente em português brasileiro, de forma natural, em até duas frases curtas. Vá direto ao pedido, sem saudações repetidas. '
              'Seu nome é Pixelito. Use esse nome quando perguntarem. Chame o usuário de chefe. '
              'Não tem acesso à tela, arquivos, internet nem ao conteúdo do ChatGPT. '
              'Nunca diga que executou ações. Para abrir aplicativos existem botões de confirmação fora da conversa. '
              'Não invente tarefas ou progresso. Último evento local disponível: ' + context[:300])
    messages = [{'role': 'system', 'content': system}] + history[-8:] + [{'role': 'user', 'content': text}]
    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True, enable_thinking=False)
    reply = generate(model, tokenizer, prompt=prompt, max_tokens=160, sampler=make_sampler(temp=0.6), verbose=False)
    reply = re.sub(r'<think>.*?</think>', '', reply, flags=re.S).strip()
    # Keep complete sentences for speech; never trim an audio waveform to fit a limit.
    sentences = re.findall(r'[^.!?]+[.!?]+', reply)
    reply = ''.join(sentences[:2]).strip() if sentences else reply[:500].rsplit(' ', 1)[0]
    reply = reply or 'Pode repetir, chefe? Não consegui formular uma resposta.'
    history = (history + [{'role': 'user', 'content': text}, {'role': 'assistant', 'content': reply}])[-8:]
    return reply


def transcribe(encoded):
    global ears
    import numpy as np
    from faster_whisper import WhisperModel
    raw = base64.b64decode(encoded, validate=True)
    with wave.open(io.BytesIO(raw), 'rb') as f:
        if f.getnchannels() != 1 or f.getsampwidth() != 2 or f.getframerate() != 16000 or f.getnframes() > 16000 * 30:
            raise ValueError('Envie até 30 segundos de WAV mono, 16 kHz, PCM 16 bits.')
        audio = np.frombuffer(f.readframes(f.getnframes()), dtype='<i2').astype(np.float32) / 32768
    if not len(audio) or np.max(np.abs(audio)) < .004:
        return ''
    if ears is None:
        ears = WhisperModel(model_path('ears'), device='cpu', compute_type='int8', cpu_threads=4)
    segments, _ = ears.transcribe(audio, language='pt', beam_size=5, vad_filter=True, condition_on_previous_text=False)
    return ' '.join(s.text.strip() for s in segments).strip()


def speech(text):
    global voice
    import numpy as np
    import soundfile as sf
    from mlx_audio.tts.utils import load_model
    if voice is None:
        voice = load_model(model_path('voice'))
    reference = Path(__file__).with_name('reference.wav')
    parts = list(voice.generate(text=text, ref_audio=str(reference),
                               ref_text='Oi, chefe! Bora trabalhar? Tô aqui com você.',
                               lang_code='Portuguese', max_tokens=900, verbose=False))
    if not parts:
        raise RuntimeError('A voz local não produziu áudio.')
    samples = np.concatenate([np.asarray(p.audio).reshape(-1) for p in parts])
    rate = parts[0].sample_rate
    # Padding protects first/last phonemes. No speech trimming or fade over speech.
    samples = np.pad(samples, (int(rate * .06), int(rate * .18)))
    output = io.BytesIO()
    sf.write(output, samples, rate, format='WAV', subtype='PCM_16')
    return base64.b64encode(output.getvalue()).decode('ascii')


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # No audio, transcript, token or conversation logs.

    def reply(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.headers.get('Origin') or not TOKEN or not secrets.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + TOKEN):
            return self.reply(403, {'error': 'Acesso não autorizado.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= MAX_BODY:
                return self.reply(413, {'error': 'Pedido excede o limite.'})
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError('Pedido inválido.')
            # Model libraries sometimes print progress. Preserve the stdout ready protocol.
            with contextlib.redirect_stdout(sys.stderr):
                if self.path == '/health':
                    result = {'ready': True, 'local': True}
                elif self.path == '/reset':
                    history.clear()
                    result = {'cleared': True}
                elif self.path == '/transcribe':
                    result = {'text': transcribe(data.get('audio', ''))}
                elif self.path in ('/chat', '/speech'):
                    text = data.get('text', '')
                    if not isinstance(text, str) or not text.strip() or len(text) > 1000:
                        raise ValueError('Digite de 1 a 1000 caracteres.')
                    result = {'reply': chat(text, str(data.get('context', '')))} if self.path == '/chat' else {'audio': speech(text)}
                else:
                    return self.reply(404, {'error': 'Rota inexistente.'})
            self.reply(200, result)
        except (ValueError, KeyError, TypeError) as e:
            self.reply(400, {'error': str(e)[:300]})
        except Exception as e:
            self.reply(500, {'error': 'Motor local indisponível: ' + type(e).__name__ + ': ' + str(e)[:250]})


if __name__ == '__main__':
    if not TOKEN:
        raise SystemExit('Inicie pelo Pixel: é necessário um token local temporário.')
    server = HTTPServer(('127.0.0.1', 0), Handler)
    print(json.dumps({'port': server.server_port}), flush=True)
    server.serve_forever()
