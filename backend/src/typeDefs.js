import { gql } from "apollo-server";

//TODO @Here move Query to schemas and delete query_all and see if it's autogenerated
//correctly. Prequisitions: need data in DB
const typeDefs = gql`
  type Query {
    posts: [Post]
    users: [User]
  }

  type Mutation {
    write(post: PostInput!): Post
    upvote(id: ID!): Post
    # 🚀 OPTIONAL
    # downvote(id: ID!): Post
    # 🚀 OPTIONAL
    # delete(id: ID!): Post

    """
    returns a signed JWT or null
    """
    login(email: String!, password: String!): String

    """
    returns a signed JWT or null
    """
    signup(name: String!, email: String!, password: String!): String
  }
  extend type Post {
    votes: Int
  }
  input PostInput {
    title: String!
  }
`;

export default typeDefs;
