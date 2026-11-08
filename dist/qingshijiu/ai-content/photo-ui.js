/* QSJ V2.6 — real-photo visual navigation and functioning evergreen topics. */
(() => {
  'use strict';
  const work=document.getElementById('work');
  if(!work||document.getElementById('photoStudio'))return;
  const asset='assets/';
  document.querySelector('.factory-gallery')?.remove();
  const container=document.createElement('section');
  container.id='photoStudio';container.className='photo-studio';
  container.innerHTML=
    '<div class="photo-heading"><strong>今天想做什么？</strong><small>点张图，就开始</small></div>'+
    '<div class="photo-grid">'+
      '<button type="button" class="photo-tile" data-kind="moments" aria-label="写朋友圈"><img alt="轻拾玖真实客户面部案例照片" src="'+asset+'client.svg"><span class="visual-chip">AI文案</span><span class="visual-bottom"><span class="visual-title">朋友圈</span><span class="visual-caption">一句话写好</span></span><span class="tile-arrow">›</span></button>'+
      '<button type="button" class="photo-tile" data-kind="video" aria-label="做短视频口播"><img alt="真实品牌大会照片" src="'+asset+'team.svg"><span class="visual-chip">15 / 30 秒</span><span class="visual-bottom"><span class="visual-title">视频口播</span><span class="visual-caption">开口就能录</span></span><span class="tile-arrow">›</span></button>'+
      '<button type="button" class="photo-tile" data-kind="topic" aria-label="AI找话题，脸部风水常青选题"><img alt="品牌女性人物照片" src="'+asset+'face.svg"><span class="visual-chip">AI找话题</span><span class="visual-bottom"><span class="visual-title">脸部风水</span><span class="visual-caption">今天没素材？点这里</span></span><span class="tile-arrow">›</span></button>'+
      '<button type="button" class="photo-tile" data-kind="avatar" aria-label="数字人口播制作"><img alt="轻拾玖品牌人物与AI视觉图" src="'+asset+'avatar.svg"><span class="visual-chip">数字人</span><span class="visual-bottom"><span class="visual-title">数字人</span><span class="visual-caption">先写口播 · 视频待接</span></span><span class="tile-arrow">›</span></button>'+
    '</div>';
  const topics=document.createElement('section');
  topics.id='topicPicker';topics.className='topic-picker';topics.setAttribute('aria-label','AI找话题');
  topics.innerHTML=
    '<div class="picker-heading"><strong>今天聊哪一个？</strong><button type="button" id="closeTopics" aria-label="关闭话题">✕</button></div>'+
    '<div class="topic-switch"><button type="button" class="on" data-series="脸部风水">脸部风水</button><button type="button" data-series="女人的生活">女人的生活</button></div>'+
    '<div class="topic-photos" id="topicPhotos" aria-live="polite"></div>'+
    '<div class="picker-foot"><small id="topicCounter">选一张图</small><button type="button" id="moreTopics">换一组 ✦</button></div>';
  const avatar=document.createElement('section');
  avatar.id='avatarPicker';avatar.className='avatar-picker';avatar.setAttribute('aria-label','AI数字人');
  avatar.innerHTML=
    '<div class="picker-heading"><strong>AI数字人</strong><button type="button" id="closeAvatar" aria-label="关闭数字人">✕</button></div>'+
    '<div class="avatar-hero"><img src="'+asset+'avatar.svg" alt="数字人创作视觉">'+
      '<div class="avatar-message"><strong>先把口播写好</strong><p>DeepSeek 可以写15秒或30秒脚本。数字人视频服务还没接入。</p>'+
      '<button type="button" id="prepareAvatar">写15秒口播 ›</button></div></div>';
  work.parentNode.insertBefore(container,work);
  container.insertAdjacentElement('afterend',topics);
  topics.insertAdjacentElement('afterend',avatar);
  let entries=[],series='脸部风水',page=0;
  const byId=id=>document.getElementById(id);
  const closeAll=()=>{
    topics.classList.remove('show');avatar.classList.remove('show');
    document.querySelector('[data-kind="topic"]')?.setAttribute('aria-expanded','false');
    document.querySelector('[data-kind="avatar"]')?.setAttribute('aria-expanded','false');
  };
  const getTopics=async()=>{
    if(entries.length)return entries;
    const response=await fetch('./topics.json?v=26',{cache:'force-cache'});
    if(!response.ok)throw Error('找不到选题库');
    const data=await response.json();
    if(!Array.isArray(data))throw Error('话题格式错误');
    entries=data.filter(x=>/^(face|women)[0-9]{2}$/.test(x.id||'')&&x.title);
    return entries;
  };
  const renderTopics=()=>{
    const selection=entries.filter(t=>t.series===series),target=byId('topicPhotos');
    target.replaceChildren();
    const count=Math.min(3,selection.length);
    for(let i=0;i<count;i++){
      const t=selection[(page*3+i)%selection.length];
      if(!t)continue;
      const b=document.createElement('button');
      b.type='button';b.className='topic-photo';
      b.setAttribute('aria-label',t.title);
      const img=document.createElement('img');
      img.loading='lazy';img.alt='';img.src=asset+(series==='脸部风水'?(i===1?'client.svg':'face.svg'):(i===0?'team.svg':'face.svg'));
      const title=document.createElement('span');title.textContent=t.label;
      b.append(img,title);
      b.addEventListener('click',()=>{
        closeAll();
        document.querySelectorAll('.photo-tile').forEach(x=>x.removeAttribute('data-selected'));
        if(typeof window.qsjAiChooseTopic==='function')window.qsjAiChooseTopic(t);
        else alert('AI正在连接，请刷新页面重试。');
      });
      target.appendChild(b);
    }
    byId('topicCounter').textContent='共 '+selection.length+' 个话题 · 点图生成';
  };
  const openTopics=async()=>{
    closeAll();topics.classList.add('show');
    document.querySelector('[data-kind="topic"]')?.setAttribute('aria-expanded','true');
    byId('topicPhotos').textContent='正在准备灵感…';
    try{await getTopics();renderTopics();}
    catch{byId('topicPhotos').textContent='话题暂时加载失败，请刷新后重试。';}
    topics.scrollIntoView({behavior:'smooth',block:'nearest'});
  };
  const openAvatar=()=>{
    closeAll();avatar.classList.add('show');
    document.querySelector('[data-kind="avatar"]')?.setAttribute('aria-expanded','true');
    avatar.scrollIntoView({behavior:'smooth',block:'nearest'});
  };
  container.querySelectorAll('.photo-tile').forEach(tile=>{
    tile.addEventListener('click',()=>{
      const kind=tile.dataset.kind;
      if(kind==='topic'){openTopics();return;}
      if(kind==='avatar'){openAvatar();return;}
      closeAll();
      if(typeof window.qsjAiSetMode==='function')window.qsjAiSetMode(kind==='video'?'video15':'moments');
      else work.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
  byId('closeTopics').onclick=closeAll;byId('closeAvatar').onclick=closeAll;
  byId('moreTopics').onclick=()=>{page++;renderTopics();};
  topics.querySelectorAll('[data-series]').forEach(tab=>{
    tab.addEventListener('click',()=>{
      series=tab.dataset.series;page=0;
      topics.querySelectorAll('[data-series]').forEach(x=>x.classList.toggle('on',x===tab));
      renderTopics();
    });
  });
  byId('prepareAvatar').onclick=()=>{
    closeAll();
    if(typeof window.qsjAiAvatarScript==='function')window.qsjAiAvatarScript();
    else work.scrollIntoView({behavior:'smooth',block:'start'});
  };
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll();});
})();
