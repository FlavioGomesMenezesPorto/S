/* =========================================================
   CATÁLOGO DE EBOOKS — edite aqui
   ---------------------------------------------------------
   Campos:
   id          identificador único (sem espaços)
   titulo      nome do ebook
   subtitulo   frase curta abaixo do título
   categoria   usada nos filtros (ex.: "Leitura", "Mente", "Influência", "Kits")
   preco       preço atual em reais (número)
   precoAntigo preço riscado (opcional, use null para esconder)
   paginas     número de páginas (opcional)
   simbolo     símbolo da capa gerada automaticamente
   cores       duas cores do degradê da capa gerada
   capa        caminho de uma imagem de capa real (ex.: "img/capas/leitura-fria.jpg").
               Se preenchido, substitui a capa gerada.
   destaque    true para aparecer na seção "Em destaque" (use em apenas um)
   selo        etiqueta no card (ex.: "Novo", "Mais vendido") ou null
   descricao   texto do modal de detalhes
   topicos     lista do que a pessoa vai aprender
   linkCompra  link de checkout (Hotmart, Kiwify, Mercado Pago, Stripe...).
               Enquanto vazio, o site usa o carrinho com aviso de "pagamento em breve".
   ========================================================= */

const PRODUTOS = [
  {
    id: "leitura-fria",
    titulo: "A Arte da Leitura Fria",
    subtitulo: "Como parecer ler mentes usando apenas observação",
    categoria: "Leitura",
    preco: 39.9,
    precoAntigo: 59.9,
    paginas: 84,
    simbolo: "◉",
    cores: ["#1a2c52", "#080d1a"],
    capa: "",
    destaque: true,
    selo: "Mais vendido",
    descricao:
      "O guia definitivo da técnica mais famosa do mentalismo. Entenda a estrutura das afirmações que parecem pessoais, aprenda a calibrar reações em tempo real e conduza uma leitura com naturalidade e ética.",
    topicos: [
      "Estrutura das afirmações de Barnum e Forer",
      "Calibragem: lendo microrreações enquanto fala",
      "Roteiros prontos para leituras de 5 minutos",
      "Ética e responsabilidade na apresentação",
    ],
    linkCompra: "",
  },
  {
    id: "linguagem-corporal",
    titulo: "Linguagem Corporal Revelada",
    subtitulo: "O que o corpo diz quando a boca se cala",
    categoria: "Leitura",
    preco: 34.9,
    precoAntigo: null,
    paginas: 72,
    simbolo: "❂",
    cores: ["#3b2416", "#120b07"],
    capa: "",
    destaque: false,
    selo: null,
    descricao:
      "Um mapa prático dos sinais não verbais: postura, mãos, olhar e distância. Aprenda a separar mitos de evidências e a usar a observação no dia a dia.",
    topicos: [
      "Sinais de conforto e desconforto",
      "Mitos comuns sobre detectar mentiras",
      "Leitura de grupos e de ambientes",
      "Exercícios diários de observação",
    ],
    linkCompra: "",
  },
  {
    id: "mente-consciente",
    titulo: "Mente Consciente",
    subtitulo: "Foco, presença e atenção plena para observadores",
    categoria: "Mente",
    preco: 29.9,
    precoAntigo: null,
    paginas: 64,
    simbolo: "☾",
    cores: ["#14324a", "#070f17"],
    capa: "",
    destaque: false,
    selo: "Novo",
    descricao:
      "A base de todo mentalista é a atenção. Neste ebook você treina presença e foco com práticas curtas que melhoram sua percepção do mundo e das pessoas.",
    topicos: [
      "Protocolo de atenção em 10 minutos por dia",
      "Como reduzir o ruído mental",
      "Percepção periférica e consciência situacional",
      "Diário do observador",
    ],
    linkCompra: "",
  },
  {
    id: "memoria-extraordinaria",
    titulo: "Memória Extraordinária",
    subtitulo: "Palácios da memória e técnicas de memorização",
    categoria: "Mente",
    preco: 32.9,
    precoAntigo: 44.9,
    paginas: 78,
    simbolo: "✦",
    cores: ["#3a1430", "#12060f"],
    capa: "",
    destaque: false,
    selo: null,
    descricao:
      "Decore nomes, números e sequências como os grandes memoristas. Métodos clássicos explicados passo a passo, com desafios progressivos.",
    topicos: [
      "Método de loci (palácio da memória)",
      "Sistema major para números",
      "Memorizando nomes e rostos",
      "Demonstrações de memória para apresentar",
    ],
    linkCompra: "",
  },
  {
    id: "persuasao-etica",
    titulo: "Persuasão Ética",
    subtitulo: "Influência real sem manipulação",
    categoria: "Influência",
    preco: 37.9,
    precoAntigo: null,
    paginas: 90,
    simbolo: "⟁",
    cores: ["#1f3a2a", "#08120c"],
    capa: "",
    destaque: false,
    selo: null,
    descricao:
      "Os princípios psicológicos por trás da influência, aplicados com respeito. Comunique melhor, conduza conversas e reconheça quando estão tentando manipular você.",
    topicos: [
      "Os gatilhos de influência mais estudados",
      "Rapport: criando conexão genuína",
      "Linguagem sugestiva e enquadramento",
      "Defendendo-se de manipulação",
    ],
    linkCompra: "",
  },
  {
    id: "kit-iniciante",
    titulo: "Kit Mentalista Iniciante",
    subtitulo: "Os 3 ebooks essenciais em um só pacote",
    categoria: "Kits",
    preco: 79.9,
    precoAntigo: 104.7,
    paginas: null,
    simbolo: "◬",
    cores: ["#4a3a12", "#141005"],
    capa: "",
    destaque: false,
    selo: "Economize 24%",
    descricao:
      "Leitura Fria, Linguagem Corporal e Mente Consciente reunidos com desconto. O caminho mais completo para quem está começando no mentalismo.",
    topicos: [
      "A Arte da Leitura Fria",
      "Linguagem Corporal Revelada",
      "Mente Consciente",
      "Bônus: roteiro de estudos de 30 dias",
    ],
    linkCompra: "",
  },
];

/* =========================================================
   FRASES — posts do Instagram @mentalistconsciente
   Aparecem na página inicial e no topo da Comunidade.
   Para adicionar uma frase nova, inclua uma linha na lista.
   ========================================================= */
const FRASES = [
  "O sol sempre nasce. Mas a mente só desperta quando decide mudar.",
  "Silêncio estratégico também é posicionamento.",
  "Menos afirmação vazia. Mais responsabilidade diária.",
  "Nem todo mundo tá perdido. Alguns só evitam o trabalho interno.",
  "Consciência dói antes de libertar.",
  "Pensar diferente não basta. Executar diferente é o jogo.",
];

/* Configurações gerais */
const CONFIG = {
  instagram: "https://instagram.com/mentalistconsciente",
  usuarioInstagram: "@mentalistconsciente",
  email: "", // ex.: "contato@mentalistconsciente.com.br"
};
