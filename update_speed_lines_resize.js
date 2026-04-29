const fs = require('fs');

let scriptContent = fs.readFileSync('script.js', 'utf8');

if (!scriptContent.includes('window.addEventListener(\'resize\'')) {
    // There doesn't seem to be a resize listener explicitly updating speedlines.
    // That's fine since we calculate them relative to the center and radius.
    // However, if the radius changes dramatically, the lines might look off.
    // `drawRoulette` sets `canvas.width` on every frame which recalculates it.
    // The `initSpeedLines` is called right before spin. So the initial radius is correct.
    console.log("No explicit resize logic needed, speedlines reinit on spin()");
}
