import React from 'react';
import { IUser } from '../types/user';
import { useCollection } from "../hooks/useCollection";
import GroupPage from "../components/GroupPage";

export default function Page() {
  const [users] = useCollection<IUser>("users");

  return <GroupPage users={users} />;
};
