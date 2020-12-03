import { jest } from "@jest/globals";
import { createTestClient } from "apollo-server-testing";
import { AuthenticationError } from "apollo-server-errors";
import { gql } from "apollo-server";
import Server from "../server";
import { MemoryDataSource } from "../db";

let mutate = undefined;
let db = undefined;

beforeEach(() => {
  db = new MemoryDataSource();
  const server = new Server({ dataSources: () => ({ db }) });
  let testClient = createTestClient(server);
  mutate = testClient.mutate;
});

describe("mutations", () => {
  describe("WRITE_POST", () => {
    const action = () =>
      mutate({
        mutation: WRITE_POST,
        variables: { post: { title: "Some post", author: { name: "Peter" } } },
      });
    const WRITE_POST = gql`
      mutation($post: PostInput!) {
        write(post: $post) {
          id
          title
          votes
          author {
            name
          }
        }
      }
    `;
    describe("given the user is not authenticated", () => {
      it("throws an error", () => {
        expect(action()).resolves.toMatchObject({
          errors: [new AuthenticationError("No user exists")],
        });
      });
    });
    describe("given the user is authenticated", () => {
      beforeEach(() => {
        //TODO auth
      });
      it("adds a post to db.postsData", async () => {
        expect(db.postsData).toHaveLength(0);
        await action();
        expect(db.postsData).toHaveLength(1);
      });

      it("calls db.addnewPost", async () => {
        db.addnewPost = jest.fn(() => {});
        await action();
        expect(db.addnewPost).toHaveBeenCalledWith({
          title: "Some post",
          author: { name: "Peter" },
        });
      });

      it("responds with created post", async () => {
        await expect(action()).resolves.toMatchObject({
          errors: undefined,
          data: {
            write: {
              title: "Some post",
              id: expect.any(String),
              votes: 0,
              author: { name: "Peter" },
            },
          },
        });
      });
    });
  });

  describe("UPVOTE", () => {
    let id = 500;
    let voterName = "Peter";
    const action = () =>
      mutate({
        mutation: UPVOTE,
        variables: { id: id, voter: { name: voterName } },
      });

    const UPVOTE = gql`
      mutation($id: ID!, $voter: UserInput!) {
        upvote(id: $id, voter: $voter) {
          id
          title
          votes
          author {
            name
          }
        }
      }
    `;

    describe("given the user is not authenticated", () => {
      const action = () =>
        mutate({
          mutation: WRITE_POST,
          variables: {
            post: { title: "test post", author: { name: "testuser1" } },
          },
        });
      const WRITE_POST = gql`
        mutation($post: PostInput!) {
          write(post: $post) {
            id
            title
            votes
            author {
              name
            }
          }
        }
      `;
      it("throws an error with not existing user", async () => {
        await expect(action()).resolves.toMatchObject({
          errors: [new AuthenticationError("No user exists")],
        });
      });
    });

    describe("given the user is authenticated", () => {
      beforeEach(() => {
        //TODO auth
      });
      it("responds with null when the post doesn't exist", async () => {
        await expect(action()).resolves.toMatchObject({
          errors: undefined,
          data: { upvote: null },
        });
      });

      describe("given posts in the database", () => {
        beforeEach(() => {
          db.addnewPost({
            title: "Pinguine sind keine Vögel",
            author: { name: "Peter" },
          });
          id = db.postsData[0].id;
        });
        it("upvotes a post", async () => {
          expect(db.postsData[0].votes).toBe(0);
          await action();
          expect(db.postsData[0].votes).toBe(1);
        });

        it("calls db.upvote", async () => {
          db.upvote = jest.fn(() => {});
          await action();
          expect(db.upvote).toHaveBeenCalledWith(id, { name: voterName });
        });

        it("responds with the upvoted post", async () => {
          await expect(action()).resolves.toMatchObject({
            errors: undefined,
            data: {
              upvote: {
                votes: 1,
                title: "Pinguine sind keine Vögel",
                id: expect.any(String),
                author: { name: "Peter" },
              },
            },
          });
        });

        it("upvoting a post twice by the same user results in 1 vote", async () => {
          expect(db.postsData[0].votes).toBe(0);
          await action();
          await action();
          expect(db.postsData[0].votes).toBe(1);
        });

        it("upvoting a post by two users should result in 2 votes", async () => {
          expect(db.postsData[0].votes).toBe(0);
          await action();
          voterName = "Peter's brother";
          await action();
          expect(db.postsData[0].votes).toBe(2);
        });
      });
    });
  });
});
