import { format } from "date-fns";
import React from "react";
import { groupBy, orderBy } from "lodash";

export default function ListView({ choices, performances, users }) {
  const selected = orderBy(choices.map((choice) => performances.find(({ id }) => choice === id)).filter(Boolean), 'start');

  const days = Object.entries(groupBy(selected, 'day'));

  return (
    <div className="p-5 grid grid-cols-1 gap-5 container mx-auto max-w-[750px]">
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

                  <div className="ml-1 text-[11px]">
                    {users.filter(user => user.choices?.includes(performance.id)).map(({ displayName }) => displayName?.split(' ')[0]).filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
            )

          })}
        </div>
      ))}
    </div>
  )
}
