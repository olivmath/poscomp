# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: premium.spec.ts >> perfil premium → sem botão Ver planos
- Location: tests/e2e/premium.spec.ts:174:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Plano Pro')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText('Plano Pro')

```

```yaml
- button "arrow_back"
- text: Perfil person
- heading "Usuário" [level=2]
- paragraph: e2e+premv1780611193037@local.test
- text: workspace_premium Assinatura
- paragraph: Plano Free
- button "Ver planos"
- text: settings Preferências dark_mode Tema escuro
- switch
- text: notifications Notificações
- paragraph: Bloqueado no navegador
- switch [disabled]
- text: info Sobre info Versão
- button "v1.0.0"
- text: policy Política de Privacidade
- button "chevron_right"
- text: gavel Termos de Uso
- button "chevron_right"
- text: manage_accounts Conta
- button "logout Sair da conta"
- text: warning Cuidado
- paragraph: Remove permanentemente todos os dados e encerra a conta.
- button "Apagar todos os dados"
```

# Test source

```ts
  87  |   await page.getByRole('button', { name: 'Continuar' }).click()
  88  |   await expect(page.getByText('Benefícios inclusos')).toBeVisible()
  89  | 
  90  |   await page.mouse.click(10, 10)
  91  |   await expect(page.getByText('Benefícios inclusos')).not.toBeVisible({ timeout: 3000 })
  92  | })
  93  | 
  94  | // Sad: botão fechar (X) no step 1 fecha o modal
  95  | test('botão X no step 1 fecha o modal', async ({ page }) => {
  96  |   await loginFreePerfil(page)
  97  |   await page.getByRole('button', { name: 'Ver planos' }).click()
  98  | 
  99  |   await expect(page.getByText('Escolha seu plano')).toBeVisible()
  100 |   // O botão X no header do modal tem aria implícito com ícone "close"
  101 |   // Localiza o botão dentro do cabeçalho do modal
  102 |   await page.locator('button').filter({ has: page.locator('.material-symbols-outlined') }).last().click()
  103 |   await expect(page.getByText('Escolha seu plano')).not.toBeVisible({ timeout: 3000 })
  104 | })
  105 | 
  106 | // Happy: step 2 → step 3 PIX (se CF disponível)
  107 | test('step 2 → step 3 PIX (se CF disponível)', async ({ page }) => {
  108 |   await loginFreePerfil(page)
  109 |   await page.getByRole('button', { name: 'Ver planos' }).click()
  110 | 
  111 |   await proBtn(page).click()
  112 |   await page.getByRole('button', { name: 'Continuar' }).click()
  113 |   await expect(page.getByText('Benefícios inclusos')).toBeVisible()
  114 | 
  115 |   await page.getByRole('button', { name: 'Continuar' }).click()
  116 | 
  117 |   // aguarda step 3 (PIX) ou erro de CF
  118 |   await page.waitForTimeout(5000)
  119 |   const hasPix = await page.getByText('Pagamento via PIX').isVisible().catch(() => false)
  120 |   const hasError = await page.getByText(/Erro ao gerar/i).isVisible().catch(() => false)
  121 | 
  122 |   if (hasPix) {
  123 |     await expect(page.getByRole('button', { name: 'Pagamento enviado' })).toBeVisible()
  124 |     // avança para step 4
  125 |     await page.getByRole('button', { name: 'Pagamento enviado' }).click()
  126 |     await expect(page.getByText('Enviar comprovante')).toBeVisible()
  127 |   } else if (hasError) {
  128 |     // CF falhou — step 3 não chegou, mas o erro foi exibido corretamente
  129 |     await expect(page.getByText(/Erro ao gerar/i)).toBeVisible()
  130 |   } else {
  131 |     test.skip(true, 'CF getPixConfig não respondeu')
  132 |   }
  133 | })
  134 | 
  135 | // Happy: step 4 → sem botão fechar → step 5 confirmação (se CF disponível)
  136 | test('step 4 upload → step 5 confirmação (se CF disponível)', async ({ page }) => {
  137 |   await loginFreePerfil(page)
  138 |   await page.getByRole('button', { name: 'Ver planos' }).click()
  139 | 
  140 |   await proBtn(page).click()
  141 |   await page.getByRole('button', { name: 'Continuar' }).click()
  142 |   await page.getByRole('button', { name: 'Continuar' }).click()
  143 |   await page.waitForTimeout(5000)
  144 | 
  145 |   if (!(await page.getByText('Pagamento via PIX').isVisible().catch(() => false))) {
  146 |     test.skip(true, 'CF getPixConfig indisponível')
  147 |     return
  148 |   }
  149 | 
  150 |   await page.getByRole('button', { name: 'Pagamento enviado' }).click()
  151 |   await expect(page.getByText('Enviar comprovante')).toBeVisible()
  152 | 
  153 |   // Sad: no step 4, botão fechar (X) não está visível
  154 |   const closeBtn = page.locator('button').filter({ has: page.locator('.material-symbols-outlined') }).last()
  155 |   // o header do modal não mostra o X quando canClose=false (step 4 ou 5)
  156 |   // verifica que "Escolha seu plano" não está visível (estamos em step 4)
  157 |   await expect(page.getByText('Escolha seu plano')).not.toBeVisible()
  158 | 
  159 |   // faz upload do arquivo de comprovante
  160 |   const input = page.locator('input[type="file"]')
  161 |   await input.setInputFiles('tests/e2e/assets/receipt.png')
  162 |   await page.waitForTimeout(8000)
  163 | 
  164 |   const hasStep5 = await page.getByText('Pedido enviado!').isVisible().catch(() => false)
  165 |   if (hasStep5) {
  166 |     await expect(page.getByText('Estamos liberando seu acesso!')).toBeVisible()
  167 |     // step 5: único botão de saída é "Fechar"
  168 |     await page.getByRole('button', { name: 'Fechar' }).click()
  169 |     await expect(page.getByText('Pedido enviado!')).not.toBeVisible()
  170 |   }
  171 | })
  172 | 
  173 | // Happy: perfil premium não mostra botão "Ver planos"
  174 | test('perfil premium → sem botão Ver planos', async ({ page }) => {
  175 |   const email = `e2e+premV${Date.now()}@local.test`
  176 |   await page.goto(`/__e2e__/auth?email=${encodeURIComponent(email)}&pwd=pass1234&premium=true`)
  177 |   await page.waitForURL('/')
  178 |   await page.goto('/perfil')
  179 | 
  180 |   // aguarda userDoc carregar (planLabel sai de "…")
  181 |   await page.waitForFunction(
  182 |     () => !document.body.innerText.includes('…'),
  183 |     { timeout: 8000 }
  184 |   ).catch(() => {})
  185 | 
  186 |   // Aguarda o plano carregar (userDoc pode ter race condition ao carregar)
> 187 |   await expect(page.getByText('Plano Pro')).toBeVisible({ timeout: 15000 })
      |                                             ^ Error: expect(locator).toBeVisible() failed
  188 |   await expect(page.getByRole('button', { name: 'Ver planos' })).not.toBeVisible()
  189 | })
  190 | 
```