import type { Article } from '../types/wiki';

export const articles: Article[] = [
  {
    slug: 'origins-of-vibecoding',
    title: 'Origins of VibeCoding',
    summary:
      'How Andrej Karpathy’s February 2025 explanation of “vibe coding” reframed AI-assisted development as a conversational, experiment-led workflow.',
    tags: ['history', 'culture', 'founders'],
    categories: ['History', 'Culture'],
    popularity: 96,
    createdAt: '2021-04-18T10:15:00.000Z',
    updatedAt: '2025-09-12T08:45:00.000Z',
    relatedTopics: ['vibecoding-culture', 'timeline-of-vibecoding'],
    sections: [
      {
        heading: 'Coinage and definition',
        content:
          'On 2 February 2025, <a href="https://twitter.com/karpathy/status/1753068125226313728">Andrej Karpathy described “vibe coding” on X</a>, outlining a process where developers converse with large language models (LLMs), accept suggested patches without reading diffs, and iterate based on runtime feedback. The term, quickly summarised by outlets such as Ars Technica and The Times of India, framed vibe coding as surrendering traditional code comprehension in favour of conversational prototyping.\n\nKarpathy characterised the approach as “seeing stuff, saying stuff, running stuff,” highlighting that the human guides the model with goals and error messages rather than direct edits.\n\n'} ,
      {
        heading: 'LLM-driven workflow',
        content:
          'In vibe coding, prompts replace manual implementation. The developer supplies natural-language requirements, executes the generated code, and feeds stack traces back to the model. Tools referenced in coverage include Cursor Composer, Replit’s agent, and GitHub Copilot. By March 2025 the term appeared in Merriam-Webster’s “Slang & Trending” list, noting that practitioners often accept latent bugs as the cost of speed.\n\nThe method doubles down on Karpathy’s 2023 claim that “the hottest new programming language is English,” placing natural-language steering at the centre of software creation.\n\n'},
      {
        heading: 'Media amplification and adoption',
        content:
          'Mainstream press rapidly tested the workflow. _The New York Times_ columnist Kevin Roose built “software for one” prototypes that analysed grocery lists and generated lunch suggestions, while _Y Combinator_ reported that one quarter of its Winter 2025 startups relied on codebases that were at least 95% AI-generated. _The Wall Street Journal_ later observed that professional teams were experimenting with vibe coding in commercial environments.\n\n'},
      {
        heading: 'Critiques and concerns',
        content:
          'Sceptics caution that vibe coding can obscure accountability. Cognitive scientist Gary Marcus argued that many demos remix existing code rather than invent new algorithms. Simon Willison warned that skipping code review jeopardises maintainability, security audits, and onboarding. By September 2025, _Fast Company_ reported a “vibe coding hangover,” as teams faced production incidents attributed to opaque AI-authored code.\n\n'},
    ],
    timeline: [
      {
        year: 2025,
        title: 'Karpathy introduces the term',
        description: 'On 2 February 2025 Andrej Karpathy publicly detailed “vibe coding,” promoting a fully AI-steered development style.',
      },
      {
        year: 2025,
        title: 'Merriam-Webster trending entry',
        description: 'In March 2025 Merriam-Webster added “vibe coding” to its Slang & Trending glossary, documenting the technique’s rapid diffusion.',
      },
      {
        year: 2025,
        title: 'NYT “software for one” experiments',
        description: '_The New York Times_ highlighted Kevin Roose’s personal automation projects built entirely through vibe coding prompts.',
      },
      {
        year: 2025,
        title: 'Y Combinator reports AI-heavy codebases',
        description: 'Y Combinator disclosed that 25% of its Winter 2025 startups had codebases that were 95% AI-generated, signalling institutional interest.',
      },
      {
        year: 2025,
        title: 'Fast Company warns of “hangover”',
        description: 'By September 2025 coverage shifted to the risks of opaque, AI-generated systems and the operational debt they introduce.',
      },
    ],
  },
  {
    slug: 'vibecoding-culture',
    title: 'VibeCoding Culture',
    summary:
      'Shared rituals, design heuristics, and collaborative norms that keep vibe-first software sessions inclusive and deliberate.',
    tags: ['culture', 'best-practices', 'community'],
    categories: ['Culture'],
    popularity: 88,
    createdAt: '2021-11-07T12:00:00.000Z',
    updatedAt: '2025-07-22T16:20:00.000Z',
    relatedTopics: ['origins-of-vibecoding', 'vibecoding-tools'],
    sections: [
      {
        heading: 'Session rituals',
        content:
          'Many teams begin with a “vibe calibration”: playlists, lighting, and accessibility notes are logged before a single commit. Creative communities such as the <a href="https://sfpc.study/">School for Poetic Computation</a> and <a href="https://friends.figma.com/">Friends of Figma: Music & Audio</a> share templates for mood boards, consent cues, and documentation so everyone understands the emotional arc the group is trying to create.',
      },
      {
        heading: 'Design heuristics',
        content:
          'Practitioners adapt interaction-design research to back the catchphrase “build the feel, then the feature.” IDEO’s <a href="https://www.ideou.com/blogs/inspiration/what-is-human-centered-design">human-centred design principles</a> and Stanford’s d.school playbooks frequently appear in vibe session briefs, reminding teams to prototype sensory feedback, ramp-down states, and the transition moments that define an experience.',
      },
      {
        heading: 'Community spaces',
        content:
          'The culture spans Discord servers (Future of Coding, buildspace), Twitch residencies, and co-located events such as <a href="https://algorave.com/">Algorave meetups</a> and Music Hackspace salons. Facilitators encourage rotating roles—DJ, scribe, engineer—to keep contributions balanced and to capture learnings for future sessions.',
      },
    ],
    timeline: [
      {
        year: 2013,
        title: 'School for Poetic Computation launches',
        description: 'SFPC’s founding cohort formalised creative coding workshops that blended aesthetics, code, and community care—an early blueprint for vibe-centric practice.',
      },
      {
        year: 2018,
        title: 'Hydra live-coding streams take off',
        description: 'Olivia Jack’s browser-based visual synthesiser popularised collaborative audiovisual jams on Twitch, foregrounding ambience in real-time programming.',
      },
      {
        year: 2025,
        title: '“Vibe coding” spaces proliferate on X and Discord',
        description: 'Following Karpathy’s tweet, moderators spun up recurring `#vibecoding` talks and Discord channels dedicated to sharing reference playlists, lighting setups, and facilitation tips.',
      },
    ],
  },
  {
    slug: 'timeline-of-vibecoding',
    title: 'Timeline of VibeCoding',
    summary: 'Chronicles how the term “vibe coding” spread from Karpathy’s February 2025 post through media coverage, startup adoption, and subsequent scrutiny.',
    tags: ['timeline', 'history', 'events'],
    categories: ['History'],
    popularity: 75,
    createdAt: '2022-02-01T09:30:00.000Z',
    updatedAt: '2025-02-14T11:12:00.000Z',
    relatedTopics: ['origins-of-vibecoding', 'vibecoding-hackathons'],
    sections: [
      {
        heading: 'Media coverage',
        content:
          'After the February 2025 X thread, outlets such as Ars Technica, _The Times of India_, and _The New York Times_ explained vibe coding to broad audiences, documenting Karpathy’s “accept all diffs” attitude and the conversational loop between developer and model.',
      },
      {
        heading: 'Adoption metrics',
        content:
          'Within weeks, Y Combinator reported a surge of AI-generated codebases, while _The Wall Street Journal_ and _IEEE Spectrum_ interviewed engineers who were trialling vibe coding for rapid learning and prototyping. The term even appeared in Merriam-Webster’s Slang & Trending list, signalling mainstream curiosity.',
      },
      {
        heading: 'Debate and backlash',
        content:
          'Critics—including Gary Marcus and Simon Willison—highlighted quality, security, and maintenance risks. Later coverage from _Fast Company_ and SaaStr chronicled “vibe coding hangovers,” including production outages and destructive agent behaviour.',
      },
    ],
    timeline: [
      {
        year: 2025,
        title: 'Karpathy tweet defines vibe coding',
        description: '2 February 2025: Andrej Karpathy coins the term publicly, framing a hands-off, AI-guided development loop.',
      },
      {
        year: 2025,
        title: 'Ars Technica deep-dive',
        description: '5 March 2025: Ars Technica’s “Will the future of software development run on vibes?” unpacks benefits and risks for engineers.',
      },
      {
        year: 2025,
        title: '_New York Times_ “software for one” feature',
        description: 'March 2025: Kevin Roose experiments with vibe coding to build personal productivity tools, coining the “software for one” framing.',
      },
      {
        year: 2025,
        title: 'Y Combinator adoption metric',
        description: 'March 2025: Y Combinator notes that 25% of its Winter 2025 startups have codebases that are 95% AI-generated.',
      },
      {
        year: 2025,
        title: 'Wall Street Journal reports commercial trials',
        description: 'July 2025: _The Wall Street Journal_ documents vibe coding entering professional software teams.',
      },
      {
        year: 2025,
        title: 'Fast Company warns of “hangover”',
        description: 'September 2025: _Fast Company_ chronicles production issues and developer burnout from relying on vibe-coded systems.',
      },
    ],
  },
  {
    slug: 'vibecoding-tools',
    title: 'VibeCoding Tools',
    summary: 'Creative coding environments, audio-reactive utilities, and collaboration stacks that underpin modern vibe-led workflows.',
    tags: ['tools', 'stack', 'productivity'],
    categories: ['Tools'],
    popularity: 82,
    createdAt: '2022-05-15T18:45:00.000Z',
    updatedAt: '2025-03-04T09:00:00.000Z',
    relatedTopics: ['vibecoding-companies', 'vibecoding-best-practices'],
    sections: [
      {
        heading: 'Creative coding environments',
        content:
          'Browser-based tools such as <a href="https://hydra.ojack.xyz/">Hydra</a>, <a href="https://p5js.org/">p5.js</a>, and <a href="https://derivative.ca/">TouchDesigner</a> remain the fastest way to audition visuals against audio. On the web side, combinations of Astro, React, and Convex—often packaged as “GlowStack” starters—let teams hydrate interactive islands only where needed, keeping performance smooth even while streaming Web Audio data.',
      },
      {
        heading: 'Audio-reactive utilities',
        content:
          'Libraries like <a href="https://tonejs.github.io/">Tone.js</a>, <a href="https://github.com/djipco/webmidi">WebMidi.js</a>, and <a href="https://www.ableton.com/link/">Ableton Link</a> allow JavaScript apps to sync tempo, detect beats, or respond to MIDI controllers. Desktop producers rely on <a href="https://www.ableton.com/en/live/max-for-live/">Max for Live</a> and <a href="https://hexler.net/touchosc">TouchOSC</a> to feed sensor data into prototypes, while open-source projects such as <a href="https://ofxaddons.com/">ofxAddons</a> extend the pipeline for Cinder and openFrameworks.',
      },
      {
        heading: 'Collaboration & deployment',
        content:
          'Vibe sessions are usually scaffolded in FigJam or Miro, with <a href="https://www.notion.so/">Notion</a> or <a href="https://obsidian.md/">Obsidian</a> capturing playlists, lighting notes, and retrospective insights. Deployment typically hinges on serverless-friendly hosts like Netlify or Vercel paired with analytics tools that can track qualitative feedback alongside metrics.',
      },
    ],
    timeline: [
      {
        year: 2016,
        title: 'Ableton Link SDK open-sourced',
        description: 'Ableton released the Link SDK, making network-synchronised tempo control accessible to creative coders and web developers.',
      },
      {
        year: 2018,
        title: 'Hydra public release',
        description: 'Hydra shifted live visuals into the browser, encouraging hybrid VJ + developer workflows.',
      },
      {
        year: 2020,
        title: 'VS Code Live Share gains adoption',
        description: 'Live Share and similar multiplayer coding tools made remote vibe sessions viable during pandemic-era distributed jams.',
      },
      {
        year: 2023,
        title: 'Figma Variables',
        description: 'Figma rolled out Variables and Dev Mode, giving vibe teams first-class support for theming tokens tied to states like mood or tempo.',
      },
      {
        year: 2024,
        title: 'WebGPU ships broadly',
        description: 'WebGPU reaching stable releases in Chromium browsers unlocked smoother audio-reactive shaders in production web apps.',
      },
    ],
  },
  {
    slug: 'vibecoding-companies',
    title: 'VibeCoding Companies',
    summary: 'Studios, startups, and enterprises that apply vibe-led principles to immersive products, generative soundscapes, and experiential retail.',
    tags: ['companies', 'adoption', 'case-studies'],
    categories: ['Companies'],
    popularity: 64,
    createdAt: '2023-01-10T14:10:00.000Z',
    updatedAt: '2025-08-09T12:34:00.000Z',
    relatedTopics: ['vibecoding-tools', 'vibecoding-hackathons'],
    sections: [
      {
        heading: 'Studios',
        content:
          'Immersive studios such as <a href="https://momentfactory.com/">Moment Factory</a> and <a href="https://www.futurecolossal.com/">Future Colossal</a> craft multisensory installations for airports, concerts, and flagship retail. Their process mirrors vibe coding: multidisciplinary teams prototype narrative, lighting, and software simultaneously before locking in final production.',
      },
      {
        heading: 'Startups',
        content:
          'Companies like <a href="https://endel.io/">Endel</a> (personalised generative soundscapes) and <a href="https://www.patchxr.com/">PatchXR</a> (spatial audio creation) bring vibe-first thinking to consumer apps. Productivity platforms such as <a href="https://linear.app/">Linear</a> and <a href="https://www.notion.so/">Notion</a> have internal “vibe docs” that guide product polish, illustrating how mainstream startup teams integrate the language.',
      },
      {
        heading: 'Enterprise adoption',
        content:
          'Experience-led consultancies report increased enterprise demand after the 2025 spike in interest. Nike’s <a href="https://www.nike.com/rise">Rise</a> concept stores (produced with Moment Factory) and the <a href="https://www.atlassian.com/remote">Atlassian Team Anywhere</a> playbooks emphasise environmental cues, soundtrack design, and narrative onboarding—core concerns for vibe-focused teams.',
      },
    ],
    timeline: [
      {
        year: 2012,
        title: 'Moment Factory’s MDNA tour visuals',
        description: 'Moment Factory’s collaboration with Madonna showcased large-scale interactive visuals controlled in real time, inspiring future vibe-first stage productions.',
      },
      {
        year: 2019,
        title: 'Endel partners with Warner Music',
        description: 'Generative soundscape startup Endel signed a distribution deal with Warner Music Group, validating ambient-first digital products.',
      },
      {
        year: 2021,
        title: 'Nike Rise concept store opens in Seoul',
        description: 'Moment Factory and Nike launched a data-driven retail experience that adapts visuals, narrative, and audio based on local community metrics.',
      },
      {
        year: 2024,
        title: 'Future Colossal launches Verizon 5G Lab experiences',
        description: 'Interactive rooms at Verizon’s Innovation Labs blended real-time data, lighting, and responsive UI, highlighting enterprise appetite for vibe-centric storytelling.',
      },
    ],
  },
  {
    slug: 'vibecoding-hackathons',
    title: 'VibeCoding Hackathons',
    summary: 'Hybrid hackathons, residencies, and festivals where audio, visuals, and code are prototyped in synchrony.',
    tags: ['hackathons', 'events', 'community'],
    categories: ['Hackathons'],
    popularity: 71,
    createdAt: '2022-09-03T20:00:00.000Z',
    updatedAt: '2025-06-11T06:22:00.000Z',
    relatedTopics: ['timeline-of-vibecoding', 'vibecoding-tutorials'],
    sections: [
      {
        heading: 'Format overview',
        content:
          'Vibe-flavoured hackathons blend music hack camps, creative code labs, and classic startup sprints. Many adopt practices from <a href="https://musictechfest.net/">Music Tech Fest</a> and <a href="https://www.mitrealityhack.com/">MIT Reality Hack</a>: sound checks, sensory accessibility walk-throughs, and cross-disciplinary squads that pair engineers with composers and VJs.',
      },
      {
        heading: 'Award categories',
        content:
          'Events often add prizes beyond “best technical implementation”; categories such as “Most Immersive Journey” (Music Tech Fest) or “Outstanding Spatial Experience” (MIT Reality Hack) reward teams who craft emotional arcs. Accessibility awards are increasingly common, inspired by guidelines from organisations like <a href="https://designjustice.org/">Design Justice</a>.',
      },
      {
        heading: 'Notable events',
        content:
          'Long-running gatherings—including <a href="https://musichackspace.org/">Music Hackspace hackathons</a>, <a href="https://loop.ableton.com/">Ableton Loop</a>, and <a href="https://algorave.com/">Algorave residencies</a>—provide a blueprint for vibe coding jams. Newer developer events such as <a href="https://hackaday.com/">Hackaday’s Music Tech stage</a> and open-source XR hack weeks adopt similar rituals.',
      },
    ],
    timeline: [
      {
        year: 2013,
        title: 'Music Tech Fest Hack Camp',
        description: 'MTF’s Hack Camp format invited musicians, coders, and designers to co-create performances within 24–48 hours, centring vibe as a success metric.',
      },
      {
        year: 2016,
        title: 'Ableton Loop collaborative labs',
        description: 'Loop workshops introduced guided prototyping sessions focused on emotional storytelling through sound and visuals.',
      },
      {
        year: 2020,
        title: 'Remote music-tech hackathons',
        description: 'Pandemic-era events such as #HackTheMusic and Music Hackspace’s online sprints proved that distributed vibe jams could still feel communal.',
      },
      {
        year: 2024,
        title: 'MIT Reality Hack highlights multisensory design',
        description: 'Teams at MIT’s XR hackathon produced award-winning projects that synchronised lighting, haptics, and audio for immersive storytelling.',
      },
      {
        year: 2025,
        title: 'Hybrid Algorave + hackathon weekends',
        description: 'Algorave organisers paired daytime prototyping labs with nightly performances, giving the VibeCoding community a recurring global venue.',
      },
    ],
  },
  {
    slug: 'vibecoding-tutorials',
    title: 'VibeCoding Tutorials',
    summary: 'Learning resources for combining code, music, and experience design—from beginner-friendly creative coding lessons to advanced facilitation guides.',
    tags: ['tutorials', 'learning', 'best-practices'],
    categories: ['Tutorials'],
    popularity: 78,
    createdAt: '2023-05-02T17:05:00.000Z',
    updatedAt: '2025-05-19T10:40:00.000Z',
    relatedTopics: ['vibecoding-best-practices'],
    sections: [
      {
        heading: 'Getting started',
        content:
          'Beginners often start with <a href="https://www.youtube.com/c/TheCodingTrain">The Coding Train</a> p5.js playlists, <a href="https://www.kadenze.com/">Kadenze</a> courses on creative coding, and Ableton’s free <a href="https://learningsynths.ableton.com/">Learning Synths</a>. These resources teach how to map visuals, rhythm, and interaction without heavy setup.',
      },
      {
        heading: 'Intermediate flows',
        content:
          'Developers who want to wire audio into web apps turn to <a href="https://tonejs.github.io/docs/">Tone.js tutorials</a>, <a href="https://hydra-book.glitch.me/">Hydra workshops</a>, and Observable notebooks that demonstrate beat detection, shader feedback loops, and synced lighting controls.',
      },
      {
        heading: 'Advanced playbooks',
        content:
          'Facilitators study material from the <a href="https://sfpc.study/">School for Poetic Computation</a>, MIT Media Lab’s “Designing for Emerging Media” courses, and community-written vibe session retrospectives that track emotional beats alongside metrics. These playbooks emphasise consent practices, accessibility, and documentation.',
      },
    ],
    timeline: [
      {
        year: 2016,
        title: 'The Coding Train launches live streams',
        description: 'Daniel Shiffman’s live tutorials lowered the barrier to generative art and established a friendly entry point for creative coding.',
      },
      {
        year: 2018,
        title: 'Hydra documentation published',
        description: 'Olivia Jack released open documentation and workshops for Hydra, enabling browser-based audiovisual improvisation.',
      },
      {
        year: 2020,
        title: 'Ableton Learning Synths goes live',
        description: 'Ableton’s interactive site taught music theory and synthesis basics using the same mindset vibe coders apply to calibrating mood.',
      },
      {
        year: 2023,
        title: 'MIT Media Lab shares multisensory design curriculum',
        description: 'Public syllabi and recordings from classes such as “Designing for Emergent Media” offered case studies on orchestrating emotion across modalities.',
      },
    ],
  },
  {
    slug: 'vibecoding-best-practices',
    title: 'VibeCoding Best Practices',
    summary: 'Guidelines that balance emotional resonance with accessibility, documentation, and technical sustainability.',
    tags: ['best-practices', 'culture', 'architecture'],
    categories: ['Best Practices'],
    popularity: 83,
    createdAt: '2023-08-28T13:30:00.000Z',
    updatedAt: '2025-09-29T19:05:00.000Z',
    relatedTopics: ['vibecoding-tutorials', 'vibecoding-culture'],
    sections: [
      {
        heading: 'Emotional safety',
        content:
          'Adopt explicit consent practices drawn from the <a href="https://designjustice.org/">Design Justice Network principles</a> and the <a href="https://sfpc.study/about/code-of-conduct">SFPC Code of Conduct</a>. Provide opt-out signals, offer quiet channels, and document sensory considerations so collaborators can participate comfortably.',
      },
      {
        heading: 'Session hygiene',
        content:
          'Rotate facilitation roles, capture playlists with context, and log decisions in shared docs. Lightweight retro formats—such as “rose, thorn, bud” or vibe diaries in Notion—keep institutional memory without losing spontaneity.',
      },
      {
        heading: 'Technical sustainability',
        content:
          'Pair emotional goals with standards from the <a href="https://www.w3.org/WAI/standards-guidelines/wcag/">Web Content Accessibility Guidelines (WCAG)</a> and inclusive design toolkits. Maintain fallbacks for users who need reduced motion, contrast-friendly palettes, or alternate audio mixes. Automate checks where possible (e.g., linting for contrast ratios or caption coverage).',
      },
    ],
    timeline: [
      {
        year: 2018,
        title: 'Inclusive Design Principles published',
        description: 'UK Government Digital Service and partners released Inclusive Design Principles, widely adopted by creative tech meetups.',
      },
      {
        year: 2020,
        title: 'Microsoft updates Inclusive Design Toolkit',
        description: 'The refreshed toolkit popularised persona spectrums and sensory checklists that many vibe teams reference.',
      },
      {
        year: 2021,
        title: 'Design Justice Network field guide',
        description: 'The network’s online guide offered community-centred facilitation practices that map directly to vibe sessions.',
      },
      {
        year: 2023,
        title: 'WCAG 2.2 finalised',
        description: 'The W3C released WCAG 2.2, introducing guidance on focus indicators and dragging gestures relevant to interactive installations.',
      },
      {
        year: 2025,
        title: 'Community “vibe doc” templates shared',
        description: 'Open-source Notion and Google Docs templates circulate across Discord servers, standardising how teams document intent, accessibility notes, and measurement plans.',
      },
    ],
  },
];

export function getArticleBySlug(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getRelatedArticles(slug: string) {
  const article = getArticleBySlug(slug);
  if (!article) return [];
  return article.relatedTopics
    .map((topicSlug) => getArticleBySlug(topicSlug))
    .filter(Boolean) as Article[];
}

