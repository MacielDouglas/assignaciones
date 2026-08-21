import { redirect } from "next/navigation";

export default function MeetingsRedirectPage() {
  redirect("/dashboard/designacoes?tab=reunioes");
}
