import axios from 'axios';
import cheerio from 'cheerio';
import { addDays, format, parse, setHours, setMinutes } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { uniqBy } from "lodash";

const startDate = parse('2022-06-22', 'yyyy-MM-dd', new Date());

const DAYS = [
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
];

export default async function performances(request, response) {
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
          const [start, end] = $(schedule).text().split('-');

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

            const result =  timeDate < date ? addDays(timeDate, 1) : timeDate;

            return zonedTimeToUtc(result, 'Europe/London')
          }

          const link = $('a', description)?.attr('href');

          const name = $(description).text()?.trim();

          const s = getDate(start);

          const id = [day, stage, format(s, 'HH:mm'), name]
            .join(':')
            .replace(/ /gim, '_');

          if (name === 'TBA') {
            return;
          }

          performances.push({
            id,
            name,
            day,
            link,
            stage: stage.trim(),
            start: s,
            end: getDate(end),
          });
        });
      });
    }
  }

  response.json(uniqBy(performances, 'id'));
}
