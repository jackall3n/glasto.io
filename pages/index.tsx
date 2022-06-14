import React, { useEffect, useMemo, useState } from 'react';
import { setDoc } from 'firebase/firestore';
import { orderBy } from 'lodash';
import { CalendarIcon, ViewListIcon } from '@heroicons/react/outline';
import ListView from '../components/ListView';
import CalendarView from "../components/CalendarView";
import { IUser } from '../types/user';
import { useCollection } from "../hooks/useCollection";
import { useAuth } from "../providers/AuthProvider";
import { usePerformances } from "../hooks/usePerformances";

export function Home() {
  const [authUser, login] = useAuth();

  const [performances, isLoading] = usePerformances();

  const [users] = useCollection<IUser>('users');
  const user = useMemo(() => users.find(u => u.id === authUser?.uid), [users, authUser])

  const [view, setView] = useState('CALENDAR')

  const choices = user?.choices ?? []

  //
  // useEffect(() => {
  //   if (choices.length) {
  //     return;
  //   }
  //
  //   const userChoices = orderBy(user?.choices ?? []);
  //
  //   setChoices(choices => {
  //     if (JSON.stringify(choices) !== JSON.stringify(userChoices)) {
  //       return userChoices
  //     }
  //
  //     console.log('same');
  //
  //     return choices
  //   });
  // }, [user?.choices])

  async function onClick(id: string) {
    if (!authUser) {
      await login()
      return;
    }

    const updated = choices.includes(id) ? choices.filter(c => c !== id) : [...choices, id];
    const ids = performances.filter(({ id }) => updated.includes(id)).map(({ id }) => id)

    await setDoc(user.ref, { choices: orderBy(ids) }, {
      merge: true,
    })
  }

  return (
    <div>
      <div className="flex justify-center items-center justify-between px-3">
        <div />
        <div className="whitespace-nowrap overflow-hidden text-ellipsis text-sm py-2 font-medium">
          {user?.displayName?.split(' ')[0] ? (
            <div className="flex justify-center items-center">
              <span>{user.displayName.split(' ')[0]}</span>
              <img src={user.photoURL} alt={user.displayName} className="w-4 h-4 rounded-full overflow-hidden ml-1" />
            </div>
          ) : <button onClick={login}>Login</button>}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center">Loading...</div>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-2">
            <button onClick={() => setView("CALENDAR")} className="flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>Calendar</span>
            </button>
            <button onClick={() => setView("LIST")} className="flex items-center justify-center">
              <span>List</span>
              <ViewListIcon className="w-4 h-4 ml-2" />
            </button>
          </div>

          {view === 'CALENDAR' &&
              <CalendarView user={user} users={users} performances={performances} onClick={onClick} />}
          {view === 'LIST' && <ListView users={users} performances={performances} />}
        </>
      )}
    </div>
  );
}

export default Home;
