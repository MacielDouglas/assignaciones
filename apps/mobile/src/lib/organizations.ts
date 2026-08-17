import { apiFetch } from "@/lib/api";

export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";

export const memberRoleLabels: Record<MemberRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export type ContextResponse =
  | {
      isSubUser: true;
      membership: null;
      organizations: {
        id: string;
        name: string;
        createdAt: string;
        memberCount: number;
        personCount: number;
      }[];
    }
  | {
      isSubUser: false;
      membership: null;
      organizations: [];
    }
  | {
      isSubUser: false;
      membership: {
        id: string;
        role: MemberRole;
        organization: { id: string; name: string };
        person: { id: string; name: string } | null;
      };
      organizations: [];
    };

export type Member = {
  id: string;
  organizationId: string;
  role: MemberRole;
  personId: string | null;
  person: { id: string; name: string } | null;
  user: { id: string; name: string | null; email: string | null; image: string | null };
};

export type Person = {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  member: { id: string; user: { id: string; name: string | null; email: string | null } } | null;
};

export function getContext(): Promise<ContextResponse> {
  return apiFetch<ContextResponse>("/api/organizations/context");
}

export function redeemToken(code: string, name?: string) {
  return apiFetch<{ organizationId: string; role: MemberRole }>("/api/organizations/redeem", {
    method: "POST",
    body: JSON.stringify({ code, name }),
  });
}

export function createOrganizationToken() {
  return apiFetch<{ code: string; expiresAt: string }>("/api/organizations/tokens/create-org", {
    method: "POST",
  });
}

export function createInviteToken(organizationId: string) {
  return apiFetch<{ code: string; expiresAt: string }>("/api/organizations/tokens/invite", {
    method: "POST",
    body: JSON.stringify({ organizationId }),
  });
}

export function listMembers(orgId?: string) {
  const query = orgId ? `?orgId=${encodeURIComponent(orgId)}` : "";
  return apiFetch<{ organizationId: string | null; members: Member[] }>(
    `/api/organizations/members${query}`,
  );
}

export function updateMemberRole(memberId: string, role: MemberRole) {
  return apiFetch<{ memberId: string }>("/api/organizations/members", {
    method: "PATCH",
    body: JSON.stringify({ memberId, role }),
  });
}

export function linkPersonToMember(memberId: string, personId: string) {
  return apiFetch<{ memberId: string }>("/api/organizations/members/link", {
    method: "POST",
    body: JSON.stringify({ memberId, personId }),
  });
}

export function unlinkPersonFromMember(memberId: string) {
  return apiFetch<{ memberId: string }>("/api/organizations/members/link", {
    method: "DELETE",
    body: JSON.stringify({ memberId }),
  });
}

export function listPeople(orgId?: string) {
  const query = orgId ? `?orgId=${encodeURIComponent(orgId)}` : "";
  return apiFetch<{ organizationId: string | null; people: Person[] }>(
    `/api/organizations/people${query}`,
  );
}

export function createPerson(input: {
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
}) {
  return apiFetch<{ personId: string }>("/api/organizations/people", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
