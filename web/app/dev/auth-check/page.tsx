import { notFound } from "next/navigation";
import AuthCheckPanel from "./AuthCheckPanel";

export const dynamic = "force-dynamic";

export default function AuthCheckPage() {
  // 匿名認証やAPI確認の操作を、開発サーバーでだけ利用する。
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <AuthCheckPanel />;
}
