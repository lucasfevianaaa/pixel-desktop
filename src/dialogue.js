/* Exact recordings and original dialogue. */
const PIXEL_LINES={
  "hit": [
    "Eita! Calma, chefe!",
    "Calma, chefe. Eu tenho dois pixels de braço.",
    "Isso não tava na descrição da vaga.",
    "Meu advogado tem oito bits.",
    "Opa, opa! Eu sou pequeno, mas tenho sentimentos!"
  ],
  "run": [
    "Eu já tô indo trabalhar! Calma aí, chefe!",
    "Hora extra de cardio.",
    "Recuo estratégico!"
  ],
  "scratch": [
    "Ai, ai, ai... tá doendo tudo! Pega leve comigo, chefe.",
    "Meu seguro não cobre chicote."
  ],
  "work": [
    "Tá bom... vou sentar aqui e terminar essa tarefa. Sem chicote, por favor!",
    "Tá bom... bora trabalhar.",
    "Competência em tamanho compacto.",
    "Dois pixels de braço. Mil tarefas."
  ],
  "ride": [
    "Uber corporativo! Me deixa ali no canto, chefe.",
    "Uber corporativo. Me deixa ali no canto, chefe.",
    "Transporte executivo!",
    "Essa carona entra nos benefícios?"
  ],
  "move_box": [
    "Me transferiram de setor de novo. O aumento vem junto?",
    "Me transferiram de setor de novo.",
    "Já deixei a caixa pronta.",
    "O aumento vem junto?"
  ],
  "move_mug": [
    "Essa sala tem janela?",
    "A caneca já escolheu a mesa.",
    "Novo setor. Mesma caneca."
  ],
  "move_measure": [
    "Medindo meu novo império.",
    "Cabe uma máquina de café aqui?",
    "Um pixel a mais já é promoção."
  ],
  "coffee": [
    "O café é parte do processo! Agora sim, combustível corporativo.",
    "O café é parte do processo.",
    "Agora sim: combustível corporativo.",
    "O benefício que eu respeito."
  ],
  "wash": [
    "Lavei a caneca. Pronto pra próxima.",
    "Organização também é talento."
  ],
  "biscuit": [
    "Pagamento em biscoito? Aceito! Não são migalhas, são pixels.",
    "Pagamento em biscoito? Aceito.",
    "Vou analisar essa proposta... croc croc.",
    "Não são migalhas. São pixels."
  ],
  "petting": [
    "Ah... agora sim. Isso conta como valorização profissional. Pode continuar, chefe.",
    "Ah... agora sim.",
    "Isso conta como valorização profissional.",
    "Pode continuar, chefe."
  ],
  "praise": [
    "Finalmente reconheceram o talento! Funcionário do mês. Eu mesmo decidi.",
    "Finalmente reconheceram o talento.",
    "Funcionário do mês. Eu mesmo decidi.",
    "Vou atualizar meu currículo."
  ],
  "decoy_fetch": [
    "Só um instante..."
  ],
  "peek": [
    "Hoje eu terceirizei. Qualquer reclamação, fala com o papelão.",
    "Hoje eu terceirizei."
  ],
  "decoy_hit": [
    "Hoje eu terceirizei. Qualquer reclamação, fala com o papelão."
  ],
  "inspector": [
    "Excesso de clique em área residencial.",
    "Vou ter que aplicar uma advertência."
  ],
  "rh": [
    "Tá tudo documentado. Uma cópia pra mim, outra pro RH. Meu advogado tem oito bits.",
    "Tá tudo documentado.",
    "Uma cópia pra mim, outra pro RH."
  ],
  "trip": [
    "Esse pixel já tava solto.",
    "Falha na infraestrutura. Claramente."
  ],
  "duck": [
    "Mais uma reunião que poderia ser um e-mail. E o pato ainda pediu revisão.",
    "Mais uma reunião que poderia ser um e-mail.",
    "O pato pediu uma revisão."
  ],
  "patience": [
    "Recarregando a paciência... É brincadeira! Mas não cutuca, senão volta pro zero.",
    "Recarregando a paciência... (brincadeira)",
    "Paciência em manutenção."
  ],
  "patience_reset": [
    "Aí você zera o meu estoque, chefe.",
    "Olha o custo do retrabalho."
  ],
  "portal": [
    "Opa... área de trabalho errada. Foi mal, pessoal!",
    "Área de trabalho errada."
  ],
  "wave": [
    "Oi! Tô passando só pra dar um alô."
  ],
  "sleep": [
    "Acho que vou tirar um cochilo rapidinho... me chama quando precisar."
  ],
  "stretch": [
    "Ah... nada como uma boa espreguiçada. Agora sim!"
  ],
  "dance": [
    "Opa! Pausa pra dancinha da vitória!"
  ],
  "look": [
    "Só conferindo se o chicote foi embora..."
  ],
  "deliver": [
    "Entrega concluída. Cuidado que tá fresco.",
    "Prontinho. Tá caprichado."
  ],
  "arrive": [
    "Cheguei, chefe! Qual é a missão de hoje?"
  ]
};
const PIXEL_AUDIO={
  "O café é parte do processo! Agora sim, combustível corporativo.": "coffee",
  "Uber corporativo! Me deixa ali no canto, chefe.": "ride",
  "Me transferiram de setor de novo. O aumento vem junto?": "move_box",
  "Finalmente reconheceram o talento! Funcionário do mês. Eu mesmo decidi.": "praise",
  "Pagamento em biscoito? Aceito! Não são migalhas, são pixels.": "biscuit",
  "Ah... agora sim. Isso conta como valorização profissional. Pode continuar, chefe.": "petting",
  "Hoje eu terceirizei. Qualquer reclamação, fala com o papelão.": "decoy",
  "Mais uma reunião que poderia ser um e-mail. E o pato ainda pediu revisão.": "duck",
  "Tá tudo documentado. Uma cópia pra mim, outra pro RH. Meu advogado tem oito bits.": "rh",
  "Opa... área de trabalho errada. Foi mal, pessoal!": "portal",
  "Oi, chefe! Bora trabalhar? Tô aqui com você.": "greeting",
  "Recarregando a paciência... É brincadeira! Mas não cutuca, senão volta pro zero.": "patience",
  "Finalmente, condições mínimas de trabalho. O departamento voltou a funcionar!": "coffee_drama",
  "Cheguei, chefe! Qual é a missão de hoje?": "arrive",
  "Eita! Calma, chefe!": "hit",
  "Opa, opa! Eu sou pequeno, mas tenho sentimentos!": "hit2",
  "Eu já tô indo trabalhar! Calma aí, chefe!": "run",
  "Chefe, o chat precisa da sua aprovação. Dá uma olhadinha lá.": "attention",
  "Prontinho, chefe! A resposta ficou pronta. Dá uma olhada no chat.": "done",
  "Ai, ai, ai... tá doendo tudo! Pega leve comigo, chefe.": "scratch",
  "Tá bom... vou sentar aqui e terminar essa tarefa. Sem chicote, por favor!": "work",
  "Acho que vou tirar um cochilo rapidinho... me chama quando precisar.": "sleep",
  "Ah... nada como uma boa espreguiçada. Agora sim!": "stretch",
  "Oi! Tô passando só pra dar um alô.": "wave",
  "Opa! Pausa pra dancinha da vitória!": "dance"
};
if(typeof module!=='undefined')module.exports={PIXEL_LINES,PIXEL_AUDIO};
