import { INestApplication } from '@nestjs/common';
import request from 'supertest';

/**
 * Helper function to create a test user and get access token
 */
export async function getTestAccessToken(
  app: INestApplication,
): Promise<string> {
  // This is a placeholder - implement based on your auth strategy
  // For testing, you might want to create a special test endpoint
  // or use a service method directly

  const response = await request(app.getHttpServer())
    .post('/auth/test-login') // You would need to implement this endpoint
    .send({
      email: 'test@example.com',
      password: 'test123',
    });

  return response.body.data.accessToken;
}

/**
 * Helper function to create a test project
 */
export async function createTestProject(
  app: INestApplication,
  accessToken: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/projects')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      name: 'Test Project',
      description: 'Created for testing',
    });

  return response.body.data.id;
}

/**
 * Helper function to create a test video asset
 */
export async function createTestVideoAsset(
  app: INestApplication,
  accessToken: string,
  projectId: string,
): Promise<string> {
  const uploadRes = await request(app.getHttpServer())
    .post(`/projects/${projectId}/videos/upload-url`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      fileName: 'test-video.mp4',
      contentType: 'video/mp4',
    });

  const videoAssetId = uploadRes.body.data.videoAssetId;

  await request(app.getHttpServer())
    .post(`/projects/${projectId}/videos/${videoAssetId}/complete`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ srcLang: 'en' });

  return videoAssetId;
}

/**
 * Cleanup helper
 */
export async function cleanupTestData(
  app: INestApplication,
  accessToken: string,
  projectId: string,
): Promise<void> {
  await request(app.getHttpServer())
    .delete(`/projects/${projectId}`)
    .set('Authorization', `Bearer ${accessToken}`);
}
