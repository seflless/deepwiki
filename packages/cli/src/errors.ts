export class DeepWikiError extends Error {
  constructor(
    message: string,
    public exitCode: number = 1,
  ) {
    super(message);
    this.name = "DeepWikiError";
  }
}

export class UsageError extends DeepWikiError {
  constructor(message: string) {
    super(message, 2);
    this.name = "UsageError";
  }
}

export class ServerError extends DeepWikiError {
  constructor(message: string) {
    super(message, 1);
    this.name = "ServerError";
  }
}
