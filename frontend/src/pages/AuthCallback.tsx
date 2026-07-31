import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { writeToken, writeUser } from "@/domain/auth/store";
import { getMe } from "@/api/auth/auth";
import GlobalLoader from "@/components/loaders/GlobalLoader";

/**
 * Handles the redirect from the backend Steam OpenID callback.
 * URL: /auth/callback?token=<jwt>
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const token = params.get("token");
    if (!token) {
      navigate("/login");
      return;
    }
    writeToken(token);
    getMe()
      .then((user) => {
        writeUser(user);
        navigate("/");
      })
      .catch(() => {
        navigate("/login");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <GlobalLoader />;
}
