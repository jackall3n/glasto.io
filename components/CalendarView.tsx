import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  isAfter
} from 'date-fns';
import { groupBy, orderBy, startCase, uniq } from 'lodash';
import classnames from 'classnames';

const HOUR_WIDTH = 240;
const BLOCK_WIDTH = HOUR_WIDTH / 4;

const DAYS = [
  // 'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
];

export function CalendarView({ performances, user, users, onClick }) {
  const [filter, setFilter] = useState<string>('');
  const [showFilter, setShowFilter] = useState('ALL');

  const friends = useMemo(() => users.filter(u => u.id !== user?.id), [users, user])

  const [selectedDay, setDay] = useState<string>();

  const selected = useMemo(() => uniq(users.map(({ choices }) => choices).flat(Infinity)), [users]) 

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
  const days = Array.from(new Set(performances.filter(p => isAfter(p.start, addHours(new Date(), -4))).map(({ day }) => day)));
  
    const filtered = performances
      .filter(({ day }) => day === (selectedDay ?? days[0]))
      .filter(({ name }) => (!filter || name.toLowerCase().includes(filter?.toLowerCase())))
      .filter(({ id }) => {
        if (showFilter === 'ONLY_MINE') {
          return user?.choices?.includes(id);
        }

        if (showFilter === 'ONLY_SELECTED') {
          return selected.includes(id);
        }

        return true;
      })
      .filter(p => p.blocks > 0)
      //.filter(p => isAfter(p.start, addHours(new Date(), -4)));

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
  }, [selectedDay, performances, filter, showFilter, selected]);

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

  const ref = useRef<HTMLDivElement>(null);

  const [scroll, setScroll] = useState(0);

  function onScroll(target: any) {
    const visibleRight = Math.min(target.scrollLeft + target.offsetWidth, target.scrollWidth) + 100

    setScroll(visibleRight);
  }

  useEffect(() => {
    if (showNow) {
    const width = ref.current.offsetWidth;
    const { left } = ref.current.getBoundingClientRect();
    
    const screenWidth = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;
    const scroll = nowMargin + ((screenWidth / 2) - left);
       ref.current.scrollTo(scroll, 0)
    }
    
    setTimeout(() => onScroll(ref.current));
  }, [ref.current, selectedDay]);

  function onSetDay(day: string) {
    // ref.current.scrollTo(0, 0)
    setDay(day)
  }
  
  const nowMargin = Math.abs(differenceInMinutes(new Date(), first) / 5) * (BLOCK_WIDTH / 3);
  const showNow = isSameDay(first, addHours(new Date(), -6));

  return (
    <>
      <div className="p-4 justify-between flex items-center">
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
      <div className="grid grid-flow-col gap-2 sm:gap-3 py-2 px-2">
        {days.map((day: string, index) => (
          <button
            key={day}
            className={classnames('btn', { selected: day === (selectedDay ?? days[0] )})}
            onClick={() => onSetDay(day)}
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

          <div data-main={true} className="relative overflow-x-scroll" ref={ref}
               key={selectedDay}
               onScroll={(event) => onScroll(event.target)}>
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

              {showNow && (
                <div className="w-0.5 bg-blue-500 absolute top-0 bottom-0 left-0"
                     style={{ marginLeft: `${nowMargin}px` }}>
                  <div className="absolute rounded-full bg-blue-500 w-2 h-2 -left-[3px] -top-2 z-20" />
                </div>
              )}

              {stages.map(([stage, performances]: [string, any[]]) => {
                return (
                  <div key={stage} className="h-12 relative">
                    {performances.map((performance, index) =>

                      <Performance performance={performance} key={performance.id} onClick={onClick} users={users}
                                   user={user} scroll={scroll} />
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

function Performance({ performance, onClick, user, users, scroll }) {
  const marginLeft = BLOCK_WIDTH * performance.previousBlocks;
  const hide = marginLeft > scroll;

  const [show, setShow] = useState(!hide);

  useEffect(() => {
    if (show) {
      return;
    }

    setTimeout(() => setShow(!hide), 10)
  }, [hide, show])

  if (hide && !show) {
    return null;
  }

  return (
    <div
      key={performance.id}
      data-name={performance.name}
      data-blocks={performance.blocks}
      data-minutes={performance.minutes}
      className={classnames("performance transition ease-in duration-150", { 'opacity-0': !show, 'opacity-100': show })}
      style={{
        marginLeft: `${marginLeft}px`,
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

          <div className="ml-1 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">
            {users.filter(user => user.choices?.includes(performance.id)).map(({ displayName }) => displayName?.split(' ')[0]).filter(Boolean).join(', ')}
          </div>
        </div>
      </div>
    </div>
  )
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
