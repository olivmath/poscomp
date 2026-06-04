"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const questions = [
    { id: 1, ano: 2019, materia: 'Matemática', enunciado: 'Qual é o valor de lim(x→0) sen(x)/x?', alternativas: { A: '0', B: '1', C: '∞', D: 'indefinido', E: '-1' }, resposta: 'B', comentario: 'Limite fundamental: lim(x→0) sen(x)/x = 1', card: { pergunta: 'lim(x→0) sen(x)/x = ?', resposta: '**1** (limite fundamental trigonométrico)' } },
    { id: 2, ano: 2019, materia: 'Computação', enunciado: 'Qual estrutura de dados usa política LIFO?', alternativas: { A: 'Fila', B: 'Lista', C: 'Pilha', D: 'Árvore', E: 'Grafo' }, resposta: 'C', comentario: 'LIFO (Last In First Out) é a política da Pilha (Stack)', card: { pergunta: 'Estrutura LIFO', resposta: '**Pilha (Stack)** — o último a entrar é o primeiro a sair' } },
    { id: 3, ano: 2020, materia: 'Tecnologias', enunciado: 'Qual protocolo opera na camada de transporte do modelo TCP/IP?', alternativas: { A: 'HTTP', B: 'IP', C: 'TCP', D: 'DNS', E: 'ARP' }, resposta: 'C', comentario: 'TCP e UDP operam na camada de transporte', card: { pergunta: 'Protocolo camada de transporte', resposta: '**TCP** e **UDP** operam na camada de transporte do modelo TCP/IP' } },
    { id: 4, ano: 2020, materia: 'Matemática', enunciado: 'Quantos subconjuntos tem um conjunto com 4 elementos?', alternativas: { A: '8', B: '12', C: '16', D: '24', E: '32' }, resposta: 'C', comentario: 'Um conjunto com n elementos tem 2^n subconjuntos. 2^4 = 16', card: { pergunta: 'Subconjuntos de {a,b,c,d}', resposta: '**16** — fórmula: 2^n onde n = 4' } },
    { id: 5, ano: 2020, materia: 'Computação', enunciado: 'Qual algoritmo de ordenação tem complexidade O(n log n) no pior caso?', alternativas: { A: 'Bubble Sort', B: 'Insertion Sort', C: 'Quick Sort', D: 'Merge Sort', E: 'Selection Sort' }, resposta: 'D', comentario: 'Merge Sort garante O(n log n) mesmo no pior caso, ao contrário do Quick Sort', card: { pergunta: 'O(n log n) garantido no pior caso', resposta: '**Merge Sort** — divide e conquista com garantia de O(n log n)' } },
    { id: 6, ano: 2021, materia: 'Matemática', enunciado: 'Em lógica proposicional, qual das seguintes é uma tautologia?', alternativas: { A: 'p ∧ ¬p', B: 'p ∨ ¬p', C: 'p → q', D: 'p ∧ q', E: 'p ↔ q' }, resposta: 'B', comentario: 'p ∨ ¬p (princípio do terceiro excluído) é sempre verdadeiro', card: { pergunta: 'Tautologia clássica', resposta: '**p ∨ ¬p** — sempre verdadeiro (princípio do terceiro excluído)' } },
    { id: 7, ano: 2021, materia: 'Computação', enunciado: 'O que é um deadlock em sistemas operacionais?', alternativas: { A: 'Processo em execução', B: 'Processo aguardando I/O', C: 'Impasse onde processos aguardam recursos bloqueados entre si', D: 'Falta de memória', E: 'Erro de segmentação' }, resposta: 'C', comentario: 'Deadlock ocorre quando dois ou mais processos ficam em espera circular por recursos', card: { pergunta: 'Deadlock', resposta: '**Impasse circular** — processos esperando recursos uns dos outros indefinidamente' } },
    { id: 8, ano: 2021, materia: 'Tecnologias', enunciado: 'Qual é a função principal de um firewall?', alternativas: { A: 'Aumentar velocidade da rede', B: 'Filtrar tráfego de rede por regras de segurança', C: 'Comprimir dados', D: 'Gerenciar DNS', E: 'Balancear carga' }, resposta: 'B', comentario: 'Firewall filtra e controla o tráfego de rede baseado em regras de segurança', card: { pergunta: 'Função do firewall', resposta: '**Filtrar tráfego** de rede com base em regras de segurança predefinidas' } },
    { id: 9, ano: 2022, materia: 'Matemática', enunciado: 'Qual é a derivada de f(x) = e^x?', alternativas: { A: 'x·e^(x-1)', B: 'e^(x-1)', C: 'e^x', D: 'ln(x)', E: 'x·e^x' }, resposta: 'C', comentario: 'A função exponencial e^x é sua própria derivada', card: { pergunta: "d/dx de e^x", resposta: '**e^x** — a exponencial é sua própria derivada' } },
    { id: 10, ano: 2022, materia: 'Computação', enunciado: 'Qual paradigma de programação trata funções como cidadãos de primeira classe?', alternativas: { A: 'Imperativo', B: 'Orientado a objetos', C: 'Funcional', D: 'Lógico', E: 'Procedural' }, resposta: 'C', comentario: 'No paradigma funcional, funções são valores que podem ser passados e retornados', card: { pergunta: 'Funções como cidadãos de primeira classe', resposta: '**Paradigma funcional** — funções são valores como qualquer outro' } },
    { id: 11, ano: 2022, materia: 'Tecnologias', enunciado: 'O que significa SQL no contexto de bancos de dados?', alternativas: { A: 'Structured Query Language', B: 'Simple Query Logic', C: 'Sequential Query Language', D: 'Standard Query List', E: 'System Query Language' }, resposta: 'A', comentario: 'SQL = Structured Query Language, linguagem padrão para bancos de dados relacionais', card: { pergunta: 'SQL significa', resposta: '**Structured Query Language** — linguagem para bancos relacionais' } },
    { id: 12, ano: 2022, materia: 'Matemática', enunciado: 'Qual é o número de arestas de um grafo completo K5?', alternativas: { A: '5', B: '8', C: '10', D: '15', E: '20' }, resposta: 'C', comentario: 'K_n tem n(n-1)/2 arestas. K5 = 5×4/2 = 10', card: { pergunta: 'Arestas de K5', resposta: '**10** — fórmula: n(n-1)/2 = 5×4/2 = 10' } },
    { id: 13, ano: 2023, materia: 'Computação', enunciado: 'Em qual notação a expressão A+B*C é escrita como A B C * +?', alternativas: { A: 'Infixa', B: 'Pré-fixa (polonesa)', C: 'Pós-fixa (polonesa reversa)', D: 'Binária', E: 'Decimal' }, resposta: 'C', comentario: 'Notação pós-fixa (RPN): operandos antes do operador', card: { pergunta: 'A B C * + é notação', resposta: '**Pós-fixa (polonesa reversa, RPN)** — operador vem após os operandos' } },
    { id: 14, ano: 2023, materia: 'Tecnologias', enunciado: 'O que é virtualização em computação?', alternativas: { A: 'Compressão de arquivos', B: 'Criação de versão virtual de recurso físico', C: 'Protocolo de rede', D: 'Linguagem de programação', E: 'Algoritmo de segurança' }, resposta: 'B', comentario: 'Virtualização cria abstração de recursos físicos (CPU, memória, disco, rede)', card: { pergunta: 'Virtualização', resposta: '**Abstração virtual de recursos físicos** — permite múltiplos ambientes isolados em hardware compartilhado' } },
    { id: 15, ano: 2023, materia: 'Matemática', enunciado: 'Qual é a complexidade do algoritmo de busca binária?', alternativas: { A: 'O(1)', B: 'O(log n)', C: 'O(n)', D: 'O(n log n)', E: 'O(n²)' }, resposta: 'B', comentario: 'Busca binária divide o espaço de busca pela metade a cada passo: O(log n)', card: { pergunta: 'Complexidade da busca binária', resposta: '**O(log n)** — divide o espaço pela metade a cada iteração' } },
    { id: 16, ano: 2023, materia: 'Computação', enunciado: 'O que é um semáforo em sistemas operacionais?', alternativas: { A: 'Dispositivo de E/S', B: 'Mecanismo de sincronização entre processos', C: 'Protocolo de rede', D: 'Tipo de memória', E: 'Algoritmo de escalonamento' }, resposta: 'B', comentario: 'Semáforo é uma variável usada para sincronizar processos concorrentes', card: { pergunta: 'Semáforo em SO', resposta: '**Mecanismo de sincronização** — controla acesso a recursos compartilhados entre processos' } },
    { id: 17, ano: 2019, materia: 'Tecnologias', enunciado: 'Qual algoritmo criptográfico é assimétrico?', alternativas: { A: 'AES', B: 'DES', C: 'RSA', D: '3DES', E: 'Blowfish' }, resposta: 'C', comentario: 'RSA usa par de chaves (pública/privada). AES, DES são simétricos', card: { pergunta: 'Criptografia assimétrica', resposta: '**RSA** — usa chave pública para cifrar e privada para decifrar' } },
    { id: 18, ano: 2021, materia: 'Matemática', enunciado: 'Qual é a solução de x² - 5x + 6 = 0?', alternativas: { A: 'x=1, x=6', B: 'x=2, x=3', C: 'x=-2, x=-3', D: 'x=1, x=5', E: 'x=0, x=5' }, resposta: 'B', comentario: 'Bhaskara ou fatoração: (x-2)(x-3)=0, logo x=2 ou x=3', card: { pergunta: 'Raízes de x² - 5x + 6', resposta: '**x=2 e x=3** — fatoração: (x-2)(x-3)=0' } },
    { id: 19, ano: 2022, materia: 'Computação', enunciado: 'O que é polimorfismo em POO?', alternativas: { A: 'Herança múltipla', B: 'Encapsulamento de dados', C: 'Capacidade de objetos de diferentes tipos responderem à mesma mensagem', D: 'Criação de objetos', E: 'Destruição de objetos' }, resposta: 'C', comentario: 'Polimorfismo permite que objetos de diferentes classes sejam tratados uniformemente', card: { pergunta: 'Polimorfismo em POO', resposta: '**Mesma mensagem, comportamentos diferentes** conforme o tipo real do objeto' } },
    { id: 20, ano: 2023, materia: 'Tecnologias', enunciado: 'O que é o protocolo HTTP/2 em relação ao HTTP/1.1?', alternativas: { A: 'Remove suporte a HTTPS', B: 'Usa UDP ao invés de TCP', C: 'Introduz multiplexação de streams', D: 'Elimina cabeçalhos', E: 'Remove métodos GET e POST' }, resposta: 'C', comentario: 'HTTP/2 introduz multiplexação, compressão de cabeçalhos e server push', card: { pergunta: 'Principal melhoria do HTTP/2', resposta: '**Multiplexação de streams** — múltiplas requisições em uma única conexão TCP' } },
];
async function main() {
    const db = admin.firestore();
    const batch = db.batch();
    questions.forEach((q) => {
        batch.set(db.doc(`questions/${q.id}`), q);
    });
    batch.set(db.doc('metadata/counters'), { questionCount: questions.length });
    await batch.commit();
    console.log(`✓ Seeded ${questions.length} questions`);
    process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=seed.js.map