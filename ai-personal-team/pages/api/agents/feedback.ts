import { NextApiRequest, NextApiResponse } from 'next';
import { MemoryManager } from '../../../lib/AgentMemory';

interface StoryAnalysis {
  hasDate: boolean;
  hasAge: boolean;
  hasLocation: boolean;
  hasPeople: boolean;
  hasUnnamedPeople: boolean;  // New: detects people mentioned without names
  missingElements: string[];
  unnamedPeople: string[];   // New: list of unnamed people detected
  storyQuality: 'needs_details' | 'good' | 'complete';
}

interface FeedbackResponse {
  message: string;
  needsDetails?: boolean;
  suggestedPrompt?: string;
  formattedStory?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { story, type, newDetails, detailType, questionsAsked = [] } = req.body;

    if (!story || !type) {
      return res.status(400).json({ error: 'Story and type are required' });
    }

    console.log('Generating feedback for story segment:', { 
      storyLength: story.length, 
      type,
      questionsAlreadyAsked: questionsAsked
    });

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('No OpenAI API key found, using fallback messages');
      return generateFallbackMessage(type, res, { story });
    }

    let prompt = '';
    let systemMessage = '';

    if (type === 'encouragement') {
      // Get memory context for better question generation
      let memoryContext = '';
      try {
        const memories = MemoryManager.getMemories('MemoriasAI', {
          type: 'success',
          limit: 5
        });
        if (memories.length > 0) {
          memoryContext = `\n\nContexto de preguntas exitosas anteriores:\n${
            memories.map(m => m.content).join('\n')
          }`;
        }
      } catch (error) {
        console.log('Could not retrieve memory context:', error);
        // Continue without memory context
      }

      // First analyze the story for missing details
      const analysis = await analyzeStory(story, apiKey);
      
      systemMessage = 'Eres un asistente empático pero conciso que ayuda a las personas a contar sus historias personales. Respondes en español argentino de manera breve y práctica, sin ser demasiado efusivo. IMPORTANTE: Solo das UNA respuesta - o una pregunta específica O un comentario alentador, nunca ambos.';
      
      if (analysis.storyQuality === 'needs_details' && analysis.missingElements.length > 0) {
        // Focus on getting missing key details - ONLY ask the question
        const missingElement = analysis.missingElements[0]; // Focus on one at a time
        
        // Check if we've already asked about this element
        const alreadyAskedAboutElement = questionsAsked.some(q => 
          (missingElement === 'fecha/edad' && (q.includes('edad') || q.includes('años') || q.includes('cuando'))) ||
          (missingElement === 'lugar' && (q.includes('dónde') || q.includes('lugar'))) ||
          (missingElement === 'personas' && (q.includes('quién') || q.includes('con vos'))) ||
          (missingElement === 'nombres' && (q.includes('nombre') || q.includes('llamaba')))
        );
        
        if (alreadyAskedAboutElement) {
          // Skip to encouragement instead of repeating the question
          prompt = `La persona está contando su historia personal: "${story}"

Ya se le preguntó sobre ${missingElement} antes. No repitas preguntas similares.${memoryContext}

Responde con un comentario alentador simple para continuar la historia.

Ejemplos de comentarios alentadores:
- "Perfecto. Continuá cuando estés listo."
- "Interesante. Te escucho."
- "¿Qué más pasó?"

Mantén tu respuesta a 1 oración. Sé directo, no florido.`;
        } else {
          prompt = `La persona está contando su historia personal: "${story}"

He analizado su historia y noto que falta información importante sobre ${missingElement}.${memoryContext}

IMPORTANTE: Responde SOLO con una pregunta específica para obtener el detalle faltante sobre ${missingElement}. No agregues comentarios adicionales.

Ejemplos de preguntas según el elemento faltante:
- Si falta fecha/edad: "¿Te acordás más o menos qué edad tenías cuando pasó esto?"
- Si falta lugar: "¿Dónde fue esto?"
- Si faltan personas: "¿Quién más estaba ahí con vos?"
- Si faltan nombres: "¿Te acordás cómo se llamaba?"

Responde SOLO con la pregunta, nada más. Máximo 1 oración.`;
        }
      } else if (analysis.hasUnnamedPeople && analysis.unnamedPeople.length > 0) {
        // Ask for the name of the first unnamed person mentioned
        const firstUnnamedPerson = analysis.unnamedPeople[0];
        
        // Check if we've already asked about names
        const alreadyAskedAboutNames = questionsAsked.some(q => 
          q.includes('nombre') || q.includes('llamaba') || q.includes('se llama')
        );
        
        if (alreadyAskedAboutNames) {
          // Skip to encouragement instead of repeating the name question
          prompt = `La persona está contando su historia personal: "${story}"

Ya se le preguntó sobre nombres antes. No repitas preguntas similares.

Responde con un comentario alentador simple para continuar la historia.

Ejemplos:
- "Perfecto. Continuá cuando estés listo."
- "Interesante. Te escucho."
- "¿Qué más pasó?"

Mantén tu respuesta a 1 oración.`;
        } else {
          prompt = `La persona está contando su historia personal: "${story}"

Noto que menciona "${firstUnnamedPerson}" pero no dice su nombre.

IMPORTANTE: Responde SOLO con una pregunta específica para obtener el nombre de esa persona. No agregues comentarios adicionales.

Ejemplos de preguntas apropiadas:
- "¿Te acordás cómo se llamaba tu hermana?"
- "¿Cuál era el nombre de tu amigo?"
- "¿Sabés el nombre de tu maestra?"

Adapta la pregunta al tipo de persona mencionada. Responde SOLO con la pregunta, nada más. Máximo 1 oración.`;
        }
      } else {
        // Standard encouragement - brief and practical
        const questionsAskedText = questionsAsked.length > 0 
          ? `\n\nIMPORTANTE: Ya se le preguntó sobre: ${questionsAsked.join(', ')}. NO repitas ninguna de estas preguntas o similares.`
          : '';
          
        prompt = `La persona está contando su historia personal: "${story}"

Analiza si hay suficiente información para hacer una pregunta específica o si es mejor dar un comentario alentador simple.${questionsAskedText}

IMPORTANTE: Responde con UNA SOLA cosa:
- Si podés hacer una pregunta específica sobre algo que mencionaron: hacela (1 oración)
- Si no hay suficiente información para una pregunta específica: da un comentario alentador simple (1 oración)

Ejemplos de comentarios alentadores simples:
- "¡Qué bueno! Tengo ganas de escuchar esta historia."
- "Perfecto. Continuá cuando estés listo."
- "Interesante. Te escucho."

Mantén tu respuesta a 1 oración. Sé directo, no florido. NUNCA combines pregunta + comentario.`;
      }
    } else if (type === 'final_encouragement') {
      systemMessage = 'Eres un asistente práctico que confirma cuando una historia está completa. Respondes en español argentino de manera concisa y útil.';
      prompt = `La persona acaba de terminar de contar su historia completa: "${story}"

Por favor, responde con un mensaje final breve que:
1. Confirme que la historia está lista/completa
2. Mencione brevemente el tema principal de la historia

Mantén tu respuesta muy concisa - máximo 2 oraciones cortas. Sé práctico, no florido. 

Ejemplos de respuestas apropiadas:
- "Tu historia sobre [tema] está lista. ¡Quedó muy buena!"
- "Perfecto, tu memoria de [tema] ya está completa."
- "Listo, tu historia sobre [tema] quedó bárbara."`;
    } else if (type === 'format_story') {
      // New type for formatting the final story - CONSERVATIVE EDITING ONLY
      systemMessage = 'Eres un editor conservador que SOLO mejora la puntuación y división de párrafos. NUNCA agregas contenido nuevo o inventas detalles.';
      prompt = `Por favor, toma esta historia personal y formatéala ÚNICAMENTE mejorando puntuación y párrafos: "${story}"

INSTRUCCIONES CRÍTICAS:
1. NO agregues ningún detalle nuevo o inventado
2. NO cambies el contenido esencial en absoluto  
3. SOLO mejora puntuación, mayúsculas y división de párrafos
4. Mantén EXACTAMENTE las mismas palabras y ideas del usuario
5. Si algo no está claro, dejalo como está - no inventes

IMPORTANTE: Tu trabajo es SOLO formateo básico, no escritura creativa.

Devuelve SOLO la historia con mejor puntuación y párrafos, sin agregar contenido.`;
    } else if (type === 'integrate_details') {
      // New type for integrating additional details into the story - CONSERVATIVE INTEGRATION
      systemMessage = 'Eres un editor conservador que SOLO integra los detalles específicos proporcionados. NUNCA inventas o expandas información.';
      prompt = `Toma esta historia: "${story}"

Y estos nuevos detalles sobre ${detailType}: "${newDetails}"

INSTRUCCIONES CRÍTICAS:
1. SOLO integra los nuevos detalles específicos proporcionados
2. NO inventes ningún detalle adicional
3. NO expandas las ideas más allá de lo que el usuario dijo
4. Mantén EXACTAMENTE todo el contenido original
5. Solo mejora la transición donde agregas el nuevo detalle

Devuelve SOLO la historia original con el nuevo detalle integrado naturalmente, sin agregar contenido inventado.`;
    } else if (type === 'conversation') {
      // New type for conversational responses (greeting responses, general chat)
      const { conversationContext, userName } = req.body;
      systemMessage = 'Eres un asistente cálido y empático de Memorias AI que ayuda a los usuarios a grabar sus historias personales. Siempre respondes en español argentino con un tono amigable y personal.';
      prompt = `El usuario acaba de responder: "${story}"

Contexto: ${conversationContext || 'respuesta_saludo_inicial'}
Nombre del usuario: ${userName || 'querido'}

Responde de manera natural y cálida en español argentino, reconociendo lo que dijeron y guiándolos gentilmente hacia completar su información personal y comenzar a grabar su historia. Mantén un tono conversacional y empático.

Respuesta breve (máximo 2 oraciones):`;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        max_tokens: type === 'format_story' ? 500 : 150,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return generateFallbackMessage(type, res, { story });
    }

    const result = await response.json();
    const message = result.choices[0]?.message?.content?.trim();

    if (!message) {
      return generateFallbackMessage(type, res, { story });
    }

    console.log('Generated feedback message:', message);

    // For format_story type, return the formatted story
    if (type === 'format_story') {
      return res.status(200).json({ formattedStory: message });
    }

    // For integrate_details type, return the integrated story
    if (type === 'integrate_details') {
      return res.status(200).json({ integratedStory: message });
    }

    // For encouragement type, check if this was a question and track it
    let questionAsked = null;
    if (type === 'encouragement') {
      // Simple check: if the message ends with a question mark, it's likely a question
      if (message.trim().endsWith('?')) {
        questionAsked = message.trim();
        
        // Store this interaction in memory for learning
        try {
          await MemoryManager.storeMemory({
            agentId: 'MemoriasAI',
            type: 'interaction',
            content: `Question asked: "${message}" for story: "${story.substring(0, 100)}..."`,
            metadata: {
              storyLength: story.length,
              questionsAsked: questionsAsked,
              questionType: 'story_detail',
              interactionType: 'question_generation'
            },
            importance: 'medium',
            tags: ['question', 'story_analysis', 'memorias_ai']
          });
          
          console.log('Stored question interaction in memory for learning');
        } catch (memoryError) {
          console.error('Error storing interaction in memory:', memoryError);
          // Continue without memory - don't fail the request
        }
      }
    }

    return res.status(200).json({ 
      message,
      questionAsked // Return the question so frontend can track it
    });

  } catch (error) {
    console.error('Error generating feedback:', error);
    return generateFallbackMessage(req.body.type, res, { story: req.body.story });
  }
}

// Function to analyze story content for missing details
async function analyzeStory(story: string, apiKey: string): Promise<StoryAnalysis> {
  try {
    const analysisPrompt = `Analiza esta historia personal y determina qué elementos importantes faltan: "${story}"

Responde en formato JSON con esta estructura exacta:
{
  "hasDate": boolean (tiene fecha/año/edad específica),
  "hasAge": boolean (menciona edad específica del narrador),
  "hasLocation": boolean (menciona lugar específico),
  "hasPeople": boolean (menciona otras personas específicas),
  "hasUnnamedPeople": boolean (menciona personas sin nombres específicos),
  "unnamedPeople": ["persona1", "persona2"] (lista de personas mencionadas sin nombre),
  "missingElements": ["elemento1", "elemento2"] (lista de elementos faltantes usando: "fecha/edad", "lugar", "personas", "nombres"),
  "storyQuality": "needs_details" | "good" | "complete"
}

Criterios para "hasUnnamedPeople":
- Busca personas mencionadas sin nombres específicos como: "mi hermana", "un amigo", "la maestra", "mi primo"
- NO incluyas personas con nombres propios como "María", "Juan", "mamá", "papá"
- Si encuentras personas sin nombres, agrégalas a "unnamedPeople"

Criterios para "hasAge" (muy importante):
- Busca frases como "tenía cinco años", "cuando tenía 8 años", "era un niño de 6 años"
- También números escritos: "cinco años", "diez años", etc.
- También formatos como "a los 5 años", "cuando cumplí 7"
- Si encuentras CUALQUIER mención de edad, marca hasAge como true

Criterios generales:
- "needs_details": historia muy básica, falta información esencial
- "good": historia decente pero podría mejorarse  
- "complete": historia completa con buen detalle`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Eres un analista de historias. Responde SOLO con JSON válido, sin texto adicional.' },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 200,
        temperature: 0.3
      })
    });

    if (response.ok) {
      const result = await response.json();
      const content = result.choices[0]?.message?.content?.trim();
      
      try {
        const analysis = JSON.parse(content);
        return analysis;
      } catch (parseError) {
        console.warn('Failed to parse analysis JSON:', content);
      }
    }
  } catch (error) {
    console.error('Error analyzing story:', error);
  }

  // Fallback analysis with improved age detection
  const storyLower = story.toLowerCase();
  
  // Better age detection - look for both digits and spelled numbers
  const agePatterns = [
    /\d+\s*años?/,  // "5 años", "cinco años"
    /tenía\s+\w+\s+años?/,  // "tenía cinco años", "tenía 5 años"
    /cuando\s+tenía/,  // "cuando tenía..."
    /era\s+\w+\s+años?/,  // "era cinco años"
    /(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\s+años?/,  // spelled numbers + años
    /edad\s+de\s+\w+/  // "edad de cinco"
  ];
  
  const hasAge = agePatterns.some(pattern => pattern.test(storyLower));
  
  // Detect unnamed people - people mentioned without specific names
  const unnamedPeoplePatterns = [
    /mi\s+(hermana?|hermano|primo|prima|tío|tía|abuelo|abuela|amigo|amiga|compañero|compañera|maestro|maestra|profesor|profesora|vecino|vecina)/g,
    /un\s+(amigo|compañero|primo|vecino|maestro|profesor)/g,
    /una\s+(amiga|compañera|prima|vecina|maestra|profesora)/g,
    /el\s+(chico|muchacho|hombre|señor)/g,
    /la\s+(chica|muchacha|mujer|señora|nena|nene)/g
  ];
  
  const unnamedPeople: string[] = [];
  unnamedPeoplePatterns.forEach(pattern => {
    const matches = storyLower.match(pattern);
    if (matches) {
      unnamedPeople.push(...matches);
    }
  });
  
  return {
    hasDate: storyLower.includes('año') || storyLower.includes('edad') || /\d{4}/.test(story) || hasAge,
    hasAge: hasAge,
    hasLocation: storyLower.includes('en ') || storyLower.includes('lugar') || storyLower.includes('ciudad') || storyLower.includes('casa'),
    hasPeople: storyLower.includes('con ') || storyLower.includes('mamá') || storyLower.includes('papá') || storyLower.includes('familia') || storyLower.includes('hermano') || storyLower.includes('abuela'),
    hasUnnamedPeople: unnamedPeople.length > 0,
    unnamedPeople: unnamedPeople,
    missingElements: [],
    storyQuality: story.length > 100 ? 'good' : 'needs_details'
  };
}

function generateFallbackMessage(type: string, res: NextApiResponse, fallbackData?: any) {
  let message = '';

  if (type === 'encouragement') {
    const encouragementMessages = [
      '¿Qué pasó después?',
      '¿Podés contarme más detalles?',
      '¿Había alguien más ahí?',
      '¿Dónde fue esto?',
      '¿Cuándo pasó?',
      'Perfecto. Te escucho.',
      'Interesante. Continuá.',
      '¡Qué bueno! Tengo ganas de escuchar esta historia.'
    ];
    message = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
  } else if (type === 'final_encouragement') {
    const finalMessages = [
      'Tu historia está lista. ¡Quedó muy buena!',
      'Perfecto, tu memoria ya está completa.',
      'Listo, tu historia quedó bárbara.',
      'Tu relato está terminado. ¡Excelente!',
      'Historia completa. Quedó genial.',
      'Perfecto, ya tenés tu historia lista.'
    ];
    message = finalMessages[Math.floor(Math.random() * finalMessages.length)];
  } else if (type === 'format_story') {
    // For format_story, return the story as-is since we can't format it without AI
    return res.status(200).json({ formattedStory: fallbackData?.story || 'Historia sin formatear disponible.' });
  } else if (type === 'integrate_details') {
    // For integrate_details, return the original story since we can't integrate without AI
    return res.status(200).json({ integratedStory: fallbackData?.story || 'Historia original.' });
  } else if (type === 'conversation') {
    // Conversational fallback responses in Spanish
    const conversationMessages = [
      'Te escuché perfectamente, Cristian. Cuando estés listo, completá tu información arriba y presioná "Grabar Historia".',
      '¡Hola! Me encanta conocerte. Para comenzar con tu historia, llená los datos personales de arriba.',
      'Perfecto. Ahora completá tu nombre, edad y lugar arriba, y después podemos empezar a grabar.',
      'Te entiendo. Asegurate de llenar toda la información personal y luego podemos comenzar tu relato.',
      '¡Genial! Completá los campos de arriba (nombre, edad, lugar) y después grabamos tu historia.'
    ];
    message = conversationMessages[Math.floor(Math.random() * conversationMessages.length)];
  }

  return res.status(200).json({ message });
}
