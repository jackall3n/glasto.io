import React, { useEffect, useMemo, useState } from 'react';
import {
  addHours,
  addMinutes,
  areIntervalsOverlapping,
  differenceInHours,
  differenceInMinutes,
  endOfHour,
  format,
  isSameDay,
  max,
  min,
  startOfHour,
} from 'date-fns';
import { groupBy, orderBy, startCase, uniqBy } from 'lodash';
import classnames from 'classnames';
import { IPerformance } from "../types/performance";
import { IUser } from "../types/user";

const HOUR_WIDTH = 240;
const BLOCK_WIDTH = HOUR_WIDTH / 4;

const DAYS = [
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
];

export function CalendarView({ performances, user, users, onClick }) {
  const [filter, setFilter] = useState<string>('');
  const [showSelected, setShowSelected] = useState(false);

  const friends = useMemo(() => users.filter(u => u.id !== user?.id), [users, user])

  const [selectedDay, setDay] = useState('FRIDAY');

  const selected = useMemo(() => uniqBy(users.map(({ choices }) => choices).flat(Infinity)), [users])

  const {
    first,
    last,
    hours,
    minutes,
    blocks,
    stages,
    days,
    mapped
  } = useMemo(() => {
    const filtered = performances
      .filter(({ day }) => day === selectedDay)
      .filter(({ name }) => (!filter || name.toLowerCase().includes(filter?.toLowerCase())))
      .filter(({ id }) => (!showSelected || selected.includes(id)))
      .filter(p => p.blocks > 0);

    const first = min(filtered.map(({ start }) => startOfHour(start)));
    const last = max(filtered.map(({ end }) => endOfHour(end)));

    const hours = (Math.abs(differenceInHours(first, last)) + 1 || 0)
    const minutes = (Math.abs(differenceInMinutes(first, last)) + 15 || 0);
    const blocks = Math.floor(minutes / 15);

    const mapped = mapPerformances(
      filtered,
      first
    );

    const stages = Object.entries(groupBy(mapped, 'stage'));

    const days = Array.from(new Set(performances.map(({ day }) => day)));

    return {
      first,
      last,
      hours,
      minutes,
      blocks,
      mapped,
      stages,
      days,
    }
  }, [selectedDay, performances, filter, showSelected, selected]);

  const friendChoices = useMemo(() => {
    const friendChoices = friends.map(({ choices }) => choices ?? []).flat(Infinity) as string[];

    return orderBy(mapped.filter(({ id }) => friendChoices.includes(id)), 'start');
  }, [friends, mapped])

  const activity = useMemo(() => {
    const choices = user?.choices ?? [];
    const selected = orderBy(mapped.filter(({ id }) => choices.includes(id)), 'start')

    let current: Date = first;

    const blocks = [];

    let cu = { margin: 0, blocks: 0, type: "" }

    while (current < last) {
      const next = addMinutes(current, 5);

      const sel = selected.filter(e => areIntervalsOverlapping({
        start: e.start,
        end: e.end,
      }, {
        start: current,
        end: next
      }));

      if (sel.length === 0) {
        const friends = friendChoices.some(e => areIntervalsOverlapping({
          start: e.start,
          end: e.end,
        }, {
          start: current,
          end: next
        }));

        if (friends) {
          blocks.push({
            blocks: 1,
            type: "friend"
          })
        } else {
          blocks.push({
            blocks: 1,
            type: "empty"
          })
        }
      } else if (sel.length === 1) {
        blocks.push({
          blocks: 1,
          type: "populated"
        })
      } else if (sel.length > 1) {
        blocks.push({
          blocks: 1,
          type: "clash"
        })
      }

      current = next;
    }

    return {
      blocks,
    };
  }, [mapped, first, last, user?.choices, friendChoices])

  return (
    <>
      <div className="p-4 justify-between flex">
        <input placeholder="Search..." value={filter} onChange={(event) => setFilter(event.target.value)} />

        <label className="text-sm flex items-center">
          <input type="checkbox" className="mr-1" onChange={event => setShowSelected(event.target.checked)} />
          <span>Only show selected</span>
        </label>
      </div>
      <div className="grid grid-flow-col gap-2 sm:gap-3 py-2 px-2">
        {DAYS.filter((d) => days.includes(d)).map((day: string) => (
          <button
            key={day}
            className={classnames('btn', { selected: selectedDay === day })}
            onClick={() => setDay(day)}
          >
            <span className="block sm:hidden">{day.substring(0, 3)}</span>
            <span className="sm:block hidden">{day}</span>
          </button>
        ))}
      </div>
      <div className="bg-white overflow-hidden relative">
        <div
          className="grid grid-cols-[100px_1fr] md:grid-cols-[200px_1fr]"
          data-grid={true}
        >
          <div
            className="grid grid-cols-1 w-[100px] md:w-[200px] divide-y sticky left-0 z-50 bg-white overflow-x-scroll"
            data-left={true}
          >
            <div className="bg-white border-r h-8 px-2">Stage</div>
            {stages.map(([stage]) => (
              <div
                key={stage}
                className="h-12 text-xs md:text-base flex items-center px-2 border-r"
              >
                <div
                  key={stage}
                  className="whitespace-nowrap text-ellipsis overflow-hidden"
                >
                  {startCase(stage.toLowerCase())}
                </div>
              </div>
            ))}
          </div>

          <div data-main={true} className="relative overflow-x-scroll">
            <div
              data-header={true}
              className="divide-x relative"
              style={{ width: `${HOUR_WIDTH * hours}px` }}
            >
              {Array.from(Array(hours)).map((_, index) => (
                <div
                  key={index}
                  data-hour={format(
                    addHours(first, index),
                    'haaa'
                  )}
                  className="pl-1 border-b-2 h-8 inline-block"
                  style={{ width: `${HOUR_WIDTH}px` }}
                >
                  <div className="text-sm font-medium">
                    {format(addHours(first, index), 'haaa')}
                  </div>
                </div>
              ))}

              <div className="absolute bottom-0 h-2 right-0 left-0 flex">
                {activity.blocks.map((block, index) => (
                  <div
                    key={index}
                    data-activity={true}
                    className={classnames("bg-opacity-20 h-2 border-l inline-block", {
                      'bg-green-400 border-l-green-500': block.type === 'populated',
                      'border-transparent': block.type === 'empty',
                      'bg-red-400 border-l-red-500': block.type === 'clash',
                      'bg-orange-300 border-l-orange-300': block.type === 'friend',
                    })}
                    style={{
                      width: `${BLOCK_WIDTH * block.blocks}px`,
                      marginLeft: `${BLOCK_WIDTH * block.margin}px`
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex">
                {Array.from(Array(blocks)).map((_, index) => (
                  <div
                    key={index}
                    className={classnames('bg-gray-100', {
                      'border-gray-200 border-l': index % 4 === 0,
                      'border-gray-200 border-l border-dashed':
                        index % 4 !== 0,
                    })}
                    style={{ minWidth: `${BLOCK_WIDTH}px` }}
                  />
                ))}
              </div>

              {isSameDay(first, new Date()) && (
                <div className="w-0.5 bg-blue-500 absolute top-0 bottom-0"
                     style={{ marginLeft: `${Math.abs(differenceInMinutes(new Date(), first) / 5) * BLOCK_WIDTH}px` }}>
                  <div className="absolute rounded-full bg-blue-500 w-2 h-2 -left-[3px] -top-2 z-20" />
                </div>
              )}

              {stages.map(([stage, performances]: [string, any[]]) => {
                return (
                  <div key={stage} className="h-12 relative">
                    {performances.map((performance, index) => (
                        <div
                          key={performance.id}
                          data-name={performance.name}
                          data-blocks={performance.blocks}
                          data-minutes={performance.minutes}
                          className="performance"
                          style={{
                            marginLeft: `${
                              BLOCK_WIDTH * performance.previousBlocks
                            }px`,
                            width: `${BLOCK_WIDTH * performance.blocks}px`,
                          }}
                          onClick={() => onClick(performance.id)}
                        >
                          <div
                            className={classnames("performance-pill overflow-hidden", {
                              selected: user?.choices?.includes(performance.id)
                            })}
                            style={{
                              minWidth: `${
                                BLOCK_WIDTH * performance.blocks
                              }px`,
                            }}
                          >
                            <div className="whitespace-nowrap overflow-hidden text-ellipsis capitalize pt-0.5">
                              <span className="font-medium">
                                {performance.name.toLowerCase()}{' '}
                              </span>
                              <span className="text-xs">
                                {format(performance.start, 'H:mm')} -{' '}
                                {format(performance.end, 'H:mm')}
                              </span>
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
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function mapPerformances(performances: any[], startDate: Date) {
  return performances.map((performance) => {
    const previousMinutes = differenceInMinutes(performance.start, startDate);
    const previousBlocks = Math.max(previousMinutes / 15, 0);

    return {
      ...performance,
      previousMinutes,
      previousBlocks,
    };
  });
}

function getBlocks(from: Date, to: Date) {
  const minutes = differenceInMinutes(to, from);
  return Math.max(minutes / 15, 0);
}

export default CalendarView;
