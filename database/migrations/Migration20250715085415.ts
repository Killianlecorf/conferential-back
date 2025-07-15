import { Migration } from '@mikro-orm/migrations';

export class Migration20250715085415 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user" ("id" serial primary key, "full_name" varchar(255) not null, "email" varchar(255) not null, "password" varchar(255) not null, "is_sponsor" boolean not null default false, "is_admin" boolean not null default false, "created_at" timestamptz not null, "updated_at" timestamptz not null);`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`create table "conference" ("id" serial primary key, "title" varchar(255) not null, "description" varchar(255) not null, "speaker_name" varchar(255) not null, "speaker_bio" varchar(255) not null, "date" timestamptz not null, "conferential_size" int not null, "slot_number" int not null, "start_date_time" timestamptz not null, "end_date_time" timestamptz not null, "organizer_id" int not null);`);

    this.addSql(`alter table "conference" add constraint "conference_organizer_id_foreign" foreign key ("organizer_id") references "user" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "conference" drop constraint "conference_organizer_id_foreign";`);

    this.addSql(`drop table if exists "user" cascade;`);

    this.addSql(`drop table if exists "conference" cascade;`);
  }

}
