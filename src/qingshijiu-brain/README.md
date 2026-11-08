# 轻拾玖品牌 Brain + 成功者方法 Brain V0.4

这是第一版**可运行的源资料索引与检索编排**，并非全量 Google Drive 实时同步、向量库或完整个人记忆。

## 两层 Brain

- **品牌 Brain**：见 `brain-data.js / BRAND_CARDS`，以 B001… 编号，保留来源链接与来源性质。每次按题目取 1 条品牌身份卡 + 最相关的 2 条主题/场景卡。
- **成功者方法 Brain**：`SAMPLE_CARDS` 从用户上传录屏的 QSJ-M01…M25 分析索引整理为结构卡。原帖归属并未逐条确认，`origin:unattributed`；`performance:unknown` 表示未获真实咨询或成交数据。只抽象“开头—故事组织—画面—咨询动作”方法，不把他人的经历移植给经销商。
- **人物观点**：`SONG_CARDS` 来自宋星辉 2026-10-31 内部口述和补充材料；只有输入明确提及宋星辉时才进入模型，防止串号。

检索器位于 `brain.js`，从用户当次任务、原话和选定 Skill 做轻量规则检索；每次返回 `brandCardIds`、`operatorSampleIds`、`personCardIds` 用于核对。模型仍由 Cloudflare Pages Functions 里的 `qingshijiu-generate.js` 负责调用 DeepSeek。

## 质量与边界

- 品牌方负责素材与发布决定，生成器只负责营销文字；朋友圈/视频不讲审核与权限教育。
- 原材料里关于收入、疗效、合同、退款的强宣称不作为系统“既定事实”。用户输入的真实个人反馈可作为该人物的经历表达，不能自动扩展为人人都有效。
- 不给未确认的样本打“已验证爆款/已证实转化”的标签，也不复制历史原句。
- `scripts/test-qingshijiu-brain.mjs` 用 5 类输入测试样本检索差异、人物资料隔离与模型参数，不需真实 API Key。

## 更新流程

1. 优先保留原始文案、原图/视频、发布者、日期与反馈到 Google Drive 源文件。
2. 按 `id / category / tags / pattern / media / source / sourceStatus / performance` 增量整理卡片，涉及个人观点注明来源和归属。
3. 更新版本号、增加测试场景，通过 PR 合并；随后对线上正式接口做真模型测试。
4. 下一阶段再考虑经认证的品牌后台、可编辑知识卡、D1 / R2 存储和经销商私有内容隔离。不要把当前静态索引描述成实时 Drive Brain。

源资料入口：
- [品牌与事业模式](https://docs.google.com/document/d/1qRq06XahIwOOFnkcXrqlASEuiFL79TVtoe5eKaivZE8/edit)
- [产品主题卡](https://docs.google.com/document/d/1pte5TPr6G9FGCW0DMziFOfd1JwYaW7nRW4rs5h0tbYk/edit)
- [朋友圈与视频录屏索引](https://docs.google.com/document/d/1PzxuxVi6_Tn50SJcN2eL5xm9Xe4D9_vTdN0F3OKlL84/edit)
- [宋星辉口述](https://docs.google.com/document/d/12STiEhruZP5aevt9Df7v2rg_Y2SS6OmpkwLIvwJ2S6Q/edit)
