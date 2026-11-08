// 轻拾玖双 Brain V0.4 — 可版本化、带原始资料出处的编辑索引。
// 素材条目是视频录屏的编辑摘要，不是已核实的业绩或完整原文；不得当作个别经销商本人经历。
export const BRAIN_VERSION = 'QSJ-BRAIN-0.4';
export const SOURCE = Object.freeze({
  brand:'https://docs.google.com/document/d/1qRq06XahIwOOFnkcXrqlASEuiFL79TVtoe5eKaivZE8/edit',
  product:'https://docs.google.com/document/d/1pte5TPr6G9FGCW0DMziFOfd1JwYaW7nRW4rs5h0tbYk/edit',
  song:'https://docs.google.com/document/d/12STiEhruZP5aevt9Df7v2rg_Y2SS6OmpkwLIvwJ2S6Q/edit',
  songExtra:'https://docs.google.com/document/d/192smbG7nJcmkRzHYJ9Uzlr6Nqag9rZib/edit',
  samples:'https://docs.google.com/document/d/1PzxuxVi6_Tn50SJcN2eL5xm9Xe4D9_vTdN0F3OKlL84/edit'
});
export const BRAND_CARDS = [
  {id:'B001',type:'identity',tags:['品牌','轻拾玖','总部','公司'],fact:'品牌名称轻拾玖；相关产品线爱米乐 AIMILE。居家美护、轻科美、AI高科美是品牌自身的传播定位词。',source:SOURCE.brand,evidence:'marketing_description'},
  {id:'B002',type:'business',tags:['事业','创业','合作','经营','平台','轻创业','招商','收款'],fact:'轻拾玖的经营理念是“平台做重，个人做轻”：总部侧重产品供应、品牌运营和培训资源，个人关注客户交流、服务和分享。这是合作方向的概括，不是所有责任的合同承诺。',source:SOURCE.brand,evidence:'marketing_description'},
  {id:'B003',type:'purpose',tags:['女性','成长','事业','生活','创业','轻拾玖','团队'],fact:'品牌传播主题围绕女性对美好生活、个人成长、认识同频伙伴和探索个人事业的愿望；适合把生活、学习、经营现场交替分享。',source:SOURCE.brand,evidence:'marketing_description'},
  {id:'B004',type:'product-topics',tags:['产品','爱米乐','眼周','富贵包','面部','额头','脸','苹果肌','法令纹','颈部','变美','客户变化'],fact:'常见美容话题按眼周、额头、苹果肌、面部轮廓、颈部等顾客自己关心的部位切入；这是话题分类，不等于每一项都有已验证治疗效果。',source:SOURCE.product,evidence:'source_index'},
  {id:'B005',type:'experience',tags:['体验','客户','护理','服务','咨询','分享','见客户'],fact:'内容适合围绕客户亲口描述的困扰、实际体验过程、真实个人感受和经销商当次服务经历；从一个细节切入，自然邀请了解服务或体验。',source:SOURCE.product,evidence:'editorial_method'},
  {id:'B006',type:'community',tags:['总部','团队','培训','大会','学习','会议','成长','事业'],fact:'团队培训、品牌活动、伙伴交流、线下见面和生活场景，是经销商真实在做的事；以一个现场细节和真实收获建立信任，而不是只喊品牌口号。',source:SOURCE.brand,evidence:'source_index'},
  {id:'B007',type:'conversion',tags:['体验','咨询','事业','合作','客户','私信','产品'],fact:'优先“场景或问题→本人真感受→自然邀约交流”；没有用户输入的优惠、活动细则、退款政策和收益数字，不添加。',source:SOURCE.brand,evidence:'editorial_method'}
];
export const SONG_CARDS = [
  {id:'SX01',type:'decision',tags:['宋星辉','创业','转型','辛苦','经营','人物','故事'],thought:'宋星辉在口述中反思过去过度依赖本人时间、工作投入很大，开始寻找能够借助平台资源的经营方式。可写“为什么选择改变经营方式”的人物故事，事实归属宋星辉，不转移给其他经销商。',source:SOURCE.song,evidence:'personal_account'},
  {id:'SX02',type:'framework',tags:['宋星辉','平台','个人','事业','合作','轻创业','供应','培训'],thought:'她使用“平台做重，个人做轻”描述经营结构：让个人更专注客户关系、分享和服务，而不是事事自己扛；这是一项商业判断，合作责任以实际条款为准。',source:SOURCE.song,evidence:'personal_account'},
  {id:'SX03',type:'role',tags:['宋星辉','事业','伙伴','团队','经营','身份'],thought:'她强调伙伴不只是销售员，也可以借助供应、品牌资源逐步训练客户服务、沟通、组织等经营能力。适合以“一个人如何经营自己的事业”作人物观点，不宣称人人得到固定收入。',source:SOURCE.song,evidence:'personal_account'},
  {id:'SX04',type:'life',tags:['宋星辉','生活','沙龙','冰箱','梳妆台','消费','客户'],thought:'她用“沙龙经济、冰箱经济、梳妆台经济”等说法，讨论把日常生活需求、线下分享和客户关系联系起来的经营场景；这是概念，不直接充当产品功效证据。',source:SOURCE.song,evidence:'personal_account'},
  {id:'SX05',type:'tool',tags:['宋星辉','AI','内容','个人','经营','未来'],thought:'她认为 AI 可以帮助伙伴整理知识、沟通与陪伴团队，把已经积累的个人能力转成别人能使用的工作方法。可用于品牌介绍或她自己的观点故事。',source:SOURCE.song,evidence:'personal_account'},
  {id:'SX06',type:'story-arc',tags:['宋星辉','转型','初心','困难','故事'],thought:'二次编辑的《我淋过雨，所以想给你撑把伞》有“从高压工作→看到不同选择→获得支持→希望帮助同行”的情绪主线。借鉴叙事节奏而不是照搬收入、豪华生活、具体对话或他人数据。',source:SOURCE.songExtra,evidence:'edited_draft'}
];
// 录屏索引：25条。origin=unattributed：截图发布人尚未逐条核实；performance=unknown：没有成交证据。
// 只开放“叙事结构与视觉编排”，不把原帖中的收益、治疗或技术宣传照搬给经销商。
const SAMPLE_ROWS = [
  ['M01','beauty','提问式产品解惑','常见使用疑问→简短解释→真人操作或产品画面','产品,问题,客户,原理,咨询','F06','产品近景与实用场景'],
  ['M02','business','日常发布节奏','真实经营现场、人物活动、品牌素材交替出现，不要每天重复广告','事业,团队,经营,日常','F04','不同现场短视频'],
  ['M03','business','舞台对谈背书','真实人物对谈或现场→一个让本人印象深刻的信息→自己的思考','培训,舞台,大会,团队','F10','活动现场和人物'],
  ['M04','business','会议体验现场','真实交流/会议细节→今天一次收获→自然邀请','培训,会议,体验,客户','F04','会议桌与操作现场'],
  ['M05','business','生活平台类比','熟悉的日常服务便利→如何理解平台协作→具体经营场景','平台,模式,事业,方便,经营','F03','生活类比与操作实拍'],
  ['M06','beauty','阶段变化记录','真实阶段或日期→当事人的真实自述→搭配用户已有对比图','对比,照片,变化,眼周,富贵包,颈部,日期','F09','用户已有同组阶段照片'],
  ['M07','growth','家庭小事引出感悟','家庭里的一件小事→个人观点→自然收尾；不能套用他人家庭经历','家庭,生活,成长,孩子','F05','家庭日常（如确实有素材）'],
  ['M08','life','人物生活混排','团队、旅途、家庭、个人形象轮换，长期让朋友知道你的真实生活','生活,旅行,成长,照片','F05','生活与团队照片'],
  ['M09','beauty','生活镜头＋对比','先让人物出场→再用已存在的变化图片讲述她自己的感受','客户,生活,对比,照片,变化,脸','F09','人物与日期图片'],
  ['M10','beauty','单部位聚焦','一个顾客在意的局部问题→真实体验场景→短交流','眼周,眼睛,局部,客户,护理','F01','部位近景与现场画面'],
  ['M11','beauty','对比式开头结构','用真实顾客关心的问题构造反差，再讲本次所知事实；不复制原帖安全优劣比较','客户,美,比较,美容','F11','现有产品或活动实拍'],
  ['M12','business','品牌活动现场','真实活动现场→自己为什么参加→认识的伙伴或学到的事','总部,团队,大会,品牌','F10','大会现场照片'],
  ['M13','business','线下大会归属感','用本人真实参与的大会、合影和学习过程表达伙伴关系','大会,学习,团队,事业','F10','现场合影、舞台'],
  ['M14','product','空瓶使用日记','一个用完的真实产品→自己坚持使用的习惯和感受→跟朋友聊','空瓶,用完,产品,护肤,爱米乐','F07','实际空瓶与产品照片'],
  ['M15','business','个人经营行动记录','本人真实经营/服务/收款场景→讲努力的过程→邀请了解；他人收入不外借','收款,经营,创业,事业,业绩','F08','本人已有经营现场'],
  ['M16','life','多主题账号节奏','事业与生活穿插，控制连续发同一个主题的重复感','生活,成长,事业,日常','F05','多主题生活照片'],
  ['M17','beauty','体验现场讲解','真人体验场景→围绕一个具体部位说当次关切→讲本人真实体验','体验,客户,眼周,脸,护理','F01','已有体验短片/近景'],
  ['M18','life','生活伙伴关系','团建、旅行或真实日常→今天最喜欢的一个瞬间→不必硬卖产品','旅行,团队,生活,成长','F05','真实生活轮播'],
  ['M19','beauty','带日期的变化图','前后日期图→人物原话或真实感受→简单互动；不替图片捏造原因','对比,富贵包,颈部,额头,照片,日期','F09','同一人的阶段图片'],
  ['M20','product','使用顾虑的反差','从“你为什么犹豫”一个真实顾虑切入→分享自己使用或了解的过程','产品,价格,手部,体验','F11','用户自己的产品与手部照片'],
  ['M21','beauty','多阶段视觉时间线','有真实多个时间点时，按顺序讲一个人的变化经历；不串不同人的图','客户,对比,变化,面部,脸,眼周,照片','F09','已有同一个人多个日期的图片'],
  ['M22','business','培训现场与学习','今天真的去学了什么→现场一个细节→愿意交流的人可以聊','培训,团队,学习,成长,事业','F10','现场照片或视频'],
  ['M23','growth','小事件承接大愿望','一场真实学习/活动→自己的一个新想法→女性成长或事业愿望','成长,学习,活动,女性,生活','F05','学习/舞台真实场景'],
  ['M24','business','女性经营反差','一个做事方式的真实对照→为什么愿意尝试平台协作→自然互动','事业,女性,经营,平台,伙伴','F03','自己真实经营日常'],
  ['M25','growth','生活与事业主题轮换','发展、生活、工作和客户片段交错展示，不把一条变成所有故事','成长,生活,经营,日常','F05','相应当次照片']
];
export const SAMPLE_CARDS = SAMPLE_ROWS.map(([short,category,title,pattern,tags,skillId,media])=>Object.freeze({
  id:'QSJ-'+short,category,title,pattern,tags:tags.split(','),skillId,media,source:SOURCE.samples,
  sourceStatus:'screen_recording_index',origin:'unattributed',performance:'unknown'
}));
