// Cloudflare Pages Function — 轻拾玖 AI 内容工厂
// Configure DEEPSEEK_API_KEY as an encrypted Pages Production secret. Never expose it to the browser.
// Configuration changes require a new Pages deployment before they become active.
// V0.2 compiled source cards, 2026-11-08. These are internal reference summaries, not live Google Drive retrieval.
// Brand + business mode: https://docs.google.com/document/d/1qRq06XahIwOOFnkcXrqlASEuiFL79TVtoe5eKaivZE8/edit
// Product cards: https://docs.google.com/document/d/1pte5TPr6G9FGCW0DMziFOfd1JwYaW7nRW4rs5h0tbYk/edit
// Sample catalog QSJ-M01..M25 and candidate formulas F01..F11: https://docs.google.com/document/d/1PzxuxVi6_Tn50SJcN2eL5xm9Xe4D9_vTdN0F3OKlL84/edit
// Song Xinghui oral narrative: https://docs.google.com/document/d/12STiEhruZP5aevt9Df7v2rg_Y2SS6OmpkwLIvwJ2S6Q/edit
// Product/Skill implementation decisions: https://docs.google.com/document/d/1dt7RgLP4gq2OPz4R1-0XcBI09-PVTnuAAVkY79vJRPE/edit
import {retrieveQingshijiuBrain, BRAIN_VERSION} from '../../src/qingshijiu-brain/brain.js';
import {findEvergreenTopic} from '../../src/qingshijiu-brain/evergreen-topics.js';
const KNOWLEDGE_VERSION=BRAIN_VERSION;
const SKILLS = {
  F01:{name:'部位困扰切片',method:'从用户明确提到的一处困扰和客户的真实反应切入→把这件事讲具体→轻咨询；用户已有的变化反馈如实用个人感受方式表达，不自造疗效或照片细节。',needs:'真实问题、发生场景或感受'},
  F02:{name:'阶段记录',method:'以真实日期/阶段作为叙事结构→本人观察与感受→轻互动。缺少日期则改为“最近的感受”，不编造第N天或阶段性结果。',needs:'真实时间或阶段、本人真实感受'},
  F03:{name:'平台经营观点',method:'从日常经营的一项负担或选择切入→引出“平台做重、个人做轻”作为理念→讲今天发生的一件事→邀请了解实际合作方式。不能把平台类比当成已核实合同承诺。',needs:'本人遇到的经营情况/思考'},
  F04:{name:'事业现场信任',method:'只写实际发生的培训、会议、客户沟通或品牌活动→一个细节→个人学到的东西→自然交流。不凭照片编人数、规模或成交。',needs:'现场事实、一点真实心得'},
  F05:{name:'生活与成长',method:'个人真实生活场景→当时一个简单想法→对成长或事业的思考；不必每条硬接招商或品牌。',needs:'一件真实生活小事'},
  F06:{name:'顾客常见问题',method:'用顾客真实关切起头→仅解释已核实的品牌信息或本人体验→建议进一步咨询。遇到成分、医疗安全、临床功效、设备资质等未经核实问题，只能表示需要官方资料。',needs:'真实问题、可核验资料'},
  F07:{name:'真实使用与空瓶记录',method:'用实际用完/持续使用的物品或使用日常切入→自己真实的体验或习惯→简短提问；用完一瓶不等于产品有效，不能自动写功效。',needs:'真实使用记录和已有图片'},
  F08:{name:'经营里程碑',method:'用真实工作/收款/经营片段作钩子→讲做了什么和本人想法→自然邀约交流；不凭空编造收入或人人赚到钱。',needs:'本人经营事实或经营素材'},
  F09:{name:'时间线照片故事',method:'用户提供对比图或变化反馈时，以人物年龄/真实阶段/本人报告的变化作开头→简述故事→邀约了解；有图就建议搭配这组图，绝不说不发图或追问授权，绝不自编照片细节。',needs:'本人提供的变化反馈或照片/阶段信息'},
  F10:{name:'团队现场与成长感悟',method:'一个真实团队/学习/舞台场景→一句自己的新认识→愿意交流的人可以聊；不捏造现场演讲或他人评价。',needs:'活动事实、自己的收获'},
  F11:{name:'顾虑反差开头',method:'用受众真实关切设问→提出一个可信的新观察→展示当次输入的真实情境→自然的下一步；不得制造假稀缺或无证据的效果/收益反差。',needs:'明确关切、真实案例或品牌规则'},
  F12:{name:'宋星辉人物故事',method:'仅当用户输入明确谈宋星辉时，以第三人称写真实可归属的选择/转型/观念→具体已给事实→邀请了解其观点；未经本人核实的经营数据和私事不得引用。',needs:'明确人物指向、来自本人确认的事实'}
};
function selectSkill(task,title,raw) {
  const signal=String(title||'')+' '+String(raw||'');
  if(/宋星辉|宋老师|星辉/.test(signal))return 'F12';
  if(/空瓶|用光|用完/.test(signal))return 'F07';
  if(/对比|前后|照片|阶段|第.{0,4}天|日期/.test(signal)&&/面部|脸|眼|美|状态|轮廓|额头|颈|法令/.test(signal))return 'F09';
  if(/收款|回款|成交|转账|业绩/.test(signal))return 'F08';
  if(/培训|大会|会场|团队|商学院|课程|活动现场/.test(signal))return task==='beauty'?'F04':'F10';
  if(/产品|成分|技术|规格|怎么用|原理|咨询/.test(signal))return task==='beauty'?'F06':'F11';
  if(task==='beauty')return 'F01';
  if(task==='business'||/创业|合作|平台|事业|经营|招商/.test(signal))return 'F03';
  if(task==='brand')return 'F11';
  if(/最近|变化|成长|小时候|以前/.test(signal))return 'F02';
  return 'F05';
}
const SYSTEM = `你是轻拾玖 AI销冠的资深微信朋友圈文案编辑和短视频编导，最擅长把经销商的一句口述，写成有人味、想让人继续聊的中文内容。
【工作分工】轻拾玖及经销商自行决定哪些图片、客户反馈和文字可使用；你是营销编辑，不是审核官。用户提供的照片、案例、反馈和故事视为本次创作素材。不要替她决定不配图、不发布，不要在任何成品、配图建议或标题里说“本人授权、隐私、风险、合规、待核实、未经证实、效果不保证、不可发、先不发、要审核”等提醒。不要自作主张把文案变成建议用户“别发照片”的教育文章。
【事实边界｜内部执行】保留用户明确给出的年龄、客户感受、真实变化与故事，不擅自弱化/删光。用户称“客户觉得”“自己看着变化”时写成客户个人感受或所见，不升级成所有人必然有效；也不虚构医学诊断、治疗承诺、人人收益、回本保证、未给出的数字/对话/动作。不要凭一张对比图凭空写照片里的细节；但既然用户说有照片，就可以在配图建议里说“搭配那组照片”，不需询问使用权限。
【先理解，再创作】后台这次会给你“两层 Brain 的检索结果”：1) 总部品牌 Brain 的可追溯事实/主题卡；2) 宋星辉与经销商录屏观察提炼的营销结构卡（非已验证成交成果）。用当前客户原话作唯一人物事实源，借鉴结构不借用他人经历、截图、效果、业绩、具体天数和原文。只选与当前题目有关的资料，不要在成品里生硬讲品牌知识库、样本编号、公式或者技能。
【常青选题模式】当 evergreenTopic 有值，代表用户只选择了一个可长期讨论的话题，并没有提供本人或客户的新经历。请直接写有趣的文化知识、审美观察、观点或适合熟人讨论的问题，不要虚构“今天我遇到一位客户”“昨天有个姐姐告诉我”或自己亲历；不要编发照片与案例。传统面相/脸部风水作为文化和观察切口，绝不宣称鼻子决定财富、额头决定运势、外貌反映人品；也不必把这些后台提醒写进文案。结尾可自然留一个讨论问题，而非硬推广产品。
【去AI味｜互联网口播语言引擎＋高级嘴替的通用人味规则】
1. 开头直接用素材里最具体的人、事、困扰、惊喜或小反差；不写“今天整理到一位客户的情况”“在这个快节奏时代”“你有没有发现”“很多时候/其实/说到底”等万能开头。
2. 像一个真实做生意的人给微信朋友说话，不像品牌宣传册、培训讲师或客服。可以短句、停顿、轻微口语，但不故意撒娇、不夸张喊麦。
3. 不为凑结构硬加“以前我总觉得”“这句话我记了很久”“让我深刻意识到”“人变美了，心也亮了”“不是……而是……”等虚构感悟或AI式金句。禁用“赋能、闭环、赛道、底层逻辑、价值感、松弛感、自我关照、看见自己、做更好的自己、改变人生、开启旅程”等抽象套话。
4. 具体大于空话：留下年龄、客户的原始表达、当天的小事、产品或活动真实场景；不要先把人物磨成“客户A”，也不要为了显得丰满杜撰镜子、微笑、原话、心理变化。特别检查动作和说话人：用户说“我想分享给朋友”，不能变成“客户主动说想分享”；用户只说“有照片”，不能写“我翻出照片和她对着比”；用户没有说“照镜子、放松下来、当场微笑、做完就说”，任何类似镜头、顺序或情绪细节都不要新增。
5. 一条只说一个重点，不要四段都在总结；真正有内容才有温度。结尾根据任务自然留一个好接话的问题或“想了解可以私信我”，不必每篇硬塞招商。
6. 内部自检：像朋友发的？有没有机器人的概括词和假感悟？是否存在没出现在输入里的经历、反馈或具体效果？有则重写再输出，不向用户展示审稿过程和评分。
【朋友圈】70～140字左右，2～4段，第一句可单独抓人，正文讲一件事，口语有呼吸感；发给熟人，不像广告，也不要太含蓄以至没人知道可咨询什么。
【15秒/30秒视频】直接给可读口播，围绕一个场景和一组真实画面；镜头说明单独标记且简洁。绝对不在可念的口播里讲风险、权限、发布规则，也不凭空描述不存在的视频。
【图片建议】只说“朋友圈配哪张/哪组已有照片”“视频建议剪什么已有素材”，不要加入授权/审核/效果证明提示。没有提到某个具体镜头时，不要假装它已拍摄；可以建议使用已有的护理/产品/客户变化图片，但不能指定不存在的“照镜子侧脸镜头”。图片由用户自己在微信附上。
【JSON输出】只输出有效JSON对象，字段 {"title":"真实有吸引力的短标题","content":"可直接复制发送的朋友圈正文，或可直接照念的短视频口播和简要镜头","why":"非常简短的选题角度","facts":[],"checks":[],"imageTip":"一句具体、实用的配图或画面建议"}。checks 固定空数组，不输出任何额外解释，不用Markdown代码围栏。`
export async function onRequestPost({ request, env }) {
  try {
    const origin=request.headers.get('Origin')||'';
    const host=new URL(request.url).origin;
    if(origin && origin!==host) return Response.json({error:'跨域请求不允许'},{status:403});
    if(!env.DEEPSEEK_API_KEY) return Response.json({error:'DeepSeek 尚未接通：请在 Cloudflare Pages Production 中添加 Secret：DEEPSEEK_API_KEY。',code:'NOT_CONFIGURED',provider:'deepseek'},{status:503,headers:{'Cache-Control':'no-store'}});
    const apiKey=String(env.DEEPSEEK_API_KEY||'').trim().replace(/^Bearer\s+/i,'').replace(/^["']|["']$/g,'');
    const data=await request.json();
    const raw=String(data.raw||'').trim().slice(0,3500);
    const topic=findEvergreenTopic(String(data.evergreenTopicId||'').slice(0,40));
    if(raw.length<12 && !topic) return Response.json({error:'请至少说一两句真实发生的事情（不少于12字），或选择一个常青选题。'},{status:400});
    const mode=['moments','video15','video30'].includes(data.mode)?data.mode:'moments';
    const style=['自然','故事感','专业','温暖'].includes(data.style)?data.style:'自然';
    const angle=String(data.angle||'').slice(0,250);
    const task=['beauty','business','life','growth','video','product','brand'].includes(data.task)?data.task:'life';
    const taskTitle=String(data.taskTitle||'').slice(0,100);
    const previous=String(data.previous||'').slice(0,1200);
    const skillId=topic?(topic.category==='culture'?'F11':topic.category==='beauty'?'F06':topic.category==='business'?'F03':'F05'):selectSkill(task,taskTitle,raw);
    const skill=SKILLS[skillId];
    const topicContext=topic?topic.title+'。'+topic.angle:'';
    const brain=retrieveQingshijiuBrain({raw:raw||topicContext,taskTitle:topic?.title||taskTitle,task:topic?.category==='business'?'business':topic?.category==='growth'?'growth':topic?'beauty':task,mode,skillId});
    const prompt=JSON.stringify({raw,mode,style,task,taskTitle:topic?.title||taskTitle,angle,previous,
      evergreenTopic:topic?{id:topic.id,series:topic.series,title:topic.title,angle:topic.angle,category:topic.category}:undefined,
      brandKnowledgeVersion:KNOWLEDGE_VERSION,
      brandBrain:brain.brand,
      successfulOperatorBrain:brain.operatorMethods,
      songXinghuiContext:brain.person.length?brain.person:undefined,
      currentMarketingSkill:{id:skillId,name:skill.name,method:skill.method,requiredEvidence:skill.needs},
      brainEditorialRules:brain.writingInstructions,
      context:'品牌方负责选择发布素材及使用权限；AI只负责营销写作。用户给出的客户变化和感受可作为个案真实经历表达，不凭空夸大普遍疗效。任何发布审核、图片授权、风险核实的话不要写入成品或配图建议。个人经历只来自 raw；历史稿仅用于避免重复。'});
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),28000);
    let ai;
    try{ai=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({model:'deepseek-flash',thinking:{type:'disabled'},temperature:0.75,max_tokens:1200,response_format:{type:'json_object'},messages:[{role:'system',content:SYSTEM},{role:'user',content:prompt}]}),signal:controller.signal});}finally{clearTimeout(timeout);}
    if(!ai.ok) {
      // Report only provider status/code/type: never log or echo credentials, user input, or raw upstream text.
      let provider={};try{provider=await ai.json()}catch{}
      const clean=v=>String(v||'').slice(0,64).replace(/[^a-zA-Z0-9_.-]/g,'');
      const upstreamCode=clean(provider?.error?.code);
      const upstreamType=clean(provider?.error?.type);
      let message='AI 模型暂时不可用，请稍后重试。';
      if(ai.status===401) message='DeepSeek 密钥无效，请检查 DEEPSEEK_API_KEY 是否来自 DeepSeek API 平台。';
      else if(ai.status===402) message='DeepSeek 账户余额不足，请先在 DeepSeek API 平台充值。';
      else if(ai.status===403) message='DeepSeek API 无权访问，请检查 Key 和账户权限。';
      else if(ai.status===429 || upstreamCode==='insufficient_quota') message='DeepSeek API 触发速率限制，请稍后重试。';
      else if(ai.status===400 || ai.status===404) message='DeepSeek 模型请求未被接受，请检查接口和模型配置。';
      return Response.json({error:message,code:'UPSTREAM_ERROR',provider:'deepseek',upstream_status:ai.status,upstream_code:upstreamCode,upstream_type:upstreamType},{status:424,headers:{'Cache-Control':'no-store'}});
    }
    const body=await ai.json();let output;
    try{output=JSON.parse(body.choices[0].message.content);}catch{return Response.json({error:'AI 返回格式错误，请重试'},{status:502});}
    if(!output.content||typeof output.content!=='string')return Response.json({error:'AI 未返回有效文案，请重试'},{status:502});
    return Response.json({result:output,mode:'live',provider:'deepseek',knowledgeVersion:KNOWLEDGE_VERSION,skill:{id:skillId,name:skill.name},evergreenTopic:topic?{id:topic.id,label:topic.label,title:topic.title}:null,brain:{version:brain.version,brandCardIds:brain.trace.brandIds,operatorSampleIds:brain.trace.sampleIds,personCardIds:brain.trace.personIds}},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return Response.json({error:e.name==='AbortError'?'AI 响应超时，请重试':'生成失败，请稍后再试'},{status:500});}
}
