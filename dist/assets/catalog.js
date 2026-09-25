export const catalog = {
  version: "0.1.0",
  lastUpdated: "2026-09-24",
  categories: [
    {
      id: "plan-execute",
      name: "效率与执行",
      number: "01",
      question: "想清楚什么最重要，并把事情真正往前推进。",
    },
    {
      id: "knowledge-growth",
      name: "知识沉淀",
      number: "02",
      question: "把学习、经验与灵感变成可以持续调用的能力。",
    },
    {
      id: "content-influence",
      name: "内容创作",
      number: "03",
      question: "把思想变成内容，让专业判断被更多人看见。",
    },
    {
      id: "social-media",
      name: "社交媒体",
      number: "04",
      question: "把内容带到合适的平台，持续发布与运营。",
    },
    {
      id: "marketing-product",
      name: "品牌与增长",
      number: "05",
      question: "把能力组织成清晰的产品、信任与增长路径。",
    },
    {
      id: "build-automate",
      name: "搭建与自动化",
      number: "06",
      question: "把网站、工作流与自动化真正搭起来。",
    },
  ],
  skills: [
    {
      slug: "chief-agent",
      sourceId: "chief-agent-daily-leverage",
      name: "AI 总舵手",
      eyebrow: "AI Chief Agent",
      categoryId: "plan-execute",
      type: "Core System",
      version: "V0.1",
      status: "published",
      publicRelease: {
        status: "in-review",
        artifact: null,
      },
      summary: "从一堆事儿里，找到真正值得推进的第一杠杆任务。",
      description:
        "你不用先整理，也不用想清楚该从哪里开始。把脑子里的事情都倒出来，AI 总舵手会先接住，再帮你从全局里看清今天真正值得推进的是什么：",
      problem:
        "AI 总舵手帮助你把注意力放在最有杠杆的事情上，同时让已经可以由 AI 推进的工作继续运行。",
      decisions: [
        "今天什么必须发生",
        "哪件事是真正值得推进的第一杠杆任务",
        "哪些结果值得占用你的注意力",
        "哪些可以交给 AI / Agent 继续推进",
        "哪些想法虽然很好，但今天不应该做",
      ],
      scenarios: [
        "想法很多，同时有多个项目在推进的人",
        "每天很忙，但注意力经常被各种事情切碎的人",
        "已经在使用多个 AI / Agent，却仍然需要自己盯所有工作的人",
        "希望 AI 不只是回答问题，而是真正成为一个能托住执行的团队的人",
      ],
      mechanism: [
        { title: "先清空大脑，不要求你自己整理", description: "把脑子里的待办、想法、承诺和机会全部倒出来，AI 先接住、记录和整理。" },
        { title: "分清轻重，也平衡眼前和长期", description: "同时考虑今天必须发生的事、长期目标、阶段重点和现实约束，避免每天只被急事牵着走。" },
        { title: "从全局里找到今天的第一杠杆任务", description: "找出那件做完以后，会让其他事情更容易、更清楚，甚至变得没必要的事。" },
        { title: "能交给 AI 的，就不再占用人的时间", description: "能由 Chat、Work、Codex 或其他 Agent 推进的，就直接交给 AI；只把真正需要人判断、决定或亲自行动的事情留给自己。" },
      ],
    },
  ],
};

export function getCategory(categoryId) {
  return catalog.categories.find((category) => category.id === categoryId);
}

export function getSkill(slug) {
  return catalog.skills.find((skill) => skill.slug === slug && skill.status === "published");
}

export function isPubliclyDownloadable(skill) {
  return Boolean(
    skill &&
      skill.publicRelease.status === "published" &&
      skill.publicRelease.artifact
  );
}
