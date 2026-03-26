import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { callDeepseekChat, ChatError, CHAT_ERROR_CODES } from './deepseekChat.js';

const PORT = Number(process.env.PORT) || 3000;
/** 日志里展示的主机名，局域网访问时可设为电脑 IP */
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'localhost';

/** 允许的前端来源；可用环境变量 CLIENT_ORIGIN 覆盖（逗号分隔多个） */
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim())
  : defaultOrigins;

const allowAllOrigins = process.env.CORS_ALLOW_ALL === '1';

const app = express();

app.use(
  cors(
    allowAllOrigins
      ? { origin: true, credentials: true }
      : {
          origin(origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error(`CORS: origin not allowed: ${origin}`));
          },
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
        },
  ),
);

app.use(express.json({ limit: '256kb' }));

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    name: 'ai-haigui-game-server',
    message: 'AI 海龟汤 API 服务',
    version: '1.0.0',
    host: PUBLIC_HOST,
    port: PORT,
    endpoints: {
      'GET /': '服务信息（本页）',
      'GET /api/test': '连通性测试',
      'POST /api/chat': 'AI 对话（body: question, story）',
    },
  });
});

app.get('/api/test', (_req, res) => {
  res.json({
    ok: true,
    message: 'API 运行正常',
    time: new Date().toISOString(),
  });
});

/**
 * POST /api/chat
 * body: { question: string, story: { surface, bottom, id?, title?, difficulty? } }
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { question, story } = req.body ?? {};

    if (typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        ok: false,
        error: '参数 question 必填，且为非空字符串',
        code: 'VALIDATION',
      });
    }

    if (story == null || typeof story !== 'object' || Array.isArray(story)) {
      return res.status(400).json({
        ok: false,
        error: '参数 story 必填，且为对象',
        code: 'VALIDATION',
      });
    }

    if (typeof story.surface !== 'string' || !story.surface.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'story.surface 必填且为非空字符串（汤面）',
        code: 'VALIDATION',
      });
    }

    if (typeof story.bottom !== 'string' || !story.bottom.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'story.bottom 必填且为非空字符串（汤底）',
        code: 'VALIDATION',
      });
    }

    const answer = await callDeepseekChat(question.trim(), {
      surface: story.surface.trim(),
      bottom: story.bottom.trim(),
      id: story.id,
      title: story.title,
      difficulty: story.difficulty,
    });

    return res.json({ ok: true, answer });
  } catch (e) {
    if (e instanceof ChatError) {
      if (e.code === CHAT_ERROR_CODES.INVALID_REPLY) {
        return res.status(422).json({
          ok: false,
          error: e.message,
          code: e.code,
        });
      }
      if (e.code === CHAT_ERROR_CODES.CONFIG) {
        return res.status(503).json({
          ok: false,
          error: e.message,
          code: e.code,
        });
      }
      if (
        e.code === CHAT_ERROR_CODES.UPSTREAM ||
        e.code === CHAT_ERROR_CODES.NETWORK
      ) {
        return res.status(502).json({
          ok: false,
          error: e.message,
          code: e.code,
        });
      }
    }

    console.error('[POST /api/chat]', e);
    return res.status(500).json({
      ok: false,
      error: '服务器内部错误',
      code: 'INTERNAL',
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://${PUBLIC_HOST}:${PORT}`);
  console.log('GET  /           -> 服务信息');
  console.log('GET  /api/test   -> 测试');
  console.log('POST /api/chat   -> AI 对话');
});
