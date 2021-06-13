import { APICall as API } from '../client'
import mGoogleSignin from 'gql/mutations/signInGoogle.gql'
import mPasswordSignIn from 'gql/mutations/signIn.gql'
import mPasswordSignUp from 'gql/mutations/signUp.gql'
import mSubscribe from 'gql/mutations/subscribe.gql'
import mUnsubscribe from 'gql/mutations/unsubscribe.gql'
import mParse from 'gql/mutations/parse.gql'
import mDelete from 'gql/mutations/delete.gql'
import mSignOut from 'gql/mutations/signOut.gql'
import mAddWpSub from 'gql/mutations/wpSub.gql'
import mRemoveWpSub from 'gql/mutations/wpUnsub.gql'
import mWpPodSub from 'gql/mutations/wpPodSub.gql'
import mWpPodUnsub from 'gql/mutations/wpPodUnsub.gql'
import mCover from 'gql/mutations/processCover.gql'

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

export const unsubscribe = API<'Unsubscribe'>(
  mUnsubscribe
)((...ids: string[]) => ({ ids }))

export const parse = API<'Parse'>(mParse)((id: string) => ({ id }))

export const deletePodcast = API<'Delete'>(mDelete)((id: string) => ({ id }))

export const wpSub = API<'AddWebPushSubscription'>(
  mAddWpSub
)((sub: string) => ({ sub }))

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
