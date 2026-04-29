const fs = require('fs');

let scriptContent = fs.readFileSync('script.js', 'utf8');

const speedLinesLogic = `
// --- Speed Lines Logic ---
const speedLines = [];
const NUM_SPEED_LINES = 30;

function initSpeedLines() {
    speedLines.length = 0;
    const radius = Math.min(elements.canvas.width, elements.canvas.height) / 2;
    for (let i = 0; i < NUM_SPEED_LINES; i++) {
        speedLines.push({
            angle: Math.random() * Math.PI * 2,
            distance: radius * 0.2 + Math.random() * (radius * 0.8),
            length: 10 + Math.random() * 40,
            speed: 0.05 + Math.random() * 0.1,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
}

function updateAndDrawSpeedLines(velocity, isClockwise) {
    if (velocity < 0.01) return; // Só desenha se estiver rápido

    const ctx = elements.ctx;
    const canvas = elements.canvas;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy);

    ctx.save();
    ctx.translate(cx, cy);

    // Normaliza a velocidade para controlar a intensidade (opacidade/tamanho)
    const intensity = Math.min(velocity * 10, 1);

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (let line of speedLines) {
        // Move a linha
        const dir = isClockwise ? 1 : -1;
        line.angle += line.speed * velocity * 20 * dir;

        // Reposiciona se sair do círculo
        if (line.angle > Math.PI * 2) line.angle -= Math.PI * 2;
        if (line.angle < 0) line.angle += Math.PI * 2;

        const x = Math.cos(line.angle) * line.distance;
        const y = Math.sin(line.angle) * line.distance;

        // Desenha como um arco/rastro circular
        ctx.beginPath();
        ctx.strokeStyle = \`rgba(255, 255, 255, \${line.opacity * intensity})\`;

        // Calcula o comprimento visual do rastro baseado na velocidade
        const trailLength = (line.length / radius) * intensity * dir;

        ctx.arc(0, 0, line.distance, line.angle, line.angle - trailLength, isClockwise);
        ctx.stroke();
    }

    ctx.restore();
}
// --- Fim Speed Lines Logic ---
`;

if (!scriptContent.includes('updateAndDrawSpeedLines')) {
    // Insere antes de spin()
    scriptContent = scriptContent.replace('function spin() {', speedLinesLogic + '\nfunction spin() {');
}

// Inicia as linhas dentro de spin()
if (!scriptContent.includes('initSpeedLines();')) {
    scriptContent = scriptContent.replace('isAnticipating = true;', 'isAnticipating = true;\n    initSpeedLines();');
}

// Em rotateAnimation(), capturar o rotateAnimation block e injetar a renderização
const rotateRegex = /function rotateAnimation\(\) \{([\s\S]*?)drawRoulette\(\);\s*spinAnimation = requestAnimationFrame\(rotateAnimation\);\s*\}/;

const match = scriptContent.match(rotateRegex);

if (match && !match[0].includes('updateAndDrawSpeedLines')) {
    let innerContent = match[1];

    // Precisamos capturar a velocidade (angleChange) para passar pras linhas
    // Em rotateAnimation o angleChange ou é positivo ou negativo. A velocidade é abs.

    let novaRotate = match[0].replace('drawRoulette();',
        'drawRoulette();\n        const velocityForLines = Math.abs(angleChange);\n        updateAndDrawSpeedLines(velocityForLines, isClockwise);');

    scriptContent = scriptContent.replace(match[0], novaRotate);
}

fs.writeFileSync('script.js', scriptContent);
console.log("Speed lines injetadas.");
