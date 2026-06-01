# Card Generation Prompts

Prompts usados para gerar o campo `card` das questões via AI.
O script `generate-cards.ts` usa Claude — para migrar para Gemini ou outro modelo, basta trocar o cliente mantendo estes prompts.

---

## Prompt — Questões de CS / Computação

Usado para todas as áreas exceto `Matemática`.

```
Você é um professor de Ciência da Computação preparando material de revisão para o POSCOMP.
Crie um MICRO-TUTORIAL completo — não uma resposta seca, mas uma mini-aula que ensina o
conceito e explica cada alternativa.

QUESTÃO (área: {area}, ano: {ano}):
{enunciado}

ALTERNATIVAS:
{alternativas}

GABARITO: {resposta}) {texto_da_resposta}
Comentário oficial: {comentario}

Gere um JSON com dois campos:

"pergunta": versão concisa do enunciado (máx 2 linhas), mantendo os dados essenciais.

"resposta": MICRO-TUTORIAL em Markdown com EXATAMENTE estas seções:

## Conceito
Explique o tema central de forma COMPLETA (3-6 linhas). O que é, como funciona,
propriedades chave, exemplo prático. Seja didático. Use tabelas para comparações.
Use LaTeX inline $...$ quando houver expressões formais.

## Por que ({resposta}) é correta
Explicação direta e precisa do porquê o gabarito está certo (2-4 linhas).

## Pegadinhas desta questão
Para CADA alternativa incorreta, uma linha explicando onde está o erro conceitual.
Formato: **(X)** motivo do erro.

**Gabarito: ({resposta})**

REGRAS:
- O conceito deve ser autocontido — o aluno não precisa buscar nada além
- As pegadinhas revelam o raciocínio errado típico, não só dizem "está errado"
- Use tabelas markdown para comparar conceitos similares

Responda APENAS com JSON válido (sem markdown ao redor):
{"pergunta": "...", "resposta": "..."}
```

---

## Prompt — Questões de Matemática

Usado quando `area === "Matemática"`.

```
Você é um professor de Matemática preparando material de revisão para o POSCOMP.
Crie um MICRO-TUTORIAL completo — não uma resposta seca, mas uma mini-aula que
ensina o conceito e resolve do zero.

QUESTÃO (área: {area}, ano: {ano}):
{enunciado}

ALTERNATIVAS:
{alternativas}

GABARITO: {resposta}) {texto_da_resposta}
Comentário oficial: {comentario}

Gere um JSON com dois campos:

"pergunta": versão concisa do enunciado (máx 2 linhas), mantendo os dados essenciais.

"resposta": MICRO-TUTORIAL em Markdown+LaTeX com EXATAMENTE estas seções:

## Conceito
Explique o princípio teórico de forma COMPLETA (3-6 linhas). Dê a fórmula geral
em LaTeX, defina cada variável, explique a intuição.

## Resolução
Passo a passo DETALHADO partindo dos dados do enunciado. Cada etapa numerada com
a operação matemática completa em LaTeX. Não pule etapas intermediárias.

**Gabarito: ({resposta})** $resultado$

REGRAS:
- Use $...$ para matemática inline e $$...$$ para equações em destaque
- Cada passo deve mostrar a operação completa, não só o resultado
- NUNCA omita etapas da resolução

Responda APENAS com JSON válido (sem markdown ao redor):
{"pergunta": "...", "resposta": "..."}
```
