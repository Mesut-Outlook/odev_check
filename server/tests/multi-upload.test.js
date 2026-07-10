import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server.js';

const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

function makeFakeEvaluation(receivedCalls = []) {
  return async ({ imageBuffers }) => {
    receivedCalls.push(imageBuffers.length);
    return {
      questions: [
        {
          questionNumber: 1,
          questionText: '3x = 9',
          studentSolutionText: 'x = 3',
          correctSolutionSteps: ['x = 3'],
          correctAnswer: 'x = 3',
          studentAnswer: 'x = 3',
          status: 'correct',
          aiExplanation: 'Doğru.',
        },
      ],
      model: 'mock-model',
    };
  };
}

async function setupApp(t, receivedCalls) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'math-hw-multi-test-'));
  process.env.DATA_DIR = tmpDir;
  const app = createApp({ generateEvaluation: makeFakeEvaluation(receivedCalls) });
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;
  t.after(async () => {
    server.close();
    delete process.env.DATA_DIR;
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  const studentRes = await fetch(`${base}/api/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Çoklu Test Öğrenci' }),
  });
  const student = await studentRes.json();
  return { base, studentId: student.id };
}

function buildForm(studentId, fileCount, { type = 'image/jpeg', bytes = JPEG_BYTES } = {}) {
  const formData = new FormData();
  formData.append('studentId', studentId);
  for (let i = 0; i < fileCount; i += 1) {
    formData.append('images', new Blob([bytes], { type }), `page${i + 1}.jpg`);
  }
  return formData;
}

test('10 görsel (üst sınır) kabul edilir ve hepsi AI çağrısına iletilir', async (t) => {
  const receivedCalls = [];
  const { base, studentId } = await setupApp(t, receivedCalls);

  const res = await fetch(`${base}/api/evaluate`, {
    method: 'POST',
    body: buildForm(studentId, 10),
  });
  assert.equal(res.status, 201);
  const homework = await res.json();
  assert.equal(homework.images.length, 10);
  assert.deepEqual(receivedCalls, [10]);

  // her görsel index'i üzerinden tekil olarak servis edilebilmeli
  for (let i = 0; i < 10; i += 1) {
    const imgRes = await fetch(`${base}/api/images/${studentId}/${homework.homeworkId}/${i}`);
    assert.equal(imgRes.status, 200, `görsel ${i} servis edilemedi`);
  }
  const missingRes = await fetch(`${base}/api/images/${studentId}/${homework.homeworkId}/10`);
  assert.equal(missingRes.status, 404);
});

test('10 görselden fazlası 400 ile reddedilir', async (t) => {
  const receivedCalls = [];
  const { base, studentId } = await setupApp(t, receivedCalls);

  const res = await fetch(`${base}/api/evaluate`, {
    method: 'POST',
    body: buildForm(studentId, 11),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.error);
  assert.deepEqual(receivedCalls, [], 'AI çağrısı yapılmamalıydı');
});

test('desteklenmeyen dosya türü 400 ile reddedilir', async (t) => {
  const receivedCalls = [];
  const { base, studentId } = await setupApp(t, receivedCalls);

  const res = await fetch(`${base}/api/evaluate`, {
    method: 'POST',
    body: buildForm(studentId, 1, { type: 'application/pdf' }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.error, /JPEG, PNG veya WEBP/);
  assert.deepEqual(receivedCalls, []);
});

test('10MB üzeri dosya 400 ile reddedilir', async (t) => {
  const receivedCalls = [];
  const { base, studentId } = await setupApp(t, receivedCalls);

  const big = Buffer.alloc(10 * 1024 * 1024 + 1, 0xab);
  big[0] = 0xff;
  big[1] = 0xd8;
  const res = await fetch(`${base}/api/evaluate`, {
    method: 'POST',
    body: buildForm(studentId, 1, { bytes: big }),
  });
  assert.equal(res.status, 400);
  assert.deepEqual(receivedCalls, []);
});

test('görsel olmadan veya studentId olmadan istek 400 döner', async (t) => {
  const receivedCalls = [];
  const { base, studentId } = await setupApp(t, receivedCalls);

  const noImages = new FormData();
  noImages.append('studentId', studentId);
  const res1 = await fetch(`${base}/api/evaluate`, { method: 'POST', body: noImages });
  assert.equal(res1.status, 400);

  const noStudent = new FormData();
  noStudent.append('images', new Blob([JPEG_BYTES], { type: 'image/jpeg' }), 'page1.jpg');
  const res2 = await fetch(`${base}/api/evaluate`, { method: 'POST', body: noStudent });
  assert.equal(res2.status, 400);

  assert.deepEqual(receivedCalls, []);
});
