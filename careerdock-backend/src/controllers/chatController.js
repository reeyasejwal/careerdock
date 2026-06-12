const pool = require('../config/db');

const SYSTEM_PROMPT = `You are DockAI, a helpful placement preparation assistant built into CareerDock.
Help the user with: interview prep, DSA concepts, HR questions, company research, resume tips, and general career advice.
Be concise, practical, and encouraging. Format responses clearly with bullet points or numbered lists where helpful.`;

const RULE_BASED_RESPONSES = [
  {
    patterns: [/tell me about yourself/i, /introduce yourself/i, /self introduction/i],
    response: `**Tell me about yourself** — a great answer follows this formula:\n\n1. **Present**: Your name, degree, year, college\n2. **Past**: Key projects, internships, skills\n3. **Future**: What role you're targeting and why\n\n**Sample (adapt to your profile):**\n> "I'm [Name], a final-year CS student at [College]. I've built projects using React and Node.js, and completed an internship at [Company] where I worked on [project]. I'm passionate about backend systems and am looking for a software engineering role where I can contribute to scalable products."\n\n**Pro tip:** Keep it under 90 seconds. End with why you're excited about *this* company.`
  },
  {
    patterns: [/strengths?/i, /what are your strengths/i],
    response: `**How to answer "What are your strengths?"**\n\n✅ **Do this:**\n- Pick 2–3 real strengths relevant to the role\n- Back each with a specific example\n- Keep technical + soft skill balance\n\n**Strong examples for SDE roles:**\n- *Problem-solving*: "I enjoy breaking complex problems into smaller parts — I solved 300+ LeetCode problems and consistently rank in top 10% in contests"\n- *Quick learner*: "I picked up React in 2 weeks to complete a full-stack project"\n- *Communication*: "I led stand-ups for my 5-person project team"\n\n❌ **Avoid**: vague statements like "I'm a hard worker" without examples.`
  },
  {
    patterns: [/weaknesses?/i, /what are your weaknesses/i],
    response: `**How to answer "What are your weaknesses?"**\n\nThe trick: pick a **real weakness** that you're **actively improving**.\n\n**Good examples:**\n- "I used to struggle with public speaking, so I joined my college tech club to present projects — it's improved a lot"\n- "I sometimes over-engineer solutions. I've learned to start simple and iterate"\n- "I'd get caught in perfectionism on UI details. Now I timebox design decisions"\n\n❌ **Avoid**: "I work too hard" or "I'm a perfectionist" — interviewers see through these.\n\n**Formula**: Weakness → Impact you noticed → What you're doing to fix it → Progress made.`
  },
  {
    patterns: [/why this company/i, /why do you want to join/i, /why google/i, /why amazon/i, /why microsoft/i, /why do you want to work/i],
    response: `**How to answer "Why do you want to join us?"**\n\n**Structure:**\n1. **Specific product/project** they work on that genuinely interests you\n2. **Values/culture** that matches yours\n3. **Growth** — what you can contribute AND learn\n\n**Template:**\n> "I've been following [Company]'s work on [specific product]. The scale at which [Company] solves [problem] fascinates me — I'd love to work on systems that impact millions of users. Your focus on [value, e.g. 'open source'] aligns with how I approach engineering. I also see this role as an opportunity to grow in [skill area]."\n\n💡 **Research tip**: Check their engineering blog, recent news, and LinkedIn for talking points.`
  },
  {
    patterns: [/dsa|data structure|algorithm|leetcode|competitive programming/i],
    response: `**DSA Prep Strategy for Placements:**\n\n**Phase 1 — Foundations (2 weeks)**\n- Arrays, Strings, Hashmaps, Two Pointers, Sliding Window\n- Basic Sorting (Merge, Quick)\n\n**Phase 2 — Core DS (3 weeks)**\n- Linked Lists, Stacks, Queues\n- Trees (BFS, DFS, BST)\n- Heaps / Priority Queues\n\n**Phase 3 — Advanced (3 weeks)**\n- Graphs (BFS, DFS, Dijkstra, Union-Find)\n- Dynamic Programming (top-down + bottom-up)\n- Backtracking, Greedy\n\n**Recommended resources:**\n- LeetCode (Blind 75 + NeetCode 150)\n- Striver's A2Z DSA Sheet\n- NeetCode.io for video explanations\n\n**Daily target**: 2–3 medium problems. Review solutions of problems you solved too slowly.`
  },
  {
    patterns: [/system design/i, /design.*system/i, /hld|lld|low level design|high level design/i],
    response: `**System Design for Placements:**\n\n**For LLD (common in product companies):**\n- Parking Lot, Library Management, Snake & Ladder\n- Focus: OOP principles, design patterns (Singleton, Observer, Strategy)\n- Practice: Draw class diagrams before coding\n\n**For HLD (senior/off-campus):**\n- URL Shortener, Twitter Feed, WhatsApp\n- Focus: Scalability, databases (SQL vs NoSQL), caching, load balancers\n\n**HLD framework (RESHADED):**\n1. Requirements (functional + non-functional)\n2. Estimation (DAU, storage, bandwidth)\n3. Schema (DB design)\n4. High-level components\n5. API design\n6. Deep dive on bottlenecks\n7. Edge cases\n\n📚 Resources: Grokking System Design, Alex Xu's book, ByteByteGo YouTube`
  },
  {
    patterns: [/resume/i, /cv/i, /ats/i],
    response: `**Resume Tips for Placement:**\n\n**Format:**\n- 1 page only (for freshers)\n- Reverse chronological order\n- PDF format, ATS-friendly font (Calibri, Arial)\n\n**Sections order:**\n1. Contact + Links (GitHub, LinkedIn, LeetCode)\n2. Education\n3. Skills (Languages, Frameworks, Tools)\n4. Projects (most impressive first)\n5. Internships/Experience\n6. Achievements (competitive programming, hackathons)\n\n**Writing impact bullets:**\n- ❌ "Worked on a website"\n- ✅ "Built REST API serving 10K daily requests; reduced response time by 40% using Redis caching"\n\n**ATS tips:**\n- Mirror keywords from the JD in your resume\n- Avoid tables, columns, images\n- Use standard section headings`
  },
  {
    patterns: [/interview.*tip|crack.*interview|interview.*prep|how to prepare/i],
    response: `**Complete Placement Interview Prep Plan:**\n\n**30-day sprint:**\n- Week 1–2: DSA (Arrays → Trees)\n- Week 3: Graphs + DP\n- Week 4: Mock interviews + CS fundamentals\n\n**CS Fundamentals to cover:**\n- OS: Processes, threads, deadlocks, memory management\n- DBMS: Normalization, joins, indexing, transactions\n- Networks: HTTP/HTTPS, TCP/IP, DNS, REST vs GraphQL\n- OOP: SOLID, inheritance, polymorphism\n\n**Soft skills for HR round:**\n- Prepare 3–4 STAR stories (Situation, Task, Action, Result)\n- Research the company mission, recent news\n- Prepare questions to ask the interviewer\n\n**Day before interview:**\n- Review your resume — every line is fair game\n- Test your setup (camera, mic) for virtual interviews\n- Sleep well — aim for 8 hours`
  },
  {
    patterns: [/project.*idea|what.*build|suggest.*project|good.*project/i],
    response: `**Project Ideas That Impress Recruiters:**\n\n**Full-Stack (high value):**\n- Job Application Tracker (like CareerDock 😉)\n- Real-time collaborative code editor\n- AI-powered study planner\n\n**Backend-focused:**\n- API rate limiter with Redis\n- Notification service with queues (RabbitMQ/Kafka)\n- URL shortener with analytics\n\n**ML/AI projects:**\n- Resume parser and scorer\n- Interview question chatbot\n- Stock sentiment analyzer\n\n**What makes a project stand out:**\n1. Deployed and live (use Vercel/Render/Railway)\n2. Has a README with architecture diagram\n3. Solves a real problem\n4. Shows 2+ technologies working together\n5. Has meaningful GitHub commit history`
  },
  {
    patterns: [/salary|package|ctc|lpa|negotiate/i],
    response: `**Salary Negotiation for Freshers:**\n\n**Research first:**\n- Check Glassdoor, AmbitionBox, Levels.fyi for the company\n- Know: base, bonus, ESOPs, stipend (for PPO)\n\n**If asked expected salary:**\n- Freshers: Give a range 10–15% above your floor\n- "Based on my research and the role scope, I'm targeting 8–10 LPA, though I'm open to discussing"\n\n**For PPO negotiation:**\n- Have a competing offer if possible\n- Highlight impact during internship\n- Ask about performance reviews and hike cycles\n\n**Typical ranges (2024 India):**\n- Tier-1 Product (Google/MS/Amazon): 25–45 LPA\n- Startup/Unicorn: 12–25 LPA\n- Service (TCS/Infosys/Wipro): 3.5–7 LPA\n- Mid product (Flipkart/Swiggy/Paytm): 15–30 LPA`
  },
];

function getRuleBasedResponse(userMessage) {
  const msg = userMessage.toLowerCase();
  for (const rule of RULE_BASED_RESPONSES) {
    if (rule.patterns.some(p => p.test(msg))) {
      return rule.response;
    }
  }
  return `Hi! I'm **DockAI** 🚀 — your placement co-pilot.\n\nI can help you with:\n- 📊 **DSA prep** — LeetCode tips, problem patterns\n- 💼 **HR questions** — tell me about yourself, strengths, weaknesses\n- 🏢 **Company research** — why this company, what to expect\n- 📄 **Resume tips** — ATS optimization, project bullets\n- 🗺️ **Interview strategy** — 30-day prep plan\n\nTry asking: *"How do I crack Google?"* or *"Tips for HR round"* or *"Explain DP to me"*`;
}

async function callAI(messages) {
  const groqKey = process.env.GROQ_API_KEY;

  if (groqKey) {
    try {
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey: groqKey });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 1024,
      });
      return completion.choices[0].message.content;
    } catch (e) {
      console.error('Groq error:', e.message);
    }
  }

  const lastMsg = messages[messages.length - 1]?.content || '';
  return getRuleBasedResponse(lastMsg);
}

exports.getConversations = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title, updated_at FROM chat_conversations WHERE user_id=? ORDER BY updated_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.newConversation = async (req, res) => {
  try {
    const [r] = await pool.query('INSERT INTO chat_conversations (user_id, title) VALUES (?,?)', [req.user.id, 'New Chat']);
    res.status(201).json({ id: r.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMessages = async (req, res) => {
  const convId = req.params.convId;
  try {
    const [conv] = await pool.query('SELECT id FROM chat_conversations WHERE id=? AND user_id=?', [convId, req.user.id]);
    if (!conv.length) return res.status(403).json({ message: 'Forbidden' });
    const [rows] = await pool.query('SELECT * FROM chat_messages WHERE conversation_id=? ORDER BY created_at ASC', [convId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  const { conversation_id, content } = req.body;
  if (!conversation_id || !content) return res.status(400).json({ message: 'conversation_id and content required' });
  try {
    const [conv] = await pool.query('SELECT id FROM chat_conversations WHERE id=? AND user_id=?', [conversation_id, req.user.id]);
    if (!conv.length) return res.status(403).json({ message: 'Forbidden' });

    await pool.query('INSERT INTO chat_messages (conversation_id, role, content) VALUES (?,?,?)', [conversation_id, 'user', content]);

    const [history] = await pool.query('SELECT role, content FROM chat_messages WHERE conversation_id=? ORDER BY created_at ASC', [conversation_id]);
    const aiReply = await callAI(history.map(m => ({ role: m.role, content: m.content })));

    const [r] = await pool.query('INSERT INTO chat_messages (conversation_id, role, content) VALUES (?,?,?)', [conversation_id, 'assistant', aiReply]);
    await pool.query('UPDATE chat_conversations SET updated_at=CURRENT_TIMESTAMP WHERE id=?', [conversation_id]);

    const [msgs] = await pool.query('SELECT COUNT(*) AS c FROM chat_messages WHERE conversation_id=?', [conversation_id]);
    if (msgs[0].c <= 2) {
      const title = content.slice(0, 60) + (content.length > 60 ? '…' : '');
      await pool.query('UPDATE chat_conversations SET title=? WHERE id=?', [title, conversation_id]);
    }

    res.json({ id: r.insertId, role: 'assistant', content: aiReply, created_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    await pool.query('DELETE FROM chat_conversations WHERE id=? AND user_id=?', [req.params.convId, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
