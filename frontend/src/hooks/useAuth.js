import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { tokenStorage } from "../utils/tokenStorage";

import { useLazyGetMeQuery, useLoginMutation, useLogoutMutation } from "../store/api/authApi";
import {
  credentialsReceived,
  loggedOut,
  selectAccessToken,
  selectAuthStatus,
  selectCurrentUser,
  sessionCheckStarted,
  userLoaded,
} from "../store/slices/authSlice";

export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const status = useSelector(selectAuthStatus);
  const accessToken = useSelector(selectAccessToken);

  const [loginMutation, loginState] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();
  const [fetchMe] = useLazyGetMeQuery();

  // On first load: if a token survived a page refresh, validate it against
  // /auth/me/ before deciding the user is actually logged in. Runs once.
  useEffect(() => {
    if (status !== "idle") return;

    if (!accessToken) {
      dispatch(loggedOut());
      return;
    }

    dispatch(sessionCheckStarted());
    fetchMe()
      .unwrap()
      .then((me) => dispatch(userLoaded(me)))
      .catch(() => dispatch(loggedOut()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const login = async (credentials) => {
    const result = await loginMutation(credentials).unwrap();
    dispatch(credentialsReceived(result));
    return result;
  };

  const logout = async () => {
    const refresh = tokenStorage.getRefresh();
    try {
      await logoutMutation(refresh).unwrap();
    } finally {
      dispatch(loggedOut());
    }
  };

  return {
    user,
    status, // 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
    isAuthenticated: status === "authenticated",
    isBootstrapping: status === "idle" || status === "loading",
    login,
    loginState, // { isLoading, error } for the login form to read
    logout,
  };
}
