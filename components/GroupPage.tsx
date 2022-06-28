import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { orderBy } from 'lodash';
import { CalendarIcon, ViewListIcon, MapIcon } from '@heroicons/react/outline';
import ListView from '../components/ListView';
import MapView from "../components/MapView";
import CalendarView from "../components/CalendarView";
import { IGroup, IUser } from '../types/user';
import { TDecorated } from "../hooks/useCollection";
import { useAuth } from "../providers/AuthProvider";
import { usePerformances } from "../hooks/usePerformances";
import { useDocument } from "../hooks/useDocument";
import { arrayUnion, Timestamp } from 'firebase/firestore';

interface Props {
  group?: IGroup
  users: TDecorated<IUser>[]
}

export function GroupPage({ users, group }: Props) {
  const [authUser, login] = useAuth();
  const { push, pathname } = useRouter();

  const [performances] = usePerformances();

  const [user, loading, doc, updateUser] = useDocument<IUser>("users", authUser?.uid);

  const [view, setView] = useState('CALENDAR')

  useEffect(() => {
    if (authUser) {
      updateUser({
        photoURL: authUser.photoURL,
        displayName: authUser.displayName,
        lastSeen: Timestamp.fromDate(new Date())
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

    const update: Partial<IUser> = {
      choices: orderBy(ids),
      lastSeen: Timestamp.fromDate(new Date())
    }

    if (group) {
      update.groups = arrayUnion(group.id) as any;
    }

    await updateUser(update);
  }

  async function spotifyLogin() {
    await push({
      pathname: '/api/spotify/login',
      query: {
        redirect: pathname
      }
    })
  }

  async function removeSpotify() {
    await updateUser({
      spotify: null
    })
  }

  const isLoading = !Boolean(performances.length);

  return (
    <div>
      <div className="flex justify-center items-center justify-between px-3">
        <div />
        <div className="whitespace-nowrap overflow-hidden text-ellipsis text-sm py-2 font-medium flex">
          {user && (
            <>
              {!user.spotify && (
                <button onClick={spotifyLogin}
                        className="mr-3 text-green-500 flex items-center underline justify-center">
                  <img alt="Spotify" src="https://cdn.worldvectorlogo.com/logos/spotify-2.svg"
                       className="w-4 h-4 mr-1" />

                  Link Spotify
                </button>
              )}
              {user.spotify && (
                <button onClick={removeSpotify} className="mr-3 text-green-500 flex items-center justify-center">
                  <img alt="Spotify" src="https://cdn.worldvectorlogo.com/logos/spotify-2.svg"
                       className="w-4 h-4 mr-1" />

                  Spotify Linked
                </button>
              )}
            </>
          )}

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
          <div className="grid grid-cols-3">
            <button onClick={() => setView("CALENDAR")} className="flex items-center justify-center">
                          <span>Calendar</span>
              <CalendarIcon className="w-4 h-4 ml-2" />
            </button>
            <button onClick={() => setView("LIST")} className="flex items-center justify-center">
              <span>List</span>
              <ViewListIcon className="w-4 h-4 ml-2" />
            </button>
            <button onClick={() => setView("MAP")} className="flex items-center justify-center">
              <span>Map</span>
              <MapIcon className="w-4 h-4 ml-2" />
            </button>
          </div>

          {view === 'CALENDAR' &&
              <CalendarView user={user} users={users} performances={performances} onClick={onClick} />}
          {view === 'LIST' && <ListView users={users} performances={performances} user={user} />}

          {view === 'MAP' && <MapView users={users} />}
        </>
      )}
    </div>
  );
}

export default GroupPage
