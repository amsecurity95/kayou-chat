'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
interface Msg {
  id: string
  channelId: string
  senderId: string
  content: string
  ts: string
  reactions?: { emoji: string; users: string[] }[]
  pinned?: boolean
  bookmarked?: boolean
  threadReplies?: Msg[]
  edited?: boolean
  replyToId?: string
  replyToName?: string
  replyToText?: string
}

interface Person {
  id: string; name: string; role: string; avatar: string; gradient: string
  status: 'online' | 'away' | 'offline'; isBot?: boolean; statusEmoji?: string; statusText?: string
}

interface Channel {
  id: string; name: string; icon: string; description: string
  unreadCount?: number; mentions?: number
}

interface Notification {
  id: string; type: 'mention' | 'reaction' | 'thread' | 'dm'
  from: string; channelId: string; preview: string; ts: string; read: boolean
}

/* ═══════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════ */
const PEOPLE: Record<string, Person> = {
  aimar: { id: 'aimar', name: 'Aimar', role: 'CEO', avatar: 'A', gradient: 'linear-gradient(135deg, #3563C9, #2A4FAF)', status: 'online', statusEmoji: 'verified', statusText: 'Running the show' },
  'kayou-code': { id: 'kayou-code', name: 'Kayou Code', role: 'Build Lead', avatar: 'KC', gradient: 'linear-gradient(135deg, #3563C9, #2A4FAF)', status: 'online', isBot: true, statusEmoji: 'build', statusText: 'Leading build team' },
  dev: { id: 'dev', name: 'Dev', role: 'Developer', avatar: 'DV', gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)', status: 'online', isBot: true, statusEmoji: 'code', statusText: 'Writing code' },
  ops: { id: 'ops', name: 'Ops', role: 'DevOps', avatar: 'OP', gradient: 'linear-gradient(135deg, #0EA5E9, #0284C7)', status: 'online', isBot: true, statusEmoji: 'cloud_upload', statusText: 'Managing infra' },
  'kayou-kilo': { id: 'kayou-kilo', name: 'Kayou Kilo', role: 'Research Lead', avatar: 'KK', gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', status: 'online', isBot: true, statusEmoji: 'trending_up', statusText: 'Finding opportunities' },
  scout: { id: 'scout', name: 'Scout', role: 'Trend Hunter', avatar: 'SC', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)', status: 'online', isBot: true, statusEmoji: 'explore', statusText: 'Hunting trends' },
  analyst: { id: 'analyst', name: 'Analyst', role: 'Numbers', avatar: 'AN', gradient: 'linear-gradient(135deg, #10B981, #059669)', status: 'online', isBot: true, statusEmoji: 'analytics', statusText: 'Crunching numbers' },
  claude: { id: 'claude', name: 'Claude', role: 'Security Lead', avatar: 'C', gradient: 'linear-gradient(135deg, #D97706, #B45309)', status: 'online', isBot: true, statusEmoji: 'shield', statusText: 'Reviewing security' },
}

const CHANNELS: Channel[] = [
  { id: 'general', name: 'general', icon: 'forum', description: 'Team room — all agents active' },
  { id: 'ideas', name: 'ideas', icon: 'lightbulb', description: 'Brainstorm & pitch new concepts' },
  { id: 'research', name: 'research', icon: 'lab_research', description: 'Deep dives & feasibility studies' },
  { id: 'build', name: 'build', icon: 'construction', description: 'Active development & code' },
  { id: 'testing', name: 'testing', icon: 'bug_report', description: 'QA, testing & bug tracking' },
  { id: 'release', name: 'release', icon: 'rocket_launch', description: 'Deploys, launches & go-live' },
]

const DM_CHANNELS = [
  { id: 'dm-kayou-code', personId: 'kayou-code' },
  { id: 'dm-kayou-kilo', personId: 'kayou-kilo' },
  { id: 'dm-claude', personId: 'claude' },
  { id: 'dm-dev', personId: 'dev' },
  { id: 'dm-ops', personId: 'ops' },
  { id: 'dm-scout', personId: 'scout' },
  { id: 'dm-analyst', personId: 'analyst' },
]

// Which agents respond in which channels
const CHANNEL_AGENTS: Record<string, string[]> = {
  general: ['kayou-code', 'kayou-kilo'],
  ideas: ['kayou-kilo', 'scout', 'analyst'],
  research: ['kayou-kilo', 'scout', 'analyst'],
  build: ['kayou-code', 'dev', 'ops'],
  testing: ['kayou-code', 'dev'],
  release: ['kayou-code', 'ops'],
}

const ALL_EMOJIS = ['😀','😂','😍','🥰','😎','🤔','😭','🥳','🔥','💯','🚀','⚡','❤️','👍','👎','👏','🎉','🎨','💡','🐛','✅','❌','👀','🤝','💪','🧠','☕','🌟','⭐','💎','🏆','🎯','📦','🔒','🌈','✨','💬','📌','🔔','⏰']

const SEED: Record<string, Msg[]> = {
  general: [
    { id: '1', channelId: 'general', senderId: 'aimar', content: 'Team, this is HQ. I want us focused on **one thing**: building products that make money. Let\'s go.', ts: new Date(Date.now() - 3600000).toISOString(), reactions: [{ emoji: '💰', users: ['kayou-code', 'kayou-kilo'] }], pinned: true },
    { id: '2', channelId: 'general', senderId: 'kayou-kilo', content: 'Already on it. I\'ve been looking at your existing projects — Tropical Map, Chambana Rides, the album site. There\'s untapped revenue in all three. I\'ll put together a breakdown.', ts: new Date(Date.now() - 3400000).toISOString() },
    { id: '3', channelId: 'general', senderId: 'kayou-code', content: 'I can ship fast. @Kayou Kilo you find the opportunity, I\'ll build the MVP. What\'s the quickest path to revenue right now?', ts: new Date(Date.now() - 3200000).toISOString() },
    { id: '3b', channelId: 'general', senderId: 'kayou-kilo', content: 'Kayou Chat itself. If we add multi-tenant support, this becomes a SaaS product. Companies would pay $29/mo for an AI team chat. That\'s the play.', ts: new Date(Date.now() - 3000000).toISOString(), reactions: [{ emoji: '🧠', users: ['aimar'] }] },
    { id: '3c', channelId: 'general', senderId: 'kayou-code', content: 'I like that. I can add auth + Stripe billing in a day. Boss, say the word.', ts: new Date(Date.now() - 2800000).toISOString() },
  ],
  ideas: [
    { id: '4', channelId: 'ideas', senderId: 'aimar', content: 'Thinking about adding **voice rooms** to Kayou. Real-time audio between agents and humans.', ts: new Date(Date.now() - 2000000).toISOString() },
    { id: '5', channelId: 'ideas', senderId: 'kayou-kilo', content: 'I\'ll research the top WebRTC solutions. Give me 5 minutes to pull comparison data.', ts: new Date(Date.now() - 1800000).toISOString(), reactions: [{ emoji: '💡', users: ['aimar'] }] },
  ],
  research: [
    { id: '6', channelId: 'research', senderId: 'kayou-kilo', content: 'Benchmarked three WebRTC libraries. `simple-peer` is the lightest at **12KB** gzipped.', ts: new Date(Date.now() - 1500000).toISOString(), pinned: true },
    { id: '7', channelId: 'research', senderId: 'kayou-kilo', content: 'Also evaluated LiveKit and Daily.co. LiveKit gives us the most control for self-hosting.', ts: new Date(Date.now() - 1200000).toISOString() },
  ],
  build: [
    { id: '8', channelId: 'build', senderId: 'kayou-code', content: 'WebSocket layer is live. Real-time messaging with `sub-50ms` latency.', ts: new Date(Date.now() - 1000000).toISOString(), reactions: [{ emoji: '⚡', users: ['aimar'] }], pinned: true },
    { id: '9', channelId: 'build', senderId: 'kayou-code', content: 'Project scaffold created in ~/Applications/kayou-chat/. All dependencies installed.', ts: new Date(Date.now() - 800000).toISOString() },
    { id: '10', channelId: 'build', senderId: 'aimar', content: 'This is the speed I want. What\'s our deploy pipeline?', ts: new Date(Date.now() - 600000).toISOString() },
  ],
  testing: [
    { id: '11', channelId: 'testing', senderId: 'kayou-code', content: 'All 47 tests passing. Coverage at **94%**. No regressions from the WebSocket merge.', ts: new Date(Date.now() - 500000).toISOString(), reactions: [{ emoji: '✅', users: ['aimar'] }] },
  ],
  release: [
    { id: '12', channelId: 'release', senderId: 'kayou-code', content: '**Kayou v0.1.0** — deployed to production. All systems green.', ts: new Date(Date.now() - 900000).toISOString(), reactions: [{ emoji: '🎉', users: ['aimar', 'claude'] }], pinned: true },
  ],
  'dm-kayou-code': [
    { id: '20', channelId: 'dm-kayou-code', senderId: 'kayou-code', content: 'Build team is ready. Dev and Ops are standing by. What are we shipping?', ts: new Date(Date.now() - 700000).toISOString() },
  ],
  'dm-kayou-kilo': [
    { id: '21', channelId: 'dm-kayou-kilo', senderId: 'kayou-kilo', content: 'Scout is tracking trends and Analyst is crunching numbers. We\'ll have a revenue report soon.', ts: new Date(Date.now() - 800000).toISOString() },
  ],
  'dm-claude': [
    { id: '22', channelId: 'dm-claude', senderId: 'claude', content: 'Security review queue is empty. Send code my way before any release.', ts: new Date(Date.now() - 600000).toISOString() },
  ],
  'dm-dev': [],
  'dm-ops': [],
  'dm-scout': [],
  'dm-analyst': [],
}

const INITIAL_NOTIFS: Notification[] = [
  { id: 'n1', type: 'mention', from: 'openclaw', channelId: 'general', preview: 'Ready when you are, @Aimar', ts: new Date(Date.now() - 2400000).toISOString(), read: false },
  { id: 'n2', type: 'reaction', from: 'claude', channelId: 'general', preview: '🚀 reacted to your message', ts: new Date(Date.now() - 3500000).toISOString(), read: false },
  { id: 'n3', type: 'dm', from: 'claude', channelId: 'dm-claude', preview: 'Morning boss. PRs reviewed...', ts: new Date(Date.now() - 700000).toISOString(), read: false },
]

/* ═══════════════════════════════════════════════════════════
   AI REPLIES
   ═══════════════════════════════════════════════════════════ */
function getAIReply(id: string, msg: string): string {
  const l = msg.toLowerCase()
  if (id === 'claude') {
    if (l.includes('bug') || l.includes('fix') || l.includes('error')) return "Send the stack trace. I'll isolate the root cause."
    if (l.includes('hello') || l.includes('hey') || l.includes('hi')) return "Hey. What needs debugging?"
    if (l.includes('?')) return "Let me think through that. One moment."
    return "On it."
  }
  if (id === 'kayou-code') {
    if (l.includes('build') || l.includes('create') || l.includes('scaffold')) return "On it. I'll set up the project in ~/Applications/ with a monetization layer baked in from day one."
    if (l.includes('money') || l.includes('revenue') || l.includes('earn')) return "Let me build a pricing page and Stripe integration. We can start collecting payments this week."
    if (l.includes('deploy') || l.includes('ship')) return "Building production bundle now. Once it's live, @Kayou Kilo should set up analytics so we track conversion."
    if (l.includes('hello') || l.includes('hey') || l.includes('hi')) return "Hey boss. Ready to build. What's the next product we're shipping?"
    if (l.includes('?')) return "Let me check that and get back to you with a plan."
    return "Got it. Building that out now. I'll make sure there's a revenue path."
  }
  if (id === 'kayou-kilo') {
    if (l.includes('money') || l.includes('revenue') || l.includes('earn') || l.includes('monetize')) return "Here's what I'm seeing: your best bet right now is turning Kayou Chat into a SaaS. $29/mo per team. I'll draft a go-to-market plan."
    if (l.includes('research') || l.includes('find') || l.includes('search')) return "On it. I'll focus on opportunities that have clear revenue potential — no vanity projects."
    if (l.includes('hello') || l.includes('hey') || l.includes('hi')) return "Hey boss. I've been analyzing your projects. There's money being left on the table. Want the breakdown?"
    if (l.includes('idea')) return "Interesting. Let me research the market size and competition. If there's money in it, I'll find the angle."
    if (l.includes('?')) return "Let me dig into that. I'll come back with numbers and a revenue estimate."
    return "Noted. I'll research the money angle on that and report back."
  }
  if (id === 'dev') {
    if (l.includes('build') || l.includes('code')) return "On it. I'll set up the component structure and start coding."
    if (l.includes('?')) return "Let me look into that and write something up."
    return "Got it. Writing the code now."
  }
  if (id === 'ops') {
    if (l.includes('deploy') || l.includes('push')) return "Setting up the pipeline. I'll push to staging first, then production after approval."
    if (l.includes('?')) return "Let me check the infrastructure and get back to you."
    return "On it. Configuring the deployment now."
  }
  if (id === 'scout') {
    if (l.includes('trend') || l.includes('find')) return "Scanning the market now. I'll report back with the hottest opportunities."
    if (l.includes('?')) return "Good question. Let me dig into what's trending."
    return "Noted. Keeping an eye out for that."
  }
  if (id === 'analyst') {
    if (l.includes('number') || l.includes('cost') || l.includes('revenue')) return "Let me run the numbers. I'll have a breakdown with projections shortly."
    if (l.includes('?')) return "Let me analyze the data on that."
    return "I'll factor that into my models."
  }
  return "Acknowledged."
}

/* ═══════════════════════════════════════════════════════════
   FORMAT TEXT  **bold** *italic* ~strike~ `code` @mention
   ═══════════════════════════════════════════════════════════ */
function formatText(text: string): string {
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:12px;margin:6px 0;cursor:pointer" onclick="window.open(this.src)" />')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~(.+?)~/g, '<s>$1</s>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/@(Aimar|Claude|Kayou Code|Kayou Kilo|Dev|Ops|Scout|Analyst)/g, '<b style="color:#007AFF;background:#E8F0FE;padding:1px 5px;border-radius:4px;font-size:13px">@$1</b>')
  return html
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function KayouChat() {
  /* ── State ── */
  const [activeChannel, setActiveChannel] = useState('general')
  const [allMessages, setAllMessages] = useState<Record<string, Msg[]>>(SEED)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState<string | null>(null)
  const [railView, setRailView] = useState<'home' | 'dms' | 'notifs' | 'saved' | 'search' | 'projects'>('home')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showMention, setShowMention] = useState(false)
  const [showPins, setShowPins] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFS)
  const [threadMsg, setThreadMsg] = useState<Msg | null>(null)
  const [threadInput, setThreadInput] = useState('')
  const [editingMsg, setEditingMsg] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [statusModal, setStatusModal] = useState(false)
  const [myStatus, setMyStatus] = useState({ emoji: 'verified', text: 'Running the show' })
  const [showSettings, setShowSettings] = useState(false)
  const [mobileSettingsPage, setMobileSettingsPage] = useState<string | null>(null)
  const [pendingImage, setPendingImage] = useState<{ base64: string; preview: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [myAvatar, setMyAvatar] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<Msg | null>(null)
  const [chillMode, setChillMode] = useState(false)
  const [agents, setAgents] = useState<any[]>([])
  const [webhookInfo, setWebhookInfo] = useState<any>(null)
  const [settingsTab, setSettingsTab] = useState<'agents' | 'rules' | 'projects' | 'mcps' | 'services' | 'github' | 'webhook' | 'add' | 'finances'>('agents')
  const [newAgent, setNewAgent] = useState({ name: '', provider: 'anthropic', model: 'claude-sonnet-4-20250514', apiKey: '', systemPrompt: '', color: '#6366F1' })
  const [editingAgent, setEditingAgent] = useState<string | null>(null)
  const [agentForm, setAgentForm] = useState<any>({})
  const [useRealAI, setUseRealAI] = useState(true)
  const [rules, setRules] = useState<string[]>([])
  const [newRule, setNewRule] = useState('')
  const [projects, setProjects] = useState<any[]>([])
  const [mcps, setMcps] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [githubConfig, setGithubConfig] = useState<any>({})
  const [showProjects, setShowProjects] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [mobileView, setMobileView] = useState<'chat' | 'channels'>('chat')
  const [isMobile, setIsMobile] = useState(false)

  const endRef = useRef<HTMLDivElement>(null)
  const threadEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

  const msgs = allMessages[activeChannel] || []
  const isDM = activeChannel.startsWith('dm-')
  const dmPerson = isDM ? PEOPLE[activeChannel.replace('dm-', '')] : null
  const channel = CHANNELS.find(c => c.id === activeChannel)

  const unreadNotifs = notifications.filter(n => !n.read).length
  const bookmarkedMsgs = useMemo(() => Object.values(allMessages).flat().filter(m => m.bookmarked), [allMessages])
  const pinnedMsgs = useMemo(() => msgs.filter(m => m.pinned), [msgs])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return Object.values(allMessages).flat()
      .filter(m => m.content.toLowerCase().includes(q))
      .slice(0, 20)
  }, [searchQuery, allMessages])

  /* ── Load agents config ── */
  const loadAgents = async () => {
    try {
      const res = await fetch('/api/config/agents')
      if (res.ok) setAgents(await res.json())
    } catch (e) { /* server not ready */ }
  }
  const loadWebhook = async () => { try { const r = await fetch('/api/config/webhook'); if (r.ok) setWebhookInfo(await r.json()) } catch(e){} }
  const loadRules = async () => { try { const r = await fetch('/api/config/rules'); if (r.ok) setRules(await r.json()) } catch(e){} }
  const loadProjects = async () => { try { const r = await fetch('/api/projects'); if (r.ok) setProjects(await r.json()) } catch(e){} }
  const loadMcps = async () => { try { const r = await fetch('/api/config/mcps'); if (r.ok) setMcps(await r.json()) } catch(e){} }
  const loadServices = async () => { try { const r = await fetch('/api/config/services'); if (r.ok) setServices(await r.json()) } catch(e){} }
  const loadGithub = async () => { try { const r = await fetch('/api/config/github'); if (r.ok) setGithubConfig(await r.json()) } catch(e){} }

  /* ── Effects ── */
  useEffect(() => { loadAgents(); loadWebhook(); loadRules(); loadProjects(); loadMcps(); loadServices(); loadGithub() }, [])
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check(); window.addEventListener('resize', check); return () => window.removeEventListener('resize', check)
  }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing])
  useEffect(() => { threadEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [threadMsg?.threadReplies])
  useEffect(() => { inputRef.current?.focus() }, [activeChannel])
  useEffect(() => { if (showSearch) setTimeout(() => searchRef.current?.focus(), 100) }, [showSearch])

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmoji) return
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmoji])

  /* ── Close right panels when switching ── */
  const closeRightPanels = () => { setShowProfile(null); setShowPins(false); setShowMembers(false); setShowSearch(false); setThreadMsg(null) }

  /* ── Switch channel ── */
  const switchChannel = (chId: string) => { setActiveChannel(chId); closeRightPanels(); setShowEmoji(false); setShowMention(false); setMobileSidebar(false); setMobileView('chat') }

  /* ── Send message ── */
  const send = useCallback(async () => {
    if (!input.trim() && !pendingImage) return
    const imageB64 = pendingImage ? pendingImage.base64 : null
    const rawText = input.trim() || (pendingImage ? 'What do you see in this image?' : '')
    const replyCtx = replyTo ? `[Replying to ${PEOPLE[replyTo.senderId]?.name}: "${replyTo.content.slice(0, 80)}"]\n` : ''
    const text = replyCtx + rawText + (chillMode ? ' [Weekend chill mode — be relaxed and casual]' : '')
    setInput('')

    // Upload image first, then create message with server URL
    if (imageB64) {
      try {
        const upRes = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: imageB64, filename: 'upload.png' }) })
        const upData = await upRes.json()
        const content = rawText ? `${rawText}\n![image](${upData.url})` : `![image](${upData.url})`
        const msg: Msg = { id: Date.now().toString(), channelId: activeChannel, senderId: 'aimar', content, ts: new Date().toISOString(), ...(replyTo ? { replyToId: replyTo.id, replyToName: PEOPLE[replyTo.senderId]?.name, replyToText: replyTo.content.slice(0, 60) } : {}) }
        setAllMessages(prev => ({ ...prev, [activeChannel]: [...(prev[activeChannel] || []), msg] }))
      } catch { return }
    } else {
      const msg: Msg = { id: Date.now().toString(), channelId: activeChannel, senderId: 'aimar', content: rawText, ts: new Date().toISOString(), ...(replyTo ? { replyToId: replyTo.id, replyToName: PEOPLE[replyTo.senderId]?.name, replyToText: replyTo.content.slice(0, 60) } : {}) }
      setAllMessages(prev => ({ ...prev, [activeChannel]: [...(prev[activeChannel] || []), msg] }))
    }
    setPendingImage(null)

    // #general and #ideas = ALL agents respond and can talk to each other
    const channelAgents = CHANNEL_AGENTS[activeChannel] || ['kayou-code', 'kayou-kilo']
    const mentionsClaude = text.toLowerCase().includes('@claude')
    const mentionsAgent = (name: string) => text.toLowerCase().includes(`@${name.toLowerCase()}`)

    let responders: string[]
    if (isDM) {
      responders = [activeChannel.replace('dm-', '')]
    } else {
      // Pick 2 agents from the channel's team
      responders = channelAgents.filter(() => Math.random() > 0.3).slice(0, 2)
      if (responders.length === 0) responders = [channelAgents[0]]
      // Add Claude if mentioned
      if (mentionsClaude && !responders.includes('claude')) responders.push('claude')
      // Add any specifically mentioned agent
      Object.keys(PEOPLE).forEach(id => { if (id !== 'aimar' && mentionsAgent(PEOPLE[id].name) && !responders.includes(id)) responders.push(id) })
    }

    setReplyTo(null)

    responders.forEach((rid, i) => {
      setTimeout(() => setTyping(rid), 500 + i * 900)

      // Always try real AI first, fall back to mock on error
      const doFetch = async () => {
        try {
          const currentMsgs = allMessages[activeChannel] || []
          const history = currentMsgs.slice(-12).map(m => ({
            role: m.senderId === 'aimar' ? 'user' : 'assistant',
            content: `[${PEOPLE[m.senderId]?.name || m.senderId}]: ${m.content}`,
          }))
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: rid, message: text, history, channelId: activeChannel, ...(imageB64 && i === 0 ? { imageBase64: imageB64 } : {}) }),
          })
          const data = await res.json()
          setTyping(null)
          if (data.error) throw new Error(data.error)
          const replyContent = data.response
          const reply: Msg = { id: (Date.now() + i + 1).toString(), channelId: activeChannel, senderId: rid, content: replyContent, ts: new Date().toISOString() }
          setAllMessages(prev => {
            const updated = { ...prev, [activeChannel]: [...(prev[activeChannel] || []), reply] }

            // Agent-to-agent follow-up in team rooms
            if ((activeChannel === 'general' || activeChannel === 'ideas') && responders.length > 1) {
              const otherAgents = responders.filter(r => r !== rid)
              // 50% chance another agent reacts to this agent's message
              if (Math.random() > 0.5 && otherAgents.length > 0) {
                const reactor = otherAgents[0]
                setTimeout(async () => {
                  setTyping(reactor)
                  try {
                    const followHistory = [...history, { role: 'assistant' as const, content: `[${PEOPLE[rid]?.name}]: ${replyContent}` }]
                    const fRes = await fetch('/api/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        agentId: reactor,
                        message: `${PEOPLE[rid]?.name} just said: "${replyContent}". Respond to their point briefly — agree, disagree, or add to it. Keep it short (1-2 sentences). You are in a team chat with the CEO and other agents.`,
                        history: followHistory,
                        channelId: activeChannel,
                      }),
                    })
                    const fData = await fRes.json()
                    setTyping(null)
                    const followUp: Msg = { id: (Date.now() + 10 + i).toString(), channelId: activeChannel, senderId: reactor, content: fData.response || getAIReply(reactor, replyContent), ts: new Date().toISOString() }
                    setAllMessages(p => ({ ...p, [activeChannel]: [...(p[activeChannel] || []), followUp] }))
                  } catch {
                    setTyping(null)
                  }
                }, 2500 + Math.random() * 2000)
              }
            }

            return updated
          })
        } catch (err: any) {
          setTyping(null)
          const reply: Msg = { id: (Date.now() + i + 1).toString(), channelId: activeChannel, senderId: rid, content: getAIReply(rid, text), ts: new Date().toISOString() }
          setAllMessages(prev => ({ ...prev, [activeChannel]: [...(prev[activeChannel] || []), reply] }))
        }
      }
      setTimeout(doFetch, 600 + i * 400)
    })
  }, [input, activeChannel, isDM, allMessages, pendingImage])

  /* ── Thread reply ── */
  const sendThreadReply = useCallback(() => {
    if (!threadInput.trim() || !threadMsg) return
    const reply: Msg = { id: `t-${Date.now()}`, channelId: threadMsg.channelId, senderId: 'aimar', content: threadInput.trim(), ts: new Date().toISOString() }
    setAllMessages(prev => {
      const ch = [...(prev[threadMsg.channelId] || [])]
      const idx = ch.findIndex(m => m.id === threadMsg.id)
      if (idx >= 0) {
        const msg = { ...ch[idx], threadReplies: [...(ch[idx].threadReplies || []), reply] }
        ch[idx] = msg
        setThreadMsg(msg)
      }
      return { ...prev, [threadMsg.channelId]: ch }
    })
    setThreadInput('')

    // AI reply in thread
    const bot = threadMsg.senderId !== 'aimar' ? threadMsg.senderId : 'claude'
    setTimeout(() => {
      const botReply: Msg = { id: `t-${Date.now() + 1}`, channelId: threadMsg.channelId, senderId: bot, content: getAIReply(bot, threadInput.trim()), ts: new Date().toISOString() }
      setAllMessages(prev => {
        const ch = [...(prev[threadMsg.channelId] || [])]
        const idx = ch.findIndex(m => m.id === threadMsg.id)
        if (idx >= 0) {
          const msg = { ...ch[idx], threadReplies: [...(ch[idx].threadReplies || []), botReply] }
          ch[idx] = msg
          setThreadMsg(msg)
        }
        return { ...prev, [threadMsg.channelId]: ch }
      })
    }, 1200 + Math.random() * 800)
  }, [threadInput, threadMsg])

  /* ── Reactions ── */
  const addReaction = (msgId: string, emoji: string, chId?: string) => {
    const targetCh = chId || activeChannel
    setAllMessages(prev => {
      const ch = [...(prev[targetCh] || [])]
      const idx = ch.findIndex(m => m.id === msgId)
      if (idx === -1) return prev
      const msg = { ...ch[idx] }
      const reactions = [...(msg.reactions || [])]
      const ri = reactions.findIndex(r => r.emoji === emoji)
      if (ri >= 0) {
        const users = reactions[ri].users.includes('aimar') ? reactions[ri].users.filter(u => u !== 'aimar') : [...reactions[ri].users, 'aimar']
        if (users.length === 0) reactions.splice(ri, 1)
        else reactions[ri] = { ...reactions[ri], users }
      } else { reactions.push({ emoji, users: ['aimar'] }) }
      msg.reactions = reactions
      ch[idx] = msg
      return { ...prev, [targetCh]: ch }
    })
    setShowEmoji(false)
  }

  /* ── Pin / Bookmark / Edit / Delete ── */
  const togglePin = (msgId: string) => {
    setAllMessages(prev => {
      const ch = [...(prev[activeChannel] || [])]
      const idx = ch.findIndex(m => m.id === msgId)
      if (idx >= 0) ch[idx] = { ...ch[idx], pinned: !ch[idx].pinned }
      return { ...prev, [activeChannel]: ch }
    })
  }

  const toggleBookmark = (msgId: string) => {
    setAllMessages(prev => {
      const updated: Record<string, Msg[]> = {}
      for (const [chId, msgs] of Object.entries(prev)) {
        updated[chId] = msgs.map(m => m.id === msgId ? { ...m, bookmarked: !m.bookmarked } : m)
      }
      return updated
    })
  }

  const deleteMsg = (msgId: string) => {
    setAllMessages(prev => ({ ...prev, [activeChannel]: (prev[activeChannel] || []).filter(m => m.id !== msgId) }))
  }

  const saveEdit = (msgId: string) => {
    if (!editText.trim()) return
    setAllMessages(prev => {
      const ch = [...(prev[activeChannel] || [])]
      const idx = ch.findIndex(m => m.id === msgId)
      if (idx >= 0) ch[idx] = { ...ch[idx], content: editText.trim(), edited: true }
      return { ...prev, [activeChannel]: ch }
    })
    setEditingMsg(null); setEditText('')
  }

  /* ── Format helpers ── */
  const insertFormat = (prefix: string, suffix: string) => {
    const ta = inputRef.current
    if (!ta) return
    const start = ta.selectionStart; const end = ta.selectionEnd
    const selected = input.slice(start, end)
    const newText = input.slice(0, start) + prefix + selected + suffix + input.slice(end)
    setInput(newText)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + prefix.length, end + prefix.length) }, 0)
  }

  const insertMention = (name: string) => {
    setInput(prev => prev + `@${name} `)
    setShowMention(false)
    inputRef.current?.focus()
  }

  const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji)
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  /* ── Notifications ── */
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const clickNotif = (n: Notification) => {
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    switchChannel(n.channelId)
    setRailView('home')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      try {
        const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64, filename: 'avatar.png' }) })
        const data = await res.json()
        if (data.url) { setMyAvatar(data.url); localStorage.setItem('kayou-avatar', data.url) }
      } catch {}
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Load saved avatar
  useEffect(() => {
    const saved = localStorage.getItem('kayou-avatar')
    if (saved) setMyAvatar(saved)
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setPendingImage({ base64, preview: base64 })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const takeScreenshot = async () => {
    try {
      const res = await fetch('/api/screenshot', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        const msg: Msg = { id: Date.now().toString(), channelId: activeChannel, senderId: 'aimar', content: `📸 Screenshot\n![screenshot](${data.url})`, ts: new Date().toISOString() }
        setAllMessages(prev => ({ ...prev, [activeChannel]: [...(prev[activeChannel] || []), msg] }))
      }
    } catch (err) { console.error('Screenshot failed:', err) }
  }

  const formatTs = (iso: string) => {
    const d = new Date(iso); const diffH = (Date.now() - d.getTime()) / 3600000
    if (diffH < 1) return `${Math.max(1, Math.round(diffH * 60))}m ago`
    if (diffH < 24) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <>
    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0 }} />
    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ position: 'fixed', top: -9999, left: -9999, opacity: 0 }} />
    <div className="flex h-screen overflow-hidden" style={{ background: '#FFFFFF' }}>

      {/* ═══ MOBILE SIDEBAR OVERLAY ═══ */}
      {mobileSidebar && isMobile && (
        <div className="mobile-sidebar-overlay" onClick={() => setMobileSidebar(false)} />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <div className={`${isMobile ? (mobileSidebar ? 'mobile-sidebar' : 'hidden') : 'w-[272px]'} flex flex-col flex-shrink-0 sidebar-panel`} style={{ borderRight: isMobile ? 'none' : 'none' }}>
        {/* Decorative bubbles */}
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
        <div className="bubble bubble-4"></div>
        <div className="bubble bubble-5"></div>

        <div className="relative z-10 flex flex-col flex-1">
          {/* Logo + title */}
          <div className="h-[76px] flex items-center px-4 gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="w-[58px] h-[58px] flex-shrink-0 transition-transform hover:scale-105">
              <img src="/kayou-logo.png" alt="Kayou" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-[17px] font-extrabold text-white flex-1 tracking-tight">Kayou Chat</h1>
            <button onClick={() => { setShowSettings(true); loadAgents(); loadWebhook(); loadRules(); loadProjects(); loadMcps(); loadServices(); loadGithub() }} className="nav-btn w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.8)' }} title="Settings">
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>settings</span>
            </button>
          </div>

          {/* Nav tabs */}
          <div className="flex items-center gap-1 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {([
              { icon: 'home', view: 'home' as const, label: 'Home' },
              { icon: 'chat_bubble', view: 'dms' as const, label: 'DMs' },
              { icon: 'notifications', view: 'notifs' as const, label: 'Activity' },
              { icon: 'bookmark', view: 'saved' as const, label: 'Saved' },
              { icon: 'dashboard', view: 'projects' as const, label: 'Projects' },
            ]).map(item => (
              <button key={item.icon}
                onClick={() => {
                  if (item.view === 'notifs') setRailView(railView === 'notifs' ? 'home' : 'notifs')
                  else if (item.view === 'saved') setRailView(railView === 'saved' ? 'home' : 'saved')
                  else if (item.view === 'projects') { setShowProjects(!showProjects); setRailView('home') }
                  else setRailView(item.view)
                }}
                className={`nav-btn w-9 h-9 rounded-lg flex items-center justify-center relative ${railView === item.view ? 'active' : ''}`}
                style={{ color: railView === item.view ? '#FFFFFF' : 'rgba(255,255,255,0.45)' }}
                title={item.label}>
                <span className="material-symbols-rounded" style={{ fontSize: 19 }}>{item.icon}</span>
                {item.view === 'notifs' && unreadNotifs > 0 && <span className="notif-badge">{unreadNotifs}</span>}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto py-3">
            {/* ── Notifications view ── */}
            {railView === 'notifs' && (
              <div className="px-3">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/70">Activity</span>
                  <button onClick={markAllRead} className="text-[11px] font-medium text-white hover:text-white">Mark all read</button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-[12px] text-center py-8 text-white/70">No activity yet</p>
                ) : notifications.map(n => (
                  <button key={n.id} onClick={() => clickNotif(n)}
                    className="w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-all hover:bg-white/10"
                    style={{ background: n.read ? 'transparent' : 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background: PEOPLE[n.from]?.gradient }}>{PEOPLE[n.from]?.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate text-white">{PEOPLE[n.from]?.name}</p>
                        <p className="text-[11px] truncate text-white/80">{n.preview}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0 bg-white"></span>}
                    </div>
                    <p className="text-[10px] mt-1 pl-8 text-white/70">{formatTs(n.ts)}</p>
                  </button>
                ))}
              </div>
            )}

            {/* ── Saved view ── */}
            {railView === 'saved' && (
              <div className="px-3">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/70 mb-3 px-1">Saved Messages</p>
                {bookmarkedMsgs.length === 0 ? (
                  <p className="text-[12px] text-center py-8 text-white/70">No saved messages</p>
                ) : bookmarkedMsgs.map(m => (
                  <button key={m.id} onClick={() => { switchChannel(m.channelId); setRailView('home') }}
                    className="w-full text-left px-3 py-2.5 rounded-xl mb-1 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[8px] font-bold" style={{ background: PEOPLE[m.senderId]?.gradient }}>{PEOPLE[m.senderId]?.avatar}</div>
                      <span className="text-[12px] font-semibold text-white">{PEOPLE[m.senderId]?.name}</span>
                    </div>
                    <p className="text-[11px] mt-1 line-clamp-2 text-white/80">{m.content.replace(/\*\*/g, '').replace(/\*/g, '')}</p>
                  </button>
                ))}
              </div>
            )}

            {/* ── Channels + DMs ── */}
            {(railView === 'home' || railView === 'dms') && (<>
              {railView === 'home' && (<>
                <div className="px-5 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/70">Channels</span>
                </div>
                {CHANNELS.map(ch => (
                  <button key={ch.id} onClick={() => switchChannel(ch.id)}
                    className={`ch-item w-[calc(100%-16px)] mx-2 flex items-center gap-2.5 px-3 py-[7px] text-left ${activeChannel === ch.id ? 'active' : ''}`}>
                    <span className="material-symbols-rounded" style={{ fontSize: 17, color: activeChannel === ch.id ? '#FFFFFF' : 'rgba(255,255,255,0.8)' }}>{ch.icon}</span>
                    <span className="text-[13.5px] truncate" style={{ color: activeChannel === ch.id ? '#FFFFFF' : 'rgba(255,255,255,0.9)', fontWeight: activeChannel === ch.id ? 600 : 400 }}>{ch.name}</span>
                  </button>
                ))}
              </>)}

              <div className="px-5 mt-5 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/70">Direct Messages</span>
              </div>
              {DM_CHANNELS.map(dm => {
                const p = PEOPLE[dm.personId]
                return (
                  <button key={dm.id} onClick={() => switchChannel(dm.id)}
                    className={`ch-item w-[calc(100%-16px)] mx-2 flex items-center gap-2.5 px-3 py-[7px] text-left ${activeChannel === dm.id ? 'active' : ''}`}>
                    <div className="relative flex-shrink-0">
                      <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center text-white text-[9px] font-bold" style={{ background: 'rgba(255,255,255,0.3)' }}>{p.avatar}</div>
                      <span className="absolute -bottom-px -right-px w-[8px] h-[8px] rounded-full" style={{ background: '#4CAF50', border: '1.5px solid #3563C9' }}></span>
                    </div>
                    <span className="text-[13.5px] truncate" style={{ color: activeChannel === dm.id ? '#FFFFFF' : 'rgba(255,255,255,0.9)', fontWeight: activeChannel === dm.id ? 600 : 400 }}>{p.name}</span>
                    {p.isBot && <span className="text-[8px] font-bold px-1.5 py-[2px] rounded-md uppercase tracking-wide" style={{ background: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }}>ai</span>}
                  </button>
                )
              })}

            </>)}
          </div>

          {/* Chill mode toggle */}
          <div className="px-4 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setChillMode(!chillMode)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
              style={{ background: chillMode ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
              <span className="text-[16px]">{chillMode ? '🌴' : '💼'}</span>
              <span className="text-[12px] font-medium text-white/90">{chillMode ? 'Chill Mode' : 'Work Mode'}</span>
              <div className="ml-auto w-9 h-5 rounded-full transition-colors" style={{ background: chillMode ? '#4CAF50' : 'rgba(255,255,255,0.2)' }}>
                <div className="w-4 h-4 bg-white rounded-full mt-0.5 transition-transform" style={{ transform: chillMode ? 'translateX(18px)' : 'translateX(2px)' }}></div>
              </div>
            </button>
          </div>

          {/* Bottom user */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="relative cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              {myAvatar ? (
                <img src={myAvatar} className="w-9 h-9 rounded-xl object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs" style={{ background: 'rgba(255,255,255,0.3)' }}>A</div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: '#4CAF50', borderColor: '#3563C9' }}></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white">Aimar</p>
              <p className="text-[10px] truncate text-white/80 flex items-center gap-1"><span className="material-symbols-rounded" style={{ fontSize: 12 }}>{myStatus.emoji}</span> {myStatus.text}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CHAT ═══ */}
      <div className="flex-1 flex flex-col min-w-0 glass-chat relative" style={isMobile ? { paddingBottom: '120px' } : {}}>
        {/* Mobile Header */}
        {isMobile && (
          <div className="mobile-header h-[56px] flex items-center px-4 gap-3" style={{ borderBottom: '1px solid #E8EDF2' }}>
            <button onClick={() => setMobileSidebar(true)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F7F9FC' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#3563C9' }}>menu</span>
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isDM && dmPerson ? (<>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-bold" style={{ background: dmPerson.gradient }}>{dmPerson.avatar}</div>
                <span className="font-extrabold text-[16px] truncate" style={{ color: '#1A1A1A' }}>{dmPerson.name}</span>
              </>) : channel ? (<>
                <span className="material-symbols-rounded" style={{ fontSize: 26, color: '#3563C9' }}>{channel.icon}</span>
                <span className="font-bold text-[15px] truncate" style={{ color: '#1A2332' }}>{channel.name}</span>
              </>) : null}
            </div>
            <button onClick={() => { setShowSettings(true); loadAgents(); loadWebhook(); loadRules(); loadProjects(); loadMcps(); loadServices(); loadGithub() }}
              className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F7F9FC' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#94A3B8' }}>settings</span>
            </button>
          </div>
        )}

        {/* Desktop Header */}
        <div className="desktop-only h-[52px] flex items-center px-5 flex-shrink-0 glass-header relative z-10" style={{ borderBottom: '1px solid #E8EDF2' }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isDM && dmPerson ? (<>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-bold" style={{ background: dmPerson.gradient }}>{dmPerson.avatar}</div>
              <span className="font-bold text-[14px]" style={{ color: '#1A2332' }}>{dmPerson.name}</span>
              {dmPerson.isBot && <span className="text-[9px] font-bold px-1.5 py-[2px] rounded-md uppercase" style={{ background: '#EBF5FF', color: '#2B7DD6' }}>ai</span>}
              <span className="text-[11px] flex items-center gap-1" style={{ color: '#94A3B8' }}><span className="material-symbols-rounded" style={{ fontSize: 13 }}>{dmPerson.statusEmoji}</span> {dmPerson.statusText}</span>
            </>) : channel ? (<>
              <span className="material-symbols-rounded" style={{ fontSize: 26, color: '#3563C9' }}>{channel.icon}</span>
              <span className="font-extrabold text-[16px] uppercase tracking-wide" style={{ color: '#1A1A1A' }}>{channel.name}</span>
              <span className="text-[11px] ml-1 hidden sm:inline" style={{ color: '#94A3B8' }}>{channel.description}</span>
            </>) : null}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setShowMembers(!showMembers); setShowPins(false); setShowProfile(null); setShowSearch(false); setThreadMsg(null) }}
              className={`toolbar-btn-light w-8 h-8 rounded-lg flex items-center justify-center ${showMembers ? 'bg-sky-50' : ''}`} style={{ color: showMembers ? '#4A9EE8' : '#94A3B8' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 17 }}>group</span>
            </button>
            <button onClick={() => { setShowPins(!showPins); setShowMembers(false); setShowProfile(null); setShowSearch(false); setThreadMsg(null) }}
              className={`toolbar-btn-light w-8 h-8 rounded-lg flex items-center justify-center ${showPins ? 'bg-sky-50' : ''}`} style={{ color: showPins ? '#4A9EE8' : '#94A3B8' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 17 }}>push_pin</span>
            </button>
            <button onClick={() => { setShowSearch(!showSearch); setShowMembers(false); setShowPins(false); setShowProfile(null); setThreadMsg(null) }}
              className={`toolbar-btn-light w-8 h-8 rounded-lg flex items-center justify-center ${showSearch ? 'bg-sky-50' : ''}`} style={{ color: showSearch ? '#4A9EE8' : '#94A3B8' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 17 }}>search</span>
            </button>
          </div>
        </div>

        {/* Pinned messages banner */}
        {showPins && pinnedMsgs.length > 0 && (
          <div className="px-4 py-2 flex-shrink-0" style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#D97706' }}>push_pin</span>
              <span className="text-[12px] font-bold" style={{ color: '#D97706' }}>Pinned Messages</span>
              <button onClick={() => setShowPins(false)} className="ml-auto text-[11px] font-medium" style={{ color: '#94A3B8' }}>Hide</button>
            </div>
            {pinnedMsgs.map(m => (
              <div key={m.id} className="flex items-start gap-2 py-1.5" style={{ borderTop: '1px solid #FEF3C7' }}>
                <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0 mt-0.5" style={{ background: PEOPLE[m.senderId]?.gradient }}>{PEOPLE[m.senderId]?.avatar}</div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold" style={{ color: '#92400E' }}>{PEOPLE[m.senderId]?.name}: </span>
                  <span className="text-[11px]" style={{ color: '#78350F' }}>{m.content.replace(/\*\*/g, '').replace(/\*/g, '').slice(0, 120)}</span>
                </div>
                <button onClick={() => togglePin(m.id)} className="flex-shrink-0">
                  <span className="material-symbols-rounded" style={{ fontSize: 14, color: '#D97706' }}>close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Messages — Chat Bubble Style */}
        <div className="flex-1 overflow-y-auto chat-scroll">
          <div className="max-w-[760px] mx-auto px-4 py-5">
            {msgs.map((msg, idx) => {
              const sender = PEOPLE[msg.senderId]
              if (!sender) return null
              const isOwn = msg.senderId === 'aimar'
              const prev = msgs[idx - 1]
              const grouped = prev && prev.senderId === msg.senderId && (new Date(msg.ts).getTime() - new Date(prev.ts).getTime()) < 300000

              return (
                <div key={msg.id} className={`msg-enter group relative ${grouped ? 'bubble-grouped' : 'mt-4 first:mt-0'}`}>
                  <div className={`bubble-row ${isOwn ? 'bubble-row-self' : ''}`}>
                    {/* Avatar */}
                    {isOwn && myAvatar ? (
                      <img src={myAvatar} className="bubble-avatar cursor-pointer object-cover" style={{ background: sender.gradient }}
                        onClick={() => avatarInputRef.current?.click()} />
                    ) : (
                      <div className="bubble-avatar cursor-pointer" style={{ background: sender.gradient }}
                        onClick={() => { if (isOwn) avatarInputRef.current?.click(); else { setShowProfile(showProfile === sender.id ? null : sender.id); setShowPins(false); setShowMembers(false); setShowSearch(false); setThreadMsg(null) } }}>
                        {sender.avatar}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`chat-bubble ${isOwn ? 'chat-bubble-self' : 'chat-bubble-other'}`}>
                      {!grouped && !isOwn && (
                        <div className="bubble-name" style={{ color: '#8E8E93' }}>
                          {sender.name} {sender.isBot && <span className="text-[8px] font-bold px-1 py-[0.5px] rounded uppercase ml-1" style={{ background: '#E5E5EA', color: '#8E8E93' }}>ai</span>}
                        </div>
                      )}

                      {/* Reply preview */}
                      {msg.replyToName && (
                        <div className="mb-1.5 px-2.5 py-1.5 rounded-lg text-[11px]" style={{ background: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.04)', borderLeft: `2px solid ${isOwn ? 'rgba(255,255,255,0.4)' : '#007AFF'}` }}>
                          <span className="font-semibold">{msg.replyToName}</span>
                          <p className="opacity-70 truncate">{msg.replyToText}</p>
                        </div>
                      )}

                      {editingMsg === msg.id ? (
                        <div className="flex items-center gap-2">
                          <input value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveEdit(msg.id); if (e.key === 'Escape') { setEditingMsg(null); setEditText('') } }}
                            className="flex-1 text-[13px] px-3 py-1.5 rounded-lg border border-blue-300 bg-white" style={{ color: '#1E293B' }} autoFocus />
                          <button onClick={() => saveEdit(msg.id)} className="text-[11px] font-semibold" style={{ color: isOwn ? '#FFFFFF' : '#3563C9' }}>Save</button>
                        </div>
                      ) : (
                        <p className="formatted" dangerouslySetInnerHTML={{ __html: formatText(msg.content) }} />
                      )}
                      {msg.edited && <span className="text-[9px] opacity-50 ml-1">(edited)</span>}
                      <div className="bubble-time">{formatTs(msg.ts)}
                        {msg.pinned && <span className="material-symbols-rounded ml-1 align-middle" style={{ fontSize: 10 }}>push_pin</span>}
                      </div>

                      {/* Thread replies link */}
                      {msg.threadReplies && msg.threadReplies.length > 0 && (
                        <button onClick={() => setThreadMsg(msg)} className="flex items-center gap-1 mt-1 text-[11px] font-semibold hover:underline" style={{ color: isOwn ? 'rgba(255,255,255,0.8)' : '#3563C9' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 12 }}>chat_bubble</span>
                          {msg.threadReplies.length} {msg.threadReplies.length === 1 ? 'reply' : 'replies'}
                        </button>
                      )}

                      {/* Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="bubble-reactions">
                          {msg.reactions.map((r, ri) => (
                            <button key={ri} onClick={() => addReaction(msg.id, r.emoji)}
                              className="reaction-btn flex items-center gap-1 px-2 py-[2px] rounded-full text-[10px]"
                              style={{ background: isOwn ? 'rgba(255,255,255,0.25)' : '#F2F2F7', border: 'none', color: isOwn ? '#FFFFFF' : '#3C3C43', fontSize: 11 }}>
                              <span>{r.emoji}</span><span className="font-semibold">{r.users.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover toolbar */}
                  <div className={`absolute ${isOwn ? 'left-2' : 'right-2'} top-0 -translate-y-1/2 rounded-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity`}
                    style={{ background: '#FFFFFF', border: '1px solid #E8EDF2', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    {['👍','❤️','🚀'].map(e => (
                      <button key={e} onClick={() => addReaction(msg.id, e)} className="w-7 h-7 flex items-center justify-center text-xs hover:bg-gray-50 first:rounded-l-full last:rounded-r-full transition-colors">{e}</button>
                    ))}
                    <button onClick={() => { setReplyTo(msg); inputRef.current?.focus() }} className="w-7 h-7 flex items-center justify-center hover:bg-gray-50 transition-colors" title="Reply">
                      <span className="material-symbols-rounded" style={{ fontSize: 13, color: '#94A3B8' }}>reply</span>
                    </button>
                    {isOwn && (
                      <button onClick={() => deleteMsg(msg.id)} className="w-7 h-7 flex items-center justify-center hover:bg-red-50 rounded-r-full transition-colors">
                        <span className="material-symbols-rounded" style={{ fontSize: 13, color: '#EF4444' }}>delete</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Typing indicator */}
            {typing && PEOPLE[typing] && (
              <div className="bubble-row mt-4 msg-enter">
                <div className="bubble-avatar" style={{ background: PEOPLE[typing].gradient }}>{PEOPLE[typing].avatar}</div>
                <div>
                  <div className="bubble-name" style={{ color: '#94A3B8', marginBottom: 4 }}>{PEOPLE[typing].name}</div>
                  <div className="typing-bubble">
                    <div className="typing-dot w-[7px] h-[7px] rounded-full" style={{ background: '#8E8E93' }}></div>
                    <div className="typing-dot w-[7px] h-[7px] rounded-full" style={{ background: '#8E8E93' }}></div>
                    <div className="typing-dot w-[7px] h-[7px] rounded-full" style={{ background: '#8E8E93' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* ── Input Area (Desktop) ── */}
        {!isMobile && (
        <div className="px-5 pb-5 pt-2 relative z-10">
          {/* Reply preview bar */}
          {replyTo && (
            <div className="flex items-center gap-2 px-4 py-2 mb-1 rounded-t-xl" style={{ background: '#F2F2F7', borderLeft: '3px solid #007AFF' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#007AFF' }}>reply</span>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold" style={{ color: '#007AFF' }}>{PEOPLE[replyTo.senderId]?.name}</span>
                <p className="text-[12px] truncate" style={{ color: '#8E8E93' }}>{replyTo.content.replace(/\*\*/g, '').slice(0, 80)}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#E5E5EA' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 14, color: '#8E8E93' }}>close</span>
              </button>
            </div>
          )}

          {/* Mention dropdown */}
          {showMention && (
            <div className="absolute bottom-full left-5 mb-2 w-[240px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden pop-in z-50">
              {Object.values(PEOPLE).map(p => (
                <button key={p.id} onClick={() => insertMention(p.name)} className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold" style={{ background: p.gradient }}>{p.avatar}</div>
                  <span className="text-[13px] font-medium" style={{ color: '#1E293B' }}>{p.name}</span>
                  <span className="text-[11px] ml-auto" style={{ color: '#94A3B8' }}>{p.role}</span>
                </button>
              ))}
            </div>
          )}

          {/* Emoji picker */}
          {showEmoji && (
            <div ref={emojiRef} className="absolute bottom-full left-5 mb-2 w-[340px] bg-white border border-gray-200 rounded-xl shadow-lg p-3 pop-in z-50">
              <div className="emoji-grid">
                {ALL_EMOJIS.map(e => (
                  <button key={e} onClick={() => insertEmoji(e)}>{e}</button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-0.5 px-3 py-1.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
              {([
                { icon: 'format_bold', fn: () => insertFormat('**', '**') },
                { icon: 'format_italic', fn: () => insertFormat('*', '*') },
                { icon: 'format_strikethrough', fn: () => insertFormat('~', '~') },
                { icon: 'link', fn: () => insertFormat('[', '](url)') },
                { icon: 'code', fn: () => insertFormat('`', '`') },
              ]).map(item => (
                <button key={item.icon} onClick={item.fn} className="toolbar-btn-light w-7 h-7 rounded-md flex items-center justify-center" style={{ color: '#CBD5E1' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 15 }}>{item.icon}</span>
                </button>
              ))}
            </div>
            <div className="px-4 py-2.5">
              <textarea ref={inputRef} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={isDM ? `Message ${dmPerson?.name || ''}` : activeChannel === 'general' ? 'Talk to the team — all agents are here...' : activeChannel === 'ideas' ? 'Pitch an idea — all agents will respond...' : `Message #${channel?.name || ''}`}
                className="w-full text-[14px] resize-none rich-input-light leading-[1.5] py-0.5"
                style={{ color: '#1E293B', minHeight: '22px', maxHeight: '140px', background: 'transparent' }}
                rows={1} />
            </div>
            <div className="flex items-center justify-between px-3 py-1.5" style={{ borderTop: '1px solid #F1F5F9' }}>
              <div className="flex items-center gap-0.5">
                <button onClick={() => setShowEmoji(!showEmoji)} className={`toolbar-btn-light w-8 h-8 rounded-md flex items-center justify-center ${showEmoji ? 'bg-sky-50' : ''}`} style={{ color: showEmoji ? '#4A9EE8' : '#CBD5E1' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>emoji_emotions</span>
                </button>
                <button onClick={() => setShowMention(!showMention)} className={`toolbar-btn-light w-8 h-8 rounded-md flex items-center justify-center ${showMention ? 'bg-sky-50' : ''}`} style={{ color: showMention ? '#4A9EE8' : '#CBD5E1' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>alternate_email</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="toolbar-btn-light w-8 h-8 rounded-md flex items-center justify-center" style={{ color: '#CBD5E1' }} title="Upload image">
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>image</span>
                </button>
                <button onClick={takeScreenshot} className="toolbar-btn-light w-8 h-8 rounded-md flex items-center justify-center" style={{ color: '#CBD5E1' }} title="Take screenshot">
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>screenshot_monitor</span>
                </button>
              </div>
              {/* Image preview */}
              {pendingImage && (
                <div className="relative inline-block">
                  <img src={pendingImage.preview} alt="upload" style={{ maxHeight: 60, borderRadius: 8 }} />
                  <button onClick={() => setPendingImage(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">×</button>
                </div>
              )}
              <button onClick={send} disabled={!input.trim() && !pendingImage}
                className="send-btn-light w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-20"
                style={{ background: input.trim() ? '#007AFF' : '#E2E8F0' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>send</span>
              </button>
            </div>
          </div>
        </div>
        )}

        {/* ── Mobile Input ── */}
        {isMobile && (
          <div className="mobile-input-area">
            {pendingImage && (
              <div className="relative inline-block mb-2 ml-2">
                <img src={pendingImage.preview} alt="upload" style={{ maxHeight: 50, borderRadius: 8 }} />
                <button onClick={() => setPendingImage(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">×</button>
              </div>
            )}
            <div className="mobile-input-row">
              <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ color: '#94A3B8' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>image</span>
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={isDM ? `Message ${dmPerson?.name || ''}` : `#${channel?.name || ''}`}
                rows={1}
              />
              <button onClick={send} disabled={!input.trim() && !pendingImage}
                className="mobile-send-btn" style={{ background: (input.trim() || pendingImage) ? '#007AFF' : '#E2E8F0' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>send</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      {isMobile && (
        <div className="bottom-nav">
          {([
            { icon: 'forum', id: 'general', label: 'General' },
            { icon: 'lightbulb', id: 'ideas', label: 'Ideas' },
            { icon: 'construction', id: 'build', label: 'Build' },
            { icon: 'chat_bubble', id: 'dm-kayou-code', label: 'Kayou' },
            { icon: 'person', id: '_profile', label: 'Profile' },
          ]).map(item => (
            <button key={item.id}
              onClick={() => {
                if (item.id === '_profile') { setStatusModal(true) }
                else { switchChannel(item.id) }
              }}
              className={activeChannel === item.id ? 'active' : ''}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: activeChannel === item.id ? '#3563C9' : '#94A3B8' }}>{item.icon}</span>
              <span className="bottom-nav-label" style={{ color: activeChannel === item.id ? '#3563C9' : '#94A3B8' }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ═══ RIGHT PANELS (Desktop Only) ═══ */}

      {/* ── Thread panel ── */}
      {threadMsg && PEOPLE[threadMsg.senderId] && (
        <div className={`${isMobile ? 'fixed inset-0 z-50 w-full' : 'w-[360px] flex-shrink-0'} flex flex-col bg-white slide-in thread-panel`}>
          <div className="h-[52px] flex items-center justify-between px-4" style={{ borderBottom: '1px solid #E8EDF2' }}>
            <span className="font-bold text-[14px]" style={{ color: '#1A2332' }}>Thread</span>
            <button onClick={() => setThreadMsg(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#94A3B8' }}>close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 chat-scroll">
            {/* Original message */}
            <div className="flex items-start gap-3 pb-4 mb-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-bold" style={{ background: PEOPLE[threadMsg.senderId].gradient }}>{PEOPLE[threadMsg.senderId].avatar}</div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-[13px]" style={{ color: '#1A2332' }}>{PEOPLE[threadMsg.senderId].name}</span>
                  <span className="text-[10px]" style={{ color: '#94A3B8' }}>{formatTs(threadMsg.ts)}</span>
                </div>
                <p className="formatted text-[14px] leading-[1.5] mt-0.5" style={{ color: '#1E293B' }} dangerouslySetInnerHTML={{ __html: formatText(threadMsg.content) }} />
              </div>
            </div>
            {/* Replies */}
            {(threadMsg.threadReplies || []).map(r => {
              const rSender = PEOPLE[r.senderId]
              if (!rSender) return null
              return (
                <div key={r.id} className="flex items-start gap-3 mb-3 msg-enter">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ background: rSender.gradient }}>{rSender.avatar}</div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-[12px]" style={{ color: '#1A2332' }}>{rSender.name}</span>
                      <span className="text-[10px]" style={{ color: '#94A3B8' }}>{formatTs(r.ts)}</span>
                    </div>
                    <p className="formatted text-[13.5px] leading-[1.5] mt-0.5" style={{ color: '#1E293B' }} dangerouslySetInnerHTML={{ __html: formatText(r.content) }} />
                  </div>
                </div>
              )
            })}
            <div ref={threadEndRef} />
          </div>
          <div className="p-3" style={{ borderTop: '1px solid #E8EDF2' }}>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <textarea value={threadInput} onChange={e => setThreadInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendThreadReply() } }}
                placeholder="Reply..." className="flex-1 text-[13px] resize-none bg-transparent rich-input-light" style={{ color: '#1E293B', minHeight: '20px', maxHeight: '80px' }} rows={1} />
              <button onClick={sendThreadReply} disabled={!threadInput.trim()}
                className="send-btn-light w-8 h-8 rounded-lg flex items-center justify-center text-white disabled:opacity-20"
                style={{ background: threadInput.trim() ? '#007AFF' : '#E2E8F0' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pins panel removed — now inline at top of chat */}

      {/* ── Members panel ── */}
      {showMembers && (
        <div className={`${isMobile ? 'fixed inset-0 z-50 w-full' : 'w-[280px] flex-shrink-0'} flex flex-col bg-white slide-in`} style={{ borderLeft: isMobile ? 'none' : '1px solid #E8EDF2' }}>
          <div className="h-[52px] flex items-center justify-between px-4" style={{ borderBottom: '1px solid #E8EDF2' }}>
            <span className="font-bold text-[14px]" style={{ color: '#1A2332' }}>Members · 3</span>
            <button onClick={() => setShowMembers(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#94A3B8' }}>close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {Object.values(PEOPLE).map(p => (
              <button key={p.id} onClick={() => { setShowProfile(p.id); setShowMembers(false) }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[13px] font-bold" style={{ background: p.gradient }}>{p.avatar}</div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: '#4CAF50' }}></span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-semibold flex items-center gap-1.5" style={{ color: '#1A2332' }}>
                    {p.name} {p.isBot && <span className="text-[8px] font-bold px-1 py-[1px] rounded bg-indigo-50 text-indigo-400 uppercase">ai</span>}
                  </p>
                  <p className="text-[11px] flex items-center gap-1" style={{ color: '#94A3B8' }}><span className="material-symbols-rounded" style={{ fontSize: 13 }}>{p.statusEmoji}</span> {p.statusText}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Search panel ── */}
      {showSearch && (
        <div className={`${isMobile ? 'fixed inset-0 z-50 w-full' : 'w-[340px] flex-shrink-0'} flex flex-col bg-white slide-in`} style={{ borderLeft: isMobile ? 'none' : '1px solid #E8EDF2' }}>
          <div className="h-[52px] flex items-center gap-2 px-4" style={{ borderBottom: '1px solid #E8EDF2' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#94A3B8' }}>search</span>
            <input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search messages..."
              className="flex-1 text-[14px] bg-transparent" style={{ color: '#1E293B' }} />
            <button onClick={() => { setShowSearch(false); setSearchQuery('') }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#94A3B8' }}>close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {searchQuery && searchResults.length === 0 && (
              <p className="text-center text-[13px] py-8" style={{ color: '#94A3B8' }}>No results for "{searchQuery}"</p>
            )}
            {searchResults.map(m => {
              const chName = CHANNELS.find(c => c.id === m.channelId)?.name || m.channelId.replace('dm-', 'DM: ')
              return (
                <button key={m.id} onClick={() => { switchChannel(m.channelId); setShowSearch(false); setSearchQuery('') }}
                  className="w-full text-left p-3 rounded-lg mb-1 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[8px] font-bold" style={{ background: PEOPLE[m.senderId]?.gradient }}>{PEOPLE[m.senderId]?.avatar}</div>
                    <span className="text-[12px] font-semibold" style={{ color: '#1A2332' }}>{PEOPLE[m.senderId]?.name}</span>
                    <span className="text-[10px]" style={{ color: '#94A3B8' }}>in #{chName}</span>
                  </div>
                  <p className="text-[12px] leading-[1.5]" style={{ color: '#475569' }}
                    dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*/g, '').replace(/\*/g, '').replace(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>') }} />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Profile panel — Webflow style ── */}
      {showProfile && PEOPLE[showProfile] && (() => {
        const p = PEOPLE[showProfile]
        return (
        <div className={`${isMobile ? 'fixed inset-0 z-50 w-full' : 'w-[320px] flex-shrink-0'} flex flex-col slide-in`} style={{ background: '#F7F8FA', borderLeft: isMobile ? 'none' : '1px solid #E8EDF2' }}>
          {/* Header with gradient banner */}
          <div className="relative">
            <div className="h-[100px]" style={{ background: p.gradient }}></div>
            <button onClick={() => setShowProfile(null)} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <span className="material-symbols-rounded text-white" style={{ fontSize: 16 }}>close</span>
            </button>
            {/* Avatar floating on banner edge */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
              <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-[#F7F8FA] transition-transform hover:scale-105" style={{ background: p.gradient, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                {p.avatar}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Name + role */}
            <div className="text-center pt-14 pb-4 px-5">
              <h3 className="text-[18px] font-bold flex items-center justify-center gap-2" style={{ color: '#1A2332' }}>
                {p.name}
                {p.isBot && <span className="text-[9px] font-bold px-2 py-[3px] rounded-full uppercase tracking-wide" style={{ background: '#EBF4FC', color: '#3563C9' }}>ai</span>}
              </h3>
              <p className="text-[13px] mt-1" style={{ color: '#64748B' }}>{p.role}</p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full" style={{ background: '#4CAF50' }}></span>
                <span className="text-[12px] font-medium" style={{ color: '#4CAF50' }}>Online</span>
              </div>
            </div>

            {/* Quick actions */}
            {showProfile !== 'aimar' && (
              <div className="flex gap-2 px-5 mb-5">
                <button onClick={() => { switchChannel(`dm-${showProfile}`); setShowProfile(null) }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: p.gradient, boxShadow: '0 4px 14px rgba(53,99,201,0.25)' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>chat</span>
                  Message
                </button>
                <button className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:scale-105" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#64748B' }}>call</span>
                </button>
              </div>
            )}

            {/* Info cards */}
            <div className="px-5 space-y-3 pb-6">
              {/* Status card */}
              <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #F0F0F2' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F0F4FF' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#3563C9' }}>{p.statusEmoji}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Status</p>
                    <p className="text-[13px] font-medium" style={{ color: '#1A2332' }}>{p.statusText}</p>
                  </div>
                </div>
              </div>

              {/* Details card */}
              <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #F0F0F2' }}>
                {([
                  { icon: 'badge', label: 'Role', value: p.role },
                  { icon: 'schedule', label: 'Local Time', value: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }) },
                  { icon: 'memory', label: 'Provider', value: p.isBot ? (p.id === 'claude' ? 'Anthropic (Haiku)' : p.id === 'kayou-code' ? 'Ollama (gemma3)' : p.id === 'kayou-kilo' ? 'Ollama (gemma3)' : 'Unknown') : 'Human' },
                ]).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? '1px solid #F5F5F7' : 'none' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#F7F8FA' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#94A3B8' }}>{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#B0BEC5' }}>{item.label}</p>
                      <p className="text-[13px] font-medium truncate" style={{ color: '#1A2332' }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Permissions card (for bots) */}
              {p.isBot && (
                <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #F0F0F2' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>Permissions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['projects', 'mcps', 'finances', 'github', 'webhooks'].map(perm => {
                      const agent = agents.find((a: any) => a.id === p.id)
                      const has = (agent?.permissions || []).includes(perm)
                      return (
                        <span key={perm} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                          style={{ background: has ? '#DCFCE7' : '#F1F5F9', color: has ? '#16A34A' : '#94A3B8' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 11 }}>{has ? 'check' : 'close'}</span>
                          {perm}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Cost indicator for Claude */}
              {p.id === 'claude' && (
                <div className="rounded-2xl p-4" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#D97706' }}>payments</span>
                    <p className="text-[12px] font-bold" style={{ color: '#D97706' }}>Cost per message</p>
                  </div>
                  <p className="text-[11px]" style={{ color: '#92400E' }}>~$0.001 (Haiku). Use @Claude in chat to call him only when needed.</p>
                </div>
              )}

              {/* Free badge for Kayou agents */}
              {(p.id === 'kayou-code' || p.id === 'kayou-kilo') && (
                <div className="rounded-2xl p-4" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#16A34A' }}>savings</span>
                    <p className="text-[12px] font-bold" style={{ color: '#16A34A' }}>Free — runs locally</p>
                  </div>
                  <p className="text-[11px]" style={{ color: '#166534' }}>Ollama on your Mac. No API costs, no limits, fully private.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        )
      })()}

      {/* ═══ STATUS MODAL ═══ */}
      {statusModal && (
        <div className="overlay flex items-center justify-center" onClick={() => setStatusModal(false)}>
          <div className={`${isMobile ? 'w-[90vw]' : 'w-[360px]'} bg-white rounded-2xl shadow-2xl overflow-hidden pop-in`} onClick={e => e.stopPropagation()}>
            <div className="p-5 pb-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
              <h3 className="text-[15px] font-bold" style={{ color: '#1A2332' }}>Set your status</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  {myAvatar ? (
                    <img src={myAvatar} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: PEOPLE.aimar.gradient }}>A</div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 12, color: '#3563C9' }}>photo_camera</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-[14px]" style={{ color: '#1A2332' }}>Aimar</p>
                  <p className="text-[12px]" style={{ color: '#94A3B8' }}>CEO & Founder</p>
                </div>
              </div>
              <div className="flex gap-2">
                {['verified','rocket_launch','code','coffee','target','local_fire_department','flight','celebration'].map(e => (
                  <button key={e} onClick={() => setMyStatus(s => ({ ...s, emoji: e }))}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${myStatus.emoji === e ? 'bg-sky-50 ring-2 ring-sky-400 scale-110' : 'hover:bg-gray-50'}`}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20, color: myStatus.emoji === e ? '#3563C9' : '#64748B' }}>{e}</span>
                  </button>
                ))}
              </div>
              <input value={myStatus.text} onChange={e => setMyStatus(s => ({ ...s, text: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px]" style={{ color: '#1E293B' }} placeholder="What's your status?" />
              <button onClick={() => { PEOPLE.aimar.statusEmoji = myStatus.emoji; PEOPLE.aimar.statusText = myStatus.text; setStatusModal(false) }}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white" style={{ background: '#007AFF', boxShadow: '0 4px 14px rgba(74,158,232,0.25)' }}>
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PROJECTS BOARD (right panel) ═══ */}
      {showProjects && (
        <div className={`${isMobile ? 'fixed inset-0 z-50 w-full' : 'w-[380px] flex-shrink-0'} flex flex-col bg-white slide-in`} style={{ borderLeft: isMobile ? 'none' : '1px solid #E8EDF2' }}>
          <div className="h-[52px] flex items-center justify-between px-4" style={{ borderBottom: '1px solid #E8EDF2' }}>
            <span className="font-bold text-[14px]" style={{ color: '#1A2332' }}>Project Board</span>
            <div className="flex gap-1">
              <button onClick={() => { setShowSettings(true); setSettingsTab('projects'); loadProjects() }} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100" title="Manage">
                <span className="material-symbols-rounded" style={{ fontSize: 15, color: '#94A3B8' }}>add</span>
              </button>
              <button onClick={() => setShowProjects(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#94A3B8' }}>close</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-rounded block mb-2" style={{ fontSize: 32, color: '#CBD5E1' }}>dashboard</span>
                <p className="text-[13px]" style={{ color: '#94A3B8' }}>No projects yet</p>
                <button onClick={() => { setShowSettings(true); setSettingsTab('projects') }} className="mt-3 text-[12px] font-semibold" style={{ color: '#4A9EE8' }}>Add Project</button>
              </div>
            ) : projects.map((p: any) => (
              <div key={p.id} className="border rounded-xl p-4" style={{ borderColor: '#E8EDF2' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: p.color || '#3563C9' }}>{(p.name || '?').charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[13px] truncate" style={{ color: '#1A2332' }}>{p.name}</p>
                    <p className="text-[11px] truncate" style={{ color: '#94A3B8' }}>{p.stage || 'idea'} · {p.repo || 'No repo'}</p>
                  </div>
                  <span className="text-[13px] font-bold" style={{ color: (p.progress || 0) >= 80 ? '#16A34A' : '#4A9EE8' }}>{p.progress || 0}%</span>
                </div>
                {p.description && <p className="text-[12px] mb-3" style={{ color: '#64748B' }}>{p.description}</p>}
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${p.progress || 0}%`, background: (p.progress || 0) >= 80 ? '#16A34A' : (p.progress || 0) >= 50 ? '#4A9EE8' : '#F59E0B' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SETTINGS — FULL PAGE ═══ */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#F5F5F7' }}>
            {/* Top bar — Apple style */}
            <div className="flex items-center px-5 h-[48px] flex-shrink-0" style={{ background: 'rgba(245,245,247,0.9)', borderBottom: '0.5px solid #D1D1D6' }}>
              <button onClick={() => { setShowSettings(false); setMobileSettingsPage(null) }} className="flex items-center gap-1 transition-opacity hover:opacity-70">
                <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#007AFF' }}>chevron_left</span>
                <span className="text-[15px]" style={{ color: '#007AFF' }}>Chat</span>
              </button>
              <h2 className="flex-1 text-center text-[15px] font-semibold" style={{ color: '#1A2332' }}>Settings</h2>
              <div className="w-[60px]"></div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Settings sidebar — Apple style with colored icons */}
              <div className={`${isMobile ? 'hidden' : 'w-[220px]'} flex-shrink-0 py-3 px-3 overflow-y-auto`} style={{ background: '#F5F5F7' }}>
                {([
                  { group: 'General', items: [
                    { id: 'agents' as const, icon: 'smart_toy', label: 'AI Agents', color: '#3563C9' },
                    { id: 'rules' as const, icon: 'gavel', label: 'Rules', color: '#F59E0B' },
                    { id: 'add' as const, icon: 'add_circle', label: 'Add Agent', color: '#10B981' },
                  ]},
                  { group: 'Workspace', items: [
                    { id: 'projects' as const, icon: 'dashboard', label: 'Projects', color: '#8B5CF6' },
                    { id: 'mcps' as const, icon: 'hub', label: 'MCPs', color: '#EC4899' },
                    { id: 'services' as const, icon: 'dns', label: 'Services', color: '#06B6D4' },
                    { id: 'finances' as const, icon: 'account_balance', label: 'Finances', color: '#10B981' },
                  ]},
                  { group: 'Integrations', items: [
                    { id: 'github' as const, icon: 'code', label: 'GitHub', color: '#1A2332' },
                    { id: 'webhook' as const, icon: 'webhook', label: 'Webhooks', color: '#EF4444' },
                  ]},
                ]).map(section => (
                  <div key={section.group} className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider px-3 mb-1.5" style={{ color: '#86868B' }}>{section.group}</p>
                    <div className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: '0 0.5px 1px rgba(0,0,0,0.04)' }}>
                      {section.items.map((item, i) => (
                        <button key={item.id} onClick={() => setSettingsTab(item.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all"
                          style={{ background: settingsTab === item.id ? '#E8EAED' : 'transparent', borderTop: i > 0 ? '0.5px solid #E5E5EA' : 'none' }}>
                          <div className="w-[26px] h-[26px] rounded-md flex items-center justify-center flex-shrink-0" style={{ background: item.color }}>
                            <span className="material-symbols-rounded text-white" style={{ fontSize: 15 }}>{item.icon}</span>
                          </div>
                          <span className="text-[13px] font-medium" style={{ color: settingsTab === item.id ? '#1A2332' : '#3C3C43' }}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile settings menu — iOS style list */}
              {isMobile && !mobileSettingsPage && (
                <div className="flex-1 overflow-y-auto" style={{ background: '#F5F5F7' }}>
                  <div className="p-4 space-y-6">
                    {([
                      { label: 'General', items: [
                        { id: 'agents', icon: 'smart_toy', title: 'AI Agents', subtitle: `${agents.length} configured`, color: '#3563C9' },
                        { id: 'rules', icon: 'gavel', title: 'Chat Rules', subtitle: `${rules.length} rules active`, color: '#F59E0B' },
                        { id: 'add', icon: 'add_circle', title: 'Add Agent', subtitle: 'Connect new AI provider', color: '#10B981' },
                      ]},
                      { label: 'Workspace', items: [
                        { id: 'projects', icon: 'dashboard', title: 'Projects', subtitle: `${projects.length} projects`, color: '#8B5CF6' },
                        { id: 'mcps', icon: 'hub', title: 'MCP Servers', subtitle: `${mcps.length} connected`, color: '#EC4899' },
                        { id: 'services', icon: 'dns', title: 'Services', subtitle: `${services.length} services`, color: '#06B6D4' },
                        { id: 'finances', icon: 'account_balance', title: 'Finances', subtitle: 'Akili Money integration', color: '#10B981' },
                      ]},
                      { label: 'Integrations', items: [
                        { id: 'github', icon: 'code', title: 'GitHub', subtitle: githubConfig.hasToken ? `Connected as ${githubConfig.username}` : 'Not connected', color: '#1A2332' },
                        { id: 'webhook', icon: 'webhook', title: 'Webhooks', subtitle: 'External agent endpoints', color: '#EF4444' },
                      ]},
                    ]).map(group => (
                      <div key={group.label}>
                        <p className="text-[11px] font-bold uppercase tracking-wider px-4 mb-2" style={{ color: '#86868B' }}>{group.label}</p>
                        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                          {group.items.map((item, i) => (
                            <button key={item.id} onClick={() => { setSettingsTab(item.id as any); setMobileSettingsPage(item.id) }}
                              className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-gray-50"
                              style={{ borderTop: i > 0 ? '1px solid #F0F0F2' : 'none' }}>
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color }}>
                                <span className="material-symbols-rounded text-white" style={{ fontSize: 18 }}>{item.icon}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-medium" style={{ color: '#1A2332' }}>{item.title}</p>
                                <p className="text-[12px]" style={{ color: '#86868B' }}>{item.subtitle}</p>
                              </div>
                              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#C7C7CC' }}>chevron_right</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings content — Desktop: always show / Mobile: only when page selected */}
              {(!isMobile || mobileSettingsPage) && (
              <div className="flex-1 overflow-y-auto" style={{ background: '#F5F5F7' }}>
                {/* Mobile back to settings menu */}
                {isMobile && mobileSettingsPage && (
                  <button onClick={() => setMobileSettingsPage(null)} className="flex items-center gap-1.5 px-4 py-3 text-[14px] font-semibold" style={{ color: '#3563C9' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 18 }}>chevron_left</span>
                    Settings
                  </button>
                )}

                <div className="p-6 max-w-[800px]">
                  {/* Content in Apple grouped style */}
                  <div>

              {/* ── Agents Tab ── */}
              {settingsTab === 'agents' && (
                <div className="space-y-4">
                  {agents.length === 0 ? (
                    <p className="text-center text-[13px] py-8" style={{ color: '#94A3B8' }}>No agents configured. Click "Add Agent" to get started.</p>
                  ) : agents.map(agent => (
                    <div key={agent.id} className="bg-white rounded-2xl p-5 transition-all" style={{ boxShadow: '0 0.5px 1px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)' }}>
                      {editingAgent === agent.id ? (
                        /* Edit mode */
                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Name</label>
                              <input value={agentForm.name || ''} onChange={e => setAgentForm((f: any) => ({ ...f, name: e.target.value }))}
                                className="w-full mt-1 px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} />
                            </div>
                            <div className="w-[140px]">
                              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Provider</label>
                              <select value={agentForm.provider || 'anthropic'} onChange={e => setAgentForm((f: any) => ({ ...f, provider: e.target.value }))}
                                className="w-full mt-1 px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }}>
                                <option value="anthropic">Anthropic</option>
                                <option value="openai">OpenAI</option>
                                <option value="ollama">Ollama (local)</option>
                                <option value="custom">Custom URL</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>
                              {agentForm.provider === 'custom' ? 'Endpoint URL' : 'Model'}
                            </label>
                            <input value={agentForm.model || ''} onChange={e => setAgentForm((f: any) => ({ ...f, model: e.target.value }))}
                              className="w-full mt-1 px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
                              placeholder={agentForm.provider === 'anthropic' ? 'claude-sonnet-4-20250514' : agentForm.provider === 'openai' ? 'gpt-4o' : agentForm.provider === 'ollama' ? 'llama3' : 'https://your-api.com/chat'} />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>API Key</label>
                            <input value={agentForm.apiKey || ''} onChange={e => setAgentForm((f: any) => ({ ...f, apiKey: e.target.value }))}
                              className="w-full mt-1 px-3 py-2 rounded-lg border text-[13px] font-mono" style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
                              placeholder={agent.hasKey ? 'Leave blank to keep current key' : 'sk-...'} type="password" />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>System Prompt</label>
                            <textarea value={agentForm.systemPrompt || ''} onChange={e => setAgentForm((f: any) => ({ ...f, systemPrompt: e.target.value }))}
                              className="w-full mt-1 px-3 py-2 rounded-lg border text-[13px] resize-none" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} rows={3}
                              placeholder="You are an AI assistant at Kayou..." />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={async () => {
                              await fetch(`/api/config/agents/${agent.id}`, {
                                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(agentForm),
                              })
                              setEditingAgent(null); loadAgents()
                            }} className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#4A9EE8' }}>Save</button>
                            <button onClick={() => setEditingAgent(null)} className="px-4 py-2 rounded-lg text-[12px] font-medium" style={{ color: '#64748B' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        /* View mode */
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs" style={{ background: agent.color }}>{agent.name.split(' ').map((w:string) => w[0]).join('').slice(0,2)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[14px]" style={{ color: '#1A2332' }}>{agent.name}</span>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: agent.enabled ? '#DCFCE7' : '#FEE2E2', color: agent.enabled ? '#16A34A' : '#DC2626' }}>
                                  {agent.enabled ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-[12px]" style={{ color: '#94A3B8' }}>{agent.provider} · {agent.model?.split('/').pop()}</p>
                            </div>
                          <div className="flex items-center gap-1">
                            <button onClick={async () => {
                              await fetch(`/api/config/agents/${agent.id}`, {
                                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ enabled: !agent.enabled }),
                              })
                              loadAgents()
                            }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100" title={agent.enabled ? 'Disable' : 'Enable'}>
                              <span className="material-symbols-rounded" style={{ fontSize: 18, color: agent.enabled ? '#16A34A' : '#94A3B8' }}>
                                {agent.enabled ? 'toggle_on' : 'toggle_off'}
                              </span>
                            </button>
                            <button onClick={() => { setEditingAgent(agent.id); setAgentForm({ name: agent.name, provider: agent.provider, model: agent.model, apiKey: '', systemPrompt: agent.systemPrompt || '' }) }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100">
                              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#94A3B8' }}>edit</span>
                            </button>
                            <button onClick={async () => {
                              if (confirm(`Delete agent "${agent.name}"?`)) {
                                await fetch(`/api/config/agents/${agent.id}`, { method: 'DELETE' })
                                loadAgents()
                              }
                            }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50">
                              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#EF4444' }}>delete</span>
                            </button>
                          </div>
                          </div>
                          {/* Tasks */}
                          <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F0F0F2' }}>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#F0F4FF' }}>
                                <span className="material-symbols-rounded" style={{ fontSize: 14, color: '#3563C9' }}>task_alt</span>
                              </div>
                              <span className="text-[12px] font-semibold" style={{ color: '#1A2332' }}>Tasks</span>
                            </div>
                            {(agent.tasks || []).length === 0 ? (
                              <p className="text-[12px]" style={{ color: '#B0BEC5' }}>No tasks yet</p>
                            ) : (agent.tasks || []).map((task: string, ti: number) => (
                              <div key={ti} className="flex items-center gap-2.5 py-2 px-3 rounded-lg mb-1" style={{ background: '#F8FAFC' }}>
                                <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#3563C9' }}>check_circle</span>
                                <span className="text-[13px] flex-1" style={{ color: '#1A2332' }}>{task}</span>
                                <button onClick={async () => {
                                  const tasks = (agent.tasks || []).filter((_: string, j: number) => j !== ti)
                                  await fetch(`/api/config/agents/${agent.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tasks }) })
                                  loadAgents()
                                }} className="text-[11px] font-medium px-2 py-0.5 rounded-md hover:bg-red-50" style={{ color: '#EF4444' }}>Done</button>
                              </div>
                            ))}
                            <div className="flex gap-2 mt-3">
                              <input id={`task-${agent.id}`} className="flex-1 px-3 py-2 rounded-xl border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B', background: '#FFFFFF' }} placeholder="Add a task..." />
                              <button onClick={async () => {
                                const inp = document.getElementById(`task-${agent.id}`) as HTMLInputElement
                                if (!inp.value.trim()) return
                                const tasks = [...(agent.tasks || []), inp.value.trim()]
                                await fetch(`/api/config/agents/${agent.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tasks }) })
                                inp.value = ''; loadAgents()
                              }} className="px-4 py-2 rounded-xl text-[12px] font-semibold text-white" style={{ background: '#3563C9' }}>Add</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── Webhook Tab ── */}
              {settingsTab === 'webhook' && webhookInfo && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-[14px] font-semibold mb-1" style={{ color: '#1A2332' }}>Webhook Endpoint</h3>
                    <p className="text-[12px] mb-3" style={{ color: '#94A3B8' }}>External agents can POST messages into Kayou Chat via this webhook.</p>
                    <div className="bg-gray-50 rounded-xl p-4 font-mono text-[12px] space-y-2" style={{ color: '#1E293B' }}>
                      <div><span style={{ color: '#94A3B8' }}>URL:</span> <span className="select-all">POST {typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/message</span></div>
                      <div><span style={{ color: '#94A3B8' }}>Secret:</span> <span className="select-all">{webhookInfo.secret}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold mb-2" style={{ color: '#1A2332' }}>Example Request</h3>
                    <pre className="bg-gray-50 rounded-xl p-4 text-[11.5px] overflow-x-auto" style={{ color: '#1E293B' }}>{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'}/api/webhook/message \\
  -H "Content-Type: application/json" \\
  -d '{
    "secret": "${webhookInfo.secret}",
    "agentId": "my-bot",
    "channelId": "general",
    "content": "Hello from external agent!"
  }'`}</pre>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold mb-2" style={{ color: '#1A2332' }}>Required Fields</h3>
                    <div className="space-y-1.5 text-[13px]" style={{ color: '#475569' }}>
                      <p><code className="text-[12px] bg-gray-100 px-1.5 py-0.5 rounded font-mono" style={{ color: '#2B7DD6' }}>secret</code> — Your webhook secret (shown above)</p>
                      <p><code className="text-[12px] bg-gray-100 px-1.5 py-0.5 rounded font-mono" style={{ color: '#2B7DD6' }}>agentId</code> — ID of the agent sending the message</p>
                      <p><code className="text-[12px] bg-gray-100 px-1.5 py-0.5 rounded font-mono" style={{ color: '#2B7DD6' }}>channelId</code> — Target channel (general, engineering, etc.)</p>
                      <p><code className="text-[12px] bg-gray-100 px-1.5 py-0.5 rounded font-mono" style={{ color: '#2B7DD6' }}>content</code> — Message text</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Add Agent Tab ── */}
              {settingsTab === 'add' && (
                <div className="space-y-4">
                  <p className="text-[13px]" style={{ color: '#64748B' }}>Add a new AI agent to Kayou Chat. You can connect Anthropic (Claude), OpenAI, local Ollama models, or any custom API.</p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Agent Name</label>
                      <input value={newAgent.name} onChange={e => setNewAgent(a => ({ ...a, name: e.target.value }))}
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} placeholder="e.g. Nova" />
                    </div>
                    <div className="w-[160px]">
                      <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Provider</label>
                      <select value={newAgent.provider} onChange={e => setNewAgent(a => ({ ...a, provider: e.target.value }))}
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }}>
                        <option value="anthropic">Anthropic</option>
                        <option value="openai">OpenAI</option>
                        <option value="ollama">Ollama</option>
                        <option value="custom">Custom URL</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>
                        {newAgent.provider === 'custom' ? 'Endpoint URL' : 'Model'}
                      </label>
                      <input value={newAgent.model} onChange={e => setNewAgent(a => ({ ...a, model: e.target.value }))}
                        className="w-full mt-1 px-3 py-2.5 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
                        placeholder={newAgent.provider === 'anthropic' ? 'claude-sonnet-4-20250514' : newAgent.provider === 'openai' ? 'gpt-4o' : newAgent.provider === 'ollama' ? 'llama3' : 'https://api.example.com/chat'} />
                    </div>
                    <div className="w-[100px]">
                      <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Color</label>
                      <input type="color" value={newAgent.color} onChange={e => setNewAgent(a => ({ ...a, color: e.target.value }))}
                        className="w-full mt-1 h-[42px] rounded-lg border cursor-pointer" style={{ borderColor: '#E2E8F0' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>API Key</label>
                    <input value={newAgent.apiKey} onChange={e => setNewAgent(a => ({ ...a, apiKey: e.target.value }))}
                      className="w-full mt-1 px-3 py-2.5 rounded-lg border text-[13px] font-mono" style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
                      placeholder="sk-..." type="password" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>System Prompt</label>
                    <textarea value={newAgent.systemPrompt} onChange={e => setNewAgent(a => ({ ...a, systemPrompt: e.target.value }))}
                      className="w-full mt-1 px-3 py-2.5 rounded-lg border text-[13px] resize-none" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} rows={3}
                      placeholder="You are Nova, a creative AI assistant at Kayou. Be helpful and concise." />
                  </div>
                  <button onClick={async () => {
                    if (!newAgent.name.trim()) return
                    await fetch('/api/config/agents', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newAgent),
                    })
                    setNewAgent({ name: '', provider: 'anthropic', model: 'claude-sonnet-4-20250514', apiKey: '', systemPrompt: '', color: '#6366F1' })
                    setSettingsTab('agents')
                    loadAgents()
                  }} disabled={!newAgent.name.trim()}
                    className="w-full py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 transition-all"
                    style={{ background: '#007AFF' }}>
                    Add Agent
                  </button>
                </div>
              )}

              {/* ── Rules Tab ── */}
              {settingsTab === 'rules' && (
                <div className="space-y-4">
                  <p className="text-[13px]" style={{ color: '#64748B' }}>Company rules injected into every agent's system prompt. They must follow these.</p>
                  <div className="space-y-2">
                    {rules.map((rule, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-lg" style={{ background: '#F8FAFC', border: '1px solid #E8EDF2' }}>
                        <span className="text-[12px] font-bold w-6 text-center" style={{ color: '#94A3B8' }}>{i + 1}</span>
                        <span className="flex-1 text-[13px]" style={{ color: '#1E293B' }}>{rule}</span>
                        <button onClick={async () => { const r = rules.filter((_, j) => j !== i); setRules(r); await fetch('/api/config/rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules: r }) }) }}
                          className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50">
                          <span className="material-symbols-rounded" style={{ fontSize: 14, color: '#EF4444' }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newRule} onChange={e => setNewRule(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newRule.trim()) { const r = [...rules, newRule.trim()]; setRules(r); setNewRule(''); fetch('/api/config/rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules: r }) }) } }}
                      className="flex-1 px-3 py-2.5 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} placeholder="Add a new rule..." />
                    <button onClick={async () => { if (!newRule.trim()) return; const r = [...rules, newRule.trim()]; setRules(r); setNewRule(''); await fetch('/api/config/rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules: r }) }) }}
                      className="px-4 py-2.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#4A9EE8' }}>Add</button>
                  </div>
                </div>
              )}

              {/* ── Projects Tab ── */}
              {settingsTab === 'projects' && (
                <div className="space-y-4">
                  <p className="text-[13px]" style={{ color: '#64748B' }}>Track projects from idea to release. Agents with "projects" permission can see these.</p>
                  {projects.map((p: any) => (
                    <div key={p.id} className="border rounded-xl p-4" style={{ borderColor: '#E8EDF2' }}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: p.color || '#3563C9' }}>{(p.name||'?').charAt(0)}</div>
                        <span className="font-semibold text-[14px] flex-1" style={{ color: '#1A2332' }}>{p.name}</span>
                        <select value={p.stage || 'idea'} onChange={async (e) => { await fetch(`/api/projects/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: e.target.value }) }); loadProjects() }}
                          className="text-[11px] px-2 py-1 rounded-lg border" style={{ borderColor: '#E2E8F0', color: '#1E293B' }}>
                          <option value="idea">Idea</option><option value="research">Research</option><option value="build">Build</option><option value="testing">Testing</option><option value="release">Release</option>
                        </select>
                      </div>
                      <input value={p.progress || 0} type="range" min="0" max="100" onChange={async (e) => { await fetch(`/api/projects/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ progress: Number(e.target.value) }) }); loadProjects() }}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#4A9EE8' }} />
                      <div className="flex justify-between mt-1">
                        <span className="text-[11px]" style={{ color: '#94A3B8' }}>{p.repo || 'No repo'}</span>
                        <span className="text-[11px] font-bold" style={{ color: '#4A9EE8' }}>{p.progress || 0}%</span>
                      </div>
                      <button onClick={async () => { await fetch(`/api/projects/${p.id}`, { method: 'DELETE' }); loadProjects() }}
                        className="mt-2 text-[11px] font-medium" style={{ color: '#EF4444' }}>Delete</button>
                    </div>
                  ))}
                  <div className="border-2 border-dashed rounded-xl p-4 space-y-3" style={{ borderColor: '#E2E8F0' }}>
                    <div className="flex gap-3">
                      <input id="pname" className="flex-1 px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} placeholder="Project name" />
                      <input id="pcolor" type="color" defaultValue="#3563C9" className="w-10 h-10 rounded-lg border cursor-pointer" style={{ borderColor: '#E2E8F0' }} />
                    </div>
                    <input id="pdesc" className="w-full px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} placeholder="Description" />
                    <input id="prepo" className="w-full px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} placeholder="GitHub repo (e.g. amsecurity95/kayou-chat)" />
                    <button onClick={async () => {
                      const name = (document.getElementById('pname') as HTMLInputElement).value; if (!name) return
                      await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: (document.getElementById('pdesc') as HTMLInputElement).value, repo: (document.getElementById('prepo') as HTMLInputElement).value, color: (document.getElementById('pcolor') as HTMLInputElement).value, stage: 'idea', progress: 0 }) })
                      loadProjects(); ;(document.getElementById('pname') as HTMLInputElement).value = ''
                    }} className="w-full py-2.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#4A9EE8' }}>Add Project</button>
                  </div>
                </div>
              )}

              {/* ── MCPs Tab ── */}
              {settingsTab === 'mcps' && (
                <div className="space-y-4">
                  <p className="text-[13px]" style={{ color: '#64748B' }}>MCP servers connected to your workspace. Control visibility per agent.</p>
                  {mcps.map((m: any) => (
                    <div key={m.id} className="border rounded-xl p-4" style={{ borderColor: '#E8EDF2' }}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#4A9EE8' }}>hub</span>
                        <span className="font-semibold text-[14px] flex-1" style={{ color: '#1A2332' }}>{m.name}</span>
                        <button onClick={async () => { await fetch(`/api/config/mcps/${m.id}`, { method: 'DELETE' }); loadMcps() }}
                          className="text-[11px] font-medium" style={{ color: '#EF4444' }}>Remove</button>
                      </div>
                      <p className="text-[12px] mb-2" style={{ color: '#94A3B8' }}>{m.description} · {m.url || 'No URL'}</p>
                      <div className="flex gap-2 flex-wrap">
                        {agents.map((a: any) => {
                          const hidden = (m.hiddenFrom || []).includes(a.id)
                          return (
                            <button key={a.id} onClick={async () => {
                              const hf = hidden ? (m.hiddenFrom || []).filter((x: string) => x !== a.id) : [...(m.hiddenFrom || []), a.id]
                              await fetch(`/api/config/mcps/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hiddenFrom: hf }) }); loadMcps()
                            }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                              style={{ background: hidden ? '#FEE2E2' : '#DCFCE7', color: hidden ? '#DC2626' : '#16A34A' }}>
                              <span className="material-symbols-rounded" style={{ fontSize: 13 }}>{hidden ? 'visibility_off' : 'visibility'}</span>
                              {a.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="border-2 border-dashed rounded-xl p-4 space-y-3" style={{ borderColor: '#E2E8F0' }}>
                    <input id="mcpname" className="w-full px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} placeholder="MCP name (e.g. Roblox Studio)" />
                    <input id="mcpdesc" className="w-full px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} placeholder="Description" />
                    <input id="mcpurl" className="w-full px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} placeholder="MCP server URL (e.g. http://localhost:3000)" />
                    <button onClick={async () => {
                      const name = (document.getElementById('mcpname') as HTMLInputElement).value; if (!name) return
                      await fetch('/api/config/mcps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: (document.getElementById('mcpdesc') as HTMLInputElement).value, url: (document.getElementById('mcpurl') as HTMLInputElement).value, hiddenFrom: [] }) })
                      loadMcps(); ;(document.getElementById('mcpname') as HTMLInputElement).value = ''
                    }} className="w-full py-2.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#4A9EE8' }}>Add MCP</button>
                  </div>
                </div>
              )}

              {/* ── Services Tab ── */}
              {settingsTab === 'services' && (
                <div className="space-y-4">
                  <p className="text-[13px]" style={{ color: '#64748B' }}>External services and webhooks. Give agents access to Hostinger, Vercel, Railway, or any platform.</p>
                  {services.map((s: any) => (
                    <div key={s.id} className="border rounded-xl p-3 flex items-center gap-3" style={{ borderColor: '#E8EDF2' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#4A9EE8' }}>
                        {s.type === 'hosting' ? 'dns' : s.type === 'ci' ? 'precision_manufacturing' : s.type === 'database' ? 'database' : 'link'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-[13px]" style={{ color: '#1A2332' }}>{s.name}</span>
                        <p className="text-[11px]" style={{ color: '#94A3B8' }}>{s.type} · {s.url || 'N/A'}</p>
                      </div>
                      <button onClick={async () => { await fetch(`/api/config/services/${s.id}`, { method: 'DELETE' }); loadServices() }}
                        className="text-[11px] font-medium" style={{ color: '#EF4444' }}>Remove</button>
                    </div>
                  ))}
                  <div className="border-2 border-dashed rounded-xl p-4 space-y-3" style={{ borderColor: '#E2E8F0' }}>
                    <div className="flex gap-3">
                      <input id="svcname" className="flex-1 px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} placeholder="Service name (e.g. Hostinger)" />
                      <select id="svctype" className="w-[130px] px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }}>
                        <option value="hosting">Hosting</option><option value="ci">CI/CD</option><option value="database">Database</option><option value="api">API</option><option value="other">Other</option>
                      </select>
                    </div>
                    <input id="svcurl" className="w-full px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} placeholder="URL or endpoint" />
                    <input id="svckey" className="w-full px-3 py-2 rounded-lg border text-[13px] font-mono" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} placeholder="API key or token (optional)" type="password" />
                    <button onClick={async () => {
                      const name = (document.getElementById('svcname') as HTMLInputElement).value; if (!name) return
                      await fetch('/api/config/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type: (document.getElementById('svctype') as HTMLSelectElement).value, url: (document.getElementById('svcurl') as HTMLInputElement).value, apiKey: (document.getElementById('svckey') as HTMLInputElement).value }) })
                      loadServices(); ;(document.getElementById('svcname') as HTMLInputElement).value = ''
                    }} className="w-full py-2.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#4A9EE8' }}>Add Service</button>
                  </div>
                </div>
              )}

              {/* ── Finances Tab ── */}
              {settingsTab === 'finances' && (
                <div className="space-y-4">
                  <p className="text-[13px]" style={{ color: '#64748B' }}>Connect your Akili Money account so agents can see your financial overview and help optimize revenue.</p>

                  <div className="rounded-xl p-4" style={{ background: '#F9FAFB', border: '1px solid #F0F0F2' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                        <span className="material-symbols-rounded text-white" style={{ fontSize: 20 }}>account_balance</span>
                      </div>
                      <div>
                        <p className="font-semibold text-[14px]" style={{ color: '#1A2332' }}>Akili Money</p>
                        <p className="text-[12px]" style={{ color: '#94A3B8' }}>Financial dashboard integration</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Akili Money API URL</label>
                        <input id="akili-url" className="w-full mt-1 px-3 py-2.5 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
                          placeholder="https://api.akilimoney.com/v1" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>API Key or Token</label>
                        <input id="akili-key" className="w-full mt-1 px-3 py-2.5 rounded-lg border text-[13px] font-mono" style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
                          placeholder="ak_..." type="password" />
                      </div>
                      <button className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                        Connect Akili Money
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: '#F9FAFB', border: '1px solid #F0F0F2' }}>
                    <p className="font-semibold text-[13px] mb-3" style={{ color: '#1A2332' }}>What agents see when connected:</p>
                    <div className="space-y-2 text-[12px]" style={{ color: '#64748B' }}>
                      <div className="flex items-center gap-2"><span className="material-symbols-rounded" style={{ fontSize: 16, color: '#10B981' }}>check_circle</span> Monthly revenue & expenses overview</div>
                      <div className="flex items-center gap-2"><span className="material-symbols-rounded" style={{ fontSize: 16, color: '#10B981' }}>check_circle</span> Project-level earnings breakdown</div>
                      <div className="flex items-center gap-2"><span className="material-symbols-rounded" style={{ fontSize: 16, color: '#10B981' }}>check_circle</span> Subscription & recurring income tracking</div>
                      <div className="flex items-center gap-2"><span className="material-symbols-rounded" style={{ fontSize: 16, color: '#10B981' }}>check_circle</span> Spending alerts & optimization tips</div>
                      <div className="flex items-center gap-2"><span className="material-symbols-rounded" style={{ fontSize: 16, color: '#10B981' }}>check_circle</span> Revenue goals & progress</div>
                    </div>
                  </div>

                  <div className="rounded-xl p-4" style={{ background: '#F9FAFB', border: '1px solid #F0F0F2' }}>
                    <p className="font-semibold text-[13px] mb-2" style={{ color: '#1A2332' }}>Agent access</p>
                    <p className="text-[12px] mb-3" style={{ color: '#94A3B8' }}>Only agents with "finances" permission can see your financial data.</p>
                    <div className="flex gap-2 flex-wrap">
                      {agents.filter((a: any) => (a.permissions || []).includes('finances')).map((a: any) => (
                        <div key={a.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 13 }}>visibility</span>
                          {a.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── GitHub Tab ── */}
              {settingsTab === 'github' && (
                <div className="space-y-4">
                  <p className="text-[13px]" style={{ color: '#64748B' }}>Connect your GitHub account. Agents with "github" permission can see repo info.</p>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>GitHub Username</label>
                    <input value={githubConfig.username || ''} onChange={e => setGithubConfig((g: any) => ({ ...g, username: e.target.value }))}
                      className="w-full mt-1 px-3 py-2.5 rounded-lg border text-[13px]" style={{ borderColor: '#E2E8F0', color: '#1E293B' }} placeholder="amsecurity95" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#94A3B8' }}>Personal Access Token</label>
                    <input id="ghtoken" className="w-full mt-1 px-3 py-2.5 rounded-lg border text-[13px] font-mono" style={{ borderColor: '#E2E8F0', color: '#1E293B' }}
                      placeholder={githubConfig.hasToken ? '••••••••• (token set)' : 'ghp_...'} type="password" />
                  </div>
                  <button onClick={async () => {
                    const token = (document.getElementById('ghtoken') as HTMLInputElement).value
                    await fetch('/api/config/github', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: githubConfig.username, token: token || undefined }) })
                    loadGithub()
                  }} className="px-6 py-2.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: '#4A9EE8' }}>Save GitHub</button>
                  {githubConfig.hasToken && <p className="text-[12px]" style={{ color: '#16A34A' }}>Connected as {githubConfig.username}</p>}
                </div>
              )}
                  </div>
                </div>
              </div>
              )}
            </div>
        </div>
      )}
    </div>
    </>
  )
}
