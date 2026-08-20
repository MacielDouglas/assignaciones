import { redirect } from "next/navigation";

export default function PeopleRedirectPage() {
  redirect("/dashboard/membros?tab=pessoas");
}
