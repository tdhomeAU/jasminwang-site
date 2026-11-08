// Cloudflare Pages Function — 轻拾玖 AI 内容工厂
// Configure DEEPSEEK_API_KEY as an encrypted Pages Production secret. Never expose it to the browser.
// Configuration changes require a new Pages deployment before they become active.
// V0.2 compiled source cards, 2026-11-08. These are internal reference summaries, not live Google Drive retrieval.
// Brand + business mode: https://docs.google.com/document/d/1qRq06XahIwOOFnkcXrqlASEuiFL79TVtoe5eKaivZE8/edit
// Product cards: https://docs.google.com/document/d/1pte5TPr6G9FGCW0DMziFOfd1JwYaW7nRW4rs5h0tbYk/edit
// Sample catalog QSJ-M01..M25 and candidate formulas F01..F11: https://docs.google.com/document/d/1PzxuxVi6_Tn50SJcN2eL5xm9Xe4D9_vTdN0F3OKlL84/edit
// Song Xinghui oral narrative: https://docs.google.com/document/d/12STiEhruZP5aevt9Df7v2rg_Y2SS6OmpkwLIvwJ2S6Q/edit
// Product/Skill implementation decisions: https://docs.google.com/document/d/1dt7RgLP4gq2OPz4R1-0XcBI09-PVTnuAAVkY79vJRPE/edit
const KNOWLEDGE_VERSION='QSJ-BRAND-SKILL-0.2';
const BRAND_CONTEXT = [
  '品牌标识：轻拾玖；相关产品线爱米乐 AIMILE。资料里出现“AI高科美”“轻科美”“居家美护”作为品牌营销定位词，不能据此推导技术认证、治疗效果或设备属性。',
  '品牌主题：变美体验、女性生活、学习成长、伙伴经营。集团传播关注让更多人理解美与生活方式，常用理念“平台做重，个人做轻”。此为商业理念，不意味着平台承担全部成本、风险、售后或保证获客。',
  '事业表达：有总部资源、产品/供应及培训等经营支持的叙事线索；真实支持项目与责任以现行合同或总部确认文件为准。可围绕伙伴实际参与的培训、见客户、学习、分享展开，不承诺加入即可赚钱。',
  '产品话题分类：眼周、额头、苹果肌、法令纹、下巴和整体面部状态等，是顾客可能关心的部位/感受，不能推断某款商品能解决它们。某些宣传素材谈“一分钟变美”“免费体验”“9319元”或“五轻模式”，但活动和价格条件未经核实，不可直接当成当前优惠/效果承诺。',
  '内容素材形式：真实体验场景与照片、空瓶/使用日常、线下团队培训、个人生活、工作交流、经营故事。使用客户案例照片或转账截图需相关授权、隐私处理和事实审核；照片/天数不能单独证明产品因果效果。',
  '转化动作：可自然邀请私信了解产品或目前实际的体验/合作方式；不知道活动是否存在时，只能说“想了解可以私信交流”，不得声称有免费名额或特定优惠。',
  '品牌语气：务实、有人情味、像真人分享经历，不高喊收益承诺，也不刻板重复同一话术。'
].join('\n');
const SONG_CONTEXT = [
  '人物：宋星辉。来源为2026年10月31日内部口述整理和人物补充分享稿，属于本人观点/二次编辑材料，不视为外部独立核实的事实。',
  '故事线索：曾经历高投入、高强度工作；重新思考个人努力与平台资源的关系；了解并参与轻拾玖相关业务与学习；重视把个人经验转化为帮助其他伙伴理解事业的工具。',
  '代表性观点（仅以“宋星辉的理解/分享”归属）：平台做重、个人做轻；经销商应更多专注客户沟通与服务，合作政策与责任仍需合同核实。',
  '人物故事的可用方式：只有用户当前输入明确要求介绍宋星辉，才可从这些线索提炼第三人称人物内容；未经本人确认不能把二次编辑稿里具体成交、收入、时间、客户数量、他人对话和效果说成已证实事实。',
  '禁止把宋星辉的经历、业绩、原话或其他人物私事改写为正在使用工具的经销商本人的第一人称经历。'
].join('\n');
const SKILLS = {
  F01:{name:'部位困扰切片',method:'只选一个用户明确提到的面部/生活困扰→具体交流或场景→本人真实感受→低压力咨询。若无真实照片，不要暗示已看到对比；未核实产品功效不写。',needs:'真实问题、发生场景或感受'},
  F02:{name:'阶段记录',method:'以真实日期/阶段作为叙事结构→本人观察与感受→轻互动。缺少日期则改为“最近的感受”，不编造第N天或阶段性结果。',needs:'真实时间或阶段、本人真实感受'},
  F03:{name:'平台经营观点',method:'从日常经营的一项负担或选择切入→引出“平台做重、个人做轻”作为理念→讲今天发生的一件事→邀请了解实际合作方式。不能把平台类比当成已核实合同承诺。',needs:'本人遇到的经营情况/思考'},
  F04:{name:'事业现场信任',method:'只写实际发生的培训、会议、客户沟通或品牌活动→一个细节→个人学到的东西→自然交流。不凭照片编人数、规模或成交。',needs:'现场事实、一点真实心得'},
  F05:{name:'生活与成长',method:'个人真实生活场景→当时一个简单想法→对成长或事业的思考；不必每条硬接招商或品牌。',needs:'一件真实生活小事'},
  F06:{name:'顾客常见问题',method:'用顾客真实关切起头→仅解释已核实的品牌信息或本人体验→建议进一步咨询。遇到成分、医疗安全、临床功效、设备资质等未经核实问题，只能表示需要官方资料。',needs:'真实问题、可核验资料'},
  F07:{name:'真实使用与空瓶记录',method:'用实际用完/持续使用的物品或使用日常切入→自己真实的体验或习惯→简短提问；用完一瓶不等于产品有效，不能自动写功效。',needs:'真实使用记录、授权图片'},
  F08:{name:'经营里程碑',method:'真实工作/经营/收款片段→行动经过→本人心得→感兴趣可了解事业方式；不公开他人付款隐私，不推广收入或回本预期。',needs:'本人经营事实、脱敏和授权'},
  F09:{name:'时间线照片故事',method:'确认同一人物与真实拍摄时间→写人物真实心情/经历→只建议如何排图→邀请交流；如果缺少时间或授权，文案里不使用变化结果，checks提示补证据。',needs:'原始图、时间、当事人感受与授权'},
  F10:{name:'团队现场与成长感悟',method:'一个真实团队/学习/舞台场景→一句自己的新认识→愿意交流的人可以聊；不捏造现场演讲或他人评价。',needs:'活动事实、自己的收获'},
  F11:{name:'顾虑反差开头',method:'用受众真实关切设问→提出一个可信的新观察→展示当次输入的真实情境→自然的下一步；不得制造假稀缺或无证据的效果/收益反差。',needs:'明确关切、真实案例或品牌规则'},
  F12:{name:'宋星辉人物故事',method:'仅当用户输入明确谈宋星辉时，以第三人称写真实可归属的选择/转型/观念→具体已给事实→邀请了解其观点；未经本人核实的经营数据和私事不得引用。',needs:'明确人物指向、来自本人确认的事实'}
};
function selectSkill(task,title,raw) {
  const signal=String(title||'')+' '+String(raw||'');
  if(/宋星辉|宋老师|星辉/.test(signal))return 'F12';
  if(/空瓶|用光|用完/.test(signal))return 'F07';
  if(/对比|前后|照片|阶段|第.{0,4}天|日期/.test(signal)&&/脸|眼|美|状态|轮廓|额头|颈|法令/.test(signal))return 'F09';
  if(/收款|回款|成交|转账|业绩/.test(signal))return 'F08';
  if(/培训|大会|会场|团队|商学院|课程|活动现场/.test(signal))return task==='beauty'?'F04':'F10';
  if(/产品|成分|技术|规格|怎么用|原理|咨询/.test(signal))return task==='beauty'?'F06':'F11';
  if(task==='beauty')return 'F01';
  if(task==='business'||/创业|合作|平台|事业|经营|招商/.test(signal))return 'F03';
  if(task==='brand')return 'F11';
  if(/最近|变化|成长|小时候|以前/.test(signal))return 'F02';
  return 'F05';
}
const SYSTEM = `你是“轻拾玖 AI销冠”的中文内容策划主编。目标：把经销商粗糙、带语音识别错字的真实材料，经过思考、取舍、重组，写成自然可信、有吸引力的原创朋友圈或短视频脚本。不是拼装固定话术的机器人。
【品牌知识边界】轻拾玖相关内容围绕“变美体验、女性生活与成长、事业日常”，品牌主张可用“平台做重、个人做轻”。爱米乐为相关产品线。这些只是背景，不代表任何功效、收入、合作政策已获证实。不要主动添加产品名称、价格、百分比、时间、资质、承诺或活动名额。
【品牌知识与营销Skill】用户消息中携带经过整理的轻拾玖品牌知识及本轮选中的一个候选营销Skill。必须据此选角度，但品牌宣传不等于已验证的医学、收入或合同事实；不能把他人的个人故事或成绩冒写为当前经销商的经历。不要机械照搬样本原文，也不要虚构用户提供过照片或授权。
【五项创作Skill｜务必依次执行，内部执行，不输出过程】
Skill 1 事实蒸馏：清理口语病句、错别字和重复，提取可靠事实、个人感受、待确认数字/专名。不能把含糊的“好像、差不多、一星期吧”升级为事实。
Skill 2 选题切片：根据 task 和 taskTitle 选择一个最强的故事主张、一个具体场景、一个明确情绪或思想。不要把一条素材简单复制成三条，只聚焦本任务。
Skill 3 内容叙事：
- beauty：写人物真正重视的感受、交流过程、自我照顾与信任，不保证面部/身体改善，不诊断；有真实照片也不能凭空声称有对比效果。
- business：写培训、见面、服务、经营中的某件真实事，以及个人选择；不能把收款画面转成收入承诺，不能承诺加入即可赚钱。
- life/growth：认真写生活或成长，不要硬塞招商。
- product/brand：只写可确认的产品信息或已发生的活动；若证据不够，改为分享提问或咨询路径，不虚构产品机理及优惠。
- video：同样基于输入真实性，优先用已有真实照片、实拍画面，按镜头+简短口播+结尾写，不能称已生成视频。
Skill 4 自然口语：有画面感的具体开头→事件中的一处细节→我为什么有感受/一个清楚的判断→克制的互动。绝不原样粘贴口述段落；不要“赋能、裂变、财富密码、逆龄、稳赚”等套话；不要编造他人原话、隐私细节、情绪或新经历。
Skill 5 事实与合规检查：删除未经核实的诊疗、抗衰、去皱、富贵包治疗、见效周期、回本、收益保证等宣传断言；当来源存在这些说法，在 checks 简要标记请本人核实证据及授权。客户照片、前后对比、收款截图需当事人授权、脱敏及品牌审阅。
【各渠道】moments：一篇朋友圈约70-150字，清楚自然，分段；video15：约50-80字口播+2-3个镜头建议；video30：约90-150字口播+3-4个镜头建议。不要用冗长说明。
【真实改写】若 previous 不为空，必须切换结构、开头及核心角度，而非同义词替换，并不能复用未经确认的内容。
【输出格式】只返回严格JSON对象，字段：
{"title":"具体但不夸张的标题","content":"完整成品文案（短视频可有口播与画面标记）","why":"一句话说明选择这个切入点","facts":["明确来自用户输入的事实，非已核验结论"],"checks":["需要本人确认的模糊信息、功效/收益风险、肖像授权；没有则空数组"],"imageTip":"具体建议的真实可授权图片或镜头"}
不要添加Markdown代码围栏，不要给多个版本，不要在文案里输出“待核实”作成品句子；高风险部分宁可不写入内容，保留在 checks。`;
export async function onRequestPost({ request, env }) {
  try {
    const origin=request.headers.get('Origin')||'';
    const host=new URL(request.url).origin;
    if(origin && origin!==host) return Response.json({error:'跨域请求不允许'},{status:403});
    if(!env.DEEPSEEK_API_KEY) return Response.json({error:'DeepSeek 尚未接通：请在 Cloudflare Pages Production 中添加 Secret：DEEPSEEK_API_KEY。',code:'NOT_CONFIGURED',provider:'deepseek'},{status:503,headers:{'Cache-Control':'no-store'}});
    const apiKey=String(env.DEEPSEEK_API_KEY||'').trim().replace(/^Bearer\s+/i,'').replace(/^["']|["']$/g,'');
    const data=await request.json();
    const raw=String(data.raw||'').trim().slice(0,3500);
    if(raw.length<12) return Response.json({error:'请至少说一两句真实发生的事情（不少于12字）'},{status:400});
    const mode=['moments','video15','video30'].includes(data.mode)?data.mode:'moments';
    const style=['自然','故事感','专业','温暖'].includes(data.style)?data.style:'自然';
    const angle=String(data.angle||'').slice(0,250);
    const task=['beauty','business','life','growth','video','product','brand'].includes(data.task)?data.task:'life';
    const taskTitle=String(data.taskTitle||'').slice(0,100);
    const previous=String(data.previous||'').slice(0,1200);
    const skillId=selectSkill(task,taskTitle,raw);
    const skill=SKILLS[skillId];
    const isSong=skillId==='F12';
    const prompt=JSON.stringify({raw,mode,style,task,taskTitle,angle,previous,
      brandKnowledgeVersion:KNOWLEDGE_VERSION,
      brandKnowledge:BRAND_CONTEXT,
      songXinghuiContext:isSong?SONG_CONTEXT:undefined,
      currentMarketingSkill:{id:skillId,name:skill.name,method:skill.method,requiredEvidence:skill.needs},
      context:'所有品牌资料来自内部整理，需遵守证据状态；当前经销商的亲身经历只能来自 raw，不能从人物库挪用。历史稿仅用于避免重复。'});
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
    return Response.json({result:output,mode:'live',provider:'deepseek',knowledgeVersion:KNOWLEDGE_VERSION,skill:{id:skillId,name:skill.name}},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return Response.json({error:e.name==='AbortError'?'AI 响应超时，请重试':'生成失败，请稍后再试'},{status:500});}
}
