import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Videos (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let projectId: string;
  let videoId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup: Create a test project
    // projectId = await createTestProject(app, accessToken);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/projects/:projectId/videos (GET)', () => {
    it('should return 401 without authentication', async () => {
      if (projectId) {
        return request(app.getHttpServer())
          .get(`/projects/${projectId}/videos`)
          .expect(401);
      }
    });

    it('should return videos list', async () => {
      if (accessToken && projectId) {
        return request(app.getHttpServer())
          .get(`/projects/${projectId}/videos`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
          });
      }
    });
  });

  describe('/projects/:projectId/videos/upload-url (POST)', () => {
    it('should return 400 when fileName is missing', async () => {
      if (accessToken && projectId) {
        return request(app.getHttpServer())
          .post(`/projects/${projectId}/videos/upload-url`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ contentType: 'video/mp4' })
          .expect(400);
      }
    });

    it('should return presigned URL', async () => {
      if (accessToken && projectId) {
        const res = await request(app.getHttpServer())
          .post(`/projects/${projectId}/videos/upload-url`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            fileName: 'test-video.mp4',
            contentType: 'video/mp4',
          })
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('uploadUrl');
        expect(res.body.data).toHaveProperty('s3Key');
        expect(res.body.data).toHaveProperty('videoAssetId');

        videoId = res.body.data.videoAssetId;
      }
    });
  });

  describe('/projects/:projectId/videos/:videoId/complete (POST)', () => {
    it('should complete upload and start processing', async () => {
      if (accessToken && projectId && videoId) {
        return request(app.getHttpServer())
          .post(`/projects/${projectId}/videos/${videoId}/complete`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ srcLang: 'ko' })
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('status');
          });
      }
    });
  });

  describe('/projects/:projectId/videos/:videoId (GET)', () => {
    it('should return video details', async () => {
      if (accessToken && projectId && videoId) {
        return request(app.getHttpServer())
          .get(`/projects/${projectId}/videos/${videoId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(videoId);
          });
      }
    });
  });

  describe('/projects/:projectId/videos/:videoId (DELETE)', () => {
    it('should delete video', async () => {
      if (accessToken && projectId && videoId) {
        return request(app.getHttpServer())
          .delete(`/projects/${projectId}/videos/${videoId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
          });
      }
    });
  });
});
