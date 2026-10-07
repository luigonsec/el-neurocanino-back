import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { entities } from './entities';
import { InitialSchema1791320000000 } from './migration';
import { ClubBrandAssets1791381600000 } from './brand-assets-migration';
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
  migrations: [InitialSchema1791320000000, ClubBrandAssets1791381600000],
  synchronize: false,
};
export const dataSource = new DataSource(databaseOptions);
