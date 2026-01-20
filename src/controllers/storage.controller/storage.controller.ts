import fs from "fs";
import { Context } from "koa";
import { HttpError } from "../../lib/formatters/httpError";
import { StorageService } from "../../services/out/storage.service";
import { UserRole } from "@prisma/client";

export class StorageController {
  static async uploadFile(ctx: Context) {
    const user = ctx.state.user;
    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MENTOR) {
      throw new HttpError(403, "Forbidden");
    }

    const file = ctx.request.files?.file;
    if (!file || Array.isArray(file)) {
      throw new HttpError(400, "File is required");
    }

    const buffer = fs.readFileSync(file.filepath);

    const { fileUrl } = await StorageService.uploadFile({
      name: file.originalFilename || "untitled",
      type: file.mimetype || "application/octet-stream",
      buffer,
    });

    ctx.status = 200;
    ctx.body = { fileUrl };
  }
}
