export class OrgError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "OrgError";
  }
}

export const AUTH_MESSAGE = "Você precisa entrar na sua conta";
