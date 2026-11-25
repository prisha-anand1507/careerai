const axios = require('axios');
const FormData = require('form-data');

async function analyzeResume({ buffer, filename, mimetype, interests = [], preferredRoles = [], jobDescription = '' }) {
  const form = new FormData();
  if (jobDescription) form.append('job_description', jobDescription);
  form.append('file', buffer, { filename, contentType: mimetype });
  form.append('interests', JSON.stringify(interests));
  form.append('preferred_roles', JSON.stringify(preferredRoles));
  try {
    const { data } = await axios.post(`${process.env.ML_SERVICE_URL}/analyze`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      timeout: 60000,
    });
    return data;
  } catch (err) {
    if (err.response) {
      const e = new Error(err.response.data?.detail || 'Resume analysis failed.');
      e.status = err.response.status === 422 || err.response.status === 413 ? err.response.status : 502;
      throw e;
    }
    const e = new Error('The ML service is not reachable. Start it with: uvicorn app.main:app --port 8000');
    e.status = 503;
    throw e;
  }
}

module.exports = { analyzeResume };
