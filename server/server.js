import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as storage from './storage.js';
import * as aiClient from './openaiClient.js';
import { generateHomeworkPDF } from './pdfService.js';

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
      const { name, phone } = req.body || {};
      const student = await storage.createStudent(name, phone);
      res.status(201).json(student);
    })
  );

  app.put(
    '/api/students/:studentId',
    asyncHandler(async (req, res) => {
      const { studentId } = req.params;
      const { name, phone } = req.body || {};
      const student = await storage.updateStudent(studentId, { name, phone });
      res.status(200).json(student);
    })
  );

  app.post(
    '/api/students/:studentId/archive',
    asyncHandler(async (req, res) => {
      const { studentId } = req.params;
      const student = await storage.toggleArchiveStudent(studentId);
      res.status(200).json(student);
    })
  );

  app.delete(
    '/api/students/:studentId',
    asyncHandler(async (req, res) => {
      const { studentId } = req.params;
      await storage.deleteStudent(studentId);
      res.status(200).json({ success: true });
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

  app.delete(
    '/api/evaluations/:studentId/:homeworkId',
    asyncHandler(async (req, res) => {
      const { studentId, homeworkId } = req.params;
      await storage.deleteHomework(studentId, homeworkId);
      res.status(200).json({ success: true });
    })
  );

  app.delete(
    '/api/evaluations/:studentId',
    asyncHandler(async (req, res) => {
      const { studentId } = req.params;
      await storage.clearAllHomeworks(studentId);
      res.status(200).json({ success: true });
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

  app.get(
    '/api/evaluations/:studentId/:homeworkId/pdf',
    asyncHandler(async (req, res) => {
      const { studentId, homeworkId } = req.params;
      const student = await storage.getStudent(studentId);
      if (!student) {
        const err = new Error('Student not found');
        err.statusCode = 404;
        throw err;
      }
      const homework = await storage.getHomework(studentId, homeworkId);
      if (!homework) {
        const err = new Error('Homework not found');
        err.statusCode = 404;
        throw err;
      }

      const pdfBuffer = await generateHomeworkPDF(student, homework);
      
      const trMap = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U' };
      const safeName = student.name
        .split('')
        .map(char => trMap[char] || char)
        .join('')
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="odev-degerlendirme-${safeName}.pdf"`);
      res.send(pdfBuffer);
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
