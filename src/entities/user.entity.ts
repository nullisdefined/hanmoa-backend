import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';

export type authProvider = 'google' | 'github';

@Entity('user')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  nickname: string;

  @Column({ name: 'avatar_url' })
  avatarUrl: string;

  @Column({ name: 'auth_provider' })
  authProvider: authProvider;

  @Column({ name: 'provider_user_id' })
  providerUserId: string;

  @OneToMany(() => Project, (project: Project) => project.user)
  projects: Project[];
}
