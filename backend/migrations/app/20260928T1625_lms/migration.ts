#!/usr/bin/env -S node

import type { Contract as End } from "../../snapshots/489221bef849a6485c9218d9a64a43ebf595d715a3d678eabf62fea2c99153b7/contract";
import endContract from "../../snapshots/489221bef849a6485c9218d9a64a43ebf595d715a3d678eabf62fea2c99153b7/contract.json" with { type: "json" };

import type { Contract as Start } from "../../snapshots/e3ed7b3f28db2c758220cfa590cd6653cffbe17e34daa9df2ce0ed58b2f16210/contract";
import startContract from "../../snapshots/e3ed7b3f28db2c758220cfa590cd6653cffbe17e34daa9df2ce0ed58b2f16210/contract.json" with { type: "json" };

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
      // 1. LearningContent
      this.createTable({
        schema: "public",
        table: "learningContent",
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
          col("description", "text", {
            codecRef: { codecId: "pg/text@1" },
          }),
          col("durationMinutes", "integer", {
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("fileUrl", "text", {
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
          col("isPublished", "boolean", {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: "pg/bool@1" },
          }),
          col("publishedAt", "timestamptz", {
            codecRef: { codecId: "pg/timestamptz-temporal@1" },
          }),
          col("sortOrder", "integer", {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: "pg/int4@1" },
          }),
          col("thumbnailUrl", "text", {
            codecRef: { codecId: "pg/text@1" },
          }),
          col("title", "text", {
            notNull: true,
            codecRef: { codecId: "pg/text@1" },
          }),
          col("contentType", "text", {
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
            "learningContent_contentType_check",
            "\"contentType\" IN ('video', 'note', 'paper', 'other')",
          ),
        ],
      }),

      // 2. LearningContent (id, instituteId)
      this.addUnique({
        schema: "public",
        table: "learningContent",
        constraint: "learningContent_id_instituteId_key",
        columns: ["id", "instituteId"],
      }),

      // 3. LearningContent (instituteId, classId)
      this.createIndex({
        schema: "public",
        table: "learningContent",
        index: "learningContent_instituteId_classId_idx",
        columns: ["instituteId", "classId"],
      }),

      // 4. LearningContent (instituteId, contentType)
      this.createIndex({
        schema: "public",
        table: "learningContent",
        index: "learningContent_instituteId_contentType_idx",
        columns: ["instituteId", "contentType"],
      }),

      // 5. LearningContent (instituteId, isPublished)
      this.createIndex({
        schema: "public",
        table: "learningContent",
        index: "learningContent_instituteId_isPublished_idx",
        columns: ["instituteId", "isPublished"],
      }),

      // 6. LearningContent (instituteId, sortOrder)
      this.createIndex({
        schema: "public",
        table: "learningContent",
        index: "learningContent_instituteId_sortOrder_idx",
        columns: ["instituteId", "sortOrder"],
      }),

      // 7. LearningContent → Class
      this.addForeignKey({
        schema: "public",
        table: "learningContent",
        foreignKey: {
          name: "learningContent_classId_instituteId_fkey",
          columns: ["classId", "instituteId"],
          references: {
            schema: "public",
            table: "class",
            columns: ["id", "instituteId"],
          },
          onDelete: "cascade",
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);