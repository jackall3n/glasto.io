import React, { useEffect, useMemo, useState } from 'react';
import { orderBy } from 'lodash';
import { CalendarIcon, ViewListIcon } from '@heroicons/react/outline';
import ListView from '../components/ListView';
import CalendarView from "../components/CalendarView";
import { IGroup, IUser } from '../types/user';
import { useCollection } from "../hooks/useCollection";
import { useAuth } from "../providers/AuthProvider";
import { usePerformances } from "../hooks/usePerformances";
import { useDocument } from "../hooks/useDocument";
import { arrayUnion, Timestamp, where } from 'firebase/firestore';
import { useRouter } from 'next/router';

interface Props {
  group: IGroup
}

export function Home({ group }: Props) {
  const [authUser, login] = useAuth();

  const [performances, isLoading] = usePerformances();

  console.log({ group });

  const userGroup = useMemo(() => where('groups', "array-contains", group.id), [group.id]);

  const [users] = useCollection<IUser>("users", userGroup);
  const [user, loading, doc, updateUser] = useDocument<IUser>("users", authUser?.uid);

  const [view, setView] = useState('CALENDAR')

  useEffect(() => {
    if (authUser) {
      updateUser({
        photoURL: authUser.photoURL,
        displayName: authUser.displayName,
      })
    }
  }, [authUser]);

  const choices = user?.choices ?? []

  async function onClick(id: string) {
    if (!authUser) {
      await login()
      return;
    }

    const updated = choices.includes(id) ? choices.filter(c => c !== id) : [...choices, id];
    const ids = performances.filter(({ id }) => updated.includes(id)).map(({ id }) => id);

    await updateUser({ groups: arrayUnion(group.id) as any, choices: orderBy(ids) });
  }

  return (
    <div>
      <div className="flex justify-center items-center justify-between px-3">
        <div />
        <div className="whitespace-nowrap overflow-hidden text-ellipsis text-sm py-2 font-medium">
          {user?.displayName?.split(' ')[0] ? (
            <div className="flex justify-center items-center">
              <span>{user.displayName.split(' ')[0]}</span>
              {user.photoURL && (
                <img src={user.photoURL} alt={user.displayName} className="w-4 h-4 rounded-full overflow-hidden ml-1" />
              )}
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
          {view === 'LIST' && <ListView users={users} performances={performances} user={user} />}
        </>
      )}
    </div>
  );
}

export function GroupPage({ id }) {
  const [group, isValidating, , update] = useDocument<IGroup>("groups", id);
  const [authUser] = useAuth();

  async function onCreate() {
    const group = {
      createdOn: Timestamp.fromDate(new Date()),
      createdBy: {
        id: authUser?.uid ?? null,
        name: authUser?.displayName ?? 'anonymous'
      }
    }

    await update(group);
  }

  if (isValidating) {
    return (
      <div />
    )
  }

  if (!group) {


    return (
      <div className="flex flex-col items-center p-10">

        <div>This group doesn{"'"}t exist, would you like to create it?</div>

        <button className="p-2 px-5 rounded-md bg-purple-500 text-white text-sm uppercase font-medium mt-2"
                onClick={onCreate}>Create
        </button>
      </div>
    )
  }

  return <Home group={group} />
}

export default function Page() {
  const { query } = useRouter();

  if (query.group) {
    return <GroupPage id={query.group as string} />
  }

  return null;
};
