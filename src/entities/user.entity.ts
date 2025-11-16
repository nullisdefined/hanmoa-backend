import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('user')
export class User extends BaseEntity {
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
}
