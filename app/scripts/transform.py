import json

def generate_card(q):
    area = q.get("area", "")
    ano = q.get("ano", "")
    enunciado = q.get("enunciado", "")
    alternativas_dict = q.get("alternativas", {})
    resposta_letra = q.get("resposta", "")
    texto_resposta = alternativas_dict.get(resposta_letra, "")
    comentario = q.get("comentario", "")

    cards = {
        21: {
            "pergunta": "Na busca sequencial em arquivo com chave única, qual a complexidade (número de registros) para o caso médio?",
            "resposta": """## Conceito
A busca sequencial percorre uma estrutura linear item por item até encontrar o alvo ou exaurir a coleção. É o método mais simples, não exigindo ordenação prévia. Em um arquivo com $n$ registros, o desempenho depende da posição da chave buscada.

| Caso | Registros Consultados | Descrição |
| :--- | :---: | :--- |
| Melhor | $1$ | O item é o primeiro da lista. |
| Pior | $n$ | O item é o último ou não existe. |
| Médio | $\\frac{n+1}{2}$ | Média aritmética das posições possíveis. |

## Por que (A) é correta
Assumindo uma distribuição uniforme (todas as chaves têm a mesma probabilidade de serem buscadas), o caso médio é a média de todas as posições possíveis: $\\sum_{i=1}^n \\frac{i}{n} = \\frac{n(n+1)}{2n} = \\frac{n+1}{2}$.

## Pegadinhas desta questão
**(B)** O melhor caso é $1$, não $n-1$.
**(C)** O termo "caso ótimo" costuma ser sinônimo de melhor caso ($1$).
**(D)** "Caso recorrente" não é um termo padrão para análise de busca sequencial.
**(E)** O pior caso é $n$, pois você precisa olhar todos os registros se o alvo estiver no fim.

**Gabarito: (A)**"""
        },
        22: {
            "pergunta": "Qual é o objetivo principal da análise assintótica de algoritmos?",
            "resposta": """## Conceito
A análise assintótica estuda a taxa de crescimento de uma função no limite, ou seja, quando o tamanho da entrada $n$ tende ao infinito ($n \\to \\infty$). Ela permite comparar a eficiência de algoritmos ignorando constantes multiplicativas e termos de menor ordem, focando no comportamento estrutural da complexidade (ex: $O(n^2)$ vs $O(n \\log n)$).

| Notação | Nome | Significado Técnico |
| :--- | :--- | :--- |
| $O(g(n))$ | Big-O | Limite superior (pior caso) |
| $\\Omega(g(n))$ | Big-Omega | Limite inferior (melhor caso) |
| $\\Theta(g(n))$ | Theta | Limite justo (comportamento exato) |

## Por que (E) é correta
O objetivo é entender como o tempo ou espaço consumido escala conforme o volume de dados aumenta. Para entradas pequenas, constantes importam; para entradas grandes, a ordem de crescimento domina completamente o desempenho.

## Pegadinhas desta questão
**(A)** Analisa qualquer caso (pior, médio ou melhor), mas o foco é a tendência de crescimento, não a junção de casos.
**(B)** Pelo contrário, ela ignora o comportamento para entradas pequenas para focar no \"longo prazo\".
**(C)** Ela determina a classe de desempenho, mas não o tempo exato para \"cada entrada possível\" individualmente.
**(D)** O caso médio é apenas uma das perspectivas analisáveis assintoticamente.

**Gabarito: (E)**"""
        },
        23: {
            "pergunta": "Qual a complexidade de tempo média e de pior caso da busca em uma tabela hash?",
            "resposta": """## Conceito
Tabelas Hash mapeiam chaves a índices usando uma função hash. Se a função for boa e a tabela tiver tamanho adequado, o acesso é direto. Contudo, quando duas chaves resultam no mesmo índice (colisão), o algoritmo deve usar estratégias como encadeamento (listas) ou endereçamento aberto, o que afeta o desempenho.

| Critério | Complexidade | Condição |
| :--- | :--- | :--- |
| Média | $O(1)$ | Poucas colisões, boa distribuição. |
| Pior Caso | $O(n)$ | Todas as chaves colidem no mesmo índice. |

## Por que (B) é correta
Em média, esperamos tempo constante $O(1)$ para inserir, deletar ou buscar. No pior caso (ex: todas as chaves mapeadas para a mesma posição), a estrutura se torna uma lista encadeada, exigindo $O(n)$ para localizar um elemento.

## Pegadinhas desta questão
**(A)** Ignora que colisões existem; o pior caso nunca é $O(1)$ garantido sem restrições severas.
**(C)** $O(\\log n)$ é típico de árvores balanceadas, não de Hash.
**(D)** Confunde Hash com árvores de busca no pior caso ($O(n)$ se degenerada).
**(E)** $O(2^n)$ é complexidade exponencial, totalmente desconexa da realidade das tabelas hash.

**Gabarito: (B)**"""
        },
        24: {
            "pergunta": "Como se chama a estrutura linear onde cada elemento tem um dado e um ponteiro para o próximo, com ordenação por campo-chave?",
            "resposta": """## Conceito
A **lista simplesmente encadeada** é uma sequência de nós onde cada um contém seu valor e uma referência (ponteiro) para o sucessor. Diferente de um array, os elementos não precisam estar contíguos na memória. Quando a inserção garante que as chaves fiquem em ordem crescente ou decrescente, chamamos de **ordenada**.

| Tipo de Lista | Ponteiros por Nó | Características |
| :--- | :---: | :--- |
| Simplesmente Encadeada | $1$ | Só avança; ocupa menos memória. |
| Duplamente Encadeada | $2$ | Permite navegar para frente e para trás. |
| Circular | $1$ ou $2$ | O último nó aponta de volta para o primeiro. |

## Por que (E) é correta
A questão descreve exatamente dois atributos: um único ponteiro para o próximo (simplesmente encadeada) e a existência de um campo-chave para manter a estrutura linear organizada (ordenada).

## Pegadinhas desta questão
**(A)** A duplamente encadeada teria dois ponteiros (anterior e próximo).
**(B)** Circular não foi mencionada (exigiria que o último apontasse para o primeiro).
**(C)** Lista de prioridades é um tipo abstrato (geralmente implementado com Heaps), não uma descrição de encadeamento físico.
**(D)** Se fosse não ordenada, a inserção seria apenas no início ou fim, ignorando a chave.

**Gabarito: (E)**"""
        },
        25: {
            "pergunta": "Sobre do...while, while e for, qual afirmação é correta quanto à execução do corpo e teste da condição?",
            "resposta": """## Conceito
Laços de repetição controlam o fluxo baseado em condições lógicas. A principal diferença entre eles reside em **quando** a condição é verificada: se antes (pré-teste) ou depois (pós-teste) da execução do bloco de código.

| Instrução | Tipo de Teste | Mínimo de Execuções |
| :--- | :--- | :---: |
| `while` | Pré-teste | $0$ |
| `for` | Pré-teste | $0$ |
| `do...while` | Pós-teste | $1$ |

## Por que (B) é correta
O `do...while` executa o bloco primeiro e testa depois, garantindo que o código rode ao menos uma vez. No `while` e no `for`, a condição é testada logo no início; se for falsa de cara, o corpo do laço nunca é executado.

## Pegadinhas desta questão
**(A)** Inverteu o `while` (ele testa antes, não depois).
**(C)** O `if` é uma condicional simples, não uma instrução de repetição.
**(D)** O `break` encerra o laço completamente; o `continue` é que pula para a próxima iteração.
**(E)** No `for`, a condição é testada ANTES de cada iteração.

**Gabarito: (B)**"""
        },
        26: {
            "pergunta": "Qual caminhamento visita a raiz primeiro e depois percorre as subárvores dos filhos recursivamente?",
            "resposta": """## Conceito
O caminhamento (ou percurso) em profundidade define a ordem em que os nós de uma árvore são processados. Os três tipos clássicos são diferenciados pela posição da raiz em relação às suas subárvores.

| Caminhamento | Ordem de Visitação |
| :--- | :--- |
| **Pré-fixado** (Pré-ordem) | Raiz → Esquerda → Direita |
| **Simétrico** (In-ordem) | Esquerda → Raiz → Direita |
| **Pós-fixado** (Pós-ordem) | Esquerda → Direita → Raiz |

## Por que (D) é correta
A descrição \"raiz visitada em primeiro lugar\" define o caminhamento pré-fixado. Ele é útil para clonar árvores ou prefixar operadores em expressões matemáticas.

## Pegadinhas desta questão
**(A)** No simétrico (central), a raiz fica no meio das subárvores.
**(B)** Largura percorre nível por nível (horizontal), não segue a recursão de subárvores descrita.
**(C)** Central é outro nome para o caminhamento Simétrico.
**(E)** No pós-fixado, a raiz é a última a ser processada.

**Gabarito: (D)**"""
        },
        27: {
            "pergunta": "Endereçamento de cache com mapeamento por conjunto associativo. Bits para tag, s, d e w.",
            "resposta": """## Conceito
O mapeamento por conjunto associativo divide a cache em $v$ conjuntos, cada um com $k$ linhas. O endereço da memória principal é dividido em campos para localizar os dados na cache.

| Campo | Nome | Função |
| :--- | :--- | :--- |
| **w** | Word (Palavra) | Identifica a palavra dentro do bloco (offset). |
| **s** | Set (Conjunto) | Identifica em qual conjunto do cache o bloco pode estar. |
| **tag** | Tag (Etiqueta) | Identifica qual bloco específico da memória está na cache. |

## Por que (A) é correta
1. **w**: Blocos de 128 palavras → $\\log_2(128) = 7$ bits.
2. **s**: 16 conjuntos → $\\log_2(16) = 4$ bits.
3. **Blocos**: 4K blocos = 4096 blocos → $\\log_2(4096) = 12$ bits para identificar o bloco.
4. **tag**: Como o bloco é identificado por (tag + conjunto), temos: $12 = \\text{tag} + 4 \\implies \\text{tag} = 8$ bits.
5. **Total**: tag(8) + s(4) + w(7) = 19 bits.

## Pegadinhas desta questão
Cálculos de logaritmos de base 2 são a principal fonte de erro. É fundamental lembrar que o número de bits é o expoente de 2 que resulta na quantidade de itens (ex: $2^7 = 128 \\implies 7$ bits).

**Gabarito: (A)**"""
        },
        28: {
            "pergunta": "Quais as funções da Ponte Norte (Northbridge) e Ponte Sul (Southbridge) na placa-mãe?",
            "resposta": """## Conceito
O chipset de uma placa-mãe tradicional é dividido em dois controladores principais que gerenciam o tráfego de dados entre os componentes do sistema.

| Chip | Velocidade | Conexões Principais |
| :--- | :--- | :--- |
| **Ponte Norte** | Alta | Processador, Memória RAM, Slot de Vídeo (PCI-e/AGP). |
| **Ponte Sul** | Baixa/Média | BIOS, USB, SATA (Discos), Áudio, Slots PCI, Teclado. |

## Por que (C) é correta
A assertiva III descreve exatamente a hierarquia: a Ponte Norte lida com os componentes que exigem maior largura de banda e menor latência (comunicação crítica), enquanto a Ponte Sul gerencia os periféricos e dispositivos de entrada/saída mais lentos.

## Pegadinhas desta questão
As assertivas I e II apenas invertem as funções dos dois chips. Atualmente, em processadores modernos, as funções da Ponte Norte foram integradas diretamente dentro da CPU, mas o conceito clássico ainda é cobrado.

**Gabarito: (C)**"""
        },
        29: {
            "pergunta": "Qual método permite transferência de dados entre E/S e memória sem passar pela CPU?",
            "resposta": """## Conceito
A transferência de dados em sistemas de computação pode ser gerenciada pela CPU ou por controladores especializados. O objetivo de delegar essa tarefa é liberar o processador para realizar cálculos enquanto dados são movidos de/para periféricos.

| Método | Participação da CPU | Eficiência |
| :--- | :--- | :--- |
| E/S Programada | Total (fica em loop) | Baixíssima |
| Interrupções | Parcial (atende o evento) | Média |
| **DMA** | Nula (após configurar) | Altíssima |

## Por que (D) é correta
O **DMA (Direct Memory Access)** permite que um controlador de hardware assuma o controle do barramento e mova blocos de dados diretamente entre o periférico e a RAM. A CPU só é notificada quando a transferência total termina.

## Pegadinhas desta questão
**(A)** Polling exige que a CPU verifique o dispositivo repetidamente em loop.
**(B)** Interrupções avisam a CPU, mas ela ainda é quem processa a movimentação dos dados via software.
**(C)** E/S mapeada em memória é apenas uma forma de endereçar dispositivos.
**(E)** E/S programada é o oposto do DMA.

**Gabarito: (D)**"""
        },
        33: {
            "pergunta": "Qual a saída do programa C que faz deslocamento para a direita (`>>= 1`) começando com 12 até chegar a 0?",
            "resposta": """## Conceito
O operador `>>` realiza um deslocamento de bits para a direita. Em termos matemáticos, deslocar um número inteiro $n$ em $k$ posições para a direita equivale a uma divisão inteira por $2^k$ (ou seja, $n / 2^k$).

| Passo | Decimal | Binário | Operação | `cont` |
| :---: | :---: | :---: | :---: | :---: |
| Início | $12$ | `1100` | — | $0$ |
| 1 | $6$ | `0110` | $12 >> 1$ | $1$ |
| 2 | $3$ | `0011` | $6 >> 1$ | $2$ |
| 3 | $1$ | `0001` | $3 >> 1$ | $3$ |
| 4 | $0$ | `0000` | $1 >> 1$ | $4$ |

## Por que (C) é correta
O laço `do...while` executa 4 vezes: 12→6, 6→3, 3→1, 1→0. Em cada passo, `cont` é incrementado. Quando o valor chega a 0, a condição `while (*valor2 > 0)` torna-se falsa e o laço encerra. A saída final de `cont` é **4**.

## Pegadinhas desta questão
**(A), (B)** Esquecer que o laço continua até que o valor seja zero.
**(D), (E)** Contar iterações extras ou errar a divisão de 3 por 2 (que em C resulta em 1, não 1.5).

**Gabarito: (C)**"""
        },
        34: {
            "pergunta": "Saída do programa C com função recursiva que conta caracteres de \"Ola mundo!\" (10 chars).",
            "resposta": """## Conceito
Em C, a manipulação de tipos em operações aritméticas e a formatação no `printf` seguem regras rígidas. Se uma variável recebe o resultado de uma divisão entre dois inteiros, a precisão pode ser afetada **antes** da atribuição ao tipo de destino (ex: double).

| Passo | Operação | Tipo Resultante | Valor |
| :--- | :--- | :--- | :--- |
| 1 | `f_rec(\"Ola mundo!\")` | `int` | $10$ |
| 2 | `10 / 2` | `int` (div. inteira) | $5$ |
| 3 | `resultado = 5` | `double` (promoção) | $5.0$ |

## Por que (A) é correta
A função conta 10 caracteres. A operação `10/2` é uma divisão entre inteiros, resultando em 5. Esse valor é guardado em um `double`. O `printf(\"%f\", resultado)` imprime o valor real formatado (ex: `5.000000`).

## Pegadinhas desta questão
**(B)** Embora o valor matemático seja inteiro, o especificador `%f` força a exibição como ponto flutuante.
**(C)** `char array` decai para ponteiro em C, o que é válido.
**(E)** O `printf` não dá erro se o tipo da variável (`double`) corresponder ao especificador (`%f`).

**Gabarito: (A)**"""
        },
        36: {
            "pergunta": "Qual das linguagens abaixo pode ser gerada por uma gramática regular?",
            "resposta": """## Conceito
Uma linguagem é **regular** se puder ser reconhecida por um Autômato Finito (DFA/NFA). A característica fundamental é a **memória finita**: o autômato pode contar ciclos (paridade, mod) mas não pode comparar contagens ilimitadas (ex: $\#a = \#b$).

| Linguagem | Tipo | Motivo |
| :--- | :--- | :--- |
| $\#a = \#b$ | Livre de Contexto | Exige pilha para comparar contagens. |
| $\#a \\mod k$ | **Regular** | Exige apenas $k$ estados para o contador. |
| $a^n b^n$ | Livre de Contexto | Memória infinita para contar $n$. |

## Por que (C) é correta
\"Número de 'a' divisível por 3\" requer 3 estados. \"Número de 'b' ímpar\" requer 2 estados. O produto dessas condições resulta em um AFD de $3 \\times 2 = 6$ estados. Como existe um AFD, a linguagem é regular.

## Pegadinhas desta questão
**(A), (D), (E)** Exigem comparar a quantidade total de 'a' com 'b'. Como os símbolos podem aparecer em qualquer ordem, um autômato de estados finitos não consegue \"lembrar\" o saldo.
**(B)** Exige comparar $n = 2m$, o que também requer pilha.

**Gabarito: (C)**"""
        },
        37: {
            "pergunta": "Assertivas sobre AFN, MT, Autômatos com Pilha e Problemas NP-completos.",
            "resposta": """## Conceito
A hierarquia de Chomsky e a teoria da complexidade classificam o poder dos modelos computacionais e a dificuldade dos problemas.

| Modelo / Classe | Propriedade Chave |
| :--- | :--- |
| AFN (Autômato Finito) | Aceita linguagens regulares; pode ter não-determinismo. |
| Autômato com Pilha | Aceita Linguagens Livres de Contexto (LLC). |
| **NP-completo** | Problemas em NP aos quais todos os outros em NP podem ser reduzidos. |

## Por que (E) é correta
- **III**: Como as linguagens regulares são um subconjunto das LLC, um autômato com pilha (que é mais poderoso) consegue reconhecer qualquer linguagem regular.
- **IV**: Por definição, a classe NP-completo é formada pelos problemas que estão **dentro** de NP e são \"NP-difíceis\". Portanto, é um subconjunto de NP.

## Pegadinhas desta questão
- **I**: AFDs por definição não podem ter $\\epsilon$-transições.
- **II**: Existem Máquinas de Turing não-determinísticas (MTND), embora tenham o mesmo poder de reconhecimento das determinísticas.

**Gabarito: (E)**"""
        },
        38: {
            "pergunta": "Quais autores e teorias tratam de limitações de sistemas formais e da parada de programas, respectivamente?",
            "resposta": """## Conceito
A lógica matemática e a teoria da computação estabeleceram limites fundamentais sobre o que pode ser provado ou computado. Dois marcos principais ocorreram na década de 1930.

| Autor | Teoria / Problema | Significado |
| :--- | :--- | :--- |
| **Kurt Gödel** | Incompletude | Existem verdades matemáticas que não podem ser provadas em sistemas lógicos consistentes. |
| **Alan Turing** | Problema da Parada | Não existe um algoritmo geral que determine se qualquer programa irá parar ou rodar para sempre. |

## Por que (B) é correta
O **Teorema da Incompletude** foi publicado por Gödel em 1931. O **Problema da Parada** foi formulado por Turing em 1936, definindo as fronteiras da computabilidade.

## Pegadinhas desta questão
**(A)** Inverteu os autores: Gödel fez a incompletude, Turing a parada.
**(C), (D), (E)** Misturam os conceitos ou incluem autores cujas contribuições principais são outras (como Church e o Cálculo Lambda).

**Gabarito: (B)**"""
        },
        39: {
            "pergunta": "Sobre o armazenamento em memória secundária pelo Sistema Operacional, o que é correto afirmar?",
            "resposta": """## Conceito
A memória secundária (HD, SSD) é organizada fisicamente em setores, mas o Sistema Operacional trabalha com abstrações para gerenciar o espaço de forma eficiente. A principal unidade de alocação de arquivos no sistema de arquivos é o **bloco** (ou cluster).

| Unidade | Camada | Descrição |
| :--- | :--- | :--- |
| Setor | Hardware | Menor unidade física do disco. |
| **Bloco** | SO / Lógica | Conjunto de setores tratados como uma unidade pelo SO. |
| Registro | Aplicação | Conjunto de campos lógicos dentro de um arquivo. |

## Por que (C) é correta
Transferir dados bit a bit do disco seria extremamente lento. O SO agrupa setores em blocos (ex: 4KB) para que cada operação de leitura/escrita mova uma quantidade razoável de dados, otimizando a performance.

## Pegadinhas desta questão
**(A)** \"Item individual\" é vago; o SO gerencia blocos.
**(B)** Todo programa executável é um arquivo armazenado no disco.
**(D)** Páginas e segmentos são conceitos de **memória virtual** (RAM).
**(E)** O armazenamento é quase sempre hierárquico (diretórios).

**Gabarito: (C)**"""
        },
        40: {
            "pergunta": "Sobre a compressão de dados, qual princípio permite reduzir o tamanho do armazenamento?",
            "resposta": """## Conceito
A compressão sem perdas (lossless) baseia-se na redução da redundância estatística. O princípio fundamental é a **Codificação de Comprimento Variável**: atribuir códigos binários curtos aos símbolos frequentes e longos aos raros.

| Técnica | Tipo | Funcionamento |
| :--- | :--- | :--- |
| **Huffman** | Sem perdas | Árvore baseada na frequência dos símbolos. |
| Run-Length (RLE) | Sem perdas | Codifica repetições (ex: AAAAA → 5A). |
| JPEG / MP3 | Com perdas | Remove dados imperceptíveis ao ser humano. |

## Por que (A) é correta
Se a letra 'e' aparece 15% das vezes e 'z' apenas 0.1%, usar 2 bits para 'e' e 10 bits para 'z' resulta em um arquivo total menor do que usar 8 bits fixos. É a base de algoritmos como Huffman.

## Pegadinhas desta questão
**(B)** Comprimento uniforme (ex: ASCII fixo) é o oposto da compressão.
**(D)** O algoritmo de Huffman é **sem perdas**; o arquivo original pode ser reconstruído exatamente.
**(E)** Existe compressão sem perda (texto) e com perda (mídia).

**Gabarito: (A)**"""
        },
        45: {
            "pergunta": "Sobre os tipos de dados básicos em programação, qual a definição correta para o tipo inteiro?",
            "resposta": """## Conceito
Tipos de dados definem o domínio de valores que uma variável pode assumir. O tipo **inteiro** representa números sem parte decimal, podendo ser sinalizado (signed) ou não (unsigned).

| Tipo | Domínio Matemático | Exemplo |
| :--- | :--- | :--- |
| **Inteiro** | Números Inteiros ($\\mathbb{Z}$) | $-5, 0, 42$ |
| Real / Float | Números Reais ($\\mathbb{R}$) | $3.14, -0.001$ |
| Caractere | Símbolos | 'A', '$' |

## Por que (A) é correta
Por definição, o tipo `int` (inteiro) armazena valores numéricos que pertencem ao conjunto dos inteiros, abrangendo tanto os naturais positivos quanto seus opostos negativos e o zero.

## Pegadinhas desta questão
**(B)** Caractere armazena **um único** símbolo; strings são vetores de caracteres.
**(C)** O padrão geralmente é sinalizado; para somente positivos, usa-se `unsigned`.
**(D)** Vetor é uma estrutura homogênea, não um tipo para fracionários.
**(E)** Multiplicação e divisão de símbolos não são operações lógicas padrão.

**Gabarito: (A)**"""
        },
        47: {
            "pergunta": "Qual estrutura de controle deve ser usada para um programa que valida entrada e aplica taxas diferentes baseadas em faixas de valor?",
            "resposta": """## Conceito
O fluxo de um programa pode ser desviado com base em testes lógicos. Quando temos múltiplos critérios que dependem uns dos outros ou faixas de valores excludentes, utilizamos estruturas de decisão aninhadas.

| Structure | Uso |
| :--- | :--- |
| Condicional Simples | Um único teste (`if`). |
| Condicional Composta | Dois caminhos possíveis (`if-else`). |
| **Condicional Encadeada** | Múltiplos caminhos dependentes (`if-else if-else`). |

## Por que (D) é correta
A questão pede: 1) Checar se é positivo, 2) Se > 1000 (taxa A), 3) Caso contrário (taxa B). Isso exige uma sequência de decisões dependentes, caracterizando uma condicional encadeada.

## Pegadinhas desta questão
**(A)** Laços (loops) servem para repetir código.
**(B)** Atribuição composta apenas simplifica operações, não controla fluxo.
**(C)** Laço infinito travaria o programa.
**(E)** Atribuição simples apenas guarda um valor.

**Gabarito: (D)**"""
        },
        48: {
            "pergunta": "Como se chama o grafo que possui simultaneamente arestas dirigidas e não dirigidas?",
            "resposta": """## Conceito
Grafos são estruturas compostas por vértices e arestas. A natureza das conexões define a classificação do grafo.

| Tipo de Grafo | Natureza das Arestas |
| :--- | :--- |
| Simples | Arestas sem direção (mão dupla). |
| Dígrafo | Arestas com direção (arcos / mão única). |
| **Misto** | Contém ambos os tipos de arestas. |

## Por que (C) é correta
Um mapa de cidade é o exemplo clássico: algumas ruas permitem tráfego em ambos os sentidos (não dirigidas) e outras são de sentido único (dirigidas). Um grafo que modela isso é chamado de **grafo misto**.

## Pegadinhas desta questão
**(A)** Dígrafos contêm apenas arestas dirigidas.
**(B)** Grafo completo é aquele onde todos os pares de vértices possuem uma aresta entre si.
**(D)** Bígrafo (Bipartido) divide vértices em dois conjuntos independentes.

**Gabarito: (C)**"""
        },
        49: {
            "pergunta": "Como se chamam duas arestas que conectam o mesmo par de vértices?",
            "resposta": """## Conceito
Em teoria dos grafos, as relações entre vértices podem ser múltiplas. A terminologia correta identifica como essas arestas se posicionam no modelo.

| Termo | Descrição |
| :--- | :--- |
| **Paralelas** (Múltiplas) | Duas ou mais arestas ligando os mesmos dois vértices. |
| Laço | Uma aresta que liga um vértice a ele mesmo. |
| Adjacentes | Vértices ligados por uma aresta. |

## Por que (A) é correta
A definição de arestas paralelas é justamente a existência de mais de uma conexão entre os mesmos pontos finais. Em grafos dirigidos, devem ter a mesma direção.

## Pegadinhas desta questão
**(B)** Laço ocorre quando os dois pontos finais da aresta são o mesmo vértice.
**(C)** Adjacentes refere-se à relação de vizinhança.
**(D)** Incidência é a relação entre um vértice e a aresta que o toca.

**Gabarito: (A)**"""
        },
        50: {
            "pergunta": "Como se chama um caminho em que os vértices de início e fim são os mesmos?",
            "resposta": """## Conceito
Sequências de vértices e arestas em um grafo recebem nomes específicos baseados em suas propriedades de repetição e fechamento.

| Termo | Repete Vértices? | É Fechado? (Início=Fim) |
| :--- | :---: | :---: |
| Caminho Simples | Não | No |
| **Ciclo** | Não (exceto fim) | Sim |
| Circuito | Sim (pode repetir) | Sim |

## Por que (B) é correta
Um **ciclo** é um caminho fechado. Ele começa em um vértice $v$, passa por uma sequência de outros vértices sem repetir nenhum, e retorna exatamente ao vértice $v$.

## Pegadinhas desta questão
**(A)** Arco é uma aresta dirigida.
**(C)** Caminho simples proíbe a repetição de qualquer vértice, logo não pode retornar ao início.
**(D)** Laço é um ciclo de comprimento 1.

**Gabarito: (B)**"""
        }
    }

    q_id = q.get("id")
    if q_id in cards:
        q["card"] = cards[q_id]
    return q

with open('/Users/olivmath/Documents/dev/poscomp/scripts/data/raw/fundamentos_da_computao_part01.json', 'r') as f:
    data = json.load(f)

new_data = [generate_card(item) for item in data]

with open('/Users/olivmath/Documents/dev/poscomp/scripts/data/ok/fundamentos_da_computao_part01.json', 'w') as f:
    json.dump(new_data, f, indent=2, ensure_ascii=False)
