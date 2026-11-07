// Cloudflare Pages Function — 轻拾玖 AI 内容工厂
// Configure OPENAI_API_KEY as an encrypted Pages secret. Never expose it to the browser.
const SYSTEM = `你是“轻拾玖 AI 内容工厂”的中文主编。你的任务是把经销商粗糙的口述变成真正可发布、有个人辨识度且谨慎合规的原创内容。
品牌知识：轻拾玖的对外主张之一是“平台做重、个人做轻”，关注美业、个人经营与伙伴成长。这是品牌观点，不能当作已证实的收入、经营结果或产品疗效。爱米乐为有关产品线名称。未经总部审定的产品效果、收益、政策、医疗资质、适用人群一律不得补写。
写作工作流：
1. 理解口述：自动纠正明显错字、重复、断句、语音识别问题；不确定的专名/数字标记需确认，不得擅自确定。
2. 提取原始事实与个人感受，区分未经核实的效果陈述；严禁编造引号对话、背景、产品机制、对比结果、客户反馈。
3. 生成自然的中文内容，像经销商本人说的话，不像广告；不沿用用户语音中的病句，不能仅把原话夹在头尾。
4. 如果涉及变美、瘦身、富贵包、皱纹或产品使用结果，不能声称疗效、保证效果、见效天数或具体身体变化；可以改成关注体验过程与真实心情，并建议配经授权的照片，具体效果需要可靠证据及审核。
5. 三条朋友圈功能不允许把一条素材机械重复三遍：生活记录可以来自输入，创业观点/知识类只能写成明确的观点或提问；没有其他证据时不假装亲历或虚构日常。
6. 支持 modes：moments、video15、video30；风格 styles：自然、故事感、专业、温暖。moments 写 90-160 字左右，video15 55-90 字，video30 110-170 字。每篇写法换角度时应真正变换叙事结构。
7. 标题/开头应具体；克制营销，不出现“震惊”“逆天”“永久”“稳赚”等。
8. 默认只生成一篇，返回严格 JSON 对象字段：{"title":"简短选题标题","content":"成品完整文案","why":"这篇从哪个角度切入，简洁一句","facts":["确实来自输入的事实"],"checks":["需本人确认或风险提醒，没有则空数组"],"imageTip":"建议搭配的真实照片/画面"}，不要代码围栏或多余文字。`;
export async function onRequestPost({ request, env }) {
  try {
    const origin=request.headers.get('Origin')||'';
    const host=new URL(request.url).origin;
    if(origin && origin!==host) return Response.json({error:'跨域请求不允许'},{status:403});
    if(!env.OPENAI_API_KEY) return Response.json({error:'AI 服务尚未配置：请在 Cloudflare Pages 中设置 OPENAI_API_KEY。演示内容不代表真实 AI 生成。',code:'NOT_CONFIGURED'},{status:503});
    const data=await request.json();
    const raw=String(data.raw||'').trim().slice(0,3500);
    if(raw.length<12) return Response.json({error:'请至少说一两句真实发生的事情（不少于12字）'},{status:400});
    const mode=['moments','video15','video30'].includes(data.mode)?data.mode:'moments';
    const style=['自然','故事感','专业','温暖'].includes(data.style)?data.style:'自然';
    const angle=String(data.angle||'').slice(0,250);
    const prompt=JSON.stringify({raw,mode,style,angle,context:'用户输入是未经核实的原始口述。纠错但不可篡改，无法核实的效果主张不允许直接成为宣传结论。'});
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),22000);
    let ai;
    try{ai=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:env.OPENAI_MODEL||'gpt-4.1-mini',temperature:0.75,response_format:{type:'json_object'},messages:[{role:'system',content:SYSTEM},{role:'user',content:prompt}]}),signal:controller.signal});}finally{clearTimeout(timeout);}
    if(!ai.ok) return Response.json({error:'AI 服务暂时不可用，请检查模型权限和后台日志',code:'UPSTREAM_ERROR'},{status:502});
    const body=await ai.json();let output;
    try{output=JSON.parse(body.choices[0].message.content);}catch{return Response.json({error:'AI 返回格式错误，请重试'},{status:502});}
    if(!output.content||typeof output.content!=='string')return Response.json({error:'AI 未返回有效文案，请重试'},{status:502});
    return Response.json({result:output,mode:'live'},{headers:{'Cache-Control':'no-store'}});
  }catch(e){return Response.json({error:e.name==='AbortError'?'AI 响应超时，请重试':'生成失败，请稍后再试'},{status:500});}
}
