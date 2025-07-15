import {
  Entity, PrimaryKey, Property, BeforeCreate
} from '@mikro-orm/core';

@Entity()
export class Conference {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property()
  description!: string;

  @Property()
  speakerName!: string;

  @Property()
  speakerBio!: string;

  @Property()
  date!: Date;

  @Property({length: 10})
  conferentialSize!: number;

  @Property()
  slotNumber!: number;

  @Property()
  startDateTime!: Date;

  @Property()
  endDateTime!: Date;

  @BeforeCreate()
  setTimesFromSlot() {
    const slots = [
      '08:30', '09:30', '10:30', '11:30',
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    if (this.slotNumber < 1 || this.slotNumber > 10) {
      throw new Error('slotNumber must be between 1 and 10');
    }

    const timeStr = slots[this.slotNumber - 1];
    const [hours, minutes] = timeStr.split(':').map(Number);
    const start = new Date(this.date);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + 45 * 60000);

    this.startDateTime = start;
    this.endDateTime = end;
  }
}
