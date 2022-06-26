import axios from 'axios';
import cheerio from 'cheerio';
import { addDays, addHours, differenceInMilliseconds, parse, setHours, setMinutes } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import { chunk, uniqBy } from "lodash";

import cache from 'memory-cache';
import admin from "../../firebase/admin";

const startDate = parse('2022-06-22', 'yyyy-MM-dd', new Date());

const DAYS = [
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
];

export async function getPerformances() {
  const cached = cache.get('performances-v2');

  if (cached) {
    console.log("cached")
    return cached;
  }

  console.log("uncached")

  const { data } = await axios.get(
    'https://www.glastonburyfestivals.co.uk/line-up/line-up-2022'
  );

  const $ = cheerio.load(data);

  const children = $('.lineup .inner').children();

  const performances = [];

  let stage = '';

  for (const child of Array.from(children)) {
    const item = $(child);

    if (item.hasClass('box_header')) {
      stage = item.text();

      continue;
    }

    if (item.is('table')) {
      $('.lineup_table_day', item).each((index, table) => {
        let day = '';

        $('tr', table).each((index, row) => {
          const columns = $('td', row);

          if (columns.length === 1) {
            day = columns.text();

            return;
          }

          const [description, schedule] = Array.from(columns);
          const [start, end] = $(schedule).text().split('-').map(t => t?.trim());

          if (!start) {
            return;
          }

          const date = setHours(addDays(startDate, DAYS.indexOf(day)), 9);

          function getDate(time: string) {
            const [hour, minute] = time.split(':');

            const timeDate = setHours(
              setMinutes(date, Number(minute)),
              Number(hour)
            );

            const result = timeDate < date ? addDays(timeDate, 1) : timeDate;

            return zonedTimeToUtc(result, 'Europe/London')
          }

          const link = $('a', description)?.attr('href');

          const name = $(description).text()?.trim();

          const s = getDate(start);

          const id = [day, stage, start, name]
            .join(':')
            .replace(/ /gim, '_');

          performances.push({
            id,
            name,
            day,
            link,
            range: [start, end],
            stage: stage.trim(),
            start: s,
            end: getDate(end),
          });
        });
      });
    }
  }

  const results = uniqBy(performances, 'id');

  const timeout = Math.abs(differenceInMilliseconds(new Date(), addHours(new Date(), 6)));

  cache.put('performances-v2', results, timeout);

  // sync(results);

  return results;
}

export default async function performances(request, response) {
  const performances = await getPerformances() as any[];

  response.json(performances);

  // return;

  try {

    const chunked = chunk(performances, 400);

    const ref = admin.firestore().collection('performances');

    for (const chunk of chunked) {
      console.log('chunk size', chunk.length);

      const batch = admin.firestore().batch();

      for (const performance of chunk) {
        batch.set(ref.doc(performance.id.replace(/\//gmi, '_')), performance, { merge: true });
      }

      console.log('batch commit');

      // await batch.commit();

      console.log('batch committed');
    }
  } catch (e) {
    console.error(e);
  }
}

async function sync(performances) {

  try {

    const chunked = chunk(performances, 350) as any[][];

    for (const performances of chunked) {
      const batch = admin.firestore().batch();

      let count = 0;

      for (const performance of performances) {
        const names = performance.name.trim().split(/B2B| x /gmi)

        const artists = [];

        for (const name of names) {
          const brackets = name.replace(/\([^)]+\)/, '');
          const trimmed = brackets.trim();
          const id = trimmed.replace(/[^a-z0-9-]/gmi, '_');

          artists.push({ id, name: trimmed });
        }

        for (const artist of artists) {
          if (!artist.id) {
            console.warn(artist);
            continue;
          }

          count++;

          batch.set(admin.firestore().collection('artists').doc(artist.id), {
            // id: artist.id,
            // name: artist.name,
            created: new Date(),
            spotifyId: ""
          }, {
            merge: true
          })
        }
      }

      console.log('batch commit', count);

      await batch.commit();
    }

  } catch (e) {
    console.error(e);
  }

}
