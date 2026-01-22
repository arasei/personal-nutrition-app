//回答保存用のServer Action

//全体の流れ：
// URLからorderを取得→DBに回答を保存→次の導線へリダイレクト
"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

//診断開始アクション
//Prismaで診断テーブルに新規レコードを作成し、診断step1(/diagnosis/step/1)へリダイレクト
export async function startDiagnosis() {
  const dummyProfileId = "dummy-profile-id"; 
  //診断レコードを作成
  const diagnosis = await prisma.diagnosis.create({
    //初期値を設定(現段階では最小の4項目のみ。後で必要に応じて追加予定)
    data: {
      status: "in_progress",
      current_step: 1,
      started_at: new Date(),
      profile_id: dummyProfileId,//今は仮。後で認証機能を実装したら本物のprofile_idに置き換える
    },
    select: { id: true },
  });
  //診断step1へdiagnosisIdを使用し、redirectする設計に変更
  //診断IDをクエリパラメータで渡す
  redirect(`/diagnosis/step/1?diagnosisId=${diagnosis.id}`);

}