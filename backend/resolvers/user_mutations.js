const hashing = require("../services/hashing.js");
const jwt = require("../services/jwt.js");
import { AuthenticationError, UserInputError } from "apollo-server";

function isPasswordStrong(password) {
  return password.length >= 8;
}

export const usersMutationResolver = {
  Mutation: {
    login: async (parent, args, context) => {
      let user = await context.dataSources.db.getUserByEmail(args.email);
      if (!user)
        throw new UserInputError(
          "There is no user registered with this EMail!"
        );
      let isPasswordCorrect = await hashing.compare(
        args.password,
        user.password
      );
      if (!isPasswordCorrect)
        throw new AuthenticationError("Password did not match!");
      return jwt.issueToken(user.id);
    },

    signup: async (parent, args, context) => {
      let emailExists = await context.dataSources.db.emailExists(args.email);
      if (emailExists) throw new UserInputError("Email already exists!");
      if (!isPasswordStrong(args.password))
        throw new UserInputError("Password must be atleast 8 characters!");
      let encryptedPassword = await hashing.hash(args.password);
      let user = context.dataSources.db.addnewUser({
        name: args.name,
        email: args.email,
        password: encryptedPassword,
      });
      return jwt.issueToken(user.id);
    },
  },
};
