import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260626130700 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "courier_account" drop constraint if exists "courier_account_provider_unique";`);
    this.addSql(`create table if not exists "courier_account" ("id" text not null, "provider" text not null, "label" text null, "is_enabled" boolean not null default false, "test_mode" boolean not null default true, "credentials" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "courier_account_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_courier_account_provider_unique" ON "courier_account" ("provider") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_courier_account_deleted_at" ON "courier_account" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "courier_account" cascade;`);
  }

}
