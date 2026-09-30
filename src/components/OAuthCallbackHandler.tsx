import { useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { OAUTH_FLOW_FINISHED_EVENT } from "../lib/auth";
import {
  listenForOAuthDeepLinks,
  type OAuthCallbackResult,
} from "../lib/deep-link";

export default function OAuthCallbackHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    let stopListening: (() => void) | undefined;

    const onResult = (result: OAuthCallbackResult) => {
      if (!active || result.status === "ignored" || result.status === "duplicate") {
        return;
      }

      window.dispatchEvent(new Event(OAUTH_FLOW_FINISHED_EVENT));

      if (result.status === "success") {
        toast.success("Google 登入成功");
        navigate("/schoice", { replace: true });
      } else {
        toast.error(result.message);
        navigate("/login", { replace: true });
      }
    };

    void listenForOAuthDeepLinks(onResult)
      .then((unlisten) => {
        if (active) stopListening = unlisten;
        else unlisten();
      })
      .catch(() => {
        if (active) toast.error("無法啟動登入回呼監聽，請重新啟動應用程式。");
      });

    return () => {
      active = false;
      stopListening?.();
    };
  }, [navigate]);

  return null;
}
