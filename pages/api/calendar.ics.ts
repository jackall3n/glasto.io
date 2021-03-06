import { EventAttributes } from "ics";

import { getPerformances } from "./performances";
import { createEvents, toDateArray } from '../../utils/events';
import { NextApiRequest } from "next";
import { startCase } from "lodash";
import admin from "../../firebase/admin";


export default async function performances(request: NextApiRequest, response) {
  const performances = await getPerformances();
  const id = request.query.id;

  console.log(performances.length)

  if (!id) {
    response.status(200).send(await createEvents([]))
    return
  }
  try {


    const ref = admin.firestore().doc(`users/${id}`)
    const doc = await ref.get();
    const data = doc?.data();
    const choices = data?.choices ?? [];

    const now = new Date();

    const filtered = performances.filter(p => choices.includes(p.id));

    const events: EventAttributes[] = filtered.map(p => {
      const [link] = p.link?.split(' ') ?? [];

      const url = link.trim().startsWith('http') ? link.trim() : undefined;

      return {
        title: startCase(p.name.toLowerCase()),
        start: toDateArray(p.start, true),
        end: toDateArray(p.end, true),
        calName: 'Glastonbury 🎵',
        url,
        lastModified: toDateArray(now),
        uid: `${p.name}:${p.start.toISOString()}`,
        location: startCase(p.stage.toLowerCase()),
      }
    });

    const results = await createEvents(events);

    response.status(200).send(results)
  } catch (e) {
    console.log(e);
    response.status(500).send({})
  }
}
