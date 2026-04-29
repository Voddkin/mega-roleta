1.  **Implementar Speed Lines (Linhas de Vento):**
    *   Criar um sistema de partículas para as linhas de vento (Speed Lines) que aparecem durante o giro.
    *   As linhas devem ser desenhadas no `canvas` principal durante o `requestAnimationFrame` da roleta, logo após `drawRoulette()`.
    *   A opacidade e quantidade das linhas devem ser proporcionais à velocidade do giro.
    *   Garantir performance utilizando arrays pré-alocados ou lógica simples para atualizar as linhas.
2.  **Integrar na animação existente:**
    *   No arquivo `script.js`, dentro da função `rotateAnimation`, incluir uma chamada para `drawSpeedLines(velocity)` ou a lógica embutida.
    *   Precisamos calcular uma `currentVelocity` baseada na variação de ângulo (`angleChange`) para controlar as linhas.
3.  **Passos de Pré-Commit:**
    *   Chamar a ferramenta de instruções de pré-commit para garantir verificação e reflexão.
    *   Garantir que a adição não quebra o visual do jogo.
4.  **Submit:**
    *   Submeter as alterações com uma mensagem clara de commit.
