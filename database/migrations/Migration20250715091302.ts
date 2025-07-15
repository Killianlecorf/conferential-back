import { Migration } from '@mikro-orm/migrations';

export class Migration20250715091302 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "conference" drop constraint "conference_organizer_id_foreign";`);

    this.addSql(`alter table "conference" drop column "organizer_id";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "conference" add column "organizer_id" int not null;`);
    this.addSql(`alter table "conference" add constraint "conference_organizer_id_foreign" foreign key ("organizer_id") references "user" ("id") on update cascade;`);
  }

}
