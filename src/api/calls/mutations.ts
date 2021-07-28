import { APICall as API } from '../client'
import mGoogleSignin from 'app/gql/mutations/signInGoogle.gql'
import mPasswordSignIn from 'app/gql/mutations/signIn.gql'
import mPasswordSignUp from 'app/gql/mutations/signUp.gql'
import mSubscribe from 'app/gql/mutations/subscribe.gql'
import mUnsubscribe from 'app/gql/mutations/unsubscribe.gql'
import mParse from 'app/gql/mutations/parse.gql'
import mDelete from 'app/gql/mutations/delete.gql'
import mSignOut from 'app/gql/mutations/signOut.gql'
import mAddWpSub from 'app/gql/mutations/wpSub.gql'
import mRemoveWpSub from 'app/gql/mutations/wpUnsub.gql'
import mWpPodSub from 'app/gql/mutations/wpPodSub.gql'
import mWpPodUnsub from 'app/gql/mutations/wpPodUnsub.gql'
import mCover from 'app/gql/mutations/processCover.gql'

export const signInGoogle = API<'SignInGoogle'>(mGoogleSignin)(
  (accessToken: string, wpSub?: string) => ({ accessToken, wpSub }),
  ({ signInGoogle }) => signInGoogle
)

export const signInPassword = API<'SignInPassword'>(mPasswordSignIn)(
  (ident: string, password: string) => ({ ident, password }),
  ({ signIn }) => signIn
)

export const signUpPassword = API<'SignUp'>(mPasswordSignUp)(
  (ident: string, password: string) => ({ ident, password }),
  ({ signUp }) => signUp
)

export const signOut = API(mSignOut)(
  () => undefined as any,
  () => undefined
)

export const subscribe = API<'Subscribe'>(mSubscribe)((...ids: string[]) => ({
  ids,
}))

export const unsubscribe = API<'Unsubscribe'>(mUnsubscribe)(
  (...ids: string[]) => ({ ids })
)

export const parse = API<'Parse'>(mParse)((id: string) => ({ id }))

export const deletePodcast = API<'Delete'>(mDelete)((id: string) => ({ id }))

export const wpSub = API<'AddWebPushSubscription'>(mAddWpSub)(
  (sub: string) => ({ sub })
)

export const wpUnsub = API<'RemoveWebPushSubscription'>(mRemoveWpSub)(
  (sub: string) => ({
    sub,
  })
)

export const wpPodSub = API<'wpSubPodcast'>(mWpPodSub)((id: string) => ({ id }))

export const wpPodUnsub = API<'wpUnsubPodcast'>(mWpPodUnsub)((id: string) => ({
  id,
}))

export const processCover = API<'ProcessCover'>(mCover)((id: string) => ({
  id,
}))
