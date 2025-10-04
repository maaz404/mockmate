/* eslint-disable no-magic-numbers */
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const Interview = require('../models/Interview');
const UserProfile = require('../models/UserProfile');

process.env.MOCK_AUTH_FALLBACK = 'true';

// Helper ensure profile
async function ensureProfile(userId = 'test-user-123') {
  let doc = await UserProfile.findOne({ clerkUserId: userId });
  if (!doc) {
    doc = await UserProfile.create({
      clerkUserId: userId,
      email: `${userId}@example.com`,
      analytics: { averageScore: 72 }
    });
  }
  return doc;
}

describe('Dashboard Metrics Endpoint', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await new Promise((res) => setTimeout(res, 500));
    }
    await ensureProfile();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('returns structured metrics with weekly arrays', async () => {
    // Seed a couple of completed interviews with categories & followups
    const now = new Date();
    await Interview.create([
      {
        userId: 'test-user-123',
        status: 'completed',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        results: { overallScore: 80 },
        questions: [
          { category: 'System Design', followUpsReviewed: true, followUps: ['a','b'] },
          { category: 'Behavioral', followUpsReviewed: false },
        ],
      },
      {
        userId: 'test-user-123',
        status: 'completed',
        createdAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
        results: { overallScore: 60 },
        questions: [
          { category: 'Behavioral', followUpsReviewed: true, followUps: ['x'] },
        ],
      },
    ]);

    const res = await request(app).get('/api/users/dashboard/metrics');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const m = res.body.data;
    // Weekly arrays
    expect(Array.isArray(m.weekly.weeks)).toBe(true);
    expect(Array.isArray(m.weekly.interviews)).toBe(true);
    expect(m.weekly.weeks.length).toBe(m.weekly.interviews.length);
    expect(m.weekly.avgScore.length).toBe(m.weekly.weeks.length);

    // Coverage
    expect(Array.isArray(m.categoryCoverage)).toBe(true);
    expect(m.categoryCoverage.length).toBeGreaterThan(0);
    const catNames = m.categoryCoverage.map(c => c.category);
    expect(catNames).toEqual(expect.arrayContaining(['Behavioral','System Design']));

    // Follow-ups stats
    expect(m.followUps.total).toBeGreaterThan(0);
    expect(m.followUps.reviewed).toBeGreaterThan(0);

    // Streak days length
    expect(m.streakDays.length).toBe(21);
    // At least one active day
    expect(m.streakDays.some(d => d.active)).toBe(true);
  });
});
