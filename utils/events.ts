import { createEvents as _createEvents, EventAttributes } from "ics";
import { getDate, getHours, getMinutes, getMonth, getYear } from "date-fns";

export function createEvents(events: EventAttributes[]) {
  return new Promise((resolve, reject) => {
    _createEvents(events, (error, events) => {
      if (error) {
        return reject(error);
      }

      return resolve(events);
    });
  });
}

export function toDateArray(date: Date, time: boolean = false): [number, number, number] | [number, number, number, number, number] {
  const times = [getYear(date), getMonth(date) + 1, getDate(date)];

  if (time) {
    times.push(getHours(date))
    times.push(getMinutes(date))
  }

  return times as any
}
