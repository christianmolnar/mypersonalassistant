/**
 * Test script for gender-aware Spanish grammar
 */

import { getVoiceGender, applyGenderGrammar, getArgentineVoices } from './agents/tts';

// Test the gender grammar corrections
console.log('🧪 Testing Gender-Aware Spanish Grammar System\n');

// Test voice gender mapping
console.log('📢 Voice Gender Mapping:');
getArgentineVoices().forEach(voice => {
  console.log(`  ${voice.name} (${voice.id}): ${voice.gender}`);
});

console.log('\n🔄 Grammar Correction Tests:\n');

// Test messages with gender-specific grammar
const testMessages = [
  'Estoy listo para grabar otra historia',
  'Ahora estoy listo para escuchar tu historia',
  'Soy bueno ayudando con historias',
  'Estoy preparado para continuar',
  'Me siento listo para empezar',
  'Estoy emocionado por tu historia',
  'Estoy seguro de que será increíble',
  'He terminado de procesar la información',
  'Estoy contento de poder ayudarte'
];

// Test with female voices
console.log('👩 Female Voice Corrections (nova - Valentina):');
testMessages.forEach(message => {
  const corrected = applyGenderGrammar(message, 'female');
  const changed = message !== corrected;
  console.log(`  Original: "${message}"`);
  console.log(`  Corrected: "${corrected}" ${changed ? '✅ CHANGED' : '⚪ NO CHANGE'}`);
  console.log('');
});

// Test with male voices  
console.log('👨 Male Voice Corrections (onyx - Diego):');
testMessages.forEach(message => {
  const corrected = applyGenderGrammar(message, 'male');
  const changed = message !== corrected;
  console.log(`  Original: "${message}"`);
  console.log(`  Corrected: "${corrected}" ${changed ? '✅ CHANGED' : '⚪ NO CHANGE'}`);
  console.log('');
});

// Test voice gender lookup
console.log('🔍 Voice Gender Lookup Tests:');
console.log(`  nova gender: ${getVoiceGender('nova')}`);
console.log(`  alloy gender: ${getVoiceGender('alloy')}`);
console.log(`  onyx gender: ${getVoiceGender('onyx')}`);
console.log(`  fable gender: ${getVoiceGender('fable')}`);
console.log(`  unknown voice gender: ${getVoiceGender('unknown')}`);

console.log('\n✅ Gender Grammar Test Complete!');
