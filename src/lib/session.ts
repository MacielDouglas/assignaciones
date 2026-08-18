import { auth } from "@/lib/auth";
import { isSubUser } from "@/lib/roles";

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  isSubUser: boolean;
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) return null;

  const user = session.user as {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
  };

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    isSubUser: isSubUser(user.email),
  };
}
