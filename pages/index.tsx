import useSWR from 'swr';
import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, query, setDoc } from 'firebase/firestore';
import {
  addHours,
  differenceInHours,
  differenceInMinutes,
  endOfHour,
  format,
  max,
  min,
  parseISO,
  startOfHour,
} from 'date-fns';
import { groupBy, orderBy, startCase } from 'lodash';
import classnames from 'classnames';
import { db } from '../db';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithRedirect, User } from "firebase/auth";

const provider = new GoogleAuthProvider();
const auth = getAuth();

async function fetcher() {
  const response = await fetch('/api/performances');

  return response.json();
}

const c = collection(db, 'users')

export function Home() {
  const { data: performances = [] } = useSWR('performances', fetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  const [user, setUser] = useState<User>(undefined);
  const [users, setUsers] = useState([]);

  const choices = useMemo(() => {
    return users.find(u => u.id === user.uid)?.choices ?? []
  }, [user, users])

  async function login() {
    await signInWithRedirect(auth, provider)
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(
          user
        )
      } else {
        setUser(undefined)
      }
    });
  }, []);

  useEffect(() => {
    return onSnapshot(query(c), snapshot => {
      setUsers(snapshot.docs.map(e => ({
        id: e.id,
        ...e.data()
      })))
    })
  }, []);

  async function onClick(id: string) {
    if (!user?.uid) {
      await login()
      return;
    }

    const { choices = [] } = users.find(u => u.id === user.uid) ?? {}

    const updated = choices.includes(id) ? choices.filter(c => c !== id) : [...choices, id];

    await setDoc(doc(c, user.uid), {
      photoURL: user.photoURL,
      displayName: user.displayName,
      choices: orderBy(updated)
    }, {
      merge: false
    })
  }

  const [selectedDay, setDay] = useState('FRIDAY');

  const filtered = performances.filter(({ day }) => day === selectedDay);

  const firstPerformance = min(
    filtered.map(({ start }) => startOfHour(parseISO(start)))
  );
  const lastPerformance = max(
    filtered.map(({ end }) => endOfHour(parseISO(end)))
  );

  const stages = Object.entries(groupBy(filtered, 'stage'));

  const hours =
    Math.abs(differenceInHours(firstPerformance, lastPerformance)) + 1;
  const minutes =
    Math.abs(differenceInMinutes(firstPerformance, lastPerformance)) + 15;

  const blocks = Math.floor(minutes / 15);
  const hourWidth = 240;
  const fiveMinuteWith = hourWidth / 4;

  const days = Array.from(new Set(performances.map(({ day }) => day)));
  const DAYS = [
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
    'MONDAY',
  ];

  return (
    <div>
      <div className="flex justify-center items-center justify-between px-5">
        <div className="grid grid-flow-col gap-2 sm:gap-3 py-5">
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

        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
          {user?.displayName ?? <button onClick={login}>Login</button>}
        </div>

      </div>

      {Boolean(hours && minutes) && (
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
                  className="h-12 text-xs md:text-base flex items-center px-2"
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
                className="divide-x sticky top-0"
                style={{ width: `${hourWidth * hours}px` }}
              >
                {Array.from(Array(hours)).map((_, index) => (
                  <div
                    key={index}
                    data-hour={format(
                      addHours(firstPerformance, index),
                      'haaa'
                    )}
                    className="pl-1 border-b-2 h-8 inline-block"
                    style={{ width: `${hourWidth}px` }}
                  >
                    <div className="text-sm font-medium">
                      {format(addHours(firstPerformance, index), 'haaa')}
                    </div>
                  </div>
                ))}
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
                      style={{ minWidth: `${fiveMinuteWith}px` }}
                    />
                  ))}
                </div>

                {stages.map(([stage, performances]: [string, any[]]) => {
                  const mapped = mapPerformances(
                    performances,
                    firstPerformance,
                    lastPerformance
                  );

                  return (
                    <div key={stage} className="h-12 relative">
                      {mapped.map((performance, index) => (
                        <div
                          key={performance.id}
                          data-name={performance.name}
                          data-blocks={performance.blocks}
                          data-minutes={performance.minutes}
                          className="performance"
                          style={{
                            marginLeft: `${
                              fiveMinuteWith * performance.previousBlocks
                            }px`,
                            width: `${fiveMinuteWith * performance.blocks}px`,
                          }}
                          onClick={() => onClick(performance.id)}
                        >
                          <div
                            className={classnames("performance-pill overflow-hidden", {
                              selected: choices.includes(performance.id)
                            })}
                            style={{
                              minWidth: `${
                                fiveMinuteWith * performance.blocks
                              }px`,
                            }}
                          >
                            <div className="whitespace-nowrap overflow-hidden text-ellipsis capitalize">
                              <span className="font-medium">
                                {performance.name.toLowerCase()}{' '}
                              </span>
                              <span className="text-xs">
                                {format(performance.start, 'H:mm')} -{' '}
                                {format(performance.end, 'H:mm')}
                              </span>
                            </div>
                            <div className="h-3 grid grid-flow-col gap-1 justify-start">
                              {users.filter(user => user.choices?.includes(performance.id)).map((user, index) => {
                                return (
                                  <div key={index} className="rounded-full w-3 h-3 bg-green-300 overflow-hidden">
                                    {user.photoURL && (
                                      <img src={user.photoURL} alt={user.displayName.substring(0, 1)} />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function mapPerformances(performances: any[], startDate: Date, endDate: Date) {
  const mapped = performances.map((performance) => {
    const start = parseISO(performance.start);
    const end = parseISO(performance.end);
    const minutes = differenceInMinutes(end, start);
    const blocks = minutes / 15;

    return {
      ...performance,
      start,
      end,
      minutes,
      blocks,
    };
  });

  const filtered = mapped.filter((performance) => performance.blocks > 0);

  const ordered = orderBy(filtered, 'start', 'asc');

  const results = ordered.map((performance, index, performances) => {
    const previous = startDate;
    const next = performances[index + 1]?.start ?? endDate;

    const previousMinutes = differenceInMinutes(performance.start, previous);
    const previousBlocks = Math.max(previousMinutes / 15, 0);

    const nextMinutes = differenceInMinutes(next, performance.end);
    const nextBlocks = Math.max(nextMinutes / 15, 0);

    return {
      ...performance,
      previousMinutes,
      previousBlocks,
      nextMinutes,
      nextBlocks,
    };
  });

  return results;
}

export default Home;
