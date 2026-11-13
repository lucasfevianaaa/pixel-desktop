# Conversar localmente com o Pixel

O mascote e suas 25 gravações funcionam no Mac e no Windows. O motor opcional de conversa desta versão usa **Apple Silicon, macOS 26 e Python 3.12+**. Recomenda-se 16 GB de memória. Ele não está disponível no Windows ou no Mac Intel nesta versão.

## Instalar uma vez

Baixe o código deste repositório e execute, dentro da pasta do projeto:

```sh
python3 local-assistant/install.py
```

O instalador cria um ambiente Python separado e baixa alguns gigabytes de modelos para `~/Library/Application Support/Pixel/local-engine`. A instalação exige internet. Depois dela, reconhecimento, respostas e voz são executados localmente, sem uma chave de API, assinatura ou envio da conversa a um servidor.

## Usar

1. Abra o Pixel e pressione **⌘⇧P**, ou escolha **Conversar com o Pixel** no menu.
2. Digite uma mensagem ou clique em **Falar com o Pixel**.
3. Na primeira vez, autorize o microfone no macOS.
4. Clique em **Terminar e enviar**. Cada gravação tem limite de 30 segundos.
5. Use **Limpar conversa** para apagar o histórico da memória e descarregar os modelos. Fechar o aplicativo também encerra o motor.

O microfone não fica escutando em segundo plano. Fechar a janela ou mudar de categoria interrompe a captura. A primeira resposta demora mais para carregar os modelos. As respostas ficam limitadas a duas frases para manter a conversa leve.

## Voz e recursos

- As gravações originais do ElevenLabs continuam no app, com a voz original.
- Falas novas são uma **aproximação local** dessa voz usando Qwen3-TTS e uma referência sintética incluída. Não é o modelo Eleven v4 e não há garantia de timbre ou emoção idênticos.
- Whisper reconhece a fala em português; Qwen3-1.7B gera as respostas. Um modelo pequeno pode errar; o Pixel não tem a capacidade do ChatGPT completo.
- A aparência do mascote é preservada. Não é preciso aplicar um tema novo.
- “Status”, “foco”, “café”, “casa” e “vem aqui” controlam o mascote.
- “Abra a calculadora”, “abra notas”, “abra ChatGPT”, “abra Codex”, “abra o calendário” e “abra Safari” mostram uma confirmação antes de solicitar a abertura no Mac. No Windows, Calculadora e Bloco de Notas estão disponíveis por texto. Não há execução de comandos livres, navegação autônoma, leitura da tela ou edição de documentos.
- Os eventos de trabalho dependem da [integração por hooks](INTEGRATION.md). O Pixel não lê o conteúdo da conversa do ChatGPT nem herda sua conta ou assinatura.

## API e privacidade

O Electron inicia uma API HTTP em `127.0.0.1`, numa porta temporária, com token aleatório por processo. O renderer não acessa a rede: usa IPC validado. A API rejeita pedidos sem token e pedidos com `Origin`. Não escuta na rede local e não grava áudios, transcrições nem o histórico em disco.

Rotas POST: `/health`, `/transcribe` (WAV mono PCM 16 bits, 16 kHz, base64), `/chat` (texto e resumo opcional de evento), `/speech` (texto → WAV base64), `/reset`. O protocolo é próprio do Pixel; não é uma API OpenAI completa. O arquivo privado `assistant-local.json` informa apenas os caminhos do Python e do cache. Não deve ser publicado.

## Motores e licenças

- [MLX Audio / Qwen3-TTS](https://github.com/Blaizzy/mlx-audio/tree/main/mlx_audio/tts/models/qwen3_tts)
- [Qwen3-TTS 0.6B Base para MLX](https://huggingface.co/mlx-community/Qwen3-TTS-12Hz-0.6B-Base-bf16)
- [Qwen3-1.7B quantizado](https://huggingface.co/mlx-community/Qwen3-1.7B-4bit)
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper)

Os pesos são baixados separadamente, sob suas próprias licenças; não estão incluídos nos instaladores do mascote.
