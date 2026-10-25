import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

async function askJson(prompt, maxTokens = 2000) {
  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });
  const text = res.choices[0]?.message?.content || '{}';
  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s === -1 || e === -1) throw new Error('AI did not return valid JSON');
  return JSON.parse(text.slice(s, e + 1));
}

export function generateQuestions({ jd, role, experience, salary, domain, count, focus }) {
  return askJson(
    `You are a senior interviewer. Create exactly ${count} interview questions.
JOB DESCRIPTION:\n${jd}
Optional: role ${role || 'n/a'}; experience ${experience || 'n/a'}; salary ${salary || 'n/a'}; domain ${domain || 'n/a'}.
Mix: ${focus || 'Technical, Behavioral, Situational, HR'}. Be specific to the JD skills and candidate level.
Return ONLY valid JSON (no markdown, no explanation):
{"title":"...","questions":[{"q":"...","type":"Technical|Behavioral|Situational|HR|Role-specific","tip":"..."}]}`,
    4000
  );
}

export function evaluateAnswer({ jd, experience, question, answer, mode, stats }) {
  return askJson(
    `You are a strict but encouraging interview coach.
JOB DESCRIPTION:\n${jd}\nExperience: ${experience || 'n/a'}
QUESTION: ${question}
ANSWER (${mode}): ${answer}
${stats ? `Delivery: ${stats.secs}s, ${stats.words} words, ${stats.wpm} wpm, ${stats.fillers} fillers.` : ''}
Scores are integers 0-10. For spoken answers comment on pace (ideal 120-160 wpm), fillers, structure.
Return ONLY valid JSON (no markdown):
{"score":0,"content":0,"structure":0,"communication":0,"strengths":["..."],"improve":["..."],"delivery":"...","model":"120-180 word improved answer"}`
  );
}

export function followUp({ jd, question, answer }) {
  return askJson(
    `You are the interviewer. Write ONE sharp follow-up question.
JD:\n${jd.slice(0, 1500)}\nQUESTION: ${question}\nANSWER: ${answer || '(not answered)'}
Return ONLY valid JSON (no markdown): {"q":"...","tip":"..."}`,
    500
  );
}
