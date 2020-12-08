export const postsMutationResolver = {
  Mutation: {
    write: async (parent, _args, context) => {
      let user = await context.dataSources.db.getUserById(context.id);
      return await context.dataSources.db.addNewPost({
        ..._args.post,
        author: user,
      });
    },
    upvote: async (parent, _args, context) => {
      let user = await context.dataSources.db.getUserById(context.id);
      return context.dataSources.db.upvote(_args.id, user);
    },
  },
};