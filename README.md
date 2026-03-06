# BetterPrompt Studio

一个适合部署到 Vercel 的提示词优化应用：

- 用户输入原始提示词
- 并行调用 4 个百炼模型返回 4 份优化候选
- 再由 1 个裁判模型评分、排序、点评
- 前端按排名展示优化结果、维度分数、优缺点和改进建议

## 产品设计

核心流程：

1. 用户输入原始提示词。
2. 服务端并行调用 `qwen3.5-plus`、`glm-5`、`kimi-k2.5`、`MiniMax-M2.5`。
3. 每个优化模型输出结构化 JSON：
   - `optimized_prompt`
   - `strategy_summary`
   - `key_upgrades`
   - `applicable_scenarios`
4. 裁判模型基于原始提示词和全部候选，输出：
   - 排名
   - 总分
   - 五个维度分数
   - 优点
   - 不足
   - 改进建议
   - 本轮总体总结

产品定位：

- 不是单纯“帮你润色一句提示词”
- 而是“把不同模型的提示词优化能力可视化比较”
- 适合 Prompt 工程、内容生产、产品设计、运营写作、研究分析等场景

## 百炼配置

应用默认使用百炼 OpenAI 兼容接口：

- `https://coding.dashscope.aliyuncs.com/v1`

支持两种配置方式：

1. 前端设置面板填写
2. Vercel 环境变量配置

推荐在 Vercel 中配置以下环境变量：

```bash
BAILIAN_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
BAILIAN_API_KEY=sk-xxxx
APP_SIGNING_SECRET=replace-with-a-long-random-secret
RATE_LIMIT_MAX=8
RATE_LIMIT_WINDOW_MS=60000
MAX_PROMPT_CHARS=4000
JUDGE_MODEL=qwen3.5-plus
OPTIMIZER_TEMPERATURE=0.7
OPTIMIZER_MAX_TOKENS=2200
JUDGE_TEMPERATURE=0.2
JUDGE_MAX_TOKENS=2400
```

如果设置面板中没有填写，服务端会自动回退到这些环境变量。

## 安全策略

当前版本已经加入公开访问所需的基础保护：

- 生产环境忽略浏览器上传的 `API Key`，只读取 Vercel 服务端环境变量
- `/api/optimize` 与 `/api/judge` 都有基于 IP 的限流
- `/api/judge` 需要 `/api/optimize` 签发的短期 `submissionProof`
- 限制用户输入提示词长度，避免单次成本失控
- 拒绝非本站来源的跨站请求

说明：

- 当前限流实现为进程内存版，适合小范围分享和第一层防护
- 如果后面访问量变大，建议把限流切到 Redis / KV
- 如果后面需要更强防刷，再叠加 Turnstile 或登录机制

## 两份核心提示词

代码中已经内置并支持在设置面板中直接编辑：

- 优化模型提示词：[`lib/prompts/optimizer.ts`](/Users/leehom/work/betterPrompt/lib/prompts/optimizer.ts)
- 裁判模型提示词：[`lib/prompts/optimizer.ts`](/Users/leehom/work/betterPrompt/lib/prompts/optimizer.ts)

## 本地开发

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 部署到 Vercel

1. 导入该项目到 Vercel
2. 配置环境变量
3. 执行默认构建命令 `npm run build`
4. 部署完成后即可直接使用

## 关键文件

- 页面与交互：[`app/page.tsx`](/Users/leehom/work/betterPrompt/app/page.tsx)
- 优化接口：[`app/api/optimize/route.ts`](/Users/leehom/work/betterPrompt/app/api/optimize/route.ts)
- 裁判接口：[`app/api/judge/route.ts`](/Users/leehom/work/betterPrompt/app/api/judge/route.ts)
- 百炼配置合并：[`lib/server/bailian.ts`](/Users/leehom/work/betterPrompt/lib/server/bailian.ts)
- 类型定义：[`types/index.ts`](/Users/leehom/work/betterPrompt/types/index.ts)
