# Scripts Documentation

此目录包含用于数据库维护、数据完整性检查和数据修复的实用脚本。

## 1. 数据检查与调试脚本

### `check-data-integrity.ts`
*   **作用**: 检查数据库中 `Product` (产品) 和 `Brand` (品牌) 表的数据完整性。
*   **具体逻辑**: 遍历所有产品和品牌，验证其多语言字段（如产品的 `title`, `flavor` 和品牌的 `name`）是否为合法的 JSON 对象，且对象内的值是否为字符串。如果发现数据结构不符合预期（例如不是对象或值不是字符串），会打印错误日志。

### `check-db-content.ts`
*   **作用**: 快速查看数据库中的部分原始内容，用于人工核对。
*   **具体逻辑**: 使用 `pg` 连接池和 Prisma 适配器连接数据库，打印前 5 个品牌（Brand）和前 5 个产品（Product）的详细信息（ID、标题、分类、品牌ID）。

### `check-products.js`
*   **作用**: 检查产品表的基本统计信息和字段类型（JavaScript 版本）。
*   **具体逻辑**: 统计产品总数，并列出前 5 个产品的 ID、标题（及其数据类型）、状态和分类。主要用于确认 `title` 字段是字符串还是对象。

### `debug-products.ts`
*   **作用**: 调试产品数据的 TypeScript 脚本。
*   **具体逻辑**: 统计产品总数和处于 `active`（上架）状态的产品数量，并打印 3 个样本产品的完整 JSON 数据。

## 2. 数据修复脚本

### `fix-brand-names.ts`
*   **作用**: 修复品牌名称字段中出现的嵌套 JSON 结构错误。
*   **具体逻辑**: 查找 `Brand` 表中 `name` 字段被错误存储为双重嵌套结构（如 `{ en: { en: "...", zh: "..." } }`）的记录，并将其修正为扁平结构（`{ en: "...", zh: "..." }`）。

### `fix-json-fields.js`
*   **作用**: 批量修复数据库中本应为 JSON 格式但存储为纯字符串的字段（JavaScript 版本）。
*   **具体逻辑**: 使用原生 SQL (`UPDATE ... SET ...`) 扫描 `products`、`brands` 和 `order_items` 表。如果发现指定字段（如 `title`, `description`, `flavor` 等）的内容不是以 `{` 开头（即不是 JSON），则将其包装为默认的英文 JSON 对象（例如将 `"My Product"` 转换为 `{"en": "My Product"}`）。

### `fix-json-fields.ts`
*   **作用**: `fix-json-fields.js` 的 TypeScript 版本。
*   **具体逻辑**: 功能与 JS 版本完全一致，用于将纯字符串数据迁移/修复为多语言 JSON 格式。

## 使用方法

可以使用 `ts-node` 或 `node` 运行这些脚本。例如：

```bash
# 运行 TypeScript 脚本
npx ts-node scripts/check-data-integrity.ts

# 运行 JavaScript 脚本
node scripts/check-products.js
```
