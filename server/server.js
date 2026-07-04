import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as storage from './storage.js';
import * as aiClient from './openaiClient.js';

const __filename = fileURLToPath(import.meta.url);

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const ALLOWED_MIME_TYPES = new Set(Object.keys(MIME_TO_EXT));

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function mimeToExt(mimetype) {
  return MIME_TO_EXT[mimetype] || 'jpg';
}

function createApp(overrides = {}) {
  const generateEvaluation = overrides.generateEvaluation ?? aiClient.generateEvaluation;

  const app = express();

  app.use(cors());
  app.use(express.json());

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        const err = new Error('Sadece JPEG, PNG veya WEBP formatında görseller kabul edilir.');
        err.statusCode = 400;
        cb(err);
        return;
      }
      cb(null, true);
    },
  });

  app.post(
    '/api/students',
    asyncHandler(async (req, res) => {
      const { name } = req.body || {};
      const student = await storage.createStudent(name);
      res.status(201).json(student);
    })
  );

  app.get(
    '/api/students',
    asyncHandler(async (req, res) => {
      const students = await storage.readStudents();
      res.status(200).json(students);
    })
  );

  app.post(
    '/api/evaluate',
    upload.array('images', 10),
    asyncHandler(async (req, res) => {
      if (!req.files || req.files.length === 0) {
        const err = new Error('En az bir görsel gerekli');
        err.statusCode = 400;
        throw err;
      }
      const { studentId, model, apiKey } = req.body || {};
      if (!studentId) {
        const err = new Error('studentId gerekli');
        err.statusCode = 400;
        throw err;
      }

      const result = await generateEvaluation({
        imageBuffers: req.files.map((f) => f.buffer),
        model,
        apiKey,
      });

      const questions = (result.questions || []).map((q) => ({
        ...q,
        score: null,
        teacherNote: '',
      }));

      const images = req.files.map((file) => ({ buffer: file.buffer, ext: mimeToExt(file.mimetype) }));

      const record = await storage.createHomework(studentId, {
        images,
        evaluation: {
          questions,
          model: result.model,
          teacherComment: '',
        },
      });

      res.status(201).json(record);
    })
  );

  app.get(
    '/api/evaluations/:studentId',
    asyncHandler(async (req, res) => {
      const homeworks = await storage.listHomeworks(req.params.studentId);
      res.status(200).json(homeworks);
    })
  );

  app.get(
    '/api/evaluations/:studentId/:homeworkId',
    asyncHandler(async (req, res) => {
      const { studentId, homeworkId } = req.params;
      let record;
      try {
        record = await storage.getHomework(studentId, homeworkId);
      } catch (cause) {
        if (cause.code === 'ENOENT') {
          const err = new Error('Değerlendirme bulunamadı');
          err.statusCode = 404;
          throw err;
        }
        throw cause;
      }
      res.status(200).json(record);
    })
  );

  app.post(
    '/api/evaluations/:studentId/:homeworkId/save',
    asyncHandler(async (req, res) => {
      const { studentId, homeworkId } = req.params;
      const { questions, teacherComment } = req.body || {};
      let record;
      try {
        record = await storage.saveEvaluation(studentId, homeworkId, { questions, teacherComment });
      } catch (cause) {
        if (cause.code === 'ENOENT') {
          const err = new Error('Değerlendirme bulunamadı');
          err.statusCode = 404;
          throw err;
        }
        throw cause;
      }
      res.status(200).json(record);
    })
  );

  app.get(
    '/api/images/:studentId/:homeworkId/:index',
    asyncHandler(async (req, res) => {
      const { studentId, homeworkId } = req.params;
      const index = Number(req.params.index);
      let imagePath;
      try {
        imagePath = await storage.getImagePath(studentId, homeworkId, index);
      } catch (cause) {
        if (cause.code === 'ENOENT') {
          const err = new Error('Görsel bulunamadı');
          err.statusCode = 404;
          throw err;
        }
        throw cause;
      }
      res.sendFile(path.resolve(imagePath));
    })
  );

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    if (err instanceof multer.MulterError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(err.statusCode || 500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}

if (process.argv[1] === __filename) {
  const app = createApp();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export { createApp };
