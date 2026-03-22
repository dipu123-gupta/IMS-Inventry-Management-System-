const request = require('supertest');
const { app, server } = require('../server');
const mongoose = require('mongoose');

describe('Auth API', () => {
  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  it('should return 401 for protected routes without token', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.statusCode).toEqual(401);
  });

  it('should have a working health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('ok');
  });
});
