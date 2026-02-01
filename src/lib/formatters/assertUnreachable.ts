import { HttpError } from "./httpError";

export const assertUnreachable = (x: never): never => {
  throw new HttpError(500, `Unexpected object: ${x}`);
};
