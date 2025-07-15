import {
  Collection,
  Entity, ManyToMany, PrimaryKey, Property
} from '@mikro-orm/core';
import { Conference } from './Conferential';

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property()
  fullName!: string;

  @Property({ unique: true })
  email!: string;

  @Property({ hidden: true })
  password!: string;

  @Property()
  isSponsor: boolean = false;

  @Property()
  isAdmin: boolean = false;

  @ManyToMany(() => Conference, conference => conference.conferentialUser)
  conferences = new Collection<Conference>(this);

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}