[English Version](./README_EN.md)

# Solid Snake 贪吃蛇游戏

基于 [SolidJS](https://solidjs.com/) + TypeScript + Vite 实现的经典贪吃蛇小游戏，支持响应式设计和本地最高分记录。

## 功能特色
- 方向键控制蛇移动，空格键开始/暂停，R键重置
- 实时分数与最高分统计，最高分本地存储
- 响应式美观 UI，适配移动端
- 纯前端实现，无需后端

## 操作说明
- **方向键**：控制蛇的移动方向
- **空格键**：开始/暂停游戏
- **R 键**：重新开始游戏
- 也可点击页面按钮进行操作

## 安装依赖

```bash
npm install # 或 pnpm install 或 yarn install
```

## 启动开发环境

```bash
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看效果。

## 构建生产环境

```bash
npm run build
```

构建产物在 `dist` 目录，可静态部署。

## 依赖
- solid-js
- vite
- typescript
- vite-plugin-solid

## 部署

详见 [Vite 静态部署文档](https://vite.dev/guide/static-deploy.html)
