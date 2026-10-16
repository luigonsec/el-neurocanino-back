import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { entities } from './entities';
import { InitialSchema1791320000000 } from './migration';
import { ClubBrandAssets1791381600000 } from './brand-assets-migration';
import { OrganizePublicImages1791410000000 } from './public-images-migration';
import { AdminImprovements1791420000000 } from './admin-improvements-migration';
import { RenamePresencial1792170000000 } from './rename-presencial-migration';
import { ServiceCards1792171000000 } from './service-cards-migration';
export const databaseOptions = {
  type: 'mysql' as const,
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  charset: 'utf8mb4',
  timezone: 'Z',
  entities,
  migrations: [
    InitialSchema1791320000000,
    ClubBrandAssets1791381600000,
    OrganizePublicImages1791410000000,
    AdminImprovements1791420000000,
    RenamePresencial1792170000000,
    ServiceCards1792171000000,
  ],
  synchronize: false,
};
export const dataSource = new DataSource(databaseOptions);
