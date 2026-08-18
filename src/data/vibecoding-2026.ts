import type { Article } from '../types/wiki';

export const vibecoding2026: Article = {
  slug: 'vibecoding-in-2026',
  title: 'VibeCoding in 2026',
  summary: 'A sourced overview of the shift toward agent teams, prompt-to-production platforms, reusable skills, and security gates from February through August 2026.',
  tags: ['2026', 'agents', 'tools', 'security'],
  categories: ['Tools', 'Best Practices'],
  popularity: 90,
  createdAt: '2026-08-19T00:00:00.000Z',
  updatedAt: '2026-08-19T00:00:00.000Z',
  relatedTopics: ['vibecoding-tools', 'vibecoding-best-practices', 'timeline-of-vibecoding'],
  sections: [
    {
      heading: 'From one assistant to coordinated agents',
      content: 'The leading products increasingly split a goal into planning, research, implementation, and review. <a href="https://replit.com/blog/introducing-agent-4-built-for-creativity">Replit Agent 4</a> introduced parallel agents across front-end and back-end tasks; <a href="https://lovable.dev/blog/subagents-in-lovable">Lovable subagents</a> search and research a project in parallel while a primary agent makes changes; and <a href="https://github.blog/changelog/2026-04-01-research-plan-and-code-with-copilot-cloud-agent/">GitHub Copilot cloud agent</a> added plan and research modes before coding. The practical change is that prompting is becoming workflow design: builders specify acceptance criteria, boundaries, and verification rather than only requesting code.',
    },
    {
      heading: 'Prompt to production',
      content: '<a href="https://www.netlify.com/blog/a-new-starting-point-for-the-web/">Netlify Agent Runners</a> can start production-oriented work from a prompt using coding agents, while <a href="https://lovable.dev/blog/building-apps-using-tanstack-start">Lovable moved new projects to TanStack Start</a> for full-stack rendering and server functions. <a href="https://learn.chatgpt.com/docs/changelog">OpenAI added GPT-5.4 to Codex on 5 March 2026</a>, including native computer use and an experimental one-million-token context window. These launches blur the old boundary between prototype generators and engineering environments.',
    },
    {
      heading: 'Reusable context and integrations',
      content: '<a href="https://bolt.new/blog/introducing-bolt-new-skills">Bolt Skills</a> package repeatable context, rules, and actions at project or workspace scope. <a href="https://cursor.com/changelog">Cursor</a> added model-routing controls and workspace integrations during July and August. The durable asset is no longer just the generated code: teams also maintain instructions, skills, tests, and deployment rules that make future agent runs predictable.',
    },
    {
      heading: 'Security becomes part of the generation loop',
      content: 'Recent releases put checks earlier in the workflow. <a href="https://replit.com/blog/package-firewall">Replit Package Firewall</a> blocks malicious or compromised packages during installation. <a href="https://bolt.new/blog/security-audit-on-publish">Bolt added a security audit at publish time</a>, while <a href="https://lovable.dev/blog/how-lovable-protects-your-apps-automatically">Lovable describes automatic pre-publish scans</a>. Lovable’s <a href="https://lovable.dev/blog/our-response-to-the-april-2026-incident">April incident report</a> is also a reminder that “public project” permissions, authentication, secret handling, and database authorization must be verified independently of generated UI.',
    },
    {
      heading: 'A 2026 operating checklist',
      content: 'Start with a written scope and acceptance tests. Keep changes reviewable, run type checks and production builds, test authorization at the database boundary, scan dependencies before installation, and exercise every public route and form after deployment. Treat agent output as a proposal until automated checks and a human reviewer confirm the behavior. Preserve a rollback path and record the sources and assumptions behind factual content.',
    },
  ],
  timeline: [
    { year: 2026, title: '20 February — Claude Code Security preview', description: 'Anthropic introduced a limited research preview focused on finding vulnerabilities in codebases.' },
    { year: 2026, title: '5 March — GPT-5.4 reaches Codex', description: 'OpenAI added its general-purpose model with native computer-use capabilities to Codex.' },
    { year: 2026, title: '11 March — Replit Agent 4', description: 'Replit introduced parallel agents and a broader canvas for full-stack and creative work.' },
    { year: 2026, title: '1 April — Copilot cloud planning', description: 'GitHub added research and plan modes before cloud-agent implementation.' },
    { year: 2026, title: '13 May — Lovable adopts TanStack Start', description: 'New Lovable projects gained a full-stack SSR-oriented foundation.' },
    { year: 2026, title: '9 June — install-time package firewall', description: 'Replit enabled Socket-backed malicious-package blocking by default.' },
    { year: 2026, title: '22 July — reusable Bolt Skills', description: 'Bolt added project- and workspace-scoped instructions and actions.' },
    { year: 2026, title: '3 August — Cursor workspace plugins', description: 'Cursor expanded agent access to connected workspace tools.' },
  ],
};
