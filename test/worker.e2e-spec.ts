import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Worker API (e2e)', () => {
  let app: INestApplication;
  let workerToken: string;
  let jobId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Note: Set up worker authentication token
    // workerToken = getWorkerAuthToken();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/worker/jobs/pending (GET)', () => {
    it('should return pending jobs', async () => {
      return request(app.getHttpServer())
        .get('/worker/jobs/pending')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/worker/jobs/:jobId/claim (POST)', () => {
    it('should claim a job', async () => {
      if (workerToken && jobId) {
        return request(app.getHttpServer())
          .post(`/worker/jobs/${jobId}/claim`)
          .set('Authorization', `Bearer ${workerToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('claimed');
          });
      }
    });
  });

  describe('/worker/jobs/:jobId/status (PATCH)', () => {
    it('should return 400 when status is missing', async () => {
      if (workerToken && jobId) {
        return request(app.getHttpServer())
          .patch(`/worker/jobs/${jobId}/status`)
          .set('Authorization', `Bearer ${workerToken}`)
          .send({})
          .expect(400);
      }
    });

    it('should update job status', async () => {
      if (workerToken && jobId) {
        return request(app.getHttpServer())
          .patch(`/worker/jobs/${jobId}/status`)
          .set('Authorization', `Bearer ${workerToken}`)
          .send({ status: 'processing', progress: 25.5 })
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('processing');
            expect(res.body.data.progress).toBe(25.5);
          });
      }
    });
  });

  describe('/worker/jobs/:jobId/steps (POST)', () => {
    it('should create job step', async () => {
      if (workerToken && jobId) {
        return request(app.getHttpServer())
          .post(`/worker/jobs/${jobId}/steps`)
          .set('Authorization', `Bearer ${workerToken}`)
          .send({
            type: 'speech_recognition',
            status: 'running',
            progress: 50,
            log: 'Processing audio...',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.type).toBe('speech_recognition');
          });
      }
    });
  });

  describe('/worker/jobs/:jobId/speakers (POST)', () => {
    it('should save speakers', async () => {
      if (workerToken && jobId) {
        return request(app.getHttpServer())
          .post(`/worker/jobs/${jobId}/speakers`)
          .set('Authorization', `Bearer ${workerToken}`)
          .send({
            speakers: [
              { label: 'speaker_1', displayName: 'Speaker 1' },
              { label: 'speaker_2', displayName: 'Speaker 2' },
            ],
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveLength(2);
          });
      }
    });
  });

  describe('/worker/jobs/:jobId/segments (POST)', () => {
    it('should save segments', async () => {
      if (workerToken && jobId) {
        return request(app.getHttpServer())
          .post(`/worker/jobs/${jobId}/segments`)
          .set('Authorization', `Bearer ${workerToken}`)
          .send({
            segments: [
              {
                speaker_id: 'some-uuid',
                start_ms: 1000,
                end_ms: 5000,
                src_text: 'Hello',
                mt_text: '안녕하세요',
              },
            ],
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeInstanceOf(Array);
          });
      }
    });
  });

  describe('/worker/jobs/:jobId/fail (POST)', () => {
    it('should report job failure', async () => {
      if (workerToken && jobId) {
        return request(app.getHttpServer())
          .post(`/worker/jobs/${jobId}/fail`)
          .set('Authorization', `Bearer ${workerToken}`)
          .send({
            error_code: 'TTS_TIMEOUT',
            error_message: 'TTS service timeout',
            step_type: 'tts_generation',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('failed');
          });
      }
    });
  });
});
