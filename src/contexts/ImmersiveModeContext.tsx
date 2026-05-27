import { createContext, useContext, useState, type ReactNode } from 'react'

interface ImmersiveModeContextValue {
  isImmersive: boolean
  setImmersive: (value: boolean) => void
}

const ImmersiveModeContext = createContext<ImmersiveModeContextValue>({
  isImmersive: false,
  setImmersive: () => {},
})

export function ImmersiveModeProvider({ children }: { children: ReactNode }) {
  const [isImmersive, setImmersive] = useState(false)
  return (
    <ImmersiveModeContext.Provider value={{ isImmersive, setImmersive }}>
      {children}
    </ImmersiveModeContext.Provider>
  )
}

export function useImmersiveMode() {
  return useContext(ImmersiveModeContext)
}
