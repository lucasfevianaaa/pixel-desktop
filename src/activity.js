function mapEvent(e){
 const name=String(e.tool_name||'').toLowerCase();let action='Uma ferramenta local foi acionada',scene='work';
 if(/capcut|davinci/.test(name)){action='Uma ferramenta de vídeo foi acionada';scene='video';}
 else if(/search|browse|web_run/.test(name)){action='Uma ferramenta de pesquisa foi acionada';scene='research';}
 else if(/apply_patch/.test(name)){action='Editando um arquivo';scene='coding';}
 else if(/write.*document|document.*write|create_document/.test(name)){action='Trabalhando em um documento';scene='writing';}
 else if(/bash|exec_command|exec$/.test(name))action='Executando um comando local';
 else if(/read|list|find/.test(name)){action='Consultando informações locais';scene='research';}
 switch(e.event){
 case 'SessionStart':return {text:'Uma conversa local foi aberta.',kind:'ready',category:'start'};
 case 'UserPromptSubmit':return {text:'Recebi um pedido. Bora trabalhar!',kind:'working',scene:'work',category:'start'};
 case 'PreToolUse':return {text:action+'…',kind:'working',scene,category:'ongoing'};
 case 'PermissionRequest':return {text:'O chat aguarda sua aprovação.',kind:'waiting',scene:'wait',category:'waiting',voice:true,voiceKey:'attention'};
 case 'Stop':return {text:'A resposta ficou pronta. Olha o chat!',kind:'done',category:'completed',voice:true};
 case 'Interrupt':return {text:'Essa tarefa foi interrompida.',kind:'attention',scene:'wait',category:'attention'};
 case 'SessionEnd':return {text:'Essa conversa local foi encerrada.',kind:'ready',category:'completed'};
 default:return null;
 }
}
function describe(e){const m=mapEvent(e);if(m&&/^[a-f0-9]{16}$/.test(e.session||''))m.session=e.session;if(m&&/^[a-f0-9]{16}$/.test(e.turn||''))m.turn=e.turn;return m;}
module.exports={describe};
