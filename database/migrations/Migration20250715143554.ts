import { Migration } from '@mikro-orm/migrations';

export class Migration20250715143554 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "conference_conferential_user" ("conference_id" int not null, "user_id" int not null, constraint "conference_conferential_user_pkey" primary key ("conference_id", "user_id"));`);

    this.addSql(`alter table "conference_conferential_user" add constraint "conference_conferential_user_conference_id_foreign" foreign key ("conference_id") references "conference" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "conference_conferential_user" add constraint "conference_conferential_user_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "conference" drop column "conferential_size";`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "conference_conferential_user" cascade;`);

    this.addSql(`alter table "conference" add column "conferential_size" int not null;`);
  }

}
