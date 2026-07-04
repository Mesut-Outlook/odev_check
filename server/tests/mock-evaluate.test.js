import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../server.js';

test('evaluate flow with mocked Gemini call', async (t) => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'math-hw-eval-test-'));
  process.env.DATA_DIR = tmpDir;
  t.after(async () => {
    delete process.env.DATA_DIR;
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  const fakeGenerateEvaluation = async () => ({
    questions: [
      {
        questionNumber: 1,
        questionText: '2x + 5 = 15',
        studentSolutionText: '2x = 10, x = 5',
        correctSolutionSteps: ['2x = 10', 'x = 5'],
        correctAnswer: 'x = 5',
        studentAnswer: 'x = 5',
        status: 'correct',
        aiExplanation: 'Doğru çözülmüş.',
      },
    ],
    model: 'gemini-2.5-flash-mock',
  });

  const app = createApp({ generateEvaluation: fakeGenerateEvaluation });
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  try {
    const studentRes = await fetch(`${base}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Öğrenci' }),
    });
    assert.equal(studentRes.status, 201);
    const student = await studentRes.json();
    const studentId = student.id;
    assert.ok(studentId);

    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append(
      'images',
      new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }),
      'page1.jpg'
    );
    formData.append(
      'images',
      new Blob([Buffer.from([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }),
      'page2.jpg'
    );

    const evaluateRes = await fetch(`${base}/api/evaluate`, {
      method: 'POST',
      body: formData,
    });
    assert.equal(evaluateRes.status, 201);
    const homework = await evaluateRes.json();
    assert.equal(homework.status, 'draft');
    assert.equal(homework.images.length, 2);
    assert.equal(homework.questions.length, 1);
    assert.equal(homework.questions[0].status, 'correct');
    assert.equal(homework.questions[0].score, null);
    assert.equal(homework.questions[0].teacherNote, '');

    const homeworkId = homework.homeworkId;

    const listRes = await fetch(`${base}/api/evaluations/${studentId}`);
    assert.equal(listRes.status, 200);
    const list = await listRes.json();
    assert.equal(list.length, 1);

    const updatedQuestions = [
      {
        ...homework.questions[0],
        status: 'incorrect',
      },
    ];

    const saveRes = await fetch(`${base}/api/evaluations/${studentId}/${homeworkId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: updatedQuestions, teacherComment: 'test yorum' }),
    });
    assert.equal(saveRes.status, 200);
    const saved = await saveRes.json();
    assert.equal(saved.status, 'final');
  } finally {
    server.close();
  }
});
