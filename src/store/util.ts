import dbProm from 'main/store/idb'

export const idbWriter = <T extends string = string>(key: T) => async (
  value: any
) => (await dbProm).put('meta', value, key as string)
