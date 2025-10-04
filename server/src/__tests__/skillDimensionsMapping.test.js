/* eslint-disable no-magic-numbers */
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const Interview = require('../models/Interview');
const UserProfile = require('../models/UserProfile');

process.env.MOCK_AUTH_FALLBACK = 'true';

async function ensureProfile(userId = 'test-user-123') {
  let doc = await UserProfile.findOne({ clerkUserId: userId });
  if (!doc) {
    doc = await UserProfile.create({ clerkUserId: userId, email: `${userId}@example.com` });
  }
  return doc;
}

describe('Skill Dimensions Mapping', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await new Promise((res) => setTimeout(res, 500));
    }
    await ensureProfile();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('splits previous vs current half and computes scores', async () => {
    const now = Date.now();
    // Clear existing interviews for deterministic run
    await Interview.deleteMany({ userId: 'test-user-123' });
    // 4 interviews -> first 2 older half, next 2 current half
    const docs = [];
    for (let i = 0; i < 4; i++) {
      docs.push({
        userId: 'test-user-123',
        status: 'completed',
        createdAt: new Date(now - (4 - i) * 3600 * 1000),
        results: { overallScore: 50 + i * 10 },
        questions: [
          { category: i % 2 === 0 ? 'System Design' : 'Behavioral', followUpsReviewed: true },
          { category: 'Data Structures' }
        ]
      });
    }
    await Interview.insertMany(docs);

    const res = await request(app).get('/api/users/dashboard/metrics');
    expect(res.status).toBe(200);
    const dims = res.body.data.skillDimensions;
    expect(Array.isArray(dims)).toBe(true);
    // Ensure dimension objects have prevScore (may be null for some) and score
    dims.forEach(d => {
      expect(d).toHaveProperty('dimension');
      expect(d).toHaveProperty('score');
      expect(d).toHaveProperty('prevScore');
    });
    // At least one dimension should have differing prev vs current
    const differing = dims.some(d => d.prevScore != null && d.score != null && d.prevScore !== d.score);
    expect(differing).toBe(true);
  });
});
