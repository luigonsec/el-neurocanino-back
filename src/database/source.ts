import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { entities } from './entities';
import { InitialSchema1795219200000 } from './migration';
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
  migrations: [InitialSchema1795219200000],
  synchronize: false,
};
export const dataSource = new DataSource(databaseOptions);
