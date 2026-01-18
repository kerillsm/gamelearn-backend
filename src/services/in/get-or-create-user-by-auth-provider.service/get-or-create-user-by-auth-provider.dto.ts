export interface GetOrCreateUserByAuthProviderDTO {
  provider: string;
  providerAccountId: string;
  userData: {
    email: string;
    name: string;
    picture?: string;
    discordUsername?: string;
  };
}
