/* QSJ Magic UI V2.5. Presentation only: no API, task or account changes. */
(() => {
  'use strict';
  const hero=document.querySelector('#dealer .hero');
  const work=document.getElementById('work');
  if(!hero||!work||document.querySelector('.hero-magic')) return;
  const headline=hero.querySelector('.hi p');
  if(headline)headline.innerHTML='你负责生活里的故事。<br>AI 帮你写好朋友圈和视频。';
  const promise=hero.querySelector('.promise');
  if(promise)promise.textContent='✦ 说一句话 · AI帮你出内容';
  const kicker=hero.querySelector('.mini');
  if(kicker)kicker.textContent='QING SHI JIU · AI CONTENT STUDIO';
  hero.insertAdjacentHTML('beforeend',
    '<div class="hero-magic" aria-hidden="true"><div class="orbit"><b></b></div><div class="core"><i>AI</i></div></div>'+
    '<div class="magic-float one" aria-hidden="true"><b>✦</b>朋友圈 · 已生成</div>'+
    '<div class="magic-float two" aria-hidden="true"><b>▷</b>视频口播</div>'+
    '<div class="magic-float three" aria-hidden="true"><b>◇</b>画面灵感</div>');
  work.insertAdjacentHTML('afterbegin',
    '<div class="work-strap" aria-hidden="true"><span>✧ AI MAGIC STUDIO</span><span class="online">DEEPSEEK LIVE</span></div>');
  const hint=work.querySelector('.hint');
  if(hint) hint.insertAdjacentHTML('afterend',
    '<div class="magic-pipeline" aria-label="一段素材可以变成朋友圈、视频口播与配图建议">'+
    '<span><i>✦</i> 朋友圈</span><span class="chevron">›</span>'+
    '<span><i>▷</i> 视频口播</span><span class="chevron">›</span>'+
    '<span><i>◈</i> 配图建议</span></div>');
  const gallery=document.createElement('section');
  gallery.className='factory-gallery';
  gallery.setAttribute('aria-label','内容工厂输出形式');
  gallery.innerHTML=
    '<div class="gallery-title"><strong>你的 AI 内容工作台</strong><small>ONE IDEA · MULTIPLE FORMATS</small></div>'+
    '<div class="gallery-grid">'+
      '<article class="gallery-card"><div class="gallery-art social"><span class="gallery-tag">SOCIAL</span>'+
      '<img class="gallery-avatar" data-hero-thumb alt="人物图与朋友圈排版示意">'+
      '<div class="gallery-paper" aria-hidden="true"><i></i><i></i><i></i></div></div>'+
      '<div class="gallery-caption"><strong>朋友圈</strong><small>故事变成好文案</small></div></article>'+
      '<article class="gallery-card"><div class="gallery-art video"><span class="gallery-tag">VIDEO</span>'+
      '<div class="gallery-viewfinder" aria-hidden="true"><span class="play">▶</span>'+
      '<span class="gallery-wave"><i></i><i></i><i></i><i></i><i></i><i></i></span></div></div>'+
      '<div class="gallery-caption"><strong>短视频</strong><small>开口就能录</small></div></article>'+
      '<article class="gallery-card"><div class="gallery-art brain"><span class="gallery-tag">AI MAGIC</span>'+
      '<div class="gallery-brain-ring" aria-hidden="true"><b>✦</b></div></div>'+
      '<div class="gallery-caption"><strong>搭配画面</strong><small>知道该配什么图</small></div></article>'+
    '</div><div class="gallery-footnote">创作形式示意 · 图片由经销商自行从手机或品牌素材中搭配</div>';
  work.insertAdjacentElement('afterend',gallery);
  const brandImage=hero.querySelector('img');
  const avatar=gallery.querySelector('[data-hero-thumb]');
  if(brandImage?.src && avatar) avatar.src=brandImage.src;
  if(avatar&&!avatar.src)avatar.remove();
})();
