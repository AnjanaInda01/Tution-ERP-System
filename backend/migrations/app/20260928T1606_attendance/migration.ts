#!/usr/bin/env -S node

import type { Contract as Start } from "../../snapshots/05e2c9f81b7e6677d078f1eb4931fec3f708e8c85980380d7224288c8cc45718/contract";
import startContract from "../../snapshots/05e2c9f81b7e6677d078f1eb4931fec3f708e8c85980380d7224288c8cc45718/contract.json" with { type: "json" };

import type { Contract as End } from "../../snapshots/e3ed7b3f28db2c758220cfa590cd6653cffbe17e34daa9df2ce0ed58b2f16210/contract";
import endContract from "../../snapshots/e3ed7b3f28db2c758220cfa590cd6653cffbe17e34daa9df2ce0ed58b2f16210/contract.json" with { type: "json" };

import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from "@prisma/orm-postgres/migration";

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      // 1. AttendanceRecord
      this.createTable({
        schema: "public",
        table: "attendanceRecord",
        columns: [
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("id", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("instituteId", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("remarks", "text", {
            codecRef: { codecId: "pg/text@1" },
          }),
          col("sessionId", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("status", "text", {
            notNull: true,
            default: lit("present"),
            codecRef: { codecId: "pg/text@1" },
          }),
          col("studentId", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
        ],
        constraints: [
          primaryKey(["id"]),
          checkExpression(
            "attendanceRecord_status_check_afe7ecd1",
            "\"status\" IN ('present', 'absent', 'late', 'excused')",
          ),
        ],
      }),

      // 2. AttendanceSession
      this.createTable({
        schema: "public",
        table: "attendanceSession",
        columns: [
          col("classId", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("createdAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("endTime", "text", {
            codecRef: { codecId: "pg/text@1" },
          }),
          col("id", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("instituteId", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("notes", "text", {
            codecRef: { codecId: "pg/text@1" },
          }),
          col("sessionDate", "timestamptz", {
            notNull: true,
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("startTime", "text", {
            codecRef: { codecId: "pg/text@1" },
          }),
          col("updatedAt", "timestamptz", {
            notNull: true,
            default: fn("now()"),
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
        ],
        constraints: [primaryKey(["id"])],
      }),

      // 3. AttendanceRecord (id, instituteId)
      this.addUnique({
        schema: "public",
        table: "attendanceRecord",
        constraint: "attendanceRecord_id_instituteId_key",
        columns: ["id", "instituteId"],
      }),

      // 4. AttendanceRecord (sessionId, studentId)
      this.addUnique({
        schema: "public",
        table: "attendanceRecord",
        constraint: "attendanceRecord_sessionId_studentId_key",
        columns: ["sessionId", "studentId"],
      }),

      // 5. AttendanceSession (id, instituteId)
      this.addUnique({
        schema: "public",
        table: "attendanceSession",
        constraint: "attendanceSession_id_instituteId_key",
        columns: ["id", "instituteId"],
      }),

      // 6. AttendanceSession (classId, sessionDate)
      this.addUnique({
        schema: "public",
        table: "attendanceSession",
        constraint: "attendanceSession_classId_sessionDate_key",
        columns: ["classId", "sessionDate"],
      }),

      // 7
      this.createIndex({
        schema: "public",
        table: "attendanceRecord",
        index: "attendanceRecord_instituteId_sessionId_idx_44bb6e8b",
        columns: ["instituteId", "sessionId"],
      }),

      // 8
      this.createIndex({
        schema: "public",
        table: "attendanceRecord",
        index: "attendanceRecord_instituteId_status_idx_b5328fd7",
        columns: ["instituteId", "status"],
      }),

      // 9
      this.createIndex({
        schema: "public",
        table: "attendanceRecord",
        index: "attendanceRecord_instituteId_studentId_idx_aedbc27b",
        columns: ["instituteId", "studentId"],
      }),

      // 10
      this.createIndex({
        schema: "public",
        table: "attendanceRecord",
        index: "attendanceRecord_sessionId_instituteId_idx_87281735",
        columns: ["sessionId", "instituteId"],
      }),

      // 11
      this.createIndex({
        schema: "public",
        table: "attendanceRecord",
        index: "attendanceRecord_studentId_instituteId_idx_77a018a9",
        columns: ["studentId", "instituteId"],
      }),

      // 12
      this.createIndex({
        schema: "public",
        table: "attendanceSession",
        index: "attendanceSession_classId_instituteId_idx_4bc20ca6",
        columns: ["classId", "instituteId"],
      }),

      // 13
      this.createIndex({
        schema: "public",
        table: "attendanceSession",
        index: "attendanceSession_instituteId_classId_idx_c38ab17c",
        columns: ["instituteId", "classId"],
      }),

      // 14
      this.createIndex({
        schema: "public",
        table: "attendanceSession",
        index: "attendanceSession_instituteId_sessionDate_idx_f5f3913c",
        columns: ["instituteId", "sessionDate"],
      }),

      // 15
      this.addForeignKey({
        schema: "public",
        table: "attendanceSession",
        foreignKey: {
          name: "attendanceSession_classId_instituteId_fkey",
          columns: ["classId", "instituteId"],
          references: {
            schema: "public",
            table: "class",
            columns: ["id", "instituteId"],
          },
          onDelete: "cascade",
        },
      }),

      // 16
      this.addForeignKey({
        schema: "public",
        table: "attendanceRecord",
        foreignKey: {
          name: "attendanceRecord_sessionId_instituteId_fkey",
          columns: ["sessionId", "instituteId"],
          references: {
            schema: "public",
            table: "attendanceSession",
            columns: ["id", "instituteId"],
          },
          onDelete: "cascade",
        },
      }),

      // 17
      this.addForeignKey({
        schema: "public",
        table: "attendanceRecord",
        foreignKey: {
          name: "attendanceRecord_studentId_instituteId_fkey",
          columns: ["studentId", "instituteId"],
          references: {
            schema: "public",
            table: "student",
            columns: ["id", "instituteId"],
          },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
