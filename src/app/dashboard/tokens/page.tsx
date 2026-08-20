import { redirect } from "next/navigation";

export default function TokensRedirectPage() {
  redirect("/dashboard/membros?tab=tokens");
}
