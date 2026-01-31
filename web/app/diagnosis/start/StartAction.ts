//診断レコード作成してstep1へリダイレクトするServer Action

//全体の流れ：
//診断開始ボタン押下→Server Actionで診断レコード作成→診断step1へリダイレクト

"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

//診断開始アクション
//Prismaで診断テーブルに新規レコードを作成し、診断step1(/diagnosis/step/1)へリダイレクト
export async function startDiagnosis() {
  //診断レコードを作成
  const diagnosis = await prisma.diagnosis.create({
    //初期値を設定(現段階では最小の4項目のみ。後で必要に応じて追加予定)
    data: {
      status: "in_progress",
      current_step: 1,
      started_at: new Date(),
      //profile_id: null は書かない。今は渡さない設計に変更
    },
    //作成した診断レコードのIDのみ取得(redirectで使用するため)
    select: { id: true },
  });
  //診断step1へdiagnosisIdを使用し、redirectする設計に変更
  //診断IDをクエリパラメータで渡す
  redirect(`/diagnosis/step/1?diagnosisId=${diagnosis.id}`);

}