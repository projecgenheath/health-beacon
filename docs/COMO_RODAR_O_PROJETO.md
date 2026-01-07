# 🚀 Como Rodar o Preview do Projeto

Atualmente, você não consegue ver o preview porque o **servidor de desenvolvimento não está rodando**. Isso acontece porque o Node.js/npm não foi encontrado no seu sistema.

Siga estes passos para corrigir:

## 1. Instalar Node.js (se necessário)

1. Acesse https://nodejs.org/
2. Baixe a versão **LTS** (Recomendada)
3. Instale no seu computador
4. **IMPORTANTE**: Durante a instalação, certifique-se de manter marcada a opção "Add to PATH"

## 2. Reiniciar o Ambiente

Após instalar, o terminal antigo não reconhece a instalação.
1. Feche completamente o VS Code ou terminal
2. Abra novamente
3. Tente rodar: `node --version` (deve mostrar algo como v20.x.x)

## 3. Iniciar o Servidor

Agora você pode iniciar o projeto:

```powershell
# Instalar dependências (apenas na primeira vez ou se der erro de módulos faltando)
npm install

# Rodar o servidor de desenvolvimento
npm run dev
```

Você verá uma mensagem como:
```
  VITE v5.4.19  ready in 345 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## 4. Acessar o Preview

- Clique no link `http://localhost:5173/` que aparecer no terminal
- OU abra seu navegador e digite esse endereço

---

## 💡 Alternativas

Se você usa **Bun**:
```powershell
bun install
bun run dev
```

Se você usa **Yarn**:
```powershell
yarn
yarn dev
```
