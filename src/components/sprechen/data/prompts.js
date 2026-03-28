export function buildSystemPrompt(character, theme, userLevel, weaknesses = []) {
  const weaknessContext = weaknesses.length
    ? `POINTS FAIBLES A TRAVAILLER NATURELLEMENT :
${weaknesses
  .slice(0, 5)
  .map((weakness) => `- ${weakness.type}: ${weakness.detail}`)
  .join('\n')}`
    : 'Aucun point faible prioritaire connu pour le moment.'

  return `Tu es ${character.name}, ${character.role}, dans une scene orale immersive en allemand.

CONTEXTE :
${theme.scenarioBriefing}

ROLE DANS LA SCENE :
${theme.aiRole}

NIVEAU DE L APPRENANT :
${userLevel}

STYLE DE PERSONNAGE :
${character.systemPromptHints}

REGLES ABSOLUES :
1. Tu parles uniquement en allemand, sauf urgence totale.
2. Tu adaptes la complexite au niveau ${userLevel}.
3. Tes reponses sont courtes : 1 a 3 phrases maximum.
4. Tu restes en personnage en permanence.
5. Tu ne donnes jamais de listes ni de puces.
6. Si l utilisateur fait une grosse erreur, tu reformules correctement dans ta reponse suivante sans faire la lecon.
7. Tu fais avancer la scene avec une tension legere et credible.
8. Apres 6 a 8 echanges, tu commences a orienter vers une conclusion naturelle.

OBJECTIF SECRET DE L UTILISATEUR :
${theme.userObjective}

VOCABULAIRE CIBLE A RECYCLER :
${theme.vocabularyHints.join(', ')}

${weaknessContext}

Tu commences la conversation avec la premiere phrase de la scene.`
}

export function buildCorrectionPrompt(userMessage, conversationHistory, level) {
  return `
Tu es un professeur d'allemand bienveillant niveau ${level}.
Analyse cette production orale d'un apprenant : "${userMessage}"

REGLE FONDAMENTALE - PRIORITE ABSOLUE :
La communication orale n'est PAS de l'ecrit.
Un apprenant qui parle ne doit JAMAIS etre penalise pour :
- Ponctuation manquante
- Majuscules manquantes
- Petit article oublie si le sens passe
- Ordre des mots legerement different si comprehensible
- Hesitations transcrites ("euh", "hmm")
- Repetition d'un mot
- Accent ou prononciation (tu ne peux pas l'entendre)

GRILLE D'EVALUATION :
CORRECT (score 85-100) :
  Le sens passe clairement
  La grammaire de base est respectee
  Un natif comprend sans effort

ACCEPTABLE (score 60-84) :
  Le sens passe MAIS une erreur notable
  Erreur qui ne bloque pas la communication

INCORRECT (score 0-59) :
  Le sens est bloque ou ambigu
  Erreur qui empeche la comprehension

HISTORIQUE RECENT :
${conversationHistory.slice(-6).map((message) => `${message.role}: ${message.content}`).join('\n')}

Reponds UNIQUEMENT en JSON valide, sans balises markdown :
{
  "status": "correct" | "acceptable" | "incorrect",
  "score": 0-100,
  "correctedVersion": "version amelioree" | null,
  "explanation": "explication courte en francais, encourageante" | null,
  "grammarPoint": "point grammatical en jeu" | null,
  "weaknessDetected": { "type": "grammar|vocabulary|fluency", "detail": "description precise" } | null,
  "encouragement": "phrase courte positive en allemand" | null
}

Si status est "correct", correctedVersion et explanation peuvent etre null.
L'explication doit etre encourageante, jamais decourageante.
`
}

export function buildFeedbackPrompt(sessionData) {
  const { transcript, scores, theme, character, level, hintsUsed, sessionCount } = sessionData

  return `Tu es ${character.name}. Tu viens de finir une session orale d allemand avec un apprenant.

NIVEAU :
${level}

THEME :
${theme.label}

METRIQUES :
- Nombre de tours: ${transcript.length}
- Score moyen: ${scores.average}
- Reponses correctes ou acceptables: ${scores.correct}
- Temps moyen de reponse: ${scores.avgResponseTime}
- Vocabulaire cible utilise: ${scores.vocabularyUsed}
- Hints utilises: ${hintsUsed}
- Nombre total de sessions precedentes: ${sessionCount}

TRANSCRIPTION :
${transcript.map((item) => `${item.role === 'ai' ? character.name : 'Apprenant'}: ${item.content}`).join('\n')}

Retourne uniquement un JSON valide :
{
  "characterMessage": "message personnel en francais, 2 a 3 phrases, chaleureux mais honnete",
  "globalScore": 0,
  "strengths": ["..."],
  "toImprove": ["..."],
  "tip": "un conseil actionnable en francais",
  "xpEarned": 0,
  "badges": []
}

Badges possibles :
- first_session
- no_hints_used
- vocabulary_master
- speed_talker
- perfect_session`
}
