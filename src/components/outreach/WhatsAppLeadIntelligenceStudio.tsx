import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  Calendar,
  Phone,
  FileCode,
  Copy,
  Check,
  Download,
  Play,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Users,
  RefreshCw,
  Flame,
  Zap,
  Sliders,
  Globe,
  Database,
  Building2,
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useToast } from '@/src/contexts/ToastContext';

// Verticals / Skins
type SkinType = 'SIGMA_TACTIX' | 'REAL_ESTATE_GCC' | 'CLINIC';

interface SkinConfig {
  id: SkinType;
  name: string;
  tagline: string;
  description: string;
  entryPrice: string;
  bookingLink: string;
  factsBlock: string;
  presetLeads: Array<{
    label: string;
    fullName: string;
    phone: string;
    email: string;
    company: string;
    pain: string;
    budget: string;
    timeline: string;
    authority: string;
  }>;
}

const SKINS: Record<SkinType, SkinConfig> = {
  SIGMA_TACTIX: {
    id: 'SIGMA_TACTIX',
    name: 'Sigma Tactix (Internal)',
    tagline: 'Dubai AI Growth Consultancy',
    description: 'a Dubai-based AI native growth consultancy: performance marketing, SEO/GEO, and AI operating systems for businesses.',
    entryPrice: 'Growth Diagnostic, USD 2,500-4,500 (two-week paid audit; fee credits toward first retainer month if signed within 30 days)',
    bookingLink: 'https://cal.com/sigmatactix/diagnostic',
    factsBlock: `Sigma Tactix is a Dubai-based AI native growth consultancy. Services: 1. Growth Diagnostic (USD 2,500-4,500, two-week paid audit, fee credits toward retainer if signed in 30 days). 2. Growth Systems Retainer. 3. Authority & Demand Engine. 4. AI Operating Systems for business workflows. Every engagement starts with a diagnostic. Office located in Dubai, UAE. Response hours: Sun-Thu 9am-6pm GST. Strictly no unverified client case study metrics.`,
    presetLeads: [
      {
        label: 'Hot Lead: B2B Founder with Pain & Budget',
        fullName: 'Tariq Al-Mansoor',
        phone: '+971509823412',
        email: 'tariq@skylinepay.ae',
        company: 'SkylinePay FinTech',
        pain: 'Our CAC on Meta jumped from $80 to $240 in Q3. We need an immediate Growth Diagnostic on our paid funnel and AI automations.',
        budget: '$4,500 audit approved, scaling to $6,000/mo retainer if diagnostic identifies leaks',
        timeline: 'Need to kick off this month, ideally next week',
        authority: 'Founder & Managing Director'
      },
      {
        label: 'Arabic Inbound: E-commerce Director',
        fullName: 'فاطمة الزهراء',
        phone: '+971551239876',
        email: 'fatima@nourbrands.com',
        company: 'Nour Luxury Retail',
        pain: 'نريد تحسين محركات البحث بالذكاء الاصطناعي وزيادة المبيعات في دبي والرياض.',
        budget: 'الميزانية مرنة ومستعدون للبدء بالتشخيص الأولي',
        timeline: 'خلال أسبوعين',
        authority: 'المدير التنفيذي للتسويق'
      },
      {
        label: 'Warm Lead: Marketing Manager exploring',
        fullName: 'Liam Evans',
        phone: '+971584321098',
        email: 'liam@apexgear.io',
        company: 'Apex Logistics',
        pain: 'Looking into AI operating systems for internal reporting and SDR outreach.',
        budget: 'No stated budget yet, need proposal first',
        timeline: 'Next quarter evaluation',
        authority: 'Growth Marketing Manager'
      },
      {
        label: 'Disqualified: Job Seeker / Vendor Pitch',
        fullName: 'Alex Miller',
        phone: '+14155552671',
        email: 'alex@freelance-coder.dev',
        company: 'Self',
        pain: 'Are you hiring prompt engineers or junior React devs? Attached is my resume.',
        budget: '$0 (Seeking employment)',
        timeline: 'Immediate',
        authority: 'Job Seeker'
      }
    ]
  },
  REAL_ESTATE_GCC: {
    id: 'REAL_ESTATE_GCC',
    name: 'Real Estate (GCC Brokerage)',
    tagline: 'Dubai Luxury Real Estate Agency',
    description: 'a Dubai prime real estate brokerage specializing in off-plan and secondary luxury penthouses & beachfront villas.',
    entryPrice: 'Property price bracket AED 2,500,000 to AED 25,000,000+',
    bookingLink: 'https://cal.com/apexrealty/private-viewing',
    factsBlock: `Apex Haven Realty is a licensed RERA real estate agency in Dubai, UAE. Specialization: Off-plan investment advisory and luxury secondary properties in Palm Jumeirah, Downtown Dubai, and Dubai Hills. Golden Visa advisory included for purchases above AED 2M. Viewings scheduled Sun-Sat 10am-7pm.`,
    presetLeads: [
      {
        label: 'Luxury Buyer: Palm Jumeirah Villa',
        fullName: 'Alexander Wright',
        phone: '+447911123456',
        email: 'a.wright@wrightfamilyoffice.co.uk',
        company: 'Wright Family Office',
        pain: 'Looking for a 4-bedroom beachfront villa in Palm Jumeirah or Bluewaters for immediate personal use & Golden Visa.',
        budget: 'AED 15,000,000 - 20,000,000 cash ready',
        timeline: 'Visiting Dubai next week for viewings',
        authority: 'Principal Buyer'
      }
    ]
  },
  CLINIC: {
    id: 'CLINIC',
    name: 'Clinic / Medical Wellness',
    tagline: 'Dubai Specialist Aesthetic Clinic',
    description: 'a Dubai specialist aesthetic and regenerative wellness clinic in Jumeirah.',
    entryPrice: 'Doctor Specialist Consultation AED 850 (credited against procedure)',
    bookingLink: 'https://cal.com/luminus/consultation',
    factsBlock: `Luminus Medical Clinic is a DHA-licensed specialist clinic in Jumeirah 1, Dubai. Services: Aesthetic dermatology, longevity IV therapies, regenerative skin protocols. All procedures performed by board-certified specialists. Strict rule: No medical diagnoses or prescriptions via WhatsApp. Consultation booking only.`,
    presetLeads: [
      {
        label: 'Patient Consultation: Aesthetic Care',
        fullName: 'Nadia Mansour',
        phone: '+971507778899',
        email: 'nadia.m@gmail.com',
        company: 'Individual',
        pain: 'Interested in personalized skin rejuvenation protocol and consultation with dermatologist.',
        budget: 'Standard clinic rates',
        timeline: 'This Thursday or Friday afternoon',
        authority: 'Patient'
      }
    ]
  }
};

interface QualificationResult {
  score: number;
  tier: 'hot' | 'warm' | 'cold';
  need_score: number;
  need_summary: string;
  budget_score: number;
  budget_range: string;
  authority_score: number;
  authority: string;
  timeline_score: number;
  timeline: string;
  disqualify: boolean;
  reply_draft: string;
  internal_note: string;
  isArabic: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  handoffTriggered?: boolean;
  handoffReason?: string;
}

export default function WhatsAppLeadIntelligenceStudio() {
  const { notifySuccess, notifyInfo } = useToast();

  // Active Skin
  const [activeSkinKey, setActiveSkinKey] = useState<SkinType>('SIGMA_TACTIX');
  const activeSkin = SKINS[activeSkinKey];

  // Studio Sub-tab
  const [studioTab, setStudioTab] = useState<'QUALIFIER' | 'WHATSAPP_CHAT' | 'SCHEDULER' | 'CODE_WORKFLOWS'>('QUALIFIER');

  // Qualifier State
  const [leadName, setLeadName] = useState('Tariq Al-Mansoor');
  const [leadPhone, setLeadPhone] = useState('+971509823412');
  const [leadEmail, setLeadEmail] = useState('tariq@skylinepay.ae');
  const [leadCompany, setLeadCompany] = useState('SkylinePay FinTech');
  const [leadPain, setLeadPain] = useState('Our CAC on Meta jumped from $80 to $240 in Q3. We need an immediate Growth Diagnostic on our paid funnel and AI automations.');
  const [leadBudget, setLeadBudget] = useState('$4,500 audit approved, scaling to $6,000/mo retainer if diagnostic identifies leaks');
  const [leadTimeline, setLeadTimeline] = useState('Need to kick off this month, ideally next week');
  const [leadAuthority, setLeadAuthority] = useState('Founder & Managing Director');
  const [isScoring, setIsScoring] = useState(false);
  const [qualificationResult, setQualificationResult] = useState<QualificationResult | null>(null);

  // WhatsApp Conversation State
  const [chatInput, setChatInput] = useState('');
  const [isChatAgentThinking, setIsChatAgentThinking] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'user',
      text: 'Hi, I saw your Growth OS online. How much does a growth diagnostic cost and how quickly can you start?',
      timestamp: '10:42 AM'
    },
    {
      id: 'msg-2',
      sender: 'agent',
      text: 'Hi! Our Growth Diagnostic is a two-week deep dive priced at USD 2,500–4,500, which is fully credited toward your first month if you continue on retainer. We can kick off as soon as next week once we review your ad channels and funnel. Would you like to grab a 20-minute introductory call here: https://cal.com/sigmatactix/diagnostic?',
      timestamp: '10:43 AM'
    }
  ]);
  const [lastHandoffAlert, setLastHandoffAlert] = useState<string | null>(null);

  // Scheduler State
  const [schedulerLeads, setSchedulerLeads] = useState([
    {
      id: 'lead-s01',
      name: 'Tariq Al-Mansoor',
      phone: '+971509823412',
      tier: 'hot',
      score: 88,
      status: 'qualifying',
      followup_step: 0,
      next_followup_at: 'Due Now (Within 30m cron window)',
      last_action: 'Form scored hot, founder alerted'
    },
    {
      id: 'lead-s02',
      name: 'Elena Rostova',
      phone: '+971523334411',
      tier: 'warm',
      score: 62,
      status: 'qualifying',
      followup_step: 1,
      next_followup_at: 'In 2 days',
      last_action: 'Step 1 template delivered via Twilio'
    },
    {
      id: 'lead-s03',
      name: 'Marcus Vance',
      phone: '+971556677889',
      tier: 'warm',
      score: 55,
      status: 'qualifying',
      followup_step: 2,
      next_followup_at: 'In 4 days',
      last_action: 'Step 2 template delivered via Twilio'
    }
  ]);
  const [isExecutingCron, setIsExecutingCron] = useState(false);
  const [cronLogs, setCronLogs] = useState<string[]>([
    'Cron daemon active: */30 * * * * (Checking due leads every 30m)',
    'Last tick: Checked public.leads where next_followup_at <= NOW(). 1 lead queued for Step 1 dispatch.'
  ]);

  // Code Explorer Active File
  const [activeCodeFile, setActiveCodeFile] = useState<'N8N_01' | 'N8N_02' | 'N8N_03' | 'SUPABASE_SQL' | 'PROMPTS' | 'RUNBOOK'>('N8N_03');
  const [copiedCode, setCopiedCode] = useState(false);

  // Quick Preset Lead Selector
  const applyPresetLead = (preset: (typeof activeSkin.presetLeads)[0]) => {
    setLeadName(preset.fullName);
    setLeadPhone(preset.phone);
    setLeadEmail(preset.email);
    setLeadCompany(preset.company);
    setLeadPain(preset.pain);
    setLeadBudget(preset.budget);
    setLeadTimeline(preset.timeline);
    setLeadAuthority(preset.authority);
    notifyInfo('Preset Loaded', `Populated fields for: ${preset.fullName}`);
  };

  // Run Rubric Scoring (Simulating Claude Haiku 4.5 execution)
  const handleScoreLead = () => {
    setIsScoring(true);

    setTimeout(() => {
      // Check language (Arabic check)
      const hasArabic = /[\u0600-\u06FF]/.test(leadPain) || /[\u0600-\u06FF]/.test(leadName);

      // Disqualify check (Job seeker, student, spam)
      const isJobSeeker = /resume|hire|hiring|intern|job|freelance/i.test(leadPain) || /job seeker/i.test(leadAuthority);

      if (isJobSeeker) {
        setQualificationResult({
          score: 5,
          tier: 'cold',
          need_score: 2,
          need_summary: 'Job application / vendor inquiry - no service match',
          budget_score: 0,
          budget_range: '$0 (Seeking employment)',
          authority_score: 1,
          authority: leadAuthority,
          timeline_score: 2,
          timeline: leadTimeline,
          disqualify: true,
          reply_draft: 'Thank you for your interest in Sigma Tactix. We currently do not have open roles matching your profile. Best wishes in your search.',
          internal_note: 'Disqualified: Not an inbound client prospect.',
          isArabic: false
        });
        setIsScoring(false);
        notifyInfo('Lead Scored: Cold', 'Lead flagged as disqualified job application / vendor.');
        return;
      }

      // Calculate Scores
      // NEED (0-30): Explicit match = 25-30, vague = 5-15
      const needScore = leadPain.length > 30 ? 28 : 12;

      // BUDGET (0-25): At/above $2,500-4,500 = 20-25. No signal = 8-12. Below = 0-5
      const hasBudgetSignal = /4,?500|audit|approved|flexible|مرنة|cash|retainer/i.test(leadBudget);
      const budgetScore = hasBudgetSignal ? 23 : 10;

      // AUTHORITY (0-20): Owner/founder/director = 15-20. Manager = 8-14.
      const isExecutive = /founder|ceo|director|managing|owner|تنفيذي|شريك/i.test(leadAuthority);
      const authorityScore = isExecutive ? 19 : 11;

      // TIMELINE (0-25): Now/this month = 20-25. This quarter = 12-18. Exploring = 3-8.
      const isImmediate = /now|this month|next week|أسبوع|urgent|immediate/i.test(leadTimeline);
      const timelineScore = isImmediate ? 23 : 12;

      const totalScore = needScore + budgetScore + authorityScore + timelineScore;
      const tier: 'hot' | 'warm' | 'cold' = totalScore >= 70 ? 'hot' : totalScore >= 40 ? 'warm' : 'cold';

      const replyDraft = hasArabic
        ? `أهلاً ${leadName.split(' ')[0]}، شكراً لتواصلك مع سيجما تاكتيكس. اطلعت على متطلباتك بخصوص النمو والتسويق المدعوم بالذكاء الاصطناعي ويسعدنا جداً التعاون معك. يمكنك حجز جلسة تشخيص استراتيجي مباشرة عبر هذا الرابط: ${activeSkin.bookingLink}.`
        : `Hi ${leadName.split(' ')[0]}, thank you for reaching out to ${activeSkin.name}. I reviewed your note regarding ${leadCompany}'s growth goals, and our Growth Diagnostic is built specifically to solve this. You can secure a 20-minute diagnostic session directly on our calendar here: ${activeSkin.bookingLink}.`;

      const internalNote = tier === 'hot'
        ? `High priority inbound (${leadAuthority}) with explicit pain and verified budget anchor. Instant WhatsApp alert dispatched to founders.`
        : `Warm lead queued for automated two-way WhatsApp nurturing and 3-step follow-up scheduler.`;

      setQualificationResult({
        score: totalScore,
        tier,
        need_score: needScore,
        need_summary: leadPain.slice(0, 75) + '...',
        budget_score: budgetScore,
        budget_range: leadBudget,
        authority_score: authorityScore,
        authority: leadAuthority,
        timeline_score: timelineScore,
        timeline: leadTimeline,
        disqualify: false,
        reply_draft: replyDraft,
        internal_note: internalNote,
        isArabic: hasArabic
      });

      setIsScoring(false);
      notifySuccess(
        `Lead Scored: ${tier.toUpperCase()} (${totalScore}/100)`,
        tier === 'hot' ? 'Hot lead! Founder WhatsApp notification dispatched.' : 'Scored and queued for nurture.'
      );
    }, 600);
  };

  // WhatsApp Conversation Simulation
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    const inputCopy = chatInput.trim();
    setChatInput('');
    setIsChatAgentThinking(true);

    setTimeout(() => {
      // Evaluate Handoff Rules:
      // 1. Legal / NDA / Contract questions
      // 2. Custom pricing beyond diagnostic
      // 3. Frustration / Anger
      // 4. Clearly enterprise scale
      const isLegal = /nda|contract|lawyer|agreement|confidentiality/i.test(inputCopy);
      const isCustomPricing = /custom price|discount|cheaper|expensive|quote|rfp/i.test(inputCopy);
      const isEnterprise = /enterprise|50m|100m|procurement|vendor form/i.test(inputCopy);
      const isArabic = /[\u0600-\u06FF]/.test(inputCopy);

      let replyText = '';
      let triggerHandoff = false;
      let handoffReason = '';

      if (isLegal) {
        triggerHandoff = true;
        handoffReason = 'Legal / Contract Query: Lead requested NDA or legal agreements';
        replyText = isArabic
          ? 'بخصوص الاتفاقيات القانونية وحفظ السرية، سأقوم بتحويل المحادثة إلى أحد الشركاء المؤسسين للتواصل معك مباشرة اليوم.'
          : 'For legal agreements and NDAs, I am having one of our founding partners review this and message you directly today. They will follow up shortly.';
      } else if (isCustomPricing) {
        triggerHandoff = true;
        handoffReason = 'Custom Pricing / Commercial Negotiation';
        replyText = isArabic
          ? `جميع مشاريعنا تبدأ بفحص استراتيجي (Growth Diagnostic) بسعر ${activeSkin.entryPrice}. سأطلب من الشريك المؤسس تأكيد الخيارات المخصصة لك.`
          : `All engagements at ${activeSkin.name} begin with our Growth Diagnostic (${activeSkin.entryPrice}). I'll have a founder review your specific setup and confirm custom terms.`;
      } else if (isEnterprise) {
        triggerHandoff = true;
        handoffReason = 'High-Value Enterprise Lead Flagged';
        replyText = isArabic
          ? 'أهلاً بك، نظراً لحجم متطلبات مؤسستكم، قمت بإخطار الشركاء المؤسسين لتنظيم اجتماع مخصص يناسب منظومتكم.'
          : 'Given your enterprise scale and infrastructure requirements, I have flagged this directly to our founders to coordinate a tailored discovery session.';
      } else if (isArabic) {
        replyText = `أهلاً بك! في سيجما تاكتيكس نقدم فحوصات استراتيجية ونظم نمو مدعومة بالذكاء الاصطناعي تبدأ بتشخيص مدته أسبوعان. يمكنك اختيار التوقيت المناسب لمكالمة استكشافية هنا: ${activeSkin.bookingLink}. هل ترغب بمناقشة تحدي محدد في قناتكم الإعلانية؟`;
      } else {
        replyText = `Thanks for asking! Our engagements always begin with the two-week Growth Diagnostic to analyze leaks in your attribution and acquisition channels. The fee credits directly toward your first retainer if we work together. Would you like to schedule a 20-minute slot via ${activeSkin.bookingLink}?`;
      }

      // Hard rule: enforce max 3 sentences
      const sentences = replyText.split(/(?<=[.?!])\s+/);
      if (sentences.length > 3) {
        replyText = sentences.slice(0, 3).join(' ');
      }

      const agentMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'agent',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        handoffTriggered: triggerHandoff,
        handoffReason
      };

      setChatMessages((prev) => [...prev, agentMsg]);
      setIsChatAgentThinking(false);

      if (triggerHandoff) {
        setLastHandoffAlert(handoffReason);
        notifyInfo('Handoff Rule Triggered', handoffReason);
      }
    }, 700);
  };

  // Run Follow-up Cron Simulation
  const handleRunCronCycle = () => {
    setIsExecutingCron(true);
    setTimeout(() => {
      setSchedulerLeads((prev) =>
        prev.map((lead) => {
          if (lead.status === 'qualifying' && lead.followup_step === 0) {
            return {
              ...lead,
              followup_step: 1,
              next_followup_at: 'In 2 days',
              last_action: 'Step 1 Template sent (Twilio Content SID HX_FOLLOWUP_1)'
            };
          }
          if (lead.status === 'qualifying' && lead.followup_step === 1) {
            return {
              ...lead,
              followup_step: 2,
              next_followup_at: 'In 4 days',
              last_action: 'Step 2 Template sent (Twilio Content SID HX_FOLLOWUP_2)'
            };
          }
          if (lead.status === 'qualifying' && lead.followup_step === 2) {
            return {
              ...lead,
              followup_step: 3,
              status: 'nurture',
              next_followup_at: 'Far Future (Drip Completed)',
              last_action: 'Final Step 3 Template sent; moved to Nurture'
            };
          }
          return lead;
        })
      );

      const timestamp = new Date().toLocaleTimeString();
      setCronLogs((prev) => [
        `[${timestamp}] ⚡ Cron cycle executed. Evaluated 3 leads. Dispatched due WhatsApp templates. Next tick in 30 mins.`,
        ...prev.slice(0, 5)
      ]);

      setIsExecutingCron(false);
      notifySuccess('Cron Scheduler Executed', 'Processed leads table according to n8n 03-followup-scheduler specifications.');
    }, 800);
  };

  // Code Copy
  const copyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    notifySuccess('Copied to Clipboard', 'Code artifact ready to paste.');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Sample Workflow Code Snippets for Tab 4
  const CODE_SNIPPETS: Record<string, { title: string; filename: string; language: string; content: string }> = {
    N8N_03: {
      title: 'Workflow 03: Follow-up Scheduler (n8n JSON)',
      filename: 'backend/agent-skills/sales-lead-intelligence-agent/n8n/03-followup-scheduler.json',
      language: 'json',
      content: `{
  "name": "SigmaTactix — 03 Follow-up Scheduler",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{ "field": "minutes", "minutesInterval": 30 }]
        }
      },
      "name": "Every 30 Minutes",
      "type": "n8n-nodes-base.scheduleTrigger"
    },
    {
      "parameters": {
        "operation": "getAll",
        "tableId": "leads",
        "filters": {
          "conditions": [
            { "keyName": "next_followup_at", "condition": "lte", "keyValue": "={{ new Date().toISOString() }}" },
            { "keyName": "status", "condition": "in", "keyValue": "(qualifying,qualified,nurture)" }
          ]
        }
      },
      "name": "Get Due Leads",
      "type": "n8n-nodes-base.supabase"
    },
    {
      "parameters": {
        "jsCode": "const BOOKING_LINK = 'https://cal.com/sigmatactix/diagnostic';\\nconst BRAND = 'Sigma Tactix';\\nconst SIDS = {\\n  1: 'HX_FOLLOWUP_1',\\n  2: 'HX_FOLLOWUP_2',\\n  3: 'HX_FOLLOWUP_3'\\n};\\n// Advances Step 1 -> Step 2 -> Step 3. Stops on replies or step > 3."
      },
      "name": "Prepare Follow-ups",
      "type": "n8n-nodes-base.code"
    },
    {
      "parameters": {
        "url": "https://api.twilio.com/2010-04-01/Accounts/AC.../Messages.json",
        "bodyParameters": {
          "parameters": [
            { "name": "To", "value": "=whatsapp:{{ $json.phone }}" },
            { "name": "ContentSid", "value": "={{ $json.content_sid }}" },
            { "name": "ContentVariables", "value": "={{ $json.content_variables }}" }
          ]
        }
      },
      "name": "Twilio — Send Template",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}`
    },
    N8N_01: {
      title: 'Workflow 01: Lead Intake & Qualify (n8n JSON)',
      filename: 'backend/agent-skills/sales-lead-intelligence-agent/n8n/01-lead-intake-qualify.json',
      language: 'json',
      content: `{
  "name": "SigmaTactix — 01 Lead Intake & Qualify",
  "nodes": [
    {
      "name": "Webhook — Form Intake",
      "type": "n8n-nodes-base.webhook",
      "parameters": { "path": "lead-intake" }
    },
    {
      "name": "Claude — Qualify Rubric 0-100",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "model": "claude-haiku-4-5-20251001",
        "system": "Score inbound lead 0-100 (NEED 30, BUDGET 25, AUTHORITY 20, TIMELINE 25). Hot=70+, Warm=40-69, Cold=<40."
      }
    },
    {
      "name": "Supabase — Upsert Lead",
      "type": "n8n-nodes-base.supabase",
      "parameters": { "tableId": "leads", "conflictColumns": ["phone"] }
    },
    {
      "name": "Is Hot Lead?",
      "type": "n8n-nodes-base.if",
      "parameters": { "conditions": [{ "leftValue": "={{ $json.tier }}", "rightValue": "hot" }] }
    },
    {
      "name": "Twilio — WhatsApp Founder Alert",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": { "body": "🚨 *HOT LEAD ALERT (Score: {{ $json.score }}/100)*" }
    }
  ]
}`
    },
    N8N_02: {
      title: 'Workflow 02: WhatsApp Conversation Agent (n8n JSON)',
      filename: 'backend/agent-skills/sales-lead-intelligence-agent/n8n/02-whatsapp-conversation.json',
      language: 'json',
      content: `{
  "name": "SigmaTactix — 02 WhatsApp Conversation Agent",
  "nodes": [
    {
      "name": "Webhook — Twilio WhatsApp Inbound",
      "type": "n8n-nodes-base.webhook",
      "parameters": { "path": "whatsapp-inbound" }
    },
    {
      "name": "Claude — WhatsApp Conversation Agent",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "model": "claude-haiku-4-5-20251001",
        "system": "Max 3 sentences. Only FACTS block. Push to call once warm/hot. Handoff=true on legal, custom pricing, enterprise, or 6 turns."
      }
    },
    {
      "name": "Requires Handoff?",
      "type": "n8n-nodes-base.if"
    },
    {
      "name": "Notify Founder on WhatsApp",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "name": "Twilio — Send WhatsApp Reply",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}`
    },
    SUPABASE_SQL: {
      title: 'Supabase Database Schema & Views',
      filename: 'backend/agent-skills/sales-lead-intelligence-agent/supabase/schema.sql',
      language: 'sql',
      content: `-- Tables: leads, lead_messages, appointments, v_lead_pipeline
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    company TEXT,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    tier TEXT CHECK (tier IN ('hot', 'warm', 'cold')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'qualifying', 'qualified', 'nurture', 'disqualified', 'converted')),
    followup_step INTEGER DEFAULT 0,
    next_followup_at TIMESTAMPTZ,
    last_contact_at TIMESTAMPTZ
);

CREATE TABLE public.lead_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    channel TEXT DEFAULT 'whatsapp',
    body TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT FALSE
);

CREATE OR REPLACE VIEW public.v_lead_pipeline AS
SELECT l.id, l.full_name, l.phone, l.score, l.tier, l.status, l.followup_step,
       COUNT(m.id) as total_messages
FROM public.leads l
LEFT JOIN public.lead_messages m ON m.lead_id = l.id
GROUP BY l.id;`
    },
    PROMPTS: {
      title: 'Lead Qualification & WhatsApp Prompt Pack (v0.1)',
      filename: 'backend/agent-skills/sales-lead-intelligence-agent/prompts/qualification-prompt.md',
      language: 'markdown',
      content: `# Rubric (0-100):
- NEED (0-30): Explicit pain + service match = 25-30. Vague interest = 5-15.
- BUDGET (0-25): Figures at/above entry price (USD 2,500-4,500) = 20-25. No signal = 8-12. Below = 0-5.
- AUTHORITY (0-20): Owner/founder/director = 15-20. Manager = 8-14. Other = 0-3.
- TIMELINE (0-25): "Now"/"this month" = 20-25. "This quarter" = 12-18. "Exploring" = 3-8.

Tiers: hot = 70+, warm = 40-69, cold = below 40.

Hard Rules for WhatsApp Agent:
1. Max 3 sentences per reply. Direct, warm, no emojis unless lead uses them.
2. Grounded strictly in FACTS. No hallucinated client case-studies.
3. Auto-handoff on legal, custom pricing, enterprise, or 6 turns.
4. Detect language and match English/Arabic.`
    },
    RUNBOOK: {
      title: 'Setup & Deployment Runbook (60–90 Min)',
      filename: 'backend/agent-skills/sales-lead-intelligence-agent/SETUP-RUNBOOK.md',
      language: 'markdown',
      content: `1. Database Migration:
   Run supabase/schema.sql in Supabase SQL editor.
2. Twilio Setup:
   Register 3 Content Templates: followup_1, followup_2, followup_3.
   Configure WhatsApp Inbound Webhook -> n8n /whatsapp-inbound.
3. n8n Import:
   Import 01-lead-intake-qualify.json, 02-whatsapp-conversation.json, 03-followup-scheduler.json.
   Configure Anthropic API key and Twilio credentials.
4. Internal Pilot:
   Route sigmatactix.com form directly to n8n webhook.`
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-black p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <Sparkles size={12} className="animate-spin text-emerald-400" />
              <span>AI Lead Intelligence Agent v0.1 (Lean MVP)</span>
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">Phase 1 Live</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <MessageSquare className="text-emerald-400" size={26} />
              WhatsApp Lead Intake, Scoring & Follow-up Scheduler
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Zero-latency inbound lead qualification with a 0–100 rubric, two-way conversational WhatsApp agent (Arabic & English), and automated 3-step timed follow-up scheduler running every 30 minutes.
            </p>
          </div>

          {/* Skin Switcher */}
          <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/50 p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe size={11} className="text-emerald-400" />
              Active Vertical Demo Skin
            </span>
            <div className="flex gap-1.5">
              {(['SIGMA_TACTIX', 'REAL_ESTATE_GCC', 'CLINIC'] as SkinType[]).map((skinKey) => (
                <button
                  key={skinKey}
                  onClick={() => {
                    setActiveSkinKey(skinKey);
                    notifyInfo('Vertical Skin Switched', `Active model: ${SKINS[skinKey].name}`);
                  }}
                  className={cn(
                    'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                    activeSkinKey === skinKey
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'border border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {SKINS[skinKey].name.split(' ')[0]}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-slate-500 truncate max-w-[260px]">
              {activeSkin.tagline}
            </div>
          </div>
        </div>

        {/* Studio Sub-Navigation */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <button
            onClick={() => setStudioTab('QUALIFIER')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
              studioTab === 'QUALIFIER'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'border border-white/10 bg-black/40 text-slate-300 hover:bg-white/5 hover:text-white'
            )}
          >
            <TrendingUp size={14} />
            01. Rubric Lead Qualifier (0–100)
          </button>

          <button
            onClick={() => setStudioTab('WHATSAPP_CHAT')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
              studioTab === 'WHATSAPP_CHAT'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'border border-white/10 bg-black/40 text-slate-300 hover:bg-white/5 hover:text-white'
            )}
          >
            <MessageSquare size={14} />
            02. WhatsApp Conversation Agent
            {lastHandoffAlert && (
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setStudioTab('SCHEDULER')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
              studioTab === 'SCHEDULER'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'border border-white/10 bg-black/40 text-slate-300 hover:bg-white/5 hover:text-white'
            )}
          >
            <Clock size={14} />
            03. 30-Min Follow-up Scheduler
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] text-emerald-400">*/30m</span>
          </button>

          <button
            onClick={() => setStudioTab('CODE_WORKFLOWS')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all',
              studioTab === 'CODE_WORKFLOWS'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'border border-white/10 bg-black/40 text-slate-300 hover:bg-white/5 hover:text-white'
            )}
          >
            <FileCode size={14} />
            n8n Workflows & Prompt Pack
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: 0-100 RUBRIC QUALIFIER */}
      {studioTab === 'QUALIFIER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Inbound Lead Inputs */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Sliders size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Inbound Lead Payload (Form / API)</h3>
                    <p className="text-xs text-slate-400">Simulates CF7 / Typeform webhook parsed by Workflow 01</p>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  Target Model: <span className="text-emerald-400 font-mono">claude-haiku-4.5</span>
                </div>
              </div>

              {/* Presets Bar */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Quick Test Scenarios:</label>
                <div className="flex flex-wrap gap-1.5">
                  {activeSkin.presetLeads.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyPresetLead(preset)}
                      className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-white transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs text-slate-400">Lead Full Name</label>
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Phone (WhatsApp E.164)</label>
                  <input
                    type="text"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Company Name</label>
                  <input
                    type="text"
                    value={leadCompany}
                    onChange={(e) => setLeadCompany(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Role / Authority</label>
                  <input
                    type="text"
                    value={leadAuthority}
                    onChange={(e) => setLeadAuthority(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Stated Problem / Need</label>
                <textarea
                  rows={2}
                  value={leadPain}
                  onChange={(e) => setLeadPain(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Stated Budget</label>
                  <input
                    type="text"
                    value={leadBudget}
                    onChange={(e) => setLeadBudget(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Timeline Intent</label>
                  <input
                    type="text"
                    value={leadTimeline}
                    onChange={(e) => setLeadTimeline(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleScoreLead}
                disabled={isScoring}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-xs font-bold text-black shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-50"
              >
                {isScoring ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Scoring Lead Against Rubric...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    Run AI 0–100 Qualification Engine
                  </>
                )}
              </button>
            </div>

            {/* Rubric Definition Card */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2 text-xs">
              <h4 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                <ShieldCheck size={13} className="text-emerald-400" />
                Workflow 01 Scoring Rubric Weighting
              </h4>
              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-[10px] text-slate-400">NEED (0-30)</div>
                  <div className="font-bold text-white text-xs">Pain & Fit</div>
                  <div className="text-[10px] text-slate-500">25-30 explicit</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-[10px] text-slate-400">BUDGET (0-25)</div>
                  <div className="font-bold text-white text-xs">Entry Anchor</div>
                  <div className="text-[10px] text-slate-500">$2.5k-$4.5k+</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-[10px] text-slate-400">AUTHORITY (0-20)</div>
                  <div className="font-bold text-white text-xs">Decision Role</div>
                  <div className="text-[10px] text-slate-500">15-20 founder</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-[10px] text-slate-400">TIMELINE (0-25)</div>
                  <div className="font-bold text-white text-xs">Speed to Close</div>
                  <div className="text-[10px] text-slate-500">20-25 now/month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Qualification Output & Founder Alert */}
          <div className="lg:col-span-6 space-y-4">
            {qualificationResult ? (
              <div className="space-y-4">
                {/* Result Score Card */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg',
                        qualificationResult.tier === 'hot' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        qualificationResult.tier === 'warm' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      )}>
                        {qualificationResult.score}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-sm">Lead Qualification Score</h3>
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                            qualificationResult.tier === 'hot' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                            qualificationResult.tier === 'warm' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                          )}>
                            Tier: {qualificationResult.tier.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">Status in Supabase: <span className="text-white font-mono">{qualificationResult.disqualify ? 'disqualified' : qualificationResult.tier === 'hot' ? 'qualified' : 'qualifying'}</span></p>
                      </div>
                    </div>

                    {qualificationResult.tier === 'hot' && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-xs text-red-400 animate-pulse">
                        <Flame size={13} />
                        <span>Hot Lead Alert</span>
                      </div>
                    )}
                  </div>

                  {/* Dimension Bars */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-black/40 border border-white/5 p-2.5 space-y-1">
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Need Score</span>
                        <span className="font-semibold text-white">{qualificationResult.need_score}/30</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(qualificationResult.need_score / 30) * 100}%` }} />
                      </div>
                    </div>

                    <div className="rounded-xl bg-black/40 border border-white/5 p-2.5 space-y-1">
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Budget Score</span>
                        <span className="font-semibold text-white">{qualificationResult.budget_score}/25</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(qualificationResult.budget_score / 25) * 100}%` }} />
                      </div>
                    </div>

                    <div className="rounded-xl bg-black/40 border border-white/5 p-2.5 space-y-1">
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Authority Score</span>
                        <span className="font-semibold text-white">{qualificationResult.authority_score}/20</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(qualificationResult.authority_score / 20) * 100}%` }} />
                      </div>
                    </div>

                    <div className="rounded-xl bg-black/40 border border-white/5 p-2.5 space-y-1">
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Timeline Score</span>
                        <span className="font-semibold text-white">{qualificationResult.timeline_score}/25</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(qualificationResult.timeline_score / 25) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Internal Founder Note */}
                  <div className="rounded-xl bg-black/50 border border-white/10 p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                      <Lock size={11} className="text-amber-400" />
                      Internal Founder Directive (Supabase `internal_note`):
                    </span>
                    <p className="text-xs text-slate-300 italic">{qualificationResult.internal_note}</p>
                  </div>

                  {/* Generated WhatsApp Reply Draft */}
                  <div className="rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1">
                        <MessageSquare size={11} />
                        Claude Drafted Reply (`reply_draft`):
                      </span>
                      {qualificationResult.isArabic && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] text-emerald-300 font-medium">
                          Arabic Detected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white leading-relaxed font-sans" dir={qualificationResult.isArabic ? 'rtl' : 'ltr'}>
                      "{qualificationResult.reply_draft}"
                    </p>
                  </div>
                </div>

                {/* Simulated Founder WhatsApp Alert (Only if Hot) */}
                {qualificationResult.tier === 'hot' && (
                  <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/30 via-slate-900 to-black p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                        <Flame size={14} />
                        <span>Instant Founder WhatsApp Dispatch (Simulated)</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Twilio API: AC...</span>
                    </div>

                    <div className="rounded-xl bg-black/60 border border-white/10 p-3 font-mono text-[11px] text-slate-300 space-y-1">
                      <div className="text-red-400 font-bold">🚨 HOT LEAD ALERT (Score: {qualificationResult.score}/100)</div>
                      <div>• Name: {leadName} ({leadCompany})</div>
                      <div>• Phone: {leadPhone}</div>
                      <div>• Need: {leadPain.slice(0, 50)}...</div>
                      <div>• Budget: {leadBudget}</div>
                      <div>• Timeline: {leadTimeline}</div>
                      <div className="text-slate-400 mt-1">Action: Direct founder reachout suggested within 15 minutes.</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[350px] rounded-2xl border border-dashed border-white/10 bg-black/30 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                  <TrendingUp size={22} />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">No Lead Scored Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Select a preset test scenario or enter custom lead parameters on the left, then click "Run AI 0–100 Qualification Engine" to test Claude Haiku rubric scoring.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: WHATSAPP CONVERSATION AGENT */}
      {studioTab === 'WHATSAPP_CHAT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Rules & Facts Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Workflow 02 Hard Guardrails</h3>
                  <p className="text-xs text-slate-400">Two-way WhatsApp agent behavioral parameters</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    Max 3 Sentences Per Reply
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Direct, warm, no hype words, no unsolicited emojis unless the prospect uses them.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    Strictly Grounded in FACTS
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Never hallucinates case study metrics, client names, or unauthorized prices.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    Automatic Human Handoff Triggers
                  </div>
                  <ul className="text-slate-400 text-[11px] list-disc list-inside space-y-0.5 pt-1">
                    <li>Custom pricing requested</li>
                    <li>Prospect frustration or dissatisfaction</li>
                    <li>Legal / NDA / Contract inquiries</li>
                    <li>Enterprise scale ($50M+ ARR / high value)</li>
                    <li>Exceeded 6 turns without a booking</li>
                  </ul>
                </div>
              </div>

              {/* Active Facts Block Card */}
              <div className="rounded-xl border border-white/10 bg-black/60 p-3 space-y-1.5 text-xs">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Active FACTS Block ({activeSkin.name}):
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono bg-black/40 p-2 rounded-lg">
                  {activeSkin.factsBlock}
                </p>
              </div>

              {/* Test Suggestion Chips */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Trigger Simulator Quick Inputs:</label>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setChatInput('Can you send a custom 20-page legal NDA before we talk?')}
                    className="text-left rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    ⚠️ Test Legal Handoff: "Can you send a custom legal NDA?"
                  </button>
                  <button
                    onClick={() => setChatInput('Can you give us a 50% discount on the diagnostic audit?')}
                    className="text-left rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    ⚠️ Test Custom Pricing: "Can you give us a 50% discount?"
                  </button>
                  <button
                    onClick={() => setChatInput('مرحباً، هل يمكنكم تقديم استشارة للنمو باللغة العربية في دبي؟')}
                    className="text-left rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                  >
                    🌐 Test Arabic Chat: "مرحباً، هل يمكنكم تقديم استشارة..."
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Phone Mockup: Live WhatsApp Dialogue */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md rounded-3xl border border-white/20 bg-slate-950 shadow-2xl overflow-hidden flex flex-col h-[580px]">
              {/* WhatsApp Phone Header */}
              <div className="bg-[#128C7E] px-4 py-3 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-sm border border-white/20">
                    ST
                  </div>
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      {activeSkin.name}
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    </div>
                    <div className="text-[10px] text-emerald-100 flex items-center gap-1">
                      <span>Online (AI WhatsApp Agent)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-emerald-100">
                  <Phone size={16} />
                  <Lock size={14} />
                </div>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] bg-opacity-95">
                <div className="flex justify-center">
                  <span className="rounded-lg bg-black/60 px-3 py-1 text-[10px] text-slate-400 border border-white/5">
                    Messages are end-to-end encrypted • Sigma Tactix n8n v0.1
                  </span>
                </div>

                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-1',
                      msg.sender === 'user'
                        ? 'ml-auto bg-[#005c4b] text-white rounded-br-xs'
                        : 'mr-auto bg-[#202c33] text-slate-100 rounded-bl-xs'
                    )}
                  >
                    <p>{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'user' && <Check size={11} className="text-sky-400" />}
                    </div>

                    {msg.handoffTriggered && (
                      <div className="mt-2 rounded-lg bg-amber-500/20 border border-amber-500/40 p-2 text-[10px] text-amber-300 space-y-0.5">
                        <div className="font-bold flex items-center gap-1">
                          <AlertTriangle size={11} />
                          <span>Human Founder Handoff Triggered</span>
                        </div>
                        <p className="text-slate-300">{msg.handoffReason}</p>
                      </div>
                    )}
                  </div>
                ))}

                {isChatAgentThinking && (
                  <div className="mr-auto bg-[#202c33] text-slate-400 rounded-2xl rounded-bl-xs p-3 text-xs flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin text-emerald-400" />
                    <span>Claude Haiku drafting 3-sentence grounded reply...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="bg-[#202c33] p-2.5 flex items-center gap-2 border-t border-white/5">
                <input
                  type="text"
                  placeholder="Type WhatsApp message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 rounded-xl bg-[#2a3942] px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isChatAgentThinking}
                  className="h-9 w-9 rounded-xl bg-[#00a884] flex items-center justify-center text-white disabled:opacity-50 hover:bg-[#009173] transition-colors"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: 30-MIN FOLLOW-UP SCHEDULER */}
      {studioTab === 'SCHEDULER' && (
        <div className="space-y-6">
          {/* Top Status & Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-1 backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Cron Frequency</span>
                <Clock size={14} className="text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">*/30 * * * *</div>
              <p className="text-[11px] text-slate-400">Runs every 30 minutes in production n8n cluster</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-1 backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Queue Query Target</span>
                <Database size={14} className="text-sky-400" />
              </div>
              <div className="text-xl font-bold text-white">public.leads</div>
              <p className="text-[11px] text-slate-400">next_followup_at &lt;= now() AND status in (qualifying, qualified, nurture)</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 flex flex-col justify-between backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Simulation Action</span>
                <Zap size={14} className="text-amber-400" />
              </div>
              <button
                onClick={handleRunCronCycle}
                disabled={isExecutingCron}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors disabled:opacity-50"
              >
                {isExecutingCron ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Executing Cron Tick...
                  </>
                ) : (
                  <>
                    <Play size={13} />
                    Trigger 30-Min Cron Tick Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3 Follow-up Steps Pipeline */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar size={15} className="text-emerald-400" />
              3-Step Approved Twilio WhatsApp Content Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    STEP 1 (+1 Day)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">SID: HX_FOLLOWUP_1</span>
                </div>
                <div className="text-xs text-white bg-slate-900/80 p-3 rounded-xl border border-white/5 leading-relaxed">
                  "Hi <span className="text-emerald-400 font-semibold">&#123;&#123;1&#125;&#125;</span>, following up on your enquiry with <span className="text-emerald-400 font-semibold">&#123;&#123;2&#125;&#125;</span>. Happy to answer any questions, or you can grab a call slot here: <span className="text-emerald-400 font-semibold">&#123;&#123;3&#125;&#125;</span>"
                </div>
                <p className="text-[11px] text-slate-400">
                  Sends 24 hours after qualification if no meeting has been booked yet.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    STEP 2 (+3 Days)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">SID: HX_FOLLOWUP_2</span>
                </div>
                <div className="text-xs text-white bg-slate-900/80 p-3 rounded-xl border border-white/5 leading-relaxed">
                  "Hi <span className="text-amber-400 font-semibold">&#123;&#123;1&#125;&#125;</span>, still interested in <span className="text-amber-400 font-semibold">&#123;&#123;2&#125;&#125;</span>? If timing is off, tell me when to check back and I'll leave you alone until then."
                </div>
                <p className="text-[11px] text-slate-400">
                  Polite timing check. Respects prospect autonomy; avoids spammy follow-up pressure.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl border border-white/10 bg-black/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-slate-500/20 border border-slate-500/30 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                    STEP 3 (+7 Days - Final)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">SID: HX_FOLLOWUP_3</span>
                </div>
                <div className="text-xs text-white bg-slate-900/80 p-3 rounded-xl border border-white/5 leading-relaxed">
                  "Hi <span className="text-slate-300 font-semibold">&#123;&#123;1&#125;&#125;</span>, closing your enquiry with <span className="text-slate-300 font-semibold">&#123;&#123;2&#125;&#125;</span> for now. If things change, this link always works: <span className="text-slate-300 font-semibold">&#123;&#123;3&#125;&#125;</span>"
                </div>
                <p className="text-[11px] text-slate-400">
                  Graceful close. Automatically transitions lead to <span className="text-white font-mono">nurture</span> status.
                </p>
              </div>
            </div>
          </div>

          {/* Circuit Breaker Banner */}
          <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 flex items-center gap-3">
            <ShieldCheck size={20} className="text-sky-400 shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-bold text-white">Automated Circuit Breaker: </span>
              Any inbound WhatsApp reply from a lead immediately halts the follow-up sequence! The inbound message reopens the 24-hour conversational window, and Workflow 02 takes over to answer in natural dialogue.
            </div>
          </div>

          {/* Active Leads in Follow-up Queue Table */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Active Follow-up Queue (Supabase `public.leads`)</h3>
              <span className="text-xs text-slate-400">Showing {schedulerLeads.length} leads in qualification lifecycle</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="pb-2 font-medium">Lead Name</th>
                    <th className="pb-2 font-medium">Phone</th>
                    <th className="pb-2 font-medium">Score / Tier</th>
                    <th className="pb-2 font-medium">Current Step</th>
                    <th className="pb-2 font-medium">Next Follow-up</th>
                    <th className="pb-2 font-medium">Last Engine Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {schedulerLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-semibold text-white">{lead.name}</td>
                      <td className="py-3 font-mono text-slate-400">{lead.phone}</td>
                      <td className="py-3">
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                          lead.tier === 'hot' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        )}>
                          {lead.score}/100 ({lead.tier})
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="rounded bg-black/50 border border-white/10 px-2 py-1 font-mono text-[10px] text-white">
                          Step {lead.followup_step} / 3
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{lead.next_followup_at}</td>
                      <td className="py-3 text-[11px] text-slate-300 italic">{lead.last_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Cron Execution Log */}
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5 text-xs text-white">
                <Clock size={12} className="text-emerald-400" />
                n8n Daemon Tick Logs
              </span>
              <span className="text-[10px]">Realtime Supabase Telemetry</span>
            </div>
            <div className="space-y-1 text-slate-400 text-[11px]">
              {cronLogs.map((log, idx) => (
                <div key={idx} className="text-emerald-400/90">{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CODE & WORKFLOW ARTIFACTS EXPLORER */}
      {studioTab === 'CODE_WORKFLOWS' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            {/* File Switcher Tabs */}
            <div className="sigma-segmented">
              {[
                { key: 'N8N_03', label: '03-followup-scheduler.json', icon: Clock },
                { key: 'N8N_01', label: '01-lead-intake-qualify.json', icon: Zap },
                { key: 'N8N_02', label: '02-whatsapp-conversation.json', icon: MessageSquare },
                { key: 'SUPABASE_SQL', label: 'supabase/schema.sql', icon: Database },
                { key: 'PROMPTS', label: 'qualification-prompt.md', icon: Sparkles },
                { key: 'RUNBOOK', label: 'SETUP-RUNBOOK.md', icon: FileCode }
              ].map((tabItem) => {
                const Icon = tabItem.icon;
                return (
                  <button
                    key={tabItem.key}
                    onClick={() => setActiveCodeFile(tabItem.key as any)}
                    className={cn(
                      'sigma-segment flex items-center gap-1.5 font-mono',
                      activeCodeFile === tabItem.key
                        ? 'sigma-segment-active'
                        : ''
                    )}
                  >
                    <Icon size={12} />
                    {tabItem.label}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyCode(CODE_SNIPPETS[activeCodeFile].content)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition-colors"
              >
                {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Code Viewer Box */}
          <div className="rounded-2xl border border-white/10 bg-slate-950 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between bg-black/60 px-4 py-2.5 border-b border-white/10 text-xs text-slate-400">
              <span className="font-mono text-emerald-400">{CODE_SNIPPETS[activeCodeFile].filename}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">{CODE_SNIPPETS[activeCodeFile].language}</span>
            </div>
            <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-[500px]">
              <code>{CODE_SNIPPETS[activeCodeFile].content}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
