import {
  Entity, PrimaryKey, Property,
  OneToMany, Collection
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

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}