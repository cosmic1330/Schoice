---
trigger: always_on
description: when prompt have goal.md words
---

- Always respond in Traditional Chinese (繁體中文)
- All generated files (Markdown, docs, comments) must be written in 繁體中文
- memory-docs/goal.md is the main document defining the primary objectives of this requirement.
- Before writing any code, read memory-docs/tech.md, memory-docs/PRD.md, and memory-docs/architecture.md.
- When adjusting, adding, or removing records related to data structures, file purposes, or key decisions, propose the change first and update memory-docs/architecture.md and memory-docs/tech.md only after confirmation.
- When a new implementation plan is created, append it incrementally in plan.md. Make sure to clearly separate the content of each implementation plan for readability and traceability.
- Once the implementation plan is explicitly accepted, and all tasks defined in the plan are completed and verified, append the result to memory-docs/implementation_plan.md and marked as success.
- When the plan is completed and verified, append the results to memory-docs/implementation_plan.md and mark it as success. If any changes to memory-docs/tech.md, memory-docs/PRD.md, or memory-docs/architecture.md are identified, please update them accordingly.