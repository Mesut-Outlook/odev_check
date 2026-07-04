// Thin fetch wrapper around the backend API (base path /api, proxied by Vite dev server)

async function handleResponse(res) {
  if (!res.ok) {
    let body = {};
    try {
      body = await res.json();
    } catch (e) {
      // ignore JSON parse failure, fall back to statusText
    }
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

export async function listStudents() {
  const res = await fetch('/api/students');
  return handleResponse(res);
}

export async function createStudent(name) {
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
}

export async function evaluateHomework(studentId, files) {
  const formData = new FormData();
  formData.append('studentId', studentId);
  files.forEach((file) => {
    formData.append('images', file);
  });
  const res = await fetch('/api/evaluate', {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function listEvaluations(studentId) {
  const res = await fetch(`/api/evaluations/${studentId}`);
  return handleResponse(res);
}

export async function getEvaluation(studentId, homeworkId) {
  const res = await fetch(`/api/evaluations/${studentId}/${homeworkId}`);
  return handleResponse(res);
}

export async function saveEvaluation(studentId, homeworkId, { questions, teacherComment }) {
  const res = await fetch(`/api/evaluations/${studentId}/${homeworkId}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions, teacherComment }),
  });
  return handleResponse(res);
}

export function imageUrl(studentId, homeworkId, index) {
  return `/api/images/${studentId}/${homeworkId}/${index}`;
}
