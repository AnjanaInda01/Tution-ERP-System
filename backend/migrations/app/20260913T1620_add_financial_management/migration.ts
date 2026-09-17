#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/05e2c9f81b7e6677d078f1eb4931fec3f708e8c85980380d7224288c8cc45718/contract';
import endContract from '../../snapshots/05e2c9f81b7e6677d078f1eb4931fec3f708e8c85980380d7224288c8cc45718/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/0e5bebced7f2a03afefe923d234e86bfbea439d6cfaffb36ae603e0655fb9b03/contract';
import startContract from '../../snapshots/0e5bebced7f2a03afefe923d234e86bfbea439d6cfaffb36ae603e0655fb9b03/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'authSession',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ipAddress', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('refreshTokenHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('revokedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('userAgent', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'invoice',
        columns: [
          col('amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('billingMonth', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('billingYear', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('dueDate', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('enrollmentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('instituteId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('institutePercentage', 'numeric', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('studentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('teacherPercentage', 'numeric', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'invoice_status_check_5cf8596f',
            "\"status\" IN ('pending', 'partially_paid', 'paid', 'cancelled', 'overdue')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'payment',
        columns: [
          col('amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('enrollmentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('instituteAmount', 'numeric', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('instituteId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('institutePercentage', 'numeric', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('invoiceId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('method', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('paymentDate', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('reference', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('completed'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('studentId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('teacherAmount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('teacherPercentage', 'numeric', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'payment_method_check_68ce692b',
            "\"method\" IN ('cash', 'bank_transfer', 'online')",
          ),
          checkExpression(
            'payment_status_check_77ba2498',
            "\"status\" IN ('pending', 'completed', 'failed', 'refunded')",
          ),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'class',
        column: col('institutePercentage', 'numeric', {
          notNull: true,
          default: lit('20'),
          codecRef: { codecId: 'pg/numeric@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'class',
        column: col('teacherPercentage', 'numeric', {
          notNull: true,
          default: lit('80'),
          codecRef: { codecId: 'pg/numeric@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'invoice',
        constraint: 'invoice_id_instituteId_key',
        columns: ['id', 'instituteId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'invoice',
        constraint: 'invoice_enrollmentId_billingYear_billingMonth_key',
        columns: ['enrollmentId', 'billingYear', 'billingMonth'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'payment',
        constraint: 'payment_id_instituteId_key',
        columns: ['id', 'instituteId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'authSession',
        index: 'authSession_expiresAt_idx_6b6b8c10',
        columns: ['expiresAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'authSession',
        index: 'authSession_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'invoice',
        index: 'invoice_enrollmentId_instituteId_idx_01dade96',
        columns: ['enrollmentId', 'instituteId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'invoice',
        index: 'invoice_instituteId_billingYear_billingMonth_idx_ed325102',
        columns: ['instituteId', 'billingYear', 'billingMonth'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'invoice',
        index: 'invoice_instituteId_enrollmentId_idx_78805778',
        columns: ['instituteId', 'enrollmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'invoice',
        index: 'invoice_instituteId_status_idx_b5328fd7',
        columns: ['instituteId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'invoice',
        index: 'invoice_instituteId_studentId_idx_aedbc27b',
        columns: ['instituteId', 'studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'invoice',
        index: 'invoice_studentId_instituteId_idx_77a018a9',
        columns: ['studentId', 'instituteId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment',
        index: 'payment_enrollmentId_instituteId_idx_01dade96',
        columns: ['enrollmentId', 'instituteId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment',
        index: 'payment_instituteId_enrollmentId_idx_78805778',
        columns: ['instituteId', 'enrollmentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment',
        index: 'payment_instituteId_invoiceId_idx_8eb6f346',
        columns: ['instituteId', 'invoiceId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment',
        index: 'payment_instituteId_paymentDate_idx_9f2427e7',
        columns: ['instituteId', 'paymentDate'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment',
        index: 'payment_instituteId_status_idx_b5328fd7',
        columns: ['instituteId', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment',
        index: 'payment_instituteId_studentId_idx_aedbc27b',
        columns: ['instituteId', 'studentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment',
        index: 'payment_invoiceId_instituteId_idx_1e502765',
        columns: ['invoiceId', 'instituteId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment',
        index: 'payment_studentId_instituteId_idx_77a018a9',
        columns: ['studentId', 'instituteId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'authSession',
        foreignKey: {
          name: 'authSession_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'invoice',
        foreignKey: {
          name: 'invoice_studentId_instituteId_fkey',
          columns: ['studentId', 'instituteId'],
          references: { schema: 'public', table: 'student', columns: ['id', 'instituteId'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'invoice',
        foreignKey: {
          name: 'invoice_enrollmentId_instituteId_fkey',
          columns: ['enrollmentId', 'instituteId'],
          references: { schema: 'public', table: 'enrollment', columns: ['id', 'instituteId'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payment',
        foreignKey: {
          name: 'payment_invoiceId_instituteId_fkey',
          columns: ['invoiceId', 'instituteId'],
          references: { schema: 'public', table: 'invoice', columns: ['id', 'instituteId'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payment',
        foreignKey: {
          name: 'payment_studentId_instituteId_fkey',
          columns: ['studentId', 'instituteId'],
          references: { schema: 'public', table: 'student', columns: ['id', 'instituteId'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payment',
        foreignKey: {
          name: 'payment_enrollmentId_instituteId_fkey',
          columns: ['enrollmentId', 'instituteId'],
          references: { schema: 'public', table: 'enrollment', columns: ['id', 'instituteId'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
