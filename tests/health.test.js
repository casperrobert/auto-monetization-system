const request = require("supertest");
const app = require("../index");

describe("GET /api/health", () => {
  it("should return status 200 and {ok: true}", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
  });
});

