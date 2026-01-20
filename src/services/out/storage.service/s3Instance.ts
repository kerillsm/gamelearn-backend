import { S3Client } from "@aws-sdk/client-s3";
import { appConfig } from "../../../config/appConfig";

export const s3Client = new S3Client({
  region: appConfig.s3.region,
  endpoint: appConfig.s3.endpoint,
  forcePathStyle: false,
  credentials: {
    accessKeyId: appConfig.s3.accessKeyId,
    secretAccessKey: appConfig.s3.secretAccessKey,
  },
});
