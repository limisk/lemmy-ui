// import Cookies from 'js-cookie';
import IsomorphicCookie from "isomorphic-cookie";
import jwt_decode from "jwt-decode";
import { LoginResponse, MyUserInfo } from "lemmy-js-client";
import { BehaviorSubject } from "rxjs";
import { isHttps } from "../env";
import { i18n } from "../i18next";
import { isAuthPath, isBrowser, toast } from "../utils";

interface Claims {
  sub: number;
  iss: string;
  iat: number;
}

interface JwtInfo {
  claims: Claims;
  jwt: string;
}

export class UserService {
  private static _instance: UserService;
  public myUserInfo?: MyUserInfo;
  public jwtInfo?: JwtInfo;
  public unreadInboxCountSub: BehaviorSubject<number> =
    new BehaviorSubject<number>(0);
  public unreadReportCountSub: BehaviorSubject<number> =
    new BehaviorSubject<number>(0);
  public unreadApplicationCountSub: BehaviorSubject<number> =
    new BehaviorSubject<number>(0);

  private constructor() {
    this.setJwtInfo();
  }

  public login(res: LoginResponse) {
    const expires = new Date();
    expires.setDate(expires.getDate() + 365);
    if (res.jwt) {
      toast(i18n.t("logged_in"));
      IsomorphicCookie.save("jwt", res.jwt, { expires, secure: isHttps() });
      this.setJwtInfo();
    }
  }

  public logout() {
    this.jwtInfo = undefined;
    this.myUserInfo = undefined;
    IsomorphicCookie.remove("jwt"); // TODO is sometimes unreliable for some reason
    document.cookie = "jwt=; Max-Age=0; path=/; domain=" + location.hostname;
    if (isAuthPath(location.pathname)) {
      location.replace("/");
    } else {
      location.reload();
    }
  }

  public auth(throwErr = true): string | undefined {
    const jwt = this.jwtInfo?.jwt;
    if (jwt) {
      return jwt;
    } else {
      const msg = "No JWT cookie found";
      if (throwErr && isBrowser()) {
        console.error(msg);
        toast(i18n.t("not_logged_in"), "danger");
      }
      return undefined;
      // throw msg;
    }
  }

  private setJwtInfo() {
    const jwt: string | undefined = IsomorphicCookie.load("jwt");

    if (jwt) {
      this.jwtInfo = { jwt, claims: jwt_decode(jwt) };
    }
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
}
