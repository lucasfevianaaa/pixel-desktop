# Integração opcional por hooks

Pixelito funciona sem integração. As cenas de trabalho só usam eventos reais quando um aplicativo fornece hooks locais compatíveis.

## Preparação

1. Instale Python 3.
2. Localize `notify.py` no aplicativo instalado:
   - Mac: `/Applications/Pixel.app/Contents/Resources/hooks/notify.py`
   - Windows: `resources\hooks\notify.py` dentro da pasta de instalação escolhida.
3. No aplicativo que oferece hooks, configure um comando que execute esse arquivo com Python 3.
4. Revise o comando e ative a confiança nas configurações de Hooks do aplicativo. O Pixel não altera essa confiança automaticamente.

Exemplo de comando no Mac:

```sh
python3 "/Applications/Pixel.app/Contents/Resources/hooks/notify.py"
```

Exemplo no Windows, substituindo o caminho pelo da sua instalação:

```powershell
py -3 "C:\caminho\Pixel\resources\hooks\notify.py"
```

O bridge espera receber o JSON do hook pela entrada padrão. Aceita `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `Stop`, `Interrupt` e `SessionEnd`.

Cada host tem sua própria configuração e lista de eventos. Configure apenas os eventos suportados. `PreToolUse` representa que uma ferramenta foi acionada; não garante que ela terminou com sucesso. `Stop` é usado para mostrar que a resposta terminou. Interrupções são tratadas como atenção, sem inventar um erro técnico.

## Dados locais

A saída é uma pequena mensagem JSON na pasta `events` dentro dos dados do Pixel. Os prompts, argumentos e resultados não são gravados. O identificador de sessão recebe hash antes de ser salvo. A fila tem limite de 64 mensagens e mensagens antigas são descartadas.

Não envie arquivos de configurações, credenciais ou histórico para o repositório ao pedir ajuda.
