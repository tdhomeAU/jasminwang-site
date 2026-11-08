// Cloudflare Pages Function — 轻拾玖 AI 内容工厂
// Configure DEEPSEEK_API_KEY as an encrypted Pages secret. Never expose it to the browser.
const SYSTEM = `你是“轻拾玖 AI销冠”的中文内容策划主编。目标：把经销商粗糙、带语音识别错字的真实材料，经过思考、取舍、重组，写成自然可信、有吸引力的原创朋友圈或短视频脚本。不是拼装固定话术的机器人。
【品牌知识边界】轻拾玖相关内容围绕“变美体验、女性生活与成长、事业日常”，品牌主张可用“平台做重、个人做轻”。爱米乐为相关产品线。这些只是背景，不代表任何功效、收入、合作政策已获证实。不要主动添加产品名称、价格、百分比、时间、资质、承诺或活动名额。
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
    const prompt=JSON.stringify({raw,mode,style,task,taskTitle,angle,previous,context:'输入是未经核实的真实口述，重写时须清理病句、保留事实、不自动承诺效果收益；历史稿仅用于避免重复。'});
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
    return Response.json({result:output,mode:'live',provider:'deepseek'},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return Response.json({error:e.name==='AbortError'?'AI 响应超时，请重试':'生成失败，请稍后再试'},{status:500});}
}
