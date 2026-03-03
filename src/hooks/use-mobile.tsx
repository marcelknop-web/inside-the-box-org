import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const check = () => {
      // Use the smaller dimension so landscape mobile is still detected
      const minDim = Math.min(window.innerWidth, window.innerHeight)
      setIsMobile(minDim < MOBILE_BREAKPOINT)
    }
    window.addEventListener("resize", check)
    check()
    return () => window.removeEventListener("resize", check)
  }, [])

  return !!isMobile
}
