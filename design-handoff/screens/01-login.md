# Tela — Login (`/login`)

## Layout

```
┌─────────────────────────────┐
│                             │
│                             │
│         [LOGO]             │
│                             │
│         POSCOMP            │
│ Prepare-se para o sucesso  │
│                             │
│ ┌───────────────────────┐  │
│  │ G  Entrar com Google │  │
│ └───────────────────────┘  │
│                             │
│    [mensagem de erro]      │
└─────────────────────────────┘
```

## Componentes

| Componente    | Descrição                                      |
|---------------|------------------------------------------------|
| LoginLogo     | logo SVG do app                                |
| h1            | "POSCOMP"                                      |
| p             | "Prepare-se para o sucesso"                    |
| LoginCard     | card centralizado com botão Google + estado    |

## Estados

| Estado   | Visual                                          |
|----------|-------------------------------------------------|
| idle     | botão "Entrar com Google" ativo                 |
| loading  | botão mostra spinner / desabilitado             |
| error    | texto vermelho abaixo do botão                  |

## Comportamento

- Fundo: cor de fundo `--md-sys-color-surface`
- Card centralizado vertical e horizontalmente
- Se já autenticado → redirect para `/` sem renderizar a tela
