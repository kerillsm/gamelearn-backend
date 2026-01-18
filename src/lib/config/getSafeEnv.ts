export const getSafeEnv = (key: string): string => {
  const result = process.env[key];

  if (result != null) {
    return result;
  } else {
    throw new Error(`Env variable "${key}" is required`);
  }
};
