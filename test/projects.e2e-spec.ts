import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Projects (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let projectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Note: You would need to set up test authentication here
    // accessToken = await getTestAccessToken(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/projects (GET)', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/projects').expect(401);
    });

    it('should return paginated projects list', async () => {
      if (accessToken) {
        return request(app.getHttpServer())
          .get('/projects?page=1&limit=20')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.meta).toHaveProperty('page');
            expect(res.body.meta).toHaveProperty('limit');
            expect(res.body.meta).toHaveProperty('total');
            expect(res.body.meta).toHaveProperty('totalPages');
          });
      }
    });
  });

  describe('/projects (POST)', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/projects')
        .send({ name: 'Test Project' })
        .expect(401);
    });

    it('should return 400 when name is missing', async () => {
      if (accessToken) {
        return request(app.getHttpServer())
          .post('/projects')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({})
          .expect(400);
      }
    });

    it('should create a new project', async () => {
      if (accessToken) {
        const res = await request(app.getHttpServer())
          .post('/projects')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'E2E Test Project',
            description: 'Created by E2E test',
          })
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.name).toBe('E2E Test Project');

        projectId = res.body.data.id;
      }
    });
  });

  describe('/projects/:projectId (GET)', () => {
    it('should return 404 for non-existent project', async () => {
      if (accessToken) {
        return request(app.getHttpServer())
          .get('/projects/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      }
    });

    it('should return project details', async () => {
      if (accessToken && projectId) {
        return request(app.getHttpServer())
          .get(`/projects/${projectId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(projectId);
            expect(res.body.data).toHaveProperty('name');
          });
      }
    });
  });

  describe('/projects/:projectId (PATCH)', () => {
    it('should update project', async () => {
      if (accessToken && projectId) {
        return request(app.getHttpServer())
          .patch(`/projects/${projectId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ name: 'Updated Project Name' })
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Updated Project Name');
          });
      }
    });
  });

  describe('/projects/:projectId (DELETE)', () => {
    it('should delete project', async () => {
      if (accessToken && projectId) {
        return request(app.getHttpServer())
          .delete(`/projects/${projectId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('deleted');
          });
      }
    });
  });
});
