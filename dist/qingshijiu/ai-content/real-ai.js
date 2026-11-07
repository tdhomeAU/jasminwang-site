/* 轻拾玖 AI销冠 V2.1 — 真人模型生成覆盖旧版拼接按钮；其余页面不动 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const btn = $('make'), field = $('story'), result = $('result'), output = $('output');
  if (!btn || !field || !result || !output) return;
  let activeMode='moments', activeDraft=null, previousDraft=null, requestNo=0, busy=false;
  const cache=new Map();
  const modes={social:'moments',v15:'video15',v30:'video30'};
  const fmts={moments:'social',video15:'v15',video30:'v30'};
  const names={moments:'朋友圈',video15:'15秒视频',video30:'30秒视频'};
  const info=document.createElement('div');
  info.id='qsjAiStatus';info.setAttribute('role','status');
  info.style.cssText='font-size:12px;line-height:1.65;color:#e4c99b;margin:9px 2px;min-height:1.4em;white-space:pre-wrap';
  info.textContent='输入将发送到 AI 服务生成草稿；请隐去客户姓名等隐私，发布前核对事实与授权。';
  btn.insertAdjacentElement('afterend',info);
  const checks=document.createElement('div');
  checks.id='qsjAiChecks';
  checks.style.cssText='font-size:12px;line-height:1.75;color:#d8ccb9;white-space:pre-wrap;margin:10px 2px';
  $('mediaTip')?.insertAdjacentElement('afterend',checks);
  const taskTitle=()=>($('taskTitle')?.textContent||'今天的一段真实分享').trim();
  const taskKind=name=>/视频/.test(name)?'video':/客户|变美|体验/.test(name)?'beauty':/产品/.test(name)?'product':/总部|培训/.test(name)?'brand':/事业|创业|生意/.test(name)?'business':'life';
  const defaultMode=()=>/短视频|视频/.test($('taskTag')?.textContent||'')?'video15':'moments';
  const cacheKey=mode=>JSON.stringify([taskTitle(),field.value.trim(),mode]);
  const status=(s,error=false)=>{info.textContent=s;info.style.color=error?'#ffc3a8':'#e4c99b'};
  const trunc=(s,n)=>String(s||'').slice(0,n);
  function tabs(mode){
    activeMode=mode;
    document.querySelectorAll('[data-f]').forEach(x=>x.classList.toggle('on',x.dataset.f===fmts[mode]));
    $('video')?.classList.toggle('show',mode!=='moments');
  }
  function show(draft,mode){
    activeDraft=draft;tabs(mode);result.classList.add('show');
    output.textContent=draft.content;
    if($('mediaTip'))$('mediaTip').textContent='配图/画面建议：'+(trunc(draft.imageTip,350)||'使用本人真实、获授权的素材。');
    const notes=[];
    if(draft.why)notes.push('写作角度：'+trunc(draft.why,180));
    if(Array.isArray(draft.checks)&&draft.checks.length)notes.push('发布前核对：\n'+draft.checks.slice(0,5).map(s=>'• '+trunc(s,200)).join('\n'));
    checks.textContent=notes.join('\n\n');
    status('✓ 由模型生成的'+names[mode]+'初稿。请确认事实后发布。');
    result.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function valid(){return activeDraft&&cache.get(cacheKey(activeMode))===activeDraft}
  function working(v){
    busy=v;btn.disabled=v;if($('rewrite'))$('rewrite').disabled=v;
    document.querySelectorAll('[data-f]').forEach(b=>b.disabled=v);
    btn.textContent=v?'AI 正在认真写…':'✦ 帮我写好';
  }
  async function make(mode,rewrite=false){
    if(busy)return;
    const raw=field.value.trim();
    if(raw.length<12){status('请至少输入12个字，说一件真实发生的事。不会替你编造故事。',true);return}
    const key=cacheKey(mode);
    if(!rewrite&&cache.has(key)){show(cache.get(key),mode);return}
    const current=taskTitle();
    const previous=cache.get(key)?.content||previousDraft?.content||'';
    const angle='内容任务：'+current+'。按轻拾玖相应的营销Skill提炼故事、改写口语，'+(rewrite?'请彻底换叙事角度和开头，避免同义替换。':'不能机械拼接原话。');
    const n=++requestNo;
    working(true);status('正在清理口述、提炼故事、核对表达并生成'+names[mode]+'…');
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000);
    try{
      const response=await fetch('/api/qingshijiu-generate',{
        method:'POST',credentials:'same-origin',signal:controller.signal,
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({raw,mode,style:'自然',task:taskKind(current),taskTitle:current,angle,previous:rewrite?previous:''})
      });
      let body={};try{body=await response.json()}catch{throw new Error('接口没有返回有效JSON，请检查部署')}
      if(!response.ok)throw new Error(body.error||'AI调用失败（HTTP '+response.status+'）');
      if(body.mode!=='live'||typeof body.result?.content!=='string'||!body.result.content.trim())throw new Error('接口没有返回真正的AI文案');
      if(n!==requestNo)return;
      if(cacheKey(mode)!==key){status('输入已发生变化，请点击重新生成。',true);return}
      previousDraft=activeDraft;cache.set(key,body.result);show(body.result,mode);
    }catch(e){
      if(n===requestNo){
        const reason=e.name==='AbortError'?'AI 连接超时，请重试。':e.message||'AI服务不可用';
        status('本次没有生成内容：'+reason+'\n不会用固定模板或原始语音冒充AI。',true);
        if(!valid())result.classList.remove('show');
      }
    }finally{clearTimeout(timeout);if(n===requestNo)working(false)}
  }
  async function copyText(s){
    if(!s){status('请先生成文案。',true);return}
    try{
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(s);
      else{const a=document.createElement('textarea');a.value=s;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}
      status('✓ 已复制，请确认后自行发布。');
    }catch{status('复制失败，请长按成品文字复制。',true)}
  }
  btn.onclick=()=>make(defaultMode());
  if($('rewrite'))$('rewrite').onclick=()=>make(activeMode,true);
  document.querySelectorAll('[data-f]').forEach(x=>{x.onclick=()=>make(modes[x.dataset.f]||'moments')});
  if($('copy'))$('copy').onclick=()=>copyText(valid()?output.textContent:'');
  if($('videoAction'))$('videoAction').onclick=()=>{
    if(!valid()||activeMode==='moments'){status('请先生成视频脚本。',true);return}
    const avatar=$('avatarMode')?.classList.contains('on');
    const prefix=avatar?'【数字人制作需求｜视频服务尚未接通】\n请使用获授权的形象、声音和图片。\n\n':'';
    copyText(prefix+output.textContent);
  };
  const mark=$('markDone');
  if(mark){const old=mark.onclick;mark.onclick=function(e){
    if(!valid()){status('请先生成当前内容并自行发布。',true);return}
    if(typeof window.qsjSaveAiDraft==='function') window.qsjSaveAiDraft(field.value.trim(),activeDraft.content);
    old?.call(mark,e);activeDraft=null;checks.textContent='';
  }}
})();