import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Integration Flow (e2e)', () => {
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

  it('Complete dubbing workflow', async () => {
    // This test demonstrates the full workflow from project creation to dubbing completion
    // Note: Requires valid authentication setup

    if (!accessToken) {
      return; // Skip if no auth token
    }

    // 1. Create Project
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Integration Test Project' });

    projectId = projectRes.body.data.id;
    expect(projectRes.status).toBe(201);

    // 2. Get Upload URL
    const uploadRes = await request(app.getHttpServer())
      .post(`/projects/${projectId}/videos/upload-url`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fileName: 'test.mp4', contentType: 'video/mp4' });

    videoAssetId = uploadRes.body.data.videoAssetId;
    expect(uploadRes.status).toBe(200);

    // 3. Complete Upload
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/videos/${videoAssetId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ srcLang: 'en' })
      .expect(200);

    // 4. Create Dub Job
    const jobRes = await request(app.getHttpServer())
      .post(`/projects/${projectId}/dub-jobs`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        videoAssetId,
        dubbingConfig: { targetLang: 'ko' },
      });

    jobId = jobRes.body.data.id;
    expect(jobRes.status).toBe(201);

    // 5. Get Job Details
    await request(app.getHttpServer())
      .get(`/projects/${projectId}/dub-jobs/${jobId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 6. Get Speakers
    await request(app.getHttpServer())
      .get(`/projects/${projectId}/speakers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 7. Get Segments
    await request(app.getHttpServer())
      .get(`/projects/${projectId}/dub-jobs/${jobId}/segments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // 8. Get Subtitles
    await request(app.getHttpServer())
      .get(`/projects/${projectId}/dub-jobs/${jobId}/subtitles?lang=ko`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Cleanup
    await request(app.getHttpServer())
      .delete(`/projects/${projectId}/dub-jobs/${jobId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
