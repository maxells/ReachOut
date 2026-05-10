# GoFamous — localStorage 数据格式文档

浏览器中存在**两个独立的 localStorage 条目**。

---

## 1. `gofamous-funnel`

**写入方**：Zustand `persist` 中间件自动管理  
**包含内容**：整条 funnel 的完整状态（品牌、活动、分析报告、匹配结果、外联状态）

### 顶层结构

```jsonc
{
  "state": {
    "currentStep": 3,           // number，当前步骤 1–5
    "brand": { ... },           // BrandSlice，见下
    "campaign": { ... },        // CampaignConfig，见下
    "analysis": { ... } | null, // AnalysisReport，见下（Step 2 完成后才有值）
    "matches": [ ... ],         // MatchResult[]，见下（Step 4 完成后才有值）
    "outreach": { ... }         // OutreachState，见下
  },
  "version": 0                  // Zustand persist 内部版本号
}
```

---

### `brand`（BrandSlice）

由 Member 1（Input 模块）在 Step 1 写入。

```jsonc
{
  "name": "Acme Corp",
  "url": "https://acme.com",
  "industry": "Developer Tools",
  "targetAudience": "DevOps engineers",
  "socials": {
    "twitter": "@acme",         // string? — 可选
    "youtube": "UCxxxx",        // string? — 可选
    "linkedin": "company/acme", // string? — 可选
    "website": "https://acme.com" // string? — 可选
  },
  "hashtags": ["#devops", "#cloud"],  // string[] — 品牌相关话题标签
  "keywords": ["DevOps", "SaaS"],     // string[] — 搜索关键词（Member 2 用于 Apify 搜索）
  "brandAliases": ["Acme", "ACME"]   // string[] — 品牌别名
}
```

---

### `campaign`（CampaignConfig）

由 Member 1 在 Step 3 写入。

```jsonc
{
  "budget": 5000,
  "channels": ["linkedin", "youtube"],
  // ChannelType 可选值:
  //   "youtube" | "twitter" | "linkedin" | "newsletter" | "podcast" | "tiktok"

  "followerRange": [1000, 50000], // [min, max] — 期望的 creator 粉丝数区间

  "creatorTone": "educator"
  // CreatorTone 可选值:
  //   "authentic-critic" | "educator" | "entertainer"
  //   "thought-leader"   | "community-builder"
}
```

---

### `analysis`（AnalysisReport）

由 Member 1 调用 `/api/analyze-brand` 后写入，Step 2 完成后存在。

```jsonc
{
  "coverageScore": 42,    // number 0–100 — 本品牌曝光评分
  "industryAverage": 58,  // number 0–100 — 行业平均值
  "summary": "Acme has moderate creator coverage...", // string — AI 生成的分析摘要
  "competitors": [
    {
      "name": "CompetitorX",
      "coverageScore": 71,          // number 0–100
      "creatorTrafficShare": 18.5   // number — 估算的 creator 流量占比（%）
    }
  ],
  "socialSignals": [
    {
      "platform": "LinkedIn",
      "followers": 12000,
      "engagement": 3.2,  // number — 互动率（%）
      "trend": "up"       // "up" | "down" | "stable"
    }
  ]
}
```

---

### `matches`（MatchResult[]）

由 Member 2 调用 `/api/match-creators` 后写入，Step 4 完成后存在。  
**这是 Member 3（Outreach 模块）读取并发送外联邮件的数据源。**

```jsonc
[
  {
    "matchScore": 87,     // number 0–100 — AI 综合匹配分
    "audienceOverlap": 0, // number 0–100 — 受众重合度（预留字段，当前恒为 0）
    "reasoning": "Alice is a DevOps thought leader with 12k connections, highly relevant to cloud infrastructure campaigns.",
    // string — AI 解释为什么推荐此人

    "creator": {
      "id": "https%3A%2F%2Flinkedin.com%2Fin%2Falice-chen",
      // string — URL 编码后的 LinkedIn 主页地址，全局唯一标识

      "name": "Alice Chen",     // string — 真实姓名（来自 Apify 抓取）
      "avatar": "",             // string — 头像 URL（预留字段，当前恒为空）
      "platform": "linkedin",   // ChannelType — 所在平台

      "handle": "https://linkedin.com/in/alice-chen",
      // string — LinkedIn 主页完整 URL，用于跳转和外联

      "followers": 12000,       // number — LinkedIn connections 数量
      "engagementRate": 0,      // number — 互动率（预留字段，当前恒为 0）
      "estimatedRate": 0,       // number — 报价估算（预留字段，当前恒为 0）

      "niche": ["DevOps", "Cloud Infrastructure", "Kubernetes"],
      // string[] — AI 判断的专业领域标签

      "bio": "DevOps Thought Leader | Cloud Architecture | Keynote Speaker",
      // string — LinkedIn headline（职位标题行，来自 Apify 抓取）

      "recentTopics": []
      // string[] — 近期内容话题（预留字段，当前恒为空）
    }
  }
]
```

---

### `outreach`（OutreachState）

由 Member 3（Outreach 模块）写入。

```jsonc
{
  "totalSent": 3,     // number — 已发送总数
  "totalReplied": 1,  // number — 已回复总数
  "items": [
    {
      "status": "sent",
      // OutreachStatus 可选值:
      //   "draft" | "sent" | "opened" | "replied" | "declined"

      "sentAt": "2026-05-10T22:00:00.000Z",    // string? — ISO 8601，可选
      "repliedAt": "2026-05-10T23:00:00.000Z", // string? — ISO 8601，可选

      "pitch": {
        "id": "pitch_abc123",    // string — 唯一 ID
        "creatorId": "https%3A%2F%2Flinkedin.com%2Fin%2Falice-chen",
        // string — 对应 creator.id，用于关联 matches 中的 creator

        "creatorName": "Alice Chen",                       // string
        "subject": "Collaboration opportunity with Acme",  // string — 邮件主题
        "body": "Hi Alice, ...",                           // string — 邮件正文
        "generatedAt": "2026-05-10T21:00:00.000Z"         // string — ISO 8601
      }
    }
  ]
}
```

---

## 2. `reachout-influencer-cache`

**写入方**：`src/lib/cache.ts`（Member 2 的搜索结果客户端缓存）  
**用途**：避免相同搜索参数重复调用 Apify + AI，最多保留最近 **10 条**记录

```jsonc
[
  {
    "timestamp": 1746920400000, // number — Unix 毫秒时间戳，写入时间

    "params": {
      "industry": "Developer Tools", // string — 缓存 key：行业
      "keywords": ["DevOps", "SaaS"], // string[] — 缓存 key：关键词
      "followersMin": 1000,           // number — 缓存 key：粉丝下限
      "followersMax": 50000           // number — 缓存 key：粉丝上限
    },

    "results": [ /* MatchResult[]，结构与 gofamous-funnel.state.matches 完全相同 */ ]
  }
]
```

### 缓存命中条件

三项全部满足才算命中，返回缓存结果，跳过 Apify 和 AI 调用：

| 字段 | 命中规则 |
|---|---|
| `industry` | 大小写不敏感，完全相等 |
| `keywords` | 新请求的关键词与缓存重合度 **≥ 60%** |
| `followerRange` | 新请求的范围**包含**缓存范围（新 min ≤ 缓存 min 且 新 max ≥ 缓存 max） |

---

## 两个条目汇总

| 条目 | 写入者 | 生命周期 | 包含 Influencer 数据位置 |
|---|---|---|---|
| `gofamous-funnel` | Zustand persist 自动 | 持久，跨 session | `state.matches[]` |
| `reachout-influencer-cache` | `cache.ts` 手动管理 | 持久，最多 10 条 | `[].results[]` |

> **注意**：`reachout-influencer-cache` 的读写逻辑（`findCachedResults` / `saveToCache`）已实现，但由于 `localStorage` 在 Node.js 服务端不可用，当前 `/api/match-creators` 路由未接入缓存。如需在前端判断缓存并决定是否发起请求，可直接调用这两个函数。
