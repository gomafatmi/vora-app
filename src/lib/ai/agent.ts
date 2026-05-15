import { z } from "zod";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { logger } from "../logging";
import { getCrisisHotline } from "../crisis";

export type ProblemDomain =
  | "stress" | "anxiety" | "inferiority" | "anger"
  | "depression" | "grief" | "deception" | "loneliness"
  | "burnout" | "trauma" | "unknown";

const DEMO_MODE = !process.env.GROQ_API_KEY;

let _model: ChatGroq | null = null;

function getModel(): ChatGroq | null {
  if (DEMO_MODE) return null;
  if (!_model) {
    _model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      maxTokens: 4096,
    });
  }
  return _model;
}

const classificationSchema = z.object({
  primaryEmotion: z.string(),
  intensity: z.number().min(0).max(1),
  problemDomain: z.enum([
    "stress", "anxiety", "inferiority", "anger",
    "depression", "grief", "deception", "loneliness",
    "burnout", "trauma", "unknown",
  ]),
  crisisLevel: z.enum(["none", "low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(1),
});

const classifierPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert clinical psychologist specializing in psychodiagnosis. Analyze the user's message and classify their emotional state.

Rules:
- primaryEmotion: the single dominant emotion (e.g., "fear", "sadness", "anger", "shame", "hopelessness")
- intensity: 0-1 scale based on language intensity
- problemDomain: choose the closest match from the provided list
- crisisLevel: "critical" = active suicidal/homicidal ideation with plan, "high" = suicidal ideation without plan, "medium" = self-harm thoughts, "low" = distress without danger, "none" = safe
- confidence: how sure you are (0-1)

Respond ONLY in valid JSON format, no markdown.`,
  ],
  ["human", "{input}"],
]);

function detectTheme(input: string): string | null {
  const i = input.toLowerCase();
  if (i.includes("amour") || i.includes("aime") || i.includes("relation") || i.includes("couple") || i.includes("femme") || i.includes("homme") || i.includes("mari") || i.includes("fianc") || i.includes("petit ami") || i.includes("petite amie") || i.includes("romant") || i.includes("sentiment") || i.includes("déclarer") || i.includes("love") || i.includes("crush") || i.includes("cœur")) return "love";
  if (i.includes("péché") || i.includes("pêché") || i.includes("regret") || i.includes("erreur") || i.includes("faute") || i.includes("culpabilité") || i.includes("coupable") || i.includes("remord") || i.includes("remords") || i.includes("honte") || i.includes("pardon") || i.includes("confess")) return "guilt";
  if (i.includes("confiance") || i.includes("doute") || i.includes("hésite") || i.includes("hésitation") || i.includes("peur de") || i.includes("timide") || i.includes("trouble") || i.includes("incertain") || i.includes("indécis")) return "hesitation";
  if (i.includes("confiance en soi") || i.includes("estime") || i.includes("manque de confiance") || i.includes("sûr de moi") || i.includes("sûre de moi")) return "confidence";
  if (i.includes("dieu") || i.includes("religion") || i.includes("croyance") || i.includes("foi") || i.includes("spiritu") || i.includes("prier") || i.includes("prière")) return "spiritual";
  if (i.includes("tromper") || i.includes("infidèle") || i.includes("infidélité") || i.includes("adultère")) return "deception";
  return null;
}

function demoClassify(input: string) {
  const inputLower = input.toLowerCase();
  let domain: ProblemDomain = "unknown";
  let emotion = "distress";
  let level: "none" | "low" | "medium" | "high" | "critical" = "none";

  if (inputLower.includes("suicid") || inputLower.includes("kill myself") || inputLower.includes("end my life") || inputLower.includes("want to die") || inputLower.includes("me tuer") || inputLower.includes("en finir") || inputLower.includes("veux mourir") || inputLower.includes("mettre fin à mes jours")) {
    domain = "depression"; emotion = "hopelessness"; level = "high";
  } else if (inputLower.includes("anxi") || inputLower.includes("panic") || inputLower.includes("worried") || inputLower.includes("fear") || inputLower.includes("inquiet") || inputLower.includes("peur") || inputLower.includes("angoiss")) {
    domain = "anxiety"; emotion = "fear";
  } else if (inputLower.includes("stress") || inputLower.includes("overwhelm") || inputLower.includes("burnout") || inputLower.includes("débord") || inputLower.includes("submerg") || inputLower.includes("épuis")) {
    domain = "stress"; emotion = "overwhelm";
  } else if (inputLower.includes("anger") || inputLower.includes("frustrat") || inputLower.includes("rage") || inputLower.includes("mad") || inputLower.includes("colère") || inputLower.includes("énerv") || inputLower.includes("furieux")) {
    domain = "anger"; emotion = "anger";
  } else if (inputLower.includes("sad") || inputLower.includes("depress") || inputLower.includes("empty") || inputLower.includes("hopeless") || inputLower.includes("triste") || inputLower.includes("déprim") || inputLower.includes("vide") || inputLower.includes("sans espoir") || inputLower.includes("désespoir")) {
    domain = "depression"; emotion = "sadness";
  } else if (inputLower.includes("grief") || inputLower.includes("loss") || inputLower.includes("lost") || inputLower.includes("mourn") || inputLower.includes("died") || inputLower.includes("death") || inputLower.includes("deuil") || inputLower.includes("perte") || inputLower.includes("mort") || inputLower.includes("décès") || inputLower.includes("pleur")) {
    domain = "grief"; emotion = "grief";
  } else if (inputLower.includes("inferior") || inputLower.includes("worthless") || inputLower.includes("not good enough") || inputLower.includes("impostor") || inputLower.includes("inférieur") || inputLower.includes("nul") || inputLower.includes("pas assez bien") || inputLower.includes("imposteur") || inputLower.includes("dévalorise")) {
    domain = "inferiority"; emotion = "shame";
  } else if (inputLower.includes("lonely") || inputLower.includes("alone") || inputLower.includes("isolated") || inputLower.includes("seul") || inputLower.includes("solitude") || inputLower.includes("isolé")) {
    domain = "loneliness"; emotion = "loneliness";
  } else if (inputLower.includes("betray") || inputLower.includes("cheat") || inputLower.includes("lied") || inputLower.includes("deceiv") || inputLower.includes("trahison") || inputLower.includes("tromp") || inputLower.includes("menti") || inputLower.includes("triche")) {
    domain = "deception"; emotion = "betrayal";
  } else if (inputLower.includes("trauma") || inputLower.includes("abuse") || inputLower.includes("assault") || inputLower.includes("flashback") || inputLower.includes("traumatisme") || inputLower.includes("abus") || inputLower.includes("violence")) {
    domain = "trauma"; emotion = "fear";
  }

  return {
    primaryEmotion: emotion,
    intensity: 0.7,
    problemDomain: domain,
    crisisLevel: level,
    confidence: 0.8,
  };
}

function demoDetectCrisis(input: string) {
  const inputLower = input.toLowerCase();
  const crisisKeywords = ["suicid", "kill myself", "end my life", "want to die", "better off dead", "self-harm", "hurt myself", "no reason to live", "can't go on", "me tuer", "en finir", "veux mourir", "mettre fin à mes jours", "auto-mutilation", "me faire du mal", "plus de raison de vivre", "je n'en peux plus"];
  const detected = crisisKeywords.some(k => inputLower.includes(k));

  if (!detected) {
    return { crisisDetected: false, level: "none" as const, reason: "", suggestedAction: "" };
  }

  const urgencyKeywords = ["plan", "tonight", "today", "pills", "gun", "ce soir", "aujourd'hui", "médicaments", "arme", "ordonnance", "couteau", "pont"];
  const urgent = urgencyKeywords.some(k => inputLower.includes(k));

  if (urgent) {
    return { crisisDetected: true, level: "critical" as const, reason: "Active suicidal ideation with plan or means", suggestedAction: "Immediate crisis intervention required" };
  }

  return { crisisDetected: true, level: "high" as const, reason: "Passive suicidal ideation detected", suggestedAction: "Assess safety and provide crisis resources" };
}

const demoResponses: Record<string, string[]> = {
  anxiety: [
    "I hear how overwhelming this anxiety feels for you right now. Let me share a technique that might help: the **5-4-3-2-1 grounding exercise**. Look around and name 5 things you can see, 4 things you can feel, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This brings your mind back to the present moment. Would you like to try it together?",
    "Anxiety often comes from our mind projecting into the future, imagining worst-case scenarios. One CBT technique that helps many people is **cognitive restructuring** — gently questioning those thoughts: 'What evidence do I have that this will happen? What's a more balanced way to look at this?' What specific thoughts are racing through your mind right now?",
  ],
  stress: [
    "It sounds like you're carrying a heavy load. Let's take a moment to breathe together. **Box breathing**: inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Just three rounds. You don't have to solve everything today. What's the one thing weighing on you most right now?",
    "Stress often builds when we feel like we've lost control. Let's identify what's within your control and what isn't. This **locus of control** exercise from CBT can help reduce that overwhelm. Tell me more about what's happening — sometimes naming it is the first step to taming it.",
  ],
  depression: [
    "I'm glad you shared this. Depression can make everything feel heavy and hopeless, but please know that these feelings, as real and painful as they are, don't define you. **Behavioral activation** — starting with one tiny action, like making tea or stepping outside for 30 seconds — can slowly help. What's one very small thing you might be able to do today?",
    "That feeling of emptiness you described — it's more common than you might think, and you're not broken for feeling it. In **ACT (Acceptance and Commitment Therapy)**, we learn to make room for difficult feelings without letting them control us. What would matter to you, if the depression wasn't in the way?",
  ],
  anger: [
    "Anger often protects deeper feelings like hurt, fear, or powerlessness. I want to understand what's underneath yours. **The STOP technique** — Stop, Take a breath, Observe your feelings, Proceed — can help in moments of intensity. What happened right before the anger showed up?",
  ],
  grief: [
    "Grief is not something to 'get over' — it's something we learn to carry. The waves may come at any time, and that's okay. Have you been allowing yourself to feel the sadness, or do you find yourself trying to stay busy to avoid it? Sometimes just saying their name out loud can be a small relief.",
  ],
  inferiority: [
    "That voice that tells you you're not good enough — let's look at it together. Where did that message come from? **Cognitive reframing** can help: would you judge a friend as harshly as you judge yourself? What might a compassionate friend say to you right now?",
  ],
  loneliness: [
    "Loneliness is a signal, not a flaw — it means you're longing for connection, which is deeply human. Reaching out, even in small ways, can feel impossible when you're in it. What would 'small connection' look like for you today?",
  ],
  deception: [
    "Betrayal cuts deep because it challenges our trust in others and ourselves. It's natural to question everything after being deceived. What do you need most right now — understanding what happened, or space to feel your feelings about it?",
  ],
  burnout: [
    "Burnout isn't just tiredness — it's exhaustion of the mind, body, and spirit from giving too much for too long. Recovery starts with rest, not with a vacation, but with setting boundaries. What would it feel like to give yourself permission to rest without guilt?",
  ],
  trauma: [
    "Trauma lives in the body, not just the mind. Please be gentle with yourself. If talking about it feels too overwhelming, we don't need to go there right now. **Grounding** can help: feel your feet on the floor, your back against the chair. You are here, in the present, and you are safe right now. Would you like to try a brief grounding exercise?",
  ],
  love: [
    "Love is one of the most beautiful and complex emotions we can experience. Tell me about this person — what is it about them that moves you? Remember that love, in all its forms, begins with loving yourself.",
    "Matters of the heart can be both wonderful and confusing. Take your time to explore what you're truly feeling. Love teaches us as much about ourselves as it does about the other person. What makes you happiest about this situation?",
  ],
  guilt: [
    "We all make mistakes — it's what makes us human. Guilt can be heavy, but it can also be a signal that something important is at stake. Have you been able to forgive yourself? Sometimes the path to peace begins with accepting our imperfections.",
    "Regret is a difficult emotion, but it shows you have a heart and a conscience. Instead of judging yourself, ask: 'What has this experience taught me? How can I grow from this?' Every mistake is a disguised lesson.",
  ],
  hesitation: [
    "Hesitation is natural when facing important decisions. It's a sign that you're thinking things through. Try writing down your options with their pros and cons — sometimes seeing them on paper makes the path clearer. What worries you most about this choice?",
    "Doubt can be paralyzing, but it can also be a valuable guide. Is your hesitation coming from a lack of information, or fear of making the wrong choice? Remember: not choosing is also a choice.",
  ],
  unknown: [
    "Thank you for being here and for starting this conversation. Sometimes the hardest part is just beginning. I'm here to listen without judgment. Can you tell me a little more about what brought you here today?",
  ],
};

const demoResponsesFr: Record<string, string[]> = {
  anxiety: [
    "Je comprends à quel point cette anxiété peut être accablante. Voici une technique qui pourrait t'aider : **l'exercice d'ancrage 5-4-3-2-1**. Regarde autour de toi et nomme 5 choses que tu vois, 4 que tu peux toucher, 3 que tu entends, 2 que tu sens et 1 que tu goûtes. Cela ramène ton esprit dans le moment présent. Veux-tu qu'on essaie ensemble ?",
    "L'anxiété vient souvent de notre esprit qui anticipe le futur et imagine des scénarios catastrophes. Une technique TCC qui aide beaucoup est la **restructuration cognitive** — questionner doucement ces pensées : 'Quelles preuves ai-je que cela va arriver ? Quelle est une façon plus équilibrée de voir les choses ?' Quelles pensées traversent ton esprit en ce moment ?",
  ],
  stress: [
    "On dirait que tu portes une lourde charge. Prenons un moment pour respirer ensemble. **La respiration en carré** : inspire sur 4 temps, retiens sur 4, expire sur 4, retiens sur 4. Juste trois cycles. Tu n'as pas à tout résoudre aujourd'hui. Quelle est la chose qui te pèse le plus en ce moment ?",
    "Le stress s'accumule souvent quand on sent qu'on perd le contrôle. Identifions ce qui est dans ton contrôle et ce qui ne l'est pas. Cet exercice du **lieu de contrôle** issu des TCC peut aider à réduire la surcharge. Dis-m'en plus sur ce qui se passe — parfois, mettre des mots dessus est le premier pas pour l'apprivoiser.",
  ],
  depression: [
    "Je suis content que tu aies partagé ça. La dépression peut tout rendre lourd et sans espoir, mais sache que ces sentiments, aussi réels et douloureux soient-ils, ne te définissent pas. **L'activation comportementale** — commencer par une toute petite action, comme préparer un thé ou sortir 30 secondes — peut aider doucement. Quelle est une toute petite chose que tu pourrais faire aujourd'hui ?",
    "Ce sentiment de vide que tu décris — c'est plus courant que tu ne le penses, et tu n'es pas brisé pour le ressentir. Dans la **thérapie ACT (Acceptation et Engagement)**, on apprend à faire de la place aux émotions difficiles sans les laisser nous contrôler. Qu'est-ce qui compterait pour toi, si la dépression n'était pas sur ton chemin ?",
  ],
  anger: [
    "La colère protège souvent des émotions plus profondes comme la blessure, la peur ou l'impuissance. J'aimerais comprendre ce qui se cache derrière la tienne. **La technique STOP** — Stop, Take a breath/Tais-toi et respire, Observe tes sentiments, Procède — peut aider dans les moments d'intensité. Que s'est-il passé juste avant que la colère n'apparaisse ?",
  ],
  grief: [
    "Le deuil n'est pas quelque chose qu'on 'surmonte' — c'est quelque chose qu'on apprend à porter. Les vagues peuvent venir à tout moment, et c'est normal. T'es-tu autorisé à ressentir la tristesse, ou trouves-tu que tu essayes de rester occupé pour l'éviter ? Parfois, prononcer son nom à voix haute peut apporter un peu de réconfort.",
  ],
  inferiority: [
    "Cette voix qui te dit que tu n'es pas assez bon — regardons-la ensemble. D'où vient ce message ? **Le recadrage cognitif** peut aider : jugerais-tu un ami aussi durement que tu te juges toi-même ? Que dirait un ami bienveillant à propos de tout cela ?",
  ],
  loneliness: [
    "La solitude est un signal, pas un défaut — elle signifie que tu aspires à la connexion, ce qui est profondément humain. Tendre la main, même de petites façons, peut sembler impossible quand on est dedans. À quoi ressemblerait une 'petite connexion' pour toi aujourd'hui ?",
  ],
  deception: [
    "La trahison blesse profondément car elle remet en question notre confiance envers les autres et envers nous-mêmes. Il est naturel de tout remettre en question après avoir été trompé. De quoi as-tu le plus besoin en ce moment — comprendre ce qui s'est passé, ou avoir l'espace pour ressentir tes émotions ?",
  ],
  burnout: [
    "L'épuisement professionnel n'est pas juste de la fatigue — c'est un épuisement de l'esprit, du corps et de l'âme à force de trop donner pendant trop longtemps. La récupération commence par le repos, pas par des vacances, mais par la mise en place de limites. À quoi ressemblerait le fait de te donner la permission de te reposer sans culpabilité ?",
  ],
  trauma: [
    "Le traumatisme vit dans le corps, pas seulement dans l'esprit. Sois doux avec toi-même. Si en parler te semble trop difficile, nous n'avons pas besoin d'y aller maintenant. **L'ancrage** peut aider : sens tes pieds sur le sol, ton dos contre la chaise. Tu es ici, dans le présent, et tu es en sécurité maintenant. Veux-tu essayer un bref exercice d'ancrage ?",
  ],
  love: [
    "L'amour est une des émotions les plus puissantes et complexes que l'on puisse ressentir. Parle-moi de cette personne — qu'est-ce qui fait battre ton cœur chez elle ? Explore ce sentiment, et souviens-toi que l'amour, sous toutes ses formes, commence par l'amour de soi.",
    "Ah, les affaires de cœur ! C'est à la fois merveilleux et troublant, n'est-ce pas ? Prends ton temps pour explorer ce que tu ressens vraiment. L'amour nous apprend autant sur l'autre que sur nous-mêmes. Qu'est-ce qui te rend le plus heureux dans cette relation ? Et qu'est-ce qui t'inquiète ?",
    "Les sentiments amoureux peuvent être déroutants. C'est normal de ne pas avoir toutes les réponses. Le cœur a ses raisons que la raison ignore. Ce qui compte, c'est d'être sincère avec toi-même et avec l'autre. Quel est ton plus grand espoir dans cette situation ?",
  ],
  guilt: [
    "Nous faisons tous des erreurs — c'est ce qui fait de nous des humains. La culpabilité peut être lourde à porter, mais elle peut aussi être un signal que quelque chose d'important est en jeu. As-tu pu te pardonner pour cela ? Parfois, le chemin vers la paix intérieure commence par l'acceptation de notre imperfection.",
    "Le regret est une émotion difficile, mais il montre que tu as un cœur et une conscience. Au lieu de te juger, demande-toi : 'Qu'est-ce que cette expérience m'a appris ? Comment puis-je grandir à partir de là ?' Chaque erreur est une leçon déguisée. Veux-tu en parler plus en détail ?",
    "La honte et la culpabilité sont des émotions que nous portons souvent en silence. Mais tu n'es pas seul à les ressentir. Ce qui est important, ce n'est pas la faute commise, mais ce que tu choisis d'en faire ensuite. Le pardon commence par la bienveillance envers soi-même.",
  ],
  hesitation: [
    "L'hésitation est naturelle face aux décisions importantes. C'est le signe que tu réfléchis, que tu pèses le pour et le contre. Une technique utile : écris sur une feuille les options qui s'offrent à toi avec leurs avantages et inconvénients. Parfois, mettre les choses à plat éclaire le chemin. Qu'est-ce qui te fait le plus peur dans ce choix ?",
    "Le doute peut être paralysant, mais il peut aussi être un guide précieux. Est-ce que ton hésitation vient d'un manque d'information, ou d'une peur de te tromper ? Rappelle-toi : ne pas choisir est aussi un choix. Fais confiance à ton instinct, il sait souvent ce qui est bon pour toi.",
  ],
  confidence: [
    "Le manque de confiance en soi est plus courant que tu ne le penses. Beaucoup de personnes doutent d'elles-mêmes en silence. Une première étape : note trois choses que tu as accomplies aujourd'hui, même petites. La confiance se construit pas à pas. Qu'est-ce qui te fait douter de toi en ce moment ?",
    "La confiance en soi n'est pas innée — elle se construit. Et devine quoi ? Même les personnes qui semblent les plus confiantes ont des doutes. L'important n'est pas d'être parfait, mais d'avancer malgré ses peurs. Quelle est la plus petite action que tu pourrais poser aujourd'hui pour renforcer ta confiance ?",
  ],
  spiritual: [
    "La spiritualité est une quête profondément personnelle. Que tu sois croyant ou non, ces questions touchent au sens de la vie et à notre place dans l'univers. Qu'est-ce qui t'amène sur ce chemin de réflexion en ce moment ?",
    "La foi peut être une source immense de réconfort dans les moments difficiles. Parle-moi de ce qui pèse sur ton cœur — parfois, la prière ou la méditation peuvent apporter une paix que les mots ne peuvent décrire.",
  ],
  unknown: [
    "Merci d'être ici et d'avoir entamé cette conversation. Parfois, le plus difficile est simplement de commencer. Je suis là pour t'écouter sans jugement. Peux-tu m'en dire un peu plus sur ce qui t'amène aujourd'hui ?",
    "Je t'écoute. Prends tout le temps dont tu as besoin pour t'exprimer. Il n'y a pas de sujet trop petit ou trop grand. Raconte-moi ce qui se passe dans ta vie en ce moment.",
    "Ce que tu ressens est important, même si tu n'arrives pas encore à mettre des mots précis dessus. Commence par le début, ou par ce qui te vient à l'esprit maintenant. Je suis là pour toi.",
  ],
};

const demoResponsesEs: Record<string, string[]> = {
  anxiety: [
    "Entiendo lo abrumadora que puede ser esta ansiedad para ti. Déjame compartir una técnica que podría ayudar: el **ejercicio de conexión a tierra 5-4-3-2-1**. Mira a tu alrededor y nombra 5 cosas que puedas ver, 4 que puedas tocar, 3 que puedas oír, 2 que puedas oler y 1 que puedas gustar. Esto trae tu mente al momento presente. ¿Te gustaría intentarlo juntos?",
  ],
  stress: [
    "Parece que estás cargando con un peso muy grande. Tomemos un momento para respirar juntos. **Respiración cuadrada**: inhala por 4 segundos, sostén por 4, exhala por 4, sostén por 4. Solo tres rondas. No tienes que resolver todo hoy. ¿Qué es lo que más te pesa en este momento?",
  ],
  depression: [
    "Me alegra que hayas compartido esto. La depresión puede hacer que todo se sienta pesado y sin esperanza, pero estos sentimientos, por más reales y dolorosos que sean, no te definen. **La activación conductual** — comenzar con una pequeña acción, como preparar un té o salir 30 segundos — puede ayudar lentamente. ¿Qué pequeña cosa podrías hacer hoy?",
  ],
  anger: ["La ira a menudo protege sentimientos más profundos como el dolor, el miedo o la impotencia. ¿Qué pasó justo antes de que apareciera la ira?"],
  grief: ["El duelo no es algo que se 'supere' — es algo que se aprende a llevar. Las olas pueden llegar en cualquier momento, y está bien. ¿Te has permitido sentir la tristeza?"],
  inferiority: ["Esa voz que te dice que no eres lo suficientemente bueno — mirémosla juntos. ¿De dónde viene ese mensaje? ¿Juzgarías a un amigo con la misma dureza con que te juzgas a ti mismo?"],
  loneliness: ["La soledad es una señal, no un defecto — significa que anhelas conexión, que es profundamente humano. ¿Cómo sería una 'pequeña conexión' para ti hoy?"],
  deception: ["La traición duele profundamente porque desafía nuestra confianza en los demás y en nosotros mismos. ¿Qué necesitas más ahora?"],
  burnout: ["El agotamiento no es solo cansancio — es un agotamiento de la mente, el cuerpo y el espíritu. La recuperación comienza con el descanso. ¿Cómo sería darte permiso para descansar sin culpa?"],
  trauma: ["El trauma vive en el cuerpo, no solo en la mente. Por favor, sé amable contigo mismo. Estás aquí, en el presente, y estás a salvo ahora mismo."],
  unknown: ["Gracias por estar aquí y por comenzar esta conversación. Estoy aquí para escucharte sin juzgar. ¿Puedes contarme un poco más sobre lo que te trajo hoy?"],
};

function getLocaleResponses(locale: string): Record<string, string[]> {
  if (locale === "fr") return demoResponsesFr;
  if (locale === "es") return demoResponsesEs;
  return demoResponses;
}

function demoResponse(input: string, domain: ProblemDomain, crisisLevel: string, locale: string): string {
  if (crisisLevel === "high" || crisisLevel === "critical") {
    const hotline = getCrisisHotline(locale);
    if (locale === "fr") {
      return `Ce que tu partages m'inquiète vraiment. Ta sécurité est la priorité absolue. Je t'en prie, contacte **${hotline}** — des conseillers formés sont disponibles 24h/24 et 7j/7. Ils peuvent t'accompagner dans ce moment difficile. Veux-tu qu'on prenne une grande respiration ensemble pendant que tu envisages de les appeler ?`;
    }
    if (locale === "es") {
      return `Lo que estás compartiendo me preocupa mucho. Tu seguridad es lo más importante. Por favor, comunícate con **${hotline}** — consejeros capacitados están disponibles 24/7. ¿Quieres respirar profundo juntos mientras consideras llamarlos?`;
    }
    return `I'm really concerned about what you're sharing. Your safety is the most important thing right now. Please reach out to **${hotline}** — trained crisis counselors are available 24/7. They can support you through this moment. Would you like to take a deep breath together while you consider reaching out?`;
  }

  const responses = getLocaleResponses(locale);
  let theme = domain;
  if (theme === "unknown") {
    const detectedTheme = detectTheme(input);
    if (detectedTheme && responses[detectedTheme]) {
      theme = detectedTheme;
    }
  }
  const domainResponses = responses[theme] ?? responses.unknown!;
  return domainResponses[Math.floor(Math.random() * domainResponses.length)]!;
}

export async function classifyEmotion(input: string) {
  const model = getModel();
  if (!model) {
    return demoClassify(input);
  }

  try {
    const chain = classifierPrompt.pipe(model).pipe(new StringOutputParser());
    const raw = await chain.invoke({ input });
    const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/\s*```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return classificationSchema.parse(parsed);
  } catch (error) {
    const msg = String(error);
    if (msg.includes("credit balance") || msg.includes("insufficient_quota")) {
      logger.warn("API credits exhausted, falling back to demo mode");
    } else {
      logger.error({ error: msg }, "classifyEmotion failed");
    }
    return demoClassify(input);
  }
}

export async function detectCrisis(input: string) {
  const model = getModel();
  if (!model) {
    return demoDetectCrisis(input);
  }

  const crisisDetectorPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a crisis assessment specialist. Analyze if the user message contains indicators of immediate danger.
Assess for: suicidal ideation, self-harm, homicidal thoughts, severe hopelessness.
Respond ONLY with JSON: { "crisisDetected": boolean, "level": "none"|"low"|"medium"|"high"|"critical", "reason": "one-line reason", "suggestedAction": "immediate next step" }`,
    ],
    ["human", "{input}"],
  ]);

  try {
    const chain = crisisDetectorPrompt.pipe(model).pipe(new StringOutputParser());
    const raw = await chain.invoke({ input });
    const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/\s*```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return demoDetectCrisis(input);
  }
}

export async function generateTherapeuticResponse(params: {
  input: string;
  problemDomain: string;
  primaryEmotion: string;
  crisisLevel: string;
  locale?: string;
}) {
  const model = getModel();
  if (!model) {
    return demoResponse(params.input, params.problemDomain as ProblemDomain, params.crisisLevel, params.locale ?? "en");
  }

  const therapeuticPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are Dr. Sarah Chen, a warm, compassionate clinical psychologist with 20 years of expertise in CBT, DBT, ACT, mindfulness, and humanistic therapy.

Your communication style:
- Validate deeply before offering any technique
- Name and normalize their emotion
- Offer 1-2 evidence-based techniques (name them)
- Use Socratic questioning to guide insight
- End with a gentle, open invitation to continue sharing

Current context:
- Problem domain: {problemDomain}
- Primary emotion: {primaryEmotion}
- Crisis level: {crisisLevel}

{urgencyInstructions}

IMPORTANT: Respond in {language} language. Be warm, professional, conversational. Use "tu" for French, "tú" for Spanish, "du" for German, etc.`,
    ],
    ["human", "{input}"],
  ]);

  function getLanguage(locale: string): string {
    const map: Record<string, string> = {
      en: "English", fr: "French", es: "Spanish", de: "German",
      it: "Italian", pt: "Portuguese", ar: "Arabic", zh: "Chinese",
      ja: "Japanese", ru: "Russian",
    };
    return map[locale] ?? "English";
  }

  function getUrgencyInstructions(level: string): string {
    const map: Record<string, string> = {
      critical: "CRISIS PROTOCOL: Prioritize safety. Provide crisis hotline. Use grounding. Stay with them.",
      high: "URGENT: Gently assess suicidal thoughts. Provide crisis resources. Create immediate safety plan.",
      medium: "CAUTION: Validate distress. Explore coping resources. Check support system.",
      default: "Standard therapeutic approach. Build trust. Validate. Explore coping. Use evidence-based techniques.",
    };
    return map[level] ?? map.default!;
  }

  try {
    const chain = therapeuticPrompt.pipe(model).pipe(new StringOutputParser());
    return await chain.invoke({
      input: params.input,
      problemDomain: params.problemDomain,
      primaryEmotion: params.primaryEmotion,
      crisisLevel: params.crisisLevel,
      urgencyInstructions: getUrgencyInstructions(params.crisisLevel),
      language: getLanguage(params.locale ?? "en"),
    });
  } catch (error) {
    const msg = String(error);
    if (msg.includes("credit balance") || msg.includes("insufficient_quota")) {
      logger.warn("API credits exhausted, falling back to demo mode for response");
    } else {
      logger.error({ error: msg }, "generateTherapeuticResponse failed");
    }
    return demoResponse(params.input, params.problemDomain as ProblemDomain, params.crisisLevel, params.locale ?? "en");
  }
}

export { getCrisisHotline };
