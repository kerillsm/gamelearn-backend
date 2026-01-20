import { Upload } from "@aws-sdk/lib-storage";
import { s3Client } from "./s3Instance";
import { FileUploadDTO } from "./types";
import { randomUUID } from "crypto";
import { appConfig } from "../../../config/appConfig";

export class StorageService {
  static async uploadFile(file: FileUploadDTO): Promise<{ fileUrl: string }> {
    const fileKey = `${appConfig.s3.folderName}/${randomUUID()}`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: appConfig.s3.bucketName,
        Key: fileKey,
        Body: file.buffer,
        ACL: "public-read",
        ContentType: file.type,
      },
    });

    await upload.done();

    return {
      fileUrl: `${appConfig.s3.cdnUrl}/${fileKey}`,
    };
  }
}
