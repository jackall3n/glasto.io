import React, { useMemo } from 'react';
import { IGroup, IUser } from '../types/user';
import { useCollection } from "../hooks/useCollection";
import { useAuth } from "../providers/AuthProvider";
import { useDocument } from "../hooks/useDocument";
import { Timestamp, where } from 'firebase/firestore';
import { useRouter } from 'next/router';
import GroupPage from "../components/GroupPage";

interface Props {
  group: IGroup
}

export function Group({ group }: Props) {
  const query = useMemo(() => where('groups', "array-contains", group.id), [group.id]);

  const [users] = useCollection<IUser>("users", query);

  return <GroupPage users={users} group={group} />
}

export function GroupValidationPage({ id }) {
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

  return <Group group={group} />
}

export default function Page() {
  const { query } = useRouter();

  if (query.group) {
    return <GroupValidationPage id={query.group as string} />
  }

  return null;
};
