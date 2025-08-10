// Quick test of the formatStoryText function
const { formatStoryText } = require('./lib/utils.ts');

const testText = `Esto pasó en la capilla de Merlo. Mi mamá me llevó porque ella tenía que ir a una actividad o algo así, y yo me fui a jugar atrás con los nenes.

En un momento se preocupó porque no sabía dónde estaba, así que le preguntó a las señoras dónde está el. Cristian. Y probablemente una de las nenas dijo "ah me parece que estaba allá en el tanque arriba del tanque!"`;

console.log('Original text:');
console.log(testText);
console.log('\n---\n');
console.log('Formatted text:');
console.log(formatStoryText(testText));
