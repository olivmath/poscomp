Lista de todos os problemas pendentes:

  ---
  1. Revisão — fundo preto no loading

  Onde: src/index.css → .revisao-container
  O quê: background: var(--color-page-gradient) no container, mas no dark mode o gradiente começa com #1C1B1F que some antes de carregar. O estado loading e empty herdam esse background e em dark
  mode aparece como tela preta.

  ---
  2. Sair da conta — componente diferenciado
  
  Onde: src/pages/Perfil.tsx + src/index.css
  O quê: O item "Sair da conta" está como md-list-item comum na seção Conta. Usuário quer um visual diferenciado (semelhante à Zona de Perigo, mas com tom neutro ou de aviso).

  ---
  3. Loading ao finalizar simulado
  
  Onde: src/components/simulado/RunningScreen.tsx (último botão de confidence) ou src/hooks/useSimulado.ts
  O quê: Ao clicar no último botão de confiança, não há feedback visual de que está enviando/finalizando o simulado. Precisa de estado finishing com indicador de carregamento nos botões.

