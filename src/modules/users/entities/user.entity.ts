import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';

@Entity('user')
export class User {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  uuid: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = ulid();
    }
  }

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  nickname: string;

  @Column({ name: 'avatar_url', type: 'varchar' })
  avatarUrl: string;

  @Column({ name: 'auth_provider', type: 'varchar' })
  authProvider: string;

  @Column({ name: 'provider_user_id', type: 'varchar' })
  providerUserId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
