import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithRedirect, User } from "firebase/auth";
import { auth } from "../firebase/auth";

export const AuthContext = createContext<[User, () => void]>({} as never)

export const useAuth = () => useContext(AuthContext);

interface Props {
}

const provider = new GoogleAuthProvider();

export default function AuthProvider({ children }: PropsWithChildren<Props>) {
  const [user, setUser] = useState<User>();

  useEffect(() => {
    return onAuthStateChanged(auth, user => {
      setUser(user)
    })
  }, [])

  async function login() {
    await signInWithRedirect(auth, provider)
  }

  return (
    <AuthContext.Provider value={[user, login]}>
      {children}
    </AuthContext.Provider>
  )
}
