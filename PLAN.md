# ReachOut Influencer -- 3 人并行开发架构

## 概述

将应用拆分为 3 个独立模块（Input / Scraping / Outreach），每人负责一个模块，通过共享类型定义和 Zustand store 契约来解耦，最大限度避免合并冲突。

## 技术栈

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4** + **shadcn/ui**
- **Zustand** -- 全局状态管理
- **Vercel AI SDK** (`ai` package) + **OpenAI**
- **存储**: JSON 文件 (mock data) + localStorage (用户进度)

## 核心设计原则

1. **文件隔离** -- 每人只在自己的文件夹内工作，几乎不碰其他人的文件
2. **契约先行** -- 共享的 `types.ts` 和 `store.ts` 在基础框架中定义好，作为 3 个模块之间的 API 契约
3. **页面独占** -- 每个 funnel step 页面只由一个人负责，不会有两个人改同一个文件

## 三人分工

### Member 1 -- Input（品牌信息录入 + Campaign 配置）

负责用户侧所有的数据采集界面：

| 文件路径 | 说明 |
|---|---|
| `src/app/funnel/step1-onboarding/page.tsx` | 品牌信息表单（URL、名称、社交账号、行业） |
| `src/app/funnel/step2-analysis/page.tsx` | 展示 AI 市场分析报告（调用 Member 2 的 API） |
| `src/app/funnel/step3-campaign/page.tsx` | Campaign 参数设置（预算、渠道、粉丝范围、Creator 调性） |
| `src/components/input/` | 该模块专属组件（brand-form, industry-select, budget-slider 等） |
| `src/app/api/analyze-brand/route.ts` | 品牌分析 API（接收品牌 URL，用 AI 生成分析报告） |

### Member 2 -- Scraping（Creator 数据 + 匹配）

负责 Creator 数据管理和 AI 匹配逻辑：

| 文件路径 | 说明 |
|---|---|
| `src/app/funnel/step4-matching/page.tsx` | Creator 匹配结果展示页 |
| `src/components/scraping/` | 该模块专属组件（creator-card, creator-list, match-score, filter-panel 等） |
| `src/app/api/match-creators/route.ts` | 匹配 API（查询 creator 数据 + AI 评分 + Why 解释） |
| `src/lib/creators.ts` | Creator 数据查询/过滤工具函数 |
| `src/data/creators.json` | Mock creator 数据 |
| `src/data/industries.json` | 行业分类数据 |
| `src/data/benchmarks.json` | 竞品基准数据 |

### Member 3 -- Outreach（自动化外联）

负责 AI Pitch 生成和外联管理：

| 文件路径 | 说明 |
|---|---|
| `src/app/funnel/step5-outreach/page.tsx` | 外联管理页（Pitch 预览、发送状态、跟进） |
| `src/components/outreach/` | 该模块专属组件（pitch-editor, pitch-preview, outreach-status, follow-up-timeline 等） |
| `src/app/api/generate-pitch/route.ts` | Pitch 生成 API（AI 根据 creator + brand 生成个性化消息） |
| `src/app/api/send-outreach/route.ts` | 发送外联 API（模拟发送，记录状态） |
| `src/lib/outreach.ts` | 外联相关工具函数 |

## 项目文件结构（按所有权标注）

```
src/
├── app/
│   ├── layout.tsx                          # [Shared - 基础框架预建]
│   ├── page.tsx                            # [Shared - Landing page]
│   ├── globals.css                         # [Shared - 基础框架预建]
│   ├── funnel/
│   │   ├── layout.tsx                      # [Shared - 基础框架预建]
│   │   ├── page.tsx                        # [Shared - 重定向]
│   │   ├── step1-onboarding/page.tsx       # [Member 1]
│   │   ├── step2-analysis/page.tsx         # [Member 1]
│   │   ├── step3-campaign/page.tsx         # [Member 1]
│   │   ├── step4-matching/page.tsx         # [Member 2]
│   │   └── step5-outreach/page.tsx         # [Member 3]
│   └── api/
│       ├── analyze-brand/route.ts          # [Member 1]
│       ├── match-creators/route.ts         # [Member 2]
│       ├── generate-pitch/route.ts         # [Member 3]
│       └── send-outreach/route.ts          # [Member 3]
├── components/
│   ├── ui/                                 # [Shared - shadcn 组件，只增不改]
│   ├── funnel/                             # [Shared - 基础框架预建]
│   │   ├── progress-bar.tsx
│   │   ├── step-nav.tsx
│   │   └── step-layout.tsx
│   ├── input/                              # [Member 1 独占]
│   ├── scraping/                           # [Member 2 独占]
│   └── outreach/                           # [Member 3 独占]
├── lib/
│   ├── types.ts                            # [Shared - 基础框架预定义，极少修改]
│   ├── store.ts                            # [Shared - 基础框架预定义，极少修改]
│   ├── constants.ts                        # [Shared - 只增不改]
│   ├── utils.ts                            # [Shared - 只增不改]
│   ├── creators.ts                         # [Member 2 独占]
│   └── outreach.ts                         # [Member 3 独占]
└── data/
    ├── creators.json                       # [Member 2 独占]
    ├── industries.json                     # [Member 2 独占]
    └── benchmarks.json                     # [Member 2 独占]
```

## 模块间通信契约（Zustand Store）

三个模块通过 Zustand store 的 slice 进行数据传递。每个 slice 由对应成员"写入"，其他成员"只读"：

```typescript
interface FunnelStore {
  currentStep: number;
  setStep: (step: number) => void;

  // === Member 1 写入，Member 2 读取 ===
  brand: BrandInfo;
  setBrand: (brand: Partial<BrandInfo>) => void;
  campaign: CampaignConfig;
  setCampaign: (campaign: Partial<CampaignConfig>) => void;

  // === Member 2 写入，Member 1 读取(step2), Member 3 读取 ===
  analysis: AnalysisReport | null;
  setAnalysis: (report: AnalysisReport) => void;
  matches: MatchResult[];
  setMatches: (matches: MatchResult[]) => void;

  // === Member 3 写入，无人读取 ===
  outreach: OutreachState;
  setOutreach: (outreach: Partial<OutreachState>) => void;
}
```

## 避免冲突的规则

1. **绝不跨模块改文件** -- 每人只改自己文件夹内的文件
2. **共享文件只增不改** -- `constants.ts`, `utils.ts` 只追加新函数/常量，不修改已有的
3. **types.ts 冻结** -- 基础框架中定义好所有类型，开发中如需新增类型，在自己模块内定义 local types
4. **shadcn/ui 组件按需添加** -- 通过 `npx shadcn@latest add xxx` 添加，不手动改 `ui/` 目录
5. **各自独立分支** -- 建议 `feat/input`, `feat/scraping`, `feat/outreach` 三个分支，定期 rebase main

## 基础框架（搭建后推送到 main）

搭建完成后推送到 main，三人各自拉取并开始开发：

- [ ] 初始化 Next.js 15 + TypeScript + Tailwind + 安装依赖 (zustand, ai, openai) + 更新 .gitignore
- [ ] 配置 shadcn/ui 并安装常用组件
- [ ] 创建 types.ts + store.ts + constants.ts（三人契约）
- [ ] 创建 funnel layout + 进度条 + 导航组件
- [ ] 创建 5 个 step 占位页面
- [ ] 创建 3 个模块的组件目录占位
- [ ] 创建 4 个 API route 占位
- [ ] 生成 mock 数据 JSON 文件
- [ ] 创建 README.md + .env.local.example
