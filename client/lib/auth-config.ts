export const isDevelopmentAuthBypassEnabled =
   process.env.NODE_ENV === 'development' &&
   (process.env.DEV_BYPASS_AUTH === 'true' ||
      process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true');