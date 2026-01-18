import { User } from "@prisma/client";
import { AuthService } from "../../out/auth.service";
import { UserService } from "../../out/user.service";
import { GetOrCreateUserByAuthProviderDTO } from "./get-or-create-user-by-auth-provider.dto";

export class GetOrCreateUserByAuthProviderService {
  static async execute({
    provider,
    providerAccountId,
    userData,
  }: GetOrCreateUserByAuthProviderDTO): Promise<User> {
    // Search for AuthAccount
    const authAccount = await AuthService.getAuthAccountByProviderAndAccountId(
      provider,
      providerAccountId,
    );

    let user;

    if (authAccount) {
      // AuthAccount exists, return associated user
      user = authAccount.user;
    } else {
      const existingUser = await UserService.getByEmail(userData.email);
      if (existingUser && existingUser.authAccounts.length === 0) {
        // If user with this email exists without AuthAccount, link it (this made for old users created before OAuth integration)
        user = existingUser;
      } else {
        // Create new user
        user = await UserService.createUser({
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          discordUsername: userData.discordUsername,
        });
      }
      // Create AuthAccount for the user
      await AuthService.createAuthAccount(user.id, provider, providerAccountId);
    }

    return user;
  }
}
