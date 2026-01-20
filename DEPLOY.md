# Guia de Deploy - Casa de Oxóssi

Este projeto está configurado para ser implantado na **Vercel** com facilidade. Siga os passos abaixo.

## Pré-requisitos
- Uma conta na [Vercel](https://vercel.com).
- O código fonte deste projeto subido em um repositório Git (GitHub, GitLab, Bitbucket).

## Passo a Passo

1.  **Importar Projeto na Vercel**
    - Acesse o painel da Vercel e clique em **"Add New..."** -> **"Project"**.
    - Selecione o repositório do projeto.

2.  **Configurar Build**
    - **Framework Preset**: Vite (deve ser detectado automaticamente).
    - **Root Directory**: `./` (padrão).
    - **Build Command**: `vite build` (ou `npm run build`).
    - **Output Directory**: `dist` (padrão).

3.  **Variáveis de Ambiente (Environment Variables)**
    - Expanda a seção **"Environment Variables"**.
    - Adicione as seguintes variáveis (copie os valores do seu arquivo `.env.local`):

    | Nome (Key) | Valor (Value) | Descrição |
    | :--- | :--- | :--- |
    | `VITE_SUPABASE_URL` | `https://iloonvjvkczcncprmayr.supabase.co` | URL do seu projeto Supabase |
    | `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUz...` (Sua chave Anon) | Chave pública anônima do Supabase |

4.  **Implantar**
    - Clique em **"Deploy"**.
    - Aguarde o processo de build finalizar.

## Solução de Problemas Comuns

-   **Tela Branca / Erro 404 ao atualizar página:**
    -   Certifique-se de que o arquivo `vercel.json` está na raiz do projeto com a configuração de *rewrites*. Isso é essencial para aplicações SPA (Single Page Application).

-   **Erro de conexão com Banco de Dados:**
    -   Verifique se as variáveis de ambiente foram preenchidas corretamente (sem espaços extras).
    -   Verifique se as chaves do Supabase estão ativas.

---
*Gerado automaticamente pelo Assistente de Código.*
