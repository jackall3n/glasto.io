import { EventAttributes } from "ics";

import { getPerformances } from "./performances";
import { createEvents, toDateArray } from '../../utils/events';
import { NextApiRequest } from "next";
import { startCase, uniq } from "lodash";
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


    const ref = admin.firestore().collection(`users`).where('groups', 'array-contains', id)
    const snapshot = await ref.get();
    const users = snapshot.docs.map(s => s.data())
    const groupChoices = users.map(u => u.choices ?? []).flat(10);
    const choices = uniq(groupChoices);

    const now = new Date();

    const filtered = performances.filter(p => choices.includes(p.id));

    const events: EventAttributes[] = filtered.map(p => {
      const [link] = p.link?.split(' ') ?? [];

      const url = link.trim().startsWith('http') ? link.trim() : undefined;
      
      const u = users.filter(u => u.choices?.includes(p.id));

      return {
        title: startCase(p.name.toLowerCase()) + " - " + u.map(u => u.displayName?.split(" ")[0]).join(", "),
        start: toDateArray(p.start, true),
        end: toDateArray(p.end, true),
        calName: `Glastonbury 🎵 - ${id}`,
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
