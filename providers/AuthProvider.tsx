import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { GoogleAuthProvider, onAuthStateChanged, onIdTokenChanged, signInWithRedirect, User } from "firebase/auth";
import { auth } from "../firebase/auth";
import nookies from "nookies";
import axios from "axios";

export const AuthContext = createContext<[User, () => void]>({} as never)

export const useAuth = () => useContext(AuthContext);

interface Props {
}

const provider = new GoogleAuthProvider();

export default function AuthProvider({ children }: PropsWithChildren<Props>) {
  const [user, setUser] = useState<User>();

  useEffect(() => {
    return onAuthStateChanged(auth, async user => {
      setUser(user)
    })
  }, [])

  useEffect(() => {
    return onIdTokenChanged(auth, async user => {
      const token = user ? await user.getIdToken() : undefined;

      if (token) {
        nookies.set(undefined, 'GLASTO_AUTH_TOKEN', token, { page: '/' })
      } else {
        nookies.destroy(undefined, 'GLASTO_AUTH_TOKEN', { page: '/' })
      }
    })
  }, [])

  useEffect(() => {
    if (!user?.uid) {
      return
    }

    axios.get('/api/spotify/update', { params: { id: user.uid } }).then()
  }, [user?.uid])

  async function login() {
    await signInWithRedirect(auth, provider)
  }

  return (
    <AuthContext.Provider value={[user, login]}>
      {children}
    </AuthContext.Provider>
  )
}
