import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function dataDir() {
  return process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, '..', 'data');
}
function studentsFile() {
  return path.join(dataDir(), 'students.json');
}
function studentsDir() {
  return path.join(dataDir(), 'students');
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertValidId(id, label) {
  if (typeof id !== 'string' || !UUID_RE.test(id)) {
    const err = new Error(`Invalid ${label}`);
    err.statusCode = 400;
    throw err;
  }
}

async function ensureDataFiles() {
  await fs.mkdir(studentsDir(), { recursive: true });
  try {
    await fs.access(studentsFile());
  } catch {
    await fs.writeFile(studentsFile(), '[]', 'utf-8');
  }
}

async function readStudents() {
  await ensureDataFiles();
  const raw = await fs.readFile(studentsFile(), 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeStudents(students) {
  await fs.writeFile(studentsFile(), JSON.stringify(students, null, 2), 'utf-8');
}

async function createStudent(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    const err = new Error('Student name is required');
    err.statusCode = 400;
    throw err;
  }
  const students = await readStudents();
  const student = { id: randomUUID(), name: trimmed, createdAt: new Date().toISOString() };
  students.push(student);
  await writeStudents(students);
  return student;
}

async function getStudent(studentId) {
  assertValidId(studentId, 'studentId');
  const students = await readStudents();
  return students.find((s) => s.id === studentId) || null;
}

function homeworksDirFor(studentId) {
  assertValidId(studentId, 'studentId');
  return path.join(studentsDir(), studentId, 'homeworks');
}

function homeworkDirFor(studentId, homeworkId) {
  assertValidId(studentId, 'studentId');
  assertValidId(homeworkId, 'homeworkId');
  return path.join(studentsDir(), studentId, 'homeworks', homeworkId);
}

async function createHomework(studentId, { images, evaluation }) {
  if (!Array.isArray(images) || images.length === 0) {
    const err = new Error('En az bir görsel gerekli');
    err.statusCode = 400;
    throw err;
  }

  const student = await getStudent(studentId);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }
  const homeworkId = randomUUID();
  const dir = homeworkDirFor(studentId, homeworkId);
  await fs.mkdir(dir, { recursive: true });

  const safeImages = images.map((img, index) => {
    const safeExt = /^[a-z0-9]{2,5}$/i.test(img.ext) ? img.ext : 'jpg';
    return { index, ext: safeExt, buffer: img.buffer };
  });

  await Promise.all(
    safeImages.map((img) => fs.writeFile(path.join(dir, `image-${img.index}.${img.ext}`), img.buffer))
  );

  const record = {
    homeworkId,
    studentId,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    images: safeImages.map(({ index, ext }) => ({ index, ext })),
    ...evaluation,
  };
  await fs.writeFile(path.join(dir, 'evaluation.json'), JSON.stringify(record, null, 2), 'utf-8');
  return record;
}

function summarize(evaluation) {
  const questions = evaluation.questions || [];
  const total = questions.length;
  const correct = questions.filter((q) => q.status === 'correct').length;
  const incorrect = questions.filter((q) => q.status === 'incorrect').length;
  const partial = questions.filter((q) => q.status === 'partial').length;
  const successRate = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;
  return { total, correct, incorrect, partial, successRate };
}

async function listHomeworks(studentId) {
  const student = await getStudent(studentId);
  if (!student) {
    const err = new Error('Student not found');
    err.statusCode = 404;
    throw err;
  }
  const dir = homeworksDirFor(studentId);
  await fs.mkdir(dir, { recursive: true });
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const raw = await fs.readFile(path.join(dir, entry.name, 'evaluation.json'), 'utf-8');
      const evaluation = JSON.parse(raw);
      results.push({
        homeworkId: entry.name,
        status: evaluation.status,
        createdAt: evaluation.createdAt,
        updatedAt: evaluation.updatedAt,
        summary: summarize(evaluation),
      });
    } catch {
      // skip corrupt/missing evaluation entries
    }
  }
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return results;
}

async function getHomework(studentId, homeworkId) {
  const dir = homeworkDirFor(studentId, homeworkId);
  const raw = await fs.readFile(path.join(dir, 'evaluation.json'), 'utf-8');
  return JSON.parse(raw);
}

async function saveEvaluation(studentId, homeworkId, updatedFields) {
  const dir = homeworkDirFor(studentId, homeworkId);
  const filePath = path.join(dir, 'evaluation.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  const existing = JSON.parse(raw);
  const merged = {
    ...existing,
    ...updatedFields,
    homeworkId,
    studentId,
    images: existing.images,
    createdAt: existing.createdAt,
    status: 'final',
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(filePath, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

async function getImagePath(studentId, homeworkId, index) {
  const dir = homeworkDirFor(studentId, homeworkId);
  const evaluation = await getHomework(studentId, homeworkId);
  const numericIndex = Number(index);
  const images = evaluation.images || [];
  const entry = Number.isInteger(numericIndex)
    ? images.find((img) => img.index === numericIndex)
    : undefined;
  if (!entry) {
    const err = new Error('Görsel bulunamadı');
    err.statusCode = 404;
    throw err;
  }
  return path.join(dir, `image-${entry.index}.${entry.ext}`);
}

export {
  createStudent,
  readStudents,
  getStudent,
  createHomework,
  listHomeworks,
  getHomework,
  saveEvaluation,
  getImagePath,
  summarize,
};
