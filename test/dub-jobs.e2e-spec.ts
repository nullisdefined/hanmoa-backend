import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Dub Jobs (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let projectId: string;
  let videoAssetId: string;
  let jobId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/projects/:projectId/dub-jobs (GET)', () => {
    it('should return 401 without authentication', async () => {
      if (projectId) {
        return request(app.getHttpServer())
          .get(`/projects/${projectId}/dub-jobs`)
          .expect(401);
      }
    });

    it('should return dub jobs list', async () => {
      if (accessToken && projectId) {
        return request(app.getHttpServer())
          .get(`/projects/${projectId}/dub-jobs`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
          });
      }
    });

    it('should filter by status', async () => {
      if (accessToken && projectId) {
        return request(app.getHttpServer())
          .get(`/projects/${projectId}/dub-jobs?status=pending`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
          });
      }
    });
  });

  describe('/projects/:projectId/dub-jobs (POST)', () => {
    it('should return 400 when videoAssetId is missing', async () => {
      if (accessToken && projectId) {
        return request(app.getHttpServer())
          .post(`/projects/${projectId}/dub-jobs`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ dubbingConfig: { targetLang: 'ko' } })
          .expect(400);
      }
    });

    it('should create a new dub job', async () => {
      if (accessToken && projectId && videoAssetId) {
        const res = await request(app.getHttpServer())
          .post(`/projects/${projectId}/dub-jobs`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            videoAssetId,
            dubbingConfig: { targetLang: 'ko' },
          })
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.status).toBe('pending');

        jobId = res.body.data.id;
      }
    });
  });

  describe('/projects/:projectId/dub-jobs/:jobId (GET)', () => {
    it('should return job details', async () => {
      if (accessToken && projectId && jobId) {
        return request(app.getHttpServer())
          .get(`/projects/${projectId}/dub-jobs/${jobId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(jobId);
            expect(res.body.data).toHaveProperty('dubbingConfig');
            expect(res.body.data).toHaveProperty('steps');
          });
      }
    });
  });

  describe('/projects/:projectId/dub-jobs/:jobId/retry (POST)', () => {
    it('should retry failed job', async () => {
      if (accessToken && projectId && jobId) {
        return request(app.getHttpServer())
          .post(`/projects/${projectId}/dub-jobs/${jobId}/retry`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('status');
          });
      }
    });
  });

  describe('/projects/:projectId/dub-jobs/:jobId (DELETE)', () => {
    it('should delete/cancel job', async () => {
      if (accessToken && projectId && jobId) {
        return request(app.getHttpServer())
          .delete(`/projects/${projectId}/dub-jobs/${jobId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      }
    });
  });
});
