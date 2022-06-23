import { format, addHours, isAfter } from "date-fns";
import React, { useMemo, useState } from "react";
import { groupBy, orderBy, uniq } from "lodash";
import copy from 'copy-to-clipboard';
import { CalendarIcon } from "@heroicons/react/solid";

export default function ListView({ performances, users, user }) {
  const [showFilter, setShowFilter] = useState('ALL');
  const [filter, setFilter] = useState('');

  const days = useMemo(() => {
    const ids = users.map(({ choices }) => choices).flat(Infinity) as string[];
    const unique = uniq(ids);
    const filtered = unique.filter(id => {
      if (showFilter === 'ONLY_MINE') {
        return user?.choices?.includes(id)
      }

      return true;
    });

    const mapped = filtered.map(id => performances.find((p) => p.id === id)).filter(Boolean).filter(p => isAfter(p.start, addHours(new Date(), -4)));

    const ordered = orderBy(mapped.filter(performance => {
      return !filter || performance.name.toLowerCase().includes(filter.toLowerCase())
    }), 'start');

    const grouped = groupBy(ordered, 'day');

    return Object.entries(grouped)
  }, [performances, users, showFilter, filter]);

  const [message, setMessage] = useState('');

  function copyUrl() {
    copy(`https://glasto.io/api/calendar.ics?id=${user.id}`)
    setMessage('Copied!')

    setTimeout(() => setMessage(''), 2500);
  }

  return (
    <div className="p-5 container mx-auto max-w-[750px]">
      {user && (
        <div className="text-center py-2 flex flex-col items-center justify-center">
          <button className="bg-purple-500 rounded-md text-white font-medium text-sm px-2 py-1 flex items-center"
                  onClick={copyUrl}>
            Copy URL to add to your calendar <CalendarIcon className="w-4 h-4 ml-1" />
          </button>
          {message && (
            <div className="py-1 text-sm text-purple-800 font-medium">{message}</div>
          )}
        </div>
      )}

      <div className="py-4 justify-between flex items-center">
        <input placeholder="Search..."
               className="px-2"
               value={filter}
               onChange={(event) => setFilter(event.target.value)}
        />
        <label className="text-sm flex items-center rounded-md py-1 flex items-center justify-center">
          <div className="mr-1.5">Show:</div>
          <select value={showFilter} className="text-center p-1 font-medium rounded-full bg-gray-100"
                  onChange={event => setShowFilter(event.target.value)}>
            <option value="ALL">All</option>
            <option value="ONLY_MINE">Only mine</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 gap-5">
        {days.map(([day, performances]: [string, any[]]) => (
          <div key={day} className="grid grid-cols-1 gap-2">
            <div className="font-medium text-sm sticky top-0 bg-white py-1">{day}</div>
            {performances.map(performance => {

              return (
                <div
                  key={performance.id}
                  data-name={performance.name}
                  data-blocks={performance.blocks}
                  data-minutes={performance.minutes}
                  className="flex flex-col bg-white rounded-md border px-1.5 py-0.5 transition-all shadow-sm overflow-hidden"
                >
                  <div className="whitespace-nowrap overflow-hidden text-ellipsis capitalize pt-0.5">
                              <span className="font-medium">
                                {performance.name.toLowerCase()}{' '}
                              </span>
                    <div className="text-xs pb-0.5">
                      <span className="capitalize">{performance.stage.toLowerCase()} - </span>{' '}
                      {format(performance.start, 'eee H:mm')} -{' '}
                      {format(performance.end, 'H:mm')}
                    </div>
                  </div>
                  <div className="h-3 gap-1 justify-start mt-0.5 mb-1 flex items-center">
                    <div className="grid grid-flow-col items-center">
                      {users.filter(user => user.choices?.includes(performance.id)).map((user, index) => {
                        return (
                          <div key={index}
                               className="rounded-full w-3 h-3 bg-green-300 overflow-hidden -mr-1">
                            {user.photoURL && (
                              <img src={user.photoURL} alt={user.displayName.substring(0, 1)} />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="ml-1 text-[11px] whitespace-nowrap text-ellipsis overflow-hidden">
                      {users.filter(user => user.choices?.includes(performance.id)).map(({ displayName }) => displayName?.split(' ')[0]).filter(Boolean).join(', ')}
                    </div>
                  </div>
                </div>
              )

            })}
          </div>
        ))}
      </div>
    </div>
  )
}
