# Mega Roleta - Manual de Instruções

Este é um projeto isolado 100% HTML, CSS e JavaScript puro (Vanilla), sem dependências, frameworks ou banco de dados externo. Tudo funciona localmente no navegador do usuário e salva os dados através de `localStorage`.

## Como Integrar em Outros Projetos

Este projeto foi construído para ser altamente exportável. Para adicioná-lo ao seu site (como um e-commerce, blog ou portfolio), você tem duas opções principais:

### Opção 1: Link Direto (Recomendado)
A maneira mais fácil e segura de usar. Copie toda a pasta `mega-roleta` para dentro dos arquivos do seu site.
No seu site (ex: no seu menu), adicione um link normal apontando para o `index.html` desta pasta:

```html
<!-- Exemplo no seu projeto principal -->
<a href="/caminho/para/mega-roleta/index.html">Acessar a Mega Roleta</a>
O usuário irá para a página da roleta. Na página da roleta existe um botão de "Voltar" que você pode configurar para retornar ao seu site.

Opção 2: Iframe (Embutido na mesma página)
Se você quer que a roleta apareça dentro de um quadrado no meio da sua página, sem o usuário precisar sair dela:

<!-- Coloque isso onde quer que a roleta apareça no seu projeto -->
<iframe src="/caminho/para/mega-roleta/index.html" width="100%" height="800px" frameborder="0"></iframe>
Funcionalidades
Salva Tudo: Não se preocupe em perder dados. Tudo o que você cria (Roletas, Opções, Cores, Configurações) fica salvo automaticamente no seu navegador.
Múltiplas Roletas: Crie diversas roletas diferentes e alterne entre elas.
Probabilidades Customizadas: No "Modo Avançado", defina qual opção tem mais ou menos chance de cair.
Temas: Alterne entre temas Claros, Escuros e Neon.
Customização Total: Escolha as cores de fundo, cor do texto e cor do ponteiro.
Design Moderno: Interface estilizada com glassmorphism, gradientes fluidos e animações suaves na vitória.
Estrutura de Arquivos
index.html: A estrutura e o layout da página.
style.css: Todo o design, cores, temas e responsividade.
script.js: A inteligência por trás do giro, salvar dados (localStorage) e gerenciar opções/pesos.
README.md: Este manual de uso.

Basta copiar o conteúdo de cada bloco de código para os arquivos com o mesmo nome em uma pasta sua local. Aproveite o projeto e a nova estilização e animação da Mega Roleta! Se precisar de algo mais, estou à disposição.